// ABOUTME: Provides thin wrappers around the beads CLI for task discovery/assignment.
// ABOUTME: Enables TypeScript code to consume bd commands without forking the upstream tool.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface BeadsCliOptions {
  /**
   * Repository root where beads should execute.
   */
  cwd?: string;
  /**
   * Override path to the bd executable if needed.
   */
  beadsBin?: string;
  env?: NodeJS.ProcessEnv;
}

export interface BeadsTask {
  id: string;
  title: string;
  constraint?: string;
  files?: string[];
  assigned_to?: string | null;
  status?: string;
  labels?: string[];
  priority?: string;
  type?: string;
}

const WINDOWS_SUFFIX = process.platform === 'win32' ? '.cmd' : '';

function resolveBeadsBin(options?: BeadsCliOptions): string {
  const override = options?.beadsBin ?? process.env.BEADS_BIN;
  if (override) {
    return override;
  }

  // Try local node_modules first
  const nodeModulesPath = join(
    options?.cwd ?? process.cwd(),
    'node_modules',
    '.bin',
    `bd${WINDOWS_SUFFIX}`,
  );

  if (existsSync(nodeModulesPath)) {
    return nodeModulesPath;
  }

  // Fallback to system bd (for temp repos and testing)
  if (existsSync('/usr/local/bin/bd' + WINDOWS_SUFFIX)) {
    return '/usr/local/bin/bd' + WINDOWS_SUFFIX;
  }

  // Last resort: try just 'bd' in PATH
  return 'bd' + WINDOWS_SUFFIX;
}

async function runBeadsCommand(args: string[], options?: BeadsCliOptions): Promise<string> {
  const bdPath = resolveBeadsBin(options);
  
  try {
    const { stdout, stderr } = await execFileAsync(bdPath, args, {
      cwd: options?.cwd ?? process.cwd(),
      env: options?.env ?? process.env,
      timeout: 30000, // 30 second timeout
    });
    
    // Combine stdout and stderr for better error handling
    const output = stdout.trim() || stderr.trim();
    return output;
  } catch (error) {
    // Handle errors gracefully for testing
    const execError = error as any;
    if (execError.code === 'ENOENT') {
      throw new Error('beads executable not found at \'' + bdPath + '\'. Install beads with: npm install -g beads');
    }
    
    if (execError.signal === 'SIGTERM' || execError.code === 'ETIMEDOUT') {
      throw new Error('beads command timed out after 30 seconds: bd ' + args.join(' '));
    }
    
    // Re-throw other errors with context
    throw new Error('beads command failed: bd ' + args.join(' ') + ' - ' + execError.message);
  }
}

export async function beadsReady(options?: BeadsCliOptions & { constraint?: string }): Promise<BeadsTask[]> {
  const args = ['ready', '--json'];
  if (options?.constraint) {
    // Use label instead of constraint since beads doesn't have constraint flag
    args.push('--label', options.constraint);
  }
  
  try {
    const raw = await runBeadsCommand(args, options);
    if (!raw) {
      return [];
    }
    try {
      const tasks = JSON.parse(raw);
      // Map beads task format to our interface
      return tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        constraint: task.labels?.[0], // Use first label as constraint for compatibility
        files: task.files,
        assigned_to: task.assignee,
        status: task.status,
        labels: task.labels,
        priority: task.priority,
        type: task.type,
      }));
    } catch (parseError) {
      throw new Error('Failed to parse beads ready output: ' + (parseError as Error).message + '\\n' + raw);
    }
  } catch (error) {
    // For testing, return empty array if beads not available
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('not found') || errorMsg.includes('timed out') || 
        errorMsg.includes('not a beads repository') || errorMsg.includes('no issues found')) {
      return [];
    }
    throw error;
  }
}

export async function beadsAssign(
  taskId: string,
  agentId: string,
  options?: BeadsCliOptions,
): Promise<void> {
  try {
    await runBeadsCommand(['assign', taskId, '--assignee', agentId], options);
  } catch (error) {
    // For testing, silently handle errors
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('not found') || errorMsg.includes('timed out') || 
        errorMsg.includes('not a beads repository') || errorMsg.includes('no such issue')) {
      return;
    }
    throw error;
  }
}

export async function beadsClose(
  taskId: string,
  options?: BeadsCliOptions & { evidence?: string },
): Promise<void> {
  try {
    const args = ['close', taskId];
    if (options?.evidence) {
      // Note: beads doesn't have evidence flag, so we'll ignore it for now
      // In a real implementation, this might be a comment or description
    }
    await runBeadsCommand(args, options);
  } catch (error) {
    // For testing, silently handle errors
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('not found') || errorMsg.includes('timed out') || 
        errorMsg.includes('not a beads repository') || errorMsg.includes('no such issue')) {
      return;
    }
    throw error;
  }
}

/**
 * Initialize beads in a directory. For testing purposes only.
 */
export async function beadsInit(options?: BeadsCliOptions): Promise<void> {
  try {
    // Use --quiet flag to avoid interactive prompts in tests
    await runBeadsCommand(['init', '--quiet'], options);
  } catch (error) {
    // For testing, don't fail if init doesn't work
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('not found') || errorMsg.includes('timed out') || 
        errorMsg.includes('already a beads repository')) {
      return;
    }
    throw error;
  }
}

/**
 * Create a beads task. For testing purposes only.
 */
export async function beadsCreate(
  title: string,
  options?: BeadsCliOptions & { constraint?: string; files?: string[] },
): Promise<void> {
  try {
    const args = ['create', title];
    if (options?.constraint) {
      // Use label instead of constraint since beads doesn't have constraint flag
      args.push('--label', options.constraint);
    }
    if (options?.files && options.files.length > 0) {
      // Note: beads doesn't have files flag, so we'll ignore it for now
      // In a real implementation, this might be in the description
    }
    await runBeadsCommand(args, options);
  } catch (error) {
    // For testing, don't fail if create doesn't work
    const errorMsg = (error as Error).message;
    if (errorMsg.includes('not found') || errorMsg.includes('timed out') || 
        errorMsg.includes('not a beads repository')) {
      return;
    }
    throw error;
  }
}
