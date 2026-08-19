import { Router } from 'express';
import { db, WorkoutTemplate, WorkoutHistory } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/workouts/templates
router.get('/templates', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const category = String(req.query.category || '').toLowerCase();
  const level = String(req.query.level || '').toLowerCase();

  let templates = db.get().workouts.filter(w => !w.userId || w.userId === userId);

  if (category && category !== 'all') {
    templates = templates.filter(w => w.category === category);
  }
  if (level && level !== 'all') {
    templates = templates.filter(w => w.fitnessLevel === level);
  }

  return res.json(templates);
});

// POST /api/workouts/templates (Save custom or AI generated workout)
router.post('/templates', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { title, category, fitnessLevel, goal, durationMinutes, caloriesBurnedEstimate, equipment, exercises } = req.body;

  if (!title || !exercises || !Array.isArray(exercises)) {
    return res.status(400).json({ error: 'Title and exercises array are required' });
  }

  const newWorkout: WorkoutTemplate = {
    id: `workout_${Date.now()}`,
    title: title.trim(),
    category: category || 'home',
    fitnessLevel: fitnessLevel || 'beginner',
    goal: goal || 'General Fitness',
    durationMinutes: Number(durationMinutes) || 30,
    caloriesBurnedEstimate: Number(caloriesBurnedEstimate) || 200,
    equipment: Array.isArray(equipment) ? equipment : ['Bodyweight'],
    exercises,
    userId,
  };

  db.get().workouts.push(newWorkout);
  db.save();

  return res.status(201).json(newWorkout);
});

// GET /api/workouts/history
router.get('/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const histories = db.get().workoutHistories
    .filter(h => h.userId === userId)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  return res.json(histories);
});

// POST /api/workouts/history (Record completed workout)
router.post('/history', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { workoutId, workoutTitle, date, durationMinutes, caloriesBurned, exercisesCompleted, totalExercises, notes } = req.body;

  if (!workoutTitle) {
    return res.status(400).json({ error: 'Workout title is required' });
  }

  const logDate = date || new Date().toISOString().split('T')[0];

  const newHistory: WorkoutHistory = {
    id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    workoutId,
    workoutTitle: workoutTitle.trim(),
    date: logDate,
    durationMinutes: Number(durationMinutes) || 25,
    caloriesBurned: Number(caloriesBurned) || 200,
    exercisesCompleted: Number(exercisesCompleted) || 1,
    totalExercises: Number(totalExercises) || Number(exercisesCompleted) || 1,
    notes: notes || '',
    completedAt: new Date().toISOString(),
  };

  db.get().workoutHistories.push(newHistory);

  // Trigger celebration notification
  db.get().notifications.push({
    id: `notif_${Date.now()}`,
    userId,
    title: 'Workout Completed! 🏆',
    message: `Phenomenal effort! You logged "${workoutTitle}" for ${newHistory.durationMinutes} mins and burned ~${newHistory.caloriesBurned} kcal.`,
    type: 'workout',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  db.save();
  return res.status(201).json(newHistory);
});

export default router;
