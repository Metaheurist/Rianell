// Encryption utilities for anonymized data
// Uses AES-256-GCM for encryption with a shared key

let cachedEncryptionKey = null; // Cache the key after first fetch

/**
 * Get encryption key - fetches from server for client-server synchronization
 * Falls back to default key if server is unavailable
 */
async function getEncryptionKey() {
  // Return cached key if available
  if (cachedEncryptionKey) {
    return cachedEncryptionKey;
  }
  
  // Try to fetch key from server (for client-server sync)
  try {
    const response = await fetch('/api/encryption-key', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.key) {
        cachedEncryptionKey = data.key;
        console.log('Encryption key synchronized with server');
        return data.key;
      }
    }
  } catch (error) {
    console.warn('Could not fetch encryption key from server:', error);
    // Fallback to default
  }
  
  // Fallback to default key if server unavailable
  const defaultKey = 'K8mN2pQ5rT9vW3xZ6bC1dF4gH7jL0nM5qR8sU2wY5aB8eG1hI4jK7lM0oP3qR6tU9vW2xZ5';
  cachedEncryptionKey = defaultKey;
  return defaultKey;
}

// Default key for backward compatibility (fallback only)
const DEFAULT_ENCRYPTION_KEY = 'K8mN2pQ5rT9vW3xZ6bC1dF4gH7jL0nM5qR8sU2wY5aB8eG1hI4jK7lM0oP3qR6tU9vW2xZ5';

/**
 * Encrypt anonymized log data before sending to Supabase
 * @param {Object} data - The anonymized_log object to encrypt
 * @returns {string} - Base64 encoded encrypted data
 */
async function encryptAnonymizedData(data) {
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
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      keyBytes.slice(0, 32), // Ensure exactly 32 bytes
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
    
    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 128-bit authentication tag
      },
      keyMaterial,
      new TextEncoder().encode(jsonString)
    );
    
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
}

/**
 * Decrypt anonymized log data retrieved from Supabase
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Object|null} - Decrypted anonymized_log object or null on error
 */
async function decryptAnonymizedData(encryptedData) {
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
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      keyBytes.slice(0, 32), // Ensure exactly 32 bytes
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    
    // Decrypt the data
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      keyMaterial,
      encrypted
    );
    
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
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { encryptAnonymizedData, decryptAnonymizedData };
}

// Make functions available globally for cloud-sync.js
if (typeof window !== 'undefined') {
  window.encryptAnonymizedData = encryptAnonymizedData;
  window.decryptAnonymizedData = decryptAnonymizedData;
}

