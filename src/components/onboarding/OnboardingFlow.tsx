import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Scale,
  Target,
  Dumbbell,
  Utensils,
  Moon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Flame,
  Droplets,
  Footprints
} from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const { user, profile, updateProfile } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Form State
  const [name, setName] = useState(user?.name || '');
  const [age, setAge] = useState(profile?.age || 24);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(profile?.gender || 'male');
  const [height, setHeight] = useState(profile?.height || 175);
  const [weight, setWeight] = useState(profile?.weight || 72);
  const [targetWeight, setTargetWeight] = useState(profile?.targetWeight || 68);

  const [activityLevel, setActivityLevel] = useState<'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'>(
    profile?.activityLevel || 'moderate'
  );
  const [fitnessExperience, setFitnessExperience] = useState<'beginner' | 'intermediate' | 'advanced'>(
    profile?.fitnessExperience || 'beginner'
  );
  const [fitnessGoal, setFitnessGoal] = useState<'lose_fat' | 'gain_muscle' | 'maintain_weight' | 'improve_fitness' | 'improve_endurance' | 'build_strength'>(
    profile?.fitnessGoal || 'lose_fat'
  );

  const [workoutPreference, setWorkoutPreference] = useState<'home' | 'gym' | 'outdoor'>(profile?.workoutPreference || 'home');
  const [availableEquipment, setAvailableEquipment] = useState<string[]>(profile?.availableEquipment || ['Bodyweight', 'Dumbbells']);
  const [availableWorkoutTime, setAvailableWorkoutTime] = useState(profile?.availableWorkoutTime || 30);

  const [diet, setDiet] = useState<'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian' | 'other'>(profile?.diet || 'vegetarian');
  const [foodPreferences, setFoodPreferences] = useState<string[]>(profile?.foodPreferences || ['Indian', 'High Protein']);
  const [allergies, setAllergies] = useState<string[]>(profile?.allergies || []);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>(profile?.dislikedFoods || []);
  const [dailyBudget, setDailyBudget] = useState(profile?.dailyBudget || 250);

  const [sleepTime, setSleepTime] = useState(profile?.sleepTime || '23:00');
  const [wakeTime, setWakeTime] = useState(profile?.wakeTime || '07:00');

  // Preview Targets
  const [preview, setPreview] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate targets whenever key stats change
  useEffect(() => {
    const fetchCalculation = async () => {
      setIsCalculating(true);
      try {
        const res = await api.calculatePreview({
          age,
          gender,
          height,
          weight,
          activityLevel,
          fitnessGoal,
        });
        setPreview(res);
      } catch (err) {
        console.error('Target calculation error:', err);
      } finally {
        setIsCalculating(false);
      }
    };
    fetchCalculation();
  }, [age, gender, height, weight, activityLevel, fitnessGoal]);

  const toggleEquipment = (eq: string) => {
    setAvailableEquipment(prev => (prev.includes(eq) ? prev.filter(x => x !== eq) : [...prev, eq]));
  };

  const togglePreference = (pref: string) => {
    setFoodPreferences(prev => (prev.includes(pref) ? prev.filter(x => x !== pref) : [...prev, pref]));
  };

  const toggleAllergy = (allergy: string) => {
    setAllergies(prev => (prev.includes(allergy) ? prev.filter(x => x !== allergy) : [...prev, allergy]));
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: name || user?.name || 'Athlete',
        age: Number(age) || 24,
        gender: gender || 'male',
        height: Number(height) || 175,
        weight: Number(weight) || 72,
        targetWeight: Number(targetWeight) || 68,
        activityLevel: activityLevel || 'moderate',
        fitnessExperience: fitnessExperience || 'beginner',
        fitnessGoal: fitnessGoal || 'lose_fat',
        workoutPreference: workoutPreference || 'home',
        availableEquipment: availableEquipment || ['Bodyweight'],
        availableWorkoutTime: Number(availableWorkoutTime) || 30,
        diet: diet || 'vegetarian',
        foodPreferences: foodPreferences || [],
        allergies: allergies || [],
        dislikedFoods: dislikedFoods || [],
        dailyBudget: Number(dailyBudget) || 250,
        weeklyBudget: (Number(dailyBudget) || 250) * 7,
        sleepTime: sleepTime || '23:00',
        wakeTime: wakeTime || '07:00',
        onboardingCompleted: true,
      });

      // Also log initial weight point if possible
      try {
        await api.logWeight(Number(weight) || 72, new Date().toISOString().split('T')[0], 'Initial weight at onboarding');
      } catch (logErr) {
        console.warn('Initial weight log skipped:', logErr);
      }
    } catch (err) {
      console.error('Failed to save onboarding:', err);
    } finally {
      setIsSaving(false);
      onComplete();
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6" id="onboarding-flow">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Progress Bar & Header */}
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Personalized Plan Setup • Step {step} of {totalSteps}
            </span>
            <button
              type="button"
              onClick={onComplete}
              className="text-xs text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium underline"
            >
              Skip to Dashboard
            </button>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content with Motion */}
        <div className="p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <User className="w-5 h-5 text-emerald-500" />
                    <span>Let's get to know you</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Your baseline details help FitAI calibrate accurate metabolic and calorie formulas.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      What should we call you?
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Hithesh"
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="14"
                        max="95"
                        value={age}
                        onChange={(e) => setAge(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Biological Gender
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['male', 'female'] as const).map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setGender(g)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                              gender === g
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <Scale className="w-5 h-5 text-emerald-500" />
                    <span>Body Dimensions & Target</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    FitAI calculates your Body Mass Index (BMI) and healthy metabolic rates.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Height (cm)
                      </label>
                      <input
                        type="number"
                        min="100"
                        max="240"
                        value={height}
                        onChange={(e) => setHeight(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        Current Weight (kg)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="250"
                        step="0.5"
                        value={weight}
                        onChange={(e) => setWeight(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Target Goal Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="250"
                      step="0.5"
                      value={targetWeight}
                      onChange={(e) => setTargetWeight(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* Live BMI Indicator */}
                  {preview && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                          Current BMI
                        </span>
                        <div className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                          {preview.bmi} <span className="text-xs font-normal text-neutral-500">kg/m²</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded-lg text-xs font-bold">
                        {preview.bmiCategory}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Goals & Activity Level */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <span>Primary Goal & Lifestyle</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Choose the primary transformation you want to achieve.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Fitness Objective
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'lose_fat', label: '🔥 Lose Body Fat', desc: 'Caloric deficit' },
                      { id: 'gain_muscle', label: '💪 Build Muscle', desc: 'Hypertrophy & surplus' },
                      { id: 'maintain_weight', label: '⚖️ Maintain & Tone', desc: 'Body recomposition' },
                      { id: 'improve_endurance', label: '🏃 Improve Stamina', desc: 'Cardio & conditioning' },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setFitnessGoal(g.id as any)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          fitnessGoal === g.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-xs'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="font-semibold text-xs">{g.label}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">{g.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Daily Activity Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'sedentary', label: 'Sedentary', desc: 'Desk job, low movement' },
                      { id: 'moderate', label: 'Moderate', desc: '3-4 workouts / active week' },
                      { id: 'very_active', label: 'Very Active', desc: 'Daily sports / physical labor' },
                    ].map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => setActivityLevel(act.id as any)}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          activityLevel === act.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-100'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="font-semibold text-xs">{act.label}</div>
                        <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{act.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Workout Preferences & Equipment */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <Dumbbell className="w-5 h-5 text-emerald-500" />
                    <span>Workout Routine & Gear</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    We adapt training plans to your real surroundings and time.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Where do you work out?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'home', label: '🏠 Home' },
                      { id: 'gym', label: '🏋️ Gym' },
                      { id: 'outdoor', label: '🌳 Outdoor' },
                    ].map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWorkoutPreference(w.id as any)}
                        className={`py-2 px-3 rounded-xl text-center text-xs font-semibold border transition-all ${
                          workoutPreference === w.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Available Equipment
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Bodyweight', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Pull-up Bar', 'Gym Machines'].map((eq) => {
                      const isSelected = availableEquipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-600 text-white shadow-xs'
                              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Target Session Duration: <span className="text-emerald-600 font-bold">{availableWorkoutTime} mins</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setAvailableWorkoutTime(mins)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          availableWorkoutTime === mins
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Nutrition, Diet & Budget */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <Utensils className="w-5 h-5 text-emerald-500" />
                    <span>Nutrition, Diet & Budget</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Tailored for Indian & global meal options within your realistic budget.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Dietary Pattern
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'vegetarian', label: 'Vegetarian' },
                      { id: 'non_vegetarian', label: 'Non-Veg' },
                      { id: 'eggetarian', label: 'Eggetarian' },
                      { id: 'vegan', label: 'Vegan' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setDiet(d.id as any)}
                        className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                          diet === d.id
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                            : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    Regional & Cuisine Preferences
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Indian', 'South Indian', 'North Indian', 'High Protein', 'Budget Friendly', 'Quick Prep'].map((pref) => {
                      const isSel = foodPreferences.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          onClick={() => togglePreference(pref)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                            isSel
                              ? 'bg-emerald-500 border-emerald-600 text-white'
                              : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                          }`}
                        >
                          {isSel ? '✓ ' : '+ '}
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Daily Meal Budget (₹ / $)
                    </label>
                    <input
                      type="number"
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      Allergies / Avoid
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Dairy', 'Nuts', 'Gluten', 'Soy'].map((all) => {
                        const isSel = allergies.includes(all);
                        return (
                          <button
                            key={all}
                            type="button"
                            onClick={() => toggleAllergy(all)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              isSel
                                ? 'bg-amber-500 border-amber-600 text-white'
                                : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {all}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Sleep & Targets Confirmation */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    <span>Your FitAI Blueprint Is Ready!</span>
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Evidence-based Mifflin-St Jeor calculations calibrated for your body.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Target Sleep Time
                    </label>
                    <input
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Target Wake Time
                    </label>
                    <input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                    />
                  </div>
                </div>

                {/* Target Matrix Cards */}
                {preview && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-center">
                      <Flame className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {preview.dailyCalorieTarget}
                      </div>
                      <div className="text-[10px] text-neutral-500">Daily Calories</div>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-center">
                      <Dumbbell className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {preview.proteinTarget}g
                      </div>
                      <div className="text-[10px] text-neutral-500">Protein Target</div>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-center">
                      <Droplets className="w-4 h-4 mx-auto text-sky-500 mb-1" />
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {(preview.waterTargetMl / 1000).toFixed(1)}L
                      </div>
                      <div className="text-[10px] text-neutral-500">Hydration</div>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-center">
                      <Footprints className="w-4 h-4 mx-auto text-indigo-500 mb-1" />
                      <div className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                        {preview.stepGoal.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-neutral-500">Daily Steps</div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="py-2.5 px-4 rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-semibold transition-colors flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs flex items-center space-x-1.5 ml-auto"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleFinish}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors shadow-md flex items-center space-x-2 ml-auto"
              >
                {isSaving ? (
                  <span className="inline-block animate-spin">⏳</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Launch FitAI Coach</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
