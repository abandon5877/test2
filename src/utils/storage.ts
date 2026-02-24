import { GameState } from '../models/GameState';
import { Card } from '../models/Card';
import { Joker } from '../models/Joker';
import { Consumable } from '../models/Consumable';
import { Blind } from '../models/Blind';
import { Deck } from '../models/Deck';
import { Hand } from '../models/Hand';
import { DiscardPile } from '../models/DiscardPile';
import { CardPile } from '../models/CardPile';
import { Shop, ShopItem } from '../models/Shop';
import type { BossStateInterface } from '../models/BossState';
import { BOOSTER_PACKS, VOUCHERS, type BoosterPack } from '../data/consumables/index';
import { ScoringSystem } from '../systems/ScoringSystem';
import { GamePhase, BossType } from '../types/game';
import { ConsumableType } from '../types/consumable';
import type { BlindType } from '../types/game';
import type { Suit, Rank, CardEnhancement, SealType, CardEdition } from '../types/card';
import { getJokerById, setGrosMichelDestroyed, isGrosMichelDestroyed } from '../data/jokers';
import { getConsumableById } from '../data/consumables/index';
import { HandLevel } from '../models/HandLevelState';
import { PokerHandType } from '../types/pokerHands';
import { CardManager } from '../systems/CardManager';
import { ConsumableManager } from '../systems/ConsumableManager';
import { createModuleLogger } from '../utils/logger';
import { setBossAssignments, getBossAssignments } from '../data/blinds';

const logger = createModuleLogger('Storage');

const SAVE_KEY = 'balatro_game_save';
const UNLOCK_KEY = 'balatro_unlocks'; // 解锁数据持久化

// 解锁数据接口
export interface UnlockData {
  version: string;
  endlessModeUnlocked: boolean; // 无尽模式是否解锁
}

export interface SaveData {
  version: string;
  timestamp: number;
  // 大麦克自毁状态（卡文迪什解锁条件）
  grosMichelDestroyed?: boolean;
  gameState: {
    phase: GamePhase;
    ante: number;
    money: number;
    handsRemaining: number;
    discardsRemaining: number;
    currentScore: number;
    roundScore: number;
    currentBlind: {
      type: BlindType;
      ante: number;
    } | null;
    currentBlindPosition: BlindType;
    // 卡牌按位置分开存储
    cards: {
      deck: SerializedCard[];      // 发牌堆
      hand: SerializedCard[];      // 手牌
      discard: SerializedCard[];   // 弃牌堆
      handSelectedIndices: number[]; // 手牌中选中的索引
    };
    jokers: SerializedJoker[];
    consumables: SerializedConsumable[];
    maxConsumableSlots: number; // 消耗牌槽位数量
    maxJokerSlots: number; // 小丑牌槽位数量
    handLevels: Record<PokerHandType, HandLevel>;
    // 修复2: 补充缺失的游戏状态字段
    skippedBlinds: string[]; // 已跳过的盲注
    playedHandTypes: string[]; // 本回合已出的牌型
    lastPlayScore: number; // 上次出牌分数
    roundStats: {
      handsPlayed: number;
      discardsUsed: number;
      cardsPlayed: number;
      cardsDiscarded: number;
      highestHandScore: number;
    };
    // 修复4: 全局计数器（用于超新星、约里克等小丑牌）
    globalCounters: {
      totalHandsPlayed: number; // 总出牌次数
      totalDiscardsUsed: number; // 总弃牌次数
    };
    // 修复5: 优惠券效果字段（抓取者、浪费、画笔等）
    voucherEffects: {
      extraHandSizeFromVouchers: number; // 手牌上限增加
      extraHandsFromVouchers: number; // 出牌次数增加
      extraDiscardsFromVouchers: number; // 弃牌次数增加
    };
    // 修复6: 上次使用的消耗牌（用于愚者塔罗牌）
    lastUsedConsumable: { id: string; type: ConsumableType } | null;
    // 修复7: 牌型历史统计（用于Supernova小丑牌）
    handTypeHistory: Record<string, number>;
    // 修复8: 当前正在开的卡包
    // 修复: 使用联合类型支持Card、Joker、Consumable
    currentPack: {
      packId: string;
      revealedCards: (SerializedCard | SerializedJoker | SerializedConsumable | { _type: 'card' | 'joker' | 'consumable'; [key: string]: any })[];
    } | null;
    // 修复: 无尽模式标志
    isEndlessMode: boolean;
    config: {
      maxHandSize: number;
      maxHandsPerRound: number;
      maxDiscardsPerRound: number;
      startingMoney: number;
      startingAnte: number;
    };
    // Boss状态存档
    bossState?: {
      currentBoss: string | null;
      playedHandTypes: string[];
      firstHandPlayed: boolean;
      handLevelsReduced: Record<string, number>;
      cardsPlayedThisAnte: string[];
      mostPlayedHand: string | null;
      handPlayCounts: Record<string, number>;
      // 新增Boss状态字段
      jokerSold?: boolean; // 翠绿叶子Boss: 是否已卖出小丑牌
      disabledJokerIndex?: number | null; // 深红之心Boss: 禁用的小丑位置
      requiredCardId?: string | null; // 天青铃铛Boss: 要求的卡牌ID
    };
  };
  // 修复1: 商店信息存档
  shop?: SerializedShop;
  // 修复Boss盲注丢失问题: Boss分配信息存档
  bossAssignments?: Array<[number, string]>;
  // 导演剪辑版优惠券: Boss重掷状态存档
  bossSelectionState?: {
    appearedBosses: string[];
    currentAnte: number;
    bossRerollCount: number;
    hasUnlimitedRerolls: boolean;
  };
}

