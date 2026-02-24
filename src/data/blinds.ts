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
 * 支持无尽模式（ante > 8）
 */
export function getBlindsForAnte(ante: number): BlindConfig[] {
  // 无尽模式：动态生成盲注配置
  if (ante > 8) {
    return generateEndlessBlindConfig(ante);
  }
  
  const configs = getBlindConfigs();
  return configs.filter(config => config.ante === ante);
}

/**
 * 获取指定盲注配置
 * 支持无尽模式（ante > 8）
 */
export function getBlindConfig(ante: number, type: BlindType): BlindConfig | undefined {
  // 无尽模式：动态生成盲注配置
  if (ante > 8) {
    const endlessConfigs = generateEndlessBlindConfig(ante);
    return endlessConfigs.find(config => config.type === type);
  }
  
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
 * 计算无尽模式底注的目标分数
 * 参考官方文档的Endless Mode分数增长曲线
 * 官方增长曲线: x^(x^2) 级别（超指数增长）
 */
export function calculateEndlessTargetScore(ante: number): number {
  if (ante <= 8) {
    const config = BASE_BLIND_CONFIGS.find(c => c.ante === ante && c.type === BlindType.BOSS_BLIND);
    return config?.targetScore || 100000;
  }
  
  // 无尽模式分数增长（参考官方文档）
  // 使用官方文档的精确数值（Ante 9-39）
  const officialScores: Record<number, number> = {
    9: 110000,
    10: 560000,
    11: 7200000,
    12: 300000000,
    13: 47000000000,           // 4.7e10
    14: 29000000000000,        // 2.9e13
    15: 77000000000000000,     // 7.7e16
    16: 860000000000000000000, // 8.6e20 (Finisher Blind)
    17: 4.2e25,
    18: 9.2e30,
    19: 9.2e36,
    20: 4.3e43,
    21: 9.7e50,
    22: 1.0e59,
    23: 5.8e67,
    24: 1.6e77,  // Finisher Blind
    25: 2.4e87,
    26: 1.9e98,
    27: 8.4e109,
    28: 2.0e122,
    29: 2.7e135,
    30: 2.1e149,
    31: 9.9e163,
    32: 2.7e179, // Finisher Blind
    33: 4.4e195,
    34: 4.4e212,
    35: 2.8e230,
    36: 1.1e249,
    37: 2.7e268,
    38: 4.5e288,
    39: 4.8e309, // 超过 JavaScript 数字上限，会显示为 naneinf
  };
  
  if (officialScores[ante]) {
    return officialScores[ante];
  }
  
  // Ante 40+: 使用超指数增长公式近似
  // 官方曲线近似于 x^(x^2)
  // 基于 Ante 39 的 4.8e309，但注意这会超过 JS 数字上限
  const ante39Score = 4.8e309;
  const growthFactor = Math.pow(ante - 38, ante - 38); // (n-38)^(n-38) 增长
  const score = ante39Score * growthFactor;
  
  // 限制在 Number.MAX_SAFE_INTEGER 范围内（约 9e15）
  // 注意：Ante 39 已经超过 JavaScript 数字上限（1.8e308），显示为 Infinity
  return Math.min(score, Number.MAX_SAFE_INTEGER);
}

/**
 * 获取无尽模式Boss类型
 * Ante 8, 16, 24... 使用Finisher Blind
 * 其他使用普通Boss Blind
 */
export function getEndlessBossType(ante: number): BossType {
  // Finisher Blinds 出现在 Ante 8, 16, 24, 32...
  if (ante % 8 === 0) {
    // 随机选择一个Finisher Blind
    const finishers: BossType[] = [
      BossType.AMBER_ACORN, 
      BossType.VERDANT_LEAF, 
      BossType.VIOLET_VESSEL, 
      BossType.CRIMSON_HEART, 
      BossType.CERULEAN_BELL
    ];
    return finishers[Math.floor(Math.random() * finishers.length)];
  }
  
  // 普通Boss Blind（随机）
  const bosses: BossType[] = [
    BossType.HOOK, BossType.OX, BossType.HOUSE, BossType.WALL, BossType.WHEEL, BossType.ARM,
    BossType.CLUB, BossType.FISH, BossType.PSYCHIC, BossType.GOAD, BossType.WATER, BossType.WINDOW,
    BossType.MANACLE, BossType.EYE, BossType.MOUTH, BossType.PLANT, BossType.SERPENT, BossType.PILLAR,
    BossType.NEEDLE, BossType.HEAD, BossType.TOOTH, BossType.FLINT, BossType.MARK
  ];
  return bosses[Math.floor(Math.random() * bosses.length)];
}

/**
 * 生成无尽模式盲注配置
 */
export function generateEndlessBlindConfig(ante: number): BlindConfig[] {
  const targetScore = calculateEndlessTargetScore(ante);
  const bossType = getEndlessBossType(ante);
  const isFinisher = ante % 8 === 0;
  
  // 小盲注: 1x 基础分数
  const smallBlind: BlindConfig = {
    ante,
    type: BlindType.SMALL_BLIND,
    targetScore: Math.floor(targetScore * 0.5),
    reward: 3,
    canSkip: true,
    skipReward: 1,
    name: '小盲注',
    description: `目标分数: ${targetScore * 0.5}`,
    scoreMultiplier: 1
  };
  
  // 大盲注: 1.5x 基础分数
  const bigBlind: BlindConfig = {
    ante,
    type: BlindType.BIG_BLIND,
    targetScore: Math.floor(targetScore * 0.75),
    reward: 4,
    canSkip: true,
    skipReward: 1,
    name: '大盲注',
    description: `目标分数: ${targetScore * 0.75}`,
    scoreMultiplier: 1.5
  };
  
  // Boss盲注
  const bossConfig = BossSystem.getBossConfig(bossType);
  const bossBlind: BlindConfig = {
    ante,
    type: BlindType.BOSS_BLIND,
    targetScore: targetScore * (isFinisher ? 1 : bossConfig.scoreMultiplier),
    reward: isFinisher ? 8 : 5,
    canSkip: false,
    bossType,
    name: isFinisher ? `Finisher: ${bossConfig.name}` : `Boss: ${bossConfig.name}`,
    description: bossConfig.description,
    scoreMultiplier: bossConfig.scoreMultiplier
  };
  
  return [smallBlind, bigBlind, bossBlind];
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
