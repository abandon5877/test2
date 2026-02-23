import { describe, it, expect, beforeEach } from 'vitest';
import { GameState } from '../models/GameState';

describe('Voucher游戏状态测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  describe('Antimatter - 小丑牌槽位', () => {
    it('Antimatter应该增加小丑牌槽位', () => {
      const initialSlots = gameState.getJokerSlots().getMaxSlots();

      gameState.applyVoucher('voucher_antimatter');

      expect(gameState.getJokerSlots().getMaxSlots()).toBe(initialSlots + 1);
    });
  });

  describe('Paint Brush/Palette - 手牌上限', () => {
    it('Paint Brush应该增加1个手牌上限', () => {
      const initialHandSize = gameState.getMaxHandSize();

      gameState.applyVoucher('voucher_paint_brush');

      expect(gameState.getMaxHandSize()).toBe(initialHandSize + 1);
    });

    it('Palette应该增加2个手牌上限', () => {
      const initialHandSize = gameState.getMaxHandSize();

      gameState.applyVoucher('voucher_palette');

      expect(gameState.getMaxHandSize()).toBe(initialHandSize + 2);
    });
  });

  describe('Grabber/Nacho Tong - 出牌次数', () => {
    it('Grabber应该增加1次出牌次数', () => {
      const initialHands = gameState.handsRemaining;

      gameState.applyVoucher('voucher_grabber');

      expect(gameState.handsRemaining).toBe(initialHands + 1);
    });

    it('Nacho Tong应该增加2次出牌次数', () => {
      const initialHands = gameState.handsRemaining;

      gameState.applyVoucher('voucher_nacho_tong');

      expect(gameState.handsRemaining).toBe(initialHands + 2);
    });

    it('Grabber应该影响getMaxHandsPerRound', () => {
      const initialMaxHands = gameState.getMaxHandsPerRound();

      gameState.applyVoucher('voucher_grabber');

      expect(gameState.getMaxHandsPerRound()).toBe(initialMaxHands + 1);
    });

    it('Nacho Tong应该影响getMaxHandsPerRound', () => {
      const initialMaxHands = gameState.getMaxHandsPerRound();

      gameState.applyVoucher('voucher_nacho_tong');

      expect(gameState.getMaxHandsPerRound()).toBe(initialMaxHands + 2);
    });
  });

  describe('Wasteful/Recyclomancy - 弃牌次数', () => {
    it('Wasteful应该增加1次弃牌次数', () => {
      const initialDiscards = gameState.discardsRemaining;

      gameState.applyVoucher('voucher_wasteful');

      expect(gameState.discardsRemaining).toBe(initialDiscards + 1);
    });

    it('Recyclomancy应该增加2次弃牌次数', () => {
      const initialDiscards = gameState.discardsRemaining;

      gameState.applyVoucher('voucher_recyclomancy');

      expect(gameState.discardsRemaining).toBe(initialDiscards + 2);
    });

    it('Wasteful应该影响getMaxDiscardsPerRound', () => {
      const initialMaxDiscards = gameState.getMaxDiscardsPerRound();

      gameState.applyVoucher('voucher_wasteful');

      expect(gameState.getMaxDiscardsPerRound()).toBe(initialMaxDiscards + 1);
    });

    it('Recyclomancy应该影响getMaxDiscardsPerRound', () => {
      const initialMaxDiscards = gameState.getMaxDiscardsPerRound();

      gameState.applyVoucher('voucher_recyclomancy');

      expect(gameState.getMaxDiscardsPerRound()).toBe(initialMaxDiscards + 2);
    });
  });
});
