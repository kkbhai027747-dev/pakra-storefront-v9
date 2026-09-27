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

  function initMenu(root) {
    var tabs = toArray(root.querySelectorAll("[data-p10-sealed-region-tab]"));
    var panels = toArray(root.querySelectorAll("[data-p10-sealed-region-panel]"));
    var cards = toArray(root.querySelectorAll("[data-p10-sealed-region-card]"));
    var activeLink = root.querySelector("[data-p10-sealed-active-link]");
    var promo = root.querySelector("[data-p10-sealed-promo]");
    var promoMedia = root.querySelector("[data-p10-sealed-promo-media]");
    var promoRegions = toArray(root.querySelectorAll("[data-p10-sealed-promo-region]"));
    var promoKicker = root.querySelector("[data-p10-sealed-promo-kicker]");
    var promoTitle = root.querySelector("[data-p10-sealed-promo-title]");
    var promoDescription = root.querySelector("[data-p10-sealed-promo-description]");
    var promoPrimary = root.querySelector("[data-p10-sealed-promo-primary]");
    var promoSecondary = root.querySelector("[data-p10-sealed-promo-secondary]");
    var promoTimer = null;
    var promoPaused = false;
    var menuActive = false;
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function findPanel(region) {
      return panels.find(function (panel) {
        return panel.getAttribute("data-p10-sealed-region-panel") === region;
      });
    }

    function findPromoRegion(region) {
      return promoRegions.find(function (item) {
        return item.getAttribute("data-p10-sealed-promo-region") === region;
      });
    }

    function regionSlides(regionElement) {
      return toArray(regionElement ? regionElement.querySelectorAll("[data-p10-sealed-promo-slide]") : []);
    }

    function setSlide(regionElement, index) {
      var slides = regionSlides(regionElement);
      if (!slides.length) {
        return;
      }

      var nextIndex = ((index % slides.length) + slides.length) % slides.length;
      regionElement.setAttribute("data-p10-slide-index", String(nextIndex));

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === nextIndex;
        slide.classList.toggle("is-active", isActive);
        slide.setAttribute("aria-hidden", isActive ? "false" : "true");
        slide.tabIndex = isActive ? 0 : -1;
      });
    }

    function activePromoRegion() {
      var activeRegion = root.getAttribute("data-p10-active-region") || "cn";
      return findPromoRegion(activeRegion) || promoRegions[0] || null;
    }

    function stopPromo() {
      if (promoTimer) {
        window.clearInterval(promoTimer);
        promoTimer = null;
      }
    }

    function nextPromoSlide() {
      var regionElement = activePromoRegion();
      var slides = regionSlides(regionElement);
      if (slides.length < 2) {
        return;
      }

      var currentIndex = Number(regionElement.getAttribute("data-p10-slide-index") || "0");
      setSlide(regionElement, currentIndex + 1);
    }

    function startPromo() {
      stopPromo();
      if (reducedMotion || promoPaused || !menuActive) {
        return;
      }

      var regionElement = activePromoRegion();
      if (regionSlides(regionElement).length < 2) {
        return;
      }

      promoTimer = window.setInterval(nextPromoSlide, 3200);
    }

    function updatePromo(region) {
      var regionElement = findPromoRegion(region) || findPromoRegion("cn") || promoRegions[0];
      if (!regionElement) {
        return;
      }

      promoRegions.forEach(function (item) {
        var isActive = item === regionElement;
        item.classList.toggle("is-active", isActive);
        item.hidden = !isActive;
        if (isActive) {
          setSlide(item, 0);
        } else {
          setSlide(item, Number(item.getAttribute("data-p10-slide-index") || "0"));
        }
      });

      if (promoKicker) promoKicker.textContent = regionElement.getAttribute("data-promo-kicker") || "";
      if (promoTitle) promoTitle.textContent = regionElement.getAttribute("data-promo-title") || "";
      if (promoDescription) promoDescription.textContent = regionElement.getAttribute("data-promo-description") || "";

      if (promoPrimary) {
        promoPrimary.href = regionElement.getAttribute("data-promo-primary-url") || "#";
        promoPrimary.textContent = regionElement.getAttribute("data-promo-primary-label") || "Shop boxes";
      }

      if (promoSecondary) {
        promoSecondary.href = regionElement.getAttribute("data-promo-secondary-url") || "#";
        promoSecondary.textContent = regionElement.getAttribute("data-promo-secondary-label") || "All sealed boxes";
      }

      startPromo();
    }

    function activate(region) {
      var activePanel = findPanel(region) || findPanel("cn");
      var activeRegion = activePanel ? activePanel.getAttribute("data-p10-sealed-region-panel") : "cn";
      var currentUrl = activeLink ? activeLink.href : "#";
      var url = activePanel ? activePanel.getAttribute("data-region-url") || currentUrl : currentUrl;
      var actionLabel = activePanel ? activePanel.getAttribute("data-region-action-label") || "Shop boxes" : "Shop boxes";

      root.setAttribute("data-p10-active-region", activeRegion);

      tabs.forEach(function (tab) {
        var isActive = tab.getAttribute("data-p10-sealed-region-target") === activeRegion;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      panels.forEach(function (panel) {
        var isActive = panel === activePanel;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });

      cards.forEach(function (card) {
        var isActive = card.getAttribute("data-p10-sealed-region-card") === activeRegion;
        card.classList.toggle("is-active", isActive);
        card.hidden = isActive;
      });

      if (activeLink) {
        activeLink.href = url;
        activeLink.textContent = actionLabel;
      }

      updatePromo(activeRegion);
    }

    toArray(root.querySelectorAll("[data-p10-sealed-region-target]")).forEach(function (control) {
      control.addEventListener("click", function (event) {
        var region = control.getAttribute("data-p10-sealed-region-target");
        if (!region) {
          return;
        }

        event.preventDefault();
        activate(region);
      });
    });

    root.addEventListener("mouseenter", function () {
      menuActive = true;
      startPromo();
    });
    root.addEventListener("mouseleave", function () {
      menuActive = false;
      stopPromo();
    });
    root.addEventListener("focusin", function () {
      menuActive = true;
      startPromo();
    });
    root.addEventListener("focusout", function () {
      if (!root.contains(document.activeElement)) {
        menuActive = false;
        stopPromo();
      }
    });

    if (promoMedia) {
      promoMedia.addEventListener("mouseenter", function () {
        promoPaused = true;
        stopPromo();
      });
      promoMedia.addEventListener("mouseleave", function () {
        promoPaused = false;
        startPromo();
      });
      promoMedia.addEventListener("focusin", function () {
        promoPaused = true;
        stopPromo();
      });
      promoMedia.addEventListener("focusout", function () {
        promoPaused = false;
        startPromo();
      });
    }

    if (promo) {
      window.addEventListener("pagehide", stopPromo);
    }

    activate(root.getAttribute("data-p10-active-region") || "cn");
  }

  onReady(function () {
    toArray(document.querySelectorAll("[data-p10-sealed-mega]")).forEach(initMenu);
  });
})();
