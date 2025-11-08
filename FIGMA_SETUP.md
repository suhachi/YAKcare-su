# Figma API 설정 완료 가이드

## ✅ Figma Access Token 설정

제공된 Figma Access Token이 준비되었습니다.

### 토큰 정보
```
<YOUR_FIGMA_ACCESS_TOKEN>
```

## 📝 설정 방법

### 1. `.env` 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Figma API 설정
VITE_FIGMA_FILE_KEY=FyR0lrMwAY5MHLj77UXOmv
VITE_FIGMA_ACCESS_TOKEN=<YOUR_FIGMA_ACCESS_TOKEN>
VITE_FIGMA_ENABLED=true
```

### 2. Supabase 설정 (필수)

Supabase 설정도 함께 추가하세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 개발 서버 재시작

환경 변수 변경 후 개발 서버를 재시작하세요:

```bash
# 현재 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
# 또는
pnpm run dev
```

## 🔍 토큰 테스트

### 방법 1: 브라우저 콘솔에서 테스트

개발 서버 실행 후 브라우저 콘솔에서:

```javascript
// Figma 설정 확인
console.log(import.meta.env.VITE_FIGMA_ENABLED);
console.log(import.meta.env.VITE_FIGMA_FILE_KEY);
```

### 방법 2: 컴포넌트에서 사용

```tsx
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

// Figma 노드 ID로 이미지 로드
<ImageWithFallback 
  figmaNodeId="node-id-from-figma"
  alt="Figma 이미지"
/>
```

## 🎨 Figma 파일 정보

- **파일 URL**: https://www.figma.com/design/FyR0lrMwAY5MHLj77UXOmv/%EC%95%BD%EC%B1%99%EA%B2%A8%EB%A8%B9%EC%96%B4%EC%9A%94-3-Lite%EB%B2%84%EC%A0%84--%EC%88%98%ED%8C%8C-
- **파일 키**: `FyR0lrMwAY5MHLj77UXOmv`

## 📚 사용 예시

### Figma 이미지 가져오기

```typescript
import { getFigmaImageByNodeId } from '@/services/figma.service';

// 특정 노드의 이미지 가져오기
const imageUrl = await getFigmaImageByNodeId('node-id-here');
console.log('이미지 URL:', imageUrl);
```

### Figma 컴포넌트 정보 조회

```typescript
import { getFigmaComponents } from '@/services/figma.service';

// 모든 컴포넌트 정보 가져오기
const components = await getFigmaComponents();
console.log('컴포넌트 목록:', Object.keys(components));
```

### 디자인 토큰 추출

```typescript
import { extractFigmaDesignTokens } from '@/services/figma.service';

// 디자인 토큰 추출 (색상, 타이포그래피 등)
const tokens = await extractFigmaDesignTokens();
console.log('색상 토큰:', tokens.colors);
```

## ⚠️ 보안 주의사항

1. **`.env` 파일을 Git에 커밋하지 마세요**
   - `.gitignore`에 `.env` 파일이 포함되어 있는지 확인
   - 토큰이 노출되면 새로 발급해야 합니다

2. **프로덕션 환경에서는 서버 사이드에서만 사용**
   - 프론트엔드에 토큰이 노출될 수 있습니다
   - 실제 프로덕션에서는 프록시 서버를 통해 사용하세요

3. **토큰 만료 시**
   - Figma에서 새 토큰을 발급받아 업데이트하세요

## ✅ 설정 확인

설정이 완료되면 다음을 확인하세요:

- [ ] `.env` 파일 생성 완료
- [ ] Figma Access Token 설정 완료
- [ ] `VITE_FIGMA_ENABLED=true` 설정
- [ ] 개발 서버 재시작 완료
- [ ] 브라우저 콘솔에서 환경 변수 확인
- [ ] Figma API 호출 테스트

## 🐛 문제 해결

### 토큰이 작동하지 않는 경우

1. **토큰 확인**
   ```bash
   # .env 파일에서 토큰 확인
   cat .env | grep FIGMA
   ```

2. **서버 재시작**
   - 환경 변수 변경 후 반드시 서버 재시작

3. **Figma 파일 접근 권한**
   - 토큰을 발급한 계정이 파일에 접근 권한이 있는지 확인

4. **API 호출 테스트**
```bash
curl -H "X-Figma-Token: <YOUR_FIGMA_ACCESS_TOKEN>" \
     "https://api.figma.com/v1/files/FyR0lrMwAY5MHLj77UXOmv"
```

## 📞 지원

문제가 계속되면:
- `FIGMA_SUPABASE_INTEGRATION.md` 문서 참조
- Figma API 문서: https://www.figma.com/developers/api

---

**설정 완료일**: 2024-11-02  
**상태**: 토큰 준비 완료 ✅

