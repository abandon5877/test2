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
import { Storage, hasSave, load, restoreGameState, deleteSave, isEndlessModeUnlocked, unlockEndlessMode, deleteGlobalUnlockData } from './utils/storage';
import { showAlert, showConfirm } from './ui/components/Modal';
import { ScaleContainer } from './ui/components/ScaleContainer';
import { Toast } from './ui/components/Toast';
import { Suit, Rank } from './types/card';
import { getRandomJokers, getRandomJoker, getRandomJokerByRarity } from './data/jokers';
import { getRandomConsumables, getConsumableById } from './data/consumables';
import { JokerEdition, JokerRarity } from './types/joker';
import { ProbabilitySystem, PROBABILITIES } from './systems/ProbabilitySystem';

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
   * 格式化大数字显示
   * K = 千, M = 百万, B = 十亿, T = 万亿
   * 超过 1e15 使用科学计数法
   */
  private formatNumber(num: number): string {
    if (num < 1000) {
      return num.toString();
    } else if (num < 1_000_000) {
      return (num / 1000).toFixed(1) + 'K';
    } else if (num < 1_000_000_000) {
      return (num / 1_000_000).toFixed(1) + 'M';
    } else if (num < 1_000_000_000_000) {
      return (num / 1_000_000_000).toFixed(1) + 'B';
    } else if (num < 1_000_000_000_000_000) {
      return (num / 1_000_000_000_000).toFixed(1) + 'T';
    } else {
      // 科学计数法
      return num.toExponential(2);
    }
  }

  /**
   * 显示主菜单 - 使用 vmin 实现真正的自适应布局
   * 大屏幕元素大，小屏幕元素小，标题始终比按钮大一圈
   */
  private showMainMenu(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center justify-center p-[2vmin] overflow-hidden';

    // 使用 vmin 作为基准单位，确保在任何屏幕比例下都一致
    const vmin = Math.min(window.innerWidth, window.innerHeight) / 100;
    
    // 内容包装器
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'flex flex-col items-center w-full';
    contentWrapper.style.maxWidth = `${window.innerWidth * 0.9}px`;

    // 标题 - 使用 vmin，大屏幕大，小屏幕小
    const titleSize = Math.max(vmin * 12, 24); // 最小24px，约12vmin
    const title = document.createElement('h1');
    title.style.fontSize = `${titleSize}px`;
    title.style.marginBottom = `${vmin * 2}px`;
    title.className = 'font-bold text-yellow-400 animate-float';
    title.textContent = '🃏 Balatro';
    title.style.textAlign = 'center';
    contentWrapper.appendChild(title);

    // 副标题 - 比标题小一些
    const subtitleSize = Math.max(vmin * 5, 14);
    const subtitle = document.createElement('p');
    subtitle.style.fontSize = `${subtitleSize}px`;
    subtitle.style.marginBottom = `${vmin * 6}px`;
    subtitle.className = 'text-gray-400';
    subtitle.textContent = '扑克肉鸽卡牌游戏';
    contentWrapper.appendChild(subtitle);

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.width = '100%';
    buttonContainer.style.maxWidth = `${Math.min(vmin * 80, 320)}px`;
    buttonContainer.style.gap = `${Math.max(vmin * 2, 6)}px`;
    buttonContainer.className = 'flex flex-col';

    // 按钮尺寸 - 统一大小
    const btnHeight = Math.max(vmin * 10, 44); // 最小44px，约10vmin
    const btnFontSize = Math.max(vmin * 3.5, 16); // 最小16px，约3.5vmin

    const createButton = (text: string, className: string, onClick: () => void, isSpecial = false) => {
      const btn = document.createElement('button');
      btn.style.height = `${btnHeight}px`;
      btn.style.fontSize = `${btnFontSize}px`;
      btn.style.display = 'flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.className = `game-btn ${className} w-full`;
      btn.textContent = text;
      if (isSpecial) {
        btn.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        btn.style.color = '#ffffff';
        btn.style.border = '2px solid #fbbf24';
      }
      btn.addEventListener('click', onClick);
      return btn;
    };

    // 继续游戏按钮（如果有存档）
    if (hasSave()) {
      buttonContainer.appendChild(createButton('继续游戏', 'game-btn-primary', () => this.continueGame()));
    }

    // 开始新游戏按钮
    buttonContainer.appendChild(createButton('开始新游戏', 'game-btn-secondary', () => this.startNewGame()));

    // 无尽模式按钮（如果已解锁）
    if (isEndlessModeUnlocked()) {
      buttonContainer.appendChild(createButton('🔥 无尽模式', 'game-btn-secondary', () => this.startEndlessMode(), true));
    }

    // 规则说明按钮
    buttonContainer.appendChild(createButton('规则说明', 'game-btn-secondary', () => this.showRules()));

    contentWrapper.appendChild(buttonContainer);

    // 版本信息
    const version = document.createElement('p');
    version.style.marginTop = `${Math.max(vmin * 4, 12)}px`;
    version.style.fontSize = `${Math.max(vmin * 2.5, 10)}px`;
    version.className = 'text-gray-600';
    version.textContent = 'v1.0.0';
    contentWrapper.appendChild(version);

    this.container.appendChild(contentWrapper);

    // 全屏按钮 - 右下角小按钮
    const fullscreenBtn = document.createElement('button');
    const fsBtnSize = Math.max(vmin * 8, 32);
    fullscreenBtn.style.position = 'fixed';
    fullscreenBtn.style.right = `${Math.max(vmin * 2, 8)}px`;
    fullscreenBtn.style.bottom = `${Math.max(vmin * 2, 8)}px`;
    fullscreenBtn.style.width = `${fsBtnSize}px`;
    fullscreenBtn.style.height = `${fsBtnSize}px`;
    fullscreenBtn.style.fontSize = `${Math.max(vmin * 3.5, 14)}px`;
    fullscreenBtn.style.borderRadius = '50%';
    fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.6)';
    fullscreenBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
    fullscreenBtn.style.color = '#fff';
    fullscreenBtn.style.cursor = 'pointer';
    fullscreenBtn.style.display = 'flex';
    fullscreenBtn.style.alignItems = 'center';
    fullscreenBtn.style.justifyContent = 'center';
    fullscreenBtn.style.zIndex = '1000';
    fullscreenBtn.style.transition = 'all 0.2s ease';
    fullscreenBtn.textContent = document.fullscreenElement ? '⛶' : '⛶';
    fullscreenBtn.title = document.fullscreenElement ? '退出全屏' : '全屏模式';

    // 悬停效果
    fullscreenBtn.addEventListener('mouseenter', () => {
      fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.8)';
      fullscreenBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
      fullscreenBtn.style.transform = 'scale(1.1)';
    });
    fullscreenBtn.addEventListener('mouseleave', () => {
      fullscreenBtn.style.background = 'rgba(0, 0, 0, 0.6)';
      fullscreenBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      fullscreenBtn.style.transform = 'scale(1)';
    });

    fullscreenBtn.addEventListener('click', () => this.toggleFullscreen(fullscreenBtn));
    this.container.appendChild(fullscreenBtn);

    // 监听全屏状态变化
    document.addEventListener('fullscreenchange', () => {
      fullscreenBtn.title = document.fullscreenElement ? '退出全屏' : '全屏模式';
    });

    // 删除存档按钮 - 左下角垃圾桶图标（如果有存档）
    if (hasSave()) {
      const deleteBtn = document.createElement('button');
      const delBtnSize = Math.max(vmin * 8, 32);
      deleteBtn.style.position = 'fixed';
      deleteBtn.style.left = `${Math.max(vmin * 2, 8)}px`;
      deleteBtn.style.bottom = `${Math.max(vmin * 2, 8)}px`;
      deleteBtn.style.width = `${delBtnSize}px`;
      deleteBtn.style.height = `${delBtnSize}px`;
      deleteBtn.style.fontSize = `${Math.max(vmin * 3.5, 14)}px`;
      deleteBtn.style.borderRadius = '50%';
      deleteBtn.style.background = 'rgba(220, 38, 38, 0.6)';
      deleteBtn.style.border = '1px solid rgba(255, 255, 255, 0.3)';
      deleteBtn.style.color = '#fff';
      deleteBtn.style.cursor = 'pointer';
      deleteBtn.style.display = 'flex';
      deleteBtn.style.alignItems = 'center';
      deleteBtn.style.justifyContent = 'center';
      deleteBtn.style.zIndex = '1000';
      deleteBtn.style.transition = 'all 0.2s ease';
      deleteBtn.textContent = '🗑️';
      deleteBtn.title = '删除存档';

      // 悬停效果
      deleteBtn.addEventListener('mouseenter', () => {
        deleteBtn.style.background = 'rgba(220, 38, 38, 0.8)';
        deleteBtn.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        deleteBtn.style.transform = 'scale(1.1)';
      });
      deleteBtn.addEventListener('mouseleave', () => {
        deleteBtn.style.background = 'rgba(220, 38, 38, 0.6)';
        deleteBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        deleteBtn.style.transform = 'scale(1)';
      });

      deleteBtn.addEventListener('click', () => this.handleDeleteSave());
      this.container.appendChild(deleteBtn);
    }
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
   * 开始无尽模式
   */
  private startEndlessMode(): void {
    // 如果有存档，先确认是否覆盖
    if (hasSave()) {
      showConfirm(
        '确认开始无尽模式？',
        '当前已有游戏存档，开始无尽模式将覆盖现有进度，此操作不可恢复。',
        () => {
          // 用户确认，执行无尽模式逻辑
          this.doStartEndlessMode();
        }
      );
    } else {
      // 没有存档，直接开始
      this.doStartEndlessMode();
    }
  }

  /**
   * 执行开始无尽模式
   */
  private doStartEndlessMode(): void {
    // 删除旧存档
    deleteSave();

    // 创建新的游戏状态
    this.gameState = new GameState();

    // 设置无尽模式标志
    this.gameState.isEndlessMode = true;

    // 直接设置到底注9（无尽模式开始）
    this.gameState.ante = 9;

    // 初始化游戏
    this.gameState.startNewGame();

    // 自动存档
    Storage.autoSave(this.gameState);

    // 显示盲注选择界面
    this.showBlindSelect();
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
      onSkipBlind: () => this.handleSkipBlind(),
      onRerollBoss: () => this.handleRerollBoss()
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
      onEndRound: () => this.handleEndRound()
    });

    // 检查回合是否结束（出牌次数用完）
    if (this.gameState.isRoundComplete()) {
      if (this.gameState.isRoundWon()) {
        setTimeout(() => {
          // completeBlind 已经完成了进入商店的所有工作
          this.gameState.completeBlind();
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
   * 处理购买卡包 - 显示开包界面（内嵌在商店商品区域）
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

    // 获取商店中间区域作为开包界面的容器
    const shopCenterPanel = document.getElementById('shop-center-panel');
    if (!shopCenterPanel) {
      console.error('[Game.handleBuyPack] 错误：找不到商店中间区域');
      return;
    }

    // 创建开包界面（内嵌模式）
    console.log('[Game.handleBuyPack] 创建 OpenPackComponent（内嵌模式）');
    new OpenPackComponent(shopCenterPanel, this.gameState, pack, {
      onClose: () => {
        console.log('[Game.handleBuyPack] 开包界面关闭回调');
        // 清除当前卡包状态
        this.gameState.currentPack = null;
        Storage.autoSave(this.gameState);
        // 关闭开包界面后刷新商店（不移除整个商店）
        if (this.currentComponent instanceof ShopComponent) {
          this.currentComponent.render();
        }
      },
      onCardSelected: (card, action) => {
        console.log('[Game.handleBuyPack] 卡牌选择回调', {
          cardType: card.constructor.name,
          cardName: (card as any).name || (card as any).toString(),
          action: action
        });
        // 处理选中的卡牌
        this.handlePackCardSelected(card, action);

        // 只有在选择（keep）而非使用（use）消耗牌时，才清除卡包状态并刷新商店
        // 使用消耗牌时，开包组件会自己处理重新渲染
        if (action === 'keep') {
          // 清除当前卡包状态
          this.gameState.currentPack = null;
          // 选择后刷新商店（不移除整个商店）
          if (this.currentComponent instanceof ShopComponent) {
            this.currentComponent.render();
          }
        }
      },
      onSkip: () => {
        console.log('[Game.handleBuyPack] 跳过开包回调');
        // 清除当前卡包状态
        this.gameState.currentPack = null;
        // 跳过开包，自动保存（卡包已被消耗）
        Storage.autoSave(this.gameState);
        // 刷新商店（不移除整个商店）
        if (this.currentComponent instanceof ShopComponent) {
          this.currentComponent.render();
        }
      }
    }, revealedCards, true); // 使用内嵌模式
    console.log('[Game.handleBuyPack] OpenPackComponent 创建完成（内嵌模式）');
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
        // 获取玩家已有的小丑牌ID，避免卡包开出重复的小丑牌
        const existingJokerIds = this.gameState.jokerSlots.getJokers().map(j => j.id);
        contents.push(...getRandomJokers(pack.choices, [], existingJokerIds));
        break;

      case 'spectral':
        contents.push(...getRandomConsumables(pack.choices, 'spectral'));
        break;
    }

    // 处理Hallucination（幻觉）效果：开包时有50%概率生成一张塔罗牌
    const hasHallucination = this.gameState.jokerSlots.getActiveJokers().some(j => j.id === 'hallucination');
    if (hasHallucination) {
      // 更新Oops! All 6s数量
      const oopsCount = this.gameState.jokerSlots.getActiveJokers().filter(j => j.id === 'oops_all_6s').length;
      ProbabilitySystem.setOopsAll6sCount(oopsCount);

      if (ProbabilitySystem.check(PROBABILITIES.HALLUCINATION)) {
        const tarotCards = getRandomConsumables(1, 'tarot');
        if (tarotCards.length > 0) {
          contents.push(tarotCards[0]);
          Toast.info('幻觉: 生成了一张塔罗牌！');
        }
      }
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
          deck: this.gameState.cardPile.deck,
          jokers: this.gameState.jokers,
          lastUsedConsumable: this.gameState.lastUsedConsumable ?? undefined,
          money: this.gameState.money,
          setMoney: (amount: number): void => {
            this.gameState.setMoney(amount);
          },
          addJoker: (rarity?: 'rare' | 'legendary'): boolean => {
            console.log('[Game] addJoker 被调用, rarity:', rarity);
            let joker: Joker;
            if (rarity) {
              // 根据指定稀有度获取对应的小丑牌
              const targetRarity = rarity === 'rare' ? JokerRarity.RARE : JokerRarity.LEGENDARY;
              joker = getRandomJokerByRarity(targetRarity);
              console.log('[Game] 生成的指定稀有度小丑牌:', joker.id, joker.name, 'rarity:', joker.rarity);
            } else {
              // 没有指定稀有度，使用默认随机生成
              joker = getRandomJoker();
              console.log('[Game] 生成的随机小丑牌:', joker.id, joker.name);
            }
            const success = this.gameState.addJoker(joker);
            console.log('[Game] addJoker 结果:', success);
            return success;
          },
          addEditionToRandomJoker: (edition: string): boolean => {
            console.log('[Game] addEditionToRandomJoker 被调用, edition:', edition);
            const jokers = this.gameState.jokers;
            const eligibleJokers = jokers.filter(j => j.edition === JokerEdition.None);
            if (eligibleJokers.length === 0) return false;
            
            const randomIndex = Math.floor(Math.random() * eligibleJokers.length);
            const targetJoker = eligibleJokers[randomIndex];
            const actualIndex = this.gameState.jokers.indexOf(targetJoker);
            
            if (actualIndex >= 0) {
              const joker = this.gameState.jokers[actualIndex] as Joker;
              joker.edition = edition as JokerEdition;
              console.log('[Game] 已为小丑牌添加版本:', joker.name, edition);
              return true;
            }
            return false;
          },
          copyRandomJoker: (): { success: boolean; copiedJokerName?: string; originalIndex?: number } => {
            console.log('[Game] copyRandomJoker 被调用');
            const jokers = this.gameState.jokers;
            if (jokers.length === 0) {
              return { success: false };
            }
            const randomIndex = Math.floor(Math.random() * jokers.length);
            const jokerToCopy = jokers[randomIndex] as Joker;
            const clonedJoker = jokerToCopy.clone() as Joker;
            if (clonedJoker.edition === JokerEdition.Negative) {
              clonedJoker.edition = JokerEdition.None;
            }
            const success = this.gameState.addJoker(clonedJoker);
            console.log('[Game] 复制小丑牌结果:', success, clonedJoker.name, '原始索引:', randomIndex);
            return {
              success,
              copiedJokerName: success ? clonedJoker.name : undefined,
              originalIndex: randomIndex
            };
          },
          destroyOtherJokers: (originalIndex?: number): number => {
            console.log('[Game] destroyOtherJokers 被调用, 保留原始索引:', originalIndex);
            const jokers = this.gameState.jokers;
            if (jokers.length <= 1) return 0;

            // 保留最后一张（复制的小丑）和原始被复制的小丑
            const copiedJokerIndex = jokers.length - 1;
            let destroyedCount = 0;

            for (let i = jokers.length - 1; i >= 0; i--) {
              // 保留复制的小丑和原始被复制的小丑
              if (i !== copiedJokerIndex && i !== originalIndex) {
                const joker = jokers[i] as Joker;
                // 不摧毁永恒小丑
                if (joker.sticker !== 'eternal') {
                  this.gameState.removeJoker(i);
                  destroyedCount++;
                }
              }
            }
            console.log('[Game] 已销毁小丑牌数量:', destroyedCount);
            return destroyedCount;
          }
        };

        if (card.canUse(context)) {
          const result = card.use(context);
          if (result.success) {
            if (result.message) {
              Toast.success(result.message);
            }

            // 更新最后使用的消耗牌（用于愚者效果）
            this.gameState.lastUsedConsumable = { id: card.id, type: card.type };
            console.log('[Game] 更新 lastUsedConsumable:', this.gameState.lastUsedConsumable);

            // 统一处理消耗牌结果（包括愚者牌的递归触发）
            this.handleConsumableResult(result, context, true);
          } else {
            Toast.error(result.message || '使用失败');
            // 使用失败，放入槽位
            const added = this.gameState.addConsumable(card);
            if (added) {
              Toast.info(`${card.name} 已放入消耗牌槽位`);
            } else {
              Toast.error('消耗牌槽位已满！');
            }
          }
        } else {
          // 无法使用，放入槽位
          const added = this.gameState.addConsumable(card);
          if (added) {
            Toast.info(`${card.name} 已放入消耗牌槽位`);
          } else {
            Toast.error('消耗牌槽位已满！');
          }
        }
      } else {
        // 放入消耗牌槽位
        const added = this.gameState.addConsumable(card);
        if (added) {
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
        button.title = '退出全屏';
      }).catch(err => {
        console.error('进入全屏失败:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        button.title = '全屏模式';
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
   * 显示游戏通关界面 - 底注8完成
   */
  private showGameComplete(): void {
    this.container.innerHTML = '';
    this.container.className = 'casino-bg min-h-screen w-full flex flex-col items-center justify-center p-[2vw]';

    // 标题
    const title = document.createElement('h1');
    title.style.fontSize = 'clamp(2.5rem, 8vw, 4rem)';
    title.className = 'font-bold text-yellow-400 mb-[2vh]';
    title.textContent = '🎉 恭喜通关！';
    this.container.appendChild(title);

    // 通关信息
    const message = document.createElement('p');
    message.style.fontSize = 'clamp(1.25rem, 4vw, 1.5rem)';
    message.className = 'text-gray-300 mb-[1vh] text-center';
    message.textContent = '你已完成底注8，击败了所有Boss盲注！';
    this.container.appendChild(message);

    // 解锁信息
    const unlockMessage = document.createElement('p');
    unlockMessage.style.fontSize = 'clamp(1rem, 3vw, 1.25rem)';
    unlockMessage.className = 'text-green-400 mb-[1vh] text-center font-bold';
    unlockMessage.textContent = '🔓 无尽模式已解锁！';
    this.container.appendChild(unlockMessage);

    // 最终得分
    const score = document.createElement('p');
    score.style.fontSize = 'clamp(1.5rem, 5vw, 2rem)';
    score.className = 'text-yellow-400 mb-[4vh]';
    score.textContent = `最终得分: ${this.formatNumber(this.gameState.currentScore)}`;
    this.container.appendChild(score);

    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.gap = 'clamp(8px, 2vw, 16px)';
    buttonContainer.className = 'flex flex-col items-center';

    // 确认按钮 - 返回主菜单
    const confirmBtn = document.createElement('button');
    confirmBtn.style.fontSize = 'clamp(1rem, 2.5vw, 1.125rem)';
    confirmBtn.style.padding = 'clamp(10px, 2vh, 16px) clamp(20px, 4vw, 32px)';
    confirmBtn.className = 'game-btn game-btn-primary';
    confirmBtn.textContent = '确定';
    confirmBtn.addEventListener('click', () => {
      // 解锁无尽模式（持久化）
      unlockEndlessMode();
      // 返回主菜单
      this.showMainMenu();
    });
    buttonContainer.appendChild(confirmBtn);

    this.container.appendChild(buttonContainer);
  }

  /**
   * 处理关卡选择
   */
  private handleBlindSelect(blindType: BlindType): void {
    if (this.gameState.selectBlind(blindType)) {
      Storage.autoSave(this.gameState); // 修复: 选择关卡后立即存档
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
   * 处理重掷Boss盲注
   */
  private handleRerollBoss(): void {
    const result = this.gameState.rerollBoss();
    if (result.success) {
      Storage.autoSave(this.gameState);
      // 重新渲染盲注选择界面以显示新Boss
      this.showBlindSelect();
      // 显示成功提示
      Toast.success(result.message);
    } else {
      Toast.error(result.message || '无法重掷Boss');
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
          // completeBlind 已经完成了进入商店的所有工作
          this.gameState.completeBlind();
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
      // 排序时禁用动画，避免卡牌乱抖
      this.currentComponent.refreshHandOnly(true);
    }
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理按花色排序
   */
  private handleSortBySuit(): void {
    this.gameState.cardPile.hand.sortBySuit();
    if (this.currentComponent instanceof GameBoard) {
      // 排序时禁用动画，避免卡牌乱抖
      this.currentComponent.refreshHandOnly(true);
    }
    Storage.autoSave(this.gameState);
  }

  /**
   * 处理结束回合
   */
  private handleEndRound(): void {
    if (!this.gameState.isRoundWon()) {
      showAlert('提示', '还未达到目标分数，无法结束回合！', 'warning');
      return;
    }

    // 先调用completeBlind计算奖励（已完成进入商店的所有工作）
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

    Storage.autoSave(this.gameState); // 修复: 进入商店后立即存档
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
    Storage.autoSave(this.gameState); // 修复: 退出商店后立即存档
    
    // 检查是否完成底注8（通关）- 只在非无尽模式下显示通关界面
    if (this.gameState.ante === 8 && !this.gameState.isEndlessMode) {
      // 显示通关界面
      this.showGameComplete();
    } else {
      this.showBlindSelect();
    }
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

  /**
   * 处理消耗牌使用结果
   * 统一处理各种返回字段，支持愚者牌的递归触发
   */
  private handleConsumableResult(
    result: import('./types/consumable').ConsumableEffectResult,
    context: import('./types/consumable').ConsumableEffectContext,
    isFromPack: boolean = false
  ): void {
    // 处理金钱设置（优先级高于 moneyChange，用于隐士等直接设置金钱的牌）
    if (result.setMoney !== undefined) {
      this.gameState.setMoney(result.setMoney);
    }
    // 处理金钱变化
    else if (result.moneyChange !== undefined && result.moneyChange !== 0) {
      if (result.moneyChange > 0) {
        this.gameState.addMoney(result.moneyChange);
      } else {
        this.gameState.spendMoney(-result.moneyChange);
      }
    }

    // 处理星球牌升级
    if (result.handTypeUpgrade) {
      this.gameState.handLevelState.upgradeHand(result.handTypeUpgrade as import('./types/pokerHands').PokerHandType);
    }

    // 处理黑洞牌升级所有牌型
    if (result.upgradeAllHandLevels) {
      this.gameState.handLevelState.upgradeAll();
    }

    // 处理新生成的消耗牌
    if (result.newConsumableIds && result.newConsumableIds.length > 0) {
      let skippedCount = 0;
      for (const consumableId of result.newConsumableIds) {
        // 不预先检查槽位，让 addConsumable 来决定是否可以添加
        // 这样负片消耗牌在槽位满时也可以添加
        const newConsumable = getConsumableById(consumableId);
        if (newConsumable) {
          const success = this.gameState.addConsumable(newConsumable);
          if (!success) {
            skippedCount++;
          }
        }
      }
      if (skippedCount > 0) {
        Toast.warning(`消耗牌槽位已满，${skippedCount}张生成被跳过`);
      }
    }

    // 处理新创建的卡牌
    if (result.newCards && result.newCards.length > 0) {
      for (const newCard of result.newCards) {
        this.gameState.cardPile.deck.addToBottom(newCard);
      }
      Toast.success(`添加了 ${result.newCards.length} 张新卡牌到牌库`);
    }

    // 处理愚者牌：触发上一次使用的消耗牌效果
    if (result.copiedConsumableId) {
      const copiedConsumable = getConsumableById(result.copiedConsumableId);
      if (copiedConsumable) {
        Toast.success(`愚者触发了 ${copiedConsumable.name} 的效果`);
        const copiedResult = copiedConsumable.use(context);
        if (copiedResult.success) {
          // 更新最后使用的消耗牌为被复制的卡牌（用于连续使用愚者）
          this.gameState.lastUsedConsumable = { id: copiedConsumable.id, type: copiedConsumable.type };
          console.log('[Game] 愚者复制后更新 lastUsedConsumable:', this.gameState.lastUsedConsumable);

          // 递归处理被触发消耗牌的结果
          this.handleConsumableResult(copiedResult, context, isFromPack);
        }
      }
    }
  }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
  new Game();
});
