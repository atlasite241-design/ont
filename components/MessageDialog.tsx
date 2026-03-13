import React from 'react';
import { ShieldAlert, Globe, Lock, AlertTriangle, X, AlertCircle } from 'lucide-react';

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'default' | 'error';
  hideTechNote?: boolean;
}

const MessageDialog: React.FC<MessageDialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'default',
  hideTechNote = false
}) => {
  if (!isOpen) return null;

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : ShieldAlert;
  const iconColorClass = isError ? 'text-red-500' : 'text-orange-500';
  const bgIconClass = isError ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className={`relative w-full max-w-[500px] bg-slate-900 border ${isError ? 'border-red-500/30' : 'border-white/10'} rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-[scale-in_0.2s_ease-out]`}>
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
            <div className="flex items-center gap-4">
                <div className={`p-3 border rounded-xl shadow-sm ${bgIconClass}`}>
                    <Icon className={`w-6 h-6 ${iconColorClass}`} />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                        {title}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                        {isError ? 'Erreur de Validation' : 'Environnement Web'}
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="text-slate-500 hover:text-white transition-colors p-1"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 pt-4 flex gap-5">
            {/* Timeline Column */}
            <div className="flex flex-col items-center pt-1">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${isError ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                    <Globe className={`w-4 h-4 ${isError ? 'text-red-400' : 'text-blue-400'}`} />
                </div>
                <div className="w-0.5 flex-grow bg-slate-800 my-2 min-h-[40px]"></div>
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ${isError ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                    <Lock className={`w-4 h-4 ${isError ? 'text-red-400' : 'text-orange-400'}`} />
                </div>
            </div>

            {/* Content Column */}
            <div className="flex-1 space-y-6">
                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                    {message}
                </p>

                {/* Technical Note Box - Conditional */}
                {!hideTechNote && (
                    <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute inset-0 bg-orange-500/5 animate-pulse-soft"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider">
                                    Note Technique
                                </span>
                            </div>
                            <p className="text-[11px] text-orange-200/70 font-medium leading-relaxed">
                                L'accès direct au système de fichiers local est restreint par les protocoles de sécurité des navigateurs modernes (Sandboxing).
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/50 border-t border-white/5 flex justify-end">
            <button 
                onClick={onClose}
                className={`px-6 py-2.5 border text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                    isError 
                    ? 'bg-red-600 hover:bg-red-500 border-red-500/20' 
                    : 'bg-slate-800 hover:bg-slate-700 border-white/10 hover:border-white/20'
                }`}
            >
                {isError ? 'Fermer' : 'Compris'}
            </button>
        </div>
      </div>

       <style>{`
        @keyframes scale-in {
            0% { transform: scale(0.95); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MessageDialog;