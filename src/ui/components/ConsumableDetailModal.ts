import { CONSUMABLE_TYPE_NAMES } from '../../types/consumable';
import type { Consumable } from '../../models/Consumable';

export interface ConsumableDetailOptions {
  consumable: Consumable;
  index?: number;
  onUse?: (index: number) => void;
  onSell?: (index: number) => void;
}

/**
 * 消耗牌详情弹窗工具类
 */
export class ConsumableDetailModal {
  private static instance: ConsumableDetailModal | null = null;
  private overlay: HTMLElement | null = null;

  static getInstance(): ConsumableDetailModal {
    if (!ConsumableDetailModal.instance) {
      ConsumableDetailModal.instance = new ConsumableDetailModal();
    }
    return ConsumableDetailModal.instance;
  }

  show(options: ConsumableDetailOptions): void {
    this.close();

    const { consumable, index, onUse, onSell } = options;
    const typeText = CONSUMABLE_TYPE_NAMES[consumable.type] || consumable.type;
    const sellPrice = 1; // 消耗牌卖出价格固定为1

    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in';

    const modal = document.createElement('div');
    modal.className = 'game-panel max-w-md w-full mx-4 transform scale-100 animate-modal-in';

    // 头部
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const title = document.createElement('h3');
    title.className = 'text-xl font-bold text-purple-400';
    title.textContent = consumable.name;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-400 hover:text-white transition-colors text-2xl';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // 类型标签
    const typeLabel = document.createElement('div');
    typeLabel.className = 'inline-block px-3 py-1 rounded-full text-sm font-bold mb-4';
    typeLabel.style.backgroundColor = '#9b59b633';
    typeLabel.style.color = '#9b59b6';
    typeLabel.textContent = typeText;
    modal.appendChild(typeLabel);

    // 效果描述
    const desc = document.createElement('div');
    desc.className = 'text-gray-300 mb-4 leading-relaxed';
    desc.textContent = consumable.description;
    modal.appendChild(desc);

    // 使用条件提示
    if (consumable.useCondition) {
      const conditionDiv = document.createElement('div');
      conditionDiv.className = 'bg-yellow-900/30 border border-yellow-600/50 rounded p-3 mb-4';
      
      const conditionTitle = document.createElement('div');
      conditionTitle.className = 'text-yellow-400 font-bold text-sm mb-1';
      conditionTitle.textContent = '📋 使用条件';
      conditionDiv.appendChild(conditionTitle);
      
      const conditionText = document.createElement('div');
      conditionText.className = 'text-yellow-200/80 text-sm';
      conditionText.textContent = consumable.useCondition;
      conditionDiv.appendChild(conditionText);
      
      modal.appendChild(conditionDiv);
    }

    // 价格信息
    const costInfo = document.createElement('div');
    costInfo.className = 'text-yellow-400 font-bold mb-2';
    costInfo.textContent = `购买价格: $${consumable.cost}`;
    modal.appendChild(costInfo);

    // 卖出价格
    const sellInfo = document.createElement('div');
    sellInfo.className = 'text-green-400 font-bold mb-4';
    sellInfo.textContent = `卖出价格: $${sellPrice}`;
    modal.appendChild(sellInfo);

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.className = 'flex gap-3';

    // 使用按钮
    if (onUse && typeof index === 'number') {
      const useButton = document.createElement('button');
      useButton.className = 'game-btn game-btn-primary flex-1';
      useButton.textContent = '使用';
      useButton.addEventListener('click', () => {
        this.close();
        onUse(index);
      });
      buttonArea.appendChild(useButton);
    }

    // 卖出按钮
    if (onSell && typeof index === 'number') {
      const sellButton = document.createElement('button');
      sellButton.className = 'game-btn game-btn-danger flex-1';
      sellButton.textContent = '卖出';
      sellButton.addEventListener('click', () => {
        this.close();
        onSell(index);
      });
      buttonArea.appendChild(sellButton);
    }

    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'game-btn game-btn-secondary flex-1';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => this.close());
    buttonArea.appendChild(closeButton);

    modal.appendChild(buttonArea);
    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

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
    }
  }
}
