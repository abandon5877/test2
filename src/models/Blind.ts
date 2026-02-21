import { BlindConfig, BlindType, BossType } from '../types/game';
import { getBlindConfig } from '../data/blinds';

export class Blind {
  readonly type: BlindType;
  readonly ante: number;
  readonly targetScore: number;
  readonly reward: number;
  readonly name: string;
  readonly description: string;
  readonly canSkip: boolean;
  readonly skipReward?: number;
  readonly bossType?: BossType;

  constructor(config: BlindConfig) {
    this.type = config.type;
    this.ante = config.ante;
    this.targetScore = config.targetScore;
    this.reward = config.reward;
    this.name = config.name;
    this.description = config.description;
    this.canSkip = config.canSkip;
    this.skipReward = config.skipReward;
    this.bossType = config.bossType;
  }

  static create(ante: number, type: BlindType): Blind | null {
    const config = getBlindConfig(ante, type);
    if (!config) {
      return null;
    }
    return new Blind(config);
  }

  isBoss(): boolean {
    return this.type === BlindType.BOSS_BLIND;
  }

  canSkipBlind(): boolean {
    return this.canSkip;
  }

  getSkipReward(): number {
    return this.skipReward ?? 0;
  }

  getDisplayName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getTargetScore(): number {
    return this.targetScore;
  }

  getReward(): number {
    return this.reward;
  }

  toString(): string {
    return `${this.name} (Ante ${this.ante}) - 目标: ${this.targetScore}, 奖励: $${this.reward}`;
  }
}
