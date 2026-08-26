import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { config } from '../config.js';
import { validateRegister, validateLogin } from '../utils/validate.js';

export const authRouter = Router();

const PASSWORD_SALT_ROUNDS = 10;

function signToken(userId) {
  return jwt.sign({ sub: userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function publicUser(row) {
  return { id: row.id, name: row.name, email: row.email };
}

// POST /api/auth/register — cria uma conta nova.
authRouter.post('/register', async (req, res) => {
  const errors = validateRegister(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const name = req.body.name.trim();
  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ errors: ['Já existe uma conta cadastrada com este e-mail.'] });
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    );

    const user = { id: result.insertId, name, email };
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao criar a conta.' });
  }
});

// POST /api/auth/login — autentica um usuário já cadastrado.
authRouter.post('/login', async (req, res) => {
  const errors = validateLogin(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const email = req.body.email.trim().toLowerCase();
  const { password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    // Mensagem genérica de propósito: não revela se o e-mail existe ou não.
    const invalidCredentials = () => res.status(401).json({ errors: ['E-mail ou senha inválidos.'] });

    if (!user) return invalidCredentials();

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) return invalidCredentials();

    const token = signToken(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Falha ao autenticar.' });
  }
});
