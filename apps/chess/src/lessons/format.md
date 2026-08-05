# Lesson format

Every lesson file exports an array of lesson objects. A lesson walks the
learner through a position: some moves play automatically with commentary,
and at key points the learner has to find the move themselves.

```js
{
  id: "traxler",                    // unique slug, stable (progress is keyed on it)
  title: "Traxler Counterattack",
  category: "openings",             // "openings" | "concepts" | "endgames"
  group: "Italian Game",            // section heading in the list
  level: "intermediate",            // "beginner" | "intermediate" | "advanced"
  eco: "C57",                       // optional, openings only
  summary: "One-line hook shown in the lesson list.",
  orientation: "b",                 // whose side the learner sits on ("w" default)
  startFen: null,                   // null = normal starting position
  steps: [ ... ]
}
```

## Steps

Each step optionally plays moves, shows text, and optionally asks the
learner for a move. Steps run in order, continuing from the position the
previous step left behind.

```js
{
  play: ["e4", "e5", "Nf3", "Nc6", "Bc4", "Nf6", "Ng5"],  // SAN, auto-played
  text: "White goes for the Fried Liver. The knight eyes f7…",
  arrows: [["c4", "f7"], ["g5", "f7"]],   // optional highlight arrows
  circles: ["f7"],                        // optional highlighted squares
  quiz: {
    answer: "Bc5",                        // SAN the learner must find
    also: ["Bxf2+"],                      // optional accepted alternatives
    prompt: "Black ignores the attack on f7. What's the shot?",
    explain: "The point: …",              // shown after they get it
    strict: true,                         // true → answer must be an engine top choice
    speculative: true,                    // true → knowingly objectively second-best
  },
}
```

`strict` and `speculative` are opposites and set the bar the validator holds
the answer to:

- `strict: true` — the answer must be the engine's top move. Use for tactics
  and forced sequences.
- neither — the answer must not lose more than 1 pawn versus best. Use for
  ordinary theory where several moves are playable.
- `speculative: true` — the answer is a gambit or sideline that is knowingly
  objectively inferior (a Traxler, a King's Gambit); allowed up to 2.5 pawns,
  and the lesson text **must** say plainly that it is objectively second-best
  and why you'd still play it.

Rules:

- `play` moves are SAN strings, legal from the running position.
- A step may have `play`, `text`, `quiz` in any combination; `text` alone is
  a commentary beat on the current position.
- The `quiz.answer` move is applied to the position once found, so later
  steps continue from it.
- Keep `text` under ~280 characters — it renders under the board on a phone.
- Set `strict: true` only when the answer really is the objectively best
  move (tactics, forced sequences). For opening theory where several moves
  are playable, leave it off — the validator then only checks the move
  isn't a blunder.

## Validation (required)

`node validate-lessons.mjs` (in the app root) checks every lesson:

1. every `play` move and `quiz.answer` is legal in its position,
2. ids are unique, required fields present, text lengths sane,
3. with `--engine`, each quiz answer is checked against Stockfish: `strict`
   answers must be the engine's top move, others must not lose more than
   1 pawn versus the best move.

Content that fails validation does not ship.
