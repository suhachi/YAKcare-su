import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { QrCode, FileText, Edit3 } from "lucide-react";

type SourceType = 'qr' | 'ocr' | 'manual';

interface SourcePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSource: (source: SourceType) => void;
  targetName?: string; // 보호자 모드에서 사용
}

export function SourcePicker({ open, onOpenChange, onSelectSource, targetName }: SourcePickerProps) {
  const handleSelect = (source: SourceType) => {
    onSelectSource(source);
    onOpenChange(false);
    console.log('GA4: med_add_source_select', { source });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader className="mb-6">
          <SheetTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
            약 등록 방법
          </SheetTitle>
          <SheetDescription style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)' }}>
            {targetName ? `${targetName}님의 약을 등록합니다` : '등록 방법을 선택해 주세요'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 pb-6">
          {/* QR 스캔 */}
          <button
            onClick={() => handleSelect('qr')}
            className="w-full rounded-2xl text-left transition-all active:scale-98"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '20px',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(18, 184, 134, 0.1)',
                }}
              >
                <QrCode className="w-8 h-8" style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div className="flex-1">
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--brand-text)',
                    marginBottom: '4px',
                  }}
                >
                  QR 코드 스캔
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: 1.4 }}>
                  약 정보지의 QR 코드를 스캔해요
                </p>
              </div>
            </div>
          </button>

          {/* 처방전 스캔 (OCR) */}
          <button
            onClick={() => handleSelect('ocr')}
            className="w-full rounded-2xl text-left transition-all active:scale-98"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '20px',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(46, 196, 182, 0.1)',
                }}
              >
                <FileText className="w-8 h-8" style={{ color: 'var(--brand-accent)' }} />
              </div>
              <div className="flex-1">
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--brand-text)',
                    marginBottom: '4px',
                  }}
                >
                  처방전 스캔
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--brand-text-muted)',
                      marginLeft: '8px',
                      backgroundColor: 'var(--brand-bg)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    Beta
                  </span>
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: 1.4 }}>
                  처방전을 촬영하고 자동으로 인식해요
                </p>
              </div>
            </div>
          </button>

          {/* 수기 입력 */}
          <button
            onClick={() => handleSelect('manual')}
            className="w-full rounded-2xl text-left transition-all active:scale-98"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--brand-border)',
              padding: '20px',
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(107, 114, 128, 0.1)',
                }}
              >
                <Edit3 className="w-8 h-8" style={{ color: 'var(--brand-text-secondary)' }} />
              </div>
              <div className="flex-1">
                <h3
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: 'var(--brand-text)',
                    marginBottom: '4px',
                  }}
                >
                  직접 입력
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: 1.4 }}>
                  약 이름과 시간을 직접 입력해요
                </p>
              </div>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
