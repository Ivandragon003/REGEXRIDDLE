FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 8080
# Allinea lo schema del database e avvia l'applicazione
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
