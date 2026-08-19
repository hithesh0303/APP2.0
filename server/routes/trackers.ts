import { Router } from 'express';
import { db, WaterLog, WeightLog, BodyMeasurement, SleepLog, ActivityLog } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// ================= WATER TRACKER =================

// GET /api/trackers/water?date=YYYY-MM-DD
router.get('/water', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const date = String(req.query.date || new Date().toISOString().split('T')[0]);

  const logs = db.get().waterLogs.filter(w => w.userId === userId && w.date === date);
  const totalMl = logs.reduce((sum, item) => sum + item.amountMl, 0);

  return res.json({
    date,
    totalMl,
    logs,
  });
});

// POST /api/trackers/water
router.post('/water', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, amountMl } = req.body;

  if (!amountMl || Number(amountMl) <= 0) {
    return res.status(400).json({ error: 'Valid water amount in ml is required' });
  }

  const logDate = date || new Date().toISOString().split('T')[0];
  const newLog: WaterLog = {
    id: `water_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    userId,
    date: logDate,
    amountMl: Number(amountMl),
    timestamp: new Date().toISOString(),
  };

  db.get().waterLogs.push(newLog);

  // Check if daily water goal reached
  const profile = db.get().profiles.find(p => p.userId === userId);
  const userLogs = db.get().waterLogs.filter(w => w.userId === userId && w.date === logDate);
  const totalNow = userLogs.reduce((sum, item) => sum + item.amountMl, 0);

  if (profile && totalNow >= profile.waterTargetMl && totalNow - Number(amountMl) < profile.waterTargetMl) {
    db.get().notifications.push({
      id: `notif_${Date.now()}`,
      userId,
      title: 'Hydration Target Achieved! 💧',
      message: `Awesome! You have reached your daily hydration goal of ${(profile.waterTargetMl / 1000).toFixed(1)}L today.`,
      type: 'water',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  }

  db.save();

  return res.status(201).json({
    newLog,
    totalMl: totalNow,
  });
});

// DELETE /api/trackers/water/reset?date=YYYY-MM-DD
router.delete('/water/reset', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const date = String(req.query.date || new Date().toISOString().split('T')[0]);

  const database = db.get();
  database.waterLogs = database.waterLogs.filter(w => !(w.userId === userId && w.date === date));
  db.save();

  return res.json({ success: true, message: 'Water logs reset for day', totalMl: 0 });
});

// ================= WEIGHT & MEASUREMENTS =================

// GET /api/trackers/weight
router.get('/weight', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const logs = db.get().weightLogs
    .filter(w => w.userId === userId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return res.json(logs);
});

// POST /api/trackers/weight
router.post('/weight', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, weight, notes } = req.body;

  if (!weight || Number(weight) <= 0) {
    return res.status(400).json({ error: 'Valid weight in kg is required' });
  }

  const logDate = date || new Date().toISOString().split('T')[0];
  const profile = db.get().profiles.find(p => p.userId === userId);
  const heightM = (profile?.height || 175) / 100;
  const bmi = Math.round((Number(weight) / (heightM * heightM)) * 10) / 10;

  // Update profile weight & BMI
  if (profile) {
    profile.weight = Number(weight);
    profile.bmi = bmi;
    if (bmi < 18.5) profile.bmiCategory = 'Underweight';
    else if (bmi < 24.9) profile.bmiCategory = 'Normal weight';
    else if (bmi < 29.9) profile.bmiCategory = 'Overweight';
    else profile.bmiCategory = 'Obese';
  }

  // Check if log for this date exists, update or push
  let weightLog = db.get().weightLogs.find(w => w.userId === userId && w.date === logDate);
  if (weightLog) {
    weightLog.weight = Number(weight);
    weightLog.bmi = bmi;
    weightLog.notes = notes || weightLog.notes;
  } else {
    weightLog = {
      id: `wt_${Date.now()}`,
      userId,
      date: logDate,
      weight: Number(weight),
      bmi,
      notes: notes || '',
    };
    db.get().weightLogs.push(weightLog);
  }

  db.save();
  return res.status(201).json(weightLog);
});

// GET /api/trackers/measurements
router.get('/measurements', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const list = db.get().bodyMeasurements
    .filter(m => m.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.json(list);
});

// POST /api/trackers/measurements
router.post('/measurements', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, chestCm, waistCm, hipsCm, armsCm, thighsCm } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  let item = db.get().bodyMeasurements.find(m => m.userId === userId && m.date === logDate);
  if (item) {
    if (chestCm !== undefined) item.chestCm = Number(chestCm);
    if (waistCm !== undefined) item.waistCm = Number(waistCm);
    if (hipsCm !== undefined) item.hipsCm = Number(hipsCm);
    if (armsCm !== undefined) item.armsCm = Number(armsCm);
    if (thighsCm !== undefined) item.thighsCm = Number(thighsCm);
  } else {
    item = {
      id: `bm_${Date.now()}`,
      userId,
      date: logDate,
      chestCm: chestCm ? Number(chestCm) : undefined,
      waistCm: waistCm ? Number(waistCm) : undefined,
      hipsCm: hipsCm ? Number(hipsCm) : undefined,
      armsCm: armsCm ? Number(armsCm) : undefined,
      thighsCm: thighsCm ? Number(thighsCm) : undefined,
    };
    db.get().bodyMeasurements.push(item);
  }

  db.save();
  return res.status(201).json(item);
});

// ================= SLEEP TRACKER =================

// GET /api/trackers/sleep?date=YYYY-MM-DD
router.get('/sleep', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const date = String(req.query.date || new Date().toISOString().split('T')[0]);

  const log = db.get().sleepLogs.find(s => s.userId === userId && s.date === date);
  const history = db.get().sleepLogs
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  return res.json({ today: log || null, history });
});

// POST /api/trackers/sleep
router.post('/sleep', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, bedtime, wakeTime, quality, notes } = req.body;

  if (!bedtime || !wakeTime) {
    return res.status(400).json({ error: 'Bedtime and wake time are required' });
  }

  const logDate = date || new Date().toISOString().split('T')[0];

  // Calculate duration in minutes from HH:mm
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);

  let bedMinutes = bH * 60 + bM;
  let wakeMinutes = wH * 60 + wM;
  if (wakeMinutes < bedMinutes) {
    wakeMinutes += 24 * 60; // Next day
  }
  const durationMinutes = wakeMinutes - bedMinutes;

  let sleepLog = db.get().sleepLogs.find(s => s.userId === userId && s.date === logDate);
  if (sleepLog) {
    sleepLog.bedtime = bedtime;
    sleepLog.wakeTime = wakeTime;
    sleepLog.durationMinutes = durationMinutes;
    sleepLog.quality = quality || 'good';
    sleepLog.notes = notes || sleepLog.notes;
  } else {
    sleepLog = {
      id: `sleep_${Date.now()}`,
      userId,
      date: logDate,
      bedtime,
      wakeTime,
      durationMinutes,
      quality: quality || 'good',
      notes: notes || '',
    };
    db.get().sleepLogs.push(sleepLog);
  }

  db.save();
  return res.status(201).json(sleepLog);
});

// ================= ACTIVITY & STEPS =================

// GET /api/trackers/activity?date=YYYY-MM-DD
router.get('/activity', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const date = String(req.query.date || new Date().toISOString().split('T')[0]);

  let log = db.get().activityLogs.find(a => a.userId === userId && a.date === date);
  if (!log) {
    log = {
      id: `act_${Date.now()}`,
      userId,
      date,
      steps: 4250,
      distanceKm: 3.2,
      activeMinutes: 35,
      caloriesBurned: 180,
    };
  }

  return res.json(log);
});

// POST /api/trackers/activity
router.post('/activity', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { date, steps, distanceKm, activeMinutes, caloriesBurned } = req.body;
  const logDate = date || new Date().toISOString().split('T')[0];

  const stepsNum = Number(steps || 0);
  const distNum = distanceKm !== undefined ? Number(distanceKm) : Math.round((stepsNum * 0.00076) * 10) / 10;
  const activeMins = activeMinutes !== undefined ? Number(activeMinutes) : Math.round(stepsNum / 100);
  const cals = caloriesBurned !== undefined ? Number(caloriesBurned) : Math.round(stepsNum * 0.04);

  let log = db.get().activityLogs.find(a => a.userId === userId && a.date === logDate);
  if (log) {
    log.steps = stepsNum;
    log.distanceKm = distNum;
    log.activeMinutes = activeMins;
    log.caloriesBurned = cals;
  } else {
    log = {
      id: `act_${Date.now()}`,
      userId,
      date: logDate,
      steps: stepsNum,
      distanceKm: distNum,
      activeMinutes: activeMins,
      caloriesBurned: cals,
    };
    db.get().activityLogs.push(log);
  }

  db.save();
  return res.status(201).json(log);
});

// ================= PROGRESS OVERVIEW / TIME RANGE STATS =================

// GET /api/trackers/progress-overview?days=7 | 30 | 90 | 180 | 365
router.get('/progress-overview', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const days = Number(req.query.days) || 30;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const weightLogs = db.get().weightLogs
    .filter(w => w.userId === userId && w.date >= cutoffStr)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const workoutLogs = db.get().workoutHistories
    .filter(w => w.userId === userId && w.date >= cutoffStr);

  const waterLogs = db.get().waterLogs
    .filter(w => w.userId === userId && w.date >= cutoffStr);

  const foodLogs = db.get().foodLogs
    .filter(f => f.userId === userId && f.date >= cutoffStr);

  const sleepLogs = db.get().sleepLogs
    .filter(s => s.userId === userId && s.date >= cutoffStr);

  const activityLogs = db.get().activityLogs
    .filter(a => a.userId === userId && a.date >= cutoffStr);

  // Group by Date for unified multi-metric charting
  const dateMap: Record<string, any> = {};

  // Build daily timeline
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    dateMap[dStr] = {
      date: dStr,
      displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: null,
      bmi: null,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      waterLiters: 0,
      workoutMinutes: 0,
      steps: 0,
      sleepHours: 0,
    };
  }

  // Populate actual data
  weightLogs.forEach(w => {
    if (dateMap[w.date]) {
      dateMap[w.date].weight = w.weight;
      dateMap[w.date].bmi = w.bmi;
    }
  });

  foodLogs.forEach(f => {
    if (dateMap[f.date]) {
      dateMap[f.date].calories += f.calories;
      dateMap[f.date].protein += f.protein;
      dateMap[f.date].carbs += f.carbs;
      dateMap[f.date].fat += f.fat;
    }
  });

  waterLogs.forEach(w => {
    if (dateMap[w.date]) {
      dateMap[w.date].waterLiters += w.amountMl / 1000;
    }
  });

  workoutLogs.forEach(w => {
    if (dateMap[w.date]) {
      dateMap[w.date].workoutMinutes += w.durationMinutes;
    }
  });

  sleepLogs.forEach(s => {
    if (dateMap[s.date]) {
      dateMap[s.date].sleepHours = Math.round((s.durationMinutes / 60) * 10) / 10;
    }
  });

  activityLogs.forEach(a => {
    if (dateMap[a.date]) {
      dateMap[a.date].steps = a.steps;
    }
  });

  const timeline = Object.values(dateMap).map(item => ({
    ...item,
    protein: Math.round(item.protein * 10) / 10,
    waterLiters: Math.round(item.waterLiters * 10) / 10,
  }));

  return res.json({
    days,
    timeline,
    weightLogs,
    workoutCount: workoutLogs.length,
    totalWorkoutMinutes: workoutLogs.reduce((sum, w) => sum + w.durationMinutes, 0),
    totalCaloriesBurned: workoutLogs.reduce((sum, w) => sum + w.caloriesBurned, 0),
  });
});

export default router;
