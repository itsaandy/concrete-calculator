/**
 * Australian Concrete Calculator - UI Module
 * DOM handling, events, and rendering logic
 */

// ===== DEBOUNCE UTILITY =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== DOM UTILITY FUNCTIONS =====

/**
 * Get element by ID with type safety
 * @param {string} id - Element ID
 * @returns {HTMLElement|null}
 */
function $(id) {
  return document.getElementById(id);
}

/**
 * Query selector wrapper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {HTMLElement|null}
 */
function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all wrapper
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (default: document)
 * @returns {NodeList}
 */
function qsa(selector, parent = document) {
  return parent.querySelectorAll(selector);
}

// ===== UNIT CONVERSION UI =====

/**
 * Initialize unit toggle functionality
 * @param {string} toggleContainerId - ID of the toggle container
 * @param {Function} onUnitChange - Callback when unit changes
 */
function initUnitToggle(toggleContainerId, onUnitChange) {
  const container = $(toggleContainerId);
  if (!container) return;

  const options = qsa('.toggle-option', container);
  let currentUnit = 'metres';

  options.forEach(option => {
    const input = qs('input', option);
    if (input && input.checked) {
      currentUnit = input.value;
    }

    option.addEventListener('click', () => {
      const input = qs('input', option);
      if (!input) return;

      // Update visual state
      options.forEach(opt => opt.classList.remove('is-active'));
      option.classList.add('is-active');
      input.checked = true;

      const newUnit = input.value;
      if (newUnit !== currentUnit) {
        currentUnit = newUnit;
        if (onUnitChange) {
          onUnitChange(newUnit);
        }
      }
    });
  });

  return {
    getUnit: () => currentUnit
  };
}

/**
 * Convert input values between units
 * @param {HTMLInputElement} input - Input element
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 */
function convertInputUnit(input, fromUnit, toUnit) {
  const value = parseFloat(input.value);
  if (isNaN(value) || value === 0) return;

  let newValue;
  if (fromUnit === 'metres' && toUnit === 'mm') {
    newValue = metresToMm(value);
  } else if (fromUnit === 'mm' && toUnit === 'metres') {
    newValue = mmToMetres(value);
  }

  if (newValue !== undefined) {
    // Round to reasonable precision
    input.value = toUnit === 'mm' ? Math.round(newValue) : formatNumber(newValue, 3);
  }
}

/**
 * Update input suffixes based on unit
 * @param {string} unit - Current unit ('metres' or 'mm')
 */
function updateInputSuffixes(unit) {
  const suffixes = qsa('.input-suffix');
  suffixes.forEach(suffix => {
    const type = suffix.dataset.type;
    if (type === 'length') {
      suffix.textContent = unit === 'metres' ? 'm' : 'mm';
    }
  });
}

// ===== INPUT HANDLING =====

/**
 * Get numeric value from input, converting from mm if needed
 * @param {HTMLInputElement} input - Input element
 * @param {string} unit - Current unit
 * @returns {number} Value in metres
 */
function getInputValueInMetres(input, unit) {
  const value = parseFloat(input.value);
  if (isNaN(value) || value <= 0) return 0;

  return unit === 'mm' ? mmToMetres(value) : value;
}

/**
 * Set up real-time calculation on inputs
 * @param {string} formId - Form element ID
 * @param {Function} calculateFn - Calculation function to call
 * @param {Function} renderFn - Render function for results
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
function initCalculatorInputs(formId, calculateFn, renderFn, debounceMs = 200) {
  const form = $(formId);
  if (!form) return;

  const inputs = qsa('input[type="number"], input[type="range"], select', form);

  const debouncedCalculate = debounce(() => {
    const result = calculateFn();
    renderFn(result);
  }, debounceMs);

  inputs.forEach(input => {
    input.addEventListener('input', debouncedCalculate);
    input.addEventListener('change', debouncedCalculate);
  });

  // Initial calculation
  const initialResult = calculateFn();
  renderFn(initialResult);
}

// ===== WASTAGE SLIDER =====

/**
 * Initialize wastage slider
 * @param {string} sliderId - Slider element ID
 * @param {string} valueDisplayId - Value display element ID
 * @param {Function} onChange - Callback when value changes
 */
