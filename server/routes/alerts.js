import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const alertsRouter = Router();

alertsRouter.use(requireAuth);

// GET /api/alerts — alertas apenas das piscinas do usuário autenticado.
alertsRouter.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT pa.id, pa.type, pa.title, pa.msg, pa.occurred_at, p.name AS pool_name
       FROM pool_alerts pa
       JOIN pools p ON pa.pool_id = p.id
       WHERE p.user_id = ?
       ORDER BY pa.occurred_at DESC`,
      [req.userId],
    );
    res.json(rows.map(row => ({
      id: row.id,
      pool: row.pool_name,
      type: row.type,
      title: row.title,
      msg: row.msg,
      occurredAt: row.occurred_at,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao carregar os alertas.' });
  }
});
