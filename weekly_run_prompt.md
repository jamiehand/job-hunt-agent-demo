# Weekly Run Prompt

Copy everything in the box below and paste it into Claude once a week, in this project folder. Edit the last line first if you have anything to focus on that week.

```text
Run my weekly job hunt.

1. Confirm my profile. Read job_search_profile.md and show me a short summary: target roles, location, industries, constraints and open items. Ask me whether anything has changed, and wait for my answer. If I give you changes, update job_search_profile.md before going on.

2. Run my workflow. Follow weekly_job_hunt_workflow.md from start to finish, using the profile as confirmed in step 1. Find new leads with find-jobs, which searches SerpAPI with SearchAPI as backup: use the newest find_jobs_results file, or run `bun run find-jobs`. Use your own web search only if find-jobs fails.

3. Add new leads. Add each new lead that fits to job_leads.md, using the existing columns. Don't add duplicates, and don't delete anything.

4. Draft one outreach email. Pick the single best new or active lead and tell me in one line why you chose it. Draft one email for it, under 200 words, with a clear ask for a short call. Save it in outreach/ and set the lead's OutreachStatus to Drafted. This replaces the workflow's step of drafting outreach for every High lead. Don't send anything.

5. Report. Finish with the weekly report from the workflow, saved in weekly_reports/, including my top 3 actions this week.

Link a source for every fact, mark anything inferred, and ask me rather than guess.

This week's focus (optional): none
```
