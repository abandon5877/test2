import { describe, it, expect, beforeEach } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { Joker } from '../models/Joker';
import { JokerRarity, JokerTrigger } from '../types/joker';
import { GameState } from '../models/GameState';

describe('ON_REROLL 触发器测试', () => {
  let jokerSlots: JokerSlots;
  let gameState: GameState;

  beforeEach(() => {
    jokerSlots = new JokerSlots(5);
    gameState = new GameState();
    gameState.startNewGame();
    // 完成一个盲注以进入商店
    gameState.selectBlind('SMALL_BLIND');
    // 模拟完成盲注
    (gameState as any).roundScore = 1000; // 确保超过目标分数
    gameState.completeBlind();
  });

  describe('chaos_the_clown (混沌小丑)', () => {
    it('应该提供免费刷新', () => {
      const chaosClown = new Joker({
        id: 'chaos_the_clown',
        name: '混沌小丑',
        description: '商店刷新免费',
        rarity: JokerRarity.UNCOMMON,
        cost: 4,
        trigger: JokerTrigger.ON_REROLL,
        effect: (): { freeReroll?: boolean; message?: string } => {
          return {
            freeReroll: true,
            message: '混沌小丑: 免费刷新'
          };
        }
      });

      jokerSlots.addJoker(chaosClown);

      const result = JokerSystem.processReroll(jokerSlots);

      expect(result.freeReroll).toBe(true);
      expect(result.effects).toHaveLength(1);
      expect(result.effects[0].jokerName).toBe('混沌小丑');
    });
  });

  describe('GameState.rerollShop', () => {
    it('应该处理 ON_REROLL 触发器并提供免费刷新', () => {
      const chaosClown = new Joker({
        id: 'chaos_the_clown',
        name: '混沌小丑',
        description: '商店刷新免费',
        rarity: JokerRarity.UNCOMMON,
        cost: 4,
        trigger: JokerTrigger.ON_REROLL,
        effect: (): { freeReroll?: boolean; message?: string } => {
          return {
            freeReroll: true,
            message: '混沌小丑: 免费刷新'
          };
        }
      });

      gameState.jokerSlots.addJoker(chaosClown);

      const initialMoney = gameState.money;
      const result = gameState.rerollShop();

      expect(result.success).toBe(true);
      expect(result.freeReroll).toBe(true);
      // 免费刷新不应该扣除金钱
      expect(gameState.money).toBe(initialMoney);
    });

    it('没有免费刷新小丑牌时应该扣除金钱', () => {
      const initialMoney = gameState.money;
      const rerollCost = gameState.shop!.rerollCost;

      // 确保有足够的钱
      if (initialMoney >= rerollCost) {
        const result = gameState.rerollShop();

        expect(result.success).toBe(true);
        expect(result.freeReroll).toBeFalsy();
        // 应该扣除刷新费用
        expect(gameState.money).toBe(initialMoney - rerollCost);
      }
    });

    it('资金不足时应该失败', () => {
      // 设置资金为0
      (gameState as any).money = 0;

      const result = gameState.rerollShop();

      expect(result.success).toBe(false);
      expect(result.message).toContain('资金');
    });

    it('不在商店阶段时应该失败', () => {
      // 退出商店
      gameState.exitShop();

      const result = gameState.rerollShop();

      expect(result.success).toBe(false);
      expect(result.message).toContain('商店');
    });
  });
});
