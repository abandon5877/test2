import type { Card } from '../models/Card';
import { PokerHandType, type PokerHandResult, HAND_BASE_VALUES } from '../types/pokerHands';
import { PokerHandDetector } from './PokerHandDetector';
import { CardEnhancement, CardEdition, SealType } from '../types/card';
import { JokerSystem, type JokerEffectDetail } from './JokerSystem';
import type { JokerInterface } from '../types/joker';
import type { JokerSlots } from '../models/JokerSlots';
import type { HandLevelState } from '../models/HandLevelState';
import type { BossState } from '../models/BossState';
import { BossSystem } from './BossSystem';
import { BossType } from '../types/game';
import { SealSystem } from './SealSystem';
import { createModuleLogger } from '../utils/logger';
import { ProbabilitySystem, PROBABILITIES } from './ProbabilitySystem';
import { PLANET_CARDS } from '../data/planetCards';

const logger = createModuleLogger('ScoringSystem');

export interface ScoreResult {
  totalScore: number;
  baseChips: number;
  chipBonus: number;
  totalChips: number;
  baseMultiplier: number;
  multBonus: number;
  totalMultiplier: number;
  handType: PokerHandType;
  handDescription: string;
  scoringCards: readonly Card[];
  kickers: readonly Card[];
  cardDetails: CardScoreDetail[];
  jokerEffects?: readonly JokerEffectDetail[];
  allCardsScore?: boolean; // 水花飞溅效果是否生效
  // 修复3: 添加增强效果相关字段
  moneyBonus?: number; // 金币奖励（Gold/Lucky）
  destroyedCards?: readonly Card[]; // 被摧毁的卡牌（Glass效果）
  heldMultMultiplier?: number; // 手持卡牌倍率乘数（Steel效果）
  copyScoredCardToDeck?: number; // DNA效果：复制计分牌到卡组（修复：改为数字，记录复制次数）
  // 修复牛Boss: 标记是否触发了牛Boss效果（打出最常用牌型）
  isOxMostPlayedHand?: boolean;
}

export interface CardScoreDetail {
  card: string;
  baseChips: number;
  chipBonus: number;
  multBonus: number;
  enhancements: string[];
}

export class ScoringSystem {
  /**
   * 检查是否有水花飞溅效果（所有打出的牌都计分）
   */
  private static checkAllCardsScoreEffect(jokers?: readonly JokerInterface[]): boolean {
    return this.checkAllCardsScoreEffectInJokers(jokers ?? []);
  }