interface SerializedCard {
  suit: Suit;
  rank: Rank;
  enhancement: CardEnhancement;
  seal: SealType;
  edition: CardEdition;      // 修复存档: 保存卡牌版本
  faceDown: boolean;         // 修复存档: 保存卡牌翻面状态
  permanentBonus?: number;   // 永久筹码加成（远足者效果）
}

interface SerializedJoker {
  id: string;
  // 修复3: 补充小丑牌完整信息
  sticker: string; // 贴纸类型
  edition: string; // 版本
  perishableRounds: number; // 易腐剩余回合
  state: Record<string, any>; // 状态数据
  disabled?: boolean; // 是否被禁用（深红之心Boss效果）
  faceDown?: boolean; // 是否翻面（琥珀橡果Boss效果）
  sellValueBonus?: number; // 礼品卡等增加的售价加成
}

interface SerializedConsumable {
  id: string;
  isNegative?: boolean; // 负片效果：消耗牌槽位+1
  sellValueBonus?: number; // 礼品卡等增加的售价加成
}

// 修复1: 商店序列化接口
export interface SerializedShop {
  items: SerializedShopItem[];
  rerollCost: number;
  baseRerollCost: number;
  rerollCount: number;
  vouchersUsed: string[];
  isFirstShopVisit: boolean;
  itemIdCounter: number;
}

export interface SerializedShopItem {
  id: string;
  type: 'joker' | 'consumable' | 'pack' | 'voucher';
  itemId: string;
  basePrice: number;
  currentPrice: number;
  sold: boolean;
  // 修复: 保存小丑牌的附加属性
  edition?: string;
  sticker?: string;
}

export class Storage {
  private static readonly CURRENT_VERSION = '1.0.0';

  static save(gameState: GameState): boolean {
    try {
      console.log('[Storage.save] 开始保存游戏存档');
      const jokers = (gameState.jokers as unknown as Joker[]);
      console.log(`[Storage.save] 小丑牌数量: ${jokers.length}`);
      jokers.forEach((joker, i) => {
        console.log(`[Storage.save] 小丑牌[${i}]: id=${joker.id}, name=${joker.name}, sticker=${joker.sticker}, edition=${joker.edition}, sellValueBonus=${joker.sellValueBonus}`);
      });

      const saveData: SaveData = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        // 保存大麦克自毁状态
        grosMichelDestroyed: isGrosMichelDestroyed(),
        gameState: this.serializeGameState(gameState),
        // 修复1: 保存商店信息
        shop: gameState.shop ? this.serializeShop(gameState.shop) : undefined,
        // 修复Boss盲注丢失问题: 保存Boss分配信息
        bossAssignments: Array.from(getBossAssignments()),
        // 导演剪辑版优惠券: 保存Boss重掷状态
        bossSelectionState: gameState.bossSelectionState ? {
          appearedBosses: gameState.bossSelectionState.getAppearedBosses(),
          currentAnte: gameState.bossSelectionState.getCurrentAnte(),
          bossRerollCount: gameState.bossSelectionState.getBossRerollCount(),
          hasUnlimitedRerolls: gameState.bossSelectionState.hasUnlimitedReroll()
        } : undefined
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      console.log('[Storage.save] 游戏存档保存成功');
      return true;
    } catch (error) {
      console.error('保存游戏失败:', error);
      return false;
    }
  }

  /**
   * 序列化游戏状态（用于测试，不依赖 localStorage）
   */
  static serialize(gameState: GameState): SaveData {
    return {
      version: this.CURRENT_VERSION,
      timestamp: Date.now(),
      // 保存大麦克自毁状态
      grosMichelDestroyed: isGrosMichelDestroyed(),
      gameState: this.serializeGameState(gameState),
      // 修复1: 保存商店信息
      shop: gameState.shop ? this.serializeShop(gameState.shop) : undefined,
      // 修复Boss盲注丢失问题: 保存Boss分配信息
      bossAssignments: Array.from(getBossAssignments()),
      // 导演剪辑版优惠券: 保存Boss重掷状态
      bossSelectionState: gameState.bossSelectionState ? {
        appearedBosses: gameState.bossSelectionState.getAppearedBosses(),
        currentAnte: gameState.bossSelectionState.getCurrentAnte(),
        bossRerollCount: gameState.bossSelectionState.getBossRerollCount(),
        hasUnlimitedRerolls: gameState.bossSelectionState.hasUnlimitedReroll()
      } : undefined
    };
  }

