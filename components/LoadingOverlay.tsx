import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible, message = "Traitement des données en cours..." }) => {
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isVisible) {
      setShow(true);
      setProgress(0);
      
      const duration = 2000; // 2 seconds to reach 90%
      const interval = 50;
      const steps = duration / interval;
      const increment = 90 / steps;

      timer = setInterval(() => {
        setProgress(p => {
          if (p >= 90) {
            clearInterval(timer);
            return 90;
          }
          return Math.min(90, p + increment);
        });
      }, interval);
    } else if (show) {
      // When isVisible becomes false, quickly animate to 100%
      setProgress(100);
      
      // Wait for the animation to finish before hiding
      timer = setTimeout(() => {
        setShow(false);
      }, 500);
    }

    return () => {
      if (timer) {
        clearInterval(timer as any);
        clearTimeout(timer as any);
      }
    };
  }, [isVisible, show]);

  if (!show) return null;

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.round(progress) / 100) * circumference;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ${!isVisible && progress === 100 ? 'opacity-0' : 'opacity-100 animate-fade-in-up'}`}>
      <div className="flex flex-col items-center p-8 bg-surface/80 border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
        
        {/* Circular Progress Bar */}
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
            {/* Background circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#0e7490" // cyan-800
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke="#22d3ee" // cyan-400
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-cyan-400">{Math.round(progress)}%</span>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">Importation en cours</h3>
        <p className="text-slate-400 text-sm text-center font-mono">
            {message}
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;