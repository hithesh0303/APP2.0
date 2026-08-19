import React from 'react';
import { Bell, Sun, Moon, Sparkles, User as UserIcon, ShieldCheck, Activity, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenReminders: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  onOpenHealthTest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenReminders,
  onOpenProfile,
  onOpenAuth,
  onOpenAdmin,
  onOpenHealthTest,
}) => {
  const { user, profile } = useAuth();
  const { resolvedTheme, theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Greeting */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white shadow-xs font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-neutral-900 dark:text-neutral-50 text-base sm:text-lg tracking-tight">
                FitAI
              </span>
              <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded-md">
                PRO COACH
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              {todayStr}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Health Test / Verification Suite */}
          <button
            id="btn-header-health"
            onClick={onOpenHealthTest}
            title="System & AI Verification Suite"
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors text-xs flex items-center space-x-1 border border-neutral-200/80 dark:border-neutral-700/80 hidden sm:flex"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium text-[11px]">System Test</span>
          </button>

          {/* Admin Dashboard if user is admin */}
          {user?.role === 'admin' && (
            <button
              id="btn-header-admin"
              onClick={onOpenAdmin}
              title="Admin Dashboard"
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
            </button>
          )}

          {/* Reminders Manager */}
          <button
            id="btn-header-reminders"
            onClick={onOpenReminders}
            title="Manage Reminders"
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            aria-label="Reminders"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Notification Center */}
          <button
            id="btn-header-notifications"
            onClick={onOpenNotifications}
            className="relative p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse ring-2 ring-white dark:ring-neutral-900" />
            )}
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-header-theme"
            onClick={toggleTheme}
            title={`Theme: ${theme}`}
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </button>

          {/* User Profile / Auth */}
          {user ? (
            <button
              id="btn-header-profile"
              onClick={onOpenProfile}
              className="flex items-center space-x-2 pl-1 pr-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors ml-1 border border-neutral-200/60 dark:border-neutral-700/60"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hidden md:inline">
                {user.name.split(' ')[0]}
              </span>
            </button>
          ) : (
            <button
              id="btn-header-auth"
              onClick={onOpenAuth}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
