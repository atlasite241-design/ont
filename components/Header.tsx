import React from 'react';
import { Activity, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { soundService } from '../services/soundService';

interface HeaderProps {
  user: User;
  isSidebarCollapsed: boolean;
  onLogoClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, isSidebarCollapsed, onLogoClick }) => {
  
  const handleRefresh = () => {
    soundService.playClick();
    // Simple page reload to refresh the app state
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b-0 border-b-white/5 transition-colors duration-300">
      <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between">
        
        <div 
          onClick={onLogoClick}
          className={`flex items-center gap-3 group transition-all duration-500 ease-in-out overflow-hidden whitespace-nowrap ${isSidebarCollapsed ? 'max-w-[300px] opacity-100 translate-x-0 cursor-pointer' : 'max-w-0 opacity-0 -translate-x-10'}`}
          title={isSidebarCollapsed ? "Cliquer pour localiser le menu" : undefined}
        >
          <div className="flex flex-col items-center gap-0.5">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-9 h-9 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg border border-white/10 group-hover:scale-105 transition-transform duration-300">
                <Activity className="w-5 h-5 text-white animate-pulse-soft" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0f172a] shadow-sm"></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="font-bold text-lg text-main tracking-tight leading-none group-hover:tracking-wide transition-all duration-300">
              ONT Finder <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Pro</span>
            </span>
            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-[0.2em] mt-0.5 group-hover:text-slate-400 transition-colors">Enterprise Edition</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {/* Theme Toggle Removed */}

            {/* Glass Button: Refresh */}
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-full bg-cyan-500/5 backdrop-blur-md border border-cyan-500/20 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:scale-110 active:scale-95 transition-all duration-300 group"
              title="Rafraîchir l'application"
            >
              <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
            </button>
            
            <div className="flex items-center gap-2 pl-2 cursor-pointer group border-l border-white/5 hover:bg-white/5 rounded-lg px-2 py-1 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 p-[1.5px] group-hover:rotate-12 transition-transform duration-300">
                <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                   <UserIcon className="w-4 h-4 text-slate-300 group-hover:scale-125 transition-transform duration-300" />
                </div>
              </div>
              <div className="hidden lg:block text-left group-hover:translate-x-1 transition-transform duration-300">
                <p className="text-xs font-semibold text-main leading-none mb-0.5 capitalize">{user.username}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                    user.role === 'PROPRIÉTAIRE/PDG' 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                      : user.role === 'Super Admin' || user.role === 'admin'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                  }`}>
                    {user.role || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;