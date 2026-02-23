import { Card } from '../../models/Card';
import { Suit, CardEnhancement, SealType, CardEdition } from '../../types/card';
import { JokerDetailModal } from './JokerDetailModal';
import { Joker } from '../../models/Joker';
import { JokerRarity, JokerTrigger, JokerEdition } from '../../types/joker';

export class CardComponent {
  private static suitSymbols: Record<Suit, string> = {
    [Suit.Spades]: '♠',
    [Suit.Hearts]: '♥',
    [Suit.Diamonds]: '♦',
    [Suit.Clubs]: '♣'
  };

  private static suitColors: Record<Suit, 'red' | 'black'> = {
    [Suit.Spades]: 'black',
    [Suit.Hearts]: 'red',
    [Suit.Diamonds]: 'red',
    [Suit.Clubs]: 'black'
  };

  private static enhancementIcons: Record<CardEnhancement, string> = {
    [CardEnhancement.None]: '',
    [CardEnhancement.Bonus]: '⭐',
    [CardEnhancement.Mult]: '✨',
    [CardEnhancement.Wild]: '🌈',
    [CardEnhancement.Glass]: '💎',
    [CardEnhancement.Steel]: '⚙️',
    [CardEnhancement.Stone]: '🪨',
    [CardEnhancement.Gold]: '🏆',
    [CardEnhancement.Lucky]: '🍀'
  };

  private static enhancementColors: Record<CardEnhancement, string> = {
    [CardEnhancement.None]: '',
    [CardEnhancement.Bonus]: '#f39c12',
    [CardEnhancement.Mult]: '#9b59b6',
    [CardEnhancement.Wild]: '#e74c3c',
    [CardEnhancement.Glass]: '#3498db',
    [CardEnhancement.Steel]: '#95a5a6',
    [CardEnhancement.Stone]: '#7f8c8d',
    [CardEnhancement.Gold]: '#f1c40f',
    [CardEnhancement.Lucky]: '#2ecc71'
  };

  private static sealIcons: Record<SealType, string> = {
    [SealType.None]: '',
    [SealType.Gold]: '🟡',
    [SealType.Red]: '🔴',
    [SealType.Blue]: '🔵',
    [SealType.Purple]: '🟣'
  };