function initWastageSlider(sliderId, valueDisplayId, onChange) {
  const slider = $(sliderId);
  const display = $(valueDisplayId);
  if (!slider) return;

  const updateDisplay = () => {
    const value = slider.value;
    if (display) {
      display.textContent = value + '%';
    }
    if (onChange) {
      onChange(parseInt(value, 10));
    }
  };

  slider.addEventListener('input', updateDisplay);
  slider.addEventListener('change', updateDisplay);

  // Set initial display
  updateDisplay();

  return {
    getValue: () => parseInt(slider.value, 10),
    setValue: (val) => {
      slider.value = val;
      updateDisplay();
    }
  };
}

// ===== RESULTS RENDERING =====

/**
 * Render results to the results panel
 * @param {Object} result - Calculation result object
 * @param {Object} elements - Object mapping result keys to element IDs
 */
function renderResults(result, elements) {
  if (!result || !result.valid) {
    // Show placeholders
    Object.values(elements).forEach(id => {
      const el = $(id);
      if (el) {
        el.textContent = '--';
        el.classList.add('result-value--placeholder');
      }
    });
    return;
  }

  const { results } = result;

  // Volume
  if (elements.volume && $(elements.volume)) {
    $(elements.volume).textContent = formatNumber(results.totalVolume, 2) + ' m³';
    $(elements.volume).classList.remove('result-value--placeholder');
  }

  // Base volume (without wastage)
  if (elements.baseVolume && $(elements.baseVolume)) {
    $(elements.baseVolume).textContent = formatNumber(results.baseVolume, 2) + ' m³';
    $(elements.baseVolume).classList.remove('result-value--placeholder');
  }

  // Bags
  if (elements.bags && $(elements.bags)) {
    $(elements.bags).textContent = results.bags;
    $(elements.bags).classList.remove('result-value--placeholder');
  }

  // Bag cost
  if (elements.bagCost && $(elements.bagCost)) {
    $(elements.bagCost).innerHTML = `${formatCurrency(results.bagCost.min)} <span>-</span> ${formatCurrency(results.bagCost.max)}`;
    $(elements.bagCost).classList.remove('result-value--placeholder');
  }

  // Ready-mix cost
  if (elements.readymixCost && $(elements.readymixCost)) {
    $(elements.readymixCost).innerHTML = `${formatCurrency(results.readymixCost.min)} <span>-</span> ${formatCurrency(results.readymixCost.max)}`;
    $(elements.readymixCost).classList.remove('result-value--placeholder');
  }
}

/**
 * Render formula breakdown
 * @param {Object} result - Calculation result object
 * @param {string} containerId - Container element ID
 */
function renderFormula(result, containerId) {
  const container = $(containerId);
  if (!container || !result || !result.valid) return;

  const { formula } = result;
  let html = `<div class="formula-box"><strong>${formula.description}</strong></div>`;

  html += '<div class="formula-steps">';
  formula.steps.forEach(step => {
    html += `
      <div class="formula-step">
        <span class="formula-step-label">${step.label}</span>
        <span class="formula-step-calc">${step.calc}</span>
      </div>
    `;
  });
  html += '</div>';

  container.innerHTML = html;
}

// ===== PRESETS =====

/**
 * Initialize preset buttons
 * @param {string} containerId - Preset buttons container ID
 * @param {Object} presets - Presets object
 * @param {Function} applyPreset - Function to apply preset values
 */
function initPresets(containerId, presets, applyPreset) {
  const container = $(containerId);
  if (!container) return;

  const buttons = qsa('.preset-btn', container);
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      if (presets[presetKey]) {
        applyPreset(presets[presetKey]);
      }
    });
  });
}

// ===== SHAPE TOGGLE (for column/post calculators) =====

/**
 * Initialize shape toggle (round vs square)
 * @param {string} toggleContainerId - Toggle container ID
 * @param {Object} fieldsConfig - Configuration for showing/hiding fields
 * @param {Function} onShapeChange - Callback when shape changes
 */
function initShapeToggle(toggleContainerId, fieldsConfig, onShapeChange) {
  const container = $(toggleContainerId);
  if (!container) return;

  const options = qsa('.toggle-option', container);
  let currentShape = 'round';

  const updateFields = (shape) => {
    // Show/hide fields based on shape
    if (fieldsConfig.round) {
      fieldsConfig.round.forEach(fieldId => {
        const field = $(fieldId);
        if (field) {
          field.style.display = shape === 'round' ? '' : 'none';
        }
      });
    }
    if (fieldsConfig.square) {
      fieldsConfig.square.forEach(fieldId => {
        const field = $(fieldId);
        if (field) {
          field.style.display = shape === 'square' ? '' : 'none';
        }
      });
    }
  };

  options.forEach(option => {
    const input = qs('input', option);
    if (input && input.checked) {
      currentShape = input.value;
      updateFields(currentShape);
    }

    option.addEventListener('click', () => {
      const input = qs('input', option);
      if (!input) return;

      options.forEach(opt => opt.classList.remove('is-active'));
      option.classList.add('is-active');
      input.checked = true;

      const newShape = input.value;
      if (newShape !== currentShape) {
        currentShape = newShape;
        updateFields(newShape);
        if (onShapeChange) {
          onShapeChange(newShape);
        }
      }
    });
  });

  return {
    getShape: () => currentShape
  };
}

