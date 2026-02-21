/**
 * 视口信息接口
 */
export interface ViewportInfo {
  /** 视口宽度 */
  width: number;
  /** 视口高度 */
  height: number;
  /** 设备像素比 */
  dpr: number;
  /** 屏幕宽高比 */
  aspectRatio: number;
}

/**
 * 设备类型
 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/**
 * 屏幕方向
 */
export type Orientation = 'landscape' | 'portrait';

/**
 * 视口管理器 - 单例模式
 * 提供类型安全的视口尺寸监听和屏幕信息获取
 */
export class ViewportManager {
  private static instance: ViewportManager | null = null;
  private resizeTimeout: number | null = null;
  private resizeCallbacks: Array<() => void> = [];
  private orientationCallbacks: Array<(orientation: Orientation) => void> = [];
  private lastOrientation: Orientation;

  /**
   * 获取单例实例
   */
  static getInstance(): ViewportManager {
    if (!ViewportManager.instance) {
      ViewportManager.instance = new ViewportManager();
    }
    return ViewportManager.instance;
  }

  /**
   * 私有构造函数
   */
  private constructor() {
    this.lastOrientation = this.getOrientation();
    this.initListeners();
  }

  /**
   * 初始化事件监听
   */
  private initListeners(): void {
    // 监听 resize 事件
    window.addEventListener('resize', () => this.handleResize());
    
    // 监听方向变化事件（移动端）
    if (screen.orientation) {
      screen.orientation.addEventListener('change', () => this.handleOrientationChange());
    }
  }

  /**
   * 处理 resize 事件
   */
  private handleResize(): void {
    // 防抖处理
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    this.resizeTimeout = window.setTimeout(() => {
      // 通知所有 resize 回调
      this.resizeCallbacks.forEach(callback => callback());
      
      // 检查方向变化
      const currentOrientation = this.getOrientation();
      if (currentOrientation !== this.lastOrientation) {
        this.lastOrientation = currentOrientation;
        this.orientationCallbacks.forEach(callback => callback(currentOrientation));
      }
    }, 100);
  }

  /**
   * 处理方向变化事件
   */
  private handleOrientationChange(): void {
    const currentOrientation = this.getOrientation();
    if (currentOrientation !== this.lastOrientation) {
      this.lastOrientation = currentOrientation;
      this.orientationCallbacks.forEach(callback => callback(currentOrientation));
    }
  }

  /**
   * 获取当前视口信息
   */
  getViewportInfo(): ViewportInfo {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
      aspectRatio: window.innerWidth / window.innerHeight
    };
  }

  /**
   * 计算缩放比例
   * @param designWidth 设计宽度
   * @param designHeight 设计高度
   * @returns 缩放比例
   */
  getScale(designWidth: number, designHeight: number): number {
    const { width, height } = this.getViewportInfo();
    const widthScale = width / designWidth;
    const heightScale = height / designHeight;
    return Math.min(widthScale, heightScale);
  }

  /**
   * 注册 resize 事件回调
   * @param callback 回调函数
   * @param delay 防抖延迟（毫秒），默认 100ms
   */
  onResize(callback: () => void, delay = 100): () => void {
    let timeout: number | null = null;
    
    const debouncedCallback = () => {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        callback();
      }, delay);
    };
    
    this.resizeCallbacks.push(debouncedCallback);
    window.addEventListener('resize', debouncedCallback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.resizeCallbacks.indexOf(debouncedCallback);
      if (index > -1) {
        this.resizeCallbacks.splice(index, 1);
      }
      window.removeEventListener('resize', debouncedCallback);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }

  /**
   * 注册方向变化回调
   * @param callback 回调函数
   */
  onOrientationChange(callback: (orientation: Orientation) => void): () => void {
    this.orientationCallbacks.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.orientationCallbacks.indexOf(callback);
      if (index > -1) {
        this.orientationCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * 获取设备类型
   * @returns 设备类型
   */
  getDeviceType(): DeviceType {
    const { width } = this.getViewportInfo();
    
    if (width >= 1024) {
      return 'desktop';
    } else if (width >= 768) {
      return 'tablet';
    } else {
      return 'mobile';
    }
  }

  /**
   * 获取屏幕方向
   * @returns 屏幕方向
   */
  getOrientation(): Orientation {
    const { width, height } = this.getViewportInfo();
    return width >= height ? 'landscape' : 'portrait';
  }

  /**
   * 判断是否为触摸设备
   * @returns 是否为触摸设备
   */
  isTouchDevice(): boolean {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    
    // 清理回调
    this.resizeCallbacks = [];
    this.orientationCallbacks = [];
    
    ViewportManager.instance = null;
  }
}

/**
 * 便捷的视口管理器钩子
 * @returns ViewportManager 实例
 */
export function useViewportManager(): ViewportManager {
  return ViewportManager.getInstance();
}
