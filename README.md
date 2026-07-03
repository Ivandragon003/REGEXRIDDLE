# WebTech's RegexRiddle

Piattaforma web per sfide basate su espressioni regolari.
Progetto per il corso di Tecnologie Web — UniNa Federico II — A.A. 2025/2026

Gli utenti registrati creano enigmi definendo una **regex segreta** e alcune stringhe di
controllo nascoste; gli altri provano a indovinare la regex, ricevendo a ogni tentativo il
numero di stringhe di controllo positive soddisfatte e negative correttamente escluse.

## Stack tecnologico

- **Backend**: Node.js + NestJS (TypeScript), Prisma ORM, Passport JWT, class-validator
- **Frontend**: Angular 18 (standalone components), Angular Router, Reactive Forms, HttpClient
- **Database**: PostgreSQL 17
- **Containerizzazione**: Docker + Docker Compose
- **Test E2E**: Playwright
- **Documentazione API**: Swagger (OpenAPI)

---

## Opzione 1 — Avvio completo con Docker (consigliato)

Un solo comando avvia database, backend e frontend.

### Prerequisiti
- Docker e Docker Compose installati

### Avvio
```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui

Il database PostgreSQL gira in un container ed è esposto sull'host alla porta **5433**
(per non confliggere con un eventuale PostgreSQL locale sulla 5432). I dati sono persistiti
nel volume Docker `pgdata`. Al primo avvio il DB viene popolato con utenti e sfide di esempio.

### Stop
```bash
docker compose down
```

> Per azzerare anche i dati del database: `docker compose down -v`.

---

## Opzione 2 — Avvio locale (sviluppo)

### Prerequisiti
- Node.js 20+ e npm
- Un PostgreSQL in esecuzione su `localhost:5432` con un database chiamato `regexriddle`

### 1. Configura il backend
Crea il file `backend/.env` copiando `backend/.env.example` e inserendo le tue credenziali
del database:
```bash
cd backend
cp .env.example .env   # poi modifica .env (DB_USERNAME, DB_PASSWORD, ...)
```

### 2. Avvia il backend
```bash
cd backend
npm install
npm run start:dev
```
Backend disponibile su http://localhost:8080

### 3. Avvia il frontend
```bash
cd frontend
npm install
npm start
```
Frontend disponibile su http://localhost:5173

---

## Configurazione del database

La connessione è definita da un'unica variabile `DATABASE_URL` (nel file `backend/.env`):

```
DATABASE_URL=postgresql://UTENTE:PASSWORD@HOST:PORTA/NOME_DB
```

Esempi:

| Ambiente | DATABASE_URL |
|---|---|
| Locale | `postgresql://postgres:postgres@localhost:5432/regexriddle` |
| Neon | `postgresql://user:password@ep-xxx.aws.neon.tech/regexriddle?sslmode=require` |
| Supabase | `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require` |

Lo schema (tabelle) viene allineato automaticamente da Prisma (`prisma db push`) all'avvio.
In sviluppo `npm run start:dev` esegue il push dello schema prima di avviare il server.

---

## Credenziali di test precaricate

| Username | Password |
|---|---|
| alice | password123 |
| bob | password123 |

---

## Esecuzione dei test E2E

Con backend e frontend in esecuzione in modalità locale:

```bash
cd frontend
npx playwright install   # solo la prima volta, scarica i browser
npx playwright test
npx playwright show-report
```

---

## Documentazione API

Swagger UI disponibile su http://localhost:8080/swagger-ui

Principali gruppi di endpoint:

- `Autenticazione` — `POST /api/auth/register`, `POST /api/auth/login`
- `Sfide` — `GET/POST /api/challenges`, `GET /api/challenges/{id}`, `GET /api/challenges/my`,
  `POST /api/challenges/{id}/attempts`, `GET /api/challenges/{id}/attempts`
- `Utenti` — `GET/PUT /api/users/me`, `POST /api/users/me/avatar`, `GET /api/users/{username}`
- `Classifica` — `GET /api/leaderboard`

---

## Struttura del progetto

```
.
├── backend/            NestJS (TypeScript), REST API + sicurezza JWT
│   ├── src/
│   │   ├── auth/        registrazione, login, strategia JWT
│   │   ├── users/       profilo e avatar
│   │   ├── challenges/  sfide, tentativi, valutazione regex
│   │   ├── leaderboard/ classifica
│   │   ├── regex/       valutatore regex con protezione ReDoS
│   │   └── seed/        dati di esempio iniziali
│   ├── .env.example    configurazione (copiare in .env)
│   └── Dockerfile
├── frontend/           Angular (Single Page Application, standalone components)
│   ├── src/app/
│   │   ├── core/         servizi (auth, tema, API), guard, interceptor
│   │   ├── shared/       componenti riusabili (avatar, challenge-card)
│   │   ├── navbar/       barra di navigazione
│   │   └── pages/        una pagina per route
│   ├── Dockerfile
│   └── nginx.conf      proxy /api e /uploads verso il backend
├── docker-compose.yml  db (PostgreSQL) + backend + frontend
└── README.md
```
