import { Router } from 'express';
import { db, UserProfile } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';
import { calculateFitnessTargets } from '../calculations.js';

const router = Router();

// GET /api/profile
router.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  let profile = db.get().profiles.find(p => p.userId === userId);

  if (!profile) {
    const targets = calculateFitnessTargets({
      age: 25,
      gender: 'male',
      height: 175,
      weight: 70,
      activityLevel: 'moderate',
      fitnessGoal: 'lose_fat',
    });

    profile = {
      userId,
      age: 25,
      gender: 'male',
      height: 175,
      weight: 70,
      targetWeight: 66,
      activityLevel: 'moderate',
      fitnessExperience: 'beginner',
      fitnessGoal: 'lose_fat',
      workoutPreference: 'home',
      availableEquipment: ['Dumbbells'],
      diet: 'vegetarian',
      foodPreferences: ['Indian'],
      allergies: [],
      dislikedFoods: [],
      dailyBudget: 250,
      weeklyBudget: 1750,
      availableWorkoutTime: 30,
      sleepTime: '23:00',
      wakeTime: '07:00',
      themePreference: 'light',
      dailyCalorieTarget: targets.dailyCalorieTarget,
      proteinTarget: targets.proteinTarget,
      carbsTarget: targets.carbsTarget,
      fatTarget: targets.fatTarget,
      waterTargetMl: targets.waterTargetMl,
      stepGoal: targets.stepGoal,
      sleepGoalHours: 8,
      bmi: targets.bmi,
      bmiCategory: targets.bmiCategory,
      onboardingCompleted: false,
      updatedAt: new Date().toISOString(),
    };
    db.get().profiles.push(profile);
    db.save();
  }

  return res.json(profile);
});

// POST /api/profile/calculate-preview (Calculates targets dynamically)
router.post('/calculate-preview', (req, res) => {
  const { age, gender, height, weight, activityLevel, fitnessGoal } = req.body;

  if (!age || !gender || !height || !weight || !activityLevel || !fitnessGoal) {
    return res.status(400).json({ error: 'Missing core metrics for calculation' });
  }

  const result = calculateFitnessTargets({
    age: Number(age),
    gender,
    height: Number(height),
    weight: Number(weight),
    activityLevel,
    fitnessGoal,
  });

  return res.json(result);
});

// PUT /api/profile (Updates profile or saves onboarding)
router.put('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const updates = req.body;

  let profile = db.get().profiles.find(p => p.userId === userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }

  // Recalculate targets if core metrics changed and targets were not manually locked
  if (updates.age || updates.gender || updates.height || updates.weight || updates.activityLevel || updates.fitnessGoal) {
    const age = Number(updates.age !== undefined ? updates.age : profile.age);
    const gender = updates.gender || profile.gender;
    const height = Number(updates.height !== undefined ? updates.height : profile.height);
    const weight = Number(updates.weight !== undefined ? updates.weight : profile.weight);
    const activityLevel = updates.activityLevel || profile.activityLevel;
    const fitnessGoal = updates.fitnessGoal || profile.fitnessGoal;

    const recalculated = calculateFitnessTargets({ age, gender, height, weight, activityLevel, fitnessGoal });
    profile.bmi = recalculated.bmi;
    profile.bmiCategory = recalculated.bmiCategory;

    if (!updates.dailyCalorieTarget) profile.dailyCalorieTarget = recalculated.dailyCalorieTarget;
    if (!updates.proteinTarget) profile.proteinTarget = recalculated.proteinTarget;
    if (!updates.carbsTarget) profile.carbsTarget = recalculated.carbsTarget;
    if (!updates.fatTarget) profile.fatTarget = recalculated.fatTarget;
    if (!updates.waterTargetMl) profile.waterTargetMl = recalculated.waterTargetMl;
    if (!updates.stepGoal) profile.stepGoal = recalculated.stepGoal;
  }

  // Apply other fields
  Object.assign(profile, updates, { updatedAt: new Date().toISOString() });

  // If user changed name, update user object too
  if (updates.name && req.user) {
    req.user.name = updates.name.trim();
    const userInDb = db.get().users.find(u => u.id === userId);
    if (userInDb) userInDb.name = updates.name.trim();
  }

  db.save();
  return res.json(profile);
});

export default router;
