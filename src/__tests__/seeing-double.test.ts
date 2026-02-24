import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

describe('重影 (Seeing Double) 小丑牌测试', () => {
  it('应该正确检测梅花+其他花色', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 创建包含梅花和其他花色的牌
    const clubCard = new Card(Suit.Clubs, Rank.Ace);
    const heartCard = new Card(Suit.Hearts, Rank.King);
    const scoredCards = [clubCard, heartCard];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.HighCard,
      10,
      1
    );

    // 应该触发 x2 倍率
    expect(result.multMultiplier).toBe(2);
    expect(result.effects.some(e => e.jokerName === '重影')).toBe(true);
  });

  it('只有梅花时不应触发', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 只有梅花
    const clubCard1 = new Card(Suit.Clubs, Rank.Ace);
    const clubCard2 = new Card(Suit.Clubs, Rank.King);
    const scoredCards = [clubCard1, clubCard2];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.HighCard,
      10,
      1
    );

    // 不应触发
    expect(result.multMultiplier).toBe(1);
    expect(result.effects.some(e => e.jokerName === '重影')).toBe(false);
  });

  it('只有其他花色（无梅花）时不应触发', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 只有红桃和方片（无梅花）
    const heartCard = new Card(Suit.Hearts, Rank.Ace);
    const diamondCard = new Card(Suit.Diamonds, Rank.King);
    const scoredCards = [heartCard, diamondCard];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.HighCard,
      10,
      1
    );

    // 不应触发
    expect(result.multMultiplier).toBe(1);
    expect(result.effects.some(e => e.jokerName === '重影')).toBe(false);
  });

  it('有模糊小丑时，黑色+红色牌应该触发', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    const smearedJoker = getJokerById('smeared_joker');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);
    if (smearedJoker) jokerSlots.addJoker(smearedJoker);

    // 黑桃（黑色）+ 红桃（红色）
    const spadeCard = new Card(Suit.Spades, Rank.Ace);
    const heartCard = new Card(Suit.Hearts, Rank.King);
    const scoredCards = [spadeCard, heartCard];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.HighCard,
      10,
      1
    );

    // 应该触发 x2 倍率（模糊小丑激活时）
    expect(result.multMultiplier).toBe(2);
    expect(result.effects.some(e => e.jokerName === '重影')).toBe(true);
  });

  it('单张牌时不应触发（需要至少2张牌）', () => {
    const jokerSlots = new JokerSlots(5);
    const seeingDouble = getJokerById('seeing_double');
    if (seeingDouble) jokerSlots.addJoker(seeingDouble);

    // 只有一张牌
    const clubCard = new Card(Suit.Clubs, Rank.Ace);
    const scoredCards = [clubCard];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.HighCard,
      10,
      1
    );

    // 不应触发（需要至少2张牌）
    expect(result.multMultiplier).toBe(1);
    expect(result.effects.some(e => e.jokerName === '重影')).toBe(false);
  });
});
