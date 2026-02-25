import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank, SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { BlindType, GamePhase } from '../types/game';

describe('蓝色蜡封集成测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  it('回合结束时手牌中的蓝色蜡封应该生成星球牌', () => {
    // 设置游戏状态为游戏中
    gameState['phase'] = GamePhase.PLAYING;
    gameState['currentBlind'] = {
      type: BlindType.SMALL_BLIND,
      name: '小盲注',
      targetScore: 300,
      reward: 3,
      bossType: undefined,
      canSkipBlind: () => true,
      getSkipReward: () => 0
    } as any;
    gameState['roundScore'] = 500; // 确保超过目标分数

    // 设置最后打出的牌型
    gameState['lastPlayedHandType'] = PokerHandType.OnePair;

    // 获取当前手牌并清空
    const handCards = gameState.getHandCards();
    
    // 创建带蓝色蜡封的卡牌并添加到手牌
    const blueSealCard = new Card(Suit.Spades, Rank.Ace);
    blueSealCard.seal = SealType.Blue;
    
    // 直接修改手牌（通过内部引用）
    const hand = gameState['cardPile'].hand;
    hand.clear();
    hand.addCard(blueSealCard);

    // 记录生成前的消耗牌数量
    const initialConsumableCount = gameState.getConsumableCount();

    // 调用 completeBlind
    gameState.completeBlind();

    // 验证是否生成了星球牌
    const finalConsumableCount = gameState.getConsumableCount();
    expect(finalConsumableCount).toBe(initialConsumableCount + 1);
  });

  it('多张蓝色蜡封应该生成多张星球牌', () => {
    // 设置游戏状态为游戏中
    gameState['phase'] = GamePhase.PLAYING;
    gameState['currentBlind'] = {
      type: BlindType.SMALL_BLIND,
      name: '小盲注',
      targetScore: 300,
      reward: 3,
      bossType: undefined,
      canSkipBlind: () => true,
      getSkipReward: () => 0
    } as any;
    gameState['roundScore'] = 500;
    gameState['lastPlayedHandType'] = PokerHandType.TwoPair;

    // 创建多张带蓝色蜡封的卡牌
    const blueSealCard1 = new Card(Suit.Spades, Rank.Ace);
    blueSealCard1.seal = SealType.Blue;
    const blueSealCard2 = new Card(Suit.Hearts, Rank.King);
    blueSealCard2.seal = SealType.Blue;
    
    const hand = gameState['cardPile'].hand;
    hand.clear();
    hand.addCard(blueSealCard1);
    hand.addCard(blueSealCard2);

    const initialConsumableCount = gameState.getConsumableCount();

    gameState.completeBlind();

    const finalConsumableCount = gameState.getConsumableCount();
    expect(finalConsumableCount).toBe(initialConsumableCount + 2);
  });

  it('没有最后出牌牌型时不应生成星球牌', () => {
    // 设置游戏状态为游戏中
    gameState['phase'] = GamePhase.PLAYING;
    gameState['currentBlind'] = {
      type: BlindType.SMALL_BLIND,
      name: '小盲注',
      targetScore: 300,
      reward: 3,
      bossType: undefined,
      canSkipBlind: () => true,
      getSkipReward: () => 0
    } as any;
    gameState['roundScore'] = 500;
    
    // 不设置 lastPlayedHandType
    gameState['lastPlayedHandType'] = null;

    const blueSealCard = new Card(Suit.Spades, Rank.Ace);
    blueSealCard.seal = SealType.Blue;
    
    const hand = gameState['cardPile'].hand;
    hand.clear();
    hand.addCard(blueSealCard);

    const initialConsumableCount = gameState.getConsumableCount();

    gameState.completeBlind();

    const finalConsumableCount = gameState.getConsumableCount();
    // 没有 lastPlayedHandType，不应生成星球牌
    expect(finalConsumableCount).toBe(initialConsumableCount);
  });

  it('消耗品槽位满时不应生成星球牌', () => {
    // 设置游戏状态为游戏中
    gameState['phase'] = GamePhase.PLAYING;
    gameState['currentBlind'] = {
      type: BlindType.SMALL_BLIND,
      name: '小盲注',
      targetScore: 300,
      reward: 3,
      bossType: undefined,
      canSkipBlind: () => true,
      getSkipReward: () => 0
    } as any;
    gameState['roundScore'] = 500;
    gameState['lastPlayedHandType'] = PokerHandType.OnePair;

    // 填满消耗品槽位
    const maxSlots = gameState.getConsumableSlots().getMaxSlots();
    for (let i = 0; i < maxSlots; i++) {
      // 添加虚拟消耗牌填满槽位
      const mockConsumable = {
        id: `mock-${i}`,
        name: `Mock ${i}`,
        description: 'Mock consumable',
        type: 'tarot',
        cost: 1,
        isNegative: false,
        getSellPrice: () => 1,
        increaseSellValue: () => {},
        clone: function() { return this; }
      } as any;
      gameState.addConsumable(mockConsumable);
    }

    const blueSealCard = new Card(Suit.Spades, Rank.Ace);
    blueSealCard.seal = SealType.Blue;
    
    const hand = gameState['cardPile'].hand;
    hand.clear();
    hand.addCard(blueSealCard);

    const initialConsumableCount = gameState.getConsumableCount();

    gameState.completeBlind();

    const finalConsumableCount = gameState.getConsumableCount();
    // 槽位已满，不应生成星球牌
    expect(finalConsumableCount).toBe(initialConsumableCount);
  });
});
