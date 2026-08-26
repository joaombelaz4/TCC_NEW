import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { poolsRouter } from './routes/pools.js';
import { alertsRouter } from './routes/alerts.js';
import { settingsRouter } from './routes/settings.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

const app = express();
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/pools', poolsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/settings', settingsRouter);

// Serve apenas a pasta de build do frontend — nunca a raiz do projeto
// (package.json, create-db.sql, .env etc. não ficam expostos publicamente).
app.use(express.static(publicDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(config.port, () => {
  console.log(`Servidor rodando em http://localhost:${config.port}`);
});
