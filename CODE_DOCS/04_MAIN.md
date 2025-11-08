# main.tsx

**파일 경로**: `src/main.tsx`  
**타입**: React 진입점 파일

---

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import { installDebugOverlay } from './debug/showErrorOverlay';
import AppRouter from './AppRouter';
import { Splash } from './components/app/Splash';
import { useState } from 'react';

installDebugOverlay();

if (import.meta.env.DEV) {
  console.log('[ENV Check]', {
    url: import.meta.env.VITE_SUPABASE_URL,
    key: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
}

function AppWithSplash() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  return <AppRouter />;
}

const el = document.getElementById('root');
if (!el) throw new Error('Root #root not found');
createRoot(el).render(
  <React.StrictMode>
    <AppWithSplash />
  </React.StrictMode>,
);
```

---

## 설명

`main.tsx`는 애플리케이션의 엔트리 포인트로, 스플래시 화면을 보여준 뒤 `AppRouter`를 마운트합니다. 개발 모드에서는 환경 변수 상태를 로그로 확인하고, 디버그 오버레이를 설치합니다.

### 주요 역할

1. **글로벌 초기화**  
   - 전역 스타일 로딩  
   - 디버그 오버레이 설치  
   - 환경 변수 확인 로그 (DEV)

2. **스플래시 처리**  
   - `AppWithSplash` 컴포넌트에서 일정 시간 후 메인 라우터로 전환

3. **React 18 마운트**  
   - `createRoot` API로 앱 마운트
   - `React.StrictMode`로 개발 중 잠재적 문제 확인

---

## 관련 파일

- `src/AppRouter.tsx` — 라우팅 엔트리
- `src/components/app/Splash.tsx` — 스플래시 화면
- `src/debug/showErrorOverlay.ts` — 디버그 오버레이 설치

