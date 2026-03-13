import React from 'react';
import { X, Clock, Calendar, Globe, User, ShieldCheck } from 'lucide-react';
import { ConnectionLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LogsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: ConnectionLog[];
}

const LogsDialog: React.FC<LogsDialogProps> = ({ isOpen, onClose, logs }) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Journaux de Connexion</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Suivi des accès et de l'activité des utilisateurs</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Utilisateur</th>
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Rôle</th>
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Adresse IP</th>
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Connexion</th>
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">Dernière Activité</th>
                      <th className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 text-right">Durée</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                          Aucun journal de connexion trouvé.
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <motion.tr
                          key={log.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                <User size={16} />
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">{log.username}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              log.role === 'PROPRIÉTAIRE/PDG' 
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {log.role || 'Utilisateur'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Globe size={14} className="opacity-50" />
                              <span className="font-mono text-xs">{log.ip_address || 'Inconnue'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar size={14} className="opacity-50" />
                              <span className="text-xs">{formatDate(log.login_time)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Clock size={14} className="opacity-50" />
                              <span className="text-xs">{formatDate(log.last_active)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                              {formatDuration(log.duration_seconds)}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                Accès réservé au PROPRIÉTAIRE/PDG • Système de surveillance sécurisé
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LogsDialog;
