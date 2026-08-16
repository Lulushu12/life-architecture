import { useEffect, useMemo, useRef, useState } from "react";
import { Chess } from "chess.js";
import Board from "./Board.jsx";
import { TopBar, MoveList, useArrowKeys } from "./ui.jsx";
import { newId } from "./storage.js";
import {
  loadGamesIndex,
  loadFamous,
  loadEvent,
  groupSeries,
  surname,
  downloadAll,
  fetchBroadcasts,
  fetchTour,
  fetchRoundGames,
  RESULT_LABEL,
} from "./gamesdb.js";

// The games database: 87,000+ professional tournament games from 1851 to
// today (bundled, works offline), a curated famous-games shelf, and live
// tournament broadcasts relayed by lichess.org when online.
export default function GamesDB({ store, setStore, nav }) {
  const [page, setPage] = useState({ name: "hub" });
  const [trail, setTrail] = useState([]); // stack of previous pages

  const go = (next) => {
    setTrail((t) => [...t, page]);
    setPage(next);
  };
  const back = () => {
    if (trail.length === 0) return nav("home");
    setPage(trail[trail.length - 1]);
    setTrail((t) => t.slice(0, -1));
  };

  const props = { store, setStore, nav, go, back };
  switch (page.name) {
    case "famous":
      return <FamousList {...props} />;
    case "catalog":
      return <Catalog {...props} cat={page.cat} title={page.title} />;
    case "archive":
      return <Archive {...props} />;
    case "series":
      return <Catalog {...props} series={page.series} title={page.series} />;
    case "event":
      return <EventGames {...props} eventId={page.eventId} eventName={page.eventName} />;
    case "viewer":
      return <Viewer {...props} game={page.game} context={page.context} story={page.story} />;
    case "live":
      return <Live {...props} />;
    case "tour":
      return <Tour {...props} tourId={page.tourId} tourName={page.tourName} />;
    case "round":
      return <Round {...props} roundId={page.roundId} roundName={page.roundName} tourName={page.tourName} />;
    default:
      return <Hub {...props} />;
  }
}

// ---------------------------------------------------------------------------

