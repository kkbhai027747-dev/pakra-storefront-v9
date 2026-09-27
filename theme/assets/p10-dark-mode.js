(() => {
  'use strict';

  if (window.__p10DarkModeController) return;
  window.__p10DarkModeController = true;

  const STORAGE_KEY = 'p10-color-mode';
  const VALID_MODES = new Set(['light', 'dark']);
  const systemPreference = window.matchMedia?.('(prefers-color-scheme: dark)');
  let sessionPreference = '';

  function readStoredPreference() {
    try {
      const value = window.localStorage.getItem(STORAGE_KEY);
      return VALID_MODES.has(value) ? value : '';
    } catch {
      return '';
    }
  }

  function systemMode() {
    return systemPreference?.matches ? 'dark' : 'light';
  }

  function effectiveMode() {
    return sessionPreference || readStoredPreference() || systemMode();
  }

  function syncButtons(mode) {
    const dark = mode === 'dark';
    document.querySelectorAll('[data-p10-theme-toggle]').forEach((button) => {
      const label = `Switch to ${dark ? 'light' : 'dark'} mode`;
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', label);
      button.title = dark ? 'Light mode' : 'Dark mode';
      const text = button.querySelector('[data-p10-theme-toggle-label]');
      if (text) text.textContent = label;
    });
  }

  function applyMode(mode, persist = false) {
    const safeMode = VALID_MODES.has(mode) ? mode : systemMode();
    document.documentElement.dataset.p10ColorMode = safeMode;
    document.documentElement.style.colorScheme = safeMode;
    if (persist) {
      sessionPreference = safeMode;
      try {
        window.localStorage.setItem(STORAGE_KEY, safeMode);
      } catch {
        // The current session still changes when storage is unavailable.
      }
    }
    syncButtons(safeMode);
  }

  function bindButtons(root = document) {
    root.querySelectorAll?.('[data-p10-theme-toggle]').forEach((button) => {
      if (button.dataset.p10ThemeBound === 'true') return;
      button.dataset.p10ThemeBound = 'true';
      button.addEventListener('click', () => {
        const next = document.documentElement.dataset.p10ColorMode === 'dark' ? 'light' : 'dark';
        applyMode(next, true);
      });
    });
    syncButtons(effectiveMode());
  }

  function boot() {
    applyMode(effectiveMode());
    bindButtons();
    window.requestAnimationFrame(() => document.documentElement.classList.add('p10-color-mode-ready'));
  }

  systemPreference?.addEventListener?.('change', () => {
    if (sessionPreference || readStoredPreference()) return;
    applyMode(systemMode());
  });
  document.addEventListener('shopify:section:load', (event) => bindButtons(event.target));
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
