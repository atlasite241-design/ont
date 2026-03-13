import React from 'react';
import { RotateCcw, Filter, Database, Layers, Server, AlertOctagon, Activity, AlertTriangle, Repeat, FileText } from 'lucide-react';
import { ONTStatus } from '../types';

interface ActiveFiltersProps {
  searchTerm?: string;
  msanFilter?: string;
  locationFilter?: string;
  status?: ONTStatus | null;
  onClearFilter?: () => void;
  isDataLoaded?: boolean;
  activeTab?: string; // Added activeTab prop
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({ 
  searchTerm, 
  msanFilter, 
  locationFilter, 
  status,
  onClearFilter, 
  isDataLoaded = false,
  activeTab = 'dashboard' // Default value
}) => {
  const hasFilter = searchTerm || msanFilter || locationFilter || status;
  const showResetButton = !!hasFilter; // Show whenever filters are active

  if (!isDataLoaded || !hasFilter) return null;

  // Determine label for MSAN filter (OLT if starts with GHI, else MSAN)
  const msanLabel = activeTab === 'recap' ? 'CMD NETO' : (msanFilter && msanFilter.toUpperCase().startsWith('GHI') ? 'OLT' : 'MSAN');

  // Determine indicator color based on critical status
  const isCriticalFilter = status === 'critical';
  const pingColor = isCriticalFilter ? 'bg-red-500' : 'bg-emerald-400';
  const dotColor = isCriticalFilter ? 'bg-red-600' : 'bg-emerald-500';

  return (
    <div className="w-full flex items-center gap-3 px-6 mt-2 mb-2 animate-fade-in-up shrink-0 z-10 relative">
        {/* Active Filter Banner */}
        <div className={`flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 rounded-lg shadow-sm backdrop-blur-sm transition-colors duration-300`}>
            <div className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary-300">
                <span className={`opacity-70 font-bold tracking-wider ${isCriticalFilter ? 'text-red-400' : ''}`}>FILTRES ACTIFS :</span>
                {searchTerm && (
                    <span className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-bold">
                    <Filter className="w-3 h-3" />
                    "{searchTerm.toUpperCase()}"
                    </span>
                )}
                {locationFilter && (
                    <span className="flex items-center gap-1 bg-blue-500/10 px-1.5 py-0.5 rounded text-blue-400 font-bold">
                    <Server className="w-3 h-3" />
                    "{locationFilter.toUpperCase()}"
                    </span>
                )}
                {msanFilter && (
                    <span className="flex items-center gap-1 bg-cyan-500/10 px-1.5 py-0.5 rounded text-cyan-400 font-bold">
                    {activeTab === 'recap' ? <FileText className="w-3 h-3" /> : <Database className="w-3 h-3" />}
                    {msanLabel}: "{msanFilter.toUpperCase()}"
                    </span>
                )}
                {status === 'critical' && (
                    <span className="flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded text-red-400 font-bold shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
                    <AlertOctagon className="w-3 h-3" />
                    ONT CRITIQUES
                    </span>
                )}
                {status === 'active' && (
                    <span className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 font-bold">
                    <Activity className="w-3 h-3" />
                    ONT ACTIFS
                    </span>
                )}
                {status === 'isolated' && (
                    <span className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-400 font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    ONT ISOLÉS
                    </span>
                )}
            </div>
        </div>

        {/* Reset Button - Glassmorphism */}
        {showResetButton && (
            <button 
                onClick={onClearFilter}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 backdrop-blur-md text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition-all shadow-[0_4px_10px_rgba(244,63,94,0.1)] hover:shadow-[0_8px_20px_rgba(244,63,94,0.2)] group/btn active:scale-95"
                title="Réinitialiser les filtres"
            >
                <span className="text-[10px] font-bold tracking-widest uppercase hidden sm:inline-block opacity-80 group-hover/btn:opacity-100 transition-opacity">VIDER</span>
                <div className="p-1 rounded-md bg-rose-500/20 group-hover/btn:bg-rose-500/40 transition-colors">
                        <RotateCcw className="w-3.5 h-3.5 group-hover/btn:-rotate-180 transition-transform duration-500" />
                </div>
            </button>
        )}
    </div>
  );
};

export default ActiveFilters;