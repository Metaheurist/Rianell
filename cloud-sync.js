// ============================================
// CLOUD SYNC WITH SUPABASE
// ============================================

// Load Supabase credentials from external config file
// The config file is excluded from Git for security
let SUPABASE_URL = null;
let SUPABASE_ANON_KEY = null;

// Try to load from supabase-config.js (if it exists)
try {
  // Check if config is available (loaded via script tag or module)
  if (typeof SUPABASE_CONFIG !== 'undefined') {
    SUPABASE_URL = SUPABASE_CONFIG.url;
    SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;
  } else if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
    SUPABASE_URL = window.SUPABASE_CONFIG.url;
    SUPABASE_ANON_KEY = window.SUPABASE_CONFIG.anonKey;
  }
} catch (e) {
  console.warn('Could not load Supabase config:', e);
}

// Fallback: If config file not loaded or contains placeholders, show warning
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
    SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || 
    SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.warn('⚠️ Supabase credentials not configured. Please update supabase-config.js with your credentials.');
  console.warn('   See supabase-config.example.js for a template.');
  console.warn('   Cloud sync will not be available until credentials are configured.');
}

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

// Security: Account lockout tracking
const accountLockout = {
  attempts: new Map(), // email -> { count, lockUntil }
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
  
  isLocked(email) {
    const record = this.attempts.get(email);
    if (!record) return false;
    
    if (record.lockUntil && Date.now() < record.lockUntil) {
      const minutesLeft = Math.ceil((record.lockUntil - Date.now()) / 60000);
      return { locked: true, minutesLeft };
    }
    
    // Lockout expired, reset
    if (record.lockUntil && Date.now() >= record.lockUntil) {
      this.attempts.delete(email);
    }
    
    return false;
  },
  
  recordFailedAttempt(email) {
    const record = this.attempts.get(email) || { count: 0 };
    record.count++;
    
    if (record.count >= this.maxAttempts) {
      record.lockUntil = Date.now() + this.lockoutDuration;
      this.attempts.set(email, record);
      return { locked: true, minutesLeft: this.lockoutDuration / 60000 };
    }
    
    this.attempts.set(email, record);
    return { locked: false, attemptsLeft: this.maxAttempts - record.count };
  },
  
  reset(email) {
    this.attempts.delete(email);
  }
};

// Security: Session timeout and token refresh
let sessionRefreshInterval = null;
const SESSION_REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
const SESSION_WARNING_TIME = 2 * 60 * 1000; // Warn 2 minutes before expiry

function startSessionMonitoring() {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
  }
  
  sessionRefreshInterval = setInterval(async () => {
    if (!supabaseClient || !cloudSyncState.isAuthenticated) {
      return;
    }
    
    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        handleSessionExpired();
        return;
      }
      
      if (!session) {
        handleSessionExpired();
        return;
      }
      
      // Check if session is about to expire (within 5 minutes)
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const timeUntilExpiry = expiresAt - Date.now();
      
      if (timeUntilExpiry < SESSION_WARNING_TIME && timeUntilExpiry > 0) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.warn('Session refresh failed:', refreshError);
          handleSessionExpired();
        } else {
          console.log('Session refreshed successfully');
        }
      } else if (timeUntilExpiry <= 0) {
        // Session already expired
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Session monitoring error:', error);
    }
  }, SESSION_REFRESH_INTERVAL);
}

function stopSessionMonitoring() {
  if (sessionRefreshInterval) {
    clearInterval(sessionRefreshInterval);
    sessionRefreshInterval = null;
  }
}

function handleSessionExpired() {
  stopSessionMonitoring();
  cloudSyncState.isAuthenticated = false;
  cloudSyncState.userId = null;
  updateCloudStatus('Session expired - please sign in again', 'error');
  showCloudAuthSection();
  
  if (typeof showAlertModal === 'function') {
    showAlertModal('Your session has expired. Please sign in again.', 'Session Expired');
  }
}

