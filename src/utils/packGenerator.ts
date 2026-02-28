/**
 * 卡包生成模块
 * 统一处理所有卡包内容生成逻辑，确保 main.ts 和 OpenPackComponent 使用相同的逻辑
 */

import { type BoosterPack } from '../data/consumables';
import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Joker } from '../models/Joker';
import { Consumable } from '../models/Consumable';
import { Suit, Rank } from '../types/card';
import { getRandomJokers } from '../data/jokers';
import { getRandomConsumables } from '../data/consumables';
import { getPlanetConsumableByHandType } from '../data/consumables/planets';
import { generatePlayingCardModifiers } from '../data/probabilities';
import { ProbabilitySystem, PROBABILITIES } from '../systems/ProbabilitySystem';
import { Toast } from '../ui/components/Toast';

export type PackContent = Card | Joker | Consumable;

export interface PackGenerationOptions {
  /** 是否应用幻觉（Hallucination）效果 */
  applyHallucination?: boolean;
  /** 是否显示 Toast 提示 */
  showToast?: boolean;
}

/**
 * 生成卡包内容
 * @param pack 卡包定义
 * @param gameState 游戏状态
 * @param options 生成选项
 * @returns 卡包内容列表
 */
export function generatePackContents(
  pack: BoosterPack,
  gameState: GameState,
  options: PackGenerationOptions = {}
): PackContent[] {
  const { applyHallucination = true, showToast = true } = options;
  const contents: PackContent[] = [];

  // 获取已使用的优惠券
  const vouchersUsed = gameState.getVouchersUsed ? gameState.getVouchersUsed() : [];

  switch (pack.type) {
    case 'standard':
      contents.push(...generateStandardPackContents(pack.choices, vouchersUsed));
      break;

    case 'arcana':
      contents.push(...getRandomConsumables(pack.choices, 'tarot'));
      break;

    case 'celestial':
      contents.push(...generateCelestialPackContents(pack, gameState, vouchersUsed));
      break;

    case 'buffoon':
      contents.push(...generateBuffoonPackContents(pack, gameState, vouchersUsed));
      break;

    case 'spectral':
      contents.push(...getRandomConsumables(pack.choices, 'spectral'));
      break;
  }

  // 处理Hallucination（幻觉）效果
  if (applyHallucination) {
    applyHallucinationEffect(contents, gameState, showToast);
  }

  return contents;
}

/**
 * 生成标准卡包内容
 * @param choices 卡牌数量
 * @param vouchersUsed 已使用的优惠券
 * @returns 卡牌列表
 */
function generateStandardPackContents(
  choices: number,
  vouchersUsed: string[]
): Card[] {
  const contents: Card[] = [];
  const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
  const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

  for (let i = 0; i < choices; i++) {
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    // 使用 generatePlayingCardModifiers 生成增强/版本/蜡封
    const { enhancement, edition, seal } = generatePlayingCardModifiers(vouchersUsed);
    contents.push(new Card(randomSuit, randomRank, enhancement, seal, edition));
  }

  return contents;
}

/**
 * 生成天体卡包内容
 * @param pack 卡包定义
 * @param gameState 游戏状态
 * @param vouchersUsed 已使用的优惠券
 * @returns 星球牌列表
 */
function generateCelestialPackContents(
  pack: BoosterPack,
  gameState: GameState,
  vouchersUsed: string[]
): Consumable[] {
  const contents: Consumable[] = [];

  // 检查是否有望远镜优惠券
  const hasTelescope = vouchersUsed.includes('voucher_telescope');

  // 使用全局牌型统计（不会随新底注重置）
  const mostPlayedHand = hasTelescope ? gameState.getMostPlayedHandGlobal() : null;

  if (hasTelescope && mostPlayedHand) {
    // 有望远镜且有最常打出的牌型：包含该牌型对应的星球牌
    const targetPlanet = getPlanetConsumableByHandType(mostPlayedHand);

    if (targetPlanet) {
      // 第一张是目标星球牌，其余随机
      contents.push(targetPlanet);
      if (pack.choices > 1) {
        const randomPlanets = getRandomConsumables(pack.choices - 1, 'planet')
          .filter(p => p.id !== targetPlanet.id); // 避免重复
        contents.push(...randomPlanets);
      }
    } else {
      // 找不到对应星球牌，全部随机
      contents.push(...getRandomConsumables(pack.choices, 'planet'));
    }
  } else {
    // 没有望远镜或没有最常打出的牌型：全部随机
    contents.push(...getRandomConsumables(pack.choices, 'planet'));
  }

  return contents;
}

/**
 * 生成小丑卡包内容
 * @param pack 卡包定义
 * @param gameState 游戏状态
 * @param vouchersUsed 已使用的优惠券
 * @returns 小丑牌列表
 */
function generateBuffoonPackContents(
  pack: BoosterPack,
  gameState: GameState,
  vouchersUsed: string[]
): Joker[] {
  // 获取玩家已有的小丑牌ID
  const playerJokerIds = gameState.jokerSlots.getJokers().map(j => j.id);

  // 同时排除商店中已有的小丑牌
  const shopJokerIds = gameState.shop?.items
    .filter(item => item.type === 'joker' && !item.sold)
    .map(item => (item.item as Joker).id) || [];

  const existingJokerIds = [...new Set([...playerJokerIds, ...shopJokerIds])];

  return getRandomJokers(pack.choices, vouchersUsed, existingJokerIds);
}

/**
 * 应用幻觉（Hallucination）效果
 * @param contents 当前卡包内容
 * @param gameState 游戏状态
 * @param showToast 是否显示提示
 */
function applyHallucinationEffect(
  contents: PackContent[],
  gameState: GameState,
  showToast: boolean
): void {
  const hasHallucination = gameState.jokerSlots.getActiveJokers().some(j => j.id === 'hallucination');

  if (hasHallucination) {
    // 更新Oops! All 6s数量
    const oopsCount = gameState.jokerSlots.getActiveJokers().filter(j => j.id === 'oops_all_6s').length;
    ProbabilitySystem.setOopsAll6sCount(oopsCount);

    if (ProbabilitySystem.check(PROBABILITIES.HALLUCINATION)) {
      const tarotCards = getRandomConsumables(1, 'tarot');
      if (tarotCards.length > 0) {
        contents.push(tarotCards[0]);
        if (showToast) {
          Toast.info('幻觉: 生成了一张塔罗牌！');
        }
      }
    }
  }
}

/**
 * 生成单张随机游戏牌（带增强/版本/蜡封）
 * @param vouchersUsed 已使用的优惠券
 * @returns 随机游戏牌
 */
export function generateRandomPlayingCard(vouchersUsed: string[] = []): Card {
  const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
  const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

  const randomSuit = suits[Math.floor(Math.random() * suits.length)];
  const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

  // 生成增强、版本、蜡封
  const { enhancement, edition, seal } = generatePlayingCardModifiers(vouchersUsed);

  return new Card(randomSuit, randomRank, enhancement, seal, edition);
}
