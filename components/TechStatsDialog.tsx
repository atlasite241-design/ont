import React from 'react';
import { PieChart, X, CheckCircle2, AlertCircle, Server, Database, Smartphone, Cpu } from 'lucide-react';

interface TechStatsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    total: number;
    huawei: number;
    nokia: number;
    others: number;
    found: number;
    rack0: number; // New: Count for Rack 0 (Huawei)
    rack1: number; // New: Count for Rack 1 (Nokia)
  };
}

const StatBar: React.FC<{ label: string; count: number; total: number; color: string; icon: React.ElementType }> = ({ label, count, total, color, icon: Icon }) => {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center gap-2">
           <div className={`p-1.5 rounded-lg bg-${color}-500/10 text-${color}-400`}>
             <Icon className="w-4 h-4" />
           </div>
           <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
            <span className={`text-xl font-black text-${color}-400`}>{count}</span>
            <span className="text-xs font-bold text-slate-600">({percentage}%)</span>
        </div>
      </div>
      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div 
            className={`h-full bg-${color}-500 relative transition-all duration-1000 ease-out group-hover:bg-${color}-400`}
            style={{ width: `${percentage}%` }}
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>
    </div>
  );
};

const TechStatsDialog: React.FC<TechStatsDialogProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const foundPercentage = stats.total > 0 ? Math.round((stats.found / stats.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="relative p-6 bg-slate-950/50 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <div className="relative">
                    <div className="absolute inset-0 bg-purple-500/20 blur-lg rounded-full animate-pulse"></div>
                    <div className="relative w-12 h-12 bg-slate-900 rounded-2xl border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                        <PieChart className="w-6 h-6 text-purple-400" />
                    </div>
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Répartition Tech</h2>
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-0.5">Analyse du parc ONT</p>
                 </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-full hover:bg-white/5">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-8">
            
            {/* Global Discovery Rate */}
            <div className="mb-8 p-5 rounded-2xl bg-slate-950 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Taux de découverte</span>
                        <div className="flex items-center gap-2">
                             <span className={`text-3xl font-black ${foundPercentage === 100 ? 'text-emerald-400' : (foundPercentage > 50 ? 'text-blue-400' : 'text-orange-400')}`}>
                                 {foundPercentage}%
                             </span>
                             <span className="text-xs font-bold text-slate-600 uppercase mt-2">
                                 ({stats.found} / {stats.total})
                             </span>
                        </div>
                    </div>
                    <div className={`p-3 rounded-xl border ${foundPercentage === 100 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
                        {foundPercentage === 100 ? <CheckCircle2 className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                    </div>
                </div>
                <div className="mt-3 text-[10px] text-slate-500 font-mono">
                    Correspondances trouvées dans la base "Recherche Simple".
                </div>
            </div>

            {/* Distribution Bars */}
            <div className="space-y-2">
                <StatBar 
                    label="ONT HUAWEI VISIBLE" 
                    count={stats.rack0} 
                    total={stats.total} 
                    color="red" 
                    icon={Cpu}
                />
                <StatBar 
                    label="ONT NOKIA VISIBLE" 
                    count={stats.rack1} 
                    total={stats.total} 
                    color="purple" 
                    icon={Smartphone}
                />
                {(stats.others > 0) && (
                    <StatBar 
                        label="AUTRES / INCONNU" 
                        count={stats.others} 
                        total={stats.total} 
                        color="slate" 
                        icon={AlertCircle}
                    />
                )}
            </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                Total analysé : {stats.total} ONT
            </span>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white uppercase tracking-widest transition-all"
            >
                Fermer
            </button>
        </div>

      </div>
    </div>
  );
};

export default TechStatsDialog;