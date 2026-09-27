(() => {
  const SECTION_SELECTOR = '[data-p10-ip-storefront]';
  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  const hasCollection = (card, handle) =>
    !handle || (card.dataset.collections || '').includes(`,${handle},`);

  const setPageScrollLock = () => {
    const hasOpenDrawer = document.querySelector(
      `${SECTION_SELECTOR} [data-filter-drawer].is-open`,
    );
    document.documentElement.classList.toggle(
      'p10-ip-storefront-drawer-open',
      Boolean(hasOpenDrawer),
    );
  };

  const init = (section) => {
    if (section.dataset.p10IpReady === 'true') return;

    if (section.hasAttribute('data-p10-ip-legacy-hub')) {
      section.dataset.p10IpReady = 'true';
      const currentUrl = new URL(window.location.href);
      const lane = currentUrl.searchParams.get('lane');
      const intent = currentUrl.searchParams.get('intent');
      const type = lane === 'merch'
        ? 'merch'
        : intent === 'intent_ccg'
          ? 'ccg'
          : intent === 'intent_tcg'
            ? 'tcg'
            : '';
      const route = type && section.querySelector(`[data-p10-ip-type-route="${type}"]`);
      if (route) {
        const destination = new URL(route.href, currentUrl);
        if (destination.origin === currentUrl.origin) {
          destination.search = currentUrl.search;
          destination.searchParams.delete('lane');
          destination.searchParams.delete('intent');
          window.location.replace(destination.href);
        }
      }
      return;
    }

    const laneButtons = Array.from(
      section.querySelectorAll('[data-lane-target]'),
    );
    const lanePanels = Array.from(
      section.querySelectorAll('[data-lane-panel]'),
    );
    if (!laneButtons.length || !lanePanels.length) return;

    section.dataset.p10IpReady = 'true';

    section.querySelectorAll('[data-load-more]').forEach((button) => button.remove());

    const searchInput = section.querySelector('[data-product-search]');
    const searchClear = section.querySelector('[data-product-search-clear]');
    const drawerTrigger = section.querySelector('[data-filter-open]');
    const drawer = section.querySelector('[data-filter-drawer]');
    const drawerApply = section.querySelector('[data-filter-apply]');
    const drawerReset = section.querySelector('[data-filter-reset]');
    const storefrontMain = section.querySelector('[data-ip-storefront-main]');
    const keepEmptyIntents = section.dataset.keepEmptyIntents === 'true';
    const drawerCloseButtons = Array.from(
      section.querySelectorAll('[data-filter-close]'),
    );
    const availableLanes = lanePanels.map(
      (panel) => panel.dataset.lanePanel,
    );
    const intentByLane = new Map();
    let activeLane = '';
    let lastDrawerTrigger = null;

    const panelFor = (lane) =>
      lanePanels.find((panel) => panel.dataset.lanePanel === lane);

    const intentButtonsFor = (lane) =>
      Array.from(
        section.querySelectorAll(
          `[data-intent-target][data-lane="${CSS.escape(lane)}"]`,
        ),
      );

    const validIntent = (lane, handle) =>
      intentButtonsFor(lane).some(
        (button) => button.dataset.intentTarget === handle,
      );

    const currentSearch = () =>
      (searchInput?.value || '').trim().toLocaleLowerCase();

    const exactTokens = (value) =>
      new Set((value || '').split('|').filter(Boolean));

    const activeIntentButton = (lane) => {
      const activeIntent = intentByLane.get(lane) || '';
      return intentButtonsFor(lane).find(
        (button) => button.dataset.intentTarget === activeIntent,
      );
    };

    const matchesCategory = (card, button) => {
      if (!button || !button.dataset.intentTarget) return true;
      const accepted = exactTokens(button.dataset.filterValues);
      if (button.dataset.filterKind === 'product_type') {
        return accepted.has(card.dataset.productType || '');
      }
      if (button.dataset.filterKind === 'product_tag') {
        const productTags = exactTokens(card.dataset.productTags);
        return [...accepted].some((tag) => productTags.has(tag));
      }
      if (button.dataset.filterKind === 'product_handle') {
        return accepted.has(card.dataset.productHandle || '');
      }
      return [...accepted].some((handle) => hasCollection(card, handle));
    };

    const updateUrl = () => {
      const url = new URL(window.location.href);
      url.searchParams.set('lane', activeLane);
      const intent = intentByLane.get(activeLane) || '';
      if (intent) {
        url.searchParams.set('intent', intent);
      } else {
        url.searchParams.delete('intent');
      }
      history.replaceState(history.state, '', url);
    };

    const syncIntentButtons = (lane) => {
      const activeIntent = intentByLane.get(lane) || '';
      intentButtonsFor(lane).forEach((button) => {
        const isActive = button.dataset.intentTarget === activeIntent;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
      });
    };

    const applyFilters = (lane) => {
      const panel = panelFor(lane);
      if (!panel) return;

      const query = currentSearch();
      const cards = Array.from(panel.querySelectorAll('[data-product-id]'));
      const selectedCategory = activeIntentButton(lane);
      const matchingCards = cards.filter((card) => {
        const searchText = (
          card.dataset.searchText ||
          card.textContent ||
          ''
        ).toLocaleLowerCase();
        return (
          matchesCategory(card, selectedCategory) &&
          (!query || searchText.includes(query))
        );
      });

      const visibleCards = new Set(matchingCards);
      cards.forEach((card) => {
        card.hidden = !visibleCards.has(card);
      });

      intentButtonsFor(lane).forEach((button) => {
        if (!button.dataset.intentTarget) return;
        button.hidden = !keepEmptyIntents && !cards.some((card) => matchesCategory(card, button));
      });

      const totalCount = matchingCards.length;

      const results = panel.querySelector('[data-results-copy]');
      if (results) {
        const noun = totalCount === 1 ? 'product' : 'products';
        results.textContent = `Showing ${totalCount} of ${totalCount} ${noun}.`;
      }

      const emptyState = panel.querySelector('[data-no-results]');
      if (emptyState) emptyState.hidden = totalCount > 0;
    };

    const setLane = (lane, shouldUpdateUrl = false) => {
      if (!availableLanes.includes(lane)) return;
      activeLane = lane;

      laneButtons.forEach((button) => {
        const isActive = button.dataset.laneTarget === lane;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      section.querySelectorAll('[data-sidebar-group]').forEach((group) => {
        group.classList.toggle(
          'is-current',
          group.dataset.sidebarLane === lane,
        );
      });

      lanePanels.forEach((panel) => {
        const isActive = panel.dataset.lanePanel === lane;
        panel.classList.toggle('is-active', isActive);
        panel.hidden = !isActive;
      });

      syncIntentButtons(lane);
      applyFilters(lane);
      if (shouldUpdateUrl) updateUrl();
    };

    const setIntent = (lane, handle, shouldUpdateUrl = false) => {
      if (!availableLanes.includes(lane) || !validIntent(lane, handle)) return;
      intentByLane.set(lane, handle);
      syncIntentButtons(lane);
      applyFilters(lane);
      if (shouldUpdateUrl) updateUrl();
    };

    const openDrawer = () => {
      if (!drawer || !drawerTrigger) return;
      lastDrawerTrigger = document.activeElement;
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      drawerTrigger.setAttribute('aria-expanded', 'true');
      setPageScrollLock();
      const focusTarget = drawer.querySelector(
        '.p10-ip-storefront__filter-header button',
      );
      window.requestAnimationFrame(() => focusTarget?.focus());
    };

    const closeDrawer = () => {
      if (!drawer || !drawerTrigger) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawerTrigger.setAttribute('aria-expanded', 'false');
      setPageScrollLock();
      if (lastDrawerTrigger instanceof HTMLElement) {
        lastDrawerTrigger.focus();
      } else {
        drawerTrigger.focus();
      }
    };

    laneButtons.forEach((button) => {
      button.addEventListener('click', () => {
        setLane(button.dataset.laneTarget, true);
      });
    });

    section.querySelectorAll('[data-intent-target][data-lane]').forEach((button) => {
      button.addEventListener('click', () => {
        const lane = button.dataset.lane;
        if (lane !== activeLane) setLane(lane, false);
        setIntent(lane, button.dataset.intentTarget || '', true);
      });
    });

    searchInput?.addEventListener('input', () => {
      applyFilters(activeLane);
      if (searchClear) searchClear.hidden = !currentSearch();
    });

    searchClear?.addEventListener('click', () => {
      if (!searchInput) return;
      searchInput.value = '';
      searchInput.focus();
      searchClear.hidden = true;
      applyFilters(activeLane);
    });

    drawerTrigger?.addEventListener('click', openDrawer);
    drawerCloseButtons.forEach((button) => {
      button.addEventListener('click', closeDrawer);
    });

    drawerApply?.addEventListener('click', () => {
      closeDrawer();
      window.requestAnimationFrame(() => {
        storefrontMain?.focus({ preventScroll: true });
        storefrontMain?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    drawerReset?.addEventListener('click', () => {
      availableLanes.forEach((lane) => intentByLane.set(lane, ''));
      setLane(availableLanes[0], true);
    });

    drawer?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        drawer.querySelectorAll(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const url = new URL(window.location.href);
    const requestedLane = url.searchParams.get('lane');
    const defaultLane = section.dataset.defaultLane;
    const initialLane = availableLanes.includes(requestedLane)
      ? requestedLane
      : availableLanes.includes(defaultLane)
        ? defaultLane
        : availableLanes[0];
    const requestedIntent = url.searchParams.get('intent') || '';

    availableLanes.forEach((lane) => {
      intentByLane.set(lane, '');
    });
    if (validIntent(initialLane, requestedIntent)) {
      intentByLane.set(initialLane, requestedIntent);
    }

    section.classList.add('is-js-ready');
    if (searchClear) searchClear.hidden = !currentSearch();
    setLane(initialLane, false);
  };

  document.querySelectorAll(SECTION_SELECTOR).forEach(init);

  document.addEventListener('shopify:section:load', (event) => {
    if (event.target.matches?.(SECTION_SELECTOR)) init(event.target);
    event.target.querySelectorAll(SECTION_SELECTOR).forEach(init);
  });
})();
