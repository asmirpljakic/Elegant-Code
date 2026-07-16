import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetScheduleQuery, useCreateClassMutation, useCompleteClassMutation, useCancelClassMutation, useGetUsersQuery, useUpdateClassMutation, useDeleteClassMutation, useDeleteCompletedClassesMutation } from '../../store/apiSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock, Video, Users, User as UserIcon, CheckCircle2, Plus, X, Loader2, ChevronLeft, ChevronRight, List, Edit, Trash2, Search, Filter } from 'lucide-react';
import { format, addDays, subDays, isSameDay, startOfDay, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { srLatn } from 'date-fns/locale';

export default function Schedule() {
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Ovo primorava React da se osveži svakih 10 sekundi kako bi preračunao da li je "30 min pred čas"
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const { user } = useSelector((state: RootState) => state.auth);
  const { data: schedule, isLoading } = useGetScheduleQuery(undefined, {
    pollingInterval: 5000, // Smanjeno na 5 sekundi za pravi "Live" doživljaj
    skipPollingIfUnfocused: false, 
    refetchOnFocus: true, 
    refetchOnReconnect: true 
  });
  const { data: allUsers } = useGetUsersQuery({ limit: 1000 }, {
    skip: user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN' && user?.role !== 'PROFESOR'
  });
  
  const [createClass, { isLoading: isCreating }] = useCreateClassMutation();
  const [completeClass, { isLoading: isCompleting }] = useCompleteClassMutation();
  const [cancelClass, { isLoading: isCanceling }] = useCancelClassMutation();
  const [updateClass, { isLoading: isUpdating }] = useUpdateClassMutation();
  const [deleteClass, { isLoading: isDeleting }] = useDeleteClassMutation();
  const [deleteCompletedClasses, { isLoading: isDeletingCompleted }] = useDeleteCompletedClassesMutation();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isClassDetailsModalOpen, setIsClassDetailsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  // Filter state for SuperAdmin/Admin
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Novi filteri za Status i Link
  const [filterStatus, setFilterStatus] = useState<'SVI' | 'ZAKAZAN' | 'ZAVRSEN' | 'OTKAZAN'>('SVI');
  const [filterLink, setFilterLink] = useState<'SVI' | 'IMA_LINK' | 'NEMA_LINK'>('SVI');


  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR_DAY'>('CALENDAR_DAY');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

  // Form states for creating class
  const [courseName, setCourseName] = useState('OSNOVNI');
  const [profesorId, setProfesorId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [topic, setTopic] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Novi state za ponavljajuće časove
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<{ dayOfWeek: number; startTime: string; endTime: string; }[]>([]);
  const [untilDate, setUntilDate] = useState('');
  
  // Specific states for recurring time (zadržavamo startDate zbog izračunavanja početne nedelje)
  const [recurringStartDate, setRecurringStartDate] = useState('');

  // Form states for completing class
  const [presentStudents, setPresentStudents] = useState<string[]>([]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalStartTime, finalEndTime;

      if (isRecurring) {
        // Backend expects startTime to define the DATE when the cycle starts
        // We can just pass the recurringStartDate with a default time, backend logic will override time
        finalStartTime = new Date(`${recurringStartDate}T00:00:00`).toISOString();
        finalEndTime = new Date(`${recurringStartDate}T23:59:59`).toISOString();
      } else {
        finalStartTime = new Date(startTime).toISOString();
        finalEndTime = new Date(endTime).toISOString();
      }

      await createClass({
        courseName,
        profesorId: user?.role === 'PROFESOR' ? user.id : profesorId,
        startTime: finalStartTime,
        endTime: finalEndTime,
        topic,
        meetingLink,
        studentIds: selectedStudents,
        isRecurring: isRecurring ? true : undefined,
        recurringDays: isRecurring ? recurringDays : undefined,
        untilDate: isRecurring && untilDate ? new Date(untilDate).toISOString() : undefined
      }).unwrap();
      setIsCreateModalOpen(false);
      
      // Reset form
      setTopic('');
      setMeetingLink('');
      setSelectedStudents([]);
      setIsRecurring(false);
      setRecurringDays([]);
      setUntilDate('');
      setRecurringStartDate('');
    } catch (error) {
      console.error(error);
      alert('Greška pri kreiranju časa');
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    try {
      await completeClass({
        id: selectedClass._id,
        presentStudentIds: presentStudents
      }).unwrap();
      setIsClassDetailsModalOpen(false);
      setSelectedClass(null);
    } catch (error) {
      console.error(error);
      alert('Greška pri završavanju časa');
    }
  };

  const openClassDetailsModal = (cls: any) => {
    setSelectedClass(cls);
    setPresentStudents(cls.students.map((s: any) => s.studentId?._id).filter(Boolean)); // Default svi prisutni
    // Ako zelimo da imamo formu za update, popunjavamo
    setTopic(cls.topic || '');
    setMeetingLink(cls.meetingLink || '');
    setCancelReason('');
    setStartTime(cls.startTime);
    setEndTime(cls.endTime);
    setIsClassDetailsModalOpen(true);
  };

  const handleDelete = async (deleteAll: boolean) => {
    if (!selectedClass || !window.confirm('Da li ste sigurni da želite da obrišete čas(ove)?')) return;
    try {
      await deleteClass({ id: selectedClass._id, all: deleteAll }).unwrap();
      setIsClassDetailsModalOpen(false);
    } catch (error) {
      alert('Greška pri brisanju časa');
    }
  };

  const handleCancel = async () => {
    if (!selectedClass || !window.confirm('Da li ste sigurni da želite da OTKAŽETE ovaj čas? Učenicima će automatski biti dodat 1 čas za nadoknadu.')) return;
    try {
      await cancelClass({ id: selectedClass._id, reason: cancelReason }).unwrap();
      setIsClassDetailsModalOpen(false);
    } catch (error: any) {
      console.error(error);
      alert(error.data?.error || 'Greška pri otkazivanju časa');
    }
  };

  const handleUpdate = async () => {
    if (!selectedClass) return;
    const updateAll = window.confirm('Da li želite da primenite ovu izmenu (Teme i Linka) na ceo predstojeći ciklus? (Odbijte ako menjate samo ovaj jedan čas)');
    try {
      await updateClass({
        id: selectedClass._id,
        all: updateAll,
        data: { topic, meetingLink, startTime, endTime }
      }).unwrap();
      setIsClassDetailsModalOpen(false);
    } catch (error) {
      alert('Greška pri izmeni časa');
    }
  };

  // Filtriranje rasporeda
  const filteredSchedule = schedule?.filter((cls: any) => {
    // 1. Status Filter
    if (filterStatus === 'ZAKAZAN' && cls.status !== 'ZAKAZAN') return false;
    if (filterStatus === 'ZAVRSEN' && cls.status !== 'ZAVRSEN') return false;
    if (filterStatus === 'OTKAZAN' && cls.status !== 'OTKAZAN') return false;

    // 2. Link Filter
    if (filterLink === 'IMA_LINK' && (!cls.meetingLink || cls.meetingLink.trim() === '')) return false;
    if (filterLink === 'NEMA_LINK' && cls.meetingLink && cls.meetingLink.trim() !== '') return false;

    // 3. Role/User Filter (Samo za Admin/SuperAdmin)
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') {
      // Za Admina/SuperAdmina ne prikazujemo NIŠTA dok ne izaberu konkretnog profesora ili učenika
      if (!filterUserId || filterUserId === 'ALL') return false;
      
      const isProf = cls.profesorId?._id === filterUserId;
      const isStudent = cls.students?.some((s: any) => s.studentId?._id === filterUserId);
      
      if (!isProf && !isStudent) return false;
    }
    
    return true;
  });

  // Paginacija i sortiranje za LIST prikaz
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const sortedList = filteredSchedule ? [...filteredSchedule].sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    
    const isPastA = timeA < now;
    const isPastB = timeB < now;

    // Ako je jedan prošao a drugi nije, predstojeći (nije prošao) ide pre onog iz prošlosti
    if (isPastA && !isPastB) return 1;
    if (!isPastA && isPastB) return -1;

    // Ako su oba predstojeća, sortiraj po datumu rastuće (najbliži ide prvi, pa oni kasniji)
    if (!isPastA && !isPastB) {
      return timeA - timeB;
    }

    // Ako su oba iz prošlosti, sortiraj po datumu opadajuće (najskorije završeni idu pre onih od prošle nedelje)
    return timeB - timeA;
  }) : [];
  const totalPages = Math.ceil(sortedList.length / itemsPerPage);
  const currentList = sortedList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dodatno filtriranje za nedeljni kalendar (ovde koristimo originalni filteredSchedule jer kalendar traži po datumima održavanja)
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyClasses = filteredSchedule?.filter((cls: any) => {
    return isWithinInterval(new Date(cls.startTime), { start: weekStart, end: weekEnd });
  });

  // Radni sati za kalendar (od 08:00 do 22:00)
  const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

  // Algoritam za preklapanje časova
  const classesWithLayout = useMemo(() => {
    if (!weeklyClasses) return [];
    const classesByDay: { [key: number]: any[] } = {};
    
    weeklyClasses.forEach((cls: any) => {
      const startDate = new Date(cls.startTime);
      const dayIndex = weekDays.findIndex(d => isSameDay(d, startDate));
      if (dayIndex !== -1) {
        if (!classesByDay[dayIndex]) classesByDay[dayIndex] = [];
        classesByDay[dayIndex].push({ ...cls });
      }
    });
    
    const result: any[] = [];
    Object.keys(classesByDay).forEach(dayIndex => {
      const dayClasses = classesByDay[Number(dayIndex)];
      dayClasses.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      
      const columns: any[][] = [];
      dayClasses.forEach(cls => {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const lastClassInCol = columns[i][columns[i].length - 1];
          // Provera da li se preklapaju - ako novi pocinje tačno kad stari završi ili kasnije, onda mogu u istu kolonu
          if (new Date(lastClassInCol.endTime).getTime() <= new Date(cls.startTime).getTime()) {
            columns[i].push(cls);
            cls._column = i;
            placed = true;
            break;
          }
        }
        if (!placed) {
          columns.push([cls]);
          cls._column = columns.length - 1;
        }
      });
      
      dayClasses.forEach(cls => {
        cls._totalColumns = columns.length;
        cls._dayIndex = Number(dayIndex);
        result.push(cls);
      });
    });
    return result;
  }, [weeklyClasses, weekDays]);

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="relative z-50 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Raspored Časova</h2>
          <p className="text-slate-400 mt-1">Zakazani termini i upravljanje časovima</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => { setViewMode('LIST'); setCurrentPage(1); }}
              className={`p-2 rounded-lg flex items-center transition-colors ${viewMode === 'LIST' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`}
              title="Lista Prikaz"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('CALENDAR_DAY')}
              className={`p-2 rounded-lg flex items-center transition-colors ${viewMode === 'CALENDAR_DAY' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:text-white'}`}
              title="Dnevni Kalendar"
            >
              <Calendar className="w-5 h-5" />
            </button>
          </div>

          {/* Filter za Admine sa pretragom */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
            <div className="relative z-20 min-w-[280px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Pretraži profesora ili učenika..."
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
                    .filter(u => u.role !== 'GOST')
                    .filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase()))
                    .map(u => (
                      <button
                        key={u._id}
                        onClick={() => {
                          setFilterUserId(u._id);
                          setUserSearchTerm(`${u.firstName} ${u.lastName}`);
                          setIsUserDropdownOpen(false);
                          if (viewMode === 'LIST') setViewMode('CALENDAR_DAY');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors flex flex-col border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-sm font-medium text-white">{u.firstName} {u.lastName}</span>
                        <span className="text-xs text-slate-400">
                          {u.role === 'PROFESOR' ? 'Profesor' : u.role === 'ADMIN' || u.role === 'SUPER_ADMIN' ? 'Admin' : 'Učenik'}
                        </span>
                      </button>
                    ))}
                  {allUsers.users.filter(u => u.role !== 'GOST').filter(u => `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
                    <div className="px-4 py-3 text-sm text-slate-400 text-center">Nema rezultata</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Filteri za status i link */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="SVI">Svi statusi</option>
              <option value="ZAKAZAN">Zakazani</option>
              <option value="ZAVRSEN">Završeni</option>
              <option value="OTKAZAN">Otkazani</option>
            </select>
            
            <select
              value={filterLink}
              onChange={(e) => setFilterLink(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="SVI">Svi linkovi</option>
              <option value="IMA_LINK">Ima Meet Link</option>
              <option value="NEMA_LINK">Nema Link</option>
            </select>
          </div>

          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROFESOR') && (
            <Button onClick={() => {
              // Izračunaj sledeći pun sat za podrazumevano vreme
              const now = new Date();
              const nextHour = new Date(now);
              nextHour.setHours(now.getHours() + 1, 0, 0, 0);
              const nextTwoHours = new Date(nextHour);
              nextTwoHours.setHours(nextHour.getHours() + 1);
              
              // Pretvori u lokalno vreme formata YYYY-MM-DDTHH:mm
              const offset = now.getTimezoneOffset() * 60000;
              const localNextHour = new Date(nextHour.getTime() - offset).toISOString().slice(0, 16);
              const localNextTwoHours = new Date(nextTwoHours.getTime() - offset).toISOString().slice(0, 16);
              const localDateOnly = new Date(now.getTime() - offset).toISOString().slice(0, 10);

              // Reset svih polja forme
              setCourseName('OSNOVNI');
              setProfesorId('');
              setStartTime(localNextHour);
              setEndTime(localNextTwoHours);
              setTopic('');
              setMeetingLink('');
              setSelectedStudents([]);
              setIsRecurring(false);
              setRecurringDays([]);
              setUntilDate('');
              setRecurringStartDate(localDateOnly);
              setIsCreateModalOpen(true);
            }} className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Zakaži Čas
            </Button>
          )}

          {/* Dugme za nadoknadu */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROFESOR') && (
            <Button 
              onClick={() => navigate('/dashboard/makeup-schedule')}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transform hover:scale-105 active:scale-95"
            >
              <Calendar className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Zakaži Nadoknadu</span>
            </Button>
          )}

          {/* Dugme za brisanje svih završenih */}
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROFESOR') && (
            <Button 
              onClick={async () => {
                if (window.confirm('Da li ste sigurni da želite obrisati SVE završene časove iz baze? Ovo se ne može poništiti.')) {
                  try {
                    await deleteCompletedClasses().unwrap();
                  } catch (error) {
                    alert('Došlo je do greške pri brisanju.');
                  }
                }
              }}
              variant="outline"
              isLoading={isDeletingCompleted}
              className="flex items-center border-red-500/50 text-red-400 hover:bg-red-500/10"
              title="Obriši sve završene časove"
            >
              <Trash2 className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Očisti Završene</span>
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'LIST' ? (
        <>
          <div className="grid gap-4">
            {!currentList || currentList.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Nema zakazanih časova</h3>
                <p className="text-slate-400">Trenutno nemate nijedan čas u rasporedu.</p>
              </div>
            ) : (
              currentList.map((cls) => (
                <div key={cls._id} className={`bg-slate-900 border rounded-2xl p-6 transition-all ${
                  cls.status === 'ZAVRSEN' ? 'border-slate-800 opacity-75' : 
                  cls.isMakeup ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]' :
                  'border-primary/20 hover:border-primary/40'
                }`}>
                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                            cls.status === 'ZAVRSEN' ? 'bg-slate-800 text-slate-400' : 'bg-primary/20 text-primary'
                          }`}>
                            {cls.courseName}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                            cls.status === 'ZAVRSEN' ? 'bg-slate-800 text-slate-400' : 
                            cls.status === 'OTKAZAN' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {cls.status}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-white">{cls.topic || `Čas - ${cls.courseName}`}</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center text-slate-300">
                          <Clock className="w-5 h-5 text-slate-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium">{format(new Date(cls.startTime), 'EEEE, d. MMMM', { locale: srLatn })}</p>
                            <p className="text-xs text-slate-400">{format(new Date(cls.startTime), 'HH:mm')} - {format(new Date(cls.endTime), 'HH:mm')}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-slate-300">
                          <UserIcon className="w-5 h-5 text-slate-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium">Profesor</p>
                            <p className="text-xs text-slate-400">{cls.profesorId?.firstName} {cls.profesorId?.lastName}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                      {cls.status === 'ZAVRSEN' || cls.status === 'OTKAZAN' || !cls.meetingLink || cls.meetingLink.trim() === '' ? (
                        <Button disabled className="w-full flex items-center justify-center bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700">
                          <Video className="w-4 h-4 mr-2 opacity-50" />
                          Link još nije dodat
                        </Button>
                      ) : (
                        (user?.role !== 'UCENIK' || (new Date(cls.startTime).getTime() - now <= 30 * 60 * 1000)) ? (
                          <a href={cls.meetingLink} target="_blank" rel="noreferrer" className="w-full">
                            <Button className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                              <Video className="w-4 h-4 mr-2" />
                              Pristupi Času
                            </Button>
                          </a>
                        ) : (
                          <Button disabled className="w-full flex items-center justify-center bg-slate-800 text-slate-500 cursor-not-allowed">
                            <Clock className="w-4 h-4 mr-2" />
                            Link uskoro dostupan
                          </Button>
                        )
                      )}
                      
                      {cls.status !== 'ZAVRSEN' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.id === cls.profesorId?._id) && (
                        <Button 
                          variant="outline"
                          onClick={() => openClassDetailsModal(cls)}
                          className="w-full flex items-center justify-center border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-500 transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-2 text-slate-300" />
                          Upravljaj / Završi
                        </Button>
                      )}

                      {cls.status === 'OTKAZAN' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            if (window.confirm('Da li ste sigurni da želite obrisati ovaj otkazani čas? Ovo se ne može poništiti.')) {
                              try {
                                await deleteClass({ id: cls._id }).unwrap();
                              } catch (error) {
                                alert('Greška pri brisanju časa');
                              }
                            }
                          }}
                          className="w-full flex items-center justify-center border-red-500/50 text-red-500 hover:bg-red-500/10 mt-2"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Obriši Otkazani Čas
                        </Button>
                      )}


                      {cls.status === 'ZAVRSEN' && (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.id === cls.profesorId?._id) && (
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            if (window.confirm('Da li ste sigurni da želite obrisati ovaj završeni čas? Ovo se ne može poništiti.')) {
                              try {
                                await deleteClass({ id: cls._id }).unwrap();
                              } catch (error) {
                                alert('Greška pri brisanju časa');
                              }
                            }
                          }}
                          className="w-full flex items-center justify-center border-red-500/50 text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Obriši Čas
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Prikaz učenika za profesora/admina */}
                  {(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'PROFESOR') && (
                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <div className="flex items-center text-slate-400 mb-3">
                        <Users className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Učenici ({cls.students?.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cls.students?.map((s: any) => (
                          <span key={s.studentId?._id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
                            {s.studentId?.firstName} {s.studentId?.lastName}
                            {cls.status === 'ZAVRSEN' && (
                              <span className={`ml-2 w-2 h-2 rounded-full ${s.attended ? 'bg-primary' : 'bg-red-500'}`} title={s.attended ? 'Prisutan' : 'Odsutan'}></span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          {/* Paginacija Kontrole */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-800">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4"
              >
                Prethodna
              </Button>
              <span className="text-slate-400 font-medium">
                Stranica {currentPage} od {totalPages}
              </span>
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4"
              >
                Sledeća
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col">
          {/* Header Kalendara */}
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <button onClick={() => setSelectedDate(subDays(selectedDate, 7))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white capitalize">
                Nedelja: {format(weekStart, 'd. MMM')} - {format(weekEnd, 'd. MMM yyyy.', { locale: srLatn })}
              </h3>
            </div>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Kalendar Mreža (Grid) */}
          <div className="relative overflow-y-auto h-[650px] bg-slate-950 px-2 md:px-4 pb-4 rounded-b-3xl">
            <div className="relative min-w-[800px]">
              {/* Header sa imenima dana */}
              <div className="flex pl-16 border-b border-slate-800 h-16 sticky top-0 bg-slate-950/95 backdrop-blur z-20 shadow-sm items-center">
                {weekDays.map((day, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <p className="text-xs font-medium text-slate-400 capitalize mb-0.5">{format(day, 'EEE', { locale: srLatn })}</p>
                    <p className={`text-base font-bold leading-none ${isSameDay(day, new Date()) ? 'text-primary' : 'text-slate-300'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Pozadinske linije za sate */}
              {HOURS.map((hour, i) => (
                <div key={hour} className={`flex border-b border-slate-800/50 h-20 relative ${i === 0 ? 'mt-6' : ''}`}>
                  <div className="w-16 flex-shrink-0 text-right pr-4 text-xs font-medium text-slate-500 -mt-2">
                    {hour.toString().padStart(2, '0')}:00
                  </div>
                  {/* Vertikalne linije za svaki dan */}
                  {weekDays.map((_, idx) => (
                    <div key={idx} className="flex-1 border-l border-slate-800/30"></div>
                  ))}
                </div>
              ))}

              {/* Blokovi za Časove */}
              {classesWithLayout?.map((cls: any) => {
                const startDate = new Date(cls.startTime);
                const endDate = new Date(cls.endTime);
                
                const startHour = startDate.getHours();
                const startMin = startDate.getMinutes();
                const durationMinutes = (endDate.getTime() - startDate.getTime()) / 60000;
                
                const dayIndex = weekDays.findIndex(d => isSameDay(d, startDate));
                if (dayIndex === -1) return null;

                if (startHour < 8 || startHour >= 23) return null;

                const topPosition = (startHour - 8) * 80 + (startMin / 60) * 80 + 88; 
                const height = (durationMinutes / 60) * 80;
                
                const leftRatio = cls._dayIndex / 7;
                const totalCols = cls._totalColumns || 1;
                const col = cls._column || 0;
                
                const colWidth = `((100% - 4rem) / 7)`;
                const overlapWidth = `calc(${colWidth} / ${totalCols} - 6px)`;
                const overlapLeftOffset = `calc(${colWidth} / ${totalCols} * ${col})`;

                return (
                  <div 
                    key={cls._id}
                    className="absolute rounded-xl border border-primary/20 overflow-hidden shadow-lg hover:shadow-primary/10 transition-shadow cursor-pointer flex flex-col justify-between"
                    style={{ 
                      top: `${topPosition}px`, 
                      height: `${height}px`,
                      left: `calc(4rem + (100% - 4rem) * ${leftRatio} + ${overlapLeftOffset} + 3px)`, 
                      width: overlapWidth,
                      zIndex: 10,
                      backgroundColor: cls.status === 'ZAVRSEN' ? 'rgba(30, 41, 59, 0.9)' : 
                                       cls.status === 'OTKAZAN' ? 'rgba(239, 68, 68, 0.1)' : 
                                       cls.isMakeup ? 'rgba(59, 130, 246, 0.15)' :
                                       'rgba(16, 185, 129, 0.1)',
                      borderColor: cls.isMakeup ? 'rgba(59, 130, 246, 0.4)' : undefined,
                      backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => {
                      if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.id === cls.profesorId?._id) {
                        openClassDetailsModal(cls);
                      }
                    }}
                  >
                    <div className="p-3 flex flex-col h-full items-center justify-center text-center">
                      <div className="mb-2 w-full">
                        <span className="text-xs font-bold text-slate-200 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-700/50 shadow-sm inline-flex items-center justify-center w-fit">
                          <span className="mr-1">🕒</span> {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 w-full items-center">
                        {cls.students && cls.students.length > 0 ? (
                          cls.students.map((s: any) => (
                            <p key={s.studentId?._id} className="text-base font-bold text-white truncate w-full px-1">
                              {s.studentId?.firstName} {s.studentId?.lastName}
                            </p>
                          ))
                        ) : (
                          <p className="text-xs font-medium text-slate-400 italic">Slobodan termin</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <h3 className="text-xl font-bold text-white">Zakaži Novi Čas</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Paket/Kurs</label>
                  <select 
                    value={courseName} onChange={(e) => setCourseName(e.target.value)} required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="OSNOVNI">Osnovni Paket</option>
                    <option value="SREDNJI">Srednji Paket</option>
                    <option value="NAPREDNI">Napredni Paket</option>
                  </select>
                </div>
                {user?.role !== 'PROFESOR' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Profesor</label>
                    <select 
                      value={profesorId} onChange={(e) => setProfesorId(e.target.value)} required
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="">Izaberi profesora</option>
                      {allUsers?.users?.filter(u => ['PROFESOR', 'ADMIN', 'SUPER_ADMIN'].includes(u.role)).map(u => (
                        <option key={u._id} value={u._id}>{u.firstName} {u.lastName} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* SEKCIJA ZA PONAVLJAJUĆE ČASOVE */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6">
                <label className="flex items-center cursor-pointer mb-4">
                  <input 
                    type="checkbox" 
                    checked={isRecurring} 
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 text-primary focus:ring-primary bg-slate-900"
                  />
                  <span className="ml-3 font-semibold text-white">Ovo je ponavljajući čas (Ciklus)</span>
                </label>

                {isRecurring && (
                  <div className="space-y-6 pt-4 border-t border-slate-700 mt-4">
                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-2">Ponavlja se ovim danima u nedelji:</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 1, label: 'Pon' }, { id: 2, label: 'Uto' }, { id: 3, label: 'Sre' },
                          { id: 4, label: 'Čet' }, { id: 5, label: 'Pet' }, { id: 6, label: 'Sub' }, { id: 0, label: 'Ned' }
                        ].map(day => {
                          const isSelected = recurringDays.some(d => d.dayOfWeek === day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setRecurringDays(recurringDays.filter(d => d.dayOfWeek !== day.id));
                                } else {
                                  setRecurringDays([...recurringDays, { dayOfWeek: day.id, startTime: '18:00', endTime: '19:00' }]);
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected 
                                ? 'bg-primary text-white shadow-lg shadow-primary/25' 
                                : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {recurringDays.length > 0 && (
                      <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-semibold text-slate-300">Podesi vreme za izabrane dane:</h4>
                        {recurringDays.map(rd => {
                          const dayName = [
                            'Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota'
                          ][rd.dayOfWeek];
                          
                          return (
                            <div key={rd.dayOfWeek} className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                              <div className="w-24 font-medium text-primary">{dayName}</div>
                              <div className="flex-1 grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Početak</label>
                                  <input 
                                    type="time" 
                                    value={rd.startTime} 
                                    step="3600"
                                    onChange={(e) => {
                                      const newStart = e.target.value;
                                      setRecurringDays(recurringDays.map(d => {
                                        if (d.dayOfWeek === rd.dayOfWeek) {
                                          let newEnd = d.endTime;
                                          if (newStart) {
                                            const [h, m] = newStart.split(':').map(Number);
                                            const endH = (h + 1) % 24;
                                            newEnd = `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                          }
                                          return { ...d, startTime: newStart, endTime: newEnd };
                                        }
                                        return d;
                                      }));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Kraj</label>
                                  <input 
                                    type="time" 
                                    value={rd.endTime} 
                                    step="3600"
                                    onChange={(e) => {
                                      setRecurringDays(recurringDays.map(d => 
                                        d.dayOfWeek === rd.dayOfWeek ? { ...d, endTime: e.target.value } : d
                                      ));
                                    }}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-primary outline-none"
                                    required
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Početni datum ciklusa</label>
                        <input 
                          type="date" 
                          value={recurringStartDate} 
                          onChange={(e) => setRecurringStartDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                          required={isRecurring}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Ponavljaj do (Opciono)</label>
                        <input 
                          type="date" 
                          value={untilDate} 
                          onChange={(e) => setUntilDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Početak (Datum i Vreme)</label>
                    <input 
                      type="datetime-local" 
                      value={startTime} 
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setStartTime(newStart);
                        if (newStart) {
                          const startDate = new Date(newStart);
                          startDate.setHours(startDate.getHours() + 1);
                          const offset = startDate.getTimezoneOffset() * 60000;
                          setEndTime(new Date(startDate.getTime() - offset).toISOString().slice(0, 16));
                        }
                      }} 
                      required={!isRecurring}
                      step="3600"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Kraj (Datum i Vreme)</label>
                    <input 
                      type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required={!isRecurring}
                      step="3600"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tema časa (Opciono)</label>
                <input 
                  type="text" placeholder="Npr. Uvod u JavaScript nizove" value={topic} onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* Prikaz polja za link samo ako NIJE ponavljajući čas */}
              {!isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Link za pristup (Meet/Zoom)</label>
                  <input 
                    type="url" 
                    value={meetingLink} 
                    onChange={(e) => setMeetingLink(e.target.value)}
                    disabled={user?.role === 'PROFESOR' && startTime ? (new Date(startTime).getTime() - now > 30 * 60 * 1000) : false}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                  />
                  {user?.role === 'PROFESOR' && startTime && (new Date(startTime).getTime() - now > 30 * 60 * 1000) && (
                    <p className="text-xs text-amber-500 mt-1">Sistem automatski generiše link 30 min pre časa.</p>
                  )}
                </div>
              )}



              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Učenici ({selectedStudents.length} izabrano)</label>
                <div className="max-h-40 overflow-y-auto bg-slate-800 border border-slate-700 rounded-xl p-2 space-y-1">
                  {allUsers?.users?.filter(u => {
                    const isUcenik = u.role === 'UCENIK' || u.role === 'KLIJENT';
                    // Proverava da li učenik ima bilo kakav ZAKAZAN čas u rasporedu
                    const isBusy = schedule?.some((cls: any) => 
                      cls.status === 'ZAKAZAN' && 
                      cls.students.some((s: any) => s.studentId?._id === u._id)
                    );
                    return isUcenik && !isBusy;
                  }).map(u => (
                    <label key={u._id} className="flex items-center px-3 py-2 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary bg-slate-900"
                        checked={selectedStudents.includes(u._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStudents([...selectedStudents, u._id]);
                          else setSelectedStudents(selectedStudents.filter(id => id !== u._id));
                        }}
                      />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-slate-400">{u.activePackage}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <Button type="submit" isLoading={isCreating} className="w-full py-4">
                  Sačuvaj Čas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS DETAILS MODAL (Edit/Delete/Complete) */}
      {isClassDetailsModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
              <h3 className="text-xl font-bold text-white">Upravljanje Časom</h3>
              <button onClick={() => setIsClassDetailsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Sekcija 1: Osnovni podaci časa (Read Only) */}
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <h4 className="text-sm font-semibold text-slate-400 mb-2">Informacije o času</h4>
                <p className="text-white font-bold text-lg mb-1">{selectedClass.topic || selectedClass.courseName}</p>
                <p className="text-sm text-slate-300">Profesor: {selectedClass.profesorId?.firstName} {selectedClass.profesorId?.lastName}</p>
                <p className="text-sm text-slate-300">Vreme: {format(new Date(selectedClass.startTime), 'dd.MM.yyyy. HH:mm')} - {format(new Date(selectedClass.endTime), 'HH:mm')}</p>
              </div>

              {/* Sekcija 2: Editovanje Teme i Linka */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-400">
                  {selectedClass.status === 'OTKAZAN' ? 'Razlog Otkazivanja' : 'Izmena Detalja'}
                </h4>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    {selectedClass.status === 'OTKAZAN' ? 'Unesite razlog otkazivanja' : 'Tema časa'}
                  </label>
                  <input 
                    type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder={selectedClass.status === 'OTKAZAN' ? "Npr. Bolest profesora" : ""}
                  />
                </div>
                {/* Ako je čas OTKAZAN, profesori ne mogu da menjaju link (ali admini mogu) */}
                {!(selectedClass.status === 'OTKAZAN' && user?.role === 'PROFESOR') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Link za pristup</label>
                    <input 
                      type="url" value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={user?.role === 'PROFESOR' && selectedClass && (new Date(selectedClass.startTime).getTime() - now > 30 * 60 * 1000)}
                    />
                    {user?.role === 'PROFESOR' && selectedClass && (new Date(selectedClass.startTime).getTime() - now > 30 * 60 * 1000) && (
                      <p className="text-xs text-amber-500 mt-1">Sistem automatski generiše link 30 min pre časa.</p>
                    )}
                  </div>
                )}
                <Button onClick={handleUpdate} isLoading={isUpdating} variant="outline" className="w-full">
                  Sačuvaj {selectedClass.status === 'OTKAZAN' ? 'Razlog' : 'Izmene'}
                </Button>
              </div>

              {/* Sekcija 3: Završetak časa (Ako nije završen ni otkazan) */}
              {selectedClass.status !== 'ZAVRSEN' && selectedClass.status !== 'OTKAZAN' && (
                <div className="space-y-4 pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-primary">Završi Čas (Dodela XP-a)</h4>
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                    <p className="text-xs text-primary font-medium">Označi prisutne učenike:</p>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {selectedClass.students.map((s: any) => (
                      <label key={s.studentId._id} className="flex items-center px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-slate-600 text-primary bg-slate-900"
                          checked={presentStudents.includes(s.studentId._id)}
                          onChange={(e) => {
                            if (e.target.checked) setPresentStudents([...presentStudents, s.studentId._id]);
                            else setPresentStudents(presentStudents.filter(id => id !== s.studentId._id));
                          }}
                        />
                        <span className="ml-3 text-sm text-white font-medium">{s.studentId.firstName} {s.studentId.lastName}</span>
                      </label>
                    ))}
                  </div>
                  <Button onClick={handleCompleteSubmit} isLoading={isCompleting} className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Potvrdi Završetak
                  </Button>
                </div>
              )}

              {/* Sekcija 3.5: Otkazivanje časa (Dodela nadoknade) */}
              {selectedClass.status !== 'ZAVRSEN' && selectedClass.status !== 'OTKAZAN' && (
                <div className="pt-6 border-t border-slate-800">
                  <h4 className="text-sm font-semibold text-orange-400 mb-3">Otkazivanje časa (Nadoknada)</h4>
                  <p className="text-xs text-slate-400 mb-4">Ako otkažete čas, on ostaje u bazi kao "OTKAZAN", a svim učenicima iz ovog časa će se automatski dodati 1 čas za nadoknadu.</p>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Razlog otkazivanja (opciono)</label>
                    <textarea 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Upišite razlog koji će biti poslat učenicima (npr. Zbog bolesti...)"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-orange-500/50 outline-none resize-none h-20"
                    />
                  </div>

                  <Button onClick={handleCancel} isLoading={isCanceling} variant="outline" className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10">
                    <X className="w-4 h-4 mr-2" /> Otkaži Čas i Dodaj Nadoknadu
                  </Button>
                </div>
              )}

              {/* Sekcija 4: Brisanje (Opasna zona) */}
              {!(selectedClass.status === 'OTKAZAN' && user?.role === 'PROFESOR') && (
                <div className="pt-6 border-t border-red-900/30">
                  <h4 className="text-sm font-semibold text-red-400 mb-3">Opasna Zona (Brisanje iz Baze)</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => handleDelete(false)} isLoading={isDeleting} variant="outline" className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4 mr-2" /> Obriši SAMO OVO
                    </Button>
                    {selectedClass.recurringGroupId && (
                      <Button onClick={() => handleDelete(true)} isLoading={isDeleting} variant="outline" className="flex-1 bg-red-950/50 border-red-500 text-red-400 hover:bg-red-900/80">
                        <Trash2 className="w-4 h-4 mr-2" /> Obriši CEO CIKLUS
                      </Button>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
