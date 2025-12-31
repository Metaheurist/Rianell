// ============================================
// CLOUD SYNC WITH SUPABASE
// ============================================

// IMPORTANT: Replace these with your Supabase project credentials
// Get them from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = 'https://tcoynycktablxankyriw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xZFsqfvvS1zVLpDMYnCJrQ_zDoFMdOr';

// Initialize Supabase client (only if credentials are set)
// Use a different name to avoid conflicts with global supabase from CDN
let supabaseClient = null;

// Cloud sync state
let cloudSyncState = {
  isAuthenticated: false,
  userId: null,
  autoSync: localStorage.getItem('cloudAutoSync') === 'true',
  lastSync: localStorage.getItem('cloudLastSync') || null
};

// Initialize Supabase when library loads
function initSupabase() {
  if (SUPABASE_URL && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    // Check for Supabase in various possible locations
    const SupabaseLib = window.supabase || window.supabaseClient || (typeof supabase !== 'undefined' ? supabase : null);
    if (SupabaseLib && typeof SupabaseLib.createClient === 'function') {
      supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      checkCloudAuth();
    } else {
      console.warn('Supabase library not loaded yet');
    }
  }
}

// Strong AES-256-GCM encryption using Web Crypto API
// This provides authenticated encryption with proper security

// Derive encryption key using PBKDF2 (Password-Based Key Derivation Function 2)
async function deriveEncryptionKey(userId, password) {
  // Combine user ID and password for key material
  const keyMaterial = userId + password;
  
  // Import the key material
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyMaterial);
  
  // Import as a raw key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive a 256-bit key using PBKDF2
  const salt = encoder.encode('health-app-salt-v1'); // Fixed salt (could be user-specific)
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return derivedKey;
}

// Encrypt data using AES-256-GCM
async function encryptData(data, key) {
  try {
    const dataStr = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataStr);
    
    // Generate a random 96-bit (12-byte) IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data: ' + error.message);
  }
}

// Decrypt data using AES-256-GCM
async function decryptData(encryptedBase64, key) {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data (rest)
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedData
    );
    
    // Convert back to string and parse JSON
    const decoder = new TextDecoder();
    const decryptedStr = decoder.decode(decryptedBuffer);
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data: ' + error.message);
  }
}

// Legacy function name for backward compatibility (now async)
async function getEncryptionKey(userId, password) {
  return await deriveEncryptionKey(userId, password);
}

// Check authentication status
async function checkCloudAuth() {
  if (!supabaseClient) {
    updateCloudStatus('Not configured', 'error');
    return;
  }

  try {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.userId = session.user.id;
      updateCloudStatus('Connected', 'success');
      showCloudSyncSection(session.user.email);
      
      const autoSync = localStorage.getItem('cloudAutoSync');
      if (autoSync !== null) {
        cloudSyncState.autoSync = autoSync === 'true';
        const checkbox = document.getElementById('cloudAutoSync');
        if (checkbox) checkbox.checked = cloudSyncState.autoSync;
      }
      
      const lastSync = localStorage.getItem('cloudLastSync');
      if (lastSync) {
        const lastSyncEl = document.getElementById('cloudLastSync');
        if (lastSyncEl) lastSyncEl.textContent = `Last sync: ${new Date(lastSync).toLocaleString()}`;
      }
    } else {
      cloudSyncState.isAuthenticated = false;
      updateCloudStatus('Not connected', 'error');
      showCloudAuthSection();
    }
  } catch (error) {
    console.error('Auth check error:', error);
    updateCloudStatus('Error checking status', 'error');
  }
}

// Update cloud status display
function updateCloudStatus(text, status) {
  const statusText = document.getElementById('cloudStatusText');
  const statusIndicator = document.getElementById('cloudStatusIndicator');
  
  if (statusText) {
    if (text.includes('<a')) {
      statusText.innerHTML = text;
    } else {
      statusText.textContent = text;
    }
  }
  
  if (statusIndicator) {
    statusIndicator.className = 'cloud-status-indicator';
    if (status === 'success') {
      statusIndicator.classList.add('status-success');
    } else if (status === 'error') {
      statusIndicator.classList.add('status-error');
    } else if (status === 'syncing') {
      statusIndicator.classList.add('status-syncing');
    }
  }
}

