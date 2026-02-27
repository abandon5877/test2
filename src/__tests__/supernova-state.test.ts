import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

/**
 * 超新星状态更新测试
 * 验证超新星的stateUpdate是否正确更新
 */
describe('Supernova 超新星状态更新测试', () => {
  it('出牌后应该更新lastHandTypeHistoryCount状态', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    // 初始状态应该没有lastHandTypeHistoryCount
    expect(supernova.state.lastHandTypeHistoryCount).toBeUndefined();

    // 模拟出牌：对子，历史次数为3
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0,
      undefined, // gameState
      0, // handsPlayed
      undefined, // discardsUsed
      undefined, // deckSize
      undefined, // initialDeckSize
      undefined, // handsRemaining
      undefined, // mostPlayedHand
      undefined, // consumableSlots
      3 // handTypeHistoryCount（历史次数为3）
    );

    // 验证效果
    expect(result.multBonus).toBe(3);
    
    // 验证状态已更新
    expect(supernova.state.lastHandTypeHistoryCount).toBe(3);
  });

  it('预览模式不应该更新状态', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    // 先设置一个初始状态
    supernova.updateState({ lastHandTypeHistoryCount: 5 });
    expect(supernova.state.lastHandTypeHistoryCount).toBe(5);

    // 模拟预览出牌：历史次数为3
    const scoredCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
    ];

    const result = JokerSystem.processHandPlayed(
      jokerSlots,
      scoredCards,
      PokerHandType.OnePair,
      0,
      0,
      undefined,
      0,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      3,
      true // isPreview = true（预览模式）
    );

    // 验证效果计算正确
    expect(result.multBonus).toBe(3);
    
    // 验证状态没有被更新（仍然是5，不是3）
    expect(supernova.state.lastHandTypeHistoryCount).toBe(5);
  });

  it('动态说明应该反映当前状态', () => {
    const jokerSlots = new JokerSlots(5);
    const supernova = getJokerById('supernova')!;
    jokerSlots.addJoker(supernova);

    // 初始状态 - 没有值
    expect(supernova.getDynamicDescription()).toBe('本局该牌型每出过1次+1倍率');

    // 设置状态为0（显示基础说明，不显示"未出过"）
    supernova.updateState({ lastHandTypeHistoryCount: 0 });
    expect(supernova.getDynamicDescription()).toBe('本局该牌型每出过1次+1倍率');

    // 设置状态为5
    supernova.updateState({ lastHandTypeHistoryCount: 5 });
    expect(supernova.getDynamicDescription()).toBe('本局该牌型每出过1次+1倍率（该牌型已出过5次，+5倍率）');
  });
});
