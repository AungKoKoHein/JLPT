import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Keep the same controls and handlers when a session moves them into its toolbar.
export default function StudyControlsHost({ children }) {
  const [slot, setSlot] = useState(null);
  useEffect(() => {
    const update = () => setSlot(document.querySelector('[data-session-controls]'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return slot ? createPortal(children, slot) : children;
}
