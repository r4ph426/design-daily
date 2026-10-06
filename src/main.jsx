import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { DesignCursor } from "./DesignCursor.jsx";
import { Inspiration } from "./inspiration/Inspiration.jsx";
import { GridPrototype } from "./grid-prototype.jsx";
import appStyles from "./styles.css?inline";
import gridStyles from "./grid-prototype.css?inline";
import mobileStyles from "./mobile-grid.css?inline";
import squareStyles from "./square-layouts.css?inline";

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}inspiration-sw.js`, {scope:import.meta.env.BASE_URL}).catch(() => {}); });
}

function usesGridLayout() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return !path || path === "archive" || path === "toolbox" || path.startsWith("questions/") || !window.location.hash.startsWith("#/");
}

function PublishedSite() {
  const [grid, setGrid] = useState(usesGridLayout);
  const [inspiration, setInspiration] = useState(() => window.location.hash.startsWith("#/inspiration"));
  useEffect(() => {
    const update = () => {
      setInspiration(window.location.hash.startsWith("#/inspiration"));
      if (!window.location.hash || window.location.hash === "#" || window.location.hash.startsWith("#/")) setGrid(usesGridLayout());
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return <><DesignCursor /><style>{(grid || inspiration ? gridStyles : appStyles) + squareStyles + mobileStyles}</style>{inspiration ? <Inspiration /> : grid ? <GridPrototype /> : <App />}</>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PublishedSite />
  </React.StrictMode>,
);
