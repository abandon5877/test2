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

describe('水花+四指测试', () => {
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    PokerHandDetector.clearConfig();
  });

  it('四指+水花: 4张同花+1张单牌应该全部计分', () => {
    // 四指小丑
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

    // 水花小丑
    const splash = new Joker({
      id: 'splash',
      name: '水花',
      description: '打出的每一张牌都将被记分',
      rarity: JokerRarity.COMMON,
      cost: 3,
      trigger: JokerTrigger.ON_INDEPENDENT,
      effect: () => ({
        allCardsScore: true,
        message: '水花: 所有打出牌计分'
      })
    });

    jokerSlots.addJoker(fourFingers);
    jokerSlots.addJoker(splash);

    // 4张黑桃同花（不连续，避免被识别为同花顺） + 1张红桃A（单牌）
    const cards = [
      createTestCard(Suit.Spades, Rank.Two),
      createTestCard(Suit.Spades, Rank.Five),
      createTestCard(Suit.Spades, Rank.Seven),
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Hearts, Rank.Ace),  // 这张应该也计分
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Hand description:', result.handDescription);
    console.log('Scoring cards count:', result.scoringCards.length);
    console.log('Kickers count:', result.kickers.length);
    console.log('All cards score:', result.allCardsScore);
    console.log('Card details:');
    for (const detail of result.cardDetails) {
      console.log(`  ${detail.card}: ${detail.baseChips}筹码, 加成: ${detail.chipBonus}筹码 ${detail.multBonus}倍率`);
    }
    console.log('Total chips:', result.totalChips);
    console.log('Total mult:', result.totalMultiplier);
    console.log('Total score:', result.totalScore);

    // 验证是同花
    expect(result.handType).toBe('flush');

    // 验证水花效果生效
    expect(result.allCardsScore).toBe(true);

    // 验证所有5张牌都计分（4张同花 + 1张踢牌）
    // 水花效果下，踢牌也应该被加入计分
    expect(result.scoringCards.length).toBe(5);

    // 验证总筹码包含所有5张牌的贡献
    // 基础筹码35 + 2+5+7+9的筹码值 + A的筹码值
    // 2=2, 5=5, 7=7, 9=9, A=11
    // 基础35 + 2+5+7+9+11 = 35 + 34 = 69
    expect(result.totalChips).toBeGreaterThanOrEqual(69);
  });

  it('只有四指没有水花: 4张同花+1张单牌，单牌不应计分', () => {
    // 只有四指小丑
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

    // 4张黑桃同花（不连续） + 1张红桃A（单牌）
    const cards = [
      createTestCard(Suit.Spades, Rank.Two),
      createTestCard(Suit.Spades, Rank.Five),
      createTestCard(Suit.Spades, Rank.Seven),
      createTestCard(Suit.Spades, Rank.Nine),
      createTestCard(Suit.Hearts, Rank.Ace),  // 这张是踢牌，不应计分
    ];

    const result = ScoringSystem.calculate(cards, undefined, undefined, undefined, jokerSlots);

    console.log('Hand type:', result.handType);
    console.log('Scoring cards count:', result.scoringCards.length);
    console.log('Kickers count:', result.kickers.length);
    console.log('All cards score:', result.allCardsScore);

    // 验证是同花
    expect(result.handType).toBe('flush');

    // 验证水花效果未生效
    expect(result.allCardsScore).toBe(false);

    // 验证只有4张同花牌计分，踢牌不计分
    expect(result.scoringCards.length).toBe(4);
    expect(result.kickers.length).toBe(1);
  });
});
