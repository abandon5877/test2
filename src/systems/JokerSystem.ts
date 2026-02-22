import { JokerInterface, JokerEffectContext, JokerEffectResult } from '../types/joker';
import { Card } from '../models/Card';
import { PokerHandType } from '../types/pokerHands';
import { ScoreResult } from './ScoringSystem';
import { createModuleLogger } from '../utils/logger';
import { JokerSlots } from '../models/JokerSlots';

const logger = createModuleLogger('JokerSystem');

export interface ProcessedScoreResult extends ScoreResult {
  jokerEffects: JokerEffectDetail[];
  totalMoneyEarned: number;
}

export interface JokerEffectDetail {
  jokerName: string;
  effect: string;
  chipBonus?: number;
  multBonus?: number;
  multMultiplier?: number;
  moneyBonus?: number;
}

export class JokerSystem {
  /**
   * 出售小丑牌
   */
  static sellJoker(jokerSlots: JokerSlots, index: number): { success: boolean; sellPrice?: number; error?: string } {
    const jokers = jokerSlots.getJokers();

    if (index < 0 || index >= jokers.length) {
      logger.warn('Cannot sell joker: invalid index', { index, count: jokers.length });
      return { success: false, error: 'Invalid joker index' };
    }

    const joker = jokers[index];

    // 检查是否为永恒贴纸（无法出售）
    if (joker.sticker === 'eternal') {
      logger.warn('Cannot sell joker: eternal sticker', { jokerId: joker.id });
      return { success: false, error: 'Eternal joker cannot be sold' };
    }

    // 计算出售价格 = 购买价格 / 2（向下取整），最低$1
    let sellPrice = Math.max(1, Math.floor(joker.cost / 2));

    // 如果是租赁贴纸，不出售价格（因为是租的）
    if (joker.sticker === 'rental') {
      sellPrice = 1; // 租赁小丑只能卖$1
    }

    // 移除小丑牌
    jokerSlots.removeJoker(index);
    logger.info('Joker sold', {
      jokerId: joker.id,
      jokerName: joker.name,
      sellPrice
    });

    return { success: true, sellPrice };
  }

  /**
   * 创建位置上下文
   */
  private static createPositionContext(jokerSlots: JokerSlots, jokerIndex: number): Pick<JokerEffectContext, 'jokerPosition' | 'allJokers' | 'leftJokers' | 'rightJokers' | 'leftmostJoker' | 'rightmostJoker'> {
    const allJokers = [...jokerSlots.getJokers()];
    const leftJokers = allJokers.slice(0, jokerIndex);
    const rightJokers = allJokers.slice(jokerIndex + 1);

    return {
      jokerPosition: jokerIndex,
      allJokers,
      leftJokers,
      rightJokers,
      leftmostJoker: allJokers[0],
      rightmostJoker: allJokers[allJokers.length - 1]
    };
  }

  /**
   * 应用效果结果
   */
  private static applyEffectResult(joker: JokerInterface, result: JokerEffectResult): void {
    if (result.stateUpdate) {
      joker.updateState(result.stateUpdate);
    }
  }

