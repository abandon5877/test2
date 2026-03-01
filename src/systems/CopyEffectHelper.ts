import { JokerInterface, INCOMPATIBLE_JOKER_IDS, JokerTrigger } from '../types/joker';

/**
 * 复制效果辅助类
 * 处理蓝图(Blueprint)和头脑风暴(Brainstorm)的复制逻辑
 */
export class CopyEffectHelper {
  /**
   * 检查小丑牌是否可被蓝图/头脑风暴复制
   * @param targetJoker 目标小丑牌
   * @returns 是否可复制
   */
  static isCopyable(targetJoker: JokerInterface): boolean {
    // 1. 检查是否在完全不兼容列表中
    if (INCOMPATIBLE_JOKER_IDS.has(targetJoker.id)) {
      return false;
    }

    // 2. 检查是否被标记为不可复制
    if (targetJoker.isCopyable === false) {
      return false;
    }

    return true;
  }

  /**
   * 检查回调函数是否可被复制
   * 某些触发器的效果不应该被复制（如回合结束效果）
   * @param trigger 触发器类型
   * @returns 是否可复制
   */
  static isTriggerCopyable(trigger: JokerTrigger): boolean {
    // 回合结束效果不应被复制
    if (trigger === JokerTrigger.END_OF_ROUND) {
      return false;
    }

    // 独立触发器效果不应被复制（这些在特定系统中处理）
    if (trigger === JokerTrigger.ON_INDEPENDENT) {
      return false;
    }

    return true;
  }

  /**
   * 获取可被复制的回调函数列表
   * @param targetJoker 目标小丑牌
   * @returns 可被复制的回调函数名称数组
   */
  static getCopyableCallbackNames(targetJoker: JokerInterface): string[] {
    if (!this.isCopyable(targetJoker)) {
      return [];
    }

    const copyableCallbacks: string[] = [];

    // 检查各个回调函数
    if (targetJoker.onScored) copyableCallbacks.push('onScored');
    if (targetJoker.onHeld) copyableCallbacks.push('onHeld');
    if (targetJoker.onDiscard) copyableCallbacks.push('onDiscard');
    if (targetJoker.onPlay) copyableCallbacks.push('onPlay');
    if (targetJoker.onHandPlayed) copyableCallbacks.push('onHandPlayed');
    if (targetJoker.onReroll) copyableCallbacks.push('onReroll');
    if (targetJoker.onBlindSelect) copyableCallbacks.push('onBlindSelect');
    if (targetJoker.onCardAdded) copyableCallbacks.push('onCardAdded');
    // 注意：onEndRound 和 onSell 不应被复制

    return copyableCallbacks;
  }

  /**
   * 检查蓝图是否可以复制右侧小丑牌
   * @param blueprintIndex 蓝图在槽位中的索引
   * @param jokers 所有小丑牌数组
   * @returns 可复制的小丑牌，如果没有则返回null
   */
  static getBlueprintTarget(
    blueprintIndex: number,
    jokers: readonly JokerInterface[]
  ): JokerInterface | null {
    // 蓝图必须在倒数第二个或更左的位置才有右侧小丑
    if (blueprintIndex >= jokers.length - 1) {
      return null;
    }

    const rightJoker = jokers[blueprintIndex + 1];

    // 不能复制另一个蓝图
    if (rightJoker.id === 'blueprint') {
      return null;
    }

    // 允许复制头脑风暴，这样蓝图+头脑风暴可以形成复制链
    // 但需要在调用处特殊处理

    // 检查是否可复制
    if (!this.isCopyable(rightJoker)) {
      return null;
    }

    return rightJoker;
  }

  /**
   * 检查头脑风暴是否可以复制最左侧小丑牌
   * @param brainstormIndex 头脑风暴在槽位中的索引
   * @param jokers 所有小丑牌数组
   * @returns 可复制的小丑牌，如果没有则返回null
   */
  static getBrainstormTarget(
    brainstormIndex: number,
    jokers: readonly JokerInterface[]
  ): JokerInterface | null {
    // 头脑风暴不能在最左侧（否则没有左侧小丑可复制）
    if (brainstormIndex === 0 || jokers.length < 2) {
      return null;
    }

    const leftmostJoker = jokers[0];

    // 修复：允许头脑风暴复制蓝图，这样头脑风暴+蓝图可以形成复制链
    // 但不能复制另一个头脑风暴（避免无限递归）
    if (leftmostJoker.id === 'brainstorm') {
      return null;
    }

    // 检查是否可复制
    if (!this.isCopyable(leftmostJoker)) {
      return null;
    }

    return leftmostJoker;
  }
}
