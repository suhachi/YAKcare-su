import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Clock, Bell } from "lucide-react";
import { toast } from "sonner";
import { getById, onMainTapNow, onMainTapSnooze, onConfirmTapDone, onConfirmTapNotYet } from "../../services/doses.service";

type AlertVariant = 'main' | 'confirm';
type SlotLabel = '아침' | '점심' | '저녁' | '취침 전';

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: AlertVariant;
  time: string; // "08:00"
  slot: SlotLabel;
  doseId?: string;
  patientName?: string; // 보호자 통지용
  onComplete?: () => void; // 완료 후 콜백 (홈 갱신용)
}

export function AlertModal({
  open,
  onOpenChange,
  variant = 'main',
  time,
  slot,
  doseId,
  patientName,
  onComplete,
}: AlertModalProps) {
  const [processing, setProcessing] = useState(false);

  const handleTakeNow = async () => {
    if (!doseId || processing) return;

    setProcessing(true);
    console.log('GA4: alert_main_take_now', { doseId });

    try {
      const dose = await getById(doseId);
      if (!dose) {
        toast.error('복용 정보를 찾을 수 없습니다');
        return;
      }

      await onMainTapNow(dose);
      toast.success('확인되었습니다');
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Take now error:', error);
      toast.error('처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const handleSnooze = async () => {
    if (!doseId || processing) return;

    setProcessing(true);
    console.log('GA4: alert_main_snooze', { doseId });

    try {
      const dose = await getById(doseId);
      if (!dose) {
        toast.error('복용 정보를 찾을 수 없습니다');
        return;
      }

      await onMainTapSnooze(dose);
      toast('10분 뒤에 다시 알려드릴게요');
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Snooze error:', error);
      toast.error('처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const handleDone = async () => {
    if (!doseId || processing) return;

    setProcessing(true);
    console.log('GA4: alert_confirm_done', { doseId });

    try {
      const dose = await getById(doseId);
      if (!dose) {
        toast.error('복용 정보를 찾을 수 없습니다');
        return;
      }

      await onConfirmTapDone(dose);
      toast.success('확인되었습니다');
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm done error:', error);
      toast.error('처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  const handleNotYet = async () => {
    if (!doseId || processing) return;

    setProcessing(true);
    console.log('GA4: alert_confirm_not_yet', { doseId });

    try {
      const dose = await getById(doseId);
      if (!dose) {
        toast.error('복용 정보를 찾을 수 없습니다');
        return;
      }

      await onConfirmTapNotYet(dose);
      
      // MISSED로 전환되었는지 확인
      const updatedDose = await getById(doseId);
      if (updatedDose?.status === 'MISSED') {
        toast.error('복용 시간이 지나 누락 처리되었습니다');
      } else {
        toast('15분 뒤에 다시 확인할게요');
      }
      
      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirm not yet error:', error);
      toast.error('처리 중 오류가 발생했습니다');
    } finally {
      setProcessing(false);
    }
  };

  // 시간 포맷팅 (08:00 -> 오전 8:00)
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour < 12 ? '오전' : '오후';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${period} ${displayHour}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0"
        style={{
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      >
        <DialogTitle className="sr-only">
          {variant === 'main' ? '복용 알림' : '복용 확인'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {variant === 'main'
            ? `${formatTime(time)} ${slot} 약 복용 시간 알림입니다.`
            : `${formatTime(time)} ${slot} 약 복용 여부를 확인해 주세요.`}
        </DialogDescription>
        <div className="flex flex-col">
          {/* 상단 아이콘/장식 */}
          <div
            className="flex items-center justify-center py-8"
            style={{
              backgroundColor: 'var(--brand-bg)',
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 80,
                height: 80,
                backgroundColor: 'var(--brand-primary)',
              }}
            >
              {variant === 'main' ? (
                <Bell className="w-10 h-10 text-white" />
              ) : (
                <Clock className="w-10 h-10 text-white" />
              )}
            </div>
          </div>

          {/* 내용 */}
          <div className="px-6 py-8 text-center">
            {/* 큰 시계 */}
            <div className="mb-4">
              <p
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--brand-text)',
                  lineHeight: 1.2,
                }}
              >
                {formatTime(time)}
              </p>
              <p
                style={{
                  fontSize: '1.25rem',
                  color: 'var(--brand-text-secondary)',
                  marginTop: '8px',
                }}
              >
                ({slot})
              </p>
            </div>

            {/* 타이틀 */}
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--brand-text)',
                marginBottom: '12px',
              }}
            >
              {variant === 'main' ? '지금 약 드셨나요?' : '약 챙겨드셨나요?'}
            </h2>

            {/* 설명 */}
            <p
              style={{
                fontSize: '1.125rem',
                color: 'var(--brand-text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {variant === 'main'
                ? `지금 ${slot} 약 시간이에요.`
                : `${slot} 약 드셨는지 확인해 주세요.`}
            </p>
          </div>

          {/* 버튼 */}
          <div className="px-6 pb-6 space-y-3">
            {variant === 'main' ? (
              <>
                <Button
                  onClick={handleTakeNow}
                  disabled={processing}
                  className="w-full"
                  style={{
                    minHeight: '64px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                  }}
                >
                  {processing ? '처리 중...' : '지금 복용'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSnooze}
                  disabled={processing}
                  className="w-full"
                  style={{
                    minHeight: '64px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-text)',
                  }}
                >
                  10분 뒤
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleDone}
                  disabled={processing}
                  className="w-full"
                  style={{
                    minHeight: '64px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    backgroundColor: 'var(--brand-primary)',
                    color: 'white',
                  }}
                >
                  {processing ? '처리 중...' : '약 먹었음'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNotYet}
                  disabled={processing}
                  className="w-full"
                  style={{
                    minHeight: '64px',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    borderColor: 'var(--brand-border)',
                    color: 'var(--brand-text)',
                  }}
                >
                  아직 안 먹음
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
