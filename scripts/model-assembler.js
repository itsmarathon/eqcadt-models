#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load model manifest
function loadManifest() {
  const manifestPath = path.join(__dirname, '../models/model-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Model manifest not found: ${manifestPath}`);
  }
  
  const manifestData = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestData);
  
  if (!manifest.models || !manifest.models['bart-nli-web']) {
    throw new Error('Invalid manifest: bart-nli-web model not found');
  }
  
  return manifest.models['bart-nli-web'];
}

// Get model configuration from manifest
const MODEL_CONFIG = loadManifest();

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function verifyChunk(chunkName) {
  const chunksDir = path.join(__dirname, '../models', MODEL_CONFIG.files.chunks.directory);
  const chunkPath = path.join(chunksDir, chunkName);
  
  if (!fs.existsSync(chunkPath)) {
    throw new Error(`❌ Chunk not found: ${chunkPath}`);
  }
  
  console.log(`🔍 Verifying chunk ${chunkName}...`);
  const actualHash = calculateHash(chunkPath);
  const expectedHash = MODEL_CONFIG.files.chunks.checksums[chunkName];
  
  if (!expectedHash) {
    throw new Error(`❌ No expected hash found for chunk ${chunkName} in manifest`);
  }
  
  if (actualHash !== expectedHash) {
    console.error(`❌ CHUNK CHECKSUM MISMATCH for ${chunkName}`);
    console.error(`   Expected: ${expectedHash}`);
    console.error(`   Actual:   ${actualHash}`);
    throw new Error(`Invalid checksum for chunk ${chunkName}`);
  }
  
  const sizeKB = (fs.statSync(chunkPath).size / 1024).toFixed(1);
  console.log(`✅ ${chunkName} verified (${sizeKB}KB)`);
}

function assembleModel() {
  const modelsDir = path.join(__dirname, '../models');
  const chunksDir = path.join(modelsDir, MODEL_CONFIG.files.chunks.directory);
  const outputPath = path.join(modelsDir, MODEL_CONFIG.files.assembled.filename);
  
  console.log('🔧 Assembling model from chunks...');
  
  // Get all chunk files from manifest
  const chunkNames = Object.keys(MODEL_CONFIG.files.chunks.checksums).sort();
  console.log(`📋 Found ${chunkNames.length} chunks in manifest`);
  
  // Remove existing assembled model if it exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  
  // Concatenate chunks synchronously
  const chunks = [];
  for (const chunkName of chunkNames) {
    const chunkPath = path.join(chunksDir, chunkName);
    const chunkData = fs.readFileSync(chunkPath);
    chunks.push(chunkData);
    console.log(`📎 Added ${chunkName} (${(chunkData.length / 1024 / 1024).toFixed(1)}MB)`);
  }
  
  // Write combined buffer
  const combinedBuffer = Buffer.concat(chunks);
  fs.writeFileSync(outputPath, combinedBuffer);
  
  // Verify assembled model
  console.log('🔍 Verifying assembled model...');
  const assembledHash = calculateHash(outputPath);
  const expectedHash = MODEL_CONFIG.files.assembled.sha256;
  
  if (assembledHash !== expectedHash) {
    console.error(`❌ ASSEMBLED MODEL CHECKSUM MISMATCH`);
    console.error(`   Expected: ${expectedHash}`);
    console.error(`   Actual:   ${assembledHash}`);
    throw new Error('Invalid checksum for assembled model');
  }
  
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`✅ Model assembled successfully! (${sizeMB}MB)`);
  
  return outputPath;
}

function main() {
  console.log('🧩 BART Model Assembler & Verifier');
  console.log('==================================');
  console.log(`📄 Using manifest: ${MODEL_CONFIG.name} v${MODEL_CONFIG.version}`);
  
  try {
    // Verify all chunks first
    console.log('\n📋 Step 1: Verifying chunks...');
    const chunkNames = Object.keys(MODEL_CONFIG.files.chunks.checksums);
    console.log(`🔍 Verifying ${chunkNames.length} chunks from manifest...`);
    chunkNames.forEach(verifyChunk);
    
    // Assemble the model
    console.log('\n📋 Step 2: Assembling model...');
    const modelPath = assembleModel();
    
    console.log(`\n✅ Success! Model ready at: ${path.relative(process.cwd(), modelPath)}`);
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Assembly failed: ${error.message}`);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  verifyChunk,
  assembleModel,
  MODEL_CONFIG,
  loadManifest
};

// Run if called directly
if (require.main === module) {
  main();
}