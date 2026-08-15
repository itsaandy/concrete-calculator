# ConcreteCalc data access

## Search Console

The machine has a read-only helper for the official Search Console API:

```bash
/root/.local/bin/gsc-direct sites
/root/.local/bin/gsc-direct performance --site sc-domain:concretecalc.com.au --start YYYY-MM-DD --end YYYY-MM-DD --dimensions query,page --data-state final --limit 25000
/root/.local/bin/gsc-direct performance --site sc-domain:concretecalc.com.au --start YYYY-MM-DD --end YYYY-MM-DD --dimensions device --data-state final
/root/.local/bin/gsc-direct performance --site sc-domain:concretecalc.com.au --start YYYY-MM-DD --end YYYY-MM-DD --dimensions country --data-state final
/root/.local/bin/gsc-direct sitemaps --site sc-domain:concretecalc.com.au
/root/.local/bin/gsc-direct inspect --site sc-domain:concretecalc.com.au --url https://concretecalc.com.au/URL/
```

Use an end date three days before the run unless data freshness indicates otherwise. Pull totals plus query, page, query+page, device, and country views. Compare the latest 28 complete days with the previous 28 and retain a 90-day view for context.

## Google Analytics

- MCP server: `google-analytics`
- GA4 property: `526340681`
- Display name: `concretecalc.com.au`
- Measurement ID in the site: `G-XNWWCK3HP0`

Use the Analytics account-summary tool to confirm the mapping if it ever differs. Useful standard reports include:

- `landingPagePlusQueryString` with `sessions`, `totalUsers`, `engagedSessions`, `engagementRate`, `averageSessionDuration`, and `keyEvents`.
- `sessionDefaultChannelGroup` with `sessions`, `totalUsers`, `engagedSessions`, and `keyEvents`.
- `pagePath` with `screenPageViews`, `totalUsers`, and `userEngagementDuration`.

Use two named date ranges in the same report where practical. Do not infer search-query performance from Analytics; join the two sources conceptually at the landing-page level.

## Decision standard

- Record exact date ranges and whether GSC rows are final.
- Compare absolute counts and rates; do not optimize from percentage swings on tiny denominators.
- Look for agreement across query intent, page performance, and on-site engagement.
- Treat position as an average distribution, not a literal rank.
- Do not output, copy, modify, or commit any credential or token material.
