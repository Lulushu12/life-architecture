import Modal from "./Modal.jsx";

export const SAFETY_POINTS = [
  "Never practise the breathing in or near water, in a bath, pool or the sea.",
  "Never while driving, cycling, standing or doing anything where fainting could hurt you.",
  "Always sit or lie down somewhere safe before you start.",
  "Tingling and light-headedness are common. If it turns into dizziness, stop and breathe normally.",
  "Retention is not a competition. Breathe whenever your body asks, never push past it.",
];

export default function SafetyNotice({ open, onAcknowledge }) {
  return (
    <Modal
      open={open}
      title="Before you breathe"
      actions={
        <button type="button" className="bigbtn" onClick={onAcknowledge}>
          I understand
        </button>
      }
    >
      <p>Guided hyperventilation followed by a breath hold can make you faint. Please read this once.</p>
      <ul className="safety-list">
        {SAFETY_POINTS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <p className="hint small">If you are pregnant, have epilepsy, heart or blood pressure problems, ask a doctor first.</p>
    </Modal>
  );
}
