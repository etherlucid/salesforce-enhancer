(function () {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;

  const DEFAULT_SETTINGS = {
    version: '1.3.0-alpha.1',
    modules: {
      subtabs: true,
      quickViews: true,
      linkInterceptor: true,
      inspectorMods: false,
      theming: false,
      loadingAnimation: true
    },
    subtabs: {
      hideAppName: false
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
      url: '',
      size: 64,
      rotate: false
    }
  };

  let currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  let loadedFileName = '';
  let isModMode = new URLSearchParams(window.location.search).get('mode') === 'mod';

  // Elements
  const tabBtnMods = document.getElementById('tabBtnMods');
  const tabBtnGif = document.getElementById('tabBtnGif');
  const headerIcon = document.getElementById('headerIcon');
  const headerTitle = document.getElementById('headerTitle');
  const headerSubtitle = document.getElementById('headerSubtitle');
  const dropzone = document.getElementById('dropzone');
  const dropzoneText = document.getElementById('dropzoneText');
  const dropzoneSubtext = document.getElementById('dropzoneSubtext');
  const fileInput = document.getElementById('uploaderFileInput');
  const gifControlsSection = document.getElementById('gifControlsSection');
  const modControlsSection = document.getElementById('modControlsSection');
  const pageInstalledModsList = document.getElementById('pageInstalledModsList');
  const btnExportAllMods = document.getElementById('btnExportAllMods');
  const modJsonTextarea = document.getElementById('modJsonTextarea');
  const urlInput = document.getElementById('uploaderUrlInput');
  const btnLoadUrl = document.getElementById('btnLoadUrl');
  const previewBox = document.getElementById('previewBox');
  const previewImg = document.getElementById('previewImg');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewFileInfo = document.getElementById('previewFileInfo');
  const sizeBtns = document.querySelectorAll('.size-btn');
  const chkRotate = document.getElementById('chkRotate');
  const statusMsg = document.getElementById('statusMsg');
  const btnSaveApply = document.getElementById('btnSaveApply');
  const btnClose = document.getElementById('btnClose');

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function applyPageMode(modMode) {
    isModMode = !!modMode;
    if (tabBtnMods) tabBtnMods.classList.toggle('active', isModMode);
    if (tabBtnGif) tabBtnGif.classList.toggle('active', !isModMode);
    if (isModMode) {
      document.title = 'Inspector Mods - Salesforce Enhancer';
      if (headerIcon) headerIcon.textContent = '🧩';
      if (headerTitle) headerTitle.textContent = 'Inspector Mods';
      if (headerSubtitle) headerSubtitle.textContent = 'Import, edit, or manage JSON mod configurations.';
      if (dropzoneText) dropzoneText.textContent = 'Click to choose a .mod.json file or drag & drop here';
      if (dropzoneSubtext) dropzoneSubtext.textContent = 'Supports .mod.json and .json files';
      if (fileInput) fileInput.setAttribute('accept', '.json,application/json');
      if (gifControlsSection) gifControlsSection.style.display = 'none';
      if (modControlsSection) modControlsSection.style.display = 'flex';
      if (btnSaveApply) btnSaveApply.textContent = 'Save Mod';
      renderPageModsList();
    } else {
      document.title = 'Custom Loading Animation - Salesforce Enhancer';
      if (headerIcon) headerIcon.textContent = '🎬';
      if (headerTitle) headerTitle.textContent = 'Custom Loading Animation';
      if (headerSubtitle) headerSubtitle.textContent = 'Select an animated GIF or image to display during Salesforce load states.';
      if (dropzoneText) dropzoneText.textContent = 'Click to choose a GIF / image or drag & drop here';
      if (dropzoneSubtext) dropzoneSubtext.textContent = 'Supports .gif, .png, .jpg, .webp, .svg';
      if (fileInput) fileInput.setAttribute('accept', 'image/*');
      if (gifControlsSection) gifControlsSection.style.display = 'block';
      if (modControlsSection) modControlsSection.style.display = 'none';
      if (btnSaveApply) btnSaveApply.textContent = 'Save & Apply';
      updatePreview();
    }
  }

  if (tabBtnMods) {
    tabBtnMods.addEventListener('click', () => {
      statusMsg.className = 'status-msg';
      applyPageMode(true);
    });
  }
  if (tabBtnGif) {
    tabBtnGif.addEventListener('click', () => {
      statusMsg.className = 'status-msg';
      applyPageMode(false);
    });
  }

  function showStatus(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = 'status-msg ' + (isError ? 'error' : 'success');
  }

  function updatePreview() {
    const url = (currentSettings.loadingImage.url || '').trim();
    if (url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      previewEmpty.style.display = 'none';

      const sz = currentSettings.loadingImage.size || 64;
      previewImg.style.maxHeight = `${Math.min(sz, 84)}px`;
      previewImg.style.maxWidth = `${Math.min(sz, 84)}px`;

      if (currentSettings.loadingImage.rotate) {
        previewImg.style.animation = 'spin-preview 1.2s linear infinite';
      } else {
        previewImg.style.animation = 'none';
      }

      if (loadedFileName) {
        previewFileInfo.textContent = loadedFileName;
      } else if (url.startsWith('data:')) {
        previewFileInfo.textContent = 'Custom uploaded image';
      } else {
        const parts = url.split('/');
        previewFileInfo.textContent = parts[parts.length - 1] || 'Image URL';
      }
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewEmpty.style.display = 'block';
      previewFileInfo.textContent = 'No image selected';
    }

    sizeBtns.forEach((btn) => {
      const sz = parseInt(btn.dataset.size, 10);
      btn.classList.toggle('active', sz === (currentSettings.loadingImage.size || 64));
    });

    chkRotate.checked = !!currentSettings.loadingImage.rotate;
  }

  function validateModObject(rawMod) {
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

  function persistCurrentSettings(onComplete) {
    const payload = {
      sf_enhancer_settings: currentSettings,
      sf_appearance_settings: {
        theme: currentSettings.theme?.preset || 'classic',
        accentColor: currentSettings.theme?.customAccent || '#8b5cf6',
        isDarkMode: false,
        applyToSalesforce: currentSettings.modules?.theming && currentSettings.theme?.applyToNavigation,
        modules: currentSettings.modules,
        subtabs: currentSettings.subtabs,
        hideAppName: currentSettings.hideAppName,
        inspectorMods: currentSettings.inspectorMods,
        loadingImage: {
          enabled: !!currentSettings.modules?.loadingAnimation,
          url: currentSettings.loadingImage?.url || '',
          size: currentSettings.loadingImage?.size || 64,
          rotate: !!currentSettings.loadingImage?.rotate
        }
      }
    };

    const done = () => {
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
      if (typeof onComplete === 'function') onComplete();
    };

    try {
      const p = api.storage.local.set(payload, done);
      if (p && typeof p.then === 'function') {
        p.then(done).catch(() => done());
      }
    } catch (_) {
      done();
    }
  }

  function renderPageModsList() {
    if (!pageInstalledModsList) return;
    const mods = (currentSettings.inspectorMods && Array.isArray(currentSettings.inspectorMods.mods))
      ? currentSettings.inspectorMods.mods
      : [];

    if (btnExportAllMods) {
      btnExportAllMods.style.display = mods.length > 0 ? 'inline-flex' : 'none';
    }

    if (!mods.length) {
      pageInstalledModsList.innerHTML =
        '<div style="padding:12px; border:1px dashed var(--border-dark); border-radius:6px; text-align:center; font-size:12px; color:var(--subtext);">No mods installed.</div>';
      return;
    }

    pageInstalledModsList.innerHTML = mods
      .map((mod) => {
        const targetObj = (mod.target && mod.target.objectApiName) || 'Record';
        const keyPrefix = (mod.target && mod.target.keyPrefix) || '';
        return `
          <div class="mod-item" data-mod-id="${escapeHtml(mod.id)}">
            <div class="mod-item-left">
              <input type="checkbox" class="page-mod-toggle" data-mod-id="${escapeHtml(mod.id)}" ${
          mod.enabled !== false ? 'checked' : ''
        }>
              <div>
                <div class="mod-item-title">
                  <span>${escapeHtml(mod.name)}</span>
                  <span class="mod-item-tag">${escapeHtml(targetObj)}${keyPrefix ? ` (${escapeHtml(keyPrefix)})` : ''}</span>
                  ${mod.version ? `<span class="mod-item-tag">v${escapeHtml(mod.version)}</span>` : ''}
                </div>
                ${mod.description ? `<div class="mod-item-desc">${escapeHtml(mod.description)}</div>` : ''}
              </div>
            </div>
            <div class="mod-item-actions">
              <button type="button" class="btn btn-neutral page-mod-edit" data-mod-id="${escapeHtml(
                mod.id
              )}" style="padding:3px 8px; font-size:11px;">Edit JSON</button>
              <button type="button" class="btn btn-neutral page-mod-remove" data-mod-id="${escapeHtml(
                mod.id
              )}" style="padding:3px 8px; font-size:11px;">Remove</button>
            </div>
          </div>
        `;
      })
      .join('');

    pageInstalledModsList.querySelectorAll('.page-mod-toggle').forEach((chk) => {
      chk.addEventListener('change', (e) => {
        const modId = chk.dataset.modId;
        const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === modId);
        if (target) {
          target.enabled = e.target.checked;
          persistCurrentSettings();
        }
      });
    });

    pageInstalledModsList.querySelectorAll('.page-mod-edit').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === modId);
        if (target && modJsonTextarea) {
          modJsonTextarea.value = JSON.stringify(target, null, 2);
          modJsonTextarea.focus();
        }
      });
    });

    pageInstalledModsList.querySelectorAll('.page-mod-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modId = btn.dataset.modId;
        if (!currentSettings.inspectorMods || !Array.isArray(currentSettings.inspectorMods.mods)) return;
        currentSettings.inspectorMods.mods = currentSettings.inspectorMods.mods.filter((m) => m.id !== modId);
        renderPageModsList();
        persistCurrentSettings(() => showStatus('Mod removed.'));
      });
    });
  }

  if (btnExportAllMods) {
    btnExportAllMods.addEventListener('click', () => {
      const mods = currentSettings.inspectorMods?.mods || [];
      if (!mods.length) return;
      const payload = mods.length === 1 ? mods[0] : { mods };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = mods.length === 1 ? `${mods[0].id}.mod.json` : 'salesforce-enhancer-mods.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  function installAndSaveModsFromRawText(rawText) {
    let parsed;
    try {
      parsed = JSON.parse(String(rawText || '').trim());
    } catch (err) {
      showStatus(`Invalid JSON: ${err.message || err}`, true);
      return;
    }

    let validated;
    try {
      const incoming = Array.isArray(parsed)
        ? parsed
        : parsed && Array.isArray(parsed.mods)
        ? parsed.mods
        : [parsed];
      if (!incoming.length) throw new Error('No mod definitions found in JSON.');
      validated = incoming.map(validateModObject);
    } catch (err) {
      showStatus(err.message || String(err), true);
      return;
    }

    const commitWithLatest = (res) => {
      const loaded = res?.sf_enhancer_settings || res?.sf_appearance_settings;
      if (loaded && typeof loaded === 'object') {
        if (loaded.modules) currentSettings.modules = Object.assign({}, currentSettings.modules, loaded.modules);
        if (loaded.subtabs) currentSettings.subtabs = Object.assign({}, currentSettings.subtabs, loaded.subtabs);
        if (loaded.hideAppName !== undefined) currentSettings.hideAppName = loaded.hideAppName;
        if (loaded.inspectorMods && Array.isArray(loaded.inspectorMods.mods)) {
          currentSettings.inspectorMods = { mods: loaded.inspectorMods.mods.slice() };
        }
        if (loaded.theme) currentSettings.theme = Object.assign({}, currentSettings.theme, loaded.theme);
        if (loaded.loadingImage) {
          currentSettings.loadingImage = Object.assign({}, currentSettings.loadingImage, loaded.loadingImage);
        }
      }

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

      renderPageModsList();
      persistCurrentSettings(() => {
        showStatus(`Installed ${validated.map((m) => `"${m.name}"`).join(', ')}.`);
      });
    };

    try {
      let ran = false;
      const runOnce = (r) => {
        if (ran) return;
        ran = true;
        commitWithLatest(r || {});
      };
      const p = api.storage.local.get(['sf_enhancer_settings', 'sf_appearance_settings'], runOnce);
      if (p && typeof p.then === 'function') {
        p.then(runOnce).catch(() => runOnce({}));
      }
    } catch (_) {
      commitWithLatest({});
    }
  }

  function handleFile(file) {
    if (!file) return;
    if (isModMode || file.name.toLowerCase().endsWith('.json')) {
      if (!isModMode) applyPageMode(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = String(e.target.result || '');
        if (modJsonTextarea) modJsonTextarea.value = text;
        installAndSaveModsFromRawText(text);
      };
      reader.onerror = () => {
        showStatus('Failed to read JSON file.', true);
      };
      reader.readAsText(file);
      return;
    }

    if (!file.type.startsWith('image/')) {
      showStatus('Please select a valid image or GIF file.', true);
      return;
    }

    loadedFileName = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    showStatus(`Reading ${file.name}...`);

    const reader = new FileReader();
    reader.onload = (e) => {
      currentSettings.loadingImage.url = e.target.result;
      currentSettings.modules.loadingAnimation = true;
      updatePreview();
      showStatus(`Loaded "${file.name}".`);
      saveSettings(false);
    };
    reader.onerror = () => {
      showStatus('Failed to read selected file.', true);
    };
    reader.readAsDataURL(file);
  }

  function saveSettings(closeAfter = true) {
    if (!api || !api.storage || !api.storage.local) return;

    currentSettings.modules.loadingAnimation = true;

    const payload = {
      sf_enhancer_settings: currentSettings,
      sf_appearance_settings: {
        theme: currentSettings.theme?.preset || 'classic',
        accentColor: currentSettings.theme?.customAccent || '#8b5cf6',
        isDarkMode: false,
        applyToSalesforce: currentSettings.modules?.theming && currentSettings.theme?.applyToNavigation,
        modules: currentSettings.modules,
        subtabs: currentSettings.subtabs,
        hideAppName: currentSettings.hideAppName,
        inspectorMods: currentSettings.inspectorMods,
        loadingImage: {
          enabled: true,
          url: currentSettings.loadingImage.url,
          size: currentSettings.loadingImage.size || 64,
          rotate: !!currentSettings.loadingImage.rotate
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

    const onDone = () => {
      broadcast();
      showStatus('✅ Saved! Custom animation applied to Salesforce tabs.');
      if (closeAfter) {
        setTimeout(() => {
          window.close();
        }, 900);
      }
    };

    try {
      const p = api.storage.local.set(payload, onDone);
      if (p && typeof p.then === 'function') {
        p.then(onDone).catch(() => onDone());
      }
    } catch (_) {
      onDone();
    }
  }

  function loadInitialSettings() {
    if (!api || !api.storage || !api.storage.local) return;
    try {
      api.storage.local.get(['sf_enhancer_settings', 'sf_appearance_settings'], (res) => {
        const loaded = res?.sf_enhancer_settings || res?.sf_appearance_settings;
        if (loaded && typeof loaded === 'object') {
          if (loaded.modules) currentSettings.modules = Object.assign({}, currentSettings.modules, loaded.modules);
          if (loaded.subtabs) currentSettings.subtabs = Object.assign({}, currentSettings.subtabs, loaded.subtabs);
          if (loaded.hideAppName !== undefined) currentSettings.hideAppName = loaded.hideAppName;
          if (loaded.inspectorMods && Array.isArray(loaded.inspectorMods.mods)) {
            currentSettings.inspectorMods = { mods: loaded.inspectorMods.mods };
          }
          if (loaded.theme) currentSettings.theme = Object.assign({}, currentSettings.theme, loaded.theme);
          if (loaded.loadingImage) {
            currentSettings.loadingImage = Object.assign({}, currentSettings.loadingImage, loaded.loadingImage);
          } else if (loaded.loadingUrl) {
            currentSettings.loadingImage.url = loaded.loadingUrl;
          }
        }
        if (currentSettings.loadingImage.url && !currentSettings.loadingImage.url.startsWith('data:')) {
          urlInput.value = currentSettings.loadingImage.url;
        }
        applyPageMode(isModMode);
      });
    } catch (_) {
      applyPageMode(isModMode);
    }
  }

  // Event Listeners
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('dragover');
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Global window drop listener as well
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  });

  // Global paste listener
  window.addEventListener('paste', (e) => {
    const clipboard = e.clipboardData;
    if (!clipboard) return;

    if (clipboard.files && clipboard.files.length > 0) {
      handleFile(clipboard.files[0]);
      return;
    }

    const text = clipboard.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      urlInput.value = text.trim();
      currentSettings.loadingImage.url = text.trim();
      currentSettings.modules.loadingAnimation = true;
      loadedFileName = '';
      updatePreview();
      showStatus('Pasted image URL loaded.');
    }
  });

  btnLoadUrl.addEventListener('click', () => {
    const val = (urlInput.value || '').trim();
    if (!val) {
      showStatus('Please enter an image or GIF URL.', true);
      return;
    }
    currentSettings.loadingImage.url = val;
    currentSettings.modules.loadingAnimation = true;
    loadedFileName = '';
    updatePreview();
    showStatus('Image URL loaded. Click "Save & Apply" to apply.');
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnLoadUrl.click();
    }
  });

  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentSettings.loadingImage.size = parseInt(btn.dataset.size, 10);
      updatePreview();
    });
  });

  chkRotate.addEventListener('change', (e) => {
    currentSettings.loadingImage.rotate = e.target.checked;
    updatePreview();
  });

  btnSaveApply.addEventListener('click', () => {
    if (isModMode) {
      const raw = modJsonTextarea ? modJsonTextarea.value.trim() : '';
      if (!raw) {
        showStatus('Choose a .mod.json file or paste Mod JSON first.', true);
        return;
      }
      installAndSaveModsFromRawText(raw);
      return;
    }
    saveSettings(false);
  });

  btnClose.addEventListener('click', () => {
    window.close();
  });

  loadInitialSettings();
})();
