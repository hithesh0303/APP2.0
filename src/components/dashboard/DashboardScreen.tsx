import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ProgressBar } from '../common/ProgressBar';
import { WaterTrackerModal } from '../trackers/WaterTrackerModal';
import { SleepTrackerModal } from '../trackers/SleepTrackerModal';
import { WeightTrackerModal } from '../trackers/WeightTrackerModal';
import { ActivityTrackerModal } from '../trackers/ActivityTrackerModal';
import { ScanFoodModal } from '../food/ScanFoodModal';
import {
  Flame,
  Droplets,
  Footprints,
  Moon,
  Scale,
  Sparkles,
  Play,
  Plus,
  Utensils,
  Dumbbell,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Camera
} from 'lucide-react';
import { WorkoutTemplate } from '../../types';

interface DashboardScreenProps {
  onNavigate: (tab: string) => void;
  onStartWorkout: (workout: WorkoutTemplate) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigate,
  onStartWorkout,
}) => {
  const { user, profile } = useAuth();
  const { sendLocalNotification } = useNotifications();

  const [todayDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<any>(null);
  const [waterData, setWaterData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [sleepData, setSleepData] = useState<any>(null);
  const [insight, setInsight] = useState<any>(null);
  const [featuredWorkout, setFeaturedWorkout] = useState<WorkoutTemplate | null>(null);

  // Modals
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isScanFoodOpen, setIsScanFoodOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadAllDashboardData = async () => {
    setLoading(true);
    try {
      const [foodRes, waterRes, actRes, sleepRes, tmplRes, aiInsight] = await Promise.allSettled([
        api.getDailyFoodLogs(todayDate),
        api.getWaterLog(todayDate),
        api.getActivity(todayDate),
        api.getSleepLogs(),
        api.getWorkoutTemplates(),
        api.getDailyInsight(),
      ]);

      if (foodRes.status === 'fulfilled') setDailyData(foodRes.value);
      if (waterRes.status === 'fulfilled') setWaterData(waterRes.value);
      if (actRes.status === 'fulfilled') setActivityData(actRes.value);
      if (sleepRes.status === 'fulfilled' && sleepRes.value.length > 0) setSleepData(sleepRes.value[0]);
      if (tmplRes.status === 'fulfilled' && tmplRes.value.length > 0) setFeaturedWorkout(tmplRes.value[0]);
      if (aiInsight.status === 'fulfilled') setInsight(aiInsight.value);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDashboardData();
  }, []);

  const handleQuickAddWater = async () => {
    try {
      const res = await api.logWater(250, todayDate);
      setWaterData(res);
      sendLocalNotification('Water Logged 💧', `Added 250ml. Total today: ${res.currentAmountMl}ml / ${res.targetMl}ml.`, 'water');
    } catch (err) {
      console.error('Quick water error:', err);
    }
  };

  // Calculations
  const targetCalories = profile?.dailyCalorieTarget || 2000;
  const consumedCalories = dailyData?.totals?.calories || 0;
  const burnedCalories = activityData?.caloriesBurned || 0;
  const remainingCalories = Math.max(0, targetCalories - consumedCalories + burnedCalories);

  const proteinTarget = profile?.proteinTarget || 120;
  const consumedProtein = dailyData?.totals?.protein || 0;

  const carbsTarget = profile?.carbsTarget || 220;
  const consumedCarbs = dailyData?.totals?.carbs || 0;

  const fatTarget = profile?.fatTarget || 60;
  const consumedFat = dailyData?.totals?.fat || 0;

  const waterTarget = waterData?.targetMl || 3000;
  const waterCurrent = waterData?.currentAmountMl || 0;

  const stepsTarget = profile?.stepGoal || 8000;
  const stepsCurrent = activityData?.steps || 0;

  return (
    <div className="space-y-6 pb-20" id="dashboard-screen">
      {/* Daily Coach Insight Header Banner */}
      <div className="p-5 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>FitAI Smart Metabolic Brief</span>
            </span>
            <h2 className="text-base font-bold text-white">
              {insight?.tipTitle || `Good day, ${user?.name || 'Athlete'}!`}
            </h2>
            <p className="text-xs text-emerald-100 max-w-xl leading-relaxed">
              {insight?.insight ||
                `You're on track with your ${profile?.goal?.replace('_', ' ') || 'fitness'} roadmap. Fuel up with balanced macros and prioritize your daily movement.`}
            </p>
          </div>
          <button
            type="button"
            onClick={loadAllDashboardData}
            title="Refresh AI Brief"
            className="p-2 text-emerald-200 hover:text-white bg-emerald-800/60 rounded-xl transition-colors shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="pt-1 flex items-center justify-between border-t border-emerald-500/40 relative z-10">
          <span className="text-[11px] text-emerald-200 font-medium">Have questions on your workout, meals, or macros?</span>
          <button
            type="button"
            id="btn-launch-fitai-coach"
            onClick={() => onNavigate('coach')}
            className="py-1.5 px-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-transform active:scale-95 shadow-sm shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Launch FitAI Coach</span>
          </button>
        </div>
      </div>

      {/* Main Calories & Macros Adherence Hub */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-neutral-400">Calories Remaining</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
                {remainingCalories}
              </span>
              <span className="text-xs text-neutral-500 font-medium">kcal</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              id="btn-dash-scan-food"
              onClick={() => setIsScanFoodOpen(true)}
              className="py-2 px-3.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors border border-emerald-200 dark:border-emerald-800"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan Food</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('food')}
              className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Meal</span>
            </button>
          </div>
        </div>

        {/* Calorie Progress Bar */}
        <ProgressBar
          value={consumedCalories}
          max={targetCalories}
          colorClass="bg-emerald-500"
          heightClass="h-3"
        />

        {/* Macro breakdown columns */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">Protein</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {Math.round(consumedProtein)} / {proteinTarget}g
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (consumedProtein / proteinTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-sky-600 dark:text-sky-400">Carbs</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {Math.round(consumedCarbs)} / {carbsTarget}g
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (consumedCarbs / carbsTarget) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl">
            <span className="text-[10px] uppercase font-semibold text-amber-600 dark:text-amber-400">Fats</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
              {Math.round(consumedFat)} / {fatTarget}g
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, (consumedFat / fatTarget) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Tracker Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Water Tracker Card */}
        <div
          onClick={() => setIsWaterModalOpen(true)}
          className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs cursor-pointer hover:border-sky-400 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-xl">
              <Droplets className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400">
              {Math.round((waterCurrent / waterTarget) * 100)}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400">Water Intake</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {(waterCurrent / 1000).toFixed(1)} / {(waterTarget / 1000).toFixed(1)} L
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickAddWater();
            }}
            className="w-full py-1.5 bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>+250ml</span>
          </button>
        </div>

        {/* 2. Steps / Activity Card */}
        <div
          onClick={() => setIsActivityModalOpen(true)}
          className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs cursor-pointer hover:border-emerald-400 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Footprints className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {Math.min(100, Math.round((stepsCurrent / stepsTarget) * 100))}%
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400">Daily Steps</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {stepsCurrent.toLocaleString()} / {stepsTarget.toLocaleString()}
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 font-medium">
            ~{activityData?.distanceKm || (stepsCurrent * 0.00076).toFixed(1)} km • {activityData?.caloriesBurned || 0} kcal
          </div>
        </div>

        {/* 3. Sleep & Recovery Card */}
        <div
          onClick={() => setIsSleepModalOpen(true)}
          className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs cursor-pointer hover:border-indigo-400 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Moon className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold uppercase text-indigo-600 dark:text-indigo-400">
              {sleepData?.quality || 'Good'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400">Sleep Duration</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {sleepData?.hoursSlept || 7.5} Hours
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 font-medium">
            {sleepData?.bedtime || '23:00'} → {sleepData?.wakeTime || '07:00'}
          </div>
        </div>

        {/* 4. Weight Tracker Card */}
        <div
          onClick={() => setIsWeightModalOpen(true)}
          className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs cursor-pointer hover:border-emerald-400 transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Scale className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Goal: {profile?.targetWeight || 65}kg
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400">Current Weight</span>
            <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {profile?.weight || 70} kg
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 font-medium">
            BMI: {profile?.bmi || 22.5}
          </div>
        </div>
      </div>

      {/* Featured Routine & Meals Quick Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Workout Quick Card */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Recommended Workout</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('workout')}
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center"
            >
              <span>Explore</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {featuredWorkout ? (
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl space-y-2 border border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {featuredWorkout.category} • {featuredWorkout.fitnessLevel}
                </span>
                <span className="text-xs text-neutral-500 font-medium">
                  {featuredWorkout.durationMinutes}m • ~{featuredWorkout.caloriesBurnedEstimate} kcal
                </span>
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{featuredWorkout.title}</h4>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">{featuredWorkout.goal}</p>

              <button
                type="button"
                onClick={() => onStartWorkout(featuredWorkout)}
                className="w-full mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Training Session</span>
              </button>
            </div>
          ) : null}
        </div>

        {/* Food Diary Snapshot */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Utensils className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Today's Meals Logged</h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('food')}
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {dailyData?.logs?.length > 0 ? (
              dailyData.logs.slice(0, 3).map((l: any) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs"
                >
                  <div>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{l.foodName}</span>
                    <span className="text-[10px] text-neutral-400 ml-1.5">({l.mealType})</span>
                  </div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-200">{l.calories} kcal</span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl">
                No food logged yet today. Use the camera scanner or food search to track your calories!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <WaterTrackerModal
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        onUpdated={loadAllDashboardData}
      />
      <SleepTrackerModal
        isOpen={isSleepModalOpen}
        onClose={() => setIsSleepModalOpen(false)}
        onUpdated={loadAllDashboardData}
      />
      <WeightTrackerModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        onUpdated={loadAllDashboardData}
      />
      <ActivityTrackerModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onUpdated={loadAllDashboardData}
      />
      <ScanFoodModal
        isOpen={isScanFoodOpen}
        onClose={() => setIsScanFoodOpen(false)}
        onLogged={loadAllDashboardData}
      />
    </div>
  );
};
