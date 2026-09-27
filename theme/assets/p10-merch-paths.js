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

  function whenNearViewport(root, callback) {
    if (!root || root.dataset.p10ViewportQueued === "true") {
      return;
    }

    root.dataset.p10ViewportQueued = "true";
    if (!("IntersectionObserver" in window)) {
      callback();
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);
        callback();
      });
    }, { rootMargin: "220px 0px", threshold: 0.01 });

    observer.observe(root);
  }

  function initSection(root, gsap) {
    if (!gsap || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      return;
    }

    var revealItems = toArray(root.querySelectorAll("[data-p10-merch-reveal]"));
    var productCards = toArray(root.querySelectorAll("[data-p10-merch-product]"));

    whenNearViewport(root, function () {
      gsap.set(revealItems, { autoAlpha: 0, y: 24 });
      gsap.to(revealItems, {
        autoAlpha: 1,
        y: 0,
        duration: 0.58,
        ease: "power3.out",
        stagger: 0.08
      });

      gsap.set(productCards, { autoAlpha: 0, y: 18 });
      gsap.to(productCards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.44,
        ease: "power3.out",
        stagger: 0.045,
        delay: 0.18
      });
    });
  }

  function init() {
    var gsap = window.gsap;

    toArray(document.querySelectorAll("[data-p10-merch-paths]")).forEach(function (root) {
      if (root.dataset.p10MerchReady === "true") {
        return;
      }

      root.dataset.p10MerchReady = "true";
      initSection(root, gsap);
    });
  }

  onReady(init);
})();
