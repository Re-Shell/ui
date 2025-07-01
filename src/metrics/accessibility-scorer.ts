import { AxePuppeteer } from '@axe-core/puppeteer';
import type { AccessibilityMetrics, AccessibilityIssue } from './types';

/**
 * Re-Shell UI Accessibility Score Tracker
 * Measures and tracks component accessibility compliance
 */
export class AccessibilityScorer {
  private page: any;
  private options: AccessibilityScorerOptions;

  constructor(options: AccessibilityScorerOptions = {}) {
    this.options = {
      wcagLevel: 'AA',
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      ...options
    };
  }

  /**
   * Set the page instance for testing
   */
  setPage(page: any) {
    this.page = page;
  }

  /**
   * Run accessibility audit on current page
   */
  async audit(selector?: string): Promise<AccessibilityMetrics> {
    if (!this.page) {
      throw new Error('Page not set. Call setPage() first.');
    }

    const axe = new AxePuppeteer(this.page);
    
    if (selector) {
      axe.include(selector);
    }

    if (this.options.runOnly) {
      axe.withTags(this.options.runOnly);
    }

    const results = await axe.analyze();
    return this.processResults(results);
  }

  /**
   * Process axe-core results into metrics
   */
  private processResults(results: any): AccessibilityMetrics {
    const violations = results.violations || [];
    const passes = results.passes || [];
    const incomplete = results.incomplete || [];
    const inapplicable = results.inapplicable || [];

    // Calculate score (100 - penalty for violations)
    const score = this.calculateScore(violations);

    // Categorize violations
    const categories = this.categorizeViolations(violations);

    // Get top issues
    const topIssues = this.getTopIssues(violations);

    // Check WCAG compliance
    const wcagCompliance = this.checkWCAGCompliance(violations);

    return {
      score,
      violations: violations.length,
      warnings: incomplete.length,
      passes: passes.length,
      incomplete: incomplete.length,
      wcagCompliance,
      categories,
      topIssues
    };
  }

  /**
   * Calculate accessibility score
   */
  private calculateScore(violations: any[]): number {
    if (violations.length === 0) return 100;

    let penalty = 0;
    
    violations.forEach(violation => {
      const impact = violation.impact;
      const count = violation.nodes?.length || 1;
      
      switch (impact) {
        case 'critical':
          penalty += count * 10;
          break;
        case 'serious':
          penalty += count * 5;
          break;
        case 'moderate':
          penalty += count * 3;
          break;
        case 'minor':
          penalty += count * 1;
          break;
      }
    });

    return Math.max(0, 100 - penalty);
  }

  /**
   * Categorize violations by type
   */
  private categorizeViolations(violations: any[]): AccessibilityMetrics['categories'] {
    const categories = {
      aria: 0,
      color: 0,
      names: 0,
      navigation: 0,
      semantics: 0,
      keyboard: 0,
      screenReader: 0
    };

    violations.forEach(violation => {
      const tags = violation.tags || [];
      
      if (tags.includes('cat.aria')) categories.aria++;
      if (tags.includes('cat.color')) categories.color++;
      if (tags.includes('cat.name-role-value')) categories.names++;
      if (tags.includes('cat.keyboard')) categories.keyboard++;
      if (tags.includes('cat.semantics')) categories.semantics++;
      if (tags.includes('cat.sensory-and-visual-cues')) categories.screenReader++;
      if (tags.includes('cat.structure')) categories.navigation++;
    });

    return categories;
  }

