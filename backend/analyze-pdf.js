require('dotenv').config();
const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzePdf(filePath) {
  try {
    console.log('Analyzing PDF:', filePath);
    console.log('='.repeat(80));
    
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    
    console.log('\n📄 PDF Info:');
    console.log('  Pages:', data.numpages);
    console.log('  Text length:', data.text.length, 'characters');
    
    console.log('\n📝 Full Text Content:');
    console.log('-'.repeat(80));
    console.log(data.text);
    console.log('-'.repeat(80));
    
    console.log('\n📋 Lines (first 50):');
    const lines = data.text.split(/\r?\n/);
    lines.slice(0, 50).forEach((line, idx) => {
      if (line.trim()) {
        console.log(`${String(idx + 1).padStart(3, '0')}: "${line}"`);
      }
    });
    
    console.log('\n🔍 Pattern Analysis:');
    
    // Look for dates
    const dateMatches = data.text.match(/\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/g);
    console.log('  Dates found:', dateMatches ? dateMatches.length : 0);
    if (dateMatches) console.log('  Examples:', dateMatches.slice(0, 5));
    
    // Look for times
    const timeMatches = data.text.match(/\d{1,2}:\d{2}/g);
    console.log('  Times found:', timeMatches ? timeMatches.length : 0);
    if (timeMatches) console.log('  Examples:', timeMatches.slice(0, 5));
    
    // Look for ranks
    const rankMatches = data.text.match(/\b(GEN|CEL|TC|MAJ|CAP|TEN|SGT|CB|SD)\b/gi);
    console.log('  Ranks found:', rankMatches ? rankMatches.length : 0);
    if (rankMatches) console.log('  Examples:', rankMatches.slice(0, 5));
    
    console.log('\n='.repeat(80));
    
  } catch (err) {
    console.error('Error analyzing PDF:', err);
  }
}

const pdfPath = process.argv[2] || '/app/uploads/PREVISÃO DA ESCALA DE SERVIÇO.pdf';
analyzePdf(pdfPath);
