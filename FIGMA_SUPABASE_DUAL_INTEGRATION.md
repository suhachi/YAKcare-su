# Figma + Supabase 동시 연동 가이드

## ✅ 네, 두 개 동시 연동 가능합니다!

Figma와 Supabase는 **완전히 독립적**이며 **동시에 작동**할 수 있습니다.

---

## 🎯 역할 분담

### 📊 Supabase (백엔드 데이터베이스)
**역할**: 앱 데이터 저장 및 관리
- 약 정보 저장 (`medications` 테이블)
- 복용 인스턴스 관리 (`doses` 테이블)
- 건강 기록 저장 (`health_records` 테이블)
- 보호자-복용자 연결 관리 (`care_links` 테이블)
- 사용자 인증
- 실시간 데이터 구독

### 🎨 Figma (디자인 자산)
**역할**: 디자인 자산 가져오기
- 디자인 컴포넌트 이미지 내보내기
- 디자인 토큰 추출 (색상, 타이포그래피)
- 컴포넌트 정보 조회
- 디자인 변경 감지

---

## 🔧 현재 설정 상태

### ✅ Supabase 설정
```typescript
// 이미 활성화되어 있음
USE_SUPABASE_MEDS=true
USE_SUPABASE_DOSE=true
USE_SUPABASE_LINK=true
USE_SUPABASE_HEALTH=true
```

**파일 위치**:
- `src/utils/supabase/client.ts` - 클라이언트 초기화
- `src/services/supabase/*.dao.ts` - 데이터 접근 계층
- `src/services/*.service.ts` - 통합 서비스 레이어

### ✅ Figma 설정
```typescript
// 방금 설정 완료
VITE_FIGMA_FILE_KEY=FyR0lrMwAY5MHLj77UXOmv
VITE_FIGMA_ACCESS_TOKEN=<YOUR_FIGMA_ACCESS_TOKEN>
VITE_FIGMA_ENABLED=true
```
```typescript
// 방금 설정 완료
VITE_FIGMA_FILE_KEY=FyR0lrMwAY5MHLj77UXOmv
VITE_FIGMA_ACCESS_TOKEN=<YOUR_FIGMA_ACCESS_TOKEN>
VITE_FIGMA_ENABLED=true
```

**파일 위치**:
- `src/services/figma.service.ts` - Figma API 서비스
- `src/utils/figma.ts` - Figma 유틸리티
- `src/components/figma/ImageWithFallback.tsx` - Figma 이미지 컴포넌트

---

## 💡 동시 사용 시나리오

### 시나리오 1: 디자인 자산을 Supabase에 저장

```typescript
import { getFigmaImageByNodeId } from '@/services/figma.service';
import { getSupabaseClient } from '@/utils/supabase/client';

// 1. Figma에서 이미지 가져오기
const figmaImageUrl = await getFigmaImageByNodeId('component-node-id');

// 2. Supabase Storage에 업로드 (선택적)
const supabase = getSupabaseClient();
const { data, error } = await supabase.storage
  .from('medication-images')
  .upload('medication-1.png', figmaImageUrl);
```

### 시나리오 2: 디자인 토큰을 Supabase에 동기화

```typescript
import { extractFigmaDesignTokens } from '@/services/figma.service';
import { getSupabaseClient } from '@/utils/supabase/client';

// 1. Figma에서 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();

// 2. Supabase에 디자인 설정 저장
const supabase = getSupabaseClient();
await supabase.from('design_tokens').upsert({
  id: 'current',
  colors: tokens.colors,
  typography: tokens.typography,
  updated_at: new Date().toISOString()
});
```

### 시나리오 3: React 컴포넌트에서 동시 사용

```tsx
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { getMedication } from '@/services/medications.service';
import { useEffect, useState } from 'react';

function MedicationCard({ medId }: { medId: string }) {
  const [medication, setMedication] = useState(null);

  useEffect(() => {
    // Supabase에서 약 정보 가져오기
    getMedication(medId).then(setMedication);
  }, [medId]);

  return (
    <div>
      {/* Figma 이미지 사용 */}
      <ImageWithFallback 
        figmaNodeId={medication?.figmaComponentId}
        alt={medication?.name}
      />
      
      {/* Supabase 데이터 표시 */}
      <h3>{medication?.name}</h3>
      <p>카테고리: {medication?.category}</p>
    </div>
  );
}
```

---

## 📋 환경 변수 설정 (.env)

두 개 모두 활성화하려면 `.env` 파일에 다음을 포함하세요:

