/**
 * Unhook Extension - Background Service Worker (Manifest V3)
 */

const DEFAULT_SETTINGS = {
  extension_enabled: true,
  theme: 'dark',
  hide_home_feed: true,
  redirect_to_subscriptions: false,
  redirect_to_playlist: false,
  custom_playlist_url: 'https://www.youtube.com/feed/playlists',
  hide_sidebar: true,
  hide_recommended: true,
  hide_live_chat: true,
  hide_playlist: true,
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

// Safe storage access helper
function getStorage(callback) {
  const storageArea = (chrome.storage && chrome.storage.sync) || (chrome.storage && chrome.storage.local);
  if (storageArea) {
    storageArea.get(DEFAULT_SETTINGS, callback);
  }
}

function setStorage(items, callback) {
  const storageArea = (chrome.storage && chrome.storage.sync) || (chrome.storage && chrome.storage.local);
  if (storageArea) {
    storageArea.set(items, callback);
  }
}

// Update icon badge based on extension enabled state
function updateBadge(isEnabled) {
  if (!chrome.action) return;

  if (isEnabled) {
    chrome.action.setBadgeText({ text: '' });
  } else {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#e62117' });
  }
}

// Extension installation or update
chrome.runtime.onInstalled.addListener((details) => {
  getStorage((existing) => {
    const merged = Object.assign({}, DEFAULT_SETTINGS, existing || {});
    setStorage(merged, () => {
      updateBadge(merged.extension_enabled !== false);
    });
  });
});

// Extension startup
chrome.runtime.onStartup.addListener(() => {
  getStorage((settings) => {
    if (settings) {
      updateBadge(settings.extension_enabled !== false);
    }
  });
});

// Listen to storage changes to sync badge
chrome.storage.onChanged.addListener((changes) => {
  if (changes.extension_enabled) {
    updateBadge(changes.extension_enabled.newValue !== false);
  }
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
  getStorage((settings) => {
    const current = Object.assign({}, DEFAULT_SETTINGS, settings || {});

    if (command === 'toggle_extension') {
      const nextState = !current.extension_enabled;
      setStorage({ extension_enabled: nextState });
    } else if (command === 'toggle_home_feed') {
      const nextState = !current.hide_home_feed;
      setStorage({ hide_home_feed: nextState });
    } else if (command === 'toggle_sidebar') {
      const nextState = !current.hide_sidebar;
      setStorage({ hide_sidebar: nextState });
    }
  });
});
