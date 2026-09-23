import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@shared/ui.jsx";
import { canDownload, canShare, copyToClipboard, downloadText, shareText } from "./pgn.js";

export default function ExportSheet({ open, title, text, filename, onClose }) {
  const toast = useToast();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  const copy = async () => {
    const ok = await copyToClipboard(text);
    toast(ok ? "PGN copied" : "Copy blocked. Select the text below and copy it by hand.");
  };
  const share = async () => {
    try {
      await shareText(text, filename);
    } catch (e) {
      if (e?.name !== "AbortError") toast("Sharing failed. Copy the text instead.");
    }
  };
  const download = () => downloadText(text, filename);

  return createPortal(
    <div className="sheet-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet exportsheet" role="dialog" aria-modal="true" aria-label={title}>
        <h3>{title}</h3>
        <div className="exportactions">
          <button type="button" className="bigbtn" onClick={copy}>
            Copy
          </button>
          {canShare() && (
            <button type="button" className="bigbtn secondary" onClick={share}>
              Share
            </button>
          )}
          {canDownload() && (
            <button type="button" className="bigbtn secondary" onClick={download}>
              Download
            </button>
          )}
        </div>
        <textarea className="input backuptext" readOnly value={text} onFocus={(e) => e.target.select()} />
        <button ref={closeRef} type="button" className="linkbtn center" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}
