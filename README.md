# AquaMonitor — Sistema de Monitoramento de pH de Piscinas (TCC)

Sistema web para cadastro de piscinas e acompanhamento de medições reais de pH, cloro e temperatura

## Stack

- **Backend**: Node.js + Express + MySQL, API REST com JWT
- **Frontend**: React 19 + Vite + Tailwind v4 + Recharts

## Como desenvolver

### Primeira configuração

Requisitos: Node.js, npm e Docker. No diretório do projeto, crie o arquivo de ambiente sem substituir um `.env` que já exista:
```bash
cp -n .env.example .env
```

O comando abaixo cria o container e o volume persistente do MySQL. O script `create-db.sql` é importado automaticamente na primeira inicialização. Os valores de senha e banco devem corresponder a `DB_PASSWORD` e `DB_NAME` no `.env`:
```bash
docker run --name aquamonitor-mysql --detach --restart unless-stopped \
	--publish 3306:3306 \
	--env MYSQL_ROOT_PASSWORD=tcc2026 \
	--env MYSQL_DATABASE=tcc \
	--volume aquamonitor-mysql-data:/var/lib/mysql \
	--volume "$PWD/create-db.sql:/docker-entrypoint-initdb.d/001-create-db.sql:ro" \
	mysql:8.0
```

Se você alterar `DB_PASSWORD` ou `DB_NAME` no `.env`, use os mesmos valores em `MYSQL_ROOT_PASSWORD` e `MYSQL_DATABASE` ao criar o container. Essa criação é feita uma única vez; nos próximos usos, inicie o container existente:
```bash
docker start aquamonitor-mysql
```

Instale as dependências do backend e do frontend:
```bash
npm install
npm --prefix web install
```

### Iniciar o app

Com o MySQL em execução, use um destes modos.

**Tudo pelo Express:** compila o frontend para `public/` e inicia o site em http://localhost:3000 (API em http://localhost:3000/api).
```bash
npm run dev
```

**Desenvolvimento com Vite:** abra dois terminais no diretório do projeto.

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Frontend:**
```bash
npm --prefix web run dev
```

Abra http://localhost:5173. O Vite encaminha as chamadas `/api` para o backend em `localhost:3000`.

Crie uma conta pelo formulário de cadastro; o banco não vem com usuário de demonstração.

### Leitura do ESP32 pelo navegador

No Chrome ou Edge, entre na conta, selecione a piscina que receberá as leituras e abra o Dashboard. Feche o Monitor Serial do Arduino IDE, clique em **Conectar ESP32**, escolha a porta da placa e mantenha a velocidade em 115200 baud. O navegador atualiza o pH ao vivo e salva uma leitura na piscina selecionada a cada 30 segundos, sem preencher cloro.

Para bancos criados antes desta integração, aplique a migração uma vez:
```bash
docker exec -i -e MYSQL_PWD="$(sed -n 's/^DB_PASSWORD=//p' .env)" aquamonitor-mysql mysql -uroot "$(sed -n 's/^DB_NAME=//p' .env)" < migrations/001-allow-ph-only-readings.sql
```

O navegador precisa permitir acesso à porta serial; `localhost` e HTTPS são origens seguras. A porta USB precisa estar visível ao navegador. A leitura serial é gravada no backend autenticado do projeto, não enviada ao Google Sheets.

## Estrutura

```
server/           Backend Node.js + Express
web/              Frontend React + Vite
create-db.sql     Schema do banco MySQL
.env              Variáveis de ambiente (copiar de .env.example)
```
