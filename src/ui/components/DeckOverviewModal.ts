import { GameState } from '../../models/GameState';
import { Card } from '../../models/Card';
import { Suit, Rank } from '../../types/card';
import { CardManager, CardLocation } from '../../systems/CardManager';

export class DeckOverviewModal {
  private modal: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private container: HTMLElement | null = null;

  constructor(private gameState: GameState) {}

  /**
   * 显示卡组概览弹窗
   */
  show(): void {
    this.createModal();
    document.body.appendChild(this.overlay!);
    document.body.appendChild(this.container!);

    requestAnimationFrame(() => {
      this.overlay!.style.opacity = '1';
      this.modal!.style.opacity = '1';
      this.modal!.style.transform = 'scale(1)';
    });

    // 输出日志到浏览器控制台
    this.logCardDistribution();
  }

  /**
   * 关闭弹窗
   */
  close(): void {
    if (this.overlay && this.modal && this.container) {
      this.overlay.style.opacity = '0';
      this.modal.style.opacity = '0';
      this.modal.style.transform = 'scale(0.95)';

      setTimeout(() => {
        this.overlay?.remove();
        this.container?.remove();
        this.overlay = null;
        this.modal = null;
        this.container = null;
      }, 200);
    }
  }

  /**
   * 记录卡牌分布日志到浏览器控制台
   */
  private logCardDistribution(): void {
    const cardPile = this.gameState.cardPile;

    console.group('🃏 卡组概览');
    console.log('=== 卡牌分布 ===');
    console.log(`发牌堆: ${cardPile.deckCount} 张`);
    console.log(`手牌: ${cardPile.handCount} 张`);
    console.log(`弃牌堆: ${cardPile.discardCount} 张`);
    console.log(`总计: ${cardPile.totalCount} 张`);

    // 获取所有卡牌
    const allCards = cardPile.getAllCards();

    // 统计各点数数量
    const rankCounts: Record<string, number> = {};
    allCards.forEach(({ card }) => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });

    console.log('=== 点数统计 ===');
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    rankOrder.forEach(rank => {
      const count = rankCounts[rank] || 0;
      if (count > 0) {
        console.log(`${rank}: ${count} 张`);
      }
    });

    // 详细列出所有10的位置
    const tens = allCards.filter(({ card }) => card.rank === Rank.Ten);
    if (tens.length > 0) {
      console.log('=== 所有10的位置 ===');
      tens.forEach(({ card, location, handIndex }) => {
        const locText = location === 'hand' ? `手牌[${handIndex}]` : location === 'deck' ? '发牌堆' : '弃牌堆';
        console.log(`  ${card.toString()}: ${locText}`);
      });
    }

    // 详细列出所有卡牌位置
    console.log('=== 所有卡牌位置 ===');
    const deckCards = cardPile.deck.getCards();
    const handCards = cardPile.hand.getCards();
    const discardCards = cardPile.discard.getCards();

    console.log(`发牌堆 (${deckCards.length}张):`, deckCards.map(c => c.toString()).join(', '));
    console.log(`手牌 (${handCards.length}张):`, handCards.map(c => c.toString()).join(', '));
    console.log(`弃牌堆 (${discardCards.length}张):`, discardCards.map(c => c.toString()).join(', '));

