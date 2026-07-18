import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { Loader2, Settings as SettingsIcon, DollarSign, Package, Save, ShieldAlert, Power, Wrench } from 'lucide-react';

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
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Inicijalizacija forme kad stignu podaci
  useEffect(() => {
    if (settings) {
      setFee(settings.professorClassFee);
      setPkgOsnovni(settings.packagePrices?.OSNOVNI || 100);
      setPkgSrednji(settings.packagePrices?.SREDNJI || 150);
      setPkgNapredni(settings.packagePrices?.NAPREDNI || 200);
      setMaintenanceMode(settings.maintenanceMode || false);
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
        },
        maintenanceMode
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
        
        {/* Mod Održavanja */}
        <div className={`border rounded-3xl p-8 relative overflow-hidden transition-colors ${maintenanceMode ? 'bg-amber-500/10 border-amber-500/50' : 'bg-slate-900 border-slate-800'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wrench className={`w-40 h-40 ${maintenanceMode ? 'text-amber-500' : 'text-slate-500'}`} />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <h3 className={`text-xl font-bold mb-2 flex items-center gap-2 ${maintenanceMode ? 'text-amber-400' : 'text-white'}`}>
                <ShieldAlert className="w-5 h-5" /> Mod Održavanja (Maintenance Mode)
              </h3>
              <p className="text-sm text-slate-400 max-w-xl">
                Kada je ovaj mod uključen, aplikacija će biti **potpuno blokirana** za sve korisnike (učenike), 
                sa porukom da je sistem u fazi ažuriranja. Vi kao Admin ćete i dalje moći normalno da pristupate.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`relative inline-flex h-10 w-20 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className="sr-only">Uključi mod održavanja</span>
              <span
                className={`pointer-events-none inline-block h-9 w-9 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${maintenanceMode ? 'translate-x-10' : 'translate-x-0'}`}
              >
                <Power className={`w-4 h-4 ${maintenanceMode ? 'text-amber-500' : 'text-slate-400'}`} />
              </span>
            </button>
          </div>
          
          {maintenanceMode && (
            <div className="mt-4 p-4 bg-amber-500/20 border border-amber-500/30 rounded-xl relative z-10 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm font-medium text-amber-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Upozorenje: Čuvanjem ovih podešavanja, svi učenici će trenutno biti izbačeni sa platforme.
              </p>
            </div>
          )}
        </div>
        
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

        {/* Globalna Obaveštenja uklonjena i prebačena u SystemNotifications.tsx */}

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
