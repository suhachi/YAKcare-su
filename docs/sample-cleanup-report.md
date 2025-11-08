🧹 샘플 자산 제거 작업 보고서

작성일 : 2025-11-07

상태 : ✅ 프로덕션 번들 정리 완료

담당 : AI Assistant / Team Lead

승인 : Owner 배종수


1️⃣ 변경 요약

- Debug Overlay, DEV 전용 스케줄러 등 디버그 유틸은 런타임에서 `import.meta.env.DEV` 조건으로만 로드하도록 조정하여 배포 번들에서 제외.
- 메인 라우터(AppMain)에서 케어기버/온보딩/초대 등 샘플 화면 제거 → DEV 모드에서만 안내 문구 노출.
- `CareLinks`, `SettingsPatient`에서 샘플 흐름 제거 및 프로덕션 진입 차단.
- AlertModal과 Dose 서비스 계층에서 Mock 호출을 DEV 한정 비동기 로더로 감싸고, Supabase 경로는 실 데이터 흐름으로 수렴.
- Links / Medications / Health 서비스도 동일한 DEV 한정 로더 패턴 적용.
- `.env.example`의 실제 키 제거, 플레이스홀더/안내 문구로 교체.


2️⃣ 실행·검증 결과

| 항목 | 결과 |
| --- | --- |
| pnpm build | ✅ 성공 (기존 chunk warning 유지)
| DEV 모드 빌드 | ✅ 디버그 오버레이/스케줄러 정상 동작
| PROD 모드 스플래시/홈 | ✅ 샘플 화면 미노출, 케어기버 탭 비활성화 안내 출력
| AlertModal 플로우 | ✅ Supabase 경로 정상 처리, Mock 호출 DEV 한정 확인


3️⃣ 주요 변경 파일

- `src/main.tsx` : 디버그 오버레이 동적 로딩 및 DEV 가드 추가
- `src/components/layout/AppShell.tsx`, `AppHeader.tsx`, `AppMain.tsx` : DEV 전용 화면/탭 조건 분기
- `src/components/app/AlertModal.tsx` : 비동기 호출 및 DEV Mock 제거
- `src/services/doses.service.ts`, `medications.service.ts`, `links.service.ts`, `health.service.ts` : Mock 로더 분기 정리
- `.env.example` : 플레이스홀더 값으로 교체


4️⃣ 위험 / 주의 사항

- chunk size warning 은 기존과 동일, Phase 5 최적화 항목으로 이관 필요.
- DEV 모드에서만 사용 가능한 케어기버 흐름은 실 데이터 연결 전에 다시 설계 필요.


5️⃣ 후속 권장 단계

- 보호자/온보딩 실 기능 구현 후 QA (Phase 3–4)
- Mock 모듈 완전 분리 또는 별도 번들 처리로 추가 축소 검토
- Error Boundary · Skeleton 도입 등 UX 개선 (Phase 2)
- Vitest 도입 및 코드 스플리팅 (Phase 5)
- Vercel 배포 및 모니터링 도구 연동 (Phase 6)


🏁 결론

프로덕션 번들은 샘플·데모 컴포넌트 없이 안정 구성이며, DEV 전용 자산은 조건부 로딩으로 격리 완료. 다음 단계는 실 기능 확장 및 배포 준비(Phase 2–6) 수행입니다.

