import React from "react";

export default function SidebarToggle({ expanded, onToggle, controls }) {
  return <button type="button" className="sidebar-toggle" onClick={onToggle}
    aria-label={expanded ? "Hide chapter sidebar" : "Show chapter sidebar"}
    title={expanded ? "Hide chapters" : "Show chapters"}
    aria-expanded={expanded} aria-controls={controls}>
    <svg className="sidebar-panel-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M9 4v16" />
      <path className="sidebar-panel-lines" d="M5.8 8h.4m-.4 4h.4m-.4 4h.4" />
      <path className="sidebar-content-lines" d="M12.5 9h5m-5 6h5" />
    </svg>
  </button>;
}
