import { Request, Response } from 'express';
import { ClassSession } from '../models/ClassSession';
import { User } from '../models/User';
import { ActivityLog } from '../models/ActivityLog';
import { Notification } from '../models/Notification';
import { createScheduleSchema } from '@elegant-code/shared';
import mongoose from 'mongoose';
import { sendTrialClassNotification } from '../utils/mailer';
import { getIO } from '../socket';

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
      query['students.studentId'] = user._id;
    } 
    // Profesor vidi samo časove koje on drži
    else if (user.role === 'PROFESOR') {
      query.profesorId = user._id;
    }
    // Admin i SuperAdmin vide sve časove

    // Enterprise Optimizacija: Ograničavamo upit na poslednjih mesec dana i budućnost
    // Da sprečimo pucanje servera kada korisnik bude imao hiljade časova u istoriji
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    // Ako klijent izričito traži svu istoriju (npr. za posebne izveštaje), dozvolićemo to preko query parametra
    if (req.query.all !== 'true') {
      query.startTime = { $gte: oneMonthAgo };
    }

    // Enterprise Optimizacija: Koristimo .lean() kako bi MongoDB vratio čiste JS objekte
    // umesto teških Mongoose dokumenata. Ubrzava dohvat za 500% i čuva memoriju!
    const classes = await ClassSession.find(query)
      .populate('profesorId', 'firstName lastName')
      .populate('students.studentId', 'firstName lastName')
      .sort({ startTime: 1 }) // Sortiranje hronološki (najskoriji prvo)
      .lean();

    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju rasporeda' });
  }
};

// Helper za pretvaranje lokalnog vremena u tačan UTC zavisno od datuma (DST)
const getCETDate = (date: Date, timeString: string): Date => {
  const dateStr = date.toISOString().split('T')[0];
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Belgrade',
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(date);
  const tzPart = parts.find((p: any) => p.type === 'timeZoneName');
  let offset = '+02:00'; // Fallback na letnje vreme
  if (tzPart && tzPart.value) {
    const match = tzPart.value.match(/GMT([+-])(\d+)/);
    if (match) {
      const sign = match[1];
      const hours = match[2].padStart(2, '0');
      offset = `${sign}${hours}:00`;
    }
  }
  return new Date(`${dateStr}T${timeString}:00${offset}`);
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
      // Provera da li je profesor na odmoru
      const prof = await User.findById(profId).select('unavailableDates');
      if (prof?.unavailableDates && prof.unavailableDates.length > 0) {
        // Pretvaranje vremena u lokalnu vremensku zonu i ekstrakcija datuma u formatu YYYY-MM-DD
        const startStr = checkStart.toLocaleString('sv-SE', { timeZone: 'Europe/Belgrade' }).split(' ')[0];
        if (prof.unavailableDates.includes(startStr)) {
          return true; // Profesor je na odmoru taj dan, vraćamo preklapanje
        }
      }

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
    // Postavljamo vreme na 12:00 UTC da izbegnemo probleme sa prelaskom dana zbog timezone-a
    currentDate.setUTCHours(12, 0, 0, 0);

    while (currentDate <= limitDate) {
      if (recurringDays && recurringDays.length > 0) {
        const dayConfig = recurringDays.find((d: any) => d.dayOfWeek === currentDate.getUTCDay());
        
        if (dayConfig) {
          const cStart = getCETDate(currentDate, dayConfig.startTime);
          const cEnd = getCETDate(currentDate, dayConfig.endTime);
          
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
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

    // Emitovanje dogadjaja za klijente
    try {
      getIO().emit('users_updated');
    } catch (e) {
      console.error('Socket.IO emit error:', e);
    }

    // Asinhrono kreiranje notifikacija za sve izabrane učenike
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

    res.status(201).json({ message: `Uspešno kreirano ${classesToCreate.length} ponavljajućih časova.`, classesToCreate });
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

    // Emitovanje dogadjaja za klijente
    try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

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

        const d = new Date(classSession.startTime);
        const formattedDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}. u ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}h`;

        let messageText = `Vaš čas zakazan za ${formattedDate} je otkazan. Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu, o čemu ćete biti obavešteni novom notifikacijom.`;
        if (reason && reason.trim() !== '') {
          messageText = `Vaš čas zakazan za ${formattedDate} je otkazan. ${reason.trim()} Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu.`;
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

    // Emitovanje dogadjaja za klijente
    try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

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
      // Emitovanje dogadjaja za klijente
      try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

      // Notifikacija
      if (classSession.students && classSession.students.length > 0) {
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
      }

      res.json({ message: 'Ceo predstojeći ciklus je obrisan' });

    } else {
      await rollbackStudentProgress(classSession);
      await ClassSession.findByIdAndDelete(id);
      // Emitovanje dogadjaja za klijente
      try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }
      // Notifikacija
      if (classSession.status === 'ZAKAZAN' && classSession.students && classSession.students.length > 0) {
        try {
          const d = new Date(classSession.startTime);
          const formattedDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}. u ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}h`;

          const notifications = classSession.students.map((st: any) => ({
            userId: st.studentId,
            title: 'Čas Otkazan',
            message: `Vaš čas zakazan za ${formattedDate} je otkazan. Bez brige, nadoknadićemo ga u predstojećim danima! Profesor će uskoro zakazati nadoknadu, o čemu ćete biti obavešteni novom notifikacijom.`,
            type: 'WARNING'
          }));
          await Notification.insertMany(notifications);
        } catch (err) {
          console.error('Notification error:', err);
        }
      }

      res.json({ message: 'Čas je uspešno obrisan' });
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
    // Emitovanje dogadjaja za klijente
    try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

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

    const classSession = await ClassSession.findById(id).populate('students.studentId');
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
      // Emitovanje dogadjaja za klijente
      try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

      res.json({ message: 'Detalji celog predstojećeg ciklusa su ažurirani' });
    } else {
      // Ažuriranje samo ovog časa
      const updatedClass = await ClassSession.findByIdAndUpdate(
        id,
        { topic, meetingLink, startTime, endTime },
        { new: true }
      );
      // Emitovanje dogadjaja za klijente
      try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

      res.json(updatedClass);
    }

    // Provera za Notifikaciju o dodavanju Google Meet linka
    if (meetingLink && meetingLink.trim() !== '' && meetingLink !== classSession.meetingLink) {
      setTimeout(async () => {
        try {
          const notifications = classSession.students
            .filter((st: any) => st.studentId && st.studentId.attendanceMode !== 'UZIVO')
            .map((st: any) => ({
              userId: st.studentId._id,
              title: 'Spreman Link za Čas 📹',
              message: `Profesor je upravo dodao Google Meet link. Tvoj čas (${classSession.courseName} nivo) uskoro počinje!`,
              type: 'INFO'
            }));
            
          if (notifications.length > 0) {
            await Notification.insertMany(notifications);
          }
        } catch (err) {
          console.error('Greška pri slanju notifikacije za meet link:', err);
        }
      }, 0);
    }
  } catch (error) {
    res.status(500).json({ error: 'Greška pri izmeni časa' });
  }
};

