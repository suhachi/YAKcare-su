/**
 * 보호자 초대 생성기 (QR/코드/링크)
 * Step 4.6: 연결/온보딩
 */

import { useState, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { QrCode, Link2, Hash, Copy, Check, Download } from 'lucide-react';
import { createInvite } from '../../services/links.service';
import { LinkInvite } from '../../types/link';
import { QRCodeSVG } from 'qrcode.react';

interface InviteGeneratorProps {
  caregiverId: string;
}

export function InviteGenerator({ caregiverId }: InviteGeneratorProps) {
  const [invite, setInvite] = useState<LinkInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);
  const qrCodeContainerRef = useRef<HTMLDivElement>(null);

  // 초대 생성
  const handleGenerateInvite = async () => {
    setLoading(true);
    try {
      const newInvite = await createInvite(caregiverId);
      setInvite(newInvite);
      toast.success('초대 코드가 생성되었습니다');
      console.log('GA4: caregiver_invite_create', { caregiverId });
    } catch (error: any) {
      console.error('Invite generation error:', error);
      if (error.message?.includes('LINK_LIMIT_EXCEEDED')) {
        toast.error(error.message.split(': ')[1] || '연결 제한을 초과했습니다');
      } else {
        toast.error('초대 생성 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  // 클립보드 복사
  const handleCopy = async (text: string, field: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('복사되었습니다');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('복사에 실패했습니다');
    }
  };

  // 만료 시간 표시
  const getExpiryText = () => {
    if (!invite) return '';
    const remaining = invite.expiresAt - Date.now();
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}시간 ${minutes}분 남음`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle style={{ fontSize: '1.25rem' }}>연결 초대 보내기</CardTitle>
          <CardDescription style={{ fontSize: '1rem' }}>
            복용자에게 초대 코드를 공유하여 연결하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!invite ? (
            <Button
              onClick={handleGenerateInvite}
              disabled={loading}
              style={{
                width: '100%',
                minHeight: '56px',
                backgroundColor: 'var(--brand-primary)',
              }}
            >
              {loading ? '생성 중...' : '초대 코드 생성'}
            </Button>
          ) : (
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="qr" style={{ fontSize: '0.875rem' }}>
                  <QrCode className="w-4 h-4 mr-2" />
                  QR 코드
                </TabsTrigger>
                <TabsTrigger value="code" style={{ fontSize: '0.875rem' }}>
                  <Hash className="w-4 h-4 mr-2" />
                  코드
                </TabsTrigger>
                <TabsTrigger value="link" style={{ fontSize: '0.875rem' }}>
                  <Link2 className="w-4 h-4 mr-2" />
                  링크
                </TabsTrigger>
              </TabsList>

              {/* QR 코드 탭 */}
              <TabsContent value="qr" className="space-y-4">
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8"
                  style={{ borderColor: 'var(--brand-border)', minHeight: '200px' }}
                >
                  <div className="bg-white p-4 rounded-lg mb-4" ref={qrCodeContainerRef}>
                    <QRCodeSVG
                      value={invite.deepLink}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
                      초대 코드: <strong>{invite.inviteCode}</strong>
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--brand-text-muted)' }}>
                      {getExpiryText()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCopy(invite.deepLink, 'link')}
                    variant="outline"
                    style={{ flex: 1, minHeight: '48px' }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    링크 복사
                  </Button>
                  <Button
                    onClick={() => {
                      // QR 코드 이미지 다운로드
                      const container = qrCodeContainerRef.current;
                      if (!container) {
                        toast.error('QR 코드를 찾을 수 없습니다');
                        return;
                      }

                      const svg = container.querySelector('svg');
                      if (!svg) {
                        toast.error('QR 코드 SVG를 찾을 수 없습니다');
                        return;
                      }

                      try {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                          toast.error('Canvas를 지원하지 않는 브라우저입니다');
                          return;
                        }

                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx.drawImage(img, 0, 0);
                          canvas.toBlob((blob) => {
                            if (blob) {
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `yakcare-invite-${invite.inviteCode}.png`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              URL.revokeObjectURL(url);
                              toast.success('QR 코드가 다운로드되었습니다');
                            } else {
                              toast.error('이미지 변환에 실패했습니다');
                            }
                          }, 'image/png');
                        };
                        img.onerror = () => {
                          toast.error('이미지 로드에 실패했습니다');
                        };
                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                        const url = URL.createObjectURL(svgBlob);
                        img.src = url;
                      } catch (error) {
                        console.error('QR 코드 다운로드 오류:', error);
                        toast.error('QR 코드 다운로드 중 오류가 발생했습니다');
                      }
                    }}
                    variant="outline"
                    style={{ flex: 1, minHeight: '48px' }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                  복용자가 QR 코드를 스캔하여 바로 연결할 수 있습니다
                </p>
              </TabsContent>

              {/* 코드 탭 */}
              <TabsContent value="code" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={invite.inviteCode}
                      readOnly
                      style={{
                        fontSize: '1.5rem',
                        textAlign: 'center',
                        letterSpacing: '0.2em',
                        minHeight: '56px',
                      }}
                    />
                    <Button
                      onClick={() => handleCopy(invite.inviteCode, 'code')}
                      variant="outline"
                      style={{ minHeight: '56px', minWidth: '56px' }}
                    >
                      {copiedField === 'code' ? (
                        <Check className="w-5 h-5" style={{ color: 'var(--brand-success)' }} />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-muted)' }}>
                    {getExpiryText()}
                  </p>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
                  복용자에게 이 6자리 코드를 알려주세요
                </p>
              </TabsContent>

              {/* 링크 탭 */}
              <TabsContent value="link" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={invite.deepLink}
                    readOnly
                    style={{ fontSize: '0.875rem', minHeight: '56px' }}
                  />
                  <Button
                    onClick={() => handleCopy(invite.deepLink, 'link')}
                    variant="outline"
                    style={{ minHeight: '56px', minWidth: '56px' }}
                  >
                    {copiedField === 'link' ? (
                      <Check className="w-5 h-5" style={{ color: 'var(--brand-success)' }} />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--brand-text-secondary)' }}>
                  링크를 복사하여 메시지로 보내세요
                </p>
              </TabsContent>
            </Tabs>
          )}

          {invite && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--brand-border)' }}>
              <Button
                onClick={handleGenerateInvite}
                variant="outline"
                disabled={loading}
                style={{ width: '100%', minHeight: '48px' }}
              >
                새 초대 코드 생성
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div
        className="rounded-lg p-4 space-y-2"
        style={{ backgroundColor: 'rgba(18, 184, 134, 0.1)' }}
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--brand-text)' }}>
          💡 <strong>안내</strong>
        </p>
        <ul
          style={{
            fontSize: '0.875rem',
            color: 'var(--brand-text-secondary)',
            lineHeight: 1.6,
            paddingLeft: '1.5rem',
          }}
        >
          <li>보호자 초대는 보호자에서 시작, 복용자는 승인만 할 수 있습니다</li>
          <li>초대 코드는 24시간 동안 유효합니다</li>
          <li>최대 10명의 복용자와 연결할 수 있습니다</li>
        </ul>
      </div>
    </div>
  );
}
