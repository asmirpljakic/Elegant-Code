import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useUpdateUserMutation } from '../../store/apiSlice';
import type { UserResponse } from '@elegant-code/shared';
import type { RootState } from '../../store/store';

interface UserEditModalProps {
  user: UserResponse | null;
  onClose: () => void;
}

export const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose }) => {
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPackage, setEditPackage] = useState('');

  useEffect(() => {
    if (user) {
      setEditFirstName(user.firstName);
      setEditLastName(user.lastName);
      setEditEmail(user.email);
      setEditPhone(user.phoneNumber || '');
      setEditRole(user.role);
      setEditPackage(user.activePackage);
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      const payload: any = {
        firstName: editFirstName,
        lastName: editLastName,
        email: editEmail,
        phoneNumber: editPhone,
      };

      if (currentUser?.role !== 'PROFESOR') {
        payload.role = editRole;
        payload.activePackage = editPackage;
      }

      await updateUser({
        id: user._id,
        data: payload
      }).unwrap();
      
      onClose();
    } catch (err: any) {
      let errorMessage = 'Greška pri čuvanju promena.';
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
          <h3 className="text-xl font-bold text-white">Izmeni Korisnika</h3>
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
                value={editFirstName} 
                onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Prezime</label>
              <input 
                type="text"
                value={editLastName} 
                onChange={(e) => setEditLastName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input 
                type="email"
                value={editEmail} 
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Broj Telefona</label>
              <input 
                type="text"
                value={editPhone} 
                onChange={(e) => setEditPhone(e.target.value)}
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
                    value={editRole} 
                    onChange={(e) => setEditRole(e.target.value)}
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
                    value={editPackage} 
                    onChange={(e) => setEditPackage(e.target.value)}
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

          <Button 
            onClick={handleSave} 
            isLoading={isUpdating}
            className="w-full py-4 mt-4"
          >
            Sačuvaj Izmene
          </Button>
        </div>
      </div>
    </div>
  );
};