// Show authentication section
function showCloudAuthSection() {
  const authSection = document.getElementById('cloudAuthSection');
  const syncSection = document.getElementById('cloudSyncSection');
  if (authSection) authSection.style.display = 'block';
  if (syncSection) syncSection.style.display = 'none';
}

// Show sync section
function showCloudSyncSection(email) {
  const authSection = document.getElementById('cloudAuthSection');
  const syncSection = document.getElementById('cloudSyncSection');
  const userEmail = document.getElementById('cloudUserEmail');
  if (authSection) authSection.style.display = 'none';
  if (syncSection) syncSection.style.display = 'block';
  if (userEmail) userEmail.textContent = email;
}

// Handle sign up
async function handleCloudSignUp() {
  if (!supabaseClient) {
    alert('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.');
    return;
  }

  const email = document.getElementById('cloudEmail').value;
  const password = document.getElementById('cloudPassword').value;

  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    updateCloudStatus('Creating account...', 'syncing');
    const { data, error } = await supabaseClient.auth.signUp({
      email: email,
      password: password
    });

    if (error) throw error;

    if (data.user) {
      alert('Account created! Please check your email to verify your account, then sign in.');
      document.getElementById('cloudEmail').value = '';
      document.getElementById('cloudPassword').value = '';
      updateCloudStatus('Please verify email', 'error');
    }
  } catch (error) {
    console.error('Sign up error:', error);
    alert('Error creating account: ' + error.message);
    updateCloudStatus('Sign up failed', 'error');
  }
}

