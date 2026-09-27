(function () {
  'use strict';

  let app;
  let loading;
  let mutationQueue = Promise.resolve();

  function failure(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function requireApp() {
    if (!app) throw failure('not_ready', 'Swish is not ready. Check that its app embed is enabled, then retry.');
    return app;
  }

  function discoverApp() {
    return new Promise(function (resolve, reject) {
      let settled = false;
      let importing = false;
      const timeout = setTimeout(function () {
        finish(failure('not_ready', 'Swish did not become ready. Check its app embed and retry.'));
      }, 8000);
      const interval = setInterval(check, 100);

      function finish(error, value) {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        clearInterval(interval);
        if (error) reject(error);
        else resolve(value);
      }

      function check() {
        const loaderUrl = window.WishlistKingAppLoaderURL;
        if (importing || typeof loaderUrl !== 'string' || !loaderUrl) return;
        importing = true;
        import(loaderUrl).then(function (module) {
          if (typeof module.default?.waitForCore !== 'function') {
            throw failure('not_ready', 'The installed Swish loader is not supported.');
          }
          return module.default.waitForCore('wishlist-app');
        }).then(function (module) {
          const candidate = module?.artifact;
          if (
            typeof candidate?.apis?.wishlist?.loadWishlist !== 'function' ||
            typeof candidate.addWishlistItem !== 'function' ||
            typeof candidate.removeWishlistItem !== 'function' ||
            typeof candidate.state?.observeWishlist !== 'function'
          ) throw failure('not_ready', 'The installed Swish app is not ready for this integration.');
          finish(null, candidate);
        }).catch(function () {
          finish(failure('not_ready', 'Swish could not load. Check its app embed and retry.'));
        });
      }

      check();
    });
  }

  async function ready() {
    if (app) return provider;
    if (!loading) {
      loading = discoverApp().then(function (candidate) {
        // Swish clears its submission guard when this observer completes a refresh.
        candidate.state.observeWishlist({ wishlistId: 'mine' }).subscribe(function () {});
        app = candidate;
        return provider;
      }).catch(function (error) {
        loading = undefined;
        throw error;
      });
    }
    return loading;
  }

  function customerId() {
    const current = requireApp();
    if (current.isLoggedIn === false && !current.customer?.id) return null;
    const id = current.customer?.id;
    if (current.isLoggedIn === true && /^(?:[1-9]\d*)$/.test(String(id))) return String(id);
    throw failure('unknown_identity', 'Swish could not confirm the current account. Please sign in again.');
  }

  function isVariantMode() {
    const mode = requireApp().settings?.general?.wishlistMode;
    if (mode !== 'VARIANT' && mode !== 'PRODUCT') {
      throw failure('invalid_configuration', 'Swish wishlist mode could not be confirmed.');
    }
    return mode === 'VARIANT';
  }

  function numericId(value) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : null;
  }

  function normalize(wishlist) {
    if (!wishlist || wishlist.isMine !== true || !Array.isArray(wishlist.items)) {
      throw failure('invalid_response', 'Swish returned an unexpected wishlist response.');
    }
    const items = wishlist.items.map(function (item) {
      const productId = numericId(item?.product?.id);
      const variantId = item?.variantId == null ? null : numericId(item.variantId);
      if (
        typeof item?.id !== 'string' || !item.id || !productId ||
        typeof item.product?.handle !== 'string' || !item.product.handle ||
        (item.variantId != null && !variantId)
      ) throw failure('invalid_response', 'Swish returned an incomplete wishlist item.');
      return {
        id: item.id,
        productId: productId,
        handle: item.product.handle,
        variantId: variantId,
        quantity: numericId(item.quantity) || 1,
        product: item.product
      };
    });
    return { id: wishlist.id, isMine: true, numItems: items.length, items: items };
  }

  async function snapshot() {
    await ready();
    const identity = customerId();
    let response;
    try {
      response = await app.apis.wishlist.loadWishlist({ wishlistId: 'mine', cacheStrategy: 'no-store' });
    } catch (_) {
      throw failure('read_failed', 'Your wishlist could not be loaded from Swish. Please retry.');
    }
    if (identity !== customerId()) throw failure('account_changed', 'Your account changed. Reload your wishlist before continuing.');
    return normalize(response?.wishlist);
  }

  function serialize(operation) {
    const result = mutationQueue.then(operation);
    mutationQueue = result.catch(function () {});
    return result;
  }

  async function mutate(action) {
    try {
      const result = await action();
      if (!result?.wishlistItem?.id) {
        throw failure('busy', 'Swish is still processing another change. Please retry.');
      }
      return result.wishlistItem;
    } catch (error) {
      if (error?.code === 'busy') throw error;
      if (error?.message === 'Wishlist requires login') {
        throw failure('login_required', 'Please sign in to save your wishlist.');
      }
      throw failure('save_failed', 'Swish could not confirm this change. Reload your wishlist before retrying.');
    }
  }

  function add(input) {
    return serialize(async function () {
      const handle = input?.handle;
      const variantId = input?.variantId == null ? undefined : numericId(input.variantId);
      if (typeof handle !== 'string' || !handle || /[\s/?#]/.test(handle) || variantId === null) {
        throw failure('invalid_input', 'Choose a valid product and variant before saving.');
      }
      const before = await snapshot();
      const identity = customerId();
      const existing = before.items.find(function (item) {
        return item.handle === handle && (variantId === undefined || item.variantId === variantId);
      });
      if (existing) return before;
      if (!isVariantMode() && before.items.some(function (item) { return item.handle === handle; })) {
        throw failure('variant_mode_required', 'Swish must allow multiple variants to save another card from this product.');
      }
      const saved = await mutate(function () { return app.addWishlistItem({ productHandle: handle, variantId: variantId }); });
      if (identity !== customerId()) throw failure('account_changed', 'Your account changed. Reload your wishlist before continuing.');
      const after = await snapshot();
      if (!after.items.some(function (item) {
        return item.id === saved.id && item.handle === handle && (variantId === undefined || item.variantId === variantId);
      })) throw failure('unconfirmed', 'Swish has not confirmed the saved item. Reload your wishlist before retrying.');
      return after;
    });
  }

  function remove(id) {
    return serialize(async function () {
      if (typeof id !== 'string' || !id) throw failure('invalid_input', 'Choose a valid saved item to remove.');
      const before = await snapshot();
      const identity = customerId();
      if (!before.items.some(function (item) { return item.id === id; })) return before;
      await mutate(function () { return app.removeWishlistItem({ wishlistItemId: id }); });
      if (identity !== customerId()) throw failure('account_changed', 'Your account changed. Reload your wishlist before continuing.');
      const after = await snapshot();
      if (after.items.some(function (item) { return item.id === id; })) {
        throw failure('unconfirmed', 'Swish has not confirmed the removal. Reload your wishlist before retrying.');
      }
      return after;
    });
  }

  function onChange(callback) {
    const events = [
      'wk:wishlist:add:success', 'wk:wishlist:remove:success',
      'wk:wishlist:change-variant:success', 'wk:wishlist:clear:success',
      'wk:customer:login', 'wk:customer:logout'
    ];
    const listener = function (event) { callback({ type: event.type }); };
    events.forEach(function (name) { document.addEventListener(name, listener); });
    return function () {
      events.forEach(function (name) { document.removeEventListener(name, listener); });
    };
  }

  const provider = { ready: ready, snapshot: snapshot, add: add, remove: remove, isVariantMode: isVariantMode, customerId: customerId, onChange: onChange };
  window.P10SwishProvider = provider;
})();
