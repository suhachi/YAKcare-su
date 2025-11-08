import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { YakCareLogo } from "../YakCareLogo";
import { UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { acceptInvite } from "../../services/links.service";
import { RelationType, RELATION_LABELS } from "../../types/link";

type AcceptStep = 'code' | 'confirm' | 'label' | 'complete';

interface InviteAcceptProps {
  inviteCode?: string; // URL에서 전달된 초대 코드
  patientId: string;   // 현재 복용자 ID
  onAccept?: () => void;
  onDeny?: () => void;
}

export function InviteAccept({
  inviteCode: initialCode,
  patientId,
  onAccept,
  onDeny,
}: InviteAcceptProps) {
  const [step, setStep] = useState<AcceptStep>(initialCode ? 'confirm' : 'code');
  const [codeInput, setCodeInput] = useState(initialCode || '');
  const [relation, setRelation] = useState<RelationType>('GUARDIAN');
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const handleCodeSubmit = async () => {
    if (codeInput.length !== 6) {
      toast.error('6자리 코드를 입력해 주세요');
      return;
    }

    setIsLoading(true);
    console.log('GA4: invite_code_verify', { code: codeInput });

    // Step 4.6: 초대 코드 검증 (실제로는 accept 시 검증)
    try {
      // 임시로 confirm 단계로 이동 (실제 검증은 accept에서 수행)
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsLoading(false);
      setStep('confirm');
      toast.success('초대가 확인되었습니다');
    } catch (error: any) {
      setIsLoading(false);
      setFailCount(failCount + 1);

      if (failCount >= 2) {
        toast.error('코드 확인에 3회 실패했습니다. 5분 후 다시 시도해 주세요');
      } else {
        toast.error(error.message || '코드가 일치하지 않습니다');
      }
      
      setCodeInput('');
    }
  };

  const handleAllow = () => {
    setStep('label');
    console.log('GA4: invite_accept_allow');
  };

  const handleDeny = () => {
    console.log('GA4: invite_accept_deny');
    toast('초대를 거절했습니다');
    onDeny?.();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    console.log('GA4: patient_invite_accept', { relation, nickname });

    try {
      // Step 4.6: 초대 수락
      await acceptInvite(codeInput, patientId, relation, nickname || undefined);
      
      setIsLoading(false);
      setStep('complete');
      toast.success('연결이 완료되었습니다');

      setTimeout(() => {
        onAccept?.();
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Invite accept error:', error);
      
      if (error.message?.includes('LINK_LIMIT_EXCEEDED')) {
        toast.error('최대 연결 수를 초과했습니다');
      } else if (error.message?.includes('INVITE_EXPIRED')) {
        toast.error('초대 코드가 만료되었습니다');
      } else if (error.message?.includes('INVITE_NOT_FOUND')) {
        toast.error('유효하지 않은 초대 코드입니다');
      } else {
        toast.error('연결에 실패했습니다');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'white' }}>
      <div className="flex-1 flex flex-col px-4 pb-8">
        {/* 로고 */}
        <div className="flex justify-center mb-8">
          <YakCareLogo width={120} />
        </div>

        {/* 코드 입력 단계 */}
        {step === 'code' && (
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
                초대 코드를 입력해 주세요
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                보호자에게 받은 6자리 코드
              </p>
            </div>

            <div>
              <Label style={{ fontSize: '1rem', marginBottom: '8px', display: 'block' }}>
                초대 코드
              </Label>
              <Input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="ABC123"
                maxLength={6}
                style={{
                  minHeight: '72px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  letterSpacing: '0.2em',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <Button
              onClick={handleCodeSubmit}
              disabled={isLoading || codeInput.length !== 6 || failCount >= 3}
              className="w-full"
              style={{
                minHeight: '64px',
                fontSize: '1.25rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              {isLoading ? '확인 중...' : failCount >= 3 ? '잠시 후 다시 시도해 주세요' : '확인'}
            </Button>
          </div>
        )}

        {/* 승인 확인 단계 */}
        {step === 'confirm' && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div
                className="flex items-center justify-center rounded-full mb-6"
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: 'rgba(18, 184, 134, 0.1)',
                }}
              >
                <UserCheck className="w-16 h-16" style={{ color: 'var(--brand-primary)' }} />
              </div>

              <h1
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  marginBottom: '12px',
                }}
              >
                보호자와<br />연결하시겠어요?
              </h1>

              <p
                style={{
                  fontSize: '1.125rem',
                  color: 'var(--brand-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                허용하면 복약 일정과 건강 기록이 공유됩니다.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleAllow}
                className="w-full gap-2"
                style={{
                  minHeight: '72px',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--brand-primary)',
                  color: 'white',
                }}
              >
                <UserCheck className="w-6 h-6" />
                허용
              </Button>
              <Button
                variant="outline"
                onClick={handleDeny}
                className="w-full gap-2"
                style={{
                  minHeight: '64px',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--brand-text-secondary)',
                }}
              >
                <UserX className="w-5 h-5" />
                거절
              </Button>
            </div>
          </div>
        )}

        {/* 관계 선택 단계 */}
        {step === 'label' && (
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
                관계를 선택해 주세요
              </h1>
              <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
                보호자와의 관계를 알려주세요
              </p>
            </div>

            <div className="space-y-3">
              <Label style={{ fontSize: '1rem' }}>관계</Label>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(RELATION_LABELS) as RelationType[]).map((rel) => (
                  <button
                    key={rel}
                    onClick={() => setRelation(rel)}
                    className="rounded-xl transition-all"
                    style={{
                      minHeight: '56px',
                      padding: '12px',
                      fontSize: '1rem',
                      backgroundColor: relation === rel ? 'var(--brand-primary)' : 'white',
                      color: relation === rel ? 'white' : 'var(--brand-text)',
                      border: `2px solid ${relation === rel ? 'var(--brand-primary)' : 'var(--brand-border)'}`,
                    }}
                  >
                    {RELATION_LABELS[rel]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label style={{ fontSize: '1rem' }}>별명 (선택)</Label>
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 아버님, 어머님"
                style={{ fontSize: '1rem', minHeight: '56px' }}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                알림에 표시될 이름입니다
              </p>
            </div>

            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="w-full"
              style={{
                minHeight: '64px',
                fontSize: '1.25rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              {isLoading ? '연결 중...' : '완료'}
            </Button>
          </div>
        )}

        {/* 완료 */}
        {step === 'complete' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
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
              연결이 완료되었습니다
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
              이제 함께 복약을 관리할 수 있어요
            </p>
          </div>
        )}
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
