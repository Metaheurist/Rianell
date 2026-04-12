import { Platform } from 'react-native';
import Constants from 'expo-constants';

const MAX_LINES = 200;
const lines: string[] = [];
let installed = false;

function stringifyArg(arg: unknown): string {
  if (typeof arg === 'string') return arg;
  if (arg instanceof Error) return arg.stack || `${arg.name}: ${arg.message}`;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

/**
 * Patches console (once) to keep a ring buffer for bug reports — same idea as the PWA `app.js` hook.
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
  const deviceName = (Constants as { deviceName?: string }).deviceName;
  if (deviceName) parts.push(`deviceName=${deviceName}`);
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
