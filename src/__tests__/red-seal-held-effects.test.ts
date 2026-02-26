import { describe, it, expect } from 'vitest';
import { Card } from '../models/Card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { JokerSlots } from '../models/JokerSlots';
import { Suit, Rank, CardEnhancement, SealType } from '../types/card';
import { getJokerById } from '../data/jokers';
import { JokerSystem } from '../systems/JokerSystem';

describe('红蜡封与手持效果互动测试', () => {
  describe('1. 红蜡封与钢铁牌（Steel）', () => {
    it('红蜡封应让手持钢铁牌效果触发两次', () => {
      // 打出一张牌
      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有一张钢铁牌带红蜡封
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.King), {
          enhancement: CardEnhancement.Steel,
          seal: SealType.Red
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards);

      // 钢铁牌 ×1.5，红蜡封触发两次 = ×1.5 × 1.5 = ×2.25
      expect(result.heldMultMultiplier).toBeCloseTo(2.25, 2);
    });

    it('多张钢铁牌中部分带红蜡封应正确计算', () => {
      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有两张钢铁牌，一张带红蜡封，一张不带
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.King), {
          enhancement: CardEnhancement.Steel,
          seal: SealType.Red
        }),
        Object.assign(new Card(Suit.Diamonds, Rank.Queen), {
          enhancement: CardEnhancement.Steel,
          seal: SealType.None
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards);

      // 红蜡封钢铁牌：效果触发2次（×1.5^2）
      // 普通钢铁牌：效果触发1次（×1.5）
      // 总计：×1.5^(2+1) = ×1.5^3 = ×3.375
      expect(result.heldMultMultiplier).toBeCloseTo(3.375, 2);
    });
  });

  describe('2. 红蜡封与男爵（Baron）', () => {
    it('红蜡封应让手牌中的K效果触发两次', () => {
      const jokerSlots = new JokerSlots(5);
      const baron = getJokerById('baron')!;
      jokerSlots.addJoker(baron);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有一张K带红蜡封
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.King), {
          seal: SealType.Red
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      const baronEffect = result.jokerEffects!.find(e => e.jokerName === '男爵');
      expect(baronEffect).toBeDefined();
      // 红蜡封让K的效果触发两次：×1.5 × 1.5 = ×2.25
      expect(baronEffect!.multMultiplier).toBeCloseTo(2.25, 2);
    });

    it('多张K中部分带红蜡封应正确计算', () => {
      const jokerSlots = new JokerSlots(5);
      const baron = getJokerById('baron')!;
      jokerSlots.addJoker(baron);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有两张K，一张带红蜡封，一张不带
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.King), {
          seal: SealType.Red
        }),
        Object.assign(new Card(Suit.Diamonds, Rank.King), {
          seal: SealType.None
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      const baronEffect = result.jokerEffects!.find(e => e.jokerName === '男爵');
      expect(baronEffect).toBeDefined();
      // 红蜡封K：效果触发2次（×1.5^2）
      // 普通K：效果触发1次（×1.5）
      // 总计：×1.5^(2+1) = ×1.5^3 = ×3.375
      expect(baronEffect!.multMultiplier).toBeCloseTo(3.375, 2);
    });
  });

  describe('3. 红蜡封与射月（Shoot the Moon）', () => {
    it('红蜡封应让手牌中的Q效果触发两次', () => {
      const jokerSlots = new JokerSlots(5);
      const shootTheMoon = getJokerById('shoot_the_moon')!;
      jokerSlots.addJoker(shootTheMoon);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有一张Q带红蜡封
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.Queen), {
          seal: SealType.Red
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      const effect = result.jokerEffects!.find(e => e.jokerName === '射月');
      expect(effect).toBeDefined();
      // 红蜡封让Q的效果触发两次：13 × 2 = 26倍率
      expect(effect!.multBonus).toBe(26);
    });
  });

  describe('4. 红蜡封与高举拳头（Raised Fist）', () => {
    it('红蜡封应让最低牌效果触发两次', () => {
      const jokerSlots = new JokerSlots(5);
      const raisedFist = getJokerById('raised_fist')!;
      jokerSlots.addJoker(raisedFist);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有一张2（最低牌）带红蜡封
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.Two), {
          seal: SealType.Red
        }),
        new Card(Suit.Diamonds, Rank.King)
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      const effect = result.jokerEffects!.find(e => e.jokerName === '高举拳头');
      expect(effect).toBeDefined();
      // 最低牌是2（2点），红蜡封让效果触发两次：2 × 2 × 2 = 8倍率
      expect(effect!.multBonus).toBe(8);
    });

    it('非最低牌带红蜡封不应影响效果', () => {
      const jokerSlots = new JokerSlots(5);
      const raisedFist = getJokerById('raised_fist')!;
      jokerSlots.addJoker(raisedFist);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中K带红蜡封，但2是最低牌
      const heldCards = [
        new Card(Suit.Hearts, Rank.Two),
        Object.assign(new Card(Suit.Diamonds, Rank.King), {
          seal: SealType.Red
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      const effect = result.jokerEffects!.find(e => e.jokerName === '高举拳头');
      expect(effect).toBeDefined();
      // 最低牌是2（2点），没有红蜡封：2 × 2 = 4倍率
      expect(effect!.multBonus).toBe(4);
    });
  });

  describe('5. 红蜡封与哑剧演员（Mime）组合', () => {
    it('红蜡封与哑剧演员应叠加效果', () => {
      const jokerSlots = new JokerSlots(5);
      const mime = getJokerById('mime')!;
      jokerSlots.addJoker(mime);

      const playedCards = [new Card(Suit.Spades, Rank.Ace)];

      // 手牌中有一张钢铁牌带红蜡封
      const heldCards = [
        Object.assign(new Card(Suit.Hearts, Rank.King), {
          enhancement: CardEnhancement.Steel,
          seal: SealType.Red
        })
      ];

      const result = ScoringSystem.calculate(playedCards, undefined, undefined, heldCards, jokerSlots);

      // 钢铁牌基础：×1.5
      // 红蜡封：效果触发2次
      // 哑剧演员：效果额外触发1次（总共3次）
      // 总计：×1.5 ^ (2 × 2) = ×1.5 ^ 4 = ×5.0625
      // 注意：红蜡封让钢铁牌效果触发2次，哑剧演员再让所有手牌效果额外触发1次
      // 所以钢铁牌效果触发：2 × 2 = 4次
      expect(result.heldMultMultiplier).toBeCloseTo(5.06, 1);
    });
  });
});
