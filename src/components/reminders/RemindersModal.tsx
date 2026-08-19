import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { ReminderItem } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { Clock, Plus, Trash2, Bell, CheckCircle2 } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose }) => {
  const { sendLocalNotification, requestPermission, permissionStatus } = useNotifications();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New Reminder form
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('08:00');
  const [newType, setNewType] = useState<ReminderItem['type']>('meal');

  const fetchReminders = async () => {
    try {
      const data = await api.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('Fetch reminders error:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReminders();
    }
  }, [isOpen]);

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.toggleReminder(id);
      setReminders(prev => prev.map(r => (r.id === id ? updated : r)));
    } catch (err) {
      console.error('Toggle reminder error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteReminder(id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Delete reminder error:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTime) return;
    setLoading(true);
    try {
      const created = await api.createReminder({
        title: newTitle,
        time: newTime,
        type: newType,
        repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        enabled: true,
      });
      setReminders(prev => [...prev, created]);
      setNewTitle('');
      setIsAdding(false);
      sendLocalNotification('Reminder Created ⏰', `Scheduled "${created.title}" at ${created.time}.`, 'insight');
    } catch (err) {
      console.error('Create reminder error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = (rem: ReminderItem) => {
    sendLocalNotification(`⏰ Time for ${rem.title}!`, `FitAI schedule reminder for ${rem.time}. Stay on track!`, rem.type);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Habit & Routine Reminders"
      subtitle="Consistent hydration, nutrition, and workout alerts"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Permission status prompt */}
        {permissionStatus !== 'granted' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-300">
                Enable browser notifications for real-time background sound & banner alerts.
              </span>
            </div>
            <button
              type="button"
              onClick={requestPermission}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Enable
            </button>
          </div>
        )}

        {/* Reminders List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {reminders.map((rem) => (
            <div
              key={rem.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                rem.enabled
                  ? 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700'
                  : 'bg-neutral-100/60 dark:bg-neutral-800/20 border-neutral-200/50 dark:border-neutral-800/40 opacity-60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleToggle(rem.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    rem.enabled
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-neutral-400 dark:border-neutral-600'
                  }`}
                  aria-label="Toggle enable"
                >
                  {rem.enabled && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{rem.title}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{rem.time}</span>
                    <span>•</span>
                    <span>{rem.repeatDays.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => handleTestTrigger(rem)}
                  title="Test Trigger Notification"
                  className="p-1.5 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-lg transition-colors text-xs font-medium"
                >
                  Test
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(rem.id)}
                  title="Delete reminder"
                  className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Reminder Form */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Schedule New Reminder</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Afternoon Hydration"
                  className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Time</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-neutral-500 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Save Reminder
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-2xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center justify-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Custom Reminder</span>
          </button>
        )}
      </div>
    </Modal>
  );
};
