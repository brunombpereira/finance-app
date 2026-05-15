import { expect, test } from '@playwright/test'

test('register a new user lands on the dashboard', async ({ page }) => {
  const email = `e2e-${Date.now()}@nexofinance.test`

  await page.goto('/register')
  await page.getByPlaceholder('O teu nome').fill('E2E Tester')
  await page.getByPlaceholder('tu@email.com').fill(email)
  await page.getByPlaceholder('Mínimo 6 caracteres').fill('test1234')
  await page.getByRole('button', { name: 'Criar conta' }).click()

  await expect(page).toHaveURL(/\/app$/)
  // The Layout sidebar is visible only on md+, but the page reaches the dashboard route.
  // Look for content that appears no matter the viewport.
  await expect(page).not.toHaveURL(/\/login/)
})
