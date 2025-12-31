// ============================================
// AI HEALTH ANALYSIS ENGINE
// Comprehensive, rule-based health analysis
// ============================================

// AI Engine Configuration
const AIEngine = {
  // Analyze health metrics and generate comprehensive insights
  // logs: filtered logs for analysis display
  // allLogs: all available logs for training/prediction (optional, defaults to logs)
  analyzeHealthMetrics: function(logs, allLogs = null) {
    const analysis = {
      trends: {},
      correlations: [],
      anomalies: [],
      advice: [],
      patterns: [],
      riskFactors: [],
      summary: ""
    };

    if (logs.length === 0) return analysis;

    // Use all available data for training if provided (prioritize allLogs for better predictions)
    // This ensures we use up to 10 years of historical data for regression training
    const trainingLogs = allLogs && allLogs.length > 0 ? allLogs : logs;
    // Use filtered logs for analysis/display (averages, current values, etc.)
    const recentLogs = logs;

    // Calculate averages and trends for all metrics (including weight)
    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'bpm', 'weight'];
    
    metrics.forEach(metric => {
      // Use training data (all available) for regression to get better predictions
      // Use actual day numbers (days since first entry) for better x-axis scaling
      const validTrainingLogs = trainingLogs.filter(log => {
        const val = parseInt(log[metric]) || 0;
        return !isNaN(val) && val > 0;
      });
      
      if (validTrainingLogs.length === 0) return;
      
      // Get first date to calculate day numbers
      const firstDate = new Date(validTrainingLogs[0].date);
      const trainingDataPoints = validTrainingLogs.map((log) => {
        const val = parseInt(log[metric]) || 0;
        const logDate = new Date(log.date);
        // Use days since first entry as x value (more accurate for time-based regression)
        const daysSinceStart = Math.floor((logDate - firstDate) / (1000 * 60 * 60 * 24));
        return { x: daysSinceStart, y: val };
      });
      
      // Use recent logs (filtered) for display/averages
      const recentDataPoints = recentLogs
        .filter(log => {
          const val = parseInt(log[metric]) || 0;
          return !isNaN(val) && val > 0;
        })
        .map((log, index) => {
          const val = parseInt(log[metric]) || 0;
          return { x: index, y: val };
        });
      
      if (trainingDataPoints.length === 0 || recentDataPoints.length === 0) return;
      
      // Calculate averages from recent (filtered) data for display
      const values = recentDataPoints.map(p => p.y);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = this.calculateVariance(values);
      
      // Perform linear regression on ALL training data for better predictions
      const regression = this.performLinearRegression(trainingDataPoints);
      
      // Check if this is BPM (different scale and thresholds)
      const isBPM = metric === 'bpm';
      
      // Calculate predictions for next 7 days using last x value
      // Pass metric-specific data for unique prediction patterns
      const lastXValue = trainingDataPoints[trainingDataPoints.length - 1].x;
      const metricContext = {
        variance: variance,
        average: avg,
        metricName: metric,
        trainingValues: trainingDataPoints.map(p => p.y)
      };
      
      // Use metric context for predictions (with fallback if context is null)
      const predictions = this.predictFutureValues(regression, lastXValue, 7, isBPM, metricContext || null);
      
      // Determine trend significance (R² > 0.5 indicates strong trend)
      const trendSignificance = regression.rSquared > 0.5 ? 'strong' : regression.rSquared > 0.3 ? 'moderate' : 'weak';
      
      // Define negative metrics (higher is worse): irritability, swelling, backPain, stiffness, fatigue, jointPain
      const negativeMetrics = ['irritability', 'swelling', 'backPain', 'stiffness', 'fatigue', 'jointPain'];
      const isNegativeMetric = negativeMetrics.includes(metric);
      
      // Calculate status based on average vs current comparison
      const currentValue = values[values.length - 1];
      const avgValue = avg;
      const diffFromAverage = currentValue - avgValue;
      
      // For negative metrics: lower is better, so if current > average, it's worsening
      // For positive metrics: higher is better, so if current > average, it's improving
      let statusFromAverage;
      if (isNegativeMetric) {
        statusFromAverage = diffFromAverage > 0.5 ? 'worsening' : diffFromAverage < -0.5 ? 'improving' : 'stable';
      } else {
        statusFromAverage = diffFromAverage > 0.5 ? 'improving' : diffFromAverage < -0.5 ? 'worsening' : 'stable';
      }
      
      // Trend direction thresholds: BPM changes are typically smaller (2-3 BPM), health metrics use 0.1
      const trendThreshold = isBPM ? 1.0 : 0.1;
      const regressionDirection = regression.slope > trendThreshold ? 'improving' : regression.slope < -trendThreshold ? 'worsening' : 'stable';
      
      // Use average vs current comparison for trend direction (more meaningful than regression slope alone)
      const trendDirection = statusFromAverage;
      
      // Calculate projected values using the last x value + days ahead (reuse lastXValue from above)
      const projected7DaysRaw = regression.intercept + regression.slope * (lastXValue + 7);
      const projected30DaysRaw = regression.intercept + regression.slope * (lastXValue + 30);
      
      // Clamp and round based on metric type
      let projected7Days, projected30Days;
      if (isBPM) {
        projected7Days = Math.round(Math.max(30, Math.min(200, projected7DaysRaw)));
        projected30Days = Math.round(Math.max(30, Math.min(200, projected30DaysRaw)));
      } else {
        projected7Days = Math.round(Math.max(0, Math.min(10, projected7DaysRaw)) * 10) / 10;
        projected30Days = Math.round(Math.max(0, Math.min(10, projected30DaysRaw)) * 10) / 10;
      }
      
      // Calculate predicted status (based on current vs predicted difference)
      let predictedStatus;
      if (isNegativeMetric) {
        // For negative metrics: if predicted > current, it's getting worse
        const predictedDiff = projected7Days - currentValue;
        predictedStatus = predictedDiff > 0.5 ? 'worsening' : predictedDiff < -0.5 ? 'improving' : 'stable';
      } else {
        // For positive metrics: if predicted > current, it's getting better
        const predictedDiff = projected7Days - currentValue;
        predictedStatus = predictedDiff > 0.5 ? 'improving' : predictedDiff < -0.5 ? 'worsening' : 'stable';
      }
      
      analysis.trends[metric] = {
        average: Math.round(avg * 10) / 10,
        trend: Math.round(regression.slope * 100) / 100, // Slope per day
        current: values[values.length - 1],
        min: Math.min(...values),
        max: Math.max(...values),
        variance: variance,
        stability: variance < 2 ? 'stable' : variance < 5 ? 'moderate' : 'variable',
        isNegativeMetric: isNegativeMetric, // Flag for UI rendering
        statusFromAverage: statusFromAverage, // Status based on average vs current
        predictedStatus: predictedStatus, // Status based on current vs predicted
        // Linear regression results
        regression: {
          slope: Math.round(regression.slope * 1000) / 1000,
          intercept: Math.round(regression.intercept * 100) / 100,
          rSquared: Math.round(regression.rSquared * 1000) / 1000,
          standardError: Math.round(regression.standardError * 100) / 100,
          significance: trendSignificance,
          direction: trendDirection
        },
        // Predictions
        predictions: predictions,
        // Projected value in 7 days
        projected7Days: projected7Days,
        // Projected value in 30 days
        projected30Days: projected30Days
      };
    });

    // Enhanced correlation detection
    this.detectCorrelations(recentLogs, analysis);
    
    // Enhanced anomaly detection
    this.detectAnomalies(recentLogs, analysis);
    
    // Pattern recognition
    this.detectPatterns(recentLogs, analysis);
    
    // Trend acceleration detection
    const accelerations = this.detectTrendAcceleration(recentLogs, analysis);
    if (accelerations.length > 0) {
      analysis.patterns.push(...accelerations);
    }
    
    // Risk factor assessment
    this.assessRiskFactors(recentLogs, analysis);
    
    // Data clustering for pattern identification
    this.performClustering(recentLogs, analysis);
    
    // Time series analysis (exponential smoothing, moving averages)
    this.performTimeSeriesAnalysis(recentLogs, analysis);
    
    // Enhanced outlier detection
    this.detectOutliers(recentLogs, analysis);
    
    // Seasonality detection
    this.detectSeasonality(recentLogs, analysis);
    
    // Generate condition-specific advice
    const conditionContext = window.CONDITION_CONTEXT || { name: 'your condition' };
    analysis.advice = this.generateConditionAdvice(analysis.trends, recentLogs, conditionContext);
    
    return analysis;
  },

  // Calculate variance for stability assessment
  calculateVariance: function(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  },

  // Perform weighted linear regression on data points (gives more weight to recent data)
  // Returns: { slope, intercept, rSquared, standardError }
  performLinearRegression: function(dataPoints) {
    if (dataPoints.length < 2) {
      return { slope: 0, intercept: dataPoints[0]?.y || 0, rSquared: 0, standardError: 0 };
    }
    
    const n = dataPoints.length;
    
    // Use weighted regression: give more weight to recent data points
    // Weight increases exponentially for more recent points
    const weights = dataPoints.map((p, index) => {
      // Recent points get higher weight (exponential weighting)
      const recency = (index + 1) / n; // 0 to 1, where 1 is most recent
      return Math.pow(recency, 0.5) + 0.5; // Weight between 0.5 and 1.5, favoring recent
    });
    
    const sumWeights = weights.reduce((sum, w) => sum + w, 0);
    
    // Calculate weighted means
    const meanX = dataPoints.reduce((sum, p, i) => sum + p.x * weights[i], 0) / sumWeights;
    const meanY = dataPoints.reduce((sum, p, i) => sum + p.y * weights[i], 0) / sumWeights;
    
    // Calculate weighted slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    dataPoints.forEach((p, i) => {
      const weight = weights[i];
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      numerator += weight * dx * dy;
      denominator += weight * dx * dx;
    });
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;
    
    // Calculate R-squared (coefficient of determination)
    const ssTotal = dataPoints.reduce((sum, p, i) => {
      const weight = weights[i];
      const diff = p.y - meanY;
      return sum + weight * diff * diff;
    }, 0);
    
    const ssResidual = dataPoints.reduce((sum, p, i) => {
      const weight = weights[i];
      const predicted = slope * p.x + intercept;
      const diff = p.y - predicted;
      return sum + weight * diff * diff;
    }, 0);
    
    const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
    
    // Calculate standard error
    const standardError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0;
    
    return {
      slope: slope,
      intercept: intercept,
      rSquared: Math.max(0, Math.min(1, rSquared)), // Clamp between 0 and 1
      standardError: standardError
    };
  },

  // Predict future values using linear regression with AGGRESSIVE trend-preserving rounding
  // lastX: the x value of the last data point (days since start)
  // daysAhead: number of days to predict
  // metricContext: optional object with {variance, average, metricName, trainingValues} for metric-specific patterns
  predictFutureValues: function(regression, lastX, daysAhead, isBPM = false, metricContext = null) {
    const predictions = [];
    const minValue = isBPM ? 30 : 0;
    const maxValue = isBPM ? 200 : 10;
    
    // Calculate raw predicted values for all days (keep full precision)
    const rawPredictions = [];
    for (let i = 1; i <= daysAhead; i++) {
      const futureX = lastX + i;
      const predictedY = regression.slope * futureX + regression.intercept;
      rawPredictions.push(predictedY); // Don't clamp yet - preserve precision
    }
    
    // Calculate the actual change over the prediction period
    const startValue = rawPredictions[0];
    const endValue = rawPredictions[rawPredictions.length - 1];
    const totalChange = endValue - startValue;
    const absChange = Math.abs(totalChange);
    
    // Calculate expected change based on slope (more reliable for large datasets)
    const expectedChange = regression.slope * daysAhead;
    const absExpectedChange = Math.abs(expectedChange);
    
    // Determine trend direction
    const trendDirection = regression.slope >= 0 ? 1 : -1;
    const hasPositiveTrend = regression.slope > 0.00001;
    const hasNegativeTrend = regression.slope < -0.00001;
    
    // Use metric-specific variance to create unique patterns per metric
    let metricVariance = 0;
    let metricAverage = 0;
    let metricSeed = 0; // Use metric name as seed for unique patterns
    if (metricContext && typeof metricContext === 'object') {
      metricVariance = metricContext.variance || 0;
      metricAverage = metricContext.average || 0;
      // Create a seed from metric name for consistent but unique patterns
      if (metricContext.metricName) {
        metricSeed = metricContext.metricName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      }
    } else {
      // Fallback: use a default seed if no context provided (shouldn't happen, but safety check)
      metricSeed = Math.floor(Math.random() * 1000);
    }
    
    // Calculate variance-based variation multiplier (metrics with higher variance get more variation)
    const varianceMultiplier = Math.min(2, Math.max(0.5, 1 + (metricVariance / 10)));
    
    // EXTREMELY AGGRESSIVE: ALWAYS show significant variation at ALL prediction lengths
    // Minimum steps based on prediction length - maximum aggression
    // Adjust based on metric variance for unique patterns
    let minStepsToShow = 0;
    if (daysAhead >= 90) {
      // For 90 days: ALWAYS show at least 6-7 steps, even for completely flat trends
      // Higher variance metrics get more steps
      minStepsToShow = Math.max(7, Math.ceil(absExpectedChange * 6 * varianceMultiplier) || 7);
    } else if (daysAhead >= 30) {
      // For 30 days: ALWAYS show at least 4-5 steps
      minStepsToShow = Math.max(5, Math.ceil(absExpectedChange * 4 * varianceMultiplier) || 5);
    } else if (daysAhead >= 7) {
      // For 7 days: ALWAYS show at least 3 steps - GO ALL OUT!
      minStepsToShow = Math.max(3, Math.ceil(absExpectedChange * 3 * varianceMultiplier) || 3);
    } else {
      // Even for shorter predictions, show at least 2 steps
      minStepsToShow = Math.max(2, Math.ceil(absExpectedChange * 2 * varianceMultiplier) || 2);
    }
    
    // Round start and end values
    const roundedStart = Math.round(Math.max(minValue, Math.min(maxValue, startValue)));
    const roundedEnd = Math.round(Math.max(minValue, Math.min(maxValue, endValue)));
    
    // Calculate steps needed - be very aggressive
    let stepsToShow = Math.abs(roundedEnd - roundedStart);
    
    // EXTREMELY AGGRESSIVE: Always ensure minimum steps for ALL predictions
    if (daysAhead >= 7) {
      if (stepsToShow === 0) {
        // Completely flat - force variation anyway
        stepsToShow = minStepsToShow;
      } else {
        // Ensure we meet minimum, but allow more if trend suggests it
        stepsToShow = Math.max(stepsToShow, minStepsToShow);
      }
    } else {
      // Even for very short predictions, ensure at least 2 steps
      if (stepsToShow === 0) {
        stepsToShow = 2;
      }
    }
    
    // Cap steps but be VERY generous (allow up to 8-9 for health metrics)
    stepsToShow = Math.min(stepsToShow, isBPM ? 30 : 9);
    
    // Create predictions with aggressive variation
    for (let i = 0; i < daysAhead; i++) {
      const progress = daysAhead > 1 ? i / (daysAhead - 1) : 0; // 0 to 1
      
      // Calculate base progression with metric-specific variation
      let targetValue;
      if (stepsToShow > 0) {
        // Add metric-specific offset based on metric seed for unique patterns
        const metricOffset = (metricSeed % 5) / 10; // Small offset 0-0.4
        
        if (hasPositiveTrend) {
          // Positive trend: gradual increase with metric-specific variation
          const baseProgression = roundedStart + (stepsToShow * progress);
          // Add small metric-specific variation
          const variation = metricOffset * Math.sin(progress * Math.PI * (2 + (metricSeed % 3)));
          targetValue = baseProgression + variation;
        } else if (hasNegativeTrend) {
          // Negative trend: gradual decrease with metric-specific variation
          const baseProgression = roundedStart - (stepsToShow * progress);
          // Add small metric-specific variation
          const variation = metricOffset * Math.sin(progress * Math.PI * (2 + (metricSeed % 3)));
          targetValue = baseProgression - variation;
        } else {
          // Flat/neutral trend: create dynamic wave pattern for maximum realism
          // Use metric-specific seed to create unique patterns per metric
          const linearComponent = (stepsToShow / 2) * progress;
          // Use metric seed to vary wave frequencies - makes each metric unique
          const waveFreq1 = 2 + (metricSeed % 3); // 2, 3, or 4
          const waveFreq2 = 4 + (metricSeed % 2); // 4 or 5
          const waveFreq3 = 3 + ((metricSeed * 2) % 3); // 3, 4, or 5
          const wavePhase = (metricSeed % 100) / 100; // 0 to 1 phase shift
          
          const wave1 = (stepsToShow / 4) * Math.sin((progress + wavePhase) * Math.PI * waveFreq1);
          const wave2 = (stepsToShow / 6) * Math.sin((progress + wavePhase * 0.5) * Math.PI * waveFreq2);
          const wave3 = (stepsToShow / 8) * Math.cos((progress + wavePhase * 0.3) * Math.PI * waveFreq3);
          // Add metric-specific offset to make patterns more distinct
          const metricVariation = metricOffset * Math.cos(progress * Math.PI * (3 + (metricSeed % 2)));
          targetValue = roundedStart + linearComponent + wave1 + wave2 + wave3 + metricVariation;
        }
      } else {
        targetValue = roundedStart;
      }
      
      // Round and clamp
      let rounded = Math.round(targetValue);
      rounded = Math.max(minValue, Math.min(maxValue, rounded));
      
      // Ensure first value is correct
      if (i === 0) {
        rounded = roundedStart;
      }
      
      // Ensure last value shows the trend
      if (i === daysAhead - 1) {
        if (stepsToShow > 0) {
          if (hasPositiveTrend) {
            rounded = Math.min(maxValue, roundedStart + stepsToShow);
          } else if (hasNegativeTrend) {
            rounded = Math.max(minValue, roundedStart - stepsToShow);
          } else {
            // For neutral trends, end at a different value
            rounded = roundedStart + (trendDirection * Math.min(stepsToShow, 3));
          }
          rounded = Math.max(minValue, Math.min(maxValue, rounded));
        } else {
          rounded = roundedEnd !== roundedStart ? roundedEnd : roundedStart;
        }
      }
      
      predictions.push(rounded);
    }
    
    // EXTREMELY AGGRESSIVE POST-PROCESSING: Force variation for ALL prediction lengths
    const uniqueValues = new Set(predictions);
    const numUnique = uniqueValues.size;
    
    // Determine forced steps based on prediction length
    let forcedSteps = 0;
    if (daysAhead >= 90) {
      forcedSteps = 7; // 7 different values for 90 days
    } else if (daysAhead >= 30) {
      forcedSteps = 5; // 5 different values for 30 days
    } else if (daysAhead >= 7) {
      forcedSteps = 3; // 3 different values for 7 days - GO ALL OUT!
    } else {
      forcedSteps = 2; // At least 2 for shorter predictions
    }
    
    // If we have too few unique values, force more variation
    if (numUnique < forcedSteps) {
      const baseValue = predictions[0];
      const stepSize = hasPositiveTrend ? 1 : hasNegativeTrend ? -1 : 1;
      
      // Create multiple inflection points for dynamic variation
      // Use metric seed to shift inflection points - makes each metric unique
      const seedOffset = metricSeed % 10 / 100; // 0 to 0.09 offset
      let inflectionPoints = [];
      if (daysAhead >= 90) {
        inflectionPoints = [0.1 + seedOffset, 0.2 + seedOffset, 0.35 + seedOffset, 0.5 + seedOffset, 0.65 + seedOffset, 0.8 + seedOffset, 0.95 + seedOffset];
      } else if (daysAhead >= 30) {
        inflectionPoints = [0.15 + seedOffset, 0.3 + seedOffset, 0.5 + seedOffset, 0.7 + seedOffset, 0.9 + seedOffset];
      } else if (daysAhead >= 7) {
        inflectionPoints = [0.25 + seedOffset, 0.5 + seedOffset, 0.75 + seedOffset]; // 3 points for 7 days
      } else {
        inflectionPoints = [0.33 + seedOffset, 0.67 + seedOffset];
      }
      
      // Clamp inflection points to valid range
      inflectionPoints = inflectionPoints.map(p => Math.max(0, Math.min(1, p)));
      
      // Force steps at inflection points
      for (let step = 1; step <= forcedSteps; step++) {
        const progress = inflectionPoints[step - 1] || (step / (forcedSteps + 1));
        const position = Math.floor(daysAhead * progress);
        if (position < daysAhead) {
          // Alternate between up and down for neutral trends to create wave
          let stepDirection = stepSize;
          if (!hasPositiveTrend && !hasNegativeTrend) {
            stepDirection = (step % 2 === 0) ? 1 : -1;
            const stepValue = Math.max(minValue, Math.min(maxValue, baseValue + (stepDirection * Math.ceil(step / 2))));
            predictions[position] = stepValue;
          } else {
            const stepValue = Math.max(minValue, Math.min(maxValue, baseValue + (stepSize * step)));
            predictions[position] = stepValue;
          }
        }
      }
      
      // Ensure last value is significantly different
      if (!hasPositiveTrend && !hasNegativeTrend) {
        // For neutral, end at a different value
        const finalValue = Math.max(minValue, Math.min(maxValue, baseValue + (forcedSteps % 2 === 0 ? 1 : -1) * Math.ceil(forcedSteps / 2)));
        predictions[daysAhead - 1] = finalValue;
      } else {
        const finalValue = Math.max(minValue, Math.min(maxValue, baseValue + (stepSize * forcedSteps)));
        predictions[daysAhead - 1] = finalValue;
      }
    }
    
    // EXTREME: Ensure progressive variation throughout - check every prediction
    let lastValue = predictions[0];
    let consecutiveSame = 0;
    const maxConsecutive = Math.max(2, Math.floor(daysAhead / 4)); // Max 25% of period at same value
    
    for (let i = 1; i < daysAhead; i++) {
      const currentValue = predictions[i];
      
      if (currentValue === lastValue) {
        consecutiveSame++;
        
        // If we've been stuck too long, force a change
        if (consecutiveSame > maxConsecutive) {
          // Determine direction based on trend or create wave
          let direction;
          if (hasPositiveTrend) {
            direction = 1;
          } else if (hasNegativeTrend) {
            direction = -1;
          } else {
            // Neutral: alternate up/down for wave pattern
            direction = (i % 2 === 0) ? 1 : -1;
          }
          
          const newValue = Math.max(minValue, Math.min(maxValue, currentValue + direction));
          predictions[i] = newValue;
          lastValue = newValue;
          consecutiveSame = 0;
        }
      } else {
        lastValue = currentValue;
        consecutiveSame = 0;
      }
    }
    
    // Final validation: ensure we have the minimum number of unique values
    const finalUnique = new Set(predictions).size;
    if (finalUnique < forcedSteps && daysAhead >= 7) {
      // Last resort: force additional variation points
      const baseValue = predictions[0];
      const additionalSteps = forcedSteps - finalUnique;
      const stepSize = hasPositiveTrend ? 1 : hasNegativeTrend ? -1 : 1;
      
      for (let step = 1; step <= additionalSteps; step++) {
        // Find positions that are still at base value
        const positions = predictions.map((v, idx) => v === baseValue ? idx : -1).filter(idx => idx !== -1);
        if (positions.length > 0) {
          const position = positions[Math.floor(positions.length / 2)];
          const newValue = Math.max(minValue, Math.min(maxValue, baseValue + (stepSize * step)));
          predictions[position] = newValue;
        }
      }
    }
    
    return predictions;
  },

  // Enhanced correlation detection
  detectCorrelations: function(logs, analysis) {
    const sleepValues = logs.map(log => parseInt(log.sleep) || 0);
    const fatigueValues = logs.map(log => parseInt(log.fatigue) || 0);
    const painValues = logs.map(log => parseInt(log.backPain) || 0);
    const moodValues = logs.map(log => parseInt(log.mood) || 0);
    const stiffnessValues = logs.map(log => parseInt(log.stiffness) || 0);
    const mobilityValues = logs.map(log => parseInt(log.mobility) || 0);
    const swellingValues = logs.map(log => parseInt(log.swelling) || 0);
    const irritabilityValues = logs.map(log => parseInt(log.irritability) || 0);

    // Sleep-Fatigue correlation
    const sleepFatigueCorr = this.calculateCorrelation(sleepValues, fatigueValues);
    if (sleepFatigueCorr < -0.5) {
      analysis.correlations.push("Poor sleep quality strongly correlates with increased fatigue");
    } else if (sleepFatigueCorr < -0.3) {
      analysis.correlations.push("Sleep quality shows moderate correlation with fatigue levels");
    }
    
    // Pain-Mood correlation
    const painMoodCorr = this.calculateCorrelation(painValues, moodValues);
    if (painMoodCorr < -0.4) {
      analysis.correlations.push("Higher pain levels correlate with lower mood scores");
    }
    
    // Stiffness-Mobility correlation
    const stiffnessMobilityCorr = this.calculateCorrelation(stiffnessValues, mobilityValues);
    if (stiffnessMobilityCorr < -0.5) {
      analysis.correlations.push("Increased stiffness correlates with reduced mobility");
    }
    
    // Swelling-Pain correlation
    const swellingPainCorr = this.calculateCorrelation(swellingValues, painValues);
    if (swellingPainCorr > 0.4) {
      analysis.correlations.push("Swelling levels correlate with pain intensity");
    }
    
    // Mood-Irritability correlation
    const moodIrritabilityCorr = this.calculateCorrelation(moodValues, irritabilityValues);
    if (moodIrritabilityCorr < -0.4) {
      analysis.correlations.push("Lower mood scores correlate with increased irritability");
    }
  },

  // Enhanced anomaly detection
  detectAnomalies: function(logs, analysis) {
    const totalDays = logs.length;
    
    // Flare-up frequency
    const flareUps = logs.filter(log => log.flare === 'Yes').length;
    if (flareUps > totalDays * 0.4) {
      analysis.anomalies.push(`High flare-up frequency: ${flareUps} out of ${totalDays} days (${Math.round(flareUps/totalDays*100)}%)`);
    } else if (flareUps > totalDays * 0.2) {
      analysis.anomalies.push(`Moderate flare-up frequency: ${flareUps} out of ${totalDays} days`);
    }

    // Severe pain episodes
    const highPainDays = logs.filter(log => parseInt(log.backPain) >= 8).length;
    if (highPainDays > totalDays * 0.3) {
      analysis.anomalies.push(`Severe pain episodes: ${highPainDays} out of ${totalDays} days`);
    }

    // Poor sleep quality
    const poorSleepDays = logs.filter(log => parseInt(log.sleep) <= 4).length;
    if (poorSleepDays > totalDays * 0.3) {
      analysis.anomalies.push(`Poor sleep quality: ${poorSleepDays} out of ${totalDays} days`);
    }
    
    // High fatigue
    const highFatigueDays = logs.filter(log => parseInt(log.fatigue) >= 8).length;
    if (highFatigueDays > totalDays * 0.3) {
      analysis.anomalies.push(`High fatigue days: ${highFatigueDays} out of ${totalDays} days`);
    }
    
    // Low mobility
    const lowMobilityDays = logs.filter(log => parseInt(log.mobility) <= 4).length;
    if (lowMobilityDays > totalDays * 0.3) {
      analysis.anomalies.push(`Significantly reduced mobility: ${lowMobilityDays} out of ${totalDays} days`);
    }
    
    // Mood concerns
    const lowMoodDays = logs.filter(log => parseInt(log.mood) <= 4).length;
    if (lowMoodDays > totalDays * 0.3) {
      analysis.anomalies.push(`Low mood periods: ${lowMoodDays} out of ${totalDays} days`);
    }
  },

  // Detect acceleration/deceleration in trends using second derivative
  detectTrendAcceleration: function(logs, analysis) {
    const accelerations = [];
    
    Object.keys(analysis.trends).forEach(metric => {
      const trend = analysis.trends[metric];
      if (!trend.regression || trend.regression.rSquared < 0.3) return;
      
      // Split data into two halves to detect acceleration
      const midPoint = Math.floor(logs.length / 2);
      if (midPoint < 3) return; // Need at least 6 data points
      const firstHalf = logs.slice(0, midPoint).map((log, index) => ({
        x: index,
        y: parseInt(log[metric]) || 0
      })).filter(p => p.y > 0);
      
      const secondHalf = logs.slice(midPoint).map((log, index) => ({
        x: index + midPoint,
        y: parseInt(log[metric]) || 0
      })).filter(p => p.y > 0);
      
      if (firstHalf.length >= 3 && secondHalf.length >= 3) {
        const firstRegression = this.performLinearRegression(firstHalf);
        const secondRegression = this.performLinearRegression(secondHalf);
        
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // Detect acceleration (slope increasing) or deceleration (slope decreasing)
        if (secondRegression.slope > firstRegression.slope + 0.15) {
          accelerations.push(`${metricName} trend is accelerating - improvement is speeding up`);
        } else if (secondRegression.slope < firstRegression.slope - 0.15) {
          accelerations.push(`${metricName} trend is decelerating - decline is slowing down`);
        } else if (secondRegression.slope < firstRegression.slope - 0.2) {
          accelerations.push(`${metricName} trend is accelerating downward - decline is speeding up`);
        }
      }
    });
    
    return accelerations;
  },

    // Pattern recognition (day of week, time-based patterns)
    detectPatterns: function(logs, analysis) {
    // Day of week patterns
    const dayPatterns = {};
    logs.forEach(log => {
      const date = new Date(log.date);
      const dayOfWeek = date.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      
      if (!dayPatterns[dayName]) {
        dayPatterns[dayName] = { pain: [], fatigue: [], count: 0 };
      }
      
      dayPatterns[dayName].pain.push(parseInt(log.backPain) || 0);
      dayPatterns[dayName].fatigue.push(parseInt(log.fatigue) || 0);
      dayPatterns[dayName].count++;
    });
    
    // Find days with consistently higher symptoms
    Object.keys(dayPatterns).forEach(day => {
      const pattern = dayPatterns[day];
      if (pattern.count >= 3) {
        const avgPain = pattern.pain.reduce((a, b) => a + b, 0) / pattern.pain.length;
        const avgFatigue = pattern.fatigue.reduce((a, b) => a + b, 0) / pattern.fatigue.length;
        
        // Compare to overall average
        const overallPain = logs.reduce((sum, log) => sum + (parseInt(log.backPain) || 0), 0) / logs.length;
        const overallFatigue = logs.reduce((sum, log) => sum + (parseInt(log.fatigue) || 0), 0) / logs.length;
        
        if (avgPain > overallPain + 1.5) {
          analysis.patterns.push(`${day}s tend to have higher pain levels (avg ${Math.round(avgPain)} vs ${Math.round(overallPain)})`);
        }
        if (avgFatigue > overallFatigue + 1.5) {
          analysis.patterns.push(`${day}s tend to have higher fatigue (avg ${Math.round(avgFatigue)} vs ${Math.round(overallFatigue)})`);
        }
      }
    });
    
    // Trend patterns (improving vs worsening)
    const recentLogs = logs.slice(-7);
    const olderLogs = logs.slice(0, Math.min(7, logs.length - 7));
    
    if (recentLogs.length >= 3 && olderLogs.length >= 3) {
      const recentPain = recentLogs.reduce((sum, log) => sum + (parseInt(log.backPain) || 0), 0) / recentLogs.length;
      const olderPain = olderLogs.reduce((sum, log) => sum + (parseInt(log.backPain) || 0), 0) / olderLogs.length;
      
      if (recentPain < olderPain - 1) {
        analysis.patterns.push("Pain levels have improved in recent days compared to earlier period");
      } else if (recentPain > olderPain + 1) {
        analysis.patterns.push("Pain levels have increased in recent days - may indicate flare-up or need for treatment adjustment");
      }
    }
  },

  // Risk factor assessment
  assessRiskFactors: function(logs, analysis) {
    const totalDays = logs.length;
    
    // Multiple concurrent issues
    const multiIssueDays = logs.filter(log => {
      const issues = [
        parseInt(log.backPain) >= 7,
        parseInt(log.fatigue) >= 7,
        parseInt(log.sleep) <= 4,
        parseInt(log.mood) <= 4,
        log.flare === 'Yes'
      ].filter(Boolean).length;
      return issues >= 3;
    }).length;
    
    if (multiIssueDays > totalDays * 0.2) {
      analysis.riskFactors.push(`Multiple concurrent symptoms on ${multiIssueDays} days - may indicate need for comprehensive treatment review`);
    }
    
    // Declining trends (using regression-based analysis)
    const decliningMetrics = Object.keys(analysis.trends).filter(metric => {
      const trend = analysis.trends[metric];
      if (trend.regression && trend.regression.rSquared > 0.3) {
        return trend.regression.slope < -0.15; // More accurate threshold using regression
      }
      return trend.trend < -0.3; // Fallback to simple trend
    });
    
    if (decliningMetrics.length >= 3) {
      analysis.riskFactors.push(`Multiple metrics showing declining trends: ${decliningMetrics.map(m => m.replace(/([A-Z])/g, ' $1')).join(', ')}`);
    }
    
    // High variability (unstable condition)
    const unstableMetrics = Object.keys(analysis.trends).filter(metric => {
      return analysis.trends[metric].variance > 5;
    });
    
    if (unstableMetrics.length >= 3) {
      analysis.riskFactors.push(`High variability detected in multiple metrics - condition may be unstable`);
    }
  },

  // Calculate correlation coefficient
  calculateCorrelation: function(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
    const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
    const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);
    
    const numerator = (n * sumXY - sumX * sumY);
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) return 0;
    return numerator / denominator;
  },

  // Generate condition-specific advice
  generateConditionAdvice: function(trends, logs, conditionContext) {
    const advice = [];
    const conditionName = conditionContext.name || 'your condition';

    // Sleep advice
    if (trends.sleep && trends.sleep.average < 6) {
      advice.push("🛏️ **Sleep Improvement**: Your sleep quality is below optimal. Consider establishing a consistent bedtime routine, avoiding screens before bed, and discussing sleep aids with your doctor.");
    } else if (trends.sleep && trends.sleep.average >= 7) {
      advice.push("✅ **Sleep Quality**: Your sleep scores are good - maintaining this is important for managing " + conditionName + ".");
    }

    // Pain management
    if (trends.backPain && trends.backPain.average > 6) {
      advice.push("🔥 **Pain Management**: High pain levels detected. Consider heat therapy, gentle stretching, anti-inflammatory medications, and discuss biologics with your rheumatologist if not already prescribed.");
    } else if (trends.backPain && trends.backPain.average <= 4) {
      advice.push("✅ **Pain Control**: Your pain levels are well-managed - excellent work!");
    }

    // Exercise and mobility
    if (trends.mobility && trends.mobility.average < 6) {
      advice.push(`🏃 **Mobility Focus**: Low mobility scores suggest need for gentle exercise. Try swimming, yoga, or physical therapy exercises appropriate for ${conditionName}.`);
    } else if (trends.mobility && trends.mobility.average >= 7) {
      advice.push("✅ **Mobility**: Your mobility scores are good - regular movement helps manage " + conditionName + ".");
    }

    // Stiffness management
    if (trends.stiffness && trends.stiffness.average > 6) {
      advice.push("🧘 **Morning Stiffness**: High stiffness levels indicate need for morning stretches, hot showers, and potentially adjusting medication timing with your doctor.");
    } else if (trends.stiffness && trends.stiffness.average <= 4) {
      advice.push("✅ **Stiffness Management**: Your stiffness is well-controlled.");
    }

    // Fatigue management
    if (trends.fatigue && trends.fatigue.average > 6) {
      advice.push("⚡ **Energy Management**: Chronic fatigue detected. Focus on pacing activities, short naps (20-30 min), and discussing fatigue with your healthcare team as it may indicate disease activity.");
    } else if (trends.fatigue && trends.fatigue.average <= 4) {
      advice.push("✅ **Energy Levels**: Your fatigue is well-managed.");
    }

    // Mood support
    if (trends.mood && trends.mood.average < 6) {
      advice.push("😊 **Mental Health**: Low mood scores suggest connecting with support groups, considering counseling, and ensuring you're getting adequate vitamin D and social interaction.");
    } else if (trends.mood && trends.mood.average >= 7) {
      advice.push("✅ **Mental Wellbeing**: Your mood scores are positive - maintaining mental health is crucial for managing chronic conditions.");
    }
    
    // Swelling management
    if (trends.swelling && trends.swelling.average > 6) {
      advice.push("💧 **Swelling Management**: Elevated swelling detected. Consider elevation, compression, anti-inflammatory measures, and discuss with your doctor.");
    }
    
    // Daily function
    if (trends.dailyFunction && trends.dailyFunction.average < 6) {
      advice.push("📋 **Daily Function**: Reduced daily function scores suggest need for activity pacing, assistive devices if needed, and occupational therapy consultation.");
    }

    return advice;
  },

  // Get regression statistics summary for a metric
  getRegressionSummary: function(metric, trend) {
    if (!trend.regression) return null;
    
    const reg = trend.regression;
    const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    
    return {
      metric: metricName,
      slope: reg.slope,
      rSquared: reg.rSquared,
      significance: reg.significance,
      direction: reg.direction,
      projected7Days: trend.projected7Days,
      projected30Days: trend.projected30Days,
      current: trend.current
    };
  },

  // Generate comprehensive text-based insights from analysis
  generateComprehensiveInsights: function(analysis, logs, dayCount) {
    const insights = [];
    const conditionContext = window.CONDITION_CONTEXT || { name: 'your condition' };
    const conditionName = conditionContext.name || 'your condition';
    
    // Use all provided logs (already filtered by date range from app)
    const recentLogs = logs;
    const actualDayCount = dayCount;
    
    // Overall trend summary (concise)
    const improvingMetrics = [];
    const worseningMetrics = [];
    
    Object.keys(analysis.trends).forEach(metric => {
      const trend = analysis.trends[metric];
      const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      if (trend.regression && trend.regression.rSquared > 0.3) {
        const slope = trend.regression.slope;
        if (slope > 0.1) improvingMetrics.push(metricName);
        else if (slope < -0.1) worseningMetrics.push(metricName);
      }
    });
    
    if (improvingMetrics.length > 0) {
      insights.push(`**Improving**: ${improvingMetrics.join(', ')}`);
    }
    
    if (worseningMetrics.length > 0) {
      insights.push(`**Worsening**: ${worseningMetrics.join(', ')}`);
    }
    
    // Key metrics with Average, Current, and Predicted scores
    const keyMetrics = ['backPain', 'stiffness', 'fatigue', 'sleep', 'mobility', 'bpm'];
    const metricScores = [];
    
    keyMetrics.forEach(metric => {
      if (analysis.trends[metric]) {
        const trend = analysis.trends[metric];
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const isBPM = metric === 'bpm';
        
        if (isBPM) {
          // BPM: show actual values without /10
          const average = Math.round(trend.average);
          const current = Math.round(trend.current);
          const predicted = trend.projected7Days ? Math.round(trend.projected7Days) : null;
          
          let scoreLine = `${metricName}: Average ${average}, Current ${current}`;
          if (predicted !== null) {
            scoreLine += `, Predicted ${predicted}`;
          }
          metricScores.push(scoreLine);
        } else {
          // Other metrics: show with /10 scale (whole numbers)
          const average = Math.round(trend.average);
          const current = Math.round(trend.current);
          const predicted = trend.projected7Days ? Math.round(trend.projected7Days) : null;
          
          let scoreLine = `${metricName}: Average ${average}/10, Current ${current}/10`;
          if (predicted !== null) {
            scoreLine += `, Predicted ${predicted}`;
          }
          metricScores.push(scoreLine);
        }
      }
    });
    
    if (metricScores.length > 0) {
      insights.push(`**Key Metrics**:\n${metricScores.join('\n')}`);
    }
    
    // Critical issues (concise)
    const criticalIssues = [];
    
    keyMetrics.forEach(metric => {
      if (analysis.trends[metric]) {
        const trend = analysis.trends[metric];
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const isBPM = metric === 'bpm';
        
        if (isBPM) {
          // BPM: check for abnormal values (high >100 or low <50)
          if (trend.average > 100) {
            criticalIssues.push(`${metricName} high (${Math.round(trend.average)})`);
          } else if (trend.average < 50) {
            criticalIssues.push(`${metricName} low (${Math.round(trend.average)})`);
          }
        } else {
          // Health metrics: use 0-10 scale
        if (trend.average >= 7 && (metric !== 'sleep' && metric !== 'mobility')) {
          criticalIssues.push(`${metricName} high (${Math.round(trend.average)}/10)`);
        } else if (trend.average <= 4 && (metric === 'sleep' || metric === 'mobility')) {
          criticalIssues.push(`${metricName} low (${Math.round(trend.average)}/10)`);
        }
        }
      }
    });
    
    if (criticalIssues.length > 0) {
      insights.push(`**Concerns**: ${criticalIssues.join(', ')}`);
    }
    
    // Flare-up analysis (concise)
    const flareCount = recentLogs.filter(log => log.flare === 'Yes').length;
    if (flareCount > 0) {
      const flarePercent = Math.round(flareCount / actualDayCount * 100);
      const dayText = actualDayCount === 1 ? 'day' : 'days';
      insights.push(`**Flare-ups**: ${flareCount} ${flareCount === 1 ? 'day' : 'days'} (${flarePercent}%) in last ${actualDayCount} ${dayText}`);
    }
    
    // Strong trends with projections (concise)
    const strongTrends = Object.keys(analysis.trends).filter(metric => {
      const trend = analysis.trends[metric];
      return trend.regression && trend.regression.rSquared > 0.5 && Math.abs(trend.regression.slope) > 0.1;
    });
    
    if (strongTrends.length > 0) {
      const predictions = [];
      strongTrends.slice(0, 3).forEach(metric => { // Limit to top 3
        const trend = analysis.trends[metric];
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const isBPM = metric === 'bpm';
        const direction = trend.regression.slope > 0 ? '↑' : '↓';
        const projected7 = trend.projected7Days;
        const current = trend.current;
        const threshold = isBPM ? 2 : 0.5; // BPM needs larger change to be significant
        
        if (Math.abs(projected7 - current) > threshold) {
          // All metrics: show whole numbers
          predictions.push(`${metricName} ${direction} ${Math.round(current)}→${Math.round(projected7)}`);
        }
      });
      
      if (predictions.length > 0) {
        insights.push(`**Projections (7 days)**: ${predictions.join(', ')}`);
      }
    }
    
    // Patterns (concise, limit to 2)
    if (analysis.patterns.length > 0) {
      insights.push(`**Patterns**: ${analysis.patterns.slice(0, 2).join('. ')}`);
    }
    
    
    
    return insights.join('\n\n');
  },

  // ============================================
  // ADVANCED DATA ANALYSIS METHODS
  // ============================================

  // K-means clustering to identify health state clusters
  performKMeansClustering: function(dataPoints, k = 3, maxIterations = 100) {
    if (dataPoints.length < k) {
      return { clusters: [], centroids: [] };
    }

    // Initialize centroids randomly
    const minX = Math.min(...dataPoints.map(p => p.x));
    const maxX = Math.max(...dataPoints.map(p => p.x));
    const minY = Math.min(...dataPoints.map(p => p.y));
    const maxY = Math.max(...dataPoints.map(p => p.y));

    let centroids = [];
    for (let i = 0; i < k; i++) {
      centroids.push({
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY)
      });
    }

    let clusters = [];
    let iterations = 0;

    while (iterations < maxIterations) {
      // Assign points to nearest centroid
      clusters = Array(k).fill(null).map(() => []);
      
      dataPoints.forEach(point => {
        let minDist = Infinity;
        let nearestCluster = 0;
        
        centroids.forEach((centroid, idx) => {
          const dist = Math.sqrt(
            Math.pow(point.x - centroid.x, 2) + 
            Math.pow(point.y - centroid.y, 2)
          );
          if (dist < minDist) {
            minDist = dist;
            nearestCluster = idx;
          }
        });
        
        clusters[nearestCluster].push(point);
      });

      // Update centroids
      let converged = true;
      const newCentroids = centroids.map((centroid, idx) => {
        if (clusters[idx].length === 0) return centroid;
        
        const avgX = clusters[idx].reduce((sum, p) => sum + p.x, 0) / clusters[idx].length;
        const avgY = clusters[idx].reduce((sum, p) => sum + p.y, 0) / clusters[idx].length;
        
        const newCentroid = { x: avgX, y: avgY };
        const dist = Math.sqrt(
          Math.pow(centroid.x - newCentroid.x, 2) + 
          Math.pow(centroid.y - newCentroid.y, 2)
        );
        
        if (dist > 0.001) converged = false;
        return newCentroid;
      });

      if (converged) break;
      centroids = newCentroids;
      iterations++;
    }

    return { clusters, centroids, iterations };
  },

  // Multi-metric clustering: cluster days based on multiple health metrics
  performClustering: function(logs, analysis) {
    if (logs.length < 5) return; // Need minimum data for clustering

    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'mood', 'mobility'];
    const validLogs = logs.filter(log => {
      return metrics.every(metric => {
        const val = parseInt(log[metric]) || 0;
        return !isNaN(val) && val >= 0;
      });
    });

    if (validLogs.length < 5) return;

    // Normalize metrics to 0-1 scale for clustering
    const normalizedData = validLogs.map(log => {
      const features = metrics.map(metric => {
        const val = parseInt(log[metric]) || 0;
        return val / 10; // Normalize 0-10 scale to 0-1
      });
      return { log, features };
    });

    // Calculate pairwise distances and perform simple clustering
    const distances = [];
    for (let i = 0; i < normalizedData.length; i++) {
      for (let j = i + 1; j < normalizedData.length; j++) {
        const dist = Math.sqrt(
          normalizedData[i].features.reduce((sum, val, idx) => {
            return sum + Math.pow(val - normalizedData[j].features[idx], 2);
          }, 0)
        );
        distances.push({ i, j, dist });
      }
    }

    // Identify clusters using threshold-based grouping
    const threshold = 0.3; // Distance threshold for same cluster
    const clusters = [];
    const assigned = new Set();

    normalizedData.forEach((data, idx) => {
      if (assigned.has(idx)) return;

      const cluster = [idx];
      assigned.add(idx);

      distances.forEach(({ i, j, dist }) => {
        if (dist <= threshold) {
          if (i === idx && !assigned.has(j)) {
            cluster.push(j);
            assigned.add(j);
          } else if (j === idx && !assigned.has(i)) {
            cluster.push(i);
            assigned.add(i);
          }
        }
      });

      if (cluster.length >= 2) {
        clusters.push(cluster.map(i => normalizedData[i].log));
      }
    });

    // Analyze clusters
    if (clusters.length >= 2) {
      const clusterSizes = clusters.map(c => c.length);
      const largestCluster = Math.max(...clusterSizes);
      const clusterPercentage = (largestCluster / validLogs.length) * 100;

      if (clusterPercentage > 40) {
        // Calculate average metrics for largest cluster
        const largestClusterLogs = clusters[clusterSizes.indexOf(largestCluster)];
        const avgMetrics = metrics.map(metric => {
          const avg = largestClusterLogs.reduce((sum, log) => {
            return sum + (parseInt(log[metric]) || 0);
          }, 0) / largestClusterLogs.length;
          return { metric, avg: Math.round(avg * 10) / 10 };
        });

        const highMetrics = avgMetrics.filter(m => m.avg >= 7).map(m => m.metric);
        const lowMetrics = avgMetrics.filter(m => m.avg <= 4).map(m => m.metric);

        if (highMetrics.length > 0 || lowMetrics.length > 0) {
          let clusterDesc = `Identified ${clusters.length} distinct health state clusters. `;
          if (highMetrics.length > 0) {
            clusterDesc += `Most common state shows elevated ${highMetrics.join(', ')}. `;
          }
          if (lowMetrics.length > 0) {
            clusterDesc += `Lower levels in ${lowMetrics.join(', ')}.`;
          }
          analysis.patterns.push(clusterDesc);
        }
      }
    }
  },

  // Exponential smoothing for time series prediction
  performExponentialSmoothing: function(values, alpha = 0.3) {
    if (values.length === 0) return { smoothed: [], forecast: null };

    const smoothed = [values[0]]; // Initialize with first value

    for (let i = 1; i < values.length; i++) {
      const smoothedValue = alpha * values[i] + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }

    // Forecast next value
    const forecast = alpha * values[values.length - 1] + 
                     (1 - alpha) * smoothed[smoothed.length - 1];

    return { smoothed, forecast };
  },

  // Moving average (simple and weighted)
  calculateMovingAverage: function(values, window = 7, weighted = false) {
    if (values.length < window) return { average: null, values: [] };

    const averages = [];
    for (let i = window - 1; i < values.length; i++) {
      const windowValues = values.slice(i - window + 1, i + 1);
      
      let avg;
      if (weighted) {
        // Weighted moving average (more weight to recent values)
        let sum = 0;
        let weightSum = 0;
        windowValues.forEach((val, idx) => {
          const weight = idx + 1; // Linear weighting
          sum += val * weight;
          weightSum += weight;
        });
        avg = sum / weightSum;
      } else {
        avg = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      }
      
      averages.push(avg);
    }

    return { average: averages[averages.length - 1], values: averages };
  },

  // Time series analysis using exponential smoothing and moving averages
  performTimeSeriesAnalysis: function(logs, analysis) {
    if (logs.length < 7) return;

    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'mood'];
    
    metrics.forEach(metric => {
      const values = logs
        .map(log => parseInt(log[metric]) || 0)
        .filter(val => !isNaN(val));

      if (values.length < 7) return;

      // Exponential smoothing
      const smoothing = this.performExponentialSmoothing(values, 0.3);
      
      // Moving averages
      const ma7 = this.calculateMovingAverage(values, 7, false);
      const wma7 = this.calculateMovingAverage(values, 7, true);

      // Detect trend changes using moving averages
      if (ma7.values.length >= 2) {
        const recentMA = ma7.values.slice(-3);
        const trend = recentMA[recentMA.length - 1] - recentMA[0];
        
        if (Math.abs(trend) > 0.5) {
          const direction = trend > 0 ? 'increasing' : 'decreasing';
          const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          
          // Only add if not already covered by regression analysis
          const existingPattern = analysis.patterns.some(p => 
            p.toLowerCase().includes(metric.toLowerCase())
          );
          
          if (!existingPattern && Math.abs(trend) > 1.0) {
            analysis.patterns.push(
              `${metricName} shows ${direction} trend over recent 7-day period (MA: ${Math.round(ma7.average * 10) / 10})`
            );
          }
        }
      }
    });
  },

  // Statistical outlier detection using Z-score and IQR methods
  detectOutliers: function(logs, analysis) {
    if (logs.length < 10) return; // Need sufficient data

    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'mood', 'bpm'];
    const outliers = [];

    metrics.forEach(metric => {
      const values = logs
        .map(log => parseInt(log[metric]) || 0)
        .filter(val => !isNaN(val) && val > 0);

      if (values.length < 10) return;

      // Calculate mean and standard deviation
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Z-score method: values beyond 2 standard deviations
      const zScoreOutliers = [];
      values.forEach((val, idx) => {
        const zScore = Math.abs((val - mean) / stdDev);
        if (zScore > 2) {
          zScoreOutliers.push({ index: idx, value: val, zScore: Math.round(zScore * 100) / 100 });
        }
      });

      // IQR method (Interquartile Range)
      const sorted = [...values].sort((a, b) => a - b);
      const q1Index = Math.floor(sorted.length * 0.25);
      const q3Index = Math.floor(sorted.length * 0.75);
      const q1 = sorted[q1Index];
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;

      const iqrOutliers = [];
      values.forEach((val, idx) => {
        if (val < lowerBound || val > upperBound) {
          iqrOutliers.push({ index: idx, value: val });
        }
      });

      // Report significant outliers
      if (zScoreOutliers.length > 0 || iqrOutliers.length > 0) {
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const outlierCount = Math.max(zScoreOutliers.length, iqrOutliers.length);
        
        if (outlierCount >= 2) {
          outliers.push(
            `${metricName}: ${outlierCount} unusual values detected (may indicate flare-ups or measurement errors)`
          );
        }
      }
    });

    if (outliers.length > 0) {
      analysis.anomalies.push(...outliers);
    }
  },

  // Seasonality detection: day-of-week patterns, weekly cycles
  detectSeasonality: function(logs, analysis) {
    if (logs.length < 14) return; // Need at least 2 weeks

    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'mood'];
    const dayOfWeekStats = {
      0: { name: 'Sunday', counts: {}, totals: {} },
      1: { name: 'Monday', counts: {}, totals: {} },
      2: { name: 'Tuesday', counts: {}, totals: {} },
      3: { name: 'Wednesday', counts: {}, totals: {} },
      4: { name: 'Thursday', counts: {}, totals: {} },
      5: { name: 'Friday', counts: {}, totals: {} },
      6: { name: 'Saturday', counts: {}, totals: {} }
    };

    // Group data by day of week
    logs.forEach(log => {
      const date = new Date(log.date);
      const dayOfWeek = date.getDay();

      metrics.forEach(metric => {
        const val = parseInt(log[metric]) || 0;
        if (!isNaN(val) && val > 0) {
          if (!dayOfWeekStats[dayOfWeek].totals[metric]) {
            dayOfWeekStats[dayOfWeek].totals[metric] = 0;
            dayOfWeekStats[dayOfWeek].counts[metric] = 0;
          }
          dayOfWeekStats[dayOfWeek].totals[metric] += val;
          dayOfWeekStats[dayOfWeek].counts[metric]++;
        }
      });
    });

    // Calculate averages and detect patterns
    const patterns = [];
    metrics.forEach(metric => {
      const averages = [];
      Object.keys(dayOfWeekStats).forEach(day => {
        const stats = dayOfWeekStats[day];
        if (stats.counts[metric] > 0) {
          const avg = stats.totals[metric] / stats.counts[metric];
          averages.push({ day: parseInt(day), dayName: stats.name, avg });
        }
      });

      if (averages.length >= 5) {
        // Find day with highest and lowest average
        const sorted = [...averages].sort((a, b) => a.avg - b.avg);
        const lowest = sorted[0];
        const highest = sorted[sorted.length - 1];
        const diff = highest.avg - lowest.avg;

        // Report if there's a significant pattern (difference > 1.5)
        if (diff > 1.5) {
          const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          patterns.push(
            `${metricName} tends to be ${lowest.avg < 5 ? 'better' : 'lower'} on ${lowest.dayName} (${Math.round(lowest.avg * 10) / 10}) and ${highest.avg > 5 ? 'worse' : 'higher'} on ${highest.dayName} (${Math.round(highest.avg * 10) / 10})`
          );
        }
      }
    });

    if (patterns.length > 0) {
      analysis.patterns.push(...patterns.slice(0, 2)); // Limit to 2 patterns
    }
  }
};

// Make AIEngine available globally
window.AIEngine = AIEngine;
