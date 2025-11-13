#!/usr/bin/env python3
import pdfplumber
import sys

pdf_path = sys.argv[1] if len(sys.argv) > 1 else '/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf'

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    
    print("=== PRIMEIRA TABELA DA PÁGINA 1 ===\n")
    tables = page.extract_tables()
    
    if tables:
        table = tables[0]
        print(f"Linhas: {len(table)}, Colunas: {len(table[0]) if table else 0}\n")
        
        # Mostrar primeiras 10 linhas
        for i, row in enumerate(table[:10]):
            print(f"Linha {i}: {row}")
