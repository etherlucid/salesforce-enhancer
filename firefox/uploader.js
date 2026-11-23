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
    'classic': { name: 'Classic SF', isDark: false, accent: '#0176d3', contrast: '#ffffff', bg: '#ffffff', text: '#0f172a' },
    'gruvbox-dark': { name: 'Gruvbox Dark', isDark: true, accent: '#fe8019', contrast: '#282828', bg: '#282828', text: '#ebdbb2' },
    'gruvbox-light': { name: 'Gruvbox Light', isDark: false, accent: '#af3a03', contrast: '#fbf1c7', bg: '#fbf1c7', text: '#3c3836' },
    'solarized-dark': { name: 'Solarized Dark', isDark: true, accent: '#268bd2', contrast: '#ffffff', bg: '#002b36', text: '#93a1a1' },
    'solarized-light': { name: 'Solarized Light', isDark: false, accent: '#2aa198', contrast: '#ffffff', bg: '#fdf6e3', text: '#586e75' },
    'nord': { name: 'Nord', isDark: true, accent: '#88c0d0', contrast: '#2e3440', bg: '#2e3440', text: '#eceff4' },
    'dracula': { name: 'Dracula', isDark: true, accent: '#bd93f9', contrast: '#282a36', bg: '#282a36', text: '#f8f8f2' },
    'one-dark': { name: 'One Dark', isDark: true, accent: '#61afef', contrast: '#21252b', bg: '#21252b', text: '#abb2bf' },
    'custom': { name: 'Custom', isDark: false, accent: '#8b5cf6', contrast: '#ffffff', bg: '#ffffff', text: '#0f172a' }
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

  const KEYBIND_ROWS = [
    { id: 'prevWorkspace', label: 'Previous Workspace Tab', desc: 'Focus the previous top-level workspace tab.' },
    { id: 'nextWorkspace', label: 'Next Workspace Tab', desc: 'Focus the next top-level workspace tab.' },
    { id: 'prevSubtab', label: 'Previous Subtab', desc: 'Cycle backward across the active workspace and its subtabs.' },
    { id: 'nextSubtab', label: 'Next Subtab', desc: 'Cycle forward across the active workspace and its subtabs.' },
    { id: 'reorderTabLeft', label: 'Reorder Tab / Subtab Left', desc: 'Move the active tab or subtab one position to the left of its neighbor.' },
    { id: 'reorderTabRight', label: 'Reorder Tab / Subtab Right', desc: 'Move the active tab or subtab one position to the right of its neighbor.' },
    { id: 'promoteSubtab', label: 'Promote Subtab to Workspace', desc: 'Move the active subtab out into its own workspace tab.' },
    { id: 'moveTabPrevWorkspace', label: 'Move Tab to Previous Workspace', desc: 'Move the active subtab or merge the active workspace left.' },
    { id: 'moveTabNextWorkspace', label: 'Move Tab to Next Workspace', desc: 'Move the active subtab or merge the active workspace right.' },
    { id: 'closeCurrentTab', label: 'Close Active Tab / Subtab', desc: 'Close the currently focused workspace tab or subtab.' }
  ];

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

  const STARTER_TEMPLATES = {
    'record-card': {
      schemaVersion: 2,
      id: 'account-quick-card',
      name: 'Account Quick Card',
      version: '1.0.0',
      description: 'Displays key Account fields and a conditional rating badge on Hover Previews and Highlights Panels.',
      enabled: true,
      target: {
        objectApiName: 'Account',
        keyPrefix: '001',
        nameField: 'Name',
        headerTitle: 'Account Snapshot'
      },
      mounts: {
        hoverPanel: true,
        highlightsPanel: true,
        rightPane: false
      },
      data: [
        {
          id: 'target',
          type: 'record',
          objectApiName: 'Account',
          fields: ['Id', 'Name', 'Type', 'Industry', 'Rating', 'AnnualRevenue']
        },
        {
          id: 'summary',
          type: 'compute',
          fields: {
            ratingTone: {
              op: 'cases',
              cases: [
                { when: { path: 'target.Rating', op: 'eq', value: 'Hot' }, value: 'success' },
                { when: { path: 'target.Rating', op: 'eq', value: 'Warm' }, value: 'warning' },
                { when: { path: 'target.Rating', op: 'eq', value: 'Cold' }, value: 'info' }
              ],
              default: 'neutral'
            }
          }
        }
      ],
      view: {
        hover: [
          {
            type: 'badgeRow',
            badges: [
              {
                text: '{{target.Rating}} Account',
                tonePath: 'summary.ratingTone',
                when: { path: 'target.Rating', op: 'exists' }
              },
              {
                text: '{{target.Type}}',
                tone: 'neutral',
                when: { path: 'target.Type', op: 'exists' }
              }
            ]
          },
          {
            type: 'fieldGrid',
            items: [
              { label: 'Industry', value: '{{target.Industry}}' },
              { label: 'Annual Revenue', value: '{{target.AnnualRevenue | currency}}' }
            ]
          }
        ]
      }
    },
    'related-list': {
      schemaVersion: 2,
      id: 'account-open-cases',
      name: 'Account Open Cases',
      version: '1.0.0',
      description: 'Shows open Case count and an expandable list of recent open Cases on Account Hover Previews and Right Panes.',
      enabled: true,
      target: {
        objectApiName: 'Account',
        keyPrefix: '001',
        nameField: 'Name',
        headerTitle: 'Open Cases'
      },
      mounts: {
        hoverPanel: true,
        highlightsPanel: false,
        rightPane: true
      },
      data: [
        {
          id: 'target',
          type: 'record',
          objectApiName: 'Account',
          fields: ['Id', 'Name']
        },
        {
          id: 'openCases',
          type: 'relatedList',
          relatedListId: 'Cases',
          fields: ['Case.Id', 'Case.CaseNumber', 'Case.Subject', 'Case.Status', 'Case.Priority'],
          where: { path: 'item.Status', op: 'neq', value: 'Closed', ignoreCase: true },
          limit: 8
        },
        {
          id: 'summary',
          type: 'compute',
          fields: {
            openCount: { op: 'count', from: 'openCases' },
            highPriorityCount: {
              op: 'count',
              from: 'openCases',
              where: { path: 'item.Priority', op: 'in', value: ['High', 'Critical', 'Urgent'], ignoreCase: true }
            },
            countTone: {
              op: 'cases',
              cases: [
                { when: { path: 'summary.highPriorityCount', op: 'gt', value: 0 }, value: 'warning' },
                { when: { path: 'summary.openCount', op: 'gt', value: 0 }, value: 'info' }
              ],
              default: 'success'
            }
          }
        }
      ],
      view: {
        hover: [
          {
            type: 'badgeRow',
            badges: [
              { text: '{{summary.openCount}} Open Cases', tonePath: 'summary.countTone' },
              {
                text: '{{summary.highPriorityCount}} High Priority',
                tone: 'error',
                when: { path: 'summary.highPriorityCount', op: 'gt', value: 0 }
              }
            ]
          },
          {
            type: 'list',
            dividerTop: true,
            itemsPath: 'openCases',
            maxItems: 5,
            emptyText: 'No open cases',
            item: {
              title: '{{item.CaseNumber}} — {{item.Subject}}',
              recordIdPath: 'item.id',
              objectApiName: 'Case',
              subtextParts: [
                { text: '{{item.Status}}', when: { path: 'item.Status', op: 'exists' } },
                { text: '{{item.Priority}}', when: { path: 'item.Priority', op: 'exists' } }
              ]
            }
          }
        ]
      }
    },
    'record-banner': {
      schemaVersion: 2,
      id: 'opportunity-overdue-banner',
      name: 'Opportunity Close Date Alert',
      version: '1.0.0',
      description: 'Displays a warning banner at the top of open Opportunities whose Close Date has passed.',
      enabled: true,
      target: {
        objectApiName: 'Opportunity',
        keyPrefix: '006',
        nameField: 'Name',
        headerTitle: 'Opportunity Alert'
      },
      mounts: {
        hoverPanel: false,
        highlightsPanel: false,
        recordBanner: true
      },
      data: [
        {
          id: 'target',
          type: 'record',
          objectApiName: 'Opportunity',
          fields: ['Id', 'Name', 'StageName', 'CloseDate', 'Amount', 'IsClosed']
        },
        {
          id: 'summary',
          type: 'compute',
          fields: {
            daysToClose: { op: 'daysFromToday', path: 'target.CloseDate' },
            isOverdue: {
              op: 'cond',
              when: {
                all: [
                  { path: 'target.IsClosed', op: 'isFalse' },
                  { path: 'summary.daysToClose', op: 'lt', value: 0 }
                ]
              }
            }
          }
        }
      ],
      view: {
        banner: [
          {
            type: 'alert',
            tone: 'warning',
            icon: '⚠',
            title: 'Past-Due Close Date',
            text: 'Scheduled close {{target.CloseDate}} has passed while in stage {{target.StageName}} ({{target.Amount | currency}}).',
            when: { path: 'summary.isOverdue', op: 'isTrue' }
          }
        ]
      }
    },
    'multi-hop': {
      schemaVersion: 2,
      id: 'account-asset-coverage',
      name: 'Account Asset Coverage Rollup',
      version: '1.0.0',
      description: 'Multi-hop example: rolls up Entitlement date status across an Account’s Assets into a collapsible drawer.',
      enabled: true,
      target: {
        objectApiName: 'Account',
        keyPrefix: '001',
        nameField: 'Name',
        headerTitle: 'Asset Coverage'
      },
      mounts: {
        hoverPanel: true,
        highlightsPanel: true
      },
      data: [
        {
          id: 'target',
          type: 'record',
          objectApiName: 'Account',
          fields: ['Id', 'Name']
        },
        {
          id: 'assets',
          type: 'relatedList',
          relatedListId: 'Assets',
          fields: ['Asset.Id', 'Asset.Name', 'Asset.SerialNumber']
        },
        {
          id: 'entitlements',
          type: 'relatedList',
          forEach: 'assets',
          attachAs: 'entitlements',
          relatedListId: 'Entitlements',
          fields: ['Entitlement.Id', 'Entitlement.Name', 'Entitlement.StartDate', 'Entitlement.EndDate', 'Entitlement.Status']
        },
        {
          id: 'entitlements',
          type: 'dateStatus',
          from: 'entitlements',
          startDateField: 'StartDate',
          endDateField: 'EndDate',
          statusField: 'Status',
          soonDays: 30,
          pickPrimaryBucketAs: 'primaryBucket'
        },
        {
          id: 'assets',
          type: 'rollup',
          from: 'assets',
          childrenField: 'entitlements',
          soonDays: 30,
          statusBadgeCases: [
            { when: { all: [{ path: 'item.status', op: 'eq', value: 'ACTIVE' }, { path: 'item.isExpiringSoon', op: 'isTrue' }] }, value: { text: 'Expiring Soon', tone: 'warning' } },
            { when: { path: 'item.status', op: 'eq', value: 'ACTIVE' }, value: { text: 'Active', tone: 'success' } },
            { when: { path: 'item.status', op: 'eq', value: 'UPCOMING' }, value: { text: 'Upcoming', tone: 'info' } },
            { when: { path: 'item.status', op: 'eq', value: 'EXPIRED' }, value: { text: 'Expired', tone: 'error' } },
            { value: { text: 'None', tone: 'neutral' } }
          ]
        },
        {
          id: 'summary',
          type: 'compute',
          fields: {
            totalAssets: { op: 'count', from: 'assets' },
            activeAssets: { op: 'count', from: 'assets', where: { path: 'item.status', op: 'eq', value: 'ACTIVE' } }
          }
        }
      ],
      view: {
        hover: [
          {
            type: 'badgeRow',
            badges: [
              { text: '{{summary.activeAssets}}/{{summary.totalAssets}} Assets Active', tone: 'info' }
            ]
          },
          {
            type: 'drawer',
            id: 'assetDrawer',
            itemsPath: 'assets',
            toggleLabel: 'Inspect {{summary.totalAssets}} Assets',
            emptyText: 'No Assets Found',
            item: {
              title: '{{item.Name}}',
              recordIdPath: 'item.id',
              objectApiName: 'Asset',
              badge: { textPath: 'item.statusBadge.text', tonePath: 'item.statusBadge.tone' },
              meta: [
                { text: 'S/N {{item.SerialNumber}}', when: { path: 'item.SerialNumber', op: 'exists' } },
                { text: 'ends {{item.endDate}}', when: { path: 'item.endDate', op: 'exists' } }
              ]
            }
          }
        ]
      }
    }
  };

  const PAGE_META = {
    plugins: {
      title: 'Plugins',
      subtitle: 'Enable, disable, and search built-in and custom Salesforce Enhancer plugins.'
    },
    keybinds: {
      title: 'Keybinds',
      subtitle: 'Configure keyboard shortcuts for navigating and moving tabs and subtabs in Lightning Console apps.'
    },
    themes: {
      title: 'Themes',
      subtitle: 'Customize navigation accent bars and developer color palettes across Salesforce Lightning.'
    },
    'import-plugin': {
      title: 'Custom Plugins',
      subtitle: 'Upload .sfe.json (schema v2) files, manage installed plugins, and edit definitions.'
    },
    'loading-animation': {
      title: 'Loading Animation',
      subtitle: 'Upload a custom GIF/image or choose a built-in loading indicator.'
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const requestedPageParam = urlParams.get('page') || urlParams.get('focus') || urlParams.get('mode') || '';
  const initialEditModId = urlParams.get('edit') || '';

  function resolveInitialPage(raw) {
    const val = String(raw || '').trim().toLowerCase();
    if (val === 'keybinds' || val === 'shortcuts' || val === 'keys') return 'keybinds';
    if (val === 'mod' || val === 'import-plugin' || val === 'import') return 'import-plugin';
    if (val === 'gif' || val === 'loading-animation' || val === 'loading') return 'loading-animation';
    if (val === 'themes' || val === 'theme') return 'themes';
    return 'plugins';
  }

  let activePage = resolveInitialPage(requestedPageParam);
  let selectedEditModId = initialEditModId;
  let activePluginFilter = 'all';
  let recordingKeybindId = '';
  let currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  let loadedFileName = '';

  // Navigation & Page Shell Elements
  const navItems = document.querySelectorAll('.nav-item[data-nav-page]');
  const pageSections = {
    plugins: document.getElementById('pagePlugins'),
    keybinds: document.getElementById('pageKeybinds'),
    themes: document.getElementById('pageThemes'),
    'import-plugin': document.getElementById('pageImportPlugin'),
    'loading-animation': document.getElementById('pageLoadingAnimation')
  };
  const activePageTitle = document.getElementById('activePageTitle');
  const activePageSubtitle = document.getElementById('activePageSubtitle');
  const btnHeaderImportMod = document.getElementById('btnHeaderImportMod');
  const pluginsActiveCountPill = document.getElementById('pluginsActiveCountPill');
  const customModsCountPill = document.getElementById('customModsCountPill');
  const statusMsg = document.getElementById('statusMsg');

  // Plugins Overview Elements
  const txtSearchPlugins = document.getElementById('txtSearchPlugins');
  const filterPills = document.querySelectorAll('.filter-pill[data-filter]');
  const chkModSubtabs = document.getElementById('chkModSubtabs');
  const chkHideAppName = document.getElementById('chkHideAppName');
  const btnOpenKeybindsPage = document.getElementById('btnOpenKeybindsPage');
  const chkModLinkInterceptor = document.getElementById('chkModLinkInterceptor');
  const chkModQuickViews = document.getElementById('chkModQuickViews');
  const chkModClipboardFix = document.getElementById('chkModClipboardFix');
  const chkModLoading = document.getElementById('chkModLoading');
  const pluginCardGifStatus = document.getElementById('pluginCardGifStatus');
  const btnOpenGifStudio = document.getElementById('btnOpenGifStudio');
  const customPluginsSectionWrap = document.getElementById('customPluginsSectionWrap');
  const overviewCustomModsGrid = document.getElementById('overviewCustomModsGrid');
  const btnGoCustomImporter = document.getElementById('btnGoCustomImporter');

  // Keybinds Page Elements
  const chkKeybindsEnabled = document.getElementById('chkKeybindsEnabled');
  const btnResetKeybinds = document.getElementById('btnResetKeybinds');
  const keybindsList = document.getElementById('keybindsList');

  // Themes Elements
  const chkModTheming = document.getElementById('chkModTheming');
  const themingDesc = document.getElementById('themingDesc');
  const themePreviewBanner = document.getElementById('themePreviewBanner');
  const themePreviewTopbar = document.getElementById('themePreviewTopbar');
  const themePreviewActiveTab = document.getElementById('themePreviewActiveTab');
  const themePreviewBody = document.getElementById('themePreviewBody');
  const themePreviewBadge = document.getElementById('themePreviewBadge');
  const themeChips = document.querySelectorAll('.theme-chip');
  const customColorRow = document.getElementById('customColorRow');
  const customColorPicker = document.getElementById('customColorPicker');
  const customColorHex = document.getElementById('customColorHex');
  const customChipDot = document.getElementById('customChipDot');
  const chkApplyNavigation = document.getElementById('chkApplyNavigation');

  // Custom Plugin Importer Elements
  const modDropzone = document.getElementById('modDropzone');
  const modFileInput = document.getElementById('modFileInput');
  const pageInstalledModsList = document.getElementById('pageInstalledModsList');
  const btnExportAllMods = document.getElementById('btnExportAllMods');
  const editorTitleLabel = document.getElementById('editorTitleLabel');
  const modJsonTextarea = document.getElementById('modJsonTextarea');
  const modSchemaSummary = document.getElementById('modSchemaSummary');
  const selModTemplate = document.getElementById('selModTemplate');
  const btnFormatModJson = document.getElementById('btnFormatModJson');
  const btnDownloadEditorMod = document.getElementById('btnDownloadEditorMod');
  const btnSaveModJson = document.getElementById('btnSaveModJson');

  // Loading Animation Studio Elements
  const chkModLoadingStudio = document.getElementById('chkModLoadingStudio');
  const presetGifCards = document.querySelectorAll('.gif-card');
  const gifDropzone = document.getElementById('gifDropzone');
  const gifFileInput = document.getElementById('gifFileInput');
  const urlInput = document.getElementById('uploaderUrlInput');
  const btnLoadUrl = document.getElementById('btnLoadUrl');
  const previewImg = document.getElementById('previewImg');
  const previewEmpty = document.getElementById('previewEmpty');
  const previewFileInfo = document.getElementById('previewFileInfo');
  const sizeBtns = document.querySelectorAll('.size-btn');
  const chkRotate = document.getElementById('chkRotate');

  const btnReset = document.getElementById('btnReset');

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showStatus(text, isError = false) {
    if (!statusMsg) return;
    if (!text) {
      statusMsg.textContent = '';
      statusMsg.className = 'status-msg';
      return;
    }
    statusMsg.textContent = text;
    statusMsg.className = 'status-msg ' + (isError ? 'error' : 'success');
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

  function navigateToPage(pageKey, updateHistory = true) {
    activePage = pageSections[pageKey] ? pageKey : 'plugins';
    showStatus('');

    navItems.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.navPage === activePage);
    });
    Object.keys(pageSections).forEach((key) => {
      if (pageSections[key]) {
        pageSections[key].classList.toggle('active', key === activePage);
      }
    });

    const meta = PAGE_META[activePage] || PAGE_META.plugins;
    if (activePageTitle) activePageTitle.textContent = meta.title;
    if (activePageSubtitle) activePageSubtitle.textContent = meta.subtitle;
    document.title = `${meta.title} — Salesforce Enhancer`;

    if (btnHeaderImportMod) {
      btnHeaderImportMod.style.display = activePage === 'plugins' ? 'inline-flex' : 'none';
    }

    if (updateHistory && window.history && window.history.replaceState) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set('page', activePage);
      nextUrl.searchParams.delete('focus');
      nextUrl.searchParams.delete('mode');
      if (activePage !== 'import-plugin') nextUrl.searchParams.delete('edit');
      window.history.replaceState(null, '', nextUrl.toString());
    }
  }

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      navigateToPage(btn.dataset.navPage, true);
    });
  });

  if (btnHeaderImportMod) {
    btnHeaderImportMod.addEventListener('click', () => navigateToPage('import-plugin', true));
  }
  if (btnGoCustomImporter) {
    btnGoCustomImporter.addEventListener('click', () => navigateToPage('import-plugin', true));
  }
  if (btnOpenGifStudio) {
    btnOpenGifStudio.addEventListener('click', () => navigateToPage('loading-animation', true));
  }
  if (btnOpenKeybindsPage) {
    btnOpenKeybindsPage.addEventListener('click', () => navigateToPage('keybinds', true));
  }

  function persistCurrentSettings(onComplete) {
    const activeThemeDef = THEMES[currentSettings.theme?.preset] || THEMES['classic'];
    const payload = {
      sf_enhancer_settings: currentSettings,
      sf_appearance_settings: {
        theme: currentSettings.theme?.preset || 'classic',
        accentColor:
          currentSettings.theme?.preset === 'custom'
            ? currentSettings.theme?.customAccent || '#8b5cf6'
            : activeThemeDef.accent,
        isDarkMode: !!activeThemeDef.isDark,
        applyToSalesforce: !!(currentSettings.modules?.theming && currentSettings.theme?.applyToNavigation),
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

  function applyPluginsFilter() {
    const q = (txtSearchPlugins ? txtSearchPlugins.value : '').trim().toLowerCase();
    const cards = document.querySelectorAll('#pagePlugins .plugin-card');
    let visibleCustomCount = 0;

    cards.forEach((card) => {
      const kind = card.dataset.pluginKind || 'builtin';
      const checkbox = card.querySelector('input[type="checkbox"]');
      const isEnabled = checkbox ? checkbox.checked : true;

      let matchesFilter = true;
      if (activePluginFilter === 'enabled') matchesFilter = isEnabled;
      else if (activePluginFilter === 'builtin') matchesFilter = kind === 'builtin';
      else if (activePluginFilter === 'custom') matchesFilter = kind === 'custom';

      const hay = `${card.dataset.pluginSearch || ''} ${card.textContent || ''}`.toLowerCase();
      const matchesQuery = !q || hay.includes(q);

      const show = matchesFilter && matchesQuery;
      card.style.display = show ? '' : 'none';
      if (kind === 'custom' && show) visibleCustomCount += 1;
    });

    if (customPluginsSectionWrap) {
      const hasMods = Array.isArray(currentSettings.inspectorMods?.mods) && currentSettings.inspectorMods.mods.length > 0;
      customPluginsSectionWrap.style.display = hasMods && visibleCustomCount > 0 ? 'block' : 'none';
    }
  }

  if (txtSearchPlugins) {
    txtSearchPlugins.addEventListener('input', applyPluginsFilter);
  }
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      activePluginFilter = pill.dataset.filter || 'all';
      filterPills.forEach((p) => p.classList.toggle('active', p === pill));
      applyPluginsFilter();
    });
  });

  function updateThemePreviewBanner(themeDef, accent) {
    if (!themePreviewBanner || !themePreviewTopbar || !themePreviewBody) return;
    const isEnabled = !!currentSettings.modules.theming;
    const bg = isEnabled ? themeDef.bg : '#ffffff';
    const text = isEnabled ? themeDef.text : '#0f172a';
    const contrast = getContrastColor(accent);

    themePreviewTopbar.style.background = bg;
    themePreviewTopbar.style.color = text;
    themePreviewTopbar.style.borderBottomColor = accent;
    if (themePreviewActiveTab) {
      themePreviewActiveTab.style.background = accent;
      themePreviewActiveTab.style.color = contrast;
      themePreviewActiveTab.style.borderColor = accent;
    }
    themePreviewBody.style.background = themeDef.isDark && isEnabled ? 'rgba(15, 23, 42, 0.92)' : '#f8fafc';
    themePreviewBody.style.color = themeDef.isDark && isEnabled ? '#e2e8f0' : '#475569';
    if (themePreviewBadge) {
      themePreviewBadge.style.background = accent;
      themePreviewBadge.style.color = contrast;
      themePreviewBadge.textContent = isEnabled ? themeDef.name : 'Native Salesforce';
    }
  }

  function updateLoadingPreview() {
    const url = (currentSettings.loadingImage.url || '').trim();
    const isPresetParrot = url === GIF_PARROT || url === 'parrot.gif' || url.includes('parrot.gif');
    const isPresetNyan = url === GIF_NYAN || url === 'nyan.gif' || url.includes('nyan.gif') || url.includes('PYh.gif');
    const isDefault = !url || url === GIF_SPINNER;
    const isCustom = !isPresetParrot && !isPresetNyan && !isDefault;

    presetGifCards.forEach((card) => {
      const presetKey = card.dataset.preset;
      if (presetKey === 'spinner') card.classList.toggle('active', isDefault);
      else if (presetKey === 'parrot') card.classList.toggle('active', isPresetParrot);
      else if (presetKey === 'nyan') card.classList.toggle('active', isPresetNyan);
      else if (presetKey === 'custom') {
        card.classList.toggle('active', isCustom);
        const thumb = card.querySelector('#customCardThumb');
        const icon = card.querySelector('#customCardIcon');
        if (thumb && icon) {
          if (isCustom && url) {
            thumb.src = url;
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

    let label = 'Default spinner';
    if (loadedFileName) label = loadedFileName;
    else if (isPresetParrot) label = 'Party Parrot';
    else if (isPresetNyan) label = 'Nyan Cat';
    else if (url && url.startsWith('data:')) label = 'Custom uploaded image';
    else if (url) {
      const parts = url.split('/');
      label = parts[parts.length - 1] || 'Custom image URL';
    }

    if (pluginCardGifStatus) {
      pluginCardGifStatus.textContent = currentSettings.modules.loadingAnimation
        ? `Active: ${label}`
        : `Selected: ${label}`;
    }

    if (url) {
      previewImg.src = url;
      previewImg.style.display = 'block';
      previewEmpty.style.display = 'none';
      const sz = currentSettings.loadingImage.size || 64;
      previewImg.style.width = `${sz}px`;
      previewImg.style.height = `${sz}px`;
      previewImg.style.animation = currentSettings.loadingImage.rotate ? 'spin-preview 1.2s linear infinite' : 'none';
    } else {
      previewImg.src = '';
      previewImg.style.display = 'none';
      previewEmpty.style.display = 'block';
    }

    if (previewFileInfo) previewFileInfo.textContent = label;
    sizeBtns.forEach((btn) => {
      const sz = parseInt(btn.dataset.size, 10);
      btn.classList.toggle('active', sz === (currentSettings.loadingImage.size || 64));
    });
    if (chkRotate) chkRotate.checked = !!currentSettings.loadingImage.rotate;
    if (chkModLoadingStudio) chkModLoadingStudio.checked = currentSettings.modules.loadingAnimation === true;
  }

  function validateModObject(rawMod) {
    if (!rawMod || typeof rawMod !== 'object' || Array.isArray(rawMod)) {
      throw new Error('Plugin must be a JSON object.');
    }
    if (rawMod.schemaVersion === 1 || (!rawMod.schemaVersion && rawMod.pipeline)) {
      throw new Error('Legacy schemaVersion 1 (.mod.json) is not supported in v1.4.0. Migrate to schemaVersion 2 (.sfe.json).');
    }
    if (rawMod.schemaVersion !== 2) {
      throw new Error('Plugin JSON requires "schemaVersion": 2.');
    }
    const id = String(rawMod.id || '').trim();
    const name = String(rawMod.name || '').trim();
    if (!id || !name) {
      throw new Error('Plugin JSON requires "id" and "name".');
    }
    if (!rawMod.target || typeof rawMod.target !== 'object' || !rawMod.target.keyPrefix || !rawMod.target.objectApiName) {
      throw new Error('Plugin JSON requires "target.objectApiName" and "target.keyPrefix".');
    }
    if (!Array.isArray(rawMod.data) || rawMod.data.length === 0) {
      throw new Error('Plugin JSON requires a non-empty "data" array of steps.');
    }
    if (!rawMod.view || typeof rawMod.view !== 'object') {
      throw new Error('Plugin JSON requires a "view" object.');
    }
    const hasViewBlocks = ['hover', 'highlights', 'rightPane', 'banner'].some(
      (k) => Array.isArray(rawMod.view[k]) && rawMod.view[k].length > 0
    );
    if (!hasViewBlocks) {
      throw new Error('Plugin "view" requires at least one non-empty block array (hover, highlights, rightPane, or banner).');
    }
    return Object.assign({}, rawMod, {
      schemaVersion: 2,
      id,
      name,
      version: String(rawMod.version || '1.0.0'),
      enabled: rawMod.enabled !== false
    });
  }

  function updateEditorSchemaSummary() {
    if (!modSchemaSummary || !modJsonTextarea) return;
    const raw = modJsonTextarea.value.trim();
    if (!raw) {
      modSchemaSummary.innerHTML = '<span>Status: <strong>Empty</strong></span>';
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const item = Array.isArray(parsed) ? parsed[0] : (parsed && Array.isArray(parsed.mods) ? parsed.mods[0] : parsed);
      const valid = validateModObject(item);
      const mounts = Object.keys(valid.mounts || {}).filter((k) => valid.mounts[k] === true || valid.mounts[k]?.enabled === true);
      modSchemaSummary.innerHTML = `
        <span>Schema: <strong style="color:#065f46;">v2 Valid</strong></span>
        <span>ID: <strong>${escapeHtml(valid.id)}</strong></span>
        <span>Target: <strong>${escapeHtml(valid.target.objectApiName)} (${escapeHtml(valid.target.keyPrefix)})</strong></span>
        <span>Steps: <strong>${valid.data.length}</strong></span>
        <span>Mounts: <strong>${escapeHtml(mounts.join(', ') || 'none')}</strong></span>
      `;
    } catch (err) {
      modSchemaSummary.innerHTML = `<span style="color:#991b1b;">Validation error: <strong>${escapeHtml(err.message || err)}</strong></span>`;
    }
  }

  function loadModIntoEditor(mod) {
    if (!mod || !modJsonTextarea) return;
    selectedEditModId = mod.id;
    modJsonTextarea.value = JSON.stringify(mod, null, 2);
    if (editorTitleLabel) editorTitleLabel.textContent = `Editing: ${mod.name}`;
    updateEditorSchemaSummary();
    renderModsViews();
  }

  function renderModsViews() {
    const mods = (currentSettings.inspectorMods && Array.isArray(currentSettings.inspectorMods.mods))
      ? currentSettings.inspectorMods.mods
      : [];

    currentSettings.modules.inspectorMods = mods.some((m) => m && m.enabled !== false && m.schemaVersion === 2);
    if (customModsCountPill) customModsCountPill.textContent = String(mods.length);
    if (btnExportAllMods) btnExportAllMods.style.display = mods.length > 0 ? 'inline-flex' : 'none';

    // 1. Overview Custom Plugins Grid (Plugins Page)
    if (overviewCustomModsGrid) {
      overviewCustomModsGrid.innerHTML = mods
        .map((mod) => {
          const targetObj = (mod.target && mod.target.objectApiName) || 'Record';
          const keyPrefix = (mod.target && mod.target.keyPrefix) || '';
          const isV2 = mod.schemaVersion === 2;
          const isEnabled = isV2 && mod.enabled !== false;
          return `
            <div class="plugin-card" data-plugin-kind="custom" data-plugin-search="${escapeHtml(
              `${mod.name} ${targetObj} ${keyPrefix} ${mod.description || ''}`
            )}">
              <div class="plugin-card-head">
                <div>
                  <div class="plugin-title-row">
                    <span class="plugin-name">${escapeHtml(mod.name)}</span>
                    <span class="tag-pill">${escapeHtml(targetObj)}${keyPrefix ? ` (${escapeHtml(keyPrefix)})` : ''}</span>
                    ${mod.version ? `<span class="tag-pill">v${escapeHtml(mod.version)}</span>` : ''}
                    ${!isV2 ? `<span class="tag-pill" style="background:#fef3c7; color:#92400e; border-color:#f59e0b;">Legacy v1 — Re-import .sfe.json</span>` : ''}
                  </div>
                  ${mod.description ? `<div class="plugin-desc">${escapeHtml(mod.description)}</div>` : ''}
                </div>
                <label class="switch">
                  <input type="checkbox" class="overview-mod-toggle" data-mod-id="${escapeHtml(mod.id)}" ${isEnabled ? 'checked' : ''} ${!isV2 ? 'disabled' : ''}>
                  <span class="slider"></span>
                </label>
              </div>
              <div class="plugin-card-footer">
                <button type="button" class="btn btn-neutral btn-sm overview-mod-edit" data-mod-id="${escapeHtml(mod.id)}">Edit JSON →</button>
                <button type="button" class="btn btn-danger-ghost btn-sm overview-mod-remove" data-mod-id="${escapeHtml(mod.id)}">Remove</button>
              </div>
            </div>
          `;
        })
        .join('');

      overviewCustomModsGrid.querySelectorAll('.overview-mod-toggle').forEach((chk) => {
        chk.addEventListener('change', (e) => {
          const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === chk.dataset.modId);
          if (target) {
            target.enabled = e.target.checked;
            updateUI();
            persistCurrentSettings();
          }
        });
      });
      overviewCustomModsGrid.querySelectorAll('.overview-mod-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === btn.dataset.modId);
          if (target) loadModIntoEditor(target);
          navigateToPage('import-plugin', true);
        });
      });
      overviewCustomModsGrid.querySelectorAll('.overview-mod-remove').forEach((btn) => {
        btn.addEventListener('click', () => {
          const modId = btn.dataset.modId;
          currentSettings.inspectorMods.mods = currentSettings.inspectorMods.mods.filter((m) => m.id !== modId);
          if (selectedEditModId === modId) selectedEditModId = '';
          updateUI();
          persistCurrentSettings(() => showStatus('Plugin removed.'));
        });
      });
    }

    // 2. Installed Plugins List (Custom Plugin Importer Page)
    if (pageInstalledModsList) {
      if (!mods.length) {
        pageInstalledModsList.innerHTML =
          '<div style="padding:14px; border:1px dashed var(--border-dark); border-radius:7px; text-align:center; font-size:12px; color:var(--subtext);">No custom plugins installed yet.</div>';
      } else {
        pageInstalledModsList.innerHTML = mods
          .map((mod) => {
            const targetObj = (mod.target && mod.target.objectApiName) || 'Record';
            const keyPrefix = (mod.target && mod.target.keyPrefix) || '';
            const isSelected = selectedEditModId === mod.id;
            const isV2 = mod.schemaVersion === 2;
            return `
              <div class="mod-row-card ${isSelected ? 'selected' : ''}" data-mod-id="${escapeHtml(mod.id)}">
                <div class="mod-row-main" data-mod-id="${escapeHtml(mod.id)}">
                  <div class="mod-row-title">
                    <span>${escapeHtml(mod.name)}</span>
                    <span class="tag-pill">${escapeHtml(targetObj)}${keyPrefix ? ` (${escapeHtml(keyPrefix)})` : ''}</span>
                    ${!isV2 ? `<span class="tag-pill" style="background:#fef3c7; color:#92400e; border-color:#f59e0b;">Legacy v1</span>` : ''}
                  </div>
                  ${mod.description ? `<div class="mod-row-desc">${escapeHtml(mod.description)}</div>` : ''}
                </div>
                <div class="mod-row-actions">
                  <button type="button" class="btn btn-danger-ghost btn-sm page-mod-remove" data-mod-id="${escapeHtml(mod.id)}" title="Remove">✕</button>
                  <label class="switch">
                    <input type="checkbox" class="page-mod-toggle" data-mod-id="${escapeHtml(mod.id)}" ${isV2 && mod.enabled !== false ? 'checked' : ''} ${!isV2 ? 'disabled' : ''}>
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            `;
          })
          .join('');

        pageInstalledModsList.querySelectorAll('.mod-row-main').forEach((row) => {
          row.addEventListener('click', () => {
            const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === row.dataset.modId);
            if (target) loadModIntoEditor(target);
          });
        });
        pageInstalledModsList.querySelectorAll('.page-mod-toggle').forEach((chk) => {
          chk.addEventListener('change', (e) => {
            const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === chk.dataset.modId);
            if (target) {
              target.enabled = e.target.checked;
              updateUI();
              persistCurrentSettings();
            }
          });
        });
        pageInstalledModsList.querySelectorAll('.page-mod-remove').forEach((btn) => {
          btn.addEventListener('click', () => {
            const modId = btn.dataset.modId;
            currentSettings.inspectorMods.mods = currentSettings.inspectorMods.mods.filter((m) => m.id !== modId);
            if (selectedEditModId === modId) selectedEditModId = '';
            updateUI();
            persistCurrentSettings(() => showStatus('Plugin removed.'));
          });
        });
      }
    }

    applyPluginsFilter();
  }

  function updateUI() {
    if (chkModSubtabs) chkModSubtabs.checked = currentSettings.modules.subtabs !== false;
    if (chkHideAppName) {
      chkHideAppName.checked = !!(currentSettings.subtabs?.hideAppName || currentSettings.hideAppName);
    }
    if (chkModLinkInterceptor) {
      chkModLinkInterceptor.checked = currentSettings.modules.linkInterceptor !== false;
    }
    if (chkModQuickViews) {
      chkModQuickViews.checked = currentSettings.modules.quickViews !== false;
    }
    if (chkModClipboardFix) {
      chkModClipboardFix.checked = currentSettings.modules.clipboardFix !== false;
    }
    if (chkModLoading) {
      chkModLoading.checked = currentSettings.modules.loadingAnimation === true;
    }

    // Active Plugins Badge
    if (pluginsActiveCountPill) {
      const mods = (currentSettings.inspectorMods && Array.isArray(currentSettings.inspectorMods.mods))
        ? currentSettings.inspectorMods.mods
        : [];
      const activeCustomCount = mods.filter((m) => m && m.enabled !== false && m.schemaVersion === 2).length;
      const activeBuiltInCount =
        (currentSettings.modules.subtabs !== false ? 1 : 0) +
        (currentSettings.modules.linkInterceptor !== false ? 1 : 0) +
        (currentSettings.modules.quickViews !== false ? 1 : 0) +
        (currentSettings.modules.clipboardFix !== false ? 1 : 0) +
        (currentSettings.modules.loadingAnimation === true ? 1 : 0);
      pluginsActiveCountPill.textContent = String(activeBuiltInCount + activeCustomCount);
    }

    // Themes
    const isThemingEnabled = !!currentSettings.modules.theming;
    if (chkModTheming) chkModTheming.checked = isThemingEnabled;
    const activeThemeDef = THEMES[currentSettings.theme.preset] || THEMES['classic'];
    const resolvedAccent = currentSettings.theme.preset === 'custom'
      ? currentSettings.theme.customAccent
      : activeThemeDef.accent;

    if (isThemingEnabled) {
      if (themingDesc) themingDesc.textContent = `Active Theme: ${activeThemeDef.name}`;
      updateThemeColors(resolvedAccent);
    } else {
      if (themingDesc) themingDesc.textContent = 'Disabled. Native Salesforce theme active.';
      updateThemeColors('#0176d3');
    }
    updateThemePreviewBanner(activeThemeDef, resolvedAccent);

    themeChips.forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.theme === currentSettings.theme.preset);
    });

    if (customColorRow) {
      if (currentSettings.theme.preset === 'custom') {
        customColorRow.style.display = 'flex';
        if (customColorPicker) customColorPicker.value = currentSettings.theme.customAccent;
        if (customColorHex) customColorHex.value = currentSettings.theme.customAccent;
        if (customChipDot) customChipDot.style.background = currentSettings.theme.customAccent;
      } else {
        customColorRow.style.display = 'none';
      }
    }
    if (chkApplyNavigation) {
      chkApplyNavigation.checked = currentSettings.theme.applyToNavigation !== false;
    }

    renderModsViews();
    renderKeybindsList();
    updateLoadingPreview();
  }

  const CODE_DISPLAY_MAP = {
    BracketLeft: '[',
    BracketRight: ']',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backslash: '\\',
    Semicolon: ';',
    Quote: '\'',
    Minus: '-',
    Equal: '=',
    Backquote: '`',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Space: 'Space',
    Tab: 'Tab',
    Backspace: 'Backspace'
  };

  function formatKeyCombo(combo) {
    if (!combo) return 'Unbound';
    return combo
      .split('+')
      .map((part) => {
        if (CODE_DISPLAY_MAP[part]) return CODE_DISPLAY_MAP[part];
        if (part.startsWith('Key')) return part.slice(3);
        if (part.startsWith('Digit')) return part.slice(5);
        return part;
      })
      .join(' + ');
  }

  function buildComboFromKeyEvent(event) {
    const ignored = new Set([
      'ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight',
      'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight', 'CapsLock'
    ]);
    if (!event || !event.code || ignored.has(event.code)) return '';
    const isFunctionKey = /^F([1-9]|1[0-2])$/.test(event.code);
    if (!event.ctrlKey && !event.altKey && !event.metaKey && !isFunctionKey) {
      return null;
    }
    const parts = [];
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push('Meta');
    parts.push(event.code);
    return parts.join('+');
  }

  function renderKeybindsList() {
    if (!currentSettings.subtabs) currentSettings.subtabs = {};
    const kb = normalizeKeybinds(currentSettings.subtabs.keybinds);
    currentSettings.subtabs.keybinds = kb;

    if (chkKeybindsEnabled) {
      chkKeybindsEnabled.checked = kb.enabled !== false;
    }
    if (!keybindsList) return;

    keybindsList.innerHTML = KEYBIND_ROWS.map((row) => {
      const combo = kb[row.id] || '';
      const isRec = recordingKeybindId === row.id;
      const cls = isRec ? 'keybind-record-btn recording' : (combo ? 'keybind-record-btn' : 'keybind-record-btn unbound');
      const label = isRec ? 'Press shortcut…' : formatKeyCombo(combo);
      return `
        <div class="keybind-row">
          <div>
            <div class="keybind-row-title">${escapeHtml(row.label)}</div>
            <div class="keybind-row-desc">${escapeHtml(row.desc)}</div>
          </div>
          <div class="keybind-controls">
            <button type="button" class="${cls}" data-kb-id="${escapeHtml(row.id)}" title="Click and press a key combination">${escapeHtml(label)}</button>
            <button type="button" class="btn btn-danger-ghost btn-sm keybind-clear-btn" data-kb-clear="${escapeHtml(row.id)}" title="Clear shortcut">✕</button>
          </div>
        </div>
      `;
    }).join('');

    keybindsList.querySelectorAll('.keybind-record-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.kbId;
        recordingKeybindId = recordingKeybindId === id ? '' : id;
        renderKeybindsList();
      });
    });

    keybindsList.querySelectorAll('.keybind-clear-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.kbClear;
        if (recordingKeybindId === id) recordingKeybindId = '';
        currentSettings.subtabs.keybinds[id] = '';
        renderKeybindsList();
        persistCurrentSettings(() => showStatus('Shortcut cleared.'));
      });
    });
  }

  window.addEventListener(
    'keydown',
    (event) => {
      if (!recordingKeybindId) return;
      event.preventDefault();
      event.stopPropagation();

      if (event.code === 'Escape') {
        recordingKeybindId = '';
        renderKeybindsList();
        return;
      }

      const combo = buildComboFromKeyEvent(event);
      if (combo === '') return;
      if (combo === null) {
        showStatus('Include Ctrl, Alt, Cmd, or a function key (F1–F12).', true);
        return;
      }

      if (!currentSettings.subtabs) currentSettings.subtabs = {};
      currentSettings.subtabs.keybinds = normalizeKeybinds(currentSettings.subtabs.keybinds);
      currentSettings.subtabs.keybinds[recordingKeybindId] = combo;
      currentSettings.subtabs.keybinds.enabled = true;
      recordingKeybindId = '';
      renderKeybindsList();
      persistCurrentSettings(() => showStatus(`Shortcut set to ${formatKeyCombo(combo)}.`));
    },
    true
  );

  if (chkKeybindsEnabled) {
    chkKeybindsEnabled.addEventListener('change', (e) => {
      if (!currentSettings.subtabs) currentSettings.subtabs = {};
      currentSettings.subtabs.keybinds = normalizeKeybinds(currentSettings.subtabs.keybinds);
      currentSettings.subtabs.keybinds.enabled = e.target.checked;
      persistCurrentSettings();
    });
  }

  if (btnResetKeybinds) {
    btnResetKeybinds.addEventListener('click', () => {
      recordingKeybindId = '';
      if (!currentSettings.subtabs) currentSettings.subtabs = {};
      currentSettings.subtabs.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
      renderKeybindsList();
      persistCurrentSettings(() => showStatus('Keybinds reset to defaults.'));
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
      if (!incoming.length) throw new Error('No plugin definitions found in JSON.');
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
        if (idx >= 0) currentSettings.inspectorMods.mods[idx] = mod;
        else currentSettings.inspectorMods.mods.push(mod);
      }
      selectedEditModId = validated[0].id;
      currentSettings.modules.inspectorMods = true;

      if (editorTitleLabel && validated.length === 1) {
        editorTitleLabel.textContent = `Editing: ${validated[0].name}`;
      }
      updateEditorSchemaSummary();
      updateUI();
      persistCurrentSettings(() => {
        showStatus(`Saved ${validated.map((m) => `"${m.name}"`).join(', ')}.`);
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
      if (p && typeof p.then === 'function') p.then(runOnce).catch(() => runOnce({}));
    } catch (_) {
      commitWithLatest({});
    }
  }

  function handleModFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target.result || '');
      if (modJsonTextarea) modJsonTextarea.value = text;
      updateEditorSchemaSummary();
      installAndSaveModsFromRawText(text);
    };
    reader.onerror = () => showStatus('Failed to read JSON file.', true);
    reader.readAsText(file);
  }

  function handleGifFile(file) {
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.json')) {
      navigateToPage('import-plugin', true);
      handleModFile(file);
      return;
    }
    if (!file.type.startsWith('image/')) {
      showStatus('Please select a valid image or GIF file.', true);
      return;
    }

    loadedFileName = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    const reader = new FileReader();
    reader.onload = (e) => {
      currentSettings.loadingImage.url = e.target.result;
      currentSettings.modules.loadingAnimation = true;
      updateUI();
      persistCurrentSettings(() => showStatus(`Saved "${file.name}".`));
    };
    reader.onerror = () => showStatus('Failed to read selected file.', true);
    reader.readAsDataURL(file);
  }

  function triggerDownloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // Built-in Plugin Listeners
  if (chkModSubtabs) {
    chkModSubtabs.addEventListener('change', (e) => {
      currentSettings.modules.subtabs = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }
  if (chkHideAppName) {
    chkHideAppName.addEventListener('change', (e) => {
      const val = e.target.checked;
      if (!currentSettings.subtabs) currentSettings.subtabs = {};
      currentSettings.subtabs.hideAppName = val;
      currentSettings.hideAppName = val;
      persistCurrentSettings();
    });
  }
  if (chkModLinkInterceptor) {
    chkModLinkInterceptor.addEventListener('change', (e) => {
      currentSettings.modules.linkInterceptor = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }
  if (chkModQuickViews) {
    chkModQuickViews.addEventListener('change', (e) => {
      currentSettings.modules.quickViews = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }
  if (chkModClipboardFix) {
    chkModClipboardFix.addEventListener('change', (e) => {
      currentSettings.modules.clipboardFix = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }
  if (chkModLoading) {
    chkModLoading.addEventListener('change', (e) => {
      currentSettings.modules.loadingAnimation = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }
  if (chkModLoadingStudio) {
    chkModLoadingStudio.addEventListener('change', (e) => {
      currentSettings.modules.loadingAnimation = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }

  // Custom Plugin Editor Toolbar Listeners
  if (modJsonTextarea) {
    modJsonTextarea.addEventListener('input', updateEditorSchemaSummary);
  }
  if (selModTemplate && modJsonTextarea) {
    selModTemplate.addEventListener('change', () => {
      const tplKey = selModTemplate.value;
      if (!tplKey || !STARTER_TEMPLATES[tplKey]) return;
      selectedEditModId = '';
      const tpl = STARTER_TEMPLATES[tplKey];
      if (editorTitleLabel) editorTitleLabel.textContent = `Template: ${tpl.name}`;
      modJsonTextarea.value = JSON.stringify(tpl, null, 2);
      selModTemplate.value = '';
      updateEditorSchemaSummary();
      renderModsViews();
    });
  }
  if (btnFormatModJson && modJsonTextarea) {
    btnFormatModJson.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(modJsonTextarea.value);
        modJsonTextarea.value = JSON.stringify(parsed, null, 2);
        updateEditorSchemaSummary();
      } catch (err) {
        showStatus(`Cannot format invalid JSON: ${err.message || err}`, true);
      }
    });
  }
  if (btnDownloadEditorMod && modJsonTextarea) {
    btnDownloadEditorMod.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(modJsonTextarea.value || '{}');
        const name = (parsed.id || 'plugin').replace(/[^a-zA-Z0-9_-]/g, '-');
        triggerDownloadJson(`${name}.sfe.json`, parsed);
      } catch (err) {
        showStatus(`Cannot download invalid JSON: ${err.message || err}`, true);
      }
    });
  }
  if (btnExportAllMods) {
    btnExportAllMods.addEventListener('click', () => {
      const mods = currentSettings.inspectorMods?.mods || [];
      if (!mods.length) return;
      const payload = mods.length === 1 ? mods[0] : { mods };
      const filename = mods.length === 1 ? `${mods[0].id}.sfe.json` : 'salesforce-enhancer-plugins.sfe.json';
      triggerDownloadJson(filename, payload);
    });
  }
  if (btnSaveModJson) {
    btnSaveModJson.addEventListener('click', () => {
      const raw = modJsonTextarea ? modJsonTextarea.value.trim() : '';
      if (!raw) {
        showStatus('Choose a .sfe.json file, select a template, or paste Plugin JSON first.', true);
        return;
      }
      installAndSaveModsFromRawText(raw);
    });
  }

  // Mod Dropzone
  if (modDropzone && modFileInput) {
    modDropzone.addEventListener('click', () => modFileInput.click());
    modFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleModFile(file);
      modFileInput.value = '';
    });
    modDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modDropzone.classList.add('dragover');
    });
    modDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modDropzone.classList.remove('dragover');
    });
    modDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      modDropzone.classList.remove('dragover');
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) handleModFile(files[0]);
    });
  }

  // Loading Animation Studio Listeners
  presetGifCards.forEach((card) => {
    card.addEventListener('click', () => {
      const presetKey = card.dataset.preset;
      if (presetKey === 'custom') {
        if (gifFileInput) gifFileInput.click();
        return;
      }
      const targetUrl = card.dataset.url !== undefined ? card.dataset.url : (PRESET_GIF_MAP[presetKey] || '');
      currentSettings.loadingImage.url = targetUrl;
      currentSettings.modules.loadingAnimation = true;
      loadedFileName = '';
      updateUI();
      persistCurrentSettings(() => showStatus(`Selected ${card.querySelector('.gif-card-name')?.textContent || 'preset'}.`));
    });
  });

  if (gifDropzone && gifFileInput) {
    gifDropzone.addEventListener('click', () => gifFileInput.click());
    gifFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (file) handleGifFile(file);
      gifFileInput.value = '';
    });
    gifDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      gifDropzone.classList.add('dragover');
    });
    gifDropzone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      gifDropzone.classList.remove('dragover');
    });
    gifDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      gifDropzone.classList.remove('dragover');
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length > 0) handleGifFile(files[0]);
    });
  }

  if (btnLoadUrl && urlInput) {
    btnLoadUrl.addEventListener('click', () => {
      const val = (urlInput.value || '').trim();
      if (!val) {
        showStatus('Please enter an image or GIF URL.', true);
        return;
      }
      currentSettings.loadingImage.url = val;
      currentSettings.modules.loadingAnimation = true;
      loadedFileName = '';
      updateUI();
      persistCurrentSettings(() => showStatus('Image URL saved.'));
    });
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnLoadUrl.click();
    });
  }

  sizeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      currentSettings.loadingImage.size = parseInt(btn.dataset.size, 10);
      updateUI();
      persistCurrentSettings();
    });
  });

  if (chkRotate) {
    chkRotate.addEventListener('change', (e) => {
      currentSettings.loadingImage.rotate = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }

  // Global window drop & paste routed cleanly to the appropriate upload handler
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.name.toLowerCase().endsWith('.json')) {
        navigateToPage('import-plugin', true);
        handleModFile(f);
      } else {
        navigateToPage('loading-animation', true);
        handleGifFile(f);
      }
    }
  });

  window.addEventListener('paste', (e) => {
    if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) return;
    const clipboard = e.clipboardData;
    if (!clipboard) return;
    if (clipboard.files && clipboard.files.length > 0) {
      const f = clipboard.files[0];
      if (f.name.toLowerCase().endsWith('.json')) {
        navigateToPage('import-plugin', true);
        handleModFile(f);
      } else {
        navigateToPage('loading-animation', true);
        handleGifFile(f);
      }
      return;
    }
    const text = clipboard.getData('text');
    if (text && (text.startsWith('http://') || text.startsWith('https://') || text.startsWith('data:image/'))) {
      if (urlInput) urlInput.value = text.trim();
      currentSettings.loadingImage.url = text.trim();
      currentSettings.modules.loadingAnimation = true;
      loadedFileName = '';
      updateUI();
      persistCurrentSettings(() => showStatus('Image URL applied.'));
    }
  });

  // Theme Listeners
  if (chkModTheming) {
    chkModTheming.addEventListener('change', (e) => {
      currentSettings.modules.theming = e.target.checked;
      updateUI();
      persistCurrentSettings();
    });
  }

  themeChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const preset = chip.dataset.theme;
      if (!preset) return;
      currentSettings.theme.preset = preset;
      currentSettings.modules.theming = true;
      updateUI();
      persistCurrentSettings();
    });
  });

  if (customColorPicker) {
    customColorPicker.addEventListener('input', (e) => {
      currentSettings.theme.customAccent = e.target.value;
      if (customColorHex) customColorHex.value = e.target.value;
      if (customChipDot) customChipDot.style.background = e.target.value;
      updateThemeColors(e.target.value);
      updateThemePreviewBanner(THEMES['custom'], e.target.value);
      persistCurrentSettings();
    });
  }

  if (customColorHex) {
    customColorHex.addEventListener('change', (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith('#')) val = '#' + val;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        currentSettings.theme.customAccent = val;
        if (customColorPicker) customColorPicker.value = val;
        if (customChipDot) customChipDot.style.background = val;
        updateThemeColors(val);
        updateThemePreviewBanner(THEMES['custom'], val);
        persistCurrentSettings();
      }
    });
  }

  if (chkApplyNavigation) {
    chkApplyNavigation.addEventListener('change', (e) => {
      currentSettings.theme.applyToNavigation = e.target.checked;
      persistCurrentSettings();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('Reset all Salesforce Enhancer settings to defaults?')) {
        currentSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        selectedEditModId = '';
        if (modJsonTextarea) modJsonTextarea.value = '';
        if (urlInput) urlInput.value = '';
        updateEditorSchemaSummary();
        updateUI();
        persistCurrentSettings(() => showStatus('Reset to default settings.'));
      }
    });
  }

  if (api && api.storage && api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.sf_enhancer_settings?.newValue) {
        currentSettings = Object.assign({}, DEFAULT_SETTINGS, changes.sf_enhancer_settings.newValue);
        updateUI();
      }
    });
  }

  function loadInitialSettings() {
    navigateToPage(activePage, false);

    if (!api || !api.storage || !api.storage.local) {
      updateUI();
      return;
    }
    try {
      api.storage.local.get(['sf_enhancer_settings', 'sf_appearance_settings'], (res) => {
        const loaded = res?.sf_enhancer_settings || res?.sf_appearance_settings;
        if (loaded && typeof loaded === 'object') {
          if (loaded.modules) currentSettings.modules = Object.assign({}, currentSettings.modules, loaded.modules);
          if (loaded.subtabs) {
            currentSettings.subtabs = {
              hideAppName: !!(loaded.subtabs.hideAppName !== undefined ? loaded.subtabs.hideAppName : loaded.hideAppName),
              keybinds: normalizeKeybinds(loaded.subtabs.keybinds)
            };
          }
          if (loaded.hideAppName !== undefined) currentSettings.hideAppName = loaded.hideAppName;
          if (loaded.inspectorMods && Array.isArray(loaded.inspectorMods.mods)) {
            currentSettings.inspectorMods = { mods: loaded.inspectorMods.mods };
          }
          if (loaded.theme && typeof loaded.theme === 'object') {
            currentSettings.theme = Object.assign({}, currentSettings.theme, loaded.theme);
          }
          if (loaded.loadingImage) {
            currentSettings.loadingImage = Object.assign({}, currentSettings.loadingImage, loaded.loadingImage);
          } else if (loaded.loadingUrl) {
            currentSettings.loadingImage.url = loaded.loadingUrl;
          }
        }
        if (
          urlInput &&
          currentSettings.loadingImage.url &&
          !currentSettings.loadingImage.url.startsWith('data:') &&
          currentSettings.loadingImage.url !== GIF_PARROT &&
          currentSettings.loadingImage.url !== GIF_NYAN
        ) {
          urlInput.value = currentSettings.loadingImage.url;
        }
        if (initialEditModId && modJsonTextarea) {
          const target = currentSettings.inspectorMods?.mods?.find((m) => m.id === initialEditModId);
          if (target) {
            loadModIntoEditor(target);
          }
        } else if (
          activePage === 'import-plugin' &&
          modJsonTextarea &&
          !modJsonTextarea.value.trim() &&
          currentSettings.inspectorMods?.mods?.length
        ) {
          loadModIntoEditor(currentSettings.inspectorMods.mods[0]);
        }
        updateEditorSchemaSummary();
        updateUI();
      });
    } catch (_) {
      updateUI();
    }
  }

  loadInitialSettings();
})();
