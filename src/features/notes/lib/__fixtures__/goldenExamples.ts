import type { GoldenExample } from '../../types'

/**
 * 24 golden examples for LLM prompt tuning and quality testing.
 * Each contains realistic GGPoker OCR text + the ideal player note.
 */
export const GOLDEN_EXAMPLES: GoldenExample[] = [
  // ── Overcalling (4) ──────────────────────────────────────────────

  {
    id: 'overcall-01',
    category: 'overcalling',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1234567
Blinds        Preflop $0.15    Flop $0.45     Turn $1.35     River $4.05
              UTG              UTG             UTG            UTG
              Рейз $0.30      Ставка $0.45    Ставка $1.35   Ставка $4.05
              BB               BB              BB             BB
              Колл $0.30      Колл $0.45      Колл $1.35     Колл $4.05
Showdown: UTG shows A♠K♠ (top pair), BB shows J♣8♣ (missed flush draw)`,
    idealNote: 'BB call 3 streets OOP w/ J8s missed FD; station, wide calls',
    requiredSubstrings: ['BB', 'call'],
  },

  {
    id: 'overcall-02',
    category: 'overcalling',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC2345678
Blinds        Preflop $0.15    Flop $0.50     Turn $1.50
              CO               CO              CO
              Рейз $0.25      Ставка $0.50    Ставка $1.50
              BTN              BTN             BTN
              Колл $0.25      Колл $0.50      Колл $1.50
              SB               SB
              3bet $0.80       Фолд
              CO Колл $0.80
              BTN Колл $0.80
Showdown: CO shows Q♠Q♥, BTN shows T♦9♦ (pair of tens)`,
    idealNote: 'BTN cold call 3b w/ T9s then call 2 streets; wide continue',
    requiredSubstrings: ['BTN', 'call'],
  },

  {
    id: 'overcall-03',
    category: 'overcalling',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC3456789
Blinds        Preflop $0.35    Flop $1.50     Turn $4.50     River
              MP               MP              MP
              Рейз $0.75      Ставка $1.00    Ставка $3.00   Олл-ин $8.50
              CO               CO              CO             CO
              Колл $0.75      Колл $1.00      Колл $3.00     Колл $8.50
Showdown: MP shows K♠K♥, CO shows 7♠6♠ (busted straight draw)`,
    idealNote: 'CO call off stack w/ 76s busted draw; huge station, no fold btn',
    requiredSubstrings: ['CO', 'call'],
  },

  {
    id: 'overcall-04',
    category: 'overcalling',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC4567890
Blinds        Preflop $0.15    Flop $0.60
              UTG Рейз $0.30
              MP Колл $0.30
              CO 3bet $1.00
              UTG Фолд
              MP Колл $1.00
              Flop: A♠K♦2♣
              CO Ставка $0.60   MP Колл $0.60
              Turn: 7♥
              CO Ставка $1.80   MP Колл $1.80
              River: 3♦
              CO Чек            MP Чек
Showdown: CO shows Q♠Q♥, MP shows 8♠8♥`,
    idealNote: 'MP flat 3b w/ 88 then call AK2 board 2 streets; overcalling',
    requiredSubstrings: ['MP', 'call', '88'],
  },

  // ── Bluff Spots (3) ─────────────────────────────────────────────

  {
    id: 'bluff-01',
    category: 'bluff-spots',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC5678901
Blinds        Preflop $0.35    Flop $1.50     Turn $4.50     River $13.50
              BTN              BTN             BTN            BTN
              Рейз $0.60      Ставка $0.75    Ставка $2.25   Ставка $8.00
              BB               BB              BB             BB
              Колл $0.60      Колл $0.75      Колл $2.25     Рейз $22.00
              BTN Фолд
BB shows 9♠7♠ (no pair, busted draw)`,
    idealNote: 'BB river x/r bluff w/ 97s busted draw; capable bluffer',
    requiredSubstrings: ['BB', 'bluff'],
  },

  {
    id: 'bluff-02',
    category: 'bluff-spots',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC6789012
Blinds        Preflop $0.15    Flop $0.30     Turn $0.90
              CO Рейз $0.25
              BTN Колл $0.25
              Flop: K♠T♦4♣
              CO Чек           BTN Ставка $0.15    CO Колл $0.15
              Turn: 2♥
              CO Чек           BTN Ставка $0.45    CO Колл $0.45
              River: 8♦
              CO Чек           BTN Ставка $1.50    CO Фолд
BTN shows 6♣5♣ (no pair)`,
    idealNote: 'BTN triple barrel bluff w/ 65s on K-high; aggressive, will bluff 3 streets',
    requiredSubstrings: ['BTN', 'bluff'],
  },

  {
    id: 'bluff-03',
    category: 'bluff-spots',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC7890123
Blinds        Preflop $0.35    Flop $2.00
              UTG Рейз $0.75
              CO 3bet $2.50
              UTG Колл $2.50
              Flop: Q♥J♦3♣
              UTG Чек         CO Ставка $1.80     UTG Колл $1.80
              Turn: 5♠
              UTG Чек         CO Ставка $5.50     UTG Фолд
CO shows 8♥7♥ (no pair)`,
    idealNote: 'CO 3b + double barrel bluff w/ 87s; 3bets light, aggressive postflop',
    requiredSubstrings: ['CO', '3b'],
  },

  // ── Sizing Tells (3) ────────────────────────────────────────────

  {
    id: 'sizing-01',
    category: 'sizing-tells',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC8901234
Blinds        Preflop $0.15    Flop $0.60     Turn $1.00     River $1.60
              MP Рейз $0.25
              BTN Колл $0.25
              BB Колл $0.25
              Flop: A♠8♦3♣
              BB Чек   MP Ставка $0.30   BTN Фолд   BB Колл $0.30
              Turn: K♥
              BB Чек   MP Ставка $0.20   BB Колл $0.20
              River: 2♦
              BB Чек   MP Ставка $0.10   BB Колл $0.10
Showdown: MP shows A♣A♥ (set of aces), BB shows A♦T♣`,
    idealNote: 'MP min-bet 3 streets w/ set of aces; tiny sizing = monster',
    requiredSubstrings: ['MP', 'min'],
  },

  {
    id: 'sizing-02',
    category: 'sizing-tells',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC9012345
Blinds        Preflop $0.35    Flop $1.50
              CO Рейз $0.60
              BTN Колл $0.60
              Flop: T♠9♥4♦
              CO Ставка $0.75   BTN Колл $0.75
              Turn: 2♣
              CO Чек            BTN Чек
              River: 7♠
              CO Ставка $4.50   BTN Фолд
CO shows J♠8♠ (straight)`,
    idealNote: 'CO x turn then 3x pot overbet river w/ straight; overbet = nuts',
    requiredSubstrings: ['CO', 'overbet'],
  },

  {
    id: 'sizing-03',
    category: 'sizing-tells',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1123456
Blinds        Preflop $0.15
              UTG Рейз $0.20
              MP Колл $0.20
              Flop: K♦Q♠5♣
              UTG Ставка $0.10   MP Рейз $0.55   UTG Колл $0.55
              Turn: 8♥
              UTG Чек   MP Ставка $1.20   UTG Колл $1.20
              River: 3♦
              UTG Чек   MP Олл-ин $3.80   UTG Колл $3.80
Showdown: MP shows K♠Q♥ (two pair), UTG shows K♣J♣`,
    idealNote: 'MP min-raise flop then overbet shove river w/ 2pair; big sizing = value',
    requiredSubstrings: ['MP', 'sizing'],
  },

  // ── Positional Leaks (3) ────────────────────────────────────────

  {
    id: 'position-01',
    category: 'positional-leaks',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC2234567
Blinds        Preflop $0.15
              UTG Колл $0.10
              MP Фолд   CO Фолд   BTN Фолд
              SB Колл $0.10
              BB Рейз $0.50
              UTG Колл $0.50
              SB Фолд
              Flop: J♦7♣2♠
              BB Ставка $0.50   UTG Колл $0.50
              Turn: 4♥
              BB Ставка $1.20   UTG Фолд`,
    idealNote: 'UTG open limp then call raise; passive preflop, likely weak range',
    requiredSubstrings: ['UTG', 'limp'],
  },

  {
    id: 'position-02',
    category: 'positional-leaks',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC3345678
Blinds        Preflop $0.35
              UTG Рейз $0.60
              MP Фолд   CO Фолд   BTN Фолд
              SB Колл $0.60
              BB Фолд
              Flop: A♠T♦6♣
              SB Чек   UTG Ставка $0.50   SB Колл $0.50
              Turn: 3♥
              SB Чек   UTG Ставка $1.50   SB Колл $1.50
              River: K♠
              SB Чек   UTG Ставка $3.50   SB Колл $3.50
Showdown: UTG shows A♥K♦, SB shows Q♠J♣ (missed gutshot)`,
    idealNote: 'SB cold call vs UTG then call 3 streets w/ QJo; SB leak, too wide OOP',
    requiredSubstrings: ['SB', 'call'],
  },

  {
    id: 'position-03',
    category: 'positional-leaks',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC4456789
Blinds        Preflop $0.15
              UTG Фолд   MP Фолд   CO Фолд
              BTN Рейз $0.25
              SB Колл $0.25
              BB 3bet $0.90
              BTN Колл $0.90
              SB Колл $0.90
              Flop: 9♠6♦2♣
              SB Чек   BB Ставка $1.20   BTN Фолд   SB Колл $1.20
              Turn: T♥
              SB Чек   BB Ставка $3.50   SB Фолд
Showdown: BB shows A♣K♣`,
    idealNote: 'SB cold call 3b OOP then call flop; leaks chips in SB w/ marginal hands',
    requiredSubstrings: ['SB'],
  },

  // ── Passive Play (3) ────────────────────────────────────────────

  {
    id: 'passive-01',
    category: 'passive-play',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC5567890
Blinds        Preflop $0.15
              CO Рейз $0.25
              BTN Колл $0.25
              Flop: K♠T♣4♥
              CO Ставка $0.30   BTN Колл $0.30
              Turn: 7♦
              CO Ставка $0.70   BTN Колл $0.70
              River: 2♠
              CO Чек            BTN Чек
Showdown: CO shows A♦J♦, BTN shows K♥Q♣ (top pair good kicker)`,
    idealNote: 'BTN flat TP+GK never raises; passive, x back river w/ strong hand',
    requiredSubstrings: ['BTN', 'passive'],
  },

  {
    id: 'passive-02',
    category: 'passive-play',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC6678901
Blinds        Preflop $0.35
              UTG Рейз $0.60
              MP Колл $0.60
              Flop: 8♠7♠3♦
              UTG Ставка $0.80   MP Колл $0.80
              Turn: 5♠
              UTG Ставка $2.00   MP Колл $2.00
              River: 2♣
              UTG Чек            MP Чек
Showdown: UTG shows A♠A♥, MP shows 9♠6♠ (flush)`,
    idealNote: 'MP flat flush on turn + check back river; very passive, misses value',
    requiredSubstrings: ['MP', 'passive'],
  },

  {
    id: 'passive-03',
    category: 'passive-play',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC7789012
Blinds        Preflop $0.15
              MP Рейз $0.25
              CO Колл $0.25
              BTN Колл $0.25
              Flop: A♠A♦5♣
              MP Ставка $0.40   CO Колл $0.40   BTN Фолд
              Turn: K♥
              MP Ставка $1.00   CO Колл $1.00
              River: 9♦
              MP Чек   CO Чек
Showdown: MP shows Q♠Q♥, CO shows A♣T♣ (trips)`,
    idealNote: 'CO flat trips never raise; extremely passive, only calls w/ monsters',
    requiredSubstrings: ['CO', 'passive'],
  },

  // ── Aggro Lines (3) ─────────────────────────────────────────────

  {
    id: 'aggro-01',
    category: 'aggro-lines',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC8890123
Blinds        Preflop $0.15
              UTG Рейз $0.30
              MP Фолд   CO Фолд   BTN Фолд
              SB Фолд
              BB 3bet $1.00
              UTG 4bet $2.50
              BB 5bet Олл-ин $10.00
              UTG Колл $10.00
Showdown: UTG shows A♠A♥, BB shows K♣J♠`,
    idealNote: 'BB 5b shove w/ KJo vs UTG open; spewy, massively overplays broadway',
    requiredSubstrings: ['BB', 'KJ'],
  },

  {
    id: 'aggro-02',
    category: 'aggro-lines',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC9901234
Blinds        Preflop $0.35
              CO Рейз $0.60
              BTN Колл $0.60
              Flop: Q♠9♦4♣
              CO Чек   BTN Чек
              Turn: 6♥
              CO Чек   BTN Чек
              River: 2♠
              CO Чек   BTN Ставка $1.20
              CO Колл $1.20
BTN shows 8♠3♠ (no pair)`,
    idealNote: 'BTN delayed river stab w/ 83s after 2 checks; stabs at weakness',
    requiredSubstrings: ['BTN', 'stab'],
  },

  {
    id: 'aggro-03',
    category: 'aggro-lines',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1012345
Blinds        Preflop $0.15
              UTG Колл $0.10
              MP Фолд   CO Фолд   BTN Фолд
              SB Колл $0.10
              BB Чек
              Flop: J♣8♦5♠
              SB Чек   BB Чек   UTG Ставка $0.15
              SB Фолд  BB Рейз $0.55   UTG Рейз $1.50
              BB Колл $1.50
              Turn: 2♥
              BB Чек   UTG Олл-ин $3.50   BB Фолд
UTG shows T♦9♣ (gutshot)`,
    idealNote: 'UTG limp then 3b flop + shove turn w/ gutshot; limp-trap aggro, spewy',
    requiredSubstrings: ['UTG', 'limp'],
  },

  // ── Edge: Standard Line (2) ─────────────────────────────────────

  {
    id: 'standard-01',
    category: 'standard-line',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1112345
Blinds        Preflop $0.15
              CO Рейз $0.25
              BTN Фолд   SB Фолд   BB Фолд`,
    idealNote: 'standard line',
    requiredSubstrings: ['standard'],
  },

  {
    id: 'standard-02',
    category: 'standard-line',
    ocrText: `Rush & Cash $0.10/$0.25 - Hand #RC1212345
Blinds        Preflop $0.35
              UTG Рейз $0.60
              MP 3bet $2.00
              UTG Колл $2.00
              Flop: A♠K♦7♣
              UTG Чек   MP Ставка $1.50   UTG Фолд
Showdown: MP shows A♥Q♥`,
    idealNote: 'standard line',
    requiredSubstrings: ['standard'],
  },

  // ── Edge: Multiway (1) ──────────────────────────────────────────

  {
    id: 'multiway-01',
    category: 'multiway',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1312345
Blinds        Preflop $0.15
              UTG Колл $0.10   MP Колл $0.10   CO Колл $0.10
              BTN Рейз $0.60
              SB Фолд   BB Фолд
              UTG Колл $0.60   MP Колл $0.60   CO Колл $0.60
              Flop: Q♠9♣3♥
              UTG Чек   MP Чек   CO Чек
              BTN Ставка $1.50
              UTG Колл $1.50   MP Фолд   CO Колл $1.50
              Turn: 4♦
              UTG Чек   CO Чек
              BTN Ставка $4.00
              UTG Колл $4.00   CO Фолд
              River: J♥
              UTG Чек   BTN Ставка $8.00   UTG Колл $8.00
Showdown: BTN shows A♠A♥, UTG shows 5♣4♣ (pair of fours)`,
    idealNote: 'UTG limp-call then call 3 streets multiway w/ 54s; massive station',
    requiredSubstrings: ['UTG', 'call'],
  },

  // ── Edge: All-in Preflop (1) ────────────────────────────────────

  {
    id: 'allin-preflop-01',
    category: 'allin-preflop',
    ocrText: `Rush & Cash $0.05/$0.10 - Hand #RC1412345
Blinds        Preflop $0.15
              UTG Рейз $0.30
              MP Фолд   CO Фолд   BTN Фолд   SB Фолд
              BB 3bet $1.00
              UTG 4bet $2.50
              BB Олл-ин $10.00
              UTG Колл $10.00
Showdown: UTG shows K♠K♥, BB shows A♣K♦`,
    idealNote: 'standard line',
    requiredSubstrings: ['standard'],
  },

  // ── Edge: Garbled OCR (1) ───────────────────────────────────────

  {
    id: 'garbled-01',
    category: 'garbled-ocr',
    ocrText: `Rush & Cash $O.O5/$O.1O - Hand #RC15I2345
BIinds        PrefIop $0.l5    FIop $0.60
              CO Peйз $O.25
              BTN KoлI $0.25
              FIop: K♠T♦4♣
              CO Cтaвкa $0.30   BTN KoлI $0.30
              Turn: 7♥
              CO Cтaвкa $0.70   BTN KoлI $0.70
              River: 2♠
              CO Cтaвкa $2.l0   BTN Peйз $6.50
              CO ФoIд
BTN shows 8♠3♠ (no pair, 8 high)`,
    idealNote: 'BTN river raise bluff w/ 83s; will bluff raise rivers',
    requiredSubstrings: ['BTN', 'bluff'],
  },
]
