// Mobile-first design tokens optimized for 320px+ viewports
export const MOBILE_DESIGN_TOKENS = {
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.25rem'     // 20px - Max spacing for mobile vs current 24px (p-6)
  },
  typography: {
    micro: 'text-[10px]',   // For labels/metadata
    tiny: 'text-[11px]',    // For supporting text
    small: 'text-xs',       // For body text
    body: 'text-sm',        // For primary content
    lead: 'text-base'       // For headings
  },
  touchTargets: {
    minimum: '44px',        // iOS/Android standard
    comfortable: '48px',    // Preferred size
    large: '56px'          // For primary actions
  },
  breakpoints: {
    mobile: '320px',          // Primary target (iPhone 5/SE)
    mobileLg: '480px',        // Large phones
    tablet: '768px',          // Tablets
    desktop: '1024px'         // Desktop enhancement
  },
  viewport: {
    // Target: iPhone SE (375px × 667px) - smallest common viewport
    minWidth: '320px',
    targetWidth: '375px',
    availableHeight: '563px', // After browser chrome and navigation
    contentAllocation: {
      scoreWidget: '80px',
      primaryInsight: '80px',
      secondaryInsights: '120px', // 2×60px
      actionButtons: '56px',
      buffer: '80px'
    }
  }
} as const

// Shared spacing constant for consistent layout across mobile components
export const MOBILE_SPACING = {
  grid: '0.5rem',      // 8px - minimal gap between elements
  container: '1rem',   // 16px - standard container padding
  component: '0.75rem', // 12px - padding within components
  section: '1.25rem'   // 20px - spacing between major sections
} as const

// Helper function to get responsive spacing
export const getResponsiveSpacing = (size: keyof typeof MOBILE_DESIGN_TOKENS.spacing) => {
  return MOBILE_DESIGN_TOKENS.spacing[size]
}

// Helper function to get touch target size
export const getTouchTarget = (size: keyof typeof MOBILE_DESIGN_TOKENS.touchTargets) => {
  return MOBILE_DESIGN_TOKENS.touchTargets[size]
}

// Mobile-first CSS class generators using actual spacing values
export const MOBILE_CLASSES = {
  // Using actual rem values instead of Tailwind classes to ensure tokens apply
  container: `p-[${MOBILE_DESIGN_TOKENS.spacing.md}] space-y-[${MOBILE_DESIGN_TOKENS.spacing.md}] max-w-full`,
  card: `p-[${MOBILE_DESIGN_TOKENS.spacing.md}] mb-[${MOBILE_DESIGN_TOKENS.spacing.md}] rounded-lg`,
  touchTarget: `min-h-[${MOBILE_DESIGN_TOKENS.touchTargets.minimum}] flex items-center justify-center`,
  touchTargetComfortable: `min-h-[${MOBILE_DESIGN_TOKENS.touchTargets.comfortable}] flex items-center justify-center`,
  touchTargetLarge: `min-h-[${MOBILE_DESIGN_TOKENS.touchTargets.large}] flex items-center justify-center`,
  spacing: {
    xs: `gap-[${MOBILE_DESIGN_TOKENS.spacing.xs}]`,
    sm: `gap-[${MOBILE_DESIGN_TOKENS.spacing.sm}]`,
    md: `gap-[${MOBILE_DESIGN_TOKENS.spacing.md}]`,
    lg: `gap-[${MOBILE_DESIGN_TOKENS.spacing.lg}]`,
    xl: `gap-[${MOBILE_DESIGN_TOKENS.spacing.xl}]`
  },
  grid: {
    mobile: 'grid-cols-1', // Always single column on mobile
    tablet: 'md:grid-cols-2',
    desktop: 'lg:grid-cols-3'
  }
} as const