import { useEffect, useState } from "react";
import { YakCareLogo } from "../YakCareLogo";

interface SplashProps {
  onComplete?: () => void;
  duration?: number;
}

export function Splash({ onComplete, duration = 2000 }: SplashProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setFadeOut(true);
      // 페이드 아웃 후 완료
      setTimeout(() => {
        onComplete?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        backgroundColor: 'white',
        opacity: fadeOut ? 0 : 1,
      }}
    >
      {/* 로고 */}
      <div className="mb-8 animate-fade-in">
        <YakCareLogo size={160} />
      </div>

      {/* 브랜드명 */}
      <div className="text-center animate-fade-in-delay">
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--brand-text)',
            marginBottom: '8px',
          }}
        >
          약 챙겨먹어요
        </h1>
        <p
          style={{
            fontSize: '1.125rem',
            color: 'var(--brand-text-secondary)',
          }}
        >
          YakCare
        </p>
      </div>

      {/* 로딩 인디케이터 */}
      <div className="mt-12">
        <div
          className="animate-pulse"
          style={{
            width: '48px',
            height: '4px',
            backgroundColor: 'var(--brand-primary)',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* 버전 */}
      <div
        className="absolute bottom-12"
        style={{
          fontSize: '0.875rem',
          color: 'var(--brand-text-muted)',
        }}
      >
        v0.1.0 (Lite)
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}
