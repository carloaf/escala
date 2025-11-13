const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * PDF Extractor V4 - Cell-based parser with improved multi-person detection
 * 
 * Key insight: Each line after a service name represents ONE DATE (column)
 * But a line may contain MULTIPLE PEOPLE for that date
 * 
 * Strategy:
 * 1. Count how many ranks are in each line
 * 2. Each rank+name = one person for that date
 * 3. Words without rank before them are continuation of previous name
 */
async function extractFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  const text = data.text || '';

  console.log('PDF Text extracted, length:', text.length);

  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  console.log('Total lines:', lines.length);

  // Month abbreviation mapping
  const monthMap = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const dateRegex = /\b(\d{1,2}-(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)-\d{2})\b/gi;
  const rankRegex = /(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)(\s+)/gi;
  
  const servicePatterns = [
    'OFICIAL DE DIA', 'AUX OF DIA', 'ADJUNTO',
    'SGT DE DIA', 'CMT GDA', 'CB DA GDA'
  ];

  // Find all tables
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('DATA')) {
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
    const line = lines[i];
    if (line.includes('PREVISÃO') || line.includes('QUARTA-FEIRA') || line === 'DATA' || line.match(/^\d{1,2}-[a-z]{3}-\d{2}/i)) {
      continue;
    }
    
    for (const pattern of servicePatterns) {
      if (line.includes(pattern)) {
        let serviceName = line;
        
        // Check for complement
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
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
    
    // Services in this table
    const tableServices = allServices.filter(s => 
      s.lineIndex > table.startLine && 
      (tableIdx + 1 >= tables.length || s.lineIndex < tables[tableIdx + 1].startLine)
    );

    tableServices.forEach(service => {
      console.log(`${service.name}:`);
      
      // Collect personnel lines for this service
      const personnelLines = [];
      let lineIdx = service.lineIndex + 1;
      
      while (lineIdx < lines.length && personnelLines.length < table.dates.length) {
        const line = lines[lineIdx];
        
        // Stop conditions
        let stopHere = false;
        for (const pattern of servicePatterns) {
          if (line.includes(pattern)) { stopHere = true; break; }
        }
        if (stopHere) break;
        if (line.match(/^(PRINCIPAL|PAIOL|SUP|1ª CIA|2ª CIA|DA GDA)$/i)) { lineIdx++; continue; }
        if (line.includes('QUARTA-FEIRA') || line === 'DATA') { lineIdx++; continue; }
        
        personnelLines.push(line);
        lineIdx++;
        
        if (personnelLines.length >= table.dates.length) break;
      }
      
      // NEW APPROACH: Process each line as ONE DATE, but extract ALL people in that line
      // Also handle continuation names from previous line
      let pendingNameFromPreviousLine = '';
      let lastRowIndex = -1;
      
      personnelLines.forEach((line, dateIdx) => {
        if (dateIdx >= table.dates.length) return;
        
        const currentDate = table.dates[dateIdx];
        
        // Extract all people from this line (one line = one date/column)
        const result = extractPeopleFromLine(line, pendingNameFromPreviousLine);
        const people = result.people;
        pendingNameFromPreviousLine = result.continuation;
        
        if (people.length === 0) {
          console.log(`  ${currentDate}: [VAZIO]`);
        } else {
          people.forEach(person => {
            if (person.fromPreviousLine && lastRowIndex >= 0) {
              // This person completes the previous line's person
              // Update the last row instead of creating new one
              rows[lastRowIndex].name = person.name;
              console.log(`    -> Completado: ${rows[lastRowIndex].rank} ${person.name}`);
            } else {
              // New person for this date
              rows.push({
                service: service.name,
                date: currentDate,
                time: null,
                name: person.name,
                military_id: null,
                rank: person.rank || person.rank
              });
              lastRowIndex = rows.length - 1;
              
              const d = new Date(currentDate + 'T00:00:00');
              const formatted = d.toLocaleDateString('pt-BR');
              console.log(`  ${formatted}: ${person.rank || '?'} ${person.name}`);
            }
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
 * Extract all people from a single line (one cell/date)
 * Handles cases like: 
 * - "1º TEN RIOS" -> one person
 * - "JARDIM 1º TEN COQUEIRO 1º TEN HAYRON" -> JARDIM belongs to previous line, COQUEIRO and HAYRON are this line
 * - "CUNHA 2º TEN AUGUSTO" -> CUNHA belongs to previous line, AUGUSTO is this line
 * - "2º TEN ANDRIELLE" + next line "CUNHA" -> ANDRIELLE CUNHA
 * 
 * @param {string} line - The line to parse
 * @param {string} pendingNameFromPreviousLine - Name fragment from previous line that needs completion
 * @returns {object} - { people: [...], continuation: string }
 */
function extractPeopleFromLine(line, pendingNameFromPreviousLine = '') {
  const people = [];
  const rankRegex = /\b(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\b/gi;
  
  // Split by rank positions to get segments
  const segments = [];
  let lastIndex = 0;
  let match;
  
  const regex = new RegExp(rankRegex.source, rankRegex.flags);
  while ((match = regex.exec(line)) !== null) {
    // Text before this rank
    if (match.index > lastIndex) {
      const beforeText = line.substring(lastIndex, match.index).trim();
      if (beforeText) {
        segments.push({ type: 'name', text: beforeText, index: lastIndex, beforeRank: true });
      }
    }
    // The rank itself
    segments.push({ type: 'rank', text: match[0], index: match.index });
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining text after last rank
  if (lastIndex < line.length) {
    const remaining = line.substring(lastIndex).trim();
    if (remaining) {
      segments.push({ type: 'name', text: remaining, index: lastIndex, beforeRank: false });
    }
  }
  
  // Handle name from previous line (if exists)
  let completedPreviousPerson = null;
  if (pendingNameFromPreviousLine && segments.length > 0 && segments[0].type === 'name' && segments[0].beforeRank) {
    // First segment is a name before any rank - it completes the previous line's person
    completedPreviousPerson = {
      rank: null, // Rank was already captured in previous line
      name: pendingNameFromPreviousLine + ' ' + segments[0].text,
      fromPreviousLine: true
    };
    segments.shift(); // Remove this segment, it's been used
  }
  
  // Check if last segment is a name after a rank - it might need continuation on next line
  let continuationForNextLine = '';
  if (segments.length > 0) {
    const lastSeg = segments[segments.length - 1];
    if (lastSeg.type === 'name' && !lastSeg.beforeRank) {
      // This name comes after a rank, might be incomplete
      // Keep it for now, we'll decide at the end
    }
  }
  
  // Build people from segments
  let currentPerson = null;
  
  segments.forEach((seg, idx) => {
    if (seg.type === 'rank') {
      // Save previous person if exists
      if (currentPerson && currentPerson.name) {
        if (isValidName(currentPerson.name)) {
          people.push(currentPerson);
        }
      }
      // Start new person
      currentPerson = { rank: seg.text, name: '' };
    } else if (seg.type === 'name') {
      if (currentPerson) {
        // Add name to current person (after their rank)
        currentPerson.name += (currentPerson.name ? ' ' : '') + seg.text;
      }
      // If no current person and name is before first rank, it was already handled above
    }
  });
  
  // Check if last person's name looks incomplete (single word, common pattern for split names)
  if (currentPerson && currentPerson.name && isValidName(currentPerson.name)) {
    const nameParts = currentPerson.name.trim().split(/\s+/);
    if (nameParts.length === 1 && currentPerson.name.length >= 3) {
      // Single word name, might continue on next line
      // Examples: "ANDRIELLE", "FERNANDA", "STEPHANE"
      continuationForNextLine = currentPerson.name;
      currentPerson.needsContinuation = true;
    }
    people.push(currentPerson);
  }
  
  return {
    people: completedPreviousPerson ? [completedPreviousPerson, ...people] : people,
    continuation: continuationForNextLine
  };
}

function isValidName(name) {
  name = name.trim();
  // Must have letters, not too short, no numbers, not labels
  if (name.length < 2) return false;
  if (!name.match(/[A-ZÀ-Ú]/i)) return false;
  if (name.match(/\d/)) return false;
  if (name.match(/^(PRINCIPAL|PAIOL|SUP|1ª|2ª|CIA|GDA|DA)$/i)) return false;
  return true;
}

module.exports = { extractFromPdf };
