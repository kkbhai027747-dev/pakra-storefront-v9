(function () {
  var root = document.querySelector("[data-p10-mobile-shop-nav]");

  if (!root) {
    return;
  }

  var drawer = root.querySelector(".p10-mobile-shop-nav__drawer");
  var overlay = root.querySelector(".p10-mobile-shop-nav__overlay");
  var openButtons = Array.prototype.slice.call(root.querySelectorAll("[data-p10-mobile-shop-open]"));
  var closeButtons = Array.prototype.slice.call(root.querySelectorAll("[data-p10-mobile-shop-close]"));
  var hamburger = document.querySelector("[data-mobile-menu]");
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var mobileQuery = window.matchMedia && window.matchMedia("(max-width: 1024px)");
  var lastTrigger = null;

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

  function focusDrawer() {
    var input = drawer && drawer.querySelector("input[type='search']");

    if (input) {
      window.setTimeout(function () {
        input.focus({ preventScroll: true });
      }, 90);
    }
  }

  function openDrawer(trigger) {
    if (!drawer || !isMobile() || root.classList.contains("is-open")) {
      return;
    }

    lastTrigger = trigger || null;
    root.classList.add("is-open");
    document.body.classList.add("p10-mobile-shop-nav-open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.style.transform = "translateY(0)";
    drawer.style.visibility = "visible";
    drawer.style.opacity = "1";

    if (overlay) {
      overlay.setAttribute("aria-hidden", "false");
      overlay.style.opacity = "1";
      overlay.style.visibility = "visible";
    }

    setButtonState(true);

    if (window.gsap && (!reducedMotion || !reducedMotion.matches)) {
      window.gsap.fromTo(drawer, { yPercent: 104, autoAlpha: 1 }, { yPercent: 0, autoAlpha: 1, duration: 0.34, ease: "power3.out", overwrite: "auto" });
      window.gsap.fromTo(drawer.querySelectorAll(".p10-mobile-shop-nav__card, .p10-mobile-shop-nav__tags a"), { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.24, ease: "power2.out", stagger: 0.025, delay: 0.05, overwrite: "auto" });
    }

    focusDrawer();
  }

  function closeDrawer() {
    if (!drawer || !root.classList.contains("is-open")) {
      return;
    }

    function finishClose() {
      root.classList.remove("is-open");
      document.body.classList.remove("p10-mobile-shop-nav-open");
      drawer.setAttribute("aria-hidden", "true");

      if (overlay) {
        overlay.setAttribute("aria-hidden", "true");
        overlay.style.opacity = "";
        overlay.style.visibility = "";
      }

      drawer.style.transform = "";
      drawer.style.opacity = "";
      drawer.style.visibility = "";

      setButtonState(false);

      if (lastTrigger && typeof lastTrigger.focus === "function") {
        lastTrigger.focus({ preventScroll: true });
      }
    }

    if (window.gsap && (!reducedMotion || !reducedMotion.matches)) {
      window.gsap.to(drawer, { yPercent: 104, autoAlpha: 1, duration: 0.2, ease: "power2.in", overwrite: "auto", onComplete: finishClose });
    } else {
      finishClose();
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
      closeDrawer();
    }
  });

  if (mobileQuery && typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", function (event) {
      if (!event.matches) {
        closeDrawer();
      }
    });
  }

  if (window.location.hash === "#shop-menu" || window.location.search.indexOf("p10_shop_menu=1") !== -1) {
    window.setTimeout(function () {
      openDrawer(null);
    }, 350);
  }
})();
