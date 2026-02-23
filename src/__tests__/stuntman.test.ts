import { describe, it, expect } from 'vitest';
import { getJokerById } from '../data/jokers';
import { JokerTrigger } from '../types/joker';

describe('特技演员(Stuntman)测试', () => {
  it('应该正确添加特技演员并应用效果', () => {
    // 获取特技演员
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();
    expect(stuntman?.name).toBe('特技演员');
    expect(stuntman?.description).toBe('+250筹码，-2手牌上限');
  });

  it('特技演员应该提供固定+250筹码', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();

    // 模拟触发效果
    const result = stuntman!.onIndependent({
      scoredCards: [],
      heldCards: [],
      gameState: { money: 0, interestCap: 0, hands: 0, discards: 0 }
    });

    // 验证固定+250筹码
    expect(result.chipBonus).toBe(250);
  });

  it('特技演员应该提供-2手牌上限', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();

    // 模拟触发效果
    const result = stuntman!.onIndependent({
      scoredCards: [],
      heldCards: [],
      gameState: { money: 0, interestCap: 0, hands: 0, discards: 0 }
    });

    // 验证-2手牌上限
    expect(result.handSizeBonus).toBe(-2);
  });

  it('特技演员效果应该始终一致（非概率触发）', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();

    // 多次触发，验证结果始终一致
    for (let i = 0; i < 10; i++) {
      const result = stuntman!.onIndependent({
        scoredCards: [],
        heldCards: [],
        gameState: { money: 0, interestCap: 0, hands: 0, discards: 0 }
      });

      expect(result.chipBonus).toBe(250);
      expect(result.handSizeBonus).toBe(-2);
    }
  });

  it('特技演员应该是稀有(Rare)品质', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();
    expect(stuntman?.rarity).toBe('rare');
  });

  it('特技演员售价应该是$7', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();
    expect(stuntman?.cost).toBe(7);
  });

  it('特技演员应该是独立触发(ON_INDEPENDENT)', () => {
    const stuntman = getJokerById('stuntman');
    expect(stuntman).toBeDefined();
    expect(stuntman?.trigger).toBe(JokerTrigger.ON_INDEPENDENT);
  });
});
