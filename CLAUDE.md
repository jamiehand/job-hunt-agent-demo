# CLAUDE.md

Guide for Claude when working in this folder.

## Project

A personal job-hunt agent (Job Hunt Agent Demo, "Albert's List"). Claude handles the research-heavy, repetitive parts of a networking-based job search so the user can spend more time on conversations with people. The same project exists on claude.ai as "Job Hunt Agent Demo (Albert's List)".

The folder is a public git repository (`jamiehand/job-hunt-agent-demo` on GitHub). There are no tests.

## Weekly job search (find-jobs)

- `bun run find-jobs` (in `scripts/find-jobs.ts`) runs the workflow's searches through Google Jobs, using SearchAPI and falling back to SerpAPI. It writes new remote TAM and CSM candidates to `find_jobs_results/YYYY-MM-DD.md` and `.json`, and records them in `find_jobs_results/seen.json` so they don't come up again. For a cheaper test run, set `FIND_JOBS_MAX_QUERIES=1`.
- The results table is numbered and sorted newest first. The `.json` file also has the first 1,500 characters of each posting, so screening can start there instead of opening every link.
- When it finishes, it shows a macOS notification with the number of new candidates, or a "FAILED" notification if searches failed. Set `FIND_JOBS_NOTIFY=0` to turn this off.
- It runs every Monday at 8 am through launchd: `~/Library/LaunchAgents/com.jamiehand.job-hunt-find-jobs.plist`. Output goes to `logs/find-jobs.log`. To run it now: `launchctl kickstart gui/$(id -u)/com.jamiehand.job-hunt-find-jobs`.
- The results are unscored. The weekly run screens and scores them before anything goes into `job_leads.md`.
- **Tell the user when anything is broken**: find-jobs, the schedule, an API key or quota, missing or stale results, or anything else in this setup. Say it near the top of your reply, not only in the report. Include what broke, how you know (for example, a line from `logs/find-jobs.log`) and what you did instead, and suggest ways to fix it, so you can work it out together. Using a backup doesn't make a problem OK to skip over.
- **Find job leads through find-jobs first** (SearchAPI, with SerpAPI as the fallback). Use Claude's built-in web search only as a backup if find-jobs fails, and say so in the report.
- Keep the API keys for lead discovery only. Each full run uses about 11 searches, and the plans allow about 100 a month. Read posting pages and research companies and contacts with Claude's own tools, not the APIs.
- `find_jobs_results/` and `logs/` are git-ignored.

## Core files

| File | What it is | How to use it |
| --- | --- | --- |
| `job_search_profile.md` | Target roles, locations, industries and constraints | The source of truth for what counts as a good fit. Read it before any search or lead review. Change it only when the user asks. |
| `weekly_job_hunt_workflow.md` | The repeatable weekly workflow | Follow its steps in order during a weekly run. Suggest changes to it; don't edit it on your own. |
| `job_leads.md` | Saved leads and notes | The running record. Add new leads, update the status of existing ones, and never delete a lead or the user's notes. |
| `weekly_run_prompt.md` | The reusable weekly command | When the user runs it (or says "do the weekly run"), carry out the workflow against the profile and update `job_leads.md`. |

If one of these files is missing, say so and ask before creating it. Don't invent its content.

## Weekly run

1. Read `job_search_profile.md`, then `weekly_job_hunt_workflow.md`.
2. Read `job_leads.md` so you don't add duplicates and you know what is in progress.
3. Do the steps in the workflow. Check each lead against the profile and say why it fits or doesn't.
4. Update `job_leads.md`, then give a short summary: what's new, what changed, and the next actions for the user.

## Rules

- Source facts about companies, roles and people with a link. Mark anything inferred as inferred.
- **Always ask before every `git commit` and `git push`.** Summarize what will be committed and wait for the user's yes for that commit. A request that mentions pushing ("do X and push") is a plan, not approval.
- **One commit per logical change.** Before committing, group the changes into logical commits (for example: a script fix, a docs update, a weekly run's results), and show the user the proposed commits, with the files in each and a subject line. If one file holds two unrelated changes, split them with partial staging. The user is practicing this, so briefly explain how you grouped the changes.
- Never send outreach or applications, or submit forms, on the user's behalf. Draft them for review.
- **Keep people's contact info out of git.** The repo is public. Names, titles, profile links and anything else about specific people go in `private/contacts.md` (git-ignored), never in `job_leads.md`, `outreach/` or `weekly_reports/`. Put the resume and other personal files in `private/` too.
- Start resume bullets with strong action verbs.
- Save outreach and follow-up drafts in `outreach/` and weekly reports in `weekly_reports/`, named with the date as described in the workflow. Put other working files (company research, tailored resumes and cover letters) in this folder, one file per subject, in Markdown.
- API keys live only in `.env` (git-ignored, owner-only permissions). `.env.example` lists the variable names with placeholder values: `ANTHROPIC_API_KEY`, `SEARCHAPI_API_KEY`, `SERPAPI_API_KEY`.
- Use a key by loading it from the environment, for example `set -a; source .env; set +a` before a command. Never print, log or echo a key, never put it in a file other than `.env` or in a URL you share, and never commit it. To check a key is set, test that it's non-empty without showing it.
- Save lasting decisions back to the claude.ai project as well as this folder.