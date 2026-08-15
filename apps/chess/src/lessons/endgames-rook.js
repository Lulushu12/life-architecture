// Rook endings.
//
// Line generated with scripts/gen-line.mjs against the shipped Stockfish and
// replayed through chess.js. Note the engine plays the *fastest* win, not the
// most instructive one, so the commentary follows what it actually does rather
// than the textbook move order.

export const LESSONS = [
  {
    id: "lucena-king-escape",
    title: "Getting the king out from in front of the pawn",
    category: "endgames",
    group: "Rook Endings",
    level: "advanced",
    summary: "A pawn on the seventh and a king stuck in front of it. Winning means walking that king out through a storm of checks.",
    orientation: "w",
    startFen: "4K3/4P1k1/8/8/8/8/r7/5R2 w - - 0 1",
    steps: [
      {
        text: "White is winning — pawn on the seventh, rook active. But the pawn can't promote while White's own king stands on e8, and the moment that king steps aside, Black's rook starts checking.",
        circles: ["e8", "e7"],
      },
      {
        text: "So the whole endgame is one problem: escort the king to safety so the pawn can queen. Everything else is detail.",
      },
      {
        quiz: {
          answer: "Rg1+",
          prompt: "Before anything else, push Black's king further away.",
          explain: "Driving the king to h6 costs Black a tempo and buys the White king room to manoeuvre. Gaining space for your own king first is the recurring theme.",
          strict: true,
        },
      },
      {
        play: ["Kh6", "Rg8", "Rd2", "Rg4", "Re2"],
        text: "White's rook takes the g-file and then drops to the fourth rank, where it can shield the king later. Black's rook shuffles, waiting to check.",
      },
      {
        quiz: {
          answer: "Kf7",
          prompt: "The rook is placed. Now start the king's walk.",
          explain: "The king finally leaves e8, unblocking the pawn. From here it will be checked repeatedly — the trick is that each step brings it closer to the checking rook, shortening the checks.",
          strict: true,
        },
      },
      {
        play: ["Kh5", "Rg8", "Rf2+"],
        text: "The checks begin. Running away from them would let Black keep checking forever — so White walks towards the rook instead.",
      },
      {
        quiz: {
          answer: "Ke6",
          prompt: "Step towards the checking rook, not away from it.",
          explain: "Counter-intuitive but essential. Each step closer shortens the distance the rook can check from, and eventually White's own rook can interpose and end the checks for good.",
          strict: true,
        },
      },
      {
        play: ["Re2+", "Kd7", "Rd2+", "Kc6", "Re2"],
        text: "Three more checks, three more steps closer. Black has run out of useful squares — the checks stop and the pawn queens.",
      },
      {
        text: "The principle beats memorising the move order: a pawn on the seventh doesn't win by itself. Make room for your king, then march it towards the checks, using your rook as a shield.",
      },
    ],
  },

  {
    id: "philidor-third-rank",
    title: "Philidor's third-rank defence",
    category: "endgames",
    group: "Rook Endings",
    level: "intermediate",
    summary: "A rook ending a pawn down is usually still a draw — if you know this one method. Hold a rank, then check from behind.",
    orientation: "b",
    startFen: "8/4k3/r7/3KP3/8/8/8/7R b - - 0 1",
    steps: [
      {
        text: "You're a pawn down in a rook ending. That's normally still a draw, and Philidor worked out why in 1777. Two ideas, and the order matters.",
      },
      {
        text: "Your rook sits on the sixth rank — your own third. From there it denies White's king the sixth, and the pawn can't advance safely without the king's support. So the first job is simply: don't leave.",
        circles: ["a6", "b6", "c6", "d6", "f6", "g6", "h6"],
      },
      {
        quiz: {
          answer: "Rb6",
          prompt: "Wait. Stay on the rank and hand the move back.",
          explain: "Any square along the sixth does the job. White has no way forward: the king can't step up, and pushing the pawn is exactly what you want.",
        },
      },
      {
        play: ["e6"],
        text: "White pushes, out of other ideas. That's the trigger for the second half — and the pawn has now cut off its own king from the sixth rank.",
      },
      {
        quiz: {
          answer: "Rb8",
          prompt: "The pawn has passed your rank. Now go as far back as you can — your first rank, not White's.",
          explain: "From the eighth you check the White king from maximum range. Dropping to the *first* rank instead loses on the spot: White's rook is sitting there and simply takes, and the king-and-pawn ending that follows is winning.",
        },
      },
      {
        play: ["Kc6"],
        text: "White's king goes hunting round the side, since the pawn blocks the e-file.",
      },
      {
        quiz: {
          answer: "Rc8+",
          prompt: "Check it from behind.",
          explain: "Five ranks of air between rook and king. White can neither block usefully nor approach, because stepping towards your rook abandons the pawn.",
        },
      },
      {
        play: ["Kd5", "Rb8", "Rh7+", "Ke8"],
        text: "Back to waiting on the eighth, and the checks never run out. Two rules, in order: hold your third rank; once the pawn passes it, drop to your first and check from distance.",
      },
    ],
  },

  {
    id: "rook-behind-passer",
    title: "The rook belongs behind the passed pawn",
    category: "endgames",
    group: "Rook Endings",
    level: "intermediate",
    summary: "Tarrasch's rule, and the clearest case for it: one rook move decides whether this is a draw or a loss.",
    orientation: "w",
    startFen: "8/8/8/8/k7/p7/5K2/7R w - - 0 1",
    steps: [
      {
        text: "Black has a pawn on the third and a king beside it; your king is miles away. This looks lost, and one move saves it.",
      },
      {
        text: "Tarrasch's rule: rooks belong behind passed pawns — yours to escort them, the opponent's to stop them. Behind the enemy pawn, your rook gets more freedom as the pawn advances, not less.",
      },
      {
        quiz: {
          answer: "Ra1",
          prompt: "Get behind the pawn.",
          explain: "From a1 the rook stops the pawn dead and ties Black's king to defending it forever. In front of the pawn the rook would be passive and Black would simply walk the king up.",
          strict: true,
        },
      },
      {
        play: ["Kb3", "Ke2", "a2"],
        text: "Black advances, but the pawn is now frozen: it can't move, and the rook behind it is untouchable.",
      },
      {
        play: ["Kd2", "Kb2"],
        text: "Black's king finally steps away to make room for the promotion — and that's the moment the fortress pays out.",
      },
      {
        quiz: {
          answer: "Rxa2+",
          prompt: "The pawn is undefended. Take it.",
          explain: "Rook takes pawn with check; after Kxa2 it's bare kings. The whole draw rested on move one — the rook getting behind rather than in front.",
          strict: true,
        },
      },
      {
        text: "Same rule attacking: escort your own passer from behind, so the rook gains scope with every push. A rook sitting in front of a passed pawn is doing nothing but blocking it.",
      },
    ],
  },
];
