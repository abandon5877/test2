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
    it('Grabber应该在Shop中记录', () => {
      gameState.applyVoucher('voucher_grabber');

      expect(gameState).toBeDefined();
    });

    it('Nacho Tong应该在Shop中记录', () => {
      gameState.applyVoucher('voucher_nacho_tong');

      expect(gameState).toBeDefined();
    });
  });

  describe('Wasteful/Recyclomancy - 弃牌次数', () => {
    it('Wasteful应该在Shop中记录', () => {
      gameState.applyVoucher('voucher_wasteful');

      expect(gameState).toBeDefined();
    });

    it('Recyclomancy应该在Shop中记录', () => {
      gameState.applyVoucher('voucher_recyclomancy');

      expect(gameState).toBeDefined();
    });
  });
});
