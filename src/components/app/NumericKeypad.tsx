import { Delete } from "lucide-react";

interface NumericKeypadProps {
  onKey: (key: string) => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function NumericKeypad({ onKey, onDelete, disabled = false }: NumericKeypadProps) {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  const handleKeyPress = (key: string) => {
    if (disabled) return;
    
    if (key === 'delete') {
      onDelete();
    } else if (key !== '') {
      onKey(key);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
      {keys.flat().map((key, idx) => {
        if (key === '') {
          return <div key={idx} />;
        }

        if (key === 'delete') {
          return (
            <button
              key={idx}
              onClick={() => handleKeyPress(key)}
              disabled={disabled}
              className="flex items-center justify-center rounded-2xl transition-all active:scale-95"
              style={{
                minHeight: '64px',
                backgroundColor: disabled ? 'var(--brand-bg)' : 'white',
                border: '2px solid var(--brand-border)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
              }}
            >
              <Delete className="w-6 h-6" style={{ color: 'var(--brand-text-secondary)' }} />
            </button>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => handleKeyPress(key)}
            disabled={disabled}
            className="rounded-2xl transition-all active:scale-95"
            style={{
              minHeight: '64px',
              fontSize: '1.5rem',
              fontWeight: 600,
              backgroundColor: disabled ? 'var(--brand-bg)' : 'white',
              color: disabled ? 'var(--brand-text-muted)' : 'var(--brand-text)',
              border: '2px solid var(--brand-border)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
