# Figma + Supabase 할 수 있는 작업 가이드

## 🎨 **Figma에서 할 수 있는 것**

### ✅ **읽기 작업 (주요 기능)**

#### 1. **파일 정보 조회**
```typescript
// 파일 전체 구조 읽기
const fileData = await getFigmaFile('file-key');
// → 페이지, 프레임, 컴포넌트 등 모든 노드 정보
```

#### 2. **이미지 내보내기** ⭐
```typescript
// 노드를 이미지로 가져오기
const imageUrl = await getFigmaImageByNodeId('node-id', 'png', 2);

// 형식: PNG, JPG, SVG, PDF
// 스케일: 1x, 2x, 4x
```

**사용 예시**:
```tsx
<ImageWithFallback 
  figmaNodeId="123:456" 
  figmaFormat="png" 
  figmaScale={2} 
/>
```

#### 3. **컴포넌트 정보 조회**
```typescript
// 디자인 시스템 컴포넌트 목록
const components = await getFigmaComponents();
// → Button, Card, Input 등 모든 컴포넌트 메타데이터
```

#### 4. **디자인 토큰 추출** ⭐
```typescript
// 색상, 타이포그래피 등 자동 추출
const tokens = await extractFigmaDesignTokens();
// → colors: { primary: '#12B886', ... }
// → typography: { h1: {...}, ... }
// → spacing, borderRadius 등
```

**활용**: 
- CSS 변수로 자동 변환
- Tailwind 설정 파일 생성
- 디자인-코드 동기화

#### 5. **노드 검색**
```typescript
// 파일 내 특정 노드 찾기
const nodes = await searchFigmaNodes('file-key', 'Button');
// → 이름으로 검색, 재귀 탐색
```

#### 6. **주석 읽기** (부분)
```typescript
// 파일 주석 읽기 가능
// 새 주석 작성도 가능 (POST API)
```

---

### ⚠️ **제한된 작업**

#### 1. **주석 작성** (부분 가능)
- 새 주석 추가 ✅
- 기존 주석 수정/삭제 ❌

#### 2. **파일 수정** (매우 제한적)
- REST API로는 직접 수정 불가
- 파일 수정은 **Figma Plugin** 필요

---

### ❌ **할 수 없는 것**

1. ❌ 파일 직접 수정 (레이어 추가/삭제)
2. ❌ 노드 속성 변경 (색상, 크기, 위치 등)
3. ❌ 텍스트 내용 수정
4. ❌ 권한 관리 (파일 공유 설정)
5. ❌ 팀 관리 (멤버 추가/삭제)

**이유**: Figma REST API는 **주로 읽기 전용** 기능 제공

---

## 🗄️ **Supabase에서 할 수 있는 것**

### ✅ **데이터베이스 작업 (CRUD)**

#### 1. **약 관리 (medications)**

**생성 (Create)**:
```typescript
await saveMedication({
  userId: 'user-123',
  name: '타이레놀',
  category: 'PRESCRIPTION',
  slots: ['아침', '저녁'],
  times: ['08:00', '20:00'],
  // ...
});
```

**조회 (Read)**:
```typescript
// 사용자의 모든 약 조회
const meds = await listMedications('user-123');

// 특정 약 조회
const med = await getMedication('med-id');
```

**수정 (Update)**:
```typescript
await updateMedication('med-id', {
  name: '타이레놀 500mg',
  // ...
});
```

**삭제 (Delete)**:
```typescript
await deleteMedication('med-id');
```

---

#### 2. **복용 기록 관리 (doses)**

**생성**:
```typescript
// 오늘의 복용 인스턴스 자동 생성
await generateDoseInstances('user-123', medId);
```

**조회**:
```typescript
// 오늘의 복용 목록
const todayDoses = await listTodayDoses('user-123');

// 날짜 범위 조회
const doses = await getDosesByDateRange(
  'user-123',
  startTime,
  endTime
);
```

**수정**:
```typescript
// 복용 완료 처리
await markDone('dose-id');

// 복용 누락 처리
await markMissed('dose-id');

// 상태 업데이트
await updateDoseStatus('dose-id', 'DONE');
```

