import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';

describe('盲注结束概率摧毁小丑牌测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
  });

  describe('大麦克 (gros_michel)', () => {
    it('应该存在并具有 onEndOfRound 回调', () => {
      const joker = getJokerById('gros_michel');
      expect(joker).toBeDefined();
      expect(joker!.onEndRound).toBeDefined();
    });

    it('概率触发时应该摧毁自己', () => {
      const joker = getJokerById('gros_michel')!;
      jokerSlots.addJoker(joker);

      // 模拟随机数返回小于1/6的值（触发摧毁）
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1); // 0.1 < 1/6 ≈ 0.167

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(1);
      expect(result.destroyedJokers[0]).toBe(0);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('被摧毁了');
      expect(jokerSlots.getJokers()).toHaveLength(0);

      mockRandom.mockRestore();
    });

    it('概率未触发时不应该摧毁自己', () => {
      const joker = getJokerById('gros_michel')!;
      jokerSlots.addJoker(joker);

      // 模拟随机数返回大于1/6的值（不触发摧毁）
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5); // 0.5 > 1/6

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(0);
      expect(result.effects).toHaveLength(0);
      expect(jokerSlots.getJokers()).toHaveLength(1);

      mockRandom.mockRestore();
    });
  });

  describe('爆米花 (popcorn)', () => {
    it('应该存在并具有 onEndOfRound 回调', () => {
      const joker = getJokerById('popcorn');
      expect(joker).toBeDefined();
      expect(joker!.onEndRound).toBeDefined();
    });

    it('倍率减到0时应该摧毁自己', () => {
      const joker = getJokerById('popcorn')!;
      // 设置剩余倍率为4，回合结束后变为0
      joker.updateState({ remainingMult: 4 });
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(1);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('吃完了');
      expect(jokerSlots.getJokers()).toHaveLength(0);
    });

    it('倍率未减到0时不应该摧毁自己', () => {
      const joker = getJokerById('popcorn')!;
      // 设置剩余倍率为20，回合结束后变为16
      joker.updateState({ remainingMult: 20 });
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(0);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('剩余');
      expect(jokerSlots.getJokers()).toHaveLength(1);

      // 验证状态已更新
      const updatedJoker = jokerSlots.getJokers()[0];
      expect(updatedJoker.state.remainingMult).toBe(16);
    });
  });

  describe('卡文迪什 (cavendish)', () => {
    it('应该存在并具有 onEndOfRound 回调', () => {
      const joker = getJokerById('cavendish');
      expect(joker).toBeDefined();
      expect(joker!.onEndRound).toBeDefined();
    });

    it('概率触发时应该摧毁自己', () => {
      const joker = getJokerById('cavendish')!;
      jokerSlots.addJoker(joker);

      // 模拟随机数返回小于0.001的值（触发摧毁）
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.0005);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(1);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('枯萎了');
      expect(jokerSlots.getJokers()).toHaveLength(0);

      mockRandom.mockRestore();
    });

    it('概率未触发时不应该摧毁自己', () => {
      const joker = getJokerById('cavendish')!;
      jokerSlots.addJoker(joker);

      // 模拟随机数返回大于0.001的值（不触发摧毁）
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(0);
      expect(result.effects).toHaveLength(0);
      expect(jokerSlots.getJokers()).toHaveLength(1);

      mockRandom.mockRestore();
    });
  });

  describe('龟豆 (turtle_bean)', () => {
    it('应该存在并具有 onEndOfRound 回调', () => {
      const joker = getJokerById('turtle_bean');
      expect(joker).toBeDefined();
      expect(joker!.onEndRound).toBeDefined();
    });

    it('手牌上限加成减到0时应该摧毁自己', () => {
      const joker = getJokerById('turtle_bean')!;
      // 设置手牌上限加成为1，回合结束后变为0
      joker.updateState({ handSizeBonus: 1 });
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(1);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('吃完了');
      expect(jokerSlots.getJokers()).toHaveLength(0);
    });

    it('手牌上限加成未减到0时不应该摧毁自己', () => {
      const joker = getJokerById('turtle_bean')!;
      // 设置手牌上限加成为5，回合结束后变为4
      joker.updateState({ handSizeBonus: 5 });
      jokerSlots.addJoker(joker);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      expect(result.destroyedJokers).toHaveLength(0);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].effect).toContain('剩余');
      expect(jokerSlots.getJokers()).toHaveLength(1);

      // 验证状态已更新
      const updatedJoker = jokerSlots.getJokers()[0];
      expect(updatedJoker.state.handSizeBonus).toBe(4);
    });
  });

  describe('多个摧毁效果组合', () => {
    it('应该正确处理多个小丑牌同时摧毁', () => {
      const grosMichel = getJokerById('gros_michel')!;
      const popcorn = getJokerById('popcorn')!;

      // 设置爆米花倍率为4，会被摧毁
      popcorn.updateState({ remainingMult: 4 });

      jokerSlots.addJoker(grosMichel);
      jokerSlots.addJoker(popcorn);

      // 模拟随机数使大麦克触发摧毁
      const mockRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 10,
        interestCap: 5,
        hands: 2,
        discards: 1
      });

      // 两个小丑牌都应该被摧毁
      expect(result.destroyedJokers).toHaveLength(2);
      expect(jokerSlots.getJokers()).toHaveLength(0);
      expect(result.effects).toHaveLength(2);

      mockRandom.mockRestore();
    });
  });
});
