import { Router } from 'express';
import { db, ReminderItem, NotificationItem } from '../db.js';
import { authenticateToken, AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/reminders
router.get('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const reminders = db.get().reminders.filter(r => r.userId === userId);
  return res.json(reminders);
});

// POST /api/reminders
router.post('/', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { type, title, time, repeatDays, enabled, message, intervalMinutes, quietHoursStart, quietHoursEnd } = req.body;

  if (!title || !time) {
    return res.status(400).json({ error: 'Title and time are required' });
  }

  const newReminder: ReminderItem = {
    id: `rem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: type || 'custom',
    title: String(title).trim(),
    time: String(time).trim(),
    repeatDays: Array.isArray(repeatDays) && repeatDays.length > 0 ? repeatDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    message: message ? String(message).trim() : undefined,
    intervalMinutes: intervalMinutes ? Number(intervalMinutes) : undefined,
    quietHoursStart: quietHoursStart || undefined,
    quietHoursEnd: quietHoursEnd || undefined,
  };

  db.get().reminders.push(newReminder);
  db.save();

  return res.status(201).json(newReminder);
});

// PUT /api/reminders/:id (Update reminder)
router.put('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const id = req.params.id;
  const { type, title, time, repeatDays, enabled, message, intervalMinutes, quietHoursStart, quietHoursEnd } = req.body;

  const rem = db.get().reminders.find(r => r.id === id && r.userId === userId);
  if (!rem) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  if (title) rem.title = String(title).trim();
  if (time) rem.time = String(time).trim();
  if (type) rem.type = type;
  if (Array.isArray(repeatDays)) rem.repeatDays = repeatDays;
  if (enabled !== undefined) rem.enabled = Boolean(enabled);
  if (message !== undefined) rem.message = message ? String(message).trim() : undefined;
  if (intervalMinutes !== undefined) rem.intervalMinutes = intervalMinutes ? Number(intervalMinutes) : undefined;
  if (quietHoursStart !== undefined) rem.quietHoursStart = quietHoursStart || undefined;
  if (quietHoursEnd !== undefined) rem.quietHoursEnd = quietHoursEnd || undefined;

  db.save();
  return res.json(rem);
});

// PUT /api/reminders/:id/toggle
router.put('/:id/toggle', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const rem = db.get().reminders.find(r => r.id === id && r.userId === userId);
  if (!rem) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  rem.enabled = !rem.enabled;
  db.save();

  return res.json(rem);
});

// DELETE /api/reminders/:id
router.delete('/:id', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const index = db.get().reminders.findIndex(r => r.id === id && r.userId === userId);
  if (index === -1) {
    return res.status(404).json({ error: 'Reminder not found' });
  }

  db.get().reminders.splice(index, 1);
  db.save();

  return res.json({ success: true, message: 'Reminder removed' });
});

// ================= NOTIFICATIONS =================

// GET /api/reminders/notifications
router.get('/notifications', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notifications = db.get().notifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return res.json({ notifications, unreadCount });
});

// PUT /api/reminders/notifications/read-all
router.put('/notifications/read-all', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const notifs = db.get().notifications.filter(n => n.userId === userId);
  notifs.forEach(n => { n.isRead = true; });
  db.save();

  return res.json({ success: true, message: 'All marked as read' });
});

// PUT /api/reminders/notifications/:id/read
router.put('/notifications/:id/read', authenticateToken, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const id = req.params.id;

  const item = db.get().notifications.find(n => n.id === id && n.userId === userId);
  if (item) {
    item.isRead = true;
    db.save();
  }

  return res.json({ success: true });
});

export default router;
