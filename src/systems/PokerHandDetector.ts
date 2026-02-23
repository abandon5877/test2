import { Card } from '../models/Card';
import { Rank, Suit, CardEnhancement } from '../types/card';
import { PokerHandType, PokerHandResult, HAND_BASE_VALUES } from '../types/pokerHands';
import { groupByEffectiveSuit, EffectiveSuit } from '../utils/suitUtils';

export interface PokerHandDetectorConfig {
  fourFingers?: boolean; // 四指效果：同花/顺子只需4张
  shortcut?: boolean;    // 捷径效果：顺子可跳1个数字
  smearedJoker?: boolean; // Smeared_Joker效果：花色简化为红黑两种
}

export class PokerHandDetector {
  private static readonly RANK_ORDER: readonly Rank[] = [
    Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
    Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
    Rank.Jack, Rank.Queen, Rank.King, Rank.Ace
  ] as const;
  
  private static config: PokerHandDetectorConfig = {};

  static setConfig(config: PokerHandDetectorConfig): void {
    this.config = config;
  }

  static clearConfig(): void {
    this.config = {};
  }

  private static getRankIndex(rank: Rank): number {
    return this.RANK_ORDER.indexOf(rank);
  }

  private static sortByRankDesc(cards: readonly Card[]): Card[] {
    return [...cards].sort((a, b) => {
      // Stone cards should always be scored first (they always count)
      const aIsStone = a.enhancement === CardEnhancement.Stone;
      const bIsStone = b.enhancement === CardEnhancement.Stone;
      
      if (aIsStone && !bIsStone) return -1;
      if (!aIsStone && bIsStone) return 1;
      
      return this.getRankIndex(b.rank) - this.getRankIndex(a.rank);
    });
  }

  private static groupByRank(cards: readonly Card[]): Map<Rank, Card[]> {
    const groups = new Map<Rank, Card[]>();
    for (const card of cards) {
      if (!groups.has(card.rank)) {
        groups.set(card.rank, []);
      }
      groups.get(card.rank)!.push(card);
    }
    return groups;
  }

  private static groupBySuit(cards: readonly Card[]): Map<Suit | EffectiveSuit, Card[]> {
    // 使用有效花色分组（支持Smeared_Joker效果）
    const hasSmearedJoker = this.config.smearedJoker ?? false;

    // 修复13: 分离万能牌和普通卡牌
    const wildCards = cards.filter(c => c.enhancement === CardEnhancement.Wild);
    const normalCards = cards.filter(c => c.enhancement !== CardEnhancement.Wild);

    // 先按有效花色分组普通卡牌
    const groups = groupByEffectiveSuit(normalCards, hasSmearedJoker);

    // 修复13: 万能牌可以视为任意花色，添加到每个花色组
    if (wildCards.length > 0) {
      for (const [suit, suitedCards] of groups) {
        // 为每个花色组添加万能牌（作为该花色的副本）
        for (const wildCard of wildCards) {
          suitedCards.push(wildCard);
        }
      }

      // 如果只有万能牌，为每个有效花色创建一个组
      if (groups.size === 0) {
        const effectiveSuits = hasSmearedJoker ? ['red', 'black'] as EffectiveSuit[] : Object.values(Suit);
        for (const suit of effectiveSuits) {
          groups.set(suit, [...wildCards]);
        }
      }
    }

    return groups;
  }

