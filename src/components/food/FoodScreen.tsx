import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FoodItem, FoodLog, MealPlanDay, RecipeItem, GroceryItem } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ScanFoodModal } from './ScanFoodModal';
import { WhatToEatModal } from './WhatToEatModal';
import { CreateRecipeModal } from './CreateRecipeModal';
import { ProgressBar } from '../common/ProgressBar';
import {
  Search,
  Plus,
  Camera,
  Sparkles,
  ChefHat,
  ShoppingCart,
  Calendar,
  Flame,
  Utensils,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  DollarSign
} from 'lucide-react';

export const FoodScreen: React.FC = () => {
  const { profile } = useAuth();
  const { sendLocalNotification } = useNotifications();

  // Active Sub-tab
  const [subTab, setSubTab] = useState<'diary' | 'planner' | 'grocery' | 'recipes'>('diary');

  // Food Diary State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyData, setDailyData] = useState<{
    date: string;
    logs: FoodLog[];
    byMeal: Record<string, FoodLog[]>;
    totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  }>({
    date: selectedDate,
    logs: [],
    byMeal: { breakfast: [], morning_snack: [], lunch: [], evening_snack: [], dinner: [], other: [] },
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  });

  // Food Catalog Search & Log
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [activeMealForLogging, setActiveMealForLogging] = useState<string | null>(null);

  // Meal Planner State
  const [mealPlans, setMealPlans] = useState<MealPlanDay[]>([]);
  const [selectedPlanDay, setSelectedPlanDay] = useState<string>('Monday');

  // Grocery State
  const [groceryData, setGroceryData] = useState<{
    items: GroceryItem[];
    totalBudget: number;
    purchasedBudget: number;
    pendingBudget: number;
  }>({
    items: [],
    totalBudget: 0,
    purchasedBudget: 0,
    pendingBudget: 0,
  });
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryCost, setNewGroceryCost] = useState('40');

  // Recipes State
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);

  // Modals
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isWhatToEatOpen, setIsWhatToEatOpen] = useState(false);
  const [isCreateRecipeOpen, setIsCreateRecipeOpen] = useState(false);

  // Load Diary Data
  const loadDailyLogs = async (date: string) => {
    try {
      const data = await api.getDailyFoodLogs(date);
      setDailyData(data);
    } catch (err) {
      console.error('Fetch food logs error:', err);
    }
  };

  // Load Search Results
  const loadFoods = async (q: string, cat: string) => {
    try {
      const results = await api.searchFoods(q, cat);
      setSearchResults(results);
    } catch (err) {
      console.error('Search foods error:', err);
    }
  };

  // Load Plans & Groceries
  const loadMealPlans = async () => {
    try {
      const plans = await api.getMealPlans();
      setMealPlans(plans);
    } catch (err) {
      console.error('Fetch meal plans error:', err);
    }
  };

  const loadGroceries = async () => {
    try {
      const res = await api.getGroceryList();
      setGroceryData(res);
    } catch (err) {
      console.error('Fetch groceries error:', err);
    }
  };

  const loadRecipes = async () => {
    try {
      const list = await api.getRecipes();
      setRecipes(list);
    } catch (err) {
      console.error('Fetch recipes error:', err);
    }
  };

  useEffect(() => {
    loadDailyLogs(selectedDate);
    loadFoods('', 'all');
  }, [selectedDate]);

  useEffect(() => {
    if (subTab === 'planner') loadMealPlans();
    if (subTab === 'grocery') loadGroceries();
    if (subTab === 'recipes') loadRecipes();
  }, [subTab]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    loadFoods(val, selectedCategory);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    loadFoods(searchQuery, cat);
  };

  const handleAddFoodFromCatalog = async (food: FoodItem, mealType: string) => {
    try {
      await api.addFoodLog({
        date: selectedDate,
        mealType: mealType as any,
        foodId: food.id,
        foodName: food.name,
        servingSize: food.servingSize,
        quantity: 1,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
      });

      sendLocalNotification(
        'Meal Logged! 🍲',
        `Added ${food.name} (${food.calories} kcal) to ${mealType.replace('_', ' ')}.`,
        'meal'
      );

      loadDailyLogs(selectedDate);
      setActiveMealForLogging(null);
    } catch (err) {
      console.error('Add food log error:', err);
    }
  };

  const handleDeleteFoodLog = async (id: string) => {
    try {
      await api.deleteFoodLog(id);
      loadDailyLogs(selectedDate);
    } catch (err) {
      console.error('Delete log error:', err);
    }
  };

  const handleToggleGrocery = async (id: string) => {
    try {
      await api.toggleGroceryItem(id);
      loadGroceries();
    } catch (err) {
      console.error('Toggle grocery error:', err);
    }
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;
    try {
      await api.addGroceryItem({
        name: newGroceryName.trim(),
        estimatedCost: Number(newGroceryCost) || 30,
        category: 'Other',
        quantity: '1 unit',
      });
      setNewGroceryName('');
      loadGroceries();
    } catch (err) {
      console.error('Add grocery error:', err);
    }
  };

  const calTarget = profile?.dailyCalorieTarget || 2000;
  const proteinTarget = profile?.proteinTarget || 120;
  const carbsTarget = profile?.carbsTarget || 220;
  const fatTarget = profile?.fatTarget || 60;

  return (
    <div className="space-y-6 pb-20" id="food-screen">
      {/* Top Banner Navigation */}
      <div className="flex bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-2xl">
        {[
          { id: 'diary', label: 'Food Diary', icon: Utensils },
          { id: 'planner', label: 'Meal Plan', icon: Calendar },
          { id: 'grocery', label: 'Grocery List', icon: ShoppingCart },
          { id: 'recipes', label: 'Recipes', icon: ChefHat },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                isActive
                  ? 'bg-white dark:bg-neutral-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: FOOD DIARY */}
      {subTab === 'diary' && (
        <div className="space-y-6">
          {/* AI Quick Actions Bar */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              id="btn-food-scan"
              onClick={() => setIsScanOpen(true)}
              className="p-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <Camera className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Scan Food</span>
              <span className="text-[10px] text-neutral-500">Gemini Vision</span>
            </button>

            <button
              type="button"
              id="btn-food-what-to-eat"
              onClick={() => setIsWhatToEatOpen(true)}
              className="p-3 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <Sparkles className="w-5 h-5 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">What to Eat?</span>
              <span className="text-[10px] text-neutral-500">Smart Ideas</span>
            </button>

            <button
              type="button"
              id="btn-food-recipe-maker"
              onClick={() => setIsCreateRecipeOpen(true)}
              className="p-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-col items-center justify-center text-center transition-all group"
            >
              <ChefHat className="w-5 h-5 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">Pantry Chef</span>
              <span className="text-[10px] text-neutral-500">Custom Recipe</span>
            </button>
          </div>

          {/* Daily Nutrition Macro Overview */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                  Nutrition Target & Adherence
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {dailyData.totals.calories} / {calTarget} kcal
                </h3>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 outline-none"
              />
            </div>

            <ProgressBar
              value={dailyData.totals.calories}
              max={calTarget}
              colorClass="bg-emerald-500"
              heightClass="h-2.5"
            />

            {/* Macro Splits */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-center">
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {dailyData.totals.protein}g / {proteinTarget}g
                </div>
                <div className="text-[10px] text-neutral-500">Protein</div>
              </div>
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
                <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  {dailyData.totals.carbs}g / {carbsTarget}g
                </div>
                <div className="text-[10px] text-neutral-500">Carbs</div>
              </div>
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {dailyData.totals.fat}g / {fatTarget}g
                </div>
                <div className="text-[10px] text-neutral-500">Fat</div>
              </div>
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl">
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {dailyData.totals.fiber}g
                </div>
                <div className="text-[10px] text-neutral-500">Fiber</div>
              </div>
            </div>
          </div>

          {/* Meals Categorized List */}
          <div className="space-y-4">
            {[
              { key: 'breakfast', label: '🍳 Breakfast', targetPercent: 0.25 },
              { key: 'morning_snack', label: '🥗 Morning Snack', targetPercent: 0.1 },
              { key: 'lunch', label: '🍛 Lunch', targetPercent: 0.35 },
              { key: 'evening_snack', label: '🍵 Evening Snack', targetPercent: 0.1 },
              { key: 'dinner', label: '🍲 Dinner', targetPercent: 0.2 },
            ].map((m) => {
              const mealLogs = dailyData.byMeal[m.key] || [];
              const mealCals = mealLogs.reduce((sum, item) => sum + item.calories, 0);
              const mealProtein = mealLogs.reduce((sum, item) => sum + item.protein, 0);

              return (
                <div
                  key={m.key}
                  className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{m.label}</h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {mealCals} kcal • {Math.round(mealProtein * 10) / 10}g protein
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveMealForLogging(activeMealForLogging === m.key ? null : m.key)}
                      className="py-1.5 px-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-600 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Food</span>
                    </button>
                  </div>

                  {/* Food Items in this meal */}
                  {mealLogs.length > 0 ? (
                    <div className="space-y-2 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      {mealLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl text-xs"
                        >
                          <div>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">{log.foodName}</span>
                            <span className="text-neutral-500 dark:text-neutral-400 ml-1.5">
                              ({log.servingSize} × {log.quantity})
                            </span>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              P: {log.protein}g • C: {log.carbs}g • F: {log.fat}g
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                              {log.calories} kcal
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteFoodLog(log.id)}
                              className="text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* In-place Quick Search & Log Drawer */}
                  {activeMealForLogging === m.key && (
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-2xl space-y-2.5 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          Search Database to Log in {m.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveMealForLogging(null)}
                          className="text-xs text-neutral-400 hover:text-neutral-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => handleSearchChange(e.target.value)}
                          placeholder="Search Indian & Global food (e.g. Idli, Paneer, Chicken, Oats)..."
                          className="w-full pl-9 pr-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                        />
                      </div>

                      {/* Categories filter */}
                      <div className="flex flex-wrap gap-1">
                        {['all', 'breakfast', 'main_course', 'protein', 'dairy', 'grains', 'fruits', 'snack'].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold capitalize border transition-all ${
                              selectedCategory === cat
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300'
                            }`}
                          >
                            {cat.replace('_', ' ')}
                          </button>
                        ))}
                      </div>

                      {/* Search Results list */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
                        {searchResults.slice(0, 8).map((food) => (
                          <div
                            key={food.id}
                            className="flex items-center justify-between p-2 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 text-xs hover:border-emerald-300 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-neutral-900 dark:text-neutral-100">{food.name}</div>
                              <div className="text-[10px] text-neutral-500">
                                {food.servingSize} • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-neutral-800 dark:text-neutral-200">{food.calories} kcal</span>
                              <button
                                type="button"
                                onClick={() => handleAddFoodFromCatalog(food, m.key)}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MEAL PLANNER */}
      {subTab === 'planner' && (
        <div className="space-y-5">
          {/* Day Selector */}
          <div className="flex bg-white dark:bg-neutral-900 p-1.5 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-x-auto gap-1">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedPlanDay(day)}
                className={`flex-1 min-w-[70px] py-2 rounded-xl text-xs font-semibold text-center transition-all ${
                  selectedPlanDay === day
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>

          {/* Day Meal Plan Card */}
          {(() => {
            const activeDayPlan = mealPlans.find((p) => p.day === selectedPlanDay) || mealPlans[0];
            if (!activeDayPlan) return null;

            return (
              <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                      Personalized Nutrition Blueprint
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{selectedPlanDay}'s Plan</h3>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-xl">
                    Est. Budget: ₹{activeDayPlan.dailyBudgetEstimate || 200}/day
                  </span>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Breakfast', meal: activeDayPlan.breakfast, key: 'breakfast' },
                    { label: 'Morning Snack', meal: activeDayPlan.morningSnack, key: 'morning_snack' },
                    { label: 'Lunch', meal: activeDayPlan.lunch, key: 'lunch' },
                    { label: 'Evening Snack', meal: activeDayPlan.eveningSnack, key: 'evening_snack' },
                    { label: 'Dinner', meal: activeDayPlan.dinner, key: 'dinner' },
                  ].map((item, idx) => {
                    if (!item.meal) return null;
                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 rounded-2xl space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            {item.label}
                          </span>
                          <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                            {item.meal.calories} kcal • {item.meal.protein}g protein
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{item.meal.name}</h4>
                        {item.meal.recipe && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                            {item.meal.recipe}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* SUB-TAB 3: GROCERY LIST */}
      {subTab === 'grocery' && (
        <div className="space-y-5">
          {/* Budget Summary Card */}
          <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                  Smart Grocery Budget
                </span>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Total Budget: ₹{groceryData.totalBudget}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-neutral-500">
                  Purchased: <strong>₹{groceryData.purchasedBudget}</strong>
                </span>
              </div>
            </div>

            <ProgressBar
              value={groceryData.purchasedBudget}
              max={groceryData.totalBudget || 1}
              colorClass="bg-emerald-500"
              heightClass="h-2"
            />
          </div>

          {/* Add custom item form */}
          <form onSubmit={handleAddGrocery} className="flex space-x-2">
            <input
              type="text"
              value={newGroceryName}
              onChange={(e) => setNewGroceryName(e.target.value)}
              placeholder="Add pantry item (e.g. Soya Chunks, Peanut Butter)..."
              className="flex-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 outline-none"
            />
            <input
              type="number"
              value={newGroceryCost}
              onChange={(e) => setNewGroceryCost(e.target.value)}
              placeholder="₹"
              className="w-20 px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl text-xs text-neutral-900 dark:text-neutral-100 outline-none text-center font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-semibold flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add</span>
            </button>
          </form>

          {/* Grocery items checklist */}
          <div className="space-y-2">
            {groceryData.items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleGrocery(item.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.purchased
                    ? 'bg-neutral-50 dark:bg-neutral-800/30 border-neutral-200/50 dark:border-neutral-800/40 text-neutral-400 line-through'
                    : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      item.purchased
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-neutral-300 dark:border-neutral-600'
                    }`}
                  >
                    {item.purchased && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold">{item.name}</span>
                    <span className="text-[11px] text-neutral-400 ml-2">({item.quantity})</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                  ₹{item.estimatedCost}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RECIPES */}
      {subTab === 'recipes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Recipe Catalog & Cookbook</h3>
            <button
              type="button"
              onClick={() => setIsCreateRecipeOpen(true)}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>AI Create Recipe</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recipes.map((rec) => (
              <div
                key={rec.id}
                className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{rec.title}</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{rec.description}</p>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-neutral-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{rec.prepTimeMinutes}m</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-2xl">
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{rec.calories}</div>
                    <div className="text-[9px] text-neutral-500">kcal</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{rec.protein}g</div>
                    <div className="text-[9px] text-neutral-500">Protein</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400">{rec.carbs}g</div>
                    <div className="text-[9px] text-neutral-500">Carbs</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-600 dark:text-amber-400">{rec.fat}g</div>
                    <div className="text-[9px] text-neutral-500">Fat</div>
                  </div>
                </div>

                <div>
                  <h5 className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mb-1">Method:</h5>
                  <ol className="list-decimal list-inside text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
                    {rec.instructions?.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ol>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Dialogs */}
      <ScanFoodModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onLogged={() => loadDailyLogs(selectedDate)}
      />

      <WhatToEatModal
        isOpen={isWhatToEatOpen}
        onClose={() => setIsWhatToEatOpen(false)}
        onMealAdded={() => loadDailyLogs(selectedDate)}
      />

      <CreateRecipeModal
        isOpen={isCreateRecipeOpen}
        onClose={() => setIsCreateRecipeOpen(false)}
        onRecipeSaved={() => {
          loadRecipes();
          setSubTab('recipes');
        }}
      />
    </div>
  );
};
