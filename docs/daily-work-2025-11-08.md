## 2025-11-08 작업 일지

작성일: 2025-11-08  
담당: AI Assistant  

### 1. 작업 개요
- Vercel 배포 실패 원인(출력 디렉터리 불일치)을 해결하고 배포 성공.
- 회원 역할 선택, 카메라 권한/미리보기 등 실사용 플로우를 보완.
- 프로젝트 정밀 진단 보고서 작성 및 향후 개발 계획 수립.
- Phase 3 1차 구현: QR 디코딩 실장, Supabase 기반 CareLinks 초대/연결, RLS 정책 스크립트 준비.

### 2. 상세 작업 내용
1. **빌드/배포 환경 정리**
   - `vite.config.ts` 의 `outDir` 을 `dist` 로 복원하여 Vercel 기본 설정과 일치시킴.
   - 루트에 `vercel.json` 생성, SPA 라우트를 위한 rewrite(`/index.html`) 구성.
   - `pnpm build` 성공 여부 확인 후 GitHub에 커밋/푸시 진행.

2. **회원 가입/로그인 플로우 개선**
   - `Signup` 페이지를 신설하고 이메일/비밀번호 검증 및 진행 상태 표시 구현.
   - Supabase `signUp` 시 `options.data.role` 로 복용자(patient)/보호자(caregiver) 선택 값 저장.
   - 로그인 화면에 “회원가입” 이동 버튼 추가.
   - 이메일 인증 링크가 `localhost` 로 리다이렉트되는 이슈 해결 위해 Supabase `Site URL`을 Vercel 도메인으로 수정 안내.

3. **카메라 권한 및 미리보기 구현**
   - `QRScanner` 컴포넌트에 `navigator.permissions` 및 `navigator.mediaDevices.getUserMedia` 연동.
   - 권한 허용 시 실제 비디오 스트림을 `<video>`에 표시, 오류 발생 시 사용자에게 안내.
   - 모달 종료 또는 권한 거부 시 스트림 중지, 토스트 메시지 및 배너 UI 개선.

4. **문서화**
   - `docs/project-readiness-report.md` 작성: 현재 완성도, 기능별 상태, Phase별 로드맵, Supabase 점검 이슈 등 정리.
   - 본 `docs/daily-work-2025-11-08.md` 에서 하루 작업 내용을 기록.

5. **Phase 3 기능 확장**
   - `@zxing/browser`, `@zxing/library`를 도입하고 `QRScanner`에 실제 QR 디코딩 로직을 적용.
   - 스캔 실패/부분 인식 Fallback UX, 플랫폼별 권한 안내, 재시도 흐름 강화.
   - `links.service`와 `supabase/links.dao`를 확장해 초대 생성/수락을 Supabase 테이블 (`care_link_invites`, `care_links`)에서 처리.
   - `supabase/policies/care_links_policies.sql` 추가: 초대 테이블 생성, RLS/트리거 정책 정의.

6. **Phase 4~5 성능/테스트 개선**
   - 번들 최적화: `vite.config.ts`에 `manualChunks` 추가, react/zxing/supabase/radix/ui 벤더 청크 분리 (최대 청크 411KB → gzip 107KB).
   - PWA 설정: `public/manifest.json`, `public/sw.js` 생성, `index.html`에 manifest 링크 추가, `main.tsx`에 service worker 등록 코드 추가.
   - Playwright 테스트 확장: 로그인 시나리오 추가 (환경 변수 `TEST_EMAIL`, `TEST_PASSWORD` 필요), CareLinks 가드 검증.
   - 문서화: `docs/supabase-smtp-setup.md` (SMTP 커스텀 설정 가이드), `docs/ocr-integration-guide.md` (OCR 통합 옵션 안내).

### 3. 테스트/검증 현황
- `pnpm build`: 청크 분리 후 모든 청크가 500KB 미만 (gzip 기준 최대 108KB), 경고 없음.
- Vercel 최신 배포에서 `/login`, `/signup`, 카메라 권한 요청 확인.
- Supabase 이메일 인증: 링크 리다이렉트 설정 수정 후 재전송을 통해 인증 가능.
- Playwright 테스트: 로그인 시나리오 추가 (환경 변수 필요), CareLinks 가드 검증 추가.
- PWA: `manifest.json`, `sw.js` 생성 완료, 프로덕션 빌드에서 service worker 자동 등록.

### 4. 완료/다음 일정
- ✅ 번들 최적화: 청크 분리 완료 (최대 청크 411KB → gzip 107KB).
- ✅ PWA 설정: manifest.json, service worker 등록 완료.
- ✅ Playwright 테스트 확장: 로그인 시나리오 추가 완료.
- ✅ 문서화: Supabase SMTP 설정 가이드, OCR 통합 가이드 작성 완료.
- 다음 단계: OCR 실제 구현 (서버 측 권장), Supabase SMTP 커스텀 설정 적용, CareLinks 초대 QR 이미지 생성, 보호자 대시보드 실데이터 표현.

### 5. 내일 테스트 계획
- Vercel 배포본에서 회원가입(복용자/보호자) → 이메일 인증 → 로그인 → CareLinks 목록 확인 플로우 재검증.
- QR 스캔: 권한 허용/거부, 실제 QR(텍스트 URL) 인식 성공/실패 시나리오 점검.
- Supabase `care_link_invites`, `care_links` 테이블 데이터/정책(RLS) 검증 및 초대 수락 흐름 테스트.
- Supabase 대시보드에서 `user_metadata.role`, 초대 만료/해지 로직 이상 여부 점검.
- PWA: 프로덕션 빌드에서 "홈 화면에 추가" 안내 확인, service worker 동작 검증.
- Playwright: `TEST_EMAIL`, `TEST_PASSWORD` 환경 변수 설정 후 로그인 시나리오 실행.


