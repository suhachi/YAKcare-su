interface YakCareLogoProps {
  size?: number;
  width?: number;
  className?: string;
}

export function YakCareLogo({ size = 120, width, className = "" }: YakCareLogoProps) {
  const finalWidth = width || size;
  return (
    <svg
      width={finalWidth}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="60" cy="60" r="56" fill="#12B886" opacity="0.1" />
      
      {/* Pill/Capsule Base */}
      <g transform="translate(30, 35)">
        {/* Left half of capsule */}
        <path
          d="M 0 25 A 25 25 0 0 1 0 -25 L 30 -25 L 30 25 Z"
          fill="#12B886"
        />
        {/* Right half of capsule */}
        <path
          d="M 30 -25 L 60 -25 A 25 25 0 0 1 60 25 L 30 25 Z"
          fill="#2EC4B6"
        />
        {/* Center divider line */}
        <line
          x1="30"
          y1="-25"
          x2="30"
          y2="25"
          stroke="white"
          strokeWidth="2"
          opacity="0.3"
        />
      </g>
      
      {/* Checkmark */}
      <g transform="translate(60, 60)">
        <circle cx="0" cy="0" r="22" fill="white" />
        <circle cx="0" cy="0" r="20" fill="#12B886" />
        <path
          d="M -8 0 L -3 6 L 8 -6"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}

export function YakCareWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <YakCareLogo size={64} />
      <div className="flex flex-col">
        <span style={{ color: 'var(--brand-primary)', lineHeight: '1.1' }}>
          약챙겨먹어요
        </span>
        <span style={{ color: 'var(--brand-text-muted)', fontSize: '0.75em', lineHeight: '1.2' }}>
          YakCare
        </span>
      </div>
    </div>
  );
}
