// Opening lessons: 1.e4 systems and their sharp variations.
// See ../lessons/format.md for the data format this file must follow.

export const LESSONS = [
  // ────────────────────────────── Italian Game ──────────────────────────────
  {
    id: "italian-main-ideas",
    title: "Italian Game: Main Ideas",
    category: "openings",
    group: "Italian Game",
    level: "beginner",
    eco: "C50",
    summary: "Fast development and a bishop aimed straight at f7.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        text: "The Italian Game: both sides develop toward the center, and White's bishop points straight at f7, Black's most fragile point.",
        arrows: [["c4", "f7"]],
        circles: ["f7"],
      },
      {
        text: "White's most ambitious plan is to build a broad pawn center with c3 and d4, rather than the slower d3 setup.",
      },
      {
        quiz: {
          answer: "c3",
          prompt: "Prepare the central break without blocking the knight on b1.",
          explain: "c3 supports a future d4 push and prepares to meet a bishop check on b4 with the queen's knight route via d2.",
        },
      },
      {
        play: ["Nf6"],
        text: "Black develops naturally, adding pressure on e4, which is currently undefended.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Ignore the attack on e4 and strike in the center instead.",
          explain: "d4! is the thematic break. After ...exd4 cxd4 White gets a big classical center; grabbing the e4 pawn immediately runs into tactical trouble for Black.",
        },
      },
      {
        play: ["exd4", "cxd4", "Bb4+"],
        text: "White now has a strong center. Black often checks first with ...Bb4+ to gain a tempo before White can consolidate.",
      },
      {
        quiz: {
          answer: "Nc3",
          also: ["Bd2"],
          prompt: "Block the check while developing a piece.",
          explain: "Nc3 develops toward the center and blocks the check, though the bishop on b4 pins it. Bd2 offers a calmer trade of light pieces.",
        },
      },
      {
        text: "This is a main tabiya of the Giuoco Piano. Both sides have nearly finished developing, and the middlegame fight over the center and the safety of both kings begins.",
      },
    ],
  },
  {
    id: "fried-liver-attack",
    title: "Fried Liver Attack",
    category: "openings",
    group: "Italian Game",
    level: "intermediate",
    eco: "C57",
    summary: "A knight sacrifice on f7 that drags the black king into the open.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6"],
        text: "The Two Knights Defence: Black develops the king's knight instead of mirroring with ...Bc5.",
      },
      {
        quiz: {
          answer: "Ng5",
          prompt: "Add a second attacker to f7, which is only defended by the king.",
          explain: "Ng5 attacks f7 alongside the bishop. It looks like a beginner's move — Black can simply defend — but it sets a real trap.",
        },
        arrows: [["c4", "f7"], ["g5", "f7"]],
        circles: ["f7"],
      },
      {
        play: ["d5"],
        text: "Black's best reply: hitting the bishop and the center at once.",
      },
      {
        quiz: {
          answer: "exd5",
          prompt: "Capture in the center.",
          explain: "exd5 is natural — recapturing the pawn while keeping the attack on f7 alive.",
        },
      },
      {
        text: "Black now has two main recaptures: the sound 5...Na5, hitting the bishop (see the companion lesson), or the greedy 5...Nxd5, which walks straight into a famous trap.",
      },
      {
        play: ["Nxd5"],
        text: "Following the greedy capture. f7 is now attacked twice and defended only by the king.",
        arrows: [["c4", "f7"], ["g5", "f7"]],
        circles: ["f7"],
      },
      {
        quiz: {
          answer: "Nxf7",
          strict: true,
          prompt: "White has a stunning shot on f7. Find it!",
          explain: "Nxf7! forks the queen on d8 and the rook on h8 while wrecking Black's king position — the entire point of 4.Ng5 and 5.exd5.",
        },
      },
      {
        play: ["Kxf7"],
        text: "Black must take (the fork on d8/h8 is too dangerous to ignore); the king is dragged into the open.",
      },
      {
        quiz: {
          answer: "Qf3+",
          strict: true,
          prompt: "Deliver check and hit the misplaced knight at the same time.",
          explain: "Qf3+ checks along the f-file and simultaneously attacks the knight on d5 via the f3-e4-d5 diagonal — a double blow.",
        },
      },
      {
        text: "Black must give back material or face a decisive attack on the exposed king. This is exactly why 5...Nxd5 is considered dubious today, and why 5...Na5 became the trusted main line.",
      },
    ],
  },
  {
    id: "traxler-counterattack",
    title: "Traxler Counterattack",
    category: "openings",
    group: "Italian Game",
    level: "advanced",
    eco: "C57",
    summary: "Black ignores f7 completely and counterattacks instead — pure chaos.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],
        text: "White repeats the Ng5 idea from the Fried Liver, attacking f7 a second time.",
        arrows: [["c4", "f7"], ["g5", "f7"]],
        circles: ["f7"],
      },
      {
        text: "Instead of the calm 4...d5, Black can ignore the threat entirely and counterattack — the wild Traxler Counterattack.",
      },
      {
        quiz: {
          answer: "Bc5",
          speculative: true,
          prompt: "Find Black's provocative counter, ignoring the threat to f7 completely.",
          explain: "Bc5!? counterattacks f2 and invites Nxf7. Objectively it's second best — engines prefer 4...d5 by about a pawn — but the attack it generates is genuinely dangerous over the board.",
        },
      },
      {
        play: ["Nxf7"],
        text: "White grabs the pawn, forking queen and rook — the greedy, critical test. (5.Bxf7+ is the calmer route to an edge; Nxf7 is what makes the Traxler famous.)",
        circles: ["f7"],
      },
      {
        quiz: {
          answer: "Bxf2+",
          strict: true,
          prompt: "Black has the key shot here. Find it.",
          explain: "Bxf2+! drags the king out before it can find safety — this is the defining idea of the whole Traxler.",
        },
      },
      {
        play: ["Kxf2"],
        text: "The most critical and most tested reply, walking further into Black's attack.",
      },
      {
        quiz: {
          answer: "Nxe4+",
          strict: true,
          prompt: "Continue the attack with a central fork.",
          explain: "Nxe4+ forks the exposed king, keeping the initiative rolling. Black is down material but the attack is relentless.",
        },
      },
      {
        play: ["Ke1"],
        text: "One sample main line; theory branches heavily here with checks and threats for both sides.",
      },
      {
        text: "Verdict: engines give White the better side with accurate play — this is not a refutation of Ng5. But it's a brutal practical test, and a defender who doesn't know it can be swept away. Know the lines before you fire it.",
      },
    ],
  },
  {
    id: "two-knights-na5",
    title: "Two Knights: The Sound 5...Na5",
    category: "openings",
    group: "Italian Game",
    level: "intermediate",
    eco: "C57",
    summary: "The theoretically correct answer to the Fried Liver Attack.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5", "d5", "exd5"],
        text: "The same tabiya as the Fried Liver Attack. Instead of the greedy 5...Nxd5, Black finds the accurate move.",
      },
      {
        quiz: {
          answer: "Na5",
          prompt: "Attack the bishop instead of grabbing the pawn back right away.",
          explain: "Na5! kicks the bishop and sidesteps the Nxf7 trick entirely. The knight looks offside on the rim, but the point is safety, not activity.",
        },
      },
      {
        play: ["Bb5+"],
        text: "White's bishop must move; the main line inserts a check first to gain a tempo.",
      },
      {
        quiz: {
          answer: "c6",
          prompt: "Block the check while preparing to challenge the center.",
          explain: "c6 blocks and attacks the pawn on d5. If White grabs it, Black recaptures and opens lines for the bishop pair.",
        },
      },
      {
        play: ["dxc6", "bxc6", "Be2"],
        text: "The pawns get traded and the bishop retreats. Black has full compensation: open lines, the bishop pair, and a big center coming with ...e4.",
      },
      {
        quiz: {
          answer: "h6",
          prompt: "Kick the g5 knight before it can cause more trouble.",
          explain: "h6 forces the knight to decide where to go, while Black prepares to seize the center with ...e4.",
        },
      },
      {
        play: ["Nf3"],
        text: "The knight retreats to a modest square, and Black is ready to grab space.",
      },
      {
        quiz: {
          answer: "e4",
          prompt: "Push in the center, gaining space and tempo on the knight.",
          explain: "e4 shoves the knight back again and grabs central space — the reward for the earlier accurate defense.",
        },
      },
      {
        play: ["Ne5"],
        text: "White's knight jumps to a strong outpost. Black usually continues with ...Bd6 and quick castling.",
      },
      {
        text: "White is nominally a pawn up after this whole sequence, but Black's active pieces and central space give real, well-documented compensation — this is a fully respectable way to meet the Fried Liver setup.",
      },
    ],
  },
  {
    id: "evans-gambit",
    title: "Evans Gambit",
    category: "openings",
    group: "Italian Game",
    level: "intermediate",
    eco: "C51",
    summary: "Sacrifice a wing pawn for a huge center and fast development.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        text: "From the normal Italian starting position, White can offer a gambit to seize the initiative.",
      },
      {
        quiz: {
          answer: "b4",
          prompt: "Offer a wing pawn to gain time and a big center.",
          explain: "b4!? offers a pawn; after ...Bxb4 White follows with c3 and d4, kicking the bishop around while building a massive center.",
        },
      },
      {
        play: ["Bxb4", "c3", "Ba5"],
        text: "Black accepts and retreats to a5, the most tested square, keeping an eye on the c3-d2 diagonal.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Strike in the center — the whole point of the gambit.",
          explain: "d4 rips the center open while Black's king is still uncastled and the bishop on a5 is offside.",
        },
      },
      {
        play: ["exd4", "O-O", "d6"],
        text: "White castles rather than immediately recapturing, developing with tempo. Black steers toward the calmer 'Normal Line' rather than grabbing a second pawn.",
      },
      {
        quiz: {
          answer: "cxd4",
          prompt: "Regain the pawn while keeping the strong center.",
          explain: "cxd4 restores material equality but keeps the big center and a lead in development — that lead is the real compensation the whole gambit is built on.",
        },
      },
      {
        text: "With precise defense modern engines can neutralize the Evans Gambit, but it remains a fantastic practical weapon — very few opponents remember the accurate lines at the board.",
      },
    ],
  },

  // ────────────────────────────── Ruy Lopez ──────────────────────────────
  {
    id: "ruy-lopez-morphy",
    title: "Ruy Lopez: Main Ideas & the Morphy Defence",
    category: "openings",
    group: "Ruy Lopez",
    level: "beginner",
    eco: "C84",
    summary: "The bishop pins the knight defending e5 — the oldest idea in chess.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"],
        text: "The Ruy Lopez: the bishop pins the knight that defends e5, and Black immediately questions it with the Morphy Defence, ...a6.",
        arrows: [["b5", "c6"]],
        circles: ["c6", "e5"],
      },
      {
        quiz: {
          answer: "Ba4",
          prompt: "Retreat while keeping the pin on the knight alive.",
          explain: "Ba4 keeps eyeing c6/e5 down the line. Trading immediately with Bxc6 gives up the bishop pair for very little.",
        },
      },
      {
        play: ["Nf6"],
        text: "Black develops, counterattacking e4. White typically castles rather than defend the pawn passively.",
      },
      {
        quiz: {
          answer: "O-O",
          prompt: "Castle into safety, preparing to meet the attack on e4 with a rook move.",
          explain: "O-O tucks the king away; the e4 pawn will be defended a move later with Re1.",
        },
      },
      {
        play: ["Be7"],
        text: "Black solidifies, preparing to castle next. White reinforces the center.",
      },
      {
        quiz: {
          answer: "Re1",
          prompt: "Defend e4 while activating a piece on the open file.",
          explain: "Re1 supports e4 and eyes the e-file — a recurring Ruy Lopez idea that also frees the knight from having to babysit the pawn.",
        },
      },
      {
        play: ["b5"],
        text: "Black castles soon but first grabs queenside space and gains a tempo on the bishop.",
      },
      {
        quiz: {
          answer: "Bb3",
          prompt: "Retreat, keeping the bishop aimed at the f7 diagonal.",
          explain: "Bb3 stays out of harm's way while still pointing toward f7 — a classic Ruy Lopez retreating square.",
        },
      },
      {
        play: ["d6"],
        text: "This is the main tabiya of the Closed Ruy Lopez. White follows up with c3 and d4 to build a center; Black solidifies e5 and prepares ...O-O, ...Re8, ...Bf8.",
      },
      {
        text: "The Ruy Lopez remains the most respected try for an edge against 1...e5 — patient maneuvering battles for the long-term fate of the e5/e4 pawns.",
      },
    ],
  },
  {
    id: "ruy-lopez-berlin",
    title: "Ruy Lopez: Berlin Defence Basics",
    category: "openings",
    group: "Ruy Lopez",
    level: "intermediate",
    eco: "C67",
    summary: "The solid endgame line that stopped 1.e4 in its tracks at the top level.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bb5"],
        text: "From the Ruy Lopez starting position, Black has another major option besides ...a6.",
      },
      {
        quiz: {
          answer: "Nf6",
          prompt: "Play the Berlin Defence, developing and inviting tactics on e4.",
          explain: "Unlike the Morphy Defence, the Berlin develops naturally and lets White grab the e4 pawn — that's the whole point.",
        },
      },
      {
        play: ["O-O"],
        text: "White castles, allowing the pawn grab. This is exactly what the Berlin is built around.",
      },
      {
        quiz: {
          answer: "Nxe4",
          prompt: "Grab the pawn that's on offer.",
          explain: "Nxe4 wins a pawn for a moment. White has a forcing way to regain it, leading straight into the famous Berlin endgame.",
        },
      },
      {
        play: ["d4"],
        text: "White strikes the center, preparing to round up the knight or force favorable simplification.",
      },
      {
        quiz: {
          answer: "Nd6",
          prompt: "Retreat the knight to the only truly safe central square.",
          explain: "Nd6 keeps the knight safe, even though it awkwardly blocks the d-pawn for a while.",
        },
      },
      {
        play: ["Bxc6", "dxc6", "dxe5"],
        text: "White trades off the other knight to damage Black's pawn structure before grabbing back the e5 pawn. Black's knight on d6 is now attacked.",
      },
      {
        quiz: {
          answer: "Nf5",
          prompt: "Move the attacked knight to an active square.",
          explain: "Nf5 keeps the knight useful, eyeing d4 and e3, even as material comes off the board.",
        },
      },
      {
        play: ["Qxd8+", "Kxd8"],
        text: "Queens are forced off — Kxd8 is the only legal recapture — landing us in the famous 'Berlin Wall' endgame.",
      },
      {
        text: "Black's king is slightly displaced but the position is extremely solid: doubled pawns are compensated by the bishop pair and a rock-hard structure. This is why the Berlin became the top-level answer to 1.e4.",
      },
    ],
  },

  // ────────────────────────────── Open Games ──────────────────────────────
  {
    id: "scotch-game",
    title: "Scotch Game",
    category: "openings",
    group: "Open Games",
    level: "beginner",
    eco: "C45",
    summary: "Trade in the center at once and put a knight on a dominant square.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6"],
        text: "From the normal Open Game start, White has a direct alternative to the Italian and Ruy Lopez.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Strike the center at once, offering a pawn trade.",
          explain: "The Scotch grabs the center immediately. If Black declines the trade, White gets a huge pawn center for free.",
        },
      },
      {
        play: ["exd4"],
        text: "Black takes; White recaptures with the knight, centralizing it in one move.",
      },
      {
        quiz: {
          answer: "Nxd4",
          prompt: "Recapture, landing a piece on a dominant central square.",
          explain: "Nxd4 puts the knight in the center where it controls key squares and eyes c6, e6, and f5.",
        },
      },
      {
        play: ["Nf6"],
        text: "Black develops, attacking e4. White has two main plans: the solid Nc3, or the sharper Nxc6 followed by e5.",
      },
      {
        quiz: {
          answer: "Nc3",
          also: ["Nxc6"],
          prompt: "Defend e4 simply while developing another piece.",
          explain: "Nc3 keeps things solid and defends e4. The trade Nxc6 followed by e5 is the sharper, more modern main line, trading the bishop pair for space.",
        },
      },
      {
        play: ["Bb4"],
        text: "Black pins the newly developed knight, a common motif to slow down White's development.",
      },
      {
        quiz: {
          answer: "Nxc6",
          prompt: "Remove the piece that's pinned rather than untangling it.",
          explain: "Nxc6 trades off the pinned knight, doubling Black's pawns while keeping White's lead in development.",
        },
      },
      {
        play: ["bxc6"],
        text: "Black recaptures with doubled c-pawns. White aims to finish development quickly with Bd3 or Be2, castle, and use the extra central influence.",
      },
      {
        text: "The Scotch trades quickly and heads straight into a middlegame — a great practical choice if you'd rather out-play your opponent than memorize deep opening theory.",
      },
    ],
  },
  {
    id: "kings-gambit",
    title: "King's Gambit",
    category: "openings",
    group: "Open Games",
    level: "intermediate",
    eco: "C39",
    summary: "The romantic pawn sacrifice that opens the f-file for the attack.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5"],
        text: "From here White has the most romantic try in all of chess: sacrificing a pawn to open lines fast.",
      },
      {
        quiz: {
          answer: "f4",
          prompt: "Offer the f-pawn to open the f-file and strike at e5.",
          explain: "f4 offers a pawn to open the f-file for the rook and challenge Black's central e5 pawn.",
        },
      },
      {
        play: ["exf4"],
        text: "Black accepts. White has many tries here; the classical main line develops a piece first.",
      },
      {
        quiz: {
          answer: "Nf3",
          also: ["Bc4"],
          prompt: "Develop with a useful point: cover the h4 square.",
          explain: "Nf3 covers h4, ruling out the annoying ...Qh4+ check. Bc4, the Bishop's Gambit, is the sharper alternative.",
        },
      },
      {
        play: ["g5"],
        text: "Black clings to the extra pawn with ...g5, the most critical and best-tested defense.",
      },
      {
        quiz: {
          answer: "h4",
          prompt: "Challenge the g5 pawn before Black can consolidate it.",
          explain: "h4 hits g5 right away. After ...g4 the knight gets kicked and jumps into the center — the classical Kieseritzky Gambit.",
        },
      },
      {
        play: ["g4"],
        text: "Black kicks the knight, gaining more space on the kingside.",
      },
      {
        quiz: {
          answer: "Ne5",
          prompt: "Jump into the center — the point of the whole line.",
          explain: "Ne5 centralizes the knight, eyeing f7 and g4. The position turns razor-sharp and both sides need real theoretical knowledge.",
        },
      },
      {
        text: "This is the tabiya of the Kieseritzky Gambit. With precise defense modern engines suggest Black can hold onto the extra pawn.",
      },
      {
        text: "Even so, the resulting positions are wild and hard to defend over the board — the King's Gambit's romantic reputation as a dangerous practical weapon is well earned.",
      },
    ],
  },
  {
    id: "vienna-gambit",
    title: "Vienna Game / Vienna Gambit",
    category: "openings",
    group: "Open Games",
    level: "intermediate",
    eco: "C29",
    summary: "Develop the knight first, then spring a delayed King's Gambit.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nc3"],
        text: "The Vienna Game develops the queen's knight first, keeping options open — including a delayed f4 push.",
      },
      {
        play: ["Nf6"],
        text: "Black develops naturally, eyeing the e4 pawn.",
      },
      {
        quiz: {
          answer: "f4",
          prompt: "Strike with the gambit, echoing the King's Gambit but with the knight already developed.",
          explain: "f4 challenges the center immediately. Unlike a normal King's Gambit, White's knight on c3 already covers some of the usual tricks.",
        },
      },
      {
        play: ["d5"],
        text: "Black counters in the center at once — the sharpest and most principled reply.",
      },
      {
        quiz: {
          answer: "fxe5",
          prompt: "Take the pawn on e5.",
          explain: "fxe5 wins a pawn for the moment. Black replies ...Nxe4, hitting the knight on c3 and recovering the material.",
        },
      },
      {
        play: ["Nxe4"],
        text: "Black recaptures the material and centralizes the knight, hitting c3.",
      },
      {
        quiz: {
          answer: "Nf3",
          prompt: "Develop, preparing to support the center with d4 next.",
          explain: "Nf3 is a normal developing move; White will follow with d4 to build a real center while keeping an eye on the knight on e4.",
        },
      },
      {
        play: ["Be7"],
        text: "Material is level. White's advanced e5 pawn cramps Black; Black's active knight on e4 needs watching, and both sides race to finish developing.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Support the e5 pawn and grab more central space.",
          explain: "d4 cements the center, giving White a comfortable spatial plus in a structure resembling an Advance French with colors reversed.",
        },
      },
      {
        play: ["O-O"],
        text: "Black castles into safety. White typically follows with Bd3 or Bc4 and O-O next.",
      },
      {
        text: "This is a well-respected way to fight for an edge with very little memorized theory — the Vienna Gambit rewards understanding of the resulting structures more than rote lines.",
      },
    ],
  },

  // ────────────────────────────── Sicilian ──────────────────────────────
  {
    id: "sicilian-open-fundamentals",
    title: "Sicilian Defence: Open Sicilian Fundamentals",
    category: "openings",
    group: "Sicilian",
    level: "beginner",
    eco: "B90",
    summary: "White trades the c-pawn for central control and a big lead in development.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "c5"],
        text: "The Sicilian: Black avoids symmetry entirely, fighting for the center with a queenside pawn instead of mirroring 1...e5.",
      },
      {
        quiz: {
          answer: "Nf3",
          prompt: "Develop, preparing the thematic d4 break.",
          explain: "Nf3 develops naturally and prepares d4, the move that defines the whole family of Open Sicilians.",
        },
      },
      {
        play: ["d6"],
        text: "A flexible, very common reply, supporting a future ...Nf6 and ...e5 without blocking the c8 bishop.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Strike in the center — this is what makes it an Open Sicilian.",
          explain: "d4 offers a trade; after ...cxd4 Nxd4 White gets a lead in central control and development, kicking off the sharp Open Sicilian battle.",
        },
      },
      {
        play: ["cxd4", "Nxd4", "Nf6"],
        text: "White's knight lands on a dominant central square. Black develops with tempo, attacking e4.",
      },
      {
        quiz: {
          answer: "Nc3",
          prompt: "Defend e4 while developing a piece toward the center.",
          explain: "Nc3 is the standard developing move here: it guards e4 and gets ready for quick kingside development.",
        },
      },
      {
        play: ["a6"],
        text: "Black chooses the Najdorf, the single most popular and deeply analyzed Sicilian system, preparing ...e5 or ...b5 without allowing Bb5+ or Nb5 tricks.",
      },
      {
        quiz: {
          answer: "Be2",
          also: ["Be3", "Bg5", "f3"],
          prompt: "Develop naturally — there isn't one 'best' move here.",
          explain: "Be2, Be3, Bg5, and f3 are all major independent systems with very different middlegames — no single one is objectively correct.",
        },
      },
      {
        text: "The Open Sicilian trades a wing pawn for central control and a half-open c-file for Black to attack along. Both sides have enormous amounts of well-explored theory to draw on.",
      },
    ],
  },
  {
    id: "sicilian-smith-morra",
    title: "Sicilian: Smith-Morra Gambit",
    category: "openings",
    group: "Sicilian",
    level: "intermediate",
    eco: "B21",
    summary: "Sacrifice a second central pawn for rapid, tempo-gaining development.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "c5"],
        text: "From the Sicilian starting position, White has a gambit alternative to the slow Open Sicilian buildup.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Offer the central pawn.",
          explain: "d4 invites ...cxd4; the follow-up c3 offers a second pawn to blast the position open before Black can consolidate.",
        },
      },
      {
        play: ["cxd4"],
        text: "Black takes the first pawn; now comes the gambit pawn.",
      },
      {
        quiz: {
          answer: "c3",
          prompt: "Offer a second pawn to open lines fast.",
          explain: "c3 offers another pawn; if Black declines with ...Nf6 or ...d3, White still gets a fine center, but accepting is the main line.",
        },
      },
      {
        play: ["dxc3"],
        text: "Black grabs the second pawn too; White regains it immediately with a developing move.",
      },
      {
        quiz: {
          answer: "Nxc3",
          prompt: "Recapture, developing a piece to a strong central square.",
          explain: "Nxc3 regains the pawn and puts the knight on an active square, right in the spirit of the gambit.",
        },
      },
      {
        play: ["Nc6", "Nf3", "d6"],
        text: "Black develops naturally and sets up a solid, closed defensive structure. White races to bring out every piece with tempo before Black can catch up.",
      },
      {
        quiz: {
          answer: "Bc4",
          prompt: "Aim the bishop at the sensitive f7 square, a classic Morra attacking idea.",
          explain: "Bc4 eyes f7 immediately, a recurring theme in the Morra. White is down a pawn but has a big lead in development and open lines for both rooks.",
        },
      },
      {
        play: ["e6"],
        text: "Black shores up the diagonal and prepares ...Nf6 and ...Be7. White typically finishes with O-O, Qe2, and rooks to d1/c1, keeping constant pressure for the pawn.",
      },
      {
        text: "Objectively, precise defense holds the extra pawn for Black — but the Smith-Morra is a fearsome practical weapon, and many opponents never find the accurate path through the complications.",
      },
    ],
  },
];