// @desc    Zakaži čas nadoknade
// @route   POST /api/schedule/makeup
// @access  Private/Profesor ili Admin
export const scheduleMakeupClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseName, studentIds, startDate, startTime, endTime, topic } = req.body;
    const profesorId = req.user?.role === 'PROFESOR' ? req.user._id : req.body.profesorId;

    if (!profesorId) {
      res.status(400).json({ error: 'Morate izabrati profesora.' });
      return;
    }

    if (!studentIds || studentIds.length === 0) {
      res.status(400).json({ error: 'Morate izabrati barem jednog učenika za nadoknadu.' });
      return;
    }

    // Koristimo pune ISO datume koji stižu sa frontenda (kako bi izbegli UTC probleme na serveru)
    let sDate = new Date(startTime);
    let eDate = new Date(endTime);
    
    // Fallback ako frontend pošalje u starom formatu (npr. '18:00')
    if (startTime.includes(':') && startTime.length <= 5) {
      sDate = new Date(`${startDate}T${startTime}:00+02:00`); // Prisiljavamo CET/CEST (Evropa)
      eDate = new Date(`${startDate}T${endTime}:00+02:00`);
    }

    const overlapQuery = {
      status: { $ne: 'OTKAZAN' },
      $or: [
        {
          $and: [
            { startTime: { $lt: eDate } },
            { endTime: { $gt: sDate } }
          ]
        }
      ],
      $and: [
        {
          $or: [
            { profesorId: profesorId },
            { 'students.studentId': { $in: studentIds } }
          ]
        }
      ]
    };
    const overlapClass = await ClassSession.findOne(overlapQuery);
    const isOverlap = !!overlapClass;
    if (isOverlap) {
      res.status(400).json({ error: 'Izabrani termin se preklapa sa postojećim časom.' });
      return;
    }

    // Proveri da li svi prosleđeni učenici imaju pravo na nadoknadu i skini im po jedan čas
    const validStudents = [];
    for (const stId of studentIds) {
      const student = await User.findById(stId);
      if (student && student.progress && (student.progress.makeupClassesOwed || 0) > 0) {
        student.progress.makeupClassesOwed = (student.progress.makeupClassesOwed || 1) - 1;
        student.markModified('progress');
        await student.save();
        validStudents.push({ studentId: student._id, attended: false });
      }
    }

    if (validStudents.length === 0) {
      res.status(400).json({ error: 'Nijedan od izabranih učenika nema pravo na nadoknadu.' });
      return;
    }

    const newClass = await ClassSession.create({
      courseName,
      profesorId,
      students: validStudents,
      startTime: sDate,
      endTime: eDate,
      topic: topic || '[NADOKNADA]',
      status: 'ZAKAZAN',
      isMakeup: true
    });

    // Notifikacije učenicima
    const notifications = validStudents.map(st => ({
      userId: st.studentId,
      title: 'Zakazana Nadoknada 📘',
      message: `Zakazan vam je čas za NADOKNADU dana ${sDate.getDate().toString().padStart(2, '0')}.${(sDate.getMonth() + 1).toString().padStart(2, '0')}. u ${startTime}h. (${courseName} nivo)`,
      type: 'INFO'
    }));
    await Notification.insertMany(notifications);

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri zakazivanju nadoknade.' });
  }
};

