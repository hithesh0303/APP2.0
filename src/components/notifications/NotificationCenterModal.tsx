import React from 'react';
import { Modal } from '../common/Modal';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCheck, Sparkles, Dumbbell, Utensils, Droplets, Moon, TrendingUp } from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();

  const getIcon = (type: string) => {
    switch (type) {
      case 'workout':
        return <Dumbbell className="w-4 h-4 text-emerald-500" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-amber-500" />;
      case 'water':
        return <Droplets className="w-4 h-4 text-sky-500" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case 'progress':
        return <TrendingUp className="w-4 h-4 text-rose-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Notification Center"
      subtitle={`${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Header Action */}
        <div className="flex justify-between items-center pb-2 border-b border-neutral-100 dark:border-neutral-800">
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Activity & Reminders</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 text-xs">
              No notifications yet. You're completely caught up!
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => !item.isRead && markAsRead(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3 ${
                  item.isRead
                    ? 'bg-neutral-50/60 dark:bg-neutral-800/30 border-neutral-200/50 dark:border-neutral-800/40 text-neutral-600 dark:text-neutral-400'
                    : 'bg-white dark:bg-neutral-800/90 border-emerald-300 dark:border-emerald-700/60 shadow-xs'
                }`}
              >
                <div className="p-2 bg-neutral-100 dark:bg-neutral-700/60 rounded-xl shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.title}</h4>
                    {!item.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                  <span className="text-[10px] text-neutral-400 mt-1.5 block font-mono">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
