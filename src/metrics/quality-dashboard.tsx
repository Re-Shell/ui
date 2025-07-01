import React from 'react';
import { Card, CardHeader, CardBody } from '../Card';
import { Badge } from '../Badge';
import { Progress } from '../Progress';
import { 
  CodeQualityMetrics, 
  BundleSizeMetrics, 
  PerformanceMetrics,
  AccessibilityMetrics,
  TypeCoverageMetrics,
  ComplexityMetrics,
  DocumentationMetrics,
  APIStabilityMetrics
} from './types';

/**
 * Re-Shell UI Quality Metrics Dashboard
 * Comprehensive view of code quality, performance, and health metrics
 */
export interface QualityDashboardProps {
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
  onRefresh?: () => void;
}

export function QualityDashboard({ metrics, onRefresh }: QualityDashboardProps) {
  return (
    <div className="quality-dashboard grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Code Quality Metrics */}
      {metrics.codeQuality && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Code Quality</h3>
            <Badge variant={getQualityBadgeVariant(metrics.codeQuality.score)}>
              Score: {metrics.codeQuality.score}/100
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <MetricRow label="Maintainability" value={metrics.codeQuality.maintainability} />
              <MetricRow label="Reliability" value={metrics.codeQuality.reliability} />
              <MetricRow label="Security" value={metrics.codeQuality.security} />
              <MetricRow label="Technical Debt" value={`${metrics.codeQuality.technicalDebt}h`} isDebt />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Bundle Size Metrics */}
      {metrics.bundleSize && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Bundle Size</h3>
            <Badge variant={getBundleSizeBadgeVariant(metrics.bundleSize.totalSize)}>
              {formatBytes(metrics.bundleSize.totalSize)}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <MetricRow label="Main Bundle" value={formatBytes(metrics.bundleSize.mainBundle)} />
              <MetricRow label="CSS" value={formatBytes(metrics.bundleSize.css)} />
              <MetricRow label="Gzipped" value={formatBytes(metrics.bundleSize.gzipped)} />
              <Progress value={metrics.bundleSize.budgetUsage} max={100} />
              <span className="text-sm text-gray-600">Budget Usage: {metrics.bundleSize.budgetUsage}%</span>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics.performance && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Performance</h3>
            <Badge variant={getPerformanceBadgeVariant(metrics.performance.score)}>
              Score: {metrics.performance.score}/100
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <MetricRow label="First Paint" value={`${metrics.performance.firstPaint}ms`} />
              <MetricRow label="TTI" value={`${metrics.performance.timeToInteractive}ms`} />
              <MetricRow label="Speed Index" value={`${metrics.performance.speedIndex}ms`} />
              <MetricRow label="Main Thread" value={`${metrics.performance.mainThreadWork}ms`} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Accessibility Metrics */}
      {metrics.accessibility && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Accessibility</h3>
            <Badge variant={getAccessibilityBadgeVariant(metrics.accessibility.score)}>
              Score: {metrics.accessibility.score}/100
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <MetricRow label="Violations" value={metrics.accessibility.violations} isError={metrics.accessibility.violations > 0} />
              <MetricRow label="Warnings" value={metrics.accessibility.warnings} isWarning={metrics.accessibility.warnings > 0} />
              <MetricRow label="WCAG AA" value={metrics.accessibility.wcagCompliance.aa ? '✓' : '✗'} />
              <MetricRow label="WCAG AAA" value={metrics.accessibility.wcagCompliance.aaa ? '✓' : '✗'} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Type Coverage Metrics */}
      {metrics.typeCoverage && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Type Coverage</h3>
            <Badge variant={getTypeCoverageBadgeVariant(metrics.typeCoverage.percentage)}>
              {metrics.typeCoverage.percentage}%
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <Progress value={metrics.typeCoverage.percentage} max={100} />
              <MetricRow label="Typed" value={metrics.typeCoverage.typed} />
              <MetricRow label="Any Types" value={metrics.typeCoverage.any} isWarning={metrics.typeCoverage.any > 0} />
              <MetricRow label="Unknown" value={metrics.typeCoverage.unknown} isWarning={metrics.typeCoverage.unknown > 0} />
            </div>
          </CardBody>
        </Card>
      )}

      {/* Complexity Metrics */}
      {metrics.complexity && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Code Complexity</h3>
            <Badge variant={getComplexityBadgeVariant(metrics.complexity.average)}>
              Avg: {metrics.complexity.average.toFixed(1)}
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              <MetricRow label="Max Complexity" value={metrics.complexity.max} isWarning={metrics.complexity.max > 10} />
              <MetricRow label="High Complexity" value={metrics.complexity.high} isWarning={metrics.complexity.high > 0} />
              <MetricRow label="Medium" value={metrics.complexity.medium} />
              <MetricRow label="Low" value={metrics.complexity.low} />
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

// Helper Components
interface MetricRowProps {
  label: string;
  value: string | number;
  isError?: boolean;
  isWarning?: boolean;
  isDebt?: boolean;
}

function MetricRow({ label, value, isError, isWarning, isDebt }: MetricRowProps) {
  const valueClass = isError ? 'text-red-600' : isWarning ? 'text-yellow-600' : isDebt ? 'text-orange-600' : '';
  
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}:</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

// Helper Functions
function getQualityBadgeVariant(score: number): string {
  if (score >= 90) return 'success';
  if (score >= 70) return 'warning';
  return 'error';
}

function getBundleSizeBadgeVariant(size: number): string {
  const kb = size / 1024;
  if (kb < 100) return 'success';
  if (kb < 200) return 'warning';
  return 'error';
}

function getPerformanceBadgeVariant(score: number): string {
  if (score >= 90) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

function getAccessibilityBadgeVariant(score: number): string {
  if (score === 100) return 'success';
  if (score >= 90) return 'warning';
  return 'error';
}

function getTypeCoverageBadgeVariant(percentage: number): string {
  if (percentage >= 95) return 'success';
  if (percentage >= 80) return 'warning';
  return 'error';
}

function getComplexityBadgeVariant(avg: number): string {
  if (avg <= 5) return 'success';
  if (avg <= 10) return 'warning';
  return 'error';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}