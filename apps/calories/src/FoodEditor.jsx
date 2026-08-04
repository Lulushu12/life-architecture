import { useState } from "react";
import { NumInput } from "./ui.jsx";

export default function FoodEditor({ food, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(food?.name || "");
  const [brand, setBrand] = useState(food?.brand || "");
  const [kcal100, setKcal100] = useState(food?.kcal100 ?? 0);
  const [protein100, setProtein100] = useState(food?.protein100 ?? 0);
  const [carbs100, setCarbs100] = useState(food?.carbs100 ?? 0);
  const [fat100, setFat100] = useState(food?.fat100 ?? 0);
  const [isPiece, setIsPiece] = useState(!!food?.isPiece);
  const [pieceWeight, setPieceWeight] = useState(food?.pieceWeight ?? 50);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      brand: brand.trim(),
      kcal100: Number(kcal100) || 0,
      protein100: Number(protein100) || 0,
      carbs100: Number(carbs100) || 0,
      fat100: Number(fat100) || 0,
      isPiece,
      pieceWeight: isPiece ? Number(pieceWeight) || 0 : undefined,
      source: food?.source || "custom",
    });
  };

  return (
    <div className="page">
      <div className="topbar">
        <button className="iconbtn" onClick={onCancel}>
          ‹
        </button>
        <div>
          <div className="tb-title">{food ? "Edit food" : "New food"}</div>
          <div className="tb-sub">Macros are per 100 g</div>
        </div>
      </div>

      <div className="field">
        <div className="flabel">Name</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chicken breast" />
      </div>
      <div className="field">
        <div className="flabel">Brand (optional)</div>
        <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Generic" />
      </div>

      <div className="flabel">Per 100 g</div>
      <div className="setrow">
        <span className="setlabel">Calories (kcal)</span>
        <NumInput value={kcal100} onChange={setKcal100} min={0} max={9000} step={5} />
      </div>
      <div className="setrow">
        <span className="setlabel">Protein (g)</span>
        <NumInput value={protein100} onChange={setProtein100} min={0} max={100} step={1} />
      </div>
      <div className="setrow">
        <span className="setlabel">Carbs (g)</span>
        <NumInput value={carbs100} onChange={setCarbs100} min={0} max={100} step={1} />
      </div>
      <div className="setrow">
        <span className="setlabel">Fat (g)</span>
        <NumInput value={fat100} onChange={setFat100} min={0} max={100} step={1} />
      </div>

      <div className="setrow">
        <span className="setlabel">Log by piece</span>
        <button className={"toggle" + (isPiece ? " on" : "")} onClick={() => setIsPiece((v) => !v)}>
          <span className="knob" />
        </button>
      </div>
      {isPiece && (
        <div className="setrow">
          <span className="setlabel">Weight per piece (g)</span>
          <NumInput value={pieceWeight} onChange={setPieceWeight} min={1} max={2000} step={1} />
        </div>
      )}

      <div className="btnrow" style={{ justifyContent: onDelete ? "space-between" : "flex-end" }}>
        {onDelete && (
          <button
            className="linkbtn"
            style={{ color: "var(--danger)" }}
            onClick={() => {
              if (confirm(`Delete "${food.name}"? Existing log entries keep their saved values.`)) onDelete();
            }}
          >
            Delete
          </button>
        )}
        <button className="bigbtn" disabled={!canSave} onClick={save} style={{ width: "auto", padding: "12px 26px" }}>
          Save
        </button>
      </div>
    </div>
  );
}