  static detect(cards: readonly Card[]): PokerHandResult {
    if (cards.length === 0) {
      return this.createResult(PokerHandType.HighCard, [], [], '无牌');
    }

    const sortedCards = this.sortByRankDesc(cards);

    // 按照官方规则优先级检测牌型
    // 秘密牌型优先级最高

    // 1. 检测 Flush Five (同花五条) - 五张同花色同点数
    const flushFive = this.detectFlushFive(sortedCards);
    if (flushFive) return flushFive;

    // 2. 检测 Flush House (同花葫芦) - 同花色的葫芦
    const flushHouse = this.detectFlushHouse(sortedCards);
    if (flushHouse) return flushHouse;

    // 3. 检测 Five of a Kind (五条) - 五张同点数
    const fiveOfAKind = this.detectFiveOfAKind(sortedCards);
    if (fiveOfAKind) return fiveOfAKind;

    // 4. 检测 Royal Flush (皇家同花顺)
    const royalFlush = this.detectRoyalFlush(sortedCards);
    if (royalFlush) return royalFlush;

    // 5. 检测 Straight Flush (同花顺)
    const straightFlush = this.detectStraightFlush(sortedCards);
    if (straightFlush) return straightFlush;

    // 6. 检测 Four of a Kind (四条)
    const fourOfAKind = this.detectFourOfAKind(sortedCards);
    if (fourOfAKind) return fourOfAKind;

    // 7. 检测 Full House (葫芦)
    const fullHouse = this.detectFullHouse(sortedCards);
    if (fullHouse) return fullHouse;

    // 8. 检测 Flush (同花)
    const flush = this.detectFlush(sortedCards);
    if (flush) return flush;

    // 9. 检测 Straight (顺子)
    const straight = this.detectStraight(sortedCards);
    if (straight) return straight;

    // 10. 检测 Three of a Kind (三条)
    const threeOfAKind = this.detectThreeOfAKind(sortedCards);
    if (threeOfAKind) return threeOfAKind;

    // 11. 检测 Two Pair (两对)
    const twoPair = this.detectTwoPair(sortedCards);
    if (twoPair) return twoPair;

    // 12. 检测 One Pair (对子)
    const onePair = this.detectOnePair(sortedCards);
    if (onePair) return onePair;

    // 13. 高牌
    return this.detectHighCard(sortedCards);
  }

  // 检测 Flush Five (同花五条) - 五张同花色同点数
  private static detectFlushFive(cards: readonly Card[]): PokerHandResult | null {
    if (cards.length < 5) return null;

    const suitGroups = this.groupBySuit(cards);
    for (const [suit, suitedCards] of suitGroups) {
      if (suitedCards.length >= 5) {
        const rankGroups = this.groupByRank(suitedCards);
        for (const [rank, rankedCards] of rankGroups) {
          if (rankedCards.length >= 5) {
            let description = HAND_BASE_VALUES[PokerHandType.FlushFive].displayName;
            if (this.config.smearedJoker) {
              description += ' (污损)';
            }
            return this.createResult(
              PokerHandType.FlushFive,
              rankedCards.slice(0, 5),
              [],
              description
            );
          }
        }
      }
    }
    return null;
  }

  // 检测 Flush House (同花葫芦) - 同花色的葫芦
  private static detectFlushHouse(cards: readonly Card[]): PokerHandResult | null {
    if (cards.length < 5) return null;

    const suitGroups = this.groupBySuit(cards);
    for (const [suit, suitedCards] of suitGroups) {
      if (suitedCards.length >= 5) {
        const rankGroups = this.groupByRank(suitedCards);
        const groups = Array.from(rankGroups.values()).sort((a, b) => b.length - a.length);

        // 需要至少一个三张和一个两张
        const threeOfAKind = groups.find(g => g.length >= 3);
        const pair = groups.find(g => g.length >= 2 && g[0].rank !== threeOfAKind?.[0].rank);

        if (threeOfAKind && pair) {
          let description = HAND_BASE_VALUES[PokerHandType.FlushHouse].displayName;
          if (this.config.smearedJoker) {
            description += ' (污损)';
          }
          return this.createResult(
            PokerHandType.FlushHouse,
            [...threeOfAKind.slice(0, 3), ...pair.slice(0, 2)],
            [],
            description
          );
        }
      }
    }
    return null;
  }

  // 检测 Five of a Kind (五条) - 五张同点数
  private static detectFiveOfAKind(cards: readonly Card[]): PokerHandResult | null {
    const rankGroups = this.groupByRank(cards);

    for (const [rank, rankedCards] of rankGroups) {
      if (rankedCards.length >= 5) {
        return this.createResult(
          PokerHandType.FiveOfAKind,
          rankedCards.slice(0, 5),
          [],
          HAND_BASE_VALUES[PokerHandType.FiveOfAKind].displayName
        );
      }
    }
    return null;
  }

