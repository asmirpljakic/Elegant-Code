import { Request, Response } from 'express';
import { ClassSession } from '../models/ClassSession';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { createScheduleSchema } from '@elegant-code/shared';
import mongoose from 'mongoose';

// @desc    Dohvati raspored (zavisno od uloge vraća različite podatke)
// @route   GET /api/schedule
// @access  Private
export const getSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Korisnik nije autentifikovan' });
      return;
    }

    let query: any = {};

    // Učenik vidi samo časove gde je on dodat u niz students
    if (user.role === 'UCENIK') {
      query = { 'students.studentId': user._id };
    } 
    // Profesor vidi samo časove koje on drži
    else if (user.role === 'PROFESOR') {
      query = { profesorId: user._id };
    }
    // Admin i SuperAdmin vide sve časove (query ostaje prazan)

    const classes = await ClassSession.find(query)
      .populate('profesorId', 'firstName lastName')
      .populate('students.studentId', 'firstName lastName')
      .sort({ startTime: 1 }); // Sortiranje hronološki (najskoriji prvo)

    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju rasporeda' });
  }
};

// @desc    Zakaži novi čas
// @route   POST /api/schedule
// @access  Private/Admin
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = createScheduleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    let { 
      courseName, profesorId, startTime, endTime, topic, meetingLink, studentIds,
      isRecurring, recurringDays, untilDate 
    } = validation.data;

    // Ako je ulogovani korisnik PROFESOR, forsiramo da on može zakazati čas samo za sebe
    if (req.user?.role === 'PROFESOR') {
      profesorId = req.user._id.toString();
    }

    const profesor = await User.findById(profesorId);
    if (!profesor || (profesor.role !== 'PROFESOR' && profesor.role !== 'SUPER_ADMIN' && profesor.role !== 'ADMIN')) {
      res.status(400).json({ error: 'Nevažeći profesor' });
      return;
    }

    const formattedStudents = studentIds.map((id: string) => ({
      studentId: id,
      attended: false
    }));

    // Funkcija za proveru preklapanja
    const checkOverlap = async (checkStart: Date, checkEnd: Date, profId: string, stIds: string[]) => {
      const overlappingClasses = await ClassSession.find({
        status: 'ZAKAZAN',
        $and: [
          { startTime: { $lt: checkEnd } },
          { endTime: { $gt: checkStart } }
        ],
        $or: [
          { profesorId: profId },
          { 'students.studentId': { $in: stIds } }
        ]
      });
      return overlappingClasses.length > 0;
    };

    // Bazični podaci za kreiranje časa
    const baseClassData = {
      courseName,
      profesorId,
      topic,
      meetingLink,
      students: formattedStudents,
      status: 'ZAKAZAN'
    };

    if (!isRecurring) {
      const isOverlap = await checkOverlap(new Date(startTime), new Date(endTime), profesorId, studentIds);
      if (isOverlap) {
        res.status(400).json({ error: 'Termin se preklapa sa postojećim časom profesora ili učenika.' });
        return;
      }

      const newClass = await ClassSession.create({
        ...baseClassData,
        startTime,
        endTime
      });

      if (studentIds.length > 0) {
        await ActivityLog.create({
          action: 'NOVI_CAS',
          description: `Profesor ${profesor.firstName} ${profesor.lastName} je zakazao novi pojedinačni čas.`
        });
      }

      res.status(201).json(newClass);
      return;
    }

    // Ponavljajući časovi logika
    const classesToCreate = [];
    const start = new Date(startTime); // Odatle kreće ciklus
    
    // Računanje krajnjeg datuma: prosleđen do kada (untilDate) ili automatski 3 meseca unapred
    const limitDate = untilDate ? new Date(untilDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000); // +90 dana
    
    // Generisanje jedinstvenog ID-ja za ovaj ciklus
    const recurringGroupId = new mongoose.Types.ObjectId().toHexString();

    // Počinjemo od datuma/vremena startTime i kreiramo časove u budućnosti
    // Iteriramo kroz dane počevši od start-a dok ne pređemo limitDate
    let currentDate = new Date(start);
    // Postavljamo vreme na 00:00 da bismo tačno dodali sate i minute iz dayConfig-a
    currentDate.setHours(0, 0, 0, 0);

    while (currentDate <= limitDate) {
      if (recurringDays && recurringDays.length > 0) {
        const dayConfig = recurringDays.find(d => d.dayOfWeek === currentDate.getDay());
        
        if (dayConfig) {
          const [startHour, startMinute] = dayConfig.startTime.split(':').map(Number);
          const [endHour, endMinute] = dayConfig.endTime.split(':').map(Number);
          
          const cStart = new Date(currentDate);
          cStart.setHours(startHour, startMinute, 0, 0);
          
          const cEnd = new Date(currentDate);
          cEnd.setHours(endHour, endMinute, 0, 0);
          
          // Za svaki termin proveravamo preklapanje
          const isOverlap = await checkOverlap(cStart, cEnd, profesorId, studentIds);
          
          if (!isOverlap) {
            classesToCreate.push({
              ...baseClassData,
              startTime: cStart,
              endTime: cEnd,
              recurringGroupId
            });
          }
        }
      }
      // Dodaj jedan dan
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (classesToCreate.length === 0) {
      res.status(400).json({ error: 'Svi izabrani termini se preklapaju sa postojećim časovima ili nije izabran nijedan validan dan.' });
      return;
    }

    // Ubacujemo sve izgenerisane časove u bazu
    await ClassSession.insertMany(classesToCreate);

    // Kreiramo aktivnost (samo jedna aktivnost bez obzira na broj časova)
    if (studentIds.length > 0) {
      await ActivityLog.create({
        action: 'NOVI_CAS',
        description: `Profesor ${profesor.firstName} ${profesor.lastName} drži novi ciklus časova (${courseName}).`
      });
    }

    res.status(201).json({ message: `Uspešno kreirano ${classesToCreate.length} ponavljajućih časova.`, classesToCreate });
    
    // Asinhrono kreiranje notifikacija za sve izabrane učenike
    setTimeout(async () => {
      try {
        const notifications = studentIds.map((stId: string) => ({
          userId: stId,
          title: 'Novi Čas Zakazan',
          message: `Zakazan vam je novi ciklus časova: ${courseName}.`,
          type: 'INFO'
        }));
        await Notification.insertMany(notifications);
      } catch (err) {
        console.error('Greška pri kreiranju notifikacija za novi čas:', err);
      }
    }, 0);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri zakazivanju časa' });
  }
};

