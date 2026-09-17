import React from "react";

export const subchapterTargetId = (id) => `subchapter-title-${id}`;

export default function SubchapterNav({ sections }) {
  if (!sections.length) return null;

  return (
    <nav className="subchapter-nav" aria-label="Jump to subchapter">
      {sections.map((section, index) => (
        <button
          type="button"
          key={section.id}
          title={`Subchapter ${index + 1}: ${section.title}`}
          aria-label={`Jump to subchapter ${index + 1}: ${section.title}`}
          onClick={() => {
            const target = document.getElementById(subchapterTargetId(section.id));
            if (!target) return;
            target.focus({ preventScroll: true });
            target.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
              block: "start",
            });
          }}
        >
          {index + 1}
        </button>
      ))}
    </nav>
  );
}
