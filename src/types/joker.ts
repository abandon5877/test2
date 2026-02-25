import type { Card } from '../models/Card';
import type { PokerHandType } from './pokerHands';
import { Suit } from './card';

export enum JokerRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  LEGENDARY = 'legendary'
}

// 贴纸类型（Sticker）
export enum StickerType {
  None = 'none',
  Eternal = 'eternal',     // 永恒: 无法出售
  Perishable = 'perishable', // 易腐: 5回合后摧毁
  Rental = 'rental'        // 租赁: 回合结束-$3
}

// 小丑牌版本（Edition）- spec 2.4.3
export enum JokerEdition {
  None = 'none',
  Foil = 'foil',           // 闪箔: +50筹码
  Holographic = 'holographic',  // 全息: +10倍率
  Polychrome = 'polychrome',    // 多彩: ×1.5倍率
  Negative = 'negative'     // 负片: +1小丑牌槽位
}

export enum JokerTrigger {
  ON_SCORED = 'on_scored',
  ON_HELD = 'on_held',
  ON_DISCARD = 'on_discard',
  END_OF_ROUND = 'end_of_round',
  ON_PLAY = 'on_play',
  ON_INDEPENDENT = 'on_independent',
  ON_HAND_PLAYED = 'on_hand_played',
  ON_REROLL = 'on_reroll',
  ON_BLIND_SELECT = 'on_blind_select',
  ON_CARD_ADDED = 'on_card_added',
  ON_SHOP_EXIT = 'on_shop_exit' // 离开商店时触发（用于佩尔科）
}

export interface JokerEffectContext {
  readonly card?: Card; // 用于 ON_CARD_ADDED 触发器
  readonly scoredCards?: readonly Card[];
  readonly heldCards?: readonly Card[];
  readonly discardedCards?: readonly Card[];
  readonly handType?: PokerHandType;
  readonly currentChips?: number;
  readonly currentMult?: number;
  readonly money?: number;
  readonly handsPlayed?: number;
  readonly discardsUsed?: number;
  readonly deckSize?: number;
  readonly initialDeckSize?: number;
  readonly gameState?: {
    readonly money: number;
    readonly interestCap: number;
    readonly hands: number;
    readonly discards: number;
    readonly handsPlayed?: number; // 已玩手牌数
  };
  readonly jokerPosition?: number;
  readonly allJokers?: readonly JokerInterface[];
  readonly leftJokers?: readonly JokerInterface[];
  readonly rightJokers?: readonly JokerInterface[];
  readonly leftmostJoker?: JokerInterface;
  readonly rightmostJoker?: JokerInterface;
  // 阶段6新增字段
  readonly enhancedCardsCount?: number; // 驾驶证: 强化牌数量
  readonly uniquePlanetCards?: number;  // satellite: 独特行星牌数量
  // 扩展字段
  readonly blindType?: string; // 盲注类型
  readonly jokerSlots?: unknown; // 小丑槽位
  readonly handsRemaining?: number; // 剩余手牌
  readonly interestCap?: number; // 利息上限
  readonly defeatedBoss?: boolean; // 是否击败Boss（用于rocket）
  readonly mostPlayedHand?: PokerHandType | null; // 最常出的牌型（用于obelisk）
  readonly handTypeHistoryCount?: number; // 当前牌型的历史出牌次数（用于Supernova）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly jokerState?: any; // 小丑牌状态（用于flash_card等）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly consumables?: any[]; // 消耗牌列表（用于佩尔科）
  // Smeared_Joker相关
  readonly smearedJoker?: boolean; // 是否激活Smeared_Joker效果
  // Pareidolia相关
  readonly allCardsAreFace?: boolean; // 是否激活幻想性错觉效果（所有牌视为人头牌）
  // Cloud 9相关
  readonly ninesInDeck?: number; // 牌库中9的数量（用于九霄云外）
}

