import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetUsersQuery, useGetScheduleQuery } from '../../store/apiSlice';
import { Users, Calendar, Clock, Award, Star, Loader2, Search, X, CheckCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { srLatn } from 'date-fns/locale';

export default function ProfessorDashboard() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: usersData, isLoading: isUsersLoading } = useGetUsersQuery({ limit: 1000 }, {
    skip: user?.role !== 'PROFESOR'
  });

  const { data: scheduleData, isLoading: isScheduleLoading } = useGetScheduleQuery(undefined, {
    skip: user?.role !== 'PROFESOR',
    refetchOnMountOrArgChange: true,
    pollingInterval: 10000
  });

  if (isUsersLoading || isScheduleLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allUsers = usersData?.users || [];
  const students = allUsers.filter(u => u.role === 'UCENIK' || u.role === 'KLIJENT');
  
  const schedule = scheduleData || [];
  const upcomingClasses = schedule.filter((c: any) => c.status === 'ZAKAZAN' && isAfter(new Date(c.startTime), new Date()));
  const completedClasses = schedule.filter((c: any) => c.status === 'ZAVRSEN');

  // KPI Calculations
  const totalStudents = students.length;
  const totalUpcoming = upcomingClasses.length;
  const totalCompleted = completedClasses.length;

  // Top Students Logic
  const sortedStudents = [...students].sort((a, b) => {
    const xpA = a.progress?.xp || 0;
    const xpB = b.progress?.xp || 0;
    return xpB - xpA;
  });
  
  const topStudents = sortedStudents.slice(0, 3);

  // Search Filter
  const filteredStudents = sortedStudents.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackageColor = (pkg: string) => {
    switch(pkg) {
      case 'OSNOVNI': return 'text-slate-400 bg-slate-800';
      case 'SREDNJI': return 'text-blue-400 bg-blue-500/10';
      case 'NAPREDNI': return 'text-amber-400 bg-amber-500/10';
      default: return 'text-slate-500 bg-slate-800/50';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KPI KARTICE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Moji Učenici</h3>
            <p className="text-3xl font-bold text-white">{totalStudents}</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Predstojeći Časovi</h3>
            <p className="text-3xl font-bold text-primary">{totalUpcoming}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Održano Časova</h3>
            <p className="text-3xl font-bold text-emerald-400">{totalCompleted}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TOP UČENICI */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center mb-6">
            <Award className="w-5 h-5 text-amber-400 mr-2" />
            <h3 className="text-lg font-bold text-white">Top 3 Učenika</h3>
          </div>
          <div className="flex-1 space-y-4">
            {topStudents.length > 0 ? topStudents.map((st, idx) => (
              <div key={st._id} className="relative flex items-center bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center font-bold text-slate-950 border-4 border-slate-900">
                  #{idx + 1}
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-white font-medium">{st.firstName} {st.lastName}</h4>
                  <div className="flex items-center mt-1 text-xs">
                    <span className="text-amber-400 font-bold mr-2">{st.progress?.xp || 0} XP</span>
                    <span className="text-slate-400">Nivo {st.progress?.currentLevel || 1}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(st)}
                  className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Profil
                </button>
              </div>
            )) : (
              <p className="text-slate-500 text-sm text-center mt-10">Trenutno nemate učenika sa bodovima.</p>
            )}
          </div>
        </div>

        {/* LISTA SVIH UČENIKA */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Users className="w-5 h-5 text-blue-400 mr-2" />
              Svi Učenici
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Pretraži učenika..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredStudents.length > 0 ? filteredStudents.map(st => (
              <div 
                key={st._id} 
                onClick={() => setSelectedStudent(st)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 cursor-pointer hover:border-primary/50 hover:bg-slate-800/80 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-white font-medium group-hover:text-primary transition-colors">{st.firstName} {st.lastName}</h4>
                    <p className="text-xs text-slate-400">{st.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${getPackageColor(st.activePackage)}`}>
                    {st.activePackage}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-4 text-sm">
                  <div className="flex items-center text-slate-300">
                    <Star className="w-4 h-4 text-amber-400 mr-1" />
                    <span>Lvl {st.progress?.currentLevel || 1}</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <Clock className="w-4 h-4 text-blue-400 mr-1" />
                    <span>{st.progress?.totalClassesAttended || 0} časova</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-1 sm:col-span-2 text-center py-10">
                <p className="text-slate-500">Nema pronađenih učenika.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DETALJI UČENIKA */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <button 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Header / Basic Info */}
            <div className="p-8 border-b border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <div className="w-40 h-40 rounded-full bg-primary blur-3xl"></div>
              </div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center text-3xl font-bold text-primary mb-4 border-2 border-primary/20">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span>{selectedStudent.email}</span>
                  {selectedStudent.phoneNumber && <span>• {selectedStudent.phoneNumber}</span>}
                  <span>• Paket: <strong className={`px-2 py-0.5 rounded ${getPackageColor(selectedStudent.activePackage)}`}>{selectedStudent.activePackage}</strong></span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-8 bg-slate-800/30 border-b border-slate-800">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Nivo</p>
                  <p className="text-2xl font-bold text-white">{selectedStudent.progress?.currentLevel || 1}</p>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Iskustvo</p>
                  <p className="text-2xl font-bold text-amber-400">{selectedStudent.progress?.xp || 0} XP</p>
                </div>
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Odslušano</p>
                  <p className="text-2xl font-bold text-blue-400">{selectedStudent.progress?.totalClassesAttended || 0}</p>
                </div>
              </div>
            </div>

            {/* Class History with this professor */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-white mb-4">Istorija Časova</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {schedule
                  .filter((c: any) => c.students.some((s: any) => s.studentId?._id === selectedStudent._id))
                  .map((cls: any) => {
                    const isUpcoming = cls.status === 'ZAKAZAN';
                    return (
                      <div key={cls._id} className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-xl">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-lg mr-3 ${isUpcoming ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                            {isUpcoming ? <Calendar className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{cls.courseName} Nivo</p>
                            <p className="text-xs text-slate-400">{cls.topic || 'Bez teme'}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {format(new Date(cls.startTime), 'dd. MMM yyyy. u HH:mm', { locale: srLatn })}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isUpcoming ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                            {isUpcoming ? 'ZAKAZAN' : 'ZAVRŠEN'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                }
                {schedule.filter((c: any) => c.students.some((s: any) => s.studentId?._id === selectedStudent._id)).length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">Ovaj učenik još uvek nije imao časove sa vama.</p>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
