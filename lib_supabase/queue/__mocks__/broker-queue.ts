export const getQueueStatus = jest.fn();
export const getAverageProcessingTime = jest.fn();
export const getBrokerQueue = jest.fn(() => ({
  getWaiting: jest.fn(),
  getActive: jest.fn(),
  getCompleted: jest.fn(),
  getActiveCount: jest.fn(),
  getWaitingCount: jest.fn(),
  getCompletedCount: jest.fn(),
  getFailedCount: jest.fn(),
  getDelayedCount: jest.fn(),
}));

export interface QueueStatus {
  status: 'assigned' | 'waiting' | 'processing' | 'not_in_queue';
  conversationId: number | string;
  conversationUuid?: string;
  broker?: { id: string; name: string };
  position?: number;
  estimatedWaitMinutes?: number;
}

export interface BrokerConversationJob {
  type: 'new-conversation' | 'incoming-message';
  conversationId: number;
  contactId: number;
  brokerId?: string;
  brokerName?: string;
  brokerPersona: any;
  processedLeadData: any;
  userMessage?: string;
  isConversationReopen?: boolean;
  skipGreeting?: boolean;
  timingData?: {
    messageId: string;
    queueAddTimestamp: number;
  };
  timestamp?: number;
}

export interface MessageTimingData {
  messageId: string;
  conversationId: number;
  queueAddTimestamp?: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
  chatwootSendTimestamp?: number;
  totalDuration?: number;
  aiSegment?: {
    model?: string;
    promptLength?: number;
    responseLength?: number;
    orchestratorPath?: string;
    aiStartTimestamp?: number;
    aiCompleteTimestamp?: number;
    aiProcessingTime?: number;
  };
}

export function getBrokerQueueEvents() {
  return {
    on: jest.fn(),
  };
}

export function queueNewConversation() {
  return Promise.resolve({});
}

export function queueIncomingMessage() {
  return Promise.resolve({});
}

export async function getQueueMetrics() {
  return {};
}

export async function pauseQueue() {}
export async function resumeQueue() {}
export async function drainQueue() {}
export async function updateTimingData() {}
export async function getTimingData() {
  return null;
}
export async function getSLATimingData() {
  return [];
}
export async function getFailedJobsBreakdown() {
  return { total: 0, byErrorType: {} };
}
