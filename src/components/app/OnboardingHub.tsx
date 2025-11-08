import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Input } from "../ui/input";
import { ArrowLeft, QrCode, Key, Link as LinkIcon, Copy, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

type InviteMethod = 'qr' | 'code' | 'link';
type InviteStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

interface Invite {
  id: string;
  method: InviteMethod;
  code?: string;
  link?: string;
  status: InviteStatus;
  expiresAt: Date;
  createdAt: Date;
}

interface OnboardingHubProps {
  onBack?: () => void;
  role?: 'patient' | 'caregiver'; // 복용자는 보호자 추가, 보호자는 복용자 추가
}

export function OnboardingHub({ onBack, role = 'caregiver' }: OnboardingHubProps) {
  const [selectedMethod, setSelectedMethod] = useState<InviteMethod | null>(null);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [recentInvites, setRecentInvites] = useState<Invite[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const targetLabel = role === 'caregiver' ? '복용자' : '보호자';

  const handleCreateInvite = async (method: InviteMethod) => {
    setIsCreating(true);
    setSelectedMethod(method);

    // TODO: callable 'createInvite' 호출
    console.log('GA4: invite_create', { method });

    // 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newInvite: Invite = {
      id: `inv_${Date.now()}`,
      method,
      code: method === 'code' ? generateCode() : undefined,
      link: method === 'link' ? generateLink() : undefined,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분
      createdAt: new Date(),
    };

    setRecentInvites([newInvite, ...recentInvites]);
    setIsCreating(false);

    if (method === 'qr') {
      setShowQRDialog(true);
    } else if (method === 'code') {
      setShowCodeDialog(true);
    } else if (method === 'link') {
      setShowLinkDialog(true);
    }

    toast.success('초대가 생성되었습니다');
  };

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const generateLink = () => {
    const code = generateCode();
    return `https://yakcare.app/invite/${code}`;
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('링크가 복사되었습니다');
    console.log('GA4: invite_copy_link');
  };

  const handleCancelInvite = (inviteId: string) => {
    setRecentInvites(recentInvites.map(inv => 
      inv.id === inviteId ? { ...inv, status: 'CANCELLED' as InviteStatus } : inv
    ));
    toast('초대가 취소되었습니다');
    console.log('GA4: invite_cancel', { inviteId });
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return '만료됨';
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}분 남음`;
    
    const hours = Math.floor(minutes / 60);
    return `${hours}시간 남음`;
  };

  const getStatusBadge = (status: InviteStatus) => {
    const styles = {
      PENDING: { bg: 'rgba(240, 140, 0, 0.1)', color: 'var(--brand-warn)' },
      ACTIVE: { bg: 'rgba(18, 184, 134, 0.1)', color: 'var(--brand-success)' },
      EXPIRED: { bg: 'var(--brand-bg)', color: 'var(--brand-text-muted)' },
      CANCELLED: { bg: 'var(--brand-bg)', color: 'var(--brand-text-muted)' },
    };

    const labels = {
      PENDING: '대기 중',
      ACTIVE: '연결됨',
      EXPIRED: '만료',
      CANCELLED: '취소됨',
    };

    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: styles[status].bg,
          color: styles[status].color,
          border: 'none',
        }}
      >
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'white' }}>
      {/* 컨테이너 */}
      <div className="px-4 pb-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-text)' }}>
            {targetLabel} 추가
          </h1>
        </div>

        {/* 설명 */}
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--brand-text-secondary)',
            marginBottom: '24px',
            lineHeight: 1.5,
          }}
        >
          {role === 'caregiver' 
            ? '복용자와 연결하고 복약 일정을 함께 관리하세요.'
            : '보호자를 초대하고 복약 알림을 받으세요.'}
        </p>

        {/* 초대 방법 카드 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {/* 대면 연결 (QR) */}
          <button
            onClick={() => handleCreateInvite('qr')}
            disabled={isCreating}
            className="rounded-2xl text-left transition-all active:scale-98"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '20px',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl mb-3"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(18, 184, 134, 0.1)',
              }}
            >
              <QrCode className="w-7 h-7" style={{ color: 'var(--brand-primary)' }} />
            </div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '8px',
              }}
            >
              대면 연결
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: 1.4 }}>
              QR 코드를 직접 스캔해서 연결합니다
            </p>
          </button>

          {/* 원격 연결 (코드/링크) */}
          <button
            onClick={() => handleCreateInvite('link')}
            disabled={isCreating}
            className="rounded-2xl text-left transition-all active:scale-98"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '20px',
              minHeight: '180px',
              display: 'flex',
              flexDirection: 'column',
              cursor: isCreating ? 'not-allowed' : 'pointer',
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl mb-3"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(46, 196, 182, 0.1)',
              }}
            >
              <LinkIcon className="w-7 h-7" style={{ color: 'var(--brand-accent)' }} />
            </div>
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '8px',
              }}
            >
              원격 연결
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: 1.4 }}>
              링크나 코드를 공유해서 연결합니다
            </p>
          </button>
        </div>

        {/* 최근 발급 내역 */}
        {recentInvites.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '12px',
              }}
            >
              최근 발급 내역
            </h2>
            <div className="space-y-2">
              {recentInvites.map(invite => (
                <div
                  key={invite.id}
                  className="rounded-xl"
                  style={{
                    backgroundColor: 'white',
                    border: '2px solid var(--brand-border)',
                    padding: '16px',
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {invite.method === 'qr' && <QrCode className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />}
                      {invite.method === 'code' && <Key className="w-5 h-5" style={{ color: 'var(--brand-accent)' }} />}
                      {invite.method === 'link' && <LinkIcon className="w-5 h-5" style={{ color: 'var(--brand-accent)' }} />}
                      <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--brand-text)' }}>
                        {invite.method === 'qr' ? 'QR 코드' : invite.method === 'code' ? '코드' : '링크'}
                      </span>
                    </div>
                    {getStatusBadge(invite.status)}
                  </div>

                  {invite.code && (
                    <p
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--brand-text)',
                        fontFamily: 'monospace',
                        letterSpacing: '0.1em',
                        marginBottom: '8px',
                      }}
                    >
                      {invite.code}
                    </p>
                  )}

                  {invite.link && (
                    <div className="flex items-center gap-2 mb-2">
                      <p
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--brand-text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {invite.link}
                      </p>
                      <button
                        onClick={() => handleCopyLink(invite.link!)}
                        className="flex items-center justify-center rounded-lg transition-all active:scale-95"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: 'var(--brand-bg)',
                        }}
                      >
                        <Copy className="w-4 h-4" style={{ color: 'var(--brand-text)' }} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                      {formatTimeRemaining(invite.expiresAt)}
                    </p>
                    {invite.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancelInvite(invite.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg transition-all active:scale-95"
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--brand-danger)',
                          backgroundColor: 'rgba(224, 49, 49, 0.1)',
                        }}
                      >
                        <X className="w-4 h-4" />
                        취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* QR 다이얼로그 */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
              QR 코드로 연결
            </DialogTitle>
            <DialogDescription style={{ fontSize: '1rem' }}>
              {targetLabel}가 이 QR 코드를 스캔하면 연결됩니다
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div
              className="flex items-center justify-center rounded-2xl mx-auto"
              style={{
                width: '280px',
                height: '280px',
                backgroundColor: 'var(--brand-bg)',
                border: '2px solid var(--brand-border)',
              }}
            >
              <QrCode className="w-32 h-32" style={{ color: 'var(--brand-text-muted)' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)', marginTop: '16px' }}>
                QR 코드 생성 중...
              </p>
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--brand-text-secondary)',
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              30분 후 만료됩니다
            </p>
          </div>

          <Button
            onClick={() => setShowQRDialog(false)}
            style={{
              minHeight: '56px',
              fontSize: '1.125rem',
              backgroundColor: 'var(--brand-primary)',
              color: 'white',
            }}
          >
            닫기
          </Button>
        </DialogContent>
      </Dialog>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
