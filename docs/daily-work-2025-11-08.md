## 2025-11-08 작업 일지

작성일: 2025-11-08  
담당: AI Assistant  

### 1. 작업 개요
- Vercel 배포 실패 원인(출력 디렉터리 불일치)을 해결하고 배포 성공.
- 회원 역할 선택, 카메라 권한/미리보기 등 실사용 플로우를 보완.
- 프로젝트 정밀 진단 보고서 작성 및 향후 개발 계획 수립.

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

### 3. 테스트/검증 현황
- `pnpm build`: 경고(청크 사이즈) 외 에러 없음.
- Vercel 최신 배포에서 `/login`, `/signup`, 카메라 권한 요청 확인.
- Supabase 이메일 인증: 링크 리다이렉트 설정 수정 후 재전송을 통해 인증 가능.
- 자동화 테스트(Playwright smoke)는 로그인 플로우 미구현 상태(차후 도입 예정).

### 4. 미해결/다음 일정
- QR/OCR 실데이터 디코딩 로직은 아직 목업 → Phase 3에서 라이브러리 연동 예정.
- Supabase 보호자-복용자 연동, CareLinks 실데이터 구현 필요.
- Playwright 테스트 확장, chunk size 최적화 등 Phase 5 이후 과제로 유지.
- 이메일/SMS 전송 안정화를 위해 SMTP 커스텀 설정 검토.

### 5. 내일 테스트 계획
- Vercel 배포본에서 회원가입(복용자/보호자) → 이메일 인증 → 로그인 → 홈 화면 접근 플로우 재검증.
- 카메라 권한 허용/거부 시나리오, 권한 거부 후 재요청 동작 확인.
- Supabase 대시보드에서 `user_metadata.role` 저장 여부 및 데이터 정합성 점검.


