/**
 * Unhook Extension - Popup Script
 */

const DEFAULT_SETTINGS = {
  extension_enabled: true,
  theme: 'dark',

  // 1. Home Feed
  hide_home_feed: true,
  redirect_to_subscriptions: false,
  redirect_to_playlist: false,
  custom_playlist_url: 'https://www.youtube.com/feed/playlists',

  // 2. Video Sidebar
  hide_sidebar: true,
  hide_recommended: true,
  hide_live_chat: true,
  hide_playlist: true,
  hide_fundraiser: true,
  hide_transcript_chapters: true,
  group_sidebar_collapsed: false,

  // 3. End Screen Feed
  hide_endscreen_feed: true,

  // 4. End Screen Cards
  hide_endscreen_cards: true,

  // 5. Comments
  hide_comments: false,
  hide_comment_previews: false,
  group_comments_collapsed: true,

  // 6. Mixes
  hide_mixes: false,

  // 7. Merch, Tickets, Offers
  hide_merch: false,

  // 8. Video Info
  hide_video_info: false,
  hide_buttons_bar: false,
  hide_channel: false,
  hide_description: false,
  group_video_info_collapsed: true,

  // 9. Top Header
  hide_top_header: false,
  hide_notifications: true,
  hide_search_bar: false,
  hide_voice_search: false,
  hide_create_button: false,
  hide_user_avatar: false,
  group_header_collapsed: false,

  // 10. Inapt Search Results
  hide_inapt_search_results: true,

  // 11. Explore, Trending
  hide_explore_trending: false,

  // 12. More from YouTube
  hide_more_from_youtube: true,

  // 13. Shorts Tab
  hide_shorts: false,

  // 14. Subscriptions
  hide_subscriptions: false,

  // 15. Autoplay
  disable_autoplay: true,

  // 16. Annotations
  disable_annotations: true,

  // Custom CSS
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
      // Fallback for standalone/mock preview
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
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const powerToggleBtn = document.getElementById('powerToggleBtn');
  const expandButtons = document.querySelectorAll('.expand-btn');
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  const labelSpans = document.querySelectorAll('.option-label');

  // Load current settings from storage
  storage.get(DEFAULT_SETTINGS, (settings) => {
    const current = Object.assign({}, DEFAULT_SETTINGS, settings);

    // Apply Theme
    applyTheme(current.theme || 'dark');

    // Apply Master Enabled State
    applyPowerState(current.extension_enabled !== false);

    // Apply Checkboxes
    checkboxes.forEach(cb => {
      const key = cb.dataset.key;
      if (key && current[key] !== undefined) {
        cb.checked = Boolean(current[key]);
      }
    });

    // Apply Accordion States
    applyAccordionState('group_sidebar', current.group_sidebar_collapsed);
    applyAccordionState('group_comments', current.group_comments_collapsed !== false);
    applyAccordionState('group_video_info', current.group_video_info_collapsed !== false);
    applyAccordionState('group_header', current.group_header_collapsed);
  });

  // Checkbox change handlers
  checkboxes.forEach(cb => {
    cb.addEventListener('change', (e) => {
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

        storage.set(update);
      }
    });
  });

  // Click on option label toggles checkbox
  labelSpans.forEach(label => {
    label.addEventListener('click', (e) => {
      const targetId = label.dataset.target;
      if (targetId) {
        const targetCb = document.getElementById(targetId);
        if (targetCb) {
          targetCb.checked = !targetCb.checked;
          targetCb.dispatchEvent(new Event('change'));
        }
      }
    });
  });

  // Expand / Collapse Buttons
  expandButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const groupId = btn.dataset.group;
      const groupEl = document.getElementById(groupId);
      if (groupEl) {
        const isCollapsed = groupEl.classList.toggle('collapsed');
        btn.textContent = isCollapsed ? '+' : '−';
        
        // Save accordion state
        const storageKey = groupId + '_collapsed';
        const update = {};
        update[storageKey] = isCollapsed;
        storage.set(update);
      }
    });
  });

  // Theme Toggle Button
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isCurrentlyDark = document.body.classList.contains('theme-dark') || !document.body.classList.contains('theme-light');
      const newTheme = isCurrentlyDark ? 'light' : 'dark';
      applyTheme(newTheme);
      storage.set({ theme: newTheme });
    });
  }

  // Master Power Toggle Button
  if (powerToggleBtn) {
    powerToggleBtn.addEventListener('click', () => {
      const currentlyEnabled = !document.body.classList.contains('disabled');
      const newState = !currentlyEnabled;
      applyPowerState(newState);
      storage.set({ extension_enabled: newState });
    });
  }

  // Helper: Apply Theme
  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
    }
  }

  // Helper: Apply Power State
  function applyPowerState(enabled) {
    if (enabled) {
      document.body.classList.remove('disabled');
      powerToggleBtn.classList.add('active');
      powerToggleBtn.title = 'Unhook is ON (Click to turn OFF)';
    } else {
      document.body.classList.add('disabled');
      powerToggleBtn.classList.remove('active');
      powerToggleBtn.title = 'Unhook is OFF (Click to turn ON)';
    }
  }

  // Helper: Apply Accordion State
  function applyAccordionState(groupId, isCollapsed) {
    const groupEl = document.getElementById(groupId);
    if (!groupEl) return;
    const btn = groupEl.querySelector('.expand-btn');
    if (isCollapsed) {
      groupEl.classList.add('collapsed');
      if (btn) btn.textContent = '+';
    } else {
      groupEl.classList.remove('collapsed');
      if (btn) btn.textContent = '−';
    }
  }

  // --------------------------------------------------------------------------
  // Footer & Modals
  // --------------------------------------------------------------------------
  const modalOverlay = document.getElementById('modalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const donateBtn = document.getElementById('donateBtn');
  const requestFeatureBtn = document.getElementById('requestFeatureBtn');
  const supportBtn = document.getElementById('supportBtn');

  function openModal(title, htmlContent) {
    modalTitle.textContent = title;
    modalBody.innerHTML = htmlContent;
    modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
  }

  if (donateBtn) {
    donateBtn.addEventListener('click', () => {
      openModal('Donate & Support Unhook', `
        <p>Thank you for using Unhook! If this extension has improved your focus and saved you hours of time, consider supporting independent development.</p>
        <div class="modal-actions">
          <button class="btn-primary" id="openDonateLink">Support on BuyMeACoffee</button>
        </div>
      `);
      document.getElementById('openDonateLink')?.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: 'https://buymeacoffee.com' });
        } else {
          window.open('https://buymeacoffee.com', '_blank');
        }
        closeModal();
      });
    });
  }

  if (requestFeatureBtn) {
    requestFeatureBtn.addEventListener('click', () => {
      openModal('Request Feature / Feedback', `
        <p>Have an idea to make Unhook even better? Found a YouTube element you want hidden?</p>
        <p>You can also configure custom CSS rules and options in the settings dashboard.</p>
        <div class="modal-actions">
          <button class="btn-primary" id="openOptionsPage">Open Settings Dashboard</button>
        </div>
      `);
      document.getElementById('openOptionsPage')?.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        } else if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
        }
        closeModal();
      });
    });
  }

  if (supportBtn) {
    supportBtn.addEventListener('click', () => {
      openModal('Unhook Help & Shortcuts', `
        <p><strong>Keyboard Shortcuts:</strong></p>
        <ul style="margin: 6px 0 12px 18px; line-height: 1.6;">
          <li><kbd>Alt+Shift+U</kbd> : Toggle Extension On/Off</li>
          <li><kbd>Alt+Shift+H</kbd> : Toggle Home Feed</li>
          <li><kbd>Alt+Shift+S</kbd> : Toggle Sidebar</li>
        </ul>
        <div class="modal-actions">
          <button class="btn-primary" id="openSettingsBtn">Full Dashboard</button>
        </div>
      `);
      document.getElementById('openSettingsBtn')?.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
          chrome.runtime.openOptionsPage();
        }
        closeModal();
      });
    });
  }
});
