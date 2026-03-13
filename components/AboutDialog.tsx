import React from 'react';
import { Activity, X } from 'lucide-react';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50">
             <div className="flex items-center gap-4">
                  {/* Logo (Image 1 style placeholder) */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
                        <Activity className="w-7 h-7 text-white animate-pulse-soft" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm"></div>
                    </div>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">À propos</h2>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ONT Finder Pro</span>
                  </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
             </button>
        </div>
        
        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center">
            <div className="w-16 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-6 opacity-50"></div>
            
            <p className="text-slate-300 text-lg font-medium leading-relaxed mb-8 max-w-sm whitespace-pre-line">
                ONT Finder est un outil permettant de rechercher et localiser rapidement les équipements ONT visibles sur le réseau.
Il facilite l’identification du numéro de série (SN), de la référence de l’équipement et de l’emplacement d’interconnexion sur OLT ou MSAN.
            </p>
            
            <div className="w-full pt-6 border-t border-white/5 flex flex-col gap-2">
                 <div className="flex justify-center items-center gap-2">
                     <span className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest">
                        Version 2.1.1
                     </span>
                     <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
                        Enterprise
                     </span>
                 </div>
                 <p className="text-[10px] text-slate-600 font-mono mt-2">
                    © 2026 • ADDADI Abdellah • Tous droits réservés
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AboutDialog;