import { Consumable } from '../../models/Consumable';

/**
 * 消耗品数据访问工具函数
 * 提供通用的查询功能，消除重复代码
 */

/**
 * 根据ID获取消耗品
 * @param consumables 消耗品数组
 * @param id 消耗品ID
 * @returns 找到的消耗品（克隆），或 undefined
 */
export function getConsumableById<T extends Consumable>(
  consumables: readonly T[],
  id: string
): T | undefined {
  const found = consumables.find(consumable => consumable.id === id);
  return found ? (found.clone() as T) : undefined;
}

/**
 * 获取多个随机消耗品
 * @param consumables 消耗品数组
 * @param count 数量
 * @returns 随机选择的消耗品数组（克隆）
 */
export function getRandomConsumables<T extends Consumable>(
  consumables: readonly T[],
  count: number
): T[] {
  const shuffled = [...consumables].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(c => c.clone() as T);
}

/**
 * 获取单张随机消耗品
 * @param consumables 消耗品数组
 * @returns 随机选择的消耗品（克隆）
 */
export function getRandomConsumable<T extends Consumable>(
  consumables: readonly T[]
): T {
  const randomIndex = Math.floor(Math.random() * consumables.length);
  return consumables[randomIndex].clone() as T;
}
