import React, { useState, useEffect, memo } from 'react';
import { ONTRecord } from '../types';
import { soundService } from '../services/soundService';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Server, MapPin, Database, AlertOctagon, AlertTriangle, Activity, CheckCircle2, Hash, Cpu, FileText, Calendar, Repeat } from 'lucide-react';
import { DigitalDisplay } from './DigitalDisplay';

interface DataTableProps {
  data: ONTRecord[];
  searchTerm?: string;
  msanFilter?: string;
  locationFilter?: string;
  onBannerClick?: () => void;
  onRowClick?: (row: ONTRecord) => void;
  onClearFilter?: () => void;
  isAlertsMode?: boolean;
  isSimpleMode?: boolean;
  lastImportDate?: string | null;
  activeTab?: string;
}

const highlightText = (text: string, filter: string | undefined, customStyle?: React.CSSProperties, sizeClass: string = "text-xs") => {
    // Uses dynamic sizeClass (default text-xs)
    const baseStyle = `${sizeClass} font-mono font-bold text-dim group-hover:text-cyan-100 transition-colors truncate tracking-wider`;
    if (!filter || !text) return <span className={baseStyle} style={customStyle}>{text}</span>;

    const lowerText = text.toLowerCase();
    const lowerFilter = filter.toLowerCase();

    if (lowerText.includes(lowerFilter)) {
        return (
            <span className={`${sizeClass} font-mono font-black tracking-wider text-cyan-300 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]`} style={customStyle}>
                {text}
            </span>
        );
    }
    return <span className={baseStyle} style={customStyle}>{text}</span>;
};

const HuaweiLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 512 512" className={className} fill="currentColor">
    <path d="M256,128c-23,0-44,9-60,24c0,0,32,48,60,88c28-40,60-88,60-88C300,137,279,128,256,128z" />
    <path d="M112,160c-20,12-36,30-46,51c0,0,50,33,95,50c18-47,42-93,42-93C174,159,143,156,112,160z" />
    <path d="M400,160c-31-4-62-1-91,8c0,0,24,46,42,93c45-17,95-50,95-50C436,190,420,172,400,160z" />
    <path d="M57,288c-4,23,0,47,12,68c0,0,56-9,101-5c-6-50-8-102-8-102C116,263,82,274,57,288z" />
    <path d="M455,288c-25-14-59-25-105-37c0,0-2,52-8,102c45-4,101,5,101,5C455,335,459,311,455,288z" />
    <path d="M128,416c11,21,29,38,50,49c0,0,36-40,60-80c-48-10-97-12-97-12C133,388,128,416,128,416z" />
    <path d="M384,416c0,0-5-28-13-43c0,0-49,2-97,12c24,40,60,80,60,80C355,454,373,437,384,416z" />
    <path d="M256,384c-35,0-68,6-98,16c14,24,34,44,58,58c13,8,27,12,40,12c13,0,27-4,40-12c24-14,44-34,58-58 C324,390,291,384,256,384z" />
  </svg>
);

const AlcatelLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
        <linearGradient id="alclGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6b4c9a" />
            <stop offset="100%" stopColor="#4f2d7f" />
        </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#alclGrad)" />
    <path d="M50 20 L25 80 L35 80 L50 40 L65 80 L75 80 Z" fill="white" />
    <path d="M32 60 L68 60" stroke="white" strokeWidth="5" />
  </svg>
);

const MsanLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className}>
    <defs>
      <linearGradient id="serverGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    <rect x="20" y="10" width="60" height="80" rx="4" fill="url(#serverGrad)" stroke="#475569" strokeWidth="2" />
    <rect x="25" y="20" width="50" height="10" rx="2" fill="#1e293b" />
    <circle cx="30" cy="25" r="2" fill="#22d3ee" />
    <rect x="25" y="35" width="50" height="10" rx="2" fill="#1e293b" />
    <circle cx="30" cy="40" r="2" fill="#facc15" />
    <rect x="25" y="50" width="50" height="10" rx="2" fill="#1e293b" />
    <circle cx="30" cy="55" r="2" fill="#34d399" />
    <rect x="25" y="65" width="50" height="10" rx="2" fill="#1e293b" />
    <circle cx="30" cy="70" r="2" fill="#f87171" />
  </svg>
);

