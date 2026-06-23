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

  function goalsSvgIcon(name) {
    var safeName = String(name || '').replace(/[^a-z0-9-]/gi, '');
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
    if (i === 1 && typeof global.renderAchievementsPane === 'function') {
      global.renderAchievementsPane();
    }
  }

  function goalsCarouselStep(delta) {
    var track = document.getElementById('goalsCarouselTrack');
    if (!track) return;
    var i = parseInt(track.getAttribute('data-goals-index') || '0', 10);
    goalsCarouselGo(i + delta);
  }

  function initGoalsCarouselUI(paneIndex) {
    bindGoalsCarouselTouchOnce();
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
})(typeof window !== 'undefined' ? window : globalThis);
