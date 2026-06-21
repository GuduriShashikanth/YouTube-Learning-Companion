import io
import re
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def draw_page_decorations(canvas, doc):
    canvas.saveState()
    # Draw header (only on pages after the first page, if it's a multi-page guide)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(colors.HexColor("#E11D48"))
    canvas.drawString(54, 750, "YOUTUBE LEARNING COMPANION")
    
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawRightString(doc.pagesize[0] - 54, 750, f"Page {doc.page}")
    
    # Divider line under header
    canvas.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas.setLineWidth(0.75)
    canvas.line(54, 742, doc.pagesize[0] - 54, 742)
    
    # Draw footer
    canvas.line(54, 50, doc.pagesize[0] - 54, 50)
    canvas.drawString(54, 38, "Generated Study Guide. Powered by AI & YouTube Learning Companion.")
    canvas.restoreState()

def generate_pdf_from_markdown(title: str, markdown_content: str) -> io.BytesIO:
    buffer = io.BytesIO()
    
    # Setup document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=54,
        leftMargin=54,
        topMargin=72,  # Give room for header decoration
        bottomMargin=72  # Give room for footer decoration
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Premium Color Palette
    primary_color = colors.HexColor("#E11D48")     # Rose Red
    dark_slate = colors.HexColor("#0F172A")        # Slate 900
    gray_text = colors.HexColor("#334155")         # Slate 700
    accent_box_bg = colors.HexColor("#F8FAFC")     # Slate 50
    border_color = colors.HexColor("#E2E8F0")      # Slate 200
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=6,
        keepWithNext=True
    )
    
    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#94A3B8"),
        spaceAfter=20
    )
    
    h2_style = ParagraphStyle(
        'H2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=dark_slate,
        spaceBefore=16,
        spaceAfter=6,
        keepWithNext=True
    )
    
    h3_style = ParagraphStyle(
        'H3',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=primary_color,
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'Body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=gray_text,
        spaceBefore=3,
        spaceAfter=5
    )
    
    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=gray_text,
        leftIndent=15,
        firstLineIndent=-8,
        spaceBefore=2,
        spaceAfter=2
    )
    
    story = []
    
    # Document Title Page Banner
    story.append(Paragraph(title, title_style))
    story.append(Paragraph("STUDY NOTES & VIDEO GUIDE", subtitle_style))
    story.append(Spacer(1, 10))
    
    # Parse Markdown lines
    lines = markdown_content.split('\n')
    
    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
            
        # Parse bold/italic inline markdown
        # Note: ReportLab paragraphs accept simple HTML tags (<b>, <i>, <font>, etc.)
        processed_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line_str)
        processed_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', processed_text)
        
        # IMPORTANT: check longer prefixes first (### before ##, ## before #)
        # Heading 3 (### ) — must come before Heading 2 check
        if line_str.startswith('### '):
            text = processed_text[4:]
            story.append(Paragraph(text, h3_style))
            
        # Heading 2 (## )
        elif line_str.startswith('## '):
            text = processed_text[3:]
            story.append(Paragraph(text, h2_style))

        # Heading 1 (# ) — treat same as H2 to avoid orphaned title pages
        elif line_str.startswith('# '):
            text = processed_text[2:]
            story.append(Paragraph(text, h2_style))
            
        # Bullet list items (- or *)
        elif line_str.startswith('- ') or line_str.startswith('* '):
            text = processed_text[2:]
            bullet_text = f"&bull;&nbsp;&nbsp;{text}"
            story.append(Paragraph(bullet_text, bullet_style))
            
        # Normal paragraphs
        else:
            story.append(Paragraph(processed_text, body_style))
            
    # Build document
    doc.build(
        story, 
        onFirstPage=draw_page_decorations, 
        onLaterPages=draw_page_decorations
    )
    
    buffer.seek(0)
    return buffer
