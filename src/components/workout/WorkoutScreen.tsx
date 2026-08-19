import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { WorkoutTemplate, WorkoutHistory } from '../../types';
import { ActiveWorkoutPlayer } from './ActiveWorkoutPlayer';
import { AiWorkoutModal } from './AiWorkoutModal';
import {
  Dumbbell,
  Play,
  Sparkles,
  Flame,
  Clock,
  History,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

export const WorkoutScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'routines' | 'history'>('routines');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [activeSessionWorkout, setActiveSessionWorkout] = useState<WorkoutTemplate | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await api.getWorkoutTemplates(selectedCategory, selectedLevel);
      setTemplates(data);
    } catch (err) {
      console.error('Fetch templates error:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await api.getWorkoutHistory();
      setHistory(data);
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [selectedCategory, selectedLevel]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab]);

  return (
    <div className="space-y-6 pb-20" id="workout-screen">
      {/* Active Live Session Player */}
      {activeSessionWorkout && (
        <ActiveWorkoutPlayer
          workout={activeSessionWorkout}
          onClose={() => setActiveSessionWorkout(null)}
          onCompleted={() => {
            setActiveSessionWorkout(null);
            loadHistory();
            setActiveTab('history');
          }}
        />
      )}

      {/* Top Banner Navigation */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl">
        <button
          onClick={() => setActiveTab('routines')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'routines'
              ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <Dumbbell className="w-3.5 h-3.5" />
          <span>Training Routines</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'history'
              ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Completed History ({history.length})</span>
        </button>
      </div>

      {activeTab === 'routines' ? (
        <div className="space-y-5">
          {/* AI Generator Action Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-3xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Workout Architect</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">Need a quick custom workout?</h3>
              <p className="text-xs text-emerald-100 max-w-sm">
                Generate a routine tailored to your specific time, mood, and available equipment.
              </p>
            </div>
            <button
              type="button"
              id="btn-ai-generate-workout"
              onClick={() => setIsAiModalOpen(true)}
              className="py-2.5 px-5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl text-xs font-bold shadow-md transition-all shrink-0 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Create AI Workout</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Category tabs */}
            <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl gap-1">
              {[
                { id: 'all', label: 'All Routines' },
                { id: 'home', label: '🏠 Home' },
                { id: 'gym', label: '🏋️ Gym' },
                { id: 'outdoor', label: '🌳 Outdoor' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Level filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 outline-none"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Workout Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((workout) => (
              <div
                key={workout.id}
                className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4 hover:border-emerald-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                      {workout.fitnessLevel} • {workout.category}
                    </span>
                    <div className="flex items-center space-x-2 text-xs text-neutral-500 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{workout.durationMinutes}m</span>
                      <span>•</span>
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>~{workout.caloriesBurnedEstimate} kcal</span>
                    </div>
                  </div>

                  <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{workout.title}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{workout.goal}</p>

                  {/* Exercises mini preview */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center space-x-1">
                      <Layers className="w-3 h-3" />
                      <span>{workout.exercises.length} Exercises Sequence:</span>
                    </span>
                    <div className="space-y-1">
                      {workout.exercises.slice(0, 3).map((ex, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs text-neutral-700 dark:text-neutral-300 px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg"
                        >
                          <span>{ex.name}</span>
                          <span className="font-mono text-neutral-500">
                            {ex.sets} × {ex.reps > 0 ? `${ex.reps} reps` : `${ex.durationSec}s`}
                          </span>
                        </div>
                      ))}
                      {workout.exercises.length > 3 && (
                        <p className="text-[10px] text-neutral-400 pl-2">
                          +{workout.exercises.length - 3} more exercises
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSessionWorkout(workout)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 shadow-xs transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Active Session</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* HISTORY TAB */
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Workout Log History</h3>
            <span className="text-xs text-neutral-500">
              Total sessions: <strong>{history.length}</strong>
            </span>
          </div>

          {history.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 text-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl">
              No workouts logged yet. Start a routine to begin building your consistency streak!
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((hist) => (
                <div
                  key={hist.id}
                  className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-between shadow-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {hist.workoutTitle}
                      </h4>
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 pl-6">
                      {new Date(hist.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • {hist.exercisesCompleted}/{hist.totalExercises} exercises completed
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {hist.durationMinutes} mins
                    </div>
                    <div className="text-[10px] text-neutral-500 font-medium">
                      ~{hist.caloriesBurned} kcal burned
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Workout Modal */}
      <AiWorkoutModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onWorkoutGenerated={(w) => {
          loadTemplates();
          setActiveSessionWorkout(w);
        }}
      />
    </div>
  );
};
