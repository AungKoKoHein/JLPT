import { useLayoutEffect } from 'react';

// Before a sticky sidebar reaches its top offset, headers still occupy viewport
// space. Size its scroll area from the actual visible top, not a fixed 100vh.
export default function useChapterSidebarViewport(layoutRef, viewKey) {
  useLayoutEffect(() => {
    const layout = layoutRef.current;
    const sidebar = layout?.querySelector(':scope > aside');
    if (!sidebar) return undefined;
    let frame = 0;
    const fit = () => {
      frame = 0;
      if (window.innerWidth <= 760) {
        layout.style.removeProperty('--chapter-sidebar-height');
        return;
      }
      const viewport = window.visualViewport;
      const viewportBottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight);
      const stickyTop = parseFloat(getComputedStyle(sidebar).top) || 16;
      const top = Math.max(stickyTop, sidebar.getBoundingClientRect().top);
      const height = `${Math.max(0, Math.floor(viewportBottom - top - 16))}px`;
      if (layout.style.getPropertyValue('--chapter-sidebar-height') !== height) {
        layout.style.setProperty('--chapter-sidebar-height', height);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(fit); };
    const observer = new ResizeObserver(schedule);
    observer.observe(layout);
    if (layout.parentElement) observer.observe(layout.parentElement);
    window.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    fit();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      layout.style.removeProperty('--chapter-sidebar-height');
    };
  }, [layoutRef, viewKey]);
}