  static load(): SaveData | null {
    try {
      const saveString = localStorage.getItem(SAVE_KEY);
      if (!saveString) {
        return null;
      }

      const saveData: SaveData = JSON.parse(saveString);

      if (saveData.version !== this.CURRENT_VERSION) {
        console.warn(`存档版本不匹配: ${saveData.version} vs ${this.CURRENT_VERSION}`);
      }

      return saveData;
    } catch (error) {
      console.error('加载游戏失败:', error);
      return null;
    }
  }

  static restoreGameState(saveData: SaveData): GameState {
    console.log('[Storage.restoreGameState] 开始恢复游戏存档');
    const gameState = new GameState();
    const data = saveData.gameState;

    // 恢复大麦克自毁状态（卡文迪什解锁条件）
    if (saveData.grosMichelDestroyed !== undefined) {
      setGrosMichelDestroyed(saveData.grosMichelDestroyed);
      logger.info('[Storage.restoreGameState] 大麦克自毁状态已恢复', { grosMichelDestroyed: saveData.grosMichelDestroyed });
    }

    // 修复Boss盲注问题: 先恢复Boss分配信息，这样在恢复currentBlind时才能正确获取Boss类型
    if (saveData.bossAssignments && saveData.bossAssignments.length > 0) {
      const bossAssignments = new Map<number, BossType>(
        saveData.bossAssignments.map(([ante, bossType]) => [ante, bossType as BossType])
      );
      setBossAssignments(bossAssignments);
      logger.info('[Storage.restoreGameState] Boss分配已恢复', {
        assignments: saveData.bossAssignments
      });
    }

    gameState.phase = data.phase;
    gameState.ante = data.ante;
    gameState.money = data.money;
    // 注意：handsRemaining 和 discardsRemaining 在下面重新计算
    gameState.currentScore = data.currentScore;
    gameState.roundScore = data.roundScore;
    // 修复: 恢复无尽模式标志
    gameState.isEndlessMode = data.isEndlessMode ?? false;

    // 恢复当前盲注位置
    console.log(`[Storage.restoreGameState] 恢复盲注位置: ${data.currentBlindPosition}`);
    (gameState as any).currentBlindPosition = data.currentBlindPosition;

    if (data.currentBlind) {
      console.log(`[Storage.restoreGameState] 恢复当前盲注: type=${data.currentBlind.type}, ante=${data.currentBlind.ante}`);
      gameState.currentBlind = Blind.create(data.currentBlind.ante, data.currentBlind.type);
      console.log(`[Storage.restoreGameState] 当前盲注创建完成: boss=${gameState.currentBlind?.bossType || '无'}`);
    }

    // 修复5: 先恢复优惠券效果字段（必须在恢复小丑牌和计算剩余次数之前）
    if (data.voucherEffects) {
      (gameState as any).extraHandSizeFromVouchers = data.voucherEffects.extraHandSizeFromVouchers ?? 0;
      (gameState as any).extraHandsFromVouchers = data.voucherEffects.extraHandsFromVouchers ?? 0;
      (gameState as any).extraDiscardsFromVouchers = data.voucherEffects.extraDiscardsFromVouchers ?? 0;
      logger.info('[Storage.restoreGameState] 优惠券效果已恢复', {
        extraHandSize: data.voucherEffects.extraHandSizeFromVouchers,
        extraHands: data.voucherEffects.extraHandsFromVouchers,
        extraDiscards: data.voucherEffects.extraDiscardsFromVouchers
      });
    }

    // 先恢复小丑牌，这样 getMaxHandSize() 才能正确计算
    // 修复3: 恢复小丑牌完整信息（贴纸、版本、状态等）
    console.log(`[Storage.restoreGameState] 开始恢复小丑牌, 存档中小丑牌数量: ${data.jokers.length}`);
    const restoredJokers = data.jokers
      .map((jokerData, index) => {
        console.log(`[Storage.restoreGameState] 恢复小丑牌[${index}]: id=${jokerData.id}, sticker=${jokerData.sticker}, edition=${jokerData.edition}, sellValueBonus=${jokerData.sellValueBonus}`);
        const joker = getJokerById(jokerData.id);
        if (joker) {
          // 恢复贴纸
          if (jokerData.sticker) {
            joker.setSticker(jokerData.sticker as any);
          }
          // 恢复版本
          if (jokerData.edition) {
            joker.setEdition(jokerData.edition as any);
          }
          // 恢复易腐回合数
          if (jokerData.perishableRounds !== undefined) {
            (joker as any).perishableRounds = jokerData.perishableRounds;
          }
          // 恢复状态
          if (jokerData.state) {
            joker.updateState(jokerData.state);
          }
          // 恢复禁用状态
          if (jokerData.disabled !== undefined) {
            joker.disabled = jokerData.disabled;
          }
          // 恢复翻面状态
          if (jokerData.faceDown !== undefined) {
            joker.faceDown = jokerData.faceDown;
          }
          // 恢复售价加成
          if (jokerData.sellValueBonus !== undefined) {
            joker.sellValueBonus = jokerData.sellValueBonus;
          }
          console.log(`[Storage.restoreGameState] 小丑牌[${index}]恢复完成: name=${joker.name}, 最终sellValueBonus=${joker.sellValueBonus}`);
        } else {
          console.warn(`[Storage.restoreGameState] 无法找到小丑牌: id=${jokerData.id}`);
        }
        return joker;
      })
      .filter((joker): joker is Joker => joker !== undefined);

    console.log(`[Storage.restoreGameState] 成功恢复小丑牌数量: ${restoredJokers.length}`);
    for (const joker of restoredJokers) {
      gameState.getJokerSlots().addJoker(joker);
    }

    // 恢复卡牌数据（包括选牌状态）
    // 使用 CardPile 反序列化
    if (data.cards) {
      gameState.cardPile.deserialize({
        deck: data.cards.deck,
        hand: data.cards.hand,
        discard: data.cards.discard,
        handSelectedIndices: data.cards.handSelectedIndices
      }, gameState.getMaxHandSize());
    } else {
      // 如果没有卡牌数据，重新初始化 CardPile
      gameState.cardPile = new CardPile(gameState.getMaxHandSize());
    }

    // 修复Boss效果问题: 先恢复Boss状态，这样在计算handsRemaining和discardsRemaining时才能正确应用Boss效果
    if (data.bossState) {
      const bossStateInterface: BossStateInterface = {
        currentBoss: data.bossState.currentBoss as any,
        playedHandTypes: data.bossState.playedHandTypes as any[],
        firstHandPlayed: data.bossState.firstHandPlayed,
        handLevelsReduced: data.bossState.handLevelsReduced,
        cardsPlayedThisAnte: data.bossState.cardsPlayedThisAnte,
        mostPlayedHand: data.bossState.mostPlayedHand as any,
        handPlayCounts: data.bossState.handPlayCounts,
        jokerSold: data.bossState.jokerSold ?? false,
        disabledJokerIndex: data.bossState.disabledJokerIndex ?? null,
        requiredCardId: data.bossState.requiredCardId ?? null
      };
      gameState.bossState.restoreState(bossStateInterface);
      logger.info('[Storage.restoreGameState] Boss状态已恢复（提前到计算剩余次数之前）', {
        currentBoss: data.bossState.currentBoss
      });
    }

    // 重新计算出牌次数（考虑小丑牌效果）
    const maxHands = gameState.getMaxHandsPerRound();
    // 如果存档中的出牌次数大于最大值，则使用最大值
    gameState.handsRemaining = Math.min(data.handsRemaining, maxHands);

    // 重新计算弃牌次数（考虑小丑牌效果）
    const maxDiscards = gameState.getMaxDiscardsPerRound();
    // 如果存档中的弃牌次数大于最大值，则使用最大值
    gameState.discardsRemaining = Math.min(data.discardsRemaining, maxDiscards);
    console.log(`[Storage.restoreGameState] 恢复弃牌次数: 存档=${data.discardsRemaining}, 最大值=${maxDiscards}, 最终=${gameState.discardsRemaining}`);

    // 恢复消耗牌槽位数量
    const maxConsumableSlots = data.maxConsumableSlots ?? 2;
    const consumableSlots = gameState.getConsumableSlots();
    // 增加槽位到存档中的数量
    const currentSlots = consumableSlots.getMaxSlots();
    if (maxConsumableSlots > currentSlots) {
      consumableSlots.increaseMaxSlots(maxConsumableSlots - currentSlots);
    }

    // 修复4: 恢复小丑牌槽位数量
    const maxJokerSlots = data.maxJokerSlots ?? 5;
    const jokerSlots = gameState.getJokerSlots();
    const currentJokerSlots = jokerSlots.getAvailableSlots() + jokerSlots.getJokerCount();
    if (maxJokerSlots > currentJokerSlots) {
      jokerSlots.increaseMaxSlots(maxJokerSlots - currentJokerSlots);
    }

    // 恢复消耗牌
    const restoredConsumables = data.consumables
      .map(consumableData => {
        const consumable = getConsumableById(consumableData.id);
        if (consumable) {
          // 恢复负片状态
          if (consumableData.isNegative !== undefined) {
            (consumable as any).isNegative = consumableData.isNegative;
          }
          // 恢复售价加成
          if (consumableData.sellValueBonus !== undefined) {
            consumable.sellValueBonus = consumableData.sellValueBonus;
          }
        }
        return consumable;
      })
      .filter((consumable): consumable is Consumable => consumable !== undefined);

    for (const consumable of restoredConsumables) {
      gameState.addConsumable(consumable);
    }

    // 恢复牌型等级
    if (data.handLevels) {
      gameState.handLevelState.restoreState({ handLevels: data.handLevels });
    }

    // 修复1: 恢复商店信息
    if (saveData.shop) {
      gameState.shop = this.deserializeShop(saveData.shop);
    }

    // 修复2: 恢复缺失的游戏状态字段
    // 恢复已跳过的盲注
    if (data.skippedBlinds) {
      (gameState as any).skippedBlinds = new Set(data.skippedBlinds);
    }
    // 恢复已出的牌型
    if (data.playedHandTypes) {
      (gameState as any).playedHandTypes = new Set(data.playedHandTypes);
    }
    // 恢复上次出牌分数
    if (data.lastPlayScore !== undefined) {
      (gameState as any).lastPlayScore = data.lastPlayScore;
    }
    // 恢复回合统计
    if (data.roundStats) {
      (gameState as any).roundStats = { ...data.roundStats };
    }
    // 恢复游戏配置
    if (data.config) {
      (gameState as any).config = { ...data.config };
    }

    // 修复4: 恢复全局计数器
    if (data.globalCounters) {
      (gameState as any).globalCounters = { ...data.globalCounters };
    }

    // 修复5: Boss状态已在上面提前恢复，这里不再需要

    // 修复6: 恢复上次使用的消耗牌
    if (data.lastUsedConsumable) {
      (gameState as any).lastUsedConsumable = data.lastUsedConsumable;
    }

    // 修复7: 恢复牌型历史统计
    if (data.handTypeHistory) {
      (gameState as any).handTypeHistory = new Map(Object.entries(data.handTypeHistory));
    }

    // 修复8: 恢复当前正在开的卡包
    // 修复: 正确处理Card、Joker、Consumable三种类型
    if (data.currentPack && data.currentPack.packId) {
      // 需要重新获取卡包数据
      const pack = BOOSTER_PACKS.find(p => p.id === data.currentPack?.packId);
      if (pack) {
        (gameState as any).currentPack = {
          pack: pack,
          revealedCards: data.currentPack.revealedCards.map((itemData: any) => {
            const type = itemData._type;
            if (type === 'card') {
              // 恢复卡牌
              return new Card(
                itemData.suit,
                itemData.rank,
                itemData.enhancement,
                itemData.seal,
                itemData.edition || 'none',
                itemData.faceDown ?? false,
                itemData.permanentBonus ?? 0
              );
            } else if (type === 'joker') {
              // 恢复小丑牌
              const joker = getJokerById(itemData.id);
              if (!joker) return null;
              const clonedJoker = joker.clone();
              // 恢复附加属性
              if (itemData.edition) {
                clonedJoker.setEdition(itemData.edition);
              }
              if (itemData.sticker) {
                clonedJoker.setSticker(itemData.sticker);
              }
              if (itemData.perishableRounds !== undefined) {
                (clonedJoker as any).perishableRounds = itemData.perishableRounds;
              }
              if (itemData.state) {
                clonedJoker.updateState(itemData.state);
              }
              if (itemData.disabled !== undefined) {
                clonedJoker.disabled = itemData.disabled;
              }
              if (itemData.faceDown !== undefined) {
                clonedJoker.faceDown = itemData.faceDown;
              }
              if (itemData.sellValueBonus !== undefined) {
                clonedJoker.sellValueBonus = itemData.sellValueBonus;
              }
              return clonedJoker;
            } else if (type === 'consumable') {
              // 恢复消耗牌
              const consumable = getConsumableById(itemData.id);
              if (!consumable) return null;
              const clonedConsumable = consumable.clone();
              if (itemData.isNegative !== undefined) {
                (clonedConsumable as any).isNegative = itemData.isNegative;
              }
              if (itemData.sellValueBonus !== undefined) {
                clonedConsumable.sellValueBonus = itemData.sellValueBonus;
              }
              return clonedConsumable;
            }
            return null;
          }).filter((item: any) => item !== null)
        };
      }
    }

    // 修复: 如果回合已完成但phase仍为PLAYING，修正为SHOP
    // 这防止从商店存档恢复时闪一下游戏板界面
    if (gameState.phase === GamePhase.PLAYING && gameState.isRoundComplete() && gameState.isRoundWon()) {
      logger.info('[Storage.restoreGameState] 回合已完成，修正phase从PLAYING到SHOP');
      gameState.phase = GamePhase.SHOP;
      // 确保商店存在
      if (!gameState.shop) {
        logger.info('[Storage.restoreGameState] 创建新商店');
        gameState.shop = new Shop();
      }
    }

    return gameState;
  }

