import { Suit } from '../types/card';
import type { Card } from '../models/Card';

/**
 * 有效花色类型
 * 当Smeared_Joker激活时，花色简化为红黑两种
 */
export type EffectiveSuit = Suit | 'red' | 'black';

/**
 * 红色花色
 */
const RED_SUITS = [Suit.Hearts, Suit.Diamonds];

/**
 * 黑色花色
 */
const BLACK_SUITS = [Suit.Spades, Suit.Clubs];

/**
 * 获取卡牌的有效花色
 * @param card 卡牌
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 有效花色
 */
export function getEffectiveSuit(card: Card, hasSmearedJoker: boolean): EffectiveSuit {
  if (!hasSmearedJoker) return card.suit;
  return RED_SUITS.includes(card.suit) ? 'red' : 'black';
}

/**
 * 检查两张卡牌是否为同一花色
 * @param card1 第一张卡牌
 * @param card2 第二张卡牌
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 是否为同一花色
 */
export function isSameSuit(card1: Card, card2: Card, hasSmearedJoker: boolean): boolean {
  return getEffectiveSuit(card1, hasSmearedJoker) === getEffectiveSuit(card2, hasSmearedJoker);
}

/**
 * 获取花色的颜色组
 * @param suit 花色
 * @returns 颜色组 ('red' | 'black')
 */
export function getSuitColor(suit: Suit): 'red' | 'black' {
  return RED_SUITS.includes(suit) ? 'red' : 'black';
}

/**
 * 检查是否为红色花色
 * @param suit 花色
 * @returns 是否为红色
 */
export function isRedSuit(suit: Suit): boolean {
  return RED_SUITS.includes(suit);
}

/**
 * 检查是否为黑色花色
 * @param suit 花色
 * @returns 是否为黑色
 */
export function isBlackSuit(suit: Suit): boolean {
  return BLACK_SUITS.includes(suit);
}

/**
 * 检查卡牌是否为红色
 * @param card 卡牌
 * @param hasSmearedJoker 是否拥有Smeared_Joker（此参数不影响结果，仅保持API一致性）
 * @returns 是否为红色
 */
export function isRedCard(card: Card, hasSmearedJoker: boolean = false): boolean {
  if (hasSmearedJoker) {
    return RED_SUITS.includes(card.suit);
  }
  return RED_SUITS.includes(card.suit);
}

/**
 * 检查卡牌是否为黑色
 * @param card 卡牌
 * @param hasSmearedJoker 是否拥有Smeared_Joker（此参数不影响结果，仅保持API一致性）
 * @returns 是否为黑色
 */
export function isBlackCard(card: Card, hasSmearedJoker: boolean = false): boolean {
  if (hasSmearedJoker) {
    return BLACK_SUITS.includes(card.suit);
  }
  return BLACK_SUITS.includes(card.suit);
}

/**
 * 按有效花色分组卡牌
 * @param cards 卡牌数组
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 按有效花色分组的Map
 */
export function groupByEffectiveSuit(
  cards: readonly Card[],
  hasSmearedJoker: boolean
): Map<EffectiveSuit, Card[]> {
  const groups = new Map<EffectiveSuit, Card[]>();

  for (const card of cards) {
    const effectiveSuit = getEffectiveSuit(card, hasSmearedJoker);
    if (!groups.has(effectiveSuit)) {
      groups.set(effectiveSuit, []);
    }
    groups.get(effectiveSuit)!.push(card);
  }

  return groups;
}

/**
 * 获取所有有效花色
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 有效花色数组
 */
export function getAllEffectiveSuits(hasSmearedJoker: boolean): EffectiveSuit[] {
  if (hasSmearedJoker) {
    return ['red', 'black'];
  }
  return Object.values(Suit);
}

/**
 * 检查卡牌是否匹配目标花色（考虑Smeared_Joker效果）
 * @param card 卡牌
 * @param targetSuit 目标花色
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 是否匹配
 */
export function cardMatchesSuit(
  card: Card,
  targetSuit: Suit,
  hasSmearedJoker: boolean
): boolean {
  if (!hasSmearedJoker) {
    return card.suit === targetSuit;
  }

  // Smeared_Joker激活时，检查颜色组是否匹配
  const cardColor = getSuitColor(card.suit);
  const targetColor = getSuitColor(targetSuit);
  return cardColor === targetColor;
}

/**
 * 计算匹配特定花色的卡牌数量
 * @param cards 卡牌数组
 * @param targetSuit 目标花色
 * @param hasSmearedJoker 是否拥有Smeared_Joker
 * @returns 匹配数量
 */
export function countCardsMatchingSuit(
  cards: readonly Card[],
  targetSuit: Suit,
  hasSmearedJoker: boolean
): number {
  return cards.filter(card => cardMatchesSuit(card, targetSuit, hasSmearedJoker)).length;
}