// Handle login
async function handleCloudLogin() {
  if (!supabaseClient) {
    alert('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.');
    return;
  }

  const email = document.getElementById('cloudEmail').value;
  const password = document.getElementById('cloudPassword').value;

  if (!email || !password) {
    alert('Please enter both email and password');
    return;
  }

  try {
    updateCloudStatus('Signing in...', 'syncing');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    if (data.session) {
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.userId = data.user.id;
      updateCloudStatus('Connected', 'success');
      showCloudSyncSection(data.user.email);
      
      // Auto-sync on login
      await syncFromCloud();
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Error signing in: ' + error.message);
    updateCloudStatus('Sign in failed', 'error');
  }
}

// Handle logout
async function handleCloudLogout() {
  if (!supabaseClient) return;

  try {
    await supabaseClient.auth.signOut();
    cloudSyncState.isAuthenticated = false;
    cloudSyncState.userId = null;
    updateCloudStatus('Not connected', 'error');
    showCloudAuthSection();
    const lastSyncEl = document.getElementById('cloudLastSync');
    if (lastSyncEl) lastSyncEl.textContent = 'Last sync: Never';
  } catch (error) {
    console.error('Logout error:', error);
    alert('Error signing out: ' + error.message);
  }
}

// Toggle auto-sync
function toggleAutoSync() {
  const checkbox = document.getElementById('cloudAutoSync');
  if (checkbox) {
    cloudSyncState.autoSync = checkbox.checked;
    localStorage.setItem('cloudAutoSync', checkbox.checked);
  }
}

// Sync data to cloud
async function syncToCloud() {
  if (!supabaseClient || !cloudSyncState.isAuthenticated) {
    alert('Please sign in to sync data');
    return;
  }

  try {
    updateCloudStatus('Syncing to cloud...', 'syncing');
    
    const healthLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
    const appSettings = JSON.parse(localStorage.getItem('healthAppSettings') || "{}");
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    const encryptionKey = await deriveEncryptionKey(user.id, 'health-app-key');
    
    const encryptedLogs = await encryptData(healthLogs, encryptionKey);
    const encryptedSettings = await encryptData(appSettings, encryptionKey);
    
    const { error: logsError } = await supabaseClient
      .from('health_data')
      .upsert({
        user_id: user.id,
        health_logs: encryptedLogs,
        app_settings: encryptedSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (logsError) throw logsError;

    const now = new Date().toISOString();
    cloudSyncState.lastSync = now;
    localStorage.setItem('cloudLastSync', now);
    const lastSyncEl = document.getElementById('cloudLastSync');
    if (lastSyncEl) lastSyncEl.textContent = `Last sync: ${new Date(now).toLocaleString()}`;
    
    updateCloudStatus('Synced successfully', 'success');
    setTimeout(() => updateCloudStatus('Connected', 'success'), 2000);
  } catch (error) {
    console.error('Sync error:', error);
    alert('Error syncing to cloud: ' + error.message);
    updateCloudStatus('Sync failed', 'error');
  }
}

// Sync data from cloud
async function syncFromCloud() {
  if (!supabaseClient || !cloudSyncState.isAuthenticated) {
    return;
  }

  try {
    updateCloudStatus('Syncing from cloud...', 'syncing');
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    const encryptionKey = await deriveEncryptionKey(user.id, 'health-app-key');
    
    const { data, error } = await supabaseClient
      .from('health_data')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) {
      const decryptedLogs = await decryptData(data.health_logs, encryptionKey);
      const decryptedSettings = await decryptData(data.app_settings, encryptionKey);
      
      if (decryptedLogs) {
        const localLogs = JSON.parse(localStorage.getItem("healthLogs") || "[]");
        const mergedLogs = mergeLogs(localLogs, decryptedLogs);
        localStorage.setItem("healthLogs", JSON.stringify(mergedLogs));
        if (typeof logs !== 'undefined') {
          logs = mergedLogs;
          if (typeof renderLogs === 'function') renderLogs();
          if (typeof updateCharts === 'function') updateCharts();
        }
      }
      
      if (decryptedSettings) {
        const localSettings = JSON.parse(localStorage.getItem('healthAppSettings') || "{}");
        const mergedSettings = { ...localSettings, ...decryptedSettings };
        localStorage.setItem('healthAppSettings', JSON.stringify(mergedSettings));
        if (typeof appSettings !== 'undefined') {
          appSettings = { ...appSettings, ...mergedSettings };
          if (typeof loadSettings === 'function') loadSettings();
        }
      }
      
      const now = new Date().toISOString();
      cloudSyncState.lastSync = now;
      localStorage.setItem('cloudLastSync', now);
      const lastSyncEl = document.getElementById('cloudLastSync');
      if (lastSyncEl) lastSyncEl.textContent = `Last sync: ${new Date(now).toLocaleString()}`;
    }
    
    updateCloudStatus('Synced successfully', 'success');
    setTimeout(() => updateCloudStatus('Connected', 'success'), 2000);
  } catch (error) {
    console.error('Sync from cloud error:', error);
    updateCloudStatus('Sync failed', 'error');
  }
}

// Merge logs intelligently
function mergeLogs(localLogs, cloudLogs) {
  const merged = [...cloudLogs];
  const cloudDates = new Set(cloudLogs.map(log => log.date));
  
  localLogs.forEach(log => {
    if (!cloudDates.has(log.date)) {
      merged.push(log);
    }
  });
  
  return merged.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// Auto-sync on data changes
if (typeof Storage !== 'undefined') {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    if (cloudSyncState.autoSync && cloudSyncState.isAuthenticated && (key === 'healthLogs' || key === 'healthAppSettings')) {
      clearTimeout(window.cloudSyncTimeout);
      window.cloudSyncTimeout = setTimeout(() => {
        if (typeof syncToCloud === 'function') syncToCloud();
      }, 2000);
    }
  };
}

// Initialize when Supabase loads - ensure functions are always available
function waitForSupabase() {
  // Check for Supabase in various possible locations
  const SupabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
  if (SupabaseLib && typeof SupabaseLib.createClient === 'function') {
    initSupabase();
  } else {
    // Retry after a short delay (max 10 seconds)
    if (!window.supabaseRetryCount) window.supabaseRetryCount = 0;
    if (window.supabaseRetryCount < 100) {
      window.supabaseRetryCount++;
      setTimeout(waitForSupabase, 100);
    } else {
      console.error('Supabase library failed to load after 10 seconds');
      updateCloudStatus('Supabase library not loaded', 'error');
    }
  }
}

// Make sure functions are available immediately, even if Supabase isn't loaded yet
// Functions are defined above, so they're available globally
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(waitForSupabase, 500);
  });
} else {
  setTimeout(waitForSupabase, 500);
}