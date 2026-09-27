(function () {
  'use strict';

  const element = document.getElementById('p10-swish-config');
  if (!element) return;
  const config = JSON.parse(element.textContent);
  const provider = window.P10SwishProvider;
  let started = false;
  let readyPromise;
  let snapshot = null;
  let busy = false;
  let epoch = 0;
  let refreshTimer;
  let migration;
  let chooser;
  let identityChanged = false;
  const products = new Map();

  function showStatus(message, isError = false) {
    let status = document.querySelector('[data-p10-swish-status]');
    if (!status) {
      status = document.createElement('div');
      status.className = 'p10-swish-toast';
      status.dataset.p10SwishStatus = '';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      document.body.append(status);
    }
    status.textContent = message;
    status.classList.toggle('p10-swish-error', isError);
    status.hidden = !message;
    const retry = document.querySelector('[data-p10-swish-retry]');
    if (retry) retry.hidden = !isError;
  }

  function selectedVariant(button) {
    const explicit = button.dataset.variantId;
    if (explicit && /^\d+$/.test(explicit)) return explicit;
    const form = button.closest('form[action*="/cart/add"]');
    const value = form?.querySelector('[name="id"]')?.value;
    return value && /^\d+$/.test(value) ? value : '';
  }

  function refreshButtons() {
    document.querySelectorAll('[data-wishlist]').forEach(button => {
      const handle = button.dataset.wishlistHandle;
      const variantId = selectedVariant(button);
      const saved = snapshot?.items.some(item => item.handle === handle && (!variantId || String(item.variantId) === variantId));
      button.classList.toggle('wishlist-added', Boolean(saved));
      button.setAttribute('aria-pressed', String(Boolean(saved)));
      button.setAttribute('aria-disabled', String(busy));
      const label = saved ? (variantId ? config.strings.remove : config.strings.manage) : config.strings.add;
      button.setAttribute('aria-label', label);
      button.querySelectorAll('.text, .visually-hidden').forEach(text => { if (text.textContent !== label) text.textContent = label; });
    });
    document.querySelectorAll('[data-wishlist-count]').forEach(counter => {
      const count = snapshot ? String(snapshot.numItems) : '–';
      if (counter.textContent !== count) counter.textContent = count;
    });
  }

  function setBusy(value) {
    busy = value;
    refreshButtons();
  }

  function invalidate() {
    epoch += 1;
    snapshot = null;
    if (chooser?.open) chooser.close();
    document.querySelector('[data-p10-swish-native]')?.setAttribute('hidden', '');
    refreshButtons();
  }

  function accountChanged() {
    identityChanged = true;
    invalidate();
    document.querySelector('[data-p10-swish-migration]')?.setAttribute('hidden', '');
    showStatus(config.strings.accountChanged, true);
    return new Error(config.strings.accountChanged);
  }

  async function verifyAccount() {
    const currentEpoch = epoch;
    const url = new URL(config.rootUrl, location.origin);
    url.searchParams.set('sections', 'main-wishlist-page');
    const response = await fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(config.strings.unavailable);
    const sections = await response.json();
    const html = sections['main-wishlist-page'];
    if (typeof html !== 'string') throw new Error(config.strings.unavailable);
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const account = doc.querySelector('[data-p10-wishlist-account]');
    if (!account) throw new Error(config.strings.unavailable);
    if (identityChanged || account.dataset.p10WishlistAccount !== config.accountId || (provider.customerId() || '') !== config.accountId) {
      throw accountChanged();
    }
    if (currentEpoch !== epoch) throw new Error(config.strings.unavailable);
    return config.accountId;
  }

  async function refresh() {
    const currentEpoch = epoch;
    let next;
    try { next = await provider.snapshot(); }
    catch (error) { if (error.code === 'account_changed') throw accountChanged(); throw error; }
    if (identityChanged || (provider.customerId() || '') !== config.accountId) throw accountChanged();
    if (currentEpoch !== epoch) throw new Error(config.strings.unavailable);
    snapshot = next;
    refreshButtons();
    return next;
  }

  function scheduleRefresh(event) {
    clearTimeout(refreshTimer);
    if (event.type === 'wk:customer:login' || event.type === 'wk:customer:logout') { accountChanged(); return; }
    refreshTimer = setTimeout(() => {
      if (!busy && !identityChanged && !document.hidden) refresh().catch(() => showStatus(identityChanged ? config.strings.accountChanged : config.strings.unavailable, true));
    }, 150);
  }

  function ensureReady() {
    if (identityChanged) return Promise.reject(new Error(config.strings.accountChanged));
    if (!readyPromise) {
      readyPromise = (async () => {
        await provider.ready();
        if ((provider.customerId() || '') !== config.accountId) throw accountChanged();
        if (!provider.isVariantMode()) throw new Error(config.strings.unavailable);
        await refresh();
        const root = document.querySelector('[data-p10-swish-migration]');
        if (root && !migration) {
          migration = window.P10SwishMigration.init({ root, provider, config, verifyAccount, refresh, setBusy, showStatus });
        }
        document.querySelector('[data-p10-swish-native]')?.removeAttribute('hidden');
        if (document.querySelector('[data-p10-swish-migration]')) showStatus(config.accountId ? '' : config.strings.signInNote);
      })().catch(error => { readyPromise = null; throw error; });
    }
    return readyPromise;
  }

  async function productFor(handle) {
    if (!handle || /[\s/?#]/.test(handle) || handle === '.' || handle === '..') throw new Error(config.strings.unavailable);
    if (!products.has(handle)) {
      products.set(handle, fetch(config.rootUrl + 'products/' + encodeURIComponent(handle) + '.js', { credentials: 'same-origin' })
        .then(response => { if (!response.ok) throw new Error(config.strings.unavailable); return response.json(); })
        .catch(error => { products.delete(handle); throw error; }));
    }
    return products.get(handle);
  }

  function chooseVariant(product) {
    if (chooser) chooser.remove();
    chooser = document.createElement('dialog');
    chooser.className = 'p10-swish-chooser';
    const heading = document.createElement('h2');
    heading.id = 'p10-swish-chooser-title';
    heading.textContent = config.strings.chooseVariant;
    chooser.setAttribute('aria-labelledby', heading.id);
    const title = document.createElement('p');
    title.textContent = product.title;
    const select = document.createElement('select');
    select.setAttribute('aria-label', config.strings.chooseVariant);
    const placeholder = new Option(config.strings.chooseVariant, '');
    select.append(placeholder);
    product.variants.forEach(variant => {
      const saved = snapshot.items.some(item => String(item.variantId) === String(variant.id));
      select.append(new Option(variant.title + (saved ? ' · ' + config.strings.saved : ''), String(variant.id)));
    });
    const actions = document.createElement('div');
    actions.className = 'p10-swish-actions';
    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'p10-swish-button';
    confirm.textContent = config.strings.continue;
    confirm.disabled = true;
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'p10-swish-button p10-swish-button--secondary';
    cancel.textContent = config.strings.cancel;
    actions.append(cancel, confirm);
    chooser.append(heading, title, select, actions);
    document.body.append(chooser);
    select.addEventListener('change', () => { confirm.disabled = !select.value; });
    return new Promise(resolve => {
      let choice = '';
      confirm.addEventListener('click', () => { choice = select.value; chooser.close(); });
      cancel.addEventListener('click', () => chooser.close());
      chooser.addEventListener('close', () => resolve(choice), { once: true });
      chooser.showModal();
    });
  }

  async function toggle(button) {
    if (busy) return;
    if (!config.accountId) {
      const login = new URL(config.loginUrl, location.origin);
      login.searchParams.set('return_to', location.pathname + location.search);
      location.assign(login.href);
      return;
    }
    setBusy(true);
    const currentEpoch = epoch;
    try {
      await ensureReady();
      const handle = button.dataset.wishlistHandle;
      const product = await productFor(handle);
      let variantId = selectedVariant(button);
      if (!product.variants.some(variant => String(variant.id) === variantId)) {
        variantId = product.variants.length === 1 ? String(product.variants[0].id) : await chooseVariant(product);
      }
      if (!variantId) return;
      await verifyAccount();
      if (currentEpoch !== epoch) throw new Error(config.strings.accountChanged);
      await refresh();
      const existing = snapshot.items.find(item => item.handle === handle && String(item.variantId) === variantId);
      if (existing) await provider.remove(existing.id);
      else await provider.add({ handle, variantId });
      if (currentEpoch !== epoch) throw new Error(config.strings.accountChanged);
      await refresh();
      showStatus(existing ? config.strings.removed : config.strings.saved);
    } catch (error) {
      if (error.code === 'account_changed') accountChanged();
      showStatus(identityChanged || error.message === config.strings.accountChanged ? config.strings.accountChanged : config.strings.unavailable, true);
    } finally { setBusy(false); }
  }

  function init() {
    if (started) return;
    started = true;
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-wishlist]');
      if (button) { event.preventDefault(); toggle(button); }
      if (event.target.closest('[data-p10-swish-retry]')) {
        if (identityChanged) { location.reload(); return; }
        readyPromise = null;
        ensureReady().catch(() => showStatus(identityChanged ? config.strings.accountChanged : config.strings.unavailable, true));
      }
    });
    document.addEventListener('change', () => requestAnimationFrame(refreshButtons));
    const observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes].some(node => node.nodeType === 1 && (node.matches('[data-wishlist], [data-wishlist-count]') || node.querySelector('[data-wishlist], [data-wishlist-count]'))))) refreshButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    provider.onChange(scheduleRefresh);
    window.addEventListener('pagehide', invalidate);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) invalidate();
      else if (readyPromise) verifyAccount().then(refresh).then(() => document.querySelector('[data-p10-swish-native]')?.removeAttribute('hidden')).catch(error => showStatus(error.message === config.strings.accountChanged ? config.strings.accountChanged : config.strings.unavailable, true));
    });
    window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
    refreshButtons();
    ensureReady().catch(() => { if (document.querySelector('[data-p10-swish-migration]')) showStatus(identityChanged ? config.strings.accountChanged : config.strings.unavailable, true); });
  }

  window.P10SwishWishlist = Object.freeze({ init, refreshButtons });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
