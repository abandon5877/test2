import { JOKER_RARITY_NAMES, JokerEdition, StickerType } from '../../types/joker';
import type { Joker } from '../../models/Joker';

export interface JokerDetailOptions {
  joker: Joker;
  index?: number;
  showSellButton?: boolean;
  onSell?: (index: number) => void;
}

/**
 * 小丑牌详情弹窗工具类
 * 统一处理所有界面的小丑牌详情展示
 */
export class JokerDetailModal {
  private static instance: JokerDetailModal | null = null;
  private overlay: HTMLElement | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(): JokerDetailModal {
    if (!JokerDetailModal.instance) {
      JokerDetailModal.instance = new JokerDetailModal();
    }
    return JokerDetailModal.instance;
  }

  /**
   * 显示小丑牌详情弹窗
   */
  show(options: JokerDetailOptions): void {
    // 关闭已存在的弹窗
    this.close();

    const { joker, index, showSellButton = false, onSell } = options;
    const rarityText = JOKER_RARITY_NAMES[joker.rarity] || joker.rarity;
    // 使用小丑牌的getSellPrice方法获取售价（包含礼品卡加成）
    const sellPrice = joker.getSellPrice();
    const isEternal = joker.sticker === StickerType.Eternal;
    const isRental = joker.sticker === StickerType.Rental;
    const isPerishable = joker.sticker === StickerType.Perishable;

    // 创建遮罩
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in';

    // 创建弹窗
    const modal = document.createElement('div');
    modal.className = 'game-panel max-w-md w-full mx-4 transform scale-100 animate-modal-in';

    // 头部
    const header = document.createElement('div');
    header.className = 'flex items-center justify-between mb-4';

    const title = document.createElement('h3');
    title.className = 'text-xl font-bold';
    title.style.color = this.getRarityColor(joker.rarity);
    title.textContent = joker.name;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'text-gray-400 hover:text-white transition-colors text-2xl';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    modal.appendChild(header);

    // 稀有度标签
    const rarityLabel = document.createElement('div');
    rarityLabel.className = 'inline-block px-3 py-1 rounded-full text-sm font-bold mb-4';
    rarityLabel.style.backgroundColor = this.getRarityColor(joker.rarity) + '33';
    rarityLabel.style.color = this.getRarityColor(joker.rarity);
    rarityLabel.textContent = rarityText;
    modal.appendChild(rarityLabel);

    // 版本标签（Edition）
    if (joker.edition && joker.edition !== JokerEdition.None) {
      const editionLabel = document.createElement('div');
      editionLabel.className = 'inline-block px-2 py-0.5 rounded text-xs font-bold mb-4 ml-2';
      
      switch (joker.edition) {
        case JokerEdition.Foil:
          editionLabel.style.backgroundColor = '#c0c0c033';
          editionLabel.style.color = '#c0c0c0';
          editionLabel.textContent = '闪箔 (+50筹码)';
          break;
        case JokerEdition.Holographic:
          editionLabel.style.backgroundColor = '#e91e6333';
          editionLabel.style.color = '#e91e63';
          editionLabel.textContent = '全息 (+10倍率)';
          break;
        case JokerEdition.Polychrome:
          editionLabel.style.backgroundColor = '#f39c1233';
          editionLabel.style.color = '#f39c12';
          editionLabel.textContent = '多彩 (×1.5倍率)';
          break;
        case JokerEdition.Negative:
          editionLabel.style.backgroundColor = '#2c3e5033';
          editionLabel.style.color = '#ecf0f1';
          editionLabel.textContent = '负片 (+1槽位)';
          break;
      }
      
      modal.appendChild(editionLabel);
    }

    // 贴纸标签（Sticker）
    if (joker.sticker && joker.sticker !== StickerType.None) {
      const stickerLabel = document.createElement('div');
      stickerLabel.className = 'inline-block px-2 py-0.5 rounded text-xs font-bold mb-4 ml-2';
      
      switch (joker.sticker) {
        case StickerType.Eternal:
          stickerLabel.style.backgroundColor = '#e74c3c33';
          stickerLabel.style.color = '#e74c3c';
          stickerLabel.textContent = '🔒 永恒';
          break;
        case StickerType.Rental:
          stickerLabel.style.backgroundColor = '#9b59b633';
          stickerLabel.style.color = '#9b59b6';
          stickerLabel.textContent = '💰 租赁 (回合-$3)';
          break;
        case StickerType.Perishable:
          stickerLabel.style.backgroundColor = '#f39c1233';
          stickerLabel.style.color = '#f39c12';
          const remainingRounds = (joker as any).perishableRounds || 5;
          stickerLabel.textContent = `⏳ 易腐 (${remainingRounds}回合)`;
          break;
      }
      
      modal.appendChild(stickerLabel);
    }

    // 效果描述
    const desc = document.createElement('div');
    desc.className = 'text-gray-300 mb-4 leading-relaxed';
    desc.textContent = joker.description;
    modal.appendChild(desc);

    // 价格信息
    const costInfo = document.createElement('div');
    costInfo.className = 'text-yellow-400 font-bold mb-2';
    costInfo.textContent = `购买价格: $${joker.cost}`;
    modal.appendChild(costInfo);

    // 卖出价格（如果需要显示）
    if (showSellButton) {
      const sellInfo = document.createElement('div');
      sellInfo.className = 'font-bold mb-4';
      
      if (isEternal) {
        sellInfo.className += ' text-red-400';
        sellInfo.textContent = '卖出价格: 🔒 永恒小丑无法出售';
      } else if (isRental) {
        sellInfo.className += ' text-purple-400';
        sellInfo.textContent = '卖出价格: $1 (租赁小丑)';
      } else {
        sellInfo.className += ' text-green-400';
        sellInfo.textContent = `卖出价格: $${sellPrice}`;
      }
      
      modal.appendChild(sellInfo);
    }

    // 按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.className = 'flex gap-3';

    // 卖出按钮（如果需要且可以卖出）
    if (showSellButton && !isEternal && onSell && typeof index === 'number') {
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
    closeButton.className = 'game-btn game-btn-primary flex-1';
    closeButton.textContent = '关闭';
    closeButton.addEventListener('click', () => this.close());
    buttonArea.appendChild(closeButton);

    modal.appendChild(buttonArea);

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    // 点击遮罩关闭
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  /**
   * 获取稀有度颜色
   */
  private getRarityColor(rarity: string): string {
    const colors: Record<string, string> = {
      'common': '#4a90d9',
      'uncommon': '#2ecc71',
      'rare': '#e74c3c',
      'legendary': '#f39c12'
    };
    return colors[rarity] || '#fff';
  }
}
