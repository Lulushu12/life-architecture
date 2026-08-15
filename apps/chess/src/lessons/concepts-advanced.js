// Advanced concepts.
//
// The concept tree was thin at the top — three quarters of it sat at beginner
// and intermediate, so anyone past the basics ran out of material quickly.
// These are the long-term, plan-level ideas: what to do when there is no
// tactic and no obvious move, only a structure to work with.
//
// Every position and every quiz answer here was checked against the app's own
// Stockfish before the commentary was written. A third lesson on colour
// complexes was cut for failing that check twice: the engine wants to answer
// the developing move with a tactic rather than occupy the weak colour, and a
// lesson whose main point the engine talks you out of is worse than no lesson.

export const LESSONS = [
  {
    id: "minority-attack",
    title: "The minority attack",
    category: "concepts",
    group: "Pawn Structures",
    level: "advanced",
    summary: "Two pawns marching at three, on purpose. The point isn't to win the fight — it's to leave a hole behind.",
    orientation: "w",
    startFen: "r2q1rk1/pp1n1ppp/2p2n2/3p4/3P4/3BPN2/PPQ2PPP/R4RK1 w - - 0 1",
    steps: [
      {
        text: "This is the Carlsbad structure — it comes from the Exchange Queen's Gambit and a dozen other openings. Black has three queenside pawns against White's two, and the dark-squared bishops are already off, which is what makes the plan below possible.",
        circles: ["a7", "b7", "c6", "a2", "b2"],
      },
      {
        text: "Being outnumbered on a wing normally means you defend there. The minority attack says the opposite: push the two pawns at the three deliberately, because trading leaves Black with a permanent weakness.",
        arrows: [["b2", "b5"]],
      },
      {
        quiz: {
          answer: "b4",
          prompt: "Start the march.",
          explain: "b4 heads for b5. When it eventually takes on c6, Black recaptures with the b-pawn and is left with a backward c-pawn on a half-open file — a target no pawn can ever defend. Note why the bishop trade mattered: with a black bishop still on e7 or d6 this move simply hangs to ...Bxb4.",
        },
      },
      {
        play: ["a6"],
        text: "Black takes b5 away for a moment. That's fine — you have another pawn.",
      },
      {
        quiz: {
          answer: "a4",
          prompt: "Support the advance.",
          explain: "Now b5 is coming whether Black likes it or not. Note how slow this is: three or four moves of pure preparation. Minority attacks are not fast, they're inevitable.",
        },
      },
      {
        play: ["Re8"],
        text: "Black develops and waits. Time to break through.",
      },
      {
        quiz: {
          answer: "b5",
          prompt: "Push. You're offering a pawn trade you want.",
          explain: "After axb5 axb5 the a-file opens for your rook, and bxc6 next leaves the target on c6. You've turned your minority into an open file and a fixed weakness.",
        },
      },
      {
        text: "The finished product to aim for: a backward Black pawn on c6, a half-open c-file for your rooks, and the c5 square as an outpost. That's a whole middlegame plan from a pawn structure alone.",
        circles: ["c6", "c5"],
      },
      {
        text: "The counter is worth knowing too. Black's answer to a minority attack is almost never to defend the queenside — it's to start a kingside attack and get there first.",
      },
    ],
  },

  {
    id: "two-weaknesses",
    title: "The principle of two weaknesses",
    category: "concepts",
    group: "Positional Play",
    level: "advanced",
    summary: "One target can be defended forever. Winning means opening a second front far enough away that one king can't cover both.",
    orientation: "w",
    startFen: "6k1/5ppp/8/8/P7/8/5PPP/6K1 w - - 0 1",
    steps: [
      {
        text: "White is a pawn up, and it's an outside passed pawn — the kingside is three against three, and the extra pawn sits alone on the far wing. That distance is the whole point.",
        circles: ["a4"],
      },
      {
        text: "Notice what the extra pawn does not do: it doesn't queen by itself, and Black's king can stop it easily enough. Its value is that stopping it takes Black's king all the way to the other side of the board.",
        arrows: [["g8", "a8"]],
      },
      {
        quiz: {
          answer: "Kf1",
          prompt: "Bring the king out. It has the longest journey of anything on the board.",
          explain: "Running the a-pawn straight away is just as good here — but the pawn only decoys, it doesn't finish. Something has to arrive on the kingside afterwards to collect, and the king is a long way from the door.",
        },
      },
      {
        play: ["Kf8"],
        text: "Black's king comes too. Keep walking toward the middle.",
      },
      {
        quiz: {
          answer: "Ke2",
          prompt: "Straight for the centre.",
          explain: "Heading for e3 and d4, where the king can go either way — escort the a-pawn, or invade on the kingside. Keeping both options alive is what forces Black to guess.",
        },
      },
      {
        text: "The winning plan: run the a-pawn far enough that Black's king must abandon the kingside to catch it. That creates the second weakness — Black's kingside pawns, now undefended — and White's king switches wings and eats them.",
        arrows: [["a4", "a7"], ["e3", "g5"]],
      },
      {
        text: "That's the principle. One weakness the defender simply guards; two weaknesses on opposite wings ask a single king to be in two places. Almost every won endgame comes down to manufacturing the second one.",
      },
      {
        text: "Read it backwards when you're defending: if you're worse, don't create a second weakness to relieve pressure on the first. Sit still and make your opponent find one.",
      },
    ],
  },
];
