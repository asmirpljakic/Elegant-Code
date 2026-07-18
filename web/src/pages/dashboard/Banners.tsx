import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../store/apiSlice';
import type { RootState } from '../../store/store';
import { Button } from '../../components/ui/Button';
import { Megaphone, Plus, Trash2, Loader2, Save } from 'lucide-react';

export default function Banners() {
  const { user } = useSelector((state: RootState) => state.auth);
  
  const { data: settings, isLoading } = useGetSettingsQuery(undefined, {
    skip: user?.role !== 'SUPER_ADMIN' && user?.role !== 'ADMIN'
  });
  
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();

  const [banners, setBanners] = useState<Array<{ text: string; isActive: boolean; link?: string }>>([]);

  useEffect(() => {
    if (settings && settings.banners) {
      setBanners(settings.banners);
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

  const handleAddBanner = () => {
    setBanners([...banners, { text: '', isActive: true, link: '' }]);
  };

  const handleRemoveBanner = (index: number) => {
    const newBanners = [...banners];
    newBanners.splice(index, 1);
    setBanners(newBanners);
  };

  const handleChange = (index: number, field: string, value: any) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], [field]: value };
    setBanners(newBanners);
  };

  const handleSave = async () => {
    try {
      await updateSettings({ banners }).unwrap();
      alert('Baneri su uspešno sačuvani i odmah vidljivi korisnicima!');
    } catch (err) {
      alert('Greška pri čuvanju banera');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-orange-500" /> Upravljanje Banerima
        </h2>
        <p className="text-slate-400 mt-1">Ovi animirani baneri će se prikazivati isključivo korisnicima bez aktivnog paketa, iznad sekcije "Poklon Dobrodošlice".</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8">
        
        {banners.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50 border-dashed">
            <Megaphone className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Nema aktivnih banera</h3>
            <p className="text-slate-400 mb-6">Dodajte prvi baner kako bi korisnici videli vaše najnovije akcije.</p>
            <Button onClick={handleAddBanner} className="mx-auto flex items-center gap-2">
              <Plus className="w-4 h-4" /> Dodaj Prvi Baner
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {banners.map((banner, index) => (
              <div key={index} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 relative">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  
                  {/* Status Toggle */}
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={banner.isActive}
                        onChange={(e) => handleChange(index, 'isActive', e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                    <span className="text-xs text-slate-400 font-medium">{banner.isActive ? 'Aktivno' : 'Ugašeno'}</span>
                  </div>

                  {/* Text Input */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tekst Banera (OBAVEZNO)</label>
                    <input 
                      type="text" 
                      value={banner.text}
                      onChange={(e) => handleChange(index, 'text', e.target.value)}
                      placeholder="Npr. Velika akcija: 50% popusta na prvi mesec učenja!"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Link Input */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL Link (OPCIONO)</label>
                    <input 
                      type="text" 
                      value={banner.link || ''}
                      onChange={(e) => handleChange(index, 'link', e.target.value)}
                      placeholder="Npr. https://elegant-code.com/pricing"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-300 focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  {/* Delete Button */}
                  <button 
                    onClick={() => handleRemoveBanner(index)}
                    className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors mt-6 md:mt-0"
                    title="Obriši baner"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex justify-between items-center pt-6 border-t border-slate-800">
              <Button variant="outline" onClick={handleAddBanner} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Dodaj Još Jedan Baner
              </Button>
              <Button onClick={handleSave} isLoading={isUpdating} className="flex items-center gap-2 px-8">
                <Save className="w-4 h-4" /> Sačuvaj Sve
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
