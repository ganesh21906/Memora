"""
Generate data/monthly_report.pdf using PyMuPDF.
Run from the project root: python scripts/create_pdf.py
"""
import fitz  # PyMuPDF
from pathlib import Path

OUTPUT = Path("data/monthly_report.pdf")
W, H = 595, 842  # A4 dimensions in points

def add_text(page, x, y, text, fontsize=11, bold=False, color=(0, 0, 0)):
    fontname = "helv" if not bold else "hebo"
    page.insert_text((x, y), text, fontsize=fontsize, fontname=fontname, color=color)
    return y + fontsize + 4

def add_line(page, y, margin=50):
    page.draw_line((margin, y), (W - margin, y), color=(0.8, 0.8, 0.8), width=0.5)
    return y + 10

def add_section(page, y, title):
    y += 6
    page.draw_rect(fitz.Rect(50, y, W - 50, y + 22), color=(0.1, 0.1, 0.5), fill=(0.1, 0.1, 0.5))
    page.insert_text((56, y + 15), title, fontsize=11, fontname="hebo", color=(1, 1, 1))
    return y + 32

doc = fitz.open()

# ── Page 1 ────────────────────────────────────────────
page = doc.new_page(width=W, height=H)
y = 60

# Header
page.draw_rect(fitz.Rect(0, 0, W, 80), color=(0.06, 0.06, 0.35), fill=(0.06, 0.06, 0.35))
page.insert_text((50, 50), "Q1 2026 — Personal Progress & Finance Report", fontsize=15, fontname="hebo", color=(1, 1, 1))
y = 100

y = add_text(page, 50, y, "Prepared by: Alex Morgan", fontsize=10, color=(0.4, 0.4, 0.4))
y = add_text(page, 50, y, "Period: January 1, 2026 — March 10, 2026", fontsize=10, color=(0.4, 0.4, 0.4))
y = add_text(page, 50, y, "Generated: March 10, 2026", fontsize=10, color=(0.4, 0.4, 0.4))
y += 10
y = add_line(page, y)

# Section 1: Health & Fitness
y = add_section(page, y, "1. HEALTH & FITNESS TRACKER")
rows = [
    ("Metric",           "Jan 2026",   "Feb 2026",  "Mar (to date)"),
    ("Weight (kg)",      "82.0",       "80.5",      "79.0"),
    ("BMI",              "26.8",       "26.3",      "25.8"),
    ("Daily steps avg",  "4,200",      "6,100",     "7,400"),
    ("Water intake",     "1.8 L/day",  "2.2 L/day", "2.5 L/day"),
    ("Gym sessions",     "0",          "8",         "6"),
    ("Duolingo streak",  "Started",    "27 days",   "54 days"),
]
col_x = [56, 210, 340, 460]
for i, row in enumerate(rows):
    bg = (0.95, 0.95, 0.95) if i % 2 == 0 else (1, 1, 1)
    page.draw_rect(fitz.Rect(50, y - 4, W - 50, y + 14), color=bg, fill=bg)
    bold = (i == 0)
    for j, cell in enumerate(row):
        page.insert_text((col_x[j], y + 9), cell, fontsize=9,
                         fontname="hebo" if bold else "helv",
                         color=(0.1, 0.1, 0.4) if bold else (0.1, 0.1, 0.1))
    y += 18

y += 4
y = add_text(page, 56, y, "Doctor visit: Jan 9 — Dr. Ramesh, City Clinic. BP 118/76. Prescribed Vitamin D3 + Omega-3.", fontsize=9, color=(0.3, 0.3, 0.3))
y = add_text(page, 56, y, "Dental overdue by 6+ months — appointment booked Feb 22 with Dr. Priya.", fontsize=9, color=(0.3, 0.3, 0.3))
y += 8

# Section 2: Finance Summary
y = add_section(page, y, "2. MONTHLY FINANCE SUMMARY")
finance_rows = [
    ("Month",       "Income (INR)",  "Expenses (INR)", "Savings (INR)",  "Savings %"),
    ("January",     "55,000",        "38,800",         "16,200",         "29.5%"),
    ("February",    "55,000",        "39,200",         "15,800",         "28.7%"),
    ("March (est)", "55,000",        "24,000",         "~31,000",        "~56%"),
    ("Q1 Total",    "1,65,000",      "1,02,000",       "~63,000",        "~38%"),
]
for i, row in enumerate(finance_rows):
    bg = (0.9, 0.95, 1.0) if i == len(finance_rows) - 1 else ((0.95, 0.95, 0.95) if i % 2 == 0 else (1, 1, 1))
    page.draw_rect(fitz.Rect(50, y - 4, W - 50, y + 14), color=bg, fill=bg)
    bold = (i == 0 or i == len(finance_rows) - 1)
    col_x2 = [56, 180, 300, 420, 510]
    for j, cell in enumerate(row):
        page.insert_text((col_x2[j], y + 9), cell, fontsize=9,
                         fontname="hebo" if bold else "helv",
                         color=(0.0, 0.2, 0.5) if bold else (0.1, 0.1, 0.1))
    y += 18

y += 8
y = add_text(page, 56, y, "Savings goal: ₹15,000/month. Achieved both January and February. On track Q1.", fontsize=9, color=(0.1, 0.5, 0.1))
y = add_text(page, 56, y, "One-time large expense: SafeLife insurance premium ₹8,200 paid in February.", fontsize=9, color=(0.3, 0.3, 0.3))
y = add_text(page, 56, y, "Coorg trip cost: ₹4,700 total (one-time). Meena owes ₹1,950 — received Feb 3.", fontsize=9, color=(0.3, 0.3, 0.3))

