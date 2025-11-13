const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');

const execFileAsync = promisify(execFile);

/**
 * PDF Extractor V7 - Python pdfplumber integration
 * 
 * Uses Python's pdfplumber library for accurate table cell detection
 * This solves the problem of cells spanning multiple lines or containing multiple people
 */
async function extractFromPdf(filePath) {
  console.log('Extraindo tabelas do PDF usando pdfplumber...\n');
  
  const pythonScript = path.join(__dirname, '..', '..', 'extract_pdf_tables.py');
  
  try {
    const { stdout, stderr } = await execFileAsync('python3', [pythonScript, filePath], {
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    // Log stderr (debug info) but don't fail
    if (stderr) {
      console.log('Python debug output:');
      console.log(stderr);
    }
    
    // Parse JSON output
    const results = JSON.parse(stdout);
    
    if (results.error) {
      throw new Error(`Python extractor error: ${results.error}`);
    }
    
    console.log(`\n=== TOTAL: ${results.length} registros extraídos ===\n`);
    
    // Log summary by service
    const byService = {};
    results.forEach(row => {
      if (!byService[row.service]) {
        byService[row.service] = [];
      }
      byService[row.service].push(row);
    });
    
    Object.keys(byService).forEach(service => {
      console.log(`${service}: ${byService[service].length} registros`);
    });
    
    return results;
    
  } catch (error) {
    console.error('Erro ao executar extractor Python:', error);
    
    // If Python fails, show detailed error
    if (error.stderr) {
      console.error('Python stderr:', error.stderr);
    }
    if (error.stdout) {
      console.error('Python stdout:', error.stdout);
    }
    
    throw new Error(`Falha na extração: ${error.message}`);
  }
}

module.exports = { extractFromPdf };
