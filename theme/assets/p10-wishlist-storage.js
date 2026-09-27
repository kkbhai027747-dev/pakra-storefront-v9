(function (global) {
  'use strict';

  var MAIN_KEY = 'wishlistItem';
  var BACKUP_KEY = 'wishlistItem_backup';

  function fail(message, error, exists) {
    global.console.error('[Wishlist] ' + message, error);
    return { ok: false, exists: Boolean(exists), handles: [], error: error };
  }

  function validHandle(value) {
    return typeof value === 'string' && value.length > 0 && value.trim() === value;
  }

  function unique(handles) {
    return Array.from(new Set(handles));
  }

  function equalLists(left, right) {
    return left.length === right.length && left.every(function (value, index) {
      return value === right[index];
    });
  }

  function read() {
    var raw;

    try {
      raw = global.localStorage.getItem(MAIN_KEY);
    } catch (error) {
      return fail('Unable to read wishlistItem; refusing to write.', error, false);
    }

    if (raw === null) {
      return { ok: true, exists: false, handles: [], original: [], normalized: false };
    }

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return fail('wishlistItem contains invalid JSON; refusing to write.', error, true);
    }

    if (!Array.isArray(parsed) || !parsed.every(validHandle)) {
      return fail('wishlistItem is not a valid string handle array; refusing to write.', new TypeError('Invalid wishlistItem structure'), true);
    }

    var handles = unique(parsed);
    return {
      ok: true,
      exists: true,
      handles: handles,
      original: parsed.slice(),
      normalized: !equalLists(handles, parsed),
    };
  }

  function backUp(state) {
    if (!state.exists || state.original.length === 0) return true;

    try {
      global.localStorage.setItem(BACKUP_KEY, JSON.stringify(state.original));
      return true;
    } catch (error) {
      fail('Unable to back up wishlistItem; refusing to write.', error, state.exists);
      return false;
    }
  }

  function mutate(handle, operation) {
    if (!validHandle(handle)) {
      return fail('Invalid wishlist handle; refusing to write.', new TypeError('Invalid wishlist handle'), false);
    }

    var state = read();
    if (!state.ok) return state;

    var next = state.handles.slice();
    if (operation === 'add') {
      if (!next.includes(handle)) next.push(handle);
    } else {
      next = next.filter(function (savedHandle) {
        return savedHandle !== handle;
      });
    }
    next = unique(next);

    if (!state.normalized && equalLists(next, state.handles)) {
      return { ok: true, exists: state.exists, handles: next, changed: false };
    }

    if (!backUp(state)) {
      return { ok: false, exists: state.exists, handles: state.handles, changed: false };
    }

    try {
      global.localStorage.setItem(MAIN_KEY, JSON.stringify(next));
    } catch (error) {
      return fail('Unable to save wishlistItem.', error, state.exists);
    }

    return { ok: true, exists: true, handles: next, changed: true };
  }

  global.P10WishlistStorage = Object.freeze({
    read: read,
    add: function (handle) {
      return mutate(handle, 'add');
    },
    remove: function (handle) {
      return mutate(handle, 'remove');
    },
  });
})(window);
