# Figma API 권한 및 기능 가이드

## 📋 개요

Figma Personal Access Token을 통해 제가 할 수 있는 작업과 권한을 설명합니다.

---

## ✅ 할 수 있는 작업 (읽기 중심)

### 1. **파일 정보 읽기**
```typescript
// ✅ 가능: 파일 구조, 노드 정보 조회
const fileData = await getFigmaFile('file-key');
console.log(fileData.document); // 전체 파일 구조
```

**권한**: 
- 파일의 전체 구조 읽기
- 페이지, 프레임, 컴포넌트 등 모든 노드 정보 조회
- 파일 메타데이터 읽기 (버전, 이름, 수정일 등)

### 2. **이미지 내보내기**
```typescript
// ✅ 가능: 노드를 이미지로 내보내기
const imageUrl = await getFigmaImageByNodeId('node-id', 'png', 2);
```

**권한**:
- PNG, JPG, SVG, PDF 형식으로 내보내기
- 다양한 스케일 (1x, 2x, 4x) 지원
- 프레임, 컴포넌트, 페이지 등 모든 노드 이미지화

**사용 사례**:
- 디자인 컴포넌트를 이미지로 가져와 React 컴포넌트에서 사용
- 아이콘, 일러스트 자동 내보내기
- 프로토타입 스크린샷 자동 생성

### 3. **컴포넌트 정보 조회**
```typescript
// ✅ 가능: 컴포넌트 목록 및 메타데이터 조회
const components = await getFigmaComponents();
```

**권한**:
- 모든 컴포넌트 목록 조회
- 컴포넌트 메타데이터 (이름, 설명, 속성 등)
- 컴포넌트 사용처 추적

**사용 사례**:
- 디자인 시스템 컴포넌트 자동 문서화
- 컴포넌트 목록을 기반으로 React 컴포넌트 자동 생성
- 컴포넌트 사용 빈도 분석

### 4. **디자인 토큰 추출**
```typescript
// ✅ 가능: 색상, 타이포그래피, 간격 등 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();
console.log(tokens.colors); // 색상 토큰
```

**권한**:
- 색상 스타일 추출
- 텍스트 스타일 (타이포그래피) 추출
- 간격, 반경 등 레이아웃 토큰 추출
- CSS 변수로 변환 가능

**사용 사례**:
- 디자인 토큰을 CSS 변수로 자동 변환
- Tailwind CSS 설정 파일 자동 생성
- 디자인 시스템과 코드 동기화

### 5. **노드 검색**
```typescript
// ✅ 가능: 파일 내 특정 노드 검색
const nodes = await searchFigmaNodes('file-key', 'Button');
```

**권한**:
- 노드 이름으로 검색
- 재귀적으로 전체 파일 구조 탐색
- 특정 조건에 맞는 노드 필터링

### 6. **파일 버전 정보 조회**
```typescript
// ✅ 가능: 파일 버전 히스토리 조회
// (추가 구현 필요)
```

**권한**:
- 파일 버전 목록 조회
- 특정 버전의 파일 내용 읽기
- 변경 이력 추적

### 7. **주석 읽기**
```typescript
// ✅ 가능: 파일 주석 읽기
// (추가 구현 필요)
```

**권한**:
- 모든 주석 읽기
- 주석 메타데이터 (작성자, 시간 등)

---

## ⚠️ 제한된 작업 (부분 가능)

### 1. **주석 작성**
```typescript
// ⚠️ 부분 가능: 주석 작성 (API 지원)
// POST /v1/files/{file_key}/comments
```

**권한**:
- 새로운 주석 추가 가능
- 기존 주석 수정/삭제는 제한적

### 2. **파일 수정**
```typescript
// ⚠️ 매우 제한적: REST API로는 제한적인 수정만 가능
// Plugin API가 아닌 REST API의 한계
```

**제한사항**:
- 직접적인 레이어 수정 불가 (REST API 한계)
- 노드 추가/삭제 불가
- 속성 변경은 매우 제한적
- 파일 수정은 주로 **Figma Plugin**을 통해서만 가능

---

## ❌ 할 수 없는 작업

### 1. **파일 직접 수정**
```typescript
// ❌ 불가능: 노드 추가/삭제/이동
// ❌ 불가능: 레이어 속성 변경 (색상, 크기 등)
// ❌ 불가능: 텍스트 내용 수정
```

**이유**: 
- Figma REST API는 주로 **읽기 전용** 기능 제공
- 파일 수정은 **Figma Plugin API**를 통해서만 가능

### 2. **권한 관리**
```typescript
// ❌ 불가능: 파일 공유 설정 변경
// ❌ 불가능: 사용자 권한 관리
```

### 3. **팀 관리**
```typescript
// ❌ 불가능: 팀 멤버 추가/삭제
// ❌ 불가능: 프로젝트 생성/삭제
```

