import { describe, it, expect, beforeEach } from 'vitest';
import { HandLevelState } from '../models/HandLevelState';
import { ScoringSystem } from '../systems/ScoringSystem';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('牌型升级系统测试', () => {
  let handLevelState: HandLevelState;

  beforeEach(() => {
    handLevelState = new HandLevelState();
  });

  it('应该正确初始化牌型等级', () => {
    const pairLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(pairLevel.level).toBe(1);
    expect(pairLevel.totalChipBonus).toBe(0);
    expect(pairLevel.totalMultBonus).toBe(0);
  });

  it('升级牌型应该增加筹码和倍率', () => {
    // 升级对子（对子升级：+15筹码，+1倍率）
    handLevelState.upgradeHand(PokerHandType.OnePair);
    
    const pairLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(pairLevel.level).toBe(2);
    expect(pairLevel.totalChipBonus).toBe(15);
    expect(pairLevel.totalMultBonus).toBe(1);
  });

  it('多次升级应该正确累加', () => {
    // 升级对子3次（对子每次升级：+15筹码，+1倍率）
    handLevelState.upgradeHand(PokerHandType.OnePair);
    handLevelState.upgradeHand(PokerHandType.OnePair);
    handLevelState.upgradeHand(PokerHandType.OnePair);
    
    const pairLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    expect(pairLevel.level).toBe(4);
    expect(pairLevel.totalChipBonus).toBe(45);
    expect(pairLevel.totalMultBonus).toBe(3);
  });

  it('计分时应该应用牌型升级效果', () => {
    // 升级对子（+15筹码，+1倍率）
    handLevelState.upgradeHand(PokerHandType.OnePair);
    
    const cards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Clubs, Rank.King),
      new Card(Suit.Diamonds, Rank.Queen),
      new Card(Suit.Spades, Rank.Jack)
    ];

    // 未升级时的基础值
    const resultWithoutUpgrade = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, undefined);
    
    // 升级后的值
    const resultWithUpgrade = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, handLevelState);
    
    // 验证升级后筹码增加了15
    expect(resultWithUpgrade.baseChips).toBe(resultWithoutUpgrade.baseChips + 15);
    // 验证升级后倍率增加了1
    expect(resultWithUpgrade.baseMultiplier).toBe(resultWithoutUpgrade.baseMultiplier + 1);
  });

  it('不同牌型应该独立升级', () => {
    // 升级对子
    handLevelState.upgradeHand(PokerHandType.OnePair);
    // 升级两对
    handLevelState.upgradeHand(PokerHandType.TwoPair);
    
    const pairLevel = handLevelState.getHandLevel(PokerHandType.OnePair);
    const twoPairLevel = handLevelState.getHandLevel(PokerHandType.TwoPair);
    
    expect(pairLevel.level).toBe(2);
    expect(twoPairLevel.level).toBe(2);
    
    // 验证顺子未升级
    const straightLevel = handLevelState.getHandLevel(PokerHandType.Straight);
    expect(straightLevel.level).toBe(1);
  });

  it('升级后应该正确计算总分', () => {
    // 升级同花2次（同花每次升级：+15筹码，+2倍率）
    handLevelState.upgradeHand(PokerHandType.Flush);
    handLevelState.upgradeHand(PokerHandType.Flush);
    
    const cards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Hearts, Rank.Queen),
      new Card(Suit.Hearts, Rank.Jack),
      new Card(Suit.Hearts, Rank.Ten)
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.Flush, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, handLevelState);
    
    // 同花基础值：35筹码，4倍率
    // 升级2次：+30筹码，+4倍率
    // 总计：65筹码，8倍率
    expect(result.baseChips).toBe(65);
    expect(result.baseMultiplier).toBe(8);
  });
});
