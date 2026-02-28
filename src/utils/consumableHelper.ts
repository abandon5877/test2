import type { GameState } from '../models/GameState';
import type { ConsumableEffectContext, ConsumableEffectResult } from '../types/consumable';
import type { Joker } from '../models/Joker';
import { JokerEdition, JokerRarity } from '../types/joker';
import { getRandomJoker, getRandomJokerByRarity } from '../data/jokers';
import { getConsumableById } from '../data/consumables';
import { JokerSystem } from '../systems/JokerSystem';

export interface ConsumableCallbacks {
  onToast?: (message: string, type: 'success' | 'warning' | 'error') => void;
  onRender?: () => void;
}

export class ConsumableHelper {
  constructor(
    private gameState: GameState,
    private callbacks?: ConsumableCallbacks
  ) {}

  /**
   * 创建消耗牌使用上下文
   */
  createContext(): ConsumableEffectContext {
    // 计算每个小丑牌的售价（用于节制塔罗牌）
    const jokersWithSellPrice = this.gameState.jokers.map(joker => {
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
    });

    return {
      gameState: {
        money: this.gameState.money,
        hands: this.gameState.handsRemaining,
        discards: this.gameState.discardsRemaining
      },
      selectedCards: this.gameState.cardPile.hand.getSelectedCards(),
      deck: this.gameState.cardPile.deck,
      handCards: this.gameState.cardPile.hand.getCards(),
      money: this.gameState.money,
      jokers: jokersWithSellPrice,
      lastUsedConsumable: this.gameState.lastUsedConsumable ?? undefined,
      addJoker: (rarity?: 'rare' | 'legendary'): boolean => {
        let joker: Joker;
        if (rarity) {
          // 根据指定稀有度获取对应的小丑牌
          const targetRarity = rarity === 'rare' ? JokerRarity.RARE : JokerRarity.LEGENDARY;
          joker = getRandomJokerByRarity(targetRarity);
        } else {
          // 没有指定稀有度，使用默认随机生成
          joker = getRandomJoker();
        }
        return this.gameState.addJoker(joker);
      },
      addEditionToRandomJoker: (edition: string): boolean => {
        const jokers = this.gameState.jokers;
        const eligibleJokers = jokers.filter(j => j.edition === JokerEdition.None);
        if (eligibleJokers.length === 0) return false;

        const randomIndex = Math.floor(Math.random() * eligibleJokers.length);
        const targetJoker = eligibleJokers[randomIndex];
        const actualIndex = this.gameState.jokers.indexOf(targetJoker);

        if (actualIndex >= 0) {
          const joker = this.gameState.jokers[actualIndex] as Joker;
          joker.edition = edition as any;
          return true;
        }
        return false;
      },
      destroyOtherJokers: (originalIndex?: number): number => {
        const jokers = this.gameState.jokers;
        if (jokers.length <= 1) return 0;
        // 保留复制的小丑（最后一张）和原始被复制的小丑
        const copiedJokerIndex = jokers.length - 1;
        let destroyedCount = 0;
        for (let i = jokers.length - 1; i >= 0; i--) {
          if (i !== copiedJokerIndex && i !== originalIndex) {
            const joker = jokers[i] as Joker;
            if (joker.sticker !== 'eternal') {
              this.gameState.removeJoker(i);
              destroyedCount++;
            }
          }
        }
        return destroyedCount;
      },
      copyRandomJoker: (): { success: boolean; copiedJokerName?: string; originalIndex?: number } => {
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
        return {
          success,
          copiedJokerName: success ? clonedJoker.name : undefined,
          originalIndex: randomIndex
        };
      }
    };
  }

  /**
   * 处理消耗牌使用结果
   */
  handleResult(result: ConsumableEffectResult, consumableId: string, consumableType: string): void {
    if (!result.success) return;

    // 处理金钱设置（优先级高于 moneyChange）
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
      this.gameState.handLevelState.upgradeHand(result.handTypeUpgrade as any);
    }

    // 处理黑洞牌升级所有牌型
    if (result.upgradeAllHandLevels) {
      this.gameState.handLevelState.upgradeAll();
    }

    // 处理被摧毁的卡牌（如火祭/使魔/冷酷/咒语/倒吊人摧毁的卡牌）
    if (result.destroyedCards && result.destroyedCards.length > 0) {
      const handCards = this.gameState.cardPile.hand.getCards();
      const indicesToRemove: number[] = [];

      // 检查是否有卡尼奥小丑牌，统计摧毁的人头牌数量
      const canioJoker = this.gameState.jokers.find(j => j.id === 'canio');
      let destroyedFaceCardCount = 0;

      // 获取当前小丑牌列表，用于判断是否为"人头牌"（考虑幻想性错觉效果）
      const jokers = this.gameState.jokers;

      for (const card of result.destroyedCards) {
        const index = handCards.findIndex(c => c === card);
        if (index !== -1) {
          indicesToRemove.push(index);
        }
        // 统计人头牌数量（使用JokerSystem.isFaceCard考虑幻想性错觉效果）
        if (JokerSystem.isFaceCard(card, jokers)) {
          destroyedFaceCardCount++;
        }
      }

      // 更新卡尼奥的摧毁人头牌计数
      if (canioJoker && destroyedFaceCardCount > 0) {
        const currentCount = canioJoker.getState().destroyedFaceCards || 0;
        canioJoker.updateState({ destroyedFaceCards: currentCount + destroyedFaceCardCount });
      }

      if (indicesToRemove.length > 0) {
        this.gameState.cardPile.hand.removeCards(indicesToRemove);
      }
    }

