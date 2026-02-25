import { BossType, type BlindConfig } from '../types/game';
import { PokerHandType } from '../types/pokerHands';
import { Suit, Rank } from '../types/card';
import type { Card } from '../models/Card';
import type { BossState } from '../models/BossState';
import type { JokerInterface } from '../types/joker';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('BossSystem');

export interface BossEffectResult {
  canPlay?: boolean;
  message?: string;
  modifiedScore?: number;
  moneyChange?: number;
  discardCount?: number;
  cardsToDiscard?: number[];
  handSizeModifier?: number;
  handsModifier?: number;
  discardsModifier?: number;
  jokersShuffled?: boolean;
  jokersFlipped?: boolean;
  disabledJokerIndex?: number; // 深红之心Boss禁用的小丑位置
  requiredCardId?: string; // 天青铃铛Boss要求的卡牌ID
}

/**
 * Boss效果系统
 * 负责处理Boss的效果计算
 * 所有方法为静态方法，BossState作为参数传入
 */
export class BossSystem {
  // ==================== 静态方法 ====================

  /**
   * 检查是否有奇科（Chicot）小丑牌
   * 奇科会让Boss盲注能力无效
   */
  static hasChicot(jokers: readonly JokerInterface[]): boolean {
    return jokers.some(j => j.id === 'chicot' && !j.disabled);
  }

  /**
   * 设置当前Boss
   */
  static setBoss(bossState: BossState, bossType: BossType | undefined, jokers?: readonly JokerInterface[]): void {
    // 如果有奇科，不设置Boss（Boss能力无效）
    if (jokers && BossSystem.hasChicot(jokers)) {
      logger.info('Chicot detected, boss ability disabled');
      bossState.setBoss(undefined);
      return;
    }
    bossState.setBoss(bossType);
  }

  /**
   * 清除当前Boss
   */
  static clearBoss(bossState: BossState): void {
    bossState.clearBoss();
  }

  /**
   * 获取当前Boss
   */
  static getCurrentBoss(bossState: BossState): BossType | null {
    return bossState.getCurrentBoss();
  }

  /**
   * 检查是否可以出牌
   */
  static canPlayHand(bossState: BossState, handType: PokerHandType, cardCount?: number): BossEffectResult {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.EYE) {
      if (bossState.hasPlayedHandType(handType)) {
        return {
          canPlay: false,
          message: '眼睛Boss: 不能重复打出相同牌型'
        };
      }
    }

    if (currentBoss === BossType.MOUTH) {
      if (bossState.getPlayedHandTypesCount() > 0 && !bossState.hasPlayedHandType(handType)) {
        return {
          canPlay: false,
          message: '嘴Boss: 本回合只能出一种牌型'
        };
      }
    }

    // 通灵Boss: 必须正好打出5张牌
    if (currentBoss === BossType.PSYCHIC) {
      if (cardCount !== undefined && cardCount !== 5) {
        return {
          canPlay: false,
          message: '通灵Boss: 必须正好打出5张牌'
        };
      }
    }

