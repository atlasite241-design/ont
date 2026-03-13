import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, Trash2, Shield, User as UserIcon, Check, X, ShieldAlert, Loader2, ShieldCheck, Mail, Key, Search, UserCog, Database, Ban, Unlock, Users, Activity, MoreVertical } from 'lucide-react';
import { dbService } from '../services/dbService';
import { soundService } from '../services/soundService';
import { User } from '../types';
import { API_BASE_URL } from '../config';

interface AdminPanelProps {
  currentUser?: User | null;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser: propUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [knownPendingUsernames, setKnownPendingUsernames] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<{ id: string; username: string; timestamp: number }[]>([]);
  const isFirstLoad = React.useRef(true);

  const currentUser = propUser || dbService.getCurrentUser();
  const isAdmin = currentUser?.role === 'PROPRIÉTAIRE/PDG' || currentUser?.role === 'Super Admin';

  useEffect(() => {
    loadUsers();
    fetchActiveUsers();
    
    // Refresh every 5 seconds as requested
    const interval = setInterval(() => {
      loadUsers();
      fetchActiveUsers();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Notification logic for Admin/PDG
    if (!isAdmin || users.length === 0) return;

    const pendingUsers = users.filter(u => !(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG'));
    const currentPendingUsernames = new Set(pendingUsers.map(u => u.username));
    
    if (!isFirstLoad.current) {
      const newPendingUsernames = Array.from(currentPendingUsernames).filter(username => !knownPendingUsernames.has(username));
      
      if (newPendingUsernames.length > 0) {
        newPendingUsernames.forEach(username => {
          const newNotif = {
            id: Math.random().toString(36).substr(2, 9),
            username: username,
            timestamp: Date.now()
          };
          setNotifications(prev => [newNotif, ...prev]);
          soundService.playNotification();
          
          // Auto-remove notification after 10 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
          }, 10000);
        });
      }
    } else {
      isFirstLoad.current = false;
    }
    
    setKnownPendingUsernames(currentPendingUsernames);
  }, [users, isAdmin]);

  const fetchActiveUsers = async () => {
    try {
      console.log("API_BASE_URL:", API_BASE_URL);
      console.log("Fetching active users count from:", `${API_BASE_URL}/api/users/active/count`);
      const res = await fetch(`${API_BASE_URL}/api/users/active/count`);
      if (res.ok) {
        const data = await res.json();
        setActiveUsersCount(data.count);
      } else {
        console.error("Failed to fetch active users count, status:", res.status);
      }
    } catch (e) {
      console.error("Failed to fetch active users count", e);
    }
  };

  const loadUsers = async () => {
    try {
      console.log("Loading users from:", `${API_BASE_URL}/api/users`);
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) {
        console.error("Failed to load users, status:", response.status);
        return;
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (u.role || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const isApproved = u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG';

    if (activeTab === 'pending') {
      return matchesSearch && !isApproved;
    }
    return matchesSearch && isApproved;
  });

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) {
      setError('Veuillez remplir tous les champs');
      soundService.playError();
      return;
    }

    soundService.playClick();
    setLoading(true);
    setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: newUsername, password: newPassword, role: newRole, is_approved: true })
        });
        const data = await response.json();
        if (data.success) {
          soundService.playSuccess();
          setNewUsername('');
          setNewPassword('');
          setNewRole('User');
          setShowAddForm(false);
          setError('');
          loadUsers();
        } else {
          setError(data.message || 'Erreur lors de la création');
          soundService.playError();
        }
      } catch (err) {
        setError('Erreur de connexion');
        soundService.playError();
      }
      setLoading(false);
    }, 800);
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      soundService.playError();
      return;
    }
    soundService.playClick();
    setUserToDelete(username);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    fetch(`${API_BASE_URL}/api/users/${userToDelete}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          soundService.playSuccess();
          loadUsers();
        }
        setUserToDelete(null);
      });
  };

  const toggleRole = (username: string, currentRole: string) => {
    if (username === 'admin') return;
    
    soundService.playClick();
    let nextRole = 'User';
    if (currentRole === 'User') nextRole = 'Professionnel';
    else if (currentRole === 'Professionnel') nextRole = 'Super Admin';
    else if (currentRole === 'Super Admin') nextRole = 'User';
    else nextRole = 'User'; // Default fallback

    fetch(`${API_BASE_URL}/api/users/${username}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          soundService.playSuccess();
          loadUsers();
        }
      });
  };

  const toggleBlock = (username: string, isBlocked: boolean) => {
    if (username === 'admin') return;
    
    soundService.playClick();
    fetch(`${API_BASE_URL}/api/users/${username}/block`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blocked: !isBlocked })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          soundService.playSuccess();
          loadUsers();
        }
      });
  };

  return (
    <div className="flex-grow overflow-hidden flex flex-col p-8 animate-fade-in-up relative h-full">
      {/* Admin Notifications */}
      {isAdmin && notifications.length > 0 && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-80 pointer-events-none">
          {notifications.map((notif) => (
            <div 
              key={notif.id}
              className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-start gap-4 animate-slide-in-right ring-1 ring-amber-500/20"
            >
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Nouvelle Inscription</h4>
                  <button 
                    onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                    className="text-slate-500 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 font-medium mb-3">
                  L'utilisateur <span className="text-amber-400 font-bold">@{notif.username}</span> attend votre approbation.
                </p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setActiveTab('pending');
                      setNotifications(prev => prev.filter(n => n.id !== notif.id));
                      soundService.playClick();
                    }}
                    className="flex-1 py-1.5 bg-amber-500 text-amber-950 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-colors"
                  >
                    Voir l'attente
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <ShieldCheck className="w-8 h-8 animate-pulse-soft" />
            </div>
            <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">
                Centre d'Administration
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.25em]">Système Actif</p>
                </div>
            </div>
          </div>

          {/* Live People Counter in Header */}
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2.5 rounded-2xl border border-white/5 group hover:border-emerald-500/30 transition-all cursor-default">
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live</span>
            <div className="w-px h-3 bg-white/10 mx-1"></div>
            <span className="text-sm font-black text-white">{activeUsersCount}</span>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Personnes</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <input 
                    type="text"
                    placeholder="Rechercher opérateurs..."
                    className="w-full bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs font-bold tracking-wider text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all hover:bg-slate-900/80"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Professional Button: Add Operator */}
            <button 
                onClick={() => { soundService.playClick(); setShowAddForm(true); }}
                className="flex items-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_15px_40px_-10px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 active:scale-95 group border border-white/10"
            >
                <div className="p-1.5 bg-white/20 rounded-lg group-hover:rotate-12 transition-transform">
                    <UserPlus className="w-3.5 h-3.5" />
                </div>
                <span>Ajouter Opérateur</span>
            </button>

            {/* Glass Button: Bulk Import */}
            <button 
                onClick={() => { soundService.playClick(); setShowBulkForm(true); }}
                className="flex items-center gap-2 px-6 py-3.5 bg-emerald-600/20 backdrop-blur-lg border border-emerald-500/30 text-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 shadow-[0_8px_32px_0_rgba(16,185,129,0.2)] hover:shadow-[0_12px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-600/30 hover:border-emerald-400/50 group active:scale-95 hover:-translate-y-0.5"
            >
                <div className="p-1 bg-white/20 rounded-full">
                    <Database className="w-3 h-3 group-hover:scale-110 transition-transform" />
                </div>
                Importation Massive
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Utilisateurs</p>
                <p className="text-2xl font-black text-white leading-none">{users.length}</p>
            </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all"></div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Activity className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">En Ligne</p>
                <p className="text-2xl font-black text-white leading-none">{activeUsersCount}</p>
            </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Administrateurs</p>
                <p className="text-2xl font-black text-white leading-none">{users.filter(u => u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG' || u.username === 'admin').length}</p>
            </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-white/5 flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
                <Ban className="w-6 h-6" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Comptes Bloqués</p>
                <p className="text-2xl font-black text-white leading-none">{users.filter(u => u.is_blocked).length}</p>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-2">
        <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-3 rounded-t-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'all' ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
            Tous les utilisateurs
        </button>
        <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 rounded-t-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
        >
            En attente
            {users.filter(u => !(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG')).length > 0 && (
                <span className="bg-amber-500 text-amber-950 px-2 py-0.5 rounded-full text-[9px] font-black">
                    {users.filter(u => !(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG')).length}
                </span>
            )}
        </button>
      </div>

      {/* Users Grid */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-4 space-y-4 pb-10">
        {filteredUsers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-slate-900/20 border border-dashed border-white/5 rounded-[2rem]">
                <UserIcon className="w-12 h-12 text-slate-700 mb-4 opacity-50" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Aucun opérateur trouvé</p>
            </div>
        ) : (
            filteredUsers.map((u, idx) => {
                const isSuperAdmin = u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG' || u.username === 'admin';
                return (
                    <div 
                        key={u.username}
                        className="glass-card p-6 rounded-[1.5rem] flex flex-col group animate-fade-in-up border-white/5 hover:border-indigo-500/30 relative overflow-hidden transition-all duration-500 hover:bg-slate-900"
                        style={{ animationDelay: `${idx * 80}ms` }}
                    >
                        {isSuperAdmin && <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[60px] translate-x-10 -translate-y-10 pointer-events-none"></div>}
                        
                        <div className="flex flex-col sm:flex-row items-center justify-between w-full">
                            <div className="flex items-center gap-6 relative z-10 w-full sm:w-auto">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-inner ${isSuperAdmin ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-slate-800/50 border-white/5 text-slate-400 group-hover:bg-indigo-500/5 group-hover:text-indigo-300'}`}>
                                    <UserIcon className={`w-6 h-6 transition-transform duration-500 ${isSuperAdmin ? 'animate-pulse-soft' : 'group-hover:scale-110'}`} />
                                </div>
                                
                                <div className="text-center sm:text-left flex-1">
                                    <h3 className="text-lg font-black text-white tracking-tight leading-none mb-2 group-hover:text-indigo-400 transition-colors flex items-center justify-center sm:justify-start gap-2">
                                        {u.username}
                                        {isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                                    </h3>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                        <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.1em] border shadow-sm transition-colors ${isSuperAdmin ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' : 'bg-slate-800 text-slate-500 border-white/5 group-hover:bg-slate-700'}`}>
                                            {u.role || 'User'}
                                        </span>
                                        {!(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG') && (
                                            <span className="text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-[0.1em] border shadow-sm bg-amber-500/10 text-amber-500 border-amber-500/30">
                                                En attente
                                            </span>
                                        )}
                                        <span className="text-[9px] text-slate-600 font-mono tracking-tighter opacity-70 flex items-center gap-1">
                                            <div className="w-1 h-1 bg-slate-600 rounded-full"></div>
                                            Créé: {new Date(u.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-6 sm:mt-0 relative z-10 w-full sm:w-auto justify-center sm:justify-end">
                            {/* Actions for pending users */}
                            {!(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG') && (
                                <div className="flex gap-2 mr-2">
                                    <button
                                        onClick={() => {
                                            soundService.playClick();
                                            fetch(`${API_BASE_URL}/api/users/${u.username}/approve`, { method: 'PATCH' })
                                                .then(res => res.json())
                                                .then(data => {
                                                    if (data.success) {
                                                        soundService.playSuccess();
                                                        loadUsers();
                                                    }
                                                });
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95 shadow-lg"
                                        title="Approuver l'utilisateur"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Approuver</span>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(u.username)}
                                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95 shadow-lg"
                                        title="Refuser l'utilisateur"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Refuser</span>
                                    </button>
                                </div>
                            )}

                            {/* Actions for approved users */}
                            {(u.is_approved || u.username === 'admin' || u.role === 'Super Admin' || u.role === 'PROPRIÉTAIRE/PDG') && (
                                <div className="flex flex-wrap items-center gap-2 mr-2">
                                    {/* Role Button */}
                                    <button 
                                        onClick={() => toggleRole(u.username, u.role || '')}
                                        disabled={u.username === 'admin'}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-indigo-300 hover:border-indigo-400/30 hover:bg-indigo-500/10 transition-all disabled:opacity-20 active:scale-95 shadow-lg"
                                        title="Modifier le rôle"
                                    >
                                        <UserCog className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Rôle</span>
                                    </button>
                                    
                                    {/* Block Button */}
                                    <button 
                                        onClick={() => toggleBlock(u.username, u.is_blocked || false)}
                                        disabled={u.username === 'admin'}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all disabled:opacity-20 active:scale-95 shadow-lg ${u.is_blocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-300 hover:border-amber-400/30 hover:bg-amber-500/10'}`}
                                        title={u.is_blocked ? "Débloquer l'utilisateur" : "Bloquer l'utilisateur"}
                                    >
                                        {u.is_blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                        <span className="text-[9px] font-black uppercase tracking-widest">
                                            {u.is_blocked ? 'Débloquer' : 'Bloquer'}
                                        </span>
                                    </button>
                                    
                                    {/* Delete Button */}
                                    <button 
                                        onClick={() => handleDeleteUser(u.username)}
                                        disabled={u.username === 'admin'}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-rose-300 hover:border-rose-400/30 hover:bg-rose-500/10 transition-all disabled:opacity-20 active:scale-95 shadow-lg"
                                        title="Supprimer l'utilisateur"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Supprimer</span>
                                    </button>
                                </div>
                            )}

                            {/* Info Button */}
                            <button
                                onClick={() => setExpandedUser(expandedUser === u.username ? null : u.username)}
                                className={`flex items-center justify-center w-10 h-10 rounded-xl backdrop-blur-md border transition-all active:scale-95 shadow-lg ${expandedUser === u.username ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                title="Plus d'informations et actions"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                        </div>

                        {/* Expanded Details Panel */}
                        {expandedUser === u.username && (
                            <div className="w-full mt-4 pt-4 border-t border-white/5 flex flex-col gap-4 animate-fade-in">
                                {/* Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Adresse IP</p>
                                        <p className="text-sm font-mono text-slate-300">{u.ip_address || 'Non enregistrée'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Localisation</p>
                                        <p className="text-sm font-medium text-slate-300">{u.city || 'Inconnue'}</p>
                                    </div>
                                    <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Navigateur / Appareil</p>
                                        <p className="text-xs font-mono text-slate-400 truncate" title={u.user_agent}>{u.user_agent || 'Non enregistré'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })
        )}
      </div>

      {/* Bulk Add Modal */}
      {showBulkForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setShowBulkForm(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up ring-1 ring-white/5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
            
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                    <Database className="w-6 h-6 text-emerald-500" />
                    Importation Massive
                </h3>
                <button onClick={() => { soundService.playClick(); setShowBulkForm(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"><X /></button>
                </div>

                <div className="mb-6 p-4 bg-slate-800/50 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Format attendu :</p>
                    <code className="text-[10px] text-emerald-400 font-mono block">utilisateur:motdepasse:role</code>
                    <p className="text-[9px] text-slate-500 mt-2 italic">Exemple : hicham:pass123:User (un par ligne)</p>
                </div>

                <div className="space-y-5">
                    <textarea 
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        className="w-full h-48 bg-slate-950 border border-white/5 rounded-2xl px-5 py-4 text-sm font-mono text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all shadow-inner"
                        placeholder="user1:pass1:User&#10;user2:pass2:Super Admin"
                    />

                    {error && (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black text-center uppercase tracking-[0.2em] animate-pulse">
                            {error}
                        </div>
                    )}

                    <button 
                        onClick={async () => {
                            if (!bulkText.trim()) return;
                            setLoading(true);
                            setError('');
                            const lines = bulkText.trim().split('\n');
                            const usersToCreate = lines.map(line => {
                                const [username, password, role] = line.split(':');
                                return { username: username?.trim(), password: password?.trim(), role: role?.trim() || 'User' };
                            }).filter(u => u.username && u.password);

                            try {
                                const res = await fetch(`${API_BASE_URL}/api/auth/register/bulk`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ users: usersToCreate })
                                });
                                const data = await res.json();
                                if (data.success) {
                                    soundService.playSuccess();
                                    setBulkText('');
                                    setShowBulkForm(false);
                                    loadUsers();
                                } else {
                                    setError(data.message || 'Erreur lors de l\'importation');
                                    soundService.playError();
                                }
                            } catch (e) {
                                setError('Erreur de connexion');
                                soundService.playError();
                            }
                            setLoading(false);
                        }}
                        disabled={loading}
                        className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(16,185,129,0.3)] transition-all group active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-emerald-400/20 hover:shadow-[0_25px_50px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Importer {bulkText.trim().split('\n').filter(l => l.includes(':')).length} Opérateurs</>}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
      <AnimatePresence>
        {showAddForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
              onClick={() => setShowAddForm(false)}
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden ring-1 ring-white/5"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
              
              <div className="p-8">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-2xl font-black text-white flex items-center gap-4 tracking-tighter">
                        <div className="p-2 bg-indigo-500/20 rounded-2xl text-indigo-400">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        Nouvel Opérateur
                    </h3>
                    <button onClick={() => { soundService.playClick(); setShowAddForm(false); }} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleAddUser} className="space-y-8">
                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5" /> IDENTIFIANT
                          </label>
                          <input 
                              type="text" 
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4.5 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                              placeholder="ex: hicham_pro"
                          />
                      </div>

                      <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                              <Key className="w-3.5 h-3.5" /> MOT DE PASSE
                          </label>
                          <input 
                              type="password" 
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4.5 text-sm font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-inner"
                              placeholder="••••••••"
                          />
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1 flex items-center gap-2">
                              <Shield className="w-3.5 h-3.5" /> RÔLE SYSTÈME
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                              {[
                                  { id: 'User', label: 'USER', icon: UserIcon },
                                  { id: 'Professionnel', label: 'PRO', icon: Shield },
                                  { id: 'Super Admin', label: 'ADMIN', icon: ShieldCheck }
                              ].map((role) => (
                                  <button
                                      key={role.id}
                                      type="button"
                                      onClick={() => { soundService.playClick(); setNewRole(role.id); }}
                                      className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${newRole === role.id ? 'bg-indigo-500/10 border-indigo-500/50 text-white ring-2 ring-indigo-500/20' : 'bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10'}`}
                                  >
                                      <role.icon className={`w-5 h-5 ${newRole === role.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                                      <span className="text-[9px] font-black tracking-widest">{role.label}</span>
                                  </button>
                              ))}
                          </div>
                      </div>

                      {error && (
                          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black text-center uppercase tracking-[0.2em] animate-pulse">
                              {error}
                          </div>
                      )}

                      <button 
                          type="submit"
                          disabled={loading}
                          className="w-full py-4.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl shadow-[0_20px_40px_rgba(79,70,229,0.3)] transition-all group active:scale-[0.98] flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] border border-white/10 hover:shadow-[0_25px_50px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
                      >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> CONFIRMER ACCÈS</>}
                      </button>
                  </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-fade-in" onClick={() => setUserToDelete(null)}></div>
          <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-fade-in-up ring-1 ring-white/5">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent"></div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 tracking-tighter">Supprimer l'utilisateur ?</h3>
              <p className="text-sm text-slate-400 mb-8">
                Êtes-vous sûr de vouloir supprimer l'opérateur <span className="text-white font-bold">"{userToDelete}"</span> ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest border border-white/5"
                >
                  Annuler
                </button>
                <button 
                  onClick={confirmDeleteUser}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest border border-rose-400/20 shadow-[0_0_20px_rgba(225,29,72,0.3)]"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;