import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameState } from '../models/GameState';
import { GamePhase, BlindType } from '../types/game';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

/**
 * 骨头先生 (Mr. Bones) 救场回归测试
 * Bug: 骨头先生救场后，UI层错误地显示游戏结束界面
 * 原因: handlePlayHand 和 showGameBoard 中没有检查 phase 是否已被改为 SHOP
 */
describe('Mr. Bones 骨头先生救场回归测试', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
    gameState.startNewGame();
  });

  it('骨头先生应该在得分≥25%目标分数时防止死亡', () => {
    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    expect(mrBones).toBeDefined();
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置一个目标分数较高的盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为30%（满足≥25%条件）
    gameState.roundScore = 300;
    gameState.handsRemaining = 0; // 出牌次数用完

    // 验证 canPreventDeath 返回 true
    const canPrevent = (gameState as any).canPreventDeath();
    expect(canPrevent).toBe(true);
  });

  it('骨头先生不应该在得分<25%目标分数时防止死亡', () => {
    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置一个目标分数较高的盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为20%（不满足≥25%条件）
    gameState.roundScore = 200;
    gameState.handsRemaining = 0;

    // 验证 canPreventDeath 返回 false
    const canPrevent = (gameState as any).canPreventDeath();
    expect(canPrevent).toBe(false);
  });

  it('骨头先生救场后应该进入商店阶段而不是游戏结束', () => {
    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为30%（满足救场条件）
    gameState.roundScore = 300;
    gameState.handsRemaining = 0;
    gameState.phase = GamePhase.PLAYING;

    // 模拟出牌后的检查逻辑
    if (gameState.handsRemaining === 0 && !gameState.isRoundWon()) {
      if ((gameState as any).canPreventDeath()) {
        (gameState as any).enterShopAfterBonesSave();
      } else {
        gameState.phase = GamePhase.GAME_OVER;
      }
    }

    // 验证阶段是 SHOP 而不是 GAME_OVER
    expect(gameState.phase).toBe(GamePhase.SHOP);
    expect(gameState.isGameOver()).toBe(false);
  });

  it('骨头先生救场后应该自毁', () => {
    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为30%
    gameState.roundScore = 300;
    gameState.handsRemaining = 0;

    // 验证骨头先生存在
    expect(gameState.jokers.some(j => j.id === 'mr_bones')).toBe(true);

    // 触发救场
    (gameState as any).enterShopAfterBonesSave();

    // 验证骨头先生已自毁
    expect(gameState.jokers.some(j => j.id === 'mr_bones')).toBe(false);
  });

  it('UI层应该正确处理骨头先生救场后的阶段切换', () => {
    // 这个测试模拟 main.ts 中的逻辑
    // 确保当 phase 为 SHOP 时，不会错误地显示游戏结束

    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为30%
    gameState.roundScore = 300;
    gameState.handsRemaining = 0;

    // 模拟 playHand 中的逻辑
    if (gameState.handsRemaining === 0 && !gameState.isRoundWon()) {
      if ((gameState as any).canPreventDeath()) {
        (gameState as any).enterShopAfterBonesSave();
      } else {
        gameState.phase = GamePhase.GAME_OVER;
      }
    }

    // 模拟 handlePlayHand 中的逻辑（修复后的版本）
    let wouldShowGameOver = false;
    let wouldShowShop = false;

    if (gameState.isRoundComplete()) {
      // 修复后的逻辑：先检查 phase 是否为 SHOP
      if (gameState.phase === GamePhase.SHOP) {
        wouldShowShop = true;
      } else if (gameState.isRoundWon()) {
        wouldShowShop = true;
      } else {
        wouldShowGameOver = true;
      }
    }

    // 验证应该显示商店而不是游戏结束
    expect(wouldShowShop).toBe(true);
    expect(wouldShowGameOver).toBe(false);
    expect(gameState.phase).toBe(GamePhase.SHOP);
  });

  it('没有骨头先生时应该正常游戏结束', () => {
    // 不添加骨头先生

    // 设置盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: 'small' as any,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;

    // 设置得分为30%但没有骨头先生
    gameState.roundScore = 300;
    gameState.handsRemaining = 0;
    gameState.phase = GamePhase.PLAYING;

    // 模拟出牌后的检查逻辑
    if (gameState.handsRemaining === 0 && !gameState.isRoundWon()) {
      if ((gameState as any).canPreventDeath()) {
        (gameState as any).enterShopAfterBonesSave();
      } else {
        gameState.phase = GamePhase.GAME_OVER;
      }
    }

    // 验证阶段是 GAME_OVER
    expect(gameState.phase).toBe(GamePhase.GAME_OVER);
    expect(gameState.isGameOver()).toBe(true);
  });

  it('骨头先生救场后应该推进盲注位置', () => {
    // 添加骨头先生
    const mrBones = getJokerById('mr_bones');
    gameState.getJokerSlots().addJoker(mrBones!);

    // 设置盲注
    gameState.currentBlind = {
      name: '小盲注',
      type: BlindType.SMALL_BLIND,
      ante: 1,
      targetScore: 1000,
      reward: 3,
      bossType: null
    } as any;
    (gameState as any).currentBlindPosition = BlindType.SMALL_BLIND;

    // 设置得分为30%
    gameState.roundScore = 300;
    gameState.handsRemaining = 0;

    // 触发救场
    (gameState as any).enterShopAfterBonesSave();

    // 验证盲注位置已推进（从 SMALL_BLIND 推进到 BIG_BLIND）
    expect((gameState as any).currentBlindPosition).toBe(BlindType.BIG_BLIND);
  });
});
