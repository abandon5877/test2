/**
 * 布局指标接口
 */
export interface LayoutMetrics {
  /** 是否有元素溢出容器 */
  hasOverflow: boolean;
  /** 是否有元素重叠 */
  hasOverlap: boolean;
  /** 溢出的元素列表 */
  overflowElements: HTMLElement[];
  /** 重叠的元素对列表 */
  overlappingPairs: Array<[HTMLElement, HTMLElement]>;
  /** 推荐的缩放比例 */
  recommendedScale: number;
  /** 容器尺寸信息 */
  containerSize: { width: number; height: number };
}

/**
 * 响应式布局配置
 */
export interface ResponsiveLayoutConfig {
  /** 最小缩放比例 */
  minScale: number;
  /** 最大缩放比例 */
  maxScale: number;
  /** 缩放步长 */
  scaleStep: number;
  /** 溢出检测容差（像素） */
  overflowTolerance: number;
  /** 是否启用自动缩放 */
  autoScale: boolean;
}

/**
 * 响应式布局管理器
 * 负责检测布局问题（溢出、重叠）并自动调整缩放比例
 */
export class ResponsiveLayoutManager {
  private container: HTMLElement;
  private config: ResponsiveLayoutConfig;
  private currentScale: number = 1;
  private resizeObserver: ResizeObserver | null = null;
  private checkTimeout: number | null = null;

  /**
   * 默认配置
   * 适配3840x2048到800x400分辨率
   * 小屏幕时缩小到0.25，防止手牌出界
   */
  private static defaultConfig: ResponsiveLayoutConfig = {
    minScale: 0.25,
    maxScale: 2.5,
    scaleStep: 0.05,
    overflowTolerance: 2,
    autoScale: true
  };

  /**
   * 构造函数
   * @param container 容器元素
   * @param config 配置选项
   */
  constructor(container: HTMLElement, config: Partial<ResponsiveLayoutConfig> = {}) {
    this.container = container;
    this.config = { ...ResponsiveLayoutManager.defaultConfig, ...config };
    
    // 初始化CSS变量
    this.applyScale(this.currentScale);
    
    // 设置ResizeObserver监听容器变化
    this.setupResizeObserver();
  }