export interface JokerEffectResult {
  readonly chipBonus?: number;
  readonly multBonus?: number;
  readonly multMultiplier?: number;
  readonly moneyBonus?: number;
  readonly extraHands?: number;
  readonly extraDiscards?: number;
  readonly handSizeBonus?: number; // 手牌上限加成（可正可负）
  readonly discardsBonus?: number; // 弃牌奖励
  readonly debtLimit?: number; // 债务限制
  readonly freeReroll?: boolean;
  readonly allowDebt?: boolean;
  readonly debtAmount?: number;
  readonly message?: string;
  readonly allCardsScore?: boolean; // 水花飞溅效果：所有打出的牌都计分
  readonly fourFingers?: boolean; // 四指效果：同花/顺子只需4张
  readonly stateUpdate?: Partial<JokerState>; // 状态更新
  // 扩展属性
  readonly tarotBonus?: number; // 塔罗牌奖励
  readonly jokerBonus?: number; // 小丑牌奖励
  readonly handBonus?: number; // 手牌奖励
  readonly discardReset?: boolean; // 重置弃牌
  readonly destroySelf?: boolean; // 自我摧毁
  readonly destroyRightJoker?: boolean; // 摧毁右侧小丑
  readonly destroyRandomJoker?: boolean; // 摧毁随机小丑
  readonly destroyScoredCards?: boolean; // 摧毁计分牌
  readonly destroyDiscardedCard?: boolean; // 摧毁弃牌
  readonly retriggerCards?: boolean; // 重新触发卡牌
  readonly retriggerFirstCard?: boolean; // 重新触发第一张牌
  readonly heldCardRetrigger?: boolean; // 手牌重新触发
  readonly increaseSellValue?: number; // 增加出售价值
  readonly addStoneCard?: boolean; // 添加石头牌
  readonly allCardsAreFace?: boolean; // 所有牌变人头牌
  readonly disableBossOnSell?: boolean; // 出售时禁用Boss
  readonly preventDeathAt25?: boolean; // 防止25%死亡
  readonly copiedJokerId?: string; // 复制的其他小丑牌ID（隐形小丑）
  readonly addSealedCard?: boolean; // 添加封印牌
  readonly allowDuplicates?: boolean; // 允许重复
  readonly doubleProbabilities?: boolean; // 双倍概率
  readonly upgradeHandType?: boolean; // 升级牌型
  readonly removeEnhancements?: boolean; // 移除强化
  readonly turnToGold?: number; // 变成金牌数量
  readonly spectralBonus?: number; // 幻灵牌奖励
  readonly planetBonus?: number; // 行星牌奖励
  readonly copiedConsumableId?: string; // 复制的消耗牌ID（用于佩尔科）
  readonly copyScoredCardToDeck?: boolean; // 复制计分牌到卡组（DNA效果，小丑牌返回此字段）
  readonly modifyScoredCards?: { card: Card; permanentBonusDelta: number }[]; // 修改计分牌的永久加成（远足者效果）
}

// 小丑牌状态存储接口
export interface JokerState {
  // constellation: 行星牌使用计数
  planetCardsUsed?: number;
  // fortune_teller: 塔罗牌使用计数
  tarotCardsUsed?: number;
  // throwback: 跳过盲注计数
  blindsSkipped?: number;
  // runner: 顺子出牌次数（永久加成）
  straightCount?: number;
  // 通用计数器（用于其他需要状态的小丑牌）
  counter?: number;
  // 通用标志位
  flags?: Record<string, boolean>;
  // 扩展状态属性
  hikerBonus?: number; // 徒步者加成
  stoneBonus?: number; // 石头牌加成
  noFaceStreak?: number; // 无 face 牌连击
  multBonus?: number; // 倍率加成
  remainingBonus?: number; // 剩余加成
  multiplier?: number; // 乘数
  handsRemaining?: number; // 剩余手牌数
  remainingMult?: number; // 剩余倍率
  debtLimit?: number; // 债务上限
  handSizeBonus?: number; // 手牌上限加成
  triggeredCount?: number; // 触发计数
  streak?: number; // 连击数
  roundsHeld?: number; // 持有回合数
  lastHandType?: string; // 上次牌型
  multiplierBonus?: number; // 乘数加成
  cardsSold?: number; // 卖出的牌数量（篝火）
  cardsAdded?: number; // 添加的牌数量（全息影像）
  destroyedFaceCards?: number; // 摧毁的人头牌数量（卡尼奥）
  totalDiscarded?: number; // 弃牌总数（约里克）
  multMultiplier?: number; // 倍率乘数（部分小丑牌）
  chipBonus?: number; // 筹码加成（城堡）
  targetRank?: string; // 目标点数（邮寄返利、偶像）
  targetSuit?: Suit; // 目标花色（城堡、偶像）
  targetHandType?: string; // 目标牌型（待办清单）
}

