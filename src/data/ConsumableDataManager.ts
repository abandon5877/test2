import { Consumable } from '../models/Consumable';
import { ConsumableType, type ConsumableEffectContext, type ConsumableEffectResult } from '../types/consumable';
import { CONSUMABLES } from './consumables/index';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('ConsumableDataManager');

/**
 * 消耗品数据管理器
 * 统一管理所有消耗品数据的访问和操作
 * 所有方法为静态方法
 */
export class ConsumableDataManager {
  private static consumables: Map<string, Consumable> = new Map();
  private static initialized: boolean = false;

  /**
   * 初始化数据管理器
   */
  static initialize(): void {
    if (ConsumableDataManager.initialized) {
      return;
    }

    for (const consumable of CONSUMABLES) {
      ConsumableDataManager.consumables.set(consumable.id, consumable);
    }

    ConsumableDataManager.initialized = true;
    logger.info('ConsumableDataManager initialized', { count: ConsumableDataManager.consumables.size });
  }

  /**
   * 根据ID获取消耗品
   */
  static getById(id: string): Consumable | undefined {
    ConsumableDataManager.ensureInitialized();
    const found = ConsumableDataManager.consumables.get(id);
    return found ? (found.clone() as Consumable) : undefined;
  }

  /**
   * 根据类型获取消耗品列表
   */
  static getByType(type: ConsumableType): Consumable[] {
    ConsumableDataManager.ensureInitialized();
    const result: Consumable[] = [];
    for (const consumable of ConsumableDataManager.consumables.values()) {
      if (consumable.type === type) {
        result.push(consumable.clone() as Consumable);
      }
    }
    return result;
  }

  /**
   * 获取所有消耗品
   */
  static getAll(): Consumable[] {
    ConsumableDataManager.ensureInitialized();
    return Array.from(ConsumableDataManager.consumables.values()).map(c => c.clone() as Consumable);
  }

  /**
   * 获取随机消耗品
   */
  static getRandom(): Consumable {
    ConsumableDataManager.ensureInitialized();
    const all = Array.from(ConsumableDataManager.consumables.values());
    const randomIndex = Math.floor(Math.random() * all.length);
    return all[randomIndex].clone() as Consumable;
  }

  /**
   * 获取多个随机消耗品
   */
  static getRandomMultiple(count: number): Consumable[] {
    ConsumableDataManager.ensureInitialized();
    const all = Array.from(ConsumableDataManager.consumables.values());
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(c => c.clone() as Consumable);
  }

  /**
   * 获取随机消耗品（按类型过滤）
   */
  static getRandomByType(type: ConsumableType): Consumable {
    ConsumableDataManager.ensureInitialized();
    const byType = ConsumableDataManager.getByType(type);
    if (byType.length === 0) {
      throw new Error(`No consumables found for type: ${type}`);
    }
    const randomIndex = Math.floor(Math.random() * byType.length);
    return byType[randomIndex];
  }

  /**
   * 获取消耗品总数
   */
  static getCount(): number {
    ConsumableDataManager.ensureInitialized();
    return ConsumableDataManager.consumables.size;
  }

  /**
   * 获取指定类型的消耗品数量
   */
  static getCountByType(type: ConsumableType): number {
    ConsumableDataManager.ensureInitialized();
    let count = 0;
    for (const consumable of ConsumableDataManager.consumables.values()) {
      if (consumable.type === type) {
        count++;
      }
    }
    return count;
  }

  /**
   * 检查消耗品是否存在
   */
  static exists(id: string): boolean {
    ConsumableDataManager.ensureInitialized();
    return ConsumableDataManager.consumables.has(id);
  }

  /**
   * 使用消耗品
   */
  static use(
    id: string,
    context: ConsumableEffectContext
  ): ConsumableEffectResult {
    ConsumableDataManager.ensureInitialized();
    const consumable = ConsumableDataManager.getById(id);
    if (!consumable) {
      return {
        success: false,
        message: `消耗品不存在: ${id}`
      };
    }

    // 检查是否可以使用
    if (consumable.canUse && !consumable.canUse(context)) {
      return {
        success: false,
        message: consumable.useCondition || '不满足使用条件'
      };
    }

    logger.info('Using consumable', { id, name: consumable.name });
    const result = consumable.use(context);
    logger.info('Consumable used', { id, success: result.success });

    return result;
  }

  /**
   * 检查消耗品是否可以使用
   */
  static canUse(
    id: string,
    context: ConsumableEffectContext
  ): boolean {
    ConsumableDataManager.ensureInitialized();
    const consumable = ConsumableDataManager.getById(id);
    if (!consumable) {
      return false;
    }

    if (!consumable.canUse) {
      return true;
    }

    return consumable.canUse(context);
  }

  /**
   * 获取消耗品信息
   */
  static getInfo(id: string): {
    id: string;
    name: string;
    description: string;
    type: ConsumableType;
    cost: number;
    useCondition?: string;
  } | undefined {
    ConsumableDataManager.ensureInitialized();
    const consumable = ConsumableDataManager.consumables.get(id);
    if (!consumable) {
      return undefined;
    }

    return {
      id: consumable.id,
      name: consumable.name,
      description: consumable.description,
      type: consumable.type,
      cost: consumable.cost,
      useCondition: consumable.useCondition
    };
  }

  /**
   * 获取所有消耗品信息
   */
  static getAllInfo(): Array<{
    id: string;
    name: string;
    description: string;
    type: ConsumableType;
    cost: number;
    useCondition?: string;
  }> {
    ConsumableDataManager.ensureInitialized();
    const result: Array<{
      id: string;
      name: string;
      description: string;
      type: ConsumableType;
      cost: number;
      useCondition?: string;
    }> = [];

    for (const consumable of ConsumableDataManager.consumables.values()) {
      result.push({
        id: consumable.id,
        name: consumable.name,
        description: consumable.description,
        type: consumable.type,
        cost: consumable.cost,
        useCondition: consumable.useCondition
      });
    }

    return result;
  }

  /**
   * 获取塔罗牌列表
   */
  static getTarotCards(): Consumable[] {
    return ConsumableDataManager.getByType(ConsumableType.TAROT);
  }

  /**
   * 获取星球牌列表
   */
  static getPlanetCards(): Consumable[] {
    return ConsumableDataManager.getByType(ConsumableType.PLANET);
  }

  /**
   * 获取幻灵牌列表
   */
  static getSpectralCards(): Consumable[] {
    return ConsumableDataManager.getByType(ConsumableType.SPECTRAL);
  }

  /**
   * 确保已初始化
   */
  private static ensureInitialized(): void {
    if (!ConsumableDataManager.initialized) {
      ConsumableDataManager.initialize();
    }
  }
}

// 自动初始化
ConsumableDataManager.initialize();
