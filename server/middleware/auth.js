import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/**
 * Exige um token JWT válido no header Authorization: Bearer <token>.
 * Em caso de sucesso, disponibiliza req.userId para as rotas seguintes.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticação ausente.' });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}
