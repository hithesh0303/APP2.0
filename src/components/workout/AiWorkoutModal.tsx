import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Dumbbell, Sparkles, Clock, CheckCircle2, Play } from 'lucide-react';
import { WorkoutTemplate } from '../../types';

interface AiWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkoutGenerated: (workout: WorkoutTemplate) => void;
}

export const AiWorkoutModal: React.FC<AiWorkoutModalProps> = ({
  isOpen,
  onClose,
  onWorkoutGenerated,
}) => {
  const { profile } = useAuth();
  const { sendLocalNotification } = useNotifications();

  const [durationMinutes, setDurationMinutes] = useState(profile?.availableWorkoutTime || 25);
  const [location, setLocation] = useState<'home' | 'gym' | 'outdoor'>(profile?.workoutPreference || 'home');
  const [equipmentList, setEquipmentList] = useState<string[]>(profile?.availableEquipment || ['Bodyweight', 'Dumbbells']);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkoutTemplate | null>(null);

  const toggleEquipment = (eq: string) => {
    setEquipmentList(prev => (prev.includes(eq) ? prev.filter(x => x !== eq) : [...prev, eq]));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await api.generateWorkout({
        durationMinutes: Number(durationMinutes),
        location,
        equipment: equipmentList,
        notes,
      });

      // Save to database
      const saved = await api.createWorkoutTemplate(generated);
      setResult(saved);
      sendLocalNotification('AI Routine Generated 🏋️', `Created "${saved.title}" (${saved.durationMinutes} mins).`, 'workout');
    } catch (err) {
      console.error('Generate workout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartImmediately = () => {
    if (result) {
      onWorkoutGenerated(result);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="FitAI Dynamic Workout Architect"
      subtitle="Custom exercise sequencing calibrated to your available equipment & time"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {!result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Location
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['home', 'gym', 'outdoor'] as const).map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocation(loc)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-semibold capitalize border transition-all ${
                        location === loc
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 25, 35, 45].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDurationMinutes(m)}
                      className={`py-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                        durationMinutes === m
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {m}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Available Equipment
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Bench'].map((eq) => {
                  const isSel = equipmentList.includes(eq);
                  return (
                    <button
                      key={eq}
                      type="button"
                      onClick={() => toggleEquipment(eq)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSel
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      {isSel ? '✓ ' : '+ '}
                      {eq}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Specific Focus / Constraints (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Core & upper body emphasis, gentle on knees"
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
              />
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleGenerate}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Gemini AI Designing Optimum Workout Split...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Customized Workout</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 rounded-2xl space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  Ready to Train • {result.durationMinutes} Mins
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">{result.title}</h3>
                <p className="text-xs text-neutral-500">{result.goal} • ~{result.caloriesBurnedEstimate} kcal</p>
              </div>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {result.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{ex.name}</span>
                    <div className="text-[10px] text-neutral-500">
                      {ex.muscleGroup} • {ex.equipment}
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {ex.sets} × {ex.reps > 0 ? `${ex.reps} reps` : `${ex.durationSec}s`}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleStartImmediately}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>Start Workout Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
