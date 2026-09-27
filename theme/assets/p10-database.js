(() => {
  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }
    callback();
  };

  const reducedMotion = () =>
    Boolean(
      window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

  const reveal = (items) => {
    if (!items.length || !window.gsap || reducedMotion()) return;

    const fromVars = { autoAlpha: 0, y: 20 };
    const toVars = {
      autoAlpha: 1,
      y: 0,
      duration: 0.52,
      ease: 'power2.out',
      stagger: 0.06,
      clearProps: 'opacity,visibility,transform',
    };

    if (!('IntersectionObserver' in window)) {
      window.gsap.fromTo(items, fromVars, toVars);
      return;
    }

    const groups = [];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          observer.unobserve(entry.target);
          groups.push(entry.target);
          window.setTimeout(() => {
            if (!groups.length) return;

            const batch = groups.splice(0, groups.length);
            window.gsap.fromTo(batch, fromVars, toVars);
          }, 30);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -8% 0px' },
    );

    items.forEach((item) => observer.observe(item));
  };

  ready(() => {
    reveal(
      Array.from(
        document.querySelectorAll(
          '.p10-database-hero, .prisma-category-guide--database .prisma-grid-item, .p10-wiki-grid [class*="ai-wiki-blog-grid-post-"]',
        ),
      ),
    );
  });
})();
