import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetScheduleQuery, useGetUsersQuery } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import FreeSlotsCalendar from './FreeSlotsCalendar';
import MakeupClassModal from './MakeupClassModal';
import { Loader2, Search, X } from 'lucide-react';

export default function MakeupSchedule() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: schedule = [], isLoading } = useGetScheduleQuery(undefined, {
    pollingInterval: 10000,
    skipPollingIfUnfocused: true,
  });

  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [initialMakeupDate, setInitialMakeupDate] = useState('');
  const [initialMakeupStartTime, setInitialMakeupStartTime] = useState('');
  const [initialMakeupEndTime, setInitialMakeupEndTime] = useState('');

  // Filteri
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const { data: allUsers } = useGetUsersQuery({ page: 1, limit: 1000 });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Ako nije osoblje, ne prikazuj (malo redundantno pošto se link skriva, ali sigurnost)
  if (!['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '')) {
    return <div className="p-8 text-white">Pristup odbijen.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Nadoknade - Slobodni Termini</h2>
          <p className="text-slate-400 mt-1">Pregledajte kalendar slobodnih termina i zakažite nadoknade.</p>
        </div>

        {/* Filter za Admine sa pretragom */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
          <div className="relative z-20 min-w-[280px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Pretraži profesora..."
                value={userSearchTerm}
                onFocus={() => setIsUserDropdownOpen(true)}
                onChange={(e) => {
                  setUserSearchTerm(e.target.value);
                  setIsUserDropdownOpen(true);
                  if (e.target.value === '') {
                    setFilterUserId('');
                  }
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              {userSearchTerm && (
                <button 
                  onClick={() => {
                    setUserSearchTerm('');
                    setFilterUserId('');
                    setIsUserDropdownOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isUserDropdownOpen && allUsers?.users && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {allUsers.users
                  .filter(u => u.role === 'PROFESOR')
                  .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()))
                  .map(u => (
                    <button
                      key={u._id}
                      onClick={() => {
                        setFilterUserId(u._id);
                        setUserSearchTerm(`${u.firstName} ${u.lastName}`);
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors flex flex-col border-b border-slate-700/50 last:border-0"
                    >
                      <span className="text-white font-medium">{u.firstName} {u.lastName}</span>
                      <span className="text-xs text-slate-400">{u.role}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FreeSlotsCalendar 
        scheduleList={schedule} 
        profesorId={filterUserId === 'ALL' || !filterUserId ? (user?.role === 'PROFESOR' ? user.id : '') : filterUserId}
        onSlotClick={(date, start, end) => {
          setInitialMakeupDate(date);
          setInitialMakeupStartTime(start);
          setInitialMakeupEndTime(end);
          setIsMakeupModalOpen(true);
        }}
      />

      <MakeupClassModal 
        isOpen={isMakeupModalOpen} 
        onClose={() => {
          setIsMakeupModalOpen(false);
          setInitialMakeupDate('');
          setInitialMakeupStartTime('');
          setInitialMakeupEndTime('');
        }} 
        initialDate={initialMakeupDate}
        initialStartTime={initialMakeupStartTime}
        initialEndTime={initialMakeupEndTime}
      />
    </div>
  );
}
