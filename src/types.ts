export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  targetWeight: number; // kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  fitnessExperience: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoal: 'lose_fat' | 'gain_muscle' | 'maintain_weight' | 'improve_fitness' | 'improve_endurance' | 'build_strength';
  workoutPreference: 'home' | 'gym' | 'outdoor';
  availableEquipment: string[];
  diet: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian' | 'other';
  foodPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  dailyBudget: number;
  weeklyBudget: number;
  availableWorkoutTime: number;
  sleepTime: string;
  wakeTime: string;
  themePreference: 'light' | 'dark' | 'system';
  dailyCalorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  waterTargetMl: number;
  stepGoal: number;
  sleepGoalHours: number;
  bmi: number;
  bmiCategory: string;
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: 'breakfast' | 'main_course' | 'snack' | 'dairy' | 'protein' | 'grains' | 'fruits' | 'vegetables' | 'beverages';
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  isCustom?: boolean;
  userId?: string;
  estimatedCost?: number;
}

export interface FoodLog {
  id: string;
  userId: string;
  date: string;
  mealType: 'breakfast' | 'morning_snack' | 'lunch' | 'evening_snack' | 'dinner' | 'other';
  foodId?: string;
  foodName: string;
  servingSize: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  loggedAt: string;
}

export interface ExerciseItem {
  name: string;
  sets: number;
  reps: number;
  durationSec?: number;
  restSec: number;
  equipment: string;
  instructions: string;
  muscleGroup: string;
  caloriesBurnedEstimate?: number;
}

export interface WorkoutTemplate {
  id: string;
  title: string;
  category: 'home' | 'gym' | 'outdoor';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goal: string;
  durationMinutes: number;
  caloriesBurnedEstimate: number;
  equipment: string[];
  exercises: ExerciseItem[];
  userId?: string;
  safetyGuidance?: string;
}

export interface WorkoutHistory {
  id: string;
  userId: string;
  workoutId?: string;
  workoutTitle: string;
  date: string;
  durationMinutes: number;
  caloriesBurned: number;
  exercisesCompleted: number;
  totalExercises: number;
  notes?: string;
  completedAt: string;
}

export interface WaterLog {
  id: string;
  userId: string;
  date: string;
  amountMl: number;
  timestamp: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string;
  weight: number;
  bmi: number;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  date: string;
  steps: number;
  distanceKm: number;
  activeMinutes: number;
  caloriesBurned: number;
}

export interface ReminderItem {
  id: string;
  userId: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'water' | 'workout' | 'sleep' | 'custom';
  title: string;
  time: string;
  repeatDays: string[];
  enabled: boolean;
  message?: string;
  intervalMinutes?: number;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'meal' | 'workout' | 'water' | 'sleep' | 'progress' | 'insight';
  isRead: boolean;
  createdAt: string;
}

export interface MealPlanDay {
  day: string;
  date?: string;
  breakfast: { name: string; calories: number; protein: number; carbs: number; fat: number; costEstimate: number; recipe?: string };
  morningSnack?: { name: string; calories: number; protein: number; carbs: number; fat: number; costEstimate: number; recipe?: string };
  lunch: { name: string; calories: number; protein: number; carbs: number; fat: number; costEstimate: number; recipe?: string };
  eveningSnack?: { name: string; calories: number; protein: number; carbs: number; fat: number; costEstimate: number; recipe?: string };
  dinner: { name: string; calories: number; protein: number; carbs: number; fat: number; costEstimate: number; recipe?: string };
  dailyBudgetEstimate: number;
}

export interface RecipeItem {
  id: string;
  userId?: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prepTimeMinutes: number;
  costEstimate: number;
  tags: string[];
}

export interface GroceryItem {
  id: string;
  userId: string;
  category: 'Protein' | 'Vegetables' | 'Fruits' | 'Grains' | 'Dairy' | 'Nuts/Seeds' | 'Spices & Pantry' | 'Other';
  name: string;
  quantity: string;
  estimatedCost: number;
  purchased: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  actionData?: any;
}