export interface JokerInterface {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: JokerRarity;
  readonly cost: number;
  readonly trigger: JokerTrigger;
  readonly effect: (context: JokerEffectContext) => JokerEffectResult;
  readonly state: JokerState; // 小丑牌状态存储
  readonly sticker: StickerType; // 贴纸类型
  readonly edition: JokerEdition; // 版本类型
  readonly perishableRounds: number; // 易腐剩余回合数
  readonly isCopyable: boolean; // 是否可被蓝图/头脑风暴复制
  readonly isProbability: boolean; // 是否为概率触发类小丑牌（预览时不计算效果）
  sellValueBonus: number; // 礼品卡等增加的售价加成
  disabled: boolean; // 是否被禁用（深红之心Boss效果）
  faceDown: boolean; // 是否翻面（琥珀橡果Boss效果）
  onScored?(context: JokerEffectContext): JokerEffectResult;
  onHeld?(context: JokerEffectContext): JokerEffectResult;
  onDiscard?(context: JokerEffectContext): JokerEffectResult;
  onEndRound?(context: JokerEffectContext): JokerEffectResult;
  onPlay?(context: JokerEffectContext): JokerEffectResult;
  onHandPlayed?(context: JokerEffectContext): JokerEffectResult;
  onReroll?(context: JokerEffectContext): JokerEffectResult;
  onBlindSelect?(context: JokerEffectContext): JokerEffectResult;
  onCardAdded?(context: JokerEffectContext): JokerEffectResult;
  onSell?(context: JokerEffectContext): JokerEffectResult; // 出售时触发（隐形小丑）
  updateState(updates: Partial<JokerState>): void; // 更新状态
  getState(): JokerState; // 获取状态
  setSticker(sticker: StickerType): void; // 设置贴纸
  setEdition(edition: JokerEdition): void; // 设置版本
  increaseSellValue(amount: number): void; // 增加售价加成（礼品卡效果）
  getSellPrice(): number; // 获取总售价（基础售价 + 礼品卡加成）
  getEditionEffects(): { chipBonus: number; multBonus: number; multMultiplier: number; extraSlot: boolean }; // 获取版本效果
  decrementPerishable(): boolean; // 减少易腐回合，返回是否摧毁
  getRentalCost(): number; // 获取租赁成本
  clone(): JokerInterface;
  /**
   * 获取动态描述，根据当前状态生成描述
   * 如果小丑牌支持动态描述，则返回动态生成的描述；否则返回静态描述
   */
  getDynamicDescription(): string;
}

