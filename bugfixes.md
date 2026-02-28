# Concrete Calculator — Critical Fixes

## 1. Add `--color-grey-50` CSS variable
**File:** `css/styles.css`

In the `:root {}` block, add after `--color-grey-100`:
```css
--color-grey-50: #f9fafb;       /* Slate 50 - subtle backgrounds */
```

---

## 2. Remove fake AggregateRating from homepage schema
**File:** `index.html`

Remove the entire `aggregateRating` block from the WebApplication JSON-LD script:
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "156"
}
```

---

## 3. Remove dead Google Fonts preconnect
**File:** `index.html`

Remove these lines (site uses system fonts — these do nothing):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

---

## 4. Add PWA icon placeholders
**Task:** Create an `/icons/` directory with two placeholder PNG files so the manifest stops 404ing:
```
icons/icon-192.png  (192×192)
icons/icon-512.png  (512×512)
```
Generate simple placeholder icons (e.g. a dark slate square `#1e293b` with an amber `#f59e0b` accent) using canvas/sharp/jimp or any available tool. These can be replaced with proper branded icons later.

---

## 5. Add ad slot placeholder divs to all 7 pages
**Files:** `index.html`, `concrete-slab-calculator/index.html`, `post-hole-calculator/index.html`, `footing-calculator/index.html`, `column-calculator/index.html`, `circular-slab-calculator/index.html`, `bags-vs-readymix/index.html`

Add these three ad slots to **each page**:

**Above the calculator** (inside `.main-content`, before `.calculator-section`):
```html
<!-- Ad Slot: Leaderboard -->
<div class="ad-slot ad-slot--leaderboard" style="min-height:90px;text-align:center;margin-bottom:var(--space-4);"></div>
```

**Below the results panel** (after `.results-panel`):
```html
<!-- Ad Slot: Medium Rectangle -->
<div class="ad-slot ad-slot--medium-rectangle" style="min-height:250px;text-align:center;margin-top:var(--space-5);"></div>
```

**Within the SEO content section** (mid-article, between `<h2>` and `<h3>` blocks):
```html
<!-- Ad Slot: In-Content -->
<div class="ad-slot ad-slot--in-content" style="min-height:250px;text-align:center;margin:var(--space-8) 0;"></div>
```

---

## 6. Add Google Analytics 4
**Files:** All 7 HTML pages — add inside `<head>`, replacing `G-XXXXXXXXXX` with your actual GA4 measurement ID:
```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## Checklist

- [x] 1. Add `--color-grey-50` CSS variable to `css/styles.css`
- [x] 2. Remove fake `AggregateRating` from `index.html` JSON-LD
- [x] 3. Remove dead Google Fonts preconnect from `index.html`
- [x] 4. Generate PWA icons and create `/icons/` directory
- [ ] 5. Add ad slot divs to all 7 pages — *waiting on Adsense account*
- [ ] 6. Add Google Analytics 4 to all 7 pages — *waiting on GA4 measurement ID*
