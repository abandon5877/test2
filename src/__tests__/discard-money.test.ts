import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';

describe('弃牌金币奖励测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
    gameState.selectBlind(BlindType.SMALL_BLIND);
  });

  describe('Faceless Joker (无面小丑)', () => {
    it('弃牌后应该真正获得金币', () => {
      // 添加无面小丑
      const joker = getJokerById('faceless_joker')!;
      gameState.jokerSlots.addJoker(joker);

      // 准备弃牌 - 3张人头牌
      gameState.cardPile.hand.clear();
      gameState.cardPile.hand.addCard(new Card(Suit.Spades, Rank.King));
      gameState.cardPile.hand.addCard(new Card(Suit.Hearts, Rank.Queen));
      gameState.cardPile.hand.addCard(new Card(Suit.Diamonds, Rank.Jack));
      // 添加更多牌以满足手牌上限
      for (let i = 0; i < 5; i++) {
        gameState.cardPile.hand.addCard(new Card(Suit.Clubs, Rank.Two));
      }

      // 选择要弃的牌
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);
      gameState.cardPile.hand.selectCard(2);

      // 记录初始金币
      const initialMoney = gameState.money;

      // 弃牌
      gameState.discardCards();

      // 验证金币增加了$5
      expect(gameState.money).toBe(initialMoney + 5);
    });
  });

  describe('Mail-In Rebate (邮寄返利)', () => {
    it('弃牌后应该真正获得金币', () => {
      // 添加邮寄返利
      const joker = getJokerById('mail_in_rebate')!;
      gameState.jokerSlots.addJoker(joker);
      // 设置目标点数为A
      (joker as any).state = { targetRank: 'A' };

      // 准备弃牌 - 2张A
      gameState.cardPile.hand.clear();
      gameState.cardPile.hand.addCard(new Card(Suit.Spades, Rank.Ace));
      gameState.cardPile.hand.addCard(new Card(Suit.Hearts, Rank.Ace));
      // 添加更多牌以满足手牌上限
      for (let i = 0; i < 6; i++) {
        gameState.cardPile.hand.addCard(new Card(Suit.Clubs, Rank.Two));
      }

      // 选择要弃的牌
      gameState.cardPile.hand.selectCard(0);
      gameState.cardPile.hand.selectCard(1);

      // 记录初始金币
      const initialMoney = gameState.money;

      // 弃牌
      gameState.discardCards();

      // 验证金币增加了$10 (2张A * $5)
      expect(gameState.money).toBe(initialMoney + 10);
    });
  });

  describe('Trading Card (交易卡)', () => {
    it('第一手弃1张牌后应该获得$3', () => {
      // 添加交易卡
      const joker = getJokerById('trading_card')!;
      gameState.jokerSlots.addJoker(joker);

      // 准备弃牌 - 1张牌
      gameState.cardPile.hand.clear();
      gameState.cardPile.hand.addCard(new Card(Suit.Spades, Rank.Ace));
      // 添加更多牌以满足手牌上限
      for (let i = 0; i < 7; i++) {
        gameState.cardPile.hand.addCard(new Card(Suit.Clubs, Rank.Two));
      }

      // 选择要弃的牌
      gameState.cardPile.hand.selectCard(0);

      // 记录初始金币
      const initialMoney = gameState.money;

      // 弃牌
      gameState.discardCards();

      // 验证金币增加了$3
      expect(gameState.money).toBe(initialMoney + 3);
    });
  });
});