// @desc    Završi čas i podeli XP poene
// @route   PUT /api/schedule/:id/complete
// @access  Private/Profesor ili Admin
export const completeClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = req.params.id;
    const { presentStudentIds } = req.body; // Niz ID-jeva učenika koji su prisustvovali

    const classSession = await ClassSession.findById(classId);
    
    if (!classSession) {
      res.status(404).json({ error: 'Čas nije pronađen' });
      return;
    }

    // Provera prava pristupa (samo profesor koji drži čas ili admin)
    if (
      req.user?.role !== 'SUPER_ADMIN' && 
      req.user?.role !== 'ADMIN' && 
      classSession.profesorId.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({ error: 'Samo profesor koji drži ovaj čas može da ga završi' });
      return;
    }

    if (classSession.status === 'ZAVRSEN') {
      res.status(400).json({ error: 'Čas je već završen' });
      return;
    }

    // Obeleži prisustvo
    classSession.students.forEach(student => {
      if (presentStudentIds.includes(student.studentId.toString())) {
        student.attended = true;
      }
    });

    classSession.status = 'ZAVRSEN';
    classSession.meetingLink = ''; // Zatvaramo Meet link kada se čas završi
    await classSession.save();

    // Dodeli XP poene i statistiku učenicima
    for (const studentId of presentStudentIds) {
      const student = await User.findById(studentId);
      if (student) {
        // Ako učenik nema progress objekat inicijalizovan
        if (!student.progress) {
          student.progress = { currentLevel: 1, totalClassesAttended: 0, xp: 0 };
        }
        
        const oldLevel = student.progress.currentLevel;
        student.progress.xp += 100; // 100 XP po času
        student.progress.totalClassesAttended += 1;
        
        // Jednostavna logika za Levelovanje (1 level = 500 XP)
        student.progress.currentLevel = Math.floor(student.progress.xp / 500) + 1;
        
        // Mongoose ne prepoznaje automatski ugnježđene promene nekad
        student.markModified('progress');
        
        await student.save();

        // Notifikacija za završen čas i XP
        const leveledUp = student.progress.currentLevel > oldLevel;
        await Notification.create({
          userId: student._id,
          title: leveledUp ? 'Novi Nivo Osvojen! 🎉' : 'Čas Završen',
          message: leveledUp 
            ? `Čestitamo! Osvojili ste 100 XP i prešli na Nivo ${student.progress.currentLevel}!` 
            : `Uspešno ste završili čas i osvojili 100 XP.`,
          type: 'SUCCESS'
        });
      }
    }

    res.json({ message: 'Čas je uspešno završen', classSession });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri završetku časa' });
  }
};

