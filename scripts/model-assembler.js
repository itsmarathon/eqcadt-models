#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Expected checksums for chunks and full model
const CHUNK_HASHES = {
  'bart-nli-web.onnx.partaa': '15a1f94425b72f6428c903cc1ee2683b50b6684c14160876a471a07eecbd4de1',
  'bart-nli-web.onnx.partab': '4f331713a2f9b2e52713dc4e7773b48650eb57a2a0830063480ae0acdb232dc7',
  'bart-nli-web.onnx.partac': 'de7bf7081557b6baeb2aaf0cf4c1b9f79a05062645ee9749dd3908616f924f74',
  'bart-nli-web.onnx.partad': 'a1518240260c97c45a11c2902a3dd2675c874233ee809508278e67b0ad472e7d',
  'bart-nli-web.onnx.partae': '72bfe26692fbf55ed5cb28d4bd60e0685ac867b2e13cdf8d0904e341ef4e92ff',
  'bart-nli-web.onnx.partaf': '2f0d055e1b57e6e257f6c30ab1150d7610ab216bbe21e065b55f722c88e57a11',
  'bart-nli-web.onnx.partag': '05350326c48dd91f7775c398089ead04a6d5b0e4011ca08b9b93d36508d64f0a',
  'bart-nli-web.onnx.partah': '400c858d9010cb72dd377e4f2837ce30b750764af5fc9f4b986d9107da227c51',
  'bart-nli-web.onnx.partai': '21b740cbd3d220fcdd59b1f347df65537161666189c157c1d2871e86e98f9bb3'
};

const FULL_MODEL_HASH = 'f1ec688d92e9c3db0058b45b711a8afbf23b8505a62a62a91ad8e44c6874bf1a';

function calculateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

function verifyChunk(chunkName) {
  const chunkPath = path.join(__dirname, '../models', chunkName);
  
  if (!fs.existsSync(chunkPath)) {
    throw new Error(`❌ Chunk not found: ${chunkName}`);
  }
  
  console.log(`🔍 Verifying chunk ${chunkName}...`);
  const actualHash = calculateHash(chunkPath);
  const expectedHash = CHUNK_HASHES[chunkName];
  
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
  const outputPath = path.join(modelsDir, 'bart-nli-web.onnx');
  
  console.log('🔧 Assembling model from chunks...');
  
  // Get all chunk files in order
  const chunkNames = Object.keys(CHUNK_HASHES).sort();
  
  // Remove existing assembled model if it exists
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }
  
  // Concatenate chunks synchronously
  const chunks = [];
  for (const chunkName of chunkNames) {
    const chunkPath = path.join(modelsDir, chunkName);
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
  
  if (assembledHash !== FULL_MODEL_HASH) {
    console.error(`❌ ASSEMBLED MODEL CHECKSUM MISMATCH`);
    console.error(`   Expected: ${FULL_MODEL_HASH}`);
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
  
  try {
    // Verify all chunks first
    console.log('📋 Step 1: Verifying chunks...');
    Object.keys(CHUNK_HASHES).forEach(verifyChunk);
    
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
  CHUNK_HASHES,
  FULL_MODEL_HASH
};

// Run if called directly
if (require.main === module) {
  main();
}