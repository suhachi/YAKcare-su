/**
 * Figma 유틸리티 함수
 * Figma API와 함께 사용하는 헬퍼 함수들
 */

/**
 * Figma 파일 URL에서 파일 키 추출
 * @param figmaUrl - Figma 파일 URL
 * @returns 파일 키 (파일 ID)
 * 
 * @example
 * extractFileKey('https://www.figma.com/design/FyR0lrMwAY5MHLj77UXOmv/...')
 * // → 'FyR0lrMwAY5MHLj77UXOmv'
 */
export function extractFileKey(figmaUrl: string): string | null {
  try {
    const match = figmaUrl.match(/\/design\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Figma 노드 ID 생성 (페이지/프레임 경로 기반)
 * @param nodePath - 노드 경로 배열 (예: ['Page 1', 'Frame', 'Button'])
 */
export function buildNodePath(nodePath: string[]): string {
  return nodePath.join(' → ');
}

/**
 * Figma 이미지 URL을 로컬 캐시 키로 변환
 * @param nodeId - Figma 노드 ID
 * @param format - 이미지 형식
 * @param scale - 이미지 스케일
 */
export function getImageCacheKey(
  nodeId: string,
  format: string = 'png',
  scale: number = 2
): string {
  return `figma:${nodeId}:${format}:${scale}`;
}

/**
 * Figma 디자인 토큰을 CSS 변수로 변환
 * @param tokens - 디자인 토큰 객체
 * @returns CSS 변수 문자열
 */
export function tokensToCSSVars(tokens: Record<string, any>): string {
  return Object.entries(tokens)
    .map(([key, value]) => {
      const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `--${cssKey}: ${value};`;
    })
    .join('\n');
}

/**
 * Figma 색상 값을 CSS 색상으로 변환
 * @param color - Figma 색상 객체 { r, g, b, a }
 * @returns CSS 색상 문자열 (rgba 또는 hex)
 */
export function figmaColorToCSS(color: { r: number; g: number; b: number; a?: number }): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = color.a !== undefined ? color.a : 1;
  
  if (a === 1) {
    // 불투명하면 hex로 변환
    return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

