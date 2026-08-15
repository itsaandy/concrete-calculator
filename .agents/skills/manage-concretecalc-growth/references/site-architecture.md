# ConcreteCalc architecture and invariants

## Static site

- Production domain: `https://concretecalc.com.au`
- Deployment: GitHub Pages from `main`; no build step or dependency manifest.
- Shared logic: `js/calculators.js` and `js/ui.js`.
- Shared presentation: `css/styles.css`.
- Core pages: homepage plus slab, post-hole, footing, column, circular-slab, and bags-vs-ready-mix tools.
- Long-tail definitions: `scripts/long-tail-data.json`.
- Long-tail renderer: `scripts/generate-long-tail.js`.

## Generator hazard

Generated HTML has received manual SEO edits after generation. The renderer is therefore not automatically the current source of truth. Running it can overwrite good copy and stamp every sitemap URL with today's date.

When changing generated pages:

1. Identify whether the page is represented in `long-tail-data.json`.
2. Preserve the current page's intentional metadata, copy, schema, and links in the data/template or explain why the output should change.
3. Generate only in an isolated worktree or snapshot when practical.
4. Review every generated HTML and sitemap diff before accepting it.
5. Revert unrelated regeneration churn; never present it as fresh content.

## SEO contract

- Use `lang="en-AU"`, Australian English, metric units, and AUD.
- Use trailing-slash public routes and absolute `https://concretecalc.com.au/...` canonicals.
- Keep canonical, Open Graph URL, hreflang, sitemap, breadcrumbs, navigation, and internal links consistent.
- Keep one H1, useful unique titles/descriptions, valid JSON-LD, and matching visible/schema FAQ content.
- Preserve GA4 `G-XNWWCK3HP0` and AdSense `ca-pub-2538773959178920` unless explicitly asked to migrate them.

## Calculation contract

The browser calculators are the product. Validate formulas and rounding whenever touching logic. `108` 20 kg bags per cubic metre is a central current assumption, but yields and costs can vary. Keep the visible explanation, calculator code, generator, and disclaimers consistent. Structural dimensions and construction advice must not be presented as engineered approval.
