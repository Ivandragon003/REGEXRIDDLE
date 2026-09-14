# RegexRiddle

Applicazione full-stack per creare e risolvere sfide basate su espressioni regolari.

## Avvio con Docker

### Prerequisiti

- Docker Desktop installato e in esecuzione.
- Porte locali libere: `5173`, `8080` e `5433`.

### Avvio

Apri un terminale nella cartella radice del progetto ed esegui:

~~~bash
docker compose up --build -d
~~~

Docker crea e avvia:

- frontend Angular su http://localhost:5173;
- API NestJS su http://localhost:8080/api;
- documentazione Swagger su http://localhost:8080/swagger-ui;
- database PostgreSQL esposto localmente sulla porta `5433`.

Il primo avvio crea lo schema del database e carica automaticamente i dati dimostrativi inclusi
nel progetto.

Per controllare lo stato dei container:

~~~bash
docker compose ps
~~~

Per leggere i log del backend:

~~~bash
docker compose logs -f backend
~~~

Per fermare i container mantenendo i dati:

~~~bash
docker compose down
~~~

Per eliminare anche il database e ripartire dai dati dimostrativi iniziali:

~~~bash
docker compose down -v
docker compose up --build -d
~~~

## Avvio locale senza Docker

### Prerequisiti

- Node.js 20 o superiore;
- PostgreSQL in esecuzione;
- un database chiamato `regexriddle`.

Crea `backend/.env` a partire da `backend/.env.example`, impostando almeno:

~~~env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/regexriddle
JWT_SECRET=una-chiave-casuale-di-almeno-32-caratteri
JWT_EXPIRATION=86400000
~~~

In un primo terminale avvia backend e database:

~~~bash
cd backend
npm install
npm run db:push
npm run start:dev
~~~

In un secondo terminale avvia il frontend:

~~~bash
cd frontend
npm install
npm start
~~~

Il frontend locale è disponibile su http://localhost:5173 e usa l'API all'indirizzo
http://localhost:8080/api.

## Test E2E

Con backend e frontend in esecuzione, oppure dopo l'avvio con Docker, esegui:

~~~bash
cd frontend
npm install
npm run test:e2e
~~~
