import * as ts from 'typescript';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import type { BreakingChange } from './types';

/**
 * Re-Shell UI Breaking Change Detector
 * Automatically detects breaking changes between versions
 */
export class BreakingChangeDetector {
  private oldProgram: ts.Program | null = null;
  private newProgram: ts.Program;
  private oldChecker: ts.TypeChecker | null = null;
  private newChecker: ts.TypeChecker;
  private breakingChanges: BreakingChange[] = [];

  constructor(
    currentConfigPath: string = './tsconfig.json',
    previousVersion?: string
  ) {
    // Load current version
    const config = this.loadTsConfig(currentConfigPath);
    this.newProgram = ts.createProgram(config.fileNames, config.options);
    this.newChecker = this.newProgram.getTypeChecker();

    // Load previous version if specified
    if (previousVersion) {
      this.loadPreviousVersion(previousVersion);
    }
  }

  /**
   * Detect all breaking changes
   */
  detect(): BreakingChange[] {
    if (!this.oldProgram) {
      return [];
    }

    this.breakingChanges = [];

    // Check for removed exports
    this.detectRemovedExports();

    // Check for changed signatures
    this.detectChangedSignatures();

    // Check for changed types
    this.detectChangedTypes();

    // Check for moved exports
    this.detectMovedExports();

    // Check for renamed exports
    this.detectRenamedExports();

    return this.breakingChanges;
  }

  /**
   * Detect removed exports
   */
  private detectRemovedExports() {
    const oldExports = this.getAllExports(this.oldProgram!, this.oldChecker!);
    const newExports = this.getAllExports(this.newProgram, this.newChecker);

    for (const [name, oldExport] of oldExports) {
      if (!newExports.has(name)) {
        this.breakingChanges.push({
          type: 'removed',
          api: name,
          description: `Export '${name}' was removed`,
          migration: this.suggestMigrationForRemoved(name, oldExport),
          since: this.getCurrentVersion()
        });
      }
    }
  }

  /**
   * Detect changed signatures
   */
  private detectChangedSignatures() {
    const oldExports = this.getAllExports(this.oldProgram!, this.oldChecker!);
    const newExports = this.getAllExports(this.newProgram, this.newChecker);

    for (const [name, newExport] of newExports) {
      const oldExport = oldExports.get(name);
      if (oldExport && this.hasSignatureChanged(oldExport, newExport)) {
        this.breakingChanges.push({
          type: 'changed',
          api: name,
          description: `Signature of '${name}' has changed`,
          migration: this.suggestMigrationForChanged(name, oldExport, newExport),
          since: this.getCurrentVersion()
        });
      }
    }
  }

  /**
   * Detect changed types
   */
  private detectChangedTypes() {
    const oldTypes = this.getAllTypes(this.oldProgram!, this.oldChecker!);
    const newTypes = this.getAllTypes(this.newProgram, this.newChecker);

    for (const [name, newType] of newTypes) {
      const oldType = oldTypes.get(name);
      if (oldType && !this.areTypesCompatible(oldType, newType)) {
        this.breakingChanges.push({
          type: 'changed',
          api: name,
          description: `Type '${name}' has incompatible changes`,
          migration: this.suggestMigrationForTypeChange(name, oldType, newType),
          since: this.getCurrentVersion()
        });
      }
    }
  }

  /**
   * Detect moved exports
   */
  private detectMovedExports() {
    const oldExports = this.getAllExportsWithLocation(this.oldProgram!, this.oldChecker!);
    const newExports = this.getAllExportsWithLocation(this.newProgram, this.newChecker);

    for (const [name, newInfo] of newExports) {
      const oldInfo = oldExports.get(name);
      if (oldInfo && oldInfo.file !== newInfo.file) {
        this.breakingChanges.push({
          type: 'moved',
          api: name,
          description: `'${name}' moved from '${oldInfo.file}' to '${newInfo.file}'`,
          migration: `Update imports: import { ${name} } from '${newInfo.file}'`,
          since: this.getCurrentVersion()
        });
      }
    }
  }

