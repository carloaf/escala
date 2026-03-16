const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const { normalizeScheduleRow } = require('../utils/serviceNameNormalizer');

const execFileAsync = promisify(execFile);

/**
 * Detect PDF type (Previsão or Boletim Interno)
 */
async function detectPdfType(filePath) {
  console.log('Detectando tipo de PDF...\n');
  
  const pythonScript = path.join(__dirname, '..', '..', 'detect_pdf_type.py');
  
  try {
    const { stdout } = await execFileAsync('python3', [pythonScript, filePath], {
      maxBuffer: 10 * 1024 * 1024
    });
    
    const result = JSON.parse(stdout);
    
    if (result.error) {
      throw new Error(`Detector error: ${result.error}`);
    }
    
    console.log(`Tipo de PDF detectado: ${result.type}\n`);
    return result.type;
    
  } catch (error) {
    console.error('Erro ao detectar tipo de PDF:', error);
    // Default to 'previsao' if detection fails
    return 'previsao';
  }
}

/**
 * PDF Extractor - Auto-detects PDF type and uses appropriate extractor
 * 
 * Supports:
 * - "Previsão da Escala" (table format) 
 * - "Boletim Interno" (text format with SERVIÇOS DIÁRIOS section)
 */
async function extractFromPdf(filePath) {
  // First, detect the PDF type
  const pdfType = await detectPdfType(filePath);
  
  let pythonScript;
  if (pdfType === 'boletim_interno') {
    console.log('Usando extrator de Boletim Interno...\n');
    pythonScript = path.join(__dirname, '..', '..', 'extract_boletim_interno.py');
  } else {
    console.log('Usando extrator de Previsão da Escala (tabelas)...\n');
    pythonScript = path.join(__dirname, '..', '..', 'extract_pdf_tables.py');
  }
  
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
    
    const normalizedResults = results.map((row) => normalizeScheduleRow(row));

    console.log(`\n=== TOTAL: ${normalizedResults.length} registros extraídos ===\n`);
    
    // Log summary by service
    const byService = {};
    normalizedResults.forEach(row => {
      if (!byService[row.service]) {
        byService[row.service] = [];
      }
      byService[row.service].push(row);
    });
    
    Object.keys(byService).forEach(service => {
      console.log(`${service}: ${byService[service].length} registros`);
    });
    
    return { results: normalizedResults, pdfType };
    
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
