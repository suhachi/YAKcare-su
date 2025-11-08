
  # 약챙겨먹어요 3 Lite버전 (수파)

  This is a code bundle for 약챙겨먹어요 3 Lite버전 (수파). The original project is available at https://www.figma.com/design/FyR0lrMwAY5MHLj77UXOmv/%EC%95%BD%EC%B1%99%EA%B2%A8%EB%A8%B9%EC%96%B4%EC%9A%94-3-Lite%EB%B2%84%EC%A0%84--%EC%88%98%ED%8C%8C-.

## Running the code

### 1. 의존성 설치
```bash
npm install
# 또는
pnpm install
```

### 2. 환경 변수 설정
`cp` 명령어로 `.env.example` 파일을 복사하여 `.env.local` 파일을 만든 뒤 값을 채웁니다:
```bash
cp .env.example .env.local
```

`/.env.local` 파일에 반드시 입력해야 하는 값:
- `VITE_SUPABASE_URL` — Supabase 프로젝트 URL (예: `https://xxxx.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` — Supabase Public Anon Key

선택 옵션:
- `VITE_BACKEND_TYPE` — 기본값 `supabase`
- 기타 Feature Flag 및 Figma 토큰 등 필요 시 추가

> Cursor에서 `.env.example`이 보이지 않으면 프로젝트 루트의 `.cursorignore`에 다음 규칙을 적용하세요: `.env.local` / `!.env.example`

스텝 자동화를 원하면 아래 스크립트를 실행하세요.
```bash
pnpm run setup
```
실행 후 출력되는 메시지에 따라 `.env.local` 값을 채워주면 됩니다.

### 3. 개발 서버 실행
```bash
npm run dev
# 또는
pnpm run dev
```

## 🔗 Figma 연동

이 프로젝트는 Figma와 Supabase가 연동되어 있습니다.

### Figma 파일
- **링크**: [약챙겨먹어요 3 Lite버전 (수파)](https://www.figma.com/design/FyR0lrMwAY5MHLj77UXOmv/%EC%95%BD%EC%B1%99%EA%B2%A8%EB%A8%B9%EC%96%B4%EC%9A%94-3-Lite%EB%B2%84%EC%A0%84--%EC%88%98%ED%8C%8C-)
- **파일 키**: `FyR0lrMwAY5MHLj77UXOmv`

### Figma API 사용하기

1. **Figma Personal Access Token 발급**
   - Figma → Settings → Account → Personal access tokens
   - 새 토큰 생성 후 `.env` 파일에 추가

2. **Figma API 활성화**
   - `.env` 파일에서 `VITE_FIGMA_ENABLED=true` 설정

3. **자세한 가이드**
   - `FIGMA_SUPABASE_INTEGRATION.md` 파일 참조

## 📚 문서

- **상세 기능 명세서**: `상세기능명세서.md`
- **Figma-Supabase 연동 가이드**: `FIGMA_SUPABASE_INTEGRATION.md`
- **프로젝트 설명**: `src/README.md`
 