import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { HandLevelState } from '../models/HandLevelState';
import { PokerHandType } from '../types/pokerHands';
import { getPlanetById } from '../data/consumables';

describe('Planet Card Upgrade Integration', () => {
  let gameState: GameState;
  let handLevelState: HandLevelState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    handLevelState = gameState.handLevelState;
  });

  it('should upgrade hand level when using a planet card', () => {
    // 获取初始等级
    const initialLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(initialLevel.level).toBe(1);
    expect(initialLevel.totalChipBonus).toBe(0);
    expect(initialLevel.totalMultBonus).toBe(0);

    // 使用水星牌（升级对子）
    const mercury = getPlanetById('planet_mercury');
    expect(mercury).toBeDefined();

    const result = mercury!.use({});
    expect(result.success).toBe(true);
    expect(result.handTypeUpgrade).toBe(PokerHandType.OnePair);

    // 手动升级牌型（模拟 GameBoard 中的逻辑）
    handLevelState.upgradeHand(result.handTypeUpgrade as PokerHandType);

    // 验证等级已提升
    const upgradedLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(upgradedLevel.level).toBe(2);
    expect(upgradedLevel.totalChipBonus).toBe(15); // 水星牌提供的筹码加成
    expect(upgradedLevel.totalMultBonus).toBe(1);  // 水星牌提供的倍率加成
  });

  it('should upgrade hand level multiple times', () => {
    // 使用多次水星牌
    const mercury = getPlanetById('planet_mercury')!;

    for (let i = 0; i < 3; i++) {
      const result = mercury.use({});
      handLevelState.upgradeHand(result.handTypeUpgrade as PokerHandType);
    }

    const finalLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(finalLevel.level).toBe(4); // 初始1级 + 3次升级
    expect(finalLevel.totalChipBonus).toBe(45); // 15 * 3
    expect(finalLevel.totalMultBonus).toBe(3);  // 1 * 3
  });

  it('should upgrade different hand types independently', () => {
    const mercury = getPlanetById('planet_mercury')!; // 对子
    const venus = getPlanetById('planet_venus')!;     // 三条

    // 升级对子
    const result1 = mercury.use({});
    handLevelState.upgradeHand(result1.handTypeUpgrade as PokerHandType);

    // 升级三条
    const result2 = venus.use({});
    handLevelState.upgradeHand(result2.handTypeUpgrade as PokerHandType);

    const pairLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    const threeOfAKindLevel = handLevelState.getHandLevel(PokerHandType.ThreeOfAKind);

    expect(pairLevel.level).toBe(2);
    expect(threeOfAKindLevel.level).toBe(2);
    expect(pairLevel.totalChipBonus).toBe(15);
    expect(threeOfAKindLevel.totalChipBonus).toBe(20);
  });

  it('should get upgraded hand value correctly', () => {
    const mercury = getPlanetById('planet_mercury')!;

    const initialValue = handLevelState.getUpgradedHandValue(PokerHandType.OnePair);
    expect(initialValue.chips).toBe(10); // 基础筹码
    expect(initialValue.multiplier).toBe(2); // 基础倍率

    const result = mercury.use({});
    handLevelState.upgradeHand(result.handTypeUpgrade as PokerHandType);

    const upgradedValue = handLevelState.getUpgradedHandValue(PokerHandType.OnePair);
    expect(upgradedValue.chips).toBe(25); // 10 + 15
    expect(upgradedValue.multiplier).toBe(3); // 2 + 1
  });
});
