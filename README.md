# AquaMonitor

Aplicação web para cadastrar piscinas, acompanhar o pH atual e consultar o histórico de medições. O pH pode ser registrado manualmente ou lido de um ESP32 pela porta serial do navegador.

## Tecnologias

- Backend: Node.js, Express e MySQL
- Frontend: React, TypeScript, Vite e Recharts
- Comunicação com o ESP32: Web Serial API, via USB

## Requisitos

- Node.js 20.19 ou superior e npm
- Docker com acesso ao daemon
- Chrome ou Edge para conectar o ESP32 pelo navegador

Execute os comandos abaixo na raiz do projeto.

## Configuração inicial

### 1. Criar o arquivo de ambiente

Este comando preserva um `.env` que já exista:

```bash
cp -n .env.example .env
```

Confira os valores de `DB_HOST`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`. Para uso local, troque também o valor de exemplo de `JWT_SECRET` por uma chave aleatória.

### 2. Criar o banco MySQL

Execute este comando **uma única vez**. Ele cria o container, o volume persistente e importa `create-db.sql` na primeira inicialização:

```bash
docker run --name aquamonitor-mysql --detach --restart unless-stopped \
  --publish 3306:3306 \
  --env MYSQL_ROOT_PASSWORD=tcc2026 \
  --env MYSQL_DATABASE=tcc \
  --volume aquamonitor-mysql-data:/var/lib/mysql \
  --volume "$PWD/create-db.sql:/docker-entrypoint-initdb.d/001-create-db.sql:ro" \
  mysql:8.0
```

Os valores de `MYSQL_ROOT_PASSWORD` e `MYSQL_DATABASE` precisam corresponder a `DB_PASSWORD` e `DB_NAME` no `.env`. Se personalizar esses valores, ajuste o comando antes de criar o container. Nas próximas inicializações, use apenas:

```bash
docker start aquamonitor-mysql
```

### 3. Instalar dependências

```bash
npm install
npm --prefix web install
```

### 4. Atualizar um banco já existente

Se o banco foi criado antes de a aplicação aceitar leituras sem cloro, aplique esta migração uma vez. Bancos novos já recebem o schema atualizado por `create-db.sql`.

```bash
docker exec -i -e MYSQL_PWD="$(sed -n 's/^DB_PASSWORD=//p' .env)" aquamonitor-mysql mysql -uroot "$(sed -n 's/^DB_NAME=//p' .env)" < migrations/001-allow-ph-only-readings.sql
```

## Executar

Com o MySQL ativo, escolha um dos modos.

### Express com frontend compilado

O comando compila o frontend e inicia a aplicação em http://localhost:3000:

```bash
npm run dev
```

### Vite para desenvolvimento

Abra dois terminais na raiz do projeto.

Terminal 1, backend:

```bash
npm run dev
```

Terminal 2, frontend:

```bash
npm --prefix web run dev
```

Abra http://localhost:5173. O Vite encaminha as chamadas da API ao backend em `localhost:3000`.

Crie uma conta no formulário de cadastro e registre uma piscina. O banco não inclui usuário de demonstração.

## Conectar o ESP32

1. Abra o app no Chrome ou Edge e entre na sua conta.
2. Selecione a piscina que receberá as medições e abra o Dashboard.
3. Feche o Monitor Serial do Arduino IDE, pois ele e o navegador não podem usar a mesma porta ao mesmo tempo.
4. Clique em **Conectar ESP32** e selecione a porta USB da placa. A velocidade deve ser 115200 baud.

O painel exibe as linhas `pH Value: ...` em tempo real e salva uma leitura na piscina selecionada a cada 30 segundos. A leitura é autenticada pelo backend. Como o sensor conectado mede apenas pH, o cloro fica vazio no histórico (`--`), sem valor inventado.

O navegador precisa oferecer Web Serial e ter acesso à porta USB. A API Web Serial funciona em contexto seguro, como `localhost` ou HTTPS.

## Firmware Arduino

`arduino/phmetro.txt` é uma cópia de referência do código; editá-lo não altera o firmware gravado no ESP32. Para mudar o programa da placa, abra ou copie o código para um sketch `.ino` no Arduino IDE, selecione a placa e a porta e use **Upload**. Grave apenas depois de conferir as configurações de rede e calibração.

O firmware de referência também contém envio ao Google Sheets. Esse envio é separado da integração do site: o Dashboard recebe a leitura serial pelo navegador.

## Estrutura do projeto

```text
server/           API Express, autenticação e acesso ao banco
web/              Aplicação React e configuração do Vite
arduino/          Código-fonte de referência do ESP32
create-db.sql     Schema para bancos novos
migrations/       Migrações para bancos existentes
.env.example      Exemplo de configuração local
```
