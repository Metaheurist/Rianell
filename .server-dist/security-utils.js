// ============================================
// Security Utilities for Client-Side App
// ============================================

/**
 * Security utilities for error handling, CSRF protection, rate limiting,
 * and secure storage encryption
 */

// ============================================
// Error Handling - Prevent Information Leakage
// ============================================

/**
 * Sanitize error messages to prevent information leakage
 * Removes stack traces, file paths, and sensitive data
 */
function sanitizeError(error) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "sanitizeError", arguments) : undefined;
  try {
    if (!error) return 'An error occurred';

    // If it's already a sanitized string, return it
    if (typeof error === 'string') {
      return sanitizeErrorMessage(error);
    }

    // Extract message from Error object
    let message = error.message || error.toString() || 'An error occurred';

    // Sanitize the message
    message = sanitizeErrorMessage(message);
    return message;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Sanitize error message string
 */
function sanitizeErrorMessage(message) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "sanitizeErrorMessage", arguments) : undefined;
  try {
    if (!message || typeof message !== 'string') {
      return 'An error occurred';
    }

    // Remove file paths and line numbers
    message = message.replace(/\/[^\s]+:\d+:\d+/g, '[file]');
    message = message.replace(/at\s+[^\s]+\s+\([^)]+\)/g, '[stack]');
    message = message.replace(/at\s+[^\s]+/g, '[stack]');

    // Remove URLs
    message = message.replace(/https?:\/\/[^\s]+/g, '[url]');

    // Remove email addresses
    message = message.replace(/[^\s]+@[^\s]+/g, '[email]');

    // Remove API keys or tokens (long alphanumeric strings)
    message = message.replace(/[A-Za-z0-9]{32,}/g, '[token]');

    // Remove stack traces
    if (message.includes('Error:') || message.includes('TypeError') || message.includes('ReferenceError')) {
      const parts = message.split('\n');
      message = parts[0]; // Keep only first line
    }

    // Limit message length
    if (message.length > 200) {
      message = message.substring(0, 197) + '...';
    }
    return message;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Safe error logging that doesn't expose sensitive information
 */
function safeLogError(context, error) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "safeLogError", arguments) : undefined;
  try {
    const sanitized = sanitizeError(error);
    console.error(`[${context}]`, sanitized);

    // Log full error to console only in development (check for localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.error('[DEBUG] Full error:', error);
    }
    return sanitized;
  } finally {
    __rianellTraceExit(__rt);
  }
}

// ============================================
// CSRF Protection
// ============================================

/**
 * Generate CSRF token
 * For static hosting, we use sessionStorage-based tokens
 * Note: This provides limited protection without server-side validation
 */
function generateCSRFToken() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "generateCSRFToken", arguments) : undefined;
  try {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Get or create CSRF token for current session
 */
function getCSRFToken() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "getCSRFToken", arguments) : undefined;
  try {
    let token = sessionStorage.getItem('csrf_token');
    if (!token) {
      token = generateCSRFToken();
      sessionStorage.setItem('csrf_token', token);
    }
    return token;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Validate CSRF token
 */
function validateCSRFToken(token) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "validateCSRFToken", arguments) : undefined;
  try {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken && storedToken === token;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Add CSRF token to fetch request headers
 */
function addCSRFHeader(headers = {}) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "addCSRFHeader", arguments) : undefined;
  try {
    headers['X-CSRF-Token'] = getCSRFToken();
    return headers;
  } finally {
    __rianellTraceExit(__rt);
  }
}

// ============================================
// Rate Limiting
// ============================================

const RATE_LIMITS = {
  api_request: {
    max: 100,
    window: 60000
  },
  // 100 requests per minute
  sync_request: {
    max: 10,
    window: 60000
  },
  // 10 syncs per minute
  log_submission: {
    max: 20,
    window: 60000
  },
  // 20 logs per minute
  export_request: {
    max: 5,
    window: 60000
  } // 5 exports per minute
};

/**
 * Rate limiter using localStorage with timestamps
 */
function checkRateLimit(action) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "checkRateLimit", arguments) : undefined;
  try {
    const limit = RATE_LIMITS[action];
    if (!limit) return {
      allowed: true
    }; // No limit defined

    const key = `rate_limit_${action}`;
    const now = Date.now();
    try {
      const stored = localStorage.getItem(key);
      let timestamps = stored ? JSON.parse(stored) : [];

      // Remove old timestamps outside the window
      timestamps = timestamps.filter(ts => now - ts < limit.window);

      // Check if limit exceeded
      if (timestamps.length >= limit.max) {
        const oldest = timestamps[0];
        const waitTime = Math.ceil((limit.window - (now - oldest)) / 1000);
        return {
          allowed: false,
          waitTime: waitTime,
          message: `Rate limit exceeded. Please wait ${waitTime} seconds.`
        };
      }

      // Add current timestamp
      timestamps.push(now);
      localStorage.setItem(key, JSON.stringify(timestamps));
      return {
        allowed: true
      };
    } catch (error) {
      // If localStorage fails, allow the request (fail open)
      console.warn('Rate limit check failed:', error);
      return {
        allowed: true
      };
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Wrapper for rate-limited function calls
 */
async function rateLimitedCall(action, callback, errorMessage = 'Rate limit exceeded') {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "rateLimitedCall", arguments) : undefined;
  try {
    const check = checkRateLimit(action);
    if (!check.allowed) {
      throw new Error(check.message || errorMessage);
    }
    return await callback();
  } finally {
    __rianellTraceExit(__rt);
  }
}

// ============================================
// Secure Storage Encryption
// ============================================

/**
 * Derive encryption key from user-specific data
 * Uses a combination of user agent, origin, and optional user input
 */
async function deriveStorageKey(userInput = null) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "deriveStorageKey", arguments) : undefined;
  try {
    // Create a base from environment
    const base = window.location.origin + navigator.userAgent;

    // If user provided input, use it (e.g., from settings)
    const input = userInput || sessionStorage.getItem('storage_key_seed') || '';

    // Combine and hash
    const combined = base + input;
    const encoder = new TextEncoder();
    const data = encoder.encode(combined);

    // Use Web Crypto API to derive key
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Return first 32 bytes as hex string
    return hashHex.substring(0, 64); // 32 bytes = 64 hex chars
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Encrypt sensitive data for localStorage
 */
async function encryptForStorage(data, keySeed = null) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "encryptForStorage", arguments) : undefined;
  try {
    try {
      const key = await deriveStorageKey(keySeed);
      const jsonString = JSON.stringify(data);

      // Generate IV
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Import key
      const keyMaterial = await crypto.subtle.importKey('raw', hexToBytes(key), {
        name: 'AES-GCM'
      }, false, ['encrypt']);

      // Encrypt
      const encrypted = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      }, keyMaterial, new TextEncoder().encode(jsonString));

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Return base64
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Storage encryption failed:', error);
      // Fallback: return as JSON string (not encrypted)
      return JSON.stringify(data);
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Decrypt data from localStorage
 */
