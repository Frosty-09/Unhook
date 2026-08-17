const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n--- 1. Manifest V3 Validation ---');
const manifestPath = path.join(rootDir, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

assert(manifest.manifest_version === 3, 'manifest_version is 3');
assert(manifest.name && manifest.name.includes('Unhook'), 'Extension name is Unhook');
assert(manifest.permissions && manifest.permissions.includes('storage'), 'Storage permission declared');

// Check icon files
['16', '32', '48', '128'].forEach(size => {
  const iconRel = manifest.icons[size];
  const iconPath = path.join(rootDir, iconRel);
  assert(fs.existsSync(iconPath), `Icon ${size} exists at ${iconRel}`);
});

// Check popup files
const popupHtml = path.join(rootDir, manifest.action.default_popup);
assert(fs.existsSync(popupHtml), 'Popup HTML exists');
const popupCss = path.join(rootDir, 'popup', 'popup.css');
assert(fs.existsSync(popupCss), 'Popup CSS exists');
const popupJs = path.join(rootDir, 'popup', 'popup.js');
assert(fs.existsSync(popupJs), 'Popup JS exists');

// Check content script files
manifest.content_scripts.forEach(cs => {
  cs.css.forEach(f => {
    assert(fs.existsSync(path.join(rootDir, f)), `Content CSS exists: ${f}`);
  });
  cs.js.forEach(f => {
    assert(fs.existsSync(path.join(rootDir, f)), `Content JS exists: ${f}`);
  });
});

// Check background script
const bgJs = path.join(rootDir, manifest.background.service_worker);
assert(fs.existsSync(bgJs), `Background service worker exists: ${manifest.background.service_worker}`);

// Check options page
const optHtml = path.join(rootDir, manifest.options_ui.page);
assert(fs.existsSync(optHtml), `Options page exists: ${manifest.options_ui.page}`);

console.log('\n--- 2. Settings Schema & Popup Key Verification ---');
const popupContent = fs.readFileSync(popupHtml, 'utf8');
const popupJsContent = fs.readFileSync(popupJs, 'utf8');
const contentJsContent = fs.readFileSync(path.join(rootDir, 'content', 'content.js'), 'utf8');
const contentCssContent = fs.readFileSync(path.join(rootDir, 'content', 'content.css'), 'utf8');

const keysToVerify = [
  'hide_home_feed',
  'redirect_to_subscriptions',
  'redirect_to_playlist',
  'hide_sidebar',
  'hide_recommended',
  'hide_live_chat',
  'hide_playlist',
  'full_width_playlist',
  'hide_fundraiser',
  'hide_transcript_chapters',
  'hide_endscreen_feed',
  'hide_endscreen_cards',
  'hide_comments',
  'hide_mixes',
  'hide_merch',
  'hide_video_info',
  'hide_buttons_bar',
  'hide_channel',
  'hide_description',
  'hide_top_header',
  'hide_notifications',
  'hide_search_bar',
  'hide_voice_search',
  'hide_create_button',
  'hide_user_avatar',
  'hide_inapt_search_results',
  'hide_explore_trending',
  'hide_more_from_youtube',
  'hide_shorts',
  'hide_subscriptions',
  'disable_autoplay',
  'disable_annotations'
];

keysToVerify.forEach(key => {
  assert(popupContent.includes(`data-key="${key}"`), `Popup HTML has data-key="${key}"`);
  assert(popupJsContent.includes(`${key}:`), `Popup JS default settings has key "${key}"`);
  assert(contentJsContent.includes(`${key}:`), `Content JS SETTINGS_MAP has key "${key}"`);
});

console.log('\n--- 3. CSS Attribute & Zero-Flicker Selectors Verification ---');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-home-feed="true"]'), 'CSS contains home feed selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-sidebar="true"]'), 'CSS contains sidebar selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-comments="true"]'), 'CSS contains comments selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-endscreen-feed="true"]'), 'CSS contains endscreen feed selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-endscreen-cards="true"]'), 'CSS contains endscreen cards selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-top-header="true"]'), 'CSS contains top header selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-inapt-search-results="true"]'), 'CSS contains inapt search results selector');
assert(contentCssContent.includes('html[data-unhook-enabled="true"][data-hide-shorts="true"]'), 'CSS contains shorts selector');

console.log('\n--- 4. Code Syntax Validation ---');
try {
  require(popupJs);
} catch (e) {
  // Ignore window/document undefined in node environment if standard browser script
  assert(e.message.includes('window is not defined') || e.message.includes('document is not defined') || e.message.includes('chrome is not defined') || !e, 'Popup JS parsed syntax cleanly');
}

console.log(`\n========================================`);
console.log(`Test Results: ${passedTests} / ${totalTests} Passed`);
console.log(`========================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
