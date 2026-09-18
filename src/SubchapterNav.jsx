import React, { useEffect, useRef, useState } from "react";

export const subchapterTargetId = (id) => `subchapter-title-${id}`;

export default function SubchapterNav({ sections }) {
  const navRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const sectionKey = sections.map((section) => section.id).join(",");

  useEffect(() => {
    const container = navRef.current?.parentElement;
    if (!container) return;
    let frame;
    const update = () => {
      const bounds = container.getBoundingClientRect();
      setVisible(container.getClientRects().length > 0 && bounds.top <= 120 && bounds.bottom > 120);
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [sectionKey]);

  if (!sections.length) return null;

  return (
    <nav ref={navRef} hidden={!visible} className="subchapter-nav" aria-label="Jump to subchapter">
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