const LocationBadge = ({ location, filter, isMatrixMode, activeTab }: { location: string, filter?: string, isMatrixMode?: boolean, activeTab?: string }) => {
    let rack = '0', shelf = '0', slot = '0', port = '0', onuId: string | undefined = undefined;
    let isParsed = false;
    
    // Size logic: Increase if NOT matrix mode (Simple Search)
    const textSizeClass = isMatrixMode ? 'text-[10px]' : 'text-sm';
    const labelSizeClass = isMatrixMode ? 'text-[9px]' : 'text-[10px]';
    
    // Custom style for Matrix Mode Rows - Font Size 12pt, Font Microsoft Sans Serif
    const matrixStyle: React.CSSProperties | undefined = isMatrixMode 
        ? { fontFamily: '"Microsoft Sans Serif", sans-serif', fontSize: '12pt' } 
        : undefined;

    // User Request: sur onglet 'Inventaire FTTH' remplacer 'SLOT 18/ PORT 0/ ONT 16' par 'Slot18/Port0/ONT16'
    let displayLocation = location;
    if (activeTab === 'dashboard2' && location) {
        // Match "SLOT X/ PORT Y/ ONT Z" or "SLOT X/ PORT Y/ ONU ID Z"
        const specificMatch = location.match(/SLOT\s*(\d+)\s*\/\s*PORT\s*(\d+)\s*\/\s*(?:ONT|ONU ID)\s*(\d+)/i);
        if (specificMatch) {
            displayLocation = `Slot${specificMatch[1]}/Port${specificMatch[2]}/ONT${specificMatch[3]}`;
        }
    }

    if (location) {
        const normalized = location.toUpperCase().replace(/\s/g, '');
        const fspMatch = normalized.match(/FRAME:(\d+)\/SLOT:(\d+)\/PORT:(\d+)/);
        const fsspMatch = normalized.match(/FRAME:(\d+)\/SHELF:(\d+)\/SLOT:(\d+)\/PORT:(\d+)/);
        const rachMatch = normalized.match(/RACH(\d+)SHELF(\d+)SLOT(\d+)PORT(\d+)(?:(?:ONT|ONUID)(\d+))?/);

        if (fsspMatch) {
            rack = fsspMatch[1]; shelf = fsspMatch[2]; slot = fsspMatch[3]; port = fsspMatch[4]; isParsed = true;
        } else if (fspMatch) {
            rack = fspMatch[1]; shelf = '0'; slot = fspMatch[2]; port = fspMatch[3]; isParsed = true;
        } else if (rachMatch) {
            rack = rachMatch[1]; shelf = rachMatch[2]; slot = rachMatch[3]; port = rachMatch[4]; onuId = rachMatch[5]; isParsed = true;
        } else {
             const parts = location.split('/').map(s => s.trim());
             if (parts.length === 3 && parts.every(p => /^\d+$/.test(p))) {
                 rack = parts[0]; shelf = '0'; slot = parts[1]; port = parts[2]; isParsed = true;
             } else if (parts.length === 4 && parts.every(p => /^\d+$/.test(p))) {
                 rack = parts[0]; shelf = parts[1]; slot = parts[2]; port = parts[3]; isParsed = true;
             }
        }
    }

    // RULE: If RACK is 1 and SHELF is 0, display SHELF as 1
    if (rack === '1' && shelf === '0') {
        shelf = '1';
    }

    if (!isParsed) {
       // Pass the dynamic text size class for unparsed locations
       return (
           <div className="flex items-center gap-2">
               {highlightText(displayLocation, filter, matrixStyle, isMatrixMode ? 'text-xs' : 'text-sm')}
           </div>
       );
    }

    const badgeItems = onuId !== undefined 
        ? [
            { label: 'SHELF', val: shelf },
            { label: 'SLOT', val: slot },
            { label: 'PORT', val: port },
            { label: 'ONU ID', val: onuId }
          ]
        : [
            { label: 'RACK', val: rack },
            { label: 'SHELF', val: shelf },
            { label: 'SLOT', val: slot },
            { label: 'PORT', val: port }
          ];

    return (
        <div className="flex items-center gap-2">
            {badgeItems.map((item, idx) => {
                let colorClass = 'text-cyan-400';
                let shadowClass = 'drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]';

                if (idx === 2) {
                    colorClass = 'text-blue-400';
                    shadowClass = 'drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]';
                } else if (idx === 3) {
                    colorClass = 'text-emerald-400';
                    shadowClass = 'drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]';
                }

                return (
                    <div key={idx} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-card border border-main shadow-sm group-hover:border-cyan-500/30 group-hover:bg-surface transition-all">
                        <span className={`${labelSizeClass} font-black text-dim uppercase tracking-wider group-hover:text-dim`}>{item.label}</span>
                        <span 
                            className={`${textSizeClass} font-bold ${colorClass} font-mono leading-none ${shadowClass}`}
                            style={matrixStyle}
                        >
                            {item.val}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

// Header for Massive Search Mode
const MassiveHeader = ({ activeTab }: { activeTab?: string }) => (
    <div className="shrink-0 px-2 sm:px-4 mb-2 animate-fade-in-up">
        <div className="flex items-center px-4 py-3.5 rounded-xl bg-surface border border-blue-500/20 shadow-lg gap-2 relative overflow-hidden">
            {/* Glossy sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

            {/* Col 1: CMD NETO - 15% */}
            <div className="w-[15%] flex items-center justify-start relative z-10">
                 <FileText className="w-4 h-4 text-dim" />
                 <span className="text-[12px] font-black text-main uppercase tracking-widest truncate ml-2">CMD NETO</span>
            </div>
            
            {/* Col 2: NUMÉRO DE SÉRIE - 20% */}
            <div className="w-[20%] flex items-center gap-2 pl-3 border-l border-main relative z-10">
                 <Hash className="w-4 h-4 text-purple-400" />
                 <span className="text-[12px] font-black text-purple-100 uppercase tracking-widest truncate">NUMÉRO DE SÉRIE</span>
            </div>
            
            {/* Col 3: EMPLACEMENT - 25% (Swapped with Date) */}
            <div className="w-[25%] flex items-center gap-2 pl-3 border-l border-main relative z-10">
                 <MapPin className="w-4 h-4 text-cyan-400" />
                 <span className="text-[12px] font-black text-cyan-100 uppercase tracking-widest truncate">EMPLACEMENT</span>
            </div>

            {/* Col 4: DATE ET HEURE - 20% (Swapped with Emplacement) */}
            <div className="w-[20%] flex items-center gap-2 pl-3 border-l border-main relative z-10">
                 <Calendar className="w-4 h-4 text-blue-400" />
                 <span className="text-[12px] font-black text-blue-100 uppercase tracking-widest truncate">DATE ET HEURE</span>
            </div>

            {/* Col 5: STATUT - 10% */}
            <div className="w-[10%] flex items-center gap-2 pl-3 border-l border-main relative z-10">
                 <AlertTriangle className="w-4 h-4 text-yellow-500" />
                 <span className="text-[12px] font-black text-yellow-100 uppercase tracking-widest ml-2 truncate">STATUT</span>
            </div>

            {/* Col 6: VENDEUR - 10% */}
            <div className="w-[10%] flex items-center justify-start border-l border-main pl-4 relative z-10">
                 <Cpu className="w-4 h-4 text-orange-400" />
                 <span className="text-[12px] font-black text-dim uppercase tracking-widest ml-2 truncate">VENDEUR</span>
            </div>
        </div>
    </div>
);

// Header for Standard Search Mode
const StandardHeader = ({ activeTab }: { activeTab?: string }) => (
    <div className="shrink-0 px-2 sm:px-4 mb-2 animate-fade-in-up">
        <div className="flex items-center px-4 py-3.5 rounded-xl bg-surface border border-blue-500/20 shadow-lg gap-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none"></div>

            {/* Col 1: NOM MSAN - 20% (Swapped from Col 2) */}
            <div className="w-[20%] flex items-center justify-start relative z-10">
                 {activeTab === 'recap' ? <Repeat className="w-4 h-4 text-blue-400" /> : <Database className="w-4 h-4 text-blue-400" />}
                 <span className="text-[12px] font-black text-main uppercase tracking-widest truncate ml-2">
                    {activeTab === 'recap' ? 'CMD NETO' : 'NOM MSAN'}
                 </span>
            </div>

            {/* Col 2: SN EN HÉXA - 22% (Swapped from Col 1) */}
            <div className="w-[22%] flex items-center gap-2 pl-4 border-l border-main relative z-10">
                 <Hash className="w-4 h-4 text-purple-400" />
                 <span className="text-[12px] font-black text-purple-100 uppercase tracking-widest truncate">SN EN HÉXA</span>
            </div>

            {/* Col 3: EMPLACEMENT - 28% */}
            <div className="w-[23%] flex items-center gap-2 pl-3 border-l border-main relative z-10">
                 <MapPin className="w-4 h-4 text-cyan-400" />
                 <span className="text-[12px] font-black text-cyan-100 uppercase tracking-widest truncate">EMPLACEMENT</span>
            </div>

            {/* Col 4: SN en ASCII - 10% */}
            <div className="w-[15%] flex items-center justify-start border-l border-main pl-4 relative z-10">
                 <Cpu className="w-4 h-4 text-blue-400" />
                 <span className="text-[12px] font-black text-blue-100 uppercase tracking-widest ml-2 truncate">SN en ASCII</span>
            </div>

            {/* Col 5: STATUS (Icon) - 10% */}
            <div className="w-[10%] flex items-center justify-center border-l border-main pl-2 relative z-10">
                 {activeTab === 'recap' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Activity className="w-4 h-4 text-emerald-500" />}
            </div>

            {/* Col 6: VENDEUR - 10% */}
            <div className="w-[10%] flex items-center justify-start border-l border-main pl-4 relative z-10">
                 <Cpu className="w-4 h-4 text-orange-400" />
                 <span className="text-[12px] font-black text-dim uppercase tracking-widest ml-2 truncate">VENDEUR</span>
            </div>
        </div>
    </div>
);

const DataTableRow = memo(({ row, searchTerm, locationFilter, onClick, isAlertsMode, isSimpleMode, isVisited, lastImportDate, activeTab }: { row: ONTRecord; searchTerm: string; locationFilter?: string; onClick: () => void; isAlertsMode?: boolean; isSimpleMode?: boolean; isVisited?: boolean; lastImportDate?: string | null; activeTab?: string }) => {
    
    // --- LOCATION PARSING FOR RULES ---
    const snUpper = (row.sn || '').trim().toUpperCase();
    const versionUpper = (row.version || '').trim().toUpperCase();
    const locUpper = (row.location || '').toUpperCase().replace(/\s/g, '');
    let rack = '0';
    let shelf = '0';

    // Strict parsing to detect Shelf logic
    const fsspMatch = locUpper.match(/FRAME:(\d+)\/SHELF:(\d+)/);
    const fspMatch = locUpper.match(/FRAME:(\d+)\/SLOT:(\d+)/); 
    const rachMatch = locUpper.match(/RACH(\d+)SHELF(\d+)/);

    if (fsspMatch) {
        rack = fsspMatch[1];
        shelf = fsspMatch[2];
    } else if (fspMatch) {
        rack = fspMatch[1];
        shelf = '0';
    } else if (rachMatch) {
        rack = rachMatch[1];
        shelf = rachMatch[2];
    } else {
        const parts = row.location.split('/').map(s => s.trim());
        if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) {
            rack = parts[0];
            if (parts.length === 4) {
                shelf = parts[1];
            } else {
                shelf = '0';
            }
        }
    }

    // Apply Location Normalization Rule: If Rack 1 and Shelf 0 -> Treat as Shelf 1
    if (rack === '1' && shelf === '0') {
        shelf = '1';
    }

    // --- CRITICAL STATUS DETECTION LOGIC ---
    let isNewCriticalRule = false;
    
    // Rule: HWT start
    if (snUpper.startsWith('HWT')) {
        isNewCriticalRule = true;
    } 
    // Rule: 414C start (Hex) or ALCL start (ASCII) + Special Locations
    else if (snUpper.startsWith('414C') || versionUpper.startsWith('ALCL')) {
         // Existing: Rack 0 is Critical
         if (rack === '0') {
             isNewCriticalRule = true;
         }
    }

    // --- BLUE/RED SN DETECTION LOGIC ---
    let effectiveStatus = row.status;
    const vendorUpper = (row.vendorId || '').toUpperCase();
    
    const isNokia = vendorUpper.includes('ALCL') || versionUpper.startsWith('ALCL');
    // Huawei detection (Approximation covers explicit ID or SN patterns)
    const isHuawei = vendorUpper.includes('HWTC') || vendorUpper.includes('HUAWEI') || snUpper.startsWith('4857') || snUpper.startsWith('HWT') || vendorUpper === 'HUAWEI';

    // Specific Condition: Huawei & Rack 1 (Must override Blue)
    const isHuaweiRack1 = isHuawei && rack === '1';

    // Rule: Vendor is HUAWEI AND Rack is 0 -> Blue
    // Rule: Vendor is NOKIA AND Rack is 1 -> Blue (Requested)
    // IMPORTANT: Exclude HuaweiRack1 from Blue Condition explicitly
    const isBlueCondition = ((isHuawei && rack === '0') || (isNokia && rack === '1')) && !isHuaweiRack1;

    // Rule: Vendor is NOKIA (ALCL) AND Rack is 0 -> Red
    // Rule: Vendor is HUAWEI AND Rack is 1 -> Red (CRITIQUES)
    const isRedCondition = ((isNokia && rack === '0') || isHuaweiRack1);

    if (effectiveStatus === 'isolated' && isNokia) {
        effectiveStatus = 'critical';
    }

    // MODIFIED: FORCE Critical styling (Red Background) for Huawei Rack 1 as requested.
    // Logic: If RedCondition is true, it is Critical. 
    // If BlueCondition is true, it is NOT Critical (unless contradicted, but logic separates them).
    let isCritical = (effectiveStatus === 'critical' || isNewCriticalRule || isRedCondition) && !isBlueCondition;
    // ----------------------------------------

    const isMatrixMode = activeTab === 'matrix' || activeTab === 'workflow' || activeTab === 'recap' || searchTerm === 'MASSIVE';
    
    let col1 = row.msan;
    let col2 = row.location; 
    
    // NEW: Extract location from NOM MSAN for NOKIA records in Simple Search
    if (!isMatrixMode && isNokia && col1 && col1.includes(':')) {
        const colonIndex = col1.indexOf(':');
        const locStr = col1.substring(colonIndex);
        col1 = col1.substring(0, colonIndex);
        
        const rMatch = locStr.match(/R(\d+)/i);
        const sMatch = locStr.match(/S(\d+)/i);
        const ltMatch = locStr.match(/LT(\d+)/i);
        const ponMatch = locStr.match(/PON(\d+)/i);
        
        if (ltMatch && ponMatch) {
            const rackVal = rMatch ? rMatch[1] : '0';
            const shelfVal = sMatch ? sMatch[1] : '0';
            col2 = `${rackVal}/${shelfVal}/${ltMatch[1]}/${ponMatch[1]}`;
        } else {
            col2 = locStr.startsWith(':') ? locStr.substring(1) : locStr;
        }
    }

    // NEW: In Simple Search, if EMPLACEMENT is not '---', set status to 'ACTIF'
    if (!isMatrixMode && col2 && col2 !== '---') {
        effectiveStatus = 'active';
        
        // EXCEPTION: Huawei + Rack 1 + Active -> Red (Critical)
        if (isHuaweiRack1) {
             isCritical = true;
        } else {
             // Otherwise: Location + Active -> Not Critical (Blue/Standard)
             isCritical = false;
        }
    }
    
    // NEW: Workflow Special Rule (Matrix Mode)
    // If CMD NETO <> '---' AND EMPLACEMENT == '---' AND STATUT == 'CRITIQUES'
    // Replace STATUT='ISOLÉ' and color row yellow except CMD NETO
    const isCmdNetoPresent = col1 && col1 !== '---';
    const isEmplacementMissing = !col2 || col2 === '---';
    
    const isWorkflowSpecialRule = isMatrixMode && isCmdNetoPresent && isEmplacementMissing && (isCritical || effectiveStatus === 'isolated');
    const isNokiaYellowRule = isMatrixMode && isNokia && isEmplacementMissing && isCmdNetoPresent && col1 !== '0' && col1 !== '---';
    
    if (isWorkflowSpecialRule || isNokiaYellowRule) {
        isCritical = false; // Override critical status
    }

    const isIsolated = effectiveStatus === 'isolated';
    const isActiveStatus = effectiveStatus === 'active';
    const isSimpleAlcl = !isMatrixMode && isNokia;
    const isAlclCritical = isMatrixMode && isCritical && isNokia;
    const isImplicitHwtc = isMatrixMode && isIsolated && (!row.vendorId || row.vendorId === '--');
    
    const col3 = isMatrixMode ? row.version : row.sn;
    const col4 = isMatrixMode ? row.sn : row.version;
    
    let col5 = row.vendorId || '--';
    if (col5 === 'HWTC') col5 = 'HUAWEI';
    if (isImplicitHwtc) col5 = 'HUAWEI';
    
    // Custom style for Matrix Mode Rows - Font Size 12pt, Font Microsoft Sans Serif
    const rowTextStyle = isMatrixMode ? { fontFamily: '"Microsoft Sans Serif", sans-serif', fontSize: '12pt' } : undefined;

    // Logic for Matrix Mode Custom Location Display: NOM MSAN: Slot :X/Port :Y (Applied to Col 4 - EMPLACEMENT)
    let matrixLocationDisplay: React.ReactNode = '';
    
    if (isMatrixMode && col2 && col2 !== '---') {
         let slot = '0';
         let port = '0';
         const cleanLoc = col2.toUpperCase().replace(/\s/g, '');
         // Regex for SLOT:X/PORT:Y or SLOTXPORTY
         const spMatch = cleanLoc.match(/SLOT:?(\d+)\/?PORT:?(\d+)/);
         
         if (spMatch) {
             slot = spMatch[1];
             port = spMatch[2];
         } else {
             // Fallback for 1/1/1 format
             const parts = col2.split('/');
             if (parts.length >= 3) {
                 slot = parts[1].trim();
                 port = parts[2].trim();
             }
         }
         // Format: NOM MSAN: 4(blue)/3(green)/x(red) with separators
         matrixLocationDisplay = (
            <>
                <span className="text-white">{col4}:</span> <span className="text-blue-400 font-bold">{slot}</span><span className="text-slate-500 font-bold mx-0.5">/</span><span className="text-emerald-400 font-bold">{port}</span><span className="text-slate-500 font-bold mx-0.5">/</span><span className="text-red-500 font-bold">x</span>
            </>
         );
    } else {
        // Fallback or empty state representation
        matrixLocationDisplay = (
            <span className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] tracking-wide whitespace-nowrap" style={rowTextStyle}>
                {isMatrixMode && col2 && col2 !== '---' ? col2 : '---'}
            </span>
        );
    }

    // DATE SYSTEM GENERATION FOR MATRIX MODE
    let dateDisplay = '';
    let timeDisplay = '';

    if (lastImportDate) {
         // Clean up prefixes like "ExportÉ" or "Save Time"
         const cleanDate = lastImportDate.replace(/^(ExportÉ|Save\s*Time)[:\s]*/i, '').trim();
         
         const parts = cleanDate.split(/\s+/);
         if (parts.length >= 2) {
             dateDisplay = parts[0];
             timeDisplay = parts.slice(1).join(' ');
         } else {
             dateDisplay = cleanDate;
         }
    } else {
        const now = new Date();
        dateDisplay = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        timeDisplay = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // NEW: Detection for special styling in Simple Mode (SN ASCII starts with ALCL & Rack 1)
    const isAlclRack1 = !isMatrixMode && (col4 || '').trim().toUpperCase().startsWith('ALCL') && rack === '1';

    // NEW: User Request Rule (Nokia + Rack 1 + Location Present -> White/Blue Inverted)
    const isNokiaRack1LocPresent = !isMatrixMode && col2 && col2 !== '---' && isNokia && rack === '1';

    const renderSN = () => {
        const snText = col3;
        const term = searchTerm.trim();
        
        // MODIFIED: Search matching logic on full SN
        const isMatch = term && term !== 'MASSIVE' && snText.toLowerCase().includes(term.toLowerCase());
        
        let snStyleClass = 'text-cyan-400';
        let dotStyleClass = 'bg-cyan-600 shadow-[0_0_5px_rgba(6,182,212,0.8)]';
        let labelText = 'SN ONT VISIBLE';
        let labelClass = 'text-dim group-hover:text-dim';

        // NEW: Check if location is present (Simple Search only)
        const hasLocation = !isMatrixMode && col2 && col2 !== '---';

        if (isMatch) {
            // Updated style: White text, Emerald Green background (inverse)
            snStyleClass = 'text-white bg-emerald-600 px-2 py-0.5 rounded shadow-lg shadow-emerald-600/50';
            dotStyleClass = 'bg-white';
            labelText = 'MATCH (4ème char)';
        } else if (isRedCondition && (!hasLocation || isHuaweiRack1)) {
             // PRIORITY: Red SN Logic (Huawei R1 OR Nokia R0)
             // Force Red color for Huawei Rack 1 as requested for Simple Search
             // BUT ONLY IF NO LOCATION IS PRESENT (User Request: Location + Active -> Blue)
             // EXCEPTION: Huawei Rack 1 is ALWAYS Red (Critical) regardless of location
             snStyleClass = 'text-red-500 font-black drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]';
             dotStyleClass = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]';
             
             if (isNokia) {
                 labelText = 'SN ONT NOKIA (R0)';
             } else {
                 labelText = 'SN ONT HUAWEI (R1)';
             }
             
             labelClass = 'text-red-400 group-hover:text-red-300';
        } else if (isBlueCondition || hasLocation) {
             // Blue SN Logic (Huawei R0 OR Nokia R1) OR Forced Blue by Location
             // User Request: sur onglet 'Recherche simple' si 'Emplacement'<>'--' et statut='ACTIF' colorer données position 'SN en ASCII' comme dans l'mage.
             if (!isMatrixMode && hasLocation && isActiveStatus) {
                 snStyleClass = 'text-white bg-blue-600 px-2 py-0.5 rounded shadow-lg shadow-blue-600/50 font-bold tracking-wider';
                 dotStyleClass = 'bg-white';
                 labelText = 'SN ONT VISIBLE';
             } else {
                 snStyleClass = 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]';
                 dotStyleClass = 'bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]';
             }
             
             if (isNokia) {
                labelText = 'SN ONT NOKIA (R1)';
             } else {
                labelText = 'SN ONT HUAWEI (R0)';
             }
             
             labelClass = 'text-sky-400 group-hover:text-sky-300';
        } else if (isCritical) {
             snStyleClass = 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';
             dotStyleClass = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse';
             labelText = 'SN ONT CRITIQUE';
             labelClass = 'text-red-400 group-hover:text-red-300';
        } else if (isMatrixMode && (isIsolated || isWorkflowSpecialRule || isNokiaYellowRule)) {
             snStyleClass = 'text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]';
             dotStyleClass = 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.8)] animate-pulse';
             labelText = 'SN ONT NON VISIBLE';
             labelClass = 'text-yellow-500 group-hover:text-yellow-400';
             
             // NEW: Special Rule for Workflow (CMD NETO present, No Location, Isolated) -> Yellow SN
             if (isWorkflowSpecialRule) {
                 snStyleClass = 'text-yellow-400 font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]';
                 labelText = 'ONT ISOLÉ (NO LOC)';
             }

             // NEW: Nokia + Isolated + CMD NETO present -> Yellow SN
             if (isNokiaYellowRule) {
                 snStyleClass = 'text-yellow-400 font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]';
                 labelText = 'ONT ISOLÉ (NOKIA)';
             }
        } else if (isMatrixMode && isActiveStatus) {
             snStyleClass = 'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
             dotStyleClass = 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse';
             labelText = 'SN ONT VISIBLE';
             labelClass = 'text-emerald-500 group-hover:text-emerald-400';
        } else if (isSimpleAlcl) {
            snStyleClass = 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            dotStyleClass = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)] animate-pulse';
        }

        return (
            <div className="flex flex-col justify-center">
                 {/* Increased from text-base to text-lg in Simple Mode */}
                 <span 
                    className={`${!isMatrixMode ? 'text-lg' : 'text-sm'} font-mono font-black tracking-widest transition-all ${snStyleClass}`}
                    style={rowTextStyle}
                 >
                    {snText}
                 </span>
                 <div className="flex items-center gap-1.5 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <div className={`w-1.5 h-1.5 rounded-full ${dotStyleClass}`}></div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider transition-colors ${labelClass}`}>
                        {labelText}
                    </span>
                 </div>
            </div>
        );
    };

    const renderVendorBadge = () => {
        // MODIFIED: Use Huawei styling (White/Red) if row is Huawei OR if it's an implicit Huawei (Isolated in Matrix mode)
        if (isHuawei || isImplicitHwtc) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-red-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all">
                    <HuaweiLogo className="w-5 h-5 text-[#C8102E]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#C8102E]">HUAWEI</span>
                </div>
            );
        }
        
        if (isNokia) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-purple-200 shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">
                    <AlcatelLogo className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#542E91]">NOKIA</span>
                </div>
            );
        }

        return (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border bg-slate-800 border-white/5 text-slate-500">
                {col5}
            </span>
        );
    };

    const isIsolatedDisplay = !isCritical && (isIsolated || isWorkflowSpecialRule || isNokiaYellowRule);

    return (
        <div 
            onClick={isIsolatedDisplay ? undefined : onClick}
            className={`group relative flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-300 ${isIsolatedDisplay ? 'cursor-default' : 'cursor-pointer'} gap-2 overflow-hidden
                ${isCritical 
                    ? 'bg-red-950/20 hover:bg-red-950/30' 
                    : (isWorkflowSpecialRule || isNokiaYellowRule) 
                        ? 'bg-yellow-500/10 hover:bg-yellow-500/20'
                        : 'bg-card hover:bg-surface hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                }`}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${isCritical ? 'bg-red-500' : isWorkflowSpecialRule ? 'bg-yellow-500' : 'bg-transparent group-hover:bg-cyan-500'}`}></div>

            {/* Col 1: Matrix(CMD NETO) / Simple(NOM MSAN) */}
            <div className={`${isMatrixMode ? 'w-[15%]' : 'w-[20%]'} flex items-center gap-2 overflow-hidden pl-3`}>
                {isMatrixMode ? (
                    <div className="flex flex-col justify-center items-start gap-1 pl-1">
                        <span 
                            className={`text-xs font-black tracking-wide leading-none transition-colors break-all whitespace-normal ${isVisited ? 'text-teal-400' : 'text-main group-hover:text-cyan-400'}`}
                            style={rowTextStyle}
                        >
                            {col1}
                        </span>
                         <div className="flex items-center gap-1.5">
                             <MsanLogo className="w-4 h-4" />
                             <span className="text-[9px] font-bold text-dim uppercase tracking-widest group-hover:text-dim transition-colors">CMD NETO</span>
                         </div>
                    </div>
                ) : (
                    // Simple Mode: MSAN
                    <div className="flex flex-col justify-center gap-1">
                        <span className={`text-sm font-mono font-bold break-all whitespace-normal leading-tight transition-colors uppercase tracking-wider ${isCritical ? 'text-red-200' : 'text-main group-hover:text-main'}`}>
                            {col1}
                        </span>
                    </div>
                )}
            </div>

            {/* Col 2: Matrix(SN EN HÉXA) / Simple(SN EN HÉXA) */}
            <div className={`${isMatrixMode ? 'w-[20%]' : 'w-[22%]'} flex items-center pl-4 overflow-hidden`}>
                 <div className="py-0.5">
                    {renderSN()}
                 </div>
            </div>

            {isMatrixMode ? (
                <>
                    {/* Matrix Col 3: EMPLACEMENT - CUSTOM FORMAT: NOM MSAN: Slot :X/Port :Y */}
                    <div className="w-[25%] flex items-center gap-2 pl-3 overflow-hidden">
                        {isAlclCritical ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-red-500 tracking-widest">---</span>
                            </div>
                        ) : (isImplicitHwtc || isWorkflowSpecialRule) ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-black text-yellow-500 tracking-widest">---</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span 
                                    className="text-xs font-mono font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.3)] tracking-wide whitespace-nowrap"
                                    style={rowTextStyle}
                                >
                                    {matrixLocationDisplay}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Matrix Col 4: DATE ET HEURE (Previously Col 3) */}
                    <div className="w-[20%] flex items-center justify-start pl-4 overflow-hidden">
                        {(isAlclCritical || isImplicitHwtc || isWorkflowSpecialRule) ? (
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono font-black tracking-widest ${isAlclCritical ? 'text-red-500' : 'text-yellow-500'}`}>---</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 w-full">
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3 text-dim" />
                                        <span className="text-xs font-mono font-bold text-main tracking-wide" style={rowTextStyle}>{dateDisplay}</span>
                                    </div>
                                    {timeDisplay && (
                                        <span className="text-[10px] font-mono font-black text-cyan-400 pl-5 tracking-wider drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]">{timeDisplay}</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Matrix Col 5: STATUT */}
                    <div className="w-[10%] flex items-center justify-center pl-2 overflow-hidden">
                        <div className="flex items-center">
                            {isCritical ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                    <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-wider hidden sm:inline-block">CRITIQUES</span>
                                </div>
                            ) : (isIsolated || isWorkflowSpecialRule) ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider hidden sm:inline-block">ISOLÉ</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    {activeTab === 'recap' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Activity className="w-3.5 h-3.5 text-emerald-500" />}
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider hidden sm:inline-block">
                                        {activeTab === 'recap' ? 'VALIDÉ' : 'ACTIF'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* Standard Col 3: EMPLACEMENT */}
                    <div className="w-[23%] flex items-center gap-2 pl-3 overflow-hidden">
                        <LocationBadge location={col2} filter={locationFilter} isMatrixMode={isMatrixMode} activeTab={activeTab} />
                    </div>

                    {/* Standard Col 4: SN ASCII */}
                    <div className="w-[15%] flex items-center justify-start pl-4 overflow-hidden">
                        <div className="flex items-center gap-2 w-full">
                            <div className="flex flex-col items-start justify-center w-full">
                                    <span className={`text-sm font-mono font-black tracking-widest truncate block
                                    ${isNokiaRack1LocPresent
                                        ? 'text-blue-600 bg-white px-2 py-0.5 rounded shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                                        : isAlclRack1
                                        ? 'text-teal-50 bg-emerald-600 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                                        : isRedCondition
                                            ? 'text-white bg-red-600 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                            : isBlueCondition 
                                                ? 'text-sky-400 drop-shadow-[0_0_5px_rgba(56,189,248,0.8)]'
                                                : isSimpleAlcl 
                                                    ? 'text-red-400 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' 
                                                    : 'text-cyan-400 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]'
                                    }`}>
                                    {col4 || '--'}
                                    </span>
                            </div>
                        </div>
                    </div>

                    {/* Standard Col 5: STATUS */}
                    <div className="w-[10%] flex items-center justify-center pl-2 overflow-hidden">
                        <div className="flex items-center">
                            {isCritical ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-red-500/10 border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                                    <AlertOctagon className="w-3.5 h-3.5 text-red-500" />
                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-wider hidden sm:inline-block">CRITIQUES</span>
                                </div>
                            ) : (isIsolated && !isSimpleMode) ? (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                                    <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider hidden sm:inline-block">ISOLÉ</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                    {activeTab === 'recap' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Activity className="w-3.5 h-3.5 text-emerald-500" />}
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wider hidden sm:inline-block">
                                        {activeTab === 'recap' ? 'VALIDÉ' : 'ACTIF'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Col 6: VENDEUR (Moved to End, was Col 1) */}
            <div className={`${isMatrixMode ? 'w-[10%]' : 'w-[10%]'} flex items-center justify-start overflow-hidden border-l border-white/5 pl-4`}>
                 {renderVendorBadge()}
            </div>

            {/* Hover Effects */}
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`p-1.5 rounded-full ${isCritical ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'} backdrop-blur-sm`}>
                    <CheckCircle2 className="w-3 h-3" />
                </div>
            </div>
        </div>
    );
});

