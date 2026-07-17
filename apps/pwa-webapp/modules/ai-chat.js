/**
 * Ephemeral on-device health chat panel (Home discovery + AI Q&A).
 * State lives in module scope only - cleared on close and beforeunload.
 */
(function (global) {
  'use strict';

  var PANEL_ID = 'aiHealthChatPanel';
  var OVERLAY_ID = 'aiHealthChatOverlay';
  var CLOSE_MS = 300;
  var _open = false;
  var _turns = [];
  var _baseContext = '';
  var _analysis = null;
  var _escapeHandler = null;
  var _focusTrapHandler = null;
  var _beforeUnloadHandler = null;
  var _sendInFlight = false;
  var _requestGen = 0;
  var _claimedModalActive = false;
  var _forceGeneric = false;
  var _openerEl = null;
  var _closeTimer = null;
  var _closing = false;

  function t(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return key;
  }

  function tOr(key, fallback, params) {
    if (typeof global.tUiOr === 'function') return global.tUiOr(key, fallback, params);
    var v = t(key, params);
    return v === key ? fallback : v;
  }

  function escapeHTML(s) {
    if (typeof global.escapeHTML === 'function') return global.escapeHTML(s);
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    if (typeof global.escapeAttr === 'function') return global.escapeAttr(s);
    return escapeHTML(s);
  }

  function svgIcon(name, cls) {
    if (typeof global.svgIcon === 'function') return global.svgIcon(name, cls || 'ui-svg-icon');
    return '';
  }

  function getShared() {
    return global.RianellShared || null;
  }

  function getLogs() {
    return global.logs && Array.isArray(global.logs) ? global.logs : [];
  }

  function getGoals() {
    if (global.appSettings && global.appSettings.goals) return global.appSettings.goals;
    return null;
  }

  function prefersReducedMotion() {
    try {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) {
      return false;
    }
  }

  function getMaxTurns() {
    var S = getShared();
    if (S && S.MAX_HEALTH_CHAT_TURNS) return S.MAX_HEALTH_CHAT_TURNS;
    return 5;
  }

  function canSendTurn() {
    var S = getShared();
    if (S && typeof S.canSendHealthChatTurn === 'function') {
      return S.canSendHealthChatTurn(_turns.length);
    }
    return _turns.length < getMaxTurns();
  }

  function buildContext() {
    var S = getShared();
    var logArr = getLogs();
    var snap = _analysis;
    if (!snap && S && typeof S.computeHomeAnalysisSnapshot === 'function') {
      snap = S.computeHomeAnalysisSnapshot(logArr);
    }
    if (S && typeof S.buildChatContext === 'function') {
      return S.buildChatContext({
        analysis: snap || {},
        logs: logArr,
        goals: getGoals(),
        settings: global.appSettings || {},
      });
    }
    return '';
  }

  function buildFallback(userMessage) {
    var S = getShared();
    var snap = _analysis;
    if (!snap && S && typeof S.computeHomeAnalysisSnapshot === 'function') {
      snap = S.computeHomeAnalysisSnapshot(getLogs());
    }
    if (S && typeof S.buildHealthChatFallback === 'function') {
      return S.buildHealthChatFallback(snap || {}, userMessage, getLogs());
    }
    return 'Keep logging daily - patterns become clearer with more entries.';
  }

  function getFocusable(panel) {
    if (!panel) return [];
    var sel = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.prototype.slice.call(panel.querySelectorAll(sel)).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
  }

  function bindFocusTrap() {
    unbindFocusTrap();
    _focusTrapHandler = function (e) {
      if (!_open || e.key !== 'Tab') return;
      var panel = document.getElementById(PANEL_ID);
      var list = getFocusable(panel);
      if (!list.length) return;
      var first = list[0];
      var last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !panel.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !panel.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', _focusTrapHandler, true);
  }

  function unbindFocusTrap() {
    if (_focusTrapHandler) {
      document.removeEventListener('keydown', _focusTrapHandler, true);
      _focusTrapHandler = null;
    }
  }

  function ensureDom() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'ai-chat-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div id="' + PANEL_ID + '" class="ai-chat-panel" role="dialog" aria-modal="true" aria-labelledby="aiChatTitle" tabindex="-1">' +
      '  <div class="ai-chat-drag-handle" aria-hidden="true"></div>' +
      '  <header class="ai-chat-header">' +
      '    <div class="ai-chat-header-main">' +
      '      <span class="ai-chat-glyph" aria-hidden="true">' + svgIcon('brain-wave', 'ai-chat-glyph-svg') + '</span>' +
      '      <div><h2 id="aiChatTitle" class="ai-chat-title"></h2><p class="ai-chat-trust"></p></div>' +
      '    </div>' +
      '    <button type="button" class="ai-chat-close modal-close" aria-label="">&times;</button>' +
      '  </header>' +
      '  <div class="ai-chat-messages" id="aiChatMessages" aria-live="polite"></div>' +
      '  <div class="ai-chat-followups" id="aiChatFollowups" hidden></div>' +
      '  <footer class="ai-chat-footer">' +
      '    <p class="ai-chat-turns" id="aiChatTurns"></p>' +
      '    <form class="ai-chat-form" id="aiChatForm">' +
      '      <label class="visually-hidden" for="aiChatInput"></label>' +
      '      <textarea id="aiChatInput" class="ai-chat-input" rows="2" autocomplete="off"></textarea>' +
      '      <button type="submit" class="action-btn ai-chat-send" id="aiChatSend"></button>' +
      '    </form>' +
      '    <p class="ai-chat-disclaimer" id="aiChatDisclaimer"></p>' +
      '  </footer>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeAiHealthChat();
    });
    var panel = overlay.querySelector('#' + PANEL_ID);
    if (panel) {
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
    }
    var closeBtn = overlay.querySelector('.ai-chat-close');
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', t('common.close'));
      closeBtn.addEventListener('click', closeAiHealthChat);
    }
    var form = overlay.querySelector('#aiChatForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        submitUserMessage();
      });
    }
    return overlay;
  }

  function localizeChrome() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    var title = overlay.querySelector('#aiChatTitle');
    if (title) title.textContent = t('home.chat.title');
    var trust = overlay.querySelector('.ai-chat-trust');
    if (trust) {
      trust.textContent = _forceGeneric
        ? tOr('home.chat.trustBadge.generic', 'Guided tips · no on-device model on this device')
        : t('home.chat.trustBadge');
    }
    var input = overlay.querySelector('#aiChatInput');
    if (input) {
      input.placeholder = t('ai.weekChat.placeholder');
      var label = overlay.querySelector('label[for="aiChatInput"]');
      if (label) {
        label.textContent = tOr('home.chat.inputLabel', 'Ask about your health logs');
      }
    }
    var send = overlay.querySelector('#aiChatSend');
    if (send) send.textContent = t('ai.weekChat.send');
    var disc = overlay.querySelector('#aiChatDisclaimer');
    if (disc) disc.textContent = t('home.chat.disclaimer');
    var closeBtn = overlay.querySelector('.ai-chat-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', t('common.close'));
    updateTurnsLabel();
  }

  function updateTurnsLabel() {
    var el = document.getElementById('aiChatTurns');
    if (!el) return;
    var max = getMaxTurns();
    var used = _turns.length;
    if (!canSendTurn()) {
      el.textContent = t('ai.weekChat.limitReached');
      el.removeAttribute('aria-label');
      return;
    }
    el.textContent = used + '/' + max;
    el.setAttribute('aria-label', t('ai.weekChat.turnsLeft', { left: String(max - used) }));
  }

  function setInputEnabled(enabled) {
    var input = document.getElementById('aiChatInput');
    var send = document.getElementById('aiChatSend');
    var form = document.getElementById('aiChatForm');
    if (input) input.disabled = !enabled;
    if (send) send.disabled = !enabled;
    if (form) form.classList.toggle('ai-chat-form--disabled', !enabled);
  }

  function scrollMessagesToEnd() {
    var box = document.getElementById('aiChatMessages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function renderEmptyState() {
    return (
      '<div class="ai-chat-empty" id="aiChatEmpty">' +
      '<p class="ai-chat-empty__title">' + escapeHTML(tOr('home.chat.emptyTitle', 'Ask about your logs')) + '</p>' +
      '<p class="ai-chat-empty__body">' + escapeHTML(tOr('home.chat.emptyBody', 'Sleep, mood, and patterns from your recent entries - wellness tips only.')) + '</p>' +
      '</div>'
    );
  }

  function renderMessages() {
    var box = document.getElementById('aiChatMessages');
    if (!box) return;
    var html = '';
    if (!_turns.length && !_sendInFlight) {
      html = renderEmptyState();
    }
    _turns.forEach(function (turn, idx) {
      var delayUser = Math.min(idx * 40, 160);
      html += '<div class="ai-chat-bubble ai-chat-bubble--user ai-chat-bubble--enter" style="--bubble-delay:' + delayUser + 'ms"><p>' + escapeHTML(turn.user) + '</p></div>';
      if (turn.assistant) {
        var isLast = idx === _turns.length - 1 && !_sendInFlight;
        html += '<div class="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--enter' +
          (isLast ? ' ai-chat-bubble--fresh' : '') +
          '" style="--bubble-delay:' + (delayUser + 50) + 'ms"><p>' + escapeHTML(turn.assistant) + '</p></div>';
      }
    });
    if (_sendInFlight) {
      html += '<div class="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--typing" aria-busy="true">' +
        '<span class="visually-hidden">' + escapeHTML(t('ai.weekChat.loading')) + '</span>' +
        '<span class="ai-chat-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>' +
        '</div>';
    }
    box.innerHTML = html;
    scrollMessagesToEnd();
  }

  function renderFollowups(suggestions) {
    var wrap = document.getElementById('aiChatFollowups');
    if (!wrap) return;
    if (!suggestions || !suggestions.length || _sendInFlight) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      wrap.classList.remove('ai-chat-followups--visible');
      return;
    }
    wrap.hidden = false;
    wrap.classList.add('ai-chat-followups--visible');
    wrap.innerHTML = suggestions.map(function (s, i) {
      return '<button type="button" class="ai-chat-followup-chip" style="--chip-delay:' + (i * 45) + 'ms" data-followup="' + escapeAttr(s) + '">' +
        escapeHTML(s) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-followup]').forEach(function (btn) {
      btn.onclick = function () {
        if (!canSendTurn() || _sendInFlight) return;
        var msg = btn.getAttribute('data-followup') || '';
        var input = document.getElementById('aiChatInput');
        if (input) input.value = msg;
        submitUserMessage();
      };
    });
  }

  function defaultFollowups() {
    return [
      t('home.chat.followup.sleep'),
      t('home.chat.followup.mood'),
      t('home.chat.followup.patterns'),
    ];
  }

  function contextualFollowups() {
    var out = defaultFollowups().slice();
    var chips = global._homeAiSuggestionChips;
    if (Array.isArray(chips)) {
      chips.slice(0, 2).forEach(function (chip) {
        if (!chip || !chip.labelKey) return;
        var label = t(chip.labelKey, chip.labelParams || {});
        if (label && label !== chip.labelKey && out.indexOf(label) === -1) out.push(label);
      });
    }
    return out.slice(0, 5);
  }

  function assemblePayload(userMessage) {
    var S = getShared();
    var history = '';
    if (S && typeof S.formatHealthChatHistory === 'function') {
      history = S.formatHealthChatHistory(_turns);
    }
    if (S && typeof S.buildHealthChatUserPayload === 'function') {
      return S.buildHealthChatUserPayload({
        baseContext: _baseContext,
        history: history,
        userMessage: userMessage,
      });
    }
    return userMessage;
  }

  async function runInference(userMessage) {
    var fallback = buildFallback(userMessage);
    if (_forceGeneric) return fallback;
    var payload = assemblePayload(userMessage);
    var fn = global.generateHealthChatWithLLM || global.generateWeekChatWithLLM;
    if (typeof fn !== 'function') return fallback;
    var gov = global.RianellMainThreadGovernor;
    if (gov && typeof gov.waitForHeavyWorkSlot === 'function') {
      await gov.waitForHeavyWorkSlot({ maxWaitMs: 60000 });
    }
    try {
      var modelStatus = typeof global.getAiModelStatus === 'function' ? global.getAiModelStatus() : null;
      var ready = modelStatus && modelStatus.state === 'ready';
      if (!ready) return fallback;
      return await fn(payload, fallback);
    } catch (_) {
      return fallback;
    }
  }

  async function submitUserMessage() {
    if (_sendInFlight || !canSendTurn()) return;
    var input = document.getElementById('aiChatInput');
    if (!input) return;
    var message = String(input.value || '').trim();
    if (!message) return;
    input.value = '';
    _sendInFlight = true;
    _requestGen += 1;
    var gen = _requestGen;
    _turns.push({ user: message, assistant: '' });
    renderMessages();
    renderFollowups(null);
    setInputEnabled(false);
    updateTurnsLabel();
    var answer = await runInference(message);
    if (gen !== _requestGen || !_open) {
      _sendInFlight = false;
      return;
    }
    if (_turns.length) _turns[_turns.length - 1].assistant = answer || buildFallback(message);
    _sendInFlight = false;
    renderMessages();
    setInputEnabled(canSendTurn());
    updateTurnsLabel();
    if (canSendTurn()) {
      renderFollowups(contextualFollowups());
      var inp = document.getElementById('aiChatInput');
      if (inp) inp.focus();
    } else {
      renderLimitRecovery();
    }
  }

  function renderLimitRecovery() {
    var wrap = document.getElementById('aiChatFollowups');
    if (!wrap) return;
    wrap.hidden = false;
    wrap.classList.add('ai-chat-followups--visible');
    wrap.innerHTML =
      '<p class="ai-chat-recovery" role="status">' +
      escapeHTML(t('ai.weekChat.limitReached')) +
      ' ' +
      escapeHTML(tOr('home.chat.emptyBody', 'Sleep, mood, and patterns from your recent entries - wellness tips only.')) +
      '</p>';
  }

  function bindLifecycle() {
    if (!_escapeHandler) {
      _escapeHandler = function (e) {
        if (e.key === 'Escape' && _open) closeAiHealthChat();
      };
      document.addEventListener('keydown', _escapeHandler);
    }
    if (!_beforeUnloadHandler) {
      _beforeUnloadHandler = function () { wipeState(); };
      global.addEventListener('beforeunload', _beforeUnloadHandler);
    }
    bindFocusTrap();
  }

  function unbindLifecycle() {
    if (_escapeHandler) {
      document.removeEventListener('keydown', _escapeHandler);
      _escapeHandler = null;
    }
    unbindFocusTrap();
  }

  function wipeState() {
    _requestGen += 1;
    _sendInFlight = false;
    _forceGeneric = false;
    _turns = [];
    _baseContext = '';
    _analysis = null;
    var box = document.getElementById('aiChatMessages');
    if (box) box.innerHTML = '';
    var follow = document.getElementById('aiChatFollowups');
    if (follow) { follow.innerHTML = ''; follow.hidden = true; follow.classList.remove('ai-chat-followups--visible'); }
    var input = document.getElementById('aiChatInput');
    if (input) input.value = '';
  }

  function finishHideOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      if ('inert' in overlay) overlay.inert = true;
      overlay.classList.remove('ai-chat-overlay--open', 'ai-chat-overlay--generic');
    }
    _closing = false;
  }

  function hideOverlayDom(animated) {
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    if (_closeTimer) {
      clearTimeout(_closeTimer);
      _closeTimer = null;
    }
    overlay.classList.remove('ai-chat-overlay--open');
    if (!animated || prefersReducedMotion() || overlay.hidden) {
      finishHideOverlay();
      return;
    }
    _closing = true;
    var done = false;
    function complete() {
      if (done) return;
      done = true;
      if (_closeTimer) {
        clearTimeout(_closeTimer);
        _closeTimer = null;
      }
      overlay.removeEventListener('transitionend', onEnd);
      finishHideOverlay();
    }
    function onEnd(e) {
      if (e.target !== overlay && e.target !== document.getElementById(PANEL_ID)) return;
      complete();
    }
    overlay.addEventListener('transitionend', onEnd);
    _closeTimer = setTimeout(complete, CLOSE_MS);
  }

  function releaseBodyScrollLock() {
    document.body.classList.remove('ai-chat-open');
    if (_claimedModalActive) {
      document.body.classList.remove('modal-active');
      _claimedModalActive = false;
    }
  }

  function openAiHealthChat(options) {
    options = options || {};
    if (_closing) {
      if (_closeTimer) { clearTimeout(_closeTimer); _closeTimer = null; }
      finishHideOverlay();
    }
    if (!options.skipGate && typeof global.gateAiHealthChatOpen === 'function') {
      var gate = global.gateAiHealthChatOpen(options);
      if (!gate || gate.allow === false) return;
      if (gate.forceGeneric) options.forceGeneric = true;
    }
    var simpleOff = global.appSettings && global.appSettings.simpleMode === true;
    if (simpleOff) return;
    var aiOn = !global.appSettings || global.appSettings.aiEnabled !== false;
    if (!aiOn && !options.forceGeneric) return;

    var active = document.activeElement;
    if (active && active !== document.body) _openerEl = active;

    ensureDom();
    bindLifecycle();
    _open = true;
    _forceGeneric = !!options.forceGeneric;
    var S = getShared();
    _analysis = options.analysis || null;
    if (!_analysis && S && typeof S.computeHomeAnalysisSnapshot === 'function') {
      _analysis = S.computeHomeAnalysisSnapshot(getLogs());
    }
    _baseContext = buildContext();
    localizeChrome();
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
      overlay.hidden = false;
      overlay.removeAttribute('aria-hidden');
      if ('inert' in overlay) overlay.inert = false;
      overlay.classList.toggle('ai-chat-overlay--generic', _forceGeneric);
      overlay.classList.remove('ai-chat-overlay--open');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (!_open) return;
          overlay.classList.add('ai-chat-overlay--open');
        });
      });
    }
    _claimedModalActive = true;
    document.body.classList.add('modal-active', 'ai-chat-open');
    setInputEnabled(canSendTurn());
    renderMessages();
    renderFollowups(null);
    var seed = String(options.seedPrompt || '').trim();
    if (seed) {
      var input = document.getElementById('aiChatInput');
      if (input) input.value = seed;
      submitUserMessage();
    } else {
      renderFollowups(contextualFollowups());
      var inp = document.getElementById('aiChatInput');
      if (inp) inp.focus();
    }
  }

  function closeAiHealthChat() {
    if (!_open && !_closing) return;
    _open = false;
    _requestGen += 1;
    _sendInFlight = false;
    hideOverlayDom(true);
    releaseBodyScrollLock();
    wipeState();
    unbindLifecycle();
    var opener = _openerEl;
    _openerEl = null;
    if (opener && typeof opener.focus === 'function') {
      try { opener.focus(); } catch (_) { /* ignore */ }
    }
  }

  function isAiHealthChatOpen() {
    return _open;
  }

  global.openAiHealthChat = openAiHealthChat;
  global.closeAiHealthChat = closeAiHealthChat;
  global.isAiHealthChatOpen = isAiHealthChatOpen;
  global.RianellAiChat = {
    open: openAiHealthChat,
    close: closeAiHealthChat,
    isOpen: isAiHealthChatOpen,
    _wipeStateForTests: wipeState,
  };
})(typeof window !== 'undefined' ? window : globalThis);
