import type { ConsumableInterface } from '../types/consumable';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('ConsumableSlots');

/**
 * 消耗牌槽位状态类
 * 负责管理消耗牌的状态（槽位、消耗牌列表等）
 * 类似于 JokerSlots，但专门用于消耗牌
 */
export interface ConsumableSlotsState {
  consumables: ConsumableInterface[];
  maxSlots: number;
}

export class ConsumableSlots {
  private consumables: ConsumableInterface[];
  private maxSlots: number;

  constructor(maxSlots: number = 2) {
    this.consumables = [];
    this.maxSlots = maxSlots;
    logger.info('ConsumableSlots initialized', { maxSlots });
  }

  /**
   * 添加消耗牌
   */
  addConsumable(consumable: ConsumableInterface): boolean {
    if (this.consumables.length >= this.maxSlots) {
      logger.warn('Cannot add consumable: max slots reached', {
        current: this.consumables.length,
        max: this.maxSlots
      });
      return false;
    }
    this.consumables.push(consumable);
    logger.info('Consumable added', {
      consumableId: consumable.id,
      consumableName: consumable.name,
      slot: this.consumables.length - 1
    });
    return true;
  }

  /**
   * 移除消耗牌
   */
  removeConsumable(index: number): ConsumableInterface | null {
    if (index < 0 || index >= this.consumables.length) {
      logger.warn('Cannot remove consumable: invalid index', { index, count: this.consumables.length });
      return null;
    }
    const removed = this.consumables.splice(index, 1)[0];
    logger.info('Consumable removed', {
      consumableId: removed.id,
      consumableName: removed.name,
      index
    });
    return removed;
  }

  /**
   * 获取所有消耗牌
   */
  getConsumables(): readonly ConsumableInterface[] {
    return [...this.consumables];
  }

  /**
   * 获取消耗牌数量
   */
  getConsumableCount(): number {
    return this.consumables.length;
  }

  /**
   * 获取指定索引的消耗牌
   */
  getConsumable(index: number): ConsumableInterface | null {
    if (index < 0 || index >= this.consumables.length) {
      return null;
    }
    return this.consumables[index];
  }

  /**
   * 获取可用槽位数量
   */
  getAvailableSlots(): number {
    return this.maxSlots - this.consumables.length;
  }

  /**
   * 获取最大槽位数量
   */
  getMaxSlots(): number {
    return this.maxSlots;
  }

  /**
   * 增加消耗牌槽位数量
   */
  increaseMaxSlots(amount: number): void {
    this.maxSlots += amount;
    logger.info('Max slots increased', { newMax: this.maxSlots, increase: amount });
  }

  /**
   * 检查是否还有空槽位
   */
  hasAvailableSlot(): boolean {
    return this.consumables.length < this.maxSlots;
  }

  /**
   * 清空所有消耗牌
   */
  clear(): void {
    this.consumables = [];
    logger.info('All consumables cleared');
  }

  /**
   * 获取状态（用于存档）
   */
  getState(): ConsumableSlotsState {
    return {
      consumables: [...this.consumables],
      maxSlots: this.maxSlots
    };
  }

  /**
   * 恢复状态（用于读档）
   */
  restoreState(state: ConsumableSlotsState): void {
    this.consumables = [...state.consumables];
    this.maxSlots = state.maxSlots;
    logger.info('State restored', { count: this.consumables.length, maxSlots: this.maxSlots });
  }

  /**
   * 获取消耗牌信息字符串（用于调试）
   */
  getConsumableInfo(): string {
    const lines: string[] = [];
    lines.push(`=== 消耗牌槽位 (${this.consumables.length}/${this.maxSlots}) ===`);

    if (this.consumables.length === 0) {
      lines.push('无消耗牌');
    } else {
      for (let i = 0; i < this.consumables.length; i++) {
        const consumable = this.consumables[i];
        lines.push(`${i + 1}. ${consumable.name} - ${consumable.description}`);
      }
    }

    return lines.join('\n');
  }
}
