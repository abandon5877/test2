/**
 * 统一的重叠计算工具函数
 * 用于计算卡牌在容器中的重叠量，以充分利用空间
 */

export interface OverlapCalculatorOptions {
  /** 最小重叠比例（默认0.05 = 5%） */
  minOverlapRatio?: number;
  /** 最大重叠比例（默认0.7 = 70%） */
  maxOverlapRatio?: number;
  /** 是否需要重叠时的重叠比例（默认0.05 = 5%） */
  slightOverlapRatio?: number;
}

/**
 * 计算卡牌重叠量
 * @param cardCount 卡牌数量
 * @param containerWidth 容器宽度
 * @param cardWidth 单张卡牌宽度
 * @param options 可选配置
 * @returns 重叠量（像素）
 */
export function calculateOverlap(
  cardCount: number,
  containerWidth: number,
  cardWidth: number,
  options: OverlapCalculatorOptions = {}
): number {
  const {
    minOverlapRatio = 0.05,
    maxOverlapRatio = 0.7,
    slightOverlapRatio = 0.05,
  } = options;

  if (cardCount <= 1) return 0;

  const availableWidth = Math.max(0, containerWidth);
  const totalCardsWidth = cardWidth * cardCount;

  // 如果所有卡牌不重叠也能放下，使用轻微重叠
  if (totalCardsWidth <= availableWidth) {
    return cardWidth * slightOverlapRatio;
  }

  // 需要重叠才能放下
  // 公式：第一张牌完整显示 + (n-1)张牌重叠显示 = 可用宽度
  // cardWidth + (cardCount - 1) * (cardWidth - overlap) = availableWidth
  // 解得：overlap = (totalCardsWidth - availableWidth) / (cardCount - 1)
  const requiredOverlap = (totalCardsWidth - availableWidth) / (cardCount - 1);

  // 限制重叠量在合理范围内
  const minOverlap = cardWidth * minOverlapRatio;
  const maxOverlap = cardWidth * maxOverlapRatio;

  return Math.max(minOverlap, Math.min(requiredOverlap, maxOverlap));
}

/**
 * 获取元素的真实宽度（包含padding和border）
 * @param element HTML元素
 * @returns 宽度（像素）
 */
export function getElementWidth(element: Element | null): number {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  return rect.width;
}

/**
 * 计算网格列数
 * @param containerWidth 容器宽度
 * @param cardWidth 卡片宽度
 * @param gap 间隙（默认12）
 * @param padding 内边距（默认16）
 * @param minColumns 最小列数（默认2）
 * @param maxColumns 最大列数（默认5）
 * @returns 列数
 */
export function calculateGridColumns(
  containerWidth: number,
  cardWidth: number,
  gap: number = 12,
  padding: number = 16,
  minColumns: number = 2,
  maxColumns: number = 5
): number {
  const availableWidth = containerWidth - padding;
  const columns = Math.floor((availableWidth + gap) / (cardWidth + gap));
  return Math.max(minColumns, Math.min(maxColumns, columns));
}
