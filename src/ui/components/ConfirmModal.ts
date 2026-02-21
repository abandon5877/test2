export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class ConfirmModal {
  private modal: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  /**
   * 显示确认弹窗
   */
  show(options: ConfirmModalOptions): void {
    this.createModal(options);
    document.body.appendChild(this.overlay!);
    document.body.appendChild(this.container!);

    // 添加动画效果
    requestAnimationFrame(() => {
      this.overlay!.style.opacity = '1';
      this.modal!.style.opacity = '1';
      this.modal!.style.transform = 'scale(1)';
    });
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay && this.modal && this.container) {
      this.overlay.style.opacity = '0';
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.overlay?.remove();
        this.container?.remove();
        this.overlay = null;
        this.modal = null;
        this.container = null;
      }, 200);
    }
  }

  /**
   * 创建弹窗
   */
  private createModal(options: ConfirmModalOptions): void {
    const { title, message, confirmText = '确定', cancelText = '取消', onConfirm, onCancel } = options;

    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 transition-opacity duration-200';
    this.overlay.style.zIndex = '9999';
    this.overlay.style.opacity = '0';
    this.overlay.addEventListener('click', () => {
      this.close();
      onCancel?.();
    });

    // 创建弹窗容器
    this.container = document.createElement('div');
    this.container.className = 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none';
    this.container.style.zIndex = '10000';

    // 创建弹窗
    this.modal = document.createElement('div');
    this.modal.className = 'game-panel overflow-hidden flex flex-col transition-all duration-200 pointer-events-auto';
    this.modal.style.opacity = '0';
    this.modal.style.transform = 'scale(0.95)';
    this.modal.style.width = '100%';
    this.modal.style.maxWidth = '400px';

    const content = document.createElement('div');
    content.className = 'flex flex-col';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-yellow-500/30';
    header.innerHTML = `
      <h2 class="text-xl font-bold text-yellow-400">${title}</h2>
      <button class="text-gray-400 hover:text-white text-2xl transition-colors" id="close-confirm-modal">&times;</button>
    `;

    // 内容区域
    const body = document.createElement('div');
    body.className = 'p-6';
    body.innerHTML = `<p class="text-white text-center">${message.replace(/\n/g, '<br>')}</p>`;

    // 按钮区域
    const footer = document.createElement('div');
    footer.className = 'flex justify-center gap-4 p-4 border-t border-yellow-500/30';

    // 取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'game-btn game-btn-secondary';
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener('click', () => {
      this.close();
      onCancel?.();
    });

    // 确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'game-btn game-btn-primary';
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener('click', () => {
      this.close();
      onConfirm?.();
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    this.modal.appendChild(content);
    this.container.appendChild(this.modal);

    // 绑定关闭按钮事件
    setTimeout(() => {
      const closeBtn = document.getElementById('close-confirm-modal');
      closeBtn?.addEventListener('click', () => {
        this.close();
        onCancel?.();
      });
    }, 0);

    // ESC键关闭
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        onCancel?.();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }
}

// 全局实例
let globalConfirmModal: ConfirmModal | null = null;

export function getConfirmModal(): ConfirmModal {
  if (!globalConfirmModal) {
    globalConfirmModal = new ConfirmModal();
  }
  return globalConfirmModal;
}

/**
 * 便捷函数：显示确认弹窗
 */
export function showConfirm(options: ConfirmModalOptions): void {
  getConfirmModal().show(options);
}
