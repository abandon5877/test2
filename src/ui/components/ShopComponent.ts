import { GameState } from '../../models/GameState';
import { Joker } from '../../models/Joker';
import { Consumable } from '../../models/Consumable';
import { CardComponent } from './CardComponent';
import { JOKER_RARITY_NAMES, JokerRarity, JokerEdition } from '../../types/joker';
import { CONSUMABLE_TYPE_NAMES } from '../../types/consumable';
import { HandRanksModal } from './HandRanksModal';
import { JokerOrderModal } from './JokerOrderModal';
import { DeckOverviewModal } from './DeckOverviewModal';
import { Modal, showConfirm } from './Modal';
import { JokerDetailModal } from './JokerDetailModal';
import { ConsumableDetailModal } from './ConsumableDetailModal';
import {
  type BoosterPack,
  type Voucher
} from '../../data/consumables';
import { Toast } from './Toast';
import { getRandomJoker } from '../../data/jokers';
import { getConsumableById } from '../../data/consumables';
import { Storage } from '../../utils/storage';
import { PokerHandType } from '../../types/pokerHands';
import { ConsumableHelper } from '../../utils/consumableHelper';

export interface ShopItem {
  id: string;
  type: 'joker' | 'consumable' | 'pack' | 'voucher';
  item: Joker | Consumable | BoosterPack | Voucher;
  cost: number;
  sold: boolean;
}

export interface ShopComponentCallbacks {
  onBuyItem?: (item: ShopItem) => void;
  onBuyPack?: (pack: BoosterPack) => void;
  onRefresh?: () => void;
  onNextRound?: () => void;
}

export class ShopComponent {
  private container: HTMLElement;
  private gameState: GameState;
  private callbacks: ShopComponentCallbacks;
  private selectedItemId: string | null = null;
  private handRanksModal: HandRanksModal;
  private jokerOrderModal: JokerOrderModal;
  private deckOverviewModal: DeckOverviewModal;
  private itemDetailModal: Modal | null = null;
  private jokerDetailModal: JokerDetailModal;
  private consumableDetailModal: ConsumableDetailModal;
  private consumableHelper: ConsumableHelper;

  /**
   * 获取刷新费用（从 gameState.shop 读取）
   */
  private get refreshCost(): number {
    return this.gameState.shop?.rerollCost ?? 5;
  }

  constructor(container: HTMLElement, gameState: GameState, callbacks: ShopComponentCallbacks = {}) {
    console.log('[ShopComponent.constructor] 创建商店组件');
    this.container = container;
    this.gameState = gameState;
    this.callbacks = callbacks;
    this.handRanksModal = new HandRanksModal(gameState.handLevelState);
    this.jokerOrderModal = new JokerOrderModal(gameState, () => this.render());
    this.deckOverviewModal = new DeckOverviewModal(gameState);
    this.itemDetailModal = new Modal();
    this.jokerDetailModal = JokerDetailModal.getInstance();
    this.consumableHelper = new ConsumableHelper(gameState, {
      onToast: (msg, type) => {
        if (type === 'success') Toast.success(msg);
        else if (type === 'warning') Toast.warning(msg);
        else Toast.error(msg);
      },
      onRender: () => this.render()
    });
    this.consumableDetailModal = ConsumableDetailModal.getInstance();
    console.log('[ShopComponent.constructor] gameState.shop:', gameState.shop);
    this.render();
    console.log('[ShopComponent.constructor] 商店组件创建完成');
  }

  /**
   * 更新游戏状态
   */
  setGameState(gameState: GameState): void {
    this.gameState = gameState;
    this.render();
  }

  /**
   * 获取商店商品列表
   * 直接从 gameState.shop 读取，不维护独立状态
   */
  private getShopItems(): ShopItem[] {
    if (this.gameState.shop && this.gameState.shop.items) {
      return this.gameState.shop.items.map(item => ({
        id: item.id,
        type: item.type,
        item: item.item as any,
        cost: item.currentPrice,
        sold: item.sold
      }));
    }
    return [];
  }

  /**
   * 刷新商店
   */
  refreshShop(): void {
    const result = this.gameState.rerollShop();
    if (result.success) {
      this.selectedItemId = null;
      this.render();
      this.callbacks.onRefresh?.();
    }
  }

