import React from 'react';

interface SectionHeaderProps {
  searchTerm?: string;
  msanFilter?: string;
  locationFilter?: string;
  onClearFilter?: () => void;
  isDataLoaded?: boolean;
  title?: string;
  isMassiveSearchEmpty?: boolean;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  searchTerm, 
  msanFilter, 
  locationFilter, 
  isDataLoaded = false,
  title = "Recherche simple",
  isMassiveSearchEmpty = false
}) => {
  const hasFilter = searchTerm || msanFilter || locationFilter;

  // Dynamic styling for the vertical bar
  let barBaseClass = '';
  if (!isDataLoaded) {
      barBaseClass = 'bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.6)]';
  } else if (isMassiveSearchEmpty) {
      barBaseClass = 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]';
  } else if (hasFilter) {
      barBaseClass = 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]';
  } else {
      barBaseClass = 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]';
  }

  let barHoverClass = '';
  if (!isDataLoaded) {
      barHoverClass = 'group-hover:shadow-[0_0_20px_rgba(220,38,38,0.8)]';
  } else if (isMassiveSearchEmpty) {
      barHoverClass = 'group-hover:shadow-[0_0_20px_rgba(234,179,8,0.8)]';
  } else {
      barHoverClass = 'group-hover:shadow-[0_0_20px_rgba(6,182,212,0.8)]';
  }
  
  return (
    <div className="w-full flex flex-col gap-1 mt-2 mb-2 px-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
      
      {/* Row 1: Title and Optional Status Indicator */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3 group cursor-default">
            {/* Glowing Vertical Bar - Changes color based on state */}
            <div className={`w-1 h-6 ${barBaseClass} rounded-full ${barHoverClass} group-hover:h-8 transition-all duration-300`}></div>
            
            {/* Title Text */}
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.25em] group-hover:text-slate-200 transition-colors select-none">
                <span className={!isDataLoaded ? "text-red-500 group-hover:text-red-400 transition-colors" : ""}>
                {!isDataLoaded ? "déconnexion réseau" : title}
                </span>
            </h2>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;