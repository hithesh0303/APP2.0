import { Router } from 'express';
import { db } from '../db.js';
import { authenticateToken, requireAdmin, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  const data = db.get();

  const totalUsers = data.users.length;
  const totalFoodItems = data.foods.length;
  const totalFoodLogs = data.foodLogs.length;
  const totalWorkouts = data.workouts.length;
  const totalCompletedWorkouts = data.workoutHistories.length;
  const totalWaterLogs = data.waterLogs.length;

  return res.json({
    metrics: {
      totalUsers,
      totalFoodItems,
      totalFoodLogs,
      totalWorkouts,
      totalCompletedWorkouts,
      totalWaterLogs,
    },
    recentUsers: data.users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })).slice(-10),
  });
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  const users = db.get().users.map(u => {
    const profile = db.get().profiles.find(p => p.userId === u.id);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      goal: profile?.fitnessGoal,
      bmi: profile?.bmi,
    };
  });

  return res.json(users);
});

// POST /api/admin/foods (Admin create food item in global catalog)
router.post('/foods', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, category, servingSize, calories, protein, carbs, fat, fiber, estimatedCost } = req.body;

  if (!name || calories === undefined) {
    return res.status(400).json({ error: 'Name and calories are required' });
  }

  const newFood = {
    id: `food_admin_${Date.now()}`,
    name: name.trim(),
    category: category || 'main_course',
    servingSize: servingSize || '100g',
    calories: Number(calories),
    protein: Number(protein || 0),
    carbs: Number(carbs || 0),
    fat: Number(fat || 0),
    fiber: Number(fiber || 0),
    estimatedCost: Number(estimatedCost || 30),
  };

  db.get().foods.unshift(newFood);
  db.save();

  return res.status(201).json(newFood);
});

// DELETE /api/admin/foods/:id
router.delete('/foods/:id', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res) => {
  const foodId = req.params.id;
  const index = db.get().foods.findIndex(f => f.id === foodId);
  if (index === -1) {
    return res.status(404).json({ error: 'Food item not found' });
  }

  db.get().foods.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Food item deleted from catalog' });
});

export default router;
