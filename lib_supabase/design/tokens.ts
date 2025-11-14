/**
 * EIP Design Tokens - Single Source of Truth
 *
 * Reference Implementation: /app/page.tsx (production homepage)
 * Historical: /app/redesign/sophisticated-flow/page.tsx (archived 2025-10)
 *
 * Design System: 90% Monochrome + 10% Yellow Accent
 * Visual Style: Sharp rectangles, clean borders, subtle depth
 * Typography: Weights 300/400/600 only
 */

export const COLORS = {
  // Monochrome Palette (90% of UI)
  black: '#000000',      // Primary text, headlines
  graphite: '#1A1A1A',   // Secondary headings (rarely used)
  stone: '#666666',      // Body text, secondary text
  mist: '#E5E5E5',       // Dividers, borders
  cloud: '#F8F8F8',      // Subtle backgrounds
  white: '#FFFFFF',      // Primary background

  // Yellow Accent (10% of UI - CTAs and key metrics ONLY)
  yellow: '#FCD34D',           // Primary yellow accent
  yellowHover: '#FBB614',      // Yellow hover state
  yellowSubtle: '#FCD34D10',   // 10% opacity yellow for backgrounds

  // Semantic Colors (System feedback only)
  success: '#10B981',    // Green for success states
  error: '#EF4444',      // Red for errors
  warning: '#F59E0B',    // Orange for warnings
  info: '#3B82F6',       // Blue for information
} as const

export const SPACING = {
  xs: '8px',
  sm: '16px',
  md: '24px',
  lg: '32px',
  xl: '48px',
  '2xl': '64px',
  '3xl': '96px',
  '4xl': '128px',
  '5xl': '192px',
} as const

