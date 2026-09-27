(function () {
  function onReady(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  }

  function getArticleContent() {
    return document.querySelector('.p10-editorial--article .article-content');
  }

  function addReadingProgress(article) {
    if (!article || document.querySelector('.p10-reading-progress')) return;

    var progress = document.createElement('div');
    progress.className = 'p10-reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span class="p10-reading-progress__bar"></span>';
    document.body.appendChild(progress);

    var bar = progress.querySelector('.p10-reading-progress__bar');
    var update = function () {
      var rect = article.getBoundingClientRect();
      var scrollable = Math.max(1, rect.height - window.innerHeight);
      var progressValue = Math.min(1, Math.max(0, -rect.top / scrollable));
      bar.style.width = (progressValue * 100).toFixed(2) + '%';
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function addReadingTime(content) {
    var info = document.querySelector('.p10-editorial--article .article-heading .info');
    if (!content || !info || info.querySelector('.p10-reading-time')) return;

    var words = content.textContent.trim().split(/\s+/).filter(Boolean).length;
    if (!words) return;

    var minutes = Math.max(1, Math.ceil(words / 220));
    var item = document.createElement('span');
    item.className = 'info-item p10-reading-time';
    item.textContent = minutes + ' min read';
    info.appendChild(item);
  }

  function animateWithObserver(items, fromVars, toVars) {
    if (!items.length || !window.gsap) return;

    if (!('IntersectionObserver' in window)) {
      window.gsap.fromTo(items, fromVars, toVars);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        window.gsap.fromTo(entry.target, fromVars, toVars);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  onReady(function () {
    var article = document.querySelector('.p10-editorial--article');
    var content = getArticleContent();
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    addReadingProgress(article);
    addReadingTime(content);

    if (!window.gsap || reduceMotion) return;

    window.gsap.defaults({ duration: 0.58, ease: 'power2.out' });

    if (article) {
      var articleTimeline = window.gsap.timeline();
      articleTimeline
        .from('.p10-editorial--article .page-header', { autoAlpha: 0, y: 12, duration: 0.35 })
        .from('.p10-editorial--article .article-heading .title', { autoAlpha: 0, y: 22 }, '-=0.12')
        .from('.p10-editorial--article .info-item', { autoAlpha: 0, y: 10, stagger: 0.06, duration: 0.38 }, '-=0.18')
        .from('.p10-editorial--article .p10-article-link', { autoAlpha: 0, y: 10, stagger: 0.06, duration: 0.38 }, '-=0.2');

      animateWithObserver(
        Array.prototype.slice.call(document.querySelectorAll('.p10-editorial--article .article-content > *')),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' }
      );
    }

    animateWithObserver(
      Array.prototype.slice.call(document.querySelectorAll('.p10-blog-hero, .blog-layout-default .blog-block-item > .item, .p10-blog-hub__header, .p10-blog-hub__card')),
      { autoAlpha: 0, y: 20 },
      { autoAlpha: 1, y: 0, clearProps: 'opacity,visibility,transform' }
    );
  });
})();
