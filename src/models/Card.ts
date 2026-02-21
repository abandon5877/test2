import { Suit, Rank, CardInterface, CardEnhancement, SealType, CardEdition, RANK_CHIP_VALUES, FACE_CARDS } from '../types/card';

// 点数顺序数组，用于Strength效果
const RANK_ORDER = [
  Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace
];

/**
 * 卡牌类
 * 注意：为了向后兼容，属性保持可变性
 * 新代码建议使用 withXXX() 方法创建新实例
 */
export class Card implements CardInterface {
  suit: Suit;
  rank: Rank;
  enhancement: CardEnhancement;
  seal: SealType;
  edition: CardEdition;

  constructor(
    suit: Suit,
    rank: Rank,
    enhancement: CardEnhancement = CardEnhancement.None,
    seal: SealType = SealType.None,
    edition: CardEdition = CardEdition.None
  ) {
    this.suit = suit;
    this.rank = rank;
    this.enhancement = enhancement;
    this.seal = seal;
    this.edition = edition;
  }

  get isFaceCard(): boolean {
    return FACE_CARDS.includes(this.rank);
  }

  /**
   * 是否为石头牌（无点数和花色）
   */
  get isStoneCard(): boolean {
    return this.enhancement === CardEnhancement.Stone;
  }

  /**
   * 获取有效花色（石头牌返回null）
   */
  getEffectiveSuit(): Suit | null {
    return this.isStoneCard ? null : this.suit;
  }

  /**
   * 获取有效点数（石头牌返回null）
   */
  getEffectiveRank(): Rank | null {
    return this.isStoneCard ? null : this.rank;
  }

  getChipValue(): number {
    let baseValue = RANK_CHIP_VALUES[this.rank];

    switch (this.enhancement) {
      // 修复: Bonus效果在ScoringSystem中统一处理，避免重复计算
      // case CardEnhancement.Bonus:
      //   baseValue += 30;
      //   break;
      case CardEnhancement.Stone:
        return 50;
      default:
        break;
    }

    return baseValue;
  }

  toString(): string {
    if (this.isStoneCard) {
      return '石头';
    }
    return `${this.suit}${this.rank}`;
  }

  clone(): Card {
    return new Card(this.suit, this.rank, this.enhancement, this.seal, this.edition);
  }

  equals(other: Card): boolean {
    return this.suit === other.suit && this.rank === other.rank;
  }

  getDisplayName(): string {
    if (this.isStoneCard) {
      return '石头';
    }

    const suitNames: Record<Suit, string> = {
      [Suit.Spades]: '黑桃',
      [Suit.Hearts]: '红桃',
      [Suit.Diamonds]: '方片',
      [Suit.Clubs]: '梅花'
    };

    const rankNames: Record<Rank, string> = {
      [Rank.Two]: '2',
      [Rank.Three]: '3',
      [Rank.Four]: '4',
      [Rank.Five]: '5',
      [Rank.Six]: '6',
      [Rank.Seven]: '7',
      [Rank.Eight]: '8',
      [Rank.Nine]: '9',
      [Rank.Ten]: '10',
      [Rank.Jack]: 'J',
      [Rank.Queen]: 'Q',
      [Rank.King]: 'K',
      [Rank.Ace]: 'A'
    };

    return `${suitNames[this.suit]}${rankNames[this.rank]}`;
  }

  // ========== 不可变操作方法（推荐新代码使用）==========

  /**
   * 返回带有新增强效果的新卡牌实例
   */
  withEnhancement(enhancement: CardEnhancement): Card {
    return new Card(this.suit, this.rank, enhancement, this.seal, this.edition);
  }

  /**
   * 返回带有新蜡封的新卡牌实例
   */
  withSeal(seal: SealType): Card {
    return new Card(this.suit, this.rank, this.enhancement, seal, this.edition);
  }

  /**
   * 返回带有新版本的新卡牌实例
   */
  withEdition(edition: CardEdition): Card {
    return new Card(this.suit, this.rank, this.enhancement, this.seal, edition);
  }

  /**
   * 返回带有新花色（用于塔罗牌改变花色效果）的新卡牌实例
   */
  withSuit(suit: Suit): Card {
    return new Card(suit, this.rank, this.enhancement, this.seal, this.edition);
  }

  /**
   * 返回带有新点数（用于Strength塔罗牌效果）的新卡牌实例
   * @param amount 增加的点数（1-3）
   * @returns 新卡牌实例
   */
  withIncreasedRank(amount: number): Card {
    const currentIndex = RANK_ORDER.indexOf(this.rank);
    if (currentIndex === -1) return this.clone();
    
    const newIndex = Math.min(currentIndex + amount, RANK_ORDER.length - 1);
    const newRank = RANK_ORDER[newIndex];
    
    return new Card(this.suit, newRank, this.enhancement, this.seal, this.edition);
  }

  /**
   * 增加点数（用于Strength塔罗牌效果）
   * @param amount 增加的点数（1-3）
   * @returns 实际增加的点数
   */
  increaseRank(amount: number): number {
    const currentIndex = RANK_ORDER.indexOf(this.rank);
    if (currentIndex === -1) return 0;
    
    const newIndex = Math.min(currentIndex + amount, RANK_ORDER.length - 1);
    const actualIncrease = newIndex - currentIndex;
    
    this.rank = RANK_ORDER[newIndex];
    
    return actualIncrease;
  }
}
