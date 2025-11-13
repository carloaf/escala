const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

async function test() {
  const data = await pdfExtract.extract('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf', {});
  
  console.log(`Total de páginas: ${data.pages.length}\n`);
  
  data.pages.forEach((page, idx) => {
    console.log(`\n=== PÁGINA ${idx + 1} ===`);
    console.log(`Total de elementos: ${page.content.length}`);
    
    // Find DATA markers
    const dataElements = page.content.filter(e => e.str.trim() === 'DATA');
    console.log(`Marcadores "DATA" encontrados: ${dataElements.length}`);
    
    dataElements.forEach((elem, i) => {
      console.log(`  DATA ${i+1} em Y=${elem.y.toFixed(1)}`);
    });
  });
}

test().catch(console.error);
