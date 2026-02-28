/**
 * Australian Concrete Calculator - Pure Calculation Functions
 * No DOM dependencies - all functions take inputs and return results objects
 */

// ===== CONSTANTS =====
const CONSTANTS = {
  // Bags per cubic metre (based on Boral 20kg standard concrete bags)
  BAGS_PER_CUBIC_METRE: 108,

  // Default wastage percentage
  DEFAULT_WASTAGE: 10,

  // Bag pricing (AUD)
  BAG_PRICE_MIN: 8.50,
  BAG_PRICE_MAX: 12.50,
  BAG_PRICE_DEFAULT: 10.00,

  // Ready-mix pricing per cubic metre by state (AUD)
  READYMIX_PRICES: {
    nsw: { min: 250, max: 380, label: 'NSW' },
    vic: { min: 240, max: 360, label: 'Victoria' },
    qld: { min: 230, max: 350, label: 'Queensland' },
    wa: { min: 260, max: 400, label: 'Western Australia' },
    sa: { min: 240, max: 370, label: 'South Australia' },
    tas: { min: 280, max: 420, label: 'Tasmania' },
    nt: { min: 300, max: 450, label: 'Northern Territory' },
    act: { min: 250, max: 380, label: 'ACT' }
  },

  // Average ready-mix price for general estimates
  READYMIX_PRICE_MIN: 200,
  READYMIX_PRICE_MAX: 420,

  // Minimum order for ready-mix (cubic metres)
  READYMIX_MINIMUM_ORDER: 0.5,

  // Pi for circular calculations
  PI: Math.PI
};

// ===== UTILITY FUNCTIONS =====

/**
 * Convert millimetres to metres
 * @param {number} mm - Value in millimetres
 * @returns {number} Value in metres
 */
function mmToMetres(mm) {
  return mm / 1000;
}

/**
 * Convert metres to millimetres
 * @param {number} m - Value in metres
 * @returns {number} Value in millimetres
 */
function metresToMm(m) {
  return m * 1000;
}

/**
 * Apply wastage factor to a volume
 * @param {number} volume - Base volume in cubic metres
 * @param {number} wastagePercent - Wastage percentage (e.g., 10 for 10%)
 * @returns {number} Volume with wastage applied
 */
function applyWastage(volume, wastagePercent) {
  return volume * (1 + wastagePercent / 100);
}

/**
 * Calculate number of 20kg bags needed for a given volume
 * @param {number} volume - Volume in cubic metres (with wastage already applied)
 * @returns {number} Number of bags (rounded up)
 */
function calculateBags(volume) {
  return Math.ceil(volume * CONSTANTS.BAGS_PER_CUBIC_METRE);
}

/**
 * Calculate cost range for bags
 * @param {number} bags - Number of bags
 * @param {number} priceMin - Minimum price per bag
 * @param {number} priceMax - Maximum price per bag
 * @returns {Object} Cost range { min, max }
 */
function calculateBagCost(bags, priceMin = CONSTANTS.BAG_PRICE_MIN, priceMax = CONSTANTS.BAG_PRICE_MAX) {
  return {
    min: bags * priceMin,
    max: bags * priceMax
  };
}

/**
 * Calculate cost range for ready-mix
 * @param {number} volume - Volume in cubic metres
 * @param {string} state - Australian state code (optional)
 * @returns {Object} Cost range { min, max }
 */
function calculateReadymixCost(volume, state = null) {
  const pricing = state && CONSTANTS.READYMIX_PRICES[state]
    ? CONSTANTS.READYMIX_PRICES[state]
    : { min: CONSTANTS.READYMIX_PRICE_MIN, max: CONSTANTS.READYMIX_PRICE_MAX };

  // Apply minimum order
  const orderVolume = Math.max(volume, CONSTANTS.READYMIX_MINIMUM_ORDER);

  return {
    min: orderVolume * pricing.min,
    max: orderVolume * pricing.max,
    volume: orderVolume,
    hasMinimumApplied: volume < CONSTANTS.READYMIX_MINIMUM_ORDER
  };
}

