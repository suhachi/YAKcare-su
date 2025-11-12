# OCR 통합 가이드

## 개요
처방전 텍스트 인식을 위한 OCR 기능은 현재 시뮬레이션 상태입니다. 실제 OCR을 구현하려면 다음 옵션을 고려할 수 있습니다.

## 옵션 1: 클라이언트 측 OCR (Tesseract.js)
### 장점
- 서버 비용 없음
- 빠른 응답 시간
- 오프라인 사용 가능

### 단점
- 번들 크기 증가 (약 2MB)
- 성능 이슈 (저사양 기기에서 느림)
- 정확도 한계

### 구현 방법
```bash
pnpm add tesseract.js
```

```typescript
import { createWorker } from 'tesseract.js';

const worker = await createWorker('kor');
const { data: { text } } = await worker.recognize(imageFile);
await worker.terminate();
```

## 옵션 2: 서버 측 OCR (Google Cloud Vision, AWS Textract)
### 장점
- 높은 정확도
- 다양한 언어 지원
- 클라이언트 번들 크기 증가 없음

### 단점
- 서버 비용 발생
- 네트워크 요청 필요
- API 키 관리 필요

### 구현 방법
1. Google Cloud Vision API 또는 AWS Textract 설정
2. 서버리스 함수 생성 (Vercel Functions, Supabase Functions)
3. 클라이언트에서 이미지를 서버로 전송
4. 서버에서 OCR API 호출
5. 결과를 클라이언트로 반환

## 옵션 3: 하이브리드 (클라이언트 + 서버)
### 장점
- 빠른 응답 (클라이언트 측)
- 높은 정확도 (서버 측 fallback)
- 오프라인 사용 가능 (클라이언트 측)

### 단점
- 구현 복잡도 증가
- 두 가지 OCR 엔진 관리 필요

## 권장 사항
현재 프로젝트에서는 **옵션 2 (서버 측 OCR)**를 권장합니다:
- 번들 크기 최소화
- 높은 정확도 (처방전 텍스트 인식에 중요)
- 서버 비용은 사용량 기반으로 관리 가능

## 다음 단계
1. Google Cloud Vision API 또는 AWS Textract 계정 생성
2. 서버리스 함수 구현 (Vercel Functions 또는 Supabase Functions)
3. 클라이언트에서 이미지 업로드 로직 구현
4. OCR 결과를 `mapScanToDraft` 함수에 전달

## 참고 자료
- [Tesseract.js 문서](https://tesseract.projectnaptha.com/)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)
- [AWS Textract](https://aws.amazon.com/textract/)

