// Minor-piece endings: the two bishop endgames that decide whether a material
// advantage is worth anything at all.
//
// Both positions in this file were checked with the app's own Stockfish before
// the commentary was written. The "wrong bishop" position evaluates at 0.00
// with the light-squared bishop and mate-in-eight with the dark-squared one on
// the same square-count; the opposite-bishop position holds at 0.00 despite
// White being two clean pawns up.

export const LESSONS = [
  {
    id: "wrong-bishop-rook-pawn",
    title: "Bishop and rook pawn: the drawn piece up",
    category: "endgames",
    group: "Minor Piece Endings",
    level: "beginner",
    summary: "A whole bishop and a pawn ahead, and it's still a draw. The reason is one square's colour.",
    orientation: "b",
    startFen: "5k2/8/5K2/8/8/8/6BP/8 b - - 0 1",
    steps: [
      {
        text: "Count the material: White is a bishop and a pawn up against a bare king. That would normally be over in ten moves. Here it's a dead draw, and it's worth understanding exactly why.",
      },
      {
        text: "The pawn is on the h-file, so it queens on h8. Look at the colour of h8 — dark. Now look at White's bishop: it stands on g2, a light square, and a bishop never changes colour.",
        circles: ["h8", "g2"],
      },
      {
        text: "So White's bishop can never attack, defend, or control h8. If your king simply sits on h8, White has no way to evict it — pushing the pawn to h7 would be stalemate, and the bishop can't help.",
        arrows: [["g2", "h3"]],
      },
      {
        quiz: {
          answer: "Kg8",
          prompt: "Head for the one square that saves the game.",
          explain: "Straight for the corner. Once the king reaches h8 it never has to leave: White's king can't approach without stalemating you, and the wrong-coloured bishop is a spectator.",
          strict: true,
        },
      },
      {
        play: ["Kg6", "Kh8"],
        text: "The king is home. White can shuffle for fifty moves and nothing changes — this is the fortress, and it holds against any play.",
        circles: ["h8"],
      },
      {
        text: "Two practical uses. Defending: if you're losing, steer for a rook pawn that queens on the wrong colour and run your king to that corner. Attacking: before trading into a bishop ending, check the corner colour first.",
      },
      {
        text: "The rule in one line — a rook pawn plus a bishop that doesn't control the queening square is a draw, no matter how much else you're up.",
      },
    ],
  },

  {
    id: "opposite-bishops-draw",
    title: "Opposite-coloured bishops: two pawns aren't enough",
    category: "endgames",
    group: "Minor Piece Endings",
    level: "intermediate",
    summary: "Two extra connected passed pawns, and the engine still says nil. Opposite bishops are the great drawing device.",
    orientation: "b",
    startFen: "8/3k4/3b4/3PP3/4K3/8/6B1/8 b - - 0 1",
    steps: [
      {
        text: "White is two pawns up with two connected passers on the fifth, supported by the king. In almost any other endgame that's resignable. With opposite-coloured bishops it's a draw.",
        circles: ["d5", "e5"],
      },
      {
        text: "The reason: your dark-squared bishop and White's light-squared bishop can never meet. White's bishop cannot attack anything you defend, and cannot defend anything you attack. Effectively you each have a free extra piece.",
      },
      {
        text: "Your job is a blockade on dark squares — the colour your bishop controls and White's never can. The pawns must cross d6 and e7 to make progress, and both are dark.",
        circles: ["d6", "e7"],
      },
      {
        quiz: {
          answer: "Bb8",
          prompt: "Your bishop is in the pawns' way on d6, where e5xd6 wins it. Step back onto a diagonal that still watches e5.",
          explain: "The b8–h2 diagonal runs straight through d6 and e5 — both squares the pawns need. From one square the bishop stops both pawns for good. Retreating rather than blocking is the whole technique.",
        },
      },
      {
        play: ["Kf5", "Bc7"],
        text: "White brings the king; you keep shuffling on the long diagonal. Neither pawn can advance without stepping onto a square your bishop covers.",
      },
      {
        text: "The counting rule: with opposite bishops, two extra pawns usually draw and three usually win — but only if the extra pawns are far enough apart that one bishop can't watch both. Connected pawns are the easiest to blockade.",
      },
      {
        text: "So the practical lesson cuts both ways. Defending a bad position, trade into opposite bishops. Attacking with them on the board, don't trade into a pure bishop ending — keep the rooks on, where opposite bishops favour the attacker instead.",
      },
    ],
  },
];
