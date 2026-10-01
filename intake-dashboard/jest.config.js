let createJestConfig;
try {
  const nextJest = require('next/jest');
  createJestConfig = nextJest({ dir: './' });
} catch (e) {
  // Resilient fallback when running before npm install or in isolated test runners
  createJestConfig = (cfg) => cfg;
}

const customJestConfig = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};

module.exports = createJestConfig(customJestConfig);
