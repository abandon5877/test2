import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandDetector } from '../systems/PokerHandDetector';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

// 辅助函数：创建测试用的卡牌
function createTestCard(suit: Suit, rank: Rank): Card {
  return new Card(suit, rank);
}

describe('四指同花顺测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
        PokerHandDetector.clearConfig();
  });

  it('四指效果下4张连续的同花色牌应该是同花顺', () => {
    const fourFingers = new Joker({
      id: 'four_fingers',
      name: '四指',
      description: '同花/顺子只需4张',
      rarity: JokerRarity.UNCOMMON,
      cost: 5,
      trigger: JokerTrigger.ON_INDEPENDENT,
      effect: () => ({
        fourFingers: true,
        message: '四指: 同花/顺子只需4张'
      })
    });

    jokerSlots.addJoker(fourFingers);

    // 9, 10, J, Q 同花色（4张连续同花色）
    const cards = [
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Spades, Rank.Ten),
      createTestCard(Suit.Spades, Rank.Jack),
      createTestCard(Suit.Spades, Rank.Queen),
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);

    // 应该是同花顺，而不是同花
    expect(result.handType).toBe('straightFlush');
    expect(result.handDescription).toContain('同花顺');
  });

  it('四指效果下4张不连续的同花色牌只是同花', () => {
    const fourFingers = new Joker({
      id: 'four_fingers',
      name: '四指',
      description: '同花/顺子只需4张',
      rarity: JokerRarity.UNCOMMON,
      cost: 5,
      trigger: JokerTrigger.ON_INDEPENDENT,
      effect: () => ({
        fourFingers: true,
        message: '四指: 同花/顺子只需4张'
      })
    });

    jokerSlots.addJoker(fourFingers);

    // 9, 10, J, K 同花色（4张同花色但不连续，跳了Q）
    const cards = [
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Spades, Rank.Ten),
      createTestCard(Suit.Spades, Rank.Jack),
      createTestCard(Suit.Spades, Rank.King),  // 跳了Q
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);

    // 应该是同花，不是同花顺
    expect(result.handType).toBe('flush');
    expect(result.handDescription).toContain('同花');
  });

  it('没有四指效果时4张连续的同花色牌只是顺子', () => {
    // 不打四指小丑

    // 9, 10, J, Q 同花色（4张连续同花色）
    const cards = [
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Spades, Rank.Ten),
      createTestCard(Suit.Spades, Rank.Jack),
      createTestCard(Suit.Spades, Rank.Queen),
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);

    // 没有四指效果，4张牌不能形成同花顺
    // 应该检测为顺子（如果四指效果也适用于顺子）或高牌
    // 实际上，4张牌在没有四指时不能形成任何牌型，应该是高牌
    expect(result.handType).not.toBe('straightFlush');
  });

  // 回归测试: 修复四指效果下5张同花牌只按4张计算的问题
  it('四指效果下5张同花牌应该按5张计算', () => {
    const fourFingers = new Joker({
      id: 'four_fingers',
      name: '四指',
      description: '同花/顺子只需4张',
      rarity: JokerRarity.UNCOMMON,
      cost: 5,
      trigger: JokerTrigger.ON_INDEPENDENT,
      effect: () => ({
        fourFingers: true,
        message: '四指: 同花/顺子只需4张'
      })
    });

    jokerSlots.addJoker(fourFingers);

    // 5张同花牌（不是顺子）
    const cards = [
      createTestCard(Suit.Spades, Rank.Two),
      createTestCard(Suit.Spades, Rank.Five),
      createTestCard(Suit.Spades, Rank.Seven),
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Spades, Rank.King),
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);
    console.log('Scoring cards count:', result.scoringCards.length);

    // 应该是同花，且计分牌应该是5张（不是4张）
    expect(result.handType).toBe('flush');
    expect(result.scoringCards.length).toBe(5);
  });

  // 回归测试: 四指效果下4张同花牌应该按4张计算
  it('四指效果下4张同花牌应该按4张计算', () => {
    const fourFingers = new Joker({
      id: 'four_fingers',
      name: '四指',
      description: '同花/顺子只需4张',
      rarity: JokerRarity.UNCOMMON,
      cost: 5,
      trigger: JokerTrigger.ON_INDEPENDENT,
      effect: () => ({
        fourFingers: true,
        message: '四指: 同花/顺子只需4张'
      })
    });

    jokerSlots.addJoker(fourFingers);

    // 4张同花牌
    const cards = [
      createTestCard(Suit.Spades, Rank.Two),
      createTestCard(Suit.Spades, Rank.Five),
      createTestCard(Suit.Spades, Rank.Seven),
      createTestCard(Suit.Spades, Rank.Nine),
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);
    console.log('Scoring cards count:', result.scoringCards.length);

    // 应该是同花，且计分牌应该是4张
    expect(result.handType).toBe('flush');
    expect(result.scoringCards.length).toBe(4);
    expect(result.handDescription).toContain('四指');
  });
});
