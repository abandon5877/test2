import type { ConsumableInterface, ConsumableEffectContext, ConsumableEffectResult } from '../types/consumable';
import type { ConsumableSlots } from '../models/ConsumableSlots';
import type { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from './JokerSystem';
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

  /**
   * 出售消耗牌
   * @param consumableSlots 消耗牌槽位
   * @param jokerSlots 小丑牌槽位（用于更新篝火等联动效果）
   * @param index 消耗牌索引
   * @returns 出售结果
   */
  static sellConsumable(
    consumableSlots: ConsumableSlots,
    jokerSlots: JokerSlots,
    index: number
  ): { success: boolean; sellPrice?: number; error?: string } {
    const consumable = consumableSlots.getConsumable(index);
    if (!consumable) {
      logger.warn('Cannot sell consumable: invalid index', { index });
      return { success: false, error: 'Invalid consumable index' };
    }

    // 使用消耗牌的getSellPrice方法计算售价（包含礼品卡加成）
    const sellPrice = consumable.getSellPrice();

    // 移除消耗牌
    consumableSlots.removeConsumable(index);

    logger.info('Consumable sold', {
      consumableId: consumable.id,
      consumableName: consumable.name,
      sellPrice
    });

    // 更新Campfire状态：每卖出一张牌，Campfire的cardsSold+1
    JokerSystem.updateCampfireOnCardSold(jokerSlots);

    return { success: true, sellPrice };
  }
}
