// ABOUTME: Bull Board configuration for queue monitoring
// ABOUTME: Exposes BullMQ queues to Bull Board UI

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getBrokerQueue } from './broker-queue';

let serverAdapter: ExpressAdapter | null = null;
let boardInstance: ReturnType<typeof createBullBoard> | null = null;

export function getBullBoard() {
  if (serverAdapter && boardInstance) {
    return { serverAdapter, board: boardInstance };
  }

  serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/api/admin/queues');

  const queue = getBrokerQueue();

  boardInstance = createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  return { serverAdapter, board: boardInstance };
}
