/**
 * Client-side Logger (server log relay on the dev host) and the bug-report console capture buffer.
 * Extracted from app.js. app.js re-publishes any window.* bindings at their original
 * positions; this module must not import app.js (it is loaded as app.js?v=N).
 */

import { isStaticHost } from './platform.js';

// ============================================
// Client-Side Logging Utility
// ============================================
const Logger = {
  enabled: true,
  serverEndpoint: '/api/log',
  
  _demoModeCache: null,
  _demoModeCacheTime: 0,
  _cacheTimeout: 5000, // Cache for 5 seconds
  
  _getDemoMode() {
    const now = Date.now();
    // Use cached value if still valid
    if (this._demoModeCache !== null && (now - this._demoModeCacheTime) < this._cacheTimeout) {
      return this._demoModeCache;
    }
    
    // Check demo mode from localStorage (avoids temporal dead zone issues with appSettings)
    let isDemoMode = false;
    try {
      const savedSettings = localStorage.getItem('rianellSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        isDemoMode = settings.demoMode === true;
      }
    } catch (e) {
      // If we can't read settings, skip server logging
      this._demoModeCache = false;
      this._demoModeCacheTime = now;
      return false;
    }
    
    // Cache the result
    this._demoModeCache = isDemoMode;
    this._demoModeCacheTime = now;
    return isDemoMode;
  },
  
  log(level, message, details = {}) {
    if (!this.enabled) return;
    
    const logEntry = {
      level: level,
      message: message,
      timestamp: new Date().toISOString(),
      source: 'client',
      details: details,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // Always log to console
    const consoleMethod = level.toLowerCase() === 'error' ? 'error' : 
                         level.toLowerCase() === 'warn' ? 'warn' : 
                         level.toLowerCase() === 'debug' ? 'debug' : 'log';
    console[consoleMethod](`[${level}] ${message}`, details);
    
    // Only send to server if demo mode is enabled and we're not on a static host (no /api)
    if (!this._getDemoMode() || isStaticHost()) {
      return; // Skip server logging when not in demo mode or on GitHub Pages etc.
    }
    
    // Send to server (fire and forget - don't block on errors)
    try {
      fetch(this.serverEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(err => {
        // Silently fail - don't spam console if server is down
        console.debug('Failed to send log to server:', err);
      });
    } catch (err) {
      console.debug('Error sending log:', err);
    }
  },
  
  info(message, details) {
    this.log('INFO', message, details);
  },
  
  warn(message, details) {
    this.log('WARN', message, details);
  },
  
  error(message, details) {
    this.log('ERROR', message, details);
  },
  
  debug(message, details) {
    this.log('DEBUG', message, details);
  }
};

const bugReportConsoleBuffer = [];

const BUG_REPORT_CONSOLE_LIMIT = 120;

var bugReportConsoleCaptureInstalled = false;

function stringifyConsoleArg(arg) {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return (arg.stack || (arg.name + ': ' + arg.message));
  try {
    return JSON.stringify(arg);
  } catch (e) {
    return String(arg);
  }
}

function captureBugReportConsoleEvent(level, args) {
  try {
    bugReportConsoleBuffer.push({
      timestamp: new Date().toISOString(),
      level: level,
      message: Array.prototype.map.call(args || [], stringifyConsoleArg).join(' ')
    });
    if (bugReportConsoleBuffer.length > BUG_REPORT_CONSOLE_LIMIT) {
      bugReportConsoleBuffer.splice(0, bugReportConsoleBuffer.length - BUG_REPORT_CONSOLE_LIMIT);
    }
  } catch (e) {}
}

function installBugReportConsoleCapture() {
  if (bugReportConsoleCaptureInstalled || typeof console === 'undefined') return;
  ['log', 'info', 'warn', 'error'].forEach(function(method) {
    if (typeof console[method] !== 'function') return;
    var original = console[method].bind(console);
    console[method] = function() {
      captureBugReportConsoleEvent(method.toUpperCase(), arguments);
      original.apply(console, arguments);
    };
  });
  bugReportConsoleCaptureInstalled = true;
}

function getBugReportConsoleOutput() {
  var lines = bugReportConsoleBuffer.map(function(entry) {
    return '[' + entry.timestamp + '] [' + entry.level + '] ' + entry.message;
  });
  return lines.join('\n');
}

export { Logger, installBugReportConsoleCapture, getBugReportConsoleOutput };
