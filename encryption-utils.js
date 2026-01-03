// Encryption utilities for anonymized data
// Uses AES-256-GCM for encryption with a shared key

// Encryption key - should match server.py encryption key
// In production, this should be loaded from environment or config
// WARNING: This is a default key. For production, use a secure key from environment/config
const ENCRYPTION_KEY = 'REDACTED_USE_ENCRYPTION_KEY_OR_FILE'; // 64 chars, uses first 32 bytes

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
    
    // Import the key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
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
    console.error('Encryption error:', error);
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
    
    // Import the key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)),
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
    console.error('Decryption error:', error);
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

