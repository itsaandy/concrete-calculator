# Australian Concrete & Construction Calculator Website — Project Spec

## Project Overview

Build a static, frontend-only website targeting Australian DIYers and tradies who need to calculate how much concrete (and other building materials) they need for their projects. The site uses **metric measurements only** (metres, millimetres, m³, kg), calculates volume, number of 20kg bags, and estimated cost in AUD. No backend required — pure HTML/CSS/JS.

**Target audience:** Australian homeowners doing DIY projects (shed slabs, fence posts, driveways, patios) and small tradies quoting jobs.

**Domain:** Should be a `.com.au` domain. Ideal names: `concretecalc.com.au`, `buildcalculator.com.au`, `aussieconcrete.com.au`, or similar.

---

## Site Architecture

```
/ (homepage — primary concrete slab calculator + intro)
/concrete-slab-calculator
/post-hole-calculator
/footing-calculator
/column-calculator
/circular-slab-calculator
/bags-vs-readymix (comparison tool)
/blog/ (SEO content articles — Phase 2)
```

Each calculator page is a standalone tool with its own SEO-optimised content below the calculator.

---

## Calculators to Implement (Priority Order)

### CALCULATOR 1: Rectangular Slab Calculator (Highest Priority)
**URL:** `/concrete-slab-calculator` (also embedded on homepage)
**What it calculates:** Concrete volume for flat rectangular pours — shed bases, driveways, patios, paths, garage floors.

**User inputs:**
- Length (metres, allow mm input with conversion)
- Width (metres, allow mm input with conversion)
- Depth/Thickness (millimetres — this is how Australians think about slab thickness)
- Wastage factor (default 10%, adjustable slider 5-15%)

**Outputs to display:**
- Volume in m³ (cubic metres)
- Number of 20kg bags needed
- Number of 10kg bags needed (alternative)
- Estimated cost — bagged concrete (using bags × price per bag)
- Estimated cost — ready-mix delivery (using m³ × price per m³)
- Full calculation breakdown shown transparently (e.g. "3m × 4m × 0.1m = 1.2 m³")

**Core formula:**
```
Volume (m³) = Length (m) × Width (m) × (Depth in mm ÷ 1000)
Volume with wastage = Volume × (1 + wastage%)
Bags (20kg) = Volume × bags_per_m3
```

**Key conversion constants:**
- **108 bags of 20kg concrete mix per m³** — This is the Boral-recommended figure, cited by Canterbury Timbers (canterburytimbers.com.au/pages/concrete-calculator) and is the industry standard used across Australian suppliers.
- **Alternative: 110 bags per m³** — Used by Ultimate Backyard (ultimatebackyard.com.au/concrete-per-m3/) based on Dingo brand concrete. They note "Australian Builders 20kg = 100 bags/m³, Dingo Fast Set = 110 bags/m³" and recommend erring on the side of 110.
- **RECOMMENDATION:** Default to 108 (Boral standard) but mention the 100-110 range varies by brand. Add a dropdown for users to select their brand if desired.
- **Yield per 20kg bag:** approximately 0.009–0.0093 m³ per bag (source: bag labelling from Boral, Cement Australia)

**Australian recommended slab thicknesses** (display as helper text / presets):
- Paths/walkways: 75–100mm
- Patios: 100mm
- Shed slabs: 100mm
- Driveways (residential): 100–125mm
- Heavy duty / garage floors: 150mm+
- Source: concreterfinder.com/prices/ and general Australian building standards

**Pricing data (display as estimates with date stamp "Prices as of 2025"):**
- 20kg bag (Bunnings): approximately $8.50–$12.50 per bag depending on brand
  - Australian Builders 20kg Concrete Mix (Bunnings SKU): ~$8.98
  - Boral Blue Circle 20kg: ~$9.50
  - Dingo 20kg Fast Set: ~$10.50–$12.50
  - Source: bunnings.com.au product listings
- Ready-mix concrete delivered: $200–$420 per m³ depending on mix strength, location, and minimum order
  - Source: concreterfinder.com/prices/ ("In 2025, concrete costs in Australia range from $280–$420 per cubic metre")
  - Source: concretetaxi.com.au (provides live quotes by suburb)
