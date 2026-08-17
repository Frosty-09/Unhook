# Unhook - Remove YouTube Recommended & Distractions

A lightweight, distraction-free Chrome extension (Manifest V3) that gives you complete control over your YouTube experience. Turn off homepage recommendations, sidebar suggestions, comments, shorts, end screens, and more.

![Unhook Logo](icons/logo.svg)

---

## ✨ Features & Controls

### 🏠 1. Home Feed

- **Hide Home Feed**: Cleans the YouTube homepage completely, removing algorithmic recommendations.
- **Redirect to Subscriptions**: Automatically routes you straight to `youtube.com/feed/subscriptions` when opening YouTube.
- **Redirect to Playlist**: Automatically routes you straight to your YouTube Playlists (`youtube.com/feed/playlists`) or a custom playlist URL when opening YouTube.

### 🎬 2. Video Sidebar

- **Hide Video Sidebar**: Hides the entire right-side column beside the video player.
- **Hide Recommended**: Selectively hides related/recommended video suggestions.
- **Hide Live Chat**: Hides live chat streams and replay boxes.
- **Hide Playlist**: Hides playlist drawer and next video queues.
- **Hide Fundraiser**: Removes donation and fundraiser shelves.
- **Hide Transcript & Chapters**: Hides video transcripts and timestamp markers.

### ⏹️ 3. End Screens & Overlays

- **Hide End Screen Feed**: Disables the grid videowall appearing at the end of video playback.
- **Hide End Screen Cards**: Hides interactive cards, avatars, and floating prompts inside the video player.

### 💬 4. Comments & Mixes

- **Hide Comments**: Removes comments and comment entry points entirely.
- **Hide Comment Previews**: Hides comment teaser bubbles.
- **Hide Mixes**: Removes infinite radio playlist mixes from search results and feeds.
- **Hide Merch, Tickets & Offers**: Removes shopping drawers and affiliate shelves.

### ℹ️ 5. Video Metadata & Top Header

- **Hide Video Info**: Hides title metadata, description, buttons, and owner details.
- **Hide Video Buttons Bar**: Hides Like, Dislike, Share, Clip, Thanks, and Download buttons.
- **Hide Channel**: Removes channel avatar, name, and Subscribe button.
- **Hide Video Description**: Removes expandable video description text.
- **Hide Top Header**: Removes the entire YouTube top masthead navigation bar.
- **Hide Notifications**: Hides the notification bell.
- **Hide Search Bar / Voice Search**: Hides search bar and voice input button.
- **Hide Create Button**: Hides the '+' video upload button.
- **Hide User Avatar**: Hides your profile picture in the top right.

### 🔍 6. Feeds & Playback

- **Hide Inapt Search Results**: Eliminates clutter like "People also watched", "For you", "Related to your search", and "Previously watched".
- **Hide Explore & Trending**: Hides trending, gaming, music, news, and podcast categories.
- **Hide More from YouTube**: Removes YouTube Premium, Studio, and Kids promotional links.
- **Hide Shorts Tab**: Hides Shorts shelf from home/search and the sidebar navigation.
- **Hide Subscriptions**: Hides Subscriptions guide from navigation.
- **Disable Autoplay**: Prevents YouTube from auto-advancing to the next video.
- **Disable Annotations**: Hides interactive in-video annotations and cards.

---

## ⚡ Zero-Flicker Architecture

Unhook uses early `document_start` root attribute injection (`html[data-unhook-enabled="true"]...`) coupled with direct CSS rules. Elements are hidden **before** the browser renders or paints them, eliminating flashes of unwanted content.

Changes made in the popup or options page sync instantly across all open YouTube tabs via `chrome.storage.onChanged` with **0 latency**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut                                         | Action                            |
| :----------------------------------------------- | :-------------------------------- |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>U</kbd> | Toggle Unhook Master Power On/Off |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>H</kbd> | Toggle YouTube Home Feed          |
| <kbd>Alt</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> | Toggle Video Sidebar              |

_(Shortcuts can be customized in `chrome://extensions/shortcuts`)_

---

## 🚀 How to Install / Load in Chrome

1. Open **Google Chrome** (or Brave / Edge / Opera).
2. Navigate to `chrome://extensions/` in the address bar.
3. Enable **Developer mode** toggle in the top-right corner.
4. Click the **Load unpacked** button.
5. Select this folder (`Unhook/`).
6. Pin the **Unhook** icon in your browser toolbar!

---

## 🛠️ Settings & Backup

- Open the popup and click **Support** or right-click the extension icon and choose **Options**.
- **Backup & Restore**: Export all settings to a `unhook-settings.json` file, or import configuration from another device.
- **Custom CSS**: Inject your own custom CSS rules to further customize YouTube.
