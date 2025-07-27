/**
 * @itsmarathon/eqcadt-models - Main entry point
 * Provides access to BART NLI model with automatic chunk assembly
 */

const { assembleModel, MODEL_CONFIG, loadManifest } = require('./scripts/model-assembler');
const fs = require('fs');
const path = require('path');

/**
 * Get the assembled model as ArrayBuffer
 * Automatically assembles from chunks if needed
 */
async function getModel() {
  const modelPath = path.join(__dirname, 'models', MODEL_CONFIG.files.assembled.filename);
  
  // Check if assembled model exists, if not assemble it
  if (!fs.existsSync(modelPath)) {
    console.log('📦 Model not assembled, assembling from chunks...');
    assembleModel();
  }
  
  // Read and return as ArrayBuffer
  const buffer = fs.readFileSync(modelPath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Get model file path (for Node.js usage)
 */
function getModelPath() {
  const modelPath = path.join(__dirname, 'models', MODEL_CONFIG.files.assembled.filename);
  
  // Check if assembled model exists, if not assemble it
  if (!fs.existsSync(modelPath)) {
    console.log('📦 Model not assembled, assembling from chunks...');
    assembleModel();
  }
  
  return modelPath;
}

/**
 * Get model manifest
 */
function getManifest() {
  return loadManifest();
}

/**
 * Calculate SHA256 hash of ArrayBuffer (web-compatible)
 */
async function calculateHashWeb(buffer) {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get model for web environments by downloading and assembling chunks
 * This is used when the package chunks need to be fetched from CDN/GitHub
 * Includes full SHA256 verification like the Node.js version
 */
async function getModelWeb(baseUrl = 'https://cdn.jsdelivr.net/npm/@itsmarathon/eqcadt-models@latest/models/chunks/') {
  console.log('🌐 Loading model for web environment...');
  
  // First, download the manifest from the same source
  const manifestUrl = baseUrl.replace('/chunks/', '/model-manifest.json');
  console.log(`📄 Downloading manifest from: ${manifestUrl}`);
  
  const manifestResponse = await fetch(manifestUrl, {
    mode: 'cors',
    cache: 'force-cache'
  });
  
  if (!manifestResponse.ok) {
    throw new Error(`Failed to download manifest: ${manifestResponse.status} ${manifestResponse.statusText}`);
  }
  
  const manifest = await manifestResponse.json();
  const modelConfig = manifest.models['bart-nli-web'];
  
  if (!modelConfig || !modelConfig.files || !modelConfig.files.chunks) {
    throw new Error('Invalid manifest: chunks configuration not found');
  }
  
  console.log(`📋 Using manifest: ${modelConfig.name} v${modelConfig.version}`);
  
  // Get chunk names from downloaded manifest
  const chunkNames = Object.keys(modelConfig.files.chunks.checksums).sort();
  console.log(`📋 Downloading ${chunkNames.length} chunks from: ${baseUrl}`);
  
  // Download and verify all chunks in parallel
  const chunkPromises = chunkNames.map(async (chunkName, index) => {
    const chunkUrl = baseUrl.endsWith('/') ? `${baseUrl}${chunkName}` : `${baseUrl}/${chunkName}`;
    console.log(`⏬ Downloading chunk ${index + 1}/${chunkNames.length}: ${chunkName}`);
    
    const response = await fetch(chunkUrl, {
      mode: 'cors',
      cache: 'force-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download chunk ${chunkName}: ${response.status} ${response.statusText}`);
    }
    
    const chunkBuffer = await response.arrayBuffer();
    console.log(`✅ Downloaded chunk: ${chunkName} (${(chunkBuffer.byteLength / 1024 / 1024).toFixed(1)}MB)`);
    
    // Verify chunk integrity using manifest from CDN
    console.log(`🔍 Verifying chunk ${chunkName}...`);
    const actualHash = await calculateHashWeb(chunkBuffer);
    const expectedHash = modelConfig.files.chunks.checksums[chunkName];
    
    if (!expectedHash) {
      throw new Error(`❌ No expected hash found for chunk ${chunkName} in manifest`);
    }
    
    if (actualHash !== expectedHash) {
      console.error(`❌ CHUNK CHECKSUM MISMATCH for ${chunkName}`);
      console.error(`   Expected: ${expectedHash}`);
      console.error(`   Actual:   ${actualHash}`);
      throw new Error(`Invalid checksum for chunk ${chunkName}`);
    }
    
    console.log(`✅ ${chunkName} verified (${(chunkBuffer.byteLength / 1024).toFixed(1)}KB)`);
    return chunkBuffer;
  });
  
  // Wait for all chunks to download and verify
  const chunks = await Promise.all(chunkPromises);
  
  // Assemble chunks
  console.log(`🔧 Assembling ${chunks.length} chunks...`);
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const assembledBuffer = new ArrayBuffer(totalSize);
  const assembledView = new Uint8Array(assembledBuffer);
  
  let offset = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunkView = new Uint8Array(chunks[i]);
    assembledView.set(chunkView, offset);
    offset += chunkView.length;
  }
  
  // Verify assembled model integrity using manifest from CDN
  console.log('🔍 Verifying assembled model...');
  const assembledHash = await calculateHashWeb(assembledBuffer);
  const expectedHash = modelConfig.files.assembled.sha256;
  
  if (assembledHash !== expectedHash) {
    console.error(`❌ ASSEMBLED MODEL CHECKSUM MISMATCH`);
    console.error(`   Expected: ${expectedHash}`);
    console.error(`   Actual:   ${assembledHash}`);
    throw new Error('Invalid checksum for assembled model');
  }
  
  console.log(`✅ Model assembled and verified for web! Total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
  return assembledBuffer;
}

module.exports = {
  getModel,
  getModelPath,
  getModelWeb,
  getManifest,
  MODEL_CONFIG
};