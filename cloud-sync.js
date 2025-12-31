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

// Check if Web Crypto API is available (requires secure context - HTTPS or localhost)
function isSecureContext() {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         (window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

// Derive encryption key using PBKDF2 (Password-Based Key Derivation Function 2)
async function deriveEncryptionKey(userId, password) {
  // Check if Web Crypto API is available
  if (!isSecureContext()) {
    const error = new Error('Web Crypto API requires a secure context (HTTPS or localhost). Cloud sync is not available when accessing via LAN IP (http://). Please use https:// or access via localhost.');
    console.error('❌ Cloud sync error:', error.message);
    console.warn('💡 Solutions:');
    console.warn('   1. Access via localhost: http://localhost:8080');
    console.warn('   2. Set up HTTPS for LAN access');
    console.warn('   3. Use a reverse proxy with SSL certificate');
    throw error;
  }
  
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
    // Use chunked conversion to avoid stack overflow with large datasets
    const chunkSize = 8192; // Process in 8KB chunks
    let binaryString = '';
    for (let i = 0; i < combined.length; i += chunkSize) {
      const chunk = combined.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binaryString);
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
      const currentUserId = session.user.id;
      
      // SECURITY: Clear previous user's data if user changed
      const storedUserId = localStorage.getItem('currentCloudUserId');
      if (storedUserId && storedUserId !== currentUserId) {
        console.log('⚠️ User change detected - clearing previous user data');
        localStorage.setItem("healthLogs", JSON.stringify([]));
        localStorage.setItem('healthAppSettings', JSON.stringify({}));
        if (typeof renderLogs === 'function') {
          renderLogs();
        }
      }
      localStorage.setItem('currentCloudUserId', currentUserId);
      
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.userId = currentUserId;
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
  
  // Initialize checkbox state
  const checkbox = document.getElementById('cloudAutoSync');
  if (checkbox) {
    const autoSync = localStorage.getItem('cloudAutoSync');
    checkbox.checked = autoSync === 'true';
    checkbox.disabled = false;
  }
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
    // Check secure context before attempting sign up
    if (!isSecureContext()) {
      alert('Cloud sync requires HTTPS or localhost.\n\nYou are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n\nCloud sync will not work over HTTP from LAN IP.');
      updateCloudStatus('Requires HTTPS/localhost', 'error');
      return;
    }
    
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
    let errorMessage = error.message;
    
    // Provide helpful message for secure context errors
    if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
      errorMessage = 'Cloud sync requires HTTPS or localhost. Please access via localhost or set up HTTPS.';
    }
    
    alert('Error creating account: ' + errorMessage);
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
    // Check secure context before attempting login/sync
    if (!isSecureContext()) {
      alert('Cloud sync requires HTTPS or localhost.\n\nYou are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n\nCloud sync will not work over HTTP from LAN IP.');
      updateCloudStatus('Requires HTTPS/localhost', 'error');
      return;
    }
    
    updateCloudStatus('Signing in...', 'syncing');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) throw error;

    if (data.session) {
      const newUserId = data.user.id;
      
      // SECURITY: Clear previous user's data when switching users
      const storedUserId = localStorage.getItem('currentCloudUserId');
      if (storedUserId && storedUserId !== newUserId) {
        console.log('⚠️ User switch detected on login - clearing previous user data');
        localStorage.setItem("healthLogs", JSON.stringify([]));
        localStorage.setItem('healthAppSettings', JSON.stringify({}));
        if (typeof renderLogs === 'function') {
          renderLogs();
        }
      }
      localStorage.setItem('currentCloudUserId', newUserId);
      
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.userId = newUserId;
      updateCloudStatus('Connected', 'success');
      showCloudSyncSection(data.user.email);
      
      // Auto-sync on login - this will load ONLY the current user's data
      await syncFromCloud();
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = error.message;
    
    // Provide helpful message for secure context errors
    if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
      errorMessage = 'Cloud sync requires HTTPS or localhost. Please access via localhost or set up HTTPS.';
    }
    
    alert('Error signing in: ' + errorMessage);
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

// Delete only health logs from cloud (keeps app settings)
async function deleteCloudLogs() {
  if (!supabaseClient || !cloudSyncState.isAuthenticated) {
    return; // Not logged in, nothing to delete
  }

  try {
    updateCloudStatus('Deleting logs from cloud...', 'syncing');
    
    // Get user
    let userId = cloudSyncState.userId;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.warn('getUser error:', userError);
      if (userError.message.includes('JWT') || userError.message.includes('session')) {
        await checkCloudAuth();
        userId = cloudSyncState.userId;
      }
    }
    
    if (user) {
      userId = user.id;
      cloudSyncState.userId = userId;
    } else if (!userId) {
      throw new Error('User not authenticated. Please sign in again.');
    }
    
    // Get current settings from cloud to preserve them
    const encryptionKey = await deriveEncryptionKey(userId, 'health-app-key');
    const { data: existingData } = await supabaseClient
      .from('health_data')
      .select('app_settings')
      .eq('user_id', userId)
      .single();
    
    // Encrypt empty logs array
    const emptyLogs = [];
    const encryptedLogs = await encryptData(emptyLogs, encryptionKey);
    
    // Keep existing settings or use empty object if none exist
    let encryptedSettings;
    if (existingData && existingData.app_settings) {
      // Keep existing settings
      encryptedSettings = existingData.app_settings;
    } else {
      // No existing settings, use empty encrypted object
      const emptySettings = {};
      encryptedSettings = await encryptData(emptySettings, encryptionKey);
    }
    
    // Update cloud with empty logs but preserved settings
    const { error: updateError } = await supabaseClient
      .from('health_data')
      .upsert({
        user_id: userId,
        health_logs: encryptedLogs, // Empty logs
        app_settings: encryptedSettings, // Preserved settings
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (updateError) throw updateError;

    const now = new Date().toISOString();
    cloudSyncState.lastSync = now;
    localStorage.setItem('cloudLastSync', now);
    const lastSyncEl = document.getElementById('cloudLastSync');
    if (lastSyncEl) lastSyncEl.textContent = `Last sync: ${new Date(now).toLocaleString()}`;
    
    updateCloudStatus('Logs deleted from cloud', 'success');
    setTimeout(() => updateCloudStatus('Connected', 'success'), 2000);
  } catch (error) {
    console.error('Delete cloud logs error:', error);
    let errorMessage = error.message;
    
    if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
      errorMessage = 'Cloud sync requires HTTPS or localhost. You are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n3. Cloud sync will not work over HTTP from LAN IP';
    }
    
    updateCloudStatus('Failed to delete cloud logs', 'error');
    throw error; // Re-throw so caller knows it failed
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
    
    // Get user - try getUser first, fallback to stored userId
    let userId = cloudSyncState.userId;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.warn('getUser error:', userError);
      // Session might be expired, try to refresh
      if (userError.message.includes('JWT') || userError.message.includes('session')) {
        // Re-check auth status
        await checkCloudAuth();
        userId = cloudSyncState.userId;
      }
    }
    
    if (user) {
      userId = user.id;
      cloudSyncState.userId = userId; // Update stored userId
    } else if (!userId) {
      throw new Error('User not authenticated. Please sign in again.');
    }
    
    const encryptionKey = await deriveEncryptionKey(userId, 'health-app-key');
    
    const encryptedLogs = await encryptData(healthLogs, encryptionKey);
    const encryptedSettings = await encryptData(appSettings, encryptionKey);
    
    const { error: logsError } = await supabaseClient
      .from('health_data')
      .upsert({
        user_id: userId,
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
    let errorMessage = error.message;
    
    // Provide helpful message for secure context errors
    if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
      errorMessage = 'Cloud sync requires HTTPS or localhost. You are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n3. Cloud sync will not work over HTTP from LAN IP';
    }
    
    alert('Error syncing to cloud: ' + errorMessage);
    updateCloudStatus('Sync failed - requires HTTPS/localhost', 'error');
  }
}

// Sync data from cloud
async function syncFromCloud() {
  if (!supabaseClient || !cloudSyncState.isAuthenticated) {
    return;
  }
  
  // Check secure context before attempting sync
  if (!isSecureContext()) {
    console.warn('⚠️ Cloud sync skipped: Requires HTTPS or localhost (currently accessing via LAN IP)');
    updateCloudStatus('Requires HTTPS/localhost', 'error');
    return;
  }

  try {
    updateCloudStatus('Syncing from cloud...', 'syncing');
    
    // Get user - try getUser first, fallback to stored userId
    let userId = cloudSyncState.userId;
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError) {
      console.warn('getUser error:', userError);
      // Session might be expired, try to refresh
      if (userError.message.includes('JWT') || userError.message.includes('session')) {
        // Re-check auth status
        await checkCloudAuth();
        userId = cloudSyncState.userId;
      }
    }
    
    if (user) {
      userId = user.id;
      cloudSyncState.userId = userId; // Update stored userId
    } else if (!userId) {
      throw new Error('User not authenticated. Please sign in again.');
    }
    
    // Check secure context before attempting encryption
    if (!isSecureContext()) {
      throw new Error('Cloud sync requires HTTPS or localhost. Please access via localhost or set up HTTPS.');
    }
    
    const encryptionKey = await deriveEncryptionKey(userId, 'health-app-key');
    
    // CRITICAL: Always filter by current user's ID to ensure data isolation
    // Use RLS (Row Level Security) and explicit filtering
    const { data, error } = await supabaseClient
      .from('health_data')
      .select('*')
      .eq('user_id', userId) // Explicitly filter by current user
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    // SECURITY: Double-check that the data belongs to the current user
    if (data) {
      // Verify the data actually belongs to this user (defense in depth)
      if (data.user_id !== userId) {
        console.error('SECURITY ERROR: Data user_id mismatch!', {
          expected: userId,
          received: data.user_id
        });
        throw new Error('Security error: Data does not belong to current user. Please sign out and sign in again.');
      }
      
      const decryptedLogs = await decryptData(data.health_logs, encryptionKey);
      const decryptedSettings = await decryptData(data.app_settings, encryptionKey);
      
      // SECURITY: Clear localStorage before loading new user's data to prevent data leakage
      // Store the current user ID in localStorage to detect user switches
      const storedUserId = localStorage.getItem('currentCloudUserId');
      if (storedUserId && storedUserId !== userId) {
        console.log('⚠️ User switch detected - clearing previous user data from localStorage');
        localStorage.setItem("healthLogs", JSON.stringify([]));
        localStorage.setItem('healthAppSettings', JSON.stringify({}));
      }
      localStorage.setItem('currentCloudUserId', userId);
      
      if (decryptedLogs) {
        // Replace local data with cloud data (don't merge to prevent data leakage)
        localStorage.setItem("healthLogs", JSON.stringify(decryptedLogs));
        if (typeof logs !== 'undefined') {
          logs = decryptedLogs;
          if (typeof renderLogs === 'function') renderLogs();
          if (typeof updateCharts === 'function') updateCharts();
        }
      }
      
      if (decryptedSettings) {
        // Replace local settings with cloud settings (don't merge to prevent data leakage)
        localStorage.setItem('healthAppSettings', JSON.stringify(decryptedSettings));
        if (typeof appSettings !== 'undefined') {
          appSettings = { ...appSettings, ...decryptedSettings };
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
    let errorMessage = error.message;
    
    // Provide helpful message for secure context errors
    if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
      errorMessage = 'Cloud sync requires HTTPS or localhost. You are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n3. Cloud sync will not work over HTTP from LAN IP';
      updateCloudStatus('Sync failed - requires HTTPS/localhost', 'error');
    } else {
      updateCloudStatus('Sync failed', 'error');
    }
    
    console.warn('💡 To use cloud sync, access the app via localhost or set up HTTPS');
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