# CLAUDE.md

Guide for Claude when working in this folder.

## Project

A personal job-hunt agent (Job Hunt Agent Demo, "Albert's List"). Claude handles the research-heavy, repetitive parts of a networking-based job search so the user can spend more time on conversations with people. The same project exists on claude.ai as "Job Hunt Agent Demo (Albert's List)".

The folder is a public git repository (`jamiehand/job-hunt-agent-demo` on GitHub). It has no code, build system or tests.

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
- Never send outreach or applications, or submit forms, on the user's behalf. Draft them for review.
- Start resume bullets with strong action verbs.
- Save outreach and follow-up drafts in `outreach/` and weekly reports in `weekly_reports/`, named with the date as described in the workflow. Put other working files (company research, tailored resumes and cover letters) in this folder, one file per subject, in Markdown.
- API keys live only in `.env` (git-ignored, owner-only permissions). `.env.example` lists the variable names with placeholder values: `ANTHROPIC_API_KEY`, `SEARCHAPI_API_KEY`, `SERPAPI_API_KEY`.
- Use a key by loading it from the environment, for example `set -a; source .env; set +a` before a command. Never print, log or echo a key, never put it in a file other than `.env` or in a URL you share, and never commit it. To check a key is set, test that it's non-empty without showing it.
- Save lasting decisions back to the claude.ai project as well as this folder.