import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { CardPile } from '../models/CardPile';
import { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { Storage } from '../utils/storage';
import { GameState } from '../models/GameState';

describe('卡牌附加状态保护测试', () => {
  describe('卡牌clone方法', () => {
    it('clone应该复制所有附加状态', () => {
      const card = new Card(
        Suit.Spades,
        Rank.King,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil,
        false,
        15 // permanentBonus
      );

      const cloned = card.clone();

      expect(cloned.suit).toBe(card.suit);
      expect(cloned.rank).toBe(card.rank);
      expect(cloned.enhancement).toBe(card.enhancement);
      expect(cloned.seal).toBe(card.seal);
      expect(cloned.edition).toBe(card.edition);
      expect(cloned.faceDown).toBe(card.faceDown);
      expect(cloned.permanentBonus).toBe(card.permanentBonus);
    });

    it('clone应该创建独立副本，修改不影响原卡牌', () => {
      const card = new Card(Suit.Spades, Rank.King, CardEnhancement.Gold);
      const cloned = card.clone();

      // 修改克隆卡牌
      cloned.addPermanentBonus(10);

      expect(card.permanentBonus).toBe(0);
      expect(cloned.permanentBonus).toBe(10);
    });
  });

  describe('CardPile序列化和反序列化', () => {
    it('应该正确保存和恢复卡牌的所有附加状态', () => {
      const cardPile = new CardPile(8);

      // 创建带有各种附加状态的卡牌
      const card1 = new Card(
        Suit.Spades,
        Rank.King,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil,
        false,
        15
      );
      const card2 = new Card(
        Suit.Hearts,
        Rank.Ace,
        CardEnhancement.Lucky,
        SealType.Red,
        CardEdition.Holographic,
        true,
        5
      );

      // 添加到牌堆
      (cardPile.deck as any)._cards = [card1, card2];

      // 序列化
      const serialized = cardPile.serialize();

      // 验证序列化数据包含所有附加状态
      expect(serialized.deck[0].enhancement).toBe('gold');
      expect(serialized.deck[0].seal).toBe('gold');
      expect(serialized.deck[0].edition).toBe('foil');
      expect(serialized.deck[0].permanentBonus).toBe(15);

      expect(serialized.deck[1].enhancement).toBe('lucky');
      expect(serialized.deck[1].seal).toBe('red');
      expect(serialized.deck[1].edition).toBe('holographic');
      expect(serialized.deck[1].faceDown).toBe(true);
      expect(serialized.deck[1].permanentBonus).toBe(5);

      // 创建新的CardPile并反序列化
      const newCardPile = new CardPile(8);
      newCardPile.deserialize(serialized, 8);

      // 验证反序列化后状态正确
      const restoredCards = newCardPile.deck.getCards();
      expect(restoredCards[0].enhancement).toBe(CardEnhancement.Gold);
      expect(restoredCards[0].seal).toBe(SealType.Gold);
      expect(restoredCards[0].edition).toBe(CardEdition.Foil);
      expect(restoredCards[0].permanentBonus).toBe(15);

      expect(restoredCards[1].enhancement).toBe(CardEnhancement.Lucky);
      expect(restoredCards[1].seal).toBe(SealType.Red);
      expect(restoredCards[1].edition).toBe(CardEdition.Holographic);
      expect(restoredCards[1].faceDown).toBe(true);
      expect(restoredCards[1].permanentBonus).toBe(5);
    });

    it('洗牌不应丢失卡牌附加状态', () => {
      const cardPile = new CardPile(8);

      // 创建带有附加状态的卡牌
      const cards = [
        new Card(Suit.Spades, Rank.King, CardEnhancement.Gold, SealType.Gold, CardEdition.Foil, false, 10),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Lucky, SealType.Red, CardEdition.Holographic, false, 5),
        new Card(Suit.Diamonds, Rank.Queen, CardEnhancement.Bonus, SealType.Blue, CardEdition.Polychrome, false, 20),
      ];

      (cardPile.deck as any)._cards = cards;

      // 记录原始状态
      const originalStates = cards.map(c => ({
        suit: c.suit,
        rank: c.rank,
        enhancement: c.enhancement,
        seal: c.seal,
        edition: c.edition,
        permanentBonus: c.permanentBonus
      }));

      // 多次洗牌
      for (let i = 0; i < 10; i++) {
        cardPile.returnToDeckAndShuffle();
      }

      // 验证所有卡牌状态仍然正确
      const shuffledCards = cardPile.deck.getCards();
      expect(shuffledCards.length).toBe(3);

      for (const original of originalStates) {
        const found = shuffledCards.find(
          c => c.suit === original.suit && c.rank === original.rank
        );
        expect(found).toBeDefined();
        expect(found!.enhancement).toBe(original.enhancement);
        expect(found!.seal).toBe(original.seal);
        expect(found!.edition).toBe(original.edition);
        expect(found!.permanentBonus).toBe(original.permanentBonus);
      }
    });
  });

  describe('DNA复制卡牌', () => {
    it('DNA复制卡牌时应保留所有附加状态', () => {
      const originalCard = new Card(
        Suit.Spades,
        Rank.King,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil,
        false,
        15
      );

      // 模拟DNA复制逻辑
      const copiedCard = originalCard.clone();

      // 验证复制的卡牌保留了所有附加状态
      expect(copiedCard.enhancement).toBe(originalCard.enhancement);
      expect(copiedCard.seal).toBe(originalCard.seal);
      expect(copiedCard.edition).toBe(originalCard.edition);
      expect(copiedCard.permanentBonus).toBe(originalCard.permanentBonus);
    });
  });

  describe('过关时卡牌状态保留', () => {
    it('returnToDeckAndShuffle应该保留卡牌附加状态', () => {
      const cardPile = new CardPile(8);

      // 创建带有附加状态的卡牌
      const cards = [
        new Card(Suit.Spades, Rank.King, CardEnhancement.Gold, SealType.Gold, CardEdition.Foil, false, 10),
        new Card(Suit.Hearts, Rank.Ace, CardEnhancement.Lucky, SealType.Red, CardEdition.Holographic, false, 5),
      ];

      // 清空牌堆，只放入我们的测试卡牌
      (cardPile.deck as any)._cards = [];

      // 一张在手牌，一张在弃牌堆
      cardPile.hand.addCards([cards[0]]);
      (cardPile.discard as any).cards = [cards[1]];

      // 记录原始状态
      const originalStates = new Map([
        [cards[0].toString(), { enhancement: cards[0].enhancement, seal: cards[0].seal, edition: cards[0].edition, permanentBonus: cards[0].permanentBonus }],
        [cards[1].toString(), { enhancement: cards[1].enhancement, seal: cards[1].seal, edition: cards[1].edition, permanentBonus: cards[1].permanentBonus }],
      ]);

      // 模拟过关时的returnToDeckAndShuffle
      cardPile.returnToDeckAndShuffle();

      // 验证卡牌状态保留
      const deckCards = cardPile.deck.getCards();
      expect(deckCards.length).toBe(2);

      for (const card of deckCards) {
        const original = originalStates.get(card.toString());
        expect(original).toBeDefined();
        expect(card.enhancement).toBe(original!.enhancement);
        expect(card.seal).toBe(original!.seal);
        expect(card.edition).toBe(original!.edition);
        expect(card.permanentBonus).toBe(original!.permanentBonus);
      }
    });
  });

  describe('存档和读档', () => {
    it('存档应该正确保存卡牌附加状态', () => {
      const gameState = new GameState();

      // 创建带有附加状态的卡牌并放入牌堆
      const card = new Card(
        Suit.Spades,
        Rank.King,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil,
        false,
        15
      );

      (gameState.cardPile.deck as any)._cards = [card];

      // 序列化游戏状态
      const saveData = Storage.serialize(gameState);

      // 验证存档中包含卡牌附加状态
      expect(saveData.gameState.cards.deck[0].enhancement).toBe('gold');
      expect(saveData.gameState.cards.deck[0].seal).toBe('gold');
      expect(saveData.gameState.cards.deck[0].edition).toBe('foil');
      expect(saveData.gameState.cards.deck[0].permanentBonus).toBe(15);
    });

    it('读档应该正确恢复卡牌附加状态', () => {
      const gameState = new GameState();

      // 创建带有附加状态的卡牌
      const card = new Card(
        Suit.Spades,
        Rank.King,
        CardEnhancement.Gold,
        SealType.Gold,
        CardEdition.Foil,
        false,
        15
      );

      (gameState.cardPile.deck as any)._cards = [card];

      // 序列化
      const saveData = Storage.serialize(gameState);

      // 恢复到新的GameState
      const restoredGameState = Storage.restoreGameState(saveData);

      // 验证卡牌附加状态正确恢复
      const restoredCards = restoredGameState.cardPile.deck.getCards();
      expect(restoredCards.length).toBe(1);

      const restoredCard = restoredCards[0];
      expect(restoredCard.enhancement).toBe(CardEnhancement.Gold);
      expect(restoredCard.seal).toBe(SealType.Gold);
      expect(restoredCard.edition).toBe(CardEdition.Foil);
      expect(restoredCard.permanentBonus).toBe(15);
    });
  });
});
