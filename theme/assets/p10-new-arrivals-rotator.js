(function () {
  function initRotator(root) {
    if (!root || root.dataset.p10NewArrivalsReady === 'true') return;
    root.dataset.p10NewArrivalsReady = 'true';

    var slides = Array.prototype.slice.call(root.querySelectorAll('[data-p10-arrival-slide]'));
    var thumbs = Array.prototype.slice.call(root.querySelectorAll('[data-p10-arrival-thumb]'));
    var prev = root.querySelector('[data-p10-arrival-prev]');
    var next = root.querySelector('[data-p10-arrival-next]');
    var intervalMs = Number(root.dataset.interval || 15000);
    var current = 0;
    var timer = null;
    var inView = false;
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (slides.length < 2) return;

    function setActive(index) {
      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        var isActive = slideIndex === current;
        slide.classList.toggle('is-active', isActive);
        if (isActive) {
          slide.removeAttribute('aria-hidden');
        } else {
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      thumbs.forEach(function (thumb, thumbIndex) {
        var isActive = thumbIndex === current;
        thumb.classList.toggle('is-active', isActive);
        thumb.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function start() {
      if (reduceMotion || timer || intervalMs < 1000 || !inView || document.hidden) return;
      timer = window.setInterval(function () {
        setActive(current + 1);
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

    if (prev) {
      prev.addEventListener('click', function () {
        setActive(current - 1);
        stop();
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        setActive(current + 1);
        stop();
        start();
      });
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        setActive(Number(thumb.dataset.p10ArrivalThumb || 0));
        stop();
        start();
      });
    });

    root.addEventListener('pointerenter', stop);
    root.addEventListener('pointerleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });

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
    Array.prototype.slice.call((scope || document).querySelectorAll('[data-p10-new-arrivals]')).forEach(initRotator);
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
