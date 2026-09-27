(() => {
  'use strict';

  const SERIES_ORDER = Object.freeze([
    'all',
    'fun-moments',
    'rainbow',
    'moon',
    'star',
    'tcg',
    'pr',
    'spring-festival',
    'kayou-mlp',
  ]);

  const RARITY_ORDER = Object.freeze([
    'hidden-zr', 'sc', 'zr',
    'hidden-ar', 'ar', 'or', 'bp',
    'hidden-cr', 'hidden-gr', 'hidden-rr', 'hidden-er', 'hidden-spr', 'hidden-tk',
    'cr', 'gr', 'rr', 'er', 'xr', 'usr', 'ugr', 'tgr', 'sgr',
    'ur', 'lsr', 'mtr', 'tr', 'fr', 'hidden-n',
    'hr', 'ssr', 'scr', 'spr', 'sp', 'sr', 'r', 'n', 'f', 'st', 'base', 'ptr', 'card',
  ]);

  const RARITY_ORDER_BY_SERIES = Object.freeze({
    'fun-moments': Object.freeze(['hidden-cr', 'cr', 'ugr', 'ur', 'ssr', 'hidden-n', 'sr', 'r', 'n', 'card']),
    rainbow: Object.freeze(['xr', 'usr', 'ur', 'ssr', 'fr', 'sr', 'r', 'tgr', 'tr', 'st', 'base', 'card']),
    moon: Object.freeze(['hidden-zr', 'sc', 'zr', 'sgr', 'lsr', 'ur', 'hr', 'ssr', 'sr', 'r', 'card']),
    star: Object.freeze(['hidden-ar', 'bp', 'or', 'ar', 'usr', 'ur', 'scr', 'ssr', 'card']),
    tcg: Object.freeze(['hidden-cr', 'hidden-gr', 'hidden-rr', 'hidden-er', 'hidden-spr', 'hidden-tk', 'cr', 'gr', 'rr', 'er', 'spr', 'sr', 'tk', 'u', 'c', 'pr', 'card']),
    'spring-festival': Object.freeze(['sp', 'card']),
    'kayou-mlp': Object.freeze(['spr', 'sp', 'sgr', 'lsr', 'ur', 'sr', 'r', 'card']),
  });

  const DEFAULT_FILTERS = Object.freeze({
    series: 'all',
    rarity: 'all',
    wave: 'all',
  });

  const SPOTLIGHT_CAMPAIGN_WEIGHT = 0.6;
  const SPOTLIGHT_CAMPAIGN_CODES = Object.freeze(new Set([
    'fx02hiddendiamondar007',
    'fx02hiddendiamondar009',
    'hy06sc001l5',
  ]));
  const SPOTLIGHT_CAMPAIGN_VARIANT_IDS = Object.freeze(new Set([
    '47098044350652',
    '47098044416188',
    '46985148989628',
  ]));

  const SERIES_LABELS = Object.freeze({
    all: 'All cards',
    'fun-moments': 'Fun Moments',
    rainbow: 'Rainbow',
    moon: 'Moon',
    star: 'Star',
    tcg: 'TCG',
    pr: 'PR',
    'spring-festival': 'Spring Festival',
    'kayou-mlp': 'KAYOU MLP',
  });

  const WAVE_LABELS = Object.freeze({
    'tcg-w1': 'TCG 1',
    'tcg-w2': 'TCG 2',
    'tcg-w3': 'TCG 3',
    'tcg-w4': 'TCG 4',
  });

  const SERIES_VISUAL_META = Object.freeze({
    all: Object.freeze({ code: 'ALL', tone: 'all' }),
    'fun-moments': Object.freeze({ code: 'T2', tone: 'fun-moments' }),
    rainbow: Object.freeze({ code: 'T3', tone: 'rainbow' }),
    moon: Object.freeze({ code: 'T4', tone: 'moon' }),
    star: Object.freeze({ code: 'T5', tone: 'star' }),
    tcg: Object.freeze({ code: 'TCG', tone: 'tcg' }),
    pr: Object.freeze({ code: 'PR', tone: 'pr' }),
    'spring-festival': Object.freeze({ code: 'SP', tone: 'spring-festival' }),
    'kayou-mlp': Object.freeze({ code: 'K', tone: 'kayou-mlp' }),
  });

  const EVENT_RARITY_KEYS = Object.freeze(['pr', 'sp', 'spr', 'ptr']);

  const RARITY_LABELS = Object.freeze({
    'hidden-zr': 'Hidden Diamond ZR',
    'hidden-ar': 'Hidden Diamond AR',
    'hidden-cr': 'Hidden Diamond CR',
    'hidden-n': 'Hidden Diamond N',
    'hidden-gr': 'Hidden GR',
    'hidden-rr': 'Hidden RR',
    'hidden-er': 'Hidden ER',
    'hidden-spr': 'Hidden SPR',
    'hidden-tk': 'Hidden TK',
  });

  function normalizeKey(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function canonicalRarityKey(value) {
    const key = normalizeKey(value);
    if (['dzr', 'ozr', 'qzr', 'diamond-zr', 'hidden-diamond-zr'].includes(key)) return 'hidden-zr';
    if (['dar', 'oar', 'qar', 'diamond-ar', 'hidden-diamond-ar', 'hidden-ar'].includes(key)) return 'hidden-ar';
    if (['dcr', 'ocr', 'qcr', 'diamond-cr', 'hidden-diamond-cr', 'hidden-cr'].includes(key)) return 'hidden-cr';
    if (['dn', 'diamond-n', 'hidden-diamond-n', 'hidden-n'].includes(key)) return 'hidden-n';
    return key || 'card';
  }

  function cleanRarityLabel(value) {
    const text = String(value || '')
      .replace(/^\s*>\s*/, '')
      .replace(/[◆◇]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (/^hidden\s+\*ar$/i.test(text) || /^\*ar$/i.test(text)) return 'Hidden Diamond AR';
    return text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function buyerText(value) {
    return String(value || '')
      .replace(/^KAYOU\s+(?:MLP|My\s+Little\s+Pony)\s+/i, '')
      .replace(/\b(?:draft|unlisted)\b/gi, '')
      .replace(/\bSKU\b/gi, 'card')
      .replace(/\s+(?:Single\s+Cards?|Card\s+Bundle)$/i, '')
      .replace(/\bBundle\b/gi, '')
      .replace(/[-|/]+\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function labelForFacet(kind, value, groups = []) {
    const key = kind === 'rarity' ? canonicalRarityKey(value) : normalizeKey(value) || 'all';
    if (key === 'all') {
      if (kind === 'series') return 'All cards';
      if (kind === 'rarity') return 'Any rarity';
      if (kind === 'wave') return 'Any wave';
      return 'All';
    }
    if (kind === 'series') return SERIES_LABELS[key] || buyerText(value);
    if (kind === 'wave') return WAVE_LABELS[key] || String(value || '').toUpperCase();
    if (kind === 'rarity') {
      if (RARITY_LABELS[key]) return RARITY_LABELS[key];
      const match = Array.from(groups || []).find((group) => canonicalRarityKey(group?.rarityKey || group?.rarity) === key);
      return cleanRarityLabel(match?.rarity || String(value || '').toUpperCase());
    }
    return buyerText(value);
  }

  function seriesVisualMeta(value) {
    const key = normalizeKey(value) || 'all';
    return SERIES_VISUAL_META[key] || { code: key.slice(0, 3).toUpperCase(), tone: 'other' };
  }

  function rarityVisualFamily(value) {
    const key = canonicalRarityKey(value);
    if (key.startsWith('hidden-')) return 'hidden';
    if (EVENT_RARITY_KEYS.includes(key)) return 'event';
    if (key.length >= 3 && key !== 'base' && key !== 'card') return 'signature';
    return 'standard';
  }

  function waveVisualMeta(value) {
    const label = String(value || '').toUpperCase();
    const tcgMatch = label.match(/^TCG-W([1-4])$/);
    if (tcgMatch) return { edition: 'TCG', chapter: `W${tcgMatch[1]}` };
    const match = label.match(/^(T[2-5])(W\d{1,2})$/);
    return match ? { edition: match[1], chapter: match[2] } : null;
  }

  function waveRank(value) {
    const label = String(value || '').toUpperCase();
    const tcgMatch = label.match(/^TCG-W([1-4])$/);
    if (tcgMatch) return 400 + Number(tcgMatch[1]);
    const match = label.match(/^T([2-5])W(\d{1,2})$/);
    if (!match) return 9999;
    const tier = Number(match[1]);
    const wave = Number(match[2]);
    const tierOffset = { 2: 0, 3: 100, 4: 200, 5: 300 }[tier] ?? 900;
    return tierOffset + wave;
  }

  function rarityRank(value, seriesKey = 'all') {
    const key = canonicalRarityKey(value);
    if (key === 'card') return 999;
    const seriesOrder = RARITY_ORDER_BY_SERIES[normalizeKey(seriesKey)];
    const order = seriesOrder || RARITY_ORDER;
    const index = order.indexOf(key);
    if (index !== -1) return index;
    const fallback = RARITY_ORDER.indexOf(key);
    if (fallback === -1) return 999;
    return seriesOrder ? seriesOrder.length + fallback : fallback;
  }

  function seriesRank(value) {
    const key = normalizeKey(value);
    const index = SERIES_ORDER.indexOf(key);
    return index === -1 ? 999 : index;
  }

  function normalizedGroup(group) {
    return {
      ...group,
      seriesKey: normalizeKey(group?.seriesKey || group?.series || group?.editionKey),
      rarityKey: canonicalRarityKey(group?.rarityKey || group?.rarity),
      waveKey: normalizeKey(group?.waveKey || group?.wave),
      rarity: cleanRarityLabel(group?.rarity || ''),
    };
  }

  function sortGroups(groups) {
    return Array.from(groups || [], normalizedGroup).sort((a, b) => (
      seriesRank(a.seriesKey) - seriesRank(b.seriesKey)
      || waveRank(a.wave || a.waveKey) - waveRank(b.wave || b.waveKey)
      || rarityRank(a.rarityKey, a.seriesKey) - rarityRank(b.rarityKey, b.seriesKey)
      || String(a.code || a.title || '').localeCompare(String(b.code || b.title || ''))
    ));
  }

  function normalizedFilters(filters = DEFAULT_FILTERS) {
    return {
      series: normalizeKey(filters.series) || 'all',
      rarity: normalizeKey(filters.rarity) === 'all' ? 'all' : canonicalRarityKey(filters.rarity),
      wave: normalizeKey(filters.wave) || 'all',
    };
  }

  function matchesGroup(group, filters = DEFAULT_FILTERS) {
    const item = normalizedGroup(group);
    const state = normalizedFilters(filters);
    return (state.series === 'all' || item.seriesKey === state.series)
      && (state.rarity === 'all' || item.rarityKey === state.rarity)
      && (state.wave === 'all' || item.waveKey === state.wave);
  }

  function filterGroups(groups, filters = DEFAULT_FILTERS) {
    return sortGroups(groups).filter((group) => matchesGroup(group, filters));
  }

  function uniqueSortedKeys(groups, key, sorter) {
    const values = [...new Set(groups.map((group) => normalizeKey(group[key])).filter(Boolean))];
    return values.sort(sorter);
  }

  function deriveFacets(groups, filters = DEFAULT_FILTERS) {
    const state = normalizedFilters(filters);
    const normalized = Array.from(groups || [], normalizedGroup);
    const seriesGroups = state.series === 'all'
      ? normalized
      : normalized.filter((group) => group.seriesKey === state.series);
    const rarityGroups = state.rarity === 'all'
      ? seriesGroups
      : seriesGroups.filter((group) => group.rarityKey === state.rarity);

    const presentSeries = new Set(normalized.map((group) => group.seriesKey).filter(Boolean));
    const series = SERIES_ORDER.filter((key) => key === 'all' || presentSeries.has(key));
    const rarityWhitelist = state.series === 'all' ? null : RARITY_ORDER_BY_SERIES[state.series] || null;
    const secondaryFacetsCollapsed = state.series === 'all' || state.series === 'pr';
    const rarities = secondaryFacetsCollapsed
      ? []
      : [
          'all',
          ...uniqueSortedKeys(seriesGroups, 'rarityKey', (a, b) => rarityRank(a, state.series) - rarityRank(b, state.series) || a.localeCompare(b))
            .filter((key) => key !== 'pr' && key !== 'card' && (!rarityWhitelist || rarityWhitelist.includes(key))),
        ];
    const waves = secondaryFacetsCollapsed
      ? []
      : [
          'all',
          ...uniqueSortedKeys(rarityGroups, 'waveKey', (a, b) => waveRank(a) - waveRank(b) || a.localeCompare(b))
            .filter((key) => waveRank(key) < 9999),
        ];

    return { series, rarities, waves };
  }

  function initialLimit(viewportWidth) {
    return Number(viewportWidth) > 980 ? 24 : 12;
  }

  function nextLimit(current, viewportWidth) {
    return Number(current || 0) + initialLimit(viewportWidth);
  }

  function cloneFilters(filters = DEFAULT_FILTERS) {
    return { ...normalizedFilters(filters) };
  }

  function initialFiltersFromLocation() {
    if (typeof window === 'undefined' || !window.location) return cloneFilters();
    const params = new URLSearchParams(window.location.search || '');
    return normalizedFilters({
      series: params.get('series') || 'all',
      rarity: params.get('rarity') || 'all',
      wave: params.get('wave') || 'all',
    });
  }

  function createState(viewportWidth = 1440) {
    const initialFilters = initialFiltersFromLocation();
    return {
      applied: cloneFilters(initialFilters),
      draft: cloneFilters(initialFilters),
      visibleLimit: initialLimit(viewportWidth),
    };
  }

  function cancelDraft(state) {
    state.draft = cloneFilters(state.applied);
    return state;
  }

  function applyDraft(state, viewportWidth = 1440) {
    state.applied = cloneFilters(state.draft);
    state.visibleLimit = initialLimit(viewportWidth);
    return state;
  }

  function updateStateForFacet(filters, kind, value) {
    const next = cloneFilters(filters);
    if (!Object.hasOwn(next, kind)) return next;
    next[kind] = kind === 'rarity' && normalizeKey(value) !== 'all'
      ? canonicalRarityKey(value)
      : normalizeKey(value) || 'all';
    if (kind === 'series') {
      next.rarity = 'all';
      next.wave = 'all';
    } else if (kind === 'rarity') {
      next.wave = 'all';
    }
    if (next.series === 'pr') next.wave = 'all';
    return next;
  }

  function visibleGroups(groups, filters, limit) {
    return filterGroups(groups, filters).slice(0, Math.max(0, Number(limit) || 0));
  }

  function safeLink(value, fallback = '#') {
    const link = String(value || '').trim();
    if (!link || /^javascript:/i.test(link)) return fallback;
    return link;
  }

  function imageMarkup(item, options = {}) {
    const source = String(item?.image || '').trim();
    if (!source) {
      return '<span class="p10-catalog-card__placeholder" aria-hidden="true">Card image</span>';
    }
    const alt = buyerText(item?.imageAlt || item?.title || item?.code || 'KAYOU MLP card');
    const eager = Boolean(options.eager);
    return `<img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}" loading="${eager ? 'eager' : 'lazy'}"${eager ? ' fetchpriority="high"' : ''} decoding="async" width="360" height="500">`;
  }

  function spotlightCardIdentity(item, fallback = '') {
    return String(item?.variantId || item?.id || item?.code || item?.sku || item?.image || fallback).trim();
  }

  function spotlightCampaignCode(item) {
    return String(item?.code || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '');
  }

  function isSpotlightCampaignCard(item) {
    const variantId = String(item?.variantId || item?.id || '').trim();
    return SPOTLIGHT_CAMPAIGN_VARIANT_IDS.has(variantId)
      || SPOTLIGHT_CAMPAIGN_CODES.has(spotlightCampaignCode(item));
  }

  function randomUnit(random = Math.random) {
    const raw = Number(random());
    return Number.isFinite(raw) ? Math.min(0.999999999, Math.max(0, raw)) : Math.random();
  }

  function shuffledCards(cards, random = Math.random) {
    const shuffled = Array.from(cards || []);
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const raw = Number(random());
      const unit = Number.isFinite(raw) ? Math.min(0.999999999, Math.max(0, raw)) : Math.random();
      const swapIndex = Math.floor(unit * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function weightedSpotlightCards(cards, limit, random = Math.random) {
    const remaining = Array.from(cards || []);
    const selected = [];
    const count = Math.min(remaining.length, Math.max(0, Number(limit) || 0));
    while (selected.length < count && remaining.length) {
      const campaign = remaining.filter(isSpotlightCampaignCard);
      const organic = remaining.filter((card) => !isSpotlightCampaignCard(card));
      let bucket = remaining;
      if (campaign.length && organic.length) {
        bucket = randomUnit(random) < SPOTLIGHT_CAMPAIGN_WEIGHT ? campaign : organic;
      } else if (campaign.length) {
        bucket = campaign;
      } else if (organic.length) {
        bucket = organic;
      }
      const picked = bucket[Math.floor(randomUnit(random) * bucket.length)];
      selected.push(picked);
      const pickedIdentity = spotlightCardIdentity(picked);
      const index = remaining.findIndex((card) => spotlightCardIdentity(card) === pickedIdentity);
      if (index >= 0) remaining.splice(index, 1);
    }
    return selected;
  }

  function spotlightGroups(cards, filters = DEFAULT_FILTERS, options = {}) {
    const sourceCards = Array.isArray(cards) ? cards : [];
    const limit = Math.max(0, Number(options?.limit ?? 3) || 0);
    const random = typeof options?.random === 'function' ? options.random : Math.random;
    const previousIds = new Set(Array.from(options?.previousIds || [], (value) => String(value || '').trim()).filter(Boolean));
    const seen = new Set();
    const matches = sourceCards.filter((card, index) => {
      const identity = spotlightCardIdentity(card, `card-${index}`);
      if (!identity || seen.has(identity) || !matchesGroup(card, filters)) return false;
      seen.add(identity);
      return true;
    });
    if (!matches.some(isSpotlightCampaignCard)) {
      const randomized = shuffledCards(matches, random);
      const fresh = randomized.filter((card, index) => !previousIds.has(spotlightCardIdentity(card, `fresh-${index}`)));
      const repeated = randomized.filter((card, index) => previousIds.has(spotlightCardIdentity(card, `repeat-${index}`)));
      return fresh.concat(repeated).slice(0, limit);
    }
    const fresh = matches.filter((card, index) => !previousIds.has(spotlightCardIdentity(card, `fresh-${index}`)));
    const repeated = matches.filter((card, index) => previousIds.has(spotlightCardIdentity(card, `repeat-${index}`)));
    const result = weightedSpotlightCards(fresh, limit, random);
    if (result.length < limit) {
      result.push(...weightedSpotlightCards(repeated, limit - result.length, random));
    }
    return result;
  }

  function spotlightCardMarkup(item, order = 0) {
    const seriesKey = normalizeKey(item?.seriesKey || item?.series || item?.editionKey) || 'other';
    const rarityKey = canonicalRarityKey(item?.rarityKey || item?.rarity);
    const waveKey = normalizeKey(item?.waveKey || item?.wave);
    const identity = spotlightCardIdentity(item, `spotlight-${order + 1}`);
    const code = buyerText(item?.code || item?.title || item?.shortLabel || 'KAYOU MLP card');
    const slot = Math.max(0, Number(order) || 0) + 1;
    return `
      <figure class="p10-card-spotlight__item" data-card-spotlight-item data-spotlight-id="${escapeHtml(identity)}" data-series="${escapeHtml(seriesKey)}" data-rarity="${escapeHtml(rarityKey)}" data-wave="${escapeHtml(waveKey)}" data-spotlight-slot="${slot}">
        <span class="p10-card-spotlight__sleeve">${imageMarkup(item, { eager: true })}</span>
        <figcaption><span data-spotlight-code>${escapeHtml(code)}</span></figcaption>
      </figure>
    `.trim();
  }

  function initMotion(root) {
    const gsap = window.gsap;
    if (!gsap || !root) return () => {};
    const ScrollTrigger = window.ScrollTrigger;
    if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add({
      reduceMotion: '(prefers-reduced-motion: reduce)',
      desktop: '(min-width: 981px)',
    }, (context) => {
      const { reduceMotion, desktop } = context.conditions || {};
      if (reduceMotion) return undefined;
      const introTargets = gsap.utils.toArray(root.querySelectorAll('.p10-single-card-catalog__intro > *'));
      const spotlightSleeves = gsap.utils.toArray(root.querySelectorAll('[data-card-spotlight-item] .p10-card-spotlight__sleeve'));
      const desktopFilter = root.querySelector('[data-desktop-filters]');
      const introLift = gsap.utils.distribute({ base: 10, amount: 10, from: 'start' });
      const timeline = gsap.timeline({ defaults: { duration: 0.48, ease: 'power3.out' } });

      if (introTargets.length) {
        timeline.fromTo(introTargets, {
          autoAlpha: 0,
          y: (index, target, targets) => introLift(index, target, targets),
        }, {
          autoAlpha: 1,
          y: 0,
          stagger: 0.045,
          clearProps: 'opacity,visibility,transform',
        }, 0);
      }
      if (spotlightSleeves.length) {
        timeline.fromTo(spotlightSleeves, { autoAlpha: 0, y: 16, scale: 0.96 }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.07,
          clearProps: 'opacity,visibility,transform',
        }, 0.08);
      }
      if (desktop && desktopFilter) {
        timeline.fromTo(desktopFilter, { autoAlpha: 0, y: 12 }, {
          autoAlpha: 1,
          y: 0,
          clearProps: 'opacity,visibility,transform',
        }, 0.16);
      }

      if (desktop && ScrollTrigger) {
        const catalogCards = gsap.utils.toArray(root.querySelectorAll('[data-catalog-card]')).slice(0, 12);
        if (catalogCards.length) {
          ScrollTrigger.batch(catalogCards, {
            start: 'top 94%',
            once: true,
            interval: 0.08,
            batchMax: 4,
            onEnter: (batch) => gsap.fromTo(batch, { autoAlpha: 0, y: 12 }, {
              autoAlpha: 1,
              y: 0,
              duration: 0.36,
              ease: 'power2.out',
              stagger: 0.04,
              overwrite: true,
              clearProps: 'opacity,visibility,transform',
            }),
          });
        }
      }
      return () => timeline.kill();
    });

    return () => media.revert();
  }

  function cardMarkup(item, options = {}) {
    const shelf = Boolean(options.shelf);
    const order = String(Math.max(0, Number(options.order) || 0) + 1).padStart(2, '0');
    const seriesKey = normalizeKey(item?.seriesKey || item?.series || item?.editionKey) || 'other';
    const series = labelForFacet('series', seriesKey);
    const rarityKey = canonicalRarityKey(item?.rarityKey || item?.rarity || 'card');
    const rarity = cleanRarityLabel(item?.rarity || item?.rarityKey || 'Card') || 'Card';
    const rarityFamily = rarityVisualFamily(rarityKey);
    const wave = seriesKey === 'pr' ? '' : String(item?.wave || item?.waveKey || '').toUpperCase();
    const code = buyerText(item?.code || item?.title || item?.shortLabel || 'View card');
    const title = buyerText(
      shelf
        ? (item?.groupTitle || item?.productTitle || item?.title || code)
        : (item?.title || item?.productTitle || code),
    );
    const price = buyerText(item?.price || '');
    const priceLabel = price ? `${shelf ? '' : 'From '}${price}` : '';
    const dataAttribute = shelf ? 'data-shelf-card' : 'data-catalog-card';
    const href = safeLink(item?.link);

    return `
      <article class="p10-catalog-card" ${dataAttribute} data-series="${escapeHtml(seriesKey)}" data-rarity-key="${escapeHtml(rarityKey)}" data-rarity-family="${escapeHtml(rarityFamily)}" data-card-order="${order}">
        <span class="p10-catalog-card__spine" aria-hidden="true"></span>
        <a class="p10-catalog-card__link" href="${escapeHtml(href)}" aria-label="${escapeHtml(`View ${code}`)}">
          <span class="p10-catalog-card__media" data-card-sleeve>${imageMarkup(item, { eager: options.eager })}</span>
          <span class="p10-catalog-card__body">
            <span class="p10-catalog-card__tags">
              <span class="p10-catalog-card__series-tag">${escapeHtml(series)}</span>
              <span class="p10-catalog-card__rarity-tag" data-rarity-family="${escapeHtml(rarityFamily)}"><i class="p10-rarity-mark" aria-hidden="true"></i>${escapeHtml(rarity)}</span>
            </span>
            <strong class="p10-catalog-card__code">${escapeHtml(code)}</strong>
            <span class="p10-catalog-card__title">${escapeHtml(title || code)}</span>
            <span class="p10-catalog-card__footer">
              <span class="p10-catalog-card__wave">${escapeHtml(wave)}</span>
              ${priceLabel ? `<em class="p10-catalog-card__price">${escapeHtml(priceLabel)}</em>` : ''}
            </span>
          </span>
        </a>
      </article>
    `.trim();
  }

  function shelfCardMarkup(item, order) {
    return cardMarkup(item, { shelf: true, order });
  }

  function catalogCardMarkup(item, order, eager = false) {
    return cardMarkup(item, { shelf: false, order, eager });
  }

  function shelfItems(payload, key) {
    const shelf = payload?.shelves?.[key];
    if (Array.isArray(shelf)) return shelf;
    if (Array.isArray(shelf?.items)) return shelf.items;
    return [];
  }

  function productHandleFromLink(link) {
    const match = String(link || '').match(/^\/products\/([^?#/]+)/);
    return match ? match[1] : '';
  }

  function isPublicCatalogGroup(group) {
    return Boolean(
      group &&
      group.status === 'ACTIVE' &&
      group.previewOnly !== true &&
      group.publishedOnOnlineStore === true &&
      String(group.link || '').indexOf('/products/') === 0
    );
  }

  function facetOptionMarkup(kind, value, selected, groups) {
    const optionKey = kind === 'rarity' ? canonicalRarityKey(value) : normalizeKey(value);
    const selectedKey = kind === 'rarity' ? canonicalRarityKey(selected) : normalizeKey(selected);
    const active = optionKey === selectedKey;
    const label = labelForFacet(kind, value, groups);
    let attributes = '';
    let content = `<span class="p10-filter-option__label">${escapeHtml(label)}</span>`;

    if (kind === 'series') {
      const meta = seriesVisualMeta(value);
      attributes = ` data-series-tone="${escapeHtml(meta.tone)}"`;
      content = `<span class="p10-filter-option__edition" aria-hidden="true">${escapeHtml(meta.code)}</span>${content}`;
    } else if (kind === 'rarity') {
      const family = rarityVisualFamily(value);
      attributes = ` data-rarity-family="${escapeHtml(family)}"`;
      content = `<span class="p10-rarity-mark" aria-hidden="true"></span>${content}`;
    } else if (kind === 'wave') {
      const meta = waveVisualMeta(value);
      if (meta) {
        attributes = ` data-wave-edition="${escapeHtml(meta.edition.toLowerCase())}"`;
        content = `<span class="p10-filter-option__wave-edition" aria-hidden="true">${escapeHtml(meta.edition)}</span><span class="p10-filter-option__wave-chapter">${escapeHtml(meta.chapter)}</span><span class="p10-filter-option__label p10-visually-hidden">${escapeHtml(label)}</span>`;
      }
    }

    return `<button type="button" class="p10-filter-option p10-filter-option--${escapeHtml(kind)}" data-filter-kind="${escapeHtml(kind)}" data-filter-value="${escapeHtml(value)}"${attributes} aria-pressed="${active ? 'true' : 'false'}">${content}</button>`;
  }

  function activeFilterEntries(filters, groups) {
    return ['series', 'rarity', 'wave']
      .filter((kind) => filters[kind] && filters[kind] !== 'all')
      .map((kind) => ({
        kind,
        value: filters[kind],
        label: labelForFacet(kind, filters[kind], groups),
      }));
  }

  function activeFilterMarkup(filters, groups, removable = true) {
    return activeFilterEntries(filters, groups).map((entry) => `
      <span class="p10-filter-chip">
        ${escapeHtml(entry.label)}
        ${removable ? `<button type="button" data-filter-remove="${escapeHtml(entry.kind)}" aria-label="Remove ${escapeHtml(entry.label)} filter">&times;</button>` : ''}
      </span>
    `).join('');
  }

  function createCatalogController(root, payload) {
    const groups = sortGroups((Array.isArray(payload?.groups) ? payload.groups : []).filter(isPublicCatalogGroup));
    const publicProductHandles = new Set(groups.map((group) => group.productHandle || productHandleFromLink(group.link)).filter(Boolean));
    const spotlightCards = Array.isArray(payload?.spotlightCards) && payload.spotlightCards.length
      ? payload.spotlightCards.filter((card) => publicProductHandles.has(productHandleFromLink(card.link)))
      : groups;
    const state = createState(window.innerWidth);
    const drawer = root.querySelector('[data-mobile-filter-drawer]');
    const drawerTrigger = root.querySelector('[data-mobile-filter-trigger]');
    let restoreFocus = null;
    let desktopMode = window.innerWidth > 980;
    let previousSpotlightIds = [];
    let spotlightRendered = false;
    let spotlightRevision = 0;
    let motionCleanup = () => {};

    function matchingGroups(filters) {
      const current = normalizedFilters(filters);
      return groups.filter((group) => (
        (current.series === 'all' || group.seriesKey === current.series)
        && (current.rarity === 'all' || group.rarityKey === current.rarity)
        && (current.wave === 'all' || group.waveKey === current.wave)
      ));
    }

    function matchingSpotlightCards(filters) {
      return spotlightCards.filter((card) => matchesGroup(card, filters));
    }

    function controllerFacets(filters) {
      return deriveFacets(groups, filters);
    }

    function recordRenderTime(name, startedAt) {
      root.dataset[name] = (performance.now() - startedAt).toFixed(1);
    }

    function setOptions(selector, kind, values, selected) {
      const container = root.querySelector(selector);
      if (!container) return;
      const visibleValues = kind === 'rarity'
        ? values.filter((value) => canonicalRarityKey(value) !== 'card')
        : values;
      container.innerHTML = visibleValues
        .map((value) => facetOptionMarkup(kind, value, selected, groups))
        .join('');
      if (kind === 'series') {
        const alignSelected = () => {
          const active = Array.from(container.querySelectorAll('[data-filter-value]'))
            .find((option) => normalizeKey(option.dataset.filterValue) === normalizeKey(selected));
          if (!active || container.scrollWidth <= container.clientWidth) return;
          container.scrollLeft = Math.max(0, active.offsetLeft - ((container.clientWidth - active.offsetWidth) / 2));
        };
        alignSelected();
        if (container.clientWidth === 0) setTimeout(alignSelected, 0);
      }
    }

    function renderFacetSet(prefix, filters) {
      const facets = controllerFacets(filters);
      setOptions(`[data-${prefix}-options="series"]`, 'series', facets.series, filters.series);
      setOptions(`[data-${prefix}-options="rarity"]`, 'rarity', facets.rarities, filters.rarity);
      setOptions(`[data-${prefix}-options="wave"]`, 'wave', facets.waves, filters.wave);
      const waveWrap = root.querySelector(`[data-${prefix === 'desktop' ? 'desktop' : 'drawer'}-facet="wave"]`);
      const rarityWrap = root.querySelector(`[data-${prefix === 'desktop' ? 'desktop' : 'drawer'}-facet="rarity"]`);
      const host = prefix === 'desktop' ? root.querySelector('[data-desktop-filters]') : drawer;
      if (host) host.dataset.seriesContext = normalizeKey(filters.series) || 'all';
      if (waveWrap) waveWrap.hidden = facets.waves.length === 0;
      if (rarityWrap) rarityWrap.hidden = facets.rarities.length === 0;
      return facets;
    }

    function renderShelves() {
      ['latest', 'hot', 'pr'].forEach((key) => {
        const container = root.querySelector(`[data-shelf="${key}"]`);
        const empty = root.querySelector(`[data-shelf-empty="${key}"]`);
        if (!container) return;
        const configuredLimit = Math.max(1, Number(container.dataset.shelfLimit) || 6);
        const items = shelfItems(payload, key)
          .filter((item) => publicProductHandles.has(item.productHandle || productHandleFromLink(item.link)))
          .slice(0, Math.min(6, configuredLimit));
        const section = container.closest('[data-recommendation-section]');
        container.innerHTML = items.map(shelfCardMarkup).join('');
        container.dataset.shelfState = items.length ? 'populated' : 'empty';
        if (section) section.dataset.shelfState = items.length ? 'populated' : 'empty';
        if (empty) empty.hidden = items.length > 0;
        container.hidden = items.length === 0;
      });
    }

    function renderSpotlight(reason = 'filter') {
      const host = root.querySelector('[data-card-spotlight]');
      const cardsHost = root.querySelector('[data-spotlight-cards]');
      if (!host || !cardsHost) return;
      const currentSeries = normalizeKey(state.applied.series) || 'all';
      const eligibleCards = matchingSpotlightCards(state.applied);
      const cards = spotlightGroups(spotlightCards, state.applied, {
        limit: 3,
        random: Math.random,
        previousIds: previousSpotlightIds,
      });
      previousSpotlightIds = cards.map((card, index) => spotlightCardIdentity(card, `spotlight-${index + 1}`));
      cardsHost.innerHTML = cards.map(spotlightCardMarkup).join('');
      host.dataset.seriesContext = currentSeries;
      host.dataset.seriesCode = seriesVisualMeta(currentSeries).code;
      host.dataset.spotlightRevision = String(++spotlightRevision);
      host.dataset.refreshReason = reason;
      const label = root.querySelector('[data-spotlight-series]');
      const count = root.querySelector('[data-spotlight-count]');
      const contextLabels = activeFilterEntries(state.applied, groups).map((entry) => entry.label);
      if (label) label.textContent = contextLabels.length ? contextLabels.join(' / ') : 'All cards';
      if (count) count.textContent = String(eligibleCards.length);

      const shouldAnimate = spotlightRendered
        && window.gsap
        && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      spotlightRendered = true;
      if (!shouldAnimate) return;
      const sleeves = window.gsap.utils.toArray(cardsHost.querySelectorAll('.p10-card-spotlight__sleeve'));
      window.gsap.fromTo(sleeves, { autoAlpha: 0, y: 12, scale: 0.96 }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
        stagger: 0.04,
        overwrite: true,
        clearProps: 'opacity,visibility,transform',
      });
    }

    function renderCatalog() {
      const matches = matchingGroups(state.applied);
      const cards = matches.slice(0, state.visibleLimit);
      const focused = activeFilterEntries(state.applied, groups).length > 0;
      const grid = root.querySelector('[data-catalog-grid]');
      if (grid) {
        grid.innerHTML = cards
          .map((item, order) => catalogCardMarkup(item, order, focused && order < 4))
          .join('');
      }
      root.querySelectorAll('[data-result-count], [data-mobile-result-count], [data-catalog-result-count]')
        .forEach((node) => { node.textContent = String(matches.length); });
      const empty = root.querySelector('[data-catalog-empty]');
      if (empty) empty.hidden = matches.length > 0;
      const more = root.querySelector('[data-load-more]');
      if (more) {
        more.hidden = cards.length >= matches.length;
        more.textContent = `Load more cards (${cards.length} of ${matches.length})`;
      }
    }

    function renderAppliedFilters() {
      if (window.innerWidth > 980) renderFacetSet('desktop', state.applied);
      const activeEntries = activeFilterEntries(state.applied, groups);
      const filtered = activeEntries.length > 0;
      root.dataset.filterMode = filtered ? 'focused' : 'discovery';
      root.querySelectorAll('[data-recommendation-section]').forEach((section) => {
        section.hidden = filtered;
      });
      const activeMarkup = activeFilterMarkup(state.applied, groups);
      const desktopActive = root.querySelector('[data-active-filters]');
      const mobileActive = root.querySelector('[data-mobile-active-filters]');
      if (desktopActive) desktopActive.innerHTML = activeMarkup;
      if (mobileActive) mobileActive.innerHTML = activeMarkup;
      const summary = root.querySelector('[data-filter-summary]');
      if (summary) {
        const labels = activeEntries.map((entry) => entry.label);
        summary.textContent = labels.length ? labels.join(' / ') : 'All cards';
      }
      root.querySelectorAll('[data-filter-clear]').forEach((button) => {
        button.hidden = activeEntries.length === 0;
      });
      renderSpotlight('filter');
      renderCatalog();
    }

    function renderDraftFilters() {
      renderFacetSet('drawer', state.draft);
      const draftCount = matchingGroups(state.draft).length;
      const count = root.querySelector('[data-draft-result-count]');
      if (count) count.textContent = String(draftCount);
    }

    function clearAppliedFilters() {
      state.applied = cloneFilters();
      state.draft = cloneFilters();
      state.visibleLimit = initialLimit(window.innerWidth);
      renderAppliedFilters();
    }

    function focusableDrawerElements() {
      if (!drawer) return [];
      return Array.from(drawer.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'))
        .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
    }

    function openDrawer() {
      if (!drawer || !drawerTrigger) return;
      state.draft = cloneFilters(state.applied);
      renderDraftFilters();
      restoreFocus = drawerTrigger;
      drawer.hidden = false;
      drawerTrigger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('p10-catalog-drawer-open');
      setTimeout(() => {
        if (drawer.hidden) return;
        drawer.classList.add('is-open');
        focusableDrawerElements()[0]?.focus();
      }, 0);
    }

    function closeDrawer({ cancel = false } = {}) {
      if (!drawer) return;
      if (cancel) cancelDraft(state);
      drawer.classList.remove('is-open');
      drawer.hidden = true;
      drawerTrigger?.setAttribute('aria-expanded', 'false');
      document.documentElement.classList.remove('p10-catalog-drawer-open');
      restoreFocus?.focus();
      restoreFocus = null;
    }

    function onRootClick(event) {
      const target = event.target.closest('button, a');
      if (!target || !root.contains(target)) return;

      if (target.matches('[data-catalog-back]')) {
        event.preventDefault();
        const sameOriginReferrer = document.referrer && new URL(document.referrer, window.location.href).origin === window.location.origin;
        if (sameOriginReferrer && window.history.length > 1) window.history.back();
        else window.location.assign(root.dataset.allCardsUrl || '/collections/single');
        return;
      }

      if (target.matches('[data-catalog-series-link]')) {
        event.preventDefault();
        state.applied = updateStateForFacet(cloneFilters(), 'series', target.dataset.catalogSeriesLink || 'all');
        state.draft = cloneFilters(state.applied);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters();
        root.querySelector('[data-catalog-results]')?.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'start',
        });
        return;
      }

      if (target.matches('[data-mobile-filter-trigger]')) {
        openDrawer();
        return;
      }

      if (target.matches('[data-mobile-filter-cancel]')) {
        closeDrawer({ cancel: true });
        return;
      }

      if (target.matches('[data-mobile-filter-apply]')) {
        const startedAt = performance.now();
        applyDraft(state, window.innerWidth);
        renderAppliedFilters();
        recordRenderTime('lastApplyRenderMs', startedAt);
        closeDrawer();
        return;
      }

      if (target.matches('[data-mobile-filter-clear]')) {
        state.draft = cloneFilters();
        renderDraftFilters();
        return;
      }

      if (target.matches('[data-load-more]')) {
        state.visibleLimit = nextLimit(state.visibleLimit, window.innerWidth);
        renderCatalog();
        return;
      }

      if (target.matches('[data-filter-clear]')) {
        clearAppliedFilters();
        return;
      }

      const removeKind = target.dataset.filterRemove;
      if (removeKind) {
        state.applied = updateStateForFacet(state.applied, removeKind, 'all');
        state.draft = cloneFilters(state.applied);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters();
        return;
      }

      const kind = target.dataset.filterKind;
      const value = target.dataset.filterValue;
      if (!kind || !value) return;
      if (target.closest('[data-mobile-filter-drawer]')) {
        const startedAt = performance.now();
        state.draft = updateStateForFacet(state.draft, kind, value);
        renderDraftFilters();
        recordRenderTime('lastDraftRenderMs', startedAt);
      } else {
        state.applied = updateStateForFacet(state.applied, kind, value);
        state.draft = cloneFilters(state.applied);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters();
      }
    }

    function onDocumentKeydown(event) {
      if (!drawer || drawer.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer({ cancel: true });
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusableDrawerElements();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function onResize() {
      const nextDesktopMode = window.innerWidth > 980;
      if (nextDesktopMode && !desktopMode) renderFacetSet('desktop', state.applied);
      if (nextDesktopMode && drawer && !drawer.hidden) closeDrawer({ cancel: true });
      desktopMode = nextDesktopMode;
    }

    function onPageShow(event) {
      if (!event.persisted) return;
      renderSpotlight('return');
    }

    root.addEventListener('click', onRootClick);
    document.addEventListener('keydown', onDocumentKeydown);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pageshow', onPageShow);
    renderShelves();
    renderAppliedFilters();
    onResize();
    motionCleanup = initMotion(root);

    return {
      destroy() {
        motionCleanup();
        root.removeEventListener('click', onRootClick);
        document.removeEventListener('keydown', onDocumentKeydown);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pageshow', onPageShow);
      },
    };
  }

  const payloadCache = new Map();

  function loadPayload(url) {
    if (!payloadCache.has(url)) {
      payloadCache.set(url, fetch(url, {
        headers: { accept: 'application/json' },
        cache: 'no-cache',
      }).then((response) => {
        if (!response.ok) throw new Error(`Catalog request failed with ${response.status}`);
        return response.json();
      }));
    }
    return payloadCache.get(url);
  }

  function showFallback(root, error) {
    const grid = root.querySelector('[data-catalog-grid]');
    const template = root.querySelector('[data-liquid-fallback]');
    if (grid && template?.content) grid.replaceChildren(template.content.cloneNode(true));
    const status = root.querySelector('[data-catalog-status]');
    if (status) {
      status.hidden = false;
      status.textContent = 'The card catalog could not load. Please refresh the page or browse all single cards.';
    }
    root.dataset.catalogError = String(error?.message || 'load-failed');
  }

  function repairLegacyPrRoute(root) {
    const results = root.querySelector('[data-catalog-results], .p10-catalog-results');
    const link = root.querySelector('[data-catalog-series-link="pr"], [data-recommendation-section="pr"] a');
    if (!results || !link) return;
    results.dataset.catalogResults = '';
    link.dataset.catalogSeriesLink = 'pr';
    if (results.id) link.setAttribute('href', `#${results.id}`);
  }

  async function initializeRoot(root) {
    if (!root || root.dataset.catalogInitialized === 'true') return;
    root.dataset.catalogInitialized = 'true';
    repairLegacyPrRoute(root);
    const status = root.querySelector('[data-catalog-status]');
    try {
      const url = root.dataset.catalogDataUrl;
      if (!url) throw new Error('Catalog data URL is missing');
      const payload = await loadPayload(url);
      if (!Array.isArray(payload?.groups)) throw new Error('Catalog groups are missing');
      root.__p10CatalogController?.destroy?.();
      root.__p10CatalogController = createCatalogController(root, payload);
      if (status) status.hidden = true;
    } catch (error) {
      showFallback(root, error);
    } finally {
      root.setAttribute('aria-busy', 'false');
      root.dataset.catalogReady = 'true';
    }
  }

  function boot(scope = document) {
    if (scope.matches?.('[data-single-card-catalog]')) initializeRoot(scope);
    scope.querySelectorAll?.('[data-single-card-catalog]').forEach(initializeRoot);
  }

  const api = {
    SERIES_ORDER,
    RARITY_ORDER,
    RARITY_ORDER_BY_SERIES,
    SERIES_VISUAL_META,
    DEFAULT_FILTERS,
    normalizeKey,
    canonicalRarityKey,
    cleanRarityLabel,
    labelForFacet,
    seriesVisualMeta,
    rarityVisualFamily,
    spotlightCardIdentity,
    isSpotlightCampaignCard,
    weightedSpotlightCards,
    spotlightGroups,
    spotlightCardMarkup,
    facetOptionMarkup,
    shelfCardMarkup,
    catalogCardMarkup,
    waveRank,
    rarityRank,
    seriesRank,
    sortGroups,
    matchesGroup,
    filterGroups,
    deriveFacets,
    initialLimit,
    nextLimit,
    createState,
    cancelDraft,
    applyDraft,
    updateStateForFacet,
    visibleGroups,
    boot,
  };

  if (typeof window !== 'undefined') window.P10SingleCardCatalog = api;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
    else boot();
    document.addEventListener('shopify:section:load', (event) => boot(event.target));
  }
})();
