/**
 * Goals modal carousel (2 panes: targets + achievements).
 */
(function (global) {
  'use strict';

  var GOALS_PANE_TITLE_KEYS = ['common.goals.targets', 'achievements.title'];

  function goalsT(key, params) {
    if (global.RianellI18n && typeof global.RianellI18n.t === 'function') {
      return global.RianellI18n.t(key, params);
    }
    if (typeof global.tUi === 'function') return global.tUi(key, params);
    return key;
  }

  var KNOWN_GOALS_ICON_NAMES = new Set(['target', 'medal']);

  function goalsSvgIcon(name) {
    var safeName = String(name || '').replace(/[^a-z0-9-]/gi, '');
    if (!KNOWN_GOALS_ICON_NAMES.has(safeName)) safeName = 'target';
    return '<svg class="ui-svg-icon goals-dot-icon-svg" aria-hidden="true"><use href="#icon-' + safeName + '"></use></svg>';
  }

  function ensureGoalsCarouselDots(panes) {
    var dots = document.getElementById('goalsCarouselDots');
    if (!dots) return;
    if (dots.childElementCount !== panes.length) {
      dots.innerHTML = '';
      for (var i = 0; i < panes.length; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'goals-carousel-dot';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('data-i18n-aria', GOALS_PANE_TITLE_KEYS[i] || 'common.goals.targets');
        btn.innerHTML =
          '<span class="goals-carousel-dot__icon" aria-hidden="true">' +
          goalsSvgIcon(i === 0 ? 'target' : 'medal') +
          '</span>';
        btn.onclick = (function (idx) {
          return function () {
            goalsCarouselGo(idx);
          };
        })(i);
        dots.appendChild(btn);
      }
    }
    var dotBtns = dots.querySelectorAll('.goals-carousel-dot');
    dotBtns.forEach(function (btn, idx) {
      var titleKey = GOALS_PANE_TITLE_KEYS[idx] || 'common.goals.targets';
      btn.setAttribute('aria-label', goalsT(titleKey));
    });
  }

  function updateGoalsCarouselDots(activeIndex) {
    var dots = document.querySelectorAll('#goalsCarouselDots .goals-carousel-dot');
    dots.forEach(function (dot, idx) {
      var active = idx === activeIndex;
      dot.classList.toggle('goals-carousel-dot--active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
      dot.setAttribute('aria-current', active ? 'true' : 'false');
    });
  }

  function bindGoalsCarouselTouchOnce() {
    if (global._goalsCarouselTouchBound) return;
    var vp = document.getElementById('goalsCarouselViewport');
    if (!vp) return;
    global._goalsCarouselTouchBound = true;
    var startX = null;
    vp.addEventListener(
      'touchstart',
      function (e) {
        if (!e.changedTouches || !e.changedTouches.length) return;
        startX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    vp.addEventListener(
      'touchend',
      function (e) {
        if (startX == null || !e.changedTouches || !e.changedTouches.length) return;
        var dx = e.changedTouches[0].screenX - startX;
        startX = null;
        if (Math.abs(dx) < 56) return;
        goalsCarouselStep(dx < 0 ? 1 : -1);
      },
      { passive: true }
    );
  }

  function scheduleGoalsCarouselHeightSync() {
    if (typeof requestAnimationFrame !== 'function') {
      syncGoalsCarouselViewportHeight();
      return;
    }
    if (global._goalsCarouselHeightRaf) cancelAnimationFrame(global._goalsCarouselHeightRaf);
    global._goalsCarouselHeightRaf = requestAnimationFrame(function () {
      global._goalsCarouselHeightRaf = requestAnimationFrame(syncGoalsCarouselViewportHeight);
    });
  }

  function syncGoalsCarouselViewportHeight() {
    var vp = document.getElementById('goalsCarouselViewport');
    var track = document.getElementById('goalsCarouselTrack');
    if (!vp || !track) return;
    var panes = track.querySelectorAll('.goals-carousel-pane');
    var i = parseInt(track.getAttribute('data-goals-index') || '0', 10);
    var activePane = panes[i];
    if (!activePane) return;

    vp.style.height = '';
    panes.forEach(function (p) {
      p.style.maxHeight = '';
      p.style.overflowY = '';
    });

    var shell = document.querySelector('.goals-modal-inner');
    var header = document.querySelector('.goals-modal-header');
    var footer = shell && shell.querySelector('.modal-footer');
    var reserved = 0;
    if (header) reserved += header.offsetHeight;
    if (footer) reserved += footer.offsetHeight;
    reserved += 20;

    var maxBody = Math.floor(window.innerHeight * 0.85) - reserved;
    maxBody = Math.max(160, Math.min(maxBody, 520));

    var contentHeight = activePane.scrollHeight;
    var viewportHeight = Math.min(contentHeight, maxBody);

    vp.style.height = viewportHeight + 'px';
    activePane.style.maxHeight = viewportHeight + 'px';
    activePane.style.overflowY = contentHeight > maxBody ? 'auto' : 'visible';
  }

  function bindGoalsCarouselResizeOnce() {
    if (global._goalsCarouselResizeBound) return;
    global._goalsCarouselResizeBound = true;
    var timer = null;
    window.addEventListener('resize', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(scheduleGoalsCarouselHeightSync, 120);
    });
  }

  function goalsCarouselGo(i) {
    var track = document.getElementById('goalsCarouselTrack');
    var vp = document.getElementById('goalsCarouselViewport');
    var meta = document.getElementById('goalsCarouselMeta');
    var prev = document.getElementById('goalsCarouselPrev');
    var next = document.getElementById('goalsCarouselNext');
    if (!track || !vp) return;
    var panes = track.querySelectorAll('.goals-carousel-pane');
    var n = panes.length;
    if (n < 1) return;
    ensureGoalsCarouselDots(panes);
    if (i < 0) i = 0;
    if (i >= n) i = n - 1;
    track.setAttribute('data-goals-index', String(i));
    track.style.setProperty('--goals-pane-index', String(i));
    track.style.setProperty('--goals-pane-count', String(n));
    vp.style.setProperty('--goals-pane-count', String(n));
    if (prev) {
      prev.disabled = i <= 0;
      prev.setAttribute('aria-disabled', i <= 0 ? 'true' : 'false');
    }
    if (next) {
      next.disabled = i >= n - 1;
      next.setAttribute('aria-disabled', i >= n - 1 ? 'true' : 'false');
    }
    panes.forEach(function (p, idx) {
      var active = idx === i;
      p.classList.toggle('goals-carousel-pane--active', active);
      p.setAttribute('aria-hidden', active ? 'false' : 'true');
      if ('inert' in p) p.inert = !active;
    });
    var pane = panes[i];
    var titleKey = pane && pane.getAttribute('data-i18n-title');
    var titleText = titleKey ? goalsT(titleKey) : (pane && pane.getAttribute('data-pane-title')) || '';
    if (meta) meta.textContent = String(i + 1) + ' / ' + n + (titleText ? ' - ' + titleText : '');
    updateGoalsCarouselDots(i);
    global.goalsModalPaneIndex = i;
    if (i === 1) {
      if (typeof global.renderAchievementsPane === 'function') {
        global.renderAchievementsPane();
      }
      if (typeof global.markUnlockedAchievementsSeen === 'function') {
        global.markUnlockedAchievementsSeen();
      }
    }
    scheduleGoalsCarouselHeightSync();
  }

  function goalsCarouselStep(delta) {
    var track = document.getElementById('goalsCarouselTrack');
    if (!track) return;
    var i = parseInt(track.getAttribute('data-goals-index') || '0', 10);
    goalsCarouselGo(i + delta);
  }

  function renderGoalsOrientationCard() {
    var card = document.getElementById('goalsOrientationCard');
    if (!card) return;
    var seen = global.appSettings && global.appSettings.goalsModalSeenCount;
    if (seen) {
      card.hidden = true;
      card.innerHTML = '';
      return;
    }
    card.hidden = false;
    card.innerHTML =
      '<p class="goals-orientation-body">' + goalsT('goals.firstVisit.body') + '</p>' +
      '<button type="button" class="goals-orientation-dismiss">' + goalsT('goals.firstVisit.dismiss') + '</button>';
    var dismiss = card.querySelector('.goals-orientation-dismiss');
    if (dismiss) {
      dismiss.onclick = function () {
        if (!global.appSettings) global.appSettings = {};
        global.appSettings.goalsModalSeenCount = 1;
        if (typeof global.saveSettings === 'function') global.saveSettings();
        renderGoalsOrientationCard();
        scheduleGoalsCarouselHeightSync();
      };
    }
  }

  function initGoalsCarouselUI(paneIndex) {
    renderGoalsOrientationCard();
    bindGoalsCarouselTouchOnce();
    bindGoalsCarouselResizeOnce();
    var saved =
      typeof paneIndex === 'number'
        ? paneIndex
        : typeof global.goalsModalPaneIndex === 'number'
          ? global.goalsModalPaneIndex
          : 0;
    goalsCarouselGo(saved);
  }

  function refreshGoalsCarouselI18n() {
    var track = document.getElementById('goalsCarouselTrack');
    if (!track) return;
    var panes = track.querySelectorAll('.goals-carousel-pane');
    if (!panes.length) return;
    var idx = parseInt(track.getAttribute('data-goals-index') || '0', 10);
    ensureGoalsCarouselDots(panes);
    goalsCarouselGo(idx);
  }

  global.goalsCarouselGo = goalsCarouselGo;
  global.goalsCarouselStep = goalsCarouselStep;
  global.initGoalsCarouselUI = initGoalsCarouselUI;
  global.refreshGoalsCarouselI18n = refreshGoalsCarouselI18n;
  global.scheduleGoalsCarouselHeightSync = scheduleGoalsCarouselHeightSync;
})(typeof window !== 'undefined' ? window : globalThis);
