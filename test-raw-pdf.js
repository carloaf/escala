const fs = require('fs');
const pdf = require('pdf-parse');

async function analyze() {
  const dataBuffer = fs.readFileSync('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  const data = await pdf(dataBuffer);
  const text = data.text || '';
  
  console.log('=== TEXTO BRUTO DO PDF (primeiros 2000 chars) ===\n');
  console.log(text.substring(0, 2000));
  console.log('\n=== CONTINUAÇÃO (próximos 2000 chars) ===\n');
  console.log(text.substring(2000, 4000));
}

analyze().catch(console.error);
