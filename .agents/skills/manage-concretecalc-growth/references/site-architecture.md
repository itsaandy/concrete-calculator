# ConcreteCalc architecture and invariants

## Static site

- Production domain: `https://concretecalc.com.au`
- Deployment: GitHub Pages from `main`; no build step or dependency manifest.
- Shared logic: `js/calculators.js` and `js/ui.js`.
- Shared presentation: `css/styles.css`.
- Core pages: homepage plus slab, post-hole, footing, column, circular-slab, and bags-vs-ready-mix tools.
- Legacy redirect map: `scripts/long-tail-data.json`.
- Redirect generator: `scripts/generate-long-tail.js`; `--check` validates exact output without writing.
- Planner: `js/project-planner.js`; shared transfer encoding in `js/ui.js`. Post-hole rows reuse the existing post-hole formula with zero item allowance. Apply allowance once to the project.

## Legacy routes

The 28 former worked examples are now instant HTML redirects to relevant tools. GitHub Pages cannot configure HTTP 301 rules; Google treats zero-delay meta refresh as permanent. Keep fallback links and destination canonicals, omit all scripts and tags, and exclude these routes from the sitemap. The generator cannot restore articles or change sitemap dates. Review every mapping change for relevance and avoid redirect chains.

## SEO contract

- Use `lang="en-AU"`, Australian English, metric units, and AUD.
- Use trailing-slash public routes and absolute `https://concretecalc.com.au/...` canonicals.
- Keep canonical, Open Graph URL, hreflang, sitemap, breadcrumbs, navigation, and internal links consistent.
- Keep one H1, useful unique titles/descriptions, valid JSON-LD, and matching visible/schema FAQ content.
- Preserve GA4 `G-XNWWCK3HP0` and AdSense `ca-pub-2538773959178920` unless explicitly asked to migrate them.

## Calculation contract

The browser calculators are the product. Validate formulas and rounding whenever touching logic. `108` 20 kg bags per cubic metre is a central current assumption, but yields and costs can vary. Keep the visible explanation, calculator code, generator, and disclaimers consistent. Structural dimensions and construction advice must not be presented as engineered approval.

The five dimension-calculator pages use illustrative input buttons, not project design recommendations. Labels must expose all dimensions that `PRESETS` fills, and adjacent guidance must explain preserved settings or an explicit shape switch. Preserve legacy preset keys for compatibility. `node scripts/test-example-presets.js` checks the visible labels against stored dimensions; browser tests must also check actual field updates and results.
