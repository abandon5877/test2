import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';
import { ScoringSystem } from '../systems/ScoringSystem';
import { PokerHandType } from '../types/pokerHands';

describe('回归测试: 高举拳头和特技演员组合 - 一次出掉所有手牌', () => {
  it('当一次出掉所有手牌时，特技演员的+250筹码应该仍然生效', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    const stuntman = getJokerById('stuntman')!;
    jokerSlots.addJoker(raisedFist);
    jokerSlots.addJoker(stuntman);

    // 打出3张牌（一次出掉所有手牌）
    const playedCards = [
      new Card(Suit.Hearts, Rank.Two),
      new Card(Suit.Diamonds, Rank.Three),
      new Card(Suit.Clubs, Rank.Four),
    ];

    // 手牌为空（因为一次出掉了所有牌）
    const heldCards: Card[] = [];

    // 计算得分
    const result = ScoringSystem.calculate(
      playedCards,
      PokerHandType.HighCard,
      { money: 0, interestCap: 0, hands: 0, discards: 0 },
      heldCards,
      jokerSlots
    );

    // 特技演员应该提供+250筹码
    const stuntmanEffect = result.jokerEffects?.find(e => e.jokerName === '特技演员');
    expect(stuntmanEffect).toBeDefined();
    expect(stuntmanEffect?.chipBonus).toBe(250);

    // 总筹码应该包含特技演员的+250
    // 卡牌筹码: 2+3+4=9, 特技演员: +250
    // 总筹码应该是 9 + 250 = 259
    expect(result.totalChips).toBe(259);
  });

  it('processIndependent应该始终触发ON_INDEPENDENT小丑，无论手牌是否为空', () => {
    const jokerSlots = new JokerSlots(5);
    const stuntman = getJokerById('stuntman')!;
    jokerSlots.addJoker(stuntman);

    // 测试空heldCards时processIndependent应该返回特技演员效果
    const independentResult = JokerSystem.processIndependent(jokerSlots, []);

    // 特技演员应该提供+250筹码
    expect(independentResult.chipBonus).toBe(250);
    expect(independentResult.effects.some(e => e.jokerName === '特技演员')).toBe(true);
  });

  it('processIndependent在有手牌时也应该正确触发', () => {
    const jokerSlots = new JokerSlots(5);
    const stuntman = getJokerById('stuntman')!;
    jokerSlots.addJoker(stuntman);

    // 测试有heldCards时processIndependent应该返回特技演员效果
    const heldCards = [new Card(Suit.Hearts, Rank.Ace)];
    const independentResult = JokerSystem.processIndependent(jokerSlots, heldCards);

    // 特技演员应该提供+250筹码
    expect(independentResult.chipBonus).toBe(250);
    expect(independentResult.effects.some(e => e.jokerName === '特技演员')).toBe(true);
  });

  it('processHeld不应该处理ON_INDEPENDENT触发器', () => {
    const jokerSlots = new JokerSlots(5);
    const stuntman = getJokerById('stuntman')!;
    jokerSlots.addJoker(stuntman);

    // 测试processHeld不应该返回特技演员效果（因为特技演员是ON_INDEPENDENT）
    const heldResult = JokerSystem.processHeld(jokerSlots, []);

    // processHeld不应该处理特技演员
    expect(heldResult.chipBonus).toBe(0);
    expect(heldResult.effects.some(e => e.jokerName === '特技演员')).toBe(false);
  });

  it('高举拳头在空heldCards时不应该提供倍率加成', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 测试空heldCards时高举拳头不应该提供倍率
    const heldResult = JokerSystem.processHeld(jokerSlots, []);

    // 高举拳头在没有heldCards时不应该提供倍率
    expect(heldResult.multBonus).toBe(0);
  });

  it('高举拳头和特技演员组合 - 有手牌时两者都应该生效', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    const stuntman = getJokerById('stuntman')!;
    jokerSlots.addJoker(raisedFist);
    jokerSlots.addJoker(stuntman);

    // 打出2张牌
    const playedCards = [
      new Card(Suit.Hearts, Rank.Ten),
      new Card(Suit.Diamonds, Rank.Jack),
    ];

    // 手牌剩1张（A，算作11点）
    const heldCards = [
      new Card(Suit.Clubs, Rank.Ace),
    ];

    // 计算得分
    const result = ScoringSystem.calculate(
      playedCards,
      PokerHandType.HighCard,
      { money: 0, interestCap: 0, hands: 0, discards: 0 },
      heldCards,
      jokerSlots
    );

    // 特技演员应该提供+250筹码
    const stuntmanEffect = result.jokerEffects?.find(e => e.jokerName === '特技演员');
    expect(stuntmanEffect).toBeDefined();
    expect(stuntmanEffect?.chipBonus).toBe(250);

    // 高举拳头应该提供11*2=22倍率
    const raisedFistEffect = result.jokerEffects?.find(e => e.jokerName === '高举拳头');
    expect(raisedFistEffect).toBeDefined();
    expect(raisedFistEffect?.multBonus).toBe(22);
  });
});
