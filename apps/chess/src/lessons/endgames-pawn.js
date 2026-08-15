// Pawn endings, and one bishop ending that behaves like a pawn ending.
//
// Lines generated with scripts/gen-line.mjs against the shipped Stockfish and
// replayed through chess.js, so the moves are legal and the answers are the
// engine's.

export const LESSONS = [
  {
    id: "rule-of-the-square",
    title: "The rule of the square",
    category: "endgames",
    group: "Pawn Endings",
    level: "beginner",
    summary: "Decide whether a king catches a running pawn without counting a single move — just look at a square.",
    orientation: "w",
    startFen: "8/8/8/6k1/8/8/P7/6K1 w - - 0 1",
    steps: [
      {
        text: "White has a passed pawn on a2 and Black's king is miles away. Does it queen? There's a trick that answers this instantly, with no counting.",
      },
      {
        text: "Draw a square with the pawn's path as one side: from the pawn, forward to the queening square, and the same number of files across. If the defending king can step inside that square, it catches the pawn. If not, it doesn't.",
        circles: ["a4", "a8", "e8", "e4"],
      },
      {
        quiz: {
          answer: "a4",
          prompt: "Push the pawn two squares — and check the square it draws.",
          explain: "From a4 the square is a4–a8–e8–e4. Black's king on g5 is outside it and it's Black's move, so the king can never step in. The pawn queens by force.",
        },
      },
      {
        play: ["Kf4", "a5", "Ke3"],
        text: "Black sprints, but each time the pawn advances the square shrinks by the same amount the king gains. Losing the race by one tempo means losing it forever.",
      },
      {
        play: ["Kf1", "Kd4", "a6", "Kd5", "a7", "Ke6", "Ke2", "Kd7"],
        text: "The king arrives one square too late — the story of a thousand endgames.",
      },
      {
        quiz: {
          answer: "a8=Q",
          prompt: "Finish the job.",
          explain: "A queen appears and the rest is technique. The whole decision was made on move one, by looking at a square instead of calculating.",
          strict: true,
        },
      },
      {
        text: "Two footnotes. A pawn on its starting square gets a double step, so draw the square from where it lands, not where it stands. And if it's the defender's move, the king gets one free step towards the square first.",
      },
    ],
  },

  {
    id: "wrong-rook-pawn",
    title: "The wrong rook pawn",
    category: "endgames",
    group: "Pawn Endings",
    level: "intermediate",
    summary: "Bishop and pawn against a bare king is usually trivial. With the wrong pair it's a dead draw, however far ahead you are.",
    orientation: "b",
    startFen: "7k/8/5K2/7P/8/8/8/5B2 w - - 0 1",
    steps: [
      {
        text: "White is a bishop and a pawn up against a lone king — normally a routine win. Here it's a draw, and you're defending. The reason is the colour of two squares.",
      },
      {
        text: "The pawn is an h-pawn, so it queens on h8. h8 is a dark square and White's bishop travels on light squares — it can never control the promotion square, and never drive a king off it.",
        circles: ["h8", "f1"],
      },
      {
        play: ["Kg6"],
        text: "White's king comes as close as it can. Now you have exactly one legal move — and happily, it's the right one anyway.",
      },
      {
        quiz: {
          answer: "Kg8",
          prompt: "Only one square is legal. Find it.",
          explain: "h7 is next to White's king, so g8 it is. Being forced isn't a problem here: you're heading straight back to the corner next move.",
          strict: true,
        },
      },
      { play: ["Be2"], text: "White repositions the bishop, hoping to build a net." },
      {
        quiz: {
          answer: "Kh8",
          prompt: "Go where the bishop can never follow.",
          explain: "Back to h8 — a dark square, invisible to a light-squared bishop. This is the fortress: as long as you can reach this corner, the extra material is meaningless.",
        },
      },
      { play: ["h6"], text: "White pushes the pawn. It changes nothing — the corner is still the corner." },
      {
        quiz: {
          answer: "Kg8",
          prompt: "Step out and prepare to come straight back.",
          explain: "The shuffle g8–h8 is the whole defence. White can never take both squares away, because taking h8 from you would mean standing on g6 or g7 and stalemating you.",
          strict: true,
        },
      },
      { play: ["Bc4+"], text: "A check — but checks don't help either." },
      {
        quiz: {
          answer: "Kh8",
          prompt: "Forced, and fine.",
          explain: "Home again. From here White repeats: Bf1, Kg8, Bc4+, Kh8, forever. The engine evaluates this as level despite being a bishop and pawn up.",
          strict: true,
        },
      },
      {
        text: "Worth knowing from both sides. Attacking: check your bishop's colour against the queening square before trading into this. Defending: head for that corner and the material stops mattering.",
      },
    ],
  },
];
