import { Request, Response } from 'express';
import { User } from '../models/User';
import { ClassSession } from '../models/ClassSession';
import { ActivityLog } from '../models/ActivityLog';
import { Settings } from '../models/Settings';

// @desc    Dohvati statistiku za SUPER_ADMIN dashboard
// @route   GET /api/analytics
// @access  Private/Admin
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    // Dohvati globalna podešavanja
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        professorClassFee: 15,
        packagePrices: { OSNOVNI: 100, SREDNJI: 150, NAPREDNI: 200 }
      });
    }

    // 1. Ukupan broj korisnika po ulogama
    const totalStudents = await User.countDocuments({ role: { $in: ['UCENIK', 'KLIJENT'] } });
    const totalProfessors = await User.countDocuments({ role: 'PROFESOR' });
    
    // Najlojalniji učenik (najviše održanih časova iz User progress-a)
    const topStudentDoc = await User.findOne({ role: { $in: ['UCENIK', 'KLIJENT'] } })
      .sort({ 'progress.totalClassesAttended': -1 })
      .select('firstName lastName progress.totalClassesAttended');
    
    const topStudent = topStudentDoc ? {
      name: `${topStudentDoc.firstName} ${topStudentDoc.lastName}`,
      classes: topStudentDoc.progress.totalClassesAttended
    } : null;

    // 2. Status časova ukupno
    const scheduledClasses = await ClassSession.countDocuments({ status: 'ZAKAZAN' });
    const completedClasses = await ClassSession.countDocuments({ status: 'ZAVRSEN' });
    
    // 3. Izračunavanje ukupne zarade na osnovu paketa iz baze
    const packagePrices = {
      OSNOVNI: settings.packagePrices.OSNOVNI,
      SREDNJI: settings.packagePrices.SREDNJI,
      NAPREDNI: settings.packagePrices.NAPREDNI,
      NONE: 0
    };

    const usersByPackage = await User.aggregate([
      { $match: { role: { $in: ['UCENIK', 'KLIJENT'] } } },
      { $group: { _id: '$activePackage', count: { $sum: 1 } } }
    ]);

    let totalRevenue = 0;
    usersByPackage.forEach(item => {
      const pkg = item._id as keyof typeof packagePrices;
      if (packagePrices[pkg]) {
        totalRevenue += packagePrices[pkg] * item.count;
      }
    });
    
    // 4. Leaderboard Profesora i njihova zarada (dinamički fee po održanom času)
    const professorLeaderboard = await ClassSession.aggregate([
      { $match: { status: 'ZAVRSEN' } },
      { $group: { _id: '$profesorId', completedCount: { $sum: 1 } } },
      { $sort: { completedCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'profesor'
        }
      },
      { $unwind: '$profesor' },
      { 
        $project: { 
          _id: 1, 
          completedCount: 1, 
          firstName: '$profesor.firstName', 
          lastName: '$profesor.lastName',
          earnings: { $multiply: ['$completedCount', settings.professorClassFee] }
        } 
      }
    ]);

    // 5. Rast učenika po mesecima u tekućoj godini
    const currentYear = new Date().getFullYear();
    const studentGrowth = await User.aggregate([
      { 
        $match: { 
          role: { $in: ['UCENIK', 'KLIJENT'] },
          createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) }
        } 
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Mapiraj brojeve meseci u imena
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];
    const growthChartData = monthNames.map((name, index) => {
      const found = studentGrowth.find(g => g._id.month === index + 1);
      return { month: name, newStudents: found ? found.count : 0 };
    });

    // 6. Aktivnost u poslednjih/narednih 14 dana (Line chart za časove)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfRange = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // Pre 7 dana
    const endOfRange = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);   // Za 7 dana

    const activityData = await ClassSession.aggregate([
      {
        $match: {
          startTime: { $gte: startOfRange, $lte: endOfRange }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' },
            status: '$status'
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const chartDataMap = new Map();
    for (let d = new Date(startOfRange); d <= endOfRange; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      chartDataMap.set(dateStr, {
        date: dateStr,
        ZAKAZAN: 0,
        ZAVRSEN: 0,
        OTKAZAN: 0
      });
    }

    activityData.forEach(item => {
      const dateStr = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      if (chartDataMap.has(dateStr)) {
        const existing = chartDataMap.get(dateStr);
        existing[item._id.status] = item.count;
      }
    });

    const chartData = Array.from(chartDataMap.values());

    // 7. Poslednje aktivnosti (Activity Feed)
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('action description createdAt');

    res.json({
      kpis: {
        totalStudents,
        totalProfessors,
        scheduledClasses,
        completedClasses,
        totalRevenue,
        topStudent
      },
      professorLeaderboard,
      studentGrowth: growthChartData,
      chartData,
      activities
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška pri povlačenju analitike' });
  }
};
