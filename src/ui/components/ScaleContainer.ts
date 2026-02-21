import { ViewportManager } from '../../utils/ViewportManager';

/**
 * 适配模式
 * - 'contain': 保持比例，完整显示（默认）
 * - 'cover': 保持比例，填充整个屏幕（可能裁剪部分内容）
 * - 'fill': 不保持比例，拉伸填充
 */
export type FitMode = 'contain' | 'cover' | 'fill';

/**
 * 缩放容器选项接口
 */
export interface ScaleContainerOptions {
  /** 设计宽度 */
  designWidth?: number;
  /** 设计高度 */
  designHeight?: number;
  /** 是否自动缩放 */
  autoScale?: boolean;
  /** 适配模式 */
  fitMode?: FitMode;
  /** 是否允许内容稍微超出边界以填充空白（仅 contain 模式有效） */
  allowOverflow?: boolean;
  /** 最大溢出比例（0-1），默认 0.1 表示允许 10% 溢出 */
  maxOverflowRatio?: number;
}

/**
 * 缩放容器组件
 * 基于 transform: scale 实现等比例缩放，确保游戏界面适配不同屏幕
 */
export class ScaleContainer {
  private container: HTMLElement;
  private contentWrapper: HTMLElement;
  private viewportManager: ViewportManager;
  private options: Required<ScaleContainerOptions>;
  private unsubscribeResize: (() => void) | null = null;

  /**
   * 默认选项 - 使用更灵活的默认尺寸
   */
  private static defaultOptions: Required<ScaleContainerOptions> = {
    designWidth: 1280,  // 从 1920 改为 1280，更适合中等屏幕
    designHeight: 720,  // 从 1080 改为 720，保持 16:9 比例
    autoScale: true,
    fitMode: 'contain',
    allowOverflow: true,
    maxOverflowRatio: 0.2  // 增加允许溢出比例以填充空白
  };

  /**
   * 构造函数
   * @param container 容器元素
   * @param options 选项
   */
  constructor(container: HTMLElement, options: ScaleContainerOptions = {}) {
    this.container = container;
    this.options = { ...ScaleContainer.defaultOptions, ...options };
    this.viewportManager = ViewportManager.getInstance();
    
    // 创建内容包装器
    this.contentWrapper = document.createElement('div');
    this.contentWrapper.className = 'scale-container-content';
    this.contentWrapper.style.cssText = `
      width: ${this.options.designWidth}px;
      height: ${this.options.designHeight}px;
      transform-origin: center center;
      position: relative;
      overflow: hidden;
    `;
    
    // 设置容器样式
    this.container.style.cssText = `
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0d1b2a;
    `;
    
    // 将内容包装器添加到容器
    this.container.appendChild(this.contentWrapper);
    
    // 初始化缩放
    this.applyScale();
    
    // 监听 resize 事件
    if (this.options.autoScale) {
      this.unsubscribeResize = this.viewportManager.onResize(() => {
        this.applyScale();
      });
    }
  }

  /**
   * 获取内容包装器元素
   * @returns 内容包装器元素
   */
  getContentWrapper(): HTMLElement {
    return this.contentWrapper;
  }

