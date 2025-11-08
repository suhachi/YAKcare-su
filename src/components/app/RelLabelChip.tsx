import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ChevronDown } from "lucide-react";

type RelLabel = '아버님' | '어머님' | '할아버지' | '할머니' | 'CUSTOM';

interface RelLabelChipProps {
  value?: string;
  onChange?: (label: string, subject: string) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline';
}

export function RelLabelChip({ value, onChange, disabled = false, variant = 'default' }: RelLabelChipProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<RelLabel>(
    value && !['아버님', '어머님', '할아버지', '할머니'].includes(value) ? 'CUSTOM' : (value as RelLabel) || '아버님'
  );
  const [customLabel, setCustomLabel] = useState(
    value && !['아버님', '어머님', '할아버지', '할머니'].includes(value) ? value : ''
  );

  const labels: { value: RelLabel; label: string; subject: string }[] = [
    { value: '아버님', label: '아버님', subject: '아버님께서' },
    { value: '어머님', label: '어머님', subject: '어머님께서' },
    { value: '할아버지', label: '할아버지', subject: '할아버지께서' },
    { value: '할머니', label: '할머니', subject: '할머니께서' },
    { value: 'CUSTOM', label: '직접 입력', subject: '' },
  ];

  const getSubject = (label: string) => {
    const found = labels.find(l => l.label === label);
    if (found) return found.subject;
    return `${label}께서`;
  };

  const getCurrentLabel = () => {
    if (!value) return '호칭 선택';
    return value;
  };

  const handleSave = () => {
    let finalLabel = selectedLabel;
    let finalSubject = '';

    if (selectedLabel === 'CUSTOM') {
      if (!customLabel.trim()) {
        return;
      }
      finalLabel = customLabel.trim() as RelLabel;
      finalSubject = `${customLabel.trim()}께서`;
    } else {
      const found = labels.find(l => l.value === selectedLabel);
      if (found) {
        finalLabel = found.label as RelLabel;
        finalSubject = found.subject;
      }
    }

    onChange?.(finalLabel, finalSubject);
    setShowDialog(false);
  };

  return (
    <>
      <button
        onClick={() => !disabled && setShowDialog(true)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl transition-all active:scale-95"
        style={{
          minHeight: '44px',
          padding: '8px 16px',
          fontSize: '1rem',
          fontWeight: 500,
          backgroundColor: variant === 'default' ? 'var(--brand-primary)' : 'white',
          color: variant === 'default' ? 'white' : 'var(--brand-text)',
          border: variant === 'default' ? 'none' : '2px solid var(--brand-border)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span>{getCurrentLabel()}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '1.5rem', color: 'var(--brand-text)' }}>
              호칭 선택
            </DialogTitle>
            <DialogDescription style={{ fontSize: '1rem' }}>
              보호자 관계에 맞는 호칭을 선택해 주세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 기본 호칭 */}
            <div className="grid grid-cols-2 gap-2">
              {labels.filter(l => l.value !== 'CUSTOM').map(item => (
                <button
                  key={item.value}
                  onClick={() => {
                    setSelectedLabel(item.value);
                    setCustomLabel('');
                  }}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '56px',
                    fontSize: '1.125rem',
                    fontWeight: 500,
                    backgroundColor: selectedLabel === item.value ? 'var(--brand-primary)' : 'white',
                    color: selectedLabel === item.value ? 'white' : 'var(--brand-text)',
                    border: selectedLabel === item.value ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setSelectedLabel('CUSTOM')}
                  className="rounded-xl transition-all"
                  style={{
                    minHeight: '44px',
                    padding: '8px 16px',
                    fontSize: '1rem',
                    fontWeight: 500,
                    backgroundColor: selectedLabel === 'CUSTOM' ? 'var(--brand-primary)' : 'white',
                    color: selectedLabel === 'CUSTOM' ? 'white' : 'var(--brand-text)',
                    border: selectedLabel === 'CUSTOM' ? '2px solid var(--brand-primary)' : '2px solid var(--brand-border)',
                  }}
                >
                  직접 입력
                </button>
              </div>
              {selectedLabel === 'CUSTOM' && (
                <div>
                  <Label style={{ fontSize: '0.875rem', marginBottom: '8px', display: 'block' }}>
                    호칭 입력 (예: 삼촌, 이모, 형님)
                  </Label>
                  <Input
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="호칭을 입력해 주세요"
                    maxLength={10}
                    style={{ minHeight: '56px', fontSize: '1.125rem' }}
                  />
                  {customLabel && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', marginTop: '8px' }}>
                      → "{customLabel}께서" 로 표시됩니다
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 flex-row">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="flex-1"
              style={{ minHeight: '56px', fontSize: '1.125rem' }}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={selectedLabel === 'CUSTOM' && !customLabel.trim()}
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
