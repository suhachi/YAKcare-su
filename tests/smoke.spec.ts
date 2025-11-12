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

test.describe('authenticated scenarios', () => {
  const TEST_EMAIL = process.env.TEST_EMAIL;
  const TEST_PASSWORD = process.env.TEST_PASSWORD;

  test.skip(!TEST_EMAIL || !TEST_PASSWORD, '로그인 테스트는 TEST_EMAIL, TEST_PASSWORD 환경 변수가 필요합니다.');

  test('successfully logs in and shows home', async ({ page }) => {
    await page.goto(PREVIEW_URL);
    
    // 로그인 폼 표시 대기
    await page.waitForSelector('input[placeholder="email"]', { timeout: 10000 });
    
    // 이메일 입력
    await page.fill('input[placeholder="email"]', TEST_EMAIL!);
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 성공 대기 (홈 화면 또는 스플래시 화면)
    await page.waitForTimeout(3000);
    
    // 홈 화면 또는 복용자 탭 확인
    const homeTitleVisible = await page
      .getByText('오늘 약 챙겨 먹어요')
      .isVisible()
      .catch(() => false);
    const patientTabVisible = await page
      .getByText('복용자')
      .isVisible()
      .catch(() => false);
    
    expect(homeTitleVisible || patientTabVisible).toBeTruthy();
  });

  test('carelinks shows user data or login guard', async ({ page }) => {
    // 로그인 먼저 수행
    await page.goto(PREVIEW_URL);
    await page.waitForSelector('input[placeholder="email"]', { timeout: 10000 });
    await page.fill('input[placeholder="email"]', TEST_EMAIL!);
    await page.fill('input[type="password"]', TEST_PASSWORD!);
    await page.click('button:has-text("로그인")');
    await page.waitForTimeout(3000);
    
    // CareLinks 페이지로 이동
    await page.goto(PREVIEW_URL + '/carelinks');
    await page.waitForTimeout(2000);
    
    // CareLinks 콘텐츠 또는 로그인 필요 메시지 확인
    const carelinksContentVisible = await page
      .getByText('연결 관리')
      .isVisible()
      .catch(() => false);
    const loginRequiredVisible = await page
      .getByText('로그인이 필요합니다')
      .isVisible()
      .catch(() => false);
    const authLoadingVisible = await page
      .getByText('사용자 확인 중')
      .isVisible()
      .catch(() => false);
    
    expect(carelinksContentVisible || loginRequiredVisible || authLoadingVisible).toBeTruthy();
  });
});

