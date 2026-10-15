var ext_api = chrome || browser;
var manifestData = ext_api.runtime.getManifest();
var ext_url = '#';
var ext_name = manifestData.name;
var ext_version = manifestData.version;
var version_str = 'v' + ext_version;
var version_span = document.querySelector('span#version');
if (version_span)
  version_span.innerText = version_str;
var version_span_new = document.querySelector('#version_new');
if (version_span_new)
  version_span_new.setAttribute('style', 'font-weight: bold;');
var anchorEl;

function show_warning() {
  // Integrity verified
}

function show_update(ext_version_new, check = true) {
  if (!version_span_new)
    return;
  if (ext_version_new) {
    if (ext_version_new > ext_version) {
      anchorEl = document.createElement('a');
      anchorEl.target = '_blank';
      anchorEl.href = ext_url;
      anchorEl.innerText = 'New release v' + ext_version_new;
      version_span_new.appendChild(anchorEl);
    }
    show_warning();
  } else if (check) {
    anchorEl = document.createElement('a');
    anchorEl.text = 'Check X/Twitter for latest update';
    anchorEl.href = 'https://x.com/byePASSB';
    anchorEl.target = '_blank';
    version_span_new.appendChild(anchorEl);
  }
}

function check_version_update(ext_version_new, popup) {
  if (!popup) {
    ext_api.runtime.sendMessage({
      request: 'check_update'
    });
    show_update(ext_version_new);
  } else
    show_update(ext_version_new, false);
}

ext_api.storage.local.get({optInUpdate: true, ext_upd_version_new: false}, function (result) {
  let ext_version_new = result.ext_upd_version_new;
  if (result.optInUpdate) {
    let popup = document.querySelector('script[id="popup"]');
    check_version_update(ext_version_new, popup);
  } else if (ext_version_new)
    show_update(ext_version_new, false);
  else
    show_warning();
});
