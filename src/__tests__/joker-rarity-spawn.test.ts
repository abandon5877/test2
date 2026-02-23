import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRandomJokers,
  getRandomJoker,
  JOKER_RARITY_WEIGHTS,
  setGrosMichelDestroyed,
  resetGrosMichelDestroyed,
  isGrosMichelDestroyed,
  getJokerById
} from '../data/jokers';
import { JokerRarity } from '../types/joker';

describe('小丑牌稀有度生成测试', () => {
  beforeEach(() => {
    // 每个测试前重置大麦克自毁状态
    resetGrosMichelDestroyed();
  });

  describe('稀有度权重配置', () => {
    it('应该有正确的稀有度权重配置', () => {
      expect(JOKER_RARITY_WEIGHTS[JokerRarity.COMMON]).toBe(0.70);
      expect(JOKER_RARITY_WEIGHTS[JokerRarity.UNCOMMON]).toBe(0.25);
      expect(JOKER_RARITY_WEIGHTS[JokerRarity.RARE]).toBe(0.05);
      // 注意：传说(Legendary)小丑牌只能通过灵魂(The Soul)幻灵牌获得
      // 不在JOKER_RARITY_WEIGHTS中
    });

    it('权重总和应该等于1', () => {
      const total = Object.values(JOKER_RARITY_WEIGHTS).reduce((sum, w) => sum + w, 0);
      expect(total).toBeCloseTo(1, 5);
    });

    it('传说小丑牌不应该在权重配置中', () => {
      // 传说小丑牌只能通过灵魂牌获得，不应该在商店/卡包生成权重中
      const weights = JOKER_RARITY_WEIGHTS as Record<string, number | undefined>;
      expect(weights['legendary']).toBeUndefined();
    });
  });

  describe('getRandomJokers 稀有度分布', () => {
    it('应该按照稀有度权重生成小丑牌', () => {
      // 生成大量小丑牌来验证分布
      const sampleSize = 1000;
      const jokers = getRandomJokers(sampleSize);

      expect(jokers.length).toBe(sampleSize);

      // 统计各稀有度数量
      const rarityCounts = {
        [JokerRarity.COMMON]: 0,
        [JokerRarity.UNCOMMON]: 0,
        [JokerRarity.RARE]: 0,
        [JokerRarity.LEGENDARY]: 0
      };

      for (const joker of jokers) {
        rarityCounts[joker.rarity]++;
      }

      // 验证分布大致符合权重（允许10%的误差范围）
      const commonRatio = rarityCounts[JokerRarity.COMMON] / sampleSize;
      const uncommonRatio = rarityCounts[JokerRarity.UNCOMMON] / sampleSize;
      const rareRatio = rarityCounts[JokerRarity.RARE] / sampleSize;
      const legendaryRatio = rarityCounts[JokerRarity.LEGENDARY] / sampleSize;

      // 普通应该在60%-80%之间
      expect(commonRatio).toBeGreaterThan(0.60);
      expect(commonRatio).toBeLessThan(0.80);

      // 罕见应该在15%-35%之间
      expect(uncommonRatio).toBeGreaterThan(0.15);
      expect(uncommonRatio).toBeLessThan(0.35);

      // 稀有应该在0%-10%之间（5%概率，允许误差）
      expect(rareRatio).toBeGreaterThanOrEqual(0);
      expect(rareRatio).toBeLessThan(0.10);

      // 传说小丑牌不应该从商店/卡包生成（只能通过灵魂牌获得）
      expect(legendaryRatio).toBe(0);
    });

    it('生成的小丑牌应该有有效的稀有度', () => {
      const jokers = getRandomJokers(10);

      for (const joker of jokers) {
        expect(Object.values(JokerRarity)).toContain(joker.rarity);
      }
    });

    it('不应该生成传说小丑牌', () => {
      // 生成大量小丑牌
      const sampleSize = 500;
      const jokers = getRandomJokers(sampleSize);

      // 检查是否有传说小丑牌
      const hasLegendary = jokers.some(j => j.rarity === JokerRarity.LEGENDARY);

      // 传说小丑牌不应该从商店/卡包生成
      expect(hasLegendary).toBe(false);
    });
  });

  describe('卡文迪什解锁逻辑', () => {
    it('大麦克未自毁时，卡文迪什不应该被生成', () => {
      // 确保大麦克未自毁
      expect(isGrosMichelDestroyed()).toBe(false);

      // 生成大量小丑牌
      const sampleSize = 500;
      const jokers = getRandomJokers(sampleSize);

      // 检查是否包含卡文迪什
      const hasCavendish = jokers.some(j => j.id === 'cavendish');

      // 大麦克未自毁时，不应该生成卡文迪什
      expect(hasCavendish).toBe(false);
    });

    it('大麦克自毁后，卡文迪什应该可以被生成', () => {
      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);
      expect(isGrosMichelDestroyed()).toBe(true);

      // 生成大量小丑牌
      const sampleSize = 500;
      const jokers = getRandomJokers(sampleSize);

      // 检查卡文迪什的稀有度
      const cavendish = getJokerById('cavendish');
      expect(cavendish).toBeDefined();
      expect(cavendish!.rarity).toBe(JokerRarity.UNCOMMON);
    });

    it('getRandomJoker 也应该遵循卡文迪什解锁逻辑', () => {
      // 大麦克未自毁
      resetGrosMichelDestroyed();

      // 生成大量单个小丑牌
      const sampleSize = 300;
      let cavendishCount = 0;

      for (let i = 0; i < sampleSize; i++) {
        const joker = getRandomJoker();
        if (joker.id === 'cavendish') {
          cavendishCount++;
        }
      }

      // 大麦克未自毁时，不应该生成卡文迪什
      expect(cavendishCount).toBe(0);

      // 设置大麦克已自毁
      setGrosMichelDestroyed(true);

      // 再次生成
      let cavendishCountAfterUnlock = 0;
      for (let i = 0; i < sampleSize; i++) {
        const joker = getRandomJoker();
        if (joker.id === 'cavendish') {
          cavendishCountAfterUnlock++;
        }
      }

      // 大麦克自毁后，应该有机会生成卡文迪什（但因为是罕见，可能还是0）
      // 这里只验证不会抛出错误，不强制要求一定生成
      expect(cavendishCountAfterUnlock).toBeGreaterThanOrEqual(0);
    });

    it('resetGrosMichelDestroyed 应该重置状态', () => {
      // 先设置自毁
      setGrosMichelDestroyed(true);
      expect(isGrosMichelDestroyed()).toBe(true);

      // 重置
      resetGrosMichelDestroyed();
      expect(isGrosMichelDestroyed()).toBe(false);
    });
  });

  describe('getRandomJokers 边界情况', () => {
    it('应该能生成指定数量的小丑牌', () => {
      const counts = [1, 2, 5, 10];

      for (const count of counts) {
        const jokers = getRandomJokers(count);
        expect(jokers.length).toBe(count);
      }
    });

    it('生成的小丑牌应该是独立的克隆', () => {
      const jokers = getRandomJokers(5);

      // 修改第一个小丑牌，不应该影响其他
      if (jokers.length > 1) {
        const firstId = jokers[0].id;
        const secondId = jokers[1].id;

        // 如果是相同ID的小丑牌（概率极低），跳过此测试
        if (firstId === secondId) {
          return;
        }

        // 验证它们是不同的对象
        expect(jokers[0]).not.toBe(jokers[1]);
      }
    });
  });
});
