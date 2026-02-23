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
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 4vh 4vw;
    `;

    // 创建弹窗容器
    this.modal = document.createElement('div');
    this.modal.style.cssText = `
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border: 3px solid #4b5563;
      border-radius: 2vh;
      padding: 3vh 4vw;
      width: 85vw;
      max-width: 600px;
      max-height: 88vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    // 标题栏
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2vh;
      flex-shrink: 0;
    `;

    const title = document.createElement('h3');
    title.style.cssText = `
      font-size: clamp(20px, 4vh, 32px);
      font-weight: bold;
      color: ${this.getTitleColorValue(config.type)};
    `;
    title.textContent = config.title;
    header.appendChild(title);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      color: #9ca3af;
      font-size: clamp(24px, 5vh, 40px);
      cursor: pointer;
      background: none;
      border: none;
      transition: color 0.2s;
    `;
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('mouseover', () => closeBtn.style.color = '#ffffff');
    closeBtn.addEventListener('mouseout', () => closeBtn.style.color = '#9ca3af');
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this.modal.appendChild(header);

    // 内容区域
    const content = document.createElement('div');
    content.style.cssText = `
      font-size: clamp(16px, 3vh, 22px);
      color: #d1d5db;
      margin-bottom: 3vh;
      line-height: 1.6;
      white-space: pre-line;
      flex: 1;
    `;
    content.textContent = config.content;
    this.modal.appendChild(content);

    // 按钮区域
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 2vw;
      flex-shrink: 0;
    `;

    // 确认按钮（如果有）
    if (config.showConfirm !== false) {
      const isActionButton = config.confirmText === '购买' || config.confirmText === '卖出';
      const confirmBtn = document.createElement('button');
      confirmBtn.style.cssText = `
        flex: 1;
        padding: 2vh;
        background: ${isActionButton 
          ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'};
        border: 2px solid ${isActionButton ? '#ef4444' : '#3b82f6'};
        border-radius: 1.5vh;
        color: white;
        font-size: clamp(16px, 3vh, 22px);
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      confirmBtn.textContent = config.confirmText || '确定';
      confirmBtn.addEventListener('mouseover', () => confirmBtn.style.transform = 'scale(1.02)');
      confirmBtn.addEventListener('mouseout', () => confirmBtn.style.transform = 'scale(1)');
      confirmBtn.addEventListener('click', () => {
        if (config.onConfirm) config.onConfirm();
        this.close();
      });
      buttonContainer.appendChild(confirmBtn);
    }

    // 取消/关闭按钮（如果有）
    if (config.showCancel) {
      const cancelBtn = document.createElement('button');
      cancelBtn.style.cssText = `
        flex: 1;
        padding: 2vh;
        background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        border: 2px solid #6b7280;
        border-radius: 1.5vh;
        color: #f3f4f6;
        font-size: clamp(16px, 3vh, 22px);
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      cancelBtn.textContent = config.cancelText || '取消';
      cancelBtn.addEventListener('mouseover', () => cancelBtn.style.transform = 'scale(1.02)');
      cancelBtn.addEventListener('mouseout', () => cancelBtn.style.transform = 'scale(1)');
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
      this.overlay.remove();
      this.overlay = null;
      this.modal = null;
    }
  }

  private getTitleColorValue(type?: string): string {
    switch (type) {
      case 'success':
        return '#4ade80';
      case 'warning':
        return '#fbbf24';
      case 'error':
        return '#f87171';
      default:
        return '#fbbf24';
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
