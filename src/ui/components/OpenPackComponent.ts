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
import { generatePlayingCardModifiers } from '../../data/probabilities';

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
 * 支持全屏模式和内嵌模式（用于商店内开包）
 */
export class OpenPackComponent {
  private container: HTMLElement;
  private gameState: GameState;
  private pack: BoosterPack;
  private callbacks: OpenPackCallbacks;
  private revealedCards: (Card | Joker | Consumable)[] = [];
  private revealedStates: boolean[] = [];
  private selectedIndices: Set<number> = new Set(); // 支持多选
  private longPressTimer: number | null = null;
  private readonly LONG_PRESS_DURATION = 500; // 长按触发时间（毫秒）
  private jokerDetailModal: JokerDetailModal;
  private consumableDetailModal: ConsumableDetailModal;
  private isEmbedded: boolean; // 是否为内嵌模式（在商店内显示）

  constructor(
    container: HTMLElement,
    gameState: GameState,
    pack: BoosterPack,
    callbacks: OpenPackCallbacks,
    revealedCards?: (Card | Joker | Consumable)[],
    isEmbedded: boolean = false
  ) {
    this.container = container;
    this.gameState = gameState;
    this.pack = pack;
    this.callbacks = callbacks;
    this.isEmbedded = isEmbedded;
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

    // 获取已使用的优惠券
    const vouchersUsed = this.gameState.getVouchersUsed ? this.gameState.getVouchersUsed() : [];

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
        // 获取玩家已有的小丑牌ID，避免卡包开出重复的小丑牌
        const existingJokerIds = this.gameState.jokerSlots.getJokers().map(j => j.id);
        contents.push(...getRandomJokers(this.pack.choices, vouchersUsed, existingJokerIds));
        break;

      case 'spectral':
        contents.push(...getRandomConsumables(this.pack.choices, 'spectral'));
        break;
    }

