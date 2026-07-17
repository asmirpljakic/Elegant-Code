import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User';
import { ClassSession } from '../models/ClassSession';
import { ActivityLog } from '../models/ActivityLog';
import { updateUserSchema, createUserSchema } from '@elegant-code/shared';
import { sendEmail } from '../utils/email';
import { getIO } from '../socket';

// @desc    Dohvati profil trenutnog korisnika (sa uvek svežim XP-om)
// @route   GET /api/users/me
// @access  Private
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'Korisnik nije pronađen' });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju profila' });
  }
};

// @desc    Dohvati sve korisnike sa paginacijom i filterima
// @route   GET /api/users
// @access  Private/Admin ili Profesor
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const activePackage = req.query.activePackage as string;

    let query: any = {};

    // Ako je korisnik PROFESOR, sme da vidi samo učenike koje uči
    if (req.user?.role === 'PROFESOR') {
      const professorClasses = await ClassSession.find({ profesorId: req.user._id });
      const studentIds = new Set<string>();
      
      // Svi učenici iz časova
      professorClasses.forEach(cls => {
        cls.students.forEach(st => {
          studentIds.add(st.studentId.toString());
        });
      });

      // PLUS svi učenici koje je profesor lično kreirao
      const createdUsers = await User.find({ createdBy: req.user._id }).select('_id');
      createdUsers.forEach(u => studentIds.add(u._id.toString()));

      query._id = { $in: Array.from(studentIds) };
      // Opciono: Profesor vidi samo ulogu UCENIK
      query.role = { $in: ['UCENIK', 'KLIJENT'] };
    }

    // 1. Pretraga po imenu ili emailu (Case Insensitive)
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // 2. Filter po ulozi
    if (role && role !== 'ALL') {
      // Ako je profesor on vec ima override
      if (req.user?.role !== 'PROFESOR') {
        query.role = role;
      }
    }

    // 3. Filter po paketu
    if (activePackage && activePackage !== 'ALL') {
      query.activePackage = activePackage;
    }

    const startIndex = (page - 1) * limit;
    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.json({
      users,
      pagination: {
        page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri povlačenju korisnika' });
  }
};

// @desc    Kreiraj novog korisnika
// @route   POST /api/users
// @access  Private/SuperAdmin, Admin, Profesor
export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const { firstName, lastName, email, password, phoneNumber, role, activePackage } = validation.data;
    const currentUser = req.user;

    // --- BEZBEDNOSNE PROVERE ---
    // 1. Ako je ulogovan PROFESOR, mora kreirati UČENIKA
    if (currentUser?.role === 'PROFESOR') {
      if (role && role !== 'UCENIK') {
        res.status(403).json({ error: 'Profesori mogu kreirati isključivo učenike.' });
        return;
      }
    }

    // 2. Ako je ADMIN, ne sme kreirati SUPER_ADMIN ili drugog ADMINA
    if (currentUser?.role === 'ADMIN') {
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        res.status(403).json({ error: 'Samo Super Admin može kreirati administratore.' });
        return;
      }
    }

    // Provera da li već postoji email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      res.status(400).json({ error: 'Korisnik sa ovim emailom već postoji.' });
      return;
    }

    // Provera da li već postoji broj telefona
    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        res.status(400).json({ error: 'Korisnik sa ovim brojem telefona već postoji.' });
        return;
      }
    }

    // Hesiranje lozinke
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kreiranje
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      // Ako profesor nije prosledio role, po default-u je UCENIK (definisano u shemi)
      role: role || 'UCENIK',
      activePackage: activePackage || 'NONE',
      createdBy: currentUser?._id
    });

    if (user.role === 'UCENIK' || user.role === 'KLIJENT') {
      await ActivityLog.create({
        action: 'NOVI_UCENIK',
        description: `Novi učenik ${firstName} ${lastName} je dodat u sistem od strane administratora.`
      });
    }

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.status(201).json({
      _id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      activePackage: user.activePackage,
      createdAt: (user as any).createdAt
    });

  } catch (error) {
    res.status(500).json({ error: 'Greška pri kreiranju korisnika' });
  }
};

