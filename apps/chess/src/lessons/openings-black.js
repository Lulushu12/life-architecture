// Opening theory from Black's side of the board.
//
// The rest of the opening content skews White in exactly the places it hurts:
// the Sicilian, the Open Games and the London are the three most common things
// you meet as Black, and all of them were taught from the attacker's chair.
// These three lessons cover that ground from the other side.

export const LESSONS = [
  {
    id: "sicilian-black-plan",
    title: "The Sicilian, from Black's side",
    category: "openings",
    group: "Sicilian",
    level: "intermediate",
    eco: "B90",
    summary: "The most popular answer to 1.e4, and what you're actually playing for: an extra centre pawn and the open c-file.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4"],
        text: "White grabs the centre. You could mirror with 1...e5 and accept a symmetrical fight — or you can unbalance the game immediately, which is why the Sicilian is the most played reply in the world.",
      },
      {
        quiz: {
          answer: "c5",
          prompt: "Fight for the centre without mirroring.",
          explain: "c5 attacks d4 without committing a centre pawn to a square where it can be traded off symmetrically. You're already playing for a win, not a balance.",
        },
      },
      {
        play: ["Nf3", "d6", "d4"],
        text: "White breaks in the centre. This trade is the whole point of the opening for both sides, so it's worth knowing what you're getting.",
        arrows: [["d4", "c5"]],
      },
      {
        quiz: {
          answer: "cxd4",
          prompt: "Take.",
          explain: "You swap a wing pawn for a centre pawn — after this you have two centre pawns to White's one, and the c-file opens for your rook. That structural gain is what you'll be leaning on for the rest of the game.",
        },
      },
      {
        play: ["Nxd4", "Nf6", "Nc3"],
        text: "Both sides develop naturally. Now the branch point: this move defines which Sicilian you're playing.",
      },
      {
        quiz: {
          answer: "a6",
          prompt: "A small move with a big idea — take b5 away from White's pieces.",
          explain: "The Najdorf. a6 stops Bb5 and Nb5 and prepares ...b5 yourself, gaining queenside space. It looks slow because it is: you're spending a tempo to make every White piece worse.",
        },
      },
      {
        text: "Your three assets in every Sicilian: the half-open c-file, the extra centre pawn, and queenside space. White's are development and a kingside attack. Whoever gets their plan going first usually wins.",
        circles: ["c8", "c1"],
      },
      {
        text: "Practical warning: White often castles queenside and throws the h- and g-pawns at you. Don't drift — get ...b5 and the c-file working, or you'll simply be mated first.",
      },
    ],
  },

  {
    id: "kings-gambit-black",
    title: "Meeting the King's Gambit",
    category: "openings",
    group: "Open Games",
    level: "beginner",
    eco: "C30",
    summary: "Someone throws a pawn at you on move two. You don't have to take it — and the strongest reply is to decline.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "f4"],
        text: "The King's Gambit. White offers a pawn to rip open the f-file and attack. It's been winning club games for two centuries, mostly against people who panic.",
      },
      {
        text: "Taking with 2...exf4 is playable and leads to enormous complications — exactly the game White has prepared for. There's a calmer reply that engines like more.",
        circles: ["f4", "g1"],
      },
      {
        quiz: {
          answer: "Bc5",
          prompt: "Decline, and punish the move f4 by aiming at the square it weakened.",
          explain: "f4 opened the a7–g1 diagonal, and the bishop lands on it with tempo pressure against f2 and g1. White can no longer castle comfortably, which removes most of the point of the gambit.",
        },
      },
      {
        play: ["Nf3", "d6"],
        text: "Solid. You keep the strong bishop, hold e5, and let White worry about the loose f4 pawn and the king stuck in the middle.",
      },
      {
        play: ["c3"],
        text: "White prepares d4 to hit your bishop and grab the centre after all.",
      },
      {
        quiz: {
          answer: "Nf6",
          prompt: "Develop and hit e4.",
          explain: "Nf6 attacks e4 and prepares to castle. You're simply developing faster than White, who has spent two moves on pawns that don't develop anything.",
        },
      },
      {
        text: "The general rule against gambits: you don't have to accept. Declining while developing takes the sting out of most of them, and leaves the gambiteer with the weakness they created.",
      },
    ],
  },

  {
    id: "london-black-antidote",
    title: "Beating the London System",
    category: "openings",
    group: "d4 Systems",
    level: "beginner",
    eco: "D02",
    summary: "White's most popular system opening plays the same moves against everything. Two Black moves are what it fears.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "d5", "Bf4"],
        text: "The London. White develops the bishop outside the pawn chain and will follow with e3, c3, Nf3, Bd3 — the same setup regardless of what you do. That predictability is its strength and its weakness.",
      },
      {
        play: ["Nf6", "e3"],
        text: "You develop and White builds the standard wall. Now, before White gets comfortable, hit the base of it.",
        arrows: [["d4", "e3"]],
      },
      {
        quiz: {
          answer: "c5",
          prompt: "Strike at the pawn White's whole structure rests on.",
          explain: "c5 challenges d4 immediately. Because White has already played Bf4, the b2 pawn is undefended by the bishop — and that's the detail the next move exploits.",
        },
      },
      {
        play: ["c3", "Nc6", "Nd2"],
        text: "White props up d4 and develops. But the b2 pawn is still sitting there with nothing guarding it.",
        circles: ["b2"],
      },
      {
        quiz: {
          answer: "Qb6",
          prompt: "Two targets at once.",
          explain: "The queen hits b2 and adds pressure to d4. White's usual defences are awkward: Qb3 offers a trade that helps you, Rb1 is passive, and b3 weakens the dark squares the London bishop just left behind.",
          strict: true,
        },
      },
      {
        text: "That's the antidote in two moves: ...c5 against the centre, ...Qb6 against b2. You don't need theory against a system — you need to know which square its setup leaves loose.",
      },
    ],
  },
];
