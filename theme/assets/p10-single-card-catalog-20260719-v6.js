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
    character: 'all',
    characterGroup: 'browse',
  });

  
  const MLP_CHARACTERS = [
    ['Twilight Sparkle', 'Princess Twilight Sparkle', '紫悦', '紫悦公主'],
    ['Pinkie Pie', '碧琪'], ['Rainbow Dash', '云宝'], ['Rarity', '珍奇'],
    ['Fluttershy', '柔柔'], ['Applejack', 'Apple Jack', '苹果嘉儿'],
    ['Maud Pie', 'Maud', '灰琪'],
    ['Angel Bunny'], ['Apple Bloom'], ['Babs Seed'], ['Big McIntosh', 'Big Mac'],
    ['Sweetie Drops', 'Bon Bon'], ['Braeburn'], ['Bright Mac'], ['Bulk Biceps'],
    ['Princess Cadance', 'Cadance'], ['Cheese Sandwich'], ['Cherry Jubilee'],
    ['Queen Chrysalis', 'Chrysalis'], ['Coco Pommel'], ['Coloratura'], ['Cozy Glow'],
    ['Daring Do'], ['Daybreaker'], ['Derpy Hooves', 'Muffins'], ['Diamond Tiara'],
    ['Discord'], ['Doctor Hooves'], ['Ember'], ['Featherweight'], ['Flash Magnus'],
    ['Fleur de Lis'], ['Flurry Heart'], ['Gilda'], ['Granny Smith'], ['Gummy'],
    ['Hoity Toity'], ['Inky Rose'], ['King Sombra'], ['Lightning Dust'], ['Lily Lace'],
    ['Lord Tirek'], ['Lyra Heartstrings'], ['Mage Meadowbrook'], ['Mayor Mare'],
    ['Mistmane'], ['Mrs. Cake'], ['Ms Harshwhinny'], ['Night Glider'], ['Night Light'],
    ['Nightmare Moon'], ['Nurse Redheart'], ['Octavia Melody'], ['Opalescence'],
    ['Optimus Prime'], ['Owlowiscious'], ['Peachbottom'], ['Pear Butter'], ['Philomena'],
    ['Photo Finish'], ['Pipsqueak'], ['Prince Blueblood'], ['Prince Rutherford'],
    ['Princess Celestia'], ['Princess Luna'], ['Princess Skystar'], ['Queen Novo'],
    ['Rain Shine'], ['Rockhoof'], ['Sable Spirit'], ['Sapphire Shores'], ['Sassy Saddles'],
    ['Scootaloo'], ['Shining Armor'], ['Silver Spoon'], ['Snails'], ['Snips'],
    ['Somnambula'], ['Songbird Serenade'], ['Spike'], ['Spitfire'],
    ['Star Swirl the Bearded'], ['Starlight Glimmer'], ['Sugar Belle'], ['Sunburst'],
    ['Sunset Shimmer'], ['Suri Polomare'], ['Sweetie Belle'], ['Tank'], ['Thorax'],
    ['Trixie'], ['Twilight Velvet'], ['Twist'], ['Vapor Trail'], ['Vinyl Scratch'],
    ['Winona'], ['Zecora'],
  ].map(([label, ...aliases]) => ({
    key: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    label,
    aliases: [label, ...aliases],
  }));
  
  const createCharacterMatcher = (character) => ({
    key: character.key,
    patterns: character.aliases.map((alias) => {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return /[\u3400-\u9fff]/.test(alias)
        ? new RegExp(escaped, 'i')
        : new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i');
    }),
  });
  const characterMatchers = MLP_CHARACTERS.map(createCharacterMatcher);
  
  function characterKeysFromTexts(...texts) {
    const values = texts.flat().filter((value) => typeof value === 'string');
    return characterMatchers.filter(({ patterns }) =>
      values.some((value) => patterns.some((pattern) => pattern.test(value)))
    ).map(({ key }) => key);
  }
  
  
  
  function sameImage(left, right) {
    const src = catalogImageKey(left);
    return Boolean(src && src === catalogImageKey(right)
      && (!left?.id || !right?.id || String(left.id) === String(right.id)));
  }
  
  
  
  function individualImageText(text, product) {
    let value = String(text || '');
  
    if (product?.title) value = value.split(product.title)[0];
    value = value.split(/\bKAYOU\b|\bStarter Deck\b|\bFriendships Begin\b|\bMistmane Starter\b/i)[0];
    return /\b(?:full|complete)\s+(?:\d+[ -]card[ -])?(?:bundle|set)\b/i.test(value) ? '' : value;
  }
  
  function namedImageFilename(image) {
    let filename;
    try { filename = decodeURIComponent(catalogImageKey(image).split('/').pop() || ''); }
    catch (error) { return ''; }
  
    const match = filename.match(/^[◇◆※]?[A-Z]{1,6}\d*-(?:[◇◆※]?[A-Z0-9]+-)?\d{2,4}(?:L[0-9S])?[-_](.+)\.[a-z0-9]+$/i);
    return match ? match[1].replace(/[-_]+/g, ' ') : '';
  }
  
  function characterEvidenceForCard({ variant, image, reference, product, purchaseMode } = {}) {
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const current = variant && variants.find((item) => String(item.id) === String(variant.id));
    const isBundle = purchaseMode === 'bundle' || !current || isBundleVariant(current);
    if (current && !isBundle) {
      const keys = characterKeysFromTexts(current.title);
      if (keys.length) return { keys, source: 'variant-title' };
    }
  
    const currentImage = (Array.isArray(product?.images) ? product.images : [])
      .find((item) => sameImage(item, image));
    if (!currentImage) return { keys: [], source: 'unknown' };
    const sameImageVariants = variants.filter((item) => sameImage(item.featured_image, currentImage));
    const imageTexts = [currentImage.alt, ...sameImageVariants.map((item) => item.featured_image?.alt)];
    for (const text of imageTexts) {
      const keys = characterKeysFromTexts(individualImageText(text, product));
      if (keys.length) return { keys, source: 'image-alt' };
    }
  
    const references = Array.isArray(reference) ? reference : reference ? [reference] : [];
    for (const card of references) {
      const productMatches = card.productHandle === product.handle;
      const variantMatches = isBundle
        ? variants.some((item) => !isBundleVariant(item) && String(item.id) === String(card.variantId))
        : current && String(card.variantId) === String(current.id);
      if (!productMatches || !variantMatches || !sameImage(card.image, currentImage)) continue;
      const keys = characterKeysFromTexts(individualImageText(card.imageAlt, product));
      if (keys.length) return { keys, source: 'reference-image-alt' };
    }
  
    const keys = characterKeysFromTexts(namedImageFilename(currentImage));
    return keys.length ? { keys, source: 'image-filename' } : { keys: [], source: 'unknown' };
  }
  
  function registerCatalogCharacters(definitions = []) {
    definitions.forEach(definition => {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(definition?.key) || !definition.label) return;
      const character = { key: definition.key, label: String(definition.label), aliases: [String(definition.label), ...(definition.aliases || []).filter(alias => typeof alias === 'string')] };
      const existingIndex = MLP_CHARACTERS.findIndex(item => item.key === character.key);
      if (existingIndex !== -1) {
        const existing = MLP_CHARACTERS[existingIndex];
        existing.aliases = Array.from(new Set([...existing.aliases, ...character.aliases]));
        characterMatchers[existingIndex] = createCharacterMatcher(existing);
        return;
      }
      MLP_CHARACTERS.push(character);
      characterMatchers.push(createCharacterMatcher(character));
    });
  }

  function identifyCardCharacters(input, characterData = {}) {
    const original = characterEvidenceForCard(input).keys;
    const product = characterData.products?.[input.product?.handle];
    const mapped = (input.variant && !isBundleVariant(input.variant) && product?.variants?.[String(input.variant.id)])
      || product?.images?.[String(input.image?.id)];
    if (!mapped || (mapped.imageURL && catalogImageKey(mapped.imageURL) !== catalogImageKey(input.image))) return original;
    const additional = (mapped.characterKeys || []).map(characterKey).filter(key => key !== 'all');
    return Array.from(new Set([...(mapped.replace ? [] : original), ...additional]));
  }
  
  
  function characterKey(value) {
    const raw = String(value || '').trim().toLowerCase();
    if (!raw || raw === 'all') return 'all';
    const key = normalizeKey(value);
    return MLP_CHARACTERS.find(character => (key && character.key === key)
      || character.aliases.some(alias => alias.toLowerCase() === raw || (key && normalizeKey(alias) === key)))?.key || 'all';
  }

  function characterMatches(card, value) {
    return value === 'all' || (card.characterKeys || []).includes(value);
  }

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
      if (kind === 'character') return 'All characters';
      return 'All';
    }
    if (kind === 'character') return MLP_CHARACTERS.find(character => character.key === key)?.label || 'All characters';
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
      character: characterKey(filters.character),
      characterGroup: normalizeKey(filters.characterGroup) || 'browse',
    };
  }

  function matchesGroup(group, filters = DEFAULT_FILTERS) {
    const item = normalizedGroup(group);
    const state = normalizedFilters(filters);
    return (state.series === 'all' || item.seriesKey === state.series)
      && (state.rarity === 'all' || item.rarityKey === state.rarity)
      && (state.wave === 'all' || item.waveKey === state.wave)
      && characterMatches(item, state.character);
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
          ...uniqueSortedKeys(seriesGroups, 'waveKey', (a, b) => waveRank(a) - waveRank(b) || a.localeCompare(b))
            .filter((key) => waveRank(key) < 9999),
        ];

    return { series, rarities, waves };
  }

  function buildCatalogBoxes(groups, metadata = []) {
    const covers = new Map(Array.from(metadata || [], (box) => [
      `${normalizeKey(box.seriesKey)}:${normalizeKey(box.waveKey)}`, box,
    ]));
    const boxes = new Map();
    sortGroups(groups).forEach((group) => {
      const seriesKey = group.seriesKey || 'all';
      const waveKey = group.waveKey || 'all';
      const key = `${seriesKey}:${waveKey}`;
      if (!boxes.has(key)) {
        const cover = covers.get(key) || {};
        const groupLabel = buyerText(cover.groupLabel || group.series || group.edition || labelForFacet('series', seriesKey));
        const release = group.wave || group.waveKey;
        const title = cover.title || (seriesKey === 'more-cards' ? 'More cards' : /^t[2-5]w\d+$/i.test(waveKey)
          ? `MLP ${waveKey.toUpperCase()}`
          : `${groupLabel}${release && normalizeKey(release) !== seriesKey ? ` · ${labelForFacet('wave', release)}` : ''}`);
        boxes.set(key, {
          seriesKey, waveKey, groupLabel, title: buyerText(title),
          image: String(cover.image || ''), imageAlt: buyerText(cover.imageAlt || title), groups: [],
          cardSourceLabel: buyerText(cover.cardSourceLabel || ''), cardSaleNote: buyerText(cover.cardSaleNote || ''),
        });
      }
      boxes.get(key).groups.push(group);
    });
    return Array.from(boxes.values());
  }

  function groupSpecialCardBoxes(boxes, sourceKeys = []) {
    const selected = new Set(sourceKeys);
    const members = boxes.filter(box => selected.has(box.seriesKey + ':' + box.waveKey));
    if (!members.length) return boxes;
    const previews = sourceKeys.map(key => members.find(box => box.seriesKey + ':' + box.waveKey === key)?.groups.find(card => card.image)).filter(Boolean).slice(0, 3);
    const collection = {
      seriesKey: 'special-cards', waveKey: 'all', kind: 'special',
      groupLabel: 'PR & Special Cards', title: 'PR & Special Cards', image: '',
      sourceKeys: members.map(box => box.seriesKey + ':' + box.waveKey),
      groups: sortGroups(members.flatMap(box => box.groups)), previewCards: previews,
    };
    return [...boxes.filter(box => !selected.has(box.seriesKey + ':' + box.waveKey)), collection];
  }

  function findCatalogBox(boxes, filters) {
    const state = normalizedFilters(filters);
    return boxes.find(box => (box.seriesKey === state.series && box.waveKey === state.wave) || box.sourceKeys?.includes(state.series + ':' + state.wave)) || null;
  }

  function boxRarities(box) {
    return box ? uniqueSortedKeys(box.groups, 'rarityKey', (a, b) => (
      rarityRank(a, box.seriesKey) - rarityRank(b, box.seriesKey) || a.localeCompare(b)
    )) : [];
  }

  function boxFilters(box, rarity = 'all') {
    if (!box) return cloneFilters();
    const key = normalizeKey(rarity) === 'all' ? 'all' : canonicalRarityKey(rarity);
    return { series: box.seriesKey, wave: box.waveKey, rarity: boxRarities(box).includes(key) ? key : 'all', character: 'all', characterGroup: 'browse' };
  }

  function catalogPagePath(value) {
    return /^\/pages\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || '')) ? String(value) : '';
  }

  function catalogBoxPages(entries = []) {
    const seen = new Set();
    const pages = Array.from(entries).flatMap(entry => {
      const url = catalogPagePath(entry?.url);
      const seriesKey = normalizeKey(entry?.seriesKey);
      const waveKey = normalizeKey(entry?.waveKey);
      const aliasOf = String(entry?.aliasOf || '');
      const key = `${seriesKey}:${waveKey}`;
      if (!url || !seriesKey || !waveKey || seen.has(key) || (aliasOf && !/^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(aliasOf))) return [];
      seen.add(key);
      return [{ seriesKey, waveKey, url, aliasOf, title: String(entry.title || ''), intro: String(entry.intro || ''),
        facts: (Array.isArray(entry.facts) ? entry.facts : []).filter(fact => fact?.label && fact?.value != null)
          .map(fact => ({ label: String(fact.label), value: String(fact.value) })) }];
    });
    return pages.filter(page => !page.aliasOf || pages.some(primary => !primary.aliasOf
      && `${primary.seriesKey}:${primary.waveKey}` === page.aliasOf && primary.url === page.url));
  }

  function catalogBoxPageForDestination(box, pages, options = {}) {
    if (!box) return null;
    const page = pages.find(page => page.seriesKey === box.seriesKey && page.waveKey === box.waveKey);
    if (!page) return null;
    if (page.url === options.pathname) return page;
    const dedicatedPage = pages.some(page => page.url === options.pathname);
    if (!dedicatedPage && box.seriesKey === options.currentBox?.seriesKey && box.waveKey === options.currentBox?.waveKey) return null;
    return options.enabled === true && options.publishedPaths?.has(page.url) ? page : null;
  }

  function catalogBoxUrl(href, box, rarity = 'all', options = {}) {
    const url = new URL(href);
    const page = options.boxPage;
    const pagePath = box && page?.seriesKey === box.seriesKey && page?.waveKey === box.waveKey
      ? catalogPagePath(page.url) : '';
    url.pathname = pagePath || catalogPagePath(options.directoryUrl) || url.pathname;
    ['series', 'wave', 'rarity', 'character', 'character_group', 'catalog_view'].forEach((key) => url.searchParams.delete(key));
    if (box) {
      if (!pagePath || page.aliasOf) {
        url.searchParams.set('series', box.seriesKey);
        url.searchParams.set('wave', box.waveKey);
      }
      if (rarity !== 'all') url.searchParams.set('rarity', rarity);
    }
    url.hash = '';
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function catalogIps(entries, catalogIp) {
    const seen = new Set();
    return Array.from(entries || []).flatMap((entry) => {
      const key = normalizeKey(entry?.key);
      const url = String(entry?.url || '').trim();
      if (!key || seen.has(key) || (!url && key !== catalogIp) || (url && !/^(?:https?:\/\/|\/(?!\/))/.test(url))) return [];
      seen.add(key);
      return [{ key, title: buyerText(entry.title || key), publisher: buyerText(entry.publisher || ''), image: String(entry.image || ''), imageAlt: buyerText(entry.imageAlt || entry.title || key), url }];
    });
  }

  function catalogIpUrl(href, ipKey, box = null, rarity = 'all', options = {}) {
    const url = new URL(catalogBoxUrl(href, box, rarity, options), href);
    url.searchParams.delete('ip');
    if (ipKey) url.searchParams.set('ip', ipKey);
    return `${url.pathname}${url.search}`;
  }

  function resolveCatalogRoute(href, boxes, ips, catalogIp, boxPages = []) {
    const url = new URL(href);
    const params = url.searchParams;
    const primary = boxPages.find(entry => !entry.aliasOf && catalogPagePath(entry.url) === url.pathname);
    const alias = primary && boxPages.find(entry => entry.url === primary.url
      && entry.aliasOf === `${primary.seriesKey}:${primary.waveKey}`
      && entry.seriesKey === params.get('series') && entry.waveKey === params.get('wave'));
    const page = alias || primary;
    const filters = normalizedFilters({ series: page?.seriesKey || params.get('series') || 'all', wave: page?.waveKey || params.get('wave') || 'all', rarity: params.get('rarity') || 'all', character: params.get('character') || 'all', characterGroup: params.get('character_group') || 'browse' });
    const box = findCatalogBox(boxes, filters);
    const directoryRequested = params.get('catalog_view') === 'cards' || filters.character !== 'all' || filters.characterGroup !== 'browse';
    const key = page ? catalogIp : params.has('ip') ? normalizeKey(params.get('ip')) : (box || directoryRequested ? catalogIp : '');
    const ip = ips.find((entry) => entry.key === key && key === catalogIp && !entry.url) || null;
    return { ip, box: ip ? box : null, filters: {
      ...boxFilters(ip ? box : null, box ? filters.rarity : 'all'),
      rarity: ip && !box && filters.character !== 'all' ? filters.rarity : boxFilters(ip ? box : null, filters.rarity).rarity,
      character: ip ? filters.character : 'all',
      characterGroup: ip ? filters.characterGroup : 'browse',
    } };
  }

  function recommendedCards(cards, products, limit = 8, currency = 'USD') {
    const productMap = new Map(Array.from(products || [], (product) => [product.handle, product]));
    const seen = new Set();
    const buckets = new Map();
    const formatPrice = new Intl.NumberFormat('en', { style: 'currency', currency });
    Array.from(cards || []).forEach((card) => {
      const handle = card.productHandle || productHandleFromLink(card.link);
      if (productHandleFromLink(card.link) !== handle) return;
      const product = productMap.get(handle);
      const linkedVariantId = new URLSearchParams(String(card.link || '').split('?')[1] || '').get('variant') || '';
      const variantId = String(card.variantId || linkedVariantId);
      if (linkedVariantId && linkedVariantId !== variantId) return;
      const variant = product?.variants?.find((item) => String(item.id) === variantId);
      if (isBundleVariant(variant)) return;
      const price = Number(variant?.price);
      if (!variantId || seen.has(variantId) || variant?.available !== true || variant.price == null || variant.price === '' || !Number.isFinite(price) || price < 0) return;
      const image = variant.featured_image?.src || product.images?.find((item) => item.variant_ids?.some((id) => String(id) === variantId))?.src || card.image;
      if (!image) return;
      seen.add(variantId);
      const key = normalizeKey(card.seriesKey);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push({
        ...card, variantId, productHandle: handle, productTitle: product.title,
        image, imageAlt: variant.featured_image?.alt || card.imageAlt || variant.title,
        link: `/products/${handle}?variant=${encodeURIComponent(variantId)}`,
        price: formatPrice.format(price), available: true,
      });
    });
    const selected = [];
    const queues = Array.from(buckets.values());
    const count = Math.min(10, Math.max(0, Number(limit) || 0));
    for (let index = 0; selected.length < count; index += 1) {
      const round = queues.map((queue) => queue[index]).filter(Boolean);
      if (!round.length) break;
      selected.push(...round.slice(0, count - selected.length));
    }
    return selected;
  }

  function boxImageMarkup(box) {
    if (box.kind === 'special') return '<span class="p10-special-preview">' + box.previewCards.map(card =>
      '<img src="' + escapeHtml(card.image) + '" alt="' + escapeHtml(card.imageAlt || card.code || 'Special card preview') + '" loading="lazy" decoding="async" width="180" height="250">'
    ).join('') + '</span>';
    return box.image
      ? `<img src="${escapeHtml(box.image)}" alt="${escapeHtml(box.imageAlt)}" loading="lazy" decoding="async" width="400" height="400">`
      : `<span class="p10-box-card__placeholder">${escapeHtml(box.title)}</span>`;
  }

  function applyBoxProductOverrides(groups, overrides = {}) {
    const labels = new Map(groups.map((group) => [`${normalizeKey(group.seriesKey)}:${normalizeKey(group.waveKey)}`, group]));
    return groups.map((group) => {
      const handle = group.productHandle || productHandleFromLink(group.link);
      const override = Object.hasOwn(overrides, handle) ? overrides[handle] : null;
      if (!override?.seriesKey || !override?.waveKey) return group;
      const seriesKey = normalizeKey(override.seriesKey);
      const waveKey = normalizeKey(override.waveKey);
      const label = labels.get(`${seriesKey}:${waveKey}`);
      return {
        ...group,
        seriesKey,
        waveKey,
        series: label?.series || (seriesKey === 'more-cards' ? 'More cards' : labelForFacet('series', seriesKey)),
        wave: label?.wave || (waveKey === 'all' ? '' : labelForFacet('wave', waveKey)),
        ...(override.rarityKey ? { rarityKey: canonicalRarityKey(override.rarityKey) } : {}),
        ...(override.rarity ? { rarity: cleanRarityLabel(override.rarity) } : {}),
      };
    });
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
      character: params.get('character') || 'all',
      characterGroup: params.get('character_group') || 'browse',
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
    const current = cloneFilters(filters);
    const next = cloneFilters(filters);
    if (!Object.hasOwn(next, kind)) return next;
    next[kind] = kind === 'rarity' && normalizeKey(value) !== 'all'
      ? canonicalRarityKey(value)
      : normalizeKey(value) || 'all';
    if (kind === 'series' && next.series !== current.series) {
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

  function applyCardIdentities(cards, identities = {}) {
    return cards.map(card => {
      const identity = identities[card.id];
      if (!identity?.code || !identity.versionKey || identity.productHandle !== card.productHandle
        || String(identity.variantId || '') !== String(card.variantId || '')
        || !catalogImageKey(identity.imageURL) || catalogImageKey(identity.imageURL) !== catalogImageKey(card.image)) return card;
      return { ...card, code: identity.code, identityKey: identity.versionKey, versionLabel: identity.versionLabel || '' };
    });
  }

  function aggregateCharacterCards(cards) {
    const identities = new Map();
    const entries = [];
    cards.forEach(card => {
      let entry = card.identityKey ? identities.get(card.identityKey) : null;
      if (!entry) {
        entry = [];
        entries.push(entry);
        if (card.identityKey) identities.set(card.identityKey, entry);
      }
      entry.push(card);
    });
    return entries.map(sources => sources.length === 1 ? sources[0] : {
      ...sources[0], sources,
      characterKeys: Array.from(new Set(sources.flatMap(source => source.characterKeys || []))),
      purchaseMode: 'sources', variantId: '', link: '', price: '', available: false,
    });
  }

  function cardSourceLabel(item, origin, specialSource) {
    return origin?.cardSourceLabel || (specialSource
      ? buyerText(item?.productTitle || item?.groupTitle || item?.title || origin?.title)
      : origin?.title || labelForFacet('series', item?.seriesKey));
  }

  function cardSourcesMarkup(sources, options) {
    return `<details class="p10-card-sources">
      <summary>View ${sources.length} sources &amp; buying options</summary>
      <ul>${sources.map(source => {
        const key = `${source.seriesKey}:${source.waveKey}`;
        const origin = options.boxByKey?.get(key);
        const bundle = source.purchaseMode === 'bundle';
        const label = cardSourceLabel(source, origin, options.specialSources?.has(key));
        const note = bundle ? 'Bundle only · Not sold individually' : 'Single card';
        return `<li>
          <strong>${escapeHtml(label)}</strong>
          ${source.versionLabel ? `<span>${escapeHtml(source.versionLabel)}</span>` : ''}
          <span>${escapeHtml(note)}${source.available ? '' : ' · Sold out'}</span>
          ${origin?.cardSaleNote ? `<span>${escapeHtml(origin.cardSaleNote)}</span>` : ''}
          <a href="${escapeHtml(safeLink(source.link))}" data-card-source data-purchase-mode="${escapeHtml(source.purchaseMode)}" data-variant-id="${escapeHtml(source.variantId || '')}" aria-label="${escapeHtml(`${bundle ? 'View full bundle' : 'View single card'} from ${label}${source.available ? '' : '; sold out'}`)}">${bundle ? 'View full bundle' : `${escapeHtml(buyerText(source.price || ''))}${source.price ? ' · ' : ''}View single card`} →</a>
        </li>`;
      }).join('')}</ul>
    </details>`;
  }

  function cardMarkup(item, options = {}) {
    const shelf = Boolean(options.shelf);
    const characterTitle = options.characterLabel || '';
    const origin = options.originBox;
    const showOrigin = Boolean(characterTitle || options.showOrigin);
    const order = String(Math.max(0, Number(options.order) || 0) + 1).padStart(2, '0');
    const seriesKey = normalizeKey(item?.seriesKey || item?.series || item?.editionKey) || 'other';
    const series = labelForFacet('series', seriesKey);
    const sources = item?.sources?.length > 1 ? item.sources : null;
    const sourceLabel = sources
      ? Array.from(new Set(sources.map(source => {
        const key = `${source.seriesKey}:${source.waveKey}`;
        return cardSourceLabel(source, options.boxByKey?.get(key), options.specialSources?.has(key));
      }))).join(' · ')
      : cardSourceLabel(item, origin, options.specialSource);
    const rarityKey = canonicalRarityKey(item?.rarityKey || item?.rarity || 'card');
    const rarity = cleanRarityLabel(item?.rarity || item?.rarityKey || 'Card') || 'Card';
    const rarityFamily = rarityVisualFamily(rarityKey);
    const wave = seriesKey === 'pr' ? '' : String(item?.wave || item?.waveKey || '').toUpperCase();
    const code = buyerText(item?.code || item?.title || item?.shortLabel || 'View card');
    const bundleOnly = item?.purchaseMode === 'bundle';
    const title = bundleOnly ? String(item.title || '') : buyerText(
      shelf
        ? (item?.groupTitle || item?.productTitle || item?.title || code)
        : (item?.title || item?.productTitle || code),
    );
    const price = buyerText(item?.price || '');
    const priceLabel = bundleOnly ? '' : price ? `${shelf || item?.purchaseMode === 'single' ? '' : 'From '}${price}` : '';
    const purchaseNote = bundleOnly || sources?.every(source => source.purchaseMode === 'bundle')
      ? 'Bundle only · Not sold individually'
      : sources ? 'Choose a source for buying options' : item?.purchaseMode === 'single' && !item.available ? 'Sold out' : '';
    const dataAttribute = shelf ? 'data-shelf-card' : 'data-catalog-card';
    const href = safeLink(item?.link);

    return `
      <article class="p10-catalog-card" ${characterTitle ? 'data-character-result' : ''} ${dataAttribute} data-series="${escapeHtml(seriesKey)}" data-rarity-key="${escapeHtml(rarityKey)}" data-rarity-family="${escapeHtml(rarityFamily)}" data-card-order="${order}" data-purchase-mode="${escapeHtml(item?.purchaseMode || '')}" data-variant-id="${escapeHtml(item?.variantId || '')}" data-character-keys="${escapeHtml((item?.characterKeys || []).join(' '))}">
        <span class="p10-catalog-card__spine" aria-hidden="true"></span>
        <${sources ? 'div' : 'a'} class="p10-catalog-card__link"${sources ? '' : ` href="${escapeHtml(href)}" aria-label="${escapeHtml(bundleOnly ? `View full bundle containing ${code}; not sold individually` : `View ${code}`)}"`}>
          <span class="p10-catalog-card__media" data-card-sleeve>${imageMarkup(item, { eager: options.eager })}</span>
          <span class="p10-catalog-card__body">
            <span class="p10-catalog-card__tags">
              <span class="p10-catalog-card__series-tag">${escapeHtml(options.specialSource ? 'PR & Special Cards' : series)}</span>
              <span class="p10-catalog-card__rarity-tag" data-rarity-family="${escapeHtml(rarityFamily)}"><i class="p10-rarity-mark" aria-hidden="true"></i>${escapeHtml(rarity)}</span>
            </span>
            ${characterTitle ? `<strong class="p10-catalog-card__character-title">${escapeHtml(characterTitle)}</strong>` : ''}
            ${showOrigin ? `<span class="p10-catalog-card__origin" data-card-origin data-origin-series="${escapeHtml(origin?.seriesKey || seriesKey)}" data-origin-wave="${escapeHtml(origin?.waveKey || item.waveKey || '')}">${options.specialSource ? 'Source' : 'From'} ${escapeHtml(sourceLabel)}</span>` : ''}
            <strong class="p10-catalog-card__code">${escapeHtml(code)}</strong>
            ${item.versionLabel ? `<span class="p10-catalog-card__version">${escapeHtml(item.versionLabel)}</span>` : ''}
            ${!characterTitle && item?.characterKeys?.length ? `<span class="p10-catalog-card__characters">${escapeHtml(item.characterKeys.map(key => labelForFacet('character', key)).join(' · '))}</span>` : ''}
            ${!characterTitle && !options.showOrigin ? `<span class="p10-catalog-card__title">${escapeHtml(title || code)}</span>` : ''}
            ${!sources && origin?.cardSaleNote ? `<span class="p10-catalog-card__purchase-note" data-card-sale-note>${escapeHtml(origin.cardSaleNote)}</span>` : ''}
            ${purchaseNote ? `<span class="p10-catalog-card__purchase-note">${escapeHtml(purchaseNote)}</span>` : ''}
            ${!sources ? `<span class="p10-catalog-card__footer">
              <span class="p10-catalog-card__wave">${escapeHtml(wave)}</span>
              ${priceLabel ? `<em class="p10-catalog-card__price">${escapeHtml(priceLabel)}</em>` : ''}
              ${bundleOnly ? '<span class="p10-catalog-card__bundle-link">View full bundle →</span>' : ''}
            </span>` : ''}
          </span>
        </${sources ? 'div' : 'a'}>
        ${sources ? cardSourcesMarkup(sources, options) : ''}
      </article>
    `.trim();
  }

  function shelfCardMarkup(item, order) {
    return cardMarkup(item, { shelf: true, order });
  }

  function catalogCardMarkup(item, order, eager = false, context = {}) {
    return cardMarkup(item, { shelf: false, order, eager, ...context });
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

  function facetOptionMarkup(kind, value, selected, groups, count) {
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

    if (Number.isFinite(count)) {
      content += `<span class="p10-filter-option__count">${count}</span>`;
      if (count === 0 && !active && value !== 'all') attributes += ' disabled';
    }
    return `<button type="button" class="p10-filter-option p10-filter-option--${escapeHtml(kind)}" data-filter-kind="${escapeHtml(kind)}" data-filter-value="${escapeHtml(value)}"${attributes} aria-pressed="${active ? 'true' : 'false'}">${content}</button>`;
  }

  function activeFilterEntries(filters, groups) {
    return ['character', 'series', 'rarity', 'wave']
      .filter((kind) => filters[kind] && filters[kind] !== 'all')
      .map((kind) => ({
        kind,
        value: filters[kind],
        label: `${kind === 'character' ? 'Character: ' : kind === 'rarity' ? 'Rarity: ' : ''}${labelForFacet(kind, filters[kind], groups)}`,
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
    const characterCardCache = new WeakMap();
    const ipMode = root.hasAttribute('data-ip-browser');
    const boxMode = ipMode || root.hasAttribute('data-box-browser');
    const sourceBoxes = boxMode ? buildCatalogBoxes(groups, payload.boxes) : [];
    const specialSources = new Set(payload.specialCardSources || []);
    const boxes = groupSpecialCardBoxes(sourceBoxes, Array.from(specialSources));
    const boxByKey = new Map(sourceBoxes.map(box => [`${box.seriesKey}:${box.waveKey}`, box]));
    const directoryUrl = catalogPagePath(root.dataset.catalogDirectoryUrl) || window.location.pathname;
    const pageHeader = root.querySelector('[data-box-page]');
    const pageData = pageHeader ? {
      seriesKey: pageHeader.dataset.series, waveKey: pageHeader.dataset.wave, url: window.location.pathname,
      title: pageHeader.dataset.title || pageHeader.querySelector('[data-box-title]')?.textContent,
      intro: pageHeader.dataset.intro || pageHeader.querySelector('[data-box-description]')?.textContent,
    } : null;
    const boxPages = catalogBoxPages(payload.boxPages || []);
    const headerPage = catalogBoxPages(pageData ? [pageData] : [])[0];
    if (headerPage && !boxPages.some(page => page.url === headerPage.url)) boxPages.push(headerPage);
    const documentBoxPage = boxPages.find(page => !page.aliasOf && page.url === window.location.pathname);
    const pageByBox = new Map(boxPages.map(page => [`${page.seriesKey}:${page.waveKey}`, page]));
    const publishedPagePaths = new Set(Array.from(root.querySelectorAll('[data-box-landing-link]'), link => catalogPagePath(link.getAttribute('href'))).filter(Boolean));
    const characterGroups = (payload.characterGroups || []).map(group => ({
      key: normalizeKey(group.key), label: String(group.label || ''), description: String(group.description || ''),
      characterKeys: Array.from(new Set((group.characterKeys || []).map(characterKey).filter(key => key !== 'all'))),
    })).filter(group => group.key && !['all', 'browse'].includes(group.key) && group.label);
    const characterSearchAliases = payload.characterSearchAliases || {};
    const mapRegions = (payload.characterMapRegions || []).map(region => ({
      key: normalizeKey(region.key), label: String(region.label || ''),
      x: Math.max(0, Math.min(100, Number(region.x) || 0)), y: Math.max(0, Math.min(100, Number(region.y) || 0)),
      groupKeys: (region.groupKeys || []).filter(key => characterGroups.some(group => group.key === key)),
    })).filter(region => region.key && region.label && region.groupKeys.length);
    const mapOpen = { desktop: false, drawer: false };
    const catalogIp = normalizeKey(payload.catalogIp);
    const ips = ipMode ? catalogIps(payload.ips, catalogIp) : [];
    const publicProductHandles = new Set(groups.map((group) => group.productHandle || productHandleFromLink(group.link)).filter(Boolean));
    const spotlightCards = Array.isArray(payload?.spotlightCards) && payload.spotlightCards.length
      ? payload.spotlightCards.filter((card) => publicProductHandles.has(productHandleFromLink(card.link)))
      : groups;
    const state = createState(window.innerWidth);
    const initialRoute = ipMode ? resolveCatalogRoute(window.location.href, boxes, ips, catalogIp, boxPages) : null;
    let currentIp = initialRoute?.ip || null;
    let currentBox = ipMode ? initialRoute.box : (boxMode ? findCatalogBox(boxes, state.applied) : null);
    if (boxMode) {
      state.applied = normalizePickerFilters(initialRoute?.filters || { ...boxFilters(currentBox, state.applied.rarity), character: state.applied.character, characterGroup: state.applied.characterGroup });
      state.draft = cloneFilters(state.applied);
    }
    const drawer = root.querySelector('[data-mobile-filter-drawer]');
    const desktopMap = root.querySelector('dialog[data-character-map="desktop"]');
    const drawerTrigger = root.querySelector('[data-mobile-filter-trigger]');
    let restoreFocus = null;
    let desktopMode = window.innerWidth > 980;
    let previousSpotlightIds = [];
    let spotlightRendered = false;
    let spotlightRevision = 0;
    let motionCleanup = () => {};
    let headerResizeObserver = null;

    function normalizePickerFilters(filters) {
      const next = cloneFilters(filters);
      const group = characterGroups.find(item => item.key === next.characterGroup);
      if (!group && next.characterGroup !== 'all') next.characterGroup = 'browse';
      if (next.character !== 'all' && next.characterGroup !== 'all' && !group?.characterKeys.includes(next.character)) {
        next.characterGroup = characterGroups.find(item => item.characterKeys.includes(next.character))?.key || 'all';
      }
      if (boxMode && !currentBox && (next.character === 'all' || (next.rarity !== 'all' && !groups.some(card => characterMatches(card, next.character) && card.rarityKey === next.rarity)))) next.rarity = 'all';
      return next;
    }

    function showsCards(filters = state.applied) {
      return Boolean(currentBox || filters.character !== 'all' || !boxMode);
    }

    function resetFilters(rarity = 'all') {
      return boxMode ? boxFilters(currentBox, rarity) : cloneFilters();
    }

    function changeFilter(filters, kind, value) {
      const next = updateStateForFacet(filters, kind, value);
      if (kind === 'character') next.character = characterKey(value);
      return normalizePickerFilters(next);
    }

    function pageForDestination(box) {
      return catalogBoxPageForDestination(box, boxPages, {
        pathname: window.location.pathname, currentBox,
        enabled: payload.boxPagesEnabled, publishedPaths: publishedPagePaths,
      });
    }

    function viewUrl(box = currentBox, rarity = state.applied.rarity, ip = currentIp, character = state.applied.character, characterGroup = state.applied.characterGroup) {
      const options = { directoryUrl, boxPage: pageForDestination(box) };
      const url = new URL(ipMode
        ? catalogIpUrl(window.location.href, ip?.key, box, rarity, options)
        : catalogBoxUrl(window.location.href, box, rarity, options), window.location.href);
      if (ip && character !== 'all') url.searchParams.set('character', character);
      if (ip && !box && character !== 'all' && rarity !== 'all') url.searchParams.set('rarity', rarity);
      if (ip && characterGroup !== 'browse') url.searchParams.set('character_group', characterGroup);
      return url.pathname + url.search;
    }

    function renderIpHome() {
      const directory = root.querySelector('[data-ip-directory]');
      if (directory) directory.innerHTML = ips.map((ip) => `
        <a class="p10-ip-card" data-ip-key="${escapeHtml(ip.key)}" href="${escapeHtml(ip.url || catalogIpUrl(window.location.href, ip.key, null, 'all', { directoryUrl }))}">
          <span class="p10-ip-card__media">${boxImageMarkup(ip)}</span>
          <span class="p10-ip-card__body"><strong>${escapeHtml(ip.title)}</strong>${ip.publisher ? `<small>${escapeHtml(ip.publisher)}</small>` : ''}</span>
        </a>`).join('');
      const recommendations = root.querySelector('[data-ip-recommendations]');
      const empty = root.querySelector('[data-ip-recommendations-empty]');
      const cards = Array.isArray(payload.recommendedCards) ? payload.recommendedCards : [];
      if (recommendations) {
        recommendations.innerHTML = cards.map(shelfCardMarkup).join('');
        recommendations.hidden = cards.length === 0;
      }
      if (empty) empty.hidden = cards.length > 0;
    }

    function matchingBoxes(filters) {
      return boxes.filter(box => box.groups.some(card => characterMatches(card, filters.character || 'all')));
    }

    function renderBoxDirectory() {
      const directory = root.querySelector('[data-box-directory]');
      if (!directory || currentBox) return;
      const character = state.applied.character;
      const filtered = character !== 'all';
      const matches = matchingBoxes(state.applied);
      const pending = filtered ? boxes.filter(box => !matches.includes(box) && box.groups.some(card => !card.characterKeys?.length)) : [];
      function sectionsFor(entries, pendingIndex = false) {
        const sections = new Map();
        entries.forEach(box => {
          if (!sections.has(box.groupLabel)) sections.set(box.groupLabel, []);
          sections.get(box.groupLabel).push(box);
        });
        return Array.from(sections, ([label, items]) => `
          <section class="p10-box-group">
            <h3 class="p10-box-group__heading">${escapeHtml(label)}</h3>
            <div class="p10-box-grid">${items.map(box => {
              const count = box.groups.filter(card => characterMatches(card, character)).length;
              const destinationCharacter = pendingIndex ? 'all' : character;
              return `<a class="p10-box-card${box.kind === 'special' ? ' p10-box-card--special' : ''}" data-box-series="${escapeHtml(box.seriesKey)}" data-box-wave="${escapeHtml(box.waveKey)}" data-box-character="${destinationCharacter}" href="${escapeHtml(viewUrl(box, 'all', currentIp, destinationCharacter))}">
                <span class="p10-box-card__media">${boxImageMarkup(box)}</span>
                <span class="p10-box-card__body"><strong>${escapeHtml(box.title)}</strong>
                  ${box.kind === 'special' ? '<span class="p10-special-description">Promotional cards, event exclusives and limited releases, all in one collection.</span>' : ''}
                  <small>${filtered && !pendingIndex ? count + ' matching ' + (count === 1 ? 'card' : 'cards') : box.groups.length + ' cards'} · ${boxRarities(box).length} rarities</small>
                  <span class="p10-box-card__action">${box.kind === 'special' ? 'Browse special cards' : pendingIndex ? 'Browse this BOX' : 'View cards in this BOX'} <span aria-hidden="true">→</span></span>
                </span></a>`;
            }).join('')}</div>
          </section>`).join('');
      }
      directory.innerHTML = `<header class="p10-box-directory__heading">
        <div><p class="p10-box-eyebrow">Choose a BOX</p><h2>${filtered ? 'BOXes featuring ' + escapeHtml(labelForFacet('character', character)) : 'My Little Pony BOXes'}</h2>
          <p>${matches.length} ${filtered ? 'matching ' : ''}collections · Choose a BOX or explore PR & special cards.</p></div>
        ${filtered ? `<button type="button" class="p10-box-back" data-filter-clear>All ${boxes.length} BOXes</button>` : ''}
        </header>
        ${matches.length ? sectionsFor(matches) : '<p class="p10-box-directory__empty">No confirmed matches yet. Browse the other BOXes below or clear the character filter.</p>'}
        ${pending.length ? `<details class="p10-box-pending"><summary>Other BOXes to explore (${pending.length})</summary><p>Character details are still being added for these BOXes. You can browse their full card lists.</p>${sectionsFor(pending, true)}</details>` : ''}`;
    }

    function renderBoxView() {
      const directory = root.querySelector('[data-box-directory]');
      const detail = root.querySelector('[data-box-detail]');
      const home = ipMode && !currentIp;
      const showingCards = showsCards();
      const character = state.applied.character !== 'all' ? labelForFacet('character', state.applied.character) : '';
      root.dataset.characterView = String(Boolean(character));
      root.querySelectorAll('[data-character-boxes]').forEach(button => { button.hidden = !character; });
      const ipHome = root.querySelector('[data-ip-home]');
      if (ipHome) ipHome.hidden = !home;
      const breadcrumb = root.querySelector('.p10-box-breadcrumb');
      if (breadcrumb) breadcrumb.hidden = home;
      if (directory) directory.hidden = home || showingCards;
      if (detail) detail.hidden = home;
      const cardResults = root.querySelector('[data-catalog-results]');
      if (cardResults) cardResults.hidden = !showingCards;
      root.querySelectorAll('[data-character-entry]').forEach(node => { node.hidden = !home; });
      root.dataset.boxView = home ? 'home' : currentBox ? 'detail' : character ? 'character' : 'directory';
      const boxPage = currentBox && pageByBox.get(`${currentBox.seriesKey}:${currentBox.waveKey}`);
      const landingHeader = boxPage?.url === documentBoxPage?.url ? headerPage : null;
      const texts = {
        '[data-box-eyebrow]': home ? 'CARD GALLERY' : (currentIp?.publisher || 'CARD COLLECTION'),
        '[data-box-title]': home ? 'Single cards' : (landingHeader?.title || boxPage?.title || currentBox?.title || currentIp?.title || 'Choose your BOX'),
        '[data-box-description]': home ? 'Explore your favorite worlds. Discover a set, or find the characters you collect.' : currentBox
          ? landingHeader?.intro || boxPage?.intro || (currentBox.kind === 'special' ? 'Explore promotional cards, event exclusives and limited releases. Each card keeps its original source and purchase options.' : 'Find a character or choose a rarity. Cards marked “Bundle only” are sold together as a full bundle.')
          : character ? `Explore ${character} cards across the collection. Each card shows its original BOX or set.` : 'Browse a BOX, or choose a character to see their single cards.',
        '[data-box-meta]': home ? '' : currentBox
          ? `${currentBox.groups.length} cards to browse · ${boxRarities(currentBox).length} rarity options`
          : `${boxes.length} boxes & collections`,
        '[data-box-breadcrumb]': currentBox?.title || character || 'All BOXes & sets',
        '[data-filter-context]': currentBox?.kind === 'special' ? 'PR & limited releases' : currentBox ? 'Within this BOX' : character ? 'Across BOXes & sets' : 'Find the right BOX',
        '[data-filter-title]': showingCards ? 'Find your card' : 'Browse collections',
        '[data-filter-open-label]': showingCards ? 'Filter cards' : 'Filter BOXes',
        '[data-filter-dialog-title]': showingCards ? 'Filter cards' : 'Filter BOXes',
        '[data-results-title]': character || (currentBox?.kind === 'special' ? currentBox.title : 'Single cards'),
        '[data-results-eyebrow]': character ? 'Character collection' : currentBox?.kind === 'special' ? 'Limited & event releases' : 'Card catalog',
      };
      Object.entries(texts).forEach(([selector, value]) => {
        root.querySelectorAll(selector).forEach((node) => { node.textContent = value; });
      });
      root.querySelectorAll('[data-box-facts]').forEach(node => {
        const facts = boxPage?.facts || [];
        node.hidden = !facts.length;
        node.innerHTML = facts.map(fact => `<div class="p10-box-fact"><dt>${escapeHtml(fact.label)}</dt><dd>${escapeHtml(fact.value)}</dd></div>`).join('');
      });
      root.querySelectorAll('[data-box-meta]').forEach((node) => { node.hidden = home; });
      root.querySelectorAll('[data-box-breadcrumb]').forEach((node) => { node.hidden = !showingCards; });
      const image = root.querySelector('[data-box-image]');
      if (image) {
        const item = currentBox || currentIp;
        image.hidden = !item || item.kind === 'special';
        image.innerHTML = !image.hidden ? boxImageMarkup(item) : '';
      }
      root.querySelectorAll('[data-box-back]').forEach((link) => {
        link.href = viewUrl(null, 'all', currentIp, 'all');
        link.hidden = home || (!showingCards && !link.closest('.p10-box-breadcrumb'));
        if (ipMode && link.closest('.p10-box-breadcrumb')) link.textContent = currentIp?.title || 'Boxes & sets';
      });
      root.querySelectorAll('[data-all-cards], [data-character-link]').forEach(link => {
        link.href = viewUrl(null, 'all', ips.find(ip => ip.key === catalogIp), link.dataset.characterLink || 'all');
      });
      root.querySelectorAll('[data-ip-back]').forEach((link) => {
        link.href = catalogIpUrl(window.location.href, null, null, 'all', { directoryUrl });
        link.hidden = home && !link.closest('.p10-box-breadcrumb');
      });
    }

    function navigateBox(filters, pushHistory = false, focus = false, ip = currentIp) {
      const destinationBox = ipMode && !ip ? null : findCatalogBox(boxes, filters);
      const destination = viewUrl(destinationBox, filters.rarity || 'all', ip, characterKey(filters.character), filters.characterGroup ?? state.applied.characterGroup);
      if (pushHistory && new URL(destination, window.location.href).pathname !== window.location.pathname) {
        window.location.assign(destination);
        return;
      }
      if (drawer && !drawer.hidden) closeDrawer({ cancel: true });
      if (desktopMap?.open) setCharacterMapOpen('desktop', false);
      root.querySelectorAll('[data-character-search]').forEach(input => { input.value = ''; });
      if (ipMode) currentIp = ip;
      currentBox = ipMode && !currentIp ? null : findCatalogBox(boxes, filters);
      state.applied = normalizePickerFilters({ ...boxFilters(currentBox, filters.rarity), rarity: currentBox ? boxFilters(currentBox, filters.rarity).rarity : filters.rarity || 'all', character: characterKey(filters.character), characterGroup: filters.characterGroup ?? state.applied.characterGroup });
      state.draft = cloneFilters(state.applied);
      state.visibleLimit = initialLimit(window.innerWidth);
      renderAppliedFilters(pushHistory);
      if (focus) root.querySelector('[data-box-title]')?.focus();
    }

    function onPopState() {
      if (ipMode) {
        const route = resolveCatalogRoute(window.location.href, boxes, ips, catalogIp, boxPages);
        navigateBox(route.filters, false, false, route.ip);
      } else navigateBox(initialFiltersFromLocation());
    }

    function matchingGroups(filters) {
      const current = normalizedFilters(filters);
      let source = boxMode ? (currentBox?.groups || groups) : groups;
      if (current.character !== 'all') {
        if (!characterCardCache.has(source)) characterCardCache.set(source, aggregateCharacterCards(source));
        source = characterCardCache.get(source);
      }
      if (boxMode) return source.filter(group =>
        (current.rarity === 'all' || group.rarityKey === current.rarity) && characterMatches(group, current.character)
      );
      return source.filter((group) => (
        (current.series === 'all' || group.seriesKey === current.series)
        && (current.rarity === 'all' || group.rarityKey === current.rarity)
        && (current.wave === 'all' || group.waveKey === current.wave)
        && characterMatches(group, current.character)
      ));
    }

    function matchingSpotlightCards(filters) {
      return spotlightCards.filter((card) => matchesGroup(card, filters));
    }

    function controllerFacets(filters) {
      if (boxMode) {
        const source = currentBox?.groups || groups;
        const known = new Set(source.flatMap(card => card.characterKeys || []));
        if (filters.character !== 'all') known.add(filters.character);
        return { series: [], waves: [],
          rarities: currentBox ? ['all', ...boxRarities(currentBox)] : filters.character !== 'all' ? ['all', ...boxRarities({ groups: source.filter(card => characterMatches(card, filters.character)) })] : [],
          characters: ['all', ...MLP_CHARACTERS.filter(character => known.has(character.key)).sort((a, b) => a.label.localeCompare(b.label, 'en')).map(character => character.key)],
        };
      }
      return deriveFacets(groups, filters);
    }

    function recordRenderTime(name, startedAt) {
      root.dataset[name] = (performance.now() - startedAt).toFixed(1);
    }

    function setOptions(selector, kind, values, selected, filters) {
      const container = root.querySelector(selector);
      if (!container) return;
      const visibleValues = kind === 'rarity' && !boxMode
        ? values.filter((value) => canonicalRarityKey(value) !== 'card')
        : values;
      container.innerHTML = visibleValues
        .map((value) => facetOptionMarkup(kind, value, selected, groups, boxMode && filters ? (kind === 'character' || showsCards(filters) ? matchingGroups({ ...filters, [kind]: value }).length : matchingBoxes({ ...filters, [kind]: value }).length) : undefined))
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

    function renderCharacterMap(prefix, filters, values) {
      const panel = root.querySelector(`[data-character-map="${prefix}"]`);
      if (!panel || !mapRegions.length) return;
      const available = new Set(values.filter(key => key !== 'all'));
      const countFor = key => characterGroups.find(group => group.key === key)?.characterKeys.filter(key => available.has(key)).length || 0;
      const region = mapRegions.find(region => region.groupKeys.includes(filters.characterGroup));
      if (!panel.dataset.ready) {
        panel.querySelector('[data-map-pins]').innerHTML = mapRegions.map(region => `<button type="button" class="p10-map-pin" data-map-region="${escapeHtml(region.key)}" style="--map-x:${region.x}%;--map-y:${region.y}%" aria-pressed="false"><span class="p10-map-pin__dot" aria-hidden="true"></span><span>${escapeHtml(region.label)}</span></button>`).join('');
        panel.querySelector('[data-map-group-list]').innerHTML = characterGroups.map(group => `<button type="button" data-character-group-link="${escapeHtml(group.key)}" aria-pressed="false">${escapeHtml(group.label)}</button>`).join('');
        panel.dataset.ready = 'true';
      }
      panel.querySelectorAll('[data-map-region]').forEach(button => {
        const entry = mapRegions.find(region => region.key === button.dataset.mapRegion);
        button.disabled = !entry.groupKeys.some(countFor);
        button.setAttribute('aria-pressed', String(entry === region));
      });
      panel.querySelectorAll('[data-character-group-link]').forEach(button => {
        const key = button.dataset.characterGroupLink;
        const regional = mapRegions.some(region => region.groupKeys.includes(key));
        button.hidden = regional && !region?.groupKeys.includes(key);
        button.disabled = !countFor(key) && key !== filters.characterGroup;
        button.setAttribute('aria-pressed', String(key === filters.characterGroup));
      });
      const group = characterGroups.find(group => group.key === filters.characterGroup);
      panel.querySelector('[data-map-selection]').textContent = group
        ? `${group.label} · ${countFor(group.key)} characters`
        : 'Pick a place, then choose a character.';
      panel.querySelector('[data-map-group-heading]').textContent = region ? `${region.label} & groups across Equestria` : 'Groups & stories across Equestria';
      const regionChanged = panel.dataset.selectedRegion !== (region?.key || '');
      panel.dataset.selectedRegion = region?.key || '';
      setCharacterMapOpen(prefix, mapOpen[prefix]);
      if (regionChanged && mapOpen[prefix]) centerCharacterMap(prefix);
    }

    function setCharacterMapOpen(prefix, open) {
      mapOpen[prefix] = open;
      const panel = root.querySelector(`[data-character-map="${prefix}"]`);
      if (panel) {
        if (prefix === 'desktop') {
          if (!open && panel.open) panel.close();
          panel.hidden = !open;
          if (open && !panel.open) panel.showModal();
          document.documentElement.classList.toggle('p10-map-dialog-open', open);
        } else panel.hidden = !open;
      }
      root.querySelectorAll(`[data-character-map-toggle="${prefix}"]`).forEach(button => {
        const selected = (button.dataset.mapView === 'map') === open;
        button.setAttribute('aria-pressed', String(selected));
        if (button.dataset.mapView === 'map') button.setAttribute('aria-expanded', String(open));
      });
    }

    function centerCharacterMap(prefix) {
      const panel = root.querySelector(`[data-character-map="${prefix}"]`);
      const scroller = panel?.querySelector('[data-map-scroll]');
      const pin = panel?.querySelector('[data-map-region][aria-pressed="true"]') || panel?.querySelector('[data-map-region="ponyville"]');
      if (scroller && pin) scroller.scrollLeft = Math.max(0, pin.offsetLeft - scroller.clientWidth / 2);
    }

    function renderCharacterGroups(prefix, filters, values) {
      const select = root.querySelector(`[data-character-group="${prefix}"]`);
      if (!select) return;
      const available = new Set(values.filter(key => key !== 'all'));
      const countFor = group => group.characterKeys.filter(key => available.has(key)).length;
      select.innerHTML = '<option value="browse">Choose a group…</option>'
        + characterGroups.map(group => `<option value="${escapeHtml(group.key)}" ${countFor(group) ? '' : 'disabled'}>${escapeHtml(group.label)} (${countFor(group)})</option>`).join('')
        + `<option value="all">All characters A–Z (${available.size})</option>`;
      select.value = filters.characterGroup;
      root.querySelectorAll(`[data-character-group-shortcuts="${prefix}"] [data-character-group-link]`).forEach(button => {
        const group = characterGroups.find(group => group.key === button.dataset.characterGroupLink);
        button.disabled = !group || countFor(group) === 0;
        button.setAttribute('aria-pressed', String(filters.characterGroup === group?.key));
      });
    }

    function renderFacetSet(prefix, filters) {
      const facets = controllerFacets(filters);
      setOptions(`[data-${prefix}-options="series"]`, 'series', facets.series, filters.series);
      setOptions(`[data-${prefix}-options="rarity"]`, 'rarity', facets.rarities, filters.rarity, filters);
      setOptions(`[data-${prefix}-options="wave"]`, 'wave', facets.waves, filters.wave);
      renderCharacterGroups(prefix, filters, facets.characters || []);
      renderCharacterMap(prefix, filters, facets.characters || []);
      setOptions(`[data-${prefix}-options="character"]`, 'character', facets.characters || [], filters.character, filters);
      filterCharacterOptions(prefix);
      const source = currentBox?.groups || groups;
      const knownCount = source.filter(card => card.characterKeys?.length).length;
      root.querySelectorAll('[data-character-coverage-note]').forEach(node => {
        node.textContent = `Character details are available for ${knownCount} of ${source.length} cards. Browse without a character filter to see them all.`;
        node.hidden = knownCount === source.length;
      });
      const waveWrap = root.querySelector(`[data-${prefix === 'desktop' ? 'desktop' : 'drawer'}-facet="wave"]`);
      const rarityWrap = root.querySelector(`[data-${prefix === 'desktop' ? 'desktop' : 'drawer'}-facet="rarity"]`);
      const host = prefix === 'desktop' ? root.querySelector('[data-desktop-filters]') : drawer;
      const desktopRefine = prefix === 'desktop' ? root.querySelector('[data-desktop-refine]') : null;
      if (host) host.dataset.seriesContext = normalizeKey(filters.series) || 'all';
      if (waveWrap) waveWrap.hidden = facets.waves.length === 0;
      if (rarityWrap) rarityWrap.hidden = facets.rarities.length === 0;
      if (desktopRefine) desktopRefine.hidden = false;
      return facets;
    }

    function renderDesktopFacetSummaries(filters) {
      ['character', 'rarity', 'wave'].forEach((kind) => {
        const summary = root.querySelector(`[data-desktop-facet-summary="${kind}"]`);
        if (!summary) return;
        const value = filters[kind] || 'all';
        const active = normalizeKey(value) !== 'all';
        summary.textContent = labelForFacet(kind, value, groups);
        summary.dataset.active = String(active);
      });
    }

    function visibleStickyHeaderHeight() {
      return Array.from(document.querySelectorAll('sticky-header, sticky-header-mobile'))
        .reduce((height, header) => {
          const bounds = header.getBoundingClientRect();
          const styles = window.getComputedStyle(header);
          const visible = bounds.width > 0
            && bounds.height > 0
            && styles.display !== 'none'
            && styles.visibility !== 'hidden';
          return visible ? Math.max(height, bounds.height) : height;
        }, 0);
    }

    function syncDesktopSidebarOffset() {
      if (window.innerWidth <= 980) {
        root.style.removeProperty('--p10-single-card-sidebar-top');
        return;
      }
      const headerHeight = visibleStickyHeaderHeight();
      if (!headerHeight) {
        root.style.removeProperty('--p10-single-card-sidebar-top');
        return;
      }
      root.style.setProperty('--p10-single-card-sidebar-top', `${Math.ceil(headerHeight + 16)}px`);
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
      const matches = showsCards() ? matchingGroups(state.applied) : [];
      const count = showsCards() ? matches.length : matchingBoxes(state.applied).length;
      const countLabel = showsCards() ? (count === 1 ? 'card' : 'cards') : (count === 1 ? 'collection' : 'collections');
      const cards = matches.slice(0, state.visibleLimit);
      const focused = activeFilterEntries(state.applied, groups).length > 0;
      const grid = root.querySelector('[data-catalog-grid]');
      if (grid) {
        grid.innerHTML = cards
          .map((item, order) => catalogCardMarkup(item, order, focused && order < 4, { characterLabel: state.applied.character !== 'all' ? labelForFacet('character', state.applied.character) : '', originBox: boxByKey.get(`${item.seriesKey || 'all'}:${item.waveKey || 'all'}`), showOrigin: currentBox?.kind === 'special', specialSource: specialSources.has(`${item.seriesKey || 'all'}:${item.waveKey || 'all'}`), boxByKey, specialSources }))
          .join('');
      }
      root.querySelectorAll('[data-result-count], [data-mobile-result-count]')
        .forEach((node) => {
          node.setAttribute('aria-live', 'polite');
          node.setAttribute('aria-atomic', 'true');
          node.textContent = String(count);
        });
      root.querySelectorAll('[data-catalog-result-count]')
        .forEach((node) => { node.textContent = String(matches.length); });
      const empty = root.querySelector('[data-catalog-empty]');
      if (empty) empty.hidden = matches.length > 0;
      const resultMessage = root.querySelector('[data-filter-result-message]');
      if (resultMessage) {
        const character = state.applied.character !== 'all' ? labelForFacet('character', state.applied.character) : '';
        resultMessage.textContent = `${matches.length} ${character ? 'unique ' : ''}${matches.length === 1 ? 'card' : 'cards'}${character ? ' featuring ' + character : ''}${state.applied.rarity !== 'all' ? ' · ' + labelForFacet('rarity', state.applied.rarity, groups) : ''} · ${currentBox?.title || 'All MLP boxes'}`;
      }
      root.querySelectorAll('[data-count-label]').forEach(node => { node.textContent = countLabel; });
      const more = root.querySelector('[data-load-more]');
      if (more) {
        more.hidden = cards.length >= matches.length;
        more.textContent = `Load more cards (${cards.length} of ${matches.length})`;
      }
    }

    function renderAppliedFilters(pushHistory = false) {
      if (boxMode) {
        const href = pushHistory ? viewUrl() : '';
        if (pushHistory && new URL(href, window.location.href).pathname !== window.location.pathname) {
          window.location.assign(href);
          return;
        }
        renderBoxView();
        renderBoxDirectory();
        if (pushHistory) {
          if (href !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
            window.history.pushState(null, '', href);
          }
        }
      }
      if (window.innerWidth > 980) {
        renderFacetSet('desktop', state.applied);
        renderDesktopFacetSummaries(state.applied);
      }
      const chipFilters = boxMode ? { ...DEFAULT_FILTERS, rarity: state.applied.rarity, character: state.applied.character } : state.applied;
      const activeEntries = activeFilterEntries(chipFilters, groups);
      const filtered = activeEntries.length > 0;
      root.dataset.filterMode = filtered || currentBox ? 'focused' : 'discovery';
      root.querySelectorAll('[data-recommendation-section]').forEach((section) => {
        section.hidden = filtered;
      });
      const activeMarkup = activeFilterMarkup(chipFilters, groups);
      const desktopActive = root.querySelector('[data-active-filters]');
      const mobileActive = root.querySelector('[data-mobile-active-filters]');
      if (desktopActive) desktopActive.innerHTML = activeMarkup;
      if (mobileActive) mobileActive.innerHTML = activeMarkup;
      const summary = root.querySelector('[data-filter-summary]');
      if (summary) {
        const labels = activeEntries.map((entry) => entry.label);
        summary.textContent = labels.length ? labels.join(' / ') : (boxMode ? (currentBox?.kind === 'special' ? 'All special cards' : currentBox ? 'All cards in this BOX' : 'All collections') : 'All cards');
      }
      root.querySelectorAll('[data-filter-clear]').forEach((button) => {
        button.hidden = activeEntries.length === 0 && state.applied.characterGroup === 'browse';
      });
      renderSpotlight('filter');
      renderCatalog();
    }

    function renderDraftFilters() {
      renderFacetSet('drawer', state.draft);
      const dialogTitle = root.querySelector('[data-filter-dialog-title]');
      if (dialogTitle) dialogTitle.textContent = showsCards(state.draft) ? 'Filter cards' : 'Filter BOXes';
      const draftCount = showsCards(state.draft) ? matchingGroups(state.draft).length : matchingBoxes(state.draft).length;
      const count = root.querySelector('[data-draft-result-count]');
      if (count) count.textContent = String(draftCount);
      const label = root.querySelector('[data-draft-count-label]');
      if (label) label.textContent = showsCards(state.draft) ? (draftCount === 1 ? 'card' : 'cards') : (draftCount === 1 ? 'collection' : 'collections');
    }

    function clearAppliedFilters() {
      root.querySelectorAll('[data-character-search]').forEach(input => { input.value = ''; });
      state.applied = resetFilters();
      state.draft = cloneFilters(state.applied);
      state.visibleLimit = initialLimit(window.innerWidth);
      renderAppliedFilters(true);
    }

    function filterCharacterOptions(prefix) {
      const filters = prefix === 'drawer' ? state.draft : state.applied;
      const input = root.querySelector(`[data-character-search="${prefix}"]`);
      const query = String(input?.value || '').trim().toLowerCase();
      const group = characterGroups.find(group => group.key === filters.characterGroup);
      const options = root.querySelectorAll(`[data-${prefix}-options="character"] [data-filter-value]`);
      let found = 0;
      options.forEach(button => {
        const key = button.dataset.filterValue;
        const character = MLP_CHARACTERS.find(entry => entry.key === key);
        const matches = key === 'all' || (query
          ? [...(character?.aliases || []), ...(characterSearchAliases[key] || [])].some(alias => alias.toLowerCase().includes(query))
          : filters.characterGroup === 'all' || group?.characterKeys.includes(key) || key === filters.character);
        button.hidden = !matches;
        if (matches && key !== 'all') found++;
      });
      const status = root.querySelector(`[data-character-picker-status="${prefix}"]`);
      if (status) status.textContent = query
        ? `${found} matching ${found === 1 ? 'character' : 'characters'} across all groups`
        : group ? `${found} ${found === 1 ? 'character' : 'characters'} · ${group.description}`
        : filters.characterGroup === 'all' ? `${found} characters · A–Z`
        : 'Choose a group above, or search any character name.';
      const empty = root.querySelector(`[data-character-options-empty="${prefix}"]`);
      if (empty) {
        empty.hidden = found > 0 || (!query && filters.characterGroup === 'browse');
        empty.textContent = query ? 'No matching characters. Try another name.' : 'No characters from this group in this BOX yet.';
      }
    }

    function chooseCharacterGroup(prefix, value) {
      const filters = cloneFilters(prefix === 'drawer' ? state.draft : state.applied);
      const group = characterGroups.find(group => group.key === value);
      filters.characterGroup = group ? group.key : value === 'all' ? 'all' : 'browse';
      if (filters.characterGroup !== 'all' && !group?.characterKeys.includes(filters.character)) filters.character = 'all';
      if (boxMode && !currentBox && filters.character === 'all') filters.rarity = 'all';
      const search = root.querySelector(`[data-character-search="${prefix}"]`);
      if (search) search.value = '';
      if (prefix === 'drawer') { state.draft = filters; renderDraftFilters(); }
      else {
        state.applied = filters;
        state.draft = cloneFilters(filters);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters(true);
      }
    }

    function onRootChange(event) {
      const prefix = event.target.dataset.characterGroup;
      if (prefix) chooseCharacterGroup(prefix, event.target.value);
    }

    function onRootInput(event) {
      const prefix = event.target.dataset.characterSearch;
      if (prefix) filterCharacterOptions(prefix);
    }

    function focusableDrawerElements() {
      if (!drawer) return [];
      return Array.from(drawer.querySelectorAll('[role="dialog"] button:not([disabled]), [role="dialog"] a[href], [role="dialog"] input:not([disabled]), [role="dialog"] select:not([disabled])'))
        .filter((element) => !element.hidden && !element.closest('[hidden]') && element.getAttribute('aria-hidden') !== 'true');
    }

    function openDrawer() {
      if (!drawer || !drawerTrigger) return;
      state.draft = cloneFilters(state.applied);
      const search = drawer.querySelector('[data-character-search]');
      if (search) search.value = '';
      renderDraftFilters();
      restoreFocus = drawerTrigger;
      drawer.hidden = false;
      drawerTrigger.setAttribute('aria-expanded', 'true');
      document.documentElement.classList.add('p10-catalog-drawer-open');
      setTimeout(() => {
        if (drawer.hidden) return;
        drawer.classList.add('is-open');
        if (mapOpen.drawer) centerCharacterMap('drawer');
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

    function focusFacetOption(container, kind, value) {
      if (!container) return;
      const facetValue = (candidate) => kind === 'rarity'
        ? canonicalRarityKey(candidate.dataset.filterValue)
        : normalizeKey(candidate.dataset.filterValue);
      const isFocusable = (candidate) => (
        !candidate.disabled
        && !candidate.hidden
        && candidate.getAttribute('aria-hidden') !== 'true'
        && !candidate.closest?.('[hidden], [aria-hidden="true"]')
      );
      const expected = kind === 'rarity' ? canonicalRarityKey(value) : normalizeKey(value);
      const candidates = Array.from(container.querySelectorAll(`[data-filter-kind="${kind}"]`))
        .filter(isFocusable);
      const option = candidates.find((candidate) => facetValue(candidate) === expected)
        || candidates.find((candidate) => candidate.getAttribute('aria-pressed') === 'true')
        || candidates.find((candidate) => facetValue(candidate) === 'all')
        || Array.from(container.querySelectorAll('button[data-filter-kind]')).find(isFocusable);
      option?.focus();
    }

    function onMapCancel(event) {
      event.preventDefault();
      setCharacterMapOpen('desktop', false);
      root.querySelector('[data-character-map-toggle="desktop"][data-map-view="map"]')?.focus();
    }

    function onRootClick(event) {
      if (event.target === desktopMap && desktopMap.open) {
        const bounds = desktopMap.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onMapCancel(event);
        return;
      }
      const target = event.target.closest('button, a');
      if (!target || !root.contains(target)) return;

      if (target.matches('[data-character-map-toggle]')) {
        const prefix = target.dataset.characterMapToggle;
        const open = target.dataset.mapView === 'map';
        setCharacterMapOpen(prefix, open);
        if (open) {
          centerCharacterMap(prefix);
          const panel = root.querySelector('[data-character-map="' + prefix + '"]');
          const pin = panel?.querySelector('[data-map-region][aria-pressed="true"]:not(:disabled)')
            || panel?.querySelector('[data-map-region="ponyville"]:not(:disabled)')
            || panel?.querySelector('[data-map-region]:not(:disabled)');
          pin?.focus({ preventScroll: true });
          pin?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        } else if (target.closest('[data-character-map]')) {
          root.querySelector('[data-character-map-toggle="' + prefix + '"][data-map-view="map"]')?.focus();
        }
        return;
      }

      if (target.matches('[data-map-choose-character]')) {
        const prefix = target.closest('[data-character-map]').dataset.characterMap;
        setCharacterMapOpen(prefix, false);
        const input = root.querySelector('[data-character-search="' + prefix + '"]');
        input?.closest('details')?.setAttribute('open', '');
        input?.focus();
        input?.scrollIntoView({ block: 'nearest' });
        return;
      }

      if (target.matches('[data-map-region]')) {
        const prefix = target.closest('[data-character-map]').dataset.characterMap;
        const region = mapRegions.find(region => region.key === target.dataset.mapRegion);
        const filters = prefix === 'drawer' ? state.draft : state.applied;
        const available = new Set(controllerFacets(filters).characters || []);
        const key = region?.groupKeys.find(key => characterGroups.find(group => group.key === key)?.characterKeys.some(key => available.has(key)));
        if (key) chooseCharacterGroup(prefix, key);
        return;
      }

      if (target.matches('[data-character-group-link]')) {
        chooseCharacterGroup(target.closest('[data-mobile-filter-drawer]') ? 'drawer' : 'desktop', target.dataset.characterGroupLink);
        return;
      }

      if (target.matches('[data-character-boxes]')) {
        navigateBox({ ...DEFAULT_FILTERS, characterGroup: state.applied.characterGroup }, true, true);
        return;
      }

      if (ipMode && target.matches('[data-all-cards], [data-character-link]')) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigateBox({ ...DEFAULT_FILTERS, character: target.dataset.characterLink || 'all' }, true, true, ips.find(ip => ip.key === catalogIp));
        return;
      }

      if (ipMode && target.matches('[data-ip-key], [data-ip-back]')) {
        const ip = target.hasAttribute('data-ip-back') ? null : ips.find((entry) => entry.key === target.dataset.ipKey);
        if ((!target.hasAttribute('data-ip-back') && (!ip || ip.url || ip.key !== catalogIp)) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.hasAttribute('download') || (target.target && target.target !== '_self')) return;
        event.preventDefault();
        navigateBox(cloneFilters(), true, true, ip);
        return;
      }

      if (boxMode && target.matches('[data-box-series][data-box-wave], [data-box-back]')) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.hasAttribute('download') || (target.target && target.target !== '_self')) return;
        event.preventDefault();
        navigateBox(target.hasAttribute('data-box-back') ? { ...DEFAULT_FILTERS, characterGroup: state.applied.characterGroup } : {
          series: target.dataset.boxSeries, wave: target.dataset.boxWave, rarity: 'all', character: target.dataset.boxCharacter || state.applied.character, characterGroup: state.applied.characterGroup,
        }, true, true);
        return;
      }

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
        renderAppliedFilters(true);
        recordRenderTime('lastApplyRenderMs', startedAt);
        closeDrawer();
        return;
      }

      if (target.matches('[data-mobile-filter-clear]')) {
        const search = drawer.querySelector('[data-character-search]');
        if (search) search.value = '';
        state.draft = resetFilters();
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
        state.applied = changeFilter(state.applied, removeKind, 'all');
        state.draft = cloneFilters(state.applied);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters(true);
        return;
      }

      const kind = target.dataset.filterKind;
      let value = target.dataset.filterValue;
      if (!kind || !value || target.disabled) return;
      const filters = target.closest('[data-mobile-filter-drawer]') ? state.draft : state.applied;
      if (value !== 'all' && filters[kind] === value) value = 'all';
      if (target.closest('[data-mobile-filter-drawer]')) {
        const startedAt = performance.now();
        state.draft = changeFilter(state.draft, kind, value);
        renderDraftFilters();
        recordRenderTime('lastDraftRenderMs', startedAt);
        focusFacetOption(drawer, kind, value);
        return;
      } else {
        state.applied = changeFilter(state.applied, kind, value);
        state.draft = cloneFilters(state.applied);
        state.visibleLimit = initialLimit(window.innerWidth);
        renderAppliedFilters(true);
        focusFacetOption(root.querySelector('[data-desktop-filters]'), kind, value);
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
      if (nextDesktopMode && !desktopMode) {
        renderFacetSet('desktop', state.applied);
        renderDesktopFacetSummaries(state.applied);
      }
      if (nextDesktopMode && drawer && !drawer.hidden) closeDrawer({ cancel: true });
      if (!nextDesktopMode && desktopMap?.open) setCharacterMapOpen('desktop', false);
      desktopMode = nextDesktopMode;
      syncDesktopSidebarOffset();
    }

    function onPageShow(event) {
      if (!event.persisted) return;
      renderSpotlight('return');
      syncDesktopSidebarOffset();
    }

    desktopMap?.addEventListener('cancel', onMapCancel);
    root.addEventListener('click', onRootClick);
    root.addEventListener('input', onRootInput);
    root.addEventListener('change', onRootChange);
    document.addEventListener('keydown', onDocumentKeydown);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('pageshow', onPageShow);
    if (boxMode) window.addEventListener('popstate', onPopState);
    if ('ResizeObserver' in window) {
      headerResizeObserver = new ResizeObserver(syncDesktopSidebarOffset);
      document.querySelectorAll('sticky-header, sticky-header-mobile')
        .forEach((header) => headerResizeObserver.observe(header));
    }
    if (ipMode) renderIpHome();
    root.querySelectorAll('[data-box-landing-link]').forEach(link => {
      const page = boxPages.find(page => !page.aliasOf && page.url === link.getAttribute('href'));
      const box = page && findCatalogBox(boxes, { series: page.seriesKey, wave: page.waveKey });
      if (box) link.href = catalogIpUrl(window.location.href, catalogIp, box, 'all', { directoryUrl, boxPage: page });
    });
    if (boxMode) renderBoxDirectory();
    renderShelves();
    renderAppliedFilters();
    onResize();
    motionCleanup = initMotion(root);

    return {
      destroy() {
        if (desktopMap?.open) setCharacterMapOpen('desktop', false);
        desktopMap?.removeEventListener('cancel', onMapCancel);
        if (drawer && !drawer.hidden) closeDrawer({ cancel: true });
        headerResizeObserver?.disconnect();
        motionCleanup();
        root.removeEventListener('click', onRootClick);
        root.removeEventListener('input', onRootInput);
        root.removeEventListener('change', onRootChange);
        document.removeEventListener('keydown', onDocumentKeydown);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pageshow', onPageShow);
        if (boxMode) window.removeEventListener('popstate', onPopState);
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
      }).catch((error) => {
        payloadCache.delete(url);
        throw error;
      }));
    }
    return payloadCache.get(url);
  }

  function catalogProductTags(product) {
    return new Map((Array.isArray(product?.tags) ? product.tags : [])
      .map((tag) => [normalizeKey(tag), String(tag).trim()]));
  }

  function catalogSeriesFromTags(tags) {
    const definitions = [
      ['pr', ['pr-card', 'pr-edition', 'pr-activity-card', 'promo-card']],
      ['tcg', ['kayou-mlp-tcg', 'tcg']],
      ['fun-moments', ['fun-moments-edition', 'fun-moments']],
      ['rainbow', ['rainbow-edition', 'rainbow']],
      ['moon', ['moon-edition', 'moon']],
      ['star', ['star-edition', 'star']],
      ['spring-festival', ['spring-festival']],
    ];
    return definitions.find(([, keys]) => keys.some((key) => tags.has(key)))?.[0] || 'kayou-mlp';
  }

  function catalogRarityFromTags(tags) {
    const rarityKey = RARITY_ORDER.find((key) => (
      tags.has(key)
      || tags.has(`hidden-diamond-${key}`)
      || tags.has(`hidden-${key}`)
    ));
    return rarityKey || 'card';
  }

  function catalogWaveFromTags(tags) {
    const wave = Array.from(tags.values()).find((tag) => (
      /^(?:T[2-5]W\d+|BP\d+|SD\d+[A-F]?|TR\d+[A-F]?)$/i.test(tag)
    ));
    return wave || '';
  }

  function collectionProductToGroup(product) {
    const tags = catalogProductTags(product);
    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const primaryVariant = variants[0] || {};
    const image = (Array.isArray(product?.images) ? product.images[0] : null)
      || variants.find((variant) => variant?.featured_image)?.featured_image
      || null;
    const prices = variants
      .map((variant) => Number(variant?.price))
      .filter(Number.isFinite);
    const price = prices.length ? `$${Math.min(...prices).toFixed(2)}` : '';
    const seriesKey = catalogSeriesFromTags(tags);
    const rarityKey = catalogRarityFromTags(tags);
    const wave = catalogWaveFromTags(tags);
    const variantCode = String(primaryVariant.sku || primaryVariant.title || '').trim();
    const code = variantCode && variantCode.toLowerCase() !== 'default title'
      ? variantCode
      : String(product?.title || 'View card');

    return {
      id: String(product?.id || product?.handle || ''),
      productGid: product?.id ? `gid://shopify/Product/${product.id}` : '',
      productHandle: String(product?.handle || ''),
      status: 'ACTIVE',
      previewOnly: false,
      title: String(product?.title || code),
      productTitle: String(product?.title || code),
      shortLabel: code,
      edition: labelForFacet('series', seriesKey),
      editionKey: seriesKey,
      series: labelForFacet('series', seriesKey),
      seriesKey,
      wave,
      waveKey: normalizeKey(wave),
      rarity: cleanRarityLabel(tags.get(rarityKey) || rarityKey),
      rarityKey,
      code,
      variantCount: variants.length,
      price,
      createdAt: Math.floor(Date.parse(product?.created_at || '') / 1000) || 0,
      publishedAt: Math.floor(Date.parse(product?.published_at || '') / 1000) || 0,
      publishedOnOnlineStore: true,
      available: variants.some((variant) => variant?.available),
      inventoryQuantity: null,
      link: `/products/${product?.handle || ''}`,
      image: String(image?.src || ''),
      imageAlt: String(image?.alt || product?.title || code),
    };
  }

  function isBundleVariant(variant) {
    const bundle = /\bbundle\b|\b(?:full|complete)\s+set\b/i;
    if (bundle.test(variant?.title || '')) return true;
    if (/^[◇◆※]?[A-Z]{1,6}\d*-(?:[◇◆※]?[A-Z0-9]+-)?\d{2,4}/i.test(variant?.title || '')) return false;
    return bundle.test(variant?.sku || '');
  }

  function catalogImageKey(image) {
    return String(image?.src || image || '').split('?')[0];
  }

  function bundleImageCode(product, image, group) {
    const key = catalogImageKey(image);
    const featured = product.variants.find((variant) => catalogImageKey(variant.featured_image) === key)?.featured_image;
    const alt = image.alt || featured?.alt || (catalogImageKey(group.image) === key ? group.imageAlt : '');
    const pattern = /^[◇◆※]?[A-Z]{1,6}\d*-(?:[◇◆※]?[A-Z0-9]+-)?\d{2,4}(?:L\d)?/i;
    const fromAlt = String(alt || '').match(pattern)?.[0];
    if (fromAlt) return fromAlt;
    const filename = decodeURIComponent(key.split('/').pop() || '');
    const fromFilename = filename.match(pattern)?.[0];
    return fromFilename && String(product.body_html || '').includes(fromFilename) ? fromFilename : '';
  }

  function expandCatalogCards(groups, products, referenceCards = [], currency = 'USD', imageMappings = {}, characterData = {}) {
    registerCatalogCharacters(characterData.characters);
    const productMap = new Map(products.map((product) => [product.handle, product]));
    const references = new Map(referenceCards.map((card) => [String(card.variantId), card]));
    let money;
    try { money = new Intl.NumberFormat('en-US', { style: 'currency', currency }); }
    catch (error) { money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }); }
    return groups.flatMap((group) => {
      const product = productMap.get(group.productHandle || productHandleFromLink(group.link));
      if (!product) return [];
      const variants = Array.isArray(product.variants) ? product.variants : [];
      const images = Array.isArray(product.images) ? product.images : [];
      const bundles = variants.filter(isBundleVariant);
      const singles = variants.filter((variant) => !isBundleVariant(variant));
      const usedImages = new Set();
      const usedCodes = new Set();
      const productLink = `/products/${product.handle}`;
      const cards = singles.map((variant) => {
        const reference = references.get(String(variant.id));
        const code = String((isBundleVariant({ sku: variant.sku }) ? '' : variant.sku) || (variant.title !== 'Default Title' ? variant.title : '') || product.title);
        const mapping = imageMappings[product.handle]?.[String(variant.id)];
        const image = variant.featured_image
          || images.find((item) => item.variant_ids?.some((id) => String(id) === String(variant.id)))
          || images.find((item) => mapping?.code === code && String(item.id) === String(mapping.imageId))
          || images.find((item) => productHandleFromLink(reference?.link) === product.handle && catalogImageKey(item) === catalogImageKey(reference?.image))
          || images.find((item) => bundleImageCode(product, item, group) === code)
          || (singles.length === 1 && images.length === 1 ? images[0] : null);
        if (image) usedImages.add(catalogImageKey(image));
        usedCodes.add(code);
        const price = Number(variant.price);
        return {
          ...group, id: `variant-${variant.id}`, variantId: String(variant.id),
          productHandle: product.handle, code, title: product.title,
          characterKeys: identifyCardCharacters({ variant, image, reference, product }, characterData),
          purchaseMode: 'single', available: variant.available === true,
          price: variant.price != null && variant.price !== '' && Number.isFinite(price) ? money.format(price) : '',
          link: `${productLink}?variant=${encodeURIComponent(variant.id)}`,
          image: image?.src || '', imageAlt: image?.alt || `${code} — ${product.title}`,
        };
      });
      if (!bundles.length) return cards;
      const gallery = images.length ? images : [{ src: group.image, alt: group.imageAlt }];
      gallery.forEach((image, index) => {
        const key = catalogImageKey(image);
        const code = bundleImageCode(product, image, group);
        if (usedImages.has(key) || (code && usedCodes.has(code))) return;
        if (singles.length && !code && bundles.some((variant) => catalogImageKey(variant.featured_image) === key)) return;
        usedImages.add(key);
        if (code) usedCodes.add(code);
        const bundle = bundles.length === 1 ? bundles[0] : bundles.find((variant) => image.variant_ids?.includes(variant.id));
        const label = code || `${group.rarity || 'Card'} · Image ${String(index + 1).padStart(2, '0')}`;
        cards.push({
          ...group, id: `bundle-image-${product.id}-${image.id || index}`, variantId: bundle ? String(bundle.id) : '',
          productHandle: product.handle, code: label, title: bundle?.title || 'View available bundles',
          characterKeys: identifyCardCharacters({ image, product }, characterData),
          purchaseMode: 'bundle', available: bundle ? bundle.available === true : bundles.some((variant) => variant.available),
          price: '', link: bundle ? `${productLink}?variant=${encodeURIComponent(bundle.id)}` : productLink,
          image: image.src || '', imageAlt: image.alt || `${label} — ${product.title}; sold as a full bundle`,
        });
      });
      return cards;
    });
  }

  async function loadCollectionProducts(url) {
    const products = [];
    const productHandles = new Set();
    const pageSize = 250;
    for (let page = 1; page <= 50; page += 1) {
      const pageUrl = new URL(url, window.location.origin);
      pageUrl.searchParams.set('limit', String(pageSize));
      pageUrl.searchParams.set('page', String(page));
      const payload = await loadPayload(pageUrl.toString());
      if (!Array.isArray(payload?.products)) {
        throw new Error(`Catalog collection page ${page} has an invalid response`);
      }
      const batch = payload.products;
      batch.forEach((product) => {
        const handle = String(product?.handle || '');
        if (!handle) throw new Error(`Catalog collection page ${page} contains a product without a handle`);
        if (productHandles.has(handle)) throw new Error(`Catalog collection returned duplicate product ${handle}`);
        productHandles.add(handle);
        products.push(product);
      });
      if (batch.length < pageSize) {
        if (!products.length) throw new Error('Catalog collection contains no products');
        return products;
      }
    }
    throw new Error('Catalog collection pagination exceeded the safety limit');
  }

  function reconcileCatalogPayload(payload, products) {
    const collectionProducts = new Map(products.map((product) => [product?.handle, product]));
    const collectionHandles = new Set(collectionProducts.keys());
    const groups = (Array.isArray(payload?.groups) ? payload.groups : [])
      .filter((group) => collectionHandles.has(group.productHandle || productHandleFromLink(group.link)))
      .map((group) => {
        const productHandle = group.productHandle || productHandleFromLink(group.link);
        return {
          ...group,
          productHandle,
          status: 'ACTIVE',
          previewOnly: false,
          publishedOnOnlineStore: true,
          link: productHandleFromLink(group.link) === productHandle
            ? group.link
            : `/products/${productHandle}`,
        };
      });
    const groupedHandles = new Set(groups
      .map((group) => group.productHandle || productHandleFromLink(group.link))
      .filter(Boolean));
    products.forEach((product) => {
      if (!groupedHandles.has(product?.handle)) groups.push(collectionProductToGroup(product));
    });
    return {
      ...payload,
      groups,
      diagnostics: {
        ...(payload?.diagnostics || {}),
        collectionProductCount: products.length,
        collectionBackfillCount: products.filter((product) => !groupedHandles.has(product?.handle)).length,
      },
    };
  }

  function showFallback(root, error) {
    const grid = root.querySelector('[data-catalog-grid]');
    const template = root.querySelector('[data-liquid-fallback]');
    const boxMode = root.hasAttribute('data-box-browser') || root.hasAttribute('data-ip-browser');
    if (boxMode) {
      if (grid) grid.replaceChildren();
      const detail = root.querySelector('[data-box-detail]');
      if (detail) detail.hidden = true;
    } else if (grid && template?.content) grid.replaceChildren(template.content.cloneNode(true));
    const status = root.querySelector('[data-catalog-status]');
    if (status) {
      status.hidden = false;
      status.textContent = boxMode
        ? 'The BOX catalog could not load. Please refresh the page to try again.'
        : 'The card catalog could not load. Please refresh the page or browse all single cards.';
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
    const loadToken = {};
    root.__p10CatalogLoad = loadToken;
    root.dataset.catalogInitialized = 'true';
    root.dataset.catalogReady = 'false';
    root.setAttribute('aria-busy', 'true');
    repairLegacyPrRoute(root);
    const status = root.querySelector('[data-catalog-status]');
    try {
      const url = root.dataset.catalogDataUrl;
      const collectionUrl = root.dataset.catalogCollectionUrl;
      if (!url) throw new Error('Catalog data URL is missing');
      if (!collectionUrl) throw new Error('Catalog collection URL is missing');
      const ipMode = root.hasAttribute('data-ip-browser');
      const boxMode = ipMode || root.hasAttribute('data-box-browser');
      const [enrichment, collectionProducts, boxData] = await Promise.all([
        loadPayload(url)
          .then((payload) => ({ payload, error: null }))
          .catch((error) => ({ payload: { groups: [], shelves: {}, spotlightCards: [] }, error })),
        loadCollectionProducts(collectionUrl),
        boxMode && root.dataset.boxDataUrl
          ? loadPayload(root.dataset.boxDataUrl)
          : Promise.resolve({ boxes: [] }),
      ]);
      if (root.__p10CatalogLoad !== loadToken || !root.isConnected) return;
      if (boxMode && enrichment.error) throw enrichment.error;
      if (enrichment.error) root.dataset.catalogEnrichmentError = String(enrichment.error.message || 'load-failed');
      else delete root.dataset.catalogEnrichmentError;
      const payload = reconcileCatalogPayload(enrichment.payload, collectionProducts);
      if (!Array.isArray(payload?.groups)) throw new Error('Catalog groups are missing');
      if (boxMode) {
        if (!Array.isArray(enrichment.payload?.groups) || !enrichment.payload.groups.length) throw new Error('BOX catalog groups are missing');
        payload.boxes = Array.isArray(boxData?.boxes) ? boxData.boxes : [];
        payload.boxPages = Array.isArray(boxData?.boxPages) ? boxData.boxPages : [];
        payload.boxPagesEnabled = boxData?.boxPagesEnabled === true;
        payload.specialCardSources = Array.isArray(boxData?.specialCardSources) ? boxData.specialCardSources : [];
        payload.characterGroups = Array.isArray(boxData?.characterGroups) ? boxData.characterGroups : [];
        payload.characterSearchAliases = boxData?.characterSearchAliases || {};
        payload.characterMapRegions = Array.isArray(boxData?.characterMapRegions) ? boxData.characterMapRegions : [];
        payload.groups = applyBoxProductOverrides(payload.groups, boxData?.products || {});
        payload.groups = expandCatalogCards(payload.groups, collectionProducts, payload.spotlightCards, window.Shopify?.currency?.active || 'USD', boxData?.cardImages || {}, boxData?.cardCharacters || {});
        payload.groups = applyCardIdentities(payload.groups, boxData?.cardIdentities || {});
        if (ipMode) {
          payload.catalogIp = normalizeKey(boxData?.catalogIp);
          payload.ips = Array.isArray(boxData?.ips) ? boxData.ips : [];
          payload.recommendedCards = recommendedCards(payload.spotlightCards, collectionProducts, 8, window.Shopify?.currency?.active || 'USD');
        }
      }
      const expectedCollectionCount = Number(root.dataset.catalogSourceCount || 0);
      if (expectedCollectionCount > 0 && collectionProducts.length !== expectedCollectionCount) {
        throw new Error(`Catalog collection expected ${expectedCollectionCount} products but returned ${collectionProducts.length}`);
      }
      root.dataset.catalogCollectionProductCount = String(collectionProducts.length);
      root.dataset.catalogCollectionBackfillCount = String(payload.diagnostics.collectionBackfillCount);
      root.__p10CatalogController?.destroy?.();
      root.__p10CatalogController = createCatalogController(root, payload);
      delete root.dataset.catalogError;
      if (status) status.hidden = true;
    } catch (error) {
      if (root.__p10CatalogLoad === loadToken) {
        delete root.dataset.catalogInitialized;
        showFallback(root, error);
      }
    } finally {
      if (root.__p10CatalogLoad === loadToken) {
        root.setAttribute('aria-busy', 'false');
        root.dataset.catalogReady = 'true';
      }
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
    MLP_CHARACTERS,
    identifyCardCharacters,
    characterKey,
    characterMatches,
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
    buildCatalogBoxes,
    groupSpecialCardBoxes,
    findCatalogBox,
    boxRarities,
    boxFilters,
    catalogPagePath,
    catalogBoxPages,
    catalogBoxPageForDestination,
    catalogBoxUrl,
    catalogIps,
    catalogIpUrl,
    resolveCatalogRoute,
    recommendedCards,
    applyBoxProductOverrides,
    initialLimit,
    nextLimit,
    createState,
    collectionProductToGroup,
    expandCatalogCards,
    applyCardIdentities,
    aggregateCharacterCards,
    registerCatalogCharacters,
    isBundleVariant,
    reconcileCatalogPayload,
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
    document.addEventListener('shopify:section:unload', (event) => {
      const roots = event.target.matches?.('[data-single-card-catalog]')
        ? [event.target]
        : event.target.querySelectorAll('[data-single-card-catalog]');
      roots.forEach((root) => {
        delete root.__p10CatalogLoad;
        root.__p10CatalogController?.destroy?.();
        delete root.__p10CatalogController;
        delete root.dataset.catalogInitialized;
      });
    });
  }
})();