  /**
   * 恢复游戏状态（包含Boss分配）
   * 注意：Boss分配现在已在restoreGameState中恢复，这里不再重复
   */
  static restore(saveData: SaveData): GameState {
    const gameState = this.restoreGameState(saveData);

    // Boss分配已在restoreGameState中恢复，这里只需要记录日志

    // 导演剪辑版优惠券: 恢复Boss重掷状态
    if (saveData.bossSelectionState) {
      gameState.bossSelectionState.restoreState({
        appearedBosses: saveData.bossSelectionState.appearedBosses as BossType[],
        currentAnte: saveData.bossSelectionState.currentAnte,
        bossRerollCount: saveData.bossSelectionState.bossRerollCount,
        hasUnlimitedRerolls: saveData.bossSelectionState.hasUnlimitedRerolls
      });
      logger.info('[Storage.restore] Boss选择状态已恢复', {
        appearedCount: saveData.bossSelectionState.appearedBosses.length,
        currentAnte: saveData.bossSelectionState.currentAnte,
        bossRerollCount: saveData.bossSelectionState.bossRerollCount,
        hasUnlimitedRerolls: saveData.bossSelectionState.hasUnlimitedRerolls
      });
    }

    return gameState;
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (error) {
      console.error('删除存档失败:', error);
      return false;
    }
  }

