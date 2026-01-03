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
      url: 'https://YOUR_PROJECT_REF.supabase.co',
      anonKey: 'YOUR_SUPABASE_ANON_KEY'
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
  
  // Check if medical condition is set and not the placeholder
  const medicalCondition = window.appSettings?.medicalCondition || '';
  const isPlaceholder = !medicalCondition || medicalCondition.trim() === '' || medicalCondition.trim().toLowerCase() === 'medical condition';
  
  if (isPlaceholder) {
    console.warn('[syncAnonymizedData] Medical condition not set or is placeholder. Cannot sync anonymized data.');
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
    
    // Get medical condition (already validated above, but use the validated variable)
    // medicalCondition was already validated and set above
    
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
          // Check for encryption function in multiple ways (window, global, or direct)
          const encryptFn = window.encryptAnonymizedData || (typeof encryptAnonymizedData !== 'undefined' ? encryptAnonymizedData : null);
          
          if (encryptFn && typeof encryptFn === 'function') {
            try {
              encryptedLog = await encryptFn(anonymizedLog);
              if (!encryptedLog) {
                console.error(`[syncAnonymizedData] Encryption returned null/undefined for date ${log.date}`);
                continue; // Skip this log
              }
              console.log(`[syncAnonymizedData] Successfully encrypted log for date ${log.date}`);
            } catch (encryptError) {
              console.error(`[syncAnonymizedData] Encryption error for date ${log.date}:`, encryptError);
              continue; // Skip this log
            }
          } else {
            // Fallback: use JSON string if encryption not available
            console.warn('[syncAnonymizedData] encryptAnonymizedData not available, using plain JSON');
            console.warn('[syncAnonymizedData] window.encryptAnonymizedData:', typeof window.encryptAnonymizedData);
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
          // Use safe error logging to prevent information leakage
          if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
            window.SecurityUtils.safeLogError(`[syncAnonymizedData] Error processing log for date ${log.date}`, error);
          } else {
            console.error(`[syncAnonymizedData] Error processing log for date ${log.date}`);
          }
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
            // Use safe error logging to prevent information leakage
            if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
              window.SecurityUtils.safeLogError('[syncAnonymizedData] Error syncing batch to Supabase', error);
            } else {
              console.error('[syncAnonymizedData] Error syncing batch to Supabase');
            }
            
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
              // Add CSRF protection
              const headers = { 'Content-Type': 'application/json' };
              if (window.SecurityUtils && window.SecurityUtils.addCSRFHeader) {
                window.SecurityUtils.addCSRFHeader(headers);
              }
              
              const logResponse = await fetch('/api/sync-log', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ 
                  synced_count: batchData.length, 
                  condition: medicalCondition 
                })
              });
              if (!logResponse.ok) {
                console.warn(`[syncAnonymizedData] Server log response not OK: ${logResponse.status}`);
              }
            } catch (logError) {
              // Use safe error logging
              if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
                window.SecurityUtils.safeLogError('[syncAnonymizedData] Error sending sync log to server', logError);
              } else {
                console.error('[syncAnonymizedData] Error sending sync log to server');
              }
            }
          }
        } catch (error) {
          // Use safe error logging to prevent information leakage
          if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
            window.SecurityUtils.safeLogError('[syncAnonymizedData] Error posting batch to Supabase', error);
          } else {
            console.error('[syncAnonymizedData] Error posting batch to Supabase');
          }
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
      // Use safe error logging to prevent information leakage
      if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
        window.SecurityUtils.safeLogError('[syncAnonymizedData] Error in syncAnonymizedData', error);
      } else {
        console.error('[syncAnonymizedData] Error in syncAnonymizedData');
      }
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
 * Cloud authentication functions
 * Implements Supabase Auth with email verification
 */

// Cloud sync state management
const cloudSyncState = {
  isAuthenticated: false,
  user: null,
  autoSync: false,
  lastSync: null
};

// Initialize cloud sync state from localStorage
function loadCloudSyncState() {
  try {
    const saved = localStorage.getItem('cloudSyncState');
    if (saved) {
      const parsed = JSON.parse(saved);
      cloudSyncState.isAuthenticated = parsed.isAuthenticated || false;
      cloudSyncState.autoSync = parsed.autoSync || false;
      cloudSyncState.lastSync = parsed.lastSync || null;
    }
  } catch (error) {
    console.error('Error loading cloud sync state:', error);
  }
}

