// Improved checkConditionDataAvailability function
// Add this to your cloud-sync.js file

// Check if condition has enough data (90+ distinct days across all users) for Optimised AI
async function checkConditionDataAvailability(condition) {
  if (!supabaseClient) {
    initSupabase();
  }
  
  if (!supabaseClient || !condition) {
    console.warn('checkConditionDataAvailability: Missing supabaseClient or condition', { 
      hasClient: !!supabaseClient, 
      condition: condition 
    });
    return { available: false, days: 0, message: 'Unable to check data availability' };
  }
  
  // Normalize condition name (trim and handle case)
  const normalizedCondition = condition.trim();
  
  try {
    // First, try to use the SQL function to count distinct dates across all users for this condition
    const { data: rpcData, error: rpcError } = await supabaseClient.rpc('get_condition_data_count', {
      condition_name: normalizedCondition
    });
    
    if (rpcError) {
      console.warn('RPC function error (will use fallback):', rpcError);
      // Fallback: count manually using direct query
    } else if (rpcData !== null && rpcData !== undefined) {
      // RPC function succeeded
      const days = Number(rpcData) || 0;
      const available = days >= 90;
      
      console.log(`checkConditionDataAvailability: RPC result for "${normalizedCondition}": ${days} days`);
      
      return {
        available,
        days,
        message: available 
          ? `Optimised AI available (${days} unique days from all contributors)` 
          : `Helping the model (${days}/90 unique days collected)`
      };
    }
    
    // Fallback: Query all data for this condition and count distinct dates
    console.log(`checkConditionDataAvailability: Using fallback query for condition: "${normalizedCondition}"`);
    
    // First try exact match
    let { data: fallbackData, error: fallbackError } = await supabaseClient
      .from('anonymized_data')
      .select('anonymized_log')
      .eq('medical_condition', normalizedCondition);
    
    // If no data found with exact match, try to get all conditions to help debug
    if ((!fallbackData || fallbackData.length === 0) && !fallbackError) {
      console.log(`checkConditionDataAvailability: No exact match found. Checking available conditions...`);
      
      // Get all unique conditions to help debug
      const { data: allConditions } = await supabaseClient
        .from('anonymized_data')
        .select('medical_condition')
        .limit(1000);
      
      if (allConditions && allConditions.length > 0) {
        const uniqueConditions = [...new Set(allConditions.map(c => c.medical_condition).filter(Boolean))];
        console.log(`checkConditionDataAvailability: Available conditions in database:`, uniqueConditions);
        
        // Try case-insensitive match
        const matchingCondition = uniqueConditions.find(c => 
          c && c.toLowerCase().trim() === normalizedCondition.toLowerCase()
        );
        
        if (matchingCondition) {
          console.log(`checkConditionDataAvailability: Found case-insensitive match: "${matchingCondition}"`);
          // Retry with the exact condition name from database
          const { data: matchedData, error: matchedError } = await supabaseClient
            .from('anonymized_data')
            .select('anonymized_log')
            .eq('medical_condition', matchingCondition);
          
          if (!matchedError && matchedData) {
            fallbackData = matchedData;
            fallbackError = null;
          }
        }
      }
    }
    
    if (fallbackError) {
      console.error('Error querying anonymized_data:', fallbackError);
      return { 
        available: false, 
        days: 0, 
        message: `Error checking data: ${fallbackError.message}` 
      };
    }
    
    if (!fallbackData || fallbackData.length === 0) {
      console.log(`checkConditionDataAvailability: No data found for condition: "${normalizedCondition}"`);
      return { available: false, days: 0, message: 'No data available yet' };
    }
    
    console.log(`checkConditionDataAvailability: Found ${fallbackData.length} records for condition: "${normalizedCondition}"`);
    
    // Count distinct dates across ALL users (not just last 90 days)
    // If 2 users both contribute on the same days, that counts as those unique days
    const allDates = fallbackData
      .map(row => {
        const date = row.anonymized_log?.date;
        if (!date) return null;
        // Handle both ISO string and date string formats
        return typeof date === 'string' ? date.split('T')[0] : date;
      })
      .filter(Boolean);
    
    const uniqueDates = new Set(allDates);
    const days = uniqueDates.size;
    const available = days >= 90;
    
    console.log(`checkConditionDataAvailability: Condition "${normalizedCondition}" has ${days} unique days (${fallbackData.length} total records)`);
    
    return {
      available,
      days,
      message: available 
        ? `Optimised AI available (${days} unique days from all contributors)` 
        : `Helping the model (${days}/90 unique days collected)`
    };
  } catch (error) {
    console.error('Error in checkConditionDataAvailability:', error);
    return { 
      available: false, 
      days: 0, 
      message: `Error checking data: ${error.message}` 
    };
  }
}

