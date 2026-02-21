import { type BoosterPack, type PackType } from '../../data/consumables';
import { GameState } from '../../models/GameState';
import { CardComponent } from './CardComponent';
import { Card } from '../../models/Card';
import { Joker } from '../../models/Joker';
import { Consumable } from '../../models/Consumable';
import { getRandomJokers } from '../../data/jokers';
import { getRandomConsumables } from '../../data/consumables';
import { JOKER_RARITY_NAMES } from '../../types/joker';
import { CONSUMABLE_TYPE_NAMES } from '../../types/consumable';
import { Toast } from './Toast';
import { Suit, Rank } from '../../types/card';
import { JokerDetailModal } from './JokerDetailModal';
import { ConsumableDetailModal } from './ConsumableDetailModal';

export interface OpenPackCallbacks {
  onClose: () => void;
  onCardSelected: (card: Card | Joker | Consumable, action: 'keep' | 'use') => void;
  onSkip: () => void;
}

export interface OpenPackOptions {
  pack: BoosterPack;
  revealedCards?: (Card | Joker | Consumable)[]; // 预生成的卡牌内容
}

/**
 * 开包界面组件
 * 显示卡包打开动画，展示卡牌，允许玩家选择
 */
export class OpenPackComponent {
  private container: HTMLElement;
  private gameState: GameState;
  private pack: BoosterPack;
  private callbacks: OpenPackCallbacks;
  private revealedCards: (Card | Joker | Consumable)[] = [];
  private revealedStates: boolean[] = [];
  private selectedIndex: number | null = null;
  private longPressTimer: number | null = null;
  private readonly LONG_PRESS_DURATION = 500; // 长按触发时间（毫秒）
  private jokerDetailModal: JokerDetailModal;
  private consumableDetailModal: ConsumableDetailModal;

  constructor(
    container: HTMLElement,
    gameState: GameState,
    pack: BoosterPack,
    callbacks: OpenPackCallbacks,
    revealedCards?: (Card | Joker | Consumable)[]
  ) {
    this.container = container;
    this.gameState = gameState;
    this.pack = pack;
    this.callbacks = callbacks;
    this.jokerDetailModal = JokerDetailModal.getInstance();
    this.consumableDetailModal = ConsumableDetailModal.getInstance();

    // 使用预生成的卡牌内容，或生成新的内容
    this.revealedCards = revealedCards || this.generatePackContents();
    this.revealedStates = new Array(this.revealedCards.length).fill(true); // 默认全部翻开
    this.render();
  }

  /**
   * 生成卡包内容
   */
  private generatePackContents(): (Card | Joker | Consumable)[] {
    const contents: (Card | Joker | Consumable)[] = [];

    switch (this.pack.type) {
      case 'standard':
        for (let i = 0; i < this.pack.choices; i++) {
          contents.push(this.generateRandomPlayingCard());
        }
        break;

      case 'arcana':
        contents.push(...getRandomConsumables(this.pack.choices, 'tarot'));
        break;

      case 'celestial':
        contents.push(...getRandomConsumables(this.pack.choices, 'planet'));
        break;

      case 'buffoon':
        contents.push(...getRandomJokers(this.pack.choices));
        break;

      case 'spectral':
        contents.push(...getRandomConsumables(this.pack.choices, 'spectral'));
        break;
    }

    return contents;
  }

  /**
   * 生成随机游戏牌
   */
  private generateRandomPlayingCard(): Card {
    const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
    const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
    
    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
    
    return new Card(randomSuit, randomRank);
  }

  /**
   * 计算自适应缩放 - 基于屏幕尺寸和卡牌数量
   */
  private calculateScale(): number {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardCount = this.revealedCards.length;
    
    // 基础缩放
    const baseScale = Math.min(viewportWidth / 1280, viewportHeight / 720);
    
    // 根据卡牌数量调整缩放
    // 卡牌少时放大，卡牌多时缩小
    let cardAdjustment = 1;
    if (cardCount <= 2) {
      cardAdjustment = 1.3;
    } else if (cardCount <= 3) {
      cardAdjustment = 1.1;
    } else if (cardCount <= 4) {
      cardAdjustment = 1.0;
    } else {
      cardAdjustment = 0.9;
    }
    
    // 限制缩放范围
    return Math.max(0.5, Math.min(1.8, baseScale * cardAdjustment));
  }

  /**
   * 根据屏幕尺寸计算动态缩放值
   */
  private scaled(value: number): string {
    const scale = this.calculateScale();
    return `${Math.round(value * scale)}px`;
  }

