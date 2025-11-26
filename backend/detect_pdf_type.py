#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Type Detector
Determines whether a PDF is a "Previsão da Escala" (table format) 
or "Boletim Interno" (text format)
"""
import sys
import json
import pdfplumber

def detect_pdf_type(pdf_path):
    """
    Detect the type of PDF
    Returns: 'previsao' or 'boletim_interno'
    """
    with pdfplumber.open(pdf_path) as pdf:
        # Extract text from first 2 pages
        text = ""
        for page in pdf.pages[:2]:
            text += page.extract_text() + "\n"
        
        text_lower = text.lower()
        
        # Check for Boletim Interno markers
        boletim_markers = [
            'boletim interno',
            'serviços diários',
            '1ª parte',
            '2ª parte',
            'instrução'
        ]
        
        boletim_score = sum(1 for marker in boletim_markers if marker in text_lower)
        
        # Check for Previsão markers
        previsao_markers = [
            'previsão',
            'escala de serviço',
            'data',  # Date headers in table
        ]
        
        # Also check if there are tables
        has_tables = False
        for page in pdf.pages[:2]:
            tables = page.extract_tables()
            if tables and len(tables) > 0:
                has_tables = True
                break
        
        previsao_score = sum(1 for marker in previsao_markers if marker in text_lower)
        if has_tables:
            previsao_score += 2  # Tables are strong indicator
        
        # Decide based on scores
        if boletim_score >= 3:
            return 'boletim_interno'
        elif previsao_score >= 2 or has_tables:
            return 'previsao'
        else:
            # Default to previsao (original format)
            return 'previsao'

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'PDF file path required'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        pdf_type = detect_pdf_type(pdf_path)
        print(json.dumps({'type': pdf_type}))
    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'traceback': traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)
