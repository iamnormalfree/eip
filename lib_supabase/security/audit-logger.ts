/**
 * Audit Logger Module
 * Lead: Elena Rodriguez - Security Engineer
 * 
 * Comprehensive audit logging for PDPA compliance
 * Tracks all data processing activities and user interactions
 */

import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { SanitizedFormData } from './data-sanitization'

// Audit log entry structure
export interface AuditLogEntry {
  id: string
  timestamp: string
  event: AuditEventType
  userId?: string
  sessionId: string
  ipAddress: string
  userAgent: string
  data: AuditData
  compliance: ComplianceMetadata
  risk?: RiskAssessment
}

// Types of events to audit
export enum AuditEventType {
  // Form events
  FORM_STARTED = 'FORM_STARTED',
  FORM_STEP_COMPLETED = 'FORM_STEP_COMPLETED',
  FORM_COMPLETED = 'FORM_COMPLETED',
  FORM_ABANDONED = 'FORM_ABANDONED',
  
  // Chat transition events
  FORM_TO_CHAT_TRANSITION = 'FORM_TO_CHAT_TRANSITION',
  CHAT_CONVERSATION_CREATED = 'CHAT_CONVERSATION_CREATED',
  CHAT_FALLBACK_TRIGGERED = 'CHAT_FALLBACK_TRIGGERED',
  
  // Data events
  PII_DETECTED = 'PII_DETECTED',
  DATA_SANITIZED = 'DATA_SANITIZED',
  DATA_EXPORTED = 'DATA_EXPORTED',
  DATA_DELETED = 'DATA_DELETED',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Consent events
  CONSENT_GIVEN = 'CONSENT_GIVEN',
  CONSENT_WITHDRAWN = 'CONSENT_WITHDRAWN',
  
  // API events
  API_CALL_SUCCESS = 'API_CALL_SUCCESS',
  API_CALL_FAILURE = 'API_CALL_FAILURE',
  CIRCUIT_BREAKER_TRIGGERED = 'CIRCUIT_BREAKER_TRIGGERED'
}

// Audit data payload
export interface AuditData {
  action: string
  resource?: string
  dataTransferred?: string[]
  destination?: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}

// PDPA compliance metadata
export interface ComplianceMetadata {
  pdpaConsent: boolean
  dataMinimization: boolean
  encryptionUsed: boolean
  retentionPolicy: string
  legalBasis?: string
  dataSubjectRights?: string[]
}

// Risk assessment
export interface RiskAssessment {
  level: 'low' | 'medium' | 'high' | 'critical'
  factors: string[]
  mitigations: string[]
}

export class AuditLogger {
  private readonly logDir = path.join(process.cwd(), 'logs', 'audit')
  private readonly maxLogSize = 10 * 1024 * 1024 // 10MB per file
  private readonly retentionDays = 90 // PDPA requirement
  
  constructor() {
    // Ensure log directory exists
    this.ensureLogDirectory()
  }

  /**
   * Log form to chat transition
   */
  async logFormToChatTransition(
    sessionId: string,
    formData: SanitizedFormData,
    conversationId: number,
    request: NextRequest
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      event: AuditEventType.FORM_TO_CHAT_TRANSITION,
      userId: formData.email,
      sessionId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      data: {
        action: 'CREATE_CHAT_CONVERSATION',
        resource: `conversation_${conversationId}`,
        dataTransferred: Object.keys(formData).filter(key => key !== 'sanitizationReport'),
        destination: 'CHATWOOT',
        success: true,
        metadata: {
          leadScore: formData.sanitizationReport?.dataClassification,
          sanitizationApplied: (formData.sanitizationReport?.fieldsModified?.length || 0) > 0
        }
      },
      compliance: {
        pdpaConsent: true, // Assumed from form completion
        dataMinimization: this.verifyDataMinimization(formData),
        encryptionUsed: true,
        retentionPolicy: '90_days',
        legalBasis: 'legitimate_interest',
        dataSubjectRights: ['access', 'rectification', 'erasure', 'portability']
      },
      risk: this.assessRisk(formData, conversationId)
    }

