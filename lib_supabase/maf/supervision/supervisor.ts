// ABOUTME: Defines the supervision hook that will watch agent health and recover from failures.
// ABOUTME: Stubs out timers so production logic can slot in later.

import type { MafRuntimeState } from '../core/runtime-state';

export interface MafSupervisor {
  start(): void;
  stop(): void;
}

export function createPollingSupervisor(runtime: MafRuntimeState, intervalMs = 60_000): MafSupervisor {
  let timer: NodeJS.Timeout | undefined;

  return {
    start() {
      if (timer) return;
      timer = setInterval(() => {
        void runtime.refresh();
      }, intervalMs);
    },
    stop() {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    },
  };
}
