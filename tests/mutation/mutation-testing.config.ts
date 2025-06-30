/**
 * Mutation testing configuration for Re-Shell UI
 * Using Stryker Mutator for JavaScript/TypeScript mutation testing
 */

export const strykerConfig = {
  packageManager: 'pnpm',
  reporters: ['html', 'clear-text', 'progress', 'dashboard'],
  testRunner: 'vitest',
  coverageAnalysis: 'perTest',
  
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/**/index.ts',
  ],
  
  mutator: {
    name: 'typescript',
    excludedMutations: [
      'BlockStatement',
      'ArrayDeclaration',
    ],
  },
  
  vitest: {
    configFile: 'vitest.config.ts',
    dir: 'tests',
  },
  
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  
  timeoutMS: 60000,
  timeoutFactor: 1.5,
  dryRunTimeoutMinutes: 5,
  
  concurrency: 4,
  
  dashboard: {
    project: 'github.com/Re-Shell/ui',
    version: 'main',
    module: '@re-shell/ui',
    reportType: 'full',
  },
  
  htmlReporter: {
    fileName: 'test-results/mutation/mutation-report.html',
  },
  
  incremental: true,
  incrementalFile: '.stryker-tmp/incremental.json',
  
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  
  logLevel: 'info',
  fileLogLevel: 'trace',
  allowConsoleColors: true,
};

/**
 * Custom mutation operators for React components
 */
export const customMutators = {
  // React-specific mutations
  'ConditionalRendering': {
    pattern: /{\s*condition\s*&&\s*<Component/,
    mutations: [
      'Replace && with ||',
      'Negate condition',
      'Always render',
      'Never render',
    ],
  },
  
  'PropsDefault': {
    pattern: /=\s*{\s*}/,
    mutations: [
      'Remove default props',
      'Replace with null',
      'Replace with undefined',
    ],
  },
  
  'EventHandler': {
    pattern: /on[A-Z]\w+={/,
    mutations: [
      'Remove event handler',
      'Replace with noop',
      'Trigger different event',
    ],
  },
  
  'StateUpdate': {
    pattern: /set\w+\(/,
    mutations: [
      'Skip state update',
      'Update with wrong value',
      'Update with previous value',
    ],
  },
  
  'ArrayMethod': {
    pattern: /\.(map|filter|reduce|find|some|every)\(/,
    mutations: [
      'Replace with different array method',
      'Return empty array',
      'Return original array',
    ],
  },
};

/**
 * Mutation testing strategies
 */
export const mutationStrategies = {
  // Component-level mutations
  component: {
    targets: ['src/components/**/*.tsx'],
    operators: [
      'ConditionalExpression',
      'LogicalOperator',
      'StringLiteral',
      'BooleanLiteral',
      'ConditionalRendering',
      'PropsDefault',
      'EventHandler',
    ],
    timeoutMS: 30000,
  },
  
  // Hook mutations
  hooks: {
    targets: ['src/hooks/**/*.ts'],
    operators: [
      'ConditionalExpression',
      'LogicalOperator',
      'UpdateOperator',
      'StateUpdate',
      'ArrayMethod',
    ],
    timeoutMS: 20000,
  },
  
  // Utility function mutations
  utilities: {
    targets: ['src/utils/**/*.ts'],
    operators: [
      'ArithmeticOperator',
      'ComparisonOperator',
      'LogicalOperator',
      'StringLiteral',
      'NumberLiteral',
      'ArrayMethod',
    ],
    timeoutMS: 10000,
  },
  
  // Type validation mutations
  validation: {
    targets: ['src/types/validation/**/*.ts'],
    operators: [
      'ConditionalExpression',
      'ComparisonOperator',
      'BooleanLiteral',
      'RegexLiteral',
    ],
    timeoutMS: 15000,
  },
};

/**
 * Mutation score thresholds
 */
export const scoreThresholds = {
  excellent: 90,
  good: 80,
  acceptable: 70,
  poor: 60,
  unacceptable: 50,
};

/**
 * Mutation testing reports configuration
 */
export const reportConfig = {
  html: {
    enabled: true,
    fileName: 'mutation-report.html',
    outputFolder: 'test-results/mutation',
    includeDetails: true,
    includeMetrics: true,
  },
  
  json: {
    enabled: true,
    fileName: 'mutation-results.json',
    outputFolder: 'test-results/mutation',
    pretty: true,
  },
  
  markdown: {
    enabled: true,
    fileName: 'MUTATION_TESTING.md',
    outputFolder: 'docs',
    includeBadge: true,
    includeDetails: true,
  },
  
  console: {
    enabled: true,
    colors: true,
    details: 'summary',
    clearBetweenRuns: true,
  },
};

/**
 * Excluded patterns for mutation testing
 */
export const excludePatterns = [
  // Test files
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/__tests__/**',
  
  // Story files
  '**/*.stories.{ts,tsx}',
  
  // Type definition files
  '**/*.d.ts',
  '**/types/**',
  
  // Generated files
  '**/generated/**',
  '**/dist/**',
  '**/build/**',
  
  // Configuration files
  '**/*.config.{ts,js}',
  '**/setupTests.{ts,js}',
  
  // Index files (usually just exports)
  '**/index.{ts,tsx}',
  
  // Mock files
  '**/__mocks__/**',
  '**/mocks/**',
];

/**
 * Mutation testing pipeline
 */
export const mutationPipeline = {
  stages: [
    {
      name: 'pre-check',
      tasks: [
        'Run all tests',
        'Check coverage threshold',
        'Validate configuration',
      ],
    },
    {
      name: 'mutation',
      tasks: [
        'Generate mutants',
        'Run tests against mutants',
        'Collect results',
      ],
    },
    {
      name: 'analysis',
      tasks: [
        'Calculate mutation score',
        'Identify survived mutants',
        'Generate recommendations',
      ],
    },
    {
      name: 'reporting',
      tasks: [
        'Generate HTML report',
        'Update dashboard',
        'Create PR comment',
      ],
    },
  ],
  
  failureThreshold: 50,
  warningThreshold: 70,
  targetScore: 80,
};

/**
 * Integration with CI/CD
 */
export const ciConfig = {
  enabledBranches: ['main', 'develop', /^feature\/.*/],
  
  pullRequest: {
    enabled: true,
    comment: true,
    blockOnFailure: false,
    minScore: 70,
  },
  
  schedule: {
    enabled: true,
    cron: '0 2 * * SUN', // Weekly on Sunday at 2 AM
    fullRun: true,
  },
  
  incremental: {
    enabled: true,
    baseBranch: 'main',
    trackHistory: true,
  },
};