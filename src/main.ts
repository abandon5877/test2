import './style.css';
import { GameState } from './models/GameState';
import { GamePhase, BlindType } from './types/game';
import { GameBoard } from './ui/components/GameBoard';
import { BlindSelect } from './ui/components/BlindSelect';
import { ShopComponent } from './ui/components/ShopComponent';
import { OpenPackComponent } from './ui/components/OpenPackComponent';
import { type BoosterPack } from './data/consumables';
import { Joker } from './models/Joker';
import { Consumable } from './models/Consumable';
import { Card } from './models/Card';
import { Shop } from './models/Shop';
import { Storage, hasSave, load, restoreGameState, deleteSave } from './utils/storage';
import { showAlert, showConfirm } from './ui/components/Modal';
import { ScaleContainer } from './ui/components/ScaleContainer';
import { Toast } from './ui/components/Toast';
import { Suit, Rank } from './types/card';
import { getRandomJokers } from './data/jokers';
import { getRandomConsumables } from './data/consumables';

class Game {
  private gameState: GameState;
  private container: HTMLElement;
  private currentComponent: GameBoard | BlindSelect | ShopComponent | null = null;
  private scaleContainer: ScaleContainer | null = null;

  constructor() {
    this.container = document.getElementById('app')!;
    this.gameState = new GameState();
    this.showMainMenu();
  }

  /**
   * 显示主菜单 - 使用 viewport 单位实现流体式响应布局
   */
  private showMainMenu(): void {
    this.container.innerHTML = '';
    // 使用 viewport 单位确保内容适应屏幕大小，允许滚动
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center justify-center p-[2vw] overflow-y-auto';

    // 内容包装器 - 限制最大宽度并居中
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex flex-col items-center w-full max-w-2xl';

    // 标题 - 使用 clamp 限制字体大小范围，防止越界
    const title = document.createElement('h1');
    title.style.fontSize = 'clamp(1.5rem, 6vw, 3rem)';  // 最小 24px, 动态 6vw, 最大 48px
    title.className = 'font-bold text-yellow-400 mb-[-2vh] animate-float';
    title.textContent = '🃏 Balatro';
    title.style.wordBreak = 'break-word';
    title.style.textAlign = 'center';
    contentWrapper.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.25rem)';  // 最小 14px, 动态 2.5vw, 最大 20px
    subtitle.className = 'text-gray-400 mb-[3vh]';
    subtitle.textContent = '扑克肉鸽卡牌游戏';
    contentWrapper.appendChild(subtitle);

    // 按钮容器 - 使用 viewport 单位限制宽度
    const buttonContainer = document.createElement('div');
    buttonContainer.style.width = 'min(80vw, 320px)';  // 取 80vw 和 320px 中较小值
    buttonContainer.style.gap = 'clamp(8px, 2vh, 16px)';  // 动态间距
    buttonContainer.className = 'flex flex-col';

