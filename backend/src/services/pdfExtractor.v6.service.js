const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

/**
 * PDF Extractor V6 - Position-based extraction using X/Y coordinates
 * 
 * Key insight: pdf.js-extract preserves X/Y coordinates of text elements
 * We can use X position to determine which column (date) the text belongs to
 */
async function extractFromPdf(filePath) {
  console.log('Extraindo PDF com coordenadas...');
  
  const data = await pdfExtract.extract(filePath, {});
  
  if (!data || !data.pages || data.pages.length === 0) {
    throw new Error('Failed to extract PDF data');
  }

  // Month abbreviation mapping
  const monthMap = {
    'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
    'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
    'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
  };

  const dateRegex = /\b(\d{1,2}-(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)-\d{2})\b/gi;
  const rankRegex = /\b(GEN|CEL|TC|MAJ|CAP|1º\s?TEN|2º\s?TEN|ASP|ST|1º\s?SGT|2º\s?SGT|3º\s?SGT|CB|SD)\b/i;
  
  const servicePatterns = [
    'OFICIAL DE DIA', 'AUX OF DIA', 'ADJUNTO',
    'SGT DE DIA', 'CMT GDA', 'CB DA GDA'
  ];

  const rows = [];
  let tableCount = 0;
  
  // First pass: Find all tables (DATA + dates) across all pages
  const tables = [];
  
  for (const page of data.pages) {
    if (page.content.length === 0) continue;
    
    const elements = page.content;
    
    for (let i = 0; i < elements.length; i++) {
      const elem = elements[i];
      
      // Look for "DATA" marker
      if (elem.str.trim() === 'DATA') {
        // Collect dates from next elements
        // Dates might be split across elements like "29" "-" "out" "-" "25"
        const dateTexts = [];
        const datePositions = [];
        
        let j = i + 1;
        let buffer = '';
        let bufferX = 0;
        
        while (j < Math.min(i + 50, elements.length)) {
          const el = elements[j];
          const str = el.str.trim();
          
          // Skip empty elements
          if (str === '' || str === ' ') {
            j++;
            continue;
          }
          
          // Check if this could be part of a date (number, dash, or month abbr)
          if (str.match(/^\d+$|^-$|^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)$/i)) {
            if (buffer === '') {
              bufferX = el.x; // Store X position of first element
            }
            buffer += str;
            j++;
            
            // Check if we have a complete date
            const match = buffer.match(dateRegex);
            if (match) {
              dateTexts.push(match[0]);
              datePositions.push(bufferX);
              buffer = '';
              bufferX = 0;
            }
          } else {
            // Not a date element, reset buffer
            if (buffer) {
              // Check one last time if buffer is a date
              const match = buffer.match(dateRegex);
              if (match) {
                dateTexts.push(match[0]);
                datePositions.push(bufferX);
              }
              buffer = '';
              bufferX = 0;
            }
            j++;
            
            // Stop if we've found enough dates or hit a service name
            if (dateTexts.length >= 7) break;
            let hitService = false;
            for (const sp of servicePatterns) {
              if (str.includes(sp)) {
                hitService = true;
                break;
              }
            }
            if (hitService) break;
          }
        }
        
        if (dateTexts.length > 0) {
          const dates = dateTexts.map(d => {
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
            dates: dates,
            columnXPositions: datePositions
          });
          
          tableCount++;
          console.log(`\nTabela ${tableCount}: ${dates[0]} a ${dates[dates.length - 1]}`);
          console.log(`Colunas X: ${datePositions.map(x => x.toFixed(0)).join(', ')}\n`);
        }
        break; // Only one DATA per page
      }
    }
  }
  
  if (tables.length === 0) {
    throw new Error('Nenhuma tabela encontrada no PDF');
  }

  // Second pass: Process services using the tables found
  // Collect ALL elements from ALL pages into a single flat list with page info
  const allElements = [];
  for (let pageIdx = 0; pageIdx < data.pages.length; pageIdx++) {
    const page = data.pages[pageIdx];
    if (page.content.length === 0) continue;
    
    page.content.forEach(elem => {
      allElements.push({
        ...elem,
        pageIdx: pageIdx
      });
    });
  }
  
  // Find DATA markers positions to determine which services belong to which table
  const dataMarkers = [];
  allElements.forEach((elem, idx) => {
    if (elem.str.trim() === 'DATA') {
      dataMarkers.push(idx);
    }
  });
  
  // Process each table's services
  for (let tableIdx = 0; tableIdx < tables.length; tableIdx++) {
    const currentTable = tables[tableIdx];
    const startIdx = dataMarkers[tableIdx] || 0;
    const endIdx = tableIdx + 1 < dataMarkers.length ? dataMarkers[tableIdx + 1] : allElements.length;
    
    // Process elements between this DATA and next DATA
    for (let i = startIdx; i < endIdx; i++) {
      const elem = allElements[i];
      
      // Look for service names
      let foundService = false;
      for (const pattern of servicePatterns) {
        if (!elem.str.includes(pattern)) continue;
        foundService = true;
        
        let serviceName = elem.str.trim();
        const serviceY = elem.y;
        
        // Check if next element is a complement (1ª CIA, SUP, etc.)
        if (i + 1 < elements.length) {
          const nextElem = elements[i + 1];
          if (Math.abs(nextElem.y - serviceY) < 20 && 
              nextElem.str.match(/^(1ª|2ª)\s*(CIA|GDA)|^(SUP|PRINCIPAL|PAIOL)$/i)) {
            serviceName += ' ' + nextElem.str.trim();
          }
        }
        
        console.log(`${serviceName}:`);
        
        // Collect all text elements below this service (within reasonable Y range)
        const personnelElements = [];
        const minY = serviceY;
        const maxY = serviceY + 60; // Adjust based on table height
        
        for (let j = i + 1; j < elements.length; j++) {
          const pElem = elements[j];
          
          // Stop if we hit another service
          let isAnotherService = false;
          for (const sp of servicePatterns) {
            if (pElem.str.includes(sp)) {
              isAnotherService = true;
              break;
            }
          }
          if (isAnotherService) break;
          
          // Check if element is in the Y range of this service's row
          if (pElem.y >= minY && pElem.y <= maxY) {
            // Skip complement lines
            if (pElem.str.match(/^(1ª|2ª)\s*(CIA|GDA)|^(SUP|PRINCIPAL|PAIOL)$/i)) continue;
            if (pElem.str.trim() === '') continue;
            
            personnelElements.push(pElem);
          }
        }
        
        // Group elements by column (X position)
        const cellsByColumn = groupByColumn(personnelElements, currentTable.columnXPositions);
        
        // Process each column
        cellsByColumn.forEach((cellElements, colIdx) => {
          if (colIdx >= currentTable.dates.length) return;
          
          if (colIdx >= currentTable.dates.length) return;
          
          const cellDate = currentTable.dates[colIdx];
          const cellText = cellElements.map(e => e.str.trim()).join(' ');
          
          if (!cellText || cellText.trim() === '') {
            console.log(`  ${formatDate(cellDate)}: [VAZIO]`);
            return;
          }
          
          // Extract people from cell text
          const people = extractPeopleFromCell(cellText);
          
          people.forEach(person => {
            rows.push({
              service: serviceName,
              date: cellDate,
              time: null,
              name: person.name,
              military_id: null,
              rank: person.rank
            });
            
            console.log(`  ${formatDate(cellDate)}: ${person.rank || '?'} ${person.name}`);
          });
        });
        
        console.log();
        break;
      }
    }
  }

  console.log(`\n=== TOTAL: ${rows.length} registros ===\n`);
  return rows;
}

/**
 * Group elements by column based on X position
 */
function groupByColumn(elements, columnXPositions) {
  const columns = Array(columnXPositions.length).fill(null).map(() => []);
  
  // Add a bit of tolerance (±30 pixels) for column detection
  const tolerance = 40;
  
  elements.forEach(elem => {
    let assigned = false;
    
    for (let i = 0; i < columnXPositions.length; i++) {
      const colX = columnXPositions[i];
      
      // Check if element's X is close to this column
      if (Math.abs(elem.x - colX) < tolerance) {
        columns[i].push(elem);
        assigned = true;
        break;
      }
      
      // For last column, also check if it's beyond the last position
      if (i === columnXPositions.length - 1 && elem.x > colX) {
        columns[i].push(elem);
        assigned = true;
        break;
      }
    }
    
    // If not assigned, try to find which column it's closest to
    if (!assigned) {
      let minDist = Infinity;
      let minIdx = 0;
      
      for (let i = 0; i < columnXPositions.length; i++) {
        const dist = Math.abs(elem.x - columnXPositions[i]);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      
      if (minDist < 100) { // Only assign if reasonably close
        columns[minIdx].push(elem);
      }
    }
  });
  
  return columns;
}

/**
 * Extract people from cell text
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
