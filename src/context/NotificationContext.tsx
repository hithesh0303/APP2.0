import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NotificationItem } from '../types';
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [activeToast, setActiveToast] = useState<{ title: string; message: string; type: string } | null>(null);

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

  useEffect(() => {
    if (user) {
      refreshNotifications();
      const interval = setInterval(refreshNotifications, 20000);
      return () => clearInterval(interval);
    }
  }, [user, refreshNotifications]);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionStatus(perm);
        return perm;
      } catch (err) {
        console.error('Error requesting notification permission:', err);
        return 'denied';
      }
    }
    return 'denied';
  };

  const sendLocalNotification = (title: string, body: string, type: NotificationItem['type'] = 'insight') => {
    // 1. In-app toast
    setActiveToast({ title, message: body, type });
    setTimeout(() => {
      setActiveToast(null);
    }, 4500);

    // 2. Real browser Web Notification if granted
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
