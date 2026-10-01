import { useLayoutEffect } from "react";

// Measure natural content, then reserve whole modules including panel padding.
export function useSquarePanelRows(containerRef, contentSelector, property, minimumRows) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const shell = container.closest(".prototype-shell");
    const contents = [...container.querySelectorAll(contentSelector)];
    let frame;
    const snap = () => {
      if (window.matchMedia("(max-width: 720px)").matches) {
        container.style.removeProperty(property);
        return;
      }
      const module = shell.getBoundingClientRect().width / 8;
      if (!module) return;
      const rows = Math.max(minimumRows, ...contents.map((content) => {
        const panel = getComputedStyle(content.parentElement);
        const spacing = ["paddingTop", "paddingBottom", "marginTop", "marginBottom", "borderTopWidth", "borderBottomWidth"]
          .reduce((total, key) => total + (parseFloat(panel[key]) || 0), 0);
        return Math.ceil((content.getBoundingClientRect().height + spacing) / module);
      }));
      if (container.style.getPropertyValue(property) !== String(rows)) container.style.setProperty(property, rows);
    };
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(snap);
    });
    observer.observe(shell);
    contents.forEach((content) => observer.observe(content));
    snap();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [containerRef, contentSelector, property, minimumRows]);
}
