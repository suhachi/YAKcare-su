/**
 * Figma API 통합 서비스
 * Figma 디자인 파일에서 이미지, 디자인 토큰 등을 가져오는 서비스
 */

import { FIGMA_CONFIG } from '../config/env';

// Figma API 응답 타입
interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
}

interface FigmaImageResponse {
  error?: boolean;
  images?: Record<string, string>;
}

interface FigmaFileResponse {
  document: FigmaNode;
  components: Record<string, any>;
  styles: Record<string, any>;
}

/**
 * Figma 파일 정보 조회
 * @param fileKey - Figma 파일 키 (기본값: 환경 변수에서)
 */
export async function getFigmaFile(fileKey: string = FIGMA_CONFIG.fileKey): Promise<FigmaFileResponse> {
  if (!FIGMA_CONFIG.enabled || !FIGMA_CONFIG.accessToken) {
    throw new Error('Figma API가 활성화되지 않았거나 Access Token이 없습니다.');
  }

  const response = await fetch(`${FIGMA_CONFIG.apiBase}/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': FIGMA_CONFIG.accessToken,
    },
  });

  if (!response.ok) {
    throw new Error(`Figma API 오류: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * 특정 노드의 이미지 URL 가져오기
 * @param fileKey - Figma 파일 키
 * @param nodeIds - 노드 ID 배열
 * @param format - 이미지 형식 ('png' | 'jpg' | 'svg' | 'pdf')
 * @param scale - 이미지 스케일 (1, 2, 4 등)
 */
export async function getFigmaImages(
  fileKey: string = FIGMA_CONFIG.fileKey,
  nodeIds: string[],
  format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png',
  scale: 1 | 2 | 4 = 1
): Promise<Record<string, string>> {
  if (!FIGMA_CONFIG.enabled || !FIGMA_CONFIG.accessToken) {
    throw new Error('Figma API가 활성화되지 않았거나 Access Token이 없습니다.');
  }

  const ids = nodeIds.join(',');
  const response = await fetch(
    `${FIGMA_CONFIG.apiBase}/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`,
    {
      headers: {
        'X-Figma-Token': FIGMA_CONFIG.accessToken,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Figma 이미지 API 오류: ${response.status} ${response.statusText}`);
  }

  const data: FigmaImageResponse = await response.json();

  if (data.error) {
    throw new Error('Figma 이미지 가져오기 실패');
  }

  return data.images || {};
}

/**
 * Figma 파일에서 노드 검색
 * @param fileKey - Figma 파일 키
 * @param nodeName - 검색할 노드 이름 (부분 일치)
 */
export async function searchFigmaNodes(
  fileKey: string = FIGMA_CONFIG.fileKey,
  nodeName: string
): Promise<FigmaNode[]> {
  const fileData = await getFigmaFile(fileKey);
  const results: FigmaNode[] = [];

  const searchRecursive = (node: FigmaNode) => {
    if (node.name.toLowerCase().includes(nodeName.toLowerCase())) {
      results.push(node);
    }
    if (node.children) {
      node.children.forEach(searchRecursive);
    }
  };

  searchRecursive(fileData.document);
  return results;
}

/**
 * Figma 컴포넌트 정보 조회
 * @param fileKey - Figma 파일 키
 */
export async function getFigmaComponents(
  fileKey: string = FIGMA_CONFIG.fileKey
): Promise<Record<string, any>> {
  const fileData = await getFigmaFile(fileKey);
  return fileData.components || {};
}

/**
 * Figma 스타일 정보 조회 (디자인 토큰)
 * @param fileKey - Figma 파일 키
 */
export async function getFigmaStyles(
  fileKey: string = FIGMA_CONFIG.fileKey
): Promise<Record<string, any>> {
  const fileData = await getFigmaFile(fileKey);
  return fileData.styles || {};
}

/**
 * Figma 노드로부터 이미지 URL 가져오기 (헬퍼)
 * @param nodeId - Figma 노드 ID
 * @param format - 이미지 형식
 * @param scale - 이미지 스케일
 */
export async function getFigmaImageByNodeId(
  nodeId: string,
  format: 'png' | 'jpg' | 'svg' | 'pdf' = 'png',
  scale: 1 | 2 | 4 = 2
): Promise<string | null> {
  try {
    const images = await getFigmaImages(FIGMA_CONFIG.fileKey, [nodeId], format, scale);
    return images[nodeId] || null;
  } catch (error) {
    console.error('[Figma Service] 이미지 가져오기 실패:', error);
    return null;
  }
}

/**
 * Figma 디자인 토큰 추출 (색상, 타이포그래피 등)
 * @param fileKey - Figma 파일 키
 */
export async function extractFigmaDesignTokens(
  fileKey: string = FIGMA_CONFIG.fileKey
): Promise<{
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, number>;
  borderRadius: Record<string, number>;
}> {
  const styles = await getFigmaStyles(fileKey);
  const tokens = {
    colors: {} as Record<string, string>,
    typography: {} as Record<string, any>,
    spacing: {} as Record<string, number>,
    borderRadius: {} as Record<string, number>,
  };

  // 스타일에서 디자인 토큰 추출 (예시)
  Object.values(styles).forEach((style: any) => {
    if (style.styleType === 'FILL') {
      // 색상 토큰
      const colorName = style.name;
      const colorValue = style.fills?.[0]?.color;
      if (colorValue) {
        const rgba = `rgba(${Math.round(colorValue.r * 255)}, ${Math.round(colorValue.g * 255)}, ${Math.round(colorValue.b * 255)}, ${colorValue.a || 1})`;
        tokens.colors[colorName] = rgba;
      }
    }
    // 추가 토큰 추출 로직...
  });

  return tokens;
}

