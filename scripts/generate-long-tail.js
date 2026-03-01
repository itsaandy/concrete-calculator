#!/usr/bin/env node

/**
 * Long-Tail Page Generator for concretecalc.com.au
 *
 * Generates static HTML pages targeting specific long-tail search queries.
 * Run with: node scripts/generate-long-tail.js
 */

const fs = require('fs');
const path = require('path');

// Load data
const dataPath = path.join(__dirname, 'long-tail-data.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Constants
const BAGS_PER_M3 = 108;
const BAG_COST_MIN = 8.50;
const BAG_COST_MAX = 12.50;
const READYMIX_COST_MIN = 280;
const READYMIX_COST_MAX = 420;
const DOMAIN = 'https://concretecalc.com.au';
const TODAY = new Date().toISOString().split('T')[0];

// Output directory (repo root)
const ROOT_DIR = path.join(__dirname, '..');

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

function calculateSlabVolume(length, width, depth, wastage) {
  const baseVolume = length * width * depth;
  const totalVolume = baseVolume * (1 + wastage / 100);
  return totalVolume;
}

function calculatePostHoleVolume(holeDiameterMm, holeDepthMm, postWidthMm, postShape, count) {
  const holeDiameter = holeDiameterMm / 1000;
  const holeDepth = holeDepthMm / 1000;
  const postWidth = postWidthMm / 1000;

  const holeRadius = holeDiameter / 2;
  const holeVolume = Math.PI * holeRadius * holeRadius * holeDepth;

  let postVolume;
  if (postShape === 'round') {
    const postRadius = postWidth / 2;
    postVolume = Math.PI * postRadius * postRadius * holeDepth;
  } else {
    postVolume = postWidth * postWidth * holeDepth;
  }

  const concretePerHole = holeVolume - postVolume;
  const totalVolume = concretePerHole * count * 1.1; // 10% wastage
  return totalVolume;
}

function calculateFootingVolume(length, width, depth, count, wastage) {
  const baseVolume = length * width * depth * count;
  const totalVolume = baseVolume * (1 + wastage / 100);
  return totalVolume;
}

function calculateBags(volume) {
  return Math.ceil(volume * BAGS_PER_M3);
}

function formatCurrency(amount) {
  return '$' + amount.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(num, decimals = 2) {
  return num.toFixed(decimals);
}

// ============================================================================
// TEMPLATE COMPONENTS
// ============================================================================

const headTemplate = (page) => `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8">

  <!-- Google AdSense -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2538773959178920"
     crossorigin="anonymous"></script>

  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XNWWCK3HP0"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XNWWCK3HP0');
  </script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${page.metaDescription}">
  <meta name="author" content="Concrete Calculator Australia">
  <meta name="robots" content="index, follow">

  <title>${page.title}</title>

  <!-- Open Graph -->
  <meta property="og:title" content="${page.ogTitle}">
  <meta property="og:description" content="${page.metaDescription}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${DOMAIN}/${page.slug}/">
  <meta property="og:locale" content="en_AU">
  <meta property="og:image" content="${DOMAIN}/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">

  <!-- Canonical -->
  <link rel="canonical" href="${DOMAIN}/${page.slug}/">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='10' fill='%231e293b'/%3E%3Crect x='15' y='50' width='70' height='35' rx='3' fill='%23f59e0b'/%3E%3Crect x='20' y='25' width='25' height='30' fill='%2394a3b8'/%3E%3Crect x='55' y='35' width='25' height='20' fill='%2394a3b8'/%3E%3C/svg%3E">

  <!-- Manifest -->
  <link rel="manifest" href="/manifest.json">

  <!-- Styles -->
  <link rel="stylesheet" href="/css/styles.css">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "${page.title}",
    "description": "${page.metaDescription}",
    "url": "${DOMAIN}/${page.slug}/",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "AUD"
    }
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
${page.faqs.map(faq => `      {
        "@type": "Question",
        "name": "${faq.question}",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "${faq.answer}"
        }
      }`).join(',\n')}
    ]
  }
  </script>
</head>`;

const headerTemplate = `
<body>
  <div class="page-wrapper">
    <!-- Header -->
    <header class="site-header">
      <div class="header-inner">
        <a href="/" class="site-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="12" width="20" height="10" rx="1"/>
            <path d="M4 12V6a2 2 0 0 1 2-2h4"/>
            <path d="M14 4h4a2 2 0 0 1 2 2v6"/>
          </svg>
          <span>Concrete Calculator</span>
        </a>

        <nav class="main-nav" aria-label="Main navigation">
          <ul class="nav-list">
            <li><a href="/">Slab Calculator</a></li>
            <li><a href="/post-hole-calculator/">Post Holes</a></li>
            <li><a href="/footing-calculator/">Footings</a></li>
            <li class="nav-dropdown">
              <button class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true">
                More
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <ul class="nav-dropdown-menu">
                <li><a href="/column-calculator/">Column Calculator</a></li>
                <li><a href="/circular-slab-calculator/">Circular Slab</a></li>
              </ul>
            </li>
            <li><a href="/bags-vs-readymix/">Bags vs Ready-Mix</a></li>
          </ul>
        </nav>

        <button class="nav-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Toggle navigation">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
        <ul class="mobile-nav-list">
          <li><a href="/">Slab Calculator</a></li>
          <li><a href="/post-hole-calculator/">Post Hole Calculator</a></li>
          <li><a href="/footing-calculator/">Footing Calculator</a></li>
          <li><a href="/column-calculator/">Column Calculator</a></li>
          <li><a href="/circular-slab-calculator/">Circular Slab Calculator</a></li>
          <li><a href="/bags-vs-readymix/">Bags vs Ready-Mix</a></li>
        </ul>
      </nav>
    </header>`;

const footerTemplate = `
    <!-- Footer -->
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="/" class="footer-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="2" y="12" width="20" height="10" rx="1"/>
                <path d="M4 12V6a2 2 0 0 1 2-2h4"/>
                <path d="M14 4h4a2 2 0 0 1 2 2v6"/>
              </svg>
              <span>Concrete Calculator</span>
            </a>
            <p>Free concrete calculators for Australian DIYers and tradies. Calculate volume, bags, and costs for all your concreting projects.</p>
          </div>

          <nav class="footer-nav">
            <h4>Calculators</h4>
            <ul>
              <li><a href="/">Slab Calculator</a></li>
              <li><a href="/post-hole-calculator/">Post Hole Calculator</a></li>
              <li><a href="/footing-calculator/">Footing Calculator</a></li>
              <li><a href="/column-calculator/">Column Calculator</a></li>
              <li><a href="/circular-slab-calculator/">Circular Slab</a></li>
            </ul>
          </nav>

          <nav class="footer-nav">
            <h4>Resources</h4>
            <ul>
              <li><a href="/bags-vs-readymix/">Bags vs Ready-Mix</a></li>
            </ul>
          </nav>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2026 Concrete Calculator Australia</p>
          <p class="disclaimer">
            <strong>Disclaimer:</strong> These calculators provide estimates only. Actual concrete requirements may vary based on site conditions, mixing accuracy, and other factors. Always consult with a professional for structural projects. Prices are estimates based on typical Australian retail pricing and may vary by location and supplier.
          </p>
        </div>
      </div>
    </footer>
  </div>

  <!-- Scripts -->
  <script src="/js/calculators.js"></script>
  <script src="/js/ui.js"></script>
</body>
</html>`;

// ============================================================================
// SEO CONTENT GENERATORS (Unique per page type)
// ============================================================================

const slabContent = {
  'concrete-for-3x3-slab': `
          <h2>Pouring a 3x3 Metre Concrete Slab</h2>

          <p>A 3x3 metre slab is one of the most common sizes for Australian backyard projects. At 9 square metres, it's the perfect size for a small garden shed, outdoor storage area, or compact patio space. This guide covers everything you need to know about calculating and pouring concrete for this popular slab size.</p>

          <h3>Standard Specifications for a 3x3 Slab</h3>
          <p>For most residential applications, a 3x3 metre slab should be 100mm thick. This provides adequate strength for light structures like garden sheds, outdoor furniture, or foot traffic. The standard 100mm thickness has been the Australian residential benchmark for decades, offering a good balance between material cost and structural integrity.</p>

          <h3>Site Preparation is Critical</h3>
          <p>Before pouring any concrete, proper site preparation makes the difference between a slab that lasts decades and one that cracks within months. Start by excavating the area to approximately 150mm depth, allowing for 50mm of compacted road base beneath your 100mm slab. Remove all organic material, roots, and soft spots. Use a plate compactor to achieve proper compaction of both the subgrade and the road base layer.</p>

          <h3>Formwork and Reinforcement</h3>
          <p>Set up timber formwork around the perimeter using 100x50mm timber for a 100mm slab. Ensure the forms are level and properly braced to prevent movement during the pour. For a 3x3 slab, SL72 reinforcement mesh is recommended. Position the mesh on bar chairs approximately 40mm from the bottom of the slab to ensure proper concrete cover.</p>

          <h3>Mixing and Pouring Tips</h3>
          <p>For a slab this size requiring approximately 1 cubic metre of concrete, you have two options. Mixing bags by hand requires around 108 bags of 20kg concrete mix, which is significant physical work. Alternatively, ordering ready-mix concrete is often more practical for this volume. Most concrete suppliers have minimum orders around 0.5 to 1 cubic metre, making this size ideal for a ready-mix delivery.</p>

          <h3>Curing Your Slab</h3>
          <p>After finishing, keep the concrete moist for at least 7 days. Cover with plastic sheeting or use a curing compound. Avoid walking on the slab for 24-48 hours and don't place heavy loads for at least 7 days. Full strength develops over 28 days, so plan your project timeline accordingly.</p>`,

  'concrete-for-shed-slab': `
          <h2>Building a Concrete Slab for Your Garden Shed</h2>

          <p>A solid concrete slab is the ideal foundation for any garden shed in Australia. Unlike timber bearers or pavers, a concrete base provides a level, permanent foundation that won't shift, rot, or allow pests to nest underneath your shed. Here's how to calculate and pour the perfect shed slab.</p>

          <h3>Why Concrete is Best for Shed Bases</h3>
          <p>Australian conditions demand durable foundations. Termites can devastate timber foundations, while pavers and gravel can shift over time. A concrete slab eliminates these concerns while providing a perfectly level surface that makes shed assembly straightforward. The slight additional cost compared to alternatives pays off in longevity and reduced maintenance.</p>

          <h3>Sizing Your Shed Slab</h3>
          <p>Standard 3x3 metre shed slabs suit most garden sheds and small workshops. However, consider making your slab 100-200mm larger than the shed footprint on each side. This extra concrete creates a useful apron around the shed entrance and allows for minor positioning adjustments during shed installation.</p>

          <h3>Drainage Considerations</h3>
          <p>Shed slabs should incorporate a slight fall away from the shed door, typically 1:100 (10mm per metre). This ensures rainwater drains away rather than pooling at the entrance. Set your formwork with this fall in mind, using a spirit level and calculated spacers to achieve the correct slope.</p>

          <h3>Anchor Bolt Placement</h3>
          <p>If your shed requires bolt-down anchors, plan their locations before pouring. Mark anchor positions on your formwork and have the bolts ready to insert into the wet concrete. Most shed manufacturers provide anchor spacing templates. Setting bolts during the pour is far easier than drilling into cured concrete later.</p>

          <h3>Council Requirements</h3>
          <p>Many Australian councils have specific requirements for shed construction, including slab specifications. Sheds over certain sizes may require development approval or building certification. Check with your local council before starting work, as requirements vary significantly between jurisdictions.</p>`,

  'concrete-for-4x3-shed-slab': `
          <h2>Concrete Requirements for a 4x3 Metre Shed Slab</h2>

          <p>The 4x3 metre shed slab has become increasingly popular as Australians look for slightly more storage space without dramatically increasing costs. This size accommodates larger garden equipment, ride-on mowers, and provides comfortable workshop space while remaining manageable for DIY installation.</p>

          <h3>Material Quantities for 4x3 Metres</h3>
          <p>At 12 square metres, a 4x3 slab at 100mm thickness requires approximately 1.32 cubic metres of concrete including wastage. This translates to roughly 143 bags of 20kg premix concrete, making ready-mix delivery a sensible choice. The labour involved in mixing this many bags by hand is considerable, and ready-mix ensures consistent quality throughout the pour.</p>

          <h3>Planning for Equipment Access</h3>
          <p>Before ordering ready-mix, verify that a concrete truck can access your site. Standard concrete trucks require approximately 3 metres of width and reasonable ground conditions. If access is limited, discuss options with your supplier. Some offer smaller delivery vehicles or conveyor belt extensions, though these may incur additional charges.</p>

          <h3>Reinforcement for Larger Slabs</h3>
          <p>As slab size increases, reinforcement becomes more important. For a 4x3 metre slab, SL72 mesh provides adequate reinforcement for typical shed loads. Overlap mesh sheets by at least one square (200mm) and tie intersections with wire. The mesh should sit in the lower third of the slab, supported on bar chairs to maintain consistent cover.</p>

          <h3>Expansion and Control Joints</h3>
          <p>While a 4x3 slab doesn't necessarily require control joints, you may choose to include them for aesthetic reasons or if the slab will be exposed to significant temperature variations. If including joints, tool them into the fresh concrete at approximately 3 metre centres, cutting to one-quarter of the slab depth.</p>

          <h3>Weather Considerations</h3>
          <p>Australian weather can significantly impact concrete work. Avoid pouring in extreme heat (above 35°C) or if rain is forecast within 24 hours. Hot weather accelerates setting time, reducing working time for finishing. Cold weather slows curing, potentially weakening the final product. Aim for mild conditions when possible.</p>`,

  'concrete-for-6x3-shed-slab': `
          <h2>How Much Concrete for a 6x3 Metre Shed Slab</h2>

          <p>A 6x3 metre slab is a substantial foundation suitable for single garages, large workshops, or multi-bay storage sheds. At 18 square metres, this size marks the point where professional assistance or ready-mix concrete becomes almost essential for most DIYers.</p>

          <h3>Volume Calculations Explained</h3>
          <p>The 6x3 metre footprint at 100mm depth produces 1.8 cubic metres of concrete, or approximately 1.98 cubic metres with standard 10% wastage. This equates to around 214 bags of premix concrete, making ready-mix the only practical option for most situations. Attempting to hand-mix this quantity would require exceptional stamina and risk inconsistent concrete quality.</p>

          <h3>Structural Considerations for Larger Slabs</h3>
          <p>Slabs of this size warrant more attention to structural details. Consider upgrading to SL82 mesh for improved crack resistance, particularly if heavy equipment will be stored on the slab. Ensure your subbase is thoroughly compacted, as any settlement in a slab this size can create noticeable cracking patterns.</p>

          <h3>Pour Logistics</h3>
          <p>A 2 cubic metre pour requires efficient organisation. Have sufficient workers on hand, typically 3-4 people for a slab this size. One person manages the concrete flow, while others spread, level, and consolidate. With approximately 45-90 minutes of working time before initial set, everyone needs to know their role before the truck arrives.</p>

          <h3>Finishing Techniques</h3>
          <p>For shed bases, a broom finish provides adequate grip while being easy to achieve. After screeding and bull-floating, wait for the bleed water to evaporate before dragging a stiff broom across the surface in parallel strokes. This creates a slip-resistant texture that's practical for workshop environments.</p>

          <h3>Cost Comparison</h3>
          <p>At this volume, ready-mix concrete typically costs between $560 and $840 for the concrete alone, plus delivery fees of $100-200. While bags might appear cheaper on paper, the time, labour, and equipment hire for mixing makes ready-mix the more economical choice. Check our <a href="/bags-vs-readymix/">bags vs ready-mix comparison</a> for your specific situation.</p>`,

  'concrete-for-6x4-shed-slab': `
          <h2>Calculating Concrete for a 6x4 Metre Shed Slab</h2>

          <p>The 6x4 metre slab provides 24 square metres of foundation space, ideal for larger sheds, double-width workshops, or small garages. This size allows comfortable storage of vehicles alongside tools and equipment, making it a versatile choice for Australian properties.</p>

          <h3>Understanding the Volume Requirements</h3>
          <p>At 100mm thickness, a 6x4 slab requires 2.4 cubic metres of concrete before wastage. Adding the standard 10% brings this to 2.64 cubic metres. This volume firmly places the project in ready-mix territory, requiring approximately 285 bags of premix if mixing by hand, which is impractical for most situations.</p>

          <h3>Subgrade Preparation for Heavy Use</h3>
          <p>If vehicles will access this slab, invest extra effort in subgrade preparation. Excavate deeper to allow 100-150mm of compacted road base beneath the concrete. Consider geotextile fabric between the subgrade and road base if soil conditions are poor. This additional preparation prevents settlement that could crack the slab under vehicle loads.</p>

          <h3>Thickness Considerations</h3>
          <p>While 100mm is adequate for foot traffic and light storage, consider 125mm thickness if heavy equipment or vehicles will use the slab. This modest increase adds approximately 20% more concrete but significantly improves load-bearing capacity and reduces cracking risk under repeated heavy loads.</p>

          <h3>Mesh Reinforcement Requirements</h3>
          <p>A slab this size requires multiple sheets of reinforcement mesh. Standard SL72 sheets measure 6x2.4 metres, meaning you'll need at least two sheets with substantial overlap. For vehicle-rated slabs, upgrade to SL82 mesh and consider additional reinforcement around doorways and high-traffic areas.</p>

          <h3>Professional Assessment</h3>
          <p>For slabs approaching 25 square metres, consider engaging a concrete contractor or building certifier for advice. They can assess your specific site conditions, soil type, and intended use to recommend appropriate specifications. This small investment can prevent expensive remediation later.</p>`,

  'concrete-for-6x6-shed-slab': `
          <h2>Concrete for a 6x6 Metre Shed or Garage Slab</h2>

          <p>A 6x6 metre slab encompasses 36 square metres, making it suitable for double garages, substantial workshops, or large storage buildings. Projects of this scale typically warrant professional involvement or significant DIY experience, though the calculation principles remain straightforward.</p>

          <h3>Volume and Cost Overview</h3>
          <p>At 100mm depth, a 6x6 metre slab requires 3.6 cubic metres of concrete. With 10% wastage factored in, budget for approximately 3.96 cubic metres or roughly 428 bags of premix. Ready-mix is the only sensible option at this volume, with concrete costs ranging from $1,100 to $1,650 plus delivery and potential pump hire.</p>

          <h3>Access and Pump Requirements</h3>
          <p>Concrete trucks typically extend chutes 2-3 metres from the vehicle. For a 6x6 slab, you'll likely need the truck to reposition during the pour or require a concrete pump. Line pumps typically cost $300-500 for a job this size but dramatically simplify placement and reduce labour requirements.</p>

          <h3>Control Joint Planning</h3>
          <p>Slabs exceeding 30 square metres should include control joints to manage cracking. Plan joint locations to create panels no larger than 4.5 metres in any direction. For a 6x6 slab, a single cross joint creating four 3x3 metre panels is typical. Cut or tool joints to one-quarter slab depth.</p>

          <h3>Reinforcement Strategy</h3>
          <p>Large slabs benefit from careful reinforcement planning. Beyond standard mesh, consider additional bar reinforcement around edges and re-entrant corners. If the slab will support columns or posts, detail additional reinforcement at these locations. Your steel supplier can advise on cutting and bending requirements.</p>

          <h3>Council and Certification Requirements</h3>
          <p>Slabs of this size often require building approval, particularly if supporting structures like garages or carports. Many councils require engineer-designed footings for buildings exceeding certain sizes. Contact your local council's planning department before commencing work to understand your obligations.</p>

          <h3>When to Hire Professionals</h3>
          <p>A 6x6 pour is ambitious for inexperienced DIYers. Consider the consequences of getting it wrong against the cost of professional assistance. Many concreters offer labour-only arrangements where you supply the concrete and they handle placement and finishing, providing a cost-effective middle ground.</p>`,

  'concrete-for-driveway': `
          <h2>How Much Concrete for a Driveway</h2>

          <p>Driveways demand more from concrete than any other residential application. Supporting the weight of vehicles, withstanding weather extremes, and lasting decades requires careful specification and execution. Here's what you need to know about calculating concrete for a standard residential driveway.</p>

          <h3>Standard Driveway Dimensions</h3>
          <p>A typical single-car driveway measures approximately 6 metres long by 3 metres wide. This allows comfortable access for standard vehicles while maintaining manageable concrete volumes. Width can vary based on your vehicle and access requirements, with 2.5 metres being the minimum practical width for most cars.</p>

          <h3>Thickness Requirements for Vehicles</h3>
          <p>Unlike patios and shed slabs, driveways must handle significant loads. The standard recommendation is 125mm thickness for residential driveways supporting cars and light vehicles. If you regularly park caravans, boats, or larger vehicles, consider 150mm thickness. This additional depth significantly improves load distribution and longevity.</p>

          <h3>Concrete Strength Specifications</h3>
          <p>Specify 32MPa concrete for driveway applications. This higher strength grade provides better resistance to vehicle loads and Australian temperature extremes. While 25MPa concrete is cheaper, the cost difference is minimal compared to total project expense, and the durability improvement is substantial.</p>

          <h3>Essential Reinforcement</h3>
          <p>Driveways absolutely require reinforcement. SL82 mesh is the minimum standard, with many professionals preferring SL92 for added security. Place mesh in the bottom third of the slab, maintaining 40-50mm cover from edges. Consider additional reinforcement at areas where vehicles turn or brake frequently.</p>

          <h3>Subgrade Preparation</h3>
          <p>Driveway subgrade preparation is critical. Excavate to allow 100-150mm of compacted road base beneath your 125mm slab. Ensure adequate drainage so water doesn't pool beneath the slab, as this can lead to settlement and cracking. Install subsoil drainage if necessary on poorly draining sites.</p>

          <h3>Finishing Options</h3>
          <p>Exposed aggregate is popular for Australian driveways, providing excellent grip and hiding tyre marks. Alternatively, a broom finish offers good traction at lower cost. Avoid smooth steel-trowel finishes on driveways as they become dangerously slippery when wet.</p>`,

  'concrete-for-10x3-driveway': `
          <h2>Concrete for a 10x3 Metre Driveway</h2>

          <p>A 10x3 metre driveway provides generous length for most residential properties, accommodating multiple vehicles in tandem or allowing comfortable access from street to garage. At 30 square metres, this is a significant concrete project requiring careful planning and execution.</p>

          <h3>Volume Calculations</h3>
          <p>At 125mm thickness (appropriate for vehicle loads), a 10x3 metre driveway requires 3.75 cubic metres of concrete. Adding 10% wastage brings this to approximately 4.1 cubic metres. This volume requires ready-mix delivery and potentially a concrete pump depending on site access.</p>

          <h3>Pour Sequencing Considerations</h3>
          <p>A 4+ cubic metre pour requires efficient coordination. Consider whether the entire driveway can be placed continuously or whether construction joints at natural boundaries make sense. Pouring in stages can be practical for DIYers but requires careful joint preparation between pours.</p>

          <h3>Control Joint Locations</h3>
          <p>For a 10-metre long driveway, plan for control joints at approximately 3-metre centres. This creates manageable panels and provides crack control at predetermined locations. Joints can be tooled during finishing or cut with a concrete saw within 24 hours of placement.</p>

          <h3>Edge Preparation</h3>
          <p>Driveway edges receive significant stress from vehicle wheels. Consider thickened edges (150mm versus 125mm for the main slab) if your driveway doesn't have permanent kerbing. This extra depth at edges resists damage from vehicles tracking slightly off the concrete surface.</p>

          <h3>Expansion Joints</h3>
          <p>Where your driveway meets the garage slab, footpath, or other fixed structures, install expansion joint material. This compressible strip prevents the driveway from transferring stress to adjacent structures as it expands and contracts with temperature changes.</p>

          <h3>Weather Window Planning</h3>
          <p>A pour this size commits you to several hours of intensive work. Check the weather forecast thoroughly and have backup dates planned. Starting a large pour with rain approaching risks poor finishing quality and surface damage that's expensive to rectify.</p>`,

  'concrete-for-single-garage-slab': `
          <h2>Single Garage Slab Concrete Calculator</h2>

          <p>A single garage slab forms the foundation for your garage structure while providing a durable surface for vehicle storage. Unlike open driveways, garage slabs have specific requirements related to structure support, door clearances, and the protected environment they provide.</p>

          <h3>Standard Single Garage Dimensions</h3>
          <p>A typical single garage measures 6x3 metres internally, providing adequate space for a standard vehicle plus some side clearance. When calculating slab size, add thickness allowances for walls if the garage hasn't been built yet. External dimensions might be 6.2x3.2 metres to accommodate standard wall framing.</p>

          <h3>Slab Thickness Requirements</h3>
          <p>Garage slabs should be 125mm thick to handle vehicle weight plus any additional loads from storage. The slab also supports the garage walls and roof structure, adding to the total load. Don't be tempted to reduce thickness thinking the enclosed environment protects the concrete, as vehicle loads are the primary concern.</p>

          <h3>Edge Beams for Structure Support</h3>
          <p>Most garage designs require edge beams or thickenings where walls will sit. These are typically 300mm wide and 300mm deep, formed beneath the slab perimeter. Your garage plans will specify edge beam requirements based on wall construction and roof loads. Factor this additional concrete into your calculations.</p>

          <h3>Bolt-Down and Bracket Locations</h3>
          <p>Plan hold-down bolt positions before pouring. Modern garage frames require numerous bolts at specific spacings, with positions determined by engineering calculations. Have your garage supplier provide exact bolt locations and set them into the wet concrete during the pour.</p>

          <h3>Internal Floor Level</h3>
          <p>Set your garage floor level considering the finished ground level outside. The slab should be slightly above external ground to prevent water ingress, typically 25-50mm. Also consider whether you'll add a floor coating later, which adds a few millimetres to the final height.</p>

          <h3>Building Approval Requirements</h3>
          <p>Garages typically require building approval in most Australian jurisdictions. This includes slab specifications that must match approved engineering. Don't pour your slab until you have approved plans, as retrospective changes can be costly or impossible.</p>`,

  'concrete-for-double-garage-slab': `
          <h2>Double Garage Slab Concrete Requirements</h2>

          <p>Double garages have become standard in Australian new homes, providing space for two vehicles plus storage. At 36 square metres, a double garage slab represents a significant concrete project that typically requires professional design input and potentially professional installation.</p>

          <h3>Standard Dimensions and Layout</h3>
          <p>Internal dimensions of 6x6 metres provide comfortable space for two vehicles. This allows approximately 2.7 metres per vehicle bay with space for opening doors. Some designs extend to 6x7 or 6x8 metres for additional workshop or storage space behind the vehicle parking areas.</p>

          <h3>Volume and Cost Expectations</h3>
          <p>A 6x6 metre slab at 125mm depth requires 4.5 cubic metres of concrete for the slab alone. Adding typical edge beams might increase this to 5-6 cubic metres total. At current prices, expect concrete costs of $1,400-$2,500 plus delivery, pumping, and any professional labour.</p>

          <h3>Engineering Requirements</h3>
          <p>Double garages almost always require engineered plans including specific slab and footing details. Your engineer will consider soil conditions, garage structure, and any additional loads from storage or living spaces above. These plans form part of your building approval documentation.</p>

          <h3>Professional Pour Considerations</h3>
          <p>A 5+ cubic metre pour with edge beams and bolt placements challenges even experienced DIYers. Most homeowners engage professional concreters for this work while potentially handling site preparation themselves. The cost difference between DIY and professional installation is modest relative to the risk of getting it wrong.</p>

          <h3>Reinforcement Specifications</h3>
          <p>Engineer-specified reinforcement typically includes SL82 or SL92 mesh in the slab plus additional bar reinforcement in edge beams. Reinforcement must be correctly positioned and tied, with certification often required before council inspection. Follow engineering details exactly for both structural integrity and approval compliance.</p>

          <h3>Services and Penetrations</h3>
          <p>Plan locations for floor wastes, electrical conduits, and any other services before pouring. It's far easier to cast sleeves or pipes into fresh concrete than to cut through afterwards. Coordinate with your electrician and plumber to have penetrations correctly positioned.</p>`,

  'concrete-for-patio': `
          <h2>Calculating Concrete for a Patio</h2>

          <p>Patios transform outdoor spaces into functional living areas, and concrete remains the most popular material choice for Australian homeowners. A 4x4 metre patio provides comfortable space for outdoor dining and entertaining while remaining achievable as a DIY project for those with reasonable skills.</p>

          <h3>Patio Size and Design</h3>
          <p>The 4x4 metre footprint accommodates a six-person dining setting comfortably, with space for circulation around furniture. Consider your specific furniture and intended use when finalising dimensions. Extending slightly larger is easier during construction than wishing you had more space later.</p>

          <h3>Slab Thickness for Patios</h3>
          <p>Patios typically only support foot traffic and furniture, making 100mm thickness adequate for most situations. This is thinner than driveways but provides plenty of strength for residential outdoor living areas. If heavy planters or spa equipment will sit on the patio, consider localised thickening at those points.</p>

          <h3>Drainage and Fall</h3>
          <p>Outdoor slabs must direct water away from buildings. Incorporate a fall of 1:100 (10mm per metre) away from the house. For a 4-metre wide patio, this means the outer edge sits 40mm lower than the house side. Set formwork carefully to achieve this consistent slope.</p>

          <h3>Connection to Existing House Slab</h3>
          <p>Where your patio meets the house, you have two options. Either pour directly against the house slab with an expansion joint between, or leave a gap filled with decorative stone. The expansion joint approach provides a seamless appearance but requires careful waterproofing to prevent moisture tracking along the junction.</p>

          <h3>Finishing Options for Patios</h3>
          <p>Patios offer more finishing flexibility than driveways. Smooth trowel finishes suit areas that will be tiled or coated later. Exposed aggregate creates an attractive, low-maintenance surface. Coloured concrete or stamped patterns can create impressive decorative effects. Consider maintenance requirements, as textured finishes can be harder to clean.</p>

          <h3>Furniture and Fixture Planning</h3>
          <p>If installing permanent fixtures like posts for a pergola or awning, plan their locations before pouring. Setting post brackets or anchors into fresh concrete is straightforward, but cutting and fixing into cured concrete is considerably more work.</p>`,

  'concrete-for-garden-path': `
          <h2>Concrete for a Garden Path</h2>

          <p>Garden paths provide practical access around your property while defining spaces and adding visual interest. A 6x1 metre path is a common starting point, though most properties require considerably more length to connect various areas. Here's how to calculate and pour concrete paths efficiently.</p>

          <h3>Path Width Considerations</h3>
          <p>One metre width allows comfortable single-person walking and wheelbarrow access for garden maintenance. For frequently used paths between house and shed, 1.2 metres enables two people to pass comfortably. Side paths for utility access can be narrower at 600-800mm if space is limited.</p>

          <h3>Path Thickness Requirements</h3>
          <p>Paths supporting only foot traffic can be poured at 75mm thickness, though 100mm is more common and provides extra durability. The modest increase in concrete volume is worthwhile for improved longevity. If wheelbarrows or ride-on mowers will use the path regularly, 100mm is the minimum recommendation.</p>

          <h3>Subbase Preparation</h3>
          <p>Even light-duty paths benefit from proper preparation. Remove topsoil and organic matter, compact the subgrade, and add 50mm of compacted road base. This prevents settlement and ensures your path remains level over time. Skip this step and your path will likely develop cracks and uneven sections within a few years.</p>

          <h3>Curved Path Techniques</h3>
          <p>Garden paths often follow curved lines for visual interest. Create curved formwork using flexible hardboard or masonite bent to your desired shape and staked firmly in place. Mark your curves using garden hose laid on the ground before committing to formwork installation.</p>

          <h3>Expansion Joints</h3>
          <p>Include expansion joints every 2-3 metres along path length. These can be formed using commercial expansion joint strips or simply by tooling grooves during finishing. Joints control where cracks form and add visual pattern to longer paths.</p>

          <h3>Efficient Pouring Strategy</h3>
          <p>Paths can be poured in sections, making this an ideal project for mixing bags rather than ordering ready-mix. Pour one section, finish it, then set up formwork for the next. This approach spreads the work across multiple sessions while producing professional results.</p>`
};

const postHoleContent = {
  'concrete-for-a-fence-post': `
          <h2>How Much Concrete for a Single Fence Post</h2>

          <p>Setting fence posts in concrete is the most reliable method for creating sturdy, long-lasting fences. Whether you're building a new boundary fence or replacing damaged posts, understanding concrete requirements ensures you purchase the right amount of material without wastage.</p>

          <h3>Standard Fence Post Hole Dimensions</h3>
          <p>For a typical 90x90mm timber fence post, a hole diameter of 250mm provides adequate concrete around the post for solid anchoring. Depth should be approximately one-third of the total post length above ground, with 600mm being minimum for standard 1.8-metre fences. These proportions have been proven over decades of Australian fence building.</p>

          <h3>Concrete Volume Calculations</h3>
          <p>A 250mm diameter hole at 600mm depth contains approximately 0.029 cubic metres of space. Subtracting the post volume and adding wastage gives around 0.025 cubic metres of concrete per post, or roughly 2-3 bags of 20kg quick-set post mix. This accounts for the irregular hole shape typical of manual digging.</p>

          <h3>Quick-Set vs Standard Concrete</h3>
          <p>For fence posts, quick-set post mix is strongly recommended. Products like Rapid Set Post Mix set in 20-30 minutes, allowing you to continue with fence construction the same day. Standard concrete requires 24-48 hours before attaching rails, significantly slowing project progress.</p>

          <h3>Post Alignment During Setting</h3>
          <p>Quick-setting concrete leaves minimal time for adjustment. Set up string lines before mixing concrete and have a spirit level ready. Place the post, check alignment, add concrete around the post, recheck alignment, and hold or brace the post until initial set occurs. Working with a partner makes this process significantly easier.</p>

          <h3>Drainage Considerations</h3>
          <p>Water collecting around post bases accelerates timber decay. Place 50mm of gravel in the bottom of each hole before setting posts. Some builders also leave the concrete slightly below ground level and cap with gravel, allowing water to drain away rather than pooling against the timber.</p>

          <h3>Consistent Depth Technique</h3>
          <p>Use a depth gauge made from a stick marked at your target depth. Check each hole before setting posts to ensure consistent fence height. Digging all holes before setting any posts allows you to verify alignment and make adjustments before committing concrete.</p>`,

  'concrete-for-10-fence-posts': `
          <h2>Concrete Requirements for 10 Fence Posts</h2>

          <p>Whether you're building a side boundary fence or replacing a section of damaged fencing, setting 10 posts is a manageable weekend project. Understanding the total concrete requirements helps you purchase efficiently and plan your work schedule.</p>

          <h3>Total Material Calculation</h3>
          <p>At approximately 2-3 bags per post, 10 fence posts require 20-30 bags of post mix concrete. This variance accounts for different hole sizes and depths. For standard 1.8-metre fencing with 90x90mm posts in 250mm x 600mm holes, 25 bags provides adequate coverage with a small margin for irregularities.</p>

          <h3>Purchasing Strategy</h3>
          <p>Post mix is typically sold in 20kg bags at hardware stores. Buying in bulk quantities often attracts discounts; enquire about pallet pricing if your project scope warrants it. Consider delivery options, as 25 bags weighs 500kg and may exceed your vehicle's capacity or your back's tolerance.</p>

          <h3>Workflow Optimisation</h3>
          <p>Dig all holes first, then set posts systematically. This approach lets you verify alignment before any concrete is placed and allows efficient batch mixing. Mark hole positions carefully using string lines stretched between end points to ensure straight fence lines.</p>

          <h3>Setting Sequence</h3>
          <p>Set end posts and corner posts first, checking they're perfectly plumb. These reference posts establish your fence line. String lines between end posts then guide intermediate post positioning, ensuring consistently straight results even over uneven terrain.</p>

          <h3>Timing Considerations</h3>
          <p>With quick-set concrete, expect to spend 5-10 minutes per post on the setting process. Allow for hole preparation, mixing, setting, and alignment checking. Ten posts realistically takes 3-4 hours once holes are dug, assuming you're working steadily with brief rests between sets.</p>

          <h3>Material Staging</h3>
          <p>Stage concrete bags along the fence line before starting, placing them near their respective holes. Also position water containers at intervals, as you'll need clean water for mixing at each post location. This preparation eliminates delays once you begin the time-sensitive setting process.</p>`,

  'concrete-for-20-fence-posts': `
          <h2>Concrete for 20 Fence Posts: A Complete Guide</h2>

          <p>Twenty fence posts represents a substantial boundary fence project, potentially spanning 40-50 metres depending on post spacing. Projects of this scale benefit from careful planning, efficient material handling, and realistic scheduling.</p>

          <h3>Material Requirements</h3>
          <p>Budget for 50-60 bags of 20kg post mix concrete, representing approximately 1-1.2 tonnes of material. This quantity requires either multiple vehicle trips, trailer transport, or store delivery. Most hardware stores offer free or low-cost delivery for purchases over certain thresholds.</p>

          <h3>Project Timeline</h3>
          <p>Digging 20 holes by hand takes most people an entire day, assuming reasonable soil conditions. Rocky or clay soils can double this estimate. Setting all posts typically requires another full day of concentrated effort. Spread the work across two weekends to avoid exhaustion and maintain quality.</p>

          <h3>Power Auger Consideration</h3>
          <p>For 20+ holes, hiring a power auger dramatically reduces digging time and physical strain. One-person electric augers suit most fence posts, while petrol-powered two-person augers handle larger holes or difficult soils. Rental costs are typically $80-150 per day, often recovered through time savings.</p>

          <h3>Post Positioning System</h3>
          <p>Establish accurate positions using surveyor's string lines and measuring tape. Mark each hole centre with spray paint or a stake. Double-check critical dimensions before digging, as repositioning concrete-set posts is extremely difficult. Verify property boundaries if building boundary fences.</p>

          <h3>Batch Setting Approach</h3>
          <p>Work in batches of 4-5 posts rather than trying to set all 20 continuously. This allows quality checks between batches and provides natural rest periods. If a post needs adjustment after initial set, catching it within the batch is easier than discovering problems later.</p>

          <h3>Weather Contingency</h3>
          <p>A project spanning multiple days needs weather monitoring. Don't dig holes days before setting if rain is forecast, as waterlogged holes require pumping or bailing before concrete work. Have tarps available to protect open holes if weather turns unexpectedly.</p>`,

  'concrete-for-a-post-hole': `
          <h2>How Much Concrete for a Standard Post Hole</h2>

          <p>The generic "post hole" encompasses various applications from fence posts to letterbox supports. Understanding how hole dimensions affect concrete requirements helps you adapt calculations for any post-setting project.</p>

          <h3>Standard Hole Specifications</h3>
          <p>A 300mm diameter hole at 600mm depth represents a common middle-ground specification. This size accommodates 100mm posts with adequate concrete coverage while remaining practical to dig by hand. The volume works out to approximately 0.042 cubic metres per hole, or 4-5 bags of 20kg concrete.</p>

          <h3>Calculating Custom Hole Sizes</h3>
          <p>The formula is straightforward: Hole volume = π × radius² × depth. Subtract the post volume to find concrete required. Our calculator above handles these calculations automatically, but understanding the maths helps you estimate for custom situations without tools.</p>

          <h3>Hole Diameter Guidelines</h3>
          <p>As a rule of thumb, hole diameter should be approximately three times the post width. A 100mm post needs a 300mm hole; a 125mm post needs a 375mm hole. This ratio ensures sufficient concrete thickness to resist lateral forces without excessive material use.</p>

          <h3>Depth Determination</h3>
          <p>Depth depends on post height and intended load. Fence posts typically need one-third of total length buried. Structural posts for pergolas or carports require deeper setting, often 600-800mm minimum regardless of height. Check engineering requirements for structural applications.</p>

          <h3>Soil Type Impact</h3>
          <p>Sandy soils may require larger holes as concrete bonds less effectively than in clay. Conversely, stable clay soils can sometimes accept slightly smaller holes. Assess your soil conditions and adjust conservatively, erring toward larger holes in uncertain conditions.</p>

          <h3>Material Selection</h3>
          <p>Quick-set post mix suits most single-post applications. For posts bearing significant loads, standard concrete provides higher ultimate strength, though you'll need bracing for 24-48 hours while it cures. Consider the trade-off between convenience and strength for your specific application.</p>`,

  'concrete-for-600mm-hole': `
          <h2>Concrete for a 600mm Diameter Post Hole</h2>

          <p>Large-diameter post holes are specified for heavy-duty applications requiring maximum stability. A 600mm hole is common for substantial structures like shade sails, large pergolas, or commercial signage where lateral loads are significant.</p>

          <h3>When 600mm Holes are Required</h3>
          <p>Standard fence posts rarely need holes this large. The 600mm specification typically appears in engineered designs for shade structures, cantilever awnings, high fences exposed to wind loads, or posts supporting significant weight. Always follow engineering specifications if they're provided for your project.</p>

          <h3>Volume Calculation</h3>
          <p>A 600mm diameter hole at 600mm depth contains approximately 0.17 cubic metres of space. After accounting for the post and adding wastage, expect to need around 0.16-0.18 cubic metres of concrete per hole, equivalent to 17-20 bags of premix or 1/6 of a cubic metre of ready-mix.</p>

          <h3>Digging Large Holes</h3>
          <p>Hand-digging 600mm holes is extremely labour-intensive. A standard fence post auger won't achieve this diameter. Options include manual excavation with shovel and mattock, hiring a larger auger, or engaging a contractor with appropriate equipment. Budget significant time if digging manually.</p>

          <h3>Concrete Placement Considerations</h3>
          <p>The volume of concrete in large holes makes quick-set products impractical. Standard concrete allows adequate working time for proper consolidation and post positioning. Plan for temporary bracing while the concrete cures over 24-48 hours before applying any load to the post.</p>

          <h3>Reinforcement Options</h3>
          <p>For critical structural applications, consider adding reinforcement to large post holes. A cage of N12 bars around the post, extending into the footing concrete, significantly improves load capacity and resistance to movement. Consult engineering specifications for your specific requirements.</p>

          <h3>Structural Certification</h3>
          <p>Projects requiring 600mm post holes often need building certification. Have your plans checked and approved before commencing work. Inspectors may need to verify hole dimensions and reinforcement placement before concrete is placed.</p>`,

  'concrete-for-shade-sail-post': `
          <h2>Concrete for Shade Sail Posts</h2>

          <p>Shade sail posts experience significant lateral forces as sail fabric catches wind. Unlike fence posts that primarily resist leaning, shade sail posts must handle substantial pull in multiple directions. This demands larger holes, more concrete, and careful installation technique.</p>

          <h3>Standard Shade Sail Post Specifications</h3>
          <p>For residential shade sails, 100mm steel posts are common. Post holes should be minimum 400mm diameter and 800mm deep, considerably larger than standard fence post holes. This additional concrete mass resists the pulling forces transmitted through tensioned sail fabric.</p>

          <h3>Concrete Volume Requirements</h3>
          <p>A 400mm × 800mm hole requires approximately 0.10 cubic metres of concrete per post. For a four-post shade sail, budget approximately 0.44 cubic metres total including wastage, or about 48 bags of premix concrete. This quantity often makes ready-mix more practical than mixing bags.</p>

          <h3>Post Angle Considerations</h3>
          <p>Shade sail posts are typically installed with an outward lean of 10-15 degrees. This rake angle resists inward pull when the sail is tensioned. Set posts at the correct angle during concrete placement using angle guides, as adjustment after setting is impossible.</p>

          <h3>Height and Position Planning</h3>
          <p>Sail attachment points should be higher than the area they're shading by at least 2.5-3 metres for adequate clearance. Consider sun angles throughout the day and seasons when positioning posts. Incorrect positioning is expensive to rectify once concrete is poured.</p>

          <h3>Hardware Preparation</h3>
          <p>Install post cap plates or attachment hardware before concreting if they require welding to steel posts. For timber posts, ensure hardware can be bolted through after installation. Having all components ready before mixing concrete prevents delays during the time-sensitive setting process.</p>

          <h3>Council Requirements</h3>
          <p>Shade structures exceeding certain sizes require council approval in most Australian jurisdictions. Check local regulations before installing posts, as the approval process may specify particular engineering or installation requirements that affect your concrete calculations.</p>`,

  'concrete-for-pergola-posts': `
          <h2>Concrete for Pergola Post Footings</h2>

          <p>Pergola posts support roof structures that must withstand wind loads, their own weight, and potentially climbing plants or attachments. Proper footings are essential for structural integrity and long-term stability. Here's how to calculate concrete for a standard four-post pergola.</p>

          <h3>Typical Pergola Post Requirements</h3>
          <p>Most residential pergolas use 100mm posts in 350mm diameter holes at 700mm depth. This specification suits pergolas up to approximately 4x4 metres with open-roof designs. Larger pergolas, covered roofs, or pergolas in high-wind areas may require engineering assessment for specific footing requirements.</p>

          <h3>Four-Post Concrete Volume</h3>
          <p>Each 350mm × 700mm hole requires approximately 0.065 cubic metres of concrete after accounting for the post. Four posts therefore need roughly 0.29 cubic metres including wastage, equivalent to 31-32 bags of premix. This quantity is manageable as a bag-mixing project but substantial work.</p>

          <h3>Post Positioning Strategy</h3>
          <p>Accuracy in post positioning determines whether your pergola is square and your roof components fit correctly. Set out positions carefully using the 3-4-5 triangle method to verify right angles. Dig all holes before setting any posts, allowing final verification of positions.</p>

          <h3>Height Coordination</h3>
          <p>All posts must finish at the same height for level roof installation. Set one reference post first, then use a builder's level or laser level to transfer heights to remaining posts. Account for any slope in the ground when calculating hole depths to achieve level tops.</p>

          <h3>Bracing Requirements</h3>
          <p>Unlike quick-set fence posts, pergola posts require bracing while concrete cures. Install temporary braces to hold posts plumb in two directions. Leave braces in place for minimum 48 hours, longer in cool weather. Don't attach any roof components until concrete has achieved adequate strength.</p>

          <h3>Building Approval Considerations</h3>
          <p>Pergolas attached to houses typically require building approval. Even freestanding pergolas may need approval if they exceed certain sizes or are located within specific distances of boundaries. Verify requirements with your local council before commencing work.</p>`,

  'concrete-for-deck-posts': `
          <h2>Concrete for Deck Post Footings</h2>

          <p>Deck posts support substantial loads from the deck structure, furniture, and occupants. They also often support bearer ends and may be exposed to moisture at ground level. Proper footings ensure structural integrity and meet Australian building code requirements.</p>

          <h3>Standard Deck Post Footing Dimensions</h3>
          <p>For typical residential decks, 100mm posts in 300mm diameter holes at 600mm depth provide adequate support. Higher decks, larger spans, or heavy loads require engineering assessment for specific footing specifications. Your deck plans should specify footing requirements.</p>

          <h3>Concrete Requirements for Four Posts</h3>
          <p>Four footings at these dimensions require approximately 0.20 cubic metres of concrete including wastage. This translates to roughly 22 bags of 20kg premix concrete, a manageable quantity for DIY mixing. Standard concrete rather than quick-set is preferred for structural footings.</p>

          <h3>Stirrup and Bracket Installation</h3>
          <p>Most deck designs use steel stirrups set into the concrete footing rather than timber posts sitting directly in concrete. This keeps timber above ground level, dramatically extending post life. Set stirrup brackets into wet concrete at precise positions matching your deck framing layout.</p>

          <h3>Level and Alignment Critical</h3>
          <p>Deck posts must be precisely positioned for bearer and joist framing to work correctly. Set out positions using string lines and verify measurements multiple times before pouring concrete. Stirrup brackets set in wrong positions cannot be adjusted, requiring footing replacement.</p>

          <h3>Height Considerations</h3>
          <p>Unlike fence posts set to final height during concreting, deck posts are typically cut to height after bearers are positioned. Allow extra length for adjustment. The stirrup bracket establishes the bottom of the post; final height comes from the deck frame design.</p>

          <h3>Approval and Inspection</h3>
          <p>Most Australian jurisdictions require building approval for decks exceeding certain heights or sizes. Footings may require inspection before concrete placement and again before framing proceeds. Understand inspection timing to avoid delays or required rectification.</p>`
};

const volumeContent = {
  'how-many-bags-of-concrete-for-1-cubic-metre': `
          <h2>How Many Bags of Concrete for 1 Cubic Metre?</h2>

          <p>One cubic metre is a common reference point for concrete calculations, being the standard unit of measurement for ready-mix orders. Understanding how many bags make up a cubic metre helps you assess project scale and make informed decisions about sourcing.</p>

          <h3>The Standard Conversion</h3>
          <p>Boral, one of Australia's leading concrete suppliers, recommends approximately 108 bags of 20kg premix concrete per cubic metre. This figure accounts for typical mixing conditions and the air content of hand-mixed concrete. Other manufacturers may vary slightly, so check bag labelling for specific coverage rates.</p>

          <h3>Real-World Implications</h3>
          <p>Consider what 108 bags actually means. That's 2.16 tonnes of material to transport, store, and handle. Each bag requires water addition and mixing, taking approximately 3-5 minutes per bag even with a mixer. The full cubic metre therefore represents 5-9 hours of mixing time alone, plus placement and finishing.</p>

          <h3>When Bags Make Sense</h3>
          <p>Bagged concrete suits small projects where you're using well under one cubic metre. The practical limit for most DIYers is around 0.3-0.4 cubic metres, equivalent to 32-43 bags. Beyond this, ready-mix becomes more sensible despite minimum order requirements and delivery fees.</p>

          <h3>Cost Comparison</h3>
          <p>At $8.50-12.50 per bag, one cubic metre of bagged concrete costs $918-1,350. Ready-mix concrete typically costs $280-420 per cubic metre plus delivery fees of $100-200. For full cubic metre quantities, ready-mix is almost always more economical, plus it's consistent quality and requires far less labour.</p>

          <h3>Project Planning</h3>
          <p>If your project calculates to approximately one cubic metre, seriously consider ready-mix delivery. The time saved, consistent quality, and often lower cost make it the better choice for projects of this scale. Reserve bagged concrete for smaller jobs or situations where truck access is impossible.</p>

          <h3>Use Our Calculator</h3>
          <p>Rather than working backwards from volume, use our <a href="/">slab calculator</a> to input your actual dimensions. This gives you precise volume calculations with wastage included, then presents both bag counts and ready-mix options for easy comparison.</p>`,

  'how-many-bags-of-concrete-for-half-cubic-metre': `
          <h2>How Many Bags for 0.5 Cubic Metres of Concrete?</h2>

          <p>Half a cubic metre represents an important threshold in concrete project planning. It's large enough that ready-mix becomes a genuine option, yet small enough that bagged concrete remains practical for prepared DIYers. Understanding your options at this volume helps you make the right choice.</p>

          <h3>Bag Calculation</h3>
          <p>At 108 bags per cubic metre, half a cubic metre requires 54 bags of 20kg premix concrete. That's 1.08 tonnes of material requiring transport, storage, and mixing. While achievable as a DIY project, it represents a full day of intensive physical work.</p>

          <h3>Ready-Mix Considerations</h3>
          <p>Most ready-mix suppliers have minimum orders around 0.5 cubic metres, making half a cube the threshold where ordering becomes possible. Delivery fees typically range from $100-200, and some suppliers charge short-load penalties for orders under certain volumes. Call local suppliers for specific pricing.</p>

          <h3>Cost Analysis</h3>
          <p>54 bags at $8.50-12.50 each costs $459-675. Half a cubic metre of ready-mix costs approximately $140-210 for concrete plus delivery. Even with delivery fees, ready-mix is often cheaper while eliminating hours of mixing labour. The decision becomes whether you value your time and physical effort.</p>

          <h3>Project Examples</h3>
          <p>Common projects requiring approximately 0.5 cubic metres include: 3x2 metre patio at 100mm thickness, 5x1 metre path at 100mm, or 2.5x2 metre shed slab at 100mm. Our <a href="/">calculator</a> helps you determine exact requirements for your specific dimensions.</p>

          <h3>Mixing Approach</h3>
          <p>If proceeding with bags, rent a concrete mixer rather than mixing in wheelbarrows. Mixers dramatically reduce labour and produce more consistent results. Budget for mixer hire of $50-80 per day when calculating total project cost, and ensure you have adequate water supply at the pour location.</p>

          <h3>Timing Considerations</h3>
          <p>Mixing 54 bags takes several hours. Start early and maintain steady progress. Have all preparation complete before mixing begins, including formwork, reinforcement, and finishing tools at hand. You can't pause mid-pour, so ensure you have sufficient daylight and energy to complete the work.</p>`,

  'how-many-bags-of-concrete-for-0.3-cubic-metres': `
          <h2>How Many Bags for 0.3 Cubic Metres?</h2>

          <p>0.3 cubic metres sits in the sweet spot for DIY concrete projects. It's substantial enough to create useful structures yet manageable without professional assistance or equipment. This volume commonly arises in typical backyard improvement projects.</p>

          <h3>Bag Count</h3>
          <p>0.3 cubic metres requires 33 bags of 20kg premix concrete (rounding up from 32.4). At 660kg total weight, this is transportable in most trailers or utes, though multiple trips in a sedan are required. Plan transport logistics before purchasing.</p>

          <h3>Project Applications</h3>
          <p>Typical 0.3m³ projects include: 3x1 metre path at 100mm thick, 2x1.5 metre small patio at 100mm, multiple post footings, or stepping stone series. The volume is also common for repair and patch jobs on existing concrete.</p>

          <h3>Mixing Feasibility</h3>
          <p>33 bags is achievable with hand mixing in wheelbarrows, though a hired mixer makes the job considerably easier. Expect 2-3 hours for mixing alone, plus placement and finishing time. Having a helper significantly improves workflow and results.</p>

          <h3>Ready-Mix Viability</h3>
          <p>Most suppliers don't deliver less than 0.5 cubic metres, meaning ready-mix isn't usually an option for 0.3m³ projects. Some suppliers offer "mini-mix" services using smaller trucks, but availability varies by location. Check local options if mixing isn't appealing.</p>

          <h3>Cost Estimate</h3>
          <p>33 bags at typical prices of $8.50-12.50 costs $280-413. This makes smaller projects relatively affordable despite the per-bag premium compared to ready-mix. The cost is often comparable to hiring a professional for the concrete work alone.</p>

          <h3>Weather Planning</h3>
          <p>Projects at this scale typically take 3-4 hours from first mix to finished surface. Check forecasts carefully and have a realistic assessment of available daylight. Starting a 0.3m³ pour in late afternoon risks running out of light before finishing is complete.</p>`,

  'how-many-bags-of-concrete-for-0.2-cubic-metres': `
          <h2>How Many Bags for 0.2 Cubic Metres?</h2>

          <p>0.2 cubic metres is a comfortable scale for weekend DIY projects. It's enough concrete for meaningful improvements while remaining manageable for solo workers or small teams without specialised equipment. Many first-time concreters successfully complete projects at this scale.</p>

          <h3>Bag Requirements</h3>
          <p>0.2 cubic metres equals approximately 22 bags of 20kg concrete (21.6 rounded up). The 440kg total weight fits in most trailers or can be transported in two ute loads. Storage requires about one square metre of dry floor space while awaiting use.</p>

          <h3>Typical Projects</h3>
          <p>Common 0.2m³ applications include: 2x1 metre patio or path at 100mm, letterbox footing, multiple fence post holes, small equipment pad, or step landing. This volume also suits making concrete planters or garden features requiring substantial thickness.</p>

          <h3>Solo Worker Friendly</h3>
          <p>22 bags is manageable for a single motivated worker, though having assistance makes the work easier and faster. With hand mixing, budget 90-120 minutes for mixing alone. A rented mixer reduces this significantly while improving consistency.</p>

          <h3>Material Cost</h3>
          <p>At $8.50-12.50 per bag, 22 bags costs $187-275. This modest investment makes small concrete improvements accessible for most budgets. Compare this to professional labour charges of $60-100 per hour to appreciate the DIY savings.</p>

          <h3>Execution Tips</h3>
          <p>For projects this size, prepare everything before mixing your first bag. Set formwork, position reinforcement if required, gather finishing tools, and ensure water supply is ready. Once mixing starts, maintain steady progress through to completion without extended breaks.</p>

          <h3>Quality Assurance</h3>
          <p>Smaller pours are more forgiving for beginners. You have time to correct mistakes, and inconsistencies are less apparent on modest-scale work. Use these smaller projects to develop skills before tackling larger, more demanding pours.</p>`,

  'how-many-bags-of-concrete-for-0.1-cubic-metres': `
          <h2>How Many Bags for 0.1 Cubic Metres?</h2>

          <p>0.1 cubic metres represents small-scale concrete work ideal for beginners or minor improvements. At this volume, bagged concrete is clearly the practical choice, and projects are easily completed in a few hours. It's perfect for learning concrete basics before tackling larger projects.</p>

          <h3>Bag Count</h3>
          <p>0.1 cubic metres requires just 11 bags of 20kg concrete mix. At 220kg total, this fits easily in any vehicle and stores without difficulty. Most hardware stores have this quantity readily available off the shelf.</p>

          <h3>Project Examples</h3>
          <p>Typical 0.1m³ uses include: 1x1 metre stepping stone at 100mm, 2-3 fence post holes, small equipment pad, path repair section, letterbox base, or decorative garden features. The volume is also common for setting heavy objects like fountains or statuary.</p>

          <h3>Mixing Approach</h3>
          <p>11 bags can be easily mixed in wheelbarrows without mechanical assistance. Mix 2-3 bags at a time, maintaining a consistent water ratio for uniform results. Total mixing time is under an hour, making this a manageable task for most people.</p>

          <h3>Cost</h3>
          <p>At $8.50-12.50 per bag, 11 bags costs just $94-138. This minimal investment makes small concrete projects highly accessible. Consider this affordable entry point for experimenting with concrete techniques before committing to larger projects.</p>

          <h3>Same-Day Completion</h3>
          <p>Projects at 0.1m³ scale comfortably complete in half a day, including preparation, mixing, placement, and basic finishing. This makes them ideal for weekend projects where you want visible results without consuming entire days.</p>

          <h3>Learning Opportunity</h3>
          <p>Small projects offer low-stakes practice for concrete techniques. Experiment with different finishes, try decorative treatments, or simply develop your basic skills. Mistakes at this scale are easily corrected or lived with while you build confidence for larger work.</p>`,

  'how-many-bags-of-concrete-for-1-square-metre': `
          <h2>How Many Bags for 1 Square Metre of Concrete?</h2>

          <p>Concrete volume depends on three dimensions, not just area. One square metre of concrete requires vastly different material quantities depending on thickness. This guide clarifies the relationship between area, thickness, and concrete requirements.</p>

          <h3>The Missing Dimension</h3>
          <p>When someone asks about "one square metre of concrete," they usually mean a slab one metre by one metre at some assumed thickness. The standard assumption is 100mm depth, which is typical for paths, patios, and shed bases in Australia. At this thickness, 1m² requires 0.1 cubic metres of concrete.</p>

          <h3>Bag Count at Standard Thickness</h3>
          <p>For one square metre at 100mm thick, you need 11 bags of 20kg concrete mix (0.1m³ × 108 bags). This modest quantity is readily managed as a simple DIY project. The same area at different thicknesses requires proportionally different quantities.</p>

          <h3>Thickness Variations</h3>
          <p>At 75mm (paths): 8-9 bags per square metre. At 100mm (standard): 11 bags per square metre. At 125mm (driveways): 14 bags per square metre. At 150mm (heavy duty): 17 bags per square metre. Choose thickness based on intended use, not arbitrary preference.</p>

          <h3>Area-Based Planning</h3>
          <p>For larger areas, multiply square metres by the per-square-metre bag count for your chosen thickness. A 10 square metre patio at 100mm needs approximately 110 bags. Our <a href="/">calculator</a> handles these conversions automatically when you enter length, width, and depth.</p>

          <h3>Why We Calculate by Volume</h3>
          <p>Professional concrete work always uses volume (cubic metres) rather than area because thickness is variable and critical. Ordering ready-mix in cubic metres, calculating reinforcement for volume, and estimating labour all depend on accurate volume figures rather than just surface area.</p>

          <h3>Practical Application</h3>
          <p>For most planning purposes, remember that each square metre at 100mm thickness needs roughly 11 bags. This quick mental calculation helps assess project scale when you're measuring areas. For precise ordering, use our calculator with exact dimensions to avoid shortfalls or excess.</p>`
};

const footingContent = {
  'concrete-for-shed-footings': `
          <h2>Concrete for Shed Footings (4 Pad Footings)</h2>

          <p>Many sheds don't require full slabs, instead using pad footings at corner positions to support bearers. This approach uses less concrete, simplifies construction, and suits sheds where a full floor isn't needed. Here's how to calculate concrete for standard four-pad shed footings.</p>

          <h3>Standard Pad Footing Dimensions</h3>
          <p>For typical garden sheds, 400x400mm pad footings at 300mm depth provide adequate support. This size handles loads from small to medium sheds effectively. Larger sheds or those storing heavy equipment may require bigger footings, as specified by the shed manufacturer or an engineer.</p>

          <h3>Concrete Volume for Four Footings</h3>
          <p>Each 400x400x300mm footing requires 0.048 cubic metres of concrete. Four footings total 0.192 cubic metres, or approximately 0.21m³ with wastage. This equates to 23 bags of premix concrete, a manageable quantity for DIY installation.</p>

          <h3>Excavation and Preparation</h3>
          <p>Dig square holes slightly larger than footing dimensions to allow formwork installation. Remove loose material from hole bottoms and compact the base. Place 50mm of compacted gravel in each hole for drainage before pouring concrete.</p>

          <h3>Stirrup Bracket Installation</h3>
          <p>Most bearer arrangements use galvanised stirrup brackets set into the wet concrete. Position brackets accurately to match bearer spacing and ensure they're level with each other across all four footings. Use string lines stretched between corner positions to verify alignment.</p>

          <h3>Level Consistency</h3>
          <p>All four footings must finish at the same level for bearers to sit correctly. Use a dumpy level, laser level, or water level to establish consistent heights. Natural ground slopes require adjusted excavation depths to achieve level footing tops.</p>

          <h3>Council and Compliance</h3>
          <p>Sheds over certain sizes require council approval, including footing specifications. Check local requirements before proceeding. Even exempt-development sheds may need to comply with particular standards for wind rating and footing design.</p>`,

  'concrete-for-deck-footings': `
          <h2>Concrete for Deck Footings (6 Pad Footings)</h2>

          <p>Decks rely on concrete footings to transfer structural loads to the ground. The number and size of footings depends on deck dimensions, expected loads, and soil conditions. This guide covers standard six-footing arrangements for typical residential decks.</p>

          <h3>Standard Deck Footing Specifications</h3>
          <p>Most residential deck plans specify 450x450mm pad footings at 400mm depth. This size supports typical deck loads while providing adequate resistance to lateral forces. Your deck design should include specific footing requirements, as these vary based on deck dimensions and post spacing.</p>

          <h3>Concrete Volume Calculation</h3>
          <p>Each 450x450x400mm footing requires approximately 0.081 cubic metres of concrete. Six footings total 0.486m³, or approximately 0.54m³ with wastage allowance. This translates to 58 bags of premix, approaching the threshold where ready-mix becomes practical.</p>

          <h3>Position Accuracy Critical</h3>
          <p>Deck footings must align precisely with post positions from your deck plan. Set out positions using builder's string lines and verify dimensions multiple times. Square decks require careful checking of diagonals to confirm right angles before excavation begins.</p>

          <h3>Height Coordination</h3>
          <p>While finished deck height comes from post length and framing details, footing positions must account for expected finished levels. Consider bearer and joist depths plus any anticipated ground level changes when establishing footing depths.</p>

          <h3>Steel Stirrup Requirements</h3>
          <p>Building codes require timber deck posts to be kept above ground level. Galvanised steel stirrup brackets cast into footings support posts while maintaining clearance. Stirrup sizes must match your post dimensions; verify compatibility before concreting.</p>

          <h3>Inspection Points</h3>
          <p>Most deck projects require building approval with staged inspections. Footings typically need inspection before concrete placement (hole depth and position) and again after curing before framing proceeds. Understand your inspection requirements to avoid delays or rejected work.</p>`
};

// ============================================================================
// PAGE GENERATORS
// ============================================================================

function generateSlabPage(pageData) {
  const volume = calculateSlabVolume(pageData.length, pageData.width, pageData.depth, pageData.wastage);
  const bags = calculateBags(volume);
  const bagCostMin = bags * BAG_COST_MIN;
  const bagCostMax = bags * BAG_COST_MAX;
  const readymixCostMin = volume * READYMIX_COST_MIN;
  const readymixCostMax = volume * READYMIX_COST_MAX;

  const thicknessMm = pageData.depth * 1000;
  const calcLink = `/?l=${pageData.length}&w=${pageData.width}&d=${pageData.depth}&waste=${pageData.wastage}`;

  const faqs = [
    {
      question: `How many bags of concrete for a ${pageData.titleKeyword.toLowerCase()}?`,
      answer: `A ${pageData.length}m × ${pageData.width}m slab at ${thicknessMm}mm thick requires approximately ${formatNumber(volume, 2)} cubic metres of concrete, which equals ${bags} bags of 20kg premix concrete (including 10% wastage).`
    },
    {
      question: `How thick should a ${pageData.titleKeyword.toLowerCase().replace(/\(.*\)/, '').trim()} be?`,
      answer: `For most ${pageData.titleKeyword.toLowerCase().includes('driveway') || pageData.titleKeyword.toLowerCase().includes('garage') ? 'vehicle' : 'residential'} applications, ${thicknessMm}mm thickness is recommended. This provides adequate strength for ${pageData.titleKeyword.toLowerCase().includes('driveway') || pageData.titleKeyword.toLowerCase().includes('garage') ? 'vehicle loads' : 'typical use'} while remaining cost-effective.`
    },
    {
      question: `Should I use bags or ready-mix for a ${pageData.titleKeyword.toLowerCase()}?`,
      answer: volume >= 0.5
        ? `At ${formatNumber(volume, 2)}m³, ready-mix concrete is usually more practical and cost-effective than mixing ${bags} bags by hand. Ready-mix costs approximately ${formatCurrency(readymixCostMin)}-${formatCurrency(readymixCostMax)} delivered.`
        : `At ${formatNumber(volume, 2)}m³, bags are usually practical for DIY. ${bags} bags of premix costs approximately ${formatCurrency(bagCostMin)}-${formatCurrency(bagCostMax)}.`
    }
  ];

  const page = {
    slug: pageData.slug,
    title: `How Much Concrete for a ${pageData.titleKeyword}? | Concrete Calculator Australia`,
    ogTitle: `Concrete for ${pageData.titleKeyword} - Calculator`,
    metaDescription: `A ${pageData.length}m × ${pageData.width}m ${pageData.titleKeyword.toLowerCase()} needs ${formatNumber(volume, 2)}m³ of concrete (${bags} bags). Free Australian calculator with instant cost estimates.`,
    faqs
  };

  const seoContent = slabContent[pageData.slug] || `
          <h2>Calculating Concrete for a ${pageData.titleKeyword}</h2>
          <p>This ${pageData.length}m × ${pageData.width}m slab at ${thicknessMm}mm thickness requires ${formatNumber(volume, 2)} cubic metres of concrete. Use our calculator above to adjust dimensions for your specific project.</p>`;

  const relatedPages = data.slabPages
    .filter(p => p.slug !== pageData.slug)
    .slice(0, 3)
    .map(p => ({ slug: p.slug, title: p.titleKeyword, type: 'slab' }));

  return `${headTemplate(page)}
${headerTemplate}

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>How Much Concrete for a ${pageData.titleKeyword}?</h1>
        <p>Here's exactly how much concrete you need, pre-calculated with standard Australian specifications.</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Pre-calculated Results -->
        <section class="calculator-section">
          <div class="calculator-card">
            <div class="calculator-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <h2>Your Concrete Requirements</h2>
            </div>

            <div class="calculator-body">
              <div class="info-box info-box--tip" style="margin-bottom: var(--space-6);">
                <div class="info-box-content">
                  <strong>Dimensions:</strong> ${pageData.length}m × ${pageData.width}m × ${thicknessMm}mm thick (${pageData.wastage}% wastage included)
                </div>
              </div>

              <div class="results-panel">
                <div class="results-grid">
                  <div class="result-item result-item--primary">
                    <span class="result-label">Total Volume</span>
                    <span class="result-value">${formatNumber(volume, 2)} m³</span>
                    <span class="result-subtext">Including ${pageData.wastage}% wastage</span>
                  </div>

                  <div class="result-item result-item--primary">
                    <span class="result-label">20kg Bags Needed</span>
                    <span class="result-value">${bags}</span>
                    <span class="result-subtext">Standard concrete bags</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Estimated Bag Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(bagCostMin)} – ${formatCurrency(bagCostMax)}</div>
                    <span class="result-subtext">Based on $8.50-$12.50/bag</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Ready-Mix Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(readymixCostMin)} – ${formatCurrency(readymixCostMax)}</div>
                    <span class="result-subtext">Delivered, varies by region</span>
                  </div>
                </div>

                <div style="margin-top: var(--space-6); text-align: center;">
                  <a href="${calcLink}" class="share-btn share-btn--share" style="display: inline-flex; text-decoration: none; padding: var(--space-3) var(--space-6);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 18px; height: 18px;">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <line x1="8" y1="6" x2="16" y2="6"/>
                      <line x1="8" y1="10" x2="16" y2="10"/>
                      <line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                    Adjust These Numbers →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SEO Content -->
        <article class="seo-content">
${seoContent}

          <h3>Need Different Dimensions?</h3>
          <p>Use our <a href="/">concrete slab calculator</a> to enter your exact measurements and get instant results. You can also compare <a href="/bags-vs-readymix/">bags vs ready-mix</a> costs for your specific project volume.</p>
        </article>

        <!-- Related Calculations -->
        <section class="related-section">
          <h2 class="section-title">Related Calculations</h2>
          <div class="related-grid">
${relatedPages.map(p => `
            <a href="/${p.slug}/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
              </svg>
              <h3>Concrete for ${p.title}</h3>
              <p>Pre-calculated volume and bag count.</p>
              <span class="card-arrow">View →</span>
            </a>`).join('')}

            <a href="/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
              </svg>
              <h3>Slab Calculator</h3>
              <p>Enter custom dimensions.</p>
              <span class="card-arrow">Calculate →</span>
            </a>
          </div>
        </section>
      </div>
    </main>
${footerTemplate}`;
}

function generatePostHolePage(pageData) {
  const volume = calculatePostHoleVolume(
    pageData.holeDiameter,
    pageData.holeDepth,
    pageData.postWidth,
    pageData.postShape,
    pageData.count
  );
  const bags = calculateBags(volume);
  const bagCostMin = bags * BAG_COST_MIN;
  const bagCostMax = bags * BAG_COST_MAX;

  const calcLink = `/post-hole-calculator/?hd=${pageData.holeDiameter}&hh=${pageData.holeDepth}&pw=${pageData.postWidth}&n=${pageData.count}&waste=10`;

  const faqs = [
    {
      question: `How much concrete for ${pageData.titleKeyword.toLowerCase()}?`,
      answer: `For ${pageData.count === 1 ? 'a' : pageData.count} ${pageData.holeDiameter}mm diameter hole${pageData.count > 1 ? 's' : ''} at ${pageData.holeDepth}mm deep with ${pageData.postWidth}mm posts, you need approximately ${formatNumber(volume, 3)} cubic metres of concrete, or ${bags} bags of 20kg post mix.`
    },
    {
      question: `How deep should ${pageData.titleKeyword.toLowerCase().includes('fence') ? 'fence' : ''} post holes be?`,
      answer: `Post hole depth should be approximately one-third of the total post length for fence posts, with ${pageData.holeDepth}mm being a common depth for ${pageData.titleKeyword.toLowerCase()}.`
    }
  ];

  const page = {
    slug: pageData.slug,
    title: `How Much Concrete for ${pageData.titleKeyword}? | Concrete Calculator Australia`,
    ogTitle: `Concrete for ${pageData.titleKeyword} - Calculator`,
    metaDescription: `${pageData.titleKeyword} (${pageData.holeDiameter}mm × ${pageData.holeDepth}mm hole) needs ${formatNumber(volume, 3)}m³ of concrete (${bags} bags). Free Australian calculator.`,
    faqs
  };

  const seoContent = postHoleContent[pageData.slug] || `
          <h2>Calculating Concrete for ${pageData.titleKeyword}</h2>
          <p>For ${pageData.count === 1 ? 'a' : pageData.count} ${pageData.holeDiameter}mm diameter hole${pageData.count > 1 ? 's' : ''} at ${pageData.holeDepth}mm deep, you need ${formatNumber(volume, 3)} cubic metres of concrete. Use our calculator to adjust for your specific requirements.</p>`;

  const relatedPages = data.postHolePages
    .filter(p => p.slug !== pageData.slug)
    .slice(0, 3)
    .map(p => ({ slug: p.slug, title: p.titleKeyword }));

  return `${headTemplate(page)}
${headerTemplate}

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>How Much Concrete for ${pageData.titleKeyword}?</h1>
        <p>Here's exactly how much concrete you need, pre-calculated with standard Australian specifications.</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Pre-calculated Results -->
        <section class="calculator-section">
          <div class="calculator-card">
            <div class="calculator-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <h2>Your Concrete Requirements</h2>
            </div>

            <div class="calculator-body">
              <div class="info-box info-box--tip" style="margin-bottom: var(--space-6);">
                <div class="info-box-content">
                  <strong>Specifications:</strong> ${pageData.count}× hole${pageData.count > 1 ? 's' : ''} @ ${pageData.holeDiameter}mm diameter × ${pageData.holeDepth}mm deep, ${pageData.postWidth}mm ${pageData.postShape} post${pageData.count > 1 ? 's' : ''}
                </div>
              </div>

              <div class="results-panel">
                <div class="results-grid">
                  <div class="result-item result-item--primary">
                    <span class="result-label">Total Volume</span>
                    <span class="result-value">${formatNumber(volume, 3)} m³</span>
                    <span class="result-subtext">Including 10% wastage</span>
                  </div>

                  <div class="result-item result-item--primary">
                    <span class="result-label">20kg Bags Needed</span>
                    <span class="result-value">${bags}</span>
                    <span class="result-subtext">Post mix concrete</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Estimated Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(bagCostMin)} – ${formatCurrency(bagCostMax)}</div>
                    <span class="result-subtext">Based on $8.50-$12.50/bag</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Per Post</span>
                    <div class="result-value result-value--small">${formatNumber(volume / pageData.count, 4)} m³</div>
                    <span class="result-subtext">Concrete per hole</span>
                  </div>
                </div>

                <div style="margin-top: var(--space-6); text-align: center;">
                  <a href="${calcLink}" class="share-btn share-btn--share" style="display: inline-flex; text-decoration: none; padding: var(--space-3) var(--space-6);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 18px; height: 18px;">
                      <circle cx="12" cy="12" r="10"/>
                      <circle cx="12" cy="12" r="4"/>
                    </svg>
                    Adjust These Numbers →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SEO Content -->
        <article class="seo-content">
${seoContent}

          <h3>Need Different Specifications?</h3>
          <p>Use our <a href="/post-hole-calculator/">post hole calculator</a> to enter your exact hole dimensions and post size. You can also explore our <a href="/">slab calculator</a> or <a href="/footing-calculator/">footing calculator</a> for other concrete projects.</p>
        </article>

        <!-- Related Calculations -->
        <section class="related-section">
          <h2 class="section-title">Related Calculations</h2>
          <div class="related-grid">
${relatedPages.map(p => `
            <a href="/${p.slug}/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <h3>Concrete for ${p.title}</h3>
              <p>Pre-calculated volume and bag count.</p>
              <span class="card-arrow">View →</span>
            </a>`).join('')}

            <a href="/post-hole-calculator/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <h3>Post Hole Calculator</h3>
              <p>Enter custom dimensions.</p>
              <span class="card-arrow">Calculate →</span>
            </a>
          </div>
        </section>
      </div>
    </main>
${footerTemplate}`;
}

function generateVolumePage(pageData) {
  const bagCostMin = pageData.bags * BAG_COST_MIN;
  const bagCostMax = pageData.bags * BAG_COST_MAX;
  const readymixCostMin = pageData.volume * READYMIX_COST_MIN;
  const readymixCostMax = pageData.volume * READYMIX_COST_MAX;

  const faqs = [
    {
      question: `How many bags of concrete for ${pageData.titleKeyword.toLowerCase()}?`,
      answer: `${pageData.titleKeyword} of concrete requires ${pageData.bags} bags of 20kg premix concrete, based on Boral's recommendation of 108 bags per cubic metre.`
    },
    {
      question: `How much does ${pageData.titleKeyword.toLowerCase()} of concrete cost?`,
      answer: `In bags: approximately ${formatCurrency(bagCostMin)}-${formatCurrency(bagCostMax)} for ${pageData.bags} bags. As ready-mix: approximately ${formatCurrency(readymixCostMin)}-${formatCurrency(readymixCostMax)} plus delivery.`
    }
  ];

  const page = {
    slug: pageData.slug,
    title: `How Many Bags of Concrete for ${pageData.titleKeyword}? | Calculator`,
    ogTitle: `Bags of Concrete for ${pageData.titleKeyword}`,
    metaDescription: `${pageData.titleKeyword} of concrete needs ${pageData.bags} bags of 20kg premix. Cost: ${formatCurrency(bagCostMin)}-${formatCurrency(bagCostMax)}. Free Australian concrete calculator.`,
    faqs
  };

  const seoContent = volumeContent[pageData.slug] || `
          <h2>Bags of Concrete for ${pageData.titleKeyword}</h2>
          <p>${pageData.titleKeyword} requires ${pageData.bags} bags of 20kg premix concrete. Use our calculators to determine the volume needed for your specific project dimensions.</p>`;

  return `${headTemplate(page)}
${headerTemplate}

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>How Many Bags of Concrete for ${pageData.titleKeyword}?</h1>
        <p>Quick answer: <strong>${pageData.bags} bags</strong> of 20kg premix concrete.</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Pre-calculated Results -->
        <section class="calculator-section">
          <div class="calculator-card">
            <div class="calculator-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <h2>Concrete Requirements for ${pageData.volume}m³</h2>
            </div>

            <div class="calculator-body">
              <div class="results-panel">
                <div class="results-grid">
                  <div class="result-item result-item--primary">
                    <span class="result-label">Volume</span>
                    <span class="result-value">${pageData.volume} m³</span>
                    <span class="result-subtext">${pageData.titleKeyword}</span>
                  </div>

                  <div class="result-item result-item--primary">
                    <span class="result-label">20kg Bags Needed</span>
                    <span class="result-value">${pageData.bags}</span>
                    <span class="result-subtext">Based on 108 bags/m³</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Bag Cost Estimate</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(bagCostMin)} – ${formatCurrency(bagCostMax)}</div>
                    <span class="result-subtext">At $8.50-$12.50/bag</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Ready-Mix Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(readymixCostMin)} – ${formatCurrency(readymixCostMax)}</div>
                    <span class="result-subtext">Plus delivery fees</span>
                  </div>
                </div>

                <div style="margin-top: var(--space-6); text-align: center;">
                  <a href="/" class="share-btn share-btn--share" style="display: inline-flex; text-decoration: none; padding: var(--space-3) var(--space-6);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 18px; height: 18px;">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <line x1="8" y1="6" x2="16" y2="6"/>
                    </svg>
                    Calculate From Dimensions →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SEO Content -->
        <article class="seo-content">
${seoContent}
        </article>

        <!-- Related Calculations -->
        <section class="related-section">
          <h2 class="section-title">Calculate By Dimensions</h2>
          <div class="related-grid">
            <a href="/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
              </svg>
              <h3>Slab Calculator</h3>
              <p>Enter length, width, and depth.</p>
              <span class="card-arrow">Calculate →</span>
            </a>

            <a href="/post-hole-calculator/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <h3>Post Hole Calculator</h3>
              <p>For fence posts and footings.</p>
              <span class="card-arrow">Calculate →</span>
            </a>

            <a href="/bags-vs-readymix/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 3v18h18"/>
                <path d="M7 16l4-8 4 5 5-9"/>
              </svg>
              <h3>Bags vs Ready-Mix</h3>
              <p>Compare costs for your volume.</p>
              <span class="card-arrow">Compare →</span>
            </a>
          </div>
        </section>
      </div>
    </main>
${footerTemplate}`;
}

function generateFootingPage(pageData) {
  const volume = calculateFootingVolume(pageData.length, pageData.width, pageData.depth, pageData.count, pageData.wastage);
  const bags = calculateBags(volume);
  const bagCostMin = bags * BAG_COST_MIN;
  const bagCostMax = bags * BAG_COST_MAX;
  const readymixCostMin = volume * READYMIX_COST_MIN;
  const readymixCostMax = volume * READYMIX_COST_MAX;

  const lengthMm = pageData.length * 1000;
  const widthMm = pageData.width * 1000;
  const depthMm = pageData.depth * 1000;
  const calcLink = `/footing-calculator/?l=${pageData.length}&w=${pageData.width}&d=${pageData.depth}&n=${pageData.count}&waste=${pageData.wastage}`;

  const faqs = [
    {
      question: `How much concrete for ${pageData.titleKeyword.toLowerCase()}?`,
      answer: `${pageData.count} pad footings at ${lengthMm}×${widthMm}mm × ${depthMm}mm deep require approximately ${formatNumber(volume, 2)} cubic metres of concrete, or ${bags} bags of 20kg premix.`
    },
    {
      question: `What size footings do I need for a ${pageData.titleKeyword.toLowerCase().includes('shed') ? 'shed' : 'deck'}?`,
      answer: `Standard ${pageData.titleKeyword.toLowerCase().includes('shed') ? 'shed' : 'deck'} pad footings are typically ${lengthMm}×${widthMm}mm at ${depthMm}mm depth. Larger structures may require engineering assessment for specific requirements.`
    }
  ];

  const page = {
    slug: pageData.slug,
    title: `How Much Concrete for ${pageData.titleKeyword}? | Concrete Calculator Australia`,
    ogTitle: `Concrete for ${pageData.titleKeyword}`,
    metaDescription: `${pageData.titleKeyword} (${pageData.count}× ${lengthMm}×${widthMm}×${depthMm}mm pads) need ${formatNumber(volume, 2)}m³ of concrete (${bags} bags). Free Australian calculator.`,
    faqs
  };

  const seoContent = footingContent[pageData.slug] || `
          <h2>Calculating Concrete for ${pageData.titleKeyword}</h2>
          <p>${pageData.count} footings at ${lengthMm}×${widthMm}mm × ${depthMm}mm deep require ${formatNumber(volume, 2)} cubic metres of concrete. Use our calculator to adjust for your specific project.</p>`;

  return `${headTemplate(page)}
${headerTemplate}

    <!-- Hero -->
    <section class="hero">
      <div class="container">
        <h1>How Much Concrete for ${pageData.titleKeyword}?</h1>
        <p>Here's exactly how much concrete you need, pre-calculated with standard Australian specifications.</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="main-content">
      <div class="container">
        <!-- Pre-calculated Results -->
        <section class="calculator-section">
          <div class="calculator-card">
            <div class="calculator-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="14" width="18" height="8" rx="1"/>
                <path d="M12 4v10"/>
              </svg>
              <h2>Your Concrete Requirements</h2>
            </div>

            <div class="calculator-body">
              <div class="info-box info-box--tip" style="margin-bottom: var(--space-6);">
                <div class="info-box-content">
                  <strong>Specifications:</strong> ${pageData.count}× pad footings @ ${lengthMm}×${widthMm}mm × ${depthMm}mm deep (${pageData.wastage}% wastage included)
                </div>
              </div>

              <div class="results-panel">
                <div class="results-grid">
                  <div class="result-item result-item--primary">
                    <span class="result-label">Total Volume</span>
                    <span class="result-value">${formatNumber(volume, 2)} m³</span>
                    <span class="result-subtext">Including ${pageData.wastage}% wastage</span>
                  </div>

                  <div class="result-item result-item--primary">
                    <span class="result-label">20kg Bags Needed</span>
                    <span class="result-value">${bags}</span>
                    <span class="result-subtext">Standard concrete bags</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Estimated Bag Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(bagCostMin)} – ${formatCurrency(bagCostMax)}</div>
                    <span class="result-subtext">Based on $8.50-$12.50/bag</span>
                  </div>

                  <div class="result-item">
                    <span class="result-label">Ready-Mix Cost</span>
                    <div class="cost-range result-value result-value--small">${formatCurrency(readymixCostMin)} – ${formatCurrency(readymixCostMax)}</div>
                    <span class="result-subtext">Delivered, varies by region</span>
                  </div>
                </div>

                <div style="margin-top: var(--space-6); text-align: center;">
                  <a href="${calcLink}" class="share-btn share-btn--share" style="display: inline-flex; text-decoration: none; padding: var(--space-3) var(--space-6);">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width: 18px; height: 18px;">
                      <rect x="3" y="14" width="18" height="8" rx="1"/>
                    </svg>
                    Adjust These Numbers →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- SEO Content -->
        <article class="seo-content">
${seoContent}

          <h3>Need Different Specifications?</h3>
          <p>Use our <a href="/footing-calculator/">footing calculator</a> to enter your exact dimensions. You can also explore our <a href="/">slab calculator</a> if you're considering a full slab instead of footings.</p>
        </article>

        <!-- Related Calculations -->
        <section class="related-section">
          <h2 class="section-title">Related Calculators</h2>
          <div class="related-grid">
            <a href="/footing-calculator/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="14" width="18" height="8" rx="1"/>
                <path d="M12 4v10"/>
              </svg>
              <h3>Footing Calculator</h3>
              <p>Enter custom footing dimensions.</p>
              <span class="card-arrow">Calculate →</span>
            </a>

            <a href="/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
              </svg>
              <h3>Slab Calculator</h3>
              <p>For full concrete slabs.</p>
              <span class="card-arrow">Calculate →</span>
            </a>

            <a href="/post-hole-calculator/" class="related-card">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="4"/>
              </svg>
              <h3>Post Hole Calculator</h3>
              <p>For post footings.</p>
              <span class="card-arrow">Calculate →</span>
            </a>
          </div>
        </section>
      </div>
    </main>
${footerTemplate}`;
}

// ============================================================================
// SITEMAP GENERATOR
// ============================================================================

function generateSitemap(allSlugs) {
  const existingPages = [
    { loc: '', priority: '1.0' },
    { loc: 'concrete-slab-calculator/', priority: '0.9' },
    { loc: 'post-hole-calculator/', priority: '0.8' },
    { loc: 'footing-calculator/', priority: '0.8' },
    { loc: 'column-calculator/', priority: '0.7' },
    { loc: 'circular-slab-calculator/', priority: '0.7' },
    { loc: 'bags-vs-readymix/', priority: '0.8' }
  ];

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Existing pages
  existingPages.forEach(page => {
    sitemap += `  <url>
    <loc>${DOMAIN}/${page.loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  });

  // Long-tail pages
  allSlugs.forEach(slug => {
    sitemap += `  <url>
    <loc>${DOMAIN}/${slug}/</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
  });

  sitemap += `</urlset>
`;

  return sitemap;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log('🚀 Generating long-tail pages...\n');

  const allSlugs = [];
  let pagesGenerated = 0;

  // Generate slab pages
  console.log('📄 Generating slab pages...');
  data.slabPages.forEach(page => {
    const html = generateSlabPage(page);
    const dir = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    allSlugs.push(page.slug);
    pagesGenerated++;
    console.log(`   ✓ ${page.slug}/`);
  });

  // Generate post hole pages
  console.log('\n📄 Generating post hole pages...');
  data.postHolePages.forEach(page => {
    const html = generatePostHolePage(page);
    const dir = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    allSlugs.push(page.slug);
    pagesGenerated++;
    console.log(`   ✓ ${page.slug}/`);
  });

  // Generate volume pages
  console.log('\n📄 Generating volume pages...');
  data.volumePages.forEach(page => {
    const html = generateVolumePage(page);
    const dir = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    allSlugs.push(page.slug);
    pagesGenerated++;
    console.log(`   ✓ ${page.slug}/`);
  });

  // Generate footing pages
  console.log('\n📄 Generating footing pages...');
  data.footingPages.forEach(page => {
    const html = generateFootingPage(page);
    const dir = path.join(ROOT_DIR, page.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    allSlugs.push(page.slug);
    pagesGenerated++;
    console.log(`   ✓ ${page.slug}/`);
  });

  // Update sitemap
  console.log('\n📄 Updating sitemap.xml...');
  const sitemap = generateSitemap(allSlugs);
  fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemap);
  console.log('   ✓ sitemap.xml updated');

  console.log(`\n✅ Done! Generated ${pagesGenerated} long-tail pages.`);
  console.log(`📍 Sitemap updated with ${allSlugs.length} new URLs.`);
}

main();
