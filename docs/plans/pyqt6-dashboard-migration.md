# PyQt6 server-dashboard migration — agentic runbook

> **Goal:** replace the Tkinter dev-server dashboard (`server/dashboard_ui.py`, `server/dashboard_icons.py`) with a PyQt6 implementation, preserving 100 % of current behaviour, and fixing the latent thread-safety flaw that comes with the current architecture.
>
> **Audience:** an autonomous coding agent. Every phase lists exact files, exact edits, code skeletons, and a verify gate. Do **not** skip gates. Stop on first failing gate, fix, re-run.

---

## 0. Verified facts (Firecrawl, 2026-07-19)

| Fact | Value | Source |
|------|-------|--------|
| PyPI package | `PyQt6` (import as `PyQt6`) | [pypi.org/project/PyQt6](https://pypi.org/project/PyQt6/) |
| Current line | `6.10.x` (6.10.2 released 2026-01-08; latest patch 2026-03-30) | PyPI release history |
| License | **GPL-3.0-only** OR commercial (Riverbank) | PyPI "License Expression: GPL-3.0-only" |
| Python floor | **Python >= 3.10** | PyPI "Requires: Python >=3.10" |
| Threading rule | **All GUI/widget access must happen on the thread that created `QApplication` (the main thread).** Cross-thread updates go through **signals/slots** (Qt auto-uses `QueuedConnection` across threads). | [Qt threading basics](https://doc.qt.io/qt-6/thread-basics.html), [RealPython QThread](https://realpython.com/python-pyqt-qthread/) |
| Alternative | `PySide6` — same Qt6 API, **LGPL** (released 2026-05-13) | [pypi.org/project/PySide6](https://pypi.org/project/PySide6/) |

### ⚠ Decision gate — licensing (resolve before Phase 1)

PyQt6 is **GPL-3.0**. This dashboard is a **dev-only tool** (`python -m server`), never shipped to end users and not imported by the PWA, so GPL "distribution" obligations are unlikely to attach to the product. **However**, if the team later bundles the server into a distributed desktop artifact, GPL-3.0 would force the whole distributed work to be GPL.

- The user explicitly asked for **PyQt6** → default to `PyQt6`.
- If a permissive license is ever required, the port is **API-identical** to `PySide6` (LGPL): only the import lines and a handful of names change (`pyqtSignal`→`Signal`, `pyqtSlot`→`Slot`, `.exec()` is identical in Qt6). Keep imports isolated in one module (`server/qt_dashboard/_qt.py`) so a swap is a one-file change.

**Action:** proceed with PyQt6; centralise Qt imports (Phase 1) to keep the escape hatch cheap.

---

## 1. Current-state inventory (what we are replacing)

### Files in scope

| File | Lines | Role | Fate |
|------|-------|------|------|
| `server/dashboard_ui.py` | ~1030 | Tk dashboard: `Theme`, `IconButton`, `StatusCard`, `NavItem`, `DashboardCallbacks`, `create_dashboard()` | **Replace** (port to `server/qt_dashboard/`) |
| `server/dashboard_icons.py` | ~129 | 24×24 line-segment icons drawn on `tk.Canvas` | **Port** to QPixmap/QPainter |
| `server/main.py` | ~565 | `create_server_dashboard()` (L326-353), Tk availability guard (L94-101), dashboard thread launch (L437-450), main keep-alive loop (L523-563) | **Edit** (flip threading model) |
| `requirements.txt` | 31 | Python deps | **Edit** (add PyQt6) |
| `server/launch-server.ps1` | — | `pip install -r requirements.txt` at L114-122 | No edit (picks up new dep automatically) |

### Backend that must be reused unchanged (do NOT port — call it)

`DashboardCallbacks` (dataclass, `dashboard_ui.py` L63-74) is UI-framework-agnostic. Keep it. The following backend functions are already decoupled and must be called as-is:

- `chromium_dev.launch_clean_chromium`, `chromium_dev.chromium_status`, `chromium_dev.install_chromium_async(on_done, on_progress=…)`
- `supabase_client.*` (`check_supabase_availability`, `init_supabase_client`, `search_supabase_data`, `export_supabase_data`, `generate_and_post_sample_data_to_supabase`, `get_supabase_service_client`, `try_restart_anonymized_data_id_sequence`)
- `encryption.decrypt_anonymized_data`, `sample_data.generate_sample_csv_data`, `requirements_check.install_requirements`
- `config.*` (`HOST`, `PORT`, `PROJECT_ROOT`, `SUPABASE_SERVICE_KEY`, `dashboard_log_formatter`)

### The latent bug this migration fixes

Today the whole Tk UI runs in a **non-main daemon thread** (`main.py` L446, `daemon=False`) while the main thread sits in `while True: sleep(1)` (L526). Tk tolerates this on Windows; **Qt does not** — `QApplication.exec()` must run on the main thread. The port therefore *inverts* the model: **Qt event loop on the main thread**, HTTP server stays on its background thread (it already is, `main.py` L318). All log lines and async callbacks (which arrive on server/worker threads) are marshalled to the GUI via **signals**, replacing every `root.after(0, …)` call (there are ~15).

---

## 2. Target architecture

```
server/
  qt_dashboard/
    __init__.py        # exports create_dashboard(cb, *, log_formatter, logger) -> (QApplication, MainWindow)
    _qt.py             # single import surface for PyQt6 (swap point for PySide6)
    theme.py           # Theme constants + build_stylesheet() -> QSS string
    icons.py           # ICON_PATHS (reuse) + make_icon(name, size, color) -> QIcon/QPixmap
    widgets.py         # IconButton(QPushButton), StatusCard(QFrame), NavItem(QFrame)
    log_bridge.py      # LogSignaller(QObject) + QtLogHandler(logging.Handler)
    workers.py         # WorkerSignals(QObject) + Worker(QRunnable) for background tasks
    window.py          # DashboardWindow(QMainWindow): panels, nav, responsive layout, wiring
  main.py              # edited: QT_AVAILABLE guard + main-thread exec()
  dashboard_ui.py      # DELETED in Phase 6 (kept until parity confirmed)
  dashboard_icons.py   # DELETED in Phase 6
```

### Framework mapping (Tk → PyQt6)

| Tkinter | PyQt6 | Notes |
|---------|-------|-------|
| `tk.Tk()` + `root.mainloop()` | `QApplication` + `window.show()` + `app.exec()` | **main thread only** |
| `root.after(0, fn)` | `signal.emit(...)` → slot on GUI thread | thread-safe marshalling |
| `root.after(ms, fn)` | `QTimer.singleShot(ms, fn)` | delayed one-shot |
| `tk.Frame` | `QFrame` / `QWidget` + layout | |
| `tk.Label` | `QLabel` | |
| `ttk.Combobox` | `QComboBox` | |
| `ttk.Treeview` | `QTableWidget` (11 cols) | headings + `selectmode=extended` → `ExtendedSelection` |
| `scrolledtext.ScrolledText` | `QPlainTextEdit(readOnly)` | log view; use `appendHtml`/`ExtraSelection` or per-line HTML for colour |
| `tk.Canvas` icons | `QPixmap` + `QPainter` (round pen) | port `draw_icon` |
| `pack`/`grid` | `QVBoxLayout`/`QHBoxLayout`/`QGridLayout`/`QStackedLayout` | |
| panel switching (`pack_forget`/`pack`) | `QStackedWidget.setCurrentWidget` | |
| `messagebox.*` | `QMessageBox.information/warning/critical/question` | |
| `tk.Toplevel` dialogs | `QDialog` | export / sample-data / CSV dialogs |
| `<Configure>` bind (responsive) | override `resizeEvent` | landscape rail ↔ portrait bottom-nav |
| `threading.Thread(daemon=True)` for tasks | `QThreadPool.globalInstance().start(Worker(...))` | + signals for progress/done |
| `Theme` colour constants | `theme.py` constants + QSS stylesheet | prefer QSS for hover states |
| `WM_DELETE_WINDOW` protocol | `closeEvent` / `app.aboutToQuit` | run shutdown callback |
| `os.name == 'nt'` mono font | `QFont('Cascadia Mono')` fallback `Consolas` | |

---

## 3. Phased runbook

Each phase: **edit → verify → commit**. Gate command shown per phase. Global gates from `.cursor/rules/testing-gates.mdc`: `npm run test:unit` (0 failures) and `node scripts/verify/doc-links.mjs --strict` must stay green throughout.

### Phase 0 — Dependency + import surface

1. **`requirements.txt`** — add after the watchdog block:

```
# PyQt6 dev-server dashboard (GPL-3.0 / commercial). Dev-only tool, not shipped in the PWA.
# API-compatible with PySide6 (LGPL) if a permissive license is later required.
PyQt6>=6.7,<6.11
```

> Floor `6.7` (safe, widely available wheels); ceiling `<6.11` pins to the verified 6.10 line. Requires Python >= 3.10 (already the recommended floor in `requirements.txt` header).

2. **`server/qt_dashboard/_qt.py`** — the single swap point:

```python
"""Single PyQt6 import surface. Swap this one file for PySide6 (LGPL) if needed."""
from PyQt6.QtCore import (
    Qt, QObject, QRunnable, QThreadPool, QTimer, QSize, QRectF, pyqtSignal, pyqtSlot,
)
from PyQt6.QtGui import QColor, QFont, QIcon, QPainter, QPen, QPixmap
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QFrame, QLabel, QPushButton, QComboBox,
    QTableWidget, QTableWidgetItem, QPlainTextEdit, QStackedWidget, QDialog,
    QLineEdit, QVBoxLayout, QHBoxLayout, QGridLayout, QMessageBox, QSizePolicy,
    QAbstractItemView, QHeaderView,
)

Signal = pyqtSignal   # PySide6 alias parity
Slot = pyqtSlot
```

**Gate:** `python -c "import PyQt6; from PyQt6.QtWidgets import QApplication; print(PyQt6.QtCore.PYQT_VERSION_STR)"` prints a `6.10.x` string.

---

### Phase 1 — Theme + icons

1. **`server/qt_dashboard/theme.py`** — copy the `Theme` colour/font constants verbatim from `dashboard_ui.py` L40-60, then add a `build_stylesheet(T) -> str` returning QSS. QSS handles hover/disabled states that Tk did manually in `IconButton._on_enter/_on_leave`. Example core:

```python
def build_stylesheet(T):
    return f"""
    QWidget {{ background: {T.bg}; color: {T.text}; font-family: 'Segoe UI'; font-size: 10pt; }}
    QFrame#card {{ background: {T.card}; border: 1px solid {T.border}; border-radius: 6px; }}
    QPushButton#iconbtn {{ background: {T.card}; border: none; padding: 6px 10px; text-align: left; }}
    QPushButton#iconbtn:hover {{ background: {T.card_hover}; }}
    QPushButton#iconbtn:disabled {{ color: {T.muted}; }}
    QPushButton#iconbtn[variant="primary"] {{ background: #142018; color: {T.accent}; }}
    QPushButton#iconbtn[variant="danger"]  {{ background: #1a1010; color: #ffaaaa; }}
    QComboBox {{ background: {T.card}; border: 1px solid {T.border}; padding: 3px 6px; }}
    QTableWidget {{ background: {T.card}; gridline-color: {T.border}; }}
    QHeaderView::section {{ background: #111a14; color: {T.accent}; border: 0; padding: 4px; font-weight: bold; }}
    QPlainTextEdit {{ background: {T.log_bg}; border: none; }}
    """
```

2. **`server/qt_dashboard/icons.py`** — **reuse `ICON_PATHS`** (import from `..dashboard_icons` until Phase 6, then inline the dict here). Port `draw_icon` to paint on a `QPixmap`:

```python
from ._qt import QColor, QIcon, QPainter, QPen, QPixmap, QRectF, Qt, QSize
from ..dashboard_icons import ICON_PATHS   # move dict here in Phase 6

def make_pixmap(name, size=20, color='#dff0eb', pad=2.0):
    pm = QPixmap(size, size); pm.fill(Qt.GlobalColor.transparent)
    paths = ICON_PATHS.get(name)
    if not paths: return pm
    p = QPainter(pm); p.setRenderHint(QPainter.RenderHint.Antialiasing)
    pen = QPen(QColor(color)); pen.setWidthF(max(1.4, size/14))
    pen.setCapStyle(Qt.PenCapStyle.RoundCap); pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin)
    p.setPen(pen)
    scale = (size - pad*2)/24.0
    for x1,y1,x2,y2 in paths:
        p.drawLine(int(pad+x1*scale), int(pad+y1*scale), int(pad+x2*scale), int(pad+y2*scale))
    p.end(); return pm

def make_icon(name, size=20, color='#dff0eb'):
    return QIcon(make_pixmap(name, size, color))
```

**Gate:** `python -c "from server.qt_dashboard import icons; icons"` imports without error (run from repo root; needs an offscreen platform in CI — see Phase 5 note).

---

### Phase 2 — Widgets + log bridge + workers

1. **`server/qt_dashboard/widgets.py`** — three classes mirroring Tk equivalents:
   - `IconButton(QPushButton)`: constructor `(text, icon, on_click, *, variant='default', compact=False)`; sets `objectName('iconbtn')`, `setProperty('variant', variant)`, `setIcon(make_icon(...))`, `clicked.connect(on_click)`. Replaces `dashboard_ui.py` L78-155.
   - `StatusCard(QFrame)`: `objectName('card')`; title row (icon + bold label), a `status_label` (`QLabel`, word-wrap), and an `actions` row (`QHBoxLayout`) exposed for buttons. Replaces L158-173. Expose `set_status(text, color)`.
   - `NavItem(QFrame)`: icon + label, `panel_id`, `clicked`-like via `mousePressEvent`, `set_active(bool)` toggling accent bar + colours. Replaces L176-204.

2. **`server/qt_dashboard/log_bridge.py`** — **the thread-safety fix**:

```python
import logging
from ._qt import QObject, Signal

class LogSignaller(QObject):
    line = Signal(str, str)   # (formatted_message, levelname)

class QtLogHandler(logging.Handler):
    def __init__(self, signaller: LogSignaller):
        super().__init__()
        self._sig = signaller
    def emit(self, record):
        try:
            self._sig.line.emit(self.format(record), record.levelname)
        except Exception:
            pass
```

The window connects `signaller.line` to a `@Slot(str, str)` that appends to the `QPlainTextEdit` — connection is **auto/queued**, so it is safe to log from server threads. This replaces the Tk `TextHandler` + `win.after(0, …)` (L890-929) and the per-level colour tags (map levels → HTML `<span style=color:…>`), plus the 1200-line trim and the `log_filter` level gate (reuse `LEVEL_RANK` + `_filter_allows`, L877-888).

3. **`server/qt_dashboard/workers.py`** — background-task pattern (replaces every `threading.Thread(...).start()` + `root.after`):

```python
from ._qt import QObject, QRunnable, Signal, Slot

class WorkerSignals(QObject):
    result = Signal(object)
    error = Signal(str)
    progress = Signal(str)
    finished = Signal()

class Worker(QRunnable):
    def __init__(self, fn, *a, **kw):
        super().__init__(); self.fn, self.a, self.kw = fn, a, kw
        self.signals = WorkerSignals()
    @Slot()
    def run(self):
        try:
            self.signals.result.emit(self.fn(*self.a, **self.kw))
        except Exception as e:
            self.signals.error.emit(str(e))
        finally:
            self.signals.finished.emit()
```

Used for: `install_requirements_ui`, `check_connection`, `load_available_conditions`, `perform_search`, `export_data`, `wipe_database`, `generate_sample_data`, `generate_csv_sample`, and the Chromium download (`install_chromium_async` already async — connect its `on_progress`/`on_done` to signals so its callbacks, which fire on a worker thread, hop to the GUI thread).

**Gate:** `npm run test:unit` still green (no runtime import of Qt in tests yet).

---

### Phase 3 — Main window (panels, nav, responsive)

**`server/qt_dashboard/window.py`** — `DashboardWindow(QMainWindow)` implementing `create_dashboard(cb, *, log_formatter, logger)`. Port panel-by-panel from `dashboard_ui.py`:

- **Shell/header** (L246-280): brand labels + app URL (`_app_url()` logic L236-243) + "Browser" / "Chromium" `IconButton`s.
- **Body**: left `QWidget` nav rail (landscape) OR bottom nav bar (portrait) + a `QStackedWidget` for panels.
- **Overview panel** (L320-348): 4 `StatusCard`s (Local server / Supabase / Live reload / Clean Chromium) + quick-action buttons.
- **Database panel** (L350-411): record badge, condition `QComboBox`, search/action button rows, and the **`QTableWidget`** with the 11 columns from L397-404 (`id, condition, date, bpm, weight, fatigue, stiffness, sleep, mood, steps, flare`) using `ExtendedSelection`; keep the empty-state overlay label and `selection_count_label`.
- **Tools panel** (L413-443): reload / clean-Chromium / deps cards.
- **Logs panel** (L445-475): `QPlainTextEdit` (read-only) + level filter `QComboBox` + Clear / Auto-scroll buttons.

Wire **all** business logic functions (L478-858), swapping the mechanism only:
- `messagebox.*` → `QMessageBox.*`.
- `root.after(0, fn)` → call directly if already on GUI thread, else emit a signal.
- Long tasks → `QThreadPool.globalInstance().start(Worker(...))`, connect `.signals.result/error/progress`.
- Dialogs (`export_data` L681-711, `generate_sample_data` L753-800, `generate_csv_sample` L802-836) → `QDialog` subclasses with `QLineEdit` fields.

**Responsive** (replaces `relayout` L950-994): override `resizeEvent`; `portrait = h > w*0.95 or w < 820`; show bottom-nav + stack cards vertically in portrait, sidebar rail + horizontal cards in landscape. Debounce with a `QTimer` if needed.

**Startup** (L996-1011): after `show()`, call `refresh_watchdog_label`, `check_connection`, `load_available_conditions`, `refresh_db_viewer`, select `overview`. Port the `pulse_status` cosmetic pulse with `QTimer` (optional; low priority).

**Shutdown** (replaces `on_closing` L1013-1028): override `closeEvent` → run the `cb.server_lock` + `get_server_instance().shutdown()` sequence, then `logger`-log and `QApplication.quit()`. **Do not** call `os._exit(0)` from `closeEvent`; let `app.exec()` return so `main.py` can clean up. (Keep an `os._exit` fallback only if graceful quit hangs > 2 s via a `QTimer`.)

**`server/qt_dashboard/__init__.py`**:

```python
from .window import create_dashboard   # -> (QApplication, DashboardWindow)
```

**Gate:** manual smoke — see Phase 5.

---

### Phase 4 — Rewire `main.py` (threading flip)

Edits to `server/main.py`:

1. **Availability guard** (replace L94-101): keep Tk import removed later; add:

```python
try:
    from PyQt6.QtWidgets import QApplication  # noqa: F401
    QT_AVAILABLE = True
except ImportError:
    QT_AVAILABLE = False
    print("Warning: PyQt6 not available. Dashboard disabled. Install: pip install PyQt6")
```

Keep `TKINTER_AVAILABLE` only until Phase 6 (or delete now and update the two `if TKINTER_AVAILABLE` sites at L439/L484).

2. **`create_server_dashboard()`** (L326-353): build the same `DashboardCallbacks`, then:

```python
from . import qt_dashboard
return qt_dashboard.create_dashboard(callbacks, log_formatter=dashboard_log_formatter, logger=logger)
```

3. **Threading flip** (this is the core change). Today: server thread starts, dashboard runs in a **secondary** thread (L437-450), main thread loops `sleep(1)` (L523-532). New model:
   - Server thread still starts in the background (unchanged, L318/L420).
   - The **main thread** creates the `QApplication`, shows the window, and runs `app.exec()`.
   - Add a `QTimer` firing every ~200 ms doing nothing (or `lambda: None`) so Python can process `SIGINT` (Ctrl+C) while the Qt loop runs — otherwise Ctrl+C is swallowed. Alternatively install `signal.signal(signal.SIGINT, signal.SIG_DFL)` before `exec()`.

```python
if QT_AVAILABLE:
    app, window = create_server_dashboard()
    window.show()
    keepalive = QTimer(); keepalive.start(200); keepalive.timeout.connect(lambda: None)
    import signal as _signal; _signal.signal(_signal.SIGINT, _signal.SIG_DFL)
    exit_code = app.exec()          # blocks on MAIN thread until window closed
    # graceful teardown (moved out of the old while-loop / KeyboardInterrupt block)
    _shutdown_everything()          # file_observer.stop/join, close SSE, server_instance.shutdown()
    sys.exit(exit_code)
else:
    # headless: keep the existing while True: sleep(1) keep-alive + KeyboardInterrupt teardown
    _run_headless_keepalive()
```

Refactor the teardown in L533-556 into a `_shutdown_everything()` helper called from both branches.

**Gate:** `python -m server` launches, window appears, Ctrl+C in console still stops cleanly, closing the window stops the server (port released).

---

### Phase 5 — Verify / smoke

1. **Unit gate:** `npm run test:unit` → 0 failures. `node scripts/verify/doc-links.mjs --strict` → exit 0.
2. **Add a lightweight import test** `tests/unit/server/qt-dashboard-imports.test.mjs` (or a Python smoke in CI) that asserts `server/qt_dashboard/*` modules import under an **offscreen** Qt platform. In CI/headless set `QT_QPA_PLATFORM=offscreen` before importing, mirroring the existing `TKINTER_AVAILABLE=False` tolerance.
3. **Manual smoke on the local Chromium server** (per prior sessions the user runs `server/launch-server.ps1` / `python -m server`):
   - Launch → dashboard opens (main thread), no `QApplication` "must be created in main thread" error.
   - Overview cards populate; Supabase status resolves.
   - Database: Search + Refresh view populate the `QTableWidget`; Ctrl+A selects all; selection count updates.
   - Logs: server log lines stream **live** and colourised, filter switches work, Clear works, no crash when logs arrive from server threads (proves the signal bridge).
   - Tools: Pause/Start watch toggles watchdog; Push reload signals browsers; Chromium download progress updates; Install deps runs.
   - Dialogs: Export / Sample data / CSV open as `QDialog`, run their worker, show result.
   - Resize the window narrow → portrait bottom-nav appears; widen → sidebar returns.
   - Close window → server shuts down, port freed (re-launch succeeds).

**Feature-parity checklist** (tick every one against `dashboard_ui.py`):

- [ ] Header: brand, app URL, Browser, Chromium
- [ ] Overview: 4 status cards + quick actions
- [ ] Supabase connect / refresh / install deps / status pulse
- [ ] DB search by condition, conditions dropdown load, refresh view, 100-row cap, record badge
- [ ] Export CSV dialog, Wipe DB (with confirm + service-key path + sequence reset), Sample data dialog, CSV file dialog
- [ ] Live reload: pause / start / push reload, watchdog status + colour
- [ ] Clean Chromium: launch, status, async download + progress
- [ ] Logs: live stream, per-level colour, filter, clear, auto-scroll toggle, 1200-line trim
- [ ] Responsive landscape ↔ portrait
- [ ] Graceful shutdown on close

---

### Phase 6 — Cleanup + docs

1. Delete `server/dashboard_ui.py` and `server/dashboard_icons.py` (inline `ICON_PATHS` into `qt_dashboard/icons.py` first). Remove the Tk import block and `TKINTER_AVAILABLE` from `main.py`.
2. Update references: `AGENTS.md` / `docs/project-reference.md` mentions of the "Tkinter dashboard" → "PyQt6 dashboard". Grep: `rg -n "tkinter|Tkinter|TKINTER" server docs .cursor` and fix stragglers.
3. **CHANGELOG.md** — new entry (Changed): "Dev-server dashboard migrated Tkinter → PyQt6 (`server/qt_dashboard/`); GUI now runs on the main thread with signal-marshalled logging (fixes cross-thread log writes), QSS theming, responsive Qt layout. PyQt6>=6.7 added to `requirements.txt`."
4. Run `node scripts/verify/doc-links.mjs --strict` and `npm run test:unit` a final time.

---

## 4. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| GPL-3.0 obligations if server is ever distributed | Dev-only tool today; Qt imports isolated in `_qt.py` for a 1-file PySide6 (LGPL) swap |
| Qt requires main-thread GUI; server currently backgrounds the UI | Phase 4 flips the model (Qt on main, server on background thread) |
| Ctrl+C swallowed by Qt event loop | `QTimer` heartbeat + `signal.SIG_DFL` before `exec()` |
| Cross-thread log/callback writes crash Qt | `LogSignaller`/`WorkerSignals` (queued connections) — never touch widgets off-thread |
| Headless CI has no display | `QT_QPA_PLATFORM=offscreen`; keep `QT_AVAILABLE=False` graceful path |
| `ttk.Treeview` → `QTableWidget` behavioural drift | Preserve 11 columns, extended selection, Ctrl+A, 100-row cap, selection count |
| Wheel availability on the target Python | Verified floor Python >=3.10; PyQt6 6.10 ships cp310–cp313 wheels |

## 5. References

- Current implementation: `server/dashboard_ui.py`, `server/dashboard_icons.py`, `server/main.py` (L94-101, L326-353, L437-450, L523-563).
- Backend contracts: `server/chromium_dev.py`, `server/supabase_client.py`, `server/config.py`, `server/requirements_check.py`, `server/sample_data.py`, `server/encryption.py`.
- Gates: `.cursor/rules/testing-gates.mdc`, `docs/plans/ROLLOUT-GATE.md`.
- Firecrawl-verified (2026-07-19): [PyQt6 PyPI](https://pypi.org/project/PyQt6/), [PySide6 PyPI](https://pypi.org/project/PySide6/), [Qt threading basics](https://doc.qt.io/qt-6/thread-basics.html), [RealPython QThread](https://realpython.com/python-pyqt-qthread/).