// @desc    Dohvati zauzete termine za profesora
// @route   GET /api/schedule/public/:profesorId
// @access  Private (Svi)
export const getProfessorBusySlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { profesorId } = req.params;
    
    // Dohvatamo profesora da bismo vratili njegove neradne dane (odmor)
    const profesor = await User.findById(profesorId).select('unavailableDates').lean();

    // Vraćamo samo časove koji su zakazani u budućnosti
    const classes = await ClassSession.find({
      profesorId,
      status: 'ZAKAZAN',
      endTime: { $gt: new Date() }
    }).select('startTime endTime').lean();

    res.json({
      classes,
      unavailableDates: profesor?.unavailableDates || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Greška pri učitavanju termina profesora' });
  }
};

// @desc    Zakaži probni čas (za nove učenike)
// @route   POST /api/schedule/trial
// @access  Private/Ucenik
export const scheduleTrialClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseName, profesorId, startDate, startTime, endTime } = req.body;
    const studentId = req.user?._id;

    if (!studentId || req.user?.role !== 'UCENIK') {
      res.status(403).json({ error: 'Samo učenici mogu zakazati probni čas.' });
      return;
    }

    if (!profesorId || !courseName || !startDate || !startTime || !endTime) {
      res.status(400).json({ error: 'Sva polja su obavezna.' });
      return;
    }

    // Proveri da li učenik već ima probni čas u bazi (bilo zakazan ili završen)
    const existingTrial = await ClassSession.findOne({
      'students.studentId': studentId,
      topic: '[PROBNI CAS]'
    });

    if (existingTrial) {
      res.status(400).json({ error: 'Već ste zakazali ili imali svoj probni čas.' });
      return;
    }

    const profesor = await User.findById(profesorId);
    if (!profesor || profesor.role !== 'PROFESOR') {
      res.status(400).json({ error: 'Izabrani profesor nije validan.' });
      return;
    }

    // Kreiramo prave ISO datume 
    let sDate = new Date(startTime);
    let eDate = new Date(endTime);
    
    if (startTime.includes(':') && startTime.length <= 5) {
      sDate = new Date(`${startDate}T${startTime}:00+02:00`); 
      eDate = new Date(`${startDate}T${endTime}:00+02:00`);
    }

    // Proveri preklapanje
    const overlapQuery = {
      status: { $ne: 'OTKAZAN' },
      $or: [
        {
          $and: [
            { startTime: { $lt: eDate } },
            { endTime: { $gt: sDate } }
          ]
        }
      ],
      profesorId: profesorId
    };

    const isOverlap = await ClassSession.findOne(overlapQuery);
    if (isOverlap) {
      res.status(400).json({ error: 'Ovaj termin je upravo zauzet. Molimo izaberite drugi.' });
      return;
    }

    // Zakaži čas
    const newClass = await ClassSession.create({
      courseName,
      profesorId,
      students: [{ studentId, attended: false }],
      startTime: sDate,
      endTime: eDate,
      topic: '[PROBNI CAS]',
      status: 'ZAKAZAN'
    });

    // Notifikacija profesoru (in-app)
    await Notification.create({
      userId: profesorId,
      title: 'Novi Probni Čas! 🌟',
      message: `Učenik ${req.user?.firstName} ${req.user?.lastName} je zakazao besplatan probni čas kod Vas. Nivo: ${courseName}.`,
      type: 'INFO'
    });

    // Pošalji email profesoru (asinhrono)
    const timeStr = `${sDate.getHours().toString().padStart(2, '0')}:${sDate.getMinutes().toString().padStart(2, '0')} (${sDate.getDate()}.${sDate.getMonth() + 1}.)`;
    sendTrialClassNotification(
      profesor.email, 
      `${req.user?.firstName} ${req.user?.lastName}`, 
      courseName, 
      timeStr
    );

    // Emitovanje dogadjaja za klijente da bi se refrešovao scheduleData i sklonio baner u realnom vremenu
    try { getIO().emit('users_updated'); } catch (e) { console.error('Socket.IO emit error:', e); }

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri zakazivanju probnog časa.' });
  }
};
