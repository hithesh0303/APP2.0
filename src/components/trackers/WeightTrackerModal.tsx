import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Scale, Ruler, CheckCircle2 } from 'lucide-react';

interface WeightTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const WeightTrackerModal: React.FC<WeightTrackerModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { profile, refreshUser } = useAuth();
  const { sendLocalNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<'weight' | 'measurements'>('weight');

  // Weight form
  const [weight, setWeight] = useState(profile?.weight ? String(profile.weight) : '70');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Measurements form
  const [chestCm, setChestCm] = useState('');
  const [waistCm, setWaistCm] = useState('');
  const [hipsCm, setHipsCm] = useState('');
  const [armsCm, setArmsCm] = useState('');
  const [thighsCm, setThighsCm] = useState('');

  const [loading, setLoading] = useState(false);

  const handleSaveWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || Number(weight) <= 0) return;
    setLoading(true);
    try {
      const res = await api.logWeight(Number(weight), weightDate, notes);
      await refreshUser();
      sendLocalNotification(
        'Weight Logged ⚖️',
        `Recorded ${res.weight} kg (BMI: ${res.bmi}). Keep striving toward your ${profile?.targetWeight || 'target'} kg goal!`,
        'progress'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Log weight error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.logMeasurement({
        date: weightDate,
        chestCm: chestCm ? Number(chestCm) : undefined,
        waistCm: waistCm ? Number(waistCm) : undefined,
        hipsCm: hipsCm ? Number(hipsCm) : undefined,
        armsCm: armsCm ? Number(armsCm) : undefined,
        thighsCm: thighsCm ? Number(thighsCm) : undefined,
      });
      sendLocalNotification(
        'Body Measurements Recorded 📐',
        'Updated your physique circumference data successfully.',
        'progress'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Log measurements error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Track Weight & Body Metrics"
      subtitle="Consistent weekly weigh-ins give accurate bio-feedback trends"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('weight')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'weight'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Body Weight</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('measurements')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'measurements'
                ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Circumferences (cm)</span>
          </button>
        </div>

        {activeTab === 'weight' ? (
          <form onSubmit={handleSaveWeight} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Weigh-In Date
                </label>
                <input
                  type="date"
                  required
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="250"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-neutral-900 dark:text-neutral-100 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Context / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Morning weighed on empty stomach"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Weight</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveMeasurements} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Chest (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  placeholder="e.g. 96"
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  placeholder="e.g. 82"
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Hips (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  placeholder="e.g. 98"
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Arms / Biceps (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={armsCm}
                  onChange={(e) => setArmsCm(e.target.value)}
                  placeholder="e.g. 34"
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Measurements</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
