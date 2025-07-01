import * as ts from 'typescript';
import { readFileSync, existsSync } from 'fs';
import type { APIStabilityMetrics, BreakingChange, VersionCompatibility } from './types';

/**
 * Re-Shell UI API Stability Tracker
 * Tracks API changes, stability levels, and breaking changes
 */
export class APIStabilityTracker {
  private program: ts.Program;
  private checker: ts.TypeChecker;
  private sourceFiles: ts.SourceFile[];
  private previousAPI: Map<string, APISignature> = new Map();

  constructor(
    configPath: string = './tsconfig.json',
    previousAPIPath?: string
  ) {
    const config = this.loadTsConfig(configPath);
    this.program = ts.createProgram(config.fileNames, config.options);
    this.checker = this.program.getTypeChecker();
    this.sourceFiles = this.program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && !sf.fileName.includes('node_modules'));

    if (previousAPIPath && existsSync(previousAPIPath)) {
      this.loadPreviousAPI(previousAPIPath);
    }
  }

  /**
   * Analyze API stability
   */
  analyze(): APIStabilityMetrics {
    const currentAPI = this.extractCurrentAPI();
    const breakingChanges = this.detectBreakingChanges(currentAPI);
    const stabilityLevels = this.categorizeStabilityLevels(currentAPI);
    
    return {
      stable: stabilityLevels.stable,
      beta: stabilityLevels.beta,
      experimental: stabilityLevels.experimental,
      deprecated: stabilityLevels.deprecated,
      breakingChanges,
      versionCompatibility: this.analyzeVersionCompatibility(breakingChanges),
      publicAPICount: currentAPI.size,
      semverCompliance: this.checkSemverCompliance(breakingChanges)
    };
  }

  /**
   * Extract current API
   */
  private extractCurrentAPI(): Map<string, APISignature> {
    const api = new Map<string, APISignature>();

    for (const sourceFile of this.sourceFiles) {
      const visit = (node: ts.Node) => {
        if (this.isPublicAPI(node)) {
          const signature = this.extractSignature(node);
          if (signature) {
            api.set(signature.id, signature);
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return api;
  }

  /**
   * Extract API signature
   */
  private extractSignature(node: ts.Node): APISignature | null {
    const name = this.getNodeName(node);
    if (!name) return null;

    const symbol = this.checker.getSymbolAtLocation((node as any).name || node);
    if (!symbol) return null;

    const type = this.checker.getTypeOfSymbolAtLocation(symbol, node);
    const typeString = this.checker.typeToString(type);
    const tags = this.getJSDocTags(node);
    
    return {
      id: this.generateAPIId(node, name),
      name,
      type: this.getNodeType(node),
      signature: typeString,
      stability: this.getStabilityLevel(tags),
      deprecated: tags.has('deprecated'),
      since: tags.get('since') || 'unknown',
      file: this.getRelativePath(node.getSourceFile().fileName),
      line: node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1
    };
  }

  /**
   * Detect breaking changes
   */
  private detectBreakingChanges(currentAPI: Map<string, APISignature>): BreakingChange[] {
    const changes: BreakingChange[] = [];

    // Check for removed APIs
    for (const [id, oldAPI] of this.previousAPI) {
      if (!currentAPI.has(id)) {
        changes.push({
          type: 'removed',
          api: oldAPI.name,
          description: `${oldAPI.type} '${oldAPI.name}' was removed`,
          migration: `Find alternative or restore the ${oldAPI.type}`,
          since: 'current'
        });
      }
    }

    // Check for changed APIs
    for (const [id, newAPI] of currentAPI) {
      const oldAPI = this.previousAPI.get(id);
      if (oldAPI && oldAPI.signature !== newAPI.signature) {
        changes.push({
          type: 'changed',
          api: newAPI.name,
          description: `${newAPI.type} '${newAPI.name}' signature changed`,
          migration: this.generateMigrationGuide(oldAPI, newAPI),
          since: 'current'
        });
      }
    }

    return changes;
  }

  /**
   * Categorize stability levels
   */
  private categorizeStabilityLevels(api: Map<string, APISignature>): {
    stable: number;
    beta: number;
    experimental: number;
    deprecated: number;
  } {
    let stable = 0;
    let beta = 0;
    let experimental = 0;
    let deprecated = 0;

    for (const signature of api.values()) {
      if (signature.deprecated) {
        deprecated++;
      } else {
        switch (signature.stability) {
          case 'stable':
            stable++;
            break;
          case 'beta':
            beta++;
            break;
          case 'experimental':
            experimental++;
            break;
          default:
            stable++; // Default to stable if not specified
        }
      }
    }

    return { stable, beta, experimental, deprecated };
  }

  /**
   * Analyze version compatibility
   */
  private analyzeVersionCompatibility(breakingChanges: BreakingChange[]): VersionCompatibility[] {
    // This would typically analyze multiple versions
    // For now, we'll create a simple compatibility report
    const currentVersion = this.getCurrentVersion();
    
    return [{
      version: currentVersion,
      compatible: breakingChanges.length === 0,
      changes: breakingChanges.length,
      breaking: breakingChanges.filter(c => c.type !== 'deprecated').length
    }];
  }

  /**
   * Check semver compliance
   */
  private checkSemverCompliance(breakingChanges: BreakingChange[]): boolean {
    // In a real implementation, this would check if version bumps
    // align with the types of changes made
    const hasBreakingChanges = breakingChanges.some(c => 
      c.type === 'removed' || c.type === 'changed'
    );
    
    const version = this.getCurrentVersion();
    const [major] = version.split('.').map(Number);
    
    // If we have breaking changes, we should be on a new major version
    return !hasBreakingChanges || major > 0;
  }

  /**
   * Get current version
   */
  private getCurrentVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  /**
   * Generate API ID
   */
  private generateAPIId(node: ts.Node, name: string): string {
    const file = this.getRelativePath(node.getSourceFile().fileName);
    const type = this.getNodeType(node);
    
    // Include parent class for methods
    if (ts.isMethodDeclaration(node) || ts.isPropertyDeclaration(node)) {
      const parent = node.parent;
      if (ts.isClassDeclaration(parent) && parent.name) {
        return `${file}:${parent.name.text}.${name}:${type}`;
      }
    }
    
    return `${file}:${name}:${type}`;
  }

  /**
   * Generate migration guide
   */
  private generateMigrationGuide(oldAPI: APISignature, newAPI: APISignature): string {
    // Simple heuristic-based migration guide
    const oldParams = this.extractParameters(oldAPI.signature);
    const newParams = this.extractParameters(newAPI.signature);
    
    if (oldParams.length !== newParams.length) {
      return `Update calls to match new parameter count (${oldParams.length} → ${newParams.length})`;
    }
    
    return `Update usage to match new signature: ${newAPI.signature}`;
  }

  /**
   * Extract parameters from signature
   */
  private extractParameters(signature: string): string[] {
    const match = signature.match(/\((.*?)\)/);
    if (!match) return [];
    
    return match[1]
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Get JSDoc tags
   */
  private getJSDocTags(node: ts.Node): Map<string, string> {
    const tags = new Map<string, string>();
    const symbol = this.checker.getSymbolAtLocation((node as any).name || node);
    
    if (symbol) {
      const jsdocTags = symbol.getJsDocTags();
      jsdocTags.forEach(tag => {
        tags.set(tag.name, tag.text?.map(t => t.text).join(' ') || '');
      });
    }
    
    return tags;
  }

  /**
   * Get stability level from tags
   */
  private getStabilityLevel(tags: Map<string, string>): 'stable' | 'beta' | 'experimental' {
    if (tags.has('experimental')) return 'experimental';
    if (tags.has('beta')) return 'beta';
    if (tags.has('stable')) return 'stable';
    
    // Default based on other tags
    if (tags.has('since')) {
      const since = tags.get('since') || '';
      const version = since.match(/(\d+)\.(\d+)\.(\d+)/);
      if (version) {
        const [, major] = version;
        return parseInt(major) >= 1 ? 'stable' : 'beta';
      }
    }
    
    return 'stable'; // Default to stable
  }

  /**
   * Check if node is public API
   */
  private isPublicAPI(node: ts.Node): boolean {
    if (!this.isExported(node)) return false;
    
    return ts.isClassDeclaration(node) ||
           ts.isFunctionDeclaration(node) ||
           ts.isInterfaceDeclaration(node) ||
           ts.isTypeAliasDeclaration(node) ||
           ts.isEnumDeclaration(node) ||
           ts.isVariableStatement(node);
  }

  /**
   * Check if node is exported
   */
  private isExported(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return !!modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  /**
   * Get node name
   */
  private getNodeName(node: ts.Node): string {
    if ((node as any).name) {
      return (node as any).name.getText();
    }
    return '';
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
    if (ts.isVariableStatement(node)) return 'variable';
    if (ts.isMethodDeclaration(node)) return 'method';
    if (ts.isPropertyDeclaration(node)) return 'property';
    return 'unknown';
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
   * Load previous API
   */
  private loadPreviousAPI(path: string) {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'));
      data.forEach((item: APISignature) => {
        this.previousAPI.set(item.id, item);
      });
    } catch (error) {
      console.warn('Failed to load previous API:', error);
    }
  }

  /**
   * Export current API
   */
  exportAPI(api: Map<string, APISignature>): string {
    return JSON.stringify(Array.from(api.values()), null, 2);
  }

  /**
   * Generate stability report
   */
  generateReport(metrics: APIStabilityMetrics): string {
    const lines: string[] = [
      '# API Stability Report',
      '',
      `## Public API Summary`,
      `- Total public APIs: ${metrics.publicAPICount}`,
      `- Stable: ${metrics.stable}`,
      `- Beta: ${metrics.beta}`,
      `- Experimental: ${metrics.experimental}`,
      `- Deprecated: ${metrics.deprecated}`,
      '',
      `## Semver Compliance: ${metrics.semverCompliance ? '✅' : '❌'}`,
      ''
    ];

    if (metrics.breakingChanges.length > 0) {
      lines.push('## Breaking Changes');
      metrics.breakingChanges.forEach((change, index) => {
        lines.push(`${index + 1}. **${change.api}** (${change.type})`);
        lines.push(`   - ${change.description}`);
        lines.push(`   - Migration: ${change.migration}`);
        lines.push('');
      });
    }

    if (metrics.versionCompatibility.length > 0) {
      lines.push('## Version Compatibility');
      metrics.versionCompatibility.forEach(compat => {
        lines.push(`- ${compat.version}: ${compat.compatible ? '✅ Compatible' : '❌ Breaking changes'}`);
        if (!compat.compatible) {
          lines.push(`  - ${compat.breaking} breaking changes`);
        }
      });
    }

    return lines.join('\n');
  }
}

interface APISignature {
  id: string;
  name: string;
  type: string;
  signature: string;
  stability: 'stable' | 'beta' | 'experimental';
  deprecated: boolean;
  since: string;
  file: string;
  line: number;
}

/**
 * Create API stability middleware
 */
export function createAPIStabilityMiddleware() {
  return {
    check: async (configPath?: string, previousAPIPath?: string) => {
      const tracker = new APIStabilityTracker(configPath, previousAPIPath);
      return tracker.analyze();
    },
    
    exportAPI: async (outputPath: string, configPath?: string) => {
      const tracker = new APIStabilityTracker(configPath);
      const api = tracker['extractCurrentAPI']();
      const data = tracker.exportAPI(api);
      
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, data, 'utf8');
    },
    
    checkBreaking: async (configPath?: string, previousAPIPath?: string) => {
      const tracker = new APIStabilityTracker(configPath, previousAPIPath);
      const metrics = tracker.analyze();
      
      if (metrics.breakingChanges.length > 0) {
        const report = tracker.generateReport(metrics);
        throw new Error(`Breaking changes detected:\n${report}`);
      }
      
      return metrics;
    }
  };
}