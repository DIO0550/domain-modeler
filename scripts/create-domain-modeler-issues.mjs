#!/usr/bin/env node
/**
 * Register domain-modeler Epic + child Issues on GitHub.
 *
 * Usage:
 *   GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/create-domain-modeler-issues.mjs
 *   DRY_RUN=1 node scripts/create-domain-modeler-issues.mjs
 *
 * If GITHUB_TOKEN is unset, falls back to `gh api` (uses gh auth).
 * If GITHUB_REPOSITORY is unset, falls back to `gh repo view --json nameWithOwner`.
 *
 * Notes:
 * - Cursor/GitHub App tokens may lack label write and issue update permissions.
 *   This script therefore creates unlabeled issues and embeds intended labels in
 *   the body. The Epic is created last so its checklist can include issue numbers.
 * - SKIP_LABELS=1 (default when label API fails) skips label ensure.
 * - SKIP_EXISTING=1 (default) skips titles that already exist.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BREAKDOWN = join(ROOT, "docs/domain-modeler/issues-breakdown.md");

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const SKIP_EXISTING = process.env.SKIP_EXISTING !== "0";
const SKIP_LABELS = process.env.SKIP_LABELS === "1" || process.env.SKIP_LABELS === "true";

const LABEL_DEFS = [
  { name: "type:chore", color: "cfd3d7", description: "Chore / maintenance" },
  { name: "type:migration", color: "d4c5f9", description: "Migration / move" },
  { name: "type:feature", color: "0e8a16", description: "New feature" },
  { name: "type:test", color: "1d76db", description: "Tests" },
  { name: "type:docs", color: "0075ca", description: "Documentation" },
  { name: "type:epic", color: "5319e7", description: "Epic tracking issue" },
  { name: "area:shared", color: "fbca04", description: "Shared / packages" },
  { name: "area:frontend", color: "f9d0c4", description: "Frontend / desktop UI" },
  { name: "area:server", color: "b60205", description: "Tauri / Rust backend" },
  { name: "priority:P1", color: "d93f0b", description: "Priority P1" },
  { name: "priority:P2", color: "e99695", description: "Priority P2" },
  { name: "priority:P3", color: "fef2c0", description: "Priority P3" },
  { name: "size:S", color: "c2e0c6", description: "Small" },
  { name: "size:M", color: "bfd4f2", description: "Medium" },
  { name: "phase:0", color: "ededed", description: "Phase 0 foundation" },
  { name: "phase:1", color: "ededed", description: "Phase 1 canvas-core" },
  { name: "phase:2", color: "ededed", description: "Phase 2 model-core" },
  { name: "phase:3", color: "ededed", description: "Phase 3 Tauri" },
  { name: "phase:4", color: "ededed", description: "Phase 4 App shell" },
  { name: "phase:5", color: "ededed", description: "Phase 5 Canvas UI" },
  { name: "phase:6", color: "ededed", description: "Phase 6 Model editor" },
  { name: "phase:7", color: "ededed", description: "Phase 7 Scaffold" },
  { name: "phase:8", color: "ededed", description: "Phase 8 Quality / docs" },
];

function parseBreakdown(markdown) {
  const epicMatch = markdown.match(
    /## Epic\s+### (\[Epic\][^\n]+)\s+([\s\S]*?)(?=\n## Phase)/,
  );
  if (!epicMatch) throw new Error("Failed to parse Epic section");

  const epic = {
    title: epicMatch[1].trim(),
    body: epicMatch[2].trim(),
    labels: ["type:epic", "area:shared", "priority:P1"],
  };

  const phaseBlocks = [
    ...markdown.matchAll(
      /## Phase (\d+): ([^\n]+)\n([\s\S]*?)(?=\n## Phase |\n## GitHub |\n*$)/g,
    ),
  ];

  const children = [];
  for (const [, phaseNum, phaseName, block] of phaseBlocks) {
    const issueMatches = [
      ...block.matchAll(/### (\d{3})\. (.+?)\n((?:- \*\*[^\n]+\n)+)/g),
    ];
    for (const [, id, title, fields] of issueMatches) {
      const get = (key) => {
        const m = fields.match(new RegExp(`- \\*\\*${key}\\*\\*: (.+)`));
        return m ? m[1].trim() : "";
      };
      const labels = get("Labels")
        .split(",")
        .map((s) => s.replace(/`/g, "").trim())
        .filter(Boolean);
      labels.push(`phase:${phaseNum}`);

      children.push({
        id,
        title: `${id}. ${title.trim()}`,
        phase: Number(phaseNum),
        phaseName: phaseName.trim(),
        targets: get("変更対象"),
        content: get("内容"),
        done: get("完了条件"),
        labels,
      });
    }
  }

  if (children.length !== 63) {
    throw new Error(`Expected 63 child issues, parsed ${children.length}`);
  }

  return { epic, children };
}

function childBody(child, epicTitle) {
  return [
    `**Phase**: ${child.phase} — ${child.phaseName}`,
    "",
    `**変更対象**: ${child.targets}`,
    "",
    `**内容**: ${child.content}`,
    "",
    `**完了条件**: ${child.done}`,
    "",
    `**Labels (intended)**: ${child.labels.map((l) => `\`${l}\``).join(", ")}`,
    "",
    `**Epic**: ${epicTitle}`,
    "",
    "---",
    "",
    "仕様: `docs/domain-modeler/`",
    `分解案: \`docs/domain-modeler/issues-breakdown.md\` (#${child.id})`,
  ].join("\n");
}

function resolveRepo() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const r = spawnSync(
    "gh",
    ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
    { encoding: "utf8" },
  );
  if (r.status !== 0) {
    throw new Error(
      "Set GITHUB_REPOSITORY=owner/repo or run inside a gh-authenticated clone",
    );
  }
  return r.stdout.trim();
}

async function githubRequest(method, path, body) {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) {
    const res = await fetch(`https://api.github.com${path}`, {
      method,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "domain-modeler-issue-script",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    if (!res.ok) {
      const err = new Error(
        `GitHub API ${method} ${path} failed: ${res.status} ${data?.message || text}`,
      );
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  const args = ["api", "-X", method, path];
  if (body) args.push("--input", "-");
  const r = spawnSync("gh", args, {
    encoding: "utf8",
    input: body ? JSON.stringify(body) : undefined,
  });
  if (r.status !== 0) {
    const combined = `${r.stderr || ""}\n${r.stdout || ""}`;
    const err = new Error(`gh api ${method} ${path} failed: ${combined.trim()}`);
    const m = /HTTP (\d+)/.exec(combined);
    err.status = m ? Number(m[1]) : 500;
    throw err;
  }
  return r.stdout ? JSON.parse(r.stdout) : null;
}

async function ensureLabels(owner, repo) {
  if (SKIP_LABELS) {
    console.log("SKIP_LABELS=1 — skipping label ensure");
    return false;
  }
  let applied = true;
  for (const label of LABEL_DEFS) {
    if (DRY_RUN) {
      console.log(`[dry-run] ensure label ${label.name}`);
      continue;
    }
    try {
      await githubRequest("POST", `/repos/${owner}/${repo}/labels`, label);
      console.log(`created label ${label.name}`);
    } catch (err) {
      if (err.status === 422) {
        try {
          await githubRequest(
            "PATCH",
            `/repos/${owner}/${repo}/labels/${encodeURIComponent(label.name)}`,
            { color: label.color, description: label.description },
          );
          console.log(`updated label ${label.name}`);
        } catch (patchErr) {
          console.warn(`label ensure failed for ${label.name}: ${patchErr.message}`);
          applied = false;
          break;
        }
      } else if (err.status === 403) {
        console.warn(
          "Label API not accessible (403). Continuing without labels; intended labels are written into issue bodies.",
        );
        return false;
      } else {
        throw err;
      }
    }
  }
  return applied;
}

async function listAllIssues(owner, repo) {
  const all = [];
  let page = 1;
  while (true) {
    const items = await githubRequest(
      "GET",
      `/repos/${owner}/${repo}/issues?state=all&per_page=100&page=${page}`,
    );
    if (!items.length) break;
    all.push(...items.filter((i) => !i.pull_request));
    if (items.length < 100) break;
    page += 1;
  }
  return all;
}

async function createIssue(owner, repo, { title, body, labels, attachLabels }) {
  if (DRY_RUN) {
    console.log(`[dry-run] create issue: ${title}`);
    if (labels?.length) console.log(`  labels: ${labels.join(", ")}`);
    return { number: 0, html_url: "(dry-run)", title };
  }
  const payload = { title, body };
  if (attachLabels && labels?.length) payload.labels = labels;
  const issue = await githubRequest(
    "POST",
    `/repos/${owner}/${repo}/issues`,
    payload,
  );
  console.log(`created #${issue.number}: ${title}`);
  return issue;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const markdown = readFileSync(BREAKDOWN, "utf8");
  const { epic, children } = parseBreakdown(markdown);
  const repoFull = resolveRepo();
  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) throw new Error(`Invalid repo: ${repoFull}`);

  console.log(`Repository: ${owner}/${repo}`);
  console.log(`Dry run: ${DRY_RUN}`);
  console.log(`Child issues: ${children.length}`);

  const labelsOk = await ensureLabels(owner, repo);

  const existingIssues = DRY_RUN ? [] : await listAllIssues(owner, repo);
  const byTitle = new Map(existingIssues.map((i) => [i.title, i]));

  const createdOrExisting = [];
  for (const child of children) {
    const existing = byTitle.get(child.title);
    if (existing && SKIP_EXISTING) {
      console.log(`skip existing #${existing.number}: ${child.title}`);
      createdOrExisting.push({
        ...child,
        number: existing.number,
        url: existing.html_url,
      });
      continue;
    }
    const issue = await createIssue(owner, repo, {
      title: child.title,
      body: childBody(child, epic.title),
      labels: child.labels,
      attachLabels: labelsOk,
    });
    createdOrExisting.push({
      ...child,
      number: issue.number,
      url: issue.html_url,
    });
    if (!DRY_RUN) await sleep(200);
  }

  const checklist = createdOrExisting
    .map((c) =>
      c.number
        ? `- [ ] #${c.number} ${c.title}`
        : `- [ ] ${c.title}`,
    )
    .join("\n");

  let epicIssue = byTitle.get(epic.title);
  if (epicIssue && SKIP_EXISTING) {
    console.log(`skip existing epic #${epicIssue.number}: ${epic.title}`);
    console.log(
      "Note: existing Epic body was not updated (issue update may be forbidden).",
    );
  } else {
    epicIssue = await createIssue(owner, repo, {
      title: epic.title,
      body: [
        epic.body,
        "",
        "---",
        "",
        `**Labels (intended)**: ${epic.labels.map((l) => `\`${l}\``).join(", ")}`,
        "",
        "## 子 Issue",
        "",
        checklist,
        "",
        "分解案: `docs/domain-modeler/issues-breakdown.md`",
      ].join("\n"),
      labels: epic.labels,
      attachLabels: labelsOk,
    });
  }

  console.log("Done.");
  if (epicIssue?.html_url) console.log(`Epic: ${epicIssue.html_url}`);
  console.log(
    `Children ready: ${createdOrExisting.filter((c) => c.number).length}/${children.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