    return { canPlay: true };
  }

  /**
   * 出牌前检查
   */
  static beforePlayHand(bossState: BossState, handType: PokerHandType): BossEffectResult {
    const result = BossSystem.canPlayHand(bossState, handType);
    if (!result.canPlay) {
      return result;
    }

    // 记录牌型出牌次数
    bossState.recordHandPlayCount(handType);

    return { canPlay: true };
  }

  /**
   * 出牌后效果
   */
  static afterPlayHand(bossState: BossState, cards: Card[], handType: PokerHandType, currentHandLevel?: number): BossEffectResult {
    bossState.recordPlayedHandType(handType);

    const currentBoss = bossState.getCurrentBoss();
    const result: BossEffectResult = {};

    // 钩子Boss: 弃2张随机手牌
    if (currentBoss === BossType.HOOK) {
      result.discardCount = 2;
      result.message = '钩子Boss: 弃掉2张随机手牌';
    }

    // 牙齿Boss: 每张牌扣$1
    if (currentBoss === BossType.TOOTH) {
      result.moneyChange = -cards.length;
      result.message = `牙齿Boss: ${cards.length}张牌扣$${cards.length}`;
    }

    // 手臂Boss: 降低牌型等级（每次打出都降低，但最低到1级）
    if (currentBoss === BossType.ARM) {
      const increased = bossState.increaseHandLevelReduction(handType, currentHandLevel);
      const reduction = bossState.getHandLevelReduction(handType);
      if (increased) {
        result.message = `手臂Boss: ${handType}等级降低${reduction}级`;
      } else {
        result.message = `手臂Boss: ${handType}已降至最低等级`;
      }
    }

    // 记录本底注出过的牌
    for (const card of cards) {
      bossState.recordCardPlayed(card);
    }

    bossState.setFirstHandPlayed();

    return result;
  }

  /**
   * 修改分数
   */
  static modifyScore(bossState: BossState, score: number): number {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.FLINT) {
      return Math.floor(score / 2);
    }

    return score;
  }

  /**
   * 修改目标分数
   */
  static modifyTargetScore(bossState: BossState, baseScore: number): number {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.WALL) {
      return baseScore * 4;
    }

    if (currentBoss === BossType.VIOLET_VESSEL) {
      return baseScore * 6;
    }

    if (currentBoss === BossType.NEEDLE) {
      return baseScore;
    }

    return baseScore * 2;
  }

  /**
   * 修改手牌上限
   */
  static modifyHandSize(bossState: BossState, baseSize: number): number {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.MANACLE) {
      return baseSize - 1;
    }
    return baseSize;
  }

  /**
   * 修改出牌次数
   */
  static modifyHands(bossState: BossState, baseHands: number): number {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.NEEDLE) {
      return 1;
    }
    return baseHands;
  }

  /**
   * 修改弃牌次数
   */
  static modifyDiscards(bossState: BossState, baseDiscards: number): number {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.WATER) {
      return 0;
    }
    return baseDiscards;
  }

  /**
   * 检查卡牌是否失效（完全不计分）
   * 用于花色/人头牌/柱子失效类Boss，卡牌完全不贡献分数
   */
  static isCardDisabled(bossState: BossState, card: Card): boolean {
    const currentBoss = bossState.getCurrentBoss();
    if (!currentBoss) return false;

    switch (currentBoss) {
      case BossType.CLUB:
        return card.suit === Suit.Clubs;
      case BossType.GOAD:
        return card.suit === Suit.Spades;
      case BossType.HEAD:
        return card.suit === Suit.Hearts;
      case BossType.WINDOW:
        return card.suit === Suit.Diamonds;
      case BossType.PLANT:
        return card.rank === Rank.Jack || card.rank === Rank.Queen || card.rank === Rank.King;
      case BossType.PILLAR:
        return bossState.hasCardBeenPlayed(card);
      case BossType.VERDANT_LEAF:
        // 翠绿叶子Boss: 所有卡牌失效直到卖出1张小丑牌
        return !bossState.hasJokerSold();
      default:
        return false;
    }
  }

  /**
   * 回合开始效果
   */
  static onRoundStart(bossState: BossState, jokerSlots: { disableRandomJoker: () => number | null; getJokers: () => readonly JokerInterface[]; flipAllJokers: () => void; shuffleJokers: () => void }, handCards: Card[] = []): BossEffectResult {
    const currentBoss = bossState.getCurrentBoss();

    if (currentBoss === BossType.AMBER_ACORN) {
      // 琥珀橡果Boss: 翻面并洗牌所有小丑牌
      jokerSlots.flipAllJokers();
      jokerSlots.shuffleJokers();
      return {
        jokersShuffled: true,
        jokersFlipped: true,
        message: '琥珀橡果Boss: 小丑牌翻转并洗牌'
      };
    }

    // 深红之心Boss: 随机禁用1个小丑
    if (currentBoss === BossType.CRIMSON_HEART) {
      const disabledIndex = jokerSlots.disableRandomJoker();
      if (disabledIndex !== null) {
        const jokers = jokerSlots.getJokers();
        const disabledJoker = jokers[disabledIndex];
        return {
          disabledJokerIndex: disabledIndex,
          message: `深红之心Boss: ${disabledJoker?.name || '位置' + (disabledIndex + 1)} 被禁用`
        };
      }
    }

    // 天青铃铛Boss: 随机选择1张手牌必须被选中
    if (currentBoss === BossType.CERULEAN_BELL && handCards.length > 0) {
      const randomCard = handCards[Math.floor(Math.random() * handCards.length)];
      bossState.setRequiredCardId(randomCard.toString());
      return {
        requiredCardId: randomCard.toString(),
        message: '天青铃铛Boss: 必须选择特定牌'
      };
    }

    return {};
  }

  /**
   * 回合结束效果
   */
  static onRoundEnd(bossState: BossState): BossEffectResult {
    bossState.onRoundEnd();
    return {};
  }

  /**
   * 新底注开始
   */
  static onNewAnte(bossState: BossState): void {
    bossState.onNewAnte();
  }

  /**
   * 获取牌型等级修正
   */
  static getHandLevelReduction(bossState: BossState, handType: PokerHandType): number {
    return bossState.getHandLevelReduction(handType);
  }

  /**
   * 检查是否是牛Boss的最常用牌型
   */
  static isMostPlayedHand(bossState: BossState, handType: PokerHandType): boolean {
    const currentBoss = bossState.getCurrentBoss();
    return currentBoss === BossType.OX && bossState.isMostPlayedHand(handType);
  }

  /**
   * 重置手臂Boss的等级降低
   */
  static resetHandLevelReduction(bossState: BossState): void {
    bossState.resetHandLevelReduction();
  }

  /**
   * 检查是否是蛇Boss（影响抽牌数量）
   */
  static isSerpentBoss(bossState: BossState): boolean {
    return bossState.getCurrentBoss() === BossType.SERPENT;
  }

  /**
   * 获取蛇Boss的抽牌数量（固定为3）
   */
  static getSerpentDrawCount(): number {
    return 3;
  }

  /**
   * 获取当前Boss的配置信息
   */
  static getBossConfig(bossType: BossType): {
    name: string;
    description: string;
    minAnte: number;
    scoreMultiplier: number;
    reward: number;
  } {
    const configs: Record<BossType, {
      name: string;
      description: string;
      minAnte: number;
      scoreMultiplier: number;
      reward: number;
    }> = {
      [BossType.HOOK]: {
        name: '钩子',
        description: '每次出牌后强制弃掉2张手牌',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.MANACLE]: {
        name: '手铐',
        description: '手牌上限减少1张',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.HOUSE]: {
        name: '房子',
        description: '第一手牌强制面朝下',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.WALL]: {
        name: '墙壁',
        description: '目标分数变为4倍',
        minAnte: 2,
        scoreMultiplier: 4,
        reward: 5
      },
      [BossType.ARM]: {
        name: '手臂',
        description: '每次打出牌型，该牌型等级降低1级',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.TOOTH]: {
        name: '牙齿',
        description: '每打出1张牌损失$1',
        minAnte: 3,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.EYE]: {
        name: '眼睛',
        description: '本回合不能重复打出相同牌型',
        minAnte: 3,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.AMBER_ACORN]: {
        name: '琥珀橡果',
        description: '回合开始时翻转并随机打乱所有小丑牌位置',
        minAnte: 8,
        scoreMultiplier: 2,
        reward: 8
      },
      [BossType.CLUB]: {
        name: '梅花',
        description: '所有梅花牌失效',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.GOAD]: {
        name: '刺棒',
        description: '所有黑桃牌失效',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.HEAD]: {
        name: '头',
        description: '所有红桃牌失效',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.WINDOW]: {
        name: '窗户',
        description: '所有方片牌失效',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.WHEEL]: {
        name: '轮子',
        description: '1/7概率卡牌面朝下',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.FLINT]: {
        name: '燧石',
        description: '最终得分减半',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.MARK]: {
        name: '标记',
        description: '所有人头牌面朝下',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.MOUTH]: {
        name: '嘴',
        description: '本回合只能打出一种牌型',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.PLANT]: {
        name: '植物',
        description: '所有人头牌失效',
        minAnte: 4,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.SERPENT]: {
        name: '蛇',
        description: '出牌或弃牌后，只抽3张牌补充手牌',
        minAnte: 5,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.PILLAR]: {
        name: '柱子',
        description: '本底注中之前出过的牌会失效',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.NEEDLE]: {
        name: '针',
        description: '只能出牌1次',
        minAnte: 2,
        scoreMultiplier: 1,
        reward: 5
      },
      [BossType.OX]: {
        name: '牛',
        description: '打出本回合最常用牌型时，金钱归零',
        minAnte: 6,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.FISH]: {
        name: '鱼',
        description: '出牌后抽到的补充牌面朝下',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.PSYCHIC]: {
        name: '通灵',
        description: '必须正好打出5张牌',
        minAnte: 1,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.WATER]: {
        name: '水',
        description: '0次弃牌机会',
        minAnte: 2,
        scoreMultiplier: 2,
        reward: 5
      },
      [BossType.VERDANT_LEAF]: {
        name: '翠绿叶子',
        description: '所有卡牌失效，直到卖出1张小丑牌',
        minAnte: 8,
        scoreMultiplier: 2,
        reward: 8
      },
      [BossType.VIOLET_VESSEL]: {
        name: '紫色容器',
        description: '目标分数变为6倍',
        minAnte: 8,
        scoreMultiplier: 6,
        reward: 8
      },
      [BossType.CRIMSON_HEART]: {
        name: '深红之心',
        description: '每手牌随机禁用1张小丑牌',
        minAnte: 8,
        scoreMultiplier: 2,
        reward: 8
      },
      [BossType.CERULEAN_BELL]: {
        name: '天青铃铛',
        description: '必须选择1张特定牌',
        minAnte: 8,
        scoreMultiplier: 2,
        reward: 8
      }
    };

    return configs[bossType];
  }
}