// Save cloud sync state to localStorage
function saveCloudSyncState() {
  try {
    localStorage.setItem('cloudSyncState', JSON.stringify({
      isAuthenticated: cloudSyncState.isAuthenticated,
      autoSync: cloudSyncState.autoSync,
      lastSync: cloudSyncState.lastSync
    }));
  } catch (error) {
    console.error('Error saving cloud sync state:', error);
  }
}

// Update cloud sync UI
function updateCloudSyncUI() {
  const authSection = document.getElementById('cloudAuthSection');
  const syncSection = document.getElementById('cloudSyncSection');
  const statusText = document.getElementById('cloudStatusText');
  const statusIndicator = document.getElementById('cloudStatusIndicator');
  const userEmail = document.getElementById('cloudUserEmail');
  const autoSyncCheckbox = document.getElementById('cloudAutoSync');
  const lastSyncText = document.getElementById('cloudLastSync');
  
  if (cloudSyncState.isAuthenticated && cloudSyncState.user) {
    // Show sync section, hide auth section
    if (authSection) authSection.style.display = 'none';
    if (syncSection) syncSection.style.display = 'block';
    if (statusText) statusText.textContent = 'Connected';
    if (statusIndicator) {
      statusIndicator.style.backgroundColor = '#4caf50';
      statusIndicator.title = 'Connected to cloud';
    }
    if (userEmail && cloudSyncState.user.email) {
      userEmail.textContent = cloudSyncState.user.email;
    }
    if (autoSyncCheckbox) {
      autoSyncCheckbox.checked = cloudSyncState.autoSync;
    }
    if (lastSyncText) {
      if (cloudSyncState.lastSync) {
        const lastSyncDate = new Date(cloudSyncState.lastSync);
        lastSyncText.textContent = `Last sync: ${lastSyncDate.toLocaleString()}`;
      } else {
        lastSyncText.textContent = 'Last sync: Never';
      }
    }
  } else {
    // Show auth section, hide sync section
    if (authSection) authSection.style.display = 'block';
    if (syncSection) syncSection.style.display = 'none';
    if (statusText) statusText.textContent = 'Not connected';
    if (statusIndicator) {
      statusIndicator.style.backgroundColor = '#f44336';
      statusIndicator.title = 'Not connected';
    }
    // Clear email field
    const emailInput = document.getElementById('cloudEmail');
    const passwordInput = document.getElementById('cloudPassword');
    if (emailInput) emailInput.value = '';
    if (passwordInput) passwordInput.value = '';
  }
}

// Check authentication status on load
async function checkAuthStatus() {
  const client = initSupabase();
  if (!client) {
    console.error('Supabase client not available');
    return;
  }
  
  try {
    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      console.error('Error checking auth status:', error);
      cloudSyncState.isAuthenticated = false;
      cloudSyncState.user = null;
      updateCloudSyncUI();
      return;
    }
    
    if (session && session.user) {
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.user = {
        id: session.user.id,
        email: session.user.email
      };
      saveCloudSyncState();
      updateCloudSyncUI();
      
      // Check if email is verified
      if (!session.user.email_confirmed_at) {
        if (typeof showAlertModal === 'function') {
          showAlertModal('Please verify your email address. Check your inbox for the verification email.', 'Email Verification Required');
        }
      }
    } else {
      cloudSyncState.isAuthenticated = false;
      cloudSyncState.user = null;
      updateCloudSyncUI();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    cloudSyncState.isAuthenticated = false;
    cloudSyncState.user = null;
    updateCloudSyncUI();
  }
}

