import React, { useState, useEffect } from 'react';
import { KPIStats, ONTStatus } from '../types';
import { LayoutGrid, CheckCircle2, AlertTriangle, Bell, Activity, Database, AlertOctagon, Hash, Copy } from 'lucide-react';
import { DigitalDisplay } from './DigitalDisplay';

const HuaweiIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 7v10M11 7v10M5 12h6" />
    <path d="M14 7l1.5 10 1.5-6 1.5 6 1.5-10" />
  </svg>
);

const NokiaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 7v10l5-10v10" />
    <path d="M15 7v10M20 7l-5 5 5 5" />
  </svg>
);

interface StatsGridProps {
  stats: KPIStats;
  selectedStatus?: ONTStatus | null;
  showRepeated?: boolean;
  onStatClick: (status: ONTStatus | 'total' | 'searched' | 'repeated') => void;
  isMatrixMode?: boolean;
  activeTab?: string;
}

const StatCard: React.FC<{ 
  title: string; 
  value: number; 
  color: 'cyan' | 'red' | 'white' | 'yellow' | 'emerald' | 'blue' | 'orange'; 
  delay: number;
  isActive: boolean;
  onClick: () => void;
  icon?: React.ElementType;
}> = ({ title, value, color, delay, isActive, onClick, icon: Icon }) => {
  
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Only animate if value > 0
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp: number | null = null;
    const duration = 2000; // Slow increment (2 seconds)
    const startValue = 0;
    const endValue = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out expo for nice deceleration
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setDisplayValue(Math.floor(easeProgress * (endValue - startValue) + startValue));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);

    return () => {};
  }, [value]);
  
  const theme = {
    white: { 
        border: 'border-main group-hover:border-emerald-500/30', 
        bg: 'bg-card backdrop-blur-xl', // Glass
        iconText: 'text-emerald-400',
        iconBg: 'bg-surface/50 backdrop-blur-lg border border-main shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:bg-surface/80 hover:border-emerald-500/30 transition-all duration-300', 
        label: 'text-dim'
    },
    cyan: { 
        border: 'border-cyan-500/20 group-hover:border-cyan-400/40', 
        bg: 'bg-cyan-950/20 backdrop-blur-xl',
        iconText: 'text-cyan-400',
        iconBg: 'bg-cyan-500/10 backdrop-blur-lg border border-cyan-500/20 shadow-[0_4px_20px_rgba(6,182,212,0.1)] hover:bg-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-cyan-200'
    },
    red: { 
        border: 'border-red-500/20 group-hover:border-red-400/40', 
        bg: 'bg-red-950/20 backdrop-blur-xl', 
        iconText: 'text-red-400',
        iconBg: 'bg-red-500/10 backdrop-blur-lg border border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.1)] hover:bg-red-500/20 hover:border-red-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-red-200'
    },
    yellow: { 
        border: 'border-yellow-500/20 group-hover:border-yellow-400/40', 
        bg: 'bg-yellow-950/20 backdrop-blur-xl', 
        iconText: 'text-yellow-400',
        iconBg: 'bg-yellow-500/10 backdrop-blur-lg border border-yellow-500/20 shadow-[0_4px_20px_rgba(234,179,8,0.1)] hover:bg-yellow-500/20 hover:border-yellow-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-yellow-200'
    },
    emerald: { 
        border: 'border-emerald-500/20 group-hover:border-emerald-400/40', 
        bg: 'bg-emerald-950/20 backdrop-blur-xl', 
        iconText: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10 backdrop-blur-lg border border-emerald-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.1)] hover:bg-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-emerald-200'
    },
    blue: { 
        border: 'border-blue-500/20 group-hover:border-blue-400/40', 
        bg: 'bg-blue-950/20 backdrop-blur-xl', 
        iconText: 'text-blue-400',
        iconBg: 'bg-blue-500/10 backdrop-blur-lg border border-blue-500/20 shadow-[0_4px_20px_rgba(59,130,246,0.1)] hover:bg-blue-500/20 hover:border-blue-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-blue-200'
    },
    orange: { 
        border: 'border-orange-500/20 group-hover:border-orange-400/40', 
        bg: 'bg-orange-950/20 backdrop-blur-xl', 
        iconText: 'text-orange-400',
        iconBg: 'bg-orange-500/10 backdrop-blur-lg border border-orange-500/20 shadow-[0_4px_20px_rgba(249,115,22,0.1)] hover:bg-orange-500/20 hover:border-orange-400/40 transition-all duration-300',
        label: 'text-dim group-hover:text-orange-200'
    },
  }[color];

  // Helper for active ring color
  const getActiveRing = () => {
      if (color === 'red') return 'ring-red-500/50 shadow-red-500/20';
      if (color === 'cyan') return 'ring-cyan-500/50 shadow-cyan-500/20';
      if (color === 'yellow') return 'ring-yellow-500/50 shadow-yellow-500/20';
      if (color === 'emerald') return 'ring-emerald-500/50 shadow-emerald-500/20';
      if (color === 'blue') return 'ring-blue-500/50 shadow-blue-500/20';
      if (color === 'orange') return 'ring-orange-500/50 shadow-orange-500/20';
      return 'ring-white/50 shadow-white/10';
  };

  const activeClass = isActive 
    ? `ring-1 ring-offset-0 ${getActiveRing()} shadow-[0_0_30px_rgba(0,0,0,0.3)] bg-opacity-40` 
    : 'opacity-90 hover:opacity-100 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1';

  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-[1.25rem] p-3 group transition-all duration-500 cursor-pointer animate-fade-in-up border ${theme.border} ${theme.bg} ${activeClass}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Dynamic Glow Background */}
      <div className={`absolute -inset-full bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_2s_infinite] transition-opacity duration-700 pointer-events-none`}></div>

      {/* Top Row: Title */}
      <div className="flex justify-between items-center mb-2 relative z-10">
        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] transition-colors ${theme.label}`}>
            {title}
        </span>
        {Icon && (
             <div className={`p-1.5 rounded-lg ${theme.iconBg} group-hover:scale-110 transform`}>
                <Icon className={`w-4 h-4 ${theme.iconText}`} />
             </div>
        )}
      </div>

      {/* Bottom Row: Digital Number */}
      <div className="flex items-end justify-between relative z-10">
         <DigitalDisplay value={displayValue} color={color} />
      </div>

      {/* Subtle bottom glow */}
      <div className={`absolute -bottom-4 -right-4 w-32 h-32 blur-3xl rounded-full transition-colors duration-700 opacity-60 ${
          color === 'cyan' ? 'bg-cyan-500/20 group-hover:bg-cyan-500/30' : 
          color === 'red' ? 'bg-red-500/20 group-hover:bg-red-500/30' : 
          color === 'yellow' ? 'bg-yellow-500/20 group-hover:bg-yellow-500/30' : 
          color === 'emerald' ? 'bg-emerald-500/20 group-hover:bg-emerald-500/30' :
          color === 'blue' ? 'bg-blue-500/20 group-hover:bg-blue-500/30' :
          color === 'orange' ? 'bg-orange-500/20 group-hover:bg-orange-500/30' :
          'bg-blue-500/10 group-hover:bg-blue-500/20'
      }`}></div>
    </div>
  );
};

const StatsGrid: React.FC<StatsGridProps> = ({ stats, selectedStatus, showRepeated, onStatClick, isMatrixMode = false, activeTab }) => {
  if (isMatrixMode) {
      // MASSIVE SEARCH MODE - Digital Style (StatCard) with 5 columns
      return (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full">
            <StatCard
                title="TOTAL ONTs"
                value={stats.total}
                color="blue"
                delay={100}
                isActive={selectedStatus === null && !showRepeated}
                onClick={() => onStatClick('total')}
                icon={Hash}
            />
            <StatCard
                title="ONT ACTIFS"
                value={stats.searched}
                color="emerald"
                delay={200}
                isActive={selectedStatus === 'active'}
                onClick={() => onStatClick('searched')}
                icon={Activity}
            />
            <StatCard
                title="ONT RÉPÉTÉS"
                value={stats.repeated}
                color="orange"
                delay={300}
                isActive={!!showRepeated}
                onClick={() => onStatClick('repeated')}
                icon={Copy}
            />
            <StatCard
                title="ONT ISOLÉS"
                value={stats.isolated}
                color="yellow"
                delay={400}
                isActive={selectedStatus === 'isolated'} 
                onClick={() => onStatClick('isolated')}
                icon={AlertTriangle}
            />
            <StatCard
                title="CRITIQUES"
                value={stats.critical}
                color="red"
                delay={500}
                isActive={selectedStatus === 'critical'}
                onClick={() => onStatClick('critical')}
                icon={Bell}
            />
        </div>
      );
  }

  // STANDARD SEARCH MODE - Digital Style (StatCard) with 4 columns (Updated)
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <StatCard
        title={activeTab === 'dashboard2' ? "Parc ONT HUAWEI" : "ONT VISIBLES"}
        value={activeTab === 'dashboard2' ? (stats.huaweiCount || 0) : stats.total}
        color="blue"
        delay={100}
        isActive={selectedStatus === null && !showRepeated}
        onClick={() => onStatClick('total')}
        icon={activeTab === 'dashboard2' ? HuaweiIcon : Hash}
      />
      <StatCard
        title={activeTab === 'recap' ? "ONT VALIDÉS" : (activeTab === 'dashboard2' ? "Parc ONT NOKIA" : "ONT TROUVES")}
        value={activeTab === 'dashboard2' ? (stats.nokiaCount || 0) : stats.searched}
        color="emerald"
        delay={200}
        isActive={false} // "ONT TROUVES" is usually just an info card, not a filter state toggler in this app
        onClick={() => onStatClick('searched')}
        icon={activeTab === 'recap' ? CheckCircle2 : (activeTab === 'dashboard2' ? NokiaIcon : Activity)}
      />
      <StatCard
        title="ONT RÉPÉTÉS"
        value={stats.repeated}
        color="orange"
        delay={300}
        isActive={!!showRepeated}
        onClick={() => onStatClick('repeated')}
        icon={Copy}
      />
      <StatCard
        title="CRITIQUES"
        value={stats.critical}
        color="red"
        delay={400}
        isActive={selectedStatus === 'critical'}
        onClick={() => onStatClick('critical')}
        icon={Bell}
      />
    </div>
  );
};

export default StatsGrid;