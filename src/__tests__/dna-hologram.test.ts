import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { JokerSystem } from '../systems/JokerSystem';

/**
 * DNA + 全息影像组合测试
 * 验证DNA复制的牌能正确触发全息影像效果
 */
describe('DNA + 全息影像组合测试', () => {
  it('DNA复制的牌应该触发全息影像效果', () => {
    // 创建游戏状态
    const gameState = new GameState();
    gameState.startNewGame();

    // 添加DNA和全息影像小丑
    const dna = getJokerById('dna');
    const hologram = getJokerById('hologram');
    expect(dna).toBeDefined();
    expect(hologram).toBeDefined();
    
    gameState.jokerSlots.addJoker(dna!);
    gameState.jokerSlots.addJoker(hologram!);

    // 记录初始状态
    const initialCardsAdded = hologram!.state?.cardsAdded || 0;
    expect(initialCardsAdded).toBe(0);

    // 创建一张卡牌
    const card = new Card(Suit.Hearts, Rank.Ace);
    
    // 直接调用 addCardToDeck 模拟DNA复制效果
    // 这是DNA效果实际调用的方法
    gameState.addCardToDeck(card, 'bottom');

    // 验证全息影像状态已更新
    const updatedCardsAdded = hologram!.state?.cardsAdded;
    expect(updatedCardsAdded).toBe(1);
  });

  it('DNA多次复制应该累积全息影像倍率', () => {
    const gameState = new GameState();
    gameState.startNewGame();

    // 添加DNA和全息影像小丑
    const dna = getJokerById('dna');
    const hologram = getJokerById('hologram');
    gameState.jokerSlots.addJoker(dna!);
    gameState.jokerSlots.addJoker(hologram!);

    // 复制多张卡牌
    for (let i = 0; i < 5; i++) {
      const card = new Card(Suit.Hearts, (2 + i) as unknown as Rank);
      gameState.addCardToDeck(card, 'bottom');
    }

    // 验证全息影像状态累积
    expect(hologram!.state?.cardsAdded).toBe(5);
  });

  it('蓝图+DNA组合应该触发多次全息影像效果', () => {
    const gameState = new GameState();
    gameState.startNewGame();

    // 添加蓝图、DNA和全息影像小丑
    const blueprint = getJokerById('blueprint');
    const dna = getJokerById('dna');
    const hologram = getJokerById('hologram');
    expect(blueprint).toBeDefined();
    
    gameState.jokerSlots.addJoker(blueprint!);
    gameState.jokerSlots.addJoker(dna!);
    gameState.jokerSlots.addJoker(hologram!);

    // 记录初始状态
    const initialCardsAdded = hologram!.state?.cardsAdded || 0;

    // 创建一张卡牌
    const card = new Card(Suit.Hearts, Rank.Ace);
    
    // 使用JokerSystem.processCardAdded来模拟DNA+蓝图效果
    // 蓝图会复制DNA的效果，导致复制2张牌
    const result = JokerSystem.processCardAdded(gameState.jokerSlots, card);
    
    // 验证效果被触发
    expect(result.effects.length).toBeGreaterThan(0);
    
    // 验证全息影像状态已更新（至少增加了）
    const updatedCardsAdded = hologram!.state?.cardsAdded;
    expect(updatedCardsAdded).toBeGreaterThan(initialCardsAdded);
  });

  it('没有全息影像时DNA复制不应该报错', () => {
    const gameState = new GameState();
    gameState.startNewGame();

    // 只添加DNA，不添加全息影像
    const dna = getJokerById('dna');
    gameState.jokerSlots.addJoker(dna!);

    // 复制卡牌
    const card = new Card(Suit.Hearts, Rank.Ace);
    
    // 不应该报错
    expect(() => {
      gameState.addCardToDeck(card, 'bottom');
    }).not.toThrow();

    // 验证牌库中已有复制的牌
    expect(gameState.cardPile.deck.count).toBeGreaterThan(0);
  });
});
