const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * PDF Extractor V5 - Column detection using leading spaces
 * 
 * Key insight: Empty cells in PDF tables leave leading spaces
 * By detecting the number of leading spaces, we can determine which column the data belongs to
 */
async function extractFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const rawText = data.text || '';

  console.log('PDF Text extracted, length:', rawText.length);

  // DON'T trim lines - we need to preserve leading spaces!
  const lines = rawText.split(/\r?\n/);

  console.log('Total lines:', lines.length);

  // Month abbreviation mapping
  const monthMap = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const dateRegex = /\b(\d{1,2}-(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)-\d{2})\b/gi;
  
  const servicePatterns = [
    'OFICIAL DE DIA', 'AUX OF DIA', 'ADJUNTO',
    'SGT DE DIA', 'CMT GDA', 'CB DA GDA'
  ];

  // Find all tables by looking for DATA markers
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('DATA')) {
      let dateText = '';
      for (let j = 1; j <= 3 && (i + j) < lines.length; j++) {
        dateText += ' ' + lines[i + j];
      }
      
      const dateMatches = dateText.match(dateRegex);
      if (dateMatches) {
        const dates = dateMatches.map(d => {
          const parts = d.toLowerCase().match(/(\d{1,2})-([a-z]{3})-(\d{2})/);
          if (parts) {
            const day = parts[1].padStart(2, '0');
            const month = monthMap[parts[2]] || '01';
            const year = '20' + parts[3];
            return `${year}-${month}-${day}`;
          }
          return d;
        });
        tables.push({
          startLine: i,
          dates: dates
        });
      }
    }
  }

  console.log(`\nTabelas encontradas: ${tables.length}`);
  tables.forEach((t, i) => {
    console.log(`  Tabela ${i+1}: ${t.dates[0]} a ${t.dates[t.dates.length-1]}`);
  });

  // Find all services
  const allServices = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('PREVISÃO') || line.includes('QUARTA-FEIRA') || line === 'DATA' || line.match(/^\d{1,2}-[a-z]{3}-\d{2}/i)) {
      continue;
    }
    
    for (const pattern of servicePatterns) {
      if (line.includes(pattern)) {
        let serviceName = line;
        
        // Check for complement on next line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          if (nextLine.match(/^(1ª|2ª)\s*(CIA|GDA)/i) || nextLine.match(/^(SUP|PRINCIPAL|PAIOL)$/i)) {
            serviceName += ' ' + nextLine;
            i++;
          }
        }
        
        allServices.push({
          name: serviceName,
          lineIndex: i
        });
        break;
      }
    }
  }

  console.log(`\nServiços encontrados: ${allServices.length}\n`);

  // Extract personnel
  const rows = [];

  tables.forEach((table, tableIdx) => {
    console.log(`--- TABELA ${tableIdx + 1} ---\n`);
    
    const tableServices = allServices.filter(s => 
      s.lineIndex > table.startLine && 
      (tableIdx + 1 >= tables.length || s.lineIndex < tables[tableIdx + 1].startLine)
    );

    tableServices.forEach(service => {
      console.log(`${service.name}:`);
      
      // Collect ALL lines until next service (don't limit to 7)
      const personnelLines = [];
      let lineIdx = service.lineIndex + 1;
      
      while (lineIdx < lines.length) {
        const line = lines[lineIdx];
        const trimmed = line.trim();
        
        // Stop if we hit another service
        let stopHere = false;
        for (const pattern of servicePatterns) {
          if (trimmed.includes(pattern)) { stopHere = true; break; }
        }
        if (stopHere) break;
        
        // Skip complement lines
        if (trimmed.match(/^(PRINCIPAL|PAIOL|SUP|1ª CIA|2ª CIA|DA GDA)$/i)) { 
          lineIdx++; 
          continue; 
        }
        if (trimmed.includes('QUARTA-FEIRA') || trimmed === 'DATA') { 
          lineIdx++; 
          continue; 
        }
        
        // Add line (even if empty/whitespace)
        personnelLines.push(line);
        lineIdx++;
        
        // Safety: don't collect too many lines
        if (personnelLines.length > 20) break;
      }
      
      // Now process these lines to extract exactly 7 cells (one per date)
      const cells = extractCellsFromLines(personnelLines, table.dates.length);
      
      cells.forEach((cell, dateIdx) => {
        if (dateIdx >= table.dates.length) return;
        
        const currentDate = table.dates[dateIdx];
        const people = extractPeopleFromCell(cell);
        
        if (people.length === 0) {
          console.log(`  ${formatDate(currentDate)}: [VAZIO]`);
        } else {
          people.forEach(person => {
            rows.push({
              service: service.name,
              date: currentDate,
              time: null,
              name: person.name,
              military_id: null,
              rank: person.rank
            });
            
            console.log(`  ${formatDate(currentDate)}: ${person.rank || '?'} ${person.name}`);
          });
        }
      });
      
      console.log();
    });
  });

  console.log(`\n=== TOTAL: ${rows.length} registros ===\n`);
  return rows;
}

