module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/test/**/*.test.js'
  ],
  collectCoverageFrom: [
    'index.js',
    'scripts/**/*.js',
    '!scripts/verify-integrity.js' // Exclude verification script from coverage
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000, // 60 seconds for model assembly tests
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};