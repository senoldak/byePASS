/**
 * byePASS - Background Service Worker
 * Handles Context Menus, Archive Mirrors and Storage
 */

// Set up Context Menus on Install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    // Parent Context Menu
    chrome.contextMenus.create({
      id: "byepass_root",
      title: "⚡ byePASS - Paywall Çözücü",
      contexts: ["page", "link"]
    });

    // Submenu Actions
    chrome.contextMenus.create({
      parentId: "byepass_root",
      id: "byepass_clean_dom",
      title: "🧹 Sayfa Kilidini Aç & Paywall Temizle",
      contexts: ["page"]
    });

    chrome.contextMenus.create({
      parentId: "byepass_root",
      id: "byepass_archive_today",
      title: "🏛️ Archive.today ile Aç",
      contexts: ["page", "link"]
    });

    chrome.contextMenus.create({
      parentId: "byepass_root",
      id: "byepass_12ft",
      title: "🪜 12ft.io (Ladder) ile Aç",
      contexts: ["page", "link"]
    });

    chrome.contextMenus.create({
      parentId: "byepass_root",
      id: "byepass_wayback",
      title: "⏳ Wayback Machine ile Aç",
      contexts: ["page", "link"]
    });

    chrome.contextMenus.create({
      parentId: "byepass_root",
      id: "byepass_freedium",
      title: "📖 Freedium ile Aç (Medium)",
      contexts: ["page", "link"]
    });
  });

  // Clear any leftover dynamic rules from previous versions
  chrome.declarativeNetRequest?.getDynamicRules((rules) => {
    if (rules && rules.length > 0) {
      chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: rules.map(r => r.id)
      });
    }
  });

  // Default Storage
  chrome.storage.local.get(['isEnabled', 'autoBypass', 'whitelist'], (res) => {
    if (res.isEnabled === undefined) chrome.storage.local.set({ isEnabled: true });
    if (res.autoBypass === undefined) chrome.storage.local.set({ autoBypass: true });
    if (!res.whitelist) chrome.storage.local.set({ whitelist: [] });
  });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const targetUrl = info.linkUrl || info.pageUrl || tab?.url;
  if (!targetUrl) return;

  switch (info.menuItemId) {
    case "byepass_clean_dom":
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { action: "CLEAN_DOM" });
      }
      break;

    case "byepass_archive_today":
      chrome.tabs.create({ url: `https://archive.today/newest/${encodeURIComponent(targetUrl)}` });
      break;

    case "byepass_12ft":
      chrome.tabs.create({ url: `https://12ft.io/${targetUrl}` });
      break;

    case "byepass_wayback":
      chrome.tabs.create({ url: `https://web.archive.org/web/${targetUrl}` });
      break;

    case "byepass_freedium":
      chrome.tabs.create({ url: `https://freedium.cfd/${targetUrl}` });
      break;
  }
});

// Clear Cookies for active domain
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CLEAR_COOKIES_FOR_DOMAIN") {
    const { url } = request;
    if (!url) {
      sendResponse({ status: "error", message: "No URL provided" });
      return true;
    }

    try {
      const parsed = new URL(url);
      chrome.cookies.getAll({ domain: parsed.hostname }, (cookies) => {
        if (cookies) {
          cookies.forEach(cookie => {
            const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
            chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
          });
        }
        sendResponse({ status: "ok", count: cookies?.length || 0 });
      });
    } catch (err) {
      sendResponse({ status: "error", message: err.message });
    }
    return true;
  }
});
