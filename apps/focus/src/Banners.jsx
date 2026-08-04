import { dismissReminder } from "./logic.js";

// Rendered once at the top of App.jsx (outside the tab content) so a due
// reminder is visible no matter which tab is currently open.
export default function Banners({ store, setStore }) {
  const ids = store.reminders.banners || [];
  if (ids.length === 0) return null;
  const done = (id) => setStore((s) => dismissReminder(s, id, Date.now()));
  return (
    <div className="banners">
      {ids.map((id) => {
        const r = store.reminders.items[id];
        if (!r) return null;
        return (
          <div className="banner" key={id}>
            <span className="banner-text">🔔 {r.label}</span>
            <button className="banner-done" onClick={() => done(id)}>
              Done
            </button>
          </div>
        );
      })}
    </div>
  );
}
