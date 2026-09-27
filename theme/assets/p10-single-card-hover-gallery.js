(() => {
  'use strict';

  const DESKTOP_HOVER_QUERY = '(min-width: 1025px) and (hover: hover) and (pointer: fine)';
  const TEMPLATE_SELECTOR = 'template[data-p10-card-hover-gallery]';
  const INITIALIZED_ATTRIBUTE = 'data-p10-gallery-initialized';
  const OPEN_DELAY_MS = 180;
  const CLOSE_DELAY_MS = 120;
  const PANEL_GAP_PX = 14;
  const VIEWPORT_MARGIN_PX = 16;

  if (!window.matchMedia(DESKTOP_HOVER_QUERY).matches) return;

  const entries = new WeakMap();
  let panel;
  let stage;
  let segmentTray;
  let activeCard = null;
  let activeEntry = null;
  let activeLayers = [];
  let activeSegments = [];
  let selectedIndex = 0;
  let visibleIndex = -1;
  let openTimer = 0;
  let closeTimer = 0;

  function readSources(template) {
    return Array.from(template.content.querySelectorAll('[data-p10-gallery-src]'))
      .slice(0, 5)
      .map((item) => ({
        src: item.getAttribute('data-p10-gallery-src') || '',
        srcset: item.getAttribute('data-p10-gallery-srcset') || '',
      }))
      .filter((item) => item.src);
  }

  function createPreviewPanel() {
    const panel = document.createElement('aside');
    panel.className = 'p10-product-side-preview';
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = [
      '<div class="p10-product-side-preview__stage"></div>',
      '<div class="p10-product-side-preview__segments" aria-hidden="true"></div>',
    ].join('');
    document.body.appendChild(panel);
    return panel;
  }

  function createImageLayer(source, index) {
    const image = document.createElement('img');
    image.className = 'p10-product-side-preview__image';
    image.alt = '';
    image.decoding = 'async';
    image.loading = 'eager';
    image.sizes = '340px';
    image.dataset.previewIndex = String(index);
    image.setAttribute('aria-hidden', 'true');
    image.onload = () => {
      image.dataset.loaded = 'true';
      if (index === selectedIndex) renderSelection(index);
      else if (visibleIndex < 0 && activeLayers[selectedIndex]?.dataset.loaded === 'error') {
        selectLoadedFallback();
      }
    };
    image.onerror = () => {
      image.dataset.loaded = 'error';
      if (index === selectedIndex) selectLoadedFallback();
    };
    if (source.srcset) image.srcset = source.srcset;
    image.src = source.src;
    if (image.complete && image.naturalWidth) image.dataset.loaded = 'true';
    return image;
  }

  function createSegment(index) {
    const segment = document.createElement('span');
    segment.className = 'p10-product-side-preview__segment';
    segment.dataset.previewIndex = String(index);
    return segment;
  }

  function buildPanel(entry) {
    stage.replaceChildren();
    segmentTray.replaceChildren();
    selectedIndex = 0;
    visibleIndex = -1;
    activeLayers = entry.sources.map(createImageLayer);
    activeSegments = entry.sources.map((source, index) => createSegment(index));
    activeLayers.forEach((image) => stage.appendChild(image));
    activeSegments.forEach((segment) => segmentTray.appendChild(segment));
    segmentTray.style.setProperty('--p10-preview-count', String(entry.sources.length));
    activeSegments[0]?.classList.add('is-active');
  }

  function renderSelection(index) {
    const layer = activeLayers[index];
    if (!layer || layer.dataset.loaded !== 'true') return;
    activeLayers.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', itemIndex === index);
    });
    visibleIndex = index;
  }

  function selectImage(index) {
    if (!activeEntry || index < 0 || index >= activeEntry.sources.length) return;
    selectedIndex = index;
    activeSegments.forEach((segment, segmentIndex) => {
      segment.classList.toggle('is-active', segmentIndex === index);
    });
    renderSelection(index);
  }

  function selectLoadedFallback() {
    const fallbackIndex = activeLayers.findIndex((layer) => layer.dataset.loaded === 'true');
    if (fallbackIndex >= 0) selectImage(fallbackIndex);
  }

  function positionPanel(card, panel) {
    const cardRect = card.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const availableLeft = cardRect.left - VIEWPORT_MARGIN_PX;
    const availableRight = window.innerWidth - cardRect.right - VIEWPORT_MARGIN_PX;
    const neededWidth = panelRect.width + PANEL_GAP_PX;
    const placeLeft = availableLeft >= neededWidth || (
      availableRight < neededWidth && availableLeft > availableRight
    );
    const rawLeft = placeLeft
      ? cardRect.left - panelRect.width - PANEL_GAP_PX
      : cardRect.right + PANEL_GAP_PX;
    const maximumTop = Math.max(
      VIEWPORT_MARGIN_PX,
      window.innerHeight - panelRect.height - VIEWPORT_MARGIN_PX,
    );
    const top = Math.min(maximumTop, Math.max(VIEWPORT_MARGIN_PX, cardRect.top));
    const maximumLeft = Math.max(
      VIEWPORT_MARGIN_PX,
      window.innerWidth - panelRect.width - VIEWPORT_MARGIN_PX,
    );

    panel.style.left = `${Math.min(maximumLeft, Math.max(VIEWPORT_MARGIN_PX, rawLeft))}px`;
    panel.style.top = `${top}px`;
    panel.dataset.side = placeLeft ? 'left' : 'right';
  }

  function clearOpenTimer() {
    if (!openTimer) return;
    window.clearTimeout(openTimer);
    openTimer = 0;
  }

  function clearCloseTimer() {
    if (!closeTimer) return;
    window.clearTimeout(closeTimer);
    closeTimer = 0;
  }

  function closePreview() {
    clearOpenTimer();
    clearCloseTimer();
    if (!panel) return;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.hidden = true;
    panel.removeAttribute('data-side');
    stage.replaceChildren();
    segmentTray.replaceChildren();
    activeCard = null;
    activeEntry = null;
    activeLayers = [];
    activeSegments = [];
    selectedIndex = 0;
    visibleIndex = -1;
  }

  function openPreview(card) {
    const entry = entries.get(card);
    if (!entry || !card.isConnected || entry.sources.length < 2) return;
    clearOpenTimer();
    clearCloseTimer();
    activeCard = card;
    activeEntry = entry;
    buildPanel(entry);
    panel.hidden = false;
    positionPanel(card, panel);
    selectImage(0);
    panel.setAttribute('aria-hidden', 'true');
    window.requestAnimationFrame(() => {
      if (activeCard !== card) return;
      panel.classList.add('is-open');
    });
  }

  function scheduleOpen(card) {
    clearOpenTimer();
    clearCloseTimer();
    if (activeCard && activeCard !== card) closePreview();
    openTimer = window.setTimeout(() => openPreview(card), OPEN_DELAY_MS);
  }

  function scheduleClose() {
    clearOpenTimer();
    clearCloseTimer();
    closeTimer = window.setTimeout(closePreview, CLOSE_DELAY_MS);
  }

  function selectFromPointer(event, previewStage, sources) {
    const rect = previewStage.getBoundingClientRect();
    if (!rect.width) return 0;
    const ratio = Math.min(0.999999, Math.max(0, (event.clientX - rect.left) / rect.width));
    return Math.floor(ratio * sources.length);
  }

  function handlePanelPointerMove(event) {
    if (!activeEntry) return;
    const index = selectFromPointer(event, stage, activeEntry.sources);
    if (index !== selectedIndex || visibleIndex !== index) selectImage(index);
  }

  function isStandardListingCard(card) {
    const standardPage = document.body.classList.contains('template-collection')
      || document.body.classList.contains('template-search');
    return standardPage && Boolean(card.closest('.productListing.productGrid'));
  }

  function initialize(template) {
    if (template.hasAttribute(INITIALIZED_ATTRIBUTE)) return;
    const card = template.closest('.product-item');
    const sources = readSources(template);
    if (!card || !isStandardListingCard(card) || sources.length < 2) return;

    template.setAttribute(INITIALIZED_ATTRIBUTE, 'true');
    entries.set(card, { sources });
    card.addEventListener('mouseenter', () => scheduleOpen(card));
    card.addEventListener('mouseleave', scheduleClose);
  }

  function initializeWithin(root) {
    if (root.matches?.(TEMPLATE_SELECTOR)) initialize(root);
    root.querySelectorAll?.(TEMPLATE_SELECTOR).forEach(initialize);
  }

  function boot() {
    panel = createPreviewPanel();
    stage = panel.querySelector('.p10-product-side-preview__stage');
    segmentTray = panel.querySelector('.p10-product-side-preview__segments');
    panel.addEventListener('mouseenter', clearCloseTimer);
    panel.addEventListener('mouseleave', scheduleClose);
    stage.addEventListener('pointermove', handlePanelPointerMove);
    initializeWithin(document);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) initializeWithin(node);
        });
      });
      if (activeCard && !activeCard.isConnected) closePreview();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closePreview();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) closePreview();
    });
    window.addEventListener('resize', closePreview, { passive: true });
    window.addEventListener('scroll', closePreview, { passive: true, capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
