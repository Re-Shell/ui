import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Coverage reporting and badge generation for Re-Shell UI
 */

export interface CoverageReport {
  total: {
    lines: CoverageMetric;
    statements: CoverageMetric;
    functions: CoverageMetric;
    branches: CoverageMetric;
  };
  files: Record<string, FileCoverage>;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface FileCoverage {
  lines: CoverageMetric;
  statements: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  path: string;
}

/**
 * Badge generator for coverage metrics
 */
export class CoverageBadgeGenerator {
  private static readonly colors = {
    excellent: '#4c1', // > 90%
    good: '#97ca00',  // > 80%
    acceptable: '#a4a61d', // > 70%
    medium: '#dfb317', // > 60%
    low: '#fe7d37', // > 50%
    poor: '#e05d44', // <= 50%
  };

  static getColor(percentage: number): string {
    if (percentage > 90) return this.colors.excellent;
    if (percentage > 80) return this.colors.good;
    if (percentage > 70) return this.colors.acceptable;
    if (percentage > 60) return this.colors.medium;
    if (percentage > 50) return this.colors.low;
    return this.colors.poor;
  }

  static generateBadge(label: string, percentage: number): string {
    const color = this.getColor(percentage);
    const value = `${percentage.toFixed(1)}%`;
    
    // SVG badge template
    const width = 104;
    const labelWidth = 60;
    const valueWidth = width - labelWidth;
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="${labelWidth * 10 / 2}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth - 10) * 10}">${label}</text>
    <text x="${labelWidth * 10 / 2}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth - 10) * 10}">${label}</text>
    <text aria-hidden="true" x="${(labelWidth + valueWidth / 2) * 10}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(valueWidth - 10) * 10}">${value}</text>
    <text x="${(labelWidth + valueWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(valueWidth - 10) * 10}">${value}</text>
  </g>
</svg>`;
  }

  static generateShieldsBadgeUrl(label: string, percentage: number): string {
    const color = this.getColor(percentage);
    const value = `${percentage.toFixed(1)}%25`; // URL encode %
    const colorName = color.replace('#', '');
    
    return `https://img.shields.io/badge/${encodeURIComponent(label)}-${value}-${colorName}`;
  }
}

/**
 * Coverage report parser
 */
export class CoverageReportParser {
  static parseLcovFile(lcovPath: string): CoverageReport {
    if (!existsSync(lcovPath)) {
      throw new Error(`LCOV file not found: ${lcovPath}`);
    }

    const lcovContent = readFileSync(lcovPath, 'utf-8');
    const files: Record<string, FileCoverage> = {};
    let currentFile: string | null = null;

    const lines = lcovContent.split('\n');
    const fileData: Record<string, any> = {};

    lines.forEach(line => {
      if (line.startsWith('SF:')) {
        currentFile = line.substring(3);
        fileData[currentFile] = {
          lines: { found: 0, hit: 0 },
          functions: { found: 0, hit: 0 },
          branches: { found: 0, hit: 0 },
        };
      } else if (currentFile) {
        const data = fileData[currentFile];
        
        if (line.startsWith('FNF:')) {
          data.functions.found = parseInt(line.substring(4));
        } else if (line.startsWith('FNH:')) {
          data.functions.hit = parseInt(line.substring(4));
        } else if (line.startsWith('LF:')) {
          data.lines.found = parseInt(line.substring(3));
        } else if (line.startsWith('LH:')) {
          data.lines.hit = parseInt(line.substring(3));
        } else if (line.startsWith('BRF:')) {
          data.branches.found = parseInt(line.substring(4));
        } else if (line.startsWith('BRH:')) {
          data.branches.hit = parseInt(line.substring(4));
        }
      }
    });

    // Convert to CoverageReport format
    Object.entries(fileData).forEach(([path, data]) => {
      files[path] = {
        path,
        lines: {
          total: data.lines.found,
          covered: data.lines.hit,
          skipped: 0,
          pct: data.lines.found > 0 ? (data.lines.hit / data.lines.found) * 100 : 0,
        },
        statements: {
          total: data.lines.found,
          covered: data.lines.hit,
          skipped: 0,
          pct: data.lines.found > 0 ? (data.lines.hit / data.lines.found) * 100 : 0,
        },
        functions: {
          total: data.functions.found,
          covered: data.functions.hit,
          skipped: 0,
          pct: data.functions.found > 0 ? (data.functions.hit / data.functions.found) * 100 : 0,
        },
        branches: {
          total: data.branches.found,
          covered: data.branches.hit,
          skipped: 0,
          pct: data.branches.found > 0 ? (data.branches.hit / data.branches.found) * 100 : 0,
        },
      };
    });

    // Calculate totals
    const total = {
      lines: this.calculateTotal(files, 'lines'),
      statements: this.calculateTotal(files, 'statements'),
      functions: this.calculateTotal(files, 'functions'),
      branches: this.calculateTotal(files, 'branches'),
    };

    return { total, files };
  }

