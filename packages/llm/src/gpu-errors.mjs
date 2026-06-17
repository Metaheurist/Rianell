/** Classify ORT / WebGPU pipeline errors for load-ladder routing. */
export function classifyGpuLoadError(err) {
  const msg = String(err?.message || err || '');
  const codeMatch = msg.match(/\b(\d{6,10})\b/);
  const code = codeMatch ? codeMatch[1] : null;
  if (code === '557856688') {
    return { class: 'ort_webgpu_pipeline_fail', code, retryPath: 'mlc' };
  }
  if (/webgpu|wgpu|gpu/i.test(msg) && /fail|error|invalid|unsupported/i.test(msg)) {
    return { class: 'webgpu_generic', code, retryPath: 'mlc' };
  }
  if (/out of memory|oom|memory allocation/i.test(msg)) {
    return { class: 'oom', code, retryPath: 'wasm_cap' };
  }
  return { class: 'unknown', code, retryPath: 'wasm' };
}

export const GPU_PIPELINE_FAIL_KEY = 'rianell.llm.gpuPipelineFail';
