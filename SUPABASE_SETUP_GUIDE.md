# Supabase 연동 설정 가이드 (상세)

## 📋 개요

Supabase와 프로젝트를 연동하기 위해 필요한 정보와 단계별 설정 방법을 설명합니다.

---

## 🔍 제가 필요한 정보

### 1. **Supabase 프로젝트 URL**
```
형식: https://[프로젝트-참조-ID].supabase.co
예시: https://icluhhvqqhtrgdvbfjot.supabase.co
```

**어디서 찾나요?**
- Supabase 대시보드 → Settings → API → Project URL

### 2. **Supabase Anon (Public) Key**
```
형식: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (JWT 토큰 형태)
```

**어디서 찾나요?**
- Supabase 대시보드 → Settings → API → Project API keys → `anon` `public` 키

**중요**: 
- ⚠️ `anon` `public` 키를 사용하세요 (프론트엔드용)
- ❌ `service_role` `secret` 키는 절대 사용하지 마세요 (서버 전용, 매우 위험!)

### 3. **Supabase 프로젝트 참조 ID** (선택적)
```
현재 하드코딩된 값: icluhhvqqhtrgdvbfjot
```

**어디서 찾나요?**
- URL에서 추출: `https://[이부분].supabase.co`
- 또는 Settings → General → Reference ID

---

## ✅ 현재 프로젝트 상태

### 이미 설정된 부분
```typescript
// src/utils/supabase/info.tsx
export const projectId = "icluhhvqqhtrgdvbfjot"  // ✅ 이미 있음
export const publicAnonKey = "eyJ..."            // ✅ 이미 있음
```

**하지만 `.env` 파일에는 아직 플레이스홀더:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co  # ❌ 실제 값 필요
VITE_SUPABASE_ANON_KEY=your-anon-key                 # ❌ 실제 값 필요
```

---

## 📝 사용자가 해야 할 작업

### Step 1: Supabase 계정 및 프로젝트 준비

#### A. Supabase 계정 생성 (없는 경우)
1. https://supabase.com 접속
2. **Sign Up** 클릭
3. GitHub/GitLab/이메일로 계정 생성

#### B. 프로젝트 생성 또는 기존 프로젝트 사용

**옵션 1: 새 프로젝트 생성**
1. Supabase 대시보드 → **New Project** 클릭
2. 프로젝트 정보 입력:
   - **Name**: `약챙겨먹어요` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 생성 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 권장)
   - **Pricing Plan**: Free tier 선택
3. **Create new project** 클릭
4. 프로젝트 생성 대기 (약 2분)

**옵션 2: 기존 프로젝트 사용**
- 이미 프로젝트가 있으면 해당 프로젝트 사용

---

### Step 2: Supabase 프로젝트 정보 확인

1. Supabase 대시보드 접속
2. 프로젝트 선택 (없으면 생성)
3. **Settings** (왼쪽 사이드바 하단) 클릭
4. **API** 메뉴 클릭

**여기서 다음 정보를 확인/복사하세요:**

#### ✅ 정보 1: Project URL
```
위치: Settings → API → Project URL
형식: https://[프로젝트-참조-ID].supabase.co
예시: https://icluhhvqqhtrgdvbfjot.supabase.co
```

#### ✅ 정보 2: anon public Key
```
위치: Settings → API → Project API keys → anon public
형식: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```
**주의**: 
- ✅ `anon` `public` 키만 사용
- ❌ `service_role` `secret` 키는 절대 사용 금지!

#### ✅ 정보 3: Project Reference ID (선택적)
```
위치: Settings → General → Reference ID
또는 Project URL에서 추출
예시: icluhhvqqhtrgdvbfjot
```

---

### Step 3: 환경 변수 설정

#### A. `.env` 파일 열기
프로젝트 루트에 `.env` 파일을 열어주세요.

#### B. Supabase 설정 추가/수정

**현재 `.env` 파일 상태:**
```env
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co  # ❌ 실제 값으로 변경 필요
VITE_SUPABASE_ANON_KEY=your-anon-key                # ❌ 실제 값으로 변경 필요
```

**Step 2에서 복사한 정보로 교체:**

```env
# Supabase 설정 (실제 값으로 변경)
VITE_SUPABASE_URL=https://icluhhvqqhtrgdvbfjot.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljbHVoaHZxcWh0cmdkdmJmam90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTkwMzEsImV4cCI6MjA3NzU3NTAzMX0.HdOBYP67nwv3sjlI6i6JZKYhMdVHwDda2xrjY9kHpmw
```

**또는 `src/utils/supabase/info.tsx` 파일이 이미 올바른 값을 가지고 있다면:**
- `.env` 파일은 선택적으로 사용 가능
- 코드에서 직접 값을 사용할 수도 있음

---

### Step 4: 데이터베이스 스키마 생성

프로젝트에 필요한 테이블들을 생성해야 합니다.

#### A. SQL Editor 열기
1. Supabase 대시보드 → **SQL Editor** (왼쪽 사이드바)
2. **New Query** 클릭

#### B. 마이그레이션 파일 실행

**파일 위치**: `src/supabase/migrations/001_initial_schema.sql`

이 파일을 SQL Editor에 붙여넣고 실행하거나, 다음 테이블들을 수동으로 생성:

**필요한 테이블:**
1. `medications` - 약 정보
2. `doses` - 복용 인스턴스
3. `care_links` - 보호자-복용자 연결
4. `health_records` - 건강 기록 (혈압/혈당)

**마이그레이션 파일 확인:**
```bash
# 프로젝트에서 마이그레이션 파일 위치 확인
cat src/supabase/migrations/001_initial_schema.sql
```

#### C. Row Level Security (RLS) 설정

보안을 위해 RLS 정책도 설정해야 합니다:
- 사용자는 본인 데이터만 조회 가능
- 보호자는 연결된 환자 데이터만 조회 가능

---

### Step 5: 개발 서버 재시작

환경 변수 변경 후 개발 서버를 재시작해야 합니다:

```bash
# 현재 서버 중지 (Ctrl+C)

