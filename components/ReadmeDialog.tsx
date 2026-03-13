import React from 'react';
import { BookOpen, X } from 'lucide-react';

interface ReadmeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReadmeDialog: React.FC<ReadmeDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[80vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-400 to-purple-600"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50 shrink-0">
             <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-purple-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
                        <BookOpen className="w-7 h-7 text-white animate-pulse-soft" />
                    </div>
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Guide d'utilisation</h2>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Documentation</span>
                  </div>
             </div>
             <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
             </button>
        </div>
        
        {/* Content */}
        <div className="p-8 overflow-y-auto text-slate-300 space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Guide d'utilisation</h3>
            <p className="whitespace-pre-line">
                ONT Finder est un outil permettant de rechercher et localiser rapidement les équipements ONT sur le réseau. Il identifie les informations essentielles telles que le numéro de série (SN), l’emplacement d’interconnexion et l’équipement associé (OLT ou MSAN). Grâce à son interface simple avec mode sombre optimisé pour réduire la fatigue visuelle, l’utilisateur peut importer et exporter des données filtrées vers Excel , rechercher et filtrer les données afin de localiser facilement les équipements.
            </p>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                <h4 className="font-bold text-blue-400 mb-2">1. Importation des données</h4>
                <p className="text-sm">
                    Utilisez le bouton "ONT NOKIA/ONT HUAWEI" pour charger vos fichiers de données (Excel ou Texte). L'application détecte automatiquement les doublons ainsi le format (Huawei/Nokia).
                </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                <h4 className="font-bold text-emerald-400 mb-2">2. Traitement des données</h4>
                <p className="text-sm">
                    Dans l’onglet ‘File d’insertion’, ouvrez l’éditeur massif, collez les données comprenant ‘CMD NETO’ ainsi que le numéro de série associé, puis cliquez sur ‘LANCER L’ANALYSE’ pour démarrer le traitement des données.
                </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                <h4 className="font-bold text-blue-400 mb-2">3. Résultat de données</h4>
                <p className="text-sm">
                    Mise en place de deux files de traitement des commandes :

                    une 'File de travail', qui regroupe les commandes en attente de validation, avec les statuts : Actif, Répété, Isolé et Critique ;

                    une 'File RECAP' qui contient les commandes validées dont le statut est Validé.
                </p>
            </div>

            <div className="bg-slate-800/50 p-4 rounded-lg border border-white/5">
                <h4 className="font-bold text-purple-400 mb-2">4. Gestion des Archives</h4>
                <p className="text-sm">
                    Les données peuvent être archivées pour référence future. Accédez à l'onglet "Inventaire FTTH" pour consulter le parc des ONT en service.
                </p>
            </div>
            
             <div className="mt-8 pt-6 border-t border-white/5 text-center">
                 <p className="text-[10px] text-slate-600 font-mono">
                    Dernière mise à jour: Février 2026
                 </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ReadmeDialog;
