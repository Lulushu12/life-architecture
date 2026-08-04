import { useState } from "react";
import { newId } from "./storage.js";
import { searchFoods, lookupBarcode } from "./offc.js";
import { macrosForGrams, gramsForPieces } from "./food.js";
import { NumInput, MacroRow } from "./ui.jsx";
import FoodEditor from "./FoodEditor.jsx";
import BarcodeScanner from "./BarcodeScanner.jsx";

const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snacks: "Snacks" };

export default function FoodPicker({ foods, meal, onCacheFood, onAddLog, onClose }) {
  const [step, setStep] = useState("list");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [results, setResults] = useState([]);
  const [barcodeError, setBarcodeError] = useState("");
  const [looking, setLooking] = useState(false);
  const [pickedFood, setPickedFood] = useState(null);
  const [grams, setGrams] = useState(100);
  const [pieces, setPieces] = useState(1);

  const list = Object.values(foods)
    .filter((f) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || (f.brand || "").toLowerCase().includes(q);
    })
    .sort((a, b) => (b.lastUsedAt || b.updatedAt || 0) - (a.lastUsedAt || a.updatedAt || 0));

  const cacheAndLog = (draft) => {
    const id = draft.id || newId();
    const now = Date.now();
    const food = { ...draft, id, updatedAt: now };
    onCacheFood(food);
    setPickedFood(food);
    setGrams(food.isPiece ? Math.round((food.pieceWeight || 0) * 1) : 100);
    setPieces(1);
    setStep("log");
  };

  const runSearch = async () => {
    setSearching(true);
    setSearchError("");
    const r = await searchFoods(query);
    setSearching(false);
    if (!r.ok) {
      setSearchError(r.error);
      setResults([]);
      return;
    }
    if (r.items.length === 0) setSearchError("No results found.");
    setResults(r.items);
  };

  const runBarcode = async (code) => {
    setLooking(true);
    setBarcodeError("");
    const r = await lookupBarcode(code);
    setLooking(false);
    if (!r.ok) {
      setBarcodeError(r.error);
      return;
    }
    cacheAndLog(r.item);
  };

  const effectiveGrams = pickedFood?.isPiece ? gramsForPieces(pickedFood, pieces) : grams;
  const macros = pickedFood ? macrosForGrams(pickedFood, effectiveGrams) : null;

  const header = (title, sub, back) => (
    <div className="topbar">
      <button className="iconbtn" onClick={back}>
        ‹
      </button>
      <div>
        <div className="tb-title">{title}</div>
        {sub && <div className="tb-sub">{sub}</div>}
      </div>
    </div>
  );

  if (step === "newfood") {
    return (
      <FoodEditor
        onCancel={() => setStep("list")}
        onSave={(draft) => cacheAndLog({ ...draft, source: "custom" })}
      />
    );
  }

  if (step === "log" && pickedFood) {
    return (
      <div className="page">
        {header(pickedFood.name, `Add to ${MEAL_LABELS[meal]}`, () => setStep("list"))}
        {pickedFood.brand && <p className="hint small">{pickedFood.brand}</p>}

        {pickedFood.isPiece ? (
          <div className="field">
            <div className="flabel">Pieces ({pickedFood.pieceWeight} g each)</div>
            <NumInput value={pieces} onChange={setPieces} min={0} max={99} step={1} />
          </div>
        ) : null}

        <div className="field">
          <div className="flabel">Grams</div>
          <NumInput value={pickedFood.isPiece ? effectiveGrams : grams} onChange={setGrams} min={0} max={5000} step={5} />
        </div>

        <div className="card">
          <MacroRow kcal={macros.kcal} protein={macros.protein} carbs={macros.carbs} fat={macros.fat} />
        </div>

        <button
          className="bigbtn start"
          disabled={effectiveGrams <= 0}
          onClick={() => {
            onAddLog(meal, {
              foodId: pickedFood.id,
              name: pickedFood.name,
              grams: effectiveGrams,
              pieces: pickedFood.isPiece ? pieces : undefined,
              kcal100: pickedFood.kcal100,
              protein100: pickedFood.protein100,
              carbs100: pickedFood.carbs100,
              fat100: pickedFood.fat100,
            });
            onClose();
          }}
        >
          Add to {MEAL_LABELS[meal]}
        </button>
      </div>
    );
  }

  if (step === "search") {
    return (
      <div className="page">
        {header("Search foods", "Open Food Facts", () => setStep("list"))}
        <div className="field" style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            style={{ marginBottom: 0 }}
            placeholder="e.g. greek yogurt"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
          <button className="bigbtn" style={{ width: "auto", padding: "12px 20px" }} onClick={runSearch} disabled={searching}>
            {searching ? "…" : "Search"}
          </button>
        </div>
        {searchError && <p className="warn">{searchError}</p>}
        {results.map((item, i) => (
          <div key={i} className="card foodrow" onClick={() => cacheAndLog(item)}>
            <div className="foodrow-main">
              <div className="foodrow-name">{item.name}</div>
              <div className="foodrow-sub">
                {item.brand ? `${item.brand} · ` : ""}
                {Math.round(item.kcal100)} kcal / 100g
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (step === "barcode") {
    return (
      <div className="page">
        {header("Scan barcode", null, () => setStep("list"))}
        <BarcodeScanner onCode={runBarcode} />
        {looking && <p className="hint small">Looking up product…</p>}
        {barcodeError && <p className="warn">{barcodeError}</p>}
      </div>
    );
  }

  // step === "list"
  return (
    <div className="page">
      {header(`Add food`, MEAL_LABELS[meal], onClose)}
      <input
        className="input"
        placeholder="Search your foods…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="newrow">
        <button className="bigbtn alt" onClick={() => setStep("search")} style={{ flex: 1 }}>
          🔍 Search online
        </button>
        <button className="bigbtn alt" onClick={() => setStep("barcode")} style={{ flex: 1 }}>
          📷 Barcode
        </button>
      </div>
      <button className="linkbtn" onClick={() => setStep("newfood")}>
        + New custom food
      </button>

      <div className="flabel" style={{ marginTop: 16 }}>
        {query.trim() ? "Matching foods" : "Recent & custom foods"}
      </div>
      {list.length === 0 && <p className="hint">No foods yet. Search online, scan a barcode, or add a custom food.</p>}
      {list.map((f) => (
        <div key={f.id} className="card foodrow" onClick={() => { setPickedFood(f); setGrams(f.isPiece ? f.pieceWeight || 0 : 100); setPieces(1); setStep("log"); }}>
          <div className="foodrow-main">
            <div className="foodrow-name">{f.name}</div>
            <div className="foodrow-sub">
              {f.brand ? `${f.brand} · ` : ""}
              {Math.round(f.kcal100)} kcal / 100g · P {Math.round(f.protein100)}g
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
