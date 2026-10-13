// The engine contract the rest of the app relies on. src/engine.js's Engine
// (Stockfish over UCI) implements it; a different engine, such as a
// human-like model for bots, only has to provide the same shape to be passed
// to chooseBotMove, reviewGame or moveIsGoodEnough.
//
// @typedef {object} EngineLine
// @property {string}   move   best move of the line, UCI
// @property {number?}  cp     centipawns from the side to move, or null with mate
// @property {number?}  mate   moves to mate from the side to move (negative: getting mated)
// @property {string[]} pv     the line, UCI
// @property {number}   depth
//
// @typedef {object} EngineLike
// @property {Promise<void>} ready
// @property {(fen: string, opts?: { movetime?: number, depth?: number, nodes?: number,
//             multipv?: number, elo?: number, skill?: number, tag?: string })
//            => Promise<{ lines: EngineLine[], bestmove: string|null, cancelled?: boolean }>} analyze
// @property {(tag: string) => void} cancel     drop queued work and stop the running search for a tag
// @property {() => void} stopCurrent          stop whatever is running

export {};
