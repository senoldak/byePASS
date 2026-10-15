/**
 * byePASS - Core Content Script (Safe, Selective and Deep Parsing)
 */

(function () {
  let isEnabled = true;
  let autoBypass = true;
  let whitelist = [];

  // Toast notification helper
  function showToast(message) {
    let toast = document.getElementById('byepass-notification-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'byepass-notification-toast';
      toast.className = 'byepass-toast';
      toast.innerHTML = `
        <span class="byepass-toast-icon">✓</span>
        <span class="byepass-toast-msg"></span>
      `;
      document.body.appendChild(toast);
    }
    toast.querySelector('.byepass-toast-msg').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // Check if current hostname is whitelisted
  function isHostWhitelisted() {
    const currentHost = window.location.hostname;
    return whitelist.some(domain => currentHost.includes(domain));
  }

  // Clean and Unlock DOM safely
  function cleanDOM(isManualTrigger = false) {
    if (isHostWhitelisted()) return;

    let removedCount = 0;
    const currentHost = window.location.hostname;
    const rules = window.BYEPASS_RULES || [];

    // Find site specific or generic rules
    let hasMatchedSpecific = false;
    rules.forEach(rule => {
      if (rule.match.includes('*')) return;
      const isMatch = rule.match.some(m => currentHost.includes(m));
      if (isMatch) {
        hasMatchedSpecific = true;
        applyRule(rule);
      }
    });

    // Only apply generic aggressive rules if explicitly requested or on known paywalled pages
    if (isManualTrigger || hasMatchedSpecific) {
      const genericRule = rules.find(r => r.match.includes('*'));
      if (genericRule && isManualTrigger) {
        applyRule(genericRule);
      }

      // Unlock Body & HTML scrolling
      document.documentElement.classList.add('byepass-unlocked');
      document.body.classList.add('byepass-unlocked');
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    function applyRule(rule) {
      // Execute custom site handler if present (e.g. Bloomberg JSON re-builder)
      if (typeof rule.handler === 'function') {
        try {
          rule.handler();
        } catch (err) {
          console.warn('byePASS: rule handler error', err);
        }
      }

      if (rule.selectorsToRemove) {
        rule.selectorsToRemove.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const tag = el.tagName.toUpperCase();
              if (['BODY', 'HTML', 'MAIN', 'NAV', 'HEADER', 'FOOTER', 'SECTION', 'ARTICLE'].includes(tag)) {
                return;
              }
              if (el.querySelectorAll('p').length > 5) {
                return;
              }
              el.remove();
              removedCount++;
            });
          } catch (e) {}
        });
      }

      if (rule.elementsToRestore) {
        rule.elementsToRestore.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              el.classList.add('byepass-forced-visible');
              el.style.display = 'block';
              el.style.visibility = 'visible';
              el.style.opacity = '1';
              el.style.maxHeight = 'none';
            });
          } catch (e) {}
        });
      }
    }

    if (isManualTrigger) {
      showToast(removedCount > 0 ? `byePASS: ${removedCount} engel temizlendi.` : 'byePASS: Sayfa kilidi açıldı.');
    }
  }

  // Clear LocalStorage and SessionStorage Paywall counters
  function clearSiteStorage() {
    try {
      localStorage.clear();
      sessionStorage.clear();
      showToast('byePASS: Depolama ve sayaçlar sıfırlandı.');
    } catch (e) {
      console.warn('byePASS: Storage clear error:', e);
    }
  }

  // Initialize Settings
  chrome.storage.local.get(['isEnabled', 'autoBypass', 'whitelist'], (result) => {
    isEnabled = result.isEnabled !== false;
    autoBypass = result.autoBypass !== false;
    whitelist = result.whitelist || [];

    if (isEnabled && autoBypass && !isHostWhitelisted()) {
      cleanDOM(false);
      // Run again once DOM is fully ready
      window.addEventListener('load', () => cleanDOM(false));
      setTimeout(() => cleanDOM(false), 1200);
      setTimeout(() => cleanDOM(false), 2500);
    }
  });

  // Listen for Messages from Popup & Background Service Worker
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CLEAN_DOM') {
      cleanDOM(true);
      sendResponse({ status: 'ok' });
    } else if (request.action === 'CLEAR_STORAGE') {
      clearSiteStorage();
      sendResponse({ status: 'ok' });
    } else if (request.action === 'GET_PAGE_STATUS') {
      sendResponse({
        isWhitelisted: isHostWhitelisted(),
        hostname: window.location.hostname,
        url: window.location.href
      });
    }
    return true;
  });
})();