  // 卡牌版本颜色
  private static editionColors: Record<CardEdition, { bg: string; border: string; shadow: string }> = {
    [CardEdition.None]: { bg: '', border: '', shadow: '' },
    [CardEdition.Foil]: { 
      bg: 'linear-gradient(135deg, rgba(192,192,192,0.3) 0%, rgba(220,220,220,0.5) 50%, rgba(192,192,192,0.3) 100%)', 
      border: '#c0c0c0',
      shadow: '0 0 10px rgba(192,192,192,0.6), inset 0 0 20px rgba(255,255,255,0.3)'
    },
    [CardEdition.Holographic]: { 
      bg: 'linear-gradient(135deg, rgba(233,30,99,0.3) 0%, rgba(156,39,176,0.5) 50%, rgba(63,81,181,0.3) 100%)', 
      border: '#e91e63',
      shadow: '0 0 15px rgba(233,30,99,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
    },
    [CardEdition.Polychrome]: { 
      bg: 'linear-gradient(135deg, rgba(255,0,0,0.2) 0%, rgba(255,165,0,0.3) 20%, rgba(255,255,0,0.3) 40%, rgba(0,255,0,0.3) 60%, rgba(0,0,255,0.3) 80%, rgba(238,130,238,0.2) 100%)', 
      border: '#f39c12',
      shadow: '0 0 15px rgba(243,156,18,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
    },
    [CardEdition.Negative]: { 
      bg: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(44,62,80,0.9) 50%, rgba(0,0,0,0.8) 100%)', 
      border: '#2c3e50',
      shadow: '0 0 15px rgba(44,62,80,0.8), inset 0 0 20px rgba(255,255,255,0.1)'
    }
  };

  // 卡牌版本图标
  private static editionIcons: Record<CardEdition, string> = {
    [CardEdition.None]: '',
    [CardEdition.Foil]: '🥈',
    [CardEdition.Holographic]: '✨',
    [CardEdition.Polychrome]: '🌈',
    [CardEdition.Negative]: '🌑'
  };

  // 小丑牌版本颜色
  private static jokerEditionColors: Record<JokerEdition, { bg: string; border: string; shadow: string }> = {
    [JokerEdition.None]: { bg: '', border: '', shadow: '' },
    [JokerEdition.Foil]: { 
      bg: 'linear-gradient(135deg, rgba(192,192,192,0.2) 0%, rgba(220,220,220,0.3) 50%, rgba(192,192,192,0.2) 100%)', 
      border: '#c0c0c0',
      shadow: '0 0 10px rgba(192,192,192,0.6), inset 0 0 20px rgba(255,255,255,0.2)'
    },
    [JokerEdition.Holographic]: { 
      bg: 'linear-gradient(135deg, rgba(233,30,99,0.2) 0%, rgba(156,39,176,0.3) 50%, rgba(63,81,181,0.2) 100%)', 
      border: '#e91e63',
      shadow: '0 0 15px rgba(233,30,99,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
    },
    [JokerEdition.Polychrome]: { 
      bg: 'linear-gradient(135deg, rgba(255,0,0,0.15) 0%, rgba(255,165,0,0.2) 20%, rgba(255,255,0,0.2) 40%, rgba(0,255,0,0.2) 60%, rgba(0,0,255,0.2) 80%, rgba(238,130,238,0.15) 100%)', 
      border: '#f39c12',
      shadow: '0 0 15px rgba(243,156,18,0.7), inset 0 0 20px rgba(255,255,255,0.2)'
    },
    [JokerEdition.Negative]: { 
      bg: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(44,62,80,0.7) 50%, rgba(0,0,0,0.6) 100%)', 
      border: '#2c3e50',
      shadow: '0 0 15px rgba(44,62,80,0.8), inset 0 0 20px rgba(255,255,255,0.1)'
    }
  };

  // 小丑牌版本图标
  private static jokerEditionIcons: Record<JokerEdition, string> = {
    [JokerEdition.None]: '',
    [JokerEdition.Foil]: '🥈',
    [JokerEdition.Holographic]: '✨',
    [JokerEdition.Polychrome]: '🌈',
    [JokerEdition.Negative]: '🌑'
  };

  /**
   * 渲染一张卡牌
   * @param isDisabled - 是否被Boss效果失效（显示红叉）
   */
  static renderCard(card: Card, isSelected: boolean = false, isDisabled: boolean = false): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`;
    cardElement.dataset.cardId = `${card.suit}${card.rank}`;

    const suitColor = this.suitColors[card.suit];
    const suitSymbol = this.suitSymbols[card.suit];

    // 应用卡牌版本视觉效果
    this.applyEditionVisuals(cardElement, card.edition);

    // 如果被失效，添加失效样式
    if (isDisabled) {
      cardElement.style.opacity = '0.6';
      cardElement.style.filter = 'grayscale(0.5)';
    }

    // 创建卡牌内容
    const colorClass = suitColor === 'red' ? 'card-suit-red' : 'card-suit-black';

    // 左上角
    const topCorner = document.createElement('div');
    topCorner.className = `card-corner card-corner-top ${colorClass}`;
    topCorner.innerHTML = `
      <span>${card.rank}</span>
      <span>${suitSymbol}</span>
    `;

    // 中心图案
    const center = document.createElement('div');
    center.className = `card-center ${colorClass}`;
    center.textContent = suitSymbol;

    // 右下角（旋转180度）
    const bottomCorner = document.createElement('div');
    bottomCorner.className = `card-corner card-corner-bottom ${colorClass}`;
    bottomCorner.innerHTML = `
      <span>${card.rank}</span>
      <span>${suitSymbol}</span>
    `;

    // 增强标记 - 放在右上角（与版本标记错开）
    if (card.enhancement !== CardEnhancement.None) {
      const enhancementBadge = document.createElement('div');
      enhancementBadge.className = 'card-enhancement-badge';
      enhancementBadge.style.cssText = `
        position: absolute;
        top: -8px;
        right: ${card.edition !== CardEdition.None ? '20px' : '-8px'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        background-color: ${this.enhancementColors[card.enhancement]};
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        z-index: 10;
      `;
      enhancementBadge.textContent = this.enhancementIcons[card.enhancement];
      enhancementBadge.title = this.getEnhancementName(card.enhancement);
      cardElement.appendChild(enhancementBadge);
    }

    // 封印标记 - 放在左下角（与版本标记错开）
    if (card.seal !== SealType.None) {
      const sealBadge = document.createElement('div');
      sealBadge.className = 'card-seal-badge';
      sealBadge.style.cssText = `
        position: absolute;
        bottom: -4px;
        left: -4px;
        font-size: 18px;
        z-index: 10;
        filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5));
      `;
      sealBadge.textContent = this.sealIcons[card.seal];
      sealBadge.title = this.getSealName(card.seal);
      cardElement.appendChild(sealBadge);
    }

    // 版本标记 - 放在左上角
    if (card.edition !== CardEdition.None) {
      const editionBadge = document.createElement('div');
      editionBadge.className = 'card-edition-badge';
      editionBadge.style.cssText = `
        position: absolute;
        top: -8px;
        left: -8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        background: ${this.editionColors[card.edition].bg};
        border: 2px solid ${this.editionColors[card.edition].border};
        box-shadow: ${this.editionColors[card.edition].shadow};
        z-index: 10;
      `;
      editionBadge.textContent = this.editionIcons[card.edition];
      editionBadge.title = this.getEditionName(card.edition);
      cardElement.appendChild(editionBadge);
    }

    // 失效标记 - 红叉
    if (isDisabled) {
      const disabledOverlay = document.createElement('div');
      disabledOverlay.className = 'card-disabled-overlay';
      disabledOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
        pointer-events: none;
      `;

      const redX = document.createElement('div');
      redX.textContent = '❌';
      redX.style.cssText = `
        font-size: 48px;
        color: #ef4444;
        text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
        opacity: 0.9;
      `;

      disabledOverlay.appendChild(redX);
      cardElement.appendChild(disabledOverlay);
    }

    cardElement.appendChild(topCorner);
    cardElement.appendChild(center);
    cardElement.appendChild(bottomCorner);

    return cardElement;
  }

  /**
   * 应用卡牌版本视觉效果到卡牌元素
   */
  private static applyEditionVisuals(element: HTMLElement, edition: CardEdition): void {
    if (edition === CardEdition.None) return;

    const colors = this.editionColors[edition];
    
    // 应用背景渐变
    element.style.background = colors.bg;
    
    // 应用边框发光效果
    element.style.borderColor = colors.border;
    element.style.boxShadow = colors.shadow;
    
    // 添加特殊动画效果
    if (edition === CardEdition.Holographic) {
      element.classList.add('holographic-effect');
    } else if (edition === CardEdition.Polychrome) {
      element.classList.add('polychrome-effect');
    } else if (edition === CardEdition.Foil) {
      element.classList.add('foil-effect');
    } else if (edition === CardEdition.Negative) {
      element.classList.add('negative-effect');
    }
  }

  /**
   * 渲染牌背
   */
  static renderBack(): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = 'card card-back';
    return cardElement;
  }

  /**
   * 渲染小丑牌
   */
  static renderJokerCard(joker: {
    id: string;
    name: string;
    description: string;
    rarity: string;
    cost: number;
    trigger?: string;
    edition?: JokerEdition;
    disabled?: boolean;
  }): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `joker-card ${joker.rarity}${joker.disabled ? ' disabled' : ''}`;
    cardElement.dataset.jokerId = joker.id;

    // 应用小丑牌版本视觉效果
    const edition = joker.edition || JokerEdition.None;
    if (edition !== JokerEdition.None) {
      this.applyJokerEditionVisuals(cardElement, edition);
    }

    const icon = document.createElement('div');
    icon.className = 'joker-icon';
    icon.textContent = this.getJokerIcon(joker.rarity);

    const name = document.createElement('div');
    name.className = 'joker-name';
    name.textContent = joker.name;

    // 效果描述（直接显示在卡牌上）
    const description = document.createElement('div');
    description.className = 'joker-description';
    description.textContent = joker.description;

    // 自适应字体大小以填满容器
    requestAnimationFrame(() => {
      CardComponent.adjustFontSizeToFit(description);
    });

    const cost = document.createElement('div');
    cost.className = 'joker-cost';
    cost.textContent = `$${joker.cost}`;

    cardElement.appendChild(icon);
    cardElement.appendChild(name);
    cardElement.appendChild(description);
    cardElement.appendChild(cost);

    // 添加版本标记
    if (edition !== JokerEdition.None) {
      const editionBadge = document.createElement('div');
      editionBadge.className = 'joker-edition-badge';
      editionBadge.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 18px;
        z-index: 10;
        filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
        animation: edition-glow 2s ease-in-out infinite;
      `;
      editionBadge.textContent = this.jokerEditionIcons[edition];
      editionBadge.title = this.getJokerEditionName(edition);
      cardElement.appendChild(editionBadge);
    }

    // 添加禁用标记（深红之心Boss效果）
    if (joker.disabled) {
      // 禁用遮罩
      const disabledOverlay = document.createElement('div');
      disabledOverlay.className = 'joker-disabled-overlay';
      disabledOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
        border-radius: 8px;
      `;

      // 禁用图标
      const disabledIcon = document.createElement('div');
      disabledIcon.style.cssText = `
        font-size: 48px;
        color: #ff4444;
        text-shadow: 0 0 10px rgba(255, 68, 68, 0.8);
        animation: pulse 1.5s ease-in-out infinite;
      `;
      disabledIcon.textContent = '🚫';

      // 禁用文字
      const disabledText = document.createElement('div');
      disabledText.style.cssText = `
        position: absolute;
        bottom: 20px;
        font-size: 14px;
        font-weight: bold;
        color: #ff4444;
        text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.7);
        padding: 4px 8px;
        border-radius: 4px;
      `;
      disabledText.textContent = '已禁用';

      disabledOverlay.appendChild(disabledIcon);
      disabledOverlay.appendChild(disabledText);
      cardElement.appendChild(disabledOverlay);
    }

    // 点击查看详情
    cardElement.addEventListener('click', () => {
      this.showJokerDetail(joker);
    });

    // 悬停提示
    const titlePrefix = joker.disabled ? '[已禁用] ' : '';
    cardElement.title = `${titlePrefix}点击查看详情: ${joker.name}`;

    return cardElement;
  }

  /**
   * 调整字体大小以适应容器，填满可用空间
   * 使用二分查找找到最佳字体大小
   */
  private static adjustFontSizeToFit(element: HTMLElement): void {
    const parent = element.parentElement;
    if (!parent) return;

    // 获取其他元素
    const icon = parent.querySelector('.joker-icon') as HTMLElement;
    const name = parent.querySelector('.joker-name') as HTMLElement;
    const cost = parent.querySelector('.joker-cost') as HTMLElement;

    if (!icon || !name || !cost) return;

    // 计算可用空间
    const parentRect = parent.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    const nameRect = name.getBoundingClientRect();
    const costRect = cost.getBoundingClientRect();

    // 计算已占用的高度（从卡片顶部到cost底部，以及cost底部到卡片底部的空间）
    const paddingTop = iconRect.top - parentRect.top;
    const paddingBottom = parentRect.bottom - costRect.bottom;
    const gaps = nameRect.top - iconRect.bottom + costRect.top - nameRect.bottom;
    const usedHeight = iconRect.height + nameRect.height + costRect.height + paddingTop + paddingBottom + gaps;

    // 可用高度
    const availableHeight = parentRect.height - usedHeight;

    // 可用宽度（减去padding）
    const availableWidth = parentRect.width - 8;

    const text = element.textContent || '';

    // 使用二分查找找到最佳字体大小
    let minSize = 6;
    let maxSize = 16;
    let bestSize = 10;

    // 临时设置行高为1.2以便计算
    element.style.lineHeight = '1.2';

    while (minSize <= maxSize) {
      const midSize = Math.floor((minSize + maxSize) / 2);
      element.style.fontSize = `${midSize}px`;

      // 强制重绘以获取正确尺寸
      const height = element.scrollHeight;
      const width = element.scrollWidth;

      // 检查是否适合（考虑多行文本）
      // 估算需要的行数
      const avgCharsPerLine = Math.floor(availableWidth / (midSize * 0.6)); // 中文字符约0.6倍字体宽度
      const estimatedLines = Math.ceil(text.length / Math.max(avgCharsPerLine, 1));
      const estimatedHeight = estimatedLines * midSize * 1.2;

      if (estimatedHeight <= availableHeight && width <= availableWidth) {
        bestSize = midSize;
        minSize = midSize + 1;
      } else {
        maxSize = midSize - 1;
      }
    }

    element.style.fontSize = `${bestSize}px`;
  }

  /**
   * 应用小丑牌版本视觉效果
   */
  private static applyJokerEditionVisuals(element: HTMLElement, edition: JokerEdition): void {
    if (edition === JokerEdition.None) return;

    const colors = this.jokerEditionColors[edition];
    
    // 应用背景渐变
    element.style.background = colors.bg;
    
    // 应用边框发光效果
    element.style.borderColor = colors.border;
    element.style.boxShadow = colors.shadow;
    
    // 添加特殊动画效果
    if (edition === JokerEdition.Holographic) {
      element.classList.add('holographic-effect');
    } else if (edition === JokerEdition.Polychrome) {
      element.classList.add('polychrome-effect');
    } else if (edition === JokerEdition.Foil) {
      element.classList.add('foil-effect');
    } else if (edition === JokerEdition.Negative) {
      element.classList.add('negative-effect');
    }
  }

  /**
   * 显示小丑牌详情
   * 使用统一的 JokerDetailModal
   */
  private static showJokerDetail(joker: {
    id: string;
    name: string;
    description: string;
    rarity: string;
    cost: number;
    trigger?: string;
    disabled?: boolean;
  }): void {
    // 创建临时 Joker 对象用于详情展示
    const jokerForModal = new Joker({
      id: joker.id,
      name: joker.name,
      description: joker.description,
      rarity: joker.rarity as JokerRarity,
      cost: joker.cost,
      trigger: (joker.trigger as JokerTrigger) || JokerTrigger.ON_INDEPENDENT,
      effect: () => ({})
    });
    // 设置禁用状态
    jokerForModal.disabled = joker.disabled || false;

    JokerDetailModal.getInstance().show({
      joker: jokerForModal,
      showSellButton: false
    });
  }

  /**
   * 渲染消耗牌
   * @param showCost - 是否显示价格，默认为 true
   */
  static renderConsumableCard(consumable: {
    id: string;
    name: string;
    description: string;
    type: string;
    cost: number;
    isNegative?: boolean;
  }, showCost: boolean = true): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `consumable-card ${consumable.type}`;
    cardElement.dataset.consumableId = consumable.id;

    // 应用负片效果
    if (consumable.isNegative) {
      cardElement.classList.add('negative-consumable');
      cardElement.style.border = '2px solid #9b59b6';
      cardElement.style.boxShadow = '0 0 10px rgba(155, 89, 182, 0.5), inset 0 0 20px rgba(155, 89, 182, 0.1)';
      cardElement.style.background = 'linear-gradient(135deg, rgba(155, 89, 182, 0.1) 0%, rgba(0, 0, 0, 0.8) 100%)';
    }

    const icon = document.createElement('div');
    icon.className = 'consumable-icon';
    icon.textContent = this.getConsumableIcon(consumable.type);

    const name = document.createElement('div');
    name.className = 'consumable-name';
    name.textContent = consumable.name;

    const type = document.createElement('div');
    type.className = 'consumable-type';
    type.textContent = this.getConsumableTypeName(consumable.type);

    // 效果描述（直接显示在卡牌上）
    const description = document.createElement('div');
    description.className = 'consumable-description';
    description.textContent = consumable.description;

    cardElement.appendChild(icon);
    cardElement.appendChild(name);
    cardElement.appendChild(type);
    cardElement.appendChild(description);

    // 只在需要时显示价格
    if (showCost) {
      const cost = document.createElement('div');
      cost.className = 'mt-2 text-yellow-400 font-bold text-sm';
      cost.textContent = `$${consumable.cost}`;
      cardElement.appendChild(cost);
    }

    // 添加负片标记
    if (consumable.isNegative) {
      const negativeBadge = document.createElement('div');
      negativeBadge.className = 'negative-badge';
      negativeBadge.style.cssText = `
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 16px;
        z-index: 10;
        animation: negative-pulse 2s infinite;
      `;
      negativeBadge.textContent = '🌑';
      negativeBadge.title = '负片 (不占用槽位)';
      cardElement.appendChild(negativeBadge);
    }

    // 悬停提示
    cardElement.title = `${consumable.name}: ${consumable.description}${consumable.isNegative ? ' [负片]' : ''}`;

    return cardElement;
  }

  /**
   * 更新卡牌选中状态
   */
  static setSelected(cardElement: HTMLElement, isSelected: boolean): void {
    if (isSelected) {
      cardElement.classList.add('selected');
    } else {
      cardElement.classList.remove('selected');
    }
  }

  /**
   * 添加发牌动画
   */
  static addDealAnimation(cardElement: HTMLElement, delay: number = 0): void {
    cardElement.style.animationDelay = `${delay}ms`;
    cardElement.classList.add('animate-deal');
    
    setTimeout(() => {
      cardElement.classList.remove('animate-deal');
      cardElement.style.animationDelay = '';
    }, 400 + delay);
  }

  /**
   * 添加出牌动画
   */
  static addPlayAnimation(cardElement: HTMLElement): void {
    cardElement.classList.add('animate-play');
    
    setTimeout(() => {
      cardElement.classList.remove('animate-play');
    }, 300);
  }

  /**
   * 获取增强名称
   */
  private static getEnhancementName(enhancement: CardEnhancement): string {
    const names: Record<CardEnhancement, string> = {
      [CardEnhancement.None]: '无',
      [CardEnhancement.Bonus]: '奖励 (+30筹码)',
      [CardEnhancement.Mult]: '倍率 (+4倍率)',
      [CardEnhancement.Wild]: '万能 (可当作任意花色)',
      [CardEnhancement.Glass]: '玻璃 (x2倍率, 1/4几率自毁)',
      [CardEnhancement.Steel]: '钢铁 (持有时+1.5倍率)',
      [CardEnhancement.Stone]: '石头 (固定50筹码, 无点数花色)',
      [CardEnhancement.Gold]: '黄金 (回合结束获得$3)',
      [CardEnhancement.Lucky]: '幸运 (+20%几率+20筹码, +5%几率+5倍率)'
    };
    return names[enhancement];
  }

  /**
   * 获取封印名称
   */
  private static getSealName(seal: SealType): string {
    const names: Record<SealType, string> = {
      [SealType.None]: '无',
      [SealType.Gold]: '金蜡封 (打出时获得$3)',
      [SealType.Red]: '红蜡封 (重新触发一次)',
      [SealType.Blue]: '蓝蜡封 (生成一张星球牌)',
      [SealType.Purple]: '紫蜡封 (生成一张塔罗牌)'
    };
    return names[seal];
  }

  /**
   * 获取卡牌版本名称
   */
  private static getEditionName(edition: CardEdition): string {
    const names: Record<CardEdition, string> = {
      [CardEdition.None]: '无',
      [CardEdition.Foil]: '闪箔 (+50筹码)',
      [CardEdition.Holographic]: '全息 (+10倍率)',
      [CardEdition.Polychrome]: '多彩 (×1.5倍率)',
      [CardEdition.Negative]: '负片 (+1小丑槽位)'
    };
    return names[edition];
  }

  /**
   * 获取小丑牌版本名称
   */
  private static getJokerEditionName(edition: JokerEdition): string {
    const names: Record<JokerEdition, string> = {
      [JokerEdition.None]: '无',
      [JokerEdition.Foil]: '闪箔 (+50筹码)',
      [JokerEdition.Holographic]: '全息 (+10倍率)',
      [JokerEdition.Polychrome]: '多彩 (×1.5倍率)',
      [JokerEdition.Negative]: '负片 (+1小丑槽位)'
    };
    return names[edition];
  }

  /**
   * 获取小丑牌图标
   */
  private static getJokerIcon(rarity: string): string {
    const icons: Record<string, string> = {
      'common': '🤡',
      'uncommon': '🎭',
      'rare': '👑',
      'legendary': '⭐'
    };
    return icons[rarity] || '🤡';
  }

  /**
   * 获取消耗牌图标
   */
  private static getConsumableIcon(type: string): string {
    const icons: Record<string, string> = {
      'tarot': '🔮',
      'planet': '🪐',
      'spectral': '👻'
    };
    return icons[type] || '✨';
  }

  /**
   * 获取消耗牌类型名称
   */
  private static getConsumableTypeName(type: string): string {
    const names: Record<string, string> = {
      'tarot': '塔罗牌',
      'planet': '星球牌',
      'spectral': '幻灵牌'
    };
    return names[type] || type;
  }
}
