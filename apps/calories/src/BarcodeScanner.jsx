import { useEffect, useRef, useState } from "react";

// Camera scanning is a progressive enhancement: it feature-detects
// BarcodeDetector and getUserMedia, and silently stays camera-less when
// either is missing or permission is denied. Manual entry is always shown
// and is the only path exercised by automated tests (no camera in CI).
export default function BarcodeScanner({ onCode }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [manual, setManual] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const supported = typeof window !== "undefined" && "BarcodeDetector" in window;

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError("");
    if (!supported) {
      setCameraError("Barcode scanning isn't supported in this browser — use manual entry below.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera isn't available — use manual entry below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8"] });
      const tick = async () => {
        if (!videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            stopCamera();
            onCode(codes[0].rawValue);
            return;
          }
        } catch {
          /* transient decode errors are expected between frames */
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setCameraError("Camera permission denied — use manual entry below.");
    }
  };

  return (
    <div>
      {!cameraOn && (
        <button className="bigbtn" onClick={startCamera}>
          📷 Start camera
        </button>
      )}
      {cameraOn && (
        <div className="camwrap">
          <video ref={videoRef} playsInline muted className="camvideo" />
          <button className="linkbtn" onClick={stopCamera}>
            Stop camera
          </button>
        </div>
      )}
      {cameraError && <p className="warn">{cameraError}</p>}

      <div className="flabel" style={{ marginTop: 18 }}>
        Or enter the barcode number
      </div>
      <div className="field" style={{ display: "flex", gap: 8 }}>
        <input
          className="input"
          style={{ marginBottom: 0 }}
          inputMode="numeric"
          placeholder="e.g. 5000159407236"
          value={manual}
          onChange={(e) => setManual(e.target.value.replace(/[^0-9]/g, ""))}
        />
        <button
          className="bigbtn"
          style={{ width: "auto", padding: "12px 20px" }}
          disabled={!manual.trim()}
          onClick={() => onCode(manual.trim())}
        >
          Look up
        </button>
      </div>
    </div>
  );
}
