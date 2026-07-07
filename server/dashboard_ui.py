"""
Modern responsive Tkinter dashboard for the Rianell dev server.
Supports landscape (sidebar) and portrait (bottom nav) layouts with animated transitions.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import threading
import time
import webbrowser
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Optional

import tkinter as tk
from tkinter import messagebox, scrolledtext, ttk

from . import chromium_dev, config, encryption, requirements_check, sample_data, supabase_client
from .dashboard_icons import draw_icon, icon_canvas

decrypt_anonymized_data = encryption.decrypt_anonymized_data
generate_sample_csv_data = sample_data.generate_sample_csv_data
check_supabase_availability = supabase_client.check_supabase_availability
init_supabase_client = supabase_client.init_supabase_client
search_supabase_data = supabase_client.search_supabase_data
export_supabase_data = supabase_client.export_supabase_data
generate_and_post_sample_data_to_supabase = supabase_client.generate_and_post_sample_data_to_supabase
get_supabase_service_client = supabase_client.get_supabase_service_client
try_restart_anonymized_data_id_sequence = supabase_client.try_restart_anonymized_data_id_sequence
install_requirements = requirements_check.install_requirements


# ── Theme ────────────────────────────────────────────────────────────────────

class Theme:
    bg          = '#0a0e0c'
    surface     = '#111714'
    card        = '#0f1411'
    card_hover  = '#161d18'
    header      = '#0d1210'
    border      = '#1e2e24'
    text        = '#e4f2ec'
    muted       = '#7f968a'
    accent      = '#5dd97a'
    accent_dim  = '#3a9e52'
    warn        = '#ffb74d'
    danger      = '#ff6b6b'
    ok          = '#4caf50'
    info        = '#64b5f6'
    log_bg      = '#0a100d'
    font_ui     = ('Segoe UI', 10)
    font_sm     = ('Segoe UI', 9)
    font_title  = ('Segoe UI', 14, 'bold')
    font_mono   = ('Cascadia Mono', 9)
    font_mono_fb = ('Consolas', 9)


@dataclass
class DashboardCallbacks:
    pause_file_observer: Callable[[], tuple[bool, str]]
    resume_file_observer: Callable[[], tuple[bool, str]]
    signal_clients_reload: Callable[[], None]
    watchdog_status_label: Callable[[], str]
    watchdog_available: bool
    server_lock: Any
    get_server_instance: Callable[[], Any]
    get_supabase_available: Callable[[], bool]
    set_supabase_available: Callable[[bool], None]


# ── Widgets ──────────────────────────────────────────────────────────────────

class IconButton(tk.Frame):
    """Flat button with SVG-style icon and hover animation."""

    def __init__(
        self, parent, text: str, icon: str, command: Callable,
        *, style: str = 'default', compact: bool = False,
    ):
        super().__init__(parent, bg=Theme.surface, highlightthickness=0)
        self._command = command
        self._style = style
        self._icon_name = icon
        self._hover = False
        self._enabled = True

        if style == 'danger':
            self._bg = '#1a1010'
            self._bg_hover = '#2a1515'
            self._fg = '#ffaaaa'
            self._icon_color = '#ff8888'
        elif style == 'primary':
            self._bg = '#142018'
            self._bg_hover = '#1c3024'
            self._fg = Theme.accent
            self._icon_color = Theme.accent
        else:
            self._bg = Theme.card
            self._bg_hover = Theme.card_hover
            self._fg = Theme.text
            self._icon_color = Theme.text

        self._inner = tk.Frame(self, bg=self._bg, padx=10 if not compact else 6, pady=6 if not compact else 4)
        self._inner.pack(fill=tk.BOTH, expand=True)

        isize = 16 if compact else 18
        self._icon = tk.Canvas(self._inner, width=isize, height=isize, bg=self._bg, highlightthickness=0, bd=0)
        self._icon.pack(side=tk.LEFT, padx=(0, 6 if not compact else 4))
        draw_icon(self._icon, icon, size=isize, color=self._icon_color)

        if text:
            self._label = tk.Label(
                self._inner, text=text, bg=self._bg, fg=self._fg,
                font=Theme.font_sm if compact else Theme.font_ui, cursor='hand2',
            )
            self._label.pack(side=tk.LEFT)

        for w in (self, self._inner, self._icon, getattr(self, '_label', None)):
            if w is None:
                continue
            w.bind('<Enter>', self._on_enter)
            w.bind('<Leave>', self._on_leave)
            w.bind('<Button-1>', self._on_click)

    def _paint(self, bg: str):
        self._inner.config(bg=bg)
        self._icon.config(bg=bg)
        if hasattr(self, '_label'):
            self._label.config(bg=bg)

    def _on_enter(self, _event=None):
        if not self._enabled:
            return
        self._hover = True
        self._paint(self._bg_hover)

    def _on_leave(self, _event=None):
        self._hover = False
        self._paint(self._bg)

    def _on_click(self, _event=None):
        if self._enabled and self._command:
            self._command()

    def set_enabled(self, enabled: bool):
        self._enabled = enabled
        fg = self._fg if enabled else Theme.muted
        if hasattr(self, '_label'):
            self._label.config(fg=fg, cursor='hand2' if enabled else 'arrow')
        draw_icon(self._icon, self._icon_name, size=16, color=fg)


class StatusCard(tk.Frame):
    """Compact status tile for the overview grid."""

    def __init__(self, parent, title: str, icon: str):
        super().__init__(parent, bg=Theme.card, highlightbackground=Theme.border, highlightthickness=1)
        head = tk.Frame(self, bg=Theme.card, padx=12, pady=8)
        head.pack(fill=tk.X)
        ic = icon_canvas(head, icon, size=18, color=Theme.accent, bg=Theme.card)
        ic.pack(side=tk.LEFT, padx=(0, 8))
        tk.Label(head, text=title, bg=Theme.card, fg=Theme.text, font=('Segoe UI', 10, 'bold')).pack(side=tk.LEFT)
        self.body = tk.Frame(self, bg=Theme.card, padx=12, pady=(0, 10))
        self.body.pack(fill=tk.BOTH, expand=True)
        self.status_lbl = tk.Label(self.body, text='—', bg=Theme.card, fg=Theme.muted, font=Theme.font_sm, anchor='w', justify=tk.LEFT, wraplength=280)
        self.status_lbl.pack(fill=tk.X, anchor='w')
        self.actions = tk.Frame(self.body, bg=Theme.card)
        self.actions.pack(fill=tk.X, pady=(8, 0))


class NavItem(tk.Frame):
    """Sidebar or bottom-nav entry with active indicator animation."""

    def __init__(self, parent, label: str, icon: str, panel_id: str, on_select: Callable[[str], None]):
        super().__init__(parent, bg=Theme.surface, cursor='hand2')
        self.panel_id = panel_id
        self._icon_name = icon
        self._on_select = on_select
        self._active = False
        self._bar = tk.Frame(self, bg=Theme.surface, width=3)
        self._bar.pack(side=tk.LEFT, fill=tk.Y)
        inner = tk.Frame(self, bg=Theme.surface, padx=10, pady=10)
        inner.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self._icon = icon_canvas(inner, icon, size=20, color=Theme.muted, bg=Theme.surface)
        self._icon.pack()
        self._text = tk.Label(inner, text=label, bg=Theme.surface, fg=Theme.muted, font=Theme.font_sm)
        self._text.pack(pady=(4, 0))
        for w in (self, inner, self._icon, self._text):
            w.bind('<Button-1>', lambda e, pid=panel_id: on_select(pid))

    def set_active(self, active: bool, *, horizontal: bool = False):
        self._active = active
        bg = Theme.card if active else Theme.surface
        fg = Theme.accent if active else Theme.muted
        self.config(bg=bg)
        self._bar.config(bg=Theme.accent if active else Theme.surface)
        self._icon.config(bg=bg)
        self._text.config(bg=bg, fg=fg)
        draw_icon(self._icon, self._icon_name, size=20, color=fg)


# ── Main dashboard ───────────────────────────────────────────────────────────

def create_dashboard(cb: DashboardCallbacks, *, log_formatter: logging.Formatter, logger: logging.Logger) -> tk.Tk:
    root = tk.Tk()
    root.title('Rianell Server Dashboard')
    root.geometry('1180x860')
    root.minsize(640, 520)
    root.configure(bg=Theme.bg)

    T = Theme
    search_results: list = []
    portrait_mode = {'value': False}
    active_panel = {'id': 'overview'}
    nav_items: list[NavItem] = []
    panel_frames: dict[str, tk.Frame] = {}

    # ── ttk styles ───────────────────────────────────────────────────────────
    style = ttk.Style()
    style.theme_use('clam')
    style.configure('.', background=T.bg, foreground=T.text, fieldbackground=T.card)
    style.configure('TFrame', background=T.bg)
    style.configure('Card.TFrame', background=T.card)
    style.configure('TCombobox', fieldbackground=T.card, foreground=T.text, arrowsize=12)
    style.map('TCombobox', fieldbackground=[('readonly', T.card)], foreground=[('readonly', T.text)])
    style.configure('Treeview', background=T.card, fieldbackground=T.card, foreground=T.text, bordercolor=T.border, rowheight=24, relief='flat')
    style.map('Treeview', background=[('selected', '#1a3f2e')], foreground=[('selected', '#e8fff2')])
    style.configure('Treeview.Heading', background='#111a14', foreground=T.accent, bordercolor=T.border, font=('Segoe UI', 9, 'bold'))
    style.configure('TEntry', fieldbackground=T.card, foreground=T.text, insertcolor=T.accent)

    def _app_url():
        h = config.HOST.strip()
        if h in ('0.0.0.0', '::', '[::]'):
            return f'http://127.0.0.1:{config.PORT}'
        if ':' in h and not h.startswith('['):
            return f'http://[{h}]:{config.PORT}'
        return f'http://{h}:{config.PORT}'

    app_url = _app_url()

    # ── Shell layout ─────────────────────────────────────────────────────────
    shell = tk.Frame(root, bg=T.bg)
    shell.pack(fill=tk.BOTH, expand=True)

    header = tk.Frame(shell, bg=T.header, padx=16, pady=12)
    header.pack(fill=tk.X)

    brand = tk.Frame(header, bg=T.header)
    brand.pack(side=tk.LEFT)
    tk.Label(brand, text='Rianell', bg=T.header, fg=T.accent, font=T.font_title).pack(side=tk.LEFT)
    tk.Label(brand, text='  Server Dashboard', bg=T.header, fg=T.muted, font=T.font_ui).pack(side=tk.LEFT, padx=(4, 0))
    tk.Label(header, text=app_url, bg=T.header, fg=T.muted, font=T.font_sm).pack(side=tk.LEFT, padx=(20, 0))

    hdr_actions = tk.Frame(header, bg=T.header)
    hdr_actions.pack(side=tk.RIGHT)

    def open_browser():
        try:
            webbrowser.open(app_url, new=2)
            logger.info('Opened app in browser: %s', app_url)
        except Exception as e:
            messagebox.showerror('Browser', f'Could not open:\n{app_url}\n\n{e}')

    def open_chromium():
        ok, msg = chromium_dev.launch_clean_chromium(app_url)
        if ok:
            logger.info(msg)
        else:
            messagebox.showerror('Clean Chromium', msg)

    IconButton(hdr_actions, 'Browser', 'globe', open_browser, compact=True).pack(side=tk.RIGHT, padx=(6, 0))
    clean_chromium_btn_holder = tk.Frame(hdr_actions, bg=T.header)
    clean_chromium_btn_holder.pack(side=tk.RIGHT, padx=(6, 0))
    clean_chromium_btn = IconButton(clean_chromium_btn_holder, 'Chromium', 'chrome', open_chromium, compact=True)
    clean_chromium_btn.pack()

    body = tk.Frame(shell, bg=T.bg)
    body.pack(fill=tk.BOTH, expand=True)

    nav_rail = tk.Frame(body, bg=T.surface, width=88)
    nav_rail.pack_propagate(False)

    content_area = tk.Frame(body, bg=T.bg, padx=12, pady=10)
    content_area.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    bottom_nav = tk.Frame(shell, bg=T.surface, height=72)
    bottom_nav.pack_propagate(False)

    tk.Frame(shell, bg=T.border, height=1).pack(fill=tk.X)

    # ── Panel switch animation ───────────────────────────────────────────────
    def show_panel(panel_id: str):
        if panel_id == active_panel['id']:
            return
        prev = panel_frames.get(active_panel['id'])
        nxt = panel_frames.get(panel_id)
        if not nxt:
            return
        active_panel['id'] = panel_id
        for item in nav_items:
            item.set_active(item.panel_id == panel_id, horizontal=portrait_mode['value'])
        # quick fade via staggered lift
        if prev:
            prev.pack_forget()
        nxt.pack(fill=tk.BOTH, expand=True)
        nxt.lift()

    def build_nav_item(parent, label, icon, panel_id, *, horizontal=False):
        def on_sel(pid):
            show_panel(pid)
        item = NavItem(parent, label, icon, panel_id, on_sel)
        nav_items.append(item)
        return item

    # ── Overview panel ───────────────────────────────────────────────────────
    overview = tk.Frame(content_area, bg=T.bg)
    panel_frames['overview'] = overview

    tk.Label(overview, text='Overview', bg=T.bg, fg=T.text, font=('Segoe UI', 12, 'bold')).pack(anchor='w', pady=(0, 10))
    cards_row = tk.Frame(overview, bg=T.bg)
    cards_row.pack(fill=tk.X)

    server_card = StatusCard(cards_row, 'Local server', 'globe')
    server_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
    server_card.status_lbl.config(text=f'Running at {app_url}')

    supa_card = StatusCard(cards_row, 'Supabase', 'database')
    supa_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
    connection_status = supa_card.status_lbl

    watch_card = StatusCard(cards_row, 'Live reload', 'broadcast')
    watch_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
    watchdog_lbl = watch_card.status_lbl

    chrome_card = StatusCard(cards_row, 'Clean Chromium', 'chrome')
    chrome_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
    chromium_status_lbl = chrome_card.status_lbl

    quick_row = tk.Frame(overview, bg=T.bg)
    quick_row.pack(fill=tk.X, pady=(16, 0))
    tk.Label(quick_row, text='Quick actions', bg=T.bg, fg=T.muted, font=T.font_sm).pack(anchor='w', pady=(0, 8))
    qa_btns = tk.Frame(quick_row, bg=T.bg)
    qa_btns.pack(fill=tk.X)

    # ── Database panel ───────────────────────────────────────────────────────
    database_panel = tk.Frame(content_area, bg=T.bg)
    panel_frames['database'] = database_panel

    db_head = tk.Frame(database_panel, bg=T.bg)
    db_head.pack(fill=tk.X, pady=(0, 8))
    tk.Label(db_head, text='Database', bg=T.bg, fg=T.text, font=('Segoe UI', 12, 'bold')).pack(side=tk.LEFT)
    record_badge = tk.Label(db_head, text='0 records', bg=T.card, fg=T.muted, font=T.font_sm, padx=8, pady=2)
    record_badge.pack(side=tk.LEFT, padx=(12, 0))

    db_toolbar = tk.Frame(database_panel, bg=T.card, highlightbackground=T.border, highlightthickness=1, padx=12, pady=10)
    db_toolbar.pack(fill=tk.X, pady=(0, 8))

    conn_row = tk.Frame(db_toolbar, bg=T.card)
    conn_row.pack(fill=tk.X, pady=(0, 8))

    search_row = tk.Frame(db_toolbar, bg=T.card)
    search_row.pack(fill=tk.X, pady=(0, 8))
    tk.Label(search_row, text='Condition', bg=T.card, fg=T.muted, font=T.font_sm).pack(side=tk.LEFT, padx=(0, 8))
    search_var = tk.StringVar()
    search_dropdown = ttk.Combobox(search_row, textvariable=search_var, width=32, state='readonly')
    search_dropdown.pack(side=tk.LEFT, padx=(0, 8))

    action_row = tk.Frame(db_toolbar, bg=T.card)
    action_row.pack(fill=tk.X)

    viewer_wrap = tk.Frame(database_panel, bg=T.card, highlightbackground=T.border, highlightthickness=1)
    viewer_wrap.pack(fill=tk.BOTH, expand=True)

    viewer_toolbar = tk.Frame(viewer_wrap, bg=T.card, padx=10, pady=8)
    viewer_toolbar.pack(fill=tk.X)
    selection_count_label = tk.Label(viewer_toolbar, text='0 selected', bg=T.card, fg=T.muted, font=T.font_sm)
    selection_count_label.pack(side=tk.LEFT, padx=(8, 0))

    empty_state = tk.Label(viewer_wrap, text='No records yet — run Search or Generate Sample Data', bg=T.card, fg=T.muted, font=T.font_sm)
    empty_state.place(relx=0.5, rely=0.45, anchor='center')

    viewer_body = tk.Frame(viewer_wrap, bg=T.card)
    viewer_body.pack(fill=tk.BOTH, expand=True, padx=8, pady=(0, 8))
    viewer_body.columnconfigure(0, weight=1)
    viewer_body.rowconfigure(0, weight=1)

    viewer_tree = ttk.Treeview(
        viewer_body,
        columns=('id', 'condition', 'date', 'bpm', 'weight', 'fatigue', 'stiffness', 'sleep', 'mood', 'steps', 'flare'),
        show='headings', selectmode='extended',
    )
    for col, label, w in [
        ('id', 'ID', 44), ('condition', 'Condition', 130), ('date', 'Date', 88),
        ('bpm', 'BPM', 52), ('weight', 'Weight', 60), ('fatigue', 'Fatigue', 60),
        ('stiffness', 'Stiffness', 68), ('sleep', 'Sleep', 52), ('mood', 'Mood', 52),
        ('steps', 'Steps', 60), ('flare', 'Flare', 52),
    ]:
        viewer_tree.heading(col, text=label)
        viewer_tree.column(col, width=w, minwidth=36)

    vsb = ttk.Scrollbar(viewer_body, orient=tk.VERTICAL, command=viewer_tree.yview)
    hsb = ttk.Scrollbar(viewer_body, orient=tk.HORIZONTAL, command=viewer_tree.xview)
    viewer_tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
    viewer_tree.grid(row=0, column=0, sticky='nsew')
    vsb.grid(row=0, column=1, sticky='ns')
    hsb.grid(row=1, column=0, sticky='ew')

    # ── Tools panel ──────────────────────────────────────────────────────────
    tools_panel = tk.Frame(content_area, bg=T.bg)
    panel_frames['tools'] = tools_panel
    tk.Label(tools_panel, text='Developer tools', bg=T.bg, fg=T.text, font=('Segoe UI', 12, 'bold')).pack(anchor='w', pady=(0, 10))

    tools_grid = tk.Frame(tools_panel, bg=T.bg)
    tools_grid.pack(fill=tk.BOTH, expand=True)
    tools_grid.columnconfigure(0, weight=1)
    tools_grid.columnconfigure(1, weight=1)

    reload_card = tk.Frame(tools_grid, bg=T.card, highlightbackground=T.border, highlightthickness=1, padx=14, pady=14)
    reload_card.grid(row=0, column=0, sticky='nsew', padx=(0, 8), pady=(0, 8))
    tk.Label(reload_card, text='Live reload', bg=T.card, fg=T.text, font=('Segoe UI', 10, 'bold')).pack(anchor='w')
    reload_status = tk.Label(reload_card, text='', bg=T.card, fg=T.muted, font=T.font_sm, wraplength=320, justify=tk.LEFT)
    reload_status.pack(anchor='w', pady=(6, 10))
    reload_btns = tk.Frame(reload_card, bg=T.card)
    reload_btns.pack(anchor='w')

    chromium_card = tk.Frame(tools_grid, bg=T.card, highlightbackground=T.border, highlightthickness=1, padx=14, pady=14)
    chromium_card.grid(row=0, column=1, sticky='nsew', padx=(8, 0), pady=(0, 8))
    tk.Label(chromium_card, text='Clean Chromium', bg=T.card, fg=T.text, font=('Segoe UI', 10, 'bold')).pack(anchor='w')
    tk.Label(chromium_card, text='Isolated profile — fresh session each launch.', bg=T.card, fg=T.muted, font=T.font_sm, wraplength=320).pack(anchor='w', pady=(6, 10))
    chromium_tools_btns = tk.Frame(chromium_card, bg=T.card)
    chromium_tools_btns.pack(anchor='w')

    deps_card = tk.Frame(tools_grid, bg=T.card, highlightbackground=T.border, highlightthickness=1, padx=14, pady=14)
    deps_card.grid(row=1, column=0, columnspan=2, sticky='nsew')
    tk.Label(deps_card, text='Python dependencies', bg=T.card, fg=T.text, font=('Segoe UI', 10, 'bold')).pack(anchor='w')
    tk.Label(deps_card, text='Sync requirements.txt (supabase, pydantic, watchdog…).', bg=T.card, fg=T.muted, font=T.font_sm).pack(anchor='w', pady=(6, 10))
    deps_btns = tk.Frame(deps_card, bg=T.card)
    deps_btns.pack(anchor='w')

    # ── Logs panel ───────────────────────────────────────────────────────────
    logs_panel = tk.Frame(content_area, bg=T.bg)
    panel_frames['logs'] = logs_panel

    logs_head = tk.Frame(logs_panel, bg=T.bg)
    logs_head.pack(fill=tk.X, pady=(0, 8))
    tk.Label(logs_head, text='Server logs', bg=T.bg, fg=T.text, font=('Segoe UI', 12, 'bold')).pack(side=tk.LEFT)
    log_filter_var = tk.StringVar(value='All')
    log_filter = ttk.Combobox(logs_head, textvariable=log_filter_var, values=['All', 'Info+', 'Warning+', 'Errors only'], width=12, state='readonly')
    log_filter.pack(side=tk.RIGHT, padx=(8, 0))
    tk.Label(logs_head, text='Filter', bg=T.bg, fg=T.muted, font=T.font_sm).pack(side=tk.RIGHT)

    logs_wrap = tk.Frame(logs_panel, bg=T.card, highlightbackground=T.border, highlightthickness=1)
    logs_wrap.pack(fill=tk.BOTH, expand=True)

    mono = T.font_mono if os.name == 'nt' else T.font_mono_fb
    logs_text = scrolledtext.ScrolledText(
        logs_wrap, bg=T.log_bg, fg=T.text, font=mono, wrap=tk.WORD, insertbackground=T.accent, borderwidth=0,
    )
    logs_text.pack(fill=tk.BOTH, expand=True, padx=4, pady=4)

    for tag, color, bold in [
        ('LINE_DEBUG', '#8a9098', False), ('LINE_INFO', '#7ec8ff', False),
        ('LINE_WARNING', '#ffb74d', False), ('LINE_ERROR', '#ff6b6b', True),
        ('LINE_CRITICAL', '#ff4da6', True), ('TIMESTAMP', '#606870', False),
        ('BRACKET_INFO', '#7ec8ff', False), ('BRACKET_WARNING', '#ffb74d', False),
        ('BRACKET_ERROR', '#ff6b6b', True), ('SYNC', '#42a5f5', False),
        ('REQUEST', '#b39ddb', False), ('PATH', '#4dd0e1', False), ('DEFAULT', T.text, False),
    ]:
        logs_text.tag_config(tag, foreground=color, font=(mono[0], mono[1], 'bold') if bold else mono)

    log_autoscroll = {'on': True}

    # ── Business logic (preserved from legacy dashboard) ─────────────────────

    def refresh_watchdog_label():
        txt = cb.watchdog_status_label()
        watchdog_lbl.config(text=txt)
        reload_status.config(text=txt)
        color = T.ok if 'active' in txt else (T.warn if 'paused' in txt else T.muted)
        watchdog_lbl.config(fg=color)
        reload_status.config(fg=color)

    def on_pause_watch():
        ok, msg = cb.pause_file_observer()
        refresh_watchdog_label()
        if not ok:
            messagebox.showwarning('File watch', msg)

    def on_start_watch():
        ok, msg = cb.resume_file_observer()
        refresh_watchdog_label()
        if not ok:
            messagebox.showerror('File watch', msg)

    def on_push_reload():
        cb.signal_clients_reload()
        logger.info('Reload signal sent to connected browsers.')

    pause_watch_btn = IconButton(reload_btns, 'Pause', 'pause', on_pause_watch, compact=True)
    pause_watch_btn.pack(side=tk.LEFT, padx=(0, 6))
    start_watch_btn = IconButton(reload_btns, 'Start', 'play', on_start_watch, compact=True)
    start_watch_btn.pack(side=tk.LEFT, padx=(0, 6))
    IconButton(reload_btns, 'Push reload', 'broadcast', on_push_reload, compact=True).pack(side=tk.LEFT)
    if not cb.watchdog_available:
        pause_watch_btn.set_enabled(False)
        start_watch_btn.set_enabled(False)

    def refresh_chromium_status():
        st = chromium_dev.chromium_status()
        if st.get('installed'):
            chromium_status_lbl.config(text='Installed — isolated dev copy', fg=T.ok)
        elif st.get('nodeAvailable') is False:
            chromium_status_lbl.config(text='Node.js required for download', fg=T.warn)
        else:
            chromium_status_lbl.config(text='Not installed', fg=T.warn)

    def on_download_chromium():
        if not shutil.which('node'):
            messagebox.showerror('Clean Chromium', 'Node.js not found.\nInstall Node 20+ and run npm ci at repo root.')
            return
        download_chromium_btn.set_enabled(False)
        clean_chromium_btn.set_enabled(False)
        chromium_status_lbl.config(text='Downloading…', fg=T.warn)

        def on_progress(text):
            root.after(0, lambda: chromium_status_lbl.config(text=f'Chromium: {text}', fg=T.warn))

        def on_done(ok, msg):
            def finish():
                refresh_chromium_status()
                download_chromium_btn.set_enabled(True)
                clean_chromium_btn.set_enabled(True)
                (messagebox.showinfo if ok else messagebox.showerror)('Clean Chromium', msg)
            root.after(0, finish)

        chromium_dev.install_chromium_async(on_done, on_progress=on_progress)

    download_chromium_btn = IconButton(chromium_tools_btns, 'Download', 'download', on_download_chromium, compact=True)
    download_chromium_btn.pack(side=tk.LEFT)
    refresh_chromium_status()

    def check_connection():
        available = check_supabase_availability()
        cb.set_supabase_available(available)
        if not available:
            connection_status.config(text='Library missing — pip install supabase', fg=T.warn)
            return False
        client = init_supabase_client()
        if not client:
            connection_status.config(text='Failed to initialize client', fg=T.warn)
            return False
        try:
            client.table('anonymized_data').select('id').limit(1).execute()
            connection_status.config(text='Connected', fg=T.ok)
            return True
        except OSError as e:
            connection_status.config(
                text=f'Host unreachable — check SUPABASE_URL in security/.env ({e})', fg=T.warn,
            )
            return False
        except Exception as e:
            err = str(e)
            if 'getaddrinfo' in err or '11001' in err:
                connection_status.config(
                    text='DNS failed — update SUPABASE_URL in security/.env', fg=T.warn,
                )
            else:
                connection_status.config(text=f'Error: {err[:60]}', fg=T.warn)
            return False

    def install_requirements_ui():
        connection_status.config(text='Installing…', fg=T.warn)
        root.update()

        def install_thread():
            try:
                success = install_requirements()
                if success:
                    root.after(0, lambda: connection_status.config(text='Installed — refresh connection', fg=T.ok))
                    root.after(0, lambda: messagebox.showinfo('Success', 'Requirements installed.\nClick Refresh Connection.'))
                    root.after(2000, check_connection)
                else:
                    root.after(0, lambda: connection_status.config(text='Install failed — see logs', fg=T.warn))
                    root.after(0, lambda: messagebox.showerror('Error', 'Install failed. Check server logs.'))
            except Exception as e:
                logger.error('install_requirements_ui: %s', e, exc_info=True)
                root.after(0, lambda: connection_status.config(text='Installation error', fg=T.warn))
                root.after(0, lambda: messagebox.showerror('Error', str(e)))

        threading.Thread(target=install_thread, daemon=True).start()

    def load_available_conditions():
        if not check_supabase_availability():
            search_dropdown['values'] = []
            return
        client = init_supabase_client()
        if not client:
            search_dropdown['values'] = []
            return
        all_conditions = []
        from_range = 0
        page_size = 1000
        has_more = True
        while has_more:
            try:
                response = client.table('anonymized_data').select('medical_condition').range(
                    from_range, from_range + page_size - 1).execute()
                if response.data:
                    all_conditions.extend(d['medical_condition'] for d in response.data if d.get('medical_condition'))
                    has_more = len(response.data) >= page_size
                    from_range += page_size
                else:
                    has_more = False
            except Exception as e:
                logger.error('Error fetching conditions: %s', e)
                has_more = False
        search_dropdown['values'] = [''] + sorted(set(all_conditions))

    def refresh_db_viewer():
        try:
            for item in viewer_tree.get_children():
                viewer_tree.delete(item)
            selection_count_label.config(text='0 selected')
            if not check_supabase_availability():
                empty_state.place(relx=0.5, rely=0.45, anchor='center')
                record_badge.config(text='0 records')
                return
            data_to_show = search_results if search_results else search_supabase_data(limit=100)
            if not data_to_show:
                empty_state.place(relx=0.5, rely=0.45, anchor='center')
                record_badge.config(text='0 records')
                return
            empty_state.place_forget()
            count = min(len(data_to_show), 100)
            record_badge.config(text=f'{count} record{"s" if count != 1 else ""}')
            for record in data_to_show[:100]:
                try:
                    log_data = record.get('anonymized_logs') or record.get('anonymized_log', {})
                    if isinstance(log_data, str) and log_data:
                        try:
                            decrypted = decrypt_anonymized_data(log_data)
                            log_data = decrypted if isinstance(decrypted, dict) else json.loads(log_data)
                        except Exception:
                            log_data = {}
                    if isinstance(log_data, dict):
                        vals = (
                            record.get('id', 'N/A'), record.get('medical_condition', 'N/A'),
                            log_data.get('date', 'N/A'), log_data.get('bpm', 'N/A'),
                            log_data.get('weight', 'N/A'), log_data.get('fatigue', 'N/A'),
                            log_data.get('stiffness', 'N/A'), log_data.get('sleep', 'N/A'),
                            log_data.get('mood', 'N/A'), log_data.get('steps', 'N/A'),
                            log_data.get('flare', 'N/A'),
                        )
                    else:
                        vals = (record.get('id', 'N/A'), record.get('medical_condition', 'N/A'), *(['N/A'] * 9))
                    viewer_tree.insert('', 'end', values=vals)
                except Exception as e:
                    logger.error('Record %s: %s', record.get('id'), e)
        except Exception as e:
            logger.error('refresh_db_viewer: %s', e, exc_info=True)

    def perform_search():
        if not check_supabase_availability():
            messagebox.showerror('Error', 'Supabase not installed.\npip install supabase')
            return
        condition = search_var.get().strip() or None
        results = search_supabase_data(condition=condition, limit=100)
        if results is None:
            messagebox.showerror('Error', 'Search failed. Check connection and security/.env.')
            return
        search_results.clear()
        search_results.extend(results)
        refresh_db_viewer()
        logger.info('Search: %s record(s) for %s', len(results), condition or 'All')

    def export_data():
        if not check_supabase_availability():
            messagebox.showerror('Error', 'Supabase not installed.')
            return
        dialog = tk.Toplevel(root)
        dialog.title('Export data')
        dialog.geometry('400x160')
        dialog.configure(bg=T.surface)
        dialog.transient(root)
        dialog.grab_set()
        cv = tk.StringVar()
        tk.Label(dialog, text='Filter by condition (empty = all):', bg=T.surface, fg=T.text).pack(pady=8)
        ttk.Entry(dialog, textvariable=cv, width=34).pack(pady=4)

        def do_export():
            cond = cv.get().strip() or None
            def run():
                try:
                    path = export_supabase_data(condition=cond)
                    if path:
                        root.after(0, lambda: messagebox.showinfo('Export', f'Saved to:\n{path}'))
                    else:
                        root.after(0, lambda: messagebox.showerror('Export', 'Export failed'))
                except Exception as e:
                    root.after(0, lambda: messagebox.showerror('Export', str(e)))
                finally:
                    dialog.destroy()
            threading.Thread(target=run, daemon=True).start()

        IconButton(dialog, 'Export CSV', 'export', do_export, style='primary').pack(pady=10)
        IconButton(dialog, 'Cancel', 'clear', dialog.destroy, compact=True).pack()

    def wipe_database():
        if not check_supabase_availability():
            messagebox.showerror('Error', 'Supabase not installed.')
            return
        if not messagebox.askyesno('Confirm wipe', 'Delete ALL anonymized_data rows?\nThis cannot be undone.'):
            return
        try:
            client = init_supabase_client()
            if not client:
                messagebox.showerror('Error', 'Client not initialized')
                return
            deleted = 0
            service_ok = False
            if config.SUPABASE_SERVICE_KEY:
                try:
                    svc = get_supabase_service_client()
                    if svc:
                        resp = svc.table('anonymized_data').delete().neq('id', 0).execute()
                        deleted = len(resp.data) if getattr(resp, 'data', None) else 0
                        service_ok = True
                except Exception as e:
                    logger.warning('Service delete failed: %s', e)
            if not service_ok:
                all_records = client.table('anonymized_data').select('id').execute()
                if all_records and all_records.data:
                    for record in all_records.data:
                        try:
                            client.table('anonymized_data').delete().eq('id', record['id']).execute()
                            deleted += 1
                        except Exception as e:
                            logger.warning('Delete %s: %s', record.get('id'), e)
            seq_reset = try_restart_anonymized_data_id_sequence()
            note = '\nID sequence reset.' if seq_reset else '\nSequence reset may need SQL Editor.'
            messagebox.showinfo('Wipe', f'Deleted {deleted} record(s).{note}')
            search_results.clear()
            refresh_db_viewer()
            perform_search()
        except Exception as e:
            messagebox.showerror('Error', str(e)[:120])

    def generate_sample_data():
        if not check_supabase_availability():
            messagebox.showerror('Error', 'Supabase not installed.')
            return
        dialog = tk.Toplevel(root)
        dialog.title('Generate sample data')
        dialog.geometry('480x300')
        dialog.configure(bg=T.surface)
        dialog.transient(root)
        dialog.grab_set()
        days_var = tk.StringVar(value='90')
        condition_var = tk.StringVar(value='Medical Condition')
        weight_var = tk.StringVar(value='75.0')
        for lbl, var in [('Days (1–3650)', days_var), ('Condition', condition_var), ('Base weight (kg)', weight_var)]:
            row = tk.Frame(dialog, bg=T.surface)
            row.pack(fill=tk.X, padx=20, pady=6)
            tk.Label(row, text=lbl, bg=T.surface, fg=T.muted, width=18, anchor='w').pack(side=tk.LEFT)
            ttk.Entry(row, textvariable=var, width=28).pack(side=tk.LEFT, padx=8)
        prog = tk.Label(dialog, text='', bg=T.surface, fg=T.accent)
        prog.pack(pady=8)

        def do_generate():
            try:
                n = int(days_var.get())
                cond = condition_var.get().strip()
                w = float(weight_var.get())
                if not (1 <= n <= 3650) or not cond:
                    raise ValueError('Invalid input')
            except ValueError:
                messagebox.showerror('Error', 'Check days, condition, and weight.')
                return

            def run():
                try:
                    root.after(0, lambda: prog.config(text='Posting…'))
                    count = generate_and_post_sample_data_to_supabase(n, cond, w)
                    root.after(0, lambda: prog.config(text=f'Posted {count} records'))
                    root.after(0, perform_search)
                    root.after(0, refresh_db_viewer)
                    root.after(1200, dialog.destroy)
                except Exception as e:
                    root.after(0, lambda: prog.config(text=f'Error: {e}'))
            threading.Thread(target=run, daemon=True).start()

        bf = tk.Frame(dialog, bg=T.surface)
        bf.pack(fill=tk.X, padx=20, pady=12)
        IconButton(bf, 'Generate & post', 'flask', do_generate, style='primary').pack(side=tk.LEFT, padx=(0, 8))
        IconButton(bf, 'Cancel', 'clear', dialog.destroy, compact=True).pack(side=tk.LEFT)

    def generate_csv_sample():
        dialog = tk.Toplevel(root)
        dialog.title('Generate CSV')
        dialog.geometry('360x200')
        dialog.configure(bg=T.surface)
        dialog.transient(root)
        dialog.grab_set()
        days_var = tk.StringVar(value='90')
        weight_var = tk.StringVar(value='75.0')
        for lbl, var in [('Days', days_var), ('Base weight (kg)', weight_var)]:
            row = tk.Frame(dialog, bg=T.surface)
            row.pack(fill=tk.X, padx=20, pady=6)
            tk.Label(row, text=lbl, bg=T.surface, fg=T.muted, width=14, anchor='w').pack(side=tk.LEFT)
            ttk.Entry(row, textvariable=var, width=20).pack(side=tk.LEFT)
        prog = tk.Label(dialog, text='', bg=T.surface, fg=T.accent)
        prog.pack(pady=6)

        def do_csv():
            try:
                n, w = int(days_var.get()), float(weight_var.get())
            except ValueError:
                messagebox.showerror('Error', 'Enter valid numbers')
                return

            def run():
                try:
                    out = config.PROJECT_ROOT / f'health_data_sample_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
                    result = generate_sample_csv_data(n, w, out)
                    root.after(0, lambda: prog.config(text=f'Saved {Path(result).name}' if result else 'Failed'))
                    root.after(1500, dialog.destroy)
                except Exception as e:
                    root.after(0, lambda: prog.config(text=str(e)[:50]))
            threading.Thread(target=run, daemon=True).start()

        IconButton(dialog, 'Generate CSV', 'file', do_csv, style='primary').pack(pady=8)

    # Wire database toolbar buttons
    IconButton(conn_row, 'Refresh', 'refresh', check_connection, compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(conn_row, 'Install deps', 'package', install_requirements_ui, compact=True).pack(side=tk.LEFT)
    IconButton(search_row, 'Search', 'search', perform_search, style='primary', compact=True).pack(side=tk.LEFT, padx=(8, 6))
    IconButton(search_row, 'Conditions', 'refresh', load_available_conditions, compact=True).pack(side=tk.LEFT)
    search_dropdown.bind('<Return>', lambda e: perform_search())

    IconButton(action_row, 'Export CSV', 'export', export_data, compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(action_row, 'Wipe DB', 'trash', wipe_database, style='danger', compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(action_row, 'Sample data', 'flask', generate_sample_data, compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(action_row, 'CSV file', 'file', generate_csv_sample, compact=True).pack(side=tk.LEFT)
    IconButton(viewer_toolbar, 'Refresh view', 'refresh', refresh_db_viewer, compact=True).pack(side=tk.LEFT)

    IconButton(supa_card.actions, 'Refresh', 'refresh', check_connection, compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(supa_card.actions, 'Open data', 'database', lambda: show_panel('database'), compact=True).pack(side=tk.LEFT)
    IconButton(watch_card.actions, 'Push reload', 'broadcast', on_push_reload, compact=True).pack(side=tk.LEFT)
    IconButton(qa_btns, 'Search database', 'search', lambda: (show_panel('database'), perform_search()), style='primary').pack(side=tk.LEFT, padx=(0, 8))
    IconButton(qa_btns, 'View logs', 'terminal', lambda: show_panel('logs')).pack(side=tk.LEFT, padx=(0, 8))
    IconButton(qa_btns, 'Dev tools', 'tools', lambda: show_panel('tools')).pack(side=tk.LEFT)
    IconButton(deps_btns, 'Install requirements', 'package', install_requirements_ui, compact=True).pack(side=tk.LEFT, padx=(0, 6))
    IconButton(deps_btns, 'Refresh connection', 'refresh', check_connection, compact=True).pack(side=tk.LEFT)

    def update_selection_count(_event=None):
        n = len(viewer_tree.selection())
        selection_count_label.config(text=f'{n} selected')

    viewer_tree.bind('<<TreeviewSelect>>', update_selection_count)

    def select_all_rows(_event=None):
        items = viewer_tree.get_children()
        if items:
            viewer_tree.selection_set(items)
            update_selection_count()
        return 'break'

    viewer_tree.bind('<Control-a>', select_all_rows)
    viewer_tree.bind('<Command-a>', select_all_rows)

    # ── Log handler ──────────────────────────────────────────────────────────
    LEVEL_RANK = {'DEBUG': 10, 'INFO': 20, 'WARNING': 30, 'WARN': 30, 'ERROR': 40, 'CRITICAL': 50}

    def _filter_allows(level: str) -> bool:
        f = log_filter_var.get()
        rank = LEVEL_RANK.get(str(level).upper(), 20)
        if f == 'All':
            return True
        if f == 'Info+':
            return rank >= 20
        if f == 'Warning+':
            return rank >= 30
        return rank >= 40

    class TextHandler(logging.Handler):
        def __init__(self, widget, win):
            super().__init__()
            self.widget = widget
            self.win = win

        def emit(self, record):
            if not _filter_allows(record.levelname):
                return
            msg = self.format(record)
            try:
                if self.win.winfo_exists():
                    self.win.after(0, self._append, msg, record.levelname)
            except Exception:
                pass

        def _append(self, msg, levelname):
            try:
                if not self.widget.winfo_exists():
                    return
                start = self.widget.index(tk.END)
                self.widget.insert(tk.END, msg + '\n')
                end = self.widget.index(tk.END + '-1c')
                tag = {
                    'DEBUG': 'LINE_DEBUG', 'INFO': 'LINE_INFO', 'WARNING': 'LINE_WARNING',
                    'WARN': 'LINE_WARNING', 'ERROR': 'LINE_ERROR', 'CRITICAL': 'LINE_CRITICAL',
                }.get(str(levelname).upper(), 'DEFAULT')
                self.widget.tag_add(tag, start, end)
                if log_autoscroll['on']:
                    self.widget.see(tk.END)
                lines = int(self.widget.index('end-1c').split('.')[0])
                if lines > 1200:
                    self.widget.delete('1.0', f'{lines - 1200}.0')
            except Exception:
                pass

    text_handler = TextHandler(logs_text, root)
    text_handler.setFormatter(log_formatter)
    text_handler.setLevel(logging.INFO)
    logger.addHandler(text_handler)

    def clear_logs():
        logs_text.delete('1.0', tk.END)

    def toggle_autoscroll():
        log_autoscroll['on'] = not log_autoscroll['on']

    logs_controls = tk.Frame(logs_head, bg=T.bg)
    logs_controls.pack(side=tk.RIGHT, padx=(0, 8))
    IconButton(logs_controls, 'Clear', 'clear', clear_logs, compact=True).pack(side=tk.RIGHT, padx=(6, 0))
    IconButton(logs_controls, 'Auto-scroll', 'chevron', toggle_autoscroll, compact=True).pack(side=tk.RIGHT)

    # ── Responsive layout ────────────────────────────────────────────────────
    NAV_SPEC = (
        ('overview', 'Home', 'home'),
        ('database', 'Data', 'database'),
        ('tools', 'Tools', 'tools'),
        ('logs', 'Logs', 'terminal'),
    )

    def relayout(_event=None):
        w = root.winfo_width()
        h = root.winfo_height()
        portrait = h > w * 0.95 or w < 820
        if portrait == portrait_mode['value'] and nav_items:
            return
        portrait_mode['value'] = portrait

        nav_rail.pack_forget()
        bottom_nav.pack_forget()
        for child in nav_rail.winfo_children():
            child.destroy()
        for child in bottom_nav.winfo_children():
            child.destroy()
        nav_items.clear()

        if portrait:
            nav_rail.pack_forget()
            bottom_nav.pack(side=tk.BOTTOM, fill=tk.X)
            bottom_nav.config(height=76)
            inner = tk.Frame(bottom_nav, bg=T.surface)
            inner.pack(fill=tk.BOTH, expand=True)
            for pid, label, icon in NAV_SPEC:
                build_nav_item(inner, label, icon, pid, horizontal=True).pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
            for i, c in enumerate((server_card, supa_card, watch_card, chrome_card)):
                c.pack_forget()
                c.pack(fill=tk.X, pady=(0, 8))
        else:
            bottom_nav.pack_forget()
            nav_rail.pack(side=tk.LEFT, fill=tk.Y, before=content_area)
            nav_rail.config(width=96)
            for pid, label, icon in NAV_SPEC:
                build_nav_item(nav_rail, label, icon, pid).pack(fill=tk.X)
            cards_row.pack_forget()
            cards_row.pack(fill=tk.X)
            for c in (server_card, supa_card, watch_card, chrome_card):
                c.pack_forget()
            server_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
            supa_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
            watch_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=(0, 8))
            chrome_card.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        show_panel(active_panel['id'])

    root.bind('<Configure>', relayout)

    # ── Startup ──────────────────────────────────────────────────────────────
    refresh_watchdog_label()
    check_connection()
    load_available_conditions()
    refresh_db_viewer()
    show_panel('overview')
    root.after(100, relayout)

    # Pulse connected status
    def pulse_status(step=0):
        if connection_status.cget('fg') == T.ok:
            shades = [T.ok, '#5ec96a', T.ok]
            connection_status.config(fg=shades[step % len(shades)])
        root.after(1800, lambda: pulse_status(step + 1))

    root.after(2000, pulse_status)

    def on_closing():
        logger.info('Dashboard closed — shutting down server…')
        try:
            with cb.server_lock:
                inst = cb.get_server_instance()
                if inst:
                    inst.shutdown()
                    inst.server_close()
            root.destroy()
            os._exit(0)
        except Exception as e:
            logger.error('Shutdown: %s', e, exc_info=True)
            root.destroy()
            os._exit(0)

    root.protocol('WM_DELETE_WINDOW', on_closing)
    return root
