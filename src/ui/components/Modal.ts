export interface ModalConfig {
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  showConfirm?: boolean;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export class Modal {
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;

  show(config: ModalConfig): void {
    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in';

    // 创建弹窗容器
    this.modal = document.createElement('div');
    this.modal.className = 'game-panel max-w-md w-full mx-4 transform scale-100 animate-modal-in';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const title = document.createElement('h3');
    title.className = `text-xl font-bold ${this.getTitleColor(config.type)}`;
    title.textContent = config.title;
    header.appendChild(title);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-400 hover:text-white transition-colors text-2xl';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this.modal.appendChild(header);

    // 内容区域
    const content = document.createElement('div');
    content.className = 'text-gray-300 mb-6 whitespace-pre-line leading-relaxed';
    content.textContent = config.content;
    this.modal.appendChild(content);

    // 按钮区域 - 与 JokerDetailModal 保持一致
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex gap-3';

    // 确认按钮（如果有）- 放在左侧
    if (config.showConfirm !== false) {
      const confirmBtn = document.createElement('button');
      // 根据按钮文本决定使用哪种样式（购买/卖出使用 danger，其他使用 primary）
      const isActionButton = config.confirmText === '购买' || config.confirmText === '卖出';
      confirmBtn.className = isActionButton 
        ? 'game-btn game-btn-danger flex-1' 
        : 'game-btn game-btn-primary flex-1';
      confirmBtn.textContent = config.confirmText || '确定';
      confirmBtn.addEventListener('click', () => {
        if (config.onConfirm) config.onConfirm();
        this.close();
      });
      buttonContainer.appendChild(confirmBtn);
    }

    // 取消/关闭按钮（如果有）- 放在右侧
    if (config.showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'game-btn game-btn-primary flex-1';
      cancelBtn.textContent = config.cancelText || '取消';
      cancelBtn.addEventListener('click', () => {
        if (config.onCancel) config.onCancel();
        this.close();
      });
      buttonContainer.appendChild(cancelBtn);
    }

    this.modal.appendChild(buttonContainer);
    this.overlay.appendChild(this.modal);
    document.body.appendChild(this.overlay);

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  close(): void {
    if (this.overlay) {
      this.overlay.classList.add('animate-fade-out');
      setTimeout(() => {
        this.overlay?.remove();
        this.overlay = null;
        this.modal = null;
      }, 200);
    }
  }

  private getTitleColor(type?: string): string {
    switch (type) {
      case 'success':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  }
}

// 便捷函数
export function showModal(config: ModalConfig): void {
  const modal = new Modal();
  modal.show(config);
}

export function showAlert(title: string, content: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  showModal({
    title,
    content,
    type,
    showConfirm: true,
    showCancel: false,
    confirmText: '确定'
  });
}

export function showConfirm(
  title: string,
  content: string,
  onConfirm: () => void,
  onCancel?: () => void
): void {
  showModal({
    title,
    content,
    type: 'warning',
    showConfirm: true,
    showCancel: true,
    confirmText: '确定',
    cancelText: '取消',
    onConfirm,
    onCancel
  });
}