  /**
   * Detect renamed exports
   */
  private detectRenamedExports() {
    const oldExports = this.getAllExports(this.oldProgram!, this.oldChecker!);
    const newExports = this.getAllExports(this.newProgram, this.newChecker);

    // Use similarity matching to find potential renames
    for (const [oldName, oldExport] of oldExports) {
      if (!newExports.has(oldName)) {
        const potentialRename = this.findSimilarExport(oldName, oldExport, newExports);
        if (potentialRename) {
          this.breakingChanges.push({
            type: 'renamed',
            api: oldName,
            description: `'${oldName}' renamed to '${potentialRename}'`,
            migration: `Replace all occurrences of '${oldName}' with '${potentialRename}'`,
            since: this.getCurrentVersion()
          });
        }
      }
    }
  }

  /**
   * Get all exports
   */
  private getAllExports(
    program: ts.Program,
    checker: ts.TypeChecker
  ): Map<string, ExportInfo> {
    const exports = new Map<string, ExportInfo>();
    const sourceFiles = program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && !sf.fileName.includes('node_modules'));

    for (const sourceFile of sourceFiles) {
      const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
      if (moduleSymbol) {
        const exportSymbols = checker.getExportsOfModule(moduleSymbol);
        for (const symbol of exportSymbols) {
          const declaration = symbol.declarations?.[0];
          if (declaration) {
            exports.set(symbol.name, {
              name: symbol.name,
              type: checker.getTypeOfSymbolAtLocation(symbol, declaration),
              signature: checker.typeToString(
                checker.getTypeOfSymbolAtLocation(symbol, declaration)
              ),
              declaration
            });
          }
        }
      }
    }

