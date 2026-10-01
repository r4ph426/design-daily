import { useLayoutEffect } from "react";

const number = (value) => parseFloat(value) || 0;
const boxSpace = (style, keys) => keys.reduce((sum, key) => sum + number(style[key]), 0);

// Measure intrinsic content rather than the allocated track height, so rows can
// shrink again. Vertical flex children retain their natural content height.
function contentHeight(panel) {
  const style = getComputedStyle(panel);
  const children = [...panel.children].filter((child) => {
    const css = getComputedStyle(child);
    return css.display !== "none" && !["absolute", "fixed"].includes(css.position);
  });
  let height = 0;
  if (panel.matches("p")) {
    const range = document.createRange();
    range.selectNodeContents(panel);
    height = range.getBoundingClientRect().height + Math.max(0, number(style.lineHeight) - number(style.fontSize));
  } else if (style.display === "flex" && style.flexDirection.startsWith("column")) {
    height = children.reduce((sum, child) => sum + child.getBoundingClientRect().height
      + boxSpace(getComputedStyle(child), ["marginTop", "marginBottom"]), 0)
      + Math.max(0, children.length - 1) * number(style.rowGap);
  } else if (children.length) {
    const bounds = children.map((child) => {
      const rect = child.getBoundingClientRect();
      const css = getComputedStyle(child);
      return { top: rect.top - number(css.marginTop), bottom: rect.bottom + number(css.marginBottom) };
    });
    height = Math.max(...bounds.map((rect) => rect.bottom)) - Math.min(...bounds.map((rect) => rect.top));
  } else {
    height = panel.getBoundingClientRect().height
      - boxSpace(style, ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"]);
  }
  return height + boxSpace(style, ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth", "marginTop", "marginBottom"]);
}

export function useSquareLayouts(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const shell = root.closest(".prototype-shell, .privacy-shell");
    if (!shell) return;
    let frame;
    let disposed = false;
    const observed = new Set();
    const write = (element, property, value) => {
      if (element.style.getPropertyValue(property) !== String(value)) element.style.setProperty(property, value);
    };
    const snap = () => {
      if (disposed) return;
      const mobile = window.matchMedia("(max-width: 720px)").matches;
      if (mobile) {
        root.querySelectorAll("[data-square-measured]").forEach((element) => {
          for (const property of [...element.style]) if (property.startsWith("--fit-")) element.style.removeProperty(property);
        });
        return;
      }
      const module = shell.getBoundingClientRect().width / 8;
      if (!module) return;
      const width = window.innerWidth;
      const nextObserved = new Set([shell]);
      const fit = (layout, property, selector, minimum = 1) => {
        const panels = (selector ? [...layout.querySelectorAll(selector)] : [layout]).filter((panel) => panel.getClientRects().length);
        panels.forEach((panel) => {
          nextObserved.add(panel);
          [...panel.children].forEach((child) => nextObserved.add(child));
        });
        const rows = Math.max(minimum, ...panels.map((panel) => {
          const nested = panel.parentElement.matches(".signal-details, .privacy-section");
          const outerInset = nested ? number(getComputedStyle(shell).getPropertyValue("--grid-inset")) * 2 : 0;
          return Math.ceil((contentHeight(panel) + outerInset) / module);
        }));
        write(layout, `--fit-${property}`, rows);
        layout.dataset.squareMeasured = "";
        return rows;
      };
      root.querySelectorAll(".opening").forEach((layout) => {
        fit(layout, "hero", ":scope > .opening-copy, :scope > .opening-summary", 2);
        fit(layout, "index", ":scope > .question-index", 2);
        fit(layout, "intake", ":scope > .intake-cell", 2);
      });
      root.querySelectorAll(".editorial-spread").forEach((layout) => {
        const heading = fit(layout, "heading", ":scope > .editorial-heading");
        const support = fit(layout, "support", ":scope > .practice-panel, :scope > .source-panel");
        const note = fit(layout, "note", ":scope > .editorial-note");
        write(layout, "--fit-spread", Math.max(heading + support, note));
        if (layout.classList.contains("is-open")) fit(layout, "details", ":scope > .signal-details > .signal-table-wrap");
      });
      root.querySelectorAll(".prototype-archive-opening").forEach((layout) => {
        const intro = fit(layout, "intro", ":scope > .prototype-archive-title, :scope > .prototype-archive-orientation", 2);
        const count = fit(layout, "count", ":scope > .prototype-archive-count", 2);
        write(layout, "--fit-opening", Math.max(intro, count + 1));
      });
      root.querySelectorAll(".prototype-toolbox-opening").forEach((layout) => {
        const intro = fit(layout, "intro", ":scope > .prototype-toolbox-title", 2);
        const orientation = fit(layout, "orientation", ":scope > .prototype-toolbox-orientation", width <= 1200 ? 1 : 2);
        const intake = fit(layout, "intake", ":scope > .prototype-toolbox-intake", 2);
        write(layout, "--fit-opening", Math.max(intro, width <= 1200 ? orientation + intake : Math.max(orientation, intake)));
      });
      root.querySelectorAll(".prototype-start").forEach((layout) => {
        fit(layout, "heading", ":scope > .prototype-start-heading");
        fit(layout, "paths", ":scope > .prototype-start-path");
      });
      root.querySelectorAll(".prototype-index-heading, .prototype-toolbox-index-heading").forEach((layout) => fit(layout, "heading", ":scope > .content-panel"));
      root.querySelectorAll(".prototype-archive-controls, .prototype-toolbox-controls").forEach((layout) => {
        fit(layout, "filters", ":scope > .prototype-search, :scope > .prototype-category-filters, :scope > .prototype-tool-type");
        fit(layout, "selects", ":scope > .prototype-select, :scope > .prototype-clear-cell");
      });
      root.querySelectorAll(".prototype-archive-row").forEach((layout) => fit(layout, "row", ":scope > .content-panel"));
      root.querySelectorAll(".prototype-weekly").forEach((layout) => {
        fit(layout, "heading", ":scope > .prototype-weekly-heading");
        fit(layout, "weekly", ".prototype-weekly-card", 2);
      });
      root.querySelectorAll(".prototype-tool-list").forEach((list) => {
        const rows = [...list.querySelectorAll(".prototype-tool-row")];
        rows.forEach((layout) => {
          if (width <= 900) {
            const top = fit(layout, "top", ":scope > .prototype-tool-evidence");
            const bottom = fit(layout, "bottom", ":scope > .prototype-tool-meta");
            const description = fit(layout, "description", ":scope > .prototype-tool-number, :scope > .prototype-tool-description");
            write(layout, "--fit-top", Math.max(top, description - bottom));
          } else fit(layout, "row", ":scope > .content-panel");
        });
        if (width > 1600) {
          for (let index = 0; index < rows.length; index += 2) {
            const pair = rows.slice(index, index + 2);
            const halves = Math.max(1, ...pair.flatMap((layout) => [...layout.children].map((panel) => Math.ceil(contentHeight(panel) * 2 / module))));
            pair.forEach((layout) => write(layout, "--fit-halves", halves));
            write(list, "--fit-odd-halves", halves);
          }
        }
      });
      root.querySelectorAll(".prototype-empty").forEach((layout) => fit(layout, "empty", null));
      root.querySelectorAll(".privacy-hero").forEach((layout) => fit(layout, "hero", ":scope > .page-opening-main, :scope > .page-opening-aside", 2));
      root.querySelectorAll(".privacy-section").forEach((layout) => fit(layout, "section", ":scope > div"));
      for (const element of observed) if (!nextObserved.has(element)) { resize.unobserve(element); observed.delete(element); }
      for (const element of nextObserved) if (!observed.has(element)) { resize.observe(element); observed.add(element); }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(snap); };
    const resize = new ResizeObserver(schedule);
    const mutations = new MutationObserver(schedule);
    mutations.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["hidden"] });
    window.addEventListener("resize", schedule);
    document.fonts.addEventListener("loadingdone", schedule);
    snap();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutations.disconnect();
      window.removeEventListener("resize", schedule);
      document.fonts.removeEventListener("loadingdone", schedule);
    };
  });
}
