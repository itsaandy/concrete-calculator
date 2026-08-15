---
name: manage-concretecalc-growth
description: Monitor and improve ConcreteCalc using its live Google Search Console and Google Analytics data, then make, validate, commit, and push evidence-led SEO, content, calculator UX, accessibility, metadata, structured-data, sitemap, and internal-link changes. Use for ConcreteCalc traffic reviews, ranking or CTR investigations, indexing checks, recurring SEO runs, new landing-page decisions, and autonomous growth work in the concrete-calculator repository.
---

# Manage ConcreteCalc growth

Run a closed-loop workflow: measure, choose one material opportunity, implement the smallest sound improvement, validate the whole static site, and ship directly to `main` when clean.

## Load context

1. Read [references/data-access.md](references/data-access.md) before querying Search Console or Analytics.
2. Read [references/site-architecture.md](references/site-architecture.md) before editing HTML, JavaScript, the generator, or the sitemap.
3. Read the repository `AGENTS.md` and honor any user changes already in the worktree.

## Select the operating mode

- **Monitor:** Query data, compare periods, inspect meaningful changes, and report. Do not edit the repository.
- **Optimize:** Query data first, implement justified changes, validate, commit, and push.
- **Diagnose:** Investigate a reported ranking, indexing, analytics, or calculator problem. Do not implement unless the request includes a fix.

## Measure before changing

1. Use finalized GSC data ending three days before the run unless the API shows a longer delay.
2. Compare the latest 28 complete days with the preceding 28 days and use 90 days for context. Compare like-for-like search type, country, and device slices.
3. Review query, page, query+page, device, and country dimensions. Inspect sitemaps and representative priority URLs when indexing is relevant.
4. Review Analytics landing pages, acquisition channels, users, sessions, engagement, and key events over equivalent periods.
5. Separate signal from noise. Prefer opportunities with meaningful impressions or users and a coherent search intent. Treat low-volume changes as hypotheses, not conclusions.

## Prioritize work

Favor, in order:

1. Broken indexing, canonical, sitemap, structured-data, calculator, mobile, or accessibility behavior.
2. High-impression pages ranking roughly 2–15 with weak CTR for their position and a clearly better snippet or intent match.
3. Queries already associated with a page that can be answered more directly without cannibalizing a stronger page.
4. Internal-link gaps and calculator usability problems supported by search and engagement data.
5. New pages only when demand, intent, and distinct user value are clear.

Avoid mass page creation, near-duplicates, keyword stuffing, cosmetic date changes, fabricated expertise, and broad rewrites unsupported by data. Normally allow 28 days before retuning a recently changed page.

## Implement safely

- Preserve Australian English, metric/AUD conventions, formulas, URL structure, tracking, and disclaimers.
- Make answer-first copy useful to a human performing a calculation.
- Keep visible FAQ content and FAQ JSON-LD aligned.
- Update generator inputs and outputs together. Never run the generator until its prospective diff is isolated and reviewed; it can overwrite manual SEO work and over-stamp sitemap dates.
- Update only the `lastmod` entries for materially changed pages.
- Verify current authoritative sources before changing construction, pricing, yield, standards, regulatory, or safety claims.

## Validate and ship

1. Run `python3 .agents/skills/manage-concretecalc-growth/scripts/validate_site.py`.
2. Run the JavaScript syntax and `git diff --check` commands in `AGENTS.md`.
3. Serve locally over HTTP and test changed calculator paths on desktop and mobile, including valid and invalid inputs and console errors.
4. Review the complete diff. If checks pass, commit and push directly to `main`; this repository is explicitly authorized for autonomous direct-to-main operation.
5. If evidence supports no change, report a no-op. If validation or conflict resolution is uncertain, do not push.

Report the comparison windows, evidence, reasoning, modified pages, validation results, and commit hash.
