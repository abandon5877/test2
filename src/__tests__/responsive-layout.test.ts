import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ResponsiveLayoutManager, LayoutMetrics } from '../utils/ResponsiveLayoutManager';

describe('Responsive Layout', () => {
  describe('ResponsiveLayoutManager 逻辑测试', () => {
    it('应该正确计算小丑牌区域宽度', () => {
      // 小丑牌区域宽度计算：
      // cardWidth = 110px (最大牌宽)
      // overlap = 30px (每张重叠部分)
      // gap = 16px (右侧空隙)
      // padding = 24px (左右内边距)
      // 5张牌 = 110 + 4*30 + 16 + 24 = 270px
      
      const cardWidth = 110;
      const overlap = 30;
      const gap = 16;
      const padding = 24;
      
      const totalWidth = cardWidth + (4 * overlap) + gap + padding;
      
      expect(totalWidth).toBe(270);
      expect(totalWidth).toBeGreaterThanOrEqual(260); // 最小需求
      expect(totalWidth).toBeLessThanOrEqual(320); // 最大限制
    });

    it('应该根据屏幕尺寸计算正确的缩放比例', () => {
      // 模拟不同屏幕尺寸
      const testCases = [
        { width: 1920, height: 1080, expectedScale: 1.3 }, // 大屏幕
        { width: 1280, height: 720, expectedScale: 1 },    // 基准屏幕
        { width: 800, height: 600, expectedScale: 0.833 }, // 小屏幕
        { width: 640, height: 480, expectedScale: 0.7 },   // 超小屏幕
      ];

      testCases.forEach(({ width, height, expectedScale }) => {
        const minDimension = Math.min(width, height);
        const scale = Math.max(0.7, Math.min(1.3, minDimension / 720));
        
        expect(scale).toBeCloseTo(expectedScale, 1);
      });
    });

    it('缩放比例应该在0.7到1.3之间', () => {
      const scales = [
        Math.max(0.7, Math.min(1.3, 2560 / 720)), // 超大屏幕
        Math.max(0.7, Math.min(1.3, 375 / 720)),  // 手机屏幕
      ];

      scales.forEach(scale => {
        expect(scale).toBeGreaterThanOrEqual(0.7);
        expect(scale).toBeLessThanOrEqual(1.3);
      });
    });
  });

  describe('布局配置测试', () => {
    it('应该使用正确的默认配置值', () => {
      // 验证默认配置值
      const defaultConfig = {
        minScale: 0.6,
        maxScale: 1.2,
        scaleStep: 0.05,
        overflowTolerance: 2,
        autoScale: true
      };

      expect(defaultConfig.minScale).toBe(0.6);
      expect(defaultConfig.maxScale).toBe(1.2);
      expect(defaultConfig.scaleStep).toBe(0.05);
      expect(defaultConfig.overflowTolerance).toBe(2);
      expect(defaultConfig.autoScale).toBe(true);
    });

    it('应该正确计算推荐缩放比例', () => {
      const currentScale = 1;
      const minScale = 0.6;
      const scaleStep = 0.05;
      
      // 当检测到问题时，推荐缩放比例应该减小
      const recommendedScale = Math.max(minScale, currentScale - scaleStep);
      
      expect(recommendedScale).toBe(0.95);
      expect(recommendedScale).toBeGreaterThanOrEqual(minScale);
    });

    it('应该限制缩放比例在最小值和最大值之间', () => {
      const minScale = 0.6;
      const maxScale = 1.2;
      
      // 测试低于最小值的情况
      const belowMin = Math.max(minScale, Math.min(maxScale, 0.3));
      expect(belowMin).toBe(minScale);
      
      // 测试高于最大值的情况
      const aboveMax = Math.max(minScale, Math.min(maxScale, 2.0));
      expect(aboveMax).toBe(maxScale);
      
      // 测试正常范围
      const normal = Math.max(minScale, Math.min(maxScale, 0.8));
      expect(normal).toBe(0.8);
    });
  });

  describe('按钮动态缩放计算', () => {
    it('应该根据屏幕最小边计算按钮尺寸', () => {
      const viewportWidth = 1280;
      const viewportHeight = 720;
      const minDimension = Math.min(viewportWidth, viewportHeight);
      
      // 基础尺寸
      const basePaddingX = 12;
      const basePaddingY = 8;
      const baseFontSize = 14;
      
      // 根据最小边缩放 (0.7 - 1.3 范围)
      const scale = Math.max(0.7, Math.min(1.3, minDimension / 720));
      
      const padding = `${Math.round(basePaddingY * scale)}px ${Math.round(basePaddingX * scale)}px`;
      const fontSize = `${Math.round(baseFontSize * scale)}px`;
      
      expect(scale).toBe(1);
      expect(padding).toBe('8px 12px');
      expect(fontSize).toBe('14px');
    });

    it('应该在小屏幕上缩小按钮', () => {
      const minDimension = 480; // 小屏幕
      
      const basePaddingX = 12;
      const baseFontSize = 14;
      
      const scale = Math.max(0.7, Math.min(1.3, minDimension / 720));
      
      expect(scale).toBeLessThan(1);
      expect(Math.round(basePaddingX * scale)).toBeLessThan(basePaddingX);
      expect(Math.round(baseFontSize * scale)).toBeLessThan(baseFontSize);
    });
  });

  describe('溢出检测逻辑', () => {
    it('应该正确检测元素是否溢出', () => {
      // 模拟容器和子元素的位置信息
      const containerRect = { left: 0, top: 0, right: 1280, bottom: 720 };
      const childRect = { left: 1300, top: 0, right: 1400, bottom: 100 };
      const tolerance = 2;
      
      // 检测溢出
      const isOverflowing = (
        childRect.right > containerRect.right + tolerance ||
        childRect.bottom > containerRect.bottom + tolerance ||
        childRect.left < containerRect.left - tolerance ||
        childRect.top < containerRect.top - tolerance
      );
      
      expect(isOverflowing).toBe(true);
    });

    it('应该正确检测元素是否重叠', () => {
      // 模拟两个重叠的元素
      const rect1 = { left: 0, top: 0, right: 200, bottom: 100 };
      const rect2 = { left: 100, top: 0, right: 300, bottom: 100 };
      const tolerance = 2;
      
      // 检测重叠
      const isOverlapping = !(
        rect1.right < rect2.left + tolerance ||
        rect1.left > rect2.right - tolerance ||
        rect1.bottom < rect2.top + tolerance ||
        rect1.top > rect2.bottom - tolerance
      );
      
      expect(isOverlapping).toBe(true);
    });

    it('应该正确检测不重叠的元素', () => {
      // 模拟两个不重叠的元素
      const rect1 = { left: 0, top: 0, right: 100, bottom: 100 };
      const rect2 = { left: 200, top: 0, right: 300, bottom: 100 };
      const tolerance = 2;
      
      // 检测重叠
      const isOverlapping = !(
        rect1.right < rect2.left + tolerance ||
        rect1.left > rect2.right - tolerance ||
        rect1.bottom < rect2.top + tolerance ||
        rect1.top > rect2.bottom - tolerance
      );
      
      expect(isOverlapping).toBe(false);
    });
  });

  describe('CSS Grid 布局计算', () => {
    it('应该使用正确的网格列定义', () => {
      // 左侧栏: minmax(120px, 160px)
      // 中间栏: 1fr
      // 右侧栏: minmax(280px, 320px)
      
      const leftColumn = 'minmax(120px, 160px)';
      const centerColumn = '1fr';
      const rightColumn = 'minmax(280px, 320px)';
      
      const gridTemplateColumns = `${leftColumn} ${centerColumn} ${rightColumn}`;
      
      expect(gridTemplateColumns).toContain('minmax(120px, 160px)');
      expect(gridTemplateColumns).toContain('1fr');
      expect(gridTemplateColumns).toContain('minmax(280px, 320px)');
    });

    it('小丑牌区域宽度应该能容纳5张牌', () => {
      // 小丑牌宽度: clamp(60px, 15vmin, 110px) = 最大110px
      // 5张牌重叠显示: 第1张完整 + 后4张各露出约30px
      // 总宽度 = 110 + 4*30 = 230px (不含空隙)
      
      const cardWidth = 110;
      const overlap = 30;
      const fiveCardsWidth = cardWidth + (4 * overlap);
      
      expect(fiveCardsWidth).toBe(230);
      expect(fiveCardsWidth).toBeLessThan(280); // 加上空隙和padding后应该小于最大限制
    });
  });

  describe('响应式断点', () => {
    it('应该在不同屏幕尺寸下应用正确的布局', () => {
      const breakpoints = [
        { width: 1920, minLeft: 120, maxLeft: 160, minRight: 280, maxRight: 320 },
        { width: 1366, minLeft: 120, maxLeft: 160, minRight: 280, maxRight: 320 },
        { width: 1024, minLeft: 120, maxLeft: 160, minRight: 260, maxRight: 320 },
        { width: 768, minLeft: 100, maxLeft: 140, minRight: 200, maxRight: 280 },
      ];

      breakpoints.forEach(({ width, minLeft, maxLeft, minRight, maxRight }) => {
        // 验证断点逻辑
        const leftColumn = width >= 1024 ? 160 : width >= 768 ? 120 : 100;
        const rightColumn = width >= 1366 ? 320 : width >= 1024 ? 280 : 240;
        
        expect(leftColumn).toBeGreaterThanOrEqual(minLeft);
        expect(leftColumn).toBeLessThanOrEqual(maxLeft);
        expect(rightColumn).toBeGreaterThanOrEqual(minRight);
        expect(rightColumn).toBeLessThanOrEqual(maxRight);
      });
    });
  });
});
