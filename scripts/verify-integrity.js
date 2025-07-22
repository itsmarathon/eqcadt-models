#!/usr/bin/env node

const { assembleModel } = require('./model-assembler.js');
const fs = require('fs');
const path = require('path');

function main() {
  console.log('🛡️  Model Integrity Verification');
  console.log('================================');
  
  try {
    const modelPath = path.join(__dirname, '../models/bart-nli-web.onnx');
    
    // Check if assembled model exists, if not assemble it
    if (!fs.existsSync(modelPath)) {
      console.log('📦 Assembled model not found, creating from chunks...\n');
      assembleModel();
    } else {
      console.log('✅ Model already exists, verifying chunks and assembly...\n');
      // Re-assemble to verify integrity
      assembleModel();
    }
    
    console.log('\n✅ Model verification completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}