// Handle cloud signup with email verification
async function handleCloudSignUp() {
  const email = document.getElementById('cloudEmail')?.value?.trim();
  const password = document.getElementById('cloudPassword')?.value;
  
  if (!email || !password) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please enter both email and password', 'Sign Up Error');
    } else {
      alert('Please enter both email and password');
    }
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please enter a valid email address', 'Invalid Email');
    } else {
      alert('Please enter a valid email address');
    }
    return;
  }
  
  // Validate password strength
  if (password.length < 6) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Password must be at least 6 characters long', 'Password Too Short');
    } else {
      alert('Password must be at least 6 characters long');
    }
    return;
  }
  
  const client = initSupabase();
  if (!client) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Supabase client not available. Please check your connection.', 'Connection Error');
    } else {
      alert('Supabase client not available');
    }
    return;
  }
  
  try {
    // Show loading state
    const signUpBtn = document.getElementById('cloudSignUpBtn');
    if (signUpBtn) {
      signUpBtn.disabled = true;
      signUpBtn.textContent = 'Creating account...';
    }
    
    // Sign up with email verification
    const { data, error } = await client.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
        data: {
          // Optional: Add any additional user metadata here
        }
      }
    });
    
    if (error) {
      // Log full error for debugging (but sanitize in user message)
      console.error('Supabase signup error details:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      throw error;
    }
    
    if (data.user) {
      // Success - email verification sent
      if (typeof showAlertModal === 'function') {
        showAlertModal(
          'Account created successfully! Please check your email to verify your account. You can sign in after verification.',
          'Account Created'
        );
      } else {
        alert('Account created! Please check your email to verify your account.');
      }
      
      // Clear password field
      const passwordInput = document.getElementById('cloudPassword');
      if (passwordInput) passwordInput.value = '';
      
      console.log('Account created:', data.user.email);
    }
  } catch (error) {
    console.error('Sign up error:', error);
    let errorMessage = 'Failed to create account. Please try again.';
    
    if (error.message) {
      if (error.message.includes('already registered') || error.message.includes('already exists') || error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.message.includes('Invalid email') || error.message.includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message.includes('Password') || error.message.includes('password')) {
        errorMessage = 'Password does not meet requirements.';
      } else if (error.message.includes('Database error') || error.message.includes('database error') || error.message.includes('finding user')) {
        errorMessage = 'Database configuration error. Please contact support or try again later.';
      } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
        errorMessage = 'Too many signup attempts. Please wait a moment and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        // Don't expose internal error messages to users - use generic message
        errorMessage = 'Failed to create account. Please check your email and password, then try again.';
      }
    }
    
    // Use safe error logging
    if (window.SecurityUtils && window.SecurityUtils.safeLogError) {
      window.SecurityUtils.safeLogError('Sign up error', error);
    } else {
      console.error('Sign up error:', error);
    }
    
    if (typeof showAlertModal === 'function') {
      showAlertModal(errorMessage, 'Sign Up Error');
    } else {
      alert(errorMessage);
    }
  } finally {
    // Reset button state
    const signUpBtn = document.getElementById('cloudSignUpBtn');
    if (signUpBtn) {
      signUpBtn.disabled = false;
      signUpBtn.innerHTML = '<span>📝 Sign Up</span>';
    }
  }
}

// Handle cloud login
async function handleCloudLogin() {
  const email = document.getElementById('cloudEmail')?.value?.trim();
  const password = document.getElementById('cloudPassword')?.value;
  
  if (!email || !password) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please enter both email and password', 'Login Error');
    } else {
      alert('Please enter both email and password');
    }
    return;
  }
  
  const client = initSupabase();
  if (!client) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Supabase client not available. Please check your connection.', 'Connection Error');
    } else {
      alert('Supabase client not available');
    }
    return;
  }
  
  try {
    // Show loading state
    const loginBtn = document.getElementById('cloudLoginBtn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing in...';
    }
    
    // Sign in
    const { data, error } = await client.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      throw error;
    }
    
    if (data.user) {
      // Check if email is verified
      if (!data.user.email_confirmed_at) {
        if (typeof showAlertModal === 'function') {
          showAlertModal(
            'Please verify your email address before signing in. Check your inbox for the verification email.',
            'Email Verification Required'
          );
        } else {
          alert('Please verify your email address before signing in.');
        }
        await client.auth.signOut();
        return;
      }
      
      // Success - user logged in
      cloudSyncState.isAuthenticated = true;
      cloudSyncState.user = {
        id: data.user.id,
        email: data.user.email
      };
      saveCloudSyncState();
      updateCloudSyncUI();
      
      // Clear password field
      const passwordInput = document.getElementById('cloudPassword');
      if (passwordInput) passwordInput.value = '';
      
      // Sync data if auto-sync is enabled
      if (cloudSyncState.autoSync) {
        setTimeout(() => syncToCloud(), 500);
      }
      
      console.log('User logged in:', data.user.email);
    }
  } catch (error) {
    console.error('Login error:', error);
    let errorMessage = 'Failed to sign in. Please check your credentials and try again.';
    
    if (error.message) {
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before signing in. Check your inbox for the verification email.';
      } else {
        errorMessage = error.message;
      }
    }
    
    if (typeof showAlertModal === 'function') {
      showAlertModal(errorMessage, 'Login Error');
    } else {
      alert(errorMessage);
    }
  } finally {
    // Reset button state
    const loginBtn = document.getElementById('cloudLoginBtn');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<span>🔐 Sign In</span>';
    }
  }
}

