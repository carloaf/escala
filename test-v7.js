const { extractFromPdf } = require('./src/services/pdfExtractor.v7.service');

async function test() {
  console.log('=== Testando extração V7 com pdfplumber ===\n');
  
  try {
    const rows = await extractFromPdf('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
    
    console.log('\n=== Verificando OFICIAL DE DIA (29/10 a 04/11) ===\n');
    
    const oficialDia = rows.filter(r => 
      r.service.includes('OFICIAL DE DIA') && 
      r.date >= '2025-10-29' && 
      r.date <= '2025-11-04'
    );
    
    oficialDia.forEach(r => {
      const d = new Date(r.date + 'T00:00:00');
      const formatted = d.toLocaleDateString('pt-BR');
      console.log(`  ${formatted}: ${r.rank} ${r.name}`);
    });
    
    console.log(`\nTotal OFICIAL DE DIA: ${oficialDia.length} pessoas\n`);
    
    // Verificar dia 29/10 especificamente
    console.log('=== Verificando dia 29/10/2025 ===\n');
    
    const day29 = rows.filter(r => r.date === '2025-10-29');
    const byService29 = {};
    
    day29.forEach(r => {
      if (!byService29[r.service]) {
        byService29[r.service] = [];
      }
      byService29[r.service].push(r);
    });
    
    Object.keys(byService29).sort().forEach(service => {
      console.log(`${service}:`);
      byService29[service].forEach(r => {
        console.log(`  ${r.rank} ${r.name}`);
      });
    });
    
  } catch (error) {
    console.error('Erro no teste:', error.message);
    process.exit(1);
  }
}

test();
