# Chess tests

```sh
npm test               # unit tests (Vitest, a scripted fake engine, no browser)
npm run test:e2e       # browser flows (Playwright) on the production build, real Stockfish
npm run test:lessons   # lesson data checks
python3 ../../tools/brand-sweep/check.py . --config brand.json   # from apps/chess
```

- `test/unit/` pins down how the app behaves today (characterization tests). A change that alters behaviour must update the matching test on purpose.
- Tests marked `it.fails` / `test.fail` are known bugs from `docs/chess-replica/01-audit.md`. Fixing the bug makes them fail. Then turn each one into a normal test.
- `test/fixtures/fakeEngine.js` stands in for Stockfish, so review classifications and bot choices are deterministic.
- CI (`.github/workflows/test.yml`) runs all of this. Pages and the APKs only build from main after it passes.
