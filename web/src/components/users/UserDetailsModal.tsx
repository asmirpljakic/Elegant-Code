import React, { useState } from 'react';
import type { UserResponse } from '@elegant-code/shared';
import { X, Mail, Phone, Calendar, Clock, Star, Trophy, Target, Shield, Lock, Loader2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { srLatn } from 'date-fns/locale';
import { useUpdateUserMutation } from '../../store/apiSlice';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface UserDetailsModalProps {
  user: UserResponse;
  onClose: () => void;
}

export function UserDetailsModal({ user, onClose }: UserDetailsModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return;
    
    try {
      await updateUser({ id: user._id, data: { password: newPassword } }).unwrap();
      setIsSuccess(true);
      setNewPassword('');
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error('Greška pri promeni lozinke', error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-primary text-xl font-bold border border-slate-700">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Shield className="w-3 h-3" /> {user.role}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Kontakt Informacije</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <span>{user.phoneNumber || 'Nije unet broj telefona'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Aktivnost</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <div>
                    <p className="text-xs text-slate-500">Registrovan</p>
                    <p>{format(new Date(user.createdAt), 'dd. MMMM yyyy.', { locale: srLatn })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-300 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <Clock className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-slate-500">Poslednja Prijava (Log-in)</p>
                    <p>{user.lastLoginAt ? format(new Date(user.lastLoginAt), 'dd. MMM yyyy. u HH:mm', { locale: srLatn }) : 'Nikada ili pre uvođenja funkcije'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Stats (Only for UCENIK/KLIJENT) */}
          {(user.role === 'UCENIK' || user.role === 'KLIJENT') && user.progress && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Napredak Učenika</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{user.progress.currentLevel}</p>
                  <p className="text-xs text-slate-400">Nivo</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <Target className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{user.progress.xp}</p>
                  <p className="text-xs text-slate-400">XP Poena</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-center">
                  <Trophy className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{user.progress.totalClassesAttended}</p>
                  <p className="text-xs text-slate-400">Završenih Časova</p>
                </div>
              </div>
            </div>
          )}

          {/* Password Reset Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Bezbednost</h3>
            <div className="bg-slate-800/30 border border-slate-700/50 p-5 rounded-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-500/10 text-red-400 rounded-lg shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-medium mb-1">Postavi Novu Lozinku</h4>
                  <p className="text-sm text-slate-400">
                    Lozinke su kriptovane i nije ih moguće videti iz bezbednosnih razloga. Ukoliko je korisnik zaboravio lozinku, možete je resetovati ovde.
                  </p>
                </div>
              </div>
              
              <form onSubmit={handlePasswordReset} className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input 
                    type="password"
                    label="Nova Lozinka (min 6 karaktera)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Unesite novu lozinku..."
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={newPassword.length < 6 || isLoading}
                  className="mb-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isSuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : null}
                  {isSuccess ? 'Sačuvano!' : 'Promeni'}
                </Button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