```env
# ===== Supabase 설정 =====
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Supabase 기능 활성화
VITE_USE_SUPABASE_MEDS=true
VITE_USE_SUPABASE_DOSE=true
VITE_USE_SUPABASE_LINK=true
VITE_USE_SUPABASE_HEALTH=true

# ===== Figma 설정 =====
VITE_FIGMA_FILE_KEY=FyR0lrMwAY5MHLj77UXOmv
VITE_FIGMA_ACCESS_TOKEN=<YOUR_FIGMA_ACCESS_TOKEN>
VITE_FIGMA_ENABLED=true
```

---

## 🔄 동작 방식

### 독립적인 초기화
```typescript
// Supabase 클라이언트 (앱 시작 시)
import { getSupabaseClient } from '@/utils/supabase/client';
const supabase = getSupabaseClient();

// Figma API 호출 (필요할 때만)
import { getFigmaFile } from '@/services/figma.service';
const fileData = await getFigmaFile();
```

### Feature Flag로 독립 제어
```typescript
// env.ts에서 각각 독립적으로 활성화/비활성화 가능
FEATURE_FLAGS = {
  USE_SUPABASE_MEDS: true,      // Supabase 약 저장
  USE_SUPABASE_DOSE: true,      // Supabase 복용 인스턴스
  FIGMA_ENABLED: true,          // Figma API 활성화
}
```

---

## ✅ 충돌 없음

### 이유:
1. **다른 API 엔드포인트**
   - Supabase: `https://your-project.supabase.co`
   - Figma: `https://api.figma.com/v1`

2. **다른 목적**
   - Supabase: 데이터 저장/조회
   - Figma: 디자인 자산 가져오기

3. **독립적인 환경 변수**
   - 각각 별도의 설정으로 제어

4. **다른 서비스 레이어**
   - Supabase: `src/services/supabase/*.dao.ts`
   - Figma: `src/services/figma.service.ts`

---

## 🎨 실제 활용 예시

### 예시 1: 약 등록 시 Figma 이미지 사용
```typescript
// 1. Figma에서 약 아이콘 가져오기
const iconUrl = await getFigmaImageByNodeId('med-icon-123');

// 2. Supabase에 약 정보 저장 (이미지 URL 포함)
await saveMedication({
  name: '타이레놀',
  category: 'PRESCRIPTION',
  figmaIconUrl: iconUrl, // Figma 이미지 URL 저장
  // ... 기타 정보
});
```

### 예시 2: 디자인 시스템 자동 동기화
```typescript
// 1. Figma에서 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();

// 2. Supabase에 디자인 설정 저장
await supabase.from('design_settings').upsert({
  colors: tokens.colors,
  typography: tokens.typography,
});

// 3. React 앱에서 Supabase 설정 로드
const { data } = await supabase.from('design_settings').select('*').single();
// CSS 변수로 적용
applyDesignTokens(data);
```

---

## 🚀 성능 고려사항

### 최적화 팁:
1. **Figma API 호출 최소화**
   - 이미지 URL 캐싱
   - 디자인 토큰은 주기적으로만 동기화 (예: 하루 1회)

2. **Supabase 실시간 구독**
   - 필요한 데이터만 구독
   - 불필요한 리스너 제거

3. **병렬 처리**
   - 독립적인 작업은 Promise.all()로 병렬 실행

```typescript
// 예시: 병렬 처리
const [fileData, medications] = await Promise.all([
  getFigmaFile(),              // Figma API
  listMedications(userId),      // Supabase API
]);
```

---

## ✅ 테스트 방법

### 1. Supabase 연결 확인
```typescript
import { getSupabaseClient } from '@/utils/supabase/client';

const supabase = getSupabaseClient();
const { data, error } = await supabase.from('medications').select('count');
console.log('Supabase 연결:', error ? '실패' : '성공');
```

### 2. Figma 연결 확인
```typescript
import { getFigmaFile } from '@/services/figma.service';

try {
  const fileData = await getFigmaFile();
  console.log('Figma 연결: 성공', fileData.document.name);
} catch (error) {
  console.log('Figma 연결: 실패', error);
}
```

### 3. 동시 사용 테스트
```typescript
// 두 API 동시 호출 테스트
const [supabaseData, figmaData] = await Promise.all([
  supabase.from('medications').select('*').limit(1),
  getFigmaFile(),
]);

console.log('Supabase:', supabaseData.data);
console.log('Figma:', figmaData.document.name);
```

---

## 📚 관련 문서

- **Supabase 설정**: `src/README.md`
- **Figma 설정**: `FIGMA_SUPABASE_INTEGRATION.md`
- **Figma 권한**: `FIGMA_API_PERMISSIONS.md`

---

## ✅ 결론

**네, 두 개 동시 연동 완벽하게 가능합니다!**

- ✅ 독립적으로 작동
- ✅ 충돌 없음
- ✅ 서로 보완적인 역할
- ✅ 이미 설정 완료

---

**작성일**: 2024-11-02  
**상태**: 동시 연동 지원 ✅

