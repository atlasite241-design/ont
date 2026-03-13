import React, { useState, useEffect } from 'react';
import { Lock, User as UserIcon, ArrowRight, Loader2, UserPlus, ShieldCheck, CheckSquare, Square, Check, LogIn, Activity, Clock, PartyPopper, CheckCircle, Rocket, X } from 'lucide-react';
import { soundService } from '../services/soundService';
import { dbService } from '../services/dbService';
import { User } from '../types';
import { API_BASE_URL } from '../config';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  // Ensure DB is initialized
  useEffect(() => { 
    // dbService.init(); // Initialization is now handled by the server
  }, []);

  const [isRegistering, setIsRegistering] = useState(false);
  const [isPending, setIsPending] = useState(false); // New state
  const [isApproved, setIsApproved] = useState(false); // New state for real-time approval
  const [approvedRole, setApprovedRole] = useState('');
  const [isRecovering, setIsRecovering] = useState(false); // New state for recovery mode
  const [recoveryStep, setRecoveryStep] = useState<'username' | 'question' | 'reset'>('username');
  const [loading, setLoading] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false); 
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveredQuestion, setRecoveredQuestion] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pre-fill username if 'Remember Me' was checked previously
  useEffect(() => {
    const savedUser = localStorage.getItem('ont_finder_remember_me');
    if (savedUser) {
      setUsername(savedUser);
      setRememberMe(true);
    }
  }, []);

  // Polling for approval status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPending && !isApproved) {
        interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/status/${username}`);
                const data = await response.json();
                if (data.success && data.is_approved) {
                    setIsApproved(true);
                    setApprovedRole(data.role || 'User');
                    soundService.playSuccess();
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000); // Poll every 3 seconds
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [isPending, isApproved, username]);

  const handleToggleMode = () => {
    soundService.playHover();
    setIsRegistering(!isRegistering);
    setIsRecovering(false);
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setSecurityQuestion('');
    setSecurityAnswer('');
  };

  const handleRecoveryToggle = () => {
    soundService.playHover();
    setIsRecovering(!isRecovering);
    setIsRegistering(false);
    setRecoveryStep('username');
    setError('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setSecurityAnswer('');
    // Don't clear username if it was pre-filled
  };

  const handleRememberToggle = () => {
    soundService.playClick();
    setRememberMe(!rememberMe);
  };

  const SECURITY_QUESTIONS = [
    "Quel est le nom de votre premier animal de compagnie ?",
    "Quelle est votre ville de naissance ?",
    "Quel est le nom de jeune fille de votre mère ?",
    "Quel est votre film préféré ?",
    "Quel est le nom de votre école primaire ?"
  ];

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundService.playClick();
    setError('');
    setSuccessMsg('');

    if (recoveryStep === 'username') {
        if (!username) {
            setError("Veuillez entrer votre nom d'utilisateur");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/recovery/question`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (data.success) {
                setRecoveredQuestion(data.question);
                setRecoveryStep('question');
            } else {
                setError(data.message || "Utilisateur non trouvé ou pas de question de sécurité configurée.");
                soundService.playError();
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
            soundService.playError();
        }
    } else if (recoveryStep === 'question') {
        if (!securityAnswer) {
            setError("Veuillez répondre à la question");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/recovery/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, answer: securityAnswer })
            });
            const data = await response.json();
            if (data.success) {
                setRecoveryStep('reset');
                setSuccessMsg("Identité vérifiée. Veuillez définir un nouveau mot de passe.");
            } else {
                setError(data.message || "Réponse incorrecte.");
                soundService.playError();
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
            soundService.playError();
        }
    } else if (recoveryStep === 'reset') {
        if (!password || !confirmPassword) {
            setError("Veuillez remplir tous les champs");
            return;
        }
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/recovery/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (data.success) {
                setSuccessMsg("Mot de passe réinitialisé avec succès !");
                soundService.playSuccess();
                setTimeout(() => {
                    setIsRecovering(false);
                    setRecoveryStep('username');
                    setPassword('');
                    setConfirmPassword('');
                    setSecurityAnswer('');
                }, 2000);
            } else {
                setError(data.message || "Erreur lors de la réinitialisation.");
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
            soundService.playError();
        }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecovering) {
        handleRecoverySubmit(e);
        return;
    }

    soundService.playClick();
    setError('');
    setSuccessMsg('');

    if (!username || !password) {
        setError('Veuillez remplir tous les champs');
        soundService.playError();
        return;
    }

    if (isRegistering) {
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            soundService.playError();
            return;
        }
        if (!securityQuestion || !securityAnswer) {
            setError('Veuillez configurer une question de sécurité');
            soundService.playError();
            return;
        }
    }

    if (!isRegistering) {
        soundService.playClick();
    }
    
    setLoading(true);

    // Simulated network delay for polished UX
    setTimeout(async () => {
      if (isRegistering) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, role: 'User', securityQuestion, securityAnswer })
            });
            const data = await response.json();
            if (data.success) {
                soundService.playSuccess();
                setIsPending(true); // Show pending panel
            } else {
                setError(data.message || "Erreur lors de la création du compte.");
                soundService.playError();
            }
        } catch (err) {
            setError("Erreur de connexion au serveur");
            soundService.playError();
        }
        setLoading(false);
      } else {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (data.success) {
                // Handle Remember Me preference
                if (rememberMe) {
                    localStorage.setItem('ont_finder_remember_me', username);
                } else {
                    localStorage.removeItem('ont_finder_remember_me');
                }

                // TRIGGER LAUNCH ANIMATION
                soundService.playSuccess();
                setIsLaunching(true);

                // Delay actual login to show animation - INCREASED TO 4.5 SECONDS
                setTimeout(() => {
                    onLogin({ username, role: data.user.role });
                }, 4500); 
            } else {
                setLoading(false);
                if (data.message && (data.message.includes("pas encore approuvé") || data.message.includes("en attente d'approbation"))) {
                    setIsPending(true);
                    return;
                }
                setError(data.message || 'Identifiant ou mot de passe incorrect');
                soundService.playError();
            }
        } catch (err) {
            setLoading(false);
            setError("Erreur de connexion au serveur");
            soundService.playError();
        }
      }
    }, 1200);
  };

  // RENDER SPLASH SCREEN IF LAUNCHING
  if (isLaunching) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-pulse-glow"></div>

        {/* Logo Container - Scaling Up Animation */}
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up scale-125">
           
           {/* Icon Box */}
           <div className="relative mb-6 group">
             <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-2xl animate-pulse"></div>
             <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.4)] border border-white/20 animate-heartbeat">
               <Activity className="w-10 h-10 text-white drop-shadow-md" />
               <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full border-4 border-slate-950 shadow-lg"></div>
             </div>
           </div>

           {/* Text Content */}
           <div className="text-center space-y-2">
             <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-2xl">
               ONT Finder <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Pro</span>
             </h1>
             <div className="relative overflow-hidden">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.3em] animate-pulse-soft">
                  Enterprise Edition
                </p>
                {/* Shimmer effect over text */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
             </div>
           </div>
        </div>

        {/* Loading Bar - Adjusted duration to 4s */}
        <div className="absolute bottom-20 w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 animate-[loadingBar_4s_ease-in-out_forwards] w-0 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>
        </div>
        
        <p className="absolute bottom-14 text-[10px] text-slate-500 font-mono animate-pulse">
            INITIALISATION DU SYSTÈME...
        </p>

        <style>{`
            @keyframes loadingBar {
                0% { width: 0%; }
                20% { width: 10%; }
                50% { width: 40%; }
                80% { width: 80%; }
                100% { width: 100%; }
            }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow"></div>
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8 relative">
            
            <div className="text-center mb-6 relative">
                <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center group cursor-pointer transition-transform hover:scale-105">
                    <div className={`absolute inset-0 blur-2xl rounded-full animate-pulse-glow transition-colors duration-500 ${isRegistering ? 'bg-emerald-500/20' : (isRecovering ? 'bg-amber-500/20' : 'bg-cyan-500/20')}`}></div>
                    
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                        <defs>
                             <linearGradient id="tech-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={isRegistering ? "#10b981" : (isRecovering ? "#f59e0b" : "#22d3ee")} />
                                <stop offset="100%" stopColor={isRegistering ? "#34d399" : (isRecovering ? "#fbbf24" : "#3b82f6")} />
                            </linearGradient>
                        </defs>
                        <g className="origin-center animate-[spin_10s_linear_infinite]">
                             <path d="M100 10 A 90 90 0 0 1 190 100" fill="none" stroke="url(#tech-grad)" strokeWidth="1.5" strokeDasharray="20 10" opacity="0.4" />
                             <path d="M100 190 A 90 90 0 0 1 10 100" fill="none" stroke="url(#tech-grad)" strokeWidth="1.5" strokeDasharray="20 10" opacity="0.4" />
                        </g>
                        <g className="origin-center animate-[spin_3s_linear_infinite]">
                             {isRegistering ? (
                                <path d="M100 60 L140 100 L100 140 L60 100 Z" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.8" />
                             ) : isRecovering ? (
                                <circle cx="100" cy="100" r="35" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
                             ) : (
                                <circle cx="100" cy="100" r="35" fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="10 5" opacity="0.8" />
                             )}
                        </g>
                        <g className="origin-center animate-pulse">
                            {isRegistering ? (
                                <UserPlus x="85" y="85" width="30" height="30" className="text-emerald-400" />
                            ) : isRecovering ? (
                                <ShieldCheck x="85" y="85" width="30" height="30" className="text-amber-400" />
                            ) : (
                                <Activity x="85" y="85" width="30" height="30" className="text-cyan-400" />
                            )}
                        </g>
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-white mb-1 tracking-tight transition-all">
                    {isRecovering ? 'Récupération' : (isRegistering ? 'Créer un compte' : 'Bienvenue')}
                </h1>
                
                <div className="flex flex-col items-center">
                    <p className="text-slate-400 text-xs font-medium mb-3">
                        ONT Finder <span className={`font-semibold ${isRegistering ? 'text-emerald-400' : (isRecovering ? 'text-amber-400' : 'text-primary')}`}>Pro</span>
                    </p>
                    <div className="flex justify-center animate-fade-in-up">
                       <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-950 border border-cyan-500/30 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.15)] group hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all cursor-help">
                          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse-soft" />
                          <span className="text-[9px] font-bold text-cyan-400 tracking-[0.2em] uppercase">
                          EDITION ENTREPRISE
                          </span>
                      </div>
                   </div>
                </div>
            </div>

            {successMsg && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center font-bold flex items-center justify-center gap-2 animate-fade-in-up">
                    <Check className="w-4 h-4" />
                    {successMsg}
                </div>
            )}

            {isPending ? (
                <div className="text-center p-6 animate-fade-in-up">
                    {isApproved ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="relative w-24 h-24 mx-auto">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse"></div>
                                <div className="relative w-full h-full bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                    <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce-soft" />
                                </div>
                                <div className="absolute -top-2 -right-2">
                                    <PartyPopper className="w-8 h-8 text-amber-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Compte Approuvé !</h2>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Félicitations <span className="text-emerald-400 font-bold">{username}</span>, votre accès a été validé par l'administrateur.
                                </p>
                            </div>

                            <div className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl space-y-3">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Rôle Assigné</span>
                                    <span className="text-emerald-400">{approvedRole}</span>
                                </div>
                                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    <span>Statut</span>
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                                        Actif
                                    </span>
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    soundService.playSuccess();
                                    setIsLaunching(true);
                                    setTimeout(() => {
                                        onLogin({ username, role: approvedRole });
                                    }, 4500);
                                }}
                                className="w-full group relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                                <span className="relative flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em]">
                                    Lancer l'application
                                    <Rocket className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                </span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                                <div className="relative w-full h-full bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center">
                                    <Clock className="w-10 h-10 text-amber-500 animate-spin-slow" />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-xl font-black text-white tracking-tight uppercase">Vérification en cours</h2>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Votre compte a été créé. Veuillez patienter pendant qu'un administrateur valide votre accès.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 p-3 bg-slate-900/50 border border-white/5 rounded-xl">
                                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attente de validation en temps réel...</span>
                                </div>
                                
                                <button 
                                    onClick={() => { 
                                        soundService.playClick();
                                        setIsPending(false); 
                                        setIsRegistering(false); 
                                    }} 
                                    className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mt-2"
                                >
                                    <X className="w-3 h-3" />
                                    Retour à la connexion
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* USERNAME FIELD - Always visible except in reset step */}
                    {recoveryStep !== 'reset' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Utilisateur</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-white transition-colors">
                                    <UserIcon className="w-4 h-4" />
                                </div>
                                <input 
                                    type="text" 
                                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 text-sm font-medium disabled:opacity-50"
                                    placeholder="Identifiant"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    disabled={isRecovering && recoveryStep !== 'username'}
                                />
                            </div>
                        </div>
                    )}

                    {/* RECOVERY: QUESTION STEP */}
                    {isRecovering && recoveryStep === 'question' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                                <p className="text-xs text-slate-400 mb-1">Question de sécurité :</p>
                                <p className="text-sm font-medium text-white">{recoveredQuestion}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Réponse</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-white transition-colors">
                                        <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <input 
                                        type="text" 
                                        className="block w-full pl-9 pr-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all duration-300 text-sm font-medium"
                                        placeholder="Votre réponse"
                                        value={securityAnswer}
                                        onChange={(e) => setSecurityAnswer(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASSWORD FIELDS - Visible in Login, Register, and Reset Step */}
                    {(!isRecovering || recoveryStep === 'reset') && (
                        <div className="space-y-1 animate-fade-in-up">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                {recoveryStep === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'}
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-white transition-colors">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input 
                                    type="password" 
                                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-300 text-sm font-medium"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            {!isRegistering && !isRecovering && (
                                <div className="flex justify-end">
                                    <button 
                                        type="button"
                                        onClick={handleRecoveryToggle}
                                        className="text-[10px] text-slate-500 hover:text-primary transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONFIRM PASSWORD - Register or Reset Step */}
                    {((isRegistering) || (isRecovering && recoveryStep === 'reset')) && (
                        <div className="space-y-1 animate-fade-in-up">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Confirmer</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-white transition-colors">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <input 
                                    type="password" 
                                    className="block w-full pl-9 pr-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-sm font-medium"
                                    placeholder="Répétez le mot de passe"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* SECURITY QUESTIONS - Only for Registration */}
                    {isRegistering && (
                        <div className="space-y-4 animate-fade-in-up pt-2 border-t border-white/5">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Question de sécurité</label>
                                <select 
                                    value={securityQuestion}
                                    onChange={(e) => setSecurityQuestion(e.target.value)}
                                    className="block w-full px-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-xs font-medium appearance-none"
                                >
                                    <option value="">Sélectionnez une question...</option>
                                    {SECURITY_QUESTIONS.map((q, i) => (
                                        <option key={i} value={q}>{q}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Réponse</label>
                                <input 
                                    type="text" 
                                    className="block w-full px-3 py-2.5 border border-slate-700/50 rounded-lg bg-slate-900/50 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-300 text-sm font-medium"
                                    placeholder="Votre réponse"
                                    value={securityAnswer}
                                    onChange={(e) => setSecurityAnswer(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* REMEMBER ME - Only Login */}
                    {!isRegistering && !isRecovering && (
                        <div className="overflow-hidden transition-all duration-300 max-h-10 opacity-100">
                            <div 
                                className="flex items-center gap-2 cursor-pointer group w-fit ml-1"
                                onClick={handleRememberToggle}
                            >
                                {rememberMe ? (
                                    <CheckSquare className="w-4 h-4 text-primary animate-pulse" />
                                ) : (
                                    <Square className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                                )}
                                <span className={`text-xs font-medium transition-colors ${rememberMe ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                                    Se souvenir de moi
                                </span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-bold animate-pulse flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                            {error}
                        </div>
                    )}

                    {/* Glass Button: Main Submit */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full relative overflow-hidden group font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-white border border-white/10 ${
                            isRegistering 
                            ? 'bg-emerald-600/30 backdrop-blur-md hover:bg-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]' 
                            : isRecovering
                            ? 'bg-amber-600/30 backdrop-blur-md hover:bg-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                            : 'bg-indigo-600/30 backdrop-blur-md hover:bg-indigo-500/40 shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.3)]'
                        }`}
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]"></div>
                        <span className="relative flex items-center justify-center gap-2 text-sm uppercase tracking-widest font-black">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Traitement...
                                </>
                            ) : (
                                isRegistering ? (
                                    <>
                                        S'inscrire
                                        <UserPlus className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                ) : isRecovering ? (
                                    <>
                                        {recoveryStep === 'username' ? 'Suivant' : recoveryStep === 'question' ? 'Vérifier' : 'Réinitialiser'}
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                ) : (
                                    <>
                                        Connexion
                                        <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )
                            )}
                        </span>
                    </button>
                </form>
            )}

            <div className="mt-6 text-center border-t border-white/5 pt-4">
                <button 
                    onClick={isRecovering ? handleRecoveryToggle : handleToggleMode}
                    className="text-xs text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-1 mx-auto group"
                >
                    {isRecovering ? (
                        <>Annuler la récupération</>
                    ) : isRegistering ? (
                        <>Déjà un compte ? <span className="text-primary group-hover:underline underline-offset-4">Connexion</span></>
                    ) : (
                        <>Pas de compte ? <span className="text-emerald-400 group-hover:underline underline-offset-4">Créer un compte</span></>
                    )}
                </button>
            </div>
            
            <div className="mt-6 text-center">
                 <p className="text-[10px] text-slate-600 font-mono">
                    System Verified • Database Connected
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;