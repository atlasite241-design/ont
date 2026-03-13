import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up ring-1 ring-white/5">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-xl font-black text-white mb-2 tracking-tighter">{title}</h3>
          <p className="text-sm text-slate-400 mb-8 whitespace-pre-line">
            {message}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest border border-white/5"
            >
              Annuler
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest border border-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
