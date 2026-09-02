# AquaMonitor — Sistema de Monitoramento de pH de Piscinas (TCC)

Sistema web para cadastro de piscinas e acompanhamento de medições reais de pH, cloro e temperatura.

## Stack

- **Backend**: Node.js + Express + MySQL, API REST com JWT
- **Frontend**: React 19 + Vite + Tailwind v4 + Recharts

## Como desenvolver

### 1. Inicie o MySQL
```bash
sudo service mysql start
```

### 2. Acesse o projeto
```bash
cd /workspaces/TCC_NEW
```

### 3. Inicie tudo
```bash
npm run dev
```

Isso inicia o servidor (http://localhost:3000/api) e o frontend (http://localhost:5173) automaticamente.

### Alternativa: terminais separados

**Terminal 1 — Backend:**
```bash
node server/index.js
```

**Terminal 2 — Frontend:**
```bash
cd web && npm run dev
```

### Login
- **Email**: joao@test.com
- **Senha**: senha123456

Ou crie uma conta nova no formulário de registro.
```

## Estrutura

```
server/           Backend Node.js + Express
web/              Frontend React + Vite
create-db.sql     Schema do banco MySQL
.env              Variáveis de ambiente (copiar de .env.example)
```
