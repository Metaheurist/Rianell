# Troubleshooting

Common issues and where to look for more detail.

---

## App freezes or crashes after a long session (desktop / high-end PC)

This is most common on high-end desktop PCs where the device tier is 5 (max features + animations + large AI models). Fixed in **v2.1.0**. If you are on an older build:

1. **Refresh after 60-90 min** - heap pressure from 300+ chart points and AI runtime can spike to 400+ MB on Tier 5. A normal reload fully clears this.
2. **Disable on-device AI** - go to **Settings → Performance → AI model** and set to **Off** or **Small**. The first AI-tab activation can spike heap by ~400 MB (three ML runtimes load simultaneously).
3. **Check browser console** for `Content-Security-Policy-Report-Only` violation logs - a misconfigured Cloudflare header can generate 200+ retained error strings per page load, slowly filling the heap. If you see `"connect-src 'none'"` violations, clear the cache and try incognito mode to rule out extension CSP interference.
4. **Force service worker update** - open DevTools → Application → Service Workers → click **Update**. Running a stale service worker can cause network fetch errors that trigger error-object accumulation in memory.

**If the freeze happens immediately (< 5 min):** file a bug report with your browser console output and the result of typing `JSON.stringify(window.__rianellBootLog)` in the DevTools console.

---

## AI model download fails or stalls

1. Check free disk space (~3.5 GB needed).
2. Confirm network stability; chunked downloads resume from Supabase Storage.
3. **Settings → Performance → Clear and redownload model**.
4. On desktop PWA, watch the progress indicator near the **+** button.
5. If Supabase is unreachable, the app may try same-origin or Hugging Face fallback (PWA).

See [[Charts-and-AI]].

---

## Cloud sync not working

1. Confirm you’re **signed in** and accepted **health data consent**.
2. Verify Supabase project is configured (live site needs deploy secrets).
3. Try manual sync from Settings.
4. Export local JSON before **Delete cloud data** tests.

See [[Cloud-Sync-and-Backup]].

---

## Language change doesn’t update all tabs

Fixed in recent releases - all tabs should refresh on locale change. If not:

1. Hard refresh (web) or restart app (mobile).
2. Note your locale and platform when reporting.

---

## Stuck on “Measuring performance…” at first start

Boot runs a short device benchmark **behind the loading overlay** (before content is shown). Older builds could freeze there when the suite used `requestAnimationFrame` during first paint - often stuck around **16% · rAF latency** (Chrome may show **Page Unresponsive**) or **3% · Array throughput**.

**v2.2.3+:** the suite yields with `setTimeout` only (no boot-time `requestAnimationFrame`), slices string/DOM work, and aborts a stalled rAF-latency step within ~1.5s.

1. **Wait up to ~20 seconds** - the boot watchdog should reveal the app automatically.
2. **Hard refresh** after updating to the latest build.
3. **Clear benchmark cache** (God mode → clear benchmark cache) only if the screen still never finishes after a refresh on v2.2.3+.
4. **Console check:** `JSON.stringify(window.__rianellBootLog)` - include output when filing a bug.

The benchmark result is cached in `localStorage` (`rianellPerfBenchmark`); once it completes or aborts, later loads skip the full suite.

---

## Log cards won’t expand (web)

Tap the day card header; expanded content uses CSS classes (not hidden inline). Update to latest web build from [[Downloads]].

---

## Charts empty or flat

- Log at least a few days with numeric fields.
- Quick-save entries still get default scores - check you saved successfully.
- Demo mode uses sample data - turn off in Settings to see your logs.

---

## Local server won’t start

```bash
pip install -r requirements.txt
python -m server
```

Windows: `powershell -ExecutionPolicy Bypass -File .\server\launch-server.ps1`

Check `PORT` / `HOST` in your local secrets file under `security/` (see [SECURITY.md](https://github.com/Metaheurist/Rianell/blob/main/docs/SECURITY.md)). Logs in `logs/` directory.

`launch-server.ps1` runs `pip install -r requirements.txt` automatically. If the dashboard shows **pydantic-core** or import errors, click **Install requirements** on the Tools or Data tab.

---

## Supabase “getaddrinfo failed” in server dashboard

The Python server cannot resolve the hostname in `SUPABASE_URL`. This is a **configuration** issue, not a broken install.

1. Open [Supabase Dashboard](https://app.supabase.com) → your project → **Project Settings → API**.
2. Copy **Project URL** into `SUPABASE_URL` in `security/.env` (and keys as documented in [[Developer-Setup]]).
3. Verify DNS: `nslookup your-project-ref.supabase.co` should return an address.
4. Restart the server and click **Refresh** on the Overview or Data tab.

The local PWA at `http://localhost:8080` still works without cloud sync.

## Where to report bugs

1. In-app **bug report** (Settings or help) - include steps, expected vs actual.
2. [GitHub Issues](https://github.com/Metaheurist/Rianell/issues)
3. Email **jan.andersson@rianell.com**

**Include when reporting:**

- Platform (web PWA, Android, iOS) and build number
- Selected theme and locale
- For cloud issues: signed-in state and which setting failed
- Browser console errors (web) or device OS version (mobile)

---

## Read more (technical)

- [About & support](https://github.com/Metaheurist/Rianell/blob/main/docs/about-and-support.md)
- [Project reference - troubleshooting](https://github.com/Metaheurist/Rianell/blob/main/docs/project-reference.md)
