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

### 1. Primeira configuração

Instale o MySQL somente se ele ainda não estiver instalado:

```bash
sudo apt-get update
sudo apt-get install -y mysql-server
```

Inicie o serviço e crie as tabelas do projeto:

```bash
sudo service mysql start
mysql -h 127.0.0.1 -P 3306 -u root -p < create-db.sql (Só não primeira config)
```

O uso de `-h 127.0.0.1` força a conexão TCP e evita problemas de permissão no
socket local. O comando `mysql ... < create-db.sql` lê o arquivo
`create-db.sql` e cria o banco `tcc` e suas tabelas.

**Esse comando ainda precisa ser executado nas próximas vezes?** Não. Ele só é
necessário na primeira configuração ou em um banco novo. Se aparecer
`ERROR 1050 (42S01): Table 'users' already exists`, significa que as tabelas já
foram criadas. Nesse caso, não apague nem recrie o banco: prossiga para iniciar
o backend.

Configure o ambiente do backend uma única vez:

```bash
cp .env.example .env
```

Edite `.env` e confira `DB_HOST=127.0.0.1`, a senha correta em `DB_PASSWORD` e
um valor para `JWT_SECRET`.

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
npm install                 # somente na primeira configuração
npm run dev              # sobe em http://localhost:3000
```

### 3. Frontend (em outro terminal)

```bash
cd web
npm install                 # somente na primeira configuração
```

Depois, para desenvolvimento, inicie o backend na raiz e o frontend em outro
terminal:

Terminal 1, na raiz do projeto:

```bash
npm run dev
```

Terminal 2, na pasta `web/`:

```bash
npm run dev              # sobe em http://localhost:5173, com proxy de /api
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

Com o MySQL já instalado, o banco já criado e o arquivo `.env` já configurado,
basta executar:

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

Não é necessário executar novamente `apt-get install`, `npm install`,
`create-db.sql` ou `cp .env.example .env`. O cadastro de usuários, piscinas e
medições fica salvo no MySQL, não no Git. Se `users already exists` aparecer,
isso confirma que o banco já contém essa tabela.

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
