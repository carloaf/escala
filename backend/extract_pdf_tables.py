#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Table Extractor using pdfplumber
Extracts military schedule tables with proper cell detection
"""
import sys
import json
import pdfplumber

def extract_tables_from_pdf(pdf_path):
    """
    Extract all tables from PDF file
    Returns structured data with service, date, rank, name
    """
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, 1):
            # Extract tables from this page
            tables = page.extract_tables()
            
            if not tables:
                continue
            
            # Process each table
            for table_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue
                
                # Print table structure for debugging
                # print(f"Page {page_num}, Table {table_idx + 1}:", file=sys.stderr)
                # print(f"  Rows: {len(table)}, Columns: {len(table[0]) if table else 0}", file=sys.stderr)
                
                # First, identify header rows
                # Look for "DATA" row and date row
                date_row_idx = None
                dates = []
                
                for i, row in enumerate(table[:5]):  # Check first 5 rows
                    if not row:
                        continue
                    
                    # Check if FIRST cell contains "DATA"
                    if row[0] and 'DATA' in str(row[0]).upper():
                        # This same row should contain dates in other columns
                        potential_dates = []
                        for cell in row[1:]:  # Skip first cell (DATA label)
                            if cell and '-' in str(cell):
                                # Looks like a date
                                potential_dates.append(str(cell).strip())
                        
                        if len(potential_dates) >= 5:  # At least 5 dates (typical week)
                            dates = potential_dates
                            date_row_idx = i
                            # print(f"  Found dates in row {i}: {len(dates)} dates", file=sys.stderr)
                            break
                
                if not dates:
                    # print(f"  WARNING: No dates found in table", file=sys.stderr)
                    continue
                
                # print(f"  Dates found: {dates}", file=sys.stderr)
                
                # Build a map of column index to date
                # Find which columns actually have dates
                date_row = table[date_row_idx]
                col_to_date = {}
                for col_idx, cell in enumerate(date_row[1:], start=1):  # Skip first column (DATA label)
                    if cell and str(cell).strip() and '-' in str(cell):
                        # This column has a date
                        col_to_date[col_idx] = str(cell).strip()
                
                # print(f"  Column to date mapping: {col_to_date}", file=sys.stderr)
                
                # Process service rows (after date row)
                if date_row_idx is None:
                    continue
                
                # First pass: merge continuation rows into main service rows
                merged_rows = []
                current_service_idx = None
                
                for row_idx in range(date_row_idx + 1, len(table)):
                    row = table[row_idx]
                    if not row or not any(row):
                        continue
                    
                    service_name = str(row[0]).strip() if row[0] else ""
                    service_name = ' '.join(service_name.split('\n'))
                    service_name = ' '.join(service_name.split())
                    
                    if service_name and service_name not in ['', 'None', 'DATA']:
                        # This is a new service row
                        merged_rows.append([service_name] + row[1:])
                        current_service_idx = len(merged_rows) - 1
                    elif current_service_idx is not None:
                        # This is a continuation row - merge data into current service
                        # For each column with data, append to the corresponding column in merged row
                        for col_idx in range(1, len(row)):
                            if row[col_idx] and str(row[col_idx]).strip() not in ['', 'None']:
                                # Append this data to the same column in the merged row
                                existing = merged_rows[current_service_idx][col_idx]
                                new_data = str(row[col_idx]).strip()
                                
                                if existing and str(existing).strip() not in ['', 'None']:
                                    # Merge: if existing ends with rank and new starts without rank, append
                                    merged_rows[current_service_idx][col_idx] = str(existing) + '\n' + new_data
                                else:
                                    merged_rows[current_service_idx][col_idx] = new_data
                
                # Second pass: process merged rows
                for merged_row in merged_rows:
                    service_name = merged_row[0]
                    
                    # print(f"  Processing service: {service_name}", file=sys.stderr)
                    
                    # Collect all people for this service row, grouped by date to detect duplicates
                    people_by_date = {}
                    
                    # Process each column that might have data
                    for col_idx in range(1, len(merged_row)):
                        cell_content = merged_row[col_idx]
                        
                        if not cell_content or str(cell_content).strip() in ['', 'None']:
                            # Empty cell
                            continue
                        
                        cell_text = str(cell_content).strip()
                        
                        # Find the date for this column
                        # First check if this column has a date
                        date_str = None
                        if col_idx in col_to_date:
                            date_str = col_to_date[col_idx]
                        else:
                            # Look for nearest date: prefer left (same row data), then closest overall
                            # First try left (data typically appears in same column or after date)
                            left_col = None
                            for check_col in range(col_idx - 1, 0, -1):
                                if check_col in col_to_date:
                                    left_col = check_col
                                    break
                            
                            # Then try right
                            right_col = None
                            for check_col in range(col_idx + 1, len(merged_row)):
                                if check_col in col_to_date:
                                    right_col = check_col
                                    break
                            
                            # Choose the closest one
                            if left_col and right_col:
                                left_dist = col_idx - left_col
                                right_dist = right_col - col_idx
                                # Prefer right if distances are equal (merged cells put data before date column)
                                date_str = col_to_date[right_col if right_dist <= left_dist else left_col]
                            elif left_col:
                                date_str = col_to_date[left_col]
                            elif right_col:
                                date_str = col_to_date[right_col]
                        
                        if not date_str:
                            continue
                        
                        # Extract people from cell
                        # Cell may contain multiple people (separated by newlines or multiple ranks)
                        people = extract_people_from_cell(cell_text)
                        
                        # Add to date group
                        converted_date = convert_date(date_str)
                        if converted_date not in people_by_date:
                            people_by_date[converted_date] = []
                        people_by_date[converted_date].extend(people)
                    
                    # Now add unique people for each date
                    for date, people_list in people_by_date.items():
                        # Remove duplicates based on rank + name
                        seen = set()
                        for person in people_list:
                            key = (person.get('rank'), person.get('name'))
                            if key not in seen:
                                seen.add(key)
                                results.append({
                                    'service': service_name,
                                    'date': date,
                                    'rank': person.get('rank'),
                                    'name': person.get('name'),
                                    'time': None,
                                    'military_id': None
                                })
    
    return results

def extract_people_from_cell(cell_text):
    """
    Extract individual people from a cell
    Handles multiple people in same cell
    """
    import re
    
    people = []
    
    # Ranks pattern
    rank_pattern = r'\b(GEN|CEL|TC|MAJ|CAP|1[ºo]\s?TEN|2[ºo]\s?TEN|ASP|ST|1[ºo]\s?SGT|2[ºo]\s?SGT|3[ºo]\s?SGT|CB|SD)\b'
    
    # Split by rank to get segments
    parts = re.split(f'({rank_pattern})', cell_text, flags=re.IGNORECASE)
    
    current_rank = None
    current_name = ""
    
    for part in parts:
        part = part.strip()
        if not part:
            continue
        
        # Check if this part is a rank
        if re.match(rank_pattern, part, re.IGNORECASE):
            # Save previous person if exists
            if current_rank and current_name:
                people.append({'rank': current_rank, 'name': current_name.strip()})
            
            # Start new person
            current_rank = part.upper().replace('O', 'º').replace('o', 'º')
            current_name = ""
        else:
            # This is a name part - replace newlines with spaces
            name_part = ' '.join(part.split('\n'))
            name_part = ' '.join(name_part.split())  # Normalize spaces
            current_name += " " + name_part
    
    # Don't forget last person
    if current_rank and current_name.strip():
        people.append({'rank': current_rank, 'name': current_name.strip()})
    
    return people

def convert_date(date_str):
    """
    Convert date from format like "29-out-25" to "2025-10-29"
    """
    import re
    
    month_map = {
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
        'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
        'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
    }
    
    match = re.match(r'(\d{1,2})-([a-z]{3})-(\d{2})', date_str.lower())
    if match:
        day = match.group(1).zfill(2)
        month = month_map.get(match.group(2), '01')
        year = '20' + match.group(3)
        return f"{year}-{month}-{day}"
    
    return date_str

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'PDF file path required'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        results = extract_tables_from_pdf(pdf_path)
        print(json.dumps(results, ensure_ascii=False, indent=2))
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)
