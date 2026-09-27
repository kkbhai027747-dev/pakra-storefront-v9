(function (global) {
  'use strict';

  var PAGE_SIZE = 100;
  var instances = new WeakMap();
  var DEFAULTS = {
    migration_title: 'Bring over your old wishlist',
    migration_found: '{count} items remain in this browser. Select only the items that belong to you.',
    migration_confirm: 'These selected items belong to me. Import them into the account I am signed in to.',
    migration_import: 'Import selected items',
    migration_backup_notice: 'The current browser list is missing or unreadable. An older backup is available and may include items you previously removed.',
    migration_backup_preview: 'Review the older backup',
    migration_backup_active: 'You are reviewing an older backup. Nothing will be restored without your selection.',
    migration_invalid: 'The old browser list could not be read. Its original data has been kept.',
    migration_login: 'Sign in to review and import',
    migration_login_notice: 'Sign in before importing. Browser records are not linked to an account yet.',
    migration_choose_variant: 'Choose a card or variant',
    migration_loading: 'Loading product…',
    migration_item_error: 'This product could not be loaded. Its old record has been kept.',
    migration_retry: 'Try again',
    migration_previous: 'Previous',
    migration_next: 'Next',
    migration_page: 'Page {page} of {pages}',
    migration_selected: '{count} selected. Up to 100 items are imported at a time.',
    migration_working: 'Importing {current} of {total}…',
    migration_done: '{imported} imported; {existing} existing product records kept; {failed} need attention.',
    migration_account_changed: 'Your sign-in has changed or expired. Reload this page and confirm the account before trying again.',
    migration_locked: 'Another tab is importing this browser list. Try again after it finishes.',
    migration_storage_error: 'Import progress cannot be saved in this browser. No old records have been deleted.',
    migration_error: 'Import stopped. Your old records have been kept; you can retry unfinished items.',
    migration_item_failed: 'Could not confirm this item was saved. Retry to check before adding it again.'
  };

  function parseHandles(raw) {
    if (raw === null) return { state: 'missing', handles: [] };
    try {
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.every(function (value) {
        return typeof value === 'string' && value.length > 0 && value.trim() === value;
      })) throw new Error('Invalid legacy list');
      return { state: 'valid', handles: Array.from(new Set(list)) };
    } catch (_) {
      return { state: 'invalid', handles: [] };
    }
  }

  function init(options) {
    var root = options.root;
    if (!root) return { refresh: function () {} };
    if (instances.has(root)) return instances.get(root);
    var provider = options.provider;
    var config = options.config || {};
    var accountId = String(config.accountId || '');
    var receiptKey = 'p10_swish_migration_v1:' + accountId;
    var rows = new Map();
    var source = null;
    var usingBackup = false;
    var page = 0;
    var confirmed = false;
    var busy = false;
    var activeLoads = 0;
    var loadQueue = [];
    var receipt = {};
    var notice = '';
    var fallback = null;
    var controller = { refresh: reload };
    instances.set(root, controller);
    root.dataset.p10MigrationInitialized = 'true';

    function text(key, values) {
      var message = (config.strings && config.strings[key]) || DEFAULTS[key] || key;
      return message.replace(/\{(\w+)\}/g, function (match, name) {
        return values && values[name] !== undefined ? String(values[name]) : match;
      });
    }

    function element(tag, className, value) {
      var node = global.document.createElement(tag);
      if (className) node.className = className;
      if (value !== undefined) node.textContent = value;
      return node;
    }

    function button(label, action, disabled, focusKey) {
      var node = element('button', 'p10-swish-button', label);
      node.type = 'button';
      node.disabled = Boolean(disabled || busy);
      if (focusKey) node.dataset.migrationFocus = focusKey;
      node.addEventListener('click', action);
      return node;
    }

    function report(key, isError, values) {
      notice = text(key, values);
      options.showStatus(notice, Boolean(isError));
      render();
    }

    function readReceipt() {
      var raw = global.localStorage.getItem(receiptKey);
      if (raw === null) return {};
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.completed) ||
          !parsed.completed.every(function (handle) { return typeof handle === 'string'; })) {
        throw new Error('Invalid migration receipt');
      }
      return Object.fromEntries(parsed.completed.map(function (handle) { return [handle, true]; }));
    }

    function saveReceipt(next) {
      global.localStorage.setItem(receiptKey, JSON.stringify({ version: 1, completed: Object.keys(next) }));
      receipt = next;
    }

    function complete(handle) {
      var next = readReceipt();
      Object.defineProperty(next, handle, { value: true, enumerable: true, configurable: true });
      saveReceipt(next);
      rows.delete(handle);
    }

    function pendingHandles() {
      return source ? source.handles.filter(function (handle) {
        return !Object.prototype.hasOwnProperty.call(receipt, handle);
      }) : [];
    }

    function reload() {
      if (busy) return;
      try {
        var main = parseHandles(global.localStorage.getItem('wishlistItem'));
        receipt = accountId ? readReceipt() : {};
        if (main.state === 'valid') {
          source = main;
          fallback = null;
          usingBackup = false;
        } else {
          var backup = parseHandles(global.localStorage.getItem('wishlistItem_backup'));
          fallback = backup.state === 'valid' && backup.handles.some(function (handle) {
            return !Object.prototype.hasOwnProperty.call(receipt, handle);
          }) ? backup : null;
          if (!usingBackup) source = null;
          if (!fallback && main.state === 'invalid') notice = text('migration_invalid');
        }
        render();
      } catch (_) {
        source = null;
        fallback = null;
        notice = text('migration_storage_error');
        render();
      }
    }

    function rowState(handle) {
      if (!rows.has(handle)) rows.set(handle, {
        handle: handle, selected: false, loading: false, product: null, variantId: '', error: ''
      });
      return rows.get(handle);
    }

    function queueProduct(row) {
      if (row.loading || row.product) return;
      row.loading = true;
      row.error = '';
      loadQueue.push(row);
      pumpProducts();
      render();
    }

    function pumpProducts() {
      while (activeLoads < 4 && loadQueue.length) {
        var row = loadQueue.shift();
        activeLoads += 1;
        loadProduct(row).finally(function () {
          activeLoads -= 1;
          pumpProducts();
        });
      }
    }

    async function loadProduct(row) {
      var abort = new AbortController();
      var timeout = global.setTimeout(function () { abort.abort(); }, 15000);
      try {
        var base = new URL(config.rootUrl || '/', global.location.origin);
        if (base.origin !== global.location.origin) throw new Error('Invalid store root');
        var url = new URL('products/' + encodeURIComponent(row.handle) + '.js', base);
        var response = await global.fetch(url.href, {
          credentials: 'same-origin', redirect: 'error', signal: abort.signal,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Product unavailable');
        var product = await response.json();
        if (!product || !Number.isSafeInteger(product.id) || product.id <= 0 || !Array.isArray(product.variants) ||
            !product.variants.length || !product.variants.every(function (variant) {
              return Number.isSafeInteger(variant.id) && variant.id > 0;
            })) throw new Error('Invalid product');
        row.product = product;
        row.variantId = product.variants.length === 1 ? String(product.variants[0].id) : '';
      } catch (_) {
        row.error = text('migration_item_error');
      } finally {
        global.clearTimeout(timeout);
        row.loading = false;
        render();
      }
    }

    function renderRow(handle, index) {
      var row = rowState(handle);
      var item = element('li', 'p10-swish-migration__row');
      var label = element('label');
      var check = element('input');
      check.type = 'checkbox';
      check.checked = row.selected;
      check.disabled = busy;
      check.dataset.migrationFocus = 'item-' + index;
      check.addEventListener('change', function () {
        row.selected = check.checked;
        if (row.selected) queueProduct(row);
        render();
      });
      label.append(check, element('span', '', row.product ? row.product.title : handle));
      item.append(label);
      if (row.loading) item.append(element('span', 'p10-swish-migration__note', text('migration_loading')));
      if (row.selected && row.product && row.product.variants.length > 1) {
        var select = element('select');
        select.setAttribute('aria-label', text('migration_choose_variant') + ': ' + row.product.title);
        select.disabled = busy;
        select.dataset.migrationFocus = 'variant-' + index;
        var placeholder = element('option', '', text('migration_choose_variant'));
        placeholder.value = '';
        select.append(placeholder);
        row.product.variants.forEach(function (variant) {
          var option = element('option', '', variant.title);
          option.value = String(variant.id);
          select.append(option);
        });
        select.value = row.variantId;
        select.addEventListener('change', function () { row.variantId = select.value; render(); });
        item.append(select);
      }
      if (row.error) {
        item.append(element('span', 'p10-swish-migration__status', row.error));
        if (!row.product) item.append(button(text('migration_retry'), function () {
          row.selected = true;
          queueProduct(row);
        }, row.loading, 'retry-' + index));
      }
      return item;
    }

    function render() {
      var focus = root.contains(global.document.activeElement) && global.document.activeElement.dataset.migrationFocus;
      var handles = pendingHandles();
      root.replaceChildren();
      root.hidden = !handles.length && !fallback && !notice;
      if (root.hidden) return;
      root.append(element('h2', 'p10-swish-migration__title', text('migration_title')));
      if (notice) {
        var status = element('p', 'p10-swish-migration__status', notice);
        status.setAttribute('role', 'status');
        root.append(status);
      }
      if (!accountId) {
        root.append(element('p', 'p10-swish-migration__note', text('migration_login_notice')));
        var login = element('a', 'p10-swish-button', text('migration_login'));
        var loginUrl = new URL(config.loginUrl || 'account/login', new URL(config.rootUrl || '/', global.location.origin));
        if (loginUrl.protocol === 'https:' || loginUrl.origin === global.location.origin) login.href = loginUrl.href;
        root.append(login);
        return;
      }
      if (!source && fallback) {
        root.append(element('p', 'p10-swish-migration__note', text('migration_backup_notice')),
          button(text('migration_backup_preview'), function () {
            source = fallback;
            usingBackup = true;
            confirmed = false;
            page = 0;
            render();
          }, false, 'backup'));
        return;
      }
      if (!handles.length) return;
      if (usingBackup) root.append(element('p', 'p10-swish-migration__note', text('migration_backup_active')));
      root.append(element('p', 'p10-swish-migration__note', text('migration_found', { count: handles.length })));
      var pages = Math.ceil(handles.length / PAGE_SIZE);
      page = Math.min(page, pages - 1);
      var list = element('ul', 'p10-swish-migration__list');
      handles.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach(function (handle, index) {
        list.append(renderRow(handle, page * PAGE_SIZE + index));
      });
      root.append(list);
      if (pages > 1) {
        var pagination = element('div', 'p10-swish-migration__controls');
        pagination.append(button(text('migration_previous'), function () { page -= 1; render(); }, page === 0, 'previous'),
          element('span', '', text('migration_page', { page: page + 1, pages: pages })),
          button(text('migration_next'), function () { page += 1; render(); }, page === pages - 1, 'next'));
        root.append(pagination);
      }
      var ownership = element('label', 'p10-swish-migration__confirm');
      var check = element('input');
      check.type = 'checkbox';
      check.checked = confirmed;
      check.disabled = busy;
      check.dataset.migrationFocus = 'confirm';
      check.addEventListener('change', function () { confirmed = check.checked; render(); });
      ownership.append(check, element('span', '', text('migration_confirm')));
      var selected = Array.from(rows.values()).filter(function (row) { return row.selected && handles.includes(row.handle); });
      var ready = selected.length && selected.every(function (row) { return row.product && row.variantId && !row.loading; });
      root.append(ownership, element('p', 'p10-swish-migration__note', text('migration_selected', { count: selected.length })),
        button(text('migration_import'), startImport, !confirmed || !ready, 'import'));
      if (focus) {
        Array.from(root.querySelectorAll('[data-migration-focus]')).some(function (node) {
          if (node.dataset.migrationFocus !== focus) return false;
          node.focus({ preventScroll: true });
          return true;
        });
      }
    }

    async function checkAccount() {
      try {
        if (!accountId || String(provider.customerId() || '') !== accountId) throw new Error('account');
        if (await options.verifyAccount() === false || String(provider.customerId() || '') !== accountId) {
          throw new Error('account');
        }
      } catch (_) {
        throw new Error('account');
      }
    }

    function accountError(error) {
      return error.message === 'account' || ['account_changed', 'unknown_identity', 'login_required'].includes(error.code);
    }

    async function importBatch() {
      var imported = 0;
      var existing = 0;
      var failed = 0;
      try {
        await provider.ready();
        await checkAccount();
        receipt = readReceipt();
        saveReceipt(receipt);
        var pending = new Set(pendingHandles());
        var selected = Array.from(rows.values()).filter(function (row) {
          return pending.has(row.handle) && row.selected && row.product && row.variantId;
        }).slice(0, PAGE_SIZE);
        for (var index = 0; index < selected.length; index += 1) {
          var row = selected[index];
          await checkAccount();
          var cloud = await provider.snapshot();
          await checkAccount();
          if (!cloud || !Array.isArray(cloud.items)) throw new Error('snapshot');
          var present = cloud.items.some(function (item) {
            return String(item.productId) === String(row.product.id) || item.handle === row.handle;
          });
          report('migration_working', false, { current: index + 1, total: selected.length });
          if (present) {
            complete(row.handle);
            existing += 1;
            continue;
          }
          try {
            await checkAccount();
            await provider.add({ handle: row.handle, variantId: Number(row.variantId) });
            await checkAccount();
          } catch (error) {
            if (accountError(error)) throw error;
            failed += 1;
            row.error = text('migration_item_failed');
            continue;
          }
          complete(row.handle);
          imported += 1;
        }
        await options.refresh();
        report('migration_done', failed > 0, { imported: imported, existing: existing, failed: failed });
      } catch (error) {
        confirmed = false;
        report(accountError(error) ? 'migration_account_changed' :
          error.name === 'QuotaExceededError' || error.name === 'SecurityError' || error.message === 'Invalid migration receipt' ?
            'migration_storage_error' : 'migration_error', true);
      }
    }

    async function startImport() {
      if (busy || !confirmed || !accountId) return;
      busy = true;
      options.setBusy(true);
      render();
      try {
        if (global.navigator.locks && global.navigator.locks.request) {
          await global.navigator.locks.request('p10-swish-legacy-import-v1', { ifAvailable: true }, async function (lock) {
            if (!lock) { report('migration_locked', true); return; }
            await importBatch();
          });
        } else {
          await importBatch();
        }
      } catch (_) {
        report('migration_error', true);
      } finally {
        busy = false;
        options.setBusy(false);
        render();
      }
    }

    global.addEventListener('storage', function (event) {
      if ([receiptKey, 'wishlistItem', 'wishlistItem_backup'].includes(event.key)) reload();
    });
    global.addEventListener('pageshow', function () { if (!busy) { confirmed = false; reload(); } });
    global.document.addEventListener('visibilitychange', function () {
      if (global.document.visibilityState === 'visible' && !busy) { confirmed = false; render(); }
    });
    reload();
    return controller;
  }

  global.P10SwishMigration = Object.freeze({ init: init });
})(window);
