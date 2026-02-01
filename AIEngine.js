// ============================================
// AI HEALTH ANALYSIS ENGINE
// Comprehensive, rule-based health analysis
// ============================================

// Pain body diagram regions (must match app.js PAIN_BODY_REGIONS for parsing stored text; includes joint points)
const PAIN_REGIONS = [
  { id: 'head', label: 'Head' },
  { id: 'neck', label: 'Neck' },
  { id: 'chest', label: 'Chest' },
  { id: 'abdomen', label: 'Abdomen' },
  { id: 'left_shoulder', label: 'Left shoulder' },
  { id: 'left_upper_arm', label: 'Left upper arm' },
  { id: 'left_elbow', label: 'Left elbow' },
  { id: 'left_forearm', label: 'Left forearm' },
  { id: 'left_wrist', label: 'Left wrist' },
  { id: 'left_hand', label: 'Left hand' },
  { id: 'right_shoulder', label: 'Right shoulder' },
  { id: 'right_upper_arm', label: 'Right upper arm' },
  { id: 'right_elbow', label: 'Right elbow' },
  { id: 'right_forearm', label: 'Right forearm' },
  { id: 'right_wrist', label: 'Right wrist' },
  { id: 'right_hand', label: 'Right hand' },
  { id: 'left_hip', label: 'Left hip' },
  { id: 'left_thigh', label: 'Left thigh' },
  { id: 'left_knee', label: 'Left knee' },
  { id: 'left_lower_leg', label: 'Left lower leg' },
  { id: 'left_ankle', label: 'Left ankle' },
  { id: 'left_foot', label: 'Left foot' },
  { id: 'right_hip', label: 'Right hip' },
  { id: 'right_thigh', label: 'Right thigh' },
  { id: 'right_knee', label: 'Right knee' },
  { id: 'right_lower_leg', label: 'Right lower leg' },
  { id: 'right_ankle', label: 'Right ankle' },
  { id: 'right_foot', label: 'Right foot' }
];

