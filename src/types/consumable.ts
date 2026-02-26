import type { Card } from '../models/Card';
import type { Deck } from '../models/Deck';
import type { Hand } from '../models/Hand';

export enum ConsumableType {
  TAROT = 'tarot',
  PLANET = 'planet',
  SPECTRAL = 'spectral'
}

export interface ConsumableEffectContext {
  readonly hand?: Hand;
  readonly deck?: Deck;
  readonly selectedCards?: readonly Card[];
  readonly handCards?: Card[];
  readonly money?: number;
  readonly setMoney?: (amount: number) => void;
  readonly decreaseHandSize?: (amount: number) => void;
  readonly gameState?: {
    readonly money: number;
    readonly hands: number;
    readonly discards: number;
  };
  readonly lastUsedConsumable?: { id: string; type: ConsumableType };
  readonly addConsumable?: (consumable: ConsumableConfig) => boolean;
  readonly jokers?: readonly { edition?: string; hasEdition?: boolean; sellPrice?: number; sticker?: string }[];
  readonly addJoker?: (rarity?: 'rare' | 'legendary') => boolean;
  readonly copyRandomJoker?: () => { success: boolean; copiedJokerName?: string; originalIndex?: number };
  readonly addEditionToRandomJoker?: (edition: string) => boolean;
  readonly destroyOtherJokers?: (originalIndex?: number) => number;
}

export interface ConsumableEffectResult {
  readonly success: boolean;
  readonly message: string;
  readonly affectedCards?: readonly Card[]; // 被影响的卡牌（仅用于记录/展示，不会被移除）
  readonly destroyedCards?: readonly Card[]; // 需要被摧毁的卡牌（会从手牌中移除）
  readonly newCards?: readonly Card[];
  readonly moneyChange?: number;
  readonly setMoney?: number; // 直接设置金钱数值（优先级高于 moneyChange）
  readonly newConsumableIds?: readonly string[];
  readonly copiedConsumableId?: string;
  readonly handTypeUpgrade?: string; // 需要升级的牌型（星球牌使用）
  readonly upgradeAllHandLevels?: boolean; // 是否升级所有牌型（黑洞牌使用）
}

export interface ConsumableInterface {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ConsumableType;
  readonly cost: number;
  readonly useCondition?: string; // 使用条件描述
  readonly isNegative?: boolean; // 负片效果：消耗牌槽位+1
  sellValueBonus: number; // 礼品卡等增加的售价加成
  use(context: ConsumableEffectContext): ConsumableEffectResult;
  canUse(context: ConsumableEffectContext): boolean;
  clone(): ConsumableInterface;
  increaseSellValue(amount: number): void; // 增加售价加成（礼品卡效果）
  getSellPrice(): number; // 获取总售价（基础售价 + 礼品卡加成）
}

export interface ConsumableConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: ConsumableType;
  readonly cost: number;
  readonly use: (context: ConsumableEffectContext) => ConsumableEffectResult;
  readonly canUse?: (context: ConsumableEffectContext) => boolean;
  readonly useCondition?: string; // 使用条件描述
  readonly isNegative?: boolean; // 负片效果：消耗牌槽位+1
}

export const CONSUMABLE_TYPE_NAMES: Readonly<Record<ConsumableType, string>> = {
  [ConsumableType.TAROT]: '塔罗牌',
  [ConsumableType.PLANET]: '星球牌',
  [ConsumableType.SPECTRAL]: '幻灵牌'
} as const;

export const CONSUMABLE_TYPE_COLORS: Readonly<Record<ConsumableType, string>> = {
  [ConsumableType.TAROT]: '#9b59b6',
  [ConsumableType.PLANET]: '#3498db',
  [ConsumableType.SPECTRAL]: '#1abc9c'
} as const;
