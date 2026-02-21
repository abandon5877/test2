import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSystem } from '../systems/JokerSystem';
import { JokerSlots } from '../models/JokerSlots';
import { getJokerById } from '../data/jokers';

describe('ON_BLIND_SELECT 触发器类小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('Cartomancer (纸牌占卜师)', () => {
    it('选择盲注时应生成塔罗牌', () => {
      const joker = getJokerById('cartomancer')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.tarotBonus).toBeGreaterThan(0);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('纸牌占卜师');
    });

    it('无空间时不应生成塔罗牌', () => {
      const joker = getJokerById('cartomancer')!;
      jokerSlots.addJoker(joker);

      // 填满所有槽位，模拟无空间情况
      for (let i = 0; i < 5; i++) {
        jokerSlots.addJoker(getJokerById('joker')!);
      }

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.tarotBonus).toBe(0);
    });
  });

  describe('Marble Joker (大理石小丑)', () => {
    it('选择盲注时应添加石头牌到牌库', () => {
      const joker = getJokerById('marble_joker')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('大理石小丑');
    });
  });

  describe('Burglar (窃贼)', () => {
    it('选择盲注时应+3 Hands并弃牌归零', () => {
      const joker = getJokerById('burglar')!;
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.handBonus).toBe(3);
      expect(result.discardReset).toBe(true);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('窃贼');
    });
  });

  describe('Madness (疯狂)', () => {
    it('选择盲注时应x0.5倍率并摧毁随机小丑', () => {
      // 添加多个小丑牌以便摧毁
      const joker1 = getJokerById('joker')!;
      const joker2 = getJokerById('joker')!;
      const madness = getJokerById('madness')!;
      
      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);
      jokerSlots.addJoker(madness);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.multMultiplier).toBe(1.5); // x0.5 倍率
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('疯狂');
    });

    it('只有一张小丑牌时不应摧毁', () => {
      const madness = getJokerById('madness')!;
      jokerSlots.addJoker(madness);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      // 只有Madness自己，不能摧毁
      expect(result.effects).toHaveLength(0);
    });
  });

  describe('Riff-Raff (乌合之众)', () => {
    it('选择盲注时应生成2张Common Jokers', () => {
      const joker = getJokerById('riff_raff')!;
      jokerSlots.addJoker(joker);

      // 确保有空位
      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.jokerBonus).toBe(2);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('乌合之众');
    });

    it('无空间时不应生成小丑', () => {
      const joker = getJokerById('riff_raff')!;
      jokerSlots.addJoker(joker);

      // 填满所有槽位
      for (let i = 0; i < 5; i++) {
        jokerSlots.addJoker(getJokerById('joker')!);
      }

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.jokerBonus).toBe(0);
    });
  });

  describe('Ceremonial Dagger (仪式匕首)', () => {
    it('选择盲注时应摧毁右侧小丑并加售价到倍率', () => {
      const dagger = getJokerById('ceremonial_dagger')!;
      const victim = getJokerById('joker')!;
      
      jokerSlots.addJoker(dagger);
      jokerSlots.addJoker(victim);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.multBonus).toBeGreaterThan(0);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('仪式匕首');
    });

    it('右侧无小丑时不应触发', () => {
      const dagger = getJokerById('ceremonial_dagger')!;
      jokerSlots.addJoker(dagger);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.multBonus).toBe(0);
    });
  });

  describe('多张ON_BLIND_SELECT小丑牌组合', () => {
    it('多张小丑牌应同时生效', () => {
      const cartomancer = getJokerById('cartomancer')!;
      const marble = getJokerById('marble_joker')!;
      
      jokerSlots.addJoker(cartomancer);
      jokerSlots.addJoker(marble);

      const result = JokerSystem.processBlindSelect(jokerSlots, 'SMALL_BLIND');

      expect(result.tarotBonus).toBeGreaterThan(0);
      expect(result.effects).toHaveLength(2);
    });
  });
});