// ===== MOBILE NAVIGATION =====

/**
 * Initialize mobile navigation toggle
 */
function initMobileNav() {
  const toggle = qs('.nav-toggle');
  const mobileNav = qs('.mobile-nav');

  if (!toggle || !mobileNav) return;

  toggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close on link click
  const links = qsa('a', mobileNav);
  links.forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===== NAV DROPDOWN =====

/**
 * Initialize navigation dropdown
 */
function initNavDropdown() {
  const dropdowns = qsa('.nav-dropdown');

  dropdowns.forEach(dropdown => {
    const toggle = qs('.nav-dropdown-toggle', dropdown);
    if (!toggle) return;

    // Toggle on click
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dropdown.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

// ===== FAQ ACCORDION =====

/**
 * Initialize FAQ accordion (using native details/summary)
 * No extra JS needed for basic functionality,
 * but this adds smooth animation
 */
function initFAQAccordion() {
  const details = qsa('details.faq-item');

  details.forEach(detail => {
    const content = qs('.faq-answer', detail);
    if (!content) return;

    detail.addEventListener('toggle', () => {
      if (detail.open) {
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        content.style.maxHeight = '0';
      }
    });
  });
}

// ===== STATE SELECTOR (for ready-mix pricing) =====

/**
 * Initialize state selector for regional pricing
 * @param {string} selectId - Select element ID
 * @param {Function} onChange - Callback when state changes
 */
function initStateSelector(selectId, onChange) {
  const select = $(selectId);
  if (!select) return;

  select.addEventListener('change', () => {
    if (onChange) {
      onChange(select.value);
    }
  });

  return {
    getState: () => select.value
  };
}

// ===== COMPARISON RENDERING (Bags vs Ready-mix) =====

/**
 * Render comparison results
 * @param {Object} result - Comparison result from compareBagsVsReadymix
 * @param {Object} elements - Element ID mappings
 */
function renderComparison(result, elements) {
  if (!result || !result.valid) return;

  const { results } = result;
  const { bags, readymix, comparison } = results;

  // Bags section
  if (elements.bagsQuantity && $(elements.bagsQuantity)) {
    $(elements.bagsQuantity).textContent = bags.quantity + ' bags';
  }
  if (elements.bagsCostMin && $(elements.bagsCostMin)) {
    $(elements.bagsCostMin).textContent = formatCurrency(bags.cost.min);
  }
  if (elements.bagsCostMax && $(elements.bagsCostMax)) {
    $(elements.bagsCostMax).textContent = formatCurrency(bags.cost.max);
  }
  if (elements.bagsWeight && $(elements.bagsWeight)) {
    $(elements.bagsWeight).textContent = bags.weight + ' kg';
  }
  if (elements.bagsLabour && $(elements.bagsLabour)) {
    $(elements.bagsLabour).textContent = formatNumber(bags.labourHours, 1) + ' hours';
  }

  // Ready-mix section
  if (elements.readymixVolume && $(elements.readymixVolume)) {
    let volumeText = formatNumber(readymix.volume, 2) + ' m³';
    if (readymix.hasMinimumApplied) {
      volumeText += ' (minimum order)';
    }
    $(elements.readymixVolume).textContent = volumeText;
  }
  if (elements.readymixCostMin && $(elements.readymixCostMin)) {
    $(elements.readymixCostMin).textContent = formatCurrency(readymix.cost.min);
  }
  if (elements.readymixCostMax && $(elements.readymixCostMax)) {
    $(elements.readymixCostMax).textContent = formatCurrency(readymix.cost.max);
  }

  // Recommendation
  if (elements.recommendation && $(elements.recommendation)) {
    const recEl = $(elements.recommendation);
    let recText = '';
    let recClass = '';

    switch (comparison.recommendation) {
      case 'bags':
        recText = 'Bags Recommended';
        recClass = 'recommendation--bags';
        break;
      case 'readymix':
        recText = 'Ready-Mix Recommended';
        recClass = 'recommendation--readymix';
        break;
      default:
        recText = 'Either Option Works';
        recClass = 'recommendation--either';
    }

    recEl.textContent = recText;
    recEl.className = 'recommendation ' + recClass;
  }

  if (elements.reasons && $(elements.reasons)) {
    $(elements.reasons).innerHTML = comparison.reasons
      .map(r => `<li>${r}</li>`)
      .join('');
  }

  // Update comparison cards styling
  const bagsCard = qs('.comparison-card--bags');
  const readymixCard = qs('.comparison-card--readymix');

  if (bagsCard && readymixCard) {
    bagsCard.classList.remove('comparison-card--recommended');
    readymixCard.classList.remove('comparison-card--recommended');

    if (comparison.recommendation === 'bags') {
      bagsCard.classList.add('comparison-card--recommended');
    } else if (comparison.recommendation === 'readymix') {
      readymixCard.classList.add('comparison-card--recommended');
    }
  }
}

// ===== INFO MODAL =====

/**
 * Initialize info modal triggers
 */
function initInfoModals() {
  const triggers = qsa('.info-modal-trigger');

  triggers.forEach(trigger => {
    const modalId = trigger.getAttribute('data-modal');
    const modal = $(modalId);
    const backdrop = $(modalId + '-backdrop');

    if (!modal || !backdrop) return;

    const closeBtn = qs('.info-modal-close', modal);

    // Open modal on trigger click
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('is-open');
      backdrop.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    });

    // Close on close button click
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        closeModal(modal, backdrop, trigger);
      });
    }

    // Close on backdrop click
    backdrop.addEventListener('click', () => {
      closeModal(modal, backdrop, trigger);
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      qsa('.info-modal.is-open').forEach(modal => {
        const modalId = modal.id;
        const backdrop = $(modalId + '-backdrop');
        const trigger = qs(`[data-modal="${modalId}"]`);
        closeModal(modal, backdrop, trigger);
      });
    }
  });
}

