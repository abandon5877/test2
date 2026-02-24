import { JokerInterface, JokerEffectContext, JokerEffectResult, JokerTrigger } from '../types/joker';
import { Card } from '../models/Card';
import { PokerHandType } from '../types/pokerHands';
import { ScoreResult } from './ScoringSystem';
import { createModuleLogger } from '../utils/logger';
import { JokerSlots } from '../models/JokerSlots';
import { CopyEffectHelper } from './CopyEffectHelper';
import { PokerHandDetector } from './PokerHandDetector';
import { ProbabilitySystem } from './ProbabilitySystem';
import { ConsumableSlots } from '../models/ConsumableSlots';
import { setGrosMichelDestroyed } from '../data/jokers';

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
  copyScoredCardToDeck: boolean;
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
  copyScoredCardToDeck?: boolean;
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
   * 检查是否有Smeared_Joker
   */
  private static hasSmearedJoker(jokers: readonly JokerInterface[]): boolean {
    return jokers.some(joker => joker.id === 'smeared_joker');
  }

  /**
   * 计算Oops!_All_6s的数量
   */
  private static countOopsAll6s(jokers: readonly JokerInterface[]): number {
    return jokers.filter(joker => joker.id === 'oops_all_6s').length;
  }

  /**
   * 检查是否有幻想性错觉（Pareidolia）
   * 幻想性错觉效果：所有牌都视为人头牌
   */
  static hasPareidolia(jokers: readonly JokerInterface[]): boolean {
    return jokers.some(joker => joker.id === 'pareidolia');
  }

  /**
   * 判断一张牌是否视为人头牌（考虑到幻想性错觉效果）
   * @param card 要判断的牌
   * @param jokers 当前的小丑牌列表
   * @returns 是否视为人头牌
   */
  static isFaceCard(card: Card, jokers: readonly JokerInterface[]): boolean {
    // 如果持有幻想性错觉，所有牌都视为人头牌
    if (this.hasPareidolia(jokers)) {
      return true;
    }
    // 否则使用牌的原始判断
    return card.isFaceCard;
  }

  /**
   * 设置全局系统配置（包括Smeared_Joker、Four_Fingers、Oops!_All_6s等效果）
   */
  static setGlobalConfig(jokerSlots: JokerSlots): void {
    const jokers = jokerSlots.getJokers();
    const hasSmearedJoker = this.hasSmearedJoker(jokers);
    const hasFourFingers = jokers.some(joker => joker.id === 'four_fingers');
    const hasShortcut = jokers.some(joker => joker.id === 'shortcut');
    const oopsAll6sCount = this.countOopsAll6s(jokers);

    // 设置PokerHandDetector配置
    PokerHandDetector.setConfig({
      smearedJoker: hasSmearedJoker,
      fourFingers: hasFourFingers,
      shortcut: hasShortcut
    });

    // 设置概率系统配置
    ProbabilitySystem.setOopsAll6sCount(oopsAll6sCount);

    logger.debug('全局配置已更新', {
      smearedJoker: hasSmearedJoker,
      fourFingers: hasFourFingers,
      shortcut: hasShortcut,
      oopsAll6sCount
    });
  }

  /**
   * 限制消耗牌生成数量（根据槽位可用空间）
   * @param result 小丑牌效果结果
   * @param consumableSlots 消耗牌槽位
   * @returns 限制后的结果
   */
  static clampConsumableGeneration(
    result: JokerEffectResult,
    consumableSlots: ConsumableSlots
  ): JokerEffectResult {
    if (!result) return result;

    const availableSlots = consumableSlots.getAvailableSlots();
    let clampedResult = { ...result };
    let wasClamped = false;

    // 限制塔罗牌生成
    if (result.tarotBonus && result.tarotBonus > 0) {
      const clampedTarot = Math.min(result.tarotBonus, availableSlots);
      if (clampedTarot !== result.tarotBonus) {
        clampedResult.tarotBonus = clampedTarot;
        wasClamped = true;
        logger.debug('塔罗牌生成被限制', {
          requested: result.tarotBonus,
          allowed: clampedTarot,
          availableSlots
        });
      }
    }

    // 限制幻灵牌生成
    if (result.spectralBonus && result.spectralBonus > 0) {
      const clampedSpectral = Math.min(result.spectralBonus, availableSlots);
      if (clampedSpectral !== result.spectralBonus) {
        clampedResult.spectralBonus = clampedSpectral;
        wasClamped = true;
        logger.debug('幻灵牌生成被限制', {
          requested: result.spectralBonus,
          allowed: clampedSpectral,
          availableSlots
        });
      }
    }

    // 限制行星牌生成
    if (result.planetBonus && result.planetBonus > 0) {
      const clampedPlanet = Math.min(result.planetBonus, availableSlots);
      if (clampedPlanet !== result.planetBonus) {
        clampedResult.planetBonus = clampedPlanet;
        wasClamped = true;
        logger.debug('行星牌生成被限制', {
          requested: result.planetBonus,
          allowed: clampedPlanet,
          availableSlots
        });
      }
    }

    // 如果全部被限制为0，清空消息
    if (wasClamped &&
        (clampedResult.tarotBonus === 0 || clampedResult.tarotBonus === undefined) &&
        (clampedResult.spectralBonus === 0 || clampedResult.spectralBonus === undefined) &&
        (clampedResult.planetBonus === 0 || clampedResult.planetBonus === undefined)) {
      clampedResult.message = undefined;
    }

    return clampedResult;
  }

  /**
   * 出售小丑牌
   */
  static sellJoker(jokerSlots: JokerSlots, index: number): { success: boolean; sellPrice?: number; error?: string; copiedJokerId?: string } {
    const jokers = jokerSlots.getJokers();

    console.log(`[JokerSystem.sellJoker] 开始出售小丑牌, index: ${index}, 小丑总数: ${jokers.length}`);

    if (index < 0 || index >= jokers.length) {
      logger.warn('Cannot sell joker: invalid index', { index, count: jokers.length });
      console.log(`[JokerSystem.sellJoker] 失败: 无效的索引 ${index}`);
      return { success: false, error: 'Invalid joker index' };
    }

    const joker = jokers[index];
    console.log(`[JokerSystem.sellJoker] 小丑牌信息: id=${joker.id}, name=${joker.name}, sticker=${joker.sticker}, edition=${joker.edition}, sellValueBonus=${joker.sellValueBonus}`);

    // 检查是否为永恒贴纸（无法出售）
    if (joker.sticker === 'eternal') {
      logger.warn('Cannot sell joker: eternal sticker', { jokerId: joker.id });
      console.log(`[JokerSystem.sellJoker] 失败: 永恒贴纸无法出售`);
      return { success: false, error: 'Eternal joker cannot be sold' };
    }

    // 使用小丑牌的getSellPrice方法计算售价（包含礼品卡加成）
    const sellPrice = joker.getSellPrice();
    console.log(`[JokerSystem.sellJoker] 计算售价: baseCost=${joker.cost}, sellValueBonus=${joker.sellValueBonus}, finalSellPrice=${sellPrice}`);

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
    console.log(`[JokerSystem.sellJoker] 小丑牌已移除, index: ${index}`);
    logger.info('Joker sold', {
      jokerId: joker.id,
      jokerName: joker.name,
      sellPrice,
      copiedJokerId
    });

    // 更新Campfire状态：每卖出一张牌，Campfire的cardsSold+1
    this.updateCampfireOnCardSold(jokerSlots);

    console.log(`[JokerSystem.sellJoker] 出售成功: sellPrice=${sellPrice}, copiedJokerId=${copiedJokerId}`);
    return { success: true, sellPrice, copiedJokerId };
  }

  /**
   * 更新Campfire状态：当卡牌被出售时
   */
  private static updateCampfireOnCardSold(jokerSlots: JokerSlots): void {
    const jokers = jokerSlots.getJokers();
    for (const joker of jokers) {
      if (joker.id === 'campfire') {
        const currentCardsSold = (joker.state?.cardsSold as number) || 0;
        joker.updateState({ cardsSold: currentCardsSold + 1 });
        logger.info('Campfire updated', { cardsSold: currentCardsSold + 1 });
      }
    }
  }

  /**
   * 创建位置上下文
   */
  private static createPositionContext(jokerSlots: JokerSlots, jokerIndex: number): Pick<JokerEffectContext, 'jokerPosition' | 'allJokers' | 'leftJokers' | 'rightJokers' | 'leftmostJoker' | 'rightmostJoker' | 'smearedJoker' | 'allCardsAreFace'> {
    const allJokers = [...jokerSlots.getJokers()];
    const leftJokers = allJokers.slice(0, jokerIndex);
    const rightJokers = allJokers.slice(jokerIndex + 1);

    return {
      jokerPosition: jokerIndex,
      allJokers,
      leftJokers,
      rightJokers,
      leftmostJoker: allJokers[0],
      rightmostJoker: allJokers[allJokers.length - 1],
      smearedJoker: this.hasSmearedJoker(allJokers),
      allCardsAreFace: this.hasPareidolia(allJokers)
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
      copyScoredCardToDeck: false,
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
   * @param consumableSlots 消耗牌槽位（可选）
   * @param isPreview 是否为预览模式（预览时不更新状态）
   */
  private static processJokerEffect(
    joker: JokerInterface,
    callback: ((context: JokerEffectContext) => JokerEffectResult) | undefined,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    effectPrefix?: string,
    consumableSlots?: ConsumableSlots,
    isPreview = false
  ): void {
    if (!callback) return;

    // 预览模式下跳过概率触发类小丑牌的效果
    if (isPreview && joker.isProbability) {
      return;
    }

    let result = callback.call(joker, context);

    // 应用消耗牌槽位限制
    if (consumableSlots && result) {
      result = this.clampConsumableGeneration(result, consumableSlots);
    }

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
    if (result.copyScoredCardToDeck) accumulator.copyScoredCardToDeck = true;

    // 处理特殊效果
    if (result.copiedConsumableId) accumulator.copiedConsumableIds.push(result.copiedConsumableId);

    // 添加效果消息（只在有实际效果时添加）
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

    // 处理状态更新（预览模式下不更新状态）
    if (result.stateUpdate && !isPreview) {
      joker.updateState(result.stateUpdate);
    }
  }

  /**
   * 处理单个小丑的效果并累加结果，返回结果对象
   * @param joker 小丑牌
   * @param callback 回调函数
   * @param context 效果上下文
   * @param accumulator 结果累加器
   * @param effectPrefix 效果消息前缀（用于复制效果）
   * @param consumableSlots 消耗牌槽位（可选）
   * @param isPreview 是否为预览模式（预览时不更新状态）
   * @returns 效果结果对象
   */
  private static processJokerEffectWithResult(
    joker: JokerInterface,
    callback: ((context: JokerEffectContext) => JokerEffectResult) | undefined,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    effectPrefix?: string,
    consumableSlots?: ConsumableSlots,
    isPreview = false
  ): JokerEffectResult | undefined {
    if (!callback) return undefined;

    // 预览模式下跳过概率触发类小丑牌的效果
    if (isPreview && joker.isProbability) {
      return undefined;
    }

    let result = callback.call(joker, context);

    // 应用消耗牌槽位限制
    if (consumableSlots && result) {
      result = this.clampConsumableGeneration(result, consumableSlots);
    }

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
    if (result.copyScoredCardToDeck) accumulator.copyScoredCardToDeck = true;

    // 处理特殊效果
    if (result.copiedConsumableId) accumulator.copiedConsumableIds.push(result.copiedConsumableId);

    // 添加效果消息（只在有实际效果时添加）
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

    // 处理状态更新（预览模式下不更新状态）
    if (result.stateUpdate && !isPreview) {
      joker.updateState(result.stateUpdate);
    }

    return result;
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
   * @param consumableSlots 消耗牌槽位（可选）
   * @param isPreview 是否为预览模式（预览时不更新状态）
   */
  private static processCopyEffect(
    joker: JokerInterface,
    copyType: CopyType,
    callbackName: keyof JokerInterface,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    jokerIndex: number,
    jokers: readonly JokerInterface[],
    consumableSlots?: ConsumableSlots,
    isPreview = false
  ): void {
    // 获取目标小丑
    const targetJoker = copyType === 'blueprint'
      ? CopyEffectHelper.getBlueprintTarget(jokerIndex, jokers)
      : CopyEffectHelper.getBrainstormTarget(jokerIndex, jokers);

    if (!targetJoker) return;

    // 预览模式下跳过概率触发类小丑牌的效果
    if (isPreview && targetJoker.isProbability) {
      return;
    }

    // 获取目标小丑的回调函数
    const callback = targetJoker[callbackName] as ((context: JokerEffectContext) => JokerEffectResult) | undefined;
    if (!callback) return;

    // 构建效果消息前缀
    const effectPrefix = copyType === 'blueprint'
      ? `蓝图复制 [${targetJoker.name}]: `
      : `头脑风暴复制 [${targetJoker.name}]: `;

    // 处理复制效果 - 注意：使用targetJoker作为this上下文
    let result = callback.call(targetJoker, context);

    // 应用消耗牌槽位限制
    if (consumableSlots && result) {
      result = this.clampConsumableGeneration(result, consumableSlots);
    }

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
    if (result.copyScoredCardToDeck) accumulator.copyScoredCardToDeck = true;

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

    // 处理状态更新 - 复制效果只更新复制小丑的状态（预览模式下不更新）
    if (result.stateUpdate && !isPreview) {
      joker.updateState(result.stateUpdate);
    }
  }

  /**
   * 处理复制效果（蓝图或头脑风暴），返回结果对象
   * @param joker 复制小丑牌（蓝图或头脑风暴）
   * @param copyType 复制类型
   * @param callbackName 回调函数名称
   * @param context 效果上下文
   * @param accumulator 结果累加器
   * @param jokerIndex 当前小丑在槽位中的索引
   * @param jokers 所有小丑牌数组
   * @param consumableSlots 消耗牌槽位（可选）
   * @param isPreview 是否为预览模式（预览时不更新状态）
   * @returns 效果结果对象
   */
  private static processCopyEffectWithResult(
    joker: JokerInterface,
    copyType: CopyType,
    callbackName: keyof JokerInterface,
    context: JokerEffectContext,
    accumulator: EffectAccumulator,
    jokerIndex: number,
    jokers: readonly JokerInterface[],
    consumableSlots?: ConsumableSlots,
    isPreview = false
  ): JokerEffectResult | undefined {
    // 获取目标小丑
    const targetJoker = copyType === 'blueprint'
      ? CopyEffectHelper.getBlueprintTarget(jokerIndex, jokers)
      : CopyEffectHelper.getBrainstormTarget(jokerIndex, jokers);

    if (!targetJoker) return undefined;

    // 预览模式下跳过概率触发类小丑牌的效果
    if (isPreview && targetJoker.isProbability) {
      return undefined;
    }

    // 获取目标小丑的回调函数
    const callback = targetJoker[callbackName] as ((context: JokerEffectContext) => JokerEffectResult) | undefined;
    if (!callback) return undefined;

    // 构建效果消息前缀
    const effectPrefix = copyType === 'blueprint'
      ? `蓝图复制 [${targetJoker.name}]: `
      : `头脑风暴复制 [${targetJoker.name}]: `;

    // 处理复制效果 - 注意：使用targetJoker作为this上下文
    let result = callback.call(targetJoker, context);

    // 应用消耗牌槽位限制
    if (consumableSlots && result) {
      result = this.clampConsumableGeneration(result, consumableSlots);
    }

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
    if (result.copyScoredCardToDeck) accumulator.copyScoredCardToDeck = true;

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

    // 处理状态更新 - 复制效果只更新复制小丑的状态（预览模式下不更新）
    if (result.stateUpdate && !isPreview) {
      joker.updateState(result.stateUpdate);
    }

    return result;
  }

  /**
   * 处理计分卡牌
   */
  static processScoredCards(
    jokerSlots: JokerSlots,
    scoredCards: readonly Card[],
    handType: PokerHandType,
    currentChips: number,
    currentMult: number,
    consumableSlots?: ConsumableSlots,
    isPreview = false
  ): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    moneyBonus: number;
    copyScoredCardToDeck: boolean;
    effects: JokerEffectDetail[];
    modifyScoredCards?: { card: Card; permanentBonusDelta: number }[];
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getActiveJokers();
    const allModifyScoredCards: { card: Card; permanentBonusDelta: number }[] = [];

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
      const result = this.processJokerEffectWithResult(joker, joker.onScored, context, accumulator, undefined, consumableSlots, isPreview);
      if (result?.modifyScoredCards) {
        allModifyScoredCards.push(...result.modifyScoredCards);
      }

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        const copyResult = this.processCopyEffectWithResult(joker, 'blueprint', 'onScored', context, accumulator, i, jokers, consumableSlots, isPreview);
        if (copyResult?.modifyScoredCards) {
          allModifyScoredCards.push(...copyResult.modifyScoredCards);
        }
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        const copyResult = this.processCopyEffectWithResult(joker, 'brainstorm', 'onScored', context, accumulator, i, jokers, consumableSlots, isPreview);
        if (copyResult?.modifyScoredCards) {
          allModifyScoredCards.push(...copyResult.modifyScoredCards);
        }
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      moneyBonus: accumulator.moneyBonus,
      copyScoredCardToDeck: accumulator.copyScoredCardToDeck,
      effects: accumulator.effects,
      modifyScoredCards: allModifyScoredCards.length > 0 ? allModifyScoredCards : undefined
    };
  }

  /**
   * 处理出牌
   * @param isPreview 是否为预览模式（预览时不更新状态）
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
    mostPlayedHand?: PokerHandType | null,
    consumableSlots?: ConsumableSlots,
    handTypeHistoryCount?: number,
    isPreview = false,
    playedCards?: readonly Card[] // 打出的所有牌（用于重影等效果）
  ): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    moneyBonus: number;
    copyScoredCardToDeck?: boolean;
    effects: JokerEffectDetail[];
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getActiveJokers();

    console.log('[JokerSystem] processHandPlayed循环开始, 小丑数量:', jokers.length, '预览模式:', isPreview);
    // 使用 playedCards（打出的所有牌）如果提供，否则使用 scoredCards（计分牌）
    const allPlayedCards = playedCards && playedCards.length > 0 ? playedCards : scoredCards;
    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        scoredCards: allPlayedCards, // 使用所有打出的牌，不只是计分牌
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
        handTypeHistoryCount,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      // 1. 处理小丑自身的 onHandPlayed 效果
      if ('onHandPlayed' in joker && typeof (joker as any).onHandPlayed === 'function') {
        console.log(`[JokerSystem] 调用小丑[${i}] onHandPlayed, handType:`, handType);
        this.processJokerEffect(joker, joker.onHandPlayed, context, accumulator, undefined, consumableSlots, isPreview);
      }

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onHandPlayed', context, accumulator, i, jokers, consumableSlots, isPreview);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onHandPlayed', context, accumulator, i, jokers, consumableSlots, isPreview);
      }
    }

    return {
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      moneyBonus: accumulator.moneyBonus,
      copyScoredCardToDeck: accumulator.copyScoredCardToDeck,
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
    const jokers = jokerSlots.getActiveJokers();

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
   * 处理刷新商店时效果（Flash Card等）
   */
  static processOnReroll(jokerSlots: JokerSlots): {
    multBonus: number;
    effects: JokerEffectDetail[];
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getActiveJokers();

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
      multBonus: accumulator.multBonus,
      effects: accumulator.effects
    };
  }

  /**
   * 处理回合结束
   */
  static processEndRound(jokerSlots: JokerSlots, gameState?: { money: number; interestCap: number; hands: number; discards: number }, defeatedBoss?: boolean, heldCards?: readonly Card[]): {
    moneyBonus: number;
    effects: JokerEffectDetail[];
    destroyedJokers: number[];
    increaseSellValue: number;
  } {
    let totalMoneyBonus = 0;
    let totalIncreaseSellValue = 0;
    const effects: JokerEffectDetail[] = [];
    const destroyedJokers: number[] = [];

    const jokers = jokerSlots.getActiveJokers();
    const allCardsAreFace = this.hasPareidolia(jokers);

    const context: JokerEffectContext = { gameState, defeatedBoss, heldCards, allCardsAreFace };

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

          // 如果大麦克自毁，设置全局状态以解锁卡文迪什
          if (joker.id === 'gros_michel') {
            setGrosMichelDestroyed(true);
            logger.info('大麦克已自毁，卡文迪什现在可以被刷到');
          }
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

        // 处理增加售价（礼品卡效果）
        if (result.increaseSellValue && result.increaseSellValue > 0) {
          totalIncreaseSellValue += result.increaseSellValue;
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

    // 如果击败了Boss，重置Campfire状态
    if (defeatedBoss) {
      this.resetCampfireAfterBoss(jokerSlots);
    }

    return {
      moneyBonus: totalMoneyBonus,
      effects,
      destroyedJokers,
      increaseSellValue: totalIncreaseSellValue
    };
  }

  /**
   * 击败Boss后重置Campfire状态
   */
  private static resetCampfireAfterBoss(jokerSlots: JokerSlots): void {
    const jokers = jokerSlots.getJokers();
    for (const joker of jokers) {
      if (joker.id === 'campfire') {
        joker.updateState({ cardsSold: 0 });
        logger.info('Campfire reset after boss defeated');
      }
    }
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
    const jokers = jokerSlots.getActiveJokers();

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
    const jokers = jokerSlots.getActiveJokers();

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
    blindType?: string,
    consumableSlots?: ConsumableSlots
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
    const jokers = jokerSlots.getActiveJokers();

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
      this.processJokerEffect(joker, joker.onBlindSelect, context, accumulator, undefined, consumableSlots);

      // 2. 处理蓝图的复制效果
      if (joker.id === 'blueprint') {
        this.processCopyEffect(joker, 'blueprint', 'onBlindSelect', context, accumulator, i, jokers, consumableSlots);
      }

      // 3. 处理头脑风暴的复制效果
      if (joker.id === 'brainstorm') {
        this.processCopyEffect(joker, 'brainstorm', 'onBlindSelect', context, accumulator, i, jokers, consumableSlots);
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
    const jokers = jokerSlots.getActiveJokers();

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
    const jokers = jokerSlots.getActiveJokers();

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
   * 处理独立触发器效果（ON_INDEPENDENT）
   * 这些效果不依赖于手牌，应该始终触发（如特技演员、哑剧演员）
   */
  static processIndependent(jokerSlots: JokerSlots, heldCards?: readonly Card[]): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
    heldCardRetrigger: boolean; // 哑剧演员效果：手牌能力触发2次
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getActiveJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      // 只处理 ON_INDEPENDENT 触发器的小丑
      if (joker.trigger !== JokerTrigger.ON_INDEPENDENT || !joker.effect) {
        continue;
      }

      const context: JokerEffectContext = {
        heldCards: heldCards ?? [],
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

      const result = joker.effect(context);

      // 检查是否有heldCardRetrigger效果（哑剧演员）
      if (result.heldCardRetrigger) {
        accumulator.heldCardRetrigger = true;
      }

      // 累加筹码和倍率加成
      if (result.chipBonus) accumulator.chipBonus += result.chipBonus;
      if (result.multBonus) accumulator.multBonus += result.multBonus;
      if (result.multMultiplier) accumulator.multMultiplier *= result.multMultiplier;

      if (result.message || result.chipBonus || result.multBonus || result.multMultiplier) {
        accumulator.effects.push({
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
      chipBonus: accumulator.chipBonus,
      multBonus: accumulator.multBonus,
      multMultiplier: accumulator.multMultiplier,
      effects: accumulator.effects,
      heldCardRetrigger: accumulator.heldCardRetrigger
    };
  }

  /**
   * 处理手牌中效果（ON_HELD触发器）
   */
  static processHeld(jokerSlots: JokerSlots, heldCards: readonly Card[]): {
    chipBonus: number;
    multBonus: number;
    multMultiplier: number;
    effects: JokerEffectDetail[];
    heldCardRetrigger: boolean; // 哑剧演员效果：手牌能力触发2次
  } {
    const accumulator = this.createEffectAccumulator();
    const jokers = jokerSlots.getActiveJokers();

    for (let i = 0; i < jokers.length; i++) {
      const joker = jokers[i];

      const context: JokerEffectContext = {
        heldCards,
        ...this.createPositionContext(jokerSlots, i)
      };

      // 添加jokerState到context
      (context as unknown as { jokerState: typeof joker.state }).jokerState = joker.state;

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
   * @param isPreview 是否为预览模式（预览时不更新状态）
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
    mostPlayedHand?: PokerHandType | null,
    handTypeHistoryCount?: number,
    isPreview = false,
    playedCards?: readonly Card[] // 打出的所有牌（用于重影等效果）
  ): ProcessedScoreResult {
    const jokerEffects: JokerEffectDetail[] = [];
    let totalChipBonus = 0;
    let totalMultBonus = 0;
    let totalMultMultiplier = 1;
    let totalMoneyEarned = 0;

    const jokers = jokerSlots.getJokers();

    console.log('[JokerSystem] calculateFinalScore开始, 小丑数量:', jokers.length, '预览模式:', isPreview);
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
      baseResult.totalMultiplier,
      undefined,
      isPreview
    );
    console.log('[JokerSystem] processScoredCards结果:', { chipBonus: scoredResult.chipBonus, multBonus: scoredResult.multBonus, multMultiplier: scoredResult.multMultiplier, moneyBonus: scoredResult.moneyBonus });
    totalChipBonus += scoredResult.chipBonus;
    totalMultBonus += scoredResult.multBonus;
    totalMultMultiplier *= scoredResult.multMultiplier;
    totalMoneyEarned += scoredResult.moneyBonus || 0;
    jokerEffects.push(...scoredResult.effects);

    // 处理 modifyScoredCards（远足者效果）- 预览模式下不修改卡牌
    if (scoredResult.modifyScoredCards && !isPreview) {
      for (const { card, permanentBonusDelta } of scoredResult.modifyScoredCards) {
        card.addPermanentBonus(permanentBonusDelta);
        console.log(`[JokerSystem] 卡牌 ${card.toString()} 永久加成 +${permanentBonusDelta}, 当前总加成: ${card.permanentBonus}`);
      }
    }

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
      mostPlayedHand,
      undefined, // consumableSlots
      handTypeHistoryCount,
      isPreview,
      playedCards
    );
    console.log('[JokerSystem] processHandPlayed结果:', { chipBonus: handPlayedResult.chipBonus, multBonus: handPlayedResult.multBonus, multMultiplier: handPlayedResult.multMultiplier, moneyBonus: handPlayedResult.moneyBonus, effects: handPlayedResult.effects });
    totalChipBonus += handPlayedResult.chipBonus;
    totalMultBonus += handPlayedResult.multBonus;
    totalMultMultiplier *= handPlayedResult.multMultiplier;
    totalMoneyEarned += handPlayedResult.moneyBonus || 0;
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
      totalMoneyEarned,
      copyScoredCardToDeck: handPlayedResult.copyScoredCardToDeck
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
