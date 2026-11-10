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

  const DEFAULT_SETTINGS = {
    version: '1.2.1',
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

  let currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

  // DOM Elements
  const chkModSubtabs = document.getElementById('chkModSubtabs');
  const chkModQuickViews = document.getElementById('chkModQuickViews');

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
      res.modules.theming = !!loaded.modules.theming;
      res.modules.loadingAnimation = loaded.modules.loadingAnimation === true;
    } else {
      // Legacy settings adapter
      res.modules.subtabs = true;
      res.modules.quickViews = true;
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
    // 1. Subtabs module
    chkModSubtabs.checked = currentSettings.modules.subtabs !== false;

    // 2. Quick Views module
    chkModQuickViews.checked = currentSettings.modules.quickViews !== false;

    // 3. Theming module
    const isThemingEnabled = !!currentSettings.modules.theming;
    chkModTheming.checked = isThemingEnabled;
    if (isThemingEnabled) {
      themingBody.classList.remove('is-disabled');
      const activeThemeDef = THEMES[currentSettings.theme.preset] || THEMES['classic'];
      themingDesc.textContent = `Active Theme: ${activeThemeDef.name}`;
      updateThemeColors(currentSettings.theme.preset === 'custom' ? currentSettings.theme.customAccent : activeThemeDef.accent);
    } else {
      themingBody.classList.add('is-disabled');
      themingDesc.textContent = 'Disabled. Salesforce native look & feel is 100% untouched.';
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

    // 4. Loading module
    const isLoadingEnabled = currentSettings.modules.loadingAnimation === true;
    chkModLoading.checked = isLoadingEnabled;
    if (isLoadingEnabled) {
      loadingBody.classList.remove('is-disabled');
      loadingDesc.textContent = 'Custom animated GIF enabled during Salesforce load states.';
    } else {
      loadingBody.classList.add('is-disabled');
      loadingDesc.textContent = 'Disabled. Native Salesforce mascot & spinner active.';
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
          txtCustomGifUrl.placeholder = 'Paste image/GIF URL or drop file below...';
        } else {
          txtCustomGifUrl.value = '';
          txtCustomGifUrl.placeholder = 'Custom GIF loaded (drop new file to replace)';
        }
      }
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

  // Real-time Auto-Save & Broadcast (no "Save & Apply" button required)
  function saveAndApply() {
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
  }

  // Event Listeners (apply immediately on change)

  chkModSubtabs.addEventListener('change', (e) => {
    currentSettings.modules.subtabs = e.target.checked;
    saveAndApply();
  });

  chkModQuickViews.addEventListener('change', (e) => {
    currentSettings.modules.quickViews = e.target.checked;
    saveAndApply();
  });

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
    updateUI();
    saveAndApply();
  });

  function openUploader() {
    const uploaderUrl = api?.runtime?.getURL ? api.runtime.getURL('uploader.html') : 'uploader.html';
    try {
      if (api?.windows && api.windows.create) {
        api.windows.create({
          url: uploaderUrl,
          type: 'popup',
          width: 460,
          height: 520
        }, () => {});
        return;
      }
    } catch (_) {}
    try {
      if (api?.tabs && api.tabs.create) {
        api.tabs.create({ url: uploaderUrl });
        return;
      }
    } catch (_) {}
    window.open(uploaderUrl, '_blank', 'width=460,height=520');
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

  btnReset.addEventListener('click', () => {
    if (confirm('Reset all Salesforce Enhancer modules to default settings?')) {
      currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      updateUI();
      saveAndApply();
    }
  });

  loadSettings();
})();
