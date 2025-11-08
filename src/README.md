# 약챙겨먹어요 (YakCare) MVP

> 시니어 중심 복약 관리 앱 - Lite 버전

## 🎯 프로젝트 개요

**약챙겨먹어요**는 시니어의 복약 누락을 감소시키고 보호자가 안심하고 모니터링할 수 있는 모바일 우선 웹 애플리케이션입니다.

### 핵심 가치
- 📱 **시니어 친화적 UI**: 큰 글자, 단순한 구조, 돋보기 없이 사용 가능
- 🔔 **스마트 알림**: 복약 시간 자동 알림 + 스누즈 기능
- 👨‍👩‍👧‍👦 **보호자 모니터링**: 실시간 복약 현황 확인
- 💊 **다양한 약 관리**: 처방약, 영양제, 만성질환약 통합 관리
- 📊 **건강 기록**: 혈압, 혈당 기록 및 추이 확인

## 🏗️ 기술 스택

### Frontend
- **React 18** + **TypeScript**
- **Vite** - 빠른 빌드 도구
- **Tailwind CSS 4.0** - 유틸리티 퍼스트 CSS
- **ShadCN UI** - 접근성 높은 컴포넌트
- **Lucide Icons** - 아이콘 시스템

### Backend
- **Supabase** - BaaS (현재 활성화)
  - PostgreSQL 데이터베이스
  - Edge Functions (Deno)
  - 실시간 구독 지원
- **Firebase** - 대체 백엔드 (Feature Flag로 전환 가능)
  - Firestore
  - Cloud Functions
  - FCM (푸시 알림)

### 배포
- **Vercel** - 프론트엔드 호스팅
- **Netlify** - 대체 호스팅
- **Supabase** - 백엔드 호스팅

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 빌드
```bash
npm run build
```

### 4. 프리뷰
```bash
npm run preview
```

## 🎨 브랜드 컬러

```css
--brand-primary: #12B886    /* 메인 그린 */
--brand-accent: #2EC4B6     /* 포인트 블루그린 */
--brand-warning: #F08C00    /* 경고 오렌지 */
--brand-danger: #E03131     /* 위험 레드 */
```

## 📱 주요 화면

### 복용자 모드
1. **Splash** - 앱 시작 화면
2. **HomeToday** - 오늘의 복약 현황
3. **OnboardingHub** - 약 추가 (QR/OCR/수동)
4. **HealthSection** - 건강 기록 (혈압/혈당)
5. **Settings** - 설정 및 연결 관리

### 보호자 모드
1. **CaregiverHome** - 환자 목록
2. **CaregiverFeed** - 환자별 복약 피드
3. **CareLinks** - 연결 관리
4. **InviteGenerator** - 초대 코드 생성

## 🔧 주요 기능

### 약 관리
- QR 스캔으로 빠른 등록
- OCR로 처방전 인식
- 수동 입력 지원
- 복용 시간 자동 스케줄링

### 알림 시스템
- T-15: 예고 알림
- T: 정시 알림
- T+10: 스누즈 알림
- T+15, T+30...: 확인 알림
- T+90: 자동 MISSED 처리

### 건강 기록
- 혈압 (BP): 수축기/이완기/맥박
- 혈당 (BG): 공복/식후2시간
- 7일 트렌드 차트

### 보호자 기능
- 실시간 복약 현황
- 누락 알림
- 리마인드 요청 (20분 쿨다운)
- 건강 기록 모니터링

## 🚀 배포 가이드

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel --prod
```

### 환경 변수 설정
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Firebase (선택)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
# ...

# Feature Flags
VITE_USE_SUPABASE_MEDS=true
VITE_USE_SUPABASE_DOSE=true
VITE_USE_SUPABASE_LINK=true
VITE_USE_SUPABASE_HEALTH=true
```

## 📊 프로젝트 구조

```
├── components/          # React 컴포넌트
│   ├── app/            # 앱 화면 컴포넌트
│   ├── ui/             # ShadCN UI 컴포넌트
│   └── figma/          # Figma 유틸리티
├── config/             # 환경 설정
│   └── env.ts          # Feature Flags
├── services/           # 비즈니스 로직
│   ├── *.service.ts    # 통합 서비스 레이어
│   ├── supabase/       # Supabase DAO
│   ├── firestore/      # Firestore DAO
│   └── *.mock.ts       # Mock 데이터
├── types/              # TypeScript 타입
├── hooks/              # Custom Hooks
├── styles/             # CSS 스타일
└── utils/              # 유틸리티 함수
```

## 🔐 보안

- 환자 데이터는 본인과 ACTIVE 보호자만 접근 가능
- 전화번호는 해시로만 저장 (원본 저장 금지)
- Row Level Security (RLS) 적용
- HTTPS 전송 암호화

## 📄 라이선스

MIT License

## 👥 개발팀

약챙겨먹어요 팀

---

**버전**: 1.0.0 (MVP Lite)  
**최종 업데이트**: 2024-11-02
