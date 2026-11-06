// Weekly job scrape: runs the workflow's searches through Google Jobs and saves
// new remote TAM / CSM postings to scrape_results/DATE.md (and .json).
//
// Run with: bun run scrape
// Bun loads .env automatically. Keys used: SERPAPI_API_KEY (primary),
// SEARCHAPI_API_KEY (fallback). Keys are never printed or written to disk.
//
// Optional env vars:
//   SCRAPE_MAX_QUERIES=2   run only the first N queries (for testing)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const RESULTS_DIR = join(ROOT, "scrape_results");
const SEEN_FILE = join(RESULTS_DIR, "seen.json");
const LEADS_FILE = join(ROOT, "job_leads.md");

const PROFILE_FILE = join(ROOT, "job_search_profile.md");

// Target companies from the profile's "**Target companies:**" line, if any are named.
function targetCompanies(): string[] {
  if (!existsSync(PROFILE_FILE)) return [];
  const match = readFileSync(PROFILE_FILE, "utf8").match(/\*\*Target companies:\*\*\s*(.+)/);
  if (!match || /^none/i.test(match[1].trim())) return [];
  return match[1]
    .replace(/\.$/, "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

// Searches from weekly_job_hunt_workflow.md, step C.
const INDUSTRIES = ["cybersecurity", "climate tech", "responsible AI", "healthtech"];
const QUERIES = [
  ...INDUSTRIES.flatMap((industry) => [
    `technical account manager remote ${industry}`,
    `customer success manager remote ${industry}`,
  ]),
  "technical customer success manager remote",
  "customer success engineer remote",
  "strategic customer success manager remote",
  ...targetCompanies().flatMap((company) => [
    `${company} technical account manager`,
    `${company} customer success manager`,
  ]),
];

// Role must-have from job_search_profile.md: TAM or CSM.
const ROLE_PATTERN =
  /technical account manager|\bTAM\b|customer success manager|customer success engineer|\bCSM\b/i;
// Out of scope per the profile.
const EXCLUDE_PATTERN = /sales engineer|solutions engineer|account executive|implementation (manager|specialist|consultant)/i;

type Job = {
  title: string;
  company: string;
  location: string;
  via: string;
  postedAt: string;
  remote: boolean;
  link: string;
  query: string;
  provider: "serpapi" | "searchapi";
};

function redact(message: string): string {
  let out = message;
  for (const key of [process.env.SERPAPI_API_KEY, process.env.SEARCHAPI_API_KEY]) {
    if (key) out = out.split(key).join("<redacted>");
  }
  return out;
}

function isRemote(location: string, title: string, flag: unknown): boolean {
  if (flag === true) return true;
  return /\bremote\b|anywhere|work from home/i.test(`${location} ${title}`);
}

async function searchSerpApi(query: string): Promise<Job[]> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) throw new Error("SERPAPI_API_KEY is not set");
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: query,
    location: "United States",
    hl: "en",
    api_key: key,
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const data: any = await res.json();
  if (data.error && !/hasn't returned any results/i.test(data.error)) {
    throw new Error(`SerpAPI: ${data.error}`);
  }
  return (data.jobs_results ?? []).map((j: any): Job => ({
    title: j.title ?? "",
    company: j.company_name ?? "",
    location: j.location ?? "",
    via: (j.via ?? "").replace(/^via\s+/i, ""),
    postedAt: j.detected_extensions?.posted_at ?? "",
    remote: isRemote(j.location ?? "", j.title ?? "", j.detected_extensions?.work_from_home),
    link: j.apply_options?.[0]?.link ?? j.share_link ?? "",
    query,
    provider: "serpapi",
  }));
}

