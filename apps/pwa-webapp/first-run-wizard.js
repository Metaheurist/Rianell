/**
 * @deprecated Load guided-onboarding.js instead.
 * Legacy shim: re-exports RianellGuidedOnboarding as RianellFirstRunWizard when present.
 */
(function (global) {
  'use strict';

  function buildStub() {
    var falseFn = function () { return false; };
    return {
      isActive: falseFn,
      isComplete: function () { return true; },
      shouldDeferRegionGate: falseFn,
      shouldSuppressStandaloneModals: falseFn,
      openIfNeeded: falseFn,
      onTutorialFinished: function () {},
      advanceFromTutorial: function () {},
      syncTutorialFooter: function () {},
    };
  }

  var guided = global.RianellGuidedOnboarding;
  if (guided && typeof guided === 'object') {
    global.RianellFirstRunWizard = guided;
    return;
  }

  global.RianellFirstRunWizard = buildStub();
  if (typeof console !== 'undefined' && typeof console.warn === 'function') {
    console.warn(
      '[Rianell] first-run-wizard.js is deprecated — load guided-onboarding.js (before this shim if both are included).'
    );
  }
})(typeof window !== 'undefined' ? window : globalThis);