// Parse painLocation string (e.g. "Head (mild), Left knee (pain)") into regionId -> severity (0=none, 1=mild, 2=pain)
function parsePainLocationToRegions(painLocation) {
  const map = {};
  PAIN_REGIONS.forEach(r => { map[r.id] = 0; });
  if (!painLocation || typeof painLocation !== 'string' || !painLocation.trim()) return map;
  const parts = painLocation.split(',').map(p => p.trim()).filter(p => p.length > 0);
  parts.forEach(part => {
    const lower = part.toLowerCase();
    const mild = lower.endsWith('(mild)');
    const pain = lower.endsWith('(pain)');
    const labelPart = lower.replace(/\s*\(mild\)\s*$/, '').replace(/\s*\(pain\)\s*$/, '').trim();
    if (!labelPart) return;
    const severity = mild ? 1 : (pain ? 2 : 0);
    if (severity === 0) return;
    PAIN_REGIONS.forEach(r => {
      if (r.label.toLowerCase() === labelPart || (labelPart && r.label.toLowerCase().indexOf(labelPart) >= 0)) {
        map[r.id] = severity;
      }
    });
  });
  return map;
}

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

    // Numeric metrics that exist on log entries (log schema). backPain kept for legacy/import.
    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'bpm', 'weight', 'weatherSensitivity', 'steps', 'hydration'];
    // BPM and weight: 0 means "not logged"; 0-10 sliders and steps/hydration: 0 is valid
    const requirePositive = { bpm: true, weight: true };
    
    metrics.forEach(metric => {
      const needPositive = requirePositive[metric];
      const getVal = (log) => metric === 'weight' ? parseFloat(log[metric]) : (parseInt(log[metric], 10) || 0);
      const isValid = (val) => !isNaN(val) && (needPositive ? val > 0 : val >= 0);
      const validTrainingLogs = trainingLogs.filter(log => {
        const val = getVal(log);
        return isValid(val);
      });
      
      if (validTrainingLogs.length === 0) return;
      
      const firstDate = new Date(validTrainingLogs[0].date);
      const trainingDataPoints = validTrainingLogs.map((log) => {
        const val = getVal(log);
        const logDate = new Date(log.date);
        const daysSinceStart = Math.floor((logDate - firstDate) / (1000 * 60 * 60 * 24));
        return { x: daysSinceStart, y: val };
      });
      
      const recentDataPoints = recentLogs
        .filter(log => isValid(getVal(log)))
        .map((log, index) => {
          const val = getVal(log);
          return { x: index, y: val };
        });
      
      if (trainingDataPoints.length === 0 || recentDataPoints.length === 0) return;
      
      // Calculate averages from recent (filtered) data for display
      const values = recentDataPoints.map(p => p.y);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = this.calculateVariance(values);
      
      // Check if this is BPM or Weight (different scale and thresholds)
      const isBPM = metric === 'bpm';
      const isWeight = metric === 'weight';
      const isSteps = metric === 'steps';
      const isHydration = metric === 'hydration';
      
      // Perform linear regression on ALL training data for better predictions
      const linearRegression = this.performLinearRegression(trainingDataPoints);
      
      // Try polynomial regression if linear R² is low
      let regression = linearRegression;
      let modelType = 'linear';
      let polynomialRegression = null;
      
      if (linearRegression.rSquared < 0.5 && trainingDataPoints.length >= 4) {
        // Try polynomial regression (degree 2)
        polynomialRegression = this.performPolynomialRegression(trainingDataPoints, 2);
        
        // Use polynomial if it's significantly better (R² improvement > 0.1)
        if (polynomialRegression.rSquared > linearRegression.rSquared + 0.1) {
          regression = {
            slope: polynomialRegression.coefficients[1] || 0, // Use linear term as slope approximation
            intercept: polynomialRegression.coefficients[0] || 0,
            rSquared: polynomialRegression.rSquared,
            standardError: polynomialRegression.standardError,
            polynomial: polynomialRegression
          };
          modelType = 'polynomial';
        }
      }
      
      // Try ARIMA for metrics with strong autocorrelation (if enough data)
      let arimaForecast = null;
      if (trainingDataPoints.length >= 10) {
        const trainingValues = trainingDataPoints.map(p => p.y);
        arimaForecast = this.performARIMAForecast(trainingValues, 1, 0, 0);
        
        // Compare ARIMA with regression (use ARIMA if it shows better fit for recent data)
        if (arimaForecast && arimaForecast.forecasts) {
          // Simple comparison: check if ARIMA captures recent trends better
          const recentValues = trainingValues.slice(-7);
          const recentMean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
          const arimaFirstForecast = arimaForecast.forecasts[0];
          const linearFirstForecast = linearRegression.slope * trainingDataPoints[trainingDataPoints.length - 1].x + linearRegression.intercept;
          
          // Use ARIMA if it's closer to recent trend
          const arimaError = Math.abs(arimaFirstForecast - recentMean);
          const linearError = Math.abs(linearFirstForecast - recentMean);
          
          if (arimaError < linearError * 0.8 && regression.rSquared < 0.6) {
            modelType = 'arima';
          }
        }
      }
      
      // Calculate predictions for next 7 days using last x value
      // Pass metric-specific data for unique prediction patterns
      const lastXValue = trainingDataPoints[trainingDataPoints.length - 1].x;
      const metricContext = {
        variance: variance,
        average: avg,
        metricName: metric,
        trainingValues: trainingDataPoints.map(p => p.y)
      };
      
      // Use appropriate prediction method based on model type
      let predictions;
      let predictionsWithConfidence = null;
      
      if (modelType === 'arima' && arimaForecast && arimaForecast.forecasts) {
        // Use ARIMA forecasts
        predictions = arimaForecast.forecasts.slice(0, 7).map(v => {
          // Clamp values
          if (isBPM) return Math.round(Math.max(30, Math.min(200, v)));
          if (isWeight) return Math.round(Math.max(30, Math.min(300, v)) * 10) / 10;
          if (isSteps) return Math.round(Math.max(0, Math.min(50000, v)));
          if (isHydration) return Math.round(Math.max(0, Math.min(20, v)) * 10) / 10;
          return Math.round(Math.max(0, Math.min(10, v)) * 10) / 10;
        });
      } else {
        // Use linear or polynomial regression
        predictions = this.predictFutureValues(regression, lastXValue, 7, isBPM, isWeight, metricContext || null);
      }
      
      // Calculate confidence intervals
      if (regression.standardError) {
        predictionsWithConfidence = this.predictFutureValuesWithConfidence(
          { ...regression, n: trainingDataPoints.length },
          lastXValue,
          7,
          isBPM,
          isWeight,
          metricContext,
          0.95
        );
      }
      
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
      } else if (isWeight) {
        // Weight: 30-300 kg range, keep 1 decimal place
        projected7Days = Math.round(Math.max(30, Math.min(300, projected7DaysRaw)) * 10) / 10;
        projected30Days = Math.round(Math.max(30, Math.min(300, projected30DaysRaw)) * 10) / 10;
      } else {
        // Other metrics: 0-10 scale
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
        // Regression results (linear, polynomial, or ARIMA)
        regression: {
          slope: Math.round(regression.slope * 1000) / 1000,
          intercept: Math.round(regression.intercept * 100) / 100,
          rSquared: Math.round(regression.rSquared * 1000) / 1000,
          standardError: Math.round(regression.standardError * 100) / 100,
          significance: trendSignificance,
          direction: trendDirection,
          modelType: modelType, // 'linear', 'polynomial', or 'arima'
          polynomial: polynomialRegression || null // Store polynomial coefficients if used
        },
        // Predictions
        predictions: predictions,
        // Predictions with confidence intervals
        predictionsWithConfidence: predictionsWithConfidence,
        // Projected value in 7 days
        projected7Days: projected7Days,
        // Projected value in 30 days
        projected30Days: projected30Days
      };
    });

    // Enhanced correlation detection
    this.detectCorrelations(recentLogs, analysis);
    
    // Multi-metric correlation matrix (uses all logs for better correlation detection)
    // Always use trainingLogs (allLogs) if available, otherwise use recentLogs
    const correlationLogs = trainingLogs.length >= recentLogs.length ? trainingLogs : recentLogs;
    this.detectMultiMetricCorrelations(correlationLogs, analysis);
    
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
    
    // Flare-up prediction (uses all logs to learn patterns)
    // Always use trainingLogs (allLogs) if available for better pattern learning
    const flarePredictionLogs = trainingLogs.length >= recentLogs.length ? trainingLogs : recentLogs;
    this.predictFlareUps(flarePredictionLogs, analysis);
    
    // Food/Exercise impact analysis (also sets nutritionAnalysis and exerciseSummary)
    this.analyzeFoodExerciseImpact(recentLogs, analysis);
    
    // Energy & mental clarity and weather sensitivity (use all collected data)
    this.analyzeEnergyClarityAndWeather(recentLogs, analysis);
    
    // Stressors impact analysis
    this.analyzeStressorsImpact(recentLogs, analysis);
    
    // Symptoms and pain location analysis
    this.analyzeSymptomsAndPainLocation(recentLogs, analysis);
    
    // Data clustering for pattern identification
    this.performClustering(recentLogs, analysis);
    
    // Time series analysis (exponential smoothing, moving averages)
    this.performTimeSeriesAnalysis(recentLogs, analysis);
    
    // Enhanced outlier detection
    this.detectOutliers(recentLogs, analysis);
    
    // Seasonality detection
    this.detectSeasonality(recentLogs, analysis);
    
    // Generate condition-specific advice (enhanced with actionable steps)
    const conditionContext = window.CONDITION_CONTEXT || { name: 'your condition' };
    analysis.advice = this.generateActionableAdvice(analysis.trends, recentLogs, conditionContext);
    
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

  // Perform polynomial regression on data points
  // Returns: { coefficients: [a0, a1, a2, ...], rSquared, standardError, degree }
  performPolynomialRegression: function(dataPoints, degree = 2) {
    if (dataPoints.length < degree + 1) {
      // Fallback to linear regression if insufficient data
      const linear = this.performLinearRegression(dataPoints);
      return {
        coefficients: [linear.intercept, linear.slope],
        rSquared: linear.rSquared,
        standardError: linear.standardError,
        degree: 1
      };
    }

    const n = dataPoints.length;
    const maxDegree = Math.min(degree, 3); // Cap at degree 3 for stability

    // Build Vandermonde matrix X
    const X = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j <= maxDegree; j++) {
        row.push(Math.pow(dataPoints[i].x, j));
      }
      X.push(row);
    }

    // Build Y vector
    const Y = dataPoints.map(p => p.y);

    // Solve using least squares: (X^T * X)^(-1) * X^T * Y
    // Simplified matrix operations
    const XT = [];
    for (let j = 0; j <= maxDegree; j++) {
      const col = [];
      for (let i = 0; i < n; i++) {
        col.push(X[i][j]);
      }
      XT.push(col);
    }

    // Calculate X^T * X
    const XTX = [];
    for (let i = 0; i <= maxDegree; i++) {
      const row = [];
      for (let j = 0; j <= maxDegree; j++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += X[k][i] * X[k][j];
        }
        row.push(sum);
      }
      XTX.push(row);
    }

    // Calculate X^T * Y
    const XTY = [];
    for (let i = 0; i <= maxDegree; i++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * Y[k];
      }
      XTY.push(sum);
    }

    // Simple Gaussian elimination for small matrices (max 4x4)
    const coefficients = this.solveLinearSystem(XTX, XTY);

    // Calculate R-squared
    const meanY = Y.reduce((a, b) => a + b, 0) / n;
    let ssTotal = 0;
    let ssResidual = 0;

    for (let i = 0; i < n; i++) {
      const predicted = coefficients.reduce((sum, coeff, idx) => {
        return sum + coeff * Math.pow(dataPoints[i].x, idx);
      }, 0);
      ssTotal += Math.pow(Y[i] - meanY, 2);
      ssResidual += Math.pow(Y[i] - predicted, 2);
    }

    const rSquared = ssTotal === 0 ? 0 : 1 - (ssResidual / ssTotal);
    const standardError = n > maxDegree + 1 ? Math.sqrt(ssResidual / (n - maxDegree - 1)) : 0;

    return {
      coefficients: coefficients,
      rSquared: Math.max(0, Math.min(1, rSquared)),
      standardError: standardError,
      degree: maxDegree
    };
  },

  // Solve linear system using Gaussian elimination (for small systems)
  solveLinearSystem: function(A, b) {
    const n = A.length;
    // Create augmented matrix
    const aug = A.map((row, i) => [...row, b[i]]);

    // Forward elimination
    for (let i = 0; i < n; i++) {
      // Find pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
          maxRow = k;
        }
      }
      // Swap rows
      [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

      // Make all rows below this one 0 in current column
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(aug[i][i]) < 1e-10) continue; // Skip if pivot is zero
        const factor = aug[k][i] / aug[i][i];
        for (let j = i; j <= n; j++) {
          aug[k][j] -= factor * aug[i][j];
        }
      }
    }

    // Back substitution
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = aug[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= aug[i][j] * x[j];
      }
      if (Math.abs(aug[i][i]) > 1e-10) {
        x[i] /= aug[i][i];
      }
    }

    return x;
  },

  // Predict future values using linear regression with AGGRESSIVE trend-preserving rounding
  // lastX: the x value of the last data point (days since start)
  // daysAhead: number of days to predict
  // isBPM: whether this is BPM metric (30-200 range)
  // isWeight: whether this is weight metric (30-300 kg range)
  // metricContext: optional object with {variance, average, metricName, trainingValues} for metric-specific patterns
  predictFutureValues: function(regression, lastX, daysAhead, isBPM = false, isWeight = false, metricContext = null) {
    const predictions = [];
    // Check for steps and hydration in metricContext
    const isSteps = metricContext && metricContext.isSteps === true;
    const isHydration = metricContext && metricContext.isHydration === true;
    
    // Set min/max values based on metric type
    let minValue, maxValue;
    if (isBPM) {
      minValue = 30;
      maxValue = 200;
    } else if (isWeight) {
      minValue = 30; // Minimum reasonable weight in kg
      maxValue = 300; // Maximum reasonable weight in kg
    } else if (isSteps) {
      minValue = 0;
      maxValue = 50000; // Steps can range from 0 to 50000
    } else if (isHydration) {
      minValue = 0;
      maxValue = 20; // Hydration in glasses (0-20)
    } else {
      minValue = 0;
      maxValue = 10; // 0-10 scale for other metrics
    }
    
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

  // Predict future values with confidence intervals
  // Returns array of { prediction, lower, upper, confidence } objects
  predictFutureValuesWithConfidence: function(regression, lastX, daysAhead, isBPM = false, isWeight = false, metricContext = null, confidenceLevel = 0.95) {
    // Get base predictions
    const basePredictions = this.predictFutureValues(regression, lastX, daysAhead, isBPM, isWeight, metricContext);
    
    // Check for steps and hydration in metricContext
    const isSteps = metricContext && metricContext.isSteps === true;
    const isHydration = metricContext && metricContext.isHydration === true;
    
    // Calculate prediction intervals using standard error and t-distribution
    // For 95% confidence, t-value ≈ 1.96 (simplified, assumes large sample)
    const tValue = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.90 ? 1.645 : 2.576;
    const standardError = regression.standardError || 1;
    
    // Calculate intervals for each prediction
    const predictionsWithConfidence = basePredictions.map((pred, idx) => {
      // Prediction interval widens as we predict further into the future
      const horizonMultiplier = 1 + (idx / daysAhead) * 0.5; // Increase uncertainty with time
      const margin = tValue * standardError * Math.sqrt(1 + (1 / (regression.n || 1))) * horizonMultiplier;
      
      // Set min/max values based on metric type
      let minValue, maxValue;
      if (isBPM) {
        minValue = 30;
        maxValue = 200;
      } else if (isWeight) {
        minValue = 30;
        maxValue = 300;
      } else if (isSteps) {
        minValue = 0;
        maxValue = 50000; // Steps can range from 0 to 50000
      } else if (isHydration) {
        minValue = 0;
        maxValue = 20; // Hydration in glasses (0-20)
      } else {
        minValue = 0;
        maxValue = 10;
      }
      
      return {
        prediction: pred,
        lower: Math.max(minValue, pred - margin),
        upper: Math.min(maxValue, pred + margin),
        confidence: confidenceLevel
      };
    });
    
    return predictionsWithConfidence;
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
      analysis.correlations.push("When sleep is poor, fatigue tends to be higher.");
    } else if (sleepFatigueCorr < -0.3) {
      analysis.correlations.push("Sleep and fatigue often go together.");
    }
    
    // Pain-Mood correlation
    const painMoodCorr = this.calculateCorrelation(painValues, moodValues);
    if (painMoodCorr < -0.4) {
      analysis.correlations.push("When pain is higher, mood tends to be lower.");
    }
    
    // Stiffness-Mobility correlation
    const stiffnessMobilityCorr = this.calculateCorrelation(stiffnessValues, mobilityValues);
    if (stiffnessMobilityCorr < -0.5) {
      analysis.correlations.push("When stiffness goes up, mobility tends to go down.");
    }
    
    // Swelling-Pain correlation
    const swellingPainCorr = this.calculateCorrelation(swellingValues, painValues);
    if (swellingPainCorr > 0.4) {
      analysis.correlations.push("Swelling and pain often go together.");
    }
    
    // Mood-Irritability correlation
    const moodIrritabilityCorr = this.calculateCorrelation(moodValues, irritabilityValues);
    if (moodIrritabilityCorr < -0.4) {
      analysis.correlations.push("When mood is lower, irritability tends to be higher.");
    }
  },

  // Multi-metric correlation matrix: detect complex relationships between all metrics
  detectMultiMetricCorrelations: function(logs, analysis) {
    if (logs.length < 5) return; // Need minimum data

    // Use same numeric metrics as analyzeHealthMetrics so all data points appear in Connected Patterns
    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'bpm', 'weight', 'weatherSensitivity', 'steps', 'hydration'];
    const correlationMatrix = {};
    
    metrics.forEach(metric1 => {
      correlationMatrix[metric1] = {};
      const values1 = logs.map(log => {
        const val = parseFloat(log[metric1]) || 0;
        return isNaN(val) ? 0 : val;
      }).filter(v => v > 0 || metric1 === 'weight'); // Weight can be any positive value
      
      if (values1.length < 3) return; // Skip if insufficient data
      
      metrics.forEach(metric2 => {
        if (metric1 === metric2) {
          correlationMatrix[metric1][metric2] = 1.0; // Perfect self-correlation
          return;
        }
        
        const values2 = logs.map(log => {
          const val = parseFloat(log[metric2]) || 0;
          return isNaN(val) ? 0 : val;
        }).filter(v => v > 0 || metric2 === 'weight');
        
        if (values2.length < 3) {
          correlationMatrix[metric1][metric2] = 0;
          return;
        }
        
        // Align arrays by date (ensure same length and matching indices)
        const aligned1 = [];
        const aligned2 = [];
        logs.forEach(log => {
          const v1 = parseFloat(log[metric1]) || 0;
          const v2 = parseFloat(log[metric2]) || 0;
          if ((!isNaN(v1) && v1 > 0) || metric1 === 'weight') {
            if ((!isNaN(v2) && v2 > 0) || metric2 === 'weight') {
              aligned1.push(v1);
              aligned2.push(v2);
            }
          }
        });
        
        if (aligned1.length >= 3 && aligned2.length >= 3 && aligned1.length === aligned2.length) {
          const corr = this.calculateCorrelation(aligned1, aligned2);
          correlationMatrix[metric1][metric2] = corr;
          
          // Detect strong correlations (>0.6 or <-0.6)
          if (Math.abs(corr) > 0.6) {
            const metric1Name = metric1.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const metric2Name = metric2.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const direction = corr > 0 ? 'increases with' : 'decreases with';
            const strength = Math.abs(corr) > 0.8 ? 'very strongly' : 'strongly';
            
            // Check if this correlation is already reported
            const existing = analysis.correlations.some(c => 
              c.includes(metric1Name) && c.includes(metric2Name)
            );
            
            if (!existing) {
              const plainDir = corr > 0 ? 'goes up when' : 'goes down when';
              analysis.correlations.push(
                `When ${metric1Name} ${plainDir} ${metric2Name} ${plainDir === 'goes up when' ? 'goes up too' : 'goes down too'}.`
              );
            }
          }
        } else {
          correlationMatrix[metric1][metric2] = 0;
        }
      });
    });
    
    // Store correlation matrix in analysis
    analysis.correlationMatrix = correlationMatrix;
    
    // Identify correlation clusters (groups of highly correlated metrics)
    const clusters = [];
    const processed = new Set();
    
    metrics.forEach(metric1 => {
      if (processed.has(metric1)) return;
      
      const cluster = [metric1];
      processed.add(metric1);
      
      metrics.forEach(metric2 => {
        if (metric1 === metric2 || processed.has(metric2)) return;
        
        const corr = correlationMatrix[metric1] && correlationMatrix[metric1][metric2];
        if (corr && Math.abs(corr) > 0.6) {
          cluster.push(metric2);
          processed.add(metric2);
        }
      });
      
      if (cluster.length > 1) {
        clusters.push(cluster);
      }
    });
    
    if (clusters.length > 0) {
      analysis.correlationClusters = clusters;
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

  // Predict flare-ups by analyzing patterns before historical flare-ups
  predictFlareUps: function(logs, analysis) {
    if (logs.length < 14) return; // Need at least 2 weeks of data
    
    // Analyze patterns before flare-ups
    const flareUpDays = logs.map((log, idx) => ({
      date: log.date,
      isFlare: log.flare === 'Yes',
      index: idx
    })).filter(d => d.isFlare);
    
    if (flareUpDays.length === 0) {
      // No historical flare-ups to learn from
      return;
    }
    
    // Look for patterns 1-3 days before flare-ups
    const preFlarePatterns = [];
    flareUpDays.forEach(flareDay => {
      const preFlareLogs = logs.slice(Math.max(0, flareDay.index - 3), flareDay.index);
      if (preFlareLogs.length >= 2) {
        const avgPain = preFlareLogs.reduce((sum, log) => sum + (parseInt(log.backPain) || 0), 0) / preFlareLogs.length;
        const avgStiffness = preFlareLogs.reduce((sum, log) => sum + (parseInt(log.stiffness) || 0), 0) / preFlareLogs.length;
        const avgFatigue = preFlareLogs.reduce((sum, log) => sum + (parseInt(log.fatigue) || 0), 0) / preFlareLogs.length;
        const avgSwelling = preFlareLogs.reduce((sum, log) => sum + (parseInt(log.swelling) || 0), 0) / preFlareLogs.length;
        const avgMood = preFlareLogs.reduce((sum, log) => sum + (parseInt(log.mood) || 0), 0) / preFlareLogs.length;
        
        preFlarePatterns.push({
          daysBefore: preFlareLogs.length,
          avgPain,
          avgStiffness,
          avgFatigue,
          avgSwelling,
          avgMood
        });
      }
    });
    
    if (preFlarePatterns.length === 0) return;
    
    // Calculate average pre-flare pattern
    const avgPreFlarePain = preFlarePatterns.reduce((sum, p) => sum + p.avgPain, 0) / preFlarePatterns.length;
    const avgPreFlareStiffness = preFlarePatterns.reduce((sum, p) => sum + p.avgStiffness, 0) / preFlarePatterns.length;
    const avgPreFlareFatigue = preFlarePatterns.reduce((sum, p) => sum + p.avgFatigue, 0) / preFlarePatterns.length;
    const avgPreFlareSwelling = preFlarePatterns.reduce((sum, p) => sum + p.avgSwelling, 0) / preFlarePatterns.length;
    const avgPreFlareMood = preFlarePatterns.reduce((sum, p) => sum + p.avgMood, 0) / preFlarePatterns.length;
    
    // Check recent days (last 3 days) for similar pattern
    const recentLogs = logs.slice(-3);
    if (recentLogs.length < 2) return;
    
    const recentPain = recentLogs.reduce((sum, log) => sum + (parseInt(log.backPain) || 0), 0) / recentLogs.length;
    const recentStiffness = recentLogs.reduce((sum, log) => sum + (parseInt(log.stiffness) || 0), 0) / recentLogs.length;
    const recentFatigue = recentLogs.reduce((sum, log) => sum + (parseInt(log.fatigue) || 0), 0) / recentLogs.length;
    const recentSwelling = recentLogs.reduce((sum, log) => sum + (parseInt(log.swelling) || 0), 0) / recentLogs.length;
    const recentMood = recentLogs.reduce((sum, log) => sum + (parseInt(log.mood) || 0), 0) / recentLogs.length;
    
    // Calculate differences (lower threshold for more sensitive detection)
    const painDiff = Math.abs(recentPain - avgPreFlarePain);
    const stiffnessDiff = Math.abs(recentStiffness - avgPreFlareStiffness);
    const fatigueDiff = Math.abs(recentFatigue - avgPreFlareFatigue);
    const swellingDiff = Math.abs(recentSwelling - avgPreFlareSwelling);
    const moodDiff = Math.abs(recentMood - avgPreFlareMood);
    
    // Calculate similarity score (0-1, where 1 is perfect match)
    const maxDiff = 10; // Maximum possible difference (0-10 scale)
    const painSimilarity = 1 - (painDiff / maxDiff);
    const stiffnessSimilarity = 1 - (stiffnessDiff / maxDiff);
    const fatigueSimilarity = 1 - (fatigueDiff / maxDiff);
    const swellingSimilarity = 1 - (swellingDiff / maxDiff);
    const moodSimilarity = 1 - (moodDiff / maxDiff);
    
    // Weighted average similarity (pain, stiffness, fatigue are more important)
    const overallSimilarity = (
      painSimilarity * 0.3 +
      stiffnessSimilarity * 0.25 +
      fatigueSimilarity * 0.25 +
      swellingSimilarity * 0.1 +
      moodSimilarity * 0.1
    );
    
    // Check if pattern matches (similarity > 0.7 and at least 3 metrics match)
    const matchingMetrics = [
      painDiff < 1.5,
      stiffnessDiff < 1.5,
      fatigueDiff < 1.5,
      swellingDiff < 1.5,
      moodDiff < 1.5
    ].filter(Boolean).length;
    
    if (overallSimilarity > 0.7 && matchingMetrics >= 3) {
      const confidence = Math.round(overallSimilarity * 100);
      const riskLevel = overallSimilarity > 0.85 ? 'high' : overallSimilarity > 0.75 ? 'moderate' : 'low';
      
      analysis.riskFactors.push(
        `Heads-up: Your recent numbers look like times when you had a flare-up before (${riskLevel} chance, ${confidence}% match). Keep an eye on how you feel and do what usually helps you prevent or ease flare-ups.`
      );
      
      // Store flare-up risk in analysis
      analysis.flareUpRisk = {
        level: riskLevel,
        confidence: confidence,
        similarity: overallSimilarity,
        matchingMetrics: matchingMetrics
      };
    }
  },

  // Analyze impact of stressors on symptoms and flare-ups
  analyzeStressorsImpact: function(logs, analysis) {
    if (logs.length < 7) return; // Need minimum data
    
    // Collect all stressors and their frequencies
    const stressorFrequency = {};
    const logsWithStressors = logs.filter(log => log.stressors && Array.isArray(log.stressors) && log.stressors.length > 0);
    const logsWithoutStressors = logs.filter(log => !log.stressors || !Array.isArray(log.stressors) || log.stressors.length === 0);
    
    // Count frequency of each stressor
    logsWithStressors.forEach(log => {
      if (log.stressors && Array.isArray(log.stressors)) {
        log.stressors.forEach(stressor => {
          stressorFrequency[stressor] = (stressorFrequency[stressor] || 0) + 1;
        });
      }
    });
    
    // Analyze impact of stressors on symptoms
    const metrics = ['backPain', 'fatigue', 'stiffness', 'mobility', 'mood', 'irritability', 'swelling'];
    const impacts = [];
    
    if (logsWithStressors.length > 0 && logsWithoutStressors.length > 0) {
      metrics.forEach(metric => {
        const withStressorsValues = logsWithStressors
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => val > 0);
        const withoutStressorsValues = logsWithoutStressors
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => val > 0);
        
        if (withStressorsValues.length > 0 && withoutStressorsValues.length > 0) {
          const withAvg = withStressorsValues.reduce((a, b) => a + b, 0) / withStressorsValues.length;
          const withoutAvg = withoutStressorsValues.reduce((a, b) => a + b, 0) / withoutStressorsValues.length;
          const diff = withAvg - withoutAvg;
          
          // For negative metrics (pain, fatigue, etc.), higher with stressors is worse
          // For positive metrics (mood, mobility), lower with stressors is worse
          const isNegativeMetric = ['backPain', 'fatigue', 'stiffness', 'irritability', 'swelling'].includes(metric);
          const isSignificant = Math.abs(diff) > 0.5;
          
          if (isSignificant) {
            const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (isNegativeMetric && diff > 0) {
              impacts.push(`On days you logged stress or triggers, your ${metricName} score was ${diff.toFixed(1)} points higher (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
            } else if (!isNegativeMetric && diff < 0) {
              impacts.push(`On days you logged stress or triggers, your ${metricName} score was ${Math.abs(diff).toFixed(1)} points lower (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
            }
          }
        }
      });
      
      // Analyze flare-up correlation with stressors
      const flaresWithStressors = logsWithStressors.filter(log => log.flare === 'Yes').length;
      const flaresWithoutStressors = logsWithoutStressors.filter(log => log.flare === 'Yes').length;
      const flareRateWith = logsWithStressors.length > 0 ? flaresWithStressors / logsWithStressors.length : 0;
      const flareRateWithout = logsWithoutStressors.length > 0 ? flaresWithoutStressors / logsWithoutStressors.length : 0;
      
      if (flareRateWith > flareRateWithout + 0.1) {
        const percentWith = Math.round(flareRateWith * 100);
        const percentWithout = Math.round(flareRateWithout * 100);
        impacts.push(`Flare-ups were more common on days you logged stress or triggers: ${percentWith}% vs ${percentWithout}%.`);
      }
    }
    
    // Add most common stressors to insights
    const sortedStressors = Object.entries(stressorFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most common
    
    if (sortedStressors.length > 0) {
      const topStressors = sortedStressors.map(([stressor, count]) => {
        const percent = Math.round((count / logs.length) * 100);
        return `${stressor} (${percent}%)`;
      }).join(', ');
      
      analysis.stressorAnalysis = {
        topStressors: sortedStressors.map(([stressor]) => stressor),
        frequency: stressorFrequency,
        impacts: impacts,
        summary: `Stress or triggers you logged most: ${topStressors}`
      };
    } else {
      analysis.stressorAnalysis = {
        topStressors: [],
        frequency: {},
        impacts: impacts,
        summary: 'No stress or triggers logged in this period'
      };
    }
  },

  // Analyze symptoms and pain location patterns
  analyzeSymptomsAndPainLocation: function(logs, analysis) {
    if (logs.length < 7) return; // Need minimum data
    
    // Collect all symptoms and their frequencies
    const symptomFrequency = {};
    const logsWithSymptoms = logs.filter(log => log.symptoms && Array.isArray(log.symptoms) && log.symptoms.length > 0);
    
    // Count frequency of each symptom
    logsWithSymptoms.forEach(log => {
      if (log.symptoms && Array.isArray(log.symptoms)) {
        log.symptoms.forEach(symptom => {
          symptomFrequency[symptom] = (symptomFrequency[symptom] || 0) + 1;
        });
      }
    });
    
    // Collect pain locations and their frequencies (raw strings for backward compatibility)
    const painLocationFrequency = {};
    const logsWithPainLocation = logs.filter(log => log.painLocation && log.painLocation.trim().length > 0);
    
    logsWithPainLocation.forEach(log => {
      if (log.painLocation && log.painLocation.trim().length > 0) {
        const locations = log.painLocation.split(',').map(loc => loc.trim()).filter(loc => loc.length > 0);
        locations.forEach(location => {
          painLocationFrequency[location] = (painLocationFrequency[location] || 0) + 1;
        });
      }
    });
    
    // Parse pain by body region (28 diagram regions including joints) and aggregate per region
    const painByRegion = {};
    PAIN_REGIONS.forEach(r => {
      painByRegion[r.id] = { label: r.label, mildDays: 0, painDays: 0 };
    });
    logsWithPainLocation.forEach(log => {
      const regionMap = parsePainLocationToRegions(log.painLocation);
      PAIN_REGIONS.forEach(r => {
        const sev = regionMap[r.id] || 0;
        if (sev === 1) painByRegion[r.id].mildDays += 1;
        else if (sev === 2) painByRegion[r.id].painDays += 1;
      });
    });
    
    // Per-region impact: for regions with enough "in pain" days, compare metrics
    const regionImpactMetrics = ['fatigue', 'mobility', 'mood'];
    const regionImpacts = [];
    PAIN_REGIONS.forEach(r => {
      const painDays = painByRegion[r.id].painDays;
      if (painDays < 3) return;
      const logsWithRegionInPain = logs.filter(log => parsePainLocationToRegions(log.painLocation || '')[r.id] === 2);
      const logsWithoutRegionInPain = logs.filter(log => parsePainLocationToRegions(log.painLocation || '')[r.id] !== 2);
      if (logsWithRegionInPain.length < 3 || logsWithoutRegionInPain.length < 3) return;
      regionImpactMetrics.forEach(metric => {
        const withVal = logsWithRegionInPain.map(log => parseInt(log[metric], 10) || 0).filter(v => !isNaN(v) && v >= 0);
        const withoutVal = logsWithoutRegionInPain.map(log => parseInt(log[metric], 10) || 0).filter(v => !isNaN(v) && v >= 0);
        if (withVal.length >= 3 && withoutVal.length >= 3) {
          const withAvg = withVal.reduce((a, b) => a + b, 0) / withVal.length;
          const withoutAvg = withoutVal.reduce((a, b) => a + b, 0) / withoutVal.length;
          const diff = withAvg - withoutAvg;
          if (Math.abs(diff) > 0.5) {
            const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const direction = diff > 0 ? 'higher' : 'lower';
            regionImpacts.push(`When your ${r.label} hurt, your ${metricName} was ${Math.abs(diff).toFixed(1)} points ${direction} on average (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
          }
        }
      });
    });
    
    // Analyze impact of symptoms on other metrics
    const metrics = ['backPain', 'fatigue', 'stiffness', 'mobility', 'mood', 'irritability', 'swelling'];
    const symptomImpacts = [];
    
    if (logsWithSymptoms.length > 0) {
      const logsWithoutSymptoms = logs.filter(log => !log.symptoms || !Array.isArray(log.symptoms) || log.symptoms.length === 0);
      
      if (logsWithoutSymptoms.length > 0) {
        metrics.forEach(metric => {
          const withSymptomsValues = logsWithSymptoms
            .map(log => parseInt(log[metric]) || 0)
            .filter(val => val > 0);
          const withoutSymptomsValues = logsWithoutSymptoms
            .map(log => parseInt(log[metric]) || 0)
            .filter(val => val > 0);
          
          if (withSymptomsValues.length > 0 && withoutSymptomsValues.length > 0) {
            const withAvg = withSymptomsValues.reduce((a, b) => a + b, 0) / withSymptomsValues.length;
            const withoutAvg = withoutSymptomsValues.reduce((a, b) => a + b, 0) / withoutSymptomsValues.length;
            const diff = withAvg - withoutAvg;
            
            const isNegativeMetric = ['backPain', 'fatigue', 'stiffness', 'irritability', 'swelling'].includes(metric);
            const isSignificant = Math.abs(diff) > 0.5;
            
            if (isSignificant) {
              const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            if (isNegativeMetric && diff > 0) {
              symptomImpacts.push(`On days you logged extra symptoms, your ${metricName} score was ${diff.toFixed(1)} points higher (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
            } else if (!isNegativeMetric && diff < 0) {
              symptomImpacts.push(`On days you logged extra symptoms, your ${metricName} score was ${Math.abs(diff).toFixed(1)} points lower (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
            }
            }
          }
        });
        
        // Analyze flare-up correlation with symptoms
        const flaresWithSymptoms = logsWithSymptoms.filter(log => log.flare === 'Yes').length;
        const flaresWithoutSymptoms = logsWithoutSymptoms.filter(log => log.flare === 'Yes').length;
        const flareRateWith = logsWithSymptoms.length > 0 ? flaresWithSymptoms / logsWithSymptoms.length : 0;
        const flareRateWithout = logsWithoutSymptoms.length > 0 ? flaresWithoutSymptoms / logsWithoutSymptoms.length : 0;
        
        if (flareRateWith > flareRateWithout + 0.1) {
          const percentWith = Math.round(flareRateWith * 100);
          const percentWithout = Math.round(flareRateWithout * 100);
          symptomImpacts.push(`Flare-ups were more common on days you logged extra symptoms: ${percentWith}% vs ${percentWithout}%.`);
        }
      }
    }
    
    // Analyze pain location patterns
    const painLocationImpacts = [];
    if (logsWithPainLocation.length > 0) {
      const logsWithoutPainLocation = logs.filter(log => !log.painLocation || log.painLocation.trim().length === 0);
      
      if (logsWithoutPainLocation.length > 0) {
        metrics.forEach(metric => {
          const withPainValues = logsWithPainLocation
            .map(log => parseInt(log[metric]) || 0)
            .filter(val => val > 0);
          const withoutPainValues = logsWithoutPainLocation
            .map(log => parseInt(log[metric]) || 0)
            .filter(val => val > 0);
          
          if (withPainValues.length > 0 && withoutPainValues.length > 0) {
            const withAvg = withPainValues.reduce((a, b) => a + b, 0) / withPainValues.length;
            const withoutAvg = withoutPainValues.reduce((a, b) => a + b, 0) / withoutPainValues.length;
            const diff = withAvg - withoutAvg;
            
            const isNegativeMetric = ['backPain', 'fatigue', 'stiffness', 'irritability', 'swelling'].includes(metric);
            const isSignificant = Math.abs(diff) > 0.5;
            
            if (isSignificant) {
              const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
              if (isNegativeMetric && diff > 0) {
                painLocationImpacts.push(`When you marked where it hurt, your ${metricName} was ${diff.toFixed(1)} points higher on average (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
              } else if (!isNegativeMetric && diff < 0) {
                painLocationImpacts.push(`When you marked where it hurt, your ${metricName} was ${Math.abs(diff).toFixed(1)} points lower on average (${withAvg.toFixed(1)} vs ${withoutAvg.toFixed(1)}).`);
              }
            }
          }
        });
      }
    }
    painLocationImpacts.push(...regionImpacts);
    
    // Add most common symptoms to insights
    const sortedSymptoms = Object.entries(symptomFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most common
    
    // Add most common pain locations to insights
    const sortedPainLocations = Object.entries(painLocationFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Top 5 most common
    
    const analysisData = {
      topSymptoms: sortedSymptoms.map(([symptom]) => symptom),
      symptomFrequency: symptomFrequency,
      symptomImpacts: symptomImpacts,
      topPainLocations: sortedPainLocations.map(([location]) => location),
      painLocationFrequency: painLocationFrequency,
      painLocationImpacts: painLocationImpacts,
      painByRegion: painByRegion,
      regionImpacts: regionImpacts
    };
    
    // Build summary
    const summaryParts = [];
    if (sortedSymptoms.length > 0) {
      const topSymptoms = sortedSymptoms.map(([symptom, count]) => {
        const percent = Math.round((count / logs.length) * 100);
        return `${symptom} (${percent}%)`;
      }).join(', ');
      summaryParts.push(`Symptoms you logged most: ${topSymptoms}`);
    }
    
    if (sortedPainLocations.length > 0) {
      const topLocations = sortedPainLocations.map(([location, count]) => {
        const percent = Math.round((count / logs.length) * 100);
        return `${location} (${percent}%)`;
      }).join(', ');
      summaryParts.push(`Places you had pain most: ${topLocations}`);
    }
    
    if (summaryParts.length > 0) {
      analysisData.summary = summaryParts.join('. ');
    } else {
      analysisData.summary = 'No symptoms or pain areas logged in this period';
    }
    
    analysis.symptomsAndPainAnalysis = analysisData;
  },

  // Analyze impact of food and exercise logging on symptoms
  analyzeFoodExerciseImpact: function(logs, analysis) {
    if (logs.length < 7) return; // Need minimum data
    
    // Helper: flat array of food items from a log (handles category object or legacy array)
    const getLogFoodArray = (log) => {
      if (!log || !log.food) return [];
      const f = log.food;
      if (Array.isArray(f)) return f;
      return [].concat(f.breakfast || [], f.lunch || [], f.dinner || [], f.snack || []);
    };
    const withFood = logs.filter(log => getLogFoodArray(log).length > 0);
    const withoutFood = logs.filter(log => getLogFoodArray(log).length === 0);
    const withExercise = logs.filter(log => log.exercise && Array.isArray(log.exercise) && log.exercise.length > 0);
    const withoutExercise = logs.filter(log => !log.exercise || !Array.isArray(log.exercise) || log.exercise.length === 0);
    
    // Calculate daily calorie and protein totals and set nutritionAnalysis (used in UI and insights)
    const dailyNutrition = [];
    logs.forEach(log => {
      const foodArr = getLogFoodArray(log);
      if (foodArr.length > 0) {
        let dayCalories = 0;
        let dayProtein = 0;
        foodArr.forEach(item => {
          if (typeof item === 'object' && item.calories !== undefined) dayCalories += item.calories || 0;
          if (typeof item === 'object' && item.protein !== undefined) dayProtein += item.protein || 0;
        });
        if (dayCalories > 0 || dayProtein > 0) {
          dailyNutrition.push({ date: log.date, calories: dayCalories, protein: dayProtein });
        }
      }
    });
    if (dailyNutrition.length > 0) {
      const totalCal = dailyNutrition.reduce((s, d) => s + d.calories, 0);
      const totalProtein = dailyNutrition.reduce((s, d) => s + d.protein, 0);
      const avgCalories = Math.round(totalCal / dailyNutrition.length);
      const avgProtein = Math.round((totalProtein / dailyNutrition.length) * 10) / 10;
      analysis.nutritionAnalysis = {
        avgCalories,
        avgProtein,
        daysWithFood: dailyNutrition.length,
        highCalorieDays: dailyNutrition.filter(d => d.calories > 2500).length,
        lowCalorieDays: dailyNutrition.filter(d => d.calories > 0 && d.calories < 1500).length,
        highProteinDays: dailyNutrition.filter(d => d.protein >= 100).length,
        lowProteinDays: dailyNutrition.filter(d => d.protein > 0 && d.protein < 50).length
      };
    }
    // Exercise: total minutes per day (from { name, duration } items)
    const getLogExerciseMinutes = (log) => {
      if (!log || !log.exercise || !Array.isArray(log.exercise)) return 0;
      return log.exercise.reduce((sum, item) => {
        const mins = typeof item === 'object' && item.duration != null ? item.duration : 0;
        return sum + (typeof mins === 'number' ? mins : parseInt(mins, 10) || 0);
      }, 0);
    };
    const logsWithExerciseMinutes = logs.filter(log => getLogExerciseMinutes(log) > 0);
    if (logsWithExerciseMinutes.length >= 3) {
      const totalMins = logsWithExerciseMinutes.reduce((s, log) => s + getLogExerciseMinutes(log), 0);
      const avgExerciseMinutes = Math.round(totalMins / logsWithExerciseMinutes.length);
      analysis.exerciseSummary = { avgMinutesPerDay: avgExerciseMinutes, daysWithExercise: logsWithExerciseMinutes.length };
    }
    const metrics = ['backPain', 'fatigue', 'stiffness', 'mobility', 'mood', 'swelling'];
    const impacts = [];
    
    // Analyze food impact
    if (withFood.length > 0 && withoutFood.length > 0) {
      metrics.forEach(metric => {
        const withFoodValues = withFood
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => !isNaN(val) && val > 0);
        const withoutFoodValues = withoutFood
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => !isNaN(val) && val > 0);
        
        if (withFoodValues.length >= 3 && withoutFoodValues.length >= 3) {
          const avgWithFood = withFoodValues.reduce((sum, val) => sum + val, 0) / withFoodValues.length;
          const avgWithoutFood = withoutFoodValues.reduce((sum, val) => sum + val, 0) / withoutFoodValues.length;
          const diff = avgWithFood - avgWithoutFood;
          const absDiff = Math.abs(diff);
          
          // Check if difference is significant (>1.0 on 0-10 scale)
          if (absDiff > 1.0) {
            const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const direction = diff < 0 ? 'lower' : 'higher';
            const isPositive = (metric === 'mobility' || metric === 'mood' || metric === 'sleep') ? diff > 0 : diff < 0;
            
            impacts.push({
              type: 'food',
              metric: metricName,
              withAvg: Math.round(avgWithFood * 10) / 10,
              withoutAvg: Math.round(avgWithoutFood * 10) / 10,
              diff: Math.round(diff * 10) / 10,
              direction: direction,
              isPositive: isPositive
            });
          }
        }
      });
    }
    
    // Analyze exercise impact
    if (withExercise.length > 0 && withoutExercise.length > 0) {
      metrics.forEach(metric => {
        const withExerciseValues = withExercise
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => !isNaN(val) && val > 0);
        const withoutExerciseValues = withoutExercise
          .map(log => parseInt(log[metric]) || 0)
          .filter(val => !isNaN(val) && val > 0);
        
        if (withExerciseValues.length >= 3 && withoutExerciseValues.length >= 3) {
          const avgWithExercise = withExerciseValues.reduce((sum, val) => sum + val, 0) / withExerciseValues.length;
          const avgWithoutExercise = withoutExerciseValues.reduce((sum, val) => sum + val, 0) / withoutExerciseValues.length;
          const diff = avgWithExercise - avgWithoutExercise;
          const absDiff = Math.abs(diff);
          
          // Check if difference is significant (>1.0 on 0-10 scale)
          if (absDiff > 1.0) {
            const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const direction = diff < 0 ? 'lower' : 'higher';
            const isPositive = (metric === 'mobility' || metric === 'mood' || metric === 'sleep') ? diff > 0 : diff < 0;
            
            impacts.push({
              type: 'exercise',
              metric: metricName,
              withAvg: Math.round(avgWithExercise * 10) / 10,
              withoutAvg: Math.round(avgWithoutExercise * 10) / 10,
              diff: Math.round(diff * 10) / 10,
              direction: direction,
              isPositive: isPositive
            });
          }
        }
      });
    }
    
    // Add significant impacts to patterns
    if (impacts.length > 0) {
      impacts.forEach(impact => {
        const impactType = impact.type === 'food' ? 'Food logging' : 'Exercise';
        const positiveIndicator = impact.isPositive ? '✅' : '⚠️';
        analysis.patterns.push(
          `${positiveIndicator} ${impactType} days show ${impact.direction} ${impact.metric} levels (${impact.withAvg} vs ${impact.withoutAvg})`
        );
      });
      
      // Store impacts in analysis
      analysis.foodExerciseImpacts = impacts;
    }
  },

  // Analyze energyClarity (text) and weatherSensitivity (numeric) for patterns
  analyzeEnergyClarityAndWeather: function(logs, analysis) {
    if (logs.length < 5) return;
    const highEnergyTerms = ['high energy', 'mental clarity', 'good concentration', 'focused', 'moderate energy'];
    const lowEnergyTerms = ['low energy', 'brain fog', 'poor concentration', 'mental fatigue', 'distracted'];
    const logsWithClarity = logs.filter(log => log.energyClarity && String(log.energyClarity).trim().length > 0);
    if (logsWithClarity.length >= 3) {
      const clarityLower = logsWithClarity.map(log => String(log.energyClarity).toLowerCase());
      const highEnergyDays = logsWithClarity.filter((_, i) => highEnergyTerms.some(t => clarityLower[i].includes(t)));
      const lowEnergyDays = logsWithClarity.filter((_, i) => lowEnergyTerms.some(t => clarityLower[i].includes(t)));
      if (highEnergyDays.length >= 2 && lowEnergyDays.length >= 2) {
        const avgMoodHigh = highEnergyDays.reduce((s, log) => s + (parseInt(log.mood) || 0), 0) / highEnergyDays.length;
        const avgMoodLow = lowEnergyDays.reduce((s, log) => s + (parseInt(log.mood) || 0), 0) / lowEnergyDays.length;
        const avgFatigueHigh = highEnergyDays.reduce((s, log) => s + (parseInt(log.fatigue) || 0), 0) / highEnergyDays.length;
        const avgFatigueLow = lowEnergyDays.reduce((s, log) => s + (parseInt(log.fatigue) || 0), 0) / lowEnergyDays.length;
        if (Math.abs(avgMoodHigh - avgMoodLow) > 0.5 || Math.abs(avgFatigueHigh - avgFatigueLow) > 0.5) {
          analysis.patterns.push('Energy & mental clarity entries correlate with mood and fatigue — tracking helps spot patterns.');
        }
      }
      analysis.energyClaritySummary = { daysLogged: logsWithClarity.length };
    }
    const logsWithNotes = logs.filter(log => log.notes && String(log.notes).trim().length > 0);
    if (logsWithNotes.length >= 3 && logs.length - logsWithNotes.length >= 3) {
      const avgPainWithNotes = logsWithNotes.reduce((s, log) => s + (parseInt(log.backPain) || 0), 0) / logsWithNotes.length;
      const logsWithoutNotes = logs.filter(log => !log.notes || !String(log.notes).trim());
      const avgPainWithout = logsWithoutNotes.reduce((s, log) => s + (parseInt(log.backPain) || 0), 0) / logsWithoutNotes.length;
      if (Math.abs(avgPainWithNotes - avgPainWithout) > 0.8) {
        analysis.patterns.push('You tend to add notes on higher-symptom days — notes help capture context for flare-ups.');
      }
    }
    const logsWithWeather = logs.filter(log => log.weatherSensitivity != null && log.weatherSensitivity !== '' && !isNaN(parseInt(log.weatherSensitivity)));
    if (logsWithWeather.length >= 5) {
      const highSensitivity = logsWithWeather.filter(log => parseInt(log.weatherSensitivity) >= 7);
      const lowSensitivity = logsWithWeather.filter(log => parseInt(log.weatherSensitivity) <= 4);
      if (highSensitivity.length >= 2 && lowSensitivity.length >= 2) {
        const flareRateHigh = highSensitivity.filter(log => log.flare === 'Yes').length / highSensitivity.length;
        const flareRateLow = lowSensitivity.filter(log => log.flare === 'Yes').length / lowSensitivity.length;
        if (flareRateHigh > flareRateLow + 0.1) {
          analysis.patterns.push('Higher weather sensitivity tends to coincide with more flare-up days — consider tracking weather for triggers.');
        }
      }
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

  // Generate actionable advice with specific steps and urgency levels
  generateActionableAdvice: function(trends, logs, conditionContext) {
    const advice = this.generateConditionAdvice(trends, logs, conditionContext);
    const conditionName = conditionContext.name || 'your condition';
    const recentLogs = logs.slice(-7);
    
    // Enhance existing advice with specific action steps
    const enhancedAdvice = [];
    
    // Sleep advice with urgency
    if (trends.sleep && trends.sleep.average < 6) {
      const sleepTrend = trends.sleep.regression?.slope || 0;
      const urgency = sleepTrend < -0.1 ? 'urgent' : 'moderate';
      const urgencyIcon = urgency === 'urgent' ? '🔴' : '🟡';
      
      enhancedAdvice.push(
        `${urgencyIcon} **Sleep Improvement (${urgency === 'urgent' ? 'Urgent' : 'Moderate'} Priority)**: ` +
        `Your sleep quality is below optimal (avg ${trends.sleep.average.toFixed(1)}/10). ` +
        `Action steps: 1) Set consistent bedtime within 30 minutes, 2) Avoid screens 1 hour before bed, ` +
        `3) Keep bedroom cool (65-68°F), 4) Consider sleep study if persists >2 weeks. ` +
        `Timeframe: Start tonight, review in 1 week.`
      );
    } else if (trends.sleep && trends.sleep.average >= 7) {
      enhancedAdvice.push("✅ **Sleep Quality**: Your sleep scores are good - maintaining this is important for managing " + conditionName + ".");
    }
    
    // Pain management with specific steps
    if (trends.backPain && trends.backPain.average > 6) {
      const painTrend = trends.backPain.regression?.slope || 0;
      const urgency = painTrend > 0.1 ? 'urgent' : 'moderate';
      const urgencyIcon = urgency === 'urgent' ? '🔴' : '🟡';
      
      enhancedAdvice.push(
        `${urgencyIcon} **Pain Management (${urgency === 'urgent' ? 'Urgent' : 'Moderate'} Priority)**: ` +
        `High pain levels detected (avg ${trends.backPain.average.toFixed(1)}/10). ` +
        `Action steps: 1) Heat therapy 15-20 min, 2) Gentle stretching, 3) Anti-inflammatory medications as prescribed, ` +
        `4) Discuss biologics with rheumatologist if not already prescribed. ` +
        `Timeframe: Immediate, follow up with doctor within 1 week if no improvement.`
      );
    } else if (trends.backPain && trends.backPain.average <= 4) {
      enhancedAdvice.push("✅ **Pain Control**: Your pain levels are well-managed - excellent work!");
    }
    
    // Exercise and mobility with specific recommendations
    if (trends.mobility && trends.mobility.average < 6) {
      enhancedAdvice.push(
        `🏃 **Mobility Focus**: Low mobility scores (avg ${trends.mobility.average.toFixed(1)}/10) suggest need for gentle exercise. ` +
        `Action steps: 1) Try swimming 2-3x/week, 2) Yoga or gentle stretching daily, ` +
        `3) Physical therapy exercises appropriate for ${conditionName}, 4) Start with 10-15 min, gradually increase. ` +
        `Timeframe: Start this week, review progress in 2 weeks.`
      );
    } else if (trends.mobility && trends.mobility.average >= 7) {
      enhancedAdvice.push("✅ **Mobility**: Your mobility scores are good - regular movement helps manage " + conditionName + ".");
    }
    
    // Stiffness management with timing
    if (trends.stiffness && trends.stiffness.average > 6) {
      enhancedAdvice.push(
        `🧘 **Morning Stiffness**: High stiffness levels (avg ${trends.stiffness.average.toFixed(1)}/10) indicate need for morning routine. ` +
        `Action steps: 1) Morning stretches upon waking, 2) Hot shower or warm compress, ` +
        `3) Adjust medication timing with your doctor, 4) Gentle movement before getting out of bed. ` +
        `Timeframe: Start tomorrow morning, review in 1 week.`
      );
    } else if (trends.stiffness && trends.stiffness.average <= 4) {
      enhancedAdvice.push("✅ **Stiffness Management**: Your stiffness is well-controlled.");
    }
    
    // Fatigue management with pacing
    if (trends.fatigue && trends.fatigue.average > 6) {
      const fatigueTrend = trends.fatigue.regression?.slope || 0;
      const urgency = fatigueTrend > 0.1 ? 'urgent' : 'moderate';
      const urgencyIcon = urgency === 'urgent' ? '🔴' : '🟡';
      
      enhancedAdvice.push(
        `${urgencyIcon} **Energy Management (${urgency === 'urgent' ? 'Urgent' : 'Moderate'} Priority)**: ` +
        `Chronic fatigue detected (avg ${trends.fatigue.average.toFixed(1)}/10). ` +
        `Action steps: 1) Pace activities throughout day, 2) Short naps (20-30 min) if needed, ` +
        `3) Discuss fatigue with healthcare team as it may indicate disease activity, ` +
        `4) Consider energy conservation techniques. ` +
        `Timeframe: Immediate, schedule doctor visit within 2 weeks if persistent.`
      );
    } else if (trends.fatigue && trends.fatigue.average <= 4) {
      enhancedAdvice.push("✅ **Energy Levels**: Your fatigue is well-managed.");
    }
    
    // Mood support with social connection
    if (trends.mood && trends.mood.average < 6) {
      enhancedAdvice.push(
        `😊 **Mental Health**: Low mood scores (avg ${trends.mood.average.toFixed(1)}/10) suggest need for support. ` +
        `Action steps: 1) Connect with support groups, 2) Consider counseling or therapy, ` +
        `3) Ensure adequate vitamin D and social interaction, 4) Practice mindfulness or meditation. ` +
        `Timeframe: Start this week, consider professional help if mood < 4/10 for >2 weeks.`
      );
    } else if (trends.mood && trends.mood.average >= 7) {
      enhancedAdvice.push("✅ **Mental Wellbeing**: Your mood scores are positive - maintaining mental health is crucial for managing chronic conditions.");
    }
    
    // Swelling management
    if (trends.swelling && trends.swelling.average > 6) {
      enhancedAdvice.push(
        `💧 **Swelling Management**: Elevated swelling detected (avg ${trends.swelling.average.toFixed(1)}/10). ` +
        `Action steps: 1) Elevate affected areas, 2) Compression if appropriate, ` +
        `3) Anti-inflammatory measures, 4) Discuss with your doctor. ` +
        `Timeframe: Immediate, follow up if swelling persists >3 days.`
      );
    }
    
    // Daily function
    if (trends.dailyFunction && trends.dailyFunction.average < 6) {
      enhancedAdvice.push(
        `📋 **Daily Function**: Reduced daily function scores (avg ${trends.dailyFunction.average.toFixed(1)}/10) suggest need for support. ` +
        `Action steps: 1) Activity pacing, 2) Assistive devices if needed, ` +
        `3) Occupational therapy consultation, 4) Break tasks into smaller steps. ` +
        `Timeframe: Start this week, consider OT referral if function < 5/10 for >2 weeks.`
      );
    }
    
    return enhancedAdvice.length > 0 ? enhancedAdvice : advice;
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
      insights.push(`**Getting better**: ${improvingMetrics.join(', ')}`);
    }
    
    if (worseningMetrics.length > 0) {
      insights.push(`**Getting worse**: ${worseningMetrics.join(', ')}`);
    }
    
    // Critical issues (concise)
    const criticalIssues = [];
    
    // Key metrics for critical issue checking (same set as analyzeHealthMetrics so all data points are considered)
    const keyMetrics = ['backPain', 'stiffness', 'fatigue', 'sleep', 'jointPain', 'mobility', 'dailyFunction', 'swelling', 'mood', 'irritability', 'bpm', 'weight', 'weatherSensitivity', 'steps', 'hydration'];
    
    keyMetrics.forEach(metric => {
      if (analysis.trends[metric]) {
        const trend = analysis.trends[metric];
        const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const isBPM = metric === 'bpm';
        const isWeight = metric === 'weight';
        const isSteps = metric === 'steps';
        const isHydration = metric === 'hydration';
        
        if (isBPM) {
          // BPM: check for abnormal values (high >100 or low <50)
          if (trend.average > 100) {
            criticalIssues.push(`${metricName} high (${Math.round(trend.average)})`);
          } else if (trend.average < 50) {
            criticalIssues.push(`${metricName} low (${Math.round(trend.average)})`);
          }
        } else if (isWeight) {
          // Weight: check for very high (>150 kg) or very low (<40 kg)
          if (trend.average > 150) {
            criticalIssues.push(`${metricName} high (${trend.average.toFixed(1)} kg)`);
          } else if (trend.average < 40) {
            criticalIssues.push(`${metricName} low (${trend.average.toFixed(1)} kg)`);
          }
        } else if (isSteps) {
          // Steps: check for very high values (>15000) or very low values (<1000)
          if (trend.average > 15000) {
            criticalIssues.push(`${metricName} high (${Math.round(trend.average).toLocaleString()})`);
          } else if (trend.average < 1000) {
            criticalIssues.push(`${metricName} low (${Math.round(trend.average).toLocaleString()})`);
          }
        } else if (isHydration) {
          // Hydration: check for high (>15 glasses) or low (<3 glasses)
          if (trend.average > 15) {
            criticalIssues.push(`${metricName} high (${trend.average.toFixed(1)} glasses)`);
          } else if (trend.average < 3) {
            criticalIssues.push(`${metricName} low (${trend.average.toFixed(1)} glasses)`);
          }
        } else {
          // Health metrics: 0-10 scale. Higher is better for sleep, mobility, mood, dailyFunction; higher is worse for pain/stiffness/fatigue/etc.
          const higherIsBetter = ['sleep', 'mobility', 'mood', 'dailyFunction'];
          if (higherIsBetter.includes(metric) && trend.average <= 4) {
            criticalIssues.push(`${metricName} low (${Math.round(trend.average)}/10)`);
          } else if (!higherIsBetter.includes(metric) && trend.average >= 7) {
            criticalIssues.push(`${metricName} high (${Math.round(trend.average)}/10)`);
          }
        }
      }
    });
    
    if (criticalIssues.length > 0) {
      insights.push(`**Things to watch**: ${criticalIssues.join(', ')}`);
    }
    
    // Flare-up analysis (concise)
    const flareCount = recentLogs.filter(log => log.flare === 'Yes').length;
    if (flareCount > 0) {
      const flarePercent = Math.round(flareCount / actualDayCount * 100);
      const dayText = actualDayCount === 1 ? 'day' : 'days';
      insights.push(`**Flare-ups**: ${flareCount} ${flareCount === 1 ? 'day' : 'days'} (${flarePercent}%) in last ${actualDayCount} ${dayText}`);
    }
    
    // Energy & Clarity (logged days)
    if (analysis.energyClaritySummary && analysis.energyClaritySummary.daysLogged > 0) {
      const days = analysis.energyClaritySummary.daysLogged;
      insights.push(`**Energy & Clarity**: Logged on ${days} ${days === 1 ? 'day' : 'days'}`);
    }
    
    // Notes (days with notes)
    const notesCount = recentLogs.filter(log => log.notes && String(log.notes).trim().length > 0).length;
    if (notesCount > 0) {
      insights.push(`**Notes**: Added on ${notesCount} ${notesCount === 1 ? 'day' : 'days'}`);
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
        const isSteps = metric === 'steps';
        const isHydration = metric === 'hydration';
        const direction = trend.regression.slope > 0 ? '↑' : '↓';
        const projected7 = trend.projected7Days;
        const current = trend.current;
        const threshold = isBPM ? 2 : (isSteps ? 500 : (isHydration ? 1 : 0.5)); // Different thresholds for different metrics
        
        if (Math.abs(projected7 - current) > threshold) {
          // Format based on metric type
          if (isSteps) {
            predictions.push(`${metricName} ${direction} ${Math.round(current).toLocaleString()}→${Math.round(projected7).toLocaleString()}`);
          } else if (isHydration) {
            predictions.push(`${metricName} ${direction} ${current.toFixed(1)}→${projected7.toFixed(1)} glasses`);
          } else {
            // Other metrics: show whole numbers
            predictions.push(`${metricName} ${direction} ${Math.round(current)}→${Math.round(projected7)}`);
          }
        }
      });
      
      if (predictions.length > 0) {
        insights.push(`**Next week (possible trend)**: ${predictions.join(', ')}`);
      }
    }
    
    if (analysis.patterns.length > 0) {
      insights.push(`**Pattern we see**: ${analysis.patterns.slice(0, 2).join('. ')}`);
    }
    
    // Stressors analysis
    if (analysis.stressorAnalysis) {
      const stressorAnalysis = analysis.stressorAnalysis;
      if (stressorAnalysis.topStressors.length > 0) {
        insights.push(`**Stress and triggers**: ${stressorAnalysis.summary}`);
        
        if (stressorAnalysis.impacts.length > 0) {
          insights.push(`**How stress or triggers affect you**: ${stressorAnalysis.impacts.slice(0, 2).join('. ')}`);
        }
      }
    }
    
    // Symptoms and pain location analysis
    if (analysis.symptomsAndPainAnalysis) {
      const symptomsAnalysis = analysis.symptomsAndPainAnalysis;
      if (symptomsAnalysis.topSymptoms.length > 0 || symptomsAnalysis.topPainLocations.length > 0) {
        insights.push(`**Symptoms and where you had pain**: ${symptomsAnalysis.summary}`);
        
        if (symptomsAnalysis.symptomImpacts.length > 0) {
          insights.push(`**How symptoms line up with how you feel**: ${symptomsAnalysis.symptomImpacts.slice(0, 2).join('. ')}`);
        }
        
        if (symptomsAnalysis.painLocationImpacts.length > 0) {
          insights.push(`**How pain areas line up with how you feel**: ${symptomsAnalysis.painLocationImpacts.slice(0, 2).join('. ')}`);
        }
      }
      if (symptomsAnalysis.painByRegion) {
        const parts = [];
        PAIN_REGIONS.forEach(r => {
          const data = symptomsAnalysis.painByRegion[r.id];
          if (!data || (data.painDays === 0 && data.mildDays === 0)) return;
          const p = data.painDays ? `${data.painDays} pain` : '';
          const m = data.mildDays ? `${data.mildDays} mild` : '';
          parts.push(`${data.label} (${[p, m].filter(Boolean).join(', ')})`);
        });
        if (parts.length > 0) {
          insights.push(`**Pain by body part**: ${parts.slice(0, 8).join('; ')}${parts.length > 8 ? '; …' : ''}`);
        } else {
          insights.push(`**Pain by body part**: No body areas with pain or mild in this period.`);
        }
      }
    }
    
    // Food and exercise analysis
    if (analysis.nutritionAnalysis && analysis.nutritionAnalysis.avgCalories > 0) {
      const nutrition = analysis.nutritionAnalysis;
      insights.push(`**What you ate**: On average ${nutrition.avgCalories} calories and ${nutrition.avgProtein}g protein per day.`);
    }
    if (analysis.exerciseSummary && analysis.exerciseSummary.daysWithExercise > 0) {
      const ex = analysis.exerciseSummary;
      insights.push(`**Exercise**: On days you logged exercise, about ${ex.avgMinutesPerDay} minutes on average (${ex.daysWithExercise} days).`);
    }
    if (analysis.foodExerciseImpacts && analysis.foodExerciseImpacts.length > 0) {
      const foodImpacts = analysis.foodExerciseImpacts.filter(i => i.type === 'food' || i.type === 'nutrition');
      const exerciseImpacts = analysis.foodExerciseImpacts.filter(i => i.type === 'exercise');
      
      if (foodImpacts.length > 0) {
        insights.push(`**How food lines up with how you feel**: ${foodImpacts.slice(0, 2).map(i => i.description || `On days you log food, ${i.metric} ${i.direction}`).join('. ')}`);
      }
      
      if (exerciseImpacts.length > 0) {
        insights.push(`**How exercise lines up with how you feel**: ${exerciseImpacts.slice(0, 2).map(i => `On days you exercise, ${i.metric} ${i.direction}`).join('. ')}`);
      }
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

    const metrics = ['fatigue', 'stiffness', 'backPain', 'sleep', 'mood', 'mobility', 'dailyFunction'];
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

  // ARIMA-like time series forecasting (simplified)
  // p = autoregressive order, d = differencing order, q = moving average order
  performARIMAForecast: function(values, p = 1, d = 0, q = 0, daysAhead = 7) {
    if (values.length < p + q + 2) return null;
    
    // First-order differencing if d > 0
    let series = [...values];
    if (d > 0) {
      for (let i = series.length - 1; i >= d; i--) {
        series[i] = series[i] - series[i - d];
      }
      series = series.slice(d);
    }
    
    if (series.length < p + 1) return null;
    
    // Simple autoregressive model: y_t = c + φ₁y_{t-1} + ... + φₚy_{t-p} + ε_t
    // Calculate AR coefficients using least squares
    const arCoeffs = [];
    const arIntercept = 0;
    
    // For p=1, use simple correlation-based coefficient
    if (p === 1) {
      const mean = series.reduce((a, b) => a + b, 0) / series.length;
      let numerator = 0;
      let denominator = 0;
      
      for (let i = 1; i < series.length; i++) {
        const diff1 = series[i] - mean;
        const diff2 = series[i - 1] - mean;
        numerator += diff1 * diff2;
        denominator += diff2 * diff2;
      }
      
      const phi1 = denominator !== 0 ? numerator / denominator : 0;
      arCoeffs.push(phi1);
    } else {
      // For higher orders, use simplified approach
      // Use correlation with lagged values
      const mean = series.reduce((a, b) => a + b, 0) / series.length;
      for (let lag = 1; lag <= p; lag++) {
        if (series.length > lag) {
          let numerator = 0;
          let denominator = 0;
          
          for (let i = lag; i < series.length; i++) {
            const diff1 = series[i] - mean;
            const diff2 = series[i - lag] - mean;
            numerator += diff1 * diff2;
            denominator += diff2 * diff2;
          }
          
          const phi = denominator !== 0 ? numerator / denominator : 0;
          arCoeffs.push(phi);
        }
      }
    }
    
    // Forecast next values
    const forecasts = [];
    const lastValues = series.slice(-p);
    const mean = series.reduce((a, b) => a + b, 0) / series.length;
    
    for (let i = 0; i < daysAhead; i++) {
      let forecast = mean; // Start with mean
      
      for (let j = 0; j < arCoeffs.length; j++) {
        const lagIndex = lastValues.length - 1 - j;
        if (lagIndex >= 0) {
          const lagValue = i === 0 ? lastValues[lagIndex] : (forecasts[i - j - 1] || lastValues[lagIndex]);
          forecast += arCoeffs[j] * (lagValue - mean);
        }
      }
      
      forecasts.push(forecast);
    }
    
    // Reverse differencing if needed
    if (d > 0 && values.length > 0) {
      const lastValue = values[values.length - 1];
      for (let i = 0; i < forecasts.length; i++) {
        forecasts[i] = lastValue + forecasts[i];
        if (i > 0) {
          forecasts[i] = forecasts[i - 1] + forecasts[i];
        }
      }
    }
    
    return {
      forecasts: forecasts,
      coefficients: arCoeffs,
      order: { p, d, q }
    };
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
            `${metricName}: ${outlierCount} unusual values detected (may indicate flare-ups)`
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
