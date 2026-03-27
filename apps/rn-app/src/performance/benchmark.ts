import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PreferredLlmModelSize } from '../storage/preferences';

const KEY = 'rianell.performance-benchmark.v1';

export type DeviceClass = 'low' | 'medium' | 'high';

export type BenchmarkResult = {
  scoreMs: number;
  tier: 1 | 2 | 3 | 4 | 5;
  deviceClass: DeviceClass;
  llmModelSize: Exclude<PreferredLlmModelSize, 'recommended'>;
  measuredAt: number;
};

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}

function classifyTier(scoreMs: number): BenchmarkResult['tier'] {
  // Lower score is better (elapsed ms for same workload).
  if (scoreMs <= 14) return 5;
  if (scoreMs <= 26) return 4;
  if (scoreMs <= 44) return 3;
  if (scoreMs <= 72) return 2;
  return 1;
}

function modelSizeFromTier(tier: BenchmarkResult['tier']): BenchmarkResult['llmModelSize'] {
  if (tier >= 5) return 'tier5';
  if (tier === 4) return 'tier4';
  if (tier === 3) return 'tier3';
  if (tier === 2) return 'tier2';
  return 'tier1';
}

function classFromTier(tier: BenchmarkResult['tier']): DeviceClass {
  if (tier >= 4) return 'high';
  if (tier >= 2) return 'medium';
  return 'low';
}

export function resolveLlmModelSize(
  preferred: PreferredLlmModelSize,
  benchmark: BenchmarkResult | null
): Exclude<PreferredLlmModelSize, 'recommended'> {
  if (preferred !== 'recommended') return preferred;
  return benchmark?.llmModelSize ?? 'tier3';
}

export async function loadCachedBenchmark(): Promise<BenchmarkResult | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<BenchmarkResult>;
    if (
      typeof parsed.scoreMs !== 'number' ||
      typeof parsed.tier !== 'number' ||
      typeof parsed.measuredAt !== 'number' ||
      (parsed.deviceClass !== 'low' && parsed.deviceClass !== 'medium' && parsed.deviceClass !== 'high')
    ) {
      return null;
    }
    const llmModelSize =
      parsed.llmModelSize === 'tier1' ||
      parsed.llmModelSize === 'tier2' ||
      parsed.llmModelSize === 'tier3' ||
      parsed.llmModelSize === 'tier4' ||
      parsed.llmModelSize === 'tier5'
        ? parsed.llmModelSize
        : modelSizeFromTier(parsed.tier as BenchmarkResult['tier']);
    return {
      scoreMs: parsed.scoreMs,
      tier: parsed.tier as BenchmarkResult['tier'],
      deviceClass: parsed.deviceClass,
      llmModelSize,
      measuredAt: parsed.measuredAt,
    };
  } catch {
    return null;
  }
}

export async function clearCachedBenchmark(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export async function runAndCacheBenchmark(): Promise<BenchmarkResult> {
  // Keep workload short to avoid jank while still differentiating tiers.
  let acc = 0;
  const start = nowMs();
  for (let outer = 0; outer < 28; outer += 1) {
    for (let i = 1; i < 5200; i += 1) {
      acc += Math.sqrt(i) * Math.sin(i * 0.0009);
    }
  }
  if (!Number.isFinite(acc)) acc = 0;
  const elapsed = Math.max(1, nowMs() - start);
  const tier = classifyTier(elapsed);
  const result: BenchmarkResult = {
    scoreMs: elapsed,
    tier,
    deviceClass: classFromTier(tier),
    llmModelSize: modelSizeFromTier(tier),
    measuredAt: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(result));
  return result;
}

