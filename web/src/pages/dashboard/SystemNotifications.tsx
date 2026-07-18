import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useBroadcastNotificationMutation } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { BellRing, Send } from 'lucide-react';

export default function SystemNotifications() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [broadcastNotification, { isLoading: isBroadcasting }] = useBroadcastNotificationMutation();

  // Stanje za globalno obaveštenje
  const [broadcastTitle, setBroadcastTitle] = useState('Važno obaveštenje');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'SVI' | 'PROFESORI' | 'UCENICI'>('SVI');

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Pristup Odbijen</h2>
        <p className="text-slate-400">Nemate privilegije za pregled ove stranice.</p>
      </div>
    );
  }

  const handleSend = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      alert('Naslov i poruka su obavezni!');
      return;
    }
    
    const targetLabel = broadcastTarget === 'SVI' ? 'SVIM korisnicima' : broadcastTarget === 'PROFESORI' ? 'SAMO profesorima' : 'SAMO učenicima';

    if (confirm(`Da li ste sigurni da želite da pošaljete ovo obaveštenje ${targetLabel}?`)) {
      try {
        const res = await broadcastNotification({ title: broadcastTitle, message: broadcastMessage, target: broadcastTarget }).unwrap();
        alert(res.message || 'Obaveštenje uspešno poslato!');
        setBroadcastMessage('');
      } catch (err) {
        alert('Došlo je do greške prilikom slanja obaveštenja.');
      }
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BellRing className="w-6 h-6 text-amber-400" /> Sistemska Obaveštenja
        </h2>
        <p className="text-slate-400 mt-1">Pošalji važno obaveštenje (zvonce) određenoj grupi korisnika.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BellRing className="w-40 h-40" />
        </div>
        
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
          <Send className="w-5 h-5 text-amber-400" /> Novo Obaveštenje
        </h3>
        
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Naslov Obaveštenja</label>
              <input 
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Npr. Kolektivni odmor"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Kome se šalje?</label>
              <select
                value={broadcastTarget}
                onChange={(e) => setBroadcastTarget(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
              >
                <option value="SVI">Svima (Svi korisnici)</option>
                <option value="PROFESORI">Samo Profesorima</option>
                <option value="UCENICI">Samo Učenicima/Klijentima</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Sadržaj Poruke</label>
            <textarea 
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Npr. Naša platforma neće raditi do 15.08.2026 godine..."
              rows={5}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button 
              type="button" 
              onClick={handleSend}
              isLoading={isBroadcasting} 
              className="px-8 py-3.5 flex items-center bg-amber-500 hover:bg-amber-600 text-white text-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Send className="w-5 h-5 mr-2" />
              Pošalji Obaveštenje
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
