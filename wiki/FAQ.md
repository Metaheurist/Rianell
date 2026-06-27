# FAQ

Quick answers; see linked wiki pages or repo docs for detail.

---

## General

**Do I need an account?**  
No. Local logging works without sign-in. An account is only needed for optional cloud backup.

**Is my data sent to the cloud by default?**  
No. Data stays on your device until you sign in, consent, and sync.

**Which platforms are supported?**  
Web/PWA ([rianell.com](https://rianell.com)), Android (APK alpha), iOS (Xcode zip alpha), and local Windows server EXE. See [[Downloads]].

**Is Rianell medical advice?**  
No. Insights and AI text are informational only. Consult a healthcare professional for medical decisions.

---

## Data and privacy

**Can I export my data?**  
Yes. Settings → export JSON backup. Format is portable to another device or platform. You can also create a password-protected encrypted export (min 12-character passphrase).

**How do I share data with my doctor?**  
Use **QR handoff** (Settings → Share & export) for an in-office encrypted QR code, or create a **hosted share link** with a chosen date range and password. Both are encrypted client-side; we never see your health data.

**What is the minimum password length for encrypted exports?**  
12 characters. The app will not accept shorter passphrases for exports, QR handoff, or share links.

**How do I delete everything?**  
Delete individual logs in **View logs**; **Delete cloud data** in Settings for remote copies; clear local storage in Settings for device-only data.

**Are my notes translated?**  
No. Your notes, symptoms, and medication text stay exactly as you entered them.

**Who can see my cloud backup?**  
Only you (encrypted per user; Supabase RLS enforces owner-only access).

**Who can see a hosted share link?**  
Only someone with both the link URL and the password you set. Data is encrypted with PBKDF2 (310 000 iterations) before upload. Links expire automatically (max 90 days) and have an access count limit.

**Can I import from Strava or Withings?**  
Yes, if cloud sync is enabled. Settings → **Integrations** → Connect → **Sync now**. OAuth tokens stay encrypted on the server; disconnect anytime.

---

## AI

**How big is the on-device AI model?**  
About **3.5 GB** downloaded once, stored in browser or app cache.

**Does AI send my logs to OpenAI or similar?**  
Not by default. The rule-based engine runs locally. The optional LLM also runs on-device after download.

**Why no AI summaries in Arabic/Hebrew?**  
Those locales use rule-based insights and localized MOTD quotes instead of on-device LLM generation.

---

## Mobile and installs

**Where is the Android APK?**  
[[Downloads]] or [GitHub Releases](https://github.com/Metaheurist/Rianell/releases).

**Why is iOS a zip, not App Store?**  
Current iOS builds are alpha CI artifacts for testers with Xcode.

**Can I install the PWA offline?**  
After first visit and install, cached assets work offline; sync and model download need network.

---

## Developers

**Where is the source code?**  
[github.com/Metaheurist/Rianell](https://github.com/Metaheurist/Rianell) — start at [[Developer-Home]].

**How do I update this wiki?**  
Edit `wiki/` in the repo, run `npm run wiki:verify` and `npm run wiki:sync`. See [[Contributing]].

---

## Still stuck?

[[Troubleshooting]] · [[About-and-Support]]
