import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { JokerSlots } from '../models/JokerSlots';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { PokerHandType } from '../types/pokerHands';
import { JokerSystem } from '../systems/JokerSystem';
import { Storage } from '../utils/storage';

describe('远足者(Hiker)测试', () => {
  let gameState: GameState;
  let jokerSlots: JokerSlots;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    jokerSlots = gameState.getJokerSlots();
  });

  describe('远足者效果测试', () => {
    it('远足者应该为每张计分牌永久+5筹码', () => {
      // 创建远足者小丑牌
      const hiker = getJokerById('hiker');
      if (hiker) jokerSlots.addJoker(hiker);

      // 创建测试卡牌
      const card1 = new Card(Suit.Hearts, Rank.Ace);
      const card2 = new Card(Suit.Diamonds, Rank.King);
      const scoredCards = [card1, card2];

      // 模拟计分过程
      const result = JokerSystem.processScoredCards(
        jokerSlots,
        scoredCards,
        PokerHandType.OnePair,
        100,
        10
      );

      // 验证返回了modifyScoredCards
      expect(result.modifyScoredCards).toBeDefined();
      expect(result.modifyScoredCards).toHaveLength(2);

      // 应用修改
      if (result.modifyScoredCards) {
        for (const { card, permanentBonusDelta } of result.modifyScoredCards) {
          card.addPermanentBonus(permanentBonusDelta);
        }
      }

      // 验证每张卡牌获得了+5永久加成
      expect(card1.permanentBonus).toBe(5);
      expect(card2.permanentBonus).toBe(5);

      // 验证筹码值增加了
      expect(card1.getChipValue()).toBe(11 + 5); // Ace基础11 + 5
      expect(card2.getChipValue()).toBe(10 + 5); // King基础10 + 5
    });

    it('远足者效果应该累积', () => {
      const hiker = getJokerById('hiker');
      if (hiker) jokerSlots.addJoker(hiker);

      const card = new Card(Suit.Hearts, Rank.Ace);

      // 第一次计分
      let result = JokerSystem.processScoredCards(
        jokerSlots,
        [card],
        PokerHandType.HighCard,
        100,
        10
      );

      if (result.modifyScoredCards) {
        for (const { card, permanentBonusDelta } of result.modifyScoredCards) {
          card.addPermanentBonus(permanentBonusDelta);
        }
      }

      expect(card.permanentBonus).toBe(5);

      // 第二次计分（模拟再次打出同一张牌）
      result = JokerSystem.processScoredCards(
        jokerSlots,
        [card],
        PokerHandType.HighCard,
        100,
        10
      );

      if (result.modifyScoredCards) {
        for (const { card, permanentBonusDelta } of result.modifyScoredCards) {
          card.addPermanentBonus(permanentBonusDelta);
        }
      }

      // 永久加成应该累积
      expect(card.permanentBonus).toBe(10);
      expect(card.getChipValue()).toBe(11 + 10);
    });

    it('多张远足者应该分别触发效果', () => {
      // 创建两张远足者
      const hiker1 = getJokerById('hiker');
      const hiker2 = getJokerById('hiker');
      if (hiker1) jokerSlots.addJoker(hiker1);
      if (hiker2) jokerSlots.addJoker(hiker2);

      const card = new Card(Suit.Hearts, Rank.Ace);

      const result = JokerSystem.processScoredCards(
        jokerSlots,
        [card],
        PokerHandType.HighCard,
        100,
        10
      );

      // 应用修改
      if (result.modifyScoredCards) {
        for (const { card, permanentBonusDelta } of result.modifyScoredCards) {
          card.addPermanentBonus(permanentBonusDelta);
        }
      }

      // 两张远足者，每张给+5，总共+10
      expect(card.permanentBonus).toBe(10);
    });
  });

  describe('远足者存档持久化测试', () => {
    it('卡牌的永久加成应该在存档后保留', () => {
      // 给一张卡牌添加永久加成
      const card = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.None, SealType.None, CardEdition.None, false, 25);
      expect(card.permanentBonus).toBe(25);
      expect(card.getChipValue()).toBe(36); // 11 + 25

      // 将卡牌加入手牌
      (gameState as any).cardPile.hand.addCards([card]);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档中包含永久加成
      expect(saveData.gameState.cards.hand[0].permanentBonus).toBe(25);

      // 读档
      const loadedGameState = Storage.restore(saveData);

      // 验证读档后永久加成仍然保留
      const loadedCard = (loadedGameState as any).cardPile.hand.getCards()[0];
      expect(loadedCard.permanentBonus).toBe(25);
      expect(loadedCard.getChipValue()).toBe(36);
    });

    it('牌堆中的卡牌永久加成也应该被保存', () => {
      // 创建带有永久加成的卡牌并放入牌堆
      const card = new Card(Suit.Spades, Rank.King, CardEnhancement.None, SealType.None, CardEdition.None, false, 15);
      (gameState as any).cardPile.deck.addToBottom(card);

      // 存档
      const saveData = Storage.serialize(gameState);

      // 验证存档中包含永久加成
      const deckCards = saveData.gameState.cards.deck;
      const savedCard = deckCards.find((c: any) => c.rank === 'K' && c.suit === '♠');
      expect(savedCard).toBeDefined();
      expect(savedCard?.permanentBonus).toBe(15);

      // 读档
      const loadedGameState = Storage.restore(saveData);

      // 验证读档后永久加成仍然保留
      const loadedCards = (loadedGameState as any).cardPile.deck.getCards();
      const loadedCard = loadedCards.find((c: Card) => c.rank === 'K' && c.suit === '♠');
      expect(loadedCard).toBeDefined();
      expect(loadedCard?.permanentBonus).toBe(15);
    });
  });

  describe('远足者与其他效果交互测试', () => {
    it('永久加成应该与Bonus强化效果叠加', () => {
      // 创建带有Bonus强化和永久加成的卡牌
      const card = new Card(Suit.Hearts, Rank.Five, CardEnhancement.Bonus, SealType.None, CardEdition.None, false, 10);

      // 基础值5 + 永久加成10 + Bonus效果30 = 45（Bonus效果在ScoringSystem中处理）
      // 这里只验证getChipValue返回基础值+永久加成
      expect(card.getChipValue()).toBe(5 + 10); // 15
    });

    it('石头牌也应该保留永久加成', () => {
      // 创建带有永久加成的石头牌
      const card = new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Stone, SealType.None, CardEdition.None, false, 20);

      // 石头牌固定50筹码，但也应该加上永久加成
      expect(card.getChipValue()).toBe(50 + 20); // 70
    });
  });
});
