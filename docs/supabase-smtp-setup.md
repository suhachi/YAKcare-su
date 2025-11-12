# Supabase SMTP 설정 가이드

## 개요
Supabase 기본 이메일 서비스는 무료 플랜에서 제한이 있을 수 있습니다. 안정적인 이메일 인증을 위해 커스텀 SMTP를 설정하는 것을 권장합니다.

## 지원되는 SMTP 제공업체
- **SendGrid**: 무료 플랜 100일/일
- **Mailgun**: 무료 플랜 5,000일/월
- **AWS SES**: 사용량 기반 과금
- **Postmark**: 무료 플랜 100일/월

## Supabase 대시보드에서 SMTP 설정

### 1. Authentication → Settings → SMTP
1. Supabase 대시보드에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **Authentication** → **Settings** 선택
4. **SMTP Settings** 섹션으로 스크롤

### 2. SMTP 제공업체에서 발신자 설정
예: SendGrid
1. SendGrid 계정 생성
2. **Settings** → **API Keys** → **Create API Key**
3. **Full Access** 권한으로 API 키 생성 (또는 SMTP 전용 권한)
4. **Settings** → **Sender Authentication** → **Verify a Single Sender** 또는 **Domain Authentication**
5. 발신자 이메일 주소 확인

### 3. Supabase에 SMTP 정보 입력
- **Enable custom SMTP**: 활성화
- **Sender email**: 발신자 이메일 주소 (예: `noreply@yourdomain.com`)
- **Sender name**: 발신자 이름 (예: `약 챙겨먹어요`)
- **Host**: SMTP 호스트 (예: `smtp.sendgrid.net`)
- **Port**: SMTP 포트 (예: `587` 또는 `465`)
- **Username**: SMTP 사용자명 (예: `apikey` for SendGrid)
- **Password**: SMTP 비밀번호 (예: SendGrid API 키)
- **Secure**: `true` (TLS/SSL 사용)

### 4. 테스트 이메일 발송
1. **Send test email** 버튼 클릭
2. 테스트 이메일 주소 입력
3. 이메일 수신 확인

## 환경 변수 설정 (선택 사항)
프로젝트에서 SMTP 설정을 확인하려면:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 문제 해결

### 이메일이 오지 않는 경우
1. **스팸함 확인**: 기본적으로 스팸함에 들어갈 수 있습니다
2. **발신자 인증 확인**: SMTP 제공업체에서 발신자 이메일/도메인 인증 완료 여부 확인
3. **Supabase 로그 확인**: Authentication → Logs에서 이메일 발송 실패 로그 확인
4. **Rate Limit 확인**: 무료 플랜의 일일 발송 제한 초과 여부 확인

### 인증 메일 링크가 localhost로 리다이렉트되는 경우
1. **Authentication → Settings → URL Configuration**
2. **Site URL**: 프로덕션 도메인 설정 (예: `https://ya-kcare-su.vercel.app`)
3. **Redirect URLs**: 추가 리다이렉트 URL 설정 (예: `http://localhost:5173`, `http://localhost:4173`)

## 참고 자료
- [Supabase SMTP 설정 문서](https://supabase.com/docs/guides/auth/auth-smtp)
- [SendGrid SMTP 설정](https://docs.sendgrid.com/for-developers/sending-email/getting-started-smtp)
- [Mailgun SMTP 설정](https://documentation.mailgun.com/en/latest/user_manual.html#sending-via-smtp)

