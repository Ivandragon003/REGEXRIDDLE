import { test, expect } from '@playwright/test';

function testUser() {
  const suffix = `${Date.now().toString(36)}${Math.floor(Math.random() * 10_000)}`;
  return {
    username: `e2e${suffix}`,
    email: `e2e-${suffix}@example.test`,
    password: 'Password123!',
  };
}

test('la landing page si carica con il titolo corretto', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('regex');
});

test('la navbar porta alla pagina Sfide', async ({ page }) => {
  await page.goto('/');
  await page.locator('nav').getByRole('link', { name: 'Sfide' }).click();
  await expect(page).toHaveURL(/\/sfide/);
  await expect(page.getByRole('heading', { name: 'Sfide' })).toBeVisible();
});

test('le sfide e le loro statistiche sono visibili senza accesso', async ({ page }) => {
  await page.goto('/sfide');
  await expect(page.getByRole('heading', { name: 'Sfide' })).toBeVisible();
  await expect(page.getByText('Qualcosa è andato storto')).not.toBeVisible();
  await page.locator('app-challenge-card').first().click();
  await expect(page.getByLabel('Statistiche della sfida')).toBeVisible();
  await expect(page.getByText('Accedi per partecipare alla sfida.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Il tuo tentativo' })).not.toBeVisible();
});

test('la navbar porta alla pagina Classifica', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Classifica' }).click();
  await expect(page).toHaveURL(/\/classifica/);
});

test('una rotta inesistente mostra la pagina 404', async ({ page }) => {
  await page.goto('/questa-pagina-non-esiste');
  await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Torna alla home' })).toHaveAttribute('href', '/');
});

test('il login mostra gli errori dei campi obbligatori', async ({ page }) => {
  await page.goto('/login');
  await page.locator('form').getByRole('button', { name: 'Accedi' }).click();
  await expect(page.getByText('Inserisci email o username')).toBeVisible();
  await expect(page.getByText('La password è obbligatoria')).toBeVisible();
});

test('la registrazione segnala password non coincidenti', async ({ page }) => {
  await page.goto('/registrati');
  await page.locator('#username').fill('utente-test');
  await page.locator('#email').fill('utente@example.test');
  await page.locator('#password').fill('Password123!');
  await page.locator('#confirmPassword').fill('PasswordDiversa!');
  await page.locator('form').getByRole('button', { name: 'Crea account' }).click();
  await expect(page.getByText('Le password non coincidono')).toBeVisible();
});

test('la registrazione crea un utente e avvia la sessione', async ({ page }) => {
  const user = testUser();
  await page.goto('/registrati');
  await page.locator('#username').fill(user.username);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#confirmPassword').fill(user.password);
  await page.locator('form').getByRole('button', { name: 'Crea account' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.userButton')).toContainText(user.username);
});

test('un utente autenticato può creare una sfida', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#identifier').fill('bruno_pattern');
  await page.locator('#password').fill('Password123!');
  await page.locator('form').getByRole('button', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.userButton')).toContainText('bruno_pattern');

  const challengeTitle = `Sfida E2E ${Date.now()}`;
  await page.goto('/sfide/nuova');
  await page.locator('#title').fill(challengeTitle);
  await page.locator('#secretRegex').fill('^[a-z]+$');
  await page.locator('#exampleMatch').fill('abc');
  await page.locator('#exampleNoMatch').fill('123');
  await page.getByRole('textbox', { name: 'Positive 1' }).fill('xyz');
  await page.getByRole('textbox', { name: 'Negative 1' }).fill('456');
  await page.getByRole('button', { name: 'Crea sfida' }).click();

  await expect(page).toHaveURL(/\/sfide\/[^/]+$/);
  await expect(page.getByRole('heading', { name: challengeTitle })).toBeVisible();
});

test('la pagina sfide protetta reindirizza al login se non autenticati', async ({ page }) => {
  await page.goto('/sfide/nuova');
  await expect(page).toHaveURL(/\/login/);
});
