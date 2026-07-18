import { useGetAnalyticsQuery } from '../../store/apiSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  BarChart as BarChartIcon, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { Navigate } from 'react-router-dom';

// Custom Tooltip za dark mode
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-xl">
        <p className="text-white font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data, isLoading } = useGetAnalyticsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Samo admin i superadmin
  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!data) {
    return <div className="text-slate-400 p-8 text-center">Nema podataka za prikaz analitike.</div>;
  }

  const { kpis, professorLeaderboard, chartData } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
          <BarChartIcon className="w-6 h-6 mr-3 text-primary" />
          Statistika i Analitika
        </h2>
        <p className="text-slate-400 mt-1">Pregled ključnih metrika platforme</p>
      </div>

      {/* KPI Kartice */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Ukupno Učenika</h3>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.totalStudents}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Aktivni Profesori</h3>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.totalProfessors}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Zakazani Časovi</h3>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.scheduledClasses}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-400">Održani Časovi</h3>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{kpis.completedClasses}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GLAVNI GRAFIKON (2/3 širine) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Aktivnost Časova (Nedeljna)</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.getDate()}.${d.getMonth() + 1}.`;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" name="Zakazani" dataKey="ZAKAZAN" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Održani" dataKey="ZAVRSEN" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" name="Otkazani" dataKey="OTKAZAN" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LEADERBOARD (1/3 širine) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Top 5 Profesora</h3>
          <p className="text-xs text-slate-400 mb-6 -mt-4">Rangiranje po održanim časovima</p>
          
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={professorLeaderboard} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="firstName" type="category" stroke="#64748b" fontSize={12} width={70} />
                <Tooltip cursor={{ fill: '#1e293b' }} content={<CustomTooltip />} />
                <Bar dataKey="completedCount" name="Održano Časova" radius={[0, 4, 4, 0]}>
                  {professorLeaderboard.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend tekstualan ispod */}
          <div className="mt-4 space-y-3">
            {professorLeaderboard.map((prof: any, i: number) => (
              <div key={prof._id} className="flex justify-between items-center text-sm">
                <span className="flex items-center text-slate-300">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${i === 0 ? 'bg-primary/20 text-primary' : 'bg-slate-800 text-slate-400'}`}>
                    {i + 1}
                  </span>
                  {prof.firstName} {prof.lastName}
                </span>
                <span className="font-bold text-white">{prof.completedCount}</span>
              </div>
            ))}
            {professorLeaderboard.length === 0 && (
              <p className="text-slate-500 text-center text-sm">Nema održanih časova još uvek.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
