import { JokerInterface, JokerEffectContext, JokerEffectResult, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { PokerHandType } from '../types/pokerHands';
import { ScoreResult } from './ScoringSystem';
import { createModuleLogger } from '../utils/logger';
import { JokerSlots } from '../models/JokerSlots';
import { CopyEffectHelper } from './CopyEffectHelper';

const logger = createModuleLogger('JokerSystem');

/**
 * 效果累加器接口
 */
interface EffectAccumulator {
  chipBonus: number;
  multBonus: number;
  multMultiplier: number;
  moneyBonus: number;
  tarotBonus: number;
  jokerBonus: number;
  handBonus: number;
  freeReroll: boolean;
  discardReset: boolean;
  heldCardRetrigger: boolean;
  effects: JokerEffectDetail[];
  copiedConsumableIds: string[];
}

/**
 * 复制效果类型
 */
type CopyType = 'blueprint' | 'brainstorm';

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
  static sellJoker(jokerSlots: JokerSlots, index: number): { success: boolean; sellPrice?: number; error?: string; copiedJokerId?: string } {
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

    // 处理出售时的回调（隐形小丑）
    let copiedJokerId: string | undefined;
    if (joker.onSell) {
      const context: JokerEffectContext = {
        ...this.createPositionContext(jokerSlots, index),
        jokerState: joker.state
      };
      const result = joker.onSell(context);
      if (result.copiedJokerId) {
        copiedJokerId = result.copiedJokerId;
        logger.info('Invisible Joker copied joker on sell', { copiedJokerId });
      }
    }

    // 移除小丑牌
    jokerSlots.removeJoker(index);
    logger.info('Joker sold', {
      jokerId: joker.id,
      jokerName: joker.name,
      sellPrice,
      copiedJokerId
    });

    return { success: true, sellPrice, copiedJokerId };
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
   * 创建默认的效果累加器
   */
  private static createEffectAccumulator(): EffectAccumulator {
    return {
      chipBonus: 0,
      multBonus: 0,
      multMultiplier: 1,
      moneyBonus: 0,
      tarotBonus: 0,
      jokerBonus: 0,
      handBonus: 0,
      freeReroll: false,
      discardReset: false,
      heldCardRetrigger: false,
      effects: [],
      copiedConsumableIds: []
    };
  }

  /**
   * 处理单个小丑的效果并累加结果
   * @param joker 小丑牌
   * @param callback 回调函数
   * @param context 效果上下文
   * @param accumulator 结果累加器
   * @param effectPrefix 效果消息前缀（用于复制效果）
   */
  private static processJokerEffect(
    joker: JokerInterface,
    callback: ((context: JokerEffectContext) => JokerEffectResult) | undefined,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    effectPrefix?: string
  ): void {
    if (!callback) return;

    const result = callback.call(joker, context);

    // 累加各种奖励值
    if (result.chipBonus) accumulator.chipBonus += result.chipBonus;
    if (result.multBonus) accumulator.multBonus += result.multBonus;
    if (result.multMultiplier) accumulator.multMultiplier *= result.multMultiplier;
    if (result.moneyBonus) accumulator.moneyBonus += result.moneyBonus;
    if (result.tarotBonus) accumulator.tarotBonus += result.tarotBonus;
    if (result.jokerBonus) accumulator.jokerBonus += result.jokerBonus;
    if (result.handBonus) accumulator.handBonus += result.handBonus;
    if (result.freeReroll) accumulator.freeReroll = true;
    if (result.discardReset) accumulator.discardReset = true;
    if (result.heldCardRetrigger) accumulator.heldCardRetrigger = true;

    // 处理特殊效果
    if (result.copiedConsumableId) accumulator.copiedConsumableIds.push(result.copiedConsumableId);

    // 添加效果消息
    const hasEffect = result.chipBonus || result.multBonus || result.multMultiplier ||
                      result.moneyBonus || result.tarotBonus || result.jokerBonus ||
                      result.handBonus || result.message;

    if (hasEffect) {
      accumulator.effects.push({
        jokerName: joker.name,
        effect: effectPrefix ? `${effectPrefix}${result.message || '触发效果'}` : (result.message || '触发效果'),
        chipBonus: result.chipBonus,
        multBonus: result.multBonus,
        multMultiplier: result.multMultiplier,
        moneyBonus: result.moneyBonus
      });
    }

    // 处理状态更新
    if (result.stateUpdate) {
      joker.updateState(result.stateUpdate);
    }
  }

  /**
   * 处理复制效果（蓝图或头脑风暴）
   * @param joker 复制小丑牌（蓝图或头脑风暴）
   * @param copyType 复制类型
   * @param callbackName 回调函数名称
   * @param context 效果上下文
   * @param accumulator 结果累加器
   * @param jokerIndex 当前小丑在槽位中的索引
   * @param jokers 所有小丑牌数组
   */
  private static processCopyEffect(
    joker: JokerInterface,
    copyType: CopyType,
    callbackName: keyof JokerInterface,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    jokerIndex: number,
    jokers: readonly JokerInterface[]
  ): void {
    // 获取目标小丑
    const targetJoker = copyType === 'blueprint'
      ? CopyEffectHelper.getBlueprintTarget(jokerIndex, jokers)
      : CopyEffectHelper.getBrainstormTarget(jokerIndex, jokers);

    if (!targetJoker) return;

    // 获取目标小丑的回调函数
    const callback = targetJoker[callbackName] as ((context: JokerEffectContext) => JokerEffectResult) | undefined;
    if (!callback) return;

    // 构建效果消息前缀
    const effectPrefix = copyType === 'blueprint'
      ? `蓝图复制 [${targetJoker.name}]: `
      : `头脑风暴复制 [${targetJoker.name}]: `;

    // 处理复制效果 - 注意：使用targetJoker作为this上下文
    const result = callback.call(targetJoker, context);

    // 累加各种奖励值
    if (result.chipBonus) accumulator.chipBonus += result.chipBonus;
    if (result.multBonus) accumulator.multBonus += result.multBonus;
    if (result.multMultiplier) accumulator.multMultiplier *= result.multMultiplier;
    if (result.moneyBonus) accumulator.moneyBonus += result.moneyBonus;
    if (result.tarotBonus) accumulator.tarotBonus += result.tarotBonus;
    if (result.jokerBonus) accumulator.jokerBonus += result.jokerBonus;
    if (result.handBonus) accumulator.handBonus += result.handBonus;
    if (result.freeReroll) accumulator.freeReroll = true;
    if (result.discardReset) accumulator.discardReset = true;
    if (result.heldCardRetrigger) accumulator.heldCardRetrigger = true;

    // 处理特殊效果
    if (result.copiedConsumableId) accumulator.copiedConsumableIds.push(result.copiedConsumableId);

    // 添加效果消息
    const hasEffect = result.chipBonus || result.multBonus || result.multMultiplier ||
                      result.moneyBonus || result.tarotBonus || result.jokerBonus ||
                      result.handBonus || result.message;

    if (hasEffect) {
      accumulator.effects.push({
        jokerName: joker.name,
        effect: effectPrefix + (result.message || '触发效果'),
        chipBonus: result.chipBonus,
        multBonus: result.multBonus,
        multMultiplier: result.multMultiplier,
        moneyBonus: result.moneyBonus
      });
    }

    // 处理状态更新 - 复制效果只更新复制小丑的状态
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        scoredCards,
        handType,
        currentChips,
        currentMult,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onScored 效果
      this.processJokerEffect(joker, joker.onScored, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onScored', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onScored', context, accumulator, i, jokers);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      effects: accumulator.effects
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    console.log('[JokerSystem] processHandPlayed循环开始, 小丑数量:', jokers.length);
    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

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

      // 1. 处理小丑自身的 onHandPlayed 效果
      if ('onHandPlayed' in joker && typeof (joker as any).onHandPlayed === 'function') {
        console.log(`[JokerSystem] 调用小丑[${i}] onHandPlayed, handType:`, handType);
        this.processJokerEffect(joker, joker.onHandPlayed, context, accumulator);
      }

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onHandPlayed', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onHandPlayed', context, accumulator, i, jokers);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      effects: accumulator.effects
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onPlay 效果
      this.processJokerEffect(joker, joker.onPlay, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onPlay', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onPlay', context, accumulator, i, jokers);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      effects: accumulator.effects
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

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onEndRound 效果
      if (joker.onEndRound) {
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

      // 注意：根据官方规则，蓝图和头脑风暴不复制回合结束效果
      // 回合结束效果（如金色小丑给钱、蛋增加售价等）不被复制
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        card,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onCardAdded 效果
      this.processJokerEffect(joker, joker.onCardAdded, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onCardAdded', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onCardAdded', context, accumulator, i, jokers);
      }
    }

    return {
      effects: accumulator.effects
    };
  }

  /**
   * 处理重Roll
   */
  static processReroll(jokerSlots: JokerSlots): {
    freeReroll: boolean;
    effects: JokerEffectDetail[];
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onReroll 效果
      this.processJokerEffect(joker, joker.onReroll, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onReroll', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onReroll', context, accumulator, i, jokers);
      }
    }

    return {
      freeReroll: accumulator.freeReroll,
      effects: accumulator.effects
    };
  }

  /**
   * 处理盲注选择
   * 处理 ON_BLIND_SELECT 触发器的小丑牌效果
   * 同时处理蓝图和头脑风暴的复制效果
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        blindType,
        jokerSlots: jokerSlots as unknown,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onBlindSelect 效果
      this.processJokerEffect(joker, joker.onBlindSelect, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onBlindSelect', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onBlindSelect', context, accumulator, i, jokers);
      }
    }

    return {
      tarotBonus: accumulator.tarotBonus,
      jokerBonus: accumulator.jokerBonus,
      handBonus: accumulator.handBonus,
      discardReset: accumulator.discardReset,
      multMultiplier: accumulator.multMultiplier,
      multBonus: accumulator.multBonus,
      effects: accumulator.effects
    };
  }

  /**
   * 处理离开商店
   * 处理 ON_SHOP_EXIT 触发器的小丑牌效果（如佩尔科）
   * 同时处理蓝图和头脑风暴的复制效果
   */
  static processShopExit(
    jokerSlots: JokerSlots,
    consumables: unknown[]
  ): {
    effects: JokerEffectDetail[];
    copiedConsumableIds: string[];
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        consumables,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 ON_SHOP_EXIT 效果
      if (joker.trigger === 'on_shop_exit' && joker.effect) {
        this.processJokerEffect(joker, joker.effect, context, accumulator);
      }

      // 2. 处理蓝图的复制效果（复制右侧小丑）
      if (joker.id === 'blueprint') {
        const targetJoker = CopyEffectHelper.getBlueprintTarget(i, jokers);
        if (targetJoker && targetJoker.trigger === 'on_shop_exit' && targetJoker.effect) {
          const effectPrefix = `蓝图复制 [${targetJoker.name}]: `;
          this.processJokerEffect(joker, targetJoker.effect, context, accumulator, effectPrefix);
        }
      }

      // 3. 处理头脑风暴的复制效果（复制最左侧小丑）
      if (joker.id === 'brainstorm') {
        const targetJoker = CopyEffectHelper.getBrainstormTarget(i, jokers);
        if (targetJoker && targetJoker.trigger === 'on_shop_exit' && targetJoker.effect) {
          const effectPrefix = `头脑风暴复制 [${targetJoker.name}]: `;
          this.processJokerEffect(joker, targetJoker.effect, context, accumulator, effectPrefix);
        }
      }
    }

    return {
      effects: accumulator.effects,
      copiedConsumableIds: accumulator.copiedConsumableIds
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
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        discardedCards,
        handsPlayed,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onDiscard 效果
      this.processJokerEffect(joker, joker.onDiscard, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onDiscard', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onDiscard', context, accumulator, i, jokers);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      moneyBonus: accumulator.moneyBonus,
      effects: accumulator.effects
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
    heldCardRetrigger: boolean; // 哑剧演员效果：手牌能力触发2次
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        heldCards,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 0. 处理独立触发器的小丑（如哑剧演员）
      if (joker.trigger === JokerTrigger.ON_INDEPENDENT && joker.effect) {
        const result = joker.effect(context);

        // 检查是否有heldCardRetrigger效果（哑剧演员）
        if (result.heldCardRetrigger) {
          accumulator.heldCardRetrigger = true;
        }

        if (result.message) {
          accumulator.effects.push({
            jokerName: joker.name,
            effect: result.message,
            chipBonus: result.chipBonus,
            multBonus: result.multBonus,
            multMultiplier: result.multMultiplier
          });
        }

        this.applyEffectResult(joker, result);
      }

      // 1. 处理小丑自身的 onHeld 效果
      this.processJokerEffect(joker, joker.onHeld, context, accumulator);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onHeld', context, accumulator, i, jokers);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onHeld', context, accumulator, i, jokers);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      effects: accumulator.effects,
      heldCardRetrigger: accumulator.heldCardRetrigger
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
    handsRemaining?: number,
    mostPlayedHand?: PokerHandType | null
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
      totalMultiplier: finalMult,
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
