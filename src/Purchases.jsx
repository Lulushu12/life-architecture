import { useRef, useState } from "react";
import { parseReceiptText } from "./receiptParser";

export const PURCHASE_CATEGORIES = ["Groceries", "Dining & Coffee", "Transport", "Bills & Utilities", "Shopping", "Health & Wellness", "Entertainment", "Other"];
export const PURCHASE_CAT_COLORS = {
  "Groceries":         { accent: "#22c55e", light: "#86efac" },
  "Dining & Coffee":   { accent: "#f59e0b", light: "#fcd34d" },
  "Transport":         { accent: "#06b6d4", light: "#67e8f9" },
  "Bills & Utilities": { accent: "#ef4444", light: "#fca5a5" },
  "Shopping":          { accent: "#a855f7", light: "#d8b4fe" },
  "Health & Wellness": { accent: "#3b82f6", light: "#93c5fd" },
  "Entertainment":     { accent: "#ec4899", light: "#f9a8d4" },
  "Other":             { accent: "#64748b", light: "#cbd5e1" },
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = (d) => (d || "").slice(0, 7);
const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Purchases({ purchases, openAdd, openEdit, delPurchase }) {
  const [filter, setFilter] = useState("All");
  const thisMonth = monthKey(todayKey());
  const monthPurchases = purchases.filter(p => monthKey(p.date) === thisMonth);
  const monthTotal = monthPurchases.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const allTotal = purchases.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const byCategory = PURCHASE_CATEGORIES.map(cat => ({
    cat,
    total: monthPurchases.filter(p => p.category === cat).reduce((s, p) => s + (Number(p.amount) || 0), 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(1, ...byCategory.map(c => c.total));

  const visible = purchases
    .filter(p => filter === "All" || p.category === filter)
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.id || "").localeCompare(a.id || ""));

  return (
    <>
      <div className="pg-title">PURCHASES</div>
      <div className="pg-sub">Scan a receipt or log a purchase manually to keep track of your money</div>

      <div className="card">
        <div className="card-t">This Month</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: byCategory.length ? 16 : 0 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1, color: "#e2e8f0" }}>{fmt(monthTotal)}</span>
          <span style={{ fontSize: 11, color: "#475569" }}>across {monthPurchases.length} purchase{monthPurchases.length === 1 ? "" : "s"}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155", fontFamily: "'JetBrains Mono',monospace" }}>ALL TIME: {fmt(allTotal)}</span>
        </div>
        {byCategory.map(c => {
          const { accent, light } = PURCHASE_CAT_COLORS[c.cat];
          return (
            <div key={c.cat} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: light }}>{c.cat}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", color: accent }}>{fmt(c.total)}</span>
              </div>
              <div className="xp-bg"><div className="xp-f" style={{ width: (c.total / maxCat) * 100 + "%", background: accent }} /></div>
            </div>
          );
        })}
      </div>

      <div className="frow">
        {["All", ...PURCHASE_CATEGORIES].map(f => (
          <div key={f} className={"chip" + (filter === f ? " active" : "")} onClick={() => setFilter(f)}>{f}</div>
        ))}
        <button className="bp" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 12 }} onClick={openAdd}>+ Add Purchase</button>
      </div>

      {visible.length === 0 ? (
        <div className="card" style={{ textAlign: "center", color: "#334155", fontSize: 12, fontStyle: "italic" }}>
          No purchases logged yet. Tap "Add Purchase" to scan a receipt or enter one manually.
        </div>
      ) : (
        visible.map(p => <PurchaseRow key={p.id} p={p} onEdit={() => openEdit(p)} onDel={() => delPurchase(p.id)} />)
      )}
    </>
  );
}

function PurchaseRow({ p, onEdit, onDel }) {
  const { accent, light } = PURCHASE_CAT_COLORS[p.category] || PURCHASE_CAT_COLORS.Other;
  return (
    <div className="quest">
      <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: accent, flexShrink: 0 }} />
      <div className="qb">
        <div className="qt">{p.merchant || "Untitled purchase"}</div>
        <div className="qm">
          <span className="qxp" style={{ color: accent }}>{fmt(p.amount)}</span>
          <span className="qst" style={{ background: accent + "22", color: light }}>{p.category}</span>
          <span style={{ fontSize: 10, color: "#475569", fontFamily: "'JetBrains Mono',monospace" }}>{p.date || "no date"}</span>
        </div>
        {p.notes && <div className="qnt">{p.notes}</div>}
      </div>
      <div className="qac">
        <button className="bi" onClick={onEdit}>✎</button>
        <button className="bi del" onClick={onDel}>✕</button>
      </div>
    </div>
  );
}

export function PurchaseModal({ modal, onSave, onClose }) {
  const isEdit = modal.mode === "edit";
  const existing = isEdit ? modal.purchase : null;
  const [merchant, setMerchant] = useState(existing?.merchant || "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [category, setCategory] = useState(existing?.category || PURCHASE_CATEGORIES[0]);
  const [date, setDate] = useState(existing?.date || todayKey());
  const [notes, setNotes] = useState(existing?.notes || "");
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [rawText, setRawText] = useState(existing?.rawText || "");
  const fileRef = useRef(null);

  const onScan = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setScanning(true);
    setScanError("");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      const parsed = parseReceiptText(text);
      if (parsed.merchant) setMerchant(parsed.merchant);
      if (parsed.amount != null) setAmount(String(parsed.amount));
      if (parsed.date) setDate(parsed.date);
      setRawText(text);
      if (parsed.amount == null) setScanError("Couldn't detect a total — please check the amount below.");
    } catch (err) {
      setScanError("Couldn't read that receipt. Enter the details manually.");
    }
    setScanning(false);
  };

  const canSave = merchant.trim() && amount !== "" && !Number.isNaN(parseFloat(amount));

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="mt">{isEdit ? "EDIT PURCHASE" : "NEW PURCHASE"}</div>

        <div className="fg">
          <label className="fl">RECEIPT</label>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onScan} />
          <button className="btn-add" onClick={() => fileRef.current?.click()} disabled={scanning}>
            {scanning ? "Reading receipt…" : "📷 Scan Receipt"}
          </button>
          {scanError && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>{scanError}</div>}
          {rawText && <div className="pp" style={{ maxHeight: 90, overflowY: "auto", marginTop: 8 }}>{rawText}</div>}
        </div>

        <div className="fg"><label className="fl">MERCHANT</label><input className="fi" value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="Where did you spend?" /></div>
        <div style={{ display: "flex", gap: 11 }}>
          <div className="fg" style={{ flex: 1 }}><label className="fl">AMOUNT</label><input className="fi" type="number" step="0.01" min={0} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" /></div>
          <div className="fg" style={{ flex: 1 }}><label className="fl">DATE</label><input className="fi" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="fg"><label className="fl">CATEGORY</label><select className="fsel" value={category} onChange={e => setCategory(e.target.value)}>{PURCHASE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
        <div className="fg"><label className="fl">NOTES</label><textarea className="fta" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional" /></div>

        <div className="mf">
          <button className="bs" onClick={onClose}>Cancel</button>
          <button
            className="bp"
            disabled={!canSave}
            onClick={() => onSave({ merchant: merchant.trim(), amount: parseFloat(amount) || 0, category, date, notes: notes.trim(), rawText })}
          >
            {isEdit ? "Save Changes" : "Add Purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
