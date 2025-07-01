/**
 * Re-Shell UI Quality Metrics Types
 * Type definitions for all quality metrics tracking
 */

// Code Quality Metrics
export interface CodeQualityMetrics {
  score: number; // 0-100
  maintainability: number; // 0-100
  reliability: number; // 0-100
  security: number; // 0-100
  technicalDebt: number; // in hours
  issues: {
    blocker: number;
    critical: number;
    major: number;
    minor: number;
    info: number;
  };
  duplications: {
    percentage: number;
    blocks: number;
    lines: number;
  };
  coverage: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
}

// Bundle Size Metrics
export interface BundleSizeMetrics {
  totalSize: number; // in bytes
  mainBundle: number;
  vendorBundle: number;
  css: number;
  assets: number;
  gzipped: number;
  brotli: number;
  budgetLimit: number;
  budgetUsage: number; // percentage
  chunks: ChunkMetrics[];
  treemap?: TreemapData;
}

export interface ChunkMetrics {
  name: string;
  size: number;
  gzipped: number;
  modules: number;
  isDynamicImport: boolean;
}

export interface TreemapData {
  name: string;
  value: number;
  children?: TreemapData[];
}

// Performance Metrics
export interface PerformanceMetrics {
  score: number; // 0-100
  firstContentfulPaint: number; // ms
  firstPaint: number; // ms
  largestContentfulPaint: number; // ms
  timeToInteractive: number; // ms
  totalBlockingTime: number; // ms
  cumulativeLayoutShift: number;
  speedIndex: number;
  mainThreadWork: number; // ms
  bootupTime: number; // ms
  memoryUsage: {
    initial: number;
    peak: number;
    average: number;
  };
}

// Accessibility Metrics
export interface AccessibilityMetrics {
  score: number; // 0-100
  violations: number;
  warnings: number;
  passes: number;
  incomplete: number;
  wcagCompliance: {
    a: boolean;
    aa: boolean;
    aaa: boolean;
  };
  categories: {
    aria: number;
    color: number;
    names: number;
    navigation: number;
    semantics: number;
    keyboard: number;
    screenReader: number;
  };
  topIssues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  count: number;
  elements: string[];
}

// Type Coverage Metrics
export interface TypeCoverageMetrics {
  percentage: number;
  typed: number;
  any: number;
  unknown: number;
  total: number;
  files: FileTypeCoverage[];
  strict: boolean;
  noImplicitAny: boolean;
  strictNullChecks: boolean;
}

export interface FileTypeCoverage {
  path: string;
  percentage: number;
  typed: number;
  any: number;
  unknown: number;
  total: number;
}

// Complexity Metrics
export interface ComplexityMetrics {
  average: number;
  median: number;
  max: number;
  min: number;
  high: number; // count of high complexity items
  medium: number;
  low: number;
  files: FileComplexity[];
  cognitiveComplexity: number;
  halsteadMetrics: HalsteadMetrics;
}

export interface FileComplexity {
  path: string;
  complexity: number;
  functions: FunctionComplexity[];
}

export interface FunctionComplexity {
  name: string;
  complexity: number;
  line: number;
  column: number;
}

export interface HalsteadMetrics {
  vocabulary: number;
  length: number;
  volume: number;
  difficulty: number;
  effort: number;
  time: number;
  bugs: number;
}

// Documentation Metrics
export interface DocumentationMetrics {
  coverage: number; // percentage
  documented: number;
  undocumented: number;
  total: number;
  publicAPICoverage: number;
  examples: number;
  categories: {
    components: DocumentationCategory;
    hooks: DocumentationCategory;
    utilities: DocumentationCategory;
    types: DocumentationCategory;
  };
}

export interface DocumentationCategory {
  coverage: number;
  documented: number;
  total: number;
  withExamples: number;
}

// API Stability Metrics
export interface APIStabilityMetrics {
  stable: number;
  beta: number;
  experimental: number;
  deprecated: number;
  breakingChanges: BreakingChange[];
  versionCompatibility: VersionCompatibility[];
  publicAPICount: number;
  semverCompliance: boolean;
}

export interface BreakingChange {
  type: 'removed' | 'changed' | 'moved' | 'renamed';
  api: string;
  description: string;
  migration: string;
  since: string;
}

export interface VersionCompatibility {
  version: string;
  compatible: boolean;
  changes: number;
  breaking: number;
}

// Quality Gate Configuration
export interface QualityGateConfig {
  enabled: boolean;
  failOnViolation: boolean;
  thresholds: {
    codeQuality?: {
      minScore?: number;
      maxTechnicalDebt?: number;
      maxBlockerIssues?: number;
      maxCriticalIssues?: number;
    };
    bundleSize?: {
      maxSize?: number;
      maxIncrease?: number;
      maxChunks?: number;
    };
    performance?: {
      minScore?: number;
      maxFCP?: number;
      maxTTI?: number;
      maxTBT?: number;
    };
    accessibility?: {
      minScore?: number;
      maxViolations?: number;
      requireWCAG?: 'A' | 'AA' | 'AAA';
    };
    typeCoverage?: {
      minPercentage?: number;
      maxAnyTypes?: number;
    };
    complexity?: {
      maxAverage?: number;
      maxFunction?: number;
    };
    documentation?: {
      minCoverage?: number;
      requirePublicAPI?: boolean;
    };
  };
}

// Metrics Collection Result
export interface MetricsResult {
  timestamp: string;
  duration: number;
  success: boolean;
  metrics: {
    codeQuality?: CodeQualityMetrics;
    bundleSize?: BundleSizeMetrics;
    performance?: PerformanceMetrics;
    accessibility?: AccessibilityMetrics;
    typeCoverage?: TypeCoverageMetrics;
    complexity?: ComplexityMetrics;
    documentation?: DocumentationMetrics;
    apiStability?: APIStabilityMetrics;
  };
  qualityGate?: {
    passed: boolean;
    violations: QualityGateViolation[];
  };
}

export interface QualityGateViolation {
  metric: string;
  threshold: number;
  actual: number;
  severity: 'error' | 'warning';
  message: string;
}