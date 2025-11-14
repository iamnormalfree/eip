// Unified session storage keys
const KEYS = {
  CHATWOOT_SESSION: (sessionId: string) => `chatwoot_session_${sessionId}`,
  FORM_DATA: 'form_data',
  LEAD_SCORE: 'lead_score',
  WIDGET_CONFIG: 'chatwoot_widget_config',
  ANALYSIS_DATA: 'analysis_data',
  BROKER_DATA: 'broker_data'
} as const

// Broker assignment data from API response
export interface AssignedBroker {
  name: string
  id: string
  status: 'assigned' | 'queued' | 'engaged'
}

// Pre-selected persona used for UI fallback
export interface BrokerPersona {
  name: string
  title: string
  approach?: string
}

// Enhanced session interface with broker data propagation
export interface ChatwootSession {
  conversationId: number
  contactId?: number
  email?: string
  createdAt?: string
  brokerName?: string  // Legacy field for backward compatibility
  broker?: AssignedBroker | null  // Real broker from Supabase (Tier 1)
  preselectedPersona?: BrokerPersona  // UI fallback persona (Tier 2)
  formData?: any  // Form data from submission
  timestamp?: number  // Session creation timestamp
}

export const sessionManager = {
  getChatwootSession(sessionId: string): ChatwootSession | null {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.CHATWOOT_SESSION(sessionId))
    return stored ? JSON.parse(stored) : null
  },

  setChatwootSession(sessionId: string, data: ChatwootSession) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.CHATWOOT_SESSION(sessionId), JSON.stringify(data))
  },

  getFormData() {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.FORM_DATA)
    return stored ? JSON.parse(stored) : null
  },

  setFormData(data: any) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.FORM_DATA, JSON.stringify(data))
  },

  getLeadScore(): number | null {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.LEAD_SCORE)
    return stored ? parseFloat(stored) : null
  },

  setLeadScore(score: number) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.LEAD_SCORE, score.toString())
  },

  getAnalysisData() {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.ANALYSIS_DATA)
    return stored ? JSON.parse(stored) : null
  },

  setAnalysisData(data: any) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.ANALYSIS_DATA, JSON.stringify(data))
  },

  getBrokerData() {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.BROKER_DATA)
    return stored ? JSON.parse(stored) : null
  },

  setBrokerData(data: any) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.BROKER_DATA, JSON.stringify(data))
  },

  getWidgetConfig() {
    if (typeof window === 'undefined') return null
    const stored = sessionStorage.getItem(KEYS.WIDGET_CONFIG)
    return stored ? JSON.parse(stored) : null
  },

  setWidgetConfig(config: any) {
    if (typeof window === 'undefined') return
    sessionStorage.setItem(KEYS.WIDGET_CONFIG, JSON.stringify(config))
  },

  clearSession(sessionId?: string) {
    if (typeof window === 'undefined') return
    if (sessionId) {
      sessionStorage.removeItem(KEYS.CHATWOOT_SESSION(sessionId))
    }
    sessionStorage.removeItem(KEYS.FORM_DATA)
    sessionStorage.removeItem(KEYS.LEAD_SCORE)
    sessionStorage.removeItem(KEYS.ANALYSIS_DATA)
    sessionStorage.removeItem(KEYS.BROKER_DATA)
    sessionStorage.removeItem(KEYS.WIDGET_CONFIG)
  }
}