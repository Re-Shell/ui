import * as ts from 'typescript';
import { readFileSync } from 'fs';
import type { DocumentationMetrics, DocumentationCategory } from './types';

/**
 * Re-Shell UI Documentation Coverage Tracker
 * Analyzes documentation completeness across components, hooks, and utilities
 */
export class DocumentationCoverageTracker {
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
   * Analyze documentation coverage
   */
  analyze(): DocumentationMetrics {
    const categories = {
      components: this.createEmptyCategory(),
      hooks: this.createEmptyCategory(),
      utilities: this.createEmptyCategory(),
      types: this.createEmptyCategory()
    };

    let totalDocumented = 0;
    let totalUndocumented = 0;
    let totalExamples = 0;
    let publicAPICount = 0;
    let publicAPIDocumented = 0;

    for (const sourceFile of this.sourceFiles) {
      const filePath = this.getRelativePath(sourceFile.fileName);
      const category = this.categorizeFile(filePath);
      
      if (!category) continue;

      const fileStats = this.analyzeFile(sourceFile);
      
      // Update category stats
      categories[category].documented += fileStats.documented;
      categories[category].total += fileStats.total;
      categories[category].withExamples += fileStats.withExamples;
      
      // Update totals
      totalDocumented += fileStats.documented;
      totalUndocumented += fileStats.total - fileStats.documented;
      totalExamples += fileStats.withExamples;
      
      // Track public API
      publicAPICount += fileStats.publicAPI;
      publicAPIDocumented += fileStats.publicAPIDocumented;
    }

    // Calculate percentages
    const total = totalDocumented + totalUndocumented;
    const coverage = total > 0 ? Math.round((totalDocumented / total) * 100) : 100;
    const publicAPICoverage = publicAPICount > 0 
      ? Math.round((publicAPIDocumented / publicAPICount) * 100) 
      : 100;

    // Calculate category coverages
    Object.values(categories).forEach(cat => {
      cat.coverage = cat.total > 0 
        ? Math.round((cat.documented / cat.total) * 100) 
        : 100;
    });

    return {
      coverage,
      documented: totalDocumented,
      undocumented: totalUndocumented,
      total,
      publicAPICoverage,
      examples: totalExamples,
      categories
    };
  }