/**
 * Format number to specified decimal places
 * @param {number} value - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number string
 */
function formatNumber(value, decimals = 2) {
  return value.toFixed(decimals);
}

/**
 * Format currency in AUD
 * @param {number} value - Amount in dollars
 * @returns {string} Formatted currency string
 */
function formatCurrency(value) {
  return '$' + value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


// ===== CALCULATOR FUNCTIONS =====

/**
 * Calculate concrete needed for a rectangular slab
 * Volume = Length × Width × Depth
 *
 * @param {Object} params - Input parameters
 * @param {number} params.length - Length in metres
 * @param {number} params.width - Width in metres
 * @param {number} params.depth - Depth/thickness in metres
 * @param {number} params.wastage - Wastage percentage (default: 10)
 * @returns {Object} Calculation results
 */
function calculateRectangularSlab({ length, width, depth, wastage = CONSTANTS.DEFAULT_WASTAGE }) {
  // Validate inputs
  if (!length || !width || !depth || length <= 0 || width <= 0 || depth <= 0) {
    return {
      valid: false,
      error: 'Please enter valid positive dimensions'
    };
  }

  // Calculate base volume
  const baseVolume = length * width * depth;

  // Apply wastage
  const totalVolume = applyWastage(baseVolume, wastage);

  // Calculate bags needed
  const bags = calculateBags(totalVolume);

  // Calculate costs
  const bagCost = calculateBagCost(bags);
  const readymixCost = calculateReadymixCost(totalVolume);

  return {
    valid: true,
    inputs: {
      length,
      width,
      depth,
      wastage
    },
    results: {
      baseVolume,
      totalVolume,
      bags,
      bagCost,
      readymixCost
    },
    formula: {
      description: 'Volume = Length × Width × Depth',
      steps: [
        { label: 'Base volume', calc: `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(depth)} = ${formatNumber(baseVolume)} m³` },
        { label: `Wastage (${wastage}%)`, calc: `${formatNumber(baseVolume)} × ${1 + wastage/100} = ${formatNumber(totalVolume)} m³` },
        { label: 'Bags needed', calc: `${formatNumber(totalVolume)} × ${CONSTANTS.BAGS_PER_CUBIC_METRE} = ${bags} bags` }
      ]
    }
  };
}

/**
 * Calculate concrete needed for post holes (fence posts, deck posts, etc.)
 * Hole Volume = π × r² × depth (minus post volume if specified)
 *
 * @param {Object} params - Input parameters
 * @param {number} params.holeDiameter - Hole diameter in metres
 * @param {number} params.holeDepth - Hole depth in metres
 * @param {number} params.postWidth - Post width/diameter in metres (optional)
 * @param {number} params.postCount - Number of posts (default: 1)
 * @param {string} params.postShape - 'round' or 'square' (default: 'square')
 * @param {number} params.wastage - Wastage percentage (default: 10)
 * @returns {Object} Calculation results
 */
function calculatePostHole({
  holeDiameter,
  holeDepth,
  postWidth = 0,
  postCount = 1,
  postShape = 'square',
  wastage = CONSTANTS.DEFAULT_WASTAGE
}) {
  // Validate inputs
  if (!holeDiameter || !holeDepth || holeDiameter <= 0 || holeDepth <= 0 || postCount < 1) {
    return {
      valid: false,
      error: 'Please enter valid positive dimensions'
    };
  }

  const holeRadius = holeDiameter / 2;

  // Calculate hole volume (cylindrical)
  const holeVolume = CONSTANTS.PI * Math.pow(holeRadius, 2) * holeDepth;

  // Calculate post volume to subtract (if post dimensions provided)
  let postVolume = 0;
  if (postWidth > 0) {
    if (postShape === 'round') {
      const postRadius = postWidth / 2;
      postVolume = CONSTANTS.PI * Math.pow(postRadius, 2) * holeDepth;
    } else {
      // Square post
      postVolume = postWidth * postWidth * holeDepth;
    }
  }

  // Volume per hole (concrete only)
  const concretePerHole = holeVolume - postVolume;

  // Total base volume
  const baseVolume = concretePerHole * postCount;

  // Apply wastage
  const totalVolume = applyWastage(baseVolume, wastage);

  // Calculate bags and costs
  const bags = calculateBags(totalVolume);
  const bagCost = calculateBagCost(bags);
  const readymixCost = calculateReadymixCost(totalVolume);

  return {
    valid: true,
    inputs: {
      holeDiameter,
      holeDepth,
      postWidth,
      postCount,
      postShape,
      wastage
    },
    results: {
      holeVolume,
      postVolume,
      concretePerHole,
      baseVolume,
      totalVolume,
      bags,
      bagCost,
      readymixCost
    },
    formula: {
      description: 'Volume = (π × r² × depth) - post volume',
      steps: [
        { label: 'Hole volume', calc: `π × ${formatNumber(holeRadius)}² × ${formatNumber(holeDepth)} = ${formatNumber(holeVolume, 4)} m³` },
        ...(postVolume > 0 ? [{ label: 'Post volume', calc: `${postShape === 'round' ? `π × ${formatNumber(postWidth/2)}² × ${formatNumber(holeDepth)}` : `${formatNumber(postWidth)} × ${formatNumber(postWidth)} × ${formatNumber(holeDepth)}`} = ${formatNumber(postVolume, 4)} m³` }] : []),
        { label: 'Concrete per hole', calc: `${formatNumber(holeVolume, 4)} - ${formatNumber(postVolume, 4)} = ${formatNumber(concretePerHole, 4)} m³` },
        ...(postCount > 1 ? [{ label: `Total (${postCount} holes)`, calc: `${formatNumber(concretePerHole, 4)} × ${postCount} = ${formatNumber(baseVolume, 4)} m³` }] : []),
        { label: `With wastage (${wastage}%)`, calc: `${formatNumber(baseVolume, 4)} × ${1 + wastage/100} = ${formatNumber(totalVolume, 4)} m³` },
        { label: 'Bags needed', calc: `${formatNumber(totalVolume, 4)} × ${CONSTANTS.BAGS_PER_CUBIC_METRE} = ${bags} bags` }
      ]
    }
  };
}

/**
 * Calculate concrete needed for strip footings
 * Volume = Length × Width × Depth
 *
 * @param {Object} params - Input parameters
 * @param {number} params.length - Footing length in metres
 * @param {number} params.width - Footing width in metres
 * @param {number} params.depth - Footing depth in metres
 * @param {number} params.footingCount - Number of footings (default: 1)
 * @param {number} params.wastage - Wastage percentage (default: 10)
 * @returns {Object} Calculation results
 */
function calculateFooting({
  length,
  width,
  depth,
  footingCount = 1,
  wastage = CONSTANTS.DEFAULT_WASTAGE
}) {
  // Validate inputs
  if (!length || !width || !depth || length <= 0 || width <= 0 || depth <= 0 || footingCount < 1) {
    return {
      valid: false,
      error: 'Please enter valid positive dimensions'
    };
  }

  // Calculate volume per footing
  const volumePerFooting = length * width * depth;

  // Total base volume
  const baseVolume = volumePerFooting * footingCount;

  // Apply wastage
  const totalVolume = applyWastage(baseVolume, wastage);

  // Calculate bags and costs
  const bags = calculateBags(totalVolume);
  const bagCost = calculateBagCost(bags);
  const readymixCost = calculateReadymixCost(totalVolume);

  return {
    valid: true,
    inputs: {
      length,
      width,
      depth,
      footingCount,
      wastage
    },
    results: {
      volumePerFooting,
      baseVolume,
      totalVolume,
      bags,
      bagCost,
      readymixCost
    },
    formula: {
      description: 'Volume = Length × Width × Depth',
      steps: [
        { label: 'Volume per footing', calc: `${formatNumber(length)} × ${formatNumber(width)} × ${formatNumber(depth)} = ${formatNumber(volumePerFooting)} m³` },
        ...(footingCount > 1 ? [{ label: `Total (${footingCount} footings)`, calc: `${formatNumber(volumePerFooting)} × ${footingCount} = ${formatNumber(baseVolume)} m³` }] : []),
        { label: `With wastage (${wastage}%)`, calc: `${formatNumber(baseVolume)} × ${1 + wastage/100} = ${formatNumber(totalVolume)} m³` },
        { label: 'Bags needed', calc: `${formatNumber(totalVolume)} × ${CONSTANTS.BAGS_PER_CUBIC_METRE} = ${bags} bags` }
      ]
    }
  };
}

/**
 * Calculate concrete needed for columns (round or square)
 * Round: Volume = π × r² × height
 * Square: Volume = width × depth × height
 *
 * @param {Object} params - Input parameters
 * @param {string} params.shape - 'round' or 'square'
 * @param {number} params.diameter - Diameter in metres (for round columns)
 * @param {number} params.width - Width in metres (for square columns)
 * @param {number} params.depth - Depth in metres (for square columns, optional - defaults to width)
 * @param {number} params.height - Column height in metres
 * @param {number} params.columnCount - Number of columns (default: 1)
 * @param {number} params.wastage - Wastage percentage (default: 10)
 * @returns {Object} Calculation results
 */
function calculateColumn({
  shape = 'round',
  diameter = 0,
  width = 0,
  depth = 0,
  height,
  columnCount = 1,
  wastage = CONSTANTS.DEFAULT_WASTAGE
}) {
  // Validate inputs
  if (!height || height <= 0 || columnCount < 1) {
    return {
      valid: false,
      error: 'Please enter valid positive dimensions'
    };
  }

  let volumePerColumn;
  let formulaCalc;

  if (shape === 'round') {
    if (!diameter || diameter <= 0) {
      return {
        valid: false,
        error: 'Please enter a valid diameter'
      };
    }
    const radius = diameter / 2;
    volumePerColumn = CONSTANTS.PI * Math.pow(radius, 2) * height;
    formulaCalc = `π × ${formatNumber(radius)}² × ${formatNumber(height)} = ${formatNumber(volumePerColumn, 4)} m³`;
  } else {
    // Square/rectangular column
    if (!width || width <= 0) {
      return {
        valid: false,
        error: 'Please enter valid width'
      };
    }
    const columnDepth = depth > 0 ? depth : width;
    volumePerColumn = width * columnDepth * height;
    formulaCalc = `${formatNumber(width)} × ${formatNumber(columnDepth)} × ${formatNumber(height)} = ${formatNumber(volumePerColumn, 4)} m³`;
  }

  // Total base volume
  const baseVolume = volumePerColumn * columnCount;

  // Apply wastage
  const totalVolume = applyWastage(baseVolume, wastage);

  // Calculate bags and costs
  const bags = calculateBags(totalVolume);
  const bagCost = calculateBagCost(bags);
  const readymixCost = calculateReadymixCost(totalVolume);

  return {
    valid: true,
    inputs: {
      shape,
      diameter,
      width,
      depth: depth || width,
      height,
      columnCount,
      wastage
    },
    results: {
      volumePerColumn,
      baseVolume,
      totalVolume,
      bags,
      bagCost,
      readymixCost
    },
    formula: {
      description: shape === 'round' ? 'Volume = π × r² × height' : 'Volume = width × depth × height',
      steps: [
        { label: 'Volume per column', calc: formulaCalc },
        ...(columnCount > 1 ? [{ label: `Total (${columnCount} columns)`, calc: `${formatNumber(volumePerColumn, 4)} × ${columnCount} = ${formatNumber(baseVolume, 4)} m³` }] : []),
        { label: `With wastage (${wastage}%)`, calc: `${formatNumber(baseVolume, 4)} × ${1 + wastage/100} = ${formatNumber(totalVolume, 4)} m³` },
        { label: 'Bags needed', calc: `${formatNumber(totalVolume, 4)} × ${CONSTANTS.BAGS_PER_CUBIC_METRE} = ${bags} bags` }
      ]
    }
  };
}

/**
 * Calculate concrete needed for a circular slab
 * Volume = π × r² × thickness
 *
 * @param {Object} params - Input parameters
 * @param {number} params.diameter - Diameter in metres
 * @param {number} params.thickness - Slab thickness in metres
 * @param {number} params.wastage - Wastage percentage (default: 10)
 * @returns {Object} Calculation results
 */
function calculateCircularSlab({ diameter, thickness, wastage = CONSTANTS.DEFAULT_WASTAGE }) {
  // Validate inputs
  if (!diameter || !thickness || diameter <= 0 || thickness <= 0) {
    return {
      valid: false,
      error: 'Please enter valid positive dimensions'
    };
  }

  const radius = diameter / 2;

  // Calculate base volume
  const baseVolume = CONSTANTS.PI * Math.pow(radius, 2) * thickness;

  // Apply wastage
  const totalVolume = applyWastage(baseVolume, wastage);

  // Calculate bags and costs
  const bags = calculateBags(totalVolume);
  const bagCost = calculateBagCost(bags);
  const readymixCost = calculateReadymixCost(totalVolume);

  return {
    valid: true,
    inputs: {
      diameter,
      thickness,
      wastage
    },
    results: {
      baseVolume,
      totalVolume,
      bags,
      bagCost,
      readymixCost
    },
    formula: {
      description: 'Volume = π × r² × thickness',
      steps: [
        { label: 'Base volume', calc: `π × ${formatNumber(radius)}² × ${formatNumber(thickness)} = ${formatNumber(baseVolume, 4)} m³` },
        { label: `Wastage (${wastage}%)`, calc: `${formatNumber(baseVolume, 4)} × ${1 + wastage/100} = ${formatNumber(totalVolume, 4)} m³` },
        { label: 'Bags needed', calc: `${formatNumber(totalVolume, 4)} × ${CONSTANTS.BAGS_PER_CUBIC_METRE} = ${bags} bags` }
      ]
    }
  };
}

/**
 * Compare bags vs ready-mix for a given volume
 *
 * @param {Object} params - Input parameters
 * @param {number} params.volume - Total volume in cubic metres (with wastage)
 * @param {string} params.state - Australian state code (optional)
 * @param {number} params.bagPrice - Custom bag price (optional)
 * @returns {Object} Comparison results
 */
function compareBagsVsReadymix({ volume, state = null, bagPrice = null }) {
  // Validate inputs
  if (!volume || volume <= 0) {
    return {
      valid: false,
      error: 'Please enter a valid volume'
    };
  }

  // Calculate bags
  const bags = calculateBags(volume);
  const bagPriceMin = bagPrice || CONSTANTS.BAG_PRICE_MIN;
  const bagPriceMax = bagPrice || CONSTANTS.BAG_PRICE_MAX;
  const bagCost = {
    min: bags * bagPriceMin,
    max: bags * bagPriceMax,
    avg: bags * (bagPriceMin + bagPriceMax) / 2
  };

  // Calculate ready-mix
  const readymixCost = calculateReadymixCost(volume, state);
  readymixCost.avg = (readymixCost.min + readymixCost.max) / 2;

  // Determine recommendation
  // Factors: cost, labour (bags = more work), time
  // Generally, ready-mix becomes cost-effective around 0.5-1m³
  const costDifference = bagCost.avg - readymixCost.avg;
  const bagsLabourHours = bags * 0.05; // Estimate: ~3 minutes per bag to mix

  let recommendation;
  let reasons = [];

  if (volume < 0.3) {
    recommendation = 'bags';
    reasons = [
      'Small volume - bags are more practical',
      'No minimum order charges',
      'Mix as needed'
    ];
  } else if (volume < 0.8) {
    if (costDifference > 50) {
      recommendation = 'readymix';
      reasons = [
        'Ready-mix is more cost effective for this volume',
        `Save approximately ${formatCurrency(Math.abs(costDifference))}`,
        'Much faster - poured in one go'
      ];
    } else {
      recommendation = 'either';
      reasons = [
        'Costs are similar for this volume',
        'Ready-mix saves time and labour',
        'Bags offer more flexibility'
      ];
    }
  } else {
    recommendation = 'readymix';
    reasons = [
      'Large volume - ready-mix is strongly recommended',
      `Mixing ${bags} bags by hand would take ~${formatNumber(bagsLabourHours, 1)} hours`,
      'Better concrete consistency with ready-mix'
    ];
  }

  return {
    valid: true,
    inputs: {
      volume,
      state
    },
    results: {
      bags: {
        quantity: bags,
        cost: bagCost,
        labourHours: bagsLabourHours,
        weight: bags * 20 // Total weight in kg
      },
      readymix: {
        volume: readymixCost.volume,
        cost: readymixCost,
        hasMinimumApplied: readymixCost.hasMinimumApplied
      },
      comparison: {
        costDifference,
        cheaperOption: costDifference > 0 ? 'readymix' : 'bags',
        recommendation,
        reasons
      }
    }
  };
}

// ===== PRESET CONFIGURATIONS =====
const PRESETS = {
  slab: {
    shed: { length: 3, width: 3, depth: 0.1, label: 'Shed Base (3×3m)' },
    driveway: { length: 5, width: 3, depth: 0.125, label: 'Driveway (5×3m)' },
    patio: { length: 4, width: 4, depth: 0.1, label: 'Patio (4×4m)' },
    path: { length: 6, width: 1, depth: 0.075, label: 'Garden Path (6×1m)' },
    garage: { length: 6, width: 3, depth: 0.1, label: 'Single Garage (6×3m)' }
  },
  postHole: {
    fence: { holeDiameter: 0.3, holeDepth: 0.6, postWidth: 0.1, label: 'Fence Post (300mm hole)' },
    deck: { holeDiameter: 0.45, holeDepth: 0.6, postWidth: 0.1, label: 'Deck Post (450mm hole)' },
    pergola: { holeDiameter: 0.4, holeDepth: 0.5, postWidth: 0.09, label: 'Pergola Post (400mm hole)' }
  },
  footing: {
    shed: { length: 0.4, width: 0.4, depth: 0.3, label: 'Shed Footing (400×400mm)' },
    deck: { length: 0.45, width: 0.45, depth: 0.35, label: 'Deck Footing (450×450mm)' },
    retaining: { length: 2, width: 0.4, depth: 0.3, label: 'Strip Footing (2m)' }
  },
  column: {
    veranda: { diameter: 0.3, height: 2.4, label: 'Veranda Column (300mm)' },
    carport: { diameter: 0.35, height: 2.7, label: 'Carport Column (350mm)' }
  },
  circularSlab: {
    firePit: { diameter: 1.2, thickness: 0.1, label: 'Fire Pit Base (1.2m)' },
    birdbath: { diameter: 0.6, thickness: 0.075, label: 'Birdbath Base (600mm)' },
    roundPatio: { diameter: 3, thickness: 0.1, label: 'Round Patio (3m)' }
  }
};

// Export for use in UI
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONSTANTS,
    PRESETS,
    mmToMetres,
    metresToMm,
    applyWastage,
    calculateBags,
    calculateBagCost,
    calculateReadymixCost,
    formatNumber,
    formatCurrency,
    calculateRectangularSlab,
    calculatePostHole,
    calculateFooting,
    calculateColumn,
    calculateCircularSlab,
    compareBagsVsReadymix
  };
}
