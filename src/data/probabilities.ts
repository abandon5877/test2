import { CardEnhancement, CardEdition, SealType } from '../types/card';
import { JokerEdition } from '../types/joker';

/**
 * 卡牌增强、版本、蜡封出现概率配置
 * 根据 Balatro 官方规则实现
 */

// 游戏牌 (Playing Cards) 基础概率
export const PLAYING_CARD_PROBABILITIES = {
  // 增强概率 - 40% 的卡牌有增强效果
  enhancement: 0.40,

  // 版本概率 (无优惠券时)
  edition: {
    base: {
      [CardEdition.None]: 0.92,       // 92% 无版本
      [CardEdition.Foil]: 0.04,       // 4% 箔片
      [CardEdition.Holographic]: 0.028, // 2.8% 全息
      [CardEdition.Polychrome]: 0.012   // 1.2% 多色
    }
  },

  // 蜡封概率 - 20% 的卡牌有蜡封
  seal: 0.20
};

// 小丑牌 (Jokers) 基础概率
export const JOKER_PROBABILITIES = {
  // 版本概率 (无优惠券时)
  edition: {
    base: {
      [JokerEdition.None]: 0.97,          // 97% 无版本
      [JokerEdition.Foil]: 0.014,         // 1.4% 箔片
      [JokerEdition.Holographic]: 0.003,  // 0.3% 全息
      [JokerEdition.Polychrome]: 0.003,   // 0.3% 多色
      [JokerEdition.Negative]: 0.01       // 1% 负片 (近似值)
    }
  }
};

// 增强类型列表 (平均分布)
const ENHANCEMENT_TYPES = [
  CardEnhancement.Bonus,
  CardEnhancement.Mult,
  CardEnhancement.Wild,
  CardEnhancement.Glass,
  CardEnhancement.Steel,
  CardEnhancement.Stone,
  CardEnhancement.Gold,
  CardEnhancement.Lucky
];

// 蜡封类型列表 (平均分布)
const SEAL_TYPES = [
  SealType.Gold,
  SealType.Red,
  SealType.Blue,
  SealType.Purple
];

/**
 * 获取版本概率倍数
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 倍数 (1 = 无优惠券, 2 = Hone, 4 = Glow Up)
 */
export function getEditionMultiplier(vouchersUsed: string[] = []): number {
  if (vouchersUsed.includes('voucher_glow_up')) return 4;
  if (vouchersUsed.includes('voucher_hone')) return 2;
  return 1;
}

/**
 * 根据优惠券获取游戏牌版本概率分布
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 版本概率分布
 */
export function getPlayingCardEditionProbabilities(vouchersUsed: string[] = []): Record<CardEdition, number> {
  const multiplier = getEditionMultiplier(vouchersUsed);
  const base = PLAYING_CARD_PROBABILITIES.edition.base;

  // 计算调整后的概率
  const foilProb = Math.min(base[CardEdition.Foil] * multiplier, 0.5);
  const holographicProb = Math.min(base[CardEdition.Holographic] * multiplier, 0.3);
  const polychromeProb = Math.min(base[CardEdition.Polychrome] * multiplier, 0.15);

  // 无版本概率 = 1 - 其他概率之和
  const noneProb = Math.max(0, 1 - foilProb - holographicProb - polychromeProb);

  return {
    [CardEdition.None]: noneProb,
    [CardEdition.Foil]: foilProb,
    [CardEdition.Holographic]: holographicProb,
    [CardEdition.Polychrome]: polychromeProb
  };
}

/**
 * 根据优惠券获取小丑牌版本概率分布
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 版本概率分布
 */
export function getJokerEditionProbabilities(vouchersUsed: string[] = []): Record<JokerEdition, number> {
  const multiplier = getEditionMultiplier(vouchersUsed);
  const base = JOKER_PROBABILITIES.edition.base;

  // 计算调整后的概率
  const foilProb = Math.min(base[JokerEdition.Foil] * multiplier, 0.3);
  const holographicProb = Math.min(base[JokerEdition.Holographic] * multiplier, 0.15);
  const polychromeProb = Math.min(base[JokerEdition.Polychrome] * multiplier, 0.08);
  const negativeProb = base[JokerEdition.Negative]; // 负片概率不受优惠券影响

  // 无版本概率 = 1 - 其他概率之和
  const noneProb = Math.max(0, 1 - foilProb - holographicProb - polychromeProb - negativeProb);

  return {
    [JokerEdition.None]: noneProb,
    [JokerEdition.Foil]: foilProb,
    [JokerEdition.Holographic]: holographicProb,
    [JokerEdition.Polychrome]: polychromeProb,
    [JokerEdition.Negative]: negativeProb
  };
}

/**
 * 随机选择增强类型
 * @returns 随机增强类型
 */
export function generateRandomEnhancement(): CardEnhancement {
  const randomIndex = Math.floor(Math.random() * ENHANCEMENT_TYPES.length);
  return ENHANCEMENT_TYPES[randomIndex];
}

/**
 * 随机选择蜡封类型
 * @returns 随机蜡封类型
 */
export function generateRandomSeal(): SealType {
  const randomIndex = Math.floor(Math.random() * SEAL_TYPES.length);
  return SEAL_TYPES[randomIndex];
}

/**
 * 根据概率生成游戏牌版本
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 随机版本
 */
export function generateRandomPlayingCardEdition(vouchersUsed: string[] = []): CardEdition {
  const probabilities = getPlayingCardEditionProbabilities(vouchersUsed);
  const random = Math.random();

  let cumulative = 0;
  for (const [edition, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (random < cumulative) {
      return edition as CardEdition;
    }
  }

  return CardEdition.None;
}

/**
 * 根据概率生成小丑牌版本
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 随机版本
 */
export function generateRandomJokerEdition(vouchersUsed: string[] = []): JokerEdition {
  const probabilities = getJokerEditionProbabilities(vouchersUsed);
  const random = Math.random();

  let cumulative = 0;
  for (const [edition, prob] of Object.entries(probabilities)) {
    cumulative += prob;
    if (random < cumulative) {
      return edition as JokerEdition;
    }
  }

  return JokerEdition.None;
}

/**
 * 生成完整的随机游戏牌增强配置
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 增强配置
 */
export function generatePlayingCardModifiers(vouchersUsed: string[] = []): {
  enhancement: CardEnhancement;
  edition: CardEdition;
  seal: SealType;
} {
  // 40% 概率有增强
  const hasEnhancement = Math.random() < PLAYING_CARD_PROBABILITIES.enhancement;
  const enhancement = hasEnhancement ? generateRandomEnhancement() : CardEnhancement.None;

  // 根据优惠券生成版本
  const edition = generateRandomPlayingCardEdition(vouchersUsed);

  // 20% 概率有蜡封
  const hasSeal = Math.random() < PLAYING_CARD_PROBABILITIES.seal;
  const seal = hasSeal ? generateRandomSeal() : SealType.None;

  return { enhancement, edition, seal };
}

/**
 * 生成小丑牌版本
 * @param vouchersUsed 已使用的优惠券列表
 * @returns 小丑牌版本
 */
export function generateJokerModifier(vouchersUsed: string[] = []): JokerEdition {
  return generateRandomJokerEdition(vouchersUsed);
}
