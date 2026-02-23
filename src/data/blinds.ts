import { BlindConfig, BlindType, BossType } from '../types/game';
import { BossSystem } from '../systems/BossSystem';

// 基础盲注配置（不包含Boss类型，Boss类型动态分配）
export const BASE_BLIND_CONFIGS: Omit<BlindConfig, 'bossType' | 'name' | 'description' | 'scoreMultiplier'>[] = [
  // Ante 1
  { ante: 1, type: BlindType.SMALL_BLIND, targetScore: 300, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 1, type: BlindType.BIG_BLIND, targetScore: 450, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 1, type: BlindType.BOSS_BLIND, targetScore: 600, reward: 5, canSkip: false },

  // Ante 2
  { ante: 2, type: BlindType.SMALL_BLIND, targetScore: 800, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 2, type: BlindType.BIG_BLIND, targetScore: 1200, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 2, type: BlindType.BOSS_BLIND, targetScore: 1600, reward: 5, canSkip: false },

  // Ante 3
  { ante: 3, type: BlindType.SMALL_BLIND, targetScore: 2000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 3, type: BlindType.BIG_BLIND, targetScore: 3000, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 3, type: BlindType.BOSS_BLIND, targetScore: 4000, reward: 5, canSkip: false },

  // Ante 4
  { ante: 4, type: BlindType.SMALL_BLIND, targetScore: 5000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 4, type: BlindType.BIG_BLIND, targetScore: 7500, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 4, type: BlindType.BOSS_BLIND, targetScore: 10000, reward: 5, canSkip: false },

  // Ante 5
  { ante: 5, type: BlindType.SMALL_BLIND, targetScore: 11000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 5, type: BlindType.BIG_BLIND, targetScore: 16500, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 5, type: BlindType.BOSS_BLIND, targetScore: 22000, reward: 5, canSkip: false },

  // Ante 6
  { ante: 6, type: BlindType.SMALL_BLIND, targetScore: 20000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 6, type: BlindType.BIG_BLIND, targetScore: 30000, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 6, type: BlindType.BOSS_BLIND, targetScore: 40000, reward: 5, canSkip: false },

  // Ante 7
  { ante: 7, type: BlindType.SMALL_BLIND, targetScore: 35000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 7, type: BlindType.BIG_BLIND, targetScore: 52500, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 7, type: BlindType.BOSS_BLIND, targetScore: 70000, reward: 5, canSkip: false },

  // Ante 8 (Finisher Blind)
  { ante: 8, type: BlindType.SMALL_BLIND, targetScore: 50000, reward: 3, canSkip: true, skipReward: 1 },
  { ante: 8, type: BlindType.BIG_BLIND, targetScore: 75000, reward: 4, canSkip: true, skipReward: 1 },
  { ante: 8, type: BlindType.BOSS_BLIND, targetScore: 100000, reward: 8, canSkip: false },
];

// 当前游戏使用的盲注配置（包含动态分配的Boss）
let currentBlindConfigs: BlindConfig[] = [];

// 保存当前的Boss分配，用于存档/读档
let currentBossAssignments: Map<number, BossType> = new Map();

/**
 * 根据Boss类型生成完整的盲注配置
 */
export function generateBlindConfig(
  baseConfig: Omit<BlindConfig, 'bossType' | 'name' | 'description' | 'scoreMultiplier'>,
  bossType?: BossType
): BlindConfig {
  if (baseConfig.type !== BlindType.BOSS_BLIND || !bossType) {
    // 非Boss盲注
    return {
      ...baseConfig,
      name: baseConfig.type === BlindType.SMALL_BLIND ? '小盲注' : '大盲注',
      description: `目标分数: ${baseConfig.targetScore}`,
      scoreMultiplier: baseConfig.type === BlindType.SMALL_BLIND ? 1 : 1.5
    };
  }

  // Boss盲注
  const bossConfig = BossSystem.getBossConfig(bossType);
  const targetScore = baseConfig.targetScore * bossConfig.scoreMultiplier;
  
  return {
    ...baseConfig,
    bossType,
    name: `Boss: ${bossConfig.name}`,
    description: bossConfig.description,
    scoreMultiplier: bossConfig.scoreMultiplier,
    targetScore,
    reward: bossConfig.reward
  };
}

/**
 * 初始化盲注配置（使用动态分配的Boss）
 * 由BossSelectionSystem调用
 */
export function initializeBlindConfigs(bossAssignments: Map<number, BossType>): void {
  // 保存Boss分配用于存档
  currentBossAssignments = new Map(bossAssignments);
  currentBlindConfigs = BASE_BLIND_CONFIGS.map(baseConfig => {
    const bossType = baseConfig.type === BlindType.BOSS_BLIND
      ? bossAssignments.get(baseConfig.ante)
      : undefined;
    return generateBlindConfig(baseConfig, bossType);
  });
}

/**
 * 获取当前Boss分配（用于存档）
 */
export function getBossAssignments(): Map<number, BossType> {
  return new Map(currentBossAssignments);
}

/**
 * 设置Boss分配（用于读档）
 */
export function setBossAssignments(bossAssignments: Map<number, BossType>): void {
  currentBossAssignments = new Map(bossAssignments);
  // 重新初始化盲注配置
  initializeBlindConfigs(currentBossAssignments);
}

/**
 * 获取当前盲注配置
 */
export function getBlindConfigs(): BlindConfig[] {
  if (currentBlindConfigs.length === 0) {
    // 如果未初始化，返回基础配置（无Boss）
    return BASE_BLIND_CONFIGS.map(config => generateBlindConfig(config));
  }
  return currentBlindConfigs;
}

/**
 * 获取指定底注的所有盲注配置
 */
export function getBlindsForAnte(ante: number): BlindConfig[] {
  const configs = getBlindConfigs();
  return configs.filter(config => config.ante === ante);
}

/**
 * 获取指定盲注配置
 */
export function getBlindConfig(ante: number, type: BlindType): BlindConfig | undefined {
  const configs = getBlindConfigs();
  return configs.find(config => config.ante === ante && config.type === type);
}

/**
 * 获取Boss盲注配置
 */
export function getBossBlindConfig(ante: number): BlindConfig | undefined {
  const configs = getBlindConfigs();
  return configs.find(config => config.ante === ante && config.type === BlindType.BOSS_BLIND);
}

/**
 * 获取最大底注
 */
export function getMaxAnte(): number {
  return Math.max(...BASE_BLIND_CONFIGS.map(config => config.ante));
}

/**
 * 重置盲注配置
 */
export function resetBlindConfigs(): void {
  currentBlindConfigs = [];
  currentBossAssignments = new Map();
}

// 为了向后兼容，导出BLIND_CONFIGS别名
export const BLIND_CONFIGS = getBlindConfigs();
