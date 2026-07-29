---
name: Diplomatic Assurance
colors:
  surface: '#fff8f6'
  surface-dim: '#e1d8d6'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2f0'
  surface-container: '#f5ecea'
  surface-container-high: '#efe6e4'
  surface-container-highest: '#e9e1df'
  on-surface: '#1e1b1a'
  on-surface-variant: '#3f4940'
  inverse-surface: '#342f2e'
  inverse-on-surface: '#f8efed'
  outline: '#6f7a70'
  outline-variant: '#bfc9be'
  surface-tint: '#146c3c'
  primary: '#004824'
  on-primary: '#ffffff'
  primary-container: '#006233'
  on-primary-container: '#89dba0'
  inverse-primary: '#86d89d'
  secondary: '#bb0011'
  on-secondary: '#ffffff'
  secondary-container: '#e80e1c'
  on-secondary-container: '#fffbff'
  tertiary: '#6e232d'
  on-tertiary: '#ffffff'
  tertiary-container: '#8c3a43'
  on-tertiary-container: '#ffb7bb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a1f5b7'
  primary-fixed-dim: '#86d89d'
  on-primary-fixed: '#00210d'
  on-primary-fixed-variant: '#00522a'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000b'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40010e'
  on-tertiary-fixed-variant: '#7a2c36'
  background: '#fff8f6'
  on-background: '#1e1b1a'
  surface-variant: '#e9e1df'
  cedar-green: '#006233'
  lebanese-red: '#EE161F'
  status-blue: '#0055BB'
  status-amber: '#B45309'
  surface-gray: '#F5F5F4'
  border-muted: '#E7E5E4'
typography:
  headline-lg:
    fontFamily: notoSans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: notoSans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: notoSans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: notoSans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: notoSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: notoSans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
  arabic-display:
    fontFamily: notoSans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 44px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 48px
  touch-target: 44px
---

## Brand & Style

The design system is engineered for the **Embassy of Lebanon in Paris**, embodying a "Premium Public Service" aesthetic. It prioritizes institutional authority, reliability, and accessibility. The visual narrative is sober and reassuring, designed to facilitate administrative processes for citizens and diplomats alike.

The style is **Institutional Minimalism**: a clean, structured approach that uses heavy white space and high-contrast typography to ensure clarity. It avoids decorative trends in favor of functional elegance, drawing inspiration from modern governmental interfaces (Material and HIG) to provide a familiar, trustworthy environment. The design is mobile-first, ensuring that every interaction—from passport renewals to consular appointments—is seamless on any device.

## Colors

The palette is anchored by **Cedar Green**, the primary color of the Lebanese state, used for navigation headers, primary buttons, and institutional branding. **Lebanese Red** is used sparingly as an accent color for critical alerts or specific national symbols to maintain a professional, calm atmosphere.

The neutral palette relies on deep charcoal (`#292524`) for high-readiness text and warm grays for background layering. Sementic colors are strictly defined for status tracking:
- **Blue**: Planned/Information.
- **Green**: Validated/Success.
- **Red**: Rejected/Error.
- **Amber**: Action Required/Warning.

All color combinations must meet WCAG AA standards for contrast, ensuring legibility for all users.

## Typography

The typography system utilizes **Noto Sans** to provide a unified, highly legible experience across French, English, and Arabic. The choice of Noto Sans Arabic ensures that the distinctive script of the Lebanese administration is rendered with the same professional weight and clarity as the Latin characters.

Typography scales are generous to accommodate accessibility. Headings use a bold weight to establish clear information hierarchy. For the Arabic script, line-heights are increased (minimum 1.5x font size) to prevent clipping of diacritics and ensure maximum readability in dense administrative texts.

## Layout & Spacing

This design system employs a **Fluid Grid** model with a base unit of 8px (halved to 4px for micro-adjustments). 

- **Mobile**: A 4-column layout with 16px margins. 
- **Desktop**: A 12-column layout capped at a 1200px max-width, centered on the screen.

A "Safe-Touch" policy is enforced: all interactive elements (buttons, inputs, menu items) must have a minimum height or tap area of **44px** to ensure accessibility for elderly users or those using mobile devices in transit. Spacing between major content sections should be generous (32px - 64px) to reduce cognitive load.

## Elevation & Depth

To maintain an institutional and "flat" aesthetic, depth is primarily conveyed through **Tonal Layers** rather than heavy shadows. 

- **Level 0 (Background)**: The main page background in white or off-white.
- **Level 1 (Cards/Containers)**: Surfaces using a very subtle 1px border (`#E7E5E4`) or a light gray fill (`#F5F5F4`). 
- **Level 2 (Active States)**: A soft, ambient shadow (4px blur, 5% opacity) may be used for floating elements like navigation drawers or active modals to separate them from the primary content.

The goal is a "Paper-on-Desk" feel—crisp, layered, and organized.

## Shapes

The shape language is **Soft** (4px / 0.25rem). This subtle rounding moves away from the harshness of sharp corners—evoking a more modern and approachable service—while maintaining the structure and seriousness of a government body. Navigation tiles and primary containers should use `rounded-lg` (8px) to feel distinct and modern, while input fields and small buttons remain at the standard 4px.

## Components

### Navigation Tiles
Large, full-width cards on mobile used for primary routing. They feature a leading icon in Cedar Green and a trailing chevron. These must be minimum 72px in height to serve as clear, easy-to-tap targets.

### Buttons
- **Primary**: Solid Cedar Green with white text. High contrast, 44px minimum height.
- **Secondary**: Cedar Green border with transparent background.
- **Status Chips**: Small, pill-shaped indicators using the semantic color palette with a 10% opacity background of the same hue for "Validation" or "Rejection" states.

### Forms & Progress
Input fields must have clear, persistent labels (never just placeholders). Use a 2px Cedar Green bottom border or full border on focus. Progress indicators (steppers) are mandatory for multi-step consular forms to provide clear feedback on the user's journey.

### Alerts
Banners appearing at the top of the content area. Use Cedar Green for general announcements and Lebanese Red for urgent embassy closures or critical alerts.