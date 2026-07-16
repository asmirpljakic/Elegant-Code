import React, { useState } from 'react';
import { X, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useGetUsersQuery, useScheduleMakeupClassMutation } from '../../store/apiSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';

interface MakeupClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MakeupClassModal({ isOpen, onClose }: MakeupClassModalProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // Fetch users to find students with makeup classes owed
  const { data: allUsersData, isLoading: isLoadingUsers } = useGetUsersQuery(undefined, {
    skip: !isOpen
  });

  const [scheduleMakeup, { isLoading: isScheduling }] = useScheduleMakeupClassMutation();

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [profesorId, setProfesorId] = useState(user?.role === 'PROFESOR' ? user.id : '');
  const [courseName, setCourseName] = useState('OSNOVNI');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [topic, setTopic] = useState('[NADOKNADA]');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // Filter only students who are owed makeup classes
  const usersList = allUsersData?.users || [];
  const eligibleStudents = usersList.filter((u: any) => u.role === 'UCENIK' && u.progress?.makeupClassesOwed > 0);
  const professors = usersList.filter((u: any) => u.role === 'PROFESOR');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedStudentId) {
      setError('Morate izabrati učenika za nadoknadu.');
      return;
    }

    try {
      await scheduleMakeup({
        courseName,
        profesorId: user?.role === 'PROFESOR' ? user.id : profesorId,
        studentIds: [selectedStudentId],
        startDate: date,
        startTime,
        endTime,
        topic
      }).unwrap();
      
      onClose();
    } catch (err: any) {
      setError(err.data?.error || 'Došlo je do greške pri zakazivanju nadoknade.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-3">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Zakaži Nadoknadu</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {eligibleStudents.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-medium text-white mb-2">Sve je čisto!</h4>
              <p className="text-slate-400">Trenutno nijedan učenik ne čeka nadoknadu časova.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Izaberi Učenika *</label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                  <option value="">Odaberi učenika...</option>
                  {eligibleStudents.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} (Duguje časova: {s.progress.makeupClassesOwed})
                    </option>
                  ))}
                </select>
              </div>

              {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Profesor *</label>
                  <select
                    required
                    value={profesorId}
                    onChange={(e) => setProfesorId(e.target.value)}
                    className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                  >
                    <option value="">Izaberi profesora</option>
                    {professors.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nivo (Kurs)</label>
                <select
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                >
                  <option value="OSNOVNI">Osnovni</option>
                  <option value="SREDNJI">Srednji</option>
                  <option value="NAPREDNI">Napredni</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Datum *</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Početak *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Kraj *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tema (Opciono)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="[NADOKNADA]"
                  className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="button" variant="outline" onClick={onClose} className="mr-3">
                  Odustani
                </Button>
                <Button type="submit" isLoading={isScheduling} className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                  Zakaži Nadoknadu
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
