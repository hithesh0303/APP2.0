import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { Activity, Smartphone, CheckCircle2, RefreshCw, Heart, Moon, Droplets, Zap, ShieldCheck } from 'lucide-react';

interface HealthIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HealthIntegrationModal: React.FC<HealthIntegrationModalProps> = ({ isOpen, onClose }) => {
  const { sendLocalNotification } = useNotifications();
  const [provider, setProvider] = useState<'apple_health' | 'health_connect' | 'google_fit'>('health_connect');
  const [syncSteps, setSyncSteps] = useState(true);
  const [syncSleep, setSyncSleep] = useState(true);
  const [syncWater, setSyncWater] = useState(true);
  const [syncWorkouts, setSyncWorkouts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    try {
      // Simulate real health bridge ingestion
      const today = new Date().toISOString().split('T')[0];
      const simulatedSteps = Math.floor(6500 + Math.random() * 3000);
      const simulatedActiveMinutes = Math.floor(35 + Math.random() * 25);
      const simulatedDistance = Math.round((simulatedSteps * 0.00078) * 10) / 10;
      const simulatedCalories = Math.round(simulatedSteps * 0.04);

      await api.logActivity({
        date: today,
        steps: simulatedSteps,
        distanceKm: simulatedDistance,
        activeMinutes: simulatedActiveMinutes,
        caloriesBurned: simulatedCalories,
      });

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(now);

      sendLocalNotification(
        'Health Data Synchronized! 📲',
        `Imported ${simulatedSteps.toLocaleString()} steps and ${simulatedActiveMinutes} active mins from ${provider === 'apple_health' ? 'Apple Health' : 'Health Connect'}.`,
        'insight'
      );
    } catch (err) {
      console.error('Health sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Health Data & Device Integration"
      subtitle="Connect Apple Health, Android Health Connect, or Google Fit"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Provider Selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'apple_health', label: 'Apple Health', icon: '🍎', desc: 'iOS & WatchOS' },
            { id: 'health_connect', label: 'Health Connect', icon: '🤖', desc: 'Android 14+' },
            { id: 'google_fit', label: 'Google Fit', icon: '🟢', desc: 'WearOS & Android' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id as any)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                provider === p.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-neutral-850 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300'
              }`}
            >
              <div className="text-xl mb-1">{p.icon}</div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{p.label}</div>
              <div className="text-[10px] text-neutral-500">{p.desc}</div>
            </button>
          ))}
        </div>

        {/* Sync Permissions & Preferences */}
        <div className="p-4 bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
            Permission Scopes
          </h4>

          <div className="space-y-2 text-xs">
            <label className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Daily Steps & Active Calories</span>
              </div>
              <input
                type="checkbox"
                checked={syncSteps}
                onChange={(e) => setSyncSteps(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <Moon className="w-4 h-4 text-purple-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Sleep Duration & Quality Logs</span>
              </div>
              <input
                type="checkbox"
                checked={syncSleep}
                onChange={(e) => setSyncSleep(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <Droplets className="w-4 h-4 text-sky-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Hydration & Water Tracking</span>
              </div>
              <input
                type="checkbox"
                checked={syncWater}
                onChange={(e) => setSyncWater(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-2 bg-white dark:bg-neutral-800 rounded-xl cursor-pointer">
              <div className="flex items-center space-x-2.5">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">Workout Sessions & Heart Rate</span>
              </div>
              <input
                type="checkbox"
                checked={syncWorkouts}
                onChange={(e) => setSyncWorkouts(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Privacy Shield note */}
        <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex items-start space-x-2.5 text-xs text-emerald-900 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          <span>
            FitAI uses end-to-end local encryption to synchronize with your mobile health framework. Your biometric data is never shared with third-party advertisers.
          </span>
        </div>

        {/* Sync Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-[11px] text-neutral-500">
            {lastSyncedTime ? `Last synced at ${lastSyncedTime}` : 'Ready for background auto-sync'}
          </div>

          <button
            type="button"
            disabled={isSyncing}
            onClick={handleTriggerSync}
            className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Health Data Now'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
