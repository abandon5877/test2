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

  describe('Hieroglyph/Petroglyph - 底注减少', () => {
    it('Hieroglyph应该减少底注1点', () => {
      // 先增加底注到2，以便测试减少效果
      gameState['ante'] = 2; // 直接设置内部ante值
      const initialAnte = gameState.getAnte();
      expect(initialAnte).toBe(2);

      gameState.applyVoucher('voucher_hieroglyph');

      expect(gameState.getAnte()).toBe(1);
    });

    it('Petroglyph应该减少底注1点', () => {
      // 先增加底注到2，以便测试减少效果
      gameState['ante'] = 2;
      const initialAnte = gameState.getAnte();
      expect(initialAnte).toBe(2);

      gameState.applyVoucher('voucher_petroglyph');

      expect(gameState.getAnte()).toBe(1);
    });

    it('多张象形文字优惠券应该叠加减少底注', () => {
      // 先增加底注到3，以便测试减少效果
      gameState['ante'] = 3;
      const initialAnte = gameState.getAnte();
      expect(initialAnte).toBe(3);

      gameState.applyVoucher('voucher_hieroglyph');
      gameState.applyVoucher('voucher_petroglyph');

      expect(gameState.getAnte()).toBe(1); // 3 - 2 = 1，最小为1
    });

    it('底注不应该低于1', () => {
      // 应用多次象形文字优惠券
      gameState.applyVoucher('voucher_hieroglyph');
      gameState.applyVoucher('voucher_petroglyph');
      gameState.applyVoucher('voucher_hieroglyph');
      gameState.applyVoucher('voucher_petroglyph');

      // 底注应该最小为1
      expect(gameState.getAnte()).toBe(1);
    });

    it('Hieroglyph应该减少出牌次数', () => {
      const initialMaxHands = gameState.getMaxHandsPerRound();

      gameState.applyVoucher('voucher_hieroglyph');

      expect(gameState.getMaxHandsPerRound()).toBe(initialMaxHands - 1);
    });

    it('Petroglyph应该减少弃牌次数', () => {
      const initialMaxDiscards = gameState.getMaxDiscardsPerRound();

      gameState.applyVoucher('voucher_petroglyph');

      expect(gameState.getMaxDiscardsPerRound()).toBe(initialMaxDiscards - 1);
    });
  });
});
