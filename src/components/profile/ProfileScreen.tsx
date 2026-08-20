import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  User,
  Settings,
  Scale,
  Flame,
  Target,
  Moon,
  Sun,
  Bell,
  LogOut,
  Shield,
  CheckCircle2,
  Sparkles,
  Calculator,
  Share2,
  UserPlus,
  Activity
} from 'lucide-react';
import { HealthIntegrationModal } from './HealthIntegrationModal';

interface ProfileScreenProps {
  onOpenReminders: () => void;
  onOpenAuth?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenReminders, onOpenAuth }) => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { sendLocalNotification } = useNotifications();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'FitAI – Personal Fitness & Nutrition Coach',
          text: 'Check out FitAI for AI food scanning, personalized meal plans, and workout routines!',
          url: shareUrl,
        });
      } catch (err) {
        // Ignored if user dismissed share sheet
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      sendLocalNotification('Link Copied!', 'App link copied to clipboard. Share it with your friends!', 'insight');
    }
  };

  // Profile Form state
  const [age, setAge] = useState(profile?.age || 26);
  const [gender, setGender] = useState(profile?.gender || 'male');
  const [heightCm, setHeightCm] = useState(profile?.height || (profile as any)?.heightCm || 175);
  const [weight, setWeight] = useState(profile?.weight || 72);
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeight || 68);
  const [activityLevel, setActivityLevel] = useState(profile?.activityLevel || 'moderate');
  const [goal, setGoal] = useState(profile?.fitnessGoal || (profile as any)?.goal || 'lose_fat');
  const [dietaryPreference, setDietaryPreference] = useState(profile?.diet || (profile as any)?.dietaryPreference || 'vegetarian');
  const [dailyBudget, setDailyBudget] = useState(profile?.dailyBudget || 250);

  const [saving, setSaving] = useState(false);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        age: Number(age),
        gender,
        height: Number(heightCm),
        weight: Number(weight),
        targetWeight: Number(targetWeight),
        activityLevel,
        fitnessGoal: goal as any,
        diet: dietaryPreference as any,
        dailyBudget: Number(dailyBudget),
        onboardingCompleted: true,
      });

      sendLocalNotification(
        'Profile & Plan Recalibrated! 🎯',
        `New targets calculated: ${profile?.dailyCalorieTarget || 2000} kcal, ${profile?.proteinTarget || 120}g protein.`,
        'insight'
      );
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const loadAdminMetrics = async () => {
    try {
      const stats = await api.getAdminStats();
      setAdminStats(stats);
      setShowAdmin(true);
    } catch (err) {
      console.error('Admin stats error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto" id="profile-screen">
      {/* Header Profile Summary */}
      <div className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{user?.name}</h2>
            <p className="text-xs text-neutral-500">{user?.email}</p>
            <div className="inline-flex items-center space-x-1 mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg">
              <span>Goal: {(profile?.fitnessGoal || (profile as any)?.goal || 'lose_fat').replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleShare}
            className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-semibold"
            title="Share App with Friends"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share App'}</span>
          </button>
          {onOpenAuth && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="p-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors text-neutral-700 dark:text-neutral-300 flex items-center space-x-1 text-xs font-semibold"
              title="Switch or Register Account"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Switch</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors text-neutral-700 dark:text-neutral-300"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
          <button
            type="button"
            onClick={logout}
            className="p-2.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calculated Metabolic Targets Card */}
      <div className="p-5 bg-gradient-to-br from-neutral-900 to-neutral-950 text-white border border-neutral-800 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Mifflin-St Jeor Metabolic Engine Output</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
            <span className="text-[10px] text-neutral-400 uppercase">Basal Metabolic Rate</span>
            <div className="text-base font-bold text-white mt-0.5">{profile?.bmr || 1650} kcal</div>
          </div>
          <div className="p-3 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
            <span className="text-[10px] text-neutral-400 uppercase">Maintenance (TDEE)</span>
            <div className="text-base font-bold text-white mt-0.5">{profile?.tdee || 2200} kcal</div>
          </div>
          <div className="p-3 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
            <span className="text-[10px] text-emerald-400 uppercase">Calorie Target</span>
            <div className="text-base font-bold text-emerald-400 mt-0.5">{profile?.dailyCalorieTarget || 2000} kcal</div>
          </div>
          <div className="p-3 bg-neutral-800/80 rounded-2xl border border-neutral-700/60">
            <span className="text-[10px] text-sky-400 uppercase">Protein Target</span>
            <div className="text-base font-bold text-sky-400 mt-0.5">{profile?.proteinTarget || 120}g / day</div>
          </div>
        </div>
      </div>

      {/* Bio-Metrics & Lifestyle Form */}
      <form onSubmit={handleSaveProfile} className="p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
          <User className="w-4 h-4 text-emerald-600" />
          <span>Biometric & Goal Preferences</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Age</label>
            <input
              type="number"
              min="14"
              max="90"
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Height (cm)</label>
            <input
              type="number"
              min="120"
              max="240"
              required
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Current Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="250"
              required
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Target Goal Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              min="30"
              max="250"
              required
              value={targetWeight}
              onChange={(e) => setTargetWeight(Number(e.target.value))}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-bold text-neutral-900 dark:text-neutral-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Diet Type</label>
            <select
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none"
            >
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
              <option value="jain">Jain</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Fitness Goal</label>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none"
            >
              <option value="fat_loss">Fat Loss (-500 kcal deficit)</option>
              <option value="muscle_gain">Muscle Building (+300 kcal surplus)</option>
              <option value="maintenance">Weight Maintenance</option>
              <option value="endurance">Endurance & Athletic Performance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Activity Level</label>
            <select
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.target.value as any)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 outline-none"
            >
              <option value="sedentary">Sedentary (Desk job, little movement)</option>
              <option value="lightly_active">Lightly Active (1-3 workout days/wk)</option>
              <option value="moderately_active">Moderately Active (3-5 workout days/wk)</option>
              <option value="very_active">Very Active (6-7 intense training days)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Recalibrate & Save Targets</span>
          </button>
        </div>
      </form>

      {/* Routine Reminders, Health Connect & Admin Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Habit Reminders</h3>
            </div>
            <button
              type="button"
              onClick={onOpenReminders}
              className="py-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold"
            >
              Manage
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Set custom alert times for morning hydration, pre-workout, meals, and sleep routines.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Health Sync</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsHealthModalOpen(true)}
              className="py-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold"
            >
              Connect
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Link Apple Health, Android Health Connect, or Google Fit for automatic step & sleep imports.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Diagnostics</h3>
            </div>
            <button
              type="button"
              onClick={loadAdminMetrics}
              className="py-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-50 text-indigo-600 rounded-xl text-xs font-semibold"
            >
              Inspect
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            View total system records, food catalog count, workout templates, and active user profiles.
          </p>
        </div>
      </div>

      {/* Health Integration Modal */}
      <HealthIntegrationModal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
      />

      {/* Admin Stats Modal Preview */}
      {showAdmin && adminStats && (
        <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
              System Store Diagnostics (data_fitai_store.json)
            </h4>
            <button
              type="button"
              onClick={() => setShowAdmin(false)}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl">
              <span className="text-[10px] text-neutral-400">Total Users</span>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{adminStats.totalUsers}</div>
            </div>
            <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl">
              <span className="text-[10px] text-neutral-400">Food Items</span>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{adminStats.totalFoodItems}</div>
            </div>
            <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl">
              <span className="text-[10px] text-neutral-400">Routines</span>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{adminStats.totalWorkoutTemplates}</div>
            </div>
            <div className="p-2 bg-white dark:bg-neutral-900 rounded-xl">
              <span className="text-[10px] text-neutral-400">Food Logs</span>
              <div className="font-bold text-neutral-900 dark:text-neutral-100">{adminStats.totalFoodLogs}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
