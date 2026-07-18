import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isBefore, startOfDay, isWithinInterval } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { CalendarOff, ChevronLeft, ChevronRight, Save, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import type { RootState } from '../../store/store';
import { useGetMeQuery, useUpdateVacationMutation } from '../../store/apiSlice';

export default function ProfessorVacation() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: currentUser, isLoading: isUserLoading } = useGetMeQuery();
  const [updateVacation, { isLoading: isUpdating }] = useUpdateVacationMutation();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Inicijalizuj sa servera
  useEffect(() => {
    if (currentUser?.unavailableDates) {
      setSelectedDates(currentUser.unavailableDates);
    }
  }, [currentUser]);

  if (user?.role !== 'PROFESOR') {
    return <div className="p-8 text-white">Pristup odbijen.</div>;
  }

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const toggleDate = (date: Date) => {
    const today = startOfDay(new Date());
    if (isBefore(date, today)) return; // Ne može se birati prošlost

    const dateStr = format(date, 'yyyy-MM-dd');

    if (!rangeStart) {
      // Ako nije započet range, i kliknuli smo na već izabran datum, brišemo ga
      if (selectedDates.includes(dateStr)) {
        setSelectedDates(prev => prev.filter(d => d !== dateStr));
      } else {
        // Počinjemo novi range
        setRangeStart(date);
      }
    } else {
      // Započet je range
      if (isBefore(date, rangeStart)) {
        // Kliknuo je pre starta, resetujemo start
        setRangeStart(date);
      } else {
        // Kliknuo je posle starta, formiramo range
        const range = eachDayOfInterval({ start: rangeStart, end: date });
        const newDates = range.map(d => format(d, 'yyyy-MM-dd'));
        // Dodajemo nove datume u postojeće bez duplikata
        setSelectedDates(prev => Array.from(new Set([...prev, ...newDates])));
        setRangeStart(null);
      }
    }
  };

  const clearAll = () => {
    setSelectedDates([]);
    setRangeStart(null);
  };

  const handleSave = async () => {
    try {
      setMessage(null);
      await updateVacation({ unavailableDates: selectedDates }).unwrap();
      setMessage({ text: 'Datumi uspešno sačuvani! Vaši učenici će biti obavešteni o novim neradnim danima.', type: 'success' });
      setTimeout(() => setMessage(null), 5000);
    } catch (error) {
      setMessage({ text: 'Došlo je do greške prilikom čuvanja datuma.', type: 'error' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
            <CalendarOff className="w-8 h-8 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Vaš Odmor i Neradni Dani</h1>
            <p className="text-emerald-200/80 text-lg max-w-2xl">
              Kliknite na početni, a zatim na krajnji datum da biste označili period odmora. Vaši učenici će automatski dobiti obaveštenje.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{message.text}</p>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white capitalize">
            {format(currentMonth, 'LLLL yyyy', { locale: srLatn })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4 mb-4">
          {['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 md:gap-4">
          {/* Prazna polja pre početka meseca */}
          {Array.from({ length: (startOfMonth(currentMonth).getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-xl bg-slate-900/50 border border-slate-800/30"></div>
          ))}

          {/* Dani u mesecu */}
          {daysInMonth.map(date => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const isSelected = selectedDates.includes(dateStr);
            const isPast = isBefore(date, startOfDay(new Date()));
            
            // Logika za hover range
            const isHoveredRange = rangeStart && hoverDate && 
                                   (isWithinInterval(date, { start: rangeStart, end: hoverDate }) || 
                                    isWithinInterval(date, { start: hoverDate, end: rangeStart }));
            
            const isRangeStart = rangeStart && format(rangeStart, 'yyyy-MM-dd') === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => toggleDate(date)}
                onMouseEnter={() => !isPast && setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={isPast}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 relative group
                  ${isPast 
                    ? 'opacity-40 cursor-not-allowed bg-slate-900 border border-slate-800' 
                    : isRangeStart
                      ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 z-10'
                      : isHoveredRange
                        ? 'bg-emerald-500/40 border-emerald-500/50 text-white'
                        : isSelected
                          ? 'bg-emerald-500/20 border-emerald-500 border text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                          : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-white hover:border-slate-600'
                  }
                `}
              >
                <span className={`text-lg font-bold ${isRangeStart ? 'text-white' : isSelected ? 'text-emerald-400' : isPast ? 'text-slate-500' : 'text-slate-200'}`}>
                  {format(date, 'd')}
                </span>
                {isSelected && !isRangeStart && !isHoveredRange && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-400 mt-1">Odmor</span>
                )}
                {isRangeStart && (
                  <span className="text-[10px] font-medium uppercase tracking-wider text-white mt-1">Start</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={clearAll}
            className="px-4 py-2 text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Očisti sve
          </button>
          
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-70"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Sačuvaj Odmor
          </button>
        </div>
      </div>
    </div>
  );
}
