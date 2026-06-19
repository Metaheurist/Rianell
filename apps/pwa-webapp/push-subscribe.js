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

  async function getRegistration() {
    if (!('serviceWorker' in navigator)) return null;
    return navigator.serviceWorker.ready;
  }

  async function subscribePushNotifications() {
    var vapid = getVapidPublicKey();
    if (!vapid) throw new Error('Push is not configured on this server.');
    if (typeof window !== 'undefined' && window.RianellShared && typeof window.RianellShared.canOfferWebPush === 'function') {
      var settings = {};
      try {
        settings = JSON.parse(localStorage.getItem('rianellSettings') || '{}');
      } catch (e) { /* ignore */ }
      var gate = window.RianellShared.canOfferWebPush(settings, { vapidPublicKey: vapid });
      if (!gate.ok) {
        var reason = gate.reason || 'unavailable';
        if (reason === 'health-consent-required') throw new Error('Health data consent is required before enabling push.');
        if (reason === 'region-unconfigured') throw new Error('Choose your privacy region in Settings first.');
        if (reason === 'local-only') throw new Error('Push is unavailable in local-only mode.');
        throw new Error('Push notifications are not available in your current settings.');
      }
    }
    if (!('Notification' in window)) throw new Error('Notifications are not supported in this browser.');
    var perm = await Notification.requestPermission();
    if (perm !== 'granted') throw new Error('Notification permission denied.');
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
    var reg = await getRegistration();
    if (!reg || !reg.pushManager) return;
    var sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    try { localStorage.removeItem(SUB_KEY); } catch (e) {}
  }

  window.RianellPushSubscribe = {
    subscribe: subscribePushNotifications,
    unsubscribe: unsubscribePushNotifications,
    getVapidPublicKey: getVapidPublicKey,
  };
})();
