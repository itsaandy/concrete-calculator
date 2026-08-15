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

## Content and product invariants

- Use Australian English, metric measurements, cubic metres, kilograms, and AUD.
- Preserve trailing-slash routes, root-relative local assets, absolute HTTPS canonicals, `en-AU`/`x-default` hreflang, useful breadcrumbs, and internal links.
- Keep one useful H1, a unique title and description, canonical/OG consistency, valid JSON-LD, and visible FAQ answers that agree with FAQ schema.
- Treat `108` 20 kg bags per m³ and all pricing, yield, dimension, engineering, standards, council, and safety claims as sensitive facts. Verify authoritative current sources before changing them and retain estimator/engineering disclaimers.
- Never fabricate ratings, reviews, credentials, first-hand experience, or schema-only content.

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
