import type { Card } from '../models/Card';
import { SealType } from '../types/card';
import { PokerHandType } from '../types/pokerHands';

export interface SealEffectResult {
  moneyBonus: number;        // Gold Seal: 计分时+$3
  retriggerCount: number;    // Red Seal: 触发次数
  generatePlanet: boolean;   // Blue Seal: 生成星球牌
  planetHandType?: PokerHandType; // Blue Seal: 对应的牌型
  generateTarot: boolean;    // Purple Seal: 生成塔罗牌
}

export class SealSystem {
  /**
   * 计算蜡封效果
   * @param card 卡牌
   * @param isPlayed 是否被打出计分
   * @param isDiscarded 是否被弃掉
   * @param lastPlayedHandType 最后打出的牌型（用于Blue Seal）
   */
  static calculateSealEffects(
    card: Card,
    isPlayed: boolean = false,
    isDiscarded: boolean = false,
    lastPlayedHandType?: PokerHandType
  ): SealEffectResult {
    const result: SealEffectResult = {
      moneyBonus: 0,
      retriggerCount: 1,
      generatePlanet: false,
      generateTarot: false
    };

    switch (card.seal) {
      case SealType.Gold:
        // Gold Seal: 打出并计分时+$3
        if (isPlayed) {
          result.moneyBonus = 3;
        }
        break;

      case SealType.Red:
        // Red Seal: 触发两次
        result.retriggerCount = 2;
        break;

      case SealType.Blue:
        // Blue Seal: 回合结束时如果留在手牌中，生成对应最后出牌牌型的星球牌
        if (!isPlayed && !isDiscarded && lastPlayedHandType) {
          result.generatePlanet = true;
          result.planetHandType = lastPlayedHandType;
        }
        break;

      case SealType.Purple:
        // Purple Seal: 弃掉时生成1张塔罗牌
        if (isDiscarded) {
          result.generateTarot = true;
        }
        break;

      default:
        break;
    }

    return result;
  }

  /**
   * 计算多张卡牌的蜡封效果
   */
  static calculateSealsForCards(
    cards: readonly Card[],
    isPlayed: boolean = false,
    isDiscarded: boolean = false,
    lastPlayedHandType?: PokerHandType
  ): {
    totalMoneyBonus: number;
    retriggerCards: Map<Card, number>;
    planetHandType?: PokerHandType;
    tarotCount: number; // 紫色蜡封数量，每张生成一张塔罗牌
    planetCount: number; // 蓝色蜡封数量，每张生成一张星球牌
  } {
    let totalMoneyBonus = 0;
    const retriggerCards = new Map<Card, number>();
    let planetHandType: PokerHandType | undefined;
    let tarotCount = 0;
    let planetCount = 0;

    for (const card of cards) {
      const effects = this.calculateSealEffects(card, isPlayed, isDiscarded, lastPlayedHandType);
      
      // Gold Seal
      totalMoneyBonus += effects.moneyBonus;
      
      // Red Seal
      if (effects.retriggerCount > 1) {
        retriggerCards.set(card, effects.retriggerCount);
      }
      
      // Blue Seal - 每张蓝色蜡封生成一张星球牌
      if (effects.generatePlanet) {
        planetCount++;
        planetHandType = effects.planetHandType;
      }
      
      // Purple Seal - 每张紫色蜡封生成一张塔罗牌
      if (effects.generateTarot) {
        tarotCount++;
      }
    }

    return {
      totalMoneyBonus,
      retriggerCards,
      planetHandType,
      tarotCount,
      planetCount
    };
  }

  /**
   * 获取蜡封描述
   */
  static getSealDescription(seal: SealType): string {
    switch (seal) {
      case SealType.Gold:
        return '黄金蜡封: 打出并计分时获得$3';
      case SealType.Red:
        return '红色蜡封: 计分时触发两次';
      case SealType.Blue:
        return '蓝色蜡封: 回合结束时若在手牌中，生成一张对应最后出牌牌型的星球牌';
      case SealType.Purple:
        return '紫色蜡封: 弃牌时生成一张随机塔罗牌';
      default:
        return '';
    }
  }
}
