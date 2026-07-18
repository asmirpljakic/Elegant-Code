import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCreateUserMutation } from '../../store/apiSlice';
import type { RootState } from '../../store/store';

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserCreateModal: React.FC<UserCreateModalProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('UCENIK');
  const [createPackage, setCreatePackage] = useState('NONE');
  const [createAttendanceMode, setCreateAttendanceMode] = useState('ONLINE');

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      const payload: any = {
        firstName: createFirstName,
        lastName: createLastName,
        email: createEmail,
        password: createPassword,
        phoneNumber: createPhone,
      };

      if (currentUser?.role !== 'PROFESOR') {
        payload.role = createRole;
        payload.activePackage = createPackage;
      }
      
      if (['UCENIK', 'KLIJENT'].includes(payload.role || createRole)) {
        payload.attendanceMode = createAttendanceMode;
      }

      await createUser(payload).unwrap();
      
      setCreateFirstName('');
      setCreateLastName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePhone('');
      setCreateRole('UCENIK');
      setCreatePackage('NONE');
      setCreateAttendanceMode('ONLINE');
      
      onClose();
    } catch (err: any) {
      let errorMessage = 'Greška pri kreiranju korisnika.';
      if (err.data?.error) {
        if (Array.isArray(err.data.error)) {
          errorMessage = err.data.error.map((e: any) => e.message).join('\n');
        } else if (typeof err.data.error === 'string') {
          errorMessage = err.data.error;
        }
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-xl font-bold text-white">Dodaj Novog Korisnika</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Ime</label>
              <input 
                type="text"
                value={createFirstName} 
                onChange={(e) => setCreateFirstName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Prezime</label>
              <input 
                type="text"
                value={createLastName} 
                onChange={(e) => setCreateLastName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input 
                type="email"
                value={createEmail} 
                onChange={(e) => setCreateEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Lozinka</label>
              <input 
                type="text"
                value={createPassword} 
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Minimalno 6 karaktera"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Broj Telefona</label>
              <input 
                type="text"
                value={createPhone} 
                onChange={(e) => setCreatePhone(e.target.value)}
                placeholder="Npr. +381601234567"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {currentUser?.role !== 'PROFESOR' && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Podešavanja Naloga (Samo Admin)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Uloga (Role)</label>
                  <select 
                    value={createRole} 
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="UCENIK">UČENIK</option>
                    <option value="PROFESOR">PROFESOR</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN</option>
                    <option value="KLIJENT">KLIJENT</option>
                    <option value="GOST">GOST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Aktivni Paket</label>
                  <select 
                    value={createPackage} 
                    onChange={(e) => setCreatePackage(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="NONE">Bez Paketa (NONE)</option>
                    <option value="OSNOVNI">OSNOVNI PAKET</option>
                    <option value="SREDNJI">SREDNJI PAKET</option>
                    <option value="NAPREDNI">NAPREDNI PAKET</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {['UCENIK', 'KLIJENT'].includes(createRole) && (
            <div className="pt-4 border-t border-slate-800">
              <label className="block text-sm font-medium text-slate-300 mb-2">Način Pohađanja Nastave</label>
              <select 
                value={createAttendanceMode} 
                onChange={(e) => setCreateAttendanceMode(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ONLINE">ONLINE (Preko Google Meet-a)</option>
                <option value="UZIVO">UŽIVO (Fizički u učionici)</option>
              </select>
            </div>
          )}

          <Button 
            onClick={handleCreate} 
            isLoading={isCreating}
            className="w-full py-4 mt-4"
          >
            Kreiraj Korisnika
          </Button>
        </div>
      </div>
    </div>
  );
};