  /**
   * 渲染开包界面
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg game-container';
    this.container.style.position = 'relative';

    // 创建主容器 - 使用 flex 布局，为底部按钮留出空间
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.alignItems = 'center';
    mainContainer.style.justifyContent = 'flex-start';
    mainContainer.style.minHeight = '100vh';
    mainContainer.style.padding = `${this.scaled(30)} ${this.scaled(20)} ${this.scaled(120)} ${this.scaled(20)}`; // 底部留出按钮空间
    mainContainer.style.boxSizing = 'border-box';
    mainContainer.style.overflow = 'auto';

    // 标题
    const title = document.createElement('h1');
    title.className = 'font-bold text-yellow-400 mb-2 text-center';
    title.style.fontSize = this.scaled(32);
    title.style.marginTop = this.scaled(10);
    title.textContent = `📦 ${this.pack.name}`;
    mainContainer.appendChild(title);

    // 描述
    const description = document.createElement('p');
    description.className = 'text-gray-300 mb-4 text-center';
    description.style.fontSize = this.scaled(18);
    description.textContent = this.pack.description;
    mainContainer.appendChild(description);

    // 卡牌展示区域 - 自适应大小
    const cardsContainer = document.createElement('div');
    cardsContainer.style.display = 'flex';
    cardsContainer.style.flexWrap = 'wrap';
    cardsContainer.style.justifyContent = 'center';
    cardsContainer.style.alignItems = 'center';
    cardsContainer.style.gap = this.scaled(32);
    cardsContainer.style.flex = '1';
    cardsContainer.style.width = '100%';
    cardsContainer.style.maxWidth = '90vw';

    this.revealedCards.forEach((card, index) => {
      const cardElement = this.createCardElement(card, index);
      cardsContainer.appendChild(cardElement);
    });

    mainContainer.appendChild(cardsContainer);

    // 底部固定按钮区域
    const buttonArea = document.createElement('div');
    buttonArea.style.position = 'fixed';
    buttonArea.style.bottom = this.scaled(20); // 上移一点，不贴底
    buttonArea.style.left = '0';
    buttonArea.style.right = '0';
    buttonArea.style.display = 'flex';
    buttonArea.style.justifyContent = 'center';
    buttonArea.style.alignItems = 'center';
    buttonArea.style.gap = this.scaled(24);
    buttonArea.style.padding = `${this.scaled(12)} ${this.scaled(30)}`;
    buttonArea.style.zIndex = '100';

    // 选择按钮（左侧）- 根据是否选中卡牌显示不同状态
    const selectButton = document.createElement('button');
    selectButton.className = 'game-btn game-btn-primary';
    selectButton.style.fontSize = this.scaled(20);
    selectButton.style.padding = `${this.scaled(10)} ${this.scaled(32)}`;
    selectButton.style.minWidth = this.scaled(120);
    selectButton.style.opacity = this.selectedIndex !== null ? '1' : '0.5';
    selectButton.style.cursor = this.selectedIndex !== null ? 'pointer' : 'not-allowed';
    selectButton.textContent = '选择';
    selectButton.addEventListener('click', () => {
      if (this.selectedIndex !== null) {
        const card = this.revealedCards[this.selectedIndex];
        this.handleCardSelect(card);
      } else {
        Toast.warning('请先选择一张卡牌');
      }
    });
    buttonArea.appendChild(selectButton);

    // 跳过按钮（右侧）
    const skipButton = document.createElement('button');
    skipButton.className = 'game-btn game-btn-secondary';
    skipButton.style.fontSize = this.scaled(20);
    skipButton.style.padding = `${this.scaled(10)} ${this.scaled(32)}`;
    skipButton.style.minWidth = this.scaled(120);
    skipButton.textContent = '跳过';
    skipButton.addEventListener('click', () => {
      this.callbacks.onSkip();
    });
    buttonArea.appendChild(skipButton);

    this.container.appendChild(mainContainer);
    this.container.appendChild(buttonArea);
  }

  /**
   * 处理卡牌选择
   */
  private handleCardSelect(card: Card | Joker | Consumable): void {
    if (card instanceof Joker && this.pack.type === 'buffoon') {
      // 小丑包：检查小丑牌槽位
      if (this.gameState.getJokerSlots().getAvailableSlots() <= 0) {
        Toast.warning('小丑牌槽位已满！请先出售现有的小丑牌。');
        return;
      }
      this.callbacks.onCardSelected(card, 'keep');
    } else if (card instanceof Consumable && 
        (this.pack.type === 'arcana' || this.pack.type === 'celestial' || this.pack.type === 'spectral')) {
      // 消耗牌默认放入槽位
      if (!this.gameState.hasAvailableConsumableSlot()) {
        Toast.warning('消耗牌槽位已满！请先使用或出售现有的消耗牌。');
        return;
      }
      this.callbacks.onCardSelected(card, 'keep');
    } else {
      // 其他卡牌直接选择
      this.callbacks.onCardSelected(card, 'keep');
    }
  }

