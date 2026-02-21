declare const global: any;

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ViewportManager, DeviceType, Orientation } from '../utils/ViewportManager';

describe('ViewportManager', () => {
  let viewportManager: ViewportManager;
  let mockWindow: any;

  beforeEach(() => {
    // 创建 mock window 对象
    mockWindow = {
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
      setTimeout: (fn: Function, delay: number) => setTimeout(fn, delay),
      clearTimeout: (id: number) => clearTimeout(id)
    };

    // 将 mock 赋值给全局
    (global as any).window = mockWindow;
    (global as any).screen = { orientation: { addEventListener: vi.fn() } };

    // 重置单例
    (ViewportManager as any).instance = null;
    viewportManager = ViewportManager.getInstance();
  });

  afterEach(() => {
    if (viewportManager) {
      viewportManager.destroy();
    }
  });

  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = ViewportManager.getInstance();
      const instance2 = ViewportManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getViewportInfo', () => {
    it('应该返回正确的视口信息', () => {
      const info = viewportManager.getViewportInfo();
      
      expect(info).toHaveProperty('width');
      expect(info).toHaveProperty('height');
      expect(info).toHaveProperty('dpr');
      expect(info).toHaveProperty('aspectRatio');
      
      expect(typeof info.width).toBe('number');
      expect(typeof info.height).toBe('number');
      expect(typeof info.dpr).toBe('number');
      expect(typeof info.aspectRatio).toBe('number');
      
      expect(info.aspectRatio).toBe(info.width / info.height);
    });
  });

  describe('getScale', () => {
    it('应该正确计算缩放比例', () => {
      mockWindow.innerWidth = 1920;
      mockWindow.innerHeight = 1080;
      
      const scale = viewportManager.getScale(1920, 1080);
      expect(scale).toBe(1);
    });

    it('应该返回 widthScale 和 heightScale 中的较小值', () => {
      mockWindow.innerWidth = 960;
      mockWindow.innerHeight = 540;
      
      const scale = viewportManager.getScale(1920, 1080);
      expect(scale).toBe(0.5);
    });

    it('在超宽屏上应该以高度为基准', () => {
      mockWindow.innerWidth = 2560;
      mockWindow.innerHeight = 1080;
      
      const scale = viewportManager.getScale(1920, 1080);
      // widthScale = 2560/1920 = 1.33, heightScale = 1080/1080 = 1
      // 应该返回 1（较小值）
      expect(scale).toBe(1);
    });

    it('在竖屏上应该以宽度为基准', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 812;
      
      const scale = viewportManager.getScale(1920, 1080);
      // widthScale = 375/1920 ≈ 0.195, heightScale = 812/1080 ≈ 0.752
      // 应该返回 0.195（较小值）
      expect(scale).toBeCloseTo(0.195, 2);
    });
  });

  describe('getDeviceType', () => {
    it('应该正确识别桌面端', () => {
      mockWindow.innerWidth = 1920;
      expect(viewportManager.getDeviceType()).toBe('desktop');
    });

    it('应该正确识别平板端', () => {
      mockWindow.innerWidth = 768;
      expect(viewportManager.getDeviceType()).toBe('tablet');
    });

    it('应该正确识别移动端', () => {
      mockWindow.innerWidth = 375;
      expect(viewportManager.getDeviceType()).toBe('mobile');
    });

    it('应该在边界值正确切换', () => {
      // 1024px 应该是桌面端
      mockWindow.innerWidth = 1024;
      expect(viewportManager.getDeviceType()).toBe('desktop');
      
      // 1023px 应该是平板端
      mockWindow.innerWidth = 1023;
      expect(viewportManager.getDeviceType()).toBe('tablet');
      
      // 768px 应该是平板端
      mockWindow.innerWidth = 768;
      expect(viewportManager.getDeviceType()).toBe('tablet');
      
      // 767px 应该是移动端
      mockWindow.innerWidth = 767;
      expect(viewportManager.getDeviceType()).toBe('mobile');
    });
  });

  describe('getOrientation', () => {
    it('应该正确识别横屏', () => {
      mockWindow.innerWidth = 1920;
      mockWindow.innerHeight = 1080;
      expect(viewportManager.getOrientation()).toBe('landscape');
    });

    it('应该正确识别竖屏', () => {
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 812;
      expect(viewportManager.getOrientation()).toBe('portrait');
    });

    it('在正方形屏幕上应该识别为横屏', () => {
      mockWindow.innerWidth = 1080;
      mockWindow.innerHeight = 1080;
      expect(viewportManager.getOrientation()).toBe('landscape');
    });
  });

  describe('isTouchDevice', () => {
    it('应该返回布尔值', () => {
      const result = viewportManager.isTouchDevice();
      expect(typeof result).toBe('boolean');
    });

    it('应该正确检测触摸设备', () => {
      mockWindow.matchMedia = vi.fn().mockReturnValue({ matches: true });
      expect(viewportManager.isTouchDevice()).toBe(true);
      
      mockWindow.matchMedia = vi.fn().mockReturnValue({ matches: false });
      expect(viewportManager.isTouchDevice()).toBe(false);
    });
  });

  describe('onResize', () => {
    it('应该注册 resize 回调', () => {
      const callback = vi.fn();
      const unsubscribe = viewportManager.onResize(callback, 0);
      
      // 触发 resize 事件
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        (call: any[]) => call[0] === 'resize'
      )?.[1];
      
      if (resizeHandler) {
        resizeHandler();
      }
      
      unsubscribe();
    });

    it('应该返回取消订阅函数', () => {
      const callback = vi.fn();
      const unsubscribe = viewportManager.onResize(callback);
      
      // 取消订阅
      unsubscribe();
      
      expect(mockWindow.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('onOrientationChange', () => {
    it('应该注册方向变化回调', () => {
      const callback = vi.fn();
      const unsubscribe = viewportManager.onOrientationChange(callback);
      
      // 取消订阅
      unsubscribe();
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('应该清理所有资源', () => {
      viewportManager.destroy();
      
      // 单例应该被重置
      expect((ViewportManager as any).instance).toBeNull();
    });
  });
});
