import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType } from '../types/game';
import { getConsumableById } from '../data/consumables';
import { ConsumableHelper } from '../utils/consumableHelper';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

/**
 * 使魔突破手牌上限回归测试
 * Bug: 使魔这类加入手牌的应该可以突破上限
 * 原因: Hand.addCard 方法在手牌满时返回 false，不添加卡牌
 */
describe('使魔突破手牌上限测试', () => {
  let gameState: GameState;
  let consumableHelper: ConsumableHelper;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    consumableHelper = new ConsumableHelper(gameState);
  });

  // 辅助函数：填充手牌到上限
  const fillHandToMax = () => {
    const maxSize = gameState.cardPile.hand.maxHandSize;
    const currentSize = gameState.cardPile.hand.count;
    const cardsNeeded = maxSize - currentSize;

    for (let i = 0; i < cardsNeeded; i++) {
      const card = new Card(Suit.Hearts, Rank.Two);
      gameState.cardPile.hand.forceAddCard(card);
    }

    expect(gameState.cardPile.hand.count).toBe(maxSize);
    expect(gameState.cardPile.hand.isFull()).toBe(true);
  };

  // 辅助函数：添加幻灵牌到槽位并返回索引
  const addSpectralToSlot = (id: string): number => {
    const consumable = getConsumableById(id);
    expect(consumable).toBeDefined();
    const added = gameState.addConsumable(consumable!);
    expect(added).toBe(true);
    return gameState.consumables.length - 1; // 返回最后添加的索引
  };

  it('使魔应该可以突破手牌上限', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 添加使魔幻灵牌到槽位
    const index = addSpectralToSlot('spectral_familiar');

    // 使用使魔（摧毁1张手牌，添加3张增强人头牌）
    consumableHelper.useConsumable(index);

    // 验证手牌数量超过上限
    // 使魔摧毁1张，添加3张，净增加2张
    expect(gameState.cardPile.hand.count).toBe(maxSize + 2);
  });

  it('冷酷应该可以突破手牌上限', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 添加冷酷幻灵牌到槽位
    const index = addSpectralToSlot('spectral_grim');

    // 使用冷酷（摧毁1张手牌，添加2张增强A）
    consumableHelper.useConsumable(index);

    // 验证手牌数量超过上限
    // 冷酷摧毁1张，添加2张，净增加1张
    expect(gameState.cardPile.hand.count).toBe(maxSize + 1);
  });

  it('咒语应该可以突破手牌上限', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 添加咒语幻灵牌到槽位
    const index = addSpectralToSlot('spectral_incantation');

    // 使用咒语（摧毁1张手牌，添加4张削弱2）
    consumableHelper.useConsumable(index);

    // 验证手牌数量超过上限
    // 咒语摧毁1张，添加4张，净增加3张
    expect(gameState.cardPile.hand.count).toBe(maxSize + 3);
  });

  it('普通抽牌不应该突破手牌上限', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 尝试使用普通 addCard 方法添加卡牌
    const card = new Card(Suit.Hearts, Rank.Two);
    const result = gameState.cardPile.hand.addCard(card);

    // 验证添加失败
    expect(result).toBe(false);
    expect(gameState.cardPile.hand.count).toBe(maxSize);
  });

  it('forceAddCard 方法应该可以突破手牌上限', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 使用 forceAddCard 方法添加卡牌
    const card = new Card(Suit.Hearts, Rank.Two);
    gameState.cardPile.hand.forceAddCard(card);

    // 验证手牌数量超过上限
    expect(gameState.cardPile.hand.count).toBe(maxSize + 1);
  });

  it('突破上限后应该可以正常出牌', () => {
    // 填充手牌到上限
    fillHandToMax();
    const maxSize = gameState.cardPile.hand.maxHandSize;

    // 添加使魔突破上限
    const index = addSpectralToSlot('spectral_familiar');
    consumableHelper.useConsumable(index);

    const newSize = gameState.cardPile.hand.count;
    expect(newSize).toBeGreaterThan(maxSize);

    // 选择前5张手牌（最多只能选择5张）
    const cardsToSelect = Math.min(newSize, 5);
    for (let i = 0; i < cardsToSelect; i++) {
      gameState.cardPile.hand.selectCard(i);
    }

    // 验证可以选择的牌数（最多5张）
    expect(gameState.cardPile.hand.getSelectionCount()).toBe(cardsToSelect);
  });
});
