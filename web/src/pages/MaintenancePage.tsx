import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Wrench, ArrowRight } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Dekorativna pozadina */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-10 shadow-2xl relative z-10 text-center animate-in fade-in zoom-in duration-500">
        
        <div className="flex justify-center mb-8 relative">
          <div className="w-24 h-24 bg-amber-500/20 rounded-3xl flex items-center justify-center ring-1 ring-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-pulse">
            <Wrench className="w-12 h-12 text-amber-500" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700 animate-spin" style={{ animationDuration: '4s' }}>
            <Settings className="w-6 h-6 text-slate-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight mb-4">
          Sistem se ažurira
        </h1>
        
        <p className="text-slate-400 text-lg leading-relaxed mb-8">
          Platforma <strong className="text-white">Elegant Code</strong> je trenutno u modu održavanja. 
          Unapređujemo vaše iskustvo i dodajemo nove funkcionalnosti. Vratićemo se veoma brzo!
        </p>

        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <p className="text-sm text-slate-300 font-medium">Hvala vam na strpljenju.</p>
          <p className="text-xs text-slate-500 mt-2">© {new Date().getFullYear()} Elegant Code Group</p>
        </div>
      </div>

      {/* Skriveni Admin Login */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-20 hover:opacity-100 transition-opacity">
        <Link to="/login" className="flex items-center text-xs text-slate-500 hover:text-white transition-colors">
          Admin pristup <ArrowRight className="w-3 h-3 ml-1" />
        </Link>
      </div>
    </div>
  );
}
