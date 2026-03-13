import React from 'react';
import { FileText, X } from 'lucide-react';

interface LisezMoiDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const LisezMoiDialog: React.FC<LisezMoiDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-600 via-amber-400 to-orange-600"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 shrink-0">
             <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-orange-600 to-amber-500 rounded-xl flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
                        <FileText className="w-7 h-7 text-white animate-pulse-soft" />
                    </div>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">LISEZ-MOI</h2>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Informations Importantes</span>
                  </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
             </button>
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto text-slate-300 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Notes de version</h3>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                <h4 className="font-bold text-orange-400 mb-2">Important</h4>
                <p className="text-sm mb-3">
                    Cette application est conçue pour faciliter la gestion et la localisation des équipements ONT. Veuillez vous assurer d'utiliser des fichiers d'importation au format correct pour garantir l'intégrité des données.
                </p>
                <p className="text-sm text-orange-200/80 italic border-t border-white/5 pt-3">
                    ONT Finder Pro est une application web statique.<br/>
                    Pour conserver vos données plus longtemps dans 'ARCHIVE', pensez à cocher l’option « Me rappeler » à chaque connexion.
                </p>
            </div>

            <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">Fonctionnalités récentes :</h4>
                <ul className="list-disc list-inside text-sm space-y-1 text-slate-400">
                    <li>Support de l'importation massive Nokia & Huawei.</li>
                    <li>Détection automatique des doublons.</li>
                    <li>Mode sombre optimisé pour réduire la fatigue visuelle.</li>
                    <li>Exportation des données filtrées vers Excel.</li>
                </ul>
            </div>
            
             <div className="mt-8 pt-6 border-t border-white/5 text-center">
                 <p className="text-[10px] text-slate-600 font-mono">
                    Merci d'utiliser ONT Finder Pro.
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LisezMoiDialog;
