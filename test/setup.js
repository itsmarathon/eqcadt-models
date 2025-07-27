/**
 * Jest setup file for eqcadt-models tests
 */

// Increase timeout for model assembly operations
jest.setTimeout(60000);

// Mock console.log for cleaner test output
const originalLog = console.log;
global.console = {
  ...console,
  log: jest.fn((...args) => {
    // Only show logs if they contain error or test-relevant info
    const message = args.join(' ');
    if (message.includes('❌') || message.includes('error') || process.env.VERBOSE_TESTS) {
      originalLog(...args);
    }
  })
};

// Setup and teardown
beforeAll(() => {
  console.log('🧪 Starting eqcadt-models tests...');
});

afterAll(() => {
  console.log('✅ eqcadt-models tests completed');
});