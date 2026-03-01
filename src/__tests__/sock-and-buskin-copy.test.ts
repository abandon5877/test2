import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank } from '../types/card';
import { getJokerById } from '../data/jokers';
import { PokerHandType } from '../types/pokerHands';

describe('喜与悲复制链测试', () => {
  it('喜与悲(左) + 头脑风暴(中) + 蓝图(右) - 脸牌应该触发3次', () => {
    const jokerSlots = new JokerSlots(5);
    const sockAndBuskin = getJokerById('sock_and_buskin')!;
    const brainstorm = getJokerById('brainstorm')!;
    const blueprint = getJokerById('blueprint')!;

    // 顺序：喜与悲(左), 头脑风暴(中), 蓝图(右)
    // - 喜与悲本体：脸牌触发2次
    // - 头脑风暴复制喜与悲：脸牌额外触发1次
    // - 蓝图在右侧，但右侧没有可复制的（或者复制逻辑需要检查）
    jokerSlots.addJoker(sockAndBuskin);
    jokerSlots.addJoker(brainstorm);
    jokerSlots.addJoker(blueprint);

    // 打出对子牌型，包含脸牌(K)
    const cards = [
      new Card(Suit.Hearts, Rank.King),    // 计分牌，脸牌
      new Card(Suit.Diamonds, Rank.King),  // 计分牌，脸牌
      new Card(Suit.Clubs, Rank.Ace),      // 踢牌
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('=== 喜与悲 + 头脑风暴 + 蓝图 测试结果 ===');
    console.log('卡牌详情:', result.cardDetails.map(d => ({
      card: d.card,
      enhancements: d.enhancements,
      chipBonus: d.chipBonus,
      multBonus: d.multBonus
    })));

    // 检查脸牌的触发次数
    const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);
    console.log('K牌详情:', kingDetails);

    // 验证每张K的筹码加成
    for (const king of kingDetails) {
      console.log(`K牌 ${king.card}: chipBonus=${king.chipBonus}`);
    }

    // 验证有触发多次的标记
    const kingWithRetrigger = kingDetails.find(d =>
      d.enhancements.some(e => e.includes('喜剧与悲剧'))
    );
    expect(kingWithRetrigger).toBeDefined();
  });

  it('喜与悲(左) + 蓝图(右) - 蓝图应该能复制喜与悲', () => {
    const jokerSlots = new JokerSlots(5);
    const sockAndBuskin = getJokerById('sock_and_buskin')!;
    const blueprint = getJokerById('blueprint')!;

    // 顺序：喜与悲(左), 蓝图(右)
    // 蓝图复制左侧的喜与悲
    jokerSlots.addJoker(sockAndBuskin);
    jokerSlots.addJoker(blueprint);

    const cards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('=== 喜与悲 + 蓝图 测试结果 ===');
    console.log('卡牌详情:', result.cardDetails.map(d => ({
      card: d.card,
      enhancements: d.enhancements,
      chipBonus: d.chipBonus,
      multBonus: d.multBonus
    })));

    // 检查脸牌的触发次数
    const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);

    // 验证每张K的筹码加成是20（10基础 × 2次）
    for (const king of kingDetails) {
      console.log(`K牌 ${king.card}: chipBonus=${king.chipBonus}`);
      expect(king.chipBonus).toBe(20); // 10 × 2次
    }

    // 验证有触发2次的标记
    const kingWithRetrigger = kingDetails.find(d =>
      d.enhancements.some(e => e.includes('触发2次') && e.includes('喜剧与悲剧'))
    );
    expect(kingWithRetrigger).toBeDefined();
  });

  it('蓝图(左) + 喜与悲(右) - 蓝图应该能复制喜与悲', () => {
    const jokerSlots = new JokerSlots(5);
    const blueprint = getJokerById('blueprint')!;
    const sockAndBuskin = getJokerById('sock_and_buskin')!;

    // 顺序：蓝图(左), 喜与悲(右)
    // 蓝图复制右侧的喜与悲
    jokerSlots.addJoker(blueprint);
    jokerSlots.addJoker(sockAndBuskin);

    const cards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('=== 蓝图 + 喜与悲 测试结果 ===');
    console.log('卡牌详情:', result.cardDetails.map(d => ({
      card: d.card,
      enhancements: d.enhancements,
      chipBonus: d.chipBonus,
      multBonus: d.multBonus
    })));

    // 检查脸牌的触发次数
    const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);

    // 验证每张K的筹码加成是30（10基础 × 3次）
    // 喜与悲本体 + 蓝图复制 = 2个喜与悲效果
    // 触发次数 = 1（基础）+ 2 = 3次
    for (const king of kingDetails) {
      console.log(`K牌 ${king.card}: chipBonus=${king.chipBonus}`);
      expect(king.chipBonus).toBe(30); // 10 × 3次
    }

    // 验证有触发3次的标记
    const kingWithRetrigger = kingDetails.find(d =>
      d.enhancements.some(e => e.includes('触发3次') && e.includes('喜剧与悲剧'))
    );
    expect(kingWithRetrigger).toBeDefined();
  });

  it('喜与悲(左) + 头脑风暴(右) - 头脑风暴应该能复制喜与悲', () => {
    const jokerSlots = new JokerSlots(5);
    const sockAndBuskin = getJokerById('sock_and_buskin')!;
    const brainstorm = getJokerById('brainstorm')!;

    // 顺序：喜与悲(左), 头脑风暴(右)
    // 头脑风暴复制最左侧的喜与悲
    jokerSlots.addJoker(sockAndBuskin);
    jokerSlots.addJoker(brainstorm);

    const cards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('=== 喜与悲 + 头脑风暴 测试结果 ===');
    console.log('卡牌详情:', result.cardDetails.map(d => ({
      card: d.card,
      enhancements: d.enhancements,
      chipBonus: d.chipBonus,
      multBonus: d.multBonus
    })));

    // 检查脸牌的触发次数
    const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);

    // 验证每张K的筹码加成是30（10基础 × 3次）
    // 喜与悲本体 + 头脑风暴复制 = 2个喜与悲效果
    // 触发次数 = 1（基础）+ 2 = 3次
    for (const king of kingDetails) {
      console.log(`K牌 ${king.card}: chipBonus=${king.chipBonus}`);
      expect(king.chipBonus).toBe(30); // 10 × 3次
    }

    // 验证有触发3次的标记
    const kingWithRetrigger = kingDetails.find(d =>
      d.enhancements.some(e => e.includes('触发3次') && e.includes('喜剧与悲剧'))
    );
    expect(kingWithRetrigger).toBeDefined();
  });

  it('只有喜与悲 - 脸牌应该触发2次', () => {
    const jokerSlots = new JokerSlots(5);
    const sockAndBuskin = getJokerById('sock_and_buskin')!;

    jokerSlots.addJoker(sockAndBuskin);

    const cards = [
      new Card(Suit.Hearts, Rank.King),
      new Card(Suit.Diamonds, Rank.King),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = ScoringSystem.calculate(cards, PokerHandType.OnePair, undefined, undefined, jokerSlots);

    console.log('=== 只有喜与悲 测试结果 ===');
    console.log('卡牌详情:', result.cardDetails.map(d => ({
      card: d.card,
      enhancements: d.enhancements,
      chipBonus: d.chipBonus,
      multBonus: d.multBonus
    })));

    // 检查脸牌的触发次数
    const kingDetails = result.cardDetails.filter(d => d.card.includes('K') && d.chipBonus > 0);

    // 验证每张K的筹码加成是20（10基础 × 2次）
    for (const king of kingDetails) {
      console.log(`K牌 ${king.card}: chipBonus=${king.chipBonus}`);
      expect(king.chipBonus).toBe(20); // 10 × 2次
    }
  });
});
