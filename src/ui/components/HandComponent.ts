import { Card } from '../../models/Card';
import { Hand } from '../../models/Hand';
import { CardComponent } from './CardComponent';

export interface HandComponentCallbacks {
  onCardSelect?: (card: Card, index: number, isSelected: boolean) => void;
  onPlayHand?: () => void;
  onDiscard?: () => void;
  onSortByRank?: () => void;
  onSortBySuit?: () => void;
}

/**
 * 手牌组件
 * 只负责显示手牌和处理卡牌选择，按钮已移至GameBoard
 */
export class HandComponent {
  private container: HTMLElement;
  private hand: Hand;
  private callbacks: HandComponentCallbacks;
  private cardElements: HTMLElement[] = [];
  private handsRemaining: number = 4;
  private discardsRemaining: number = 3;
  private resizeObserver: ResizeObserver | null = null;
  private resizeTimeout: number | null = null;
  private lastContainerWidth: number = 0;

  constructor(container: HTMLElement, hand: Hand, callbacks: HandComponentCallbacks = {}) {
    this.container = container;
    this.hand = hand;
    this.callbacks = callbacks;
    this.render();
    this.setupResizeListener();
  }

  /**
   * 设置窗口大小变化监听
   * 屏幕大小变化时重新渲染手牌
   * 使用防抖避免频繁渲染
   */
  private setupResizeListener(): void {
    // 使用 ResizeObserver 监听容器大小变化
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        // 获取新的容器宽度
        const newWidth = entries[0]?.contentRect.width || 0;
        
        // 如果宽度变化小于10px，不重新渲染（避免微小变化导致的频繁渲染）
        if (Math.abs(newWidth - this.lastContainerWidth) < 10) {
          return;
        }
        this.lastContainerWidth = newWidth;

        // 使用防抖，避免频繁渲染
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = window.setTimeout(() => {
          this.render();
        }, 150);
      });
      this.resizeObserver.observe(this.container);
    }
  }

  /**
   * 更新手牌数据
   */
  setHand(hand: Hand): void {
    this.hand = hand;
    this.render();
  }

  /**
   * 更新剩余次数
   */
  setRemaining(handsRemaining: number, discardsRemaining: number): void {
    this.handsRemaining = handsRemaining;
    this.discardsRemaining = discardsRemaining;
  }

  /**
   * 渲染手牌区域
   * 只渲染手牌，不包含按钮
   * 手牌重叠范围根据中间区域宽度动态调整，避免越界
   */
  render(): void {
    this.container.innerHTML = '';
    this.cardElements = [];

    // 创建手牌区域
    const handArea = document.createElement('div');
    handArea.className = 'hand-area';
    handArea.style.display = 'flex';
    handArea.style.justifyContent = 'center';
    handArea.style.alignItems = 'center';
    handArea.style.width = '100%';
    handArea.style.height = '100%';

    const cards = this.hand.getCards();
    const selectedIndices = this.hand.getSelectedIndices();
    const totalCards = cards.length;

    // 获取中间区域实际宽度（通过查找父元素或游戏布局）
    const centerPanel = this.container.closest('.game-layout-center');
    const gameLayout = this.container.closest('.game-layout');
    
    // 计算中间区域宽度：游戏布局总宽度 - 左右边栏宽度
    let centerWidth = 800; // 默认值
    if (gameLayout) {
      const layoutWidth = gameLayout.clientWidth;
      // 根据CSS grid比例估算中间区域宽度
      // grid-template-columns: minmax(70px, 180px) 1fr minmax(120px, 240px)
      // 中间区域大约占剩余空间
      const leftWidth = Math.min(180, Math.max(70, layoutWidth * 0.15));
      const rightWidth = Math.min(240, Math.max(120, layoutWidth * 0.2));
      centerWidth = layoutWidth - leftWidth - rightWidth - 40; // 40px for gaps/padding
    } else if (centerPanel) {
      centerWidth = centerPanel.clientWidth;
    }
    
    // 确保最小宽度
    centerWidth = Math.max(300, centerWidth);
    
    // 记录当前容器宽度
    this.lastContainerWidth = this.container.clientWidth;

    const cardWidth = 100; // 卡牌宽度（像素）
    const overlap = this.calculateCardOverlap(centerWidth, totalCards, cardWidth);

    cards.forEach((card, index) => {
      const isSelected = selectedIndices.has(index);
      const cardElement = CardComponent.renderCard(card, isSelected);
      
      // 设置卡牌样式
      cardElement.style.position = 'relative';
      cardElement.style.flexShrink = '0';
      cardElement.style.marginLeft = index === 0 ? '0' : `-${overlap}px`;
      cardElement.style.zIndex = String(index);
      
      // 统一设置卡牌视觉状态
      this.setCardVisualState(cardElement, index, isSelected, totalCards);
      
      // 添加点击事件
      cardElement.addEventListener('click', () => this.handleCardClick(index));
      
      handArea.appendChild(cardElement);
      this.cardElements.push(cardElement);
    });

    this.container.appendChild(handArea);
  }

  /**
   * 计算卡牌重叠量
   * 根据中间区域宽度和手牌数量动态计算，确保手牌不会越界
   * 适配3840x2048到800x400分辨率
   * @param centerWidth - 中间区域宽度
   * @param totalCards - 手牌总数
   * @param cardWidth - 单张卡牌宽度
   * @returns 重叠量（像素）
   */
  private calculateCardOverlap(centerWidth: number, totalCards: number, cardWidth: number): number {
    if (totalCards <= 1) return 0;

    // 根据中间区域宽度动态调整边距
    // 小屏幕时边距更小，给手牌更多空间
    const padding = centerWidth < 400 ? 10 : Math.max(20, Math.min(60, centerWidth * 0.08));
    const availableWidth = centerWidth - padding;

    // 计算需要的总宽度（无重叠时）
    const totalWidthNeeded = totalCards * cardWidth;

    // 如果不需要重叠，返回0
    if (totalWidthNeeded <= availableWidth) {
      return 0;
    }

    // 计算需要的重叠量
    // 总宽度 = cardWidth + (totalCards - 1) * (cardWidth - overlap)
    // 解方程：overlap = cardWidth - (availableWidth - cardWidth) / (totalCards - 1)
    const calculatedOverlap = cardWidth - (availableWidth - cardWidth) / (totalCards - 1);

    // 根据中间区域宽度确定最大重叠量
    // 小屏幕时可以重叠更多（保留更少的可见部分）
    let maxVisibleRatio: number;
    if (centerWidth > 800) {
      maxVisibleRatio = 0.5; // 大屏幕保留50%
    } else if (centerWidth > 500) {
      maxVisibleRatio = 0.4; // 中等屏幕保留40%
    } else {
      maxVisibleRatio = 0.25; // 小屏幕只保留25%，重叠75%
    }
    
    const maxOverlap = cardWidth * (1 - maxVisibleRatio);
    
    // 确保至少重叠一定比例，防止间距过大
    const minOverlap = centerWidth < 400 ? cardWidth * 0.6 : cardWidth * 0.2;

    // 返回计算的重叠量，但限制在合理范围内
    return Math.min(Math.max(calculatedOverlap, minOverlap), maxOverlap);
  }

  /**
   * 处理卡牌点击
   */
  private handleCardClick(index: number): void {
    const isSelected = this.hand.toggleCard(index);
    const totalCards = this.hand.getCards().length;

    // 更新UI
    const cardElement = this.cardElements[index];
    if (cardElement) {
      CardComponent.setSelected(cardElement, isSelected);
      // 统一设置卡牌视觉状态
      this.setCardVisualState(cardElement, index, isSelected, totalCards);
    }

    // 回调
    const card = this.hand.getCards()[index];
    this.callbacks.onCardSelect?.(card, index, isSelected);
  }

  /**
   * 处理出牌
   */
  private handlePlayHand(): void {
    if (this.hand.getSelectionCount() === 0) return;
    if (this.handsRemaining <= 0) return;

    // 添加出牌动画
    const selectedIndices = this.hand.getSelectedIndices();
    selectedIndices.forEach(index => {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.addPlayAnimation(cardElement);
      }
    });

    // 延迟执行回调，等待动画
    setTimeout(() => {
      this.callbacks.onPlayHand?.();
    }, 300);
  }

  /**
   * 处理弃牌
   */
  private handleDiscard(): void {
    if (this.hand.getSelectionCount() === 0) return;
    if (this.discardsRemaining <= 0) return;

    this.callbacks.onDiscard?.();
  }

  /**
   * 获取当前选中的卡牌
   */
  getSelectedCards(): Card[] {
    return this.hand.getSelectedCards();
  }

  /**
   * 获取选中数量
   */
  getSelectionCount(): number {
    return this.hand.getSelectionCount();
  }

  /**
   * 计算卡牌的倾斜角度
   * @param index - 卡牌索引
   * @param totalCards - 手牌总数
   * @returns 倾斜角度（度）
   */
  private calculateCardRotation(index: number, totalCards: number): number {
    // 基础角度范围：根据手牌数量动态调整
    // 手牌越多，每张牌的角度越小，保持整体扇形美观
    const baseAngleRange = Math.min(32, totalCards * 4); // 最大32度范围
    const angleStep = totalCards > 1 ? baseAngleRange / (totalCards - 1) : 0;
    
    // 从左边开始计算角度
    // 第一张牌为负角度，最后一张为正角度，中间均匀分布
    const rotation = -baseAngleRange / 2 + index * angleStep;
    
    return rotation;
  }

  /**
   * 统一设置卡牌视觉状态
   * @param cardElement - 卡牌元素
   * @param index - 卡牌索引
   * @param isSelected - 是否选中
   * @param totalCards - 手牌总数
   */
  private setCardVisualState(cardElement: HTMLElement, index: number, isSelected: boolean, totalCards: number): void {
    const rotation = this.calculateCardRotation(index, totalCards);
    
    if (isSelected) {
      // 选中：拉正 + 上移
      cardElement.style.transform = `rotate(0deg) translateY(-20px)`;
    } else {
      // 未选中：保持倾斜
      cardElement.style.transform = `rotate(${rotation}deg)`;
    }
  }

  /**
   * 清除所有选择
   */
  clearSelection(): void {
    this.hand.clearSelection();
    const totalCards = this.hand.getCards().length;

    this.cardElements.forEach((cardElement, index) => {
      CardComponent.setSelected(cardElement, false);
      // 统一设置卡牌视觉状态
      this.setCardVisualState(cardElement, index, false, totalCards);
    });
  }

  /**
   * 选择指定索引的卡牌
   */
  selectCard(index: number): void {
    if (this.hand.selectCard(index)) {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.setSelected(cardElement, true);
        // 统一设置卡牌视觉状态
        const totalCards = this.hand.getCards().length;
        this.setCardVisualState(cardElement, index, true, totalCards);
      }
    }
  }

  /**
   * 取消选择指定索引的卡牌
   */
  deselectCard(index: number): void {
    if (this.hand.deselectCard(index)) {
      const cardElement = this.cardElements[index];
      if (cardElement) {
        CardComponent.setSelected(cardElement, false);
        // 统一设置卡牌视觉状态
        const totalCards = this.hand.getCards().length;
        this.setCardVisualState(cardElement, index, false, totalCards);
      }
    }
  }

  /**
   * 销毁组件，清理事件监听器
   */
  destroy(): void {
    // 清理 ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // 清理防抖定时器
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
  }
}
