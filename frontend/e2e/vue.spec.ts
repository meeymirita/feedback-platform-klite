import { test, expect } from '@playwright/test'

// Смоук: приложение монтируется и открывается корневой маршрут.
// Реальные сценарии — по docs/PLAN.md, фаза 10.
test('visits the app root url', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#app')).toBeVisible()
  await expect(page.locator('h1')).toHaveText('Платформа отчётности')
})
