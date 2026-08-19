import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Moon, Sun, CheckCircle2, Clock } from 'lucide-react';

interface SleepTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const SleepTrackerModal: React.FC<SleepTrackerModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { sendLocalNotification } = useNotifications();
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedHours, setCalculatedHours] = useState('8.0');

  useEffect(() => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let bMin = bH * 60 + bM;
    let wMin = wH * 60 + wM;
    if (wMin < bMin) wMin += 24 * 60;
    const diff = (wMin - bMin) / 60;
    setCalculatedHours(diff.toFixed(1));
  }, [bedtime, wakeTime]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.logSleep({
        bedtime,
        wakeTime,
        quality,
        notes,
      });
      sendLocalNotification(
        'Sleep Logged 🌙',
        `Recorded ${calculatedHours} hours of sleep (${quality} quality). Good recovery fuels performance!`,
        'sleep'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Log sleep error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sleep & Recovery Tracker"
      subtitle="Consistent 7-9 hours optimizes metabolic rate and muscle protein synthesis"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center space-x-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Went to Bed</span>
            </label>
            <input
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center space-x-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Woke Up</span>
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>
        </div>

        {/* Calculated Total Card */}
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-indigo-500" />
            <div>
              <span className="text-xs text-neutral-600 dark:text-neutral-400">Total Duration</span>
              <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {calculatedHours} <span className="text-xs font-normal">Hours</span>
              </div>
            </div>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {Number(calculatedHours) >= 7 ? 'Optimal Recovery ✨' : 'Needs +1-2 hrs'}
          </span>
        </div>

        {/* Sleep Quality */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Sleep Quality Rating
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'poor', label: '😫 Poor' },
              { id: 'fair', label: '😐 Fair' },
              { id: 'good', label: '😊 Good' },
              { id: 'excellent', label: '🌟 Deep' },
            ].map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => setQuality(q.id as any)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                  quality === q.id
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Notes / Observations (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. No screens 30m before bed, slept straight through"
            className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
          />
        </div>

        <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Sleep Log</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
