(function() {
  'use strict';

  const STORAGE_KEY = 'concretecalc-project-planner-v1';
  const MAX_ITEMS = 20;
  const list = document.getElementById('project-items');
  const template = document.getElementById('project-item-template');
  const allowance = document.getElementById('project-allowance');
  const projectName = document.getElementById('project-name');
  const status = document.getElementById('project-status');

  if (!list || !template || !allowance || !projectName || !status) return;

  const fields = ['label', 'shape', 'length', 'width', 'diameter', 'depth', 'quantity'];

  function blankItem() {
    return {
      label: '',
      shape: 'rectangular',
      length: '',
      width: '',
      diameter: '',
      depth: '',
      quantity: '1'
    };
  }

  function normaliseItem(item) {
    const clean = blankItem();
    fields.forEach(field => {
      if (item && item[field] !== undefined) clean[field] = String(item[field]).slice(0, 80);
    });
    clean.shape = clean.shape === 'circular' ? 'circular' : 'rectangular';
    return clean;
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function updateShapeFields(row) {
    const shape = row.querySelector('[data-field="shape"]').value;
    row.querySelector('[data-fields="rectangular"]').hidden = shape !== 'rectangular';
    row.querySelector('[data-fields="circular"]').hidden = shape !== 'circular';
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
      quantity: Number(item.quantity)
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
    const result = calculateProjectTotal(calculationItems(items), Number(allowance.value));
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
    empty.hidden = true;
    output.hidden = false;
    return result;
  }

  function renderState(state) {
    list.replaceChildren();
    projectName.value = state && state.name ? String(state.name).slice(0, 80) : '';
    const allowanceValue = state && Number(state.allowance);
    allowance.value = [0, 5, 10, 15, 20].includes(allowanceValue) ? String(allowanceValue) : '10';
    const items = state && Array.isArray(state.items) ? state.items.slice(0, MAX_ITEMS) : [];
    (items.length ? items : [blankItem()]).forEach(item => addItem(item));
    updateResults();
  }

  function encodedState() {
    const json = JSON.stringify(plannerState());
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodedState(value) {
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  function loadInitialState() {
    const hash = new URLSearchParams(window.location.hash.slice(1)).get('project');
    if (!hash) return renderState(null);
    try {
      renderState(decodedState(hash));
      setStatus('Shared project loaded. Review every measurement before ordering.', false);
    } catch (error) {
      renderState(null);
      setStatus('The shared project link could not be read, so a blank project was opened.', true);
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

  allowance.addEventListener('change', updateResults);
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
    } catch (error) {
      window.prompt('Copy this project link:', url);
    }
  });

  document.getElementById('print-project').addEventListener('click', () => {
    if (!updateResults()) return setStatus('Complete every pour before printing.', true);
    window.print();
  });

  loadInitialState();
})();
