import React, { useState, useEffect } from 'react';
import { Lock, X, KeyRound, AlertCircle } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'yasnab') {
      onConfirm();
      onClose();
    } else {
      setError('Opération non autorisée');
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-[400px] bg-slate-900 border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-[scale-in_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
            <div className="flex items-center gap-4">
                <div className="p-3 border rounded-xl shadow-sm bg-blue-500/10 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                    <Lock className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-none">
                        Authentification
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                        Accès Administrateur
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
        <form onSubmit={handleSubmit} className="p-6 pt-4">
            <div className="space-y-4">
                <p className="text-slate-300 text-sm font-medium leading-relaxed">
                    Veuillez saisir le mot de passe administrateur pour confirmer cette action.
                </p>

                <div className="relative group">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        className={`w-full bg-slate-950 border ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'} rounded-xl py-3 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:ring-1 ${error ? 'focus:ring-red-500/20' : 'focus:ring-blue-500/20'} transition-all placeholder-slate-700`}
                        placeholder="Mot de passe..."
                        autoFocus
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 animate-pulse">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3">
                <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                    Annuler
                </button>
                <button 
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-500/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
                >
                    Confirmer
                </button>
            </div>
        </form>
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

export default PasswordDialog;
