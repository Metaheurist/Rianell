/**
 * Ephemeral on-device health chat panel (Home discovery + AI Q&A).
 * State lives in module scope only - cleared on close and beforeunload.
 */
(function (global) {
  'use strict';

  var PANEL_ID = 'aiHealthChatPanel';
  var OVERLAY_ID = 'aiHealthChatOverlay';
  var _open = false;
  var _turns = [];
  var _baseContext = '';
  var _analysis = null;
  var _escapeHandler = null;
  var _beforeUnloadHandler = null;
  var _sendInFlight = false;
  var _requestGen = 0;
  var _claimedModalActive = false;
  var _forceGeneric = false;

  function t(key, params) {
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return key;
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

  function ensureDom() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.className = 'ai-chat-overlay';
    overlay.setAttribute('role', 'presentation');
    overlay.hidden = true;
    overlay.innerHTML =
      '<div id="' + PANEL_ID + '" class="ai-chat-panel" role="dialog" aria-modal="true" aria-labelledby="aiChatTitle">' +
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
        ? (typeof global.tUiOr === 'function'
          ? global.tUiOr('home.chat.trustBadge.generic', 'Guided tips · no on-device model on this device')
          : t('home.chat.trustBadge.generic'))
        : t('home.chat.trustBadge');
    }    var input = overlay.querySelector('#aiChatInput');
    if (input) {
      input.placeholder = t('ai.weekChat.placeholder');
      var label = overlay.querySelector('label[for="aiChatInput"]');
      if (label) {
        label.textContent = typeof global.tUiOr === 'function'
          ? global.tUiOr('home.chat.inputLabel', 'Ask about your health logs')
          : t('home.chat.inputLabel') || 'Ask about your health logs';
      }
    }
    var send = overlay.querySelector('#aiChatSend');
    if (send) send.textContent = t('ai.weekChat.send');
    var disc = overlay.querySelector('#aiChatDisclaimer');
    if (disc) disc.textContent = t('home.chat.disclaimer');
    updateTurnsLabel();
  }

  function updateTurnsLabel() {
    var el = document.getElementById('aiChatTurns');
    if (!el) return;
    if (!canSendTurn()) {
      el.textContent = t('ai.weekChat.limitReached');
      return;
    }
    el.textContent = t('ai.weekChat.turnsLeft', { left: String(getMaxTurns() - _turns.length) });
  }

  function setInputEnabled(enabled) {
    var input = document.getElementById('aiChatInput');
    var send = document.getElementById('aiChatSend');
    var form = document.getElementById('aiChatForm');
    if (input) input.disabled = !enabled;
    if (send) send.disabled = !enabled;
    if (form) form.classList.toggle('ai-chat-form--disabled', !enabled);
  }

  function renderMessages() {
    var box = document.getElementById('aiChatMessages');
    if (!box) return;
    var html = '';
    _turns.forEach(function (turn) {
      html += '<div class="ai-chat-bubble ai-chat-bubble--user"><p>' + escapeHTML(turn.user) + '</p></div>';
      if (turn.assistant) {
        html += '<div class="ai-chat-bubble ai-chat-bubble--assistant"><p>' + escapeHTML(turn.assistant) + '</p></div>';
      }
    });
    if (_sendInFlight) {
      html += '<div class="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--typing" aria-busy="true"><p>' +
        escapeHTML(t('ai.weekChat.loading')) + '</p></div>';
    }
    box.innerHTML = html;
    box.scrollTop = box.scrollHeight;
  }

  function renderFollowups(suggestions) {
    var wrap = document.getElementById('aiChatFollowups');
    if (!wrap) return;
    if (!suggestions || !suggestions.length || !canSendTurn() || _sendInFlight) {
      wrap.hidden = true;
      wrap.innerHTML = '';
      return;
    }
    wrap.hidden = false;
    wrap.innerHTML = suggestions.map(function (s) {
      return '<button type="button" class="ai-chat-followup-chip" data-followup="' + escapeAttr(s) + '">' +
        escapeHTML(s) + '</button>';
    }).join('');
    wrap.querySelectorAll('[data-followup]').forEach(function (btn) {
      btn.onclick = function () {
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
    renderFollowups(canSendTurn() ? defaultFollowups() : null);
    if (canSendTurn()) {
      var inp = document.getElementById('aiChatInput');
      if (inp) inp.focus();
    }
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
  }

  function unbindLifecycle() {
    if (_escapeHandler) {
      document.removeEventListener('keydown', _escapeHandler);
      _escapeHandler = null;
    }
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
    if (follow) { follow.innerHTML = ''; follow.hidden = true; }
    var input = document.getElementById('aiChatInput');
    if (input) input.value = '';
  }

  function openAiHealthChat(options) {
    options = options || {};
    if (!options.skipGate && typeof global.gateAiHealthChatOpen === 'function') {
      var gate = global.gateAiHealthChatOpen(options);
      if (!gate || gate.allow === false) return;
      if (gate.forceGeneric) options.forceGeneric = true;
    }
    var simpleOff = global.appSettings && global.appSettings.simpleMode === true;
    if (simpleOff) return;
    var aiOn = !global.appSettings || global.appSettings.aiEnabled !== false;
    if (!aiOn && !options.forceGeneric) return;
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
      overlay.classList.add('ai-chat-overlay--open');
      overlay.classList.toggle('ai-chat-overlay--generic', _forceGeneric);
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
      renderFollowups(defaultFollowups());
      var inp = document.getElementById('aiChatInput');
      if (inp) inp.focus();
    }
    var panel = document.getElementById(PANEL_ID);
    if (panel && typeof panel.focus === 'function') panel.focus();
  }

  function hideOverlayDom() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (!overlay) return;
    overlay.classList.remove('ai-chat-overlay--open');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if ('inert' in overlay) overlay.inert = true;
  }

  function releaseBodyScrollLock() {
    document.body.classList.remove('ai-chat-open');
    if (_claimedModalActive) {
      document.body.classList.remove('modal-active');
      _claimedModalActive = false;
    }
  }

  function closeAiHealthChat() {
    _open = false;
    _requestGen += 1;
    _sendInFlight = false;
    hideOverlayDom();
    releaseBodyScrollLock();
    wipeState();
    unbindLifecycle();
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
