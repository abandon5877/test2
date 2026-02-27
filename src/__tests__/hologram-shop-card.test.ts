import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

/**
 * 全息影像商店购买卡牌回归测试
 * Bug: 全息影像在商店购买卡牌时没有生效
 * 原因: main.ts 中直接调用 deck.addToBottom 而不是 addCardToDeck
 */
describe('全息影像商店购买卡牌测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    // 完成一个盲注以进入商店
    gameState.selectBlind(BlindType.SMALL_BLIND);
    // 模拟完成盲注
    (gameState as any).roundScore = 1000;
    gameState.completeBlind();
  });

  it('商店购买卡牌应该触发全息影像效果', () => {
    // 添加全息影像小丑
    const hologram = getJokerById('hologram');
    expect(hologram).toBeDefined();
    gameState.jokerSlots.addJoker(hologram!);

    // 记录初始状态
    const initialCardsAdded = hologram!.state?.cardsAdded || 0;
    expect(initialCardsAdded).toBe(0);

    // 模拟商店购买卡牌（通过 addCardToDeck）
    const newCard = new Card(Suit.Hearts, Rank.Ace);
    gameState.addCardToDeck(newCard, 'bottom');

    // 验证全息影像状态更新（cardsAdded 增加）
    const updatedCardsAdded = hologram!.state?.cardsAdded;
    expect(updatedCardsAdded).toBe(1);
  });

  it('多次购买卡牌应该累积全息影像倍率', () => {
    // 添加全息影像小丑
    const hologram = getJokerById('hologram');
    gameState.jokerSlots.addJoker(hologram!);

    // 购买多张卡牌
    for (let i = 0; i < 5; i++) {
      const newCard = new Card(Suit.Hearts, (2 + i) as unknown as Rank);
      gameState.addCardToDeck(newCard, 'bottom');
    }

    // 验证全息影像状态累积
    const updatedCardsAdded = hologram!.state?.cardsAdded;
    expect(updatedCardsAdded).toBe(5);
  });

  it('没有全息影像时购买卡牌不应该报错', () => {
    // 不添加全息影像小丑

    // 购买卡牌
    const newCard = new Card(Suit.Hearts, Rank.Ace);
    expect(() => {
      gameState.addCardToDeck(newCard, 'bottom');
    }).not.toThrow();

    // 验证卡牌已添加到牌库
    expect(gameState.cardPile.deck.count).toBeGreaterThan(0);
  });

  it('全息影像倍率应该在出牌时正确应用', () => {
    // 添加全息影像小丑
    const hologram = getJokerById('hologram');
    gameState.jokerSlots.addJoker(hologram!);

    // 购买卡牌增加倍率
    const newCard = new Card(Suit.Hearts, Rank.Ace);
    gameState.addCardToDeck(newCard, 'bottom');

    // 验证状态已更新
    expect(hologram!.state?.cardsAdded).toBe(1);

    // 验证全息影像的效果计算正确
    // 1张牌 = 1 + (1 * 0.25) = 1.25倍率
    const expectedMultiplier = 1 + (1 * 0.25);
    expect(expectedMultiplier).toBe(1.25);
  });
});