**구독 (실시간)**:
```typescript
// 실시간 변경 감지
subscribeDoseChange('user-123', (doses) => {
  console.log('복용 목록 업데이트:', doses);
});
```

---

#### 3. **건강 기록 관리 (health_records)**

**생성**:
```typescript
// 혈압 기록
await createHealthRecord({
  userId: 'user-123',
  type: 'BP',
  systolic: 120,
  diastolic: 80,
  pulse: 72,
  tag: 'MORNING',
  time: Date.now(),
});

// 혈당 기록
await createHealthRecord({
  userId: 'user-123',
  type: 'BG',
  glucose: 95,
  measurementType: 'FASTING',
  tag: 'MORNING',
  time: Date.now(),
});
```

**조회**:
```typescript
// 오늘의 기록
const today = await getTodayRecords('user-123', 'BP');

// 최근 기록
const recent = await getRecentRecords('user-123', 'BG', 10);

// 날짜 범위 조회
const records = await getRecordsByDateRange(
  'user-123',
  startDate,
  endDate,
  'BP'
);
```

**수정/삭제**:
```typescript
await updateHealthRecord('record-id', { systolic: 125 });
await deleteHealthRecord('record-id');
```

---

#### 4. **보호자 연결 관리 (care_links)**

**생성**:
```typescript
// 케어 링크 생성 (보호자-환자 연결)
await createLink({
  caregiverId: 'caregiver-123',
  patientId: 'patient-456',
  relation: 'FAMILY',
  status: 'PENDING',
  inviteCode: 'ABC123',
});
```

**조회**:
```typescript
// 보호자의 연결 목록
const links = await getLinksByCaregiver('caregiver-123');

// 환자의 연결 목록
const patientLinks = await getLinksByPatient('patient-456');

// 초대 코드로 연결 조회
const link = await getLinkByInviteCode('ABC123');
```

**수정**:
```typescript
// 연결 상태 업데이트
await updateLink('link-id', { status: 'ACTIVE' });

// 연결 닉네임 변경
await updateLink('link-id', { nickname: '엄마' });
```

**삭제**:
```typescript
await deleteLink('link-id');
```

---

### ✅ **고급 기능**

#### 1. **실시간 구독 (Realtime)**
```typescript
// 약 목록 실시간 감지
const subscription = supabase
  .channel('medications')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'medications' },
    (payload) => {
      console.log('약 데이터 변경:', payload);
    }
  )
  .subscribe();
```

#### 2. **필터링 & 정렬**
```typescript
// 복잡한 쿼리
const meds = await supabase
  .from('medications')
  .select('*')
  .eq('user_id', 'user-123')
  .eq('category', 'PRESCRIPTION')
  .order('created_at', { ascending: false })
  .limit(10);
```

#### 3. **Row Level Security (RLS)**
```typescript
// 사용자별 데이터 자동 필터링
// RLS 정책으로 자동 보안 적용
const doses = await listTodayDoses('user-123');
// → user_id가 'user-123'인 데이터만 자동 필터링
```

#### 4. **트랜잭션** (PostgreSQL 기능)
```typescript
// 여러 작업을 하나의 트랜잭션으로
// Supabase는 RPC 함수를 통해 지원
```

#### 5. **집계 함수**
```typescript
// 통계 계산
const { data } = await supabase
  .from('doses')
  .select('status')
  .eq('user_id', 'user-123')
  // → COUNT, SUM, AVG 등 PostgreSQL 함수 사용 가능
```

---

### ✅ **추가 기능**

#### 1. **Storage (파일 저장)**
```typescript
// 이미지 업로드
await supabase.storage
  .from('prescriptions')
  .upload('prescription-123.jpg', file);

// 이미지 다운로드
const { data } = await supabase.storage
  .from('prescriptions')
  .getPublicUrl('prescription-123.jpg');
```

#### 2. **Authentication (인증)**
```typescript
// 사용자 로그인
await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// 사용자 등록
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});
```

#### 3. **Edge Functions (서버리스 함수)**
```typescript
// 백엔드 로직 실행
await supabase.functions.invoke('send-notification', {
  body: { userId: 'user-123' },
});
```

---

## 📊 **현재 프로젝트에서 구현된 기능**

