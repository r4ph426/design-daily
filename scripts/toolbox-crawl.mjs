import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fetchPublicText } from "./lib/public-fetch.mjs";
import {
  dedupeCandidates,
  normalizeGitHubCandidate,
  validateToolboxData,
} from "./lib/toolbox.mjs";

const root = process.cwd();
const dryRun = process.argv.includes("--dry-run");
const configPath = path.join(root, "data", "toolbox-discovery.json");
const toolboxPath = path.join(root, "data", "toolbox.json");
const outputPath = path.join(root, "data", "toolbox-candidates.json");
const userAgent = "design-daily-toolbox-crawler/0.1 (+https://github.com/r4ph426/design-daily)";

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

function pageMetadata(html, url) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || new URL(url).hostname;
  const description = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
  return { title, description: description.slice(0, 320) };
}

async function checkKnownSource(url) {
  try {
    const response = await fetchPublicText(url);
    return { url, status: "Available", finalUrl: response.url, ...pageMetadata(response.text, response.url) };
  } catch (error) {
    return { url, status: "Check failed", error: error.message };
  }
}

async function searchGitHub({ label, query }) {
  const headers = { accept: "application/vnd.github+json", "user-agent": userAgent, "x-github-api-version": "2022-11-28" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const url = new URL("https://api.github.com/search/repositories");
  url.searchParams.set("q", query);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("order", "desc");
  url.searchParams.set("per_page", "15");
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`GitHub search failed for ${label}: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return (data.items ?? []).map((repo) => normalizeGitHubCandidate(repo, label));
}

async function main() {
  const [config, toolbox] = await Promise.all([readJson(configPath), readJson(toolboxPath)]);
  validateToolboxData(toolbox);
  if (dryRun) {
    console.log(`Toolbox dry run passed: ${toolbox.tools.length} curated tools, ${config.githubQueries.length} discovery queries, ${config.knownSources.length} monitored sources.`);
    return;
  }

  const discoveryErrors = [];
  const [searchGroups, sourceChecks] = await Promise.all([
    Promise.all(config.githubQueries.map(async (query) => {
      try {
        return await searchGitHub(query);
      } catch (error) {
        discoveryErrors.push({ source: query.label, error: error.message });
        console.warn(`Discovery source skipped: ${query.label}: ${error.message}`);
        return [];
      }
    })),
    Promise.all(config.knownSources.map(checkKnownSource)),
  ]);
  const knownUrls = [...config.knownSources, ...toolbox.tools.map((tool) => tool.url)];
  const previous = await readJson(outputPath).catch(() => ({ candidates: [] }));
  const candidates = dedupeCandidates([...searchGroups.flat(), ...(previous.candidates ?? [])], knownUrls).slice(0, 40);
  const output = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    editorialStatus: "Candidate queue only. Review in Codex before adding to the published toolbox.",
    practices: config.practices,
    queries: config.githubQueries.map(({ label }) => label),
    discoveryErrors,
    monitoredSources: sourceChecks,
    candidates,
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Toolbox discovery refreshed: ${candidates.length} candidates, ${sourceChecks.length} monitored sources.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
