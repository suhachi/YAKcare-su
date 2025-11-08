# package.json

**파일 경로**: `package.json`  
**타입**: JSON 설정 파일

---

```json

{
  "name": "약챙겨먹어요 3 Lite버전 (수파)",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@eslint/js": "*",
    "@jsr/supabase__supabase-js": "^2.49.8",
    "@radix-ui/react-accordion": "*",
    "@radix-ui/react-alert-dialog": "*",
    "@radix-ui/react-aspect-ratio": "*",
    "@radix-ui/react-avatar": "*",
    "@radix-ui/react-checkbox": "*",
    "@radix-ui/react-collapsible": "*",
    "@radix-ui/react-context-menu": "*",
    "@radix-ui/react-dialog": "*",
    "@radix-ui/react-dropdown-menu": "*",
    "@radix-ui/react-hover-card": "*",
    "@radix-ui/react-label": "*",
    "@radix-ui/react-menubar": "*",
    "@radix-ui/react-navigation-menu": "*",
    "@radix-ui/react-popover": "*",
    "@radix-ui/react-progress": "*",
    "@radix-ui/react-radio-group": "*",
    "@radix-ui/react-scroll-area": "*",
    "@radix-ui/react-select": "*",
    "@radix-ui/react-separator": "*",
    "@radix-ui/react-slider": "*",
    "@radix-ui/react-slot": "*",
    "@radix-ui/react-switch": "*",
    "@radix-ui/react-tabs": "*",
    "@radix-ui/react-toggle": "*",
    "@radix-ui/react-toggle-group": "*",
    "@radix-ui/react-tooltip": "*",
    "@supabase/supabase-js": "*",
    "@vitejs/plugin-react": "*",
    "class-variance-authority": "*",
    "clsx": "*",
    "cmdk": "*",
    "embla-carousel-react": "*",
    "eslint-plugin-react-hooks": "*",
    "eslint-plugin-react-refresh": "*",
    "firebase": "*",
    "globals": "*",
    "hono": "*",
    "input-otp": "*",
    "lucide-react": "*",
    "path": "*",
    "react": "^18.3.1",
    "react-day-picker": "*",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.55.0",
    "react-resizable-panels": "*",
    "recharts": "*",
    "sonner": "*",
    "tailwind-merge": "*",
    "typescript-eslint": "*",
    "vaul": "*",
    "vite": "*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@vitejs/plugin-react-swc": "^3.10.2",
    "vite": "6.3.5"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

---

## 주요 의존성

### 프레임워크
- **react**: ^18.3.1
- **react-dom**: ^18.3.1
- **vite**: 6.3.5

### UI 라이브러리
- **@radix-ui/react-***: ShadCN UI 기반 컴포넌트
- **lucide-react**: 아이콘
- **sonner**: 토스트 알림
- **recharts**: 차트 라이브러리

### 백엔드
- **@supabase/supabase-js**: Supabase 클라이언트
- **firebase**: Firebase (선택)

### 유틸리티
- **clsx**, **tailwind-merge**: 클래스 병합
- **class-variance-authority**: 컴포넌트 variant 관리
- **react-hook-form**: 폼 관리

---

## 스크립트

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드

