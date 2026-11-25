/**
 * Calm Chess Games - Lightweight Privacy-Friendly Pageview Beacon
 * Sends a single non-blocking beacon on page load so static GitHub Pages
 * visits are recorded in api.calmchessgames.com (MySQL `page_views`).
 * Sets no cookies and skips local/file origins.
 */
(function () {
  'use strict';

  try {
    var host = (window.location.hostname || '').toLowerCase();
    if (
      !host ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      window.location.protocol === 'file:'
    ) {
      return;
    }

    var endpoint = 'https://api.calmchessgames.com/pageview_beacon.php';
    var payload = JSON.stringify({
      path: (window.location.pathname || '/').slice(0, 255),
      title: (document.title || '').slice(0, 160),
      referrer: (document.referrer || '').slice(0, 255),
      screen:
        window.screen && window.screen.width && window.screen.height
          ? window.screen.width + 'x' + window.screen.height
          : ''
    });

    if (typeof navigator.sendBeacon === 'function') {
      var blob = new Blob([payload], { type: 'text/plain;charset=UTF-8' });
      navigator.sendBeacon(endpoint, blob);
    } else if (typeof fetch === 'function') {
      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        keepalive: true,
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: payload
      }).catch(function () {});
    }
  } catch (_) {
    // Analytics must never interrupt page rendering or gameplay
  }
})();