  private static detectRoyalFlush(cards: readonly Card[]): PokerHandResult | null {
    // 皇家同花顺定义：所有牌都是10或更高点数的同花顺
    // 有四指时4张即可，没有四指时需要5张
    const requiredCards = this.config.fourFingers ? 4 : 5;

    if (cards.length < requiredCards) return null;

    const suitGroups = this.groupBySuit(cards);

    // 定义10或更高的点数
    const highRanks = [Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

    for (const [suit, suitedCards] of suitGroups) {
      if (suitedCards.length >= requiredCards) {
        // 检查是否所有牌都是10或更高
        const allHighCards = suitedCards.every(c => highRanks.includes(c.rank));
        if (!allHighCards) continue;

        // 检查是否是同花顺（连续的）
        const straight = this.findStraight(suitedCards, requiredCards);
        if (straight) {
          let description = HAND_BASE_VALUES[PokerHandType.RoyalFlush].displayName;
          if (this.config.smearedJoker) {
            description += ' (污损)';
          }
          return this.createResult(
            PokerHandType.RoyalFlush,
            straight,
            [],
            description
          );
        }
      }
    }
    return null;
  }

  private static detectStraightFlush(cards: readonly Card[]): PokerHandResult | null {
    const requiredCards = this.config.fourFingers ? 4 : 5;

    if (cards.length < requiredCards) return null;

    const suitGroups = this.groupBySuit(cards);

    for (const [suit, suitedCards] of suitGroups) {
      if (suitedCards.length >= requiredCards) {
        const straight = this.findStraight(suitedCards, requiredCards);
        if (straight) {
          const kickers = this.config.fourFingers ?
            suitedCards.filter(c => !straight.includes(c)).slice(0, 1) : [];

          // 构建描述信息
          let description = HAND_BASE_VALUES[PokerHandType.StraightFlush].displayName;
          const modifiers: string[] = [];
          if (this.config.fourFingers) {
            modifiers.push('四指');
          }
          if (this.config.smearedJoker) {
            modifiers.push('污损');
          }
          if (modifiers.length > 0) {
            description += ` (${modifiers.join('+')})`;
          }

          return this.createResult(
            PokerHandType.StraightFlush,
            straight,
            kickers,
            description
          );
        }
      }
    }
    return null;
  }

  private static detectFourOfAKind(cards: readonly Card[]): PokerHandResult | null {
    const rankGroups = this.groupByRank(cards);

    for (const [rank, rankedCards] of rankGroups) {
      if (rankedCards.length >= 4) {
        const scoringCards = rankedCards.slice(0, 4);
        const kickers = cards.filter(c => c.rank !== rank).slice(0, 1);

        return this.createResult(
          PokerHandType.FourOfAKind,
          scoringCards,
          kickers,
          HAND_BASE_VALUES[PokerHandType.FourOfAKind].displayName
        );
      }
    }
    return null;
  }

  private static detectFullHouse(cards: readonly Card[]): PokerHandResult | null {
    if (cards.length < 5) return null;

    const rankGroups = this.groupByRank(cards);
    const groups = Array.from(rankGroups.values()).sort((a, b) => b.length - a.length);

    const threeOfAKind = groups.find(g => g.length >= 3);
    const pair = groups.find(g => g.length >= 2 && g[0].rank !== threeOfAKind?.[0].rank);

    if (threeOfAKind && pair) {
      return this.createResult(
        PokerHandType.FullHouse,
        [...threeOfAKind.slice(0, 3), ...pair.slice(0, 2)],
        [],
        HAND_BASE_VALUES[PokerHandType.FullHouse].displayName
      );
    }
    return null;
  }

  private static detectFlush(cards: readonly Card[]): PokerHandResult | null {
    const requiredCards = this.config.fourFingers ? 4 : 5;

    console.log('[PokerHandDetector] 检测同花:', {
      cardCount: cards.length,
      requiredCards,
      fourFingers: this.config.fourFingers,
      smearedJoker: this.config.smearedJoker
    });

    if (cards.length < requiredCards) return null;

    const suitGroups = this.groupBySuit(cards);

    for (const [suit, suitedCards] of suitGroups) {
      if (suitedCards.length >= requiredCards) {
        const sorted = this.sortByRankDesc(suitedCards);
        // 修复: 四指效果下，如果有5张或更多同花牌，应该按5张计算（不是4张）
        // 四指只是降低门槛到4张，但5张同花仍然是5张同花
        const scoringCardCount = Math.min(sorted.length, 5);
        const scoringCards = sorted.slice(0, scoringCardCount);
        // 踢牌：超过5张的部分
        const kickers = sorted.length > 5 ? sorted.slice(5, 6) : [];

        // 构建描述信息
        let description = HAND_BASE_VALUES[PokerHandType.Flush].displayName;
        const modifiers: string[] = [];
        if (this.config.fourFingers && suitedCards.length === 4) {
          modifiers.push('四指');
        }
        if (this.config.smearedJoker) {
          modifiers.push('污损');
        }
        if (modifiers.length > 0) {
          description += ` (${modifiers.join('+')})`;
        }

        return this.createResult(
          PokerHandType.Flush,
          scoringCards,
          kickers,
          description
        );
      }
    }
    return null;
  }

  private static detectStraight(cards: readonly Card[]): PokerHandResult | null {
    const requiredCards = this.config.fourFingers ? 4 : 5;
    
    console.log('[PokerHandDetector] 检测顺子:', {
      cardCount: cards.length,
      requiredCards,
      fourFingers: this.config.fourFingers
    });
    
    if (cards.length < requiredCards) return null;

    const straight = this.findStraight(cards, requiredCards);
    if (straight) {
      const kickers = this.config.fourFingers ? 
        cards.filter(c => !straight.includes(c)).slice(0, 1) : [];
      return this.createResult(
        PokerHandType.Straight,
        straight,
        kickers,
        HAND_BASE_VALUES[PokerHandType.Straight].displayName + (this.config.fourFingers ? ' (四指)' : '')
      );
    }
    return null;
  }

  private static findStraight(cards: readonly Card[], requiredCards: number = 5): Card[] | null {
    const uniqueRanks = new Map<Rank, Card>();
    for (const card of cards) {
      if (!uniqueRanks.has(card.rank) || this.getRankIndex(card.rank) > this.getRankIndex(uniqueRanks.get(card.rank)!.rank)) {
        uniqueRanks.set(card.rank, card);
      }
    }

    const uniqueCards = this.sortByRankDesc(Array.from(uniqueRanks.values()));

    // 检查普通顺子
    for (let i = 0; i <= uniqueCards.length - requiredCards; i++) {
      const subset = uniqueCards.slice(i, i + requiredCards);
      if (this.isConsecutive(subset)) {
        return subset;
      }
    }

    // 检查捷径顺子（可跳1个数字）
    if (this.config.shortcut && requiredCards === 5) {
      const shortcutStraight = this.findShortcutStraight(uniqueCards);
      if (shortcutStraight) {
        return shortcutStraight;
      }
    }

    // 检查 A-2-3-4-5 小顺（需要5张牌）
    if (requiredCards === 5) {
      const hasAce = uniqueCards.some(c => c.rank === Rank.Ace);
      const hasTwo = uniqueCards.some(c => c.rank === Rank.Two);
      const hasThree = uniqueCards.some(c => c.rank === Rank.Three);
      const hasFour = uniqueCards.some(c => c.rank === Rank.Four);
      const hasFive = uniqueCards.some(c => c.rank === Rank.Five);

      if (hasAce && hasTwo && hasThree && hasFour && hasFive) {
        const ace = uniqueCards.find(c => c.rank === Rank.Ace)!;
        const two = uniqueCards.find(c => c.rank === Rank.Two)!;
        const three = uniqueCards.find(c => c.rank === Rank.Three)!;
        const four = uniqueCards.find(c => c.rank === Rank.Four)!;
        const five = uniqueCards.find(c => c.rank === Rank.Five)!;
        return [five, four, three, two, ace];
      }
    }

    return null;
  }

  private static findShortcutStraight(cards: Card[]): Card[] | null {
    if (cards.length < 5) return null;

    // 尝试找到可以跳1个数字的5张牌序列
    for (let i = 0; i <= cards.length - 5; i++) {
      const result = this.tryFindShortcutSequence(cards.slice(i));
      if (result) return result;
    }

    return null;
  }

  private static tryFindShortcutSequence(cards: Card[]): Card[] | null {
    if (cards.length < 5) return null;

    const sequence: Card[] = [cards[0]];
    let skipCount = 0;

    for (let i = 1; i < cards.length && sequence.length < 5; i++) {
      const lastCard = sequence[sequence.length - 1];
      const currentCard = cards[i];
      const gap = this.getRankIndex(lastCard.rank) - this.getRankIndex(currentCard.rank);

      if (gap === 1) {
        // 连续
        sequence.push(currentCard);
      } else if (gap === 2 && skipCount === 0) {
        // 跳1个数字，且还没跳过
        skipCount++;
        sequence.push(currentCard);
      } else if (gap > 2) {
        // 差距太大，无法形成顺子
        break;
      }
      // gap === 0 是相同点数，跳过
    }

    return sequence.length === 5 ? sequence : null;
  }

  private static isConsecutive(cards: readonly Card[]): boolean {
    for (let i = 0; i < cards.length - 1; i++) {
      const currentIndex = this.getRankIndex(cards[i].rank);
      const nextIndex = this.getRankIndex(cards[i + 1].rank);
      if (currentIndex - nextIndex !== 1) {
        return false;
      }
    }
    return true;
  }

  private static detectThreeOfAKind(cards: readonly Card[]): PokerHandResult | null {
    const rankGroups = this.groupByRank(cards);

    for (const [rank, rankedCards] of rankGroups) {
      if (rankedCards.length >= 3) {
        const scoringCards = rankedCards.slice(0, 3);
        const kickers = cards.filter(c => c.rank !== rank).slice(0, 2);

        return this.createResult(
          PokerHandType.ThreeOfAKind,
          scoringCards,
          kickers,
          HAND_BASE_VALUES[PokerHandType.ThreeOfAKind].displayName
        );
      }
    }
    return null;
  }

  private static detectTwoPair(cards: readonly Card[]): PokerHandResult | null {
    if (cards.length < 4) return null;

    const rankGroups = this.groupByRank(cards);
    const pairs: Card[][] = [];

    for (const [rank, rankedCards] of rankGroups) {
      if (rankedCards.length >= 2) {
        pairs.push(rankedCards.slice(0, 2));
      }
    }

    if (pairs.length >= 2) {
      // 选择最大的两对
      pairs.sort((a, b) => this.getRankIndex(b[0].rank) - this.getRankIndex(a[0].rank));
      const scoringCards = [...pairs[0], ...pairs[1]];
      const usedRanks = new Set([pairs[0][0].rank, pairs[1][0].rank]);
      const kickers = cards.filter(c => !usedRanks.has(c.rank)).slice(0, 1);

      return this.createResult(
        PokerHandType.TwoPair,
        scoringCards,
        kickers,
        HAND_BASE_VALUES[PokerHandType.TwoPair].displayName
      );
    }
    return null;
  }

  private static detectOnePair(cards: readonly Card[]): PokerHandResult | null {
    const rankGroups = this.groupByRank(cards);

    for (const [rank, rankedCards] of rankGroups) {
      if (rankedCards.length >= 2) {
        const scoringCards = rankedCards.slice(0, 2);
        const kickers = cards.filter(c => c.rank !== rank).slice(0, 3);

        return this.createResult(
          PokerHandType.OnePair,
          scoringCards,
          kickers,
          HAND_BASE_VALUES[PokerHandType.OnePair].displayName
        );
      }
    }
    return null;
  }

  private static detectHighCard(cards: readonly Card[]): PokerHandResult {
    const sorted = this.sortByRankDesc(cards);
    const scoringCards = sorted.slice(0, 1);
    const kickers = sorted.slice(1, 5);

    return this.createResult(
      PokerHandType.HighCard,
      scoringCards,
      kickers,
      HAND_BASE_VALUES[PokerHandType.HighCard].displayName
    );
  }

  private static createResult(
    handType: PokerHandType,
    scoringCards: readonly Card[],
    kickers: readonly Card[],
    description: string
  ): PokerHandResult {
    const baseValues = HAND_BASE_VALUES[handType];
    return {
      handType,
      baseChips: baseValues.chips,
      baseMultiplier: baseValues.multiplier,
      scoringCards,
      kickers,
      description
    };
  }
}