  /**
   * 购买商品
   * 直接修改 gameState.shop.items 中的状态
   */
  buyItem(shopItem: ShopItem): boolean {
    console.log('[ShopComponent.buyItem] 开始购买流程', {
      itemId: shopItem.id,
      type: shopItem.type,
      cost: shopItem.cost,
      sold: shopItem.sold,
      currentMoney: this.gameState.money
    });

    if (shopItem.sold) {
      console.warn('[ShopComponent.buyItem] 购买失败：商品已售出');
      return false;
    }
    if (this.gameState.money < shopItem.cost) {
      console.warn('[ShopComponent.buyItem] 购买失败：金钱不足', {
        current: this.gameState.money,
        required: shopItem.cost
      });
      return false;
    }

    // 检查是否可以购买
    if (shopItem.type === 'joker') {
      if (this.gameState.getJokerCount() >= 5) {
        console.warn('[ShopComponent.buyItem] 购买失败：小丑牌槽位已满');
        Toast.warning('小丑牌槽位已满！');
        return false;
      }
    } else if (shopItem.type === 'consumable') {
      // 不在这里检查槽位，让 addConsumable 来决定是否可以添加
      // 这样负片消耗牌在槽位满时也可以购买
    }

    // 扣除金钱
    console.log('[ShopComponent.buyItem] 尝试扣除金钱:', shopItem.cost);
    if (this.gameState.spendMoney(shopItem.cost)) {
      console.log('[ShopComponent.buyItem] 金钱扣除成功，剩余:', this.gameState.money);

      // 直接修改 gameState.shop.items 中的对应商品状态
      const originalItem = this.gameState.shop?.items.find(i => i.id === shopItem.id);
      if (originalItem) {
        originalItem.sold = true;
        console.log('[ShopComponent.buyItem] 商品状态已标记为已售出:', shopItem.id);
      }

      // 添加物品到游戏状态
      if (shopItem.type === 'joker') {
        console.log('[ShopComponent.buyItem] 添加小丑牌到游戏状态');
        const success = this.gameState.addJoker(shopItem.item as Joker);
        if (!success) {
          // 如果添加失败，退还金钱并恢复商品状态
          console.warn('[ShopComponent.buyItem] 小丑牌添加失败，回滚操作');
          this.gameState.addMoney(shopItem.cost);
          if (originalItem) {
            originalItem.sold = false;
          }
          Toast.warning('小丑牌槽位已满！');
          return false;
        }
        console.log('[ShopComponent.buyItem] 小丑牌添加成功');
      } else if (shopItem.type === 'consumable') {
        console.log('[ShopComponent.buyItem] 添加消耗牌到游戏状态');
        const success = this.gameState.addConsumable(shopItem.item as Consumable);
        if (!success) {
          console.warn('[ShopComponent.buyItem] 消耗牌添加失败，回滚操作');
          this.gameState.addMoney(shopItem.cost);
          if (originalItem) {
            originalItem.sold = false;
          }
          Toast.warning('消耗牌槽位已满！');
          return false;
        }
        console.log('[ShopComponent.buyItem] 消耗牌添加成功');
      } else if (shopItem.type === 'pack') {
        // 卡包购买 - 触发开包回调
        const pack = shopItem.item as BoosterPack;
        console.log('[ShopComponent.buyItem] 购买卡包，准备触发开包回调:', {
          packId: pack.id,
          packName: pack.name,
          packType: pack.type,
          hasCallback: !!this.callbacks.onBuyPack
        });
        if (this.callbacks.onBuyPack) {
          console.log('[ShopComponent.buyItem] 调用 onBuyPack 回调');
          this.callbacks.onBuyPack(pack);
          console.log('[ShopComponent.buyItem] 卡包购买流程完成（不重新渲染商店）');
        } else {
          console.error('[ShopComponent.buyItem] 错误：onBuyPack 回调未定义！');
        }
        // 卡包购买后不重新渲染商店，因为开包界面会替换整个视图
        this.callbacks.onBuyItem?.(shopItem);
        this.selectedItemId = null;
        return true;
      } else if (shopItem.type === 'voucher') {
        // 折扣券购买 - 立即应用效果
        const voucher = shopItem.item as Voucher;
        console.log('[ShopComponent.buyItem] 使用折扣券:', voucher.name);
        this.gameState.applyVoucher(voucher.id);
        Toast.success(`已使用折扣券: ${voucher.name}`);
      }

      this.callbacks.onBuyItem?.(shopItem);
      this.selectedItemId = null;
      this.render();
      console.log('[ShopComponent.buyItem] 购买流程完成');
      return true;
    }

    console.warn('[ShopComponent.buyItem] 购买失败：金钱扣除失败');
    return false;
  }

  /**
   * 卖出小丑牌
   */
  sellJoker(index: number): void {
    const jokers = this.gameState.jokers as Joker[];
    if (index < 0 || index >= jokers.length) return;

    const joker = jokers[index];
    // 使用与JokerSystem.sellJoker相同的计算逻辑：向下取整，最低$1
    let sellPrice = Math.max(1, Math.floor(joker.cost / 2));

    // 租赁小丑只能卖$1
    if (joker.sticker === 'rental') {
      sellPrice = 1;
    }

    // 检查是否为永恒贴纸
    if (joker.sticker === 'eternal') {
      Toast.error('永恒小丑牌无法出售！');
      return;
    }

    showConfirm(
      '确认卖出',
      `确定要卖出 ${joker.name} 吗？\n\n卖出价格: $${sellPrice}`,
      () => {
        const result = this.gameState.sellJoker(index);
        if (result.success) {
          // 只刷新右侧区域，避免关闭开包界面
          this.refreshRightPanel();
          // 刷新左侧金钱显示
          this.refreshLeftPanelMoney();

          let message = `${joker.name} 已卖出，获得 $${result.sellPrice}！`;

          // 显示隐形小丑复制成功的消息
          if (result.copiedJokerId) {
            const copiedJoker = jokers.find(j => j.id === result.copiedJokerId);
            if (copiedJoker) {
              message += `\n隐形小丑复制了 ${copiedJoker.name}！`;
            }
          }

          Toast.success(message);
        } else {
          Toast.error(result.error || '卖出失败！');
        }
      }
    );
  }

