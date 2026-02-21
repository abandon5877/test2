import type { ConsumableInterface, ConsumableEffectContext, ConsumableEffectResult } from '../../types/consumable';
import { ConsumableType } from '../../types/consumable';
import { PokerHandType } from '../../types/pokerHands';

/**
 * 基础消耗品数据接口
 */
export interface ConsumableData {
  id: string;
  name: string;
  description: string;
  type: ConsumableType;
  cost: number;
  useCondition?: string;
}

/**
 * 塔罗牌数据接口
 */
export interface TarotData extends ConsumableData {
  type: ConsumableType.TAROT;
  use: (context: ConsumableEffectContext) => ConsumableEffectResult;
  canUse?: (context: ConsumableEffectContext) => boolean;
}

/**
 * 星球牌数据接口
 */
export interface PlanetData extends ConsumableData {
  type: ConsumableType.PLANET;
  handType: PokerHandType;
  chipBonus: number;
  multBonus: number;
  /**
   * 创建使用函数
   * 工厂方法，用于生成星球牌的效果逻辑
   */
  createUseFunction(): (context: ConsumableEffectContext) => ConsumableEffectResult;
}

/**
 * 幻灵牌数据接口
 */
export interface SpectralData extends ConsumableData {
  type: ConsumableType.SPECTRAL;
  use: (context: ConsumableEffectContext) => ConsumableEffectResult;
  canUse?: (context: ConsumableEffectContext) => boolean;
}

/**
 * 消耗品数据联合类型
 */
export type ConsumableDataType = TarotData | PlanetData | SpectralData;