function closeModal(modal, backdrop, trigger) {
  modal.classList.remove('is-open');
  if (backdrop) backdrop.classList.remove('is-open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

// ===== SHARE FUNCTIONALITY =====

/**
 * Show toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
  // Remove existing toast if any
  const existing = qs('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('is-visible');
  });

  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

/**
 * Copy text to clipboard and show toast
 * @param {string} text - Text to copy
 * @param {string} successMessage - Message to show on success
 */
async function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
  try {
    await navigator.clipboard.writeText(text);
    showToast(successMessage);
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(successMessage);
  }
}

/**
 * Get URL parameters as object
 * @returns {Object} URL parameters
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
}

/**
 * Build share URL with parameters
 * @param {Object} params - Parameters to encode
 * @returns {string} Full URL with parameters
 */
function buildShareUrl(params) {
  const url = new URL(window.location.href.split('?')[0]);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

/**
 * Initialize share buttons for a calculator
 * @param {Object} config - Configuration object
 * @param {Function} config.getValues - Function to get current input values
 * @param {Function} config.getResultText - Function to get result text for copying
 * @param {Object} config.paramMap - Map of param names to input IDs
 */
function initShareButtons(config) {
  const copyBtn = qs('.share-btn--copy');
  const shareBtn = qs('.share-btn--share');

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const resultText = config.getResultText();
      if (resultText) {
        copyToClipboard(resultText, 'Result copied to clipboard!');
      }
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const values = config.getValues();
      const shareUrl = buildShareUrl(values);
      copyToClipboard(shareUrl, 'Link copied to clipboard!');
    });
  }

  // Load values from URL params on page load
  if (config.paramMap) {
    const params = getUrlParams();
    Object.entries(config.paramMap).forEach(([paramName, inputId]) => {
      if (params[paramName] !== undefined) {
        const input = $(inputId);
        if (input) {
          input.value = params[paramName];
        }
      }
    });
  }
}

// ===== PAGE INITIALIZATION =====

/**
 * Initialize common page elements
 */
function initCommon() {
  initMobileNav();
  initNavDropdown();
  initFAQAccordion();
  initInfoModals();
}

// Auto-init on DOMContentLoaded
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initCommon);
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    debounce,
    $,
    qs,
    qsa,
    initUnitToggle,
    convertInputUnit,
    updateInputSuffixes,
    getInputValueInMetres,
    initCalculatorInputs,
    initWastageSlider,
    renderResults,
    renderFormula,
    initPresets,
    initShapeToggle,
    initMobileNav,
    initFAQAccordion,
    initStateSelector,
    renderComparison,
    initInfoModals,
    initCommon
  };
}
