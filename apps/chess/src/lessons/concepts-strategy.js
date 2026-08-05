// Strategy and endgame lessons: piece play, pawn structures, positional
// principles, and the two cornerstone rook-endgame techniques.

export const LESSONS = [
  // ---------------------------------------------------------------------
  // PIECE PLAY
  // ---------------------------------------------------------------------
  {
    id: "outposts",
    title: "Outposts",
    category: "concepts",
    group: "Piece Play",
    level: "intermediate",
    summary: "A knight no pawn can ever kick is worth a rook's attention.",
    orientation: "w",
    startFen: "r1bq1rk1/pp3ppp/2n5/3Np3/2P1P3/8/PP3PPP/R1BQ1RK1 w - - 0 1",
    steps: [
      {
        text: "An outpost is a square — usually rank 4-6 — that enemy pawns can never attack. This knight on d5 is a permanent resident.",
        arrows: [["e4", "d5"]],
        circles: ["d5"],
      },
      {
        text: "Check the pawns: Black's c- and e-pawns are gone or already past d5. No pawn will ever chase this knight away — only a piece trade (like ...Nxd5) can remove it, and White is happy to recapture.",
        circles: ["c6", "e5"],
      },
      {
        quiz: {
          answer: "Be3",
          prompt: "Bring another piece toward the center to work with the knight. Which move develops with purpose?",
          explain: "Be3 centralizes and eyes c5/a7 — the knight isn't just strong on its own, it's the anchor for the rest of White's pieces.",
        },
      },
      { play: ["Qd6"], text: "Black tries to hold everything together with the queen." },
      {
        quiz: {
          answer: "b4",
          prompt: "Grab more space on the queenside now that the pieces are coordinated.",
          explain: "b4 gains ground and prepares c5 or b5 next — with the outpost fixed for good, White can expand at leisure.",
        },
      },
      {
        text: "Rule of thumb: an outpost is only as good as what's parked on it. Look for the square first, then find the piece to fill it — and the pieces to keep it fed.",
      },
    ],
  },
  {
    id: "good-bad-bishop",
    title: "Good bishop vs. bad bishop",
    category: "concepts",
    group: "Piece Play",
    level: "intermediate",
    summary: "The same piece can be a monster or a tall pawn — it depends on your own structure.",
    orientation: "w",
    startFen: "2b3k1/p4ppp/2p5/3p4/3P4/1B6/PP3PPP/6K1 w - - 0 1",
    steps: [
      {
        text: "Both sides kept a bishop of the same color. White's pawns sit on dark squares, leaving the light-squared bishop free to roam.",
        arrows: [["b3", "e6"]],
      },
      {
        text: "Black's pawns (c6, d5) sit on the SAME color as the bishop on c8. That bishop is boxed in by its own pawns — a classic 'bad bishop'.",
        circles: ["c8", "c6", "d5"],
      },
      {
        text: "The fix isn't always available: if Black could trade off c6/d5 or reroute the bishop outside the chain, 'bad' would stop applying. Static labels don't survive every position.",
      },
      {
        quiz: {
          answer: "Kf1",
          prompt: "With bishops fixed, this becomes a battle for squares. What should the king start doing?",
          explain: "March the king toward the center — the bad bishop can't contest key squares the way a good one could.",
        },
      },
      { play: ["Kf8"], text: "Black's king shadows White's." },
      {
        quiz: {
          answer: "Ke2",
          prompt: "Keep walking. Which square continues the march toward the center?",
          explain: "Ke2 heads for d3/e3, aiming at the light squares in front of Black's own pawns.",
        },
      },
      {
        text: "The endgame plan: bring the king to c5 or e5, and the bad bishop will just watch — it can never guard those light squares itself.",
      },
    ],
  },
  {
    id: "bishop-pair",
    title: "The bishop pair",
    category: "concepts",
    group: "Piece Play",
    level: "intermediate",
    summary: "Two bishops cover every square on the board between them — a long-term structural edge.",
    orientation: "w",
    startFen: "r2q1rk1/ppp2ppp/2n2n2/3p4/3P4/3BB3/PPP2PPP/R2Q1RK1 w - - 0 1",
    steps: [
      {
        text: "White kept both bishops; Black kept two knights instead. Together, two bishops control every square, light and dark — no piece does that alone.",
        arrows: [["d3", "h7"], ["e3", "a7"]],
      },
      {
        text: "The pair is strongest when the position opens up — long diagonals, few pawns blocking the way. It's weakest when everything is locked shut.",
      },
      {
        quiz: {
          answer: "c3",
          prompt: "Support the center pawn first — solid before spectacular.",
          explain: "c3 backs up d4 and keeps everything flexible; there's no rush when the long-term structural edge isn't going anywhere.",
        },
      },
      { play: ["Ne7"], text: "Black repositions a knight, wary of the kingside buildup." },
      {
        quiz: {
          answer: "Qf3",
          prompt: "Centralize the queen so it works with both diagonals. Which square does that?",
          explain: "Qf3 lines up with Bd3 toward h7 and keeps an eye on the long light-squared diagonal too.",
        },
      },
      { play: ["c6"], text: "Black solidifies rather than break open the center — understandable, since that favors the bishops." },
      {
        quiz: {
          answer: "Bg5",
          prompt: "Put the second bishop to work too, pinning the defender of e7/f6.",
          explain: "Bg5 develops with tempo — both bishops are now fully active, exactly the kind of position where the pair really shines.",
        },
      },
    ],
  },
  {
    id: "rooks-open-files-7th",
    title: "Rooks on open files and the 7th rank",
    category: "concepts",
    group: "Piece Play",
    level: "beginner",
    summary: "A rook with a clear road and enemy pawns to eat is the simplest way to win material.",
    orientation: "w",
    startFen: "5rk1/pp3ppp/8/8/8/8/PP3PPP/2R3K1 w - - 0 1",
    steps: [
      {
        text: "The c-file is completely open — no pawns on it for either side. That's exactly where a rook wants to live.",
        arrows: [["c1", "c7"]],
      },
      {
        quiz: {
          answer: "Rc7",
          prompt: "Send the rook all the way down the open file. Where does it cause the most trouble?",
          explain: "The 7th rank is gold: White's rook now attacks b7 and can roll along the whole rank, since Black's rook is stuck on the back row.",
        },
      },
      { play: ["b6"], text: "Black tries to save the b-pawn by pushing it to safety — but that opens the a-file path for the rook too." },
      {
        quiz: {
          answer: "Rxa7",
          prompt: "The b-pawn moved out of the way. What's now hanging on the 7th rank?",
          explain: "a7 was left completely undefended. One free pawn, and White's rook is still dominating the 7th.",
          strict: true,
        },
      },
      { play: ["Rb8"], text: "Black finally activates the rook, a move too late." },
      {
        quiz: {
          answer: "b4",
          prompt: "Consolidate and keep expanding — there's no rush to trade rooks while yours is this strong.",
          explain: "b4 gains more space; White is up a clean pawn with the more active rook and no weaknesses.",
        },
      },
    ],
  },
  {
    id: "knights-vs-bishops",
    title: "Knights vs. bishops: which is better when",
    category: "concepts",
    group: "Piece Play",
    level: "intermediate",
    summary: "Closed position: think knight. Open position: think bishop. Neither rule is absolute.",
    orientation: "w",
    startFen: "r4rk1/ppp1bppp/4p3/3pP3/3P4/2N5/PPP2PPP/R4RK1 w - - 0 1",
    steps: [
      {
        text: "The center is locked — White's pawn chain d4-e5 faces Black's d5-e6, and nobody is capturing. In closed positions like this, knights usually outperform bishops.",
        circles: ["d4", "e5", "d5", "e6"],
      },
      {
        text: "Why: a knight can hop over the pawn wall to reach c5, d3, or f5. Black's bishop on e7 is stuck behind its own pawns with nowhere useful to go.",
        arrows: [["c3", "d5"], ["c3", "b5"]],
      },
      {
        text: "Flip the position around — open it up with pawn trades — and the bishop's long diagonal usually becomes the stronger piece. Same pieces, opposite verdict.",
      },
      {
        quiz: {
          answer: "Ne2",
          prompt: "Start rerouting the knight toward a square the bishop can never contest — d4 or f4.",
          explain: "Ne2 heads for d4 (or f4), a square permanently out of the bishop's reach — this is exactly how knights outmaneuver bad bishops in closed positions.",
        },
      },
      { play: ["c5"], text: "Black tries to strike back on the queenside." },
      {
        quiz: {
          answer: "c3",
          prompt: "Keep the center solid before committing to anything else.",
          explain: "c3 keeps d4 fully supported — with the center locked, there's no rush; the side with the better minor piece can improve at leisure.",
        },
      },
    ],
  },

  // ---------------------------------------------------------------------
  // PAWN STRUCTURES
  // ---------------------------------------------------------------------
  {
    id: "isolated-queens-pawn",
    title: "Isolated queen's pawn (IQP): both sides' plans",
    category: "concepts",
    group: "Pawn Structures",
    level: "advanced",
    summary: "A weakness in the endgame, a battering ram in the middlegame — the IQP cuts both ways.",
    orientation: "w",
    startFen: "r2q1rk1/pp3ppp/2n1bn2/3p4/3P4/2N2N2/PP3PPP/R1BQ1RK1 w - - 0 1",
    steps: [
      {
        text: "White's d-pawn has no pawn on c- or e-file to support it — that's the IQP. It can't be defended by a pawn, ever.",
        circles: ["d4"],
      },
      {
        text: "In exchange, White gets the open c- and e-files, freer piece play, and a natural attacking plan against the kingside.",
        arrows: [["a1", "c1"], ["f1", "e1"]],
      },
      {
        quiz: {
          answer: "Bg5",
          prompt: "Increase the pressure with a pin. Which move develops with tempo?",
          explain: "Bg5 pins the f6 knight — one of d5's key defenders — and keeps Black's position under a magnifying glass.",
        },
      },
      { play: ["h6"], text: "Black asks the question." },
      {
        quiz: {
          answer: "Bh4",
          prompt: "Keep the pin alive rather than resolving it.",
          explain: "Bh4 maintains the pressure on f6; trading it off would give up the IQP's whole point — active pieces.",
        },
      },
      { play: ["Rc8"], text: "Black contests the only open file." },
      {
        quiz: {
          answer: "Rc1",
          prompt: "Don't let Black have the c-file uncontested. Which rook move fights for it?",
          explain: "Rc1 meets Black on the open file — with pieces this active, the isolated pawn is an asset, not a burden.",
        },
      },
      {
        text: "The honest catch: trade off enough pieces and reach an endgame, and that same pawn becomes a permanent target with no compensation left. Whoever wants the trades usually wants the endgame.",
      },
    ],
  },
  {
    id: "hanging-pawns",
    title: "Hanging pawns",
    category: "concepts",
    group: "Pawn Structures",
    level: "advanced",
    summary: "Two connected pawns on an open board, unsupported by neighbors — dynamic, but one weakness away from collapse.",
    orientation: "w",
    startFen: "r2q1rk1/pppb1ppp/2n2n2/8/2PP4/2N2N2/PP3PPP/R2Q1RK1 w - - 0 1",
    steps: [
      {
        text: "White's c4 and d4 pawns stand side by side with open files on both sides — 'hanging pawns'. They control d5 and c5 and cramp Black's pieces.",
        circles: ["c4", "d4"],
      },
      {
        text: "The danger: they can't be defended by other pawns, so if they're ever forced to advance and get blockaded or traded, one of them becomes a lasting weakness.",
      },
      {
        quiz: {
          answer: "d5",
          prompt: "Their dynamism is a clock, not just a weakness. Which push hits the c6 knight with real tempo?",
          explain: "d5! If the knight grabs the pawn, Nxd5 Nxd5 just trades a pawn for a knight in White's favor — Black has to retreat instead, ceding space.",
        },
      },
      { play: ["Ne7"], text: "Black retreats rather than lose material to the fork." },
      {
        quiz: {
          answer: "Qd4",
          prompt: "Centralize the queen on the square the pawn just vacated, eyeing the whole board.",
          explain: "Qd4 dominates the center — hanging pawns that get to advance with tempo like this are anything but a pure weakness.",
        },
      },
      { play: ["Ng6"], text: "Black scrambles to get a piece back toward the kingside." },
      {
        quiz: {
          answer: "Rfe1",
          prompt: "Bring the last piece into the game before deciding on a final plan.",
          explain: "Rfe1 completes development with everything working together — exactly the kind of activity hanging pawns are meant to buy.",
        },
      },
    ],
  },
  {
    id: "backward-pawns-holes",
    title: "Backward pawns and holes",
    category: "concepts",
    group: "Pawn Structures",
    level: "intermediate",
    summary: "A pawn stuck behind its neighbors creates a permanent target — and a permanent parking spot for enemy pieces.",
    orientation: "w",
    startFen: "r4rk1/pp2pppp/3p4/2pN4/2P1P3/8/PP3PPP/R4RK1 w - - 0 1",
    steps: [
      {
        text: "Black's d6 pawn is backward: its neighbors (c5, e7) can't defend it by advancing, and c5 already passed it by. It's stuck on a half-open file.",
        circles: ["d6"],
      },
      {
        text: "The square in front of a backward pawn — here, d5 — is a 'hole'. No black pawn can ever contest it, and White's knight already lives there rent-free.",
        arrows: [["e4", "d5"]],
        circles: ["d5"],
      },
      {
        quiz: {
          answer: "Nxe7+",
          prompt: "The hole isn't just safe — it's a launching pad. What does the knight grab, with check?",
          explain: "Nxe7+! The e7 pawn was undefended — even a knight parked on a 'static' outpost can suddenly leap forward and win material.",
          strict: true,
        },
      },
      { play: ["Kh8"], text: "Black's king steps aside, down a clean pawn." },
      {
        quiz: {
          answer: "Rfe1",
          prompt: "Bring the last piece into play and consolidate the material edge.",
          explain: "Rfe1 completes development — a clean pawn up, with Black's structure still full of holes, this position wins itself with patience.",
        },
      },
    ],
  },
  {
    id: "passed-pawns",
    title: "Passed pawns and how to use them",
    category: "concepts",
    group: "Pawn Structures",
    level: "beginner",
    summary: "No enemy pawn can ever stop it — just the enemy king, and only if it can reach in time.",
    orientation: "w",
    startFen: "7k/5ppp/8/3P4/8/8/5PPP/6K1 w - - 0 1",
    steps: [
      {
        text: "A passed pawn has no enemy pawn on its file or the files next to it — nothing can ever block or capture it except the king.",
        circles: ["d5"],
      },
      {
        text: "Draw a square from the pawn to its promotion square: d5-d8-h8-h5. Black's king on h8 sits right at the edge — one tempo too far away to catch this pawn.",
        circles: ["d5", "d8", "h8", "h5"],
      },
      {
        quiz: {
          answer: "d6",
          prompt: "The king can't get here in time. Push it!",
          explain: "d6 — Black's king is still too far to interfere, and every tempo counts in a pawn race.",
          strict: true,
        },
      },
      { play: ["Kg8"], text: "Black's king rushes over, but the math doesn't work." },
      {
        quiz: {
          answer: "d7",
          prompt: "One more step. Keep going.",
          explain: "d7 — next stop, the queening square, and Black still can't arrive in time.",
          strict: true,
        },
      },
      { play: ["Kf8"], text: "The king arrives just as the pawn is about to cross the finish line." },
      {
        quiz: {
          answer: "d8=Q",
          prompt: "Finish it.",
          explain: "Promotion — and it's even checkmate here. A passed pawn's power isn't in the pawn itself, it's in the enemy king's inability to keep up.",
          strict: true,
        },
      },
      {
        text: "Caveat: if the defending king can reach the pawn's square in time, pushing alone won't work — you'll need your own king's support instead.",
      },
    ],
  },
  {
    id: "pawn-chains",
    title: "Pawn chains and where to attack them",
    category: "concepts",
    group: "Pawn Structures",
    level: "intermediate",
    summary: "Attack the base, not the tip — a chain only falls where it's anchored.",
    orientation: "w",
    startFen: "r1bqk2r/pppn1ppp/2n1p3/3pP3/3P4/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 0 1",
    steps: [
      {
        text: "White's pawns d4-e5 form a chain, each link defending the one in front. The tip (e5) looks tempting, but it's well defended.",
        circles: ["d4", "e5"],
      },
      {
        text: "The real target is the base — d4. If Black can remove or trade it off, the whole chain has nothing left to lean on.",
        arrows: [["e5", "d4"]],
      },
      {
        quiz: {
          answer: "Bd3",
          prompt: "Develop naturally and keep an eye on the kingside while Black plans the queenside break.",
          explain: "Bd3 develops with purpose, eyeing h7 — meanwhile Black will look to strike at d4 with ...c5 at some point.",
        },
      },
      { play: ["a6"], text: "Black prepares ...b5 with proper support before expanding." },
      {
        quiz: {
          answer: "O-O",
          prompt: "Get the king to safety before the position opens up.",
          explain: "O-O tucks the king away — races to attack a chain's base often open lines everywhere, so safety first.",
        },
      },
      { play: ["b5"], text: "Black expands on the queenside, gaining space before striking at the base with ...c5." },
      {
        text: "Note the other side of the coin too: Black's own chain (b5-a6, and later c5-d5) has its own base on b5 — White can eventually target that the same way, with a4.",
      },
    ],
  },
  {
    id: "doubled-pawns",
    title: "Doubled pawns: weakness or strength",
    category: "concepts",
    group: "Pawn Structures",
    level: "intermediate",
    summary: "Doubled pawns lose flexibility — but they also open a file and can gain the bishop pair. Don't assume they're automatically bad.",
    orientation: "w",
    startFen: "r1bqk2r/1pp2ppp/p1p2n2/4p3/4P3/3B4/PPPP1PPP/RNBQK2R w KQkq - 0 1",
    steps: [
      {
        text: "Black's c6/c7 pawns are doubled — they can't defend each other by advancing, and one is often a long-term target in the endgame.",
        circles: ["c6", "c7"],
      },
      {
        text: "But Black kept both bishops for this. Doubled pawns given up in exchange for the bishop pair, or an open file, are often a fair trade — not a pure weakness.",
      },
      {
        quiz: {
          answer: "Nc3",
          prompt: "Develop and keep the position flexible.",
          explain: "Nc3 develops naturally — with the c6-pawn fixed, there's no rush; the weakness isn't going anywhere.",
        },
      },
      { play: ["O-O"], text: "Black gets the king to safety." },
      {
        quiz: {
          answer: "Qe2",
          prompt: "Keep developing before deciding how (or whether) to target c6.",
          explain: "Qe2 connects the rooks and keeps flexible — attacking a doubled pawn early, before other pieces are ready, rarely achieves much.",
        },
      },
      {
        text: "The honest rule: doubled pawns matter most when they're also isolated (no neighboring pawns at all) and the position is heading toward an endgame. In the middlegame, with active pieces, they're often just a footnote.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // POSITIONAL PLAY
  // ---------------------------------------------------------------------
  {
    id: "prophylaxis",
    title: "Prophylaxis (stopping their plan)",
    category: "concepts",
    group: "Positional Play",
    level: "advanced",
    summary: "Before asking 'what do I want to do', ask 'what do they want to do' — and stop it first.",
    orientation: "w",
    startFen: "r2q1rk1/1bp2ppp/p1n1pn2/1p6/3P4/1BN1PN2/PP3PPP/R2Q1RK1 w - - 0 1",
    steps: [
      {
        text: "Before picking a plan, ask what Black wants. Here, ...b4 is coming, kicking the c3 knight and gaining a tempo with real momentum.",
        arrows: [["b5", "b4"]],
      },
      {
        quiz: {
          answer: "a4",
          prompt: "Meet the plan before it starts. Which pawn move challenges b5 right away?",
          explain: "a4 strikes first — if Black plays ...bxa4, Bxa4 recaptures actively; if Black pushes ...b4 instead, the knight simply relocates without losing tempo the same way.",
        },
      },
      { play: ["b4"], text: "Black presses on anyway, hitting the knight." },
      {
        quiz: {
          answer: "Ne2",
          prompt: "Don't get pushed backward awkwardly — reroute to a square with a future.",
          explain: "Ne2 sidesteps and eyes d4/f4/g3 later — a prophylactic retreat that costs nothing, since the knight was going to move eventually anyway.",
        },
      },
      { play: ["a5"], text: "Black consolidates the space gained." },
      {
        quiz: {
          answer: "Re1",
          prompt: "Their plan has run its course. Now play your own — develop the last piece toward the center.",
          explain: "Re1 completes development. Prophylaxis isn't passive: stop their idea, then get back to pursuing yours.",
        },
      },
      {
        text: "Prophylaxis doesn't mean playing scared — it means spending one move to remove your opponent's best idea before it's dangerous, then proceeding as normal.",
      },
    ],
  },
  {
    id: "space-tempo-development",
    title: "Space, tempo and development principles",
    category: "concepts",
    group: "Positional Play",
    level: "beginner",
    summary: "Every opening move is a trade of time for something — make sure you're getting a fair price.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e6"],
        text: "Move one: claim central space. e4 controls d5 and f5 and opens lines for the bishop and queen — one move, real value.",
      },
      {
        quiz: {
          answer: "d4",
          prompt: "Keep claiming the center — don't stop at one pawn when a second is free.",
          explain: "d4 grabs even more space; two center pawns cramp Black's pieces before development even starts.",
        },
      },
      { play: ["d5"], text: "Black fights back in the center immediately — correct." },
      {
        quiz: {
          answer: "Nc3",
          prompt: "Develop a new piece toward the center rather than moving something twice.",
          explain: "Nc3 develops with purpose and defends e4 — every move should either fight for the center, develop a piece, or get the king safe.",
        },
      },
      { play: ["Nf6"], text: "Black develops too, attacking e4." },
      {
        quiz: {
          answer: "e5",
          prompt: "Tempo doesn't only come from developing — a pawn push that attacks a piece gains a move too. Which push kicks the knight and grabs space?",
          explain: "e5 gains a tempo by attacking Nf6, forcing Black to spend a move retreating it — even a pawn move counts as 'using your tempo well' if it forces a response.",
        },
      },
      {
        text: "The trap to avoid: moving one piece three times, or grabbing a wing pawn, while the opponent develops three pieces. Each of those 'free' moves you spent is a tempo you'll never get back.",
      },
    ],
  },
  {
    id: "king-safety-castling",
    title: "King safety and when to castle",
    category: "concepts",
    group: "Positional Play",
    level: "beginner",
    summary: "Castle early, castle often is good advice — until the position tells you it isn't.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5"],
        text: "Both sides have developed a knight and bishop toward the center. The king is still on e1 — a tempting target down the open e-file eventually.",
      },
      {
        quiz: {
          answer: "O-O",
          prompt: "Nothing urgent to do first — tuck the king away while it's simple and safe.",
          explain: "O-O gets the king to safety and connects the rook to the center — usually correct once development allows it.",
        },
      },
      { play: ["Nf6"], text: "Black develops another piece, eyeing e4." },
      {
        quiz: {
          answer: "d3",
          prompt: "Shore up the center before anything gets tactical.",
          explain: "d3 defends e4 and opens the last bishop — with the king already safe, there's no rush to do anything drastic.",
        },
      },
      {
        text: "One rule of thumb: castle once you've developed a piece or two and there's no immediate tactic forcing you elsewhere — don't leave it so late that the center opens with your king still stuck in it.",
      },
      {
        text: "But it isn't automatic. If your opponent has already opened a file or aimed a pawn storm at one side, castling straight into it can be worse than staying in the center a little longer.",
      },
    ],
  },

  // ---------------------------------------------------------------------
  // ENDGAMES
  // ---------------------------------------------------------------------
  {
    id: "opposition-key-squares",
    title: "Opposition and key squares in king-and-pawn endings",
    category: "endgames",
    group: "Pawn Endings",
    level: "beginner",
    summary: "Whoever's king gets to the right square first decides the whole endgame — sometimes before a single pawn even moves.",
    orientation: "w",
    startFen: "3k4/8/3K4/3P4/8/8/8/8 w - - 0 1",
    steps: [
      {
        text: "This is one of the most important patterns in chess. A pawn on the 5th rank or beyond has three 'key squares' one rank ahead of it — here, c6, d6, e6.",
        circles: ["c6", "d6", "e6"],
      },
      {
        text: "If the attacking king occupies any key square, the pawn queens no matter who's to move. White's king is already on d6 — this is a won position.",
      },
      {
        quiz: {
          answer: "Kc6",
          prompt: "The pawn can't advance yet — your own king is in the way! Step aside (not backward) to keep Black's king boxed out.",
          explain: "Kc6 keeps control of the queening squares while finally getting out of the pawn's way.",
        },
      },
      {
        play: ["Kc8", "d6", "Kd8", "d7", "Ke7"],
        text: "Black's king can only shuffle back and forth; White simply escorts the pawn two more squares up the board.",
      },
      {
        text: "Careful here — promoting immediately would hang the brand-new queen to ...Kxd8! Always check that the queening square is actually defended first.",
      },
      {
        quiz: {
          answer: "Kc7",
          prompt: "Don't queen yet. Defend the queening square before you promote.",
          explain: "Kc7 guards d8 in advance — a small but essential habit: always make sure the queening square is covered before the pawn actually promotes.",
          strict: true,
        },
      },
      { play: ["Ke6"], text: "Black's king can't get anywhere useful and drifts away." },
      {
        quiz: {
          answer: "d8=Q",
          prompt: "Now it's completely safe. Finish the job.",
          explain: "A new queen, fully defended. Reaching the key square won the game; the only real danger left was rushing the very last move.",
          strict: true,
        },
      },
      {
        text: "Caveat: rook pawns (a- and h-pawns) are the exception — the defending king often draws just by reaching the corner, even from a key square. The rule above is for the other six files.",
      },
    ],
  },
  {
    id: "lucena-philidor",
    title: "Lucena and Philidor: the two rook-endgame positions everyone must know",
    category: "endgames",
    group: "Rook Endings",
    level: "intermediate",
    summary: "One position is a win you must know how to convert; the other is a draw you must know how to hold.",
    orientation: "w",
    startFen: "2K5/2P3k1/8/8/4R3/8/8/r7 w - - 0 1",
    steps: [
      {
        text: "The Lucena position: White's pawn is one step from queening, the king stands in front of it, and the rook sits in reserve on the 4th rank. With accurate play this is always a win.",
        circles: ["c7", "c8"],
        arrows: [["e4", "b4"]],
      },
      {
        quiz: {
          answer: "Kb7",
          prompt: "The king is blocking its own pawn! Step off the queening square.",
          explain: "Kb7 clears c8 for the pawn — but stepping off the file invites a check.",
        },
      },
      {
        play: ["Rb1+"],
        text: "Right on cue — Black checks from the side, the only real defensive try.",
      },
      {
        quiz: {
          answer: "Kc6",
          prompt: "You don't have to block every check. Keep the king close to the pawn and simply step around this one.",
          explain: "Kc6 sidesteps the check while staying right next to the pawn. The rook on e4 stays in reserve — ready to shield a future check by sliding along the 4th rank if the checks ever get dangerous. That reserve move is 'building the bridge', the core Lucena idea.",
        },
      },
      {
        text: "From here, White's king and rook simply out-coordinate Black's lone rook — every check runs out or costs Black material, and the point (queen the pawn, or win the rook trying to stop it) is only a matter of technique.",
      },
      {
        text: "Contrast that with the Philidor position: pawn NOT yet on the 7th, defender's king cut off in front of it, and the defending rook parked on the 6th rank, blocking the attacking king from ever crossing.",
      },
      {
        text: "Once the pawn is finally pushed to the 6th rank, the defending rook abandons that rank and swings behind the pawn instead, checking the king from behind forever — the king can't escape the checks and it's a draw.",
      },
      {
        text: "Knowing which one you're in decides everything: with an extra pawn about to queen, aim for Lucena's setup (king in front, rook in reserve). Defending a rook down, aim for Philidor's (rook on the 6th, then swing behind).",
      },
    ],
  },
];
