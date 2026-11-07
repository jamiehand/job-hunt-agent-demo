# Weekly Job Hunt Workflow

Run these steps in order, once a week. `job_search_profile.md` decides fit; if it conflicts with this file, the profile wins.

**Hard rules:** Don't send, submit or sign in to anything. Link a source for every fact about a company, role or person, and mark what you inferred with _(inferred)_. Never delete leads or the user's notes. If you get stuck, add a question to the report and carry on.

## A. Set up (inputs: profile, leads, run prompt)

1. Set `DATE` to today's date in YYYY-MM-DD format.
2. Read `job_search_profile.md`. Write down:
   - Roles: technical account manager (TAM) and customer success manager (CSM).
   - Must-haves: one of those roles, and fully remote.
   - Industries: sustainability / climate tech, cybersecurity, ethical / responsible AI, healthtech.
   - Location: US remote, working Pacific time hours. Roles that require another region's hours score Medium at most.
   - Unset items: if seniority is unset, include all levels.
3. Read `job_leads.md`. Make a list of the company and role pairs already there, to check for duplicates.
4. Follow the "This week's focus" line in the prompt the user pasted, if it says anything other than "none". If the prompt changes a step in this workflow, the prompt wins for that run.

## B. Follow up on existing leads (output: follow-up drafts)

5. Check every lead whose **OutreachStatus** isn't `Closed`:
   - `Sent` or `Applied`, with the newest **Notes** entry more than 7 days old: draft a follow-up and save it as `outreach/DATE_company_person.md`. Base it only on what's in **Notes**.
   - `Drafted`: remind the user in the report that the draft is waiting for their review.
   - `Replied` or `In conversation`: add the lead to the report so the user can decide the next step.
6. Open the **Link** for each of these leads. If the posting has been taken down, add the note `DATE: Posting taken down` and flag it in the report. Don't close the lead.
7. Flag every lead whose newest **Notes** entry is more than 21 days old as **stale**.

## C. Find new leads (output: candidate postings from find-jobs)

Find leads through `bun run find-jobs` first. It searches Google Jobs with SerpAPI and falls back to SearchAPI. Use Claude's built-in web search only as a backup (step 10).

8. Open the newest `find_jobs_results/YYYY-MM-DD.md` (written every Monday at 8 am). If it's from the last 7 days, use its candidates. If it's missing or older, run `bun run find-jobs` and use the file it writes.
9. find-jobs runs these queries: each target role with each target industry (8 queries), 3 role variants without an industry, and 2 queries for each target company listed in the profile. To change the searches, edit `QUERIES` in `scripts/find-jobs.ts` rather than searching by hand.
10. **Backup:** if find-jobs fails (both providers fail, or the log shows errors), run the same queries as Claude web searches instead. In the report, say that this week's leads came from the backup, and include the error from `logs/find-jobs.log`.
    - Don't re-run find-jobs more than once a week just to retry it, since each full run uses about 11 API searches.
11. Keep postings dated within the last 14 days. Keep undated postings, but mark their date as unknown.
12. Drop any company and role pair that's already in `job_leads.md`.
13. Screen every remaining candidate. If there are more than 40, screen the 40 most recently posted, and note in the report how many you skipped.

## D. Screen and score (output: scored leads, each with a one-line reason)

14. Read each candidate's `description` and `highlights` (Qualifications, Responsibilities) in `find_jobs_results/DATE.json` first. Open the posting link only when the description doesn't settle the checks below, or for leads that score High. Check:
    - **Role:** the responsibilities are post-sale and customer-facing (account ownership, adoption, renewals, technical escalations). If the role is mainly pre-sales, quota-carrying sales or implementation only, it's **Out**.
    - **Remote:** the posting says fully remote. If it requires regular office days or says hybrid, it's **Out**. If it's unclear, note "remote: unclear".
    - **Travel and driving:** note how much travel the posting states, or "not stated". Travel doesn't change the score. If the role requires driving, it scores **Medium at most** (see the profile), and its MatchReason starts with `Driving required:`. Postings marked 🚗 in the find-jobs results mention driving; confirm whether it's actually required.
    - **Coding level** (CSE and other technical roles): from the requirements, note `Coding: config & troubleshooting`, `Coding: APIs & scripting` or `Coding: production code` (**Medium at most**), as the profile describes. Add any languages or tools the posting lists in parentheses, for example `Coding: APIs & scripting (Python, SQL)`.
    - **Sales duties:** note what the posting says about renewals, expansion, quotas or commission (`Sales: ...`). This doesn't change the score (see the profile).
