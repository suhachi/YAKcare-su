import { ArrowLeft, Info } from "lucide-react";

interface AboutAppProps {
  onBack?: () => void;
}

export function AboutApp({ onBack }: AboutAppProps) {
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
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-text)' }}>
            앱 소개
          </h1>
        </div>

        {/* 안내 섹션 */}
        <div className="mb-8 rounded-xl border p-6" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6" style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--brand-text)' }}>
              브랜드/소개 섹션
            </h2>
          </div>
          <p style={{ fontSize: '1rem', color: 'var(--brand-text-secondary)', lineHeight: '1.6' }}>
            브랜드 소개 섹션은 추후 단계적으로 구성됩니다.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)', marginTop: '12px', lineHeight: '1.6' }}>
            현재 파일에는 누락된 컴포넌트(import)들이 제거되어 빌드가 정상 진행됩니다.
            필요 시 개별 섹션(Hero, BrandCore, Logo 등)을 실제 구현 파일로 추가한 뒤
            여기서 import 하세요.
          </p>
        </div>

        {/* 간단한 앱 정보 */}
        <div className="mb-8 rounded-xl border p-6" style={{ borderColor: 'var(--brand-border)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--brand-text)', marginBottom: '12px' }}>
            약 챙겨먹어요
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)', lineHeight: '1.6' }}>
            시니어를 위한 복약 관리 앱입니다.
          </p>
        </div>
      </div>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px' }} />
    </div>
  );
}
