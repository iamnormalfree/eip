export interface CompetitorSignals {
  sessionId: string
  completionSpeed: number
  email?: string
  phonePattern?: string
  browserFingerprint?: string
  formBehavior?: {
    skipPatterns: boolean
    rapidFilling: boolean
    noCorrections: boolean
  }
}

export interface GatedInformation {
  situationalInsights: any[]
  rateIntelligence: any
  defenseStrategy?: any
}

export class CompetitiveProtectionAgent {
  private readonly competitorDomains = [
    'propertyguru.com',
    'dbs.com',
    'ocbc.com', 
    'uob.com',
    'sc.com',
    'mortgagemaster.sg',
    'redbrick.sg',
    'mortgagewise.sg'
  ]

  private readonly suspiciousPatterns = {
    emails: [
      /test\d+@/,
      /competitor.*@/,
      /research.*@/,
      /analysis.*@/,
      /.*\.competitor\./
    ],
    phones: [
      /^1234567$/,
      /^9999999$/,
      /^8888888$/,
      /^1111111$/
    ],
    names: [
      /^test$/i,
      /^demo$/i,
      /^competitor$/i,
      /^research$/i
    ]
  }

  private readonly rapidCompletionThreshold = 30000 // 30 seconds for full form
  private readonly sessionMonitor = new Map<string, { 
    startTime: number
    actions: string[]
    flagged: boolean 
  }>()

  detectCompetitorSignals(signals: CompetitorSignals): boolean {
    const checks = [
      this.checkCompletionSpeed(signals.completionSpeed),
      this.checkEmailDomain(signals.email),
      this.checkPhonePattern(signals.phonePattern),
      this.checkFormBehavior(signals.formBehavior),
      this.checkSessionPattern(signals.sessionId)
    ]

    const suspicionScore = checks.filter(Boolean).length
    
    // Flag session if multiple indicators
    if (suspicionScore >= 2) {
      this.flagSession(signals.sessionId)
      return true
    }

    return false
  }

  private checkCompletionSpeed(completionTime: number): boolean {
    return completionTime < this.rapidCompletionThreshold
  }

  private checkEmailDomain(email?: string): boolean {
    if (!email) return false

    // Check against competitor domains
    const domain = email.split('@')[1]?.toLowerCase()
    if (this.competitorDomains.some(comp => domain?.includes(comp))) {
      return true
    }

    // Check suspicious patterns
    return this.suspiciousPatterns.emails.some(pattern => pattern.test(email))
  }

  private checkPhonePattern(phone?: string): boolean {
    if (!phone) return false
    return this.suspiciousPatterns.phones.some(pattern => pattern.test(phone))
  }

  private checkFormBehavior(behavior?: CompetitorSignals['formBehavior']): boolean {
    if (!behavior) return false

    const suspiciousCount = [
      behavior.skipPatterns,
      behavior.rapidFilling,
      behavior.noCorrections
    ].filter(Boolean).length

    return suspiciousCount >= 2
  }

  private checkSessionPattern(sessionId: string): boolean {
    const session = this.sessionMonitor.get(sessionId)
    if (!session) return false

    // Check for automated patterns
    const actionIntervals = this.calculateActionIntervals(session.actions)
    const hasConsistentTiming = this.hasConsistentIntervals(actionIntervals)
    
    return hasConsistentTiming || session.flagged
  }

  private calculateActionIntervals(actions: string[]): number[] {
    const intervals: number[] = []
    for (let i = 1; i < actions.length; i++) {
      const prev = parseInt(actions[i - 1].split(':')[0])
      const curr = parseInt(actions[i].split(':')[0])
      intervals.push(curr - prev)
    }
    return intervals
  }