### **Figma 연동**
- ✅ `getFigmaFile()` - 파일 정보 조회
- ✅ `getFigmaImageByNodeId()` - 이미지 내보내기
- ✅ `getFigmaComponents()` - 컴포넌트 정보
- ✅ `extractFigmaDesignTokens()` - 디자인 토큰 추출
- ✅ `searchFigmaNodes()` - 노드 검색
- ✅ `ImageWithFallback` 컴포넌트 - Figma 이미지 표시

### **Supabase 연동**
- ✅ **medications** - 약 등록/조회/수정/삭제
- ✅ **doses** - 복용 인스턴스 생성/조회/상태 업데이트
- ✅ **health_records** - 건강 기록 생성/조회/수정/삭제
- ✅ **care_links** - 보호자 연결 생성/조회/수정/삭제
- ✅ **실시간 구독** - 변경 감지
- ✅ **RLS 정책** - 자동 보안 필터링

---

## 🎯 **활용 예시**

### **시나리오 1: Figma 디자인 → React 컴포넌트**

```typescript
// 1. Figma에서 컴포넌트 이미지 가져오기
const buttonImage = await getFigmaImageByNodeId('button-component-id');

// 2. React 컴포넌트에서 사용
<ImageWithFallback 
  figmaNodeId="button-component-id" 
  alt="Button" 
/>
```

### **시나리오 2: 디자인 토큰 동기화**

```typescript
// 1. Figma에서 디자인 토큰 추출
const tokens = await extractFigmaDesignTokens();

// 2. CSS 변수로 변환
updateCSSVariables(tokens.colors);

// 3. Tailwind 설정 업데이트
updateTailwindConfig(tokens);
```

### **시나리오 3: 약 등록 → 복용 인스턴스 생성**

```typescript
// 1. 약 등록
const medication = await saveMedication({
  userId: 'user-123',
  name: '타이레놀',
  slots: ['아침', '저녁'],
  times: ['08:00', '20:00'],
});

// 2. 복용 인스턴스 자동 생성
await generateDoseInstances('user-123', medication.id);

// 3. 오늘의 복용 목록 조회
const todayDoses = await listTodayDoses('user-123');

// 4. 실시간 변경 감지
subscribeDoseChange('user-123', (doses) => {
  updateUI(doses);
});
```

### **시나리오 4: 보호자 → 환자 연결**

```typescript
// 1. 보호자가 초대 코드 생성
const link = await createLink({
  caregiverId: 'caregiver-123',
  patientId: 'patient-456',
  inviteCode: 'ABC123',
});

// 2. 환자가 초대 코드로 연결
const accepted = await acceptInvite('ABC123');

// 3. 보호자가 환자의 복용 현황 조회
const doses = await listTodayDoses('patient-456');
```

---

## 📋 **요약**

### **Figma에서 할 수 있는 것:**
1. ✅ 파일 구조 읽기
2. ✅ 이미지 내보내기 (PNG/JPG/SVG/PDF)
3. ✅ 컴포넌트 정보 조회
4. ✅ 디자인 토큰 추출 (색상, 타이포그래피 등)
5. ✅ 노드 검색
6. ✅ 주석 읽기/작성 (부분)

### **Supabase에서 할 수 있는 것:**
1. ✅ **CRUD 작업** (생성/조회/수정/삭제)
   - medications (약)
   - doses (복용 기록)
   - health_records (건강 기록)
   - care_links (보호자 연결)

2. ✅ **고급 기능**
   - 실시간 구독 (Realtime)
   - 필터링 & 정렬
   - Row Level Security (RLS)
   - 집계 함수

3. ✅ **추가 기능**
   - Storage (파일 저장)
   - Authentication (인증)
   - Edge Functions (서버리스)

### **Figma의 제한:**
- ❌ 파일 직접 수정 불가 (읽기 전용)
- ❌ 속성 변경 불가
- 수정이 필요하면 **Figma Plugin** 개발 필요

### **Supabase의 강점:**
- ✅ 완전한 CRUD 작업 가능
- ✅ 실시간 데이터 동기화
- ✅ 자동 보안 (RLS)
- ✅ 확장 가능한 백엔드 서비스

---

**작성일**: 2024-11-02  
**버전**: 1.0.0

