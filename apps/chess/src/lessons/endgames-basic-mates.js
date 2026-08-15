// Forced mates with limited material.
//
// Every line here was played out by the same Stockfish build the app ships and
// then replayed through chess.js, so the moves are legal and the quiz answers
// are the engine's own choices rather than remembered technique.

export const LESSONS = [
  {
    id: "mate-kq",
    title: "King and queen mate",
    category: "endgames",
    group: "Basic Mates",
    level: "beginner",
    summary: "The first mate to know cold. Shrink the box with the queen, walk the king up, and watch for stalemate.",
    orientation: "w",
    startFen: "8/8/4k3/8/8/2Q5/8/4K3 w - - 0 1",
    steps: [
      {
        text: "Queen and king against a lone king. The queen cannot mate alone — she takes squares away, the king delivers. Box first, escort second.",
      },
      {
        quiz: {
          answer: "Qc5",
          prompt: "Start shrinking the black king's box.",
          explain: "Qc5 takes the whole fifth rank and the c-file. Black is already confined to a corner of the board and hasn't been checked once. The engine finds faster mates from here; this is the method that always works, which matters more than saving a move.",
        },
      },
      {
        play: ["Kf6", "Qd6+", "Kf7"],
        text: "One check, with a purpose: it pushes Black towards the edge. Aimless checking just lets the king wander back to the middle.",
        arrows: [["d6", "f6"]],
      },
      {
        quiz: {
          answer: "Ke2",
          prompt: "The box is small enough. Now bring the piece that actually mates.",
          explain: "The queen has done her job; nothing more happens until the king arrives. Beginners lose 50-move draws here by shuffling the queen instead. Which way the king starts barely matters — Kd2 mates a move sooner — so this walks straight up the e-file, which is easier to remember.",
        },
      },
      {
        play: ["Kg7", "Qe7+", "Kh8", "Ke3", "Kg8", "Kd4", "Kh8", "Ke5", "Kg8", "Kf6", "Kh8"],
        text: "The king marches up while the queen holds the fence. Black shuffles between g8 and h8 — there is nothing else.",
      },
      {
        text: "Careful: with Black on h8, Qg7 would be stalemate if the king weren't covering it. Check that Black still has a legal move — or is being mated — before every queen move.",
        circles: ["g7", "g8"],
      },
      {
        quiz: {
          answer: "Qg7#",
          prompt: "Finish it.",
          explain: "The queen touches the enemy king, defended by her own. That contact mate, king behind queen, is the pattern to remember.",
          strict: true,
        },
      },
    ],
  },

  {
    id: "mate-kr",
    title: "King and rook mate",
    category: "endgames",
    group: "Basic Mates",
    level: "beginner",
    summary: "Much harder than the queen mate and far more common. Opposition, then check — repeat until the edge.",
    orientation: "w",
    startFen: "8/5k2/R7/5K2/8/8/8/8 w - - 0 1",
    steps: [
      {
        text: "Rook and king. The rook builds a wall the enemy king can't cross; your king does the pushing. The whole method is two moves long, repeated.",
      },
      {
        text: "Right now the kings aren't opposed and a check would achieve nothing — Black would simply step towards the middle. First, a waiting move.",
      },
      {
        quiz: {
          answer: "Ra2",
          prompt: "Pass the move to Black without giving up anything.",
          explain: "Sliding the rook far down its file keeps every square it controls and hands Black the obligation to move. Waiting moves are the engine of this endgame.",
          strict: true,
        },
      },
      {
        play: ["Ke7", "Rd2", "Kf7"],
        text: "The rook cuts along the d-file and Black is confined to three files. Now the kings face each other with one square between — the opposition.",
        circles: ["f5", "f7"],
      },
      {
        quiz: {
          answer: "Rd7+",
          prompt: "Kings are opposed. Push the fence forward.",
          explain: "Opposition first, then check: because Black's king cannot step towards the rook, the check gains a whole rank. Checking without the opposition gains nothing.",
          strict: true,
        },
      },
      {
        play: ["Ke8", "Ke6", "Kf8", "Kf6", "Kg8"],
        text: "Same routine: king takes the opposition, rook checks. Black is on the back rank with nowhere left to run.",
      },
      {
        quiz: {
          answer: "Rd8+",
          prompt: "Squeeze again.",
          explain: "Black must go to h7 — the king is being walked into the corner one file at a time.",
          strict: true,
        },
      },
      {
        play: ["Kh7", "Rb8"],
        text: "Another waiting move. The rook keeps the eighth rank and forces Black to step into the mating square.",
      },
      {
        play: ["Kh6"],
        text: "Black had no choice. Now the kings are opposed on the h- and f-files with the rook ready.",
      },
      {
        quiz: {
          answer: "Rh8#",
          prompt: "Mate in one.",
          explain: "Rook mates along the file, king covers the escape squares. Wall, opposition, check, wait — that is the entire endgame.",
          strict: true,
        },
      },
    ],
  },
];
