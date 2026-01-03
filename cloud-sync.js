// Cloud Sync Functions for Health App
// Handles syncing anonymized data to Supabase

// Initialize Supabase client
let supabaseClient = null;

function initSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    // Get config from window or use default
    const config = window.SUPABASE_CONFIG || {
      url: 'https://tcoynycktablxankyriw.supabase.co',
      anonKey: 'sb_publishable_nXggVFr8IphXxgOWQFlz4A_Ot79HO4e'
    };
    
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase.createClient(config.url, config.anonKey);
      window.supabaseClient = supabaseClient;
      console.log('Supabase client initialized');
      return supabaseClient;
    } else {
      console.error('Supabase library not loaded');
      return null;
    }
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return null;
  }
}

/**
 * Sync anonymized health logs to Supabase
 * Only syncs logs that haven't been synced yet
 */
async function syncAnonymizedData() {
  console.log('[syncAnonymizedData] Starting sync...');
  console.log('[syncAnonymizedData] appSettings:', window.appSettings ? {
    contributeAnonData: window.appSettings.contributeAnonData,
    demoMode: window.appSettings.demoMode,
    medicalCondition: window.appSettings.medicalCondition
  } : 'appSettings not available');
  
  // Check if contribution is enabled
  if (!window.appSettings || !window.appSettings.contributeAnonData) {
    console.log('[syncAnonymizedData] Anonymized data contribution is disabled');
    return;
  }
  
  // Check if in demo mode
  if (window.appSettings && window.appSettings.demoMode) {
    console.log('[syncAnonymizedData] Anonymized data sync skipped in demo mode');
    return;
  }
  
  // Check if medical condition is set
  if (!window.appSettings || !window.appSettings.medicalCondition) {
    console.warn('[syncAnonymizedData] Medical condition not set. Cannot sync anonymized data.');
    return;
  }
  
  // Initialize Supabase client
  if (!supabaseClient) {
    initSupabase();
  }
  
  if (!supabaseClient) {
    console.error('[syncAnonymizedData] Failed to initialize Supabase client');
    console.error('[syncAnonymizedData] supabase library available:', typeof supabase !== 'undefined');
    console.error('[syncAnonymizedData] SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
    return;
  }
  
  try {
    // Get logs from localStorage - make a copy to prevent any modifications
    const logsJson = localStorage.getItem('healthLogs');
    if (!logsJson) {
      console.log('[syncAnonymizedData] No logs found in localStorage');
      return;
    }
    
    const logs = JSON.parse(logsJson);
    if (!Array.isArray(logs) || logs.length === 0) {
      console.log('[syncAnonymizedData] No logs to sync');
      return;
    }
    
    // Create a snapshot of log dates to prevent sync from modifying localStorage
    const logDatesInLocalStorage = new Set(logs.map(log => log.date).filter(Boolean));
    console.log(`[syncAnonymizedData] Found ${logs.length} total log(s) in localStorage`);
    console.log(`[syncAnonymizedData] Log dates in localStorage:`, Array.from(logDatesInLocalStorage));
    
    // Get synced dates from localStorage (track what's already been synced)
    const syncedDatesJson = localStorage.getItem('anonymizedDataSyncedDates');
    const syncedDates = syncedDatesJson ? JSON.parse(syncedDatesJson) : [];
    const syncedDatesSet = new Set(syncedDates);
    
    // Get synced keys
    const syncedKeysJson = localStorage.getItem('anonymizedDataSyncedKeys');
    const syncedKeys = syncedKeysJson ? JSON.parse(syncedKeysJson) : [];
    const syncedKeysSet = new Set(syncedKeys);
    
    // Get medical condition
    const medicalCondition = window.appSettings.medicalCondition;
    
    console.log(`[syncAnonymizedData] Medical condition: ${medicalCondition}`);
    console.log(`[syncAnonymizedData] Synced dates count: ${syncedDates.length}`);
    console.log(`[syncAnonymizedData] Synced keys count: ${syncedKeys.length}`);
    if (syncedKeys.length > 0) {
      console.log(`[syncAnonymizedData] Sample synced keys:`, syncedKeys.slice(0, 5));
    }
    
    // Get all unique dates from logs for this condition
    const allLogDates = new Set(logs.filter(log => log.date).map(log => log.date));
    console.log(`[syncAnonymizedData] Total unique dates in localStorage: ${allLogDates.size}`);
    
    // Now check Supabase to see which dates already exist in the database
    // We check ALL dates, not just unsynced ones, to detect if Supabase was cleared
    console.log(`[syncAnonymizedData] Checking Supabase for existing records for condition: ${medicalCondition}...`);
    let existingDatesInSupabase = new Set();
    
    try {
      // Get all existing records for this condition from Supabase
      // We'll decrypt and check dates to see what's already there
      // Use pagination to handle large datasets
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data, error } = await supabaseClient
          .from('anonymized_data')
          .select('anonymized_log')
          .eq('medical_condition', medicalCondition)
          .range(from, from + pageSize - 1);
        
        if (error) {
          console.warn(`[syncAnonymizedData] Error checking existing records: ${error.message}`);
          break; // Continue with sync anyway if check fails
        }
        
        if (data && data.length > 0) {
          // Decrypt and extract dates from existing records
          for (const record of data) {
            try {
              const encryptedLog = record.anonymized_log;
              let logData = null;
              
              // Try to decrypt
              if (typeof window.decryptAnonymizedData === 'function') {
                logData = await window.decryptAnonymizedData(encryptedLog);
              } else if (typeof decryptAnonymizedData === 'function') {
                logData = await decryptAnonymizedData(encryptedLog);
              } else {
                // Fallback: try parsing as JSON
                try {
                  logData = JSON.parse(encryptedLog);
                } catch (e) {
                  // Not JSON, skip
                }
              }
              
              if (logData && logData.date) {
                existingDatesInSupabase.add(logData.date);
              }
            } catch (e) {
              // Skip records that can't be decrypted - they might be corrupted or use different encryption
              console.debug(`[syncAnonymizedData] Could not decrypt record to check date:`, e);
            }
          }
          
          hasMore = data.length === pageSize;
          from += pageSize;
        } else {
          hasMore = false;
        }
      }
      
      console.log(`[syncAnonymizedData] Found ${existingDatesInSupabase.size} existing date(s) in Supabase for condition: ${medicalCondition}`);
    } catch (error) {
      console.warn(`[syncAnonymizedData] Error checking Supabase for existing records: ${error.message}`);
      // Continue with sync anyway - better to sync than miss data
      // But we'll rely on Supabase unique constraints to prevent actual duplicates
    }
    
    // Clean up sync keys: Remove keys for dates that are marked as synced but don't exist in Supabase
    // This handles the case where Supabase was cleared but localStorage still has sync keys
    // Track which dates were stale so we don't re-sync them
    const keysToRemove = [];
    const keysToKeep = [];
    const staleDates = new Set(); // Dates that were synced but deleted from Supabase
    
    for (const syncKey of syncedKeys) {
      // Extract date from sync key (format: "YYYY-MM-DD_condition")
      const parts = syncKey.split('_');
      if (parts.length >= 2) {
        const date = parts.slice(0, -1).join('_'); // Handle dates with underscores
        const keyCondition = parts[parts.length - 1];
        
        // Only check keys for the current condition
        if (keyCondition === medicalCondition) {
          if (existingDatesInSupabase.has(date)) {
            // Date exists in Supabase, keep the key
            keysToKeep.push(syncKey);
          } else {
            // Date is marked as synced but doesn't exist in Supabase - remove it and mark as stale
            console.log(`[syncAnonymizedData] Removing stale sync key for date ${date} (not found in Supabase)`);
            keysToRemove.push(syncKey);
            staleDates.add(date);
          }
        } else {
          // Keep keys for other conditions
          keysToKeep.push(syncKey);
        }
      } else {
        // Invalid key format, keep it to be safe
        keysToKeep.push(syncKey);
      }
    }
    
    // Also clean up syncedDates for dates that don't exist in Supabase
    const datesToKeep = [];
    for (const date of syncedDates) {
      if (existingDatesInSupabase.has(date)) {
        datesToKeep.push(date);
      } else {
        console.log(`[syncAnonymizedData] Removing stale synced date ${date} (not found in Supabase)`);
        staleDates.add(date);
      }
    }
    
    // Update localStorage with cleaned sync keys and dates
    if (keysToRemove.length > 0 || datesToKeep.length !== syncedDates.length) {
      localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(keysToKeep));
      localStorage.setItem('anonymizedDataSyncedDates', JSON.stringify(datesToKeep));
      console.log(`[syncAnonymizedData] Cleaned up ${keysToRemove.length} stale sync key(s) and ${syncedDates.length - datesToKeep.length} stale date(s)`);
      
      // Update the sets for use below
      syncedKeysSet.clear();
      keysToKeep.forEach(key => syncedKeysSet.add(key));
      syncedDatesSet.clear();
      datesToKeep.forEach(date => syncedDatesSet.add(date));
    }
    
    // Now filter logs: only sync dates that:
    // 1. Haven't been synced locally (based on current sync keys after cleanup), AND
    // 2. Don't exist in Supabase
    // This prevents re-syncing dates that were deleted from Supabase
    const logsToSync = logs.filter(log => {
      if (!log.date) return false;
      
      // Check if this date exists in Supabase
      const existsInSupabase = existingDatesInSupabase.has(log.date);
      
      if (existsInSupabase) {
        // Date exists in Supabase, mark as synced locally if not already
        // CRITICAL: Only mark as synced if this log actually exists in localStorage
        // This prevents ghost entries from Supabase being marked as synced
        const syncKey = `${log.date}_${medicalCondition}`;
        if (!syncedKeysSet.has(syncKey) && !syncedDatesSet.has(log.date)) {
          // Verify this date is actually in localStorage before marking as synced
          if (logDatesInLocalStorage.has(log.date)) {
            keysToKeep.push(syncKey);
            syncedKeysSet.add(syncKey);
            console.log(`[syncAnonymizedData] Marking date ${log.date} as synced (exists in both localStorage and Supabase)`);
          } else {
            console.log(`[syncAnonymizedData] Skipping sync key for date ${log.date} - not in localStorage (ghost entry)`);
          }
        }
        return false; // Don't sync - already exists
      }
      
      // Date doesn't exist in Supabase
      // Check if it was previously synced (stale date) - don't re-sync deleted entries
      if (staleDates.has(log.date)) {
        // This date was previously synced but deleted from Supabase
        // Don't re-sync it automatically to prevent "ghost entries"
        console.log(`[syncAnonymizedData] Skipping date ${log.date} - was previously synced but deleted from Supabase`);
        return false;
      }
      
      // Check if it's currently marked as synced locally (shouldn't happen after cleanup, but check anyway)
      const syncKey = `${log.date}_${medicalCondition}`;
      const wasSyncedLocally = syncedKeysSet.has(syncKey) || syncedDatesSet.has(log.date);
      
      if (wasSyncedLocally) {
        // Shouldn't reach here after cleanup, but just in case
        return false;
      }
      
      // Date doesn't exist in Supabase and was never synced - sync it
      return true;
    });
    
    // Update localStorage with any new keys for records that exist in Supabase
    if (keysToKeep.length > syncedKeys.length) {
      localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(keysToKeep));
    }
    
    console.log(`[syncAnonymizedData] Logs to sync: ${logsToSync.length} out of ${logs.length} total log(s) (after Supabase check)`);
    
    // CRITICAL: Verify all logsToSync are actually in localStorage
    // This prevents syncing entries that don't exist locally
    const validLogsToSync = logsToSync.filter(log => {
      if (!log.date) return false;
      const exists = logDatesInLocalStorage.has(log.date);
      if (!exists) {
        console.warn(`[syncAnonymizedData] WARNING: Attempted to sync log for date ${log.date} that is not in localStorage - skipping`);
      }
      return exists;
    });
    
    if (validLogsToSync.length !== logsToSync.length) {
      console.warn(`[syncAnonymizedData] Filtered out ${logsToSync.length - validLogsToSync.length} invalid log(s) that weren't in localStorage`);
    }
    
    if (validLogsToSync.length === 0) {
      console.log('[syncAnonymizedData] All logs already exist in Supabase for current condition, or no valid logs to sync');
      return;
    }
    
    console.log(`[syncAnonymizedData] Syncing ${validLogsToSync.length} anonymized log(s) to Supabase...`);
    
    // Process logs in batches - use only valid logs that exist in localStorage
    const batchSize = 10;
    const newlySyncedDates = [];
    const newlySyncedKeys = [];
    
    for (let i = 0; i < validLogsToSync.length; i += batchSize) {
      const batch = validLogsToSync.slice(i, i + batchSize);
      const batchData = [];
      const batchDates = []; // Track dates for this batch
      const batchKeys = []; // Track keys for this batch
      
      for (const log of batch) {
        try {
          // Create anonymized version of the log (remove PII like notes, stressors, symptoms, painLocation)
          const anonymizedLog = {
            date: log.date,
            bpm: log.bpm,
            weight: log.weight,
            fatigue: log.fatigue,
            stiffness: log.stiffness,
            sleep: log.sleep,
            jointPain: log.jointPain,
            mobility: log.mobility,
            dailyFunction: log.dailyFunction,
            swelling: log.swelling,
            flare: log.flare,
            mood: log.mood,
            irritability: log.irritability,
            weatherSensitivity: log.weatherSensitivity,
            steps: log.steps,
            hydration: log.hydration,
            // Include food and exercise but anonymize names if needed
            food: log.food ? log.food.map(item => ({
              name: item.name || '',
              calories: item.calories,
              protein: item.protein
            })) : undefined,
            exercise: log.exercise,
            // Include optional fields (but NOT stressors, symptoms, painLocation - these are PII)
            energyClarity: log.energyClarity
            // Explicitly exclude: stressors, symptoms, painLocation, notes
          };
          
          // Remove undefined/null values
          Object.keys(anonymizedLog).forEach(key => {
            if (anonymizedLog[key] === undefined || anonymizedLog[key] === null || anonymizedLog[key] === '') {
              delete anonymizedLog[key];
            }
          });
          
          // Encrypt the anonymized log
          let encryptedLog;
          if (typeof encryptAnonymizedData === 'function') {
            try {
              encryptedLog = await encryptAnonymizedData(anonymizedLog);
              if (!encryptedLog) {
                console.error(`[syncAnonymizedData] Encryption returned null/undefined for date ${log.date}`);
                continue; // Skip this log
              }
            } catch (encryptError) {
              console.error(`[syncAnonymizedData] Encryption error for date ${log.date}:`, encryptError);
              continue; // Skip this log
            }
          } else {
            // Fallback: use JSON string if encryption not available
            console.warn('[syncAnonymizedData] encryptAnonymizedData not available, using plain JSON');
            encryptedLog = JSON.stringify(anonymizedLog);
          }
          
          // Add to batch
          batchData.push({
            medical_condition: medicalCondition,
            anonymized_log: encryptedLog
          });
          
          // Track dates and keys for this batch (will only be added if insert succeeds)
          batchDates.push(log.date);
          batchKeys.push(`${log.date}_${medicalCondition}`);
        } catch (error) {
          console.error(`[syncAnonymizedData] Error processing log for date ${log.date}:`, error);
        }
      }
      
      // Post batch to Supabase
      if (batchData.length > 0) {
        try {
          const { data, error } = await supabaseClient
            .from('anonymized_data')
            .insert(batchData)
            .select();
          
          if (error) {
            console.error('[syncAnonymizedData] Error syncing batch to Supabase:', error);
            console.error('[syncAnonymizedData] Error details:', JSON.stringify(error, null, 2));
            
            // Check if error is due to duplicate key/unique constraint violation
            const errorMessage = error.message || JSON.stringify(error);
            const isDuplicateError = errorMessage.includes('duplicate') || 
                                    errorMessage.includes('unique') || 
                                    errorMessage.includes('violates unique constraint') ||
                                    error.code === '23505'; // PostgreSQL unique violation code
            
            if (isDuplicateError) {
              console.warn('[syncAnonymizedData] Duplicate detected - records may already exist in Supabase');
              // Mark as synced anyway since they exist in the database
              // This prevents retrying the same data
              newlySyncedDates.push(...batchDates);
              newlySyncedKeys.push(...batchKeys);
              console.log(`[syncAnonymizedData] Marked ${batchDates.length} log(s) as synced (duplicates detected)`);
            } else {
              // Don't mark dates as synced if there was a different error
              console.log(`[syncAnonymizedData] Batch failed, not marking ${batchDates.length} log(s) as synced`);
            }
          } else {
            console.log(`[syncAnonymizedData] Successfully synced batch of ${batchData.length} log(s) to Supabase`);
            if (data && data.length > 0) {
              console.log(`[syncAnonymizedData] Inserted ${data.length} record(s), IDs:`, data.map(d => d.id));
            }
            
            // Only mark as synced if insert was successful
            newlySyncedDates.push(...batchDates);
            newlySyncedKeys.push(...batchKeys);
            console.log(`[syncAnonymizedData] Marked ${batchDates.length} log(s) as synced for condition: ${medicalCondition}`);
            
            // Send sync log to server
            try {
              const logResponse = await fetch('/api/sync-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  synced_count: batchData.length, 
                  condition: medicalCondition 
                })
              });
              if (!logResponse.ok) {
                console.warn(`[syncAnonymizedData] Server log response not OK: ${logResponse.status}`);
              }
            } catch (logError) {
              console.error('[syncAnonymizedData] Error sending sync log to server:', logError);
            }
          }
        } catch (error) {
          console.error('[syncAnonymizedData] Error posting batch to Supabase:', error);
          console.error('[syncAnonymizedData] Error details:', error.message, error.stack);
          // Don't mark dates as synced if there was an error - batchDates and batchKeys are not added
          console.log(`[syncAnonymizedData] Batch exception, not marking ${batchDates.length} log(s) as synced`);
        }
      }
    }
    
    // Update synced dates and keys in localStorage
    if (newlySyncedDates.length > 0) {
      // Update dates (for backward compatibility)
      const updatedSyncedDates = [...syncedDates, ...newlySyncedDates];
      localStorage.setItem('anonymizedDataSyncedDates', JSON.stringify(updatedSyncedDates));
      
      // Update keys (date + condition composite)
      const syncedKeysJson = localStorage.getItem('anonymizedDataSyncedKeys');
      const syncedKeys = syncedKeysJson ? JSON.parse(syncedKeysJson) : [];
      const updatedSyncedKeys = [...syncedKeys, ...newlySyncedKeys];
      localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(updatedSyncedKeys));
      
      console.log(`[syncAnonymizedData] Marked ${newlySyncedDates.length} log(s) as synced`);
    }
    
    console.log(`[syncAnonymizedData] Sync completed. Synced ${newlySyncedDates.length} log(s).`);
    
    // Log total sync to server if any records were synced
    if (newlySyncedDates.length > 0) {
      logSyncToServer(newlySyncedDates.length, medicalCondition);
    }
    
  } catch (error) {
    console.error('[syncAnonymizedData] Error in syncAnonymizedData:', error);
  }
}

