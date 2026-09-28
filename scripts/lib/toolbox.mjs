const TYPES = new Set(["MCP", "Skill", "Agent", "Tool"]);
const CATEGORIES = new Set(["UI", "UX", "Process", "Culture"]);
const VERDICTS = new Set(["Useful now", "Worth trying", "Best practice", "Watching"]);

export const PRACTICES = [
  "Taste",
  "Drafting",
  "UI sketches",
  "Flows",
  "Accessibility",
  "Review",
  "Creative exploration",
  "Pattern research",
];

const PRACTICE_RULES = [
  ["Accessibility", /accessib|a11y|wcag|inclusive/],
  ["Flows", /flow|journey|onboarding|navigation|prototype/],
  ["Review", /review|audit|critique|quality|test|inspect|qa\b/],
  ["Taste", /taste|inspiration|reference|visual|gallery|curat/],
  ["Pattern research", /research|pattern|benchmark|screens?|library/],
  ["UI sketches", /interface|\bui\b|wireframe|screen|component|figma/],
  ["Drafting", /build|generate|draft|code|frontend|website|layout/],
  ["Creative exploration", /creative|motion|animation|experiment|art|image|scroll/],
];

export function canonicalToolUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

export function inferToolType(candidate) {
  const text = `${candidate.name ?? ""} ${candidate.description ?? ""} ${(candidate.topics ?? []).join(" ")}`.toLowerCase();
  if (/\bmcp\b|model context protocol/.test(text)) return "MCP";
  if (/\bskills?\b|skill-/.test(text)) return "Skill";
  if (/\bagents?\b|agentic/.test(text)) return "Agent";
  return "Tool";
}

export function inferPractices(candidate) {
  const text = `${candidate.name ?? ""} ${candidate.description ?? ""} ${(candidate.topics ?? []).join(" ")}`.toLowerCase();
  const matched = PRACTICE_RULES.filter(([, pattern]) => pattern.test(text)).map(([practice]) => practice);
  return matched.length ? matched.slice(0, 4) : ["Creative exploration"];
}

export function relevanceScore(candidate) {
  const text = `${candidate.name ?? ""} ${candidate.description ?? ""} ${(candidate.topics ?? []).join(" ")}`.toLowerCase();
  const strongSignals = (text.match(/mcp|design|designer|figma|interface|accessib|creative|motion|workflow|skill|agent/g) ?? []).length;
  const stars = Number(candidate.stargazers_count ?? 0);
  const freshness = candidate.updated_at && Date.now() - Date.parse(candidate.updated_at) < 90 * 86_400_000 ? 2 : 0;
  return strongSignals * 3 + Math.min(6, Math.log10(stars + 1) * 2) + freshness;
}

export function normalizeGitHubCandidate(repo, queryLabel) {
  const candidate = {
    id: `github:${repo.full_name}`,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description || "No repository description provided.",
    url: repo.html_url,
    source: "GitHub search",
    discoveredThrough: queryLabel,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count ?? 0,
    updatedAt: repo.updated_at,
  };
  return {
    ...candidate,
    suggestedType: inferToolType(candidate),
    suggestedPractices: inferPractices(candidate),
    relevanceScore: Number(relevanceScore(candidate).toFixed(2)),
    editorialStatus: "Needs review",
  };
}

export function dedupeCandidates(candidates, excludedUrls = []) {
  const excluded = new Set(excludedUrls.map(canonicalToolUrl));
  const byUrl = new Map();
  for (const candidate of candidates) {
    const key = canonicalToolUrl(candidate.url);
    if (excluded.has(key)) continue;
    const current = byUrl.get(key);
    if (!current || candidate.relevanceScore > current.relevanceScore) byUrl.set(key, candidate);
  }
  return [...byUrl.values()].sort((a, b) => b.relevanceScore - a.relevanceScore || b.stars - a.stars);
}

export function validateToolboxData(data) {
  if (!Array.isArray(data.weeklySignals) || !Array.isArray(data.tools)) throw new Error("Toolbox data needs weeklySignals and tools arrays");
  const ids = new Set();
  const urls = new Set();
  for (const tool of data.tools) {
    if (ids.has(tool.id)) throw new Error(`Duplicate toolbox id: ${tool.id}`);
    ids.add(tool.id);
    if (!TYPES.has(tool.type)) throw new Error(`Invalid toolbox type for ${tool.title}: ${tool.type}`);
    if (!VERDICTS.has(tool.verdict)) throw new Error(`Invalid toolbox verdict for ${tool.title}: ${tool.verdict}`);
    if (!Array.isArray(tool.categories) || tool.categories.some((category) => !CATEGORIES.has(category))) throw new Error(`Invalid product category for ${tool.title}`);
    if (!Array.isArray(tool.practices) || !tool.practices.length || tool.practices.some((practice) => !PRACTICES.includes(practice))) throw new Error(`Invalid design practice for ${tool.title}`);
    const url = canonicalToolUrl(tool.url);
    if (urls.has(url)) throw new Error(`Duplicate toolbox URL: ${tool.url}`);
    urls.add(url);
  }
  return true;
}
