import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

// A bottom sheet with any content: closes on the backdrop, Escape or the
// close button, and keeps focus inside while open.
export default function Sheet({ open, title, onClose, children }) {
  const id = useId();
  const ref = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    ref.current?.querySelector("button, [href], input")?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current?.();
      } else if (e.key === "Tab" && ref.current) {
        const items = ref.current.querySelectorAll("button:not([disabled]), input:not([disabled])");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (previous?.isConnected && typeof previous.focus === "function") previous.focus();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div ref={ref} className="sheet helpsheet" role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="sheet-head">
          <h3 id={id}>{title}</h3>
          <button type="button" className="linkbtn" onClick={() => onClose?.()}>
            Done
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
