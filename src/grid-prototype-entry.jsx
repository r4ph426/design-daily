import { createRoot } from "react-dom/client";
import { DesignCursor } from "./DesignCursor.jsx";
import { GridPrototype } from "./grid-prototype.jsx";
import "./grid-prototype.css";
import "./square-layouts.css";

createRoot(document.getElementById("grid-prototype-root")).render(<><DesignCursor /><GridPrototype /></>);

import "./mobile-grid.css";
