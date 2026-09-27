(function () {
  var root = document.querySelector("[data-p10-mobile-shop-nav]");

  if (!root) {
    return;
  }

  var drawer = root.querySelector(".p10-mobile-shop-nav__drawer") || document.querySelector("#P10MobileShopDrawer");
  var overlay = root.querySelector(".p10-mobile-shop-nav__overlay") || document.querySelector(".p10-mobile-shop-nav__overlay");
  var openButtons = Array.prototype.slice.call(root.querySelectorAll("[data-p10-mobile-shop-open]"));
  var closeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-p10-mobile-shop-close]"));
  if (drawer) {
    closeButtons = closeButtons.concat(Array.prototype.slice.call(drawer.querySelectorAll("[data-p10-mobile-shop-close]")));
  }
  if (overlay && closeButtons.indexOf(overlay) === -1) {
    closeButtons.push(overlay);
  }
  var hamburger = document.querySelector("[data-mobile-menu]");
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileQuery = window.matchMedia && window.matchMedia("(max-width: 1024px)");
  var lastTrigger = null;
  var openGuardTimer = null;
  var closeTimer = null;
  var railSearch = root.querySelector("#P10MobileShopSearch");
  var drawerSearch = drawer && drawer.querySelector("#P10MobileDrawerSearch");
  var quickSuggestionsRoot = root.querySelector("[data-p10-mobile-quick-suggestions]");
  var quickSuggestionsTitle = quickSuggestionsRoot && quickSuggestionsRoot.querySelector("[data-p10-mobile-quick-suggestions-title]");
  var quickSuggestionsList = quickSuggestionsRoot && quickSuggestionsRoot.querySelector("[data-p10-mobile-quick-suggestions-list]");
  var suggestionsRoot = drawer && drawer.querySelector("[data-p10-mobile-suggestions]");
  var suggestionsTitle = suggestionsRoot && suggestionsRoot.querySelector("[data-p10-mobile-suggestions-title]");
  var suggestionsList = suggestionsRoot && suggestionsRoot.querySelector("[data-p10-mobile-suggestions-list]");
  var suggestionCache = {};
  var suggestionTimers = {};
  var activeSuggestionQueries = {};
  var resolvedSuggestionIntents = {};
  var catalogBaseUrl = root.getAttribute("data-p10-database-url") || "/pages/kayou-mlp-card-catalog";
  var pathUrls = {
    ip: root.getAttribute("data-p10-shop-by-ip-url") || "/collections",
    type: root.getAttribute("data-p10-shop-by-type-url") || "/collections/group-shop-by-type",
    featured: root.getAttribute("data-p10-featured-url") || "/collections/group-featured",
    sealed: root.getAttribute("data-p10-sealed-url") || "/collections/type-sealed-cards",
    single: root.getAttribute("data-p10-single-card-url") || "/pages/kayou-mlp-card-catalog",
    goodies: root.getAttribute("data-p10-goodies-url") || "/collections/type-merchandise",
    accessories: root.getAttribute("data-p10-accessories-url") || "/collections/type-card-accessories",
    newArrivals: root.getAttribute("data-p10-new-url") || "/collections/featured-new-arrivals",
    buyerFavorites: root.getAttribute("data-p10-buyer-url") || "/collections/buyer-favorites",
    trending: root.getAttribute("data-p10-trending-url") || "/collections/featured-trending-now",
    guestPicks: root.getAttribute("data-p10-guest-url") || "/collections/featured-guest-picks",
    database: catalogBaseUrl,
    catalog: catalogBaseUrl + "?view=single-cards-v6",
    mlp: root.getAttribute("data-p10-mlp-url") || "/pages/my-little-pony",
    transformers: root.getAttribute("data-p10-transformers-url") || "/collections/ip-transformers",
    naruto: root.getAttribute("data-p10-naruto-url") || "/pages/naruto",
    inuyasha: root.getAttribute("data-p10-inuyasha-url") || "/collections/ip-inuyasha",
    arknights: root.getAttribute("data-p10-arknights-url") || "/pages/arknights",
    harryPotter: root.getAttribute("data-p10-harry-potter-url") || "/pages/harry-potter",
    powerpuff: root.getAttribute("data-p10-powerpuff-url") || "/pages/the-powerpuff-girls",
    persona: root.getAttribute("data-p10-persona-url") || "/collections/ip-persona-5-royal",
    miku: root.getAttribute("data-p10-miku-url") || "/collections/ip-hatsune-miku",
    disney: root.getAttribute("data-p10-disney-url") || "/collections/ip-disney"
  };

  function syncIpCards() {
    var source = document.querySelector("[data-p10-ip-card-source]");
    var target = drawer && drawer.querySelector("[data-p10-mobile-ip-list]");

    if (!source || !target) {
      return;
    }

    target.textContent = "";
    Array.prototype.forEach.call(source.querySelectorAll(".p10-ip-mega__card"), function (sourceCard) {
      if (sourceCard.getAttribute("data-p10-ip-desktop-only") === "true") return;
      var card = sourceCard.cloneNode(true);
      var media = card.querySelector(".p10-ip-mega__media");
      var image = card.querySelector(".p10-ip-mega__image");
      var fallback = card.querySelector(".p10-ip-mega__fallback");
      var name = card.querySelector(".p10-ip-mega__name");

      card.className = "p10-mobile-shop-nav__ip-card";
      card.removeAttribute("role");
      card.removeAttribute("data-shopify-editor-block");
      if (media) media.className = "p10-mobile-shop-nav__ip-media";
      if (image) image.className = "p10-mobile-shop-nav__ip-image";
      if (fallback) fallback.className = "p10-mobile-shop-nav__ip-fallback";
      if (name) name.className = "p10-mobile-shop-nav__ip-name";
      target.appendChild(card);
    });
  }

  syncIpCards();
  document.addEventListener("shopify:section:load", syncIpCards);
  document.addEventListener("p10:ip-menu-updated", syncIpCards);
  var searchIntents = [
    {
      id: "shop-by-ip",
      title: "Shop by IP",
      eyebrow: "Best product path",
      mark: "IP",
      text: "Start with the IP area, then choose one of the ten active V6 IP collections.",
      url: pathUrls.ip,
      action: "Open Shop by IP",
      productQuery: "KAYOU cards",
      aliases: ["ip", "shop by ip", "brand", "series hub", "mlp naruto", "anime cards", "kayou cards"],
      completions: [
        { label: "My Little Pony", url: pathUrls.mlp },
        { label: "Transformers", url: pathUrls.transformers },
        { label: "Naruto", url: pathUrls.naruto },
        { label: "Inuyasha", url: pathUrls.inuyasha },
        { label: "Arknights", url: pathUrls.arknights },
        { label: "Harry Potter", url: pathUrls.harryPotter },
        { label: "The Powerpuff Girls", url: pathUrls.powerpuff },
        { label: "Persona 5 Royal", url: pathUrls.persona },
        { label: "Hatsune Miku", url: pathUrls.miku },
        { label: "Disney", url: pathUrls.disney }
      ]
    },
    {
      id: "shop-by-type",
      title: "Shop by Type",
      eyebrow: "Best product path",
      mark: "TYPE",
      text: "Browse sealed cards, single cards, merchandise, or card accessories.",
      url: pathUrls.type,
      action: "Open Shop by Type",
      productQuery: "cards merchandise accessories",
      aliases: ["type", "shop by type", "category", "categories", "product type"],
      completions: [
        { label: "Sealed Cards", url: pathUrls.sealed },
        { label: "Single Cards", url: pathUrls.single },
        { label: "Merchandise", url: pathUrls.goodies },
        { label: "Card Accessories", url: pathUrls.accessories }
      ]
    },
    {
      id: "featured",
      title: "Featured",
      eyebrow: "Store highlights",
      mark: "EDIT",
      text: "Browse the active V6 editorial and merchandising collections.",
      url: pathUrls.featured,
      action: "Open Featured",
      productQuery: "new popular trending guest picks",
      aliases: ["featured", "new arrivals", "favorites", "trending", "guest picks"],
      completions: [
        { label: "New Arrivals", url: pathUrls.newArrivals },
        { label: "Buyer Favorites", url: pathUrls.buyerFavorites },
        { label: "Trending Now", url: pathUrls.trending },
        { label: "Guest Picks", url: pathUrls.guestPicks }
      ]
    },
    {
      id: "sealed",
      title: "Sealed boxes",
      eyebrow: "Best product path",
      mark: "BOX",
      text: "Display boxes, booster boxes, sealed packs, and current KAYOU card products.",
      url: pathUrls.sealed,
      action: "Open sealed boxes",
      productQuery: "sealed box",
      aliases: ["seal", "sealed", "sealed box", "sealed boxes", "display", "display box", "booster", "booster box", "pack", "packs", "box", "boxes"],
      completions: [
        { label: "Sealed boxes", url: pathUrls.sealed },
        { label: "Display boxes", url: pathUrls.sealed },
        { label: "Booster boxes", url: pathUrls.sealed }
      ]
    },
    {
      id: "single",
      title: "Single cards",
      eyebrow: "Priced listings",
      mark: "CARD",
      text: "Individual card listings with photos, item details, and collector notes.",
      url: pathUrls.single,
      action: "Open single cards",
      productQuery: "single card",
      aliases: ["single", "single card", "single cards", "singles", "card listing", "priced card"],
      completions: [
        { label: "Single cards", url: pathUrls.single },
        { label: "PR / event cards", url: "/search?type=product&options%5Bprefix%5D=last&q=PR%20card" },
        { label: "Card database", url: pathUrls.database }
      ]
    },
    {
      id: "goodies",
      title: "Goodies",
      eyebrow: "Plush and merch",
      mark: "GO",
      text: "Plush, charms, display goods, blind boxes, and giftable collector pieces.",
      url: pathUrls.goodies,
      action: "Open goodies",
      productQuery: "plush merch",
      aliases: ["good", "goodies", "merch", "plush", "figure", "figures", "blind box", "charm", "charms", "gift", "goods"],
      completions: [
        { label: "Goodies", url: pathUrls.goodies },
        { label: "Plush", url: "/search?type=product&options%5Bprefix%5D=last&q=plush" },
        { label: "Blind box figures", url: pathUrls.goodies }
      ]
    },
    {
      id: "database",
      title: "TCG database",
      eyebrow: "Card guides",
      mark: "TCG",
      text: "MLP card guide pages, TCG references, and collector research paths.",
      url: pathUrls.database,
      action: "Open TCG database",
      productQuery: "tcg card",
      aliases: ["tcg", "database", "guide", "guides", "card guide", "card database", "reference"],
      completions: [
        { label: "TCG database", url: pathUrls.database },
        { label: "MLP guides", url: pathUrls.database },
        { label: "Card products", url: pathUrls.sealed }
      ]
    }
  ];
  var productPathRules = [
    {
      id: "mlp",
      title: "My Little Pony cards",
      eyebrow: "Matched product path",
      mark: "MLP",
      text: "Current KAYOU MLP releases, card boxes, singles, and collector goods.",
      url: pathUrls.mlp,
      action: "Open MLP cards",
      productQuery: "my little pony cards",
      priority: 30,
      keywords: ["my little pony", "mlp", "pony", "fun moments", "rainbow", "moon", "star", "spring festival", "pr card", "event card", "friendship journal", "friendship voyage", "kayou mlp"],
      completionLabel: "Choose an MLP series",
      completionMode: "series",
      completions: [
        { code: "T2", label: "Fun Moments", url: pathUrls.catalog + "&series=fun-moments" },
        { code: "T3", label: "Rainbow", url: pathUrls.catalog + "&series=rainbow" },
        { code: "T4", label: "Moon", url: pathUrls.catalog + "&series=moon" },
        { code: "T5", label: "Star", url: pathUrls.catalog + "&series=star" },
        { code: "TCG", label: "TCG", url: pathUrls.catalog + "&series=tcg" },
        { code: "PR", label: "PR", url: pathUrls.catalog + "&series=pr" },
        { code: "SP", label: "Spring Festival", url: pathUrls.catalog + "&series=spring-festival" },
        { code: "K", label: "KAYOU MLP", url: pathUrls.catalog + "&series=kayou-mlp" },
        { code: "ALL", label: "All single cards", url: pathUrls.single }
      ]
    },
    {
      id: "naruto",
      title: "Naruto cards",
      eyebrow: "Matched product path",
      mark: "NAR",
      text: "Available KAYOU Naruto card products and anime collector listings.",
      url: pathUrls.naruto,
      action: "Open Naruto cards",
      productQuery: "naruto",
      priority: 30,
      keywords: ["naruto", "ninja", "array chapter", "kayou naruto"],
      completions: [
        { label: "Naruto card boxes", url: pathUrls.naruto },
        { label: "Sealed card products", url: pathUrls.sealed },
        { label: "Anime collector listings", url: pathUrls.naruto }
      ]
    },
    {
      id: "harry-potter",
      title: "Harry Potter cards",
      eyebrow: "Matched product path",
      mark: "HP",
      text: "Available Harry Potter card boxes, sealed products, and collector listings.",
      url: pathUrls.harryPotter,
      action: "Open Harry Potter cards",
      productQuery: "harry potter",
      priority: 30,
      keywords: ["harry potter", "wizarding", "eternal", "departure", "hogwarts"],
      completions: [
        { label: "Harry Potter cards", url: pathUrls.harryPotter },
        { label: "Sealed boxes", url: pathUrls.sealed },
        { label: "Collector listings", url: pathUrls.harryPotter }
      ]
    },
    {
      id: "powerpuff",
      title: "Powerpuff Girls cards",
      eyebrow: "Matched product path",
      mark: "PPG",
      text: "Available Powerpuff Girls card products and cute collector goods.",
      url: pathUrls.powerpuff,
      action: "Open Powerpuff Girls",
      productQuery: "powerpuff",
      priority: 30,
      keywords: ["powerpuff", "powerpuff girls", "candy edition", "starlight edition"],
      completions: [
        { label: "Powerpuff cards", url: pathUrls.powerpuff },
        { label: "Giftable goods", url: pathUrls.goodies },
        { label: "Sealed products", url: pathUrls.sealed }
      ]
    },
    {
      id: "inuyasha",
      title: "Inuyasha collectibles",
      eyebrow: "Matched product path",
      mark: "INU",
      text: "Available Inuyasha CCG products, blind boxes, and classic anime collectibles.",
      url: pathUrls.inuyasha,
      action: "Open Inuyasha",
      productQuery: "inuyasha",
      priority: 30,
      keywords: ["inuyasha", "inu yasha", "ccg booster", "blind box", "classic anime"],
      completions: [
        { label: "Inuyasha collectibles", url: pathUrls.inuyasha },
        { label: "CCG products", url: pathUrls.sealed },
        { label: "Blind box goods", url: pathUrls.goodies }
      ]
    },
    {
      id: "sealed",
      title: "Sealed boxes",
      eyebrow: "Available product path",
      mark: "BOX",
      text: "Available display boxes, booster boxes, sealed packs, and KAYOU card products.",
      url: pathUrls.sealed,
      action: "Open sealed boxes",
      productQuery: "sealed box",
      priority: 10,
      keywords: ["sealed product", "sealed", "display box", "booster box", "box", "boxes", "pack", "packs"],
      completions: [
        { label: "All sealed boxes", url: pathUrls.sealed },
        { label: "Display boxes", url: pathUrls.sealed },
        { label: "Booster boxes", url: pathUrls.sealed }
      ]
    },
    {
      id: "single",
      title: "Single cards",
      eyebrow: "Available product path",
      mark: "CARD",
      text: "Available single-card listings with photos, item details, and collector notes.",
      url: pathUrls.single,
      action: "Open single cards",
      productQuery: "single card",
      priority: 10,
      keywords: ["single card", "single cards", "singles", "card listing", "priced card"],
      completions: [
        { label: "Single cards", url: pathUrls.single },
        { label: "PR / event cards", url: "/search?type=product&options%5Bprefix%5D=last&q=PR%20card" },
        { label: "Card database", url: pathUrls.database }
      ]
    },
    {
      id: "goodies",
      title: "Goodies",
      eyebrow: "Available product path",
      mark: "GO",
      text: "Available plush, charms, display goods, blind boxes, and giftable collector pieces.",
      url: pathUrls.goodies,
      action: "Open goodies",
      productQuery: "plush merch",
      priority: 10,
      keywords: ["goodies", "merch", "plush", "figure", "figures", "blind box", "charm", "charms", "gift", "goods", "display goods"],
      completions: [
        { label: "Goodies", url: pathUrls.goodies },
        { label: "Plush", url: "/search?type=product&options%5Bprefix%5D=last&q=plush" },
        { label: "Blind box figures", url: pathUrls.goodies }
      ]
    },
    {
      id: "english-cards",
      title: "English cards",
      eyebrow: "Matched product path",
      mark: "EN",
      text: "Available English card products and collector listings.",
      url: pathUrls.sealed,
      action: "Open English cards",
      productQuery: "english cards",
      priority: 16,
      keywords: ["english card", "english cards", "english edition", "en cards"]
    },
    {
      id: "chinese-cards",
      title: "Chinese cards",
      eyebrow: "Matched product path",
      mark: "CN",
      text: "Available Chinese card boxes and KAYOU collector products.",
      url: pathUrls.sealed,
      action: "Open Chinese cards",
      productQuery: "chinese cards",
      priority: 16,
      keywords: ["chinese card", "chinese cards", "chinese edition", "cn cards", "kayou"]
    },
    {
      id: "tcg-cards",
      title: "TCG cards",
      eyebrow: "Matched product path",
      mark: "TCG",
      text: "Available playable TCG card products and battle-card paths.",
      url: pathUrls.sealed,
      action: "Open TCG cards",
      productQuery: "tcg card",
      priority: 16,
      keywords: ["tcg", "tcg cards", "trading card game", "starter deck", "battle card", "playable"]
    },
    {
      id: "ccg-cards",
      title: "CCG cards",
      eyebrow: "Matched product path",
      mark: "CCG",
      text: "Available CCG card products and collectible-card-game boxes.",
      url: pathUrls.sealed,
      action: "Open CCG cards",
      productQuery: "ccg card",
      priority: 16,
      keywords: ["ccg", "ccg cards", "collectible card game", "ccg booster"]
    }
  ];

  if (overlay && overlay.parentNode !== document.body) {
    document.body.appendChild(overlay);
  }

  if (drawer && drawer.parentNode !== document.body) {
    document.body.appendChild(drawer);
  }

  function isMobile() {
    return !mobileQuery || mobileQuery.matches;
  }

  function setButtonState(isOpen) {
    openButtons.forEach(function (button) {
      button.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    if (hamburger) {
      hamburger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
  }

  function normalizeSearchText(value) {
    return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function getSuggestionTarget(surface) {
    if (surface === "quick") {
      return {
        root: quickSuggestionsRoot,
        title: quickSuggestionsTitle,
        list: quickSuggestionsList
      };
    }

    return {
      root: suggestionsRoot,
      title: suggestionsTitle,
      list: suggestionsList
    };
  }

  function hideSurfaceSuggestions(surface) {
    var target = getSuggestionTarget(surface);

    if (!target.root) {
      return;
    }

    target.root.hidden = true;
  }

  function hideSuggestions() {
    hideSurfaceSuggestions("quick");
    hideSurfaceSuggestions("drawer");
  }

  function escapeHtml(value) {
    return (value || "").toString().replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function getPredictiveSearchUrl(query) {
    var endpoint = window.routes && window.routes.predictive_search_url ? window.routes.predictive_search_url : "/search/suggest";

    if (endpoint.indexOf(".json") === -1) {
      endpoint = endpoint.replace(/\/$/, "") + ".json";
    }

    return endpoint + "?q=" + encodeURIComponent(query) + "&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last&resources[options][fields]=title,tag,product_type,variants.title,vendor";
  }

  function getProductImage(product) {
    if (product.featured_image && product.featured_image.url) {
      return product.featured_image.url;
    }

    if (product.image) {
      return typeof product.image === "string" ? product.image : product.image.url;
    }

    return "";
  }

  function getProductPrice(product) {
    var price = product.price || product.price_min || product.price_max || "";

    if (typeof price === "number") {
      return "$" + (price > 999 ? (price / 100).toFixed(2) : price.toFixed(2));
    }

    price = String(price || "").trim();

    if (/^\d+(?:\.\d{1,2})?$/.test(price)) {
      return "$" + price;
    }

    return price;
  }

  function isBuyableProduct(product) {
    if (!product) {
      return false;
    }

    return product.available !== false && product.available !== "false";
  }

  function getProductTags(product) {
    if (!product || !product.tags) {
      return "";
    }

    return Array.isArray(product.tags) ? product.tags.join(" ") : String(product.tags);
  }

  function getProductSearchText(product) {
    return normalizeSearchText([
      product && (product.title || product.name),
      product && product.vendor,
      product && product.type,
      product && product.handle,
      getProductTags(product)
    ].join(" "));
  }

  function filterBuyableProducts(products) {
    var seen = {};

    return (products || []).filter(function (product) {
      var key = product && (product.handle || product.url || product.title);

      if (!isBuyableProduct(product) || !key || seen[key]) {
        return false;
      }

      seen[key] = true;
      return true;
    });
  }

  function compactSearchText(value) {
    return normalizeSearchText(value).replace(/[^a-z0-9]/g, "");
  }

  function matchSearchIntent(query) {
    var compactQuery = compactSearchText(query);

    if (compactQuery.length < 2) {
      return null;
    }

    for (var index = 0; index < searchIntents.length; index += 1) {
      var intent = searchIntents[index];

      for (var aliasIndex = 0; aliasIndex < intent.aliases.length; aliasIndex += 1) {
        var alias = compactSearchText(intent.aliases[aliasIndex]);

        if (alias.indexOf(compactQuery) === 0 || (compactQuery.indexOf(alias) === 0 && alias.length >= 3)) {
          return intent;
        }
      }
    }

    return null;
  }

  function keywordMatchesText(text, keyword) {
    var normalizedKeyword = normalizeSearchText(keyword);
    var compactKeyword = compactSearchText(keyword);
    var compactText = compactSearchText(text);

    return (normalizedKeyword.length >= 3 && text.indexOf(normalizedKeyword) !== -1) ||
      (compactKeyword.length >= 3 && compactText.indexOf(compactKeyword) !== -1);
  }

  function keywordStartsWithQuery(keyword, query) {
    var compactKeyword = compactSearchText(keyword);
    var compactQuery = compactSearchText(query);

    return compactQuery.length >= 2 && compactKeyword.indexOf(compactQuery) === 0;
  }

  function getRuleScore(rule, query, products) {
    var queryText = normalizeSearchText(query);
    var score = 0;

    (rule.keywords || []).forEach(function (keyword) {
      if (keywordStartsWithQuery(keyword, queryText)) {
        score += 5;
      } else if (keywordMatchesText(queryText, keyword)) {
        score += 4;
      }
    });

    (products || []).forEach(function (product) {
      var productText = getProductSearchText(product);

      (rule.keywords || []).forEach(function (keyword) {
        if (keywordMatchesText(productText, keyword)) {
          score += keyword.length > 5 ? 3 : 1;
        }
      });
    });

    return score > 0 ? score + (rule.priority || 0) : 0;
  }

  function cloneIntent(rule) {
    return {
      id: rule.id,
      title: rule.title,
      eyebrow: rule.eyebrow,
      mark: rule.mark,
      text: rule.text,
      url: rule.url,
      action: rule.action,
      productQuery: rule.productQuery,
      completions: rule.completions || [],
      completionLabel: rule.completionLabel || "",
      completionMode: rule.completionMode || ""
    };
  }

  function inferIntentFromProducts(query, products, fallbackIntent) {
    var bestRule = null;
    var bestScore = 0;

    (productPathRules || []).forEach(function (rule) {
      var score = getRuleScore(rule, query, products);

      if (score > bestScore) {
        bestScore = score;
        bestRule = rule;
      }
    });

    if (bestRule && bestScore >= 3) {
      return cloneIntent(bestRule);
    }

    return fallbackIntent || null;
  }

  function renderResolvedSuggestions(surface, query, products, fallbackIntent) {
    var resolvedIntent = inferIntentFromProducts(query, products, fallbackIntent);

    resolvedSuggestionIntents[surface] = {
      query: query,
      intent: resolvedIntent
    };

    renderSuggestions(surface, query, products, resolvedIntent);
  }

  function renderIntentCard(intent, query) {
    var completionMode = intent.completionMode || "";
    var completionLabel = intent.completionLabel || "";
    var completions = (intent.completions || []).map(function (completion) {
      if (completionMode === "series") {
        var code = completion.code || "";
        var allClass = code === "ALL" ? " p10-mobile-shop-nav__completion--all" : "";
        return '<a class="p10-mobile-shop-nav__completion p10-mobile-shop-nav__completion--series' + allClass + '" href="' + escapeHtml(completion.url) + '" data-p10-guided-search-item data-p10-mlp-series="' + escapeHtml(code.toLowerCase()) + '" aria-label="' + escapeHtml(completion.label) + '">' +
          '<b class="p10-mobile-shop-nav__series-code" aria-hidden="true">' + escapeHtml(code) + '</b>' +
          '<span class="p10-mobile-shop-nav__series-name">' + escapeHtml(completion.label) + '</span>' +
          '</a>';
      }

      return '<a class="p10-mobile-shop-nav__completion" href="' + escapeHtml(completion.url) + '" data-p10-guided-search-item>' + escapeHtml(completion.label) + '</a>';
    }).join("");
    var completionMarkup = '';

    if (completions) {
      if (completionMode === "series") {
        completionMarkup = '<span class="p10-mobile-shop-nav__completion-label">' + escapeHtml(completionLabel) + '</span>' +
          '<nav class="p10-mobile-shop-nav__completions p10-mobile-shop-nav__completions--series" aria-label="' + escapeHtml(completionLabel) + '">' + completions + '</nav>';
      } else {
        completionMarkup = '<div class="p10-mobile-shop-nav__completions" aria-label="Related searches">' + completions + '</div>';
      }
    }

    return '<a class="p10-mobile-shop-nav__intent" href="' + escapeHtml(intent.url) + '" data-p10-guided-search-item>' +
      '<span class="p10-mobile-shop-nav__intent-mark" aria-hidden="true">' + escapeHtml(intent.mark || (intent.title || "?").slice(0, 1)) + '</span>' +
      '<span class="p10-mobile-shop-nav__intent-copy">' +
      '<small>' + escapeHtml(intent.eyebrow || "Suggested path") + '</small>' +
      '<strong>' + escapeHtml(intent.title) + '</strong>' +
      '<span>' + escapeHtml(intent.text) + '</span>' +
      '<em>' + escapeHtml(intent.action || "Open path") + '</em>' +
      '</span>' +
      '</a>' +
      completionMarkup;
  }

  function renderProductCards(products, query, limit) {
    products = (products || []).slice(0, limit || 3);

    return products.map(function (product) {
      var image = getProductImage(product);
      var title = product.title || product.name || "Product";
      var vendor = product.vendor || "";
      var price = getProductPrice(product);
      var url = product.url || (product.handle ? "/products/" + product.handle : "/search?q=" + encodeURIComponent(query) + "&type=product");
      var imageUrl = image ? image + (image.indexOf("?") === -1 ? "?width=180" : "&width=180") : "";
      var imageMarkup = image
        ? '<img class="p10-mobile-shop-nav__suggestion-image" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(title) + '" loading="lazy">'
        : '<span class="p10-mobile-shop-nav__suggestion-placeholder" aria-hidden="true"></span>';

      return '<a class="p10-mobile-shop-nav__suggestion" href="' + escapeHtml(url) + '" data-p10-guided-search-item data-p10-mobile-suggestion>' +
        '<span class="p10-mobile-shop-nav__suggestion-media">' + imageMarkup + '</span>' +
        '<span class="p10-mobile-shop-nav__suggestion-copy">' +
        (vendor ? '<small>' + escapeHtml(vendor) + '</small>' : '') +
        '<strong>' + escapeHtml(title) + '</strong>' +
        (price ? '<span>' + escapeHtml(price) + '</span>' : '') +
        '</span>' +
        '</a>';
    }).join("");
  }

  function renderSuggestions(surface, query, products, intent) {
    var target = getSuggestionTarget(surface);

    if (!target.root || !target.list) {
      return;
    }

    products = (products || []).slice(0, surface === "quick" ? 2 : 3);

    if (!intent && !products.length) {
      target.list.innerHTML = "";
      hideSurfaceSuggestions(surface);
      return;
    }

    if (target.title) {
      target.title.textContent = intent ? "Suggested path" : "Product matches";
    }

    target.list.innerHTML =
      (intent ? renderIntentCard(intent, query) : '') +
      (products.length ? '<span class="p10-mobile-shop-nav__products-label">' + (intent ? "Products under this path" : "Matching products") + '</span>' : '') +
      renderProductCards(products, intent ? intent.productQuery : query, surface === "quick" ? 2 : 3);

    target.root.hidden = false;

    if (window.gsap && (!reducedMotion || !reducedMotion.matches)) {
      window.gsap.fromTo(
        target.list.querySelectorAll("[data-p10-guided-search-item]"),
        { y: 6, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.2, ease: "power2.out", stagger: 0.035, overwrite: "auto" }
      );
    }
  }

  function updateSuggestions(surface) {
    var input = surface === "quick" ? railSearch : drawerSearch;
    var target = getSuggestionTarget(surface);

    if (!input || !target.root || !target.list) {
      return;
    }

    if (surface === "quick" && root.classList.contains("is-open")) {
      hideSurfaceSuggestions("quick");
      return;
    }

    var query = normalizeSearchText(input.value);
    var intent = matchSearchIntent(query);
    var productQuery = intent ? intent.productQuery : query;
    activeSuggestionQueries[surface] = query;

    if (query.length < 2) {
      hideSurfaceSuggestions(surface);
      resolvedSuggestionIntents[surface] = null;
      return;
    }

    if (!window.fetch) {
      renderResolvedSuggestions(surface, query, [], intent);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(suggestionCache, productQuery)) {
      renderResolvedSuggestions(surface, query, suggestionCache[productQuery], intent);
      return;
    }

    window.clearTimeout(suggestionTimers[surface]);
    suggestionTimers[surface] = window.setTimeout(function () {
      window.fetch(getPredictiveSearchUrl(productQuery), { headers: { Accept: "application/json" } })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Predictive search failed");
          }

          return response.json();
        })
        .then(function (data) {
          var results = data && data.resources && data.resources.results ? data.resources.results.products : [];

          suggestionCache[productQuery] = filterBuyableProducts(results);

          if (activeSuggestionQueries[surface] === query) {
            renderResolvedSuggestions(surface, query, suggestionCache[productQuery], intent);
          }
        })
        .catch(function () {
          if (activeSuggestionQueries[surface] === query) {
            if (intent) {
              renderResolvedSuggestions(surface, query, [], intent);
            } else {
              hideSurfaceSuggestions(surface);
            }
          }
        });
    }, 150);
  }

  function getResolvedIntent(surface, query) {
    var resolved = resolvedSuggestionIntents[surface];

    if (resolved && resolved.query === query && resolved.intent) {
      return resolved.intent;
    }

    return null;
  }

  function handleSearchSubmit(event, input, surface) {
    var query = normalizeSearchText(input && input.value);
    var intent = getResolvedIntent(surface, query) || matchSearchIntent(query);

    if (!intent) {
      return;
    }

    event.preventDefault();
    window.location.href = intent.url;
  }

  function resetDrawerState(restoreTrigger) {
    window.clearTimeout(openGuardTimer);
    window.clearTimeout(closeTimer);
    openGuardTimer = null;
    closeTimer = null;

    root.classList.remove("is-open");
    document.body.classList.remove("p10-mobile-shop-nav-open", "menu_open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.style.transform = "";
    drawer.style.opacity = "";
    drawer.style.visibility = "";

    if (overlay) {
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.display = "";
      overlay.style.opacity = "";
      overlay.style.visibility = "";
      overlay.style.pointerEvents = "";
    }

    hideSuggestions();
    setButtonState(false);

    if (restoreTrigger && lastTrigger && typeof lastTrigger.focus === "function") {
      lastTrigger.focus({ preventScroll: true });
    }
    lastTrigger = null;
  }

  function openDrawer(trigger) {
    if (!drawer || !isMobile() || root.classList.contains("is-open")) {
      return;
    }

    lastTrigger = trigger || null;
    window.clearTimeout(openGuardTimer);
    window.clearTimeout(closeTimer);
    document.body.classList.remove("menu_open");
    if (document.activeElement && /^(?:INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      document.activeElement.blur();
    }
    hideSurfaceSuggestions("quick");
    root.classList.add("is-open");
    document.body.classList.add("p10-mobile-shop-nav-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.style.transform = "translateY(0)";
    drawer.style.visibility = "visible";
    drawer.style.opacity = "1";

    if (overlay) {
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.display = "block";
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
      overlay.style.pointerEvents = "auto";
    }

    setButtonState(true);

    if (window.gsap && (!reducedMotion || !reducedMotion.matches)) {
      window.gsap.fromTo(drawer.querySelectorAll(".p10-mobile-shop-nav__card, .p10-mobile-shop-nav__ip-card"), { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.24, ease: "power2.out", stagger: 0.025, delay: 0.05, overwrite: "auto" });
    }

    openGuardTimer = window.setTimeout(function () {
      if (!root.classList.contains("is-open")) {
        return;
      }

      var visualViewport = window.visualViewport;
      var viewportTop = visualViewport ? visualViewport.offsetTop : 0;
      var viewportHeight = visualViewport ? visualViewport.height : window.innerHeight;
      var viewportBottom = viewportTop + viewportHeight;
      var rect = drawer.getBoundingClientRect();
      var style = window.getComputedStyle(drawer);
      var visibleHeight = Math.max(0, Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop));

      if (style.display === "none" || style.visibility !== "visible" || visibleHeight < Math.min(120, rect.height * 0.25)) {
        resetDrawerState(false);
      }
    }, 360);
  }

  function closeDrawer() {
    if (!drawer || !root.classList.contains("is-open")) {
      return;
    }

    window.clearTimeout(openGuardTimer);

    function finishClose() {
      resetDrawerState(true);
    }

    drawer.style.transform = "translateY(104%)";
    if (overlay) {
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
    }

    if (reducedMotion && reducedMotion.matches) {
      finishClose();
    } else {
      closeTimer = window.setTimeout(finishClose, 280);
    }
  }

  openButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      openDrawer(button);
    });
  });

  closeButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      closeDrawer();
    });
  });

  if (drawerSearch) {
    drawerSearch.addEventListener("input", function () { updateSuggestions("drawer"); });
    drawerSearch.addEventListener("focus", function () { updateSuggestions("drawer"); });
    drawerSearch.addEventListener("search", function () { updateSuggestions("drawer"); });

    if (drawerSearch.form) {
      drawerSearch.form.addEventListener("submit", function (event) {
        handleSearchSubmit(event, drawerSearch, "drawer");
      });
    }
  }

  if (railSearch) {
    railSearch.addEventListener("input", function () { updateSuggestions("quick"); });
    railSearch.addEventListener("focus", function () { updateSuggestions("quick"); });
    railSearch.addEventListener("search", function () { updateSuggestions("quick"); });

    if (railSearch.form) {
      railSearch.form.addEventListener("submit", function (event) {
        handleSearchSubmit(event, railSearch, "quick");
      });
    }
  }

  if (hamburger) {
    hamburger.addEventListener("click", function (event) {
      if (!isMobile()) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDrawer(hamburger);
    }, true);
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      hideSurfaceSuggestions("quick");
      closeDrawer();
    }
  });

  document.addEventListener("click", function (event) {
    if (root.contains(event.target) || (drawer && drawer.contains(event.target))) {
      return;
    }

    hideSurfaceSuggestions("quick");
  });

  if (mobileQuery && typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", function (event) {
      if (!event.matches) {
        closeDrawer();
      }
    });
  }

  window.addEventListener("pagehide", function () {
    resetDrawerState(false);
  });

  window.addEventListener("pageshow", function () {
    if (root.classList.contains("is-open") || document.body.classList.contains("p10-mobile-shop-nav-open")) {
      resetDrawerState(false);
    }
  });

  if (window.location.hash === "#shop-menu" || window.location.search.indexOf("p10_shop_menu=1") !== -1) {
    window.setTimeout(function () {
      openDrawer(null);
    }, 350);
  }
})();
