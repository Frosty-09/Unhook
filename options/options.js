/**
 * Unhook Extension - Options Dashboard Script
 */

const DEFAULT_SETTINGS = {
  extension_enabled: true,
  theme: 'dark',
  // 1. Home Feed
  hide_home_feed: true,
  redirect_to_subscriptions: false,
  redirect_to_playlist: false,
  custom_playlist_url: 'https://www.youtube.com/feed/playlists',
  hide_sidebar: true,
  hide_recommended: true,
  hide_live_chat: true,
  hide_playlist: true,
  full_width_playlist: false,
  hide_fundraiser: true,
  hide_transcript_chapters: true,
  group_sidebar_collapsed: false,
  hide_endscreen_feed: true,
  hide_endscreen_cards: true,
  hide_comments: false,
  hide_comment_previews: false,
  group_comments_collapsed: true,
  hide_mixes: false,
  hide_merch: false,
  hide_video_info: false,
  hide_buttons_bar: false,
  hide_channel: false,
  hide_description: false,
  group_video_info_collapsed: true,
  hide_top_header: false,
  hide_notifications: true,
  hide_search_bar: false,
  hide_voice_search: false,
  hide_create_button: false,
  hide_user_avatar: false,
  group_header_collapsed: false,
  hide_inapt_search_results: true,
  hide_explore_trending: false,
  hide_more_from_youtube: true,
  hide_shorts: false,
  hide_subscriptions: false,
  disable_autoplay: true,
  disable_annotations: true,
  custom_css: ''
};

// Safe storage wrapper
const storage = {
  get: (keys, callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.get(keys, (items) => {
        if (chrome.runtime.lastError) {
          chrome.storage.local.get(keys, callback);
        } else {
          callback(items);
        }
      });
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(keys, callback);
    } else {
      const res = {};
      const targetKeys = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys || {}));
      targetKeys.forEach(k => {
        const val = localStorage.getItem('unhook_' + k);
        res[k] = val !== null ? JSON.parse(val) : (DEFAULT_SETTINGS[k] !== undefined ? DEFAULT_SETTINGS[k] : null);
      });
      callback(res);
    }
  },
  set: (items, callback) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
      chrome.storage.sync.set(items, () => {
        if (chrome.runtime.lastError) {
          chrome.storage.local.set(items, callback);
        } else if (callback) {
          callback();
        }
      });
    } else if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set(items, callback);
    } else {
      Object.entries(items).forEach(([k, v]) => {
        localStorage.setItem('unhook_' + k, JSON.stringify(v));
      });
      if (callback) callback();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const navLinks = document.querySelectorAll('.nav-link');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeLabel = document.getElementById('themeLabel');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const customCssInput = document.getElementById('customCssInput');
  const customPlaylistUrlInput = document.getElementById('custom_playlist_url');
  const saveCssBtn = document.getElementById('saveCssBtn');
  const cssSaveStatus = document.getElementById('cssSaveStatus');
  const exportSettingsBtn = document.getElementById('exportSettingsBtn');
  const importSettingsBtn = document.getElementById('importSettingsBtn');
  const importFileInput = document.getElementById('importFileInput');
  const importStatus = document.getElementById('importStatus');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');

  // Load Settings
  function loadAllSettings() {
    storage.get(DEFAULT_SETTINGS, (settings) => {
      const current = Object.assign({}, DEFAULT_SETTINGS, settings);

      // Theme
      applyTheme(current.theme || 'dark');

      // Checkboxes
      checkboxes.forEach(cb => {
        const key = cb.dataset.key;
        if (key && current[key] !== undefined) {
          cb.checked = Boolean(current[key]);
        }
      });

      // Custom Playlist URL
      if (customPlaylistUrlInput) {
        customPlaylistUrlInput.value = current.custom_playlist_url || '';
      }

      // Custom CSS
      if (customCssInput) {
        customCssInput.value = current.custom_css || '';
      }
    });
  }

  loadAllSettings();

  // Tab Navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.dataset.tab;
      navLinks.forEach(l => l.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      link.classList.add('active');
      const pane = document.getElementById('tab-' + targetTab);
      if (pane) pane.classList.add('active');
    });
  });

  // Checkbox changes
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      const key = cb.dataset.key;
      if (key) {
        const update = {};
        update[key] = cb.checked;

        // Mutual exclusivity for redirect options
        if (key === 'redirect_to_subscriptions' && cb.checked) {
          const playlistCb = document.getElementById('redirect_to_playlist');
          if (playlistCb && playlistCb.checked) {
            playlistCb.checked = false;
            update['redirect_to_playlist'] = false;
          }
        } else if (key === 'redirect_to_playlist' && cb.checked) {
          const subCb = document.getElementById('redirect_to_subscriptions');
          if (subCb && subCb.checked) {
            subCb.checked = false;
            update['redirect_to_subscriptions'] = false;
          }
        }

        // Mutual exclusivity for playlist options
        if (key === 'full_width_playlist' && cb.checked) {
          const hidePlaylistCb = document.getElementById('hide_playlist');
          if (hidePlaylistCb && hidePlaylistCb.checked) {
            hidePlaylistCb.checked = false;
            update['hide_playlist'] = false;
          }
        } else if (key === 'hide_playlist' && cb.checked) {
          const fullWidthCb = document.getElementById('full_width_playlist');
          if (fullWidthCb && fullWidthCb.checked) {
            fullWidthCb.checked = false;
            update['full_width_playlist'] = false;
          }
        }

        storage.set(update);
      }
    });
  });

  // Custom Playlist URL input changes
  if (customPlaylistUrlInput) {
    customPlaylistUrlInput.addEventListener('change', () => {
      storage.set({ custom_playlist_url: customPlaylistUrlInput.value.trim() });
    });
  }

  // Theme Switcher
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      if (themeLabel) themeLabel.textContent = 'Switch to Dark Theme';
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      if (themeLabel) themeLabel.textContent = 'Switch to Light Theme';
    }
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isLight = document.body.classList.contains('theme-light');
      const newTheme = isLight ? 'dark' : 'light';
      applyTheme(newTheme);
      storage.set({ theme: newTheme });
    });
  }

  // Custom CSS Saving
  if (saveCssBtn) {
    saveCssBtn.addEventListener('click', () => {
      const cssVal = customCssInput.value;
      storage.set({ custom_css: cssVal }, () => {
        cssSaveStatus.textContent = 'Custom CSS saved successfully!';
        setTimeout(() => {
          cssSaveStatus.textContent = '';
        }, 3000);
      });
    });
  }

  // Export Settings JSON
  if (exportSettingsBtn) {
    exportSettingsBtn.addEventListener('click', () => {
      storage.get(DEFAULT_SETTINGS, (settings) => {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', 'unhook-settings.json');
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    });
  }

  // Import Settings JSON
  if (importSettingsBtn && importFileInput) {
    importSettingsBtn.addEventListener('click', () => {
      importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          storage.set(parsed, () => {
            loadAllSettings();
            importStatus.textContent = 'Settings imported successfully!';
            setTimeout(() => {
              importStatus.textContent = '';
            }, 3000);
          });
        } catch (err) {
          alert('Invalid JSON configuration file: ' + err.message);
        }
      };
      reader.readAsText(file);
      importFileInput.value = '';
    });
  }

  // Reset Defaults
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all Unhook settings to factory defaults?')) {
        storage.set(DEFAULT_SETTINGS, () => {
          loadAllSettings();
          alert('All settings have been reset to defaults.');
        });
      }
    });
  }
});
