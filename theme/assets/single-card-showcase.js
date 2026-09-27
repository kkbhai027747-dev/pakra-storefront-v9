(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  }

  function toArray(list) {
    return Array.prototype.slice.call(list || []);
  }

  var INTRO_SEEN_KEY = "p10SingleCardIntroSeen";
  var INTRO_STORAGE_KEY = "p10SingleCardIntroLastShownAt";
  var INTRO_SUPPRESS_UNTIL_KEY = "p10SingleCardIntroSuppressUntil";
  var INTRO_RETURN_SUPPRESS_MS = 6 * 60 * 60 * 1000;
  var INTRO_DISABLED = true;

  function storageGet(storage, key) {
    try {
      return storage && storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(storage, key, value) {
    try {
      if (storage) {
        storage.setItem(key, value);
      }
    } catch (error) {
      // Storage can be blocked in private modes; the page should still work.
    }
  }

  function getNavigationType() {
    var entries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType("navigation")
      : [];

    return entries && entries[0] ? entries[0].type : "";
  }

  function isShopifyDesignMode() {
    return Boolean(
      (window.Shopify && window.Shopify.designMode) ||
        (document.body && document.body.classList.contains("shopify-design-mode"))
    );
  }

  function shouldSkipIntro() {
    var now = Date.now();
    var hasSeenIntro = storageGet(window.localStorage, INTRO_SEEN_KEY) === "true";
    var lastShownAt = Number(storageGet(window.localStorage, INTRO_STORAGE_KEY) || 0);
    var suppressUntil = Number(storageGet(window.sessionStorage, INTRO_SUPPRESS_UNTIL_KEY) || 0);

    return (
      isShopifyDesignMode() ||
      getNavigationType() === "back_forward" ||
      hasSeenIntro ||
      lastShownAt > 0 ||
      suppressUntil > now
    );
  }

  function markIntroShown() {
    storageSet(window.localStorage, INTRO_SEEN_KEY, "true");
    storageSet(window.localStorage, INTRO_STORAGE_KEY, String(Date.now()));
  }

  function markProductReturnSuppression() {
    storageSet(window.sessionStorage, INTRO_SUPPRESS_UNTIL_KEY, String(Date.now() + INTRO_RETURN_SUPPRESS_MS));
  }

  function removeIntroLock() {
    document.documentElement.classList.remove("p10-single-card-intro-lock");
    if (document.body) {
      document.body.classList.remove("p10-single-card-intro-lock");
    }
  }

  function initIntro(root, gsap) {
    var intro = root.querySelector("[data-p10-single-card-intro]");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (INTRO_DISABLED) {
      if (intro) {
        intro.remove();
      }
      removeIntroLock();
      return;
    }

    if (!intro || reduceMotion || !gsap || shouldSkipIntro()) {
      if (intro) {
        intro.remove();
      }
      removeIntroLock();
      return;
    }

    markIntroShown();

    var stage = intro.querySelector(".p10-single-card-intro__stage");
    var brand = intro.querySelector("[data-p10-intro-brand]");
    var card = intro.querySelector("[data-p10-intro-card]");
    var shine = intro.querySelector(".p10-single-card-intro__shine");
    var line = intro.querySelector("[data-p10-intro-line]");
    var topPanel = intro.querySelector(".p10-single-card-intro__panel--top");
    var bottomPanel = intro.querySelector(".p10-single-card-intro__panel--bottom");

    document.documentElement.classList.add("p10-single-card-intro-lock");
    if (document.body) {
      document.body.classList.add("p10-single-card-intro-lock");
    }

    var finish = function () {
      removeIntroLock();
      intro.remove();
    };

    var failsafe = window.setTimeout(finish, 4700);
    var tl = gsap.timeline({
      defaults: { ease: "power3.out" },
      onComplete: function () {
        window.clearTimeout(failsafe);
        finish();
      }
    });

    gsap.set([brand, card, line], { autoAlpha: 0 });
    gsap.set(line, { scaleX: 0 });
    gsap.set(card, { y: 38, rotation: -3, rotationY: -12, scale: 0.9, transformPerspective: 900, transformOrigin: "50% 50%" });
    gsap.set(shine, { xPercent: -95, rotation: 10 });

    tl.to(brand, { autoAlpha: 1, y: 0, duration: 0.42 })
      .to(card, { autoAlpha: 1, y: 0, rotation: 0, rotationY: 0, scale: 1, duration: 0.72, ease: "back.out(1.16)" }, "-=0.08")
      .to(shine, { xPercent: 95, duration: 0.9, ease: "power2.inOut" }, "-=0.38")
      .to(line, { autoAlpha: 1, scaleX: 1, duration: 0.38 }, "-=0.18")
      .to(stage, { autoAlpha: 0, y: -14, scale: 0.98, duration: 0.32 }, "+=0.26")
      .to(topPanel, { yPercent: -102, duration: 0.82, ease: "power4.inOut" }, "open")
      .to(bottomPanel, { yPercent: 102, duration: 0.82, ease: "power4.inOut" }, "open")
      .to(intro, { autoAlpha: 0, duration: 0.2 }, "-=0.08");

    window.addEventListener(
      "pagehide",
      function () {
        window.clearTimeout(failsafe);
        tl.kill();
        removeIntroLock();
      },
      { once: true }
    );
  }

  function initReveal(root, gsap) {
    if (!gsap) {
      return;
    }

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealItems = toArray(root.querySelectorAll("[data-p10-reveal]"));
    var cards = toArray(root.querySelectorAll("[data-p10-product-card]"));

    if (reduceMotion) {
      gsap.set(revealItems.concat(cards), { clearProps: "all" });
      return;
    }

    gsap.set(revealItems, { autoAlpha: 0, y: 24 });
    gsap.to(revealItems, {
      autoAlpha: 1,
      y: 0,
      duration: 0.72,
      ease: "power3.out",
      stagger: 0.08,
      delay: 0.18
    });

    gsap.set(cards, { autoAlpha: 0, y: 28 });
    gsap.to(cards, {
      autoAlpha: 1,
      y: 0,
      duration: 0.66,
      ease: "power3.out",
      stagger: { each: 0.055, from: "start" },
      delay: 0.44
    });
  }

  function initPosterMotion(root, gsap) {
    if (!gsap) {
      return;
    }

    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var poster = root.querySelector("[data-p10-hero-poster]");
    var posterImage = poster && poster.querySelector("img");
    var glint = root.querySelector("[data-p10-hero-glint]");
    var startDelay = root.querySelector("[data-p10-single-card-intro]") ? 2.95 : 0.16;

    if (!poster || reduceMotion) {
      if (glint) {
        glint.style.display = "none";
      }
      return;
    }

    if (posterImage) {
      gsap.fromTo(
        posterImage,
        { scale: 1.025, filter: "brightness(0.92)" },
        { scale: 1, filter: "brightness(1)", duration: 1.35, ease: "power3.out", delay: startDelay }
      );
    }

    if (glint) {
      gsap.fromTo(
        glint,
        { autoAlpha: 0, xPercent: -160 },
        {
          autoAlpha: 0.86,
          xPercent: 420,
          duration: 1.15,
          ease: "power2.inOut",
          delay: startDelay + 0.38,
          onComplete: function () {
            gsap.set(glint, { autoAlpha: 0 });
          }
        }
      );
    }
  }

  function initCardTilt(root, gsap) {
    if (!gsap || !window.matchMedia || !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    var quickTo = gsap.quickTo
      ? gsap.quickTo
      : function (target, prop, vars) {
          return function (value) {
            var nextVars = {};
            Object.keys(vars || {}).forEach(function (key) {
              nextVars[key] = vars[key];
            });
            nextVars[prop] = value;
            gsap.to(target, nextVars);
          };
        };

    toArray(root.querySelectorAll("[data-p10-product-card]")).forEach(function (card) {
      var link = card.querySelector(".p10-single-card-product__link");
      var media = card.querySelector(".p10-single-card-product__media");

      if (!link || !media) {
        return;
      }

      var rotateX = quickTo(media, "rotationX", { duration: 0.34, ease: "power3.out" });
      var rotateY = quickTo(media, "rotationY", { duration: 0.34, ease: "power3.out" });
      var y = quickTo(media, "y", { duration: 0.28, ease: "power3.out" });

      link.addEventListener("pointermove", function (event) {
        var rect = link.getBoundingClientRect();
        var relX = (event.clientX - rect.left) / rect.width - 0.5;
        var relY = (event.clientY - rect.top) / rect.height - 0.5;

        rotateX(relY * -7);
        rotateY(relX * 9);
        y(-5);
        link.style.setProperty("--p10-shine-x", Math.round((relX + 0.5) * 100) + "%");
        link.style.setProperty("--p10-shine-y", Math.round((relY + 0.5) * 100) + "%");
      });

      link.addEventListener("pointerleave", function () {
        rotateX(0);
        rotateY(0);
        y(0);
        link.style.setProperty("--p10-shine-x", "50%");
        link.style.setProperty("--p10-shine-y", "20%");
      });
    });
  }

  function initProductTools(root, gsap) {
    var tools = root.querySelector("[data-p10-single-card-tools]");
    var grid = root.querySelector("[data-p10-product-grid]");

    if (!tools || !grid) {
      return;
    }

    var cards = toArray(grid.querySelectorAll("[data-p10-product-card]"));
    var filterGroups = toArray(tools.querySelectorAll("[data-p10-filter-group]"));
    var search = tools.querySelector("[data-p10-product-search]");
    var sort = tools.querySelector("[data-p10-product-sort]");
    var count = tools.querySelector("[data-p10-result-count]");
    var emptyState = root.querySelector("[data-p10-empty-state]");
    var activeFilters = {};
    var pathTargets = {
      edition: tools.querySelector("[data-p10-path-edition]"),
      series: tools.querySelector("[data-p10-path-series]"),
      rarity: tools.querySelector("[data-p10-path-rarity]")
    };
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobileStickyQuery = window.matchMedia ? window.matchMedia("(max-width: 749px)") : null;
    var stickyFrame = null;
    var stickySpacer = document.createElement("div");

    stickySpacer.className = "p10-single-card-tools-spacer";
    stickySpacer.setAttribute("aria-hidden", "true");
    tools.parentNode.insertBefore(stickySpacer, tools);

    function isMobileSticky() {
      return mobileStickyQuery ? mobileStickyQuery.matches : window.innerWidth <= 749;
    }

    function getScrollY() {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function setPinnedChrome(active) {
      if (document.body) {
        document.body.classList.toggle("p10-single-card-tools-pinned", active);
      }

      var mobileHeader = document.querySelector(".section-header-mobile");
      if (!mobileHeader) {
        return;
      }

      if (active) {
        mobileHeader.classList.remove("shopify-section-header-hidden");
        mobileHeader.classList.add("shopify-section-header-sticky", "animate");
        mobileHeader.style.top = "0px";
      } else if (mobileHeader.style.top === "0px") {
        mobileHeader.style.top = "";
      }
    }

    function setSpacer(active) {
      if (!active) {
        stickySpacer.classList.remove("is-active");
        stickySpacer.style.height = "0px";
        return;
      }

      stickySpacer.classList.add("is-active");
      stickySpacer.style.height = Math.ceil(tools.getBoundingClientRect().height) + "px";
    }

    function updateStickyOffset() {
      if (!isMobileSticky()) {
        tools.style.removeProperty("--p10-single-card-sticky-top");
        tools.classList.remove("is-compact", "is-mobile-pinned");
        setPinnedChrome(false);
        setSpacer(false);
        return 0;
      }

      var selectors = [
        "sticky-header-mobile",
        ".section-header-mobile.shopify-section-header-sticky",
        ".section-header-mobile",
        ".shopify-section-header-sticky",
        ".sticky-header",
        ".header-wrapper",
        ".header-mobile",
        "#shopify-section-header",
        "header"
      ];
      var offset = 0;

      selectors.forEach(function (selector) {
        toArray(document.querySelectorAll(selector)).forEach(function (element) {
          if (!element || element === tools || tools.contains(element)) {
            return;
          }

          var style = window.getComputedStyle ? window.getComputedStyle(element) : null;
          var position = style ? style.position : "";
          var rect = element.getBoundingClientRect ? element.getBoundingClientRect() : null;
          var isThemeStickyHeader = element.classList.contains("shopify-section-header-sticky") || element.tagName.toLowerCase() === "sticky-header-mobile";

          if (!rect || rect.height <= 0 || rect.height > 160 || rect.top > 2 || rect.bottom <= 0) {
            return;
          }

          if (position === "fixed" || position === "sticky" || isThemeStickyHeader) {
            offset = Math.max(offset, Math.round(rect.bottom));
          }
        });
      });

      tools.style.setProperty("--p10-single-card-sticky-top", offset + "px");
      return offset;
    }

    function updateStickyState() {
      stickyFrame = null;

      if (!isMobileSticky()) {
        tools.classList.remove("is-compact", "is-mobile-pinned");
        tools.style.removeProperty("--p10-single-card-sticky-top");
        setPinnedChrome(false);
        setSpacer(false);
        return;
      }

      var top = updateStickyOffset();
      var scrollY = getScrollY();
      var marker = tools.classList.contains("is-mobile-pinned") ? stickySpacer : tools;
      var markerTop = marker.getBoundingClientRect().top + scrollY;
      var shouldPin = scrollY + top >= markerTop - 1 && scrollY > 80;

      setPinnedChrome(shouldPin);

      if (shouldPin) {
        top = updateStickyOffset();
        tools.classList.add("is-mobile-pinned", "is-compact");
        setSpacer(true);
      } else {
        tools.classList.remove("is-mobile-pinned", "is-compact");
        setSpacer(false);
      }
    }

    function requestStickyUpdate() {
      if (stickyFrame) {
        return;
      }

      stickyFrame = window.requestAnimationFrame ? window.requestAnimationFrame(updateStickyState) : window.setTimeout(updateStickyState, 16);
    }

    function getTokens(card) {
      return " " + (card.getAttribute("data-p10-filter-tokens") || "") + " ";
    }

    function matchesFilter(card) {
      var tokens = getTokens(card);

      return Object.keys(activeFilters).every(function (groupName) {
        var token = activeFilters[groupName] || "all";
        return token === "all" || tokens.indexOf(" " + token + " ") !== -1;
      });
    }

    function matchesSearch(card) {
      var query = search ? search.value.trim().toLowerCase() : "";

      if (!query) {
        return true;
      }

      return (card.getAttribute("data-p10-search-text") || "").toLowerCase().indexOf(query) !== -1;
    }

    function updateCount(visibleCount) {
      if (!count) {
        return;
      }

      count.textContent = visibleCount === 1 ? "1 single card" : visibleCount + " single cards";
    }

    function updatePath() {
      Object.keys(pathTargets).forEach(function (groupName) {
        var target = pathTargets[groupName];
        var group = tools.querySelector('[data-p10-filter-group="' + groupName + '"]');
        var active = group ? group.querySelector(".p10-single-card-filter.is-active") : null;

        if (!target || !active) {
          return;
        }

        target.textContent = active.getAttribute("data-p10-filter-label") || active.textContent.trim();
      });
    }

    function animateVisible(visibleCards) {
      if (!gsap || reduceMotion || !visibleCards.length) {
        return;
      }

      gsap.killTweensOf(visibleCards);
      gsap.fromTo(
        visibleCards,
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.26, ease: "power2.out", stagger: 0.025, overwrite: true }
      );
    }

    function applyFilters(shouldAnimate) {
      var visibleCards = [];

      cards.forEach(function (card) {
        var visible = matchesFilter(card) && matchesSearch(card);
        card.hidden = !visible;

        if (visible) {
          visibleCards.push(card);
        }
      });

      if (emptyState) {
        emptyState.hidden = visibleCards.length !== 0;
      }

      updateCount(visibleCards.length);

      if (shouldAnimate) {
        animateVisible(visibleCards);
      }
    }

    function sortCards() {
      var sortValue = sort ? sort.value : "featured";
      var orderedCards = cards.slice();

      if (sortValue === "price-asc" || sortValue === "price-desc") {
        orderedCards.sort(function (a, b) {
          var priceA = Number(a.getAttribute("data-p10-price") || 0);
          var priceB = Number(b.getAttribute("data-p10-price") || 0);
          return sortValue === "price-asc" ? priceA - priceB : priceB - priceA;
        });
      } else if (sortValue === "title-asc") {
        orderedCards.sort(function (a, b) {
          return (a.getAttribute("data-p10-title") || "").localeCompare(b.getAttribute("data-p10-title") || "");
        });
      } else if (sortValue === "series-desc") {
        orderedCards.sort(function (a, b) {
          var seriesA = Number(a.getAttribute("data-p10-series") || 0);
          var seriesB = Number(b.getAttribute("data-p10-series") || 0);
          var rarityA = Number(a.getAttribute("data-p10-rarity-rank") || 0);
          var rarityB = Number(b.getAttribute("data-p10-rarity-rank") || 0);
          return seriesB - seriesA || rarityB - rarityA;
        });
      } else if (sortValue === "rarity-desc") {
        orderedCards.sort(function (a, b) {
          var rarityA = Number(a.getAttribute("data-p10-rarity-rank") || 0);
          var rarityB = Number(b.getAttribute("data-p10-rarity-rank") || 0);
          var priceA = Number(a.getAttribute("data-p10-price") || 0);
          var priceB = Number(b.getAttribute("data-p10-price") || 0);
          return rarityB - rarityA || priceB - priceA;
        });
      }

      orderedCards.forEach(function (card) {
        grid.appendChild(card);
      });
    }

    filterGroups.forEach(function (group) {
      var groupName = group.getAttribute("data-p10-filter-group") || "default";
      var buttons = toArray(group.querySelectorAll("[data-p10-filter]"));
      var initialButton = group.querySelector(".p10-single-card-filter.is-active") || buttons[0];

      activeFilters[groupName] = initialButton ? initialButton.getAttribute("data-p10-filter") || "all" : "all";

      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          activeFilters[groupName] = button.getAttribute("data-p10-filter") || "all";

          buttons.forEach(function (item) {
            var isActive = item === button;
            item.classList.toggle("is-active", isActive);
            item.setAttribute("aria-pressed", isActive ? "true" : "false");
          });

          updatePath();
          applyFilters(true);
        });
      });
    });

    if (search) {
      search.addEventListener("input", function () {
        applyFilters(true);
      });
    }

    if (sort) {
      sort.addEventListener("change", function () {
        sortCards();
        applyFilters(true);
      });
    }

    window.addEventListener("scroll", requestStickyUpdate, { passive: true });
    window.addEventListener("resize", requestStickyUpdate);
    if (mobileStickyQuery) {
      if (mobileStickyQuery.addEventListener) {
        mobileStickyQuery.addEventListener("change", requestStickyUpdate);
      } else if (mobileStickyQuery.addListener) {
        mobileStickyQuery.addListener(requestStickyUpdate);
      }
    }

    sortCards();
    updatePath();
    applyFilters(false);
    requestStickyUpdate();
  }

  function init() {
    var roots = toArray(document.querySelectorAll("[data-p10-single-card-page]"));
    var gsap = window.gsap;

    roots.forEach(function (root) {
      if (root.dataset.p10Ready === "true") {
        return;
      }

      root.dataset.p10Ready = "true";
      initIntro(root, gsap);
      initProductTools(root, gsap);
      initReveal(root, gsap);
      initPosterMotion(root, gsap);
      initCardTilt(root, gsap);

      toArray(root.querySelectorAll(".p10-single-card-product__link")).forEach(function (link) {
        link.addEventListener("click", markProductReturnSuppression);
      });
    });
  }

  onReady(init);
})();