- **Note:** Display these as ranges, not exact prices. Add disclaimer "Prices are estimates. Contact your local supplier for exact quotes."

---

### CALCULATOR 2: Post Hole / Fence Post Calculator (High Priority)
**URL:** `/post-hole-calculator`
**What it calculates:** Concrete needed to set fence posts, letterbox posts, or any post in a hole.

**User inputs:**
- Post shape: Round or Square (radio toggle)
- If round: Post diameter (mm)
- If square: Post width (mm) × Post depth (mm)
- Hole diameter (mm)
- Hole depth (mm)
- Number of posts
- Wastage factor (default 10%)

**Outputs to display:**
- Volume per hole (m³)
- Total volume for all holes (m³)
- Number of 20kg bags per hole
- Total number of 20kg bags
- Estimated total cost (bagged)
- Calculation breakdown shown

**Core formulas:**

For round post in round hole:
```
Volume per hole (m³) = π × Depth(m) × (HoleRadius(m)² − PostRadius(m)²)
```

For square post in round hole:
```
Volume per hole (m³) = (π × HoleRadius(m)² × Depth(m)) − (PostWidth(m) × PostDepth(m) × Depth(m))
```

Then:
```
Total volume = Volume per hole × Number of posts × (1 + wastage%)
Bags = Total volume × 108
```

**Source for formulas:** Canterbury Timbers concrete calculator page (canterburytimbers.com.au/pages/concrete-calculator) explicitly shows both formulas. Also confirmed by Easy Mix Concrete (easymixconcrete.com.au/concrete-calculator) and Cement Australia (cementaustralia.com.au/calculators/posts).

**Australian fence post defaults / helper presets:**
- Standard timber fence post: 90×90mm or 100×100mm
- Steel fence post: 65×65mm (commonly discussed on Whirlpool forums)
- Standard hole diameter: 200mm
- Standard hole depth: 600–700mm (one-third of above-ground height)
- Source: Bunnings DIY advice, Whirlpool forum thread (forums.whirlpool.net.au/archive/3rvj4z7n) where users discuss using Cement Australia's calculator with these exact dimensions

**Important note for accuracy:** The Whirlpool discussion reveals a common user confusion — people calculate per-post and round up each time, when they should calculate total volume across all posts and round up once. Our calculator should handle this correctly and explain it.

---

### CALCULATOR 3: Footing / Strip Footing Calculator (High Priority)
**URL:** `/footing-calculator`
**What it calculates:** Concrete for strip footings (under walls, retaining walls, shed edges, house foundations).

**User inputs:**
- Length (metres)
- Width (millimetres)
- Depth (millimetres)
- Number of footings (default 1)
- Wastage factor (default 10%)

**Outputs:** Same format as slab calculator (m³, bags, cost, breakdown).

**Core formula:**
```
Volume (m³) = Length(m) × (Width in mm ÷ 1000) × (Depth in mm ÷ 1000)
Total = Volume × Number of footings × (1 + wastage%)
Bags = Total × 108
```

**Source:** This is the same rectangular volume formula used universally. Confirmed across Concrete Network (concretenetwork.com), CalculatorSoup (calculatorsoup.com), and every AU supplier calculator.

**Australian footing size guidelines (display as helper text):**
- Residential shed footing: 300mm wide × 300mm deep (typical)
- Retaining wall footing: 350–450mm wide × 200–300mm deep
- House strip footing: 450–600mm wide × 300mm+ deep (depends on soil classification — refer to engineer)
- Source: General Australian residential building standards (AS 2870). Note: always recommend consulting an engineer for structural footings.

---

### CALCULATOR 4: Column / Pier Calculator (Medium Priority)
**URL:** `/column-calculator`
**What it calculates:** Concrete for round or square columns/piers — deck piers, pergola footings, verandah stumps.

**User inputs:**
- Column shape: Round or Square (radio toggle)
- If round: Diameter (mm)
- If square: Width (mm) × Depth (mm)
- Height (mm)
- Number of columns
- Wastage factor (default 10%)

**Outputs:** Same format (m³, bags, cost, breakdown).

**Core formulas:**

Round column:
```
Volume (m³) = π × (Diameter/2 in m)² × Height(m)
```

Square column:
```
Volume (m³) = Width(m) × Depth(m) × Height(m)
```

