// Encryption utilities for anonymized data
// Uses AES-256-GCM for encryption with a shared key

let cachedEncryptionKey = null; // Cache the key after first fetch

/**
 * Get encryption key - prefers server sync when Python dev server is available.
 * Otherwise uses a per-browser random 32-byte key in localStorage (no shared global default).
 */
async function getEncryptionKey() {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("encryption-utils.js", "getEncryptionKey", arguments) : undefined;
  try {
    if (cachedEncryptionKey) {
      return cachedEncryptionKey;
    }
    try {
      const response = await fetch('/api/encryption-key', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.key && typeof data.key === 'string') {
          cachedEncryptionKey = data.key;
          console.log('Encryption key synchronized with server');
          return cachedEncryptionKey;
        }
      }
    } catch (error) {
      console.warn('Could not fetch encryption key from server:', error);
    }
    const LS_KEY = 'rianellLocalEncryptionKeyHex';
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
      if (stored && /^[0-9a-fA-F]{64}$/.test(stored)) {
        cachedEncryptionKey = stored;
        return cachedEncryptionKey;
      }
    } catch (e) {
      /* quota / private mode */
    }
    const raw = new Uint8Array(32);
    crypto.getRandomValues(raw);
    let hex = '';
    for (let i = 0; i < raw.length; i++) {
      hex += ('0' + raw[i].toString(16)).slice(-2);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LS_KEY, hex);
      }
    } catch (e2) {
      /* session-only */
    }
    cachedEncryptionKey = hex;
    return cachedEncryptionKey;
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Encrypt anonymized log data before sending to Supabase
 * @param {Object} data - The anonymized_log object to encrypt
 * @returns {string} - Base64 encoded encrypted data
 */
async function encryptAnonymizedData(data) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("encryption-utils.js", "encryptAnonymizedData", arguments) : undefined;
  try {
    try {
      // Convert data to JSON string
      const jsonString = JSON.stringify(data);

      // Generate a random IV (Initialization Vector) - 12 bytes for GCM
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Get encryption key (derived or default)
      const keyHex = await getEncryptionKey();

      // Convert hex to bytes
      const keyBytes = new Uint8Array(keyHex.length / 2);
      for (let i = 0; i < keyHex.length; i += 2) {
        keyBytes[i / 2] = parseInt(keyHex.substr(i, 2), 16);
      }

      // Import the key
      const keyMaterial = await crypto.subtle.importKey('raw', keyBytes.slice(0, 32),
      // Ensure exactly 32 bytes
      {
        name: 'AES-GCM'
      }, false, ['encrypt']);

      // Encrypt the data
      const encrypted = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 128-bit authentication tag
      }, keyMaterial, new TextEncoder().encode(jsonString));

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      // Use safe error logging to prevent information leakage
      if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
        window.SecurityUtils.safeLogError('encryptAnonymizedData', error);
      } else {
        console.error('Encryption error occurred');
      }
      // Fallback: return original data as JSON string (no encryption)
      return JSON.stringify(data);
    }
  } finally {
    __rianellTraceExit(__rt);
  }
}

/**
 * Decrypt anonymized log data retrieved from Supabase
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Object|null} - Decrypted anonymized_log object or null on error
 */
async function decryptAnonymizedData(encryptedData) {
  var __rt = typeof __rianellTraceEnter === "function" ? __rianellTraceEnter("encryption-utils.js", "decryptAnonymizedData", arguments) : undefined;
  try {
    try {
      // Check if data is encrypted (base64 format) or plain JSON
      if (!encryptedData || typeof encryptedData !== 'string') {
        return null;
      }

      // Try to parse as JSON first (backward compatibility with unencrypted data)
      try {
        const parsed = JSON.parse(encryptedData);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed; // Already decrypted/unencrypted JSON
        }
      } catch (e) {
        // Not JSON, proceed with decryption
      }

      // Decode from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract IV (first 12 bytes) and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Get encryption key (derived or default)
      const keyHex = await getEncryptionKey();

      // Convert hex to bytes
      const keyBytes = new Uint8Array(keyHex.length / 2);
      for (let i = 0; i < keyHex.length; i += 2) {
        keyBytes[i / 2] = parseInt(keyHex.substr(i, 2), 16);
      }

      // Import the key
      const keyMaterial = await crypto.subtle.importKey('raw', keyBytes.slice(0, 32),
      // Ensure exactly 32 bytes
      {
        name: 'AES-GCM'
      }, false, ['decrypt']);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      }, keyMaterial, encrypted);

      // Convert back to JSON object
      const jsonString = new TextDecoder().decode(decrypted);
      return JSON.parse(jsonString);
    } catch (error) {
      // Use safe error logging to prevent information leakage
      if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
        window.SecurityUtils.safeLogError('decryptAnonymizedData', error);
      } else {
        console.error('Decryption error occurred');
      }
      // Try to parse as plain JSON (backward compatibility)
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

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    encryptAnonymizedData,
    decryptAnonymizedData
  };
}

// Make functions available globally for cloud-sync.js
if (typeof window !== 'undefined') {
  window.encryptAnonymizedData = encryptAnonymizedData;
  window.decryptAnonymizedData = decryptAnonymizedData;
}