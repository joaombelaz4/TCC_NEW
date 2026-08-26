/**
 * ==========================================
 * CONFIGURAÇÃO DO SERVIDOR (VARIÁVEIS DE AMBIENTE)
 * ==========================================
 * Centraliza a leitura de variáveis de ambiente (arquivo .env, ver .env.example).
 * Nenhuma senha ou segredo fica hardcoded no código ou no package.json.
 */
import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: required('DB_PASSWORD'),
    database: process.env.DB_NAME || 'tcc',
  },
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
