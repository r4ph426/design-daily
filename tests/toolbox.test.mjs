import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  dedupeCandidates,
  inferPractices,
  inferToolType,
  normalizeGitHubCandidate,
  validateToolboxData,
} from "../scripts/lib/toolbox.mjs";

test("the curated toolbox uses valid types, practices, categories, and unique URLs", async () => {
  const data = JSON.parse(await readFile(new URL("../data/toolbox.json", import.meta.url), "utf8"));
  assert.equal(validateToolboxData(data), true);
});

test("candidate inference keeps technical type separate from design practice", () => {
  const candidate = { name: "screen-review-mcp", description: "MCP for accessibility audits and interface flow review", topics: ["design"] };
  assert.equal(inferToolType(candidate), "MCP");
  assert.deepEqual(inferPractices(candidate), ["Accessibility", "Flows", "Review", "Pattern research"]);
});

test("discovery candidates are deduplicated and exclude curated sources", () => {
  const repo = { name: "design-skill", full_name: "team/design-skill", description: "A design review skill", html_url: "https://github.com/team/design-skill", topics: [], stargazers_count: 12, updated_at: new Date().toISOString() };
  const normalized = normalizeGitHubCandidate(repo, "Designer skills");
  assert.equal(dedupeCandidates([normalized, normalized]).length, 1);
  assert.equal(dedupeCandidates([normalized], ["https://github.com/team/design-skill/"]).length, 0);
});

test("a previous candidate remains valid input when a discovery source is unavailable", () => {
  const previous = { name: "saved-candidate", description: "design review skill", url: "https://github.com/team/saved-candidate", relevanceScore: 9, stars: 3 };
  assert.deepEqual(dedupeCandidates([previous]), [previous]);
});
