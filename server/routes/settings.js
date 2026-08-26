import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const settingsRouter = Router();

settingsRouter.use(requireAuth);

// GET /api/settings — configurações globais do sistema.
settingsRouter.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM app_settings');
    res.json(Object.fromEntries(rows.map(row => [row.setting_key, row.setting_value])));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao carregar as configurações.' });
  }
});

// POST /api/settings — atualiza (ou cria) configurações globais.
settingsRouter.post('/', async (req, res) => {
  const updates = req.body;
  if (typeof updates !== 'object' || updates === null || Array.isArray(updates)) {
    return res.status(400).json({ error: 'Corpo da requisição inválido.' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    for (const [key, value] of Object.entries(updates)) {
      const [result] = await connection.query(
        'UPDATE app_settings SET setting_value = ? WHERE setting_key = ?',
        [String(value), key],
      );
      if (result.affectedRows === 0) {
        await connection.query(
          'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
          [key, String(value)],
        );
      }
    }
    await connection.commit();
    res.json({ ok: true });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Falha ao atualizar as configurações.' });
  } finally {
    connection.release();
  }
});
