const PDFParser = require('pdf2json');

async function test() {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', errData => {
      console.error('Erro:', errData.parserError);
      reject(errData.parserError);
    });
    
    pdfParser.on('pdfParser_dataReady', pdfData => {
      console.log('PDF parseado com sucesso!\n');
      console.log(`Total de páginas: ${pdfData.Pages.length}\n`);
      
      // Página 1
      const page1 = pdfData.Pages[0];
      console.log(`=== PÁGINA 1 ===`);
      console.log(`Campos de formulário: ${page1.Fields ? page1.Fields.length : 0}`);
      console.log(`Textos: ${page1.Texts.length}`);
      
      // Mostrar primeiros 30 textos com coordenadas
      console.log('\nPrimeiros 30 textos:');
      page1.Texts.slice(0, 30).forEach((text, idx) => {
        const decoded = decodeURIComponent(text.R[0].T);
        console.log(`[${idx}] x=${text.x.toFixed(2)} y=${text.y.toFixed(2)} |${decoded}|`);
      });
      
      // Página 2  
      if (pdfData.Pages.length > 1) {
        const page2 = pdfData.Pages[1];
        console.log(`\n=== PÁGINA 2 ===`);
        console.log(`Textos: ${page2.Texts.length}`);
        
        // Procurar por "OFICIAL DE DIA"
        const oficialIdx = page2.Texts.findIndex(t => 
          decodeURIComponent(t.R[0].T).includes('OFICIAL')
        );
        
        if (oficialIdx >= 0) {
          console.log(`\nTextos próximos a OFICIAL DE DIA:`);
          for (let i = oficialIdx; i < Math.min(oficialIdx + 20, page2.Texts.length); i++) {
            const text = page2.Texts[i];
            const decoded = decodeURIComponent(text.R[0].T);
            console.log(`[${i}] x=${text.x.toFixed(2)} y=${text.y.toFixed(2)} |${decoded}|`);
          }
        }
      }
      
      resolve();
    });
    
    pdfParser.loadPDF('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  });
}

test().catch(console.error);
