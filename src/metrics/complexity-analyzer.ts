import * as ts from 'typescript';
import { readFileSync } from 'fs';
import type { ComplexityMetrics, FileComplexity, FunctionComplexity, HalsteadMetrics } from './types';

/**
 * Re-Shell UI Code Complexity Analyzer
 * Measures cyclomatic and cognitive complexity of components
 */
export class ComplexityAnalyzer {
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
   * Analyze complexity across the codebase
   */
  analyze(): ComplexityMetrics {
    const files: FileComplexity[] = [];
    const allComplexities: number[] = [];
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;

    for (const sourceFile of this.sourceFiles) {
      const fileComplexity = this.analyzeFile(sourceFile);
      files.push(fileComplexity);
      
      fileComplexity.functions.forEach(func => {
        allComplexities.push(func.complexity);
        
        if (func.complexity > 10) highCount++;
        else if (func.complexity > 5) mediumCount++;
        else lowCount++;
      });
    }

    // Calculate metrics
    const average = allComplexities.length > 0 
      ? allComplexities.reduce((a, b) => a + b, 0) / allComplexities.length 
      : 0;
    
    const sorted = [...allComplexities].sort((a, b) => a - b);
    const median = sorted.length > 0 
      ? sorted[Math.floor(sorted.length / 2)] 
      : 0;

    // Calculate Halstead metrics for the entire codebase
    const halsteadMetrics = this.calculateHalsteadMetrics();

    return {
      average: Math.round(average * 10) / 10,
      median,
      max: Math.max(...allComplexities, 0),
      min: Math.min(...allComplexities, 0),
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      files: files.sort((a, b) => {
        const maxA = Math.max(...a.functions.map(f => f.complexity), 0);
        const maxB = Math.max(...b.functions.map(f => f.complexity), 0);
        return maxB - maxA;
      }),
      cognitiveComplexity: this.calculateCognitiveComplexity(),
      halsteadMetrics
    };
  }