// Security: Password strength validation
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const requirements = {
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar: false // Optional, not required
  };
  
  const strength = {
    score: 0,
    level: 'weak',
    feedback: []
  };
  
  if (requirements.minLength) strength.score++;
  if (requirements.hasUpperCase) strength.score++;
  if (requirements.hasLowerCase) strength.score++;
  if (requirements.hasNumber) strength.score++;
  if (requirements.hasSpecialChar) strength.score++;
  
  if (strength.score <= 2) {
    strength.level = 'weak';
  } else if (strength.score <= 3) {
    strength.level = 'medium';
  } else {
    strength.level = 'strong';
  }
  
  if (!requirements.minLength) {
    strength.feedback.push(`At least ${minLength} characters`);
  }
  if (!requirements.hasUpperCase) {
    strength.feedback.push('One uppercase letter');
  }
  if (!requirements.hasLowerCase) {
    strength.feedback.push('One lowercase letter');
  }
  if (!requirements.hasNumber) {
    strength.feedback.push('One number');
  }
  
  return {
    isValid: requirements.minLength && requirements.hasUpperCase && 
             requirements.hasLowerCase && requirements.hasNumber,
    requirements,
    strength
  };
}

// Initialize Supabase when library loads
function initSupabase() {
  // Check if credentials are configured (not placeholders)
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || 
      SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || 
      SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
    console.warn('⚠️ Supabase credentials not configured. Cloud sync will not be available.');
    return;
  }
  
  // Check for Supabase library in various possible locations
  const SupabaseLib = window.supabase || window.supabaseClient || (typeof supabase !== 'undefined' ? supabase : null);
  if (SupabaseLib && typeof SupabaseLib.createClient === 'function') {
    supabaseClient = SupabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    checkCloudAuth();
  } else {
    console.warn('Supabase library not loaded yet');
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
      
      // Start session monitoring
      startSessionMonitoring();
      
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
    if (typeof showAlertModal === 'function') {
      showAlertModal('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.', 'Cloud Sync');
      } else {
        alert('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.');
      }
    }
    return;
  }

  const email = document.getElementById('cloudEmail').value;
  const password = document.getElementById('cloudPassword').value;

  if (!email || !password) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please enter both email and password', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Please enter both email and password', 'Cloud Sync');
      } else {
        alert('Please enter both email and password');
      }
    }
    return;
  }

  if (password.length < 6) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Password must be at least 6 characters', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Password must be at least 6 characters', 'Cloud Sync');
      } else {
        alert('Password must be at least 6 characters');
      }
    }
    return;
  }

  try {
    // Check secure context before attempting sign up
    if (!isSecureContext()) {
      const message = 'Cloud sync requires HTTPS or localhost.\n\nYou are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n\nCloud sync will not work over HTTP from LAN IP.';
      if (typeof showAlertModal === 'function') {
        showAlertModal(message, 'Cloud Sync');
      } else {
        if (typeof showAlertModal === 'function') {
          showAlertModal(message, 'Cloud Sync');
        } else {
          alert(message);
        }
      }
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
      if (typeof showAlertModal === 'function') {
        showAlertModal('Account created! Please check your email to verify your account, then sign in.', 'Account Created');
      } else {
        if (typeof showAlertModal === 'function') {
          showAlertModal('Account created! Please check your email to verify your account, then sign in.', 'Account Created');
        } else {
          alert('Account created! Please check your email to verify your account, then sign in.');
        }
      }
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
    
    if (typeof showAlertModal === 'function') {
      showAlertModal('Error creating account: ' + errorMessage, 'Sign Up Error');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Error creating account: ' + errorMessage, 'Sign Up Error');
      } else {
        alert('Error creating account: ' + errorMessage);
      }
    }
    updateCloudStatus('Sign up failed', 'error');
  }
}

