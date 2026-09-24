import { TopBar } from "./ui.jsx";
import { topicList, topicProgress, daysUntil } from "./concurs.js";
import { PROBES } from "./tematica.js";

export default function ConcursHome({ store, onOpenProbe, onBack }) {
  const sessions = (store.concurs && store.concurs.sessions) || [];
  const today = new Date().toDateString();
  const todayPres = sessions.filter((s) => new Date(s.at).toDateString() === today).length;

  return (
    <div className="page">
      <TopBar title="Concurs Foișor 2026" subtitle="Medic specialist ortopedie-traumatologie" onBack={onBack} />

      {PROBES.map((probe) => {
        const topics = topicList(probe.key);
        const rows = topics.map((t) => topicProgress(store, t));
        const withContent = topics.filter((t) => t.content).length;
        const due = rows.reduce((a, r) => a + r.qDue + r.sDue, 0);
        const seen = rows.filter((r) => r.qSeen > 0 || r.sSeen > 0).length;
        const presented = rows.filter((r) => r.presentations > 0).length;
        const days = daysUntil(probe.date);
        return (
          <div key={probe.key} className="card probecard" onClick={() => onOpenProbe(probe.key)}>
            <div className="probecard-head">
              <div className="probecard-title">{probe.label}</div>
              <div className={"probecard-days" + (days <= 3 ? " soon" : "")}>
                {days > 0 ? `${days} zile` : days === 0 ? "azi" : "trecut"}
              </div>
            </div>
            <div className="probecard-sub">
              {probe.date.split("-").reverse().join(".")} · {probe.format}
            </div>
            <div className="probecard-stats">
              <span>
                {withContent}/{topics.length} subiecte
              </span>
              <span>{seen} începute</span>
              <span>{presented} prezentate</span>
              {due > 0 && <span className="due">{due} scadente</span>}
            </div>
          </div>
        );
      })}

      <p className="hint small">
        {todayPres > 0 ? `${todayPres} sesiuni salvate azi. ` : ""}
        Fiecare subiect are trei moduri: recapitulare (citești), prezentare cronometrată (vorbești, apoi te
        notezi pe secțiuni) și întrebările comisiei (răspunzi, dezvălui, notezi). Notele programează
        repetarea: „Din nou” revine în 10 minute, „Greu” mâine, „Bine” și „Ușor” la 1 până la 7 zile.
      </p>
    </div>
  );
}
