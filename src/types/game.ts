import type { JokerInterface } from './joker';
import type { ConsumableInterface } from './consumable';
import type { CardInterface } from './card';
import type { PokerHandType } from './pokerHands';

export enum GamePhase {
  BLIND_SELECT = 'BLIND_SELECT',
  PLAYING = 'PLAYING',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER'
}

export enum BlindType {
  SMALL_BLIND = 'SMALL_BLIND',
  BIG_BLIND = 'BIG_BLIND',
  BOSS_BLIND = 'BOSS_BLIND'
}

// Boss盲注类型（基于官方Wiki）
export enum BossType {
  // 已实现的8种Boss
  HOOK = 'HOOK',                    // 钩子: 出牌后弃2张手牌
  MANACLE = 'MANACLE',              // 手铐: 手牌上限-1 (原水獭)
  HOUSE = 'HOUSE',                  // 房子: 第一手牌面朝下
  WALL = 'WALL',                    // 墙壁: 4倍基础分数
  ARM = 'ARM',                      // 手臂: 牌型等级-1
  TOOTH = 'TOOTH',                  // 牙齿: 每张出牌扣$1
  EYE = 'EYE',                      // 眼睛: 不能重复牌型
  AMBER_ACORN = 'AMBER_ACORN',      // 琥珀橡果: 翻转并洗牌小丑牌 (原琥珀色酸液)
  
  // 可扩展的其他Boss
  CLUB = 'CLUB',                    // 梅花: 所有梅花牌失效
  GOAD = 'GOAD',                    // 刺棒: 所有黑桃牌失效
  HEAD = 'HEAD',                    // 头: 所有红桃牌失效
  WINDOW = 'WINDOW',                // 窗户: 所有方片牌失效
  WHEEL = 'WHEEL',                  // 轮子: 1/7概率卡牌面朝下
  FLINT = 'FLINT',                  // 燧石: 基础筹码和倍率减半
  MARK = 'MARK',                    // 标记: 所有人头牌面朝下
  MOUTH = 'MOUTH',                  // 嘴: 只能出一种牌型
  PLANT = 'PLANT',                  // 植物: 所有人头牌失效
  SERPENT = 'SERPENT',              // 蛇: 出牌/弃牌后只抽3张牌
  PILLAR = 'PILLAR',                // 柱子: 本底注之前出过的牌失效
  NEEDLE = 'NEEDLE',                // 针: 只能出1次牌
  OX = 'OX',                        // 牛: 打出最常用牌型时金钱归零
  FISH = 'FISH',                    // 鱼: 出牌后抽到的牌面朝下
  PSYCHIC = 'PSYCHIC',              // 通灵: 必须出5张牌
  WATER = 'WATER',                  // 水: 0次弃牌
  
  // 终结者Boss (Ante 8+)
  VERDANT_LEAF = 'VERDANT_LEAF',    // 翠绿叶子: 所有卡牌失效直到卖小丑
  VIOLET_VESSEL = 'VIOLET_VESSEL',  // 紫色容器: 6倍基础分数
  CRIMSON_HEART = 'CRIMSON_HEART',  // 深红之心: 每手牌随机禁用1张小丑
  CERULEAN_BELL = 'CERULEAN_BELL'   // 天青铃铛: 强制选择1张牌
}

// 简化的Deck接口，避免循环依赖
export interface DeckInterface {
  getCards(): readonly CardInterface[];
  draw(count: number): CardInterface[];
  shuffle(): void;
}

// 简化的Hand接口，避免循环依赖
export interface HandInterface {
  getCards(): readonly CardInterface[];
  addCard(card: CardInterface): void;
  removeCard(index: number): CardInterface | null;
  getSelectedIndices(): number[];
}

// 简化的Blind接口，避免循环依赖
export interface BlindInterface {
  readonly type: BlindType;
  readonly ante: number;
  readonly targetScore: number;
  readonly reward: number;
  readonly name: string;
  readonly description: string;
  readonly canSkip: boolean;
}

export interface GameStateInterface {
  phase: GamePhase;
  currentBlind: BlindInterface | null;
  ante: number;
  money: number;
  handsRemaining: number;
  discardsRemaining: number;
  currentScore: number;
  roundScore: number;
  jokers: readonly JokerInterface[];
  consumables: readonly ConsumableInterface[];
}

export interface BlindConfig {
  readonly ante: number;
  readonly type: BlindType;
  readonly targetScore: number;
  readonly reward: number;
  readonly name: string;
  readonly description: string;
  readonly canSkip: boolean;
  readonly skipReward?: number;
  readonly bossType?: BossType;  // Boss盲注的具体类型
  readonly scoreMultiplier?: number;  // 分数倍数（如墙壁4倍）
}

export interface RoundStats {
  handsPlayed: number;
  discardsUsed: number;
  cardsPlayed: number;
  cardsDiscarded: number;
  highestHandScore: number;
}

export interface GameConfig {
  readonly maxHandSize: number;
  readonly maxHandsPerRound: number;
  readonly maxDiscardsPerRound: number;
  readonly startingMoney: number;
  readonly startingAnte: number;
}

export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = {
  maxHandSize: 8,
  maxHandsPerRound: 4,
  maxDiscardsPerRound: 3,
  startingMoney: 4,
  startingAnte: 1
} as const;