const DataTable: React.FC<DataTableProps> = ({ data, searchTerm, msanFilter, locationFilter, onBannerClick, onRowClick, onClearFilter, isAlertsMode, isSimpleMode, lastImportDate, activeTab }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [visitedRows, setVisitedRows] = useState<Set<string>>(new Set());
    
    // Dynamic Rows Per Page Logic: 10 for Massive Search, 50 otherwise
    const isMassiveMode = activeTab === 'matrix' || activeTab === 'workflow' || activeTab === 'recap' || searchTerm === 'MASSIVE';
    const rowsPerPage = isMassiveMode ? 10 : 50;

    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, searchTerm, msanFilter, locationFilter]);

    const totalPages = Math.ceil(data.length / rowsPerPage);
    const paginatedData = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            soundService.playClick();
            setCurrentPage(newPage);
            const tableContainer = document.getElementById('table-container');
            if (tableContainer) {
                tableContainer.scrollTop = 0;
            }
        }
    };

    const handleRowClickInternal = (row: ONTRecord) => {
        setVisitedRows(prev => {
            const newSet = new Set(prev);
            newSet.add(row.id);
            return newSet;
        });
        if (onRowClick) onRowClick(row);
    };

    return (
        <div className="w-full flex flex-col h-full overflow-hidden animate-fade-in-up">
            {/* Conditional Header Rendering */}
            {isMassiveMode ? <MassiveHeader activeTab={activeTab} /> : <StandardHeader activeTab={activeTab} />}

            <div id="table-container" className="flex-grow overflow-y-auto custom-scrollbar px-2 sm:px-4 pb-4">
                 {paginatedData.map((row, idx) => (
                    <DataTableRow 
                        key={`${row.id}-${idx}`}
                        row={row} 
                        searchTerm={searchTerm || ''}
                        locationFilter={locationFilter}
                        onClick={() => handleRowClickInternal(row)}
                        isAlertsMode={isAlertsMode}
                        isSimpleMode={isSimpleMode}
                        isVisited={visitedRows.has(row.id)}
                        lastImportDate={lastImportDate}
                        activeTab={activeTab}
                    />
                 ))}
                 
                 {/* Empty Spacer */}
                 <div className="h-10"></div>
            </div>
            
            {/* Pagination Controls - Visible if there is data */}
            {data.length > 0 && (
                <div className="flex-shrink-0 py-4 px-6 bg-slate-950/80 backdrop-blur-md border-t border-white/5 flex items-center justify-between z-10">
                     {/* Left side info */}
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                             <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                PAGE 
                                <DigitalDisplay value={currentPage} color="cyan" size="sm" />
                                /
                                <DigitalDisplay value={Math.max(1, totalPages)} color="white" size="sm" />
                            </span>
                         </div>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline-block flex items-center gap-2">
                            <DigitalDisplay value={data.length} color="blue" size="sm" />
                            RÉSULTATS
                        </span>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            {/* First Page Button */}
                            <button 
                                onClick={() => handlePageChange(1)}
                                disabled={currentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 group"
                                title="Première page"
                            >
                                <ChevronsLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>

                            {/* Prev Button */}
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 group"
                                title="Page précédente"
                            >
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pNum;
                                    if (totalPages <= 5) {
                                        pNum = i + 1;
                                    } else {
                                        // Sliding window logic that avoids duplicates
                                        if (currentPage <= 3) {
                                            pNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pNum = totalPages - 4 + i;
                                        } else {
                                            pNum = currentPage - 2 + i;
                                        }
                                    }
                                    
                                    const isActive = currentPage === pNum;
                                    return (
                                        <button
                                            key={`page-${pNum}`}
                                            onClick={() => handlePageChange(pNum)}
                                            className={`min-w-[2.5rem] px-1.5 h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                                                isActive 
                                                ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-lg shadow-cyan-500/25 scale-105' 
                                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                        >
                                            <DigitalDisplay value={pNum} color={isActive ? 'cyan' : 'white'} size="sm" />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next Button */}
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 group"
                                title="Page suivante"
                            >
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>

                            {/* Last Page Button */}
                            <button 
                                onClick={() => handlePageChange(totalPages)}
                                disabled={currentPage === totalPages}
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 group"
                                title="Dernière page"
                            >
                                <ChevronsRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataTable;