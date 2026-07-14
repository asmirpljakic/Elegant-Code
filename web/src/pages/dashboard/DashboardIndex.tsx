import { useSelector } from 'react-redux';
import { useGetAnalyticsQuery, useGetScheduleQuery } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import StudentStats from "./StudentStats";
import ProfessorDashboard from "./ProfessorDashboard";
import StudentDashboard from "./StudentDashboard";
import { Loader2, Activity, Award, TrendingUp, Users, DollarSign, Calendar, Clock, Video, CheckCircle } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function DashboardIndex() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: analyticsData, isLoading: analyticsLoading } = useGetAnalyticsQuery(undefined, {
    skip: user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN',
    refetchOnMountOrArgChange: true
  });

  const { data: scheduleData, isLoading: scheduleLoading } = useGetScheduleQuery(undefined, {
    skip: user?.role !== 'UCENIK' && user?.role !== 'KLIJENT' && user?.role !== 'PROFESOR',
    pollingInterval: 5000,
    refetchOnFocus: true,
    refetchOnMountOrArgChange: true
  });

  if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
    if (analyticsLoading) {
      return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const { totalStudents = 0, scheduledClasses = 0, totalRevenue = 0, topStudent = null } = analyticsData?.kpis || {};
    const activities = analyticsData?.activities || [];
    const professorLeaderboard = analyticsData?.professorLeaderboard || [];
    const studentGrowth = analyticsData?.studentGrowth || [];

    return (
      <div className="space-y-6">
        {/* KPI KARTICE */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">Aktivni Učenici</h3>
              <p className="text-3xl font-bold text-white">{totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">Zakazani Časovi</h3>
              <p className="text-3xl font-bold text-primary">{scheduledClasses}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">Ukupna Zarada</h3>
              <p className="text-3xl font-bold text-white">€{totalRevenue.toLocaleString('de-DE')}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-slate-400 text-sm font-medium mb-1">Najaktivniji Učenik</h3>
              <p className="text-lg font-bold text-amber-400 truncate w-32" title={topStudent?.name || '-'}>
                {topStudent?.name || '-'}
              </p>
              <p className="text-xs text-slate-500">{topStudent ? `${topStudent.classes} časova` : 'Nema podataka'}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* GRAFIKON: RAST UČENIKA (2/3 širine) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 text-primary mr-2" />
              <h3 className="text-lg font-bold text-white">Rast broja učenika u ovoj godini</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="newStudents" name="Novi Učenici" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorStudents)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVITY FEED (1/3 širine) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col h-[390px]">
            <div className="flex items-center mb-6">
              <Activity className="w-5 h-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-bold text-white">Aktivnosti (Live)</h3>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {activities.length > 0 ? activities.map((act: any) => (
                <div key={act._id} className="relative pl-4 border-l-2 border-slate-800 pb-2 last:pb-0">
                  <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1"></div>
                  <p className="text-sm text-slate-300">{act.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{format(new Date(act.createdAt), 'dd. MMM yyyy. u HH:mm', { locale: srLatn })}</p>
                </div>
              )) : (
                <p className="text-slate-500 text-sm text-center mt-10">Nema zabeleženih aktivnosti.</p>
              )}
            </div>
          </div>
        </div>

        {/* TABELA ZARADE PROFESORA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Učinak i Zarada Profesora</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-sm font-medium text-slate-400">
                  <th className="pb-3 pl-2">Profesor</th>
                  <th className="pb-3 text-center">Održano Časova</th>
                  <th className="pb-3 text-right pr-4">Ukupna Zarada</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {professorLeaderboard.length > 0 ? professorLeaderboard.map((prof: any, idx: number) => (
                  <tr key={prof._id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 pl-2 font-medium text-white flex items-center">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold mr-3">
                        {idx + 1}
                      </div>
                      {prof.firstName} {prof.lastName}
                    </td>
                    <td className="py-4 text-center text-slate-300">
                      <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">{prof.completedCount} časova</span>
                    </td>
                    <td className="py-4 text-right pr-4 font-bold text-emerald-400">
                      €{prof.earnings.toLocaleString('de-DE')}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">Nema podataka o održanim časovima.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'UCENIK') {
    if (scheduleLoading) {
      return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const now = new Date();
    
    // Sortiranje i filtriranje
    const allClasses = scheduleData || [];
    const upcomingClasses = allClasses
      .filter((c: any) => c.status === 'ZAKAZAN' && isAfter(new Date(c.startTime), now))
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    const pastClasses = allClasses
      .filter((c: any) => c.status === 'ZAVRSEN')
      .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5); // Prikazujemo samo poslednjih 5
      
    const nextClass = upcomingClasses[0];

    return (
      <div className="max-w-5xl space-y-8">
        <StudentStats />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* SLEDEĆI ČAS KARTICA */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-bold text-white mb-4">Sledeći Čas</h3>
            {nextClass ? (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-primary/30 rounded-3xl p-6 relative overflow-hidden shadow-lg shadow-primary/5">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <div className="w-32 h-32 rounded-full bg-primary absolute -top-10 -right-10 blur-2xl"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold mb-4">
                    <Clock className="w-3 h-3 mr-1" /> Uskoro
                  </div>
                  
                  <h4 className="text-xl font-bold text-white mb-1">{nextClass.courseName} Nivo</h4>
                  <p className="text-sm text-slate-400 mb-4">{nextClass.topic || 'Tema nije definisana'}</p>
                  
                  <div className="bg-slate-950/50 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-white mb-1">
                      {format(new Date(nextClass.startTime), 'EEEE, dd. MMMM', { locale: srLatn })}
                    </p>
                    <p className="text-primary font-bold text-lg">
                      {format(new Date(nextClass.startTime), 'HH:mm')}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Profesor: {nextClass.profesorId?.firstName} {nextClass.profesorId?.lastName}</p>
                  </div>
                  
                  {nextClass.meetingLink ? (
                    <a href={nextClass.meetingLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 text-slate-950 font-bold py-3 px-4 rounded-xl transition-colors">
                      <Video className="w-5 h-5 mr-2" />
                      Pridruži se času
                    </a>
                  ) : (
                    <button disabled className="w-full bg-slate-800 text-slate-500 font-bold py-3 px-4 rounded-xl cursor-not-allowed">
                      Link još nije dodat
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-white font-medium mb-1">Nema zakazanih časova</h4>
                <p className="text-sm text-slate-500">Svi tvoji časovi su završeni. Očekuj novi termin uskoro!</p>
              </div>
            )}
          </div>
          
          {/* ISTORIJA ČASOVA */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Istorija Održanih Časova</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <th className="py-4 pl-6">Datum i Vreme</th>
                      <th className="py-4">Tema</th>
                      <th className="py-4">Profesor</th>
                      <th className="py-4 text-center pr-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {pastClasses.length > 0 ? pastClasses.map((c: any) => (
                      <tr key={c._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors last:border-0">
                        <td className="py-4 pl-6 font-medium text-white">
                          {format(new Date(c.startTime), 'dd. MMM yyyy.', { locale: srLatn })}
                          <span className="block text-xs text-slate-500 font-normal">
                            {format(new Date(c.startTime), 'HH:mm')}
                          </span>
                        </td>
                        <td className="py-4 text-slate-300">
                          {c.topic || '-'}
                        </td>
                        <td className="py-4 text-slate-400">
                          {c.profesorId?.firstName} {c.profesorId?.lastName}
                        </td>
                        <td className="py-4 pr-6 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-500">
                            Završen (+100 XP)
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                            <Clock className="w-6 h-6" />
                          </div>
                          <p className="text-slate-400 text-sm">Još uvek nemaš održanih časova.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    );
  }

  if (user?.role === 'PROFESOR') {
    return <ProfessorDashboard />;
  }

  if (user?.role === 'UCENIK' || user?.role === 'KLIJENT') {
    return <StudentDashboard />;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
      <h2 className="text-xl font-bold text-white mb-2">Dobrodošli u Elegant Code</h2>
      <p className="text-slate-400">Vaš nalog trenutno nema dodeljene specifične opcije (Gost). Kontaktirajte administratora.</p>
    </div>
  );
}