  /**
   * Analyze a single file
   */
  private analyzeFile(sourceFile: ts.SourceFile): FileComplexity {
    const functions: FunctionComplexity[] = [];

    const visit = (node: ts.Node) => {
      if (this.isFunctionLike(node)) {
        const complexity = this.calculateCyclomaticComplexity(node);
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        
        functions.push({
          name: this.getFunctionName(node),
          complexity,
          line: position.line + 1,
          column: position.character + 1
        });
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      path: this.getRelativePath(sourceFile.fileName),
      complexity: functions.reduce((sum, f) => sum + f.complexity, 0),
      functions
    };
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateCyclomaticComplexity(node: ts.Node): number {
    let complexity = 1; // Base complexity

    const visit = (n: ts.Node) => {
      switch (n.kind) {
        case ts.SyntaxKind.IfStatement:
        case ts.SyntaxKind.ConditionalExpression:
        case ts.SyntaxKind.CaseClause:
        case ts.SyntaxKind.CatchClause:
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.DoStatement:
        case ts.SyntaxKind.ForStatement:
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
          complexity++;
          break;
        
        case ts.SyntaxKind.BinaryExpression:
          const binaryExpr = n as ts.BinaryExpression;
          if (binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
              binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
              binaryExpr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
            complexity++;
          }
          break;
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
    return complexity;
  }

  /**
   * Calculate cognitive complexity
   */
  private calculateCognitiveComplexity(): number {
    let totalComplexity = 0;
    let nestingLevel = 0;

    for (const sourceFile of this.sourceFiles) {
      const visit = (node: ts.Node) => {
        const increment = this.getCognitiveIncrement(node);
        if (increment > 0) {
          totalComplexity += increment + nestingLevel;
        }

        // Track nesting
        const increasesNesting = this.increasesNesting(node);
        if (increasesNesting) nestingLevel++;

        ts.forEachChild(node, visit);

        if (increasesNesting) nestingLevel--;
      };

      visit(sourceFile);
    }

    return totalComplexity;
  }

  /**
   * Get cognitive complexity increment
   */
  private getCognitiveIncrement(node: ts.Node): number {
    switch (node.kind) {
      case ts.SyntaxKind.IfStatement:
      case ts.SyntaxKind.ConditionalExpression:
      case ts.SyntaxKind.SwitchStatement:
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.ForOfStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
      case ts.SyntaxKind.CatchClause:
        return 1;
      
      case ts.SyntaxKind.BinaryExpression:
        const binaryExpr = node as ts.BinaryExpression;
        if (binaryExpr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
            binaryExpr.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
          return 1;
        }
        break;
    }
    return 0;
  }

  /**
   * Check if node increases nesting
   */
  private increasesNesting(node: ts.Node): boolean {
    return node.kind === ts.SyntaxKind.IfStatement ||
           node.kind === ts.SyntaxKind.ForStatement ||
           node.kind === ts.SyntaxKind.ForInStatement ||
           node.kind === ts.SyntaxKind.ForOfStatement ||
           node.kind === ts.SyntaxKind.WhileStatement ||
           node.kind === ts.SyntaxKind.DoStatement ||
           node.kind === ts.SyntaxKind.CatchClause ||
           this.isFunctionLike(node);
  }

  /**
   * Calculate Halstead metrics
   */
  private calculateHalsteadMetrics(): HalsteadMetrics {
    const operators = new Set<string>();
    const operands = new Set<string>();
    let totalOperators = 0;
    let totalOperands = 0;

    for (const sourceFile of this.sourceFiles) {
      const visit = (node: ts.Node) => {
        if (this.isOperator(node)) {
          operators.add(node.getText());
          totalOperators++;
        } else if (this.isOperand(node)) {
          operands.add(node.getText());
          totalOperands++;
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    const n1 = operators.size; // Unique operators
    const n2 = operands.size;  // Unique operands
    const N1 = totalOperators; // Total operators
    const N2 = totalOperands;  // Total operands

    const vocabulary = n1 + n2;
    const length = N1 + N2;
    const volume = length * Math.log2(vocabulary);
    const difficulty = (n1 / 2) * (N2 / n2);
    const effort = difficulty * volume;
    const time = effort / 18; // Seconds to understand
    const bugs = volume / 3000; // Estimated bugs

    return {
      vocabulary: Math.round(vocabulary),
      length: Math.round(length),
      volume: Math.round(volume),
      difficulty: Math.round(difficulty * 10) / 10,
      effort: Math.round(effort),
      time: Math.round(time),
      bugs: Math.round(bugs * 100) / 100
    };
  }

  /**
   * Check if node is function-like
   */
  private isFunctionLike(node: ts.Node): boolean {
    return ts.isFunctionDeclaration(node) ||
           ts.isFunctionExpression(node) ||
           ts.isArrowFunction(node) ||
           ts.isMethodDeclaration(node) ||
           ts.isGetAccessor(node) ||
           ts.isSetAccessor(node) ||
           ts.isConstructorDeclaration(node);
  }

  /**
   * Get function name
   */
  private getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || '<anonymous>';
    }
    
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent)) {
        return parent.name.getText();
      }
      if (ts.isPropertyAssignment(parent)) {
        return parent.name.getText();
      }
    }
    
    return '<anonymous>';
  }

  /**
   * Check if node is an operator
   */
  private isOperator(node: ts.Node): boolean {
    return node.kind >= ts.SyntaxKind.FirstAssignment && 
           node.kind <= ts.SyntaxKind.LastAssignment ||
           node.kind >= ts.SyntaxKind.FirstBinaryOperator &&
           node.kind <= ts.SyntaxKind.LastBinaryOperator ||
           node.kind >= ts.SyntaxKind.FirstCompoundAssignment &&
           node.kind <= ts.SyntaxKind.LastCompoundAssignment;
  }

  /**
   * Check if node is an operand
   */
  private isOperand(node: ts.Node): boolean {
    return ts.isIdentifier(node) ||
           ts.isStringLiteral(node) ||
           ts.isNumericLiteral(node) ||
           ts.isPropertyAccessExpression(node);
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
   * Generate complexity report
   */
  generateReport(metrics: ComplexityMetrics): string {
    const lines: string[] = [
      '# Code Complexity Report',
      '',
      '## Summary',
      `- Average Complexity: ${metrics.average}`,
      `- Median Complexity: ${metrics.median}`,
      `- Maximum Complexity: ${metrics.max}`,
      `- Cognitive Complexity: ${metrics.cognitiveComplexity}`,
      '',
      '## Distribution',
      `- High Complexity (>10): ${metrics.high} functions`,
      `- Medium Complexity (6-10): ${metrics.medium} functions`,
      `- Low Complexity (1-5): ${metrics.low} functions`,
      '',
      '## Halstead Metrics',
      `- Vocabulary: ${metrics.halsteadMetrics.vocabulary}`,
      `- Program Length: ${metrics.halsteadMetrics.length}`,
      `- Volume: ${metrics.halsteadMetrics.volume}`,
      `- Difficulty: ${metrics.halsteadMetrics.difficulty}`,
      `- Effort: ${metrics.halsteadMetrics.effort}`,
      `- Time to Understand: ${Math.round(metrics.halsteadMetrics.time / 60)} minutes`,
      `- Estimated Bugs: ${metrics.halsteadMetrics.bugs}`,
      ''
    ];

    // Most complex files
    const complexFiles = metrics.files
      .filter(f => f.functions.some(fn => fn.complexity > 10))
      .slice(0, 10);

    if (complexFiles.length > 0) {
      lines.push('## Most Complex Files');
      complexFiles.forEach(file => {
        const maxComplexity = Math.max(...file.functions.map(f => f.complexity));
        lines.push(`- ${file.path} (max: ${maxComplexity})`);
        
        file.functions
          .filter(f => f.complexity > 10)
          .forEach(func => {
            lines.push(`  - ${func.name}: ${func.complexity} (line ${func.line})`);
          });
      });
    }

    return lines.join('\n');
  }
}

/**
 * Create complexity threshold checker
 */
export function createComplexityChecker(thresholds: ComplexityThresholds = {}) {
  const {
    maxAverage = 5,
    maxFunction = 10,
    maxCognitive = 100
  } = thresholds;

  return {
    check: async (configPath?: string) => {
      const analyzer = new ComplexityAnalyzer(configPath);
      const metrics = analyzer.analyze();
      const violations: string[] = [];

      if (metrics.average > maxAverage) {
        violations.push(`Average complexity ${metrics.average} exceeds threshold ${maxAverage}`);
      }

      if (metrics.max > maxFunction) {
        violations.push(`Maximum complexity ${metrics.max} exceeds threshold ${maxFunction}`);
      }

      if (metrics.cognitiveComplexity > maxCognitive) {
        violations.push(`Cognitive complexity ${metrics.cognitiveComplexity} exceeds threshold ${maxCognitive}`);
      }

      if (violations.length > 0) {
        const report = analyzer.generateReport(metrics);
        throw new Error(`Complexity violations:\n${violations.join('\n')}\n\n${report}`);
      }

      return metrics;
    }
  };
}

export interface ComplexityThresholds {
  maxAverage?: number;
  maxFunction?: number;
  maxCognitive?: number;
}