    return exports;
  }

  /**
   * Get all exports with location
   */
  private getAllExportsWithLocation(
    program: ts.Program,
    checker: ts.TypeChecker
  ): Map<string, ExportLocationInfo> {
    const exports = new Map<string, ExportLocationInfo>();
    const allExports = this.getAllExports(program, checker);

    for (const [name, info] of allExports) {
      const file = this.getRelativePath(info.declaration.getSourceFile().fileName);
      exports.set(name, { name, file });
    }

    return exports;
  }

  /**
   * Get all types
   */
  private getAllTypes(
    program: ts.Program,
    checker: ts.TypeChecker
  ): Map<string, TypeInfo> {
    const types = new Map<string, TypeInfo>();
    const sourceFiles = program.getSourceFiles()
      .filter(sf => !sf.isDeclarationFile && !sf.fileName.includes('node_modules'));

    for (const sourceFile of sourceFiles) {
      const visit = (node: ts.Node) => {
        if (ts.isInterfaceDeclaration(node) || 
            ts.isTypeAliasDeclaration(node) ||
            ts.isEnumDeclaration(node)) {
          if (this.isExported(node) && node.name) {
            const symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
              const type = checker.getTypeOfSymbolAtLocation(symbol, node);
              types.set(node.name.text, {
                name: node.name.text,
                node,
                type,
                properties: this.getTypeProperties(type, checker)
              });
            }
          }
        }
        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return types;
  }

  /**
   * Get type properties
   */
  private getTypeProperties(type: ts.Type, checker: ts.TypeChecker): string[] {
    const properties: string[] = [];
    
    for (const prop of type.getProperties()) {
      const propType = checker.getTypeOfSymbolAtLocation(prop, prop.valueDeclaration!);
      properties.push(`${prop.name}: ${checker.typeToString(propType)}`);
    }
    
    return properties;
  }

  /**
   * Check if signature changed
   */
  private hasSignatureChanged(oldExport: ExportInfo, newExport: ExportInfo): boolean {
    return oldExport.signature !== newExport.signature;
  }

  /**
   * Check if types are compatible
   */
  private areTypesCompatible(oldType: TypeInfo, newType: TypeInfo): boolean {
    // Check if all old properties exist in new type
    const newProps = new Set(newType.properties);
    
    for (const oldProp of oldType.properties) {
      if (!newProps.has(oldProp)) {
        // Property was removed or changed
        return false;
      }
    }
    
    return true;
  }

  /**
   * Find similar export (potential rename)
   */
  private findSimilarExport(
    oldName: string,
    oldExport: ExportInfo,
    newExports: Map<string, ExportInfo>
  ): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;

    for (const [newName, newExport] of newExports) {
      // Skip if signatures are too different
      if (oldExport.signature !== newExport.signature) continue;

      const score = this.calculateSimilarity(oldName, newName);
      if (score > 0.7 && score > bestScore) {
        bestScore = score;
        bestMatch = newName;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Suggest migration for removed export
   */
  private suggestMigrationForRemoved(name: string, oldExport: ExportInfo): string {
    // Look for alternatives in new exports
    const newExports = this.getAllExports(this.newProgram, this.newChecker);
    
    // Find exports with similar functionality
    for (const [newName, newExport] of newExports) {
      if (this.calculateSimilarity(name, newName) > 0.5) {
        return `Consider using '${newName}' instead`;
      }
    }
    
    return `Remove usage of '${name}' or find an alternative`;
  }

  /**
   * Suggest migration for changed export
   */
  private suggestMigrationForChanged(
    name: string,
    oldExport: ExportInfo,
    newExport: ExportInfo
  ): string {
    const oldParams = this.extractParameters(oldExport.signature);
    const newParams = this.extractParameters(newExport.signature);
    
    if (oldParams.length !== newParams.length) {
      return `Update function calls to use ${newParams.length} parameter(s) instead of ${oldParams.length}`;
    }
    
    return `Update usage to match new signature: ${newExport.signature}`;
  }

  /**
   * Suggest migration for type change
   */
  private suggestMigrationForTypeChange(
    name: string,
    oldType: TypeInfo,
    newType: TypeInfo
  ): string {
    const removedProps = oldType.properties.filter(
      prop => !newType.properties.includes(prop)
    );
    
    if (removedProps.length > 0) {
      return `Remove usage of properties: ${removedProps.join(', ')}`;
    }
    
    return `Update type usage to match new structure`;
  }

  /**
   * Extract parameters
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
   * Check if node is exported
   */
  private isExported(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return !!modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
  }

  /**
   * Get relative path
   */
  private getRelativePath(filePath: string): string {
    const cwd = process.cwd();
    return filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath;
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
   * Load previous version
   */
  private loadPreviousVersion(version: string) {
    try {
      // In a real implementation, this would checkout the previous version
      // or load from a stored API snapshot
      console.warn(`Loading previous version ${version} not implemented`);
    } catch (error) {
      console.error('Failed to load previous version:', error);
    }
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
   * Generate breaking changes report
   */
  generateReport(): string {
    if (this.breakingChanges.length === 0) {
      return '# No Breaking Changes Detected ✅';
    }

    const lines: string[] = [
      '# Breaking Changes Report',
      '',
      `## Total: ${this.breakingChanges.length} breaking changes`,
      ''
    ];

    // Group by type
    const byType = this.breakingChanges.reduce((acc, change) => {
      if (!acc[change.type]) acc[change.type] = [];
      acc[change.type].push(change);
      return acc;
    }, {} as Record<string, BreakingChange[]>);

    for (const [type, changes] of Object.entries(byType)) {
      lines.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)} (${changes.length})`);
      lines.push('');
      
      changes.forEach((change, index) => {
        lines.push(`${index + 1}. **${change.api}**`);
        lines.push(`   - ${change.description}`);
        lines.push(`   - Migration: ${change.migration}`);
        lines.push('');
      });
    }

    return lines.join('\n');
  }
}

interface ExportInfo {
  name: string;
  type: ts.Type;
  signature: string;
  declaration: ts.Declaration;
}

interface ExportLocationInfo {
  name: string;
  file: string;
}

interface TypeInfo {
  name: string;
  node: ts.Node;
  type: ts.Type;
  properties: string[];
}

/**
 * Create breaking change detection middleware
 */
export function createBreakingChangeMiddleware() {
  return {
    detect: async (previousVersion?: string, configPath?: string) => {
      const detector = new BreakingChangeDetector(configPath, previousVersion);
      return detector.detect();
    },
    
    report: async (previousVersion?: string, configPath?: string) => {
      const detector = new BreakingChangeDetector(configPath, previousVersion);
      detector.detect();
      return detector.generateReport();
    },
    
    fail: async (previousVersion?: string, configPath?: string) => {
      const detector = new BreakingChangeDetector(configPath, previousVersion);
      const changes = detector.detect();
      
      if (changes.length > 0) {
        const report = detector.generateReport();
        throw new Error(`Breaking changes detected:\n${report}`);
      }
    }
  };
}