interface TimeChip15Props {
  time: string; // "08:00", "08:15", etc.
  selected?: boolean;
  disabled?: boolean;
  type?: 'time' | 'tag';
  onSelect?: (time: string) => void;
}

export function TimeChip15({
  time,
  selected = false,
  disabled = false,
  type = 'time',
  onSelect,
}: TimeChip15Props) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(time);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className="rounded-xl transition-all active:scale-95"
      style={{
        minHeight: '44px',
        minWidth: '80px',
        padding: '12px 16px',
        fontSize: '1rem',
        fontWeight: 500,
        backgroundColor: selected
          ? 'var(--brand-primary)'
          : disabled
          ? 'var(--brand-bg)'
          : 'white',
        color: selected
          ? 'white'
          : disabled
          ? 'var(--brand-text-muted)'
          : 'var(--brand-text)',
        border: selected
          ? '2px solid var(--brand-primary)'
          : disabled
          ? '2px solid var(--brand-border)'
          : '2px solid var(--brand-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {time}
    </button>
  );
}

// 15분 그리드 시간 생성 헬퍼
export function generate15MinuteTimes(startHour = 0, endHour = 24): string[] {
  const times: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, '0');
      const minute = m.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }
  return times;
}

// 슬롯별 기본 시간 제안
export function getDefaultTimesBySlot(slot: '아침' | '점심' | '저녁' | '취침 전'): string[] {
  const defaults = {
    '아침': ['08:00'],
    '점심': ['12:00'],
    '저녁': ['18:00'],
    '취침 전': ['22:00'],
  };
  return defaults[slot];
}
