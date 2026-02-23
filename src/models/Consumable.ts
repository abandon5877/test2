import { ConsumableInterface, ConsumableConfig, ConsumableType, ConsumableEffectContext, ConsumableEffectResult } from '../types/consumable';

export class Consumable implements ConsumableInterface {
  id: string;
  name: string;
  description: string;
  type: ConsumableType;
  cost: number;
  useCondition?: string; // 使用条件描述
  private useFunction: (context: ConsumableEffectContext) => ConsumableEffectResult;
  private canUseFunction?: (context: ConsumableEffectContext) => boolean;
  sellValueBonus: number; // 礼品卡等增加的售价加成
  isNegative?: boolean; // 负片效果：消耗牌槽位+1

  constructor(config: ConsumableConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.type = config.type;
    this.cost = config.cost;
    this.useCondition = config.useCondition;
    this.useFunction = config.use;
    this.canUseFunction = config.canUse;
    this.sellValueBonus = 0; // 初始售价为0
    this.isNegative = config.isNegative;
  }

  /**
   * 增加售价加成（礼品卡效果）
   */
  increaseSellValue(amount: number): void {
    this.sellValueBonus += amount;
  }

  /**
   * 获取总售价（基础售价 + 礼品卡加成）
   */
  getSellPrice(): number {
    // 基础售价 = cost / 2（向下取整），最低$1
    const basePrice = Math.max(1, Math.floor(this.cost / 2));
    
    // 加上礼品卡等增加的售价加成
    return basePrice + this.sellValueBonus;
  }

  use(context: ConsumableEffectContext): ConsumableEffectResult {
    // 先执行具体的useFunction，让它自己处理验证和返回具体错误消息
    return this.useFunction(context);
  }

  canUse(context: ConsumableEffectContext): boolean {
    if (this.canUseFunction) {
      return this.canUseFunction(context);
    }
    return true;
  }

  clone(): ConsumableInterface {
    return new Consumable({
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      cost: this.cost,
      useCondition: this.useCondition,
      use: this.useFunction,
      canUse: this.canUseFunction
    });
  }

  getDisplayInfo(): string {
    return `${this.name} (${CONSUMABLE_TYPE_NAMES[this.type]}) - ${this.cost}$\n${this.description}`;
  }

  toString(): string {
    return this.name;
  }
}

import { CONSUMABLE_TYPE_NAMES } from '../types/consumable';
