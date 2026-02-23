import { describe, it, expect, beforeEach } from 'vitest';
import { getConsumableById } from '../data/consumables';
import type { ConsumableEffectContext } from '../types/consumable';

describe('节制(Temperance)塔罗牌测试', () => {
  const createContext = (jokers: ConsumableEffectContext['jokers'] = []): ConsumableEffectContext => ({
    jokers,
    selectedCards: [],
    gameState: {
      money: 10,
      hands: 4,
      discards: 3
    }
  });

  it('应该正确创建节制塔罗牌', () => {
    const temperance = getConsumableById('tarot_temperance');
    expect(temperance).toBeDefined();
    expect(temperance?.name).toBe('节制');
    expect(temperance?.description).toBe('获得当前所有小丑牌总售价的资金（最多$50）');
  });

  it('没有小丑牌时应该返回0资金', () => {
    const temperance = getConsumableById('tarot_temperance')!;
    const context = createContext([]);
    
    const result = temperance.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(0);
    expect(result.message).toBe('节制: 没有小丑牌');
  });

  it('应该正确计算小丑牌总售价', () => {
    const temperance = getConsumableById('tarot_temperance')!;
    
    // 添加一些小丑牌到上下文
    const context = createContext([
      { edition: 'none', hasEdition: false, sellPrice: 3, sticker: 'none' }, // cost 6
      { edition: 'none', hasEdition: false, sellPrice: 2, sticker: 'none' }, // cost 4
      { edition: 'none', hasEdition: false, sellPrice: 4, sticker: 'none' }  // cost 8
    ]);
    
    const result = temperance.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(9); // 3 + 2 + 4 = 9
    expect(result.message).toBe('节制: 获得$9（小丑牌总售价）');
  });

  it('租赁小丑牌应该只计算$1', () => {
    const temperance = getConsumableById('tarot_temperance')!;
    
    const context = createContext([
      { edition: 'none', hasEdition: false, sellPrice: 3, sticker: 'none' },
      { edition: 'none', hasEdition: false, sellPrice: 1, sticker: 'rental' }, // 租赁
      { edition: 'none', hasEdition: false, sellPrice: 4, sticker: 'none' }
    ]);
    
    const result = temperance.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(8); // 3 + 1 + 4 = 8
  });

  it('总售价超过$50时应该限制为$50', () => {
    const temperance = getConsumableById('tarot_temperance')!;
    
    // 添加很多高价小丑牌
    const context = createContext([
      { edition: 'none', hasEdition: false, sellPrice: 20, sticker: 'none' },
      { edition: 'none', hasEdition: false, sellPrice: 20, sticker: 'none' },
      { edition: 'none', hasEdition: false, sellPrice: 20, sticker: 'none' }
    ]);
    
    const result = temperance.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(50); // 被限制为50
    expect(result.message).toBe('节制: 获得$50（小丑牌总售价）');
  });

  it('售价向下取整计算', () => {
    const temperance = getConsumableById('tarot_temperance')!;
    
    // cost为5的小丑，售价应该是2（5/2=2.5，向下取整）
    const context = createContext([
      { edition: 'none', hasEdition: false, sellPrice: 2, sticker: 'none' }, // cost 5
      { edition: 'none', hasEdition: false, sellPrice: 2, sticker: 'none' }  // cost 5
    ]);
    
    const result = temperance.use(context);
    
    expect(result.success).toBe(true);
    expect(result.moneyChange).toBe(4); // 2 + 2 = 4
  });
});