async function searchSearchApi(query: string): Promise<Job[]> {
  const key = process.env.SEARCHAPI_API_KEY;
  if (!key) throw new Error("SEARCHAPI_API_KEY is not set");
  const params = new URLSearchParams({
    engine: "google_jobs",
    q: query,
    location: "United States",
    hl: "en",
  });
  const res = await fetch(`https://www.searchapi.io/api/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`SearchAPI HTTP ${res.status}`);
  const data: any = await res.json();
  if (data.error) throw new Error(`SearchAPI: ${data.error}`);
  return (data.jobs ?? []).map((j: any): Job => ({
    title: j.title ?? "",
    company: j.company_name ?? "",
    location: j.location ?? "",
    via: (j.via ?? "").replace(/^via\s+/i, ""),
    postedAt: j.detected_extensions?.posted_at ?? "",
    remote: isRemote(j.location ?? "", j.title ?? "", j.detected_extensions?.work_from_home),
    link: j.apply_link ?? j.apply_links?.[0]?.link ?? j.sharing_link ?? "",
    query,
    provider: "searchapi",
  }));
}

async function search(query: string): Promise<Job[]> {
  try {
    return await searchSerpApi(query);
  } catch (err) {
    console.warn(`  SerpAPI failed (${redact(String(err))}); trying SearchAPI`);
    return await searchSearchApi(query);
  }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const jobKey = (j: { company: string; title: string }) => `${norm(j.company)}|${norm(j.title)}`;

// Company|role pairs already in job_leads.md (columns: Source, Role, Company, ...).
function existingLeadKeys(): Set<string> {
  const keys = new Set<string>();
  if (!existsSync(LEADS_FILE)) return keys;
  for (const line of readFileSync(LEADS_FILE, "utf8").split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4 || cells[2] === "Role" || cells[2].startsWith("---")) continue;
    keys.add(jobKey({ company: cells[3], title: cells[2] }));
  }
  return keys;
}

function cell(s: string): string {
  return s.replace(/\|/g, "/").replace(/\s+/g, " ").trim();
}

async function main() {
  const date = new Date().toLocaleDateString("en-CA"); // local YYYY-MM-DD
  const max = Number(process.env.SCRAPE_MAX_QUERIES) || QUERIES.length;
  const queries = QUERIES.slice(0, max);

  mkdirSync(RESULTS_DIR, { recursive: true });
  const seen: Record<string, string> = existsSync(SEEN_FILE)
    ? JSON.parse(readFileSync(SEEN_FILE, "utf8"))
    : {};
  const inLeads = existingLeadKeys();

  const found = new Map<string, Job>();
  let raw = 0;
  let failed = 0;
  const skipped = { notRole: 0, notRemote: 0, known: 0 };

  for (const query of queries) {
    console.log(`Searching: ${query}`);
    let jobs: Job[] = [];
    try {
      jobs = await search(query);
    } catch (err) {
      failed++;
      console.error(`  Both providers failed: ${redact(String(err))}`);
      continue;
    }
    raw += jobs.length;
    for (const job of jobs) {
      const key = jobKey(job);
      if (!ROLE_PATTERN.test(job.title) || EXCLUDE_PATTERN.test(job.title)) skipped.notRole++;
      else if (!job.remote) skipped.notRemote++;
      else if (inLeads.has(key) || seen[key] || found.has(key)) skipped.known++;
      else found.set(key, job);
    }
  }

  // A second run on the same day adds to that day's file instead of replacing it.
  const todayJson = join(RESULTS_DIR, `${date}.json`);
  const earlierToday: Job[] = existsSync(todayJson) ? JSON.parse(readFileSync(todayJson, "utf8")) : [];
  const newJobs = [...found.values()];
  const jobs = [...earlierToday, ...newJobs];
  for (const job of newJobs) seen[jobKey(job)] = date;
  writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2) + "\n");
  writeFileSync(join(RESULTS_DIR, `${date}.json`), JSON.stringify(jobs, null, 2) + "\n");

  const rows = jobs.map(
    (j) =>
      `| ${cell(j.title)} | ${cell(j.company)} | ${cell(j.location)} | ${cell(j.postedAt) || "unknown"} | ${cell(j.via)} | ${j.link ? `[Link](${j.link})` : "none"} | ${cell(j.query)} |`,
  );
  const md = [
    `# Scrape results: ${date}`,
    "",
    `Unscored candidates from Google Jobs. The weekly run screens and scores these (workflow step D) before anything goes into \`job_leads.md\`.`,
    "",
    `- Queries run: ${queries.length} (${failed} failed)`,
    `- Postings returned: ${raw}`,
    `- New remote TAM/CSM candidates: ${newJobs.length} this run${earlierToday.length ? `, ${jobs.length} in total today` : ""}`,
    `- Skipped: ${skipped.notRole} not a target role, ${skipped.notRemote} not remote, ${skipped.known} already seen or in job_leads.md`,
    "",
    "| Role | Company | Location | Posted | Via | Link | Query |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
  writeFileSync(join(RESULTS_DIR, `${date}.md`), md);

  console.log(`Done: ${newJobs.length} new candidates (${jobs.length} today) saved to scrape_results/${date}.md`);
  if (failed === queries.length) process.exit(1);
}

main().catch((err) => {
  console.error(redact(String(err)));
  process.exit(1);
});