// Handle cloud logout
async function handleCloudLogout() {
  const client = initSupabase();
  if (!client) {
    console.error('Supabase client not available');
    return;
  }
  
  try {
    await client.auth.signOut();
    cloudSyncState.isAuthenticated = false;
    cloudSyncState.user = null;
    saveCloudSyncState();
    updateCloudSyncUI();
    
    console.log('User logged out');
  } catch (error) {
    console.error('Logout error:', error);
    if (typeof showAlertModal === 'function') {
      showAlertModal('Failed to sign out. Please try again.', 'Logout Error');
    } else {
      alert('Failed to sign out');
    }
  }
}

// Sync user's health data to cloud (health_data table)
async function syncToCloud() {
  if (!cloudSyncState.isAuthenticated || !cloudSyncState.user) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Please sign in to sync your data to the cloud.', 'Not Signed In');
    } else {
      alert('Please sign in to sync your data');
    }
    return;
  }
  
  const client = initSupabase();
  if (!client) {
    if (typeof showAlertModal === 'function') {
      showAlertModal('Supabase client not available. Please check your connection.', 'Connection Error');
    } else {
      alert('Supabase client not available');
    }
    return;
  }
  
  try {
    // Get logs from localStorage
    const logsJson = localStorage.getItem('healthLogs');
    if (!logsJson) {
      if (typeof showAlertModal === 'function') {
        showAlertModal('No health data to sync.', 'No Data');
      }
      return;
    }
    
    const logs = JSON.parse(logsJson);
    if (!Array.isArray(logs) || logs.length === 0) {
      if (typeof showAlertModal === 'function') {
        showAlertModal('No health data to sync.', 'No Data');
      }
      return;
    }
    
    // Get app settings
    const settingsJson = localStorage.getItem('healthAppSettings');
    const appSettings = settingsJson ? JSON.parse(settingsJson) : {};
    
    // Show loading state
    const syncBtn = document.getElementById('cloudSyncBtn');
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.innerHTML = '<span>🔄 Syncing...</span>';
    }
    
    // Encrypt health logs if encryption is available
    let encryptedLogs = logsJson;
    if (typeof window !== 'undefined' && window.encryptAnonymizedData) {
      try {
        encryptedLogs = window.encryptAnonymizedData(logs);
      } catch (encryptError) {
        console.warn('Encryption failed, storing as plain JSON:', encryptError);
        encryptedLogs = logsJson;
      }
    }
    
    // Encrypt app settings if encryption is available
    let encryptedSettings = settingsJson || '{}';
    if (typeof window !== 'undefined' && window.encryptAnonymizedData) {
      try {
        encryptedSettings = window.encryptAnonymizedData(appSettings);
      } catch (encryptError) {
        console.warn('Settings encryption failed, storing as plain JSON:', encryptError);
        encryptedSettings = settingsJson || '{}';
      }
    }
    
    // Upsert data (insert or update if exists) - table structure: user_id, health_logs (text), app_settings (text), updated_at
    const { data, error } = await client
      .from('health_data')
      .upsert({
        user_id: cloudSyncState.user.id,
        health_logs: encryptedLogs,
        app_settings: encryptedSettings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      throw error;
    }
    
    // Update sync state
    cloudSyncState.lastSync = new Date().toISOString();
    saveCloudSyncState();
    updateCloudSyncUI();
    
    if (typeof showAlertModal === 'function') {
      showAlertModal(
        `Successfully synced ${logs.length} health log(s) to the cloud.`,
        'Sync Complete'
      );
    } else {
      alert(`Synced ${logs.length} health log(s) to the cloud.`);
    }
    
    console.log(`Synced ${logs.length} health log(s) to cloud`);
  } catch (error) {
    console.error('Sync error:', error);
    let errorMessage = 'Failed to sync data to cloud. Please try again.';
    
    if (error.message) {
      if (error.message.includes('permission') || error.message.includes('policy')) {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        errorMessage = error.message;
      }
    }
    
    if (typeof showAlertModal === 'function') {
      showAlertModal(errorMessage, 'Sync Error');
    } else {
      alert(errorMessage);
    }
  } finally {
    // Reset button state
    const syncBtn = document.getElementById('cloudSyncBtn');
    if (syncBtn) {
      syncBtn.disabled = false;
      syncBtn.innerHTML = '<span>🔄 Sync Now</span>';
    }
  }
}