    // 继续游戏按钮（如果有存档）
    if (hasSave()) {
      const continueBtn = document.createElement('button');
      continueBtn.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.125rem)';
      continueBtn.style.padding = 'clamp(8px, 1.8vh, 14px) clamp(16px, 4vw, 28px)';
      continueBtn.className = 'game-btn game-btn-primary w-full';
      continueBtn.textContent = '继续游戏';
      continueBtn.addEventListener('click', () => this.continueGame());
      buttonContainer.appendChild(continueBtn);
    }

    // 开始新游戏按钮
    const newGameBtn = document.createElement('button');
    newGameBtn.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.125rem)';
    newGameBtn.style.padding = 'clamp(8px, 1.8vh, 14px) clamp(16px, 4vw, 28px)';
    newGameBtn.className = 'game-btn game-btn-secondary w-full';
    newGameBtn.textContent = '开始新游戏';
    newGameBtn.addEventListener('click', () => this.startNewGame());
    buttonContainer.appendChild(newGameBtn);

    // 规则说明按钮
    const rulesBtn = document.createElement('button');
    rulesBtn.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.125rem)';
    rulesBtn.style.padding = 'clamp(8px, 1.8vh, 14px) clamp(16px, 4vw, 28px)';
    rulesBtn.className = 'game-btn game-btn-secondary w-full';
    rulesBtn.textContent = '规则说明';
    rulesBtn.addEventListener('click', () => this.showRules());
    buttonContainer.appendChild(rulesBtn);

    // 全屏按钮
    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.style.fontSize = 'clamp(0.875rem, 2.5vw, 1.125rem)';
    fullscreenBtn.style.padding = 'clamp(8px, 1.8vh, 14px) clamp(16px, 4vw, 28px)';
    fullscreenBtn.style.marginTop = 'clamp(8px, 2vh, 16px)';
    fullscreenBtn.className = 'game-btn w-full';
    fullscreenBtn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
    fullscreenBtn.style.color = '#ffffff';
    fullscreenBtn.style.border = '2px solid #fbbf24';
    fullscreenBtn.textContent = document.fullscreenElement ? '📴 退出全屏' : '🔳 全屏模式';
    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen(fullscreenBtn));
    buttonContainer.appendChild(fullscreenBtn);

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', () => {
      fullscreenBtn.textContent = document.fullscreenElement ? '📴 退出全屏' : '🔳 全屏模式';
    });

    // 删除存档按钮（如果有存档）
    if (hasSave()) {
      const deleteSaveBtn = document.createElement('button');
      deleteSaveBtn.style.fontSize = 'clamp(0.75rem, 2vw, 0.875rem)';
      deleteSaveBtn.style.padding = 'clamp(6px, 1.5vh, 10px) clamp(12px, 3vw, 20px)';
      deleteSaveBtn.style.marginTop = 'clamp(12px, 3vh, 24px)';
      deleteSaveBtn.className = 'game-btn game-btn-danger w-full';
      deleteSaveBtn.textContent = '删除存档';
      deleteSaveBtn.addEventListener('click', () => this.handleDeleteSave());
      buttonContainer.appendChild(deleteSaveBtn);
    }

    contentWrapper.appendChild(buttonContainer);

    // 版本信息
    const version = document.createElement('p');
    version.style.marginTop = 'clamp(16px, 4vh, 32px)';
    version.className = 'text-gray-600 text-sm';
    version.textContent = 'v1.0.0';
    contentWrapper.appendChild(version);

    this.container.appendChild(contentWrapper);
  }

  /**
   * 开始新游戏
   */
  private startNewGame(): void {
    // 如果有存档，先确认是否覆盖
    if (hasSave()) {
      showConfirm(
        '确认开始新游戏？',
        '当前已有游戏存档，开始新游戏将覆盖现有进度，此操作不可恢复。',
        () => {
          // 用户确认，执行新游戏逻辑
          this.doStartNewGame();
        }
      );
    } else {
      // 没有存档，直接开始
      this.doStartNewGame();
    }
  }

  /**
   * 执行开始新游戏的具体逻辑
   */
  private doStartNewGame(): void {
    // 删除旧存档
    deleteSave();
    
    // 初始化新游戏
    this.gameState = new GameState();
    this.gameState.startNewGame();
    
    // 进入关卡选择
    this.showBlindSelect();
  }

  /**
   * 继续游戏
   */
  private continueGame(): void {
    const saveData = load();
    if (saveData) {
      this.gameState = restoreGameState(saveData);
      this.enterGamePhase();
    } else {
      showAlert('错误', '存档加载失败', 'error');
      this.showMainMenu();
    }
  }

  /**
   * 进入对应的游戏阶段
   */
  private enterGamePhase(): void {
    switch (this.gameState.phase) {
      case GamePhase.BLIND_SELECT:
        this.showBlindSelect();
        break;
      case GamePhase.PLAYING:
        this.showGameBoard();
        break;
      case GamePhase.SHOP:
        // 确保商店存在（处理旧存档或存档中无商店数据的情况）
        if (!this.gameState.shop) {
          console.log('[Game.enterGamePhase] 进入商店阶段但 gameState.shop 为 null，创建新商店');
          this.gameState.shop = new Shop();
        }
        this.showShop();
        break;
      case GamePhase.GAME_OVER:
        this.showGameOver();
        break;
      default:
        this.showBlindSelect();
    }
  }

  /**
   * 显示关卡选择界面
   */
  private showBlindSelect(): void {
    this.currentComponent = new BlindSelect(this.container, this.gameState, {
      onSelectBlind: (blindType) => this.handleBlindSelect(blindType),
      onSkipBlind: () => this.handleSkipBlind()
    });
    
    // 自动保存
    Storage.autoSave(this.gameState);
  }

  /**
   * 显示游戏主界面
   */
  private showGameBoard(): void {
    this.currentComponent = new GameBoard(this.container, this.gameState, {
      onPlayHand: () => this.handlePlayHand(),
      onDiscard: () => this.handleDiscard(),
      onSortByRank: () => this.handleSortByRank(),
      onSortBySuit: () => this.handleSortBySuit(),
      onEnterShop: () => this.handleEnterShop(),
      onEndRound: () => this.handleEndRound()
    });

    // 检查回合是否结束（出牌次数用完）
    if (this.gameState.isRoundComplete()) {
      if (this.gameState.isRoundWon()) {
        setTimeout(() => {
          // 先调用completeBlind计算奖励，再进入商店
          this.gameState.completeBlind();
          this.gameState.enterShop();
          this.showShop();
        }, 500);
      } else {
        setTimeout(() => {
          this.showGameOver();
        }, 500);
      }
    }

    // 自动保存
    Storage.autoSave(this.gameState);
  }

  /**
   * 显示商店界面
   */
  private showShop(): void {
    // 确保商店存在 - 如果 gameState.shop 为 null，创建新商店
    if (!this.gameState.shop) {
      console.log('[Game.showShop] gameState.shop 为 null，创建新商店');
      this.gameState.shop = new Shop();
    }

    console.log('[Game.showShop] 显示商店界面', {
      hasShop: !!this.gameState.shop,
      shopItemCount: this.gameState.shop?.items?.length || 0,
      phase: this.gameState.phase
    });
    if (this.gameState.shop) {
      console.log('[Game.showShop] 商店商品:', this.gameState.shop.items.map(i => ({
        id: i.id,
        type: i.type,
        itemId: (i.item as any).id,
        sold: i.sold
      })));
    }
    this.currentComponent = new ShopComponent(this.container, this.gameState, {
      onBuyItem: () => this.handleBuyItem(),
      onBuyPack: (pack) => this.handleBuyPack(pack),
      onRefresh: () => this.handleShopRefresh(),
      onNextRound: () => this.handleNextRound()
    });

    // 自动保存
    Storage.autoSave(this.gameState);
    console.log('[Game.showShop] 商店界面已显示，自动保存完成');
  }

  /**
   * 处理购买卡包 - 显示开包界面
   */
  private handleBuyPack(pack: BoosterPack): void {
    console.log('[Game.handleBuyPack] 开始处理卡包购买', {
      packId: pack.id,
      packName: pack.name,
      packType: pack.type,
      choices: pack.choices,
      selectCount: pack.selectCount
    });

    // 生成卡包内容并保存到游戏状态，避免刷新后重新随机
    const revealedCards = this.generatePackContents(pack);
    this.gameState.currentPack = {
      pack,
      revealedCards
    };
    // 立即保存，确保卡包内容被记录
    Storage.autoSave(this.gameState);
    console.log('[Game.handleBuyPack] 卡包内容已生成并保存');

    // 创建开包界面
    console.log('[Game.handleBuyPack] 创建 OpenPackComponent');
    new OpenPackComponent(this.container, this.gameState, pack, {
      onClose: () => {
        console.log('[Game.handleBuyPack] 开包界面关闭回调');
        // 清除当前卡包状态
        this.gameState.currentPack = null;
        Storage.autoSave(this.gameState);
        // 关闭开包界面后返回商店
        this.showShop();
      },
      onCardSelected: (card, action) => {
        console.log('[Game.handleBuyPack] 卡牌选择回调', {
          cardType: card.constructor.name,
          cardName: (card as any).name || (card as any).toString(),
          action: action
        });
        // 处理选中的卡牌
        this.handlePackCardSelected(card, action);
        // 清除当前卡包状态
        this.gameState.currentPack = null;
        // 选择后返回商店
        this.showShop();
      },
      onSkip: () => {
        console.log('[Game.handleBuyPack] 跳过开包回调');
        // 清除当前卡包状态
        this.gameState.currentPack = null;
        // 跳过开包，自动保存（卡包已被消耗）
        Storage.autoSave(this.gameState);
        // 返回商店
        this.showShop();
      }
    }, revealedCards);
    console.log('[Game.handleBuyPack] OpenPackComponent 创建完成');
  }

  /**
   * 生成卡包内容
   */
  private generatePackContents(pack: BoosterPack): (Card | Joker | Consumable)[] {
    const contents: (Card | Joker | Consumable)[] = [];

    switch (pack.type) {
      case 'standard':
        const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs];
        const ranks = [Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace];
        for (let i = 0; i < pack.choices; i++) {
          const randomSuit = suits[Math.floor(Math.random() * suits.length)];
          const randomRank = ranks[Math.floor(Math.random() * ranks.length)];
          contents.push(new Card(randomSuit, randomRank));
        }
        break;

      case 'arcana':
        contents.push(...getRandomConsumables(pack.choices, 'tarot'));
        break;

      case 'celestial':
        contents.push(...getRandomConsumables(pack.choices, 'planet'));
        break;

      case 'buffoon':
        contents.push(...getRandomJokers(pack.choices));
        break;

      case 'spectral':
        contents.push(...getRandomConsumables(pack.choices, 'spectral'));
        break;
    }

    return contents;
  }

  /**
   * 处理开包选中的卡牌
   */
  private handlePackCardSelected(card: Card | Joker | Consumable, action: 'keep' | 'use'): void {
    if (card instanceof Joker) {
      // 小丑牌：添加到小丑牌槽位
      const success = this.gameState.addJoker(card);
      if (success) {
        Toast.success(`获得小丑牌: ${card.name}`);
      } else {
        Toast.error('小丑牌槽位已满！');
      }
    } else if (card instanceof Consumable) {
      // 消耗牌
      if (action === 'use') {
        // 立即使用消耗牌
        const context = {
          gameState: {
            money: this.gameState.money,
            hands: this.gameState.handsRemaining,
            discards: this.gameState.discardsRemaining
          },
          selectedCards: this.gameState.cardPile.hand.getSelectedCards(),
          deck: this.gameState.cardPile.deck
        };

        if (card.canUse(context)) {
          const result = card.use(context);
          if (result.success) {
            if (result.message) {
              Toast.success(result.message);
            }
          } else {
            Toast.error(result.message || '使用失败');
            // 使用失败，放入槽位
            if (this.gameState.hasAvailableConsumableSlot()) {
              this.gameState.addConsumable(card);
              Toast.info(`${card.name} 已放入消耗牌槽位`);
            }
          }
        } else {
          // 无法使用，放入槽位
          if (this.gameState.hasAvailableConsumableSlot()) {
            this.gameState.addConsumable(card);
            Toast.info(`${card.name} 已放入消耗牌槽位`);
          } else {
            Toast.error('消耗牌槽位已满！');
          }
        }
      } else {
        // 放入消耗牌槽位
        if (this.gameState.hasAvailableConsumableSlot()) {
          this.gameState.addConsumable(card);
          Toast.success(`获得消耗牌: ${card.name}`);
        } else {
          Toast.error('消耗牌槽位已满！');
        }
      }
    } else if (card instanceof Card) {
      // 游戏牌：添加到卡组
      this.gameState.cardPile.deck.addToBottom(card);
      this.gameState.cardPile.deck.shuffle();
      Toast.success(`获得卡牌: ${card.toString()}`);
    }

    // 自动保存
    Storage.autoSave(this.gameState);
  }

  /**
   * 显示游戏规则 - 使用 viewport 单位实现流体式响应布局
   */
  /**
   * 切换全屏模式
   */
  private toggleFullscreen(button: HTMLButtonElement): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        button.textContent = '📴 退出全屏';
      }).catch(err => {
        console.error('进入全屏失败:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        button.textContent = '🔳 全屏模式';
      }).catch(err => {
        console.error('退出全屏失败:', err);
      });
    }
  }

  private showRules(): void {
    this.container.innerHTML = '';
    // 使用 viewport 单位确保内容适应屏幕大小
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center justify-center p-[2vw]';

    const panel = document.createElement('div');
    panel.style.width = 'min(90vw, 672px)';  // max-w-2xl = 672px
    panel.style.maxHeight = '90vh';
    panel.className = 'game-panel overflow-y-auto';

    const title = document.createElement('h2');
    title.style.fontSize = 'clamp(1.5rem, 5vw, 2rem)';  // 最小 24px, 动态 5vw, 最大 32px
    title.className = 'font-bold text-yellow-400 mb-[2vh] text-center';
    title.textContent = '游戏规则';
    panel.appendChild(title);

    const rules = [
      {
        title: '游戏目标',
        content: '通过打出扑克牌型获得分数，达到每个关卡的目标分数即可过关。游戏共有8个底注(ante)，每个底注包含小盲注、大盲注和Boss盲注三个关卡。'
      },
      {
        title: '基本操作',
        content: '点击手牌选择要出的牌，然后点击"出牌"按钮。你也可以弃掉不需要的牌来换取新牌。每回合有固定的出牌次数和弃牌次数。'
      },
      {
        title: '牌型分数',
        content: '高牌(5×1) < 一对(10×2) < 两对(20×2) < 三条(30×3) < 顺子(30×4) < 同花(35×4) < 葫芦(40×4) < 四条(60×7) < 同花顺(100×8) < 皇家同花顺(100×8)'
      },
      {
        title: '小丑牌',
        content: '小丑牌可以提供各种加成效果，最多可以持有5张。它们可以改变筹码、倍率，或者提供特殊效果。'
      },
      {
        title: '消耗牌',
        content: '塔罗牌可以改变卡牌属性，星球牌可以升级牌型，幻灵牌有强大的特殊效果。最多持有2张。'
      },
      {
        title: '商店',
        content: '过关后进入商店，可以购买小丑牌、消耗牌、卡包和优惠券。刷新商店可以更换商品，但价格会逐渐上涨。'
      }
    ];

    rules.forEach(rule => {
      const section = document.createElement('div');
      section.style.marginBottom = 'clamp(12px, 3vh, 24px)';

      const sectionTitle = document.createElement('h3');
      sectionTitle.style.fontSize = 'clamp(1.125rem, 3vw, 1.25rem)';  // 最小 18px, 动态 3vw, 最大 20px
      sectionTitle.className = 'font-bold text-yellow-400 mb-[1vh]';
      sectionTitle.textContent = rule.title;
      section.appendChild(sectionTitle);

      const sectionContent = document.createElement('p');
      sectionContent.style.fontSize = 'clamp(0.875rem, 2.5vw, 1rem)';  // 最小 14px, 动态 2.5vw, 最大 16px
      sectionContent.className = 'text-gray-300 leading-relaxed';
      sectionContent.textContent = rule.content;
      section.appendChild(sectionContent);

      panel.appendChild(section);
    });

    // 返回按钮
    const backBtn = document.createElement('button');
    backBtn.style.marginTop = 'clamp(12px, 3vh, 24px)';
    backBtn.style.padding = 'clamp(10px, 2vh, 16px) clamp(20px, 4vw, 32px)';
    backBtn.style.fontSize = 'clamp(1rem, 2.5vw, 1.125rem)';
    backBtn.className = 'game-btn game-btn-secondary w-full';
    backBtn.textContent = '返回主菜单';
    backBtn.addEventListener('click', () => this.showMainMenu());
    panel.appendChild(backBtn);

    this.container.appendChild(panel);
  }

  /**
   * 显示游戏结束界面 - 使用 viewport 单位实现流体式响应布局
   */
  private showGameOver(): void {
    this.container.innerHTML = '';
    // 使用 viewport 单位确保内容适应屏幕大小
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center justify-center p-[2vw]';

    const title = document.createElement('h1');
    title.style.fontSize = 'clamp(2.5rem, 8vw, 4rem)';  // 最小 40px, 动态 8vw, 最大 64px
    title.className = 'font-bold text-red-500 mb-[2vh]';
    title.textContent = '游戏结束';
    this.container.appendChild(title);

    const score = document.createElement('p');
    score.style.fontSize = 'clamp(1.25rem, 4vw, 1.5rem)';  // 最小 20px, 动态 4vw, 最大 24px
    score.className = 'text-gray-300 mb-[1vh]';
    score.textContent = `总得分: ${this.gameState.currentScore}`;
    this.container.appendChild(score);

    const ante = document.createElement('p');
    ante.style.fontSize = 'clamp(1rem, 3vw, 1.25rem)';  // 最小 16px, 动态 3vw, 最大 20px
    ante.className = 'text-gray-400 mb-[4vh]';
    ante.textContent = `到达底注: ${this.gameState.ante}`;
    this.container.appendChild(ante);

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.gap = 'clamp(8px, 2vw, 16px)';
    buttonContainer.className = 'flex';

    const newGameBtn = document.createElement('button');
    newGameBtn.style.fontSize = 'clamp(1rem, 2.5vw, 1.125rem)';
    newGameBtn.style.padding = 'clamp(10px, 2vh, 16px) clamp(20px, 4vw, 32px)';
    newGameBtn.className = 'game-btn game-btn-primary';
    newGameBtn.textContent = '再来一局';
    newGameBtn.addEventListener('click', () => this.startNewGame());
    buttonContainer.appendChild(newGameBtn);

    const menuBtn = document.createElement('button');
    menuBtn.style.fontSize = 'clamp(1rem, 2.5vw, 1.125rem)';
    menuBtn.style.padding = 'clamp(10px, 2vh, 16px) clamp(20px, 4vw, 32px)';
    menuBtn.className = 'game-btn game-btn-secondary';
    menuBtn.textContent = '主菜单';
    menuBtn.addEventListener('click', () => this.showMainMenu());
    buttonContainer.appendChild(menuBtn);

    this.container.appendChild(buttonContainer);

    // 删除存档
    deleteSave();
  }

  /**
   * 处理关卡选择
   */
  private handleBlindSelect(blindType: BlindType): void {
    if (this.gameState.selectBlind(blindType)) {
      this.showGameBoard();
    } else {
      showAlert('错误', '选择关卡失败', 'error');
    }
  }

  /**
   * 处理跳过关卡
   */
  private handleSkipBlind(): void {
    if (this.gameState.skipBlind()) {
      Storage.autoSave(this.gameState);
      this.showBlindSelect();
    } else {
      showAlert('提示', '只有小盲注可以跳过，且每关只能跳过一次', 'warning');
    }
  }

  /**
   * 处理出牌
   */
  private handlePlayHand(): void {
    Storage.autoSave(this.gameState);
    
    // 检查回合状态
    if (this.gameState.isRoundComplete()) {
      if (this.gameState.isRoundWon()) {
        setTimeout(() => {
          // 先调用completeBlind计算奖励，再进入商店
          this.gameState.completeBlind();
          this.gameState.enterShop();
          this.showShop();
        }, 1000);
      } else {
        setTimeout(() => {
          this.showGameOver();
        }, 1000);
      }
    }
  }

  /**
   * 处理弃牌
   */
  private handleDiscard(): void {
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理按点数排序
   */
  private handleSortByRank(): void {
    this.gameState.cardPile.hand.sortByRank();
    if (this.currentComponent instanceof GameBoard) {
      this.currentComponent.refresh();
    }
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理按花色排序
   */
  private handleSortBySuit(): void {
    this.gameState.cardPile.hand.sortBySuit();
    if (this.currentComponent instanceof GameBoard) {
      this.currentComponent.refresh();
    }
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理进入商店
   */
  private handleEnterShop(): void {
    this.gameState.enterShop();
    this.showShop();
  }

  /**
   * 处理结束回合
   */
  private handleEndRound(): void {
    if (!this.gameState.isRoundWon()) {
      showAlert('提示', '还未达到目标分数，无法结束回合！', 'warning');
      return;
    }

    // 先调用completeBlind计算奖励
    this.gameState.completeBlind();

    // 计算剩余出牌次数奖励
    const handsRemainingReward = this.gameState.handsRemaining;
    const blindReward = this.gameState.currentBlind?.reward || 0;
    const totalReward = blindReward + handsRemainingReward;

    showAlert(
      '关卡完成！',
      `基础奖励: $${blindReward}\n剩余出牌次数奖励: $${handsRemainingReward}\n总计: $${totalReward}`,
      'success'
    );

    this.gameState.enterShop();
    this.showShop();
  }

  /**
   * 处理购买物品
   */
  private handleBuyItem(): void {
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理商店刷新
   */
  private handleShopRefresh(): void {
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理进入下一关
   */
  private handleNextRound(): void {
    this.gameState.exitShop();
    this.showBlindSelect();
  }

  /**
   * 处理删除存档
   */
  private handleDeleteSave(): void {
    showConfirm(
      '确认删除存档',
      '确定要删除存档吗？此操作不可恢复。',
      () => {
        deleteSave();
        this.showMainMenu();
      }
    );
  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
