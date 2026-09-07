# RegexRiddle

Piattaforma per creare e risolvere sfide basate su espressioni regolari.

## Stack

- Backend: NestJS, Prisma e PostgreSQL
- Frontend: Angular 18
- Test E2E: Playwright
- Avvio: Docker Compose

## Avvio con Docker

Richiede Docker Desktop in esecuzione.

```bash
docker compose up --build -d
```

- App: http://localhost:5173
- API: http://localhost:8080/api
- Swagger: http://localhost:8080/swagger-ui

Per fermare i container:

```bash
docker compose down
```

Il database è disponibile sulla porta `5433` e i dati restano nel volume Docker `pgdata`.

## Avvio locale

Servono Node.js 20+ e PostgreSQL. Crea `backend/.env` con:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/regexriddle
JWT_SECRET=una-chiave-casuale-di-almeno-32-caratteri
JWT_EXPIRATION=86400000
```

Poi avvia backend e frontend in due terminali:

```bash
cd backend
npm install
npm run start:dev
```

```bash
cd frontend
npm install
npm start
```

## Test

```bash
cd frontend
npm run test:e2e
```

## Endpoint principali

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/POST /api/challenges`
- `POST /api/challenges/:id/attempts`
- `GET/PUT /api/users/me`
- `POST /api/users/me/avatar`, `GET /api/users/:id/avatar`
- `GET /api/leaderboard`

## Sicurezza

Il backend usa JWT, validazione dei DTO, rate limiting, Helmet e Prisma. Le regex sono valutate in un worker con timeout contro ReDoS. Il frontend usa CSP e altri header di sicurezza tramite Nginx.

`JWT_SECRET` nel file Compose è adatto solo allo sviluppo locale: in produzione va fornito come secret o variabile d'ambiente.
