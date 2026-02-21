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

    // 获取中间区域实际宽度：直接使用手牌容器的父元素（hand-area）宽度
    const centerPanel = this.container.closest('.game-layout-center') as HTMLElement;
    
    // 优先使用 hand-area 的实际宽度，其次是 game-layout-center，最后是容器自身
    let centerWidth = this.container.clientWidth;
    if (handArea && handArea.clientWidth > 0) {
      centerWidth = handArea.clientWidth;
    } else if (centerPanel && centerPanel.clientWidth > 0) {
      centerWidth = centerPanel.clientWidth;
    }
    
    // 确保最小宽度（防止计算错误）
    centerWidth = Math.max(200, centerWidth);
    
    // 记录当前容器宽度
    this.lastContainerWidth = this.container.clientWidth;

    // 先渲染第一张卡牌到 DOM，获取实际宽度后再计算重叠量
    // 这样可以准确获取 CSS 计算后的卡牌尺寸
    let cardWidth = 70; // 默认估算值
    let overlap = 0;
    
    // 渲染第一张卡牌
    if (cards.length > 0) {
      const firstCard = cards[0];
      const isFirstSelected = selectedIndices.has(0);
      const firstCardElement = CardComponent.renderCard(firstCard, isFirstSelected);
      
      // 临时添加到 DOM 以获取实际尺寸
      firstCardElement.style.position = 'relative';
      firstCardElement.style.flexShrink = '0';
      firstCardElement.style.visibility = 'hidden'; // 先隐藏，避免闪烁
      handArea.appendChild(firstCardElement);
      
      // 获取实际卡牌宽度
      const actualWidth = firstCardElement.clientWidth;
      if (actualWidth > 0) {
        cardWidth = actualWidth;
      }
      
      // 计算重叠量
      overlap = this.calculateCardOverlap(centerWidth, totalCards, cardWidth);
      
      // 恢复可见性并设置样式
      firstCardElement.style.visibility = 'visible';
      firstCardElement.style.zIndex = '0';
      this.setCardVisualState(firstCardElement, 0, isFirstSelected, totalCards);
      firstCardElement.addEventListener('click', () => this.handleCardClick(0));
      this.cardElements.push(firstCardElement);
      
      // 渲染剩余卡牌
      for (let index = 1; index < cards.length; index++) {
        const card = cards[index];
        const isSelected = selectedIndices.has(index);
        const cardElement = CardComponent.renderCard(card, isSelected);
        
        // 设置卡牌样式
        cardElement.style.position = 'relative';
        cardElement.style.flexShrink = '0';
        cardElement.style.marginLeft = `-${overlap}px`;
        cardElement.style.zIndex = String(index);
        
        // 统一设置卡牌视觉状态
        this.setCardVisualState(cardElement, index, isSelected, totalCards);
        
        // 添加点击事件
        cardElement.addEventListener('click', () => this.handleCardClick(index));
        
        handArea.appendChild(cardElement);
        this.cardElements.push(cardElement);
      }
    }

    this.container.appendChild(handArea);
  }

  /**
   * 计算卡牌重叠量
   * 根据容器实际尺寸和手牌数量动态计算，确保手牌不会越界
   * 使用连续函数而非分段预设值，实现平滑自适应
   * @param centerWidth - 中间区域宽度
   * @param totalCards - 手牌总数
   * @param cardWidth - 单张卡牌宽度
   * @returns 重叠量（像素）
   */
  private calculateCardOverlap(centerWidth: number, totalCards: number, cardWidth: number): number {
    if (totalCards <= 1) return 0;

    // 获取容器高度，用于在极端比例下调整重叠量
    const containerHeight = this.container.clientHeight;
    const aspectRatio = centerWidth / containerHeight;
    
    // 动态计算边距：基于容器宽度的连续函数
    // 使用 clamp 确保边距在合理范围内（10px 到 60px）
    const padding = Math.max(10, Math.min(60, centerWidth * 0.06));
    const availableWidth = centerWidth - padding;

    // 计算需要的总宽度（无重叠时）
    const totalWidthNeeded = totalCards * cardWidth;

    // 如果不需要重叠，返回0
    if (totalWidthNeeded <= availableWidth) {
      console.log('[HandComponent] 无需重叠', { centerWidth, totalCards, cardWidth, availableWidth, totalWidthNeeded });
      return 0;
    }

    // 计算需要的重叠量
    // 总宽度 = cardWidth + (totalCards - 1) * (cardWidth - overlap)
    const calculatedOverlap = cardWidth - (availableWidth - cardWidth) / (totalCards - 1);

    // 动态计算最大重叠量：基于容器宽度的连续函数
    // 使用平滑的插值函数，避免分段跳跃
    // 目标：容器越宽，保留的可见比例越高（35% ~ 55%）
    const minVisibleRatio = 0.35;  // 最小可见比例（最拥挤时保留更多）
    const maxVisibleRatio = 0.55;  // 最大可见比例（最宽松时）
    const referenceMinWidth = 250;  // 参考最小宽度（降低以适应更小的屏幕）
    const referenceMaxWidth = 1200; // 参考最大宽度
    
    // 使用平滑的插值计算可见比例
    const widthRatio = Math.max(0, Math.min(1, 
      (centerWidth - referenceMinWidth) / (referenceMaxWidth - referenceMinWidth)
    ));
    let visibleRatio = minVisibleRatio + (maxVisibleRatio - minVisibleRatio) * widthRatio;
    
    // 在极端宽高比下增加可见比例，避免卡牌堆叠太紧
    const idealAspectRatio = 1.78;
    const aspectRatioDeviation = Math.abs(aspectRatio - idealAspectRatio) / idealAspectRatio;
    if (aspectRatioDeviation > 0.3) {
      visibleRatio = Math.min(0.6, visibleRatio + 0.1);
    }
    
    const maxOverlap = cardWidth * (1 - visibleRatio);
    
    // 动态计算最小重叠量：确保卡牌不会太分散
    // 基于容器宽度连续变化（10% ~ 40% 的卡牌宽度，降低最小值）
    const minOverlapRatio = Math.max(0.1, Math.min(0.4, 0.5 - centerWidth / 2500));
    const minOverlap = cardWidth * minOverlapRatio;

    const finalOverlap = Math.min(Math.max(calculatedOverlap, minOverlap), maxOverlap);
    
    // 输出调试日志
    console.log('[HandComponent] 重叠量计算', {
      centerWidth,
      containerHeight,
      aspectRatio: aspectRatio.toFixed(2),
      totalCards,
      cardWidth,
      padding,
      availableWidth,
      calculatedOverlap: calculatedOverlap.toFixed(2),
      widthRatio: widthRatio.toFixed(2),
      visibleRatio: visibleRatio.toFixed(2),
      aspectRatioDeviation: aspectRatioDeviation.toFixed(2),
      maxOverlap: maxOverlap.toFixed(2),
      minOverlapRatio: minOverlapRatio.toFixed(2),
      minOverlap: minOverlap.toFixed(2),
      finalOverlap: finalOverlap.toFixed(2)
    });

    // 返回计算的重叠量，限制在合理范围内
    return finalOverlap;
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
   * 使用连续函数基于容器宽高比动态计算，实现平滑自适应
   * @param index - 卡牌索引
   * @param totalCards - 手牌总数
   * @returns 倾斜角度（度）
   */
  private calculateCardRotation(index: number, totalCards: number): number {
    // 获取容器尺寸
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const aspectRatio = containerWidth / containerHeight;
    
    // 基础角度范围：根据手牌数量动态调整
    // 手牌越多，每张牌的角度越小，保持整体扇形美观
    // 降低最大角度，避免在极端比例下过于分散
    const maxAngleRange = Math.min(24, totalCards * 3); // 降低最大角度从32到24
    
    // 根据宽高比动态调整角度范围
    // 使用连续函数而非分段判断，实现平滑过渡
    // 理想宽高比为 16:9 ≈ 1.78
    const idealAspectRatio = 1.78;
    const maxDeviation = 1.0; // 降低最大偏离值，使衰减更快
    
    // 计算偏离理想比例的程度（0 ~ 1）
    const deviation = Math.min(1, Math.abs(aspectRatio - idealAspectRatio) / maxDeviation);
    
    // 偏离越大，角度范围越小（使用更激进的衰减函数）
    // 角度范围在 40% ~ 100% 之间连续变化
    const angleScaleFactor = 1 - (deviation * 0.6); // 0.4 ~ 1.0，更激进的衰减
    const baseAngleRange = maxAngleRange * angleScaleFactor;
    
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
