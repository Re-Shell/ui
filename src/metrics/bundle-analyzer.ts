import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';
import type { BundleSizeMetrics, ChunkMetrics, TreemapData } from './types';

/**
 * Re-Shell UI Bundle Size Analyzer
 * Tracks and analyzes bundle sizes with budget alerts
 */
export class BundleAnalyzer {
  private budgetLimit: number;
  private distPath: string;

  constructor(distPath: string = './dist', budgetLimit: number = 200 * 1024) { // 200KB default
    this.distPath = distPath;
    this.budgetLimit = budgetLimit;
  }

  /**
   * Analyze bundle sizes and generate metrics
   */
  async analyze(): Promise<BundleSizeMetrics> {
    const files = this.getAllFiles(this.distPath);
    const chunks = await this.analyzeChunks(files);
    
    const metrics: BundleSizeMetrics = {
      totalSize: 0,
      mainBundle: 0,
      vendorBundle: 0,
      css: 0,
      assets: 0,
      gzipped: 0,
      brotli: 0,
      budgetLimit: this.budgetLimit,
      budgetUsage: 0,
      chunks,
      treemap: this.generateTreemap(chunks)
    };

    // Calculate totals
    chunks.forEach(chunk => {
      metrics.totalSize += chunk.size;
      metrics.gzipped += chunk.gzipped;

      if (chunk.name.includes('main')) {
        metrics.mainBundle += chunk.size;
      } else if (chunk.name.includes('vendor')) {
        metrics.vendorBundle += chunk.size;
      } else if (chunk.name.endsWith('.css')) {
        metrics.css += chunk.size;
      } else if (this.isAsset(chunk.name)) {
        metrics.assets += chunk.size;
      }
    });

    // Calculate budget usage
    metrics.budgetUsage = Math.round((metrics.totalSize / this.budgetLimit) * 100);

    return metrics;
  }

  /**
   * Analyze individual chunks
   */
  private async analyzeChunks(files: string[]): Promise<ChunkMetrics[]> {
    const chunks: ChunkMetrics[] = [];

    for (const file of files) {
      const content = readFileSync(file);
      const size = content.length;
      const gzipped = gzipSync(content).length;
      
      chunks.push({
        name: file.replace(this.distPath + '/', ''),
        size,
        gzipped,
        modules: this.countModules(content.toString()),
        isDynamicImport: this.isDynamicImport(file)
      });
    }

    return chunks.sort((a, b) => b.size - a.size);
  }

  /**
   * Generate treemap data for visualization
   */
  private generateTreemap(chunks: ChunkMetrics[]): TreemapData {
    const root: TreemapData = {
      name: 'dist',
      value: 0,
      children: []
    };

    const categories: Record<string, TreemapData> = {
      js: { name: 'JavaScript', value: 0, children: [] },
      css: { name: 'CSS', value: 0, children: [] },
      assets: { name: 'Assets', value: 0, children: [] },
      other: { name: 'Other', value: 0, children: [] }
    };

    chunks.forEach(chunk => {
      const category = this.getFileCategory(chunk.name);
      const node: TreemapData = {
        name: chunk.name,
        value: chunk.size
      };

      categories[category].children!.push(node);
      categories[category].value += chunk.size;
      root.value += chunk.size;
    });

    root.children = Object.values(categories).filter(cat => cat.value > 0);
    return root;
  }

  /**
   * Get all files recursively
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    const walkDir = (currentPath: string) => {
      const entries = readdirSync(currentPath);
      
      for (const entry of entries) {
        const fullPath = join(currentPath, entry);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      }
    };

    walkDir(dir);
    return files;
  }

  /**
   * Count modules in a bundle
   */
  private countModules(content: string): number {
    // Simple heuristic: count module boundaries
    const modulePattern = /\/\*\*\*\/ "\.\//g;
    const matches = content.match(modulePattern);
    return matches ? matches.length : 1;
  }

  /**
   * Check if chunk is dynamically imported
   */
  private isDynamicImport(filename: string): boolean {
    // Chunks with numbers are usually dynamic imports
    return /\.\d+\./.test(filename);
  }

  /**
   * Check if file is an asset
   */
  private isAsset(filename: string): boolean {
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot'];
    const ext = extname(filename).toLowerCase();
    return assetExtensions.includes(ext);
  }

  /**
   * Get file category for treemap
   */
  private getFileCategory(filename: string): string {
    const ext = extname(filename).toLowerCase();
    
    if (['.js', '.mjs'].includes(ext)) return 'js';
    if (ext === '.css') return 'css';
    if (this.isAsset(filename)) return 'assets';
    return 'other';
  }

  /**
   * Check budget and generate alerts
   */
  checkBudget(metrics: BundleSizeMetrics): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    if (metrics.totalSize > this.budgetLimit) {
      alerts.push({
        severity: 'error',
        message: `Bundle size (${this.formatSize(metrics.totalSize)}) exceeds budget (${this.formatSize(this.budgetLimit)})`,
        metric: 'totalSize',
        actual: metrics.totalSize,
        limit: this.budgetLimit
      });
    }

    // Warn at 90% of budget
    if (metrics.budgetUsage >= 90 && metrics.budgetUsage < 100) {
      alerts.push({
        severity: 'warning',
        message: `Bundle size is at ${metrics.budgetUsage}% of budget`,
        metric: 'budgetUsage',
        actual: metrics.totalSize,
        limit: this.budgetLimit
      });
    }

    // Check individual chunk sizes
    metrics.chunks.forEach(chunk => {
      if (chunk.size > 50 * 1024 && !chunk.isDynamicImport) { // 50KB for non-dynamic chunks
        alerts.push({
          severity: 'warning',
          message: `Chunk "${chunk.name}" is large (${this.formatSize(chunk.size)})`,
          metric: 'chunkSize',
          actual: chunk.size,
          limit: 50 * 1024
        });
      }
    });

    return alerts;
  }

  /**
   * Format size for display
   */
  private formatSize(bytes: number): string {
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  }
}

export interface BudgetAlert {
  severity: 'error' | 'warning';
  message: string;
  metric: string;
  actual: number;
  limit: number;
}

/**
 * Create bundle size report
 */
export function createBundleSizeReport(metrics: BundleSizeMetrics): string {
  const lines: string[] = [
    '# Bundle Size Report',
    '',
    `Total Size: ${formatBytes(metrics.totalSize)} (${formatBytes(metrics.gzipped)} gzipped)`,
    `Budget Usage: ${metrics.budgetUsage}%`,
    '',
    '## Breakdown',
    `- Main Bundle: ${formatBytes(metrics.mainBundle)}`,
    `- Vendor Bundle: ${formatBytes(metrics.vendorBundle)}`,
    `- CSS: ${formatBytes(metrics.css)}`,
    `- Assets: ${formatBytes(metrics.assets)}`,
    '',
    '## Largest Chunks',
    ''
  ];

  metrics.chunks.slice(0, 10).forEach(chunk => {
    lines.push(`- ${chunk.name}: ${formatBytes(chunk.size)} (${formatBytes(chunk.gzipped)} gzipped)`);
  });

  return lines.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}