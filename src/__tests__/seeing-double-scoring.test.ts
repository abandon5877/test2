import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { ScoringSystem } from '../systems/ScoringSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

describe('重影 (Seeing Double) 计分系统测试', () => {
  it('通过 ScoringSystem 计算时应该正确触发', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 创建包含梅花和其他花色的牌
    const clubCard = new Card(Suit.Clubs, Rank.Ace);
    const heartCard = new Card(Suit.Hearts, Rank.King);
    const scoredCards = [clubCard, heartCard];

    // 使用 ScoringSystem.calculate 计算分数（模拟实际游戏流程）
    const result = ScoringSystem.calculate(
      scoredCards,
      undefined, // handType
      undefined, // gameState
      [], // heldCards
      jokerSlots,
      52, // deckSize
      52, // initialDeckSize
      0, // handsPlayed
      0, // discardsUsed
      4 // handsRemaining
    );

    console.log('计分结果:', {
      totalScore: result.totalScore,
      handType: result.handType,
      jokerEffects: result.jokerEffects,
      totalMultiplier: result.totalMultiplier
    });

    // 检查是否有重影的效果
    const hasSeeingDoubleEffect = (result.jokerEffects || []).some(
      e => e.jokerName === '重影' || e.effect?.includes('重影')
    );
    
    expect(hasSeeingDoubleEffect).toBe(true);
    // 重影提供 x2 倍率，所以总倍率应该包含这个乘数
    // 基础倍率是 1，重影 x2 后应该是 2
    expect(result.totalMultiplier).toBeGreaterThanOrEqual(2);
  });

  it('只有梅花时不应触发', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 只有梅花
    const clubCard1 = new Card(Suit.Clubs, Rank.Ace);
    const clubCard2 = new Card(Suit.Clubs, Rank.King);
    const scoredCards = [clubCard1, clubCard2];

    const result = ScoringSystem.calculate(
      scoredCards,
      undefined,
      undefined,
      [],
      jokerSlots,
      52,
      52,
      0,
      0,
      4
    );

    const hasSeeingDoubleEffect = (result.jokerEffects || []).some(
      e => e.jokerName === '重影' || e.effect?.includes('重影')
    );
    
    expect(hasSeeingDoubleEffect).toBe(false);
  });
});
