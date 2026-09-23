import { dismissReminder } from "./logic.js";

export default function Banners({ store, setStore }) {
  const ids = store.reminders.banners.filter((id) => store.reminders.items[id]);
  if (ids.length === 0) return null;
  const done = (id) => setStore((s) => dismissReminder(s, id, Date.now()));
  return (
    <div className="banners" role="status">
      {ids.map((id) => (
        <div className="banner" key={id}>
          <span className="banner-text">🔔 {store.reminders.items[id].label}</span>
          <button type="button" className="banner-done" onClick={() => done(id)}>
            Done
          </button>
        </div>
      ))}
    </div>
  );
}
