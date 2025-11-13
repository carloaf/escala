const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

async function test() {
  const data = await pdfExtract.extract('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf', {});
  
  const page1 = data.pages[0];
  
  console.log('=== PÁGINA 1 - Primeiros 50 elementos ===\n');
  
  for (let i = 0; i < Math.min(50, page1.content.length); i++) {
    const e = page1.content[i];
    console.log(`[${i}] x=${e.x.toFixed(1)} y=${e.y.toFixed(1)} |${e.str}|`);
  }
}

test().catch(console.error);
