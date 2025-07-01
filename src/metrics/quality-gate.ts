import type {
  QualityGateConfig,
  MetricsResult,
  QualityGateViolation,
  CodeQualityMetrics,
  BundleSizeMetrics,
  PerformanceMetrics,
  AccessibilityMetrics,
  TypeCoverageMetrics,
  ComplexityMetrics,
  DocumentationMetrics
} from './types';

import { BundleAnalyzer } from './bundle-analyzer';
import { PerformanceBenchmark } from './performance-benchmark';
import { AccessibilityScorer } from './accessibility-scorer';
import { TypeCoverageReporter } from './type-coverage-reporter';
import { ComplexityAnalyzer } from './complexity-analyzer';
import { DocumentationCoverageTracker } from './documentation-coverage';
import { APIStabilityTracker } from './api-stability-tracker';
import { BreakingChangeDetector } from './breaking-change-detector';

/**
 * Re-Shell UI Quality Gate Automation
 * Enforces quality standards across all metrics
 */
export class QualityGate {
  private config: QualityGateConfig;
  private violations: QualityGateViolation[] = [];

  constructor(config: QualityGateConfig) {
    this.config = config;
  }

  /**
   * Run all quality checks
   */
  async runAllChecks(): Promise<MetricsResult> {
    const startTime = Date.now();
    const metrics: MetricsResult['metrics'] = {};
    this.violations = [];

    try {
      // Run all metric collectors in parallel where possible
      const [
        bundleSize,
        typeCoverage,
        complexity,
        documentation,
        apiStability
      ] = await Promise.all([
        this.config.thresholds.bundleSize ? this.collectBundleSize() : null,
        this.config.thresholds.typeCoverage ? this.collectTypeCoverage() : null,
        this.config.thresholds.complexity ? this.collectComplexity() : null,
        this.config.thresholds.documentation ? this.collectDocumentation() : null,
        this.config.thresholds.apiStability ? this.collectAPIStability() : null
      ]);

      // These need to run separately as they require browser/DOM
      const performance = this.config.thresholds.performance 
        ? await this.collectPerformance() 
        : null;
      
      const accessibility = this.config.thresholds.accessibility 
        ? await this.collectAccessibility() 
        : null;

      // Code quality would typically come from external tools like SonarQube
      const codeQuality = this.config.thresholds.codeQuality 
        ? await this.collectCodeQuality() 
        : null;

      // Assign collected metrics
      if (bundleSize) metrics.bundleSize = bundleSize;
      if (performance) metrics.performance = performance;
      if (accessibility) metrics.accessibility = accessibility;
      if (typeCoverage) metrics.typeCoverage = typeCoverage;
      if (complexity) metrics.complexity = complexity;
      if (documentation) metrics.documentation = documentation;
      if (apiStability) metrics.apiStability = apiStability;
      if (codeQuality) metrics.codeQuality = codeQuality;

      // Check all thresholds
      this.checkThresholds(metrics);

      const passed = this.violations.length === 0;

      return {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: passed,
        metrics,
        qualityGate: {
          passed,
          violations: this.violations
        }
      };
    } catch (error) {
      return {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        metrics,
        qualityGate: {
          passed: false,
          violations: [{
            metric: 'system',
            threshold: 0,
            actual: 0,
            severity: 'error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }]
        }
      };
    }
  }

  /**
   * Collect bundle size metrics
   */
  private async collectBundleSize(): Promise<BundleSizeMetrics> {
    const analyzer = new BundleAnalyzer();
    return analyzer.analyze();
  }

  /**
   * Collect performance metrics
   */
  private async collectPerformance(): Promise<PerformanceMetrics> {
    const benchmark = new PerformanceBenchmark();
    return benchmark.collectMetrics();
  }

  /**
   * Collect accessibility metrics
   */
  private async collectAccessibility(): Promise<AccessibilityMetrics> {
    // This would typically use a headless browser
    // For now, return mock data
    return {
      score: 95,
      violations: 2,
      warnings: 5,
      passes: 150,
      incomplete: 3,
      wcagCompliance: {
        a: true,
        aa: true,
        aaa: false
      },
      categories: {
        aria: 0,
        color: 1,
        names: 0,
        navigation: 0,
        semantics: 1,
        keyboard: 0,
        screenReader: 0
      },
      topIssues: []
    };
  }

  /**
   * Collect type coverage metrics
   */
  private async collectTypeCoverage(): Promise<TypeCoverageMetrics> {
    const reporter = new TypeCoverageReporter();
    return reporter.analyze();
  }

  /**
   * Collect complexity metrics
   */
  private async collectComplexity(): Promise<ComplexityMetrics> {
    const analyzer = new ComplexityAnalyzer();
    return analyzer.analyze();
  }

  /**
   * Collect documentation metrics
   */
  private async collectDocumentation(): Promise<DocumentationMetrics> {
    const tracker = new DocumentationCoverageTracker();
    return tracker.analyze();
  }

  /**
   * Collect API stability metrics
   */
  private async collectAPIStability(): Promise<APIStabilityMetrics> {
    const tracker = new APIStabilityTracker();
    return tracker.analyze();
  }

  /**
   * Collect code quality metrics
   */
  private async collectCodeQuality(): Promise<CodeQualityMetrics> {
    // This would typically integrate with SonarQube or similar
    // For now, return mock data
    return {
      score: 85,
      maintainability: 88,
      reliability: 92,
      security: 95,
      technicalDebt: 24,
      issues: {
        blocker: 0,
        critical: 2,
        major: 5,
        minor: 15,
        info: 30
      },
      duplications: {
        percentage: 3.5,
        blocks: 12,
        lines: 150
      },
      coverage: {
        lines: 85,
        branches: 78,
        functions: 90,
        statements: 86
      }
    };
  }

  /**
   * Check all thresholds
   */
  private checkThresholds(metrics: MetricsResult['metrics']) {
    const { thresholds } = this.config;

    // Check code quality thresholds
    if (thresholds.codeQuality && metrics.codeQuality) {
      this.checkCodeQualityThresholds(metrics.codeQuality, thresholds.codeQuality);
    }

    // Check bundle size thresholds
    if (thresholds.bundleSize && metrics.bundleSize) {
      this.checkBundleSizeThresholds(metrics.bundleSize, thresholds.bundleSize);
    }

    // Check performance thresholds
    if (thresholds.performance && metrics.performance) {
      this.checkPerformanceThresholds(metrics.performance, thresholds.performance);
    }

    // Check accessibility thresholds
    if (thresholds.accessibility && metrics.accessibility) {
      this.checkAccessibilityThresholds(metrics.accessibility, thresholds.accessibility);
    }

    // Check type coverage thresholds
    if (thresholds.typeCoverage && metrics.typeCoverage) {
      this.checkTypeCoverageThresholds(metrics.typeCoverage, thresholds.typeCoverage);
    }

    // Check complexity thresholds
    if (thresholds.complexity && metrics.complexity) {
      this.checkComplexityThresholds(metrics.complexity, thresholds.complexity);
    }

    // Check documentation thresholds
    if (thresholds.documentation && metrics.documentation) {
      this.checkDocumentationThresholds(metrics.documentation, thresholds.documentation);
    }
  }

  /**
   * Check code quality thresholds
   */
  private checkCodeQualityThresholds(
    metrics: CodeQualityMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['codeQuality']>
  ) {
    if (thresholds.minScore !== undefined && metrics.score < thresholds.minScore) {
      this.addViolation('codeQuality.score', thresholds.minScore, metrics.score, 'error',
        `Code quality score ${metrics.score} is below minimum ${thresholds.minScore}`);
    }

    if (thresholds.maxTechnicalDebt !== undefined && metrics.technicalDebt > thresholds.maxTechnicalDebt) {
      this.addViolation('codeQuality.technicalDebt', thresholds.maxTechnicalDebt, metrics.technicalDebt, 'error',
        `Technical debt ${metrics.technicalDebt}h exceeds maximum ${thresholds.maxTechnicalDebt}h`);
    }

    if (thresholds.maxBlockerIssues !== undefined && metrics.issues.blocker > thresholds.maxBlockerIssues) {
      this.addViolation('codeQuality.blockerIssues', thresholds.maxBlockerIssues, metrics.issues.blocker, 'error',
        `Blocker issues ${metrics.issues.blocker} exceed maximum ${thresholds.maxBlockerIssues}`);
    }

    if (thresholds.maxCriticalIssues !== undefined && metrics.issues.critical > thresholds.maxCriticalIssues) {
      this.addViolation('codeQuality.criticalIssues', thresholds.maxCriticalIssues, metrics.issues.critical, 'error',
        `Critical issues ${metrics.issues.critical} exceed maximum ${thresholds.maxCriticalIssues}`);
    }
  }

  /**
   * Check bundle size thresholds
   */
  private checkBundleSizeThresholds(
    metrics: BundleSizeMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['bundleSize']>
  ) {
    if (thresholds.maxSize !== undefined && metrics.totalSize > thresholds.maxSize) {
      this.addViolation('bundleSize.totalSize', thresholds.maxSize, metrics.totalSize, 'error',
        `Bundle size ${this.formatBytes(metrics.totalSize)} exceeds maximum ${this.formatBytes(thresholds.maxSize)}`);
    }

    if (thresholds.maxChunks !== undefined && metrics.chunks.length > thresholds.maxChunks) {
      this.addViolation('bundleSize.chunks', thresholds.maxChunks, metrics.chunks.length, 'warning',
        `Number of chunks ${metrics.chunks.length} exceeds maximum ${thresholds.maxChunks}`);
    }
  }

  /**
   * Check performance thresholds
   */
  private checkPerformanceThresholds(
    metrics: PerformanceMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['performance']>
  ) {
    if (thresholds.minScore !== undefined && metrics.score < thresholds.minScore) {
      this.addViolation('performance.score', thresholds.minScore, metrics.score, 'error',
        `Performance score ${metrics.score} is below minimum ${thresholds.minScore}`);
    }

    if (thresholds.maxFCP !== undefined && metrics.firstContentfulPaint > thresholds.maxFCP) {
      this.addViolation('performance.fcp', thresholds.maxFCP, metrics.firstContentfulPaint, 'error',
        `First Contentful Paint ${metrics.firstContentfulPaint}ms exceeds maximum ${thresholds.maxFCP}ms`);
    }

    if (thresholds.maxTTI !== undefined && metrics.timeToInteractive > thresholds.maxTTI) {
      this.addViolation('performance.tti', thresholds.maxTTI, metrics.timeToInteractive, 'error',
        `Time to Interactive ${metrics.timeToInteractive}ms exceeds maximum ${thresholds.maxTTI}ms`);
    }

    if (thresholds.maxTBT !== undefined && metrics.totalBlockingTime > thresholds.maxTBT) {
      this.addViolation('performance.tbt', thresholds.maxTBT, metrics.totalBlockingTime, 'warning',
        `Total Blocking Time ${metrics.totalBlockingTime}ms exceeds maximum ${thresholds.maxTBT}ms`);
    }
  }

  /**
   * Check accessibility thresholds
   */
  private checkAccessibilityThresholds(
    metrics: AccessibilityMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['accessibility']>
  ) {
    if (thresholds.minScore !== undefined && metrics.score < thresholds.minScore) {
      this.addViolation('accessibility.score', thresholds.minScore, metrics.score, 'error',
        `Accessibility score ${metrics.score} is below minimum ${thresholds.minScore}`);
    }

    if (thresholds.maxViolations !== undefined && metrics.violations > thresholds.maxViolations) {
      this.addViolation('accessibility.violations', thresholds.maxViolations, metrics.violations, 'error',
        `Accessibility violations ${metrics.violations} exceed maximum ${thresholds.maxViolations}`);
    }

    if (thresholds.requireWCAG) {
      const level = thresholds.requireWCAG.toLowerCase() as 'a' | 'aa' | 'aaa';
      if (!metrics.wcagCompliance[level]) {
        this.addViolation('accessibility.wcag', 1, 0, 'error',
          `WCAG ${thresholds.requireWCAG} compliance required but not met`);
      }
    }
  }

  /**
   * Check type coverage thresholds
   */
  private checkTypeCoverageThresholds(
    metrics: TypeCoverageMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['typeCoverage']>
  ) {
    if (thresholds.minPercentage !== undefined && metrics.percentage < thresholds.minPercentage) {
      this.addViolation('typeCoverage.percentage', thresholds.minPercentage, metrics.percentage, 'error',
        `Type coverage ${metrics.percentage}% is below minimum ${thresholds.minPercentage}%`);
    }

    if (thresholds.maxAnyTypes !== undefined && metrics.any > thresholds.maxAnyTypes) {
      this.addViolation('typeCoverage.any', thresholds.maxAnyTypes, metrics.any, 'warning',
        `Any types ${metrics.any} exceed maximum ${thresholds.maxAnyTypes}`);
    }
  }

  /**
   * Check complexity thresholds
   */
  private checkComplexityThresholds(
    metrics: ComplexityMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['complexity']>
  ) {
    if (thresholds.maxAverage !== undefined && metrics.average > thresholds.maxAverage) {
      this.addViolation('complexity.average', thresholds.maxAverage, metrics.average, 'error',
        `Average complexity ${metrics.average} exceeds maximum ${thresholds.maxAverage}`);
    }

    if (thresholds.maxFunction !== undefined && metrics.max > thresholds.maxFunction) {
      this.addViolation('complexity.max', thresholds.maxFunction, metrics.max, 'error',
        `Maximum function complexity ${metrics.max} exceeds threshold ${thresholds.maxFunction}`);
    }
  }

  /**
   * Check documentation thresholds
   */
  private checkDocumentationThresholds(
    metrics: DocumentationMetrics,
    thresholds: NonNullable<QualityGateConfig['thresholds']['documentation']>
  ) {
    if (thresholds.minCoverage !== undefined && metrics.coverage < thresholds.minCoverage) {
      this.addViolation('documentation.coverage', thresholds.minCoverage, metrics.coverage, 'warning',
        `Documentation coverage ${metrics.coverage}% is below minimum ${thresholds.minCoverage}%`);
    }

    if (thresholds.requirePublicAPI && metrics.publicAPICoverage < 100) {
      this.addViolation('documentation.publicAPI', 100, metrics.publicAPICoverage, 'error',
        `Public API documentation ${metrics.publicAPICoverage}% is incomplete`);
    }
  }

  /**
   * Add violation
   */
  private addViolation(
    metric: string,
    threshold: number,
    actual: number,
    severity: 'error' | 'warning',
    message: string
  ) {
    this.violations.push({
      metric,
      threshold,
      actual,
      severity,
      message
    });
  }

  /**
   * Format bytes
   */
  private formatBytes(bytes: number): string {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  /**
   * Generate quality gate report
   */
  generateReport(result: MetricsResult): string {
    const lines: string[] = [
      '# Quality Gate Report',
      '',
      `**Status:** ${result.qualityGate?.passed ? '✅ PASSED' : '❌ FAILED'}`,
      `**Duration:** ${result.duration}ms`,
      `**Timestamp:** ${result.timestamp}`,
      ''
    ];

    if (result.qualityGate?.violations && result.qualityGate.violations.length > 0) {
      lines.push('## Violations');
      result.qualityGate.violations.forEach((violation, index) => {
        const emoji = violation.severity === 'error' ? '🚫' : '⚠️';
        lines.push(`${index + 1}. ${emoji} **${violation.metric}**`);
        lines.push(`   - ${violation.message}`);
        lines.push(`   - Threshold: ${violation.threshold}, Actual: ${violation.actual}`);
        lines.push('');
      });
    }

    // Add metrics summary
    lines.push('## Metrics Summary');
    
    if (result.metrics.codeQuality) {
      lines.push(`- Code Quality Score: ${result.metrics.codeQuality.score}/100`);
    }
    if (result.metrics.bundleSize) {
      lines.push(`- Bundle Size: ${this.formatBytes(result.metrics.bundleSize.totalSize)}`);
    }
    if (result.metrics.performance) {
      lines.push(`- Performance Score: ${result.metrics.performance.score}/100`);
    }
    if (result.metrics.accessibility) {
      lines.push(`- Accessibility Score: ${result.metrics.accessibility.score}/100`);
    }
    if (result.metrics.typeCoverage) {
      lines.push(`- Type Coverage: ${result.metrics.typeCoverage.percentage}%`);
    }
    if (result.metrics.complexity) {
      lines.push(`- Average Complexity: ${result.metrics.complexity.average}`);
    }
    if (result.metrics.documentation) {
      lines.push(`- Documentation Coverage: ${result.metrics.documentation.coverage}%`);
    }

    return lines.join('\n');
  }
}

/**
 * Create quality gate middleware for CI/CD
 */
export function createQualityGateMiddleware(config: QualityGateConfig) {
  const gate = new QualityGate(config);

  return {
    check: async () => {
      const result = await gate.runAllChecks();
      
      if (config.failOnViolation && !result.qualityGate?.passed) {
        const report = gate.generateReport(result);
        throw new Error(`Quality gate failed:\n${report}`);
      }
      
      return result;
    },
    
    report: async () => {
      const result = await gate.runAllChecks();
      return gate.generateReport(result);
    }
  };
}

/**
 * Default quality gate configuration
 */
export const defaultQualityGateConfig: QualityGateConfig = {
  enabled: true,
  failOnViolation: true,
  thresholds: {
    codeQuality: {
      minScore: 80,
      maxTechnicalDebt: 48,
      maxBlockerIssues: 0,
      maxCriticalIssues: 5
    },
    bundleSize: {
      maxSize: 500 * 1024, // 500KB
      maxChunks: 20
    },
    performance: {
      minScore: 75,
      maxFCP: 2000,
      maxTTI: 5000,
      maxTBT: 300
    },
    accessibility: {
      minScore: 90,
      maxViolations: 5,
      requireWCAG: 'AA'
    },
    typeCoverage: {
      minPercentage: 80,
      maxAnyTypes: 10
    },
    complexity: {
      maxAverage: 5,
      maxFunction: 15
    },
    documentation: {
      minCoverage: 70,
      requirePublicAPI: true
    }
  }
};