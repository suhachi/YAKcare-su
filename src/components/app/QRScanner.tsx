import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Badge } from "../ui/badge";
import { X, Zap, Image as ImageIcon, AlertTriangle, Camera, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { mapScanToDraft, getScanResultMessage, type ScanPayload, type MappingResult } from "../../services/intake.mapper";

type PermissionState = 'prompt' | 'granted' | 'denied';
type ScanMode = 'qr' | 'ocr';
type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'partial' | 'failed';

interface QRScannerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: MappingResult, mode: ScanMode) => void;
  onError?: (error: string) => void;
  mode?: ScanMode;
  userId: string; // Step 4.5: 매퍼에 필요
}

export function QRScanner({ open, onClose, onSuccess, onError, mode = 'qr', userId }: QRScannerProps) {
  const [permission, setPermission] = useState<PermissionState>('prompt');
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open) {
      checkPermission();
      console.log('GA4: qr_open', { mode });
    } else {
      stopStream();
    }
  }, [open, mode]);

  const checkPermission = async () => {
    try {
      if (!('permissions' in navigator) || !('mediaDevices' in navigator)) {
        setPermission('denied');
        return;
      }

      const status = await (navigator.permissions as any).query({ name: 'camera' as PermissionName });
      setPermission(status.state as PermissionState);
      status.onchange = () => {
        setPermission(status.state as PermissionState);
      };
    } catch (error) {
      console.error('Permission check failed', error);
      setPermission('denied');
    }
  };

  const requestPermission = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('이 환경에서는 카메라를 사용할 수 없습니다.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
        },
      });
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      toast.success('카메라 권한이 허용되었습니다');
    } catch (error) {
      console.log('GA4: qr_permission_denied');
      setPermission('denied');
      const message = error instanceof Error ? error.message : '카메라 권한이 필요합니다';
      toast.error(message);
    }
  };

  const openSettings = () => {
    console.log('GA4: settings_open_permissions');
    toast('설정 앱에서 카메라 권한을 변경할 수 있어요');
    // TODO: iOS/Android 설정 앱 딥링크
  };

  const startStream = async () => {
    if (permission !== 'granted' || !open) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setVideoError('이 환경에서는 카메라를 사용할 수 없습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setVideoError(null);
    } catch (error) {
      console.error('카메라 스트림 시작 실패', error);
      const message = error instanceof Error ? error.message : '카메라를 시작할 수 없습니다.';
      setVideoError(message);
      toast.error(message);
    }
  };

  const stopStream = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (permission === 'granted' && open) {
      startStream();
    }
    return () => {
      stopStream();
    };
  }, [permission, open]);

  const handleFlashToggle = () => {
    setIsFlashOn(!isFlashOn);
    // TODO: 실제 플래시 토글
  };

  const handleAlbum = () => {
    // TODO: 갤러리에서 이미지 선택
    toast('갤러리에서 이미지를 선택해 주세요');
  };

  const simulateScan = () => {
    setScanState('scanning');
    
    // 시뮬레이션: 2초 후 성공/실패
    setTimeout(() => {
      const rand = Math.random();
      let payload: ScanPayload;
      
      setScanState('processing');
      
      // 시뮬레이션 시나리오 (Step 4.5.B 테스트 픽스처)
      if (rand < 0.6) {
        // 60%: 완전 성공 (T1, T2, T4)
        const scenarios = [
          '아스피린 100mg\n아침 저녁 식후 2회\n7일분',
          '수면제 10mg\n취침 전 1회\n30일분',
          '소화제\n1일 3회 식전\n5일분',
        ];
        const rawText = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        payload = {
          source: mode,
          rawText,
          url: mode === 'qr' ? 'https://qrmg.upharm.co.kr/test' : undefined,
        };
      } else if (rand < 0.85) {
        // 25%: 부분 성공 (T3)
        payload = {
          source: mode,
          rawText: '타이레놀 500mg\n아침 1정, 점심 1정, 저녁 1정',
        };
      } else {
        // 15%: 실패 (T5)
        payload = {
          source: mode,
          rawText: '알 수 없는 텍스트',
        };
      }
      
      // 매퍼 실행
      const result = mapScanToDraft(payload, userId);
      console.log('GA4: scan_result', {
        mode,
        confidence: result.confidence,
        missingFields: result.missingFields,
      });
      
      // 상태 업데이트
      if (result.confidence === 'full') {
        setScanState('success');
        toast.success('스캔 결과가 적용되었어요');
      } else if (result.confidence === 'partial') {
        setScanState('partial');
        toast('일부만 인식되어 확인이 필요해요', { icon: '⚠️' });
      } else {
        setScanState('failed');
        toast.error('스캔 정보를 불러오지 못했어요');
      }
      
      // 1초 후 결과 전달
      setTimeout(() => {
        onSuccess(result, mode);
      }, 1000);
    }, 2000);
  };
  
  const handleRetry = () => {
    setScanState('idle');
  };
  
  const handleManualEntry = () => {
    console.log('GA4: scan_manual_fallback');
    // 빈 결과로 수기 입력 모드 전환
    const emptyResult: MappingResult = {
      draft: { userId, source: mode },
      confidence: 'none',
      missingFields: ['name', 'times'],
      warnings: ['수기로 입력해 주세요'],
    };
    onSuccess(emptyResult, mode);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'black' }}
    >
      {/* Safe Area Top */}
      <div style={{ height: '44px' }} />

      {/* 권한 거부 배너 */}
      {permission === 'denied' && (
        <div className="px-4 py-3">
          <Alert
            style={{
              backgroundColor: 'rgba(224, 49, 49, 0.1)',
              border: '1px solid var(--brand-danger)',
            }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--brand-danger)' }} />
            <AlertDescription style={{ color: 'var(--brand-danger)' }}>
              카메라 권한이 필요합니다.
              <button
                onClick={openSettings}
                style={{
                  marginLeft: '8px',
                  textDecoration: 'underline',
                  fontWeight: 600,
                }}
              >
                설정 열기
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 카메라 뷰 */}
      <div className="flex-1 relative flex items-center justify-center">
        {permission === 'granted' ? (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm px-4 text-center">
                {videoError}
              </div>
            )}

            {/* 가이드 박스 */}
            <div
              className="relative z-10"
              style={{
                width: '280px',
                height: '280px',
                border: '4px solid white',
                borderRadius: '24px',
                position: 'relative',
              }}
            >
              {/* 네 모서리 강조 */}
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  left: '-4px',
                  width: '48px',
                  height: '48px',
                  borderTop: '6px solid var(--brand-primary)',
                  borderLeft: '6px solid var(--brand-primary)',
                  borderRadius: '24px 0 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '48px',
                  height: '48px',
                  borderTop: '6px solid var(--brand-primary)',
                  borderRight: '6px solid var(--brand-primary)',
                  borderRadius: '0 24px 0 0',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '-4px',
                  width: '48px',
                  height: '48px',
                  borderBottom: '6px solid var(--brand-primary)',
                  borderLeft: '6px solid var(--brand-primary)',
                  borderRadius: '0 0 0 24px',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '48px',
                  height: '48px',
                  borderBottom: '6px solid var(--brand-primary)',
                  borderRight: '6px solid var(--brand-primary)',
                  borderRadius: '0 0 24px 0',
                }}
              />

              {/* 스캐닝 애니메이션 라인 */}
              {(scanState === 'scanning' || scanState === 'processing') && (
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: '50%',
                    height: '2px',
                    backgroundColor: 'var(--brand-primary)',
                    boxShadow: '0 0 20px var(--brand-primary)',
                    animation: 'scan 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>

            {/* 안내 텍스트 */}
            <div
              className="absolute bottom-0 left-0 right-0 text-center pb-32"
              style={{ color: 'white' }}
            >
              <p style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: '8px' }}>
                {mode === 'qr' ? 'QR 코드를 화면 중앙에 맞춰주세요' : '처방전 전체가 보이도록 촬영해 주세요'}
              </p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
                자동으로 인식됩니다
              </p>
            </div>
          </>
        ) : permission === 'prompt' ? (
          <div className="text-center px-8" style={{ color: 'white' }}>
            <Camera className="w-24 h-24 mx-auto mb-6" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              카메라 권한이 필요합니다
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
              {mode === 'qr' ? 'QR 코드를 스캔하려면' : '처방전을 촬영하려면'} 카메라 접근 권한을 허용해 주세요
            </p>
            <Button
              onClick={requestPermission}
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-primary)',
                color: 'white',
              }}
            >
              권한 허용
            </Button>
          </div>
        ) : (
          <div className="text-center px-8" style={{ color: 'white' }}>
            <AlertTriangle className="w-24 h-24 mx-auto mb-6" style={{ color: 'var(--brand-danger)' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              카메라를 사용할 수 없습니다
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
              설정에서 카메라 권한을 허용해 주세요
            </p>
            <Button
              onClick={openSettings}
              style={{
                minHeight: '56px',
                fontSize: '1.125rem',
                backgroundColor: 'var(--brand-danger)',
                color: 'white',
              }}
            >
              설정 열기
            </Button>
          </div>
        )}
      </div>

      {/* 하단 컨트롤 */}
      <div
        className="px-4 pb-8"
        style={{
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* 상태 배지 (Step 4.5.A) */}
        {scanState !== 'idle' && (
          <div className="flex justify-center mb-4">
            <Badge
              style={{
                fontSize: '0.875rem',
                padding: '8px 16px',
                backgroundColor:
                  scanState === 'success'
                    ? 'var(--brand-primary)'
                    : scanState === 'partial'
                    ? 'var(--brand-warn)'
                    : scanState === 'failed'
                    ? 'var(--brand-danger)'
                    : 'rgba(255,255,255,0.2)',
                color: 'white',
                border: 'none',
              }}
            >
              {scanState === 'scanning' && '읽는 중...'}
              {scanState === 'processing' && '결과 확인 중...'}
              {scanState === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 inline" />
                  스캔 결과 적용됨
                </>
              )}
              {scanState === 'partial' && (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2 inline" />
                  일부만 인식됨
                </>
              )}
              {scanState === 'failed' && (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2 inline" />
                  스캔 실패
                </>
              )}
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-center gap-6 mb-6">
          {/* 플래시 */}
          <button
            onClick={handleFlashToggle}
            disabled={permission !== 'granted'}
            className="flex flex-col items-center gap-2 transition-all active:scale-95"
            style={{
              color: isFlashOn ? 'var(--brand-primary)' : 'white',
              opacity: permission !== 'granted' ? 0.3 : 1,
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: isFlashOn ? 'rgba(18, 184, 134, 0.2)' : 'rgba(255,255,255,0.1)',
              }}
            >
              <Zap className="w-6 h-6" fill={isFlashOn ? 'currentColor' : 'none'} />
            </div>
            <span style={{ fontSize: '0.75rem' }}>플래시</span>
          </button>

          {/* 촬영/스캔 버튼 */}
          <button
            onClick={scanState === 'failed' ? handleRetry : simulateScan}
            disabled={permission !== 'granted' || scanState === 'scanning' || scanState === 'processing'}
            className="flex flex-col items-center gap-2 transition-all active:scale-95"
            style={{
              opacity: permission !== 'granted' || scanState === 'scanning' || scanState === 'processing' ? 0.5 : 1,
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: 'white',
                border: '4px solid var(--brand-primary)',
              }}
            >
              {(scanState === 'scanning' || scanState === 'processing') && (
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-primary)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'white' }}>
              {scanState === 'scanning' ? '인식 중...' : 
               scanState === 'processing' ? '처리 중...' :
               scanState === 'failed' ? '다시 시도' :
               mode === 'qr' ? '스캔' : '촬영'}
            </span>
          </button>

          {/* 앨범 */}
          <button
            onClick={handleAlbum}
            disabled={permission !== 'granted'}
            className="flex flex-col items-center gap-2 transition-all active:scale-95"
            style={{
              color: 'white',
              opacity: permission !== 'granted' ? 0.3 : 1,
            }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <ImageIcon className="w-6 h-6" />
            </div>
            <span style={{ fontSize: '0.75rem' }}>앨범</span>
          </button>
        </div>

        {/* 수기 전환 버튼 (Step 4.5.A: 스캔 실패 시) */}
        {scanState === 'failed' && (
          <Button
            onClick={handleManualEntry}
            className="w-full gap-2 mb-3"
            style={{
              minHeight: '56px',
              fontSize: '1.125rem',
              backgroundColor: 'var(--brand-warn)',
              color: 'white',
            }}
          >
            수기로 입력하기
          </Button>
        )}

        {/* 닫기 버튼 */}
        <Button
          onClick={onClose}
          variant="ghost"
          className="w-full gap-2"
          style={{
            minHeight: '56px',
            fontSize: '1.125rem',
            color: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <X className="w-5 h-5" />
          닫기
        </Button>
      </div>

      {/* 스캔 애니메이션 CSS */}
      <style>{`
        @keyframes scan {
          0%, 100% {
            top: 10%;
          }
          50% {
            top: 90%;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.95);
          }
        }
      `}</style>

      {/* Safe Area Bottom */}
      <div style={{ height: '34px', backgroundColor: 'rgba(0,0,0,0.8)' }} />
    </div>
  );
}
