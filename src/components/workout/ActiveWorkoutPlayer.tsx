import React, { useState, useEffect } from 'react';
import { WorkoutTemplate, ExerciseItem } from '../../types';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  Play,
  Pause,
  SkipForward,
  CheckCircle2,
  Timer,
  Flame,
  Volume2,
  VolumeX,
  X,
  Sparkles
} from 'lucide-react';
import { ProgressBar } from '../common/ProgressBar';

interface ActiveWorkoutPlayerProps {
  workout: WorkoutTemplate;
  onClose: () => void;
  onCompleted: () => void;
}

export const ActiveWorkoutPlayer: React.FC<ActiveWorkoutPlayerProps> = ({
  workout,
  onClose,
  onCompleted,
}) => {
  const { sendLocalNotification } = useNotifications();

  const [currentExIndex, setCurrentExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Overall workout tracking
  const [totalElapsedTimeSec, setTotalElapsedTimeSec] = useState(0);
  const [completedExercisesCount, setCompletedExercisesCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentExercise: ExerciseItem = workout.exercises[currentExIndex] || workout.exercises[0];
  const totalExercises = workout.exercises.length;

  // Sound cue synthesizer
  const playBeep = (freq: number = 600, durationMs: number = 150) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + durationMs / 1000);
    } catch {
      // Audio context might be restricted before gesture
    }
  };

  // Main active timer interval
  useEffect(() => {
    if (isPaused || isFinished) return;

    const interval = setInterval(() => {
      setTotalElapsedTimeSec((prev) => prev + 1);

      if (isResting) {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            playBeep(880, 250);
            setIsResting(false);
            return 0;
          }
          if (prev <= 4) playBeep(520, 100);
          return prev - 1;
        });
      } else if (currentExercise?.durationSec) {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            handleCompleteSet();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isResting, currentExercise, isFinished]);

  const handleCompleteSet = () => {
    playBeep(700, 200);

    if (currentSet < currentExercise.sets) {
      // Next set with rest
      setCurrentSet((s) => s + 1);
      setIsResting(true);
      setTimerSeconds(currentExercise.restSec || 30);
    } else {
      // Completed all sets for this exercise
      setCompletedExercisesCount((c) => c + 1);

      if (currentExIndex + 1 < totalExercises) {
        setCurrentExIndex((idx) => idx + 1);
        setCurrentSet(1);
        setIsResting(true);
        setTimerSeconds(currentExercise.restSec || 45);
      } else {
        // Finished full workout!
        setIsFinished(true);
        playBeep(920, 400);
      }
    }
  };

  const handleSkipExercise = () => {
    if (currentExIndex + 1 < totalExercises) {
      setCurrentExIndex((idx) => idx + 1);
      setCurrentSet(1);
      setIsResting(false);
      setTimerSeconds(0);
    } else {
      setIsFinished(true);
    }
  };

  const handleSaveAndExit = async () => {
    setIsSaving(true);
    const durationMins = Math.max(1, Math.round(totalElapsedTimeSec / 60));
    const calculatedCals = Math.round(durationMins * 7.5);

    try {
      await api.logWorkoutHistory({
        workoutId: workout.id,
        workoutTitle: workout.title,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: durationMins,
        caloriesBurned: calculatedCals,
        exercisesCompleted: completedExercisesCount + 1,
        totalExercises: totalExercises,
        notes: `Completed active session with FitAI live coach`,
      });

      sendLocalNotification(
        'Workout Completed! 🏆',
        `Crushed ${workout.title}! ${durationMins} mins, ~${calculatedCals} kcal burned.`,
        'workout'
      );

      onCompleted();
    } catch (err) {
      console.error('Save workout error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 text-white flex flex-col justify-between overflow-hidden select-none" id="active-workout-player">
      {/* Top Header */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            Active Session • {workout.category.toUpperCase()}
          </span>
          <h2 className="text-base font-bold text-neutral-100">{workout.title}</h2>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800/80 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Are you sure you want to exit the current workout?')) onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white rounded-xl bg-neutral-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
        {!isFinished ? (
          <div className="space-y-6 w-full">
            {/* Progress Stepper */}
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-neutral-400">
                <span>
                  Exercise {currentExIndex + 1} of {totalExercises}
                </span>
                <span>{Math.round(((currentExIndex) / totalExercises) * 100)}% Complete</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentExIndex + 1) / totalExercises) * 100}%` }}
                />
              </div>
            </div>

            {/* Rest Mode or Active Exercise Mode */}
            {isResting ? (
              <div className="p-8 bg-neutral-800/60 border border-neutral-700 rounded-3xl space-y-3 animate-pulse">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Rest & Recover
                </span>
                <div className="text-6xl font-extrabold font-mono text-neutral-100">
                  {formatTimer(timerSeconds)}
                </div>
                <p className="text-xs text-neutral-400">
                  Next up: <strong>{currentExercise.name}</strong> (Set {currentSet}/{currentExercise.sets})
                </p>
                <button
                  type="button"
                  onClick={() => setIsResting(false)}
                  className="mt-2 py-1.5 px-4 bg-neutral-700 hover:bg-neutral-600 rounded-xl text-xs font-semibold text-neutral-200"
                >
                  Skip Rest ⏩
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-full text-xs font-semibold">
                  Target: {currentExercise.muscleGroup} • {currentExercise.equipment}
                </div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {currentExercise.name}
                </h1>

                {/* Sets and Reps indicator */}
                <div className="flex items-center justify-center space-x-6 py-2">
                  <div className="p-4 bg-neutral-800/80 rounded-2xl border border-neutral-700 w-32">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Current Set</span>
                    <div className="text-2xl font-black text-emerald-400">
                      {currentSet} / {currentExercise.sets}
                    </div>
                  </div>

                  <div className="p-4 bg-neutral-800/80 rounded-2xl border border-neutral-700 w-32">
                    <span className="text-[10px] text-neutral-400 uppercase font-semibold">Target Reps</span>
                    <div className="text-2xl font-black text-sky-400">
                      {currentExercise.reps > 0 ? `${currentExercise.reps} reps` : `${currentExercise.durationSec}s`}
                    </div>
                  </div>
                </div>

                {/* Form Instructions */}
                <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed bg-neutral-800/40 p-3 rounded-2xl border border-neutral-700/60">
                  💡 <strong>Form Tip:</strong> {currentExercise.instructions}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Finished Celebration Screen */
          <div className="p-8 bg-neutral-800/80 border border-emerald-500/40 rounded-3xl space-y-5 text-center max-w-sm">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Workout Crushed! 🔥</h2>
              <p className="text-xs text-neutral-400 mt-1">
                Outstanding effort! You completed all exercises with high intensity.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 py-2 text-center">
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-700">
                <span className="text-[10px] text-neutral-400">Total Duration</span>
                <div className="text-lg font-bold text-white">
                  {Math.round(totalElapsedTimeSec / 60)} mins
                </div>
              </div>
              <div className="p-3 bg-neutral-900 rounded-2xl border border-neutral-700">
                <span className="text-[10px] text-neutral-400">Burn Estimate</span>
                <div className="text-lg font-bold text-amber-400">
                  ~{Math.round((totalElapsedTimeSec / 60) * 7.5)} kcal
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAndExit}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-colors shadow-lg flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save & Complete Workout</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      {!isFinished && (
        <div className="px-6 py-5 border-t border-neutral-800 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
            <Timer className="w-4 h-4 text-emerald-400" />
            <span>{formatTimer(totalElapsedTimeSec)}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-2xl transition-colors"
            >
              {isPaused ? <Play className="w-5 h-5 text-emerald-400" /> : <Pause className="w-5 h-5" />}
            </button>

            <button
              type="button"
              onClick={handleCompleteSet}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-md transition-all active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Done Set {currentSet}</span>
            </button>

            <button
              type="button"
              onClick={handleSkipExercise}
              className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-2xl transition-colors"
              title="Skip Exercise"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
