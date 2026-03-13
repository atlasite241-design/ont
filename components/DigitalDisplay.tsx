import React from 'react';

interface SevenSegmentDigitProps {
  value: string | number;
  color: 'cyan' | 'red' | 'white' | 'yellow' | 'emerald' | 'blue' | 'orange';
  size?: 'sm' | 'md' | 'lg';
}

export const SevenSegmentDigit: React.FC<SevenSegmentDigitProps> = ({ value, color, size = 'md' }) => {
  const num = parseInt(value.toString());
  
  // Standard Segment Mapping: A, B, C, D, E, F, G (Clockwise from top + Middle)
  const activeSegments = {
    0: [1, 1, 1, 1, 1, 1, 0],
    1: [0, 1, 1, 0, 0, 0, 0],
    2: [1, 1, 0, 1, 1, 0, 1],
    3: [1, 1, 1, 1, 0, 0, 1],
    4: [0, 1, 1, 0, 0, 1, 1],
    5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1],
    7: [1, 1, 1, 0, 0, 0, 0],
    8: [1, 1, 1, 1, 1, 1, 1],
    9: [1, 1, 1, 1, 0, 1, 1],
    '-': [0, 0, 0, 0, 0, 0, 1] 
  }[isNaN(num) ? '-' : num] || [0, 0, 0, 0, 0, 0, 0];

  const colors = {
    cyan: { on: '#22d3ee', off: '#0e7490', glow: 'rgba(34, 211, 238, 0.5)' },
    red: { on: '#f87171', off: '#7f1d1d', glow: 'rgba(248, 113, 113, 0.5)' },
    white: { on: '#ffffff', off: '#334155', glow: 'rgba(255, 255, 255, 0.5)' },
    yellow: { on: '#fbbf24', off: '#451a03', glow: 'rgba(251, 191, 36, 0.5)' },
    emerald: { on: '#34d399', off: '#064e3b', glow: 'rgba(52, 211, 153, 0.5)' },
    blue: { on: '#60a5fa', off: '#172554', glow: 'rgba(96, 165, 250, 0.5)' },
    orange: { on: '#fb923c', off: '#7c2d12', glow: 'rgba(251, 146, 60, 0.5)' },
  }[color];

  const sizes = {
    sm: { w: 'w-3', h: 'h-5' },
    md: { w: 'w-5', h: 'h-8' },
    lg: { w: 'w-8', h: 'h-12' }
  }[size];

  const paths = [
    "M 12,6 L 36,6 L 40,10 L 36,14 L 12,14 L 8,10 Z",
    "M 42,12 L 46,16 L 46,38 L 42,42 L 38,38 L 38,16 Z",
    "M 42,46 L 46,50 L 46,72 L 42,76 L 38,72 L 38,50 Z",
    "M 12,74 L 36,74 L 40,78 L 36,82 L 12,82 L 8,78 Z",
    "M 6,46 L 10,50 L 10,72 L 6,76 L 2,72 L 2,50 Z",
    "M 6,12 L 10,16 L 10,38 L 6,42 L 2,38 L 2,16 Z",
    "M 12,40 L 36,40 L 40,44 L 36,48 L 12,48 L 8,44 Z"
  ];

  return (
    <div className={`relative ${sizes.w} ${sizes.h} mx-0.5`}>
        <svg width="100%" height="100%" viewBox="0 0 48 88" preserveAspectRatio="xMidYMid meet">
            <defs>
                <filter id={`glow-${color}-${size}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
            
            {paths.map((d, index) => (
                <path 
                    key={index}
                    d={d} 
                    fill={activeSegments[index] ? colors.on : colors.off} 
                    style={{ 
                        filter: activeSegments[index] ? `url(#glow-${color}-${size})` : 'none', 
                        transition: 'fill 0.2s ease-in-out',
                        opacity: activeSegments[index] ? 1 : 0.15 
                    }} 
                />
            ))}
        </svg>
    </div>
  );
};

interface DigitalDisplayProps {
  value: number | string;
  color: 'cyan' | 'red' | 'white' | 'yellow' | 'emerald' | 'blue' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  minDigits?: number;
}

export const DigitalDisplay: React.FC<DigitalDisplayProps> = ({ value, color, size = 'md', minDigits = 1 }) => {
    let strValue = value.toString();
    while (strValue.length < minDigits) {
        strValue = '0' + strValue;
    }
    const digits = strValue.split('');
    
    return (
        <div className="flex items-center justify-center p-1 bg-black/20 backdrop-blur-sm border border-white/5 rounded-lg shadow-inner">
            {digits.map((d, i) => (
                <SevenSegmentDigit key={i} value={d} color={color} size={size} />
            ))}
        </div>
    );
};