// 不兼容蓝图/头脑风暴的小丑牌ID列表（根据官方Wiki）
export const INCOMPATIBLE_JOKER_IDS = new Set([
  'astronomer',      // 天文学家 - 商店行星牌免费（被动）
  'chaos_the_clown', // 混沌小丑 - 免费刷新（被动）
  'chicot',          // 奇科 - Boss盲注无效（被动）
  'cloud_9',         // 九霄云外 - 回合结束给钱（回合结束触发）
  'credit_card',     // 信用卡 - 可欠债（被动）
  'delayed_gratification', // 延迟满足 - 回合结束给钱（回合结束触发）
  'drunkard',        // 酒鬼 - +弃牌（被动）
  'egg',             // 蛋 - 增加售价（回合结束触发）
  'four_fingers',    // 四指 - 改变牌型判定（被动）
  'gift_card',       // 礼品卡 - 增加售价（回合结束触发）
  'golden_joker',    // 金色小丑 - 回合结束给钱（回合结束触发）
  'invisible_joker', // 隐形小丑 - 出售时复制（出售触发）
  'juggler',         // 杂耍者 - +手牌上限（被动）
  'merry_andy',      // 快乐的安迪 - +弃牌-手牌（被动）
  'midas_mask',      // 迈达斯面具 - 脸牌变金牌（被动）
  'mr_bones',        // 骨头先生 - 防止死亡（被动）
  'oops_all_6s',     // 哎呀全是6 - 概率翻倍（被动）
  'pareidolia',      // 幻想性错觉 - 所有牌视为脸牌（被动）
  'rocket',          // 火箭 - 回合结束给钱（回合结束触发）
  'satellite',       // 卫星 - 回合结束给钱（回合结束触发）
  'shortcut',        // 捷径 - 改变顺子判定（被动）
  'showman',         // 马戏团演员 - 允许重复（被动）
  'sixth_sense',     // 第六感 - 第一手单6摧毁（特殊触发）
  'smeared_joker',   // 污损小丑 - 花色简化（被动）
  'splash',          // 水花 - 所有牌计分（被动）
  'to_the_moon',     // 登月 - 增加利息（被动/回合结束）
  'trading_card',    // 交易卡 - 第一手弃牌给钱（特殊触发）
  'troubadour',      // 吟游诗人 - +手牌-出牌（被动）
  'turtle_bean',     // 龟豆 - +手牌上限递减（被动）
]);

export interface JokerConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly rarity: JokerRarity;
  readonly cost: number;
  readonly trigger: JokerTrigger;
  readonly effect: (context: JokerEffectContext) => JokerEffectResult;
  readonly initialState?: JokerState; // 初始状态
  readonly sticker?: StickerType; // 贴纸类型
  readonly edition?: JokerEdition; // 版本类型
  // 可选的回调函数
  readonly onScored?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onHeld?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onDiscard?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onPlay?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onHandPlayed?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onReroll?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onBlindSelect?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onEndOfRound?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onCardAdded?: (context: JokerEffectContext) => JokerEffectResult;
  readonly onSell?: (context: JokerEffectContext) => JokerEffectResult; // 出售时触发（隐形小丑）
  /**
   * 是否可被蓝图/头脑风暴复制
   * 默认为true
   */
  readonly isCopyable?: boolean;
  /**
   * 是否为概率触发类小丑牌
   * 预览时不计算其效果
   * 默认为false
   */
  readonly isProbability?: boolean;
  /**
   * 动态描述函数，用于根据当前状态生成描述
   * 如果提供，将优先使用此函数生成的描述
   */
  readonly getDynamicDescription?: (state: JokerState) => string;
}

export const JOKER_RARITY_COLORS: Readonly<Record<JokerRarity, string>> = {
  [JokerRarity.COMMON]: '#4a90d9',
  [JokerRarity.UNCOMMON]: '#2ecc71',
  [JokerRarity.RARE]: '#e74c3c',
  [JokerRarity.LEGENDARY]: '#f39c12'
} as const;

export const JOKER_RARITY_NAMES: Readonly<Record<JokerRarity, string>> = {
  [JokerRarity.COMMON]: '普通',
  [JokerRarity.UNCOMMON]: '罕见',
  [JokerRarity.RARE]: '稀有',
  [JokerRarity.LEGENDARY]: '传说'
} as const;