  /**
   * 刷新右侧区域（小丑牌和消耗牌）
   * 用于卖出小丑牌后局部刷新，避免关闭开包界面
   */
  private refreshRightPanel(): void {
    const rightPanel = document.querySelector('.game-layout-right') as HTMLElement;
    if (rightPanel) {
      const newRightPanel = this.createRightPanel();
      newRightPanel.className = 'game-layout-right';
      rightPanel.replaceWith(newRightPanel);
    }
  }

  /**
   * 刷新左侧金钱显示
   */
  private refreshLeftPanelMoney(): void {
    const moneyElement = document.querySelector('.game-layout-left .text-green-400.font-bold.text-center') as HTMLElement;
    if (moneyElement) {
      moneyElement.textContent = `$${this.gameState.money}`;
    }
  }

  /**
   * 根据屏幕尺寸计算动态缩放值
   */
  private scaled(value: number): string {
    const baseScale = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    const scale = Math.max(0.3, Math.min(2.0, baseScale));
    return `${Math.round(value * scale)}px`;
  }

  /**
   * 计算按钮动态尺寸
   */
  private calculateButtonScale(): { padding: string; fontSize: string; gap: string } {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const minDimension = Math.min(viewportWidth, viewportHeight);

    const basePaddingX = 12;
    const basePaddingY = 8;
    const baseFontSize = 24;
    const baseGap = 8;

    const scale = Math.max(0.35, Math.min(2.0, minDimension / 720));

    return {
      padding: `${Math.round(basePaddingY * scale)}px ${Math.round(basePaddingX * scale)}px`,
      fontSize: `${Math.round(baseFontSize * scale)}px`,
      gap: `${Math.round(baseGap * scale)}px`
    };
  }

  /**
   * 计算卡牌重叠量 - 完全基于容器大小的响应式计算
   * 目标：让卡牌填满整个容器，充分利用空间
   * @param cardCount 卡牌数量
   * @param containerWidth 容器宽度（包含padding）
   * @param cardWidth 单张卡牌宽度
   * @returns 重叠量（像素）
   */
  private calculateOverlap(cardCount: number, containerWidth: number, cardWidth: number): number {
    if (cardCount <= 1) return 0;

    // jokers-area 的 padding-left 为 0，不需要减去 padding
    const availableWidth = Math.max(0, containerWidth);
    
    // 计算所有卡牌不重叠时的总宽度
    const totalCardsWidth = cardWidth * cardCount;
    
    // 如果所有卡牌不重叠也能放下，使用最小重叠（5%）
    if (totalCardsWidth <= availableWidth) {
      return cardWidth * 0.05;
    }

    // 需要重叠才能放下
    // 计算需要的重叠量，让最后一张牌刚好填满容器
    // 公式：第一张牌完整显示 + (n-1)张牌重叠显示 = 可用宽度
    // cardWidth + (cardCount - 1) * (cardWidth - overlap) = availableWidth
    // 解得：overlap = (totalCardsWidth - availableWidth) / (cardCount - 1)
    const requiredOverlap = (totalCardsWidth - availableWidth) / (cardCount - 1);
    
    // 限制重叠量：最小5%，最大70%（允许更紧密的排列以充分利用空间）
    const minOverlap = cardWidth * 0.05;
    const maxOverlap = cardWidth * 0.7;

    return Math.max(minOverlap, Math.min(requiredOverlap, maxOverlap));
  }

  /**
   * 渲染商店界面 - 使用与GameBoard一致的三栏布局
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg game-container';

    const buttonScale = this.calculateButtonScale();

    // 创建主布局容器 - 使用CSS Grid，与GameBoard一致
    const mainLayout = document.createElement('div');
    mainLayout.className = 'game-layout';

    // ===== 1. 左侧信息栏 =====
    const leftPanel = this.createLeftPanel();
    leftPanel.className = 'game-layout-left';
    mainLayout.appendChild(leftPanel);

    // ===== 2. 中间商品区域 =====
    const centerPanel = this.createCenterPanel();
    centerPanel.className = 'game-layout-center';
    mainLayout.appendChild(centerPanel);

    // ===== 3. 右侧持有物品区域 =====
    const rightPanel = this.createRightPanel();
    rightPanel.className = 'game-layout-right';
    mainLayout.appendChild(rightPanel);

    // ===== 4. 底部按钮区域 =====
    const bottomPanel = this.createBottomPanel();
    bottomPanel.className = 'game-layout-bottom';
    mainLayout.appendChild(bottomPanel);

    this.container.appendChild(mainLayout);
  }

  /**
   * 创建左侧信息栏
   */
  private createLeftPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-panel-column';
    panel.style.padding = this.scaled(4);
    panel.style.gap = this.scaled(3);

