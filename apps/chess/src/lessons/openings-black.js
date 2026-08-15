// Opening theory from Black's side of the board.
//
// The rest of the opening content skews White in exactly the places it hurts:
// the Sicilian, the Open Games and the London are the most common things you
// meet as Black, and all of them were taught from the attacker's chair. These
// lessons cover that ground from the other side — including the Scotch and the
// Vienna, which the White-side files each treat only as an attacking weapon.

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
    summary: "Someone throws a pawn at you on move two. Taking is objectively best — but declining is far easier to play, and takes the sting out of it.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "f4"],
        text: "The King's Gambit. White offers a pawn to rip open the f-file and attack. It's been winning club games for two centuries, mostly against people who panic.",
      },
      {
        text: "Be straight about this: 2...exf4 is the engine's choice, and by about a pawn. The catch is that it leads to enormous forcing complications — exactly the game White has spent years preparing. There's a calmer reply that gives most of that edge back and asks you to memorise nothing.",
        circles: ["f4", "g1"],
      },
      {
        quiz: {
          answer: "Bc5",
          prompt: "Decline, and punish the move f4 by aiming at the square it weakened.",
          explain: "Objectively this is second best — the app's own engine puts it about a pawn behind 2...exf4. It is still a completely sound main line, and the trade is a good one: f4 opened the a7–g1 diagonal, the bishop lands on it hitting f2 and g1, and White can no longer castle comfortably. You give up a slice of the advantage and get a position you can play on understanding alone.",
          speculative: true,
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
        text: "The general rule against gambits: you don't have to accept. Declining while developing usually costs a little of the objective edge and saves you a great deal of preparation — and it leaves the gambiteer with the weakness they created.",
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

  {
    id: "scotch-black",
    title: "Scotch Game, from Black's side",
    category: "openings",
    group: "Open Games",
    level: "intermediate",
    eco: "C45",
    summary: "White opens the centre on move three. One queen move on move six takes all the sting out of it.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "d4"],
        text: "The Scotch. White breaks in the centre immediately rather than building up with Bb5 or Bc4 — the idea is to open lines while you're still undeveloped.",
        arrows: [["d4", "e5"]],
      },
      {
        quiz: {
          answer: "exd4",
          prompt: "Take. Anything else lets White keep a big centre for free.",
          explain: "Declining with ...d6 or ...Nf6 hands White the centre with tempo. Taking is both the best and the main move — the whole game now revolves around the d4 knight White is about to recapture with.",
        },
      },
      {
        play: ["Nxd4"],
        text: "Now the fork in the road. 4...Bc5 is sound and popular, but it invites a long forcing sequence. The other main move keeps things simpler and hits e4 straight away.",
      },
      {
        quiz: {
          answer: "Nf6",
          prompt: "Develop and attack the e-pawn in one move.",
          explain: "The Schmidt Variation. White has to deal with the threat to e4 right now, which limits how leisurely they can develop.",
        },
      },
      {
        play: ["Nxc6", "bxc6", "e5"],
        text: "White chases the knight and grabs space. This looks scary — the knight has nowhere comfortable and the e-pawn cramps you. Everything depends on the next move.",
        arrows: [["e5", "f6"]],
        circles: ["f6"],
      },
      {
        quiz: {
          answer: "Qe7",
          prompt: "Don't move the knight. Hit the pawn that's attacking it.",
          explain: "The whole point of the line. The queen pins the e5 pawn against White's king, so it can't take on f6. White must spend a move unpinning, and the initiative fizzles out.",
        },
      },
      {
        play: ["Qe2", "Nd5", "c4"],
        text: "Queens face off, your knight steps to the strong central square, and White kicks it while gaining space. Now find the move that makes c4 a liability.",
        circles: ["c4"],
      },
      {
        quiz: {
          answer: "Ba6",
          prompt: "Develop the bishop where it does the most damage.",
          explain: "Ba6 pins the c4 pawn against the queen on e2. White almost always has to answer b3, which permanently weakens the dark squares around their king. Your doubled c-pawns turn out to be worth it.",
        },
      },
      {
        text: "Take stock: your doubled c-pawns are ugly, but you have the bishop pair, an open b-file at the White queenside, and a White king still sitting in the centre. That's a fair trade.",
        circles: ["b8", "e1"],
      },
      {
        text: "The one move to remember from all of this is 6...Qe7. Play it and the Scotch is a normal game; move the knight instead and you'll spend twenty moves untangling.",
      },
    ],
  },

  {
    id: "vienna-black",
    title: "Vienna Game, from Black's side",
    category: "openings",
    group: "Open Games",
    level: "intermediate",
    eco: "C29",
    summary: "2.Nc3 looks quiet and often isn't. The answer is a central counter-punch, not a defensive crouch.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nc3"],
        text: "The Vienna. It looks like a slower Italian, but White frequently follows with f4 — a King's Gambit with the knight already developed, which is a genuinely more dangerous version.",
      },
      {
        quiz: {
          answer: "Nf6",
          prompt: "Develop and stake a claim on the centre.",
          explain: "...Nf6 is the most testing reply precisely because it eyes e4. If White now goes 3.Bc4, there's the famous 3...Nxe4! resource — 4.Nxe4 d5 forks the knight and bishop.",
        },
      },
      {
        play: ["f4"],
        text: "The Vienna Gambit. Grabbing with 3...exf4 is playable, but you're then defending a pawn in an open position against a fully developed attacker. There's a much better answer.",
        arrows: [["f4", "e5"]],
      },
      {
        quiz: {
          answer: "d5",
          prompt: "Don't take the pawn — hit the centre back.",
          explain: "The rule for meeting a wing attack is to strike in the centre, and this is the textbook case. Suddenly it's White's e4 pawn that's hanging, and the whole gambit idea collapses into an equal game.",
          strict: true,
        },
      },
      {
        play: ["fxe5"],
        text: "White grabs on e5 instead. Your d5 pawn is now attacked by the e4 pawn — but you have something better than defending it.",
      },
      {
        quiz: {
          answer: "Nxe4",
          prompt: "Take the pawn with the knight.",
          explain: "The knight lands on e4 with support from the d5 pawn, so it can't easily be chased off. Material is level, and your pieces are the active ones.",
          strict: true,
        },
      },
      {
        play: ["Nf3", "Be7", "d4", "O-O"],
        text: "You develop, castle, and finish completely comfortably. White's extra e5 pawn is a target, not a trophy.",
        circles: ["e5"],
      },
      {
        text: "Two things to carry away: meet f4 with ...d5, and remember that on the Vienna's other main move, 3.Bc4, the shot 3...Nxe4 wins material back by force. Neither requires memorising twenty moves.",
      },
    ],
  },
];
