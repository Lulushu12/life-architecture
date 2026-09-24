import { ordinal, ranks, signed } from "./rules.js";
import { PALETTE, cycleColor, initials } from "./players.js";

export function Avatar({ name, color }) {
  const pal = color != null ? PALETTE[color] : null;
  return (
    <span className="avatar" aria-hidden="true" style={pal ? { background: pal.bg, color: pal.ink } : undefined}>
      {initials(name)}
    </span>
  );
}

export function NumberGrid({ max, disabled = [], onPick, label }) {
  const nums = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <div className="numgrid" role="group" aria-label={label}>
      {nums.map((i) => (
        <button
          key={i}
          type="button"
          className={"numbtn" + (disabled.includes(i) ? " off" : "")}
          disabled={disabled.includes(i)}
          onClick={() => onPick(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

export const displayNames = (players) => players.map((p, i) => p.trim() || `Player ${i + 1}`);

export function duplicateName(names) {
  const seen = new Set();
  for (const name of names) {
    const k = name.toLowerCase();
    if (seen.has(k)) return name;
    seen.add(k);
  }
  return null;
}

export function PlayersEditor({ players, setPlayers, colors, setColors, onCountChange, recent = [] }) {
  const names = displayNames(players);
  const dup = duplicateName(names);
  const taken = new Set(players.map((p) => p.trim().toLowerCase()).filter(Boolean));
  const suggestions = recent.filter((r) => !taken.has(r.toLowerCase()));
  const firstEmpty = players.findIndex((p) => !p.trim());

  const fill = (name) =>
    setPlayers((ps) => {
      const i = ps.findIndex((p) => !p.trim());
      return i === -1 ? ps : ps.map((x, j) => (j === i ? name : x));
    });

  return (
    <div className="field">
      <div className="flabel">Players</div>
      <div className="chips" role="group" aria-label="Number of players">
        {[3, 4, 5, 6].map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={players.length === k}
            className={"chip" + (players.length === k ? " sel" : "")}
            onClick={() => onCountChange(k)}
          >
            {k}
          </button>
        ))}
      </div>
      {players.map((p, i) => (
        <div key={i} className="playerrow">
          <button
            type="button"
            className="avatarbtn"
            aria-label={`Change colour for ${names[i]}`}
            title="Change colour"
            onClick={() => setColors((cs) => cycleColor(cs, i))}
          >
            <Avatar name={names[i]} color={colors[i]} />
          </button>
          <input
            className={"input" + (dup && names[i].toLowerCase() === dup.toLowerCase() ? " invalid" : "")}
            placeholder={`Player ${i + 1}`}
            aria-label={`Player ${i + 1} name`}
            autoCapitalize="words"
            autoComplete="off"
            enterKeyHint="next"
            value={p}
            onChange={(e) => setPlayers((ps) => ps.map((x, j) => (j === i ? e.target.value : x)))}
          />
        </div>
      ))}
      {dup && <p className="warn">Two players are named {dup}. Give each player a different name.</p>}
      {suggestions.length > 0 && (
        <>
          <div className="flabel">Recent players</div>
          <div className="chips recentchips">
            {suggestions.map((name) => (
              <button key={name} type="button" className="chip" disabled={firstEmpty === -1} onClick={() => fill(name)}>
                + {name}
              </button>
            ))}
          </div>
          {firstEmpty === -1 && <p className="hint small">Clear a name to fill it from this list.</p>}
        </>
      )}
    </div>
  );
}

export function Standings({ players, totals, colors = [], onPlayAgain, againHint, children }) {
  const place = ranks(totals);
  const best = Math.max(...totals);
  const rows = players.map((p, i) => ({ p, i, t: totals[i], r: place[i] })).sort((a, b) => a.r - b.r);
  return (
    <div className="card standings">
      <h3>Final standings</h3>
      {rows.map((row, i) => (
        <div key={i} className={"standrow r" + (row.r - 1)}>
          <span className="place" aria-label={ordinal(row.r) + " place"}>
            {row.r}
          </span>
          <Avatar name={row.p} color={colors[row.i]} />
          <span className="pname">{row.p}</span>
          {row.t < best && <span className="pdelta">{signed(row.t - best)}</span>}
          <span className="ptotal">{row.t}</span>
        </div>
      ))}
      {place.filter((r) => r === 1).length > 1 && <p className="hint small">Tied for first place.</p>}
      {children}
      {onPlayAgain && (
        <>
          <button type="button" className="bigbtn start" onClick={onPlayAgain}>
            Play again with these players
          </button>
          {againHint && <p className="hint small">{againHint}</p>}
        </>
      )}
    </div>
  );
}

export function BigBoard({ players, totals, colors = [], scored, sub }) {
  const place = ranks(totals);
  const best = Math.max(...totals);
  return (
    <div className="bigboard">
      {sub && <div className="bbsub">{sub}</div>}
      <div className="bbgrid">
        {players.map((p, i) => (
          <div
            key={i}
            className={"bbtile" + (scored && place[i] === 1 ? " lead" : "")}
            style={colors[i] != null ? { borderTopColor: PALETTE[colors[i]].bg } : undefined}
          >
            <div className="bbname">
              <Avatar name={p} color={colors[i]} />
              <span>{p}</span>
            </div>
            <div className="bbtotal">{totals[i]}</div>
            <div className="bbmeta">
              {scored ? (
                <>
                  <span className={"rankbadge r" + place[i]}>{ordinal(place[i])}</span>
                  {totals[i] < best && <span className="delta">{signed(totals[i] - best)}</span>}
                </>
              ) : (
                <span className="delta">No scores yet</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableViewToggle({ on, onToggle }) {
  return (
    <button type="button" className={"tvtoggle" + (on ? " on" : "")} aria-pressed={on} onClick={onToggle}>
      Table view
    </button>
  );
}

export function TotalHead({ name, color, total, rank, delta, scored, children }) {
  return (
    <th className="phead" style={color != null ? { boxShadow: `inset 0 3px 0 ${PALETTE[color].bg}` } : undefined}>
      <Avatar name={name} color={color} />
      <div className="thname" title={name}>
        {name}
      </div>
      <div className="thtotal">{total}</div>
      <div className="thmeta">
        {scored ? (
          <>
            <span className={"rankbadge r" + rank}>{ordinal(rank)}</span>
            {delta < 0 && <span className="delta">{delta}</span>}
          </>
        ) : (
          <span className="delta">&nbsp;</span>
        )}
      </div>
      {children}
    </th>
  );
}
