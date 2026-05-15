import { expect, test } from '@playwright/test'

test('landing page shows hero and CTAs', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('As tuas finanças')
  await expect(page.getByRole('link', { name: 'Começar grátis' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Já tenho conta' })).toBeVisible()
})

test('landing CTA navigates to register', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Começar grátis' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('heading', { name: 'Criar conta' })).toBeVisible()
})