function Hub({ nav, go }) {
  const [counts, setCounts] = useState(null);
  const [dl, setDl] = useState(null); // null | {done,total} | "done" | "error:…"

  useEffect(() => {
    let dead = false;
    loadGamesIndex()
      .then((idx) => {
        if (dead) return;
        const c = { wcc: 0, cycle: 0, tour: 0, events: idx.events.length, games: 0 };
        for (const e of idx.events) {
          c[e.cat] += e.n;
          c.games += e.n;
        }
        setCounts(c);
      })
      .catch(() => {});
    return () => {
      dead = true;
    };
  }, []);

  const startDownload = () => {
    setDl({ done: 0, total: 1 });
    downloadAll((done, total) => setDl({ done, total }))
      .then(() => setDl("done"))
      .catch((e) => setDl("error:" + e.message));
  };

  return (
    <div className="page">
      <TopBar
        title="Pro games"
        sub={counts ? `${counts.games.toLocaleString()} games · ${counts.events} events` : "Loading catalog…"}
        onBack={() => nav("home")}
      />

      <div className="menugrid">
        <button className="menubtn primary" onClick={() => go({ name: "famous" })}>
          <span className="mb-icon">🌟</span>Famous games
        </button>
        <button className="menubtn primary" onClick={() => go({ name: "live" })}>
          <span className="mb-icon">📡</span>Live tournaments
        </button>
        <button className="menubtn" onClick={() => go({ name: "catalog", cat: "wcc", title: "World Championship" })}>
          <span className="mb-icon">👑</span>World Championship
        </button>
        <button
          className="menubtn"
          onClick={() => go({ name: "catalog", cat: "cycle", title: "Candidates & World Cups" })}
        >
          <span className="mb-icon">🪜</span>Candidates & World Cups
        </button>
        <button className="menubtn" onClick={() => go({ name: "archive" })}>
          <span className="mb-icon">🏛️</span>Tournament archive
        </button>
      </div>

      <div className="card">
        {dl === null && (
          <>
            <p className="hint small">
              Events are downloaded as you open them and then work offline. To take the whole database
              offline in one go (~40 MB):
            </p>
            <button className="linkbtn" onClick={startDownload}>
              ⬇ Download everything for offline
            </button>
          </>
        )}
        {dl && dl.done !== undefined && (
          <>
            <div className="progressbar">
              <div className="progressfill" style={{ width: Math.round((dl.done / dl.total) * 100) + "%" }} />
            </div>
            <p className="hint small">
              {dl.done} / {dl.total} events cached…
            </p>
          </>
        )}
        {dl === "done" && <p className="okmsg">Entire database cached — every game now works offline. ✓</p>}
        {typeof dl === "string" && dl.startsWith("error:") && (
          <>
            <p className="warn">{dl.slice(6)}</p>
            <button className="linkbtn" onClick={startDownload}>
              ⟳ Retry
            </button>
          </>
        )}
      </div>

      <p className="hint small footernote">
        Every World Championship match since 1886, Candidates and Interzonals, and the great
        tournaments from Hastings 1895 to today's super-events — validated move by move. Game data
        from pgnmentor.com; live relay by lichess.org.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FamousList({ back, go }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    loadFamous()
      .then((d) => !dead && setDb(d))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, []);

  return (
    <div className="page">
      <TopBar title="Famous games" sub={db ? `${db.games.length} games every player should see` : ""} onBack={back} />
      {error && <p className="warn">Couldn't load: {error}</p>}
      {!db && !error && <p className="hint">Loading…</p>}
      {db?.games.map((g, i) => (
        <div
          key={i}
          className="card gamecard"
          onClick={() => go({ name: "viewer", game: g, context: g.event, story: g.story })}
        >
          <div className="gamecard-main">
            <div className="gamecard-title">
              {g.title} <span className="result">{RESULT_LABEL[g.res] || ""}</span>
            </div>
            <div className="gamecard-sub">
              {surname(g.w)} – {surname(g.b)} · {g.event}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------

// Event list, either for a fixed category (wcc / cycle) or one series.
function Catalog({ back, go, cat, series, title }) {
  const [idx, setIdx] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    loadGamesIndex()
      .then((d) => !dead && setIdx(d))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, []);

  const events = useMemo(() => {
    if (!idx) return [];
    const list = idx.events.filter((e) => (cat ? e.cat === cat : e.series === series));
    return list.sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [idx, cat, series]);

  return (
    <div className="page">
      <TopBar title={title} sub={idx ? `${events.reduce((a, e) => a + e.n, 0).toLocaleString()} games` : ""} onBack={back} />
      {error && <p className="warn">Couldn't load: {error}</p>}
      {events.map((e) => (
        <button
          key={e.id}
          className="openrow"
          onClick={() => go({ name: "event", eventId: e.id, eventName: e.name })}
        >
          <span className="or-name">{e.name}</span>
          <span className="or-plays">{e.n} games</span>
        </button>
      ))}
    </div>
  );
}

// Search + browse the full tournament archive, grouped by series.
function Archive({ back, go }) {
  const [idx, setIdx] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let dead = false;
    loadGamesIndex()
      .then((d) => !dead && setIdx(d))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, []);

  const tours = useMemo(() => (idx ? idx.events.filter((e) => e.cat === "tour") : []), [idx]);
  const grouped = useMemo(() => groupSeries(tours), [tours]);
  const q = query.trim().toLowerCase();
  const hits = useMemo(
    () => (q ? tours.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 60) : []),
    [q, tours]
  );

  return (
    <div className="page">
      <TopBar
        title="Tournament archive"
        sub={idx ? `${tours.reduce((a, e) => a + e.n, 0).toLocaleString()} games · ${grouped.length} series` : ""}
        onBack={back}
      />
      {error && <p className="warn">Couldn't load: {error}</p>}

      <input
        className="input"
        placeholder="Search — e.g. Linares, Zurich 1953, Tata"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {q
        ? hits.map((e) => (
            <button
              key={e.id}
              className="openrow"
              onClick={() => go({ name: "event", eventId: e.id, eventName: e.name })}
            >
              <span className="or-name">{e.name}</span>
              <span className="or-plays">{e.n} games</span>
            </button>
          ))
        : grouped.map((g) =>
            g.events.length === 1 ? (
              <button
                key={g.series}
                className="openrow"
                onClick={() => go({ name: "event", eventId: g.events[0].id, eventName: g.events[0].name })}
              >
                <span className="or-name">{g.events[0].name}</span>
                <span className="or-plays">{g.events[0].n} games</span>
              </button>
            ) : (
              <button key={g.series} className="openrow" onClick={() => go({ name: "series", series: g.series })}>
                <span className="or-name">{g.series}</span>
                <span className="or-plays">
                  {g.events.length} editions · {g.total.toLocaleString()}
                </span>
              </button>
            )
          )}
      {q && hits.length === 0 && <p className="hint">Nothing matches “{query}”.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------

function EventGames({ back, go, eventId, eventName }) {
  const [ev, setEv] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    setEv(null);
    loadEvent(eventId)
      .then((d) => !dead && setEv(d))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [eventId]);

  return (
    <div className="page">
      <TopBar title={eventName} sub={ev ? `${ev.games.length} games` : ""} onBack={back} />
      {error && (
        <p className="warn">
          Couldn't load this event — it may not be cached for offline yet. ({error})
        </p>
      )}
      {!ev && !error && <p className="hint">Loading…</p>}
      {ev && <GameRows games={ev.games} onOpen={(g) => go({ name: "viewer", game: g, context: eventName })} />}
    </div>
  );
}

function GameRows({ games, onOpen }) {
  // Long events (Olympiads, opens) get windowed rendering the cheap way:
  // show 200 at a time with a "show more" tail.
  const [limit, setLimit] = useState(200);
  return (
    <>
      {games.slice(0, limit).map((g, i) => (
        <button key={i} className="openrow dbgame" onClick={() => onOpen(g)}>
          <span className="or-name">
            {surname(g.w)} – {surname(g.b)}
            <span className="or-sub">
              {" "}
              {[g.rd && `rd ${g.rd}`, g.eco, g.d?.slice(0, 4)].filter(Boolean).join(" · ")}
            </span>
          </span>
          <span className="or-plays">{g.live ? "● live" : RESULT_LABEL[g.res] || "…"}</span>
        </button>
      ))}
      {games.length > limit && (
        <button className="linkbtn center" onClick={() => setLimit((l) => l + 400)}>
          Show more ({games.length - limit} left)
        </button>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function Viewer({ store, setStore, nav, back, game, context, story }) {
  const [viewIdx, setViewIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [auto, setAuto] = useState(false);

  // Replay the SAN string once; bundled games are pre-validated, live ones
  // stop quietly at anything the parser can't follow.
  const { sans, positions, pairs } = useMemo(() => {
    const c = new Chess();
    const sans = [];
    const positions = [c.fen()];
    const pairs = [null];
    for (const tok of game.m.split(" ").filter(Boolean)) {
      let mv = null;
      try {
        mv = c.move(tok, { strict: false });
      } catch {
        break;
      }
      if (!mv) break;
      sans.push(mv.san);
      positions.push(c.fen());
      pairs.push([mv.from, mv.to]);
    }
    return { sans, positions, pairs };
  }, [game.m]);

  useEffect(() => setViewIdx(0), [game]);

  const prev = () => setViewIdx((i) => Math.max(0, i - 1));
  const next = () => setViewIdx((i) => Math.min(sans.length, i + 1));
  useArrowKeys(prev, next);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setViewIdx((i) => {
        if (i >= sans.length) {
          setAuto(false);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(t);
  }, [auto, sans.length]);

  const analyze = () => {
    const id = newId();
    setStore((s) => ({
      ...s,
      games: [
        {
          id,
          date: Date.now(),
          mode: "import",
          label: `${surname(game.w)} vs ${surname(game.b)}${context ? ` · ${context}` : ""}`,
          sans,
          result: RESULT_LABEL[game.res] ? game.res.replace("=", "1/2-1/2") : null,
          review: null,
        },
        ...s.games,
      ].slice(0, 200),
    }));
    nav("review", { gameId: id });
  };

  const elo = (e) => (e ? ` (${e})` : "");

  return (
    <div className="page gamepage">
      <TopBar
        title={`${surname(game.w)} – ${surname(game.b)}`}
        sub={[context, RESULT_LABEL[game.res] || (game.live ? "in progress" : "")].filter(Boolean).join(" · ")}
        onBack={back}
      />

      <Board
        fen={positions[viewIdx]}
        orientation={flipped ? "b" : "w"}
        lastMove={pairs[viewIdx]}
        dests={null}
        theme={store.settings.theme}
        pieceSet={store.settings.pieces}
        animMs={store.settings.animMs}
        arrowColors={store.settings.arrowColors}
      />

      <div className="dbmeta hint small">
        {game.w}
        {elo(game.we)} vs {game.b}
        {elo(game.be)}
        {game.d ? ` · ${game.d.replaceAll(".", "-").replace(/-\?\?/g, "")}` : ""}
        {game.eco ? ` · ${game.eco}` : ""}
      </div>

      <div className="btnrow toolrow">
        <button className="linkbtn" onClick={() => setViewIdx(0)} disabled={viewIdx === 0}>
          |‹
        </button>
        <button className="linkbtn" onClick={prev} disabled={viewIdx === 0}>
          ‹ Prev
        </button>
        <button className="linkbtn" onClick={() => setAuto((a) => !a)} disabled={viewIdx >= sans.length}>
          {auto ? "⏸" : "▶"}
        </button>
        <button className="linkbtn" onClick={next} disabled={viewIdx >= sans.length}>
          Next ›
        </button>
        <button className="linkbtn" onClick={() => setViewIdx(sans.length)} disabled={viewIdx >= sans.length}>
          ›|
        </button>
        <button className="linkbtn" onClick={() => setFlipped((f) => !f)}>
          ⇅
        </button>
      </div>

      {story && (
        <div className="card">
          <p className="dbstory">{story}</p>
        </div>
      )}

      <MoveList sans={sans} activePly={viewIdx - 1} onTap={(p) => setViewIdx(p + 1)} />

      <button className="bigbtn start" onClick={analyze}>
        🔬 Review with engine
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live broadcasts

function StaleBanner({ at }) {
  return (
    <p className="warn">
      Offline — showing the last data fetched {new Date(at).toLocaleString()}. Fetching fresh
      rounds needs a connection.
    </p>
  );
}

function Live({ back, go }) {
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    fetchBroadcasts()
      .then((r) => !dead && setRes(r))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, []);

  const Row = ({ t }) => (
    <button className="openrow" onClick={() => go({ name: "tour", tourId: t.tourId, tourName: t.name })}>
      <span className="or-name">
        {t.name}
        {t.info && <span className="or-sub"> {t.info}</span>}
      </span>
      <span className="or-plays">{t.roundName}</span>
    </button>
  );

  return (
    <div className="page">
      <TopBar title="Live tournaments" sub="Relayed by lichess.org" onBack={back} />
      {error && (
        <p className="warn">
          Couldn't reach lichess.org — live tournaments need an internet connection. ({error})
        </p>
      )}
      {!res && !error && <p className="hint">Loading broadcasts…</p>}
      {res?.stale && <StaleBanner at={res.at} />}
      {res && (
        <>
          <h2>Happening now</h2>
          {res.data.active.length === 0 && <p className="hint">Nothing being broadcast right now.</p>}
          {res.data.active.map((t) => (
            <Row key={t.tourId} t={t} />
          ))}
          {res.data.upcoming.length > 0 && (
            <>
              <h2>Coming up</h2>
              {res.data.upcoming.map((t) => (
                <Row key={t.tourId} t={t} />
              ))}
            </>
          )}
          {res.data.past.length > 0 && (
            <>
              <h2>Recently finished</h2>
              {res.data.past.map((t) => (
                <Row key={t.tourId} t={t} />
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Tour({ back, go, tourId, tourName }) {
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    fetchTour(tourId)
      .then((r) => !dead && setRes(r))
      .catch((e) => !dead && setError(e.message));
    return () => {
      dead = true;
    };
  }, [tourId]);

  return (
    <div className="page">
      <TopBar title={tourName} sub={res ? `${res.data.rounds.length} rounds` : ""} onBack={back} />
      {error && <p className="warn">Couldn't load rounds — are you online? ({error})</p>}
      {res?.stale && <StaleBanner at={res.at} />}
      {res?.data.rounds.map((r) => (
        <button
          key={r.id}
          className="openrow"
          onClick={() => go({ name: "round", roundId: r.id, roundName: r.name, tourName })}
        >
          <span className="or-name">{r.name}</span>
          <span className="or-plays">
            {r.ongoing ? "● live" : r.finished ? "finished" : r.startsAt ? new Date(r.startsAt).toLocaleDateString() : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

function Round({ back, go, roundId, roundName, tourName }) {
  const [res, setRes] = useState(null);
  const [error, setError] = useState("");
  const [spin, setSpin] = useState(false);

  const load = () => {
    setSpin(true);
    fetchRoundGames(roundId)
      .then((r) => {
        setRes(r);
        setError("");
      })
      .catch((e) => setError(e.message))
      .finally(() => setSpin(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [roundId]);

  const live = res?.data.some((g) => g.live);

  return (
    <div className="page">
      <TopBar
        title={roundName}
        sub={tourName}
        onBack={back}
        right={
          <button className="iconbtn" onClick={load} disabled={spin}>
            {spin ? "…" : "⟳"}
          </button>
        }
      />
      {error && <p className="warn">Couldn't load this round — are you online? ({error})</p>}
      {res?.stale && <StaleBanner at={res.at} />}
      {live && <p className="hint small">● Games in progress — tap ⟳ for the latest moves.</p>}
      {res && (
        <GameRows
          games={res.data}
          onOpen={(g) => go({ name: "viewer", game: g, context: `${tourName} · ${roundName}` })}
        />
      )}
    </div>
  );
}
