# 빌드 및 프리뷰 실행 안내

**작업일**: 2024-11-02

---

## ⚠️ 현재 상황

현재 터미널의 작업 디렉토리가 프로젝트 루트가 아닙니다 (`C:\Users\a`).

**프로젝트 루트 디렉토리**: `d:\projectsing\약챙겨먹어요 3 Lite버전 (수파)`

---

## ✅ 실행 방법

### 방법 1: 프로젝트 루트에서 직접 실행

1. **터미널에서 프로젝트 루트로 이동**:
   ```powershell
   cd "d:\projectsing\약챙겨먹어요 3 Lite버전 (수파)"
   ```

2. **빌드 실행**:
   ```bash
   npm run build
   ```
   
   또는
   ```bash
   npx vite build
   ```

3. **프리뷰 실행**:
   ```bash
   npm run preview
   ```
   
   또는
   ```bash
   npx vite preview
   ```

---

## 📋 예상 결과

### 빌드 성공 시:
```
vite v6.3.5 building for production...
✓ built in XXX ms

dist/index.html                    XXX kB
dist/assets/index-XXXXX.js         XXX kB
dist/assets/index-XXXXX.css        XXX kB
```

### 프리뷰 실행 시:
```
➜  Local:   http://localhost:4173/
➜  Network: http://192.168.x.x:4173/
➜  press h + enter to show help
```

---

## ✅ 확인 사항

### 빌드 완료 후
1. `build/` 디렉토리가 생성되었는지 확인
2. `build/index.html` 파일이 있는지 확인
3. `build/assets/` 디렉토리에 JS/CSS 파일이 있는지 확인

### 프리뷰 접속
1. 브라우저에서 `http://localhost:4173` 접속
2. SMOKE OK 화면이 정상적으로 보이는지 확인
3. 콘솔에서 Red 에러 없음 확인

---

## 📝 실행 체크리스트

| 항목 | 상태 | 비고 |
|------|------|------|
| ✅ 프로젝트 루트로 이동 | ⏳ | 수동 실행 필요 |
| ✅ npm run build 실행 | ⏳ | 수동 실행 필요 |
| ✅ 빌드 성공 확인 | ⏳ | 빌드 후 확인 |
| ✅ npm run preview 실행 | ⏳ | 수동 실행 필요 |
| ✅ 프리뷰 접속 확인 | ⏳ | http://localhost:4173 |

---

## ⚠️ 문제 해결

### 빌드 에러: "Could not resolve entry module index.html"
- **원인**: 프로젝트 루트가 아닌 디렉토리에서 실행
- **해결**: 프로젝트 루트 디렉토리로 이동 후 실행

### npm run build 스크립트를 찾을 수 없음
- **원인**: package.json이 현재 디렉토리에 없음
- **해결**: 프로젝트 루트 디렉토리로 이동 후 실행

---

## ✅ 다음 단계

1. **프로젝트 루트로 이동**
2. **빌드 실행**: `npm run build`
3. **프리뷰 실행**: `npm run preview`
4. **브라우저 접속**: `http://localhost:4173`
5. **SMOKE OK 확인**: 화면이 정상적으로 보이는지 확인

---

**참고**: 한글 경로 문제로 인해 터미널에서 자동으로 디렉토리 이동이 되지 않습니다. 수동으로 프로젝트 루트 디렉토리로 이동하여 실행해주세요.

