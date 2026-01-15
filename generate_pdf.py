#!/usr/bin/env python3
"""
Generate PDF from Database Documentation Markdown
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.lib import colors
import re

def parse_markdown_to_pdf(md_file, pdf_file):
    """Convert markdown documentation to formatted PDF"""
    
    # Read markdown file
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Create PDF
    doc = SimpleDocTemplate(pdf_file, pagesize=A4, 
                           rightMargin=0.5*inch, leftMargin=0.5*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=12,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold',
        borderPadding=5,
        backColor=colors.HexColor('#ecf0f1')
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#5d6d7e'),
        spaceAfter=8,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.black,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    code_style = ParagraphStyle(
        'CodeBlock',
        parent=styles['Code'],
        fontSize=8,
        fontName='Courier',
        textColor=colors.HexColor('#c0392b'),
        backColor=colors.HexColor('#f4f4f4'),
        borderPadding=5,
        leftIndent=10
    )
    
    # Story to hold content
    story = []
    
    # Parse markdown line by line
    lines = content.split('\n')
    i = 0
    table_buffer = []
    in_code_block = False
    code_buffer = []
    
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip horizontal rules
        if line.startswith('---'):
            story.append(Spacer(1, 0.2*inch))
            i += 1
            continue
        
        # Handle code blocks
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_buffer = []
            else:
                in_code_block = False
                if code_buffer:
                    code_text = '<br/>'.join(code_buffer)
                    story.append(Paragraph(code_text, code_style))
                    story.append(Spacer(1, 0.1*inch))
            i += 1
            continue
        
        if in_code_block:
            code_buffer.append(line.replace('<', '&lt;').replace('>', '&gt;'))
            i += 1
            continue
        
        # Handle tables
        if '|' in line and line.count('|') >= 2:
            table_buffer.append(line)
            i += 1
            # Check if next line is separator or another row
            while i < len(lines) and '|' in lines[i]:
                table_buffer.append(lines[i].strip())
                i += 1
            
            # Process table
            if table_buffer:
                table_data = []
                for row in table_buffer:
                    if row.startswith('|--') or '---' in row:
                        continue
                    cells = [cell.strip() for cell in row.split('|')[1:-1]]
                    if cells:
                        table_data.append(cells)
                
                if table_data:
                    # Create table
                    t = Table(table_data, repeatRows=1)
                    t.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498db')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, 0), 10),
                        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                        ('GRID', (0, 0), (-1, -1), 1, colors.black),
                        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                        ('FONTSIZE', (0, 1), (-1, -1), 9),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
                    ]))
                    story.append(t)
                    story.append(Spacer(1, 0.15*inch))
                table_buffer = []
            continue
        
        # Handle headings
        if line.startswith('# ') and not line.startswith('## '):
            text = line[2:].strip()
            if 'Fleet Operations Platform' in text:
                story.append(Paragraph(text, title_style))
            else:
                story.append(Paragraph(text, heading1_style))
            story.append(Spacer(1, 0.1*inch))
        elif line.startswith('## '):
            text = line[3:].strip()
            story.append(Paragraph(text, heading1_style))
            story.append(Spacer(1, 0.1*inch))
        elif line.startswith('### '):
            text = line[4:].strip()
            story.append(Paragraph(text, heading2_style))
            story.append(Spacer(1, 0.08*inch))
        elif line.startswith('#### '):
            text = line[5:].strip()
            story.append(Paragraph(text, heading3_style))
            story.append(Spacer(1, 0.06*inch))
        # Handle bold text
        elif line.startswith('**') and line.endswith('**'):
            text = line[2:-2]
            story.append(Paragraph(f'<b>{text}</b>', body_style))
        # Handle bullet points
        elif line.startswith('- ') or line.startswith('* '):
            text = line[2:].strip()
            # Convert markdown bold to HTML
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'`(.*?)`', r'<font face="Courier" color="#c0392b">\1</font>', text)
            story.append(Paragraph(f'• {text}', body_style))
        # Handle numbered lists
        elif re.match(r'^\d+\.', line):
            text = re.sub(r'^\d+\.\s*', '', line)
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'`(.*?)`', r'<font face="Courier" color="#c0392b">\1</font>', text)
            story.append(Paragraph(text, body_style))
        # Handle regular paragraphs
        elif line:
            text = line
            # Convert markdown formatting
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
            text = re.sub(r'`(.*?)`', r'<font face="Courier" color="#c0392b">\1</font>', text)
            story.append(Paragraph(text, body_style))
            story.append(Spacer(1, 0.08*inch))
        else:
            # Empty line
            story.append(Spacer(1, 0.08*inch))
        
        i += 1
    
    # Build PDF
    doc.build(story)
    print(f"✅ PDF generated successfully: {pdf_file}")

if __name__ == "__main__":
    parse_markdown_to_pdf('DATABASE_DOCUMENTATION.md', 'DATABASE_DOCUMENTATION.pdf')
