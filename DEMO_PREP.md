# Demo Prep — Research Analyzer

Written 2026-09-02 for a demo on 2026-09-03. Ordered by what actually threatens
the demo. Target: **the app boots and you click through the features.**

## The good news, up front

The whole working tree was audited on 2026-09-02 in a clean `npm ci`
environment. Everything passes:

- `npx tsc --noEmit` → 0 errors
- `npm run build` → succeeds
- `npx vitest run` → 75/75 tests pass
- dev server → app renders fully, **zero console errors**
- "Load Demo Data" → rankings, grades, weight sliders all work

**You are not repairing this app. You are protecting it and polishing it.**

---

## Tonight — must do (about 15 minutes)

### 1. Commit the Feb 5 work. Do this first, before anything else.

Ten files were modified on Feb 5, 2026 and never committed — a complete,
working feature (Medicaid reimbursement scoring + the research-justification
panel). It has been sitting unprotected for seven months.

```bash
cd ~/Desktop/gold_research_assistant/research-analyzer
git status                 # confirm what's dirty
npm run build              # confirm green on your machine too
git add -A
git commit -m "Add Medicaid reimbursement scoring and research justification panel"
git push                   # if the remote still authenticates
```

If `git push` fails on SSH auth, don't chase it tonight — the local commit is
what protects the work.

### 2. Verify it runs on your machine

```bash
npm install     # node_modules is 7 months old
npm run dev
```

Open the app, expand **State Workforce Rankings**, click **Load Demo Data**.
If you see 15 states with letter grades, your demo has a floor under it — that
path needs no database and no API keys.

### 3. Check Supabase before you rely on it

This is the most likely thing to break live. Free-tier Supabase projects get
**paused after inactivity**, and it's been seven months.

Open the Supabase dashboard. If the project is paused, restore it now —
restoring is a click but it is not instant. If it's gone, that's fine for
tomorrow: demo the mock-data path and say persistence is configured separately.

### 4. Decide what you're not showing

Anything key-dependent that you haven't verified tonight, leave collapsed.
Every section is a `CollapsibleSection`, so an unopened section is invisible —
you don't need to delete code to hide a feature.

The one known stale dependency: `services/openai.ts` hardcodes
**`gpt-4-turbo-preview`** in three places. If you plan to demo live paper
analysis or AI connection suggestions, test one call tonight. If it errors on
the model id, either swap it to a current model or skip the AI features
tomorrow.

---

## Tomorrow — the demo path that can't fail

A route with no external dependencies, in the order the UI is laid out:

1. **Open with the framing, not the form.** Scroll past API Configuration.
   The story is: research on one side, legislation on the other, explicit
   evidence-rated links between them, and a defensible score out of that.
2. **State Workforce Rankings → Load Demo Data.** This is the centerpiece.
   Show the grade distribution, then expand a state to show its breakdown.
3. **Open Scoring Weights.** Move a slider — the rankings recalculate live and
   the total stays pinned at 100%. This is the most impressive thing in the app
   and it needs nothing external.
4. **Scoring Justifications.** Explain the idea: a weight isn't a guess, it's
   citable to a paper. (With no papers loaded it shows an empty state, so
   either import one paper first or narrate this one.)
5. Anything live — PubMed search is the safest, since it needs **no API key**.
   That's your one live-data moment if you want one.

Two caveats worth knowing before someone asks:

- Demo data grades cluster in **C/D and top out around B+**, because the mock
  generator draws policy scores from 40–79. It undersells the tool visually. If
  you have 10 spare minutes, widen the range in
  `generateMockStateRankings` (`src/services/stateRankingCalculator.ts`) so the
  full A+–F scale shows.
- **PubMed search needs no key. Open States and NewsAPI do.** The "Discover
  Policies" section will show "Setup Required" until those are set.

---

## If someone wants to use it

The question you'll likely get. Short answer: they can clone and run it, and
the README now describes the tool accurately. Two things stand between that and
a real handoff:

1. **API keys live in browser `localStorage` in plaintext**, and every API call
   goes direct from the browser. That's fine for you running it locally. It is
   not fine for a hosted version or for someone putting an org key into it. A
   server-side proxy is the fix, and it's the one architectural change worth
   doing before anyone else depends on this.
2. **Open States and NewsAPI keys don't persist.** `handleSaveApiKeys` in
   `App.tsx` builds its `ApiKeys` object with only openai/supabase/legiscan, so
   those two are lost on reload unless set in `.env`. Small fix, confusing bug
   for a new user.

And one two-minute fix: **there is no `LICENSE` file.** The README shows an MIT
badge and links to `LICENSE`, but the file was never added — so the link is dead
and the license is technically unstated. Drop in the standard MIT text with your
name and year before you share the repo.

---

## After the demo — the revamp, in priority order

1. **Split `App.tsx`.** 962 lines, 25 `useState` calls, every handler in one
   component. Extract each `CollapsibleSection` into its own component and lift
   the paper/policy/connection flow into a context or reducer. This is the
   change that makes every later change easier.
2. **Split `PolicyDiscovery.tsx`.** 38KB wrapping three different APIs; should
   be one component per source behind a shared shell.
3. **Move the OpenAI model to one constant** and onto a current model.
4. **Add a server-side proxy** for API calls (see above) — the gate on sharing.
5. **Test the newer services.** pubmed, openstates, newsapi and gdelt have no
   tests; the ranking calculator is well covered. MSW is already set up.
6. **Housekeeping:** add generated `vite.config.js`/`.d.ts` to `.gitignore` and
   the ESLint ignore list (they're the only lint errors in the repo), and fill
   in the Medicaid/confidence fields in `createBaselineOnlyRanking` so
   baseline-only states render a full detail card.

See [CLAUDE.md](CLAUDE.md) for the full architecture notes and the complete list
of rough edges.
