(function() {
  'use strict';

  const STORAGE_KEY = 'concretecalc-project-planner-v1';
  const DRAFT_KEY = 'concretecalc-project-draft-v1';
  const MAX_ITEMS = 20;
  const list = document.getElementById('project-items');
  const template = document.getElementById('project-item-template');
  const allowance = document.getElementById('project-allowance');
  const projectName = document.getElementById('project-name');
  const status = document.getElementById('project-status');

  if (!list || !template || !allowance || !projectName || !status) return;

  const fields = ['label', 'shape', 'length', 'width', 'diameter', 'depth', 'quantity', 'postWidth', 'postShape'];

  function blankItem() {
    return {
      label: '',
      shape: 'rectangular',
      length: '',
      width: '',
      diameter: '',
      depth: '',
      quantity: '1',
      postWidth: '0',
      postShape: 'square'
    };
  }

  function normaliseItem(item) {
    const clean = blankItem();
    fields.forEach(field => {
      if (item && item[field] !== undefined) clean[field] = String(item[field]).slice(0, 80);
    });
    clean.shape = ['circular', 'post-hole'].includes(clean.shape) ? clean.shape : 'rectangular';
    clean.postShape = clean.postShape === 'round' ? 'round' : 'square';
    return clean;
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function updateShapeFields(row) {
    const shape = row.querySelector('[data-field="shape"]').value;
    row.querySelector('[data-fields="rectangular"]').hidden = shape !== 'rectangular';
    row.querySelector('[data-fields="circular"]').hidden = shape === 'rectangular';
    row.querySelector('[data-fields="post-hole"]').hidden = shape !== 'post-hole';
  }

  function addItem(item = blankItem(), focus = false) {
    if (list.children.length >= MAX_ITEMS) {
      setStatus(`A project can contain up to ${MAX_ITEMS} pours.`, true);
      return;
    }

    const row = template.content.firstElementChild.cloneNode(true);
    const clean = normaliseItem(item);
    fields.forEach(field => {
      row.querySelector(`[data-field="${field}"]`).value = clean[field];
    });
    list.appendChild(row);
    updateShapeFields(row);
    renumberItems();
    if (focus) row.querySelector('[data-field="label"]').focus();
  }

  function renumberItems() {
    Array.from(list.children).forEach((row, index) => {
      row.dataset.index = String(index);
      row.querySelector('.project-item__number').textContent = `Pour ${index + 1}`;
      const remove = row.querySelector('.project-item__remove');
      remove.disabled = list.children.length === 1;
      remove.setAttribute('aria-label', `Remove pour ${index + 1}`);
    });
  }

  function readItems() {
    return Array.from(list.children).map(row => {
      const item = {};
      fields.forEach(field => {
        item[field] = row.querySelector(`[data-field="${field}"]`).value.trim();
      });
      return item;
    });
  }

  function plannerState() {
    return {
      name: projectName.value.trim().slice(0, 80),
      allowance: allowance.value,
      items: readItems()
    };
  }

  function calculationItems(items) {
    return items.map(item => ({
      shape: item.shape,
      length: Number(item.length),
      width: Number(item.width),
      diameter: Number(item.diameter),
      depth: Number(item.depth),
      quantity: Number(item.quantity),
      postWidth: Number(item.postWidth),
      postShape: item.postShape
    }));
  }

  function formatVolume(value, decimals = 3) {
    return Number(value).toLocaleString('en-AU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function updateResults() {
    const items = readItems();
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(plannerState()));
    } catch (_) { /* Explicit save and share remain available if tab storage is blocked. */ }
    if (new URLSearchParams(location.hash.slice(1)).has('project')) {
      history.replaceState(null, '', '#project=' + encodedState());
    }
    const result = calculateProjectTotal(calculationItems(items), allowance.value === '' ? NaN : Number(allowance.value));
    recordCalculatorCompletion(result);
    const output = document.getElementById('project-results');
    const empty = document.getElementById('project-results-empty');

    Array.from(list.children).forEach(row => {
      row.classList.remove('has-error');
      row.querySelector('.project-item__volume').textContent = '—';
    });

    if (!result.valid) {
      output.hidden = true;
      empty.hidden = false;
      empty.textContent = result.error;
      if (Number.isInteger(result.invalidIndex) && list.children[result.invalidIndex]) {
        list.children[result.invalidIndex].classList.add('has-error');
      }
      return null;
    }

    result.calculatedItems.forEach((item, index) => {
      list.children[index].querySelector('.project-item__volume').textContent =
        `${formatVolume(item.baseVolume)} m³`;
    });
    document.getElementById('project-base-volume').textContent = `${formatVolume(result.baseVolume)} m³`;
    document.getElementById('project-allowance-volume').textContent = `${formatVolume(result.wastageVolume)} m³`;
    document.getElementById('project-total-volume').textContent = `${formatVolume(result.totalVolume)} m³`;
    document.getElementById('project-bags').textContent = result.bags.toLocaleString('en-AU');
    document.getElementById('project-result-allowance').textContent = allowance.value;
    document.getElementById('project-compare-link').href =
      `/bags-vs-readymix/?v=${encodeURIComponent(result.totalVolume.toFixed(3))}`;
    renderOrderSummary(items, result);
    empty.hidden = true;
    output.hidden = false;
    return result;
  }

  function renderState(state) {
    list.replaceChildren();
    projectName.value = state && state.name ? String(state.name).slice(0, 80) : '';
    const allowanceValue = state && Number(state.allowance);
    allowance.value = Number.isFinite(allowanceValue) && allowanceValue >= 0 && allowanceValue <= 30 ? String(allowanceValue) : '10';
    const items = state && Array.isArray(state.items) ? state.items.slice(0, MAX_ITEMS) : [];
    (items.length ? items : [blankItem()]).forEach(item => addItem(item));
    updateResults();
  }

  function encodedState() {
    return encodeProjectState(plannerState());
  }

  function dimensionsText(item) {
    if (item.shape === 'rectangular') return `${item.length} × ${item.width} × ${item.depth} m`;
    const hole = `Ø ${item.diameter} × ${item.depth} m deep`;
    return item.shape === 'post-hole'
      ? `${hole}; subtract ${item.postWidth} m ${item.postShape} post`
      : hole;
  }

  function renderOrderSummary(items, result) {
    document.getElementById('order-project-name').textContent = projectName.value.trim() || 'Concrete project';
    const rows = document.getElementById('order-summary-rows');
    rows.replaceChildren();
    items.forEach((item, index) => {
      const row = document.createElement('tr');
      [item.label || `Pour ${index + 1}`, dimensionsText(item), item.quantity,
        `${formatVolume(result.calculatedItems[index].baseVolume)} m³`].forEach((value, column) => {
        const cell = document.createElement('td');
        cell.dataset.label = ['Pour', 'Measurements', 'Quantity', 'Volume'][column];
        cell.textContent = value;
        row.appendChild(cell);
      });
      rows.appendChild(row);
    });
  }

  function orderSummaryText(result) {
    const items = readItems();
    return [
      projectName.value.trim() || 'Concrete project',
      ...items.map((item, index) => `${item.label || 'Pour ' + (index + 1)}: ${dimensionsText(item)} × ${item.quantity} = ${formatVolume(result.calculatedItems[index].baseVolume)} m³`),
      `Measured volume: ${formatVolume(result.baseVolume)} m³`,
      `Allowance (${allowance.value}%): ${formatVolume(result.wastageVolume)} m³`,
      `Planning quantity: ${formatVolume(result.totalVolume)} m³`,
      `Estimated 20 kg bags: ${result.bags} (108 bags/m³; check product yield)`,
      'For a supplier quote: confirm concrete specification, delivery date, access, minimum load, delivery/pump charges and final quantity.',
      'Quantity estimate only; not an order or structural design. https://concretecalc.com.au/methodology/'
    ].join('\n');
  }

  function tabDraft() {
    try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY)); }
    catch (_) { return null; }
  }

  function loadInitialState() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const hash = params.get('project');
    try {
      if (params.has('add')) {
        const incoming = decodeProjectState(params.get('add'));
        if (!incoming.item || !calculateProjectItem(incoming.item).valid) throw new Error('Invalid pour');
        const draft = tabDraft();
        const items = draft && Array.isArray(draft.items) ? draft.items : [];
        // Discard only the untouched blank row, never an incomplete user pour.
        const empty = items.length === 1 && !items[0].label &&
          !items[0].length && !items[0].width && !items[0].diameter && !items[0].depth;
        const existing = empty ? [] : items;
        if (existing.length >= MAX_ITEMS) {
          renderState(draft);
          history.replaceState(null, '', '#project=' + encodedState());
          setStatus('This project already has 20 pours. Remove one, then return to the calculator to add this pour.', true);
          return;
        }
        renderState({
          name: draft && draft.name,
          allowance: existing.length ? draft.allowance : incoming.allowance,
          items: [...existing, incoming.item]
        });
        // Replace the add action with a snapshot so refresh cannot duplicate it.
        history.replaceState(null, '', '#project=' + encodedState());
        setStatus('Calculation added. The project allowance is applied once to the combined measured volume. Save to keep this project beyond this tab.', false);
      } else if (hash) {
        renderState(decodeProjectState(hash));
        setStatus('Shared project loaded. Review every measurement before ordering.', false);
      } else {
        const draft = tabDraft();
        renderState(draft);
        if (draft) setStatus('Resumed your draft in this tab. Save on this device to keep it for later.', false);
      }
    } catch (error) {
      renderState(tabDraft());
      setStatus('The project link could not be read. Your existing tab draft has been kept if available.', true);
    }
  }

  list.addEventListener('input', updateResults);
  list.addEventListener('change', event => {
    if (event.target.matches('[data-field="shape"]')) updateShapeFields(event.target.closest('.project-item'));
    updateResults();
  });
  list.addEventListener('click', event => {
    const remove = event.target.closest('.project-item__remove');
    if (!remove || list.children.length === 1) return;
    remove.closest('.project-item').remove();
    renumberItems();
    updateResults();
  });

  allowance.addEventListener('input', updateResults);
  allowance.addEventListener('change', updateResults);
  projectName.addEventListener('input', updateResults);
  document.getElementById('new-project').addEventListener('click', () => {
    if (!window.confirm('Clear this tab’s draft and start a new project? Your saved project will remain available.')) return;
    history.replaceState(null, '', window.location.pathname);
    renderState(null);
    setStatus('New project started.', false);
  });
  document.getElementById('add-project-item').addEventListener('click', () => {
    addItem(blankItem(), true);
    updateResults();
  });

  document.getElementById('load-project-example').addEventListener('click', () => {
    renderState({
      name: 'Backyard project example',
      allowance: '10',
      items: [
        { label: 'Shed slab', shape: 'rectangular', length: '3', width: '3', diameter: '', depth: '0.1', quantity: '1' },
        { label: 'Fence post holes', shape: 'circular', length: '', width: '', diameter: '0.3', depth: '0.6', quantity: '6' }
      ]
    });
    setStatus('Example loaded. Replace every measurement with values from your own project.', false);
  });

  document.getElementById('save-project').addEventListener('click', () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerState()));
      setStatus('Project saved on this device.', false);
      trackCalculatorEvent('project_save');
    } catch (error) {
      setStatus('This browser did not allow local saving. Use the share link instead.', true);
    }
  });

  document.getElementById('load-project').addEventListener('click', () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return setStatus('No saved project was found on this device.', true);
      renderState(JSON.parse(saved));
      setStatus('Saved project loaded. Review the measurements before ordering.', false);
    } catch (error) {
      setStatus('The saved project could not be read.', true);
    }
  });

  document.getElementById('share-project').addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}#project=${encodedState()}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Share link copied. Anyone with the link can see the project name and measurements.', false);
      trackCalculatorEvent('share', { method: 'copy_link', content_type: 'project' });
    } catch (error) {
      window.prompt('Copy this project link:', url);
    }
  });

  document.getElementById('print-project').addEventListener('click', () => {
    if (!updateResults()) return setStatus('Complete every pour before printing.', true);
    window.print();
    trackCalculatorEvent('project_print');
  });

  document.getElementById('copy-project-summary').addEventListener('click', async () => {
    const result = updateResults();
    if (!result) return setStatus('Complete every pour before copying the summary.', true);
    if (await copyToClipboard(orderSummaryText(result), 'Project summary copied')) {
      setStatus('Summary copied. Paste it into an email or message to your supplier.', false);
      trackCalculatorEvent('calculator_copy');
    } else {
      setStatus('Copy was blocked by this browser. Use Print summary instead.', true);
    }
  });

  window.addEventListener('hashchange', loadInitialState);
  loadInitialState();
})();
