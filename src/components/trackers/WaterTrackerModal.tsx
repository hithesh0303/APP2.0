import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Droplets, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { ProgressRing } from '../common/ProgressBar';

interface WaterTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const WaterTrackerModal: React.FC<WaterTrackerModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { profile } = useAuth();
  const { sendLocalNotification } = useNotifications();
  const [totalMl, setTotalMl] = useState(0);
  const [customMl, setCustomMl] = useState('250');
  const [loading, setLoading] = useState(false);

  const targetMl = profile?.waterTargetMl || 3000;

  const fetchWater = async () => {
    try {
      const data = await api.getWater();
      setTotalMl(data.currentAmountMl || 0);
    } catch (err) {
      console.error('Error fetching water:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWater();
    }
  }, [isOpen]);

  const handleAddWater = async (amount: number) => {
    setLoading(true);
    try {
      const res = await api.addWater(amount);
      setTotalMl(res.currentAmountMl);
      sendLocalNotification(
        'Hydration Logged! 💧',
        `Added +${amount}ml. Today's total is ${(res.currentAmountMl / 1000).toFixed(1)}L of ${(targetMl / 1000).toFixed(1)}L.`,
        'water'
      );
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Add water error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset today’s water log?')) return;
    try {
      const res = await api.resetWater();
      setTotalMl(res.currentAmountMl);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error('Reset water error:', err);
    }
  };

  const percentage = Math.min(100, Math.round((totalMl / targetMl) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Hydration Tracker"
      subtitle={`Your daily target: ${(targetMl / 1000).toFixed(1)} Liters (${targetMl} ml)`}
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Progress Ring Visualization */}
        <div className="flex flex-col items-center justify-center p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 rounded-3xl">
          <ProgressRing
            value={totalMl}
            max={targetMl}
            size={140}
            strokeWidth={12}
            colorClass="text-sky-500"
            label={`${(totalMl / 1000).toFixed(1)}L`}
            sublabel={`${percentage}% of goal`}
          />
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 text-center">
            {totalMl >= targetMl ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hydration goal achieved for today!</span>
              </span>
            ) : (
              <span>
                Remaining: <strong className="text-neutral-900 dark:text-neutral-100">{Math.max(0, targetMl - totalMl)} ml</strong>
              </span>
            )}
          </p>
        </div>

        {/* Quick Add Presets */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            Quick Add
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Glass', ml: 250, icon: '🥛' },
              { label: 'Bottle', ml: 500, icon: '🍶' },
              { label: 'Large Flask', ml: 750, icon: '🚰' },
            ].map((preset) => (
              <button
                key={preset.ml}
                type="button"
                disabled={loading}
                onClick={() => handleAddWater(preset.ml)}
                className="p-3 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/40 border border-neutral-200 dark:border-neutral-700 hover:border-sky-400 rounded-2xl text-center transition-all group"
              >
                <div className="text-xl mb-1 group-hover:scale-110 transition-transform">{preset.icon}</div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">+{preset.ml} ml</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{preset.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Custom Amount (ml)
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="50"
              step="50"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              placeholder="e.g. 350"
              className="flex-1 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 outline-none"
            />
            <button
              type="button"
              disabled={loading || !customMl}
              onClick={() => handleAddWater(Number(customMl))}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-neutral-400 hover:text-red-500 flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset today's water</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
};
