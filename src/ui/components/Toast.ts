export interface ToastConfig {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

/**
 * Toast通知组件
 * 用于显示短暂的通知消息，替代alert
 */
export class Toast {
  private static container: HTMLElement | null = null;

  /**
   * 获取或创建Toast容器
   */
  private static getContainer(): HTMLElement {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.id = 'toast-container';
      Toast.container.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      `;
      document.body.appendChild(Toast.container);
    }
    return Toast.container;
  }

  /**
   * 显示Toast通知
   */
  static show(config: ToastConfig): void {
    const container = Toast.getContainer();
    const { message, type = 'info', duration = 3000 } = config;

    // 创建Toast元素
    const toast = document.createElement('div');
    toast.style.cssText = `
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      animation: toast-in 0.3s ease, toast-out 0.3s ease ${duration - 300}ms forwards;
      pointer-events: auto;
      min-width: 200px;
      text-align: center;
    `;

    // 根据类型设置背景色
    const bgColors: Record<string, string> = {
      info: '#3498db',
      success: '#2ecc71',
      warning: '#f39c12',
      error: '#e74c3c'
    };
    toast.style.backgroundColor = bgColors[type] || bgColors.info;

    // 添加图标
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    toast.textContent = `${icons[type] || icons.info} ${message}`;

    // 添加动画样式
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toast-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes toast-out {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(toast);

    // 自动移除
    setTimeout(() => {
      toast.remove();
    }, duration);
  }

  /**
   * 便捷方法：显示成功消息
   */
  static success(message: string, duration?: number): void {
    Toast.show({ message, type: 'success', duration });
  }

  /**
   * 便捷方法：显示错误消息
   */
  static error(message: string, duration?: number): void {
    Toast.show({ message, type: 'error', duration });
  }

  /**
   * 便捷方法：显示警告消息
   */
  static warning(message: string, duration?: number): void {
    Toast.show({ message, type: 'warning', duration });
  }

  /**
   * 便捷方法：显示信息消息
   */
  static info(message: string, duration?: number): void {
    Toast.show({ message, type: 'info', duration });
  }
}

/**
 * 便捷函数：显示Toast
 */
export function showToast(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info', duration?: number): void {
  Toast.show({ message, type, duration });
}
