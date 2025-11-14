// ABOUTME: Alert service for production monitoring via Slack webhook.
// ABOUTME: Handles AI handoff notifications, job failures, and queue health alerts with graceful degradation.

/**
 * Parameters for handoff notification
 */
export interface HandoffNotificationParams {
  conversationUuid: string;
  chatwootId: number;
  reason: string;
  aiConfidence: number;
}

/**
 * Parameters for job failure notification
 */
export interface JobFailureParams {
  jobId: string;
  errorType: string;
  failedReason: string;
}

/**
 * Parameters for queue health notification
 */
export interface QueueHealthParams {
  level: 'WARNING' | 'CRITICAL';
  failedJobs: number;
  activeJobs: number;
  waitingJobs: number;
  timestamp: string;
}

/**
 * Send Slack notification when AI requests human handoff
 * Non-blocking: Errors are logged but don't fail the caller
 */
export async function notifyHandoffRequested(
  params: HandoffNotificationParams
): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhook) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping notification');
    return;
  }
  
  try {
    const message = {
      text: 'AI Handoff Requested',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Conversation:* #${params.chatwootId}\n*Reason:* ${params.reason}\n*AI Confidence:* ${(params.aiConfidence * 100).toFixed(1)}%`
          }
        }
      ]
    };
    
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Slack webhook failed:', response.statusText);
    } else {
      console.log('Handoff notification sent to Slack for conversation:', params.chatwootId);
    }
  } catch (error) {
    console.error('Failed to send handoff notification:', error);
    // Don't throw - this is non-blocking
  }
}

/**
 * Send Slack notification when a broker job fails
 * Non-blocking: Errors are logged but don't fail the caller
 * 
 * @param jobId - BullMQ job identifier
 * @param errorType - Error classification (TIMEOUT, API_ERROR, VALIDATION_ERROR, etc.)
 * @param failedReason - Detailed error message from worker
 */
export async function notifyJobFailure(
  jobId: string,
  errorType: string,
  failedReason: string
): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhook) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping job failure notification');
    return;
  }
  
  try {
    const message = {
      text: 'Broker Job Failed',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Job ID:* ${jobId}\n*Error Type:* ${errorType}\n*Details:* ${failedReason}`
          }
        }
      ]
    };
    
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Slack webhook failed for job failure:', response.statusText);
    } else {
      console.log('Job failure notification sent to Slack for job:', jobId);
    }
  } catch (error) {
    console.error('Failed to send job failure notification:', error);
    // Don't throw - this is non-blocking
  }
}

/**
 * Send Slack notification for queue health issues
 * Non-blocking: Errors are logged but don't fail the caller
 * 
 * @param params - Queue health metrics and alert level
 */
export async function notifyQueueHealth(
  params: QueueHealthParams
): Promise<void> {
  const slackWebhook = process.env.SLACK_WEBHOOK_URL;
  
  if (!slackWebhook) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping queue health notification');
    return;
  }
  
  try {
    const emoji = params.level === 'CRITICAL' ? '🚨' : '⚠️';
    
    const message = {
      text: `Queue Health Alert: ${params.level}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *Queue Health: ${params.level}*\n*Failed Jobs:* ${params.failedJobs}\n*Active Jobs:* ${params.activeJobs}\n*Waiting Jobs:* ${params.waitingJobs}\n*Timestamp:* ${params.timestamp}`
          }
        }
      ]
    };
    
    const response = await fetch(slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      console.error('Slack webhook failed for queue health:', response.statusText);
    } else {
      console.log(`Queue health ${params.level} notification sent to Slack`);
    }
  } catch (error) {
    console.error('Failed to send queue health notification:', error);
    // Don't throw - this is non-blocking
  }
}
