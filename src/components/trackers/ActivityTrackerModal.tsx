import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Footprints, Flame, Timer, Compass, CheckCircle2 } from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';

interface ActivityTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const ActivityTrackerModal: React.FC<ActivityTrackerModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const { profile } = useAuth();
  const { sendLocalNotification } = useNotifications();

  const [steps, setSteps] = useState('6500');
  const [distanceKm, setDistanceKm] = useState('4.8');
  const [activeMinutes, setActiveMinutes] = useState('45');
  const [caloriesBurned, setCaloriesBurned] = useState('260');
  const [loading, setLoading] = useState(false);

  const stepGoal = profile?.stepGoal || 8000;

  useEffect(() => {
    if (isOpen) {
      api.getActivity().then(act => {
        if (act) {
          setSteps(String(act.steps));
          setDistanceKm(String(act.distanceKm));
          setActiveMinutes(String(act.activeMinutes));
          setCaloriesBurned(String(act.caloriesBurned));
        }
      }).catch(err => console.warn('Activity fetch err:', err));
    }
  }, [isOpen]);

  const handleStepChange = (val: string) => {
    setSteps(val);
    const num = Number(val) || 0;
    setDistanceKm((Math.round(num * 0.00076 * 10) / 10).toFixed(1));
    setActiveMinutes(String(Math.round(num / 100)));
    setCaloriesBurned(String(Math.round(num * 0.04)));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.logActivity({
        steps: Number(steps),
        distanceKm: Number(distanceKm),
        activeMinutes: Number(activeMinutes),
        caloriesBurned: Number(caloriesBurned),
      });
      sendLocalNotification(
        'Activity Updated 🚶',
        `Logged ${Number(steps).toLocaleString()} steps (~${distanceKm} km). Great daily movement!`,
        'workout'
      );
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Save activity error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Steps & NEAT Activity"
      subtitle={`Goal: ${stepGoal.toLocaleString()} steps (~${(stepGoal * 0.00076).toFixed(1)} km)`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Progress Display */}
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <Footprints className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">
                {Number(steps).toLocaleString()} / {stepGoal.toLocaleString()} steps
              </span>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              {Math.min(100, Math.round((Number(steps) / stepGoal) * 100))}%
            </span>
          </div>
          <ProgressBar value={Number(steps)} max={stepGoal} colorClass="bg-emerald-500" heightClass="h-2" />
        </div>

        {/* Form Inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Step Count
            </label>
            <input
              type="number"
              min="0"
              step="100"
              value={steps}
              onChange={(e) => handleStepChange(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-base font-bold text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl text-center">
              <Compass className="w-4 h-4 mx-auto text-sky-500 mb-1" />
              <input
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="w-full text-center bg-transparent font-bold text-sm text-neutral-900 dark:text-neutral-100 outline-none"
              />
              <span className="text-[10px] text-neutral-500">Distance (km)</span>
            </div>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl text-center">
              <Timer className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <input
                type="number"
                value={activeMinutes}
                onChange={(e) => setActiveMinutes(e.target.value)}
                className="w-full text-center bg-transparent font-bold text-sm text-neutral-900 dark:text-neutral-100 outline-none"
              />
              <span className="text-[10px] text-neutral-500">Active Mins</span>
            </div>

            <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200 dark:border-neutral-700 rounded-xl text-center">
              <Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" />
              <input
                type="number"
                value={caloriesBurned}
                onChange={(e) => setCaloriesBurned(e.target.value)}
                className="w-full text-center bg-transparent font-bold text-sm text-neutral-900 dark:text-neutral-100 outline-none"
              />
              <span className="text-[10px] text-neutral-500">NEAT kcal</span>
            </div>
          </div>
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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Activity</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
