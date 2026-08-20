import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // in cm
  weight: number; // in kg
  targetWeight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active';
  fitnessExperience: 'beginner' | 'intermediate' | 'advanced';
  fitnessGoal: 'lose_fat' | 'gain_muscle' | 'maintain_weight' | 'improve_fitness' | 'improve_endurance' | 'build_strength';
  workoutPreference: 'home' | 'gym' | 'outdoor';
  availableEquipment: string[];
  diet: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian' | 'other';
  foodPreferences: string[];
  allergies: string[];
  dislikedFoods: string[];
  dailyBudget: number; // in currency units e.g. INR / USD
  weeklyBudget: number;
  availableWorkoutTime: number; // in minutes e.g. 10, 20, 30, 45, 60
  sleepTime: string; // e.g. "23:00"
  wakeTime: string; // e.g. "07:00"
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
  servingSize: string; // e.g. "1 medium (50g)", "1 cup (200g)", "100g"
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
  date: string; // YYYY-MM-DD
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
}

export interface WorkoutHistory {
  id: string;
  userId: string;
  workoutId?: string;
  workoutTitle: string;
  date: string; // YYYY-MM-DD
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
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  bmi: number;
  notes?: string;
}

export interface BodyMeasurement {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armsCm?: number;
  thighsCm?: number;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // e.g. "23:30"
  wakeTime: string; // e.g. "07:15"
  durationMinutes: number;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
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
  time: string; // "HH:mm"
  repeatDays: string[]; // ["Mon", "Tue", ...]
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
  day: string; // "Monday", "Tuesday", etc.
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

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  messages: AIMessage[];
  updatedAt: string;
}

interface DatabaseSchema {
  users: User[];
  profiles: UserProfile[];
  foods: FoodItem[];
  foodLogs: FoodLog[];
  workouts: WorkoutTemplate[];
  workoutHistories: WorkoutHistory[];
  waterLogs: WaterLog[];
  weightLogs: WeightLog[];
  bodyMeasurements: BodyMeasurement[];
  sleepLogs: SleepLog[];
  activityLogs: ActivityLog[];
  reminders: ReminderItem[];
  notifications: NotificationItem[];
  mealPlans: Record<string, MealPlanDay[]>; // keyed by userId
  recipes: RecipeItem[];
  groceryLists: GroceryItem[];
  conversations: AIConversation[];
}

const DB_FILE = path.join(process.cwd(), 'data_fitai_store.json');

let dbState: DatabaseSchema = {
  users: [],
  profiles: [],
  foods: [],
  foodLogs: [],
  workouts: [],
  workoutHistories: [],
  waterLogs: [],
  weightLogs: [],
  bodyMeasurements: [],
  sleepLogs: [],
  activityLogs: [],
  reminders: [],
  notifications: [],
  mealPlans: {},
  recipes: [],
  groceryLists: [],
  conversations: [],
};

