CREATE DATABASE IF NOT EXISTS tcc
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tcc;

-- Usuários do sistema.
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email)
);

-- Piscinas cadastradas por cada usuário.
-- current_ph / current_cl / temp / last_reading_at ficam NULL até a primeira
-- medição real chegar (manual ou, futuramente, via ESP32). Nunca preenchemos
-- esses campos com valores inventados apenas para o dashboard não ficar vazio.
CREATE TABLE pools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  size VARCHAR(30) DEFAULT NULL,
  current_ph DECIMAL(4,2) DEFAULT NULL,
  current_cl DECIMAL(4,2) DEFAULT NULL,
  temp DECIMAL(4,1) DEFAULT NULL,
  last_reading_at DATETIME DEFAULT NULL,
  readings INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Histórico de leituras que alimenta a página de histórico e os gráficos.
-- Cada linha é uma medição real: hoje inserida manualmente pelo usuário
-- (POST /api/pools/:id/readings), futuramente pelo ESP32 com o mesmo formato.
CREATE TABLE pool_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pool_id INT NOT NULL,
  recorded_at DATETIME NOT NULL,
  ph DECIMAL(4,2) NOT NULL,
  cl DECIMAL(4,2) NOT NULL,
  temp DECIMAL(4,1) NOT NULL,
  status ENUM('ok','warn','danger') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

-- Alertas do sistema, gerados a partir de medições reais fora da faixa
-- ideal (ver server/routes/pools.js). Nenhum alerta é inserido manualmente
-- aqui como dado de exemplo.
CREATE TABLE pool_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pool_id INT NOT NULL,
  type ENUM('ok','warn','danger') NOT NULL,
  title VARCHAR(255) NOT NULL,
  msg TEXT NOT NULL,
  occurred_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
);

-- Parâmetros de configuração do aplicativo (não são medições, são limites
-- de referência do sistema — por isso têm valores padrão desde o início).
CREATE TABLE app_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO app_settings (setting_key, setting_value, description) VALUES
  ('ph_min', '7.2', 'Limite mínimo de pH para condição normal'),
  ('ph_max', '7.8', 'Limite máximo de pH para condição normal'),
  ('cl_min', '0.5', 'Limite mínimo de cloro para condição normal'),
  ('cl_max', '3.0', 'Limite máximo de cloro para condição normal'),
  ('sensor_frequency', '30m', 'Frequência de leitura do sensor em minutos');