  /**
   * 显示卡牌详情
   */
  private showCardDetail(card: Card | Joker | Consumable): void {
    if (card instanceof Joker) {
      this.jokerDetailModal.show({
        joker: card,
        index: -1,
        showSellButton: false
      });
    } else if (card instanceof Consumable) {
      this.consumableDetailModal.show({
        consumable: card,
        index: -1,
        onUse: () => {
          this.callbacks.onCardSelected(card, 'use');
        },
        onSell: undefined
      });
    } else if (card instanceof Card) {
      // 游戏牌显示简单信息
      Toast.info(`${card.toString()} - 游戏牌`);
    }
  }

  /**
   * 创建卡牌元素
   */
  private createCardElement(card: Card | Joker | Consumable, index: number): HTMLElement {
    const isSelected = this.selectedIndex === index;

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.cursor = 'pointer';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';

    // 创建卡牌元素 - 增大尺寸
    let cardElement: HTMLElement;

    if (card instanceof Card) {
      cardElement = CardComponent.renderCard(card, isSelected);
    } else if (card instanceof Joker) {
      cardElement = CardComponent.renderJokerCard({
        id: card.id,
        name: card.name,
        description: card.description,
        rarity: card.rarity,
        cost: card.cost
      });
    } else if (card instanceof Consumable) {
      cardElement = CardComponent.renderConsumableCard({
        id: card.id,
        name: card.name,
        description: card.description,
        type: card.type,
        cost: card.cost
      }, false);
    } else {
      cardElement = document.createElement('div');
    }

    // 放大卡牌尺寸
    const cardScale = this.calculateScale() * 2.0; // 额外放大2.0倍
    cardElement.style.transform = isSelected ? `scale(${cardScale * 1.1})` : `scale(${cardScale})`;
    cardElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
    
    // 选中状态添加发光效果
    if (isSelected) {
      cardElement.style.boxShadow = '0 0 30px #fbbf24, 0 0 60px rgba(251, 191, 36, 0.5)';
      cardElement.style.border = '3px solid #fbbf24';
    }

    wrapper.appendChild(cardElement);

    // 添加长按和点击事件
    this.setupCardInteractions(wrapper, card, index);

    return wrapper;
  }

  /**
   * 设置卡牌交互（单击选择，长按详情）
   */
  private setupCardInteractions(wrapper: HTMLElement, card: Card | Joker | Consumable, index: number): void {
    let isLongPress = false;
    let startX = 0;
    let startY = 0;

    const startHandler = (e: MouseEvent | TouchEvent) => {
      isLongPress = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      startX = clientX;
      startY = clientY;

      this.longPressTimer = window.setTimeout(() => {
        isLongPress = true;
        this.showCardDetail(card);
      }, this.LONG_PRESS_DURATION);
    };

    const moveHandler = (e: MouseEvent | TouchEvent) => {
      if (this.longPressTimer) {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
        
        // 如果移动距离超过阈值，取消长按
        const moveDistance = Math.sqrt(Math.pow(clientX - startX, 2) + Math.pow(clientY - startY, 2));
        if (moveDistance > 10) {
          clearTimeout(this.longPressTimer);
          this.longPressTimer = null;
        }
      }
    };

    const endHandler = (e: MouseEvent | TouchEvent) => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // 如果不是长按，则处理单击选择
      if (!isLongPress) {
        e.preventDefault();
        this.selectCard(index);
      }
    };

    // 鼠标事件
    wrapper.addEventListener('mousedown', startHandler);
    wrapper.addEventListener('mousemove', moveHandler);
    wrapper.addEventListener('mouseup', endHandler);
    wrapper.addEventListener('mouseleave', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    // 触摸事件
    wrapper.addEventListener('touchstart', startHandler, { passive: true });
    wrapper.addEventListener('touchmove', moveHandler, { passive: true });
    wrapper.addEventListener('touchend', endHandler);

    // 悬停效果
    wrapper.addEventListener('mouseenter', () => {
      const cardElement = wrapper.firstElementChild as HTMLElement;
      if (cardElement && this.selectedIndex !== index) {
        const cardScale = this.calculateScale() * 2.0;
        cardElement.style.transform = `scale(${cardScale * 1.05})`;
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      const cardElement = wrapper.firstElementChild as HTMLElement;
      if (cardElement && this.selectedIndex !== index) {
        const cardScale = this.calculateScale() * 2.0;
        cardElement.style.transform = `scale(${cardScale})`;
      }
    });
  }

  /**
   * 选择卡牌
   */
  private selectCard(index: number): void {
    this.selectedIndex = index;
    this.render(); // 重新渲染以更新选中状态
  }

  /**
   * 获取卡包类型名称
   */
  private getPackTypeName(type: PackType): string {
    const names: Record<PackType, string> = {
      'standard': '标准包',
      'arcana': '秘术包',
      'celestial': '天体包',
      'buffoon': '小丑包',
      'spectral': '幻灵包'
    };
    return names[type] || '卡包';
  }
}
