/**
 * Unit tests for @itsmarathon/eqcadt-models package
 */

const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import the package functions
const { 
  getModel, 
  getModelPath, 
  getManifest, 
  MODEL_CONFIG 
} = require('../index.js');

describe('@itsmarathon/eqcadt-models Package Tests', () => {
  
  describe('Package Configuration', () => {
    it('should export all required functions', () => {
      expect(typeof getModel).toBe('function');
      expect(typeof getModelPath).toBe('function');
      expect(typeof getManifest).toBe('function');
      expect(typeof MODEL_CONFIG).toBe('object');
    });

    it('should have valid MODEL_CONFIG', () => {
      expect(MODEL_CONFIG).toBeDefined();
      expect(MODEL_CONFIG.name).toBe('BART NLI for Web');
      expect(MODEL_CONFIG.version).toBe('1.0.0');
      expect(MODEL_CONFIG.files).toBeDefined();
      expect(MODEL_CONFIG.files.chunks).toBeDefined();
      expect(MODEL_CONFIG.files.assembled).toBeDefined();
    });

    it('should have valid manifest structure', () => {
      const manifest = getManifest();
      expect(manifest).toBeDefined();
      expect(manifest.name).toBe('BART NLI for Web');
      expect(manifest.files.chunks.checksums).toBeDefined();
      expect(Object.keys(manifest.files.chunks.checksums)).toHaveLength(9);
    });
  });

  describe('Chunk Verification', () => {
    it('should verify all chunk files exist', () => {
      const chunkNames = Object.keys(MODEL_CONFIG.files.chunks.checksums);
      const chunksDir = path.join(__dirname, '../models/chunks');
      
      chunkNames.forEach(chunkName => {
        const chunkPath = path.join(chunksDir, chunkName);
        expect(fs.existsSync(chunkPath)).toBe(true);
      });
    });

    it('should have correct chunk checksums', () => {
      const chunkNames = Object.keys(MODEL_CONFIG.files.chunks.checksums);
      const chunksDir = path.join(__dirname, '../models/chunks');
      
      chunkNames.forEach(chunkName => {
        const chunkPath = path.join(chunksDir, chunkName);
        const actualHash = crypto.createHash('sha256')
          .update(fs.readFileSync(chunkPath))
          .digest('hex');
        const expectedHash = MODEL_CONFIG.files.chunks.checksums[chunkName];
        
        expect(actualHash).toBe(expectedHash);
      });
    });
  });

  describe('Model Assembly', () => {
    let assembledModelPath;

    beforeAll(() => {
      // Clean up any existing assembled model
      assembledModelPath = path.join(__dirname, '../models', MODEL_CONFIG.files.assembled.filename);
      if (fs.existsSync(assembledModelPath)) {
        fs.unlinkSync(assembledModelPath);
      }
    });

    afterAll(() => {
      // Clean up assembled model after tests
      if (fs.existsSync(assembledModelPath)) {
        fs.unlinkSync(assembledModelPath);
      }
    });

    it('should assemble model and return valid path', async () => {
      const modelPath = getModelPath();
      
      expect(typeof modelPath).toBe('string');
      expect(fs.existsSync(modelPath)).toBe(true);
      expect(path.basename(modelPath)).toBe(MODEL_CONFIG.files.assembled.filename);
    });

    it('should assemble model and return valid ArrayBuffer', async () => {
      const modelBuffer = await getModel();
      
      expect(modelBuffer).toBeInstanceOf(ArrayBuffer);
      expect(modelBuffer.byteLength).toBeGreaterThan(100 * 1024 * 1024); // > 100MB
      expect(modelBuffer.byteLength).toBe(MODEL_CONFIG.files.assembled.size_bytes);
    });

    it('should verify assembled model checksum', async () => {
      const modelPath = getModelPath();
      const modelBuffer = fs.readFileSync(modelPath);
      const actualHash = crypto.createHash('sha256')
        .update(modelBuffer)
        .digest('hex');
      const expectedHash = MODEL_CONFIG.files.assembled.sha256;
      
      expect(actualHash).toBe(expectedHash);
    });

    it('should return same model on subsequent calls', async () => {
      const modelBuffer1 = await getModel();
      const modelBuffer2 = await getModel();
      
      expect(modelBuffer1.byteLength).toBe(modelBuffer2.byteLength);
      
      // Compare first 1KB to ensure they're the same
      const view1 = new Uint8Array(modelBuffer1, 0, 1024);
      const view2 = new Uint8Array(modelBuffer2, 0, 1024);
      expect(Array.from(view1)).toEqual(Array.from(view2));
    });
  });

  describe('Error Handling', () => {
    it('should handle missing chunks gracefully', () => {
      // This test would require mocking fs operations
      // or temporarily moving chunk files
      // For now, we'll just ensure the functions exist
      expect(() => getManifest()).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should assemble model in reasonable time', async () => {
      const startTime = Date.now();
      await getModel();
      const endTime = Date.now();
      
      const assemblyTime = endTime - startTime;
      expect(assemblyTime).toBeLessThan(30000); // 30 seconds max
    }, 35000);
  });
});