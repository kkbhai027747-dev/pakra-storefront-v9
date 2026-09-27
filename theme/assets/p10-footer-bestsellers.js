(function () {
  function toArray(value) {
    return Array.prototype.slice.call(value || []);
  }

  function groupSize() {
    if (window.matchMedia && window.matchMedia('(max-width: 749px)').matches) return 2;
    if (window.matchMedia && window.matchMedia('(max-width: 1199px)').matches) return 4;
    return 7;
  }

  function initFooterBestsellers(root) {
    if (!root || root.dataset.p10FooterBestsellersReady === 'true') return;
    root.dataset.p10FooterBestsellersReady = 'true';

    var items = toArray(root.querySelectorAll('[data-p10-footer-bestseller-item]'));
    var prev = root.querySelector('[data-p10-footer-bestseller-prev]');
    var next = root.querySelector('[data-p10-footer-bestseller-next]');
    var dotsRoot = root.querySelector('[data-p10-footer-bestseller-dots]');
    var intervalMs = Number(root.dataset.interval || 15000);
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var currentGroup = 0;
    var currentSize = groupSize();
    var timer = null;
    var inView = false;

    if (!items.length) return;

    function totalGroups() {
      return Math.max(1, Math.ceil(items.length / currentSize));
    }

    function renderDots() {
      if (!dotsRoot) return;
      dotsRoot.innerHTML = '';
      for (var i = 0; i < totalGroups(); i += 1) {
        var dot = document.createElement('span');
        dot.className = 'p10-footer-bestsellers__dot';
        if (i === currentGroup) dot.classList.add('is-active');
        dotsRoot.appendChild(dot);
      }
    }

    function setActive(group) {
      var groups = totalGroups();
      currentGroup = (group + groups) % groups;
      var start = currentGroup * currentSize;
      var end = start + currentSize;

      items.forEach(function (item, index) {
        if (index >= start && index < end) {
          item.hidden = false;
          item.removeAttribute('aria-hidden');
        } else {
          item.hidden = true;
          item.setAttribute('aria-hidden', 'true');
        }
      });

      toArray(dotsRoot && dotsRoot.children).forEach(function (dot, index) {
        dot.classList.toggle('is-active', index === currentGroup);
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || timer || intervalMs < 1000 || totalGroups() < 2 || !inView || document.hidden) return;
      timer = window.setInterval(function () {
        setActive(currentGroup + 1);
      }, intervalMs);
    }

    function setInView(nextInView) {
      inView = nextInView;
      if (inView) {
        start();
      } else {
        stop();
      }
    }

    function rebuild() {
      var nextSize = groupSize();
      if (nextSize === currentSize) return;
      currentSize = nextSize;
      currentGroup = 0;
      renderDots();
      setActive(0);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        setActive(currentGroup - 1);
        stop();
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setActive(currentGroup + 1);
        stop();
        start();
      });
    }

    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    window.addEventListener('resize', rebuild);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

    renderDots();
    setActive(0);
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.target === root) setInView(entry.isIntersecting);
        });
      }, { rootMargin: '220px 0px' });
      observer.observe(root);
    } else {
      setInView(true);
    }
  }

  function initAll(scope) {
    toArray((scope || document).querySelectorAll('[data-p10-footer-bestsellers]')).forEach(initFooterBestsellers);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initAll(document);
    });
  } else {
    initAll(document);
  }

  document.addEventListener('shopify:section:load', function (event) {
    initAll(event.target);
  });
})();