// Handle login
async function handleCloudLogin() {
  if (!supabaseClient) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.', 'Cloud Sync');
      } else {
        alert('Cloud sync is not configured. Please set up Supabase credentials. See SETUP.md for instructions.');
      }
    }
    return;
  }

  const email = document.getElementById('cloudEmail').value.trim().toLowerCase();
  const password = document.getElementById('cloudPassword').value;

  if (!email || !password) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please enter both email and password', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Please enter both email and password', 'Cloud Sync');
      } else {
        alert('Please enter both email and password');
      }
    }
    return;
  }

  // Security: Check account lockout
  const lockoutStatus = accountLockout.isLocked(email);
  if (lockoutStatus && lockoutStatus.locked) {
    const message = `Account temporarily locked due to too many failed login attempts. Please try again in ${lockoutStatus.minutesLeft} minute(s).`;
    if (typeof showAlertModal === 'function') {
      showAlertModal(message, 'Account Locked');
    } else {
      alert(message);
    }
    updateCloudStatus('Account locked', 'error');
    return;
  }

  try {
    // Check secure context before attempting login/sync
    if (!isSecureContext()) {
      const message = 'Cloud sync requires HTTPS or localhost.\n\nYou are accessing via LAN IP (http://).\n\nSolutions:\n1. Use localhost: http://localhost:8080\n2. Set up HTTPS for LAN access\n\nCloud sync will not work over HTTP from LAN IP.';
      if (typeof showAlertModal === 'function') {
        showAlertModal(message, 'Cloud Sync');
      } else {
        if (typeof showAlertModal === 'function') {
          showAlertModal(message, 'Cloud Sync');
        } else {
          alert(message);
        }
      }
      updateCloudStatus('Requires HTTPS/localhost', 'error');
      return;
    }
    
    updateCloudStatus('Signing in...', 'syncing');
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      // Security: Record failed attempt
      const lockoutResult = accountLockout.recordFailedAttempt(email);
      if (lockoutResult.locked) {
        const message = `Too many failed login attempts. Account locked for ${Math.ceil(lockoutResult.minutesLeft)} minute(s).`;
        if (typeof showAlertModal === 'function') {
          showAlertModal(message, 'Account Locked');
        } else {
          alert(message);
        }
        updateCloudStatus('Account locked', 'error');
      } else {
        const message = `Invalid email or password. ${lockoutResult.attemptsLeft} attempt(s) remaining.`;
        if (typeof showAlertModal === 'function') {
          showAlertModal(message, 'Sign In Error');
        } else {
          alert(message);
        }
        updateCloudStatus('Sign in failed', 'error');
      }
      throw error;
    }

    // Security: Reset lockout on successful login
    accountLockout.reset(email);

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
      
      // Start session monitoring
      startSessionMonitoring();
      
      // Auto-sync on login - this will load ONLY the current user's data
      await syncFromCloud();
    }
  } catch (error) {
    console.error('Login error:', error);
    // Error handling already done above for lockout
    if (!error.message || (!error.message.includes('locked') && !error.message.includes('Invalid'))) {
      let errorMessage = error.message;
      
      // Provide helpful message for secure context errors
      if (errorMessage.includes('secure context') || errorMessage.includes('crypto.subtle') || errorMessage.includes('importKey')) {
        errorMessage = 'Cloud sync requires HTTPS or localhost. Please access via localhost or set up HTTPS.';
      }
      
      if (typeof showAlertModal === 'function') {
        showAlertModal('Error signing in: ' + errorMessage, 'Sign In Error');
      } else {
        if (typeof showAlertModal === 'function') {
          showAlertModal('Error signing in: ' + errorMessage, 'Sign In Error');
        } else {
          alert('Error signing in: ' + errorMessage);
        }
      }
      updateCloudStatus('Sign in failed', 'error');
    }
  }
}

// Handle logout
async function handleCloudLogout() {
  if (!supabaseClient) return;

  try {
    stopSessionMonitoring(); // Stop session monitoring on logout
    await supabaseClient.auth.signOut();
    cloudSyncState.isAuthenticated = false;
    cloudSyncState.userId = null;
    updateCloudStatus('Not connected', 'error');
    showCloudAuthSection();
    const lastSyncEl = document.getElementById('cloudLastSync');
    if (lastSyncEl) lastSyncEl.textContent = 'Last sync: Never';
  } catch (error) {
    console.error('Logout error:', error);
    if (typeof showAlertModal === 'function') {
      showAlertModal('Error signing out: ' + error.message, 'Sign Out Error');
    } else {
      alert('Error signing out: ' + error.message);
    }
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
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please sign in to sync data', 'Cloud Sync');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Please sign in to sync data', 'Cloud Sync');
      } else {
        alert('Please sign in to sync data');
      }
    }
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
    
    if (typeof showAlertModal === 'function') {
      showAlertModal('Error syncing to cloud: ' + errorMessage, 'Sync Error');
    } else {
      if (typeof showAlertModal === 'function') {
        showAlertModal('Error syncing to cloud: ' + errorMessage, 'Sync Error');
      } else {
        alert('Error syncing to cloud: ' + errorMessage);
      }
    }
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