    return contents;
  }

  /**
   * 生成随机游戏牌
   * 应用增强、版本、蜡封概率
   */
  private generateRandomPlayingCard(): Card {
    const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
    const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];

    const randomSuit = suits[Math.floor(Math.random() * suits.length)];
    const randomRank = ranks[Math.floor(Math.random() * ranks.length)];

    // 获取已使用的优惠券（从游戏状态）
    const vouchersUsed = this.gameState.getVouchersUsed ? this.gameState.getVouchersUsed() : [];

    // 生成增强、版本、蜡封
    const { enhancement, edition, seal } = generatePlayingCardModifiers(vouchersUsed);

    return new Card(randomSuit, randomRank, enhancement, seal, edition);
  }

  /**
   * 计算自适应缩放 - 基于屏幕尺寸和卡牌数量
   * 使用 clamp 实现平滑自适应，避免大屏幕下卡牌过大导致重叠
   */
  private calculateScale(): number {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardCount = this.revealedCards.length;
    
    // 基础缩放：使用 vmin 方式计算，确保在极端比例下也能正常显示
    const vmin = Math.min(viewportWidth, viewportHeight);
    const baseScale = vmin / 720; // 以 720px 为基准
    
    // 根据卡牌数量调整缩放
    // 使用连续函数而非分段判断，实现平滑过渡
    // 卡牌越多，缩放越小
    const cardAdjustment = Math.max(0.7, 1.3 - (cardCount - 2) * 0.1);
    
    // 限制缩放范围：大屏幕下限制最大缩放，避免卡牌过大重叠
    // 最小 0.4，最大 1.2（避免大屏幕下卡牌过大）
    return Math.max(0.4, Math.min(1.2, baseScale * cardAdjustment));
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
   * 支持全屏模式和内嵌模式
   */
  render(): void {
    this.container.innerHTML = '';

    // 创建开包界面根容器
    const overlay = document.createElement('div');
    
    if (this.isEmbedded) {
      // 内嵌模式：绝对定位覆盖父容器，不影响右侧栏位
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
      overlay.style.zIndex = '10';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.padding = `${this.scaled(16)}`;
      overlay.style.overflow = 'auto';
      overlay.style.borderRadius = '8px';
    } else {
      // 全屏模式
      overlay.className = 'casino-bg';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.zIndex = '1000';
    }

    // 创建主容器
    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexDirection = 'column';
    mainContainer.style.alignItems = 'center';
    mainContainer.style.justifyContent = 'flex-start';
    
    if (this.isEmbedded) {
      // 内嵌模式：自适应高度，不强制全屏
      mainContainer.style.flex = '1';
      mainContainer.style.width = '100%';
    } else {
      // 全屏模式
      mainContainer.style.minHeight = '100vh';
      mainContainer.style.padding = `${this.scaled(30)} ${this.scaled(20)} ${this.scaled(120)} ${this.scaled(20)}`;
      mainContainer.style.boxSizing = 'border-box';
      mainContainer.style.overflow = 'auto';
    }

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
    // 减小间距，让卡牌更紧凑
    cardsContainer.style.gap = this.scaled(24);
    cardsContainer.style.flex = '1';
    cardsContainer.style.width = '100%';
    cardsContainer.style.maxWidth = '90vw';

    this.revealedCards.forEach((card, index) => {
      const cardElement = this.createCardElement(card, index);
      cardsContainer.appendChild(cardElement);
    });

    mainContainer.appendChild(cardsContainer);

    // 底部按钮区域
    const buttonArea = document.createElement('div');
    if (this.isEmbedded) {
      // 内嵌模式：相对定位，不固定
      buttonArea.style.position = 'relative';
      buttonArea.style.marginTop = this.scaled(20);
    } else {
      // 全屏模式：固定定位
      buttonArea.style.position = 'fixed';
      buttonArea.style.bottom = this.scaled(20);
      buttonArea.style.left = '0';
      buttonArea.style.right = '0';
      buttonArea.style.zIndex = '100';
    }
    buttonArea.style.display = 'flex';
    buttonArea.style.justifyContent = 'center';
    buttonArea.style.alignItems = 'center';
    buttonArea.style.gap = this.scaled(24);
    buttonArea.style.padding = `${this.scaled(12)} ${this.scaled(30)}`;

    // 选择按钮（左侧）- 根据是否选中卡牌显示不同状态
    const selectButton = document.createElement('button');
    selectButton.className = 'game-btn game-btn-primary';
    selectButton.style.fontSize = this.scaled(20);
    selectButton.style.padding = `${this.scaled(10)} ${this.scaled(32)}`;
    selectButton.style.minWidth = this.scaled(120);
    const selectedCount = this.selectedIndices.size;
    const maxSelectCount = this.pack.selectCount;
    selectButton.style.opacity = selectedCount > 0 ? '1' : '0.5';
    selectButton.style.cursor = selectedCount > 0 ? 'pointer' : 'not-allowed';
    selectButton.textContent = `选择 (${selectedCount}/${maxSelectCount})`;
    selectButton.addEventListener('click', () => {
      if (selectedCount > 0) {
        // 处理多选
        const selectedCards = Array.from(this.selectedIndices).map(index => this.revealedCards[index]);
        this.handleMultipleCardSelect(selectedCards);
      } else {
        Toast.warning(`请至少选择 1 张卡牌（最多 ${maxSelectCount} 张）`);
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

    overlay.appendChild(mainContainer);
    overlay.appendChild(buttonArea);
    this.container.appendChild(overlay);
  }

  /**
   * 处理卡牌选择
   */
  private handleCardSelect(card: Card | Joker | Consumable): void {
    if (card instanceof Joker && this.pack.type === 'buffoon') {
      // 小丑包：检查小丑牌槽位
      const jokerSlots = this.gameState.getJokerSlots();
      const availableSlots = jokerSlots.getAvailableSlots();
      const isNegative = card.edition === 'negative';

      // 只有当没有可用槽位且不是负片牌时才阻止选择
      if (availableSlots <= 0 && !isNegative) {
        Toast.warning('小丑牌槽位已满！请先出售现有的小丑牌。');
        return;
      }
      this.callbacks.onCardSelected(card, 'keep');
    } else if (card instanceof Consumable &&
        (this.pack.type === 'arcana' || this.pack.type === 'celestial' || this.pack.type === 'spectral')) {
      // 消耗牌默认放入槽位
      // 不在这里检查槽位，让 addConsumable 来决定是否可以添加
      // 这样负片消耗牌在槽位满时也可以添加
      this.callbacks.onCardSelected(card, 'keep');
    } else {
      // 其他卡牌直接选择
      this.callbacks.onCardSelected(card, 'keep');
    }
  }

  /**
   * 显示卡牌详情
   * @param card - 卡牌对象
   * @param index - 卡牌索引（用于更新选择状态）
   */
  private showCardDetail(card: Card | Joker | Consumable, index: number): void {
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
          // 使用消耗牌时，调用 handleConsumableUse 方法
          this.handleConsumableUse(card, index);
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
    const isSelected = this.selectedIndices.has(index);

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.cursor = 'pointer';
    wrapper.style.display = 'flex';
    wrapper.style.flexDirection = 'column';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = `${this.calculateScale() * 8}px`;

    // 创建卡牌元素 - 增大尺寸
    let cardElement: HTMLElement;

    if (card instanceof Card) {
      cardElement = CardComponent.renderCard(card, isSelected);
    } else if (card instanceof Joker) {
      cardElement = CardComponent.renderJokerCard({
        id: card.id,
        name: card.name,
        description: card.getDynamicDescription(),
        rarity: card.rarity,
        cost: card.cost,
        edition: card.edition,
        disabled: card.disabled,
        faceDown: card.faceDown
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
    // 所有卡包都使用较小的缩放倍数（1.2倍），禁用重叠
    const cardScale = this.calculateScale() * 1.2;
    cardElement.style.transform = isSelected ? `scale(${cardScale * 1.1})` : `scale(${cardScale})`;
    cardElement.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

    // 选中状态添加发光效果
    if (isSelected) {
      cardElement.style.boxShadow = '0 0 30px #fbbf24, 0 0 60px rgba(251, 191, 36, 0.5)';
      cardElement.style.border = '3px solid #fbbf24';
    }

    wrapper.appendChild(cardElement);

    // 为消耗牌添加使用按钮，同时保留单击选中逻辑
    if (card instanceof Consumable) {
      const useButton = this.createUseButton(card, index);
      wrapper.appendChild(useButton);
      // 仍然设置单击选中和长按详情的交互
      this.setupCardInteractions(wrapper, card, index);
    } else {
      // 其他卡牌使用原来的交互方式
      this.setupCardInteractions(wrapper, card, index);
    }

    return wrapper;
  }

  /**
   * 创建消耗牌使用按钮
   */
  private createUseButton(consumable: Consumable, index: number): HTMLElement {
    const buttonScale = this.calculateScale();
    const useButton = document.createElement('button');
    useButton.textContent = '使用';
    useButton.style.padding = `${buttonScale * 6}px ${buttonScale * 12}px`;
    useButton.style.fontSize = `${buttonScale * 14}px`;
    useButton.style.borderRadius = `${buttonScale * 6}px`;
    useButton.style.border = 'none';
    useButton.style.cursor = 'pointer';
    useButton.style.fontWeight = 'bold';
    useButton.style.transition = 'all 0.2s ease';
    useButton.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    useButton.style.color = '#fff';
    useButton.style.marginTop = `${buttonScale * 16}px`;
    useButton.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';

    useButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.handleConsumableUse(consumable, index);
    });
    useButton.addEventListener('mouseenter', () => {
      useButton.style.transform = 'scale(1.05)';
      useButton.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.5)';
    });
    useButton.addEventListener('mouseleave', () => {
      useButton.style.transform = 'scale(1)';
      useButton.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
    });

    return useButton;
  }

  /**
   * 处理消耗牌使用
   * 使用后会从开包界面移除该牌，并减少可选择数量
   */
  private handleConsumableUse(consumable: Consumable, index: number): void {
    // 先检查是否可以使用
    const context = {
      gameState: {
        money: this.gameState.money,
        hands: this.gameState.handsRemaining,
        discards: this.gameState.discardsRemaining
      },
      selectedCards: this.gameState.cardPile.hand.getSelectedCards(),
      deck: this.gameState.cardPile.deck,
      handCards: this.gameState.cardPile.hand.getCards(),
      jokers: this.gameState.jokers.map(joker => {
        let sellPrice = Math.max(1, Math.floor(joker.cost / 2));
        if (joker.sticker === 'rental') {
          sellPrice = 1;
        }
        return {
          edition: joker.edition,
          hasEdition: joker.edition !== 'none',
          sellPrice: sellPrice,
          sticker: joker.sticker
        };
      }),
      money: this.gameState.money,
      handLevelState: this.gameState.handLevelState
    };

    // 检查使用条件
    if (!consumable.canUse(context)) {
      // 无法使用，显示提示并放入槽位
      Toast.warning(`${consumable.name} 当前无法使用，已放入消耗牌槽位`);
      this.callbacks.onCardSelected(consumable, 'keep');
      
      // 从 revealedCards 中移除该牌（因为已经放入槽位）
      this.revealedCards.splice(index, 1);
      this.revealedStates.splice(index, 1);
      
      // 更新 selectedIndices
      const newSelectedIndices = new Set<number>();
      this.selectedIndices.forEach(selectedIndex => {
        if (selectedIndex < index) {
          newSelectedIndices.add(selectedIndex);
        } else if (selectedIndex > index) {
          newSelectedIndices.add(selectedIndex - 1);
        }
      });
      this.selectedIndices = newSelectedIndices;
      
      // 减少可选择数量
      this.pack = { ...this.pack, selectCount: Math.max(0, this.pack.selectCount - 1) };
      
      // 重新渲染或关闭
      if (this.pack.selectCount === 0 || this.revealedCards.length === 0) {
        this.callbacks.onClose();
      } else {
        this.render();
      }
      return;
    }

    // 调用回调函数使用消耗牌
    this.callbacks.onCardSelected(consumable, 'use');
    
    // 从 revealedCards 中移除已使用的牌
    this.revealedCards.splice(index, 1);
    this.revealedStates.splice(index, 1);
    
    // 更新 selectedIndices（因为数组长度变了，索引需要调整）
    const newSelectedIndices = new Set<number>();
    this.selectedIndices.forEach(selectedIndex => {
      if (selectedIndex < index) {
        newSelectedIndices.add(selectedIndex);
      } else if (selectedIndex > index) {
        newSelectedIndices.add(selectedIndex - 1);
      }
      // 如果 selectedIndex === index，说明这张牌被使用了，不加入新集合
    });
    this.selectedIndices = newSelectedIndices;
    
    // 减少 pack.selectCount，表示已经选择了一张
    this.pack = { ...this.pack, selectCount: Math.max(0, this.pack.selectCount - 1) };
    
    // 显示反馈
    Toast.success(`使用了 ${consumable.name}`);
    
    // 如果所有可选牌都已使用/选择，或者没有牌了，关闭界面
    if (this.pack.selectCount === 0 || this.revealedCards.length === 0) {
      this.callbacks.onClose();
    } else {
      // 重新渲染界面
      this.render();
    }
  }

  /**
   * 设置卡牌交互（单击选择，长按详情）
   */
  private setupCardInteractions(wrapper: HTMLElement, card: Card | Joker | Consumable, index: number): void {
    let isLongPress = false;
    let startX = 0;
    let startY = 0;

    const startHandler = (e: MouseEvent | TouchEvent) => {
      // 检查是否点击了按钮，如果是则不处理选择逻辑
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
        return;
      }

      isLongPress = false;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      startX = clientX;
      startY = clientY;

      this.longPressTimer = window.setTimeout(() => {
        isLongPress = true;
        this.showCardDetail(card, index);
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

      // 检查是否点击了按钮，如果是则不处理选择逻辑
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'BUTTON' || target.closest('button'))) {
        return;
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
      if (cardElement && !this.selectedIndices.has(index)) {
        const cardScale = this.calculateScale() * 1.2;
        cardElement.style.transform = `scale(${cardScale * 1.05})`;
      }
    });

    wrapper.addEventListener('mouseleave', () => {
      const cardElement = wrapper.firstElementChild as HTMLElement;
      if (cardElement && !this.selectedIndices.has(index)) {
        const cardScale = this.calculateScale() * 1.2;
        cardElement.style.transform = `scale(${cardScale})`;
      }
    });
  }

  /**
   * 选择/取消选择卡牌
   * 支持多选，最多选择 pack.selectCount 张
   */
  private selectCard(index: number): void {
    const requiredCount = this.pack.selectCount;
    
    if (this.selectedIndices.has(index)) {
      // 已选中，取消选择
      this.selectedIndices.delete(index);
    } else {
      // 未选中，检查是否已达上限
      if (this.selectedIndices.size >= requiredCount) {
        // 已达上限，移除最早选择的（或提示用户）
        const firstSelected = this.selectedIndices.values().next().value;
        if (firstSelected !== undefined) {
          this.selectedIndices.delete(firstSelected);
        }
      }
      this.selectedIndices.add(index);
    }
    
    this.render(); // 重新渲染以更新选中状态
  }

  /**
   * 处理多选卡牌
   */
  private handleMultipleCardSelect(cards: (Card | Joker | Consumable)[]): void {
    // 依次处理每张选中的卡牌
    cards.forEach((card, index) => {
      setTimeout(() => {
        this.handleCardSelect(card);
      }, index * 100); // 延迟处理，避免冲突
    });
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
