import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import * as ts from 'typescript';
import type { TypeCoverageMetrics, FileTypeCoverage } from './types';

/**
 * Re-Shell UI Type Coverage Reporter
 * Analyzes TypeScript type coverage and reports on type safety
 */
export class TypeCoverageReporter {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private sourceFiles: ts.SourceFile[];

  constructor(configPath: string = './tsconfig.json') {
    const config = this.loadTsConfig(configPath);
    this.program = ts.createProgram(config.fileNames, config.options);
    this.checker = this.program.getTypeChecker();
    this.sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && !sf.fileName.includes('node_modules'));
  }

  /**
   * Analyze type coverage across the codebase
   */
  analyze(): TypeCoverageMetrics {
    const files: FileTypeCoverage[] = [];
    let totalNodes = 0;
    let typedNodes = 0;
    let anyNodes = 0;
    let unknownNodes = 0;

    for (const sourceFile of this.sourceFiles) {
      const fileCoverage = this.analyzeFile(sourceFile);
      files.push(fileCoverage);
      
      totalNodes += fileCoverage.total;
      typedNodes += fileCoverage.typed;
      anyNodes += fileCoverage.any;
      unknownNodes += fileCoverage.unknown;
    }

    const percentage = totalNodes > 0 ? Math.round((typedNodes / totalNodes) * 100) : 100;
    const compilerOptions = this.program.getCompilerOptions();

    return {
      percentage,
      typed: typedNodes,
      any: anyNodes,
      unknown: unknownNodes,
      total: totalNodes,
      files: files.sort((a, b) => a.percentage - b.percentage), // Sort by lowest coverage first
      strict: !!compilerOptions.strict,
      noImplicitAny: !!compilerOptions.noImplicitAny,
      strictNullChecks: !!compilerOptions.strictNullChecks
    };
  }

  /**
   * Analyze a single file
   */
  private analyzeFile(sourceFile: ts.SourceFile): FileTypeCoverage {
    let total = 0;
    let typed = 0;
    let anyCount = 0;
    let unknownCount = 0;

    const visit = (node: ts.Node) => {
      // Skip certain node types that don't need type checking
      if (this.shouldSkipNode(node)) {
        ts.forEachChild(node, visit);
        return;
      }

      // Check if node has a type that needs coverage
      if (this.needsTypeCoverage(node)) {
        total++;
        
        const type = this.checker.getTypeAtLocation(node);
        const typeString = this.checker.typeToString(type);
        
        if (this.isAnyType(type)) {
          anyCount++;
        } else if (this.isUnknownType(type)) {
          unknownCount++;
        } else if (this.isTyped(type)) {
          typed++;
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    const percentage = total > 0 ? Math.round((typed / total) * 100) : 100;

    return {
      path: this.getRelativePath(sourceFile.fileName),
      percentage,
      typed,
      any: anyCount,
      unknown: unknownCount,
      total
    };
  }

  /**
   * Check if node should be skipped
   */
  private shouldSkipNode(node: ts.Node): boolean {
    // Skip type-only declarations
    if (ts.isTypeAliasDeclaration(node) || 
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeParameterDeclaration(node)) {
      return true;
    }

    // Skip imports/exports
    if (ts.isImportDeclaration(node) || 
        ts.isExportDeclaration(node) ||
        ts.isImportClause(node)) {
      return true;
    }

    return false;
  }

  /**
   * Check if node needs type coverage
   */
  private needsTypeCoverage(node: ts.Node): boolean {
    return ts.isVariableDeclaration(node) ||
           ts.isParameter(node) ||
           ts.isPropertyDeclaration(node) ||
           ts.isPropertySignature(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isMethodSignature(node) ||
           ts.isFunctionDeclaration(node) ||
           ts.isArrowFunction(node) ||
           ts.isFunctionExpression(node) ||
           ts.isGetAccessor(node) ||
           ts.isSetAccessor(node);
  }

  /**
   * Check if type is 'any'
   */
  private isAnyType(type: ts.Type): boolean {
    return !!(type.flags & ts.TypeFlags.Any);
  }

  /**
   * Check if type is 'unknown'
   */
  private isUnknownType(type: ts.Type): boolean {
    return !!(type.flags & ts.TypeFlags.Unknown);
  }

  /**
   * Check if type is properly typed
   */
  private isTyped(type: ts.Type): boolean {
    // Type is considered typed if it's not any, unknown, or void
    return !(type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Void));
  }

  /**
   * Get relative path
   */
  private getRelativePath(filePath: string): string {
    const cwd = process.cwd();
    return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
  }

  /**
   * Load TypeScript configuration
   */
  private loadTsConfig(configPath: string): ts.ParsedCommandLine {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (configFile.error) {
      throw new Error(`Error reading tsconfig: ${configFile.error.messageText}`);
    }

    const basePath = join(configPath, '..');
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      basePath
    );

    return parsedConfig;
  }

  /**
   * Find unsafe type patterns
   */
  findUnsafePatterns(): UnsafeTypePattern[] {
    const patterns: UnsafeTypePattern[] = [];

    for (const sourceFile of this.sourceFiles) {
      const filePatterns = this.findFileUnsafePatterns(sourceFile);
      patterns.push(...filePatterns);
    }

    return patterns;
  }

  /**
   * Find unsafe patterns in a file
   */
  private findFileUnsafePatterns(sourceFile: ts.SourceFile): UnsafeTypePattern[] {
    const patterns: UnsafeTypePattern[] = [];
    const filePath = this.getRelativePath(sourceFile.fileName);

    const visit = (node: ts.Node) => {
      // Check for 'as any' assertions
      if (ts.isAsExpression(node) || ts.isTypeAssertion(node)) {
        const type = this.checker.getTypeAtLocation(node);
        if (this.isAnyType(type)) {
          patterns.push({
            type: 'any-assertion',
            file: filePath,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            code: node.getText(sourceFile),
            suggestion: 'Use proper type assertion or fix underlying type issue'
          });
        }
      }

      // Check for implicit any in function parameters
      if (ts.isParameter(node) && !node.type) {
        const type = this.checker.getTypeAtLocation(node);
        if (this.isAnyType(type)) {
          patterns.push({
            type: 'implicit-any',
            file: filePath,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            code: node.getText(sourceFile),
            suggestion: 'Add explicit type annotation'
          });
        }
      }

      // Check for any in type annotations
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        patterns.push({
          type: 'explicit-any',
          file: filePath,
          line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
          code: node.parent.getText(sourceFile),
          suggestion: 'Replace with specific type or unknown'
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return patterns;
  }

  /**
   * Generate type coverage report
   */
  generateReport(metrics: TypeCoverageMetrics): string {
    const lines: string[] = [
      '# Type Coverage Report',
      '',
      `## Overall Coverage: ${metrics.percentage}%`,
      '',
      '### Statistics',
      `- Total nodes: ${metrics.total}`,
      `- Typed nodes: ${metrics.typed} (${metrics.percentage}%)`,
      `- Any types: ${metrics.any}`,
      `- Unknown types: ${metrics.unknown}`,
      '',
      '### Compiler Settings',
      `- Strict mode: ${metrics.strict ? '✅' : '❌'}`,
      `- No implicit any: ${metrics.noImplicitAny ? '✅' : '❌'}`,
      `- Strict null checks: ${metrics.strictNullChecks ? '✅' : '❌'}`,
      ''
    ];

    // Files with lowest coverage
    const lowCoverageFiles = metrics.files.filter(f => f.percentage < 90);
    if (lowCoverageFiles.length > 0) {
      lines.push('### Files Needing Attention');
      lowCoverageFiles.slice(0, 10).forEach(file => {
        lines.push(`- ${file.path}: ${file.percentage}% (${file.any} any, ${file.unknown} unknown)`);
      });
      lines.push('');
    }

    // Summary by coverage ranges
    const ranges = {
      excellent: metrics.files.filter(f => f.percentage >= 95).length,
      good: metrics.files.filter(f => f.percentage >= 80 && f.percentage < 95).length,
      needs_work: metrics.files.filter(f => f.percentage >= 60 && f.percentage < 80).length,
      poor: metrics.files.filter(f => f.percentage < 60).length
    };

    lines.push('### Coverage Distribution');
    lines.push(`- Excellent (95-100%): ${ranges.excellent} files`);
    lines.push(`- Good (80-94%): ${ranges.good} files`);
    lines.push(`- Needs Work (60-79%): ${ranges.needs_work} files`);
    lines.push(`- Poor (<60%): ${ranges.poor} files`);

    return lines.join('\n');
  }
}

export interface UnsafeTypePattern {
  type: 'any-assertion' | 'implicit-any' | 'explicit-any' | 'unsafe-cast';
  file: string;
  line: number;
  code: string;
  suggestion: string;
}

/**
 * Create type coverage middleware for CI/CD
 */
export function createTypeCoverageMiddleware(minCoverage: number = 80) {
  return {
    check: async (configPath?: string) => {
      const reporter = new TypeCoverageReporter(configPath);
      const metrics = reporter.analyze();
      
      if (metrics.percentage < minCoverage) {
        const report = reporter.generateReport(metrics);
        throw new Error(
          `Type coverage ${metrics.percentage}% is below minimum ${minCoverage}%\n${report}`
        );
      }
      
      return metrics;
    },
    
    report: async (configPath?: string) => {
      const reporter = new TypeCoverageReporter(configPath);
      const metrics = reporter.analyze();
      return reporter.generateReport(metrics);
    },
    
    findUnsafe: async (configPath?: string) => {
      const reporter = new TypeCoverageReporter(configPath);
      return reporter.findUnsafePatterns();
    }
  };
}