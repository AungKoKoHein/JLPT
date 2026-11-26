import { useLayoutEffect } from "react";

// Reveal the selected number inside its navigation panel without moving the page.
export default function useQuestionNavigation(rootRef, questionIndex, enabled = true) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !enabled) return undefined;
    let frame;
    const reveal = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const active = root.querySelector('.practice-question-group-grid button.active, .mock-question-palette button.current');
        if (!active || !active.getClientRects().length) return;
        const boundary = active.closest('.practice-navigation-menu, .mock-navigation-drawer');
        if (!boundary) return;
        for (let container = active.parentElement; container; container = container.parentElement) {
          const style = getComputedStyle(container);
          const bounds = container.getBoundingClientRect();
          const item = active.getBoundingClientRect();
          if (/(auto|scroll)/.test(style.overflowY) && container.scrollHeight > container.clientHeight) {
            if (item.top < bounds.top + 8) container.scrollTop -= bounds.top + 8 - item.top;
            else if (item.bottom > bounds.top + container.clientHeight - 8) container.scrollTop += item.bottom - bounds.top - container.clientHeight + 8;
          }
          if (container === boundary) break;
        }
      });
    };
    root.addEventListener('toggle', reveal, true);
    reveal();
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('toggle', reveal, true);
    };
  }, [rootRef, questionIndex, enabled]);
}
