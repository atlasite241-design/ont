import React, { useRef, useState, useEffect } from 'react';
import { Search, ChevronDown, Database, Check, FileText } from 'lucide-react';
import { soundService } from '../services/soundService';

interface MsanSelectorProps {
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  activeTab?: string;
}

export const MsanSelector: React.FC<MsanSelectorProps> = ({ options, value, onChange, disabled, className = "", compact = false, activeTab }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) setSearch("");
  }, [isOpen]);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`relative group ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
           if (!disabled) {
             soundService.playClick();
             setIsOpen(!isOpen);
           }
        }}
        className={`flex items-center justify-between w-full px-3 bg-card backdrop-blur-md rounded-xl focus:outline-none transition-all cursor-pointer hover:bg-card/80 h-full group shadow-sm`}
      >
         {value ? (
             <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className={`flex items-center justify-center rounded-lg bg-cyan-950/30 shrink-0 ${compact ? 'w-5 h-5' : 'w-8 h-8'}`}>
                    {activeTab === 'recap' ? (
                        <FileText className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                    ) : (
                        <Database className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-cyan-400`} />
                    )}
                </div>
                 <div className="flex flex-col items-start overflow-hidden gap-0.5">
                    <span className="text-[7px] font-black text-dim uppercase tracking-widest leading-none">
                        {activeTab === 'recap' ? 'CMD NETO SÉLECTIONNÉ' : 'MSAN SÉLECTIONNÉ'}
                    </span>
                    <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-mono font-bold text-cyan-400 tracking-wider truncate leading-none drop-shadow-[0_0_5px_rgba(6,182,212,0.3)]`}>
                        {value}
                    </span>
                </div>
             </div>
         ) : (
             <div className="flex items-center gap-3 w-full pl-1">
                {activeTab === 'recap' ? (
                    <FileText className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-dim group-hover:text-cyan-500 transition-colors shrink-0`} />
                ) : (
                    <Database className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} text-dim group-hover:text-cyan-500 transition-colors shrink-0`} />
                )}
                <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-dim uppercase tracking-widest group-hover:text-main transition-colors truncate`}>
                    {activeTab === 'recap' ? 'CMD NETO' : 'TOUS LES MSAN...'}
                </span>
             </div>
         )}
         
         <ChevronDown className={`h-3 w-3 text-dim transition-transform duration-300 shrink-0 ml-2 ${isOpen ? 'rotate-180 text-cyan-400' : 'group-hover:text-main'}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[100] overflow-hidden flex flex-col max-h-[300px] min-w-[200px] animate-fade-in-up origin-top">
           <div className="p-2 border-b border-main bg-surface/50 backdrop-blur-md sticky top-0 z-10">
              <div className="relative group/search">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim group-focus-within/search:text-cyan-400 transition-colors" />
                 <input 
                    autoFocus
                    type="text" 
                    className="w-full bg-card border border-main rounded-lg py-2 pl-9 pr-3 text-[11px] text-main placeholder-dim focus:outline-none focus:border-cyan-500/50 transition-colors font-medium tracking-wide uppercase"
                    placeholder="FILTRER LA LISTE..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()} 
                 />
              </div>
           </div>
           
           <div className="overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
              <div 
                 className="px-3 py-2.5 hover:bg-main/5 rounded-lg cursor-pointer text-[10px] font-bold text-dim hover:text-main transition-all uppercase tracking-wider flex items-center gap-2 group/opt"
                 onClick={() => { 
                   soundService.playClick();
                   onChange(""); 
                   setIsOpen(false); 
                 }}
              >
                 <div className={`w-1.5 h-1.5 rounded-full ${!value ? 'bg-cyan-500 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-dim/30 group-hover/opt:bg-dim'}`}></div>
                 {activeTab === 'recap' ? 'CMD NETO' : 'TOUS LES MSAN...'}
              </div>
              
              {filteredOptions.length > 0 ? (
                  filteredOptions.map(opt => (
                    <div 
                        key={opt}
                        className={`px-3 py-2.5 hover:bg-cyan-950/30 rounded-lg cursor-pointer text-[10px] font-bold transition-all uppercase tracking-wider flex items-center justify-between group/opt ${value === opt ? 'bg-cyan-950/50 text-cyan-400 border border-cyan-500/10' : 'text-dim border border-transparent'} hover:text-main`}
                        onClick={() => { 
                          soundService.playClick();
                          onChange(opt); 
                          setIsOpen(false); 
                        }}
                    >
                        <span className="truncate">{opt}</span>
                        {value === opt && <Check className="w-3.5 h-3.5 text-cyan-500 animate-fade-in-up" />}
                    </div>
                  ))
              ) : (
                  <div className="px-3 py-8 text-center flex flex-col items-center justify-center opacity-50">
                     {activeTab === 'recap' ? (
                        <FileText className="w-6 h-6 mb-2 text-dim" />
                     ) : (
                        <Database className="w-6 h-6 mb-2 text-dim" />
                     )}
                     <span className="text-[10px] text-dim font-bold uppercase tracking-wider">
                         {activeTab === 'recap' ? 'Aucun CMD NETO trouvé' : 'Aucun MSAN trouvé'}
                     </span>
                  </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};