import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { ReminderItem } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import { Clock, Plus, Trash2, Bell, CheckCircle2, Volume2, Edit2, Droplets, Dumbbell, Utensils, Moon } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const RemindersModal: React.FC<RemindersModalProps> = ({ isOpen, onClose }) => {
  const { sendLocalNotification, requestPermission, permissionStatus, playNotificationSound } = useNotifications();
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('08:30');
  const [formType, setFormType] = useState<ReminderItem['type']>('breakfast');
  const [formMessage, setFormMessage] = useState('');
  const [formDays, setFormDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

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

  const resetForm = () => {
    setFormTitle('');
    setFormTime('08:30');
    setFormType('breakfast');
    setFormMessage('');
    setFormDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartEdit = (rem: ReminderItem) => {
    setEditingId(rem.id);
    setFormTitle(rem.title);
    setFormTime(rem.time);
    setFormType(rem.type);
    setFormMessage(rem.message || '');
    setFormDays(rem.repeatDays || ALL_DAYS);
    setIsAdding(true);
  };

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

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formTime) return;
    setLoading(true);

    try {
      if (editingId) {
        const updated = await api.updateReminder(editingId, {
          title: formTitle,
          time: formTime,
          type: formType,
          message: formMessage,
          repeatDays: formDays,
        });
        setReminders(prev => prev.map(r => (r.id === editingId ? updated : r)));
        sendLocalNotification('Reminder Updated ⏰', `Updated "${updated.title}" for ${updated.time}.`, 'insight');
      } else {
        const created = await api.createReminder({
          title: formTitle,
          time: formTime,
          type: formType,
          message: formMessage,
          repeatDays: formDays,
          enabled: true,
        });
        setReminders(prev => [...prev, created]);
        sendLocalNotification('Reminder Created ⏰', `Scheduled "${created.title}" at ${created.time}.`, 'insight');
      }
      resetForm();
    } catch (err) {
      console.error('Save reminder error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    if (formDays.includes(day)) {
      if (formDays.length > 1) {
        setFormDays(formDays.filter(d => d !== day));
      }
    } else {
      setFormDays([...formDays, day]);
    }
  };

  const handleTestTrigger = (rem: ReminderItem) => {
    const notifType = (['meal', 'workout', 'water', 'sleep'].includes(rem.type) ? rem.type : 'insight') as any;
    sendLocalNotification(`⏰ Reminder: ${rem.title}!`, rem.message || `FitAI schedule reminder for ${rem.time}. Stay on track!`, notifType);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'water':
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
      case 'workout':
        return <Dumbbell className="w-3.5 h-3.5 text-indigo-500" />;
      case 'sleep':
        return <Moon className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Utensils className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title="Daily Habit & Routine Reminders"
      subtitle="Scheduled alerts for hydration, meals, workouts, and sleep"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Permission status prompt */}
        {permissionStatus !== 'granted' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-300">
                Enable browser notifications for real-time sound and banner alerts.
              </span>
            </div>
            <button
              type="button"
              onClick={requestPermission}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shrink-0"
            >
              Enable Alerts
            </button>
          </div>
        )}

        {/* Add/Edit Form */}
        {isAdding ? (
          <form onSubmit={handleSaveReminder} className="p-4 bg-neutral-100/70 dark:bg-neutral-850 rounded-2xl border border-neutral-200 dark:border-neutral-700 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                {editingId ? 'Edit Routine Reminder' : 'New Habit Reminder'}
              </h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Hydration (500ml)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="water">Water</option>
                    <option value="workout">Workout</option>
                    <option value="sleep">Sleep</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1">Motivational Note (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Remember to drink 500ml water and stretch!"
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 block mb-1.5">Repeat Days</label>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                {ALL_DAYS.map((day) => {
                  const selected = formDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                        selected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                {loading ? 'Saving...' : editingId ? 'Update Reminder' : 'Save Reminder'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="w-full py-2.5 px-4 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Add New Routine Reminder</span>
          </button>
        )}

        {/* Reminders List */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {reminders.length === 0 ? (
            <div className="text-center py-6 text-neutral-400 text-xs">
              No reminders scheduled. Add your first routine alert above!
            </div>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  rem.enabled
                    ? 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 shadow-xs'
                    : 'bg-neutral-100/60 dark:bg-neutral-900/40 border-neutral-200/50 dark:border-neutral-800/40 opacity-60'
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
                    aria-label="Toggle reminder"
                  >
                    {rem.enabled && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      {getIconForType(rem.type)}
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{rem.title}</h4>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{rem.time}</span>
                      <span>•</span>
                      <span>{rem.repeatDays.join(', ')}</span>
                      {rem.message && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[140px] italic">"{rem.message}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleTestTrigger(rem)}
                    title="Test Alert Chime"
                    className="p-1.5 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-xs font-medium flex items-center space-x-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Test</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(rem)}
                    title="Edit Reminder"
                    className="p-1.5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(rem.id)}
                    title="Delete Reminder"
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
