const { extractFromPdf } = require('./src/services/pdfExtractor.v6.service');

async function test() {
  console.log('Testando extração V4...\n');
  const rows = await extractFromPdf('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  
  console.log('\nVerificando OFICIAL DE DIA entre 30/10 e 04/11:');
  const oficialDia = rows.filter(r => 
    r.service.includes('OFICIAL DE DIA') && 
    r.date >= '2025-10-30' && 
    r.date <= '2025-11-04'
  );
  
  oficialDia.forEach(r => {
    const d = new Date(r.date + 'T00:00:00');
    const formatted = d.toLocaleDateString('pt-BR');
    console.log(`  ${formatted}: ${r.rank} ${r.name}`);
  });
  
  console.log(`\nTotal OFICIAL DE DIA neste período: ${oficialDia.length} pessoas`);
}

test().catch(console.error);
