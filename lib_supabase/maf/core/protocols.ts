// ABOUTME: Defines typed envelopes exchanged between agents, beads, and supervision layers.
// ABOUTME: Keeps schema parity with upstream tools while remaining implementation agnostic.

export interface MafTaskClaim {
  type: 'TASK_CLAIM';
  agentId: string;
  beadId: string;
  files: string[];
  etaMinutes: number;
}

export interface MafWorkComplete {
  type: 'WORK_COMPLETE';
  agentId: string;
  beadId: string;
  tests: {
    passed: boolean;
    command: string;
    outputPath?: string;
  };
  commit?: string;
  notes?: string;
}

export type MafProtocolEnvelope = MafTaskClaim | MafWorkComplete;
