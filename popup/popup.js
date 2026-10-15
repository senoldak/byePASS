/**
 * byePASS - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const siteDomainEl = document.getElementById('siteDomain');
  const siteStatusEl = document.getElementById('siteStatus');
  const btnCleanDOM = document.getElementById('btnCleanDOM');
  const btnClearStorage = document.getElementById('btnClearStorage');
  const btnOptions = document.getElementById('btnOptions');
  const toggleAuto = document.getElementById('toggleAuto');
  const statusMessage = document.getElementById('statusMessage');

  // Archive buttons
  const btnArchiveToday = document.getElementById('btnArchiveToday');
  const btn12ft = document.getElementById('btn12ft');
  const btnWayback = document.getElementById('btnWayback');
  const btnFreedium = document.getElementById('btnFreedium');

  let currentTab = null;

  function setMessage(msg, duration = 3000) {
    statusMessage.textContent = msg;
    if (duration > 0) {
      setTimeout(() => {
        statusMessage.textContent = 'byePASS hazır';
      }, duration);
    }
  }

  // Get Active Tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
      currentTab = tabs[0];
      const url = new URL(currentTab.url);
      
      if (url.protocol.startsWith('http')) {
        siteDomainEl.textContent = url.hostname;
      } else {
        siteDomainEl.textContent = 'Özel Sayfa (Chrome)';
        siteStatusEl.querySelector('.text').textContent = 'Devre Dışı';
        siteStatusEl.style.color = '#94a3b8';
      }
    }
  } catch (err) {
    siteDomainEl.textContent = 'Bilinmeyen Sayfa';
  }

  // Load Settings
  chrome.storage.local.get(['autoBypass'], (res) => {
    toggleAuto.checked = res.autoBypass !== false;
  });

  // Toggle Auto Protection
  toggleAuto.addEventListener('change', () => {
    chrome.storage.local.set({ autoBypass: toggleAuto.checked });
    setMessage(toggleAuto.checked ? 'Otomatik koruma aktif' : 'Otomatik koruma kapatıldı');
  });

  // Clean DOM Action
  btnCleanDOM.addEventListener('click', async () => {
    if (!currentTab?.id) return;
    setMessage('Sayfa temizleniyor...');
    
    try {
      await chrome.tabs.sendMessage(currentTab.id, { action: 'CLEAN_DOM' });
      setMessage('Engeller ve kilitler temizlendi! ✨');
    } catch (err) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content/rules.js', 'content/content.js']
        });
        await chrome.tabs.sendMessage(currentTab.id, { action: 'CLEAN_DOM' });
        setMessage('Engeller temizlendi! ✨');
      } catch (e) {
        setMessage('Bu sayfada script çalıştırılamıyor.');
      }
    }
  });

  // Clear Cookies & Storage Action
  btnClearStorage.addEventListener('click', async () => {
    if (!currentTab?.id || !currentTab.url) return;
    setMessage('Çerezler ve sayaçlar sıfırlanıyor...');

    chrome.runtime.sendMessage({ action: 'CLEAR_COOKIES_FOR_DOMAIN', url: currentTab.url }, (res) => {
      chrome.tabs.sendMessage(currentTab.id, { action: 'CLEAR_STORAGE' });
      setMessage(`Sıfırlandı (${res?.count || 0} çerez silindi)`);
    });
  });

  // Archive & Mirror Buttons
  btnArchiveToday.addEventListener('click', () => {
    if (!currentTab?.url) return;
    chrome.tabs.create({ url: `https://archive.today/newest/${encodeURIComponent(currentTab.url)}` });
  });

  btn12ft.addEventListener('click', () => {
    if (!currentTab?.url) return;
    chrome.tabs.create({ url: `https://12ft.io/${currentTab.url}` });
  });

  btnWayback.addEventListener('click', () => {
    if (!currentTab?.url) return;
    chrome.tabs.create({ url: `https://web.archive.org/web/${currentTab.url}` });
  });

  btnFreedium.addEventListener('click', () => {
    if (!currentTab?.url) return;
    chrome.tabs.create({ url: `https://freedium.cfd/${currentTab.url}` });
  });

  // Open Options Page
  btnOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});