// Load user's health data from cloud
async function loadFromCloud() {
  if (!cloudSyncState.isAuthenticated || !cloudSyncState.user) {
    console.warn('Cannot load from cloud: not authenticated');
    return;
  }
  
  const client = initSupabase();
  if (!client) {
    console.error('Supabase client not available');
    return;
  }
  
  try {
    const { data, error } = await client
      .from('health_data')
      .select('health_logs, app_settings')
      .eq('user_id', cloudSyncState.user.id)
      .single();
    
    if (error) {
      // If no data found (PGRST116), that's okay - user hasn't synced yet
      if (error.code === 'PGRST116') {
        console.log('No cloud data found for user - first time sync');
        return;
      }
      throw error;
    }
    
    if (data) {
      // Decrypt health logs if encrypted
      let cloudLogsJson = data.health_logs;
      if (typeof window !== 'undefined' && window.decryptAnonymizedData && typeof cloudLogsJson === 'string') {
        try {
          const decrypted = window.decryptAnonymizedData(cloudLogsJson);
          if (decrypted && Array.isArray(decrypted)) {
            cloudLogsJson = JSON.stringify(decrypted);
          } else if (decrypted && typeof decrypted === 'object') {
            cloudLogsJson = JSON.stringify(decrypted);
          }
        } catch (decryptError) {
          console.warn('Decryption failed, trying as plain JSON:', decryptError);
          // Try parsing as plain JSON
          try {
            JSON.parse(cloudLogsJson);
          } catch (parseError) {
            console.error('Failed to parse cloud logs:', parseError);
            return;
          }
        }
      }
      
      // Parse cloud logs
      let cloudLogs = [];
      try {
        if (typeof cloudLogsJson === 'string') {
          cloudLogs = JSON.parse(cloudLogsJson);
        } else if (Array.isArray(cloudLogsJson)) {
          cloudLogs = cloudLogsJson;
        }
      } catch (parseError) {
        console.error('Failed to parse cloud logs:', parseError);
        return;
      }
      
      if (!Array.isArray(cloudLogs)) {
        console.error('Cloud logs is not an array');
        return;
      }
      
      // Decrypt and merge app settings
      if (data.app_settings) {
        let cloudSettingsJson = data.app_settings;
        if (typeof window !== 'undefined' && window.decryptAnonymizedData && typeof cloudSettingsJson === 'string') {
          try {
            const decrypted = window.decryptAnonymizedData(cloudSettingsJson);
            if (decrypted && typeof decrypted === 'object') {
              cloudSettingsJson = JSON.stringify(decrypted);
            }
          } catch (decryptError) {
            console.warn('Settings decryption failed, trying as plain JSON:', decryptError);
          }
        }
        
        try {
          const cloudSettings = JSON.parse(cloudSettingsJson);
          // Merge cloud settings with local settings (cloud takes precedence)
          if (window.appSettings && typeof window.appSettings === 'object') {
            window.appSettings = { ...window.appSettings, ...cloudSettings };
            if (typeof saveSettings === 'function') {
              saveSettings();
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse cloud settings:', parseError);
        }
      }
      
      // Merge cloud logs with local logs (cloud takes precedence for conflicts)
      const localLogs = JSON.parse(localStorage.getItem('healthLogs') || '[]');
      
      // Create a map of dates to logs (cloud data)
      const cloudLogsMap = new Map();
      cloudLogs.forEach(log => {
        if (log && log.date) {
          cloudLogsMap.set(log.date, log);
        }
      });
      
      // Merge: keep local logs that don't exist in cloud, use cloud logs for conflicts
      const mergedLogs = [];
      const processedDates = new Set();
      
      // Add cloud logs first (they take precedence)
      cloudLogs.forEach(log => {
        if (log && log.date) {
          mergedLogs.push(log);
          processedDates.add(log.date);
        }
      });
      
      // Add local logs that don't exist in cloud
      localLogs.forEach(log => {
        if (log && log.date && !processedDates.has(log.date)) {
          mergedLogs.push(log);
          processedDates.add(log.date);
        }
      });
      
      // Sort by date (newest first)
      mergedLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Save merged data
      if (window.PerformanceUtils?.StorageBatcher) {
        window.PerformanceUtils.StorageBatcher.setItem('healthLogs', JSON.stringify(mergedLogs));
      } else {
        localStorage.setItem('healthLogs', JSON.stringify(mergedLogs));
      }
      
      // Update app logs array
      if (typeof window !== 'undefined' && window.logs) {
        window.logs = mergedLogs;
      }
      
      // Refresh UI
      if (typeof renderLogs === 'function') {
        renderLogs();
      }
      if (typeof debounceChartUpdate === 'function') {
        debounceChartUpdate();
      } else if (typeof updateCharts === 'function') {
        updateCharts();
      }
      
      console.log(`Loaded ${cloudLogs.length} health log(s) from cloud`);
    }
  } catch (error) {
    console.error('Load from cloud error:', error);
    if (typeof showAlertModal === 'function') {
      showAlertModal('Failed to load data from cloud. Please try again.', 'Load Error');
    }
  }
}

// Make functions globally available
if (typeof window !== 'undefined') {
  window.handleCloudLogin = handleCloudLogin;
  window.handleCloudSignUp = handleCloudSignUp;
  window.handleCloudLogout = handleCloudLogout;
  window.syncToCloud = syncToCloud;
  window.loadFromCloud = loadFromCloud;
  window.cloudSyncState = cloudSyncState;
  window.updateCloudSyncUI = updateCloudSyncUI;
  
  // Initialize cloud sync state and check auth on load
  loadCloudSyncState();
  
  // Check auth status when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        checkAuthStatus().then(() => {
          updateCloudSyncUI();
          // Load data from cloud if authenticated
          if (cloudSyncState.isAuthenticated) {
            loadFromCloud();
          }
        });
      }, 500);
    });
  } else {
    setTimeout(() => {
      checkAuthStatus().then(() => {
        updateCloudSyncUI();
        // Load data from cloud if authenticated
        if (cloudSyncState.isAuthenticated) {
          loadFromCloud();
        }
      });
    }, 500);
  }
  
  // Listen for auth state changes
  if (typeof supabase !== 'undefined') {
    const client = initSupabase();
    if (client) {
      client.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session && session.user) {
          cloudSyncState.isAuthenticated = true;
          cloudSyncState.user = {
            id: session.user.id,
            email: session.user.email
          };
          saveCloudSyncState();
          updateCloudSyncUI();
          // Load data from cloud
          loadFromCloud();
        } else if (event === 'SIGNED_OUT') {
          cloudSyncState.isAuthenticated = false;
          cloudSyncState.user = null;
          saveCloudSyncState();
          updateCloudSyncUI();
        } else if (event === 'TOKEN_REFRESHED' && session && session.user) {
          cloudSyncState.isAuthenticated = true;
          cloudSyncState.user = {
            id: session.user.id,
            email: session.user.email
          };
          saveCloudSyncState();
        }
      });
    }
  }
  
  // Anonymized data sync functions
  window.syncAnonymizedData = syncAnonymizedData;
  window.initSupabase = initSupabase;
  window.setupBackgroundSync = setupBackgroundSync;
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
  
  // Update toggleAutoSync to work with cloud sync state
  const originalToggleAutoSync = window.toggleAutoSync;
  window.toggleAutoSync = function() {
    const checkbox = document.getElementById('cloudAutoSync');
    if (checkbox) {
      cloudSyncState.autoSync = checkbox.checked;
      saveCloudSyncState();
      console.log('Cloud auto-sync:', checkbox.checked ? 'enabled' : 'disabled');
      
      // If enabling auto-sync and authenticated, sync immediately
      if (checkbox.checked && cloudSyncState.isAuthenticated) {
        setTimeout(() => syncToCloud(), 500);
      }
    }
    // Also call original function for anonymized data sync
    if (originalToggleAutoSync) {
      originalToggleAutoSync();
    }
  };
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

