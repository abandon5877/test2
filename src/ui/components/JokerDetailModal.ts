import { JOKER_RARITY_COLORS, type JokerRarity, JokerEdition } from '../../types/joker';
import type { Joker } from '../../models/Joker';

export interface JokerDetailOptions {
  joker: Joker;
  index?: number;
  onSell?: (index: number) => void;
  showSellButton?: boolean;
}

/**
 * 小丑牌详情弹窗工具类
 */
export class JokerDetailModal {
  private static instance: JokerDetailModal | null = null;
  private overlay: HTMLElement | null = null;

  static getInstance(): JokerDetailModal {
    if (!JokerDetailModal.instance) {
      JokerDetailModal.instance = new JokerDetailModal();
    }
    return JokerDetailModal.instance;
  }

  show(options: JokerDetailOptions): void {
    this.close();

    const { joker, index, onSell, showSellButton = true } = options;
    const rarityColor = JOKER_RARITY_COLORS[joker.rarity] || JOKER_RARITY_COLORS.common;

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
      border: 3px solid ${rarityColor};
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
      color: ${rarityColor};
    `;
    // 修复：如果小丑牌翻面，显示"未知小丑"而不是真实名称
    title.textContent = joker.faceDown ? '未知小丑' : joker.name;
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

    // 修复：如果小丑牌翻面，不显示稀有度、版本和效果描述
    if (!joker.faceDown) {
      // 稀有度标签
      const rarityLabel = document.createElement('div');
      rarityLabel.style.cssText = `
        display: inline-block;
        padding: 1vh 2vw;
        border-radius: 2vh;
        font-size: clamp(14px, 2.5vh, 20px);
        font-weight: bold;
        margin-bottom: 1vh;
        background: ${rarityColor}33;
        color: ${rarityColor};
        width: fit-content;
      `;
      rarityLabel.textContent = this.getRarityText(joker.rarity);
      modal.appendChild(rarityLabel);

      // 版本标签（如果有）
      if (joker.edition && joker.edition !== JokerEdition.None) {
        const editionLabel = document.createElement('div');
        const editionInfo = this.getEditionInfo(joker.edition);
        editionLabel.style.cssText = `
          display: inline-block;
          padding: 1vh 2vw;
          border-radius: 2vh;
          font-size: clamp(14px, 2.5vh, 20px);
          font-weight: bold;
          margin-bottom: 2vh;
          background: ${editionInfo.color}33;
          color: ${editionInfo.color};
          width: fit-content;
        `;
        editionLabel.textContent = editionInfo.name;
        modal.appendChild(editionLabel);
      }

      // 效果描述
      const desc = document.createElement('div');
      desc.style.cssText = `
        font-size: clamp(16px, 3vh, 22px);
        color: #d1d5db;
        margin-bottom: 3vh;
        line-height: 1.6;
        flex: 1;
      `;
      desc.textContent = joker.getDynamicDescription();
      modal.appendChild(desc);
    }

    // 价格信息
    const costInfo = document.createElement('div');
    costInfo.style.cssText = `
      font-size: clamp(16px, 3vh, 22px);
      color: #fbbf24;
      font-weight: bold;
      margin-bottom: 1vh;
    `;
    costInfo.textContent = `购买价格: $${joker.cost}`;
    modal.appendChild(costInfo);

    // 卖出价格
    const sellPrice = joker.getSellPrice();
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

    // 卖出按钮
    if (showSellButton && onSell && typeof index === 'number') {
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

  private getRarityText(rarity: JokerRarity): string {
    const rarityMap: Record<JokerRarity, string> = {
      common: '普通',
      uncommon: '罕见',
      rare: '稀有',
      legendary: '传说'
    };
    return rarityMap[rarity] || '普通';
  }

  private getEditionInfo(edition: JokerEdition): { name: string; color: string } {
    const editionMap: Record<JokerEdition, { name: string; color: string }> = {
      [JokerEdition.None]: { name: '无', color: '#9ca3af' },
      [JokerEdition.Foil]: { name: '闪箔 (+50筹码)', color: '#60a5fa' },
      [JokerEdition.Holographic]: { name: '全息 (+10倍率)', color: '#c084fc' },
      [JokerEdition.Polychrome]: { name: '多彩 (×1.5倍率)', color: '#fbbf24' },
      [JokerEdition.Negative]: { name: '负片 (+1小丑槽位)', color: '#ef4444' }
    };
    return editionMap[edition] || { name: '无', color: '#9ca3af' };
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
