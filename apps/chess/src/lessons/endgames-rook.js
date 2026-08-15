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
];
