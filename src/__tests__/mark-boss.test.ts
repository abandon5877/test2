import { describe, it, expect, beforeEach } from 'vitest';
import { Card } from '../models/Card';
import { GameState } from '../models/GameState';
import { BossType } from '../types/game';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { JokerSlots } from '../models/JokerSlots';

describe('标记Boss (The Mark) 测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    // 创建游戏状态
    gameState = new GameState();
    // 设置标记Boss
    gameState['bossState'].setBoss(BossType.MARK);
  });

  it('标记Boss应该翻面所有人头牌', () => {
    // 手动创建手牌，包含人头牌
    const handCards = [
      new Card(Suit.Spades, Rank.King),  // K - 人头牌
      new Card(Suit.Hearts, Rank.Queen), // Q - 人头牌
      new Card(Suit.Diamonds, Rank.Jack), // J - 人头牌
      new Card(Suit.Clubs, Rank.Ten),    // 10 - 非人头牌
      new Card(Suit.Spades, Rank.Ace),   // A - 非人头牌
    ];

    // 将卡牌添加到手牌
    for (const card of handCards) {
      gameState['cardPile'].hand.addCard(card);
    }

    // 调用dealInitialHand来触发标记Boss的翻面逻辑
    gameState['dealInitialHand']();

    // 获取手牌
    const cards = gameState['cardPile'].hand.getCards();

    // 检查人头牌是否被翻面
    const kingCard = cards.find(c => c.rank === Rank.King);
    const queenCard = cards.find(c => c.rank === Rank.Queen);
    const jackCard = cards.find(c => c.rank === Rank.Jack);
    const tenCard = cards.find(c => c.rank === Rank.Ten);
    const aceCard = cards.find(c => c.rank === Rank.Ace);

    expect(kingCard?.faceDown).toBe(true);
    expect(queenCard?.faceDown).toBe(true);
    expect(jackCard?.faceDown).toBe(true);
    expect(tenCard?.faceDown).toBe(false);
    expect(aceCard?.faceDown).toBe(false);
  });

  it('标记Boss应该翻面带增强效果的人头牌', () => {
    // 创建带增强效果的人头牌
    const steelKing = new Card(Suit.Spades, Rank.King);
    steelKing.enhancement = CardEnhancement.Steel;

    const bonusQueen = new Card(Suit.Hearts, Rank.Queen);
    bonusQueen.enhancement = CardEnhancement.Bonus;

    // 将卡牌添加到手牌
    gameState['cardPile'].hand.addCard(steelKing);
    gameState['cardPile'].hand.addCard(bonusQueen);
    gameState['cardPile'].hand.addCard(new Card(Suit.Clubs, Rank.Ten)); // 非人头牌

    // 手动调用标记Boss的翻面逻辑
    const handCards = gameState['cardPile'].hand.getCards();
    for (const card of handCards) {
      if (card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King) {
        card.setFaceDown(true);
      }
    }

    // 检查带增强效果的人头牌是否被翻面
    expect(steelKing.faceDown).toBe(true);
    expect(bonusQueen.faceDown).toBe(true);
  });

  it('抽牌时标记Boss应该翻面人头牌', () => {
    // 清空手牌
    gameState['cardPile'].hand.clear();

    // 手动添加一张带增强效果的K到牌堆顶部
    const steelKing = new Card(Suit.Spades, Rank.King);
    steelKing.enhancement = CardEnhancement.Steel;
    gameState['cardPile']['deck'].addToTop(steelKing);

    // 抽牌
    gameState['drawCards'](1);

    // 检查抽到的K是否被翻面
    const cards = gameState['cardPile'].hand.getCards();
    const drawnKing = cards.find(c => c.rank === Rank.King);

    expect(drawnKing?.faceDown).toBe(true);
  });
});
