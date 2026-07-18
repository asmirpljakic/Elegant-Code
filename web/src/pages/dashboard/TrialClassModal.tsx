import React, { useState } from 'react';
import { X, Calendar, UserCheck, BookOpen, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useGetPublicProfessorsQuery, useGetProfessorBusySlotsQuery, useScheduleTrialClassMutation } from '../../store/apiSlice';
import FreeSlotsCalendar from './FreeSlotsCalendar';

interface TrialClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TrialClassModal({ isOpen, onClose, onSuccess }: TrialClassModalProps) {
  const [step, setStep] = useState(1);
  const [courseName, setCourseName] = useState('OSNOVNI');
  const [profesorId, setProfesorId] = useState('');
  const [error, setError] = useState('');

  const { data: professors = [], isLoading: isLoadingUsers } = useGetPublicProfessorsQuery(undefined, { skip: !isOpen });
  const { data: busySlotsData, isLoading: isLoadingSlots } = useGetProfessorBusySlotsQuery(profesorId, { skip: !profesorId || step !== 3 });
  
  const [scheduleTrial, { isLoading: isScheduling }] = useScheduleTrialClassMutation();

  if (!isOpen) return null;

  // Prilagođavamo busySlots da bi ih FreeSlotsCalendar prepoznao
  const busySlots = busySlotsData?.classes || [];
  const unavailableDates = busySlotsData?.unavailableDates || [];

  const formattedScheduleForCalendar = busySlots.map((slot: any) => ({
    ...slot,
    status: 'ZAKAZAN',
    profesorId: profesorId
  }));

  const handleSlotSelected = async (date: string, startTime: string, endTime: string) => {
    setError('');
    
    if (!confirm(`Da li ste sigurni da želite da zakažete probni čas za ${date} u ${startTime}?`)) {
      return;
    }

    try {
      await scheduleTrial({
        courseName,
        profesorId,
        startDate: date,
        startTime,
        endTime
      }).unwrap();
      
      onSuccess();
      onClose();
      // Reset state for future
      setTimeout(() => {
        setStep(1);
        setProfesorId('');
      }, 500);
    } catch (err: any) {
      setError(err.data?.error || 'Došlo je do greške pri zakazivanju probnog časa.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-[95vw] md:w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 sticky top-0 z-10">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mr-4 shadow-lg shadow-primary/20">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Besplatan Probni Čas</h3>
              <p className="text-sm text-slate-400">Korak {step} od 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <div className="text-center mb-8">
                <h4 className="text-xl font-medium text-white">Koji nivo programiranja vas zanima?</h4>
                <p className="text-slate-400 mt-2">Izaberite nivo koji najbolje odgovara vašem predznanju.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['OSNOVNI', 'SREDNJI', 'NAPREDNI'].map((level) => (
                  <button
                    key={level}
                    onClick={() => {
                      setCourseName(level);
                      setStep(2);
                    }}
                    className={`p-6 rounded-2xl border-2 text-left transition-all duration-200 group ${
                      courseName === level 
                        ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                        : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className={`w-8 h-8 mb-4 ${courseName === level ? 'text-primary' : 'text-slate-400 group-hover:text-slate-300'}`} />
                    <h5 className="text-lg font-bold text-white mb-2">{level} NIVO</h5>
                    <p className="text-sm text-slate-400 line-clamp-3">
                      {level === 'OSNOVNI' && 'Idealno za početnike bez ikakvog predznanja. Naučite osnove logike i sintakse.'}
                      {level === 'SREDNJI' && 'Za one koji već znaju osnove i žele da prodube znanje i rade na pravim projektima.'}
                      {level === 'NAPREDNI' && 'Napredne tehnologije, arhitektura softvera i priprema za profesionalnu karijeru.'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setStep(1)} className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Nazad na nivoe
              </button>
              
              <div className="text-center mb-8">
                <h4 className="text-xl font-medium text-white">Izaberite svog profesora</h4>
                <p className="text-slate-400 mt-2">Svi naši profesori su iskusni inženjeri spremni da vam prenesu znanje.</p>
              </div>

              {isLoadingUsers ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {professors.map((p: any) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        setProfesorId(p._id);
                        setStep(3);
                      }}
                      className="flex items-center p-4 bg-slate-800/50 border-2 border-slate-700 rounded-2xl hover:border-primary hover:bg-slate-800 transition-all text-left"
                    >
                      <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                        <UserCheck className="w-6 h-6 text-slate-300" />
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-white">{p.firstName} {p.lastName}</h5>
                        <p className="text-sm text-slate-400">Senior Profesor</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <button onClick={() => setStep(2)} className="flex items-center text-slate-400 hover:text-white transition-colors mb-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Nazad na izbor profesora
              </button>

              <div className="text-center mb-4">
                <h4 className="text-xl font-medium text-white">Izaberite slobodan termin</h4>
                <p className="text-slate-400 mt-1">Kliknite na zeleno polje u kalendaru ispod da zakažete svoj termin.</p>
              </div>

              {isLoadingSlots ? (
                <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
              ) : (
                <FreeSlotsCalendar 
                  scheduleList={formattedScheduleForCalendar}
                  profesorId={profesorId}
                  unavailableDates={unavailableDates}
                  onSlotClick={handleSlotSelected}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
