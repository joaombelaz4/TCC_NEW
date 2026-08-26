# AquaMonitor — Sistema de Monitoramento de pH de Piscinas (TCC)

Sistema web para cadastro de piscinas e acompanhamento de medições reais de pH,
cloro e temperatura. Pensado para futuramente receber leituras automáticas de
um ESP32 conectado a um pHmetro de baixo custo — hoje as leituras são
registradas manualmente pela interface, usando o mesmo formato que o ESP32
usará depois.

## Arquitetura

- **Backend** (`server/`): Node.js + Express + MySQL, API REST em JSON, autenticação por JWT.
- **Frontend** (`web/`): React 19 + Vite + Tailwind v4 + Recharts, consumindo a API.
- Nenhum dado fictício é exibido: piscinas, medições e alertas só aparecem quando existem de verdade no banco.

## Como rodar

### 1. Banco de dados

```bash
mysql -u root -p < create-db.sql
```

### 2. Backend

```bash
npm install
cp .env.example .env   # preencha DB_PASSWORD e um JWT_SECRET
npm run dev             # sobe em http://localhost:3000
```

### 3. Frontend (em outro terminal)

```bash
cd web
npm install
npm run dev              # sobe em http://localhost:5173, com proxy de /api para o backend
```

Abra `http://localhost:5173`. Crie uma conta, cadastre uma piscina e registre
uma medição pelo botão "Registrar medição" no Dashboard — é assim que o
sistema tem dados reais para mostrar hoje, antes do ESP32 existir.

### 4. Build de produção

```bash
cd web && npm run build   # gera ../public, servido pelo Express
cd .. && npm start
```

## Estrutura

```
server/
  index.js           # monta o Express e todas as rotas
  config.js           # variáveis de ambiente (.env)
  db.js               # pool de conexão MySQL
  middleware/auth.js   # valida o JWT
  routes/              # auth, pools, alerts, settings
  utils/validate.js    # validação de cadastro/login/piscina/medição
  shared/thresholds.js # limites de pH/cloro para classificar medições
web/
  src/
    lib/               # cliente de API, tipos
    context/           # AuthContext, PoolContext
    components/        # PhGauge, modais, EmptyState
    pages/              # Login, Dashboard, Historico, Graficos, Alertas, Configuracoes
create-db.sql          # schema completo (users, pools, pool_history, pool_alerts, app_settings)
```

## Preparado para o ESP32 (futuro)

A rota `POST /api/pools/:id/readings` (hoje usada pelo formulário manual de
medição) foi desenhada para que o ESP32 possa chamá-la diretamente no futuro,
sem mudar a arquitetura — só troca quem está do outro lado da requisição.