  /**
   * Get top accessibility issues
   */
  private getTopIssues(violations: any[]): AccessibilityIssue[] {
    return violations
      .map(violation => ({
        id: violation.id,
        impact: violation.impact as AccessibilityIssue['impact'],
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        count: violation.nodes?.length || 1,
        elements: violation.nodes?.map((node: any) => node.target).slice(0, 3) || []
      }))
      .sort((a, b) => {
        // Sort by impact severity then by count
        const impactOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 };
        const impactDiff = impactOrder[a.impact] - impactOrder[b.impact];
        return impactDiff !== 0 ? impactDiff : b.count - a.count;
      })
      .slice(0, 10); // Top 10 issues
  }

  /**
   * Check WCAG compliance levels
   */
  private checkWCAGCompliance(violations: any[]): AccessibilityMetrics['wcagCompliance'] {
    const wcagViolations = {
      a: false,
      aa: false,
      aaa: false
    };

    violations.forEach(violation => {
      const tags = violation.tags || [];
      
      if (tags.includes('wcag2a') || tags.includes('wcag21a')) {
        wcagViolations.a = true;
      }
      if (tags.includes('wcag2aa') || tags.includes('wcag21aa')) {
        wcagViolations.aa = true;
      }
      if (tags.includes('wcag2aaa') || tags.includes('wcag21aaa')) {
        wcagViolations.aaa = true;
      }
    });

    return {
      a: !wcagViolations.a,
      aa: !wcagViolations.aa,
      aaa: !wcagViolations.aaa
    };
  }

  /**
   * Audit multiple components
   */
  async auditComponents(components: ComponentAuditConfig[]): Promise<ComponentAuditResult[]> {
    const results: ComponentAuditResult[] = [];

    for (const component of components) {
      try {
        const metrics = await this.audit(component.selector);
        results.push({
          name: component.name,
          selector: component.selector,
          metrics,
          passed: metrics.violations === 0
        });
      } catch (error) {
        results.push({
          name: component.name,
          selector: component.selector,
          error: error instanceof Error ? error.message : 'Unknown error',
          passed: false
        });
      }
    }

    return results;
  }

  /**
   * Generate accessibility report
   */
  generateReport(metrics: AccessibilityMetrics): string {
    const lines: string[] = [
      '# Accessibility Report',
      '',
      `## Overall Score: ${metrics.score}/100`,
      '',
      '### WCAG Compliance',
      `- Level A: ${metrics.wcagCompliance.a ? '✅ Passed' : '❌ Failed'}`,
      `- Level AA: ${metrics.wcagCompliance.aa ? '✅ Passed' : '❌ Failed'}`,
      `- Level AAA: ${metrics.wcagCompliance.aaa ? '✅ Passed' : '❌ Failed'}`,
      '',
      '### Summary',
      `- Violations: ${metrics.violations}`,
      `- Warnings: ${metrics.warnings}`,
      `- Passes: ${metrics.passes}`,
      `- Incomplete: ${metrics.incomplete}`,
      '',
      '### Categories',
      `- ARIA: ${metrics.categories.aria} issues`,
      `- Color Contrast: ${metrics.categories.color} issues`,
      `- Names & Labels: ${metrics.categories.names} issues`,
      `- Keyboard Navigation: ${metrics.categories.keyboard} issues`,
      `- Semantics: ${metrics.categories.semantics} issues`,
      `- Screen Reader: ${metrics.categories.screenReader} issues`,
      `- Structure: ${metrics.categories.navigation} issues`,
      ''
    ];

    if (metrics.topIssues.length > 0) {
      lines.push('### Top Issues');
      metrics.topIssues.forEach((issue, index) => {
        lines.push(`${index + 1}. **${issue.help}** (${issue.impact})`);
        lines.push(`   - ${issue.description}`);
        lines.push(`   - Affects ${issue.count} element(s)`);
        lines.push(`   - [Learn more](${issue.helpUrl})`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

export interface AccessibilityScorerOptions {
  wcagLevel?: 'A' | 'AA' | 'AAA';
  runOnly?: string[];
  rules?: Record<string, any>;
}

export interface ComponentAuditConfig {
  name: string;
  selector: string;
  expectedScore?: number;
}

export interface ComponentAuditResult {
  name: string;
  selector: string;
  metrics?: AccessibilityMetrics;
  error?: string;
  passed: boolean;
}

/**
 * Run accessibility audit on a URL
 */
export async function auditURL(
  browser: any,
  url: string,
  options?: AccessibilityScorerOptions
): Promise<AccessibilityMetrics> {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  
  const scorer = new AccessibilityScorer(options);
  scorer.setPage(page);
  
  const metrics = await scorer.audit();
  await page.close();
  
  return metrics;
}

/**
 * Create accessibility middleware for testing
 */
export function createAccessibilityMiddleware(options?: AccessibilityScorerOptions) {
  const scorer = new AccessibilityScorer(options);
  
  return {
    beforeEach: (page: any) => {
      scorer.setPage(page);
    },
    
    audit: async (selector?: string) => {
      return scorer.audit(selector);
    },
    
    expectNoViolations: async (selector?: string) => {
      const metrics = await scorer.audit(selector);
      if (metrics.violations > 0) {
        const report = scorer.generateReport(metrics);
        throw new Error(`Accessibility violations found:\n${report}`);
      }
    },
    
    expectScore: async (minScore: number, selector?: string) => {
      const metrics = await scorer.audit(selector);
      if (metrics.score < minScore) {
        throw new Error(`Accessibility score ${metrics.score} is below minimum ${minScore}`);
      }
    }
  };
}