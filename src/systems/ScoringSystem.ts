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
import { SealSystem } from './SealSystem';
import { createModuleLogger } from '../utils/logger';
import { ProbabilitySystem, PROBABILITIES } from './ProbabilitySystem';

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
  copyScoredCardToDeck?: boolean; // DNA效果：复制计分牌到卡组
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
   * @deprecated 不再使用，保留此方法以保持兼容性
   */
  static setJokerSystem(_jokerSystem: unknown): void {
    // 不再使用，JokerSystem 现在是静态方法类
  }

  /**
   * @deprecated 不再使用，保留此方法以保持兼容性
   */
  static clearJokerSystem(): void {
    // 不再使用
  }

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
  } {
    const jokerList = jokers ?? [];
    let faceCards = false;
    let lowCards = false;
    let firstCard = false;

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
      }
    }

    return { faceCards, lowCards, firstCard };
  }

  /**
   * 检查单张牌是否满足触发两次条件
   */
  private static shouldRetriggerCard(
    card: Card,
    index: number,
    retriggerEffects: { faceCards: boolean; lowCards: boolean; firstCard: boolean }
  ): boolean {
    const lowRanks = ['2', '3', '4', '5'];

    if (retriggerEffects.firstCard && index === 0) {
      return true;
    }
    if (retriggerEffects.faceCards && card.isFaceCard) {
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
    bossState?: BossState // Boss状态（用于柱子等Boss效果）
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
    
    // 修复3: 计算手持卡牌效果（Steel）- 初始计算，后面会根据哑剧演员效果重新计算
    let heldMultMultiplier = 1;
    const steelCardCount = heldCards
      ? heldCards.filter(card => card.enhancement === CardEnhancement.Steel).length
      : 0;
    if (steelCardCount > 0) {
      heldMultMultiplier = Math.pow(1.5, steelCardCount);
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
      baseChips += handLevel.totalChipBonus;
      baseMultiplier += handLevel.totalMultBonus;
      logger.debug('牌型升级效果已应用', {
        handType: handResult.handType,
        level: handLevel.level,
        chipBonus: handLevel.totalChipBonus,
        multBonus: handLevel.totalMultBonus
      });
    }

    const cardDetails: CardScoreDetail[] = [];

    // 检查触发两次效果
    const retriggerEffects = this.checkRetriggerEffects(jokersToCheck);

    // 修复3: 累加Lucky金币效果和Glass摧毁
    let totalLuckyMoney = 0;
    const destroyedCards: Card[] = [];

    // 卡牌版本效果的倍率乘数累加器
    let editionMultMultiplier = 1;
    // Glass牌倍率乘数累加器
    let glassMultMultiplier = 1;
    // 蜡封金币奖励累加器
    let sealMoneyBonus = 0;
    // 哑剧演员效果：手牌能力触发2次
    let heldCardRetrigger = false;

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
      const shouldRetrigger = this.shouldRetriggerCard(card, i, retriggerEffects);
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
        } else if (retriggerEffects.faceCards && card.isFaceCard) {
          enhancements.push('触发两次 (喜剧与悲剧)');
        } else if (retriggerEffects.lowCards) {
          enhancements.push('触发两次 (黑客)');
        }
      }

      // 应用触发两次效果（乘以触发次数）
      chipBonus += cardChipBonus * retriggerCount;
      multBonus += cardMultBonus * retriggerCount;

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

    let jokerEffects: JokerEffectDetail[] = [];
    let allCardsScore = false;
    // 水花飞溅生效后的所有计分牌（包含原始计分牌和踢牌）
    let allScoringCards: readonly Card[] = handResult.scoringCards;
    let copyScoredCardToDeck = false;

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

      // 修复: 处理手牌中的小丑牌效果（ON_HELD触发器）
      let heldChipBonus = 0;
      let heldMultBonus = 0;
      let heldMultMultiplier = 1;
      if (heldCards && heldCards.length > 0) {
        const heldResult = JokerSystem.processHeld(jokerSlots, heldCards);
        heldChipBonus = heldResult.chipBonus;
        heldMultBonus = heldResult.multBonus;
        heldMultMultiplier = heldResult.multMultiplier;
        heldCardRetrigger = heldResult.heldCardRetrigger;
        jokerEffects.push(...heldResult.effects);
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
        isPreview
      );

      totalChips = jokerResult.totalChips;
      totalMultiplier = jokerResult.totalMultiplier * heldMultMultiplier;
      jokerEffects = [...jokerEffects, ...jokerResult.jokerEffects];
      copyScoredCardToDeck = jokerResult.copyScoredCardToDeck || false;
    }

    // 修复3: 应用手持卡牌倍率乘数（Steel效果）
    // 如果哑剧演员效果激活，Steel效果触发两次
    if (heldCardRetrigger && steelCardCount > 0) {
      // 哑剧演员效果：Steel卡效果触发两次
      heldMultMultiplier = Math.pow(1.5, steelCardCount * 2);
    }
    totalMultiplier *= heldMultMultiplier;

    // 应用卡牌版本效果的倍率乘数
    totalMultiplier *= editionMultMultiplier;
    
    // 应用Glass牌倍率乘数
    totalMultiplier *= glassMultMultiplier;
    
    const totalScore = totalChips * totalMultiplier;

    logger.debug('Score calculation complete', {
      handType: handResult.handType,
      baseChips,
      totalChips,
      baseMultiplier,
      totalMultiplier,
      totalScore,
      jokerEffects: jokerEffects?.length ?? 0
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
      copyScoredCardToDeck
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
