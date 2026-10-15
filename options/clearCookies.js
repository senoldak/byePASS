var ext_api = chrome || browser;

try {
  window.localStorage.clear();
  window.sessionStorage.clear();
} catch (e) {
  console.log(e);
}

var cookie_domain = getCookieDomain(document.domain);

// send domain to background.js (to clear cookies)
ext_api.runtime.sendMessage({
  request: 'clear_cookies_domain',
  data: {
    domain: cookie_domain
  }
});

function getCookieDomain(hostname) {
  let domain = hostname;
  let n = 0;
  let parts = hostname.split('.');
  let str = '_gd' + (new Date()).getTime();
  try {
    while (n < (parts.length - 1) && document.cookie.indexOf(str + '=' + str) == -1) {
      domain = parts.slice(-1 - (++n)).join('.');
      document.cookie = str + "=" + str + ";domain=" + domain + ";";
    }
    document.cookie = str + "=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=" + domain + ";";
  } catch (e) {
    console.log(e);
  }
  return domain;
}

var msg = "Cookies (and local storage) removed from " + cookie_domain;
showMessage(msg, 2400);

function showMessage(msg, duration) {
  var el = document.createElement("div");
  el.setAttribute("style", "position:fixed;bottom:24px;right:24px;z-index:2147483647;padding:12px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:600;color:#f8fafc;background:rgba(15,23,42,0.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.1);border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.4);display:flex;align-items:center;gap:8px;");
  el.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#06b6d4,#8b5cf6);color:#fff;font-size:11px;">✓</span> <span>' + msg + '</span>';
  setTimeout(function () {
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, duration);
  (document.body || document.documentElement).appendChild(el);
}
