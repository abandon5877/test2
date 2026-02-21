/**
 * 游戏错误基类
 * 所有游戏相关错误的基类，提供错误类型和详细信息
 */
export class GameError extends Error {
  readonly code: string;
  readonly timestamp: Date;

  constructor(message: string, code: string = 'GAME_ERROR') {
    super(message);
    this.name = 'GameError';
    this.code = code;
    this.timestamp = new Date();

    // 修复 TypeScript 中继承 Error 的问题
    Object.setPrototypeOf(this, GameError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      timestamp: this.timestamp.toISOString()
    };
  }
}

/**
 * 牌组错误
 * 处理与牌组相关的错误，如牌组为空、牌数量不足等
 */
export class DeckError extends GameError {
  readonly remainingCards: number;
  readonly requestedCards: number;

  constructor(
    message: string,
    remainingCards: number = 0,
    requestedCards: number = 0
  ) {
    super(message, 'DECK_ERROR');
    this.name = 'DeckError';
    this.remainingCards = remainingCards;
    this.requestedCards = requestedCards;

    Object.setPrototypeOf(this, DeckError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      remainingCards: this.remainingCards,
      requestedCards: this.requestedCards
    };
  }

  static insufficientCards(remaining: number, requested: number): DeckError {
    return new DeckError(
      `牌组中牌数量不足。需要: ${requested}, 剩余: ${remaining}`,
      remaining,
      requested
    );
  }

  static emptyDeck(): DeckError {
    return new DeckError('牌组已空', 0, 1);
  }
}

/**
 * 计分错误
 * 处理与计分相关的错误
 */
export class ScoringError extends GameError {
  readonly handType?: string;

  constructor(message: string, handType?: string) {
    super(message, 'SCORING_ERROR');
    this.name = 'ScoringError';
    this.handType = handType;

    Object.setPrototypeOf(this, ScoringError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      handType: this.handType
    };
  }

  static invalidCardCount(count: number): ScoringError {
    return new ScoringError(`无效的卡牌数量: ${count}。出牌必须在1-5张之间。`);
  }

  static invalidHandType(handType: string): ScoringError {
    return new ScoringError(`无效的牌型: ${handType}`, handType);
  }
}

/**
 * 小丑牌错误
 * 处理与小丑牌相关的错误
 */
export class JokerError extends GameError {
  readonly jokerId?: string;

  constructor(message: string, jokerId?: string) {
    super(message, 'JOKER_ERROR');
    this.name = 'JokerError';
    this.jokerId = jokerId;

    Object.setPrototypeOf(this, JokerError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      jokerId: this.jokerId
    };
  }

  static slotFull(maxSlots: number): JokerError {
    return new JokerError(`小丑牌槽位已满 (最大 ${maxSlots} 张)`);
  }

  static invalidPosition(position: number, maxPosition: number): JokerError {
    return new JokerError(
      `无效的小丑牌位置: ${position}。有效范围: 0-${maxPosition - 1}`
    );
  }

  static notFound(jokerId: string): JokerError {
    return new JokerError(`未找到小丑牌: ${jokerId}`, jokerId);
  }
}

/**
 * 游戏状态错误
 * 处理与游戏状态相关的错误
 */
export class GameStateError extends GameError {
  readonly currentPhase?: string;
  readonly expectedPhase?: string;

  constructor(
    message: string,
    currentPhase?: string,
    expectedPhase?: string
  ) {
    super(message, 'GAME_STATE_ERROR');
    this.name = 'GameStateError';
    this.currentPhase = currentPhase;
    this.expectedPhase = expectedPhase;

    Object.setPrototypeOf(this, GameStateError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      currentPhase: this.currentPhase,
      expectedPhase: this.expectedPhase
    };
  }

  static invalidPhase(
    current: string,
    expected: string
  ): GameStateError {
    return new GameStateError(
      `无效的游戏阶段。当前: ${current}, 期望: ${expected}`,
      current,
      expected
    );
  }

  static gameOver(): GameStateError {
    return new GameStateError('游戏已结束');
  }
}

/**
 * 验证错误
 * 处理输入验证相关的错误
 */
export class ValidationError extends GameError {
  readonly field?: string;
  readonly value?: unknown;

  constructor(message: string, field?: string, value?: unknown) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      field: this.field,
      value: this.value
    };
  }

  static required(field: string): ValidationError {
    return new ValidationError(`字段 "${field}" 是必填项`, field);
  }

  static invalidRange(
    field: string,
    value: number,
    min: number,
    max: number
  ): ValidationError {
    return new ValidationError(
      `字段 "${field}" 的值 ${value} 超出有效范围 [${min}, ${max}]`,
      field,
      value
    );
  }

  static invalidType(
    field: string,
    expected: string,
    actual: string
  ): ValidationError {
    return new ValidationError(
      `字段 "${field}" 类型错误。期望: ${expected}, 实际: ${actual}`,
      field
    );
  }
}

/**
 * 存储错误
 * 处理与数据存储相关的错误
 */
export class StorageError extends GameError {
  readonly operation: string;

  constructor(message: string, operation: string) {
    super(message, 'STORAGE_ERROR');
    this.name = 'StorageError';
    this.operation = operation;

    Object.setPrototypeOf(this, StorageError.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      operation: this.operation
    };
  }

  static saveFailed(reason: string): StorageError {
    return new StorageError(`保存失败: ${reason}`, 'save');
  }

  static loadFailed(reason: string): StorageError {
    return new StorageError(`加载失败: ${reason}`, 'load');
  }

  static deleteFailed(reason: string): StorageError {
    return new StorageError(`删除失败: ${reason}`, 'delete');
  }
}

/**
 * 类型守卫函数
 */
export function isGameError(error: unknown): error is GameError {
  return error instanceof GameError;
}

export function isDeckError(error: unknown): error is DeckError {
  return error instanceof DeckError;
}

export function isScoringError(error: unknown): error is ScoringError {
  return error instanceof ScoringError;
}

export function isJokerError(error: unknown): error is JokerError {
  return error instanceof JokerError;
}

export function isGameStateError(error: unknown): error is GameStateError {
  return error instanceof GameStateError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isStorageError(error: unknown): error is StorageError {
  return error instanceof StorageError;
}

/**
 * 错误处理工具函数
 */
export function formatError(error: unknown): string {
  if (isGameError(error)) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}] ` : '';

  if (isGameError(error)) {
    console.error(`${prefix}Game Error:`, error.toJSON());
  } else if (error instanceof Error) {
    console.error(`${prefix}Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix}Unknown Error:`, error);
  }
}
