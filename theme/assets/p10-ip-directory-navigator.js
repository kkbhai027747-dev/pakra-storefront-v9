(() => {
  if (window.P10IpDirectoryNavigatorReady) return;
  window.P10IpDirectoryNavigatorReady = true;

  const DESKTOP_QUERY = '(min-width: 990px)';
  const MOBILE_QUERY = '(max-width: 749px)';
  const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
  const ROOT_SELECTOR = '[data-p10-ip-directory-navigator]';
  const CARD_SELECTOR = '[data-p10-ip-directory-card]';
  const navigatorConfig = window.P10IpDirectoryNavigatorConfig || {};
  const navigatorStates = new WeakMap();
  const DIRECTORY_STATE_PARAMS = {
    ip: 'ip',
    publisher: 'publisher',
    productType: 'product_type',
    market: 'market',
  };

  const createElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const createPartnerLink = (ipKey) => {
    if (ipKey !== 'my-little-pony') return null;

    const link = createElement('a', 'p10-shop-by-ip__partner');
    link.href = '/collections/mlpekayou-guest-picks';
    link.setAttribute('aria-label', 'Open MLPEKAYOU recommended picks');
    const logo = document.createElement('img');
    logo.src = 'https://cdn.shopify.com/s/files/1/0746/1014/7516/files/20260526010525_272_210.png?v=1779728805';
    logo.alt = 'MLPEKAYOU';
    logo.width = 2499;
    logo.height = 781;
    link.append(logo);
    return link;
  };

  const toKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  const getDefaultDescription = (productTypes) => {
    const typeKeys = new Set(productTypes.map(toKey));
    const hasCcg = typeKeys.has('ccg');
    const hasTcg = typeKeys.has('tcg');
    const hasMerch = typeKeys.has('merch-collectibles');

    if ((hasCcg || hasTcg) && hasMerch) {
      return 'Card releases and licensed collectibles.';
    }
    if (hasCcg && hasTcg) {
      return 'Collectible and trading card releases.';
    }
    if (hasCcg && typeKeys.size === 1) {
      return 'Collectible card releases.';
    }
    if (hasMerch && typeKeys.size === 1) {
      return 'Licensed merchandise and collectibles.';
    }
    return '';
  };

  const hydrateDefaultCard = (entry) => {
    const publishers = entry.config?.publisher?.values || [];
    const publisher = publishers.length === 1 ? publishers[0] : '';
    const publisherBadge = entry.card.querySelector('[data-p10-ip-default-publisher]');
    if (publisherBadge) {
      publisherBadge.textContent = publisher ? `BY ${publisher}` : '';
      publisherBadge.hidden = !publisher;
    }

    const productTypes = entry.config?.productType?.values || [];
    const description = entry.config?.description || getDefaultDescription(productTypes);
    const descriptionElement = entry.card.querySelector('[data-p10-ip-default-description]');
    if (descriptionElement) {
      descriptionElement.textContent = description;
      descriptionElement.hidden = !description;
    }

    const productTypeSummary = entry.card.querySelector('[data-p10-ip-default-product-types]');
    if (productTypeSummary) {
      productTypeSummary.replaceChildren(...productTypes.map((productType) => (
        createElement('span', '', productType)
      )));
      productTypeSummary.hidden = !productTypes.length;
    }
  };

  const setExclusiveSelection = (options, selectedOption) => {
    options.forEach((option) => {
      const isSelected = option === selectedOption;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-pressed', String(isSelected));
    });
  };

  const replaceDirectoryStateUrl = (state = {}, { push = false } = {}) => {
    const url = new URL(window.location.href);
    Object.entries(DIRECTORY_STATE_PARAMS).forEach(([stateKey, parameter]) => {
      const value = state[stateKey];
      if (value) {
        url.searchParams.set(parameter, toKey(value));
      } else {
        url.searchParams.delete(parameter);
      }
    });
    if (url.href === window.location.href) return;
    window.history[push ? 'pushState' : 'replaceState'](window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const updateBreadcrumb = (record) => {
    const values = [
      record.state.ipName,
      record.state.publisher,
      record.state.productType,
      record.state.market,
    ].filter(Boolean);

    record.breadcrumb.replaceChildren();
    values.forEach((value) => {
      record.breadcrumb.append(createElement('li', 'p10-shop-by-ip__navigator-crumb', value));
    });
  };

  const getConfiguredRoute = (config, state) => (config.routes || []).find((candidate) => (
    (candidate.publisher || '') === state.publisher
    && (candidate.productType || '') === state.productType
    && (candidate.market || '') === state.market
  ));

  const openConfiguredRoute = (record) => {
    const route = getConfiguredRoute(record.config, record.state);

    if (!route?.url || record.isRestoring) return;
    window.location.assign(route.url);
  };

  const removeMarketLevel = (panel) => {
    panel.querySelector('[data-p10-ip-market-level]')?.remove();
  };

  const removeProductTypeLevel = (panel) => {
    panel.querySelector('[data-p10-ip-product-type-level]')?.remove();
    removeMarketLevel(panel);
  };

  const renderMarketLevel = (panel) => {
    const record = navigatorStates.get(panel);
    const market = record?.config.market;
    if (!market?.values?.length) return;

    const level = createElement('div', 'p10-shop-by-ip__navigator-level');
    level.dataset.p10IpMarketLevel = '';
    level.append(createElement('span', 'p10-shop-by-ip__navigator-label', market.label));

    const options = createElement('div', 'p10-shop-by-ip__navigator-options');
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', market.label);

    market.values.forEach((marketValue) => {
      const option = createElement('button', 'p10-shop-by-ip__navigator-option', marketValue);
      option.type = 'button';
      option.dataset.p10IpMarket = toKey(marketValue);
      option.setAttribute('aria-pressed', 'false');
      option.addEventListener('click', () => {
        setExclusiveSelection(
          Array.from(options.querySelectorAll('[data-p10-ip-market]')),
          option,
        );
        record.state.market = marketValue;
        updateBreadcrumb(record);
        replaceDirectoryStateUrl(record.state);
        openConfiguredRoute(record);
      });
      options.append(option);
    });

    level.append(options);
    panel.append(level);
  };

  const renderProductTypeLevel = (panel) => {
    const record = navigatorStates.get(panel);
    const productType = record?.config.productType;
    if (!productType?.values?.length) return;

    const level = createElement('div', 'p10-shop-by-ip__navigator-level');
    level.dataset.p10IpProductTypeLevel = '';
    level.append(createElement('span', 'p10-shop-by-ip__navigator-label', productType.label));

    const options = createElement('div', 'p10-shop-by-ip__navigator-options');
    options.setAttribute('role', 'group');
    options.setAttribute('aria-label', productType.label);

    productType.values.forEach((productTypeValue) => {
      const option = createElement('button', 'p10-shop-by-ip__navigator-option', productTypeValue);
      option.type = 'button';
      option.dataset.p10IpProductType = toKey(productTypeValue);
      option.setAttribute('aria-pressed', 'false');
      option.addEventListener('click', () => {
        setExclusiveSelection(
          Array.from(options.querySelectorAll('[data-p10-ip-product-type]')),
          option,
        );
        record.state.productType = productTypeValue;
        record.state.market = '';
        removeMarketLevel(panel);

        if (
          option.dataset.p10IpProductType !== toKey(record.config.market?.hiddenForProductType)
          && !getConfiguredRoute(record.config, record.state)
        ) {
          renderMarketLevel(panel);
        }

        updateBreadcrumb(record);
        replaceDirectoryStateUrl(record.state);
        if (!panel.querySelector('[data-p10-ip-market-level]')) {
          openConfiguredRoute(record);
        }
      });
      options.append(option);
    });

    level.append(options);
    panel.append(level);
  };

  const createNavigator = (panel, config, ipName, ipKey) => {
    panel.replaceChildren();
    if (!config) return;

    const pending = config.pending;
    const configuredProductTypes = config.productType?.values || [];

    const breadcrumbContainer = document.createElement('nav');
    breadcrumbContainer.className = 'p10-shop-by-ip__navigator-breadcrumb';
    breadcrumbContainer.setAttribute('aria-label', 'Selected route');
    const breadcrumb = document.createElement('ol');
    breadcrumbContainer.append(breadcrumb);
    const partner = createPartnerLink(ipKey);
    if (partner) {
      breadcrumbContainer.classList.add('p10-shop-by-ip__navigator-breadcrumb--partner');
      breadcrumbContainer.append(partner);
    }
    panel.append(breadcrumbContainer);

    const record = {
      config,
      state: {
        ip: ipKey,
        ipName,
        publisher: config.publisher?.values?.length === 1 ? config.publisher.values[0] : '',
        productType: pending && configuredProductTypes.length === 1 ? configuredProductTypes[0] : '',
        market: '',
      },
      breadcrumb,
      isRestoring: false,
    };
    navigatorStates.set(panel, record);

    const appendLevel = (label, content) => {
      const level = createElement('div', 'p10-shop-by-ip__navigator-level');
      level.append(createElement('span', 'p10-shop-by-ip__navigator-label', label));
      level.append(content);
      panel.append(level);
    };

    if (pending) {
      if (configuredProductTypes.length) {
        appendLevel(
          config.productType.label,
          createElement('span', 'p10-shop-by-ip__navigator-value', configuredProductTypes.join(' / ')),
        );
      }
      appendLevel(
        pending.label || 'Launch status',
        createElement(
          'span',
          'p10-shop-by-ip__navigator-value',
          pending.message || 'Storefront route is awaiting product activation.',
        ),
      );
      updateBreadcrumb(record);
      return;
    }

    const publishers = config.publisher?.values || [];
    if (publishers.length > 1) {
      const options = createElement('div', 'p10-shop-by-ip__navigator-options');
      options.setAttribute('role', 'group');
      options.setAttribute('aria-label', config.publisher.label);
      publishers.forEach((publisher) => {
        const option = createElement('button', 'p10-shop-by-ip__navigator-option', publisher);
        option.type = 'button';
        option.dataset.p10IpPublisher = toKey(publisher);
        option.setAttribute('aria-pressed', 'false');
        option.addEventListener('click', () => {
          setExclusiveSelection(
            Array.from(options.querySelectorAll('[data-p10-ip-publisher]')),
            option,
          );
          record.state.publisher = publisher;
          record.state.productType = '';
          record.state.market = '';
          removeProductTypeLevel(panel);
          renderProductTypeLevel(panel);
          updateBreadcrumb(record);
          replaceDirectoryStateUrl(record.state);
        });
        options.append(option);
      });
      appendLevel(config.publisher.label, options);
    }

    if (publishers.length <= 1) renderProductTypeLevel(panel);

    updateBreadcrumb(record);
  };

  const getEntryName = (entry) => entry.trigger.dataset.p10IpName || entry.trigger.textContent.trim();

  const getEntryMedia = (entry) => {
    const media = entry.card.querySelector('.p10-shop-by-ip__media');
    if (!media) return null;

    const clone = media.cloneNode(true);
    clone.classList.add('p10-shop-by-ip__mobile-node-media');
    clone.removeAttribute('id');
    return clone;
  };

  const stopMobileConstellation = (stage) => {
    stage?.p10IpMobileOrbitStop?.();
  };

  const startMobileOrbit = (stage, orbit, nodes) => {
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
    let frame = 0;
    let rotation = 0;
    let lastTime = 0;
    let visible = true;
    let interacting = false;
    let focused = false;
    let disposed = false;
    let paused = false;

    const positionNodes = () => {
      const radiusX = Math.max(0, Math.min(146, (orbit.clientWidth - 78) / 2));
      nodes.forEach((node, index) => {
        const angle = -Math.PI / 2 + (index * Math.PI * 2 / nodes.length) + rotation;
        node.style.setProperty('--p10-ip-node-x', Math.cos(angle) * radiusX + 'px');
        node.style.setProperty('--p10-ip-node-y', Math.sin(angle) * 100 + 'px');
      });
    };
    const tick = (now) => {
      rotation += Math.min(now - lastTime, 64) * Math.PI * 2 / 48000;
      lastTime = now;
      positionNodes();
      frame = window.requestAnimationFrame(tick);
    };
    const updateMotion = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (disposed) return;
      if (nodes.length && !paused && visible && !document.hidden && !interacting && !focused && !reducedMotion.matches) {
        lastTime = performance.now();
        frame = window.requestAnimationFrame(tick);
      }
    };
    const onPointerEnter = () => { interacting = true; updateMotion(); };
    const onPointerLeave = () => { interacting = false; updateMotion(); };
    const onFocusIn = () => { focused = true; updateMotion(); };
    const onFocusOut = (event) => {
      focused = orbit.contains(event.relatedTarget);
      updateMotion();
    };
    const resizeObserver = new ResizeObserver(positionNodes);
    resizeObserver.observe(orbit);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateMotion();
    });
    intersectionObserver.observe(orbit);
    orbit.addEventListener('pointerenter', onPointerEnter);
    orbit.addEventListener('pointerleave', onPointerLeave);
    orbit.addEventListener('pointerdown', onPointerEnter);
    orbit.addEventListener('pointercancel', onPointerLeave);
    orbit.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse') onPointerLeave();
    });
    orbit.addEventListener('focusin', onFocusIn);
    orbit.addEventListener('focusout', onFocusOut);
    document.addEventListener('visibilitychange', updateMotion);
    reducedMotion.addEventListener('change', updateMotion);
    positionNodes();
    updateMotion();
    stage.p10IpMobileOrbitStop = () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', updateMotion);
      reducedMotion.removeEventListener('change', updateMotion);
      stage.p10IpMobileOrbitStop = null;
    };
    return {
      setNodes(nextNodes) {
        nodes = nextNodes;
        positionNodes();
        updateMotion();
      },
      setPaused(value) {
        paused = value;
        updateMotion();
      },
    };
  };

  const createMobileNode = (entry, onClick) => {
    const node = createElement(onClick ? 'button' : 'div',
      'p10-shop-by-ip__mobile-node p10-shop-by-ip__mobile-node--' + (onClick ? 'ip' : 'root'));
    if (onClick) {
      node.type = 'button';
      node.setAttribute('aria-label', 'Switch to ' + getEntryName(entry));
      node.addEventListener('click', onClick);
    }
    const media = getEntryMedia(entry);
    if (media) node.append(media);
    node.append(createElement('span', 'p10-shop-by-ip__mobile-node-label', getEntryName(entry)));
    return node;
  };

  const createMobileIpPicker = (root, cards, selectedEntry, onSelect, onShowAll) => {
    const opener = document.activeElement;
    const dialog = createElement('dialog', 'p10-shop-by-ip__mobile-ip-dialog');
    dialog.setAttribute('aria-label', 'All IP');
    const header = createElement('div', 'p10-shop-by-ip__mobile-ip-dialog-header');
    const title = createElement('h2', 'p10-shop-by-ip__mobile-ip-dialog-title', 'All IP');
    const close = createElement('button', 'p10-shop-by-ip__mobile-ip-dialog-close', 'Close');
    close.type = 'button';
    header.append(title, close);
    const searchWrap = createElement('div', 'p10-shop-by-ip__mobile-ip-search-wrap');
    const label = createElement('label', '', 'Search IP');
    const search = createElement('input', 'p10-shop-by-ip__mobile-ip-search');
    search.type = 'search';
    search.id = root.id + '-ip-search';
    search.placeholder = 'Search IP';
    search.autocomplete = 'off';
    search.spellcheck = false;
    label.htmlFor = search.id;
    const clear = createElement('button', 'p10-shop-by-ip__mobile-ip-search-clear', 'Clear');
    clear.type = 'button';
    clear.hidden = true;
    searchWrap.append(label, search, clear);
    const status = createElement('div', 'p10-shop-by-ip__mobile-ip-search-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const results = createElement('div', 'p10-shop-by-ip__mobile-ip-results');
    results.setAttribute('role', 'group');
    results.setAttribute('aria-label', 'IP search results');
    const showAll = createElement('button', 'p10-shop-by-ip__mobile-ip-show-all', 'Show all IP');
    showAll.type = 'button';
    showAll.hidden = !selectedEntry;
    dialog.append(header, searchWrap, status, results, showAll);
    root.append(dialog);

    const scrollPosition = { x: window.scrollX, y: window.scrollY };
    const savedStyles = [
      [document.documentElement, ['overflow']],
      [document.body, ['position', 'top', 'left', 'width', 'overflow']],
    ].flatMap(([element, properties]) => properties.map((property) => ({
      element, property, value: element.style.getPropertyValue(property), priority: element.style.getPropertyPriority(property),
    })));
    document.documentElement.style.overflow = 'hidden';
    Object.assign(document.body.style, {
      position: 'fixed', top: -scrollPosition.y + 'px', left: -scrollPosition.x + 'px', width: '100%', overflow: 'hidden',
    });
    let dismissed = false;
    const dismiss = (restoreFocus = true) => {
      if (dismissed) return;
      dismissed = true;
      dialog.close();
      dialog.remove();
      savedStyles.forEach(({ element, property, value, priority }) => {
        if (value) element.style.setProperty(property, value, priority);
        else element.style.removeProperty(property);
      });
      window.scrollTo(scrollPosition.x, scrollPosition.y);
      if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    };
    const normalize = (value) => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '')
      .toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
    const entries = cards.filter((candidate) => candidate.config).map((candidate) => {
      const name = getEntryName(candidate);
      const initials = name.split(/\s+/).map((word) => word[0]).join('');
      const terms = [name, initials, candidate.trigger.dataset.p10IpKey, ...(candidate.config.aliases || [])].map(normalize);
      const button = createElement('button', 'p10-shop-by-ip__mobile-ip-result');
      button.type = 'button';
      button.setAttribute('aria-label', name);
      button.setAttribute('aria-pressed', String(candidate === selectedEntry));
      const media = getEntryMedia(candidate);
      if (media) button.append(media);
      button.append(createElement('span', 'p10-shop-by-ip__mobile-ip-result-name', name));
      button.addEventListener('click', () => {
        dismiss(candidate === selectedEntry);
        if (candidate !== selectedEntry) onSelect(candidate);
      });
      results.append(button);
      return { button, terms };
    });
    const filter = () => {
      const query = normalize(search.value);
      let count = 0;
      entries.forEach(({ button, terms }) => {
        button.hidden = !terms.some((term) => term.includes(query));
        if (!button.hidden) count += 1;
      });
      clear.hidden = !search.value;
      status.textContent = count ? count + (count === 1 ? ' IP' : ' IPs') : 'No IP found. Try another name.';
      results.scrollTop = 0;
    };
    search.addEventListener('input', filter);
    clear.addEventListener('click', () => { search.value = ''; filter(); search.focus(); });
    close.addEventListener('click', () => dismiss());
    showAll.addEventListener('click', () => { dismiss(false); onShowAll(); });
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); dismiss(); });
    dialog.addEventListener('close', () => dismiss());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dismiss();
    });
    filter();
    dialog.showModal();
    close.focus({ preventScroll: true });
    return dismiss;
  };

  const createMobileNavigator = (panel, record) => {
    const { entry, cards, openPicker, switchIp, parameters, push = false, orbitPage = 0 } = record;
    const config = entry.config;
    const publishers = config.publisher?.values || [];
    const productTypes = config.productType?.values || [];
    const markets = config.market?.values || [];
    const resolveValue = (values, key) => values.find((value) => (
      toKey(value) === toKey(parameters?.get(DIRECTORY_STATE_PARAMS[key]))
    )) || '';
    const state = {
      ip: entry.trigger.dataset.p10IpKey || '',
      publisher: publishers.length === 1 ? publishers[0] : resolveValue(publishers, 'publisher'),
      productType: config.pending && productTypes.length === 1
        ? productTypes[0]
        : resolveValue(productTypes, 'productType'),
      market: resolveValue(markets, 'market'),
    };
    const publisherReady = () => !publishers.length || Boolean(state.publisher);
    const routesForType = (productType) => (config.routes || []).filter((route) => (
      toKey(route.publisher) === toKey(state.publisher) && toKey(route.productType) === toKey(productType)
    ));
    const availableMarkets = () => markets.filter((market) => (
      getConfiguredRoute(config, { ...state, market })
    ));
    const normalizeSelection = () => {
      if (config.pending) {
        state.market = '';
        return;
      }
      if (!publisherReady() || !routesForType(state.productType).length) state.productType = '';
      if (!state.productType) {
        state.market = '';
        return;
      }
      if (getConfiguredRoute(config, { ...state, market: '' })) {
        state.market = '';
        return;
      }
      const values = availableMarkets();
      state.market = values.length === 1 ? values[0] : values.includes(state.market) ? state.market : '';
    };
    normalizeSelection();
    stopMobileConstellation(panel.querySelector('.p10-shop-by-ip__mobile-stage'));
    panel.replaceChildren();
    const stage = createElement('section', 'p10-shop-by-ip__mobile-stage');
    stage.setAttribute('aria-label', getEntryName(entry) + ' filters');
    const toolbar = createElement('div', 'p10-shop-by-ip__mobile-toolbar');
    const allIpButton = createElement('button', 'p10-shop-by-ip__mobile-all-ip', 'All IP');
    allIpButton.type = 'button';
    allIpButton.setAttribute('aria-haspopup', 'dialog');
    allIpButton.addEventListener('click', () => openPicker(entry));
    const resetButton = createElement('button', 'p10-shop-by-ip__mobile-back', 'Reset filters');
    resetButton.type = 'button';
    toolbar.append(allIpButton, resetButton);
    const context = createElement('div', 'p10-shop-by-ip__mobile-context');
    const kicker = createElement('span', 'p10-shop-by-ip__mobile-kicker', 'Selected IP');
    const trail = createElement('h2', 'p10-shop-by-ip__mobile-trail', getEntryName(entry));
    const hint = createElement('span', 'p10-shop-by-ip__mobile-selection-hint');
    context.append(kicker, trail, hint);
    const partner = createPartnerLink(state.ip);
    if (partner) {
      context.classList.add('p10-shop-by-ip__mobile-context--partner');
      context.append(partner);
    }
    stage.append(toolbar, context);

    const createChoiceGroup = (label, className) => {
      const group = createElement('div', className);
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', label);
      group.append(createElement('div', 'p10-shop-by-ip__mobile-choice-dock-label', label));
      const options = createElement('div', 'p10-shop-by-ip__mobile-choice-options');
      group.append(options);
      stage.append(group);
      return { group, options };
    };
    const createOption = (value, onClick, detail = '') => {
      const option = createElement('button', 'p10-shop-by-ip__mobile-option');
      option.type = 'button';
      option.setAttribute('aria-pressed', 'false');
      option.append(createElement('span', 'p10-shop-by-ip__mobile-option-title', value));
      if (detail) option.append(createElement('span', 'p10-shop-by-ip__mobile-option-detail', detail));
      option.addEventListener('click', onClick);
      return option;
    };
    const publisherGroup = publishers.length > 1
      ? createChoiceGroup('Publisher', 'p10-shop-by-ip__mobile-publisher') : null;
    const typeGroup = createChoiceGroup('Choose product type', 'p10-shop-by-ip__mobile-choice-dock');
    const marketGroup = createChoiceGroup('Choose region', 'p10-shop-by-ip__mobile-market');
    const status = createElement('div', 'p10-shop-by-ip__mobile-status');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const submit = createElement('a', 'p10-shop-by-ip__mobile-submit', 'View products');
    submit.addEventListener('click', (event) => {
      if (!getConfiguredRoute(config, state)) event.preventDefault();
    });
    stage.append(status, submit);
    const orbitLabel = createElement('div', 'p10-shop-by-ip__mobile-switch-label', 'Explore another IP');
    const orbit = createElement('div', 'p10-shop-by-ip__mobile-orbit');
    orbit.setAttribute('role', 'group');
    orbit.setAttribute('aria-label', 'Switch IP');
    orbit.append(createMobileNode(entry));
    const orbitItems = createElement('div', 'p10-shop-by-ip__mobile-orbit-items');
    orbit.append(orbitItems);
    const siblings = cards.filter((candidate) => candidate !== entry && candidate.config);
    const pageCount = Math.max(1, Math.ceil(siblings.length / 5));
    const baseSize = Math.floor(siblings.length / pageCount);
    const extra = siblings.length % pageCount;
    let pageIndex = 0;
    const pagination = createElement('nav', 'p10-shop-by-ip__mobile-orbit-pagination');
    pagination.setAttribute('aria-label', 'IP pages');
    pagination.hidden = pageCount === 1;
    const previous = createElement('button', 'p10-shop-by-ip__mobile-page-button', 'Previous');
    previous.type = 'button';
    previous.setAttribute('aria-label', 'Previous IP page');
    const pageStatus = createElement('span', 'p10-shop-by-ip__mobile-page-status');
    pageStatus.setAttribute('role', 'status');
    pageStatus.setAttribute('aria-live', 'polite');
    pageStatus.setAttribute('aria-atomic', 'true');
    const next = createElement('button', 'p10-shop-by-ip__mobile-page-button', 'Next');
    next.type = 'button';
    next.setAttribute('aria-label', 'Next IP page');
    pagination.append(previous, pageStatus, next);
    stage.append(orbitLabel, orbit, pagination);
    panel.append(stage);
    const motion = startMobileOrbit(stage, orbit, []);
    stage.p10IpMobileOrbitPause = motion.setPaused;
    const renderOrbitPage = (newIndex, animate = false) => {
      const direction = newIndex >= pageIndex ? 1 : -1;
      pageIndex = Math.max(0, Math.min(pageCount - 1, newIndex));
      const start = pageIndex * baseSize + Math.min(pageIndex, extra);
      const size = baseSize + (pageIndex < extra ? 1 : 0);
      const nodes = siblings.slice(start, start + size).map((candidate) => createMobileNode(candidate, () => switchIp(candidate, pageIndex)));
      orbitItems.getAnimations().forEach((animation) => animation.cancel());
      orbitItems.replaceChildren(...nodes);
      motion.setNodes(nodes);
      previous.disabled = pageIndex === 0;
      next.disabled = pageIndex === pageCount - 1;
      pageStatus.textContent = (pageIndex + 1) + ' / ' + pageCount;
      orbit.dataset.p10IpPage = String(pageIndex + 1);
      if (animate && !window.matchMedia(REDUCED_MOTION_QUERY).matches) {
        orbitItems.animate([
          { opacity: 0, transform: 'translateX(' + direction * 16 + 'px)' },
          { opacity: 1, transform: 'translateX(0)' },
        ], { duration: 200, easing: 'ease-out' });
      }
    };
    const changePage = (direction) => {
      const nextIndex = pageIndex + direction;
      if (nextIndex < 0 || nextIndex >= pageCount) return;
      const active = document.activeElement;
      const focusWasInside = orbitItems.contains(active);
      renderOrbitPage(nextIndex, true);
      if (focusWasInside) orbitItems.querySelector('button')?.focus({ preventScroll: true });
      else if (active === next && next.disabled) previous.focus({ preventScroll: true });
      else if (active === previous && previous.disabled) next.focus({ preventScroll: true });
    };
    previous.addEventListener('click', () => changePage(-1));
    next.addEventListener('click', () => changePage(1));
    const onArrowKey = (event) => {
      if (pageCount < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      changePage(event.key === 'ArrowRight' ? 1 : -1);
    };
    orbit.addEventListener('keydown', onArrowKey);
    pagination.addEventListener('keydown', onArrowKey);
    let gesture = null;
    let suppressClickUntil = 0;
    orbit.addEventListener('pointerdown', (event) => {
      if (pageCount < 2 || event.pointerType !== 'touch' || !event.isPrimary) { gesture = null; return; }
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    orbit.addEventListener('pointermove', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (Math.abs(event.clientY - gesture.y) > 18 && Math.abs(event.clientY - gesture.y) > Math.abs(event.clientX - gesture.x)) gesture = null;
    });
    orbit.addEventListener('pointercancel', () => { gesture = null; });
    orbit.addEventListener('pointerup', (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      suppressClickUntil = performance.now() + 500;
      changePage(dx < 0 ? 1 : -1);
    });
    orbit.addEventListener('click', (event) => {
      if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    renderOrbitPage(orbitPage);

    const update = ({ push: pushState = true } = {}) => {
      normalizeSelection();
      replaceDirectoryStateUrl(state, { push: pushState });
      hint.textContent = state.publisher ? 'By ' + state.publisher : 'Choose a category to explore';

      if (config.pending) {
        resetButton.hidden = true;
        if (publisherGroup) publisherGroup.group.hidden = true;
        typeGroup.group.hidden = true;
        marketGroup.group.hidden = true;
        submit.hidden = true;
        status.textContent = [
          productTypes.join(' / '),
          config.pending.message || 'Storefront route is awaiting product activation.',
        ].filter(Boolean).join(' · ');
        stage.dataset.p10IpMobileLevel = 'pending';
        return;
      }

      resetButton.hidden = !state.productType && !(publishers.length > 1 && state.publisher);
      publisherGroup?.options.querySelectorAll('button').forEach((option) => {
        option.setAttribute('aria-pressed', String(option.dataset.value === state.publisher));
      });
      typeGroup.options.querySelectorAll('button').forEach((option) => {
        option.disabled = !publisherReady() || !routesForType(option.dataset.value).length;
        option.setAttribute('aria-pressed', String(option.dataset.value === state.productType));
      });
      const validMarkets = availableMarkets();
      const marketNeeded = Boolean(state.productType) &&
        !getConfiguredRoute(config, { ...state, market: '' }) &&
        (validMarkets.length > 1 || (config.market?.showSingleOption && validMarkets.length === 1));
      marketGroup.group.hidden = !marketNeeded;
      marketGroup.options.replaceChildren();
      if (marketNeeded) validMarkets.forEach((value) => {
        const option = createOption(value, () => {
          state.market = value;
          update();
          marketGroup.options.querySelector('[aria-pressed="true"]')?.focus({ preventScroll: true });
        });
        option.setAttribute('aria-pressed', String(value === state.market));
        marketGroup.options.append(option);
      });
      const route = getConfiguredRoute(config, state);
      if (route) submit.setAttribute('href', route.url);
      else submit.removeAttribute('href');
      submit.setAttribute('aria-disabled', String(!route));
      submit.tabIndex = route ? 0 : -1;
      status.textContent = route
        ? [state.productType, state.market && 'Region: ' + state.market].filter(Boolean).join(' · ')
        : !publisherReady() ? 'Choose a publisher to continue.'
          : !state.productType ? 'Choose a product type to continue.'
            : marketNeeded ? 'Choose a region to continue.' : 'No matching collection is available.';
      stage.dataset.p10IpMobileLevel = !publisherReady() ? 'publisher' : marketNeeded && !state.market ? 'market' : 'productType';
    };
    publishers.forEach((value) => {
      if (!publisherGroup) return;
      const option = createOption(value, () => {
        state.publisher = value;
        state.productType = '';
        state.market = '';
        update();
      });
      option.dataset.value = value;
      publisherGroup.options.append(option);
    });
    const descriptions = { ccg: 'Collectible cards', tcg: 'Trading card games' };
    productTypes.forEach((value) => {
      const option = createOption(value, () => {
        state.productType = value;
        state.market = '';
        update();
      }, descriptions[toKey(value)]);
      option.dataset.value = value;
      typeGroup.options.append(option);
    });
    resetButton.addEventListener('click', () => {
      state.publisher = publishers.length === 1 ? publishers[0] : '';
      state.productType = '';
      state.market = '';
      update();
      (publisherGroup || typeGroup).options.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
    });
    update({ push });
  };

  const initializeNavigator = (root) => {
    if (root.dataset.p10IpDirectoryNavigatorReady === 'true') return;

    const cards = Array.from(root.querySelectorAll(CARD_SELECTOR)).map((trigger) => ({
      trigger,
      card: trigger.closest('.p10-shop-by-ip__card'),
      panel: trigger.closest('.p10-shop-by-ip__card')?.querySelector('[data-p10-ip-navigator-panel]'),
      config: navigatorConfig[trigger.dataset.p10IpKey],
    })).filter(({ card }) => card);
    const mobileCards = cards.filter(({ card }) => card.dataset.p10IpDesktopOnly !== 'true');

    if (!cards.length) return;

    cards.forEach(hydrateDefaultCard);

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const mobile = window.matchMedia(MOBILE_QUERY);
    const board = root.querySelector('.p10-shop-by-ip__board');
    const entriesByCard = new Map(cards.map((entry) => [entry.card, entry]));
    let desktopEntry = null;
    let resizeFrame = 0;
    const placeDesktopPanel = () => {
      if (!desktop.matches || !desktopEntry?.panel) return;
      desktopEntry.card.append(desktopEntry.panel);
      const visibleCards = cards.filter(({ card }) => card.getClientRects().length);
      const rowTop = desktopEntry.card.offsetTop;
      const rowEnd = visibleCards.filter(({ card }) => Math.abs(card.offsetTop - rowTop) < 2).pop();
      if (rowEnd && rowEnd.card.nextElementSibling !== desktopEntry.panel) {
        rowEnd.card.after(desktopEntry.panel);
      }
    };
    let boardWidth = 0;
    const resizeObserver = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === boardWidth) return;
      boardWidth = entry.contentRect.width;
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(placeDesktopPanel);
    });
    resizeObserver.observe(board);
    let dismissPicker = () => {};
    const directorySearch = createElement('button', 'p10-shop-by-ip__mobile-directory-search p10-shop-by-ip__mobile-all-ip', 'Find an IP');
    directorySearch.type = 'button';
    directorySearch.setAttribute('aria-haspopup', 'dialog');
    directorySearch.hidden = true;
    root.querySelector('.p10-shop-by-ip__board').before(directorySearch);
    const openPicker = (selectedEntry = null) => {
      dismissPicker(false);
      const activeStage = root.querySelector('.p10-shop-by-ip__mobile-stage');
      activeStage?.p10IpMobileOrbitPause?.(true);
      const dismiss = createMobileIpPicker(root, mobileCards, selectedEntry, (candidate) => {
        activateMobile(candidate);
        candidate.card.querySelector('.p10-shop-by-ip__mobile-all-ip')?.focus({ preventScroll: true });
      }, () => {
        reset({ push: true });
        (directorySearch.hidden ? selectedEntry?.trigger : directorySearch)?.focus({ preventScroll: true });
      });
      dismissPicker = (restoreFocus = true) => {
        dismiss(restoreFocus);
        activeStage?.p10IpMobileOrbitPause?.(false);
      };
      root.querySelector('.p10-shop-by-ip__mobile-ip-dialog').addEventListener('close', () => activeStage?.p10IpMobileOrbitPause?.(false), { once: true });
    };
    directorySearch.addEventListener('click', () => openPicker());

    const updatePublisherBadge = (entry, isActive) => {
      const badge = entry.card.querySelector('[data-p10-ip-publisher-badge]');
      if (!badge) return;

      const publishers = entry.config?.publisher?.values || [];
      const publisher = isActive && publishers.length === 1 ? publishers[0] : '';
      badge.textContent = publisher ? `BY ${publisher}` : '';
      badge.hidden = !publisher;
    };

    const reset = ({ updateUrl = true, push = false } = {}) => {
      dismissPicker(false);
      desktopEntry = null;
      root.classList.remove('is-navigator-active', 'is-mobile-navigator-active');
      root.removeAttribute('data-p10-ip-active');
      directorySearch.hidden = !mobile.matches || mobileCards.length <= 6;

      cards.forEach((entry) => {
        const { card, trigger } = entry;
        card.classList.remove('is-navigator-active', 'is-mobile-navigator-active');
        trigger.removeAttribute('aria-pressed');
        trigger.removeAttribute('aria-expanded');
        trigger.dataset.p10IpOriginalRole ||= trigger.getAttribute('role') || 'link';
        trigger.setAttribute('role', desktop.matches || mobile.matches ? 'button' : trigger.dataset.p10IpOriginalRole);
        if (desktop.matches || mobile.matches) trigger.setAttribute('aria-expanded', 'false');
        updatePublisherBadge(entry, false);

        const { panel } = entry;
        if (panel) {
          card.append(panel);
          panel.removeAttribute('role');
          stopMobileConstellation(panel.querySelector('.p10-shop-by-ip__mobile-stage'));
          panel.replaceChildren();
          panel.hidden = true;
        }
      });

      if (updateUrl) replaceDirectoryStateUrl({}, { push });
    };

    const activate = (activeCard, { updateUrl = true, preserveScroll = false } = {}) => {
      const previousTop = activeCard.card.getBoundingClientRect().top;
      desktopEntry = activeCard;
      root.classList.add('is-navigator-active');
      root.dataset.p10IpActive = activeCard.trigger.dataset.p10IpName || '';

      cards.forEach((candidate) => {
        const isActive = candidate === activeCard;
        candidate.card.classList.toggle('is-navigator-active', isActive);
        candidate.trigger.setAttribute('aria-expanded', String(isActive));

        const { panel } = candidate;
        if (!panel) return;

        if (isActive && candidate.config) {
          if (panel.hidden) {
            createNavigator(
              panel,
              candidate.config,
              candidate.trigger.dataset.p10IpName || '',
              candidate.trigger.dataset.p10IpKey || '',
            );
          }
          panel.setAttribute('role', 'listitem');
          ['--p10-ip-accent', '--p10-ip-soft'].forEach((property) => {
            panel.style.setProperty(property, candidate.card.style.getPropertyValue(property));
          });
          panel.hidden = false;
          return;
        }

        panel.hidden = true;
        panel.removeAttribute('role');
        candidate.card.append(panel);
      });

      placeDesktopPanel();
      if (preserveScroll) {
        window.scrollBy({ top: activeCard.card.getBoundingClientRect().top - previousTop, behavior: 'instant' });
      }
      if (updateUrl) {
        const { panel } = activeCard;
        const record = panel ? navigatorStates.get(panel) : null;
        if (record) replaceDirectoryStateUrl(record.state);
      }
    };

    const activateMobile = (activeCard, { parameters, push = true, orbitPage = 0 } = {}) => {
      dismissPicker(false);
      root.classList.add('is-mobile-navigator-active');
      root.dataset.p10IpActive = activeCard.trigger.dataset.p10IpName || '';
      directorySearch.hidden = true;

      mobileCards.forEach((candidate) => {
        const isActive = candidate === activeCard;
        candidate.card.classList.toggle('is-mobile-navigator-active', isActive);
        candidate.trigger.setAttribute('aria-expanded', String(isActive));

        const panel = candidate.card.querySelector('[data-p10-ip-navigator-panel]');
        if (!panel) return;

        if (isActive) {
          panel.hidden = false;
          createMobileNavigator(panel, {
            entry: candidate,
            cards: mobileCards,
            parameters,
            push,
            orbitPage,
            openPicker,
            switchIp: (candidate, orbitPage) => {
              activateMobile(candidate, { orbitPage });
              candidate.card.querySelector('.p10-shop-by-ip__mobile-all-ip')?.focus({ preventScroll: true });
            },
          });
          return;
        }

        stopMobileConstellation(panel.querySelector('.p10-shop-by-ip__mobile-stage'));
        panel.replaceChildren();
        panel.hidden = true;
      });
    };

    const restoreFromUrl = () => {
      const parameters = new URLSearchParams(window.location.search);
      if (toKey(parameters.get(DIRECTORY_STATE_PARAMS.ip)) === 'disney-lorcana') {
        parameters.set(DIRECTORY_STATE_PARAMS.ip, 'disney');
        parameters.set(DIRECTORY_STATE_PARAMS.productType, 'tcg');
        parameters.delete(DIRECTORY_STATE_PARAMS.publisher);
        parameters.delete(DIRECTORY_STATE_PARAMS.market);
        replaceDirectoryStateUrl({ ip: 'disney', productType: 'TCG' });
      }

      if (!desktop.matches && !mobile.matches) return;

      const ipKey = toKey(parameters.get(DIRECTORY_STATE_PARAMS.ip));
      if (!ipKey) return;

      const entry = cards.find(({ trigger }) => toKey(trigger.dataset.p10IpKey) === ipKey);
      if (!entry?.config) return;

      if (mobile.matches) {
        if (mobileCards.includes(entry)) activateMobile(entry, { parameters, push: false });
        return;
      }

      activate(entry, { updateUrl: false });
      const { panel } = entry;
      const record = panel ? navigatorStates.get(panel) : null;
      if (!record) return;

      record.isRestoring = true;
      const selectOption = (selector, value) => {
        const valueKey = toKey(value);
        if (!valueKey) return;
        const option = Array.from(panel.querySelectorAll(selector)).find((candidate) => (
          toKey(candidate.textContent) === valueKey
        ));
        option?.click();
      };

      selectOption('[data-p10-ip-publisher]', parameters.get(DIRECTORY_STATE_PARAMS.publisher));
      selectOption('[data-p10-ip-product-type]', parameters.get(DIRECTORY_STATE_PARAMS.productType));
      selectOption('[data-p10-ip-market]', parameters.get(DIRECTORY_STATE_PARAMS.market));
      record.isRestoring = false;
      replaceDirectoryStateUrl(record.state);
    };

    const syncViewport = () => {
      reset({ updateUrl: false });
      restoreFromUrl();
    };

    root.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.target.closest('[data-p10-ip-navigator-panel]')) return;
      const card = event.target.closest('.p10-shop-by-ip__card');
      if (!card || !root.contains(card)) {
        if (desktop.matches && root.classList.contains('is-navigator-active')) reset();
        return;
      }

      const entry = entriesByCard.get(card);
      if (!entry?.config) return;

      if (desktop.matches) {
        event.preventDefault();
        if (entry === desktopEntry) reset();
        else activate(entry, { preserveScroll: true });
      } else if (mobile.matches) {
        event.preventDefault();
        activateMobile(entry);
        entry.card.querySelector('.p10-shop-by-ip__mobile-all-ip')?.focus({ preventScroll: true });
      }
    });

    root.addEventListener('keydown', (event) => {
      if (desktop.matches && event.key === 'Escape' && desktopEntry) {
        const { trigger } = desktopEntry;
        event.preventDefault();
        reset();
        trigger.focus({ preventScroll: true });
        return;
      }
      if ((!desktop.matches && !mobile.matches) || event.key !== ' ') return;

      const trigger = event.target.closest(CARD_SELECTOR);
      if (!trigger || !root.contains(trigger)) return;

      const entry = entriesByCard.get(trigger.closest('.p10-shop-by-ip__card'));
      if (!entry?.config) return;

      event.preventDefault();
      if (desktop.matches) {
        if (entry === desktopEntry) reset();
        else activate(entry, { preserveScroll: true });
      }
      else {
        activateMobile(entry);
        entry.card.querySelector('.p10-shop-by-ip__mobile-all-ip')?.focus({ preventScroll: true });
      }
    });

    desktop.addEventListener('change', syncViewport);
    mobile.addEventListener('change', syncViewport);
    window.addEventListener('popstate', syncViewport);
    const onPageShow = (event) => {
      if (event.persisted) syncViewport();
    };
    const onSectionUnload = (event) => {
      if (event.target !== root && !event.target.contains(root)) return;
      reset({ updateUrl: false });
      resizeObserver.disconnect();
      window.cancelAnimationFrame(resizeFrame);
      directorySearch.remove();
      desktop.removeEventListener('change', syncViewport);
      mobile.removeEventListener('change', syncViewport);
      window.removeEventListener('popstate', syncViewport);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('shopify:section:unload', onSectionUnload);
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('shopify:section:unload', onSectionUnload);
    root.dataset.p10IpDirectoryNavigatorReady = 'true';
    syncViewport();
  };

  document.querySelectorAll(ROOT_SELECTOR).forEach(initializeNavigator);

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target.matches?.(ROOT_SELECTOR)) initializeNavigator(event.target);
    event.target.querySelectorAll(ROOT_SELECTOR).forEach(initializeNavigator);
  });
})();