  /**
   * 处理计分卡牌
   */
  static processScoredCards(
    jokerSlots: JokerSlots,
    scoredCards: readonly Card[],
    handType: PokerHandType,
    currentChips: number,
    currentMult: number
  ): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
  } {
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (!joker.onScored) continue;

      const context: JokerEffectContext = {
        scoredCards,
        handType,
        currentChips,
        currentMult,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.onScored(context);

      if (result.chipBonus || result.multBonus || result.multMultiplier || result.moneyBonus || result.message) {
        totalChipBonus += result.chipBonus || 0;
        totalMultBonus += result.multBonus || 0;
        if (result.multMultiplier) {
          totalMultMultiplier *= result.multMultiplier;
        }

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          chipBonus: result.chipBonus,
          multBonus: result.multBonus,
          multMultiplier: result.multMultiplier,
          moneyBonus: result.moneyBonus
        });
      }

      this.applyEffectResult(joker, result);
    }

    return {
      chipBonus: totalChipBonus,
      multBonus: totalMultBonus,
      multMultiplier: totalMultMultiplier,
      effects
    };
  }

  /**
   * 处理出牌
   */
  static processHandPlayed(
    jokerSlots: JokerSlots,
    scoredCards: readonly Card[],
    handType: PokerHandType,
    currentChips: number,
    currentMult: number,
    gameState?: { money: number; interestCap: number; hands: number; discards: number },
    handsPlayed?: number,
    discardsUsed?: number,
    deckSize?: number,
    initialDeckSize?: number,
    handsRemaining?: number,
    mostPlayedHand?: PokerHandType | null
  ): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
  } {
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    console.log('[JokerSystem] processHandPlayed循环开始, 小丑数量:', jokers.length);
    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      console.log(`[JokerSystem] 检查小丑[${i}]:`, { id: joker.id, name: joker.name, trigger: joker.trigger, hasOnHandPlayed: 'onHandPlayed' in joker, type: typeof (joker as any).onHandPlayed });
      if (!('onHandPlayed' in joker) || typeof (joker as any).onHandPlayed !== 'function') {
        console.log(`[JokerSystem] 小丑[${i}]跳过: 没有onHandPlayed方法`);
        continue;
      }

      const context: JokerEffectContext = {
        scoredCards,
        handType,
        currentChips,
        currentMult,
        gameState,
        handsPlayed,
        discardsUsed,
        deckSize,
        initialDeckSize,
        handsRemaining,
        mostPlayedHand,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      console.log(`[JokerSystem] 调用小丑[${i}] onHandPlayed, handType:`, handType);
      const result = joker.onHandPlayed!(context);
      console.log(`[JokerSystem] 小丑[${i}] onHandPlayed返回:`, result);

      if (result.chipBonus || result.multBonus || result.multMultiplier || result.message) {
        totalChipBonus += result.chipBonus || 0;
        totalMultBonus += result.multBonus || 0;
        if (result.multMultiplier) {
          totalMultMultiplier *= result.multMultiplier;
        }

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          chipBonus: result.chipBonus,
          multBonus: result.multBonus,
          multMultiplier: result.multMultiplier
        });
      }

      this.applyEffectResult(joker, result);
    }

    return {
      chipBonus: totalChipBonus,
      multBonus: totalMultBonus,
      multMultiplier: totalMultMultiplier,
      effects
    };
  }

  /**
   * 处理出牌时效果
   */
  static processOnPlay(jokerSlots: JokerSlots): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
  } {
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    const effects: JokerEffectDetail[] = [];

    const context: JokerEffectContext = {};

    for (const joker of jokerSlots.getJokers()) {
      if (!joker.onPlay) continue;
      const result = joker.onPlay(context);

      if (result.chipBonus || result.multBonus || result.multMultiplier || result.message) {
        totalChipBonus += result.chipBonus || 0;
        totalMultBonus += result.multBonus || 0;
        if (result.multMultiplier) {
          totalMultMultiplier *= result.multMultiplier;
        }

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          chipBonus: result.chipBonus,
          multBonus: result.multBonus,
          multMultiplier: result.multMultiplier
        });
      }
    }

    return {
      chipBonus: totalChipBonus,
      multBonus: totalMultBonus,
      multMultiplier: totalMultMultiplier,
      effects
    };
  }

  /**
   * 处理回合结束
   */
  static processEndRound(jokerSlots: JokerSlots, gameState?: { money: number; interestCap: number; hands: number; discards: number }, defeatedBoss?: boolean): {
    moneyBonus: number;
    effects: JokerEffectDetail[];
    destroyedJokers: number[];
  } {
    let totalMoneyBonus = 0;
    const effects: JokerEffectDetail[] = [];
    const destroyedJokers: number[] = [];

    const context: JokerEffectContext = { gameState, defeatedBoss };
    const jokers = jokerSlots.getJokers();

    for (let i = jokers.length - 1; i >= 0; i--) {
      const joker = jokers[i];
      if (!joker.onEndRound) continue;

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.onEndRound(context);

      // 处理状态更新
      if (result.stateUpdate) {
        joker.updateState(result.stateUpdate);
      }

      // 处理自我摧毁
      if (result.destroySelf) {
        destroyedJokers.push(i);
        jokerSlots.removeJoker(i);
      }

      // 处理摧毁右侧小丑
      if (result.destroyRightJoker && i < jokers.length - 1) {
        const rightIndex = i + 1;
        destroyedJokers.push(rightIndex);
        jokerSlots.removeJoker(rightIndex);
      }

      // 处理摧毁随机小丑（不包括自己）
      if (result.destroyRandomJoker && jokers.length > 1) {
        const otherIndices = jokers.map((_, idx) => idx).filter(idx => idx !== i);
        const randomIndex = otherIndices[Math.floor(Math.random() * otherIndices.length)];
        destroyedJokers.push(randomIndex);
        jokerSlots.removeJoker(randomIndex);
      }

      if (result.moneyBonus || result.message) {
        totalMoneyBonus += result.moneyBonus || 0;

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          moneyBonus: result.moneyBonus
        });
      }
    }

    return {
      moneyBonus: totalMoneyBonus,
      effects,
      destroyedJokers
    };
  }

  /**
   * 处理卡牌添加到牌库
   */
  static processCardAdded(
    jokerSlots: JokerSlots,
    card: Card
  ): {
    effects: JokerEffectDetail[];
  } {
    const effects: JokerEffectDetail[] = [];

    const context: JokerEffectContext = {
      card
    };

    for (const joker of jokerSlots.getJokers()) {
      if (!joker.onCardAdded) continue;
      const result = joker.onCardAdded(context);

      if (result.message) {
        effects.push({
          jokerName: joker.name,
          effect: result.message
        });
      }
    }

    return {
      effects
    };
  }

  /**
   * 处理重Roll
   */
  static processReroll(jokerSlots: JokerSlots): {
    freeReroll: boolean;
    effects: JokerEffectDetail[];
  } {
    let hasFreeReroll = false;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    for (const joker of jokers) {
      if (!joker.onReroll) continue;

      const context: JokerEffectContext = {
        ...this.createPositionContext(jokerSlots, jokers.indexOf(joker))
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.onReroll(context);

      // 处理状态更新
      if (result.stateUpdate) {
        joker.updateState(result.stateUpdate);
      }

      if (result.freeReroll || result.message) {
        if (result.freeReroll) {
          hasFreeReroll = true;
        }

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果'
        });
      }
    }

    return {
      freeReroll: hasFreeReroll,
      effects
    };
  }

  /**
   * 处理盲注选择
   */
  static processBlindSelect(
    jokerSlots: JokerSlots,
    blindType?: string
  ): {
    tarotBonus: number;
    jokerBonus: number;
    handBonus: number;
    discardReset: boolean;
    multMultiplier: number;
    multBonus: number;
    effects: JokerEffectDetail[];
  } {
    let totalTarotBonus = 0;
    let totalJokerBonus = 0;
    let totalHandBonus = 0;
    let hasDiscardReset = false;
    let totalMultMultiplier = 1;
    let totalMultBonus = 0;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (!joker.onBlindSelect) continue;

      const context: JokerEffectContext = {
        blindType,
        jokerSlots: jokerSlots as unknown,
        ...this.createPositionContext(jokerSlots, i)
      };

      const result = joker.onBlindSelect(context);

      if (result.tarotBonus) {
        totalTarotBonus += result.tarotBonus;
      }
      if (result.jokerBonus) {
        totalJokerBonus += result.jokerBonus;
      }
      if (result.handBonus) {
        totalHandBonus += result.handBonus;
      }
      if (result.discardReset) {
        hasDiscardReset = true;
      }
      if (result.multMultiplier) {
        totalMultMultiplier *= result.multMultiplier;
      }
      if (result.multBonus) {
        totalMultBonus += result.multBonus;
      }

      if (result.message) {
        effects.push({
          jokerName: joker.name,
          effect: result.message,
          multMultiplier: result.multMultiplier
        });
      }
    }

    return {
      tarotBonus: totalTarotBonus,
      jokerBonus: totalJokerBonus,
      handBonus: totalHandBonus,
      discardReset: hasDiscardReset,
      multMultiplier: totalMultMultiplier,
      multBonus: totalMultBonus,
      effects
    };
  }

  /**
   * 处理离开商店
   * 处理 ON_SHOP_EXIT 触发器的小丑牌效果（如佩尔科）
   */
  static processShopExit(
    jokerSlots: JokerSlots,
    consumables: unknown[]
  ): {
    effects: JokerEffectDetail[];
    copiedConsumableId?: string;
  } {
    const effects: JokerEffectDetail[] = [];
    let copiedConsumableId: string | undefined;

    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (joker.trigger !== 'on_shop_exit') continue;

      const context: JokerEffectContext = {
        consumables,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.effect(context);

      if (result.message) {
        effects.push({
          jokerName: joker.name,
          effect: result.message
        });
      }

      // 处理佩尔科的复制效果
      if (result.copiedConsumableId) {
        copiedConsumableId = result.copiedConsumableId;
      }

      this.applyEffectResult(joker, result);
    }

    return {
      effects,
      copiedConsumableId
    };
  }

  /**
   * 处理弃牌
   */
  static processDiscard(
    jokerSlots: JokerSlots,
    discardedCards: readonly Card[],
    handsPlayed: number
  ): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    moneyBonus: number;
    effects: JokerEffectDetail[];
  } {
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    let totalMoneyBonus = 0;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (!joker.onDiscard) continue;

      const context: JokerEffectContext = {
        discardedCards,
        handsPlayed,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.onDiscard(context);

      if (result.chipBonus || result.multBonus || result.multMultiplier || result.moneyBonus || result.message) {
        totalChipBonus += result.chipBonus || 0;
        totalMultBonus += result.multBonus || 0;
        if (result.multMultiplier) {
          totalMultMultiplier *= result.multMultiplier;
        }
        totalMoneyBonus += result.moneyBonus || 0;

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          chipBonus: result.chipBonus,
          multBonus: result.multBonus,
          multMultiplier: result.multMultiplier,
          moneyBonus: result.moneyBonus
        });
      }

      this.applyEffectResult(joker, result);
    }

    return {
      chipBonus: totalChipBonus,
      multBonus: totalMultBonus,
      multMultiplier: totalMultMultiplier,
      moneyBonus: totalMoneyBonus,
      effects
    };
  }

  /**
   * 处理手牌中效果
   */
  static processHeld(jokerSlots: JokerSlots, heldCards: readonly Card[]): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
  } {
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    const effects: JokerEffectDetail[] = [];

    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];
      if (!joker.onHeld) continue;

      const context: JokerEffectContext = {
        heldCards,
        ...this.createPositionContext(jokerSlots, i)
      };

      const result = joker.onHeld(context);

      if (result.chipBonus || result.multBonus || result.multMultiplier || result.message) {
        totalChipBonus += result.chipBonus || 0;
        totalMultBonus += result.multBonus || 0;
        if (result.multMultiplier) {
          totalMultMultiplier *= result.multMultiplier;
        }

        effects.push({
          jokerName: joker.name,
          effect: result.message || '触发效果',
          chipBonus: result.chipBonus,
          multBonus: result.multBonus,
          multMultiplier: result.multMultiplier
        });
      }
    }

    return {
      chipBonus: totalChipBonus,
      multBonus: totalMultBonus,
      multMultiplier: totalMultMultiplier,
      effects
    };
  }

  /**
   * 计算最终得分
   */
  static calculateFinalScore(
    jokerSlots: JokerSlots,
    baseResult: ScoreResult,
    scoredCards: readonly Card[],
    handType: PokerHandType,
    gameState?: { money: number; interestCap: number; hands: number; discards: number },
    handsPlayed?: number,
    discardsUsed?: number,
    deckSize?: number,
    initialDeckSize?: number,
    handsRemaining?: number, // 剩余手牌数（用于acrobat等）
    mostPlayedHand?: PokerHandType | null // 最常出的牌型（用于obelisk）
  ): ProcessedScoreResult {
    const jokerEffects: JokerEffectDetail[] = [];
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    let totalMoneyEarned = 0;

    const jokers = jokerSlots.getJokers();

    console.log('[JokerSystem] calculateFinalScore开始, 小丑数量:', jokers.length);
    console.log('[JokerSystem] 小丑列表:', jokers.map(j => ({ id: j.id, name: j.name, trigger: j.trigger, edition: j.edition })));

    // 应用小丑牌版本效果 (Foil/Holographic/Polychrome)
    for (const joker of jokers) {
      const editionEffects = joker.getEditionEffects();
      if (editionEffects.chipBonus > 0 || editionEffects.multBonus > 0 || editionEffects.multMultiplier !== 1) {
        totalChipBonus += editionEffects.chipBonus;
        totalMultBonus += editionEffects.multBonus;
        totalMultMultiplier *= editionEffects.multMultiplier;

        let effectDesc = '';
        if (joker.edition === 'foil') effectDesc = '闪箔 (+50筹码)';
        else if (joker.edition === 'holographic') effectDesc = '全息 (+10倍率)';
        else if (joker.edition === 'polychrome') effectDesc = '多彩 (×1.5倍率)';

        if (effectDesc) {
          jokerEffects.push({
            jokerName: joker.name,
            effect: effectDesc,
            chipBonus: editionEffects.chipBonus > 0 ? editionEffects.chipBonus : undefined,
            multBonus: editionEffects.multBonus > 0 ? editionEffects.multBonus : undefined,
            multMultiplier: editionEffects.multMultiplier !== 1 ? editionEffects.multMultiplier : undefined
          });
        }
      }
    }

    const onPlayResult = this.processOnPlay(jokerSlots);
    console.log('[JokerSystem] processOnPlay结果:', { chipBonus: onPlayResult.chipBonus, multBonus: onPlayResult.multBonus, multMultiplier: onPlayResult.multMultiplier });
    totalChipBonus += onPlayResult.chipBonus;
    totalMultBonus += onPlayResult.multBonus;
    totalMultMultiplier *= onPlayResult.multMultiplier;
    jokerEffects.push(...onPlayResult.effects);

    const scoredResult = this.processScoredCards(
      jokerSlots,
      scoredCards,
      handType,
      baseResult.totalChips,
      baseResult.totalMultiplier
    );
    console.log('[JokerSystem] processScoredCards结果:', { chipBonus: scoredResult.chipBonus, multBonus: scoredResult.multBonus, multMultiplier: scoredResult.multMultiplier });
    totalChipBonus += scoredResult.chipBonus;
    totalMultBonus += scoredResult.multBonus;
    totalMultMultiplier *= scoredResult.multMultiplier;
    jokerEffects.push(...scoredResult.effects);

    console.log('[JokerSystem] 调用processHandPlayed前, handType:', handType);
    const handPlayedResult = this.processHandPlayed(
      jokerSlots,
      scoredCards,
      handType,
      baseResult.totalChips + totalChipBonus,
      baseResult.totalMultiplier + totalMultBonus,
      gameState,
      handsPlayed,
      discardsUsed,
      deckSize,
      initialDeckSize,
      handsRemaining,
      mostPlayedHand
    );
    console.log('[JokerSystem] processHandPlayed结果:', { chipBonus: handPlayedResult.chipBonus, multBonus: handPlayedResult.multBonus, multMultiplier: handPlayedResult.multMultiplier, effects: handPlayedResult.effects });
    totalChipBonus += handPlayedResult.chipBonus;
    totalMultBonus += handPlayedResult.multBonus;
    totalMultMultiplier *= handPlayedResult.multMultiplier;
    jokerEffects.push(...handPlayedResult.effects);

    // 修复: 正确的Balatro算分逻辑
    // 最终筹码 = 基础筹码 + 筹码加成
    // 最终倍率 = (基础倍率 + 倍率加成) × 倍率乘数
    // 最终得分 = 最终筹码 × 最终倍率
    const finalChips = baseResult.totalChips + totalChipBonus;
    const finalMult = (baseResult.totalMultiplier + totalMultBonus) * totalMultMultiplier;
    const finalScore = Math.floor(finalChips * finalMult);
    console.log('[JokerSystem] 最终计算:', { finalChips, finalMult, finalScore, totalMultMultiplier });

    return {
      ...baseResult,
      totalScore: finalScore,
      chipBonus: baseResult.chipBonus + totalChipBonus,
      multBonus: baseResult.multBonus + totalMultBonus,
      totalChips: Math.floor(finalChips),
      totalMultiplier: finalMult, // 保留小数倍率，支持Polychrome等效果
      jokerEffects,
      totalMoneyEarned
    };
  }

  /**
   * 获取小丑牌信息
   */
  static getJokerInfo(jokerSlots: JokerSlots): string {
    const lines: string[] = [];
    const jokers = jokerSlots.getJokers();
    const maxSlots = jokerSlots.getMaxSlots();

    lines.push(`=== 小丑牌槽位 (${jokers.length}/${maxSlots}) ===`);

    if (jokers.length === 0) {
      lines.push('无小丑牌');
    } else {
      for (let i = 0; i < jokers.length; i++) {
        const joker = jokers[i];
        lines.push(`${i + 1}. ${joker.name} - ${joker.description}`);
      }
    }

    const interestCapBonus = jokerSlots.getInterestCapBonus();
    if (interestCapBonus > 0) {
      lines.push(`\n利息上限加成: +${interestCapBonus}`);
    }

    return lines.join('\n');
  }
}
