import React, { useMemo } from 'react';
import { X, Server, MapPin, Hash, Cpu, Activity, AlertOctagon, CheckCircle2, Copy } from 'lucide-react';
import { ONTRecord } from '../types';
import { soundService } from '../services/soundService';

// Fix: Defined missing SearchDialogProps interface
interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: ONTRecord[];
  searchTerm: string;
}

const DetailCard = ({ 
  label, 
  value,
  copyValue, 
  icon: Icon, 
  delay 
}: { 
  label: string; 
  value: React.ReactNode; 
  copyValue?: string;
  icon: React.ElementType; 
  delay: number;
}) => (
  <div 
    className="relative overflow-hidden group bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/20 hover:border-blue-400/50 rounded-xl p-5 shadow-lg transition-all duration-300 hover:shadow-blue-500/10 hover:-translate-y-1 animate-fade-in-up h-full flex flex-col justify-between"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
    <div className="absolute right-3 top-3 opacity-20 group-hover:opacity-100 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
      <Icon className="w-12 h-12 text-blue-400" />
    </div>

    <div className="relative z-10 w-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded bg-blue-950/50 border border-blue-500/30 text-blue-400 group-hover:animate-icon-bounce transition-all">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-[11px] uppercase tracking-widest text-blue-300/70 font-bold group-hover:text-blue-300 transition-colors">{label}</span>
      </div>
      
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl font-mono font-semibold text-white tracking-tight drop-shadow-md break-all leading-snug">
          {value}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            // Use specific copy value if provided, otherwise check if value is string
            const textToCopy = copyValue || (typeof value === 'string' ? value : '');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy);
                soundService.playSuccess();
            }
          }}
          className="text-slate-600 hover:text-blue-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1"
          title="Copier"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-700 group-hover:w-full"></div>
  </div>
);