/**
 * Log sync event to server console
 */
async function logSyncToServer(recordsCount, condition) {
  try {
    const response = await fetch('/api/sync-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records_synced: recordsCount,
        synced_count: recordsCount, // Also send as synced_count for compatibility
        condition: condition,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log(`[logSyncToServer] Sync logged to server: ${recordsCount} record(s) for ${condition}`);
    } else {
      console.warn(`[logSyncToServer] Failed to log sync to server: ${response.status}`);
    }
  } catch (error) {
    console.warn('[logSyncToServer] Error logging sync to server:', error);
    // Don't throw - this is just for logging, shouldn't break the sync
  }
}

// Set up automatic background syncing when contribution is enabled
function setupBackgroundSync() {
  console.log('[setupBackgroundSync] Setting up background sync...');
  
  // Clear any existing interval
  if (window.anonymizedDataSyncInterval) {
    clearInterval(window.anonymizedDataSyncInterval);
    window.anonymizedDataSyncInterval = null;
  }
  
  // Check if contribution is enabled
  if (window.appSettings && window.appSettings.contributeAnonData && !window.appSettings.demoMode) {
    console.log('[setupBackgroundSync] Contribution enabled, starting sync...');
    // Sync immediately
    if (typeof syncAnonymizedData === 'function') {
      syncAnonymizedData().catch(error => {
        console.error('[setupBackgroundSync] Error in immediate sync:', error);
      });
    } else {
      console.error('[setupBackgroundSync] syncAnonymizedData function not available!');
    }
    
    // Then sync every 5 minutes
    window.anonymizedDataSyncInterval = setInterval(() => {
      if (window.appSettings && window.appSettings.contributeAnonData && !window.appSettings.demoMode) {
        if (typeof syncAnonymizedData === 'function') {
          console.log('[setupBackgroundSync] Running scheduled sync...');
          syncAnonymizedData().catch(error => {
            console.error('[setupBackgroundSync] Error in scheduled sync:', error);
          });
        }
      } else {
        // Contribution disabled, clear interval
        if (window.anonymizedDataSyncInterval) {
          clearInterval(window.anonymizedDataSyncInterval);
          window.anonymizedDataSyncInterval = null;
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  } else {
    console.log('[setupBackgroundSync] Contribution disabled or demo mode active');
  }
}

// Toggle auto-sync for cloud sync (separate from anonymized data sync)
function toggleAutoSync() {
  // This is for cloud sync auto-sync, not anonymized data sync
  // If cloud sync functionality exists, use it
  if (typeof window.cloudSyncState !== 'undefined') {
    const checkbox = document.getElementById('cloudAutoSync');
    if (checkbox) {
      window.cloudSyncState.autoSync = checkbox.checked;
      console.log('Cloud auto-sync:', checkbox.checked ? 'enabled' : 'disabled');
    }
  } else {
    console.warn('Cloud sync not available');
  }
}

/**
 * Check if there are 90+ entries in Supabase for a given condition
 * @param {string} condition - Medical condition to check
 * @returns {Promise<{available: boolean, count: number, days: number}>}
 */
async function checkConditionDataAvailability(condition) {
  try {
    // Initialize Supabase client if needed
    if (!supabaseClient) {
      initSupabase();
    }
    
    if (!supabaseClient) {
      console.error('[checkConditionDataAvailability] Failed to initialize Supabase client');
      return { available: false, count: 0, days: 0 };
    }
    
    if (!condition) {
      return { available: false, count: 0, days: 0 };
    }
    
    // Count entries for this condition
    let totalCount = 0;
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error, count } = await supabaseClient
        .from('anonymized_data')
        .select('id, anonymized_log', { count: 'exact' })
        .eq('medical_condition', condition)
        .range(from, from + pageSize - 1);
      
      if (error) {
        console.error('[checkConditionDataAvailability] Error counting entries:', error);
        return { available: false, count: 0, days: 0 };
      }
      
      if (count !== null && count !== undefined) {
        // Use count if available (more efficient)
        totalCount = count;
        hasMore = false;
      } else if (data) {
        totalCount += data.length;
        hasMore = data.length === pageSize;
        from += pageSize;
      } else {
        hasMore = false;
      }
    }
    
    // Calculate unique days (count distinct dates from anonymized_log)
    // For efficiency, we'll estimate days as count (assuming one entry per day)
    // In a real scenario, you'd decrypt and count unique dates, but that's expensive
    const days = totalCount; // Approximation: assume one entry per day
    
    const available = totalCount >= 90;
    
    console.log(`[checkConditionDataAvailability] Condition: ${condition}, Count: ${totalCount}, Days: ${days}, Available: ${available}`);
    
    return { available, count: totalCount, days };
  } catch (error) {
    console.error('[checkConditionDataAvailability] Error:', error);
    return { available: false, count: 0, days: 0 };
  }
}

/**
 * Clear synced keys for a condition (for debugging/re-syncing)
 * @param {string} condition - Medical condition to clear keys for (optional, clears all if not provided)
 */
function clearSyncedKeys(condition = null) {
  if (condition) {
    const syncedKeysJson = localStorage.getItem('anonymizedDataSyncedKeys');
    if (syncedKeysJson) {
      const syncedKeys = JSON.parse(syncedKeysJson);
      const filteredKeys = syncedKeys.filter(key => !key.endsWith(`_${condition}`));
      localStorage.setItem('anonymizedDataSyncedKeys', JSON.stringify(filteredKeys));
      console.log(`[clearSyncedKeys] Cleared synced keys for condition: ${condition}`);
    }
  } else {
    localStorage.removeItem('anonymizedDataSyncedKeys');
    localStorage.removeItem('anonymizedDataSyncedDates');
    console.log('[clearSyncedKeys] Cleared all synced keys and dates');
  }
}

// Make functions available globally
if (typeof window !== 'undefined') {
  window.syncAnonymizedData = syncAnonymizedData;
  window.initSupabase = initSupabase;
  window.setupBackgroundSync = setupBackgroundSync;
  window.toggleAutoSync = toggleAutoSync;
  window.checkConditionDataAvailability = checkConditionDataAvailability;
  window.clearSyncedKeys = clearSyncedKeys; // For debugging
  
  // Set up background sync when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for appSettings to be loaded
      setTimeout(() => {
        setupBackgroundSync();
      }, 1000);
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      setupBackgroundSync();
    }, 1000);
  }
}