    // 底注
    const anteSection = document.createElement('div');
    anteSection.className = 'game-panel';
    anteSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(17)}">底注</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(27)}">${this.gameState.ante}</div>
    `;
    panel.appendChild(anteSection);

    // 关卡信息
    const roundSection = document.createElement('div');
    roundSection.className = 'game-panel';
    roundSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(17)}">当前</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(21)}">商店阶段</div>
    `;
    panel.appendChild(roundSection);

    // 金币
    const moneySection = document.createElement('div');
    moneySection.className = 'game-panel';
    moneySection.id = 'shop-money-section';
    moneySection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(17)}">金币</div>
      <div class="text-yellow-400 font-bold text-center" style="font-size: ${this.scaled(27)}">$${this.gameState.money}</div>
    `;
    panel.appendChild(moneySection);

    // 刷新费用
    const refreshSection = document.createElement('div');
    refreshSection.className = 'game-panel';
    refreshSection.innerHTML = `
      <div class="text-gray-400 text-center" style="font-size: ${this.scaled(17)}">刷新费用</div>
      <div class="text-blue-400 font-bold text-center" style="font-size: ${this.scaled(25)}">$${this.refreshCost}</div>
    `;
    panel.appendChild(refreshSection);

    return panel;
  }

  /**
   * 根据容器宽度和真实卡片宽度计算商品列数
   */
  private calculateGridColumns(containerWidth: number, cardWidth: number): number {
    const gap = 12;
    const padding = 16;
    const availableWidth = containerWidth - padding;

    // 计算可以容纳的列数
    const columns = Math.floor((availableWidth + gap) / (cardWidth + gap));

    // 至少2列，最多5列
    return Math.max(2, Math.min(5, columns));
  }

  /**
   * 创建中间商品区域
   */
  private createCenterPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = this.scaled(8);
    panel.style.padding = this.scaled(8);
    panel.style.position = 'relative'; // 添加相对定位，用于开包界面
    panel.className = 'shop-center-panel';
    panel.id = 'shop-center-panel';

    // 商品标题
    const itemsTitle = document.createElement('h2');
    itemsTitle.style.fontSize = this.scaled(24);
    itemsTitle.className = 'font-bold text-yellow-400 text-center shrink-0';
    itemsTitle.textContent = '🏪 商店商品（点击查看详情）';
    panel.appendChild(itemsTitle);

    // 商品网格
    const itemsGrid = document.createElement('div');
    itemsGrid.className = 'shop-items-grid overflow-y-auto flex-1';
    itemsGrid.style.display = 'grid';
    itemsGrid.style.gap = this.scaled(12);
    itemsGrid.style.padding = this.scaled(12);
    itemsGrid.style.justifyContent = 'center';

    const shopItems = this.getShopItems();
    shopItems.forEach(shopItem => {
      const itemCard = this.createUnifiedShopItemCard(shopItem);
      itemsGrid.appendChild(itemCard);
    });

    panel.appendChild(itemsGrid);

    // 使用 ResizeObserver 监听宽度变化，动态调整列数（基于真实卡片宽度）
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        // 获取第一个卡片的真实宽度
        const firstCard = itemsGrid.querySelector('.joker-card') as HTMLElement;
        if (firstCard) {
          const cardRect = firstCard.getBoundingClientRect();
          const cardWidth = cardRect.width;
          const columns = this.calculateGridColumns(containerWidth, cardWidth);
          itemsGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, auto))`;
        }
      }
    });

    // 延迟观察，确保 panel 和卡片已经渲染
    setTimeout(() => {
      if (panel.isConnected) {
        resizeObserver.observe(panel);
      }
    }, 0);

    return panel;
  }

  /**
   * 获取中间商品区域容器（用于开包界面）
   */
  getCenterPanel(): HTMLElement | null {
    return document.getElementById('shop-center-panel');
  }

  /**
   * 创建统一的商店商品卡�?
   * 使用紧凑�?joker-card 样式，价格直接显示在卡片�?
   */
  private createUnifiedShopItemCard(shopItem: ShopItem): HTMLElement {
    const card = document.createElement('div');
    card.className = `joker-card common ${shopItem.sold ? 'sold' : ''}`;
    card.style.cursor = shopItem.sold ? 'not-allowed' : 'pointer';
    // 确保卡片使用正确的flex布局
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.position = 'relative';

    if (!shopItem.sold) {
      card.addEventListener('click', () => this.handleSelectItem(shopItem));
    }

    // 图标
    const icon = document.createElement('div');
    icon.className = 'joker-icon';
    icon.style.flex = '0 0 auto';

    // 名称 - 使用比描述更大的字体
    const name = document.createElement('div');
    name.className = 'joker-name';
    name.style.flex = '0 0 auto';
    name.style.marginBottom = '2px';
    name.style.fontSize = 'clamp(11px, 2.2vmin, 13px)'; // 比描述大2px左右

    // 描述 - 默认隐藏，空间足够时显示
    const description = document.createElement('div');
    description.className = 'joker-description';
    description.style.cssText = `
      font-size: clamp(9px, 1.8vmin, 10px);
      text-align: center;
      color: rgba(255, 255, 255, 0.8);
      flex: 0 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0px;
      overflow: hidden;
      margin-bottom: 2px;
    `;

    // 价格标签 - 使用 joker-cost 样式
    const priceTag = document.createElement('div');
    priceTag.className = 'joker-cost';
    priceTag.style.flex = '0 0 auto';
    priceTag.style.alignSelf = 'flex-end';
    const canAfford = this.gameState.money >= shopItem.cost;
    if (!canAfford && !shopItem.sold) {
      priceTag.style.background = 'linear-gradient(145deg, #ef4444 0%, #dc2626 100%)';
      priceTag.style.color = '#fff';
    }

    if (shopItem.sold) {
      icon.textContent = '✓';
      name.textContent = '已售罄';
      card.style.opacity = '0.5';
    } else {
      // 根据类型设置内容和样式
      if (shopItem.type === 'joker') {
        const joker = shopItem.item as Joker;
        icon.textContent = '🤡';
        name.textContent = joker.name;
        description.textContent = joker.description;
        // 根据稀有度和版本设置边框颜色
        const editionClass = joker.edition && joker.edition !== 'none' ? joker.edition : '';
        card.className = `joker-card ${joker.rarity} ${editionClass}`.trim();
        // 重新应用样式
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.position = 'relative';
      } else if (shopItem.type === 'consumable') {
        const consumable = shopItem.item as Consumable;
        icon.textContent = consumable.type === 'tarot' ? '🔮' : consumable.type === 'planet' ? '🪐' : consumable.type === 'spectral' ? '👻' : '🎴';
        name.textContent = consumable.name;
        description.textContent = consumable.description;
      } else if (shopItem.type === 'pack') {
        const pack = shopItem.item as BoosterPack;
        icon.textContent = '📦';
        name.textContent = pack.name;
        description.textContent = pack.description || `${pack.size}张卡牌`;
      } else if (shopItem.type === 'voucher') {
        const voucher = shopItem.item as Voucher;
        icon.textContent = '🎫';
        name.textContent = voucher.name;
        description.textContent = voucher.description;
      }

      priceTag.textContent = `$${shopItem.cost}`;
    }

    card.appendChild(icon);
    card.appendChild(name);
    if (!shopItem.sold) {
      card.appendChild(description);
      card.appendChild(priceTag);
    }

    // 动态调整字体大小以适应容器
    const adjustFontSize = () => {
      if (description.style.display === 'none') return;
      
      let fontSize = 10; // 初始字体大小
      description.style.fontSize = `${fontSize}px`;
      
      // 如果文字溢出，逐步减小字体大小
      while (fontSize > 6 && (description.scrollHeight > description.clientHeight || description.scrollWidth > description.clientWidth)) {
        fontSize -= 0.5;
        description.style.fontSize = `${fontSize}px`;
      }
    };

    // 使用 ResizeObserver 根据卡片高度决定是否显示描述，并调整字体大小
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cardHeight = entry.contentRect.height;
        // 如果卡片高度小于 100px，隐藏描述
        if (cardHeight < 100) {
          description.style.display = 'none';
        } else {
          description.style.display = 'flex';
          // 延迟调整字体大小，确保布局已完成
          setTimeout(adjustFontSize, 0);
        }
      }
    });
    resizeObserver.observe(card);

    // 初始调整字体大小
    setTimeout(adjustFontSize, 0);

    return card;
  }

  /**
   * 创建右侧持有物品区域
   */
  private createRightPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'game-panel-column';
    panel.style.padding = `${this.scaled(8)} ${this.scaled(16)} ${this.scaled(8)} ${this.scaled(8)}`;
    panel.style.gap = this.scaled(8);

    // 小丑牌区�?
    const jokersSection = document.createElement('div');
    jokersSection.className = 'game-panel flex-1 flex flex-col min-h-0';
    jokersSection.style.maxHeight = '50%';

    const jokersTitle = document.createElement('h3');
    jokersTitle.style.fontSize = this.scaled(19);
    jokersTitle.className = 'font-bold text-yellow-400 mb-2 text-center shrink-0';
    jokersTitle.textContent = `🤡 小丑牌 (${this.gameState.getJokerCount()}/5)`;
    jokersSection.appendChild(jokersTitle);

    const jokersContainer = document.createElement('div');
    jokersContainer.className = 'jokers-area';
    jokersContainer.id = 'shop-jokers-area';
    jokersContainer.style.flex = '1';
    jokersContainer.style.minHeight = '0';

    const jokers = this.gameState.jokers as Joker[];
    if (jokers.length === 0) {
      jokersContainer.innerHTML = `<div class="text-gray-500 text-center flex items-center justify-center h-full" style="font-size: ${this.scaled(14)}">暂无小丑牌</div>`;
    } else {
      const jokerCards: HTMLElement[] = [];
      jokers.forEach((joker, index) => {
        const jokerCard = CardComponent.renderJokerCard({
          id: joker.id,
          name: joker.name,
          description: joker.description,
          rarity: joker.rarity,
          cost: joker.cost,
          disabled: joker.disabled,
          faceDown: joker.faceDown
        });

        jokerCard.style.cursor = jokers.length > 1 ? 'grab' : 'pointer';
        jokerCard.draggable = jokers.length > 1;
        jokerCard.dataset.index = String(index);

        // 点击显示详情弹窗（包含卖出按钮）
        jokerCard.addEventListener('click', (e) => {
          if (this.draggedJokerIndex !== null) return;
          this.showJokerDetailModal(joker, index);
        });

        if (jokers.length > 1) {
          jokerCard.addEventListener('dragstart', (e) => this.handleJokerDragStart(e, index));
          jokerCard.addEventListener('dragend', (e) => this.handleJokerDragEnd(e));
          jokerCard.addEventListener('dragover', (e) => this.handleJokerDragOver(e));
          jokerCard.addEventListener('drop', (e) => this.handleJokerDrop(e, index));
          jokerCard.addEventListener('dragenter', (e) => this.handleJokerDragEnter(e));
          jokerCard.addEventListener('dragleave', (e) => this.handleJokerDragLeave(e));
        }

        jokerCards.push(jokerCard);
        jokersContainer.appendChild(jokerCard);
      });

      // 使用 ResizeObserver 在容器大小确定后计算重叠量
      const applyJokerOverlap = () => {
        const containerWidth = jokersContainer.clientWidth;
        // 从实际渲染的卡片获取宽度（使用getBoundingClientRect获取更准确的外部宽度）
        const cardRect = jokerCards[0]?.getBoundingClientRect();
        const cardWidth = cardRect?.width || 90;
        if (containerWidth > 0 && cardWidth > 0) {
          const overlap = this.calculateOverlap(jokers.length, containerWidth, cardWidth);
          jokerCards.forEach((card, index) => {
            if (index > 0) {
              card.style.marginLeft = `-${overlap}px`;
            }
          });
        }
      };

      // 立即尝试计算（如果容器已渲染）
      applyJokerOverlap();

      // 使用 ResizeObserver 监听容器大小变化
      const resizeObserver = new ResizeObserver(() => {
        applyJokerOverlap();
      });
      resizeObserver.observe(jokersContainer);
    }
    jokersSection.appendChild(jokersContainer);
    panel.appendChild(jokersSection);

    // 消耗牌区域
    const consumablesSection = document.createElement('div');
    consumablesSection.className = 'game-panel flex-1 flex flex-col min-h-0';
    consumablesSection.style.maxHeight = '45%';

    const consumablesTitle = document.createElement('h3');
    consumablesTitle.style.fontSize = this.scaled(19);
    consumablesTitle.className = 'font-bold text-purple-400 mb-2 text-center shrink-0';
    consumablesTitle.textContent = `🎴 消耗牌 (${this.gameState.getConsumableCount()}/${this.gameState.getMaxConsumableSlots()})`;
    consumablesSection.appendChild(consumablesTitle);

    const consumablesContainer = document.createElement('div');
    consumablesContainer.className = 'consumables-area';
    consumablesContainer.id = 'shop-consumables-area';
    consumablesContainer.style.flex = '1';
    consumablesContainer.style.minHeight = '0';

    const consumables = this.gameState.consumables as Consumable[];
    if (consumables.length === 0) {
      consumablesContainer.innerHTML = `<div class="text-gray-500 text-center flex items-center justify-center h-full" style="font-size: ${this.scaled(14)}">暂无消耗牌</div>`;
    } else {
      const consumableCards: HTMLElement[] = [];
      consumables.forEach((consumable, index) => {
        const consumableCard = CardComponent.renderConsumableCard({
          id: consumable.id,
          name: consumable.name,
          description: consumable.description,
          type: consumable.type,
          cost: consumable.cost
        }, false);

        consumableCard.style.cursor = 'pointer';

        // 点击显示详情弹窗
        consumableCard.addEventListener('click', () => {
          this.showConsumableDetailModal(consumable, index);
        });

        consumableCards.push(consumableCard);
        consumablesContainer.appendChild(consumableCard);
      });

      // 使用 ResizeObserver 在容器大小确定后计算重叠量
      const applyConsumableOverlap = () => {
        const containerWidth = consumablesContainer.clientWidth;
        // 从实际渲染的卡片获取宽度（使用getBoundingClientRect获取更准确的外部宽度）
        const cardRect = consumableCards[0]?.getBoundingClientRect();
        const cardWidth = cardRect?.width || 90;
        if (containerWidth > 0 && cardWidth > 0) {
          const overlap = this.calculateOverlap(consumables.length, containerWidth, cardWidth);
          consumableCards.forEach((card, index) => {
            if (index > 0) {
              card.style.marginLeft = `-${overlap}px`;
            }
          });
        }
      };

      // 立即尝试计算（如果容器已渲染）
      applyConsumableOverlap();

      // 使用 ResizeObserver 监听容器大小变化
      const resizeObserver = new ResizeObserver(() => {
        applyConsumableOverlap();
      });
      resizeObserver.observe(consumablesContainer);
    }
    consumablesSection.appendChild(consumablesContainer);
    panel.appendChild(consumablesSection);

    return panel;
  }

  /**
   * 显示小丑牌详情弹窗（包含卖出按钮�?
   */
  private showJokerDetailModal(joker: Joker, index: number): void {
    this.jokerDetailModal.show({
      joker,
      index,
      showSellButton: true,
      onSell: (idx) => this.sellJoker(idx)
    });
  }

  /**
   * 切换消耗牌展开状�?
   */
  private toggleConsumableExpand(clickedElement: HTMLElement): void {
    const container = document.getElementById('shop-consumables-area');
    if (!container) return;
    
    const allCards = container.querySelectorAll('.consumable-card-wrapper');
    const isExpanded = clickedElement.classList.contains('expanded');
    
    allCards.forEach(card => {
      card.classList.remove('expanded');
    });
    
    if (!isExpanded) {
      clickedElement.classList.add('expanded');
    }
  }

  /**
   * 创建底部按钮区域
   */
  private createBottomPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.style.display = 'flex';
    panel.style.justifyContent = 'center';
    panel.style.alignItems = 'center';
    panel.style.padding = `${this.scaled(8)} ${this.scaled(16)}`;
    panel.style.gap = this.scaled(16);
    panel.style.width = '100%';
    panel.style.boxSizing = 'border-box';

    const buttonScale = this.calculateButtonScale();

    const deckOverviewBtn = document.createElement('button');
    deckOverviewBtn.className = 'game-btn game-btn-secondary';
    deckOverviewBtn.style.fontSize = buttonScale.fontSize;
    deckOverviewBtn.style.padding = buttonScale.padding;
    deckOverviewBtn.style.flex = '1 1 0';
    deckOverviewBtn.style.minWidth = '0';
    deckOverviewBtn.style.whiteSpace = 'nowrap';
    deckOverviewBtn.style.overflow = 'hidden';
    deckOverviewBtn.style.textOverflow = 'ellipsis';
    deckOverviewBtn.innerHTML = '🃏 卡组';
    deckOverviewBtn.addEventListener('click', () => this.deckOverviewModal.show());
    panel.appendChild(deckOverviewBtn);

    const handRanksBtn = document.createElement('button');
    handRanksBtn.className = 'game-btn game-btn-secondary';
    handRanksBtn.style.fontSize = buttonScale.fontSize;
    handRanksBtn.style.padding = buttonScale.padding;
    handRanksBtn.style.flex = '1 1 0';
    handRanksBtn.style.minWidth = '0';
    handRanksBtn.style.whiteSpace = 'nowrap';
    handRanksBtn.style.overflow = 'hidden';
    handRanksBtn.style.textOverflow = 'ellipsis';
    handRanksBtn.innerHTML = '📋 牌型';
    handRanksBtn.addEventListener('click', () => this.handRanksModal.show());
    panel.appendChild(handRanksBtn);

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'game-btn game-btn-secondary';
    refreshBtn.id = 'shop-refresh-btn';
    refreshBtn.style.fontSize = buttonScale.fontSize;
    refreshBtn.style.padding = buttonScale.padding;
    refreshBtn.style.flex = '1 1 0';
    refreshBtn.style.minWidth = '0';
    refreshBtn.style.whiteSpace = 'nowrap';
    refreshBtn.style.overflow = 'hidden';
    refreshBtn.style.textOverflow = 'ellipsis';
    refreshBtn.innerHTML = `🔄 刷新`;
    refreshBtn.disabled = this.gameState.money < this.refreshCost;
    refreshBtn.addEventListener('click', () => this.handleRefresh());
    panel.appendChild(refreshBtn);

    const nextBtn = document.createElement('button');
    nextBtn.className = 'game-btn game-btn-primary';
    nextBtn.style.fontSize = buttonScale.fontSize;
    nextBtn.style.padding = buttonScale.padding;
    nextBtn.style.flex = '1 1 0';
    nextBtn.style.minWidth = '0';
    nextBtn.style.whiteSpace = 'nowrap';
    nextBtn.style.overflow = 'hidden';
    nextBtn.style.textOverflow = 'ellipsis';
    nextBtn.textContent = '下一关';
    nextBtn.addEventListener('click', () => this.handleNextRound());
    panel.appendChild(nextBtn);

    return panel;
  }

  /**
   * 显示物品详情弹窗
   */
  private showItemDetailModal(shopItem: ShopItem): void {
    const content = this.buildItemDetailContent(shopItem);
    
    this.itemDetailModal?.show({
      title: this.getItemName(shopItem),
      content: content,
      type: 'info',
      showConfirm: true,
      showCancel: true,
      confirmText: '购买',
      cancelText: '关闭',
      onConfirm: () => {
        if (!shopItem.sold && this.gameState.money >= shopItem.cost) {
          this.buyItem(shopItem);
        } else if (this.gameState.money < shopItem.cost) {
          Toast.warning('金钱不足！');
        }
      }
    });
  }

  /**
   * 构建物品详情内容
   */
  private buildItemDetailContent(shopItem: ShopItem): string {
    const typeLabel = this.getItemTypeLabel(shopItem);
    const description = this.getItemDescription(shopItem);
    const cost = shopItem.cost;
    const canAfford = this.gameState.money >= cost;
    
    return `
【类型】${typeLabel}

【效果说明】
${description}

【价格】${canAfford ? '💰' : '❌'} $${cost}${canAfford ? '' : ' (金钱不足)'}
    `.trim();
  }

  /**
   * 处理选择物品
   */
  private handleSelectItem(shopItem: ShopItem): void {
    if (shopItem.sold) return;
    this.selectedItemId = shopItem.id;
    this.showItemDetailModal(shopItem);
  }

  /**
   * 处理刷新
   */
  private handleRefresh(): void {
    if (this.gameState.money < this.refreshCost) {
      Toast.warning('金钱不足！');
      return;
    }

    showConfirm(
      '确认刷新',
      `确定要花费 $${this.refreshCost} 刷新商店？`,
      () => this.refreshShop()
    );
  }

  /**
   * 处理下一关
   */
  private handleNextRound(): void {
    showConfirm(
      '确认进入下一关',
      '确定要进入下一关吗?',
      () => this.callbacks.onNextRound?.()
    );
  }

  /**
   * 获取物品名称
   */
  private getItemName(shopItem: ShopItem): string {
    if (shopItem.type === 'joker') {
      return (shopItem.item as Joker).name;
    } else if (shopItem.type === 'consumable') {
      return (shopItem.item as Consumable).name;
    } else if (shopItem.type === 'pack') {
      return (shopItem.item as { name: string }).name;
    } else if (shopItem.type === 'voucher') {
      return (shopItem.item as { name: string }).name;
    }
    return '未知物品';
  }

  /**
   * 获取物品类型标签
   */
  private getItemTypeLabel(shopItem: ShopItem): string {
    switch (shopItem.type) {
      case 'joker':
        const rarity = (shopItem.item as Joker).rarity;
        return `小丑牌 - ${JOKER_RARITY_NAMES[rarity] || rarity}`;
      case 'consumable':
        const type = (shopItem.item as Consumable).type;
        return CONSUMABLE_TYPE_NAMES[type] || type;
      case 'pack':
        return '卡包';
      case 'voucher':
        return '优惠券';
      default:
        return '未知类型';
    }
  }

  /**
   * 获取物品描述
   */
  private getItemDescription(shopItem: ShopItem): string {
    if (shopItem.type === 'joker') {
      return (shopItem.item as Joker).description;
    } else if (shopItem.type === 'consumable') {
      return (shopItem.item as Consumable).description;
    } else if (shopItem.type === 'pack') {
      return (shopItem.item as { description: string }).description;
    } else if (shopItem.type === 'voucher') {
      return (shopItem.item as { description: string }).description;
    }
    return '';
  }

  // ========== 小丑牌拖拽排�?==========
  private draggedJokerIndex: number | null = null;

  private handleJokerDragStart(e: DragEvent, index: number): void {
    this.draggedJokerIndex = index;
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '0.5';
    target.style.cursor = 'grabbing';
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  private handleJokerDragEnd(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.style.opacity = '1';
    target.style.cursor = 'grab';
    this.draggedJokerIndex = null;
    document.querySelectorAll('[data-index]').forEach(el => {
      (el as HTMLElement).style.transform = '';
      (el as HTMLElement).style.border = '';
    });
  }

  private handleJokerDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private handleJokerDragEnter(e: DragEvent): void {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    if (this.draggedJokerIndex !== null && this.draggedJokerIndex !== Number(target.dataset.index)) {
      target.style.transform = 'scale(1.02)';
      target.style.border = '2px solid #fbbf24';
    }
  }

  private handleJokerDragLeave(e: DragEvent): void {
    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  private handleJokerDrop(e: DragEvent, targetIndex: number): void {
    e.preventDefault();
    const fromIndex = this.draggedJokerIndex;
    if (fromIndex === null || fromIndex === targetIndex) return;

    const success = this.gameState.getJokerSlots().swapJokers(fromIndex, targetIndex);
    if (success) {
      this.render();
    }

    const target = e.currentTarget as HTMLElement;
    target.style.transform = '';
    target.style.border = '';
  }

  // ========== 消耗牌详情弹窗 ==========
  private showConsumableDetailModal(consumable: Consumable, index: number): void {
    this.consumableDetailModal.show({
      consumable,
      index,
      onUse: (idx) => this.handleUseConsumable(idx),
      onSell: (idx) => this.handleSellConsumable(idx)
    });
  }

  // ========== 消耗牌使用 ==========
  private handleUseConsumable(index: number): void {
    const success = this.consumableHelper.useConsumable(index);
    if (success) {
      Storage.autoSave(this.gameState);
    }
  }

  // ========== 消耗牌卖出 ==========
  private handleSellConsumable(index: number): void {
    const result = this.gameState.sellConsumable(index);

    if (result.success) {
      // 只刷新右侧区域，避免关闭开包界面
      this.refreshRightPanel();
      // 刷新左侧金钱显示
      this.refreshLeftPanelMoney();

      Toast.success(`消耗牌已卖出，获得 $${result.sellPrice}！`);
    } else {
      Toast.error(result.error || '卖出失败');
    }
  }
}
