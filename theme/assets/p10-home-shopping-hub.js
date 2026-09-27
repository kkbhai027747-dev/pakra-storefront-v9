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

  function initHub(root, gsap) {
    if (!gsap || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      return;
    }

    var revealItems = toArray(root.querySelectorAll("[data-p10-home-reveal]"));
    var productCards = toArray(root.querySelectorAll("[data-p10-home-product-card], [data-p10-smart-product-card]"));

    gsap.set(revealItems, { autoAlpha: 0, y: 22 });
    gsap.to(revealItems, {
      autoAlpha: 1,
      y: 0,
      duration: 0.58,
      ease: "power3.out",
      stagger: 0.08
    });

    gsap.set(productCards, { autoAlpha: 0, y: 20 });
    gsap.to(productCards, {
      autoAlpha: 1,
      y: 0,
      duration: 0.46,
      ease: "power3.out",
      stagger: 0.04,
      delay: 0.18
    });
  }

  function findContextRoot(button) {
    var scope = button.closest("[data-p10-context-section]");
    if (scope) {
      var scopedRoot = scope.querySelector("[data-p10-recommendation-root]");
      if (scopedRoot) {
        return scopedRoot;
      }
    }

    return document.querySelector("[data-p10-recommendation-root]");
  }

  function findPanel(root, key) {
    var panels = toArray(root.querySelectorAll("[data-p10-rec-panel]"));

    for (var index = 0; index < panels.length; index += 1) {
      if (panels[index].getAttribute("data-p10-rec-panel") === key) {
        return panels[index];
      }
    }

    return null;
  }

  function closeContextRoot(root) {
    if (!root) {
      return;
    }

    root.classList.remove("is-open");
    root.hidden = true;
  }

  function initMiniArrivals(root) {
    var items = toArray(root.querySelectorAll("[data-p10-mini-arrival-item]"));
    var intervalMs = Number(root.dataset.interval || 15000);
    var currentGroup = 0;
    var groupSize = 2;
    var timer = null;
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (items.length <= groupSize) {
      return;
    }

    function groupCount() {
      return Math.ceil(items.length / groupSize);
    }

    function showGroup(groupIndex) {
      currentGroup = (groupIndex + groupCount()) % groupCount();
      var start = currentGroup * groupSize;
      var end = start + groupSize;

      items.forEach(function (item, index) {
        var isActive = index >= start && index < end;
        item.hidden = !isActive;
        item.classList.toggle("is-active", isActive);
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || timer || intervalMs < 1000) {
        return;
      }

      timer = window.setInterval(function () {
        showGroup(currentGroup + 1);
      }, intervalMs);
    }

    root.addEventListener("pointerenter", stop);
    root.addEventListener("pointerleave", start);
    root.addEventListener("focusin", stop);
    root.addEventListener("focusout", start);

    showGroup(0);
    start();
  }

  function openContextPanel(button) {
    var key = button.getAttribute("data-p10-context-button");
    var root = findContextRoot(button);
    var panel = root ? findPanel(root, key) : null;

    if (!root || !panel) {
      return false;
    }

    toArray(root.querySelectorAll("[data-p10-rec-panel]")).forEach(function (item) {
      item.hidden = item !== panel;
    });

    root.hidden = false;
    root.classList.add("is-open");

    if (window.gsap && !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      window.gsap.fromTo(root.querySelector(".p10-context-drawer__panel"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: "power2.out", overwrite: "auto" });
      window.gsap.fromTo(panel.querySelectorAll(".p10-smart-product, .p10-context-panel__cta"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.24, ease: "power2.out", stagger: 0.04, delay: 0.06, overwrite: "auto" });
    }

    return true;
  }

  function initRecommendationRoots() {
    toArray(document.querySelectorAll("[data-p10-recommendation-root]")).forEach(function (root) {
      if (root.dataset.p10ContextReady === "true") {
        return;
      }

      root.dataset.p10ContextReady = "true";
      toArray(root.querySelectorAll("[data-p10-context-close]")).forEach(function (button) {
        button.addEventListener("click", function () {
          closeContextRoot(root);
        });
      });

      root.addEventListener("click", function (event) {
        if (!root.classList.contains("is-open")) {
          return;
        }

        if (event.target.closest(".p10-context-drawer__panel")) {
          return;
        }

        closeContextRoot(root);
      });
    });

    if (document.documentElement.dataset.p10ContextEvents === "true") {
      return;
    }

    document.documentElement.dataset.p10ContextEvents = "true";
    document.addEventListener("click", function (event) {
      var button = event.target.closest("[data-p10-context-button]");

      if (!button) {
        return;
      }

      if (openContextPanel(button)) {
        event.preventDefault();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") {
        return;
      }

      toArray(document.querySelectorAll("[data-p10-recommendation-root].is-open")).forEach(closeContextRoot);
    });
  }

  function init() {
    var gsap = window.gsap;

    toArray(document.querySelectorAll("[data-p10-home-shopping-hub]")).forEach(function (root) {
      if (root.dataset.p10Ready === "true") {
        return;
      }

      root.dataset.p10Ready = "true";
      initHub(root, gsap);
    });

    toArray(document.querySelectorAll("[data-p10-mini-arrivals]")).forEach(function (root) {
      if (root.dataset.p10MiniArrivalsReady === "true") {
        return;
      }

      root.dataset.p10MiniArrivalsReady = "true";
      initMiniArrivals(root);
    });

    initRecommendationRoots();
  }

  onReady(init);
})();
