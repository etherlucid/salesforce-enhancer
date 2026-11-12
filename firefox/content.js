(function () {
  'use strict';

  const isTopWindow = window === window.top;
  const api = typeof browser !== 'undefined' ? browser : chrome;

  const GIF_PARROT = api?.runtime?.getURL ? api.runtime.getURL('parrot.gif') : 'parrot.gif';
  const GIF_NYAN = api?.runtime?.getURL ? api.runtime.getURL('nyan.gif') : 'nyan.gif';
  const GIF_CAT = 'https://media.giphy.com/media/unQ3IJU2RG7DO/giphy.gif';
  const GIF_SPINNER = '';

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

  function hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string') return `rgba(1, 118, 211, ${alpha})`;
    let c = hex.replace('#', '').trim();
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
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

  function normalizeSettings(raw) {
    const hideAppName = raw ? (raw.hideAppName !== undefined ? !!raw.hideAppName : (raw.subtabs && raw.subtabs.hideAppName !== undefined ? !!raw.subtabs.hideAppName : false)) : false;
    if (!raw || typeof raw !== 'object') {
      return {
        version: '1.2.2',
        modules: { subtabs: true, quickViews: true, theming: false, loadingAnimation: false },
        subtabs: { hideAppName: false },
        hideAppName: false,
        theme: { preset: 'classic', customAccent: '#8b5cf6', applyToNavigation: true },
        loadingImage: { url: GIF_PARROT, size: 64, rotate: false }
      };
    }

    const res = {
      version: '1.2.2',
      modules: {
        subtabs: raw.modules ? raw.modules.subtabs !== false : true,
        quickViews: raw.modules ? raw.modules.quickViews !== false : true,
        theming: raw.modules ? !!raw.modules.theming : (raw.applyToSalesforce === false ? false : !!(raw.theme && raw.theme !== 'classic')),
        loadingAnimation: raw.modules ? raw.modules.loadingAnimation === true : (raw.loadingImage ? raw.loadingImage.enabled === true : false)
      },
      subtabs: {
        hideAppName: hideAppName
      },
      hideAppName: hideAppName,
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

  function sanitizeHexColor(hex, fallback = '#8b5cf6') {
    if (!hex || typeof hex !== 'string') return fallback;
    const trimmed = hex.trim();
    return /^#[0-9a-fA-F]{3,8}$/.test(trimmed) ? trimmed : fallback;
  }

  function sanitizeCssUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return url.replace(/["'\r\n\\]/g, '').trim();
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
    ].join(',\n        ');

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
    ].join(',\n        ');

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

  function generateThemeCSS(settings) {
    // If theming module is disabled, return empty string (zero CSS injected)
    if (!settings || !settings.modules || settings.modules.theming !== true) {
      return '';
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
    const applyNav = !settings.theme || settings.theme.applyToNavigation !== false;

    let css = `
      :root {
        --sf-theme-accent: ${accent} !important;
        --sf-theme-accent-tint: ${accentTint} !important;
        --sf-theme-accent-border: ${accentBorder} !important;
        --sf-theme-accent-contrast: ${accentContrast} !important;
      }

      /* Quick Views Item Accent Styling */
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
          --slds-s-menu-item-color-background-active: ${hoverBg} !important;
          --lwc-colorBackgroundDark: ${hoverBg} !important;
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
        /* Service Console Workspace Tab Header shares surfaceHeader with the tab strip */
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
        .tabItem button:not(.slds-dropdown *):not([role="menuitem"]):hover,
        .tabItem button.slds-button_icon:not(.slds-dropdown *):not([role="menuitem"]):hover,
        .tabItem .slds-context-bar__button-action:hover,
        .tabItem .close:hover,
        .slds-sub-tabs__item button:not(.slds-dropdown *):not([role="menuitem"]):hover {
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
        search_assistant-assistant-dialog,
        search_assistant-content-container,
        search_assistant-instant-results-list,
        search_assistant-empty-state,
        search_assistant-preview,
        search_assistant-natural-language-preview,
        force-search-assistant,
        force-search-assistant-layout,
        force-search-assistant-results,
        force-search-natural-language-help,
        force-search-instant-result-item,
        .slds-theme_default,
        .slds-theme--default,
        .slds-theme_shade,
        .slds-theme--shade,
        .slds-illustration,
        .slds-illustration_large,
        .slds-illustration_small,
        .slds-empty-state,
        .slds-box,
        .forceSearchAssistant,
        .forceSearchAssistantLayout,
        .forceSearchAssistantDialog,
        .forceSearchInstantResults,
        .forceSearchGlobalSearch,
        .forceSearchNaturalLanguageHelp,
        .forceSearchAssistantNaturalLanguage,
        [class*="searchAssistant" i],
        [class*="SearchAssistant" i],
        [class*="search-assistant" i],
        [class*="assistantResults" i],
        [class*="assistantPreview" i],
        [class*="assistantTips" i],
        [class*="assistantRight" i],
        [class*="searchTips" i],
        [class*="SearchTips" i],
        [class*="searchHelp" i],
        [class*="SearchHelp" i],
        [class*="doMoreWithSearch" i],
        [class*="DoMoreWithSearch" i],
        [class*="instantResult" i],
        [class*="InstantResult" i],
        [class*="search-preview" i],
        [class*="search-tips" i],
        [class*="search-results" i],
        [class*="searchPreview" i],
        [class*="searchResults" i],
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

        /* Search Assistant Right Pane Empty State ("Do more with Search!") & Illustration */
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

        [class*="searchAssistant" i] a {
          color: ${accent} !important;
        }

        /* Search Assistant Left Pane Results List & Hover */
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

        /* Option hover inside search dialog - strictly :hover so it auto-reverts on unhover */
        search_dialog-instant-result-item:hover,
        search_dialog-instant-result-item:hover .instant-result-item,
        search_assistant-assistant-dialog [role="option"]:hover,
        search_assistant-assistant-dialog .slds-listbox__option:hover,
        search_assistant-assistant-dialog .slds-listbox__item:hover,
        search_assistant-instant-results-list [role="option"]:hover,
        search_assistant-instant-results-list .slds-listbox__option:hover,
        search_assistant-instant-results-list .slds-listbox__item:hover,
        force-search-assistant-results .slds-listbox__option:hover,
        .forceSearchAssistantResults .slds-listbox__option:hover,
        div[class*="searchAssistantResults" i] .slds-listbox__option:hover,
        div[class*="searchAssistantResults" i] li:hover,
        div[class*="assistantResults" i] li:hover,
        [class*="searchAssistant" i] [role="option"]:hover,
        [class*="searchAssistant" i] .slds-listbox__option:hover,
        [class*="searchAssistant" i] .slds-listbox__item:hover,
        [class*="instantResult" i]:hover,
        [class*="InstantResult" i]:hover,
        .instant-result-item:hover,
        lightning-base-combobox-item:hover,
        force-search-instant-result-item:hover {
          background-color: ${hoverBg} !important;
          background: ${hoverBg} !important;
          color: ${baseTheme.text} !important;
        }

        /* Ensure all inner text spans, data-match, and rich text are transparent */
        search_dialog-instant-result-item:hover *,
        search_assistant-assistant-dialog [role="option"]:hover *,
        search_assistant-assistant-dialog .slds-listbox__option:hover *,
        search_assistant-instant-results-list [role="option"]:hover *,
        [class*="searchAssistant" i] [role="option"]:hover *,
        [class*="searchAssistant" i] .slds-listbox__option:hover *,
        .instant-result-item:hover *,
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

    return css;
  }

  function generateLoadingCSS(settings, loadingUrl) {
    if (!loadingUrl) return '';
    const safeUrl = sanitizeCssUrl(loadingUrl);
    const loadingSize = ((settings.loadingImage && settings.loadingImage.size) || 64) + 'px';
    const loadingAnim = (settings.loadingImage && settings.loadingImage.rotate) ? 'sf-custom-spin 1.2s linear infinite' : 'none';

    return `
      :root {
        --sf-custom-loading-img: url("${safeUrl}") !important;
        --sf-custom-loading-size: ${loadingSize} !important;
        --sf-custom-loading-anim: ${loadingAnim} !important;
      }

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
        content: url("${safeUrl}") !important;
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
        background-image: url("${safeUrl}") !important;
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
        background-image: url("${safeUrl}") !important;
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

  // 1. Child Frame / iframe Handler
  if (!isTopWindow) {
    // Clean up any rogue preload styles that may have existed in iframes
    const rogue = document.getElementById('sf-preload-theme-style');
    if (rogue) rogue.remove();

    const SF_ID_REGEX = /^[a-zA-Z0-9]{15,18}$/;
    const RECORD_URL_REGEX = /\/lightning\/r\/(?:[a-zA-Z0-9_]+\/)?([a-zA-Z0-9]{15,18})(?:\/view|$|\?|#)/;

    function extractTarget(event) {
      const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
      if (!path.length && event.target) {
        path.push(event.target);
      }

      for (const node of path) {
        if (!node || node.nodeType !== 1) continue;

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

        if (node.dataset) {
          for (const key of ['recordid', 'recordId', 'id', 'targetId', 'value']) {
            const val = node.dataset[key];
            if (val && typeof val === 'string' && SF_ID_REGEX.test(val.trim())) {
              return { recordId: val.trim() };
            }
          }
        }

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
      }

      return null;
    }

    window.addEventListener(
      'click',
      (e) => {
        if (e.button !== 0) return;
        const isCmdOrCtrl = e.metaKey || e.ctrlKey;
        const isAlt = e.altKey;
        if (!isAlt && !isCmdOrCtrl) return;

        try {
          window.getSelection()?.removeAllRanges();
        } catch (_) {}

        const target = extractTarget(e);
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isAlt && !isCmdOrCtrl) {
          const openInBackground = e.shiftKey;
          window.top.postMessage(
            {
              __sfEnhancer: true,
              __sfSubtabOpener: true,
              action: 'openSubtab',
              target,
              options: { openInBackground }
            },
            '*'
          );
        } else if (isCmdOrCtrl && !isAlt) {
          const focus = !e.shiftKey;
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
        }
      },
      true
    );

    return; // Child frame work is done! No styles, observers, or page scripts.
  }

  // -------------------------------------------------------------
  // TOP WINDOW ONLY: Preload Styling, Interception & Page Script
  // -------------------------------------------------------------

  let activeEarlyMascotObs = null;

  function getTabIconColor(rawSettings) {
    try {
      const s = rawSettings ? normalizeSettings(rawSettings) : null;
      if (s && s.modules?.theming === true && s.theme?.preset && s.theme.preset !== 'classic' && THEMES[s.theme.preset]) {
        return THEMES[s.theme.preset].textMuted || '#757575';
      }
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
      document.querySelectorAll('.oneConsoleNav > .appNavItems > .selectedListItem > a, .slds-context-bar__object-switcher > a').forEach(addIfValid);
      document.querySelectorAll('a[href*="/lightning/o/Case/list"], a[href*="/lightning/o/Case"]').forEach(addIfValid);
      document.querySelectorAll('.slds-context-bar__primary .slds-context-bar__item:not(:first-child) a').forEach(addIfValid);
      document.querySelectorAll('.slds-context-bar [title="Cases"] a, .slds-context-bar [data-id="Case"] a, .slds-context-bar [data-id="home"] a').forEach(addIfValid);
      const firstTab = document.querySelector('.tabBarItems > li:first-child a, one-app-nav-bar-item-root:first-child a');
      if (firstTab && (firstTab.href?.includes('/lightning/o/Case') || firstTab.getAttribute('title') === 'Cases')) {
        addIfValid(firstTab);
      }
    } catch (_) {}
    return Array.from(elements);
  }

  function syncHomeIconNavContext(rawSettings) {
    try {
      const s = rawSettings ? normalizeSettings(rawSettings) : null;
      const shouldHide = s ? ((s.modules?.subtabs !== false) && !!(s.hideAppName || s.subtabs?.hideAppName)) : false;
      const candidates = findHomeCandidateElements();
      const tabIconColor = getTabIconColor(s);

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
          // Salesforce Service Console splits Home link (.selectedListItem) and dropdown (.navMenu) as siblings inside .appNavItems
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

        if (!target.getAttribute('title') || target.getAttribute('title') === 'Cases') {
          target.setAttribute('title', 'Cases (Home)');
        }
        if (!target.getAttribute('aria-label')) {
          target.setAttribute('aria-label', 'Cases (Home)');
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

  function injectPreloadStyles(rawSettings) {
    let settings = rawSettings;
    try {
      if (!settings) {
        const pageStorage = window.wrappedJSObject?.localStorage || window.localStorage;
        const raw = (pageStorage ? pageStorage.getItem('sf_enhancer_settings') : null) ||
                    (pageStorage ? pageStorage.getItem('sf_appearance_settings') : null) ||
                    (document.documentElement?.dataset?.sfAppearance);
        if (raw) settings = JSON.parse(raw);
      }
    } catch (_) {}

    settings = normalizeSettings(settings);

    // 1. Loading Animation Preload (Independent of theming)
    const loadingUrl = getEffectiveLoadingUrl(settings);
    const loadingEnabled = settings.modules.loadingAnimation === true && !!loadingUrl;
    const loadingStyle = document.getElementById('sf-preload-loading-style');

    if (loadingEnabled) {
      const safeUrl = loadingUrl.replace(/"/g, '\\"');
      const loadingSize = ((settings.loadingImage && settings.loadingImage.size) || 64) + 'px';
      const loadingAnim = (settings.loadingImage && settings.loadingImage.rotate) ? 'sf-custom-spin 1.2s linear infinite' : 'none';

      if (document.documentElement) {
        document.documentElement.dataset.sfLoadingEnabled = 'true';
        document.documentElement.dataset.sfLoadingDisabled = 'false';
        document.documentElement.style.setProperty('--sf-custom-loading-img', `url("${safeUrl}")`, 'important');
        document.documentElement.style.setProperty('--sf-custom-loading-size', loadingSize, 'important');
        document.documentElement.style.setProperty('--sf-custom-loading-anim', loadingAnim, 'important');
      }

      const loadingCss = generateLoadingCSS(settings, loadingUrl);
      let el = loadingStyle;
      if (!el) {
        el = document.createElement('style');
        el.id = 'sf-preload-loading-style';
        const root = document.head || document.documentElement;
        if (root) root.appendChild(el);
      }
      if (el) el.textContent = loadingCss;
      startEarlyMascotInterceptor(loadingUrl, settings.loadingImage && settings.loadingImage.rotate);
    } else {
      if (document.documentElement) {
        document.documentElement.dataset.sfLoadingEnabled = 'false';
        document.documentElement.dataset.sfLoadingDisabled = 'true';
        document.documentElement.style.removeProperty('--sf-custom-loading-img');
        document.documentElement.style.removeProperty('--sf-custom-loading-size');
        document.documentElement.style.removeProperty('--sf-custom-loading-anim');
      }
      if (loadingStyle) loadingStyle.remove();
      if (activeEarlyMascotObs) {
        try { activeEarlyMascotObs.disconnect(); } catch (_) {}
        activeEarlyMascotObs = null;
      }
    }

    // 2. Theming Preload (Independent of loading animation)
    const themingStyle = document.getElementById('sf-preload-theme-style');
    if (settings.modules.theming === true) {
      const themeCss = generateThemeCSS(settings);
      if (themeCss) {
        let el = themingStyle;
        if (!el) {
          el = document.createElement('style');
          el.id = 'sf-preload-theme-style';
          const root = document.head || document.documentElement;
          if (root) root.appendChild(el);
        }
        if (el) el.textContent = themeCss;
      } else if (themingStyle) {
        themingStyle.remove();
      }
    } else if (themingStyle) {
      themingStyle.remove();
    }

    // 3. Hide App Name (Service Console label) & convert navigation tab into Home icon button
    const hideAppNameStyle = document.getElementById('sf-hide-app-name-style');
    const shouldHideAppName = (settings.modules?.subtabs !== false) && !!(settings.hideAppName || settings.subtabs?.hideAppName);
    if (shouldHideAppName) {
      let el = hideAppNameStyle;
      if (!el) {
        el = document.createElement('style');
        el.id = 'sf-hide-app-name-style';
        const root = document.head || document.documentElement;
        if (root) root.appendChild(el);
      }
      if (el) {
        el.textContent = `
          /* Hide ONLY the App Name text ("Service Console") next to App Launcher - NEVER anchor links or buttons! */
          span.slds-context-bar__app-name,
          span.appName,
          .slds-context-bar__primary span.appName,
          .slds-context-bar__primary span.slds-context-bar__app-name,
          .appName:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
          .slds-context-bar__app-name:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
          one-app-nav-bar .slds-context-bar__app-name:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
          one-appnav .slds-context-bar__app-name:not(a):not(button):not(:has(.appLauncher)):not(:has(button)),
          span[title="Service Console"],
          .slds-truncate[title="Service Console"] {
            display: none !important;
          }

          /* Ensure App Launcher (waffle button) and its container remain completely visible */
          .appLauncher,
          .slds-icon-waffle_container,
          .oneConsoleNav > .slds-context-bar__item:first-child,
          .slds-context-bar__primary > .slds-context-bar__item:first-child,
          .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher) {
            display: inline-flex !important;
            visibility: visible !important;
            opacity: 1 !important;
          }

          /* Compact left spacing before App Launcher and restore crisp separation after App Launcher */
          .slds-context-bar,
          one-appnav .slds-context-bar,
          one-app-nav-bar .slds-context-bar {
            padding-left: 0 !important;
          }

          .slds-context-bar__primary {
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

          /* App Launcher item (ONLY direct child of .oneConsoleNav or containing .appLauncher) */
          .oneConsoleNav > .slds-context-bar__item:first-child,
          .slds-context-bar__primary .slds-context-bar__item:has(.appLauncher) {
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
          .slds-context-bar__primary .appLauncher {
            padding: 0 !important;
            margin: 0 auto !important;
            height: 100% !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .slds-context-bar__primary .slds-icon-waffle_container,
          .slds-context-bar__primary button.slds-icon-waffle_container,
          .appLauncher button.slds-button,
          .appLauncher .slds-context-bar__button {
            padding: 0 !important;
            margin: 0 auto !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .slds-icon-waffle {
            margin: 0 auto !important;
          }

          /* Service Console unified Home tab wrapper (.oneConsoleNav > .appNavItems) */
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

          /* Standard nav Home Tab container fallback (when not inside .oneConsoleNav > .appNavItems) */
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
      }
      syncHomeIconNavContext(settings);
    } else if (hideAppNameStyle) {
      hideAppNameStyle.remove();
      syncHomeIconNavContext(settings);
    }
  }

  let earlyMascotStopTimer = null;

  function startEarlyMascotInterceptor(customImgUrl, shouldRotate) {
    if (activeEarlyMascotObs) {
      try { activeEarlyMascotObs.disconnect(); } catch (_) {}
      activeEarlyMascotObs = null;
    }
    clearTimeout(earlyMascotStopTimer);

    const anim = shouldRotate ? 'sf-custom-spin 1.2s linear infinite' : 'none';

    function checkImg(el) {
      const src = (el.src || el.getAttribute('src') || '').toLowerCase();
      const alt = (el.alt || el.getAttribute('alt') || '').toLowerCase();
      const title = (el.title || el.getAttribute('title') || '').toLowerCase();
      const isMascot =
        src.includes('astro') ||
        src.includes('codey') ||
        src.includes('einstein') ||
        src.includes('cloudy') ||
        src.includes('appy') ||
        src.includes('bear') ||
        src.includes('mascot') ||
        src.includes('illustration') ||
        src.includes('character') ||
        src.includes('salesforce-logo') ||
        alt.includes('loading') ||
        alt.includes('astro') ||
        title.includes('loading') ||
        (el.closest && el.closest('#auraLoadingBox, .auraLoadingBox, .slds-spinner_container, .loadingBox, .oneLoading'));

      if (isMascot && el.src !== customImgUrl) {
        el.src = customImgUrl;
        el.srcset = '';
        el.style.setProperty('object-fit', 'contain', 'important');
        el.style.setProperty('animation', anim, 'important');
        if (el.parentElement) {
          el.parentElement.style.setProperty('opacity', '1', 'important');
          el.parentElement.style.setProperty('visibility', 'visible', 'important');
        }
      }
    }

    function checkNode(el) {
      if (!el || el.nodeType !== 1) return;

      if (el.tagName === 'IMG') {
        checkImg(el);
        return;
      }

      if (el.querySelectorAll) {
        const imgs = el.querySelectorAll('img');
        for (let i = 0; i < imgs.length; i++) {
          checkImg(imgs[i]);
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
      checkNode(document.documentElement);
      activeEarlyMascotObs = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (let i = 0; i < m.addedNodes.length; i++) {
            checkNode(m.addedNodes[i]);
          }
        }
      });
      activeEarlyMascotObs.observe(document.documentElement, { childList: true, subtree: true });
      // Auto-disconnect early splash observer after initial page boot (CSS handles all runtime spinners)
      earlyMascotStopTimer = setTimeout(() => {
        if (activeEarlyMascotObs) {
          try { activeEarlyMascotObs.disconnect(); } catch (_) {}
          activeEarlyMascotObs = null;
        }
      }, 12000);
    } catch (_) {}
  }

  // Synchronously inject styles immediately at document_start in top window
  injectPreloadStyles();

  if (document.documentElement && api?.runtime?.getURL) {
    document.documentElement.dataset.sfParrotUrl = api.runtime.getURL('parrot.gif');
    document.documentElement.dataset.sfNyanUrl = api.runtime.getURL('nyan.gif');
  }

  // Inject page-script.js into the main page execution context so it can access window.$A and workspaceAPI
  function injectPageScript() {
    try {
      if (document.documentElement && document.documentElement.dataset.sfMainWorldLoaded === 'true') {
        return true;
      }
      const parent = document.head || document.documentElement;
      if (parent) {
        if (api?.runtime?.getURL) {
          parent.dataset.sfParrotUrl = api.runtime.getURL('parrot.gif');
          parent.dataset.sfNyanUrl = api.runtime.getURL('nyan.gif');
        }
        const script = document.createElement('script');
        script.src = api?.runtime?.getURL ? api.runtime.getURL('page-script.js') : 'page-script.js';
        script.dataset.parrotUrl = api?.runtime?.getURL ? api.runtime.getURL('parrot.gif') : 'parrot.gif';
        script.dataset.nyanUrl = api?.runtime?.getURL ? api.runtime.getURL('nyan.gif') : 'nyan.gif';
        script.onload = function () {
          this.remove();
        };
        parent.appendChild(script);
        return true;
      }
    } catch (_) {}
    return false;
  }

  if (!injectPageScript()) {
    const observer = new MutationObserver(() => {
      if (injectPageScript()) {
        observer.disconnect();
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }

  // Bridge between Browser Extension and Main Page Script
  function loadAndApplyStorageSettings() {
    if (!api || !api.storage || !api.storage.local) return;

    let applied = false;
    const applyFromStorage = (res) => {
      if (applied) return;
      applied = true;
      try {
        const loaded = res?.sf_enhancer_settings || res?.sf_appearance_settings;
        if (loaded) {
          const s = normalizeSettings(loaded);
          try {
            const pageStorage = window.wrappedJSObject?.localStorage || window.localStorage;
            if (pageStorage) {
              pageStorage.setItem('sf_enhancer_settings', JSON.stringify(s));
              pageStorage.setItem('sf_appearance_settings', JSON.stringify(s));
            }
          } catch (_) {}
          try {
            if (document.documentElement) {
              document.documentElement.dataset.sfAppearance = JSON.stringify(s);
            }
          } catch (_) {}
          injectPreloadStyles(s);
          window.postMessage({ __sfEnhancerAction: 'settingsUpdated', settings: s }, '*');
        }
      } catch (_) {}
    };

    try {
      const p = api.storage.local.get(['sf_enhancer_settings', 'sf_appearance_settings'], applyFromStorage);
      if (p && typeof p.then === 'function') {
        p.then(applyFromStorage).catch(() => {});
      }
    } catch (_) {}
  }

  loadAndApplyStorageSettings();

  let pendingContentSettings = null;
  let contentSettingsTimer = null;

  function broadcastSettingsUpdated(s) {
    pendingContentSettings = s;
    try {
      const pageStorage = window.wrappedJSObject?.localStorage || window.localStorage;
      if (pageStorage) {
        pageStorage.setItem('sf_enhancer_settings', JSON.stringify(s));
        pageStorage.setItem('sf_appearance_settings', JSON.stringify(s));
      }
    } catch (_) {}
    try {
      if (document.documentElement) {
        document.documentElement.dataset.sfAppearance = JSON.stringify(s);
      }
    } catch (_) {}
    injectPreloadStyles(s);

    if (contentSettingsTimer) {
      clearTimeout(contentSettingsTimer);
    }
    contentSettingsTimer = setTimeout(() => {
      contentSettingsTimer = null;
      const toBroadcast = pendingContentSettings || s;
      window.postMessage({ __sfEnhancerAction: 'settingsUpdated', settings: toBroadcast }, '*');
    }, 20);
  }

  if (api && api.runtime && api.runtime.onMessage) {
    api.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (!message || !message.action) return;
      if (message.action === 'applyEnhancerSettings' || message.action === 'applyAppearanceSettings') {
        const s = normalizeSettings(message.settings);
        broadcastSettingsUpdated(s);
        if (sendResponse) sendResponse({ ok: true });
      }
    });
  }

  window.addEventListener('message', (event) => {
    try {
      // Security: Only accept internal configuration messages from the exact same window context
      if (event.source !== window || (event.origin && event.origin !== window.location.origin)) {
        return;
      }
      if (event.data && event.data.__sfEnhancerAction === 'saveSettings' && event.data.settings) {
        const s = normalizeSettings(event.data.settings);
        try {
          const pageStorage = window.wrappedJSObject?.localStorage || window.localStorage;
          if (pageStorage) {
            pageStorage.setItem('sf_enhancer_settings', JSON.stringify(s));
            pageStorage.setItem('sf_appearance_settings', JSON.stringify(s));
          }
        } catch (_) {}
        try {
          if (document.documentElement) {
            document.documentElement.dataset.sfAppearance = JSON.stringify(s);
          }
        } catch (_) {}
        injectPreloadStyles(s);
        if (api && api.storage && api.storage.local) {
          api.storage.local.set({ sf_enhancer_settings: s, sf_appearance_settings: s }, () => {});
        }
      } else if (event.data && event.data.__sfEnhancerAction === 'requestSettings') {
        loadAndApplyStorageSettings();
      }
    } catch (_) {}
  });
})();
