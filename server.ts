import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDb } from './server/db.js';
import authRoutes from './server/routes/auth.js';
import profileRoutes from './server/routes/profile.js';
import foodRoutes from './server/routes/foods.js';
import workoutRoutes from './server/routes/workouts.js';
import trackerRoutes from './server/routes/trackers.js';
import mealPlanRoutes from './server/routes/mealplans.js';
import reminderRoutes from './server/routes/reminders.js';
import aiRoutes from './server/routes/ai.js';
import adminRoutes from './server/routes/admin.js';

dotenv.config();

async function startServer() {
  // Initialize Database with pre-seeded rich Indian & Global foods, workouts, and templates
  initDb();

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'FitAI Server',
      timestamp: new Date().toISOString(),
      aiConfigured: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // Mount API Route Modules
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api/workouts', workoutRoutes);
  app.use('/api/trackers', trackerRoutes);
  app.use('/api/mealplans', mealPlanRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/admin', adminRoutes);

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FitAI backend & client server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error during FitAI server initialization:', err);
  process.exit(1);
});