# ── Page 2 ────────────────────────────────────────────
page2 = doc.new_page(width=W, height=H)
y2 = 60

page2.draw_rect(fitz.Rect(0, 0, W, 80), color=(0.06, 0.06, 0.35), fill=(0.06, 0.06, 0.35))
page2.insert_text((50, 50), "Q1 2026 — Personal Progress & Finance Report (cont.)", fontsize=13, fontname="hebo", color=(1, 1, 1))
y2 = 100

# Section 3: Top Expense Categories
y2 = add_section(page2, y2, "3. TOP EXPENSE CATEGORIES — JAN TO MAR 2026")
expense_rows = [
    ("Category",        "Jan (INR)", "Feb (INR)", "Total (INR)", "% of Spend"),
    ("Groceries",        "8,060",    "8,420",     "16,480",      "16.2%"),
    ("Food & Dining",    "4,390",    "2,260",     "6,650",       "6.5%"),
    ("Travel",           "4,700",    "0",         "4,700",       "4.6%"),
    ("Transport",        "3,600",    "3,890",     "7,490",       "7.3%"),
    ("Health",           "1,260",    "4,300",     "5,560",       "5.5%"),
    ("Utilities",        "3,138",    "3,099",     "6,237",       "6.1%"),
    ("Insurance",        "0",        "8,200",     "8,200",       "8.0%"),
    ("Shopping",         "3,499",    "1,080",     "4,579",       "4.5%"),
    ("Entertainment",    "649",      "1,349",     "1,998",       "2.0%"),
    ("Savings (transfer)","16,200",  "15,800",    "32,000",      "31.4%"),
]
col_x3 = [56, 200, 300, 400, 500]
for i, row in enumerate(expense_rows):
    bg = (0.9, 0.95, 1.0) if i == 0 else ((0.95, 0.95, 0.95) if i % 2 == 0 else (1, 1, 1))
    page2.draw_rect(fitz.Rect(50, y2 - 4, W - 50, y2 + 14), color=bg, fill=bg)
    for j, cell in enumerate(row):
        page2.insert_text((col_x3[j], y2 + 9), cell, fontsize=9,
                          fontname="hebo" if i == 0 else "helv",
                          color=(0.0, 0.2, 0.5) if i == 0 else (0.1, 0.1, 0.1))
    y2 += 18

y2 += 8

# Section 4: Work & Projects
y2 = add_section(page2, y2, "4. WORK & PROJECTS")
y2 = add_text(page2, 56, y2, "Project: Q1 Client Dashboard (Company Internal)", fontsize=10, bold=True)
y2 = add_text(page2, 56, y2, "  Team: Alex Morgan (Dev), Kiran, Disha, Suresh (PM)", fontsize=9, color=(0.3, 0.3, 0.3))
y2 = add_text(page2, 56, y2, "  Stack: React, FastAPI, PostgreSQL", fontsize=9, color=(0.3, 0.3, 0.3))
y2 = add_text(page2, 56, y2, "  Status: Sprint 2 in progress. Deadline March 31, 2026.", fontsize=9, color=(0.1, 0.5, 0.1))
y2 = add_text(page2, 56, y2, "  Sprint 1 completed Feb 3. Sprint 2 review scheduled March 7.", fontsize=9, color=(0.3, 0.3, 0.3))
y2 += 8

# Section 5: Personal Goals Tracking
y2 = add_section(page2, y2, "5. PERSONAL GOALS — Q1 STATUS")
goal_rows = [
    ("Goal",                              "Target",         "Status"),
    ("Weight loss",                       "74 kg by June",  "On track — 79 kg (down 3 kg)"),
    ("Monthly savings",                   "₹15,000/month",  "Achieved both months ✓"),
    ("Books read",                        "12 in 2026",     "2 done: Atomic Habits, Deep Work"),
    ("Duolingo Spanish streak",           "Daily",          "54 days streak — going strong ✓"),
    ("Gym habit",                         "3x/week",        "Started Feb — 8 sessions so far"),
    ("ITR filing",                        "March 31",       "CA Pradeep consulted — in progress"),
    ("Insurance renewal",                 "April 15",       "SafeLife paid — renewal noted"),
]
col_x4 = [56, 230, 360]
for i, row in enumerate(goal_rows):
    bg = (0.9, 0.95, 1.0) if i == 0 else ((0.95, 0.95, 0.95) if i % 2 == 0 else (1, 1, 1))
    page2.draw_rect(fitz.Rect(50, y2 - 4, W - 50, y2 + 14), color=bg, fill=bg)
    for j, cell in enumerate(row):
        page2.insert_text((col_x4[j], y2 + 9), cell, fontsize=9,
                          fontname="hebo" if i == 0 else "helv",
                          color=(0.0, 0.2, 0.5) if i == 0 else (0.1, 0.1, 0.1))
    y2 += 18

y2 += 10
y2 = add_line(page2, y2)
y2 = add_text(page2, 56, y2, "Overall Q1 Assessment: Strong start. Finance and health goals on track. Work project progressing well.", fontsize=9, bold=True, color=(0.1, 0.3, 0.1))
y2 = add_text(page2, 56, y2, "Key actions for Q2: Ramp up gym, complete ITR, renew car insurance by March 20.", fontsize=9, color=(0.3, 0.3, 0.3))

doc.save(str(OUTPUT))
print(f"PDF created: {OUTPUT} ({OUTPUT.stat().st_size / 1024:.1f} KB)")
