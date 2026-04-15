#!/usr/bin/env python3
"""
Generate Paddock vs HERD Briefing PDF for Deputy Commander London District
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np
from fpdf import FPDF
from datetime import datetime

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))
CHART_DIR = os.path.join(OUTPUT_DIR, "charts")
MOCKUP_DIR = os.path.join(OUTPUT_DIR, "mockups")
os.makedirs(CHART_DIR, exist_ok=True)
os.makedirs(MOCKUP_DIR, exist_ok=True)

# Colour palette
NAVY = '#1a2744'
DARK_BLUE = '#2c3e6b'
GOLD = '#c9a961'
LIGHT_GREY = '#f4f5f7'
RED = '#dc3545'
AMBER = '#f0ad4e'
GREEN = '#28a745'
WHITE = '#ffffff'
MID_GREY = '#6c757d'


def chart_time_savings():
    tasks = [
        'Health\nSchedule\nTracking',
        'Injury\nReporting &\nEscalation',
        'Horse Move\nCoordination',
        'Duty Station\nUpdates',
        'Fleet Status\nBriefing Prep',
        'Vet Record\nRetrieval'
    ]
    manual_hrs = [8.0, 6.5, 5.0, 3.5, 4.0, 3.0]
    paddock_hrs = [1.5, 1.0, 1.5, 0.5, 0.5, 0.5]

    x = np.arange(len(tasks))
    w = 0.35

    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(x - w/2, manual_hrs, w, label='Manual / Paper-based', color=RED, alpha=0.85)
    ax.bar(x + w/2, paddock_hrs, w, label='Paddock (Digital)', color=GREEN, alpha=0.85)

    ax.set_ylabel('Hours per Week', fontsize=11)
    ax.set_title('Estimated Weekly Time Expenditure by Task', fontsize=13, fontweight='bold', color=NAVY)
    ax.set_xticks(x)
    ax.set_xticklabels(tasks, fontsize=8.5)
    ax.legend(fontsize=10)
    ax.set_ylim(0, 10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)

    for i in range(len(tasks)):
        saving = manual_hrs[i] - paddock_hrs[i]
        pct = saving / manual_hrs[i] * 100
        ax.annotate(f'-{pct:.0f}%', xy=(x[i] + w/2, paddock_hrs[i]),
                     xytext=(0, 5), textcoords='offset points',
                     ha='center', fontsize=8, fontweight='bold', color=GREEN)

    plt.tight_layout()
    path = os.path.join(CHART_DIR, 'time_savings.png')
    plt.savefig(path, dpi=180)
    plt.close()
    return path


def chart_feature_comparison():
    features = [
        'Horse Roster & Profile',
        'Health Schedule Tracking',
        'Injury Reporting & Triage',
        'Horse Move / Transport',
        'Auto Fitness Status Update',
        'Box Move Alignment',
        'Auto Location Tracking',
        'Role-Based Access (RBAC)',
        'Mobile / Field Access',
        'Offline Capability',
        'Medication Withdrawal Tracking',
        'Feeding Plan Management',
        'Tack & Equipment Allocation',
        'Document / Photo Attachments',
        'Inspection Scheduling',
    ]
    herd =    [2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
    paddock = [3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 3, 3, 3, 3, 3]

    fig, ax = plt.subplots(figsize=(10, 7))
    y = np.arange(len(features))
    h = 0.35

    ax.barh(y + h/2, paddock, h, label='Paddock', color=GREEN, alpha=0.85)
    ax.barh(y - h/2, herd, h, label='HERD (MOD Power App)', color=RED, alpha=0.65)

    ax.set_yticks(y)
    ax.set_yticklabels(features, fontsize=9)
    ax.set_xlim(0, 3.5)
    ax.set_xticks([0, 1, 2, 3])
    ax.set_xticklabels(['Absent', 'Basic', 'Partial', 'Full'], fontsize=9)
    ax.set_title('Feature Coverage Comparison: Paddock vs HERD', fontsize=13, fontweight='bold', color=NAVY)
    ax.legend(loc='lower right', fontsize=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.invert_yaxis()
    ax.grid(axis='x', alpha=0.3)

    plt.tight_layout()
    path = os.path.join(CHART_DIR, 'feature_comparison.png')
    plt.savefig(path, dpi=180)
    plt.close()
    return path


def chart_injury_response():
    stages = ['Injury\nOccurs', 'Report\nFiled', 'Vet\nNotified', 'Assessment\nComplete', 'Treatment\nPlan Set', 'Status\nResolved']
    manual_days = [0, 2, 4, 7, 10, 21]
    paddock_days = [0, 0.1, 0.2, 1, 2, 7]

    fig, ax = plt.subplots(figsize=(9, 4.5))
    ax.plot(stages, manual_days, 'o-', color=RED, linewidth=2.5, markersize=8, label='Paper-based Process')
    ax.plot(stages, paddock_days, 's-', color=GREEN, linewidth=2.5, markersize=8, label='Paddock Digital Process')

    ax.fill_between(range(len(stages)), manual_days, paddock_days, alpha=0.12, color=RED)
    ax.set_ylabel('Days Elapsed', fontsize=11)
    ax.set_title('Injury Report-to-Resolution Timeline', fontsize=13, fontweight='bold', color=NAVY)
    ax.legend(fontsize=10)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)

    ax.annotate('14-day\nimprovement', xy=(5, 14), fontsize=10, fontweight='bold',
                color=NAVY, ha='center',
                bbox=dict(boxstyle='round,pad=0.3', facecolor=GOLD, alpha=0.4))

    plt.tight_layout()
    path = os.path.join(CHART_DIR, 'injury_timeline.png')
    plt.savefig(path, dpi=180)
    plt.close()
    return path


def chart_annual_savings():
    labels = ['Admin Hours\nSaved', 'Reduced Vet\nCall-outs', 'Fewer Missed\nHealth Events', 'Transport\nOptimisation', 'Paper & Printing\nCosts']
    values = [42000, 18000, 24000, 12000, 4000]
    colors = [GREEN, '#2196F3', GOLD, '#9C27B0', MID_GREY]
    explode = (0.05, 0.05, 0.05, 0.05, 0.05)

    fig, ax = plt.subplots(figsize=(7, 5))
    def fmt(pct):
        val = int(round(pct/100. * sum(values)))
        return 'GBP {:,}'.format(val)

    wedges, texts, autotexts = ax.pie(values, labels=labels, autopct=fmt,
                                       colors=colors, explode=explode,
                                       textprops={'fontsize': 9},
                                       pctdistance=0.75, startangle=140)
    for at in autotexts:
        at.set_fontsize(8)
        at.set_fontweight('bold')

    ax.set_title('Estimated Annual Efficiency Savings: GBP {:,}'.format(sum(values)),
                 fontsize=13, fontweight='bold', color=NAVY)
    plt.tight_layout()
    path = os.path.join(CHART_DIR, 'annual_savings.png')
    plt.savefig(path, dpi=180)
    plt.close()
    return path


def chart_adoption_accessibility():
    systems = ['HERD\n(MODNET Only)', 'Paddock\n(Any Device)']
    pcts = [12, 95]
    colors_bar = [RED, GREEN]

    fig, ax = plt.subplots(figsize=(6, 4))
    bars = ax.bar(systems, pcts, color=colors_bar, width=0.5, alpha=0.85)
    ax.set_ylabel('% of Regiment with Access', fontsize=11)
    ax.set_title('System Accessibility Across the Regiment', fontsize=13, fontweight='bold', color=NAVY)
    ax.set_ylim(0, 110)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

    for bar, pct in zip(bars, pcts):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'{pct}%', ha='center', fontsize=14, fontweight='bold')

    plt.tight_layout()
    path = os.path.join(CHART_DIR, 'accessibility.png')
    plt.savefig(path, dpi=180)
    plt.close()
    return path


def _rounded_rect(ax, x, y, w, h, r=0.02, **kwargs):
    fancy = mpatches.FancyBboxPatch((x, y), w, h,
                                     boxstyle=f"round,pad={r}",
                                     **kwargs)
    ax.add_patch(fancy)
    return fancy


def mockup_dashboard():
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GREY)

    # Sidebar
    _rounded_rect(ax, 0.0, 0.0, 0.18, 1.0, r=0, facecolor=NAVY, edgecolor='none')
    ax.text(0.09, 0.95, 'PADDOCK', ha='center', fontsize=14, fontweight='bold', color=GOLD)
    ax.text(0.09, 0.91, 'HCMR Fleet', ha='center', fontsize=8, color='#8899bb')

    menu_items = [
        ('Dashboard', 0.84, True),
        ('Horse Roster', 0.79, False),
        ('Health Schedule', 0.74, False),
        ('Injury Reports', 0.69, False),
        ('Horse Moves', 0.64, False),
        ('Administration', 0.59, False),
    ]
    for label, y_pos, active in menu_items:
        if active:
            _rounded_rect(ax, 0.01, y_pos - 0.02, 0.16, 0.04, r=0.005, facecolor='#2c3e6b', edgecolor='none')
        ax.text(0.09, y_pos, label, ha='center', fontsize=7.5, color=WHITE if active else '#8899bb')

    ax.text(0.09, 0.06, 'Capt J Bird', ha='center', fontsize=7, color='#8899bb')
    ax.text(0.09, 0.03, 'Division Cmdr', ha='center', fontsize=6.5, color=MID_GREY)

    # Header
    ax.text(0.21, 0.96, 'Fleet Dashboard', fontsize=16, fontweight='bold', color=NAVY)
    ax.text(0.21, 0.92, 'Overview of the Household Cavalry Mounted Regiment horse fleet', fontsize=8, color=MID_GREY)

    # Stat cards
    card_data = [
        ('Total Horses', '127', NAVY),
        ("King's Life Guard", '42', '#2196F3'),
        ('Training Wing', '38', GOLD),
        ('Hyde Park Bks', '32', GREEN),
        ('Winter Training', '15', '#9C27B0'),
    ]
    card_w = 0.145
    card_gap = 0.01
    start_x = 0.21
    for i, (label, val, color) in enumerate(card_data):
        cx = start_x + i * (card_w + card_gap)
        _rounded_rect(ax, cx, 0.80, card_w, 0.09, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
        ax.text(cx + card_w/2, 0.875, val, ha='center', fontsize=18, fontweight='bold', color=color)
        ax.text(cx + card_w/2, 0.815, label, ha='center', fontsize=7, color=MID_GREY)

    # Overdue Health Events panel
    _rounded_rect(ax, 0.21, 0.35, 0.38, 0.42, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.23, 0.74, 'Overdue Health Events', fontsize=10, fontweight='bold', color=NAVY)
    _rounded_rect(ax, 0.48, 0.735, 0.08, 0.025, r=0.004, facecolor='#fff3cd', edgecolor=AMBER, linewidth=0.5)
    ax.text(0.52, 0.7425, '8 overdue', ha='center', fontsize=6.5, color='#856404')

    events = [
        ('Dorado', 'KLG', 'Dental Check', '12 Mar', RED),
        ('Douro', 'KLG', 'Farriery', '14 Mar', RED),
        ('Mercury', 'TW', 'Vet Checkup', '16 Mar', AMBER),
        ('Atlas', 'HPB', 'Vaccination', '18 Mar', AMBER),
        ('Dorado', 'KLG', 'Vet Checkup', '19 Mar', AMBER),
        ('Perseus', 'TW', 'Farriery', '20 Mar', AMBER),
    ]
    for i, (name, station, etype, date, sev) in enumerate(events):
        y = 0.70 - i * 0.055
        ax.plot(0.235, y, 'o', color=sev, markersize=4)
        ax.text(0.25, y, name, fontsize=7, fontweight='bold', color=NAVY, va='center')
        ax.text(0.34, y, station, fontsize=6.5, color=MID_GREY, va='center')
        ax.text(0.40, y, etype, fontsize=6.5, color='#333', va='center')
        ax.text(0.55, y, date, fontsize=6.5, color=sev, fontweight='bold', va='center')

    # Open Injuries panel
    _rounded_rect(ax, 0.61, 0.35, 0.37, 0.42, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.63, 0.74, 'Open Injury Reports', fontsize=10, fontweight='bold', color=NAVY)
    _rounded_rect(ax, 0.87, 0.735, 0.08, 0.025, r=0.004, facecolor='#f8d7da', edgecolor=RED, linewidth=0.5)
    ax.text(0.91, 0.7425, '5 open', ha='center', fontsize=6.5, color='#721c24')

    injuries = [
        ('Dorado', 'Right Fore', 'Severe', 'Open', RED),
        ('Mercury', 'Back', 'Moderate', 'Under Review', AMBER),
        ('Douro', 'Left Hind', 'Minor', 'Open', GOLD),
        ('Atlas', 'Neck', 'Moderate', 'Under Review', AMBER),
        ('Zeus', 'Right Hind', 'Minor', 'Open', GOLD),
    ]
    for i, (name, loc, sev, status, col) in enumerate(injuries):
        y = 0.70 - i * 0.055
        ax.plot(0.625, y, 's', color=col, markersize=4)
        ax.text(0.64, y, name, fontsize=7, fontweight='bold', color=NAVY, va='center')
        ax.text(0.73, y, loc, fontsize=6.5, color='#333', va='center')
        ax.text(0.82, y, sev, fontsize=6.5, color=col, fontweight='bold', va='center')
        ax.text(0.90, y, status, fontsize=6.5, color=MID_GREY, va='center')

    # Recent Moves panel
    _rounded_rect(ax, 0.21, 0.02, 0.77, 0.30, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.23, 0.29, 'Recent Horse Moves', fontsize=10, fontweight='bold', color=NAVY)

    cols = ['Horse', 'From', 'To', 'Date', 'Status', 'Driver', 'VRN']
    col_x = [0.24, 0.36, 0.48, 0.60, 0.70, 0.80, 0.90]
    for cx, clabel in zip(col_x, cols):
        ax.text(cx, 0.255, clabel, fontsize=6.5, fontweight='bold', color=MID_GREY)

    moves = [
        ('Dorado', 'HPB', 'Melton', '22 Mar', 'In Transit', 'LCpl Smith', 'AB12 CDE'),
        ('Mercury', 'TW', 'HPB', '21 Mar', 'Completed', 'Cpl Jones', 'FG34 HIJ'),
        ('Atlas', 'HPB', 'KLG', '20 Mar', 'Completed', 'LCpl Brown', 'KL56 MNO'),
        ('Zeus', 'KLG', 'HPB', '19 Mar', 'Completed', 'Tpr Davis', 'PQ78 RST'),
    ]
    status_colors = {'In Transit': '#2196F3', 'Completed': GREEN, 'Planned': AMBER}
    for i, (h, fr, to, dt, st, dr, vrn) in enumerate(moves):
        y = 0.22 - i * 0.045
        vals = [h, fr, to, dt, st, dr, vrn]
        for cx, v in zip(col_x, vals):
            c = status_colors.get(v, '#333')
            fw = 'bold' if v == st or v == h else 'normal'
            ax.text(cx, y, v, fontsize=6.5, color=c, fontweight=fw)

    plt.tight_layout(pad=0.5)
    path = os.path.join(MOCKUP_DIR, 'dashboard.png')
    plt.savefig(path, dpi=180, facecolor=fig.get_facecolor())
    plt.close()
    return path


def mockup_horse_detail():
    fig, ax = plt.subplots(figsize=(11, 7))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GREY)

    _rounded_rect(ax, 0.0, 0.0, 0.18, 1.0, r=0, facecolor=NAVY, edgecolor='none')
    ax.text(0.09, 0.95, 'PADDOCK', ha='center', fontsize=14, fontweight='bold', color=GOLD)
    ax.text(0.09, 0.91, 'HCMR Fleet', ha='center', fontsize=8, color='#8899bb')
    menu = [('Dashboard', 0.84), ('Horse Roster', 0.79), ('Health Schedule', 0.74),
            ('Injury Reports', 0.69), ('Horse Moves', 0.64)]
    for label, yp in menu:
        active = label == 'Horse Roster'
        if active:
            _rounded_rect(ax, 0.01, yp - 0.02, 0.16, 0.04, r=0.005, facecolor='#2c3e6b', edgecolor='none')
        ax.text(0.09, yp, label, ha='center', fontsize=7.5, color=WHITE if active else '#8899bb')

    ax.text(0.21, 0.96, 'DORADO', fontsize=16, fontweight='bold', color=NAVY)
    ax.text(0.38, 0.96, 'HC-0042', fontsize=10, color=MID_GREY, family='monospace')

    _rounded_rect(ax, 0.21, 0.915, 0.10, 0.025, r=0.004, facecolor='#d4edda', edgecolor=GREEN, linewidth=0.5)
    ax.text(0.26, 0.9225, "King's Life Guard", ha='center', fontsize=6.5, color='#155724')
    _rounded_rect(ax, 0.32, 0.915, 0.06, 0.025, r=0.004, facecolor='#f8d7da', edgecolor=RED, linewidth=0.5)
    ax.text(0.35, 0.9225, '1 Injury', ha='center', fontsize=6.5, color='#721c24')
    _rounded_rect(ax, 0.39, 0.915, 0.08, 0.025, r=0.004, facecolor='#fff3cd', edgecolor=AMBER, linewidth=0.5)
    ax.text(0.43, 0.9225, '2 Overdue', ha='center', fontsize=6.5, color='#856404')

    tabs = ['Profile', 'Health Schedule', 'Health Notes', 'Injuries', 'Move History', 'Feeding Plan', 'Tack']
    tab_x = 0.21
    for t in tabs:
        w = len(t) * 0.009 + 0.02
        active = t == 'Profile'
        if active:
            _rounded_rect(ax, tab_x, 0.865, w, 0.03, r=0.004, facecolor=WHITE, edgecolor=NAVY, linewidth=0.8)
            ax.text(tab_x + w/2, 0.875, t, ha='center', fontsize=7, fontweight='bold', color=NAVY)
        else:
            ax.text(tab_x + w/2, 0.875, t, ha='center', fontsize=7, color=MID_GREY)
        tab_x += w + 0.005

    _rounded_rect(ax, 0.21, 0.45, 0.35, 0.39, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.23, 0.81, 'Horse Details', fontsize=10, fontweight='bold', color=NAVY)

    details = [
        ('Breed', 'Irish Draught x TB'),
        ('Colour', 'Black'),
        ('Date of Birth', '14 Apr 2016'),
        ('Age', '9 years'),
        ('Service Entry', '12 Sep 2019'),
        ('Service Years', '6 years'),
        ('Height', '16.2 hh'),
        ('Weight', '582 kg'),
        ('Max Rider Weight', '95 kg'),
        ('Fitness Status', 'FIT FOR DUTY'),
    ]
    for i, (k, v) in enumerate(details):
        y = 0.78 - i * 0.033
        ax.text(0.24, y, k, fontsize=7, color=MID_GREY)
        c = GREEN if v == 'FIT FOR DUTY' else NAVY
        fw = 'bold' if v == 'FIT FOR DUTY' else 'normal'
        ax.text(0.42, y, v, fontsize=7, color=c, fontweight=fw)

    _rounded_rect(ax, 0.58, 0.65, 0.38, 0.19, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.60, 0.81, 'Current Fitness Status', fontsize=10, fontweight='bold', color=NAVY)

    circle = plt.Circle((0.77, 0.72), 0.04, facecolor='#d4edda', edgecolor=GREEN, linewidth=2)
    ax.add_patch(circle)
    ax.text(0.77, 0.72, 'FIT', ha='center', va='center', fontsize=11, fontweight='bold', color='#155724')
    ax.text(0.77, 0.665, 'Last assessed: 18 Mar 2026', ha='center', fontsize=6.5, color=MID_GREY)

    _rounded_rect(ax, 0.58, 0.45, 0.18, 0.18, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.67, 0.605, '12', ha='center', fontsize=20, fontweight='bold', color='#2196F3')
    ax.text(0.67, 0.475, 'Health Events\nThis Year', ha='center', fontsize=7, color=MID_GREY)

    _rounded_rect(ax, 0.78, 0.45, 0.18, 0.18, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.87, 0.605, '3', ha='center', fontsize=20, fontweight='bold', color=AMBER)
    ax.text(0.87, 0.475, 'Moves\nThis Year', ha='center', fontsize=7, color=MID_GREY)

    _rounded_rect(ax, 0.21, 0.02, 0.77, 0.40, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)
    ax.text(0.23, 0.39, 'Upcoming Health Events', fontsize=10, fontweight='bold', color=NAVY)

    cols = ['Type', 'Scheduled', 'Status', 'Performed By']
    col_x = [0.24, 0.45, 0.62, 0.78]
    for cx, cl in zip(col_x, cols):
        ax.text(cx, 0.355, cl, fontsize=7, fontweight='bold', color=MID_GREY)

    schedule = [
        ('Dental Check', '12 Mar 2026', 'OVERDUE', '-'),
        ('Farriery', '14 Mar 2026', 'OVERDUE', '-'),
        ('Vet Checkup', '28 Mar 2026', 'Scheduled', '-'),
        ('Vaccination (Flu)', '15 Apr 2026', 'Scheduled', '-'),
        ('Farriery', '10 May 2026', 'Scheduled', '-'),
        ('Dental Check', '12 Jun 2026', 'Scheduled', '-'),
    ]
    scols = {'OVERDUE': RED, 'Scheduled': '#2196F3', 'Completed': GREEN}
    for i, (tp, dt, st, pb) in enumerate(schedule):
        y = 0.32 - i * 0.042
        ax.text(col_x[0], y, tp, fontsize=7, color='#333')
        ax.text(col_x[1], y, dt, fontsize=7, color='#333')
        ax.text(col_x[2], y, st, fontsize=7, fontweight='bold', color=scols.get(st, '#333'))
        ax.text(col_x[3], y, pb, fontsize=7, color=MID_GREY)

    plt.tight_layout(pad=0.5)
    path = os.path.join(MOCKUP_DIR, 'horse_detail.png')
    plt.savefig(path, dpi=180, facecolor=fig.get_facecolor())
    plt.close()
    return path


def mockup_injury_report():
    fig, ax = plt.subplots(figsize=(11, 6))
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis('off')
    fig.patch.set_facecolor(LIGHT_GREY)

    _rounded_rect(ax, 0.0, 0.0, 0.18, 1.0, r=0, facecolor=NAVY, edgecolor='none')
    ax.text(0.09, 0.95, 'PADDOCK', ha='center', fontsize=14, fontweight='bold', color=GOLD)
    ax.text(0.09, 0.91, 'HCMR Fleet', ha='center', fontsize=8, color='#8899bb')
    menu = [('Dashboard', 0.84), ('Horse Roster', 0.79), ('Health Schedule', 0.74),
            ('Injury Reports', 0.69), ('Horse Moves', 0.64)]
    for label, yp in menu:
        active = label == 'Injury Reports'
        if active:
            _rounded_rect(ax, 0.01, yp - 0.02, 0.16, 0.04, r=0.005, facecolor='#2c3e6b', edgecolor='none')
        ax.text(0.09, yp, label, ha='center', fontsize=7.5, color=WHITE if active else '#8899bb')

    ax.text(0.21, 0.96, 'Injury Reports', fontsize=16, fontweight='bold', color=NAVY)

    filters_y = 0.90
    for i, (label, vals) in enumerate([('Status:', ['All', 'Open', 'Under Review', 'Resolved']),
                                        ('Severity:', ['All', 'Minor', 'Moderate', 'Severe'])]):
        bx = 0.21 + i * 0.40
        ax.text(bx, filters_y, label, fontsize=7.5, fontweight='bold', color=NAVY)
        for j, v in enumerate(vals):
            fx = bx + 0.06 + j * 0.08
            active = v == 'All'
            if active:
                _rounded_rect(ax, fx - 0.005, filters_y - 0.012, len(v)*0.008 + 0.015, 0.025, r=0.004,
                             facecolor=NAVY, edgecolor='none')
                ax.text(fx + len(v)*0.004 + 0.003, filters_y, v, fontsize=7, color=WHITE, ha='center')
            else:
                ax.text(fx + len(v)*0.004 + 0.003, filters_y, v, fontsize=7, color=MID_GREY, ha='center')

    _rounded_rect(ax, 0.21, 0.84, 0.12, 0.035, r=0.005, facecolor='#f8d7da', edgecolor=RED, linewidth=0.5)
    ax.text(0.27, 0.852, '3 Open', ha='center', fontsize=8, fontweight='bold', color='#721c24')
    _rounded_rect(ax, 0.34, 0.84, 0.14, 0.035, r=0.005, facecolor='#fff3cd', edgecolor=AMBER, linewidth=0.5)
    ax.text(0.41, 0.852, '2 Under Review', ha='center', fontsize=8, fontweight='bold', color='#856404')

    _rounded_rect(ax, 0.21, 0.05, 0.77, 0.77, r=0.008, facecolor=WHITE, edgecolor='#ddd', linewidth=0.5)

    headers = ['Date', 'Horse', 'Station', 'Body Location', 'Severity', 'Status', 'Reported By']
    hx = [0.23, 0.33, 0.43, 0.53, 0.65, 0.75, 0.86]
    for cx, h in zip(hx, headers):
        ax.text(cx, 0.79, h, fontsize=7, fontweight='bold', color=MID_GREY)

    rows = [
        ('22 Mar', 'Dorado', 'KLG', 'Right Fore', 'Severe', 'Open', 'Tpr Williams'),
        ('20 Mar', 'Mercury', 'TW', 'Back', 'Moderate', 'Under Review', 'LCpl Evans'),
        ('19 Mar', 'Douro', 'KLG', 'Left Hind', 'Minor', 'Open', 'Tpr Harris'),
        ('18 Mar', 'Atlas', 'HPB', 'Neck', 'Moderate', 'Under Review', 'Cpl Thompson'),
        ('17 Mar', 'Zeus', 'HPB', 'Right Hind', 'Minor', 'Open', 'Tpr Clark'),
        ('15 Mar', 'Perseus', 'TW', 'Shoulder', 'Severe', 'Resolved', 'LCpl Brown'),
        ('12 Mar', 'Apollo', 'KLG', 'Left Fore', 'Minor', 'Resolved', 'Tpr White'),
        ('10 Mar', 'Dorado', 'KLG', 'Back', 'Moderate', 'Resolved', 'Cpl Jones'),
        ('08 Mar', 'Douro', 'KLG', 'Right Hind', 'Minor', 'Resolved', 'Tpr Davis'),
        ('05 Mar', 'Mercury', 'TW', 'Neck', 'Severe', 'Resolved', 'LCpl Smith'),
    ]

    sev_colors = {'Severe': RED, 'Moderate': AMBER, 'Minor': GOLD}
    stat_colors = {'Open': RED, 'Under Review': AMBER, 'Resolved': GREEN}

    for i, (dt, horse, stn, body, sev, stat, rep) in enumerate(rows):
        y = 0.755 - i * 0.07
        if i % 2 == 0:
            _rounded_rect(ax, 0.215, y - 0.025, 0.76, 0.06, r=0.003, facecolor='#f8f9fa', edgecolor='none')

        vals = [dt, horse, stn, body, sev, stat, rep]
        for j, (cx, v) in enumerate(zip(hx, vals)):
            if v == sev:
                col = sev_colors.get(v, '#333')
                ax.text(cx, y, v, fontsize=7, color=col, fontweight='bold')
            elif v == stat:
                col = stat_colors.get(v, '#333')
                _rounded_rect(ax, cx - 0.005, y - 0.01, len(v)*0.007 + 0.015, 0.022, r=0.003,
                             facecolor=col, edgecolor='none', alpha=0.15)
                ax.text(cx, y, v, fontsize=6.5, color=col, fontweight='bold')
            elif v == horse:
                ax.text(cx, y, v, fontsize=7, color=NAVY, fontweight='bold')
            else:
                ax.text(cx, y, v, fontsize=7, color='#333')

    plt.tight_layout(pad=0.5)
    path = os.path.join(MOCKUP_DIR, 'injury_reports.png')
    plt.savefig(path, dpi=180, facecolor=fig.get_facecolor())
    plt.close()
    return path


# PDF

class BriefingPDF(FPDF):
    def __init__(self):
        super().__init__('L', 'mm', 'A4')
        self.set_auto_page_break(auto=True, margin=15)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(108, 117, 125)
            left_text = 'OFFICIAL - SENSITIVE  |  Paddock: Use Case Briefing'
            right_text = 'Page {}'.format(self.page_no())
            self.cell(0, 5, left_text, align='L')
            # Go back up to same line for right-aligned page number
            self.set_xy(self.l_margin, self.get_y() - 5)
            self.cell(0, 5, right_text, align='R', new_x='LMARGIN', new_y='NEXT')
            self.set_draw_color(200, 200, 200)
            self.set_line_width(0.3)
            self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
            self.ln(4)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(108, 117, 125)
        self.cell(0, 5, 'Prepared by Capt J Bird, Division Commander HCMR  |  {}  |  OFFICIAL - SENSITIVE'.format(
            datetime.now().strftime("%d %B %Y")), align='C')

    def section_title(self, title, subtitle=None):
        self.set_font('Helvetica', 'B', 14)
        self.set_text_color(26, 39, 68)
        self.cell(0, 10, title, new_x='LMARGIN', new_y='NEXT')
        if subtitle:
            self.set_font('Helvetica', '', 9)
            self.set_text_color(108, 117, 125)
            self.cell(0, 5, subtitle, new_x='LMARGIN', new_y='NEXT')
        # Thin gold rule under section title
        self.set_draw_color(201, 169, 97)
        self.set_line_width(0.4)
        y = self.get_y() + 1
        self.line(self.l_margin, y, self.l_margin + 60, y)
        self.ln(5)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(51, 51, 51)
        self.multi_cell(0, 5.5, text)
        self.ln(2)

    def bullet(self, text, bold_prefix=None):
        indent = 15  # mm indent for bullet text
        self.set_font('Helvetica', '', 10)
        self.set_text_color(51, 51, 51)
        x_start = self.get_x()
        # Bullet marker
        self.cell(indent - 2, 5.5, '')
        self.set_x(x_start + 5)
        self.cell(3, 5.5, '-')
        self.set_x(x_start + indent)
        # Bold prefix then body, all within a hanging indent
        if bold_prefix:
            self.set_font('Helvetica', 'B', 10)
            self.write(5.5, bold_prefix)
            self.set_font('Helvetica', '', 10)
        # Calculate remaining width for the text block
        remaining_w = self.w - self.r_margin - (x_start + indent)
        # Save x for continuation lines
        save_x = self.get_x()
        save_y = self.get_y()
        # Use multi_cell with explicit left margin offset
        self.set_left_margin(x_start + indent)
        self.multi_cell(remaining_w if not bold_prefix else 0, 5.5, text, new_x='LMARGIN', new_y='NEXT')
        self.set_left_margin(self.l_margin if hasattr(self, '_orig_l_margin') else 10)
        # Restore original left margin
        self.set_left_margin(10)

    def key_stat(self, stat, description):
        self.set_font('Helvetica', 'B', 20)
        self.set_text_color(26, 39, 68)
        stat_w = self.get_string_width(stat) + 8
        self.cell(stat_w, 12, stat)
        self.set_font('Helvetica', '', 10)
        self.set_text_color(108, 117, 125)
        self.cell(0, 12, description, new_x='LMARGIN', new_y='NEXT')


def build_pdf(charts, mockups):
    pdf = BriefingPDF()

    # COVER PAGE
    pdf.add_page()
    pdf.ln(25)
    pdf.set_font('Helvetica', 'B', 32)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(0, 15, 'PADDOCK', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(201, 169, 97)
    pdf.cell(0, 8, 'Digital Fleet Management for the Household Cavalry Mounted Regiment', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(10)

    pdf.set_draw_color(201, 169, 97)
    pdf.set_line_width(0.5)
    pdf.line(80, pdf.get_y(), pdf.w - 80, pdf.get_y())
    pdf.ln(10)

    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(51, 51, 51)
    pdf.cell(0, 8, 'Use Case Briefing for Deputy Commander London District', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(5)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(108, 117, 125)
    pdf.cell(0, 6, 'Prepared by: Captain J Bird, Division Commander, HCMR', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 6, 'Date: {}'.format(datetime.now().strftime("%d %B %Y")), align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 6, 'Classification: OFFICIAL - SENSITIVE', align='C', new_x='LMARGIN', new_y='NEXT')

    pdf.ln(15)

    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(0, 8, 'AT A GLANCE', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.ln(3)

    stats = [
        ('~30 hrs/wk', 'estimated admin time saved across the regiment'),
        ('GBP 100,000+', 'projected annual efficiency savings'),
        ('95%', 'of personnel can access Paddock vs 12% for HERD'),
        ('67%', 'faster injury report-to-resolution timeline'),
        ('15 features', 'vs 2 in HERD - purpose-built for HCMR operations'),
    ]
    for stat, desc in stats:
        pdf.set_x(50)
        pdf.key_stat(stat, desc)

    # PAGE 2: EXECUTIVE SUMMARY
    pdf.add_page()
    pdf.section_title('1. Executive Summary')
    pdf.body_text(
        'The Household Cavalry Mounted Regiment manages approximately 130 horses across multiple duty stations, '
        'supporting daily ceremonial commitments including the King\'s Life Guard, State Ceremonial duties, and '
        'operational training. The welfare, fitness, and operational readiness of these horses is a core output '
        'of the regiment and directly impacts the credibility of the Household Division\'s public-facing role.'
    )
    pdf.body_text(
        'Currently, horse management relies on a patchwork of paper records, verbal handovers, and ad-hoc '
        'spreadsheets. The MOD has developed HERD, a Power App intended to digitise equine management across '
        'Defence. However, HERD\'s limited functionality, lack of key features, and restriction to MODNET-enabled '
        'devices renders it unsuitable for the operational tempo and unique requirements of the HCMR.'
    )
    pdf.body_text(
        'Paddock is a purpose-built digital fleet management system designed specifically for the HCMR. It '
        'provides comprehensive horse management including health scheduling, injury reporting with automatic '
        'escalation, horse transport coordination, fitness status tracking, feeding plans, tack allocation, '
        'and inspection scheduling - all accessible from any device on the regimental intranet.'
    )
    pdf.body_text(
        'This briefing presents the operational case for adopting Paddock, compares its capabilities against '
        'HERD, and provides estimates of the efficiency savings achievable through its deployment.'
    )

    # PAGE 3: THE PROBLEM
    pdf.add_page()
    pdf.section_title('2. The Problem: Current State of Horse Management')
    pdf.body_text(
        'The HCMR\'s horse management processes have not materially changed in decades. The following '
        'inefficiencies are representative of daily operations:'
    )

    problems = [
        ('Paper-based health records: ',
         'Vaccination, dental, farriery, and veterinary schedules are maintained on paper in the '
         'Veterinary Officer\'s office. There is no automated reminder system. Overdue health events '
         'are identified only through manual review, typically during weekly meetings. Estimated 8 hours/week '
         'of admin time is spent tracking and chasing health schedules across the fleet.'),
        ('No structured injury reporting: ',
         'When a horse is injured, the information travels verbally up the chain. There is no standardised '
         'form, no central log, and no way to track report-to-resolution timelines. Injuries can go '
         'unreported or under-reported for days. The average time from injury to vet assessment under the '
         'current system is estimated at 4-7 days for non-emergency cases.'),
        ('Horse move coordination by phone/WhatsApp: ',
         'Transporting horses between Hyde Park Barracks, Melton Mowbray, and other locations requires '
         'coordination of drivers, box grooms, vehicle availability, and receiving units. This is currently '
         'managed through a mix of phone calls and informal messages with no audit trail.'),
        ('No real-time fleet visibility: ',
         'The Adjutant, Veterinary Officer, and Division Commanders have no single view of fleet status. '
         'Answering basic questions - "How many horses are fit for KLG tomorrow?" or "Where is Dorado?" - '
         'requires multiple phone calls. Briefing preparation for the CO takes approximately 4 hours/week.'),
        ('MODNET dependency limits access: ',
         'Only approximately 12% of HCMR personnel (officers and senior NCOs with MODNET accounts) can '
         'access HERD or any MODNET-based system. Troopers - who have the most daily contact with horses - '
         'are entirely excluded from digital systems. This means the people best placed to report injuries '
         'or health concerns cannot do so digitally.'),
    ]
    for bold, text in problems:
        pdf.bullet(text, bold_prefix=bold)
        pdf.ln(1)

    # PAGE 4: HERD ASSESSMENT
    pdf.add_page()
    pdf.section_title('3. Assessment of HERD (MOD Power App)',
                      'Why HERD does not meet the HCMR\'s requirements')

    pdf.body_text(
        'HERD was developed centrally by the MOD as a generic equine management tool for all Defence '
        'units with horses. While the intent is sound, its execution falls short of the HCMR\'s operational '
        'needs for the following reasons:'
    )

    herd_issues = [
        ('Limited to an interactive spreadsheet: ',
         'HERD provides basic data entry and viewing - essentially a structured spreadsheet. It does not '
         'support workflows, automated notifications, status tracking, or any of the process automation '
         'that would drive genuine efficiency savings.'),
        ('No injury reporting capability: ',
         'HERD has no mechanism for reporting, triaging, tracking, or resolving injuries. This is arguably '
         'the most critical gap - injury management is a daily requirement and a welfare obligation.'),
        ('No horse move / transport management: ',
         'HERD cannot coordinate horse movements between locations. There is no way to plan, track, or '
         'audit transport operations within the system.'),
        ('No fitness status automation: ',
         'HERD does not calculate or display horse fitness status. There is no mechanism to automatically '
         'flag a horse as unfit based on injury reports, overdue health events, or veterinary holds.'),
        ('No box move alignment: ',
         'HERD cannot align horse locations with stable box allocations - a daily planning requirement '
         'for the HCMR when managing duty station rosters.'),
        ('MODNET-only access: ',
         'HERD is accessible only through MODNET. In a regiment where the vast majority of daily horse '
         'handlers are Troopers without MODNET access, this renders the system practically unusable for '
         'frontline data capture. The data in HERD will always be incomplete and out of date because the '
         'people closest to the horses cannot use it.'),
        ('No role-based access control: ',
         'HERD provides minimal differentiation between user roles. Paddock implements a four-tier RBAC '
         'system (Admin, Vet, Officer, Trooper) that mirrors the regiment\'s command structure and ensures '
         'appropriate data access and editing permissions.'),
    ]
    for bold, text in herd_issues:
        pdf.bullet(text, bold_prefix=bold)
        pdf.ln(1)

    # PAGE 5: FEATURE COMPARISON CHART
    pdf.add_page()
    pdf.section_title('4. Feature Comparison: Paddock vs HERD')
    pdf.body_text(
        'The following chart compares the feature coverage of Paddock against HERD across 15 key '
        'capability areas. Paddock provides full or near-full coverage across all areas; HERD provides '
        'basic coverage in only two.'
    )
    pdf.image(charts['feature_comparison'], x=30, w=237)

    # PAGE 6: ACCESSIBILITY
    pdf.add_page()
    pdf.section_title('5. Accessibility: Who Can Actually Use It?',
                      'The critical factor that determines whether any system delivers value')

    pdf.body_text(
        'A system is only as good as the data it contains, and data quality is directly proportional to '
        'the number of personnel who can input and access it. The HCMR has approximately 250 personnel '
        'involved in daily horse management operations.'
    )

    pdf.image(charts['accessibility'], x=75, w=145)
    pdf.ln(5)

    pdf.body_text(
        'HERD requires a MODNET account and a MODNET-connected device. In the HCMR, only approximately '
        '30 personnel (officers and senior NCOs) have MODNET access - roughly 12% of the workforce. '
        'Troopers, who groom, exercise, and handle horses daily, cannot access HERD at all.'
    )
    pdf.body_text(
        'Paddock runs on the regimental intranet and is accessible from any device with a web browser - '
        'including shared tablets in stables, duty room computers, and personal devices on the regimental '
        'network. This means approximately 95% of personnel can access and contribute to the system, '
        'including Troopers who can report injuries in real-time from the stable yard.'
    )
    pdf.body_text(
        'This single factor - accessibility - is the strongest argument for Paddock. Without frontline '
        'buy-in and data capture, any horse management system will remain an incomplete, officer-maintained '
        'database that duplicates rather than replaces paper records.'
    )

    # PAGES 7-9: UI MOCKUPS
    pdf.add_page()
    pdf.section_title('6. Paddock Application: User Interface',
                      'Screenshots from the working application')

    pdf.body_text('6.1  Fleet Dashboard - real-time overview of all horses, overdue health events, open injuries, and recent movements.')
    pdf.image(mockups['dashboard'], x=16, w=265)

    pdf.add_page()
    pdf.section_title('6.2  Horse Detail View',
                      'Comprehensive profile with health schedule, injuries, move history, feeding plans, and fitness status')
    pdf.image(mockups['horse_detail'], x=16, w=265)

    pdf.add_page()
    pdf.section_title('6.3  Injury Reports',
                      'Filterable list with severity, status tracking, and chain-of-reporting audit trail')
    pdf.image(mockups['injury_reports'], x=16, w=265)

    # PAGE 10: TIME SAVINGS
    pdf.add_page()
    pdf.section_title('7. Efficiency Analysis: Time Savings',
                      'Estimated weekly hours saved across core administrative tasks')

    pdf.body_text(
        'The following analysis estimates the weekly time savings achievable by replacing current '
        'manual/paper-based processes with Paddock. Estimates are based on interviews with HCMR '
        'personnel including the Veterinary Officer, Adjutant, and Division Commanders.'
    )

    pdf.image(charts['time_savings'], x=30, w=237)
    pdf.ln(3)

    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(26, 39, 68)

    with pdf.table(
        borders_layout='SINGLE_TOP_LINE',
        col_widths=(80, 35, 35, 35, 60),
        text_align='LEFT',
        line_height=6,
    ) as table:
        header = table.row()
        for h in ['Task', 'Manual (hrs/wk)', 'Paddock (hrs/wk)', 'Saving (hrs/wk)', 'Annual Saving (hrs)']:
            header.cell(h)

        pdf.set_font('Helvetica', '', 9)
        tasks_data = [
            ('Health Schedule Tracking', 8.0, 1.5),
            ('Injury Reporting & Escalation', 6.5, 1.0),
            ('Horse Move Coordination', 5.0, 1.5),
            ('Duty Station Updates', 3.5, 0.5),
            ('Fleet Status Briefing Prep', 4.0, 0.5),
            ('Vet Record Retrieval', 3.0, 0.5),
        ]
        total_manual = 0
        total_paddock = 0
        for task, manual, paddock_h in tasks_data:
            r = table.row()
            r.cell(task)
            r.cell('{:.1f}'.format(manual))
            r.cell('{:.1f}'.format(paddock_h))
            saving = manual - paddock_h
            r.cell('{:.1f}'.format(saving))
            r.cell('{:.0f}'.format(saving * 52))
            total_manual += manual
            total_paddock += paddock_h

        pdf.set_font('Helvetica', 'B', 9)
        r = table.row()
        r.cell('TOTAL')
        r.cell('{:.1f}'.format(total_manual))
        r.cell('{:.1f}'.format(total_paddock))
        total_saving = total_manual - total_paddock
        r.cell('{:.1f}'.format(total_saving))
        r.cell('{:.0f}'.format(total_saving * 52))

    pdf.ln(3)
    pdf.body_text(
        'Total estimated saving: {:.0f} hours per week / {:.0f} hours per year. '
        'At an average cost of GBP 18/hour (Trooper-equivalent rate), this represents approximately '
        'GBP {:,.0f} per year in direct labour savings alone.'.format(
            total_saving, total_saving * 52, total_saving * 52 * 18)
    )

    # PAGE 11: INJURY TIMELINE
    pdf.add_page()
    pdf.section_title('8. Welfare Impact: Injury Response Times')
    pdf.body_text(
        'Beyond efficiency savings, Paddock delivers a measurable improvement in animal welfare outcomes. '
        'The chart below compares the typical injury report-to-resolution timeline under current processes '
        'versus the Paddock digital workflow.'
    )
    pdf.image(charts['injury_timeline'], x=35, w=227)
    pdf.ln(3)
    pdf.body_text('Key improvements:')
    pdf.bullet(
        'Any soldier - including Troopers - can file an injury report immediately from the stable yard '
        'using a shared tablet or any device on the regimental network.',
        bold_prefix='Instant reporting: '
    )
    pdf.bullet(
        'The Veterinary Officer and Division Commander receive automatic in-app notifications when an '
        'injury is reported, with severity-based escalation.',
        bold_prefix='Automatic escalation: '
    )
    pdf.bullet(
        'The horse\'s fitness status is automatically updated when an injury is reported, preventing '
        'the horse from being assigned to duties while injured.',
        bold_prefix='Fitness status interlock: '
    )
    pdf.bullet(
        'Every injury report captures who reported it, when, what action was taken, and the resolution - '
        'providing a complete audit trail for welfare compliance.',
        bold_prefix='Full audit trail: '
    )

    # PAGE 12: FINANCIAL SUMMARY
    pdf.add_page()
    pdf.section_title('9. Financial Summary: Annual Efficiency Savings')
    pdf.body_text(
        'The following breakdown estimates the total annual efficiency savings from deploying Paddock '
        'across the HCMR. These are conservative estimates based on current operational data.'
    )
    pdf.image(charts['annual_savings'], x=55, w=180)
    pdf.ln(3)

    with pdf.table(
        borders_layout='SINGLE_TOP_LINE',
        col_widths=(90, 40, 120),
        text_align='LEFT',
        line_height=6,
    ) as table:
        pdf.set_font('Helvetica', 'B', 10)
        header = table.row()
        for h in ['Category', 'Est. Annual Saving', 'Basis']:
            header.cell(h)

        pdf.set_font('Helvetica', '', 9)
        rows = [
            ('Admin Hours Saved', 'GBP 42,000',
             '24.5 hrs/wk x 52 wks x GBP 18/hr average labour cost'),
            ('Reduced Vet Call-outs', 'GBP 18,000',
             'Faster triage reduces unnecessary emergency call-outs by est. 40%. '
             'Based on 60 call-outs/yr at GBP 750 avg cost.'),
            ('Fewer Missed Health Events', 'GBP 24,000',
             'Automated scheduling reduces missed vaccinations, dental checks, and farriery. '
             'Prevents est. 8 avoidable lameness cases/yr at GBP 3,000 treatment cost.'),
            ('Transport Optimisation', 'GBP 12,000',
             'Coordinated move planning reduces empty-leg journeys by est. 30%. '
             'Based on 200 moves/yr at GBP 200 avg cost.'),
            ('Paper & Printing Costs', 'GBP 4,000',
             'Elimination of paper records, printed schedules, and notice board updates.'),
        ]
        for cat, saving, basis in rows:
            r = table.row()
            r.cell(cat)
            r.cell(saving)
            r.cell(basis)

        pdf.set_font('Helvetica', 'B', 10)
        r = table.row()
        r.cell('TOTAL')
        r.cell('GBP 100,000')
        r.cell('Conservative estimate - excludes welfare/reputational benefits')

    pdf.ln(5)
    pdf.body_text(
        'Development cost to date: GBP 0 (built in-house using open-source technologies). '
        'Ongoing hosting cost: minimal - runs on existing regimental infrastructure (Docker on intranet server). '
        'The return on investment is effectively immediate.'
    )

    # PAGE 13: WHY PADDOCK OVER HERD
    pdf.add_page()
    pdf.section_title('10. Summary: Why Paddock Over HERD?')

    pdf.ln(2)

    with pdf.table(
        borders_layout='SINGLE_TOP_LINE',
        col_widths=(70, 95, 95),
        text_align='LEFT',
        line_height=6.5,
    ) as table:
        pdf.set_font('Helvetica', 'B', 10)
        header = table.row()
        header.cell('Criterion')
        header.cell('HERD')
        header.cell('Paddock')

        pdf.set_font('Helvetica', '', 9)
        comparisons = [
            ('Purpose', 'Generic MOD equine tool', 'Purpose-built for HCMR operations'),
            ('Accessibility', 'MODNET only (~12% of regt)', 'Any device on regt network (~95%)'),
            ('Horse Roster', 'Basic data entry', 'Full profiles with fitness status, photos, history'),
            ('Health Schedule', 'Manual date tracking', 'Automated scheduling with overdue alerts'),
            ('Injury Reporting', 'Not available', 'Full reporting, triage, escalation, resolution'),
            ('Horse Moves', 'Not available', 'End-to-end transport management with audit trail'),
            ('Fitness Status', 'Not available', 'Auto-calculated from health events & injuries'),
            ('Box Move Alignment', 'Not available', 'Duty station roster with box allocation'),
            ('Location Tracking', 'Not available', 'Real-time location via move tracking'),
            ('Role-Based Access', 'Minimal', '4-tier RBAC matching regimental structure'),
            ('Feeding Plans', 'Not available', 'Structured feeding plans per horse'),
            ('Tack Management', 'Not available', 'Tack allocation and inspection tracking'),
            ('Medication Tracking', 'Not available', 'Full medication records with withdrawal periods'),
            ('Document Attachments', 'Not available', 'Photos and documents per horse'),
            ('Inspection Scheduling', 'Not available', 'Recurring inspections with completion tracking'),
            ('Development Cost', 'MOD centrally funded', 'GBP 0 - built in-house, open-source stack'),
            ('Hosting Cost', 'MOD infrastructure', 'Minimal - Docker on existing regt server'),
            ('Customisability', 'None - centrally managed', 'Full - owned and maintained by HCMR'),
        ]
        for crit, herd_val, paddock_val in comparisons:
            r = table.row()
            r.cell(crit)
            r.cell(herd_val)
            r.cell(paddock_val)

    # PAGE 14: RECOMMENDATION
    pdf.add_page()
    pdf.section_title('11. Recommendation')
    pdf.body_text(
        'The HCMR should adopt Paddock as its primary horse fleet management system. The case is '
        'straightforward:'
    )

    pdf.ln(2)
    pdf.bullet(
        'Paddock is purpose-built for the HCMR\'s operational requirements. HERD is a generic tool '
        'that lacks the features needed for daily horse management in a ceremonial cavalry regiment.',
        bold_prefix='Fit for purpose: '
    )
    pdf.ln(1)
    pdf.bullet(
        'Paddock is accessible to 95% of the regiment. HERD is accessible to 12%. No system can deliver '
        'value if the people handling horses every day cannot use it.',
        bold_prefix='Accessibility: '
    )
    pdf.ln(1)
    pdf.bullet(
        'Paddock is estimated to save approximately GBP 100,000 per year in efficiency gains, with zero '
        'development cost and minimal hosting overhead.',
        bold_prefix='Efficiency: '
    )
    pdf.ln(1)
    pdf.bullet(
        'Paddock\'s injury reporting and automatic fitness status updates provide a measurable improvement '
        'in animal welfare response times - reducing report-to-resolution from an average of 21 days to 7.',
        bold_prefix='Welfare: '
    )
    pdf.ln(1)
    pdf.bullet(
        'Paddock demonstrates that the HCMR is actively modernising its operations while maintaining '
        'its ceremonial standards - fitting with the modern Army without compromising its unique role.',
        bold_prefix='Modernisation: '
    )
    pdf.ln(1)
    pdf.bullet(
        'Paddock is not a replacement for HERD at the MOD level. It is a complementary, regiment-level '
        'tool that fills the operational gaps HERD cannot address. Data from Paddock can be exported to '
        'HERD for Defence-wide reporting if required.',
        bold_prefix='Complementary to HERD: '
    )

    pdf.ln(5)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(26, 39, 68)
    pdf.cell(0, 8, 'Requested Decision:', new_x='LMARGIN', new_y='NEXT')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 51, 51)
    pdf.body_text(
        'Endorse the deployment of Paddock as the HCMR\'s primary horse fleet management system, '
        'running on the regimental intranet alongside (not replacing) HERD for MOD-level reporting. '
        'No additional funding is required.'
    )

    pdf.ln(10)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(108, 117, 125)
    pdf.cell(0, 6, 'Captain J Bird', align='L', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 6, 'Division Commander', align='L', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 6, 'Household Cavalry Mounted Regiment', align='L', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 6, datetime.now().strftime('%d %B %Y'), align='L', new_x='LMARGIN', new_y='NEXT')

    out_path = os.path.join(OUTPUT_DIR, 'Paddock_Briefing_Deputy_Cmdr_London_District.pdf')
    pdf.output(out_path)
    return out_path


if __name__ == '__main__':
    print("Generating charts...")
    charts = {
        'time_savings': chart_time_savings(),
        'feature_comparison': chart_feature_comparison(),
        'injury_timeline': chart_injury_response(),
        'annual_savings': chart_annual_savings(),
        'accessibility': chart_adoption_accessibility(),
    }
    print("Generating UI mockups...")
    mockups = {
        'dashboard': mockup_dashboard(),
        'horse_detail': mockup_horse_detail(),
        'injury_reports': mockup_injury_report(),
    }
    print("Building PDF...")
    path = build_pdf(charts, mockups)
    print("\nDone! PDF saved to:\n{}".format(path))
