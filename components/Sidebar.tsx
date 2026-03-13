import React, { useEffect, useState } from 'react';
import { Activity, ChevronsLeft, ChevronsRight, LogOut, ClipboardList, Archive, Copy, FileInput, Workflow, ClipboardCheck, List, LayoutGrid, BookOpen, FileText, ShieldCheck, Database } from 'lucide-react';
import { soundService } from '../services/soundService';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  toggleTrigger?: number;
  onLogout: () => void;
  user: User;
  onAboutClick: () => void;
  onReadmeClick: () => void;
  onLisezMoiClick: () => void;
  onLogsClick?: () => void;
  totalOntCount?: number;
  criticalOntCount?: number;
  activeOntCount?: number;
  archiveCount?: number;
  duplicateCount?: number; // Added duplicate count
  isSnFound?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onTabChange, 
  isCollapsed, 
  onToggleCollapse, 
  toggleTrigger = 0, 
  onLogout, 
  user, 
  onAboutClick,
  onReadmeClick,
  onLisezMoiClick,
  onLogsClick,
  totalOntCount = 0,
  criticalOntCount = 0,
  activeOntCount = 0,
  archiveCount = 0,
  duplicateCount = 0,
  isSnFound = false
}) => {
  const [isAnimatingToggle, setIsAnimatingToggle] = useState(false);

  // Watch for external trigger to animate the toggle button
  useEffect(() => {
    if (toggleTrigger > 0 && isCollapsed) {
      setIsAnimatingToggle(true);
      const timer = setTimeout(() => setIsAnimatingToggle(false), 800);
      return () => clearTimeout(timer);
    }
  }, [toggleTrigger, isCollapsed]);

  const handleItemClick = (id: string) => {
    soundService.playClick();
    onTabChange(id);
  };

  return (
    <div 
      className={`h-screen flex flex-col bg-slate-950 border-r border-white/5 transition-all duration-300 relative z-50 shrink-0 ${isCollapsed ? 'w-20' : 'w-72'}`}
    >
      {/* Logo Area */}
      {!isCollapsed ? (
        <div className="h-20 flex items-center px-6 mb-6 mt-2 animate-fade-in-up">
          <div className="relative group cursor-pointer" onClick={() => soundService.playHover()}>
            <div className="absolute inset-0 bg-blue-500/20 blur-lg rounded-xl group-hover:bg-blue-500/30 transition-colors"></div>
            <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform border border-white/10">
              <Activity className="w-6 h-6 text-white animate-pulse-soft" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950"></div>
            </div>
          </div>
          
          <div className="ml-4 flex flex-col">
            <h1 className="text-lg font-bold text-white tracking-tight leading-none">
              ONT Finder <span className="text-blue-500">Pro</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-500 tracking-[0.15em] mt-1">
              ENTERPRISE EDITION
            </span>
          </div>
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center">
            <Activity className="w-6 h-6 text-blue-500 animate-pulse-soft" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        
        {/* 1. Recherche simple (ANIMATED ICON & BAR) */}
        <button
            onClick={() => handleItemClick('dashboard')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'dashboard' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "Recherche simple" : undefined}
        >
            {/* THE VISUAL BAR (Active Indicator) */}
            {activeTab === 'dashboard' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
            )}

            <LayoutGrid 
                className={`flex-shrink-0 transition-all duration-300 
                  ${activeTab === 'dashboard' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} 
                  ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />
            
            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'text-white' : ''}`}>Recherche simple</span>
                    {/* Count Badge - text-[11px] */}
                    {totalOntCount > 0 && activeTab === 'dashboard' && (
                         <span className="flex items-center justify-center h-5 px-2 rounded-md bg-cyan-500 border border-cyan-400 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                            {totalOntCount}
                         </span>
                    )}
                </div>
            )}
            
            {activeTab === 'dashboard' && (isCollapsed || totalOntCount === 0) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>




        {/* 2. Recherche Avancée (ANIMATED ICON - SCAN/RADAR) */}
        <button
            onClick={() => handleItemClick('search')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'search' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "Recherche Avancée" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'search' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
             )}

            <List 
                className={`flex-shrink-0 transition-all duration-300 ${activeTab === 'search' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'search' ? 'text-white' : ''}`}>Recherche Avancée</span>
                    {/* Count Badge - text-[11px] */}
                    {totalOntCount > 0 && activeTab === 'search' && (
                         <span className="flex items-center justify-center h-5 px-2 rounded-md bg-cyan-500 border border-cyan-400 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                            {activeOntCount}
                         </span>
                    )}
                </div>
            )}
            
            {activeTab === 'search' && (isCollapsed || totalOntCount === 0) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 3. Recherche Massive (ANIMATED ICON & BAR) */}
        <button
            onClick={() => handleItemClick('matrix')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'matrix' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "File d'insertion" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'matrix' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
             )}

             <FileInput 
                className={`flex-shrink-0 transition-all duration-300 
                    ${activeTab === 'matrix' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} 
                    ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'matrix' ? 'text-white' : ''}`}>File d'insertion</span>
                    {/* Count Badge - "The Bar" Content (Solid Cyan Style) */}
                    {totalOntCount > 0 && activeTab === 'matrix' && (
                         <span className="flex items-center justify-center h-5 px-2 rounded-md bg-cyan-500 border border-cyan-400 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                            {activeOntCount}
                         </span>
                    )}
                </div>
            )}
            
            {activeTab === 'matrix' && (isCollapsed || totalOntCount === 0) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 4. File de travail */}
        <button
            onClick={() => handleItemClick('workflow')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'workflow' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "File de travail" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'workflow' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
             )}

            <Workflow 
                className={`flex-shrink-0 transition-all duration-300 
                  ${activeTab === 'workflow' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} 
                  ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'workflow' ? 'text-white' : ''}`}>File de travail</span>
                </div>
            )}
            
            {activeTab === 'workflow' && (isCollapsed) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 4.1. File RECAP */}
        <button
            onClick={() => handleItemClick('recap')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'recap' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "File RECAP" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'recap' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
             )}

            <ClipboardCheck 
                className={`flex-shrink-0 transition-all duration-300 
                  ${activeTab === 'recap' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} 
                  ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'recap' ? 'text-white' : ''}`}>File RECAP</span>
                </div>
            )}
            
            {activeTab === 'recap' && (isCollapsed) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>



        {/* 4.2. ONT RÉPÉTÉS */}
        <button
            onClick={() => handleItemClick('duplicates')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'duplicates' 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "ONT RÉPÉTÉS" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'duplicates' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-orange-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse"></div>
             )}

            <Copy 
                className={`flex-shrink-0 transition-all duration-300 ${activeTab === 'duplicates' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]' : 'group-hover:text-white'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'duplicates' ? 'text-white' : ''}`}>ONT RÉPÉTÉS</span>
                    {/* Count Badge */}
                    {duplicateCount > 0 && (
                         <span className="flex items-center justify-center h-5 px-2 rounded-md bg-amber-500 border border-amber-400 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]">
                            {duplicateCount}
                         </span>
                    )}
                </div>
            )}
            
            {activeTab === 'duplicates' && (isCollapsed) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] animate-pulse"></div>}
        </button>



        {/* 1.1. Inventaire FTTH (Renamed from Recherche simple 2) */}
        <button
            onClick={() => handleItemClick('dashboard2')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'dashboard2' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "Inventaire FTTH" : undefined}
        >
            {/* THE VISUAL BAR (Active Indicator) */}
            {activeTab === 'dashboard2' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
            )}

            <Database 
                className={`flex-shrink-0 transition-all duration-300 
                  ${activeTab === 'dashboard2' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} 
                  ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />
            
            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'dashboard2' ? 'text-white' : ''}`}>Inventaire FTTH</span>
                </div>
            )}
            
            {activeTab === 'dashboard2' && (isCollapsed) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 6. Centre d'Alertes */}
        <button
            onClick={() => handleItemClick('alerts')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'alerts' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "Centre d'Alertes" : undefined}
        >
             {/* THE VISUAL BAR (Active Indicator) */}
             {activeTab === 'alerts' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"></div>
             )}

            <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`flex-shrink-0 transition-all duration-300 ${activeTab === 'alerts' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" className={activeTab === 'alerts' ? "origin-top animate-[bell-ring_2s_infinite]" : ""} />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                
                {/* Alert Notification Badge/Pulse */}
                {activeTab === 'alerts' && (
                    <>
                         <circle cx="18" cy="5" r="2" className="fill-red-500 animate-ping opacity-75" stroke="none" />
                         <circle cx="18" cy="5" r="1" className="fill-red-400" stroke="none" />
                    </>
                )}
            </svg>

            {!isCollapsed && (
                 <div className="flex items-center justify-between flex-1 min-w-0 mr-1">
                    <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'alerts' ? 'text-white' : ''}`}>Centre d'Alertes</span>
                    {/* Count Badge - Critical Alerts (Red) */}
                    {criticalOntCount > 0 && activeTab === 'alerts' && (
                         <span className="flex items-center justify-center h-5 px-2 rounded-md bg-red-500 border border-red-400 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]">
                            {criticalOntCount}
                         </span>
                    )}
                </div>
            )}
            
            {activeTab === 'alerts' && (isCollapsed || criticalOntCount === 0) && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 6.5. Journaux de Connexion (OWNER/CEO ONLY) */}
        {user?.role === 'PROPRIÉTAIRE/PDG' && (
            <button
                onClick={() => {
                    soundService.playClick();
                    onLogsClick?.();
                }}
                className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
                ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
                text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/5 border border-transparent
                `}
                title={isCollapsed ? "Journaux de Connexion" : undefined}
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                <ShieldCheck 
                    className={`flex-shrink-0 transition-all duration-300 group-hover:text-indigo-300 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
                />
                
                {!isCollapsed && <span className="text-sm font-bold tracking-wide whitespace-nowrap transition-colors">Journaux (PDG)</span>}
                
                {isCollapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>
        )}

        {/* 7. Administration (SUPER ADMIN OR PDG ONLY) */}
        {(user?.role === 'Super Admin' || user?.role === 'PROPRIÉTAIRE/PDG') && (
            <button
                onClick={() => handleItemClick('admin')}
                className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
                ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
                ${activeTab === 'admin' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                    : 'text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/5 border border-transparent'
                }
                `}
                title={isCollapsed ? "Administration" : undefined}
            >
                 {activeTab === 'admin' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.6)] animate-pulse"></div>
                 )}

                <ShieldCheck 
                    className={`flex-shrink-0 transition-all duration-300 ${activeTab === 'admin' ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'group-hover:text-indigo-300'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
                />
                
                {!isCollapsed && <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'admin' ? 'text-white' : ''}`}>Administration</span>}
                
                {activeTab === 'admin' && isCollapsed && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></div>}
            </button>
        )}

        {/* 8. Paramètres */}
        <button
            onClick={() => handleItemClick('settings')}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            ${activeTab === 'settings' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
            }
            `}
            title={isCollapsed ? "Paramètres" : undefined}
        >
            <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`flex-shrink-0 transition-all duration-300 ${activeTab === 'settings' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'group-hover:text-white'} ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            >
                {/* Gear Body */}
                <path 
                   d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
                   className={activeTab === 'settings' ? "origin-center animate-[spin_3s_linear_infinite]" : "group-hover:rotate-90 transition-transform duration-700"}
                />
                {/* Inner Circle / Nut */}
                <circle cx="12" cy="12" r="3" className={activeTab === 'settings' ? "animate-pulse" : ""} />
            </svg>

            {!isCollapsed && <span className={`text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'text-white' : ''}`}>Paramètres</span>}
            {activeTab === 'settings' && <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse"></div>}
        </button>

        {/* 9. Guide d'utilisation... */}
        <button
            onClick={() => {
                soundService.playClick();
                onReadmeClick();
            }}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden mt-2
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            text-slate-500 hover:text-purple-400 hover:bg-purple-500/5 border border-transparent
            `}
            title={isCollapsed ? "Guide d'utilisation..." : undefined}
        >
            <BookOpen 
                className={`flex-shrink-0 transition-all duration-300 group-hover:text-purple-400 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            />
            
            {!isCollapsed && <span className="text-sm font-bold tracking-wide whitespace-nowrap transition-colors">Guide d'utilisation...</span>}
        </button>

        {/* 10. A-propos de ... */}
        <button
            onClick={() => {
                soundService.playClick();
                onAboutClick();
            }}
            className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden mt-2
            ${isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5'}
            text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-transparent
            `}
            title={isCollapsed ? "A-propos de ..." : undefined}
        >
            <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`flex-shrink-0 transition-all duration-300 group-hover:text-emerald-400 ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}`}
            >
                {/* Static base circle */}
                <circle cx="12" cy="12" r="10" className="group-hover:opacity-20 transition-opacity" />
                
                {/* Rotating dashed ring on hover */}
                <circle cx="12" cy="12" r="10" className="opacity-0 group-hover:opacity-100 group-hover:animate-[spin_8s_linear_infinite]" strokeDasharray="2 4" strokeWidth="2" />
                
                {/* Info 'i' - Body */}
                <path d="M12 16v-4" className="group-hover:animate-[pulse_2s_infinite]" />
                
                {/* Info 'i' - Dot (Bouncing) */}
                <circle cx="12" cy="8" r="1" className="fill-current group-hover:animate-bounce" stroke="none" />
            </svg>
            
            {!isCollapsed && <span className="text-sm font-bold tracking-wide whitespace-nowrap transition-colors">A-propos de ...</span>}
        </button>

      </nav>

      {/* Bottom Section */}
      <div className="p-4 mt-auto border-t border-white/5 bg-slate-950">
        {!isCollapsed && (
          <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-white/5 animate-fade-in-up">
            <div className="flex justify-between items-end mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SERVEUR</span>
              <span className="text-[10px] font-bold text-emerald-400">CONNECTE</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[92%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)] relative overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
          </div>
        )}

        {/* LOGOUT BUTTON - Glassmorphism */}
        <button
          onClick={() => {
            soundService.playClick();
            onLogout();
          }}
          className={`w-full flex items-center relative group transition-all duration-300 rounded-xl overflow-hidden mb-2
             ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3.5'}
             text-rose-400 bg-rose-500/5 backdrop-blur-md border border-rose-500/10 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-white shadow-[0_0_10px_rgba(244,63,94,0.05)] hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]
          `}
          title={isCollapsed ? "DÉCONNEXION" : undefined}
        >
          <LogOut 
            className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12
              ${isCollapsed ? 'w-6 h-6' : 'w-5 h-5 mr-3'}
            `} 
          />
          
          {!isCollapsed && (
            <span className="text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
              DÉCONNEXION
            </span>
          )}
        </button>

        {/* Collapse Button - Glassmorphism */}
        <button 
          onClick={() => {
            soundService.playClick();
            onToggleCollapse();
          }}
          className={`relative w-full flex items-center justify-center rounded-xl transition-all duration-500 group overflow-hidden
             ${isCollapsed 
                ? 'h-14 bg-blue-600/10 backdrop-blur-md border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                : 'py-3.5 bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 hover:border-white/20'}
          `}
        >
          {isCollapsed && (
            <>
               <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]"></div>
            </>
          )}

          <div className="relative z-10">
            {isCollapsed ? (
              <ChevronsRight className="w-6 h-6 text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-[wiggle_1s_ease-in-out_infinite]" />
            ) : (
              <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-200 transition-colors">
                 <ChevronsLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Réduire</span>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;