    // 处理新添加的卡牌（如使魔/冷酷/咒语添加的卡牌）
    // 这些卡牌可以突破手牌上限
    if (result.newCards && result.newCards.length > 0) {
      for (const card of result.newCards) {
        // 修复标记Boss: 新添加的人头牌也需要翻面
        const currentBoss = this.gameState.bossState.getCurrentBoss();
        if (currentBoss === 'MARK' && (card.rank === 'J' || card.rank === 'Q' || card.rank === 'K')) {
          card.setFaceDown(true);
        }
        // 使用 forceAddCard 允许突破手牌上限
        this.gameState.cardPile.hand.forceAddCard(card);
      }
    }

    // 更新最后使用的消耗牌（用于愚者效果）
    this.gameState.lastUsedConsumable = { id: consumableId, type: consumableType as any };

    // 如果是塔罗牌，更新算命先生的计数
    if (consumableType === 'tarot') {
      this.gameState.jokerSlots.updateTarotCardCount();
    }

    // 如果是行星牌，更新星座的计数
    if (consumableType === 'planet') {
      this.gameState.jokerSlots.updatePlanetCardCount();
    }
  }

  /**
   * 处理新生成的消耗牌（如女祭司生成的星球牌）
   */
  handleNewConsumables(newConsumableIds: readonly string[]): { addedCount: number; skippedCount: number } {
    let addedCount = 0;
    let skippedCount = 0;

    for (const consumableId of newConsumableIds) {
      // 不预先检查槽位，让 addConsumable 来决定是否可以添加
      // 这样负片消耗牌在槽位满时也可以添加
      const newConsumable = getConsumableById(consumableId);
      if (newConsumable) {
        const success = this.gameState.addConsumable(newConsumable);
        if (success) {
          addedCount++;
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
      }
    }

    return { addedCount, skippedCount };
  }

  /**
   * 使用消耗牌的完整流程
   */
  useConsumable(index: number): boolean {
    const consumables = this.gameState.consumables;
    if (index < 0 || index >= consumables.length) return false;

    const consumable = consumables[index];
    const context = this.createContext();

    // 检查是否可以使用
    const canUse = consumable.canUse(context);
    if (!canUse) {
      this.callbacks?.onToast?.('当前条件不满足，无法使用此消耗牌', 'warning');
      return false;
    }

    // 使用消耗牌
    const result = consumable.use(context);

    if (result.success) {
      // 处理结果
      this.handleResult(result, consumable.id, consumable.type);

      // 修复: 先移除使用的消耗牌，释放槽位，再添加新生成的消耗牌
      this.gameState.removeConsumable(index);

      // 处理新生成的消耗牌
      if (result.newConsumableIds && result.newConsumableIds.length > 0) {
        const { addedCount, skippedCount } = this.handleNewConsumables(result.newConsumableIds);

        if (skippedCount > 0) {
          this.callbacks?.onToast?.(
            `生成${result.newConsumableIds.length}张消耗牌，成功添加${addedCount}张，${skippedCount}张因槽位已满被跳过`,
            'warning'
          );
        } else {
          this.callbacks?.onToast?.(`成功生成${addedCount}张消耗牌`, 'success');
        }
      }

      // 修复: 处理愚者塔罗牌复制效果
      if (result.copiedConsumableId) {
        const copiedConsumable = getConsumableById(result.copiedConsumableId);
        if (copiedConsumable) {
          // 递归调用复制的效果
          const copyResult = copiedConsumable.use(context);
          if (copyResult.success) {
            // 更新最后使用的消耗牌为被复制的卡牌（用于连续使用愚者）
            this.gameState.lastUsedConsumable = { id: copiedConsumable.id, type: copiedConsumable.type };

            this.handleResult(copyResult, copiedConsumable.id, copiedConsumable.type);
            // 处理复制效果中的新生成消耗牌
            if (copyResult.newConsumableIds && copyResult.newConsumableIds.length > 0) {
              const { addedCount, skippedCount } = this.handleNewConsumables(copyResult.newConsumableIds);
              if (skippedCount > 0) {
                this.callbacks?.onToast?.(
                  `复制效果生成${copyResult.newConsumableIds.length}张消耗牌，成功添加${addedCount}张，${skippedCount}张因槽位已满被跳过`,
                  'warning'
                );
              } else {
                this.callbacks?.onToast?.(`复制效果成功生成${addedCount}张消耗牌`, 'success');
              }
            }
          }
        }
      }

      // 显示成功消息
      if (result.message && (!result.newConsumableIds || result.newConsumableIds.length === 0) && !result.copiedConsumableId) {
        this.callbacks?.onToast?.(result.message, 'success');
      }

      this.callbacks?.onRender?.();
      return true;
    } else {
      this.callbacks?.onToast?.(result.message || '使用失败', 'error');
      return false;
    }
  }
}
