import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { srLatn } from 'date-fns/locale';

interface FreeSlotsCalendarProps {
  scheduleList: any[];
  profesorId: string;
  onSlotClick: (date: string, startTime: string, endTime: string) => void;
}

export default function FreeSlotsCalendar({ scheduleList, profesorId, onSlotClick }: FreeSlotsCalendarProps) {
  // Radno vreme kalendara od 08:00 do 22:00 (15 slotova)
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);
  
  // Dani u nedelji
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filtriramo samo časove od ovog profesora
  const professorClasses = useMemo(() => {
    return scheduleList.filter(cls => 
      cls.status !== 'OTKAZAN' && 
      (cls.profesorId?._id === profesorId || cls.profesorId === profesorId)
    );
  }, [scheduleList, profesorId]);

  // Funkcija za proveru da li je slot slobodan
  const isSlotFree = (date: Date, hour: number) => {
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    const now = new Date();
    // Ako je slot u prošlosti, ne može se zakazati
    if (slotStart < now) return false;

    // Proveravamo da li postoji klasa koja se preklapa sa ovim slotom
    const overlap = professorClasses.some(cls => {
      const clsStart = new Date(cls.startTime);
      const clsEnd = new Date(cls.endTime);

      return (clsStart < slotEnd && clsEnd > slotStart);
    });

    return !overlap;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            Slobodni Termini za Nadoknadu
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Kliknite na bilo koje zeleno polje kako biste brzo zakazali čas nadoknade. Prikazani su slobodni termini ove nedelje.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Header (Dani) */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider p-2 flex items-end justify-end border-b border-slate-800/50">
              Vreme
            </div>
            {weekDays.map((day, i) => (
              <div 
                key={i} 
                className={`text-center p-3 rounded-xl border ${isSameDay(day, today) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-slate-950/50 border-slate-800 text-slate-300'}`}
              >
                <div className="text-xs font-semibold uppercase">{format(day, 'EEEE', { locale: srLatn })}</div>
                <div className="text-lg font-bold">{format(day, 'd. MMM', { locale: srLatn })}</div>
              </div>
            ))}
          </div>

          {/* Matrica sati */}
          <div className="space-y-2">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-2">
                {/* Oznaka vremena (Y osa) */}
                <div className="text-xs font-medium text-slate-500 flex items-center justify-end pr-4">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* Polja po danima */}
                {weekDays.map((day, dayIdx) => {
                  const isFree = isSlotFree(day, hour);
                  
                  return (
                    <div 
                      key={dayIdx}
                      onClick={() => {
                        if (isFree) {
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const startStr = `${hour.toString().padStart(2, '0')}:00`;
                          const endStr = `${(hour + 1).toString().padStart(2, '0')}:00`;
                          onSlotClick(dateStr, startStr, endStr);
                        }
                      }}
                      className={`h-12 rounded-xl border transition-all duration-200 flex items-center justify-center ${
                        isFree 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500 hover:text-emerald-300 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                          : 'bg-slate-950/80 border-slate-800/50 text-slate-700 cursor-not-allowed'
                      }`}
                      title={isFree ? 'Slobodan termin - Zakaži' : 'Zauzet termin ili prošlost'}
                    >
                      {isFree ? (
                        <span className="text-base font-medium text-white drop-shadow-md">{hour.toString().padStart(2, '0')}:00</span>
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
