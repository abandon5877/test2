import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';
import { JokerSlots } from '../models/JokerSlots';
import { Shop } from '../models/Shop';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';

describe('利息系统测试', () => {
  describe('利息上限计算', () => {
    let gameState: GameState;
    let shop: Shop;

    beforeEach(() => {
      gameState = new GameState();
      shop = new Shop();
      gameState.shop = shop;
    });

    it('默认利息上限应为$5', () => {
      expect(gameState.getInterestCap()).toBe(5);
    });

    it('使用种子资金后利息上限应为$10', () => {
      shop.applyVoucher('voucher_seed_money');
      expect(gameState.getInterestCap()).toBe(10);
    });

    it('使用种子资金+后利息上限应为$20', () => {
      shop.applyVoucher('voucher_seed_money');
      shop.applyVoucher('voucher_money_tree');
      expect(gameState.getInterestCap()).toBe(20);
    });

    it('只使用种子资金+（未使用种子资金）利息上限应为$20', () => {
      // 注意：正常情况下需要先使用种子资金才能使用种子资金+
      // 但这里测试的是直接应用种子资金+的情况
      shop.applyVoucher('voucher_money_tree');
      expect(gameState.getInterestCap()).toBe(20);
    });
  });

  describe('登月(To the Moon)小丑牌', () => {
    let gameState: GameState;
    let jokerSlots: JokerSlots;
    let shop: Shop;

    beforeEach(() => {
      gameState = new GameState();
      jokerSlots = new JokerSlots(5);
      shop = new Shop();
      gameState.shop = shop;
    });

    it('资金$0时登月不应给钱', () => {
      // 使用实际的登月小丑牌
      const toTheMoonJoker = getJokerById('to_the_moon');
      expect(toTheMoonJoker).toBeDefined();
      
      if (toTheMoonJoker) {
        jokerSlots.addJoker(toTheMoonJoker);
      }

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 0,
        interestCap: gameState.getInterestCap(),
        hands: 0,
        discards: 0
      });

      // 登月应该给$0（因为资金为0）
      expect(result.moneyBonus).toBe(0);
    });

    it('资金$25时登月应给$5', () => {
      const toTheMoonJoker = getJokerById('to_the_moon');
      expect(toTheMoonJoker).toBeDefined();
      
      if (toTheMoonJoker) {
        jokerSlots.addJoker(toTheMoonJoker);
      }

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 25,
        interestCap: gameState.getInterestCap(),
        hands: 0,
        discards: 0
      });

      // 登月应该给$5（$25 / $5 = $5）
      expect(result.moneyBonus).toBe(5);
    });

    it('资金$49时登月应给$9（向下取整）', () => {
      const toTheMoonJoker = getJokerById('to_the_moon');
      expect(toTheMoonJoker).toBeDefined();
      
      if (toTheMoonJoker) {
        jokerSlots.addJoker(toTheMoonJoker);
      }

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 49,
        interestCap: gameState.getInterestCap(),
        hands: 0,
        discards: 0
      });

      // 登月应该给$9（$49 / $5 = 9.8，向下取整为9）
      expect(result.moneyBonus).toBe(9);
    });

    it('资金正好$50时登月应给$10', () => {
      const toTheMoonJoker = getJokerById('to_the_moon');
      expect(toTheMoonJoker).toBeDefined();
      
      if (toTheMoonJoker) {
        jokerSlots.addJoker(toTheMoonJoker);
      }

      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 50,
        interestCap: gameState.getInterestCap(),
        hands: 0,
        discards: 0
      });

      // 登月应该给$10（$50 / $5 = $10）
      expect(result.moneyBonus).toBe(10);
    });
  });

  describe('登月与利息上限的关系', () => {
    it('登月的收益不受利息上限限制', () => {
      // 官方规则：登月是基于资金计算，不受利息上限限制
      // 即使利息上限是$5，如果有$100资金，登月仍然给$20
      const jokerSlots = new JokerSlots(5);
      const shop = new Shop();
      const gameState = new GameState();
      gameState.shop = shop;

      const toTheMoonJoker = getJokerById('to_the_moon');
      expect(toTheMoonJoker).toBeDefined();
      
      if (toTheMoonJoker) {
        jokerSlots.addJoker(toTheMoonJoker);
      }

      // 利息上限只有$5，但资金有$100
      const result = JokerSystem.processEndRound(jokerSlots, {
        money: 100,
        interestCap: 5,  // 低利息上限
        hands: 0,
        discards: 0
      });

      // 登月应该给$20（基于$100资金，不受$5利息上限限制）
      expect(result.moneyBonus).toBe(20);
    });
  });
});
