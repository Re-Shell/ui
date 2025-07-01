/**
 * Re-Shell UI Quality Metrics
 * Comprehensive quality tracking and enforcement system
 */

// Types
export * from './types';

// Quality Dashboard
export { QualityDashboard } from './quality-dashboard';
export type { QualityDashboardProps } from './quality-dashboard';

// Bundle Size Analysis
export { BundleAnalyzer, createBundleSizeReport } from './bundle-analyzer';
export type { BudgetAlert } from './bundle-analyzer';

// Performance Benchmarking
export { 
  PerformanceBenchmark, 
  benchmarkComponent, 
  createPerformanceReport 
} from './performance-benchmark';
export type { BenchmarkOptions, BenchmarkResult } from './performance-benchmark';

// Accessibility Scoring
export { 
  AccessibilityScorer, 
  auditURL, 
  createAccessibilityMiddleware 
} from './accessibility-scorer';
export type { 
  AccessibilityScorerOptions, 
  ComponentAuditConfig, 
  ComponentAuditResult 
} from './accessibility-scorer';

// Type Coverage Reporting
export { 
  TypeCoverageReporter, 
  createTypeCoverageMiddleware 
} from './type-coverage-reporter';
export type { UnsafeTypePattern } from './type-coverage-reporter';

// Complexity Analysis
export { 
  ComplexityAnalyzer, 
  createComplexityChecker 
} from './complexity-analyzer';
export type { ComplexityThresholds } from './complexity-analyzer';

// Documentation Coverage
export { 
  DocumentationCoverageTracker, 
  createDocumentationMiddleware 
} from './documentation-coverage';
export type { UndocumentedExport } from './documentation-coverage';

// API Stability Tracking
export { 
  APIStabilityTracker, 
  createAPIStabilityMiddleware 
} from './api-stability-tracker';

// Breaking Change Detection
export { 
  BreakingChangeDetector, 
  createBreakingChangeMiddleware 
} from './breaking-change-detector';

// Quality Gate Automation
export { 
  QualityGate, 
  createQualityGateMiddleware,
  defaultQualityGateConfig 
} from './quality-gate';

/**
 * Create a comprehensive quality metrics suite
 */
export function createQualityMetricsSuite(config?: {
  bundleSizeBudget?: number;
  minTypeCoverage?: number;
  maxComplexity?: number;
  minDocCoverage?: number;
  minAccessibilityScore?: number;
  qualityGateConfig?: import('./types').QualityGateConfig;
}) {
  return {
    bundleAnalyzer: new BundleAnalyzer(undefined, config?.bundleSizeBudget),
    performanceBenchmark: new PerformanceBenchmark(),
    accessibilityScorer: new AccessibilityScorer(),
    typeCoverageReporter: new TypeCoverageReporter(),
    complexityAnalyzer: new ComplexityAnalyzer(),
    documentationTracker: new DocumentationCoverageTracker(),
    apiStabilityTracker: new APIStabilityTracker(),
    breakingChangeDetector: new BreakingChangeDetector(),
    qualityGate: new QualityGate(config?.qualityGateConfig || defaultQualityGateConfig)
  };
}

/**
 * Run all quality checks
 */
export async function runQualityChecks(options?: {
  skipPerformance?: boolean;
  skipAccessibility?: boolean;
  previousVersion?: string;
  qualityGateConfig?: import('./types').QualityGateConfig;
}): Promise<import('./types').MetricsResult> {
  const gate = new QualityGate(options?.qualityGateConfig || defaultQualityGateConfig);
  return gate.runAllChecks();
}