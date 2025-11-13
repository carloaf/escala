const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

async function test() {
  console.log('Extraindo PDF com metadados...\n');
  
  const data = await pdfExtract.extract('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf', {});
  
  console.log(`Total de páginas: ${data.pages.length}\n`);
  
  // Pegar primeira página
  const page = data.pages[0];
  console.log(`Página 1 tem ${page.content.length} elementos de texto\n`);
  
  // Procurar por "ADJUNTO" e mostrar elementos próximos
  let adjuntoIdx = -1;
  for (let i = 0; i < page.content.length; i++) {
    if (page.content[i].str.includes('ADJUNTO')) {
      adjuntoIdx = i;
      break;
    }
  }
  
  if (adjuntoIdx >= 0) {
    console.log('=== Elementos próximos ao ADJUNTO (com metadados) ===\n');
    
    for (let i = adjuntoIdx; i < Math.min(adjuntoIdx + 20, page.content.length); i++) {
      const elem = page.content[i];
      console.log(`[${i}] x=${elem.x.toFixed(1)} y=${elem.y.toFixed(1)} |${elem.str}|`);
      
      // Check for strikethrough or other formatting
      if (elem.fontName) console.log(`     font=${elem.fontName}`);
      if (elem.transform) console.log(`     transform=${JSON.stringify(elem.transform)}`);
      
      // Look for any property that might indicate strikethrough
      const keys = Object.keys(elem);
      const unusualKeys = keys.filter(k => !['str', 'dir', 'width', 'height', 'transform', 'fontName', 'x', 'y'].includes(k));
      if (unusualKeys.length > 0) {
        console.log(`     other: ${JSON.stringify(unusualKeys.map(k => `${k}=${elem[k]}`))}`);
      }
      console.log();
    }
  }
}

test().catch(console.error);
