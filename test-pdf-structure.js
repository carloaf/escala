const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
  const dataBuffer = fs.readFileSync('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  const data = await pdf(dataBuffer);
  const lines = data.text.split('\n').map(l => l.trim()).filter(l => l);
  
  console.log('=== OFICIAL DE DIA - Primeira tabela ===\n');
  
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'OFICIAL DE DIA' && !found) {
      found = true;
      for (let j = 0; j <= 15 && (i + j) < lines.length; j++) {
        console.log(`${(i+j).toString().padStart(3)}: |${lines[i+j]}|`);
      }
      break;
    }
  }
  
  console.log('\n=== Verificando o que temos no banco para 04/11 ===\n');
  
})();
