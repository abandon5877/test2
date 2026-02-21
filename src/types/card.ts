export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣'
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A'
}

export interface CardInterface {
  readonly suit: Suit;
  readonly rank: Rank;
  readonly enhancement: CardEnhancement;
  readonly seal: SealType;
  readonly isFaceCard: boolean;
  getChipValue(): number;
  toString(): string;
}

export enum CardEnhancement {
  None = 'none',
  Bonus = 'bonus',
  Mult = 'mult',
  Wild = 'wild',
  Glass = 'glass',
  Steel = 'steel',
  Stone = 'stone',
  Gold = 'gold',
  Lucky = 'lucky'
}

// 卡牌版本（Edition）
export enum CardEdition {
  None = 'none',
  Foil = 'foil',           // 箔片: +50筹码
  Holographic = 'holographic',  // 全息: +10倍率
  Polychrome = 'polychrome',    // 多色: x1.5倍率
  Negative = 'negative'     // 负片: 不占用小丑槽位
}

// 蜡封类型（Seal Type）
export enum SealType {
  None = 'none',
  Gold = 'gold',    // 黄金蜡封: 计分时获得$3
  Red = 'red',      // 红色蜡封: 重新触发卡牌
  Blue = 'blue',    // 蓝色蜡封: 生成1张星球牌
  Purple = 'purple' // 紫色蜡封: 生成1张塔罗牌
}

export const RANK_CHIP_VALUES: Readonly<Record<Rank, number>> = {
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 10,
  [Rank.Queen]: 10,
  [Rank.King]: 10,
  [Rank.Ace]: 11
} as const;

export const FACE_CARDS: readonly Rank[] = [Rank.Jack, Rank.Queen, Rank.King] as const;
