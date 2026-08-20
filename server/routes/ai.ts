import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import {
  detectFoodFromImage,
  generateDailyInsight,
  generateWhatShouldIEat,
  generateCustomRecipe,
  generateAiWorkout,
  generateProgressAnalysis,
  chatWithAiCoach
} from '../gemini.js';

const router = Router();

// POST /api/ai/scan-food (Food recognition via Gemini Vision)
router.post('/scan-food', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const result = await detectFoodFromImage(imageBase64, mimeType || 'image/jpeg');
    return res.json(result);
  } catch (err: any) {
    console.error('Scan food route error:', err);
    return res.status(500).json({ error: 'Failed to analyze food image with AI vision' });
  }
});

// GET /api/ai/daily-insight (Generates tailored daily motivation & insight)
router.get('/daily-insight', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    const profile = db.get().profiles.find(p => p.userId === userId);
    const todayFoodLogs = db.get().foodLogs.filter(f => f.userId === userId && f.date === today);
    const caloriesConsumed = todayFoodLogs.reduce((sum, f) => sum + f.calories, 0);
    const proteinConsumed = todayFoodLogs.reduce((sum, f) => sum + f.protein, 0);

    const todayWaterLogs = db.get().waterLogs.filter(w => w.userId === userId && w.date === today);
    const waterConsumed = todayWaterLogs.reduce((sum, w) => sum + w.amountMl, 0);

    const workoutDone = db.get().workoutHistories.some(w => w.userId === userId && w.date === today);
    const todayActivity = db.get().activityLogs.find(a => a.userId === userId && a.date === today);

    const insight = await generateDailyInsight({
      name: req.user!.name || 'Athlete',
      goal: profile?.fitnessGoal || 'improve_fitness',
      calorieTarget: profile?.dailyCalorieTarget || 2000,
      caloriesConsumed,
      proteinTarget: profile?.proteinTarget || 120,
      proteinConsumed,
      waterTarget: profile?.waterTargetMl || 3000,
      waterConsumed,
      workoutDone,
      stepsDone: todayActivity?.steps || 3800,
      stepGoal: profile?.stepGoal || 8000,
    });

    return res.json({ insight, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('Daily insight route error:', err);
    return res.json({
      insight: `Stay consistent with your protein and hydration today, ${req.user?.name || 'there'}! Every small habit compounds into lasting fitness results.`,
      timestamp: new Date().toISOString()
    });
  }
});

// POST /api/ai/what-to-eat ("What should I eat now?")
router.post('/what-to-eat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date().toISOString().split('T')[0];

    const profile = db.get().profiles.find(p => p.userId === userId);
    const todayFoodLogs = db.get().foodLogs.filter(f => f.userId === userId && f.date === today);

    const caloriesConsumed = todayFoodLogs.reduce((sum, f) => sum + f.calories, 0);
    const proteinConsumed = todayFoodLogs.reduce((sum, f) => sum + f.protein, 0);

    const remainingCalories = Math.max(0, (profile?.dailyCalorieTarget || 2000) - caloriesConsumed);
    const remainingProtein = Math.max(0, (profile?.proteinTarget || 120) - proteinConsumed);

    const currentHour = new Date().getHours();
    let timeOfDay = 'lunch';
    if (currentHour < 11) timeOfDay = 'breakfast';
    else if (currentHour < 15) timeOfDay = 'lunch';
    else if (currentHour < 18) timeOfDay = 'evening snack';
    else timeOfDay = 'dinner';

    const suggestions = await generateWhatShouldIEat({
      goal: profile?.fitnessGoal || 'lose_fat',
      diet: profile?.diet || 'vegetarian',
      foodPreferences: profile?.foodPreferences || ['Indian'],
      allergies: profile?.allergies || [],
      dislikedFoods: profile?.dislikedFoods || [],
      remainingCalories,
      remainingProtein,
      dailyBudget: profile?.dailyBudget || 250,
      timeOfDay,
    });

    return res.json({
      timeOfDay,
      remainingCalories,
      remainingProtein,
      suggestions,
    });
  } catch (err: any) {
    console.error('What to eat route error:', err);
    return res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// POST /api/ai/create-recipe
router.post('/create-recipe', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { ingredients, filter } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'List of ingredients is required' });
    }

    const profile = db.get().profiles.find(p => p.userId === userId);
    const recipe = await generateCustomRecipe(
      ingredients,
      filter || 'High Protein',
      profile?.diet || 'vegetarian',
      profile?.allergies || []
    );

    return res.json(recipe);
  } catch (err: any) {
    console.error('Recipe creation error:', err);
    return res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

// POST /api/ai/generate-workout
router.post('/generate-workout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { durationMinutes, equipment, location, notes } = req.body;

    const profile = db.get().profiles.find(p => p.userId === userId);
    const workout = await generateAiWorkout({
      goal: profile?.fitnessGoal || 'lose_fat',
      fitnessLevel: profile?.fitnessExperience || 'beginner',
      equipment: equipment || profile?.availableEquipment || ['Bodyweight'],
      durationMinutes: Number(durationMinutes) || profile?.availableWorkoutTime || 25,
      location: location || profile?.workoutPreference || 'home',
      notes,
    });

    return res.json(workout);
  } catch (err: any) {
    console.error('AI workout generation error:', err);
    return res.status(500).json({ error: 'Failed to generate customized workout' });
  }
});