  /**
   * 应用缩放
   */
  applyScale(): void {
    const { designWidth, designHeight, fitMode, allowOverflow, maxOverflowRatio } = this.options;
    
    // 获取视口尺寸
    const viewportInfo = this.viewportManager.getViewportInfo();
    const { width: viewportWidth, height: viewportHeight } = viewportInfo;
    
    let scale: number;
    
    switch (fitMode) {
      case 'fill':
        // 填充模式 - 不保持比例，拉伸填充
        const scaleX = viewportWidth / designWidth;
        const scaleY = viewportHeight / designHeight;
        scale = Math.max(scaleX, scaleY);
        break;
        
      case 'cover':
        // 覆盖模式 - 保持比例，填充整个屏幕（可能裁剪）
        const coverScaleX = viewportWidth / designWidth;
        const coverScaleY = viewportHeight / designHeight;
        scale = Math.max(coverScaleX, coverScaleY);
        break;
        
      case 'contain':
      default:
        // 包含模式 - 保持比例，完整显示
        const containScaleX = viewportWidth / designWidth;
        const containScaleY = viewportHeight / designHeight;
        scale = Math.min(containScaleX, containScaleY);
        
        // 如果允许溢出，尝试稍微放大以填充空白
        if (allowOverflow && scale < 1) {
          const designRatio = designWidth / designHeight;
          const viewportRatio = viewportWidth / viewportHeight;
          
          // 计算空白比例
          const blankRatio = Math.abs(viewportRatio - designRatio) / Math.max(viewportRatio, designRatio);
          
          // 如果空白较大，允许稍微放大
          if (blankRatio > 0.1) {
            const overflowScale = scale * (1 + maxOverflowRatio);
            // 确保放大后不会超出视口太多
            const maxAllowedScale = Math.min(
              viewportWidth / designWidth,
              viewportHeight / designHeight
            ) * (1 + maxOverflowRatio);
            
            scale = Math.min(overflowScale, maxAllowedScale);
          }
        }
        break;
    }
    
    // 应用缩放
    this.contentWrapper.style.transform = `scale(${scale})`;
    
    // 计算居中偏移
    const scaledWidth = designWidth * scale;
    const scaledHeight = designHeight * scale;
    
    // 使用 margin 进行居中
    const marginX = Math.max((viewportWidth - scaledWidth) / 2, 0);
    const marginY = Math.max((viewportHeight - scaledHeight) / 2, 0);
    
    this.contentWrapper.style.margin = `${marginY}px ${marginX}px`;
    
    // 确保内容不会过度溢出视口
    if (scaledWidth > viewportWidth * (1 + maxOverflowRatio) || 
        scaledHeight > viewportHeight * (1 + maxOverflowRatio)) {
      // 如果缩放后的内容过度溢出视口，调整缩放比例
      const fitScaleX = viewportWidth / designWidth;
      const fitScaleY = viewportHeight / designHeight;
      const fitScale = Math.min(fitScaleX, fitScaleY);
      
      this.contentWrapper.style.transform = `scale(${fitScale})`;
      
      const fitScaledWidth = designWidth * fitScale;
      const fitScaledHeight = designHeight * fitScale;
      const fitMarginX = Math.max((viewportWidth - fitScaledWidth) / 2, 0);
      const fitMarginY = Math.max((viewportHeight - fitScaledHeight) / 2, 0);
      
      this.contentWrapper.style.margin = `${fitMarginY}px ${fitMarginX}px`;
    }
  }

  /**
   * 更新选项
   * @param options 新选项
   */
  updateOptions(options: Partial<ScaleContainerOptions>): void {
    this.options = { ...this.options, ...options };
    
    // 更新内容包装器尺寸
    if (options.designWidth || options.designHeight) {
      this.contentWrapper.style.width = `${this.options.designWidth}px`;
      this.contentWrapper.style.height = `${this.options.designHeight}px`;
    }
    
    // 重新应用缩放
    this.applyScale();
  }

  /**
   * 获取当前缩放比例
   * @returns 当前缩放比例
   */
  getCurrentScale(): number {
    const { designWidth, designHeight } = this.options;
    return this.viewportManager.getScale(designWidth, designHeight);
  }

  /**
   * 销毁组件
   */
  destroy(): void {
    // 取消 resize 监听
    if (this.unsubscribeResize) {
      this.unsubscribeResize();
      this.unsubscribeResize = null;
    }
    
    // 移除内容包装器
    if (this.contentWrapper && this.contentWrapper.parentNode) {
      this.contentWrapper.parentNode.removeChild(this.contentWrapper);
    }
    
    // 清理容器样式
    this.container.style.cssText = '';
  }
}

/**
 * 便捷的缩放容器创建函数
 * @param container 容器元素或选择器
 * @param options 选项
 * @returns ScaleContainer 实例
 */
export function createScaleContainer(
  container: HTMLElement | string,
  options?: ScaleContainerOptions
): ScaleContainer {
  const element = typeof container === 'string' 
    ? document.querySelector(container) as HTMLElement
    : container;
    
  if (!element) {
    throw new Error('ScaleContainer: 容器元素不存在');
  }
  
  return new ScaleContainer(element, options);
}