Then multiply by number of columns and wastage.

**Source:** Standard geometry. Confirmed by Easy Mix Concrete AU (easymixconcrete.com.au/concrete-calculator) which has specific "Pier" calculator inputs for pier length, width, thickness, and number of posts. Also confirmed by CalculatorSoup, Concrete Network, and InchCalculator.

---

### CALCULATOR 5: Circular Slab Calculator (Medium Priority)
**URL:** `/circular-slab-calculator`
**What it calculates:** Concrete for round slabs — fire pit bases, circular patios, round pads.

**User inputs:**
- Diameter (metres or mm with toggle)
- Thickness (mm)
- Wastage factor (default 10%)

**Outputs:** Same format.

**Core formula:**
```
Volume (m³) = π × (Diameter/2 in m)² × (Thickness in mm ÷ 1000)
```

**Source:** Standard geometry. Present on calculator.net, CalculatorSoup, InvoiceFly, 360Civil Engineering, and Chippy Tools.

---

### CALCULATOR 6: Bags vs Ready-Mix Comparison Tool (High Value Differentiator)
**URL:** `/bags-vs-readymix`
**What it does:** Takes a volume (m³) — either entered manually or piped from any other calculator — and shows a side-by-side comparison of bagged vs ready-mix concrete including cost, effort, and time.

**This is the killer differentiator.** Bunnings Workshop forum threads repeatedly show Australians shocked at bag counts (e.g., "100-150 bags for a 3×3 shed slab?! That's $1,000-$1,400 just in bags!"). No existing AU calculator does this comparison well.

**User inputs:**
- Volume needed (m³) — or link from another calculator
- Postcode or state (to refine ready-mix pricing by region)

**Outputs (side by side comparison table):**
| | Bagged (DIY) | Ready-Mix Delivered |
|---|---|---|
| Volume | X m³ | X m³ |
| Quantity | X × 20kg bags | X m³ order |
| Material cost | $X (@ $9-12/bag) | $X (@ $280-420/m³) |
| Mixing time estimate | ~X hours | Arrives ready |
| Equipment needed | Mixer hire ~$70/day, wheelbarrow, etc. | Pump hire if needed ~$200-600 |
| Physical effort | Very high | Low-medium |
| Best for | Under 0.5 m³ (~54 bags) | Over 0.8 m³ (~86 bags) |
| Minimum order | 1 bag | Usually 0.5–1 m³ minimum |

**Breakeven guidance:**
- Under ~0.3 m³ (32 bags): Bags are cheaper and practical
- 0.3–0.8 m³ (32–86 bags): Toss-up, depends on access and helpers
- Over 0.8 m³ (86+ bags): Ready-mix almost always wins on cost and effort
- Source: This breakeven analysis is derived from Bunnings forum discussions where users consistently find that beyond ~60-80 bags, the labour of mixing by hand becomes impractical for a solo DIYer. Bunnings Workshop thread (workshop.bunnings.com.au — "How to build a concrete slab for shed") explicitly discusses this: "A 3x3 slab is 0.9 cubic metres and would require 90 bags and a 4x4 slab is 1.6 cubic metres and would require 160."

**Ready-mix pricing by state (estimates, display with disclaimer):**
- Sydney/NSW: $300–$420/m³
- Melbourne/VIC: $280–$400/m³
- Brisbane/QLD: $280–$380/m³
- Perth/WA: $290–$400/m³
- Adelaide/SA: $270–$370/m³
- Source: Aggregated from concreterfinder.com/prices/, concretetaxi.com.au, and supplier price lists. These are approximate ranges and should be presented as estimates.

---

## Accuracy Validation Approach

### Primary Sources for Calculation Constants
1. **Boral Australia** — 108 bags per m³ for 20kg concrete mix. This is THE industry standard figure in Australia. Cited by Canterbury Timbers, referenced across Bunnings forums.
2. **Cement Australia** — Their online calculators (cementaustralia.com.au/calculators/) serve as a cross-reference for post hole calculations.
3. **Ultimate Backyard AU** (ultimatebackyard.com.au/concrete-per-m3/) — Independent Australian source confirming 100–110 bags per m³ depending on brand, recommending 110 as a safe figure.
4. **Canterbury Timbers** (canterburytimbers.com.au/pages/concrete-calculator) — Best existing AU calculator. Their formulas and bag counts serve as a validation benchmark.

