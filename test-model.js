const ort = require('onnxruntime-node');
const fs = require('fs');
const path = require('path');

async function testModel() {
  try {
    const modelPath = path.join(__dirname, 'models/bart-nli-web.onnx');
    
    console.log('🔍 Testing assembled model...');
    console.log(`📁 Model path: ${modelPath}`);
    
    // Check if file exists and get size
    const stats = fs.statSync(modelPath);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`);
    
    // Try to load with ONNX Runtime Node
    console.log('🧪 Loading with ONNX Runtime Node...');
    const session = await ort.InferenceSession.create(modelPath);
    
    console.log('✅ Model loaded successfully!');
    console.log(`📋 Input names: ${session.inputNames}`);
    console.log(`📋 Output names: ${session.outputNames}`);
    
    session.release();
    console.log('🎉 Model is valid!');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    process.exit(1);
  }
}

testModel();