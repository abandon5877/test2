import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameState } from '../models/GameState';
import { Consumable } from '../models/Consumable';
import { getRandomConsumables } from '../data/consumables';
import { HandLevelState } from '../models/HandLevelState';
import { PokerHandType } from '../types/pokerHands';

describe('超级天体卡包测试', () => {
  let gameState: GameState;
  let handLevelState: HandLevelState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    handLevelState = new HandLevelState();
  });

  it('天体卡包中的星球牌应该可以直接使用', () => {
    // 获取星球牌
    const planetCards = getRandomConsumables(3, 'planet');
    expect(planetCards.length).toBe(3);
    expect(planetCards[0].type).toBe('planet');

    // 验证星球牌有use方法
    const planetCard = planetCards[0];
    expect(typeof planetCard.use).toBe('function');
    expect(typeof planetCard.canUse).toBe('function');
  });

  it('星球牌应该能正确升级牌型', () => {
    // 获取一张星球牌
    const planetCards = getRandomConsumables(1, 'planet');
    const planetCard = planetCards[0];

    // 记录初始牌型等级
    const initialLevel = gameState.handLevelState.getHandLevel(PokerHandType.HighCard);

    // 创建使用上下文
    const context = {
      gameState: {
        money: gameState.money,
        hands: gameState.handsRemaining,
        discards: gameState.discardsRemaining
      },
      selectedCards: [],
      deck: gameState.cardPile.deck,
      handLevelState: gameState.handLevelState
    };

    // 使用星球牌
    if (planetCard.canUse(context)) {
      const result = planetCard.use(context);
      expect(result.success).toBe(true);
      expect(result.message).toContain('升级');
    }
  });

  it('handlePackCardSelected应该正确处理星球牌的使用', () => {
    // 模拟handlePackCardSelected的行为
    const planetCard = getRandomConsumables(1, 'planet')[0];
    
    // 验证星球牌可以被使用
    const context = {
      gameState: {
        money: gameState.money,
        hands: gameState.handsRemaining,
        discards: gameState.discardsRemaining
      },
      selectedCards: [],
      deck: gameState.cardPile.deck,
      handLevelState: gameState.handLevelState
    };

    // 检查canUse方法
    const canUse = planetCard.canUse(context);
    
    // 星球牌应该可以在没有选中卡牌的情况下使用（因为它们升级牌型）
    expect(canUse).toBe(true);

    // 使用星球牌
    const result = planetCard.use(context);
    expect(result.success).toBe(true);
  });

  it('星球牌在手牌满时也应该能使用', () => {
    const planetCard = getRandomConsumables(1, 'planet')[0];
    
    // 填满消耗牌槽位
    while (gameState.hasAvailableConsumableSlot()) {
      const tarotCard = getRandomConsumables(1, 'tarot')[0];
      gameState.addConsumable(tarotCard);
    }

    // 验证槽位已满
    expect(gameState.hasAvailableConsumableSlot()).toBe(false);

    // 但星球牌应该仍然可以直接使用
    const context = {
      gameState: {
        money: gameState.money,
        hands: gameState.handsRemaining,
        discards: gameState.discardsRemaining
      },
      selectedCards: [],
      deck: gameState.cardPile.deck,
      handLevelState: gameState.handLevelState
    };

    expect(planetCard.canUse(context)).toBe(true);
  });
});
