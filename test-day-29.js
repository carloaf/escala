const fs = require('fs');
const pdf = require('pdf-parse');

async function analyze() {
  const dataBuffer = fs.readFileSync('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  const data = await pdf(dataBuffer);
  const text = data.text || '';
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  
  console.log('=== PRIMEIRA TABELA - ANALISANDO DIA 29/10 ===\n');
  
  // Encontrar a primeira tabela
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('DATA')) {
      startIdx = i;
      break;
    }
  }
  
  // Mostrar linhas da primeira tabela até encontrar os serviços
  let inFirstTable = false;
  let serviceCount = 0;
  const servicePatterns = ['OFICIAL DE DIA', 'AUX OF DIA', 'ADJUNTO', 'SGT DE DIA', 'CMT GDA', 'CB DA GDA'];
  
  for (let i = startIdx; i < Math.min(startIdx + 100, lines.length); i++) {
    const line = lines[i];
    
    // Check if this is a service name
    let isService = false;
    for (const pattern of servicePatterns) {
      if (line.includes(pattern)) {
        isService = true;
        serviceCount++;
        console.log(`\n[SERVIÇO ${serviceCount}] ${line}`);
        
        // Show next 10 lines (personnel for this service)
        console.log('Próximas 10 linhas após o serviço:');
        for (let j = 1; j <= 10 && (i + j) < lines.length; j++) {
          console.log(`  ${j}: |${lines[i + j]}|`);
        }
        break;
      }
    }
    
    if (serviceCount >= 5) break; // Only first 5 services for now
  }
}

analyze().catch(console.error);
