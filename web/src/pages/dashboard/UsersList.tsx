import { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  useGetUsersQuery, 
  useUpdateUserMutation, 
  useCreateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useApproveCertificateMutation,
  useVerifyUserManuallyMutation
} from '../../store/apiSlice';
import { Button } from '../../components/ui/Button';
import { Search, Plus, Filter, MoreVertical, Edit2, Shield, Trash2, Power, UserPlus, FileSignature, Minus, Loader2, ChevronLeft, ChevronRight, X, User as UserIcon, Info, Award, CheckCircle, Building, Monitor } from 'lucide-react';
import type { UserResponse } from '@elegant-code/shared';
import { useDebounce } from '../../hooks/useDebounce';
import { UserDetailsModal } from '../../components/users/UserDetailsModal';
import { UserCreateModal } from '../../components/users/UserCreateModal';
import { UserEditModal } from '../../components/users/UserEditModal';
import type { RootState } from '../../store/store';

export default function UsersList() {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  
  // Stanja za filtere, pretragu i paginaciju
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterPackage, setFilterPackage] = useState('ALL');
  
  // States za modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // Debounce pretrage na 300ms
  const debouncedSearch = useDebounce(searchTerm, 300);

  // RTK Query sa parametrima i pollingom
  const { data, isLoading, error, isFetching } = useGetUsersQuery({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    role: filterRole !== 'ALL' ? filterRole : undefined,
    activePackage: filterPackage !== 'ALL' ? filterPackage : undefined
  }, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true
  });

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [toggleUserStatus] = useToggleUserStatusMutation();
  const [verifyUserManually] = useVerifyUserManuallyMutation();
  const [approveCertificate, { isLoading: isApprovingCert }] = useApproveCertificateMutation();

  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certCourseName, setCertCourseName] = useState('');

  // Resetujemo paginaciju na 1. stranicu ukoliko korisnik menja filtere/pretragu
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterRole(e.target.value);
    setPage(1);
  };
  
  const handlePackageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterPackage(e.target.value);
    setPage(1);
  };

  const handleEditClick = (user: UserResponse) => {
    setEditingUser(user);
  };

  const handleDelete = async (user: UserResponse) => {
    if (window.confirm(`Da li ste sigurni da želite da obrišete korisnika ${user.firstName} ${user.lastName}?`)) {
      try {
        await deleteUser(user._id).unwrap();
      } catch (err: any) {
        alert(err?.data?.error || 'Greška pri brisanju korisnika.');
      }
    }
  };

  const handleVerifyManually = async (user: UserResponse) => {
    if (window.confirm(`Da li ste sigurni da želite da verifikujete nalog korisnika ${user.firstName} ${user.lastName}?`)) {
      try {
        await verifyUserManually(user._id).unwrap();
      } catch (err: any) {
        alert(err?.data?.error || 'Greška pri verifikaciji korisnika.');
      }
    }
  };

  const handleUpdateMakeup = async (user: UserResponse, change: number) => {
    try {
      const currentOwed = user.progress?.makeupClassesOwed || 0;
      const newValue = currentOwed + change;
      if (newValue < 0) return; // Ne može manje od 0

      await updateUser({
        id: user._id,
        data: {
          makeupClassesOwed: newValue
        }
      }).unwrap();
    } catch (err: any) {
      console.error('Failed to update makeup classes', err);
      const serverError = err?.data?.error;
      alert(serverError || 'Greška pri ažuriranju časova za nadoknadu.');
    }
  };

  const handleToggleStatus = async (user: UserResponse) => {
    const actionText = user.isActive === false ? 'aktivirate' : 'deaktivirate';
    if (window.confirm(`Da li ste sigurni da želite da ${actionText} korisnika ${user.firstName} ${user.lastName}?`)) {
      try {
        await toggleUserStatus(user._id).unwrap();
      } catch (error) {
        console.error('Greška pri promeni statusa', error);
        alert('Došlo je do greške pri promeni statusa. Pokušajte ponovo.');
      }
    }
  };

  const handleToggleAttendance = async (user: UserResponse) => {
    try {
      const newMode = user.attendanceMode === 'UZIVO' ? 'ONLINE' : 'UZIVO';
      await updateUser({
        id: user._id,
        data: { attendanceMode: newMode }
      }).unwrap();
    } catch (err: any) {
      console.error('Greška pri promeni načina nastave', err);
      alert(err?.data?.error || 'Došlo je do greške pri promeni načina nastave.');
    }
  };

  const handleApproveCertificate = async () => {
    if (!selectedUser || !certCourseName.trim()) return;
    try {
      await approveCertificate({ studentId: selectedUser._id, courseName: certCourseName }).unwrap();
      setIsCertModalOpen(false);
      setCertCourseName('');
      alert(`Sertifikat uspešno odobren za ${selectedUser.firstName}`);
    } catch (err: any) {
      alert(err?.data?.error || 'Došlo je do greške pri odobravanju sertifikata.');
    }
  };

  if (error) {
    console.error('API Error:', error);
    return <div className="text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20">Greška pri učitavanju korisnika! Pokušajte ponovo. Proverite konzolu za detalje.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Upravljanje Korisnicima</h2>
          <p className="text-slate-400 mt-1">
            {currentUser?.role === 'PROFESOR' ? 'Pregled tvojih učenika' : 'Pregled svih registrovanih naloga na platformi'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Button onClick={() => setIsCreateModalOpen(true)} className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj Korisnika
          </Button>

          {/* Pretraga */}
          <div className="relative flex-1 lg:flex-none min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pretraži imenom, emailom ili telefonom..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Filter Uloga (samo za Admine) */}
          {currentUser?.role !== 'PROFESOR' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select 
                value={filterRole}
                onChange={handleRoleChange}
                className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
              >
                <option value="ALL">Sve Uloge</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="PROFESOR">Profesor</option>
                <option value="UCENIK">Učenik</option>
                <option value="KLIJENT">Klijent</option>
                <option value="GOST">Gost</option>
              </select>
            </div>
          )}

          {/* Filter Paket */}
          <div className="relative">
            <select 
              value={filterPackage}
              onChange={handlePackageChange}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="ALL">Svi Paketi</option>
              <option value="NONE">Bez Paketa</option>
              <option value="OSNOVNI">Osnovni</option>
              <option value="SREDNJI">Srednji</option>
              <option value="NAPREDNI">Napredni</option>
            </select>
          </div>

          <div className="bg-slate-800/50 px-4 py-2.5 rounded-xl border border-slate-700/50 flex items-center shrink-0">
            <UserIcon className="w-4 h-4 text-primary mr-2" />
            <span className="text-white font-medium text-sm">{data?.pagination?.totalUsers || 0} Korisnika</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl relative">
        {/* Loading Overlay (kada se filtrira/menja stranica) */}
        {isFetching && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 text-slate-400 text-sm border-b border-slate-800/80">
                <th className="px-6 py-4 font-medium">Korisnik</th>
                <th className="px-6 py-4 font-medium">Uloga</th>
                <th className="px-6 py-4 font-medium">Aktivan Paket</th>
                <th className="px-6 py-4 font-medium">Datum Registracije</th>
                <th className="px-6 py-4 font-medium text-center">Za Nadoknadu</th>
                <th className="px-6 py-4 font-medium text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {(!data?.users || data.users.length === 0) && !isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nema korisnika koji odgovaraju pretrazi.
                  </td>
                </tr>
              ) : (
                data?.users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-primary font-bold mr-3 border border-slate-700 shrink-0">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {user.firstName} {user.lastName}
                            {['UCENIK', 'KLIJENT'].includes(user.role) && (
                              user.attendanceMode === 'UZIVO' ? (
                                <Building className="w-4 h-4 text-amber-500" title="Nastava uživo" />
                              ) : (
                                <Monitor className="w-4 h-4 text-blue-400" title="Online nastava" />
                              )
                            )}
                          </div>
                          <div className="text-sm text-slate-400">{user.email}</div>
                          {user.phoneNumber && (
                            <div className="text-xs text-slate-500 mt-0.5">{user.phoneNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.role === 'SUPER_ADMIN' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        user.role === 'ADMIN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                        user.role === 'PROFESOR' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {user.role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        user.activePackage === 'NONE' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                        user.activePackage === 'OSNOVNI' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        user.activePackage === 'SREDNJI' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {user.activePackage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('sr-RS')}
                    </td>
                    <td className="px-6 py-4">
                      {['UCENIK', 'KLIJENT'].includes(user.role) ? (
                        <div className="flex items-center justify-center gap-3">
                          <button 
                            onClick={() => handleUpdateMakeup(user, -1)}
                            disabled={!user.progress?.makeupClassesOwed}
                            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`font-bold w-6 text-center ${user.progress?.makeupClassesOwed ? 'text-red-400' : 'text-slate-400'}`}>
                            {user.progress?.makeupClassesOwed || 0}
                          </span>
                          <button 
                            onClick={() => handleUpdateMakeup(user, 1)}
                            className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 block text-center">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Aktiviraj/Deaktiviraj dugme (Samo Admin/SuperAdmin) */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && user.role !== 'SUPER_ADMIN' && (
                          <button 
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-lg transition-colors inline-flex items-center ${
                              user.isActive === false 
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                            title={user.isActive === false ? "Aktiviraj nalog" : "Deaktiviraj nalog"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {/* Verifikuj Dugme (Samo Admin/SuperAdmin za goste) */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && user.role === 'GOST' && (
                          <button 
                            onClick={() => handleVerifyManually(user)}
                            className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-lg transition-colors inline-flex items-center"
                            title="Verifikuj nalog"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}

                        {/* Brza promena načina nastave (Samo za Učenike/Klijente) */}
                        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'PROFESOR') && (user.role === 'UCENIK' || user.role === 'KLIJENT') && (
                          <button 
                            onClick={() => handleToggleAttendance(user)}
                            className={`p-2 rounded-lg transition-colors inline-flex items-center ${
                              user.attendanceMode === 'UZIVO' 
                                ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' 
                                : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                            }`}
                            title={user.attendanceMode === 'UZIVO' ? "Prebaci na ONLINE" : "Prebaci na UŽIVO"}
                            disabled={isUpdating}
                          >
                            {user.attendanceMode === 'UZIVO' ? <Building className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          </button>
                        )}
                        
                        {/* Odobri Sertifikat (Admin/SuperAdmin/Profesor) za Učenike/Klijente */}
                        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'PROFESOR') && (user.role === 'UCENIK' || user.role === 'KLIJENT') && (
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setIsCertModalOpen(true);
                            }}
                            className="p-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors inline-flex items-center"
                            title="Odobri Sertifikat"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Detalji Dugme (Samo Admin) */}
                        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') && (
                          <button 
                            onClick={() => {
                              setSelectedUser(user);
                              setIsDetailsModalOpen(true);
                            }}
                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors inline-flex items-center"
                            title="Pregled detalja i lozinke"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center"
                          title="Izmeni korisnika"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Obriši dugme (Samo Admin/SuperAdmin ili Profesor za svoje učenike) */}
                        {user.role !== 'SUPER_ADMIN' && (
                          <button 
                            onClick={() => handleDelete(user)}
                            className="p-2 bg-slate-800 text-red-400 hover:text-red-300 hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center"
                            title="Obriši korisnika"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacija */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-900/50">
            <p className="text-sm text-slate-400">
              Stranica <span className="font-medium text-white">{data.pagination.page}</span> od <span className="font-medium text-white">{data.pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages || isFetching}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <UserEditModal 
        user={editingUser} 
        onClose={() => setEditingUser(null)} 
      />

      <UserCreateModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      {/* Details Modal */}
      {isDetailsModalOpen && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedUser(null);
          }} 
        />
      )}

      {/* Approve Certificate Modal */}
      {isCertModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-400" />
                Odobri Sertifikat
              </h3>
              <button 
                onClick={() => {
                  setIsCertModalOpen(false);
                  setCertCourseName('');
                }} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm">
                Odobravate sertifikat za učenika <span className="font-bold">{selectedUser.firstName} {selectedUser.lastName}</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Izaberite vrstu sertifikata</label>
                <select 
                  value={certCourseName} 
                  onChange={(e) => setCertCourseName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Odaberite tehnologiju --</option>
                  <option value="HTML5">HTML5</option>
                  <option value="CSS3">CSS3</option>
                  <option value="JavaScript">JavaScript</option>
                  <option value="React">React</option>
                  <option value="React Native">React Native</option>
                  <option value="Full Stack">Full Stack</option>
                </select>
              </div>
              <Button 
                onClick={handleApproveCertificate}
                isLoading={isApprovingCert}
                disabled={!certCourseName.trim() || isApprovingCert}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900"
              >
                Odobri Sertifikat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