    console.groupEnd();
  }

  /**
   * 创建弹窗
   */
  private createModal(): void {
    const cardPile = this.gameState.cardPile;

    // 创建遮罩层
    this.overlay = document.createElement('div');
    this.overlay.className = 'fixed inset-0 bg-black/70 transition-opacity duration-200';
    this.overlay.style.zIndex = '9999';
    this.overlay.style.opacity = '0';
    this.overlay.addEventListener('click', () => this.close());

    // 创建弹窗容器
    this.container = document.createElement('div');
    this.container.className = 'fixed inset-0 flex items-center justify-center p-4 pointer-events-none';
    this.container.style.zIndex = '10000';

    // 创建弹窗
    this.modal = document.createElement('div');
    this.modal.className = 'game-panel overflow-hidden flex flex-col transition-all duration-200 pointer-events-auto';
    this.modal.style.opacity = '0';
    this.modal.style.transform = 'scale(0.95)';
    this.modal.style.width = '100%';
    this.modal.style.maxWidth = '900px';
    this.modal.style.maxHeight = '85vh';

    const content = document.createElement('div');
    content.className = 'flex flex-col h-full';

    // 标题栏
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center p-4 border-b border-yellow-500/30';
    header.style.flexShrink = '0';
    header.innerHTML = `
      <div>
        <h2 class="text-2xl font-bold text-yellow-400">卡组概览</h2>
        <p class="text-gray-400 text-sm mt-1">
          <span class="text-blue-400">发牌堆: ${cardPile.deckCount}</span> | 
          <span class="text-green-400">手牌: ${cardPile.handCount}</span> | 
          <span class="text-red-400">弃牌堆: ${cardPile.discardCount}</span> | 
          <span class="text-yellow-400">总计: ${cardPile.totalCount}</span>
        </p>
      </div>
      <button class="text-gray-400 hover:text-white text-2xl transition-colors" id="close-deck-overview">&times;</button>
    `;

    // 内容区域
    const body = document.createElement('div');
    body.className = 'p-4 overflow-y-auto flex-1';
    body.style.minHeight = '0';
    body.style.maxHeight = 'calc(85vh - 80px)';

    // 发牌堆
    const deckSection = this.createLocationSection('发牌堆', cardPile.deck.getCards(), 'deck');
    body.appendChild(deckSection);

    // 手牌
    const handSection = this.createLocationSection('手牌', cardPile.hand.getCards(), 'hand');
    body.appendChild(handSection);

    // 弃牌堆
    const discardSection = this.createLocationSection('弃牌堆', cardPile.discard.getCards(), 'discard');
    body.appendChild(discardSection);

    content.appendChild(header);
    content.appendChild(body);
    this.modal.appendChild(content);
    this.container.appendChild(this.modal);

    // 绑定关闭按钮
    setTimeout(() => {
      const closeBtn = document.getElementById('close-deck-overview');
      closeBtn?.addEventListener('click', () => this.close());
    }, 0);

    // ESC键关闭
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  /**
   * 创建某个位置的卡牌区域
   */
  private createLocationSection(title: string, cards: readonly Card[], location: CardLocation): HTMLElement {
    const section = document.createElement('div');
    section.className = 'mb-6';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-2 mb-3';

    const locationColors: Record<CardLocation, string> = {
      deck: 'text-blue-400',
      hand: 'text-green-400',
      discard: 'text-red-400'
    };

    const locationIcons: Record<CardLocation, string> = {
      deck: '📚',
      hand: '🖐️',
      discard: '🗑️'
    };

    header.innerHTML = `
      <span class="text-xl">${locationIcons[location]}</span>
      <h3 class="text-lg font-bold ${locationColors[location]}">${title}</h3>
      <span class="text-gray-400 text-sm">(${cards.length} 张)</span>
    `;
    section.appendChild(header);

    if (cards.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'text-gray-500 text-sm italic';
      emptyMsg.textContent = '无卡牌';
      section.appendChild(emptyMsg);
      return section;
    }

    // 创建带滚动条的容器
    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'deck-cards-scroll';
    scrollContainer.style.maxHeight = 'min(200px, 25vh)';
    scrollContainer.style.overflowY = 'auto';
    scrollContainer.style.scrollbarWidth = 'thin';
    scrollContainer.style.scrollbarColor = 'rgba(251, 191, 36, 0.5) rgba(0, 0, 0, 0.3)';

    const cardsGrid = document.createElement('div');
    cardsGrid.className = 'grid grid-cols-10 gap-1';

    // 按点数排序
    const rankOrder = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const sortedCards = [...cards].sort((a, b) => {
      const aIndex = rankOrder.indexOf(a.rank);
      const bIndex = rankOrder.indexOf(b.rank);
      return aIndex - bIndex;
    });

    sortedCards.forEach(card => {
      const cardItem = document.createElement('div');
      cardItem.className = 'bg-black/30 rounded p-1 text-center text-xs';

      const suitColor = (card.suit === Suit.Hearts || card.suit === Suit.Diamonds) ? 'text-red-400' : 'text-gray-300';

      cardItem.innerHTML = `
        <div class="${suitColor}">${card.suit}</div>
        <div class="text-white">${card.rank}</div>
      `;

      cardsGrid.appendChild(cardItem);
    });

    scrollContainer.appendChild(cardsGrid);
    section.appendChild(scrollContainer);

    // 添加 Webkit 滚动条样式（只添加一次）
    if (!document.getElementById('deck-scroll-style')) {
      const style = document.createElement('style');
      style.id = 'deck-scroll-style';
      style.textContent = `
        .deck-cards-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .deck-cards-scroll::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        .deck-cards-scroll::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.5);
          border-radius: 4px;
        }
        .deck-cards-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.8);
        }
      `;
      document.head.appendChild(style);
    }

    return section;
  }
}
