# 약챙겨먹어요 3 Lite버전 - 전체 코드 문서화

**생성일**: 2024-11-02  
**목적**: 프로젝트 전체 코드를 MD 파일로 문서화

---

## 📋 문서 구조

### **1. 프로젝트 설정 파일**
- `01_PACKAGE_JSON.md` - package.json
- `02_VITE_CONFIG.md` - vite.config.ts
- `03_TSCONFIG.md` - TypeScript 설정 파일들

### **2. 진입점 파일**
- `04_MAIN.md` - main.tsx
- `05_APP.md` - AppRouter.tsx
- `06_INDEX_HTML.md` - index.html

### **3. 설정 파일**
- `07_CONFIG_ENV.md` - config/env.ts

### **4. 타입 정의**
- `08_TYPES_DOSE.md` - types/dose.ts
- `09_TYPES_MEDS.md` - types/meds.ts
- `10_TYPES_HEALTH.md` - types/health.ts
- `11_TYPES_LINK.md` - types/link.ts

### **5. 서비스 레이어**
- `12_SERVICES_INDEX.md` - 서비스 목록
- `13_SERVICES_MEDICATIONS.md` - medications.service.ts
- `14_SERVICES_DOSES.md` - doses.service.ts
- `15_SERVICES_HEALTH.md` - health.service.ts
- `16_SERVICES_LINKS.md` - links.service.ts
- `17_SERVICES_FIGMA.md` - figma.service.ts
- `18_SERVICES_ANALYTICS.md` - analytics.ts
- `19_SERVICES_TIME.md` - time.ts

### **6. DAO 레이어**
- `20_DAO_SUPABASE_MEDICATIONS.md`
- `21_DAO_SUPABASE_DOSES.md`
- `22_DAO_SUPABASE_HEALTH.md`
- `23_DAO_SUPABASE_LINKS.md`
- `24_DAO_FIRESTORE_*.md` (4개)

### **7. Mock 데이터**
- `25_MOCK_MEDS.md`
- `26_MOCK_DOSE.md`
- `27_MOCK_HEALTH.md`
- `28_MOCK_LINK.md`
- `29_MOCK_CAREGIVER.md`
- `30_MOCK_SCHEDULER.md`

### **8. 컴포넌트 - App**
- `31_COMPONENTS_APP_INDEX.md` - 앱 컴포넌트 목록
- `32_COMPONENTS_APP_HOME_TODAY.md` - HomeToday.tsx
- `33_COMPONENTS_APP_SPLASH.md` - Splash.tsx
- `34_COMPONENTS_APP_AUTH_OTP.md` - AuthOTP.tsx
- `35_COMPONENTS_APP_ONBOARDING.md` - OnboardingHub.tsx
- `36_COMPONENTS_APP_SLOT_DOSE_CARD.md` - SlotDoseCard.tsx
- `37_COMPONENTS_APP_HEALTH_SECTION.md` - HealthSection.tsx
- `38_COMPONENTS_APP_CAREGIVER_HOME.md` - CaregiverHome.tsx
- ... (나머지 앱 컴포넌트들)

### **9. 컴포넌트 - UI (ShadCN)**
- `50_COMPONENTS_UI_INDEX.md` - UI 컴포넌트 목록
- `51_COMPONENTS_UI_BUTTON.md` - button.tsx
- `52_COMPONENTS_UI_CARD.md` - card.tsx
- ... (나머지 UI 컴포넌트들)

### **10. 컴포넌트 - Figma**
- `60_COMPONENTS_FIGMA.md` - ImageWithFallback.tsx

### **11. 유틸리티**
- `70_UTILS_FIGMA.md` - utils/figma.ts
- `71_UTILS_SUPABASE_CLIENT.md` - utils/supabase/client.ts
- `72_UTILS_SUPABASE_AUTH.md` - utils/supabase/auth.ts
- `73_UTILS_SUPABASE_INFO.md` - utils/supabase/info.tsx

### **12. Hooks**
- `80_HOOKS_DAY_ROLLOVER.md` - hooks/useDayRollover.ts

### **13. 스타일**
- `90_STYLES_GLOBALS.md` - styles/globals.css

### **14. Supabase Functions**
- `91_SUPABASE_FUNCTIONS_INDEX.md` - Edge Functions
- `92_SUPABASE_FUNCTIONS_KV_STORE.md` - kv_store.tsx

### **15. Supabase Migrations**
- `93_SUPABASE_MIGRATIONS.md` - 001_initial_schema.sql

### **16. 기타 설정 파일**
- `94_POSTCSS_CONFIG.md` - postcss.config.js
- `95_FIRESTORE_RULES.md` - firestore.rules
- `96_NETLIFY_TOML.md` - netlify.toml
- `97_VERCEL_JSON.md` - vercel.json

---

## 📊 통계

- **총 파일 수**: 100+ 개
- **TypeScript/TSX**: 80+ 개
- **CSS**: 2개
- **JSON**: 5개
- **SQL**: 1개
- **기타**: 10+ 개

---

## 🔍 빠른 검색

### 주요 기능별 파일 위치

#### 약 관리
- 서비스: `13_SERVICES_MEDICATIONS.md`
- DAO: `20_DAO_SUPABASE_MEDICATIONS.md`
- 타입: `09_TYPES_MEDS.md`

#### 복용 기록
- 서비스: `14_SERVICES_DOSES.md`
- DAO: `21_DAO_SUPABASE_DOSES.md`
- 타입: `08_TYPES_DOSE.md`
- UI: `36_COMPONENTS_APP_SLOT_DOSE_CARD.md`

#### 건강 기록
- 서비스: `15_SERVICES_HEALTH.md`
- DAO: `22_DAO_SUPABASE_HEALTH.md`
- 타입: `10_TYPES_HEALTH.md`
- UI: `37_COMPONENTS_APP_HEALTH_SECTION.md`

#### 보호자 연결
- 서비스: `16_SERVICES_LINKS.md`
- DAO: `23_DAO_SUPABASE_LINKS.md`
- 타입: `11_TYPES_LINK.md`

---

**다음**: 각 파일의 상세 내용은 해당 MD 파일 참조

