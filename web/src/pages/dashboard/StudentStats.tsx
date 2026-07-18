import { useSelector } from 'react-redux';
import { useGetMeQuery } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Award, BookOpen, Star, TrendingUp } from 'lucide-react';

export default function StudentStats() {
  const { user: authUser } = useSelector((state: RootState) => state.auth);
  
  // Dohvataj "žive" podatke samo kada dođe socket obaveštenje ili korisnik refokusira tab
  const { data: me } = useGetMeQuery(undefined, {
    skip: !authUser,
    refetchOnFocus: true,
  });

  const user = me || authUser;

  if (!user || (user.role !== 'UCENIK' && user.role !== 'KLIJENT')) {
    return null;
  }

  // Fallback ako tek registrovan nema progress polje
  const xp = user.progress?.xp || 0;
  const level = user.progress?.currentLevel || 1;
  const attended = user.progress?.totalClassesAttended || 0;

  // Izračunavanje progresa do sledećeg nivoa (Svaki nivo traži 500 XP)
  const xpInCurrentLevel = xp % 500;
  const progressPercentage = (xpInCurrentLevel / 500) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* GLAVNA KARTICA - TRENUTNI NIVO */}
      <div className="bg-gradient-to-br from-primary/20 to-slate-900 border border-primary/20 rounded-3xl p-6 lg:col-span-2 relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        
        {/* Dekorativni krug u pozadini */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 w-40 h-40 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Sivi krug u pozadini */}
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-800" />
            {/* Progres krug */}
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" 
              className="text-primary"
              strokeDasharray="283"
              strokeDashoffset={283 - (283 * progressPercentage) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-black text-white">Lvl {level}</span>
            <span className="text-xs text-primary font-bold uppercase tracking-wider mt-1">{user.activePackage}</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <h3 className="text-2xl font-bold text-white mb-2">Odličan napredak! 🚀</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Trenutno imaš <strong className="text-white">{xp} XP poena</strong>. 
            Prisustvuj časovima kako bi sakupio još poena i otključao viši nivo. Za sledeći nivo ti fali još <strong className="text-white">{500 - xpInCurrentLevel} XP</strong>.
          </p>
          <div className="bg-slate-900/50 rounded-xl p-4 flex gap-4 overflow-hidden border border-slate-800">
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Trenutni Paket</p>
              <p className="text-sm font-bold text-white">{user.activePackage}</p>
            </div>
            <div className="w-px bg-slate-800"></div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-sm font-bold text-emerald-400">Aktivan</p>
            </div>
          </div>
        </div>
      </div>

      {/* SPOREDNE KARTICE */}
      <div className="flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-1 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Oslušani Časovi</p>
              <h4 className="text-3xl font-black text-white">{attended}</h4>
            </div>
          </div>
          <p className="text-sm text-slate-400">Svaki odslušan čas ti donosi 100 XP poena i približava te novom nivou.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex-1 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">Sledeća nagrada</p>
            <p className="text-xs text-slate-400 mt-1">Dostiži Level {level + 1} za novi bedž.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
