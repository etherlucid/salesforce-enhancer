(function () {
  'use strict';

  const api = typeof browser !== 'undefined' ? browser : chrome;

  const DEFAULT_SETTINGS = {
    version: '1.2.2',
    modules: {
      subtabs: true,
      quickViews: true,
      theming: false,
      loadingAnimation: true
    },
    subtabs: {
      hideAppName: false
    },
    hideAppName: false,
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

  // Elements
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('uploaderFileInput');
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

  function handleFile(file) {
    if (!file) return;
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
      showStatus(`Loaded "${file.name}". Click "Save & Apply" or customize options below.`);
      // Auto-save on file select for immediate convenience
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
        updatePreview();
      });
    } catch (_) {}
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
    saveSettings(true);
  });

  btnClose.addEventListener('click', () => {
    window.close();
  });

  loadInitialSettings();
})();
