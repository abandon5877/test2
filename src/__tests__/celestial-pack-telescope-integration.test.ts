import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../models/GameState';
import { PokerHandType } from '../types/pokerHands';
import { getPlanetConsumableByHandType } from '../data/consumables/planets';
import { BossState } from '../models/BossState';

describe('天体卡包+望远镜集成测试', () => {
  let gameState: GameState;
  let bossState: BossState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    bossState = gameState.bossState;
  });

  it('望远镜应该能正确获取最常打出的牌型对应的星球牌', () => {
    // 模拟打出对子牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.HighCard);

    // 获取最常打出的牌型
    const mostPlayedHand = bossState.getMostPlayedHand();
    expect(mostPlayedHand).toBe(PokerHandType.OnePair);

    // 获取对应的星球牌
    const planet = getPlanetConsumableByHandType(mostPlayedHand!);
    expect(planet).toBeDefined();
    expect(planet?.id).toBe('planet_mercury');
    expect(planet?.name).toBe('水星');
  });

  it('不同牌型应该对应正确的星球牌', () => {
    const testCases = [
      { handType: PokerHandType.HighCard, expectedPlanetId: 'planet_pluto', expectedName: '冥王星' },
      { handType: PokerHandType.OnePair, expectedPlanetId: 'planet_mercury', expectedName: '水星' },
      { handType: PokerHandType.TwoPair, expectedPlanetId: 'planet_uranus', expectedName: '天王星' },
      { handType: PokerHandType.ThreeOfAKind, expectedPlanetId: 'planet_venus', expectedName: '金星' },
      { handType: PokerHandType.Straight, expectedPlanetId: 'planet_saturn', expectedName: '土星' },
      { handType: PokerHandType.Flush, expectedPlanetId: 'planet_jupiter', expectedName: '木星' },
      { handType: PokerHandType.FullHouse, expectedPlanetId: 'planet_earth', expectedName: '地球' },
      { handType: PokerHandType.FourOfAKind, expectedPlanetId: 'planet_mars', expectedName: '火星' },
      { handType: PokerHandType.StraightFlush, expectedPlanetId: 'planet_neptune', expectedName: '海王星' },
    ];

    for (const { handType, expectedPlanetId, expectedName } of testCases) {
      // 重置Boss状态
      bossState.onNewAnte();
      
      // 记录牌型
      bossState.recordHandPlayCount(handType);
      
      // 获取最常打出的牌型
      const mostPlayedHand = bossState.getMostPlayedHand();
      expect(mostPlayedHand).toBe(handType);

      // 获取对应的星球牌
      const planet = getPlanetConsumableByHandType(mostPlayedHand!);
      expect(planet).toBeDefined();
      expect(planet?.id).toBe(expectedPlanetId);
      expect(planet?.name).toBe(expectedName);
    }
  });

  it('没有打出任何牌型时，getMostPlayedHand应该返回null', () => {
    const mostPlayedHand = bossState.getMostPlayedHand();
    expect(mostPlayedHand).toBeNull();
  });

  it('新底注开始时应该重置牌型统计', () => {
    // 记录一些牌型
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    bossState.recordHandPlayCount(PokerHandType.OnePair);
    
    // 验证有最常打出的牌型
    expect(bossState.getMostPlayedHand()).toBe(PokerHandType.OnePair);

    // 新底注开始
    bossState.onNewAnte();

    // 验证重置了
    expect(bossState.getMostPlayedHand()).toBeNull();
  });
});
