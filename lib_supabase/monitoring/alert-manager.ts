/**
 * Alert Manager
 * Handles monitoring alerts and notifications
 */

import { HealthCheckResult } from '@/app/api/health/chat-integration/route';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface Alert {
  id: string;
  timestamp: string;
  severity: AlertSeverity;
  service: string;
  title: string;
  message: string;
  details?: any;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertRule {
  name: string;
  description: string;
  condition: (result: HealthCheckResult) => boolean;
  severity: AlertSeverity;
  message: (result: HealthCheckResult) => string;
}

export interface NotificationChannel {
  name: string;
  type: 'slack' | 'discord' | 'email' | 'webhook';
  enabled: boolean;
  config: any;
}

/**
 * Alert Manager Class
 * Manages alerts, rules, and notifications
 */
export class AlertManager {
  private alerts: Map<string, Alert> = new Map();
  private rules: AlertRule[] = [];
  private channels: NotificationChannel[] = [];
  private alertHistory: Alert[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.initializeNotificationChannels();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules() {
    this.rules = [
      // Chatwoot API unhealthy
      {
        name: 'chatwoot_api_down',
        description: 'Chatwoot API is not responding',
        condition: (result) => 
          result.service === 'chatwoot_api' && result.status === 'unhealthy',
        severity: AlertSeverity.CRITICAL,
        message: (result) => 
          `Chatwoot API is down: ${result.details || 'No response'}`
      },
      
      // Chatwoot API degraded
      {
        name: 'chatwoot_api_slow',
        description: 'Chatwoot API response time is high',
        condition: (result) => 
          result.service === 'chatwoot_api' && result.status === 'degraded',
        severity: AlertSeverity.WARNING,
        message: (result) => 
          `Chatwoot API is slow: ${result.responseTime}ms response time`
      },
      
      // Circuit breaker open
      {
        name: 'circuit_breaker_open',
        description: 'Circuit breaker has opened',
        condition: (result) => 
          result.service === 'circuit_breaker' && 
          result.metadata?.state === 'OPEN',
        severity: AlertSeverity.ERROR,
        message: (result) => 
          'Circuit breaker is OPEN - fallback mode activated'
      },
      
      // Analytics service down
      {
        name: 'analytics_down',
        description: 'Analytics service is not responding',
        condition: (result) => 
          result.service === 'analytics' && result.status === 'unhealthy',
        severity: AlertSeverity.WARNING,
        message: (result) => 
          `Analytics service is down: ${result.details || 'Service unreachable'}`
      },
      
      // Security misconfiguration
      {
        name: 'security_misconfigured',
        description: 'Security features are not properly configured',
        condition: (result) => 
          result.service === 'security' && result.status === 'unhealthy',
        severity: AlertSeverity.CRITICAL,
        message: (result) => 
          'Security misconfiguration detected - audit logging or encryption disabled'
      },
      
      // Database connection issues
      {
        name: 'database_connection_issues',
        description: 'Database connectivity problems',
        condition: (result) => 
          result.service === 'database' && result.status !== 'healthy',
        severity: AlertSeverity.ERROR,
        message: (result) => 
          `Database issues: ${result.details || 'Connection problems'}`
      }
    ];
  }

  /**
   * Initialize notification channels from environment
   */
  private initializeNotificationChannels() {
    this.channels = [];
    
    // Slack webhook
    if (process.env.SLACK_WEBHOOK_URL) {
      this.channels.push({
        name: 'Slack',
        type: 'slack',
        enabled: true,
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL
        }
      });
    }
    
    // Discord webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
      this.channels.push({
        name: 'Discord',
        type: 'discord',
        enabled: true,
        config: {
          webhookUrl: process.env.DISCORD_WEBHOOK_URL
        }
      });
    }
    
    // Generic webhook
    if (process.env.ALERT_WEBHOOK_URL) {
      this.channels.push({
        name: 'Webhook',
        type: 'webhook',
        enabled: true,
        config: {
          url: process.env.ALERT_WEBHOOK_URL,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      });
    }
  }

  /**
   * Process health check results and generate alerts
   */
  async processHealthCheck(results: HealthCheckResult[]): Promise<Alert[]> {
    const newAlerts: Alert[] = [];
    const currentAlertKeys = new Set<string>();

    for (const result of results) {
      for (const rule of this.rules) {
        if (rule.condition(result)) {
          const alertKey = `${rule.name}_${result.service}`;
          currentAlertKeys.add(alertKey);

          // Check if alert already exists
          if (!this.alerts.has(alertKey)) {
            const alert: Alert = {
              id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date().toISOString(),
              severity: rule.severity,
              service: result.service,
              title: rule.description,
              message: rule.message(result),
              details: result,
              resolved: false
            };

            this.alerts.set(alertKey, alert);
            this.alertHistory.push(alert);
            newAlerts.push(alert);

            // Send notifications for new alerts
            await this.sendNotifications(alert);
          }
        }
      }
    }

    // Resolve alerts that are no longer active
    for (const [key, alert] of Array.from(this.alerts.entries())) {
      if (!currentAlertKeys.has(key) && !alert.resolved) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();

        // Send resolution notification
        await this.sendResolutionNotification(alert);

        // Remove from active alerts after a delay
        setTimeout(() => this.alerts.delete(key), 300000); // 5 minutes
      }
    }

    return newAlerts;
  }

  /**
   * Send notifications to all enabled channels
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    for (const channel of this.channels) {
      if (channel.enabled) {
        try {
          await this.sendToChannel(channel, alert);
        } catch (error) {
          console.error(`Failed to send alert to ${channel.name}:`, error);
        }
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(channel: NotificationChannel, alert: Alert): Promise<void> {
    switch (channel.type) {
      case 'slack':
        await this.sendSlackNotification(channel.config.webhookUrl, alert);
        break;
      case 'discord':
        await this.sendDiscordNotification(channel.config.webhookUrl, alert);
        break;
      case 'webhook':
        await this.sendWebhookNotification(channel.config, alert);
        break;
      default:
        console.log(`Unsupported channel type: ${channel.type}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(webhookUrl: string, alert: Alert): Promise<void> {
    const color = this.getSeverityColor(alert.severity);
    
    const payload = {
      attachments: [{
        color,
        title: `🚨 ${alert.title}`,
        text: alert.message,
        fields: [
          {
            title: 'Service',
            value: alert.service,
            short: true
          },
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'EIP Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(webhookUrl: string, alert: Alert): Promise<void> {
    const color = this.getSeverityColorHex(alert.severity);
    
    const payload = {
      embeds: [{
        title: `🚨 ${alert.title}`,
        description: alert.message,
        color: parseInt(color.replace('#', ''), 16),
        fields: [
          {
            name: 'Service',
            value: alert.service,
            inline: true
          },
          {
            name: 'Severity',
            value: alert.severity.toUpperCase(),
            inline: true
          }
        ],
        timestamp: alert.timestamp,
        footer: {
          text: 'EIP Monitoring'
        }
      }]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send generic webhook notification
   */
  private async sendWebhookNotification(config: any, alert: Alert): Promise<void> {
    const payload = {
      alert,
      metadata: {
        source: 'EIP',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    };

    await fetch(config.url, {
      method: 'POST',
      headers: config.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert): Promise<void> {
    const resolutionAlert = {
      ...alert,
      title: `✅ RESOLVED: ${alert.title}`,
      message: `${alert.message} - Issue has been resolved`,
      severity: AlertSeverity.INFO
    };

    await this.sendNotifications(resolutionAlert);
  }

  /**
   * Get severity color for Slack
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return '#36a64f';
      case AlertSeverity.WARNING:
        return '#ff9900';
      case AlertSeverity.ERROR:
        return '#ff0000';
      case AlertSeverity.CRITICAL:
        return '#990000';
      default:
        return '#808080';
    }
  }

  /**
   * Get severity color hex for Discord
   */
  private getSeverityColorHex(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO:
        return '#36a64f';
      case AlertSeverity.WARNING:
        return '#ff9900';
      case AlertSeverity.ERROR:
        return '#ff0000';
      case AlertSeverity.CRITICAL:
        return '#990000';
      default:
        return '#808080';
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(a => !a.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    for (const [key, alert] of Array.from(this.alerts.entries())) {
      if (alert.resolved) {
        this.alerts.delete(key);
      }
    }
  }

  /**
   * Add custom rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule by name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter(r => r.name !== name);
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return this.rules;
  }

  /**
   * Test alert system
   */
  async testAlert(): Promise<void> {
    const testAlert: Alert = {
      id: 'test_alert',
      timestamp: new Date().toISOString(),
      severity: AlertSeverity.INFO,
      service: 'test',
      title: 'Test Alert',
      message: 'This is a test alert from EIP monitoring system',
      resolved: false,
      details: {
        test: true,
        timestamp: Date.now()
      }
    };

    await this.sendNotifications(testAlert);
  }
}

// Export singleton instance
export const alertManager = new AlertManager();