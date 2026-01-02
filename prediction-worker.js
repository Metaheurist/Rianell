// ============================================
// PREDICTION WORKER
// Web Worker for offloading prediction calculations
// ============================================

// Import AIEngine functions (worker context)
// Note: In a real worker, we'd need to import AIEngine differently
// For now, we'll include the prediction logic directly

// Listen for messages from main thread
self.addEventListener('message', async function(e) {
  const { type, data } = e.data;
  
  try {
    switch(type) {
      case 'PREDICT':
        const result = await performPrediction(data);
        self.postMessage({
          type: 'PREDICT_RESULT',
          data: result,
          requestId: data.requestId
        });
        break;
        
      case 'ANALYZE':
        const analysis = await performAnalysis(data);
        self.postMessage({
          type: 'ANALYZE_RESULT',
          data: analysis,
          requestId: data.requestId
        });
        break;
        
      default:
        self.postMessage({
          type: 'ERROR',
          error: 'Unknown message type: ' + type
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error.message,
      stack: error.stack,
      requestId: data?.requestId
    });
  }
});

// Perform prediction calculations
async function performPrediction(data) {
  const { logs, allLogs, metric, daysAhead, modelType } = data;
  
  // Import AIEngine functions (simplified version for worker)
  // In production, you'd use importScripts or dynamic import
  if (typeof self.AIEngine === 'undefined') {
    // Load AIEngine in worker context
    importScripts('../AIEngine.js');
  }
  
  if (!self.AIEngine) {
    throw new Error('AIEngine not available in worker');
  }
  
  // Get trend analysis for the metric
  const analysis = self.AIEngine.analyzeHealthMetrics(logs, allLogs);
  const trend = analysis.trends[metric];
  
  if (!trend || !trend.regression) {
    return { predictions: [], confidence: [] };
  }
  
  const regression = trend.regression;
  const predictions = [];
  const confidence = [];
  
  // Generate predictions based on model type
  if (modelType === 'arima' && regression.arima) {
    // ARIMA predictions
    const forecast = self.AIEngine.performARIMAForecast(
      logs.map(l => parseFloat(l[metric]) || 0).filter(v => !isNaN(v)),
      regression.arima.p || 1,
      regression.arima.d || 0,
      regression.arima.q || 0,
      daysAhead
    );
    
    forecast.forEach((value, index) => {
      const date = new Date(logs[logs.length - 1].date);
      date.setDate(date.getDate() + index + 1);
      predictions.push({
        date: date.toISOString().split('T')[0],
        value: value
      });
    });
  } else if (modelType === 'polynomial' && regression.polynomial) {
    // Polynomial regression predictions
    const lastX = logs.length;
    const predictionsWithConfidence = self.AIEngine.predictFutureValuesWithConfidence(
      regression,
      lastX,
      daysAhead,
      metric === 'bpm',
      metric === 'weight',
      { metric },
      0.95
    );
    
    predictionsWithConfidence.forEach((pred, index) => {
      const date = new Date(logs[logs.length - 1].date);
      date.setDate(date.getDate() + index + 1);
      predictions.push({
        date: date.toISOString().split('T')[0],
        value: pred.prediction
      });
      confidence.push({
        date: date.toISOString().split('T')[0],
        lower: pred.lower,
        upper: pred.upper
      });
    });
  } else {
    // Linear regression predictions
    const lastX = logs.length;
    const predictionsWithConfidence = self.AIEngine.predictFutureValuesWithConfidence(
      regression,
      lastX,
      daysAhead,
      metric === 'bpm',
      metric === 'weight',
      { metric },
      0.95
    );
    
    predictionsWithConfidence.forEach((pred, index) => {
      const date = new Date(logs[logs.length - 1].date);
      date.setDate(date.getDate() + index + 1);
      predictions.push({
        date: date.toISOString().split('T')[0],
        value: pred.prediction
      });
      confidence.push({
        date: date.toISOString().split('T')[0],
        lower: pred.lower,
        upper: pred.upper
      });
    });
  }
  
  return {
    predictions,
    confidence,
    modelType: modelType || regression.modelType || 'linear'
  };
}

// Perform full analysis
async function performAnalysis(data) {
  const { logs, allLogs } = data;
  
  if (typeof self.AIEngine === 'undefined') {
    importScripts('../AIEngine.js');
  }
  
  if (!self.AIEngine) {
    throw new Error('AIEngine not available in worker');
  }
  
  return self.AIEngine.analyzeHealthMetrics(logs, allLogs);
}

// Send ready message
self.postMessage({ type: 'WORKER_READY' });