### How to Validate Our Calculators Are Correct
Before launch, every calculator should be cross-checked:
- Input the same dimensions into Canterbury Timbers' calculator and confirm matching output
- Input the same dimensions into Cement Australia's calculator and confirm matching output
- Input the same dimensions into calculator.net (converting to metric) and confirm matching volume

### Display Transparency for User Trust
Every calculation result should show:
1. The formula used (e.g., "Volume = 3m × 4m × 0.1m = 1.2 m³")
2. The bags conversion (e.g., "1.2 m³ × 108 bags/m³ = 130 bags")
3. The wastage addition (e.g., "+10% wastage = 143 bags")
4. Source attribution: "Bag yield based on Boral's recommended 108 bags per cubic metre for 20kg concrete mix"
5. Standard disclaimer: "This calculator provides estimates. Always confirm quantities with your concrete supplier before ordering."

---

## Design & UX Requirements

### General Principles
- **Mobile-first.** Most people will use this on their phone at Bunnings or on the job site.
- **Fast.** Calculations happen instantly on input change (no "Calculate" button needed, or at least both approaches work). No loading, no spinners, no backend calls.
- **Clean, professional.** Look at InchCalculator.com for design inspiration — clean, tool-first, content below. Avoid looking like a generic template site.
- **Australian.** Use Australian English spelling (metres not meters, colour not color, aluminium not aluminum). Reference Bunnings, not Home Depot.

### Layout per Calculator Page
1. **Calculator tool at the top** — immediately usable without scrolling
2. **Results panel** — appears/updates below or beside the inputs
3. **Calculation breakdown** — expandable section showing the maths
4. **Quick reference section** — common Australian dimensions/thicknesses as preset buttons (e.g., "Typical shed slab: 3m × 3m × 100mm" — click to auto-fill)
5. **SEO content below** — 800-1500 words of genuinely useful how-to content (this is where we win on SEO)
6. **FAQ section** — structured data (FAQ schema) for Google rich results
7. **Related calculators** — cross-links to other calculators on the site

### Colour Scheme & Branding
- Use construction/trade-appropriate colours: think concrete grey, safety yellow/orange accents, dark navy text
- Clean sans-serif typography (Inter, DM Sans, or similar)
- No stock photos of concrete trucks. Use clean illustrations or just keep it tool-focused.

### Input UX Details
- Allow users to type in either metres or millimetres and toggle between them
- Use sensible defaults (e.g., depth defaults to 100mm for slabs)
- Show a simple visual diagram of what's being calculated (a labelled rectangle for slab, a labelled circle-in-circle for post hole, etc.)
- Number inputs should have increment/decrement buttons for mobile
- Results should update in real-time as inputs change

---

## SEO Content Requirements (Phase 2 — After Calculators Are Built)

Each calculator page should have substantial SEO content below the tool. Key articles to write:

1. **"How Much Concrete Do I Need for a Shed Slab? (Australian Guide)"** — target: "concrete for shed slab Australia"
2. **"Concrete Driveway Cost Australia 2025 — Complete Guide"** — target: "concrete driveway cost Australia"
3. **"How Many 20kg Bags of Concrete Per Cubic Metre?"** — target: "bags of concrete per m3" (Ultimate Backyard ranks for this)
4. **"DIY Concrete Slab Guide Australia — Step by Step"** — target: "how to pour a concrete slab"
5. **"Concrete for Fence Posts — How Many Bags Per Post?"** — target: "concrete for fence posts Australia"
6. **"Ready-Mix vs Bagged Concrete — Which Is Cheaper?"** — target: "ready mix vs bags concrete Australia"

### Structured Data (JSON-LD) to Add
- **FAQPage schema** on every calculator page
- **HowTo schema** on guide articles
- **WebApplication schema** on calculator pages
- **BreadcrumbList schema** site-wide

---

## Technical Requirements

### Stack
- **Static site** — HTML, CSS, vanilla JavaScript. No framework required, but a lightweight one (Astro, 11ty, or even just plain HTML files) is fine.
- **No backend.** All calculations run client-side in JavaScript.
- **Hosted on a CDN** — Cloudflare Pages, Netlify, or Vercel. All free tier.
- **Domain:** `.com.au` TLD (important for Australian geo-targeting in Google)

