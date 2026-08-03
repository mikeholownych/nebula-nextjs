from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parents[1] / "public" / "downloads" / "paid-traffic-leak-scorecard.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

BG = colors.HexColor("#071312")
INK = colors.HexColor("#E8F2EF")
MUTED = colors.HexColor("#A8BCB6")
ACCENT = colors.HexColor("#00C2A0")
LINE = colors.HexColor("#26413B")
PANEL = colors.HexColor("#10211D")

questions = [
    ("01", "Is this landing page receiving active paid traffic right now?", "Confirm the campaign, landing-page URL, and conversion event before changing the page or increasing budget.", "If paid traffic is not active or cannot be confirmed, spend and page performance cannot be evaluated against the same decision context."),
    ("02", "Does the landing-page headline repeat the promise that made the visitor click the ad?", "Put the ad's core promise into the first visible headline and verify the wording on the live page.", "A break between the ad promise and the headline forces the visitor to re-evaluate whether they are in the right place."),
    ("03", "Can a new visitor understand the offer and who it is for before scrolling?", "State the buyer, problem, and concrete outcome in the first viewport before adding more traffic.", "If the offer is delayed or abstract above the fold, paid clicks encounter uncertainty before they reach the action."),
    ("04", "Is there one obvious primary CTA that tells the visitor exactly what happens next?", "Choose one primary action, name the immediate outcome, and make supporting links visually secondary.", "Competing or vague CTAs create decision friction at the point where the paid visitor should act."),
    ("05", "Is credible proof visible before the visitor has to make the decision?", "Place specific testimonials, customer evidence, or verifiable proof beside the offer and CTA.", "When proof is absent or buried, the visitor must accept the offer without evidence that it works for someone like them."),
    ("06", "Does the mobile page preserve the same offer, proof, and CTA path without avoidable friction?", "Walk the complete conversion path on a real phone and fix the first blocked or ambiguous interaction.", "A desktop-ready page can still lose paid visitors when mobile layout, tap targets, or CTA placement break the path."),
    ("07", "Is one conversion event defined and being measured for this page?", "Name the single action that counts, confirm its tracking fires, and use it consistently in campaign decisions.", "Without a defined event, traffic and page changes cannot be compared against a reliable outcome."),
]

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, leading=12, textColor=ACCENT, tracking=1.8, spaceAfter=18))
styles.add(ParagraphStyle(name="CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=29, leading=34, textColor=INK, alignment=TA_LEFT, spaceAfter=18))
styles.add(ParagraphStyle(name="CoverSub", parent=styles["Normal"], fontName="Helvetica", fontSize=13, leading=20, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle(name="H1Nebula", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=INK, spaceBefore=4, spaceAfter=14))
styles.add(ParagraphStyle(name="H2Nebula", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=INK, spaceBefore=8, spaceAfter=7))
styles.add(ParagraphStyle(name="BodyNebula", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.5, leading=14, textColor=MUTED, spaceAfter=7))
styles.add(ParagraphStyle(name="SmallNebula", parent=styles["BodyText"], fontName="Helvetica", fontSize=8, leading=11, textColor=MUTED, spaceAfter=4))
styles.add(ParagraphStyle(name="Question", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Label", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8, leading=10, textColor=ACCENT, spaceAfter=3))
styles.add(ParagraphStyle(name="Callout", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=11, leading=15, textColor=INK, alignment=TA_CENTER, spaceAfter=2))


def p(text, style="BodyNebula"):
    return Paragraph(text, styles[style])


def box(items, width=6.85 * inch, bg=PANEL, padding=12):
    t = Table([[items]], colWidths=[width])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]))
    return t


def header_footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, letter[0], letter[1], stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(doc.leftMargin, 0.52 * inch, letter[0] - doc.rightMargin, 0.52 * inch)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.setFillColor(ACCENT)
    canvas.drawString(doc.leftMargin, 0.32 * inch, "NEBULA COMPONENTS / PAID-TRAFFIC LEAK SCORECARD")
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(letter[0] - doc.rightMargin, 0.32 * inch, f"{doc.page}")
    canvas.restoreState()


doc = BaseDocTemplate(
    str(OUT),
    pagesize=letter,
    leftMargin=0.7 * inch,
    rightMargin=0.7 * inch,
    topMargin=0.72 * inch,
    bottomMargin=0.72 * inch,
    title="Paid-Traffic Leak Scorecard",
    author="Nebula Components",
    subject="A practical worksheet for inspecting paid-traffic landing-page conversion conditions",
)
doc.addPageTemplates([PageTemplate(id="nebula", frames=[Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")], onPage=header_footer)])
story = []

# Cover
story += [Spacer(1, 0.55 * inch), p("NEBULA COMPONENTS", "CoverKicker"), p("Before you buy more clicks, find the leak.", "CoverTitle"), p("A practical worksheet for inspecting the landing-page conditions that sit between paid traffic and a conversion decision.", "CoverSub"), Spacer(1, 0.25 * inch)]
story.append(box([p("USE THIS IN 5 MINUTES", "Label"), p("Mark what you know. Flag what you cannot verify. Fix the first high-impact uncertainty before increasing spend.", "Callout")], bg=colors.HexColor("#10362E"), padding=16))
story += [Spacer(1, 0.36 * inch), p("This is a self-assessment, not a measured audit. It identifies inspection priorities from your answers; it does not prove lost revenue, diagnose your page source, or guarantee an improvement.", "BodyNebula"), Spacer(1, 0.35 * inch), p("Interactive version", "Label"), p("Run the same seven-question scorecard online at <link href='https://nebulacomponents.com/paid-traffic-leak-scorecard' color='#00C2A0'>nebulacomponents.com/paid-traffic-leak-scorecard</link>.", "BodyNebula"), Spacer(1, 0.28 * inch), p("Adapted from the foundations-first GTM sequence in the user-provided ONEGTMLAB AI GTM Roadmap. Nebula-specific language and inspection boundaries are its own adaptation.", "SmallNebula"), PageBreak()]

# How to use
story += [p("How to use this worksheet", "H1Nebula"), p("The fastest way to waste paid traffic is to change several layers at once and then treat the next result as proof. Use this worksheet to slow the decision down enough to know what you are changing.", "BodyNebula")]
story.append(box([p("1 / Record the page", "Label"), p("Landing-page URL: _________________________________________________", "BodyNebula"), p("Campaign or ad set: ______________________________________________", "BodyNebula"), p("Primary conversion event: ________________________________________", "BodyNebula"), p("Date checked: ____________________   Device checked: ______________", "BodyNebula")]))
story += [Spacer(1, 0.18 * inch), p("2 / Answer from evidence", "H2Nebula"), p("Use Yes only when you can point to the live page, the live campaign, or the live measurement setup. Use No or not sure when the condition is absent, unclear, or unverified. Uncertainty is a useful finding.", "BodyNebula"), p("3 / Fix one layer at a time", "H2Nebula"), p("Start with message and offer clarity. Then inspect the action and proof. Then validate the mobile path and measurement. Do not automate or scale a path you have not manually inspected.", "BodyNebula"), Spacer(1, 0.15 * inch), box([p("Operating rule", "Label"), p("Foundations before engineering. Engineering before automation. Evidence before confidence.", "Callout")], bg=colors.HexColor("#10362E")), PageBreak()]

# Worksheet pages
for idx, (num, question, action, explanation) in enumerate(questions):
    if idx == 0:
        story += [p("The seven-question worksheet", "H1Nebula"), p("Answer every question. Do not use the score as a performance benchmark; use it as a prioritization signal.", "BodyNebula")]
    story += [Spacer(1, 0.10 * inch), p(f"{num} / {question}", "Question"), p("[ ] Yes, verified     [ ] No or not sure", "BodyNebula"), p("What I observed: ________________________________________________________________", "SmallNebula"), p("_______________________________________________________________________________", "SmallNebula"), p("Why this matters", "Label"), p(explanation, "SmallNebula"), p("Next action", "Label"), p(action, "SmallNebula")]
    if idx in (2, 5, 6):
        story.append(PageBreak())

# Scoring
story += [PageBreak(), p("Score the inspection signal", "H1Nebula"), p("Count every No or not sure answer. A higher count means more conditions deserve inspection before you buy more traffic. It is not a conversion-rate forecast.", "BodyNebula")]
score_rows = [[p("Risk signals", "Label"), p("Interpretation", "Label"), p("Next decision", "Label")], [p("0–1", "Question"), p("Low immediate risk from this self-check", "SmallNebula"), p("Verify the remaining assumptions and keep measuring", "SmallNebula")], [p("2–3", "Question"), p("Inspect before scaling spend", "SmallNebula"), p("Choose the highest-impact unclear condition", "SmallNebula")], [p("4–7", "Question"), p("Audit before buying more traffic", "SmallNebula"), p("Run a measured audit on the actual landing page", "SmallNebula")]]
t = Table(score_rows, colWidths=[1.0 * inch, 2.55 * inch, 3.3 * inch], repeatRows=1)
t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#10362E")), ("GRID", (0, 0), (-1, -1), 0.5, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8)]))
story += [t, Spacer(1, 0.25 * inch), p("Your count: ______ / 7", "Question"), p("The next thing I will verify: __________________________________________________", "BodyNebula"), p("The evidence I will use: ________________________________________________________", "BodyNebula"), Spacer(1, 0.18 * inch), box([p("Do not skip the measurement question", "Label"), p("If you cannot name the event that counts, you cannot reliably compare traffic, page changes, or campaign decisions. Define the event before interpreting movement.", "BodyNebula")]), PageBreak()]

# Audit handoff
story += [p("From self-check to measured audit", "H1Nebula"), p("The worksheet tells you what to inspect. A measured audit checks the actual public page and returns evidence tied to the page state at the time of analysis.", "BodyNebula")]
story.append(box([p("Run the free Nebula audit", "Label"), p("Paste the landing-page URL and receive a measured review of conversion signals, including page-specific evidence and prioritized findings.", "BodyNebula"), p("<link href='https://nebulacomponents.com/audit?source=paid-traffic-leak-scorecard-pdf' color='#00C2A0'>Start the free audit -></link>", "Callout")], bg=colors.HexColor("#10362E"), padding=16))
story += [Spacer(1, 0.22 * inch), p("What this worksheet does not claim", "H2Nebula"), p("It does not estimate your lost revenue. It does not prove that any single answer caused a conversion failure. It does not promise a ranking, conversion lift, or return on ad spend. It does not replace analytics, campaign review, user research, or a measured inspection of the live page.", "BodyNebula"), p("What to do next", "H2Nebula"), p("1. Keep the page and campaign context fixed.  2. Pick one high-impact condition.  3. Make one bounded change.  4. Confirm the live page changed as intended.  5. Re-audit and compare the defined event over a pre-declared window.", "BodyNebula"), Spacer(1, 0.28 * inch), p("Nebula Components", "Label"), p("Evidence-backed landing-page audits for founders spending on ads with zero conversions.", "BodyNebula"), p("nebulacomponents.com", "SmallNebula")]

doc.build(story)
print(OUT)
