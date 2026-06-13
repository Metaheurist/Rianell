import { Platform } from 'react-native';
import Constants from 'expo-constants';

const MAX_LINES = 200;
const lines: string[] = [];
let installed = false;

const REDACT_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  /\b(?:bpm|backPain|jointPain|medicalCondition|healthLogs|encryption_key)\s*[:=]\s*[^\s,}]+/gi,
  /\b\d{1,3}\/\d{1,2}\/\d{2,4}\b/g,
];

function redactSensitiveText(text: string): string {
  let out = text;
  for (const pattern of REDACT_PATTERNS) {
    out = out.replace(pattern, '[REDACTED]');
  }
  if (out.length > 2000) out = `${out.slice(0, 2000)}…[truncated]`;
  return out;
}

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string') return redactSensitiveText(arg);
  if (arg instanceof Error) return redactSensitiveText(arg.stack || `${arg.name}: ${arg.message}`);
  try {
    return redactSensitiveText(JSON.stringify(arg));
  } catch {
    return redactSensitiveText(String(arg));
  }
}

/**
 * Patches console (once) to keep a ring buffer for bug reports — same idea as the PWA `app.js` hook.
 * Health-like patterns and tokens are redacted before storage.
 */
export function installBugReportConsoleCapture(): void {
  if (installed) return;
  installed = true;
  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((method) => {
    const original = console[method];
    if (typeof original !== 'function') return;
    console[method] = (...args: unknown[]) => {
      try {
        const msg = args.map(stringifyArg).join(' ');
        lines.push(`[${new Date().toISOString()}] ${method.toUpperCase()} ${msg}`);
        if (lines.length > MAX_LINES) lines.splice(0, lines.length - MAX_LINES);
      } catch {
        /* ignore */
      }
      (original as (...a: unknown[]) => void).apply(console, args as []);
    };
  });
}

function getDiagnosticsBlock(): string {
  const cfg = Constants.expoConfig;
  const parts = [
    `platform=${Platform.OS}`,
    `platformVersion=${String(Platform.Version ?? '')}`,
    `app=${cfg?.slug ?? 'rianell'}@${cfg?.version ?? 'unknown'}`,
    `sdk=${cfg?.sdkVersion ?? ''}`,
    `nativeBuild=${Constants.nativeBuildVersion ?? ''}`,
    `executionEnvironment=${Constants.executionEnvironment ?? ''}`,
  ];
  return parts.join('\n');
}

/**
 * Text stored in Supabase `bug_reports.console_output` (diagnostics + recent JS console).
 */
export function getBugReportAttachmentText(): string {
  const diag = getDiagnosticsBlock();
  const tail = lines.length ? lines.join('\n') : '(no JS console lines captured yet)';
  return `--- Native / app diagnostics ---\n${diag}\n\n--- Recent JS console (${lines.length} lines max ${MAX_LINES}) ---\n${tail}`;
}
