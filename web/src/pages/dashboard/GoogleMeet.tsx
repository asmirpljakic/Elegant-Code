import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { Video, CheckCircle2 } from 'lucide-react';

export default function GoogleMeet() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(
    localStorage.getItem(`google_connected_${user?.id}`) === 'true'
  );
  const [errorMsg, setErrorMsg] = useState(false);

  useEffect(() => {
    const googleStatus = searchParams.get('google');
    if (googleStatus === 'success') {
      setIsConnected(true);
      setErrorMsg(false);
      localStorage.setItem(`google_connected_${user?.id}`, 'true');
    } else if (googleStatus === 'error') {
      setIsConnected(false);
      setErrorMsg(true);
      localStorage.removeItem(`google_connected_${user?.id}`);
    }
  }, [searchParams, user?.id]);

  if (!['SUPER_ADMIN', 'ADMIN', 'PROFESOR'].includes(user?.role || '')) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Pristup Odbijen</h2>
        <p className="text-slate-400">Nemate privilegije za pregled ove stranice.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-500" /> Google Meet Automatizacija
        </h2>
        <p className="text-slate-400 mt-1">Poveži svoj Google kalendar kako bi sistem automatski generisao Meet linkove.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12c0-6.627-5.373-12-12-12s-12 5.373-12 12 5.373 12 12 12 12-5.373 12-12zm-15.5 4.5l5-3.5-5-3.5v7zm11-1.5c-1.104 0-2-.896-2-2s.896-2 2-2 2 .896 2 2-.896 2-2 2z"/>
          </svg>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
          Status Povezivanja
        </h3>
        <p className="text-sm text-slate-400 mb-6 relative z-10 max-w-2xl">
          Klikom na dugme ispod povezaćeš platformu sa svojim Google nalogom. Nakon povezivanja, sistem će potpuno samostalno generisati Google Meet linkove za sve tvoje zakazane časove <b>tačno 60 minuta</b> pre njihovog početka, i ti ćeš biti jedini "Host" na njima.
        </p>
        
        <div className="relative z-10 mt-24">
          {isConnected ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h4 className="text-emerald-400 font-bold flex items-center text-lg mb-1">
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Uspešno povezano
                </h4>
                <p className="text-slate-400 text-sm">Tvoj Google nalog je aktivan. Svi časovi će se automatski zakazivati na tvom kalendaru.</p>
              </div>
              <a href={`http://localhost:5001/api/google/auth?userId=${user?.id}`}>
                <button className="bg-slate-800 hover:bg-slate-700 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm border border-slate-700">
                  Osveži konekciju
                </button>
              </a>
            </div>
          ) : (
            <>
              <a href={`http://localhost:5001/api/google/auth?userId=${user?.id}`}>
                <button className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-6 py-3 rounded-xl transition-colors flex items-center shadow-lg shadow-white/10">
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Poveži sa Google-om
                </button>
              </a>
              {errorMsg && (
                <p className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm font-medium text-red-400 inline-block">
                  ❌ Greška pri povezivanju. Aplikacija je možda u test modu ili niste odobrili pristup.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
