import { Router } from 'express';
import { db, User, UserProfile } from '../db.js';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateSecureResetCode,
  authenticateToken,
  isDesignatedAdmin,
  AuthenticatedRequest,
} from '../auth.js';
import { calculateFitnessTargets } from '../calculations.js';

const router = Router();

// Store temporary reset records: email -> { code, expiresAt }
const resetTokens: Record<string, { email: string; expiresAt: number; code: string }> = {};

// POST /api/auth/quick-session (Seamless dev / demo quick login)
router.post('/quick-session', (req, res) => {
  try {
    const email = (req.body.email || 'hitheshavula@gmail.com').trim().toLowerCase();
    const name = (req.body.name || 'Hithesh Avula').trim();

    let user = db.get().users.find(u => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name,
        email,
        passwordHash: hashPassword('password123'),
        role: isDesignatedAdmin(email) ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      db.get().users.push(user);
    }

    let profile = db.get().profiles.find(p => p.userId === user!.id);
    if (!profile) {
      const initialTargets = calculateFitnessTargets({
        age: 26,
        gender: 'male',
        height: 175,
        weight: 72,
        activityLevel: 'moderate',
        fitnessGoal: 'lose_fat',
      });

      profile = {
        userId: user.id,
        age: 26,
        gender: 'male',
        height: 175,
        weight: 72,
        targetWeight: 68,
        activityLevel: 'moderate',
        fitnessExperience: 'beginner',
        fitnessGoal: 'lose_fat',
        workoutPreference: 'home',
        availableEquipment: ['Dumbbells', 'Resistance bands'],
        diet: 'vegetarian',
        foodPreferences: ['South Indian', 'North Indian'],
        allergies: [],
        dislikedFoods: [],
        dailyBudget: 250,
        weeklyBudget: 1750,
        availableWorkoutTime: 30,
        sleepTime: '23:00',
        wakeTime: '07:00',
        themePreference: 'light',
        dailyCalorieTarget: initialTargets.dailyCalorieTarget,
        proteinTarget: initialTargets.proteinTarget,
        carbsTarget: initialTargets.carbsTarget,
        fatTarget: initialTargets.fatTarget,
        waterTargetMl: initialTargets.waterTargetMl,
        stepGoal: initialTargets.stepGoal,
        sleepGoalHours: 8,
        bmi: initialTargets.bmi,
        bmiCategory: initialTargets.bmiCategory,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };
      db.get().profiles.push(profile);
    }

    db.save();
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Quick session error:', err);
    return res.status(500).json({ error: 'Failed to create quick session' });
  }
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const emailClean = String(email).trim().toLowerCase();
    const existing = db.get().users.find(u => u.email.toLowerCase() === emailClean);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: String(name).trim(),
      email: emailClean,
      passwordHash: hashPassword(String(password)),
      role: isDesignatedAdmin(emailClean) ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    const initialTargets = calculateFitnessTargets({
      age: 25,
      gender: 'male',
      height: 175,
      weight: 70,
      activityLevel: 'moderate',
      fitnessGoal: 'lose_fat',
    });

    const newProfile: UserProfile = {
      userId: newUser.id,
      age: 25,
      gender: 'male',
      height: 175,
      weight: 70,
      targetWeight: 66,
      activityLevel: 'moderate',
      fitnessExperience: 'beginner',
      fitnessGoal: 'lose_fat',
      workoutPreference: 'home',
      availableEquipment: ['Bodyweight'],
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
      dailyCalorieTarget: initialTargets.dailyCalorieTarget,
      proteinTarget: initialTargets.proteinTarget,
      carbsTarget: initialTargets.carbsTarget,
      fatTarget: initialTargets.fatTarget,
      waterTargetMl: initialTargets.waterTargetMl,
      stepGoal: initialTargets.stepGoal,
      sleepGoalHours: 8,
      bmi: initialTargets.bmi,
      bmiCategory: initialTargets.bmiCategory,
      onboardingCompleted: false,
      updatedAt: new Date().toISOString(),
    };

    db.get().users.push(newUser);
    db.get().profiles.push(newProfile);

    // Seed initial reminders for new user
    const defaultReminders = [
      { id: `rem_${Date.now()}_1`, userId: newUser.id, type: 'breakfast' as const, title: 'Nutritious Breakfast', time: '08:30', repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, message: 'Time to fuel up for the morning!' },
      { id: `rem_${Date.now()}_2`, userId: newUser.id, type: 'water' as const, title: 'Hydration Check-in (500ml)', time: '11:00', repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, message: 'Drink a glass of fresh water.' },
      { id: `rem_${Date.now()}_3`, userId: newUser.id, type: 'lunch' as const, title: 'Balanced Lunch', time: '13:00', repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, message: 'Time for your high-protein lunch.' },
      { id: `rem_${Date.now()}_4`, userId: newUser.id, type: 'workout' as const, title: 'Daily Workout Session', time: '18:00', repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], enabled: true, message: 'Ready for today’s movement session?' },
      { id: `rem_${Date.now()}_5`, userId: newUser.id, type: 'dinner' as const, title: 'High-Protein Dinner', time: '20:30', repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, message: 'Time for dinner and recovery.' },
    ];
    db.get().reminders.push(...defaultReminders);

    // Initial welcome notification
    db.get().notifications.push({
      id: `notif_${Date.now()}_1`,
      userId: newUser.id,
      title: 'Welcome to FitAI! 🌟',
      message: 'Your personal fitness and nutrition coach is ready. Complete onboarding to personalize your plan.',
      type: 'insight',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    db.save();
    const token = generateToken(newUser);

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      profile: newProfile,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailClean = String(email).trim().toLowerCase();
    const user = db.get().users.find(u => u.email.toLowerCase() === emailClean);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const validPassword = comparePassword(String(password), user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const profile = db.get().profiles.find(p => p.userId === user.id);
    const token = generateToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const profile = db.get().profiles.find(p => p.userId === user.id);

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    profile,
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const emailClean = String(email).trim().toLowerCase();
  const user = db.get().users.find(u => u.email.toLowerCase() === emailClean);

  if (!user) {
    // Avoid user enumeration, return generic success message
    return res.json({ message: 'If an account with this email exists, password reset instructions have been issued.' });
  }

  // Generate 6-digit secure code valid for 15 minutes
  const code = generateSecureResetCode();
  resetTokens[emailClean] = {
    email: emailClean,
    expiresAt: Date.now() + 15 * 60 * 1000,
    code,
  };

  console.log(`[FitAI Auth Security] Password reset code for ${emailClean}: ${code} (expires in 15 mins)`);

  return res.json({
    message: 'A 6-digit verification reset code has been generated and logged.',
    // For smooth user testing in dev environment, return the code
    code: process.env.NODE_ENV !== 'production' ? code : undefined,
  });
});

// POST /api/auth/reset-password
router.post('/reset-password', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Email, verification code, and new password are required' });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const emailClean = String(email).trim().toLowerCase();
  const resetRecord = resetTokens[emailClean];

  if (!resetRecord || resetRecord.code !== String(code).trim() || resetRecord.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired verification reset code' });
  }

  const user = db.get().users.find(u => u.email.toLowerCase() === emailClean);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.passwordHash = hashPassword(String(newPassword));
  delete resetTokens[emailClean];
  db.save();

  return res.json({ message: 'Password has been successfully updated. You may now log in.' });
});

export default router;
