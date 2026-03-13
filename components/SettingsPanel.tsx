import React, { useState, useEffect } from 'react';
import { Settings, Volume2, VolumeX, Bell, Database, User as UserIcon, Shield, Lock, Save, Loader2, CheckCircle2, Key, LayoutGrid } from 'lucide-react';
import { soundService } from '../services/soundService';
import { dbService } from '../services/dbService';
import { User, Theme } from '../types';
import { API_BASE_URL } from '../config';

interface SettingsPanelProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme, setTheme }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');
  const [volume, setVolume] = useState(Number(localStorage.getItem('volume')) || 50);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const user = dbService.getCurrentUser();
    if (user) {
        dbService.getUser(user.username).then(fullUser => {
            setCurrentUser(fullUser || user);
        });
    }
    setIsMuted(soundService.isMuted());
  }, []);

  const handleSoundToggle = () => {
      const muted = soundService.toggleMute();
      setIsMuted(muted);
      if (!muted) soundService.playClick();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = Number(e.target.value);
    setVolume(newVol);
    soundService.setVolume(newVol / 100);
    localStorage.setItem('volume', String(newVol));
  };

  const handleCompactToggle = () => {
    const newCompact = !compactMode;
    setCompactMode(newCompact);
    localStorage.setItem('compactMode', String(newCompact));
    document.documentElement.classList.toggle('compact-mode', newCompact);
    soundService.playClick();
  };

  const handleSavePassword = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) return;

      setSaveStatus('loading');
      setStatusMessage('');
      soundService.playClick();

      // Validation
      if (!currentPassword || !newPassword || !confirmPassword) {
          setSaveStatus('error');
          setStatusMessage('Tous les champs sont requis');
          soundService.playError();
          return;
      }

      if (newPassword !== confirmPassword) {
          setSaveStatus('error');
          setStatusMessage('La confirmation ne correspond pas');
          soundService.playError();
          return;
      }

      if (newPassword.length < 4) {
          setSaveStatus('error');
          setStatusMessage('Mot de passe trop court');
          soundService.playError();
          return;
      }

      // Simulation delay
      setTimeout(async () => {
          // Update via API
          const result = await dbService.changePassword(currentUser.username, currentPassword, newPassword);
          
          if (result.success) {
              setSaveStatus('success');
              setStatusMessage('Enregistré avec succès');
              soundService.playSuccess();
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              
              // Clear success message after 3s
              setTimeout(() => {
                  setSaveStatus('idle');
                  setStatusMessage('');
              }, 3000);
          } else {
              setSaveStatus('error');
              setStatusMessage(result.message || 'Erreur système');
              soundService.playError();
          }
      }, 800);
  };

  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar flex flex-col p-8 animate-fade-in-up gap-8 pb-20">
        
        {/* SECTION 2: CONFIGURATION SYSTEME (Moved Top) */}
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-slate-800/50 border border-white/10 text-slate-200">
                    <Settings className="w-8 h-8 animate-spin-slow" />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tighter">Système</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Préférences globales</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sound Settings */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                            </div>
                            <span className="font-bold text-slate-200">Effets Sonores</span>
                        </div>
                        <button 
                            onClick={handleSoundToggle}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${!isMuted ? 'bg-blue-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${!isMuted ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    <div className="mt-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Volume</span>
                            <span className="text-[10px] text-blue-400 font-mono">{volume}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume}
                            onChange={handleVolumeChange}
                            disabled={isMuted}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30"
                        />
                    </div>
                </div>

                {/* Compact Mode */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-cyan-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                                <LayoutGrid className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-200">Mode Compact</span>
                        </div>
                        <button 
                            onClick={handleCompactToggle}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${compactMode ? 'bg-cyan-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${compactMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                        Réduit l'espacement pour afficher plus d'informations à l'écran.
                    </p>
                </div>

                {/* Notifications (Visual Only) */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-200">Notifications</span>
                        </div>
                        <button 
                            onClick={() => { setNotifications(!notifications); soundService.playClick(); }}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-emerald-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">
                        Afficher les alertes visuelles pour les événements critiques.
                    </p>
                </div>

                {/* Info Card */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-purple-500/30 transition-all md:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                            <Database className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-200">Base de Données Locale</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">État du stockage</span>
                        <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            SYNCHRONISÉ
                        </span>
                    </div>
                </div>

                {/* Theme Settings */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 transition-all md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Settings className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-200">Thème de l'application</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {[
                            { id: 'default', name: 'Défaut', color: 'bg-slate-700' },
                            { id: 'light', name: 'Clair', color: 'bg-white border border-slate-200' },
                            { id: 'midnight', name: 'Midnight', color: 'bg-indigo-600' },
                            { id: 'ocean', name: 'Ocean', color: 'bg-blue-500' },
                            { id: 'forest', name: 'Forest', color: 'bg-emerald-600' },
                            { id: 'sunset', name: 'Sunset', color: 'bg-orange-500' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => { setTheme(t.id as Theme); soundService.playClick(); }}
                                className={`p-4 rounded-xl border transition-all ${theme === t.id ? 'border-white/20 bg-white/5' : 'border-white/5 hover:border-white/10'}`}
                            >
                                <div className={`w-full h-8 rounded-lg ${t.color} mb-2`}></div>
                                <span className="text-xs font-bold text-slate-300">{t.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Management */}
                <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/5 hover:border-red-500/30 transition-all md:col-span-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                                <Database className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-200">Gestion des données</span>
                        </div>
                        <button 
                            onClick={async () => {
                                if (confirm("Êtes-vous sûr de vouloir effacer tout le cache local ?")) {
                                    await dbService.clearAllData();
                                    window.location.reload();
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-red-600/20 text-red-400 text-xs font-bold hover:bg-red-600/30 transition-all"
                        >
                            Effacer le cache
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="w-full h-px bg-white/5 max-w-5xl mx-auto my-4"></div>

        {/* SECTION 1: MON COMPTE (Moved Bottom) */}
        <div className="w-full max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                    <UserIcon className="w-8 h-8 animate-pulse-soft" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter">Mon Compte</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Gestion du profil</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Left Col: Profile Card */}
                <div className="lg:w-1/3 flex flex-col">
                    <div className="flex-1 bg-slate-900/80 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center relative overflow-hidden group">
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>

                        {/* Avatar */}
                        <div className="relative mb-6">
                            <div className="w-32 h-32 rounded-full border-4 border-slate-950 bg-gradient-to-br from-slate-800 to-slate-900 shadow-[0_0_30px_rgba(59,130,246,0.2)] flex items-center justify-center relative z-10 group-hover:scale-105 transition-transform duration-500">
                                <UserIcon className="w-12 h-12 text-slate-400" />
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-[spin_10s_linear_infinite]"></div>
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-[spin_15s_linear_reverse_infinite] scale-110"></div>
                        </div>

                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">{currentUser?.username || 'Utilisateur'}</h3>
                        
                        <div className="px-4 py-1.5 rounded-full bg-slate-800/80 border border-white/10 flex items-center gap-2 mb-8">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{currentUser?.role || 'User'}</span>
                        </div>

                        {/* Stats Box */}
                        <div className="w-full bg-slate-950/50 rounded-2xl border border-white/5 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400">Actif</span>
                                </div>
                            </div>
                            <div className="h-px bg-white/5"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inscrit le</span>
                                <span className="text-xs font-mono font-medium text-slate-300">
                                    {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('fr-FR') : '--/--/----'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Col: Security Form */}
                <div className="lg:w-2/3 flex flex-col">
                    <div className="flex-1 bg-slate-900/60 border border-white/5 rounded-[2rem] p-8 relative overflow-hidden">
                         
                         <div className="flex items-center gap-3 mb-8">
                             <Key className="w-5 h-5 text-indigo-400" />
                             <h3 className="text-lg font-bold text-white tracking-wide">Sécurité</h3>
                         </div>
                         
                         <div className="w-full h-px bg-white/5 mb-8"></div>

                         <form onSubmit={handleSavePassword} className="space-y-6 max-w-lg">
                             <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Mot de passe actuel</label>
                                 <div className="relative group">
                                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                                     <input 
                                        type="password" 
                                        value={currentPassword}
                                        onChange={(e) => { setCurrentPassword(e.target.value); setSaveStatus('idle'); }}
                                        className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all placeholder-slate-700"
                                        placeholder="••••••••"
                                     />
                                 </div>
                             </div>

                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nouveau mot de passe</label>
                                     <div className="relative group">
                                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                                         <input 
                                            type="password" 
                                            value={newPassword}
                                            onChange={(e) => { setNewPassword(e.target.value); setSaveStatus('idle'); }}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-slate-700"
                                            placeholder="••••••••"
                                         />
                                     </div>
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Confirmer</label>
                                     <div className="relative group">
                                         <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                                         <input 
                                            type="password" 
                                            value={confirmPassword}
                                            onChange={(e) => { setConfirmPassword(e.target.value); setSaveStatus('idle'); }}
                                            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all placeholder-slate-700"
                                            placeholder="••••••••"
                                         />
                                     </div>
                                 </div>
                             </div>

                             <div className="pt-4 flex items-center gap-4">
                                 <button 
                                    type="submit"
                                    disabled={saveStatus === 'loading'}
                                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                                 >
                                     {saveStatus === 'loading' ? (
                                         <Loader2 className="w-4 h-4 animate-spin" />
                                     ) : saveStatus === 'success' ? (
                                         <CheckCircle2 className="w-4 h-4" />
                                     ) : (
                                         <Save className="w-4 h-4" />
                                     )}
                                     {saveStatus === 'loading' ? 'Enregistrement...' : 'Enregistrer'}
                                 </button>

                                 {statusMessage && (
                                     <span className={`text-xs font-bold animate-pulse ${saveStatus === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                         {statusMessage}
                                     </span>
                                 )}
                             </div>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsPanel;