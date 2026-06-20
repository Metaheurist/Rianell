/**
 * Web Push opt-in (user gesture required). VAPID public key from window.RIANELL_VAPID_PUBLIC_KEY.
 */
(function () {
  'use strict';

  var SUB_KEY = 'rianell.push.subscription';

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var out = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
    return out;
  }

  function getVapidPublicKey() {
    if (typeof window !== 'undefined' && window.RIANELL_VAPID_PUBLIC_KEY) {
      return String(window.RIANELL_VAPID_PUBLIC_KEY).trim();
    }
    return '';
  }

  function getPushPrefs() {
    if (typeof window !== 'undefined' && window.appSettings && typeof window.appSettings === 'object') {
      return window.appSettings;
    }
    try {
      return JSON.parse(localStorage.getItem('rianellSettings') || '{}');
    } catch (e) {
      return {};
    }
  }

  function isConfiguredVapid(vapid) {
    if (window.RianellShared && typeof window.RianellShared.isConfiguredVapidPublicKey === 'function') {
      return window.RianellShared.isConfiguredVapidPublicKey(vapid);
    }
    var key = String(vapid || '').trim();
    return key.length > 0 && key !== 'YOUR_VAPID_PUBLIC_KEY';
  }

  function assertCanOfferWebPush(settings, vapid) {
    if (!isConfiguredVapid(vapid)) throw new Error('Push is not configured on this server.');
    if (window.RianellShared && typeof window.RianellShared.canOfferWebPush === 'function') {
      var gate = window.RianellShared.canOfferWebPush(settings, { vapidPublicKey: vapid });
      if (!gate.ok) {
        var reason = gate.reason || 'unavailable';
        if (reason === 'health-consent-required') throw new Error('Health data consent is required before enabling push.');
        if (reason === 'region-unconfigured') throw new Error('Choose your privacy region in Settings first.');
        if (reason === 'local-only') throw new Error('Push is unavailable in local-only mode.');
        throw new Error('Push notifications are not available in your current settings.');
      }
      return;
    }
    if (!isConfiguredVapid(vapid)) throw new Error('Push is not configured on this server.');
  }

  async function ensureNotificationPermission(skipPermissionRequest) {
    if (!('Notification' in window)) throw new Error('Notifications are not supported in this browser.');
    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked. Allow them in your browser settings, then try again.');
    }
    if (skipPermissionRequest) {
      if (Notification.permission !== 'granted') throw new Error('Notification permission not granted.');
      return;
    }
    if (Notification.permission === 'granted') return;
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notification permission denied.');
  }

  async function getRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    if (window.__rianellSwRegistration) return window.__rianellSwRegistration;
    var regs = await navigator.serviceWorker.getRegistrations();
    if (!regs.length) {
      throw new Error('Service worker is not active on this host. Install the web app or open with ?sw=1 to enable push.');
    }
    return Promise.race([
      navigator.serviceWorker.ready,
      new Promise(function (_resolve, reject) {
        setTimeout(function () {
          reject(new Error('Service worker is still starting. Try again in a moment.'));
        }, 10000);
      }),
    ]);
  }

  async function subscribePushNotifications(opts) {
    opts = opts || {};
    var vapid = getVapidPublicKey();
    var settings = getPushPrefs();
    assertCanOfferWebPush(settings, vapid);
    await ensureNotificationPermission(!!opts.skipPermissionRequest);
    var reg = await getRegistration();
    if (!reg || !reg.pushManager) throw new Error('Push manager unavailable.');
    var sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid),
    });
    try {
      localStorage.setItem(SUB_KEY, JSON.stringify(sub.toJSON()));
    } catch (e) {}
    if (typeof window.registerPushSubscription === 'function') {
      await window.registerPushSubscription(sub.toJSON());
    }
    return sub;
  }

  async function unsubscribePushNotifications() {
    try {
      var reg = await getRegistration();
      if (!reg || !reg.pushManager) return;
      var sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
    } catch (e) { /* ignore */ }
    try { localStorage.removeItem(SUB_KEY); } catch (e) {}
  }

  window.RianellPushSubscribe = {
    subscribe: subscribePushNotifications,
    unsubscribe: unsubscribePushNotifications,
    getVapidPublicKey: getVapidPublicKey,
  };
})();
