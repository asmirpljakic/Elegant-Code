import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useGetScheduleQuery } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import FreeSlotsCalendar from './FreeSlotsCalendar';
import MakeupClassModal from './MakeupClassModal';
import { Loader2 } from 'lucide-react';

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
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Nadoknade - Slobodni Termini</h2>
        <p className="text-slate-400 mt-1">Pregledajte svoj kalendar slobodnih termina i automatski zakažite nadoknade.</p>
      </div>

      <FreeSlotsCalendar 
        scheduleList={schedule} 
        profesorId={user?.role === 'PROFESOR' ? user.id : ''}
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