export const TYPOGRAPHY = {
  // Font Sizes
  displayLg: '72px',     // Hero headlines
  displayMd: '64px',     // Section headlines
  displaySm: '48px',     // Sub-headlines
  headingLg: '32px',     // Major headings
  headingMd: '24px',     // Section headings
  headingSm: '20px',     // Component headings
  body: '16px',          // Body text
  small: '14px',         // Supporting text
  micro: '12px',         // Legal/meta text

  // Font Weights (ONLY these three)
  light: 300,
  regular: 400,
  semibold: 600,

  // Line Heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const

export const BORDERS = {
  // All borders are 1px - NO thick borders
  thin: '1px',
  medium: '2px',  // ONLY for accent underlines on key metrics

  // Border Radius - NONE! Sharp rectangles only
  none: '0px',
} as const

export const SHADOWS = {
  // Subtle shadows only
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
} as const

export const TRANSITIONS = {
  // Animation timing
  fast: '200ms',
  medium: '300ms',
  slow: '600ms',

  // Easing (ease-out ONLY)
  easeOut: 'ease-out',
} as const

/**
 * Design Rules - Enforce Consistency
 */
export const DESIGN_RULES = {
  // Yellow accent usage - "Rule of One"
  yellowUsage: {
    maxPerViewport: 1,  // ONE yellow CTA button per viewport
    allowedOn: [
      'Primary CTA buttons',
      'Key metric underlines (border-b-2)',
      'Active tab states',
      'Special highlight badges (10% opacity bg)',
    ],
    neverUse: [
      'Body text',
      'Multiple buttons',
      'Decorative elements',
      'Icons',
      'Gradients',
    ],
  },

  // No rounded corners
  corners: {
    allowed: false,
    reason: 'Sharp rectangles create professional, data-focused aesthetic',
  },

  // Font weights
  fontWeights: {
    allowed: [300, 400, 600],
    forbidden: [500, 700, 800, 900],
    reason: 'Limited weights create visual hierarchy without clutter',
  },

  // Glass morphism
  glassMorphism: {
    allowedOn: ['Navigation bars', 'Modal overlays'],
    notAllowedOn: ['Body content', 'Cards', 'Buttons'],
    implementation: 'bg-white/95 backdrop-blur-md',
  },
} as const

/**
 * Component Patterns - Reference Implementations
 */
export const COMPONENT_PATTERNS = {
  // Primary CTA Button
  primaryButton: {
    className: 'h-14 px-8 bg-[#FCD34D] text-[#000000] font-semibold hover:bg-[#FBB614] transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]',
    notes: 'Sharp corners (no rounded-full), yellow background, black text',
  },

  // Secondary Button
  secondaryButton: {
    className: 'h-14 px-8 border border-[#E5E5E5] text-[#666666] hover:bg-[#F8F8F8] hover:text-[#000000] transition-all duration-200',
    notes: 'Ghost style with subtle hover',
  },

  // Navigation
  navigation: {
    className: 'fixed top-0 w-full h-20 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] z-50',
    notes: 'Glass morphism with ultra-thin border',
  },

  // Card
  card: {
    className: 'bg-white border border-[#E5E5E5] p-8 shadow-sm hover:shadow-md transition-shadow duration-200',
    notes: 'Sharp corners, subtle shadow, hover lift effect',
  },

  // Tab (Active)
  tabActive: {
    className: 'h-12 px-6 bg-[#FCD34D] text-[#000000] font-semibold',
    notes: 'Yellow background, black text, sharp corners',
  },

  // Tab (Inactive)
  tabInactive: {
    className: 'h-12 px-6 bg-white text-[#666666] border border-[#E5E5E5] hover:bg-[#F8F8F8]',
    notes: 'Monochrome with border, subtle hover',
  },

  // Badge
  badge: {
    className: 'inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-wider',
    variants: {
      yellow: 'bg-[#FCD34D]/10 text-[#000000]',
      gray: 'bg-[#F8F8F8] text-[#666666]',
      success: 'bg-[#10B981] text-white',
    },
    notes: 'Sharp corners, uppercase text, tight tracking',
  },

  // Key Metric Accent (Yellow underline)
  metricAccent: {
    className: 'text-[#000000] border-b-2 border-[#FCD34D] inline-block',
    notes: 'Black text with 2px yellow underline - USE SPARINGLY (one per section)',
  },
} as const

/**
 * Migration Guide
 * Note: redesign/ experiments archived to components/archive/2025-10/redesign-experiments/
 */
export const MIGRATION_GUIDE = {
  from: '/app/redesign/ (archived 2025-10 - old design experiments)',
  to: '/app/page.tsx (current production homepage)',

  steps: [
    '1. Replace all purple (#7C3AED, #6D28D9) with yellow (#FCD34D, #FBB614)',
    '2. Remove ALL rounded corners (rounded-lg, rounded-xl, rounded-full, etc.)',
    '3. Update font weights to 300/400/600 only',
    '4. Use sharp borders: border border-[#E5E5E5]',
    '5. Import COLORS, COMPONENT_PATTERNS from lib/design/tokens',
    '6. Follow "Rule of One" for yellow usage',
  ],

  archivedLocations: {
    sophisticatedFlow: 'app/archive/2025-10/redesign-experiments/sophisticated-flow/',
    components: 'components/archive/2025-10/redesign-experiments/redesign/',
  },
}

/**
 * Quality Checklist - Before Any Component is Complete
 */
export const QUALITY_CHECKLIST = [
  'Uses ONLY colors from COLORS constant (no hardcoded colors)',
  'NO rounded corners anywhere (sharp rectangles only)',
  'Font weights are 300, 400, or 600 ONLY',
  'Yellow accent used on max ONE element per viewport',
  'All borders are 1px (except metric underlines which are 2px)',
  'Shadows are subtle (sm or md only)',
  'Transitions are 200-600ms with ease-out',
  'Typography follows scale exactly',
  'Glass morphism ONLY on navigation',
  'Monospace font for all numbers',
] as const

export type ColorKey = keyof typeof COLORS
export type SpacingKey = keyof typeof SPACING
export type ComponentPatternKey = keyof typeof COMPONENT_PATTERNS
