import type { ConsumableInterface, ConsumableEffectContext, ConsumableEffectResult } from '../types/consumable';
import type { ConsumableSlots } from '../models/ConsumableSlots';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('ConsumableManager');

/**
 * 消耗牌效果管理器
 * 负责处理消耗牌的效果计算和状态管理
 * 所有方法为静态方法，ConsumableSlots 作为参数传入
 */
export class ConsumableManager {
  /**
   * 添加消耗牌到槽位
   */
  static addConsumable(consumableSlots: ConsumableSlots, consumable: ConsumableInterface): boolean {
    return consumableSlots.addConsumable(consumable);
  }

  /**
   * 移除消耗牌
   */
  static removeConsumable(consumableSlots: ConsumableSlots, index: number): ConsumableInterface | null {
    return consumableSlots.removeConsumable(index);
  }

  /**
   * 获取所有消耗牌
   */
  static getConsumables(consumableSlots: ConsumableSlots): readonly ConsumableInterface[] {
    return consumableSlots.getConsumables();
  }

  /**
   * 获取消耗牌数量
   */
  static getConsumableCount(consumableSlots: ConsumableSlots): number {
    return consumableSlots.getConsumableCount();
  }

  /**
   * 获取指定索引的消耗牌
   */
  static getConsumable(consumableSlots: ConsumableSlots, index: number): ConsumableInterface | null {
    return consumableSlots.getConsumable(index);
  }

  /**
   * 检查是否还有空槽位
   */
  static hasAvailableSlot(consumableSlots: ConsumableSlots): boolean {
    return consumableSlots.hasAvailableSlot();
  }

  /**
   * 获取可用槽位数量
   */
  static getAvailableSlots(consumableSlots: ConsumableSlots): number {
    return consumableSlots.getAvailableSlots();
  }

  /**
   * 获取最大槽位数量
   */
  static getMaxSlots(consumableSlots: ConsumableSlots): number {
    return consumableSlots.getMaxSlots();
  }

  /**
   * 增加消耗牌槽位数量
   */
  static increaseMaxSlots(consumableSlots: ConsumableSlots, amount: number): void {
    consumableSlots.increaseMaxSlots(amount);
  }

  /**
   * 清空所有消耗牌
   */
  static clear(consumableSlots: ConsumableSlots): void {
    consumableSlots.clear();
  }

  /**
   * 使用消耗牌
   */
  static useConsumable(
    consumableSlots: ConsumableSlots,
    index: number,
    context: ConsumableEffectContext
  ): ConsumableEffectResult {
    const consumable = consumableSlots.getConsumable(index);
    if (!consumable) {
      logger.warn('Cannot use consumable: not found', { index });
      return {
        success: false,
        message: '消耗牌不存在'
      };
    }

    logger.info('Using consumable', {
      consumableId: consumable.id,
      consumableName: consumable.name,
      index
    });

    const result = consumable.use(context);

    // 使用后移除消耗牌
    consumableSlots.removeConsumable(index);

    logger.info('Consumable used', {
      consumableId: consumable.id,
      success: result.success,
      message: result.message
    });

    return result;
  }

  /**
   * 获取消耗牌信息
   */
  static getConsumableInfo(consumableSlots: ConsumableSlots): string {
    return consumableSlots.getConsumableInfo();
  }
}
