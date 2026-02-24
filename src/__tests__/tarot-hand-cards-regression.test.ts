import { describe, it, expect } from 'vitest';
import { ALL_CONSUMABLE_INSTANCES as CONSUMABLES } from '../data/consumables/index';
import { Card } from '../models/Card';
import { Suit, Rank, CardEnhancement } from '../types/card';
import { ConsumableHelper } from '../utils/consumableHelper';
import { GameState } from '../models/GameState';

/**
 * 回归测试：验证改变手牌的塔罗牌使用后卡牌不会消失
 * 问题：改变手牌的塔罗牌（星星、月亮、太阳、世界、死神、力量等）
 * 使用后卡牌会消失，因为 affectedCards 被错误地用于移除卡牌
 */
describe('塔罗牌改变手牌回归测试', () => {
  // 辅助函数：创建模拟的 GameState
  function createMockGameState(handCards: Card[]) {
    const gameState = new GameState();
    // 直接设置手牌
    for (const card of handCards) {
      gameState.cardPile.hand.addCard(card);
    }
    return gameState;
  }

  describe('改变花色的塔罗牌 - 卡牌不应消失', () => {
    it('星星(Star)使用后，选中的卡牌应该保留在手牌中', () => {
      const star = CONSUMABLES.find(c => c.id === 'tarot_star');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      const initialCards = [card1, card2];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      // 使用星星牌前手牌数量
      const handSizeBefore = gameState.cardPile.hand.count;
      expect(handSizeBefore).toBe(2);

      // 使用星星牌
      const result = star!.use({ selectedCards: [card1] });
      expect(result.success).toBe(true);
      expect(result.affectedCards).toContain(card1);

      // 处理结果
      helper.handleResult(result, 'tarot_star', 'tarot');

      // 验证手牌数量不变
      const handSizeAfter = gameState.cardPile.hand.count;
      expect(handSizeAfter).toBe(2);

      // 验证卡牌仍在手牌中
      const handCards = gameState.cardPile.hand.getCards();
      expect(handCards).toContain(card1);
      expect(handCards).toContain(card2);

      // 验证花色已改变
      expect(card1.suit).toBe(Suit.Hearts);
    });

    it('月亮(Moon)使用后，选中的卡牌应该保留在手牌中', () => {
      const moon = CONSUMABLES.find(c => c.id === 'tarot_moon');
      const card1 = new Card(Suit.Hearts, Rank.Ace);
      const card2 = new Card(Suit.Diamonds, Rank.King);
      const card3 = new Card(Suit.Clubs, Rank.Queen);
      const initialCards = [card1, card2, card3];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      // 使用月亮牌
      const result = moon!.use({ selectedCards: [card1, card2, card3] });
      expect(result.success).toBe(true);

      // 处理结果
      helper.handleResult(result, 'tarot_moon', 'tarot');

      // 验证手牌数量不变
      const handSizeAfter = gameState.cardPile.hand.count;
      expect(handSizeAfter).toBe(3);

      // 验证所有卡牌仍在手牌中
      const handCards = gameState.cardPile.hand.getCards();
      expect(handCards).toContain(card1);
      expect(handCards).toContain(card2);
      expect(handCards).toContain(card3);

      // 验证花色已改变为黑桃
      expect(card1.suit).toBe(Suit.Spades);
      expect(card2.suit).toBe(Suit.Spades);
      expect(card3.suit).toBe(Suit.Spades);
    });

    it('太阳(Sun)使用后，选中的卡牌应该保留在手牌中', () => {
      const sun = CONSUMABLES.find(c => c.id === 'tarot_sun');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const initialCards = [card1];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = sun!.use({ selectedCards: [card1] });
      helper.handleResult(result, 'tarot_sun', 'tarot');

      // 验证手牌数量不变，卡牌仍在
      expect(gameState.cardPile.hand.count).toBe(1);
      expect(gameState.cardPile.hand.getCards()).toContain(card1);
      expect(card1.suit).toBe(Suit.Diamonds);
    });

    it('世界(World)使用后，选中的卡牌应该保留在手牌中', () => {
      const world = CONSUMABLES.find(c => c.id === 'tarot_world');
      const card1 = new Card(Suit.Hearts, Rank.Ace);
      const initialCards = [card1];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = world!.use({ selectedCards: [card1] });
      helper.handleResult(result, 'tarot_world', 'tarot');

      // 验证手牌数量不变，卡牌仍在
      expect(gameState.cardPile.hand.count).toBe(1);
      expect(gameState.cardPile.hand.getCards()).toContain(card1);
      expect(card1.suit).toBe(Suit.Clubs);
    });
  });

  describe('改变增强的塔罗牌 - 卡牌不应消失', () => {
    it('魔术师(Magician)使用后，选中的卡牌应该保留在手牌中', () => {
      const magician = CONSUMABLES.find(c => c.id === 'tarot_magician');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      const initialCards = [card1, card2];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = magician!.use({ selectedCards: [card1, card2] });
      helper.handleResult(result, 'tarot_magician', 'tarot');

      // 验证手牌数量不变
      expect(gameState.cardPile.hand.count).toBe(2);
      expect(gameState.cardPile.hand.getCards()).toContain(card1);
      expect(gameState.cardPile.hand.getCards()).toContain(card2);
      expect(card1.enhancement).toBe(CardEnhancement.Lucky);
      expect(card2.enhancement).toBe(CardEnhancement.Lucky);
    });

    it('教皇(Hierophant)使用后，选中的卡牌应该保留在手牌中', () => {
      const hierophant = CONSUMABLES.find(c => c.id === 'tarot_hierophant');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      const initialCards = [card1, card2];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = hierophant!.use({ selectedCards: [card1, card2] });
      helper.handleResult(result, 'tarot_hierophant', 'tarot');

      expect(gameState.cardPile.hand.count).toBe(2);
      expect(card1.enhancement).toBe(CardEnhancement.Bonus);
      expect(card2.enhancement).toBe(CardEnhancement.Bonus);
    });
  });

  describe('改变点数/复制的塔罗牌 - 卡牌不应消失', () => {
    it('力量(Strength)使用后，选中的卡牌应该保留在手牌中', () => {
      const strength = CONSUMABLES.find(c => c.id === 'tarot_strength');
      const card1 = new Card(Suit.Spades, Rank.Ten);
      const initialCards = [card1];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = strength!.use({ selectedCards: [card1] });
      helper.handleResult(result, 'tarot_strength', 'tarot');

      // 验证手牌数量不变，卡牌仍在
      expect(gameState.cardPile.hand.count).toBe(1);
      expect(gameState.cardPile.hand.getCards()).toContain(card1);
      // 验证点数已改变
      expect(card1.rank).toBe(Rank.Jack);
    });

    it('死神(Death)使用后，两张选中的卡牌都应该保留在手牌中', () => {
      const death = CONSUMABLES.find(c => c.id === 'tarot_death');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      const initialCards = [card1, card2];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      const result = death!.use({ selectedCards: [card1, card2] });
      helper.handleResult(result, 'tarot_death', 'tarot');

      // 验证手牌数量不变
      expect(gameState.cardPile.hand.count).toBe(2);
      expect(gameState.cardPile.hand.getCards()).toContain(card1);
      expect(gameState.cardPile.hand.getCards()).toContain(card2);
      // 验证card1变成了card2的花色和点数
      expect(card1.suit).toBe(Suit.Hearts);
      expect(card1.rank).toBe(Rank.King);
    });
  });

  describe('摧毁类塔罗牌 - 卡牌应该被正确移除', () => {
    it('倒吊人(Hanged Man)使用后，选中的卡牌应该从手牌中移除', () => {
      const hanged = CONSUMABLES.find(c => c.id === 'tarot_hanged_man');
      const card1 = new Card(Suit.Spades, Rank.Ace);
      const card2 = new Card(Suit.Hearts, Rank.King);
      const card3 = new Card(Suit.Diamonds, Rank.Queen);
      const initialCards = [card1, card2, card3];

      const gameState = createMockGameState(initialCards);
      const helper = new ConsumableHelper(gameState);

      // 使用倒吊人摧毁card1和card2
      const result = hanged!.use({ selectedCards: [card1, card2] });
      expect(result.success).toBe(true);
      expect(result.destroyedCards).toContain(card1);
      expect(result.destroyedCards).toContain(card2);

      // 处理结果
      helper.handleResult(result, 'tarot_hanged_man', 'tarot');

      // 验证手牌数量减少
      expect(gameState.cardPile.hand.count).toBe(1);
      // 验证被摧毁的卡牌已移除
      const handCards = gameState.cardPile.hand.getCards();
      expect(handCards).not.toContain(card1);
      expect(handCards).not.toContain(card2);
      // 验证未被选中的卡牌仍在
      expect(handCards).toContain(card3);
    });
  });
});