  private static checkAllCardsScoreEffectInJokers(jokers: readonly JokerInterface[]): boolean {
    for (const joker of jokers) {
      if (joker.effect) {
        const result = joker.effect({});
        if (result.allCardsScore) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检查是否有四指效果（同花/顺子只需4张）
   */
  private static checkFourFingersEffect(jokers?: readonly JokerInterface[]): boolean {
    const jokerList = jokers ?? [];
    for (const joker of jokerList) {
      if (joker.effect) {
        const result = joker.effect({});
        if (result.fourFingers) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检查是否有捷径效果（顺子可跳1个数字）
   */
  private static checkShortcutEffect(jokers?: readonly JokerInterface[]): boolean {
    const jokerList = jokers ?? [];
    for (const joker of jokerList) {
      if (joker.id === 'shortcut') {
        return true;
      }
    }
    return false;
  }

  /**
   * 计算卡牌版本效果
   * @returns { chips: 筹码加成, mult: 倍率加成, multMultiplier: 倍率乘数 }
   */
  private static calculateCardEditionEffects(card: Card): { chips: number; mult: number; multMultiplier: number; editionName: string } {
    let chips = 0;
    let mult = 0;
    let multMultiplier = 1;
    let editionName = '';

    switch (card.edition) {
      case CardEdition.Foil:
        chips += 50;
        editionName = 'Foil (+50筹码)';
        break;
      case CardEdition.Holographic:
        mult += 10;
        editionName = 'Holographic (+10倍率)';
        break;
      case CardEdition.Polychrome:
        multMultiplier *= 1.5;
        editionName = 'Polychrome (×1.5倍率)';
        break;
      default:
        break;
    }

    return { chips, mult, multMultiplier, editionName };
  }

  /**
   * 检查是否有触发两次效果
   * 返回需要触发两次的卡牌条件
   */
  private static checkRetriggerEffects(jokers?: readonly JokerInterface[]): {
    faceCards: boolean;      // sock_and_buskin: 脸牌触发两次
    lowCards: boolean;       // hack: 2,3,4,5触发两次
    firstCard: boolean;      // hanging_chad: 第一张牌触发两次
    allCards: boolean;       // seltzer: 所有牌触发两次
  } {
    const jokerList = jokers ?? [];
    let faceCards = false;
    let lowCards = false;
    let firstCard = false;
    let allCards = false;

    for (const joker of jokerList) {
      switch (joker.id) {
        case 'sock_and_buskin':
          faceCards = true;
          break;
        case 'hack':
          lowCards = true;
          break;
        case 'hanging_chad':
          firstCard = true;
          break;
        case 'seltzer':
          // 苏打水：检查是否还有剩余次数
          const handsRemaining = (joker.state?.handsRemaining ?? 10);
          if (handsRemaining > 0) {
            allCards = true;
          }
          break;
      }
    }

    return { faceCards, lowCards, firstCard, allCards };
  }

  /**
   * 检查单张牌是否满足触发两次条件
   */
  private static shouldRetriggerCard(
    card: Card,
    index: number,
    retriggerEffects: { faceCards: boolean; lowCards: boolean; firstCard: boolean; allCards: boolean },
    allCardsAreFace = false
  ): boolean {
    const lowRanks = ['2', '3', '4', '5'];

    if (retriggerEffects.allCards) {
      return true;
    }
    if (retriggerEffects.firstCard && index === 0) {
      return true;
    }
    if (retriggerEffects.faceCards && (allCardsAreFace || card.isFaceCard)) {
      return true;
    }
    if (retriggerEffects.lowCards && lowRanks.includes(card.rank)) {
      return true;
    }
    return false;
  }

  static calculate(
    cards: readonly Card[],
    handType?: PokerHandType,
    gameState?: { money: number; interestCap: number; hands: number; discards: number },
    heldCards?: readonly Card[], // 修复3: 手持卡牌（用于Steel效果）
    jokerSlots?: JokerSlots, // 新增：JokerSlots 实例，用于小丑牌效果计算（从中自动获取jokers）
    deckSize?: number, // 牌库当前大小（用于侵蚀效果）
    initialDeckSize?: number, // 牌库初始大小（用于侵蚀效果）
    handsPlayed?: number, // 本回合已出牌次数（用于loyalty_card等）
    discardsUsed?: number, // 本回合已弃牌次数（用于yorick等）
    handsRemaining?: number, // 剩余手牌数（用于acrobat等）
    mostPlayedHand?: PokerHandType | null, // 最常出的牌型（用于obelisk）
    handTypeHistoryCount?: number, // 当前牌型的历史出牌次数（用于Supernova）
    isPreview = false, // 是否为预览模式（预览时不更新小丑牌状态）
    handLevelState?: HandLevelState, // 牌型等级状态（用于牌型升级）
    bossState?: BossState, // Boss状态（用于柱子等Boss效果）
    cardsDiscarded?: number // 本回合弃掉的牌的数量（用于约里克等）
  ): ScoreResult {
    if (cards.length === 0) {
      logger.warn('Calculate called with empty cards');
      return this.createEmptyResult();
    }

    logger.debug('Starting score calculation', { 
      cardCount: cards.length, 
      cards: cards.map(c => c.toString()),
      heldCardCount: heldCards?.length ?? 0 
    });

    // 计算手牌钢铁牌效果（当没有jokerSlots时的后备计算）
    let heldMultMultiplier = 1;
    if (heldCards && !jokerSlots) {
      // 没有jokerSlots时，使用简单的钢铁牌计算
      let steelCardEffectCount = 0;
      for (const card of heldCards) {
        if (card.enhancement === CardEnhancement.Steel) {
          const retriggerCount = card.seal === SealType.Red ? 2 : 1;
          steelCardEffectCount += retriggerCount;
        }
      }
      if (steelCardEffectCount > 0) {
        heldMultMultiplier = Math.pow(1.5, steelCardEffectCount);
      }
    }

    // 从 jokerSlots 获取小丑牌列表（如果提供了 jokerSlots）
    const jokersToCheck = jokerSlots ? jokerSlots.getJokers() : [];
    const fourFingers = this.checkFourFingersEffect(jokersToCheck);
    const shortcut = this.checkShortcutEffect(jokersToCheck);

    // 调试日志
    logger.debug('Effect check:', {
      jokerSlotsProvided: !!jokerSlots,
      jokersToCheck: jokersToCheck.length,
      fourFingers,
      shortcut,
      jokerIds: jokersToCheck.map(j => j.id)
    });

    PokerHandDetector.setConfig({ fourFingers, shortcut });

    const handResult = handType
      ? this.createResultFromHandType(cards, handType)
      : PokerHandDetector.detect(cards);
    
    // 清除配置
    PokerHandDetector.clearConfig();

    let baseChips = handResult.baseChips;
    let chipBonus = 0;
    let baseMultiplier = handResult.baseMultiplier;
    let multBonus = 0;

    // 应用牌型升级效果
    if (handLevelState) {
      const handLevel = handLevelState.getHandLevel(handResult.handType);
      
      // 修复手臂Boss: 应用牌型等级降低（在计分前应用，且等级不会低于1）
      let effectiveLevel = handLevel.level;
      let effectiveChipBonus = handLevel.totalChipBonus;
      let effectiveMultBonus = handLevel.totalMultBonus;
      
      if (bossState) {
        const reduction = bossState.getHandLevelReduction(handResult.handType);
        if (reduction > 0) {
          // 等级降低，但不低于1
          effectiveLevel = Math.max(1, handLevel.level - reduction);
          
          // 重新计算升级效果（根据降低后的等级）
          if (effectiveLevel < handLevel.level) {
            const planetCard = PLANET_CARDS[handResult.handType];
            if (planetCard) {
              const levelsLost = handLevel.level - effectiveLevel;
              effectiveChipBonus = handLevel.totalChipBonus - (planetCard.chipBonus * levelsLost);
              effectiveMultBonus = handLevel.totalMultBonus - (planetCard.multBonus * levelsLost);
            }
          }
          
          logger.debug('手臂Boss效果: 牌型等级降低', {
            handType: handResult.handType,
            originalLevel: handLevel.level,
            reduction,
            effectiveLevel,
            originalChipBonus: handLevel.totalChipBonus,
            effectiveChipBonus,
            originalMultBonus: handLevel.totalMultBonus,
            effectiveMultBonus
          });
        }
      }
      
      baseChips += effectiveChipBonus;
      baseMultiplier += effectiveMultBonus;
      logger.debug('牌型升级效果已应用', {
        handType: handResult.handType,
        level: effectiveLevel,
        chipBonus: effectiveChipBonus,
        multBonus: effectiveMultBonus
      });
    }

    // 修复燧石Boss: 基础筹码和倍率减半（在卡牌计分前应用）
    if (bossState) {
      const currentBoss = BossSystem.getCurrentBoss(bossState);
      if (currentBoss === BossType.FLINT) {
        const originalBaseChips = baseChips;
        const originalBaseMultiplier = baseMultiplier;
        baseChips = Math.floor(baseChips / 2);
        baseMultiplier = Math.max(1, Math.floor(baseMultiplier / 2)); // 确保最小为1
        logger.debug('燧石Boss效果: 基础筹码和倍率减半', {
          handType: handResult.handType,
          originalBaseChips,
          newBaseChips: baseChips,
          originalBaseMultiplier,
          newBaseMultiplier: baseMultiplier
        });
      }
    }

    const cardDetails: CardScoreDetail[] = [];

    // 检查触发两次效果
    const retriggerEffects = this.checkRetriggerEffects(jokersToCheck);

    // 检查幻想性错觉效果（所有牌视为人头牌）
    const allCardsAreFace = JokerSystem.hasPareidolia(jokersToCheck);

    // 修复3: 累加Lucky金币效果和Glass摧毁
    let totalLuckyMoney = 0;
    const destroyedCards: Card[] = [];

    // 卡牌版本效果的倍率乘数累加器
    let editionMultMultiplier = 1;
    // Glass牌倍率乘数累加器
    let glassMultMultiplier = 1;
    // 蜡封金币奖励累加器
    let sealMoneyBonus = 0;
    // 哑剧演员效果：手牌能力触发次数（修复：改为数字，支持蓝图+默剧演员）
    let heldCardRetrigger: number | undefined = undefined;
    // 小丑牌效果详情收集器
    let jokerEffects: JokerEffectDetail[] = [];

    for (let i = 0; i < handResult.scoringCards.length; i++) {
      const card = handResult.scoringCards[i];
      const cardBaseChips = card.getChipValue();
      let cardChipBonus = cardBaseChips;
      let cardMultBonus = 0;
      const enhancements: string[] = [];

      // 检查卡牌是否完全失效（Boss效果）
      const isDisabled = bossState ? BossSystem.isCardDisabled(bossState, card) : false;

      if (isDisabled) {
        // 卡牌完全失效，不计分
        enhancements.push('失效 (Boss效果)');
        cardDetails.push({
          card: card.toString(),
          baseChips: 0,
          chipBonus: 0,
          multBonus: 0,
          enhancements
        });
        continue; // 跳过此卡牌的后续效果计算
      }

      // 计算卡牌版本效果
      const editionEffects = this.calculateCardEditionEffects(card);
      cardChipBonus += editionEffects.chips;
      cardMultBonus += editionEffects.mult;
      editionMultMultiplier *= editionEffects.multMultiplier;
      if (editionEffects.editionName) {
        enhancements.push(editionEffects.editionName);
      }

      // 计算蜡封效果（Gold Seal: 计分时+$3, Red Seal: 触发两次）
      const sealEffects = SealSystem.calculateSealEffects(card, true, false);
      if (sealEffects.moneyBonus > 0) {
        sealMoneyBonus += sealEffects.moneyBonus;
        enhancements.push(`Gold Seal (+$${sealEffects.moneyBonus})`);
      }

      switch (card.enhancement) {
        case CardEnhancement.Bonus:
          cardChipBonus += 30;
          enhancements.push('Bonus (+30筹码)');
          break;
        case CardEnhancement.Mult:
          cardMultBonus += 4;
          enhancements.push('Mult (+4倍率)');
          break;
        // 修复3: Glass效果 - x2倍率，1/4几率摧毁
        case CardEnhancement.Glass:
          // Glass牌提供x2倍率乘数，不是加算
          glassMultMultiplier *= 2;
          enhancements.push('Glass (×2倍率)');
          // 1/4 几率摧毁 (受Oops!_All_6s影响)
          if (ProbabilitySystem.check(PROBABILITIES.GLASS_DESTROY)) {
            destroyedCards.push(card);
            enhancements.push('Glass (已摧毁!)');
          }
          break;
        // 修复3: Steel效果改为手持时x1.5倍率，不在计分卡牌中生效
        case CardEnhancement.Steel:
          enhancements.push('Steel (手持时x1.5倍率)');
          break;
        case CardEnhancement.Stone:
          cardChipBonus = 50;
          enhancements.push('Stone (固定50筹码)');
          break;
        // 修复3: Lucky效果 - 1/5几率+20倍率，1/15几率+$20
        case CardEnhancement.Lucky:
          let luckyTriggered = false;
          let luckyMoney = 0;
          // 1/5 几率 +20 Mult (受Oops!_All_6s影响)
          if (ProbabilitySystem.check(PROBABILITIES.LUCKY_MULT)) {
            cardMultBonus += 20;
            luckyTriggered = true;
          }
          // 1/15 几率 +$20 (受Oops!_All_6s影响)
          if (ProbabilitySystem.check(PROBABILITIES.LUCKY_CASH)) {
            luckyMoney = 20;
            totalLuckyMoney += luckyMoney;
          }
          // 修复: 每张牌独立显示自己的效果
          if (luckyTriggered && luckyMoney > 0) {
            enhancements.push(`Lucky (+20倍率, +$${luckyMoney})`);
          } else if (luckyTriggered) {
            enhancements.push('Lucky (+20倍率)');
          } else if (luckyMoney > 0) {
            enhancements.push(`Lucky (+$${luckyMoney})`);
          } else {
            enhancements.push('Lucky (未触发)');
          }
          break;
        default:
          break;
      }

      // 检查是否触发两次（小丑牌效果和Red Seal）
      const shouldRetrigger = this.shouldRetriggerCard(card, i, retriggerEffects, allCardsAreFace);
      // Red Seal也触发两次
      const hasRedSeal = card.seal === SealType.Red;
      let retriggerCount = (shouldRetrigger || hasRedSeal) ? 2 : 1;

      // 添加触发两次标记
      if (shouldRetrigger || hasRedSeal) {
        if (hasRedSeal) {
          enhancements.push('触发两次 (红色蜡封)');
        }
        if (retriggerEffects.firstCard && i === 0) {
          enhancements.push('触发两次 (悬挂票)');
        } else if (retriggerEffects.faceCards && (allCardsAreFace || card.isFaceCard)) {
          enhancements.push('触发两次 (喜剧与悲剧)');
        } else if (retriggerEffects.lowCards) {
          enhancements.push('触发两次 (黑客)');
        }
      }

      // 应用触发两次效果（乘以触发次数）
      chipBonus += cardChipBonus * retriggerCount;
      multBonus += cardMultBonus * retriggerCount;

      // 触发该牌对应的小丑牌效果（从左到右）
        if (jokerSlots) {
          const cardJokerResult = JokerSystem.processSingleCardScored(
            jokerSlots,
            card,
            i,
            handResult.scoringCards,
            handResult.handType,
            baseChips + chipBonus,
            baseMultiplier + multBonus,
            undefined,
            isPreview
          );

          // 累加该牌触发的小丑牌效果
          chipBonus += cardJokerResult.chipBonus;
          multBonus += cardJokerResult.multBonus;
          editionMultMultiplier *= cardJokerResult.multMultiplier;
          totalLuckyMoney += cardJokerResult.moneyBonus;
          // 收集小丑牌效果详情
          jokerEffects.push(...cardJokerResult.effects);
        }

      cardDetails.push({
        card: card.toString(),
        baseChips: cardBaseChips,
        chipBonus: cardChipBonus * retriggerCount,
        multBonus: cardMultBonus * retriggerCount,
        enhancements
      });
    }

    for (const card of handResult.kickers) {
      const cardBaseChips = card.getChipValue();
      const enhancements: string[] = [];

      switch (card.enhancement) {
        case CardEnhancement.Bonus:
          enhancements.push('Bonus (+30筹码)');
          break;
        case CardEnhancement.Mult:
          enhancements.push('Mult (+4倍率)');
          break;
        case CardEnhancement.Wild:
          enhancements.push('Wild (万能牌)');
          break;
        case CardEnhancement.Glass:
          enhancements.push('Glass (x2倍率, 1/4几率摧毁)');
          break;
        case CardEnhancement.Steel:
          enhancements.push('Steel (手持时x1.5倍率)');
          break;
        case CardEnhancement.Stone:
          enhancements.push('Stone (固定50筹码)');
          break;
        case CardEnhancement.Gold:
          enhancements.push('Gold (结算时+3金币)');
          break;
        case CardEnhancement.Lucky:
          enhancements.push('Lucky (+20筹码, 1/5几率x5倍率)');
          break;
        default:
          break;
      }

      cardDetails.push({
        card: card.toString(),
        baseChips: cardBaseChips,
        chipBonus: 0,
        multBonus: 0,
        enhancements
      });
    }

    let totalChips = baseChips + chipBonus;
    let totalMultiplier = baseMultiplier + multBonus;

    let allCardsScore = false;
    // 水花飞溅生效后的所有计分牌（包含原始计分牌和踢牌）
    let allScoringCards: readonly Card[] = handResult.scoringCards;
    let copyScoredCardToDeck: number | undefined = undefined; // 修复：改为数字类型

    if (jokerSlots) {
      // 检查是否有水花飞溅效果（所有牌计分）
      allCardsScore = this.checkAllCardsScoreEffect(jokerSlots.getJokers());

      // 如果有水花飞溅，让踢牌也计分
      if (allCardsScore && handResult.kickers.length > 0) {
        for (const card of handResult.kickers) {
          const cardBaseChips = card.getChipValue();
          let cardChipBonus = cardBaseChips;
          let cardMultBonus = 0;
          const enhancements: string[] = [];

          switch (card.enhancement) {
            case CardEnhancement.Bonus:
              cardChipBonus += 30;
              enhancements.push('Bonus (+30筹码)');
              break;
            case CardEnhancement.Mult:
              cardMultBonus += 4;
              enhancements.push('Mult (+4倍率)');
              break;
            case CardEnhancement.Glass:
              cardMultBonus *= 2;
              enhancements.push('Glass (×2倍率)');
              break;
            case CardEnhancement.Steel:
              cardMultBonus += cardBaseChips;
              enhancements.push('Steel (+筹码值倍率)');
              break;
            case CardEnhancement.Stone:
              cardChipBonus = 50;
              enhancements.push('Stone (固定50筹码)');
              break;
            case CardEnhancement.Lucky:
              if (Math.random() < 0.2) {
                cardMultBonus += 20;
                enhancements.push('Lucky (+20倍率)');
              }
              break;
            default:
              break;
          }

          chipBonus += cardChipBonus;
          multBonus += cardMultBonus;

          cardDetails.push({
            card: card.toString(),
            baseChips: cardBaseChips,
            chipBonus: cardChipBonus,
            multBonus: cardMultBonus,
            enhancements: [...enhancements, '水花飞溅 (计分)']
          });
        }

        // 重新计算总筹码和倍率
        totalChips = baseChips + chipBonus;
        totalMultiplier = baseMultiplier + multBonus;

        // 水花飞溅生效时，所有打出的牌都计分
        allScoringCards = [...handResult.scoringCards, ...handResult.kickers];
      }

      // 修复: 处理独立触发器的小丑牌效果（ON_INDEPENDENT，如特技演员、哑剧演员）
      // 这些效果不依赖于手牌，应该始终触发
      const independentResult = JokerSystem.processIndependent(jokerSlots, heldCards);
      let heldChipBonus = independentResult.chipBonus;
      let heldMultBonus = independentResult.multBonus;
      // 使用外部定义的 heldMultMultiplier，不要重新定义
      heldMultMultiplier = independentResult.multMultiplier;
      // 修复：累加触发次数
      if (independentResult.heldCardRetrigger) {
        heldCardRetrigger = (heldCardRetrigger || 0) + independentResult.heldCardRetrigger;
      }
      jokerEffects.push(...independentResult.effects);

      // 修复: 逐张处理手牌（从左到右）
      // 手牌中的钢铁牌效果 + ON_HELD触发器小丑牌（如高举拳头、射月、男爵）
      let totalSteelEffectCount = 0;
      if (heldCards && heldCards.length > 0) {
        for (let i = 0; i < heldCards.length; i++) {
          const card = heldCards[i];

          // 触发该手牌对应的小丑牌效果（从左到右）
          const heldCardResult = JokerSystem.processSingleHeldCard(
            jokerSlots,
            card,
            i,
            heldCards,
            baseChips + chipBonus + heldChipBonus,
            baseMultiplier + multBonus + heldMultBonus,
            isPreview
          );

          // 累加该手牌触发的小丑牌效果
          heldChipBonus += heldCardResult.chipBonus;
          heldMultBonus += heldCardResult.multBonus;
          heldMultMultiplier *= heldCardResult.multMultiplier;
          totalSteelEffectCount += heldCardResult.steelEffectCount;
          jokerEffects.push(...heldCardResult.effects);
        }
      }

      // 计算钢铁牌倍率乘数（1.5^效果次数）
      // 哑剧演员效果：让每个手牌效果额外触发
      if (totalSteelEffectCount > 0) {
        // 基础触发次数
        let triggerCount = totalSteelEffectCount;
        // 哑剧演员效果：每个哑剧演员使效果额外触发1次
        if (heldCardRetrigger && heldCardRetrigger > 0) {
          triggerCount = totalSteelEffectCount * (1 + heldCardRetrigger);
        }
        heldMultMultiplier *= Math.pow(1.5, triggerCount);
      }

      const jokerResult = JokerSystem.calculateFinalScore(
        jokerSlots,
        {
          totalScore: 0,
          baseChips,
          chipBonus: chipBonus + heldChipBonus,
          totalChips: totalChips + heldChipBonus,
          baseMultiplier,
          multBonus: multBonus + heldMultBonus,
          totalMultiplier: totalMultiplier + heldMultBonus,
          handType: handResult.handType,
          handDescription: handResult.description,
          scoringCards: allScoringCards, // 使用包含踢牌的完整列表
          kickers: handResult.kickers,
          cardDetails
        },
        allScoringCards, // 传递所有计分牌（包含踢牌）
        handResult.handType,
        gameState,
        handsPlayed,
        discardsUsed,
        deckSize,
        initialDeckSize,
        handsRemaining,
        mostPlayedHand,
        handTypeHistoryCount,
        isPreview,
        cards, // 传递打出的所有牌（用于重影等效果）
        cardsDiscarded
      );

      totalChips = jokerResult.totalChips;
      totalMultiplier = jokerResult.totalMultiplier * heldMultMultiplier;
      jokerEffects = [...jokerEffects, ...jokerResult.jokerEffects];
      // 修复：累加复制次数（支持蓝图+DNA组合）
      if (jokerResult.copyScoredCardToDeck) {
        copyScoredCardToDeck = (copyScoredCardToDeck || 0) + jokerResult.copyScoredCardToDeck;
      }
      // 累加小丑牌给的钱
      totalLuckyMoney += jokerResult.totalMoneyEarned || 0;
    }

    // 应用卡牌版本效果的倍率乘数
    totalMultiplier *= editionMultMultiplier;
    
    // 应用Glass牌倍率乘数
    totalMultiplier *= glassMultMultiplier;
    
    const totalScore = totalChips * totalMultiplier;

    // 修复牛Boss: 检查是否打出了最常用牌型
    const isOxMostPlayedHand = bossState ? BossSystem.isMostPlayedHand(bossState, handResult.handType) : false;

    logger.debug('Score calculation complete', {
      handType: handResult.handType,
      baseChips,
      totalChips,
      baseMultiplier,
      totalMultiplier,
      totalScore,
      jokerEffects: jokerEffects?.length ?? 0,
      isOxMostPlayedHand
    });

    return {
      totalScore,
      baseChips,
      chipBonus: totalChips - baseChips,
      totalChips,
      baseMultiplier,
      multBonus: totalMultiplier - baseMultiplier,
      totalMultiplier,
      handType: handResult.handType,
      handDescription: handResult.description,
      scoringCards: allScoringCards, // 使用水花飞溅处理后的完整计分牌列表
      kickers: handResult.kickers,
      cardDetails,
      jokerEffects,
      allCardsScore, // 返回水花飞溅效果状态
      // 修复3: 添加增强效果相关字段
      moneyBonus: totalLuckyMoney + sealMoneyBonus,
      destroyedCards: destroyedCards.length > 0 ? destroyedCards : undefined,
      heldMultMultiplier: heldMultMultiplier > 1 ? heldMultMultiplier : undefined,
      copyScoredCardToDeck,
      // 修复牛Boss: 返回是否触发了牛Boss效果
      isOxMostPlayedHand
    };
  }

  private static createResultFromHandType(cards: readonly Card[], handType: PokerHandType): PokerHandResult {
    const detected = PokerHandDetector.detect(cards);
    if (detected.handType === handType) {
      return detected;
    }

    const baseValues = HAND_BASE_VALUES[handType];

    return {
      handType,
      baseChips: baseValues.chips,
      baseMultiplier: baseValues.multiplier,
      scoringCards: cards.slice(0, 5),
      kickers: [],
      description: `${baseValues.displayName} (强制)`
    };
  }

  private static createEmptyResult(): ScoreResult {
    return {
      totalScore: 0,
      baseChips: 0,
      chipBonus: 0,
      totalChips: 0,
      baseMultiplier: 0,
      multBonus: 0,
      totalMultiplier: 0,
      handType: PokerHandType.HighCard,
      handDescription: '无牌',
      scoringCards: [],
      kickers: [],
      cardDetails: []
    };
  }

  static formatScoreResult(result: ScoreResult): string {
    const lines: string[] = [];
    lines.push(`=== 得分详情 ===`);
    lines.push(`牌型: ${result.handDescription}`);
    lines.push(`基础筹码: ${result.baseChips}`);
    lines.push(`筹码加成: ${result.chipBonus}`);
    lines.push(`总筹码: ${result.totalChips}`);
    lines.push(`基础倍率: ${result.baseMultiplier}`);
    lines.push(`倍率加成: ${result.multBonus}`);
    lines.push(`总倍率: ${result.totalMultiplier}`);
    lines.push(`最终得分: ${result.totalChips} × ${result.totalMultiplier} = ${result.totalScore}`);
    lines.push('');
    lines.push('计分卡牌:');
    for (const detail of result.cardDetails) {
      const enhancementStr = detail.enhancements.length > 0
        ? ` [${detail.enhancements.join(', ')}]`
        : '';
      lines.push(`  ${detail.card}: ${detail.baseChips}筹码${enhancementStr}`);
    }
    return lines.join('\n');
  }
}
