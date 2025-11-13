const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

async function test() {
  const data = await pdfExtract.extract('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf', {});
  
  const dateRegex = /\b(\d{1,2}-(?:jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)-\d{2})\b/gi;
  
  console.log('=== Procurando datas no PDF ===\n');
  
  data.pages.forEach((page, pageIdx) => {
    console.log(`Página ${pageIdx + 1}:`);
    
    page.content.forEach((elem, idx) => {
      const match = elem.str.match(dateRegex);
      if (match) {
        console.log(`  [${idx}] |${elem.str}| -> ${match[0]}`);
      }
    });
  });
}

test().catch(console.error);