// POST /api/ai/analyze-progress
router.post('/analyze-progress', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const { days = 30 } = req.body;

    const profile = db.get().profiles.find(p => p.userId === userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(days));
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const weightLogs = db.get().weightLogs
      .filter(w => w.userId === userId && w.date >= cutoffStr)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const foodLogs = db.get().foodLogs.filter(f => f.userId === userId && f.date >= cutoffStr);
    const workoutHistories = db.get().workoutHistories.filter(w => w.userId === userId && w.date >= cutoffStr);
    const waterLogs = db.get().waterLogs.filter(w => w.userId === userId && w.date >= cutoffStr);
    const sleepLogs = db.get().sleepLogs.filter(s => s.userId === userId && s.date >= cutoffStr);

    const totalCals = foodLogs.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = foodLogs.reduce((sum, f) => sum + f.protein, 0);
    const totalWater = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);
    const totalSleepMins = sleepLogs.reduce((sum, s) => sum + s.durationMinutes, 0);

    const distinctDays = Math.max(1, new Set(foodLogs.map(f => f.date)).size);

    const analysis = await generateProgressAnalysis({
      userName: req.user!.name,
      goal: profile?.fitnessGoal || 'lose_fat',
      startWeight: weightLogs[0]?.weight || profile?.weight || 72,
      currentWeight: profile?.weight || 72,
      targetWeight: profile?.targetWeight || 68,
      weightTrend: weightLogs.map(w => ({ date: w.date, weight: w.weight })),
      avgCalories: Math.round(totalCals / distinctDays) || profile?.dailyCalorieTarget || 2000,
      calorieTarget: profile?.dailyCalorieTarget || 2000,
      avgProtein: Math.round(totalProtein / distinctDays) || 90,
      proteinTarget: profile?.proteinTarget || 120,
      workoutsCompleted: workoutHistories.length,
      avgWaterMl: Math.round(totalWater / distinctDays) || 2400,
      waterTarget: profile?.waterTargetMl || 3000,
      avgSleepHours: Math.round((totalSleepMins / (Math.max(1, sleepLogs.length) * 60)) * 10) / 10 || 7.5,
    });

    return res.json(analysis);
  } catch (err: any) {
    console.error('Progress analysis error:', err);
    return res.status(500).json({ error: 'Failed to generate progress analysis' });
  }
});

// POST /api/ai/chat (FitAI Coach Interactive Assistant)
router.post('/chat', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    let messages = req.body.messages;

    // Handle { message, history } format if provided
    if (!messages && req.body.message) {
      const history = Array.isArray(req.body.history) ? req.body.history : [];
      messages = [
        ...history.map((h: any) => ({
          role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
          content: typeof h.parts?.[0]?.text === 'string' ? h.parts[0].text : (h.content || ''),
        })),
        { role: 'user', content: req.body.message }
      ];
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array or message string is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const profile = db.get().profiles.find(p => p.userId === userId);
    const todayFoodLogs = db.get().foodLogs.filter(f => f.userId === userId && f.date === today);
    const caloriesConsumed = todayFoodLogs.reduce((sum, f) => sum + f.calories, 0);
    const proteinConsumed = todayFoodLogs.reduce((sum, f) => sum + f.protein, 0);

    const todayWaterLogs = db.get().waterLogs.filter(w => w.userId === userId && w.date === today);
    const waterConsumed = todayWaterLogs.reduce((sum, w) => sum + w.amountMl, 0);

    const workoutDone = db.get().workoutHistories.some(w => w.userId === userId && w.date === today);
    const todayActivity = db.get().activityLogs.find(a => a.userId === userId && a.date === today);

    const todayStats = {
      caloriesConsumed,
      proteinConsumed,
      waterConsumed,
      workoutDone,
      steps: todayActivity?.steps || 3500,
    };

    const reply = await chatWithAiCoach(messages, profile, todayStats);

    return res.json({
      role: 'assistant',
      content: reply,
      reply: reply,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return res.status(500).json({ error: 'FitAI Coach chat unavailable right now' });
  }
});

export default router;
