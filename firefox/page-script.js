// ==UserScript==
// @name         Salesforce Enhancer
// @namespace    https://etherlucid.local/
// @version      1.4.1
// @description  Salesforce productivity: subtabs & tab drag-and-drop, Quick Views list bookmarking, declarative Inspector Mods, developer themes, and custom animations.
// @match        https://*.lightning.force.com/*
// @match        https://*.salesforce.com/*
// @match        https://*.force.com/*
// @match        https://*.visualforce.com/*
// @match        https://*.salesforce-setup.com/*
// @match        https://*.salesforce-communities.com/*
// @match        https://*.site.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  if (window.__sfEnhancerInstalled || window.__sfSubtabOpenerInstalled) return;
  window.__sfEnhancerInstalled = true;
  window.__sfSubtabOpenerInstalled = true;
  if (document.documentElement) {
    document.documentElement.dataset.sfMainWorldLoaded = 'true';
  }

  // Global registry for Shadow Roots to support LWC Native Shadow DOM (Chrome & modern SF)
  const trackedShadowRoots = new Set();
  const observedShadowRoots = new WeakSet();
  let dropdownObserver = null;

  function isRelevantObserverShadowHost(host) {
    if (!host || !host.tagName) return false;
    const tag = host.tagName.toLowerCase();
    return (
      tag.includes('list-view') ||
      tag.includes('object-home') ||
      tag.includes('combobox') ||
      tag.includes('listbox') ||
      tag.includes('picker') ||
      tag.includes('search') ||
      tag.includes('assistant') ||
      tag.includes('dialog')
    );
  }

  function pruneTrackedShadowRoots() {
    for (const sr of trackedShadowRoots) {
      if (!sr || !sr.host || !sr.host.isConnected) {
        trackedShadowRoots.delete(sr);
      }
    }
  }

  function observeShadowRoot(sr) {
    if (!sr || !dropdownObserver || observedShadowRoots.has(sr)) return;
    if (sr.host && !isRelevantObserverShadowHost(sr.host)) return;
    try {
      observedShadowRoots.add(sr);
      dropdownObserver.observe(sr, { childList: true, subtree: true });
    } catch (_) {}
  }

  const origAttachShadow = Element.prototype.attachShadow;
  if (!Element.prototype._sfPatchedAttachShadow) {
    Element.prototype._sfPatchedAttachShadow = true;
    Element.prototype.attachShadow = function (...args) {
      const shadowRoot = origAttachShadow.apply(this, args);
      trackedShadowRoots.add(shadowRoot);
      this._sfShadowRoot = shadowRoot;
      if (isRelevantObserverShadowHost(this)) {
        observeShadowRoot(shadowRoot);
      }
      try {
        const s = cachedSettings || (typeof getEnhancerSettings === 'function' ? getEnhancerSettings() : null);
        if (s?.modules?.theming === true && typeof syncStylesToShadowRoot === 'function') {
          syncStylesToShadowRoot(shadowRoot);
        }
      } catch (_) {}
      return shadowRoot;
    };
  }

  const isTopWindow = window === window.top;

  let detectedParrot = (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.sfParrotUrl)
    || (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.parrotUrl)
    || (document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/page-script\.js(?:\?.*)?$/, 'parrot.gif') : '');
  if (!detectedParrot) {
    const s = document.querySelector('script[src*="page-script.js"]');
    if (s && s.src) {
      detectedParrot = s.src.replace(/page-script\.js(?:\?.*)?$/, 'parrot.gif');
    }
  }
  const GIF_PARROT = detectedParrot || 'parrot.gif';

  let detectedNyan = (document.documentElement && document.documentElement.dataset && document.documentElement.dataset.sfNyanUrl)
    || (document.currentScript && document.currentScript.dataset && document.currentScript.dataset.nyanUrl)
    || (document.currentScript && document.currentScript.src ? document.currentScript.src.replace(/page-script\.js(?:\?.*)?$/, 'nyan.gif') : '');
  if (!detectedNyan) {
    const s = document.querySelector('script[src*="page-script.js"]');
    if (s && s.src) {
      detectedNyan = s.src.replace(/page-script\.js(?:\?.*)?$/, 'nyan.gif');
    }
  }
  const GIF_NYAN = detectedNyan || 'nyan.gif';
  const GIF_CAT = 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif';
  const GIF_SPINNER = '';

  const PRESET_GIF_MAP = {
    parrot: GIF_PARROT,
    nyan: GIF_NYAN,
    cat: GIF_CAT,
    spinner: GIF_SPINNER,
    default: GIF_SPINNER
  };

  const THEMES = {
    'classic': {
      name: 'Classic SF',
      isDark: false,
      accent: '#0176d3',
      contrast: '#ffffff',
      bg: '#ffffff',
      surface: '#f8fafc',
      surfaceHeader: '#ffffff',
      border: '#dddbda',
      text: '#181818',
      textMuted: '#706e6b'
    },
    'gruvbox-dark': {
      name: 'Gruvbox Dark',
      isDark: true,
      accent: '#fe8019',
      contrast: '#282828',
      bg: '#282828',
      surface: '#3c3836',
      surfaceHeader: '#1d2021',
      border: '#504945',
      text: '#ebdbb2',
      textMuted: '#a89984'
    },
    'gruvbox-light': {
      name: 'Gruvbox Light',
      isDark: false,
      accent: '#af3a03',
      contrast: '#fbf1c7',
      bg: '#fbf1c7',
      surface: '#ebdbb2',
      surfaceHeader: '#f2e5bc',
      border: '#d5c4a1',
      text: '#3c3836',
      textMuted: '#7c6f64'
    },
    'solarized-dark': {
      name: 'Solarized Dark',
      isDark: true,
      accent: '#268bd2',
      contrast: '#ffffff',
      bg: '#002b36',
      surface: '#073642',
      surfaceHeader: '#00212b',
      border: '#073642',
      text: '#839496',
      textMuted: '#586e75'
    },
    'solarized-light': {
      name: 'Solarized Light',
      isDark: false,
      accent: '#2aa198',
      contrast: '#ffffff',
      bg: '#fdf6e3',
      surface: '#eee8d5',
      surfaceHeader: '#f5efdc',
      border: '#e0d8c3',
      text: '#657b83',
      textMuted: '#93a1a1'
    },
    'nord': {
      name: 'Nord',
      isDark: true,
      accent: '#88c0d0',
      contrast: '#2e3440',
      bg: '#2e3440',
      surface: '#3b4252',
      surfaceHeader: '#242933',
      border: '#434c5e',
      text: '#eceff4',
      textMuted: '#d8dee9'
    },
    'dracula': {
      name: 'Dracula',
      isDark: true,
      accent: '#bd93f9',
      contrast: '#282a36',
      bg: '#282a36',
      surface: '#44475a',
      surfaceHeader: '#1e1f29',
      border: '#6272a4',
      text: '#f8f8f2',
      textMuted: '#6272a4'
    },
    'one-dark': {
      name: 'One Dark',
      isDark: true,
      accent: '#61afef',
      contrast: '#21252b',
      bg: '#21252b',
      surface: '#282c34',
      surfaceHeader: '#1b1d23',
      border: '#3e4451',
      text: '#abb2bf',
      textMuted: '#5c6370'
    },
    'custom': {
      name: 'Custom',
      isDark: false,
      accent: '#8b5cf6',
      contrast: '#ffffff',
      bg: '#ffffff',
      surface: '#f8fafc',
      surfaceHeader: '#ffffff',
      border: '#dddbda',
      text: '#181818',
      textMuted: '#706e6b'
    }
  };

  const DEFAULT_KEYBINDS = {
    enabled: true,
    prevWorkspace: 'Ctrl+Shift+BracketLeft',
    nextWorkspace: 'Ctrl+Shift+BracketRight',
    prevSubtab: 'Ctrl+Alt+BracketLeft',
    nextSubtab: 'Ctrl+Alt+BracketRight',
    reorderTabLeft: 'Ctrl+Alt+Comma',
    reorderTabRight: 'Ctrl+Alt+Period',
    promoteSubtab: 'Ctrl+Shift+Backslash',
    moveTabPrevWorkspace: 'Ctrl+Shift+Comma',
    moveTabNextWorkspace: 'Ctrl+Shift+Period',
    closeCurrentTab: 'Ctrl+Shift+Backspace'
  };

  function normalizeKeybinds(rawKeybinds) {
    const res = Object.assign({}, DEFAULT_KEYBINDS);
    if (!rawKeybinds || typeof rawKeybinds !== 'object') return res;
    if (rawKeybinds.enabled !== undefined) res.enabled = rawKeybinds.enabled !== false;
    // Migrate unmodified initial v1.3.2 Alt defaults to conflict-free Ctrl+Shift / Ctrl+Alt defaults
    if (
      rawKeybinds.prevWorkspace === 'Alt+BracketLeft' &&
      rawKeybinds.nextWorkspace === 'Alt+BracketRight' &&
      rawKeybinds.promoteSubtab === 'Alt+ArrowUp' &&
      rawKeybinds.closeCurrentTab === 'Alt+Shift+KeyW'
    ) {
      return res;
    }
    for (const k of Object.keys(DEFAULT_KEYBINDS)) {
      if (k === 'enabled') continue;
      if (typeof rawKeybinds[k] === 'string') {
        res[k] = rawKeybinds[k].trim();
      }
    }
    return res;
  }

  const DEFAULT_SETTINGS = {
    version: '1.4.1',
    modules: {
      subtabs: true,
      quickViews: true,
      linkInterceptor: true,
      clipboardFix: true,
      inspectorMods: false,
      theming: false,
      loadingAnimation: false
    },
    subtabs: {
      hideAppName: false,
      keybinds: Object.assign({}, DEFAULT_KEYBINDS)
    },
    hideAppName: false,
    inspectorMods: {
      mods: []
    },
    theme: {
      preset: 'classic',
      customAccent: '#8b5cf6',
      applyToNavigation: true
    },
    loadingImage: {
      url: GIF_PARROT,
      size: 64,
      rotate: false
    }
  };

  let cachedSettings = null;

  function normalizeSettings(raw) {
    if (!raw || typeof raw !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }

    const hideAppName = raw.hideAppName !== undefined ? !!raw.hideAppName : (raw.subtabs && raw.subtabs.hideAppName !== undefined ? !!raw.subtabs.hideAppName : false);
    const keybinds = normalizeKeybinds(raw.subtabs && raw.subtabs.keybinds);

    const res = {
      version: '1.4.1',
      modules: {
        subtabs: raw.modules ? raw.modules.subtabs !== false : true,
        quickViews: raw.modules ? raw.modules.quickViews !== false : true,
        linkInterceptor: raw.modules ? raw.modules.linkInterceptor !== false : true,
        clipboardFix: raw.modules ? raw.modules.clipboardFix !== false : true,
        inspectorMods: raw.modules ? !!raw.modules.inspectorMods : false,
        theming: raw.modules ? !!raw.modules.theming : (raw.applyToSalesforce === false ? false : !!(raw.theme && raw.theme !== 'classic')),
        loadingAnimation: raw.modules ? raw.modules.loadingAnimation === true : (raw.loadingImage ? raw.loadingImage.enabled === true : false)
      },
      subtabs: {
        hideAppName: hideAppName,
        keybinds: keybinds
      },
      hideAppName: hideAppName,
      inspectorMods: {
        mods: Array.isArray(raw.inspectorMods && raw.inspectorMods.mods)
          ? raw.inspectorMods.mods.filter((m) => m && typeof m === 'object' && m.id && m.target)
          : []
      },
      theme: {
        preset: (raw.theme && typeof raw.theme === 'object' && raw.theme.preset) ? raw.theme.preset : (typeof raw.theme === 'string' ? raw.theme : 'classic'),
        customAccent: (raw.theme && typeof raw.theme === 'object' && raw.theme.customAccent) ? raw.theme.customAccent : (raw.accentColor || '#8b5cf6'),
        applyToNavigation: (raw.theme && typeof raw.theme === 'object' && raw.theme.applyToNavigation !== undefined) ? raw.theme.applyToNavigation : (raw.applyToSalesforce !== false)
      },
      loadingImage: {
        url: (raw.loadingImage && raw.loadingImage.url !== undefined) ? raw.loadingImage.url : (raw.loadingUrl || GIF_PARROT),
        size: (raw.loadingImage && raw.loadingImage.size) || 64,
        rotate: !!(raw.loadingImage && raw.loadingImage.rotate)
      }
    };

    return res;
  }

  function getEnhancerSettings() {
    if (cachedSettings) return cachedSettings;
    try {
      const raw = localStorage.getItem('sf_enhancer_settings') ||
                  localStorage.getItem('sf_appearance_settings') ||
                  document.documentElement?.dataset?.sfAppearance;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          cachedSettings = normalizeSettings(parsed);
          return cachedSettings;
        }
      }
    } catch (_) {}
    cachedSettings = normalizeSettings(DEFAULT_SETTINGS);
    return cachedSettings;
  }

  function saveEnhancerSettings(settings) {
    try {
      const s = normalizeSettings(settings);
      cachedSettings = s;
      localStorage.setItem('sf_enhancer_settings', JSON.stringify(s));
      localStorage.setItem('sf_appearance_settings', JSON.stringify(s));
      if (document.documentElement) {
        document.documentElement.dataset.sfAppearance = JSON.stringify(s);
      }
      window.postMessage({ __sfEnhancerAction: 'saveSettings', settings: s }, '*');
      window.postMessage({ __sfAppearanceAction: 'saveSettings', settings: s }, '*');
    } catch (_) {}
  }

  const getAppearanceSettings = getEnhancerSettings;
  const saveAppearanceSettings = saveEnhancerSettings;

  function getEffectiveAccent(settings) {
    if (!settings || !settings.modules || settings.modules.theming !== true) {
      return '#0176d3';
    }
    const presetKey = settings.theme?.preset || 'classic';
    if (presetKey === 'custom') {
      return settings.theme?.customAccent || '#8b5cf6';
    }
    return THEMES[presetKey]?.accent || '#0176d3';
  }

  function getEffectiveLoadingUrl(settings) {
    if (!settings || !settings.modules || settings.modules.loadingAnimation !== true) return null;
    let url = (settings.loadingImage && settings.loadingImage.url ? settings.loadingImage.url : '').trim();
    if (!url) return null;
    const lower = url.toLowerCase();
    if (lower.includes('parrot') || lower.includes('partyparrot')) return GIF_PARROT;
    if (lower.includes('nyan') || lower.includes('gifer')) return GIF_NYAN;
    if (lower.includes('cat') || lower.includes('giphy') || lower.includes('tenor')) return GIF_CAT;
    if (lower.includes('spinner') || lower === 'default') return null;
    return url;
  }

  let cachedWorkspaceAPI = null;
  let lastNonSearchParentTabId = null;
  let preClickParentTabId = null;
  let preClickFocusedTabId = null;
  let preClickPrimaryTabIds = new Set();

  // State for catching LWC Global Search instant-dropdown clicks where recordId isn't in DOM attributes
  let pendingInstantIntercept = null;
  let isInternalWorkspaceCall = false;

  const SF_ID_REGEX = /^[a-zA-Z0-9]{15,18}$/;
  const RECORD_URL_REGEX = /\/lightning\/r\/(?:[a-zA-Z0-9_]+\/)?([a-zA-Z0-9]{15,18})(?:\/view|$|\?|#)/;

  function isAllowedSalesforceOrigin(origin) {
    if (!origin || typeof origin !== 'string') return false;
    if (origin === window.location.origin) return true;
    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();
      return (
        host === 'force.com' || host.endsWith('.force.com') ||
        host === 'salesforce.com' || host.endsWith('.salesforce.com') ||
        host === 'visualforce.com' || host.endsWith('.visualforce.com') ||
        host === 'site.com' || host.endsWith('.site.com') ||
        host === 'cloudforce.com' || host.endsWith('.cloudforce.com')
      );
    } catch (_) {
      return false;
    }
  }

  function isSafeTargetUrl(url) {
    if (!url || typeof url !== 'string') return true;
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
      return false;
    }
    return true;
  }

  function sanitizeHexColor(hex, fallback = '#8b5cf6') {
    if (!hex || typeof hex !== 'string') return fallback;
    const trimmed = hex.trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : fallback;
  }

  // In the top window, listen for messages forwarded from child frames (e.g. Reports, Visualforce)
  if (isTopWindow) {
    window.addEventListener('message', (event) => {
      try {
        if (!event.origin || !isAllowedSalesforceOrigin(event.origin)) return;
        if (event.data && (event.data.__sfEnhancer === true || event.data.__sfSubtabOpener === true)) {
          const { action, target, options, command } = event.data;
          if (action === 'tabKeybind' && command) {
            executeTabKeybindCommand(command);
            return;
          }
          if (!target) return;
          if (action === 'openPrimaryTab') {
            openTargetAsPrimaryTab(target, options || {});
          } else if (action === 'openSubtab') {
            openTargetAsSubtab(target, options || {});
          }
        }
      } catch (_) {}
    });
  }

  /**
   * Show a small non-intrusive toast in the bottom-right corner
   */
  function showToast(text) {
    try {
      let toast = document.getElementById('sf-enhancer-toast') || document.getElementById('sf-subtab-opener-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'sf-enhancer-toast';
        Object.assign(toast.style, {
          position: 'fixed',
          bottom: '38px',
          right: '20px',
          zIndex: '999999',
          background: 'rgba(24, 24, 27, 0.92)',
          color: '#ffffff',
          padding: '7px 13px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          pointerEvents: 'none',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: '0',
          transform: 'translateY(6px)'
        });
        document.body.appendChild(toast);
      }
      toast.textContent = text;
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
      clearTimeout(toast._hideTimer);
      toast._hideTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(6px)';
      }, 1600);
    } catch (_) {}
  }

  /**
   * Check whether a tab info object represents a Global Search results primary tab
   */
  function isSearchResultsTab(tabInfo) {
    if (!tabInfo) return false;
    const url = tabInfo.url || '';
    const title = (tabInfo.title || '').trim();
    return (
      url.includes('forceSearch:search') ||
      url.includes('/one/one.app#') ||
      title === 'Search' ||
      title.startsWith('Search ')
    );
  }

  /**
   * Check whether a tab cannot host subtabs (e.g. Search results or Home)
   * Note: List Views (including Knowledge, Cases, Accounts) CAN host subtabs in Console!
   */
  function isNonRecordHostTab(tabInfo) {
    if (!tabInfo) return false;
    if (isSearchResultsTab(tabInfo)) return true;
    const url = tabInfo.url || '';
    const title = (tabInfo.title || '').trim();
    return (
      url.includes('/lightning/page/home') ||
      url.includes('standard-home') ||
      title === 'Home'
    );
  }

  const CONSOLE_APP_SELECTOR =
    '.oneConsoleNav, .navexConsoleNav, .navexWorkspaceManager, .navexConsoleTabContainer, .oneConsoleTabContainer, .oneWorkspaceNavigationTabs, .oneConsoleLayoutContainer, .tabsetHeader.slds-context-bar, .slds-context-bar.slds-context-bar_tabs';

  let hostFrameIsConsole = false;

  if (!isTopWindow) {
    const queryHostConsoleState = () => {
      try {
        window.top.postMessage({ __sfEnhancerAction: 'queryConsoleState' }, '*');
      } catch (_) {}
    };
    window.addEventListener('message', (event) => {
      try {
        if (event.source !== window.top) return;
        if (!isAllowedSalesforceOrigin(event.origin)) return;
        if (event.data && event.data.__sfEnhancerAction === 'consoleState') {
          hostFrameIsConsole = !!event.data.isConsole;
        }
      } catch (_) {}
    });
    queryHostConsoleState();
    setTimeout(queryHostConsoleState, 1200);
    setTimeout(queryHostConsoleState, 3000);
  }

  /**
   * Synchronously detect whether the active Salesforce Lightning app uses Console navigation.
   */
  function isConsoleAppActive() {
    try {
      if (isTopWindow) {
        return !!document.querySelector(CONSOLE_APP_SELECTOR);
      }
      try {
        if (window.top && window.top.document) {
          return !!window.top.document.querySelector(CONSOLE_APP_SELECTOR);
        }
      } catch (_) {}
      return hostFrameIsConsole;
    } catch (_) {
      return false;
    }
  }

  /**
   * Authoritatively check Console navigation via lightning:workspaceAPI when available.
   */
  async function isConsoleNavigationActive(ws) {
    try {
      const api = ws || (await getWorkspaceAPI());
      if (api && typeof api.isConsoleNavigation === 'function') {
        const res = await api.isConsoleNavigation();
        if (typeof res === 'boolean') return res;
      }
    } catch (_) {}
    return isConsoleAppActive();
  }

  /**
   * Obtain (and cache) the Aura lightning:workspaceAPI component instance
   */
  function getWorkspaceAPI() {
    return new Promise((resolve, reject) => {
      if (cachedWorkspaceAPI && cachedWorkspaceAPI.isValid && cachedWorkspaceAPI.isValid()) {
        return resolve(cachedWorkspaceAPI);
      }
      if (!window.$A || typeof window.$A.createComponent !== 'function') {
        return reject(new Error('Aura ($A) not ready'));
      }
      window.$A.createComponent('lightning:workspaceAPI', {}, function (ws, status, error) {
        if (status === 'SUCCESS' && ws) {
          cachedWorkspaceAPI = ws;
          resolve(ws);
        } else {
          reject(new Error(error || 'Failed to create lightning:workspaceAPI'));
        }
      });
    });
  }

  /**
   * Keep track of the currently focused workspace tab so we always know
   * both the active tab and the last non-Search workspace tab.
   */
  async function snapshotTabState() {
    if (!isTopWindow || !isConsoleAppActive()) return;
    try {
      const ws = await getWorkspaceAPI();
      if (!(await isConsoleNavigationActive(ws))) return;
      const [focused, allTabs] = await Promise.all([
        ws.getFocusedTabInfo().catch(() => null),
        ws.getAllTabInfo ? ws.getAllTabInfo().catch(() => []) : Promise.resolve([])
      ]);

      if (Array.isArray(allTabs) && allTabs.length > 0) {
        preClickPrimaryTabIds = new Set(allTabs.map((t) => t.tabId));
        if (typeof getStableTabOrder === 'function') {
          getStableTabOrder(allTabs, false, 'workspaces');
        }
      }

      if (focused && focused.tabId) {
        preClickFocusedTabId = focused.tabId;
        const parentId = focused.isSubtab ? focused.parentTabId : focused.tabId;
        preClickParentTabId = parentId;
        if (!isNonRecordHostTab(focused)) {
          lastNonSearchParentTabId = parentId;
        }
      }
    } catch (_) {}
  }

  /**
   * Determine the best parent workspace tab ID for opening the subtab:
   * - Normal Option+Click (⌥+Click): Opens inside the currently selected tab.
   *   If the current tab is Search or Home that cannot host subtabs,
   *   routes into the last active record tab, a pinned tab, or returns null so Salesforce
   *   can open the record under its configured parent workspace per Console Navigation Rules.
   */
  async function findTargetParentTabId(ws, preferPinnedOrPrevious = false) {
    let focused = null;
    try {
      focused = await ws.getFocusedTabInfo();
    } catch (_) {}

    const focusedIsNonRecord = isNonRecordHostTab(focused);
    const currentParentId = focused && !focusedIsNonRecord
      ? focused.isSubtab
        ? focused.parentTabId
        : focused.tabId
      : preClickParentTabId;

    if (preferPinnedOrPrevious || !currentParentId || focusedIsNonRecord) {
      try {
        const allTabs = (await ws.getAllTabInfo()) || [];

        if (lastNonSearchParentTabId && allTabs.some((t) => t.tabId === lastNonSearchParentTabId)) {
          return lastNonSearchParentTabId;
        }

        const anyPinned = allTabs.find((t) => t.pinned && !isNonRecordHostTab(t));
        if (anyPinned) return anyPinned.tabId;

        const anyRecordTab = allTabs.find((t) => !isNonRecordHostTab(t));
        if (anyRecordTab) return anyRecordTab.tabId;
      } catch (_) {}
    }

    if (currentParentId) return currentParentId;
    if (lastNonSearchParentTabId) return lastNonSearchParentTabId;
    return null;
  }

  /**
   * Open a Record ID or Lightning URL as a subtab in the target parent workspace tab
   */
  async function openTargetAsSubtab(target, { openInBackground = false, preferPinned = false, explicitParentTabId = null } = {}) {
    if (!target || (!target.recordId && !target.url && !target.pageReference)) return false;
    if (target.url && !isSafeTargetUrl(target.url)) return false;

    // Normalize recordId from url if missing
    if (!target.recordId && target.url) {
      const m = target.url.match(RECORD_URL_REGEX);
      if (m && m[1]) target.recordId = m[1];
    }
    if (target.recordId && !target.url) {
      target.url = `/lightning/r/${target.recordId}/view`;
    }

    if (!isTopWindow) {
      window.top.postMessage(
        {
          __sfEnhancer: true,
          __sfSubtabOpener: true,
          action: 'openSubtab',
          target,
          options: { openInBackground, preferPinned, explicitParentTabId }
        },
        '*'
      );
      return true;
    }

    try {
      const ws = await getWorkspaceAPI();
      let parentTabId = explicitParentTabId || (await findTargetParentTabId(ws, preferPinned));
      try {
        const allTabs = (await ws.getAllTabInfo()) || [];
        const exists = allTabs.some((t) => t.tabId === parentTabId);
        if (!exists) {
          parentTabId = await findTargetParentTabId(ws, preferPinned);
        }
      } catch (_) {}

      try {
        const pInfo = await ws.getTabInfo({ tabId: parentTabId }).catch(() => null);
        if (pInfo && pInfo.isSubtab && pInfo.parentTabId) {
          parentTabId = pInfo.parentTabId;
        }
      } catch (_) {}

      if (!parentTabId) {
        // If there is no parent tab capable of hosting subtabs (e.g. currently viewing Search or Home),
        // route directly into ws.openTab(). Salesforce Console Navigation Rules will open the record
        // as a workspace tab or under its configured parent workspace tab.
        return await openTargetAsPrimaryTab(target, { focus: !openInBackground });
      }

      const buildParams = (pId) => {
        const params = { parentTabId: pId, focus: !openInBackground };
        if (target.recordId) {
          params.recordId = target.recordId;
          params.url = target.url || `/lightning/r/${target.recordId}/view`;
        } else if (target.url) {
          params.url = target.url;
        } else if (target.pageReference) {
          params.pageReference = target.pageReference;
        }
        return params;
      };

      isInternalWorkspaceCall = true;
      try {
        let newSubtabId = null;
        try {
          newSubtabId = await ws.openSubtab(buildParams(parentTabId));
        } catch (subErr) {
          if (target.url && target.recordId) {
            newSubtabId = await ws.openSubtab({ parentTabId, url: target.url, focus: !openInBackground });
          } else {
            throw subErr;
          }
        }

        if (!openInBackground && ws.focusTab) {
          if (parentTabId) {
            await ws.focusTab({ tabId: parentTabId }).catch(() => {});
          }
          if (newSubtabId) {
            await ws.focusTab({ tabId: newSubtabId }).catch(() => {});
          }
          setTimeout(async () => {
            if (parentTabId) {
              await ws.focusTab({ tabId: parentTabId }).catch(() => {});
            }
            if (newSubtabId) {
              await ws.focusTab({ tabId: newSubtabId }).catch(() => {});
            }
          }, 80);
        } else if (openInBackground && ws.focusTab) {
          const tabToPreserve = preClickFocusedTabId || explicitParentTabId;
          if (tabToPreserve) {
            await ws.focusTab({ tabId: tabToPreserve }).catch(() => {});
          }
        }
        showToast(openInBackground ? '↳ Opened in background subtab' : '↳ Opened in subtab');
        return true;
      } catch (firstErr) {
        if (preferPinned) {
          const fallbackParentId = await findTargetParentTabId(ws, true);
          if (fallbackParentId && fallbackParentId !== parentTabId) {
            try {
              let fallbackSubtabId = await ws.openSubtab(buildParams(fallbackParentId));
              if (!fallbackSubtabId && target.url && target.recordId) {
                fallbackSubtabId = await ws.openSubtab({ parentTabId: fallbackParentId, url: target.url, focus: !openInBackground });
              }
              if (!openInBackground && ws.focusTab) {
                if (fallbackParentId) {
                  await ws.focusTab({ tabId: fallbackParentId }).catch(() => {});
                }
                if (fallbackSubtabId) {
                  await ws.focusTab({ tabId: fallbackSubtabId }).catch(() => {});
                }
                setTimeout(async () => {
                  if (fallbackParentId) {
                    await ws.focusTab({ tabId: fallbackParentId }).catch(() => {});
                  }
                  if (fallbackSubtabId) {
                    await ws.focusTab({ tabId: fallbackSubtabId }).catch(() => {});
                  }
                }, 80);
              } else if (openInBackground && ws.focusTab) {
                const tabToPreserve = preClickFocusedTabId || explicitParentTabId;
                if (tabToPreserve) {
                  await ws.focusTab({ tabId: tabToPreserve }).catch(() => {});
                }
              }
              showToast(openInBackground ? '↳ Opened in background subtab' : '↳ Opened in workspace subtab');
              return true;
            } catch (_) {}
          }
        }

        // Essential Fallback: Records governed by Console Navigation Rules (such as child objects configured
        // to open as subtabs of a parent record) cannot be forced under an arbitrary parent workspace tab.
        // Calling ws.openTab() lets Salesforce's Console Navigation Manager locate or open the parent
        // workspace tab and place the subtab inside it.
        try {
          const primaryParams = { focus: !openInBackground };
          if (target.recordId) primaryParams.recordId = target.recordId;
          else if (target.url) primaryParams.url = target.url;
          else if (target.pageReference) primaryParams.pageReference = target.pageReference;

          const newTabId = await ws.openTab(primaryParams);
          if (newTabId) {
            if (openInBackground && ws.focusTab) {
              const tabToPreserve = preClickFocusedTabId || explicitParentTabId;
              if (tabToPreserve) {
                setTimeout(() => {
                  ws.focusTab({ tabId: tabToPreserve }).catch(() => {});
                }, 120);
              }
            } else if (!openInBackground && ws.focusTab) {
              await ws.focusTab({ tabId: newTabId }).catch(() => {});
              // If Salesforce opened a parent workspace tab, ensure the target subtab inside it is created and focused
              setTimeout(async () => {
                try {
                  const info = await ws.getTabInfo({ tabId: newTabId });
                  if (info && Array.isArray(info.subtabs) && info.subtabs.length > 0) {
                    const matchingSubtab = info.subtabs.find(
                      (s) => (target.recordId && s.recordId === target.recordId) ||
                             (target.url && s.url && s.url.includes(target.url))
                    ) || info.subtabs[info.subtabs.length - 1];
                    if (matchingSubtab && matchingSubtab.tabId) {
                      await ws.focusTab({ tabId: matchingSubtab.tabId }).catch(() => {});
                    }
                  } else if (target.recordId) {
                    // If the parent workspace tab opened without creating the subtab yet, open it directly
                    const subParams = { parentTabId: newTabId, recordId: target.recordId, focus: true };
                    const createdSubtabId = await ws.openSubtab(subParams).catch(() => null);
                    if (createdSubtabId && ws.focusTab) {
                      await ws.focusTab({ tabId: createdSubtabId }).catch(() => {});
                    }
                  }
                } catch (_) {}
              }, 80);
            }
            showToast(openInBackground ? '↳ Opened in background workspace' : '↳ Opened in parent workspace');
            return true;
          }
        } catch (tabErr) {
          // Native navigation event fallback
          if (window.$A && typeof window.$A.get === 'function') {
            if (target.recordId) {
              const navEvt = window.$A.get('e.force:navigateToSObject');
              if (navEvt) {
                navEvt.setParams({ recordId: target.recordId, slideDevName: 'detail' });
                navEvt.fire();
                showToast(openInBackground ? '↳ Opened in background' : '↳ Opened in parent workspace');
                return true;
              }
            }
            if (target.url) {
              const urlEvt = window.$A.get('e.force:navigateToURL');
              if (urlEvt) {
                urlEvt.setParams({ url: target.url });
                urlEvt.fire();
                showToast(openInBackground ? '↳ Opened in background' : '↳ Opened in parent workspace');
                return true;
              }
            }
          }
        }
        if (target.url) {
          window.location.assign(target.url);
          return true;
        }
        throw firstErr;
      } finally {
        isInternalWorkspaceCall = false;
      }
    } catch (err) {
      console.error('[SF Subtab Opener] Failed to open subtab:', err);
      if (target.url) {
        window.location.assign(target.url);
        return true;
      }
      return false;
    }
  }

  /**
   * Open a Record ID or Lightning URL as a new primary workspace tab
   */
  async function openTargetAsPrimaryTab(target, { focus = true } = {}) {
    if (!target || (!target.recordId && !target.url && !target.pageReference)) return false;
    if (target.url && !isSafeTargetUrl(target.url)) return false;

    if (!isTopWindow) {
      window.top.postMessage(
        {
          __sfEnhancer: true,
          __sfSubtabOpener: true,
          action: 'openPrimaryTab',
          target,
          options: { focus }
        },
        '*'
      );
      return true;
    }

    try {
      const ws = await getWorkspaceAPI();

      const buildParams = () => {
        const params = { focus };
        if (target.recordId) {
          params.recordId = target.recordId;
        } else if (target.url) {
          params.url = target.url;
        } else if (target.pageReference) {
          params.pageReference = target.pageReference;
        }
        return params;
      };

      isInternalWorkspaceCall = true;
      try {
        let newTabId = null;
        try {
          newTabId = await ws.openTab(buildParams());
        } catch (tabErr) {
          if (target.url && target.recordId) {
            newTabId = await ws.openTab({ url: target.url, focus });
          } else {
            throw tabErr;
          }
        }

        if (focus && newTabId && ws.focusTab) {
          await ws.focusTab({ tabId: newTabId }).catch(() => {});
          setTimeout(() => {
            ws.focusTab({ tabId: newTabId }).catch(() => {});
          }, 80);
        }
        showToast(focus ? '↳ Opened in workspace tab' : '↳ Opened in background workspace tab');
        return true;
      } catch (err) {
        // Fallback to native navigation event
        if (window.$A && typeof window.$A.get === 'function') {
          if (target.recordId) {
            const navEvt = window.$A.get('e.force:navigateToSObject');
            if (navEvt) {
              navEvt.setParams({ recordId: target.recordId, slideDevName: 'detail' });
              navEvt.fire();
              showToast(focus ? '↳ Opened in workspace tab' : '↳ Opened in background');
              return true;
            }
          }
          if (target.url) {
            const urlEvt = window.$A.get('e.force:navigateToURL');
            if (urlEvt) {
              urlEvt.setParams({ url: target.url });
              urlEvt.fire();
              showToast(focus ? '↳ Opened in workspace tab' : '↳ Opened in background');
              return true;
            }
          }
        }
        console.error('[SF Subtab Opener] Failed to open primary tab:', err);
        if (target.url) {
          window.location.href = target.url;
          return true;
        }
        return false;
      } finally {
        isInternalWorkspaceCall = false;
      }
    } catch (err) {
      console.error('[SF Subtab Opener] Failed to open primary tab:', err);
      return false;
    }
  }

  /**
   * Extract a Salesforce Record ID or /lightning/... URL from a DOM event's composedPath()
   */
  function extractTargetFromEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (!path.length && event.target) {
      path.push(event.target);
    }

    let rowKeyCandidate = null;
    let clickedInsideInteractiveControl = false;

    for (const node of path) {
      if (!node || node.nodeType !== 1) continue;

      const tag = node.tagName ? node.tagName.toUpperCase() : '';

      if (tag === 'INPUT' || tag === 'LIGHTNING-BUTTON-MENU' || tag === 'LIGHTNING-PRIMITIVE-CELL-CHECKBOX') {
        clickedInsideInteractiveControl = true;
      }

      // 1. Direct record ID on any data-* or value attribute
      const idAttrs = [
        'data-recordid',
        'data-record-id',
        'data-id',
        'data-target-id',
        'data-value',
        'data-key',
        'value'
      ];
      for (const attr of idAttrs) {
        const val = node.getAttribute ? node.getAttribute(attr) : null;
        if (val && typeof val === 'string' && SF_ID_REGEX.test(val.trim())) {
          return { recordId: val.trim() };
        }
      }

      const targetSel = (node.dataset && node.dataset.targetSelectionName) || (node.getAttribute ? node.getAttribute('data-target-selection-name') : null);
      if (targetSel && typeof targetSel === 'string') {
        const m = targetSel.match(/([a-zA-Z0-9]{15,18})/);
        if (m && SF_ID_REGEX.test(m[1])) {
          return { recordId: m[1] };
        }
      }

      if (node.dataset) {
        for (const key of ['recordid', 'recordId', 'id', 'targetId', 'value']) {
          const val = node.dataset[key];
          if (val && typeof val === 'string' && SF_ID_REGEX.test(val.trim())) {
            return { recordId: val.trim() };
          }
        }
      }

      // 2. Element href, data-url, or data-href
      const urlCandidates = [];
      if (node.getAttribute) {
        const h = node.getAttribute('href');
        if (h) urlCandidates.push(h);
        const du = node.getAttribute('data-url');
        if (du) urlCandidates.push(du);
        const dh = node.getAttribute('data-href');
        if (dh) urlCandidates.push(dh);
      }
      if (typeof node.href === 'string') {
        urlCandidates.push(node.href);
      } else if (node.href && typeof node.href.baseVal === 'string') {
        urlCandidates.push(node.href.baseVal);
      }

      for (const rawUrl of urlCandidates) {
        if (!rawUrl || typeof rawUrl !== 'string') continue;
        const trimmed = rawUrl.trim();
        if (!trimmed || trimmed.startsWith('javascript:') || trimmed === '#') continue;

        let parsed = null;
        try {
          parsed = new URL(trimmed, window.location.origin);
        } catch (_) {}

        const pathToCheck = parsed ? parsed.pathname : trimmed;
        const hashToCheck = parsed ? parsed.hash : '';

        const recordMatch = (pathToCheck + hashToCheck).match(RECORD_URL_REGEX);
        if (recordMatch && recordMatch[1]) {
          return { recordId: recordMatch[1], url: trimmed };
        }

        const classicMatch = pathToCheck.match(/^\/([a-zA-Z0-9]{15,18})(?:\/view|$|\?|#|\/|$)/);
        if (classicMatch && classicMatch[1]) {
          return { recordId: classicMatch[1], url: trimmed };
        }

        const sObjMatch = (pathToCheck + hashToCheck).match(/\/sObject\/([a-zA-Z0-9]{15,18})(?:\/view|$|\?|#|\/|$)/i);
        if (sObjMatch && sObjMatch[1]) {
          return { recordId: sObjMatch[1], url: trimmed };
        }

        if (parsed && parsed.searchParams) {
          const idParam = parsed.searchParams.get('id') || parsed.searchParams.get('recordId');
          if (idParam && SF_ID_REGEX.test(idParam)) {
            return { recordId: idParam, url: trimmed };
          }
        }

        if (pathToCheck.startsWith('/lightning/')) {
          const fullPath = parsed ? parsed.pathname + parsed.search + parsed.hash : trimmed;
          return { url: fullPath };
        }
      }

      // 3. lightning-datatable row key
      const rowKey = node.getAttribute ? node.getAttribute('data-row-key-value') : null;
      if (!rowKeyCandidate && rowKey && SF_ID_REGEX.test(rowKey)) {
        rowKeyCandidate = rowKey;
      }
    }

    if (rowKeyCandidate && !clickedInsideInteractiveControl) {
      return { recordId: rowKeyCandidate };
    }

    return null;
  }

  /**
   * Disarm navigation intercept window
   */
  function disarmNavigationIntercept() {
    if (pendingInstantIntercept) {
      clearTimeout(pendingInstantIntercept.timer);
      clearInterval(pendingInstantIntercept.pollTimer);
      pendingInstantIntercept = null;
    }
  }

  /**
   * Arm a short intercept window (1.5s) when Option+Clicking an item
   * whose Record ID is hidden inside private LWC state.
   */
  function armNavigationIntercept(openInBackground = false, preferPinned = false) {
    if (!isTopWindow) return;
    disarmNavigationIntercept();

    const parentTabId = preClickParentTabId || lastNonSearchParentTabId;
    const focusedTabId = preClickFocusedTabId;
    const knownPrimaryTabs = new Set(preClickPrimaryTabIds);

    const state = {
      parentTabId,
      focusedTabId,
      openInBackground,
      preferPinned,
      knownPrimaryTabs,
      timer: null,
      pollTimer: null
    };

    state.pollTimer = setInterval(async () => {
      if (pendingInstantIntercept !== state) return;
      try {
        const ws = await getWorkspaceAPI();
        const allTabs = (await ws.getAllTabInfo()) || [];
        const newPrimaryTab = allTabs.find(
          (t) =>
            !t.isSubtab &&
            t.tabId !== state.parentTabId &&
            knownPrimaryTabs.size > 0 &&
            !knownPrimaryTabs.has(t.tabId)
        );

        if (newPrimaryTab) {
          // Check if this new primary tab already has subtabs (e.g. Salesforce opened a parent
          // workspace tab and automatically placed the record subtab inside it per Console Navigation Rules)
          const tabInfo = await ws.getTabInfo({ tabId: newPrimaryTab.tabId }).catch(() => newPrimaryTab);
          let hasSubtabs = tabInfo && Array.isArray(tabInfo.subtabs) && tabInfo.subtabs.length > 0;
          let freshInfo = null;
          if (!hasSubtabs) {
            // Give Salesforce 100ms in case the subtab is being actively created
            await new Promise((r) => setTimeout(r, 100));
            freshInfo = await ws.getTabInfo({ tabId: newPrimaryTab.tabId }).catch(() => null);
            hasSubtabs = freshInfo && Array.isArray(freshInfo.subtabs) && freshInfo.subtabs.length > 0;
          }

          if (hasSubtabs) {
            disarmNavigationIntercept();
            if (state.openInBackground && state.focusedTabId && ws.focusTab) {
              await ws.focusTab({ tabId: state.focusedTabId }).catch(() => {});
            } else if (!state.openInBackground && ws.focusTab) {
              await ws.focusTab({ tabId: newPrimaryTab.tabId }).catch(() => {});
              const lastSub = freshInfo?.subtabs?.[freshInfo.subtabs.length - 1] || tabInfo?.subtabs?.[tabInfo.subtabs.length - 1];
              if (lastSub && lastSub.tabId) {
                await ws.focusTab({ tabId: lastSub.tabId }).catch(() => {});
              }
            }
            showToast(state.openInBackground ? '↳ Opened in background workspace' : '↳ Opened in parent workspace');
            return;
          }

          disarmNavigationIntercept();
          const target = {};
          if (newPrimaryTab.recordId) {
            target.recordId = newPrimaryTab.recordId;
          } else if (newPrimaryTab.url) {
            const m = newPrimaryTab.url.match(RECORD_URL_REGEX);
            if (m && m[1]) target.recordId = m[1];
            else target.url = newPrimaryTab.url;
          } else if (newPrimaryTab.pageReference) {
            target.pageReference = newPrimaryTab.pageReference;
          }

          const success = await openTargetAsSubtab(target, {
            openInBackground: state.openInBackground,
            preferPinned: state.preferPinned,
            explicitParentTabId: state.preferPinned ? null : state.parentTabId
          });

          // ONLY close the new primary tab if it was successfully attached as a subtab under parentTabId!
          // NEVER close it if it's the parent workspace tab that opened for this record.
          if (success && state.parentTabId && newPrimaryTab.tabId !== state.parentTabId) {
            await new Promise((r) => setTimeout(r, 100));
            const parentInfo = await ws.getTabInfo({ tabId: state.parentTabId }).catch(() => null);
            const isUnderParent = parentInfo && Array.isArray(parentInfo.subtabs) && parentInfo.subtabs.some(
              (s) => (target.recordId && s.recordId === target.recordId) ||
                     (target.url && s.url && s.url.includes(target.url))
            );
            if (isUnderParent) {
              const currentTabs = (await ws.getAllTabInfo()) || [];
              const stillExists = currentTabs.find((t) => t.tabId === newPrimaryTab.tabId);
              if (stillExists && (!Array.isArray(stillExists.subtabs) || stillExists.subtabs.length === 0)) {
                await ws.closeTab({ tabId: newPrimaryTab.tabId }).catch(() => {});
              }
            }
          }
        }
      } catch (_) {}
    }, 45);

    state.timer = setTimeout(() => {
      if (pendingInstantIntercept === state) {
        disarmNavigationIntercept();
      }
    }, 1500);

    pendingInstantIntercept = state;
  }

  /**
   * Hook Aura's Event.prototype.fire
   */
  function installAuraEventHook() {
    if (!window.$A || !window.$A.Event || !window.$A.Event.prototype || window.$A.Event.prototype.__sfSubtabHooked) {
      return false;
    }

    const origFire = window.$A.Event.prototype.fire;
    window.$A.Event.prototype.fire = function () {
      if (pendingInstantIntercept && !isInternalWorkspaceCall) {
        try {
          const params = typeof this.getParams === 'function' ? this.getParams() : null;
          if (params) {
            let target = null;
            if (params.recordId && SF_ID_REGEX.test(params.recordId)) {
              target = { recordId: params.recordId };
            } else if (params.url && typeof params.url === 'string') {
              const m = params.url.match(RECORD_URL_REGEX);
              if (m && m[1]) target = { recordId: m[1], url: params.url };
              else if (params.url.startsWith('/lightning/')) target = { url: params.url };
            } else if (params.pageReference && params.pageReference.attributes) {
              const attrs = params.pageReference.attributes;
              if (attrs.recordId && SF_ID_REGEX.test(attrs.recordId)) {
                target = { recordId: attrs.recordId };
              }
            }

            if (target) {
              const savedState = pendingInstantIntercept;
              disarmNavigationIntercept();
              openTargetAsSubtab(target, {
                openInBackground: savedState.openInBackground,
                preferPinned: savedState.preferPinned,
                explicitParentTabId: savedState.preferPinned ? null : savedState.parentTabId
              });
              return;
            }
          }
        } catch (_) {}
      }
      return origFire.apply(this, arguments);
    };
    window.$A.Event.prototype.__sfSubtabHooked = true;
    return true;
  }

  function initShadowSlotCopyFix() {
    if (window.__sfEnhancerSlotCopyFixInstalled) return;
    window.__sfEnhancerSlotCopyFixInstalled = true;

    let lastDblClickSlot = null;
    let lastDblClickAt = 0;

    const BLOCK_TAGS = new Set([
      'P', 'DIV', 'LI', 'TR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
      'BLOCKQUOTE', 'PRE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER',
      'RECORDS-RECORD-LAYOUT-ROW', 'RECORDS-RECORD-LAYOUT-ITEM',
      'RECORDS-RECORD-LAYOUT-SECTION'
    ]);

    const SKIP_TAGS = new Set(['STYLE', 'SCRIPT', 'NOSCRIPT', 'SVG', 'TEMPLATE']);

    function normalizeCopiedText(raw) {
      return String(raw || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n[ \t]+/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function isSkippedElement(el) {
      if (!el || el.nodeType !== 1) return false;
      const tag = el.tagName ? el.tagName.toUpperCase() : '';
      if (SKIP_TAGS.has(tag)) return true;
      if (tag === 'BUTTON') return true;
      if (el.classList && (el.classList.contains('slds-assistive-text') || el.classList.contains('slds-hide'))) {
        return true;
      }
      if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
      try {
        if (el.style && (el.style.display === 'none' || el.style.visibility === 'hidden')) return true;
      } catch (_) {}
      return false;
    }

    function getFlatChildren(node) {
      if (!node) return [];
      const tag = node.nodeType === 1 && node.tagName ? node.tagName.toUpperCase() : '';
      if (tag === 'SLOT' && typeof node.assignedNodes === 'function') {
        const assigned = node.assignedNodes({ flatten: true });
        if (assigned && assigned.length > 0) return assigned;
      }
      const sr = node.nodeType === 1 ? (node.shadowRoot || node._sfShadowRoot) : null;
      if (sr) return Array.from(sr.childNodes || []);
      return Array.from(node.childNodes || []);
    }

    function getFlatParent(node) {
      if (!node) return null;
      if (node.assignedSlot) return node.assignedSlot;
      if (node.parentNode) return node.parentNode;
      if (node.host) return node.host;
      return null;
    }

    function findFlatLca(a, b) {
      if (!a || !b) return document.body || document.documentElement;
      const ancestors = new Set();
      let cur = a;
      for (let i = 0; cur && i < 200; i++) {
        ancestors.add(cur);
        cur = getFlatParent(cur);
      }
      cur = b;
      for (let i = 0; cur && i < 200; i++) {
        if (ancestors.has(cur)) return cur;
        cur = getFlatParent(cur);
      }
      return document.body || document.documentElement;
    }

    function collectAllShadowRoots(root, priorityNodes = []) {
      const out = [];
      const seen = new Set();
      const addRoot = (sr) => {
        if (sr && !seen.has(sr)) {
          seen.add(sr);
          out.push(sr);
        }
      };

      // 1. Always collect shadow roots from priority nodes (event composedPath, recent dblclick slot, etc.) first
      for (const pn of priorityNodes) {
        let cur = pn;
        for (let i = 0; cur && i < 40; i++) {
          if (typeof ShadowRoot !== 'undefined' && cur instanceof ShadowRoot) {
            addRoot(cur);
          } else if (cur.nodeType === 1) {
            addRoot(cur.shadowRoot || cur._sfShadowRoot);
          }
          const rn = cur.getRootNode ? cur.getRootNode() : null;
          cur = cur.parentNode || (rn && rn.host) || null;
        }
      }

      // 2. Walk visible DOM subtrees (skipping hidden background Console tabs) to collect all active shadow roots
      const stack = [root || document.body || document.documentElement];
      let visited = 0;
      while (stack.length > 0 && visited < 60000) {
        const node = stack.pop();
        if (!node) continue;
        visited++;
        if (node.nodeType === 1) {
          if (node.classList && (node.classList.contains('hidden') || node.classList.contains('slds-hide'))) {
            continue;
          }
          if (node.style && node.style.display === 'none') {
            continue;
          }
          const sr = node.shadowRoot || node._sfShadowRoot;
          if (sr && !seen.has(sr)) {
            addRoot(sr);
            stack.push(sr);
          }
        }
        const children = node.children;
        if (children && children.length > 0) {
          for (let i = children.length - 1; i >= 0; i--) {
            stack.push(children[i]);
          }
        }
      }
      return out;
    }

    function readFlattenedSlotText(node, seen = new Set()) {
      if (!node || seen.has(node)) return '';
      seen.add(node);
      if (node.nodeType === 3) return node.nodeValue || '';
      if (node.nodeType !== 1 && node.nodeType !== 11) return '';
      const tag = node.tagName ? node.tagName.toUpperCase() : '';
      if (tag === 'BR') return '\n';
      if (node.nodeType === 1 && isSkippedElement(node)) return '';
      let out = '';
      for (const child of getFlatChildren(node)) {
        out += readFlattenedSlotText(child, seen);
      }
      if (BLOCK_TAGS.has(tag) && out.trim()) return `\n${out}\n`;
      if ((tag === 'TD' || tag === 'TH') && out.trim()) return `${out}\t`;
      return out;
    }

    /**
     * Serialize the exact visible text between (startContainer, startOffset) and
     * (endContainer, endOffset) across the rendered flat tree (piercing Shadow DOM & <slot>s).
     */
    function serializeComposedRange(startContainer, startOffset, endContainer, endOffset) {
      if (!startContainer || !endContainer) return '';
      if (startContainer === endContainer && startContainer.nodeType === 3) {
        return normalizeCopiedText((startContainer.nodeValue || '').slice(startOffset, endOffset));
      }

      const lca = findFlatLca(startContainer, endContainer);
      if (!lca) return '';

      let state = 'before'; // 'before' | 'inside' | 'done'
      const chunks = [];
      const visited = new Set();

      const walk = (node) => {
        if (!node || state === 'done' || visited.has(node)) return;
        visited.add(node);

        if (node.nodeType === 3) {
          const val = node.nodeValue || '';
          if (node === startContainer && node === endContainer) {
            chunks.push(val.slice(startOffset, endOffset));
            state = 'done';
            return;
          }
          if (node === startContainer) {
            chunks.push(val.slice(startOffset));
            state = 'inside';
            return;
          }
          if (node === endContainer) {
            if (state === 'inside') chunks.push(val.slice(0, endOffset));
            state = 'done';
            return;
          }
          if (state === 'inside') chunks.push(val);
          return;
        }

        if (node.nodeType !== 1 && node.nodeType !== 11) return;
        const tag = node.tagName ? node.tagName.toUpperCase() : '';

        if (node.nodeType === 1 && isSkippedElement(node)) {
          if (node === startContainer) state = 'inside';
          if (node === endContainer) state = 'done';
          return;
        }

        if (tag === 'BR') {
          if (state === 'inside') chunks.push('\n');
          return;
        }

        const isStartEl = node === startContainer;
        const isEndEl = node === endContainer;
        const isBlock = BLOCK_TAGS.has(tag);
        const beforeLen = chunks.length;

        if (isBlock && state === 'inside') chunks.push('\n');

        if (isStartEl || isEndEl) {
          // Offset on an Element/ShadowRoot indexes into its DOM childNodes
          const domChildren = Array.from(node.childNodes || []);
          const fromIdx = isStartEl ? startOffset : 0;
          const toIdx = isEndEl ? endOffset : domChildren.length;

          if (isStartEl && isEndEl) {
            state = 'inside';
            for (let i = fromIdx; i < toIdx && i < domChildren.length; i++) {
              walk(domChildren[i]);
              if (state === 'done') break;
            }
            state = 'done';
          } else if (isStartEl) {
            state = 'inside';
            for (let i = fromIdx; i < domChildren.length; i++) {
              walk(domChildren[i]);
              if (state === 'done') break;
            }
          } else {
            // isEndEl
            for (let i = 0; i < toIdx && i < domChildren.length; i++) {
              walk(domChildren[i]);
              if (state === 'done') break;
            }
            state = 'done';
          }
        } else {
          const flatChildren = getFlatChildren(node);
          for (let i = 0; i < flatChildren.length; i++) {
            walk(flatChildren[i]);
            if (state === 'done') break;
          }
        }

        if (isBlock && chunks.length > beforeLen) chunks.push('\n');
        if ((tag === 'TD' || tag === 'TH') && chunks.length > beforeLen) chunks.push('\t');
      };

      walk(lca);
      return normalizeCopiedText(chunks.join(''));
    }

    document.addEventListener(
      'dblclick',
      (e) => {
        try {
          const _modSettings = getEnhancerSettings();
          if (_modSettings.modules && _modSettings.modules.clipboardFix === false) return;
          const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
          let foundSlot = null;
          for (const node of path) {
            if (!node || node.nodeType !== 1) continue;
            if (node.tagName && node.tagName.toUpperCase() === 'SLOT') {
              foundSlot = node;
              break;
            }
            if (node.classList && node.classList.contains('fieldComponent')) {
              const s = node.querySelector('slot');
              if (s) {
                foundSlot = s;
                break;
              }
            }
          }
          if (foundSlot) {
            lastDblClickSlot = foundSlot;
            lastDblClickAt = Date.now();
          }
        } catch (_) {}
      },
      true
    );

    document.addEventListener(
      'copy',
      (e) => {
        try {
          const _modSettings = getEnhancerSettings();
          if (_modSettings.modules && _modSettings.modules.clipboardFix === false) return;
          if (!e.clipboardData) return;
          const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];
          const firstEl = path[0];
          if (
            firstEl &&
            firstEl.nodeType === 1 &&
            (firstEl.tagName === 'INPUT' || firstEl.tagName === 'TEXTAREA' || firstEl.isContentEditable)
          ) {
            return;
          }

          const sel = window.getSelection ? window.getSelection() : null;
          const nativeText = sel ? normalizeCopiedText(sel.toString()) : '';

          // Collect all active ShadowRoots on the page (prioritizing composedPath + recent dblclick slot)
          const priorityNodes = path.slice();
          if (lastDblClickSlot && lastDblClickSlot.isConnected && Date.now() - lastDblClickAt < 10000) {
            priorityNodes.push(lastDblClickSlot);
          }
          const shadowRoots = collectAllShadowRoots(document.body || document.documentElement, priorityNodes);

          let composedText = '';

          // 1. Primary path: Selection.getComposedRanges() (exact Blink flat-tree range across all shadow roots)
          if (sel && typeof sel.getComposedRanges === 'function') {
            let ranges = [];
            try {
              ranges = sel.getComposedRanges({ shadowRoots });
            } catch (_) {
              try {
                ranges = sel.getComposedRanges(...shadowRoots);
              } catch (_) {}
            }
            const parts = [];
            for (const r of ranges || []) {
              if (!r || r.collapsed) continue;
              const txt = serializeComposedRange(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
              if (txt) parts.push(txt);
            }
            composedText = normalizeCopiedText(parts.join('\n'));
          }

          // 2. Fallback: window Selection live range serialized through flat tree
          if (!composedText && sel && sel.rangeCount > 0) {
            const r = sel.getRangeAt(0);
            if (r && !r.collapsed) {
              composedText = serializeComposedRange(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
            }
          }

          // 3. Fallback: recent double-click on a Shadow DOM <slot> field (e.g. Highlights Panel fieldComponent)
          if (!composedText && !nativeText && lastDblClickSlot && lastDblClickSlot.isConnected && Date.now() - lastDblClickAt < 10000) {
            const pathHasFieldSlot = path.some(
              (n) =>
                n === lastDblClickSlot ||
                (n && n.nodeType === 1 && n.classList && n.classList.contains('fieldComponent') && n.contains(lastDblClickSlot))
            );
            const hasActiveSelection =
              (sel && sel.rangeCount > 0 && !sel.isCollapsed) ||
              shadowRoots.some((sr) => typeof sr.getSelection === 'function' && sr.getSelection() && !sr.getSelection().isCollapsed);
            if (pathHasFieldSlot || hasActiveSelection) {
              composedText = normalizeCopiedText(readFlattenedSlotText(lastDblClickSlot));
            }
          }

          // Override clipboard whenever the composed flat tree captured more text than Chrome's native DOM copy
          // (fixes empty <slot></slot> copies AND partial copies where Chrome stopped at the first shadow boundary)
          if (composedText && (!nativeText || composedText.length > nativeText.length)) {
            e.clipboardData.setData('text/plain', composedText);
            e.preventDefault();
          }
        } catch (_) {}
      },
      true
    );
  }

  initShadowSlotCopyFix();

  if (isTopWindow) {
    initTabDragAndDrop();
    const initInterval = setInterval(() => {
      if (window.$A && typeof window.$A.createComponent === 'function') {
        installAuraEventHook();
        snapshotTabState();
        clearInterval(initInterval);
      }
    }, 500);
  }

  // Prevent browser text selection on modifier clicks (Lightning Console apps only)
  window.addEventListener(
    'selectstart',
    (event) => {
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (!isConsoleAppActive()) return;
      if (event.altKey || event.metaKey || event.ctrlKey) {
        event.preventDefault();
      }
    },
    true
  );

  let snapshotDebounceTimer = null;
  function scheduleSnapshotTabState(delay = 250) {
    clearTimeout(snapshotDebounceTimer);
    snapshotDebounceTimer = setTimeout(() => {
      if (!activeTabDragState && !isInternalWorkspaceCall) {
        snapshotTabState();
      }
    }, delay);
  }

  window.addEventListener(
    'mousedown',
    (event) => {
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (!isConsoleAppActive()) return;
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      if ((isAlt || isCmdOrCtrl) && event.button === 0) {
        snapshotTabState();
        event.preventDefault();
        try {
          window.getSelection()?.removeAllRanges();
        } catch (_) {}

        const target = extractTargetFromEvent(event);
        if (target) {
          event.stopPropagation();
        }
      } else if (event.button === 0) {
        scheduleSnapshotTabState(300);
      }
    },
    true
  );

  window.addEventListener(
    'click',
    (event) => {
      if (event.button !== 0) return;
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (!isConsoleAppActive()) return;

      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      if (!isAlt && !isCmdOrCtrl) return;

      try {
        window.getSelection()?.removeAllRanges();
      } catch (_) {}

      const target = extractTargetFromEvent(event);

      // --- Scenario A: Alt / Option is held -> Open as SUBTAB ---
      if (isAlt && !isCmdOrCtrl) {
        const openInBackground = event.shiftKey;
        const preferPinned = false;

        if (target) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          if (target.recordId && !target.url) {
            target.url = `/lightning/r/${target.recordId}/view`;
          }

          openTargetAsSubtab(target, {
            openInBackground,
            preferPinned,
            explicitParentTabId: preClickParentTabId
          }).then(() => {
            setTimeout(() => {
              document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
            }, 120);
          }).catch(() => {
            if (target.url) window.location.assign(target.url);
          });
          return;
        }

        armNavigationIntercept(openInBackground, preferPinned);
        return;
      }

      // --- Scenario B: Cmd (Mac) or Ctrl (PC) is held -> Open as NEW PRIMARY WORKSPACE TAB ---
      if (isCmdOrCtrl && !isAlt) {
        if (target) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();

          setTimeout(() => {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
          }, 50);

          const focus = !event.shiftKey;
          openTargetAsPrimaryTab(target, { focus });
          return;
        }
      }
    },
    true
  );

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'Enter') return;
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (!isConsoleAppActive()) return;
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      if (isAlt && !isCmdOrCtrl) {
        snapshotTabState();
        const openInBackground = event.shiftKey;
        armNavigationIntercept(openInBackground, false);
      }
    },
    true
  );

  /* ==========================================================================
     TAB & SUBTAB KEYBOARD SHORTCUTS (v1.3.2)
     ========================================================================== */

  const IGNORED_MODIFIER_CODES = new Set([
    'ShiftLeft', 'ShiftRight',
    'ControlLeft', 'ControlRight',
    'AltLeft', 'AltRight',
    'MetaLeft', 'MetaRight',
    'CapsLock'
  ]);

  function isEditableKeyboardEvent(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [event.target];
    for (const node of path) {
      if (!node || node.nodeType !== 1) continue;
      const tag = node.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      if (node.isContentEditable || node.getAttribute?.('contenteditable') === 'true') return true;
      const role = node.getAttribute?.('role');
      if (role === 'textbox' || role === 'combobox' || role === 'searchbox') return true;
    }
    return false;
  }

  function normalizeKeyComboFromEvent(event) {
    if (!event || !event.code || IGNORED_MODIFIER_CODES.has(event.code)) return '';
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    parts.push(event.code);
    return parts.join('+');
  }

  let isKeybindCommandRunning = false;
  let isSyntheticTabReorder = false;
  const logicalTabOrderCache = new Map(); // scopeKey -> string[] (tabIds)

  function getTabBarItemsInDom(isSubtab) {
    const selector = isSubtab
      ? '.navexConsoleTabContainer[aria-label="Active Workspace Subtabs"] li.tabItem, .navexConsoleSubtabContainer li.tabItem, ul.slds-sub-tabs li.slds-sub-tabs__item, li.slds-sub-tabs__item'
      : '.navexConsoleTabContainer[aria-label="Workspaces"] li.tabItem, .navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]) li.tabItem';
    const seen = new Set();
    const out = [];
    try {
      const nodes = document.querySelectorAll(selector);
      for (const li of nodes) {
        if (!li || seen.has(li)) continue;
        if (li.classList && li.classList.contains('hidden')) continue;
        if (!isSubtab && isSubtabElement(li)) continue;
        const rect = li.getBoundingClientRect ? li.getBoundingClientRect() : null;
        if (rect && rect.width <= 0 && rect.height <= 0) continue;
        const tid = getTabIdFromElement(li);
        if (!tid) continue;
        seen.add(li);
        out.push({ li, tabId: tid });
      }
    } catch (_) {}
    return out;
  }

  function moveLogicalTabRelative(scopeKey, sourceId, targetId, delta) {
    if (!scopeKey || !sourceId || !targetId || sourceId === targetId) return;
    const order = logicalTabOrderCache.get(scopeKey);
    if (!Array.isArray(order)) return;
    const srcIdx = order.indexOf(sourceId);
    if (srcIdx < 0 || order.indexOf(targetId) < 0) return;
    const next = order.slice();
    next.splice(srcIdx, 1);
    const dstIdx = next.indexOf(targetId);
    if (dstIdx < 0) return;
    next.splice(delta < 0 ? dstIdx : dstIdx + 1, 0, sourceId);
    logicalTabOrderCache.set(scopeKey, next);
  }

  /**
   * Maintain a stable logical tab order across visible tabs and "More" overflow tabs.
   * When Salesforce focuses a tab from the "More" dropdown, Salesforce mutates both the DOM
   * and ws.getAllTabInfo() by promoting that tab into the last visible slot and pushing the
   * previous slot occupant to the top of "More". Preserving logical order makes cycling
   * through "More" tabs seamless in both directions while still respecting genuine drag reorders.
   */
  function getStableTabOrder(rawTabs, isSubtab, scopeKey = isSubtab ? 'subtabs' : 'workspaces') {
    if (!Array.isArray(rawTabs) || rawTabs.length <= 1) return rawTabs || [];

    const byId = new Map();
    const pinnedApi = [];
    const unpinnedApi = [];
    for (const t of rawTabs) {
      if (!t || !t.tabId || byId.has(t.tabId)) continue;
      byId.set(t.tabId, t);
      if (t.pinned) pinnedApi.push(t.tabId);
      else unpinnedApi.push(t.tabId);
    }

    const visibleDomIds = getTabBarItemsInDom(isSubtab)
      .map((item) => item.tabId)
      .filter((id) => byId.has(id));

    const visiblePinned = visibleDomIds.filter((id) => byId.get(id).pinned);
    const visibleUnpinned = visibleDomIds.filter((id) => !byId.get(id).pinned);

    // Pinned tabs do not overflow into "More"; always honor their live visual order
    const pinnedOrder = [
      ...visiblePinned,
      ...pinnedApi.filter((id) => !visiblePinned.includes(id))
    ];

    const prevOrder = logicalTabOrderCache.get(scopeKey);
    let unpinnedOrder;

    if (!Array.isArray(prevOrder) || prevOrder.length === 0) {
      // Initial snapshot: visible unpinned tabs left-to-right, then overflow ("More") tabs
      unpinnedOrder = [
        ...visibleUnpinned,
        ...unpinnedApi.filter((id) => !visibleUnpinned.includes(id))
      ];
    } else {
      const prevUnpinned = prevOrder.filter((id) => byId.has(id) && !byId.get(id).pinned);
      const prevSet = new Set(prevUnpinned);

      // Append newly opened unpinned tabs in their current visual/API order
      const addedUnpinned = [
        ...visibleUnpinned.filter((id) => !prevSet.has(id)),
        ...unpinnedApi.filter((id) => !prevSet.has(id) && !visibleUnpinned.includes(id))
      ];
      unpinnedOrder = [...prevUnpinned, ...addedUnpinned];

      // Under Salesforce "More" overflow swaps, visibleUnpinned always remains a strictly
      // increasing subsequence of unpinnedOrder. If not, a genuine visual reorder occurred.
      if (visibleUnpinned.length > 1) {
        let lastPos = -1;
        let isSubsequence = true;
        for (const id of visibleUnpinned) {
          const pos = unpinnedOrder.indexOf(id);
          if (pos <= lastPos) {
            isSubsequence = false;
            break;
          }
          lastPos = pos;
        }
        if (!isSubsequence) {
          const visSet = new Set(visibleUnpinned);
          unpinnedOrder = [
            ...visibleUnpinned,
            ...unpinnedOrder.filter((id) => !visSet.has(id))
          ];
        }
      }
    }

    const fullOrder = [...pinnedOrder, ...unpinnedOrder];
    logicalTabOrderCache.set(scopeKey, fullOrder);
    return fullOrder.map((id) => byId.get(id)).filter(Boolean);
  }

  async function cycleWorkspaceTab(ws, delta) {
    const [rawAllTabs, focused] = await Promise.all([
      ws.getAllTabInfo().catch(() => []),
      ws.getFocusedTabInfo().catch(() => null)
    ]);
    const allTabs = getStableTabOrder(rawAllTabs, false, 'workspaces');
    if (!Array.isArray(allTabs) || allTabs.length === 0) return;
    if (allTabs.length === 1) {
      showToast('Only one workspace tab open');
      return;
    }
    const activeWsId = focused ? (focused.isSubtab && focused.parentTabId ? focused.parentTabId : focused.tabId) : null;
    let idx = activeWsId ? allTabs.findIndex((t) => t.tabId === activeWsId) : 0;
    if (idx < 0) idx = 0;
    const nextTab = allTabs[(idx + delta + allTabs.length) % allTabs.length];
    if (nextTab && nextTab.tabId) {
      await activateWorkspaceAndSubtab(ws, nextTab.tabId, null, { preserveActiveSubtab: true });
    }
  }

  async function cycleSubtabInWorkspace(ws, delta) {
    const focused = await ws.getFocusedTabInfo().catch(() => null);
    if (!focused || !focused.tabId) return;
    const parentId = focused.isSubtab && focused.parentTabId ? focused.parentTabId : focused.tabId;
    const parentInfo = await ws.getTabInfo({ tabId: parentId }).catch(() => null);
    if (!parentInfo) return;
    const rawSubList = Array.isArray(parentInfo.subtabs) ? parentInfo.subtabs : [];
    const subList = getStableTabOrder(rawSubList, true, `subtabs:${parentId}`);
    const cycle = [parentInfo, ...subList];
    if (cycle.length <= 1) {
      showToast('No subtabs in active workspace');
      return;
    }
    let idx = cycle.findIndex((t) => t && t.tabId === focused.tabId);
    if (idx < 0) idx = 0;
    const target = cycle[(idx + delta + cycle.length) % cycle.length];
    if (!target || !target.tabId) return;
    if (target.tabId === parentId) {
      await activateWorkspaceAndSubtab(ws, parentId, null);
    } else {
      await activateWorkspaceAndSubtab(ws, parentId, target.tabId);
    }
  }

  async function reorderFocusedTab(ws, delta) {
    const [allTabs, focused] = await Promise.all([
      ws.getAllTabInfo().catch(() => []),
      ws.getFocusedTabInfo().catch(() => null)
    ]);
    if (!focused || !focused.tabId) return;

    const isSubtab = !!focused.isSubtab;
    const pinnedIds = new Set();
    if (Array.isArray(allTabs)) {
      for (const t of allTabs) {
        if (t && t.pinned && t.tabId) pinnedIds.add(t.tabId);
        if (t && Array.isArray(t.subtabs)) {
          for (const st of t.subtabs) {
            if (st && st.pinned && st.tabId) pinnedIds.add(st.tabId);
          }
        }
      }
    }

    const domItems = getTabBarItemsInDom(isSubtab);
    const sourceEntry = domItems.find((item) => item.tabId === focused.tabId);
    if (!sourceEntry || !sourceEntry.li || !sourceEntry.li.parentNode) {
      showToast('Could not locate active tab in tab bar');
      return;
    }

    const sourceLi = sourceEntry.li;
    const isNodePinned = (el, tid) =>
      !!(
        (tid && pinnedIds.has(tid)) ||
        (el && el.classList && (el.classList.contains('pinned') || el.classList.contains('isPinned')))
      );
    const isSourcePinned = isNodePinned(sourceLi, focused.tabId);
    const parentUl = sourceLi.parentNode;
    const visibleBarItems = Array.from(parentUl.children).filter((child) => {
      if (!child || child.nodeType !== 1) return false;
      if (child.classList && child.classList.contains('hidden')) return false;
      const rect = child.getBoundingClientRect ? child.getBoundingClientRect() : null;
      if (rect && rect.width <= 0 && rect.height <= 0) return false;
      return !!getTabIdFromElement(child);
    });

    // Moving the first subtab left into the workspace owner slot promotes it to become the workspace owner
    if (isSubtab && delta < 0 && focused.parentTabId && focused.tabId !== focused.parentTabId) {
      const visIdx = visibleBarItems.indexOf(sourceLi);
      const prevBarLi = visIdx > 0 ? visibleBarItems[visIdx - 1] : null;
      const prevBarTabId = prevBarLi ? getTabIdFromElement(prevBarLi) : null;
      if (prevBarTabId === focused.parentTabId) {
        await makeSubtabWorkspaceOwner(ws, focused.tabId, focused.parentTabId);
        return;
      }
    }

    const siblings = visibleBarItems.filter((child) => {
      const tid = getTabIdFromElement(child);
      if (!tid) return false;
      return isNodePinned(child, tid) === isSourcePinned;
    });

    const curIdx = siblings.indexOf(sourceLi);
    if (curIdx < 0) return;
    const targetIdx = curIdx + delta;
    if (targetIdx < 0 || targetIdx >= siblings.length) {
      showToast(
        delta < 0
          ? (isSubtab ? 'Subtab is already leftmost' : 'Tab is already leftmost')
          : (isSubtab ? 'Subtab is already rightmost' : 'Tab is already rightmost')
      );
      return;
    }

    const targetLi = siblings[targetIdx];
    const targetTabId = getTabIdFromElement(targetLi);
    const beforeDomIndex = Array.from(parentUl.children).indexOf(sourceLi);

    // 1. Try native Salesforce Console reorder via synthetic HTML5 DragEvent on neighbor's outer edge
    isSyntheticTabReorder = true;
    try {
      const srcRect = sourceLi.getBoundingClientRect();
      const dstRect = targetLi.getBoundingClientRect();
      const srcX = srcRect.left + srcRect.width / 2;
      const srcY = srcRect.top + srcRect.height / 2;
      const dstX = delta < 0 ? dstRect.left + 4 : dstRect.right - 4;
      const dstY = dstRect.top + dstRect.height / 2;
      const dt = typeof DataTransfer !== 'undefined' ? new DataTransfer() : undefined;
      const makeDrag = (type, x, y) =>
        new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          clientX: x,
          clientY: y,
          dataTransfer: dt
        });
      sourceLi.dispatchEvent(makeDrag('dragstart', srcX, srcY));
      targetLi.dispatchEvent(makeDrag('dragenter', dstX, dstY));
      targetLi.dispatchEvent(makeDrag('dragover', dstX, dstY));
      targetLi.dispatchEvent(makeDrag('drop', dstX, dstY));
      sourceLi.dispatchEvent(makeDrag('dragend', dstX, dstY));
    } catch (_) {
    } finally {
      isSyntheticTabReorder = false;
    }

    await new Promise((r) => setTimeout(r, 35));
    const afterDomIndex = Array.from(parentUl.children).indexOf(sourceLi);

    // 2. Fallback: swap sibling <li> nodes directly in the tab bar if native handler ignored synthetic DragEvent
    if (afterDomIndex === beforeDomIndex && sourceLi.parentNode === parentUl && targetLi.parentNode === parentUl) {
      try {
        if (delta < 0) {
          parentUl.insertBefore(sourceLi, targetLi);
        } else {
          parentUl.insertBefore(sourceLi, targetLi.nextSibling);
        }
      } catch (domErr) {
        console.warn('[Salesforce Enhancer] Could not reorder tab element:', domErr);
        showToast('Could not reorder tab');
        return;
      }
    }

    const reorderScopeKey = isSubtab ? `subtabs:${focused.parentTabId || ''}` : 'workspaces';
    moveLogicalTabRelative(reorderScopeKey, focused.tabId, targetTabId, delta);

    showToast(
      delta < 0
        ? (isSubtab ? '← Moved subtab left' : '← Moved tab left')
        : (isSubtab ? '→ Moved subtab right' : '→ Moved tab right')
    );
  }

  async function moveFocusedTabToNeighborWorkspace(ws, delta) {
    const [rawAllTabs, focused] = await Promise.all([
      ws.getAllTabInfo().catch(() => []),
      ws.getFocusedTabInfo().catch(() => null)
    ]);
    const allTabs = getStableTabOrder(rawAllTabs, false, 'workspaces');
    if (!focused || !focused.tabId || !Array.isArray(allTabs) || allTabs.length < 2) {
      showToast('Need at least 2 workspace tabs to move');
      return;
    }
    const activeWsId = focused.isSubtab && focused.parentTabId ? focused.parentTabId : focused.tabId;
    const wsIdx = allTabs.findIndex((t) => t.tabId === activeWsId);
    if (wsIdx < 0) return;
    const neighborWs = allTabs[(wsIdx + delta + allTabs.length) % allTabs.length];
    if (!neighborWs || !neighborWs.tabId || neighborWs.tabId === activeWsId) return;

    if (focused.isSubtab) {
      await moveSubtabToWorkspace(focused.tabId, neighborWs.tabId);
    } else {
      await movePrimaryTabToSubtab(activeWsId, neighborWs.tabId);
    }
  }

  async function executeTabKeybindCommand(command) {
    if (!isTopWindow || !command || isKeybindCommandRunning) return;
    if (!isConsoleAppActive()) return;
    isKeybindCommandRunning = true;
    try {
      const ws = await getWorkspaceAPI();
      if (!ws || !(await isConsoleNavigationActive(ws))) return;

      if (command === 'prevWorkspace') {
        await cycleWorkspaceTab(ws, -1);
      } else if (command === 'nextWorkspace') {
        await cycleWorkspaceTab(ws, 1);
      } else if (command === 'prevSubtab') {
        await cycleSubtabInWorkspace(ws, -1);
      } else if (command === 'nextSubtab') {
        await cycleSubtabInWorkspace(ws, 1);
      } else if (command === 'reorderTabLeft') {
        await reorderFocusedTab(ws, -1);
      } else if (command === 'reorderTabRight') {
        await reorderFocusedTab(ws, 1);
      } else if (command === 'promoteSubtab') {
        const focused = await ws.getFocusedTabInfo().catch(() => null);
        if (!focused || !focused.isSubtab) {
          showToast('Active tab is already a workspace tab');
          return;
        }
        await promoteSubtabToPrimary(focused.tabId);
      } else if (command === 'moveTabPrevWorkspace') {
        await moveFocusedTabToNeighborWorkspace(ws, -1);
      } else if (command === 'moveTabNextWorkspace') {
        await moveFocusedTabToNeighborWorkspace(ws, 1);
      } else if (command === 'closeCurrentTab') {
        const focused = await ws.getFocusedTabInfo().catch(() => null);
        if (focused && focused.tabId && ws.closeTab) {
          await ws.closeTab({ tabId: focused.tabId }).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[Salesforce Enhancer] Keybind action failed:', err);
    } finally {
      isKeybindCommandRunning = false;
    }
  }

  const MOVE_KEYBIND_COMMANDS = new Set([
    'reorderTabLeft',
    'reorderTabRight',
    'promoteSubtab',
    'moveTabPrevWorkspace',
    'moveTabNextWorkspace',
    'closeCurrentTab'
  ]);

  function initTabKeybinds() {
    window.addEventListener(
      'keydown',
      (event) => {
        if (document.getElementById('sf-enhancer-merge-modal')) return;
        const _modSettings = getEnhancerSettings();
        if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
        const keybinds = _modSettings.subtabs && _modSettings.subtabs.keybinds;
        if (!keybinds || keybinds.enabled === false) return;
        if (!isConsoleAppActive()) return;
        if (isEditableKeyboardEvent(event)) return;

        const combo = normalizeKeyComboFromEvent(event);
        if (!combo) return;

        let matchedCommand = '';
        for (const cmd of Object.keys(DEFAULT_KEYBINDS)) {
          if (cmd === 'enabled') continue;
          if (keybinds[cmd] && keybinds[cmd] === combo) {
            matchedCommand = cmd;
            break;
          }
        }
        if (!matchedCommand) return;
        if (event.repeat && MOVE_KEYBIND_COMMANDS.has(matchedCommand)) {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (isTopWindow) {
          executeTabKeybindCommand(matchedCommand);
        } else {
          try {
            window.top.postMessage(
              { __sfEnhancer: true, action: 'tabKeybind', command: matchedCommand },
              '*'
            );
          } catch (_) {}
        }
      },
      true
    );
  }

  initTabKeybinds();

  /* ==========================================================================
     TAB DRAG & DROP MODULE (v1.2.4)
     Bidirectional workspace / subtab drag-and-drop:
     - Drag a Primary Workspace Tab into another Primary Tab -> converts into a Subtab
     - Drag a Subtab out onto the Primary Tab Bar -> promotes into an independent Workspace Tab
     - Drag a Subtab into another Primary Tab -> moves Subtab into that Workspace
     ========================================================================== */

  let activeTabDragState = null;
  let currentDropHighlightEl = null;
  let currentDropHighlightMode = '';

  function ensureTabDragStyles() {
    if (!isTopWindow) return;
    if (document.getElementById('sf-tab-drag-style')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'sf-tab-drag-style';
    styleEl.textContent = `
      li.tabItem.sf-tab-dragging,
      li.slds-sub-tabs__item.sf-tab-dragging,
      .navexConsoleTabItem.sf-tab-dragging {
        opacity: 0.45 !important;
        cursor: grabbing !important;
      }
      li.tabItem.sf-tab-draggable,
      li.slds-sub-tabs__item.sf-tab-draggable,
      .navexConsoleTabItem.sf-tab-draggable {
        cursor: grab;
      }
      li.tabItem.sf-tab-drop-hover,
      li.slds-sub-tabs__item.sf-tab-drop-hover,
      .navexConsoleTabItem.sf-tab-drop-hover,
      [role="tab"].sf-tab-drop-hover {
        outline: 2px dashed var(--sf-theme-accent, #0176d3) !important;
        outline-offset: -2px !important;
        background-color: var(--sf-theme-accent-tint, rgba(1, 118, 211, 0.15)) !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      li.tabItem.sf-tab-drop-hover::after,
      li.slds-sub-tabs__item.sf-tab-drop-hover::after,
      .navexConsoleTabItem.sf-tab-drop-hover::after,
      [role="tab"].sf-tab-drop-hover::after {
        content: "↳ Drop to convert to subtab" !important;
        display: inline-block !important;
        position: absolute !important;
        top: calc(100% + 4px) !important;
        bottom: auto !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: auto !important;
        height: auto !important;
        min-height: 0 !important;
        max-width: none !important;
        background: var(--sf-theme-accent, #0176d3) !important;
        background-color: var(--sf-theme-accent, #0176d3) !important;
        color: var(--sf-theme-accent-contrast, #ffffff) !important;
        font-size: 11.5px !important;
        font-weight: 600 !important;
        line-height: 1.35 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        padding: 4px 10px !important;
        border-radius: 5px !important;
        border: 1px solid rgba(255, 255, 255, 0.22) !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        z-index: 999999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
      li.tabItem.sf-tab-drop-hover.sf-promote-hover::after,
      .navexConsoleTabItem.sf-tab-drop-hover.sf-promote-hover::after,
      [role="tab"].sf-tab-drop-hover.sf-promote-hover::after {
        content: "↳ Drop to promote to workspace tab" !important;
      }
      li.tabItem.sf-tab-drop-hover.sf-subtab-target-hover::after,
      .navexConsoleTabItem.sf-tab-drop-hover.sf-subtab-target-hover::after,
      [role="tab"].sf-tab-drop-hover.sf-subtab-target-hover::after {
        content: "↳ Drop to move to this workspace" !important;
      }
      li.tabItem.sf-tab-drop-hover.sf-owner-hover::after,
      li.slds-sub-tabs__item.sf-tab-drop-hover.sf-owner-hover::after,
      .navexConsoleTabItem.sf-tab-drop-hover.sf-owner-hover::after,
      [role="tab"].sf-tab-drop-hover.sf-owner-hover::after {
        content: "★ Drop to make workspace owner" !important;
        left: 0 !important;
        transform: none !important;
      }
      li.tabItem.sf-tab-drop-hover.sf-move-owner-hover::after,
      li.slds-sub-tabs__item.sf-tab-drop-hover.sf-move-owner-hover::after,
      .navexConsoleTabItem.sf-tab-drop-hover.sf-move-owner-hover::after,
      [role="tab"].sf-tab-drop-hover.sf-move-owner-hover::after {
        content: "↳ Drop to demote workspace owner" !important;
      }
      .sf-subtab-bar-drop-hover,
      .navexConsoleTabContainer[aria-label="Active Workspace Subtabs"].sf-subtab-bar-drop-hover,
      .navexConsoleSubtabContainer.sf-subtab-bar-drop-hover,
      .subTabBarContainer.sf-subtab-bar-drop-hover,
      .subTabBar.sf-subtab-bar-drop-hover,
      .slds-sub-tabs.sf-subtab-bar-drop-hover {
        outline: 2px dashed var(--sf-theme-accent, #0176d3) !important;
        outline-offset: -2px !important;
        background-color: var(--sf-theme-accent-tint, rgba(1, 118, 211, 0.15)) !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      .sf-subtab-bar-drop-hover::after,
      .navexConsoleTabContainer[aria-label="Active Workspace Subtabs"].sf-subtab-bar-drop-hover::after,
      .navexConsoleSubtabContainer.sf-subtab-bar-drop-hover::after,
      .subTabBarContainer.sf-subtab-bar-drop-hover::after,
      .subTabBar.sf-subtab-bar-drop-hover::after,
      .slds-sub-tabs.sf-subtab-bar-drop-hover::after {
        content: "↳ Drop to add to this workspace as subtab" !important;
        display: inline-block !important;
        position: absolute !important;
        top: calc(100% + 4px) !important;
        bottom: auto !important;
        left: 20px !important;
        right: auto !important;
        width: auto !important;
        height: auto !important;
        background: var(--sf-theme-accent, #0176d3) !important;
        background-color: var(--sf-theme-accent, #0176d3) !important;
        color: var(--sf-theme-accent-contrast, #ffffff) !important;
        font-size: 11.5px !important;
        font-weight: 600 !important;
        line-height: 1.35 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        padding: 4px 10px !important;
        border-radius: 5px !important;
        border: 1px solid rgba(255, 255, 255, 0.22) !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        z-index: 999999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
      .sf-bar-drop-hover,
      .navexConsoleTabContainer[aria-label="Workspaces"].sf-bar-drop-hover,
      .navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]).sf-bar-drop-hover,
      .navCenter.tabBarContainer.sf-bar-drop-hover {
        outline: 2px dashed var(--sf-theme-accent, #0176d3) !important;
        outline-offset: -2px !important;
        background-color: var(--sf-theme-accent-tint, rgba(1, 118, 211, 0.12)) !important;
        border-radius: 4px !important;
        position: relative !important;
      }
      .sf-bar-drop-hover::after,
      .navexConsoleTabContainer[aria-label="Workspaces"].sf-bar-drop-hover::after,
      .navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]).sf-bar-drop-hover::after,
      .navCenter.tabBarContainer.sf-bar-drop-hover::after {
        content: "↳ Drop to promote to workspace tab" !important;
        display: inline-block !important;
        position: absolute !important;
        top: calc(100% + 4px) !important;
        bottom: auto !important;
        left: 20px !important;
        right: auto !important;
        width: auto !important;
        height: auto !important;
        background: var(--sf-theme-accent, #0176d3) !important;
        background-color: var(--sf-theme-accent, #0176d3) !important;
        color: var(--sf-theme-accent-contrast, #ffffff) !important;
        font-size: 11.5px !important;
        font-weight: 600 !important;
        line-height: 1.35 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        padding: 4px 10px !important;
        border-radius: 5px !important;
        border: 1px solid rgba(255, 255, 255, 0.22) !important;
        white-space: nowrap !important;
        pointer-events: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        z-index: 999999 !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      }
    `;
    (document.head || document.documentElement).appendChild(styleEl);
  }

  function getElementFromTarget(target) {
    if (!target) return null;
    if (target.nodeType === 1) return target;
    return target.parentElement || null;
  }

  function getTabListItem(target) {
    const el = getElementFromTarget(target);
    if (!el || !el.closest) return null;
    // Always prefer the outer <li> tab item before falling back to [role="tab"] (which is often the inner <a>)
    return (
      el.closest('li.tabItem, li.slds-sub-tabs__item, .navexConsoleTabItem') ||
      el.closest('[role="tab"]')
    );
  }

  function getTabIdFromElement(target) {
    const el = getElementFromTarget(target);
    if (!el) return null;
    const direct = el.getAttribute?.('data-tabid') || el.dataset?.tabid;
    if (direct) return direct;
    const li = getTabListItem(el);
    if (li) {
      const liTabId = li.getAttribute?.('data-tabid') || li.dataset?.tabid;
      if (liTabId) return liTabId;
      const a = li.querySelector?.('a[data-tabid], a.tabHeader');
      if (a) return a.getAttribute('data-tabid') || a.dataset?.tabid;
    }
    const anc = el.closest?.('[data-tabid]');
    return anc ? (anc.getAttribute('data-tabid') || anc.dataset?.tabid) : null;
  }

  function isSubtabElement(target) {
    const li = getTabListItem(target);
    if (!li) return false;
    if (li.classList.contains('slds-sub-tabs__item')) return true;
    return !!li.closest(
      '.navexConsoleTabContainer[aria-label="Active Workspace Subtabs"], ' +
      '.navexConsoleSubtabContainer, ' +
      '.slds-sub-tabs, ' +
      'ul[role="tablist"].slds-sub-tabs'
    );
  }

  function getSubtabBarContainer(target) {
    const el = getElementFromTarget(target);
    if (!el || !el.closest) return null;
    return el.closest(
      '.navexConsoleTabContainer[aria-label="Active Workspace Subtabs"], ' +
      '.navexConsoleSubtabContainer, ' +
      '.slds-sub-tabs, ' +
      'ul[role="tablist"].slds-sub-tabs'
    );
  }

  function getPrimaryWorkspaceTabLi(target) {
    const el = getElementFromTarget(target);
    if (!el || !el.closest) return null;
    if (getSubtabBarContainer(el)) return null;
    const li = el.closest('li.tabItem, .navexConsoleTabItem') || el.closest('[role="tab"]');
    if (!li) return null;
    if (li.classList.contains('slds-sub-tabs__item')) return null;
    if (li.closest('.navexConsoleTabContainer[aria-label="Active Workspace Subtabs"], .navexConsoleSubtabContainer, .slds-sub-tabs')) return null;
    return li;
  }

  function isPrimaryWorkspaceDropZone(target) {
    const el = getElementFromTarget(target);
    if (!el || !el.closest) return false;
    if (isSubtabElement(el) || getSubtabBarContainer(el)) return false;
    return !!el.closest(
      '.navexConsoleTabContainer[aria-label="Workspaces"], ' +
      '.navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]), ' +
      '.oneWorkspaceNavigationTabs, ' +
      '.tabBarContainer, ' +
      '.navCenter, ' +
      '.oneConsoleHeader, ' +
      '.slds-context-bar'
    );
  }

  function isInTabCenterDropZone(clientX, tabLi) {
    if (!tabLi || typeof clientX !== 'number') return true;
    const now = performance.now();
    if (!tabLi._sfCachedRect || !tabLi._sfCachedRectTime || now - tabLi._sfCachedRectTime > 120) {
      tabLi._sfCachedRect = tabLi.getBoundingClientRect();
      tabLi._sfCachedRectTime = now;
    }
    const rect = tabLi._sfCachedRect;
    if (!rect || rect.width <= 0) return true;
    // Small 10% (6px to 12px) edge margin on far left/right allows native tab reordering
    const edgeMargin = Math.min(12, Math.max(6, Math.floor(rect.width * 0.10)));
    return clientX >= rect.left + edgeMargin && clientX <= rect.right - edgeMargin;
  }

  async function getActiveWorkspaceTabId(ws) {
    if (!ws) {
      try {
        ws = await getWorkspaceAPI();
      } catch (_) {}
    }
    if (ws) {
      try {
        const focused = await ws.getFocusedTabInfo();
        if (focused) {
          if (focused.isSubtab && focused.parentTabId) return focused.parentTabId;
          if (!focused.isSubtab && focused.tabId) return focused.tabId;
        }
      } catch (_) {}
    }

    const activeLi = document.querySelector(
      '.navexConsoleTabContainer[aria-label="Workspaces"] li.tabItem.slds-is-active, .navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]) li.tabItem.slds-is-active'
    );
    if (activeLi) {
      return getTabIdFromElement(activeLi);
    }
    return null;
  }

  function setTabDropHighlight(el, mode = '') {
    if (currentDropHighlightEl === el && currentDropHighlightMode === mode) {
      return;
    }
    if (currentDropHighlightEl && currentDropHighlightEl !== el) {
      currentDropHighlightEl.classList.remove(
        'sf-tab-drop-hover',
        'sf-promote-hover',
        'sf-subtab-target-hover',
        'sf-owner-hover',
        'sf-move-owner-hover',
        'sf-bar-drop-hover',
        'sf-subtab-bar-drop-hover'
      );
    }
    currentDropHighlightEl = el || null;
    currentDropHighlightMode = mode || '';
    if (!el) return;

    el.classList.remove(
      'sf-tab-drop-hover',
      'sf-promote-hover',
      'sf-subtab-target-hover',
      'sf-owner-hover',
      'sf-move-owner-hover',
      'sf-bar-drop-hover',
      'sf-subtab-bar-drop-hover'
    );

    if (mode === 'tab-convert') {
      el.classList.add('sf-tab-drop-hover');
    } else if (mode === 'tab-promote') {
      el.classList.add('sf-tab-drop-hover', 'sf-promote-hover');
    } else if (mode === 'tab-move-subtab') {
      el.classList.add('sf-tab-drop-hover', 'sf-subtab-target-hover');
    } else if (mode === 'subtab-make-owner') {
      el.classList.add('sf-tab-drop-hover', 'sf-owner-hover');
    } else if (mode === 'subtab-move-owner') {
      el.classList.add('sf-tab-drop-hover', 'sf-move-owner-hover');
    } else if (mode === 'bar-promote') {
      el.classList.add('sf-bar-drop-hover');
    } else if (mode === 'subtab-bar-add') {
      el.classList.add('sf-subtab-bar-drop-hover');
    }
  }

  function clearTabDropHighlights(exceptEl = null) {
    if (!exceptEl) {
      if (currentDropHighlightEl) {
        currentDropHighlightEl.classList.remove(
          'sf-tab-drop-hover',
          'sf-promote-hover',
          'sf-subtab-target-hover',
          'sf-owner-hover',
          'sf-move-owner-hover',
          'sf-bar-drop-hover',
          'sf-subtab-bar-drop-hover'
        );
        currentDropHighlightEl = null;
        currentDropHighlightMode = '';
      }
      return;
    }
    if (currentDropHighlightEl && currentDropHighlightEl !== exceptEl) {
      currentDropHighlightEl.classList.remove(
        'sf-tab-drop-hover',
        'sf-promote-hover',
        'sf-subtab-target-hover',
        'sf-owner-hover',
        'sf-move-owner-hover',
        'sf-bar-drop-hover',
        'sf-subtab-bar-drop-hover'
      );
      currentDropHighlightEl = null;
      currentDropHighlightMode = '';
    }
  }

  let activeFocusRequestSeq = 0;

  async function activateWorkspaceAndSubtab(ws, parentTabId, subtabId = null, { preserveActiveSubtab = false } = {}) {
    const mySeq = ++activeFocusRequestSeq;
    if (!ws) {
      try {
        ws = await getWorkspaceAPI();
      } catch (_) {}
    }

    const ensureFocus = async () => {
      if (mySeq !== activeFocusRequestSeq) return;
      try {
        if (ws && ws.focusTab) {
          const focused = ws.getFocusedTabInfo ? await ws.getFocusedTabInfo().catch(() => null) : null;
          if (mySeq !== activeFocusRequestSeq) return;
          if (subtabId) {
            if (focused && focused.tabId === subtabId) return;
            if (parentTabId && (!focused || (focused.tabId !== parentTabId && focused.parentTabId !== parentTabId))) {
              await ws.focusTab({ tabId: parentTabId }).catch(() => {});
            }
            if (mySeq !== activeFocusRequestSeq) return;
            await ws.focusTab({ tabId: subtabId }).catch(() => {});
          } else if (parentTabId) {
            if (
              focused &&
              (focused.tabId === parentTabId || (preserveActiveSubtab && focused.parentTabId === parentTabId))
            ) {
              return;
            }
            await ws.focusTab({ tabId: parentTabId }).catch(() => {});
          }
          return;
        }
      } catch (_) {}

      if (mySeq !== activeFocusRequestSeq) return;
      // Fallback only if Workspace API is unavailable
      const targetId = subtabId || parentTabId;
      if (targetId) {
        const el = document.querySelector(
          `li.tabItem[data-tabid="${targetId}"] a, a[data-tabid="${targetId}"], li.tabItem[data-tabid="${targetId}"]`
        );
        if (el) el.click();
      }
    };

    await ensureFocus();
    setTimeout(ensureFocus, 100);
    setTimeout(ensureFocus, 280);
  }

  function getTabDisplayTitle(tabId, tabInfo, fallbackLabel = 'Tab') {
    const infoTitle = (tabInfo && (tabInfo.title || tabInfo.customTitle || tabInfo.pageTitle)) || '';
    if (String(infoTitle).trim()) return String(infoTitle).trim();
    if (tabId) {
      try {
        const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
          ? CSS.escape(String(tabId))
          : String(tabId).replace(/"/g, '\\"');
        const link = document.querySelector(`li[data-tabid="${escaped}"] a.tabHeader, a[data-tabid="${escaped}"]`);
        const domTitle = (link && (link.getAttribute('title') || link.textContent)) || '';
        if (domTitle.trim()) return domTitle.trim();
      } catch (_) {}
    }
    return fallbackLabel;
  }

  function promptMergeMultipleTabs({ sourceTitle, targetTitle, sourceTabId, childSubtabs }) {
    return new Promise((resolve) => {
      const existing = document.getElementById('sf-enhancer-merge-modal');
      if (existing) existing.remove();

      const totalCount = 1 + childSubtabs.length;
      const backdrop = document.createElement('div');
      backdrop.id = 'sf-enhancer-merge-modal';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:rgba(15,23,42,0.48)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:16px',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif'
      ].join(';');

      const card = document.createElement('div');
      card.style.cssText = [
        'width:100%',
        'max-width:440px',
        'background:var(--sf-theme-bg,#ffffff)',
        'color:var(--sf-theme-text,#181818)',
        'border:1px solid var(--sf-theme-border,#dddbda)',
        'border-radius:8px',
        'box-shadow:0 12px 32px rgba(0,0,0,0.28)',
        'overflow:hidden'
      ].join(';');

      const header = document.createElement('div');
      header.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'padding:14px 18px',
        'border-bottom:1px solid var(--sf-theme-border,#e5e5e5)'
      ].join(';');

      const heading = document.createElement('h2');
      heading.textContent = 'Merge Multiple Tabs?';
      heading.style.cssText = 'margin:0;font-size:15px;font-weight:700;';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'Cancel');
      closeBtn.style.cssText = [
        'border:none',
        'background:transparent',
        'color:inherit',
        'font-size:15px',
        'line-height:1',
        'cursor:pointer',
        'padding:4px 6px',
        'opacity:0.7'
      ].join(';');

      header.appendChild(heading);
      header.appendChild(closeBtn);

      const body = document.createElement('div');
      body.style.cssText = 'padding:16px 18px;font-size:13px;line-height:1.45;';

      const summary = document.createElement('p');
      summary.style.cssText = 'margin:0 0 10px 0;';
      summary.textContent =
        `Merging "${sourceTitle}" into "${targetTitle}" will move ${totalCount} tabs (1 workspace + ${childSubtabs.length} subtab${childSubtabs.length === 1 ? '' : 's'}) as subtabs.`;
      body.appendChild(summary);

      const listEl = document.createElement('div');
      listEl.style.cssText = [
        'background:var(--sf-theme-surface,#f8fafc)',
        'border:1px solid var(--sf-theme-border,#e2e8f0)',
        'border-radius:6px',
        'padding:8px 10px',
        'font-size:12px',
        'max-height:150px',
        'overflow-y:auto',
        'display:flex',
        'flex-direction:column',
        'gap:4px'
      ].join(';');

      const tabNames = [sourceTitle].concat(
        childSubtabs.map((st, idx) => getTabDisplayTitle(st.tabId, st, `Subtab ${idx + 1}`))
      );
      const maxVisible = 6;
      tabNames.slice(0, maxVisible).forEach((name, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
        item.textContent = `${idx === 0 ? '• Workspace:' : '↳ Subtab:'} ${name}`;
        listEl.appendChild(item);
      });
      if (tabNames.length > maxVisible) {
        const more = document.createElement('div');
        more.style.cssText = 'opacity:0.75;font-style:italic;';
        more.textContent = `+ ${tabNames.length - maxVisible} more tab${tabNames.length - maxVisible === 1 ? '' : 's'}`;
        listEl.appendChild(more);
      }
      body.appendChild(listEl);

      const footer = document.createElement('div');
      footer.style.cssText = [
        'display:flex',
        'justify-content:flex-end',
        'gap:8px',
        'padding:12px 18px',
        'border-top:1px solid var(--sf-theme-border,#e5e5e5)'
      ].join(';');

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = [
        'padding:6px 14px',
        'border-radius:5px',
        'border:1px solid var(--sf-theme-border,#cbd5e1)',
        'background:var(--sf-theme-bg,#ffffff)',
        'color:var(--sf-theme-text,#181818)',
        'font-size:12.5px',
        'font-weight:600',
        'cursor:pointer'
      ].join(';');

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.textContent = `Merge ${totalCount} Tabs`;
      confirmBtn.style.cssText = [
        'padding:6px 14px',
        'border-radius:5px',
        'border:1px solid transparent',
        'background:var(--sf-theme-accent,#0176d3)',
        'color:var(--sf-theme-accent-contrast,#ffffff)',
        'font-size:12.5px',
        'font-weight:600',
        'cursor:pointer'
      ].join(';');

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      backdrop.appendChild(card);

      let settled = false;
      const cleanup = (accepted) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown, true);
        backdrop.remove();
        resolve(accepted);
      };

      const onKeyDown = (ev) => {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          ev.stopPropagation();
          cleanup(false);
        }
      };

      closeBtn.addEventListener('click', () => cleanup(false));
      cancelBtn.addEventListener('click', () => cleanup(false));
      confirmBtn.addEventListener('click', () => cleanup(true));
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) cleanup(false);
      });
      document.addEventListener('keydown', onKeyDown, true);

      (document.body || document.documentElement).appendChild(backdrop);
      confirmBtn.focus();
    });
  }

  function extractCleanTabTarget(tabInfo) {
    if (!tabInfo) return null;
    let cleanUrl = tabInfo.url || '';
    if (cleanUrl) {
      cleanUrl = cleanUrl
        .replace(/[?&]ws=[^&#]*/g, '')
        .replace(/\?&/, '?')
        .replace(/[?&]$/, '');
      try {
        if (typeof location !== 'undefined' && location.origin && cleanUrl.startsWith(location.origin + '/')) {
          cleanUrl = cleanUrl.slice(location.origin.length);
        }
      } catch (_) {}
    }
    let cleanPageRef = null;
    if (tabInfo.pageReference) {
      try {
        cleanPageRef = JSON.parse(JSON.stringify(tabInfo.pageReference));
        if (cleanPageRef && cleanPageRef.state) {
          delete cleanPageRef.state.ws;
        }
      } catch (_) {}
    }
    return {
      tabId: tabInfo.tabId || null,
      recordId: tabInfo.recordId || null,
      url: cleanUrl || null,
      pageReference: cleanPageRef,
      title: getTabDisplayTitle(tabInfo.tabId, tabInfo, 'Tab')
    };
  }

  function isLiveSessionTab(tabInfo) {
    if (!tabInfo) return false;
    const url = String(tabInfo.url || '');
    const title = String(tabInfo.title || tabInfo.customTitle || tabInfo.pageTitle || '');
    const recordId = String(tabInfo.recordId || '');
    const objApi = String((tabInfo.pageReference && tabInfo.pageReference.attributes && tabInfo.pageReference.attributes.objectApiName) || '');
    if (/MessagingSession|LiveChatTranscript|VoiceCall/i.test(url) || /MessagingSession|LiveChatTranscript|VoiceCall/i.test(objApi)) {
      return true;
    }
    if (/Messaging Session|Chat Transcript|Voice Call/i.test(title)) {
      return true;
    }
    if (/^(0Mw|570|0LQ)[a-zA-Z0-9]{12,15}$/.test(recordId)) {
      return true;
    }
    return false;
  }

  function promptMakeWorkspaceOwner({
    newOwnerTitle,
    oldOwnerTitle,
    orderedSubtabs = [],
    liveSessionTabs = [],
    isPinned = false,
    triggeredByMovingOwnerOut = false
  }) {
    return new Promise((resolve) => {
      const existing = document.getElementById('sf-enhancer-owner-modal');
      if (existing) existing.remove();

      const totalTabs = 1 + orderedSubtabs.length;
      const backdrop = document.createElement('div');
      backdrop.id = 'sf-enhancer-owner-modal';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:2147483647',
        'background:rgba(15,23,42,0.48)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'padding:16px',
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif'
      ].join(';');

      const card = document.createElement('div');
      card.style.cssText = [
        'width:100%',
        'max-width:460px',
        'background:var(--sf-theme-bg,#ffffff)',
        'color:var(--sf-theme-text,#181818)',
        'border:1px solid var(--sf-theme-border,#dddbda)',
        'border-radius:8px',
        'box-shadow:0 12px 32px rgba(0,0,0,0.28)',
        'overflow:hidden'
      ].join(';');

      const header = document.createElement('div');
      header.style.cssText = [
        'display:flex',
        'align-items:center',
        'justify-content:space-between',
        'padding:14px 18px',
        'border-bottom:1px solid var(--sf-theme-border,#e5e5e5)'
      ].join(';');

      const heading = document.createElement('h2');
      heading.textContent = triggeredByMovingOwnerOut
        ? 'Change Workspace Owner?'
        : 'Make Subtab Workspace Owner?';
      heading.style.cssText = 'margin:0;font-size:15px;font-weight:700;';

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'Cancel');
      closeBtn.style.cssText = [
        'border:none',
        'background:transparent',
        'color:inherit',
        'font-size:15px',
        'line-height:1',
        'cursor:pointer',
        'padding:4px 6px',
        'opacity:0.7'
      ].join(';');

      header.appendChild(heading);
      header.appendChild(closeBtn);

      const body = document.createElement('div');
      body.style.cssText = 'padding:16px 18px;font-size:13px;line-height:1.45;';

      const summary = document.createElement('p');
      summary.style.cssText = 'margin:0 0 10px 0;';
      if (triggeredByMovingOwnerOut) {
        summary.textContent =
          `Moving "${oldOwnerTitle}" out of the first position will make "${newOwnerTitle}" the workspace owner. All ${totalTabs} tabs in this workspace will reload.`;
      } else {
        const extraCount = Math.max(0, orderedSubtabs.length - 1);
        summary.textContent =
          `Promote "${newOwnerTitle}" to own this workspace and move "${oldOwnerTitle}"${extraCount > 0 ? ` and ${extraCount} other subtab${extraCount === 1 ? '' : 's'}` : ''} beneath it? All ${totalTabs} tabs in this workspace will reload.`;
      }
      body.appendChild(summary);

      if (Array.isArray(liveSessionTabs) && liveSessionTabs.length > 0) {
        const sessionNames = liveSessionTabs
          .slice(0, 2)
          .map((t) => getTabDisplayTitle(t.tabId, t, 'Live Session'))
          .join(', ');
        const warnBox = document.createElement('div');
        warnBox.style.cssText = [
          'margin:0 0 10px 0',
          'padding:8px 10px',
          'border-radius:6px',
          'background:rgba(245,158,11,0.14)',
          'border:1px solid rgba(217,119,6,0.45)',
          'font-size:12px',
          'line-height:1.4'
        ].join(';');
        warnBox.textContent =
          `⚠ Live session tab detected (${sessionNames}). Reloading this workspace may interrupt active Messaging/Chat/Voice sessions.`;
        body.appendChild(warnBox);
      }

      if (isPinned) {
        const pinNote = document.createElement('p');
        pinNote.style.cssText = 'margin:0 0 10px 0;font-size:12px;opacity:0.8;';
        pinNote.textContent = 'Note: This workspace is currently pinned. The rebuilt workspace tab will open unpinned.';
        body.appendChild(pinNote);
      }

      const listEl = document.createElement('div');
      listEl.style.cssText = [
        'background:var(--sf-theme-surface,#f8fafc)',
        'border:1px solid var(--sf-theme-border,#e2e8f0)',
        'border-radius:6px',
        'padding:8px 10px',
        'font-size:12px',
        'max-height:150px',
        'overflow-y:auto',
        'display:flex',
        'flex-direction:column',
        'gap:4px'
      ].join(';');

      const tabNames = [newOwnerTitle].concat(
        orderedSubtabs.map((st, idx) => getTabDisplayTitle(st.tabId, st, `Subtab ${idx + 1}`))
      );
      const maxVisible = 6;
      tabNames.slice(0, maxVisible).forEach((name, idx) => {
        const item = document.createElement('div');
        item.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' + (idx === 0 ? 'font-weight:600;' : '');
        item.textContent = `${idx === 0 ? '★ New Owner:' : '↳ Subtab:'} ${name}`;
        listEl.appendChild(item);
      });
      if (tabNames.length > maxVisible) {
        const more = document.createElement('div');
        more.style.cssText = 'opacity:0.75;font-style:italic;';
        more.textContent = `+ ${tabNames.length - maxVisible} more subtab${tabNames.length - maxVisible === 1 ? '' : 's'}`;
        listEl.appendChild(more);
      }
      body.appendChild(listEl);

      const footer = document.createElement('div');
      footer.style.cssText = [
        'display:flex',
        'justify-content:flex-end',
        'gap:8px',
        'padding:12px 18px',
        'border-top:1px solid var(--sf-theme-border,#e5e5e5)'
      ].join(';');

      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = [
        'padding:6px 14px',
        'border-radius:5px',
        'border:1px solid var(--sf-theme-border,#cbd5e1)',
        'background:var(--sf-theme-bg,#ffffff)',
        'color:var(--sf-theme-text,#181818)',
        'font-size:12.5px',
        'font-weight:600',
        'cursor:pointer'
      ].join(';');

      const confirmBtn = document.createElement('button');
      confirmBtn.type = 'button';
      confirmBtn.textContent = triggeredByMovingOwnerOut ? 'Change Workspace Owner' : 'Make Workspace Owner';
      confirmBtn.style.cssText = [
        'padding:6px 14px',
        'border-radius:5px',
        'border:1px solid transparent',
        'background:var(--sf-theme-accent,#0176d3)',
        'color:var(--sf-theme-accent-contrast,#ffffff)',
        'font-size:12.5px',
        'font-weight:600',
        'cursor:pointer'
      ].join(';');

      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      card.appendChild(header);
      card.appendChild(body);
      card.appendChild(footer);
      backdrop.appendChild(card);

      let settled = false;
      const cleanup = (accepted) => {
        if (settled) return;
        settled = true;
        document.removeEventListener('keydown', onKeyDown, true);
        backdrop.remove();
        resolve(accepted);
      };

      const onKeyDown = (ev) => {
        if (ev.key === 'Escape') {
          ev.preventDefault();
          ev.stopPropagation();
          cleanup(false);
        }
      };

      closeBtn.addEventListener('click', () => cleanup(false));
      cancelBtn.addEventListener('click', () => cleanup(false));
      confirmBtn.addEventListener('click', () => cleanup(true));
      backdrop.addEventListener('click', (ev) => {
        if (ev.target === backdrop) cleanup(false);
      });
      document.addEventListener('keydown', onKeyDown, true);

      (document.body || document.documentElement).appendChild(backdrop);
      confirmBtn.focus();
    });
  }

  /**
   * Rebuild a workspace so that a subtab becomes the primary workspace owner tab,
   * moving the previous workspace owner and remaining subtabs beneath it in the requested order.
   */
  async function makeSubtabWorkspaceOwner(
    wsArg,
    sourceSubtabId,
    parentTabIdArg = null,
    { insertOldOwnerAfterTabId = null, focusOldOwner = false, triggeredByMovingOwnerOut = false } = {}
  ) {
    if (!sourceSubtabId) return;
    let ws = wsArg;
    let parentTabId = parentTabIdArg;
    let parentInfo = null;
    let sourceSubtabInfo = null;
    let otherSubtabs = [];

    try {
      if (!ws) ws = await getWorkspaceAPI();
      const subInfo = await ws.getTabInfo({ tabId: sourceSubtabId }).catch(() => null);
      if (!parentTabId && subInfo && subInfo.parentTabId) {
        parentTabId = subInfo.parentTabId;
      }
      if (!parentTabId || sourceSubtabId === parentTabId) return;

      parentInfo = await ws.getTabInfo({ tabId: parentTabId }).catch(() => null);
      if (!parentInfo) {
        showToast('Workspace information unavailable');
        return;
      }

      const rawSubtabs = Array.isArray(parentInfo.subtabs) ? parentInfo.subtabs : [];
      const orderedSubtabs = getStableTabOrder(rawSubtabs, true, `subtabs:${parentTabId}`);
      sourceSubtabInfo = orderedSubtabs.find((st) => st && st.tabId === sourceSubtabId) || subInfo;
      if (!sourceSubtabInfo) {
        showToast('Subtab information unavailable');
        return;
      }

      otherSubtabs = orderedSubtabs.filter(
        (st) => st && st.tabId && st.tabId !== sourceSubtabId && st.tabId !== parentTabId
      );

      let subtabsToRestore;
      if (insertOldOwnerAfterTabId && insertOldOwnerAfterTabId !== sourceSubtabId) {
        const insertIdx = otherSubtabs.findIndex((st) => st && st.tabId === insertOldOwnerAfterTabId);
        subtabsToRestore = otherSubtabs.slice();
        if (insertIdx >= 0) {
          subtabsToRestore.splice(insertIdx + 1, 0, parentInfo);
        } else {
          subtabsToRestore.push(parentInfo);
        }
      } else {
        subtabsToRestore = [parentInfo, ...otherSubtabs];
      }

      const newOwnerTitle = getTabDisplayTitle(sourceSubtabId, sourceSubtabInfo, 'Subtab');
      const oldOwnerTitle = getTabDisplayTitle(parentTabId, parentInfo, 'Workspace');
      const liveSessionTabs = [parentInfo, ...orderedSubtabs].filter(isLiveSessionTab);

      const confirmed = await promptMakeWorkspaceOwner({
        newOwnerTitle,
        oldOwnerTitle,
        orderedSubtabs: subtabsToRestore,
        liveSessionTabs,
        isPinned: !!parentInfo.pinned,
        triggeredByMovingOwnerOut
      });
      if (!confirmed) {
        showToast('Workspace owner change cancelled');
        return;
      }

      const newOwnerTarget = extractCleanTabTarget(sourceSubtabInfo);
      const oldOwnerTarget = extractCleanTabTarget(parentInfo);
      const preservedCustomTitle =
        parentInfo && typeof parentInfo.customTitle === 'string' && parentInfo.customTitle.trim()
          ? parentInfo.customTitle
          : null;
      const preservedCustomIcon =
        parentInfo && typeof parentInfo.customIcon === 'string' && parentInfo.customIcon.trim()
          ? parentInfo.customIcon
          : null;
      const preservedCustomIconAlt =
        parentInfo && typeof parentInfo.customIconAlt === 'string' && parentInfo.customIconAlt.trim()
          ? parentInfo.customIconAlt
          : parentInfo && typeof parentInfo.iconAlt === 'string' && parentInfo.iconAlt.trim()
            ? parentInfo.iconAlt
            : '';
      const applyPreservedCustomTabMeta = async (targetTabId) => {
        if (!targetTabId || (!preservedCustomTitle && !preservedCustomIcon)) return;
        const applyOnce = async () => {
          try {
            if (preservedCustomTitle && typeof ws.setTabLabel === 'function') {
              await ws.setTabLabel({ tabId: targetTabId, label: preservedCustomTitle }).catch(() => {});
            }
            if (preservedCustomIcon && typeof ws.setTabIcon === 'function') {
              const iconParams = { tabId: targetTabId, icon: preservedCustomIcon };
              if (preservedCustomIconAlt) iconParams.iconAlt = preservedCustomIconAlt;
              await ws.setTabIcon(iconParams).catch(() => {});
            }
          } catch (_) {}
        };
        await applyOnce();
        setTimeout(applyOnce, 350);
      };
      const restoreTargets = subtabsToRestore
        .map((st) => ({
          target: extractCleanTabTarget(st),
          isOldOwner: !!(st && st.tabId === parentTabId)
        }))
        .filter((entry) => entry.target && (entry.target.url || entry.target.pageReference || entry.target.recordId));

      if (!newOwnerTarget || (!newOwnerTarget.url && !newOwnerTarget.pageReference && !newOwnerTarget.recordId)) {
        showToast('Could not promote subtab (missing tab target)');
        return;
      }

      showToast('Updating workspace owner...');
      isInternalWorkspaceCall = true;
      try {
        // 1. Close the existing workspace (closes owner + all subtabs, clearing deduplication registry)
        await ws.closeTab({ tabId: parentTabId }).catch(() => false);
        let stillOpen = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          await new Promise((r) => setTimeout(r, 60));
          stillOpen = await ws.getTabInfo({ tabId: parentTabId }).catch(() => null);
          if (!stillOpen || stillOpen.tabId !== parentTabId) break;
        }
        if (stillOpen && stillOpen.tabId === parentTabId) {
          showToast('Could not change workspace owner (workspace stayed open)');
          return;
        }

        logicalTabOrderCache.delete(`subtabs:${parentTabId}`);

        const openPrimaryTarget = async (target) => {
          if (!target) return null;
          if (target.recordId) {
            try {
              const id = await ws.openTab({ recordId: target.recordId, focus: true, overrideNavRules: true });
              if (id) return id;
            } catch (_) {}
          }
          if (target.url) {
            try {
              const id = await ws.openTab({ url: target.url, focus: true, overrideNavRules: true });
              if (id) return id;
            } catch (_) {}
          }
          if (target.pageReference) {
            try {
              const id = await ws.openTab({ pageReference: target.pageReference, focus: true, overrideNavRules: true });
              if (id) return id;
            } catch (_) {}
          }
          return null;
        };

        const openSubtabTarget = async (pId, target) => {
          if (!pId || !target) return null;
          if (target.recordId) {
            try {
              const id = await ws.openSubtab({ parentTabId: pId, recordId: target.recordId, focus: false });
              if (id) return id;
            } catch (_) {}
          }
          if (target.pageReference) {
            try {
              const id = await ws.openSubtab({ parentTabId: pId, pageReference: target.pageReference, focus: false });
              if (id) return id;
            } catch (_) {}
          }
          if (target.url) {
            try {
              const id = await ws.openSubtab({ parentTabId: pId, url: target.url, focus: false });
              if (id) return id;
            } catch (_) {}
          }
          return null;
        };

        // 2. Open promoted subtab as the new primary workspace tab (overriding Console Navigation Rules)
        const newPrimaryId = await openPrimaryTarget(newOwnerTarget);
        await new Promise((r) => setTimeout(r, 100));

        if (!newPrimaryId) {
          // Safety net: attempt to restore the previous workspace so tabs are not lost
          const restoredOldId = oldOwnerTarget ? await openPrimaryTarget(oldOwnerTarget) : null;
          if (restoredOldId) {
            await openSubtabTarget(restoredOldId, newOwnerTarget);
            for (const entry of restoreTargets) {
              if (!entry.isOldOwner) {
                await openSubtabTarget(restoredOldId, entry.target);
              }
            }
            await applyPreservedCustomTabMeta(restoredOldId);
            await activateWorkspaceAndSubtab(ws, restoredOldId, null);
          }
          showToast('Could not make subtab workspace owner');
          return;
        }

        const newPrimaryInfo = await ws.getTabInfo({ tabId: newPrimaryId }).catch(() => null);
        const effectiveOwnerTabId =
          newPrimaryInfo && newPrimaryInfo.isSubtab && newPrimaryInfo.parentTabId
            ? newPrimaryInfo.parentTabId
            : newPrimaryId;
        const effectiveOwnerInfo =
          effectiveOwnerTabId === newPrimaryId
            ? newPrimaryInfo
            : await ws.getTabInfo({ tabId: effectiveOwnerTabId }).catch(() => newPrimaryInfo);

        const existingRecordIds = new Set();
        const existingUrls = new Set();
        if (effectiveOwnerInfo) {
          if (effectiveOwnerInfo.recordId) existingRecordIds.add(effectiveOwnerInfo.recordId);
          const ownerClean = extractCleanTabTarget(effectiveOwnerInfo);
          if (ownerClean && ownerClean.url) existingUrls.add(ownerClean.url);
          if (Array.isArray(effectiveOwnerInfo.subtabs)) {
            for (const st of effectiveOwnerInfo.subtabs) {
              if (st && st.recordId) existingRecordIds.add(st.recordId);
              const stClean = extractCleanTabTarget(st);
              if (stClean && stClean.url) existingUrls.add(stClean.url);
            }
          }
        }

        const revertedByNavRules = !!(
          parentInfo.recordId &&
          effectiveOwnerInfo &&
          effectiveOwnerInfo.recordId === parentInfo.recordId &&
          newOwnerTarget.recordId !== parentInfo.recordId
        );

        // 3. Reopen old owner and remaining subtabs in the requested order
        let oldOwnerNewSubtabId = null;
        for (const entry of restoreTargets) {
          const target = entry.target;
          if (target.recordId && existingRecordIds.has(target.recordId)) continue;
          if (!target.recordId && target.url && existingUrls.has(target.url)) continue;
          const createdId = await openSubtabTarget(effectiveOwnerTabId, target);
          if (entry.isOldOwner && createdId) {
            oldOwnerNewSubtabId = createdId;
          }
        }

        // 4. Preserve any customized workspace tab label & icon on the rebuilt workspace
        await applyPreservedCustomTabMeta(effectiveOwnerTabId);

        // 5. Focus the moved tab (old owner in its new slot when dragged out, or new owner when promoted in)
        let focusSubtabId = null;
        if (revertedByNavRules && newPrimaryId !== effectiveOwnerTabId) {
          focusSubtabId = newPrimaryId;
        } else if (focusOldOwner && oldOwnerNewSubtabId) {
          focusSubtabId = oldOwnerNewSubtabId;
        }
        await activateWorkspaceAndSubtab(ws, effectiveOwnerTabId, focusSubtabId);

        if (revertedByNavRules) {
          showToast(`Salesforce Navigation Rules kept "${oldOwnerTitle}" as workspace owner`);
        } else {
          showToast(`★ "${newOwnerTitle}" is now the workspace owner`);
        }
      } finally {
        isInternalWorkspaceCall = false;
      }
    } catch (err) {
      console.error('[Salesforce Enhancer] Failed to make subtab workspace owner:', err);
      showToast('Could not make subtab workspace owner');
    }
  }

  /**
   * Move the current workspace owner (position 0 in the subtab bar) out of the first position,
   * making the 2nd tab (first subtab) the new workspace owner.
   */
  async function moveWorkspaceOwnerOutOfFirstPosition(wsArg, parentTabId, insertAfterTabId = '__END__') {
    if (!parentTabId) return;
    try {
      const ws = wsArg || (await getWorkspaceAPI());
      const parentInfo = await ws.getTabInfo({ tabId: parentTabId }).catch(() => null);
      if (!parentInfo) {
        showToast('Workspace information unavailable');
        return;
      }
      const rawSubtabs = Array.isArray(parentInfo.subtabs) ? parentInfo.subtabs : [];
      const orderedSubtabs = getStableTabOrder(rawSubtabs, true, `subtabs:${parentTabId}`);
      const nextOwnerSubtab = orderedSubtabs.find((st) => st && st.tabId && st.tabId !== parentTabId);
      if (!nextOwnerSubtab || !nextOwnerSubtab.tabId) {
        showToast('No subtab available to become workspace owner');
        return;
      }
      await makeSubtabWorkspaceOwner(ws, nextOwnerSubtab.tabId, parentTabId, {
        insertOldOwnerAfterTabId: insertAfterTabId || nextOwnerSubtab.tabId,
        focusOldOwner: true,
        triggeredByMovingOwnerOut: true
      });
    } catch (err) {
      console.error('[Salesforce Enhancer] Failed to move workspace owner out of first position:', err);
      showToast('Could not change workspace owner');
    }
  }

  /**
   * Move a Primary Workspace Tab into another Primary Tab as a Subtab
   */
  async function movePrimaryTabToSubtab(sourceTabId, targetTabId) {
    if (!sourceTabId || !targetTabId || sourceTabId === targetTabId) return;
    let ws;
    let sourceInfo;
    let targetInfo;
    let effectiveParentTabId;
    let targetParentInfo;
    let childSubtabs = [];

    try {
      ws = await getWorkspaceAPI();
      [sourceInfo, targetInfo] = await Promise.all([
        ws.getTabInfo({ tabId: sourceTabId }).catch(() => null),
        ws.getTabInfo({ tabId: targetTabId }).catch(() => null)
      ]);

      if (!sourceInfo || !targetInfo) {
        showToast('Tab information unavailable');
        return;
      }

      // If target is itself a subtab, nest under its parent workspace tab
      effectiveParentTabId = targetInfo.isSubtab ? targetInfo.parentTabId : targetTabId;
      if (!effectiveParentTabId || effectiveParentTabId === sourceTabId) {
        showToast('Cannot move tab into itself');
        return;
      }

      targetParentInfo =
        effectiveParentTabId === targetTabId
          ? targetInfo
          : await ws.getTabInfo({ tabId: effectiveParentTabId }).catch(() => targetInfo);

      childSubtabs = Array.isArray(sourceInfo.subtabs)
        ? sourceInfo.subtabs.filter((st) => st && st.tabId !== sourceTabId && (st.recordId || st.url || st.pageReference))
        : [];

      if (childSubtabs.length > 0) {
        const sourceTitle = getTabDisplayTitle(sourceTabId, sourceInfo, 'Workspace');
        const targetTitle = getTabDisplayTitle(effectiveParentTabId, targetParentInfo, 'Target Workspace');
        const confirmed = await promptMergeMultipleTabs({
          sourceTitle,
          targetTitle,
          sourceTabId,
          childSubtabs
        });
        if (!confirmed) {
          showToast('Tab merge cancelled');
          return;
        }
      }
    } catch (preErr) {
      console.error('[Salesforce Enhancer] Failed preparing tab merge:', preErr);
      showToast('Could not convert to subtab');
      return;
    }

    showToast('Moving workspace into subtab...');
    isInternalWorkspaceCall = true;
    try {

      // Clean URL and pageReference so Salesforce doesn't force stale workspace routing
      let cleanUrl = sourceInfo.url || '';
      if (cleanUrl) {
        cleanUrl = cleanUrl
          .replace(/[?&]ws=[^&#]*/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
      }

      let cleanPageRef = null;
      if (sourceInfo.pageReference) {
        try {
          cleanPageRef = JSON.parse(JSON.stringify(sourceInfo.pageReference));
          if (cleanPageRef.state) {
            delete cleanPageRef.state.ws;
          }
        } catch (_) {}
      }

      // 1. CRITICAL: Focus target parent workspace tab FIRST before closing sourceTabId!
      // When sourceTabId is the currently active primary tab, switching focus to effectiveParentTabId
      // first makes sourceTabId a background tab, preventing Salesforce Console's native
      // "active tab closed -> jump to previous tab -> jump to first workspace tab" behavior!
      if (ws.focusTab) {
        await ws.focusTab({ tabId: effectiveParentTabId }).catch(() => {});
        await new Promise((r) => setTimeout(r, 45));
      }

      // 2. Close sourceTabId BEFORE calling openSubtab so Salesforce's tab deduplication
      // never refocuses sourceTabId or blocks opening the record as a subtab.
      await ws.closeTab({ tabId: sourceTabId }).catch(() => {});
      await new Promise((r) => setTimeout(r, 40));

      // 3. Open source tab as subtab of effectiveParentTabId
      const tryOpen = async () => {
        if (sourceInfo.recordId) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, recordId: sourceInfo.recordId, focus: true });
            if (res && res !== sourceTabId) return res;
          } catch (_) {}
        }
        if (cleanPageRef) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, pageReference: cleanPageRef, focus: true });
            if (res && res !== sourceTabId) return res;
          } catch (_) {}
        }
        if (cleanUrl) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, url: cleanUrl, focus: true });
            if (res && res !== sourceTabId) return res;
          } catch (_) {}
        }
        return null;
      };

      let newSubtabId = await tryOpen();

      // If source tab had subtabs of its own, transfer them too!
      if (childSubtabs.length > 0) {
        for (const st of childSubtabs) {
          let stUrl = st.url || '';
          if (stUrl) stUrl = stUrl.replace(/[?&]ws=[^&#]*/g, '').replace(/\?&/, '?').replace(/[?&]$/, '');
          await ws.openSubtab({
            parentTabId: effectiveParentTabId,
            recordId: st.recordId,
            pageReference: st.pageReference,
            url: stUrl || undefined,
            focus: false
          }).catch(() => {});
        }
      }

      // Find newSubtabId if not directly returned
      if (!newSubtabId) {
        try {
          const freshTargetInfo = await ws.getTabInfo({ tabId: effectiveParentTabId });
          if (freshTargetInfo && Array.isArray(freshTargetInfo.subtabs) && freshTargetInfo.subtabs.length > 0) {
            const matching = freshTargetInfo.subtabs.find(
              (st) => (sourceInfo.recordId && st.recordId === sourceInfo.recordId) ||
                      (cleanUrl && st.url && st.url.includes(cleanUrl))
            );
            newSubtabId = matching ? matching.tabId : freshTargetInfo.subtabs[freshTargetInfo.subtabs.length - 1].tabId;
          }
        } catch (_) {}
      }

      // Focus target parent workspace tab and newly opened subtab
      await activateWorkspaceAndSubtab(ws, effectiveParentTabId, newSubtabId);

      showToast('↳ Moved tab into workspace as subtab');
    } catch (err) {
      console.error('[Salesforce Enhancer] Failed to move tab to subtab:', err);
      showToast('Could not convert to subtab');
    } finally {
      isInternalWorkspaceCall = false;
    }
  }

  /**
   * Promote a Subtab to become a Primary Workspace Tab
   */
  async function promoteSubtabToPrimary(sourceSubtabId) {
    if (!sourceSubtabId) return;
    showToast('Promoting subtab to workspace...');
    isInternalWorkspaceCall = true;
    try {
      const ws = await getWorkspaceAPI();
      const subInfo = await ws.getTabInfo({ tabId: sourceSubtabId }).catch(() => null);
      if (!subInfo) {
        showToast('Subtab information unavailable');
        return;
      }

      // Clean the URL and pageReference so Salesforce doesn't force it back into parent workspace
      let cleanUrl = subInfo.url || '';
      if (cleanUrl) {
        cleanUrl = cleanUrl
          .replace(/[?&]ws=[^&#]*/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
      }

      let cleanPageRef = null;
      if (subInfo.pageReference) {
        try {
          cleanPageRef = JSON.parse(JSON.stringify(subInfo.pageReference));
          if (cleanPageRef.state) {
            delete cleanPageRef.state.ws;
          }
        } catch (_) {}
      }

      // Close the subtab first so the record is freed from Salesforce's tab deduplication registry
      await ws.closeTab({ tabId: sourceSubtabId }).catch(() => {});
      await new Promise((r) => setTimeout(r, 40));

      let newTabId = null;
      try {
        if (subInfo.recordId) {
          newTabId = await ws.openTab({ recordId: subInfo.recordId, focus: true, overrideNavRules: true });
        } else if (cleanUrl) {
          newTabId = await ws.openTab({ url: cleanUrl, focus: true, overrideNavRules: true });
        } else if (cleanPageRef) {
          newTabId = await ws.openTab({ pageReference: cleanPageRef, focus: true, overrideNavRules: true });
        }
      } catch (openErr) {
        console.warn('[Salesforce Enhancer] openTab error:', openErr);
      }

      // Fallback: If Workspace API openTab failed (e.g. strict Console navigation rules),
      // navigate natively using Aura force:navigateToURL or force:navigateToSObject
      if (!newTabId && window.$A && typeof window.$A.get === 'function') {
        if (cleanUrl) {
          const urlEvt = window.$A.get('e.force:navigateToURL');
          if (urlEvt) {
            urlEvt.setParams({ url: cleanUrl });
            urlEvt.fire();
            showToast('↳ Promoted subtab to workspace tab');
            return;
          }
        }
        if (subInfo.recordId) {
          const navEvt = window.$A.get('e.force:navigateToSObject');
          if (navEvt) {
            navEvt.setParams({ recordId: subInfo.recordId, slideDevName: 'detail' });
            navEvt.fire();
            showToast('↳ Promoted subtab to workspace tab');
            return;
          }
        }
      }

      if (newTabId) {
        await activateWorkspaceAndSubtab(ws, newTabId, null);
        showToast('↳ Promoted subtab to workspace tab');
      } else {
        showToast('Could not promote subtab');
      }
    } catch (err) {
      console.error('[Salesforce Enhancer] Failed to promote subtab:', err);
      showToast('Could not promote subtab');
    } finally {
      isInternalWorkspaceCall = false;
    }
  }

  /**
   * Move a Subtab from its current workspace into a different Primary Workspace Tab
   */
  async function moveSubtabToWorkspace(sourceSubtabId, targetParentTabId) {
    if (!sourceSubtabId || !targetParentTabId) return;
    showToast('Moving subtab to workspace...');
    isInternalWorkspaceCall = true;
    try {
      const ws = await getWorkspaceAPI();
      const [subInfo, targetInfo] = await Promise.all([
        ws.getTabInfo({ tabId: sourceSubtabId }).catch(() => null),
        ws.getTabInfo({ tabId: targetParentTabId }).catch(() => null)
      ]);

      if (!subInfo || !targetInfo) {
        showToast('Tab information unavailable');
        return;
      }

      const effectiveParentTabId = targetInfo.isSubtab ? targetInfo.parentTabId : targetParentTabId;

      if (subInfo.parentTabId === effectiveParentTabId) {
        showToast('Subtab is already in this workspace');
        return;
      }

      let cleanUrl = subInfo.url || '';
      if (cleanUrl) {
        cleanUrl = cleanUrl
          .replace(/[?&]ws=[^&#]*/g, '')
          .replace(/\?&/, '?')
          .replace(/[?&]$/, '');
      }

      let cleanPageRef = null;
      if (subInfo.pageReference) {
        try {
          cleanPageRef = JSON.parse(JSON.stringify(subInfo.pageReference));
          if (cleanPageRef.state) {
            delete cleanPageRef.state.ws;
          }
        } catch (_) {}
      }

      // Focus target parent workspace first before closing source subtab
      if (ws.focusTab) {
        await ws.focusTab({ tabId: effectiveParentTabId }).catch(() => {});
        await new Promise((r) => setTimeout(r, 40));
      }

      // Close old subtab first to clear it from console deduplication registry
      await ws.closeTab({ tabId: sourceSubtabId }).catch(() => {});
      await new Promise((r) => setTimeout(r, 40));

      const tryOpen = async () => {
        if (subInfo.recordId) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, recordId: subInfo.recordId, focus: true });
            if (res && res !== sourceSubtabId) return res;
          } catch (_) {}
        }
        if (cleanPageRef) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, pageReference: cleanPageRef, focus: true });
            if (res && res !== sourceSubtabId) return res;
          } catch (_) {}
        }
        if (cleanUrl) {
          try {
            const res = await ws.openSubtab({ parentTabId: effectiveParentTabId, url: cleanUrl, focus: true });
            if (res && res !== sourceSubtabId) return res;
          } catch (_) {}
        }
        return null;
      };

      let newSubtabId = await tryOpen();

      if (!newSubtabId) {
        try {
          const freshTargetInfo = await ws.getTabInfo({ tabId: effectiveParentTabId });
          if (freshTargetInfo && Array.isArray(freshTargetInfo.subtabs) && freshTargetInfo.subtabs.length > 0) {
            const matching = freshTargetInfo.subtabs.find(
              (st) => (subInfo.recordId && st.recordId === subInfo.recordId) ||
                      (cleanUrl && st.url && st.url.includes(cleanUrl))
            );
            newSubtabId = matching ? matching.tabId : freshTargetInfo.subtabs[freshTargetInfo.subtabs.length - 1].tabId;
          }
        } catch (_) {}
      }

      await activateWorkspaceAndSubtab(ws, effectiveParentTabId, newSubtabId);

      showToast('↳ Moved subtab to workspace');
    } catch (err) {
      console.error('[Salesforce Enhancer] Failed to move subtab:', err);
      showToast('Could not move subtab');
    } finally {
      isInternalWorkspaceCall = false;
    }
  }

  function initTabDragAndDrop() {
    if (!isTopWindow) return;
    ensureTabDragStyles();

    // Arm tab elements on pointerdown/mousedown (no global mouseover thrashing)
    const ensureDraggableTab = (e) => {
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (!isConsoleAppActive()) return;

      const el = getElementFromTarget(e.target);
      if (!el || !el.closest) return;

      const li = getTabListItem(el);
      if (!li) return;

      // Never make close buttons or action controls draggable
      if (el.closest('button, .close, .slds-button, input, textarea')) {
        if (li.getAttribute('draggable') === 'true') {
          li.setAttribute('draggable', 'false');
        }
        return;
      }

      if (li.getAttribute('draggable') !== 'true') {
        li.setAttribute('draggable', 'true');
        li.draggable = true;
        li.classList.add('sf-tab-draggable');
      }

      // Ensure child link or icon doesn't preempt tab drag with native link/image drag
      const tabLinks = li.querySelectorAll('a, img');
      for (let i = 0; i < tabLinks.length; i++) {
        if (tabLinks[i].getAttribute('draggable') !== 'false') {
          tabLinks[i].setAttribute('draggable', 'false');
        }
      }
    };

    document.addEventListener('pointerdown', ensureDraggableTab, true);
    document.addEventListener('mousedown', ensureDraggableTab, true);

    // Drag start
    document.addEventListener(
      'dragstart',
      (e) => {
        if (isSyntheticTabReorder) return;
        const _modSettings = getEnhancerSettings();
        if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
        if (!isConsoleAppActive()) return;

        const el = getElementFromTarget(e.target);
        if (!el || !el.closest) return;

        const li = getTabListItem(el);
        if (!li) return;

        // Disallow drag if initiated from close button or dropdown actions
        if (el.closest('button, .close, .slds-button, input, textarea')) {
          e.preventDefault();
          return;
        }

        const tabId = getTabIdFromElement(li);
        if (!tabId) return;

        const isSubtab = isSubtabElement(li);
        const activeWsEl = document.querySelector(
          '.navexConsoleTabContainer[aria-label="Workspaces"] li.tabItem.slds-is-active, .navexConsoleTabContainer[aria-label="Workspaces"] li.tabItem.active, .navexConsoleTabContainer:not([aria-label="Active Workspace Subtabs"]) li.tabItem.slds-is-active, li.tabItem.slds-is-active:not(.slds-sub-tabs__item)'
        );
        const parentTabId = (activeWsEl ? getTabIdFromElement(activeWsEl) : null) || preClickParentTabId || null;
        const a = li.querySelector('a.tabHeader, a[data-tabid]');
        const title = (a ? a.getAttribute('title') : null) || li.innerText?.trim() || 'Tab';

        activeTabDragState = {
          isEnhancerTabDrag: true,
          tabId,
          isSubtab,
          parentTabId: isSubtab ? parentTabId : null,
          title,
          sourceElement: li
        };

        try {
          e.dataTransfer.setData('application/x-sf-enhancer-tab', JSON.stringify({
            tabId,
            isSubtab,
            parentTabId: isSubtab ? parentTabId : null,
            title
          }));
          e.dataTransfer.effectAllowed = 'move';
        } catch (_) {}

        li.classList.add('sf-tab-dragging');
        document.documentElement.classList.add('sf-tab-drag-active');
      },
      true
    );

    // Drag end
    document.addEventListener(
      'dragend',
      () => {
        if (activeTabDragState && activeTabDragState.sourceElement) {
          activeTabDragState.sourceElement.classList.remove('sf-tab-dragging');
        }
        clearTabDropHighlights();
        document.documentElement.classList.remove('sf-tab-drag-active');
        activeTabDragState = null;
      },
      true
    );

    // Handle drag over & drag enter
    const handleDragOverOrEnter = (e) => {
      if (!activeTabDragState || !activeTabDragState.isEnhancerTabDrag) return;

      const targetSubtabBar = getSubtabBarContainer(e.target);
      const targetTabLi = getPrimaryWorkspaceTabLi(e.target);

      // =====================================================================
      // CASE 1: Dragging a SUBTAB
      // =====================================================================
      if (activeTabDragState.isSubtab) {
        // Dragging subtab within its own workspace's subtab bar:
        // - Subtab over the workspace owner (first tab) -> MAKE WORKSPACE OWNER!
        // - Workspace owner (first tab) dragged out onto another subtab or right side -> PROMOTE 2ND TAB TO OWNER!
        // - Subtab over any other subtab -> DO NOT INTERCEPT (preserve Salesforce native subtab reordering).
        if (targetSubtabBar) {
          const hoveredSubLi = getTabListItem(getElementFromTarget(e.target));
          const hoveredSubTabId =
            hoveredSubLi && targetSubtabBar.contains(hoveredSubLi)
              ? getTabIdFromElement(hoveredSubLi)
              : null;
          if (
            hoveredSubLi &&
            hoveredSubTabId &&
            activeTabDragState.parentTabId &&
            hoveredSubTabId === activeTabDragState.parentTabId &&
            activeTabDragState.tabId !== activeTabDragState.parentTabId
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.dataTransfer.dropEffect = 'move';
            setTabDropHighlight(hoveredSubLi, 'subtab-make-owner');
            return;
          }
          if (
            activeTabDragState.parentTabId &&
            activeTabDragState.tabId === activeTabDragState.parentTabId &&
            hoveredSubTabId !== activeTabDragState.parentTabId
          ) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.dataTransfer.dropEffect = 'move';
            if (hoveredSubLi && hoveredSubTabId) {
              setTabDropHighlight(hoveredSubLi, 'subtab-move-owner');
            } else {
              const barItems = getTabBarItemsInDom(true).filter((i) => i.tabId !== activeTabDragState.parentTabId);
              const lastSub = barItems.length > 0 ? barItems[barItems.length - 1].li : null;
              setTabDropHighlight(lastSub, lastSub ? 'subtab-move-owner' : '');
            }
            return;
          }
          setTabDropHighlight(null);
          return;
        }

        // Subtab dragged over an individual primary workspace tab
        if (targetTabLi) {
          const targetTabId = getTabIdFromElement(targetTabLi);
          if (targetTabId && targetTabId !== activeTabDragState.tabId) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.dataTransfer.dropEffect = 'move';

            if (activeTabDragState.parentTabId && targetTabId === activeTabDragState.parentTabId) {
              // Dragging onto its OWN parent workspace tab -> PROMOTE!
              setTabDropHighlight(targetTabLi, 'tab-promote');
            } else {
              // Dragging onto a DIFFERENT workspace tab -> MOVE TO WORKSPACE!
              setTabDropHighlight(targetTabLi, 'tab-move-subtab');
            }
            return;
          }
        }

        // Subtab dragged over primary workspace bar / header -> PROMOTE!
        if (isPrimaryWorkspaceDropZone(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.dataTransfer.dropEffect = 'move';
          const el = getElementFromTarget(e.target);
          const container = el?.closest('.navexConsoleTabContainer, .oneWorkspaceNavigationTabs, .tabBarContainer') || el;
          setTabDropHighlight(container, 'bar-promote');
          return;
        }

        setTabDropHighlight(null);
        return;
      }

      // =====================================================================
      // CASE 2: Dragging an OUTER PRIMARY WORKSPACE TAB
      // =====================================================================
      if (!activeTabDragState.isSubtab) {
        // Outer primary tab dragged over the active workspace's subtab bar -> ADD AS SUBTAB!
        if (targetSubtabBar) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          e.dataTransfer.dropEffect = 'move';
          setTabDropHighlight(targetSubtabBar, 'subtab-bar-add');
          return;
        }

        // Outer primary tab dragged over another primary workspace tab -> CONVERT TO SUBTAB!
        if (targetTabLi) {
          const targetTabId = getTabIdFromElement(targetTabLi);
          if (targetTabId && targetTabId !== activeTabDragState.tabId) {
            if (isInTabCenterDropZone(e.clientX, targetTabLi)) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              e.dataTransfer.dropEffect = 'move';
              setTabDropHighlight(targetTabLi, 'tab-convert');
              return;
            } else {
              // In the narrow far-left/right edge margin: allow native tab reordering
              setTabDropHighlight(null);
              return;
            }
          }
        }

        setTabDropHighlight(null);
        return;
      }
    };

    document.addEventListener('dragover', handleDragOverOrEnter, true);
    document.addEventListener('dragenter', handleDragOverOrEnter, true);

    // Drag leave: only clear highlight if cursor actually leaves the browser viewport
    // (prevents child node / shadow boundary transitions inside a tab from flickering the outline)
    document.addEventListener(
      'dragleave',
      (e) => {
        if (!activeTabDragState) return;
        if (
          !e.relatedTarget &&
          (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)
        ) {
          setTabDropHighlight(null);
        }
      },
      true
    );

    // Drop
    document.addEventListener(
      'drop',
      async (e) => {
        if (!activeTabDragState || !activeTabDragState.isEnhancerTabDrag) return;

        const dragData = { ...activeTabDragState };
        setTabDropHighlight(null);
        if (activeTabDragState.sourceElement) {
          activeTabDragState.sourceElement.classList.remove('sf-tab-dragging');
        }
        document.documentElement.classList.remove('sf-tab-drag-active');
        activeTabDragState = null;

        const targetSubtabBar = getSubtabBarContainer(e.target);
        const targetTabLi = getPrimaryWorkspaceTabLi(e.target);

        // =====================================================================
        // CASE 1: Dropping a SUBTAB
        // =====================================================================
        if (dragData.isSubtab) {
          // Dropped within its own subtab bar:
          // - Subtab on workspace owner (first position) -> prompt to make this subtab the workspace owner
          // - Workspace owner (first position) dropped onto another subtab or empty bar area -> promote 2nd tab to owner
          // - Elsewhere in subtab bar -> allow Salesforce native subtab reordering to run
          if (targetSubtabBar) {
            const droppedSubLi = getTabListItem(getElementFromTarget(e.target));
            const droppedSubTabId =
              droppedSubLi && targetSubtabBar.contains(droppedSubLi)
                ? getTabIdFromElement(droppedSubLi)
                : null;
            if (
              droppedSubLi &&
              droppedSubTabId &&
              dragData.parentTabId &&
              droppedSubTabId === dragData.parentTabId &&
              dragData.tabId !== dragData.parentTabId
            ) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              await makeSubtabWorkspaceOwner(null, dragData.tabId, dragData.parentTabId);
              return;
            }
            if (
              dragData.parentTabId &&
              dragData.tabId === dragData.parentTabId &&
              droppedSubTabId !== dragData.parentTabId
            ) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();
              await moveWorkspaceOwnerOutOfFirstPosition(null, dragData.parentTabId, droppedSubTabId || '__END__');
              return;
            }
            return;
          }

          // Dropped on an individual primary workspace tab
          if (targetTabLi) {
            const targetTabId = getTabIdFromElement(targetTabLi);
            if (targetTabId && targetTabId !== dragData.tabId) {
              e.preventDefault();
              e.stopPropagation();
              e.stopImmediatePropagation();

              if (dragData.parentTabId && targetTabId === dragData.parentTabId) {
                // Dropped on own parent workspace tab -> PROMOTE!
                await promoteSubtabToPrimary(dragData.tabId);
                return;
              } else {
                // Dropped on different workspace tab -> MOVE TO THAT WORKSPACE!
                await moveSubtabToWorkspace(dragData.tabId, targetTabId);
                return;
              }
            }
          }

          // Dropped on primary workspace tab bar / header -> PROMOTE!
          if (isPrimaryWorkspaceDropZone(e.target)) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            await promoteSubtabToPrimary(dragData.tabId);
            return;
          }

          return;
        }

        // =====================================================================
        // CASE 2: Dropping an OUTER PRIMARY WORKSPACE TAB
        // =====================================================================
        if (!dragData.isSubtab) {
          // Dropped into Active Workspace Subtab Bar
          if (targetSubtabBar) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const ws = await getWorkspaceAPI().catch(() => null);
            const activeWsId = await getActiveWorkspaceTabId(ws);
            if (!activeWsId) {
              showToast('No active workspace tab found');
              return;
            }

            if (dragData.tabId === activeWsId) {
              showToast('Tab is already the active workspace');
              return;
            }

            await movePrimaryTabToSubtab(dragData.tabId, activeWsId);
            return;
          }

          // Dropped onto an individual Primary Workspace Tab
          if (targetTabLi) {
            const targetTabId = getTabIdFromElement(targetTabLi);
            if (!targetTabId || targetTabId === dragData.tabId) return;

            if (!isInTabCenterDropZone(e.clientX, targetTabLi)) {
              // Dropped in far edge margin: allow native tab reordering
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            await movePrimaryTabToSubtab(dragData.tabId, targetTabId);
            return;
          }
        }
      },
      true
    );
  }

  /* ==========================================================================
     QUICK VIEWS & APPEARANCE MODULE
     Surfaces a "QUICK VIEWS" section at the top of the List View Switcher
     dropdown, with manual ordering (▲/▼), alphabetical sort (A-Z), and
     clean, flat SLDS bookmark icon buttons.
     ========================================================================== */

  let isInternalDOMUpdate = false;

  function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(1, 118, 211, ${alpha})`;
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    if (c.length !== 6) return `rgba(1, 118, 211, ${alpha})`;
    const num = parseInt(c, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function getContrastColor(hex) {
    if (!hex || typeof hex !== 'string') return '#ffffff';
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return '#ffffff';
    const r = parseInt(c.slice(0, 2), 16) / 255;
    const g = parseInt(c.slice(2, 4), 16) / 255;
    const b = parseInt(c.slice(4, 6), 16) / 255;
    const a = [r, g, b].map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    const lum = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    return lum > 0.45 ? '#0f172a' : '#ffffff';
  }

  /** Returns theme CSS ensuring code blocks and inline code remain high-contrast across light and dark themes. */
  function generateCodeBlockCSS(baseTheme, accent) {
    if (!baseTheme) return '';
    return `
      /* Code Blocks, Inline Code & Syntax Highlighters */
      pre,
      code,
      kbd,
      samp,
      tt,
      pre.ql-syntax,
      .ql-syntax,
      .ql-editor pre,
      .ql-editor pre.ql-syntax,
      .ql-editor code,
      .ql-snow .ql-editor pre.ql-syntax,
      .cke_editable pre,
      .cke_editable code,
      .slds-text-longform pre,
      .slds-text-longform code,
      .slds-text-longform kbd,
      .slds-text-longform samp,
      .slds-rich-text-editor__output pre,
      .slds-rich-text-editor__output code,
      .slds-rich-text-editor__textarea pre,
      .slds-rich-text-editor__textarea code,
      .forceOutputRichText pre,
      .forceOutputRichText code,
      .uiOutputRichText pre,
      .uiOutputRichText code,
      lightning-formatted-rich-text pre,
      lightning-formatted-rich-text code,
      [part="formatted-rich-text"] pre,
      [part="formatted-rich-text"] code,
      .forceChatterFeedItem pre,
      .forceChatterFeedItem code,
      .cuf-feedItem pre,
      .cuf-feedItem code,
      [class*="code-block" i],
      [class*="codeBlock" i],
      [class*="code_block" i],
      [class*="codeContent" i],
      .syntaxhighlighter,
      .hljs,
      pre[class*="language-" i],
      code[class*="language-" i] {
        background-color: ${baseTheme.surfaceHeader} !important;
        background: ${baseTheme.surfaceHeader} !important;
        color: ${baseTheme.text} !important;
        border: 1px solid ${baseTheme.border} !important;
        border-color: ${baseTheme.border} !important;
      }

      /* Nested elements inside code blocks keep transparent backgrounds and readable text */
      pre *:not(a),
      pre.ql-syntax *:not(a),
      .ql-syntax *:not(a),
      .ql-editor pre *:not(a),
      .slds-text-longform pre *:not(a),
      .slds-rich-text-editor__output pre *:not(a),
      .forceOutputRichText pre *:not(a),
      .uiOutputRichText pre *:not(a),
      lightning-formatted-rich-text pre *:not(a),
      [part="formatted-rich-text"] pre *:not(a),
      .syntaxhighlighter *:not(a),
      .hljs *:not(a),
      [class*="code-block" i] *:not(a):not(button):not(button *),
      [class*="codeBlock" i] *:not(a):not(button):not(button *),
      [class*="code_block" i] *:not(a):not(button):not(button *),
      [class*="codeContent" i] *:not(a),
      code *:not(a) {
        background-color: transparent !important;
        background: transparent !important;
        color: ${baseTheme.text} !important;
        border-color: ${baseTheme.border} !important;
      }

      /* Avoid double borders/boxes on code nested inside pre */
      pre code,
      pre kbd,
      pre samp,
      pre tt,
      .ql-editor pre code,
      .slds-text-longform pre code,
      .slds-rich-text-editor__output pre code,
      .forceOutputRichText pre code,
      .uiOutputRichText pre code,
      lightning-formatted-rich-text pre code,
      [part="formatted-rich-text"] pre code {
        background-color: transparent !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
      }

      pre a,
      code a,
      .ql-syntax a,
      [part="formatted-rich-text"] pre a {
        background-color: transparent !important;
        background: transparent !important;
        color: ${accent} !important;
      }
    `;
  }

  function generateDarkBodyTextCSS(baseTheme, accent, includeStandaloneIframe = false) {
    if (!baseTheme || !baseTheme.isDark) return '';
    const containers = [
      '.slds-card__body',
      '.forcePageBlock',
      '.forcePageBlockSection',
      '.forcePageBlockItem',
      'records-lwc-detail-panel',
      'records-base-record-form',
      'records-record-layout-base',
      'records-record-layout-section',
      'records-record-layout-item',
      'flexipage-component2',
      '.test-id__field-value',
      '.slds-form-element__static',
      '.forceOutputRichText',
      '.uiOutputRichText',
      '.uiOutputText',
      '.uiOutputTextArea',
      '.uiOutputEmail',
      '.uiOutputUrl',
      'lightning-formatted-rich-text',
      'lightning-formatted-text',
      'lightning-formatted-email',
      'lightning-output-field',
      '[part="formatted-rich-text"]',
      '[part="input-rich-text"]',
      '.slds-rich-text-editor__output',
      '.slds-text-longform',
      '.slds-text-body_regular',
      '.slds-text-body_default',
      '.ql-editor',
      '.cke_editable',
      '.cke_contents',
      'knowledge-article-body',
      'knowledge-article-viewer',
      'runtime_service_knowledge-article-viewer',
      'support-knowledge-article',
      '[class*="knowledgeArticle" i]',
      '[class*="knowledge-article" i]',
      '[class*="articleBody" i]',
      '[class*="article-body" i]',
      '[class*="articleContent" i]',
      '[class*="article-content" i]',
      '[class*="richText" i]',
      '[class*="rich-text" i]',
      '[data-aura-class*="Knowledge" i]',
      '[data-aura-class*="RichText" i]',
      '.slds-feed',
      '.forceChatterFeed',
      '.forceChatterFeedItem',
      '.forceChatterFeedBody',
      '.forceChatterMessageBody',
      '.forceChatterMessageSegment',
      '.cuf-feedItem',
      '.cuf-feedItemBody',
      '.slds-post__content',
      '.slds-comment__content',
      '.slds-timeline__item',
      '.slds-timeline__item_expandable',
      '.slds-activity-timeline',
      '.forceChatterEmailDetail',
      '.forceChatterEmailMessage',
      '.forceEmailBody',
      '.emailMessageBody',
      '.emailMessage',
      '.emailDetail',
      '.emailBody',
      '.emailContent',
      '.cuf-emailBody',
      '.cuf-emailMessage',
      'emailui-message-detail',
      'emailui-email-body',
      'emailui-rich-text',
      'emailui-message-item',
      'support-email-message',
      'support-email-detail',
      'runtime_service_email-email-detail',
      'force-email-body',
      '[class*="emailMessage" i]',
      '[class*="email-message" i]',
      '[class*="emailBody" i]',
      '[class*="email-body" i]',
      '[class*="emailDetail" i]',
      '[class*="email-detail" i]',
      '[class*="emailContent" i]',
      '[class*="email-content" i]',
      '[class*="emailViewer" i]',
      '[class*="email-viewer" i]',
      '[class*="emailThread" i]',
      '[class*="email-thread" i]',
      '[data-aura-class*="Email" i]',
      '[data-aura-class*="Chatter" i]',
      '.slds-modal__content',
      '.modal-body'
    ].join(',\n          ');

    const richHtmlBgContainers = [
      '.forceOutputRichText',
      '.uiOutputRichText',
      'lightning-formatted-rich-text',
      '[part="formatted-rich-text"]',
      '.slds-rich-text-editor__output',
      '.slds-text-longform',
      '.ql-editor',
      '.cke_editable',
      '.cke_contents',
      '.forceChatterEmailDetail',
      '.forceChatterEmailMessage',
      '.forceEmailBody',
      '.emailMessageBody',
      '.emailBody',
      '.emailContent',
      '.cuf-emailBody',
      '.cuf-emailMessage',
      'emailui-message-detail',
      'emailui-email-body',
      'emailui-rich-text',
      'emailui-message-item',
      'support-email-message',
      'support-email-detail',
      'runtime_service_email-email-detail',
      'force-email-body',
      '.test-id__field-value',
      '.slds-form-element__static',
      '[class*="knowledgeArticle" i]',
      '[class*="knowledge-article" i]',
      '[class*="articleBody" i]',
      '[class*="article-body" i]',
      '[class*="articleContent" i]',
      '[class*="emailMessage" i]',
      '[class*="email-message" i]',
      '[class*="emailBody" i]',
      '[class*="email-body" i]',
      '[class*="emailDetail" i]',
      '[class*="email-detail" i]',
      '[class*="emailContent" i]',
      '[class*="email-content" i]',
      '[class*="emailViewer" i]',
      '[class*="emailThread" i]',
      '[data-aura-class*="Email" i]',
      '[data-aura-class*="Knowledge" i]'
    ].join(',\n          ');

    const textTags = 'p, span, div, li, ul, ol, dt, dd, dl, td, th, tr, table, tbody, thead, tfoot, caption, blockquote, strong, b, em, i, u, s, small, sub, sup, font, label, h1, h2, h3, h4, h5, h6, article, section';
    const textExclusions = [
      ':not(a):not(a *)',
      ':not(button):not(button *)',
      ':not(.slds-button):not(.slds-button *)',
      ':not(.slds-badge):not(.slds-badge *)',
      ':not(.slds-pill):not(.slds-pill *)',
      ':not(.slds-theme_success):not(.slds-theme_success *)',
      ':not(.slds-theme_error):not(.slds-theme_error *)',
      ':not(.slds-theme_warning):not(.slds-theme_warning *)',
      ':not(.slds-theme_info):not(.slds-theme_info *)',
      ':not(.slds-path):not(.slds-path *)',
      ':not(.slds-path__item):not(.slds-path__item *)',
      ':not([class*="chat-message__text"]):not([class*="chat-message__text"] *)',
      ':not([class*="chat-listitem_outbound"] *)',
      ':not([data-direction="outbound"] *)',
      ':not([data-message-direction="outbound"] *)',
      ':not(pre):not(pre *)',
      ':not(code):not(code *)',
      ':not(kbd):not(samp):not(tt)',
      ':not(.ql-syntax):not(.ql-syntax *)',
      ':not(.slds-form-element__label):not(.slds-form-element__label *)',
      ':not(.test-id__field-label):not(.test-id__field-label *)',
      ':not(.slds-text-color_weak)',
      ':not(.slds-text-body_small)',
      ':not(.slds-chat-message__meta):not(.slds-chat-message__meta *)',
      ':not(.slds-chat-event__body):not(.slds-chat-event__body *)',
      ':not(.data-match)'
    ].join('');

    const bgExclusions = [
      ':not(input):not(textarea):not(select)',
      ':not(mark):not(img):not(svg)',
      ':not(.slds-dropdown):not(.slds-dropdown *)',
      ':not(.slds-popover):not(.slds-popover *)',
      ':not(.slds-listbox):not(.slds-listbox *)',
      ':not(.slds-combobox):not(.slds-combobox *)',
      ':not(.slds-table):not(.slds-table *)',
      ':not(.uiMenuList):not(.uiMenuList *)',
      ':not([role="menu"]):not([role="menu"] *)',
      ':not(.slds-avatar):not(.slds-avatar *)',
      ':not(.slds-icon_container):not(.slds-icon_container *)'
    ].join('');

    let css = `
      /* Dark Theme Body Text, Knowledge Articles, Rich Text & Expanded Email View Readability */
      .forceOutputRichText,
      .uiOutputRichText,
      .uiOutputText,
      .uiOutputTextArea,
      .uiOutputEmail,
      .test-id__field-value,
      .slds-form-element__static,
      .slds-text-longform,
      .slds-text-body_regular,
      .slds-rich-text-editor__output,
      lightning-formatted-rich-text,
      lightning-formatted-text,
      lightning-formatted-email,
      [part="formatted-rich-text"],
      .ql-editor,
      .forceChatterEmailDetail,
      .forceChatterEmailMessage,
      .forceEmailBody,
      .emailMessageBody,
      .emailBody,
      .emailContent,
      .cuf-emailBody,
      .forceChatterMessageBody {
        color: ${baseTheme.text} !important;
      }

      :is(
        ${containers}
      ) :is(${textTags})${textExclusions} {
        color: ${baseTheme.text} !important;
      }

      :is(
        ${richHtmlBgContainers}
      ) :is(${textTags})${textExclusions}${bgExclusions} {
        background-color: transparent !important;
        border-color: ${baseTheme.border} !important;
      }

      :is(
        ${containers}
      ) a:not(.slds-button):not(.slds-pill__action):not(.slds-badge):not([class*="chat-message__text"] a):not(.slds-tabs_default__link):not(.slds-tabs_card__link):not(.slds-tabs_scoped__link):not(.slds-path__link):not(.uiTabItem > a) {
        color: ${accent} !important;
      }

      :is(
        ${containers}
      ) a:not(.slds-button):not(.slds-pill__action):not(.slds-badge):not([class*="chat-message__text"] a):not(.slds-tabs_default__link):not(.slds-tabs_card__link):not(.slds-tabs_scoped__link):not(.slds-path__link):not(.uiTabItem > a) *:not(svg):not(path) {
        color: inherit !important;
      }

      button.slds-button:not(.slds-button_brand):not(.slds-button--brand):not(.slds-button_neutral):not(.slds-button--neutral):not(.slds-button_destructive):not(.slds-button--destructive):not(.slds-button_text-destructive):not(.slds-button--text-destructive):not(.slds-button_success):not(.slds-button--success):not(.slds-button_outline-brand):not(.slds-button--outline-brand):not(.slds-button_inverse):not(.slds-button--inverse):not(.slds-button_icon):not(.slds-button--icon):not(.slds-button_icon-border):not(.slds-button--icon-border):not(.slds-button_icon-border-filled):not(.slds-button--icon-bare) {
        color: ${accent} !important;
      }

      .uiTabset--task .tabs__item.active > a,
      .uiTabset--task .tabs__item.active > a.tabHeader,
      .uiTabset--task .tabs__item > a.tabHeader:hover,
      .uiTabset--task .tabs__item > a.tabHeader:focus {
        background-color: ${baseTheme.surface} !important;
        color: ${accent} !important;
        border-color: ${baseTheme.border} !important;
      }

      .forceChatterFeedInner .skip-feed-endpoint,
      .skip-feed-endpoint {
        background: ${baseTheme.surfaceHeader} !important;
        background-color: ${baseTheme.surfaceHeader} !important;
        color: ${baseTheme.textMuted} !important;
        border-color: ${baseTheme.border} !important;
      }

      :is(${containers}) hr {
        border-color: ${baseTheme.border} !important;
        background-color: ${baseTheme.border} !important;
      }
    `;

    if (includeStandaloneIframe) {
      css += `
        /* Subframe / Standalone HTML Email Body (ignores nested Console Workspace frames) */
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)),
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)) body {
          background-color: ${baseTheme.surface} !important;
          color: ${baseTheme.text} !important;
        }
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)) body :is(${textTags})${textExclusions} {
          color: ${baseTheme.text} !important;
        }
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)) body :is(${textTags})${textExclusions}${bgExclusions} {
          background-color: transparent !important;
          border-color: ${baseTheme.border} !important;
        }
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)) body a:not(.slds-button) {
          color: ${accent} !important;
        }
        html:not(:has(.navexWorkspaceManager)):not(:has(.oneWorkspace)) body a:not(.slds-button) *:not(svg):not(path) {
          color: inherit !important;
        }
      `;
    }

    return css;
  }

  let pendingAppearanceSettings = null;
  let pendingAppearanceTimer = null;
  let activeAppearanceSequence = 0;

  function scheduleAppearanceSettings(newSettings) {
    pendingAppearanceSettings = newSettings;
    activeAppearanceSequence++;
    const seq = activeAppearanceSequence;

    // Fast path: Immediately update light-DOM stylesheet so top-level headers, nav bar and background react with 0 lag
    applyAppearanceSettings(newSettings, seq, true);

    if (pendingAppearanceTimer) {
      clearTimeout(pendingAppearanceTimer);
    }

    pendingAppearanceTimer = setTimeout(() => {
      pendingAppearanceTimer = null;
      if (seq !== activeAppearanceSequence) return;
      const toApply = pendingAppearanceSettings || newSettings;
      applyAppearanceSettings(toApply, seq, false);
    }, 30);
  }

  function applyAppearanceSettings(rawSettings, seqId, lightOnly = false) {
    if (seqId === undefined) {
      activeAppearanceSequence++;
      seqId = activeAppearanceSequence;
    } else if (seqId !== activeAppearanceSequence) {
      return;
    }

    const settings = normalizeSettings(rawSettings || getEnhancerSettings());
    let styleEl = document.getElementById('sf-custom-appearance-style');
    const preloadStyle = document.getElementById('sf-preload-theme-style');
    const preloadLoadingStyle = document.getElementById('sf-preload-loading-style');
    let hideAppNameStyle = document.getElementById('sf-hide-app-name-style');

    const themingEnabled = settings.modules?.theming === true;
    const loadingUrl = getEffectiveLoadingUrl(settings);
    const shouldHideAppName = (settings.modules?.subtabs !== false) && !!(settings.hideAppName || settings.subtabs?.hideAppName);

    // Apply or remove Compact Console Header style (Lightning Console apps only, independent of theming/loading modules)
    if (shouldHideAppName) {
      if (!hideAppNameStyle) {
        hideAppNameStyle = document.createElement('style');
        hideAppNameStyle.id = 'sf-hide-app-name-style';
        (document.head || document.documentElement).appendChild(hideAppNameStyle);
      }
      hideAppNameStyle.textContent = `
        /* Hide ONLY the App Name text next to App Launcher inside Lightning Console headers */
        .tabsetHeader.slds-context-bar span.slds-context-bar__app-name,
        .tabsetHeader.slds-context-bar span.appName,
        .slds-context-bar.slds-context-bar_tabs span.slds-context-bar__app-name,
        .slds-context-bar.slds-context-bar_tabs span.appName,
        .oneConsoleNav span.slds-context-bar__app-name,
        .oneConsoleNav span.appName,
        .navexConsoleNav span.slds-context-bar__app-name,
        .navexConsoleNav span.appName,
        .tabsetHeader.slds-context-bar .appName:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
        .tabsetHeader.slds-context-bar .slds-context-bar__app-name:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
        .slds-context-bar.slds-context-bar_tabs .appName:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
        .slds-context-bar.slds-context-bar_tabs .slds-context-bar__app-name:not(a):not(button):not(:has(.appLauncher)):not(:has(button)) {
          display: none !important;
        }

        /* Ensure App Launcher (waffle button) and its container remain completely visible in Console headers */
        .oneConsoleNav .appLauncher,
        .oneConsoleNav .slds-icon-waffle_container,
        .oneConsoleNav > .slds-context-bar__item:first-child,
        .tabsetHeader.slds-context-bar .slds-context-bar__primary > .slds-context-bar__item:first-child,
        .tabsetHeader.slds-context-bar .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher),
        .slds-context-bar.slds-context-bar_tabs .slds-context-bar__primary > .slds-context-bar__item:first-child,
        .slds-context-bar.slds-context-bar_tabs .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher) {
          display: inline-flex !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Compact left spacing before App Launcher and restore crisp separation after App Launcher (Console only) */
        .tabsetHeader.slds-context-bar,
        .slds-context-bar.slds-context-bar_tabs {
          padding-left: 0 !important;
        }

        .tabsetHeader.slds-context-bar > .slds-context-bar__primary,
        .slds-context-bar.slds-context-bar_tabs > .slds-context-bar__primary {
          display: inline-flex !important;
          align-items: stretch !important;
          height: 100% !important;
          min-width: 0 !important;
          width: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          border-right: none !important;
        }

        .oneConsoleNav,
        .navexConsoleNav {
          display: inline-flex !important;
          align-items: stretch !important;
          height: 100% !important;
          width: auto !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* App Launcher item inside Lightning Console header */
        .oneConsoleNav > .slds-context-bar__item:first-child,
        .tabsetHeader.slds-context-bar .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher),
        .slds-context-bar.slds-context-bar_tabs .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher) {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex: 0 0 auto !important;
          height: 100% !important;
          padding: 0 8px !important;
          margin: 0 !important;
          min-width: 0 !important;
          width: auto !important;
          max-width: none !important;
          border-right: 1px solid var(--sf-nav-divider-color, rgb(201, 201, 201)) !important;
        }

        .oneConsoleNav > .slds-context-bar__item:first-child .appLauncher,
        .tabsetHeader.slds-context-bar .slds-context-bar__primary .appLauncher,
        .slds-context-bar.slds-context-bar_tabs .slds-context-bar__primary .appLauncher {
          padding: 0 !important;
          margin: 0 auto !important;
          height: 100% !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .tabsetHeader.slds-context-bar .slds-context-bar__primary .slds-icon-waffle_container,
        .tabsetHeader.slds-context-bar .slds-context-bar__primary button.slds-icon-waffle_container,
        .oneConsoleNav .appLauncher button.slds-button,
        .oneConsoleNav .appLauncher .slds-context-bar__button {
          padding: 0 !important;
          margin: 0 auto !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .oneConsoleNav .slds-icon-waffle,
        .tabsetHeader.slds-context-bar .slds-icon-waffle {
          margin: 0 auto !important;
        }

        /* Lightning Console unified navigation tab wrapper (.oneConsoleNav > .appNavItems) */
        .oneConsoleNav > .appNavItems,
        .sf-home-unified-tab {
          display: inline-flex !important;
          align-items: stretch !important;
          position: relative !important;
          width: auto !important;
          height: 100% !important;
          padding: 0 8px 0 0 !important;
          margin: 0 !important;
          border: none !important;
          border-left: none !important;
          border-right: 1px solid var(--sf-nav-divider-color, rgb(201, 201, 201)) !important;
          transition: background-color 0.25s cubic-bezier(0.39, 0.575, 0.565, 1) !important;
          cursor: pointer !important;
        }

        .oneConsoleNav > .appNavItems > .selectedListItem,
        .oneConsoleNav > .appNavItems > .sf-home-tab-item {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          flex: 0 0 auto !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          border-left: none !important;
          border-right: none !important;
          box-shadow: none !important;
          background: transparent !important;
          position: static !important;
        }

        .oneConsoleNav > .appNavItems > .selectedListItem > a.sf-home-tab-link,
        .oneConsoleNav > .appNavItems > .selectedListItem > a {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          height: 100% !important;
          width: auto !important;
          min-width: 0 !important;
          padding: 0 8px !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .oneConsoleNav > .appNavItems > .navMenu {
          display: inline-flex !important;
          align-items: center !important;
          height: 100% !important;
          width: auto !important;
          min-width: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          border-right: none !important;
          box-shadow: none !important;
          background: transparent !important;
          position: static !important;
        }

        .oneConsoleNav > .appNavItems > .navMenu section[role="dialog"],
        .oneConsoleNav > .appNavItems > .navMenu .slds-popover,
        .sf-home-unified-tab > .navMenu section[role="dialog"],
        .sf-home-unified-tab > .navMenu .slds-popover {
          left: 0 !important;
          right: auto !important;
        }

        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 24px !important;
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }

        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 24px !important;
          height: 24px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          cursor: pointer !important;
        }

        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button svg {
          width: 14px !important;
          height: 14px !important;
        }

        .oneConsoleNav > .appNavItems:hover,
        .sf-home-unified-tab:hover {
          background-color: var(--sf-pinned-tab-hover-bg, var(--lwc-brandPrimaryTransparent10, rgba(109, 151, 196, 0.1))) !important;
        }

        .oneConsoleNav > .appNavItems:hover::before,
        .oneConsoleNav > .appNavItems:hover::after,
        .sf-home-unified-tab:hover::before,
        .sf-home-unified-tab:hover::after {
          display: none !important;
          content: none !important;
        }

        .oneConsoleNav > .appNavItems > .selectedListItem,
        .oneConsoleNav > .appNavItems > .selectedListItem *,
        .oneConsoleNav > .appNavItems > .navMenu,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button *,
        .sf-home-unified-tab > .selectedListItem,
        .sf-home-unified-tab > .selectedListItem *,
        .sf-home-unified-tab > .navMenu,
        .sf-home-unified-tab > .navMenu > .slds-context-bar__icon-action,
        .sf-home-unified-tab > .navMenu > .slds-context-bar__icon-action > button,
        .sf-home-unified-tab > .navMenu > .slds-context-bar__icon-action > button * {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }

        .oneConsoleNav > .appNavItems > .selectedListItem::before,
        .oneConsoleNav > .appNavItems > .selectedListItem::after,
        .oneConsoleNav > .appNavItems > .selectedListItem *::before,
        .oneConsoleNav > .appNavItems > .selectedListItem *::after,
        .oneConsoleNav > .appNavItems > .navMenu::before,
        .oneConsoleNav > .appNavItems > .navMenu::after,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action::before,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action::after,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button::before,
        .oneConsoleNav > .appNavItems > .navMenu > .slds-context-bar__icon-action > button::after {
          display: none !important;
          content: none !important;
        }

        .oneConsoleObjectSwitcher,
        one-console-object-switcher {
          width: auto !important;
          min-width: 0 !important;
          height: 100% !important;
          display: inline-flex !important;
          align-items: center !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        /* Console object-switcher fallback (when not inside .oneConsoleNav > .appNavItems) */
        .sf-home-tab-item:not(.selectedListItem),
        .slds-context-bar__object-switcher:not(.selectedListItem) {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          align-self: stretch !important;
          height: 100% !important;
          min-height: 100% !important;
          width: auto !important;
          min-width: 0 !important;
          max-width: none !important;
          flex: 0 0 auto !important;
          padding: 0 8px 0 0 !important;
          margin: 0 !important;
          border: none !important;
          border-left: none !important;
          border-right: 1px solid var(--sf-nav-divider-color, rgb(201, 201, 201)) !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          cursor: pointer !important;
        }

        /* Remove dividers and pseudo-elements between Home link and dropdown arrow */
        .sf-home-tab-item:not(.selectedListItem)::before,
        .sf-home-tab-item:not(.selectedListItem)::after,
        .sf-home-tab-link::before,
        .sf-home-tab-link::after,
        .slds-context-bar__object-switcher > a::before,
        .slds-context-bar__object-switcher > a::after,
        .slds-context-bar__object-switcher > .slds-context-bar__label-action::before,
        .slds-context-bar__object-switcher > .slds-context-bar__label-action::after,
        .slds-context-bar__object-switcher > .slds-context-bar__icon-action::before,
        .slds-context-bar__object-switcher > .slds-context-bar__icon-action::after {
          display: none !important;
          content: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Hide close buttons in Home tab (pinned tabs do not have close buttons) */
        .sf-home-tab-item button.close,
        .sf-home-tab-item button[title*="Close"],
        .sf-home-tab-item .closeButton {
          display: none !important;
        }

        /* Integrate the dropdown arrow directly into the Home tab without divider or separate section look (fallback) */
        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__icon-action,
        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__dropdown-trigger,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__dropdown-trigger,
        .sf-home-tab-item:not(.selectedListItem) one-app-nav-bar-menu-button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          border-left: none !important;
          border-right: none !important;
          box-shadow: none !important;
          background: transparent !important;
          background-color: transparent !important;
          padding: 0 !important;
          margin: 0 0 0 8px !important;
          height: 100% !important;
          min-height: 100% !important;
          width: 24px !important;
          min-width: 0 !important;
        }

        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action button,
        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action .slds-button,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__icon-action button,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__icon-action .slds-button,
        .sf-home-tab-item:not(.selectedListItem) button.slds-context-bar__button {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          border-left: none !important;
          border-right: none !important;
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          outline: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 24px !important;
          min-width: 0 !important;
          height: 24px !important;
          color: var(--sf-tab-icon-color, #0176d3) !important;
          cursor: pointer !important;
        }

        /* Dropdown arrow icon styling: matching pinned tab chevron size */
        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action svg,
        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action lightning-primitive-icon,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__icon-action svg,
        .sf-home-tab-item:not(.selectedListItem) button.slds-context-bar__button svg {
          width: 14px !important;
          height: 14px !important;
          min-width: 14px !important;
          min-height: 14px !important;
          max-width: 14px !important;
          max-height: 14px !important;
          fill: var(--sf-tab-icon-color, #0176d3) !important;
          color: var(--sf-tab-icon-color, #0176d3) !important;
          display: inline-block !important;
          margin: 0 !important;
        }

        .sf-home-tab-item:not(.selectedListItem) .slds-context-bar__icon-action svg path,
        .slds-context-bar__object-switcher:not(.selectedListItem) .slds-context-bar__icon-action svg path {
          fill: var(--sf-tab-icon-color, #0176d3) !important;
        }

        /* Home tab link: inline-flex holding the icon, zero borders */
        .sf-home-tab-link,
        a.sf-home-tab-link,
        .oneConsoleNav > .appNavItems > .selectedListItem > a,
        .slds-context-bar__object-switcher > a:not(.menuItem):not([role="menuitem"]),
        .slds-context-bar__object-switcher > .slds-context-bar__label-action,
        .sf-home-tab-item > .slds-context-bar__label-action {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: auto !important;
          min-width: 0 !important;
          height: 100% !important;
          padding: 0 8px !important;
          margin: 0 !important;
          border: none !important;
          border-left: none !important;
          border-right: none !important;
          box-shadow: none !important;
          box-sizing: border-box !important;
          color: var(--sf-tab-icon-color, #757575) !important;
          text-decoration: none !important;
          cursor: pointer !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Hide all other children of the Home link except the home icon */
        .sf-home-tab-link > *:not(.sf-home-icon),
        .oneConsoleNav > .appNavItems > .selectedListItem > a > *:not(.sf-home-icon),
        .slds-context-bar__object-switcher > a:not(.menuItem):not([role="menuitem"]) > *:not(.sf-home-icon) {
          display: none !important;
        }

        .sf-home-tab-link::before,
        .sf-home-tab-link::after {
          display: none !important;
          content: none !important;
        }

        /* SVG Home Icon */
        .sf-home-icon,
        svg.sf-home-icon {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          display: block !important;
          margin: 0 !important;
          flex-shrink: 0 !important;
          fill: var(--sf-tab-icon-color, #757575) !important;
          color: var(--sf-tab-icon-color, #757575) !important;
        }

        .sf-home-icon path {
          fill: var(--sf-tab-icon-color, #757575) !important;
        }

        /* Unified hover state on the fallback tab container */
        .sf-home-tab-item:not(.selectedListItem):hover,
        .sf-home-tab-item:not(.selectedListItem):has(> *:hover),
        .slds-context-bar__object-switcher:not(.selectedListItem):has(> .sf-home-tab-link):hover {
          background-color: var(--sf-pinned-tab-hover-bg, var(--lwc-brandPrimaryTransparent10, rgba(109, 151, 196, 0.1))) !important;
        }

        .sf-home-tab-item > a,
        .sf-home-tab-item > a:hover,
        .sf-home-tab-item:not(.selectedListItem) > .slds-context-bar__icon-action,
        .sf-home-tab-item:not(.selectedListItem) > .slds-context-bar__icon-action:hover,
        .sf-home-tab-item:not(.selectedListItem) > .slds-context-bar__icon-action > button,
        .sf-home-tab-item:not(.selectedListItem) > .slds-context-bar__icon-action > button:hover {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
      `;
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (_) {}
    } else if (hideAppNameStyle) {
      hideAppNameStyle.remove();
      try {
        window.dispatchEvent(new Event('resize'));
      } catch (_) {}
    }

    // If theming module is disabled, clean up 100% of injected theme CSS and inline styles
    if (!themingEnabled) {
      if (preloadStyle) preloadStyle.remove();
      removeAllShadowThemeStyles();
      if (typeof removeAllIframeThemeStyles === 'function') removeAllIframeThemeStyles();
      cleanupSearchAssistantDOM();
      cleanupThemeInlineStyles();
    }

    // If both theming and loading animation are disabled, remove all custom styles
    if (!themingEnabled && !loadingUrl) {
      if (styleEl) styleEl.remove();
      if (preloadLoadingStyle) preloadLoadingStyle.remove();
      if (document.documentElement) {
        document.documentElement.dataset.sfLoadingEnabled = 'false';
        document.documentElement.dataset.sfLoadingDisabled = 'true';
      }
      syncHomeIconNavContext();
      return;
    }
    if (document.documentElement) {
      document.documentElement.dataset.sfLoadingEnabled = loadingUrl ? 'true' : 'false';
      document.documentElement.dataset.sfLoadingDisabled = loadingUrl ? 'false' : 'true';
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'sf-custom-appearance-style';
      (document.head || document.documentElement).appendChild(styleEl);
    }

    const themeKey = (settings.theme && settings.theme.preset) || 'classic';
    const baseTheme = THEMES[themeKey] || THEMES['classic'];
    const accent = (themeKey === 'custom' && settings.theme?.customAccent) ? sanitizeHexColor(settings.theme.customAccent) : baseTheme.accent;
    const accentContrast = (themeKey === 'custom') ? getContrastColor(accent) : baseTheme.contrast;
    const accentTint = hexToRgba(accent, 0.14);
    const accentBorder = hexToRgba(accent, 0.35);
    const baseBorder = (baseTheme && baseTheme.border) ? baseTheme.border : '#dddbda';
    const isDark = !!baseTheme.isDark;
    const hoverBg = isDark ? hexToRgba(accent, 0.18) : '#eef4ff';
    const applyNav = themingEnabled && (!settings.theme || settings.theme.applyToNavigation !== false);

    let css = '';
    if (themingEnabled) {
      css += `
        :root {
          --sf-theme-accent: ${accent} !important;
          --sf-theme-accent-tint: ${accentTint} !important;
          --sf-theme-accent-border: ${accentBorder} !important;
          --sf-theme-accent-contrast: ${accentContrast} !important;
        }
      `;
    }

    if (loadingUrl) {
      const loadingSize = ((settings.loadingImage && settings.loadingImage.size) || 64) + 'px';
      css += `
        :root {
          --sf-custom-loading-img: url("${loadingUrl.replace(/"/g, '\\"')}") !important;
          --sf-custom-loading-size: ${loadingSize} !important;
        }
      `;
    }

    if (themingEnabled) {
      // Quick Views Accent Theming
      css += `
        .sf-quick-item.slds-is-selected {
          background: ${accentTint} !important;
          border-left: 3px solid ${accent} !important;
        }
        .sf-quick-item.slds-is-selected .sf-quick-item-label {
          color: ${isDark ? '#f8fafc' : '#0f172a'} !important;
          font-weight: 700 !important;
        }
        .sf-quick-item.slds-is-selected .sf-quick-item-icon svg {
          stroke: ${accent} !important;
        }
        .sf-quick-item:hover {
          background: ${accentTint} !important;
        }
        .sf-native-bookmark-btn:hover svg path {
          stroke: ${accent} !important;
        }
        .sf-native-bookmark-btn.is-bookmarked:hover {
          background: ${accentTint} !important;
        }
        .sf-quick-control-btn:hover {
          color: ${accent} !important;
        }
      `;

      if (applyNav) {
        css += `
          /* Single clean accent bar directly below top app navigation bar */
          one-app-nav-bar {
            border-bottom: 2px solid ${accent} !important;
          }
          one-app-nav-bar .slds-context-bar,
          .slds-context-bar,
          nav.slds-context-bar {
            border-bottom: none !important;
          }

          /* Active navigation bar item indicator */
          one-app-nav-bar .slds-context-bar__item.slds-is-active {
            border-bottom: none !important;
          }
          one-app-nav-bar .slds-context-bar__item.slds-is-active::before {
            background-color: ${accent} !important;
            height: 2px !important;
          }

          /* Outer Console Workspace Tab Bar - clean base border, no multiple stacked lines */
          .oneWorkspaceNavigationTabs,
          .oneConsoleTabContainer,
          .tabsetHeader.slds-context-bar > .slds-context-bar__primary,
          .slds-context-bar.slds-context-bar_tabs > .slds-context-bar__primary {
            border-bottom: 1px solid ${baseBorder} !important;
          }
          .oneWorkspaceNavigationTabs .oneConsoleTabContainer,
          .oneWorkspaceNavigationTabs .navexConsoleTabContainer,
          .navexWorkspaceManager .tabBarContainer,
          .navexConsoleTabContainer .tabBarContainer,
          .tabBarContainer,
          ul.tabBarItems {
            border-bottom: none !important;
            border-top: none !important;
          }

          /* Console workspace active tab - single crisp 2px top indicator, no border duplication */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem,
          .tabBarContainer ul.tabBarItems > li.tabItem {
            border-top: none !important;
            border-bottom: none !important;
          }
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem.slds-is-active::before,
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem.active::before,
          .tabBarContainer ul.tabBarItems > li.tabItem.slds-is-active::before,
          .tabBarContainer ul.tabBarItems > li.tabItem.active::before {
            background-color: ${accent} !important;
            height: 2px !important;
            top: 0 !important;
          }

          /* Subtabs Bar */
          .subtabContainer,
          .subtabs,
          .slds-sub-tabs,
          ul.subtabs {
            border-bottom: 1px solid ${baseBorder} !important;
          }
          ul.subtabs > li.tabItem,
          .subtabs li.tabItem,
          .slds-sub-tabs__item {
            border-top: none !important;
            border-bottom: none !important;
          }
          ul.subtabs > li.tabItem.slds-is-active::before,
          .subtabs li.tabItem.slds-is-active::before,
          .slds-sub-tabs__item.slds-is-active::before {
            background-color: ${accent} !important;
            height: 2px !important;
          }

          /* App Launcher horizontal centering within container */
          .appLauncher,
          .slds-context-bar__icon-action {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .appLauncher one-app-launcher-header,
          one-app-launcher-header {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 0 auto !important;
          }

          .slds-icon-waffle_container,
          button.slds-icon-waffle_container,
          .appLauncher button.slds-button,
          .appLauncher .slds-context-bar__button {
            margin: 0 auto !important;
            padding: 0 !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .slds-icon-waffle {
            margin: 0 auto !important;
          }
        `;
      }

      // Comprehensive Theme Coverage (Gruvbox, Solarized, Nord, Dracula, One Dark, etc.)
      if (themeKey !== 'classic' && baseTheme) {
        css += `
          :root {
            /* SLDS Global Neutral Tokens */
            --slds-g-color-neutral-base-100: ${baseTheme.bg} !important;
            --slds-g-color-neutral-base-95: ${baseTheme.surface} !important;
            --slds-g-color-neutral-base-90: ${baseTheme.surfaceHeader} !important;
            --slds-g-color-neutral-base-80: ${baseTheme.border} !important;
            --slds-g-color-neutral-base-60: ${baseTheme.textMuted} !important;
            --slds-g-color-neutral-base-50: ${baseTheme.textMuted} !important;
            --slds-g-color-neutral-base-40: ${baseTheme.textMuted} !important;
            --slds-g-color-neutral-base-30: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-25: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-20: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-15: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-10: ${baseTheme.text} !important;
            --slds-g-color-on-surface-1: ${baseTheme.text} !important;
            --slds-g-color-on-surface-2: ${baseTheme.text} !important;
            --slds-g-color-on-surface-3: ${baseTheme.textMuted} !important;

            /* Lightning Web Component (LWC) Global Design Tokens */
            --lwc-colorBackground: ${baseTheme.surface} !important;
            --lwc-colorBackgroundAlt: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundShade: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundRowHover: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundRowSelected: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundButtonDefault: ${baseTheme.surface} !important;
            --lwc-colorBackgroundButtonDefaultHover: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundButtonBrand: ${accent} !important;
            --lwc-colorBackgroundInput: ${baseTheme.bg} !important;
            --lwc-colorBackgroundCard: ${baseTheme.surface} !important;
            --lwc-colorBackgroundCardHeader: ${baseTheme.surface} !important;
            --lwc-colorBackgroundCardFooter: ${baseTheme.surface} !important;
            --lwc-colorBackgroundModal: ${baseTheme.surface} !important;
            --lwc-colorBackgroundModalHeader: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundModalFooter: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundToolbar: ${baseTheme.surfaceHeader} !important;
            --lwc-colorBackgroundPopover: ${baseTheme.surface} !important;
            --lwc-colorBackgroundToast: ${baseTheme.surface} !important;
            --lwc-colorBackgroundHighlight: ${accentTint} !important;

            --lwc-colorBorder: ${baseTheme.border} !important;
            --lwc-colorBorderSeparator: ${baseTheme.border} !important;
            --lwc-colorBorderCard: ${baseTheme.border} !important;
            --lwc-colorBorderInput: ${baseTheme.border} !important;
            --lwc-colorBorderButtonDefault: ${baseTheme.border} !important;

            --lwc-colorTextDefault: ${baseTheme.text} !important;
            --lwc-colorTextLabel: ${baseTheme.textMuted} !important;
            --lwc-colorTextWeak: ${baseTheme.textMuted} !important;
            --lwc-colorTextPlaceholder: ${baseTheme.textMuted} !important;
            --lwc-colorTextLink: ${accent} !important;
            --lwc-brandAccessible: ${accent} !important;
            --lwc-brandAccessibleActive: ${accent} !important;
            --lwc-brandTextLink: ${accent} !important;
            --slds-s-navigation-color-background-active: ${baseTheme.surface} !important;
            --slds-s-navigation-color-active: ${accent} !important;
            --lwc-colorTextIconDefault: ${baseTheme.textMuted} !important;
            --lwc-colorTextButtonDefault: ${baseTheme.text} !important;
            --slds-c-output-text-color: ${baseTheme.text} !important;

            /* SLDS Component Design Tokens */
            --slds-c-card-color-background: ${baseTheme.surface} !important;
            --slds-c-card-header-color-background: ${baseTheme.surface} !important;
            --slds-c-card-footer-color-background: ${baseTheme.surface} !important;
            --slds-c-card-text-color: ${baseTheme.text} !important;
            --slds-c-card-color-border: ${baseTheme.border} !important;

            --slds-c-page-header-color-background: ${baseTheme.surface} !important;
            --slds-c-page-header-text-color: ${baseTheme.text} !important;
            --slds-c-page-header-color-border: ${baseTheme.border} !important;

            --slds-c-modal-color-background: ${baseTheme.surface} !important;
            --slds-c-modal-header-color-background: ${baseTheme.surfaceHeader} !important;
            --slds-c-modal-footer-color-background: ${baseTheme.surfaceHeader} !important;
            --slds-c-modal-text-color: ${baseTheme.text} !important;

            --slds-c-input-color-background: ${baseTheme.bg} !important;
            --slds-c-input-text-color: ${baseTheme.text} !important;
            --slds-c-input-color-border: ${baseTheme.border} !important;

            --slds-c-tile-color-background: ${baseTheme.surface} !important;
            --slds-c-tile-color-border: ${baseTheme.border} !important;

            /* SLDS Surface, Panel, Illustration & Search Design Tokens */
            --slds-g-color-surface-container: ${baseTheme.surface} !important;
            --slds-g-color-surface-container-screen: ${baseTheme.surface} !important;
            --slds-g-color-surface-container-low: ${baseTheme.surface} !important;
            --slds-g-color-surface-container-lowest: ${baseTheme.surface} !important;
            --slds-g-color-surface-container-high: ${baseTheme.surfaceHeader} !important;
            --slds-g-color-surface-container-highest: ${baseTheme.surfaceHeader} !important;
            --slds-g-color-surface-base: ${baseTheme.surface} !important;
            --slds-g-color-surface-base-alt: ${baseTheme.surfaceHeader} !important;
            --slds-c-illustration-color-background: ${baseTheme.surface} !important;
            --slds-c-panel-color-background: ${baseTheme.surface} !important;
            --slds-c-empty-state-color-background: ${baseTheme.surface} !important;
            --slds-c-split-view-color-background: ${baseTheme.surface} !important;
            --slds-c-popover-color-background: ${baseTheme.surface} !important;
            --slds-c-combobox-color-background: ${baseTheme.bg} !important;
            --slds-c-listbox-color-background: ${baseTheme.surface} !important;
            --slds-c-listbox-item-color-background-hover: ${hoverBg} !important;
            --slds-c-listbox-item-color-background-focus: ${hoverBg} !important;
            --slds-c-listbox-option-color-background-hover: ${hoverBg} !important;
            --slds-c-listbox-option-color-background-focus: ${hoverBg} !important;
            --slds-c-listbox-item-color-background-active: ${hoverBg} !important;
            --lwc-colorBackgroundRowHover: ${hoverBg} !important;
            --lwc-colorBackgroundRowSelected: ${hoverBg} !important;

            --slds-c-accordion-color-background: ${baseTheme.surface} !important;
            --slds-c-accordion-header-color-background: ${baseTheme.surface} !important;

            --slds-c-tabs-item-color-background: ${baseTheme.surface} !important;
            --slds-c-tabs-content-color-background: ${baseTheme.surface} !important;

            --slds-c-button-neutral-color-background: ${baseTheme.surface} !important;
            --slds-c-button-neutral-color-border: ${baseTheme.border} !important;
            --slds-c-button-neutral-text-color: ${baseTheme.text} !important;

            --slds-c-pill-color-background: ${baseTheme.surfaceHeader} !important;
            --slds-c-pill-color-border: ${baseTheme.border} !important;
            --slds-c-pill-text-color: ${baseTheme.text} !important;

            --sf-qv-bg: ${baseTheme.surface} !important;
            --sf-qv-border: ${baseTheme.border} !important;
            --sf-qv-text: ${baseTheme.text} !important;
            --sf-qv-muted: ${baseTheme.textMuted} !important;
            --sf-qv-hover: ${baseTheme.surfaceHeader} !important;
            --sf-pinned-tab-hover-bg: ${baseTheme.surface} !important;
            --sf-nav-divider-color: ${baseTheme.border} !important;
          }

          /* Universal Themed Scrollbars (Firefox & WebKit) */
          * {
            scrollbar-color: ${baseTheme.border} ${baseTheme.surfaceHeader} !important;
            scrollbar-width: thin !important;
          }
          ::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
            background-color: ${baseTheme.surfaceHeader} !important;
          }
          ::-webkit-scrollbar-track {
            background-color: ${baseTheme.surfaceHeader} !important;
          }
          ::-webkit-scrollbar-thumb {
            background-color: ${baseTheme.border} !important;
            border-radius: 4px !important;
          }
          ::-webkit-scrollbar-thumb:hover {
            background-color: ${baseTheme.textMuted} !important;
          }
          ::-webkit-scrollbar-corner {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Global Canvas & Workspace Background */
          html, body,
          .desktop,
          .oneAlohaPage,
          .alohaPage,
          .oneWorkspace,
          .oneContent,
          .center.oneCenterStage,
          .flexipageBase,
          .flexipageComponent,
          .flexipagePage,
          .flexipageRoot,
          .navexWorkspaceManager,
          .navexConsoleTabContainer,
          .oneConsoleTabContainer,
          div[class*="viewport"],
          .slds-template__container,
          .viewport {
            background-color: ${baseTheme.bg} !important;
            color: ${baseTheme.text} !important;
          }

          /* Global Header (Search bar, setup gear, bell, profile) */
          header.slds-global-header,
          .slds-global-header {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Standard App Navigation Context Bar */
          one-app-nav-bar,
          one-app-nav-bar .slds-context-bar,
          nav.slds-context-bar,
          .slds-context-bar {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          /* Lightning Console Workspace Tab Header shares surfaceHeader with the tab strip */
          .tabsetHeader.slds-context-bar,
          .slds-context-bar.slds-context-bar_tabs,
          .tabsetHeader.slds-context-bar > .slds-context-bar__primary,
          .slds-context-bar.slds-context-bar_tabs > .slds-context-bar__primary {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          one-app-nav-bar .slds-context-bar__item,
          one-app-nav-bar .slds-context-bar__item a,
          .slds-context-bar__item a {
            color: ${baseTheme.text} !important;
          }
          one-app-nav-bar .slds-context-bar__item:hover,
          one-app-nav-bar .slds-context-bar__item.slds-is-active {
            background-color: ${baseTheme.surfaceHeader} !important;
          }
          one-app-nav-bar .slds-context-bar__icon-action,
          one-app-nav-bar .slds-context-bar__dropdown-trigger,
          one-app-nav-bar .slds-button:not(.slds-dropdown *) {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
          }

          /* Console Workspace Tabs (Outer Tab Bar) Container */
          .oneWorkspaceNavigationTabs,
          .navexWorkspaceManager,
          .navexConsoleTabContainer,
          .navexConsoleTabContainer ul.tabBarItems,
          .tabBarContainer,
          .oneConsoleTabContainer {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Unfocused / Inactive Workspace Tabs */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem,
          .tabBarContainer ul.tabBarItems > li.tabItem,
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem:not(.slds-is-active):not(.active),
          .tabBarContainer ul.tabBarItems > li.tabItem:not(.slds-is-active):not(.active) {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.textMuted} !important;
            border-right: 1px solid ${baseTheme.border} !important;
            border-left: none !important;
            border-top: none !important;
            border-bottom: none !important;
          }

          /* Unfocused Workspace Tabs Hover */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem:not(.slds-is-active):not(.active):hover,
          .tabBarContainer ul.tabBarItems > li.tabItem:not(.slds-is-active):not(.active):hover {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
          }

          /* Focused / Active Workspace Tab */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem.slds-is-active,
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem.active,
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem.slds-has-focus,
          .tabBarContainer ul.tabBarItems > li.tabItem.slds-is-active,
          .tabBarContainer ul.tabBarItems > li.tabItem.active,
          .tabBarContainer ul.tabBarItems > li.tabItem.slds-has-focus {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-right: 1px solid ${baseTheme.border} !important;
            border-top: none !important;
            border-bottom: none !important;
          }

          /* Subtabs (Inner Tabs) Container */
          .subtabContainer,
          .slds-sub-tabs,
          ul.subtabs {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Unfocused / Inactive Subtabs */
          ul.subtabs > li.tabItem,
          .subtabs li.tabItem,
          .slds-sub-tabs__item,
          ul.subtabs > li.tabItem:not(.slds-is-active):not(.active),
          .subtabs li.tabItem:not(.slds-is-active):not(.active),
          .slds-sub-tabs__item:not(.slds-is-active) {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.textMuted} !important;
            border-right: 1px solid ${baseTheme.border} !important;
            border-top: none !important;
            border-bottom: none !important;
          }

          /* Unfocused Subtabs Hover */
          ul.subtabs > li.tabItem:not(.slds-is-active):not(.active):hover,
          .subtabs li.tabItem:not(.slds-is-active):not(.active):hover,
          .slds-sub-tabs__item:not(.slds-is-active):hover {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
          }

          /* Focused / Active Subtab */
          ul.subtabs > li.tabItem.slds-is-active,
          ul.subtabs > li.tabItem.active,
          ul.subtabs > li.tabItem.slds-has-focus,
          .subtabs li.tabItem.slds-is-active,
          .slds-sub-tabs__item.slds-is-active {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-right: 1px solid ${baseTheme.border} !important;
            border-top: none !important;
            border-bottom: none !important;
          }

          /* Transparent backgrounds for tab chrome elements ONLY (never wipe nested .slds-dropdown / .slds-popover / [role="menu"] panels) */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .tabBarContainer ul.tabBarItems > li.tabItem *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          ul.subtabs > li.tabItem *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .subtabs li.tabItem *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .slds-sub-tabs__item *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .tabItem a.tabHeader,
          .tabItem .tabHeader,
          .tabItem .slds-context-bar__label-action,
          .tabItem .slds-context-bar__icon-action,
          .tabItem .slds-context-bar__button-action,
          .tabItem .slds-context-bar__dropdown-trigger,
          .tabItem .tabAction,
          .tabItem .close,
          .tabItem .title,
          .tabItem .tabText,
          .tabItem a:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]),
          .tabItem span:not(.slds-dropdown *):not(.slds-popover *):not([role="menu"] *),
          .tabItem button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]),
          .tabItem lightning-button-icon,
          .tabItem lightning-primitive-icon,
          .tabBarContainer .slds-button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]),
          .slds-sub-tabs__item a:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]),
          .slds-sub-tabs__item .slds-context-bar__label-action,
          .slds-sub-tabs__item .slds-context-bar__icon-action,
          .slds-sub-tabs__item .slds-context-bar__button-action,
          .slds-sub-tabs__item button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]),
          .slds-sub-tabs__item span:not(.slds-dropdown *):not(.slds-popover *):not([role="menu"] *) {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Ensure hover on tab preserves inner chrome transparency without clearing dropdown menus */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem:hover *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .tabBarContainer ul.tabBarItems > li.tabItem:hover *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          ul.subtabs > li.tabItem:hover *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .subtabs li.tabItem:hover *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *),
          .slds-sub-tabs__item:hover *:not(.slds-dropdown):not(.slds-dropdown *):not(.slds-popover):not(.slds-popover *):not([role="menu"]):not([role="menu"] *):not(.uiMenuList):not(.uiMenuList *) {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Text colors inside tabs */
          .tabItem:not(.slds-is-active):not(.active) a:not(.slds-dropdown *):not([role="menuitem"]),
          .tabItem:not(.slds-is-active):not(.active) .slds-truncate:not(.slds-dropdown *):not([role="menuitem"] *),
          .slds-sub-tabs__item:not(.slds-is-active) a:not(.slds-dropdown *):not([role="menuitem"]),
          .slds-sub-tabs__item:not(.slds-is-active) .slds-truncate:not(.slds-dropdown *):not([role="menuitem"] *) {
            color: ${baseTheme.textMuted} !important;
          }
          .tabItem.slds-is-active a:not(.slds-dropdown *):not([role="menuitem"]),
          .tabItem.slds-is-active .slds-truncate:not(.slds-dropdown *):not([role="menuitem"] *),
          .tabItem.active a:not(.slds-dropdown *):not([role="menuitem"]),
          .tabItem.active .slds-truncate:not(.slds-dropdown *):not([role="menuitem"] *),
          .slds-sub-tabs__item.slds-is-active a:not(.slds-dropdown *):not([role="menuitem"]),
          .slds-sub-tabs__item.slds-is-active .slds-truncate:not(.slds-dropdown *):not([role="menuitem"] *) {
            color: ${baseTheme.text} !important;
          }

          /* Dropdown arrow and close x SVG icons inside tabs */
          .tabItem svg,
          .tabItem .slds-button__icon,
          .slds-sub-tabs__item svg,
          .slds-sub-tabs__item .slds-button__icon {
            fill: currentColor !important;
            color: inherit !important;
          }
          .tabItem:not(.slds-is-active):not(.active) svg,
          .tabItem:not(.slds-is-active):not(.active) .slds-button__icon,
          .slds-sub-tabs__item:not(.slds-is-active) svg,
          .slds-sub-tabs__item:not(.slds-is-active) .slds-button__icon {
            fill: ${baseTheme.textMuted} !important;
            color: ${baseTheme.textMuted} !important;
          }
          .tabItem.slds-is-active svg,
          .tabItem.slds-is-active .slds-button__icon,
          .tabItem.active svg,
          .tabItem.active .slds-button__icon,
          .slds-sub-tabs__item.slds-is-active svg,
          .slds-sub-tabs__item.slds-is-active .slds-button__icon {
            fill: ${baseTheme.text} !important;
            color: ${baseTheme.text} !important;
          }

          /* Hover on tab action buttons (dropdown arrow and close x button) */
          .tabItem button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover,
          .tabItem button.slds-button_icon:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover,
          .tabItem .slds-context-bar__button-action:hover,
          .tabItem .close:hover,
          .slds-sub-tabs__item button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover {
            background-color: ${accentTint} !important;
            color: ${accent} !important;
            border-radius: 4px !important;
          }
          .tabItem button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover svg,
          .tabItem .close:hover svg,
          .tabItem button.slds-button_icon:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover .slds-button__icon {
            fill: ${accent} !important;
            color: ${accent} !important;
          }

          /* Quick Views List View Dropdown Section & Bar */
          .sf-quick-views-wrapper,
          .sf-quick-views-wrapper:hover,
          .sf-quick-views-wrapper:focus,
          .sf-quick-views-wrapper:focus-within,
          .sf-quick-header-row,
          .sf-quick-header-row:hover,
          .sf-quick-list,
          .sf-quick-list:hover {
            background: ${baseTheme.surface} !important;
            background-color: ${baseTheme.surface} !important;
            border-color: ${baseTheme.border} !important;
            color: ${baseTheme.text} !important;
          }
          .sf-quick-item {
            background: ${baseTheme.surface} !important;
            background-color: ${baseTheme.surface} !important;
            border-color: ${baseTheme.border} !important;
            color: ${baseTheme.text} !important;
          }
          .sf-quick-views-wrapper {
            border-bottom: 1px solid ${baseTheme.border} !important;
          }
          .sf-quick-header-title,
          .sf-quick-count,
          .sf-quick-control-btn {
            color: ${baseTheme.textMuted} !important;
          }
          .sf-quick-item-label {
            color: ${baseTheme.text} !important;
          }
          .sf-quick-item:hover,
          .sf-quick-item.slds-is-selected {
            background: ${baseTheme.surfaceHeader} !important;
            background-color: ${baseTheme.surfaceHeader} !important;
          }
          .sf-quick-item.slds-is-selected .sf-quick-item-label {
            color: ${baseTheme.text} !important;
          }
          .sf-quick-control-btn:hover {
            background: ${baseTheme.surfaceHeader} !important;
            color: ${accent} !important;
          }

          /* Cards, Record Sections & Layouts */
          .slds-card,
          article.slds-card,
          .slds-card__header,
          .slds-card__body,
          .slds-card__footer,
          .forceRelatedListCardHeader,
          .forceRelatedListPreviewGrid,
          .slds-box,
          .slds-box_small,
          .slds-box_x-small,
          .slds-panel,
          .slds-panel__body,
          .slds-panel__header,
          records-record-layout-base,
          records-record-layout-section,
          records-highlights-details-item,
          records-record-layout-item,
          force-record-layout-base,
          force-record-layout-section {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Page Headers & Record Highlights Panels */
          .slds-page-header,
          header.slds-page-header,
          .slds-page-header_record-home,
          .slds-page-header_object-home,
          .slds-page-header__detail-row,
          .pageHeader,
          records-highlights2,
          force-highlights2,
          records-record-highlights2 {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Tabs & Tab Content */
          .slds-tabs_default__content,
          .slds-tabs_scoped__content,
          .tabContent,
          .slds-tabs_default__nav,
          .slds-tabs_scoped__nav,
          ul.slds-tabs_default__nav,
          ul.slds-tabs_scoped__nav {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          .slds-tabs_default__item.slds-is-active a,
          .slds-tabs_scoped__item.slds-is-active a,
          .slds-tabs_default__item a,
          .slds-tabs_scoped__item a {
            color: ${baseTheme.text} !important;
          }

          /* Publisher, Quick Actions & Action Tabs (Update, Email, Close, Post, etc.) */
          .slds-tabs_card,
          .slds-tabs_card__nav,
          .slds-tabs_card__item,
          .slds-tabs_card__link,
          .slds-tabs_card__content,
          .tabs__nav:not(.slds-path__nav),
          ul.tabs__nav:not(.slds-path__nav),
          .tabs__nav:not(.slds-path__nav) > li.tabHeader:not(.slds-path__item),
          .tabs__nav:not(.slds-path__nav) > li.tabItem:not(.slds-path__item),
          .cuf-publisher .tabHeader:not(.slds-path__item),
          .cuf-publisher .tabItem:not(.slds-path__item),
          .uiTabset,
          .uiTab,
          .uiTabHeader,
          .cuf-publisher,
          .cuf-publisherWrapper,
          .cuf-scrollerInside,
          .cuf-content,
          .cuf-scroller,
          .cuf-feedItemContainer,
          .publisherContainer,
          .oneQuickActionContainer,
          .quickActionContainer,
          .quickActionPanel,
          .forceDetailPanel,
          .forcePageBlock,
          .forcePageBlockSection,
          .forcePageBlockSectionRow,
          .forcePageBlockItem,
          .forceChatterPublisher,
          .forceChatterPublisherQuickActions,
          .forceChatterPublisherTextArea,
          .forceChatterPublisherCollapsedState,
          .cuf-publisherPlaceholder,
          .cuf-collapsedContent,
          .dummyTextArea,
          .cuf-publisherTextArea,
          .cuf-publisherCollapsed,
          .cuf-placeholder,
          .cuf-publisherContainer,
          .cuf-editorWrapper,
          .modal-body,
          .actionBody,
          .actionsContainer,
          .slds-form,
          .slds-form_stacked,
          .slds-form_horizontal,
          .slds-form-element,
          .slds-form-element__control,
          records-record-edit-form,
          lightning-record-edit-form,
          lightning-record-form,
          records-base-record-form,
          records-lwc-record-layout,
          records-form-footer,
          .slds-docked-form-footer,
          .bottomBar,
          .footerBackground,
          .cuf-publisherShareButton,
          .cuf-publisherAttachment,
          runtime_platform_actionsQuickActionWrapper {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          .slds-tabs_card__item.slds-is-active,
          .slds-tabs_card__item.slds-is-active .slds-tabs_card__link,
          .slds-tabs_default__item.slds-is-active,
          .slds-tabs_default__item.slds-is-active .slds-tabs_default__link,
          .tabs__nav:not(.slds-path__nav) > li.tabHeader.active,
          .tabs__nav:not(.slds-path__nav) > li.tabHeader.slds-is-active,
          .tabs__nav:not(.slds-path__nav) > li.active,
          .tabs__nav:not(.slds-path__nav) > li.slds-is-active,
          .cuf-publisher .tabHeader.active:not(.slds-path__item),
          .cuf-publisher .tabHeader.slds-is-active:not(.slds-path__item) {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
          }

          .slds-tabs_card__item:not(.slds-is-active),
          .slds-tabs_default__item:not(.slds-is-active),
          .tabs__nav:not(.slds-path__nav) > li.tabHeader:not(.active),
          .tabs__nav:not(.slds-path__nav) > li:not(.active):not(.slds-is-active),
          .cuf-publisher .tabHeader:not(.active):not(.slds-path__item) {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.textMuted} !important;
          }

          .slds-tabs_card__item a,
          .slds-tabs_card__link,
          .slds-tabs_default__link,
          .tabs__nav:not(.slds-path__nav) a,
          .cuf-publisher .tabHeader a {
            color: ${baseTheme.text} !important;
          }

          /* Rich Text Editors, Quill & CKEditor inside Publishers */
          .slds-rich-text-editor,
          .slds-rich-text-editor__toolbar,
          .slds-rich-text-editor__textarea,
          .slds-rich-text-editor__content,
          .slds-rich-text-area__content,
          lightning-input-rich-text,
          lightning-rich-text-editor,
          .ql-toolbar,
          .ql-container,
          .ql-editor,
          .cke,
          .cke_inner,
          .cke_contents,
          .cke_top,
          .cke_bottom,
          .cke_reset,
          .cuf-ckeditor {
            background-color: ${baseTheme.bg} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          .slds-rich-text-editor__toolbar,
          .ql-toolbar,
          .cke_top {
            background-color: ${baseTheme.surfaceHeader} !important;
            border-bottom-color: ${baseTheme.border} !important;
          }

          .ql-snow .ql-stroke {
            stroke: ${baseTheme.text} !important;
          }
          .ql-snow .ql-fill {
            fill: ${baseTheme.text} !important;
          }
          .ql-snow .ql-picker {
            color: ${baseTheme.text} !important;
          }
          .ql-snow .ql-picker-options {
            background-color: ${baseTheme.surface} !important;
            border-color: ${baseTheme.border} !important;
            color: ${baseTheme.text} !important;
          }

          /* Docked Composers (Email, Log Call, etc.) */
          .slds-docked-composer,
          .slds-docked-composer__header,
          .slds-docked-composer__body,
          .slds-docked-composer__footer,
          .slds-docked-composer__toolbar,
          .dockedComposerContainer,
          lightning-docked-composer-panel {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          .slds-docked-composer__header {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Chatter Feed Filters & Filter Dropdown (All Updates, Text Posts, Status Changes, Private Answers, Emails, Community Answers, etc.) */
          .forceChatterFeedFilterHeader,
          .forceChatterFeedInnerFilter,
          .cuf-feedFilters,
          .feedFilterContainer,
          .feedFilterDropdown,
          .uiMenuList,
          .uiPopupMenuList,
          .popupMenu,
          .popupTargetContainer .uiMenuList,
          .popupTargetContainer .uiPopupMenuList,
          div[role="menu"],
          ul[role="menu"],
          .forceChatterFeedFilterHeader .slds-dropdown,
          .feedFilterDropdown .slds-dropdown,
          .cuf-feedFilters .slds-dropdown,
          .cuf-filterPill,
          .forceChatterFeedFilterPills,
          .slds-pill,
          .slds-pill_container {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          .cuf-filterPill,
          .slds-pill {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          .uiMenuItem,
          .uiMenuItem > a,
          .uiMenuItem > span,
          li[role="presentation"] > a[role="menuitem"],
          li[role="presentation"] > span[role="menuitem"],
          a[role="menuitem"],
          .forceChatterFeedFilterHeader .slds-dropdown__item,
          .forceChatterFeedFilterHeader .slds-dropdown__item > a,
          .feedFilterDropdown .slds-dropdown__item,
          .feedFilterDropdown .slds-dropdown__item > a,
          .cuf-feedFilters .slds-dropdown__item,
          .cuf-feedFilters .slds-dropdown__item > a,
          .slds-dropdown__item,
          .slds-dropdown__item > a,
          .slds-dropdown__item > a:hover,
          .slds-dropdown__item > a:focus,
          .slds-listbox__option,
          .slds-listbox__option:hover {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
          }

          .uiMenuItem:hover,
          .uiMenuItem > a:hover,
          .uiMenuItem.selected,
          .uiMenuItem.selected > a,
          li[role="presentation"]:hover > a[role="menuitem"],
          a[role="menuitem"]:hover,
          a[role="menuitem"]:focus,
          .forceChatterFeedFilterHeader .slds-dropdown__item:hover > a,
          .feedFilterDropdown .slds-dropdown__item:hover > a,
          .cuf-feedFilters .slds-dropdown__item:hover > a,
          .forceChatterFeedFilterHeader .slds-dropdown__item.slds-is-selected > a,
          .feedFilterDropdown .slds-dropdown__item.slds-is-selected > a,
          .slds-dropdown__item:hover > a,
          .slds-dropdown__item.slds-is-selected > a,
          .slds-listbox__option:hover,
          .slds-listbox__option.slds-is-selected {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${accent} !important;
          }

          /* Chatter Feed Items, Posts, and Comments */
          .slds-feed,
          .slds-feed__list,
          .slds-feed__item,
          .forceChatterFeed,
          .forceChatterFeedBody,
          .forceChatterFeedInnerWrapper,
          .forceChatterFeedDesktop,
          .forceChatterFeedItem,
          .cuf-feedItem,
          .forceChatterFeedItemBody,
          .cuf-feedItemBody,
          .slds-post,
          .slds-post__header,
          .slds-post__content,
          .slds-post__footer,
          .forceChatterFeedItemComments,
          .cuf-comment,
          .forceChatterComment,
          .slds-comment,
          .slds-comment__content,
          .forceChatterMessageSegment,
          .forceChatterFeedAuxBody,
          .forceChatterEntityShareAuxBody,
          .cuf-entitySharePost,
          .cuf-feedItemContainer,
          .cuf-feedItemAction,
          .cuf-feedItemComments {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          .forceChatterFeedItemComments,
          .forceChatterComment,
          .slds-comment,
          .cuf-comment {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          .slds-feed p,
          .slds-feed span,
          .forceChatterFeedItem p,
          .forceChatterFeedItem span,
          .slds-post p,
          .slds-post span,
          .cuf-feedItem p,
          .cuf-feedItem span {
            color: ${baseTheme.text};
          }

          /* Agentforce Recommendations & Einstein Panels */
          lightning-recommendation-panel,
          runtime_commerce_einstein,
          forceEinstein,
          einstein-recommendation-panel,
          runtime_sales_einstein,
          runtime_service_einstein,
          einstein-panel,
          .einstein-card,
          lightning-next-best-action,
          force-next-best-action,
          c-next-best-action,
          c-agentforce-recommendations,
          div[class*="recommendation" i],
          div[class*="agentforce" i],
          div[class*="einstein" i],
          article[class*="recommendation" i],
          article[class*="agentforce" i],
          article[class*="einstein" i],
          section[class*="recommendation" i],
          section[class*="agentforce" i],
          section[class*="einstein" i],
          .agentforce-recommendation-card,
          .runtime_platform_actionsEinsteinRecommendationsCard,
          .recommendation-card,
          .slds-tile,
          .slds-tile_board {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Search Knowledge - Whole Box, Container, and Card Header */
          .forceKnowledgeSearchBox,
          .knowledgeSearchBox,
          .knowledgeSearchBoxContainer,
          .searchKnowledge,
          .searchBoxContainer,
          knowledge-search-box,
          force-knowledge-search-box,
          runtime_service_knowledgeSearchBox,
          div[class*="knowledgeSearch" i],
          div[class*="KnowledgeSearch" i],
          div[class*="searchKnowledge" i],
          div[class*="SearchKnowledge" i],
          div[class*="knowledge-search" i],
          div[class*="search-knowledge" i],
          div[class*="knowledgeSearchBox" i],
          div[class*="KnowledgeSearchBox" i],
          div[class*="forceKnowledgeSearch" i],
          div[class*="forceKnowledgeSearchBox" i],
          div[class*="knowledge" i] .slds-combobox_container,
          div[class*="knowledge" i] .slds-combobox,
          div[class*="knowledge" i] .slds-combobox__form-element,
          div[class*="knowledge" i] .slds-input-has-icon,
          div[class*="knowledge" i] .slds-form-element,
          div[class*="knowledge" i] .slds-form-element__control,
          div[class*="Knowledge" i] .slds-combobox_container,
          div[class*="Knowledge" i] .slds-combobox,
          div[class*="Knowledge" i] .slds-combobox__form-element,
          div[class*="Knowledge" i] .slds-input-has-icon,
          div[class*="Knowledge" i] .slds-form-element,
          div[class*="Knowledge" i] .slds-form-element__control,
          article[class*="knowledge" i] .slds-card__header,
          article[class*="knowledge" i] .slds-combobox_container,
          article[class*="knowledge" i] .slds-combobox,
          article[class*="knowledge" i] .slds-combobox__form-element,
          article[class*="knowledge" i] .slds-input-has-icon,
          article[class*="knowledge" i] .slds-form-element,
          article[class*="knowledge" i] .slds-form-element__control,
          article[class*="Knowledge" i] .slds-card__header,
          article[class*="Knowledge" i] .slds-combobox_container,
          article[class*="Knowledge" i] .slds-combobox,
          article[class*="Knowledge" i] .slds-combobox__form-element,
          article[class*="Knowledge" i] .slds-input-has-icon,
          article[class*="Knowledge" i] .slds-form-element,
          article[class*="Knowledge" i] .slds-form-element__control,
          div:has(> input[placeholder*="Knowledge" i]),
          div:has(> * > input[placeholder*="Knowledge" i]),
          div:has(> * > * > input[placeholder*="Knowledge" i]),
          .slds-input-has-icon:has(input[placeholder*="Knowledge" i]),
          .slds-form-element__control:has(input[placeholder*="Knowledge" i]),
          .slds-form-element:has(input[placeholder*="Knowledge" i]),
          .slds-combobox:has(input[placeholder*="Knowledge" i]),
          .slds-combobox_container:has(input[placeholder*="Knowledge" i]),
          .slds-combobox__form-element:has(input[placeholder*="Knowledge" i]),
          lightning-grouped-combobox:has(input[placeholder*="Knowledge" i]),
          lightning-base-combobox:has(input[placeholder*="Knowledge" i]),
          lightning-input:has(input[placeholder*="Knowledge" i]),
          .slds-card__header:has(input[placeholder*="Knowledge" i]),
          header:has(input[placeholder*="Knowledge" i]),
          article:has(input[placeholder*="Knowledge" i]) .slds-card__header,
          div:has(> input[aria-label*="Knowledge" i]),
          div:has(> * > input[aria-label*="Knowledge" i]),
          .slds-input-has-icon:has(input[aria-label*="Knowledge" i]),
          .slds-form-element__control:has(input[aria-label*="Knowledge" i]),
          .slds-form-element:has(input[aria-label*="Knowledge" i]),
          .slds-combobox:has(input[aria-label*="Knowledge" i]),
          .slds-combobox_container:has(input[aria-label*="Knowledge" i]),
          .slds-combobox__form-element:has(input[aria-label*="Knowledge" i]) {
            background-color: ${baseTheme.surface} !important;
            background: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Search Knowledge Text Input (The entry field itself - matching the outer box) */
          input[placeholder*="Knowledge" i],
          input[aria-label*="Knowledge" i],
          input[title*="Knowledge" i],
          .forceKnowledgeSearchBox input,
          .knowledgeSearchBox input,
          div[class*="knowledge" i] input,
          div[class*="Knowledge" i] input,
          div[class*="knowledge" i] .slds-input,
          div[class*="Knowledge" i] .slds-input,
          div:has(> input[placeholder*="Knowledge" i]) input,
          .slds-combobox_container:has(input[placeholder*="Knowledge" i]) input {
            background-color: ${baseTheme.surface} !important;
            background: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          input[placeholder*="Knowledge" i]::placeholder,
          div[class*="knowledge" i] input::placeholder,
          div[class*="Knowledge" i] input::placeholder {
            color: ${baseTheme.textMuted} !important;
          }

          /* Search Knowledge Icons */
          .forceKnowledgeSearchBox svg,
          .knowledgeSearchBox svg,
          div[class*="knowledge" i] .slds-input__icon,
          div[class*="knowledge" i] .slds-input-has-icon svg,
          div[class*="Knowledge" i] .slds-input__icon,
          div[class*="Knowledge" i] .slds-input-has-icon svg,
          .slds-input-has-icon:has(input[placeholder*="Knowledge" i]) svg,
          .slds-input-has-icon:has(input[placeholder*="Knowledge" i]) .slds-input__icon {
            background: transparent !important;
            fill: ${baseTheme.textMuted} !important;
            stroke: ${baseTheme.textMuted} !important;
          }

          /* Suggested Articles & Knowledge Recommendations - Containers and Each Entry */
          knowledge-suggested-articles,
          lightning-suggested-articles,
          forceKnowledgeSuggestedArticles,
          forceKnowledgeArticleSuggestion,
          articles-suggested-articles,
          knowledge-article-suggestion-box,
          knowledge-article-suggestion,
          runtime_service_knowledgeSuggestedArticles,
          einsteinArticleRecommendations,
          .forceKnowledgeSuggestedArticles,
          .forceKnowledgeArticleSuggestionCard,
          .forceKnowledgeArticleSuggestionItem,
          .knowledgeArticleSuggestionItem,
          .knowledgeArticleItem,
          .suggestedArticleItem,
          .articleSuggestionItem,
          .knowledgeArticleCard,
          .suggested-article-item,
          .suggestedArticle,
          .articleItem,
          .articleSummary,
          .knowledgeSuggestedArticles,
          .suggestedArticles,
          .suggestedArticleItem,
          .suggested-articles-container,
          .suggested-article,
          .suggested-article-item,
          .knowledge-article-card,
          .knowledge-article-item,
          div[class*="suggestedArticle" i],
          div[class*="suggested-article" i],
          div[class*="suggested_article" i],
          div[class*="articleSuggestion" i],
          div[class*="article-suggestion" i],
          article[class*="suggested" i],
          article[class*="article" i],
          section[class*="suggested" i],
          /* Each individual entry within Suggested Articles / Knowledge */
          div[class*="knowledge" i] li,
          div[class*="Knowledge" i] li,
          div[class*="suggested" i] li,
          div[class*="Suggested" i] li,
          div[class*="article" i] li,
          div[class*="Article" i] li,
          div[class*="knowledge" i] .slds-item,
          div[class*="Knowledge" i] .slds-item,
          div[class*="suggested" i] .slds-item,
          div[class*="Suggested" i] .slds-item,
          div[class*="article" i] .slds-item,
          div[class*="Article" i] .slds-item,
          div[class*="knowledge" i] .slds-list__item,
          div[class*="Knowledge" i] .slds-list__item,
          div[class*="suggested" i] .slds-list__item,
          div[class*="Suggested" i] .slds-list__item,
          div[class*="article" i] .slds-list__item,
          div[class*="Article" i] .slds-list__item,
          div[class*="knowledge" i] .slds-tile,
          div[class*="Knowledge" i] .slds-tile,
          div[class*="suggested" i] .slds-tile,
          div[class*="Suggested" i] .slds-tile,
          div[class*="article" i] .slds-tile,
          div[class*="Article" i] .slds-tile,
          div[class*="knowledge" i] .slds-box,
          div[class*="Knowledge" i] .slds-box,
          div[class*="suggested" i] .slds-box,
          div[class*="Suggested" i] .slds-box,
          div[class*="article" i] .slds-box,
          div[class*="Article" i] .slds-box,
          div[class*="knowledge" i] article,
          div[class*="Knowledge" i] article,
          div[class*="suggested" i] article,
          div[class*="Suggested" i] article,
          div[class*="article" i] article,
          div[class*="Article" i] article,
          div[class*="knowledge" i] .slds-card,
          div[class*="Knowledge" i] .slds-card,
          div[class*="suggested" i] .slds-card,
          div[class*="Suggested" i] .slds-card,
          div[class*="article" i] .slds-card,
          div[class*="Article" i] .slds-card,
          div[class*="knowledge" i] .slds-media__body,
          div[class*="Knowledge" i] .slds-media__body,
          div[class*="suggested" i] .slds-media__body,
          div[class*="Suggested" i] .slds-media__body,
          div[class*="knowledge" i] .slds-media__figure,
          div[class*="suggested" i] .slds-media__figure {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Hover states on individual suggested article entries */
          .forceKnowledgeArticleSuggestionItem:hover,
          .knowledgeArticleSuggestionItem:hover,
          .knowledgeArticleItem:hover,
          .suggestedArticleItem:hover,
          .suggested-article-item:hover,
          div[class*="knowledge" i] li:hover,
          div[class*="Knowledge" i] li:hover,
          div[class*="suggested" i] li:hover,
          div[class*="Suggested" i] li:hover {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Article titles and links inside suggested articles */
          div[class*="knowledge" i] a,
          div[class*="Knowledge" i] a,
          div[class*="suggested" i] a,
          div[class*="Suggested" i] a,
          .forceKnowledgeArticleSuggestionItem a,
          .knowledgeArticleItem a,
          .articleSuggestionItem a,
          .suggestedArticleItem a {
            color: ${accent} !important;
          }

          /* Accordions, Activity Timelines & Detail Sections */
          .slds-accordion,
          .slds-accordion__section,
          .slds-accordion__summary-action,
          .slds-accordion__content,
          .slds-section,
          .slds-section__title,
          .slds-section__title-action,
          .slds-section__content,
          .test-id__section,
          .slds-timeline,
          .slds-timeline__item,
          .slds-timeline__actions,
          .slds-activity-timeline,
          .slds-timeline__item_expandable {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          .slds-accordion__summary-action:hover,
          .slds-section__title-action:hover {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Tables, Grid Rows & List Views */
          .slds-table,
          table.slds-table,
          .slds-table_bordered,
          .slds-table_edit,
          .uiVirtualDataTable,
          lightning-datatable,
          lightning-primitive-datatable {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          table.slds-table thead th,
          .slds-table thead th,
          table.slds-table th {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.textMuted} !important;
            border-color: ${baseTheme.border} !important;
          }
          table.slds-table tbody tr,
          table.slds-table tbody td,
          .slds-table tbody td {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          table.slds-table tbody tr:hover > td,
          table.slds-table tbody tr:hover > th,
          table.slds-table tbody tr.slds-is-selected > td {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Form Inputs, Dropdowns & Textareas */
          input.slds-input,
          textarea.slds-textarea,
          select.slds-select,
          .slds-combobox__input,
          .slds-input_faux,
          .slds-combobox {
            background-color: ${baseTheme.bg} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          input.slds-input::placeholder,
          textarea.slds-textarea::placeholder {
            color: ${baseTheme.textMuted} !important;
          }

          /* Modals, Popovers & Dropdown Menus */
          .slds-modal__container,
          .slds-modal__content,
          .slds-popover,
          .slds-popover__body,
          .slds-dropdown,
          .slds-dropdown-trigger_click .slds-dropdown,
          .slds-dropdown_fluid,
          .slds-dropdown_left,
          .slds-dropdown_right {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          .slds-modal__header,
          .slds-modal__footer,
          .slds-popover__header,
          .slds-popover__footer {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Global Search & Einstein Search Assistant (Left results pane, Right tips/guidance pane, and dialog) */
          force-search-assistant,
          force-search-assistant-layout,
          force-search-assistant-results,
          force-search-natural-language-help,
          force-search-instant-result-item,
          .forceSearchAssistant,
          .forceSearchAssistantLayout,
          .forceSearchAssistantDialog,
          .forceSearchInstantResults,
          .forceSearchGlobalSearch,
          .forceSearchNaturalLanguageHelp,
          .forceSearchAssistantNaturalLanguage,
          div[class*="searchAssistant" i],
          div[class*="SearchAssistant" i],
          div[class*="search-assistant" i],
          div[class*="assistantResults" i],
          div[class*="assistantPreview" i],
          div[class*="assistantTips" i],
          div[class*="assistantRight" i],
          div[class*="searchTips" i],
          div[class*="SearchTips" i],
          div[class*="searchHelp" i],
          div[class*="SearchHelp" i],
          div[class*="naturalLanguage" i],
          div[class*="NaturalLanguage" i],
          div[class*="doMoreWithSearch" i],
          div[class*="DoMoreWithSearch" i],
          div[class*="instantResult" i],
          div[class*="InstantResult" i],
          div[class*="search-preview" i],
          div[class*="search-tips" i],
          div[class*="search-results" i],
          div[class*="searchPreview" i],
          div[class*="searchResults" i],
          .search-results-pane,
          .search-preview-pane,
          .searchResultsPane,
          .searchPreviewPane,
          .slds-search-results,
          .slds-search-assistant,
          .results-pane,
          .preview-pane {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          force-search-assistant-results .slds-listbox,
          .forceSearchAssistantResults .slds-listbox,
          div[class*="searchAssistantResults" i] .slds-listbox,
          div[class*="searchAssistantResults" i] ul,
          div[class*="searchAssistantResults" i] li,
          div[class*="assistantResults" i] .slds-listbox,
          div[class*="assistantResults" i] li {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
          }

          force-search-assistant-results .slds-listbox__option:hover,
          force-search-assistant-results .slds-listbox__option.slds-has-focus,
          force-search-assistant-results .slds-listbox__option.slds-is-selected,
          .forceSearchAssistantResults .slds-listbox__option:hover,
          .forceSearchAssistantResults .slds-listbox__option.slds-has-focus,
          .forceSearchAssistantResults .slds-listbox__option.slds-is-selected,
          div[class*="searchAssistantResults" i] .slds-listbox__option:hover,
          div[class*="searchAssistantResults" i] .slds-listbox__option.slds-has-focus,
          div[class*="searchAssistantResults" i] .slds-listbox__option.slds-is-selected,
          div[class*="searchAssistantResults" i] li:hover,
          div[class*="assistantResults" i] li:hover {
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${baseTheme.text} !important;
          }

          force-search-natural-language-help *,
          div[class*="naturalLanguage" i] *,
          div[class*="searchTips" i] *,
          div[class*="doMoreWithSearch" i] * {
            border-color: ${baseTheme.border} !important;
          }

          force-search-natural-language-help .slds-text-heading_medium,
          force-search-natural-language-help .slds-text-heading_small,
          force-search-natural-language-help .slds-text-body_regular,
          force-search-natural-language-help .slds-text-body_small,
          force-search-natural-language-help p,
          force-search-natural-language-help span,
          force-search-natural-language-help h2,
          force-search-natural-language-help h3,
          div[class*="naturalLanguage" i] p,
          div[class*="naturalLanguage" i] span,
          div[class*="naturalLanguage" i] h2,
          div[class*="naturalLanguage" i] h3,
          div[class*="searchTips" i] p,
          div[class*="searchTips" i] span,
          div[class*="searchTips" i] h2,
          div[class*="searchTips" i] h3,
          div[class*="doMoreWithSearch" i] p,
          div[class*="doMoreWithSearch" i] span,
          div[class*="doMoreWithSearch" i] h2,
          div[class*="doMoreWithSearch" i] h3 {
            color: ${baseTheme.text} !important;
          }

          /* Override hardcoded SLDS default white surfaces on search & dialogs */
          .slds-theme_default,
          .slds-theme--default,
          .slds-theme_shade,
          .slds-theme--shade {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Illustrations & Empty States (like "Do more with Search!") */
          .slds-illustration,
          .slds-illustration_large,
          .slds-illustration_small,
          .slds-empty-state,
          .slds-empty-state__body,
          .slds-rich-text-editor__output,
          .slds-text-longform,
          .slds-box {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Universal selectors for Search Assistant, Einstein Search & Previews */
          search_assistant-assistant-dialog,
          search_assistant-content-container,
          search_assistant-instant-results-list,
          search_assistant-empty-state,
          search_assistant-preview,
          search_assistant-natural-language-preview,
          force-search-assistant,
          [class*="searchAssistant" i],
          [class*="SearchAssistant" i],
          [class*="search-assistant" i],
          [class*="instantResult" i],
          [class*="InstantResult" i],
          [class*="naturalLanguage" i],
          [class*="NaturalLanguage" i],
          [class*="searchTips" i],
          [class*="SearchTips" i],
          [class*="searchHelp" i],
          [class*="SearchHelp" i],
          [class*="doMoreWithSearch" i],
          [class*="DoMoreWithSearch" i],
          [class*="searchPreview" i],
          [class*="SearchPreview" i],
          [class*="search-preview" i],
          [class*="search-tips" i],
          [class*="search-results" i],
          [data-aura-class*="forceSearch" i],
          [data-aura-class*="searchAssistant" i] {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Left Pane Instant Results & Listbox */
          search_assistant-assistant-dialog .slds-listbox,
          search_assistant-assistant-dialog .slds-listbox_vertical,
          search_assistant-instant-results-list .slds-listbox,
          [class*="searchAssistant" i] .slds-listbox,
          [class*="searchAssistant" i] [role="listbox"],
          [class*="searchAssistant" i] ul {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          /* Items in Search Assistant */
          search_assistant-assistant-dialog [role="option"],
          search_assistant-instant-results-list [role="option"],
          search_assistant-assistant-dialog .slds-listbox__item,
          search_assistant-instant-results-list .slds-listbox__item,
          [class*="searchAssistant" i] .slds-listbox__item,
          [class*="searchAssistant" i] [role="option"] {
            background-color: transparent !important;
            color: ${baseTheme.text} !important;
          }

          /* Left Pane Search Result option hover/focus */
          search_assistant-assistant-dialog [role="option"]:hover,
          search_assistant-assistant-dialog [role="option"].slds-has-focus,
          search_assistant-assistant-dialog [role="option"].slds-is-selected,
          search_assistant-assistant-dialog [role="option"][aria-selected="true"],
          search_assistant-assistant-dialog .slds-listbox__option:hover,
          search_assistant-assistant-dialog .slds-listbox__option.slds-has-focus,
          search_assistant-assistant-dialog .slds-listbox__option.slds-is-selected,
          search_assistant-assistant-dialog .slds-listbox__item:hover,
          search_assistant-instant-results-list [role="option"]:hover,
          search_assistant-instant-results-list [role="option"].slds-has-focus,
          search_assistant-instant-results-list .slds-listbox__option:hover,
          search_assistant-instant-results-list .slds-listbox__option.slds-has-focus,
          search_assistant-instant-results-list .slds-listbox__item:hover,
          [class*="searchAssistant" i] [role="option"]:hover,
          [class*="searchAssistant" i] [role="option"].slds-has-focus,
          [class*="searchAssistant" i] [role="option"].slds-is-selected,
          [class*="searchAssistant" i] [role="option"][aria-selected="true"],
          [class*="searchAssistant" i] .slds-listbox__option:hover,
          [class*="searchAssistant" i] .slds-listbox__option.slds-has-focus,
          [class*="searchAssistant" i] .slds-listbox__option.slds-is-selected,
          [class*="searchAssistant" i] .slds-listbox__item:hover,
          [class*="instantResult" i]:hover,
          [class*="InstantResult" i]:hover,
          lightning-base-combobox-item:hover,
          force-search-instant-result-item:hover {
            background-color: ${hoverBg} !important;
            background: ${hoverBg} !important;
            color: ${baseTheme.text} !important;
          }

          search_assistant-assistant-dialog [role="option"]:hover *,
          search_assistant-assistant-dialog .slds-listbox__option:hover *,
          search_assistant-instant-results-list [role="option"]:hover *,
          [class*="searchAssistant" i] [role="option"]:hover *,
          [class*="searchAssistant" i] .slds-listbox__option:hover * {
            background-color: transparent !important;
            background: transparent !important;
            color: ${baseTheme.text} !important;
          }

          /* Right Pane: Complete surface coverage for guidance, previews & empty state columns */
          search_assistant-empty-state,
          search_assistant-empty-state *,
          search_assistant-preview,
          search_assistant-preview *,
          search_assistant-content-container,
          search_assistant-content-container .slds-col,
          search_assistant-content-container .slds-grid,
          [class*="searchAssistant" i] .slds-split-view__detail,
          [class*="searchAssistant" i] .slds-split-view__content,
          [class*="searchAssistant" i] .slds-modal__content,
          [class*="searchAssistant" i] .slds-col,
          [class*="searchAssistant" i] .slds-grow,
          [class*="searchAssistant" i] .slds-scrollable_y,
          [class*="searchAssistant" i] .slds-scrollable,
          [class*="searchAssistant" i] .slds-illustration,
          [class*="searchAssistant" i] .slds-empty-state,
          [class*="searchAssistant" i] .slds-box,
          [class*="searchAssistant" i] .slds-text-longform,
          [class*="searchAssistant" i] .slds-rich-text-editor__output,
          [class*="searchAssistant" i] div[class*="empty" i],
          [class*="searchAssistant" i] div[class*="preview" i],
          [class*="searchAssistant" i] div[class*="detail" i],
          [class*="searchAssistant" i] div[class*="right" i],
          [class*="searchAssistant" i] div[class*="guidance" i],
          [class*="searchAssistant" i] div[class*="tips" i] {
            background-color: ${baseTheme.surface} !important;
            background: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }

          [class*="searchAssistant" i] div,
          [class*="search-assistant" i] div,
          [class*="searchTips" i] div,
          [class*="naturalLanguage" i] div {
            border-color: ${baseTheme.border} !important;
          }

          [class*="searchAssistant" i] h1,
          [class*="searchAssistant" i] h2,
          [class*="searchAssistant" i] h3,
          [class*="searchAssistant" i] p,
          [class*="searchAssistant" i] span,
          [class*="searchAssistant" i] label {
            color: ${baseTheme.text} !important;
          }

          [class*="searchAssistant" i] a {
            color: ${accent} !important;
          }

          /* Buttons & Badges */
          button.slds-button_neutral,
          .slds-button_neutral,
          button.slds-button_icon-border,
          button.slds-button_icon-border-filled {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          button.slds-button_neutral:hover,
          .slds-button_neutral:hover,
          button.slds-button_icon-border:hover,
          button.slds-button_icon-border-filled:hover {
            background-color: ${baseTheme.surfaceHeader} !important;
          }
          button.slds-button_brand,
          .slds-button_brand {
            background-color: ${accent} !important;
            border-color: ${accent} !important;
            color: ${accentContrast} !important;
          }

          /* Split View Sidebars */
          .slds-split-view,
          .slds-split-view__list-item-action,
          .slds-split-view__header {
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border-color: ${baseTheme.border} !important;
          }
          .slds-split-view__list-item.slds-is-active .slds-split-view__list-item-action {
            background-color: ${baseTheme.surfaceHeader} !important;
          }

          /* Text, Labels & Links */
          .slds-form-element__label,
          .test-id__field-label,
          .slds-text-color_weak,
          .slds-text-body_small {
            color: ${baseTheme.textMuted} !important;
          }
          .slds-text-heading_small,
          .slds-text-heading_medium,
          .slds-text-heading_large,
          .slds-card__header-title,
          .slds-page-header__title,
          .slds-truncate {
            color: ${baseTheme.text} !important;
          }
          a:not(.slds-button):not(.slds-tabs_default__link):not(.slds-tabs_card__link):not(.slds-tabs_scoped__link):not(.tabItem a):not(.slds-path__link) {
            color: ${accent} !important;
          }

          /* Restore opaque themed surface on dropdown/action menus hosted inside workspace tabs, pinned tabs, subtabs & nav items */
          li.tabItem .slds-dropdown,
          li.tabItem .slds-popover,
          li.tabItem .uiMenuList,
          li.tabItem [role="menu"],
          .slds-sub-tabs__item .slds-dropdown,
          .slds-sub-tabs__item .slds-popover,
          .slds-sub-tabs__item .uiMenuList,
          .slds-sub-tabs__item [role="menu"],
          one-app-nav-bar .slds-context-bar__item .slds-dropdown,
          .slds-context-bar__item .slds-dropdown {
            background: ${baseTheme.surface} !important;
            background-color: ${baseTheme.surface} !important;
            color: ${baseTheme.text} !important;
            border: 1px solid ${baseTheme.border} !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
          }
          li.tabItem .slds-dropdown__list,
          .slds-sub-tabs__item .slds-dropdown__list {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          li.tabItem .slds-dropdown__item > a,
          li.tabItem .slds-dropdown__item > a *,
          li.tabItem .uiMenuItem > a,
          li.tabItem .uiMenuItem > a *,
          li.tabItem [role="menuitem"],
          li.tabItem [role="menuitem"] *,
          .slds-sub-tabs__item .slds-dropdown__item > a,
          .slds-sub-tabs__item .slds-dropdown__item > a *,
          .slds-sub-tabs__item .uiMenuItem > a,
          .slds-sub-tabs__item .uiMenuItem > a *,
          .slds-sub-tabs__item [role="menuitem"],
          .slds-sub-tabs__item [role="menuitem"] * {
            background-color: transparent !important;
            color: ${baseTheme.text} !important;
            border: none !important;
            box-shadow: none !important;
          }
          li.tabItem .slds-dropdown__item > a:hover,
          li.tabItem .slds-dropdown__item > a:focus,
          li.tabItem .slds-dropdown__item:hover > a,
          li.tabItem .uiMenuItem > a:hover,
          li.tabItem .uiMenuItem > a:focus,
          li.tabItem [role="menuitem"]:hover,
          li.tabItem [role="menuitem"]:focus,
          .slds-sub-tabs__item .slds-dropdown__item > a:hover,
          .slds-sub-tabs__item .slds-dropdown__item:hover > a,
          .slds-sub-tabs__item .uiMenuItem > a:hover,
          .slds-sub-tabs__item .uiMenuItem > a:focus,
          .slds-sub-tabs__item [role="menuitem"]:hover,
          .slds-sub-tabs__item [role="menuitem"]:focus {
            background: ${baseTheme.surfaceHeader} !important;
            background-color: ${baseTheme.surfaceHeader} !important;
            color: ${accent} !important;
          }
          li.tabItem .slds-dropdown__item > a:hover *,
          li.tabItem .slds-dropdown__item:hover > a *,
          li.tabItem .uiMenuItem > a:hover *,
          li.tabItem [role="menuitem"]:hover *,
          .slds-sub-tabs__item .slds-dropdown__item > a:hover *,
          .slds-sub-tabs__item .uiMenuItem > a:hover *,
          .slds-sub-tabs__item [role="menuitem"]:hover * {
            color: ${accent} !important;
            fill: ${accent} !important;
          }
          .tabItem button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover,
          .tabItem button.slds-button_icon:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover,
          .tabItem .slds-context-bar__button-action:hover,
          .tabItem .close:hover,
          .slds-sub-tabs__item button:not(.slds-dropdown *):not(.slds-popover *):not([role="menuitem"]):hover {
            background-color: ${accentTint} !important;
            color: ${accent} !important;
            border-radius: 4px !important;
          }
        `;
        if (isDark) {
          const includeSubframeCss = typeof isTopWindow !== 'undefined' ? !isTopWindow : false;
          css += generateDarkBodyTextCSS(baseTheme, accent, includeSubframeCss);
        }
      }

      css += `
        /* SAFETY: Case Progress Bar (SLDS Path stages) New -> Working -> Waiting -> Closed MUST retain native colors */
        lightning-path,
        .slds-path,
        .slds-path__container,
        .slds-path__nav,
        runtime_sales_pathassistant,
        records-path-assistant {
          background-color: transparent !important;
        }

        .slds-path__item,
        .slds-path__item *,
        .slds-path__link,
        .slds-path__stage,
        .slds-path__title,
        .slds-path__mark {
          border-top-color: inherit !important;
          border-bottom-color: inherit !important;
        }

        .slds-path__item.slds-is-complete,
        .slds-path__item.slds-is-complete .slds-path__link,
        .slds-path__item.slds-is-complete::before,
        .slds-path__item.slds-is-complete::after {
          background-color: #2e844a !important;
          border-left-color: #2e844a !important;
          color: #ffffff !important;
        }

        .slds-path__item.slds-is-current,
        .slds-path__item.slds-is-current .slds-path__link,
        .slds-path__item.slds-is-current::before,
        .slds-path__item.slds-is-current::after {
          background-color: #0176d3 !important;
          border-left-color: #0176d3 !important;
          color: #ffffff !important;
        }

        .slds-path__item.slds-is-incomplete,
        .slds-path__item.slds-is-incomplete .slds-path__link,
        .slds-path__item.slds-is-incomplete::before,
        .slds-path__item.slds-is-incomplete::after {
          background-color: #ecebea !important;
          border-left-color: #ecebea !important;
          color: #080707 !important;
        }

        .slds-path__item.slds-is-won,
        .slds-path__item.slds-is-won .slds-path__link,
        .slds-path__item.slds-is-won::before,
        .slds-path__item.slds-is-won::after {
          background-color: #2e844a !important;
          border-left-color: #2e844a !important;
          color: #ffffff !important;
        }

        .slds-path__item.slds-is-lost,
        .slds-path__item.slds-is-lost .slds-path__link,
        .slds-path__item.slds-is-lost::before,
        .slds-path__item.slds-is-lost::after {
          background-color: #c23934 !important;
          border-left-color: #c23934 !important;
          color: #ffffff !important;
        }

        .slds-path__item.slds-is-complete .slds-path__title,
        .slds-path__item.slds-is-current .slds-path__title,
        .slds-path__item.slds-is-won .slds-path__title,
        .slds-path__item.slds-is-lost .slds-path__title {
          color: #ffffff !important;
        }

        .slds-path__item.slds-is-incomplete .slds-path__title {
          color: #080707 !important;
        }

        /* ==========================================================================
           MESSAGING & CHAT BUBBLES (MessagingSession, Omni-Channel, Live Chat, SLDS Chat)
           Guarantees crystal-clear, high-contrast readable text across all dark and light themes
           ========================================================================== */
        .slds-chat,
        .slds-chat-list,
        .slds-chat-listitem,
        .slds-chat-message,
        .slds-chat-message__body,
        lightning-conversation-message,
        force-conversation-message {
          background-color: transparent !important;
        }

        /* Outbound messages (Sent by agent / bot) - colored bubble (Salesforce Blue) with crisp white text */
        .slds-chat-message__text_outbound,
        [class*="chat-message__text_outbound"],
        .slds-chat-listitem_outbound .slds-chat-message__text,
        [class*="chat-listitem_outbound"] [class*="chat-message__text"],
        lightning-conversation-message[data-direction="outbound"] .slds-chat-message__text,
        [data-message-direction="outbound"] .slds-chat-message__text,
        .slds-chat-message__text_outbound-agent,
        [class*="chat-message__text_outbound-agent"] {
          background-color: #0176d3 !important;
          background: #0176d3 !important;
          color: #ffffff !important;
          border: none !important;
        }

        .slds-chat-message__text_outbound,
        .slds-chat-message__text_outbound *,
        .slds-chat-message__text_outbound p,
        .slds-chat-message__text_outbound span,
        .slds-chat-message__text_outbound div,
        .slds-chat-message__text_outbound label,
        .slds-chat-message__text_outbound lightning-formatted-rich-text,
        .slds-chat-message__text_outbound [part="formatted-rich-text"],
        [class*="chat-message__text_outbound"] *,
        .slds-chat-listitem_outbound .slds-chat-message__text *,
        [class*="chat-listitem_outbound"] [class*="chat-message__text"] *,
        lightning-conversation-message[data-direction="outbound"] .slds-chat-message__text *,
        [data-message-direction="outbound"] .slds-chat-message__text *,
        .slds-chat-message__text_outbound-agent * {
          color: #ffffff !important;
        }

        .slds-chat-message__text_outbound a,
        .slds-chat-message__text_outbound a *,
        [class*="chat-message__text_outbound"] a {
          color: #ffffff !important;
          text-decoration: underline !important;
        }

        /* Inbound messages (Received from customer / visitor) */
        .slds-chat-message__text_inbound,
        [class*="chat-message__text_inbound"],
        .slds-chat-listitem_inbound .slds-chat-message__text,
        [class*="chat-listitem_inbound"] [class*="chat-message__text"],
        lightning-conversation-message[data-direction="inbound"] .slds-chat-message__text,
        [data-message-direction="inbound"] .slds-chat-message__text {
          background-color: ${isDark ? baseTheme.surfaceHeader : '#f3f3f3'} !important;
          background: ${isDark ? baseTheme.surfaceHeader : '#f3f3f3'} !important;
          color: ${isDark ? baseTheme.text : '#181818'} !important;
          border: ${isDark ? `1px solid ${baseTheme.border}` : '1px solid #e5e5e5'} !important;
        }

        .slds-chat-message__text_inbound,
        .slds-chat-message__text_inbound *,
        .slds-chat-message__text_inbound p,
        .slds-chat-message__text_inbound span,
        .slds-chat-message__text_inbound div,
        .slds-chat-message__text_inbound label,
        .slds-chat-message__text_inbound lightning-formatted-rich-text,
        .slds-chat-message__text_inbound [part="formatted-rich-text"],
        [class*="chat-message__text_inbound"] *,
        .slds-chat-listitem_inbound .slds-chat-message__text *,
        [class*="chat-listitem_inbound"] [class*="chat-message__text"] *,
        lightning-conversation-message[data-direction="inbound"] .slds-chat-message__text *,
        [data-message-direction="inbound"] .slds-chat-message__text * {
          color: ${isDark ? baseTheme.text : '#181818'} !important;
        }

        .slds-chat-message__text_inbound a,
        [class*="chat-message__text_inbound"] a {
          color: ${accent} !important;
          text-decoration: underline !important;
        }

        /* Agent Whisper / Supervisor Private Message / Internal Notes */
        .slds-chat-message__text_agent,
        [class*="chat-message__text_agent"],
        .slds-chat-message__text_whisper,
        [class*="chat-message__text_whisper"] {
          background-color: ${isDark ? '#3b2d54' : '#ece5fb'} !important;
          background: ${isDark ? '#3b2d54' : '#ece5fb'} !important;
          border: 1px solid ${isDark ? '#6b46c1' : '#c4b5fd'} !important;
          color: ${isDark ? '#f8f8f2' : '#321d5c'} !important;
        }
        .slds-chat-message__text_agent *,
        [class*="chat-message__text_agent"] *,
        .slds-chat-message__text_whisper *,
        [class*="chat-message__text_whisper"] * {
          color: ${isDark ? '#f8f8f2' : '#321d5c'} !important;
        }

        /* Delivery failure / alerts */
        .slds-chat-message__text_delivery-failure,
        [class*="chat-message__text_delivery-failure"] {
          background-color: #fedfe0 !important;
          background: #fedfe0 !important;
          border: 1px solid #ea001e !important;
          color: #ba0517 !important;
        }
        .slds-chat-message__text_delivery-failure * {
          color: #ba0517 !important;
        }

        /* Chat message metadata (Timestamps, Sender names, Status checkmarks) */
        .slds-chat-message__meta,
        .slds-chat-message__meta span,
        .slds-chat-message__meta time,
        [class*="chat-message__meta"],
        [class*="chat-message__meta"] * {
          color: ${baseTheme.textMuted} !important;
          background: transparent !important;
        }

        /* Chat events & divider bookends ("Agent accepted chat", "Transferred to Queue", timestamps) */
        .slds-chat-event,
        .slds-chat-event__body,
        .slds-chat-event__rule,
        .slds-chat-bookend,
        .slds-chat-bookend__item {
          background-color: transparent !important;
          color: ${baseTheme.textMuted} !important;
        }
        .slds-chat-event__body,
        .slds-chat-event__body * {
          color: ${baseTheme.textMuted} !important;
        }
      `;
      if (themeKey !== 'classic' && baseTheme) {
        css += generateCodeBlockCSS(baseTheme, accent);
      }
    }

    if (loadingUrl) {
      const loadingAnim = (settings.loadingImage && settings.loadingImage.rotate) ? 'sf-custom-spin 1.2s linear infinite' : 'none';
      css += `
        @keyframes sf-custom-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Category 1: Instant CSS replacement of native initial page load / splash mascot image tags */
        img[src*="astro" i],
        img[src*="codey" i],
        img[src*="einstein" i],
        img[src*="cloudy" i],
        img[src*="appy" i],
        img[src*="bear" i],
        img[src*="mascot" i],
        #auraLoadingBox img,
        .auraLoadingBox img,
        .splash img,
        .initial-loading img,
        .loadingBox img {
          content: url("${loadingUrl.replace(/"/g, '\\"')}") !important;
          object-fit: contain !important;
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          animation: ${loadingAnim} !important;
        }

        /* Category 1 & 4: Hide native splash spinner rings, mascot child elements, and dots */
        #auraLoadingBox .spinner,
        .auraLoadingBox .spinner,
        .loadingBox .spinner,
        .oneLoading .spinner,
        .forceDotsSpinner:not(.sf-loading-exempt) *,
        #auraLoadingBox .logo > *,
        .auraLoadingBox .logo > *,
        .auraMsgBox .logo > *,
        .loadingBox .logo > *,
        .oneLoading .logo > *,
        div[class*="loadingBox"] .logo > *,
        div[class*="oneLoading"] .logo > *,
        div[class*="splash"] .logo > * {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          animation: none !important;
        }

        /* Category 1: Instant replacement of initial page load / splash mascot container backgrounds */
        #auraLoadingBox .logo,
        .auraLoadingBox .logo,
        .auraMsgBox .logo,
        .loadingBox .logo,
        .oneLoading .logo,
        div[class*="loadingBox"] .logo,
        div[class*="oneLoading"] .logo,
        div[class*="mascot" i],
        div[class*="character" i],
        div[class*="splash" i] .logo,
        .initial-loading .logo,
        .splash .logo {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
          background-image: var(--sf-custom-loading-img) !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          width: 140px !important;
          height: 140px !important;
          margin: 0 auto 16px auto !important;
          animation: ${loadingAnim} !important;
        }

        /* Category 4: Replacement of background data-fetching dots (.forceDotsSpinner) */
        .forceDotsSpinner:not(.sf-loading-exempt) {
          background-image: var(--sf-custom-loading-img) !important;
          background-size: contain !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          border: none !important;
          animation: ${loadingAnim} !important;
          transform: none !important;
          width: var(--sf-custom-loading-size, 64px) !important;
          height: var(--sf-custom-loading-size, 64px) !important;
        }
      `;
    }

    styleEl.textContent = css;
    if (preloadStyle) preloadStyle.remove();

    if (lightOnly) {
      syncHomeIconNavContext();
      return;
    }

    if (themingEnabled && baseTheme && baseTheme.isDark) {
      syncStylesToAllShadowRoots(seqId);
      if (typeof syncStylesToSameOriginIframes === 'function') syncStylesToSameOriginIframes(seqId);
      themeSearchAssistantDOM(baseTheme, null, seqId);
    } else {
      removeAllShadowThemeStyles(seqId);
      if (typeof removeAllIframeThemeStyles === 'function') removeAllIframeThemeStyles(seqId);
      cleanupSearchAssistantDOM();
      cleanupThemeInlineStyles();
    }

    syncHomeIconNavContext();

    if (loadingUrl) {
      interceptAndReplaceMascot();
    }
  }

  function collectAllShadowRoots(root = document.documentElement) {
    if (!root) return;
    if (root.shadowRoot) {
      trackedShadowRoots.add(root.shadowRoot);
      observeShadowRoot(root.shadowRoot);
      collectAllShadowRoots(root.shadowRoot);
    }
    const children = root.children || [];
    for (let i = 0; i < children.length; i++) {
      collectAllShadowRoots(children[i]);
    }
  }

  function generateShadowThemeCSS(baseTheme, accent) {
    const isDark = !!baseTheme.isDark;
    const hoverBg = hexToRgba(accent, 0.18);
    return `
      :host {
        --slds-c-card-color-background: ${baseTheme.surface} !important;
        --slds-c-card-header-color-background: ${baseTheme.surface} !important;
        --slds-c-card-footer-color-background: ${baseTheme.surface} !important;
        --slds-g-color-surface-container: ${baseTheme.surface} !important;
        --slds-g-color-surface-container-screen: ${baseTheme.surface} !important;
        --slds-g-color-surface-container-low: ${baseTheme.surface} !important;
        --slds-g-color-surface-container-lowest: ${baseTheme.surface} !important;
        --slds-g-color-surface-container-high: ${baseTheme.surfaceHeader} !important;
        --slds-g-color-surface-container-highest: ${baseTheme.surfaceHeader} !important;
        --slds-g-color-surface-base: ${baseTheme.surface} !important;
        --slds-g-color-surface-base-alt: ${baseTheme.surfaceHeader} !important;
        --slds-c-illustration-color-background: ${baseTheme.surface} !important;
        --slds-c-panel-color-background: ${baseTheme.surface} !important;
        --slds-c-empty-state-color-background: ${baseTheme.surface} !important;
        --slds-c-split-view-color-background: ${baseTheme.surface} !important;
        --slds-c-popover-color-background: ${baseTheme.surface} !important;
        --slds-c-combobox-color-background: ${baseTheme.bg} !important;
        --slds-c-listbox-color-background: ${baseTheme.surface} !important;
        --slds-s-menu-item-color-background-active: ${hoverBg} !important;
        --lwc-colorBackgroundDark: ${hoverBg} !important;
        --lwc-colorBackgroundShade: ${baseTheme.surfaceHeader} !important;
        --slds-g-color-neutral-base-95: transparent !important;
        --slds-c-listbox-item-color-background-hover: ${hoverBg} !important;
        --slds-c-listbox-item-color-background-focus: ${hoverBg} !important;
        --slds-c-listbox-option-color-background-hover: ${hoverBg} !important;
        --slds-c-listbox-option-color-background-focus: ${hoverBg} !important;
        --slds-c-listbox-item-color-background-active: ${hoverBg} !important;
        --slds-c-listbox-item-color-background-selected: ${hoverBg} !important;
        --slds-c-listbox-option-color-background-selected: ${hoverBg} !important;
        --slds-g-color-surface-container-high-hover: ${hoverBg} !important;
        --slds-g-color-surface-container-highest-hover: ${hoverBg} !important;
        --slds-g-color-surface-hover: ${hoverBg} !important;
        --lwc-colorBackgroundRowHover: ${hoverBg} !important;
        --lwc-colorBackgroundRowSelected: ${hoverBg} !important;
        --lwc-colorBackgroundRowActive: ${hoverBg} !important;
        --slds-g-color-neutral-base-100: ${baseTheme.bg} !important;
        --slds-g-color-neutral-base-95: ${baseTheme.surface} !important;
        --slds-g-color-neutral-base-90: ${baseTheme.surfaceHeader} !important;
        --slds-g-color-neutral-base-80: ${baseTheme.border} !important;
        --slds-g-color-neutral-base-60: ${baseTheme.textMuted} !important;
        --slds-g-color-neutral-base-50: ${baseTheme.textMuted} !important;
        --slds-g-color-neutral-base-40: ${baseTheme.textMuted} !important;
        --slds-g-color-neutral-base-30: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-25: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-20: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-15: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-10: ${baseTheme.text} !important;
        --slds-g-color-on-surface-1: ${baseTheme.text} !important;
        --slds-g-color-on-surface-2: ${baseTheme.text} !important;
        --slds-g-color-on-surface-3: ${baseTheme.textMuted} !important;
        --lwc-colorTextDefault: ${baseTheme.text} !important;
        --lwc-colorTextLabel: ${baseTheme.textMuted} !important;
        --lwc-colorTextWeak: ${baseTheme.textMuted} !important;
        --lwc-colorTextPlaceholder: ${baseTheme.textMuted} !important;
        --lwc-colorTextLink: ${accent} !important;
        --lwc-brandAccessible: ${accent} !important;
        --lwc-brandAccessibleActive: ${accent} !important;
        --lwc-brandTextLink: ${accent} !important;
        --lwc-colorTextButtonDefault: ${baseTheme.text} !important;
        --slds-c-output-text-color: ${baseTheme.text} !important;
        --slds-c-card-text-color: ${baseTheme.text} !important;
        background-color: ${baseTheme.surface} !important;
        color: ${baseTheme.text} !important;
      }

      .slds-theme_default,
      .slds-theme--default,
      .slds-theme_shade,
      .slds-theme--shade,
      .slds-illustration,
      .slds-illustration_large,
      .slds-illustration_small,
      .slds-empty-state,
      .slds-box,
      .slds-card,
      search_dialog-assistant-dialog,
      search_dialog-instant-results-list,
      search_dialog-assistant-dialog-help-panel,
      search_dialog-instant-result-item,
      search_assistant-assistant-dialog,
      search_assistant-content-container,
      search_assistant-instant-results-list,
      search_assistant-empty-state,
      search_assistant-preview,
      .forceSearchAssistantDialog,
      [class*="searchAssistant" i],
      [class*="search-assistant" i],
      [class*="search_dialog" i],
      [class*="contentContainer" i],
      [class*="emptyState" i],
      [class*="preview" i],
      [class*="instantResult" i],
      [class*="instant-result" i],
      [class*="naturalLanguage" i],
      [class*="tips" i],
      [class*="results-list" i],
      [class*="split-view" i] {
        background-color: ${baseTheme.surface} !important;
        color: ${baseTheme.text} !important;
        border-color: ${baseTheme.border} !important;
      }

      /* Option hover inside shadow root - strictly :hover so it auto-reverts on unhover */
      :host(:hover),
      .slds-listbox__option:hover,
      .slds-listbox__item:hover,
      [role="option"]:hover,
      .instant-result-item:hover,
      search_dialog-instant-result-item:hover,
      search_assistant-instant-result-item:hover,
      lightning-base-combobox-item:hover,
      force-search-instant-result-item:hover {
        background-color: ${hoverBg} !important;
        background: ${hoverBg} !important;
        color: ${baseTheme.text} !important;
      }

      /* Child transparency inside hovered item so no opaque text backgrounds appear */
      :host(:hover) *,
      .slds-listbox__option:hover *,
      .slds-listbox__item:hover *,
      [role="option"]:hover *,
      .instant-result-item:hover *,
      search_dialog-instant-result-item:hover *,
      search_assistant-instant-result-item:hover *,
      lightning-base-combobox-item:hover *,
      force-search-instant-result-item:hover *,
      .data-match,
      span.data-match,
      [part="formatted-rich-text"],
      [part="formatted-rich-text"] *:not(pre):not(pre *):not(code):not(code *):not(button):not(.slds-button):not(.slds-badge):not(.slds-pill):not(mark),
      lightning-formatted-rich-text,
      lightning-formatted-rich-text *:not(pre):not(pre *):not(code):not(code *):not(button):not(.slds-button):not(.slds-badge):not(.slds-pill):not(mark) {
        background-color: transparent !important;
        background: transparent !important;
      }

      .data-match {
        color: ${accent} !important;
        font-weight: 700 !important;
        text-decoration: underline !important;
      }

      /* Right Pane complete surface inside shadow roots */
      search_dialog-assistant-dialog-help-panel,
      search_dialog-assistant-dialog-help-panel *,
      search_assistant-preview,
      search_assistant-preview *,
      search_assistant-empty-state,
      search_assistant-empty-state *,
      search_assistant-content-container,
      search_assistant-content-container *,
      .slds-split-view,
      .slds-split-view *,
      .slds-split-view__detail,
      .slds-split-view__content,
      .slds-modal__content,
      .slds-col,
      .slds-grow,
      .slds-scrollable_y,
      .slds-scrollable,
      .slds-illustration,
      .slds-empty-state,
      .slds-box,
      .slds-text-longform,
      .slds-rich-text-editor__output,
      div[class*="preview" i],
      div[class*="detail" i],
      div[class*="right" i],
      div[class*="guidance" i],
      div[class*="tips" i],
      div[class*="help" i],
      div[class*="empty" i] {
        background-color: ${baseTheme.surface} !important;
        background: ${baseTheme.surface} !important;
        color: ${baseTheme.text} !important;
        border-color: ${baseTheme.border} !important;
      }

      /* High-contrast Chat & Messaging Session bubbles inside shadow roots */
      .slds-chat-message__text_outbound,
      [class*="chat-message__text_outbound"],
      .slds-chat-listitem_outbound .slds-chat-message__text,
      [class*="chat-listitem_outbound"] [class*="chat-message__text"],
      lightning-conversation-message[data-direction="outbound"] .slds-chat-message__text,
      [data-message-direction="outbound"] .slds-chat-message__text,
      .slds-chat-message__text_outbound-agent,
      [class*="chat-message__text_outbound-agent"] {
        background-color: #0176d3 !important;
        background: #0176d3 !important;
        color: #ffffff !important;
        border: none !important;
      }

      .slds-chat-message__text_outbound,
      .slds-chat-message__text_outbound *,
      .slds-chat-message__text_outbound p,
      .slds-chat-message__text_outbound span,
      .slds-chat-message__text_outbound div,
      .slds-chat-message__text_outbound label,
      .slds-chat-message__text_outbound lightning-formatted-rich-text,
      .slds-chat-message__text_outbound [part="formatted-rich-text"],
      [class*="chat-message__text_outbound"] *,
      .slds-chat-listitem_outbound .slds-chat-message__text *,
      [class*="chat-listitem_outbound"] [class*="chat-message__text"] *,
      lightning-conversation-message[data-direction="outbound"] .slds-chat-message__text *,
      [data-message-direction="outbound"] .slds-chat-message__text *,
      .slds-chat-message__text_outbound-agent * {
        color: #ffffff !important;
      }

      .slds-chat-message__text_outbound a,
      .slds-chat-message__text_outbound a *,
      [class*="chat-message__text_outbound"] a {
        color: #ffffff !important;
        text-decoration: underline !important;
      }

      .slds-chat-message__text_inbound,
      [class*="chat-message__text_inbound"],
      .slds-chat-listitem_inbound .slds-chat-message__text,
      [class*="chat-listitem_inbound"] [class*="chat-message__text"],
      lightning-conversation-message[data-direction="inbound"] .slds-chat-message__text,
      [data-message-direction="inbound"] .slds-chat-message__text {
        background-color: ${isDark ? baseTheme.surfaceHeader : '#f3f3f3'} !important;
        background: ${isDark ? baseTheme.surfaceHeader : '#f3f3f3'} !important;
        color: ${isDark ? baseTheme.text : '#181818'} !important;
        border: ${isDark ? `1px solid ${baseTheme.border}` : '1px solid #e5e5e5'} !important;
      }

      .slds-chat-message__text_inbound,
      .slds-chat-message__text_inbound *,
      .slds-chat-message__text_inbound p,
      .slds-chat-message__text_inbound span,
      .slds-chat-message__text_inbound div,
      .slds-chat-message__text_inbound label,
      .slds-chat-message__text_inbound lightning-formatted-rich-text,
      .slds-chat-message__text_inbound [part="formatted-rich-text"],
      [class*="chat-message__text_inbound"] *,
      .slds-chat-listitem_inbound .slds-chat-message__text *,
      [class*="chat-listitem_inbound"] [class*="chat-message__text"] *,
      lightning-conversation-message[data-direction="inbound"] .slds-chat-message__text *,
      [data-message-direction="inbound"] .slds-chat-message__text * {
        color: ${isDark ? baseTheme.text : '#181818'} !important;
      }

      .slds-chat-message__text_inbound a,
      [class*="chat-message__text_inbound"] a {
        color: ${accent} !important;
        text-decoration: underline !important;
      }

      /* Agent Whisper / Supervisor Private Message */
      .slds-chat-message__text_agent,
      [class*="chat-message__text_agent"],
      .slds-chat-message__text_whisper,
      [class*="chat-message__text_whisper"] {
        background-color: ${isDark ? '#3b2d54' : '#ece5fb'} !important;
        background: ${isDark ? '#3b2d54' : '#ece5fb'} !important;
        border: 1px solid ${isDark ? '#6b46c1' : '#c4b5fd'} !important;
        color: ${isDark ? '#f8f8f2' : '#321d5c'} !important;
      }
      .slds-chat-message__text_agent *,
      [class*="chat-message__text_agent"] *,
      .slds-chat-message__text_whisper *,
      [class*="chat-message__text_whisper"] * {
        color: ${isDark ? '#f8f8f2' : '#321d5c'} !important;
      }

      .slds-chat-message__meta,
      .slds-chat-message__meta * {
        color: ${baseTheme.textMuted} !important;
      }

      [part="formatted-rich-text"],
      [part="formatted-rich-text"] *:not(a):not(a *):not(button):not(button *):not(.slds-button):not(.slds-button *):not(.slds-badge):not(.slds-badge *):not(.slds-pill):not(.slds-pill *):not([class*="chat-message"] *):not(pre):not(pre *):not(code):not(code *):not(.data-match),
      lightning-formatted-rich-text,
      lightning-formatted-rich-text *:not(a):not(a *):not(button):not(button *):not(.slds-button):not(.slds-button *):not(.slds-badge):not(.slds-badge *):not(.slds-pill):not(.slds-pill *):not([class*="chat-message"] *):not(pre):not(pre *):not(code):not(code *):not(.data-match),
      :is(h1, h2, h3, h4, h5, h6, p, span, label, div, li, ul, ol, dt, dd, dl, td, th, tr, table, caption, blockquote, strong, b, em, i, u, s, small, sub, sup, font, article, section):not(a):not(a *):not(button):not(button *):not(.slds-button):not(.slds-button *):not(.slds-badge):not(.slds-badge *):not(.slds-pill):not(.slds-pill *):not(.slds-path):not(.slds-path *):not(.slds-path__item):not(.slds-path__item *):not([class*="chat-message"]):not([class*="chat-message"] *):not(pre):not(pre *):not(code):not(code *):not(.slds-form-element__label):not(.slds-form-element__label *):not(.test-id__field-label):not(.test-id__field-label *):not(.slds-text-color_weak):not(.slds-text-body_small):not(.slds-chat-message__meta):not(.slds-chat-message__meta *):not(.data-match) {
        color: ${baseTheme.text} !important;
      }
      .slds-form-element__label,
      .test-id__field-label,
      .slds-text-color_weak,
      .slds-text-body_small {
        color: ${baseTheme.textMuted} !important;
      }
      a:not(.slds-button):not(.slds-pill__action):not(.slds-badge):not([class*="chat-message__text"] a):not(.slds-path__link) {
        color: ${accent} !important;
      }
      a:not(.slds-button):not(.slds-pill__action):not(.slds-badge):not([class*="chat-message__text"] a):not(.slds-path__link) *:not(svg):not(path) {
        color: inherit !important;
      }
      button.slds-button:not(.slds-button_brand):not(.slds-button--brand):not(.slds-button_neutral):not(.slds-button--neutral):not(.slds-button_destructive):not(.slds-button--destructive):not(.slds-button_text-destructive):not(.slds-button--text-destructive):not(.slds-button_success):not(.slds-button--success):not(.slds-button_outline-brand):not(.slds-button--outline-brand):not(.slds-button_inverse):not(.slds-button--inverse):not(.slds-button_icon):not(.slds-button--icon):not(.slds-button_icon-border):not(.slds-button--icon-border):not(.slds-button_icon-border-filled):not(.slds-button--icon-bare) {
        color: ${accent} !important;
      }
      .slds-button_neutral,
      button.slds-button_neutral {
        background-color: ${baseTheme.surface} !important;
        color: ${baseTheme.text} !important;
        border-color: ${baseTheme.border} !important;
      }

      /* App Launcher button horizontal centering inside shadow root */
      .slds-icon-waffle_container,
      button.slds-icon-waffle_container {
        margin: 0 auto !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .slds-icon-waffle {
        margin: 0 auto !important;
      }
      ${generateCodeBlockCSS(baseTheme, accent)}
    `;
  }

  function collectAllIframes(root = document, out = []) {
    if (!root || !root.querySelectorAll) return out;
    try {
      const frames = root.querySelectorAll('iframe');
      for (let i = 0; i < frames.length; i++) {
        out.push(frames[i]);
      }
    } catch (_) {}
    return out;
  }

  function generateIframeThemeCSS(baseTheme, accent) {
    if (!baseTheme || !baseTheme.isDark) return '';
    return `
      :root {
        --lwc-colorBackground: ${baseTheme.surface} !important;
        --lwc-colorBackgroundShade: ${baseTheme.surfaceHeader} !important;
        --lwc-colorBorder: ${baseTheme.border} !important;
        --lwc-colorTextDefault: ${baseTheme.text} !important;
        --lwc-colorTextWeak: ${baseTheme.textMuted} !important;
        --lwc-colorTextLink: ${accent} !important;
        --lwc-brandAccessible: ${accent} !important;
        --lwc-brandAccessibleActive: ${accent} !important;
        --lwc-brandTextLink: ${accent} !important;
        --slds-s-navigation-color-background-active: ${baseTheme.surface} !important;
        --slds-s-navigation-color-active: ${accent} !important;
        --slds-g-color-neutral-base-100: ${baseTheme.bg} !important;
        --slds-g-color-neutral-base-95: ${baseTheme.surface} !important;
        --slds-g-color-neutral-base-90: ${baseTheme.surfaceHeader} !important;
        --slds-g-color-neutral-base-80: ${baseTheme.border} !important;
        --slds-g-color-neutral-base-50: ${baseTheme.textMuted} !important;
        --slds-g-color-neutral-base-30: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-20: ${baseTheme.text} !important;
        --slds-g-color-neutral-base-10: ${baseTheme.text} !important;
      }
      ${generateDarkBodyTextCSS(baseTheme, accent, true)}
      ${generateCodeBlockCSS(baseTheme, accent)}
    `;
  }

  function syncStylesToShadowRoot(shadowRoot, cachedCss, themeSig) {
    if (!shadowRoot) return;
    const settings = getEnhancerSettings();
    const themingEnabled = settings?.modules?.theming === true;
    const themeKey = (settings?.theme && settings.theme.preset) || 'classic';
    const baseTheme = THEMES[themeKey] || THEMES['classic'];

    if (!themingEnabled || !baseTheme || !baseTheme.isDark) {
      try {
        const existing = shadowRoot.querySelectorAll ? shadowRoot.querySelectorAll('style[id*="sf-shadow-theme-style"]') : [];
        for (let i = 0; i < existing.length; i++) existing[i].remove();
      } catch (_) {}
      return;
    }
    const accent = (themeKey === 'custom' && settings.theme?.customAccent) ? sanitizeHexColor(settings.theme.customAccent) : baseTheme.accent;
    const sig = themeSig || `${themeKey}|${accent}|dark`;

    let style = shadowRoot.querySelector ? shadowRoot.querySelector('#sf-shadow-theme-style') : null;
    if (style && style.dataset.sfThemeSig === sig && style.isConnected) {
      return;
    }

    const existingStyles = shadowRoot.querySelectorAll ? shadowRoot.querySelectorAll('style[id*="sf-shadow-theme-style"]') : [];
    style = existingStyles[0] || null;
    for (let i = 1; i < existingStyles.length; i++) {
      try { existingStyles[i].remove(); } catch (_) {}
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'sf-shadow-theme-style';
      try {
        shadowRoot.appendChild(style);
      } catch (_) {}
    }

    if (style) {
      style.dataset.sfThemeSig = sig;
      style.textContent = cachedCss || generateShadowThemeCSS(baseTheme, accent);
    }
  }

  function syncStylesToIframe(iframe) {
    if (!iframe) return;
    if (!iframe._sfThemeLoadHooked) {
      iframe._sfThemeLoadHooked = true;
      try {
        iframe.addEventListener('load', () => {
          try { syncStylesToIframe(iframe); } catch (_) {}
        });
      } catch (_) {}
      setTimeout(() => {
        try { syncStylesToIframe(iframe); } catch (_) {}
      }, 250);
    }

    let fDoc;
    try {
      fDoc = iframe.contentDocument;
    } catch (_) {
      return;
    }
    if (!fDoc || (!fDoc.head && !fDoc.documentElement)) return;
    // Skip frames already managed by their own page-script.js instance
    if (fDoc.getElementById('sf-custom-appearance-style')) return;

    const settings = getEnhancerSettings();
    const themingEnabled = settings?.modules?.theming === true;
    const themeKey = (settings?.theme && settings.theme.preset) || 'classic';
    const baseTheme = THEMES[themeKey] || THEMES['classic'];
    const accent = (themeKey === 'custom' && settings.theme?.customAccent) ? sanitizeHexColor(settings.theme.customAccent) : baseTheme.accent;

    let style = fDoc.getElementById('sf-iframe-theme-style');
    if (!themingEnabled || !baseTheme || !baseTheme.isDark) {
      if (style) {
        try { style.remove(); } catch (_) {}
      }
      return;
    }

    const themeSig = `${themeKey}|${accent}`;
    if (style && style.dataset.sfThemeSig === themeSig && style.isConnected) return;

    if (!style) {
      style = fDoc.createElement('style');
      style.id = 'sf-iframe-theme-style';
      const parent = fDoc.head || fDoc.documentElement;
      if (parent) {
        try { parent.appendChild(style); } catch (_) {}
      }
    }
    if (style) {
      style.dataset.sfThemeSig = themeSig;
      style.textContent = generateIframeThemeCSS(baseTheme, accent);
    }
  }

  function syncStylesToSameOriginIframes(seqId) {
    if (seqId && seqId !== activeAppearanceSequence) return;
    const frames = collectAllIframes(document, []);
    if (typeof trackedShadowRoots !== 'undefined') {
      for (const sr of trackedShadowRoots) {
        if (seqId && seqId !== activeAppearanceSequence) return;
        collectAllIframes(sr, frames);
      }
    }
    for (let i = 0; i < frames.length; i++) {
      if (seqId && seqId !== activeAppearanceSequence) return;
      try {
        syncStylesToIframe(frames[i]);
      } catch (_) {}
    }
  }

  function removeAllIframeThemeStyles(seqId) {
    if (seqId && seqId !== activeAppearanceSequence) return;
    const frames = collectAllIframes(document, []);
    if (typeof trackedShadowRoots !== 'undefined') {
      for (const sr of trackedShadowRoots) {
        if (seqId && seqId !== activeAppearanceSequence) return;
        collectAllIframes(sr, frames);
      }
    }
    for (let i = 0; i < frames.length; i++) {
      if (seqId && seqId !== activeAppearanceSequence) return;
      try {
        const fDoc = frames[i].contentDocument;
        const style = fDoc && fDoc.getElementById('sf-iframe-theme-style');
        if (style) style.remove();
      } catch (_) {}
    }
  }

  function syncStylesToAllShadowRoots(seqId) {
    if (seqId && seqId !== activeAppearanceSequence) return;
    const settings = getEnhancerSettings();
    const themingEnabled = settings?.modules?.theming === true;
    const themeKey = (settings?.theme && settings.theme.preset) || 'classic';
    const baseTheme = THEMES[themeKey] || THEMES['classic'];

    if (!themingEnabled || !baseTheme || !baseTheme.isDark) {
      removeAllShadowThemeStyles(seqId);
      return;
    }

    const accent = (themeKey === 'custom' && settings.theme?.customAccent) ? sanitizeHexColor(settings.theme.customAccent) : baseTheme.accent;
    const sig = `${themeKey}|${accent}|dark`;
    const cachedCss = generateShadowThemeCSS(baseTheme, accent);

    collectAllShadowRoots();

    for (const sr of trackedShadowRoots) {
      if (seqId && seqId !== activeAppearanceSequence) return;
      try {
        if (!sr || sr.host?.isConnected === false) {
          trackedShadowRoots.delete(sr);
          continue;
        }
        syncStylesToShadowRoot(sr, cachedCss, sig);
      } catch (_) {}
    }
  }

  function removeAllShadowThemeStyles(seqId) {
    if (seqId && seqId !== activeAppearanceSequence) return;
    if (typeof trackedShadowRoots !== 'undefined') {
      for (const sr of trackedShadowRoots) {
        if (seqId && seqId !== activeAppearanceSequence) return;
        try {
          if (!sr || sr.host?.isConnected === false) {
            trackedShadowRoots.delete(sr);
            continue;
          }
          const styles = sr.querySelectorAll ? sr.querySelectorAll('style[id*="sf-shadow-theme-style"]') : [];
          for (let i = 0; i < styles.length; i++) styles[i].remove();
        } catch (_) {}
      }
    }
    try {
      const docStyles = document.querySelectorAll('style[id*="sf-shadow-theme-style"]');
      for (let i = 0; i < docStyles.length; i++) docStyles[i].remove();
    } catch (_) {}
  }

  function cleanupThemeInlineStyles() {
    function cleanTree(root) {
      if (!root) return;
      try {
        const themedEls = root.querySelectorAll ? root.querySelectorAll('[data-sf-theme-applied]') : [];
        for (let i = 0; i < themedEls.length; i++) {
          const el = themedEls[i];
          el.style.removeProperty('background-color');
          el.style.removeProperty('background');
          el.style.removeProperty('color');
          el.style.removeProperty('border-color');
          delete el.dataset.sfThemeApplied;
        }
      } catch (_) {}

      // Specifically check layout elements to ensure no lingering styles
      const layoutSelectors = '.desktop, .container, .viewport, .oneHeader, body, search_assistant-assistant-dialog, search_dialog-assistant-dialog, force-search-assistant, [role="dialog"]';
      try {
        const layoutEls = root.querySelectorAll ? root.querySelectorAll(layoutSelectors) : [];
        for (let i = 0; i < layoutEls.length; i++) {
          const el = layoutEls[i];
          if (el.style) {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('color');
            el.style.removeProperty('border-color');
            delete el.dataset.sfThemeApplied;
          }
        }
      } catch (_) {}
    }

    cleanTree(document);
    if (typeof trackedShadowRoots !== 'undefined') {
      for (const sr of trackedShadowRoots) {
        cleanTree(sr);
      }
    }
  }

  function cleanupSearchAssistantDOM() {
    cleanupThemeInlineStyles();
  }

  function syncQuickViewsStyleToRoot(root) {
    if (!root) return;
    const settings = getEnhancerSettings();
    const themingEnabled = settings?.modules?.theming === true;
    const themeKey = (settings?.theme && settings.theme.preset) || 'classic';
    const baseTheme = THEMES[themeKey] || THEMES['classic'];
    const accent = getEffectiveAccent(settings);
    const isDark = themingEnabled && !!baseTheme?.isDark;
    const qvBg = isDark ? baseTheme.surface : '#ffffff';
    const qvBorder = isDark ? baseTheme.border : '#dddbda';
    const qvText = isDark ? baseTheme.text : '#181818';
    const qvMuted = isDark ? baseTheme.textMuted : '#706e6b';
    const qvHover = isDark ? (baseTheme.surfaceHeader || hexToRgba(accent, 0.18)) : '#f3f3f3';

    const qvSig = `${isDark ? themeKey : 'light'}|${accent}`;
    let style = root.querySelector ? root.querySelector('#sf-quick-views-shadow-style') : null;
    if (style && style.dataset.sfQvSig === qvSig && style.isConnected) {
      return;
    }
    if (!style) {
      style = document.createElement('style');
      style.id = 'sf-quick-views-shadow-style';
      try {
        root.appendChild(style);
      } catch (_) {}
    }
    if (style) {
      style.dataset.sfQvSig = qvSig;
    }

    style.textContent = `
      .sf-quick-views-wrapper,
      .sf-quick-views-wrapper:hover,
      .sf-quick-views-wrapper:focus,
      .sf-quick-views-wrapper:focus-within {
        display: block !important;
        border-bottom: 1px solid ${qvBorder} !important;
        margin-bottom: 4px !important;
        padding-bottom: 4px !important;
        background: ${qvBg} !important;
        background-color: ${qvBg} !important;
        list-style: none !important;
        font-family: inherit !important;
      }
      .sf-quick-header-row,
      .sf-quick-header-row:hover {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 8px 12px 4px 12px !important;
        user-select: none !important;
        font-family: inherit !important;
        background: ${qvBg} !important;
        background-color: ${qvBg} !important;
      }
      .sf-quick-header-title {
        font-size: 11px !important;
        font-weight: 700 !important;
        color: ${qvMuted} !important;
        letter-spacing: 0.0625rem !important;
        text-transform: uppercase !important;
        display: flex !important;
        align-items: center !important;
        gap: 6px !important;
        font-family: inherit !important;
        line-height: 1.25 !important;
      }
      .sf-quick-count {
        font-size: 11px !important;
        font-weight: 600 !important;
        color: ${qvMuted} !important;
        font-family: inherit !important;
      }
      .sf-quick-list,
      .sf-quick-list:hover {
        list-style: none !important;
        margin: 0 !important;
        padding: 0 !important;
        font-family: inherit !important;
        background: ${qvBg} !important;
        background-color: ${qvBg} !important;
      }
      .sf-quick-item {
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        padding: 6px 12px !important;
        margin: 0 !important;
        cursor: pointer !important;
        border-radius: 0 !important;
        transition: background 0.1s ease !important;
        font-family: inherit !important;
        background: ${qvBg} !important;
        background-color: ${qvBg} !important;
      }
      .sf-quick-item:hover,
      .sf-quick-item.slds-is-selected {
        background: ${qvHover} !important;
        background-color: ${qvHover} !important;
      }
      .sf-quick-item.slds-is-selected .sf-quick-item-label {
        font-weight: 700 !important;
        color: ${qvText} !important;
      }
      .sf-quick-item-icon {
        margin-right: 8px !important;
        flex: 0 0 auto !important;
        display: flex !important;
        align-items: center !important;
      }
      .sf-quick-item-label {
        font-size: 13px !important;
        font-weight: 400 !important;
        color: ${qvText} !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
        white-space: nowrap !important;
        flex: 1 1 auto !important;
        margin-right: 8px !important;
        font-family: inherit !important;
        line-height: 1.5 !important;
      }
      .sf-quick-item-controls {
        display: none !important;
        align-items: center !important;
        gap: 2px !important;
        flex: 0 0 auto !important;
      }
      .sf-quick-item:hover .sf-quick-item-controls {
        display: flex !important;
      }
      .sf-quick-control-btn {
        background: transparent !important;
        border: none !important;
        border-radius: 3px !important;
        cursor: pointer !important;
        font-size: 10px !important;
        padding: 2px 4px !important;
        color: ${qvMuted} !important;
        line-height: 1 !important;
        font-family: inherit !important;
      }
      .sf-quick-control-btn:hover {
        background: rgba(0, 0, 0, 0.08) !important;
        color: ${accent} !important;
      }
      .sf-quick-remove-btn:hover {
        color: #ba0517 !important;
        background: #fedfe0 !important;
      }
      .sf-native-bookmark-btn {
        position: absolute !important;
        right: 6px !important;
        top: 50% !important;
        transform: translateY(-50%) !important;
        z-index: 9999 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 24px !important;
        height: 24px !important;
        background: transparent !important;
        border: none !important;
        border-radius: 4px !important;
        cursor: pointer !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        opacity: 0.75 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        transition: background 0.12s ease !important;
      }
      .sf-native-bookmark-btn:hover {
        background: rgba(0, 0, 0, 0.08) !important;
        opacity: 1 !important;
      }
      .sf-native-bookmark-btn svg path {
        stroke: ${qvMuted} !important;
      }
      .sf-native-bookmark-btn:hover svg path {
        stroke: ${accent} !important;
      }
      .sf-native-bookmark-btn.is-bookmarked {
        opacity: 1 !important;
        background: transparent !important;
      }
      .sf-native-bookmark-btn.is-bookmarked svg path {
        stroke: ${accent} !important;
      }
      .sf-native-bookmark-btn.is-bookmarked:hover {
        background: rgba(1, 118, 211, 0.1) !important;
      }
      .sf-native-bookmark-btn svg,
      .sf-quick-item-icon svg {
        pointer-events: none !important;
      }
    `;
  }

  function setupSearchHoverHandler() {
    // Pure CSS :hover manages hover states natively and reverts cleanly on unhover.
  }

  function themeSearchAssistantDOM(theme, specificRoot = null, seqId = null) {
    if (seqId && seqId !== activeAppearanceSequence) return;
    if (!theme || !theme.isDark) return;

    function applyThemeToEl(el) {
      if (!el || el.nodeType !== 1) return;
      const tag = (el.tagName || '').toLowerCase();
      const cls = typeof el.className === 'string' ? el.className : '';
      if (
        el === document.body ||
        el === document.documentElement ||
        cls.includes('desktop') ||
        cls.includes('oneHeader') ||
        cls.includes('viewport') ||
        tag === 'body' ||
        tag === 'html'
      ) {
        return;
      }
      el.dataset.sfThemeApplied = 'true';
      el.style.setProperty('background-color', theme.surface, 'important');
      el.style.setProperty('background', theme.surface, 'important');
      el.style.setProperty('color', theme.text, 'important');
      el.style.setProperty('border-color', theme.border, 'important');
    }

    const searchSelectors = [
      'search_dialog-assistant-dialog',
      'search_assistant-assistant-dialog',
      'search_assistant-content-container',
      'search_assistant-instant-results-list',
      'search_assistant-empty-state',
      'search_assistant-preview',
      'search_assistant-natural-language-preview',
      'force-search-assistant',
      '[class*="searchAssistant" i]',
      '[class*="search-assistant" i]',
      '[class*="instantResult" i]',
      '[class*="naturalLanguage" i]',
      '[class*="searchTips" i]',
      '[data-aura-class*="searchAssistant" i]',
      '[data-aura-class*="forceSearch" i]'
    ].join(',');

    function processSearchAssistantRoot(node) {
      if (!node || !node.querySelectorAll) return;
      try {
        const matches = node.querySelectorAll(searchSelectors);
        if (!matches.length) return;
        for (let i = 0; i < matches.length; i++) {
          const m = matches[i];
          applyThemeToEl(m);
          const childDivs = m.querySelectorAll ? m.querySelectorAll('div, section, article, p, span, a') : [];
          for (let j = 0; j < childDivs.length; j++) {
            const cd = childDivs[j];
            if (cd.tagName === 'A') {
              cd.dataset.sfThemeApplied = 'true';
              cd.style.setProperty('color', theme.accent, 'important');
            } else {
              cd.dataset.sfThemeApplied = 'true';
              cd.style.setProperty('color', theme.text, 'important');
              if (
                cd.classList &&
                (cd.classList.contains('slds-theme_default') ||
                 cd.classList.contains('slds-theme_shade') ||
                 cd.classList.contains('slds-box') ||
                 cd.classList.contains('slds-col') ||
                 cd.classList.contains('slds-grow') ||
                 cd.classList.contains('slds-split-view__detail') ||
                 cd.classList.contains('slds-split-view__content') ||
                 cd.classList.contains('slds-modal__content'))
              ) {
                applyThemeToEl(cd);
              }
            }
          }
          if (m.shadowRoot) {
            processSearchAssistantRoot(m.shadowRoot);
          }
        }
      } catch (_) {}
    }

    if (specificRoot) {
      processSearchAssistantRoot(specificRoot);
    } else {
      processSearchAssistantRoot(document);
      if (typeof trackedShadowRoots !== 'undefined') {
        pruneTrackedShadowRoots();
        for (const sr of trackedShadowRoots) {
          try {
            if (sr.host && isRelevantObserverShadowHost(sr.host)) {
              processSearchAssistantRoot(sr);
            }
          } catch (_) {}
        }
      }
    }
  }

  function interceptAndReplaceMascot() {
    const settings = getEnhancerSettings();
    const customImgUrl = getEffectiveLoadingUrl(settings);
    if (!customImgUrl || !document.body) return;

    const anim = (settings.loadingImage && settings.loadingImage.rotate) ? 'sf-custom-spin 1.2s linear infinite' : 'none';

    try {
      const candidates = document.body.querySelectorAll(
        'img[src*="astro" i], img[src*="codey" i], img[src*="einstein" i], img[src*="cloudy" i], img[src*="appy" i], img[src*="mascot" i], #auraLoadingBox, .auraLoadingBox, .loadingBox, .oneLoading'
      );
      for (let i = 0; i < candidates.length; i++) {
        const el = candidates[i];
        if (el.tagName === 'IMG') {
          if (el.src !== customImgUrl) {
            el.dataset.origSrc = el.dataset.origSrc || el.src;
            el.src = customImgUrl;
            el.srcset = '';
            el.style.backgroundImage = 'none';
            el.style.animation = anim;
            el.style.objectFit = 'contain';
          }
        } else {
          const logo = el.querySelector ? el.querySelector('.logo, div[class*="logo"]') : null;
          if (logo) {
            logo.style.setProperty('background-image', `url("${customImgUrl}")`, 'important');
            logo.style.setProperty('background-size', 'contain', 'important');
            logo.style.setProperty('background-repeat', 'no-repeat', 'important');
            logo.style.setProperty('background-position', 'center', 'important');
            logo.style.setProperty('animation', anim, 'important');
            logo.style.setProperty('display', 'block', 'important');
            logo.style.setProperty('opacity', '1', 'important');
            logo.style.setProperty('visibility', 'visible', 'important');
          }
        }
      }
    } catch (_) {}
  }

  function getBookmarkSVG(isBookmarked) {
    const settings = getEnhancerSettings();
    const accent = getEffectiveAccent(settings);
    if (isBookmarked) {
      return `<svg viewBox="0 0 24 24" width="13" height="13" fill="${accent}" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#706e6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  }

  function getCheckmarkSVG() {
    const settings = getEnhancerSettings();
    const accent = getEffectiveAccent(settings);
    return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="20 6 9 17 4 12"/></svg>`;
  }

    function getCurrentObjectName() {
      const oMatch = window.location.pathname.match(/\/lightning\/o\/([a-zA-Z0-9_]+)\/(?:list|home)/);
      if (oMatch && oMatch[1]) return oMatch[1];

      const rMatch = window.location.pathname.match(/\/lightning\/r\/([a-zA-Z0-9_]+)\//);
      if (rMatch && rMatch[1] && rMatch[1] !== 'Report' && rMatch[1] !== 'Dashboard') {
        return rMatch[1];
      }

      const objHome = document.querySelector('lst-object-home, force-object-home');
      if (objHome && objHome.objectApiName && typeof objHome.objectApiName === 'string') {
        return objHome.objectApiName;
      }

      const entityEl = document.querySelector(
        '.slds-breadcrumb .entityName, .entityName, [data-aura-class="forceEntityIcon"]'
      );
      if (entityEl && entityEl.textContent) {
        const text = entityEl.textContent.trim();
        if (text) return text;
      }

      return null;
    }

    function getQuickViews(objectName) {
      if (!objectName) return [];
      try {
        const oldKey = `sf_pinned_views_${objectName}`;
        const newKey = `sf_quick_views_${objectName}`;
        const existingNew = localStorage.getItem(newKey);

        if (!existingNew) {
          const old = localStorage.getItem(oldKey);
          if (old) {
            localStorage.setItem(newKey, old);
            localStorage.removeItem(oldKey);
            return JSON.parse(old);
          }
        }

        if (existingNew) {
          const parsed = JSON.parse(existingNew);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (_) {}
      return [];
    }

    function saveQuickViews(objectName, views) {
      try {
        localStorage.setItem(`sf_quick_views_${objectName}`, JSON.stringify(views));
      } catch (_) {}
    }

    function toggleBookmarkView(viewData) {
      const objectName = viewData.objectName || getCurrentObjectName();
      if (!objectName) return;
      let views = getQuickViews(objectName);
      const existingIdx = views.findIndex(
        (v) => v.name === viewData.name || (viewData.id && v.id === viewData.id)
      );

      if (existingIdx >= 0) {
        views.splice(existingIdx, 1);
        saveQuickViews(objectName, views);
        showToast(`Removed '${viewData.name}' from Quick Views`);
      } else {
        views.push({
          id: viewData.id || viewData.name,
          name: viewData.name,
          url: viewData.url
        });
        saveQuickViews(objectName, views);
        showToast(`Saved '${viewData.name}' to Quick Views`);
      }

      refreshQuickViewsUI();
    }

    function removeQuickView(viewName, objectName) {
      let views = getQuickViews(objectName);
      views = views.filter((v) => v.name !== viewName);
      saveQuickViews(objectName, views);
      showToast(`Removed '${viewName}' from Quick Views`);
      refreshQuickViewsUI();
    }

    function moveQuickViewUp(index, objectName) {
      const views = getQuickViews(objectName);
      if (index > 0 && index < views.length) {
        const temp = views[index];
        views[index] = views[index - 1];
        views[index - 1] = temp;
        saveQuickViews(objectName, views);
        refreshQuickViewsUI();
      }
    }

    function moveQuickViewDown(index, objectName) {
      const views = getQuickViews(objectName);
      if (index >= 0 && index < views.length - 1) {
        const temp = views[index];
        views[index] = views[index + 1];
        views[index + 1] = temp;
        saveQuickViews(objectName, views);
        refreshQuickViewsUI();
      }
    }

    function sortQuickViewsAlphabetically(objectName) {
      const views = getQuickViews(objectName);
      views.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
      saveQuickViews(objectName, views);
      refreshQuickViewsUI();
      showToast('Sorted Quick Views A-Z');
    }

    function closeDropdown() {
      setTimeout(() => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      }, 40);
    }

    /**
     * Dispatch full native pointer and mouse sequence to trigger Salesforce LWC/Aura option selection
     */
    function simulateNativeSelection(targetEl) {
      if (!targetEl) return;
      try {
        if (typeof targetEl.focus === 'function') {
          targetEl.focus();
        }
      } catch (_) {}

      const rect = targetEl.getBoundingClientRect();
      const clientX = rect.left + rect.width / 2;
      const clientY = rect.top + rect.height / 2;
      const eventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        clientX,
        clientY,
        button: 0,
        buttons: 1
      };

      try {
        targetEl.dispatchEvent(new PointerEvent('pointerdown', eventInit));
        targetEl.dispatchEvent(new MouseEvent('mousedown', eventInit));
        targetEl.dispatchEvent(new PointerEvent('pointerup', { ...eventInit, buttons: 0 }));
        targetEl.dispatchEvent(new MouseEvent('mouseup', { ...eventInit, buttons: 0 }));
        targetEl.dispatchEvent(new MouseEvent('click', { ...eventInit, buttons: 0 }));
        if (typeof targetEl.click === 'function') {
          targetEl.click();
        }
      } catch (_) {}
    }

    /**
     * Extract the authentic 15/18-character Salesforce List View ID (00B...) or developer name
     */
    function extractListViewId(container) {
      if (!container) return null;

      // 1. Direct attribute check walking up ancestors
      let curr = container;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (curr.getAttribute) {
          const dv = curr.getAttribute('data-value');
          if (dv && (dv.startsWith('00B') || dv === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(dv))) {
            if (!dv.includes(' ')) return dv;
          }
          for (const attr of ['data-id', 'data-filterid', 'data-key', 'data-recordid', 'data-record-id']) {
            const val = curr.getAttribute(attr);
            if (val) {
              const m = val.match(/00B[a-zA-Z0-9]{12,15}/);
              if (m) return m[0];
            }
          }
          const href = curr.getAttribute('href');
          if (href) {
            const m = href.match(/filterName=([^&#]+)/);
            if (m && m[1]) {
              const decoded = decodeURIComponent(m[1]);
              if (!decoded.includes(' ')) return decoded;
            }
            const m00B = href.match(/00B[a-zA-Z0-9]{12,15}/);
            if (m00B) return m00B[0];
          }
        }
        if (curr.classList && (curr.classList.contains('slds-dropdown') || curr.classList.contains('slds-popover'))) {
          break;
        }
        curr = curr.parentElement;
      }

      // 2. Check Shadow DOM host element if applicable
      try {
        const host = container.getRootNode?.()?.host;
        if (host && host.getAttribute) {
          const dv = host.getAttribute('data-value');
          if (dv && (dv.startsWith('00B') || dv === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(dv))) {
            if (!dv.includes(' ')) return dv;
          }
        }
      } catch (_) {}

      // 3. Scan descendants
      try {
        const allDescendants = [container, ...(container.querySelectorAll ? container.querySelectorAll('*') : [])];
        for (const el of allDescendants) {
          if (el.getAttribute) {
            const dv = el.getAttribute('data-value');
            if (dv && (dv.startsWith('00B') || dv === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(dv))) {
              if (!dv.includes(' ')) return dv;
            }
            for (const attr of ['data-id', 'data-filterid', 'data-key', 'data-recordid', 'data-record-id', 'id', 'href']) {
              const val = el.getAttribute(attr);
              if (val) {
                const m = val.match(/00B[a-zA-Z0-9]{12,15}/);
                if (m) return m[0];
              }
            }
          }
        }
      } catch (_) {}

      // 4. Check Aura component state if available
      if (window.$A && typeof window.$A.getComponent === 'function') {
        let auraEl = container;
        while (auraEl && auraEl !== document.body) {
          try {
            const cmp = window.$A.getComponent(auraEl);
            if (cmp && cmp.isValid && cmp.isValid()) {
              const item = cmp.get('v.item') || cmp.get('v.listView') || cmp.get('v.value') || cmp.get('v.filterId') || cmp.get('v.id');
              if (typeof item === 'string') {
                const m = item.match(/00B[a-zA-Z0-9]{12,15}/);
                if (m) return m[0];
                if (item === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(item)) return item;
              } else if (item && typeof item === 'object') {
                const id = item.id || item.value || item.developerName || item.filterId;
                if (id && typeof id === 'string') {
                  const m = id.match(/00B[a-zA-Z0-9]{12,15}/);
                  if (m) return m[0];
                  if (id === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(id)) return id;
                }
              }
            }
          } catch (_) {}
          if (auraEl.classList && (auraEl.classList.contains('slds-dropdown') || auraEl.classList.contains('slds-popover'))) {
            break;
          }
          auraEl = auraEl.parentElement;
        }
      }

      return null;
    }

    function onQuickViewItemClick(view, event, objectName, popover) {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      const doClose = () => {
        closeDropdown();
      };

      // 1. Locate the native option in the dropdown and all active shadow roots
      const findNativeOption = () => {
        const rootsToSearch = new Set();
        if (popover) {
          rootsToSearch.add(popover);
          const pRoot = popover.getRootNode ? popover.getRootNode() : null;
          if (pRoot) rootsToSearch.add(pRoot);
          const host = pRoot?.host;
          if (host?.shadowRoot) rootsToSearch.add(host.shadowRoot);
        }
        if (typeof trackedShadowRoots !== 'undefined') {
          for (const sr of trackedShadowRoots) {
            if (sr && sr.isConnected !== false) {
              const hTag = (sr.host?.tagName || '').toLowerCase();
              if (hTag.includes('combobox') || hTag.includes('picker') || hTag.includes('list')) {
                rootsToSearch.add(sr);
              }
            }
          }
        }
        rootsToSearch.add(document);

        const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const targetClean = cleanStr(view.name);

        for (const root of rootsToSearch) {
          try {
            const candidates = root.querySelectorAll(
              'lightning-base-combobox-item, [role="option"], li.slds-listbox__item, div.slds-listbox__option, li.uiMenuItem'
            );
            for (let i = 0; i < candidates.length; i++) {
              const el = candidates[i];
              if (el.closest && el.closest('.sf-quick-views-wrapper')) continue;

              // 1. Match by authentic Salesforce 00B ID or DeveloperName
              if (view.id) {
                const dataVal = el.getAttribute('data-value');
                if (dataVal && dataVal === view.id) return el;

                const dataItemId = el.getAttribute('data-item-id');
                if (dataItemId && dataItemId === view.id) return el;

                if (view.id.startsWith('00B')) {
                  const rowId = extractListViewId(el);
                  if (rowId === view.id) return el;
                }
              }

              // 2. Match by exact or clean label
              const rawTxt = (el.innerText || el.textContent || '').trim();
              if (rawTxt) {
                const line1 = rawTxt.split('\n')[0].replace(/[✕▲▼].*$/, '').trim();
                if (line1 === view.name || line1.toLowerCase() === view.name.toLowerCase()) {
                  return el;
                }
                if (targetClean && cleanStr(line1) === targetClean) {
                  return el;
                }
              }
            }
          } catch (_) {}
        }
        return null;
      };

      let nativeOption = findNativeOption();

      // If we found the native option, update view with real ID if it was missing
      if (nativeOption && (!view.id || !view.id.startsWith('00B'))) {
        const realId = extractListViewId(nativeOption);
        if (realId && realId.startsWith('00B')) {
          view.id = realId;
          view.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(realId)}`;
          const currentViews = getQuickViews(objectName);
          const idx = currentViews.findIndex((v) => v.name === view.name);
          if (idx >= 0) {
            currentViews[idx].id = realId;
            currentViews[idx].url = view.url;
            saveQuickViews(objectName, currentViews);
          }
        }
      }

      // Modifier Clicks (Console: Cmd/Ctrl = new workspace tab, Alt = subtab; Standard Nav: Cmd/Ctrl = new browser tab)
      if (isCmdOrCtrl || isAlt) {
        const inConsole = isConsoleAppActive();
        if (inConsole || (isCmdOrCtrl && !isAlt)) {
          event.preventDefault();
          event.stopPropagation();
          doClose();

          // Ensure we only navigate to valid IDs or safe URLs
          let targetUrl = view.url;
          if (!targetUrl || targetUrl.includes('%20') || (view.id && view.id.includes(' '))) {
            if (view.id && (view.id.startsWith('00B') || /^[a-zA-Z0-9_]{3,40}$/.test(view.id))) {
              targetUrl = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(view.id)}`;
            } else {
              showToast(`Could not determine list view ID for '${view.name}'`);
              return;
            }
          }

          if (!inConsole) {
            window.open(targetUrl, '_blank', 'noopener');
          } else if (isCmdOrCtrl && !isAlt) {
            openTargetAsPrimaryTab({ url: targetUrl }, { focus: !event.shiftKey });
          } else if (isAlt && !isCmdOrCtrl) {
            openTargetAsSubtab({ url: targetUrl }, { openInBackground: event.shiftKey });
          }
          return;
        }
      }

      // Immediately reflect selection in Quick Views UI
      const quickScope = popover?.getRootNode ? popover.getRootNode() : document;
      const allQuickItems = quickScope.querySelectorAll ? quickScope.querySelectorAll('.sf-quick-item') : [];
      for (let i = 0; i < allQuickItems.length; i++) {
        const it = allQuickItems[i];
        const isMatch = it.dataset.viewName === view.name;
        if (isMatch) {
          it.classList.add('slds-is-selected');
          it.setAttribute('aria-selected', 'true');
          const ic = it.querySelector('.sf-quick-item-icon');
          if (ic) ic.innerHTML = getCheckmarkSVG();
        } else {
          it.classList.remove('slds-is-selected');
          it.setAttribute('aria-selected', 'false');
          const ic = it.querySelector('.sf-quick-item-icon');
          if (ic) ic.innerHTML = `<span style="display:inline-block; width:14px; height:14px;"></span>`;
        }
      }

      // Normal click: 1. Trigger native selection directly in the open dropdown
      if (nativeOption) {
        event.preventDefault();
        event.stopPropagation();

        const clickTarget = nativeOption.matches('[role="option"], lightning-base-combobox-item')
          ? nativeOption
          : nativeOption.querySelector('[role="option"], lightning-base-combobox-item, a, button') || nativeOption;

        simulateNativeSelection(clickTarget);
        setTimeout(doClose, 250);
        return;
      }

      // Normal click: 2. If not visible in rendered items, search the dropdown's combobox input
      let searchInput = null;
      const searchRoots = [
        popover?.getRootNode?.(),
        popover?.getRootNode?.()?.host?.shadowRoot,
        popover,
        document
      ].filter(Boolean);

      for (const sr of searchRoots) {
        try {
          searchInput = sr.querySelector(
            'input.slds-combobox__input, input[placeholder*="Search lists" i], input[placeholder*="Search this list" i], input[type="search"].slds-input, input.slds-input'
          );
          if (searchInput) break;
        } catch (_) {}
      }

      if (searchInput) {
        event.preventDefault();
        event.stopPropagation();

        searchInput.focus();
        try {
          const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
          if (valueSetter) {
            valueSetter.call(searchInput, view.name);
          } else {
            searchInput.value = view.name;
          }
        } catch (_) {
          searchInput.value = view.name;
        }
        searchInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true, composed: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true, cancelable: true, composed: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, composed: true, key: 'Enter' }));

        setTimeout(() => {
          const searchedOption = findNativeOption();
          if (searchedOption) {
            const clickTarget = searchedOption.matches('[role="option"], lightning-base-combobox-item')
              ? searchedOption
              : searchedOption.querySelector('[role="option"], lightning-base-combobox-item, a, button') || searchedOption;
            simulateNativeSelection(clickTarget);
            setTimeout(doClose, 250);
          } else {
            fallbackUrlNavigate();
          }
        }, 180);
        return;
      }

      fallbackUrlNavigate();

      function fallbackUrlNavigate() {
        doClose();

        let filterId = view.id;
        if (!filterId || filterId.includes(' ') || filterId === view.name) {
          showToast(`Please select '${view.name}' from the list below once to refresh its link`);
          return;
        }

        const is00B = typeof filterId === 'string' && /^00B[a-zA-Z0-9]{12,15}$/.test(filterId);

        if (window.$A && window.$A.get) {
          const listEvt = window.$A.get('e.force:navigateToList');
          if (listEvt) {
            listEvt.setParams({
              listViewId: is00B ? filterId : null,
              listViewName: !is00B ? filterId : null,
              scope: objectName
            });
            listEvt.fire();
            return;
          }
          const targetUrl = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(filterId)}`;
          const urlEvt = window.$A.get('e.force:navigateToURL');
          if (urlEvt) {
            urlEvt.setParams({ url: targetUrl });
            urlEvt.fire();
            return;
          }
        }

        const targetUrl = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(filterId)}`;
        window.location.assign(targetUrl);
      }
    }

    function findRecentListViewsHeader(root = null) {
      const isHeaderTxt = (txt) => {
        if (!txt) return false;
        const lower = txt.replace(/\s+/g, ' ').trim().toLowerCase();
        return (
          lower === 'recent list views' ||
          lower === 'pinned list view' ||
          lower === 'pinned list views' ||
          lower === 'list views' ||
          lower === 'other list views' ||
          lower.includes('recent list views') ||
          lower.includes('pinned list view')
        );
      };

      const rootsToSearch = [];
      if (root) {
        rootsToSearch.push(root);
      } else {
        rootsToSearch.push(document);
        if (typeof trackedShadowRoots !== 'undefined') {
          for (const sr of trackedShadowRoots) {
            if (sr && sr.isConnected !== false) rootsToSearch.push(sr);
          }
        }
      }

      for (let rIdx = 0; rIdx < rootsToSearch.length; rIdx++) {
        const r = rootsToSearch[rIdx];
        try {
          const candidateHeaders = r.querySelectorAll(
            '.slds-listbox__option-header, .slds-dropdown__header, [role="presentation"], [data-value*="header"], h2, h3, span, div'
          );
          for (let i = 0; i < candidateHeaders.length; i++) {
            const el = candidateHeaders[i];
            if (el.closest && el.closest('.sf-quick-views-wrapper, .sf-pinned-section-wrapper')) continue;
            const txt = (el.textContent || '').trim();
            if (isHeaderTxt(txt)) {
              return el;
            }
          }
        } catch (_) {}

        if (r.createTreeWalker) {
          try {
            const walker = r.createTreeWalker(r.body || r, NodeFilter.SHOW_TEXT, null, false);
            let node;
            while ((node = walker.nextNode())) {
              const txt = (node.nodeValue || '').trim();
              if (isHeaderTxt(txt)) {
                const parent = node.parentElement;
                if (parent && (!parent.closest || !parent.closest('.sf-quick-views-wrapper, .sf-pinned-section-wrapper'))) {
                  return parent;
                }
              }
            }
          } catch (_) {}
        }
      }

      return null;
    }

    function getDropdownObjectName(popover) {
      if (!popover) return null;

      let curr = popover;
      let depth = 0;
      while (curr && curr !== document.body && curr !== document.documentElement && depth < 30) {
        if (curr.objectApiName && typeof curr.objectApiName === 'string') {
          return curr.objectApiName;
        }
        if (curr.getAttribute) {
          const apiName = curr.getAttribute('object-api-name') || curr.getAttribute('data-object-api-name');
          if (apiName) return apiName;
        }

        const tag = (curr.tagName || '').toLowerCase();
        if (tag === 'lst-list-view-picker' || tag === 'force-list-view-picker' || tag === 'lst-list-view-manager' || tag === 'force-list-view-manager') {
          const chevron = (curr.shadowRoot && curr.shadowRoot.querySelector('lightning-button-icon.pickerChevron, button[title*="Select a List View" i]')) ||
                          (curr.querySelector && curr.querySelector('lightning-button-icon.pickerChevron, button[title*="Select a List View" i]'));
          if (chevron) {
            const title = chevron.title || (chevron.getAttribute && chevron.getAttribute('title')) || '';
            const m = title.match(/Select a List View:\s*(.+)/i);
            if (m && m[1]) {
              const label = m[1].trim();
              if (label.endsWith('ies')) return label.slice(0, -3) + 'y';
              if (label.endsWith('es') && !label.endsWith('ses')) return label.slice(0, -2);
              if (label.endsWith('s') && !label.endsWith('ss')) return label.slice(0, -1);
              return label;
            }
          }
          const assistive = (curr.shadowRoot && curr.shadowRoot.querySelector('.slds-page-header__name-title .slds-assistive-text')) ||
                            (curr.querySelector && curr.querySelector('.slds-page-header__name-title .slds-assistive-text'));
          if (assistive && assistive.textContent) {
            const label = assistive.textContent.trim();
            if (label) {
              if (label.endsWith('ies')) return label.slice(0, -3) + 'y';
              if (label.endsWith('es') && !label.endsWith('ses')) return label.slice(0, -2);
              if (label.endsWith('s') && !label.endsWith('ss')) return label.slice(0, -1);
              return label;
            }
          }
        }

        if (!curr.parentElement && curr.getRootNode) {
          try {
            const r = curr.getRootNode();
            if (r && r.host) {
              curr = r.host;
              continue;
            }
          } catch (_) {}
        }
        curr = curr.parentElement;
        depth++;
      }

      const listMatch = window.location.pathname.match(/\/lightning\/o\/([a-zA-Z0-9_]+)\/list/);
      if (listMatch && listMatch[1]) {
        return listMatch[1];
      }

      const objHome = document.querySelector('lst-object-home, force-object-home');
      if (objHome && objHome.objectApiName) {
        return objHome.objectApiName;
      }

      return null;
    }

    function findListViewDropdownContext() {
      // 1. Direct path check (instant O(1) in modern Salesforce Lightning)
      try {
        const objHome = document.querySelector('lst-object-home, force-object-home');
        const directEl = objHome
          ?.shadowRoot?.querySelector('lst-list-view-manager, force-list-view-manager')
          ?.shadowRoot?.querySelector('lst-common-list-internal, force-common-list-internal')
          ?.shadowRoot?.querySelector('lst-list-view-manager-header, force-list-view-manager-header')
          ?.shadowRoot?.querySelector('lst-list-view-picker, force-list-view-picker')
          ?.shadowRoot?.querySelector('lst-list-view-picker-dropdown, force-list-view-picker-dropdown')
          ?.shadowRoot?.querySelector('lightning-grouped-combobox')
          ?.shadowRoot?.querySelector('lightning-base-combobox')
          ?.shadowRoot?.querySelector('.slds-dropdown, [role="listbox"], .slds-listbox');

        function getValidListContainer(pop) {
          if (!pop) return null;
          const candidates = pop.querySelectorAll ? pop.querySelectorAll('ul, ol, [role="listbox"], .slds-listbox') : [];
          for (let i = 0; i < candidates.length; i++) {
            const cand = candidates[i];
            if (!cand.closest || !cand.closest('.sf-quick-views-wrapper')) {
              return cand;
            }
          }
          return pop;
        }

        function getValidItemWrapper(innerHeader, listContainer) {
          if (!innerHeader || !listContainer) return null;
          let itemWrapper = innerHeader;
          while (itemWrapper && itemWrapper.parentElement && itemWrapper.parentElement !== listContainer) {
            itemWrapper = itemWrapper.parentElement;
          }
          return (itemWrapper && itemWrapper.parentElement === listContainer) ? itemWrapper : null;
        }

        const isComboboxOpen = (el) => {
          if (!el || !el.isConnected) return false;
          if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
          const rootHost = el.getRootNode ? el.getRootNode().host : null;
          const hostCombobox = (el.closest && el.closest('.slds-combobox, lightning-base-combobox')) || rootHost;
          if (hostCombobox) {
            if (hostCombobox.classList && hostCombobox.classList.contains('slds-is-open')) return true;
            const searchScope = hostCombobox.shadowRoot || hostCombobox;
            const inputOrBtn = searchScope.querySelector ? searchScope.querySelector('[aria-expanded]') : null;
            if (inputOrBtn) {
              return inputOrBtn.getAttribute('aria-expanded') === 'true';
            }
            if (hostCombobox.getAttribute && hostCombobox.getAttribute('aria-expanded') === 'true') {
              return true;
            }
          }
          return false;
        };

        if (directEl && isComboboxOpen(directEl)) {
          const listContainer = getValidListContainer(directEl);
          const innerHeader = findRecentListViewsHeader(directEl);
          const itemWrapper = getValidItemWrapper(innerHeader, listContainer);
          const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
          if (listRoot && listRoot !== document) {
            syncQuickViewsStyleToRoot(listRoot);
          }
          const objectName = (objHome && objHome.objectApiName) || getDropdownObjectName(directEl) || 'Case';
          return { popover: directEl, listContainer, itemWrapper, headerEl: innerHeader, objectName };
        }
      } catch (_) {}

      // 2. Targeted shadow root lookup (ONLY relevant list-view/combobox/picker shadow roots, NEVER a full-DOM crawl)
      const rootsToSearch = [document];
      if (typeof trackedShadowRoots !== 'undefined') {
        pruneTrackedShadowRoots();
        for (const sr of trackedShadowRoots) {
          if (sr && sr.host && sr.host.isConnected && isRelevantObserverShadowHost(sr.host)) {
            rootsToSearch.push(sr);
          }
        }
      }

      // Check whether an element belongs to record details/fields (Cluster, Status, Account, etc.)
      const isRecordDetailComponent = (el) => {
        if (!el) return false;
        let curr = el;
        let depth = 0;
        while (curr && curr !== document.body && curr !== document.documentElement && depth < 25) {
          const tag = (curr.tagName || '').toLowerCase();
          const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
          if (
            tag.includes('record-layout') ||
            tag.includes('record-form') ||
            tag.includes('detail-panel') ||
            tag.includes('form-picklist') ||
            tag === 'force-lookup' ||
            tag.includes('quick-action') ||
            cls.includes('recordlayout') ||
            cls.includes('records-form') ||
            (cls.includes('slds-form-element') && !cls.includes('forcelistviewpicker') && !tag.includes('list-view'))
          ) {
            if (curr.closest && curr.closest('lst-object-home, lst-list-view-manager, force-list-view-manager')) {
              return false;
            }
            return true;
          }
          if (!curr.parentElement && curr.getRootNode) {
            try {
              const r = curr.getRootNode();
              if (r && r.host) {
                curr = r.host;
                continue;
              }
            } catch (_) {}
          }
          curr = curr.parentElement;
          depth++;
        }
        return false;
      };

      const isListViewPickerComponent = (el) => {
        if (!el) return false;
        let curr = el;
        let depth = 0;
        while (curr && curr !== document.body && curr !== document.documentElement && depth < 20) {
          const tag = (curr.tagName || '').toLowerCase();
          const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
          if (
            tag === 'lst-list-view-picker' ||
            tag === 'force-list-view-picker' ||
            tag === 'lst-list-view-picker-dropdown' ||
            tag === 'force-list-view-picker-dropdown' ||
            cls.includes('forcelistviewpicker') ||
            cls.includes('listviewpicker') ||
            (curr.getAttribute && curr.getAttribute('data-component-id')?.toLowerCase().includes('listviewpicker'))
          ) {
            return true;
          }
          // Explicitly reject search dialogs, global search, and record layout elements
          if (
            tag.includes('search_assistant') ||
            tag.includes('search_dialog') ||
            tag.includes('force-search') ||
            cls.includes('searchassistant') ||
            cls.includes('search_dialog') ||
            tag.includes('record-') ||
            cls.includes('record-')
          ) {
            return false;
          }
          if (!curr.parentElement && curr.getRootNode) {
            try {
              const r = curr.getRootNode();
              if (r && r.host) {
                curr = r.host;
                continue;
              }
            } catch (_) {}
          }
          curr = curr.parentElement;
          depth++;
        }
        return false;
      };

      const isCandidateVisible = (el) => {
        if (!el || el.isConnected === false) return false;
        if (el.offsetWidth <= 0 || el.offsetHeight <= 0) return false;
        const rootHost = el.getRootNode ? el.getRootNode().host : null;
        const hostCombobox = (el.closest && el.closest('.slds-combobox, lightning-base-combobox')) || rootHost;
        if (hostCombobox) {
          if (hostCombobox.classList && hostCombobox.classList.contains('slds-is-open')) return true;
          const searchScope = hostCombobox.shadowRoot || hostCombobox;
          const inputOrBtn = searchScope.querySelector ? searchScope.querySelector('[aria-expanded]') : null;
          if (inputOrBtn) {
            return inputOrBtn.getAttribute('aria-expanded') === 'true';
          }
          if (hostCombobox.getAttribute && hostCombobox.getAttribute('aria-expanded') === 'true') {
            return true;
          }
          return false;
        }
        return false;
      };

      // 1. Search for visible dropdowns strictly belonging to list view pickers
      for (let rIdx = 0; rIdx < rootsToSearch.length; rIdx++) {
        const root = rootsToSearch[rIdx];
        try {
          const candidates = root.querySelectorAll(
            '.slds-dropdown, [role="listbox"], .slds-listbox, div[id*="dropdown-element"]'
          );
          for (let i = 0; i < candidates.length; i++) {
            const pop = candidates[i];
            if (!isCandidateVisible(pop)) continue;
            if (pop.closest && pop.closest('search_assistant-assistant-dialog, force-search-assistant, [class*="searchAssistant" i]')) continue;
            if (pop.closest && pop.closest('one-app-launcher-modal, .slds-app-launcher, one-notifications-flyout')) continue;
            if (isRecordDetailComponent(pop)) continue;

            const isPicker = isListViewPickerComponent(pop);
            if (!isPicker) continue;

            const innerHeader = findRecentListViewsHeader(pop);
            const hasListSearchInput = pop.querySelector ? pop.querySelector('input[placeholder*="Search lists" i], input[aria-label*="Search lists" i]') : null;

            if (innerHeader || hasListSearchInput || (pop.closest && pop.closest('lst-list-view-picker, force-list-view-picker'))) {
              const objectName = getDropdownObjectName(pop);
              if (!objectName) continue;

              const listContainer = getValidListContainer(pop);
              const itemWrapper = getValidItemWrapper(innerHeader, listContainer);
              const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
              if (listRoot && listRoot !== document) {
                syncQuickViewsStyleToRoot(listRoot);
              }
              return { popover: pop, listContainer, itemWrapper, headerEl: innerHeader, objectName };
            }
          }
        } catch (_) {}
      }

      // 2. Locate via active trigger button with aria-expanded="true"
      for (let rIdx = 0; rIdx < rootsToSearch.length; rIdx++) {
        const root = rootsToSearch[rIdx];
        try {
          const triggers = root.querySelectorAll(
            'button[title*="Select a List View" i], a[title*="Select a List View" i], button[aria-label*="Select a List View" i], .forceListViewPickerDesktop button, .forceListViewPicker button'
          );
          for (let i = 0; i < triggers.length; i++) {
            const btn = triggers[i];
            const isExpanded = btn.getAttribute('aria-expanded') === 'true' ||
                               btn.closest?.('.slds-is-open, .slds-dropdown-trigger_click.slds-is-open');
            if (isExpanded) {
              const controlsId = btn.getAttribute('aria-controls');
              let pop = null;
              if (controlsId) {
                for (const r of rootsToSearch) {
                  pop = r.querySelector ? r.querySelector('#' + CSS.escape(controlsId)) : null;
                  if (pop) break;
                }
              }
              if (!pop) {
                const hostCombobox = btn.closest ? btn.closest('lightning-base-combobox, force-list-view-picker, lst-list-view-picker, .slds-combobox') : null;
                if (hostCombobox) {
                  const sr = hostCombobox.shadowRoot || hostCombobox._sfShadowRoot;
                  pop = (sr ? sr.querySelector('.slds-dropdown, [role="listbox"]') : null) || hostCombobox.querySelector('.slds-dropdown, [role="listbox"]');
                }
              }
              if (pop && isCandidateVisible(pop) && !isRecordDetailComponent(pop)) {
                const objectName = getDropdownObjectName(pop) || getDropdownObjectName(btn);
                if (!objectName) continue;

                const listContainer = getValidListContainer(pop);
                const innerHeader = findRecentListViewsHeader(pop);
                const itemWrapper = getValidItemWrapper(innerHeader, listContainer);
                const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
                if (listRoot && listRoot !== document) {
                  syncQuickViewsStyleToRoot(listRoot);
                }
                return { popover: pop, listContainer, itemWrapper, headerEl: innerHeader, objectName };
              }
            }
          }
        } catch (_) {}
      }

      return null;
    }


        /**
     * Find list view rows in the dropdown with STRICT 1-per-entry deduplication
     */
    function findDropdownRows(popover, headerEl) {
      const rows = [];
      const processedLabels = new Set();
      const seenElements = new Set();

      function evaluateCandidate(el) {
        if (!el || seenElements.has(el)) return;
        seenElements.add(el);

        if (el.closest && (el.closest('.sf-quick-views-wrapper, .sf-pinned-section-wrapper'))) return;
        if (headerEl && (el === headerEl || el.contains(headerEl) || headerEl.contains(el))) return;
        if (el.querySelector && el.querySelector('.slds-listbox__option-header, [data-value*="header"]')) return;
        if (el.classList && el.classList.contains('slds-listbox__option-header')) return;

        let rawTxt = (el.innerText || el.textContent || '').trim();
        const sr = el.shadowRoot || el._sfShadowRoot;
        if (!rawTxt && sr) {
          rawTxt = (sr.innerText || sr.textContent || '').trim();
        }
        if (!rawTxt) return;

        let label = rawTxt.split('\n')[0].trim();
        label = label.replace(/[✕▲▼].*$/, '').trim();

        const lowerLabel = label.toLowerCase();
        if (
          !label ||
          lowerLabel === 'recent list views' ||
          lowerLabel === 'recent views' ||
          lowerLabel === 'all other lists' ||
          lowerLabel === 'other lists' ||
          lowerLabel === 'other list views' ||
          lowerLabel === 'pinned list view' ||
          lowerLabel === 'pinned list views' ||
          lowerLabel.includes('other lists') ||
          lowerLabel.includes('recent list views') ||
          lowerLabel.startsWith('quick views') ||
          lowerLabel.startsWith('pinned views') ||
          lowerLabel.startsWith('new ') ||
          lowerLabel.includes('new list view') ||
          label.length > 90
        ) {
          return;
        }

        // If an entry with this label was already gathered, skip duplicate wrappers
        if (processedLabels.has(label)) {
          return;
        }

        // Skip container wrappers that hold multiple row items
        const childRows = el.querySelectorAll ? el.querySelectorAll('li, [role="option"], [role="menuitem"], a.select') : [];
        if (childRows.length > 1) {
          for (const cr of childRows) evaluateCandidate(cr);
          return;
        }

        const targetRow = (el.closest && (el.closest('li.slds-listbox__item') || el.closest('lightning-base-combobox-item'))) || el;
        processedLabels.add(label);
        rows.push({ row: targetRow, label });
      }

      // 1. Siblings after header
      if (headerEl) {
        let itemWrapper = headerEl;
        while (itemWrapper.parentElement && itemWrapper.parentElement.childElementCount <= 1) {
          itemWrapper = itemWrapper.parentElement;
        }
        let sib = itemWrapper.nextElementSibling;
        while (sib) {
          if (sib.children && sib.children.length > 1 && !sib.matches('li, [role="option"]')) {
            for (const child of sib.children) evaluateCandidate(child);
          } else {
            evaluateCandidate(sib);
          }
          sib = sib.nextElementSibling;
        }
      }

      // 2. Selectors across popover (handles search results and different SLDS templates)
      if (popover) {
        const candidates = popover.querySelectorAll(
          'li.slds-listbox__item, lightning-base-combobox-item, li, [role="option"], [role="menuitem"], .slds-dropdown__item, .uiMenuItem, a[role="menuitem"]'
        );
        for (let i = 0; i < candidates.length; i++) {
          const c = candidates[i];
          const sr = c.shadowRoot || c._sfShadowRoot;
          if (sr) {
            const innerOptions = sr.querySelectorAll('[role="option"], .slds-listbox__option, .slds-media, a, li');
            for (let j = 0; j < innerOptions.length; j++) {
              evaluateCandidate(innerOptions[j]);
            }
          }
          const container = c.closest ? (c.closest('li.slds-listbox__item, lightning-base-combobox-item, [role="option"]') || c) : c;
          evaluateCandidate(container);
        }
      }

      return rows;
    }

    function ensureQuickViewsStylesInjected() {
      const settings = getEnhancerSettings();
      const accent = getEffectiveAccent(settings);
      let style = document.getElementById('sf-quick-views-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'sf-quick-views-style';
        (document.head || document.documentElement).appendChild(style);
      }
      style.textContent = `
        .sf-quick-views-wrapper,
        .sf-quick-views-wrapper:hover,
        .sf-quick-views-wrapper:focus,
        .sf-quick-views-wrapper:focus-within {
          border-bottom: 1px solid var(--sf-qv-border, #dddbda) !important;
          margin-bottom: 4px !important;
          padding-bottom: 4px !important;
          background: var(--sf-qv-bg, #ffffff) !important;
          background-color: var(--sf-qv-bg, #ffffff) !important;
          list-style: none !important;
          font-family: inherit !important;
        }
        .sf-quick-header-row,
        .sf-quick-header-row:hover {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 8px 12px 4px 12px !important;
          user-select: none !important;
          font-family: inherit !important;
          background: var(--sf-qv-bg, #ffffff) !important;
          background-color: var(--sf-qv-bg, #ffffff) !important;
        }
        .sf-quick-header-title {
          font-size: 11px !important;
          font-weight: 700 !important;
          color: var(--sf-qv-muted, #706e6b) !important;
          letter-spacing: 0.0625rem !important;
          text-transform: uppercase !important;
          display: flex !important;
          align-items: center !important;
          gap: 6px !important;
          font-family: inherit !important;
          line-height: 1.25 !important;
        }
        .sf-quick-count {
          font-size: 11px !important;
          font-weight: 600 !important;
          color: var(--sf-qv-muted, #706e6b) !important;
          font-family: inherit !important;
        }
        .sf-quick-list,
        .sf-quick-list:hover {
          list-style: none !important;
          margin: 0 !important;
          padding: 0 !important;
          font-family: inherit !important;
          background: var(--sf-qv-bg, #ffffff) !important;
          background-color: var(--sf-qv-bg, #ffffff) !important;
        }
          padding: 0 !important;
          font-family: inherit !important;
          background: var(--sf-qv-bg, #ffffff) !important;
        }
        .sf-quick-item {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 6px 12px !important;
          margin: 0 !important;
          cursor: pointer !important;
          border-radius: 0 !important;
          transition: background 0.1s ease !important;
          font-family: inherit !important;
          background: var(--sf-qv-bg, #ffffff) !important;
        }
        .sf-quick-item:hover {
          background: var(--sf-qv-hover, #f3f3f3) !important;
        }
        .sf-quick-item.slds-is-selected {
          background: var(--sf-qv-hover, #f3f3f3) !important;
        }
        .sf-quick-item.slds-is-selected .sf-quick-item-label {
          font-weight: 700 !important;
          color: var(--sf-qv-text, #181818) !important;
        }
        .sf-quick-item.slds-is-selected:hover {
          background: var(--sf-qv-hover, #e8eaec) !important;
        }
        .sf-quick-item-icon {
          margin-right: 8px !important;
          flex: 0 0 auto !important;
          display: flex !important;
          align-items: center !important;
        }
        .sf-quick-item-label {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: var(--sf-qv-text, #181818) !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          flex: 1 1 auto !important;
          margin-right: 8px !important;
          font-family: inherit !important;
          line-height: 1.5 !important;
        }
        .sf-quick-item-controls {
          display: none !important;
          align-items: center !important;
          gap: 2px !important;
          flex: 0 0 auto !important;
        }
        .sf-quick-item:hover .sf-quick-item-controls {
          display: flex !important;
        }
        .sf-quick-control-btn {
          background: transparent !important;
          border: none !important;
          border-radius: 3px !important;
          cursor: pointer !important;
          font-size: 10px !important;
          padding: 2px 4px !important;
          color: var(--sf-qv-muted, #706e6b) !important;
          line-height: 1 !important;
          font-family: inherit !important;
        }
        .sf-quick-control-btn:hover {
          background: rgba(0, 0, 0, 0.08) !important;
          color: #0176d3 !important;
        }
        .sf-quick-remove-btn:hover {
          color: #ba0517 !important;
          background: #fedfe0 !important;
        }
        /* Native, flat, non-intrusive Salesforce SLDS icon button */
        .sf-native-bookmark-btn {
          position: absolute !important;
          right: 6px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          z-index: 9999 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 24px !important;
          height: 24px !important;
          background: transparent !important;
          border: none !important;
          border-radius: 4px !important;
          cursor: pointer !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          opacity: 0.75 !important;
          visibility: visible !important;
          pointer-events: auto !important;
          transition: background 0.12s ease !important;
        }
        .sf-native-bookmark-btn:hover {
          background: rgba(0, 0, 0, 0.06) !important;
          opacity: 1 !important;
        }
        .sf-native-bookmark-btn:hover svg path {
          stroke: ${accent} !important;
        }
        .sf-native-bookmark-btn.is-bookmarked {
          opacity: 1 !important;
          background: transparent !important;
        }
        .sf-native-bookmark-btn.is-bookmarked:hover {
          background: rgba(1, 118, 211, 0.1) !important;
        }
        .sf-native-bookmark-btn svg,
        .sf-quick-item-icon svg {
          pointer-events: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    function bindQuickControl(btn, action) {
      let triggered = false;
      const run = (e) => {
        if (triggered) return;
        triggered = true;
        setTimeout(() => {
          triggered = false;
        }, 250);
        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
        action();
      };

      btn.addEventListener(
        'pointerdown',
        (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true
      );

      btn.addEventListener(
        'mousedown',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true
      );

      btn.addEventListener(
        'mouseup',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          run(e);
        },
        true
      );

      btn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          run(e);
        },
        true
      );
    }

    function bindBookmarkButtonEvents(btn, container, label, objectName) {
      btn._container = container;
      btn._label = label;
      btn._objectName = objectName;

      if (btn._eventsBound) return;
      btn._eventsBound = true;

      let triggered = false;
      const runToggle = (e) => {
        if (triggered) return;
        triggered = true;
        setTimeout(() => {
          triggered = false;
        }, 250);

        if (e) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }

        const curContainer = btn._container || container;
        const curLabel = btn._label || label;
        const curObjectName = btn._objectName || objectName;

        let filterId = extractListViewId(curContainer);
        let rawUrl = null;

        if (filterId) {
          rawUrl = `/lightning/o/${curObjectName}/list?filterName=${encodeURIComponent(filterId)}`;
        } else if (window.location.search.includes('filterName=')) {
          const m = window.location.search.match(/filterName=([^&#]+)/);
          if (m && m[1]) {
            const currentFilter = decodeURIComponent(m[1]);
            const headerEl = document.querySelector('.slds-page-header__title, .entityName, h1');
            const headerTxt = (headerEl ? headerEl.textContent : '').trim();
            if (headerTxt.includes(curLabel)) {
              filterId = currentFilter;
              rawUrl = `/lightning/o/${curObjectName}/list?filterName=${encodeURIComponent(filterId)}`;
            }
          }
        }

        if (!filterId) {
          filterId = curLabel;
          rawUrl = `/lightning/o/${curObjectName}/list?filterName=${encodeURIComponent(filterId)}`;
        }

        toggleBookmarkView({
          id: filterId,
          name: curLabel,
          url: rawUrl,
          objectName: curObjectName
        });
      };

      // Suppress pointerdown bubbling to native row
      btn.addEventListener(
        'pointerdown',
        (e) => {
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true
      );

      // Prevent mousedown from stealing focus (prevents search box blur and menu auto-closing)
      btn.addEventListener(
        'mousedown',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        },
        true
      );

      // Trigger on mouseup in capture phase so native option selection handler never runs
      btn.addEventListener(
        'mouseup',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          runToggle(e);
        },
        true
      );

      // Also trigger on click (deduplicated)
      btn.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          runToggle(e);
        },
        true
      );
    }

    function getPageListViewId() {
      // 1. Check window.location query/hash/href
      for (const urlStr of [window.location.search, window.location.href, window.location.hash]) {
        if (!urlStr) continue;
        const m = urlStr.match(/filterName=([^&#]+)/);
        if (m && m[1]) {
          const decoded = decodeURIComponent(m[1]);
          if (decoded.startsWith('00B') || decoded === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(decoded)) {
            if (!decoded.includes(' ')) return decoded;
          }
        }
        const m00B = urlStr.match(/00B[a-zA-Z0-9]{12,15}/);
        if (m00B) return m00B[0];
      }
      return null;
    }

    function getPageListViewTitle(objectName) {
      const normObj = (objectName || '').toLowerCase().trim();

      const rootsToSearch = [document];
      if (typeof trackedShadowRoots !== 'undefined') {
        for (const sr of trackedShadowRoots) {
          if (sr && sr.isConnected !== false) {
            const hTag = (sr.host?.tagName || '').toLowerCase();
            if (hTag.includes('picker') || hTag.includes('header') || hTag.includes('combobox')) {
              rootsToSearch.push(sr);
            }
          }
        }
      }

      for (const root of rootsToSearch) {
        try {
          // 1. Dropdown trigger button title attribute: e.g. "Select a List View: All Open Cases"
          const btnTriggers = root.querySelectorAll(
            'button[title*="Select a List View" i], a[title*="Select a List View" i], button[aria-label*="Select a List View" i], a[aria-label*="Select a List View" i]'
          );
          for (const btn of btnTriggers) {
            const titleAttr = btn.getAttribute('title') || btn.getAttribute('aria-label') || '';
            const m = titleAttr.match(/Select a List View:\s*(.+)/i);
            if (m && m[1]) {
              const name = m[1].trim();
              if (name && name.toLowerCase() !== normObj && name.toLowerCase() !== `${normObj}s`) {
                return name;
              }
            }
          }

          // 2. Trigger text inside the header
          const triggerEls = root.querySelectorAll(
            '.slds-page-header .triggerLinkText, .forceListViewPicker .triggerLinkText, button.slds-button .triggerLinkText, .slds-page-header__title .triggerLinkText, .slds-page-header__name-title .slds-page-header__title, .listViewPicker .slds-button__label'
          );
          for (const el of triggerEls) {
            const txt = (el.innerText || el.textContent || '').trim();
            if (txt && txt.toLowerCase() !== normObj && txt.toLowerCase() !== `${normObj}s` && !txt.startsWith('Select a List View')) {
              return txt;
            }
          }
        } catch (_) {}
      }

      // 3. Document title (Salesforce standard format: "<ListViewName> | <ObjectName> | Salesforce")
      if (document.title && document.title.includes('|')) {
        const parts = document.title.split('|').map((s) => s.trim());
        if (parts.length >= 2) {
          const firstPart = parts[0];
          if (firstPart && firstPart.toLowerCase() !== normObj && firstPart.toLowerCase() !== `${normObj}s` && firstPart !== 'Salesforce') {
            return firstPart;
          }
        }
      }

      return null;
    }

    function getCurrentActiveListView(objectName, popover) {
      let label = null;
      let id = null;

      // 1. Check if a native option in the dropdown is marked as selected
      if (popover) {
        const nativeSelected = popover.querySelector(
          '.slds-listbox__item [aria-selected="true"], .slds-listbox__item [aria-checked="true"], .slds-listbox__item .slds-is-selected, [role="option"][aria-selected="true"], [role="option"][aria-checked="true"], [role="option"].slds-is-selected, lightning-base-combobox-item[aria-checked="true"], lightning-base-combobox-item[aria-selected="true"]'
        );
        if (nativeSelected && !nativeSelected.closest('.sf-quick-views-wrapper')) {
          label = (nativeSelected.innerText || nativeSelected.textContent || '').trim().split('\n')[0].trim();
          label = label.replace(/[✕▲▼].*$/, '').trim();
          id = extractListViewId(nativeSelected);
        }
      }

      // 2. Fallbacks for label
      if (!label) {
        label = getPageListViewTitle(objectName);
      }

      // 3. Fallbacks for id
      if (!id) {
        id = getPageListViewId();
      }

      return { label: label || null, id: id || null };
    }

    function isQuickViewSelected(view, activeView) {
      if (!activeView) return false;
      if (activeView.id && view.id && (activeView.id === view.id || view.id.startsWith(activeView.id))) {
        return true;
      }
      if (activeView.label && view.name) {
        const vName = view.name.toLowerCase().trim();
        const aLabel = activeView.label.toLowerCase().trim();
        if (vName === aLabel) return true;
        if (vName.startsWith(aLabel) || aLabel.startsWith(vName)) return true;
        const cleanV = vName.replace(/[^a-z0-9]/g, '');
        const cleanA = aLabel.replace(/[^a-z0-9]/g, '');
        if (cleanV && cleanA && (cleanV === cleanA || cleanV.startsWith(cleanA) || cleanA.startsWith(cleanV))) return true;
      }
      return false;
    }

    function renderQuickViewsSection(container, quickViews, objectName, popover) {
      container.style.display = '';

      const activeView = getCurrentActiveListView(objectName, popover);
      const dataSignature = JSON.stringify(quickViews) + '|' + (activeView.id || '') + '|' + (activeView.label || '');
      if (container._lastSignature === dataSignature) {
        return;
      }
      container._lastSignature = dataSignature;

      container.innerHTML = '';

      const headerRow = document.createElement('div');
      headerRow.className = 'sf-quick-header-row';

      const headerLeft = document.createElement('div');
      headerLeft.className = 'sf-quick-header-title';
      headerLeft.innerHTML = `<span>${getBookmarkSVG(true)}</span><span>QUICK VIEWS</span> <span class="sf-quick-count">(${quickViews.length})</span>`;

      headerRow.appendChild(headerLeft);
      container.appendChild(headerRow);

      if (quickViews.length === 0) {
        const emptyHint = document.createElement('div');
        emptyHint.className = 'sf-quick-empty-hint';
        emptyHint.style.cssText = 'padding: 8px 12px; font-size: 11px; color: var(--sf-qv-muted, #706e6b); font-style: italic; user-select: none; line-height: 1.4;';
        emptyHint.innerHTML = `Click the bookmark icon <span style="display:inline-flex; vertical-align:middle; margin:0 2px;">${getBookmarkSVG(false)}</span> on any list view below to pin it here.`;
        container.appendChild(emptyHint);
        return;
      }

      const ul = document.createElement('ul');
      ul.className = 'sf-quick-list';
      ul.setAttribute('role', 'presentation');

      quickViews.forEach((view, index) => {
        const isSelected = isQuickViewSelected(view, activeView);

        const li = document.createElement('li');
        li.className = 'sf-quick-item' + (isSelected ? ' slds-is-selected' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        li.dataset.viewName = view.name;

        const icon = document.createElement('span');
        icon.className = 'sf-quick-item-icon';
        if (isSelected) {
          icon.innerHTML = getCheckmarkSVG();
        } else {
          icon.innerHTML = `<span style="display:inline-block; width:14px; height:14px;"></span>`;
        }

        const label = document.createElement('span');
        label.className = 'sf-quick-item-label';
        label.title = view.name;
        label.textContent = view.name;

        const controls = document.createElement('div');
        controls.className = 'sf-quick-item-controls';

        if (index > 0) {
          const upBtn = document.createElement('button');
          upBtn.className = 'sf-quick-control-btn sf-quick-move-up';
          upBtn.title = 'Move up';
          upBtn.textContent = '▲';
          bindQuickControl(upBtn, () => moveQuickViewUp(index, objectName));
          controls.appendChild(upBtn);
        }

        if (index < quickViews.length - 1) {
          const downBtn = document.createElement('button');
          downBtn.className = 'sf-quick-control-btn sf-quick-move-down';
          downBtn.title = 'Move down';
          downBtn.textContent = '▼';
          bindQuickControl(downBtn, () => moveQuickViewDown(index, objectName));
          controls.appendChild(downBtn);
        }

        const removeBtn = document.createElement('button');
        removeBtn.className = 'sf-quick-control-btn sf-quick-remove-btn';
        removeBtn.title = 'Remove from Quick Views';
        removeBtn.textContent = '✕';
        bindQuickControl(removeBtn, () => removeQuickView(view.name, objectName));
        controls.appendChild(removeBtn);

        li.appendChild(icon);
        li.appendChild(label);
        li.appendChild(controls);

        li.addEventListener('click', (e) => {
          onQuickViewItemClick(view, e, objectName, popover);
        });

        ul.appendChild(li);
      });

      container.appendChild(ul);
    }

    /**
     * Attach exactly one flat, native bookmark button per unique view entry
     */
    function attachNativeBookmarkButtons(rowsWithLabels, quickViews, objectName, popover) {
      const bookmarkedIds = new Set(
        quickViews.map((v) => v.id).filter((id) => id && (id.startsWith('00B') || id === 'Recent'))
      );
      const bookmarkedNames = new Set(quickViews.map((v) => v.name));

      for (const { row, label } of rowsWithLabels) {
        const rowId = extractListViewId(row);
        const isBookmarked = (rowId && bookmarkedIds.has(rowId)) || bookmarkedNames.has(label);

        // Target the row's own distinct list item container so the button positions relative to THAT row
        const hostEl = (row.closest && (row.closest('li.slds-listbox__item') || row.closest('lightning-base-combobox-item'))) || row.parentElement || row;

        // Ensure shadow root styles for Quick Views are synced to this row's root
        const rootNode = hostEl.getRootNode ? hostEl.getRootNode() : null;
        if (rootNode && rootNode !== document) {
          syncQuickViewsStyleToRoot(rootNode);
        }

        // Check if button for this view already exists anywhere in hostEl
        let existingBtn = hostEl.querySelector ? hostEl.querySelector(`.sf-native-bookmark-btn[data-view-label="${CSS.escape(label)}"]`) : null;
        if (!existingBtn) {
          const directBtn = hostEl.querySelector ? hostEl.querySelector('.sf-native-bookmark-btn') : null;
          if (directBtn && directBtn.dataset.viewLabel === label) existingBtn = directBtn;
        }

        if (existingBtn) {
          existingBtn.dataset.viewLabel = label;
          existingBtn.innerHTML = getBookmarkSVG(isBookmarked);
          existingBtn.title = isBookmarked ? `Remove '${label}' from Quick Views` : `Save '${label}' to Quick Views`;
          if (isBookmarked) existingBtn.classList.add('is-bookmarked');
          else existingBtn.classList.remove('is-bookmarked');
          bindBookmarkButtonEvents(existingBtn, hostEl, label, objectName);
          continue;
        }

        // Attach a single clean, flat SLDS bookmark button
        const bookmarkBtn = document.createElement('button');
        bookmarkBtn.className = 'sf-native-bookmark-btn' + (isBookmarked ? ' is-bookmarked' : '');
        bookmarkBtn.type = 'button';
        bookmarkBtn.dataset.viewLabel = label;
        bookmarkBtn.title = isBookmarked ? `Remove '${label}' from Quick Views` : `Save '${label}' to Quick Views`;
        bookmarkBtn.innerHTML = getBookmarkSVG(isBookmarked);

        if (hostEl.style) {
          hostEl.style.setProperty('position', 'relative', 'important');
          hostEl.style.setProperty('padding-right', '36px', 'important');
        }

        hostEl.appendChild(bookmarkBtn);
        bindBookmarkButtonEvents(bookmarkBtn, hostEl, label, objectName);
      }
    }

    function setupSearchInputFilter(popover, listContainer, objectName) {
      const hostCombobox = popover.closest ? popover.closest('lightning-base-combobox, lst-list-view-picker, lst-list-view-picker-dropdown, .slds-combobox') : null;
      const searchContext = hostCombobox || popover;

      const inputs = searchContext.querySelectorAll ? searchContext.querySelectorAll(
        'input[placeholder*="Search lists" i], input[aria-label*="Search lists" i], input.slds-combobox__input'
      ) : [];

      inputs.forEach((searchInput) => {
        if (searchInput._sfFilterBound) return;
        searchInput._sfFilterBound = true;

        const onSearch = () => {
          const query = (searchInput.value || '').trim().toLowerCase();
          const rootNode = popover.getRootNode ? popover.getRootNode() : null;
          const quickWrapper = searchContext.querySelector?.('.sf-quick-views-wrapper') ||
                               popover.querySelector?.('.sf-quick-views-wrapper') ||
                               (rootNode && rootNode.querySelector ? rootNode.querySelector('.sf-quick-views-wrapper') : null) ||
                               document.querySelector('.sf-quick-views-wrapper');
          if (quickWrapper) {
            const currentViews = getQuickViews(objectName || getCurrentObjectName());
            if (currentViews.length === 0) {
              quickWrapper.style.display = 'none';
            } else if (!query) {
              quickWrapper.style.display = '';
              const items = quickWrapper.querySelectorAll('.sf-quick-item');
              items.forEach((it) => (it.style.display = ''));
            } else {
              let matchCount = 0;
              const items = quickWrapper.querySelectorAll('.sf-quick-item');
              items.forEach((it) => {
                const name = (it.dataset.viewName || '').toLowerCase();
                if (name.includes(query)) {
                  it.style.display = 'flex';
                  matchCount++;
                } else {
                  it.style.display = 'none';
                }
              });
              quickWrapper.style.display = matchCount > 0 ? '' : 'none';
            }
          }

          // Search results re-rendered: attach buttons with debounce
          scheduleQuickViewsCheck(50);
        };

        searchInput.addEventListener('input', onSearch);
        searchInput.addEventListener('keyup', onSearch);
      });
    }

    /**
     * Complete synchronization & reconciliation for List View renames and ID migrations
     */
    function syncAndReconcileQuickViews(objectName, popover, rowsWithLabels = []) {
      if (!objectName) return false;
      const quickViews = getQuickViews(objectName);
      if (quickViews.length === 0) return false;

      let viewsChanged = false;
      const activeView = getCurrentActiveListView(objectName, popover);

      // 1. Synchronize from current active page view (URL & Page Title)
      if (activeView.id && (activeView.id.startsWith('00B') || activeView.id === 'Recent') && activeView.label) {
        const qvById = quickViews.find((v) => v.id === activeView.id);
        if (qvById) {
          if (qvById.name !== activeView.label) {
            qvById.name = activeView.label;
            qvById.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(activeView.id)}`;
            viewsChanged = true;
          }
        } else {
          // Check if a quick view has this URL or was bookmarked with matching URL
          const qvByUrl = quickViews.find((v) => v.url && v.url.includes(activeView.id));
          if (qvByUrl) {
            qvByUrl.id = activeView.id;
            qvByUrl.name = activeView.label;
            qvByUrl.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(activeView.id)}`;
            viewsChanged = true;
          }
        }
      }

      // 2. Synchronize from visible native rows in dropdown
      const matchedNativeIds = new Set();
      const matchedNativeLabels = new Set();
      const claimedQvIndices = new Set();

      for (const { row, label } of rowsWithLabels) {
        const realId = extractListViewId(row);
        if (realId && (realId.startsWith('00B') || realId === 'Recent' || /^[a-zA-Z0-9_]{3,40}$/.test(realId))) {
          // Exact ID match: rename sync!
          const qvIdx = quickViews.findIndex((v) => v.id && v.id === realId);
          if (qvIdx >= 0) {
            claimedQvIndices.add(qvIdx);
            matchedNativeIds.add(realId);
            matchedNativeLabels.add(label);
            if (quickViews[qvIdx].name !== label) {
              quickViews[qvIdx].name = label;
              quickViews[qvIdx].url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(realId)}`;
              viewsChanged = true;
            }
          } else {
            // Label match: upgrade legacy view missing authentic 00B ID
            const qvLabelIdx = quickViews.findIndex((v) => v.name === label);
            if (qvLabelIdx >= 0) {
              claimedQvIndices.add(qvLabelIdx);
              matchedNativeIds.add(realId);
              matchedNativeLabels.add(label);
              if (!quickViews[qvLabelIdx].id || !quickViews[qvLabelIdx].id.startsWith('00B') || quickViews[qvLabelIdx].id.includes(' ')) {
                quickViews[qvLabelIdx].id = realId;
                quickViews[qvLabelIdx].url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(realId)}`;
                viewsChanged = true;
              }
            }
          }
        }
      }

      // 3. Reconcile Orphaned Quick Views against Unclaimed Native Rows
      // If a view was renamed, its old name no longer matches any native row.
      if (rowsWithLabels.length > 0) {
        const orphanedQuickViews = [];
        quickViews.forEach((v, idx) => {
          if (!claimedQvIndices.has(idx)) {
            const existsInNative = rowsWithLabels.some((r) => r.label === v.name);
            if (!existsInNative) {
              orphanedQuickViews.push({ view: v, index: idx });
            }
          }
        });

        const unclaimedNativeRows = rowsWithLabels.filter(({ row, label }) => {
          const realId = extractListViewId(row);
          return !matchedNativeLabels.has(label) && (!realId || !matchedNativeIds.has(realId));
        });

        // If active view is in unclaimed native rows and we have orphaned quick views:
        if (activeView.label && orphanedQuickViews.length > 0) {
          const activeUnclaimed = unclaimedNativeRows.find((r) => r.label === activeView.label);
          if (activeUnclaimed) {
            const targetOrphan = orphanedQuickViews[0];
            const realId = extractListViewId(activeUnclaimed.row) || activeView.id || activeView.label;
            targetOrphan.view.id = realId;
            targetOrphan.view.name = activeUnclaimed.label;
            targetOrphan.view.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(realId)}`;
            viewsChanged = true;
            claimedQvIndices.add(targetOrphan.index);
            matchedNativeLabels.add(activeUnclaimed.label);
          }
        }

        // If 1-to-1 correspondence remains:
        if (orphanedQuickViews.length === 1 && unclaimedNativeRows.length === 1) {
          const targetOrphan = orphanedQuickViews[0];
          if (!claimedQvIndices.has(targetOrphan.index)) {
            const unclaimed = unclaimedNativeRows[0];
            const realId = extractListViewId(unclaimed.row) || unclaimed.label;
            targetOrphan.view.id = realId;
            targetOrphan.view.name = unclaimed.label;
            targetOrphan.view.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(realId)}`;
            viewsChanged = true;
          }
        }
      }

      if (viewsChanged) {
        saveQuickViews(objectName, quickViews);
      }

      return viewsChanged;
    }

    /**
     * Intercept and observe native Salesforce Rename List View modal
     */
    function setupRenameModalListener() {
      document.addEventListener(
        'click',
        (e) => {
          const targetEl = e.target && e.target.nodeType === 1 ? e.target : e.target?.parentElement;
          const btn = targetEl?.closest ? targetEl.closest('button, input[type="submit"]') : null;
          if (!btn) return;
          const btnTxt = (btn.innerText || btn.textContent || btn.value || '').trim().toLowerCase();
          if (btnTxt !== 'save' && btnTxt !== 'done') return;

          const modal = btn.closest('[role="dialog"], .slds-modal, .panelContent, .modal-container');
          if (!modal) return;

          const modalTitleEl = modal.querySelector('.slds-modal__header, h2, .title');
          const modalTitle = (modalTitleEl ? modalTitleEl.textContent : '').toLowerCase();
          const isRenameModal =
            modalTitle.includes('rename') ||
            modalTitle.includes('list view') ||
            modalTitle.includes('edit');

          if (!isRenameModal) return;

          const nameInput = modal.querySelector('input[type="text"].slds-input, input[name="name"], input[name="label"], input.slds-input');
          if (!nameInput || !nameInput.value) return;

          const newName = nameInput.value.trim();
          const objectName = getCurrentObjectName();
          if (!objectName) return;
          const active = getCurrentActiveListView(objectName);
          const oldName = active.label;

          if (newName && oldName && newName !== oldName) {
            const qvs = getQuickViews(objectName);
            let updated = false;
            qvs.forEach((v) => {
              if (v.name === oldName || (active.id && v.id === active.id)) {
                v.name = newName;
                if (active.id) {
                  v.id = active.id;
                  v.url = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(active.id)}`;
                }
                updated = true;
              }
            });
            if (updated) {
              saveQuickViews(objectName, qvs);
              refreshQuickViewsUI();
            }
          }
        },
        true
      );
    }

    function checkAndInjectQuickViews() {
      const _settings = getEnhancerSettings();
      if (_settings.modules && _settings.modules.quickViews === false) {
        const existingWrapper = document.querySelector('.sf-quick-views-wrapper');
        if (existingWrapper) existingWrapper.remove();
        document.querySelectorAll('.sf-native-bookmark-btn').forEach((btn) => btn.remove());
        const qvStyle = document.getElementById('sf-quick-views-style');
        if (qvStyle) qvStyle.remove();
        if (typeof trackedShadowRoots !== 'undefined') {
          for (const sr of trackedShadowRoots) {
            try {
              const srWrapper = sr.querySelector ? sr.querySelector('.sf-quick-views-wrapper') : null;
              if (srWrapper) srWrapper.remove();
              sr.querySelectorAll ? sr.querySelectorAll('.sf-native-bookmark-btn').forEach((btn) => btn.remove()) : null;
              const srStyle = sr.querySelector ? sr.querySelector('#sf-quick-views-shadow-style') : null;
              if (srStyle) srStyle.remove();
            } catch (_) {}
          }
        }
        return;
      }
      const ctx = findListViewDropdownContext();
      if (!ctx || !ctx.objectName) return;

      const { popover, listContainer, itemWrapper, headerEl, objectName } = ctx;
      if (popover) {
        observeShadowRoot(popover);
      }

      ensureQuickViewsStylesInjected();

      isInternalDOMUpdate = true;
      try {
        const oldWrapper = document.querySelector('.sf-pinned-section-wrapper');
        if (oldWrapper) oldWrapper.remove();

        // 1. Scan dropdown rows
        const rowsWithLabels = findDropdownRows(popover, headerEl);

        // 2. Auto-sync renames and repair any invalid IDs
        syncAndReconcileQuickViews(objectName, popover, rowsWithLabels);

        // Re-read quickViews after sync so UI always displays latest
        const quickViews = getQuickViews(objectName);

        // 3. Inject and render Quick Views section (guarantee strictly 1 wrapper across the entire popover/document)
        const existingInPopover = popover.querySelectorAll ? Array.from(popover.querySelectorAll('.sf-quick-views-wrapper')) : [];
        const popoverRoot = popover.getRootNode ? popover.getRootNode() : null;
        const existingInRoot = (popoverRoot && popoverRoot !== document && popoverRoot.querySelectorAll)
          ? Array.from(popoverRoot.querySelectorAll('.sf-quick-views-wrapper'))
          : [];
        const existingInDoc = Array.from(document.querySelectorAll('.sf-quick-views-wrapper'));
        const allExisting = Array.from(new Set([...existingInPopover, ...existingInRoot, ...existingInDoc]));

        // Prune any wrapper that is invalid or is an ancestor of / equal to listContainer
        for (let i = allExisting.length - 1; i >= 0; i--) {
          const el = allExisting[i];
          if (!el || (listContainer && (el.contains(listContainer) || el === listContainer))) {
            try { el.remove(); } catch (_) {}
            allExisting.splice(i, 1);
          }
        }

        let quickWrapper = null;
        if (allExisting.length > 0) {
          const inContainer = allExisting.find((el) => listContainer && listContainer.contains(el));
          quickWrapper = inContainer || allExisting[0];
          for (let i = 0; i < allExisting.length; i++) {
            if (allExisting[i] !== quickWrapper) {
              try { allExisting[i].remove(); } catch (_) {}
            }
          }
        }

        if (listContainer) {
          let insertBeforeEl = (itemWrapper && itemWrapper.parentElement === listContainer) ? itemWrapper : listContainer.firstElementChild;
          if (insertBeforeEl === quickWrapper) {
            insertBeforeEl = quickWrapper.nextElementSibling;
          }
          if (insertBeforeEl && insertBeforeEl.parentElement !== listContainer) {
            insertBeforeEl = null;
          }

          try {
            if (!quickWrapper) {
              const isUl = listContainer.tagName === 'UL' || listContainer.tagName === 'OL';
              quickWrapper = document.createElement(isUl ? 'li' : 'div');
              quickWrapper.className = 'sf-quick-views-wrapper';
              quickWrapper.setAttribute('role', 'presentation');
              listContainer.insertBefore(quickWrapper, insertBeforeEl);
            } else if (quickWrapper.parentElement !== listContainer) {
              if (!quickWrapper.contains(listContainer) && listContainer !== quickWrapper) {
                listContainer.insertBefore(quickWrapper, insertBeforeEl);
              }
            }
            if (quickWrapper && quickWrapper.classList) {
              quickWrapper.classList.remove('slds-listbox__item');
            }
          } catch (insertErr) {
            console.warn('[Salesforce Enhancer] Could not insert quick views wrapper:', insertErr);
            return;
          }
          renderQuickViewsSection(quickWrapper, quickViews, objectName, popover);
        }

        // 4. Attach buttons strictly 1 per unique view entry
        attachNativeBookmarkButtons(rowsWithLabels, quickViews, objectName, popover);

        setupSearchInputFilter(popover, listContainer, objectName);
      } finally {
        isInternalDOMUpdate = false;
      }
    }

    function refreshQuickViewsUI() {
      const quickWrapper = document.querySelector('.sf-quick-views-wrapper');
      if (quickWrapper) {
        quickWrapper._lastSignature = null;
      }
      checkAndInjectQuickViews();
    }

    // Observer on DOM mutations ignoring internal updates and tab drag operations
    let checkScheduled = false;
    let quickViewsDebounceTimer = null;

    function scheduleQuickViewsCheck(delay = 50) {
      if (activeTabDragState || isInternalWorkspaceCall || isInternalDOMUpdate) return;
      clearTimeout(quickViewsDebounceTimer);
      quickViewsDebounceTimer = setTimeout(() => {
        if (!activeTabDragState && !isInternalWorkspaceCall && !isInternalDOMUpdate) {
          checkAndInjectQuickViews();
        }
      }, delay);
    }

    dropdownObserver = new MutationObserver((mutations) => {
      if (isInternalDOMUpdate || activeTabDragState || isInternalWorkspaceCall) return;

      let hasRelevantAddedNode = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        const added = m.addedNodes;
        for (let j = 0; j < added.length; j++) {
          const n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.classList?.contains('sf-native-bookmark-btn') || n.closest?.('.sf-quick-views-wrapper')) {
            continue;
          }
          hasRelevantAddedNode = true;
          break;
        }
        if (hasRelevantAddedNode) break;
      }
      if (!hasRelevantAddedNode) return;

      if (checkScheduled) return;
      checkScheduled = true;
      requestAnimationFrame(() => {
        checkScheduled = false;
        if (activeTabDragState || isInternalWorkspaceCall || isInternalDOMUpdate) return;
        checkAndInjectQuickViews();
        syncHomeIconNavContext();
        const _s = getEnhancerSettings();
        if (_s.modules?.theming === true) {
          const tKey = (_s.theme && _s.theme.preset) || 'classic';
          const bTheme = THEMES[tKey] || THEMES['classic'];
          if (bTheme && bTheme.isDark) {
            themeSearchAssistantDOM(bTheme);
            if (typeof syncStylesToSameOriginIframes === 'function') {
              syncStylesToSameOriginIframes();
            }
          }
        }
      });
    });

    const targetToObserve = document.documentElement || document.body;
    if (targetToObserve) {
      try {
        dropdownObserver.observe(targetToObserve, { childList: true, subtree: true });
      } catch (_) {}
    }
    if (typeof trackedShadowRoots !== 'undefined') {
      pruneTrackedShadowRoots();
      for (const sr of trackedShadowRoots) {
        observeShadowRoot(sr);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        const bodyTarget = document.body || document.documentElement;
        if (bodyTarget) {
          try {
            dropdownObserver.observe(bodyTarget, { childList: true, subtree: true });
          } catch (_) {}
        }
        if (typeof trackedShadowRoots !== 'undefined') {
          pruneTrackedShadowRoots();
          for (const sr of trackedShadowRoots) {
            observeShadowRoot(sr);
          }
        }
        checkAndInjectQuickViews();
      });
    }

    function isListViewOrSearchInteraction(e) {
      const path = typeof e.composedPath === 'function' ? e.composedPath() : [e.target];
      for (let i = 0; i < path.length && i < 15; i++) {
        const node = path[i];
        if (!node || node.nodeType !== 1) continue;
        const tag = (node.tagName || '').toLowerCase();
        const cls = typeof node.className === 'string' ? node.className.toLowerCase() : '';
        const title = (node.getAttribute?.('title') || node.getAttribute?.('aria-label') || '').toLowerCase();
        const placeholder = (node.getAttribute?.('placeholder') || '').toLowerCase();

        // Specific to the list view switcher dropdown/picker
        if (
          tag.includes('list-view-picker') ||
          tag.includes('forcelistviewpicker') ||
          cls.includes('forcelistviewpicker') ||
          cls.includes('listviewpicker') ||
          cls.includes('triggerlink') ||
          title.includes('select a list view') ||
          title.includes('search lists') ||
          placeholder.includes('search lists')
        ) {
          return 'listview';
        }

        // Search inputs/containers (global search, table search like "Search this list...", etc.)
        if (
          tag === 'input' ||
          tag.includes('search') ||
          cls.includes('search') ||
          placeholder.includes('search')
        ) {
          return 'search';
        }
      }
      return null;
    }

    // Targeted click & focus handlers (only run when interacting with list view pickers or search)
    window.addEventListener(
      'click',
      (e) => {
        if (activeTabDragState) return;
        const interactionType = isListViewOrSearchInteraction(e);
        if (interactionType === 'listview') {
          scheduleQuickViewsCheck(40);
          setTimeout(() => scheduleQuickViewsCheck(10), 180);
        }
        if (interactionType === 'search') {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 20);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 140);
            }
          }
        }
      },
      true
    );

    window.addEventListener(
      'focusin',
      (e) => {
        if (activeTabDragState) return;
        const interactionType = isListViewOrSearchInteraction(e);
        if (interactionType === 'listview') {
          scheduleQuickViewsCheck(40);
          setTimeout(() => scheduleQuickViewsCheck(10), 180);
        }
        if (interactionType === 'search') {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 20);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 140);
            }
          }
        }
      },
      true
    );

    window.addEventListener(
      'input',
      (e) => {
        if (activeTabDragState) return;
        const interactionType = isListViewOrSearchInteraction(e);
        if (interactionType === 'search') {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 20);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 120);
            }
          }
        }
      },
      true
    );

    setupRenameModalListener();

    // Listen for actions from extension popup / content script
    window.addEventListener('message', (event) => {
      try {
        if (!event.data) return;
        if (
          event.data.__sfEnhancerAction === 'linkInterceptorOpen' &&
          event.data.target &&
          (event.source === window || (event.origin && isAllowedSalesforceOrigin(event.origin)))
        ) {
          if (!isConsoleAppActive()) return;
          openTargetAsPrimaryTab(event.data.target, { focus: true });
          return;
        }
        if (
          (event.data.__sfEnhancerAction === 'settingsUpdated' || event.data.__sfAppearanceAction === 'applySettings') &&
          event.data.settings
        ) {
          const s = normalizeSettings(event.data.settings);
          cachedSettings = s;
          try {
            localStorage.setItem('sf_enhancer_settings', JSON.stringify(s));
            localStorage.setItem('sf_appearance_settings', JSON.stringify(s));
          } catch (_) {}
          try {
            if (document.documentElement) {
              document.documentElement.dataset.sfAppearance = JSON.stringify(s);
            }
          } catch (_) {}
          scheduleAppearanceSettings(s);
          refreshQuickViewsUI();
          if (typeof refreshInspectorMods === 'function') {
            refreshInspectorMods();
          }
        }
      } catch (_) {}
    });

    

    // Initial appearance settings apply
    applyAppearanceSettings(getEnhancerSettings());

    // Request fresh settings from extension storage in case localStorage was not primed
    window.postMessage({ __sfEnhancerAction: 'requestSettings', __sfAppearanceAction: 'requestSettings' }, '*');

    function getTabIconColor() {
      try {
        const s = getEnhancerSettings();
        if (s && s.modules?.theming === true && s.theme?.preset && s.theme.preset !== 'classic' && THEMES[s.theme.preset]) {
          return THEMES[s.theme.preset].textMuted || '#757575';
        }
      } catch (_) {}

      try {
        const otherTabs = document.querySelectorAll(
          'ul.pinnedItems > li.tabItem:not(.sf-home-tab-item), ' +
          'ul.tabBarItems > li.tabItem:not(.sf-home-tab-item), ' +
          '.navexConsoleTabContainer li.tabItem:not(.sf-home-tab-item), ' +
          'one-app-nav-bar-item-root:not(.sf-home-tab-item)'
        );
        for (const tab of otherTabs) {
          const liIcon = tab.querySelector('lightning-icon, lightning-primitive-icon');
          let shadowSvg = liIcon && liIcon.shadowRoot ? liIcon.shadowRoot.querySelector('svg') : null;
          if (!shadowSvg && liIcon && liIcon.shadowRoot) {
            const prim = liIcon.shadowRoot.querySelector('lightning-primitive-icon');
            if (prim && prim.shadowRoot) shadowSvg = prim.shadowRoot.querySelector('svg');
          }
          const icon = shadowSvg || tab.querySelector('svg, lightning-icon, lightning-primitive-icon, .slds-icon');
          if (icon) {
            const cs = window.getComputedStyle(icon);
            const col = cs.fill || cs.color;
            if (col && col !== 'none' && col !== 'transparent' && col !== 'rgba(0, 0, 0, 0)' &&
                col !== 'rgb(0, 0, 0)' && col !== 'rgb(24, 24, 24)' && col !== '#000000' && col !== '#181818') {
              return col;
            }
          }
        }
        const navMenuSvg = document.querySelector('.oneConsoleNav .navMenu svg');
        if (navMenuSvg) {
          const col = window.getComputedStyle(navMenuSvg).fill;
          if (col && col !== 'none' && col !== 'transparent' && col !== 'rgba(0, 0, 0, 0)' &&
              col !== 'rgb(0, 0, 0)' && col !== 'rgb(24, 24, 24)') {
            return col;
          }
        }
        for (const tab of otherTabs) {
          const text = tab.querySelector('.slds-truncate, a');
          if (text) {
            const cs = window.getComputedStyle(text);
            if (cs.color && cs.color !== 'rgb(0, 0, 0)' && cs.color !== 'rgb(24, 24, 24)' && cs.color !== '#000000' && cs.color !== '#181818') {
              return cs.color;
            }
          }
        }
      } catch (_) {}

      return '#757575';
    }

    function isHomeCandidateInPopupMenu(el) {
      return !!(el && el.closest && el.closest('.navMenu, section[role="dialog"], .slds-popover, .slds-dropdown, [role="menu"], [role="menuitem"], .slds-listbox, .slds-dropdown__item, .uiMenuItem, .menuItem'));
    }

    function findHomeCandidateElements() {
      const elements = new Set();
      try {
        const addIfValid = (el) => {
          if (el && !isHomeCandidateInPopupMenu(el)) elements.add(el);
        };
        document.querySelectorAll(
          '.oneConsoleNav > .appNavItems > .selectedListItem > a, ' +
          '.navexConsoleNav > .appNavItems > .selectedListItem > a, ' +
          '.tabsetHeader.slds-context-bar .slds-context-bar__object-switcher > a, ' +
          '.slds-context-bar.slds-context-bar_tabs .slds-context-bar__object-switcher > a'
        ).forEach(addIfValid);
      } catch (_) {}
      return Array.from(elements);
    }

    function syncHomeIconNavContext() {
      try {
        const s = getEnhancerSettings();
        const shouldHide = (s.modules && s.modules.subtabs !== false) && !!(s.hideAppName || s.subtabs?.hideAppName);
        const candidates = findHomeCandidateElements();
        const tabIconColor = getTabIconColor();

        try {
          if (document.documentElement) {
            document.documentElement.style.setProperty('--sf-tab-icon-color', tabIconColor);
            document.documentElement.style.removeProperty('--sf-home-tab-width');
          }
        } catch (_) {}

        // Defensive cleanup: never leave Home icon classes or inline overrides inside popup/dropdown menus
        try {
          document.querySelectorAll(
            '.navMenu .sf-home-tab-link, .slds-popover .sf-home-tab-link, section[role="dialog"] .sf-home-tab-link, .slds-dropdown .sf-home-tab-link, [role="menu"] .sf-home-tab-link, .menuItem .sf-home-tab-link, .slds-dropdown__item .sf-home-tab-link, .uiMenuItem .sf-home-tab-link'
          ).forEach((staleLink) => {
            staleLink.classList.remove('sf-home-tab-link');
            const staleIcon = staleLink.querySelector('.sf-home-icon');
            if (staleIcon) staleIcon.remove();
            ['display', 'align-items', 'justify-content', 'width', 'height', 'margin', 'padding', 'border', 'border-left', 'border-right', 'box-shadow', 'color', 'text-align', 'visibility', 'opacity'].forEach(p => staleLink.style.removeProperty(p));
            Array.from(staleLink.children).forEach(ch => ch.style.removeProperty('display'));
          });
        } catch (_) {}

        candidates.forEach((el) => {
          const target = el.tagName === 'A' ? el : (el.querySelector('a') || el);
          if (isHomeCandidateInPopupMenu(target)) return;
          const appNavItems = target.closest('.oneConsoleNav > .appNavItems');
          const parentItem = target.closest('.slds-context-bar__object-switcher, .slds-context-bar__item, li.tabItem, one-app-nav-bar-item-root');

          if (!shouldHide) {
            target.classList.remove('sf-home-tab-link');
            if (parentItem) parentItem.classList.remove('sf-home-tab-item');
            if (appNavItems) {
              appNavItems.classList.remove('sf-home-unified-tab');
              ['display', 'align-items', 'position', 'width', 'height', 'padding', 'margin', 'border', 'border-right'].forEach(p => appNavItems.style.removeProperty(p));
              const navMenu = appNavItems.querySelector('.navMenu');
              if (navMenu) {
                ['display', 'align-items', 'height', 'width', 'padding', 'margin', 'border', 'border-right', 'box-shadow'].forEach(p => navMenu.style.removeProperty(p));
                const nmAction = navMenu.querySelector('.slds-context-bar__icon-action');
                if (nmAction) {
                  ['display', 'align-items', 'justify-content', 'width', 'height', 'padding', 'margin', 'border', 'box-shadow'].forEach(p => nmAction.style.removeProperty(p));
                }
              }
            }
            const icon = target.querySelector('.sf-home-icon');
            if (icon) icon.remove();
            ['display', 'align-items', 'justify-content', 'width', 'height', 'margin', 'padding', 'border', 'border-left', 'border-right', 'box-shadow', 'color', 'text-align', 'visibility', 'opacity'].forEach(p => target.style.removeProperty(p));
            Array.from(target.children).forEach(ch => ch.style.removeProperty('display'));
            if (parentItem) {
              parentItem.style.removeProperty('width');
              parentItem.style.removeProperty('min-width');
              parentItem.style.removeProperty('max-width');
              parentItem.style.removeProperty('flex');
              parentItem.style.removeProperty('align-self');
              parentItem.style.removeProperty('height');
              parentItem.style.removeProperty('padding');
              parentItem.style.removeProperty('margin');
              parentItem.style.removeProperty('border');
              parentItem.style.removeProperty('border-left');
              parentItem.style.removeProperty('border-right');
              parentItem.style.removeProperty('box-shadow');
              if (target.parentElement && target.parentElement !== parentItem) {
                target.parentElement.style.removeProperty('padding');
                target.parentElement.style.removeProperty('margin');
                target.parentElement.style.removeProperty('min-width');
                target.parentElement.style.removeProperty('width');
                target.parentElement.style.removeProperty('height');
                target.parentElement.style.removeProperty('display');
              }
              parentItem.querySelectorAll('button.close, button[title*="Close"], .closeButton').forEach(btn => btn.style.removeProperty('display'));
              const iconAction = parentItem.querySelector('.slds-context-bar__icon-action, .slds-context-bar__dropdown-trigger');
              if (iconAction) {
                iconAction.style.removeProperty('display');
                iconAction.style.removeProperty('border');
                iconAction.style.removeProperty('border-left');
                iconAction.style.removeProperty('border-right');
                iconAction.style.removeProperty('box-shadow');
                iconAction.style.removeProperty('background');
                iconAction.style.removeProperty('padding');
                iconAction.style.removeProperty('margin');
              }
            }
            return;
          }

          target.classList.add('sf-home-tab-link');
          target.style.setProperty('display', 'inline-flex', 'important');
          target.style.setProperty('align-items', 'center', 'important');
          target.style.setProperty('justify-content', 'center', 'important');
          target.style.setProperty('width', 'auto', 'important');
          target.style.setProperty('height', '100%', 'important');
          target.style.setProperty('margin', '0', 'important');
          target.style.setProperty('padding', '0 8px', 'important');
          target.style.setProperty('border', 'none', 'important');
          target.style.setProperty('border-left', 'none', 'important');
          target.style.setProperty('border-right', 'none', 'important');
          target.style.setProperty('box-shadow', 'none', 'important');
          target.style.setProperty('color', tabIconColor, 'important');
          target.style.setProperty('text-align', 'center', 'important');
          target.style.setProperty('visibility', 'visible', 'important');
          target.style.setProperty('opacity', '1', 'important');

          if (appNavItems) {
            appNavItems.classList.add('sf-home-unified-tab');
            appNavItems.style.setProperty('display', 'inline-flex', 'important');
            appNavItems.style.setProperty('align-items', 'stretch', 'important');
            appNavItems.style.setProperty('position', 'relative', 'important');
            appNavItems.style.setProperty('width', 'auto', 'important');
            appNavItems.style.setProperty('height', '100%', 'important');
            appNavItems.style.setProperty('padding', '0 8px 0 0', 'important');
            appNavItems.style.setProperty('margin', '0', 'important');
            appNavItems.style.setProperty('border', 'none', 'important');
            appNavItems.style.setProperty('border-right', '1px solid var(--sf-nav-divider-color, rgb(201, 201, 201))', 'important');

            if (parentItem) {
              parentItem.classList.add('sf-home-tab-item');
              parentItem.style.setProperty('display', 'inline-flex', 'important');
              parentItem.style.setProperty('align-items', 'center', 'important');
              parentItem.style.setProperty('height', '100%', 'important');
              parentItem.style.setProperty('width', 'auto', 'important');
              parentItem.style.setProperty('min-width', '0', 'important');
              parentItem.style.setProperty('max-width', 'none', 'important');
              parentItem.style.setProperty('flex', '0 0 auto', 'important');
              parentItem.style.setProperty('padding', '0', 'important');
              parentItem.style.setProperty('margin', '0', 'important');
              parentItem.style.setProperty('border', 'none', 'important');
              parentItem.style.setProperty('border-left', 'none', 'important');
              parentItem.style.setProperty('border-right', 'none', 'important');
              parentItem.style.setProperty('box-shadow', 'none', 'important');
            }

            const navMenu = appNavItems.querySelector('.navMenu');
            if (navMenu) {
              navMenu.style.setProperty('display', 'inline-flex', 'important');
              navMenu.style.setProperty('align-items', 'center', 'important');
              navMenu.style.setProperty('height', '100%', 'important');
              navMenu.style.setProperty('width', 'auto', 'important');
              navMenu.style.setProperty('padding', '0', 'important');
              navMenu.style.setProperty('margin', '0', 'important');
              navMenu.style.setProperty('border', 'none', 'important');
              navMenu.style.setProperty('border-right', 'none', 'important');
              navMenu.style.setProperty('box-shadow', 'none', 'important');
              const nmAction = navMenu.querySelector('.slds-context-bar__icon-action');
              if (nmAction) {
                nmAction.style.setProperty('display', 'flex', 'important');
                nmAction.style.setProperty('align-items', 'center', 'important');
                nmAction.style.setProperty('justify-content', 'center', 'important');
                nmAction.style.setProperty('width', '24px', 'important');
                nmAction.style.setProperty('height', '100%', 'important');
                nmAction.style.setProperty('padding', '0', 'important');
                nmAction.style.setProperty('margin', '0', 'important');
                nmAction.style.setProperty('border', 'none', 'important');
                nmAction.style.setProperty('box-shadow', 'none', 'important');
              }
            }
          } else if (parentItem) {
            parentItem.classList.add('sf-home-tab-item');
            parentItem.style.setProperty('display', 'inline-flex', 'important');
            parentItem.style.setProperty('align-items', 'center', 'important');
            parentItem.style.setProperty('justify-content', 'center', 'important');
            parentItem.style.setProperty('align-self', 'stretch', 'important');
            parentItem.style.setProperty('height', '100%', 'important');
            parentItem.style.setProperty('width', 'auto', 'important');
            parentItem.style.setProperty('min-width', '0', 'important');
            parentItem.style.setProperty('max-width', 'none', 'important');
            parentItem.style.setProperty('flex', '0 0 auto', 'important');
            parentItem.style.setProperty('padding', '0 8px 0 0', 'important');
            parentItem.style.setProperty('margin', '0', 'important');
            parentItem.style.setProperty('border', 'none', 'important');
            parentItem.style.setProperty('border-left', 'none', 'important');
            parentItem.style.setProperty('border-right', '1px solid var(--sf-nav-divider-color, rgb(201, 201, 201))', 'important');
            parentItem.style.setProperty('box-shadow', 'none', 'important');
            parentItem.style.setProperty('visibility', 'visible', 'important');
            parentItem.style.setProperty('opacity', '1', 'important');
            if (target.parentElement && target.parentElement !== parentItem) {
              target.parentElement.style.setProperty('display', 'inline-flex', 'important');
              target.parentElement.style.setProperty('align-items', 'center', 'important');
              target.parentElement.style.setProperty('height', '100%', 'important');
              target.parentElement.style.setProperty('padding', '0', 'important');
              target.parentElement.style.setProperty('margin', '0', 'important');
              target.parentElement.style.setProperty('min-width', '0', 'important');
              target.parentElement.style.setProperty('width', 'auto', 'important');
            }
            parentItem.querySelectorAll('button.close, button[title*="Close"], .closeButton').forEach(btn => btn.style.setProperty('display', 'none', 'important'));

            // Integrate the dropdown arrow seamlessly into the tab with zero divider line
            const iconAction = parentItem.querySelector('.slds-context-bar__icon-action, .slds-context-bar__dropdown-trigger');
            if (iconAction) {
              iconAction.style.setProperty('display', 'inline-flex', 'important');
              iconAction.style.setProperty('align-items', 'center', 'important');
              iconAction.style.setProperty('justify-content', 'center', 'important');
              iconAction.style.setProperty('border', 'none', 'important');
              iconAction.style.setProperty('border-left', 'none', 'important');
              iconAction.style.setProperty('border-right', 'none', 'important');
              iconAction.style.setProperty('box-shadow', 'none', 'important');
              iconAction.style.setProperty('background', 'transparent', 'important');
              iconAction.style.setProperty('padding', '0', 'important');
              iconAction.style.setProperty('margin', '0 0 0 8px', 'important');
              const arrowBtn = iconAction.querySelector('button');
              if (arrowBtn) {
                arrowBtn.style.setProperty('display', 'inline-flex', 'important');
                arrowBtn.style.setProperty('border', 'none', 'important');
                arrowBtn.style.setProperty('border-left', 'none', 'important');
                arrowBtn.style.setProperty('border-right', 'none', 'important');
                arrowBtn.style.setProperty('box-shadow', 'none', 'important');
                arrowBtn.style.setProperty('background', 'transparent', 'important');
                arrowBtn.style.setProperty('padding', '0', 'important');
                arrowBtn.style.setProperty('margin', '0', 'important');
                arrowBtn.style.setProperty('color', tabIconColor, 'important');
              }
              const arrowSvg = iconAction.querySelector('svg');
              if (arrowSvg) {
                arrowSvg.style.setProperty('fill', tabIconColor, 'important');
                arrowSvg.style.setProperty('color', tabIconColor, 'important');
                arrowSvg.style.setProperty('width', '14px', 'important');
                arrowSvg.style.setProperty('height', '14px', 'important');
                const p = arrowSvg.querySelector('path');
                if (p) p.setAttribute('fill', tabIconColor);
              }
            }
          }

          const origLabel = (
            target.dataset.sfOrigLabel ||
            target.getAttribute('title') ||
            target.getAttribute('aria-label') ||
            (target.textContent || '').trim() ||
            'Console Navigation'
          ).trim();
          if (origLabel && !target.dataset.sfOrigLabel) {
            target.dataset.sfOrigLabel = origLabel;
          }
          if (!target.getAttribute('title')) {
            target.setAttribute('title', origLabel);
          }
          if (!target.getAttribute('aria-label')) {
            target.setAttribute('aria-label', origLabel);
          }

          // Clean up any old span icons
          target.querySelectorAll('span.sf-home-icon').forEach(sp => sp.remove());

          // Ensure single-color SVG Home icon matching tab icon color
          let svg = target.querySelector('svg.sf-home-icon');
          if (!svg) {
            const svgNs = 'http://www.w3.org/2000/svg';
            svg = document.createElementNS(svgNs, 'svg');
            svg.setAttribute('class', 'sf-home-icon');
            svg.setAttribute('viewBox', '1.5 2 21 19');
            svg.setAttribute('width', '18');
            svg.setAttribute('height', '18');
            svg.setAttribute('aria-hidden', 'true');
            svg.setAttribute('style', `width: 18px !important; height: 18px !important; fill: ${tabIconColor} !important; color: ${tabIconColor} !important; display: block !important; margin: 0 !important; flex-shrink: 0 !important;`);

            const path = document.createElementNS(svgNs, 'path');
            path.setAttribute('d', 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z');
            path.setAttribute('fill', tabIconColor);
            svg.appendChild(path);

            target.appendChild(svg);
          } else {
            svg.setAttribute('viewBox', '1.5 2 21 19');
            svg.setAttribute('width', '18');
            svg.setAttribute('height', '18');
            svg.style.setProperty('width', '18px', 'important');
            svg.style.setProperty('height', '18px', 'important');
            svg.style.setProperty('fill', tabIconColor, 'important');
            svg.style.setProperty('color', tabIconColor, 'important');
            svg.style.setProperty('margin', '0', 'important');
            svg.style.setProperty('display', 'block', 'important');
            const path = svg.querySelector('path');
            if (path) path.setAttribute('fill', tabIconColor);
          }

          Array.from(target.children).forEach((child) => {
            if (child !== svg) {
              child.style.setProperty('display', 'none', 'important');
            }
          });
        });
      } catch (_) {}
    }

    // Initial page load context sync
    function syncPageContextPeriodically() {
      try {
        syncHomeIconNavContext();
        const objectName = getCurrentObjectName();
        if (objectName) {
          syncAndReconcileQuickViews(objectName, null, []);
        }
      } catch (_) {}
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', syncPageContextPeriodically);
    } else {
      syncPageContextPeriodically();
    }
    window.addEventListener('popstate', syncPageContextPeriodically);
    setTimeout(syncPageContextPeriodically, 600);
    setTimeout(syncPageContextPeriodically, 1800);

    // =========================================================================
    // COMPOSABLE DECLARATIVE PLUGIN ENGINE v2 (.sfe.json, schemaVersion: 2)
    // Executes declarative JSON plugin definitions with zero eval() or dynamic JS.
    // =========================================================================
    const modAuraCapture = { token: null, context: null };
    const modTargetCaches = new Map(); // pluginId -> Map<recordId, ctx>
    const modParentCaches = new Map(); // pluginId -> Map<contextId, { targetId, cachedAt }>
    const modInFlight = new Map(); // `${pluginId}:${recordId}` -> Promise
    const modParentInFlight = new Map(); // `${pluginId}:${contextId}` -> Promise
    const modErrorMap = new Map(); // `${pluginId}:${id}` -> { error, cachedAt }
    const modExpandedScopes = new Set();
    const modPendingQueue = [];
    let modActiveFetches = 0;
    const MOD_MAX_CONCURRENT = 3;
    const MOD_CACHE_TTL_MS = 10 * 60 * 1000;
    const MOD_PARENT_TTL_MS = 25 * 1000;
    const MOD_PARENT_NULL_TTL_MS = 4 * 1000;
    const MOD_ERROR_TTL_MS = 10 * 1000;
    const SFE_CACHE_VERSION = 'v2';

    let modMutationInvalidateTimer1 = null;
    let modMutationInvalidateTimer2 = null;
    function scheduleModMutationRefresh() {
      const doInvalidate = () => {
        for (const pMap of modParentCaches.values()) {
          for (const [k, entry] of pMap.entries()) {
            if (entry) entry.cachedAt = 0;
          }
        }
        modErrorMap.clear();
        if (typeof scheduleModDomScan === 'function') scheduleModDomScan(50);
      };
      if (modMutationInvalidateTimer1) clearTimeout(modMutationInvalidateTimer1);
      if (modMutationInvalidateTimer2) clearTimeout(modMutationInvalidateTimer2);
      modMutationInvalidateTimer1 = setTimeout(() => {
        modMutationInvalidateTimer1 = null;
        doInvalidate();
      }, 900);
      modMutationInvalidateTimer2 = setTimeout(() => {
        modMutationInvalidateTimer2 = null;
        doInvalidate();
      }, 2400);
    }

    function getModError(key) {
      const entry = modErrorMap.get(key);
      if (!entry) return null;
      if (Date.now() - entry.cachedAt >= MOD_ERROR_TTL_MS) {
        modErrorMap.delete(key);
        return null;
      }
      return entry.error;
    }

    const SFE_DEFAULT_ICON_SVG =
      'M832 160H168c-40 0-72 32-72 72v536c0 40 32 72 72 72h664c40 0 72-32 72-72V232c0-40-32-72-72-72zM300 320h400c18 0 32 14 32 32s-14 32-32 32H300c-18 0-32-14-32-32s14-32 32-32zm0 148h400c18 0 32 14 32 32s-14 32-32 32H300c-18 0-32-14-32-32s14-32 32-32zm0 148h260c18 0 32 14 32 32s-14 32-32 32H300c-18 0-32-14-32-32s14-32 32-32z';

    function extractModAuraAuthFromBody(rawBody) {
      if (typeof rawBody !== 'string') return;
      if (rawBody.includes('aura.token=')) {
        try {
          const params = new URLSearchParams(rawBody);
          const t = params.get('aura.token');
          const c = params.get('aura.context');
          if (t && t.includes('.')) modAuraCapture.token = t;
          if (c && c.startsWith('{')) modAuraCapture.context = c;
        } catch (_) {}
      }
      // Invalidate cross-object parent target caches whenever Salesforce saves/updates/creates a record
      if (/ACTION(?:\$|%24)(?:updateRecord|createRecord|deleteRecord|saveRecord)/i.test(rawBody)) {
        scheduleModMutationRefresh();
      }
    }

    try {
      const origXhrSend = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.send = function (body) {
        try {
          if (typeof body === 'string') extractModAuraAuthFromBody(body);
        } catch (_) {}
        return origXhrSend.apply(this, arguments);
      };
    } catch (_) {}

    try {
      const origFetch = window.fetch;
      if (typeof origFetch === 'function') {
        window.fetch = function (input, init) {
          try {
            if (init && typeof init.body === 'string') extractModAuraAuthFromBody(init.body);
            const method = (init && init.method ? String(init.method) : 'GET').toUpperCase();
            const urlStr = typeof input === 'string' ? input : (input && input.url ? String(input.url) : '');
            if ((method === 'PATCH' || method === 'POST' || method === 'DELETE') && /\/ui-api\/records\b/i.test(urlStr)) {
              scheduleModMutationRefresh();
            }
          } catch (_) {}
          return origFetch.apply(this, arguments);
        };
      }
    } catch (_) {}

    function resolveModAuraAuth() {
      let token = modAuraCapture.token;
      let context = modAuraCapture.context;
      const pageA = window.$A;

      if ((!token || !context) && pageA) {
        if (!token && pageA.clientService) {
          try {
            for (const k of Object.getOwnPropertyNames(pageA.clientService)) {
              const v = pageA.clientService[k];
              if (typeof v === 'string' && v.startsWith('eyJ') && v.includes('..')) {
                token = v;
                modAuraCapture.token = v;
                break;
              }
            }
          } catch (_) {}
        }
        if (!context && typeof pageA.getContext === 'function') {
          try {
            const ctxObj = pageA.getContext();
            if (ctxObj) {
              let fwuid = '';
              try {
                const scripts = document.querySelectorAll('script[src*="/auraFW/javascript/"]');
                for (const s of scripts) {
                  const m = (s.getAttribute('src') || '').match(/\/auraFW\/javascript\/([^/]+)\//);
                  if (m && m[1]) {
                    fwuid = m[1];
                    break;
                  }
                }
              } catch (_) {}
              if (!fwuid) {
                for (const k of Object.getOwnPropertyNames(ctxObj)) {
                  const v = ctxObj[k];
                  if (
                    typeof v === 'string' &&
                    v.length > 20 &&
                    v.length < 120 &&
                    /^[A-Za-z0-9_=-]+$/.test(v) &&
                    v !== 'PROD' &&
                    v !== 'one:one'
                  ) {
                    fwuid = v;
                    break;
                  }
                }
              }
              const loadedPlain = {};
              if (ctxObj.loaded && typeof ctxObj.loaded === 'object') {
                for (const k of Object.keys(ctxObj.loaded)) {
                  if (typeof ctxObj.loaded[k] === 'string') loadedPlain[k] = ctxObj.loaded[k];
                }
              }
              context = JSON.stringify({
                mode: typeof ctxObj.mode === 'string' ? ctxObj.mode : 'PROD',
                fwuid,
                app: 'one:one',
                loaded: loadedPlain,
                dn: [],
                globals: {},
                uad: true
              });
              modAuraCapture.context = context;
            }
          } catch (_) {}
        }
      }
      return { token, context };
    }

    async function modAuraCall(descriptor, params) {
      const { token, context } = resolveModAuraAuth();
      if (!token || !context) {
        throw new Error('Aura session token/context not ready yet');
      }
      const message = JSON.stringify({
        actions: [{ id: '1;a', descriptor, callingDescriptor: 'UNKNOWN', params }]
      });
      const body = new URLSearchParams({
        message,
        'aura.context': context,
        'aura.pageURI': location.pathname + location.search,
        'aura.token': token
      });
      const res = await window.fetch(new URL('/aura?r=1', location.origin).href, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString()
      });
      if (!res.ok) throw new Error(`Aura HTTP ${res.status}`);
      const json = await res.json();
      const action = json && json.actions && json.actions[0];
      if (!action || action.state !== 'SUCCESS') {
        const errMsg =
          (action && action.error && action.error[0] && action.error[0].message) ||
          `Aura state ${action ? action.state : 'UNKNOWN'}`;
        throw new Error(errMsg);
      }
      return action.returnValue;
    }

    async function modFetchRelatedRecords(parentRecordId, relatedListId, fields, pageSize = 100) {
      const res = await modAuraCall('aura://RelatedListUiController/ACTION$postRelatedListRecords', {
        parentRecordId,
        relatedListId,
        listRecordsQuery: {
          fields: Array.isArray(fields) ? fields : [],
          includeColumnLabels: false,
          optionalFields: [],
          pageSize,
          sortBy: [],
          where: ''
        }
      });
      return (res && res.records) || [];
    }

    function readAuraFieldPath(fieldsObj, path, useDisplayValue = false) {
      if (!fieldsObj || !path) return null;
      if (fieldsObj[path] && typeof fieldsObj[path] === 'object' && ('value' in fieldsObj[path] || 'displayValue' in fieldsObj[path])) {
        return useDisplayValue
          ? fieldsObj[path].displayValue ?? fieldsObj[path].value
          : fieldsObj[path].value ?? fieldsObj[path].displayValue;
      }
      const parts = String(path).split('.');
      let cur = fieldsObj;
      for (let i = 0; i < parts.length; i++) {
        if (!cur || typeof cur !== 'object') return null;
        const entry = cur[parts[i]];
        if (!entry) return null;
        if (i === parts.length - 1) {
          if (typeof entry === 'object' && ('value' in entry || 'displayValue' in entry)) {
            return useDisplayValue ? entry.displayValue ?? entry.value : entry.value ?? entry.displayValue;
          }
          return entry;
        }
        cur = (entry.value && entry.value.fields) || entry.fields || entry;
      }
      return null;
    }

    function flattenAuraFields(fieldsObj) {
      const out = {};
      if (!fieldsObj || typeof fieldsObj !== 'object') return out;
      for (const [key, entry] of Object.entries(fieldsObj)) {
        if (!entry || typeof entry !== 'object') {
          out[key] = entry;
          continue;
        }
        if (entry.value && typeof entry.value === 'object' && entry.value.fields) {
          out[key] = flattenAuraFields(entry.value.fields);
          if (entry.value.id) out[key].id = entry.value.id;
          if (entry.displayValue != null) out[`${key}__display`] = entry.displayValue;
        } else {
          out[key] = entry.value !== undefined ? entry.value : entry.displayValue ?? null;
          if (entry.displayValue != null) out[`${key}__display`] = entry.displayValue;
        }
      }
      return out;
    }

    function flattenAuraRecord(rec, fieldMap) {
      const rawFields = (rec && rec.fields) || {};
      const flat = flattenAuraFields(rawFields);
      if (rec && rec.id && !flat.id) flat.id = rec.id;
      if (rec && rec.id && !flat.Id) flat.Id = rec.id;
      if (fieldMap && typeof fieldMap === 'object') {
        for (const [alias, spec] of Object.entries(fieldMap)) {
          if (typeof spec === 'string') {
            flat[alias] = readAuraFieldPath(rawFields, spec, false);
          } else if (spec && typeof spec === 'object') {
            let val = null;
            if (Array.isArray(spec.paths)) {
              for (const p of spec.paths) {
                const candidate = readAuraFieldPath(rawFields, p, !!spec.display);
                if (candidate !== null && candidate !== undefined && candidate !== '') {
                  val = candidate;
                  break;
                }
              }
            } else if (spec.path) {
              val = readAuraFieldPath(rawFields, spec.path, !!spec.display);
            }
            if ((val === null || val === undefined || val === '') && spec.fallbackPath) {
              val = readAuraFieldPath(rawFields, spec.fallbackPath, spec.fallbackDisplay !== false);
            }
            if ((val === null || val === undefined || val === '') && spec.default !== undefined) {
              val = spec.default;
            }
            flat[alias] = val;
          }
        }
      }
      return flat;
    }

    function qualifyAuraFields(objectApiName, fields) {
      if (!Array.isArray(fields)) return [];
      const seen = new Set();
      const out = [];
      for (const raw of fields) {
        if (typeof raw !== 'string') continue;
        const f = raw.trim();
        if (!f) continue;
        const qualified = objectApiName && !f.startsWith(`${objectApiName}.`) ? `${objectApiName}.${f}` : f;
        if (!seen.has(qualified)) {
          seen.add(qualified);
          out.push(qualified);
        }
      }
      return out;
    }

    // -------------------------------------------------------------------------
    // Safe Path Resolution, Formatting, Interpolation & Condition Engine
    // -------------------------------------------------------------------------
    function getModLocalTodayIso() {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function diffModDaysIso(laterIso, earlierIso) {
      if (!laterIso || !earlierIso) return null;
      const s1 = String(laterIso).slice(0, 10);
      const s2 = String(earlierIso).slice(0, 10);
      const a = new Date(`${s1}T00:00:00`);
      const b = new Date(`${s2}T00:00:00`);
      if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
      return Math.round((a.getTime() - b.getTime()) / 86400000);
    }

    function sfeResolvePath(scope, path) {
      if (!scope || !path || typeof path !== 'string') return undefined;
      const trimmed = path.trim();
      if (!trimmed) return undefined;
      if (trimmed in scope) return scope[trimmed];
      const parts = trimmed.split('.');
      let cur = scope;
      for (let i = 0; i < parts.length; i++) {
        if (cur === null || cur === undefined) return undefined;
        const seg = parts[i];
        if (seg === '__proto__' || seg === 'constructor' || seg === 'prototype') return undefined;
        cur = cur[seg];
      }
      return cur;
    }

    function sfeFormatValue(val, fmtExpr) {
      if (!fmtExpr) {
        if (val === null || val === undefined) return '';
        if (Array.isArray(val)) return val.join(', ');
        return String(val);
      }
      const colonIdx = fmtExpr.indexOf(':');
      const fmt = (colonIdx >= 0 ? fmtExpr.slice(0, colonIdx) : fmtExpr).trim().toLowerCase();
      const arg = colonIdx >= 0 ? fmtExpr.slice(colonIdx + 1) : '';

      if (fmt === 'default') {
        return val === null || val === undefined || val === '' ? arg : String(val);
      }
      if (val === null || val === undefined || val === '') return '';
      if (fmt === 'currency') {
        const n = Number(val);
        if (Number.isFinite(n)) {
          try {
            return new Intl.NumberFormat(undefined, {
              style: 'currency',
              currency: arg.trim() || 'USD',
              maximumFractionDigits: 0
            }).format(n);
          } catch (_) {
            return `$${n.toLocaleString()}`;
          }
        }
        return String(val);
      }
      if (fmt === 'number') {
        const n = Number(val);
        return Number.isFinite(n) ? n.toLocaleString() : String(val);
      }
      if (fmt === 'upper') return String(val).toUpperCase();
      if (fmt === 'lower') return String(val).toLowerCase();
      if (fmt === 'date') return String(val).slice(0, 10);
      if (fmt === 'join') {
        return Array.isArray(val) ? val.filter(Boolean).join(arg || ', ') : String(val);
      }
      return String(val);
    }

    function sfeInterpolate(template, scope) {
      if (template === null || template === undefined) return '';
      const str = String(template);
      if (!str.includes('{{')) return str;
      return str.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawExpr) => {
        // Split format pipe (single `|`, not `||`)
        let exprPart = rawExpr;
        let fmtPart = '';
        const pipeMatch = rawExpr.match(/(?<!\|)\|(?!\|)/);
        if (pipeMatch && typeof pipeMatch.index === 'number') {
          exprPart = rawExpr.slice(0, pipeMatch.index).trim();
          fmtPart = rawExpr.slice(pipeMatch.index + 1).trim();
        }
        const candidates = exprPart.split('||').map((s) => s.trim()).filter(Boolean);
        let val = undefined;
        for (const p of candidates) {
          const v = sfeResolvePath(scope, p);
          if (v !== null && v !== undefined && v !== '') {
            val = v;
            break;
          }
        }
        return sfeFormatValue(val, fmtPart);
      });
    }

    function sfeInterpolateDeep(obj, scope) {
      if (typeof obj === 'string') return sfeInterpolate(obj, scope);
      if (Array.isArray(obj)) return obj.map((v) => sfeInterpolateDeep(v, scope));
      if (obj && typeof obj === 'object') {
        const out = {};
        for (const [k, v] of Object.entries(obj)) {
          out[k] = sfeInterpolateDeep(v, scope);
        }
        return out;
      }
      return obj;
    }

    function sfeIsPresent(val) {
      if (val === null || val === undefined || val === '') return false;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }

    function sfeEvalCondition(cond, scope) {
      if (cond === null || cond === undefined) return true;
      if (typeof cond === 'boolean') return cond;
      if (typeof cond !== 'object') return !!cond;
      if (Array.isArray(cond.all)) return cond.all.every((c) => sfeEvalCondition(c, scope));
      if (Array.isArray(cond.any)) return cond.any.some((c) => sfeEvalCondition(c, scope));
      if (cond.not !== undefined) return !sfeEvalCondition(cond.not, scope);

      const actual = sfeResolvePath(scope, cond.path);
      const expected = cond.valuePath !== undefined ? sfeResolvePath(scope, cond.valuePath) : cond.value;
      const op = String(cond.op || 'exists').toLowerCase();

      if (op === 'exists') return sfeIsPresent(actual);
      if (op === 'empty') return !sfeIsPresent(actual);
      if (op === 'istrue') return actual === true;
      if (op === 'isfalse') return !actual;
      if (op === 'eq' || op === 'neq') {
        let equal;
        if (cond.ignoreCase && typeof actual === 'string' && typeof expected === 'string') {
          equal = actual.toLowerCase() === expected.toLowerCase();
        } else {
          equal = actual === expected;
        }
        return op === 'eq' ? equal : !equal;
      }
      if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
        if (actual === null || actual === undefined || expected === null || expected === undefined || actual === '' || expected === '') {
          return false;
        }
        const na = Number(actual);
        const nb = Number(expected);
        const cmp =
          typeof actual !== 'boolean' && typeof expected !== 'boolean' && Number.isFinite(na) && Number.isFinite(nb)
            ? na - nb
            : String(actual).localeCompare(String(expected));
        if (op === 'gt') return cmp > 0;
        if (op === 'gte') return cmp >= 0;
        if (op === 'lt') return cmp < 0;
        return cmp <= 0;
      }
      if (op === 'in' || op === 'notin') {
        const list = Array.isArray(expected) ? expected : [];
        const hit = cond.ignoreCase && typeof actual === 'string'
          ? list.some((v) => typeof v === 'string' && v.toLowerCase() === actual.toLowerCase())
          : list.includes(actual);
        return op === 'in' ? hit : !hit;
      }
      if (op === 'contains' || op === 'notcontains') {
        let hit = false;
        if (Array.isArray(actual)) {
          hit = actual.includes(expected);
        } else if (actual !== null && actual !== undefined && expected !== null && expected !== undefined) {
          const aStr = String(actual);
          const eStr = String(expected);
          hit = cond.caseSensitive ? aStr.includes(eStr) : aStr.toLowerCase().includes(eStr.toLowerCase());
        }
        return op === 'contains' ? hit : !hit;
      }
      if (op === 'regex') {
        if (actual === null || actual === undefined || !expected) return false;
        try {
          return new RegExp(String(expected), cond.caseSensitive ? '' : 'i').test(String(actual));
        } catch (_) {
          return false;
        }
      }
      if (op === 'hasall') {
        const arr = Array.isArray(actual) ? actual : [];
        const req = Array.isArray(expected) ? expected : [];
        return req.length > 0 && req.every((k) => arr.includes(k));
      }
      if (op === 'hasany') {
        const arr = Array.isArray(actual) ? actual : [];
        const req = Array.isArray(expected) ? expected : [];
        return req.some((k) => arr.includes(k));
      }
      return false;
    }

    // -------------------------------------------------------------------------
    // Composable Data Pipeline Executor
    // -------------------------------------------------------------------------
    function sfeClassifyDateBucket(item, cfg, today) {
      const startDate = sfeResolvePath(item, cfg.startDateField || 'StartDate') || null;
      const endDate = sfeResolvePath(item, cfg.endDateField || 'EndDate') || null;
      const st = String(sfeResolvePath(item, cfg.statusField || 'Status') || '').toLowerCase();
      const sNorm = startDate ? String(startDate).slice(0, 10) : null;
      const eNorm = endDate ? String(endDate).slice(0, 10) : null;
      const inWindow = !!(sNorm && eNorm && sNorm <= today && eNorm >= today);
      let bucket = 'EXPIRED';
      if (st === 'active' || (inWindow && st !== 'expired')) bucket = 'ACTIVE';
      else if (sNorm && sNorm > today && st !== 'expired') bucket = 'UPCOMING';
      const refDate = bucket === 'UPCOMING' ? sNorm : eNorm;
      const daysRemaining = refDate ? diffModDaysIso(refDate, today) : null;
      const soonDays = typeof cfg.soonDays === 'number' ? cfg.soonDays : 30;
      const isExpiringSoon = bucket === 'ACTIVE' && typeof daysRemaining === 'number' && daysRemaining >= 0 && daysRemaining <= soonDays;
      return { dateBucket: bucket, startDate: sNorm, endDate: eNorm, daysRemaining, isExpiringSoon };
    }

    function sfeSortArray(arr, sortSpec, scope) {
      if (!Array.isArray(arr) || !Array.isArray(sortSpec) || !sortSpec.length) return arr;
      return arr.slice().sort((a, b) => {
        for (const s of sortSpec) {
          if (!s) continue;
          let rankMap = s.rankMap || null;
          if (!rankMap && Array.isArray(s.conditionalRankMaps)) {
            for (const crm of s.conditionalRankMaps) {
              if (!crm.when || sfeEvalCondition(crm.when, scope)) {
                rankMap = crm.rankMap || null;
                break;
              }
            }
          }
          const va = sfeResolvePath(a, s.field);
          const vb = sfeResolvePath(b, s.field);
          let cmp = 0;
          if (rankMap) {
            const ra = rankMap[va] ?? 999;
            const rb = rankMap[vb] ?? 999;
            cmp = ra - rb;
          } else {
            const missingA = va === null || va === undefined || va === '';
            const missingB = vb === null || vb === undefined || vb === '';
            if (missingA && missingB) cmp = 0;
            else if (missingA) cmp = 1;
            else if (missingB) cmp = -1;
            else {
              const na = Number(va);
              const nb = Number(vb);
              if (typeof va !== 'boolean' && typeof vb !== 'boolean' && Number.isFinite(na) && Number.isFinite(nb)) {
                cmp = na - nb;
              } else {
                cmp = String(va).localeCompare(String(vb));
              }
            }
          }
          if (cmp !== 0) {
            return String(s.dir || 'asc').toLowerCase() === 'desc' ? -cmp : cmp;
          }
        }
        return 0;
      });
    }

    function sfeEvalComputeOp(spec, ctx, currentObj) {
      const scope = Object.assign({}, ctx, currentObj ? { _self: currentObj } : null);
      if (!spec || typeof spec !== 'object') return spec;
      const op = spec.op;

      const getFilteredList = () => {
        const raw = sfeResolvePath(scope, spec.from);
        if (!Array.isArray(raw)) return [];
        if (!spec.where) return raw;
        return raw.filter((item) => sfeEvalCondition(spec.where, Object.assign({}, scope, { item })));
      };

      if (op === 'count') {
        return getFilteredList().length;
      }
      if (op === 'sum' || op === 'min' || op === 'max' || op === 'first' || op === 'last') {
        const list = getFilteredList();
        const vals = spec.field
          ? list.map((item) => sfeResolvePath(item, spec.field)).filter((v) => v !== null && v !== undefined && v !== '')
          : list.filter((v) => v !== null && v !== undefined && v !== '');
        if (!vals.length) return spec.default !== undefined ? spec.default : null;
        if (op === 'first') return vals[0];
        if (op === 'last') return vals[vals.length - 1];
        if (op === 'sum') return vals.reduce((acc, v) => acc + (Number(v) || 0), 0);
        const allNum = vals.every((v) => typeof v !== 'boolean' && Number.isFinite(Number(v)));
        if (allNum) {
          const nums = vals.map(Number);
          return op === 'min' ? Math.min(...nums) : Math.max(...nums);
        }
        const sorted = vals.map(String).sort();
        return op === 'min' ? sorted[0] : sorted[sorted.length - 1];
      }
      if (op === 'unique' || op === 'uniqueJoin') {
        const list = getFilteredList();
        const set = new Set();
        for (const item of list) {
          const v = spec.field ? sfeResolvePath(item, spec.field) : item;
          if (spec.flatten && Array.isArray(v)) {
            for (const sub of v) {
              if (sub !== null && sub !== undefined && sub !== '') set.add(sub);
            }
          } else if (v !== null && v !== undefined && v !== '') {
            set.add(v);
          }
        }
        const arr = Array.from(set);
        return op === 'unique' ? arr : arr.join(spec.sep !== undefined ? spec.sep : ', ');
      }
      if (op === 'daysFromToday') {
        const rawDate = sfeResolvePath(scope, spec.path);
        return rawDate ? diffModDaysIso(rawDate, ctx.$today) : null;
      }
      if (op === 'coalesce') {
        const paths = Array.isArray(spec.paths) ? spec.paths : [];
        for (const p of paths) {
          const v = sfeResolvePath(scope, p);
          if (sfeIsPresent(v)) return v;
        }
        return spec.default !== undefined ? spec.default : null;
      }
      if (op === 'diff') {
        const l = Number(sfeResolvePath(scope, spec.leftPath)) || 0;
        const r = Number(sfeResolvePath(scope, spec.rightPath)) || 0;
        return l - r;
      }
      if (op === 'cond') {
        return sfeEvalCondition(spec.when, scope);
      }
      if (op === 'template') {
        return sfeInterpolate(spec.text || '', scope);
      }
      if (op === 'joinParts') {
        const parts = Array.isArray(spec.parts) ? spec.parts : [];
        const out = [];
        for (const p of parts) {
          if (!p) continue;
          if (typeof p === 'string') {
            const txt = sfeInterpolate(p, scope).trim();
            if (txt) out.push(txt);
          } else if (!p.when || sfeEvalCondition(p.when, scope)) {
            const txt = sfeInterpolate(p.text || '', scope).trim();
            if (txt) out.push(txt);
          }
        }
        return out.join(spec.sep !== undefined ? spec.sep : ' · ');
      }
      if (op === 'cases') {
        const cases = Array.isArray(spec.cases) ? spec.cases : [];
        for (const c of cases) {
          if (c && (!c.when || sfeEvalCondition(c.when, scope))) {
            return sfeInterpolateDeep(c.value, scope);
          }
        }
        return spec.default !== undefined ? sfeInterpolateDeep(spec.default, scope) : null;
      }
      return null;
    }

    async function executePluginPipelineUncached(plugin, targetId) {
      const today = getModLocalTodayIso();
      const targetCfg = plugin.target || {};
      const ctx = {
        $targetId: targetId,
        $targetObject: targetCfg.objectApiName || '',
        $today: today,
        _meta: {
          targetId,
          targetName: targetId,
          cachedAt: Date.now()
        }
      };

      const steps = Array.isArray(plugin.data) ? plugin.data : [];
      const categoryRegistry = new Map(); // stepId -> categories[]

      for (const step of steps) {
        if (!step || !step.type) continue;
        if (step.when && !sfeEvalCondition(step.when, ctx)) continue;

        if (step.type === 'record') {
          const objName = step.objectApiName || targetCfg.objectApiName;
          const optFields = qualifyAuraFields(objName, step.fields || ['Id', 'Name']);
          if (step.forEach) {
            const srcList = sfeResolvePath(ctx, step.forEach);
            const idList = Array.isArray(srcList)
              ? Array.from(new Set(srcList.map((it) => sfeResolvePath(it, step.idField || 'id')).filter(Boolean)))
              : [];
            const fetched = await Promise.all(
              idList.map((recId) =>
                modAuraCall('aura://RecordUiController/ACTION$getRecordWithFields', {
                  recordId: recId,
                  optionalFields: optFields
                })
                  .then((r) => (r ? flattenAuraRecord(r, step.map) : { id: recId, Id: recId }))
                  .catch(() => ({ id: recId, Id: recId }))
              )
            );
            ctx[step.id] = fetched;
            const byId = {};
            for (const rec of fetched) {
              if (rec && rec.id) byId[rec.id] = rec;
            }
            ctx[`${step.id}ById`] = byId;
          } else {
            const recId = step.recordIdPath ? sfeResolvePath(ctx, step.recordIdPath) : targetId;
            if (!recId) {
              ctx[step.id] = null;
              continue;
            }
            const raw = await modAuraCall('aura://RecordUiController/ACTION$getRecordWithFields', {
              recordId: recId,
              optionalFields: optFields
            }).catch(() => null);
            const flat = raw ? flattenAuraRecord(raw, step.map) : { id: recId, Id: recId };
            ctx[step.id] = flat;
            if (step.id === 'target' || step.isTarget) {
              const nameField = targetCfg.nameField || 'Name';
              const resolvedName = sfeResolvePath(flat, nameField);
              if (resolvedName) ctx._meta.targetName = String(resolvedName);
            }
          }
          continue;
        }

        if (step.type === 'relatedList') {
          const relFields = step.objectApiName
            ? qualifyAuraFields(step.objectApiName, step.fields || [])
            : step.fields || [];
          const pageSize = typeof step.pageSize === 'number' ? step.pageSize : 100;

          const processRows = (rawRecs, parentMeta) => {
            let rows = rawRecs.map((r) => {
              const flat = flattenAuraRecord(r, step.map);
              if (parentMeta) {
                flat._parentId = parentMeta.id;
                flat._parentName = parentMeta.Name || parentMeta.name || parentMeta.id;
              }
              return flat;
            });
            if (step.where) {
              rows = rows.filter((item) => sfeEvalCondition(step.where, Object.assign({}, ctx, { item })));
            }
            if (step.sort) {
              rows = sfeSortArray(rows, step.sort, ctx);
            }
            if (typeof step.limit === 'number' && step.limit > 0) {
              rows = rows.slice(0, step.limit);
            }
            return rows;
          };

          if (step.forEach) {
            const parents = sfeResolvePath(ctx, step.forEach);
            const parentArr = Array.isArray(parents) ? parents : [];
            const allRows = [];
            const results = await Promise.all(
              parentArr.map((p) => {
                const pid = sfeResolvePath(p, step.parentIdField || 'id');
                if (!pid) return Promise.resolve([]);
                return modFetchRelatedRecords(pid, step.relatedListId, relFields, pageSize).catch(() => []);
              })
            );
            results.forEach((rawRecs, idx) => {
              const parentObj = parentArr[idx];
              const rows = processRows(rawRecs, parentObj);
              if (step.attachAs && parentObj && typeof parentObj === 'object') {
                parentObj[step.attachAs] = rows;
              }
              allRows.push(...rows);
            });
            ctx[step.id] = allRows;
          } else {
            const parentId = step.parentIdPath ? sfeResolvePath(ctx, step.parentIdPath) : targetId;
            if (!parentId) {
              ctx[step.id] = [];
              continue;
            }
            const rawRecs = await modFetchRelatedRecords(parentId, step.relatedListId, relFields, pageSize).catch(() => []);
            ctx[step.id] = processRows(rawRecs, null);
          }
          continue;
        }

        if (step.type === 'dateStatus') {
          const src = sfeResolvePath(ctx, step.from);
          const arr = Array.isArray(src) ? src : [];
          const active = [];
          const upcoming = [];
          const expired = [];
          for (const item of arr) {
            const res = sfeClassifyDateBucket(item, step, today);
            Object.assign(item, res);
            if (res.dateBucket === 'ACTIVE') active.push(item);
            else if (res.dateBucket === 'UPCOMING') upcoming.push(item);
            else expired.push(item);
          }
          if (step.id) ctx[step.id] = arr;

          if (step.pickPrimaryBucketAs) {
            let bucket = 'NONE';
            let chosen = [];
            if (active.length) {
              bucket = 'ACTIVE';
              chosen = active.slice();
            } else if (upcoming.length) {
              bucket = 'UPCOMING';
              upcoming.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
              const earliestStart = upcoming[0].startDate;
              chosen = upcoming.filter((e) => e.startDate === earliestStart);
            } else if (expired.length) {
              bucket = 'EXPIRED';
              expired.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
              const latestEnd = expired[0].endDate;
              chosen = expired.filter((e) => e.endDate === latestEnd);
            }
            const sortedUpcoming = upcoming.slice().sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
            ctx[step.pickPrimaryBucketAs] = {
              bucket,
              items: chosen,
              activeItems: active,
              upcomingItems: sortedUpcoming,
              expiredItems: expired,
              nextUpcoming: sortedUpcoming[0] || null
            };
          }
          continue;
        }

        if (step.type === 'classify') {
          const src = sfeResolvePath(ctx, step.from);
          const arr = Array.isArray(src) ? src : [];
          const categories = Array.isArray(step.categories) ? step.categories : [];
          if (step.id) categoryRegistry.set(step.id, categories);
          const textFields = Array.isArray(step.textFields) ? step.textFields : ['name', 'code', 'family'];
          const defaultTag = step.defaultTag || { key: 'other', tag: 'ITEM', tone: 'neutral' };

          for (const item of arr) {
            const hay = textFields
              .map((tf) => String(sfeResolvePath(item, tf) || '').trim())
              .filter(Boolean)
              .join(' ')
              .toLowerCase();
            const matchedKeys = [];
            const matchedTags = [];
            let primaryTag = null;

            for (const cat of categories) {
              if (!cat || !cat.key) continue;
              let hit = false;
              if (cat.fieldEquals && typeof cat.fieldEquals === 'object') {
                for (const [fPath, expectedVals] of Object.entries(cat.fieldEquals)) {
                  const val = String(sfeResolvePath(item, fPath) || '').trim();
                  if (Array.isArray(expectedVals) && expectedVals.includes(val)) {
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit && cat.fieldPatterns && typeof cat.fieldPatterns === 'object') {
                for (const [fPath, patterns] of Object.entries(cat.fieldPatterns)) {
                  const val = String(sfeResolvePath(item, fPath) || '').trim();
                  if (
                    Array.isArray(patterns) &&
                    patterns.some((p) => {
                      try { return new RegExp(p, 'i').test(val); } catch (_) { return false; }
                    })
                  ) {
                    hit = true;
                    break;
                  }
                }
              }
              if (!hit && Array.isArray(cat.textPatterns)) {
                hit = cat.textPatterns.some((p) => {
                  try { return new RegExp(p, 'i').test(hay); } catch (_) { return false; }
                });
              }
              if (hit) {
                matchedKeys.push(cat.key);
                const tagObj = {
                  key: cat.key,
                  tag: cat.tag || cat.key.toUpperCase(),
                  tone: cat.tone || 'neutral',
                  showInRollup: cat.showInRollup !== false
                };
                matchedTags.push(tagObj);
                if (!primaryTag) primaryTag = tagObj;
              }
            }
            item.matchedKeys = matchedKeys;
            item.matchedTags = matchedTags;
            item.primaryTag = primaryTag || defaultTag;
          }
          if (step.id) ctx[step.id] = arr;
          continue;
        }

        if (step.type === 'filter') {
          const src = sfeResolvePath(ctx, step.from);
          const arr = Array.isArray(src) ? src : [];
          let filtered = step.where
            ? arr.filter((item) => sfeEvalCondition(step.where, Object.assign({}, ctx, { item })))
            : arr.slice();
          if (!filtered.length && step.fallbackToAll) {
            filtered = arr.slice();
          }
          ctx[step.id] = filtered;
          continue;
        }

        if (step.type === 'dedupe') {
          const src = sfeResolvePath(ctx, step.from);
          const arr = Array.isArray(src) ? src : [];
          const fields = Array.isArray(step.by) ? step.by : ['id'];
          const seen = new Set();
          const out = [];
          for (const item of arr) {
            const key = fields.map((f) => String(sfeResolvePath(item, f) ?? '')).join('|');
            if (!seen.has(key)) {
              seen.add(key);
              out.push(item);
            }
          }
          ctx[step.id] = out;
          continue;
        }

        if (step.type === 'rollup') {
          const parents = sfeResolvePath(ctx, step.from);
          const arr = Array.isArray(parents) ? parents : [];
          const soonDays = typeof step.soonDays === 'number' ? step.soonDays : 30;
          const joinCfg = step.joinTags || null;
          const cats = (joinCfg && joinCfg.classifyStep && categoryRegistry.get(joinCfg.classifyStep)) || null;

          for (const parent of arr) {
            const rawChildren = Array.isArray(parent[step.childrenField]) ? parent[step.childrenField] : [];
            const active = rawChildren.filter((c) => c.dateBucket === 'ACTIVE');
            const upcoming = rawChildren.filter((c) => c.dateBucket === 'UPCOMING');
            const expired = rawChildren.filter((c) => c.dateBucket === 'EXPIRED');

            let status = 'NONE';
            let chosen = [];
            if (active.length) {
              status = 'ACTIVE';
              active.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
              chosen = active;
            } else if (upcoming.length) {
              status = 'UPCOMING';
              upcoming.sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
              chosen = upcoming;
            } else if (expired.length) {
              status = 'EXPIRED';
              expired.sort((a, b) => (b.endDate || '').localeCompare(a.endDate || ''));
              chosen = expired;
            }

            const primary = chosen[0] || null;
            const endDates = chosen.map((c) => c.endDate).filter(Boolean).sort();
            const resolvedEnd = status === 'UPCOMING' ? (primary ? primary.endDate : null) : endDates[endDates.length - 1] || null;
            const resolvedStart = primary ? primary.startDate : null;
            const daysRemaining = resolvedEnd ? diffModDaysIso(resolvedEnd, today) : null;
            const isExpiringSoon = status === 'ACTIVE' && typeof daysRemaining === 'number' && daysRemaining >= 0 && daysRemaining <= soonDays;

            parent.status = status;
            parent.startDate = resolvedStart;
            parent.endDate = resolvedEnd;
            parent.daysRemaining = daysRemaining;
            parent.isExpiringSoon = isExpiringSoon;

            if (step.collect && typeof step.collect === 'object') {
              for (const [outKey, childField] of Object.entries(step.collect)) {
                parent[outKey] = Array.from(
                  new Set(chosen.map((c) => sfeResolvePath(c, childField)).filter(Boolean))
                );
              }
            }

            if (joinCfg) {
              const mapObj = sfeResolvePath(ctx, joinCfg.fromMap) || {};
              const ids = Array.isArray(parent[joinCfg.idListField]) ? parent[joinCfg.idListField] : [];
              const tagKeys = new Set();
              const tagMap = new Map();
              for (const jid of ids) {
                const linked = mapObj[jid];
                if (!linked) continue;
                let linkedItems = Array.isArray(linked[joinCfg.itemsField]) ? linked[joinCfg.itemsField] : [];
                if (joinCfg.itemWhere && (!joinCfg.applyItemWhereWhen || sfeEvalCondition(joinCfg.applyItemWhereWhen, ctx))) {
                  const filtered = linkedItems.filter((item) =>
                    sfeEvalCondition(joinCfg.itemWhere, Object.assign({}, ctx, { item }))
                  );
                  if (filtered.length) linkedItems = filtered;
                }
                for (const li of linkedItems) {
                  for (const t of li.matchedTags || []) {
                    if (t && t.showInRollup !== false && !tagKeys.has(t.key)) {
                      tagKeys.add(t.key);
                      tagMap.set(t.key, { tag: t.tag, tone: t.tone || 'neutral' });
                    }
                  }
                }
              }
              if (cats) {
                parent.tags = cats
                  .filter((c) => c && c.showInRollup !== false && tagKeys.has(c.key) && c.tag)
                  .map((c) => ({ tag: c.tag, tone: c.tone || 'neutral' }));
              } else {
                parent.tags = Array.from(tagMap.values());
              }
            }

            if (Array.isArray(step.statusBadgeCases)) {
              const itemScope = Object.assign({}, ctx, { item: parent });
              let chosenBadge = null;
              for (const c of step.statusBadgeCases) {
                if (c && (!c.when || sfeEvalCondition(c.when, itemScope))) {
                  chosenBadge = sfeInterpolateDeep(c.value, itemScope);
                  break;
                }
              }
              parent.statusBadge = chosenBadge || { text: status, tone: 'neutral' };
            }
          }
          if (step.id) ctx[step.id] = arr;
          continue;
        }

        if (step.type === 'sort') {
          const src = sfeResolvePath(ctx, step.from);
          if (Array.isArray(src)) {
            ctx[step.id || step.from] = sfeSortArray(src, step.by || step.sort, ctx);
          }
          continue;
        }

        if (step.type === 'compute') {
          const out = {};
          ctx[step.id] = out;
          if (step.fields && typeof step.fields === 'object') {
            for (const [k, spec] of Object.entries(step.fields)) {
              out[k] = sfeEvalComputeOp(spec, ctx, out);
            }
          }
          continue;
        }
      }

      ctx._meta.cachedAt = Date.now();
      return ctx;
    }

    // -------------------------------------------------------------------------
    // Cache & Concurrency Queue
    // -------------------------------------------------------------------------
    function getModTargetCache(modId) {
      if (!modTargetCaches.has(modId)) {
        const map = new Map();
        try {
          const raw = sessionStorage.getItem(`sfe_plugin_cache_${SFE_CACHE_VERSION}_${modId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            const now = Date.now();
            for (const [k, v] of Object.entries(parsed)) {
              if (v && v._meta && typeof v._meta.cachedAt === 'number' && now - v._meta.cachedAt < MOD_CACHE_TTL_MS) {
                map.set(k, v);
              }
            }
          }
        } catch (_) {}
        modTargetCaches.set(modId, map);
      }
      return modTargetCaches.get(modId);
    }

    function saveModTargetCache(modId) {
      try {
        const map = modTargetCaches.get(modId);
        if (!map) return;
        const now = Date.now();
        const obj = {};
        for (const [k, v] of map.entries()) {
          if (v && v._meta && now - v._meta.cachedAt < MOD_CACHE_TTL_MS) obj[k] = v;
        }
        sessionStorage.setItem(`sfe_plugin_cache_${SFE_CACHE_VERSION}_${modId}`, JSON.stringify(obj));
      } catch (_) {}
    }

    function getCachedModTarget(modId, targetId) {
      const map = getModTargetCache(modId);
      const entry = map.get(targetId);
      if (!entry || !entry._meta) return null;
      if (Date.now() - entry._meta.cachedAt >= MOD_CACHE_TTL_MS) {
        map.delete(targetId);
        return null;
      }
      return entry;
    }

    function fetchModTargetData(plugin, targetId) {
      const cached = getCachedModTarget(plugin.id, targetId);
      if (cached) return Promise.resolve(cached);
      const key = `${plugin.id}:${targetId}`;
      if (modInFlight.has(key)) return modInFlight.get(key);

      const p = new Promise((resolve, reject) => {
        modPendingQueue.push({ plugin, targetId, key, resolve, reject });
        drainModQueue();
      });
      modInFlight.set(key, p);
      return p;
    }

    function drainModQueue() {
      while (modActiveFetches < MOD_MAX_CONCURRENT && modPendingQueue.length > 0) {
        const job = modPendingQueue.shift();
        const cached = getCachedModTarget(job.plugin.id, job.targetId);
        if (cached) {
          modInFlight.delete(job.key);
          job.resolve(cached);
          continue;
        }
        modActiveFetches++;
        executePluginPipelineUncached(job.plugin, job.targetId)
          .then((data) => {
            getModTargetCache(job.plugin.id).set(job.targetId, data);
            saveModTargetCache(job.plugin.id);
            modErrorMap.delete(job.key);
            job.resolve(data);
            scheduleModDomScan(30);
          })
          .catch((err) => {
            modErrorMap.set(job.key, { error: err, cachedAt: Date.now() });
            job.reject(err);
            scheduleModDomScan(30);
          })
          .finally(() => {
            modActiveFetches--;
            modInFlight.delete(job.key);
            drainModQueue();
          });
      }
    }

    // -------------------------------------------------------------------------
    // Declarative SLDS View Renderer
    // -------------------------------------------------------------------------
    function getSldsToneColors(tone) {
      switch (tone) {
        case 'success':
          return { bg: '#ebf7e6', fg: '#194e31', border: '#91db8b' };
        case 'warning':
          return { bg: '#fcf3e0', fg: '#5f3e00', border: '#f9be69' };
        case 'orange':
          return { bg: '#fff1e6', fg: '#8c3100', border: '#f7924a' };
        case 'error':
          return { bg: '#fef1ee', fg: '#8e030f', border: '#f7b9b2' };
        case 'info':
          return { bg: '#eef4ff', fg: '#00396b', border: '#b0d0ff' };
        default:
          return {
            bg: 'var(--lwc-colorBackground, #f3f2f2)',
            fg: 'var(--lwc-colorTextLabel, #444444)',
            border: 'var(--lwc-colorBorder, #dddbda)'
          };
      }
    }

    function escapeModHtml(str) {
      return String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function sfeBadgeStyle(tone) {
      const c = getSldsToneColors(tone);
      return `display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:15rem; font-size:0.75rem; font-weight:700; line-height:1.25; background:${c.bg}; color:${c.fg}; border:1px solid ${c.border};`;
    }

    function sfeSmallTagHtml(tagText, tone) {
      const tc = getSldsToneColors(tone);
      return `<span style="flex:0 0 auto; font-size:10px; font-weight:700; padding:0 5px; border-radius:0.125rem; background:${tc.bg}; color:${tc.fg}; border:1px solid ${tc.border};">${escapeModHtml(
        tagText
      )}</span>`;
    }

    function sfeResolveTone(spec, scope, fallback = 'neutral') {
      if (!spec) return fallback;
      if (spec.tonePath) {
        const dyn = sfeResolvePath(scope, spec.tonePath);
        if (dyn) return String(dyn);
      }
      return spec.tone || fallback;
    }

    function sfeBuildDrawerParts(block, scope, mode, scopeKey) {
      const rawItems = sfeResolvePath(scope, block.itemsPath);
      const items = Array.isArray(rawItems) ? rawItems : [];
      const drawerScopeKey = `${scopeKey}:${block.id || 'drawer'}`;
      const expanded = modExpandedScopes.has(drawerScopeKey);
      const chevron = expanded ? '▾' : '▸';

      const toggleLabel = sfeInterpolate(
        block.toggleLabel || `${items.length} Items`,
        Object.assign({}, scope, { _count: items.length })
      );
      const toggleTone = sfeResolveTone(block, scope, '');
      const btnColors = toggleTone
        ? getSldsToneColors(toggleTone)
        : {
            bg: 'var(--lwc-buttonColorBackgroundPrimary, var(--lwc-colorBackgroundAlt, #ffffff))',
            fg: 'var(--lwc-colorTextLink, #0176d3)',
            border: 'var(--lwc-buttonColorBorderPrimary, var(--lwc-colorBorder, #dddbda))'
          };
      const isEmphasized = toggleTone === 'orange' || toggleTone === 'error' || toggleTone === 'warning';

      const toggleHtml = items.length > 0
        ? `<button type="button" class="sfe-mod-nodes-toggle" data-sfe-scope="${escapeModHtml(
            drawerScopeKey
          )}" aria-expanded="${expanded ? 'true' : 'false'}" style="display:inline-flex; align-items:center; gap:5px; padding:2px 8px; border-radius:var(--lwc-borderRadiusMedium, 0.25rem); font-family:var(--lwc-fontFamily, inherit); font-size:0.75rem; font-weight:${
            isEmphasized ? '600' : '400'
          }; line-height:1.35; cursor:pointer; background:${btnColors.bg}; color:${btnColors.fg}; border:1px solid ${
            btnColors.border
          }; text-align:left;">
            <span class="sfe-mod-chevron" style="font-size:10px;">${chevron}</span>
            <span>${escapeModHtml(toggleLabel)}</span>
          </button>`
        : `<span style="font-size:0.75rem; color:var(--lwc-colorTextWeak, #706e6b);">${escapeModHtml(
            sfeInterpolate(block.emptyText || '0 Records', scope)
          )}</span>`;

      const itemCfg = block.item || {};
      const rowsHtml = items
        .map((item) => {
          const itemScope = Object.assign({}, scope, { item });
          const title = sfeInterpolate(itemCfg.title || '{{item.Name}}', itemScope);
          const recId = itemCfg.recordIdPath ? sfeResolvePath(itemScope, itemCfg.recordIdPath) : item.id;
          const objName = itemCfg.objectApiName || '';
          const href = recId ? (objName ? `/lightning/r/${objName}/${recId}/view` : `/lightning/r/${recId}/view`) : '';

          const titleEl = href
            ? `<a class="sfe-mod-record-link" data-record-id="${escapeModHtml(recId)}" href="${escapeModHtml(
                href
              )}" style="color:var(--lwc-colorTextLink, #0176d3); text-decoration:none; font-size:0.75rem; font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeModHtml(
                title
              )}">${escapeModHtml(title)}</a>`
            : `<span style="font-size:0.75rem; font-weight:600; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeModHtml(
                title
              )}</span>`;

          let badgeHtml = '';
          if (itemCfg.badge && (!itemCfg.badge.when || sfeEvalCondition(itemCfg.badge.when, itemScope))) {
            const bText = itemCfg.badge.textPath
              ? String(sfeResolvePath(itemScope, itemCfg.badge.textPath) || '')
              : sfeInterpolate(itemCfg.badge.text || '', itemScope);
            if (bText) {
              const bc = getSldsToneColors(sfeResolveTone(itemCfg.badge, itemScope, 'neutral'));
              badgeHtml = `<span style="flex:0 0 auto; font-size:10px; font-weight:700; padding:1px 6px; border-radius:15rem; background:${bc.bg}; color:${bc.fg}; border:1px solid ${bc.border}; white-space:nowrap;">${escapeModHtml(
                bText
              )}</span>`;
            }
          }

          let tagsHtml = '';
          if (itemCfg.tagsPath) {
            const tags = sfeResolvePath(itemScope, itemCfg.tagsPath);
            if (Array.isArray(tags) && tags.length) {
              tagsHtml = tags
                .map((t) => {
                  const tc = getSldsToneColors((t && t.tone) || 'neutral');
                  return `<span style="font-size:9px; font-weight:700; padding:0 4px; border-radius:0.125rem; background:${tc.bg}; color:${tc.fg}; border:1px solid ${tc.border};">${escapeModHtml(
                    (t && t.tag) || ''
                  )}</span>`;
                })
                .join('');
            }
          }

          const metaBits = [];
          if (Array.isArray(itemCfg.meta)) {
            for (const m of itemCfg.meta) {
              if (!m) continue;
              if (typeof m === 'string') {
                const txt = sfeInterpolate(m, itemScope).trim();
                if (txt) metaBits.push(txt);
              } else if (!m.when || sfeEvalCondition(m.when, itemScope)) {
                const txt = sfeInterpolate(m.text || '', itemScope).trim();
                if (txt) metaBits.push(txt);
              }
            }
          }

          return `
            <div style="padding:6px 8px; border-radius:var(--lwc-borderRadiusMedium, 0.25rem); background:var(--lwc-cardColorBackground, var(--lwc-colorBackgroundAlt, #ffffff)); border:1px solid var(--lwc-colorBorder, #dddbda); display:flex; flex-direction:column; gap:2px;">
              <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
                ${titleEl}
                ${badgeHtml}
              </div>
              ${
                tagsHtml || metaBits.length
                  ? `<div style="display:flex; flex-wrap:wrap; align-items:center; gap:4px; font-size:11px; color:var(--lwc-colorTextWeak, #706e6b); line-height:1.3;">${tagsHtml}${
                      metaBits.length ? `<span>${escapeModHtml(metaBits.join(' · '))}</span>` : ''
                    }</div>`
                  : ''
              }
            </div>
          `;
        })
        .join('');

      const gridLayout =
        mode === 'highlights'
          ? 'display:grid; grid-template-columns:repeat(auto-fill, minmax(245px, 1fr)); gap:6px;'
          : 'display:flex; flex-direction:column; gap:5px;';

      const drawerHtml = items.length
        ? `<div class="sfe-mod-nodes-drawer" data-sfe-scope="${escapeModHtml(drawerScopeKey)}" style="display:${
            expanded ? 'block' : 'none'
          }; margin-top:8px; padding:8px; border-radius:var(--lwc-borderRadiusMedium, 0.25rem); border:1px solid var(--lwc-colorBorder, #dddbda); background:var(--lwc-colorBackground, #f3f2f2);">
            <div style="${gridLayout}">${rowsHtml}</div>
          </div>`
        : '';

      return { toggleHtml, drawerHtml, drawerScopeKey };
    }

    function renderSfeViewBlocks(plugin, targetId, data, error, mode, scopeKey) {
      const viewCfg = plugin.view || {};
      if (error) {
        const prefix = viewCfg.errorPrefix || 'Plugin lookup failed:';
        return `<div style="font-size:0.75rem; color:var(--lwc-colorTextError, #ea001e); font-weight:600;">${escapeModHtml(
          prefix
        )} ${escapeModHtml(error.message || String(error))}</div>`;
      }
      if (!data) {
        if (mode === 'banner') return '';
        const loadingText = viewCfg.loadingText || `Loading ${plugin.target?.headerTitle || plugin.name}…`;
        return `<div style="font-size:0.75rem; color:var(--lwc-colorTextWeak, #706e6b);">${escapeModHtml(loadingText)}</div>`;
      }

      const blocks =
        mode === 'banner'
          ? viewCfg.banner
          : mode === 'highlights'
          ? viewCfg.highlights || viewCfg.hover
          : mode === 'rightPane'
          ? viewCfg.rightPane || viewCfg.hover
          : viewCfg.hover;

      if (!Array.isArray(blocks) || !blocks.length) return '';

      const pageRecMatch = (location.pathname || '').match(/\/lightning\/r\/(?:[^/]+\/)?([a-zA-Z0-9]{15,18})(?:\/|$|\?)/i);
      const pageRecId = pageRecMatch ? pageRecMatch[1] : null;
      const isDifferentRecordPage = !!(
        pageRecId && extractModRecordIdByPrefix(pageRecId, plugin.target.keyPrefix) !== targetId
      );

      const scope = Object.assign({}, data, {
        $mode: mode,
        $isDifferentRecordPage: isDifferentRecordPage,
        $targetName: (data._meta && data._meta.targetName) || targetId,
        $headerTitle: plugin.target?.headerTitle || plugin.target?.objectApiName || plugin.name
      });

      // Pre-build named drawers so fieldGrid or metaRow blocks can embed their toggle buttons cleanly
      const drawerRegistry = new Map();
      for (const b of blocks) {
        if (b && b.type === 'drawer' && b.id && (!b.when || sfeEvalCondition(b.when, scope))) {
          drawerRegistry.set(b.id, sfeBuildDrawerParts(b, scope, mode, scopeKey));
        }
      }

      const labelStyle = 'font-size:0.75rem; line-height:1.25; color:var(--lwc-colorTextLabel, #444444); font-weight:400;';
      const renderedBlocks = [];

      for (let bi = 0; bi < blocks.length; bi++) {
        const block = blocks[bi];
        if (!block || !block.type) continue;
        if (block.when && !sfeEvalCondition(block.when, scope)) continue;

        const topDivider = block.dividerTop
          ? 'margin-top:6px; padding-top:6px; border-top:1px solid var(--lwc-colorBorder, #dddbda);'
          : bi > 0
          ? 'margin-top:6px;'
          : '';

        if (block.type === 'badgeRow') {
          const badges = (Array.isArray(block.badges) ? block.badges : [])
            .filter((b) => b && (!b.when || sfeEvalCondition(b.when, scope)))
            .map((b) => {
              const icon = b.iconPath ? String(sfeResolvePath(scope, b.iconPath) || '') : sfeInterpolate(b.icon || '', scope);
              const text = b.textPath ? String(sfeResolvePath(scope, b.textPath) || '') : sfeInterpolate(b.text || '', scope);
              const full = [icon, text].filter(Boolean).join(' ').trim();
              if (!full) return '';
              const tone = sfeResolveTone(b, scope, 'neutral');
              return `<span style="${sfeBadgeStyle(tone)}">${escapeModHtml(full)}</span>`;
            })
            .filter(Boolean);
          if (badges.length) {
            renderedBlocks.push(`<div style="${topDivider} display:flex; flex-wrap:wrap; align-items:center; gap:6px;">${badges.join('')}</div>`);
          }
          continue;
        }

        if (block.type === 'fieldGrid') {
          const items = Array.isArray(block.items) ? block.items : [];
          const cols = [];
          for (const item of items) {
            if (!item || (item.when && !sfeEvalCondition(item.when, scope))) continue;
            const label = sfeInterpolate(item.label || '', scope);
            let valueHtml = '';

            if (item.drawerToggle && drawerRegistry.has(item.drawerToggle)) {
              valueHtml = `<div>${drawerRegistry.get(item.drawerToggle).toggleHtml}</div>`;
            } else if (item.badge) {
              const icon = item.badge.iconPath
                ? String(sfeResolvePath(scope, item.badge.iconPath) || '')
                : sfeInterpolate(item.badge.icon || '', scope);
              const text = item.badge.textPath
                ? String(sfeResolvePath(scope, item.badge.textPath) || '')
                : sfeInterpolate(item.badge.text || '', scope);
              const full = [icon, text].filter(Boolean).join(' ').trim();
              if (full) {
                valueHtml = `<div><span style="${sfeBadgeStyle(sfeResolveTone(item.badge, scope, 'neutral'))}">${escapeModHtml(
                  full
                )}</span></div>`;
              }
            } else if (item.link) {
              const recId = item.link.recordIdPath ? sfeResolvePath(scope, item.link.recordIdPath) : targetId;
              const objName = item.link.objectApiName || plugin.target?.objectApiName || '';
              const linkText = sfeInterpolate(item.link.text || '', scope);
              if (recId && linkText) {
                const href = objName ? `/lightning/r/${objName}/${recId}/view` : `/lightning/r/${recId}/view`;
                valueHtml = `<a class="sfe-mod-record-link" data-record-id="${escapeModHtml(recId)}" href="${escapeModHtml(
                  href
                )}" style="font-size:0.8125rem; font-weight:700; color:var(--lwc-colorTextLink, #0176d3); text-decoration:none;">${escapeModHtml(
                  linkText
                )}</a>`;
              }
            } else if (item.inlineItems) {
              const arr = sfeResolvePath(scope, item.inlineItems.itemsPath);
              if (Array.isArray(arr) && arr.length) {
                const max = typeof item.inlineItems.maxItems === 'number' ? item.inlineItems.maxItems : arr.length;
                const spans = arr.slice(0, max).map((el) => {
                  const iscope = Object.assign({}, scope, { item: el });
                  const tagText = item.inlineItems.tag?.textPath
                    ? String(sfeResolvePath(iscope, item.inlineItems.tag.textPath) || '')
                    : sfeInterpolate(item.inlineItems.tag?.text || '', iscope);
                  const tagTone = sfeResolveTone(item.inlineItems.tag, iscope, 'neutral');
                  const txt = sfeInterpolate(item.inlineItems.text || '', iscope);
                  const showSuf = !item.inlineItems.suffixWhen || sfeEvalCondition(item.inlineItems.suffixWhen, iscope);
                  const suffix = showSuf && item.inlineItems.suffix ? sfeInterpolate(item.inlineItems.suffix, iscope) : '';
                  return `<span style="display:inline-flex; align-items:center; gap:4px; margin-right:8px; font-size:0.8125rem; color:var(--lwc-colorTextDefault, #181818);">${
                    tagText ? sfeSmallTagHtml(tagText, tagTone) : ''
                  }<span>${escapeModHtml(txt)}</span>${
                    suffix ? `<span style="color:var(--lwc-colorTextWeak, #706e6b); font-size:0.75rem;">${escapeModHtml(suffix)}</span>` : ''
                  }</span>`;
                });
                valueHtml = `<div style="display:flex; flex-wrap:wrap; align-items:center;">${spans.join('')}</div>`;
              }
            } else {
              const val = sfeInterpolate(item.value || '', scope).trim();
              if (val) {
                const colorStyle =
                  item.tone === 'link' || item.tone === 'info'
                    ? 'color:var(--lwc-colorTextLink, #0176d3); font-weight:600;'
                    : item.tone === 'error'
                    ? 'color:var(--lwc-colorTextError, #ea001e); font-weight:600;'
                    : 'color:var(--lwc-colorTextDefault, #181818);';
                const truncStyle = item.truncate
                  ? 'white-space:nowrap; overflow:hidden; text-overflow:ellipsis;'
                  : '';
                valueHtml = `<span style="font-size:0.8125rem; ${colorStyle} ${truncStyle}" title="${escapeModHtml(
                  val
                )}">${escapeModHtml(val)}</span>`;
              }
            }

            if (!valueHtml) continue;
            const maxW = item.maxWidth ? `max-width:${escapeModHtml(item.maxWidth)};` : '';
            cols.push(
              `<div style="display:flex; flex-direction:column; gap:2px; ${maxW}">
                 ${label ? `<span style="${labelStyle}">${escapeModHtml(label)}</span>` : ''}
                 ${valueHtml}
               </div>`
            );
          }

          if (cols.length) {
            const gap = mode === 'highlights' ? '0.75rem 1.5rem' : '0.5rem 1rem';
            renderedBlocks.push(
              `<div style="${topDivider} display:flex; flex-wrap:wrap; align-items:flex-start; gap:${gap};">${cols.join('')}</div>`
            );
          }
          continue;
        }

        if (block.type === 'metaRow') {
          const parts = [];
          if (block.drawerToggle && drawerRegistry.has(block.drawerToggle)) {
            parts.push(drawerRegistry.get(block.drawerToggle).toggleHtml);
          }
          const showVal = !block.valueWhen || sfeEvalCondition(block.valueWhen, scope);
          const label = showVal && block.label ? sfeInterpolate(block.label, scope).trim() : '';
          const value = showVal && block.value ? sfeInterpolate(block.value, scope).trim() : '';
          if (label && value) {
            parts.push(
              `<span>${escapeModHtml(label)} <span style="color:var(--lwc-colorTextDefault, #181818);">${escapeModHtml(value)}</span></span>`
            );
          } else if (value) {
            const toneColor =
              block.tone === 'link' || block.tone === 'info'
                ? 'color:var(--lwc-colorTextLink, #0176d3); font-weight:600;'
                : block.tone === 'error'
                ? 'color:var(--lwc-colorTextError, #ea001e); font-weight:600;'
                : '';
            parts.push(`<span style="${toneColor}">${escapeModHtml(value)}</span>`);
          }
          if (parts.length) {
            renderedBlocks.push(
              `<div style="${topDivider} display:flex; flex-wrap:wrap; align-items:center; gap:6px; font-size:0.75rem; color:var(--lwc-colorTextWeak, #706e6b);">${parts.join(
                ''
              )}</div>`
            );
          }
          continue;
        }

        if (block.type === 'drawer') {
          const built = (block.id && drawerRegistry.get(block.id)) || sfeBuildDrawerParts(block, scope, mode, scopeKey);
          if (block.hideToggle) {
            if (built.drawerHtml) renderedBlocks.push(built.drawerHtml);
          } else {
            renderedBlocks.push(`<div style="${topDivider}">${built.toggleHtml}${built.drawerHtml}</div>`);
          }
          continue;
        }

        if (block.type === 'list') {
          const rawItems = sfeResolvePath(scope, block.itemsPath);
          const items = Array.isArray(rawItems) ? rawItems : [];
          const maxItems = typeof block.maxItems === 'number' && block.maxItems > 0 ? block.maxItems : items.length;
          const visible = items.slice(0, maxItems);
          if (!visible.length && !block.emptyText) continue;

          const titleHtml = block.title
            ? `<div style="font-size:11px; font-weight:700; color:var(--lwc-colorTextLabel, #444444); margin-bottom:4px;">${escapeModHtml(
                sfeInterpolate(block.title, scope)
              )}</div>`
            : '';

          if (!visible.length) {
            renderedBlocks.push(
              `<div style="${topDivider}">${titleHtml}<div style="font-size:0.75rem; color:var(--lwc-colorTextWeak, #706e6b);">${escapeModHtml(
                sfeInterpolate(block.emptyText, scope)
              )}</div></div>`
            );
            continue;
          }

          const itemCfg = block.item || {};
          const rows = visible.map((el) => {
            const iscope = Object.assign({}, scope, { item: el });
            let tagHtml = '';
            if (itemCfg.tag) {
              const tText = itemCfg.tag.textPath
                ? String(sfeResolvePath(iscope, itemCfg.tag.textPath) || '')
                : sfeInterpolate(itemCfg.tag.text || '', iscope);
              if (tText) tagHtml = sfeSmallTagHtml(tText, sfeResolveTone(itemCfg.tag, iscope, 'neutral'));
            }
            const titleText = sfeInterpolate(itemCfg.title || '{{item.Name}}', iscope);
            const showSuffix = !itemCfg.titleSuffixWhen || sfeEvalCondition(itemCfg.titleSuffixWhen, iscope);
            const titleMuted = showSuffix && itemCfg.titleSuffix ? sfeInterpolate(itemCfg.titleSuffix, iscope).trim() : '';
            const recId = itemCfg.recordIdPath ? sfeResolvePath(iscope, itemCfg.recordIdPath) : null;
            const objName = itemCfg.objectApiName || '';
            const titleNode = recId
              ? `<a class="sfe-mod-record-link" data-record-id="${escapeModHtml(recId)}" href="${escapeModHtml(
                  objName ? `/lightning/r/${objName}/${recId}/view` : `/lightning/r/${recId}/view`
                )}" style="color:var(--lwc-colorTextLink, #0176d3); text-decoration:none; font-weight:600;">${escapeModHtml(titleText)}</a>`
              : `<span>${escapeModHtml(titleText)}</span>`;
            let subtext = '';
            if (Array.isArray(itemCfg.subtextParts)) {
              const sParts = [];
              for (const sp of itemCfg.subtextParts) {
                if (!sp) continue;
                if (typeof sp === 'string') {
                  const t = sfeInterpolate(sp, iscope).trim();
                  if (t) sParts.push(t);
                } else if (!sp.when || sfeEvalCondition(sp.when, iscope)) {
                  const t = sfeInterpolate(sp.text || '', iscope).trim();
                  if (t) sParts.push(t);
                }
              }
              subtext = sParts.join(' · ');
            } else if (itemCfg.subtext) {
              subtext = sfeInterpolate(itemCfg.subtext, iscope).trim();
            }

            return `
              <div style="display:flex; align-items:flex-start; gap:6px; margin-top:5px;">
                ${tagHtml ? `<div style="margin-top:1px;">${tagHtml}</div>` : ''}
                <div style="min-width:0; flex:1; font-size:0.75rem; line-height:1.35; color:var(--lwc-colorTextDefault, #181818);">
                  <div>${titleNode}${
              titleMuted ? ` <span style="color:var(--lwc-colorTextWeak, #706e6b);">${escapeModHtml(titleMuted)}</span>` : ''
            }</div>
                  ${
                    subtext
                      ? `<div style="font-size:11px; color:var(--lwc-colorTextWeak, #706e6b);">${escapeModHtml(subtext)}</div>`
                      : ''
                  }
                </div>
              </div>
            `;
          });
          renderedBlocks.push(`<div style="${topDivider}">${titleHtml}${rows.join('')}</div>`);
          continue;
        }

        if (block.type === 'alert') {
          const c = getSldsToneColors(sfeResolveTone(block, scope, 'info'));
          const icon = sfeInterpolate(block.icon || '', scope);
          const title = sfeInterpolate(block.title || '', scope);
          const text = sfeInterpolate(block.text || '', scope);
          if (!title && !text) continue;
          renderedBlocks.push(
            `<div style="${topDivider} display:flex; align-items:flex-start; gap:8px; padding:8px 12px; border-radius:var(--lwc-borderRadiusMedium, 0.25rem); background:${
              c.bg
            }; color:${c.fg}; border:1px solid ${c.border}; font-size:0.8125rem; line-height:1.35;">
              ${icon ? `<span style="flex:0 0 auto; font-weight:700;">${escapeModHtml(icon)}</span>` : ''}
              <div style="min-width:0; flex:1;">
                ${title ? `<strong>${escapeModHtml(title)}</strong>` : ''}
                ${title && text ? ' — ' : ''}
                ${text ? `<span>${escapeModHtml(text)}</span>` : ''}
              </div>
            </div>`
          );
          continue;
        }
      }

      if (!renderedBlocks.length) return '';
      return `<div style="font-family:var(--lwc-fontFamily, inherit); color:var(--lwc-colorTextDefault, #181818);">${renderedBlocks.join(
        ''
      )}</div>`;
    }

    // -------------------------------------------------------------------------
    // Event Binding & Console-Aware Navigation
    // -------------------------------------------------------------------------
    function bindModContainerEvents(container) {
      if (!container) return;
      container.querySelectorAll('.sfe-mod-nodes-toggle').forEach((btn) => {
        if (btn.dataset.sfeBound === '1') return;
        btn.dataset.sfeBound = '1';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const scopeKey = btn.dataset.sfeScope;
          if (!scopeKey) return;
          const next = !modExpandedScopes.has(scopeKey);
          if (next) modExpandedScopes.add(scopeKey);
          else modExpandedScopes.delete(scopeKey);
          btn.setAttribute('aria-expanded', next ? 'true' : 'false');
          const chev = btn.querySelector('.sfe-mod-chevron');
          if (chev) chev.textContent = next ? '▾' : '▸';
          const drawer = container.querySelector(`.sfe-mod-nodes-drawer[data-sfe-scope="${scopeKey}"]`) ||
                         container.querySelector('.sfe-mod-nodes-drawer');
          if (drawer) drawer.style.display = next ? 'block' : 'none';
        });
      });

      container.querySelectorAll('.sfe-mod-inferred-toggle').forEach((btn) => {
        if (btn.dataset.sfeBound === '1') return;
        btn.dataset.sfeBound = '1';
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const scopeKey = btn.dataset.sfeScope;
          if (!scopeKey) return;
          const next = !modExpandedScopes.has(scopeKey);
          if (next) modExpandedScopes.add(scopeKey);
          else modExpandedScopes.delete(scopeKey);
          btn.setAttribute('aria-expanded', next ? 'true' : 'false');
          btn.textContent = next ? 'Hide ▴' : 'Show ▾';
          const body = container.querySelector('.sfe-mod-inferred-body');
          if (body) body.style.display = next ? 'block' : 'none';
        });
      });

      container.querySelectorAll('.sfe-mod-record-link').forEach((link) => {
        if (link.dataset.sfeBound === '1') return;
        link.dataset.sfeBound = '1';
        link.addEventListener('click', (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          const recordId = link.dataset.recordId;
          const href = link.getAttribute('href');
          if (!recordId || !href) return;
          e.preventDefault();
          e.stopPropagation();
          if (isConsoleAppActive()) {
            openTargetAsSubtab({ recordId, url: href });
            return;
          }
          if (window.$A && typeof window.$A.get === 'function') {
            const navEvt = window.$A.get('e.force:navigateToSObject');
            if (navEvt) {
              navEvt.setParams({ recordId, slideDevName: 'detail' });
              navEvt.fire();
              return;
            }
          }
          window.location.assign(href);
        });
      });
    }

    // -------------------------------------------------------------------------
    // Shadow DOM Mounting, Cross-Object Resolution & Lifecycle
    // -------------------------------------------------------------------------
    function walkModShadowRoots(root, visitor, visited = new WeakSet()) {
      if (!root || visited.has(root)) return;
      visited.add(root);
      visitor(root);
      if (!root.querySelectorAll) return;
      const all = root.querySelectorAll('*');
      for (const el of all) {
        const sr = el.shadowRoot || el._sfShadowRoot;
        if (sr) walkModShadowRoots(sr, visitor, visited);
      }
    }

    function getActiveInspectorMods() {
      const s = getEnhancerSettings();
      if (!s) return [];
      const mods = (s.inspectorMods && Array.isArray(s.inspectorMods.mods)) ? s.inspectorMods.mods : [];
      return mods.filter(
        (m) =>
          m &&
          m.enabled !== false &&
          m.schemaVersion === 2 &&
          m.id &&
          m.target &&
          m.target.keyPrefix &&
          Array.isArray(m.data) &&
          m.view &&
          typeof m.view === 'object'
      );
    }

    const modMountedByUid = new Map(); // `${modId}:${uid}` -> Element
    const modVisibleRightPaneCards = new Map(); // `${modId}:${contextId}` -> Element
    let nextModMountUid = 1;

    function ensureModGlobalStyles() {
      if (document.getElementById('sfe-inspector-mod-styles')) return;
      const st = document.createElement('style');
      st.id = 'sfe-inspector-mod-styles';
      st.textContent = `
        .forceHoverPanel .container {
          height: auto !important;
          overflow-y: auto !important;
        }
      `;
      (document.head || document.documentElement).appendChild(st);
    }

    function getModHostUid(hostEl, createIfMissing) {
      if (!hostEl || typeof hostEl.getAttribute !== 'function') return null;
      try {
        let uid = hostEl.getAttribute('data-sfe-mount-uid');
        if (!uid && createIfMissing) {
          uid = `sfe_${nextModMountUid++}`;
          hostEl.setAttribute('data-sfe-mount-uid', uid);
        }
        return uid;
      } catch (_) {
        return null;
      }
    }

    function trackModMountedElement(modId, hostKey, el) {
      const uid = getModHostUid(hostKey, true);
      if (uid && el) modMountedByUid.set(`${modId}:${uid}`, el);
    }

    function clearModMountedElement(modId, hostKey) {
      const uid = getModHostUid(hostKey, false);
      if (uid) modMountedByUid.delete(`${modId}:${uid}`);
    }

    function findModMountedChild(modId, hostKey, container, className) {
      const uid = getModHostUid(hostKey, false);
      const tracked = uid ? modMountedByUid.get(`${modId}:${uid}`) : null;
      const children = [];
      try {
        for (const n of container.childNodes || []) {
          if (
            n &&
            n.nodeType === 1 &&
            n.classList &&
            n.classList.contains(className) &&
            n.dataset.sfeModId === modId
          ) {
            children.push(n);
          }
        }
      } catch (_) {}
      if (!children.length && typeof container.querySelector === 'function') {
        try {
          const q = container.querySelector(`.${className}[data-sfe-mod-id="${modId}"]`);
          if (q) children.push(q);
        } catch (_) {}
      }

      let kept = null;
      if (tracked && tracked.isConnected && tracked.classList && tracked.classList.contains(className)) {
        kept = tracked;
      } else if (children.length) {
        kept = children[0];
      }

      for (const extra of children) {
        if (extra !== kept) {
          try { extra.remove(); } catch (_) {}
        }
      }
      if (kept) trackModMountedElement(modId, hostKey, kept);
      return kept;
    }

    function clearAllModInjectedNodes() {
      for (const el of modMountedByUid.values()) {
        try { if (el && el.remove) el.remove(); } catch (_) {}
      }
      modMountedByUid.clear();
      modVisibleRightPaneCards.clear();
      walkModShadowRoots(document, (root) => {
        if (!root.querySelectorAll) return;
        root
          .querySelectorAll('.sfe-mod-hover-box, .sfe-mod-highlights-bar, .sfe-mod-banner, .sfe-mod-rightpane-card')
          .forEach((el) => el.remove());
      });
    }

    function extractAnyRecordIdFromText(str) {
      if (!str || typeof str !== 'string') return null;
      const m = str.match(/(?:^|\/|\b|outputLookupLink-)([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})(?:\b|\/|$|\?)/);
      if (!m) return null;
      const candidate = m[1];
      return /^[a-zA-Z0-9]{3}0[a-zA-Z0-9]{11,14}$/.test(candidate) ? candidate : null;
    }

    function extractModRecordIdByPrefix(str, prefix) {
      if (!str || !prefix) return null;
      const re = new RegExp(`(?:^|/|\\b|outputLookupLink-)(${prefix}[a-zA-Z0-9]{12,15})(?:\\b|/|$|\\?)`, 'i');
      const m = String(str).match(re);
      return m ? m[1] : null;
    }

    function readContextRecordIdByPrefix(el, prefix) {
      const pLower = String(prefix || '').toLowerCase();
      let cur = el;
      for (let i = 0; cur && i < 12; i++) {
        try {
          if (typeof cur.recordId === 'string') {
            const matched = extractModRecordIdByPrefix(cur.recordId, prefix);
            if (matched) return matched;
            const anyId = extractAnyRecordIdFromText(cur.recordId);
            if (anyId && !anyId.toLowerCase().startsWith(pLower)) return null;
          }
          const attr = cur.getAttribute && (cur.getAttribute('data-record-id') || cur.getAttribute('record-id'));
          if (attr) {
            const matched = extractModRecordIdByPrefix(attr, prefix);
            if (matched) return matched;
            const anyId = extractAnyRecordIdFromText(attr);
            if (anyId && !anyId.toLowerCase().startsWith(pLower)) return null;
          }
        } catch (_) {}
        const rn = cur.getRootNode ? cur.getRootNode() : null;
        cur = cur.parentElement || (rn && rn.host) || null;
      }

      const path = location.pathname || '';
      const urlMatched = extractModRecordIdByPrefix(path, prefix);
      if (urlMatched) return urlMatched;
      const urlRecordMatch = path.match(/\/lightning\/r\/(?:[^/]+\/)?([a-zA-Z0-9]{15,18})(?:\/|$|\?)/i);
      if (urlRecordMatch && !urlRecordMatch[1].toLowerCase().startsWith(pLower)) {
        return null;
      }

      try {
        const subtabLinks = document.querySelectorAll(
          'li.slds-sub-tabs__item.slds-is-active a[href*="/lightning/r/"], li.slds-sub-tabs__item a[aria-selected="true"][href*="/lightning/r/"]'
        );
        for (const a of subtabLinks) {
          const href = a.getAttribute('href') || '';
          const m = extractModRecordIdByPrefix(href, prefix);
          if (m) return m;
          if (/\/lightning\/r\//i.test(href)) return null;
        }
        const activeTabLinks = document.querySelectorAll(
          `li.active a[href*="${prefix}"], li.slds-is-active a[href*="${prefix}"], a[aria-selected="true"][href*="${prefix}"]`
        );
        for (const a of activeTabLinks) {
          const m = extractModRecordIdByPrefix(a.getAttribute('href'), prefix);
          if (m) return m;
        }
      } catch (_) {}
      return null;
    }

    async function resolveRightPaneTargetId(plugin, contextId, { force = false } = {}) {
      const rpCfg = plugin.mounts && plugin.mounts.rightPane;
      if (!rpCfg || rpCfg === true || !rpCfg.onObject) return contextId;
      const keyPrefix = plugin.target.keyPrefix;
      const cacheKey = `${plugin.id}:${contextId}`;
      if (!modParentCaches.has(plugin.id)) modParentCaches.set(plugin.id, new Map());
      const pMap = modParentCaches.get(plugin.id);
      const cached = pMap.get(contextId);
      const ttl = cached && cached.targetId ? MOD_PARENT_TTL_MS : MOD_PARENT_NULL_TTL_MS;
      if (!force && cached && Date.now() - cached.cachedAt < ttl) {
        return cached.targetId;
      }
      if (modParentInFlight.has(cacheKey)) return modParentInFlight.get(cacheKey);

      const p = (async () => {
        const resolverSteps = Array.isArray(rpCfg.resolveTarget) ? rpCfg.resolveTarget : [];
        const ctxObjName = rpCfg.onObject.objectApiName;
        const stepRecords = {};
        const stepSourceRoots = {};
        let ctxRecFlat = null;

        const cleanApiLabel = (name) =>
          String(name || '')
            .replace(/__(?:c|r)$/i, '')
            .replace(/_/g, ' ')
            .trim();

        const deriveSourceLabel = (rs) => {
          if (rs && typeof rs.sourceLabel === 'string') {
            return rs.sourceLabel.trim() || null;
          }
          if (!rs || rs.type === 'recordField') return null;
          if (rs.type === 'followLookup') {
            const rootName = (rs.fromStep && stepSourceRoots[rs.fromStep]) || rs.objectApiName || rs.viaField;
            const cleaned = cleanApiLabel(rootName);
            return cleaned ? `via ${cleaned}` : null;
          }
          if (rs.type === 'relatedList') {
            const cleaned = cleanApiLabel(rs.relatedListId || rs.objectApiName);
            return cleaned ? `via ${cleaned}` : null;
          }
          return null;
        };

        const isStepInferred = (rs) => {
          if (rs && rs.confidence === 'high') return false;
          if (rs && rs.confidence === 'low') return true;
          return !!(rs && rs.type !== 'recordField');
        };

        // Pre-collect all context-object fields needed by recordField / root followLookup steps
        const ctxFieldSet = new Set(['Id']);
        for (const rs of resolverSteps) {
          if (rs.type === 'recordField' && Array.isArray(rs.fields)) {
            rs.fields.forEach((f) => ctxFieldSet.add(f));
          } else if (rs.type === 'followLookup' && !rs.fromStep && rs.viaField) {
            ctxFieldSet.add(rs.viaField);
          }
        }

        const ensureContextRecord = async () => {
          if (ctxRecFlat) return ctxRecFlat;
          const optFields = qualifyAuraFields(ctxObjName, Array.from(ctxFieldSet));
          const raw = await modAuraCall('aura://RecordUiController/ACTION$getRecordWithFields', {
            recordId: contextId,
            optionalFields: optFields
          }).catch(() => null);
          ctxRecFlat = raw ? flattenAuraRecord(raw) : { id: contextId };
          return ctxRecFlat;
        };

        for (const rs of resolverSteps) {
          if (!rs || !rs.type) continue;

          if (rs.type === 'recordField') {
            const rec = await ensureContextRecord();
            for (const f of rs.fields || []) {
              const m = extractModRecordIdByPrefix(sfeResolvePath(rec, f), keyPrefix);
              if (m) {
                pMap.set(contextId, { targetId: m, sourceLabel: deriveSourceLabel(rs), isInferred: isStepInferred(rs), cachedAt: Date.now() });
                return m;
              }
            }
          } else if (rs.type === 'followLookup') {
            const sourceRec = rs.fromStep ? stepRecords[rs.fromStep] : await ensureContextRecord();
            if (!sourceRec) continue;
            const linkedId = sfeResolvePath(sourceRec, rs.viaField);
            if (!linkedId || typeof linkedId !== 'string') continue;
            const directMatch = extractModRecordIdByPrefix(linkedId, keyPrefix);
            if (directMatch) {
              pMap.set(contextId, { targetId: directMatch, sourceLabel: deriveSourceLabel(rs), isInferred: isStepInferred(rs), cachedAt: Date.now() });
              return directMatch;
            }
            const optFields = qualifyAuraFields(rs.objectApiName, ['Id', ...(rs.readFields || [])]);
            const raw = await modAuraCall('aura://RecordUiController/ACTION$getRecordWithFields', {
              recordId: linkedId,
              optionalFields: optFields
            }).catch(() => null);
            const flat = raw ? flattenAuraRecord(raw) : null;
            if (rs.as && flat) {
              stepRecords[rs.as] = flat;
              stepSourceRoots[rs.as] = (rs.fromStep && stepSourceRoots[rs.fromStep]) || rs.objectApiName || rs.viaField;
            }
            if (flat) {
              for (const rf of rs.readFields || []) {
                const m = extractModRecordIdByPrefix(sfeResolvePath(flat, rf), keyPrefix);
                if (m) {
                  pMap.set(contextId, { targetId: m, sourceLabel: deriveSourceLabel(rs), isInferred: isStepInferred(rs), cachedAt: Date.now() });
                  return m;
                }
              }
            }
          } else if (rs.type === 'relatedList' && rs.relatedListId) {
            const relFields = rs.objectApiName
              ? qualifyAuraFields(rs.objectApiName, rs.fields || [])
              : rs.fields || [];
            const rels = await modFetchRelatedRecords(contextId, rs.relatedListId, relFields).catch(() => []);
            for (const r of rels) {
              const flat = flattenAuraRecord(r);
              const val = sfeResolvePath(flat, rs.lookupField);
              const m = extractModRecordIdByPrefix(val, keyPrefix);
              if (m) {
                pMap.set(contextId, { targetId: m, sourceLabel: deriveSourceLabel(rs), isInferred: isStepInferred(rs), cachedAt: Date.now() });
                return m;
              }
            }
          }
        }

        pMap.set(contextId, { targetId: null, sourceLabel: null, isInferred: false, cachedAt: Date.now() });
        return null;
      })();

      modParentInFlight.set(cacheKey, p);
      p.finally(() => modParentInFlight.delete(cacheKey));
      return p;
    }

    const modObjectThemeCache = new Map();
    const modObjectThemeInFlight = new Set();

    function getModObjectThemeInfo(objectApiName) {
      if (!objectApiName) return null;
      if (modObjectThemeCache.has(objectApiName)) return modObjectThemeCache.get(objectApiName);
      if (!modObjectThemeInFlight.has(objectApiName)) {
        modObjectThemeInFlight.add(objectApiName);
        modAuraCall('aura://RecordUiController/ACTION$getObjectInfo', { objectApiName })
          .then((info) => {
            if (info && info.themeInfo) {
              modObjectThemeCache.set(objectApiName, info.themeInfo);
              scheduleModDomScan(30);
            }
          })
          .catch(() => {})
          .finally(() => {
            modObjectThemeInFlight.delete(objectApiName);
          });
      }
      return null;
    }

    const RIGHT_PANE_SELECTOR =
      'flexipage-record-home-scrollable-column.right-col, ' +
      '[id^="rightColumn"], ' +
      '.region-sidebar-right, ' +
      'flexipage-record-home-template-desktop2 .sidebar, ' +
      'flexipage-record-home-three-col-template-desktop2 .right-col';

    function runInspectorModOnRoot(plugin, root) {
      const prefix = plugin.target.keyPrefix;
      const mounts = plugin.mounts || {};

      // 1. Prefetch hover links when hoverPanel is enabled
      if (mounts.hoverPanel && root.querySelectorAll) {
        const links = root.querySelectorAll(`a[href*="${prefix}"]`);
        for (const a of links) {
          const tid = extractModRecordIdByPrefix(a.getAttribute('href'), prefix);
          if (tid && !getCachedModTarget(plugin.id, tid) && !modInFlight.has(`${plugin.id}:${tid}`)) {
            fetchModTargetData(plugin, tid).catch(() => {});
          }
        }
      }

      // 2. Highlights Panel & Record Banner
      const wantsHighlights = !!mounts.highlightsPanel;
      const wantsBanner = !!mounts.recordBanner;
      if ((wantsHighlights || wantsBanner) && root.querySelectorAll) {
        const highlights = root.querySelectorAll('records-highlights2');
        for (const host of highlights) {
          const rect = host.getBoundingClientRect();
          if (!rect || rect.width <= 0 || rect.height <= 0 || rect.top < 0 || rect.top > 280) continue;

          const sr =
            host.shadowRoot ||
            host._sfShadowRoot ||
            (host.querySelector('.highlights.slds-page-header') ? host : null);
          const container = sr ? sr.querySelector('.highlights.slds-page-header') : null;
          const existingBar = container ? findModMountedChild(`${plugin.id}:hl`, host, container, 'sfe-mod-highlights-bar') : null;
          const existingBanner = container ? findModMountedChild(`${plugin.id}:bn`, host, container, 'sfe-mod-banner') : null;

          const tid = readContextRecordIdByPrefix(host, prefix);
          if (!tid) {
            if (existingBar) existingBar.remove();
            if (existingBanner) existingBanner.remove();
            clearModMountedElement(`${plugin.id}:hl`, host);
            clearModMountedElement(`${plugin.id}:bn`, host);
            continue;
          }

          if (!sr || !container) continue;

          const cached = getCachedModTarget(plugin.id, tid);
          const err = getModError(`${plugin.id}:${tid}`);
          if (!cached && !err) {
            fetchModTargetData(plugin, tid).catch(() => {});
            continue;
          }

          if (!host.hasAttribute('data-sfe-highlights-styled')) {
            host.setAttribute('data-sfe-highlights-styled', '1');
            const srStyle = document.createElement('style');
            srStyle.className = 'sfe-highlights-shadow-style';
            srStyle.textContent = `
              .highlights.slds-page-header {
                height: auto !important;
                min-height: 51.5px !important;
              }
            `;
            sr.appendChild(srStyle);
          }
          if (container.style.height !== 'auto') container.style.height = 'auto';

          const stamp = `${tid}|${cached && cached._meta ? cached._meta.cachedAt : ''}|${err ? err.message : ''}`;

          if (wantsBanner) {
            const bannerHtml = renderSfeViewBlocks(plugin, tid, cached, err, 'banner', `banner:${plugin.id}:${tid}`);
            if (!bannerHtml) {
              if (existingBanner) existingBanner.remove();
              clearModMountedElement(`${plugin.id}:bn`, host);
            } else {
              let banner = existingBanner;
              if (!banner) {
                banner = document.createElement('div');
                banner.className = 'sfe-mod-banner';
                banner.dataset.sfeModId = `${plugin.id}:bn`;
                banner.style.cssText = 'margin-bottom:0.5rem; width:100%;';
                trackModMountedElement(`${plugin.id}:bn`, host, banner);
                container.prepend(banner);
              }
              if (banner.dataset.sfeStamp !== stamp) {
                banner.dataset.sfeStamp = stamp;
                banner.innerHTML = bannerHtml;
                bindModContainerEvents(banner);
              }
            }
          }

          if (wantsHighlights) {
            const hlHtml = renderSfeViewBlocks(plugin, tid, cached, err, 'highlights', `highlights:${plugin.id}:${tid}`);
            if (!hlHtml) {
              if (existingBar) existingBar.remove();
              clearModMountedElement(`${plugin.id}:hl`, host);
            } else {
              let bar = existingBar;
              if (!bar) {
                bar = document.createElement('div');
                bar.className = 'sfe-mod-highlights-bar';
                bar.dataset.sfeModId = `${plugin.id}:hl`;
                bar.style.cssText =
                  'margin-top:0.5rem; padding-top:0.625rem; border-top:1px solid var(--lwc-colorBorder, #dddbda); width:100%;';
                trackModMountedElement(`${plugin.id}:hl`, host, bar);
                container.appendChild(bar);
              }
              if (bar.dataset.sfeStamp !== stamp) {
                bar.dataset.sfeStamp = stamp;
                bar.innerHTML = hlHtml;
                bindModContainerEvents(bar);
              }
            }
          }
        }
      }

      // 3. Right Pane / Record Sidebar (target object itself OR cross-object via resolveTarget)
      const rpCfg = mounts.rightPane;
      const rpEnabled = rpCfg === true || (rpCfg && rpCfg.enabled);
      if (rpEnabled && root.querySelectorAll) {
        const isCrossObject = !!(rpCfg && typeof rpCfg === 'object' && rpCfg.onObject && rpCfg.onObject.keyPrefix);
        const contextPrefix = isCrossObject ? rpCfg.onObject.keyPrefix : prefix;
        const rightCols = root.querySelectorAll(RIGHT_PANE_SELECTOR);

        for (const rightCol of rightCols) {
          const rect = rightCol.getBoundingClientRect();
          if (!rect || rect.width <= 0 || rect.height <= 0) continue;
          const existingCard =
            findModMountedChild(plugin.id, rightCol, rightCol, 'sfe-mod-rightpane-card') ||
            rightCol.querySelector(`.sfe-mod-rightpane-card[data-sfe-mod-id="${plugin.id}"]`);
          const mountAttr = `data-sfe-mounted-${plugin.id}`;
          const contextId = readContextRecordIdByPrefix(rightCol, contextPrefix);
          if (!contextId) {
            if (existingCard) existingCard.remove();
            clearModMountedElement(plugin.id, rightCol);
            rightCol.removeAttribute(mountAttr);
            continue;
          }

          const visKey = `${plugin.id}:${contextId}`;
          const prevGlobal = modVisibleRightPaneCards.get(visKey);
          if (!existingCard && prevGlobal && prevGlobal.isConnected) continue;

          let resolvedTargetId = contextId;
          let resolvedSourceLabel = null;
          let resolvedIsInferred = false;
          if (isCrossObject) {
            const pMap = modParentCaches.get(plugin.id);
            const parentEntry = pMap ? pMap.get(contextId) : null;
            const parentTtl = parentEntry && parentEntry.targetId ? MOD_PARENT_TTL_MS : MOD_PARENT_NULL_TTL_MS;
            const isParentStale = !parentEntry || Date.now() - parentEntry.cachedAt >= parentTtl;

            if (isParentStale) {
              resolveRightPaneTargetId(plugin, contextId, { force: true })
                .then((tid) => {
                  if (tid) fetchModTargetData(plugin, tid).catch(() => {});
                  scheduleModDomScan(30);
                })
                .catch(() => {});
            }

            if (parentEntry && !parentEntry.targetId) {
              if (existingCard) existingCard.remove();
              clearModMountedElement(plugin.id, rightCol);
              rightCol.removeAttribute(mountAttr);
              if (modVisibleRightPaneCards.get(visKey) === existingCard) modVisibleRightPaneCards.delete(visKey);
              continue;
            }

            if (!parentEntry) {
              let card = existingCard;
              if (!card) {
                card = createRightPaneCardEl(plugin, rightCol, mountAttr, contextId, visKey);
              }
              card.style.display = 'block';
              card.innerHTML = `<div style="font-size:0.75rem; color:var(--lwc-colorTextWeak, #706e6b);">Checking associated ${escapeModHtml(
                plugin.target.headerTitle || plugin.target.objectApiName
              )}…</div>`;
              continue;
            }
            resolvedTargetId = parentEntry.targetId;
            resolvedSourceLabel = parentEntry.sourceLabel || null;
            resolvedIsInferred = !!parentEntry.isInferred;
          }

          let card = existingCard;
          if (!card) {
            card = createRightPaneCardEl(plugin, rightCol, mountAttr, contextId, visKey);
          }

          card.style.display = 'block';
          const tData = getCachedModTarget(plugin.id, resolvedTargetId);
          const tErr = getModError(`${plugin.id}:${resolvedTargetId}`);
          if (!tData && !tErr) {
            fetchModTargetData(plugin, resolvedTargetId).catch(() => {});
          }

          const targetUrl = `/lightning/r/${plugin.target.objectApiName}/${resolvedTargetId}/view`;
          const targetLabel = (tData && tData._meta && tData._meta.targetName) || resolvedTargetId;
          const headerTitle = plugin.target.headerTitle || plugin.target.objectApiName;
          const themeInfo = getModObjectThemeInfo(plugin.target.objectApiName);
          const iconCfg = (plugin.target && plugin.target.icon) || {};
          const iconBg =
            iconCfg.backgroundColor ||
            (themeInfo && themeInfo.color ? `#${String(themeInfo.color).replace(/^#/, '')}` : '#0176d3');
          const iconSvgPath = iconCfg.svgPath || SFE_DEFAULT_ICON_SVG;
          const iconSvgViewBox = iconCfg.svgViewBox || '0 0 1000 1000';
          const iconImgUrl = (!iconCfg.svgPath && (iconCfg.iconUrl || (themeInfo && themeInfo.iconUrl))) || '';
          const iconInnerHtml = iconImgUrl
            ? `<img src="${escapeModHtml(iconImgUrl)}" alt="" style="width:18px; height:18px; display:block;">`
            : `<svg viewBox="${escapeModHtml(iconSvgViewBox)}" width="18" height="18" fill="#ffffff" aria-hidden="true"><path d="${escapeModHtml(iconSvgPath)}"/></svg>`;

          const inferredScopeKey = `inferred:${plugin.id}:${contextId}:${resolvedTargetId}`;
          const isInferredExpanded = resolvedIsInferred && modExpandedScopes.has(inferredScopeKey);

          const stampWithTheme = `${contextId}|${resolvedTargetId}|${resolvedSourceLabel || ''}|${
            resolvedIsInferred ? (isInferredExpanded ? 'inf1' : 'inf0') : 'dir'
          }|${tData && tData._meta ? tData._meta.cachedAt : ''}|${tErr ? tErr.message : ''}|${iconBg}|${iconImgUrl}`;
          if (card.dataset.sfeStamp === stampWithTheme) continue;
          card.dataset.sfeStamp = stampWithTheme;

          if (resolvedIsInferred) {
            card.style.padding = '0.45rem 0.7rem';
            card.style.border = '1px dashed var(--lwc-colorBorder, #c9c7c5)';
            card.style.background = 'var(--lwc-colorBackground, #f8f9fb)';
            card.style.boxShadow = 'none';

            const smallIconHtml = iconImgUrl
              ? `<img src="${escapeModHtml(iconImgUrl)}" alt="" style="width:13px; height:13px; display:block;">`
              : `<svg viewBox="${escapeModHtml(iconSvgViewBox)}" width="13" height="13" fill="#ffffff" aria-hidden="true"><path d="${escapeModHtml(iconSvgPath)}"/></svg>`;
            const ctxObjLabel = ((rpCfg && rpCfg.onObject && rpCfg.onObject.objectApiName) || 'record').replace(/__(?:c|r)$/i, '').replace(/_/g, ' ');
            const targetObjLabel = ((plugin.target && plugin.target.objectApiName) || 'Record').replace(/__(?:c|r)$/i, '').replace(/_/g, ' ');
            const srcText = resolvedSourceLabel ? ` (${resolvedSourceLabel})` : '';
            const disclaimerText = `${targetObjLabel} not directly assigned on this ${ctxObjLabel}.`;

            card.innerHTML = `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                <div style="display:flex; align-items:center; gap:0.4rem; min-width:0;">
                  <span style="flex:0 0 auto; width:18px; height:18px; opacity:0.72; border-radius:var(--lwc-borderRadiusSmall, 0.2rem); background:${escapeModHtml(
                    iconBg
                  )}; display:inline-flex; align-items:center; justify-content:center;">
                    ${smallIconHtml}
                  </span>
                  <div title="${escapeModHtml(disclaimerText)}" style="font-size:0.78rem; font-weight:600; line-height:1.3; color:var(--lwc-colorTextWeak, #5c5a58); min-width:0; word-break:break-word;">
                    <span>Possible ${escapeModHtml(headerTitle)}: </span>
                    <a class="sfe-mod-record-link" data-record-id="${escapeModHtml(resolvedTargetId)}" href="${escapeModHtml(
                      targetUrl
                    )}" style="color:var(--lwc-colorTextLink, #0176d3); text-decoration:none; font-weight:600;">${escapeModHtml(
                      targetLabel
                    )}</a><span style="font-weight:500; font-size:0.72rem; opacity:0.85;">${escapeModHtml(srcText)}</span>
                  </div>
                </div>
                <button type="button" class="sfe-mod-inferred-toggle" data-sfe-scope="${escapeModHtml(
                  inferredScopeKey
                )}" aria-expanded="${isInferredExpanded ? 'true' : 'false'}" style="flex:0 0 auto; border:1px solid var(--lwc-colorBorder, #dddbda); background:var(--lwc-colorBackgroundAlt, #ffffff); color:var(--lwc-colorTextWeak, #5c5a58); border-radius:4px; padding:1px 6px; font-size:0.7rem; font-weight:600; cursor:pointer; white-space:nowrap;">${
                  isInferredExpanded ? 'Hide ▴' : 'Show ▾'
                }</button>
              </div>
              <div class="sfe-mod-inferred-body" style="display:${isInferredExpanded ? 'block' : 'none'}; margin-top:0.5rem; padding-top:0.45rem; border-top:1px dashed var(--lwc-colorBorder, #dddbda);">
                <div style="font-size:0.7rem; color:#7c4a03; background:#fcf3e0; border:1px solid #f3cf8a; border-radius:4px; padding:4px 7px; margin-bottom:0.5rem; line-height:1.35;">
                  ⚠ ${escapeModHtml(disclaimerText)}
                </div>
                ${renderSfeViewBlocks(plugin, resolvedTargetId, tData, tErr, 'rightPane', `rightpane:${plugin.id}:${contextId}:${resolvedTargetId}`)}
              </div>
            `;
          } else {
            card.style.padding = '0.75rem 1rem';
            card.style.border = '1px solid var(--lwc-cardColorBorder, var(--lwc-colorBorder, #dddbda))';
            card.style.background = 'var(--lwc-cardColorBackground, var(--lwc-colorBackgroundAlt, #ffffff))';
            card.style.boxShadow = 'var(--lwc-cardShadow, 0 2px 2px 0 rgba(0, 0, 0, 0.10))';

            const sourceTagHtml = resolvedSourceLabel
              ? ` <span style="font-size:0.75rem; font-weight:500; color:var(--lwc-colorTextWeak, #706e6b);">(${escapeModHtml(
                  resolvedSourceLabel
                )})</span>`
              : '';

            const headerLinkHtml = isCrossObject
              ? `<span>${escapeModHtml(headerTitle)}: </span>
                 <a class="sfe-mod-record-link" data-record-id="${escapeModHtml(resolvedTargetId)}" href="${escapeModHtml(
                  targetUrl
                )}" style="color:var(--lwc-colorTextLink, #0176d3); text-decoration:none; font-weight:700;">${escapeModHtml(
                  targetLabel
                )}</a>${sourceTagHtml}`
              : `<span>${escapeModHtml(headerTitle)}</span>`;

            card.innerHTML = `
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:0.625rem;">
                <div style="display:flex; align-items:center; gap:0.5rem; min-width:0;">
                  <span style="flex:0 0 auto; width:24px; height:24px; border-radius:var(--lwc-borderRadiusMedium, 0.25rem); background:${escapeModHtml(
                    iconBg
                  )}; display:inline-flex; align-items:center; justify-content:center;">
                    ${iconInnerHtml}
                  </span>
                  <div style="font-size:0.875rem; font-weight:700; line-height:1.3; color:var(--lwc-colorTextDefault, #181818); min-width:0; word-break:break-word;">
                    ${headerLinkHtml}
                  </div>
                </div>
              </div>
              ${renderSfeViewBlocks(plugin, resolvedTargetId, tData, tErr, 'rightPane', `rightpane:${plugin.id}:${contextId}:${resolvedTargetId}`)}
            `;
          }
          bindModContainerEvents(card);
        }
      }
    }

    function createRightPaneCardEl(plugin, rightCol, mountAttr, contextId, visKey) {
      const card = document.createElement('article');
      card.className = 'sfe-mod-rightpane-card slds-card';
      card.dataset.sfeModId = plugin.id;
      card.style.cssText = [
        'display:block',
        'margin:0 0 0.75rem 0',
        'padding:0.75rem 1rem',
        'border-radius:var(--lwc-borderRadiusMedium, 0.25rem)',
        'border:1px solid var(--lwc-cardColorBorder, var(--lwc-colorBorder, #dddbda))',
        'background:var(--lwc-cardColorBackground, var(--lwc-colorBackgroundAlt, #ffffff))',
        'box-shadow:var(--lwc-cardShadow, 0 2px 2px 0 rgba(0, 0, 0, 0.10))',
        'box-sizing:border-box',
        'width:100%',
        'text-align:left'
      ].join(';');
      trackModMountedElement(plugin.id, rightCol, card);
      rightCol.setAttribute(mountAttr, contextId);
      modVisibleRightPaneCards.set(visKey, card);
      rightCol.prepend(card);
      return card;
    }

    function runInspectorModOnHoverPanels(plugin) {
      if (!plugin.mounts || !plugin.mounts.hoverPanel) return;
      const prefix = plugin.target.keyPrefix;
      const panels = document.querySelectorAll('.forceHoverPanel, .uiPanel--preview');
      for (const panel of panels) {
        let tid = null;
        for (const a of panel.querySelectorAll('a')) {
          tid =
            extractModRecordIdByPrefix(a.className, prefix) ||
            extractModRecordIdByPrefix(a.getAttribute('href'), prefix) ||
            extractModRecordIdByPrefix(a.getAttribute('data-recordid'), prefix);
          if (tid) break;
        }
        const mountTarget =
          panel.querySelector('.forceHighlightsPreviewStencil.forceRecordLayout') ||
          panel.querySelector('header.forceHighlightsPanel') ||
          panel.querySelector('.panel-content') ||
          panel.querySelector('.HoverPanel.forceRecordLayout') ||
          panel.querySelector('.panelContent');
        const existingBox =
          (mountTarget && findModMountedChild(plugin.id, panel, mountTarget, 'sfe-mod-hover-box')) ||
          panel.querySelector(`.sfe-mod-hover-box[data-sfe-mod-id="${plugin.id}"]`);
        if (!tid) {
          if (existingBox) existingBox.remove();
          clearModMountedElement(plugin.id, panel);
          continue;
        }
        if (!mountTarget) continue;
        let box = existingBox;
        if (!box) {
          box = document.createElement('div');
          box.className = 'sfe-mod-hover-box';
          box.dataset.sfeModId = plugin.id;
          box.style.cssText =
            'margin-top:8px; padding:8px 4px 4px 4px; box-sizing:border-box; width:100%; border-top:1px solid var(--lwc-colorBorder, #dddbda); text-align:left;';
          trackModMountedElement(plugin.id, panel, box);
          mountTarget.appendChild(box);
        }
        const cached = getCachedModTarget(plugin.id, tid);
        const err = getModError(`${plugin.id}:${tid}`);
        const stamp = `${tid}|${cached && cached._meta ? cached._meta.cachedAt : ''}|${err ? err.message : ''}`;
        if (box.dataset.sfeStamp !== stamp) {
          box.dataset.sfeStamp = stamp;
          box.innerHTML = renderSfeViewBlocks(plugin, tid, cached, err, 'hover', `hover:${plugin.id}:${tid}`);
          bindModContainerEvents(box);
        }
        if (!cached && !err) {
          fetchModTargetData(plugin, tid).catch(() => {});
        }
      }
    }

    let modScanTimer = null;
    function scheduleModDomScan(delayMs = 100) {
      if (modScanTimer) return;
      modScanTimer = setTimeout(() => {
        modScanTimer = null;
        refreshInspectorMods();
      }, delayMs);
    }

    function refreshInspectorMods() {
      if (!isTopWindow || !document.body) return;
      const activeMods = getActiveInspectorMods();
      if (!activeMods.length) {
        clearAllModInjectedNodes();
        if (document.documentElement) {
          for (const attr of Array.from(document.documentElement.attributes)) {
            if (attr.name.startsWith('data-sfe-inspector-mod-')) {
              document.documentElement.removeAttribute(attr.name);
            }
          }
        }
        return;
      }

      // Mark active plugin prefixes so standalone userscripts yield and never duplicate cards
      ensureModGlobalStyles();
      for (const mod of activeMods) {
        const prefix = String(mod.target.keyPrefix || '').toLowerCase();
        if (prefix && document.documentElement) {
          document.documentElement.setAttribute(`data-sfe-inspector-mod-${prefix}`, 'active');
        }
      }

      const { token, context } = resolveModAuraAuth();
      if (!token || !context) {
        scheduleModDomScan(350);
        return;
      }

      for (const mod of activeMods) {
        runInspectorModOnHoverPanels(mod);
      }
      walkModShadowRoots(document, (root) => {
        for (const mod of activeMods) {
          runInspectorModOnRoot(mod, root);
        }
      });
    }

    setInterval(refreshInspectorMods, 850);
    setTimeout(refreshInspectorMods, 400);

  console.log('[Salesforce Enhancer v1.4.1] Ready — Modular shortcuts, Quick Views, composable .sfe.json plugins, developer themes & loading animations.');
})();
