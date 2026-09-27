(function () {
  var INTRO_SEEN_KEY = "p10TcgBattleIntroSeen";
  var INTRO_STORAGE_KEY = "p10TcgBattleIntroLastShownAt";
  var INTRO_SUPPRESS_UNTIL_KEY = "p10TcgBattleIntroSuppressUntil";
  var INTRO_RETURN_SUPPRESS_MS = 6 * 60 * 60 * 1000;
  var INTRO_DISABLED = true;

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
      // Storage may be blocked; the page still needs to work.
    }
  }

  function getNavigationType() {
    var entries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType("navigation")
      : [];

    return entries && entries[0] ? entries[0].type : "";
  }

  function shouldSkipIntro() {
    var now = Date.now();
    var hasSeenIntro = storageGet(window.localStorage, INTRO_SEEN_KEY) === "true";
    var lastShownAt = Number(storageGet(window.localStorage, INTRO_STORAGE_KEY) || 0);
    var suppressUntil = Number(storageGet(window.sessionStorage, INTRO_SUPPRESS_UNTIL_KEY) || 0);

    return (
      hasSeenIntro ||
      lastShownAt > 0 ||
      suppressUntil > now ||
      getNavigationType() === "back_forward"
    );
  }

  function markIntroShown() {
    storageSet(window.localStorage, INTRO_SEEN_KEY, "true");
    storageSet(window.localStorage, INTRO_STORAGE_KEY, String(Date.now()));
  }

  function markProductReturnSuppression() {
    storageSet(window.sessionStorage, INTRO_SUPPRESS_UNTIL_KEY, String(Date.now() + INTRO_RETURN_SUPPRESS_MS));
  }

  function setIntroLock(isLocked) {
    document.documentElement.classList.toggle("p10-tcg-intro-lock", isLocked);
    if (document.body) {
      document.body.classList.toggle("p10-tcg-intro-lock", isLocked);
    }
  }

  function renderIntroLetters(root) {
    var word = root.querySelector("[data-p10-tcg-intro-word]");
    var title = root.getAttribute("data-intro-title") || "BATTLE TCG";
    if (!word) {
      return;
    }

    word.textContent = "";
    title.split("").forEach(function (letter, index) {
      var span = document.createElement("span");
      span.className = "p10-tcg-intro__letter" + (letter === " " ? " is-space" : "");
      span.style.setProperty("--i", String(index));
      span.textContent = letter === " " ? "" : letter;
      word.appendChild(span);
    });
  }

  function initIntro(root) {
    var intro = root.querySelector("[data-p10-tcg-intro]");
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!intro) {
      return;
    }

    if (INTRO_DISABLED) {
      intro.remove();
      setIntroLock(false);
      return;
    }

    if (reduceMotion || shouldSkipIntro()) {
      intro.remove();
      setIntroLock(false);
      return;
    }

    markIntroShown();
    renderIntroLetters(intro);
    setIntroLock(true);
    intro.classList.add("is-active");

    var finish = function () {
      setIntroLock(false);
      intro.classList.add("is-finished");
      window.setTimeout(function () {
        intro.remove();
      }, 480);
    };

    var finishTimer = window.setTimeout(finish, 3300);
    var failsafeTimer = window.setTimeout(function () {
      if (intro.parentNode) {
        setIntroLock(false);
        intro.remove();
      }
    }, 5200);

    window.addEventListener(
      "pagehide",
      function () {
        window.clearTimeout(finishTimer);
        window.clearTimeout(failsafeTimer);
        setIntroLock(false);
      },
      { once: true }
    );
  }

  function getState(root) {
    var state = {};
    toArray(root.querySelectorAll("[data-filter-group]")).forEach(function (group) {
      state[group.getAttribute("data-filter-group")] = "";
    });
    return state;
  }

  function tokenMatch(value, token) {
    if (!token) {
      return true;
    }
    return (" " + String(value || "") + " ").indexOf(" " + token + " ") !== -1;
  }

  function productMatches(card, state, query) {
    var matchesFilters = Object.keys(state).every(function (group) {
      return tokenMatch(card.getAttribute("data-" + group), state[group]);
    });
    if (!matchesFilters) {
      return false;
    }

    if (!query) {
      return true;
    }

    return String(card.getAttribute("data-search") || "").indexOf(query) !== -1;
  }

  function productMatchesForCount(card, state, groupName, candidateValue, query) {
    var nextState = {};
    Object.keys(state).forEach(function (key) {
      nextState[key] = key === groupName ? candidateValue : state[key];
    });
    return productMatches(card, nextState, query);
  }

  function updateCounts(root, cards, state, query) {
    toArray(root.querySelectorAll("[data-filter-group]")).forEach(function (group) {
      var groupName = group.getAttribute("data-filter-group");
      toArray(group.querySelectorAll("[data-filter-value]")).forEach(function (button) {
        var value = button.getAttribute("data-filter-value") || "";
        var count = cards.filter(function (card) {
          return productMatchesForCount(card, state, groupName, value, query);
        }).length;
        var countNode = button.querySelector("[data-count]");
        if (countNode) {
          countNode.textContent = String(count);
        }
      });
    });
  }

  function sortCards(grid, cards, sortValue) {
    var sorted = cards.slice().sort(function (a, b) {
      var priceA = Number(a.getAttribute("data-price") || 0);
      var priceB = Number(b.getAttribute("data-price") || 0);
      var titleA = String(a.getAttribute("data-title") || "").toLowerCase();
      var titleB = String(b.getAttribute("data-title") || "").toLowerCase();

      if (sortValue === "price-asc") {
        return priceA - priceB;
      }
      if (sortValue === "price-desc") {
        return priceB - priceA;
      }
      if (sortValue === "title-asc") {
        return titleA.localeCompare(titleB);
      }
      return 0;
    });

    sorted.forEach(function (card) {
      grid.appendChild(card);
    });
  }

  function initFilters(root) {
    var grid = root.querySelector("[data-p10-tcg-grid]");
    if (!grid) {
      return;
    }

    var cards = toArray(root.querySelectorAll("[data-p10-tcg-product]"));
    var search = root.querySelector("[data-p10-tcg-search]");
    var sort = root.querySelector("[data-p10-tcg-sort]");
    var count = root.querySelector("[data-p10-tcg-result-count]");
    var empty = root.querySelector("[data-p10-tcg-empty]");
    var state = getState(root);

    function apply() {
      var query = search ? String(search.value || "").trim().toLowerCase() : "";
      var visibleCount = 0;

      sortCards(grid, cards, sort ? sort.value : "featured");

      cards.forEach(function (card) {
        var visible = productMatches(card, state, query);
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
        }
      });

      if (count) {
        count.textContent = visibleCount + (visibleCount === 1 ? " product" : " products");
      }
      if (empty) {
        empty.hidden = visibleCount !== 0;
      }
      updateCounts(root, cards, state, query);
    }

    toArray(root.querySelectorAll("[data-filter-group]")).forEach(function (group) {
      var groupName = group.getAttribute("data-filter-group");
      toArray(group.querySelectorAll("[data-filter-value]")).forEach(function (button) {
        button.addEventListener("click", function () {
          state[groupName] = button.getAttribute("data-filter-value") || "";
          toArray(group.querySelectorAll("[data-filter-value]")).forEach(function (nextButton) {
            nextButton.classList.toggle("is-active", nextButton === button);
          });
          apply();
        });
      });
    });

    if (search) {
      search.addEventListener("input", apply);
    }
    if (sort) {
      sort.addEventListener("change", apply);
    }

    toArray(root.querySelectorAll("[data-p10-tcg-product-link]")).forEach(function (link) {
      link.addEventListener("click", markProductReturnSuppression);
    });

    apply();
  }

  function initStickyOffset(root) {
    var setOffset = function () {
      var header = document.querySelector(".section-header-navigation");
      var toolbarTop = 0;

      if (header) {
        var rect = header.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top <= 0) {
          toolbarTop = Math.max(0, Math.round(rect.bottom));
        }
      }

      root.style.setProperty("--p10-tcg-sticky-top", toolbarTop + "px");
    };

    setOffset();
    window.addEventListener("resize", setOffset);
    window.addEventListener("scroll", setOffset, { passive: true });
  }

  function initReveals(root) {
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var items = toArray(root.querySelectorAll("[data-p10-tcg-reveal], [data-p10-tcg-product]"));
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  onReady(function () {
    var root = document.querySelector("[data-p10-tcg-battle-page]");
    if (!root) {
      return;
    }

    initIntro(root);
    initFilters(root);
    initStickyOffset(root);
    initReveals(root);
  });
})();
