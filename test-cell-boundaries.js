const fs = require('fs');
const pdf = require('pdf-parse');

async function analyze() {
  const dataBuffer = fs.readFileSync('/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf');
  const data = await pdf(dataBuffer);
  const rawText = data.text || '';
  
  // Keep lines WITH spaces
  const lines = rawText.split(/\r?\n/);
  
  console.log('=== ADJUNTO - Primeiras 15 linhas (com indicador de vazio) ===\n');
  
  let found = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === 'ADJUNTO') {
      found = true;
      console.log(`${i}: [SERVICE] |${lines[i].trim()}|`);
      
      for (let j = 1; j <= 15; j++) {
        const line = lines[i + j];
        const trimmed = line.trim();
        const spaces = line.match(/^ */)[0].length;
        
        if (trimmed === '') {
          console.log(`${i+j}: [EMPTY] spaces=${spaces}`);
        } else {
          console.log(`${i+j}: [TEXT] spaces=${spaces} |${trimmed}|`);
        }
      }
      break;
    }
  }
  
  if (found) {
    console.log('\n=== CMT GDA 2ª CIA - Primeiras 15 linhas ===\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().includes('CMT GDA') && lines[i + 1] && lines[i + 1].trim() === '2ª CIA') {
        console.log(`${i}: [SERVICE] |${lines[i].trim()}|`);
        console.log(`${i+1}: [COMPLEMENT] |${lines[i+1].trim()}|`);
        
        for (let j = 2; j <= 15; j++) {
          const line = lines[i + j];
          const trimmed = line.trim();
          const spaces = line.match(/^ */)[0].length;
          
          if (trimmed === '') {
            console.log(`${i+j}: [EMPTY] spaces=${spaces}`);
          } else {
            console.log(`${i+j}: [TEXT] spaces=${spaces} |${trimmed}|`);
          }
        }
        break;
      }
    }
  }
}

analyze().catch(console.error);