// Seed dataset for authentic Indian & Global foods
const DEFAULT_FOODS: FoodItem[] = [
  { id: 'f-1', name: 'Idli with Sambar & Chutney', category: 'breakfast', servingSize: '2 medium idlis + 1 cup sambar', calories: 240, protein: 9, carbs: 46, fat: 3, fiber: 6, estimatedCost: 40 },
  { id: 'f-2', name: 'Plain Masala Dosa', category: 'breakfast', servingSize: '1 medium dosa (150g)', calories: 280, protein: 6, carbs: 42, fat: 10, fiber: 3, estimatedCost: 50 },
  { id: 'f-3', name: 'Oats Porridge with Milk & Almonds', category: 'breakfast', servingSize: '1 bowl (250g)', calories: 310, protein: 12, carbs: 48, fat: 8, fiber: 5, estimatedCost: 35 },
  { id: 'f-4', name: 'Boiled Eggs (2 whole)', category: 'protein', servingSize: '2 large eggs (100g)', calories: 140, protein: 12.6, carbs: 1.1, fat: 9.8, fiber: 0, estimatedCost: 15 },
  { id: 'f-5', name: 'Egg Omelette with Vegetables', category: 'breakfast', servingSize: '2 eggs + veggies', calories: 190, protein: 14, carbs: 4, fat: 13, fiber: 1.5, estimatedCost: 25 },
  { id: 'f-6', name: 'Poha with Peanuts & Veggies', category: 'breakfast', servingSize: '1 medium plate (200g)', calories: 270, protein: 6.5, carbs: 46, fat: 7.5, fiber: 3.5, estimatedCost: 25 },
  { id: 'f-7', name: 'Upma (Semolina / Rava)', category: 'breakfast', servingSize: '1 bowl (200g)', calories: 250, protein: 6, carbs: 44, fat: 6, fiber: 3, estimatedCost: 25 },
  { id: 'f-8', name: 'Whole Wheat Roti / Chapati', category: 'grains', servingSize: '1 medium roti (35g)', calories: 85, protein: 3, carbs: 17, fat: 0.8, fiber: 2.5, estimatedCost: 5 },
  { id: 'f-9', name: 'Steamed White Rice', category: 'grains', servingSize: '1 cup cooked (150g)', calories: 195, protein: 4, carbs: 43, fat: 0.5, fiber: 0.8, estimatedCost: 10 },
  { id: 'f-10', name: 'Brown Rice Cooked', category: 'grains', servingSize: '1 cup cooked (150g)', calories: 170, protein: 4.5, carbs: 36, fat: 1.5, fiber: 3.2, estimatedCost: 18 },
  { id: 'f-11', name: 'Yellow Moong Dal Tadka', category: 'main_course', servingSize: '1 medium katori (150g)', calories: 150, protein: 9, carbs: 20, fat: 4, fiber: 4.5, estimatedCost: 20 },
  { id: 'f-12', name: 'Rajma Masala (Red Kidney Beans)', category: 'main_course', servingSize: '1 cup (200g)', calories: 230, protein: 12, carbs: 36, fat: 4.5, fiber: 9, estimatedCost: 35 },
  { id: 'f-13', name: 'Chole Masala (Chickpeas Curry)', category: 'main_course', servingSize: '1 cup (200g)', calories: 260, protein: 13, carbs: 38, fat: 6, fiber: 10, estimatedCost: 35 },
  { id: 'f-14', name: 'Paneer Butter / Tikka Masala', category: 'main_course', servingSize: '1 cup (180g)', calories: 340, protein: 16, carbs: 12, fat: 26, fiber: 2.5, estimatedCost: 75 },
  { id: 'f-15', name: 'Grilled Chicken Breast', category: 'protein', servingSize: '150g cooked', calories: 240, protein: 46, carbs: 0, fat: 5, fiber: 0, estimatedCost: 70 },
  { id: 'f-16', name: 'Home-style Chicken Curry', category: 'main_course', servingSize: '1 cup (200g)', calories: 290, protein: 28, carbs: 6, fat: 17, fiber: 1.5, estimatedCost: 65 },
  { id: 'f-17', name: 'Fish Curry (Rohu / Salmon)', category: 'main_course', servingSize: '1 piece + gravy (180g)', calories: 220, protein: 25, carbs: 4, fat: 11, fiber: 1, estimatedCost: 80 },
  { id: 'f-18', name: 'High Protein Soy Chunks Curry', category: 'protein', servingSize: '50g dry cooked with gravy', calories: 210, protein: 26, carbs: 16, fat: 4, fiber: 7, estimatedCost: 20 },
  { id: 'f-19', name: 'Plain Fresh Curd / Dahi', category: 'dairy', servingSize: '1 cup (150g)', calories: 95, protein: 6, carbs: 7, fat: 5, fiber: 0, estimatedCost: 15 },
  { id: 'f-20', name: 'Greek Yogurt (Low Fat)', category: 'dairy', servingSize: '1 cup (170g)', calories: 100, protein: 17, carbs: 6, fat: 0.7, fiber: 0, estimatedCost: 60 },
  { id: 'f-21', name: 'Mixed Sprout Salad with Lemon', category: 'snack', servingSize: '1 bowl (150g)', calories: 120, protein: 8, carbs: 20, fat: 1.5, fiber: 6, estimatedCost: 20 },
  { id: 'f-22', name: 'Roasted Almonds & Walnuts', category: 'snack', servingSize: 'Handful (30g)', calories: 185, protein: 6, carbs: 6, fat: 16, fiber: 3.5, estimatedCost: 30 },
  { id: 'f-23', name: 'Banana (Medium)', category: 'fruits', servingSize: '1 medium fruit (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1, estimatedCost: 8 },
  { id: 'f-24', name: 'Fresh Apple', category: 'fruits', servingSize: '1 medium apple (150g)', calories: 80, protein: 0.5, carbs: 21, fat: 0.3, fiber: 4.4, estimatedCost: 25 },
  { id: 'f-25', name: 'Whey Protein Shake (with water)', category: 'protein', servingSize: '1 scoop (32g)', calories: 120, protein: 24, carbs: 2, fat: 1.5, fiber: 0.5, estimatedCost: 65 },
  { id: 'f-26', name: 'Green Tea (Unsweetened)', category: 'beverages', servingSize: '1 cup (200ml)', calories: 2, protein: 0, carbs: 0.5, fat: 0, fiber: 0, estimatedCost: 5 },
  { id: 'f-27', name: 'Paneer Bhurji with Onions', category: 'main_course', servingSize: '1 bowl (150g)', calories: 260, protein: 18, carbs: 6, fat: 19, fiber: 2, estimatedCost: 55 },
  { id: 'f-28', name: 'Palak Paneer', category: 'main_course', servingSize: '1 cup (200g)', calories: 280, protein: 15, carbs: 9, fat: 21, fiber: 4.5, estimatedCost: 65 },
  { id: 'f-29', name: 'Vegetable Khichdi with Ghee', category: 'main_course', servingSize: '1 plate (250g)', calories: 310, protein: 10, carbs: 52, fat: 7, fiber: 6, estimatedCost: 30 },
  { id: 'f-30', name: 'Peanut Butter on Whole Grain Toast', category: 'snack', servingSize: '1 slice + 1 tbsp peanut butter', calories: 190, protein: 8, carbs: 18, fat: 10, fiber: 3, estimatedCost: 20 },
];

// Seed sample workout templates across categories and levels
const DEFAULT_WORKOUTS: WorkoutTemplate[] = [
  {
    id: 'w-1',
    title: 'Full Body Home Blast (No Equipment)',
    category: 'home',
    fitnessLevel: 'beginner',
    goal: 'Improve Fitness & Fat Loss',
    durationMinutes: 25,
    caloriesBurnedEstimate: 210,
    equipment: ['None (Bodyweight)'],
    exercises: [
      { name: 'Jumping Jacks Warmup', sets: 2, reps: 30, restSec: 30, equipment: 'Bodyweight', instructions: 'Land softly on balls of feet, keep core engaged and arms moving overhead smoothly.', muscleGroup: 'Full Body' },
      { name: 'Bodyweight Squats', sets: 3, reps: 15, restSec: 45, equipment: 'Bodyweight', instructions: 'Feet shoulder-width apart, push hips back, drive through heels to return to standing.', muscleGroup: 'Quadriceps, Glutes' },
      { name: 'Incline or Standard Push-ups', sets: 3, reps: 10, restSec: 60, equipment: 'Bodyweight', instructions: 'Maintain straight line from crown of head to heels, lower chest with control.', muscleGroup: 'Chest, Triceps, Core' },
      { name: 'Reverse Lunges', sets: 3, reps: 12, restSec: 45, equipment: 'Bodyweight', instructions: 'Step back with control, lower rear knee toward floor without slamming, keep torso upright.', muscleGroup: 'Quads, Hamstrings' },
      { name: 'Plank Hold', sets: 3, reps: 1, durationSec: 35, restSec: 45, equipment: 'Bodyweight', instructions: 'Elbows under shoulders, squeeze glutes and brace abdominal wall without arching lower back.', muscleGroup: 'Core, Shoulders' },
      { name: 'Mountain Climbers', sets: 3, reps: 20, restSec: 45, equipment: 'Bodyweight', instructions: 'Drive knees toward chest in alternating tempo, keeping hips low and stable.', muscleGroup: 'Core, Cardio' },
    ]
  },
  {
    id: 'w-2',
    title: 'Dumbbell Hypertrophy Upper Body',
    category: 'home',
    fitnessLevel: 'intermediate',
    goal: 'Build Muscle & Strength',
    durationMinutes: 35,
    caloriesBurnedEstimate: 280,
    equipment: ['Dumbbells'],
    exercises: [
      { name: 'Dumbbell Floor Chest Press', sets: 4, reps: 12, restSec: 60, equipment: 'Dumbbells', instructions: 'Press dumbbells straight up, squeeze chest at peak contraction, lower elbows at 45 degree angle.', muscleGroup: 'Chest, Triceps' },
      { name: 'Dumbbell Bent-Over Rows', sets: 4, reps: 12, restSec: 60, equipment: 'Dumbbells', instructions: 'Hinge at hips with flat back, pull elbows up toward waist, squeeze shoulder blades together.', muscleGroup: 'Back, Biceps' },
      { name: 'Seated Overhead Dumbbell Shoulder Press', sets: 3, reps: 10, restSec: 60, equipment: 'Dumbbells', instructions: 'Press weights overhead with controlled tempo, avoid hyperextending the lower back.', muscleGroup: 'Shoulders, Triceps' },
      { name: 'Standing Bicep Hammer Curls', sets: 3, reps: 12, restSec: 45, equipment: 'Dumbbells', instructions: 'Keep palms facing each other, control the eccentric lowering phase for 2 seconds.', muscleGroup: 'Biceps, Forearms' },
      { name: 'Overhead Tricep Extension', sets: 3, reps: 12, restSec: 45, equipment: 'Dumbbells', instructions: 'Hold one dumbbell vertically overhead, lower behind head by bending elbows, press up.', muscleGroup: 'Triceps' },
      { name: 'Lateral Shoulder Raises', sets: 3, reps: 15, restSec: 45, equipment: 'Dumbbells', instructions: 'Slight bend in elbows, raise weights out to sides to shoulder height with control.', muscleGroup: 'Lateral Deltoids' },
    ]
  },
  {
    id: 'w-3',
    title: 'Gym Strength Foundation (Push-Pull-Legs)',
    category: 'gym',
    fitnessLevel: 'intermediate',
    goal: 'Build Strength & Muscle',
    durationMinutes: 45,
    caloriesBurnedEstimate: 360,
    equipment: ['Barbell', 'Dumbbells', 'Machines'],
    exercises: [
      { name: 'Barbell Back Squats', sets: 4, reps: 8, restSec: 90, equipment: 'Barbell / Squat Rack', instructions: 'Rest bar across traps, break at hips and knees simultaneously, achieve parallel depth.', muscleGroup: 'Legs, Core' },
      { name: 'Flat Barbell Bench Press', sets: 4, reps: 8, restSec: 90, equipment: 'Barbell Bench', instructions: 'Grip slightly wider than shoulder width, touch mid-chest, press upward explosively.', muscleGroup: 'Chest, Triceps' },
      { name: 'Lat Pulldown (Cable)', sets: 4, reps: 10, restSec: 60, equipment: 'Cable Machine', instructions: 'Slight lean back, pull bar to upper chest pulling with elbows rather than forearms.', muscleGroup: 'Lats, Upper Back' },
      { name: 'Romanian Deadlifts (Dumbbells / Barbell)', sets: 3, reps: 10, restSec: 75, equipment: 'Dumbbells / Barbell', instructions: 'Soft knees, push hips back until hamstrings stretch, drive hips forward to lockout.', muscleGroup: 'Hamstrings, Glutes' },
      { name: 'Cable Tricep Pushdowns', sets: 3, reps: 15, restSec: 45, equipment: 'Cable Machine', instructions: 'Keep elbows locked at sides, fully extend triceps at bottom and squeeze.', muscleGroup: 'Triceps' },
    ]
  },
  {
    id: 'w-4',
    title: 'Outdoor Interval Cardio & Agility Run',
    category: 'outdoor',
    fitnessLevel: 'beginner',
    goal: 'Improve Endurance & Fat Loss',
    durationMinutes: 30,
    caloriesBurnedEstimate: 290,
    equipment: ['Running Shoes'],
    exercises: [
      { name: 'Brisk Walk Warmup', sets: 1, reps: 1, durationSec: 300, restSec: 30, equipment: 'Outdoor Path', instructions: 'Warm up hip flexors, calves and elevate heart rate gently.', muscleGroup: 'Cardiovascular' },
      { name: 'Interval Jog / Stride (6 Rounds)', sets: 6, reps: 1, durationSec: 60, restSec: 60, equipment: 'Outdoor Path', instructions: 'Run at 70% max effort for 60 seconds, followed by 60 seconds walking recovery.', muscleGroup: 'Legs, Cardio' },
      { name: 'Park Bench Step-ups', sets: 3, reps: 12, restSec: 45, equipment: 'Bench / Ledge', instructions: 'Step up with right foot, drive through heel, alternate legs each set.', muscleGroup: 'Glutes, Quads' },
      { name: 'Park Bench Incline Push-ups', sets: 3, reps: 12, restSec: 45, equipment: 'Bench', instructions: 'Hands on bench, lower chest to edge and push away with good abdominal brace.', muscleGroup: 'Chest, Arms' },
      { name: 'Cool-down Static Stretches', sets: 1, reps: 1, durationSec: 300, restSec: 0, equipment: 'Outdoor Path', instructions: 'Stretch hamstrings, quads, calves, and chest deeply.', muscleGroup: 'Flexibility' },
    ]
  }
];

export function initDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      dbState = JSON.parse(data);
    } else {
      dbState.foods = [...DEFAULT_FOODS];
      dbState.workouts = [...DEFAULT_WORKOUTS];
      saveDb();
    }
  } catch (err) {
    console.error('Error reading DB file, initializing fresh state:', err);
    dbState.foods = [...DEFAULT_FOODS];
    dbState.workouts = [...DEFAULT_WORKOUTS];
    saveDb();
  }
}

export function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting DB to disk:', err);
  }
}

export const db = {
  get: () => dbState,
  save: saveDb,
};
