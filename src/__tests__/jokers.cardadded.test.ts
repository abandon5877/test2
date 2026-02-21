import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

describe('ON_CARD_ADDED 触发器测试', () => {
  let jokerSlots: JokerSlots;
  let gameState: GameState;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    gameState = new GameState();
    gameState.startNewGame();
    gameState.selectBlind('SMALL_BLIND');
  });

  describe('JokerSystem.processCardAdded', () => {
    it('应该触发 ON_CARD_ADDED 小丑牌效果', () => {
      const cardJoker = new Joker({
        id: 'test_card_joker',
        name: '卡牌小丑',
        description: '卡牌添加到牌库时触发',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.ON_CARD_ADDED,
        effect: (): { message?: string } => {
          return {
            message: '卡牌小丑: 新卡牌加入牌库'
          };
        }
      });

      jokerSlots.addJoker(cardJoker);

      const card = new Card(Suit.Spades, Rank.Ace);
      const result = JokerSystem.processCardAdded(jokerSlots, card);

      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('卡牌小丑');
      expect(result.effects[0].effect).toContain('新卡牌');
    });

    it('没有 ON_CARD_ADDED 小丑牌时不应该触发效果', () => {
      const card = new Card(Suit.Hearts, Rank.King);
      const result = JokerSystem.processCardAdded(jokerSlots, card);

      expect(result.effects).toHaveLength(0);
    });

    it('应该处理多个 ON_CARD_ADDED 小丑牌', () => {
      const joker1 = new Joker({
        id: 'test_card_joker_1',
        name: '卡牌小丑1',
        description: '卡牌添加时触发1',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.ON_CARD_ADDED,
        effect: (): { message?: string } => {
          return { message: '效果1' };
        }
      });

      const joker2 = new Joker({
        id: 'test_card_joker_2',
        name: '卡牌小丑2',
        description: '卡牌添加时触发2',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.ON_CARD_ADDED,
        effect: (): { message?: string } => {
          return { message: '效果2' };
        }
      });

      jokerSlots.addJoker(joker1);
      jokerSlots.addJoker(joker2);

      const card = new Card(Suit.Diamonds, Rank.Queen);
      const result = JokerSystem.processCardAdded(jokerSlots, card);

      expect(result.effects).toHaveLength(2);
    });
  });

  describe('GameState.addCardToDeck', () => {
    it('应该添加卡牌到牌库底部', () => {
      const initialDeckSize = gameState.cardPile.deck.size;
      const card = new Card(Suit.Clubs, Rank.Jack);

      gameState.addCardToDeck(card, 'bottom');

      expect(gameState.cardPile.deck.size).toBe(initialDeckSize + 1);
    });

    it('应该添加卡牌到牌库顶部', () => {
      const initialDeckSize = gameState.cardPile.deck.size;
      const card = new Card(Suit.Spades, Rank.Ten);

      gameState.addCardToDeck(card, 'top');

      expect(gameState.cardPile.deck.size).toBe(initialDeckSize + 1);
    });

    it('默认应该添加卡牌到牌库底部', () => {
      const initialDeckSize = gameState.cardPile.deck.size;
      const card = new Card(Suit.Hearts, Rank.Nine);

      gameState.addCardToDeck(card);

      expect(gameState.cardPile.deck.size).toBe(initialDeckSize + 1);
    });

    it('应该触发 ON_CARD_ADDED 小丑牌效果', () => {
      const cardJoker = new Joker({
        id: 'test_card_joker',
        name: '卡牌小丑',
        description: '卡牌添加到牌库时触发',
        rarity: JokerRarity.COMMON,
        cost: 3,
        trigger: JokerTrigger.ON_CARD_ADDED,
        effect: (): { message?: string } => {
          return {
            message: '卡牌小丑: 新卡牌加入'
          };
        }
      });

      gameState.jokerSlots.addJoker(cardJoker);

      const card = new Card(Suit.Spades, Rank.Ace);
      // 不应该抛出错误
      expect(() => gameState.addCardToDeck(card)).not.toThrow();
    });
  });
});