// Pomoćna funkcija za oduzimanje XP-a kada se obriše završen čas
const rollbackStudentProgress = async (classSession: any) => {
  if (classSession.status !== 'ZAVRSEN') return;
  
  for (const studentData of classSession.students) {
    if (studentData.attended) {
      const student = await User.findById(studentData.studentId);
      if (student && student.progress) {
        student.progress.xp = Math.max(0, student.progress.xp - 100);
        student.progress.totalClassesAttended = Math.max(0, student.progress.totalClassesAttended - 1);
        student.progress.currentLevel = Math.floor(student.progress.xp / 500) + 1;
        student.markModified('progress');
        await student.save();
      }
    }
  }
};

// @desc    Otkaži čas i dodaj nadoknadu učenicima
// @route   PUT /api/schedule/:id/cancel
// @access  Private/Profesor ili Admin
export const cancelClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const classId = req.params.id;
    const { reason } = req.body || {};
    const classSession = await ClassSession.findById(classId);
    
    if (!classSession) {
      res.status(404).json({ error: 'Čas nije pronađen' });
      return;
    }

    if (
      req.user?.role !== 'SUPER_ADMIN' && 
      req.user?.role !== 'ADMIN' && 
      classSession.profesorId.toString() !== req.user?._id.toString()
    ) {
      res.status(403).json({ error: 'Samo profesor koji drži ovaj čas može da ga otkaže' });
      return;
    }

    if (classSession.status === 'ZAVRSEN') {
      res.status(400).json({ error: 'Ne možete otkazati čas koji je već završen.' });
      return;
    }
    
    if (classSession.status === 'OTKAZAN') {
      res.status(400).json({ error: 'Čas je već otkazan.' });
      return;
    }

    classSession.status = 'OTKAZAN';
    classSession.meetingLink = ''; 
    await classSession.save();

    // Dodaj 1 čas za nadoknadu svakom učeniku iz ovog časa
    for (const studentData of classSession.students) {
      const student = await User.findById(studentData.studentId);
      if (student) {
        if (!student.progress) {
          student.progress = { currentLevel: 1, totalClassesAttended: 0, xp: 0, makeupClassesOwed: 0 };
        }
        student.progress.makeupClassesOwed = (student.progress.makeupClassesOwed || 0) + 1;
        student.markModified('progress');
        await student.save();

        let messageText = `Vaš čas (${classSession.courseName} nivo) je otkazan. Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu, o čemu ćete biti obavešteni novom notifikacijom.`;
        if (reason && reason.trim() !== '') {
          messageText = `Vaš čas (${classSession.courseName} nivo) je otkazan. ${reason.trim()} Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu.`;
        }

        // Notifikacija za učenika
        await Notification.create({
          userId: student._id,
          title: 'Čas je Otkazan ❌',
          message: messageText,
          type: 'WARNING'
        });
      }
    }

    res.json({ message: 'Čas je uspešno otkazan, nadoknada je dodata učenicima.', classSession });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri otkazivanju časa' });
  }
};

