import React, { forwardRef } from "react";
import {
  BookmarkSimple as PhosphorBookmark, Check as PhosphorCheck, LinkSimple as PhosphorLink,
  Robot as PhosphorRobot, DotsThree as PhosphorMore, MagnifyingGlassPlus as PhosphorZoomIn,
  MagnifyingGlassMinus as PhosphorZoomOut, ArrowsOutCardinal as PhosphorPan,
  Shuffle as PhosphorShuffle, ArrowCounterClockwise as PhosphorReset,
  Pause as PhosphorPause, Crosshair as PhosphorCrosshair,
} from "@phosphor-icons/react";
import { guidanceAliases, guidanceShapes } from "./guidance-data.js";

// Guidance by Streamline, CC BY 4.0. Originals and attribution: public/icons/guidance/.
// Keep geometry from the publisher; adapt ink and stroke weight to the existing UI.
const fallbacks = {
  BookmarkSimple: PhosphorBookmark, Check: PhosphorCheck, LinkSimple: PhosphorLink,
  Robot: PhosphorRobot, DotsThree: PhosphorMore, MagnifyingGlassPlus: PhosphorZoomIn,
  MagnifyingGlassMinus: PhosphorZoomOut, ArrowsOutCardinal: PhosphorPan,
  Shuffle: PhosphorShuffle, ArrowCounterClockwise: PhosphorReset,
  Pause: PhosphorPause, Crosshair: PhosphorCrosshair,
};
const strokes = { thin: 0.25, light: 1, regular: 1.5, bold: 2, fill: 1.5 };
function shape([tag, attributes, children], key) {
  return React.createElement(tag, { ...attributes, key }, children.map(shape));
}
function icon(name) {
  const original = guidanceAliases[name];
  const Component = forwardRef(function Icon({ size = 24, weight = "regular", color = "currentColor", mirrored = false, alt, style, children, ...props }, ref) {
    if (!original) {
      const Fallback = fallbacks[name];
      return <Fallback ref={ref} size={size} weight={weight} color={color} mirrored={mirrored} alt={alt} style={style} data-icon-library="phosphor" {...props}>{children}</Fallback>;
    }
    return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" color={color} fill={weight === "fill" ? "currentColor" : "none"} strokeWidth={strokes[weight] ?? strokes.regular} aria-hidden={alt ? undefined : true} role={alt ? "img" : undefined} style={{ overflow: "visible", ...(mirrored ? { transform: "scaleX(-1)" } : {}), ...style }} data-icon-library="guidance" data-icon-name={name} {...props}>
      {alt && <title>{alt}</title>}
      {guidanceShapes[original].map(shape)}
      {children}
    </svg>;
  });
  Component.displayName = name;
  return Component;
}

export const ArrowLeft = icon("ArrowLeft");
export const ArrowRight = icon("ArrowRight");
export const ArrowUpRight = icon("ArrowUpRight");
export const ArrowSquareOut = icon("ArrowSquareOut");
export const ArrowDown = icon("ArrowDown");
export const CaretDown = icon("CaretDown");
export const MagnifyingGlass = icon("MagnifyingGlass");
export const Clock = icon("Clock");
export const Plus = icon("Plus");
export const Minus = icon("Minus");
export const ImageSquare = icon("ImageSquare");
export const Info = icon("Info");
export const Star = icon("Star");
export const Play = icon("Play");
export const X = icon("X");

// Guidance has no matching glyphs for these roles. Preserve meaning and interaction.
export const BookmarkSimple = icon("BookmarkSimple");
export const Check = icon("Check");
export const LinkSimple = icon("LinkSimple");
export const Robot = icon("Robot");
export const DotsThree = icon("DotsThree");
export const MagnifyingGlassPlus = icon("MagnifyingGlassPlus");
export const MagnifyingGlassMinus = icon("MagnifyingGlassMinus");
export const ArrowsOutCardinal = icon("ArrowsOutCardinal");
export const Shuffle = icon("Shuffle");
export const ArrowCounterClockwise = icon("ArrowCounterClockwise");
export const Pause = icon("Pause");
export const Crosshair = icon("Crosshair");
