// Openings: 1.d4 systems and assorted gambits.
export const LESSONS = [
  // ---------------------------------------------------------------
  {
    id: "qgd-declined-ideas",
    title: "Queen's Gambit: Declined — main ideas",
    category: "openings",
    group: "Queen's Gambit",
    level: "beginner",
    eco: "D30",
    summary: "Why Black keeps the extra pawn offer and how the minority attack works.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "d5", "c4"],
        text: "The Queen's Gambit: White offers the c-pawn to tempt Black's d-pawn away from the center. It isn't a real sacrifice — the pawn is easy to win back.",
        arrows: [["c4", "d5"]],
      },
      {
        play: ["e6"],
        text: "Declining: Black keeps the strong d5 pawn and just develops normally. This is the solid, classical approach.",
      },
      {
        play: ["Nc3", "Nf6", "Bg5"],
        text: "White pins the knight, adding pressure toward d5 and preparing e3/Nf3.",
        arrows: [["g5", "f6"]],
        circles: ["d5"],
        quiz: {
          answer: "Be7",
          also: ["Nbd7"],
          prompt: "Black needs to unpin and develop. What's the natural move?",
          explain: "Be7 breaks the pin along the g5-d8 diagonal and readies castling.",
        },
      },
      {
        play: ["e3", "O-O", "Nf3", "Nbd7"],
        text: "Both sides finish development. White's pieces eye d5/e5; Black solidifies the center with ...Nbd7.",
      },
      {
        play: ["Rc1"],
        text: "Rc1 puts the rook on the file that will open once queenside pawns start trading — preparing White's long-term plan.",
        circles: ["c1"],
        quiz: {
          answer: "c6",
          also: ["b6"],
          prompt: "Black reinforces d5 and gives the queen an escape on c7. What's the move?",
          explain: "c6 is the standard consolidating move in this structure.",
        },
      },
      {
        text: "Now the key strategic idea: White has no central pawn break here, so the plan is a minority attack — pushing the queenside pawns to create a weakness on Black's side.",
        arrows: [
          ["b2", "b4"],
          ["b4", "b5"],
        ],
      },
      {
        text: "White prepares it first (Bd3, castling, often trading on d5) and only then pushes b4-b5. Pushed too early — right now, for instance — b4 simply drops material. Plans need preparation.",
      },
      {
        text: "That's the QGD in a nutshell: Black gets a solid, symmetrical-looking structure; White's long-term plan is the minority attack, while Black counters with central play like ...e5 or piece activity.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "qga-main-lines",
    title: "Queen's Gambit Accepted",
    category: "openings",
    group: "Queen's Gambit",
    level: "intermediate",
    eco: "D20",
    summary: "Grab the pawn, then watch White win it right back with a big lead in development.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "d5", "c4"],
        text: "White offers the c-pawn again. This time Black decides to actually take it.",
        arrows: [["c4", "d5"]],
      },
      {
        text: "Accepting: grabbing the pawn is completely safe short-term, but Black must remember it's very hard to actually keep.",
        quiz: {
          answer: "dxc4",
          prompt: "Take the pawn — the Queen's Gambit Accepted.",
          explain: "Black is up a pawn for now. White will regain it with a well-timed Bxc4.",
        },
      },
      {
        play: ["Nf3", "Nf6", "e3", "e6"],
        text: "White doesn't rush to recapture — just develops naturally. The c4 pawn isn't going anywhere useful for Black.",
      },
      {
        text: "Now the bishop swings around to pick the pawn back up with tempo, since it also eyes f7.",
        quiz: {
          answer: "Bxc4",
          strict: true,
          prompt: "Where does the bishop go to reclaim the pawn?",
          explain: "Bxc4 regains the pawn and develops with tempo, aiming straight at f7.",
        },
      },
      {
        play: ["c5", "O-O"],
        text: "Black strikes back at the center immediately with ...c5, the standard counter-punch in the QGA. White castles.",
      },
      {
        text: "Black usually prepares ...b5 next, gaining queenside space and hitting the bishop — but needs to prep it first.",
        quiz: {
          answer: "a6",
          also: ["Nc6"],
          prompt: "Black prepares the ...b5 expansion. What's the standard prophylactic move?",
          explain: "a6 covers b5 so the pawn can't be met by a nasty Bxb5-style trick.",
        },
      },
      {
        text: "Typical plans from here: White plays Qe2, Rd1, and a well-timed e4; Black completes development with ...Bb7/...Nbd7 and looks to trade off central pawns or expand with ...b4.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "slav-fundamentals",
    title: "Slav Defence fundamentals",
    category: "openings",
    group: "Queen's Gambit",
    level: "intermediate",
    eco: "D10",
    summary: "Support d5 with the c-pawn instead of the e-pawn, keeping the light bishop free.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "d5", "c4"],
        text: "The gambit offer again — but this time Black supports d5 without blocking in the c8 bishop.",
      },
      {
        play: ["c6"],
        text: "The Slav Defence: c6 defends d5 while leaving the diagonal open for ...Bf5 or ...Bg4 later — the key difference from the QGD.",
      },
      {
        play: ["Nf3"],
        text: "White develops naturally.",
        quiz: {
          answer: "Nf6",
          prompt: "Black's most natural developing move, keeping the ...Bf5 idea alive?",
          explain: "Nf6 develops without touching the e-pawn, so the bishop can still get out.",
        },
      },
      {
        play: ["Nc3"],
        text: "White completes minor-piece development.",
        quiz: {
          answer: "dxc4",
          prompt: "Now that development permits it, Black grabs the gambit pawn. How?",
          explain: "dxc4 wins the pawn; the point is Black can hold it a while since ...b5 is coming.",
        },
      },
      {
        text: "White needs to stop ...b5 from permanently defending the extra pawn.",
        quiz: {
          answer: "a4",
          prompt: "What's White's standard way to rule out ...b5?",
          explain: "a4 stops ...b5 for good, so Black must give the pawn back eventually.",
        },
      },
      {
        play: ["Bf5"],
        text: "Black uses the moment to get the bishop out actively before playing ...e6 — exactly the point of the Slav move order.",
        circles: ["f5"],
      },
      {
        play: ["e3", "e6"],
        text: "White prepares to recapture on c4 with the bishop; Black locks in a solid center, only now closing the diagonal (after the bishop already escaped).",
      },
      {
        text: "Time to reclaim the pawn.",
        quiz: {
          answer: "Bxc4",
          strict: true,
          prompt: "How does White pick the c4 pawn back up?",
          explain: "Bxc4 restores material equality with a well-placed bishop.",
        },
      },
      {
        play: ["Bb4"],
        text: "Black pins the c3 knight, adding extra pressure. Typical continuations: White plays O-O/Qb3, Black plays O-O/Nbd7/...Qc7, often followed by a central ...e5 break.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "london-system",
    title: "London System",
    category: "openings",
    group: "d4 Systems",
    level: "beginner",
    eco: "D02",
    summary: "A simple, solid setup: Bf4, e3, c3, Nbd2, Bd3 — the same plan against almost anything.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["d4", "Nf6", "Bf4"],
        text: "The London System: White develops the bishop to f4 before playing e3, so it never gets stuck behind its own pawns.",
        circles: ["f4"],
      },
      {
        text: "Black has many reasonable replies here.",
        quiz: {
          answer: "d5",
          also: ["g6", "e6"],
          prompt: "What's Black's most natural central reply?",
          explain: "d5 stakes a claim in the center and prepares normal development.",
        },
      },
      {
        play: ["e3", "c5", "c3"],
        text: "White builds the classic 'London triangle' — pawns on d4, e3, c3 — a rock-solid, hard-to-attack structure.",
        circles: ["d4", "e3", "c3"],
      },
      {
        text: "Black continues developing naturally.",
        quiz: {
          answer: "Nc6",
          prompt: "What's a typical developing move here for Black?",
          explain: "Nc6 develops and adds pressure on d4.",
        },
      },
      {
        play: ["Nd2", "e6", "Ngf3"],
        text: "White develops both knights flexibly (Nd2 instead of Nc3, since c3 is a pawn) and keeps options open on which side to castle.",
      },
      {
        text: "Black often trades off White's good bishop before it gets too active.",
        quiz: {
          answer: "Bd6",
          prompt: "Black offers to trade off White's f4 bishop. What's the move?",
          explain: "Bd6 invites Bxd6 or forces the bishop to retreat to g3.",
        },
      },
      {
        play: ["Bg3", "O-O", "Bd3"],
        text: "White keeps the bishop, retreating to g3 rather than trading, then develops the other bishop to d3, aiming down the b1-h7 diagonal.",
      },
      {
        text: "Typical London plans: White looks for Ne5 outposts, sometimes h4-h5 kingside expansion, and Qe2/O-O-O setups. It's the same recipe against almost any Black setup — that's the whole appeal.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "kid-classic-attack",
    title: "King's Indian Defence — ideas and the classic kingside attack",
    category: "openings",
    group: "Indian Defences",
    level: "intermediate",
    eco: "E90",
    summary: "Fianchetto, strike with ...e5, then storm the kingside once the center locks.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"],
        text: "The King's Indian: Black lets White build a big pawn center, fianchettoes, then strikes back in the center with ...e5.",
        circles: ["g7", "e5"],
      },
      {
        play: ["O-O"],
        text: "Both sides have castled. Black completes development before deciding on ...Nc6.",
        quiz: {
          answer: "Nc6",
          prompt: "Black adds another attacker toward d4/e5. What's the move?",
          explain: "Nc6 increases the pressure and asks White what to do about the center.",
        },
      },
      {
        text: "White has a big decision: trade, hold the tension, or push forward. The most ambitious try locks the center completely.",
        quiz: {
          answer: "d5",
          prompt: "White's most challenging central choice — locking the position and gaining space?",
          explain: "d5 closes the center and attacks the c6 knight. This fixes the long-term plans for both sides: Black attacks on the kingside, White on the queenside.",
        },
      },
      {
        play: ["Ne7"],
        text: "The knight retreats and reroutes — heading toward g6, f4, or via the e7-c8-b6 path, and clearing c6 for later use.",
      },
      {
        play: ["Ne1", "Nd7"],
        text: "White repositions too, planning f2-f4 and later Nd3. Black mirrors this with ...Nd7, freeing f6 for the f-pawn's advance.",
      },
      {
        play: ["Nd3"],
        text: "White completes the classic Nf3-e1-d3 maneuver, supporting c5/b4 breaks and covering key squares.",
      },
      {
        text: "Black is fully ready for the thematic kingside pawn storm.",
        quiz: {
          answer: "f5",
          prompt: "Black launches the classic King's Indian plan. What's the move?",
          explain: "f5 begins the kingside pawn storm — next comes ...f4 and often ...g5-g4, throwing everything at White's king.",
        },
      },
      {
        text: "This is the essence of the King's Indian 'race': Black storms the kingside with f4/g5/g4 and piece sacrifices on h3 or g3; White counters on the queenside with c5, b4, and piece play down the c-file.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "nimzo-indian",
    title: "Nimzo-Indian Defence",
    category: "openings",
    group: "Indian Defences",
    level: "intermediate",
    eco: "E20",
    summary: "Pin the knight before White gets to play e4, trading structure for the bishop pair.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "Nf6", "c4", "e6", "Nc3"],
        text: "White plays Nc3 rather than Nf3 — this is the key branch point that allows the Nimzo-Indian.",
        circles: ["c3"],
      },
      {
        text: "Black pins the knight immediately, preventing e2-e4 and preparing to potentially wreck White's pawns.",
        quiz: {
          answer: "Bb4",
          prompt: "Black pins the knight to stop e4. What's the move?",
          explain: "Bb4 pins the c3 knight to the king, and threatens to trade for it, giving White doubled c-pawns.",
        },
      },
      {
        play: ["e3", "O-O", "Bd3"],
        text: "White solidifies the center and prepares to develop the kingside.",
      },
      {
        text: "Black stakes a claim in the center, keeping the extra pin as leverage.",
        quiz: {
          answer: "d5",
          prompt: "Black plays in the center, keeping the pin as an extra asset. What's the move?",
          explain: "d5 challenges c4 directly, transposing toward Queen's-Gambit-like structures — but with the extra bishop pin already in place.",
        },
      },
      {
        play: ["Nf3", "c5", "O-O", "Nc6", "a3"],
        text: "Both sides finish development. White finally challenges the bishop with a3, the key decision point of the whole opening.",
        circles: ["b4"],
      },
      {
        text: "Black must decide: retreat the bishop or trade it for the knight.",
        quiz: {
          answer: "Bxc3",
          also: ["Ba5"],
          prompt: "The main line: trade the bishop for the knight. What's the move?",
          explain: "Bxc3 hands White doubled c-pawns and the bishop pair — a classic Nimzo trade-off.",
        },
      },
      {
        play: ["bxc3"],
        text: "White recaptures, ending up with doubled c-pawns (c3 and c4) but the bishop pair and a strong center. Black's plans: pressure c4/e4 with pieces, or strike with ...e5 or ...b6/...Ba6.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "budapest-gambit",
    title: "Budapest Gambit",
    category: "openings",
    group: "Indian Defences",
    level: "intermediate",
    eco: "A52",
    summary: "Sacrifice a pawn immediately, then win it right back with active piece play.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["d4", "Nf6", "c4", "e5"],
        text: "The Budapest Gambit: Black offers a pawn on the very second move, aiming for quick piece activity.",
      },
      {
        text: "White's most testing response is to just take the pawn.",
        quiz: {
          answer: "dxe5",
          prompt: "White's most challenging reply?",
          explain: "dxe5 accepts the gambit — Black must now prove the sacrifice is worth it.",
        },
      },
      {
        play: ["Ng4", "Bf4", "Nc6", "Nf3"],
        text: "The whole point: the knight jumps straight back to attack the e5 pawn (and eye f2), while Black develops toward regaining the material.",
        arrows: [["g4", "e5"]],
      },
      {
        text: "Black adds pressure with a well-timed check.",
        quiz: {
          answer: "Bb4+",
          prompt: "Black plays a useful check, gaining a tempo. What's the move?",
          explain: "Bb4+ forces White to block or move the king, and develops with tempo.",
        },
      },
      {
        play: ["Nbd2", "Qe7", "a3"],
        text: "White blocks the check with the other knight and completes preparations. Black gets ready to finally regain the pawn.",
      },
      {
        text: "Time to grab the e5 pawn back.",
        quiz: {
          answer: "Ngxe5",
          prompt: "How does Black regain the gambit pawn?",
          explain: "Ngxe5 wins the pawn back, and after trades on e5 material is level again.",
        },
      },
      {
        play: ["Nxe5", "Nxe5"],
        text: "Material is level. Black has active pieces and open lines for the pawn that was sacrificed — a fair practical try, even if it doesn't promise an objective advantage.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "englund-gambit-refuted",
    title: "Englund Gambit and why it fails",
    category: "openings",
    group: "Offbeat Gambits",
    level: "beginner",
    eco: "A40",
    summary: "A dubious pawn sac with one famous trap — and an easy correct refutation.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["d4", "e5", "dxe5", "Nc6", "Nf3", "Qe7"],
        text: "The Englund Gambit: Black just sacrifices the e-pawn, hoping to win it back with quick tricks against e5 and b2.",
      },
      {
        play: ["Bf4"],
        text: "A natural-looking developing move — and a real mistake! It undefends b2 and walks right into a tactic.",
        quiz: {
          answer: "Qb4+",
          prompt: "White just blundered with 4.Bf4??. Find Black's punishment.",
          explain: "Qb4+ forks the king (check) and eyes both b2 and the bishop on f4 — a very common trap.",
        },
      },
      {
        play: ["Bd2"],
        text: "5.Bd2 blocks the check, but the b2 pawn is now completely undefended.",
        quiz: {
          answer: "Qxb2",
          prompt: "Black grabs a second pawn and attacks the a1 rook. What's the move?",
          explain: "Qxb2 wins a pawn and threatens ...Qxa1 next, since nothing currently defends the rook.",
        },
      },
      {
        play: ["Bc3"],
        text: "White counterattacks the queen — but this overlooks the pin.",
        quiz: {
          answer: "Bb4",
          prompt: "Black has a strong resource here. What's the move?",
          explain: "Bb4 pins the c3 bishop to White's king on e1 — it can no longer move off that diagonal except along it.",
        },
      },
      {
        play: ["Qd2", "Bxc3", "Qxc3"],
        text: "White defends the bishop a second time and recaptures with the queen — but the king is still sitting on e1 with almost nothing around it.",
      },
      {
        text: "Careful: the greedy 8...Qxa1?? actually throws the game away. There's something far better.",
        circles: ["c1", "e1"],
        quiz: {
          answer: "Qc1#",
          strict: true,
          prompt: "Black has a forced finish. Find it.",
          explain: "Qc1# — mate. White's own c2 pawn blocks the queen on c3 from defending c1, and the king has no square. (Only if White recaptures 8.Nxc3 instead does ...Qxa1 win material.)",
        },
      },
      {
        text: "That whole disaster is punishment for the specific mistake 4.Bf4??. With correct play — simply 4.Nc3!, keeping b2 defended — none of these tricks work, and White stays a clean pawn up. The Englund Gambit is objectively unsound; it survives only on traps.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "stafford-gambit",
    title: "Stafford Gambit",
    category: "openings",
    group: "Offbeat Gambits",
    level: "intermediate",
    eco: "C42",
    summary: "A flashy piece sacrifice full of mating traps — but a real problem if White defends well.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e5", "Nf3", "Nf6", "Nxe5"],
        text: "White wins a pawn in the Petrov the normal way. Instead of the usual recapture, Black has a surprising try.",
      },
      {
        text: "Rather than recapturing the knight, Black offers a whole piece.",
        quiz: {
          answer: "Nc6",
          speculative: true,
          prompt: "Black ignores material and plays a gambit move instead. What is it?",
          explain: "The Stafford Gambit: Black offers the piece back for fast development and attacking chances. Engines say White is simply better — this is a trap weapon, not a sound line.",
        },
      },
      {
        play: ["Nxc6", "dxc6"],
        text: "White grabs the piece. Black has doubled c-pawns but an open d-file, the bishop pair, and very quick development — plenty of practical compensation.",
      },
      {
        play: ["Nc3", "Bc5", "d3"],
        text: "White tries to consolidate calmly. Black continues developing toward the classic attacking setup.",
        quiz: {
          answer: "Ng4",
          prompt: "Black's typical follow-up, eyeing f2 and preparing ...Qh4?",
          explain: "Ng4 attacks f2 and h2 and clears the way for the queen to join the attack.",
        },
      },
      {
        play: ["Be2"],
        text: "A natural developing move — but a risky one, walking straight into Black's attacking ideas.",
        quiz: {
          answer: "Qh4",
          prompt: "Black brings the queen into the attack. What's the move?",
          explain: "Qh4 creates a big threat on f2: Kxf2 would be illegal (the king would still be in check from the knight on g4), so White is forced to give ground.",
        },
      },
      {
        play: ["Nb5"],
        text: "White goes hunting for c7 instead of dealing with the kingside threat — too slow.",
        quiz: {
          answer: "Qxf2+",
          prompt: "Find the shot that wins a pawn and forces the king to move.",
          explain: "White can't recapture — Kxf2 walks into check from the g4 knight — so the king is forced to d2 (its own queen still sits on d1), leaving White down a pawn with an exposed king.",
        },
      },
      {
        play: ["Kd2"],
        text: "A great practical result for the gambit: real material and attacking chances for very little risk. But this only works because White let the attack build unopposed.",
      },
      {
        text: "The correct defence: after 4...dxc6, White plays solidly with 5.d3 and is careful with move order — for example h3 before developing the bishop, or guarding f2 with Qf3/Qe2 early. Played accurately, White is simply up a piece for a pawn — the Stafford is a fun practical try, not a real refutation of 3.Nxe5.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "alien-gambit-caro-kann",
    title: "Alien Gambit",
    category: "openings",
    group: "Offbeat Gambits",
    level: "advanced",
    eco: "B18",
    summary: "A speculative knight sacrifice in the Classical Caro-Kann, aimed straight at Black's king.",
    orientation: "w",
    startFen: null,
    steps: [
      {
        play: ["e4", "c6", "d4", "d5", "Nc3", "dxe4", "Nxe4", "Nd7"],
        text: "Classical Caro-Kann: Black trades in the center and develops the knight to d7, preparing to meet threats to f7/e6.",
      },
      {
        play: ["Ng5"],
        text: "White reroutes the knight toward f7 and e6 — a standard idea, since ...Nd7 blocks the queen from covering those squares.",
        arrows: [
          ["g5", "f7"],
          ["g5", "e6"],
        ],
      },
      {
        text: "Black deals with the threats and develops.",
        quiz: {
          answer: "Ngf6",
          prompt: "Black develops the other knight to defend and challenge the center.",
          explain: "Ngf6 develops naturally while covering the key squares.",
        },
      },
      {
        play: ["Bd3", "e6", "N1f3", "h6"],
        text: "Normal course of the Classical Caro-Kann so far. The g5 knight is now attacked and would normally just retreat to e4 or f3.",
        circles: ["g5"],
      },
      {
        text: "Instead of retreating safely, White can try a speculative sacrifice — the 'Alien Gambit'.",
        quiz: {
          answer: "Nxe6",
          prompt: "Rather than retreating the attacked knight, White throws it in. What's the move?",
          explain: "Nxe6!? sacrifices the knight for a pawn, aiming to rip open Black's king, which is still stuck in the center.",
        },
      },
      {
        text: "Black's simplest and best response is just to take.",
        quiz: {
          answer: "fxe6",
          prompt: "How should Black meet the sacrifice?",
          explain: "fxe6 is correct and simplest — grab the free piece. Declining or getting fancy only helps White.",
        },
      },
      {
        text: "Material count: White has only a pawn for a full piece — a real deficit. In return, Black's king is stuck in the center and the e6/e7 pawns are weak, giving White quick development and attacking chances with moves like Qe2 and O-O-O.",
        circles: ["e6", "e8"],
      },
      {
        text: "This is a practical try, not a sound sacrifice. With careful, accurate defence — prioritizing king safety and untangling calmly — Black should be simply winning with the extra piece. Treat the Alien Gambit as a surprise weapon for fast games, not a real refutation of the Caro-Kann.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "french-fundamentals",
    title: "French Defence fundamentals",
    category: "openings",
    group: "Semi-Open",
    level: "beginner",
    eco: "C02",
    summary: "A solid pawn chain, a locked center, and a fight over the base of the chain.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "e6"],
        text: "The French Defence: a solid, slightly passive-looking first move that prepares ...d5 without blocking anything important yet.",
      },
      {
        play: ["d4", "d5", "e5"],
        text: "The Advance Variation: White locks the center immediately, gaining space but committing to a fixed pawn chain (d4-e5).",
        circles: ["d4", "e5"],
      },
      {
        text: "Black strikes right at the base of the pawn chain.",
        quiz: {
          answer: "c5",
          prompt: "What's Black's classic counter to the Advance Variation?",
          explain: "c5 attacks d4, the base of White's pawn chain — the main strategic battleground of the whole opening.",
        },
      },
      {
        play: ["c3", "Nc6", "Nf3"],
        text: "White reinforces d4 with c3, forming a longer chain (c3-d4-e5); Black keeps adding pressure.",
      },
      {
        text: "Black often adds a second attacker toward d4, hitting b2 as a bonus.",
        quiz: {
          answer: "Qb6",
          prompt: "What's Black's typical follow-up here?",
          explain: "Qb6 piles more pressure onto d4 (b2 is actually defended by the c1 bishop, so it's not really hanging yet).",
        },
      },
      {
        play: ["Be2"],
        text: "White calmly develops rather than worrying about b2.",
        quiz: {
          answer: "Nh6",
          prompt: "Black's knight can't reach f6 (it's blocked by pawns) — where does it go instead?",
          explain: "Nh6 heads for f5, the classic French rerouting square, hitting both e5 and d4 from the flank.",
        },
      },
      {
        text: "Big picture: Black chips away at the chain with ...cxd4 and sometimes ...f6, using pieces to pressure d4/e5; White supports the chain with pieces and looks to expand or attack on the kingside, all while watching the light squares that the pawn chain leaves behind.",
      },
    ],
  },
  // ---------------------------------------------------------------
  {
    id: "caro-kann-fundamentals",
    title: "Caro-Kann Defence fundamentals",
    category: "openings",
    group: "Semi-Open",
    level: "beginner",
    eco: "B10",
    summary: "Solid and slightly passive: develop the light bishop before the pawn chain traps it in.",
    orientation: "b",
    startFen: null,
    steps: [
      {
        play: ["e4", "c6"],
        text: "The Caro-Kann: Black prepares ...d5 while keeping the option to support it with the c-pawn rather than the e-pawn.",
      },
      {
        play: ["d4", "d5", "Nc3"],
        text: "White builds a full center; Black is ready to resolve the tension.",
      },
      {
        text: "The main-line choice: trade in the center.",
        quiz: {
          answer: "dxe4",
          prompt: "What's Black's classical main-line choice here?",
          explain: "dxe4 trades off the center pawn, and White will need a move to recapture.",
        },
      },
      {
        play: ["Nxe4"],
        text: "White recaptures with the knight, centralizing it for now.",
        quiz: {
          answer: "Bf5",
          prompt: "Before playing ...e6, Black develops a piece that would otherwise get stuck. Which one, and where?",
          explain: "Bf5 gets the light-squared bishop out *before* closing the diagonal with ...e6 — the key idea that distinguishes the Caro-Kann from the French.",
        },
      },
      {
        play: ["Ng3", "Bg6", "h4"],
        text: "The knight hops to g3, attacking the bishop again and forcing a further retreat; White grabs kingside space with h4, threatening h5.",
        arrows: [["h4", "h5"]],
      },
      {
        text: "Black needs to deal with the coming h5 push.",
        quiz: {
          answer: "h6",
          also: ["h5"],
          prompt: "How does Black stop further embarrassment from the h-pawn?",
          explain: "h6 rules out h5 hitting the bishop again, at the cost of a small kingside weakness.",
        },
      },
      {
        play: ["Nf3", "Nd7"],
        text: "Standard continuation: Black readies ...Ngf6 and ...e6 next.",
      },
      {
        text: "The resulting structure — sometimes called the Caro-Kann triangle — is solid but a touch passive for Black. White can castle either side and use the extra space; Black relies on a sound structure and completes development with ...e6, ...Ngf6/...Qc7, and ...O-O.",
      },
    ],
  },
];
