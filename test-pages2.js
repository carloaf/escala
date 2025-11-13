const PDFExtract = require('pdf.js-extract').PDFExtract;
const pdfExtract = new PDFExtract();

async function test() {
  const data = await pdfExtract.extract('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf', {});
  
  console.log(`Total de páginas: ${data.pages.length}\n`);
  
  data.pages.forEach((page, idx) => {
    console.log(`\n=== PÁGINA ${idx + 1} ===`);
    
    // Find elements with "29-out" or "DATA"
    const interesting = page.content.filter(e => 
      e.str.includes('DATA') || e.str.includes('29-out') || e.str.includes('OFICIAL')
    );
    
    console.log(`Elementos interessantes: ${interesting.length}`);
    interesting.slice(0, 15).forEach(e => {
      console.log(`  x=${e.x.toFixed(1)} y=${e.y.toFixed(1)} |${e.str}|`);
    });
  });
}

test().catch(console.error);