async function decryptFromStorage(encryptedData, keySeed = null) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "decryptFromStorage", arguments) : undefined;
  try {
    try {
      // Try parsing as JSON first (backward compatibility)
      try {
        const parsed = JSON.parse(encryptedData);
        if (typeof parsed === 'object') {
          return parsed; // Already decrypted
        }
      } catch (e) {
        // Not JSON, proceed with decryption
      }
      const key = await deriveStorageKey(keySeed);

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Import key
      const keyMaterial = await crypto.subtle.importKey('raw', hexToBytes(key), {
        name: 'AES-GCM'
      }, false, ['decrypt']);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      }, keyMaterial, encrypted);

      // Parse JSON
      const jsonString = new TextDecoder().decode(decrypted);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Storage decryption failed:', error);
      // Fallback: try parsing as JSON
      try {
        return JSON.parse(encryptedData);
      } catch (e) {
        return null;
      }
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Helper: Convert hex string to bytes
 */
function hexToBytes(hex) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "hexToBytes", arguments) : undefined;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Secure localStorage wrapper for sensitive data
 */
const SecureStorage = {
  /**
   * Set item with optional encryption
   */
  async setItem(key, value, encrypt = false) {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "setItem", arguments) : undefined;
    try {
      try {
        let data = value;
        if (encrypt) {
          data = await encryptForStorage(value);
          // Mark as encrypted
          localStorage.setItem(`${key}_encrypted`, 'true');
        } else {
          localStorage.removeItem(`${key}_encrypted`);
        }
        localStorage.setItem(key, data);
      } catch (error) {
        safeLogError('SecureStorage.setItem', error);
        // Fallback to regular localStorage
        localStorage.setItem(key, JSON.stringify(value));
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  /**
   * Get item with optional decryption
   */
  async getItem(key) {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "getItem", arguments) : undefined;
    try {
      try {
        const isEncrypted = localStorage.getItem(`${key}_encrypted`) === 'true';
        const data = localStorage.getItem(key);
        if (!data) return null;
        if (isEncrypted) {
          return await decryptFromStorage(data);
        } else {
          // Try parsing as JSON
          try {
            return JSON.parse(data);
          } catch (e) {
            return data; // Return as string
          }
        }
      } catch (error) {
        safeLogError('SecureStorage.getItem', error);
        // Fallback to regular localStorage
        try {
          return JSON.parse(localStorage.getItem(key));
        } catch (e) {
          return localStorage.getItem(key);
        }
      }
    } finally {
      __rianellTraceExit(__rt);
    }
  },
  /**
   * Remove item
   */
  removeItem(key) {
    var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "removeItem", arguments) : undefined;
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_encrypted`);
    } finally {
      __rianellTraceExit(__rt);
    }
  }
};

// ============================================
// Request Validation
// ============================================

/**
 * Validate request data
 */
function validateRequest(data, schema) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("security-utils.js", "validateRequest", arguments) : undefined;
  try {
    const errors = [];
    for (const [key, rules] of Object.entries(schema)) {
      const value = data[key];

      // Check required
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }

      // Skip validation if value is not provided and not required
      if (value === undefined || value === null) continue;

      // Check type
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${key} must be ${rules.type}`);
        continue;
      }

      // Check min/max for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${key} must be at least ${rules.min}`);
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${key} must be at most ${rules.max}`);
        }
      }

      // Check length for strings
      if (rules.type === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push(`${key} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push(`${key} must be at most ${rules.maxLength} characters`);
        }
      }

      // Check pattern
      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push(`${key} format is invalid`);
      }
    }
    return {
      valid: errors.length === 0,
      errors: errors
    };
  } finally {
    __rianellTraceExit(__rt);
  }
}

// ============================================
// Export Functions
// ============================================

if (typeof window !== 'undefined') {
  window.SecurityUtils = {
    sanitizeError,
    sanitizeErrorMessage,
    safeLogError,
    getCSRFToken,
    validateCSRFToken,
    addCSRFHeader,
    checkRateLimit,
    rateLimitedCall,
    encryptForStorage,
    decryptFromStorage,
    SecureStorage,
    validateRequest
  };
}