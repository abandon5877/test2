import { Card } from '../../models/Card';
import { Suit, CardEnhancement, SealType, CardEdition } from '../../types/card';
import { JokerDetailModal } from './JokerDetailModal';
import { Joker } from '../../models/Joker';
import { JokerRarity, JokerTrigger } from '../../types/joker';

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

  /**
   * 渲染一张卡牌
   */
  static renderCard(card: Card, isSelected: boolean = false): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${isSelected ? 'selected' : ''}`;
    cardElement.dataset.cardId = `${card.suit}${card.rank}`;
    
    const suitColor = this.suitColors[card.suit];
    const suitSymbol = this.suitSymbols[card.suit];
    
    // 应用卡牌版本视觉效果
    this.applyEditionVisuals(cardElement, card.edition);
    
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
  }): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `joker-card ${joker.rarity}`;
    cardElement.dataset.jokerId = joker.id;

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

    const cost = document.createElement('div');
    cost.className = 'joker-cost';
    cost.textContent = `$${joker.cost}`;

    cardElement.appendChild(icon);
    cardElement.appendChild(name);
    cardElement.appendChild(description);
    cardElement.appendChild(cost);

    // 点击查看详情
    cardElement.addEventListener('click', () => {
      this.showJokerDetail(joker);
    });

    // 悬停提示
    cardElement.title = `点击查看详情: ${joker.name}`;

    return cardElement;
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
  }, showCost: boolean = true): HTMLElement {
    const cardElement = document.createElement('div');
    cardElement.className = `consumable-card ${consumable.type}`;
    cardElement.dataset.consumableId = consumable.id;

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

    // 悬停提示
    cardElement.title = `${consumable.name}: ${consumable.description}`;

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
