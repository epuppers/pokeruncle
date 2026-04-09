export const SYSTEM_PROMPT = `You are an expert poker note-taker. Given OCR'd hand history from GGPoker, output a SHORT player note (max 100 chars) about the villain.

Rules:
1. Focus on exploitable tendencies only
2. Format: "<position> <action summary>; <read>"
3. Output ONLY the note — no explanation, no quotes, no prefix
4. If nothing notable, output exactly: standard line
5. For multiway pots, note the most notable villain
6. OCR may contain errors or Russian labels (Рейз=Raise, Фолд=Fold, Колл=Call, Ставка=Bet, Чек=Check, Олл-ин=All-in)

Tendency categories to watch for: overcalling, bluff frequency, sizing tells, positional leaks, passive play, aggro lines.`

export interface FewShotExample {
  input: string
  output: string
}

/**
 * 6 few-shot examples (one per main category) sent as user/assistant message pairs.
 * These teach the model the input→output mapping more effectively than inline examples.
 */
export const FEW_SHOT_EXAMPLES: FewShotExample[] = [
  // Overcalling
  {
    input: `Rush & Cash $0.05/$0.10 - Hand #RC9999901
Blinds        Preflop $0.15    Flop $0.60     Turn $1.80     River $5.40
              CO Рейз $0.25
              BB Колл $0.25
              Flop: A♠9♦3♣
              CO Ставка $0.30   BB Колл $0.30
              Turn: 6♥
              CO Ставка $0.90   BB Колл $0.90
              River: 2♦
              CO Ставка $2.70   BB Колл $2.70
Showdown: CO shows A♣K♠, BB shows K♦T♣ (K high)`,
    output: 'BB call 3 streets OOP w/ KTo; huge station, never folds',
  },
  // Bluff spots
  {
    input: `Rush & Cash $0.10/$0.25 - Hand #RC9999902
Blinds        Preflop $0.35    Flop $1.50
              BTN Рейз $0.60   BB Колл $0.60
              Flop: Q♠8♦3♣
              BB Чек   BTN Ставка $0.75   BB Колл $0.75
              Turn: 5♥
              BB Чек   BTN Ставка $2.00   BB Рейз $6.50
              BTN Фолд
BB shows 7♠6♠ (no pair)`,
    output: 'BB turn c/r bluff w/ 76s; capable bluffer, uses scare cards',
  },
  // Sizing tells
  {
    input: `Rush & Cash $0.05/$0.10 - Hand #RC9999903
Blinds        Preflop $0.15
              MP Рейз $0.25   BTN Колл $0.25
              Flop: J♠8♣3♦
              MP Ставка $0.10   BTN Колл $0.10
              Turn: 2♥
              MP Ставка $0.10   BTN Колл $0.10
              River: 5♦
              MP Ставка $0.10   BTN Колл $0.10
Showdown: MP shows J♥J♦ (set), BTN shows A♠J♣`,
    output: 'MP min-bet 3 streets w/ set; tiny sizing = monster tell',
  },
  // Positional leaks
  {
    input: `Rush & Cash $0.05/$0.10 - Hand #RC9999904
Blinds        Preflop $0.15
              UTG Колл $0.10   MP Фолд   CO Фолд   BTN Фолд
              SB Рейз $0.40   BB Фолд
              UTG Колл $0.40
              Flop: T♠7♣2♦
              SB Ставка $0.50   UTG Колл $0.50
              Turn: K♥
              SB Ставка $1.20   UTG Фолд`,
    output: 'UTG open limp then flat raise; passive preflop, wide limp range',
  },
  // Passive play
  {
    input: `Rush & Cash $0.10/$0.25 - Hand #RC9999905
Blinds        Preflop $0.35
              CO Рейз $0.60   BTN Колл $0.60
              Flop: A♠T♦5♣
              CO Ставка $0.80   BTN Колл $0.80
              Turn: K♥
              CO Ставка $2.00   BTN Колл $2.00
              River: 3♦
              CO Чек   BTN Чек
Showdown: CO shows Q♠J♠, BTN shows A♥K♣ (two pair)`,
    output: 'BTN flat 2pair never raises; very passive, misses value',
  },
  // Aggro lines
  {
    input: `Rush & Cash $0.05/$0.10 - Hand #RC9999906
Blinds        Preflop $0.15
              UTG Рейз $0.30   MP Фолд   CO Фолд
              BTN 3bet $1.00   SB Фолд   BB Фолд
              UTG 4bet $2.50   BTN 5bet Олл-ин $10.00
              UTG Колл $10.00
Showdown: UTG shows A♠A♥, BTN shows Q♠J♣`,
    output: 'BTN 5b shove w/ QJo; spewy, massively overplays broadway',
  },
]