/**
 * Extract 7 cells from personnel lines
 * Each cell may span multiple lines
 */
function extractCellsFromLines(lines, expectedCellCount = 7) {
  const cells = [];
  let currentCell = [];
  let cellCount = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Empty line might indicate cell boundary OR continuation
    if (trimmed === '') {
      if (currentCell.length > 0) {
        cells.push(currentCell.join(' '));
        currentCell = [];
        cellCount++;
      }
      // Add empty cell
      cells.push('');
      cellCount++;
    } else {
      // Line with content - check if it's a new cell or continuation
      // If line starts far from left (many spaces), might be continuation
      const leadingSpaces = line.match(/^ */)[0].length;
      
      if (leadingSpaces > 5 && currentCell.length === 0 && cellCount < expectedCellCount) {
        // Likely skipped cells - add empty ones
        const cellsToSkip = Math.floor(leadingSpaces / 10); // Rough estimate
        for (let i = 0; i < Math.min(cellsToSkip, expectedCellCount - cellCount); i++) {
          cells.push('');
          cellCount++;
        }
      }
      
      currentCell.push(trimmed);
    }
    
    if (cellCount >= expectedCellCount) break;
  }
  
  // Don't forget last cell
  if (currentCell.length > 0 && cellCount < expectedCellCount) {
    cells.push(currentCell.join(' '));
    cellCount++;
  }
  
  // Fill remaining cells with empty
  while (cells.length < expectedCellCount) {
    cells.push('');
  }
  
  return cells.slice(0, expectedCellCount);
}

/**
 * Extract people from a single cell's text
 */
function extractPeopleFromCell(cellText) {
  if (!cellText || cellText.trim() === '') return [];
  
  const people = [];
  const rankRegex = /\b(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\b/gi;
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  const regex = new RegExp(rankRegex.source, rankRegex.flags);
  while ((match = regex.exec(cellText)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = cellText.substring(lastIndex, match.index).trim();
      if (beforeText) parts.push({ type: 'name', text: beforeText });
    }
    parts.push({ type: 'rank', text: match[0] });
    lastIndex = match.index + match[0].length;
  }
  
  if (lastIndex < cellText.length) {
    const remaining = cellText.substring(lastIndex).trim();
    if (remaining) parts.push({ type: 'name', text: remaining });
  }
  
  let currentPerson = null;
  
  parts.forEach(part => {
    if (part.type === 'rank') {
      if (currentPerson && currentPerson.name) {
        people.push(currentPerson);
      }
      currentPerson = { rank: part.text, name: '' };
    } else if (part.type === 'name') {
      if (currentPerson) {
        currentPerson.name += (currentPerson.name ? ' ' : '') + part.text;
      }
    }
  });
  
  if (currentPerson && currentPerson.name) {
    people.push(currentPerson);
  }
  
  return people;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR');
}

module.exports = { extractFromPdf };
