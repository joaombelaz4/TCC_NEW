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
mysql -h 127.0.0.1 -P 3306 -u root -p < create-db.sql
```

O uso de `-h 127.0.0.1` força a conexão TCP e evita problemas de permissão no
socket local. Se aparecer `Table 'users' already exists`, o banco já foi
inicializado e não é necessário executar o script novamente.

Para confirmar que as tabelas estão disponíveis, execute:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p -e "USE tcc; SHOW TABLES;"
```

Se esse comando terminar com `Exit code: 0` e listar `users`, `pools`,
`pool_history`, `pool_alerts` e `app_settings`, o banco está pronto. O erro
`ERROR 1050 (42S01): Table 'users' already exists` apenas informa que a tabela
já existe; não é necessário recriá-la.

### 2. Backend

```bash
npm install
cp .env.example .env   # preencha DB_PASSWORD com a senha do MySQL
npm run dev             # sobe em http://localhost:3000
```

O arquivo `.env` deve usar `DB_HOST=127.0.0.1`, a senha correta em
`DB_PASSWORD` e um valor para `JWT_SECRET`.

### 3. Frontend (em outro terminal)

```bash
cd web
npm install
npm run dev              # sobe em http://localhost:5173, com proxy de /api para o backend
```

Abra `http://localhost:5173`. Crie uma conta, cadastre uma piscina e registre
uma medição pelo botão "Registrar medição" no Dashboard — é assim que o
sistema tem dados reais para mostrar hoje, antes do ESP32 existir.

### 4. Build e execução em uma única porta

```bash
cd web && npm run build   # gera ../public, servido pelo Express
cd .. && npm start
```

Nesse modo, abra `http://localhost:3000`. Para desenvolvimento com atualização
automática, use os dois terminais da seção anterior e abra `http://localhost:5173`.

### Próxima vez

Com o MySQL já instalado e o banco já criado, basta executar:

Terminal 1, na raiz do projeto:

```bash
sudo service mysql start
npm run dev
```

Terminal 2, na pasta `web/`:

```bash
npm run dev
```

Abra `http://localhost:5173`.

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
