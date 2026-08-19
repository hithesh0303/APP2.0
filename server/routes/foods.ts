import { Router } from 'express';
import { db, FoodItem, FoodLog } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/foods/search?q=...&category=...
router.get('/search', authenticateToken, (req: AuthenticatedRequest, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();
  const userId = req.user!.id;

  let list = db.get().foods.filter(f => !f.userId || f.userId === userId);

  if (category && category !== 'all') {
    list = list.filter(f => f.category.toLowerCase() === category);
  }

  if (query) {
    list = list.filter(f =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query) ||
      f.servingSize.toLowerCase().includes(query)
    );
  }

  return res.json(list);
});

// POST /api/foods/custom (Create custom food item)
router.post('/custom', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { name, category, servingSize, calories, protein, carbs, fat, fiber, estimatedCost } = req.body;

  if (!name || calories === undefined) {
    return res.status(400).json({ error: 'Name and calories are required' });
  }

  const newFood: FoodItem = {
    id: `food_custom_${Date.now()}`,
    name: name.trim(),
    category: category || 'main_course',
    servingSize: servingSize || '1 serving',
    calories: Number(calories),
    protein: Number(protein || 0),
    carbs: Number(carbs || 0),
    fat: Number(fat || 0),
    fiber: Number(fiber || 0),
    isCustom: true,
    userId,
    estimatedCost: Number(estimatedCost || 30),
  };

  db.get().foods.push(newFood);
  db.save();

  return res.status(201).json(newFood);
});

// GET /api/foods/logs?date=YYYY-MM-DD
router.get('/logs', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const date = String(req.query.date || new Date().toISOString().split('T')[0]);

  const userLogs = db.get().foodLogs.filter(l => l.userId === userId && l.date === date);

  // Compute daily totals
  const totals = userLogs.reduce(
    (acc, log) => {
      acc.calories += log.calories;
      acc.protein += log.protein;
      acc.carbs += log.carbs;
      acc.fat += log.fat;
      acc.fiber += log.fiber;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Group by meal type
  const byMeal: Record<string, FoodLog[]> = {
    breakfast: [],
    morning_snack: [],
    lunch: [],
    evening_snack: [],
    dinner: [],
    other: [],
  };

  userLogs.forEach(log => {
    if (byMeal[log.mealType]) {
      byMeal[log.mealType].push(log);
    } else {
      byMeal.other.push(log);
    }
  });

  return res.json({
    date,
    logs: userLogs,
    byMeal,
    totals: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10,
    }
  });
});

// POST /api/foods/logs (Add entry to food log)
router.post('/logs', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, mealType, foodId, foodName, servingSize, quantity = 1, calories, protein, carbs, fat, fiber } = req.body;

  if (!foodName || calories === undefined || !mealType) {
    return res.status(400).json({ error: 'foodName, mealType, and calories are required' });
  }

  const logDate = date || new Date().toISOString().split('T')[0];
  const qty = Number(quantity) || 1;

  const newLog: FoodLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    date: logDate,
    mealType,
    foodId,
    foodName: foodName.trim(),
    servingSize: servingSize || '1 serving',
    quantity: qty,
    calories: Math.round(Number(calories) * qty),
    protein: Math.round(Number(protein || 0) * qty * 10) / 10,
    carbs: Math.round(Number(carbs || 0) * qty * 10) / 10,
    fat: Math.round(Number(fat || 0) * qty * 10) / 10,
    fiber: Math.round(Number(fiber || 0) * qty * 10) / 10,
    loggedAt: new Date().toISOString(),
  };

  db.get().foodLogs.push(newLog);
  db.save();

  return res.status(201).json(newLog);
});

// DELETE /api/foods/logs/:id (Delete a food log entry)
router.delete('/logs/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const logId = req.params.id;

  const index = db.get().foodLogs.findIndex(l => l.id === logId && l.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Log entry not found' });
  }

  db.get().foodLogs.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Log entry removed' });
});

export default router;
