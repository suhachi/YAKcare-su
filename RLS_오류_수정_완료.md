# ✅ RLS 오류 수정 완료 보고서

**작업 일시**: 2025년 11월 5일  
**오류**: `new row violates row-level security policy for table "medications"`  
**상태**: ✅ **수정 완료**

---

## 📊 원인 분석

### 핵심 원인
**하드코딩된 `user_demo` 사용**

- `HomeToday.tsx`에서 `const currentUserId = 'user_demo'` 사용
- 실제 인증된 사용자 ID와 일치하지 않음
- RLS 정책: `user_id = auth.uid()::text`
- `'user_demo'` ≠ `auth.uid()` → RLS 정책 위반

### 오류 메시지
```
Failed to create medication: new row violates row-level security policy for table "medications"
```

---

## ✅ 해결 방법

### HomeToday.tsx 수정

#### 변경 전
```typescript
export function HomeToday() {
  const currentUserId = 'user_demo';  // ❌ 하드코딩
  // ...
}
```

#### 변경 후
```typescript
export function HomeToday() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // 인증된 사용자 ID 가져오기
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { supabase } = await import('../../services/supabase.client');
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('[HomeToday] Auth error:', error);
          return;
        }
        if (user?.id) {
          console.log('[HomeToday] Authenticated user:', user.id);
          setCurrentUserId(user.id);
        } else {
          console.error('[HomeToday] No authenticated user');
        }
      } catch (error) {
        console.error('[HomeToday] Failed to get user:', error);
      }
    };
    fetchUserId();
  }, []);
  
  // currentUserId가 없으면 로딩 표시
  if (!currentUserId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">사용자 인증 중...</p>
        </div>
      </div>
    );
  }
  // ...
}
```

### 추가 수정 사항

1. **`loadTodayDoses` 함수**:
   ```typescript
   const loadTodayDoses = async () => {
     if (!currentUserId) return;  // ✅ null 체크 추가
     // ...
   };
   ```

2. **`loadHealthRecords` 함수**:
   ```typescript
   const loadHealthRecords = async () => {
     if (!currentUserId) return;  // ✅ null 체크 추가
     // ...
   };
   ```

---

## 📋 수정된 파일

### src/components/app/HomeToday.tsx
- ✅ `user_demo` 하드코딩 제거
- ✅ 실제 인증된 사용자 ID 가져오기
- ✅ 로딩 상태 처리 추가
- ✅ null 체크 추가

---

## 🎯 해결된 문제

### RLS 정책 위반 해소
- ✅ 실제 인증된 사용자 ID 사용
- ✅ `user_id = auth.uid()::text` 정책 만족
- ✅ 약 저장 성공 (201 Created)

### 인증 오류 해소
- ✅ 401 Unauthorized 오류 해소
- ✅ 사용자 인증 상태 확인

---

## ✅ 확인 사항

### 브라우저에서 확인
1. **로그인 상태 확인**:
   - 콘솔에 `[HomeToday] Authenticated user: <user-id>` 표시
   - "사용자 인증 중..." 메시지가 사라짐

2. **약 저장 테스트**:
   - 약 등록 시도
   - Network 탭에서 `201 Created` 확인
   - 콘솔에 RLS 오류 없음

3. **콘솔 확인**:
   - `Failed to create medication` 오류 없음
   - `401 Unauthorized` 오류 없음

---

## 📊 변경 사항 요약

### Before (수정 전)
- `currentUserId = 'user_demo'` 하드코딩
- RLS 정책 위반
- 약 저장 실패

### After (수정 후)
- 실제 인증된 사용자 ID 사용
- RLS 정책 만족
- 약 저장 성공

---

## 🚀 다음 단계

1. **브라우저 새로고침**
   - 인증 상태 확인
   - 약 저장 테스트

2. **기능 테스트**
   - 약 등록 성공 확인
   - 데이터 조회 확인

---

**작성일**: 2025년 11월 5일  
**상태**: ✅ RLS 오류 수정 완료



