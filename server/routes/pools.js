import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { validatePool, validateReading } from '../utils/validate.js';
import { phStatus, clStatus } from '../shared/thresholds.js';

export const poolsRouter = Router();

poolsRouter.use(requireAuth);

function mapPool(row) {
  return {
    id: row.id,
    name: row.name,
    size: row.size,
    // null enquanto a piscina não tiver nenhuma medição registrada —
    // o frontend deve tratar isso como "sem dados", nunca inventar um valor.
    pH: row.current_ph !== null ? Number(row.current_ph) : null,
    cl: row.current_cl !== null ? Number(row.current_cl) : null,
    temp: row.temp !== null ? Number(row.temp) : null,
    lastReadingAt: row.last_reading_at,
    readings: row.readings,
  };
}

async function findOwnedPool(poolId, userId) {
  const [rows] = await db.query('SELECT * FROM pools WHERE id = ? AND user_id = ?', [poolId, userId]);
  return rows[0] ?? null;
}

// GET /api/pools — lista somente as piscinas do usuário autenticado.
poolsRouter.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pools WHERE user_id = ? ORDER BY id', [req.userId]);
    res.json(rows.map(mapPool));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao carregar as piscinas.' });
  }
});

// POST /api/pools — cadastra uma piscina nova para o usuário autenticado.
poolsRouter.post('/', async (req, res) => {
  const errors = validatePool(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const name = req.body.name.trim();
  const size = typeof req.body.size === 'string' && req.body.size.trim() ? req.body.size.trim() : null;

  try {
    const [result] = await db.query(
      'INSERT INTO pools (user_id, name, size) VALUES (?, ?, ?)',
      [req.userId, name, size],
    );
    const pool = await findOwnedPool(result.insertId, req.userId);
    res.status(201).json(mapPool(pool));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao cadastrar a piscina.' });
  }
});

// GET /api/pools/:id — detalhe de uma piscina específica do usuário.
poolsRouter.get('/:id', async (req, res) => {
  const poolId = Number(req.params.id);
  if (!poolId) return res.status(400).json({ error: 'Id de piscina inválido.' });

  try {
    const pool = await findOwnedPool(poolId, req.userId);
    if (!pool) return res.status(404).json({ error: 'Piscina não encontrada.' });
    res.json(mapPool(pool));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao carregar a piscina.' });
  }
});

// GET /api/pools/:id/history — histórico real de medições da piscina.
poolsRouter.get('/:id/history', async (req, res) => {
  const poolId = Number(req.params.id);
  if (!poolId) return res.status(400).json({ error: 'Id de piscina inválido.' });

  const limit = Number(req.query.limit) || 1000;

  try {
    const pool = await findOwnedPool(poolId, req.userId);
    if (!pool) return res.status(404).json({ error: 'Piscina não encontrada.' });

    const [rows] = await db.query(
      'SELECT recorded_at, ph, cl, temp, status FROM pool_history WHERE pool_id = ? ORDER BY recorded_at DESC LIMIT ?',
      [poolId, limit],
    );
    res.json(rows.map(row => ({
      recordedAt: row.recorded_at,
      ph: Number(row.ph),
      cl: Number(row.cl),
      temp: Number(row.temp),
      status: row.status,
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao carregar o histórico.' });
  }
});

/**
 * POST /api/pools/:id/readings — registra uma medição real.
 *
 * Hoje é chamada manualmente pelo usuário (tela de registro de leitura).
 * O formato do payload ({ ph, cl, temp }) foi desenhado para que, futuramente,
 * o ESP32 possa chamar exatamente esta mesma rota sem precisar de nenhuma
 * mudança de arquitetura — só troca quem está do outro lado da requisição.
 */
poolsRouter.post('/:id/readings', async (req, res) => {
  const poolId = Number(req.params.id);
  if (!poolId) return res.status(400).json({ error: 'Id de piscina inválido.' });

  const errors = validateReading(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { ph, cl, temp } = req.body;
  const connection = await db.getConnection();

  try {
    const pool = await findOwnedPool(poolId, req.userId);
    if (!pool) {
      connection.release();
      return res.status(404).json({ error: 'Piscina não encontrada.' });
    }

    const status = phStatus(ph) === 'danger' || clStatus(cl) === 'danger' ? 'danger'
      : phStatus(ph) === 'warn' || clStatus(cl) === 'warn' ? 'warn'
      : 'ok';
    const recordedAt = new Date();

    await connection.beginTransaction();

    await connection.query(
      'INSERT INTO pool_history (pool_id, recorded_at, ph, cl, temp, status) VALUES (?, ?, ?, ?, ?, ?)',
      [poolId, recordedAt, ph, cl, temp, status],
    );

    await connection.query(
      `UPDATE pools
       SET current_ph = ?, current_cl = ?, temp = ?, last_reading_at = ?, readings = readings + 1
       WHERE id = ?`,
      [ph, cl, temp, recordedAt, poolId],
    );

    if (status !== 'ok') {
      const title = status === 'danger' ? 'Parâmetro fora da faixa segura' : 'Parâmetro próximo do limite';
      const msg = `pH ${ph.toFixed(2)} · Cloro ${cl.toFixed(2)} ppm`;
      await connection.query(
        'INSERT INTO pool_alerts (pool_id, type, title, msg, occurred_at) VALUES (?, ?, ?, ?, ?)',
        [poolId, status, title, msg, recordedAt],
      );
    }

    await connection.commit();

    const updatedPool = await findOwnedPool(poolId, req.userId);
    res.status(201).json(mapPool(updatedPool));
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Falha ao registrar a medição.' });
  } finally {
    connection.release();
  }
});
