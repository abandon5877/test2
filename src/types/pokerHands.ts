import type { Card } from '../models/Card';

export enum PokerHandType {
  HighCard = 'highCard',
  OnePair = 'onePair',
  TwoPair = 'twoPair',
  ThreeOfAKind = 'threeOfAKind',
  Straight = 'straight',
  Flush = 'flush',
  FullHouse = 'fullHouse',
  FourOfAKind = 'fourOfAKind',
  StraightFlush = 'straightFlush',
  RoyalFlush = 'royalFlush',
  FiveOfAKind = 'fiveOfAKind',
  FlushHouse = 'flushHouse',
  FlushFive = 'flushFive'
}

export interface PokerHandResult {
  readonly handType: PokerHandType;
  readonly baseChips: number;
  readonly baseMultiplier: number;
  readonly scoringCards: readonly Card[];
  readonly kickers: readonly Card[];
  readonly description: string;
}

export interface HandBaseValue {
  readonly chips: number;
  readonly multiplier: number;
  readonly displayName: string;
}

export const HAND_BASE_VALUES: Readonly<Record<PokerHandType, HandBaseValue>> = {
  [PokerHandType.HighCard]: {
    chips: 5,
    multiplier: 1,
    displayName: '高牌'
  },
  [PokerHandType.OnePair]: {
    chips: 10,
    multiplier: 2,
    displayName: '对子'
  },
  [PokerHandType.TwoPair]: {
    chips: 20,
    multiplier: 2,
    displayName: '两对'
  },
  [PokerHandType.ThreeOfAKind]: {
    chips: 30,
    multiplier: 3,
    displayName: '三条'
  },
  [PokerHandType.Straight]: {
    chips: 30,
    multiplier: 4,
    displayName: '顺子'
  },
  [PokerHandType.Flush]: {
    chips: 35,
    multiplier: 4,
    displayName: '同花'
  },
  [PokerHandType.FullHouse]: {
    chips: 40,
    multiplier: 4,
    displayName: '葫芦'
  },
  [PokerHandType.FourOfAKind]: {
    chips: 60,
    multiplier: 7,
    displayName: '四条'
  },
  [PokerHandType.StraightFlush]: {
    chips: 100,
    multiplier: 8,
    displayName: '同花顺'
  },
  [PokerHandType.RoyalFlush]: {
    chips: 100,
    multiplier: 8,
    displayName: '皇家同花顺'
  },
  [PokerHandType.FiveOfAKind]: {
    chips: 120,
    multiplier: 12,
    displayName: '五条'
  },
  [PokerHandType.FlushHouse]: {
    chips: 140,
    multiplier: 14,
    displayName: '同花葫芦'
  },
  [PokerHandType.FlushFive]: {
    chips: 160,
    multiplier: 16,
    displayName: '同花五条'
  }
} as const;

export const POKER_HAND_HIERARCHY: readonly PokerHandType[] = [
  PokerHandType.HighCard,
  PokerHandType.OnePair,
  PokerHandType.TwoPair,
  PokerHandType.ThreeOfAKind,
  PokerHandType.Straight,
  PokerHandType.Flush,
  PokerHandType.FullHouse,
  PokerHandType.FourOfAKind,
  PokerHandType.StraightFlush,
  PokerHandType.RoyalFlush,
  PokerHandType.FiveOfAKind,
  PokerHandType.FlushHouse,
  PokerHandType.FlushFive
] as const;

export function getHandRank(handType: PokerHandType): number {
  return POKER_HAND_HIERARCHY.indexOf(handType);
}

export function compareHandTypes(a: PokerHandType, b: PokerHandType): number {
  return getHandRank(a) - getHandRank(b);
}
