// Barrel exports for utils

export {
  logger,
  logDebug,
  logInfo,
  logWarn,
  logError,
  createModuleLogger,
  LogLevel,
  type LoggerConfig
} from './logger';

export {
  GameError,
  DeckError,
  ScoringError,
  JokerError,
  GameStateError,
  ValidationError,
  StorageError,
  isGameError,
  isDeckError,
  isScoringError,
  isJokerError,
  isGameStateError,
  isValidationError,
  isStorageError,
  formatError
} from './errors';

export { Storage } from './storage';

export {
  getEffectiveSuit,
  isSameSuit,
  getSuitColor,
  isRedSuit,
  isBlackSuit,
  isRedCard,
  isBlackCard,
  groupByEffectiveSuit,
  getAllEffectiveSuits,
  cardMatchesSuit,
  countCardsMatchingSuit,
  type EffectiveSuit
} from './suitUtils';
