(function () {
  var loader = document.querySelector("[data-p10-intro-loader]");
  var seenKey = "p10SingleCardIntroSeen";
  var storageKey = "p10SingleCardLegacyIntroLastShownAt";

  if (!loader || loader.dataset.p10Ready === "true") {
    return;
  }

  loader.dataset.p10Ready = "true";

  function getNavigationType() {
    var entries = window.performance && window.performance.getEntriesByType
      ? window.performance.getEntriesByType("navigation")
      : [];

    return entries && entries[0] ? entries[0].type : "";
  }

  function getLastShownAt() {
    try {
      var introSeen = window.localStorage && window.localStorage.getItem(seenKey) === "true";
      var legacyShownAt = Number(window.localStorage && window.localStorage.getItem(storageKey)) || 0;
      return introSeen ? Date.now() : legacyShownAt;
    } catch (error) {
      return 0;
    }
  }

  function markShown() {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(seenKey, "true");
        window.localStorage.setItem(storageKey, String(Date.now()));
      }
    } catch (error) {
      // Storage can be blocked; the animation should still be removable.
    }
  }

  var isDesignMode = Boolean(
    (window.Shopify && window.Shopify.designMode) ||
      (document.body && document.body.classList.contains("shopify-design-mode"))
  );
  var lastShownAt = getLastShownAt();

  if (
    isDesignMode ||
    getNavigationType() === "back_forward" ||
    lastShownAt > 0 ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  ) {
    loader.remove();
    return;
  }

  markShown();

  var brandTarget = loader.querySelector("[data-p10-intro-brand]");
  var titleTarget = loader.querySelector("[data-p10-intro-single]");
  var brandText = loader.getAttribute("data-brand") || "pakracards x MLPEKAYOU";
  var titleText = loader.getAttribute("data-title") || "SINGLE CARDS";

  function fillLetters(target, text, delayStep, reverse) {
    if (!target) {
      return;
    }

    var chars = Array.from(text);

    target.innerHTML = chars
      .map(function (char, index) {
        var order = reverse ? chars.length - index - 1 : index;
        var delay = Math.max(0, order * delayStep).toFixed(3);
        var content = char === " " ? "&nbsp;" : char;

        return '<span class="p10-intro-letter" style="transition-delay: ' + delay + 's;">' + content + "</span>";
      })
      .join("");
  }

  fillLetters(brandTarget, brandText, 0.018, false);
  fillLetters(titleTarget, titleText, 0.026, false);

  document.documentElement.classList.add("p10-intro-lock");
  document.body.classList.add("p10-intro-lock");

  var timers = [
    window.setTimeout(function () {
      loader.classList.add("p10-brand-out");
    }, 620),
    window.setTimeout(function () {
      loader.classList.add("p10-single-in");
    }, 1320),
    window.setTimeout(function () {
      loader.classList.add("p10-single-tight");
    }, 2060),
    window.setTimeout(function () {
      loader.classList.add("p10-slit-on");
    }, 2880),
    window.setTimeout(function () {
      loader.classList.add("p10-open");
    }, 3360),
    window.setTimeout(function () {
      loader.classList.add("p10-finished");
      document.documentElement.classList.remove("p10-intro-lock");
      document.body.classList.remove("p10-intro-lock");
    }, 4540),
    window.setTimeout(function () {
      loader.remove();
    }, 4880)
  ];

  window.addEventListener(
    "pagehide",
    function () {
      timers.forEach(function (timer) {
        window.clearTimeout(timer);
      });
      document.documentElement.classList.remove("p10-intro-lock");
      document.body.classList.remove("p10-intro-lock");
    },
    { once: true }
  );
})();
