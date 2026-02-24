/**
 * 长按检测工具类
 * 用于处理需要区分单击和长按的交互场景
 */
export class LongPressHandler {
  private static readonly LONG_PRESS_DURATION = 500; // 500ms
  private static readonly MOVE_THRESHOLD = 10; // 移动超过10px取消长按

  /**
   * 绑定长按和单击事件到元素
   * @param element - 目标元素
   * @param onLongPress - 长按回调
   * @param onClick - 单击回调（可选）
   */
  static bind(
    element: HTMLElement,
    onLongPress: () => void,
    onClick?: () => void
  ): () => void {
    let pressTimer: number | null = null;
    let isLongPress = false;
    let startX = 0;
    let startY = 0;
    let isPressed = false;

    const startHandler = (e: MouseEvent | TouchEvent) => {
      // 只处理左键点击
      if (e instanceof MouseEvent && e.button !== 0) {
        return;
      }

      isPressed = true;
      isLongPress = false;
      const touch = 'touches' in e ? e.touches[0] : e;
      startX = touch.clientX;
      startY = touch.clientY;

      pressTimer = window.setTimeout(() => {
        isLongPress = true;
        onLongPress();
      }, this.LONG_PRESS_DURATION);
    };

    const endHandler = (e: MouseEvent | TouchEvent) => {
      if (!isPressed) return;
      isPressed = false;

      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }

      // 如果是长按，不触发单击
      if (!isLongPress && onClick) {
        onClick();
      }
    };

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (!isPressed) return;

      const touch = 'touches' in e ? e.touches[0] : e;
      const deltaX = Math.abs(touch.clientX - startX);
      const deltaY = Math.abs(touch.clientY - startY);

      // 移动超过阈值取消长按
      if (deltaX > this.MOVE_THRESHOLD || deltaY > this.MOVE_THRESHOLD) {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
        isPressed = false;
      }
    };

    const cancelHandler = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      isPressed = false;
    };

    // 绑定事件
    element.addEventListener('mousedown', startHandler);
    element.addEventListener('touchstart', startHandler, { passive: true });
    element.addEventListener('mouseup', endHandler);
    element.addEventListener('touchend', endHandler);
    element.addEventListener('mousemove', moveHandler);
    element.addEventListener('touchmove', moveHandler, { passive: true });
    element.addEventListener('mouseleave', cancelHandler);
    element.addEventListener('touchcancel', cancelHandler);

    // 返回清理函数
    return () => {
      element.removeEventListener('mousedown', startHandler);
      element.removeEventListener('touchstart', startHandler);
      element.removeEventListener('mouseup', endHandler);
      element.removeEventListener('touchend', endHandler);
      element.removeEventListener('mousemove', moveHandler);
      element.removeEventListener('touchmove', moveHandler);
      element.removeEventListener('mouseleave', cancelHandler);
      element.removeEventListener('touchcancel', cancelHandler);
      if (pressTimer) {
        clearTimeout(pressTimer);
      }
    };
  }
}
