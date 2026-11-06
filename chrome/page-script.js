// ==UserScript==
// @name         Salesforce Enhancer
// @namespace    https://etherlucid.local/
// @version      1.0.1
// @description  Streamlined Salesforce productivity: Subtabs & workspace shortcuts, Quick Views list bookmarking, developer themes (Gruvbox, Solarized, Nord, Dracula), and custom loading animations.
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

  function observeShadowRoot(sr) {
    if (!sr || !dropdownObserver || observedShadowRoots.has(sr)) return;
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
      observeShadowRoot(shadowRoot);
      try {
        if (typeof syncStylesToShadowRoot === 'function') {
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

  const DEFAULT_SETTINGS = {
    version: '1.0.0',
    modules: {
      subtabs: true,
      quickViews: true,
      theming: false,
      loadingAnimation: false
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

    const res = {
      version: '1.0.0',
      modules: {
        subtabs: raw.modules ? raw.modules.subtabs !== false : true,
        quickViews: raw.modules ? raw.modules.quickViews !== false : true,
        theming: raw.modules ? !!raw.modules.theming : (raw.applyToSalesforce === false ? false : !!(raw.theme && raw.theme !== 'classic')),
        loadingAnimation: raw.modules ? raw.modules.loadingAnimation === true : (raw.loadingImage ? raw.loadingImage.enabled === true : false)
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
          const { action, target, options } = event.data;
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
   * Check whether a tab cannot host subtabs (e.g. List Views, Search, Home, Reports, Dashboards)
   */
  function isNonRecordHostTab(tabInfo) {
    if (!tabInfo) return false;
    if (isSearchResultsTab(tabInfo)) return true;
    const url = tabInfo.url || '';
    const title = (tabInfo.title || '').trim();
    return (
      url.includes('/list?filterName=') ||
      (url.includes('/o/') && url.includes('/list')) ||
      url.includes('/lightning/page/home') ||
      url.includes('standard-home') ||
      url.includes('/report/') ||
      url.includes('/dashboard/') ||
      title === 'Home'
    );
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
    if (!isTopWindow) return;
    try {
      const ws = await getWorkspaceAPI();
      const [focused, allTabs] = await Promise.all([
        ws.getFocusedTabInfo().catch(() => null),
        ws.getAllTabInfo ? ws.getAllTabInfo().catch(() => []) : Promise.resolve([])
      ]);

      if (Array.isArray(allTabs) && allTabs.length > 0) {
        preClickPrimaryTabIds = new Set(allTabs.map((t) => t.tabId));
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
   *   If the current tab is a List View, Search, or non-record tab that cannot host subtabs,
   *   routes into a pinned tab, last active record tab, or returns null so Salesforce
   *   can open the record under its proper Account per Console Navigation Rules.
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
        const pinnedKnowledge = allTabs.find(
          (t) =>
            t.pinned &&
            ((t.title && t.title.toLowerCase().includes('knowledge')) ||
              (t.url && t.url.toLowerCase().includes('knowledge')))
        );
        if (pinnedKnowledge) return pinnedKnowledge.tabId;

        if (lastNonSearchParentTabId && allTabs.some((t) => t.tabId === lastNonSearchParentTabId)) {
          return lastNonSearchParentTabId;
        }

        const anyPinned = allTabs.find((t) => t.pinned && !isNonRecordHostTab(t));
        if (anyPinned) return anyPinned.tabId;

        const anyRecordTab = allTabs.find((t) => !isNonRecordHostTab(t));
        if (anyRecordTab) return anyRecordTab.tabId;
      } catch (_) {}
    }

    if (focusedIsNonRecord) {
      return null;
    }

    return currentParentId || lastNonSearchParentTabId;
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

      if (!parentTabId) {
        // If there is no parent tab capable of hosting subtabs (e.g. currently viewing a List View or Search),
        // route directly into ws.openTab(). Salesforce Console Navigation Manager will automatically open or locate
        // the parent Account workspace tab and open the Case subtab inside it!
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

        if (!openInBackground && newSubtabId && ws.focusTab) {
          await ws.focusTab({ tabId: newSubtabId }).catch(() => {});
          setTimeout(() => {
            ws.focusTab({ tabId: newSubtabId }).catch(() => {});
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
              if (!openInBackground && fallbackSubtabId && ws.focusTab) {
                await ws.focusTab({ tabId: fallbackSubtabId }).catch(() => {});
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

        // Essential Fallback: Records governed by Console Navigation Rules (such as Cases configured
        // to open as subtabs of Accounts) cannot be forced under an arbitrary parent workspace tab.
        // Calling ws.openTab() triggers Salesforce's Console Navigation Manager to automatically
        // locate or open the parent Account workspace tab and place the Case subtab inside it!
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
              // If Salesforce opened the Account workspace tab, ensure the Case subtab inside it is created and focused!
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
                    // If the Account workspace tab opened but the Case subtab isn't created yet, open it directly!
                    const subParams = { parentTabId: newTabId, recordId: target.recordId, focus: true };
                    const createdSubtabId = await ws.openSubtab(subParams).catch(() => null);
                    if (createdSubtabId && ws.focusTab) {
                      await ws.focusTab({ tabId: createdSubtabId }).catch(() => {});
                    }
                  }
                } catch (_) {}
              }, 80);
            }
            showToast(openInBackground ? '↳ Opened in background workspace' : '↳ Opened Case under Account workspace');
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
                showToast(openInBackground ? '↳ Opened in background' : '↳ Opened Case under Account workspace');
                return true;
              }
            }
            if (target.url) {
              const urlEvt = window.$A.get('e.force:navigateToURL');
              if (urlEvt) {
                urlEvt.setParams({ url: target.url });
                urlEvt.fire();
                showToast(openInBackground ? '↳ Opened in background' : '↳ Opened Case under Account workspace');
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
          // Check if this new primary tab already has subtabs (e.g. Salesforce opened an Account
          // workspace tab and automatically placed a Case subtab inside it per Console Navigation Rules)
          const tabInfo = await ws.getTabInfo({ tabId: newPrimaryTab.tabId }).catch(() => newPrimaryTab);
          let hasSubtabs = tabInfo && Array.isArray(tabInfo.subtabs) && tabInfo.subtabs.length > 0;
          if (!hasSubtabs) {
            // Give Salesforce 100ms in case the subtab is being actively created
            await new Promise((r) => setTimeout(r, 100));
            const freshInfo = await ws.getTabInfo({ tabId: newPrimaryTab.tabId }).catch(() => null);
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
            showToast(state.openInBackground ? '↳ Opened in background workspace' : '↳ Opened Case under Account workspace');
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
          // NEVER close it if it's the parent Account workspace tab that opened for this record.
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

  if (isTopWindow) {
    const initInterval = setInterval(() => {
      if (window.$A && typeof window.$A.createComponent === 'function') {
        installAuraEventHook();
        snapshotTabState();
        clearInterval(initInterval);
      }
    }, 500);
  }

  // Prevent browser text selection on modifier clicks
  window.addEventListener(
    'selectstart',
    (event) => {
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      if (event.altKey || event.metaKey || event.ctrlKey) {
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'mousedown',
    (event) => {
      const _modSettings = getEnhancerSettings();
      if (_modSettings.modules && _modSettings.modules.subtabs === false) return;
      snapshotTabState();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      if ((isAlt || isCmdOrCtrl) && event.button === 0) {
        event.preventDefault();
        try {
          window.getSelection()?.removeAllRanges();
        } catch (_) {}

        const target = extractTargetFromEvent(event);
        if (target) {
          event.stopPropagation();
        }
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

  function applyAppearanceSettings(rawSettings) {
    const settings = normalizeSettings(rawSettings || getEnhancerSettings());
    let styleEl = document.getElementById('sf-custom-appearance-style');
    const preloadStyle = document.getElementById('sf-preload-theme-style');
    const preloadLoadingStyle = document.getElementById('sf-preload-loading-style');

    const themingEnabled = settings.modules?.theming === true;
    const loadingUrl = getEffectiveLoadingUrl(settings);

    // If theming module is disabled, clean up 100% of injected theme CSS and inline styles
    if (!themingEnabled) {
      if (preloadStyle) preloadStyle.remove();
      removeAllShadowThemeStyles();
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
        .sf-quick-control-btn:hover,
        .sf-quick-settings-btn:hover {
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
          .oneConsoleTabContainer {
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
            --slds-g-color-neutral-base-50: ${baseTheme.textMuted} !important;
            --slds-g-color-neutral-base-30: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-20: ${baseTheme.text} !important;
            --slds-g-color-neutral-base-10: ${baseTheme.text} !important;

            /* Lightning Web Component (LWC) Global Design Tokens */
            --lwc-colorBackground: ${baseTheme.surface} !important;
            --lwc-colorBackgroundAlt: ${baseTheme.surfaceHeader} !important;
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
            --lwc-colorTextWeak: ${baseTheme.textMuted} !important;
            --lwc-colorTextPlaceholder: ${baseTheme.textMuted} !important;
            --lwc-colorTextLink: ${accent} !important;
            --lwc-colorTextIconDefault: ${baseTheme.textMuted} !important;
            --lwc-colorTextButtonDefault: ${baseTheme.text} !important;

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
          one-app-nav-bar .slds-button {
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

          /* Transparent backgrounds for all inner elements of tabs (label link, text, title, dropdown trigger, close x button) */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem *,
          .tabBarContainer ul.tabBarItems > li.tabItem *,
          ul.subtabs > li.tabItem *,
          .subtabs li.tabItem *,
          .slds-sub-tabs__item *,
          .tabItem a,
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
          .tabItem span,
          .tabItem button,
          .tabItem button.slds-button,
          .tabItem button.slds-button_icon,
          .tabItem lightning-button-icon,
          .tabItem lightning-primitive-icon,
          .tabBarContainer .slds-button,
          .slds-sub-tabs__item a,
          .slds-sub-tabs__item .slds-context-bar__label-action,
          .slds-sub-tabs__item .slds-context-bar__icon-action,
          .slds-sub-tabs__item .slds-context-bar__button-action,
          .slds-sub-tabs__item button,
          .slds-sub-tabs__item span {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Ensure hover on tab preserves complete inner transparency */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem:hover *,
          .tabBarContainer ul.tabBarItems > li.tabItem:hover *,
          ul.subtabs > li.tabItem:hover *,
          .subtabs li.tabItem:hover *,
          .slds-sub-tabs__item:hover * {
            background: transparent !important;
            background-color: transparent !important;
          }

          /* Text colors inside tabs */
          .tabItem:not(.slds-is-active):not(.active) a,
          .tabItem:not(.slds-is-active):not(.active) .slds-truncate,
          .slds-sub-tabs__item:not(.slds-is-active) a,
          .slds-sub-tabs__item:not(.slds-is-active) .slds-truncate {
            color: ${baseTheme.textMuted} !important;
          }
          .tabItem.slds-is-active a,
          .tabItem.slds-is-active .slds-truncate,
          .tabItem.active a,
          .tabItem.active .slds-truncate,
          .slds-sub-tabs__item.slds-is-active a,
          .slds-sub-tabs__item.slds-is-active .slds-truncate {
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
          .tabItem button:hover,
          .tabItem button.slds-button_icon:hover,
          .tabItem .slds-context-bar__button-action:hover,
          .tabItem .close:hover,
          .slds-sub-tabs__item button:hover {
            background-color: ${accentTint} !important;
            color: ${accent} !important;
            border-radius: 4px !important;
          }
          .tabItem button:hover svg,
          .tabItem .close:hover svg,
          .tabItem button.slds-button_icon:hover .slds-button__icon {
            fill: ${accent} !important;
            color: ${accent} !important;
          }

          /* Quick Views List View Dropdown Section & Bar */
          .sf-quick-views-wrapper,
          .sf-quick-header-row,
          .sf-quick-list,
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
          .sf-quick-control-btn,
          .sf-quick-settings-btn {
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
          a:not(.slds-button):not(.slds-tabs_default__link):not(.slds-tabs_card__link):not(.slds-tabs_scoped__link):not(.tabItem a) {
            color: ${accent} !important;
          }

          /* Final override to guarantee full tab width background consistency */
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem *,
          .tabBarContainer ul.tabBarItems > li.tabItem *,
          ul.subtabs > li.tabItem *,
          .subtabs li.tabItem *,
          .slds-sub-tabs__item * {
            background: transparent !important;
            background-color: transparent !important;
          }
          .navexConsoleTabContainer ul.tabBarItems > li.tabItem:hover *,
          .tabBarContainer ul.tabBarItems > li.tabItem:hover *,
          ul.subtabs > li.tabItem:hover *,
          .subtabs li.tabItem:hover *,
          .slds-sub-tabs__item:hover * {
            background: transparent !important;
            background-color: transparent !important;
          }
          .tabItem button:hover,
          .tabItem button.slds-button_icon:hover,
          .tabItem .slds-context-bar__button-action:hover,
          .tabItem .close:hover,
          .slds-sub-tabs__item button:hover {
            background-color: ${accentTint} !important;
            color: ${accent} !important;
            border-radius: 4px !important;
          }
        `;
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
      `;
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

    if (themingEnabled && baseTheme && baseTheme.isDark) {
      syncStylesToAllShadowRoots();
      themeSearchAssistantDOM(baseTheme);
    } else {
      removeAllShadowThemeStyles();
      cleanupSearchAssistantDOM();
      cleanupThemeInlineStyles();
    }

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

  function syncStylesToShadowRoot(shadowRoot) {
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
    const hoverBg = hexToRgba(accent, 0.18);

    const existingStyles = shadowRoot.querySelectorAll ? shadowRoot.querySelectorAll('style[id*="sf-shadow-theme-style"]') : [];
    let style = existingStyles[0] || null;
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

    style.textContent = `
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
      [part="formatted-rich-text"] *,
      lightning-formatted-rich-text,
      lightning-formatted-rich-text * {
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

      h1, h2, h3, h4, p, span, label, div {
        color: ${baseTheme.text} !important;
      }
      a {
        color: ${accent} !important;
      }
      .slds-button_neutral,
      button.slds-button_neutral {
        background-color: ${baseTheme.surface} !important;
        color: ${baseTheme.text} !important;
        border-color: ${baseTheme.border} !important;
      }
    `;
  }

  function syncStylesToAllShadowRoots() {
    collectAllShadowRoots();
    for (const sr of trackedShadowRoots) {
      try {
        syncStylesToShadowRoot(sr);
      } catch (_) {}
    }
  }

  function removeAllShadowThemeStyles() {
    function clean(node) {
      if (!node) return;
      if (node.shadowRoot) {
        try {
          const styles = node.shadowRoot.querySelectorAll ? node.shadowRoot.querySelectorAll('style[id*="sf-shadow-theme-style"]') : [];
          for (let i = 0; i < styles.length; i++) styles[i].remove();
        } catch (_) {}
        clean(node.shadowRoot);
      }
      const ch = node.children || [];
      for (let i = 0; i < ch.length; i++) clean(ch[i]);
    }
    try {
      clean(document.documentElement);
    } catch (_) {}
    if (typeof trackedShadowRoots !== 'undefined') {
      for (const sr of trackedShadowRoots) {
        try {
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

    let style = root.querySelector ? root.querySelector('#sf-quick-views-shadow-style') : null;
    if (!style) {
      style = document.createElement('style');
      style.id = 'sf-quick-views-shadow-style';
      try {
        root.appendChild(style);
      } catch (_) {}
    }

    style.textContent = `
      .sf-quick-views-wrapper {
        display: block !important;
        border-bottom: 1px solid ${qvBorder} !important;
        margin-bottom: 4px !important;
        padding-bottom: 4px !important;
        background: ${qvBg} !important;
        background-color: ${qvBg} !important;
        list-style: none !important;
        font-family: inherit !important;
      }
      .sf-quick-header-row {
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
      .sf-quick-list {
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

  function themeSearchAssistantDOM(theme, specificRoot = null) {
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

    function processSearchAssistantTree(node) {
      if (!node) return;

      // 1. Text walker matching "Do more with Search!" empty state
      try {
        const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
        let textNode;
        while ((textNode = walker.nextNode())) {
          const val = textNode.nodeValue || '';
          if (
            val.includes('Do more with Search') ||
            val.includes('Get the right answers') ||
            val.includes('Get insights') ||
            val.includes('search_ai_natural_lang_examples')
          ) {
            let curr = textNode.parentElement;
            let depth = 0;
            let topDialog = null;
            while (curr && depth < 20) {
              const tag = (curr.tagName || '').toLowerCase();
              const cls = typeof curr.className === 'string' ? curr.className : '';
              const role = curr.getAttribute?.('role') || '';
              if (
                role === 'dialog' ||
                tag.includes('assistant-dialog') ||
                cls.includes('slds-modal') ||
                cls.includes('searchAssistantDialog') ||
                tag === 'search_dialog-assistant-dialog' ||
                tag === 'search_assistant-assistant-dialog'
              ) {
                topDialog = curr;
                break;
              }
              if (
                curr === document.body ||
                curr === document.documentElement ||
                cls.includes('desktop') ||
                cls.includes('oneHeader') ||
                cls.includes('viewport')
              ) {
                break;
              }
              if (!curr.parentElement && curr.getRootNode) {
                try {
                  const rootNode = curr.getRootNode();
                  if (rootNode && rootNode.host) {
                    const hostTag = (rootNode.host.tagName || '').toLowerCase();
                    if (hostTag.includes('assistant') || hostTag.includes('search')) {
                      curr = rootNode.host;
                      continue;
                    }
                  }
                } catch (_) {}
                break;
              }
              curr = curr.parentElement;
              depth++;
            }

            const scope = topDialog || textNode.parentElement;
            if (scope) {
              applyThemeToEl(scope);
              const allElements = scope.querySelectorAll ? scope.querySelectorAll('*') : [];
              for (let k = 0; k < allElements.length; k++) {
                const el = allElements[k];
                if (el.nodeType !== 1) continue;
                const tag = el.tagName.toLowerCase();
                if (tag === 'svg' || tag === 'path' || tag === 'img') continue;

                if (tag === 'a') {
                  el.dataset.sfThemeApplied = 'true';
                  el.style.setProperty('color', theme.accent, 'important');
                  continue;
                }

                if (
                  el.classList?.contains('slds-col') ||
                  el.classList?.contains('slds-grid') ||
                  el.classList?.contains('slds-split-view__detail') ||
                  el.classList?.contains('slds-split-view__content') ||
                  el.classList?.contains('slds-split-view') ||
                  el.classList?.contains('slds-scrollable_y') ||
                  el.classList?.contains('slds-modal__content') ||
                  tag.includes('preview') ||
                  tag.includes('empty-state') ||
                  tag.includes('content-container') ||
                  el.className?.includes('preview') ||
                  el.className?.includes('detail') ||
                  el.className?.includes('right') ||
                  el.className?.includes('guidance') ||
                  el.className?.includes('tips')
                ) {
                  applyThemeToEl(el);
                }

                try {
                  const compBg = window.getComputedStyle(el).backgroundColor;
                  if (
                    compBg &&
                    (compBg.includes('255, 255, 255') ||
                     compBg.includes('243, 243, 243') ||
                     compBg.includes('250, 250, 250') ||
                     compBg.includes('248, 249, 250') ||
                     compBg.includes('238, 244, 255') ||
                     compBg === 'rgb(255, 255, 255)')
                  ) {
                    applyThemeToEl(el);
                  }
                } catch (_) {}
              }
            }
          }
        }
      } catch (_) {}

      // 2. Query selectors for search assistant and preview elements
      try {
        const searchSelectors = [
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
          '[data-aura-class*="forceSearch" i]',
          '.slds-illustration',
          '.slds-empty-state'
        ];
        const matches = node.querySelectorAll ? node.querySelectorAll(searchSelectors.join(',')) : [];
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
                 cd.classList.contains('slds-grow'))
              ) {
                applyThemeToEl(cd);
              }
            }
          }
        }
      } catch (_) {}

      // 3. Recurse into open shadow roots
      if (node.shadowRoot) {
        processSearchAssistantTree(node.shadowRoot);
      }
      const children = node.children || [];
      for (let i = 0; i < children.length; i++) {
        if (children[i].shadowRoot) {
          processSearchAssistantTree(children[i].shadowRoot);
        }
      }
    }

    if (specificRoot) {
      processSearchAssistantTree(specificRoot);
    } else {
      processSearchAssistantTree(document.body || document.documentElement);
      if (typeof trackedShadowRoots !== 'undefined') {
        for (const sr of trackedShadowRoots) {
          try {
            processSearchAssistantTree(sr);
          } catch (_) {}
        }
      }
    }
  }

  function interceptAndReplaceMascot() {
    const settings = getEnhancerSettings();
    const customImgUrl = getEffectiveLoadingUrl(settings);
    if (!customImgUrl) return;

    const anim = (settings.loadingImage && settings.loadingImage.rotate) ? 'sf-custom-spin 1.2s linear infinite' : 'none';

    function processNode(el) {
      if (!el || el.nodeType !== 1) return;

      if (el.querySelectorAll) {
        const imgs = el.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
          processNode(imgs[i]);
        }
      }

      if (el.tagName === 'IMG') {
        const srcAttr = (el.src || el.getAttribute('src') || '').toLowerCase();
        const altAttr = (el.alt || el.getAttribute('alt') || '').toLowerCase();
        const titleAttr = (el.title || el.getAttribute('title') || '').toLowerCase();
        const isMascot =
          srcAttr.includes('astro') ||
          srcAttr.includes('codey') ||
          srcAttr.includes('einstein') ||
          srcAttr.includes('cloudy') ||
          srcAttr.includes('appy') ||
          srcAttr.includes('mascot') ||
          altAttr.includes('loading') ||
          altAttr.includes('astro') ||
          altAttr.includes('mascot') ||
          titleAttr.includes('loading') ||
          (el.closest && el.closest('#auraLoadingBox, .auraLoadingBox, .loadingBox, .oneLoading'));

        if (isMascot && el.src !== customImgUrl) {
          el.dataset.origSrc = el.dataset.origSrc || el.src;
          el.src = customImgUrl;
          el.srcset = '';
          el.style.backgroundImage = 'none';
          el.style.animation = anim;
          el.style.objectFit = 'contain';
        }
      }

      if (
        el.id === 'auraLoadingBox' ||
        (el.classList && el.classList.contains('auraLoadingBox')) ||
        (el.classList && el.classList.contains('loadingBox')) ||
        (el.classList && el.classList.contains('oneLoading'))
      ) {
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

    try {
      processNode(document.body);
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

  function getSettingsGearSVG() {
    return `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
  }

  /**
   * Streamlined, modular in-page settings modal
   */
  function openAppearanceSettingsModal() {
    const existingBackdrop = document.getElementById('sf-appearance-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    const existingModal = document.getElementById('sf-appearance-modal');
    if (existingModal) existingModal.remove();

    const current = getEnhancerSettings();
    let draft = JSON.parse(JSON.stringify(current));

    const backdrop = document.createElement('div');
    backdrop.id = 'sf-appearance-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      background: 'rgba(15, 23, 42, 0.65)',
      zIndex: '9999998',
      backdropFilter: 'blur(3px)'
    });

    const modal = document.createElement('div');
    modal.id = 'sf-appearance-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Salesforce Enhancer Settings');
    Object.assign(modal.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '560px',
      maxWidth: '94vw',
      maxHeight: '92vh',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
      zIndex: '9999999',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '13px',
      color: '#0f172a'
    });

    const style = document.createElement('style');
    style.textContent = `
      #sf-appearance-modal * {
        box-sizing: border-box;
        font-family: inherit;
      }
      .sf-modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px 12px 20px;
        border-bottom: 1px solid #e2e8f0;
      }
      .sf-modal-title {
        font-size: 16px;
        font-weight: 700;
        color: #0f172a;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .sf-modal-badge {
        font-size: 11px;
        font-weight: 700;
        background: #0176d3;
        color: #ffffff;
        padding: 2px 7px;
        border-radius: 10px;
      }
      .sf-modal-subtitle {
        font-size: 12px;
        color: #64748b;
        margin-top: 2px;
      }
      .sf-modal-close-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 18px;
        color: #64748b;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .sf-modal-close-btn:hover {
        background: #f1f5f9;
        color: #0f172a;
      }
      .sf-modal-tabs {
        display: flex;
        background: #f8fafc;
        border-bottom: 1px solid #e2e8f0;
        padding: 0 16px;
      }
      .sf-modal-tab-btn {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        padding: 10px 14px;
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .sf-modal-tab-btn:hover {
        color: #0f172a;
      }
      .sf-modal-tab-btn.active {
        color: #0176d3;
        border-bottom-color: #0176d3;
      }
      .sf-modal-body {
        padding: 18px 20px;
        overflow-y: auto;
        flex: 1 1 auto;
      }
      .sf-module-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .sf-module-title {
        font-weight: 600;
        font-size: 13px;
        color: #0f172a;
        margin-bottom: 2px;
      }
      .sf-module-desc {
        font-size: 11px;
        color: #64748b;
      }
      .sf-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
        flex-shrink: 0;
      }
      .sf-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      .sf-slider {
        position: absolute;
        cursor: pointer;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: #cbd5e1;
        transition: .2s;
        border-radius: 22px;
      }
      .sf-slider:before {
        position: absolute;
        content: "";
        height: 16px;
        width: 16px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .2s;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
      .sf-switch input:checked + .sf-slider {
        background-color: #0176d3;
      }
      .sf-switch input:checked + .sf-slider:before {
        transform: translateX(18px);
      }
      .sf-modal-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05rem;
        color: #64748b;
        margin-bottom: 8px;
      }
      .sf-themes-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 14px;
      }
      .sf-theme-btn {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 10px;
        background: #ffffff;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.15s ease;
      }
      .sf-theme-btn:hover {
        border-color: #94a3b8;
        background: #f8fafc;
      }
      .sf-theme-btn.active {
        border-color: #0176d3;
        background: #eff6ff;
        font-weight: 700;
      }
      .sf-theme-swatches {
        display: flex;
        width: 22px;
        height: 22px;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(0,0,0,0.15);
        flex-shrink: 0;
      }
      .sf-theme-swatches span {
        flex: 1;
        height: 100%;
      }
      .sf-custom-color-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .sf-custom-color-row input[type="color"] {
        width: 36px;
        height: 32px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 0;
        cursor: pointer;
        background: none;
      }
      .sf-custom-color-row input[type="text"] {
        flex: 1;
        padding: 6px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 12px;
        font-family: monospace;
      }
      .sf-checkbox-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-top: 1px solid #f1f5f9;
        font-size: 12px;
      }
      .sf-shield-callout {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 11px;
        color: #166534;
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sf-gif-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }
      .sf-gif-card {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 6px;
        text-align: center;
        cursor: pointer;
        background: #ffffff;
        transition: all 0.15s ease;
      }
      .sf-gif-card:hover {
        border-color: #94a3b8;
        background: #f8fafc;
      }
      .sf-gif-card.active {
        border-color: #0176d3;
        background: #eff6ff;
        font-weight: 700;
      }
      .sf-gif-card img {
        width: 38px;
        height: 38px;
        object-fit: contain;
        display: block;
        margin: 0 auto 4px auto;
      }
      .sf-gif-card span {
        font-size: 11px;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sf-input-text {
        width: 100%;
        padding: 7px 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        font-size: 12px;
        margin-bottom: 10px;
      }
      .sf-upload-label {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        width: 100%;
        padding: 8px 12px;
        background: #ffffff;
        border: 1px dashed #cbd5e1;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
        color: #475569;
        margin-bottom: 10px;
        transition: all 0.15s ease;
      }
      .sf-upload-label:hover {
        border-color: #0176d3;
        color: #0176d3;
        background: rgba(1, 118, 211, 0.04);
      }
      .sf-size-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
      }
      .sf-size-btn {
        flex: 1;
        padding: 5px;
        border: 1px solid #cbd5e1;
        border-radius: 4px;
        background: #ffffff;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
      }
      .sf-size-btn.active {
        border-color: #0176d3;
        background: #eff6ff;
        font-weight: 700;
      }
      .sf-preview-panel {
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        padding: 14px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100px;
        position: relative;
        margin-bottom: 12px;
        overflow: hidden;
      }
      .sf-preview-panel img {
        max-height: 80px;
        max-width: 88%;
        object-fit: contain;
        transition: transform 0.2s ease;
      }
      .sf-preview-panel-title {
        position: absolute;
        top: 6px;
        left: 10px;
        font-size: 10px;
        font-weight: 600;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05rem;
      }
      .sf-modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
      }
      .sf-btn {
        padding: 7px 14px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s ease;
      }
      .sf-btn-secondary {
        background: #ffffff;
        border-color: #cbd5e1;
        color: #334155;
      }
      .sf-btn-secondary:hover {
        background: #f1f5f9;
      }
      .sf-btn-primary {
        background: #0176d3;
        color: #ffffff;
      }
      .sf-btn-primary:hover {
        filter: brightness(0.92);
      }
    `;
    modal.appendChild(style);

    modal.innerHTML += `
      <div class="sf-modal-header">
        <div>
          <div class="sf-modal-title">
            Salesforce Enhancer
            <span class="sf-modal-badge">v1.0.0</span>
          </div>
          <div class="sf-modal-subtitle">Modular Productivity, Developer Themes & Animated Loaders</div>
        </div>
        <button type="button" class="sf-modal-close-btn" id="sfModalClose">✕</button>
      </div>

      <div class="sf-modal-tabs">
        <button type="button" class="sf-modal-tab-btn active" id="tabBtnModules">📦 Modules</button>
        <button type="button" class="sf-modal-tab-btn" id="tabBtnThemes">🎨 Developer Themes</button>
        <button type="button" class="sf-modal-tab-btn" id="tabBtnLoading">🎬 Loading Animation</button>
      </div>

      <!-- TAB 1: MODULES -->
      <div class="sf-modal-body" id="tabContentModules">
        <div class="sf-module-card">
          <div>
            <div class="sf-module-title">Subtabs & Workspace Shortcuts</div>
            <div class="sf-module-desc">Alt+Click opens records as subtabs (+Shift in background). Cmd/Ctrl+Click opens in new workspace tab.</div>
          </div>
          <label class="sf-switch">
            <input type="checkbox" id="sfModSubtabs" ${draft.modules.subtabs !== false ? 'checked' : ''}>
            <span class="sf-slider"></span>
          </label>
        </div>

        <div class="sf-module-card">
          <div>
            <div class="sf-module-title">Quick Views List Switcher</div>
            <div class="sf-module-desc">Pin & bookmark your favorite list views at the top of the dropdown with custom order and instant switching.</div>
          </div>
          <label class="sf-switch">
            <input type="checkbox" id="sfModQuickViews" ${draft.modules.quickViews !== false ? 'checked' : ''}>
            <span class="sf-slider"></span>
          </label>
        </div>

        <div class="sf-module-card">
          <div>
            <div class="sf-module-title">Developer Themes</div>
            <div class="sf-module-desc">Gruvbox, Solarized, Nord, Dracula, and One Dark themes. Disabling removes 100% of injected theme CSS.</div>
          </div>
          <label class="sf-switch">
            <input type="checkbox" id="sfModTheming" ${draft.modules.theming === true ? 'checked' : ''}>
            <span class="sf-slider"></span>
          </label>
        </div>

        <div class="sf-module-card">
          <div>
            <div class="sf-module-title">Loading Animation (GIFs)</div>
            <div class="sf-module-desc">Replace Salesforce mascots with authentic animated GIFs (Party Parrot, Nyan Cat, Running Cat) or custom images.</div>
          </div>
          <label class="sf-switch">
            <input type="checkbox" id="sfModLoading" ${draft.modules.loadingAnimation === true ? 'checked' : ''}>
            <span class="sf-slider"></span>
          </label>
        </div>
      </div>

      <!-- TAB 2: DEVELOPER THEMES -->
      <div class="sf-modal-body" id="tabContentThemes" style="display:none;">
        <div class="sf-modal-section-title">Developer Themes</div>
        <div class="sf-themes-grid" id="sfThemesGrid">
          <button type="button" class="sf-theme-btn" data-preset="classic">
            <div class="sf-theme-swatches"><span style="background:#0176d3;"></span><span style="background:#ffffff;"></span></div>
            <span>Classic SF</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="gruvbox-dark">
            <div class="sf-theme-swatches"><span style="background:#fe8019;"></span><span style="background:#282828;"></span></div>
            <span>Gruvbox Dark</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="gruvbox-light">
            <div class="sf-theme-swatches"><span style="background:#af3a03;"></span><span style="background:#fbf1c7;"></span></div>
            <span>Gruvbox Light</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="solarized-dark">
            <div class="sf-theme-swatches"><span style="background:#268bd2;"></span><span style="background:#002b36;"></span></div>
            <span>Solarized Dark</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="solarized-light">
            <div class="sf-theme-swatches"><span style="background:#2aa198;"></span><span style="background:#fdf6e3;"></span></div>
            <span>Solarized Light</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="nord">
            <div class="sf-theme-swatches"><span style="background:#88c0d0;"></span><span style="background:#2e3440;"></span></div>
            <span>Nord</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="dracula">
            <div class="sf-theme-swatches"><span style="background:#bd93f9;"></span><span style="background:#282a36;"></span></div>
            <span>Dracula</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="one-dark">
            <div class="sf-theme-swatches"><span style="background:#61afef;"></span><span style="background:#21252b;"></span></div>
            <span>One Dark</span>
          </button>
          <button type="button" class="sf-theme-btn" data-preset="custom">
            <div class="sf-theme-swatches"><span id="sfCustomSwatchPreview" style="background:${draft.theme.customAccent || '#8b5cf6'};"></span><span style="background:#ffffff;"></span></div>
            <span>Custom Accent</span>
          </button>
        </div>

        <div class="sf-modal-section-title">Custom Accent Color</div>
        <div class="sf-custom-color-row">
          <input type="color" id="sfColorPicker" value="${draft.theme.customAccent || '#8b5cf6'}">
          <input type="text" id="sfColorHex" value="${draft.theme.customAccent || '#8b5cf6'}" placeholder="#8b5cf6">
        </div>

        <div class="sf-checkbox-row">
          <span>Apply horizontal accent bar to navigation bar and workspace tabs</span>
          <input type="checkbox" id="sfChkApplyNav" ${draft.theme.applyToNavigation !== false ? 'checked' : ''}>
        </div>

        <div class="sf-shield-callout">
          <span>🛡️</span>
          <span><strong>Safe Mode Active:</strong> Case Progress Bar (.slds-path stage chevrons) is strictly isolated and protected from all theme styles.</span>
        </div>
      </div>

      <!-- TAB 3: LOADING ANIMATION -->
      <div class="sf-modal-body" id="tabContentLoading" style="display:none;">
        <div class="sf-modal-section-title">Loading Animation Presets</div>
        <div class="sf-gif-grid" id="sfGifGrid">
          <div class="sf-gif-card" data-preset="spinner" data-url="" title="Default Salesforce Spinner">
            <div style="font-size:20px; height:38px; display:flex; align-items:center; justify-content:center; margin:0 auto 4px auto;">🔄</div>
            <span>Default</span>
          </div>
          <div class="sf-gif-card" data-preset="parrot" data-url="${GIF_PARROT}" title="Party Parrot (Animated GIF)">
            <img src="${GIF_PARROT}" alt="Party Parrot">
            <span>Parrot</span>
          </div>
          <div class="sf-gif-card" data-preset="nyan" data-url="${GIF_NYAN}" title="Nyan Cat (Animated GIF)">
            <img src="${GIF_NYAN}" alt="Nyan Cat">
            <span>Nyan Cat</span>
          </div>
          <div class="sf-gif-card" data-preset="custom" title="Custom Image / GIF (Click + to upload)">
            <div id="sfCustomCardIcon" style="font-size:24px; height:38px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 4px auto; color:#0176d3;">+</div>
            <img id="sfCustomCardThumb" src="" style="width:38px; height:38px; object-fit:contain; display:none; margin:0 auto 4px auto;" alt="Custom Image">
            <span>Custom</span>
          </div>
        </div>

        <input type="file" id="sfLoadingFileInput" accept="image/*" style="display:none;">

        <div class="sf-modal-section-title">Display Size</div>
        <div class="sf-size-row" id="sfSizeRow">
          <button type="button" class="sf-size-btn ${draft.loadingImage.size === 40 ? 'active' : ''}" data-size="40">Small (40px)</button>
          <button type="button" class="sf-size-btn ${draft.loadingImage.size === 64 || !draft.loadingImage.size ? 'active' : ''}" data-size="64">Medium (64px)</button>
          <button type="button" class="sf-size-btn ${draft.loadingImage.size === 96 ? 'active' : ''}" data-size="96">Large (96px)</button>
          <button type="button" class="sf-size-btn ${draft.loadingImage.size === 128 ? 'active' : ''}" data-size="128">Jumbo (128px)</button>
        </div>

        <div class="sf-checkbox-row" style="margin-bottom:12px;">
          <span>Rotate image while loading (for static icons)</span>
          <input type="checkbox" id="sfChkRotate" ${draft.loadingImage.rotate ? 'checked' : ''}>
        </div>

        <div class="sf-preview-panel">
          <span class="sf-preview-panel-title">Live Loading Simulation</span>
          <span id="sfPreviewEmpty" style="font-size:12px; color:#94a3b8; font-style:italic; display:${draft.loadingImage.url ? 'none' : 'block'};">
            Salesforce default spinner active
          </span>
          <img id="sfPreviewImg" src="${draft.loadingImage.url || ''}" style="max-height:80px; max-width:80%; object-fit:contain; display:${draft.loadingImage.url ? 'block' : 'none'}; animation:${draft.loadingImage.rotate ? 'sf-custom-spin 1.2s linear infinite' : 'none'};" alt="Preview">
        </div>
      </div>

      <div class="sf-modal-footer">
        <button type="button" class="sf-btn sf-btn-secondary" id="sfBtnReset">Reset Defaults</button>
        <div style="display:flex; gap:8px;">
          <button type="button" class="sf-btn sf-btn-secondary" id="sfBtnCancel">Cancel</button>
          <button type="button" class="sf-btn sf-btn-primary" id="sfBtnSave">Save & Apply</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    const closeModal = () => {
      backdrop.remove();
      modal.remove();
    };

    document.getElementById('sfModalClose').onclick = closeModal;
    document.getElementById('sfBtnCancel').onclick = closeModal;
    backdrop.onclick = closeModal;

    // Tab navigation
    const tabModules = document.getElementById('tabBtnModules');
    const tabThemes = document.getElementById('tabBtnThemes');
    const tabLoading = document.getElementById('tabBtnLoading');
    const contentModules = document.getElementById('tabContentModules');
    const contentThemes = document.getElementById('tabContentThemes');
    const contentLoading = document.getElementById('tabContentLoading');

    const switchTab = (tab) => {
      tabModules.classList.toggle('active', tab === 'modules');
      tabThemes.classList.toggle('active', tab === 'themes');
      tabLoading.classList.toggle('active', tab === 'loading');
      contentModules.style.display = tab === 'modules' ? 'block' : 'none';
      contentThemes.style.display = tab === 'themes' ? 'block' : 'none';
      contentLoading.style.display = tab === 'loading' ? 'block' : 'none';
    };

    tabModules.onclick = () => switchTab('modules');
    tabThemes.onclick = () => switchTab('themes');
    tabLoading.onclick = () => switchTab('loading');

    // Modules switches
    document.getElementById('sfModSubtabs').onchange = (e) => {
      draft.modules.subtabs = e.target.checked;
    };
    document.getElementById('sfModQuickViews').onchange = (e) => {
      draft.modules.quickViews = e.target.checked;
    };
    document.getElementById('sfModTheming').onchange = (e) => {
      draft.modules.theming = e.target.checked;
    };
    document.getElementById('sfModLoading').onchange = (e) => {
      draft.modules.loadingAnimation = e.target.checked;
    };

    // Themes selector
    const themeBtns = modal.querySelectorAll('.sf-theme-btn');
    const colorPicker = document.getElementById('sfColorPicker');
    const colorHex = document.getElementById('sfColorHex');
    const customSwatch = document.getElementById('sfCustomSwatchPreview');

    const refreshThemeButtons = () => {
      const currentPreset = draft.theme?.preset || 'classic';
      themeBtns.forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.preset === currentPreset);
      });
      if (customSwatch) {
        customSwatch.style.background = draft.theme.customAccent || '#8b5cf6';
      }
    };
    refreshThemeButtons();

    themeBtns.forEach((btn) => {
      btn.onclick = () => {
        const p = btn.dataset.preset;
        draft.theme.preset = p;
        draft.modules.theming = true;
        const modThemingChk = document.getElementById('sfModTheming');
        if (modThemingChk) modThemingChk.checked = true;
        refreshThemeButtons();
      };
    });

    colorPicker.oninput = (e) => {
      draft.theme.customAccent = e.target.value;
      draft.theme.preset = 'custom';
      draft.modules.theming = true;
      colorHex.value = e.target.value;
      const modThemingChk = document.getElementById('sfModTheming');
      if (modThemingChk) modThemingChk.checked = true;
      refreshThemeButtons();
    };

    colorHex.onchange = (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        draft.theme.customAccent = val;
        draft.theme.preset = 'custom';
        draft.modules.theming = true;
        colorPicker.value = val;
        const modThemingChk = document.getElementById('sfModTheming');
        if (modThemingChk) modThemingChk.checked = true;
        refreshThemeButtons();
      }
    };

    document.getElementById('sfChkApplyNav').onchange = (e) => {
      draft.theme.applyToNavigation = e.target.checked;
    };

    // Loading Animation
    const gifCards = modal.querySelectorAll('.sf-gif-card');
    const fileInput = document.getElementById('sfLoadingFileInput');
    const sizeBtns = modal.querySelectorAll('.sf-size-btn');
    const chkRotate = document.getElementById('sfChkRotate');
    const previewImg = document.getElementById('sfPreviewImg');
    const previewEmpty = document.getElementById('sfPreviewEmpty');

    const refreshPreview = () => {
      const url = getEffectiveLoadingUrl(draft);
      if (url) {
        previewImg.src = url;
        previewImg.style.display = 'block';
        previewEmpty.style.display = 'none';
        previewImg.style.animation = draft.loadingImage?.rotate ? 'sf-custom-spin 1.2s linear infinite' : 'none';
      } else {
        previewImg.src = '';
        previewImg.style.display = 'none';
        previewEmpty.style.display = 'block';
      }
      const currentUrl = (draft.loadingImage?.url || '').trim();
      const isParrot = currentUrl === GIF_PARROT || currentUrl === 'parrot.gif' || currentUrl.includes('parrot.gif');
      const isNyan = currentUrl === GIF_NYAN || currentUrl === 'nyan.gif' || currentUrl.includes('nyan.gif') || currentUrl.includes('PYh.gif');
      const isDefault = !currentUrl || currentUrl === GIF_SPINNER;
      const isCustom = !isParrot && !isNyan && !isDefault;

      gifCards.forEach((c) => {
        const p = c.dataset.preset;
        if (p === 'spinner') c.classList.toggle('active', isDefault);
        else if (p === 'parrot') c.classList.toggle('active', isParrot);
        else if (p === 'nyan') c.classList.toggle('active', isNyan);
        else if (p === 'custom') {
          c.classList.toggle('active', isCustom);
          const thumb = c.querySelector('#sfCustomCardThumb');
          const icon = c.querySelector('#sfCustomCardIcon');
          if (thumb && icon) {
            if (isCustom && currentUrl) {
              thumb.src = currentUrl;
              thumb.style.display = 'block';
              icon.style.display = 'none';
            } else {
              thumb.src = '';
              thumb.style.display = 'none';
              icon.style.display = 'flex';
            }
          }
        }
      });
    };
    refreshPreview();

    gifCards.forEach((card) => {
      card.onclick = () => {
        const p = card.dataset.preset;
        if (p === 'custom') {
          fileInput.click();
          return;
        }
        const target = card.dataset.url || '';
        draft.loadingImage.url = target;
        draft.modules.loadingAnimation = true;
        const modLoadingChk = document.getElementById('sfModLoading');
        if (modLoadingChk) modLoadingChk.checked = true;
        refreshPreview();
      };
    });

    const handleInPageFile = (file) => {
      if (!file || !file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target.result;
        draft.loadingImage.url = dataUrl;
        draft.modules.loadingAnimation = true;
        const modLoadingChk = document.getElementById('sfModLoading');
        if (modLoadingChk) modLoadingChk.checked = true;
        refreshPreview();
      };
      reader.readAsDataURL(file);
    };

    fileInput.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleInPageFile(file);
    };

    const modalDropTargets = [previewBox, modal.querySelector('.sf-gif-card[data-preset="custom"]')];
    modalDropTargets.forEach((t) => {
      if (!t) return;
      t.ondragover = (e) => { e.preventDefault(); e.stopPropagation(); };
      t.ondrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer && e.dataTransfer.files;
        if (files && files.length > 0) handleInPageFile(files[0]);
      };
    });

    sizeBtns.forEach((btn) => {
      btn.onclick = () => {
        const size = parseInt(btn.dataset.size, 10);
        draft.loadingImage.size = size;
        sizeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      };
    });

    chkRotate.onchange = (e) => {
      draft.loadingImage.rotate = e.target.checked;
      refreshPreview();
    };

    // Reset Defaults
    document.getElementById('sfBtnReset').onclick = () => {
      if (confirm('Reset Salesforce Enhancer settings to defaults?')) {
        draft = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        closeModal();
        saveEnhancerSettings(draft);
        applyAppearanceSettings(draft);
        refreshQuickViewsUI();
        showToast('Reset to Salesforce Enhancer defaults');
      }
    };

    // Save & Apply
    document.getElementById('sfBtnSave').onclick = () => {
      saveEnhancerSettings(draft);
      applyAppearanceSettings(draft);
      refreshQuickViewsUI();
      showToast('Salesforce Enhancer settings saved!');
      closeModal();
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', onKeyDown);
      }
    };
    document.addEventListener('keydown', onKeyDown);
  }

    function getCurrentObjectName() {
      const oMatch = window.location.pathname.match(/\/lightning\/o\/([a-zA-Z0-9_]+)\/(?:list|home)/);
      if (oMatch && oMatch[1]) return oMatch[1];

      const rMatch = window.location.pathname.match(/\/lightning\/r\/([a-zA-Z0-9_]+)\//);
      if (rMatch && rMatch[1] && rMatch[1] !== 'Report' && rMatch[1] !== 'Dashboard') {
        return rMatch[1];
      }

      const entityEl = document.querySelector(
        '.slds-breadcrumb .entityName, .entityName, [data-aura-class="forceEntityIcon"]'
      );
      if (entityEl && entityEl.textContent) {
        const text = entityEl.textContent.trim();
        if (text) return text;
      }

      return 'Case';
    }

    function getQuickViews(objectName) {
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

    function onQuickViewItemClick(view, event, objectName) {
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;

      const doClose = () => {
        closeDropdown();
      };

      // 1. Locate the native option in the dropdown
      const findNativeOption = () => {
        const candidates = document.querySelectorAll(
          '.slds-dropdown [role="option"], .slds-popover [role="option"], .slds-listbox [role="option"], lightning-base-combobox-item, li.slds-listbox__item, li.uiMenuItem, div.slds-listbox__option'
        );
        for (const el of candidates) {
          if (el.closest('.sf-quick-views-wrapper')) continue;

          // Match by 00B ID if available
          if (view.id && view.id.startsWith('00B')) {
            const rowId = extractListViewId(el);
            if (rowId === view.id) return el;
          }

          // Match by text label
          const txt = (el.innerText || el.textContent || '').trim().split('\n')[0].trim();
          if (txt && (txt === view.name || txt.startsWith(view.name))) {
            return el;
          }
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

      // Modifier Clicks (Cmd/Ctrl = new workspace tab, Alt = subtab)
      if (isCmdOrCtrl || isAlt) {
        event.preventDefault();
        event.stopPropagation();
        doClose();

        // Ensure we only navigate to valid IDs or safe URLs
        let targetUrl = view.url;
        if (!targetUrl || targetUrl.includes('%20') || (view.id && view.id.includes(' '))) {
          if (view.id && view.id.startsWith('00B')) {
            targetUrl = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(view.id)}`;
          } else {
            showToast(`Could not determine list view ID for '${view.name}'`);
            return;
          }
        }

        if (isCmdOrCtrl && !isAlt) {
          openTargetAsPrimaryTab({ url: targetUrl }, { focus: !event.shiftKey });
        } else if (isAlt && !isCmdOrCtrl) {
          openTargetAsSubtab({ url: targetUrl }, { openInBackground: event.shiftKey });
        }
        return;
      }

      // Immediately reflect selection in Quick Views UI
      const allQuickItems = document.querySelectorAll('.sf-quick-item');
      allQuickItems.forEach((it) => {
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
      });

      // Normal click: 1. Trigger native selection directly in the open dropdown
      if (nativeOption) {
        event.preventDefault();
        event.stopPropagation();

        const clickTarget = nativeOption.matches('[role="option"]')
          ? nativeOption
          : nativeOption.querySelector('[role="option"], a, button') || nativeOption;

        simulateNativeSelection(clickTarget);
        setTimeout(doClose, 250);
        return;
      }

      // Normal click: 2. If not visible in recent items, search the dropdown's search box
      const searchInput = document.querySelector(
        'input[placeholder*="Search lists" i], input[placeholder*="Search this list" i], input[placeholder*="Search..." i], input[type="search"].slds-input, input.slds-combobox__input'
      );
      if (searchInput && searchInput.offsetParent !== null) {
        event.preventDefault();
        event.stopPropagation();

        searchInput.focus();
        searchInput.value = view.name;
        searchInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        searchInput.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, cancelable: true, key: 'Enter' }));

        setTimeout(() => {
          const searchedOption = findNativeOption();
          if (searchedOption) {
            const clickTarget = searchedOption.matches('[role="option"]')
              ? searchedOption
              : searchedOption.querySelector('[role="option"], a, button') || searchedOption;
            simulateNativeSelection(clickTarget);
            setTimeout(doClose, 250);
          } else {
            fallbackUrlNavigate();
          }
        }, 130);
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

        const targetUrl = `/lightning/o/${objectName}/list?filterName=${encodeURIComponent(filterId)}`;
        if (window.$A && window.$A.get) {
          const listEvt = window.$A.get('e.force:navigateToList');
          if (listEvt) {
            listEvt.setParams({ listViewId: filterId, listViewName: null, scope: objectName });
            listEvt.fire();
            return;
          }
          const urlEvt = window.$A.get('e.force:navigateToURL');
          if (urlEvt) {
            urlEvt.setParams({ url: targetUrl });
            urlEvt.fire();
            return;
          }
        }
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

    function findListViewDropdownContext() {
      // 1. Direct path check (instant O(1) in modern Salesforce Lightning)
      try {
        const directEl = document.querySelector('lst-object-home, force-object-home')
          ?.shadowRoot?.querySelector('lst-list-view-manager, force-list-view-manager')
          ?.shadowRoot?.querySelector('lst-common-list-internal, force-common-list-internal')
          ?.shadowRoot?.querySelector('lst-list-view-manager-header, force-list-view-manager-header')
          ?.shadowRoot?.querySelector('lst-list-view-picker, force-list-view-picker')
          ?.shadowRoot?.querySelector('lst-list-view-picker-dropdown, force-list-view-picker-dropdown')
          ?.shadowRoot?.querySelector('lightning-grouped-combobox')
          ?.shadowRoot?.querySelector('lightning-base-combobox')
          ?.shadowRoot?.querySelector('.slds-dropdown, [role="listbox"], .slds-listbox');

        if (directEl && (directEl.offsetWidth > 0 || (directEl.isConnected && window.getComputedStyle(directEl).display !== 'none'))) {
          const listContainer = directEl.querySelector('ul, ol, [role="listbox"], .slds-listbox') || directEl;
          const innerHeader = findRecentListViewsHeader(directEl);
          let itemWrapper = innerHeader;
          while (itemWrapper && itemWrapper.parentElement && itemWrapper.parentElement !== listContainer) {
            itemWrapper = itemWrapper.parentElement;
          }
          const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
          if (listRoot && listRoot !== document) {
            syncQuickViewsStyleToRoot(listRoot);
          }
          return { popover: directEl, listContainer, itemWrapper, headerEl: innerHeader };
        }
      } catch (_) {}

      // 2. Recursive shadow root scan fallback
      const rootsToSearch = [document];
      function scan(node) {
        if (!node) return;
        if (node.shadowRoot && !rootsToSearch.includes(node.shadowRoot)) {
          rootsToSearch.push(node.shadowRoot);
          scan(node.shadowRoot);
        }
        const ch = node.children || [];
        for (let i = 0; i < ch.length; i++) scan(ch[i]);
      }
      try {
        scan(document.documentElement);
      } catch (_) {}
      if (typeof trackedShadowRoots !== 'undefined') {
        for (const sr of trackedShadowRoots) {
          if (sr && sr.isConnected !== false && !rootsToSearch.includes(sr)) {
            rootsToSearch.push(sr);
          }
        }
      }

      const isListViewPickerComponent = (el) => {
        if (!el) return false;
        let curr = el;
        let depth = 0;
        while (curr && curr !== document.body && curr !== document.documentElement && depth < 20) {
          const tag = (curr.tagName || '').toLowerCase();
          const cls = typeof curr.className === 'string' ? curr.className.toLowerCase() : '';
          if (
            tag === 'force-list-view-picker' ||
            tag === 'force-list-view-manager-header' ||
            tag === 'lightning-grouped-combobox' ||
            cls.includes('forcelistviewpicker') ||
            cls.includes('listviewpicker') ||
            (curr.getAttribute && curr.getAttribute('data-component-id')?.toLowerCase().includes('listviewpicker'))
          ) {
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

      const isCandidateVisible = (el) => {
        if (!el || el.isConnected === false) return false;
        if (el.offsetWidth > 0 && el.offsetHeight > 0) return true;
        try {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        } catch (_) {
          return false;
        }
      };

      // 1. Search for visible dropdowns belonging to list view pickers
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

            const isPicker = isListViewPickerComponent(pop);
            const innerHeader = findRecentListViewsHeader(pop);
            const hasListSearchInput = pop.querySelector ? pop.querySelector('input[placeholder*="Search lists" i], input[placeholder*="Search this list" i]') : null;

            if (isPicker || innerHeader || hasListSearchInput) {
              const listContainer = pop.querySelector('ul, ol, [role="listbox"], .slds-listbox') || pop;
              let itemWrapper = innerHeader;
              while (itemWrapper && itemWrapper.parentElement && itemWrapper.parentElement !== listContainer) {
                itemWrapper = itemWrapper.parentElement;
              }
              const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
              if (listRoot && listRoot !== document) {
                syncQuickViewsStyleToRoot(listRoot);
              }
              return { popover: pop, listContainer, itemWrapper, headerEl: innerHeader };
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
                const hostCombobox = btn.closest ? btn.closest('lightning-base-combobox, lightning-combobox, force-list-view-picker, .slds-combobox') : null;
                if (hostCombobox) {
                  const sr = hostCombobox.shadowRoot || hostCombobox._sfShadowRoot;
                  pop = (sr ? sr.querySelector('.slds-dropdown, [role="listbox"]') : null) || hostCombobox.querySelector('.slds-dropdown, [role="listbox"]');
                }
              }
              if (pop && isCandidateVisible(pop)) {
                const listContainer = pop.querySelector('ul, ol, [role="listbox"], .slds-listbox') || pop;
                const innerHeader = findRecentListViewsHeader(pop);
                let itemWrapper = innerHeader;
                while (itemWrapper && itemWrapper.parentElement && itemWrapper.parentElement !== listContainer) {
                  itemWrapper = itemWrapper.parentElement;
                }
                const listRoot = listContainer.getRootNode ? listContainer.getRootNode() : null;
                if (listRoot && listRoot !== document) {
                  syncQuickViewsStyleToRoot(listRoot);
                }
                return { popover: pop, listContainer, itemWrapper, headerEl: innerHeader };
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
        .sf-quick-views-wrapper {
          border-bottom: 1px solid var(--sf-qv-border, #dddbda) !important;
          margin-bottom: 4px !important;
          padding-bottom: 4px !important;
          background: var(--sf-qv-bg, #ffffff) !important;
          list-style: none !important;
          font-family: inherit !important;
        }
        .sf-quick-header-row {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          padding: 8px 12px 4px 12px !important;
          user-select: none !important;
          font-family: inherit !important;
          background: var(--sf-qv-bg, #ffffff) !important;
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
        .sf-quick-list {
          list-style: none !important;
          margin: 0 !important;
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

      // 1. Dropdown trigger button title attribute: e.g. "Select a List View: All Open Cases"
      const btnTriggers = document.querySelectorAll(
        'button[title*="Select a List View" i], a[title*="Select a List View" i]'
      );
      for (const btn of btnTriggers) {
        const titleAttr = btn.getAttribute('title') || '';
        const m = titleAttr.match(/Select a List View:\s*(.+)/i);
        if (m && m[1]) {
          const name = m[1].trim();
          if (name && name.toLowerCase() !== normObj && name.toLowerCase() !== `${normObj}s`) {
            return name;
          }
        }
      }

      // 2. Trigger text inside the header
      const triggerEls = document.querySelectorAll(
        '.slds-page-header .triggerLinkText, .forceListViewPicker .triggerLinkText, button.slds-button .triggerLinkText, .slds-page-header__title .triggerLinkText, .slds-page-header__name-title .slds-page-header__title'
      );
      for (const el of triggerEls) {
        const txt = (el.innerText || el.textContent || '').trim();
        if (txt && txt.toLowerCase() !== normObj && txt.toLowerCase() !== `${normObj}s` && !txt.startsWith('Select a List View')) {
          return txt;
        }
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
          '.slds-listbox__item [aria-selected="true"], .slds-listbox__item .slds-is-selected, [role="option"][aria-selected="true"], [role="option"].slds-is-selected'
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

      const headerRight = document.createElement('div');
      headerRight.className = 'sf-quick-header-actions';
      headerRight.style.display = 'flex';
      headerRight.style.alignItems = 'center';
      headerRight.style.gap = '4px';

      const settingsBtn = document.createElement('button');
      settingsBtn.className = 'sf-quick-settings-btn';
      settingsBtn.type = 'button';
      settingsBtn.title = 'Customize Colors & Loading Animation';
      settingsBtn.innerHTML = getSettingsGearSVG();
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openAppearanceSettingsModal();
      });
      headerRight.appendChild(settingsBtn);

      headerRow.appendChild(headerLeft);
      headerRow.appendChild(headerRight);
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
          onQuickViewItemClick(view, e, objectName);
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

    function setupSearchInputFilter(popover, listContainer) {
      const inputs = (popover || document).querySelectorAll(
        'input[placeholder*="Search lists" i], input[placeholder*="Search this list" i], input[placeholder*="Search..." i], input[type="search"].slds-input, input.slds-combobox__input'
      );

      inputs.forEach((searchInput) => {
        if (searchInput._sfFilterBound) return;
        searchInput._sfFilterBound = true;

        const onSearch = () => {
          const query = (searchInput.value || '').trim().toLowerCase();
          const quickWrapper = document.querySelector('.sf-quick-views-wrapper');
          if (quickWrapper) {
            const currentViews = getQuickViews(getCurrentObjectName());
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
          setTimeout(checkAndInjectQuickViews, 50);
          setTimeout(checkAndInjectQuickViews, 180);
        };

        searchInput.addEventListener('input', onSearch);
        searchInput.addEventListener('keyup', onSearch);
      });
    }

    /**
     * Complete synchronization & reconciliation for List View renames and ID migrations
     */
    function syncAndReconcileQuickViews(objectName, popover, rowsWithLabels = []) {
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
      if (!ctx) return;

      const { popover, listContainer, itemWrapper, headerEl } = ctx;
      if (popover) {
        observeShadowRoot(popover);
      }
      const objectName = getCurrentObjectName();

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

        // 3. Inject and render Quick Views section (now guaranteed to have up-to-date names!)
        if (listContainer) {
          let quickWrapper = listContainer.querySelector('.sf-quick-views-wrapper');
          if (!quickWrapper) {
            const isUl = listContainer.tagName === 'UL' || listContainer.tagName === 'OL';
            quickWrapper = document.createElement(isUl ? 'li' : 'div');
            quickWrapper.className = 'sf-quick-views-wrapper slds-listbox__item';
            quickWrapper.setAttribute('role', 'presentation');
            const insertBeforeEl = itemWrapper || listContainer.firstElementChild;
            listContainer.insertBefore(quickWrapper, insertBeforeEl);
          }
          renderQuickViewsSection(quickWrapper, quickViews, objectName, popover);
        }

        // 4. Attach buttons strictly 1 per unique view entry
        attachNativeBookmarkButtons(rowsWithLabels, quickViews, objectName, popover);

        setupSearchInputFilter(popover, listContainer);
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

    // Observer on DOM mutations ignoring internal updates
    let checkScheduled = false;
    dropdownObserver = new MutationObserver((mutations) => {
      if (isInternalDOMUpdate) return;

      const isOurs = mutations.every((m) =>
        Array.from(m.addedNodes).concat(Array.from(m.removedNodes)).every(
          (n) => n.nodeType === 1 && (n.classList?.contains('sf-native-bookmark-btn') || n.closest?.('.sf-quick-views-wrapper'))
        )
      );
      if (isOurs) return;

      if (checkScheduled) return;
      checkScheduled = true;
      requestAnimationFrame(() => {
        checkScheduled = false;
        checkAndInjectQuickViews();
        const _s = getEnhancerSettings();
        if (_s.modules?.theming === true) {
          const tKey = (_s.theme && _s.theme.preset) || 'classic';
          const bTheme = THEMES[tKey] || THEMES['classic'];
          if (bTheme && bTheme.isDark) {
            themeSearchAssistantDOM(bTheme);
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
          for (const sr of trackedShadowRoots) {
            observeShadowRoot(sr);
          }
        }
        checkAndInjectQuickViews();
      });
    }

    // Click & focus fallbacks for immediate responsiveness
    window.addEventListener(
      'click',
      (e) => {
        [30, 100, 250, 500, 800, 1200, 2000].forEach((t) => setTimeout(checkAndInjectQuickViews, t));
        if (typeof trackedShadowRoots !== 'undefined') {
          for (const sr of trackedShadowRoots) {
            observeShadowRoot(sr);
          }
        }
        const t = e.target;
        if (t && (t.closest?.('input[type="search"], input.slds-input, button[class*="search" i], [class*="searchAssistant" i]') || (t.getAttribute && (t.getAttribute('placeholder') || '').toLowerCase().includes('search')))) {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 10);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 120);
            }
          }
        }
      },
      true
    );

    window.addEventListener(
      'focusin',
      (e) => {
        [30, 100, 250, 500, 800, 1200].forEach((t) => setTimeout(checkAndInjectQuickViews, t));
        if (typeof trackedShadowRoots !== 'undefined') {
          for (const sr of trackedShadowRoots) {
            observeShadowRoot(sr);
          }
        }
        const t = e.target;
        if (t && (t.closest?.('input[type="search"], input.slds-input, button[class*="search" i]') || (t.getAttribute && (t.getAttribute('placeholder') || '').toLowerCase().includes('search')))) {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 10);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 120);
            }
          }
        }
      },
      true
    );

    window.addEventListener(
      'input',
      (e) => {
        const t = e.target;
        if (t && (t.closest?.('input[type="search"], input.slds-input') || (t.getAttribute && (t.getAttribute('placeholder') || '').toLowerCase().includes('search')))) {
          const _s = getEnhancerSettings();
          if (_s.modules?.theming === true) {
            const tKey = (_s.theme && _s.theme.preset) || 'classic';
            const bTheme = THEMES[tKey] || THEMES['classic'];
            if (bTheme && bTheme.isDark) {
              setTimeout(() => themeSearchAssistantDOM(bTheme), 10);
              setTimeout(() => themeSearchAssistantDOM(bTheme), 100);
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
        if (event.data.__sfEnhancerAction === 'openModal' || event.data.__sfAppearanceAction === 'openModal') {
          openAppearanceSettingsModal();
        } else if (
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
          applyAppearanceSettings(s);
          refreshQuickViewsUI();
        }
      } catch (_) {}
    });

    // Keyboard shortcut: Cmd/Ctrl + Alt + S opens Salesforce Customizer
    window.addEventListener(
      'keydown',
      (e) => {
        if ((e.ctrlKey || e.metaKey) && e.altKey && e.key && e.key.toLowerCase() === 's') {
          e.preventDefault();
          openAppearanceSettingsModal();
        }
      },
      true
    );

    // Initial appearance settings apply
    applyAppearanceSettings(getEnhancerSettings());

    // Request fresh settings from extension storage in case localStorage was not primed
    window.postMessage({ __sfEnhancerAction: 'requestSettings', __sfAppearanceAction: 'requestSettings' }, '*');

    // Initial page load context sync
    function syncPageContextPeriodically() {
      try {
        const objectName = getCurrentObjectName();
        syncAndReconcileQuickViews(objectName, null, []);
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

  console.log('[Salesforce Enhancer v1.0.1] Ready — Modular shortcuts, Quick Views, developer themes & loading animations.');
})();