  private static calculateTotal(
    files: Record<string, FileCoverage>,
    metric: keyof FileCoverage
  ): CoverageMetric {
    const values = Object.values(files).map(f => f[metric] as CoverageMetric);
    const total = values.reduce((sum, v) => sum + v.total, 0);
    const covered = values.reduce((sum, v) => sum + v.covered, 0);
    const skipped = values.reduce((sum, v) => sum + v.skipped, 0);
    
    return {
      total,
      covered,
      skipped,
      pct: total > 0 ? (covered / total) * 100 : 0,
    };
  }

  static parseJsonSummary(jsonPath: string): CoverageReport {
    if (!existsSync(jsonPath)) {
      throw new Error(`JSON coverage file not found: ${jsonPath}`);
    }

    const jsonContent = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    return jsonContent as CoverageReport;
  }
}

/**
 * Coverage report generator
 */
export class CoverageReportGenerator {
  constructor(
    private outputDir: string = './coverage',
    private badgeDir: string = './badges'
  ) {
    // Ensure directories exist
    [outputDir, badgeDir].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });
  }

  async generateReport(coverageData: CoverageReport): Promise<void> {
    // Generate summary markdown
    const summary = this.generateMarkdownSummary(coverageData);
    writeFileSync(join(this.outputDir, 'COVERAGE.md'), summary);

    // Generate badges
    await this.generateBadges(coverageData);

    // Generate detailed HTML report
    const htmlReport = this.generateHtmlReport(coverageData);
    writeFileSync(join(this.outputDir, 'coverage-report.html'), htmlReport);

    // Generate JSON for programmatic access
    writeFileSync(
      join(this.outputDir, 'coverage-summary.json'),
      JSON.stringify(coverageData, null, 2)
    );
  }

  private generateMarkdownSummary(coverage: CoverageReport): string {
    const { total } = coverage;
    
    return `# Coverage Report

Generated on: ${new Date().toISOString()}

## Summary

| Metric | Coverage | Total | Covered | Skipped |
|--------|----------|-------|---------|---------|
| Lines | ${total.lines.pct.toFixed(2)}% | ${total.lines.total} | ${total.lines.covered} | ${total.lines.skipped} |
| Statements | ${total.statements.pct.toFixed(2)}% | ${total.statements.total} | ${total.statements.covered} | ${total.statements.skipped} |
| Functions | ${total.functions.pct.toFixed(2)}% | ${total.functions.total} | ${total.functions.covered} | ${total.functions.skipped} |
| Branches | ${total.branches.pct.toFixed(2)}% | ${total.branches.total} | ${total.branches.covered} | ${total.branches.skipped} |

## Badges

![Lines Coverage](./badges/badge-lines.svg)
![Statements Coverage](./badges/badge-statements.svg)
![Functions Coverage](./badges/badge-functions.svg)
![Branches Coverage](./badges/badge-branches.svg)

## File Coverage

| File | Lines | Statements | Functions | Branches |
|------|-------|------------|-----------|----------|
${Object.entries(coverage.files)
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([path, file]) => 
    `| ${path} | ${file.lines.pct.toFixed(1)}% | ${file.statements.pct.toFixed(1)}% | ${file.functions.pct.toFixed(1)}% | ${file.branches.pct.toFixed(1)}% |`
  )
  .join('\n')}
`;
  }

  private async generateBadges(coverage: CoverageReport): Promise<void> {
    const badges = [
      { name: 'lines', label: 'Lines', value: coverage.total.lines.pct },
      { name: 'statements', label: 'Statements', value: coverage.total.statements.pct },
      { name: 'functions', label: 'Functions', value: coverage.total.functions.pct },
      { name: 'branches', label: 'Branches', value: coverage.total.branches.pct },
    ];

    badges.forEach(({ name, label, value }) => {
      const svg = CoverageBadgeGenerator.generateBadge(label, value);
      writeFileSync(join(this.badgeDir, `badge-${name}.svg`), svg);
    });

    // Also generate a combined coverage badge
    const overallCoverage = (
      coverage.total.lines.pct +
      coverage.total.statements.pct +
      coverage.total.functions.pct +
      coverage.total.branches.pct
    ) / 4;

    const overallSvg = CoverageBadgeGenerator.generateBadge('Coverage', overallCoverage);
    writeFileSync(join(this.badgeDir, 'badge-coverage.svg'), overallSvg);
  }

  private generateHtmlReport(coverage: CoverageReport): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Re-Shell UI Coverage Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin: 10px; padding: 10px; background: white; border-radius: 4px; }
    .high { color: #4c1; }
    .medium { color: #dfb317; }
    .low { color: #e05d44; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
    .progress { width: 100px; height: 20px; background: #eee; border-radius: 10px; overflow: hidden; }
    .progress-bar { height: 100%; transition: width 0.3s; }
  </style>
</head>
<body>
  <h1>Re-Shell UI Coverage Report</h1>
  
  <div class="summary">
    <h2>Overall Coverage</h2>
    ${Object.entries(coverage.total).map(([metric, data]) => `
      <div class="metric">
        <strong>${metric.charAt(0).toUpperCase() + metric.slice(1)}</strong>
        <div class="${data.pct > 80 ? 'high' : data.pct > 60 ? 'medium' : 'low'}">
          ${data.pct.toFixed(2)}%
        </div>
        <div>${data.covered}/${data.total}</div>
      </div>
    `).join('')}
  </div>

  <h2>File Coverage</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Lines</th>
        <th>Statements</th>
        <th>Functions</th>
        <th>Branches</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(coverage.files).map(([path, file]) => `
        <tr>
          <td>${path}</td>
          <td>
            <div class="progress">
              <div class="progress-bar ${file.lines.pct > 80 ? 'high' : file.lines.pct > 60 ? 'medium' : 'low'}" 
                   style="width: ${file.lines.pct}%; background: ${CoverageBadgeGenerator.getColor(file.lines.pct)}">
              </div>
            </div>
            ${file.lines.pct.toFixed(1)}%
          </td>
          <td>${file.statements.pct.toFixed(1)}%</td>
          <td>${file.functions.pct.toFixed(1)}%</td>
          <td>${file.branches.pct.toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <p>Generated on ${new Date().toLocaleString()}</p>
</body>
</html>`;
  }
}

/**
 * Coverage threshold validator
 */
export class CoverageThresholdValidator {
  static validate(
    coverage: CoverageReport,
    thresholds: {
      lines?: number;
      statements?: number;
      functions?: number;
      branches?: number;
      global?: number;
    }
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    if (thresholds.lines && coverage.total.lines.pct < thresholds.lines) {
      failures.push(`Lines coverage ${coverage.total.lines.pct.toFixed(2)}% is below threshold ${thresholds.lines}%`);
    }

    if (thresholds.statements && coverage.total.statements.pct < thresholds.statements) {
      failures.push(`Statements coverage ${coverage.total.statements.pct.toFixed(2)}% is below threshold ${thresholds.statements}%`);
    }

    if (thresholds.functions && coverage.total.functions.pct < thresholds.functions) {
      failures.push(`Functions coverage ${coverage.total.functions.pct.toFixed(2)}% is below threshold ${thresholds.functions}%`);
    }

    if (thresholds.branches && coverage.total.branches.pct < thresholds.branches) {
      failures.push(`Branches coverage ${coverage.total.branches.pct.toFixed(2)}% is below threshold ${thresholds.branches}%`);
    }

    if (thresholds.global) {
      const globalCoverage = (
        coverage.total.lines.pct +
        coverage.total.statements.pct +
        coverage.total.functions.pct +
        coverage.total.branches.pct
      ) / 4;

      if (globalCoverage < thresholds.global) {
        failures.push(`Global coverage ${globalCoverage.toFixed(2)}% is below threshold ${thresholds.global}%`);
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }
}