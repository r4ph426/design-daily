import test from "node:test";
import assert from "node:assert/strict";
import { archiveReadingWindow } from "../src/archive-reading-window.js";

const now = new Date("2026-10-01T16:00:00");
const records = [
  ...Array.from({ length: 12 }, () => ({ dateISO: "2026-10-01" })),
  ...Array.from({ length: 12 }, () => ({ dateISO: "2026-09-02" })),
  ...Array.from({ length: 40 }, () => ({ dateISO: "2026-09-01" })),
];

test("the initial reading index includes the entire 30-day window, including its boundary", () => {
  assert.equal(archiveReadingWindow(records, { now }), 24);
});

test("older batches extend the window and stop at the end of the archive", () => {
  assert.equal(archiveReadingWindow(records, { now, olderCount: 20 }), 44);
  assert.equal(archiveReadingWindow(records, { now, olderCount: 100 }), records.length);
  assert.equal(archiveReadingWindow(records.slice(24), { now }), 20);
});

test("search and explicit date filters find older questions without scrolling through newer editions", () => {
  assert.equal(archiveReadingWindow(records, { now, query: "older source" }), records.length);
  assert.equal(archiveReadingWindow(records, { now, date: "month:2026-09" }), records.length);
});

test("opening an older shared question includes its selected row in the visible index", () => {
  assert.equal(archiveReadingWindow(records, { now, selectedIndex: 50 }), 51);
  assert.equal(archiveReadingWindow([], { now, selectedIndex: -1 }), 0);
});
