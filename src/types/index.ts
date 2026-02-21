// Barrel exports for types

// Card types
export type {
  CardInterface
} from './card';

export {
  Suit,
  Rank,
  CardEnhancement,
  CardEdition,
  SealType,
  RANK_CHIP_VALUES,
  FACE_CARDS
} from './card';

// Game types
export type {
  GameStateInterface,
  DeckInterface,
  HandInterface,
  BlindInterface,
  BlindConfig,
  RoundStats,
  GameConfig
} from './game';

export {
  GamePhase,
  BlindType,
  DEFAULT_GAME_CONFIG
} from './game';

// Joker types
export type {
  JokerEffectContext,
  JokerEffectResult,
  JokerInterface,
  JokerConfig
} from './joker';

export {
  JokerRarity,
  JokerTrigger,
  JokerEdition,
  StickerType,
  JOKER_RARITY_COLORS,
  JOKER_RARITY_NAMES
} from './joker';

// Poker hand types
export type {
  PokerHandResult,
  HandBaseValue
} from './pokerHands';

export {
  PokerHandType,
  HAND_BASE_VALUES,
  POKER_HAND_HIERARCHY,
  getHandRank,
  compareHandTypes
} from './pokerHands';

// Consumable types
export type {
  ConsumableEffectContext,
  ConsumableEffectResult,
  ConsumableInterface,
  ConsumableConfig
} from './consumable';

export {
  ConsumableType,
  CONSUMABLE_TYPE_NAMES,
  CONSUMABLE_TYPE_COLORS
} from './consumable';
