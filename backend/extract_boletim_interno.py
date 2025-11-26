#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Boletim Interno PDF Extractor
Extracts service schedules from "Boletim Interno" format
Focuses on section between "1ª Parte SERVIÇOS DIÁRIOS" and "2ª Parte INSTRUÇÃO"
"""
import sys
import json
import re
import pdfplumber

def extract_from_boletim_interno(pdf_path):
    """
    Extract service schedules from Boletim Interno PDF
    Returns structured data with service, date, rank, name
    """
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        
        # Extract all text from PDF
        for page in pdf.pages:
            full_text += page.extract_text() + "\n"
        
        # Find the section between "SERVIÇOS DIÁRIOS" and "2ª Parte"
        idx_servicos = full_text.find('SERVIÇOS DIÁRIOS')
        idx_2parte = full_text.find('2ª Parte')
        
        if idx_servicos == -1:
            print("ERROR: 'SERVIÇOS DIÁRIOS' section not found", file=sys.stderr)
            return results
        
        if idx_2parte == -1:
            # If 2ª Parte not found, take until end
            idx_2parte = len(full_text)
        
        # Extract the relevant section
        section_text = full_text[idx_servicos:idx_2parte]
        
        print(f"Extracted section length: {len(section_text)} chars", file=sys.stderr)
        
        # Month name to number mapping (used throughout)
        month_map = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
            'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
            'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
        }
        
        # Extract the FIRST date from the section (will be updated as we find more dates)
        date_match = re.search(r'Para o dia (\d{1,2}) de (\w+) de (\d{4})', section_text)
        if not date_match:
            print("ERROR: Initial date not found in format 'Para o dia DD de MMMM de YYYY'", file=sys.stderr)
            return results
        
        day = date_match.group(1).zfill(2)
        month_name = date_match.group(2).lower()
        year = date_match.group(3)
        month = month_map.get(month_name, '01')
        schedule_date = f"{year}-{month}-{day}"
        
        print(f"Initial schedule date: {schedule_date}", file=sys.stderr)
        
        # Now extract service assignments
        # Two formats:
        # 1. "ServiceNameRankPersonName" (all in one line, e.g. "Oficial de Dia1° Ten Hayron")
        # 2. Group headers followed by people on separate lines:
        #    "Guardas ao Quartel"
        #    "Sd EV Lucas Vinicius"
        #    "Sd EV G Silva"
        
        lines = section_text.split('\n')
        
        # Headers to skip
        skip_lines = [
            'SERVIÇOS DIÁRIOS',
            'ESCALA DE SERVIÇO',
            'SERVIÇOS INTERNOS',
            '(Continuação',
            'Pag nº'
        ]
        
        # Company headers - track which company we're in
        # Sede = 1ª Cia Sup
        # 2ª Companhia de Suprimento = 2ª Cia Sup
        company_headers = {
            'Sede': '1ª Cia Sup',
            '2ª Companhia de Suprimento': '2ª Cia Sup'
        }
        
        # Group service headers (followed by list of people)
        group_services = ['Guardas ao Quartel', 'Plantões', 'Guarda aos Paióis']
        
        i = 0
        current_group_service = None
        current_company = '1ª Cia Sup'  # Default to 1ª Cia (Sede)
        last_non_plantoes_group = None  # Track last group before Plantões
        pending_people = []  # Buffer for people without service (will be assigned when group header found)
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Skip empty lines
            if not line:
                i += 1
                continue
            
            # Check for new date and UPDATE schedule_date
            if 'Para o dia' in line:
                date_match = re.search(r'Para o dia (\d{1,2}) de (\w+) de (\d{4})', line)
                if date_match:
                    day = date_match.group(1).zfill(2)
                    month_name = date_match.group(2).lower()
                    year = date_match.group(3)
                    month = month_map.get(month_name, '01')
                    schedule_date = f"{year}-{month}-{day}"
                    print(f"New date found: {schedule_date}", file=sys.stderr)
                i += 1
                continue
            
            # Check if this is a company header
            company_found = False
            for header, company in company_headers.items():
                if header in line:
                    current_company = company
                    company_found = True

                    break
            
            if company_found:
                i += 1
                continue
            
            # Skip specific headers
            skip = False
            for pattern in skip_lines:
                if pattern in line:
                    skip = True
                    break
            if skip:
                i += 1
                continue
            
            # Check if line contains a group service header
            # NOTE: Group service name appears VERTICALLY CENTERED in the middle of the people list
            # Example: 4 people BEFORE "Guardas ao Quartel", 1 ON SAME LINE, 4 AFTER = 9 total
            line_has_group_header = None
            for group_svc in group_services:
                if group_svc in line:
                    line_has_group_header = group_svc
                    current_group_service = group_svc
                    
                    # Update last non-Plantões group
                    if group_svc != 'Plantões':
                        last_non_plantoes_group = group_svc
                    
                    # Special handling for Plantões:
                    # - Plantões always has 3 people per Cia (multiple of 3)
                    # - Since name is centered, expect: 1 BEFORE header, 1 ON SAME LINE, 1 AFTER
                    # - But buffer might have people from previous service (Guarda aos Paióis)
                    # - Solution: take only LAST 1 from buffer for "before header" person
                    if group_svc == 'Plantões' and len(pending_people) > 0:
                        # Assign all but last to previous group (Guarda aos Paióis)
                        if len(pending_people) > 1:
                            prev_group = last_non_plantoes_group if last_non_plantoes_group else 'Guardas ao Quartel'
                            for pending_rank, pending_name in pending_people[:-1]:
                                service_with_company = f"{prev_group} {current_company}"
                                results.append({
                                    'service': service_with_company,
                                    'date': schedule_date,
                                    'rank': pending_rank,
                                    'name': pending_name,
                                    'time': None,
                                    'military_id': None
                                })
                        
                        # Take only last person for "before header" of Plantões
                        pending_rank, pending_name = pending_people[-1]
                        service_with_company = f"{group_svc} {current_company}"
                        results.append({
                            'service': service_with_company,
                            'date': schedule_date,
                            'rank': pending_rank,
                            'name': pending_name,
                            'time': None,
                            'military_id': None
                        })
                    else:
                        # For other groups (Guardas ao Quartel, Guarda aos Paióis):
                        # ALL pending people belong to this group (appeared BEFORE the vertically centered header)
                        for pending_rank, pending_name in pending_people:
                            service_with_company = f"{group_svc} {current_company}"
                            results.append({
                                'service': service_with_company,
                                'date': schedule_date,
                                'rank': pending_rank,
                                'name': pending_name,
                                'time': None,
                                'military_id': None
                            })

                    # Clear pending buffer
                    pending_people = []
                    
                    # Now we need to continue reading people AFTER this header
                    # They also belong to this group until we find another group or service
                    break
            
            # If this line ONLY contains the group header (no rank/name), skip it
            if line_has_group_header and line.strip() == line_has_group_header:
                i += 1
                continue
            
            # If line has group header AND rank/name, we still need to process the person on this line
            # Continue processing below...
            
            # Rank pattern - more specific patterns FIRST (Sd EP/EV before just Sd)
            # Use word boundaries to avoid matching "st" in "Motorista" or "EV" in "GustaVO"
            # Important: Try to find the LAST occurrence of rank in line (rightmost)
            # because service names can contain rank-like words (e.g., "Cb da Guarda")
            rank_pattern = r'\b(1[ºo°]\s*Ten|2[ºo°]\s*Ten|1[ºo°]\s*Sgt|2[ºo°]\s*Sgt|3[ºo°]\s*Sgt|Sd\s+EP|Sd\s+EV|GEN|CEL|TC|MAJ|CAP|ASP|ST|Cb)\b'
            
            # Find ALL matches and use the last one (rightmost)
            matches = list(re.finditer(rank_pattern, line, re.IGNORECASE))
            match = matches[-1] if matches else None
            
            if match:
                rank_start = match.start()
                rank_end = match.end()
                service_name = line[:rank_start].strip()
                rank = match.group(1)
                # Name is everything after the rank match
                name = line[rank_end:].strip()
                
                # If no service name
                if not service_name:
                    # Check if we JUST found a group header on this line
                    if line_has_group_header:
                        # This line has the group header, so person belongs to this group
                        service_name = line_has_group_header
                    else:
                        # No service - look ahead to see if next group is DIFFERENT from current
                        # If next group is different, add to pending buffer
                        # Otherwise, use current_group_service
                        found_next_group = None
                        for lookahead in range(1, min(5, len(lines) - i)):
                            next_line = lines[i + lookahead].strip()
                            for group_svc in group_services:
                                if group_svc in next_line:
                                    found_next_group = group_svc
                                    break
                            if found_next_group:
                                break
                        
                        # If next group is different from current, this person is in transition
                        if found_next_group and found_next_group != current_group_service:
                            # Add to pending buffer for next group
                            rank_normalized = normalize_rank(rank)
                            name_cleaned = re.sub(r'[^a-zA-ZÀ-ÿ\s]', '', name)
                            name_cleaned = ' '.join(name_cleaned.split()).upper()
                            if len(name_cleaned) > 1:
                                pending_people.append((rank_normalized, name_cleaned))
                            i += 1
                            continue
                        elif current_group_service:
                            # Same group or no next group found - use current
                            service_name = current_group_service
                        else:
                            # No current group - skip
                            i += 1
                            continue
                
                # Reset current_group_service if this is not a group service
                if service_name and service_name not in group_services:
                    current_group_service = None
                
                # Normalize rank format
                rank = normalize_rank(rank)
                
                # Clean service name
                service_name = ' '.join(service_name.split())
                
                # Clean name: keep only letters, spaces, and accents
                name = re.sub(r'[^a-zA-ZÀ-ÿ\s]', '', name)
                name = ' '.join(name.split())
                name = name.upper()
                
                # Skip if name is too short or empty
                if len(name) > 1 and service_name:
                    # Services that should NOT have company suffix
                    services_without_company = [
                        'Oficial de Dia',
                        'Adj Oficial de Dia',
                        'Motorista de Dia',
                        'Cinófilo de Dia'
                    ]
                    
                    # Add company suffix to service name (WITHOUT parentheses)
                    if service_name in services_without_company:
                        # These services don't need company suffix
                        service_with_company = service_name
                    elif 'Cia Sup' in service_name:
                        # Service already has Cia Sup in name, don't add again
                        service_with_company = service_name
                    elif current_company:
                        # Add company WITHOUT parentheses: "Service Name 1ª Cia Sup"
                        service_with_company = f"{service_name} {current_company}"
                    else:
                        service_with_company = service_name
                    
                    results.append({
                        'service': service_with_company,
                        'date': schedule_date,
                        'rank': rank,
                        'name': name,
                        'time': None,
                        'military_id': None
                    })
                    

            
            i += 1
    
    print(f"\nTotal extracted: {len(results)} records", file=sys.stderr)
    return results

def normalize_rank(rank):
    """
    Normalize rank format to standard format
    """
    rank = rank.upper()
    rank = rank.replace('O', 'º').replace('°', 'º')
    
    # Normalize spacing
    rank = re.sub(r'(\d)[ºo°]\s*(TEN|SGT)', r'\1º \2', rank, flags=re.IGNORECASE)
    
    # Fix SD EP/EV format
    rank = re.sub(r'SD\s+E([PV])', r'Sd E\1', rank, flags=re.IGNORECASE)
    
    # Capitalize properly
    parts = rank.split()
    if len(parts) > 1:
        # First part stays as is, second part capitalize first letter only
        rank = parts[0] + ' ' + parts[1].capitalize()
    
    return rank

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'PDF file path required'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        results = extract_from_boletim_interno(pdf_path)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    except Exception as e:
        import traceback
        print(json.dumps({'error': str(e), 'traceback': traceback.format_exc()}), file=sys.stderr)
        sys.exit(1)
