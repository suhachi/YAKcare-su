import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { RelLabelChip } from "./RelLabelChip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";
import { ArrowLeft, Pause, Trash2, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { listLinksByUser, setLinkStatus, deleteLink } from "../../services/links.service";
import { CareLink, LinkStatus, LINK_STATUS_LABELS, LINK_STATUS_COLORS } from "../../types/link";

interface CareLinksProps {
  onBack?: () => void;
  onAddLink?: () => void;
  userId: string; // 현재 사용자 ID
  asCaregiver?: boolean; // true면 보호자로서의 연결 보기
}

export function CareLinks({ onBack, onAddLink, userId, asCaregiver = false }: CareLinksProps) {
  const [links, setLinks] = useState<CareLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<CareLink | null>(null);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  const targetLabel = asCaregiver ? '복용자' : '보호자';

  // Step 4.6: 연결 목록 로드
  useEffect(() => {
    loadLinks();
  }, [userId, asCaregiver]);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const data = await listLinksByUser(userId, asCaregiver ? 'caregiver' : 'patient');
      setLinks(data);
    } catch (error) {
      console.error('Failed to load links:', error);
      toast.error('연결 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleLabelChange = (linkId: string, newNickname: string) => {
    // Step 4.6: 닉네임 업데이트는 별도 API 필요 (MVP에서는 로컬만)
    setLinks(links.map(link =>
      link.id === linkId ? { ...link, nickname: newNickname } : link
    ));
    toast.success('호칭이 변경되었습니다');
    console.log('GA4: care_label_change', { linkId, nickname: newNickname });
  };

  const handlePause = async () => {
    if (!selectedLink) return;

    const newStatus: LinkStatus = selectedLink.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    try {
      await setLinkStatus(selectedLink.id, newStatus);
      setLinks(links.map(link =>
        link.id === selectedLink.id ? { ...link, status: newStatus } : link
      ));
      toast(newStatus === 'PAUSED' ? '연결이 일시중지되었습니다' : '연결이 재개되었습니다');
      console.log('GA4: link_status_change', { linkId: selectedLink.id, newStatus });
    } catch (error) {
      console.error('Failed to update link status:', error);
      toast.error('상태 변경에 실패했습니다');
    } finally {
      setShowPauseDialog(false);
      setSelectedLink(null);
    }
  };

  const handleRevoke = async () => {
    if (!selectedLink) return;

    try {
      await setLinkStatus(selectedLink.id, 'REVOKED');
      await loadLinks(); // 목록 새로고침
      toast('연결이 해지되었습니다');
      console.log('GA4: link_delete', { linkId: selectedLink.id });
    } catch (error) {
      console.error('Failed to revoke link:', error);
      toast.error('연결 해지에 실패했습니다');
    } finally {
      setShowRevokeDialog(false);
      setSelectedLink(null);
    }
  };

  const getStatusBadge = (status: LinkStatus) => {
    return (
      <Badge
        variant="outline"
        style={{
          backgroundColor: `${LINK_STATUS_COLORS[status]}1A`, // 10% opacity
          color: LINK_STATUS_COLORS[status],
          border: 'none',
          transition: 'all 150ms ease-in-out', // Step 4.6: Crossfade
        }}
      >
        {LINK_STATUS_LABELS[status]}
      </Badge>
    );
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  const activeLinks = links.filter(l => l.status !== 'REVOKED');

  const canAddLink = Boolean(onAddLink);

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
            연결 관리
          </h1>
        </div>

        {/* 설명 */}
        <p
          style={{
            fontSize: '1rem',
            color: 'var(--brand-text-secondary)',
            marginBottom: '24px',
          }}
        >
          연결된 {targetLabel} {activeLinks.length}명
        </p>

        {/* 연결 리스트 */}
        <div className="space-y-3 mb-6">
          {loading ? (
            <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              로딩 중...
            </p>
          ) : activeLinks.length === 0 ? (
            <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)', textAlign: 'center', padding: '40px 0' }}>
              연결된 {targetLabel}이 없습니다
            </p>
          ) : (
            activeLinks.map(link => (
              <div
                key={link.id}
                className="rounded-2xl"
                style={{
                  backgroundColor: 'white',
                  border: '2px solid var(--brand-border)',
                  padding: '16px',
                }}
              >
                {/* 상단: 이름 + 상태 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--brand-text)',
                        marginBottom: '4px',
                      }}
                    >
                      {asCaregiver ? `환자 #${link.patientId.slice(0, 6)}` : `보호자 #${link.caregiverId.slice(0, 6)}`}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                      {formatDate(new Date(link.createdAt))} 연결
                    </p>
                  </div>
                  {getStatusBadge(link.status)}
                </div>

                {/* 호칭 */}
                {link.nickname && (
                  <div className="mb-3">
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', marginBottom: '8px' }}>
                      호칭
                    </p>
                    <div
                      className="rounded-lg px-3 py-2 inline-block"
                      style={{
                        backgroundColor: 'var(--brand-bg)',
                        border: '1px solid var(--brand-border)',
                      }}
                    >
                      <span style={{ fontSize: '1rem', color: 'var(--brand-text)' }}>
                        {link.nickname}
                      </span>
                    </div>
                  </div>
                )}

              {/* 액션 버튼 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setSelectedLink(link);
                    setShowPauseDialog(true);
                  }}
                  disabled={link.status === 'REVOKED'}
                  style={{ minHeight: '44px', fontSize: '1rem' }}
                >
                  {link.status === 'ACTIVE' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      일시중지
                    </>
                  ) : link.status === 'PAUSED' ? (
                    <>
                      <Play className="w-4 h-4" />
                      재개
                    </>
                  ) : null}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setSelectedLink(link);
                    setShowRevokeDialog(true);
                  }}
                  disabled={link.status === 'REVOKED'}
                  style={{
                    minHeight: '44px',
                    fontSize: '1rem',
                    color: 'var(--brand-danger)',
                    borderColor: 'var(--brand-danger)',
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  해지
                </Button>
              </div>
            </div>
            ))
          )}
        </div>

        {/* 추가 버튼 */}
        <Button
          onClick={onAddLink}
          disabled={!canAddLink}
          className="w-full gap-2"
          style={{
            minHeight: '56px',
            fontSize: '1.125rem',
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
          }}
        >
          <Plus className="w-5 h-5" />
          {canAddLink ? `${targetLabel} 추가` : '초대 기능 준비 중'}
        </Button>
      </div>

      {/* 일시중지 다이얼로그 */}
      <AlertDialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: '1.5rem' }}>
              {selectedLink?.status === 'ACTIVE' ? '연결을 일시중지하시겠어요?' : '연결을 재개하시겠어요?'}
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: '1rem' }}>
              {selectedLink?.status === 'ACTIVE'
                ? '일시중지하면 알림이 전송되지 않습니다. 언제든 재개할 수 있어요.'
                : '재개하면 다시 알림이 전송됩니다.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-row">
            <AlertDialogCancel
              className="flex-1"
              style={{ minHeight: '56px', fontSize: '1.125rem' }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePause}
              className="flex-1"
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              {selectedLink?.status === 'ACTIVE' ? '일시중지' : '재개'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 해지 다이얼로그 */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: '1.5rem' }}>
              연결을 해지하시겠어요?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: '1rem' }}>
              해지하면 복약 정보가 공유되지 않습니다. 이 작업은 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 flex-row">
            <AlertDialogCancel
              className="flex-1"
              style={{ minHeight: '56px', fontSize: '1.125rem' }}
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              className="flex-1"
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-danger)',
                color: 'white',
              }}
            >
              해지
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