  /**
   * 设置ResizeObserver监听容器尺寸变化
   */
  private setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        // 防抖处理
        if (this.checkTimeout) {
          clearTimeout(this.checkTimeout);
        }
        this.checkTimeout = window.setTimeout(() => {
          if (this.config.autoScale) {
            this.checkAndAdjustLayout();
          }
        }, 200);
      });
      
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * 检测两个元素是否重叠
   * @param elem1 元素1
   * @param elem2 元素2
   * @returns 是否重叠
   */
  private isOverlapping(elem1: HTMLElement, elem2: HTMLElement): boolean {
    const rect1 = elem1.getBoundingClientRect();
    const rect2 = elem2.getBoundingClientRect();

    // 检查是否有重叠（考虑容差）
    const tolerance = this.config.overflowTolerance;
    
    return !(
      rect1.right < rect2.left + tolerance ||
      rect1.left > rect2.right - tolerance ||
      rect1.bottom < rect2.top + tolerance ||
      rect1.top > rect2.bottom - tolerance
    );
  }

  /**
   * 检测元素是否溢出容器
   * @param child 子元素
   * @param containerRect 容器矩形区域
   * @returns 是否溢出
   */
  private isOverflowing(child: HTMLElement, containerRect: DOMRect): boolean {
    const childRect = child.getBoundingClientRect();
    const tolerance = this.config.overflowTolerance;

    return (
      childRect.right > containerRect.right + tolerance ||
      childRect.bottom > containerRect.bottom + tolerance ||
      childRect.left < containerRect.left - tolerance ||
      childRect.top < containerRect.top - tolerance
    );
  }

  /**
   * 检测布局问题
   * @returns 布局指标
   */
  detectLayoutIssues(): LayoutMetrics {
    const metrics: LayoutMetrics = {
      hasOverflow: false,
      hasOverlap: false,
      overflowElements: [],
      overlappingPairs: [],
      recommendedScale: this.currentScale,
      containerSize: {
        width: this.container.clientWidth,
        height: this.container.clientHeight
      }
    };

    const containerRect = this.container.getBoundingClientRect();
    const children = Array.from(this.container.children) as HTMLElement[];

    // 检测溢出
    children.forEach(child => {
      if (this.isOverflowing(child, containerRect)) {
        metrics.hasOverflow = true;
        metrics.overflowElements.push(child);
      }
    });

    // 检测重叠
    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        if (this.isOverlapping(children[i], children[j])) {
          metrics.hasOverlap = true;
          metrics.overlappingPairs.push([children[i], children[j]]);
        }
      }
    }

    // 计算推荐缩放比例
    if (metrics.hasOverflow || metrics.hasOverlap) {
      metrics.recommendedScale = Math.max(
        this.config.minScale,
        this.currentScale - this.config.scaleStep
      );
    }

    // 超宽屏检测（宽高比 > 2:1，如 2780x1284）
    const aspectRatio = containerRect.width / containerRect.height;
    if (aspectRatio > 2.0 && containerRect.height < 1400) {
      // 超宽屏手机横屏，根据高度计算推荐缩放
      const heightBasedScale = Math.min(
        containerRect.height / 1400, // 基于1400px标准高度
        0.85 // 最大缩放0.85
      );
      metrics.recommendedScale = Math.min(
        metrics.recommendedScale,
        Math.max(this.config.minScale, heightBasedScale)
      );
      console.log('[ResponsiveLayoutManager] 超宽屏检测:', {
        aspectRatio: aspectRatio.toFixed(2),
        height: containerRect.height,
        recommendedScale: metrics.recommendedScale
      });
    }

    return metrics;
  }

  /**
   * 应用缩放比例
   * @param scale 缩放比例
   */
  applyScale(scale: number): void {
    this.currentScale = Math.max(
      this.config.minScale,
      Math.min(this.config.maxScale, scale)
    );
    
    // 设置CSS变量
    document.documentElement.style.setProperty('--game-scale', String(this.currentScale));
    
    // 同时设置字体大小缩放
    const baseFontSize = 16 * this.currentScale;
    document.documentElement.style.setProperty('--game-font-scale', `${baseFontSize}px`);
  }

  /**
   * 检查并调整布局
   * @returns 是否进行了调整
   */
  checkAndAdjustLayout(): boolean {
    const metrics = this.detectLayoutIssues();
    
    if (metrics.hasOverflow || metrics.hasOverlap) {
      console.log('[ResponsiveLayoutManager] 检测到布局问题:', {
        hasOverflow: metrics.hasOverflow,
        hasOverlap: metrics.hasOverlap,
        overflowCount: metrics.overflowElements.length,
        overlapCount: metrics.overlappingPairs.length,
        currentScale: this.currentScale,
        recommendedScale: metrics.recommendedScale
      });
      
      this.applyScale(metrics.recommendedScale);
      
      // 递归检查直到问题解决或达到最小缩放
      if (metrics.recommendedScale > this.config.minScale) {
        // 使用setTimeout让浏览器有时间重绘
        setTimeout(() => {
          this.checkAndAdjustLayout();
        }, 100);
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * 获取当前缩放比例
   * @returns 当前缩放比例
   */
  getCurrentScale(): number {
    return this.currentScale;
  }

  /**
   * 获取最小缩放比例
   * @returns 最小缩放比例
   */
  getMinScale(): number {
    return this.config.minScale;
  }

  /**
   * 获取最大缩放比例
   * @returns 最大缩放比例
   */
  getMaxScale(): number {
    return this.config.maxScale;
  }

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<ResponsiveLayoutConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 重置为默认缩放
   */
  resetScale(): void {
    this.applyScale(1);
    this.checkAndAdjustLayout();
  }

  /**
   * 手动触发布局检查
   * @returns 布局指标
   */
  forceCheck(): LayoutMetrics {
    return this.detectLayoutIssues();
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    if (this.checkTimeout) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
    }
    
    // 清理CSS变量
    document.documentElement.style.removeProperty('--game-scale');
    document.documentElement.style.removeProperty('--game-font-scale');
  }
}

/**
 * 便捷的响应式布局管理器创建函数
 * @param container 容器元素或选择器
 * @param config 配置选项
 * @returns ResponsiveLayoutManager 实例
 */
export function createResponsiveLayoutManager(
  container: HTMLElement | string,
  config?: Partial<ResponsiveLayoutConfig>
): ResponsiveLayoutManager {
  const element = typeof container === 'string'
    ? document.querySelector(container) as HTMLElement
    : container;
    
  if (!element) {
    throw new Error('ResponsiveLayoutManager: 容器元素不存在');
  }
  
  return new ResponsiveLayoutManager(element, config);
}
