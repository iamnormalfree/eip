// ABOUTME: Provides the high-level coordination surface for multi-agent workflows.
// ABOUTME: Currently exposes typed hooks so future implementations can plug in beads and agent mail.

import type { MafProtocolEnvelope } from './protocols';
import type { MafRuntimeState } from './runtime-state';
import type { MafScheduler, MafTaskSummary } from '../scheduling/scheduler';

export interface MafCoordinatorConfig {
  runtime: MafRuntimeState;
  /**
   * Path to the beads CLI executable.
   * Example: `${process.cwd()}/node_modules/.bin/beads`
   */
  beadsExecutable: string;
  /**
   * Filesystem path for agent mail data (inbox/outbox/reservations).
   */
  agentMailRoot: string;
  scheduler?: MafScheduler;
}

export interface MafCoordinator {
  readonly config: MafCoordinatorConfig;
  dispatch(message: MafProtocolEnvelope): Promise<void>;
  refreshRuntimeState(): Promise<void>;
  claimNextTask(agentId: string): Promise<MafTaskSummary | null>;
}

export function createMafCoordinator(config: MafCoordinatorConfig): MafCoordinator {
  return {
    config,
    async dispatch(message) {
      // Placeholder: actual implementation will route to beads / agent mail as needed.
      config.runtime.enqueue(message);
    },
    async refreshRuntimeState() {
      await config.runtime.refresh();
    },
    async claimNextTask(agentId) {
      if (!config.scheduler) {
        return null;
      }
      return config.scheduler.pickNextTask(agentId);
    },
  };
}