  static getSaveInfo(): { exists: boolean; timestamp?: number; version?: string } {
    const saveString = localStorage.getItem(SAVE_KEY);
    if (!saveString) {
      return { exists: false };
    }

    try {
      const saveData: SaveData = JSON.parse(saveString);
      return {
        exists: true,
        timestamp: saveData.timestamp,
        version: saveData.version
      };
    } catch {
      return { exists: false };
    }
  }

  static autoSave(gameState: GameState): void {
    if (gameState.phase === GamePhase.PLAYING ||
        gameState.phase === GamePhase.SHOP ||
        gameState.phase === GamePhase.BLIND_SELECT) {
      this.save(gameState);
    }
  }

  private static serializeGameState(gameState: GameState): SaveData['gameState'] {
    // 使用 CardManager 序列化卡牌位置
    const serializedCards = CardManager.serialize(gameState.cardPile.deck, gameState.cardPile.hand, gameState.cardPile.discard);

    return {
      phase: gameState.phase,
      ante: gameState.ante,
      money: gameState.money,
      handsRemaining: gameState.handsRemaining,
      discardsRemaining: gameState.discardsRemaining,
      currentScore: gameState.currentScore,
      roundScore: gameState.roundScore,
      currentBlind: gameState.currentBlind ? {
        type: gameState.currentBlind.type,
        ante: gameState.currentBlind.ante
      } : null,
      currentBlindPosition: gameState.getCurrentBlindPosition(),
      // 使用 CardManager 的序列化数据
      cards: {
        deck: serializedCards.deck,
        hand: serializedCards.hand,
        discard: serializedCards.discard,
        handSelectedIndices: serializedCards.handSelectedIndices
      },
      jokers: (gameState.jokers as unknown as Joker[]).map(joker => this.serializeJoker(joker)),
      consumables: (gameState.consumables as unknown as Consumable[]).map(consumable =>
        this.serializeConsumable(consumable)
      ),
      maxConsumableSlots: gameState.getMaxConsumableSlots(), // 保存消耗牌槽位数量
      maxJokerSlots: gameState.getJokerSlots().getAvailableSlots() + gameState.getJokerCount(), // 保存小丑牌槽位数量
      handLevels: gameState.handLevelState.getState().handLevels,
      // 修复2: 补充缺失的游戏状态字段
      skippedBlinds: (gameState as any).skippedBlinds ? Array.from((gameState as any).skippedBlinds) : [],
      playedHandTypes: (gameState as any).playedHandTypes ? Array.from((gameState as any).playedHandTypes) : [],
      lastPlayScore: (gameState as any).lastPlayScore || 0,
      roundStats: gameState.getRoundStats(),
      // 修复4: 保存全局计数器
      globalCounters: {
        totalHandsPlayed: (gameState as any).globalCounters?.totalHandsPlayed ?? 0,
        totalDiscardsUsed: (gameState as any).globalCounters?.totalDiscardsUsed ?? 0
      },
      // 修复5: 保存优惠券效果字段
      voucherEffects: {
        extraHandSizeFromVouchers: (gameState as any).extraHandSizeFromVouchers ?? 0,
        extraHandsFromVouchers: (gameState as any).extraHandsFromVouchers ?? 0,
        extraDiscardsFromVouchers: (gameState as any).extraDiscardsFromVouchers ?? 0
      },
      // 修复6: 保存上次使用的消耗牌
      lastUsedConsumable: (gameState as any).lastUsedConsumable ?? null,
      // 修复7: 保存牌型历史统计
      handTypeHistory: Object.fromEntries((gameState as any).handTypeHistory || new Map()),
      // 修复8: 保存当前正在开的卡包
      // 修复: 正确处理Card、Joker、Consumable三种类型
      currentPack: (gameState as any).currentPack ? {
        packId: (gameState as any).currentPack.pack?.id || '',
        revealedCards: (gameState as any).currentPack.revealedCards?.map((item: Card | Joker | Consumable) => {
          if (item instanceof Card) {
            return { ...this.serializeCard(item), _type: 'card' };
          } else if (item instanceof Joker) {
            return { ...this.serializeJoker(item), _type: 'joker' };
          } else if (item instanceof Consumable) {
            return { ...this.serializeConsumable(item), _type: 'consumable' };
          }
          return null;
        }).filter((item: any) => item !== null) || []
      } : null,
      // 修复: 保存无尽模式标志
      isEndlessMode: gameState.isEndlessMode ?? false,
      config: {
        maxHandSize: (gameState as any).config?.maxHandSize ?? 8,
        maxHandsPerRound: (gameState as any).config?.maxHandsPerRound ?? 4,
        maxDiscardsPerRound: (gameState as any).config?.maxDiscardsPerRound ?? 3,
        startingMoney: (gameState as any).config?.startingMoney ?? 4,
        startingAnte: (gameState as any).config?.startingAnte ?? 1
      },
      // 保存Boss状态
      bossState: gameState.bossState ? {
        currentBoss: gameState.bossState.getCurrentBoss(),
        playedHandTypes: Array.from((gameState.bossState as any).playedHandTypes || []),
        firstHandPlayed: (gameState.bossState as any).firstHandPlayed || false,
        handLevelsReduced: Object.fromEntries((gameState.bossState as any).handLevelsReduced || new Map()),
        cardsPlayedThisAnte: Array.from((gameState.bossState as any).cardsPlayedThisAnte || []),
        mostPlayedHand: (gameState.bossState as any).mostPlayedHand || null,
        handPlayCounts: Object.fromEntries((gameState.bossState as any).handPlayCounts || new Map()),
        jokerSold: (gameState.bossState as any).jokerSold ?? false,
        disabledJokerIndex: (gameState.bossState as any).disabledJokerIndex ?? null,
        requiredCardId: (gameState.bossState as any).requiredCardId ?? null
      } : undefined
    };
  }

  private static serializeCard(card: Card): SerializedCard {
    return {
      suit: card.suit,
      rank: card.rank,
      enhancement: card.enhancement,
      seal: card.seal,
      edition: card.edition,       // 修复存档: 保存卡牌版本
      faceDown: card.faceDown,     // 修复存档: 保存卡牌翻面状态
      permanentBonus: card.permanentBonus || undefined  // 保存永久筹码加成（如果有）
    };
  }

  private static serializeJoker(joker: Joker): SerializedJoker {
    const serialized = {
      id: joker.id,
      // 修复3: 补充小丑牌完整信息
      sticker: joker.sticker,
      edition: joker.edition,
      perishableRounds: joker.perishableRounds,
      state: joker.getState(),
      disabled: joker.disabled, // 保存禁用状态
      faceDown: joker.faceDown, // 保存翻面状态
      sellValueBonus: joker.sellValueBonus // 保存售价加成
    };
    console.log(`[Storage.serializeJoker] id=${joker.id}, name=${joker.name}, sellValueBonus=${joker.sellValueBonus}`);
    return serialized;
  }

  private static serializeConsumable(consumable: Consumable): SerializedConsumable {
    return {
      id: consumable.id,
      isNegative: consumable.isNegative, // 保存负片状态
      sellValueBonus: consumable.sellValueBonus // 保存售价加成
    };
  }

  // 修复1: 序列化商店
  static serializeShop(shop: Shop): SerializedShop {
    logger.info('[Storage.serializeShop] 开始序列化商店');
    const serialized = {
      items: shop.items.map(item => {
        const baseItem = {
          id: item.id,
          type: item.type,
          itemId: this.getShopItemId(item),
          basePrice: item.basePrice,
          currentPrice: item.currentPrice,
          sold: item.sold
        };

        // 修复: 保存小丑牌的附加属性
        if (item.type === 'joker') {
          const joker = item.item as Joker;
          return {
            ...baseItem,
            edition: joker.edition,
            sticker: joker.sticker
          };
        }

        return baseItem;
      }),
      rerollCost: shop.rerollCost,
      baseRerollCost: (shop as any).baseRerollCost ?? 5,
      rerollCount: (shop as any).rerollCount || 0,
      vouchersUsed: (shop as any).vouchersUsed || [],
      isFirstShopVisit: (shop as any).isFirstShopVisit ?? true,
      itemIdCounter: (shop as any).itemIdCounter || 0
    };
    logger.info('[Storage.serializeShop] 序列化完成', {
      itemCount: serialized.items.length,
      rerollCost: serialized.rerollCost,
      baseRerollCost: serialized.baseRerollCost,
      rerollCount: serialized.rerollCount,
      isFirstShopVisit: serialized.isFirstShopVisit,
      itemIdCounter: serialized.itemIdCounter,
      items: serialized.items.map(i => ({ id: i.id, type: i.type, itemId: i.itemId, sold: i.sold, edition: (i as any).edition, sticker: (i as any).sticker }))
    });
    return serialized;
  }

  // 修复1: 获取商店商品ID
  private static getShopItemId(item: ShopItem): string {
    switch (item.type) {
      case 'joker':
        return (item.item as Joker).id;
      case 'consumable':
        return (item.item as Consumable).id;
      case 'pack':
        return (item.item as BoosterPack).id;
      case 'voucher':
        return (item.item as typeof VOUCHERS[0]).id;
      default:
        return '';
    }
  }

