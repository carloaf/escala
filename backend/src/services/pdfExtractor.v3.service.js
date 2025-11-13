const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * PDF Extractor V3 - Improved multi-week parser with proper name handling
 * 
 * Key improvements:
 * - Handles names split across lines (ANDRIELLE / CUNHA)
 * - Processes each column (date) separately
 * - Properly merges continuation lines that don't start with rank
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
  const rankRegex = /^(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\s/i;
  
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
      
      // Collect raw personnel lines
      const personnelLines = [];
      let lineIdx = service.lineIndex + 1;
      
      while (lineIdx < lines.length && personnelLines.length < table.dates.length * 2) {
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
      
      // Merge continuation lines (lines that don't start with rank)
      const mergedLines = [];
      for (let i = 0; i < personnelLines.length; i++) {
        const line = personnelLines[i];
        const startsWithRank = line.match(rankRegex);
        
        if (!startsWithRank && mergedLines.length > 0) {
          // This is a continuation - merge with previous
          mergedLines[mergedLines.length - 1] += ' ' + line;
          console.log(`  [Juntando: "${line}" à linha anterior]`);
        } else {
          mergedLines.push(line);
        }
      }
      
      // Process each merged line as a date
      mergedLines.forEach((line, dateIdx) => {
        if (dateIdx >= table.dates.length) return;
        
        const currentDate = table.dates[dateIdx];
        
        // Split by rank to get multiple people
        const parts = line.split(/(?=(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\s)/i);
        
        parts.forEach(part => {
          part = part.trim();
          if (part.length < 3) return;
          
          const rankMatch = part.match(/^(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\s(.+)/i);
          
          if (rankMatch) {
            const rank = rankMatch[1];
            const name = rankMatch[2].trim();
            
            if (name.match(/^[A-ZÀ-Ú\s]{2,50}$/i) && !name.match(/\d/)) {
              rows.push({
                service: service.name,
                date: currentDate,
                time: null,
                name: name,
                military_id: null,
                rank: rank
              });
              
              const d = new Date(currentDate + 'T00:00:00');
              const formatted = d.toLocaleDateString('pt-BR');
              console.log(`  ${formatted}: ${rank} ${name}`);
            }
          }
        });
      });
      
      console.log();
    });
  });

  console.log(`\n=== TOTAL: ${rows.length} registros ===\n`);
  return rows;
}

module.exports = { extractFromPdf };