  private hasConsistentIntervals(intervals: number[]): boolean {
    if (intervals.length < 3) return false
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2)
    }, 0) / intervals.length
    
    // Low variance suggests automated behavior
    return variance < 100
  }

  gateInformation(
    information: GatedInformation,
    isCompetitor: boolean
  ): GatedInformation {
    if (!isCompetitor) {
      return information // Return full information for legitimate users
    }

    // Gate sensitive information for competitors
    return {
      situationalInsights: this.filterInsights(information.situationalInsights),
      rateIntelligence: this.obscureRateIntelligence(information.rateIntelligence),
      defenseStrategy: null // Never share defense strategy with competitors
    }
  }

  private filterInsights(insights: any[]): any[] {
    if (!insights) return []

    // Only return generic insights
    return insights.map(insight => ({
      ...insight,
      title: this.genericizeTitle(insight.title),
      message: this.genericizeMessage(insight.message),
      strategicIntelligence: null // Remove strategic details
    }))
  }

  private genericizeTitle(title: string): string {
    const genericTitles: Record<string, string> = {
      'Immediate Action Required': 'Timeline Consideration',
      'Lock-in Ending Advantage': 'Refinancing Opportunity',
      'Market Timing Optimal': 'Market Conditions',
      'Strategic Opportunity': 'General Opportunity'
    }

    return genericTitles[title] || 'Information Update'
  }

  private genericizeMessage(message: string): string {
    // Remove specific numbers and strategic details
    return message
      .replace(/\d+(\.\d+)?%/g, 'X%')
      .replace(/\$[\d,]+/g, '$X')
      .replace(/\d+ days?/gi, 'several days')
      .replace(/\d+ months?/gi, 'a few months')
      .replace(/save.*annually/gi, 'potential savings available')
      .replace(/specific bank names/gi, 'various banks')
  }

  private obscureRateIntelligence(intelligence: any): any {
    if (!intelligence) return null

    return {
      marketPhase: 'Current Market',
      generalTrend: 'Market conditions apply',
      disclaimer: 'Contact our brokers for specific rate information'
    }
  }

  monitorSession(sessionId: string, action: string): void {
    const timestamp = Date.now()
    
    if (!this.sessionMonitor.has(sessionId)) {
      this.sessionMonitor.set(sessionId, {
        startTime: timestamp,
        actions: [],
        flagged: false
      })
    }

    const session = this.sessionMonitor.get(sessionId)!
    session.actions.push(`${timestamp}:${action}`)

    // Clean up old sessions (older than 1 hour)
    this.cleanupOldSessions()
  }

  private flagSession(sessionId: string): void {
    const session = this.sessionMonitor.get(sessionId)
    if (session) {
      session.flagged = true
      console.warn(`🚨 Competitor detected - Session ${sessionId} flagged`)
      
      // Log for analysis
      this.logCompetitorDetection(sessionId, session)
    }
  }

  private logCompetitorDetection(sessionId: string, session: any): void {
    const detection = {
      sessionId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - session.startTime,
      actionCount: session.actions.length,
      flagged: true
    }

    // In production, send to analytics service
    console.log('Competitor Detection:', detection)
  }

  private cleanupOldSessions(): void {
    const oneHourAgo = Date.now() - 3600000
    
    const entries = Array.from(this.sessionMonitor.entries())
    for (const [sessionId, session] of entries) {
      if (session.startTime < oneHourAgo) {
        this.sessionMonitor.delete(sessionId)
      }
    }
  }

  generateSafeResponse(isCompetitor: boolean): {
    message: string
    showBrokerCTA: boolean
    restrictedFeatures: string[]
  } {
    if (!isCompetitor) {
      return {
        message: '',
        showBrokerCTA: true,
        restrictedFeatures: []
      }
    }

    return {
      message: 'Thank you for your interest. Please contact our licensed brokers for personalized assistance.',
      showBrokerCTA: true,
      restrictedFeatures: [
        'detailed-insights',
        'rate-intelligence',
        'defense-strategies',
        'optimization-recommendations'
      ]
    }
  }

  // Check if request comes from known competitor IP ranges
  checkIPReputation(ip: string): boolean {
    // In production, integrate with IP reputation service
    const suspiciousRanges = [
      '203.127.', // Example competitor IP range
      '165.225.', // Example data center range
    ]

    return suspiciousRanges.some(range => ip.startsWith(range))
  }

  // Rate limiting for suspicious sessions
  getRateLimitForSession(sessionId: string): {
    allowed: boolean
    retryAfter?: number
  } {
    const session = this.sessionMonitor.get(sessionId)
    
    if (!session || !session.flagged) {
      return { allowed: true }
    }

    // Implement exponential backoff for flagged sessions
    const actionCount = session.actions.length
    const delayMs = Math.min(1000 * Math.pow(2, actionCount - 5), 60000)
    
    const lastAction = session.actions[session.actions.length - 1]
    const lastTimestamp = parseInt(lastAction.split(':')[0])
    const timeSinceLastAction = Date.now() - lastTimestamp

    if (timeSinceLastAction < delayMs) {
      return {
        allowed: false,
        retryAfter: delayMs - timeSinceLastAction
      }
    }

    return { allowed: true }
  }
}