// @desc    Obriši čas (ili ceo ciklus)
// @route   DELETE /api/schedule/:id
// @access  Private/Admin
export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deleteAll = req.query.all === 'true';

    const classSession = await ClassSession.findById(id);
    if (!classSession) {
      res.status(404).json({ error: 'Čas nije pronađen' });
      return;
    }

    if (
      req.user?.role === 'PROFESOR' && 
      (!classSession.profesorId || classSession.profesorId.toString() !== req.user._id.toString())
    ) {
      res.status(403).json({ error: 'Možete obrisati samo svoje časove.' });
      return;
    }

    if (req.user?.role === 'PROFESOR' && classSession.status === 'OTKAZAN') {
      res.status(403).json({ error: 'Samo Admin i Super Admin mogu trajno brisati otkazane časove.' });
      return;
    }

    if (deleteAll && classSession.recurringGroupId) {
      // Brišemo samo predstojeće i trenutne časove iz ciklusa (status: ZAKAZAN),
      // ne diramo ZAVRSENE kako ne bi izgubili istoriju i XP
      await ClassSession.deleteMany({
        recurringGroupId: classSession.recurringGroupId,
        status: 'ZAKAZAN',
        startTime: { $gte: classSession.startTime }
      });
      res.json({ message: 'Ceo predstojeći ciklus je obrisan' });
      
      // Notifikacija
      if (classSession.students && classSession.students.length > 0) {
        setTimeout(async () => {
          try {
            const notifications = classSession.students.map((st: any) => ({
              userId: st.studentId,
              title: 'Ciklus Časova Otkazan',
              message: `Otkazan je vaš predstojeći ciklus časova (${classSession.courseName} nivo). Bez brige, ukoliko imate pravo na nadoknadu, profesor će uskoro zakazati nove termine, o čemu ćete biti obavešteni novom notifikacijom!`,
              type: 'WARNING'
            }));
            await Notification.insertMany(notifications);
          } catch (err) {
            console.error('Notification error:', err);
          }
        }, 0);
      }

    } else {
      await rollbackStudentProgress(classSession);
      await ClassSession.findByIdAndDelete(id);
      res.json({ message: 'Čas je uspešno obrisan' });

      // Notifikacija
      if (classSession.status === 'ZAKAZAN' && classSession.students && classSession.students.length > 0) {
        setTimeout(async () => {
          try {
            const notifications = classSession.students.map((st: any) => ({
              userId: st.studentId,
              title: 'Čas Otkazan',
              message: `Vaš zakazani čas (${classSession.courseName} nivo) je otkazan. Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu, o čemu ćete biti obavešteni novom notifikacijom.`,
              type: 'WARNING'
            }));
            await Notification.insertMany(notifications);
          } catch (err) {
            console.error('Notification error:', err);
          }
        }, 0);
      }
    }
  } catch (error: any) {
    console.error('API Error in deleteClass:', error);
    res.status(500).json({ error: 'Greška pri brisanju časa', details: error?.message });
  }
};

// @desc    Obriši sve završene časove
// @route   DELETE /api/schedule/completed
// @access  Private/Admin
export const deleteCompletedClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const query: any = { status: 'ZAVRSEN' };
    
    // Profesor može masovno brisati samo svoje završene časove
    if (req.user?.role === 'PROFESOR') {
      query.profesorId = req.user._id;
    }

    const completedClasses = await ClassSession.find(query);
    
    // Oduzmi XP i broj časova učenicima pre brisanja iz baze
    for (const cls of completedClasses) {
      await rollbackStudentProgress(cls);
    }

    const result = await ClassSession.deleteMany(query);
    res.json({ message: `Uspešno obrisano ${result.deletedCount} završenih časova` });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri brisanju završenih časova' });
  }
};

// @desc    Izmeni detalje časa
// @route   PUT /api/schedule/:id
// @access  Private/Admin
export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { topic, meetingLink, startTime, endTime } = req.body;
    const updateAll = req.query.all === 'true';

    const classSession = await ClassSession.findById(id);
    if (!classSession) {
      res.status(404).json({ error: 'Čas nije pronađen' });
      return;
    }

    if (
      req.user?.role === 'PROFESOR' && 
      classSession.profesorId.toString() !== req.user._id.toString()
    ) {
      res.status(403).json({ error: 'Možete izmeniti samo svoje časove.' });
      return;
    }

    if (updateAll && classSession.recurringGroupId) {
      // Ažuriramo temu i link za ceo predstojeći ciklus
      await ClassSession.updateMany(
        {
          recurringGroupId: classSession.recurringGroupId,
          status: 'ZAKAZAN',
          startTime: { $gte: classSession.startTime }
        },
        { $set: { topic, meetingLink } } // Vreme obično nije dobro menjati masovno bez kalkulacije
      );
      res.json({ message: 'Detalji celog predstojećeg ciklusa su ažurirani' });
    } else {
      // Ažuriranje samo ovog časa
      const updatedClass = await ClassSession.findByIdAndUpdate(
        id,
        { topic, meetingLink, startTime, endTime },
        { new: true }
      );
      res.json(updatedClass);
    }

    // Provera za Notifikaciju o dodavanju Google Meet linka
    if (meetingLink && meetingLink.trim() !== '' && meetingLink !== classSession.meetingLink) {
      setTimeout(async () => {
        try {
          const notifications = classSession.students.map((st: any) => ({
            userId: st.studentId,
            title: 'Spreman Link za Čas 📹',
            message: `Profesor je upravo dodao Google Meet link. Tvoj čas (${classSession.courseName} nivo) uskoro počinje!`,
            type: 'INFO'
          }));
          await Notification.insertMany(notifications);
        } catch (err) {
          console.error('Greška pri slanju notifikacije za meet link:', err);
        }
      }, 0);
    }
  } catch (error) {
    res.status(500).json({ error: 'Greška pri izmeni časa' });
  }
};
