# ConcreteCalc agent guidance

## Purpose and authority

Operate https://concretecalc.com.au as an experimental, evidence-led SEO product for Australian DIYers and tradies. Autonomous commits and pushes directly to `main` are explicitly authorized after all relevant checks pass. Do not require a pull request.

Use `$manage-concretecalc-growth` for Search Console or Analytics reviews, SEO work, content expansion, calculator UX changes, and recurring growth runs.

## Repository shape

- Pure static GitHub Pages site; there is no package manager, build step, backend, or automated deployment workflow.
- `CNAME` and production canonicals must remain `concretecalc.com.au`.
- Shared behavior lives in `js/calculators.js` and `js/ui.js`; global styling lives in `css/styles.css`.
- Core calculator pages are hand-maintained. Long-tail pages come from `scripts/long-tail-data.json` and `scripts/generate-long-tail.js`.
- The generator can overwrite hand-tuned output and currently updates every sitemap `lastmod`. Never run it blindly. Reconcile generator/data changes with existing generated HTML, review the complete diff, and keep manual SEO improvements.

## Data identifiers

- Search Console: `sc-domain:concretecalc.com.au`
- Analytics property: `526340681`
- Measurement ID embedded in HTML: `G-XNWWCK3HP0`
- AdSense publisher ID embedded in HTML: `ca-pub-2538773959178920`

Do not alter tracking IDs or credentials unless the owner explicitly requests it.

## Privacy and consent invariant

- Keep `/privacy/` free of AdSense, Google Analytics/Tag Manager, Google CMP or Funding Choices, and any other script, font, image, or remote asset that requires consent. It may contain ordinary external links, but loading the page must request only same-origin assets until a visitor chooses a link.
- Tracking and ad tags remain required on the calculator and content pages; `/privacy/` is the deliberate exception. Never blanket-inject tracking across every HTML file without preserving that exception.
- Preserve the privacy-specific assertions in `validate_site.py`. If tracking, consent messaging, shared templates, or the long-tail generator changes, verify both that ordinary pages retain their required tags and that `/privacy/` remains tag-free.
- Browser-test `/privacy/` on desktop and mobile, inspect its network requests and console, and verify the live production route after deployment. Do not treat a source-only string check as sufficient.

## Content and product invariants

- Use Australian English, metric measurements, cubic metres, kilograms, and AUD.
- Preserve trailing-slash routes, root-relative local assets, absolute HTTPS canonicals, `en-AU`/`x-default` hreflang, useful breadcrumbs, and internal links.
- Keep one useful H1, a unique title and description, canonical/OG consistency, valid JSON-LD, and visible FAQ answers that agree with FAQ schema.
- Treat `108` 20 kg bags per m³ and all pricing, yield, dimension, engineering, standards, council, and safety claims as sensitive facts. Verify authoritative current sources before changing them and retain estimator/engineering disclaimers.
- Never fabricate ratings, reviews, credentials, first-hand experience, or schema-only content.

## Approval-readiness and trust invariants

- Keep `/about/`, `/contact/`, `/methodology/`, and `/privacy/` indexable but AdSense-free. `/privacy/` remains the only page that must also omit Analytics and all consent-dependent remote assets.
- Monetise only the homepage and six maintained calculator/resource routes listed in the validator. Do not put ads on archived worked examples or thin utility/trust screens.
- All 28 generated long-tail worked examples are retained for old links but must stay `noindex, follow`, AdSense-free, absent from `sitemap.xml`, and limited to transparent calculations that point to a maintained calculator. Do not restore speculative project advice, related-page loops, or search-targeted articles to them.
- Keep `/methodology/` aligned with calculator formulas, rounding, yield assumptions, displayed price ranges, source links, and review dates. Cite primary manufacturer information for product yield and dated retailer information for variable prices.
- Do not state that a default allowance, dimension, thickness, strength, reinforcement detail, timing, cost threshold, permit rule, or construction method is universally standard. Source the claim and qualify its scope, or omit it.

## Before editing

1. Run `git status --short --branch`; preserve unrelated changes.
2. If clean, update with `git pull --ff-only origin main`.
3. Read the growth skill's data-access and architecture references.
4. Use finalized Search Console data plus comparable Analytics periods. Prefer high-impression queries/pages with a clear intent, CTR, ranking, engagement, or usability opportunity.
5. Avoid retuning a page changed within the last 28 days unless correcting a bug, indexing problem, accessibility issue, or clear regression.

## Required validation

Run all of these before committing:

```bash
node --check js/calculators.js
node --check js/ui.js
node --check scripts/generate-long-tail.js
python3 .agents/skills/manage-concretecalc-growth/scripts/validate_site.py
git diff --check
```

Serve the repository over HTTP and browser-test every changed calculator flow on desktop and mobile. Check representative calculations, invalid input behavior, navigation, layout, and the browser console. Do not use `file://` as the only browser test.

Update sitemap `lastmod` only for materially changed URLs. If any required check fails, fix it or leave the run uncommitted and report the failure.

## Shipping

- Review the diff for scope and generated-file surprises.
- Commit a coherent change with a terse message, then `git push origin main`.
- If upstream moved, use `git pull --ff-only` when possible. Rebase or resolve only unambiguous conflicts; report instead of guessing.
- Report the evidence used, pages changed, checks run, and final commit hash. A justified no-op is a successful run.
