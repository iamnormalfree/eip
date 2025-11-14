// ABOUTME: SLA monitoring and event emission for real-time chat performance tracking.
// ABOUTME: Checks response times against configurable thresholds and emits Ably events.

import { publishEvent } from '../realtime/ably-server';
import { isRealtimeEnabled } from '../utils/feature-flags';

export interface MessageTimingData {
  messageId?: string;
  queueAddTimestamp?: number;
  workerStartTimestamp?: number;
  workerCompleteTimestamp?: number;
}

export interface SLACheckResult {
  violated: boolean;
  warning: boolean;
  responseTime: number;
  threshold: number;
}

const SLA_WARNING_MS = parseInt(process.env.SLA_WARNING_MS || '8000');
const SLA_VIOLATION_MS = parseInt(process.env.SLA_VIOLATION_MS || '15000');

/**
 * Check response time against SLA thresholds and emit events
 * Non-blocking: Errors are logged but don't throw
 */
export async function checkAndEmitSLAEvents(
  conversationUuid: string,
  timingData: MessageTimingData
): Promise<SLACheckResult> {
  // Early return if realtime disabled
  if (!isRealtimeEnabled()) {
    return { violated: false, warning: false, responseTime: 0, threshold: 0 };
  }

  const { queueAddTimestamp, workerCompleteTimestamp } = timingData;
  
  // Early return if timing data incomplete
  if (!queueAddTimestamp || !workerCompleteTimestamp) {
    return { violated: false, warning: false, responseTime: 0, threshold: 0 };
  }
  
  // Calculate total response time
  const totalDuration = workerCompleteTimestamp - queueAddTimestamp;
  
  // Determine SLA status FIRST (before attempting to publish)
  let violated = false;
  let warning = false;
  let threshold = 0;
  
  if (totalDuration > SLA_VIOLATION_MS) {
    violated = true;
    threshold = SLA_VIOLATION_MS;
  } else if (totalDuration > SLA_WARNING_MS) {
    warning = true;
    threshold = SLA_WARNING_MS;
  }
  
  // Attempt to publish events (non-blocking)
  if (violated || warning) {
    try {
      if (violated) {
        await publishEvent(conversationUuid, 'sla:violation', {
          responseTime: totalDuration / 1000,
          threshold: SLA_VIOLATION_MS / 1000,
          timestamp: new Date().toISOString(),
          messageId: timingData.messageId
        });
      } else if (warning) {
        await publishEvent(conversationUuid, 'sla:warning', {
          responseTime: totalDuration / 1000,
          threshold: SLA_WARNING_MS / 1000,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      // Non-blocking: Log but don't throw
      console.error('❌ Failed to emit SLA event (non-blocking):', error);
    }
  }
  
  // Return result regardless of publish success
  return { violated, warning, responseTime: totalDuration, threshold };
}