// @desc    Ažuriraj korisnika
// @route   PUT /api/users/:id
// @access  Private/SuperAdmin, Admin, Profesor
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = updateUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const userToEdit = await User.findById(req.params.id);

    if (!userToEdit) {
      res.status(404).json({ error: 'Korisnik nije pronađen' });
      return;
    }

    const currentUser = req.user;

    // --- PROVERE BEZBEDNOSTI ---
    // 1. Samo SUPER_ADMIN može menjati drugog admina/super_admina
    if ((userToEdit.role === 'ADMIN' || userToEdit.role === 'SUPER_ADMIN') && currentUser?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Nemate prava da menjate naloge administratora.' });
      return;
    }

    // 2. Samo SUPER_ADMIN može nekome dodeliti ADMIN/SUPER_ADMIN ulogu
    if (validation.data.role && (validation.data.role === 'ADMIN' || validation.data.role === 'SUPER_ADMIN') && currentUser?.role !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Samo Super Admin može dodeliti administratorska prava.' });
      return;
    }

    // 3. Profesor ne sme da menja ulogu ili paket
    if (currentUser?.role === 'PROFESOR') {
      if (validation.data.role || validation.data.activePackage) {
        res.status(403).json({ error: 'Profesori ne mogu menjati ulogu ili aktivan paket korisnika.' });
        return;
      }
      
      // Profesor sme menjati samo učenike koje predaje ILI koje je on kreirao
      const teachesStudent = await ClassSession.exists({
        profesorId: currentUser._id,
        'students.studentId': userToEdit._id
      });
      
      const createdStudent = userToEdit.createdBy?.toString() === currentUser._id.toString();

      if (!teachesStudent && !createdStudent) {
        res.status(403).json({ error: 'Možete menjati samo učenike kojima trenutno predajete ili koje ste vi lično kreirali.' });
        return;
      }
    }

    // --- AŽURIRANJE PODATAKA ---
    if (validation.data.firstName) userToEdit.firstName = validation.data.firstName;
    if (validation.data.lastName) userToEdit.lastName = validation.data.lastName;
    
    if (validation.data.email && validation.data.email !== userToEdit.email) {
      const emailExists = await User.findOne({ email: validation.data.email });
      if (emailExists) {
        res.status(400).json({ error: 'Ovaj email je već u upotrebi od strane drugog korisnika.' });
        return;
      }
      userToEdit.email = validation.data.email;
    }

    if (validation.data.phoneNumber && validation.data.phoneNumber !== userToEdit.phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber: validation.data.phoneNumber });
      if (phoneExists) {
        res.status(400).json({ error: 'Ovaj broj telefona je već u upotrebi.' });
        return;
      }
      userToEdit.phoneNumber = validation.data.phoneNumber;
    }
    
    // Ako prosleđujemo novu ulogu (i imamo prava za to)
    if (validation.data.role) {
      userToEdit.role = validation.data.role;
    }
    
    // Ako prosleđujemo novi paket (i imamo prava za to)
    if (validation.data.activePackage) {
      userToEdit.activePackage = validation.data.activePackage;
    }

    // Ažuriranje broja časova za nadoknadu
    if (validation.data.makeupClassesOwed !== undefined) {
      userToEdit.progress = {
        ...userToEdit.progress,
        makeupClassesOwed: validation.data.makeupClassesOwed
      } as any;
    }

    // Ažuriranje lozinke
    if (validation.data.password) {
      const salt = await bcrypt.genSalt(10);
      userToEdit.password = await bcrypt.hash(validation.data.password, salt);
    }

    const updatedUser = await userToEdit.save();

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      activePackage: updatedUser.activePackage
    });

  } catch (error) {
    res.status(500).json({ error: 'Greška pri ažuriranju korisnika' });
  }
};