# 서버 재시작
pnpm run dev
```

---

## 🧪 연결 테스트

### 방법 1: 브라우저 콘솔에서 테스트

1. 개발 서버 실행: `pnpm run dev`
2. 브라우저에서 앱 열기
3. 브라우저 개발자 도구 (F12) → Console 탭
4. 다음 코드 입력:

```javascript
// Supabase 클라이언트 테스트
import { getSupabaseClient } from './src/utils/supabase/client';

const supabase = getSupabaseClient();
console.log('Supabase URL:', supabase.supabaseUrl);
console.log('Supabase Key:', supabase.supabaseKey ? '✅ 설정됨' : '❌ 없음');

// 간단한 쿼리 테스트
const { data, error } = await supabase.from('medications').select('count');
console.log('연결 상태:', error ? '❌ 실패 - ' + error.message : '✅ 성공');
```

### 방법 2: 코드에서 직접 테스트

`src/App.tsx` 또는 새 테스트 파일 생성:

```typescript
import { useEffect } from 'react';
import { getSupabaseClient } from './utils/supabase/client';

function SupabaseTest() {
  useEffect(() => {
    async function testConnection() {
      const supabase = getSupabaseClient();
      
      try {
        // 테이블 존재 확인
        const { data, error } = await supabase
          .from('medications')
          .select('count');
        
        if (error) {
          console.error('❌ Supabase 연결 실패:', error);
        } else {
          console.log('✅ Supabase 연결 성공!');
        }
      } catch (error) {
        console.error('❌ 에러:', error);
      }
    }
    
    testConnection();
  }, []);
  
  return <div>Supabase 연결 테스트 중...</div>;
}
```

---

## 🔒 보안 체크리스트

### ✅ 확인 사항

- [ ] `.env` 파일을 Git에 커밋하지 않았는지 확인
- [ ] `.gitignore`에 `.env` 파일이 포함되어 있는지 확인
- [ ] `anon` `public` 키만 사용 (프론트엔드)
- [ ] `service_role` `secret` 키는 절대 사용하지 않음
- [ ] Supabase RLS (Row Level Security) 정책 설정됨

### ⚠️ 주의사항

1. **API 키 보안**
   - `anon` `public` 키는 프론트엔드에서 사용 가능
   - 하지만 RLS 정책으로 데이터 접근 제어 필요
   - `service_role` 키는 서버에서만 사용

2. **환경 변수 관리**
   - `.env` 파일은 절대 Git에 커밋하지 마세요
   - 배포 환경에서는 환경 변수를 별도로 설정

3. **RLS 정책**
   - 모든 테이블에 RLS 활성화 권장
   - 적절한 정책으로 데이터 접근 제어

---

## 📊 데이터베이스 스키마

### 필요한 테이블

1. **medications** (약 정보)
   - `id`, `user_id`, `name`, `category`, `times`, `slots` 등

2. **doses** (복용 인스턴스)
   - `id`, `user_id`, `med_id`, `scheduled_at`, `status` 등

3. **care_links** (보호자-복용자 연결)
   - `id`, `caregiver_id`, `patient_id`, `status`, `relation` 등

4. **health_records** (건강 기록)
   - `id`, `user_id`, `type`, `systolic`, `diastolic`, `glucose` 등

### 마이그레이션 파일

프로젝트에 이미 마이그레이션 파일이 있습니다:
- `src/supabase/migrations/001_initial_schema.sql`

이 파일을 Supabase SQL Editor에서 실행하세요.

---

## 🐛 문제 해결

### 문제 1: 연결 실패

**증상**: `Failed to fetch` 또는 `401 Unauthorized`

**해결 방법:**
1. `.env` 파일의 `VITE_SUPABASE_URL` 확인
2. `.env` 파일의 `VITE_SUPABASE_ANON_KEY` 확인
3. 서버 재시작 (환경 변수 변경 후 필수)
4. 브라우저 캐시 클리어

### 문제 2: 테이블이 없다는 오류

**증상**: `relation "medications" does not exist`

**해결 방법:**
1. Supabase SQL Editor에서 마이그레이션 파일 실행
2. 테이블이 생성되었는지 확인 (Table Editor에서 확인)

### 문제 3: RLS 정책 오류

**증상**: 데이터 조회 시 빈 결과 반환

**해결 방법:**
1. RLS 정책 확인 (Authentication → Policies)
2. 적절한 정책 생성 또는 RLS 비활성화 (개발용만)

---

## 📚 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript 클라이언트](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase 인증 가이드](https://supabase.com/docs/guides/auth)
- [Supabase RLS 정책](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ 체크리스트

### 초기 설정
- [ ] Supabase 계정 생성 또는 로그인
- [ ] Supabase 프로젝트 생성 또는 기존 프로젝트 선택
- [ ] Project URL 확인 및 복사
- [ ] `anon` `public` 키 확인 및 복사
- [ ] `.env` 파일에 Supabase 설정 추가
- [ ] 마이그레이션 파일 실행 (테이블 생성)
- [ ] RLS 정책 설정

### 개발 환경
- [ ] 개발 서버 재시작
- [ ] 브라우저 콘솔에서 연결 테스트
- [ ] 데이터 조회 테스트
- [ ] 데이터 저장 테스트

### 배포
- [ ] 배포 환경에 환경 변수 설정
- [ ] 프로덕션 RLS 정책 확인
- [ ] 보안 설정 점검

---

## 🎯 요약

### 제가 필요한 정보:
1. ✅ **Supabase Project URL**: `https://[프로젝트-ID].supabase.co`
2. ✅ **Supabase Anon Public Key**: `eyJ...` (JWT 토큰 형태)

### 사용자가 해야 할 작업:
1. ✅ Supabase 계정 생성/로그인
2. ✅ Supabase 프로젝트 생성 또는 선택
3. ✅ Settings → API에서 Project URL과 anon key 복사
4. ✅ `.env` 파일에 실제 값으로 업데이트
5. ✅ 마이그레이션 파일 실행 (테이블 생성)
6. ✅ 개발 서버 재시작 및 테스트

---

**작성일**: 2024-11-02  
**버전**: 1.0.0  
**상태**: 설정 가이드 완료 ✅

