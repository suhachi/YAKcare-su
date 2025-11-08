import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { YakCareLogo } from "../YakCareLogo";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type AuthStep = 'phone' | 'otp' | 'complete';

interface AuthOTPProps {
  onComplete?: (phoneNumber: string) => void;
  onBack?: () => void;
}

export function AuthOTP({ onComplete, onBack }: AuthOTPProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResendAvailable, setIsResendAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OTP 타이머
  useEffect(() => {
    if (step === 'otp' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setIsResendAvailable(true);
    }
  }, [step, countdown]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      setPhoneNumber(value);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.length <= 3) return phone;
    if (phone.length <= 7) return `${phone.slice(0, 3)}-${phone.slice(3)}`;
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  };

  const handleSendOTP = async () => {
    if (phoneNumber.length < 10) {
      toast.error('전화번호를 확인해 주세요');
      return;
    }

    if (!agreedTerms || !agreedPrivacy) {
      toast.error('약관에 동의해 주세요');
      return;
    }

    setIsLoading(true);
    console.log('GA4: auth_otp_send', { phoneNumber });

    // TODO: callable 'sendOTP' 호출
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsLoading(false);
    setStep('otp');
    setCountdown(60);
    setIsResendAvailable(false);
    toast.success('인증번호가 전송되었습니다');

    // 첫 번째 OTP 입력 필드로 포커스
    setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // 한 자리만
    setOtp(newOtp);

    // 자동 포커스 이동
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // 6자리 완성 시 자동 검증
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode: string) => {
    setIsLoading(true);
    console.log('GA4: auth_otp_verify', { phoneNumber, otpCode });

    // TODO: callable 'verifyOTP' 호출
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 성공 가정
    const success = true;

    if (success) {
      setIsLoading(false);
      setStep('complete');
      toast.success('인증이 완료되었습니다');
      console.log('GA4: auth_otp_verify_success');

      // 2초 후 완료 콜백
      setTimeout(() => {
        onComplete?.(phoneNumber);
      }, 2000);
    } else {
      setIsLoading(false);
      setOtp(['', '', '', '', '', '']);
      toast.error('인증번호가 일치하지 않습니다');
      console.log('GA4: auth_otp_verify_fail');
      otpInputRefs.current[0]?.focus();
    }
  };

  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setCountdown(60);
    setIsResendAvailable(false);
    handleSendOTP();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      {/* Safe Area Top */}
      <div style={{ height: '44px' }} />

      {/* 헤더 */}
      {step !== 'complete' && onBack && (
        <div className="px-4 mb-6">
          <button
            onClick={onBack}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: 'var(--brand-bg)',
              border: '1px solid var(--brand-border)',
            }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--brand-text)' }} />
          </button>
        </div>
      )}

      {/* 컨텐츠 */}
      <div className="flex-1 flex flex-col px-4 pb-8">
        {/* 로고 */}
        <div className="flex justify-center mb-8">
          <YakCareLogo width={120} />
        </div>

        {/* 전화번호 입력 */}
        {step === 'phone' && (
          <div className="space-y-6">
            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  marginBottom: '8px',
                }}
              >
                전화번호를 입력해 주세요
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                인증번호를 보내드려요
              </p>
            </div>

            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
                전화번호
              </Label>
              <div className="flex gap-2">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    minWidth: '80px',
                    minHeight: '64px',
                    backgroundColor: 'var(--brand-bg)',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    color: 'var(--brand-text)',
                  }}
                >
                  +82
                </div>
                <Input
                  type="tel"
                  value={formatPhoneNumber(phoneNumber)}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  style={{
                    minHeight: '64px',
                    fontSize: '1.25rem',
                    flex: 1,
                  }}
                />
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedTerms}
                  onCheckedChange={(checked) => setAgreedTerms(checked as boolean)}
                  style={{ marginTop: '2px' }}
                />
                <Label
                  htmlFor="terms"
                  style={{ fontSize: '1rem', color: 'var(--brand-text)', cursor: 'pointer' }}
                >
                  서비스 이용약관에 동의합니다 (필수)
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="privacy"
                  checked={agreedPrivacy}
                  onCheckedChange={(checked) => setAgreedPrivacy(checked as boolean)}
                  style={{ marginTop: '2px' }}
                />
                <Label
                  htmlFor="privacy"
                  style={{ fontSize: '1rem', color: 'var(--brand-text)', cursor: 'pointer' }}
                >
                  개인정보 처리방침에 동의합니다 (필수)
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              disabled={isLoading || phoneNumber.length < 10 || !agreedTerms || !agreedPrivacy}
              className="w-full"
              style={{
                minHeight: '64px',
                fontSize: '1.25rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              {isLoading ? '전송 중...' : '인증번호 받기'}
            </Button>
          </div>
        )}

        {/* OTP 입력 */}
        {step === 'otp' && (
          <div className="space-y-6">
            <div>
              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  marginBottom: '8px',
                }}
              >
                인증번호를 입력해 주세요
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                {formatPhoneNumber(phoneNumber)}로 전송된 6자리 번호
              </p>
            </div>

            {/* OTP 입력 필드 */}
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(index, e)}
                  className="text-center"
                  style={{
                    width: '56px',
                    height: '64px',
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    border: digit ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                />
              ))}
            </div>

            {/* 타이머 & 재전송 */}
            <div className="text-center">
              {!isResendAvailable ? (
                <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                  {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                </p>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleResendOTP}
                  style={{ fontSize: '1rem', color: 'var(--brand-primary)' }}
                >
                  인증번호 다시 받기
                </Button>
              )}
            </div>
          </div>
        )}

        {/* 완료 */}
        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div
              className="flex items-center justify-center rounded-full mb-6"
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'rgba(18, 184, 134, 0.1)',
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="var(--brand-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--brand-text)',
                marginBottom: '12px',
              }}
            >
              인증이 완료되었습니다
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
              약 챙겨먹어요에 오신 것을 환영합니다!
            </p>
          </div>
        )}
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