  // 修复1: 反序列化商店
  static deserializeShop(data: SerializedShop): Shop {
    logger.info('[Storage.deserializeShop] 开始反序列化商店', {
      itemCount: data.items.length,
      rerollCost: data.rerollCost,
      baseRerollCost: data.baseRerollCost,
      rerollCount: data.rerollCount,
      isFirstShopVisit: data.isFirstShopVisit,
      itemIdCounter: data.itemIdCounter
    });

    logger.info('[Storage.deserializeShop] 创建新Shop实例（会调用构造函数和refresh）');
    const shop = new Shop();

    // 恢复商店状态
    logger.info('[Storage.deserializeShop] 恢复商店状态');
    shop.rerollCost = data.rerollCost;
    (shop as any).baseRerollCost = data.baseRerollCost ?? 5;
    (shop as any).rerollCount = data.rerollCount;
    (shop as any).vouchersUsed = data.vouchersUsed;
    (shop as any).isFirstShopVisit = data.isFirstShopVisit;
    (shop as any).itemIdCounter = data.itemIdCounter || 0;

    logger.info('[Storage.deserializeShop] 恢复后的状态', {
      rerollCost: shop.rerollCost,
      baseRerollCost: (shop as any).baseRerollCost,
      rerollCount: (shop as any).rerollCount,
      isFirstShopVisit: (shop as any).isFirstShopVisit,
      itemIdCounter: (shop as any).itemIdCounter
    });

    // 恢复商品
    logger.info('[Storage.deserializeShop] 开始恢复商品，存档中商品数:', data.items.length);
    shop.items = data.items.map(item => {
      const resolvedItem = this.resolveShopItem(item.type, item.itemId, item);
      if (!resolvedItem) {
        logger.warn(`[Storage.deserializeShop] 无法解析商品: type=${item.type}, itemId=${item.itemId}`);
      }
      return {
        id: item.id,
        type: item.type,
        item: resolvedItem,
        basePrice: item.basePrice,
        currentPrice: item.currentPrice,
        sold: item.sold
      };
    }).filter(item => item.item !== null) as ShopItem[];

    logger.info('[Storage.deserializeShop] 商品恢复完成，实际恢复商品数:', shop.items.length);
    logger.info('[Storage.deserializeShop] 恢复后的商品列表:', shop.items.map(i => ({
      id: i.id,
      type: i.type,
      itemId: (i.item as any).id,
      sold: i.sold,
      edition: (i.item as any).edition,
      sticker: (i.item as any).sticker
    })));

    return shop;
  }

  // 修复1: 解析商店商品
  // 修复: 添加itemData参数用于恢复附加属性
  private static resolveShopItem(type: 'joker' | 'consumable' | 'pack' | 'voucher', itemId: string, itemData?: SerializedShopItem): any {
    switch (type) {
      case 'joker':
        const joker = getJokerById(itemId);
        if (!joker) return null;
        const clonedJoker = joker.clone();
        // 修复: 恢复小丑牌的附加属性
        if (itemData) {
          if (itemData.edition) {
            clonedJoker.setEdition(itemData.edition as any);
          }
          if (itemData.sticker) {
            clonedJoker.setSticker(itemData.sticker as any);
          }
        }
        return clonedJoker;
      case 'consumable':
        const consumable = getConsumableById(itemId);
        return consumable ? consumable.clone() : null;
      case 'pack':
        return BOOSTER_PACKS.find(p => p.id === itemId) || null;
      case 'voucher':
        return VOUCHERS.find(v => v.id === itemId) || null;
      default:
        return null;
    }
  }
}

export const save = (gameState: GameState): boolean => Storage.save(gameState);
export const load = (): SaveData | null => Storage.load();
export const hasSave = (): boolean => Storage.hasSave();
export const deleteSave = (): boolean => Storage.deleteSave();
export const getSaveInfo = (): { exists: boolean; timestamp?: number; version?: string } =>
  Storage.getSaveInfo();
export const autoSave = (gameState: GameState): void => Storage.autoSave(gameState);
export const restoreGameState = (saveData: SaveData): GameState =>
  Storage.restore(saveData);

/**
 * 保存解锁数据（独立于游戏存档）
 */
export function saveUnlockData(data: UnlockData): boolean {
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    logger.error('[saveUnlockData] 保存解锁数据失败:', e);
    return false;
  }
}

/**
 * 加载解锁数据
 */
export function loadUnlockData(): UnlockData {
  try {
    const data = localStorage.getItem(UNLOCK_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    logger.error('[loadUnlockData] 加载解锁数据失败:', e);
  }
  // 默认返回未解锁状态
  return {
    version: '1.0',
    endlessModeUnlocked: false
  };
}

/**
 * 解锁无尽模式
 */
export function unlockEndlessMode(): boolean {
  const data = loadUnlockData();
  data.endlessModeUnlocked = true;
  return saveUnlockData(data);
}

/**
 * 检查无尽模式是否已解锁
 */
export function isEndlessModeUnlocked(): boolean {
  return loadUnlockData().endlessModeUnlocked;
}

/**
 * 删除解锁数据（完全重置）
 */
export function deleteUnlockData(): boolean {
  try {
    localStorage.removeItem(UNLOCK_KEY);
    return true;
  } catch (e) {
    logger.error('[deleteUnlockData] 删除解锁数据失败:', e);
    return false;
  }
}
