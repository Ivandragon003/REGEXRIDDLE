import { test, expect } from '@playwright/test';

test('la landing page si carica con il titolo corretto', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('regex');
});

test('la navbar porta alla pagina Sfide', async ({ page }) => {
  await page.goto('/');
  await page.locator('nav').getByRole('link', { name: 'Sfide' }).click();
  await expect(page).toHaveURL(/\/sfide/);
});

test('la navbar porta alla pagina Classifica', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Classifica' }).click();
  await expect(page).toHaveURL(/\/classifica/);
});

test('la navbar porta alla pagina Come funziona', async ({ page }) => {
  await page.goto('/');
  await page.locator('nav').getByRole('link', { name: 'Come funziona' }).click();
  await expect(page).toHaveURL(/\/come-funziona/);
});

test('una rotta inesistente mostra la pagina 404', async ({ page }) => {
  await page.goto('/questa-pagina-non-esiste');
  await expect(page.locator('body')).not.toBeEmpty();
});

test('il link Accedi porta alla pagina di login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Accedi' }).click();
  await expect(page).toHaveURL(/\/login/);
});

test('il link Registrati porta alla pagina di registrazione', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Registrati' }).click();
  await expect(page).toHaveURL(/\/registrati/);
});

test('la pagina sfide protetta reindirizza al login se non autenticati', async ({ page }) => {
  await page.goto('/sfide/nuova');
  await expect(page).toHaveURL(/\/login/);
});

test('la pagina profilo reindirizza al login se non autenticati', async ({ page }) => {
  await page.goto('/profilo');
  await expect(page).toHaveURL(/\/login/);
});

test('il toggle del tema cambia l\'attributo data-theme', async ({ page }) => {
  await page.goto('/');
  const themeButton = page.locator('.iconButton');
  const before = await page.locator('html').getAttribute('data-theme');
  await themeButton.click();
  const after = await page.locator('html').getAttribute('data-theme');
  expect(before).not.toBe(after);
});
