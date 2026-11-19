(function () {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;
  const GIF_PARROT = api?.runtime?.getURL ? api.runtime.getURL('parrot.gif') : 'parrot.gif';
  const GIF_NYAN = api?.runtime?.getURL ? api.runtime.getURL('nyan.gif') : 'nyan.gif';
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
      bg: '#ffffff'
    },
    'gruvbox-dark': {
      name: 'Gruvbox Dark',
      isDark: true,
      accent: '#fe8019',
      contrast: '#282828',
      bg: '#282828'
    },
    'gruvbox-light': {
      name: 'Gruvbox Light',
      isDark: false,
      accent: '#af3a03',
      contrast: '#fbf1c7',
      bg: '#fbf1c7'
    },
    'solarized-dark': {
      name: 'Solarized Dark',
      isDark: true,
      accent: '#268bd2',
      contrast: '#ffffff',
      bg: '#002b36'
    },
    'solarized-light': {
      name: 'Solarized Light',
      isDark: false,
      accent: '#2aa198',
      contrast: '#ffffff',
      bg: '#fdf6e3'
    },
    'nord': {
      name: 'Nord',
      isDark: true,
      accent: '#88c0d0',
      contrast: '#2e3440',
      bg: '#2e3440'
    },
    'dracula': {
      name: 'Dracula',
      isDark: true,
      accent: '#bd93f9',
      contrast: '#282a36',
      bg: '#282a36'
    },
    'one-dark': {
      name: 'One Dark',
      isDark: true,
      accent: '#61afef',
      contrast: '#21252b',
      bg: '#21252b'
    },
    'custom': {
      name: 'Custom',
      isDark: false,
      accent: '#8b5cf6',
      contrast: '#ffffff',
      bg: '#ffffff'
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
      if (typeof rawKeybinds[k] === 'string') res[k] = rawKeybinds[k].trim();
    }
    return res;
  }

  const DEFAULT_SETTINGS = {
    version: '1.3.3',
    modules: {
      subtabs: true,
      quickViews: true,
      linkInterceptor: true,
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

  let currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  // DOM Elements
  const navTabPlugins = document.getElementById('navTabPlugins');
  const navTabThemes = document.getElementById('navTabThemes');
  const viewPlugins = document.getElementById('viewPlugins');
  const viewThemes = document.getElementById('viewThemes');
  const pluginsActiveCountPill = document.getElementById('pluginsActiveCountPill');
  const txtSearchPlugins = document.getElementById('txtSearchPlugins');
  const btnGearSubtabs = document.getElementById('btnGearSubtabs');
  const btnGearLoading = document.getElementById('btnGearLoading');
  let subtabsSettingsOpen = false;
  let loadingSettingsOpen = false;

  const chkModSubtabs = document.getElementById('chkModSubtabs');
  const chkHideAppName = document.getElementById('chkHideAppName');
  const chkKeybindsEnabled = document.getElementById('chkKeybindsEnabled');
  const btnOpenKeybinds = document.getElementById('btnOpenKeybinds');
  const subtabsHideAppNameRow = document.getElementById('subtabsHideAppNameRow');
  const chkModQuickViews = document.getElementById('chkModQuickViews');
  const chkModLinkInterceptor = document.getElementById('chkModLinkInterceptor');

  const installedModsList = document.getElementById('installedModsList');
  const btnImportModFile = document.getElementById('btnImportModFile');

  const chkModTheming = document.getElementById('chkModTheming');
  const themingDesc = document.getElementById('themingDesc');
  const themingBody = document.getElementById('themingBody');
  const themeChips = document.querySelectorAll('.theme-chip');
  const customColorRow = document.getElementById('customColorRow');
  const customColorPicker = document.getElementById('customColorPicker');
  const customColorHex = document.getElementById('customColorHex');
  const customChipDot = document.getElementById('customChipDot');
  const chkApplyNavigation = document.getElementById('chkApplyNavigation');

  const chkModLoading = document.getElementById('chkModLoading');
  const loadingDesc = document.getElementById('loadingDesc');
  const loadingBody = document.getElementById('loadingBody');
  const presetGifCards = document.querySelectorAll('.gif-card');
  const loadingFileInput = document.getElementById('loadingFileInput');
  const previewBox = document.getElementById('previewBox');
  const previewImg = document.getElementById('previewImg');
  const previewEmpty = document.getElementById('previewEmpty');
  const cardCustomGif = document.getElementById('cardCustomGif');
  const customGifControls = document.getElementById('customGifControls');
  const txtCustomGifUrl = document.getElementById('txtCustomGifUrl');
  const btnOpenUploader = document.getElementById('btnOpenUploader');
  const chkRotate = document.getElementById('chkRotate');

  const btnReset = document.getElementById('btnReset');

  function normalizeLoadingUrl(url) {
    if (url === undefined || url === null) return GIF_PARROT;
    if (typeof url !== 'string') return GIF_PARROT;
    const trimmed = url.trim();
    if (!trimmed || trimmed === 'default') return GIF_SPINNER;
    if (trimmed.includes('//AUBzJ0') || trimmed.includes('ALMAAAAAABQUFP+0AP')) return GIF_PARROT;
    if (trimmed.includes('//AUBxJU') || trimmed.includes('ALMAAAAAABQUFP/Ilv')) return GIF_NYAN;
    if (trimmed.includes('PoQPU5fb') || trimmed.includes('AJEAAAAAAB4eHv')) return GIF_CAT;
    if (trimmed.includes('RIQPU5fb') || trimmed.includes('AJEAAAAAAAF20zi')) return GIF_SPINNER;
    const lower = trimmed.toLowerCase();
    if (lower.includes('parrot') || lower.includes('partyparrot')) return GIF_PARROT;
    if (lower.includes('nyan') || lower.includes('gifer')) return GIF_NYAN;
    if (lower.includes('cat') || lower.includes('giphy') || lower.includes('tenor')) return GIF_CAT;
    if (lower.includes('spinner') || lower === 'default') return GIF_SPINNER;
    return trimmed;
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

  function updateThemeColors(hex) {
    const contrast = getContrastColor(hex);
    document.documentElement.style.setProperty('--primary', hex);
    document.documentElement.style.setProperty('--primary-contrast', contrast);
  }

  function normalizeSettings(loaded) {
    if (!loaded || typeof loaded !== 'object') {
      return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    }

    const res = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

    if (loaded.modules && typeof loaded.modules === 'object') {
      res.modules.subtabs = loaded.modules.subtabs !== false;
      res.modules.quickViews = loaded.modules.quickViews !== false;
      res.modules.linkInterceptor = loaded.modules.linkInterceptor !== false;
      res.modules.inspectorMods = !!(loaded.modules.inspectorMods || loaded.modules.loadingAnimation);
      res.modules.theming = !!loaded.modules.theming;
      res.modules.loadingAnimation = loaded.modules.loadingAnimation === true;
    } else {
      // Legacy settings adapter
      res.modules.subtabs = true;
      res.modules.quickViews = true;
      res.modules.linkInterceptor = true;
      res.modules.inspectorMods = false;
      if (loaded.applyToSalesforce === false && !loaded.isDarkMode && (!loaded.theme || loaded.theme === 'classic')) {
        res.modules.theming = false;
      } else if (loaded.theme && loaded.theme !== 'classic') {
        res.modules.theming = true;
      } else {
        res.modules.theming = false;
      }

      if (loaded.loadingImage && loaded.loadingImage.enabled !== undefined) {
        res.modules.loadingAnimation = !!loaded.loadingImage.enabled;
      } else {
        res.modules.loadingAnimation = false;
      }
    }

    if (loaded.theme && typeof loaded.theme === 'object') {
      res.theme.preset = loaded.theme.preset || 'classic';
      res.theme.customAccent = loaded.theme.customAccent || '#8b5cf6';
      res.theme.applyToNavigation = loaded.theme.applyToNavigation !== false;
    } else if (loaded.theme && typeof loaded.theme === 'string') {
      res.theme.preset = THEMES[loaded.theme] ? loaded.theme : 'custom';
      if (loaded.accentColor) res.theme.customAccent = loaded.accentColor;
      res.theme.applyToNavigation = loaded.applyToSalesforce !== false;
    } else if (loaded.accentColor) {
      res.theme.preset = 'custom';
      res.theme.customAccent = loaded.accentColor;
    }

    const rawImg = (loaded.loadingImage && loaded.loadingImage.url) || loaded.loadingUrl || '';
    res.loadingImage.url = normalizeLoadingUrl(rawImg);
    res.loadingImage.size = (loaded.loadingImage && loaded.loadingImage.size) || 64;
    res.loadingImage.rotate = !!(loaded.loadingImage && loaded.loadingImage.rotate);

    const hideAppName = loaded ? (loaded.hideAppName !== undefined ? !!loaded.hideAppName : (loaded.subtabs && loaded.subtabs.hideAppName !== undefined ? !!loaded.subtabs.hideAppName : false)) : false;
    res.hideAppName = hideAppName;
    res.subtabs = {
      hideAppName: hideAppName,
      keybinds: normalizeKeybinds(loaded.subtabs && loaded.subtabs.keybinds)
    };
    res.inspectorMods = {
      mods: Array.isArray(loaded.inspectorMods && loaded.inspectorMods.mods)
        ? loaded.inspectorMods.mods.filter((m) => m && typeof m === 'object' && m.id && m.target)
        : []
    };

    return res;
  }

  function loadSettings() {
    const api = typeof browser !== 'undefined' ? browser : chrome;
    if (!api || !api.storage || !api.storage.local) {
      updateUI();
      return;
    }

    let loadedOnce = false;
    const applyLoaded = (res) => {
      if (loadedOnce) return;
      loadedOnce = true;
      const loaded = res?.sf_enhancer_settings || res?.sf_appearance_settings;
      currentSettings = normalizeSettings(loaded);
      updateUI();
    };

    try {
      const p = api.storage.local.get(['sf_enhancer_settings', 'sf_appearance_settings'], (res) => {
        applyLoaded(res);
      });
      if (p && typeof p.then === 'function') {
        p.then(applyLoaded).catch(() => {
          if (!loadedOnce) updateUI();
        });
      }
    } catch (_) {
      if (!loadedOnce) updateUI();
    }
  }

  function updateUI() {
    // 1. Subtabs plugin
    const isSubtabsEnabled = currentSettings.modules.subtabs !== false;
    chkModSubtabs.checked = isSubtabsEnabled;
    if (chkHideAppName) {
      chkHideAppName.checked = !!(currentSettings.subtabs?.hideAppName || currentSettings.hideAppName);
    }
    if (chkKeybindsEnabled) {
      chkKeybindsEnabled.checked = currentSettings.subtabs?.keybinds?.enabled !== false;
    }
    if (subtabsHideAppNameRow) {
      subtabsHideAppNameRow.classList.toggle('is-disabled', !subtabsSettingsOpen);
    }
    if (btnGearSubtabs) {
      btnGearSubtabs.classList.toggle('active', subtabsSettingsOpen);
    }

    // 2. Quick Views plugin
    chkModQuickViews.checked = currentSettings.modules.quickViews !== false;

    // 2b. Link Interceptor plugin
    if (chkModLinkInterceptor) {
      chkModLinkInterceptor.checked = currentSettings.modules.linkInterceptor !== false;
    }

    // 2c. Custom Imported Plugins
    renderInstalledModsList();

    // 3. Theming module
    const isThemingEnabled = !!currentSettings.modules.theming;
    chkModTheming.checked = isThemingEnabled;
    if (isThemingEnabled) {
      const activeThemeDef = THEMES[currentSettings.theme.preset] || THEMES['classic'];
      themingDesc.textContent = `Active Theme: ${activeThemeDef.name}`;
      updateThemeColors(currentSettings.theme.preset === 'custom' ? currentSettings.theme.customAccent : activeThemeDef.accent);
    } else {
      themingDesc.textContent = 'Disabled. Native Salesforce theme active.';
      updateThemeColors('#0176d3');
    }

    themeChips.forEach((chip) => {
      const p = chip.dataset.theme;
      if (p === currentSettings.theme.preset) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    if (currentSettings.theme.preset === 'custom') {
      customColorRow.style.display = 'flex';
      customColorPicker.value = currentSettings.theme.customAccent;
      customColorHex.value = currentSettings.theme.customAccent;
      if (customChipDot) customChipDot.style.background = currentSettings.theme.customAccent;
    } else {
      customColorRow.style.display = 'none';
    }

    chkApplyNavigation.checked = currentSettings.theme.applyToNavigation !== false;

    // 4. Built-in Loading Animation plugin
    const isLoadingEnabled = currentSettings.modules.loadingAnimation === true;
    chkModLoading.checked = isLoadingEnabled;
    if (loadingBody) {
      loadingBody.classList.toggle('is-disabled', !loadingSettingsOpen);
    }
    if (btnGearLoading) {
      btnGearLoading.classList.toggle('active', loadingSettingsOpen);
    }

    // Update active plugins badge count
    if (pluginsActiveCountPill) {
      const mods = (currentSettings.inspectorMods && Array.isArray(currentSettings.inspectorMods.mods))
        ? currentSettings.inspectorMods.mods
        : [];
      const activeCustomCount = mods.filter((m) => m && m.enabled !== false).length;
      const activeBuiltInCount =
        (currentSettings.modules.subtabs !== false ? 1 : 0) +
        (currentSettings.modules.linkInterceptor !== false ? 1 : 0) +
        (currentSettings.modules.quickViews !== false ? 1 : 0) +
        (currentSettings.modules.loadingAnimation === true ? 1 : 0);
      pluginsActiveCountPill.textContent = String(activeBuiltInCount + activeCustomCount);
    }

    const currentUrl = (currentSettings.loadingImage.url || '').trim();
    const isPresetParrot = currentUrl === GIF_PARROT || currentUrl === 'parrot.gif' || currentUrl.includes('parrot.gif');
    const isPresetNyan = currentUrl === GIF_NYAN || currentUrl === 'nyan.gif' || currentUrl.includes('nyan.gif') || currentUrl.includes('PYh.gif');
    const isDefault = !currentUrl || currentUrl === GIF_SPINNER;
    const isCustom = !isPresetParrot && !isPresetNyan && !isDefault;

    presetGifCards.forEach((card) => {
      const presetKey = card.dataset.preset;
      if (presetKey === 'spinner') {
        card.classList.toggle('active', isDefault);
      } else if (presetKey === 'parrot') {
        card.classList.toggle('active', isPresetParrot);
      } else if (presetKey === 'nyan') {
        card.classList.toggle('active', isPresetNyan);
      } else if (presetKey === 'custom') {
        card.classList.toggle('active', isCustom);
        const thumb = card.querySelector('#customCardThumb');
        const icon = card.querySelector('#customCardIcon');
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

    if (customGifControls) {
      customGifControls.style.display = isCustom ? 'block' : 'none';
      if (txtCustomGifUrl && isCustom) {
        if (!currentUrl.startsWith('data:')) {
          txtCustomGifUrl.value = currentUrl;
          txtCustomGifUrl.placeholder = 'Paste image/GIF URL...';
        } else {
          txtCustomGifUrl.value = '';
          txtCustomGifUrl.placeholder = 'Custom image uploaded';
        }
      }
    }

    if (previewBox) {
      previewBox.style.display = isCustom ? 'flex' : 'none';
    }

    chkRotate.checked = !!currentSettings.loadingImage.rotate;
    updatePreview();
  }

  function updatePreview() {
    const isEnabled = currentSettings.modules.loadingAnimation === true;
    const url = (currentSettings.loadingImage.url || '').trim();
    if (isEnabled && url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      previewEmpty.style.display = 'none';
      if (currentSettings.loadingImage.rotate) {
        previewImg.style.animation = 'spin 1.2s linear infinite';
      } else {
        previewImg.style.animation = 'none';
      }
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewEmpty.style.display = 'block';
    }
  }

  // Real-time Auto-Save & Broadcast (debounced to eliminate lag during rapid clicks or drags)
  let saveDebounceTimer = null;
  function saveAndApply(immediate = false) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }

    const executeSave = () => {
      saveDebounceTimer = null;
      const api = typeof browser !== 'undefined' ? browser : chrome;
      if (!api || !api.storage || !api.storage.local) return;

      const payload = {
        sf_enhancer_settings: currentSettings,
        // Backward-compatibility mirror for synchronous in-page readers
        sf_appearance_settings: {
          theme: currentSettings.theme.preset,
          accentColor: currentSettings.theme.preset === 'custom' ? currentSettings.theme.customAccent : (THEMES[currentSettings.theme.preset]?.accent || '#0176d3'),
          isDarkMode: !!THEMES[currentSettings.theme.preset]?.isDark,
          applyToSalesforce: currentSettings.modules.theming && currentSettings.theme.applyToNavigation,
          modules: currentSettings.modules,
          subtabs: currentSettings.subtabs,
          hideAppName: currentSettings.hideAppName,
          inspectorMods: currentSettings.inspectorMods,
          loadingImage: {
            enabled: currentSettings.modules.loadingAnimation,
            url: currentSettings.loadingImage.url,
            size: currentSettings.loadingImage.size,
            rotate: currentSettings.loadingImage.rotate
          }
        }
      };

      const broadcast = () => {
        try {
          if (api.tabs && api.tabs.query) {
            api.tabs.query({}, (tabs) => {
              if (tabs && tabs.length) {
                tabs.forEach((tab) => {
                  if (tab && tab.id) {
                    try {
                      const p = api.tabs.sendMessage(tab.id, {
                        action: 'applyEnhancerSettings',
                        settings: currentSettings
                      });
                      if (p && typeof p.catch === 'function') p.catch(() => {});
                    } catch (_) {}
                  }
                });
              }
            });
          }
        } catch (_) {}
      };

      try {
        const p = api.storage.local.set(payload, broadcast);
        if (p && typeof p.then === 'function') {
          p.then(broadcast).catch(broadcast);
        }
      } catch (_) {
        broadcast();
      }
    };

    if (immediate) {
      executeSave();
    } else {
      saveDebounceTimer = setTimeout(executeSave, 35);
    }
  }

  // Event Listeners (apply immediately on change)

  chkModSubtabs.addEventListener('change', (e) => {
    currentSettings.modules.subtabs = e.target.checked;
    updateUI();
    saveAndApply();
  });

  if (chkHideAppName) {
    chkHideAppName.addEventListener('change', (e) => {
      const val = e.target.checked;
      if (!currentSettings.subtabs) currentSettings.subtabs = { keybinds: Object.assign({}, DEFAULT_KEYBINDS) };
      currentSettings.subtabs.hideAppName = val;
      currentSettings.hideAppName = val;
      saveAndApply();
    });
  }

  if (chkKeybindsEnabled) {
    chkKeybindsEnabled.addEventListener('change', (e) => {
      if (!currentSettings.subtabs) currentSettings.subtabs = {};
      currentSettings.subtabs.keybinds = normalizeKeybinds(currentSettings.subtabs.keybinds);
      currentSettings.subtabs.keybinds.enabled = e.target.checked;
      saveAndApply();
    });
  }

  if (btnOpenKeybinds) {
    btnOpenKeybinds.addEventListener('click', () => {
      openExtensionTab('page=keybinds');
    });
  }

  chkModQuickViews.addEventListener('change', (e) => {
    currentSettings.modules.quickViews = e.target.checked;
    updateUI();
    saveAndApply();
  });

  if (chkModLinkInterceptor) {
    chkModLinkInterceptor.addEventListener('change', (e) => {
      currentSettings.modules.linkInterceptor = e.target.checked;
      updateUI();
      saveAndApply();
    });
  }

  function escapePopupHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showModStatus(msg, isError = false) {
    if (!modStatusMsg) return;
    if (!msg) {
      modStatusMsg.textContent = '';
      modStatusMsg.className = 'mod-status-msg';
      return;
    }
    modStatusMsg.textContent = msg;
    modStatusMsg.className = 'mod-status-msg ' + (isError ? 'error' : 'success');
  }

  function validateAndNormalizeModObject(rawMod) {
    if (!rawMod || typeof rawMod !== 'object' || Array.isArray(rawMod)) {
      throw new Error('Mod must be a JSON object.');
    }
    const id = String(rawMod.id || '').trim();
    const name = String(rawMod.name || '').trim();
    if (!id || !name) {
      throw new Error('Mod JSON requires "id" and "name".');
    }
    if (!rawMod.target || typeof rawMod.target !== 'object' || !rawMod.target.keyPrefix || !rawMod.target.objectApiName) {
      throw new Error('Mod JSON requires "target.objectApiName" and "target.keyPrefix".');
    }
    if (!rawMod.pipeline || typeof rawMod.pipeline !== 'object' || !rawMod.pipeline.childRecords) {
      throw new Error('Mod JSON requires "pipeline.childRecords".');
    }
    return Object.assign({}, rawMod, {
      id,
      name,
      version: String(rawMod.version || '1.0.0'),
      enabled: rawMod.enabled !== false
    });
  }

  function installModsFromParsedJson(parsed) {
    const incoming = Array.isArray(parsed)
      ? parsed
      : parsed && Array.isArray(parsed.mods)
      ? parsed.mods
      : [parsed];
    if (!incoming.length) {
      throw new Error('No mod definitions found in JSON.');
    }
    const validated = incoming.map(validateAndNormalizeModObject);
    if (!currentSettings.inspectorMods || !Array.isArray(currentSettings.inspectorMods.mods)) {
      currentSettings.inspectorMods = { mods: [] };
    }
    for (const mod of validated) {
      const idx = currentSettings.inspectorMods.mods.findIndex((m) => m.id === mod.id);
      if (idx >= 0) {
        currentSettings.inspectorMods.mods[idx] = mod;
      } else {
        currentSettings.inspectorMods.mods.push(mod);
      }
    }
    currentSettings.modules.inspectorMods = true;
    updateUI();
    saveAndApply(true);
    return validated;
  }

  function applyPluginSearchFilter() {
    if (!viewPlugins) return;
    const q = (txtSearchPlugins ? txtSearchPlugins.value : '').trim().toLowerCase();
    viewPlugins.querySelectorAll('.plugin-card').forEach((card) => {
      if (!q) {
        card.style.display = '';
        return;
      }
      const hay = `${card.dataset.pluginSearch || ''} ${card.textContent || ''}`.toLowerCase();
      card.style.display = hay.includes(q) ? '' : 'none';
    });
  }

  function renderInstalledModsList() {
    if (!installedModsList) return;
    const mods = (currentSettings.inspectorMods && Array.isArray(currentSettings.inspectorMods.mods))
      ? currentSettings.inspectorMods.mods
      : [];

    currentSettings.modules.inspectorMods = mods.some((m) => m && m.enabled !== false);

    if (!mods.length) {
      installedModsList.innerHTML = '';
      applyPluginSearchFilter();
      return;
    }

    installedModsList.innerHTML = mods
      .map((mod) => {
        const targetObj = (mod.target && mod.target.objectApiName) || 'Record';
        const keyPrefix = (mod.target && mod.target.keyPrefix) || '';
        const isEnabled = mod.enabled !== false;
        return `
          <div class="module-card plugin-card" data-mod-id="${escapePopupHtml(mod.id)}" data-plugin-search="${escapePopupHtml(
          `${mod.name} ${targetObj} ${keyPrefix} ${mod.description || ''}`
        )}">
            <div class="module-header">
              <div>
                <div class="module-title-group">
                  <span class="module-title">${escapePopupHtml(mod.name)}</span>
                  <span class="mod-item-tag">${escapePopupHtml(targetObj)}${
          keyPrefix ? ` (${escapePopupHtml(keyPrefix)})` : ''
        }</span>
                </div>
                ${
                  mod.description
                    ? `<div class="module-desc">${escapePopupHtml(mod.description)}</div>`
                    : ''
                }
              </div>
              <div class="module-controls">
                <button type="button" class="plugin-gear-btn mod-item-edit" data-mod-id="${escapePopupHtml(
                  mod.id
                )}" title="Plugin Settings / JSON">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
                <button type="button" class="plugin-gear-btn danger mod-item-remove" data-mod-id="${escapePopupHtml(
                  mod.id
                )}" title="Remove Plugin">✕</button>
                <label class="switch">
                  <input type="checkbox" class="mod-item-toggle" data-mod-id="${escapePopupHtml(mod.id)}" ${
          isEnabled ? 'checked' : ''
        }>
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    installedModsList.querySelectorAll('.mod-item-toggle').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const modId = chk.dataset.modId;
        const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === modId);
        if (target) {
          target.enabled = e.target.checked;
          currentSettings.modules.inspectorMods = currentSettings.inspectorMods.mods.some((m) => m && m.enabled !== false);
          updateUI();
          saveAndApply(true);
        }
      });
    });

    installedModsList.querySelectorAll('.mod-item-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId || '';
        openExtensionTab(`page=import-plugin${modId ? `&edit=${encodeURIComponent(modId)}` : ''}`);
      });
    });

    installedModsList.querySelectorAll('.mod-item-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        if (!currentSettings.inspectorMods || !Array.isArray(currentSettings.inspectorMods.mods)) return;
        currentSettings.inspectorMods.mods = currentSettings.inspectorMods.mods.filter((m) => m.id !== modId);
        currentSettings.modules.inspectorMods = currentSettings.inspectorMods.mods.some((m) => m && m.enabled !== false);
        updateUI();
        saveAndApply(true);
      });
    });

    applyPluginSearchFilter();
  }

  function openExtensionTab(query) {
    const rel = query ? `uploader.html?${query}` : 'uploader.html';
    const targetUrl = api?.runtime?.getURL ? api.runtime.getURL(rel) : rel;
    try {
      if (api?.tabs && api.tabs.create) {
        api.tabs.create({ url: targetUrl });
        return;
      }
    } catch (_) {}
    window.open(targetUrl, '_blank');
  }

  if (navTabPlugins && navTabThemes && viewPlugins && viewThemes) {
    navTabPlugins.addEventListener('click', () => {
      navTabPlugins.classList.add('active');
      navTabThemes.classList.remove('active');
      viewPlugins.style.display = 'block';
      viewThemes.style.display = 'none';
    });
    navTabThemes.addEventListener('click', () => {
      navTabThemes.classList.add('active');
      navTabPlugins.classList.remove('active');
      viewThemes.style.display = 'block';
      viewPlugins.style.display = 'none';
    });
  }

  if (txtSearchPlugins) {
    txtSearchPlugins.addEventListener('input', applyPluginSearchFilter);
  }

  if (btnGearSubtabs) {
    btnGearSubtabs.addEventListener('click', () => {
      subtabsSettingsOpen = !subtabsSettingsOpen;
      updateUI();
    });
  }

  if (btnGearLoading) {
    btnGearLoading.addEventListener('click', () => {
      loadingSettingsOpen = !loadingSettingsOpen;
      updateUI();
    });
  }

  if (btnImportModFile) {
    btnImportModFile.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openExtensionTab('page=import-plugin');
    });
  }

  chkModTheming.addEventListener('change', (e) => {
    currentSettings.modules.theming = e.target.checked;
    updateUI();
    saveAndApply();
  });

  themeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.theme;
      if (!preset) return;
      currentSettings.theme.preset = preset;
      currentSettings.modules.theming = true;
      chkModTheming.checked = true;
      updateUI();
      saveAndApply();
    });
  });

  customColorPicker.addEventListener('input', (e) => {
    currentSettings.theme.customAccent = e.target.value;
    customColorHex.value = e.target.value;
    if (customChipDot) customChipDot.style.background = e.target.value;
    updateThemeColors(e.target.value);
    saveAndApply();
  });

  customColorHex.addEventListener('change', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      currentSettings.theme.customAccent = val;
      customColorPicker.value = val;
      if (customChipDot) customChipDot.style.background = val;
      updateThemeColors(val);
      saveAndApply();
    }
  });

  chkApplyNavigation.addEventListener('change', (e) => {
    currentSettings.theme.applyToNavigation = e.target.checked;
    saveAndApply();
  });

  chkModLoading.addEventListener('change', (e) => {
    currentSettings.modules.loadingAnimation = e.target.checked;
    if (e.target.checked) {
      loadingSettingsOpen = true;
    }
    updateUI();
    saveAndApply();
  });

  function openUploader() {
    openExtensionTab('page=loading-animation');
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please select a valid image or GIF file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const dataUrl = loadEvt.target.result;
      currentSettings.loadingImage.url = dataUrl;
      currentSettings.modules.loadingAnimation = true;
      chkModLoading.checked = true;
      updateUI();
      saveAndApply();
    };
    reader.readAsDataURL(file);
  }

  presetGifCards.forEach((card) => {
    card.addEventListener('click', () => {
      const presetKey = card.dataset.preset;
      if (presetKey === 'custom') {
        currentSettings.modules.loadingAnimation = true;
        chkModLoading.checked = true;
        const currentUrl = (currentSettings.loadingImage.url || '').trim();
        const isPreset = currentUrl === GIF_PARROT || currentUrl === GIF_NYAN || currentUrl === GIF_SPINNER || currentUrl === 'parrot.gif' || currentUrl === 'nyan.gif' || !currentUrl;
        if (isPreset) {
          currentSettings.loadingImage.url = '';
          updateUI();
          openUploader();
        } else {
          // If already custom and active, open uploader to allow replacing
          if (card.classList.contains('active')) {
            openUploader();
          } else {
            updateUI();
            saveAndApply();
          }
        }
        return;
      }
      const targetUrl = card.dataset.url !== undefined ? card.dataset.url : (PRESET_GIF_MAP[presetKey] || '');
      currentSettings.loadingImage.url = targetUrl;
      currentSettings.modules.loadingAnimation = true;
      chkModLoading.checked = true;
      updateUI();
      saveAndApply();
    });
  });

  if (btnOpenUploader) {
    btnOpenUploader.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openUploader();
    });
  }

  if (txtCustomGifUrl) {
    txtCustomGifUrl.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val) {
        currentSettings.loadingImage.url = val;
        currentSettings.modules.loadingAnimation = true;
        chkModLoading.checked = true;
        updatePreview();
        saveAndApply();
      }
    });
  }

  loadingFileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  });

  // Drag & drop directly into the popup panel (no file dialog needed, keeps popup open!)
  const dropTargets = [previewBox, cardCustomGif, loadingBody];
  dropTargets.forEach((target) => {
    if (!target) return;
    target.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (previewBox) previewBox.classList.add('dragover');
      if (cardCustomGif) cardCustomGif.classList.add('dragover');
    });
    target.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (previewBox) previewBox.classList.remove('dragover');
      if (cardCustomGif) cardCustomGif.classList.remove('dragover');
    });
    target.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (previewBox) previewBox.classList.remove('dragover');
      if (cardCustomGif) cardCustomGif.classList.remove('dragover');
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });
  });

  // Global paste listener (paste image file or image URL directly)
  window.addEventListener('paste', (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type === 'text' && e.target.id !== 'txtCustomGifUrl') {
      return;
    }
    const clipboard = e.clipboardData;
    if (!clipboard) return;

    if (clipboard.files && clipboard.files.length > 0) {
      handleFile(clipboard.files[0]);
      return;
    }

    const pastedText = clipboard.getData('text');
    if (pastedText && (pastedText.startsWith('http://') || pastedText.startsWith('https://') || pastedText.startsWith('data:image/'))) {
      currentSettings.loadingImage.url = pastedText.trim();
      currentSettings.modules.loadingAnimation = true;
      chkModLoading.checked = true;
      updateUI();
      saveAndApply();
    }
  });

  // Listen for storage changes from uploader.html to instantly refresh the popup UI
  if (api && api.storage && api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && (changes.sf_enhancer_settings || changes.sf_appearance_settings)) {
        const newVal = changes.sf_enhancer_settings?.newValue || changes.sf_appearance_settings?.newValue;
        if (newVal) {
          currentSettings = normalizeSettings(newVal);
          updateUI();
        }
      }
    });
  }

  chkRotate.addEventListener('change', (e) => {
    currentSettings.loadingImage.rotate = e.target.checked;
    updatePreview();
    saveAndApply();
  });

  const btnOpenExtensionPage = document.getElementById('btnOpenExtensionPage');
  if (btnOpenExtensionPage) {
    btnOpenExtensionPage.addEventListener('click', () => {
      const onThemes = navTabThemes && navTabThemes.classList.contains('active');
      openExtensionTab(onThemes ? 'page=themes' : 'page=plugins');
    });
  }

  btnReset.addEventListener('click', () => {
    if (confirm('Reset all Salesforce Enhancer modules to default settings?')) {
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      updateUI();
      saveAndApply();
    }
  });

  loadSettings();
})();
