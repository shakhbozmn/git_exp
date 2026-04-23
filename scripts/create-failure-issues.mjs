#!/usr/bin/env node
// @ts-check
/**
 * create-failure-issues.mjs
 *
 * Creates GitHub issues for CI failures:
 *   1. E2E test failures — read from playwright-results.json
 *   2. Lint / Type-check / Build failures — read from captured output files
 *
 * Environment variables (injected by GitHub Actions):
 *   GITHUB_TOKEN        — GitHub API token
 *   GITHUB_REPOSITORY   — "owner/repo"
 *   PR_NUMBER           — pull request number
 *   BRANCH_NAME         — head branch of the PR
 *   PR_URL              — HTML URL of the PR
 *   LINT_OUTCOME        — success | failure | skipped | cancelled
 *   TYPECHECK_OUTCOME   — success | failure | skipped | cancelled
 *   BUILD_OUTCOME       — success | failure | skipped | cancelled
 */

import { readFileSync, existsSync } from "fs"

const {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  PR_NUMBER,
  BRANCH_NAME,
  PR_URL,
  LINT_OUTCOME,
  TYPECHECK_OUTCOME,
  BUILD_OUTCOME,
} = process.env

if (!GITHUB_TOKEN || !GITHUB_REPOSITORY) {
  console.log("Missing required env vars, skipping issue creation.")
  process.exit(0)
}

const [owner, repo] = GITHUB_REPOSITORY.split("/")
const E2E_LABEL = "e2e-failure"
const CI_LABEL = "ci-failure"
const MAX_ERROR_LEN = 2000

const baseHeaders = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
}
const jsonHeaders = { ...baseHeaders, "Content-Type": "application/json" }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure a label exists in the repo, creating it if absent.
 * @param {string} name
 * @param {string} color
 * @param {string} description
 */
async function ensureLabel(name, color, description) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/labels/${name}`,
    { headers: baseHeaders }
  )
  if (res.status === 404) {
    const create = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/labels`,
      { method: "POST", headers: jsonHeaders, body: JSON.stringify({ name, color, description }) }
    )
    if (create.ok) console.log(`Created label "${name}"`)
    else console.error(`Failed to create label "${name}": ${create.status}`)
  }
}

/**
 * Return the set of titles of all open issues carrying a given label.
 * @param {string} label
 * @returns {Promise<Set<string>>}
 */
async function fetchOpenIssueTitles(label) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues?state=open&labels=${label}&per_page=100`,
    { headers: baseHeaders }
  )
  const titles = new Set()
  if (res.ok) {
    const issues = /** @type {Array<{title: string}>} */ (await res.json())
    for (const issue of issues) titles.add(issue.title)
  }
  return titles
}

/**
 * Create a GitHub issue unless an open issue with the same title already exists.
 * @param {string} title
 * @param {string} body
 * @param {string} label
 * @param {Set<string>} existingTitles
 */
async function createIssueIfNew(title, body, label, existingTitles) {
  if (existingTitles.has(title)) {
    console.log(`Skipping duplicate: ${title}`)
    return
  }
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    { method: "POST", headers: jsonHeaders, body: JSON.stringify({ title, body, labels: [label] }) }
  )
  if (res.ok) {
    const created = /** @type {{number: number}} */ (await res.json())
    console.log(`Created issue #${created.number}: ${title}`)
  } else {
    console.error(`Failed to create issue "${title}": ${res.status}`)
  }
}

// ---------------------------------------------------------------------------
// Part 1: E2E failures (from playwright-results.json)
// ---------------------------------------------------------------------------

if (existsSync("playwright-results.json")) {
  /**
   * @typedef {{ title: string; error: string }} FailedTest
   */

  const results = JSON.parse(readFileSync("playwright-results.json", "utf8"))

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

  const uniqueFailures = [...new Map(allFailures.map((f) => [f.title, f])).values()]
  console.log(`Unique E2E failures: ${uniqueFailures.length}`)

  if (uniqueFailures.length > 0) {
    await ensureLabel(E2E_LABEL, "d73a4a", "Automated e2e test failure")
    const existingTitles = await fetchOpenIssueTitles(E2E_LABEL)
    console.log(`Existing open ${E2E_LABEL} issues: ${existingTitles.size}`)

    for (const failure of uniqueFailures) {
      const issueTitle = `[e2e] ${failure.title} failed`
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
      await createIssueIfNew(issueTitle, body, E2E_LABEL, existingTitles)
    }
  }
} else {
  console.log("playwright-results.json not found, skipping E2E issue creation.")
}

// ---------------------------------------------------------------------------
// Part 2: CI step failures (lint / type-check / build)
// ---------------------------------------------------------------------------

const ciSteps = [
  { name: "Lint",       outcome: LINT_OUTCOME,     file: "lint-output.txt"  },
  { name: "Type-check", outcome: TYPECHECK_OUTCOME, file: "tsc-output.txt"   },
  { name: "Build",      outcome: BUILD_OUTCOME,     file: "build-output.txt" },
]

const failingSteps = ciSteps.filter((s) => s.outcome === "failure")
console.log(`Failing CI steps: ${failingSteps.length}`)

if (failingSteps.length > 0) {
  await ensureLabel(CI_LABEL, "e4e669", "Automated CI step failure")
  const existingTitles = await fetchOpenIssueTitles(CI_LABEL)
  console.log(`Existing open ${CI_LABEL} issues: ${existingTitles.size}`)

  for (const step of failingSteps) {
    const issueTitle = `[ci] ${step.name} failed`
    const rawOutput = existsSync(step.file)
      ? readFileSync(step.file, "utf8").slice(-MAX_ERROR_LEN).trim()
      : "No output captured."

    const body = [
      `## CI Step Failure: ${step.name}`,
      ``,
      `**Branch:** \`${BRANCH_NAME ?? "unknown"}\``,
      `**PR:** ${PR_URL ? `[#${PR_NUMBER}](${PR_URL})` : `#${PR_NUMBER ?? "unknown"}`}`,
      ``,
      `### Error Output`,
      ``,
      "```",
      rawOutput,
      "```",
      ``,
      `---`,
      `*Auto-created by CI*`,
    ].join("\n")

    await createIssueIfNew(issueTitle, body, CI_LABEL, existingTitles)
  }
}