15. Score the leads that pass:
    - **High:** a target role, fully remote, and a target industry.
    - **Medium:** a target role and fully remote, but an adjacent industry, or remote is unclear.
    - **Low:** passes the must-haves, but the role is only a partial match (for example, CSM duties within a support role).
16. For each lead, write: `Fit: <score>: <one-line reason>`. If you judged the industry from the company's website rather than the posting, mark it _(inferred)_.
17. Count the **Out** leads and their reasons for the report. Don't add them to `job_leads.md`.

## E. Research High-fit leads (output: company notes and contacts)

18. For each **High** lead, write 2 to 3 lines about the company: what it does, its size or funding stage, and any news from the last 6 months. Link a source for each line.
19. Find 1 to 3 contacts for each **High** lead, in this order of preference:
    1. The hiring manager, if the posting names them.
    2. Head or director of Customer Success, Support or Technical Account Management.
    3. A current TAM or CSM at the company.
    4. Anyone connected to the networking contacts in the profile.
20. Use only public pages. Record each contact's name, title and source link. Unless the posting names them, mark their role in hiring _(inferred)_.
21. Skip Medium and Low leads unless this week's focus asks for them.

## F. Draft outreach (output: `outreach/DATE_company_person.md` files)

22. For each contact from step 19, create `outreach/DATE_company_person.md` with:
    - **Header:** the contact's name, title and source link, the related lead, and the suggested channel (LinkedIn or email).
    - **Message:** under 120 words. Ask for a 15-minute conversation, not a job. Mention one sourced detail about the person or company and one strength from the profile.
    - `[placeholders]` for anything you don't know, such as how the user knows a mutual connection.
23. Don't send anything.

## G. Update job_leads.md (output: updated leads file)

24. Add one row to the table for each new High, Medium or Low lead:
    - **Source:** where you found it (job board name, company careers page, or search).
    - **Role**, **Company**, **Location**, **Link:** taken from the posting.
    - **MatchReason:** `<score>: <one-line reason>` from step 16.
    - **Notes:** `DATE: Added by weekly run`, then `Travel: <amount or not stated>` and `Sales: <what the posting says, or none stated>`. For High leads with contacts, add `Contacts: see private/contacts.md`.
    - **Questions to ask (High and Medium leads):** when the posting doesn't say something the profile cares about, add `Ask: <question>; <question>` with up to 3 short questions, most important first. Pick from: Pacific hours or fully remote (if unclear), sales targets or commission, travel, driving, and coding level (CSE and TAM roles). Skip anything the posting already answers. If the role has sales duties, include a question for current employees about what they're like, for example "Ask a current employee: what are the sales targets like day to day, and do you ever feel pressure to sell?"
    - Write the contacts themselves (name, title, source link) in `private/contacts.md`, under a `## Company: Role` heading. Never put a person's name in `job_leads.md`, `outreach/` or `weekly_reports/`: those files are committed to a public repo. Outreach drafts use `[name]` and a job title.
    - **OutreachStatus:** `Drafted` if you wrote outreach in step 22, otherwise `Not started`.
25. For each existing lead you touched, add a dated entry at the front of **Notes**, for example `DATE: Follow-up drafted`. Separate entries with `<br>`.
26. Set **OutreachStatus** to `Drafted` when you save a draft. Set `Sent`, `Replied`, `In conversation` or `Applied` only when the user confirms it. Never set `Closed` yourself.
27. Keep every row on one line, and replace any `|` inside a cell with `/`, so the table doesn't break.

## H. Report (output: `weekly_reports/DATE.md` and a summary in chat)

28. Write `weekly_reports/DATE.md` with these sections:
    1. **Summary:** postings reviewed, leads added (High, Medium and Low counts), Out leads and their top reasons.
    2. **New High-fit leads:** company, role, a one-line reason, and the link.
    3. **Existing leads:** status changes, postings taken down, stale leads.
    - **Capped for driving:** each lead scored Medium because it requires driving, with the reason, so the user can override it if transit or rideshare would work.
    4. **Drafts to review:** the file paths of this run's files in `outreach/`.
    5. **Top 3 actions this week:** specific, ordered by priority.
    6. **Questions for you:** missing profile items, unclear postings, decisions needed.
29. Post the same report in chat.

## Done when

- [ ] `job_leads.md` is updated, and no lead is listed twice.
- [ ] Every High lead has contacts and an outreach draft.
- [ ] `weekly_reports/DATE.md` exists and has all six sections.
- [ ] Nothing was sent, submitted or signed in to.
