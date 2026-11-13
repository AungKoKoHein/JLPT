import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function StudySessionView({ label, onQuit, children }) {
  const quitButton = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const root = document.getElementById("root");
    const previousInert = root?.inert;
    document.body.style.overflow = "hidden";
    if (root) root.inert = true;
    quitButton.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (root) root.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  return createPortal(<div className="study-session-view" role="dialog" aria-modal="true" aria-label={label}>
    <header className="study-session-toolbar">
      <strong>{label}</strong>
      <div className="study-session-toolbar-actions"><div data-session-controls />
      <button ref={quitButton} type="button" className="secondary-button" onClick={onQuit}>Quit {label === "Practice" ? "practice" : label === "Reading" ? "reading" : "exam"}</button>
      </div>
    </header>
    <div className="study-session-content">{children}</div>
  </div>, document.body);
}
