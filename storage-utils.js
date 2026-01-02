// ============================================
// STORAGE UTILITIES
// Data compression for localStorage/IndexedDB
// ============================================

// Check if CompressionStream API is available
const hasCompressionStream = typeof CompressionStream !== 'undefined';

// Compress data using CompressionStream API (or fallback)
async function compressData(data) {
  try {
    if (hasCompressionStream) {
      // Use native CompressionStream API
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(encoder.encode(jsonString));
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      // Convert to base64 for storage
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      chunks.forEach(chunk => {
        compressed.set(chunk, offset);
        offset += chunk.length;
      });
      
      return btoa(String.fromCharCode(...compressed));
    } else {
      // Fallback: Use simple compression (remove whitespace, use shorter keys)
      // This is a basic compression - for better results, use pako library
      const compressed = JSON.stringify(data);
      return compressed;
    }
  } catch (error) {
    console.warn('Compression failed, storing uncompressed:', error);
    return JSON.stringify(data);
  }
}

// Decompress data
async function decompressData(compressedData) {
  try {
    if (hasCompressionStream && compressedData.startsWith('H4sI')) {
      // Check if it's gzip compressed (base64 gzip starts with H4sI)
      const binaryString = atob(compressedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(bytes);
      writer.close();
      
      const chunks = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          chunks.push(value);
        }
      }
      
      const decoder = new TextDecoder();
      const decompressed = chunks.map(chunk => decoder.decode(chunk, { stream: true })).join('');
      return JSON.parse(decompressed);
    } else {
      // Fallback: Assume it's uncompressed JSON
      return JSON.parse(compressedData);
    }
  } catch (error) {
    console.warn('Decompression failed, trying as plain JSON:', error);
    try {
      return JSON.parse(compressedData);
    } catch (e) {
      console.error('Failed to parse data:', e);
      return null;
    }
  }
}

// Check if data is compressed
function isCompressed(data) {
  return typeof data === 'string' && (data.startsWith('H4sI') || data.length < 100 && !data.startsWith('[') && !data.startsWith('{'));
}

// Enhanced localStorage with compression support
const CompressedStorage = {
  async setItem(key, value) {
    try {
      const appSettings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
      const useCompression = appSettings.compression !== false; // Default to true
      
      if (useCompression && hasCompressionStream) {
        const compressed = await compressData(value);
        localStorage.setItem(key, compressed);
        localStorage.setItem(key + '_compressed', 'true');
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        localStorage.removeItem(key + '_compressed');
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
      // Fallback to uncompressed
      localStorage.setItem(key, JSON.stringify(value));
      localStorage.removeItem(key + '_compressed');
    }
  },
  
  async getItem(key) {
    try {
      const data = localStorage.getItem(key);
      if (!data) return null;
      
      const isCompressed = localStorage.getItem(key + '_compressed') === 'true';
      
      if (isCompressed) {
        return await decompressData(data);
      } else {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      // Try to parse as plain JSON
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        console.error('Failed to parse storage data:', e);
        return null;
      }
    }
  },
  
  removeItem(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(key + '_compressed');
  }
};

// Migration: Convert existing uncompressed data to compressed
async function migrateToCompressedStorage() {
  try {
    const appSettings = JSON.parse(localStorage.getItem('healthAppSettings') || '{}');
    
    // Check if migration already done
    if (appSettings.compressionMigrated) {
      return;
    }
    
    // Migrate healthLogs
    const logs = localStorage.getItem('healthLogs');
    if (logs && !logs.startsWith('H4sI')) {
      try {
        const parsedLogs = JSON.parse(logs);
        await CompressedStorage.setItem('healthLogs', parsedLogs);
        console.log('Migrated healthLogs to compressed storage');
      } catch (e) {
        console.warn('Failed to migrate healthLogs:', e);
      }
    }
    
    // Mark migration as complete
    appSettings.compressionMigrated = true;
    localStorage.setItem('healthAppSettings', JSON.stringify(appSettings));
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Initialize migration on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', migrateToCompressedStorage);
} else {
  migrateToCompressedStorage();
}
