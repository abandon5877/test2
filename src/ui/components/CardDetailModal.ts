import { Card } from '../../models/Card';
import { CardEnhancement, SealType, CardEdition } from '../../types/card';

export interface CardDetailOptions {
  card: Card;
}

/**
 * 卡牌详情弹窗
 * 显示卡牌的详细信息，包括增强效果、蜡封、版本等
 */
export class CardDetailModal {
  private static instance: CardDetailModal | null = null;
  private overlay: HTMLElement | null = null;

  static getInstance(): CardDetailModal {
    if (!CardDetailModal.instance) {
      CardDetailModal.instance = new CardDetailModal();
    }
    return CardDetailModal.instance;
  }

  show(options: CardDetailOptions): void {
    this.close();

    const { card } = options;

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
      border: 3px solid #d4af37;
      border-radius: 2vh;
      padding: 3vh 4vw;
      width: 85vw;
      max-width: 500px;
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
      font-size: clamp(20px, 4vh, 28px);
      font-weight: bold;
      color: #ffd700;
    `;
    title.textContent = card.getDisplayName();
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = `
      color: #9ca3af;
      font-size: clamp(24px, 5vh, 36px);
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

    // 卡牌信息区域
    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 2vh;
      margin-bottom: 3vh;
    `;

    // 基础信息
    const baseInfo = document.createElement('div');
    baseInfo.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5vh 2vw;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 1vh;
    `;
    baseInfo.innerHTML = `
      <span style="color: #9ca3af; font-size: clamp(14px, 2.5vh, 18px);">基础筹码</span>
      <span style="color: #60a5fa; font-size: clamp(16px, 3vh, 22px); font-weight: bold;">${card.getChipValue()}</span>
    `;
    infoSection.appendChild(baseInfo);

    // 增强效果
    if (card.enhancement !== CardEnhancement.None) {
      const enhancementInfo = this.createEffectSection(
        '增强效果',
        this.getEnhancementName(card.enhancement),
        this.getEnhancementDescription(card.enhancement),
        this.getEnhancementColor(card.enhancement)
      );
      infoSection.appendChild(enhancementInfo);
    }

    // 蜡封
    if (card.seal !== SealType.None) {
      const sealInfo = this.createEffectSection(
        '蜡封',
        this.getSealName(card.seal),
        this.getSealDescription(card.seal),
        '#fbbf24'
      );
      infoSection.appendChild(sealInfo);
    }

    // 版本
    if (card.edition !== CardEdition.None) {
      const editionInfo = this.createEffectSection(
        '版本',
        this.getEditionName(card.edition),
        this.getEditionDescription(card.edition),
        '#c084fc'
      );
      infoSection.appendChild(editionInfo);
    }

    modal.appendChild(infoSection);

    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      padding: 2vh;
      background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
      border: 2px solid #6b7280;
      border-radius: 1.5vh;
      color: #f3f4f6;
      font-size: clamp(16px, 3vh, 20px);
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
      flex-shrink: 0;
    `;
    closeButton.textContent = '关闭';
    closeButton.addEventListener('mouseover', () => closeButton.style.transform = 'scale(1.02)');
    closeButton.addEventListener('mouseout', () => closeButton.style.transform = 'scale(1)');
    closeButton.addEventListener('click', () => this.close());
    modal.appendChild(closeButton);

    this.overlay.appendChild(modal);
    document.body.appendChild(this.overlay);

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });
  }

  private createEffectSection(
    label: string,
    name: string,
    description: string,
    color: string
  ): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = `
      padding: 1.5vh 2vw;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 1vh;
      border-left: 4px solid ${color};
    `;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `
      color: #9ca3af;
      font-size: clamp(12px, 2vh, 14px);
      margin-bottom: 0.5vh;
    `;
    labelEl.textContent = label;
    section.appendChild(labelEl);

    const nameEl = document.createElement('div');
    nameEl.style.cssText = `
      color: ${color};
      font-size: clamp(16px, 3vh, 20px);
      font-weight: bold;
      margin-bottom: 0.5vh;
    `;
    nameEl.textContent = name;
    section.appendChild(nameEl);

    const descEl = document.createElement('div');
    descEl.style.cssText = `
      color: #d1d5db;
      font-size: clamp(14px, 2.5vh, 16px);
      line-height: 1.5;
    `;
    descEl.textContent = description;
    section.appendChild(descEl);

    return section;
  }

  private getEnhancementName(enhancement: CardEnhancement): string {
    const names: Record<CardEnhancement, string> = {
      [CardEnhancement.None]: '无',
      [CardEnhancement.Bonus]: '奖励',
      [CardEnhancement.Mult]: '倍率',
      [CardEnhancement.Wild]: '万能',
      [CardEnhancement.Glass]: '玻璃',
      [CardEnhancement.Steel]: '钢铁',
      [CardEnhancement.Stone]: '石头',
      [CardEnhancement.Gold]: '黄金',
      [CardEnhancement.Lucky]: '幸运'
    };
    return names[enhancement];
  }

  private getEnhancementDescription(enhancement: CardEnhancement): string {
    const descriptions: Record<CardEnhancement, string> = {
      [CardEnhancement.None]: '无特殊效果',
      [CardEnhancement.Bonus]: '计分时+30筹码',
      [CardEnhancement.Mult]: '计分时+4倍率',
      [CardEnhancement.Wild]: '可当作任意花色使用',
      [CardEnhancement.Glass]: '计分时x2倍率，但有1/4几率自毁',
      [CardEnhancement.Steel]: '手持时×1.5倍率',
      [CardEnhancement.Stone]: '固定50筹码，无点数和花色',
      [CardEnhancement.Gold]: '回合结束时获得$3',
      [CardEnhancement.Lucky]: '计分时20%几率+20筹码，5%几率+5倍率'
    };
    return descriptions[enhancement];
  }

  private getEnhancementColor(enhancement: CardEnhancement): string {
    const colors: Record<CardEnhancement, string> = {
      [CardEnhancement.None]: '#9ca3af',
      [CardEnhancement.Bonus]: '#f39c12',
      [CardEnhancement.Mult]: '#9b59b6',
      [CardEnhancement.Wild]: '#e74c3c',
      [CardEnhancement.Glass]: '#3498db',
      [CardEnhancement.Steel]: '#95a5a6',
      [CardEnhancement.Stone]: '#7f8c8d',
      [CardEnhancement.Gold]: '#f1c40f',
      [CardEnhancement.Lucky]: '#2ecc71'
    };
    return colors[enhancement];
  }

  private getSealName(seal: SealType): string {
    const names: Record<SealType, string> = {
      [SealType.None]: '无',
      [SealType.Gold]: '金蜡封',
      [SealType.Red]: '红蜡封',
      [SealType.Blue]: '蓝蜡封',
      [SealType.Purple]: '紫蜡封'
    };
    return names[seal];
  }

  private getSealDescription(seal: SealType): string {
    const descriptions: Record<SealType, string> = {
      [SealType.None]: '无特殊效果',
      [SealType.Gold]: '计分时获得$3',
      [SealType.Red]: '计分时重新触发一次卡牌效果',
      [SealType.Blue]: '回合结束时留在手牌中，生成一张对应最后出牌牌型的星球牌',
      [SealType.Purple]: '弃掉时生成一张塔罗牌'
    };
    return descriptions[seal];
  }

  private getEditionName(edition: CardEdition): string {
    const names: Record<CardEdition, string> = {
      [CardEdition.None]: '无',
      [CardEdition.Foil]: '闪箔',
      [CardEdition.Holographic]: '全息',
      [CardEdition.Polychrome]: '多彩',
      [CardEdition.Negative]: '负片'
    };
    return names[edition];
  }

  private getEditionDescription(edition: CardEdition): string {
    const descriptions: Record<CardEdition, string> = {
      [CardEdition.None]: '无特殊效果',
      [CardEdition.Foil]: '计分时+50筹码',
      [CardEdition.Holographic]: '计分时+10倍率',
      [CardEdition.Polychrome]: '计分时x1.5倍率',
      [CardEdition.Negative]: '小丑槽位+1'
    };
    return descriptions[edition];
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}
