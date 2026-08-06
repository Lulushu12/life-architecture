// Concept lessons: tactics & attacking patterns.
// Every startFen below is a hand-constructed, verified-legal position (not
// derived from a real game) built specifically to demonstrate one pattern.

export const LESSONS = [
  // ---------------------------------------------------------------------
  // 1. The Greek Gift sacrifice
  // ---------------------------------------------------------------------
  {
    id: "greek-gift-sacrifice",
    title: "The Greek Gift Sacrifice",
    category: "concepts",
    group: "Attacking Patterns",
    level: "intermediate",
    summary: "Bxh7+ rips open a castled king — when the pieces are ready to follow up.",
    startFen: "r1b2rk1/ppqn1ppp/3b4/2pp2N1/3P4/3B4/PPP2PPP/R1BQ1RK1 w - - 0 1",
    steps: [
      {
        text: "The Greek Gift: Bxh7+ trades a bishop for a pawn to drag the king into the open. It only works with three ingredients ready at once — check them before you sac.",
        arrows: [
          ["d3", "h7"],
          ["g5", "h7"],
          ["d1", "h5"],
        ],
        circles: ["h7", "g5"],
      },
      {
        text: "1) A bishop aimed at h7. 2) A knight that can land on g5. 3) A queen that can swing to h5 or h4. Here White's knight is already on g5 — covering h7 in advance.",
      },
      {
        quiz: {
          answer: "Bxh7+",
          prompt: "Black's f6-knight has wandered off, so nothing guards h7 or g5. Strike!",
          explain: "Bxh7+! Because the g5 knight already covers h7, Black's king can't even recapture.",
          strict: true,
        },
      },
      {
        play: ["Kh8"],
        text: "Kxh7 would walk straight into the g5 knight's check — illegal. Kh8 is Black's only legal move.",
      },
      {
        quiz: {
          answer: "Qh5",
          prompt: "Bring the second attacker in. Where does the queen go to threaten mate on h7?",
          explain: "Qh5! Now Qxh7# is threatened, and the knight already defends the queen on h7 too.",
          strict: true,
        },
      },
      {
        play: ["Nf6"],
        text: "Black's best defense: the knight sprints back to f6, blocking the diagonal and guarding h7 just in time.",
      },
      {
        quiz: {
          answer: "Qh4",
          prompt: "The immediate mate threat is parried — keep the queen in the attack without losing the thread.",
          explain: "Qh4 stays connected to the h7/g5 pressure. White is already close to winning despite Black's best defense.",
          strict: true,
        },
      },
      {
        play: ["g6"],
        text: "Black tries to shut things down with ...g6 — but this only rips open more lines near the king.",
      },
      {
        quiz: {
          answer: "Bxg6",
          prompt: "The g6 pawn just fell into a tactic. Grab it.",
          explain: "Bxg6! Another pawn falls and the king's shelter keeps disintegrating — White has an extra pawn, the safer king, and the initiative.",
          strict: true,
        },
      },
      {
        text: "The recipe: bishop on the b1-h7 diagonal, a knight that can reach g5, a queen with a road to h5/h4, and Black's f6-knight out of the picture. Missing any one, the sac is just a piece down.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 2. Smothered mate
  // ---------------------------------------------------------------------
  {
    id: "smothered-mate",
    title: "Smothered Mate (Philidor's Legacy)",
    category: "concepts",
    group: "Mating Patterns",
    level: "intermediate",
    summary: "A knight mates a king that's boxed in by its own pieces.",
    startFen: "rnbq1r1k/pppppppp/8/4N3/3PP3/1Q6/PPP2PPP/R1B2RK1 w - - 0 1",
    steps: [
      {
        text: "Smothered mate: a knight delivers checkmate to a king that's completely boxed in by its own pieces — no flight squares, nothing that can block a knight's check.",
        arrows: [
          ["e5", "f7"],
          ["b3", "g8"],
        ],
        circles: ["f7", "h8"],
      },
      {
        quiz: {
          answer: "Nxf7+",
          prompt: "The knight forks king and rook at once. Start the combination.",
          explain: "Nxf7+! Check, and the rook on f8 is attacked too.",
          strict: true,
        },
      },
      {
        play: ["Kg8"],
        text: "The only legal square — g7 and h7 are blocked by pawns, and the knight covers h8.",
      },
      {
        quiz: {
          answer: "Nh6+",
          prompt: "Keep checking — where does the knight jump to force the king right back into the corner?",
          explain: "Nh6+! From here Kg8's only escape is back to h8 — f8 is blocked by Black's own rook.",
          strict: true,
        },
      },
      {
        play: ["Kh8"],
        text: "Forced — f8 is occupied by Black's rook, and g7/h7 are pawns.",
      },
      {
        quiz: {
          answer: "Qg8+",
          prompt: "Here's the point of the whole combination — sacrifice the queen!",
          explain: "Qg8+!! The king can't take (the knight guards g8), so the rook is forced to capture.",
          strict: true,
        },
      },
      {
        play: ["Rxg8"],
        text: "Forced — nothing else deals with the check.",
      },
      {
        quiz: {
          answer: "Nf7#",
          prompt: "Black's own rook just sealed the king's fate. Finish it.",
          explain: "Nf7#! The king is smothered by its own rook and pawns — this is Philidor's Legacy.",
          strict: true,
        },
      },
      {
        text: "The pattern: box the king in with its own pieces, then force (or find) a knight check it truly cannot answer. A queen sac that clears the mating square is the classic way in.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 3. Back rank mates and luft
  // ---------------------------------------------------------------------
  {
    id: "back-rank-mate-luft",
    title: "Back Rank Mates and Luft",
    category: "concepts",
    group: "Mating Patterns",
    level: "beginner",
    summary: "A castled king with no escape square is one clean check from disaster.",
    startFen: "6k1/pp1p1ppp/8/4q3/8/8/PP2PPPP/2R3K1 w - - 0 1",
    steps: [
      {
        text: "A castled king with pawns on f7, g7, h7 and no rook nearby on the back rank is a back-rank mate waiting to happen — unless it has 'luft' (an escape square).",
        arrows: [["c1", "c8"]],
        circles: ["f8", "g8", "h8"],
      },
      {
        text: "Black's rook wandered off long ago and the queen is active on e5, but nothing at all guards the back rank.",
      },
      {
        quiz: {
          answer: "Rc8+",
          prompt: "Deliver the check.",
          explain: "Rc8+! The king has no flight square, so Black must block the check.",
          strict: true,
        },
      },
      {
        play: ["Qe8"],
        text: "The queen is the only piece that can reach the back rank in time — forced.",
      },
      {
        quiz: {
          answer: "Rxe8#",
          prompt: "The blocker is completely undefended. Finish it.",
          explain: "Rxe8#! Capturing the blocker delivers mate the exact same way the original check would have.",
          strict: true,
        },
      },
      {
        text: "This is why players habitually spend a tempo on h6/h3 (or g6/g3) early on — one pawn move buys the king an escape hatch and neutralizes back-rank threats for good.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 4. Anastasia's mate
  // ---------------------------------------------------------------------
  {
    id: "anastasias-mate",
    title: "Anastasia's Mate",
    category: "concepts",
    group: "Mating Patterns",
    level: "intermediate",
    summary: "A knight seals one flight square while a rook mates along the file.",
    startFen: "8/ppp3p1/7k/R7/8/3N4/PPP5/1K6 w - - 0 1",
    steps: [
      {
        text: "Anastasia's mate: a knight covers the one square next to a king stuck on the edge of the board, while a rook (or queen) delivers mate along the open file.",
        arrows: [
          ["d3", "f4"],
          ["a5", "h5"],
        ],
        circles: ["g6", "h6"],
      },
      {
        quiz: {
          answer: "Nf4",
          prompt: "Black's king is stranded on h6. Bring the knight in to seal off g6.",
          explain: "Nf4! The knight now covers g6 — combined with the g7 pawn and the rook's reach along the h-file and 5th rank, the king has nowhere to run.",
          strict: true,
        },
      },
      {
        play: ["a6"],
        text: "Black has no way to meet the threat and just shuffles a queenside pawn.",
      },
      {
        quiz: {
          answer: "Rh5#",
          prompt: "Deliver mate along the open file.",
          explain: "Rh5#! The rook checks along the h-file and covers g5 along the 5th rank, while the knight guards g6 — that's Anastasia's mate.",
          strict: true,
        },
      },
      {
        text: "The mechanism: a knight covers one flight square next to the edge, and the checking piece's own line of attack covers the rest. Watch for it whenever a king gets stuck on a file near a knight.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 5. Arabian mate
  // ---------------------------------------------------------------------
  {
    id: "arabian-mate",
    title: "Arabian Mate",
    category: "concepts",
    group: "Mating Patterns",
    level: "intermediate",
    summary: "Rook and knight alone mate a cornered king — no pawns required.",
    startFen: "7k/p7/8/7N/8/8/8/K5R1 w - - 0 1",
    steps: [
      {
        text: "Arabian mate: a rook and knight mate a cornered king with no pawn shield at all. The knight guards the two escape squares, and the rook delivers the blow.",
        arrows: [
          ["h5", "f6"],
          ["g1", "g8"],
        ],
        circles: ["g7", "h7"],
      },
      {
        quiz: {
          answer: "Nf6",
          prompt: "Post the knight where it covers both g8 and h7.",
          explain: "Nf6! From here the knight guards both g8 and h7 — and it will also defend the rook once it arrives on g8.",
          strict: true,
        },
      },
      {
        play: ["a6"],
        text: "Black has nothing better to try.",
      },
      {
        quiz: {
          answer: "Rg8#",
          prompt: "Deliver mate — the rook will be defended and covers g7 along its own file.",
          explain: "Rg8#! Check along the rank, g7 covered by the rook's own file, g8/h7 covered by the knight — and the knight defends the rook so the king can't capture it.",
          strict: true,
        },
      },
      {
        text: "This is the purest rook-and-knight mating pattern — no pawns needed. Recognizing it helps you spot forced mating nets in bare-king endgames.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 6. Pins
  // ---------------------------------------------------------------------
  {
    id: "pins-absolute-relative",
    title: "Pins: Absolute and Relative",
    category: "concepts",
    group: "Tactical Motifs",
    level: "beginner",
    summary: "A pinned piece can't defend itself — pile on and win it.",
    startFen: "4k3/ppp2ppp/2np4/1B6/4P3/5N2/PPPP1PPP/6K1 w - - 0 1",
    steps: [
      {
        text: "A pin: the bishop attacks the knight, but the knight can't legally move — that would expose the king behind it to check. This is an absolute pin.",
        arrows: [["b5", "e8"]],
        circles: ["c6"],
      },
      {
        text: "A relative pin is the same idea against a piece other than the king (say, a queen) — technically legal to move, but usually a bad idea. Either way, pinned pieces are prime targets.",
      },
      {
        quiz: {
          answer: "Nd4",
          prompt: "The knight on c6 is pinned and only defended once. Add a second attacker.",
          explain: "Nd4! Now two White pieces attack c6, which only the b7-pawn defends — and the pinned knight can't run or help out.",
          strict: true,
        },
      },
      {
        play: ["a6"],
        text: "Black has no way to add a second defender to c6 in time.",
      },
      {
        quiz: {
          answer: "Nxc6",
          prompt: "Cash in on the pin.",
          explain: "Nxc6! The pinned knight simply falls.",
          strict: true,
        },
      },
      {
        play: ["bxc6"],
        text: "Forced recapture.",
      },
      {
        quiz: {
          answer: "Bxc6+",
          prompt: "One more prize is waiting on the very same diagonal.",
          explain: "Bxc6+! White nets an extra pawn with check — all because the knight on c6 could never move to defend itself.",
          strict: true,
        },
      },
      {
        text: "Remember: a pinned piece defends nothing reliably. Look for a second attacker on it, and the pin often wins material outright.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 7. Forks and double attacks
  // ---------------------------------------------------------------------
  {
    id: "forks-double-attacks",
    title: "Forks and Double Attacks",
    category: "concepts",
    group: "Tactical Motifs",
    level: "beginner",
    summary: "One piece, two targets — the king can't be in two places at once.",
    startFen: "r3k3/pppp1ppp/8/1N6/8/8/PPPPPPPP/6K1 w - - 0 1",
    steps: [
      {
        text: "A fork is one piece attacking two targets at once. Knights are the classic forkers — their odd move shape lets them hit squares no other piece nearby can reach.",
        arrows: [
          ["b5", "c7"],
          ["c7", "a8"],
          ["c7", "e8"],
        ],
        circles: ["c7"],
      },
      {
        quiz: {
          answer: "Nxc7+",
          prompt: "One knight move hits both the king and the rook. Find it.",
          explain: "Nxc7+! Check to the king, and the knight also attacks the rook on a8 — a classic family fork.",
          strict: true,
        },
      },
      {
        play: ["Ke7"],
        text: "The king must step out of check.",
      },
      {
        quiz: {
          answer: "Nxa8",
          prompt: "Collect the other half of the fork.",
          explain: "Nxa8! The rook falls — the king simply couldn't be in two places at once.",
          strict: true,
        },
      },
      {
        text: "Always scan for knight forks when two enemy pieces sit a knight's-move apart from some reachable square — especially the king plus anything undefended.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 8. Skewers and X-ray attacks
  // ---------------------------------------------------------------------
  {
    id: "skewers-xray-attacks",
    title: "Skewers and X-Ray Attacks",
    category: "concepts",
    group: "Tactical Motifs",
    level: "beginner",
    summary: "Attack the big piece first — what's hiding behind it falls next.",
    startFen: "8/ppp1qppp/8/8/4k3/8/PPP2PPP/R5K1 w - - 0 1",
    steps: [
      {
        text: "A skewer is a pin in reverse: attack a valuable piece first, and when it's forced to move out of the way, a less valuable piece standing behind it gets captured.",
        arrows: [
          ["a1", "e1"],
          ["e1", "e7"],
        ],
        circles: ["e4", "e7"],
      },
      {
        text: "Here Black's king and queen share the e-file. This is also an x-ray attack — the rook's power reaches 'through' the king's square to the queen sitting beyond it.",
      },
      {
        quiz: {
          answer: "Re1+",
          prompt: "Line up the skewer with check.",
          explain: "Re1+! The king must move off the e-file — it can't block, since the queen can't jump over its own king.",
          strict: true,
        },
      },
      {
        play: ["Kd5"],
        text: "The king steps aside — there's nowhere else for it to go on the file.",
      },
      {
        quiz: {
          answer: "Rxe7",
          prompt: "The queen was behind the king the whole time. Take it.",
          explain: "Rxe7! The skewer wins the queen outright for a rook — often winning far more than a plain pin does.",
          strict: true,
        },
      },
      {
        text: "Skewers show up constantly on open files, ranks, and diagonals — anywhere a bigger piece stands directly in front of an even bigger one.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 9. Discovered attacks and discovered check
  // ---------------------------------------------------------------------
  {
    id: "discovered-attacks-check",
    title: "Discovered Attacks and Discovered Check",
    category: "concepts",
    group: "Tactical Motifs",
    level: "intermediate",
    summary: "Move one piece aside and let another piece do the real damage.",
    startFen: "3q1rk1/ppp3pp/4N3/8/8/1B6/PPPPPPPP/6K1 w - - 0 1",
    steps: [
      {
        text: "The bishop on b3 aims straight at g8 — but its own knight on e6 stands in the way. Move that knight and the check arrives for free, while the knight does whatever it likes.",
        arrows: [["b3", "g8"]],
        circles: ["e6"],
      },
      {
        text: "That's a discovered check: two threats at once, and the opponent can only answer the check.",
        quiz: {
          answer: "Nxd8",
          strict: true,
          prompt: "The knight can go several places with check. Take the biggest prize.",
          explain: "Nxd8! grabs the queen, and stepping off e6 uncovers the bishop's check at the same moment — Black has no time to recapture.",
        },
      },
      {
        play: ["Kh8"],
        text: "Black must deal with the check first. The rook on f8 would love to take the knight — but it never gets the chance.",
      },
      {
        quiz: {
          answer: "Nf7+",
          strict: true,
          prompt: "Don't leave the knight to be captured. Where does it go?",
          explain: "Nf7+! Another check, so the knight leaves the corner with tempo and comes out alive. White has won a whole queen for nothing.",
        },
      },
      {
        play: ["Kg8", "Ng5"],
        text: "The knight steps back to safety. Final count: White won the queen and kept every piece.",
      },
      {
        text: "Discovered checks are the most brutal tactic in chess: the moving piece is completely free — it can capture the biggest thing on the board, or even move somewhere 'hanging', because the check must be answered first.",
      },
    ],
  },
  {
    id: "deflection-and-decoy",
    title: "Deflection and Decoy",
    category: "concepts",
    group: "Tactical Motifs",
    level: "intermediate",
    summary: "Pull the defender away from its post — then take what it was guarding.",
    startFen: "7k/pppq1ppp/8/8/8/8/PPP2PPP/3RR1K1 w - - 0 1",
    steps: [
      {
        text: "Deflection: force (or lure) a defending piece away from the square it's guarding. Once it's gone — captured, chased off, or simply overloaded — that square falls.",
        arrows: [
          ["d1", "d7"],
          ["e1", "e8"],
        ],
        circles: ["d7", "e8"],
      },
      {
        text: "Black's queen is the only thing guarding both itself and the back-rank mating square on e8. Remove it, and the mate goes through.",
      },
      {
        quiz: {
          answer: "Rxd7",
          prompt: "The queen is undefended and it's the only thing covering e8. Take it.",
          explain: "Rxd7! Black's sole defender of the back rank is simply gone.",
          strict: true,
        },
      },
      {
        play: ["a6"],
        text: "Black has no way to stop what's coming.",
      },
      {
        quiz: {
          answer: "Re8#",
          prompt: "With the guard removed, deliver the point of the whole idea.",
          explain: "Re8#! Once the piece guarding a critical square is gone — however that happens — the tactic behind it goes through cleanly.",
          strict: true,
        },
      },
      {
        text: "Deflection and decoy are two sides of one coin: pull a defender away (deflect), or lure it onto a bad square (decoy). Either way, whatever it was guarding becomes fair game.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 11. Overloading
  // ---------------------------------------------------------------------
  {
    id: "overloading-overworked-piece",
    title: "Overloading (the Overworked Piece)",
    category: "concepts",
    group: "Tactical Motifs",
    level: "intermediate",
    summary: "One piece, two jobs — it can't actually do both.",
    startFen: "3r3k/pppn1ppp/8/1B6/8/8/PPP2PPP/4R1K1 w - - 0 1",
    steps: [
      {
        text: "An overloaded piece is doing two jobs at once. Black's rook on d8 both guards the back rank and defends the knight on d7 — but it can't really do both at the same time.",
        arrows: [["e1", "e8"]],
        circles: ["d7", "d8"],
      },
      {
        quiz: {
          answer: "Bxd7",
          prompt: "Attack the piece the rook is also responsible for.",
          explain: "Bxd7! If the rook recaptures here, it abandons the back rank.",
          strict: true,
        },
      },
      {
        play: ["Rxd7"],
        text: "Black recaptures the knight — but now the rook has left the 8th rank undefended.",
      },
      {
        quiz: {
          answer: "Re8#",
          prompt: "The back rank has no guard left. Finish it.",
          explain: "Re8#! The rook simply couldn't defend d7 and guard e8 at the same time — that's overloading.",
          strict: true,
        },
      },
      {
        text: "Whenever one piece is the sole defender of two different things, attack the one it's not currently covering, or force it to choose — it will always be wrong.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 12. Zwischenzug
  // ---------------------------------------------------------------------
  {
    id: "zwischenzug-in-between-moves",
    title: "Zwischenzug (In-Between Moves)",
    category: "concepts",
    group: "Tactical Motifs",
    level: "advanced",
    summary: "Before playing the 'obvious' move, ask: is there something better first?",
    startFen: "6k1/pppp1ppp/4p3/8/8/2bB4/PPPPPPPP/6K1 w - - 0 1",
    steps: [
      {
        text: "Zwischenzug ('in-between move'): instead of playing the expected recapture immediately, insert a stronger move first — a check or bigger threat — then complete the original business afterward.",
        arrows: [["d3", "h7"]],
        circles: ["c3", "h7"],
      },
      {
        text: "Black just grabbed a piece on c3, and bxc3 looks completely automatic. But take one more look at the kingside first.",
      },
      {
        quiz: {
          answer: "Bxh7+",
          prompt: "Before recapturing on c3, is there something more urgent available?",
          explain: "Bxh7+! A free pawn with check — Black has to deal with this before anything else.",
          strict: true,
        },
      },
      {
        play: ["Kxh7"],
        text: "Forced.",
      },
      {
        quiz: {
          answer: "bxc3",
          prompt: "Now complete the original recapture.",
          explain: "bxc3 — White gets the exact same recapture as before, plus an extra pawn banked from the zwischenzug.",
          strict: true,
        },
      },
      {
        text: "Before playing the 'obvious' recapture, always ask: is there a check, capture, or threat worth inserting first? The position usually can't run away, but that extra tempo might not wait.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 13. Windmill
  // ---------------------------------------------------------------------
  {
    id: "windmill-tactic",
    title: "The Windmill",
    category: "concepts",
    group: "Tactical Motifs",
    level: "advanced",
    summary: "A rook-and-bishop battery that checks, captures, and checks again.",
    startFen: "5rk1/ppp2ppp/8/8/8/6R1/PBPPPP1P/6K1 w - - 0 1",
    steps: [
      {
        text: "A windmill (or seesaw): a rook and bishop battery checks the king again and again, grabbing material on every swing, because the king only ever has one square to run to.",
        arrows: [
          ["b2", "h8"],
          ["g3", "g7"],
        ],
        circles: ["g7", "f7", "f8"],
      },
      {
        quiz: {
          answer: "Rxg7+",
          prompt: "Start the seesaw.",
          explain: "Rxg7+! A direct check along the g-file — the king has only one legal square.",
          strict: true,
        },
      },
      {
        play: ["Kh8"],
        text: "Forced — the rook covers the rest of the g-file and the 7th rank.",
      },
      {
        quiz: {
          answer: "Rxf7+",
          prompt: "The rook slides off g7 — see what that uncovers.",
          explain: "Rxf7+! Moving off g7 reopens the bishop's diagonal to h8 — a discovered check — while grabbing another pawn.",
          strict: true,
        },
      },
      {
        play: ["Kg8"],
        text: "Back to g8, the only legal square once again.",
      },
      {
        quiz: {
          answer: "Rxf8+",
          prompt: "One more swing — there's a whole rook on the menu too.",
          explain: "Rxf8+! The windmill has now consumed two pawns and a rook, all through a repeating one-two of direct and discovered checks.",
          strict: true,
        },
      },
      {
        play: ["Kxf8"],
        text: "Black finally recaptures, but the damage — two clean extra pawns — is already done.",
      },
      {
        text: "The real Torre-Lasker game (1925) kept this seesaw going even longer, eating the opponent's queen along the way. Once you spot the battery, keep swinging as long as the king has only one reply.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // 14. Removing the defender
  // ---------------------------------------------------------------------
  {
    id: "removing-the-defender",
    title: "Removing the Defender",
    category: "concepts",
    group: "Tactical Motifs",
    level: "intermediate",
    summary: "No pin, no deflection needed — just capture the guard.",
    startFen: "r5k1/p1p2ppp/1n6/3N4/8/8/PPPPPPBP/6K1 w - - 0 1",
    steps: [
      {
        text: "Removing the defender: instead of pinning or deflecting a guard, simply capture it. Once it's off the board, whatever it was protecting is fair game.",
        arrows: [
          ["d5", "b6"],
          ["g2", "a8"],
        ],
        circles: ["b6", "a8"],
      },
      {
        text: "Black's rook on a8 sits on White's fianchettoed bishop's long diagonal — the only thing in the way is the knight on b6.",
      },
      {
        quiz: {
          answer: "Nxb6",
          prompt: "Trade off the piece that's blocking the diagonal — and doubling as a defender.",
          explain: "Nxb6! Even as a straight trade, this clears the long diagonal and removes a defender at the same time.",
          strict: true,
        },
      },
      {
        play: ["axb6"],
        text: "Black recaptures — but the diagonal to a8 is now completely open.",
      },
      {
        quiz: {
          answer: "Bxa8",
          prompt: "The rook has no defender left. Take it.",
          explain: "Bxa8! With the blocking piece gone, the bishop simply collects the rook for free.",
          strict: true,
        },
      },
      {
        text: "Removing the defender is the most direct tactical idea of all: if a piece is doing important work, sometimes the simplest plan is to just take it off the board.",
      },
    ],
  },
];