// @desc    Obriši korisnika
// @route   DELETE /api/users/:id
// @access  Private/Admin ili Profesor
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      res.status(404).json({ error: 'Korisnik nije pronađen' });
      return;
    }

    if (currentUser?.role === 'PROFESOR') {
      // Profesor može brisati samo svoje učenike (pretraga u ClassSession)
      const isStudentInProfessorClasses = await ClassSession.exists({
        profesorId: currentUser._id,
        'students.studentId': userToDelete._id
      });

      if (!isStudentInProfessorClasses) {
        res.status(403).json({ error: 'Nemate pravo da obrišete ovog učenika jer ne prisustvuje vašim časovima.' });
        return;
      }
      
      // Profesor ne sme da briše druge profesore, admine ili super admine (za svaki slučaj)
      if (userToDelete.role !== 'UCENIK' && userToDelete.role !== 'KLIJENT') {
        res.status(403).json({ error: 'Profesori mogu brisati samo učenike.' });
        return;
      }
    } else if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Nemate prava za brisanje.' });
      return;
    }

    // Sigurnost: Ne dozvoli brisanje Super Admina
    if (userToDelete.role === 'SUPER_ADMIN' && currentUser?.email !== userToDelete.email) {
      res.status(403).json({ error: 'Ne možete obrisati glavnog Super Admina.' });
      return;
    }

    // Ukloni korisnika iz svih ClassSessions gde se nalazio
    await ClassSession.updateMany(
      { 'students.studentId': userToDelete._id },
      { $pull: { students: { studentId: userToDelete._id } } }
    );

    await User.findByIdAndDelete(id);

    await ActivityLog.create({
      action: 'KORISNIK_OBRISAN',
      description: `${currentUser?.role} ${currentUser?.firstName} je obrisao nalog: ${userToDelete.firstName} ${userToDelete.lastName}.`
    });

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.json({ message: 'Korisnik je uspešno obrisan.' });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri brisanju korisnika.' });
  }
};

// @desc    Aktiviraj/Deaktiviraj korisnika
// @route   PATCH /api/users/:id/status
// @access  Private/Admin
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Samo administratori mogu menjati status naloga.' });
      return;
    }

    const userToToggle = await User.findById(id);
    if (!userToToggle) {
      res.status(404).json({ error: 'Korisnik nije pronađen' });
      return;
    }

    // Sigurnost: Ne dozvoli deaktivaciju Super Admina
    if (userToToggle.role === 'SUPER_ADMIN' && currentUser?.email !== userToToggle.email) {
      res.status(403).json({ error: 'Ne možete deaktivirati glavnog Super Admina.' });
      return;
    }

    userToToggle.isActive = !userToToggle.isActive;
    await userToToggle.save();

    // Slanje emaila o deaktivaciji
    if (!userToToggle.isActive) {
      await sendEmail({
        email: userToToggle.email,
        subject: 'Obaveštenje: Vaš nalog je deaktiviran',
        message: `Poštovani/a ${userToToggle.firstName},\n\nVaš nalog na platformi Elegant Code je deaktiviran od strane administracije.\n\nUkoliko smatrate da je došlo do greške, molimo kontaktirajte nas.\n\nSrdačan pozdrav,\nTim Elegant Code`
      });
    }

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.json({ 
      message: `Nalog je uspešno ${userToToggle.isActive ? 'aktiviran' : 'deaktiviran'}.`,
      isActive: userToToggle.isActive 
    });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri izmeni statusa korisnika.' });
  }
};

// @desc    Dohvati samo javne podatke o profesorima (za zakazivanje probnog časa)
// @route   GET /api/users/professors/public
// @access  Private (Svi ulogovani korisnici)
export const getPublicProfessors = async (req: Request, res: Response): Promise<void> => {
  try {
    const professors = await User.find({ role: 'PROFESOR', isActive: true })
      .select('_id firstName lastName email');
    
    res.json(professors);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju profesora.' });
  }
};

// @desc    Manuelno verifikuj korisnika (Super Admin i Admin)
// @route   PATCH /api/users/:id/verify
// @access  Private/Admin
export const verifyUserManually = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Samo administratori mogu verifikovati naloge.' });
      return;
    }

    const userToVerify = await User.findById(id);
    if (!userToVerify) {
      res.status(404).json({ error: 'Korisnik nije pronađen' });
      return;
    }

    if (userToVerify.isVerified) {
      res.status(400).json({ error: 'Korisnik je već verifikovan.' });
      return;
    }

    userToVerify.isVerified = true;
    userToVerify.role = 'UCENIK';
    userToVerify.otpCode = undefined;
    userToVerify.otpExpiresAt = undefined;
    
    await userToVerify.save();

    await ActivityLog.create({
      action: 'EMAIL_VERIFIKACIJA',
      description: `Administrator ${currentUser?.firstName} ${currentUser?.lastName} je manuelno verifikovao nalog: ${userToVerify.firstName} ${userToVerify.lastName}.`
    });

    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    res.json({ message: 'Korisnik je uspešno verifikovan.' });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri manuelnoj verifikaciji korisnika.' });
  }
};
