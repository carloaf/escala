const fs = require('fs');
const pdf = require('pdf-parse');

/**
 * PDF extractor V2 - Multi-week table parser
 * 
 * Structure:
 * - Each table represents one week (7 days)
 * - Column 1: Service names (may span multiple lines)
 * - Columns 2-8: Military personnel assigned to each day
 * - Names may span multiple lines if no rank at start of next line
 * 
 * Example:
 * Week 1: 29-out-25 to 4-nov-25
 * Week 2: 5-nov-25 to 11-nov-25
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
  const rankRegex = /\b(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\b/gi;

  // Find all tables (each starts with DATA)
  const tables = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('DATA')) {
      // Collect dates from next 3 lines
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

  console.log(`\nTotal de tabelas encontradas: ${tables.length}`);
  tables.forEach((table, idx) => {
    console.log(`Tabela ${idx + 1}: ${table.dates.length} datas, linha ${table.startLine}`);
    console.log(`  Datas: ${table.dates[0]} a ${table.dates[table.dates.length - 1]}`);
  });

  // Known service patterns (first column)
  const servicePatterns = [
    'OFICIAL DE DIA',
    'AUX OF DIA',
    'ADJUNTO',
    'SGT DE DIA',
    'CMT GDA',
    'CB DA GDA'
  ];

  // Extract service names from first column
  const services = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines
    if (line.includes('PREVISÃO') || line.includes('QUARTA-FEIRA') || line === 'DATA' || line.match(/^\d{1,2}-[a-z]{3}-\d{2}/i)) {
      continue;
    }
    
    // Check if line is a service name
    let isService = false;
    for (const pattern of servicePatterns) {
      if (line.includes(pattern)) {
        isService = true;
        
        // Build complete service name (may span multiple lines)
        let serviceName = line;
        
        // Check if next line is a complement (like "1ª CIA SUP", "2ª CIA")
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          // If next line is a unit/complement and not a rank/name
          if (nextLine.match(/^(1ª|2ª)\s*(CIA|GDA)/i) || nextLine.match(/^(SUP|PRINCIPAL|PAIOL)$/i)) {
            serviceName += ' ' + nextLine;
            console.log(`  - Complemento encontrado: "${nextLine}" -> "${serviceName}"`);
            i++; // Skip next line as it's part of service name
          }
        }
        
        services.push({
          name: serviceName,
          lineIndex: i,
          startLine: i
        });
        
        console.log(`Serviço encontrado (linha ${i}): "${serviceName}"`);
        break;
      }
    }
  }

  console.log(`\nTotal de serviços encontrados: ${services.length}`);
  services.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.name} (linha ${s.lineIndex})`);
  });

  // Extract military personnel for all dates
  if (tables.length === 0) {
    console.log('No tables found, cannot extract personnel');
    return [];
  }

  console.log(`\n=== Extraindo militares de todas as tabelas ===\n`);

  const rows = [];

  // Process each table
  tables.forEach((table, tableIdx) => {
    console.log(`\n--- TABELA ${tableIdx + 1} (${table.dates[0]} a ${table.dates[table.dates.length - 1]}) ---\n`);
    
    // Find services in this table
    const tableServices = services.filter(s => 
      s.lineIndex > table.startLine && 
      (tableIdx + 1 >= tables.length || s.lineIndex < tables[tableIdx + 1].startLine)
    );

    tableServices.forEach(service => {
      const startLine = service.startLine;
      
      // Collect personnel lines for this service (one per date)
      const personnelLines = [];
      let lineIdx = startLine + 1;
      
      while (lineIdx < lines.length && personnelLines.length < table.dates.length) {
        const line = lines[lineIdx];
        
        // Stop if we hit another service
        let isNextService = false;
        for (const pattern of servicePatterns) {
          if (line.includes(pattern)) {
            isNextService = true;
            break;
          }
        }
        if (isNextService) break;
        
        // Skip complement lines
        if (line.match(/^(PRINCIPAL|PAIOL|SUP|1ª CIA|2ª CIA|DA GDA)$/i)) {
          lineIdx++;
          continue;
        }
        if (line.includes('QUARTA-FEIRA') || line.includes('DATA')) {
          lineIdx++;
          continue;
        }
        
        personnelLines.push(line);
        lineIdx++;
      }
      
      // Process each personnel line (corresponds to each date)
      personnelLines.forEach((personnelLine, dateIdx) => {
        if (dateIdx >= table.dates.length) return;
        
        const currentDate = table.dates[dateIdx];
        
        // Check if line looks like it's a continuation of previous name (no rank at start)
        let fullPersonnelLine = personnelLine;
        
        // If next line exists and doesn't start with rank, it might be continuation
        if (lineIdx < lines.length && dateIdx + 1 < personnelLines.length) {
          const nextLine = personnelLines[dateIdx + 1];
          const hasRankAtStart = nextLine.match(/^(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\s/i);
          
          if (!hasRankAtStart && nextLine.match(/^[A-ZÀ-Ú\s]+$/i)) {
            fullPersonnelLine += ' ' + nextLine;
            console.log(`    [Nome composto detectado: "${personnelLine}" + "${nextLine}"]`);
          }
        }
        
        // Split by rank to handle multiple people
        const peopleInLine = fullPersonnelLine.split(/(?=(?:GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\s)/i);
        
        let foundPersonnel = false;
        peopleInLine.forEach(person => {
          person = person.trim();
          if (!person || person.length < 3) return;
          
          // Extract rank
          const rankMatch = person.match(rankRegex);
          let rank = null;
          let name = person;
          
          if (rankMatch) {
            rank = rankMatch[0];
            name = person.replace(rankMatch[0], '').trim();
          }
          
          // Validate name
          if (name && name.match(/^[A-ZÀ-Ú\s]{2,50}$/i) && !name.match(/\d/)) {
            rows.push({
              service: service.name,
              date: currentDate,
              time: null,
              name: name,
              military_id: null,
              rank: rank
            });
            foundPersonnel = true;
            console.log(`  ${service.name} [${currentDate}]: ${rank || '?'} ${name}`);
          }
        });

        if (!foundPersonnel) {
          console.log(`  ${service.name} [${currentDate}]: [VAZIO]`);
        }
      });
    });
  });

  console.log(`\n=== Total extraído: ${rows.length} registros ===\n`);
  
  return rows;
}

module.exports = { extractFromPdf };