### Performance
- Target Lighthouse score: 95+ on all metrics
- No unnecessary JS libraries. The maths is simple arithmetic — don't import a library for it.
- Minimal CSS — use a utility framework like Tailwind if desired, but keep it lean.
- All assets optimised (compress SVGs, lazy-load below-fold images if any)

### Ad Placement Preparation
- Leave clearly marked placeholder `<div>` containers for ad placements:
  - One leaderboard (728×90) above the calculator
  - One medium rectangle (300×250) in the results sidebar on desktop / below results on mobile
  - One in-content ad slot within the SEO article section
  - One anchor/sticky ad at bottom of mobile viewport
- Use class names like `ad-slot ad-slot--leaderboard` so ad code can be dropped in later
- Initial monetisation: Google AdSense (no minimum traffic requirement)
- Goal: Migrate to Ezoic (10K sessions/month) then Mediavine (50K sessions) or Raptive (100K sessions) as traffic grows

### Analytics
- Google Analytics 4 (GA4) — add the tracking snippet
- Google Search Console — prepare sitemap.xml and robots.txt
- Add event tracking for: calculator used, calculation completed, tabs/calculator switched, CTA clicks

---

## File Structure Suggestion

```
/
├── index.html (homepage with embedded slab calculator)
├── concrete-slab-calculator/index.html
├── post-hole-calculator/index.html
├── footing-calculator/index.html
├── column-calculator/index.html
├── circular-slab-calculator/index.html
├── bags-vs-readymix/index.html
├── css/
│   └── styles.css
├── js/
│   ├── calculators.js (shared calculation logic)
│   └── ui.js (shared UI interactions)
├── images/
│   └── (calculator diagrams as SVGs)
├── sitemap.xml
├── robots.txt
└── manifest.json (for PWA / mobile add-to-homescreen)
```

---

## Summary of Key Numbers & Sources

| Constant | Value | Source |
|---|---|---|
| 20kg bags per m³ | 108 | Boral recommendation, cited by Canterbury Timbers |
| 20kg bags per m³ (safe upper) | 110 | Ultimate Backyard AU, based on Dingo brand |
| Yield per 20kg bag | 0.009–0.0093 m³ | Bag labelling (Boral, Cement Australia) |
| Default wastage factor | 10% | Industry standard, recommended by Boral, Cement Australia, all suppliers |
| Ready-mix price range (AU) | $280–$420/m³ | concreterfinder.com/prices (2025) |
| 20kg bag price range (Bunnings) | $8.50–$12.50 | bunnings.com.au product listings |
| Path thickness | 75–100mm | Australian building standards |
| Patio thickness | 100mm | Australian building standards |
| Driveway thickness | 100–150mm | Australian building standards, concreterfinder.com |
| Shed slab thickness | 100mm | Bunnings DIY advice |
| Post hole depth | 1/3 of above-ground height | Universal fencing standard |
| Post hole diameter | 3× post width | Universal fencing standard |
| Concrete density | 2,130–2,400 kg/m³ | Industry standard (varies by mix) |

---

## What NOT to Build (For Now)
- Stairs calculator — lower search volume in AU, add in Phase 3
- Curb & gutter calculator — irrelevant for Australian DIYers (council work)
- Mortar/render calculator — different product category, Phase 3+
- Gravel/sand calculator — good expansion target for Phase 2
- Paint/paving/decking calculators — good expansion targets for Phase 3

---

## Launch Checklist
- [ ] All 6 calculators functional and cross-validated against Canterbury Timbers & Cement Australia
- [ ] Mobile responsive on iPhone and Android
- [ ] Lighthouse score 95+
- [ ] sitemap.xml and robots.txt in place
- [ ] Google Analytics 4 installed
- [ ] Google Search Console verified
- [ ] FAQ schema on every calculator page
- [ ] Ad placeholder divs in place
- [ ] Australian English throughout (no American spellings)
- [ ] Disclaimer on every calculator page
- [ ] Meta titles and descriptions optimised for target keywords
- [ ] Open Graph / social meta tags for sharing
- [ ] Favicon and PWA manifest