    await this.writeAuditLog(entry)
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    sessionId: string,
    activity: string,
    details: any,
    request: NextRequest
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      event: AuditEventType.SUSPICIOUS_ACTIVITY,
      sessionId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      data: {
        action: 'SUSPICIOUS_ACTIVITY_DETECTED',
        success: false,
        metadata: {
          activity,
          details
        }
      },
      compliance: {
        pdpaConsent: false,
        dataMinimization: true,
        encryptionUsed: true,
        retentionPolicy: '180_days' // Longer retention for security events
      },
      risk: {
        level: 'high',
        factors: [activity],
        mitigations: ['logged', 'monitored', 'rate_limited']
      }
    }

    await this.writeAuditLog(entry)
    
    // Alert security team for high-risk events
    if (entry.risk?.level === 'high' || entry.risk?.level === 'critical') {
      await this.alertSecurityTeam(entry)
    }
  }

  /**
   * Log API call
   */
  async logAPICall(
    endpoint: string,
    method: string,
    success: boolean,
    responseTime: number,
    request: NextRequest,
    error?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      event: success ? AuditEventType.API_CALL_SUCCESS : AuditEventType.API_CALL_FAILURE,
      sessionId: request.headers.get('x-session-id') || 'unknown',
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      data: {
        action: `${method} ${endpoint}`,
        success,
        errorMessage: error,
        metadata: {
          responseTime,
          statusCode: success ? 200 : 500
        }
      },
      compliance: {
        pdpaConsent: true,
        dataMinimization: true,
        encryptionUsed: true,
        retentionPolicy: '30_days'
      }
    }

    await this.writeAuditLog(entry)
  }

  /**
   * Log consent events
   */
  async logConsentEvent(
    userId: string,
    sessionId: string,
    consentType: 'given' | 'withdrawn',
    scope: string[],
    request: NextRequest
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateAuditId(),
      timestamp: new Date().toISOString(),
      event: consentType === 'given' ? AuditEventType.CONSENT_GIVEN : AuditEventType.CONSENT_WITHDRAWN,
      userId,
      sessionId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      data: {
        action: `CONSENT_${consentType.toUpperCase()}`,
        success: true,
        metadata: {
          scope,
          timestamp: new Date().toISOString()
        }
      },
      compliance: {
        pdpaConsent: consentType === 'given',
        dataMinimization: true,
        encryptionUsed: true,
        retentionPolicy: '7_years', // Legal requirement for consent records
        legalBasis: 'consent',
        dataSubjectRights: ['withdraw', 'access']
      }
    }

    await this.writeAuditLog(entry)
  }

  /**
   * Write audit log entry to file
   */
  private async writeAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const filename = this.getCurrentLogFilename()
      const filepath = path.join(this.logDir, filename)
      
      // Append entry as JSON line
      const logLine = JSON.stringify(entry) + '\n'
      await fs.appendFile(filepath, logLine, 'utf8')
      
      // Check if rotation is needed
      await this.rotateLogsIfNeeded(filepath)
      
      // Clean old logs
      await this.cleanOldLogs()
    } catch (error) {
      // Fallback to console if file writing fails
      console.error('Failed to write audit log:', error)
      console.log('Audit Entry:', JSON.stringify(entry))
    }
  }

  /**
   * Verify data minimization compliance
   */
  private verifyDataMinimization(data: SanitizedFormData): boolean {
    // Check that only necessary fields are present
    const necessaryFields = ['name', 'email', 'phone', 'loanType', 'monthlyIncome']
    const dataFields = Object.keys(data).filter(key => key !== 'sanitizationReport')
    
    return dataFields.every(field => 
      necessaryFields.includes(field) || 
      field === 'propertyCategory' || 
      field === 'employmentType'
    )
  }

  /**
   * Assess risk level
   */
  private assessRisk(data: SanitizedFormData, conversationId: number): RiskAssessment {
    const factors: string[] = []
    const mitigations: string[] = ['data_sanitized', 'audit_logged']
    
    // Check for risk factors
    if (data.sanitizationReport?.piiDetected && data.sanitizationReport.piiDetected.length > 0) {
      factors.push('pii_detected')
      mitigations.push('pii_redacted')
    }
    
    if (data.sanitizationReport?.securityFlags && data.sanitizationReport.securityFlags.length > 0) {
      factors.push(...data.sanitizationReport.securityFlags)
    }
    
    if (!data.email || !data.phone) {
      factors.push('incomplete_contact_info')
    }
    
    // Determine risk level
    let level: RiskAssessment['level'] = 'low'
    if (factors.length > 3) {
      level = 'high'
    } else if (factors.length > 1) {
      level = 'medium'
    } else if (factors.includes('suspicious_pattern_detected')) {
      level = 'critical'
    }
    
    return { level, factors, mitigations }
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
      return realIP
    }
    
    return 'unknown'
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get current log filename
   */
  private getCurrentLogFilename(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `audit_${year}${month}${day}.jsonl`
  }

  /**
   * Ensure log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create log directory:', error)
    }
  }

  /**
   * Rotate logs if file size exceeds limit
   */
  private async rotateLogsIfNeeded(filepath: string): Promise<void> {
    try {
      const stats = await fs.stat(filepath)
      if (stats.size > this.maxLogSize) {
        const timestamp = Date.now()
        const rotatedPath = filepath.replace('.jsonl', `_${timestamp}.jsonl`)
        await fs.rename(filepath, rotatedPath)
      }
    } catch (error) {
      // File doesn't exist yet, no rotation needed
    }
  }

  /**
   * Clean logs older than retention period
   */
  private async cleanOldLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir)
      const now = Date.now()
      const retentionMs = this.retentionDays * 24 * 60 * 60 * 1000
      
      for (const file of files) {
        if (file.startsWith('audit_') && file.endsWith('.jsonl')) {
          const filepath = path.join(this.logDir, file)
          const stats = await fs.stat(filepath)
          
          if (now - stats.mtime.getTime() > retentionMs) {
            await fs.unlink(filepath)
            console.log(`Deleted old audit log: ${file}`)
          }
        }
      }
    } catch (error) {
      console.error('Failed to clean old logs:', error)
    }
  }

  /**
   * Alert security team for high-risk events
   */
  private async alertSecurityTeam(entry: AuditLogEntry): Promise<void> {
    // In production, this would send alerts via email, Slack, etc.
    console.warn('🚨 SECURITY ALERT:', {
      id: entry.id,
      event: entry.event,
      risk: entry.risk,
      timestamp: entry.timestamp
    })
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(startDate: Date, endDate: Date): Promise<any> {
    const logs = await this.readLogsInRange(startDate, endDate)
    
    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalEvents: logs.length,
        consentEvents: logs.filter(l => l.event.includes('CONSENT')).length,
        securityEvents: logs.filter(l => l.event === AuditEventType.SUSPICIOUS_ACTIVITY).length,
        dataTransfers: logs.filter(l => l.event === AuditEventType.FORM_TO_CHAT_TRANSITION).length
      },
      compliance: {
        pdpaCompliant: logs.every(l => l.compliance.pdpaConsent || l.compliance.legalBasis),
        dataMinimization: logs.filter(l => l.compliance.dataMinimization).length / logs.length,
        encryptionCoverage: logs.filter(l => l.compliance.encryptionUsed).length / logs.length
      },
      risks: {
        high: logs.filter(l => l.risk?.level === 'high').length,
        critical: logs.filter(l => l.risk?.level === 'critical').length
      }
    }
  }

  /**
   * Read logs within date range
   */
  private async readLogsInRange(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
    const logs: AuditLogEntry[] = []
    
    try {
      const files = await fs.readdir(this.logDir)
      
      for (const file of files) {
        if (file.startsWith('audit_') && file.endsWith('.jsonl')) {
          const filepath = path.join(this.logDir, file)
          const content = await fs.readFile(filepath, 'utf8')
          const lines = content.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const entry = JSON.parse(line) as AuditLogEntry
              const entryDate = new Date(entry.timestamp)
              
              if (entryDate >= startDate && entryDate <= endDate) {
                logs.push(entry)
              }
            } catch (error) {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to read audit logs:', error)
    }
    
    return logs
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()