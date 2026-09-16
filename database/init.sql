CREATE TABLE "users" (
  "id" SERIAL NOT NULL,
  "username" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatarData" BYTEA,
  "avatarMime" TEXT,
  "avatarUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "challenges" (
  "id" SERIAL NOT NULL,
  "authorId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "exampleMatch" TEXT NOT NULL,
  "exampleNoMatch" TEXT NOT NULL,
  "secretRegex" TEXT NOT NULL,
  "controlStringsPositive" JSONB NOT NULL,
  "controlStringsNegative" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "challenges_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "challenges_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "challenges_authorId_idx" ON "challenges"("authorId");

CREATE TABLE "attempts" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "challengeId" INTEGER NOT NULL,
  "proposedRegex" TEXT NOT NULL,
  "positiveMatched" INTEGER NOT NULL,
  "negativeMatched" INTEGER NOT NULL,
  "totalPositive" INTEGER NOT NULL,
  "totalNegative" INTEGER NOT NULL,
  "solved" BOOLEAN NOT NULL,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "attempts_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "attempts_challengeId_idx" ON "attempts"("challengeId");
CREATE INDEX "attempts_userId_idx" ON "attempts"("userId");
CREATE INDEX "attempts_userId_solved_idx" ON "attempts"("userId", "solved");

INSERT INTO "users" ("id", "username", "email", "passwordHash", "createdAt") VALUES
  (1, 'alice', 'alice@example.com', '$2a$10$zmrUqf43SOSTJhN3QNsC5uIaQuh9nI77wouLJtgZL//ToKlFIlZHO', '2026-09-01 09:00:00'),
  (2, 'bruno_pattern', 'bruno@example.test', '$2a$10$edLQPl8jI9q9qvSlOE7TleydP/8GQFoWk69QIboVy7bKOp8DFRx5m', '2026-09-01 09:05:00'),
  (3, 'chiara_match', 'chiara@example.test', '$2a$10$edLQPl8jI9q9qvSlOE7TleydP/8GQFoWk69QIboVy7bKOp8DFRx5m', '2026-09-01 09:10:00'),
  (4, 'diego_escape', 'diego@example.test', '$2a$10$edLQPl8jI9q9qvSlOE7TleydP/8GQFoWk69QIboVy7bKOp8DFRx5m', '2026-09-01 09:15:00'),
  (5, 'elena_anchor', 'elena@example.test', '$2a$10$edLQPl8jI9q9qvSlOE7TleydP/8GQFoWk69QIboVy7bKOp8DFRx5m', '2026-09-01 09:20:00');

INSERT INTO "challenges" ("id", "authorId", "title", "description", "exampleMatch", "exampleNoMatch", "secretRegex", "controlStringsPositive", "controlStringsNegative", "createdAt") VALUES
  (1, 1, 'Solo lettere minuscole', 'Accetta parole composte esclusivamente da lettere minuscole.', 'regex', 'Regex42', '^[a-z]+$', '["ciao", "esame", "pattern"]', '["Ciao", "abc123", "due parole"]', '2026-09-02 10:00:00'),
  (2, 2, 'Codice prodotto', 'Un codice con prefisso, tre cifre e una sigla finale.', 'PRD-042-IT', 'PRD-42-IT', '^PRD-\d{3}-[A-Z]{2}$', '["PRD-001-AA", "PRD-999-ZZ", "PRD-120-UX"]', '["prd-001-AA", "PRD-001-A", "PRD-001-AAA"]', '2026-09-02 10:10:00'),
  (3, 3, 'Email aziendale', 'Indirizzi aziendali nel dominio example.com.', 'mario.rossi@example.com', 'mario@example.com', '^[a-z]+\.[a-z]+@example\.com$', '["anna.verdi@example.com", "luca.bianchi@example.com"]', '["Anna.verdi@example.com", "anna.verdi@gmail.com", "annaverdi@example.com"]', '2026-09-02 10:20:00'),
  (4, 4, 'Data in formato ISO', 'Una data nel formato anno-mese-giorno.', '2026-09-14', '14/09/2026', '^\d{4}-\d{2}-\d{2}$', '["1999-01-01", "2024-12-31", "2030-06-15"]', '["2024-1-01", "2024/01/01", "24-01-01"]', '2026-09-02 10:30:00'),
  (5, 5, 'Numero pari di quattro cifre', 'Quattro cifre, con l''ultima necessariamente pari.', '1234', '1235', '^\d{3}[02468]$', '["0000", "9876", "2468"]', '["123", "1235", "12340"]', '2026-09-02 10:40:00'),
  (6, 1, 'Tag HTML semplice', 'Riconosce un tag di apertura formato da lettere minuscole.', '<section>', '</section>', '^<[a-z]+>$', '["<div>", "<span>", "<article>"]', '["<DIV>", "</div>", "<div class=\"x\">"]', '2026-09-02 10:50:00');

INSERT INTO "attempts" ("userId", "challengeId", "proposedRegex", "positiveMatched", "negativeMatched", "totalPositive", "totalNegative", "solved", "attemptedAt") VALUES
  (2, 1, '^.*$', 3, 0, 3, 3, FALSE, '2026-09-03 09:00:00'),
  (2, 1, '^[a-z]+$', 3, 3, 3, 3, TRUE, '2026-09-03 09:05:00'),
  (3, 1, '^[a-z]+$', 3, 3, 3, 3, TRUE, '2026-09-03 09:10:00'),
  (1, 2, '^PRD-\d{3}-[A-Z]{2}$', 3, 3, 3, 3, TRUE, '2026-09-03 09:15:00'),
  (4, 2, '^PRD-\d{3}-[A-Z]+$', 3, 2, 3, 3, FALSE, '2026-09-03 09:20:00'),
  (4, 2, '^PRD-\d{3}-[A-Z]{2}$', 3, 3, 3, 3, TRUE, '2026-09-03 09:25:00'),
  (5, 3, '^[a-z.]+@example\.com$', 2, 2, 2, 3, FALSE, '2026-09-03 09:30:00'),
  (5, 3, '^[a-z]+\.[a-z]+@example\.com$', 2, 3, 2, 3, TRUE, '2026-09-03 09:35:00'),
  (1, 4, '^\d{4}-\d{2}-\d{2}$', 3, 3, 3, 3, TRUE, '2026-09-03 09:40:00'),
  (2, 4, '^\d{4}-\d{2}-\d{2}$', 3, 3, 3, 3, TRUE, '2026-09-03 09:45:00'),
  (3, 5, '^\d{3}[02468]$', 3, 3, 3, 3, TRUE, '2026-09-03 09:50:00'),
  (4, 6, '^<[a-z]+>$', 3, 3, 3, 3, TRUE, '2026-09-03 09:55:00');

SELECT setval('users_id_seq', 5, true);
SELECT setval('challenges_id_seq', 6, true);
SELECT setval('attempts_id_seq', 12, true);
