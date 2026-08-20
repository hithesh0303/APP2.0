import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { NotificationItem, ReminderItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  permissionStatus: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  refreshNotifications: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  sendLocalNotification: (title: string, body: string, type?: NotificationItem['type']) => void;
  activeToast: { title: string; message: string; type: string } | null;
  dismissToast: () => void;
  playNotificationSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API Synthesizer Chime
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.7);
  } catch (err) {
    // AudioContext blocked or not allowed prior to interaction
  }
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type: string } | null>(null);

  // Keep track of fired reminders for the current minute to prevent duplicate triggers
  const firedMinutesRef = useRef<Set<string>>(new Set());

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  }, [user]);

  const sendLocalNotification = useCallback((title: string, body: string, type: NotificationItem['type'] = 'insight') => {
    // 1. Play sound chime
    playNotificationChime();

    // 2. In-app high visibility toast
    setActiveToast({ title, message: body, type });
    setTimeout(() => {
      setActiveToast(prev => (prev?.title === title ? null : prev));
    }, 5500);

    // 3. Real browser Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Browser notification error:', err);
      }
    }

    refreshNotifications();
  }, [refreshNotifications]);

  // Periodic Reminder Scheduler
  useEffect(() => {
    if (!user) return;

    const checkReminders = async () => {
      try {
        const reminders = await api.getReminders();
        const now = new Date();
        const currentHour = String(now.getHours()).padStart(2, '0');
        const currentMinute = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHour}:${currentMinute}`;
        const currentDay = DAY_NAMES[now.getDay()];

        reminders.forEach((rem: ReminderItem) => {
          if (!rem.enabled) return;

          const repeatDays = rem.repeatDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          if (!repeatDays.includes(currentDay)) return;

          const triggerKey = `${rem.id}_${now.toDateString()}_${currentTimeStr}`;
          if (firedMinutesRef.current.has(triggerKey)) return;

          if (rem.time === currentTimeStr) {
            firedMinutesRef.current.add(triggerKey);
            const notifType = (['meal', 'workout', 'water', 'sleep'].includes(rem.type) ? rem.type : 'insight') as NotificationItem['type'];
            sendLocalNotification(
              `⏰ Reminder: ${rem.title}`,
              rem.message || `It's ${currentTimeStr}. Time for your ${rem.type} schedule!`,
              notifType
            );
          }
        });
      } catch (err) {
        // Silent fail on background fetch
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 25000); // Check every 25 seconds
    return () => clearInterval(interval);
  }, [user, sendLocalNotification]);

  // Periodic unread count refresh
  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        if (perm === 'granted') {
          sendLocalNotification('Notifications Active! 🔔', 'FitAI will send you gentle reminders for water, meals, and workouts.', 'insight');
        }
        return perm;
      } catch (err) {
        console.error('Error requesting notification permission:', err);
        return 'denied';
      }
    }
    return 'denied';
  };

  const markAllAsRead = async () => {
    await api.markNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const dismissToast = () => setActiveToast(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        permissionStatus,
        requestPermission,
        refreshNotifications,
        markAllAsRead,
        markAsRead,
        sendLocalNotification,
        activeToast,
        dismissToast,
        playNotificationSound: playNotificationChime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
