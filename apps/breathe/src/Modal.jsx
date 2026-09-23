import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, title, children, actions }) {
  const id = useId();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const first = ref.current?.querySelector("button:not([disabled])");
    first?.focus();
    const onKey = (e) => {
      if (e.key !== "Tab" || !ref.current) return;
      const items = ref.current.querySelectorAll("button:not([disabled])");
      if (!items.length) return;
      const a = items[0];
      const b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        b.focus();
      } else if (!e.shiftKey && document.activeElement === b) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous && previous.isConnected && typeof previous.focus === "function") previous.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop">
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-labelledby={id}>
        <h3 id={id}>{title}</h3>
        {children}
        <div className="sheet-actions">{actions}</div>
      </div>
    </div>,
    document.body
  );
}
