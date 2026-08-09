"""Generate the "Top 10 Landing Page Mistakes" PDF checklist.

Run: python3 platform_api/scripts/generate_checklist_pdf.py
Output: customer-portal/public/assets/top-10-mistakes-checklist.pdf

Requires: pip install reportlab
"""
from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_LEFT, TA_CENTER
    REPORTLAB = True
except ImportError:
    REPORTLAB = False

MISTAKES = [
    {
        "num": 1,
        "mistake": "H1 Doesn't Match Ad Copy",
        "impact": "Bounce rate +12%",
        "fix": "Copy your ad headline directly into your H1. Test for 7 days.",
    },
    {
        "num": 2,
        "mistake": "CTA Button Says 'Submit'",
        "impact": "Click-through rate -8%, Abandonment +15%",
        "fix": "Use action-specific text: 'Start my free trial' or 'Get my quote in 2 min'",
    },
    {
        "num": 3,
        "mistake": "Meta Description Missing",
        "impact": "Search CTR -5%",
        "fix": "Write 155-char description: Problem + Promise. Run free audit to check yours.",
    },
    {
        "num": 4,
        "mistake": "Form Asks Too Much Upfront",
        "impact": "Abandonment rate +20%",
        "fix": "Remove all fields except email on first step. Add name/company in step 2.",
    },
    {
        "num": 5,
        "mistake": "No Social Proof Above Fold",
        "impact": "Bounce rate +10%",
        "fix": "Add: '3,400 founders trust us' or 3 logos within the first scroll.",
    },
    {
        "num": 6,
        "mistake": "Weak Reason to Believe",
        "impact": "Conversion rate -15%",
        "fix": "Add one specific stat: '94% of users see results in 7 days.' with source.",
    },
    {
        "num": 7,
        "mistake": "Mobile CTA Below Fold",
        "impact": "Mobile conversion rate -30%",
        "fix": "Move CTA button above fold on mobile. Test with Google Mobile-Friendly Test.",
    },
    {
        "num": 8,
        "mistake": "Copy Uses 'We' Not 'You'",
        "impact": "Engagement -25%",
        "fix": "Find/replace 'We' with 'You'. 'We help businesses' → 'You get results'.",
    },
    {
        "num": 9,
        "mistake": "No Urgency Signaling",
        "impact": "Immediate action rate -20%",
        "fix": "Add scarcity (limited spots) or time-sensitivity (offer expires) where true.",
    },
    {
        "num": 10,
        "mistake": "Trust Signals Absent",
        "impact": "Checkout completion -18%",
        "fix": "Add: money-back guarantee, security badge, or 1 real testimonial with photo.",
    },
]


def generate_pdf(output_path: Path) -> None:
    if not REPORTLAB:
        print("reportlab not installed. Run: pip install reportlab")
        return

    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=letter,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    brand_red = colors.HexColor("#DC2626")
    brand_dark = colors.HexColor("#111827")
    brand_muted = colors.HexColor("#6B7280")
    brand_bg = colors.HexColor("#F9FAFB")

    title_style = ParagraphStyle(
        "title", parent=styles["Heading1"],
        fontSize=22, textColor=brand_dark,
        spaceAfter=4, alignment=TA_CENTER,
        fontName="Helvetica-Bold",
    )
    subtitle_style = ParagraphStyle(
        "subtitle", parent=styles["Normal"],
        fontSize=11, textColor=brand_muted,
        spaceAfter=16, alignment=TA_CENTER,
    )
    label_style = ParagraphStyle(
        "label", parent=styles["Normal"],
        fontSize=8, textColor=brand_muted,
        spaceAfter=2, fontName="Helvetica",
        alignment=TA_CENTER,
    )
    footer_style = ParagraphStyle(
        "footer", parent=styles["Normal"],
        fontSize=9, textColor=brand_muted,
        alignment=TA_CENTER,
    )

    story = []

    # Header
    story.append(Paragraph("Top 10 Landing Page Mistakes", title_style))
    story.append(Paragraph("Costing you thousands in wasted ad spend", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=brand_red, spaceAfter=12))

    # Checklist table
    table_data = [["#", "Mistake", "Impact", "Quick Fix"]]
    for m in MISTAKES:
        table_data.append([
            str(m["num"]),
            m["mistake"],
            m["impact"],
            m["fix"],
        ])

    col_widths = [0.3 * inch, 1.8 * inch, 1.5 * inch, 3.2 * inch]
    t = Table(table_data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        # Header row
        ("BACKGROUND", (0, 0), (-1, 0), brand_dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("ALIGN", (0, 0), (-1, 0), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        # Data rows
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("VALIGN", (0, 1), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        # Alternating rows
        *[("BACKGROUND", (0, i), (-1, i), brand_bg) for i in range(2, len(MISTAKES) + 2, 2)],
        # Number col: centered, bold, red
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, -1), brand_red),
        # Grid
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LINEBELOW", (0, 0), (-1, 0), 2, brand_red),
    ]))
    story.append(t)

    story.append(Spacer(1, 16))

    # Score yourself
    score_label = Paragraph(
        "YOUR SCORE: _____ / 10 mistakes found on your page",
        ParagraphStyle(
            "score", parent=styles["Normal"],
            fontSize=11, textColor=brand_dark,
            alignment=TA_CENTER, fontName="Helvetica-Bold",
            borderPad=8, borderColor=brand_red, borderWidth=1,
            borderRadius=4, backColor=colors.HexColor("#FEF2F2"),
        )
    )
    story.append(score_label)
    story.append(Spacer(1, 12))

    # CTA
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#E5E7EB"), spaceAfter=8))
    story.append(Paragraph(
        "Found 3+ mistakes? Get a free full audit → <b>nebulacomponents.com/audit</b>",
        footer_style,
    ))
    story.append(Paragraph(
        "90 seconds. Specific fixes. No email required to see results.",
        footer_style,
    ))

    doc.build(story)
    print(f"✓ PDF generated: {output_path}")


if __name__ == "__main__":
    out = Path(__file__).parent.parent.parent / "customer-portal/public/assets/top-10-mistakes-checklist.pdf"
    generate_pdf(out)
