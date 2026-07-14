import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { Loader2, Settings as SettingsIcon, DollarSign, Package, Save } from 'lucide-react';

export default function Settings() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: settings, isLoading } = useGetSettingsQuery(undefined, {
    skip: user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN'
  });
  
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  // Lokalno stanje forme
  const [fee, setFee] = useState(15);
  const [pkgOsnovni, setPkgOsnovni] = useState(100);
  const [pkgSrednji, setPkgSrednji] = useState(150);
  const [pkgNapredni, setPkgNapredni] = useState(200);

  // Inicijalizacija forme kad stignu podaci
  useEffect(() => {
    if (settings) {
      setFee(settings.professorClassFee);
      setPkgOsnovni(settings.packagePrices?.OSNOVNI || 100);
      setPkgSrednji(settings.packagePrices?.SREDNJI || 150);
      setPkgNapredni(settings.packagePrices?.NAPREDNI || 200);
    }
  }, [settings]);

  if (user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Pristup Odbijen</h2>
        <p className="text-slate-400">Nemate privilegije za pregled ove stranice.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        professorClassFee: Number(fee),
        packagePrices: {
          OSNOVNI: Number(pkgOsnovni),
          SREDNJI: Number(pkgSrednji),
          NAPREDNI: Number(pkgNapredni)
        }
      }).unwrap();
      alert('Podešavanja su uspešno sačuvana! Dashboard analitika je ažurirana.');
    } catch (err) {
      alert('Greška pri čuvanju podešavanja');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" /> Podešavanja Sistema
        </h2>
        <p className="text-slate-400 mt-1">Globalni parametri aplikacije koji utiču na sve korisnike i izveštaje.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Zarada Profesora */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <DollarSign className="w-40 h-40" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Finansije
          </h3>
          <p className="text-sm text-slate-400 mb-6 relative z-10">Ova vrednost se množi sa brojem održanih časova kako bi se izračunala plata profesora.</p>
          
          <div className="max-w-xs relative z-10">
            <label className="block text-sm font-medium text-slate-300 mb-2">Zarada Profesora po održanom času (€)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">€</span>
              <input 
                type="number" min="0" step="0.01" required
                value={fee} onChange={(e) => setFee(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Cene Paketa */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Package className="w-40 h-40" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <Package className="w-5 h-5 text-blue-400" /> Cene Paketa
          </h3>
          <p className="text-sm text-slate-400 mb-6 relative z-10">Ove cene se koriste za automatsko računanje ukupne zarade na Dashboard-u (Broj Učenika × Cena Paketa).</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Osnovni Paket (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input 
                  type="number" min="0" step="1" required
                  value={pkgOsnovni} onChange={(e) => setPkgOsnovni(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Srednji Paket (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input 
                  type="number" min="0" step="1" required
                  value={pkgSrednji} onChange={(e) => setPkgSrednji(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Napredni Paket (€)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                <input 
                  type="number" min="0" step="1" required
                  value={pkgNapredni} onChange={(e) => setPkgNapredni(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Google Meet Integracija */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm-15.5 4.5l5-3.5-5-3.5v7zm11-1.5c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2z"/>
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
            <span className="text-blue-500">Google Meet</span> Automatizacija
          </h3>
          <p className="text-sm text-slate-400 mb-6 relative z-10 max-w-2xl">
            Klikom na dugme ispod povezaćeš platformu sa svojim Google nalogom. Nakon povezivanja, sistem će potpuno samostalno generisati Google Meet linkove za sve zakazane časove <b>tačno 60 minuta</b> pre njihovog početka.
          </p>
          
          <div className="relative z-10">
            <a href="http://localhost:5001/api/google/auth">
              <Button type="button" className="bg-white text-slate-900 hover:bg-slate-100 flex items-center shadow-lg shadow-white/10">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Poveži sa Google-om
              </Button>
            </a>
            
            {window.location.search.includes('google=success') && (
              <p className="mt-3 text-sm font-medium text-emerald-400">✅ Google nalog je uspešno povezan! Automatizacija je sada aktivna.</p>
            )}
            {window.location.search.includes('google=error') && (
              <p className="mt-3 text-sm font-medium text-red-400">❌ Greška pri povezivanju. Pokušajte ponovo.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isUpdating} className="px-8 py-4 flex items-center text-lg">
            <Save className="w-5 h-5 mr-2" />
            Sačuvaj Sve Izmene
          </Button>
        </div>

      </form>
    </div>
  );
}
