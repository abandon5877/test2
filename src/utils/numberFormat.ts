/**
 * 数字格式化工具函数
 * 用于统一处理游戏中大数字的显示格式
 */

/**
 * 格式化大数字显示
 * K = 千, M = 百万, B = 十亿, T = 万亿
 * 超过 1e15 使用科学计数法
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1_000_000) {
    return (num / 1000).toFixed(1) + 'K';
  } else if (num < 1_000_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  } else if (num < 1_000_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B';
  } else if (num < 1_000_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(1) + 'T';
  } else {
    return num.toExponential(2);
  }
}

/**
 * 格式化整数数字（不带小数点）
 * 用于显示筹码、倍率等需要精确值的场景
 */
export function formatInteger(num: number): string {
  if (num < 1000) {
    return num.toString();
  } else if (num < 1_000_000) {
    return Math.round(num / 1000) + 'K';
  } else if (num < 1_000_000_000) {
    return Math.round(num / 1_000_000) + 'M';
  } else if (num < 1_000_000_000_000) {
    return Math.round(num / 1_000_000_000) + 'B';
  } else if (num < 1_000_000_000_000_000) {
    return Math.round(num / 1_000_000_000_000) + 'T';
  } else {
    return num.toExponential(2);
  }
}
