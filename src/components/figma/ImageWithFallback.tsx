import React, { useState, useEffect } from 'react';
import { getFigmaImageByNodeId } from '../../services/figma.service';

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Figma 노드 ID (선택적)
   * 제공되면 Figma API에서 이미지를 가져옵니다
   */
  figmaNodeId?: string;
  /**
   * Figma 이미지 형식 (기본값: 'png')
   */
  figmaFormat?: 'png' | 'jpg' | 'svg' | 'pdf';
  /**
   * Figma 이미지 스케일 (기본값: 2)
   */
  figmaScale?: 1 | 2 | 4;
}

export function ImageWithFallback({
  src,
  alt,
  style,
  className,
  figmaNodeId,
  figmaFormat = 'png',
  figmaScale = 2,
  ...rest
}: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [isLoading, setIsLoading] = useState(!!figmaNodeId);

  // Figma 이미지 로드
  useEffect(() => {
    if (figmaNodeId) {
      setIsLoading(true);
      getFigmaImageByNodeId(figmaNodeId, figmaFormat, figmaScale)
        .then((url) => {
          if (url) {
            setImageSrc(url);
          } else {
            setDidError(true);
          }
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('[ImageWithFallback] Figma 이미지 로드 실패:', error);
          setDidError(true);
          setIsLoading(false);
        });
    }
  }, [figmaNodeId, figmaFormat, figmaScale]);

  const handleError = () => {
    setDidError(true);
    setIsLoading(false);
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full" style={{ minHeight: '100px' }}>
          <span style={{ color: '#999', fontSize: '0.875rem' }}>로딩 중...</span>
        </div>
      </div>
    );
  }

  // 에러 표시
  if (didError) {
    return (
      <div
        className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
        style={style}
      >
        <div className="flex items-center justify-center w-full h-full">
          <img
            src={ERROR_IMG_SRC}
            alt={alt || 'Error loading image'}
            {...rest}
            data-original-url={src || figmaNodeId}
          />
        </div>
      </div>
    );
  }

  // 정상 이미지 표시
  return (
    <img
      src={imageSrc || src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
    />
  );
}
