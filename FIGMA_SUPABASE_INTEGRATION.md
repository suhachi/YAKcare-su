# Figma-Supabase 연동 가이드

## 📋 개요

이 문서는 **약챙겨먹어요 3 Lite버전 (수파)** 프로젝트의 Figma와 Supabase 연동 작업에 대한 가이드입니다.

### 프로젝트 정보
- **Figma 파일**: [약챙겨먹어요 3 Lite버전 (수파)](https://www.figma.com/design/FyR0lrMwAY5MHLj77UXOmv/%EC%95%BD%EC%B1%99%EA%B2%A8%EB%A8%B9%EC%96%B4%EC%9A%94-3-Lite%EB%B2%84%EC%A0%84--%EC%88%98%ED%8C%8C-)
- **파일 키**: `FyR0lrMwAY5MHLj77UXOmv`
- **백엔드**: Supabase

---

## 🔧 설정 방법

### 1. Figma API 토큰 발급

1. Figma 계정에 로그인
2. **Settings** → **Account** → **Personal access tokens** 이동
3. **Generate new token** 클릭
4. 토큰 이름 입력 (예: "약챙겨먹어요 프로젝트")
5. 토큰 생성 후 복사 (**한 번만 표시됨**)

### 2. 환경 변수 설정

`.env` 파일 또는 배포 환경 변수에 추가:

```env
# Figma API
VITE_FIGMA_FILE_KEY=FyR0lrMwAY5MHLj77UXOmv
VITE_FIGMA_ACCESS_TOKEN=your-figma-access-token-here
VITE_FIGMA_ENABLED=true
```

### 3. Supabase와 Figma 연동

#### Option A: Figma Make에서 Supabase 연결 (권장)

1. **Figma Make 파일 열기**
2. 오른쪽 상단 **"Make 설정"** 클릭
3. 왼쪽 사이드바에서 **"Supabase"** 선택
4. **"Supabase 연결"** 클릭
5. Supabase 계정 로그인 또는 새로 생성
6. 프로젝트 선택 또는 새로 생성
7. 연결 완료

#### Option B: 수동 설정

1. Supabase 프로젝트 대시보드 접속
2. **Settings** → **API**에서 프로젝트 URL과 API 키 확인
3. `.env` 파일에 Supabase 설정 추가:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📦 사용 방법

### 1. Figma 이미지 가져오기

```typescript
import { getFigmaImageByNodeId } from '@/services/figma.service';

// 특정 노드의 이미지 가져오기
const imageUrl = await getFigmaImageByNodeId('node-id-here');
```

### 2. Figma 컴포넌트 정보 조회

```typescript
import { getFigmaComponents } from '@/services/figma.service';

// 모든 컴포넌트 정보 가져오기
const components = await getFigmaComponents();
```

### 3. Figma 디자인 토큰 추출

```typescript
import { extractFigmaDesignTokens } from '@/services/figma.service';

// 디자인 토큰 추출 (색상, 타이포그래피 등)
const tokens = await extractFigmaDesignTokens();
console.log(tokens.colors); // 색상 토큰
console.log(tokens.typography); // 타이포그래피 토큰
```

### 4. ImageWithFallback 컴포넌트 사용

```tsx
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

<ImageWithFallback 
  src={figmaImageUrl}
  alt="설명"
  style={{ width: 200, height: 200 }}
/>
```

---

## 🔄 데이터 흐름

### Figma → Supabase 연동 시나리오

1. **디자인 업데이트 감지**
   - Figma 파일 변경 시 웹훅 또는 수동 트리거
   - Figma API로 최신 디자인 정보 가져오기

2. **디자인 토큰 동기화**
   - Figma에서 색상, 타이포그래피 등 디자인 토큰 추출
   - Supabase에 디자인 토큰 저장 또는 CSS 변수로 변환

3. **이미지 자산 동기화**
   - Figma 컴포넌트에서 이미지 URL 생성
   - Supabase Storage에 이미지 업로드 (선택적)
   - 또는 Figma 이미지 URL을 직접 사용

---

## 📁 파일 구조

```
src/
├── components/
│   └── figma/
│       └── ImageWithFallback.tsx    # 이미지 폴백 컴포넌트
├── services/
│   └── figma.service.ts             # Figma API 서비스
├── utils/
│   └── figma.ts                     # Figma 유틸리티 함수
└── config/
    └── env.ts                       # Figma 설정 (추가됨)
```

---

## 🎨 디자인 토큰 사용

### CSS 변수로 변환

```typescript
import { tokensToCSSVars, extractFigmaDesignTokens } from '@/utils/figma';

// 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();

// CSS 변수로 변환
const cssVars = tokensToCSSVars(tokens.colors);

// CSS 파일에 삽입 또는 인라인 스타일로 사용
document.documentElement.style.cssText += cssVars;
```

### React 컴포넌트에서 사용

```tsx
// tokens가 이미 로드된 경우
<div style={{ color: tokens.colors['brand-primary'] }}>
  약 챙겨먹어요
</div>
```

---

## 🔒 보안 고려사항

1. **Figma Access Token 보안**
   - ⚠️ `.env` 파일을 Git에 커밋하지 않기
   - ⚠️ 토큰을 프론트엔드 코드에 하드코딩하지 않기
   - ✅ 환경 변수로만 관리
   - ✅ 프로덕션 환경에서는 서버 사이드에서만 사용 권장

2. **Supabase API 키 보안**
   - ✅ `ANON_KEY`는 프론트엔드에서 사용 가능 (Row Level Security로 보호)
   - ⚠️ `SERVICE_ROLE_KEY`는 절대 프론트엔드에서 사용하지 않기
   - ✅ RLS 정책으로 데이터 접근 제어

---

## 🐛 문제 해결

### Figma API 오류

**증상**: "Figma API 오류: 401 Unauthorized"
- **원인**: Access Token이 잘못되었거나 만료됨
- **해결**: 새로운 토큰 발급 후 `.env` 업데이트

**증상**: "Figma API 오류: 403 Forbidden"
- **원인**: 파일에 대한 접근 권한 없음
- **해결**: Figma 파일 공유 설정 확인

### Supabase 연결 오류

**증상**: Supabase 클라이언트 초기화 실패
- **원인**: 환경 변수가 제대로 설정되지 않음
- **해결**: `.env` 파일에서 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY` 확인

---

## 📚 추가 리소스

- [Figma API 문서](https://www.figma.com/developers/api)
- [Supabase 문서](https://supabase.com/docs)
- [Figma Make 문서](https://www.figma.com/make)

---

## ✅ 체크리스트

### 초기 설정
- [ ] Figma Personal Access Token 발급
- [ ] `.env` 파일에 Figma 설정 추가
- [ ] Supabase 프로젝트 생성 또는 기존 프로젝트 연결
- [ ] Figma Make에서 Supabase 연결 완료

### 개발 환경
- [ ] `npm install` 또는 `pnpm install` 실행
- [ ] `npm run dev`로 개발 서버 실행
- [ ] Figma API 호출 테스트
- [ ] Supabase 연결 테스트

### 배포
- [ ] 배포 환경 변수 설정
- [ ] Figma API 토큰 설정 (보안)
- [ ] Supabase 프로젝트 URL 및 키 설정

---

**작성일**: 2024-11-02  
**버전**: 1.0.0  
**상태**: 초기 설정 완료 ✅

