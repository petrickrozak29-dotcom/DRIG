import { test, expect } from '@playwright/test';

test('submission create -> approve -> visible', async ({ page, request }) => {
  // create submission via backend API
  const apiBase = process.env.API_URL || 'http://localhost:4000';
  const createRes = await request.post(`${apiBase}/api/submissions`, { data: { title: 'E2E Playwright', location: 'Alun-Alun', description: 'Playwright smoke', featureType: 'KULINER', categoryName: 'UMKM' } });
  expect(createRes.ok()).toBeTruthy();
  const created = await createRes.json();

  // login as developer and approve
  const login = await request.post(`${apiBase}/api/auth/login`, { data: { email: 'developermagelang45@gmail.com', password: 'potensimagelang45#' } });
  expect(login.ok()).toBeTruthy();
  const lb = await login.json();
  const token = lb.token;

  const patch = await request.patch(`${apiBase}/api/submissions/${created.id}/status`, { data: { status: 'APPROVED' }, headers: { Authorization: `Bearer ${token}` } });
  expect(patch.ok()).toBeTruthy();

  // open frontend and check /kuliner listing
  await page.goto('/kuliner');

  // Wait for the frontend to call the culinary API and assert it contains our created item
  const apiResponse = await page.waitForResponse(
    (response) => response.url().includes('/api/culinary') && response.status() === 200,
    { timeout: 15000 }
  );

  let payload: any = {};
  try {
    payload = await apiResponse.json();
  } catch (e) {
    payload = {};
  }

  const records = Array.isArray(payload) ? payload : payload.items ?? [];
  const foundInApi = records.some((i: any) => String(i.title) === String(created.title) || String(i.id) === String(created.id) || String(i.id) === `kuliner-${created.id}`);
  expect(foundInApi).toBeTruthy();

  // Then verify UI has rendered the item
  const locator = page.locator(`text=${created.title}`).first();
  await expect(locator).toBeVisible({ timeout: 20000 });
});
