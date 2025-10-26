// Design tokens for BlockX hero component
export const styleTokens = {
  colors: {
    // Background gradients (as specified)
    bgGradientStart: '#071428',
    bgGradientEnd: '#0b2236',
    
    // Accent colors (as specified)
    accent1: '#00c2d8', // neon teal
    accent2: '#d04bf0', // neon magenta
    
    // Surface colors (as specified)
    surface: 'rgba(255,255,255,0.04)',
    
    // Text colors (as specified)
    textMain: '#FFFFFF',
    textMuted: 'rgba(255,255,255,0.72)',
    
    // Glass panel (enhanced for better readability)
    glassBg: 'linear-gradient(135deg, rgba(6,10,18,0.75) 0%, rgba(11,34,54,0.65) 100%)',
    glassBorder: 'rgba(255,255,255,0.08)',
    
    // Additional colors for better contrast
    glassOverlay: 'rgba(0,0,0,0.2)',
    focusRing: '#00c2d8',
  },
  
  typography: {
    // Font families (modern geometric sans-serif)
    fontPrimary: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSecondary: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif',
    
    // Font weights
    weightLight: 400,
    weightMedium: 500,
    weightSemibold: 600,
    weightBold: 700,
    
    // Font sizes (as specified: desktop 64px, md 48px, sm 36px)
    h1: {
      desktop: '64px',
      tablet: '48px', 
      mobile: '36px',
      lineHeight: '1.0',
      fontWeight: 700, // bold geometric sans
    },
    h2: {
      desktop: '20px', // 18-20px as specified
      tablet: '18px',
      mobile: '16px',
      lineHeight: '1.4',
      fontWeight: 500, // weight 500 as specified
    },
    body: {
      desktop: '18px',
      tablet: '16px',
      mobile: '14px',
      lineHeight: '1.6',
      fontWeight: 400,
    },
    cta: {
      desktop: '16px',
      tablet: '15px',
      mobile: '14px',
      lineHeight: '1.2',
      fontWeight: 600,
    },
  },
  
  spacing: {
    // Container
    containerMaxWidth: '1200px',
    heroMinHeight: '70vh',
    
    // Padding
    sectionPadding: {
      desktop: '120px 0',
      tablet: '80px 0',
      mobile: '60px 0',
    },
    
    // Element spacing
    elementGap: {
      large: '48px',
      medium: '32px',
      small: '16px',
    },
  },
  
  effects: {
    // Glassmorphism (as specified)
    glassBlur: '8px',
    glassRadius: '16px',
    
    // Animations (as specified: 150-200ms ease)
    transitionDuration: '200ms',
    transitionEasing: 'ease-in-out',
    hoverLift: '3px', // translateY(-3px) as specified
    
    // Shadows (enhanced for better depth)
    shadowSoft: '0 4px 20px rgba(0, 0, 0, 0.15)',
    shadowMedium: '0 8px 32px rgba(0, 0, 0, 0.25)',
    shadowStrong: '0 12px 48px rgba(0, 0, 0, 0.35)',
    
    // Focus states
    focusRingWidth: '2px',
    focusRingOffset: '2px',
  },
  
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1280px',
  },
};

export default styleTokens;
