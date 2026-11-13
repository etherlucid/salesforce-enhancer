/**
 * Salesforce Enhancer — Background Service Worker / Script
 * Implements Link Interceptor: intercepts external Salesforce Lightning links
 * and routes them into the active Salesforce browser tab instead of spawning
 * duplicate Salesforce Console tabs.
 */
(() => {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const inFlightTabs = new Map();
  const loadedLightningTabs = new Set();

  function storageGet(keys) {
    return new Promise((resolve) => {
      try {
        const res = api.storage.local.get(keys, (items) => resolve(items || {}));
        if (res && typeof res.then === 'function') {
          res.then((items) => resolve(items || {})).catch(() => resolve({}));
        }
      } catch (_) {
        resolve({});
      }
    });
  }

  function queryTabs(queryInfo) {
    return new Promise((resolve) => {
      try {
        const res = api.tabs.query(queryInfo, (tabs) => resolve(tabs || []));
        if (res && typeof res.then === 'function') {
          res.then((tabs) => resolve(tabs || [])).catch(() => resolve([]));
        }
      } catch (_) {
        resolve([]);
      }
    });
  }

  function getTab(tabId) {
    return new Promise((resolve) => {
      try {
        const res = api.tabs.get(tabId, (tab) => {
          if (api.runtime && api.runtime.lastError) return resolve(null);
          resolve(tab || null);
        });
        if (res && typeof res.then === 'function') {
          res.then((tab) => resolve(tab || null)).catch(() => resolve(null));
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  function sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
      try {
        const res = api.tabs.sendMessage(tabId, message, (response) => {
          if (api.runtime && api.runtime.lastError) return resolve(null);
          resolve(response || null);
        });
        if (res && typeof res.then === 'function') {
          res.then((response) => resolve(response || null)).catch(() => resolve(null));
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  function updateTab(tabId, props) {
    return new Promise((resolve) => {
      try {
        const res = api.tabs.update(tabId, props, (tab) => {
          if (api.runtime && api.runtime.lastError) return resolve(null);
          resolve(tab || null);
        });
        if (res && typeof res.then === 'function') {
          res.then((tab) => resolve(tab || null)).catch(() => resolve(null));
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  function removeTab(tabId) {
    return new Promise((resolve) => {
      try {
        const res = api.tabs.remove(tabId, () => {
          if (api.runtime && api.runtime.lastError) return resolve(false);
          resolve(true);
        });
        if (res && typeof res.then === 'function') {
          res.then(() => resolve(true)).catch(() => resolve(false));
        }
      } catch (_) {
        resolve(false);
      }
    });
  }

  function updateWindow(windowId, props) {
    return new Promise((resolve) => {
      if (!api.windows || !api.windows.update || !windowId) return resolve(null);
      try {
        const res = api.windows.update(windowId, props, (win) => {
          if (api.runtime && api.runtime.lastError) return resolve(null);
          resolve(win || null);
        });
        if (res && typeof res.then === 'function') {
          res.then((win) => resolve(win || null)).catch(() => resolve(null));
        }
      } catch (_) {
        resolve(null);
      }
    });
  }

  async function isLinkInterceptorEnabled() {
    const items = await storageGet(['sf_enhancer_settings']);
    const settings = items && items.sf_enhancer_settings;
    if (!settings || !settings.modules) return true;
    return settings.modules.linkInterceptor !== false;
  }

  function getOrgKeyFromHost(hostname) {
    if (!hostname) return '';
    const lower = hostname.toLowerCase();
    if (
      lower === 'login.salesforce.com' ||
      lower === 'test.salesforce.com' ||
      lower === 'help.salesforce.com' ||
      lower === 'developer.salesforce.com' ||
      lower === 'trailhead.salesforce.com'
    ) {
      return '';
    }
    if (lower.endsWith('.lightning.force.com') || lower.endsWith('.my.salesforce.com')) {
      return lower.split('.')[0] || '';
    }
    return '';
  }

  function parseInterceptableSalesforceUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch (_) {
      return null;
    }

    if (parsed.protocol !== 'https:') return null;
    const orgKey = getOrgKeyFromHost(parsed.hostname);
    if (!orgKey) return null;

    const pathname = parsed.pathname || '/';
    const lowerPath = pathname.toLowerCase();

    // Never intercept auth, SSO, setup, file downloads, or non-Lightning utility endpoints
    const excludedPrefixes = [
      '/secur/',
      '/login',
      '/idp/',
      '/services/',
      '/saml',
      '/_ui/',
      '/apex/',
      '/servlet/',
      '/sfc/',
      '/lightning/setup/'
    ];
    if (
      excludedPrefixes.some((prefix) => lowerPath.startsWith(prefix)) ||
      lowerPath.includes('frontdoor.jsp') ||
      lowerPath.includes('logout.jsp')
    ) {
      return null;
    }

    // 1. Standard Lightning Experience URLs (/lightning/r/..., /o/..., /n/..., /cmp/..., /page/..., /app/...)
    if (
      lowerPath.startsWith('/lightning/r/') ||
      lowerPath.startsWith('/lightning/o/') ||
      lowerPath.startsWith('/lightning/n/') ||
      lowerPath.startsWith('/lightning/cmp/') ||
      lowerPath.startsWith('/lightning/page/') ||
      lowerPath.startsWith('/lightning/app/')
    ) {
      const cleanParams = new URLSearchParams(parsed.search);
      cleanParams.delete('ws');
      const qs = cleanParams.toString();
      const cleanUrl = pathname + (qs ? `?${qs}` : '') + (parsed.hash || '');

      const recMatch = pathname.match(/^\/lightning\/r\/(?:[^/]+\/)?([a-zA-Z0-9]{15,18})(?:\/|$)/);
      return {
        orgKey,
        recordId: recMatch ? recMatch[1] : null,
        url: cleanUrl
      };
    }

    // 2. Classic / MyDomain direct record ID URLs (e.g. https://org.my.salesforce.com/500Vm00001FnNK5IAN)
    const directIdMatch = pathname.match(/^\/([a-zA-Z0-9]{15}|[a-zA-Z0-9]{18})\/?$/);
    if (directIdMatch) {
      const recordId = directIdMatch[1];
      return {
        orgKey,
        recordId,
        url: `/lightning/r/${recordId}/view`
      };
    }

    return null;
  }

  async function findExistingSalesforceTab(orgKey, excludeTabId) {
    const tabs = await queryTabs({ url: ['https://*.lightning.force.com/*'] });
    const candidates = tabs.filter((tab) => {
      if (!tab || tab.id === excludeTabId || !tab.url || tab.discarded) return false;
      try {
        const u = new URL(tab.url);
        if (getOrgKeyFromHost(u.hostname) !== orgKey) return false;
        const p = (u.pathname || '').toLowerCase();
        if (!p.startsWith('/lightning/') || p.startsWith('/lightning/setup/')) return false;
        return true;
      } catch (_) {
        return false;
      }
    });

    if (candidates.length === 0) return null;

    // Prefer an active tab in its window, then most recently accessed / first matching tab
    candidates.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      if (typeof a.lastAccessed === 'number' && typeof b.lastAccessed === 'number') {
        return b.lastAccessed - a.lastAccessed;
      }
      return 0;
    });

    return candidates[0];
  }

  function markTabInFlight(tabId) {
    const now = Date.now();
    inFlightTabs.set(tabId, now);
    // Clean stale entries
    for (const [id, ts] of inFlightTabs.entries()) {
      if (now - ts > 4000) inFlightTabs.delete(id);
    }
  }

  if (api && api.tabs && api.tabs.onRemoved) {
    api.tabs.onRemoved.addListener((tabId) => {
      loadedLightningTabs.delete(tabId);
      inFlightTabs.delete(tabId);
    });
  }

  if (api && api.tabs && api.tabs.onUpdated) {
    api.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      try {
        if (!tabId || tabId < 0) return;

        // Track tabs that have already loaded a Lightning Console workspace so in-tab SPA
        // navigation (history.pushState) or reloads in a second window are never hijacked.
        const currentUrl = changeInfo.url || (tab && tab.url) || '';
        if (changeInfo.status === 'complete' && currentUrl.includes('.lightning.force.com/lightning/')) {
          loadedLightningTabs.add(tabId);
          return;
        }

        if (!changeInfo.url) return;
        if (loadedLightningTabs.has(tabId)) return;
        if (tab && tab.status === 'complete' && !changeInfo.status) return;

        const existingFlight = inFlightTabs.get(tabId);
        if (existingFlight && (Date.now() - existingFlight < 4000)) return;

        const parsedTarget = parseInterceptableSalesforceUrl(changeInfo.url);
        if (!parsedTarget) return;

        const enabled = await isLinkInterceptorEnabled();
        if (!enabled) return;

        const targetTab = await findExistingSalesforceTab(parsedTarget.orgKey, tabId);
        if (!targetTab) return;

        markTabInFlight(tabId);

        const response = await sendMessageToTab(targetTab.id, {
          action: 'linkInterceptorOpen',
          target: {
            recordId: parsedTarget.recordId,
            url: parsedTarget.url
          }
        });

        if (response && response.ok) {
          await updateWindow(targetTab.windowId, { focused: true });
          await updateTab(targetTab.id, { active: true });
          await removeTab(tabId);
        }
      } catch (_) {}
    });
  }
})();
