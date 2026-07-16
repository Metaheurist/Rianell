# Logging Data

Each day you can record vitals, symptoms, lifestyle, and free-text notes. All entries share one **canonical schema** so exports work across web and mobile.

---

## Required field

- **Date** (`YYYY-MM-DD`) - every entry must have a date. Invalid dates default to today.

## Quick save

Save after **date + flare** only. Missing numeric scores are filled with mid-scale defaults so charts and AI still run.

---

## Core fields

| Field | Type | Notes |
|-------|------|-------|
| **Flare** | Yes / No | Default No |
| **BPM** | number | Heart rate; typical range 30-120 |
| **Weight** | text | kg as decimal string |
| **Fatigue, stiffness, sleep, joint pain, mobility, daily function, swelling, mood, irritability** | 0-10 | Subjective scales (PWA: scroll/drag number box with −/+; instant snap when reduced motion is preferred) |
| **Weather sensitivity** | 1-10 | Same drum-style control as other wellness scales |
| **Steps** | integer | PWA drum (with −/+) |
| **Hydration** | number | Glasses / units; PWA drum |
| **Notes** | text | Max 500 characters; **never auto-translated** |
| **Energy / clarity** | text | Max 80 characters |
| **Pain location** | text | Max 150 characters |
| **Stressors, symptoms** | lists | Trimmed item lists |
| **Food** | object | Breakfast, lunch, dinner, snack item lists |
| **Exercise** | list | Name + optional duration |
| **Medications** | list | Per-entry medication log |

---

## Cycle tracking (optional)

Enable in **Settings → Data options** or during first-run tutorial.

| Field | Notes |
|-------|-------|
| **Period start** | Tap **Period started today** on the log date to set day 1 and anchor future auto-suggestions |
| **Cycle day** | 1-35 in the default selector; expand to 45 for longer/irregular cycles |
| **Phase** | Menstrual, follicular, ovulation, luteal - theme icons, not emoji |
| **Flow** | Optional light / medium / heavy |
| **PMS symptoms** | Optional list |

When you pick a date, cycle day and phase may be **suggested** from your last logged **period start** (or legacy cycle entries). Days above 35 show a late-cycle hint. Phase hints use a simplified ~28-day pattern - not medical advice.

---

## Viewing and editing

- **View logs** tab - filter with **All / 7D / 30D / Custom** and a newest/oldest sort toggle.
- Tap a day card for a one-line summary; expand for **Physical / Lifestyle / Mental** detail panes.
- **Edit** or **delete** from the action bar on each entry.
- **Share** (web) - circular green share button per entry.

**Mood** tab leads with today’s check-in; history uses a compact 30-day heatmap.

---

## Import and export

- **Export** produces JSON aligned with `@rianell/shared` normalization - use for backup or moving between devices.
- **Import** previews data before merge; user-derived HTML is escaped in the preview.
- Export **column headers** can be localised; **your note text stays exactly as typed**.

---

## Where data is stored

| Platform | Storage |
|----------|---------|
| Web / PWA | `localStorage` (+ optional IndexedDB mirror) |
| React Native | AsyncStorage |

Optional encrypted cloud copy: [[Cloud-Sync-and-Backup]].

---

## Read more (technical)

- [Data model](https://github.com/Metaheurist/Rianell/blob/main/docs/data-model.md)
- [App features - log wizard](https://github.com/Metaheurist/Rianell/blob/main/docs/app-and-features.md)
