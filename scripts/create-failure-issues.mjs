#!/usr/bin/env node
// @ts-check
/**
 * create-failure-issues.mjs
 *
 * Reads playwright-results.json, collects failed tests, then creates one
 * GitHub issue per unique failure (with deduplication against open issues).
 *
 * Environment variables (injected by GitHub Actions):
 *   GITHUB_TOKEN        — GitHub API token
 *   GITHUB_REPOSITORY   — "owner/repo"
 *   PR_NUMBER           — pull request number
 *   BRANCH_NAME         — head branch of the PR
 *   PR_URL              — HTML URL of the PR
 */

import { readFileSync, existsSync } from "fs"

const { GITHUB_TOKEN, GITHUB_REPOSITORY, PR_NUMBER, BRANCH_NAME, PR_URL } = process.env

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
  console.log("Missing required env vars, skipping issue creation.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")
const LABEL_NAME = "e2e-failure"
const MAX_ERROR_LEN = 2000

// ---------------------------------------------------------------------------
// Read Playwright results
// ---------------------------------------------------------------------------

if (!existsSync("playwright-results.json")) {
  console.log("playwright-results.json not found, skipping issue creation.")
  process.exit(0)
}

const results = JSON.parse(readFileSync("playwright-results.json", "utf8"))

/**
 * @typedef {{ title: string; error: string }} FailedTest
 */

/**
 * Walk the nested suites tree and collect failed test info.
 * @param {unknown} suite
 * @param {string[]} titleParts
 * @returns {FailedTest[]}
 */
function collectFailures(suite, titleParts = []) {
  /** @type {FailedTest[]} */
  const failures = []

  if (!suite || typeof suite !== "object") return failures
  const s = /** @type {Record<string, unknown>} */ (suite)

  const suiteName = typeof s["title"] === "string" ? s["title"] : ""
  const parts = suiteName ? [...titleParts, suiteName] : titleParts

  if (Array.isArray(s["specs"])) {
    for (const spec of /** @type {unknown[]} */ (s["specs"])) {
      const sp = /** @type {Record<string, unknown>} */ (spec)
      const tests = /** @type {Array<Record<string, unknown>>} */ (sp["tests"] ?? [])
      for (const t of tests) {
        if (t["status"] !== "unexpected") continue
        const specTitle = typeof sp["title"] === "string" ? sp["title"] : "unknown"
        const fullTitle = [...parts, specTitle].join(" > ")
        const results2 = /** @type {Array<Record<string, unknown>>} */ (t["results"] ?? [])
        const errorMsg = results2
          .flatMap((r) => {
            const errs = /** @type {Array<Record<string, unknown>>} */ (r["errors"] ?? [])
            return errs.map((e) => (typeof e["message"] === "string" ? e["message"] : ""))
          })
          .filter(Boolean)
          .join("\n\n")
          .slice(0, MAX_ERROR_LEN)
        failures.push({ title: fullTitle, error: errorMsg || "No error details captured." })
      }
    }
  }

  if (Array.isArray(s["suites"])) {
    for (const child of /** @type {unknown[]} */ (s["suites"])) {
      failures.push(...collectFailures(child, parts))
    }
  }

  return failures
}

/** @type {FailedTest[]} */
const allFailures = []
for (const suite of results.suites ?? []) {
  allFailures.push(...collectFailures(suite))
}

// Deduplicate by title
const uniqueFailures = [...new Map(allFailures.map((f) => [f.title, f])).values()]

console.log(`Unique failures to process: ${uniqueFailures.length}`)
if (uniqueFailures.length === 0) {
  console.log("No failures found.")
  process.exit(0)
}

// ---------------------------------------------------------------------------
// Ensure the e2e-failure label exists
// ---------------------------------------------------------------------------

const labelCheckRes = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/labels/${LABEL_NAME}`,
  {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
)

if (labelCheckRes.status === 404) {
  const createLabelRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/labels`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ name: LABEL_NAME, color: "d73a4a", description: "Automated e2e test failure" }),
    }
  )
  if (createLabelRes.ok) {
    console.log(`Created label "${LABEL_NAME}"`)
  } else {
    console.error(`Failed to create label: ${createLabelRes.status}`)
  }
}

// ---------------------------------------------------------------------------
// Fetch existing open issues with this label (for deduplication)
// ---------------------------------------------------------------------------

const existingRes = await fetch(
  `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=${LABEL_NAME}&per_page=100`,
  {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
)

/** @type {Set<string>} */
const existingTitles = new Set()
if (existingRes.ok) {
  const existing = await existingRes.json()
  for (const issue of /** @type {Array<{title: string}>} */ (existing)) {
    existingTitles.add(issue.title)
  }
}
console.log(`Existing open e2e-failure issues: ${existingTitles.size}`)

// ---------------------------------------------------------------------------
// Create issues for new failures
// ---------------------------------------------------------------------------

for (const failure of uniqueFailures) {
  const issueTitle = `[e2e] ${failure.title} failed`

  if (existingTitles.has(issueTitle)) {
    console.log(`Skipping duplicate: ${issueTitle}`)
    continue
  }

  const body = [
    `## E2E Test Failure`,
    ``,
    `**Test:** \`${failure.title}\``,
    `**Branch:** \`${BRANCH_NAME ?? "unknown"}\``,
    `**PR:** ${PR_URL ? `[#${PR_NUMBER}](${PR_URL})` : `#${PR_NUMBER ?? "unknown"}`}`,
    ``,
    `### Error`,
    ``,
    "```",
    failure.error,
    "```",
    ``,
    `---`,
    `*Auto-created by CI — Playwright E2E run*`,
  ].join("\n")

  const createRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ title: issueTitle, body, labels: [LABEL_NAME] }),
    }
  )

  if (createRes.ok) {
    const created = await createRes.json()
    console.log(`Created issue #${created.number}: ${issueTitle}`)
  } else {
    console.error(`Failed to create issue for "${issueTitle}": ${createRes.status}`)
  }
}
