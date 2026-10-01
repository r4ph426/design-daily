import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import { GridPrototype } from "./grid-prototype.jsx";
import appStyles from "./styles.css?inline";
import gridStyles from "./grid-prototype.css?inline";
import squareStyles from "./square-layouts.css?inline";

function usesGridLayout() {
  const path = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return !path || path === "archive" || path === "toolbox" || path.startsWith("questions/") || !window.location.hash.startsWith("#/");
}

function PublishedSite() {
  const [grid, setGrid] = useState(usesGridLayout);
  useEffect(() => {
    const update = () => {
      if (!window.location.hash || window.location.hash === "#" || window.location.hash.startsWith("#/")) setGrid(usesGridLayout());
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  return <><style>{(grid ? gridStyles : appStyles) + squareStyles}</style>{grid ? <GridPrototype /> : <App />}</>;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PublishedSite />
  </React.StrictMode>,
);
