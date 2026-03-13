import React, { useRef, useState, useEffect } from 'react';
import { 
  Upload, 
  RotateCcw, 
  Filter, 
  Hash, 
  Server,
  FileText,
  Download
} from 'lucide-react';
import { FilterState } from '../types';
import { soundService } from '../services/soundService';
import { MsanSelector } from './MsanSelector';
import { StatusSelector } from './StatusSelector';

interface ActionBarProps {
  filters: FilterState;
  msanOptions: string[];
  onFilterChange: (newFilters: FilterState) => void;
  onImport: (file: File, type?: 'standard' | 'nokia') => void;
  onExport: () => void;
  onReset: () => void;
  onOpenSearch: () => void;
  isLoading: boolean;
  lastImportDate: string | null;
  isDataLoaded: boolean;
  simpleMode?: boolean;
  hasNokiaData?: boolean;
  activeTab?: string;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
  filters, 
  msanOptions, 
  onFilterChange, 
  onImport, 
  onExport,
  onReset,
  onOpenSearch,
  isLoading,
  lastImportDate,
  isDataLoaded,
  simpleMode = false,
  hasNokiaData = false,
  activeTab = 'dashboard'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);
  const [localSn, setLocalSn] = useState(filters.sn);
  const [localLocation, setLocalLocation] = useState(filters.location);

  useEffect(() => {
    setLocalSn(filters.sn);
    setLocalLocation(filters.location);
  }, [filters.sn, filters.location]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSn !== filters.sn || localLocation !== filters.location) {
        onFilterChange({ ...filters, sn: localSn, location: localLocation });
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [localSn, localLocation]);

  const handleMsanChange = (val: string) => {
    onFilterChange({ ...filters, msan: val });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      soundService.playClick();
      onImport(e.target.files[0], 'standard');
      e.target.value = '';
    }
  };

  const handleFileChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      soundService.playClick();
      // Pass 'nokia' type for specific parsing logic
      onImport(e.target.files[0], 'nokia');
      e.target.value = '';
    }
  };

  // Helper to format the date string to "YYYY-MM-DD | HH:MM:SS"
  const formatDisplayDate = (dateStr: string) => {
    // Remove "ExportÉ", "Save Time", etc. and trim
    const clean = dateStr.replace(/^(ExportÉ|Save\s*Time)[:\s]*/i, '').trim();
    // Replace the first grouping of spaces (between date and time) with " | "
    return clean.replace(/\s+/, ' | ');
  };

  // Determine disable logic based on user interaction
  const hasSnValue = localSn.trim().length > 0;
  const hasLocationValue = localLocation.trim().length > 0;
  const hasMsanValue = !!filters.msan;
  const isCriticalFilterActive = filters.status === 'critical';
  
  // SN Input is disabled if data not loaded OR MSAN is selected OR Location has value
  const isSnInputDisabled = !isDataLoaded || hasMsanValue || hasLocationValue;

  // Location Input is disabled if data not loaded OR MSAN is selected OR SN has value OR Critical Filter is active
  const isLocationInputDisabled = !isDataLoaded || hasMsanValue || hasSnValue || isCriticalFilterActive;

  // MSAN Selector is disabled if data not loaded OR SN has value OR Location has value OR Critical Filter is active
  const isMsanSelectorDisabled = !isDataLoaded || hasSnValue || hasLocationValue || isCriticalFilterActive;

  const showResetButton = activeTab !== 'search' && activeTab !== 'alerts';
  const isWorkflow = activeTab === 'workflow';

  return (
    <div className="w-full mt-4 mb-1 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
      <div className="flex items-center gap-3 bg-surface/60 backdrop-blur-2xl border border-main rounded-[1.5rem] p-2.5 shadow-2xl">
        
        {/* Left Section: Filter Icon + Label */}
        <div className={`flex items-center gap-3 pl-2 pr-4 border-r border-main group ${!isDataLoaded ? 'opacity-40 pointer-events-none filter grayscale' : ''}`}>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 group-hover:rotate-12 active:scale-95">
            <Filter className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-dim uppercase tracking-[0.2em] whitespace-nowrap group-hover:text-cyan-400 transition-colors hidden xl:inline-block">
            Filtres
          </span>
        </div>

        {/* Center Section: Input Fields */}
        <div className="flex-grow flex items-center gap-3">
          {/* SERIAL NUMBER Input */}
          <div className={`relative flex-1 group ${isSnInputDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Hash className="h-4 w-4 text-dim group-focus-within:text-cyan-400 group-focus-within:scale-110 transition-all duration-300" />
            </div>
            <input
              type="text"
              disabled={isSnInputDisabled}
              className="block w-full pl-10 pr-4 py-3 bg-card backdrop-blur-sm border border-main focus:border-cyan-500/40 rounded-xl text-main placeholder-dim focus:outline-none transition-all text-xs font-bold tracking-wider disabled:cursor-not-allowed disabled:bg-card/50 hover:bg-card/80 hover:border-main/50"
              placeholder="Recherche de numéro de série (SN)..."
              value={localSn}
              onChange={(e) => setLocalSn(e.target.value)}
            />
          </div>

          {/* POSITION Input - RENAMED TO MSAN SEARCH (Textual) */}
          {/* Hidden in Workflow tab as per request */}
          {!simpleMode && !isWorkflow && (
             <div className={`relative flex-1 group ${isLocationInputDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                <Server className="h-4 w-4 text-dim group-focus-within:text-cyan-400 group-focus-within:scale-110 transition-all duration-300" />
                </div>
                <input
                type="text"
                disabled={isLocationInputDisabled}
                className="block w-full pl-10 pr-4 py-3 bg-card backdrop-blur-sm border border-main focus:border-cyan-500/40 rounded-xl text-main placeholder-dim focus:outline-none transition-all text-xs font-bold tracking-wider disabled:cursor-not-allowed disabled:bg-card/50 hover:bg-card/80 hover:border-main/50"
                placeholder={activeTab === 'recap' ? "RECHERCHE PAR NOM MSAN" : "RECHERCHER MSAN..."}
                value={localLocation}
                onChange={(e) => setLocalLocation(e.target.value)}
                />
            </div>
          )}

          {/* MSAN Searchable Dropdown - Hide in simple mode */}
          {!simpleMode && (
             <MsanSelector 
                className="flex-1 h-[46px]"
                options={msanOptions}
                value={filters.msan}
                onChange={handleMsanChange}
                disabled={isMsanSelectorDisabled}
                activeTab={activeTab}
             />
          )}

          {/* Status Dropdown - Only visible in Workflow tab */}
          {isWorkflow && (
             <StatusSelector 
                className="flex-1 h-[46px]"
                value={filters.status}
                onChange={(val) => onFilterChange({ ...filters, status: val })}
             />
          )}
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-3 pl-4 border-l border-main pr-1">
          {/* RESET Button - Glassmorphism - Conditionally rendered */}
          {showResetButton && (
            <button 
              onClick={() => { 
                  if (!isDataLoaded) return;
                  soundService.playClick(); 
                  setLocalSn('');
                  setLocalLocation('');
                  onReset();
              }}
              disabled={!isDataLoaded}
              className={`flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] backdrop-blur-md border rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] transition-all duration-300 group
                ${!isDataLoaded 
                    ? 'opacity-50 cursor-not-allowed bg-surface/5 border-main text-dim' 
                    : 'text-dim bg-surface/5 border-main hover:bg-surface/10 hover:text-main hover:border-main/50 hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)] active:scale-95'
                }`}
            >
              <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${!isDataLoaded ? 'text-dim' : 'text-dim group-hover:-rotate-180 group-hover:text-main'}`} />
              VIDER
            </button>
          )}

          {/* Timestamp Indicator */}
          {lastImportDate && activeTab !== 'recap' && activeTab !== 'workflow' && (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-card backdrop-blur-md border border-cyan-500/20 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.05)] transition-all duration-300">
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider whitespace-nowrap">
                Exporté : {formatDisplayDate(lastImportDate)}
              </span>
            </div>
          )}
          
          {/* IMPORTER / EXPORTER Buttons Container - Stacked */}
          <div className="flex flex-col gap-2">
            
            {/* IMPORTER 2 / ONT NOKIA Button - VISIBLE ONLY IN SIMPLE MODE */}
            {simpleMode && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef2} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv, .txt, .log, image/*" 
                  onChange={handleFileChange2}
                />
                <button
                  onClick={() => fileInputRef2.current?.click()}
                  disabled={isLoading}
                  className={`flex items-center justify-center gap-2 px-6 py-1.5 backdrop-blur-lg border font-bold rounded-xl text-[10px] transition-all duration-300 uppercase tracking-widest shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group ${
                      simpleMode 
                      ? 'bg-purple-600/20 border-purple-400/30 text-purple-100 hover:bg-purple-600/30 hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:border-purple-400/50' 
                      : 'bg-purple-600/20 border-purple-400/30 text-purple-100 hover:bg-purple-600/30 hover:shadow-[0_0_25px_rgba(147,51,234,0.4)] hover:border-purple-400/50'
                  }`}
                  title={""}
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 group-hover:-translate-y-0.5 transition-transform duration-300 text-purple-200" />
                    </>
                  )}
                  {simpleMode ? 'ONT NOKIA' : 'IMPORTER 2'}
                </button>
              </>
            )}

            {/* IMPORTER / ONT HUAWEI (Simple) OR EXPORTER (Workflow/Recap) Button */}
            {activeTab !== 'search' && (
              <>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => {
                      if (isWorkflow || activeTab === 'recap') {
                          soundService.playClick();
                          onExport();
                      } else {
                          fileInputRef.current?.click();
                      }
                  }}
                  disabled={!(isWorkflow || activeTab === 'recap') && isLoading}
                  className={`flex items-center justify-center gap-2 px-6 py-1.5 backdrop-blur-lg border font-bold rounded-xl text-[10px] transition-all duration-300 uppercase tracking-widest shadow-[0_4px_30px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group ${
                      simpleMode
                      ? 'bg-red-600/20 border-red-400/30 text-red-100 hover:bg-red-600/30 hover:shadow-[0_0_25px_rgba(220,38,38,0.4)] hover:border-red-400/50'
                      : 'bg-blue-600/20 border-blue-400/30 text-blue-100 hover:bg-blue-600/30 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:border-blue-400/50'
                  }`}
                  title={""}
                >
                  {isLoading ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {(isWorkflow || activeTab === 'recap') ? (
                          <Download className={`w-3 h-3 group-hover:-translate-y-0.5 transition-transform duration-300 ${simpleMode ? 'text-red-500' : 'text-blue-200'}`} />
                      ) : (
                          <Upload className={`w-3 h-3 group-hover:-translate-y-0.5 transition-transform duration-300 ${simpleMode ? 'text-red-500' : 'text-blue-200'}`} />
                      )}
                    </>
                  )}
                  {simpleMode ? 'ONT HUAWEI' : ((isWorkflow || activeTab === 'recap') ? 'EXPORTER' : 'IMPORTER')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionBar;