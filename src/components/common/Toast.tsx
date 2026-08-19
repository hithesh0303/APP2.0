import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, Sparkles, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

export const Toast: React.FC = () => {
  const { activeToast, dismissToast } = useNotifications();

  if (!activeToast) return null;

  const icons = {
    workout: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    meal: <Info className="w-5 h-5 text-amber-500" />,
    water: <Sparkles className="w-5 h-5 text-sky-500" />,
    insight: <Sparkles className="w-5 h-5 text-indigo-500" />,
    default: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  };

  const icon = icons[activeToast.type as keyof typeof icons] || icons.default;

  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 z-50 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-2xl p-4 flex items-start space-x-3 pointer-events-auto"
          id="toast-notification"
        >
          <div className="shrink-0 mt-0.5">{icon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{activeToast.title}</h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 leading-relaxed">{activeToast.message}</p>
          </div>
          <button
            onClick={dismissToast}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ToastContainer = Toast;
