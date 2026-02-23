import { describe, it, expect } from 'vitest';
import { JokerSlots } from '../models/JokerSlots';
import { JokerSystem } from '../systems/JokerSystem';
import { getJokerById } from '../data/jokers';
import { Card } from '../models/Card';
import { Suit, Rank } from '../types/card';

describe('Raised Fist 高举拳头测试', () => {
  it('A牌应该算作11点，不是1点', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 手牌：A, 2, 3
    // A应该算作11点，最低是2点
    const heldCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Hearts, Rank.Two),
      new Card(Suit.Hearts, Rank.Three),
    ];

    const result = JokerSystem.processHeld(
      jokerSlots,
      heldCards
    );

    // 最低牌点数应该是2（不是A的1），所以倍率加成应该是2*2=4
    expect(result.multBonus).toBe(4);
    expect(result.effects.some(e => e.effect.includes('最低牌点数2'))).toBe(true);
  });

  it('只有A牌时应该算作11点', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 手牌只有A
    const heldCards = [
      new Card(Suit.Hearts, Rank.Ace),
    ];

    const result = JokerSystem.processHeld(
      jokerSlots,
      heldCards
    );

    // A算作11点，所以倍率加成应该是11*2=22
    expect(result.multBonus).toBe(22);
    expect(result.effects.some(e => e.effect.includes('最低牌点数11'))).toBe(true);
  });

  it('A和K在一起时，最低应该是K的10点', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 手牌：A, K
    const heldCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Spades, Rank.King),
    ];

    const result = JokerSystem.processHeld(
      jokerSlots,
      heldCards
    );

    // A=11, K=10，最低是10，所以倍率加成应该是10*2=20
    expect(result.multBonus).toBe(20);
    expect(result.effects.some(e => e.effect.includes('最低牌点数10'))).toBe(true);
  });

  it('多张A牌时应该都算作11点', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 手牌：A, A, A
    const heldCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Diamonds, Rank.Ace),
      new Card(Suit.Clubs, Rank.Ace),
    ];

    const result = JokerSystem.processHeld(
      jokerSlots,
      heldCards
    );

    // 所有A都算11点，所以倍率加成应该是11*2=22
    expect(result.multBonus).toBe(22);
  });

  it('边界测试：A, 2, 3, 4, 5', () => {
    const jokerSlots = new JokerSlots(5);
    const raisedFist = getJokerById('raised_fist')!;
    jokerSlots.addJoker(raisedFist);

    // 手牌：A, 2, 3, 4, 5
    const heldCards = [
      new Card(Suit.Hearts, Rank.Ace),
      new Card(Suit.Hearts, Rank.Two),
      new Card(Suit.Hearts, Rank.Three),
      new Card(Suit.Hearts, Rank.Four),
      new Card(Suit.Hearts, Rank.Five),
    ];

    const result = JokerSystem.processHeld(
      jokerSlots,
      heldCards
    );

    // A=11, 2=2, 3=3, 4=4, 5=5，最低是2，所以倍率加成应该是2*2=4
    expect(result.multBonus).toBe(4);
  });
});