---

## 🎯 실제 구현된 기능 (현재 프로젝트)

### ✅ 구현 완료된 기능

1. **Figma 파일 정보 조회** (`getFigmaFile`)
   - 파일 전체 구조 읽기
   - 모든 노드 정보 조회

2. **이미지 내보내기** (`getFigmaImages`, `getFigmaImageByNodeId`)
   - PNG/JPG/SVG/PDF 형식
   - 다양한 스케일 지원
   - React 컴포넌트에서 바로 사용 가능

3. **컴포넌트 정보 조회** (`getFigmaComponents`)
   - 컴포넌트 목록 및 메타데이터

4. **디자인 토큰 추출** (`extractFigmaDesignTokens`)
   - 색상, 타이포그래피 등 자동 추출
   - CSS 변수로 변환 가능

5. **노드 검색** (`searchFigmaNodes`)
   - 이름 기반 검색
   - 재귀 탐색 지원

### 🔄 추가 구현 가능한 기능

1. **파일 버전 조회**
   - 버전 히스토리 읽기

2. **주석 읽기/쓰기**
   - 주석 목록 조회
   - 새 주석 추가 (POST API)

3. **프로젝트/팀 정보 조회**
   - 팀 목록 조회
   - 프로젝트 목록 조회

---

## 💡 활용 예시

### 시나리오 1: 디자인 컴포넌트를 React로 변환

```typescript
// 1. Figma에서 컴포넌트 정보 가져오기
const components = await getFigmaComponents();

// 2. 각 컴포넌트를 이미지로 내보내기
for (const [componentId, componentInfo] of Object.entries(components)) {
  const imageUrl = await getFigmaImageByNodeId(componentId);
  // React 컴포넌트에서 사용
  <ImageWithFallback figmaNodeId={componentId} />
}
```

### 시나리오 2: 디자인 토큰을 CSS 변수로 변환

```typescript
// 1. 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();

// 2. CSS 변수로 변환
const cssVars = tokensToCSSVars(tokens.colors);

// 3. CSS 파일에 삽입 또는 인라인 스타일로 적용
document.documentElement.style.cssText += cssVars;
```

### 시나리오 3: 디자인 변경 감지

```typescript
// 1. 현재 파일 버전 저장
const currentVersion = fileData.version;

// 2. 주기적으로 파일 버전 확인
setInterval(async () => {
  const latestFile = await getFigmaFile();
  if (latestFile.version !== currentVersion) {
    console.log('디자인이 업데이트되었습니다!');
    // 디자인 토큰 재동기화
    const tokens = await extractFigmaDesignTokens();
    updateDesignTokens(tokens);
  }
}, 60000); // 1분마다 확인
```

---

## 🔒 보안 및 제한사항

### 1. **Access Token 권한**
- Personal Access Token은 **발급한 계정의 권한**을 따릅니다
- 파일에 대한 **읽기 권한**이 있어야 정보 조회 가능
- 파일 수정 권한이 있어도 **REST API로는 제한적**

### 2. **API Rate Limit**
- Figma API는 **요청 횟수 제한**이 있습니다
- 초당 요청 수 제한 (초당 약 1-2회)
- 시간당 요청 수 제한

### 3. **파일 접근 권한**
- 토큰 발급 계정이 파일에 접근 권한이 있어야 함
- 공개 파일 또는 공유된 파일만 접근 가능

### 4. **프로덕션 환경 주의**
- Access Token이 프론트엔드에 노출될 수 있음
- 실제 프로덕션에서는 **프록시 서버**를 통해 API 호출 권장

---

## 📚 추가 참고 자료

- [Figma REST API 문서](https://www.figma.com/developers/api)
- [Figma Plugin API](https://www.figma.com/plugin-docs/) - 파일 수정을 위해서는 Plugin API 필요
- [Figma Webhooks](https://www.figma.com/developers/api#webhooks) - 파일 변경 이벤트 구독

---

## ✅ 요약

### 제가 할 수 있는 것:
1. ✅ 파일 읽기 (구조, 메타데이터)
2. ✅ 이미지 내보내기 (PNG/JPG/SVG/PDF)
3. ✅ 컴포넌트 정보 조회
4. ✅ 디자인 토큰 추출 (색상, 타이포그래피)
5. ✅ 노드 검색
6. ✅ 주석 읽기/작성 (부분적)

### 제가 할 수 없는 것:
1. ❌ 파일 직접 수정 (레이어 추가/삭제/변경)
2. ❌ 노드 속성 변경 (색상, 크기, 위치 등)
3. ❌ 권한 관리
4. ❌ 팀 관리

### 결론:
Figma REST API는 **주로 읽기 전용**이며, 실제 파일 수정을 위해서는 **Figma Plugin**을 개발해야 합니다.

---

**작성일**: 2024-11-02  
**버전**: 1.0.0

