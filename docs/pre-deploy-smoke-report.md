🚀 배포 전 최종 스모크 점검 보고서

작성일 : 2025-11-08

상태 : ✅ 배포 가능 (경고 항목 모니터링 필요)

담당 : AI Assistant


1️⃣ 실행 내역

- `pnpm build`
  - ✅ 성공 (기존 chunk size 경고만 존재)
- `pnpm preview -- --host`
  - ✅ 기동 (http://localhost:4173/ → 사용 중 포트에 따라 4175, 5180 등으로 자동 조정)
- (선택) `playwright test smoke.spec.ts`
  - ⚠️ 미실행 – Playwright/테스트 스펙 미구성 상태 (패키지/스크립트 부재). Phase 5 자동화 도입 시 반영 예정.


2️⃣ 스모크 체크리스트

| 항목 | 결과 | 비고 |
| --- | --- | --- |
| ENV 주입 (배포 환경) | ⏳ 준비 필요 | Vercel Project 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 설정 필요 |
| DEV 모듈 차단 | ✅ | preview 확인 – `import.meta.env.DEV` 가드로 PROD 로드 없음 |
| 핵심 플로우 | ✅ | 로그인 → AppShell → Home 정상, CareLinks 는 로그인 상태에서만 접근 허용 |
| 콘솔 청결도 | ⚠️ 경고 | 빌드 시 500kB chunk 경고 지속 (Phase 5 코드 스플리팅 예정) |
| 샘플 자산 노출 | ✅ | 라우트/메뉴/이미지에서 샘플 노출 0 |
| 네트워크 상태 | ✅ | Supabase 호출 200/201, RLS 위반 없음 (DEV 익명 로그인 제외) |


3️⃣ 추가 메모

- `.env.local` 은 로컬 개발용. 배포 시 Vercel Environment Variables 로 전환 필요.
- Playwright 자동 스모크는 현재 구성되지 않았으므로 추후 `tests/smoke.spec.ts` 작성 + CI 연동 권장.
- chunk 경고는 Phase 5 코드 스플리팅 항목으로 이관.


4️⃣ 결론

- 빌드/프리뷰 기준으로 배포 가능한 상태입니다.
- ENV/테스트 자동화 보완 후 Phase 2–6 일정에 따라 진행 권장.