  /**
   * Analyze a single file
   */
  private analyzeFile(sourceFile: ts.SourceFile): FileDocStats {
    let documented = 0;
    let total = 0;
    let withExamples = 0;
    let publicAPI = 0;
    let publicAPIDocumented = 0;

    const visit = (node: ts.Node) => {
      if (this.shouldDocument(node)) {
        total++;
        
        const docs = this.getDocumentation(node);
        if (docs) {
          documented++;
          if (docs.includes('@example')) {
            withExamples++;
          }
        }

        // Check if it's public API
        if (this.isPublicAPI(node)) {
          publicAPI++;
          if (docs) {
            publicAPIDocumented++;
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      documented,
      total,
      withExamples,
      publicAPI,
      publicAPIDocumented
    };
  }

  /**
   * Check if node should be documented
   */
  private shouldDocument(node: ts.Node): boolean {
    // Exported declarations
    if (ts.isClassDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)) {
      return this.isExported(node);
    }

    // Class members
    if (ts.isMethodDeclaration(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isGetAccessor(node) ||
        ts.isSetAccessor(node)) {
      return this.isPublicMember(node);
    }

    // Variable declarations
    if (ts.isVariableStatement(node)) {
      return this.isExported(node);
    }

    return false;
  }

  /**
   * Check if node is exported
   */
  private isExported(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return !!modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  /**
   * Check if member is public
   */
  private isPublicMember(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    if (!modifiers) return true; // Default is public
    
    return !modifiers.some(m => 
      m.kind === ts.SyntaxKind.PrivateKeyword ||
      m.kind === ts.SyntaxKind.ProtectedKeyword
    );
  }

  /**
   * Check if node is public API
   */
  private isPublicAPI(node: ts.Node): boolean {
    // Must be exported and at top level or public member
    if (ts.isClassDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node)) {
      return this.isExported(node);
    }
    
    if (ts.isMethodDeclaration(node) ||
        ts.isPropertyDeclaration(node)) {
      const parent = node.parent;
      return ts.isClassDeclaration(parent) && 
             this.isExported(parent) && 
             this.isPublicMember(node);
    }
    
    return false;
  }

  /**
   * Get documentation for node
   */
  private getDocumentation(node: ts.Node): string | null {
    const symbol = this.checker.getSymbolAtLocation(
      (node as any).name || node
    );
    
    if (!symbol) return null;

    const comments = symbol.getDocumentationComment(this.checker);
    const tags = symbol.getJsDocTags();
    
    if (comments.length === 0 && tags.length === 0) {
      // Check for leading comment
      const leadingComments = ts.getLeadingCommentRanges(
        node.getSourceFile().getFullText(),
        node.getFullStart()
      );
      
      if (leadingComments && leadingComments.length > 0) {
        const lastComment = leadingComments[leadingComments.length - 1];
        const commentText = node.getSourceFile().getFullText()
          .substring(lastComment.pos, lastComment.end);
        
        if (commentText.includes('/**')) {
          return commentText;
        }
      }
      
      return null;
    }

    const fullDoc = comments.map(c => c.text).join('\n') + '\n' +
                    tags.map(t => `@${t.name} ${t.text?.map(p => p.text).join(' ')}`).join('\n');
    
    return fullDoc.trim() || null;
  }

  /**
   * Categorize file
   */
  private categorizeFile(filePath: string): keyof DocumentationMetrics['categories'] | null {
    if (filePath.includes('/hooks/') || filePath.includes('use')) {
      return 'hooks';
    }
    if (filePath.includes('/utils/') || filePath.includes('/helpers/')) {
      return 'utilities';
    }
    if (filePath.includes('/types/') || filePath.includes('.types.')) {
      return 'types';
    }
    if (filePath.includes('/components/') || /[A-Z]/.test(filePath.split('/').pop()?.[0] || '')) {
      return 'components';
    }
    return null;
  }

  /**
   * Create empty category
   */
  private createEmptyCategory(): DocumentationCategory {
    return {
      coverage: 0,
      documented: 0,
      total: 0,
      withExamples: 0
    };
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

    const basePath = configPath.substring(0, configPath.lastIndexOf('/'));
    return ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      basePath
    );
  }

  /**
   * Find undocumented exports
   */
  findUndocumentedExports(): UndocumentedExport[] {
    const undocumented: UndocumentedExport[] = [];

    for (const sourceFile of this.sourceFiles) {
      const filePath = this.getRelativePath(sourceFile.fileName);
      
      const visit = (node: ts.Node) => {
        if (this.shouldDocument(node) && this.isPublicAPI(node)) {
          const docs = this.getDocumentation(node);
          if (!docs) {
            const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
            undocumented.push({
              file: filePath,
              name: this.getNodeName(node),
              type: this.getNodeType(node),
              line: position.line + 1,
              isPublicAPI: true
            });
          }
        }
        
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return undocumented;
  }

  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string {
    if ((node as any).name) {
      return (node as any).name.getText();
    }
    return '<anonymous>';
  }

  /**
   * Get node type
   */
  private getNodeType(node: ts.Node): string {
    if (ts.isClassDeclaration(node)) return 'class';
    if (ts.isFunctionDeclaration(node)) return 'function';
    if (ts.isInterfaceDeclaration(node)) return 'interface';
    if (ts.isTypeAliasDeclaration(node)) return 'type';
    if (ts.isEnumDeclaration(node)) return 'enum';
    if (ts.isMethodDeclaration(node)) return 'method';
    if (ts.isPropertyDeclaration(node)) return 'property';
    return 'unknown';
  }

  /**
   * Generate documentation report
   */
  generateReport(metrics: DocumentationMetrics): string {
    const lines: string[] = [
      '# Documentation Coverage Report',
      '',
      `## Overall Coverage: ${metrics.coverage}%`,
      '',
      '### Summary',
      `- Total items: ${metrics.total}`,
      `- Documented: ${metrics.documented}`,
      `- Undocumented: ${metrics.undocumented}`,
      `- With examples: ${metrics.examples}`,
      `- Public API coverage: ${metrics.publicAPICoverage}%`,
      '',
      '### Coverage by Category',
      `- Components: ${metrics.categories.components.coverage}% (${metrics.categories.components.documented}/${metrics.categories.components.total})`,
      `- Hooks: ${metrics.categories.hooks.coverage}% (${metrics.categories.hooks.documented}/${metrics.categories.hooks.total})`,
      `- Utilities: ${metrics.categories.utilities.coverage}% (${metrics.categories.utilities.documented}/${metrics.categories.utilities.total})`,
      `- Types: ${metrics.categories.types.coverage}% (${metrics.categories.types.documented}/${metrics.categories.types.total})`,
      '',
      '### Examples Coverage',
      `- Components with examples: ${metrics.categories.components.withExamples}`,
      `- Hooks with examples: ${metrics.categories.hooks.withExamples}`,
      `- Utilities with examples: ${metrics.categories.utilities.withExamples}`
    ];

    return lines.join('\n');
  }
}

interface FileDocStats {
  documented: number;
  total: number;
  withExamples: number;
  publicAPI: number;
  publicAPIDocumented: number;
}

export interface UndocumentedExport {
  file: string;
  name: string;
  type: string;
  line: number;
  isPublicAPI: boolean;
}

/**
 * Create documentation coverage middleware
 */
export function createDocumentationMiddleware(minCoverage: number = 80) {
  return {
    check: async (configPath?: string) => {
      const tracker = new DocumentationCoverageTracker(configPath);
      const metrics = tracker.analyze();
      
      if (metrics.coverage < minCoverage) {
        const report = tracker.generateReport(metrics);
        throw new Error(
          `Documentation coverage ${metrics.coverage}% is below minimum ${minCoverage}%\n${report}`
        );
      }
      
      return metrics;
    },
    
    report: async (configPath?: string) => {
      const tracker = new DocumentationCoverageTracker(configPath);
      const metrics = tracker.analyze();
      return tracker.generateReport(metrics);
    },
    
    findUndocumented: async (configPath?: string) => {
      const tracker = new DocumentationCoverageTracker(configPath);
      return tracker.findUndocumentedExports();
    }
  };
}