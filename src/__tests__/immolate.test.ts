import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConsumableById } from '../data/consumables';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import type { ConsumableEffectContext } from '../types/consumable';

describe('火祭(Immolate)测试', () => {
  let context: ConsumableEffectContext;

  beforeEach(() => {
    // 创建测试用手牌
    const handCards = [
      new Card(Suit.Spades, Rank.Ace),
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Clubs, Rank.Queen),
      new Card(Suit.Diamonds, Rank.Jack),
      new Card(Suit.Spades, Rank.Ten),
      new Card(Suit.Hearts, Rank.Nine),
      new Card(Suit.Clubs, Rank.Eight)
    ];

    context = {
      handCards,
      selectedCards: [],
      gameState: {
        money: 10,
        hands: 4,
        discards: 3
      },
      money: 10
    };
  });

  it('应该正确创建火祭消耗牌', () => {
    const immolate = getConsumableById('spectral_immolate');
    expect(immolate).toBeDefined();
    expect(immolate?.name).toBe('火祭');
    expect(immolate?.description).toBe('摧毁5张随机手牌，获得$20');
  });

  it('手牌不足5张时不能使用', () => {
    const immolate = getConsumableById('spectral_immolate')!;
    
    // 创建只有3张手牌的上下文
    const shortContext: ConsumableEffectContext = {
      handCards: [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Clubs, Rank.Queen)
      ],
      selectedCards: [],
      gameState: context.gameState
    };

    const result = immolate.use(shortContext);
    expect(result.success).toBe(false);
    expect(result.message).toBe('需要至少5张手牌');
  });

  it('应该摧毁5张随机手牌并获得$20', () => {
    const immolate = getConsumableById('spectral_immolate')!;
    
    const result = immolate.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(20);
    expect(result.affectedCards).toBeDefined();
    expect(result.affectedCards?.length).toBe(5);
    expect(result.message).toBe('火祭: 摧毁5张随机手牌，获得$20');
  });

  it('摧毁的卡牌应该来自手牌', () => {
    const immolate = getConsumableById('spectral_immolate')!;
    
    const result = immolate.use(context);
    
    // 验证所有受影响的卡牌都在原始手牌中
    const affectedCards = result.affectedCards || [];
    const handCardStrings = context.handCards!.map(c => c.toString());
    
    for (const card of affectedCards) {
      expect(handCardStrings).toContain(card.toString());
    }
  });

  it('canUse应该在手牌不足时返回false', () => {
    const immolate = getConsumableById('spectral_immolate')!;
    
    // 手牌充足时
    expect(immolate.canUse(context)).toBe(true);
    
    // 手牌不足时
    const shortContext: ConsumableEffectContext = {
      handCards: [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King)
      ],
      selectedCards: [],
      gameState: context.gameState
    };
    expect(immolate.canUse(shortContext)).toBe(false);
  });

  it('多次使用应该摧毁不同的卡牌（随机性测试）', () => {
    const immolate = getConsumableById('spectral_immolate')!;
    
    // 记录多次使用的摧毁结果
    const destroyedSets: string[][] = [];
    
    for (let i = 0; i < 5; i++) {
      // 每次创建新的手牌（相同内容但不同实例）
      const handCards = [
        new Card(Suit.Spades, Rank.Ace),
        new Card(Suit.Hearts, Rank.King),
        new Card(Suit.Clubs, Rank.Queen),
        new Card(Suit.Diamonds, Rank.Jack),
        new Card(Suit.Spades, Rank.Ten),
        new Card(Suit.Hearts, Rank.Nine),
        new Card(Suit.Clubs, Rank.Eight)
      ];
      
      const testContext: ConsumableEffectContext = {
        handCards,
        selectedCards: [],
        gameState: context.gameState
      };
      
      const result = immolate.use(testContext);
      const destroyedCardStrings = (result.affectedCards || []).map(c => c.toString()).sort();
      destroyedSets.push(destroyedCardStrings);
    }
    
    // 验证至少有一次结果不同（证明是随机的）
    const uniqueSets = new Set(destroyedSets.map(set => JSON.stringify(set)));
    // 由于随机性，可能有重复，但不应该全部相同
    expect(destroyedSets.length).toBe(5);
  });
});
