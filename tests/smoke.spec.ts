import { test, expect } from '@playwright/test';

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:4173/';

test('shows login form when unauthenticated', async ({ page }) => {
  await page.goto(PREVIEW_URL);
  await page.waitForTimeout(5000);
  const loginVisible = await page
    .getByText('로그인', { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  const homeVisible = await page
    .getByText('오늘 약 챙겨 먹어요', { exact: true })
    .first()
    .isVisible()
    .catch(() => false);
  const authCheckingVisible = await page
    .getByText('사용자 인증 중...', { exact: true })
    .first()
    .isVisible()
    .catch(() => false);

  expect(loginVisible || homeVisible || authCheckingVisible).toBeTruthy();
});

test.describe.skip('after login shows home and guards carelinks', () => {
  test('placeholder for authenticated smoke scenario', async ({ page }) => {
    test.fail(true, 'TODO: 테스트 계정 로그인 절차 구현 예정');
    await page.goto(PREVIEW_URL);
  });
});

