# AppRouter.tsx

**파일 경로**: `src/AppRouter.tsx`  
**타입**: 애플리케이션 라우팅 엔트리

---

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './routes/guard/RequireAuth';
import Login from './pages/auth/Login';
import AppShell from './components/layout/AppShell';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 설명

`AppRouter`는 React Router를 사용해 애플리케이션의 최상위 라우팅을 담당합니다. 모든 보호된 경로는 `RequireAuth`로 감싸며, 인증되지 않은 사용자는 `/login`으로 리다이렉트됩니다.

### 주요 역할

1. **라우팅 엔트리**  
   - `/login`: 로그인 페이지  
   - `/*`: 보호된 애플리케이션 영역 (AppShell)

2. **인증 가드 적용**  
   - `RequireAuth`가 Supabase 세션을 확인  
   - DEV 모드에서는 익명 로그인까지 처리

3. **레이아웃 위임**  
   - 인증이 통과된 뒤에는 `AppShell`이 실제 화면 전환을 관리

---

## 관련 파일

- `src/main.tsx` — 스플래시 후 `AppRouter`를 마운트
- `src/routes/guard/RequireAuth.tsx` — 인증 가드 로직
- `src/components/layout/AppShell.tsx` — 전역 레이아웃 및 하위 뷰 상태 관리
- `src/AppMain.tsx` — 실제 화면 콘텐츠 스위칭

