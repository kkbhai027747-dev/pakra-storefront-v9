(function () {
  if (window.P10IpMenuSync) return;
  window.P10IpMenuSync = true;

  var pending = null;
  var cachedCards = null;

  function readCards(root) {
    var keys = new Set();
    return Array.from(root.querySelectorAll('[data-p10-ip-directory-card]')).filter(function (card) {
      var key = card.getAttribute('data-p10-ip-key');
      if (!key || keys.has(key) || !card.getAttribute('data-p10-ip-name')) return false;
      keys.add(key);
      return true;
    }).map(function (card) {
      var wrapper = card.closest('.p10-shop-by-ip__card');
      var image = card.querySelector('.p10-shop-by-ip__image');
      return {
        key: card.getAttribute('data-p10-ip-key'),
        name: card.getAttribute('data-p10-ip-name'),
        image: image && image.getAttribute('src'),
        alt: image && image.getAttribute('alt'),
        desktopOnly: wrapper && wrapper.getAttribute('data-p10-ip-desktop-only') === 'true'
      };
    });
  }

  function renderCards(cards) {
    if (!cards.length) return;
    document.querySelectorAll('[data-p10-ip-card-source]').forEach(function (source) {
      var activeCard = source.contains(document.activeElement) && document.activeElement.closest('a');
      var activeHref = activeCard && activeCard.getAttribute('href');
      var fragment = document.createDocumentFragment();

      cards.forEach(function (item) {
        var url = new URL(source.getAttribute('data-p10-ip-directory-url'), window.location.origin);
        url.searchParams.set('ip', item.key);
        var card = document.createElement('a');
        card.className = 'p10-ip-mega__card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('href', url.pathname + url.search);
        card.setAttribute('data-p10-ip-desktop-only', String(item.desktopOnly));

        var media = document.createElement('span');
        media.className = 'p10-ip-mega__media';
        if (item.image) {
          var image = document.createElement('img');
          image.className = 'p10-ip-mega__image';
          image.src = item.image;
          image.alt = item.alt || item.name;
          image.width = 240;
          image.height = 120;
          image.loading = 'lazy';
          media.appendChild(image);
        } else {
          var fallback = document.createElement('span');
          fallback.className = 'p10-ip-mega__fallback';
          fallback.setAttribute('aria-hidden', 'true');
          fallback.textContent = item.name.slice(0, 2).toUpperCase();
          media.appendChild(fallback);
        }

        var name = document.createElement('span');
        name.className = 'p10-ip-mega__name';
        name.textContent = item.name;
        card.append(media, name);
        fragment.appendChild(card);
      });

      source.replaceChildren(fragment);
      source.setAttribute('data-p10-ip-menu-state', 'ready');
      if (activeHref) {
        var replacement = Array.from(source.children).find(function (card) {
          return card.getAttribute('href') === activeHref;
        });
        if (replacement) replacement.focus({ preventScroll: true });
      }
    });
    document.dispatchEvent(new CustomEvent('p10:ip-menu-updated'));
  }

  function sync() {
    var source = document.querySelector('[data-p10-ip-card-source]');
    if (!source) return;
    var localCards = readCards(document);
    if (localCards.length) {
      cachedCards = localCards;
      renderCards(localCards);
      return;
    }
    if (cachedCards) {
      renderCards(cachedCards);
      return;
    }
    if (pending) return;

    var url = new URL(source.getAttribute('data-p10-ip-directory-url'), window.location.origin);
    var theme = window.Shopify && window.Shopify.theme;
    if (theme && theme.role !== 'main') url.searchParams.set('preview_theme_id', theme.id);
    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 8000);
    source.setAttribute('data-p10-ip-menu-state', 'loading');
    pending = fetch(url.href, { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('IP Directory unavailable');
        return response.text();
      })
      .then(function (html) {
        var match = html.match(/Shopify\.theme\s*=\s*(\{[^;\n]+\})\s*;/);
        if (theme && (!match || String(JSON.parse(match[1]).id) !== String(theme.id))) {
          throw new Error('IP Directory theme mismatch');
        }
        var cards = readCards(new DOMParser().parseFromString(html, 'text/html'));
        if (!cards.length) throw new Error('IP Directory is empty');
        cachedCards = cards;
        renderCards(cards);
      })
      .catch(function () { source.setAttribute('data-p10-ip-menu-state', 'fallback'); })
      .finally(function () {
        window.clearTimeout(timeout);
        pending = null;
      });
  }

  function retry(event) {
    var source = document.querySelector('[data-p10-ip-card-source]');
    if (source && source.getAttribute('data-p10-ip-menu-state') === 'fallback' &&
        event.target.closest('.p10-ip-mega, [data-p10-mobile-shop-open]')) sync();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, { once: true });
  else sync();
  document.addEventListener('shopify:section:load', sync);
  document.addEventListener('pointerover', retry);
  document.addEventListener('focusin', retry);
  document.addEventListener('click', retry);
})();
