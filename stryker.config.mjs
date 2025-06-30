/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  packageManager: 'pnpm',
  
  // Test runner configuration
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    dir: '.',
  },
  
  // Mutation configuration
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/type-tests.ts',
    '!src/**/index.ts',
  ],
  
  // TypeScript mutator
  mutator: {
    excludedMutations: [
      'BlockStatement',
      'ArrayDeclaration',
    ],
  },
  
  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Reporters
  reporters: ['html', 'clear-text', 'progress', 'json'],
  htmlReporter: {
    fileName: 'test-results/mutation/index.html',
  },
  jsonReporter: {
    fileName: 'test-results/mutation/mutation-report.json',
  },
  
  // Thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: null, // Don't break the build
  },
  
  // Performance
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  dryRunTimeoutMinutes: 5,
  concurrency: 4,
  
  // Incremental analysis
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  
  // Temporary directory
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  
  // Logging
  logLevel: 'info',
  fileLogLevel: 'trace',
  allowConsoleColors: true,
  
  // Disable type checking for faster mutation testing
  checkers: [],
  
  // Plugin configuration
  plugins: [
    '@stryker-mutator/vitest-runner',
    '@stryker-mutator/typescript-checker',
  ],
};