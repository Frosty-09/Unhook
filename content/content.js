/**
 * Unhook Extension - Content Script
 * Executes at document_start to provide instant zero-flicker distraction-free YouTube experience.
 */

(function () {
  "use strict";

  const SETTINGS_MAP = {
    extension_enabled: "data-unhook-enabled",
    hide_home_feed: "data-hide-home-feed",
    redirect_to_subscriptions: "data-redirect-to-subscriptions",
    redirect_to_playlist: "data-redirect-to-playlist",
    hide_sidebar: "data-hide-sidebar",
    hide_recommended: "data-hide-recommended",
    hide_live_chat: "data-hide-live-chat",
    hide_playlist: "data-hide-playlist",
    full_width_playlist: "data-full-width-playlist",
    hide_fundraiser: "data-hide-fundraiser",
    hide_transcript_chapters: "data-hide-transcript-chapters",
    hide_endscreen_feed: "data-hide-endscreen-feed",
    hide_endscreen_cards: "data-hide-endscreen-cards",
    hide_comments: "data-hide-comments",
    hide_comment_previews: "data-hide-comment-previews",
    hide_mixes: "data-hide-mixes",
    hide_merch: "data-hide-merch",
    hide_video_info: "data-hide-video-info",
    hide_buttons_bar: "data-hide-buttons-bar",
    hide_channel: "data-hide-channel",
    hide_description: "data-hide-description",
    hide_top_header: "data-hide-top-header",
    hide_notifications: "data-hide-notifications",
    hide_search_bar: "data-hide-search-bar",
    hide_voice_search: "data-hide-voice-search",
    hide_create_button: "data-hide-create-button",
    hide_user_avatar: "data-hide-user-avatar",
    hide_inapt_search_results: "data-hide-inapt-search-results",
    hide_explore_trending: "data-hide-explore-trending",
    hide_more_from_youtube: "data-hide-more-from-youtube",
    hide_shorts: "data-hide-shorts",
    hide_subscriptions: "data-hide-subscriptions",
    disable_autoplay: "data-disable-autoplay",
    disable_annotations: "data-disable-annotations",
  };

  const DEFAULT_SETTINGS = {
    extension_enabled: true,
    hide_home_feed: true,
    redirect_to_subscriptions: false,
    redirect_to_playlist: false,
    custom_playlist_url: "https://www.youtube.com/feed/playlists",
    hide_sidebar: true,
    hide_recommended: true,
    hide_live_chat: true,
    hide_playlist: true,
    full_width_playlist: false,
    hide_fundraiser: true,
    hide_transcript_chapters: true,
    hide_endscreen_feed: true,
    hide_endscreen_cards: true,
    hide_comments: false,
    hide_comment_previews: false,
    hide_mixes: false,
    hide_merch: false,
    hide_video_info: false,
    hide_buttons_bar: false,
    hide_channel: false,
    hide_description: false,
    hide_top_header: false,
    hide_notifications: true,
    hide_search_bar: false,
    hide_voice_search: false,
    hide_create_button: false,
    hide_user_avatar: false,
    hide_inapt_search_results: true,
    hide_explore_trending: false,
    hide_more_from_youtube: true,
    hide_shorts: false,
    hide_subscriptions: false,
    disable_autoplay: true,
    disable_annotations: true,
    playlist_view_mode: "grid",
    custom_css: "",
  };

  let currentSettings = Object.assign({}, DEFAULT_SETTINGS);

  /**
   * Apply settings to the <html> element attributes immediately
   */
  function applyHtmlAttributes(settings) {
    const docEl = document.documentElement;
    if (!docEl) return;

    const isEnabled = settings.extension_enabled !== false;
    docEl.setAttribute("data-unhook-enabled", isEnabled ? "true" : "false");

    if (!isEnabled) {
      removeCustomStyle();
      removePlaylistToolbar();
      return;
    }

    Object.entries(SETTINGS_MAP).forEach(([key, attr]) => {
      if (key === "extension_enabled") return;
      const val = settings[key];
      if (val === true || val === "true") {
        docEl.setAttribute(attr, "true");
      } else {
        docEl.removeAttribute(attr);
      }
    });

    // Set playlist view mode attribute
    const viewMode = settings.playlist_view_mode || "grid";
    docEl.setAttribute("data-playlist-view", viewMode);

    applyCustomCss(settings.custom_css);
    updatePlaylistToolbar(settings);
    setupPlaylistCollapseHandler();
  }

  /**
   * In-Page Playlist Layout Toolbar & Collapse Handler
   */
  function updatePlaylistToolbar(settings) {
    if (!settings.extension_enabled || !settings.full_width_playlist) {
      removePlaylistToolbar();
      return;
    }

    const playlistHeader =
      document.querySelector("ytd-playlist-panel-renderer #header-top-row") ||
      document.querySelector("ytd-playlist-panel-renderer #header-contents") ||
      document.querySelector("ytd-playlist-panel-renderer .header");
    if (!playlistHeader) return;

    let toolbar = document.getElementById("unhook-playlist-toolbar");
    if (!toolbar) {
      toolbar = document.createElement("div");
      toolbar.id = "unhook-playlist-toolbar";
      toolbar.className = "unhook-playlist-toolbar";
      toolbar.innerHTML = `
        <button type="button" class="unhook-toolbar-btn" data-view="grid" title="Cards View">🎴 Cards</button>
        <button type="button" class="unhook-toolbar-btn" data-view="columns" title="Multi-Column View">📑 Columns</button>
        <button type="button" class="unhook-toolbar-btn" data-view="compact_grid" title="Compact View">⊞ Compact</button>
        <button type="button" class="unhook-toolbar-btn" data-view="list" title="List View">☰ List</button>
      `;

      toolbar.querySelectorAll(".unhook-toolbar-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          const targetView = btn.dataset.view;
          if (typeof chrome !== "undefined" && chrome.storage) {
            const storageArea = chrome.storage.sync || chrome.storage.local;
            storageArea.set({ playlist_view_mode: targetView });
          }
          currentSettings.playlist_view_mode = targetView;
          applyHtmlAttributes(currentSettings);
        });
      });

      playlistHeader.appendChild(toolbar);
    }

    const currentView = settings.playlist_view_mode || "grid";
    toolbar.querySelectorAll(".unhook-toolbar-btn").forEach((btn) => {
      if (btn.dataset.view === currentView) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    setupPlaylistCollapseHandler();
  }

  function removePlaylistToolbar() {
    const toolbar = document.getElementById("unhook-playlist-toolbar");
    if (toolbar) toolbar.remove();
  }

  /**
   * Header Click-to-Collapse Handler for Full Width Playlist
   */
  function setupPlaylistCollapseHandler() {
    if (!currentSettings.extension_enabled || !currentSettings.full_width_playlist) return;

    const playlistPanel = document.querySelector("ytd-playlist-panel-renderer");
    if (!playlistPanel) return;

    const header =
      playlistPanel.querySelector("#header-contents") ||
      playlistPanel.querySelector(".header") ||
      playlistPanel.querySelector("#header-top-row");
    if (!header || header.dataset.unhookCollapseBound === "true") return;

    header.dataset.unhookCollapseBound = "true";

    header.addEventListener("click", (e) => {
      // Do not collapse if clicking on view buttons, links, or action buttons (shuffle, loop, menu)
      if (
        e.target.closest("#unhook-playlist-toolbar") ||
        e.target.closest("button:not(#expand-button)") ||
        e.target.closest("a") ||
        e.target.closest("yt-icon-button:not(#expand-button)") ||
        e.target.closest("ytd-menu-renderer")
      ) {
        return;
      }

      const isCollapsed =
        playlistPanel.hasAttribute("collapsed") ||
        playlistPanel.classList.contains("collapsed") ||
        playlistPanel.getAttribute("data-collapsed") === "true";

      if (isCollapsed) {
        playlistPanel.removeAttribute("collapsed");
        playlistPanel.classList.remove("collapsed");
        playlistPanel.setAttribute("data-collapsed", "false");
      } else {
        playlistPanel.setAttribute("collapsed", "");
        playlistPanel.classList.add("collapsed");
        playlistPanel.setAttribute("data-collapsed", "true");
      }

      // Also trigger YouTube's native expand button if present
      const nativeExpandBtn =
        playlistPanel.querySelector("#expand-button") ||
        playlistPanel.querySelector('button[aria-label="Collapse"]') ||
        playlistPanel.querySelector('button[aria-label="Expand"]') ||
        playlistPanel.querySelector('yt-icon-button[aria-label*="ollapse"]') ||
        playlistPanel.querySelector('yt-icon-button[aria-label*="xpand"]');

      if (nativeExpandBtn && !e.target.closest("#expand-button")) {
        try {
          nativeExpandBtn.click();
        } catch (err) {}
      }
    });
  }

  /**
   * Custom CSS Injection
   */
  function applyCustomCss(css) {
    let styleEl = document.getElementById("unhook-custom-style");
    if (!css || !css.trim()) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "unhook-custom-style";
      (document.head || document.documentElement).appendChild(styleEl);
    }
    styleEl.textContent = css;
  }

  function removeCustomStyle() {
    const styleEl = document.getElementById("unhook-custom-style");
    if (styleEl) styleEl.remove();
  }

  /**
   * Handle Navigation & Redirects (SPA friendly)
   */
  function handleNavigation() {
    if (currentSettings.extension_enabled === false) return;

    const path = window.location.pathname;
    const search = window.location.search;

    // 1. Home feed redirect to subscriptions or playlist
    if (path === "/" || path === "/index") {
      if (
        !search ||
        search === "?" ||
        search.startsWith("?pbjreload") ||
        search.startsWith("?app=desktop")
      ) {
        if (currentSettings.redirect_to_subscriptions) {
          window.location.replace("/feed/subscriptions");
          return;
        } else if (currentSettings.redirect_to_playlist) {
          const target =
            currentSettings.custom_playlist_url &&
            currentSettings.custom_playlist_url.trim()
              ? currentSettings.custom_playlist_url.trim()
              : "/feed/playlists";
          window.location.replace(target);
          return;
        }
      }
    }

    // 2. Shorts redirect to standard watch page
    if (currentSettings.hide_shorts && path.startsWith("/shorts/")) {
      const videoId = path.replace("/shorts/", "").split("?")[0].split("/")[0];
      if (videoId) {
        window.location.replace(`/watch?v=${videoId}`);
        return;
      }
    }

    // 3. Autoplay disabling check
    if (currentSettings.disable_autoplay) {
      enforceDisableAutoplay();
    }
  }

  /**
   * Disable Autoplay on player
   */
  function enforceDisableAutoplay() {
    if (
      currentSettings.extension_enabled === false ||
      !currentSettings.disable_autoplay
    )
      return;

    // Try finding the autoplay button in player
    const autoplayBtn = document.querySelector(
      '.ytp-autonav-toggle-button[aria-checked="true"], button[data-tooltip-target-id="ytp-autonav-toggle-button"][aria-checked="true"]',
    );
    if (autoplayBtn) {
      autoplayBtn.click();
    }

    // Try finding YouTube player instance if accessible
    try {
      const player =
        document.getElementById("movie_player") ||
        document.querySelector(".html5-video-player");
      if (player && typeof player.setAutonavState === "function") {
        player.setAutonavState(1); // 1 = off, 2 = on
      }
    } catch (e) {
      // Ignore security isolation
    }
  }

  /**
   * Initialize settings from chrome.storage
   */
  function init() {
    // Apply immediate defaults to eliminate any flash of content
    applyHtmlAttributes(DEFAULT_SETTINGS);

    if (typeof chrome !== "undefined" && chrome.storage) {
      const storageArea = chrome.storage.sync || chrome.storage.local;
      storageArea.get(DEFAULT_SETTINGS, (items) => {
        if (chrome.runtime.lastError) {
          if (chrome.storage.local) {
            chrome.storage.local.get(DEFAULT_SETTINGS, (fallbackItems) => {
              currentSettings = Object.assign(
                {},
                DEFAULT_SETTINGS,
                fallbackItems,
              );
              applyHtmlAttributes(currentSettings);
              handleNavigation();
            });
          }
          return;
        }
        currentSettings = Object.assign({}, DEFAULT_SETTINGS, items);
        applyHtmlAttributes(currentSettings);
        handleNavigation();
      });

      // Listen for runtime storage changes from popup or options
      chrome.storage.onChanged.addListener((changes, areaName) => {
        let changed = false;
        for (const [key, change] of Object.entries(changes)) {
          if (currentSettings[key] !== change.newValue) {
            currentSettings[key] = change.newValue;
            changed = true;
          }
        }
        if (changed) {
          applyHtmlAttributes(currentSettings);
          handleNavigation();
        }
      });
    }

    // Listen to YouTube SPA navigation events
    window.addEventListener("yt-navigate-finish", handleNavigation);
    window.addEventListener("yt-page-data-updated", handleNavigation);
    window.addEventListener("spfdone", handleNavigation);
    window.addEventListener("popstate", handleNavigation);

    // Periodically enforce autoplay check after page load
    document.addEventListener("DOMContentLoaded", () => {
      handleNavigation();
      setTimeout(enforceDisableAutoplay, 1200);
      setTimeout(enforceDisableAutoplay, 3000);
    });

    // Observer for late-rendered elements
    const observer = new MutationObserver(() => {
      if (
        currentSettings.extension_enabled &&
        currentSettings.disable_autoplay
      ) {
        const autoplayActive = document.querySelector(
          '.ytp-autonav-toggle-button[aria-checked="true"]',
        );
        if (autoplayActive) {
          autoplayActive.click();
        }
      }
    });

    // Start observing when body exists
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true });
        }
      });
    }
  }

  init();
})();
