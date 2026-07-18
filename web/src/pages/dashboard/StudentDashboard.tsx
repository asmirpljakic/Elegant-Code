import React from 'react';
import { useSelector } from 'react-redux';
import { useGetMeQuery, useGetScheduleQuery } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Loader2, Award, Zap, Shield, Video, Calendar, Clock, Star, Trophy, Target } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { ScrollingBanner } from '../../components/ui/ScrollingBanner';
import TrialClassModal from './TrialClassModal';

export default function StudentDashboard() {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  
  // Dohvatamo uvek svež status korisnika (XP, Level, totalClassesAttended)
  const { data: user, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });

  const { data: scheduleData = [], isLoading: isScheduleLoading } = useGetScheduleQuery(undefined, {
    refetchOnFocus: true
  });

  const [isTrialModalOpen, setIsTrialModalOpen] = React.useState(false);

  if (isUserLoading || isScheduleLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const progress = user?.progress || { xp: 0, currentLevel: 1, totalClassesAttended: 0 };
  const xpForNextLevel = 500;
  const currentLevelXp = progress.xp % xpForNextLevel;
  const progressPercent = Math.min((currentLevelXp / xpForNextLevel) * 100, 100);

  // Pronalaženje sledećeg časa
  const now = new Date();
  const upcomingClasses = scheduleData
    .filter((cls: any) => cls.status === 'ZAKAZAN')
    .filter((cls: any) => cls.students.some((st: any) => st.studentId?._id === user?._id || st.studentId === user?._id))
    .filter((cls: any) => isAfter(new Date(cls.startTime), now))
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextClass = upcomingClasses[0];

  // Da li učenik sme da zakaže probni čas?
  const hasEverScheduledTrial = scheduleData.some((cls: any) => 
    cls.topic === '[PROBNI CAS]' && 
    cls.students.some((st: any) => st.studentId?._id === user?._id || st.studentId === user?._id)
  );
  const canScheduleTrial = user?.role === 'UCENIK' && user?.activePackage === 'NONE' && !hasEverScheduledTrial;

  // Logika za značke
  const badges = [
    {
      id: 'prvi-korak',
      title: 'Prvi Korak',
      description: 'Prisustvovao si prvom času.',
      icon: <Target className="w-6 h-6" />,
      isUnlocked: progress.totalClassesAttended >= 1,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      id: 'redovan',
      title: 'Redovan Učenik',
      description: 'Završio si 5 ili više časova.',
      icon: <Star className="w-6 h-6" />,
      isUnlocked: progress.totalClassesAttended >= 5,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
    },
    {
      id: 'pravi-haker',
      title: 'Pravi Haker',
      description: 'Dostigao si Nivo 5.',
      icon: <Shield className="w-6 h-6" />,
      isUnlocked: progress.currentLevel >= 5,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* REKLAMNI BANERI (Samo za korisnike bez paketa) */}
      {user?.activePackage === 'NONE' && <ScrollingBanner />}

      {/* PROBNI CAS BANNER */}
      {canScheduleTrial && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-blue-500/20 border border-blue-400/30">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
                <Star className="w-4 h-4 mr-1 text-yellow-300" fill="currentColor" /> Poklon Dobrodošlice
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Zakaži svoj prvi čas besplatno!</h2>
              <p className="text-blue-100 text-lg max-w-xl">
                Izaberi nivo programiranja, upoznaj se sa profesorom i saznaj da li ti se sviđa naša platforma. Bez ikakvih obaveza.
              </p>
            </div>
            <button 
              onClick={() => setIsTrialModalOpen(true)}
              className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg hover:bg-blue-50 hover:scale-105 transition-all duration-300 shadow-xl flex-shrink-0"
            >
              Zakaži Besplatan Čas
            </button>
          </div>
        </div>
      )}
      {/* 1. SEKCIJA NAPRETKA (XP & Level) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 relative overflow-hidden">
        {/* Dekorativni pozadinski sjaj */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">
              Zdravo, {user?.firstName}! 👋
            </h1>
            <p className="text-slate-400 mb-6">
              Spreman za nove izazove? Tvoj trenutni paket je <span className="text-primary font-semibold">{user?.activePackage}</span>.
            </p>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-medium text-slate-400">Nivo</p>
                  <p className="text-4xl font-black text-white">{progress.currentLevel}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-400">XP Napredak</p>
                  <p className="text-lg font-bold text-primary">{currentLevelXp} / {xpForNextLevel} XP</p>
                </div>
              </div>
              <div className="h-4 bg-slate-800 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-500 to-primary rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/20"></div>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-right">
                Još {xpForNextLevel - currentLevelXp} XP do Nivoa {progress.currentLevel + 1}
              </p>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-slate-800/50 rounded-full flex items-center justify-center border-4 border-slate-800 relative shadow-[0_0_50px_rgba(16,185,129,0.15)]">
              <Trophy className="w-16 h-16 md:w-20 md:h-20 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              <div className="absolute -bottom-4 bg-slate-800 text-white px-4 py-1 rounded-full text-sm font-bold border border-slate-700">
                {progress.totalClassesAttended} Časova
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. SLEDEĆI ČAS */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center mb-6">
            <Calendar className="w-5 h-5 text-blue-400 mr-2" />
            <h3 className="text-lg font-bold text-white">Sledeći Čas</h3>
          </div>
          
          {nextClass ? (
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-800/50">
                <Clock className="w-8 h-8 text-blue-400" />
              </div>
              
              <h4 className="text-xl font-bold text-white mb-1">
                {nextClass.courseName}
              </h4>
              <p className="text-sm text-slate-400 mb-4">
                Profesor: {nextClass.profesorId?.firstName || 'Dodeljen'} {nextClass.profesorId?.lastName || ''}
              </p>
              
              <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 mb-6 w-full">
                <p className="text-primary font-medium text-lg">
                  {format(new Date(nextClass.startTime), 'HH:mm')}
                </p>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                  {format(new Date(nextClass.startTime), 'dd. MMMM yyyy.', { locale: srLatn })}
                </p>
              </div>

              {nextClass.meetingLink ? (
                <a 
                  href={nextClass.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  <Video className="w-5 h-5 mr-2" />
                  Pridruži se (Google Meet)
                </a>
              ) : (
                <div className="w-full py-3 bg-slate-800 rounded-xl text-slate-500 text-sm font-medium border border-slate-700">
                  Link za Meet još uvek nije dodat
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                <Calendar className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium">Nema zakazanih časova</p>
              <p className="text-xs text-slate-500 mt-1">Vaš profesor će vas obavestiti o narednom terminu.</p>
            </div>
          )}
        </div>

        {/* 3. ZNAČKE (BADGES) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center mb-6">
            <Award className="w-5 h-5 text-amber-400 mr-2" />
            <h3 className="text-lg font-bold text-white">Tvoja Dostignuća</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {badges.map(badge => (
              <div 
                key={badge.id}
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden group",
                  badge.isUnlocked 
                    ? "bg-slate-800/80 border-slate-700 hover:border-slate-600 hover:shadow-lg hover:-translate-y-1" 
                    : "bg-slate-900/50 border-slate-800/50 opacity-60 grayscale"
                )}
              >
                {/* Background glow ako je otključano */}
                {badge.isUnlocked && (
                  <div className={cn("absolute -top-10 -right-10 w-24 h-24 blur-2xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity", badge.bgColor)}></div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  badge.isUnlocked ? badge.bgColor : "bg-slate-800 text-slate-600"
                )}>
                  <div className={badge.isUnlocked ? badge.color : "text-slate-600"}>
                    {badge.icon}
                  </div>
                </div>
                
                <h4 className={cn(
                  "font-bold mb-1",
                  badge.isUnlocked ? "text-white" : "text-slate-400"
                )}>
                  {badge.title}
                </h4>
                
                <p className={cn(
                  "text-xs leading-relaxed",
                  badge.isUnlocked ? "text-slate-400" : "text-slate-600"
                )}>
                  {badge.description}
                </p>
                
                {!badge.isUnlocked && (
                  <div className="absolute top-4 right-4 text-xs font-bold text-slate-600 bg-slate-800 px-2 py-1 rounded">
                    Zaključano
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

      <TrialClassModal 
        isOpen={isTrialModalOpen} 
        onClose={() => setIsTrialModalOpen(false)}
        onSuccess={() => {
          // Ovaj se trigeruje kad se uspesno zakaze (moze obavestiti Redux da fetchuje, ali vec se invalidatesTags radi)
        }} 
      />
    </div>
  );
}