const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose, results, searchTerm, activeTab }) => {
  if (!isOpen) return null;
  const isSingleView = results.length === 1;
  const singleRecord = results[0];

  const { isNokiaRack1Override, isHuaweiRack1 } = useMemo(() => {
    if (!singleRecord) return { isNokiaRack1Override: false, isHuaweiRack1: false };
    
    const versionUpper = (singleRecord.version || '').trim().toUpperCase();
    const vendorUpper = (singleRecord.vendorId || '').toUpperCase();
    const snUpper = (singleRecord.sn || '').trim().toUpperCase();
    
    const isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL');
    const isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || snUpper.startsWith('4857') || snUpper.startsWith('HWT');

    const locUpper = (singleRecord.location || '').toUpperCase().replace(/\s/g, '');
    let rack = '0';

    const fsspMatch = locUpper.match(/FRAME:(\d+)\/SHELF:(\d+)/);
    const fspMatch = locUpper.match(/FRAME:(\d+)\/SLOT:(\d+)/); 

    if (fsspMatch) {
        rack = fsspMatch[1];
    } else if (fspMatch) {
        rack = fspMatch[1];
    } else {
        const parts = singleRecord.location.split('/').map(s => s.trim());
        if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) {
            rack = parts[0];
        }
    }
    
    return {
        isNokiaRack1Override: isNokia && rack === '1',
        isHuaweiRack1: isHuawei && rack === '1'
    };
  }, [singleRecord]);

  // NEW: Process MSAN and Location for display (Nokia specific logic)
  // MOVED UP to be available for showCritical logic
  const { displayMsan, displayLocation } = useMemo(() => {
    if (!singleRecord) return { displayMsan: '', displayLocation: '' };

    let msan = singleRecord.msan;
    let location = singleRecord.location;
    
    const versionUpper = (singleRecord.version || '').trim().toUpperCase();
    const vendorUpper = (singleRecord.vendorId || '').toUpperCase();
    const isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL');

    if (isNokia && msan && msan.includes(':')) {
        const colonIndex = msan.indexOf(':');
        const locStr = msan.substring(colonIndex);
        msan = msan.substring(0, colonIndex);
        
        // If location is unknown or generic, try to extract from MSAN suffix
        if (!location || location === 'Unknown Location' || location === '--/--/--' || location === '---') {
            const sMatch = locStr.match(/S(\d+)/i);
            const ltMatch = locStr.match(/LT(\d+)/i);
            const ponMatch = locStr.match(/PON(\d+)/i);
            
            if (ltMatch && ponMatch) {
                // Format matching user request: Slot:X/Port:Y
                location = `Slot:${ltMatch[1]}/Port:${ponMatch[1]}`;
            } else {
                location = locStr.startsWith(':') ? locStr.substring(1) : locStr;
            }
        }
    }

    // Cleanup location string for display (remove Frame:0/)
    const cleanedLocation = location ? location.replace(/Frame:0\//gi, '') : '';

    return { displayMsan: msan, displayLocation: cleanedLocation };
  }, [singleRecord]);

  // Logic: Show critical if (status is critical AND NOT Nokia Rack 1) OR (Huawei Rack 1)
  let showCritical = (singleRecord?.status === 'critical' && !isNokiaRack1Override) || isHuaweiRack1;

  // NEW LOGIC: Override critical if in Simple Search (dashboard/dashboard2) AND Location is present
  // User Request: sur 'Détails de l'équipement' image 1 changer 'CRITIQUES' image 2 par 'OPÉRATIONNEL' image 3 lorsque sur onglet 'Recherche simple' 'Emplacement'<>'--' et statut='ACTIF'
  const isSimpleMode = activeTab === 'dashboard' || activeTab === 'dashboard2';
  const hasValidLocation = displayLocation && displayLocation !== '---' && displayLocation !== '--/--/--' && !displayLocation.includes('Unknown');

  if (isSimpleMode && hasValidLocation) {
      showCritical = false;
  }

  // Helper to color Slot and Port values
  const renderLocationValue = (loc: string) => {
    if (!loc) return '';

    // NEW: Handle FTTH Inventory format "RACH 0 SHELF 0 SLOT 18 PORT 10 ONT 12"
    const rachMatch = loc.match(/RACH\s*\d+\s*SHELF\s*\d+\s*SLOT\s*(\d+)\s*PORT\s*(\d+)\s*(?:ONT|ONUID)\s*(\d+)/i);
    if (rachMatch) {
        return (
            <>
                <span> SLOT <span className="text-blue-400">{rachMatch[1]}</span>/</span>
                <span> PORT <span className="text-emerald-400">{rachMatch[2]}</span>/</span>
                <span> ONT <span className="text-emerald-400">{rachMatch[3]}</span></span>
            </>
        );
    }

    const parts = loc.split('/');
    return (
        <>
            {parts.map((part, index) => {
                const lower = part.toLowerCase();
                let content: React.ReactNode = part;
                
                if (lower.includes('slot:')) {
                    const [label, val] = part.split(':');
                    content = <>{label}:<span className="text-blue-400">{val}</span></>;
                } else if (lower.includes('port:')) {
                    const [label, val] = part.split(':');
                    content = <>{label}:<span className="text-emerald-400">{val}</span></>;
                }
                
                return (
                    <span key={index}>
                        {content}
                        {index < parts.length - 1 && '/'}
                    </span>
                );
            })}
            <span>/<span className="text-red-500">x</span></span>
        </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fade-in-up" onClick={onClose}></div>
      <div className={`relative w-full ${isSingleView ? 'max-w-2xl' : 'max-w-5xl'} bg-slate-900 border border-blue-500/20 rounded-2xl shadow-[0_0_50px_rgba(37,99,235,0.15)] flex flex-col max-h-[85vh] overflow-hidden animate-fade-in-up ring-1 ring-white/5`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600"></div>
        <div className="flex items-center justify-between px-6 py-5 border-b border-blue-500/10 bg-slate-900/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border shadow-[0_0_15px_rgba(59,130,246,0.2)] ${isSingleView ? 'bg-blue-600/10 border-blue-500/30' : 'bg-primary/10 border-primary/20'} group`}>
              {isSingleView ? <Cpu className="w-6 h-6 text-blue-400 animate-pulse-soft" /> : <Activity className="w-6 h-6 text-primary animate-pulse-soft" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">{isSingleView ? 'Détails de l\'équipement' : 'Résultats de recherche'}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {isSingleView ? (
                  <span className="flex items-center gap-2">ID: <span className="text-blue-400">{singleRecord.id.split('-')[1]}</span></span>
                ) : (
                  <>Filtre trouvé : <span className="text-emerald-400 font-semibold">"{searchTerm.toUpperCase()}"</span> • <span className="text-emerald-400">{results.length}</span> correspondances</>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors group"><X className="w-6 h-6 group-hover:rotate-90 transition-transform" /></button>
        </div>
        {isSingleView ? (
          <div className="p-8 relative overflow-hidden bg-slate-950">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                 <div className="flex items-center gap-3"><span className="text-sm font-bold text-slate-400 uppercase tracking-widest pl-1">Statut Actuel</span></div>
                 {showCritical ? (
                    <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <AlertOctagon className="w-5 h-5 animate-pulse" />
                        <span className="font-bold tracking-wider">CRITIQUES</span>
                    </div>
                 ) : (
                    <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-bold tracking-wider">OPÉRATIONNEL</span>
                    </div>
                 )}
            </div>
            <div className="relative p-1 rounded-2xl bg-gradient-to-r from-blue-500/50 via-cyan-400/30 to-blue-500/50 mb-6 animate-fade-in-up shadow-[0_0_30px_rgba(59,130,246,0.1)]" style={{ animationDelay: '150ms' }}>
                <div className="absolute inset-0 bg-blue-500/5 blur-xl"></div>
                <div className="relative bg-slate-950 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                     <DetailCard label="NETO" value={displayMsan} icon={Server} delay={200} />
                     <DetailCard 
                        label="Emplacement" 
                        value={renderLocationValue(displayLocation)}
                        copyValue={displayLocation} 
                        icon={MapPin} 
                        delay={300} 
                     />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
              <DetailCard label="Serial Number (SN)" value={singleRecord.sn} icon={Hash} delay={400} />
              <DetailCard label="Software Version" value={singleRecord.version} icon={Cpu} delay={500} />
            </div>
            <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                 <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-semibold">ONTFinder Pro • VENDOR ID: {singleRecord.vendorId || 'N/A'}</span>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar bg-slate-900">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                 <Hash className="w-16 h-16 opacity-20 mb-4 animate-pulse" />
                 <p>Aucun résultat trouvé pour "{searchTerm}"</p>
              </div>
            ) : (
              results.map((row, index) => {
                const isCritical = row.status === 'critical';
                const isALCL = row.vendorId?.trim().toUpperCase().includes('ALCL') || row.version?.trim().toUpperCase().startsWith('ALCL');
                
                // NEW: Process MSAN and Location for display (Nokia specific logic)
                let displayMsan = row.msan;
                let displayLocation = row.location;
                
                if (isALCL && displayMsan && displayMsan.includes(':')) {
                    const colonIndex = displayMsan.indexOf(':');
                    const locStr = displayMsan.substring(colonIndex);
                    displayMsan = displayMsan.substring(0, colonIndex);
                    
                    if (!displayLocation || displayLocation === 'Unknown Location' || displayLocation === '--/--/--' || displayLocation === '---') {
                        const ltMatch = locStr.match(/LT(\d+)/i);
                        const ponMatch = locStr.match(/PON(\d+)/i);
                        if (ltMatch && ponMatch) {
                            displayLocation = `Slot:${ltMatch[1]}/Port:${ponMatch[1]}`;
                        } else {
                            displayLocation = locStr.startsWith(':') ? locStr.substring(1) : locStr;
                        }
                    }
                }
                
                const cleanedLocation = displayLocation.replace(/Frame:0\//gi, '');

                return (
                  <div key={row.id} style={{ animationDelay: `${index * 50}ms` }} className={`group relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 animate-fade-in-up ${isCritical ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/10' : 'bg-white/[0.02] border-white/5 hover:border-primary/30 hover:bg-white/[0.04]'}`}>
                      <div className="flex items-center gap-4 min-w-[30%]">
                          <div className={`p-3 rounded-lg ${isCritical ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400 group-hover:text-primary group-hover:bg-primary/10'} transition-all duration-300 group-hover:rotate-6`}>
                              <Server className="w-5 h-5 group-hover:animate-wiggle" />
                          </div>
                          <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">{displayMsan}</p>
                              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 font-mono group-hover:text-slate-300 transition-colors">
                                <MapPin className="w-3 h-3 group-hover:animate-icon-bounce" />
                                {renderLocationValue(cleanedLocation)}
                              </div>
                          </div>
                      </div>
                      <div className="flex-1 group/sn">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold group-hover/sn:text-slate-400 transition-colors">SN</span>
                              <span className="font-mono text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)] group-hover/sn:shadow-emerald-500/20 group-hover/sn:scale-105 transition-all">{row.sn}</span>
                           </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-end md:items-center gap-4 min-w-[25%] justify-end">
                          <div className="text-right">
                               <div className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1">Version</div>
                               <span className="text-xs font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-white/5 group-hover:text-white transition-colors">{row.version}</span>
                          </div>
                          {isCritical ? (
                              <div className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow-lg shadow-red-600/20 border border-red-400 flex items-center gap-2 group-hover:scale-105 transition-transform"><AlertOctagon className="w-4 h-4 animate-pulse" /><span>{isALCL ? 'ALCL CRITIQUES' : 'CRITIQUES'}</span></div>
                          ) : (
                              <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-2 group-hover:bg-emerald-500/20 transition-all"><CheckCircle2 className="w-4 h-4" /><span>OK</span></div>
                          )}
                      </div>
                  </div>
                );
              })
            )}
          </div>
        )}
        {!isSingleView && (
          <div className="px-6 py-4 bg-slate-950/50 border-t border-white/5 text-center"><button onClick={onClose} className="text-sm text-slate-500 hover:text-white transition-colors uppercase tracking-widest font-bold text-[10px] group">Fermer <span className="group-hover:translate-x-1 inline-block transition-transform">→</span></button></div>
        )}
      </div>
    </div>
  );
};
export default SearchDialog;