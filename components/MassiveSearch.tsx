import React, { useState, useRef, useEffect } from 'react';
import { Search, Eraser, Clipboard, AlertCircle, CheckCircle2, ListFilter, Database, ArrowDown, ChevronDown, ChevronUp, Edit3, Lock, FileWarning, X, Download } from 'lucide-react';
import { soundService } from '../services/soundService';
import { MsanSelector } from './MsanSelector';

interface MassiveSearchProps {
  onSearch: (sns: string[]) => void;
  onClear: () => void;
  onExport: () => void;
  onShowStats: () => void;
  currentCount: number;
  totalDataCount: number;
  msanOptions: string[];
  selectedMsan: string;
  onMsanChange: (val: string) => void;
  hasActiveSearch: boolean;
}

const MassiveSearch: React.FC<MassiveSearchProps> = ({ 
    onSearch, 
    onClear, 
    onExport, 
    onShowStats, 
    currentCount, 
    totalDataCount,
    msanOptions,
    selectedMsan,
    onMsanChange,
    hasActiveSearch
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFormatError, setShowFormatError] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDataEmpty = totalDataCount === 0;

  const getLines = (inputText: string) => {
    return inputText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const lineCount = getLines(text).length;

  const handlePasteClick = async () => {
    if (isDataEmpty) return;
    soundService.playClick();
    setError(null);
    setIsCollapsed(false);
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText) {
        setText(prev => prev + (prev ? '\n' : '') + clipboardText);
        soundService.playSuccess();
        setTimeout(() => {
             if (textareaRef.current) {
                textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
             }
        }, 50);
      }
    } catch (err) {
      console.warn("Clipboard access denied", err);
      setError("Ctrl+V requis");
      soundService.playError();
      textareaRef.current?.focus();
    }
  };

  const handleAnalyze = () => {
    const lines = getLines(text);
    if (lines.length === 0 || isDataEmpty) return;

    const processedLines: string[] = [];
    let currentMsan = "---";
    let foundAnyValid = false;

    // --- REGEX DÉFINITIONS (STRICTES) ---
    
    // Règle 1: CMD NETO
    // - Commence par '1' et a une longueur de 9 (1 + 8 chiffres)
    // - OU Commence par 'D' et a une longueur de 14 ou 15 (D + 13/14 alphanumériques)
    const regexMsan = /\b(1\d{8}|D[a-zA-Z0-9]{13,14})\b/;

    // Règle 2: NUMÉRO DE SÉRIE (SN)
    // - Commence par '4857' (Huawei/Standard) et a une longueur de 16 (4857 + 12 caractères)
    // - OU Commence par 'ALCL' (Alcatel/Nokia) et a une longueur de 12 (ALCL + 8 caractères)
    // Utilisation stricte de la logique ALCL[a-zA-Z0-9]{8} pour longueur 12
    const regexSn = /\b(4857[a-zA-Z0-9]{12}|ALCL[a-zA-Z0-9]{8})\b/g;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // 1. Extraction CMD NETO (Peut être n'importe où dans la ligne)
        // Affecté à 'CMD NETO' (Col 1 dans le résultat)
        const msanMatch = trimmed.match(regexMsan);
        if (msanMatch) {
            currentMsan = msanMatch[0].toUpperCase();
        }

        // 2. Extraction SN (Peut être n'importe où dans la ligne)
        // Affecté à 'NUMÉRO DE SÉRIE' (Col 2 dans le résultat / Col 4 input)
        const snMatches = [...trimmed.matchAll(regexSn)];
        
        if (snMatches.length > 0) {
            snMatches.forEach(match => {
                let sn = match[0].toUpperCase();

                // NOTE: Transformation ALCL vers 414C... supprimée pour garder l'affichage 'ALCL'
                // La conversion pour la recherche se fait désormais dans App.tsx
                
                // Structure de données envoyée à App.tsx :
                // [CMD NETO, (vide), (vide), NUMÉRO DE SÉRIE]
                processedLines.push(currentMsan, '', '', sn);
                foundAnyValid = true;

                // Réinitialisation du MSAN après usage pour garantir que chaque SN a son propre contexte
                // ou hérite du dernier trouvé si multiples SN sur une ligne (comportement séquentiel)
                currentMsan = "---";
            });
        }
    });

    if (!foundAnyValid) {
        soundService.playError();
        setShowFormatError(true);
        return;
    }

    soundService.playClick();
    setIsAnalyzing(true);
    setError(null);

    setTimeout(() => {
        soundService.playSuccess();
        onSearch(processedLines);
        setIsAnalyzing(false);
        setIsCollapsed(true);
    }, 4000);
  };

  const handleClear = () => {
    soundService.playClick();
    setText('');
    setError(null);
    setIsCollapsed(false);
    onClear(); // Clear the results table as well
  };

  const toggleCollapse = () => {
    soundService.playClick();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="w-full mt-6 mb-4 animate-fade-in-up relative z-20">
      
      {/* FORMAT ERROR DIALOG */}
      {showFormatError && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setShowFormatError(false)}></div>
            <div className="relative w-full max-w-md bg-slate-950 border border-red-500/30 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.25)] overflow-hidden animate-[scale-in_0.3s_ease-out] flex flex-col items-center text-center ring-1 ring-white/10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 animate-[shimmer_2s_infinite]"></div>
                
                <div className="p-8 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse-soft border border-red-500/20">
                        <FileWarning className="w-10 h-10 text-red-500" />
                    </div>
                    
                    <h3 className="text-xl font-black text-white uppercase tracking-tight mb-3">
                        Format Incorrect
                    </h3>
                    
                    <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8 px-4">
                        Le texte ne contient aucune donnée valide.<br/>
                        <span className="block mt-2 text-xs opacity-70">
                            Requis: <br/>
                            - CMD NETO: "1..." (9 car.) ou "D..." (14/15 car.)<br/>
                            - SN: "4857..." (16 car.) ou "ALCL..." (12 car.)
                        </span>
                    </p>
                    
                    <div className="flex w-full gap-3">
                        <button 
                            onClick={() => {
                                soundService.playClick();
                                setShowFormatError(false);
                            }}
                            className="flex-1 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
                        >
                            Compris
                        </button>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes scale-in {
                    0% { transform: scale(0.9); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
      )}

      <div 
        className={`relative w-full bg-slate-950/80 backdrop-blur-xl border transition-all duration-500 rounded-[1.5rem] group flex flex-col
          ${isAnalyzing 
            ? 'border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]' 
            : isCollapsed
                ? 'border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:bg-slate-900'
                : isFocused 
                    ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                    : 'border-white/10 hover:border-white/20'
          }
        `}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-blue-900/5 to-transparent opacity-0 transition-opacity duration-700 pointer-events-none rounded-[1.5rem] ${isFocused || isAnalyzing ? 'opacity-100' : ''}`}></div>

        {/* LOADING OVERLAY */}
        {isAnalyzing && (
            <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center animate-fade-in-up rounded-[1.5rem]">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <>
                            <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 border-4 border-b-blue-500 border-t-transparent border-l-transparent border-r-transparent rounded-full animate-[spin_1.5s_linear_reverse_infinite]"></div>
                            <Database className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse" />
                        </>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-black text-white uppercase tracking-[0.3em] animate-pulse">Traitement des Données</span>
                        <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#4ade80' }}>Organisation des données en cours...</span>
                    </div>
                </div>
            </div>
        )}

        {/* HEADER BAR */}
        <div 
            className={`px-6 flex items-center justify-between bg-slate-900/50 relative z-10 transition-all duration-500 cursor-pointer select-none 
            ${isCollapsed ? 'h-16 rounded-[1.5rem]' : 'h-12 border-b border-white/5 rounded-t-[1.5rem]'}`}
            onClick={toggleCollapse}
        >
            <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${isCollapsed ? 'bg-blue-500/10 text-blue-400' : (isFocused ? 'text-cyan-400 bg-cyan-950/30' : 'bg-slate-800 text-slate-400')}`}>
                    {isCollapsed ? <CheckCircle2 className="w-4 h-4" /> : <ListFilter className="w-4 h-4" />}
                </div>
                <div>
                    <span className="text-[11px] font-black text-slate-200 uppercase tracking-[0.2em] block">
                        {isCollapsed ? 'Analyse Terminée' : 'Éditeur Massif'}
                    </span>
                    {isCollapsed && (
                        <span className="text-[9px] text-slate-500 font-mono block mt-0.5">
                            Cliquez pour modifier la liste
                        </span>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                 {/* MSAN SELECTOR - Visible only if there is an active search */}
                 { hasActiveSearch && (
                    <div className="w-48 h-8" onClick={(e) => e.stopPropagation()}>
                        <MsanSelector 
                            options={msanOptions}
                            value={selectedMsan}
                            onChange={onMsanChange}
                            className="h-full"
                            compact={true}
                        />
                    </div>
                 )}

                 {/* Export Button */}
                 {(currentCount > 0 && (isCollapsed || !isAnalyzing)) && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            soundService.playClick();
                            onExport();
                        }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold shadow-[0_0_15px_rgba(59,130,246,0.15)] animate-fade-in-up bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/40 hover:text-blue-300 transition-all active:scale-95 group/export"
                        title="Exporter les résultats"
                    >
                        <Download className="w-3.5 h-3.5 group-hover/export:scale-110 transition-transform" />
                        <span className="hidden sm:inline">EXPORTER</span>
                    </button>
                 )}

                 {(currentCount > 0 && (isCollapsed || !isAnalyzing)) && (
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fade-in-up ${isCollapsed ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                         <CheckCircle2 className="w-3.5 h-3.5" />
                         <span>{currentCount} RÉSULTATS</span>
                     </div>
                 )}
                 
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${lineCount > 0 ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                     <Database className="w-3.5 h-3.5" />
                     <span className="text-[10px] font-mono font-bold">{lineCount} LIGNES</span>
                 </div>

                 <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-500 border border-white/5 group-hover:bg-slate-700/50 transition-colors">
                    {isCollapsed ? <Edit3 className="w-3.5 h-3.5" /> : <ChevronUp className="w-4 h-4" />}
                 </div>
            </div>
        </div>

        {/* CONTENT */}
        <div className={`overflow-hidden transition-all duration-500 ease-in-out rounded-b-[1.5rem] ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
           <div className="p-4 pt-4">
              <div className={`relative group/area bg-slate-900 rounded-xl border transition-all duration-300 ${isFocused ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.05)]' : 'border-white/5'} ${error ? 'border-red-500/50' : ''}`}>
                  
                  {isDataEmpty && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-xl">
                          <Lock className="w-8 h-8 text-slate-500 mb-2" />
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Base de données vide</span>
                      </div>
                  )}

                  <textarea
                     ref={textareaRef}
                     value={text}
                     onChange={(e) => {
                        setText(e.target.value);
                        if (error) setError(null);
                     }}
                     onFocus={() => setIsFocused(true)}
                     onBlur={() => setIsFocused(false)}
                     disabled={isDataEmpty}
                     placeholder={isDataEmpty ? "" : "Collez ici vos données (Extraction auto selon règles strictes)"}
                     className={`w-full h-32 bg-transparent text-xs font-mono text-slate-300 p-4 resize-none focus:outline-none custom-scrollbar placeholder:text-slate-600 leading-relaxed tracking-wide ${isDataEmpty ? 'opacity-30 cursor-not-allowed' : ''}`}
                     spellCheck={false}
                  />
                  
                  {/* Floating Actions */}
                  <div className={`absolute bottom-3 right-3 flex items-center gap-2 transition-opacity duration-300 ${isDataEmpty ? 'opacity-0' : 'opacity-100'}`}>
                      {text && (
                          <button 
                            onClick={handleClear}
                            className="p-2 rounded-lg bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/5 hover:border-red-500/30 transition-all backdrop-blur-sm"
                            title="Effacer le texte"
                          >
                              <Eraser className="w-4 h-4" />
                          </button>
                      )}
                      <button 
                        onClick={handlePasteClick}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 hover:text-white text-blue-400 border border-blue-500/30 hover:border-blue-500/50 transition-all backdrop-blur-sm shadow-lg active:scale-95"
                      >
                          <Clipboard className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Coller</span>
                      </button>
                  </div>
              </div>

              {error && (
                  <div className="mt-2 flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase tracking-wider animate-pulse px-2">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                  </div>
              )}

              {/* Action Bar Footer */}
              <div className="flex items-center justify-between mt-4 pl-2">
                  <div className="flex items-center gap-2">
                       <span className="text-[9px] text-slate-500 font-mono hidden sm:inline-block">
                          Séparez les entrées par des sauts de ligne
                       </span>
                  </div>
                  
                  <button 
                    onClick={handleAnalyze}
                    disabled={isDataEmpty || lineCount === 0}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-black text-xs uppercase tracking-[0.15em] shadow-[0_10px_20px_rgba(6,182,212,0.2)] hover:shadow-[0_15px_30px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                      <Search className="w-4 h-4" />
                      Lancer l'analyse
                  </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default MassiveSearch;