/**
 * Validazione delle variabili d'ambiente all'avvio.
 * Se una variabile obbligatoria manca o è insicura, l'applicazione NON parte:
 * meglio un crash immediato che un server avviato con un segreto di default noto.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length < 32) {
    throw new Error(
      'JWT_SECRET mancante o troppo corto: impostare una chiave di almeno 32 caratteri in backend/.env',
    );
  }

  if (typeof config.DATABASE_URL !== 'string' || config.DATABASE_URL.trim() === '') {
    throw new Error('DATABASE_URL mancante: impostarla in backend/.env');
  }

  return config;
}
