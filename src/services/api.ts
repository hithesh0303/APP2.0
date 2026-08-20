import { User, UserProfile, FoodItem, FoodLog, WorkoutTemplate, WorkoutHistory, WaterLog, WeightLog, BodyMeasurement, SleepLog, ActivityLog, ReminderItem, NotificationItem, MealPlanDay, RecipeItem, GroceryItem, AIMessage } from '../types';

let authToken: string | null = localStorage.getItem('fitai_token');

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('fitai_token', token);
  } else {
    localStorage.removeItem('fitai_token');
  }
}

export function getToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('fitai_token');
  }
  return authToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  quickSession: (body: { name?: string; email?: string } = {}) =>
    request<{ token: string; user: User; profile: UserProfile }>('/api/auth/quick-session', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User; profile: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User; profile: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getMe: () => request<{ user: User; profile: UserProfile }>('/api/auth/me'),
  forgotPassword: (email: string) =>
    request<{ message: string; code: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Profile
  getProfile: () => request<UserProfile>('/api/profile'),
  updateProfile: (updates: Partial<UserProfile> & { name?: string }) =>
    request<UserProfile>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  calculatePreview: (params: any) =>
    request<any>('/api/profile/calculate-preview', {
      method: 'POST',
      body: JSON.stringify(params),
    }),

  // Foods & Nutrition
  searchFoods: (query: string = '', category: string = 'all') =>
    request<FoodItem[]>(`/api/foods/search?q=${encodeURIComponent(query)}&category=${encodeURIComponent(category)}`),
  createCustomFood: (food: Partial<FoodItem>) =>
    request<FoodItem>('/api/foods/custom', {
      method: 'POST',
      body: JSON.stringify(food),
    }),
  getDailyFoodLogs: (date?: string) =>
    request<{ date: string; logs: FoodLog[]; byMeal: Record<string, FoodLog[]>; totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number } }>(
      `/api/foods/logs${date ? `?date=${date}` : ''}`
    ),
  addFoodLog: (log: Partial<FoodLog>) =>
    request<FoodLog>('/api/foods/logs', {
      method: 'POST',
      body: JSON.stringify(log),
    }),
  deleteFoodLog: (id: string) =>
    request<{ success: boolean }>(`/api/foods/logs/${id}`, {
      method: 'DELETE',
    }),

  // Workouts
  getWorkoutTemplates: (category: string = 'all', level: string = 'all') =>
    request<WorkoutTemplate[]>(`/api/workouts/templates?category=${category}&level=${level}`),
  createWorkoutTemplate: (workout: Partial<WorkoutTemplate>) =>
    request<WorkoutTemplate>('/api/workouts/templates', {
      method: 'POST',
      body: JSON.stringify(workout),
    }),
  getWorkoutHistory: () => request<WorkoutHistory[]>('/api/workouts/history'),
  logWorkoutHistory: (history: Partial<WorkoutHistory>) =>
    request<WorkoutHistory>('/api/workouts/history', {
      method: 'POST',
      body: JSON.stringify(history),
    }),

  // Trackers
  getWater: (date?: string) =>
    request<{ date: string; currentAmountMl: number; targetMl: number; logs: WaterLog[] }>(`/api/trackers/water${date ? `?date=${date}` : ''}`),
  getWaterLog: (date?: string) =>
    request<{ date: string; currentAmountMl: number; targetMl: number; logs: WaterLog[] }>(`/api/trackers/water${date ? `?date=${date}` : ''}`),
  addWater: (amountMl: number, date?: string) =>
    request<{ newLog: WaterLog; currentAmountMl: number; targetMl: number }>('/api/trackers/water', {
      method: 'POST',
      body: JSON.stringify({ amountMl, date }),
    }),
  logWater: (amountMl: number, date?: string) =>
    request<{ newLog: WaterLog; currentAmountMl: number; targetMl: number }>('/api/trackers/water', {
      method: 'POST',
      body: JSON.stringify({ amountMl, date }),
    }),
  resetWater: (date?: string) =>
    request<{ success: boolean; currentAmountMl: number }>(`/api/trackers/water/reset${date ? `?date=${date}` : ''}`, {
      method: 'DELETE',
    }),

  getWeightLogs: () => request<WeightLog[]>('/api/trackers/weight'),
  logWeight: (weight: number, date?: string, notes?: string) =>
    request<WeightLog>('/api/trackers/weight', {
      method: 'POST',
      body: JSON.stringify({ weight, date, notes }),
    }),

  getMeasurements: () => request<BodyMeasurement[]>('/api/trackers/measurements'),
  logMeasurement: (data: Partial<BodyMeasurement>) =>
    request<BodyMeasurement>('/api/trackers/measurements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSleep: (date?: string) =>
    request<SleepLog[]>(`/api/trackers/sleep${date ? `?date=${date}` : ''}`),
  getSleepLogs: (date?: string) =>
    request<SleepLog[]>(`/api/trackers/sleep${date ? `?date=${date}` : ''}`),
  logSleep: (data: { bedtime: string; wakeTime: string; quality: string; date?: string; notes?: string }) =>
    request<SleepLog>('/api/trackers/sleep', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getActivity: (date?: string) =>
    request<ActivityLog>(`/api/trackers/activity${date ? `?date=${date}` : ''}`),
  logActivity: (data: Partial<ActivityLog>) =>
    request<ActivityLog>('/api/trackers/activity', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getProgressOverview: (days: number = 30) =>
    request<any>(
      `/api/trackers/progress-overview?days=${days}`
    ),

  // Meal Plans & Recipes & Groceries
  getMealPlans: () => request<MealPlanDay[]>('/api/mealplans'),
  generateAiMealPlan: () => request<MealPlanDay[]>('/api/mealplans/generate-ai', { method: 'POST' }),
  regenerateDayMeal: (day: string, mealType: string) =>
    request<MealPlanDay[]>('/api/mealplans/regenerate-day', {
      method: 'POST',
      body: JSON.stringify({ day, mealType }),
    }),
  getRecipes: () => request<RecipeItem[]>('/api/mealplans/recipes'),
  saveRecipe: (recipe: Partial<RecipeItem>) =>
    request<RecipeItem>('/api/mealplans/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    }),
  getGroceryList: () =>
    request<{ items: GroceryItem[]; totalBudget: number; purchasedBudget: number; pendingBudget: number }>('/api/mealplans/grocery'),
  addGroceryItem: (item: Partial<GroceryItem>) =>
    request<GroceryItem>('/api/mealplans/grocery', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  toggleGroceryItem: (id: string) =>
    request<GroceryItem>(`/api/mealplans/grocery/${id}/toggle`, {
      method: 'PUT',
    }),
  deleteGroceryItem: (id: string) =>
    request<{ success: boolean }>(`/api/mealplans/grocery/${id}`, {
      method: 'DELETE',
    }),

  // Reminders & Notifications
  getReminders: () => request<ReminderItem[]>('/api/reminders'),
  createReminder: (rem: Partial<ReminderItem>) =>
    request<ReminderItem>('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(rem),
    }),
  updateReminder: (id: string, rem: Partial<ReminderItem>) =>
    request<ReminderItem>(`/api/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rem),
    }),
  toggleReminder: (id: string) =>
    request<ReminderItem>(`/api/reminders/${id}/toggle`, {
      method: 'PUT',
    }),
  deleteReminder: (id: string) =>
    request<{ success: boolean }>(`/api/reminders/${id}`, {
      method: 'DELETE',
    }),

  getNotifications: () =>
    request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/reminders/notifications'),
  markNotificationsRead: () =>
    request<{ success: boolean }>('/api/reminders/notifications/read-all', {
      method: 'PUT',
    }),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/api/reminders/notifications/${id}/read`, {
      method: 'PUT',
    }),

  // AI Services (Gemini 2.5 Flash)
  scanFood: (imageBase64: string, mimeType?: string) =>
    request<any>('/api/ai/scan-food', {
      method: 'POST',
      body: JSON.stringify({ imageBase64, mimeType }),
    }),
  getDailyInsight: () => request<{ tipTitle?: string; insight: string; timestamp: string }>('/api/ai/daily-insight'),
  whatShouldIEat: () => request<any>('/api/ai/what-to-eat', { method: 'POST' }),
  createRecipe: (ingredients: string[], filter?: string) =>
    request<any>('/api/ai/create-recipe', {
      method: 'POST',
      body: JSON.stringify({ ingredients, filter }),
    }),
  generateWorkout: (params: { durationMinutes?: number; equipment?: string[]; location?: string; notes?: string }) =>
    request<any>('/api/ai/generate-workout', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  analyzeProgress: (days: number | string = 30) =>
    request<any>('/api/ai/analyze-progress', {
      method: 'POST',
      body: JSON.stringify({ days }),
    }),
  chatCoach: (message: string, history: any[] = []) =>
    request<{ reply?: string; content?: string; role?: string; timestamp?: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),
  chat: (messages: AIMessage[]) =>
    request<{ role: 'assistant'; content: string; timestamp: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),

  // Admin
  getAdminStats: () => request<any>('/api/admin/stats'),
  getAdminUsers: () => request<any[]>('/api/admin/users'),
  adminAddFood: (food: any) =>
    request<any>('/api/admin/foods', {
      method: 'POST',
      body: JSON.stringify(food),
    }),
  adminDeleteFood: (id: string) =>
    request<any>(`/api/admin/foods/${id}`, {
      method: 'DELETE',
    }),

  // Health
  checkHealth: () => request<any>('/api/health'),
};
