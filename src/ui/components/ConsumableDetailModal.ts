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

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      border: 3px solid #9b59b6;
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

    // 头部
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
      color: #c084fc;
    `;
    title.textContent = consumable.name;
    header.appendChild(title);

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

    modal.appendChild(header);

    // 类型标签
    const typeLabel = document.createElement('div');
    typeLabel.style.cssText = `
      display: inline-block;
      padding: 1vh 2vw;
      border-radius: 2vh;
      font-size: clamp(14px, 2.5vh, 20px);
      font-weight: bold;
      margin-bottom: 2vh;
      background: #9b59b633;
      color: #c084fc;
      width: fit-content;
    `;
    typeLabel.textContent = typeText;
    modal.appendChild(typeLabel);

    // 效果描述
    const desc = document.createElement('div');
    desc.style.cssText = `
      font-size: clamp(16px, 3vh, 22px);
      color: #d1d5db;
      margin-bottom: 3vh;
      line-height: 1.6;
      flex: 1;
    `;
    desc.textContent = consumable.description;
    modal.appendChild(desc);

    // 使用条件提示
    if (consumable.useCondition) {
      const conditionDiv = document.createElement('div');
      conditionDiv.style.cssText = `
        background: rgba(234, 179, 8, 0.2);
        border: 2px solid rgba(234, 179, 8, 0.5);
        border-radius: 1.5vh;
        padding: 2vh;
        margin-bottom: 3vh;
      `;

      const conditionTitle = document.createElement('div');
      conditionTitle.style.cssText = `
        font-size: clamp(14px, 2.5vh, 18px);
        color: #facc15;
        font-weight: bold;
        margin-bottom: 1vh;
      `;
      conditionTitle.textContent = '📋 使用条件';
      conditionDiv.appendChild(conditionTitle);

      const conditionText = document.createElement('div');
      conditionText.style.cssText = `
        font-size: clamp(14px, 2.5vh, 18px);
        color: #fde047;
      `;
      conditionText.textContent = consumable.useCondition;
      conditionDiv.appendChild(conditionText);

      modal.appendChild(conditionDiv);
    }

    // 价格信息
    const costInfo = document.createElement('div');
    costInfo.style.cssText = `
      font-size: clamp(16px, 3vh, 22px);
      color: #fbbf24;
      font-weight: bold;
      margin-bottom: 1vh;
    `;
    costInfo.textContent = `购买价格: $${consumable.cost}`;
    modal.appendChild(costInfo);

    // 卖出价格
    const sellInfo = document.createElement('div');
    sellInfo.style.cssText = `
      font-size: clamp(16px, 3vh, 22px);
      color: #4ade80;
      font-weight: bold;
      margin-bottom: 3vh;
    `;
    sellInfo.textContent = `卖出价格: $${sellPrice}`;
    modal.appendChild(sellInfo);

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.cssText = `
      display: flex;
      gap: 2vw;
      flex-shrink: 0;
    `;

    // 使用按钮
    if (onUse && typeof index === 'number') {
      const useButton = document.createElement('button');
      useButton.style.cssText = `
        flex: 1;
        padding: 2vh;
        background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
        border: 2px solid #a78bfa;
        border-radius: 1.5vh;
        color: white;
        font-size: clamp(16px, 3vh, 22px);
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      useButton.textContent = '使用';
      useButton.addEventListener('mouseover', () => useButton.style.transform = 'scale(1.02)');
      useButton.addEventListener('mouseout', () => useButton.style.transform = 'scale(1)');
      useButton.addEventListener('click', () => {
        this.close();
        onUse(index);
      });
      buttonArea.appendChild(useButton);
    }

    // 卖出按钮
    if (onSell && typeof index === 'number') {
      const sellButton = document.createElement('button');
      sellButton.style.cssText = `
        flex: 1;
        padding: 2vh;
        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
        border: 2px solid #ef4444;
        border-radius: 1.5vh;
        color: white;
        font-size: clamp(16px, 3vh, 22px);
        font-weight: bold;
        cursor: pointer;
        transition: transform 0.2s;
      `;
      sellButton.textContent = '卖出';
      sellButton.addEventListener('mouseover', () => sellButton.style.transform = 'scale(1.02)');
      sellButton.addEventListener('mouseout', () => sellButton.style.transform = 'scale(1)');
      sellButton.addEventListener('click', () => {
        this.close();
        onSell(index);
      });
      buttonArea.appendChild(sellButton);
    }

    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
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
    closeButton.textContent = '关闭';
    closeButton.addEventListener('mouseover', () => closeButton.style.transform = 'scale(1.02)');
    closeButton.addEventListener('mouseout', () => closeButton.style.transform = 'scale(1)');
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
