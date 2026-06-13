---
name: Verdant Solarpunk
colors:
  surface: '#f7faf2'
  surface-dim: '#d8dbd3'
  surface-bright: '#f7faf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f5ed'
  surface-container: '#ecefe7'
  surface-container-high: '#e6e9e1'
  surface-container-highest: '#e0e4dc'
  on-surface: '#191d18'
  on-surface-variant: '#424940'
  inverse-surface: '#2d312c'
  inverse-on-surface: '#eff2ea'
  outline: '#727970'
  outline-variant: '#c2c9be'
  surface-tint: '#3f6742'
  primary: '#264e2b'
  on-primary: '#ffffff'
  primary-container: '#3e6641'
  on-primary-container: '#b5e2b3'
  inverse-primary: '#a5d2a4'
  secondary: '#745c00'
  on-secondary: '#ffffff'
  secondary-container: '#fcd03d'
  on-secondary-container: '#705900'
  tertiary: '#314b36'
  on-tertiary: '#ffffff'
  tertiary-container: '#48634d'
  on-tertiary-container: '#bfdec1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c0eebf'
  primary-fixed-dim: '#a5d2a4'
  on-primary-fixed: '#002107'
  on-primary-fixed-variant: '#284f2c'
  secondary-fixed: '#ffe089'
  secondary-fixed-dim: '#edc22e'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#cceace'
  tertiary-fixed-dim: '#b0ceb2'
  on-tertiary-fixed: '#07200f'
  on-tertiary-fixed-variant: '#334d38'
  background: '#f7faf2'
  on-background: '#191d18'
  surface-variant: '#e0e4dc'
typography:
  headline-xl:
    fontFamily: Bricolage Grotesque
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Bricolage Grotesque
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 42px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Bricolage Grotesque
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Bricolage Grotesque
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 64px
---

## Brand & Style
This design system embodies a "Solarpunk" aesthetic—a vision of the future where technology and nature coexist in harmonious balance. It targets environmentally conscious tech platforms, sustainable lifestyle brands, and community-driven initiatives. 

The design style is **Tactile Minimalism**. It utilizes clean, open layouts and high-quality typography but grounds them with organic textures and soft, physical depth. The goal is to evoke a sense of optimism, vitality, and groundedness. Interfaces should feel "grown" rather than "manufactured," using subtle gradients and layered depth to suggest living ecosystems.

## Colors
The palette is rooted in organic vitality. 

*   **Primary (Deep Olive Green):** A more vibrant, lush olive (#3E6641) used for core interactions and primary brand moments. It represents structural growth.
*   **Secondary (Sunflower Yellow):** A bright, warm accent (#FFD23F) used sparingly for high-visibility calls to action and "sunlight" highlights.
*   **Tertiary (Sage Leaf):** A muted, calming green (#8BA88E) for secondary UI elements and softer visual interest.
*   **Neutral (Sage Cream):** The base background (#F2F5ED) is a warm, light cream infused with a very subtle hint of sage to keep the entire interface within a cohesive botanical spectrum.

Use the primary green for text on neutral backgrounds to maintain a soft, high-contrast legibility that avoids the harshness of pure black.

## Typography
The typography balances character with clarity. **Bricolage Grotesque** provides an expressive, quirky personality for headlines, mimicking the irregular beauty of nature. **Be Vietnam Pro** serves as the utilitarian workhorse for body text and labels, offering high legibility and a friendly, contemporary tone.

Headlines should use tight letter-spacing to create a strong visual impact. Body copy requires generous line-height to ensure the interface feels airy and unhurried.

## Layout & Spacing
The layout follows a **Fluid Grid** philosophy with soft boundaries. We utilize an 8px base unit to maintain mathematical rhythm.

*   **Desktop:** 12-column grid with 24px gutters and 64px side margins. Large containers should have significant internal padding (48px+) to prevent "cramping."
*   **Mobile:** 4-column grid with 16px side margins. 

Layouts should favor asymmetrical balance over rigid symmetry, mirroring natural landscapes. Use large "xl" spacing between distinct content sections to allow the design to breathe.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layering** and **Soft Ambient Shadows**. 

Avoid harsh black shadows. Instead, use shadows tinted with the primary olive color at very low opacities (e.g., `rgba(62, 102, 65, 0.08)`). Surfaces should appear to sit just above the background, like leaves on a forest floor. 

Higher elevation levels can incorporate a very subtle backdrop blur (2-4px) to simulate transparency, but the primary indicator of depth is the transition from the neutral background to slightly lighter or darker green-tinted containers.

## Shapes
The shape language is organic and approachable. Sharp corners are avoided entirely as they feel too "industrial." 

All standard UI elements (buttons, inputs, cards) use a `rounded-md` (0.5rem) base. Large containers or "featured" cards use `rounded-xl` (1.5rem) to emphasize their softness. For purely decorative elements or specialized chips, use pill-shapes to break up the rhythm of the grid.

## Components
*   **Buttons:** Primary buttons use the vibrant Olive Green with white or cream text. Secondary buttons use a ghost style with a 1.5px Olive border. The Sunflower Yellow is reserved for "Action" buttons (e.g., "Get Started," "Donate") to create a focal point.
*   **Cards:** Cards should have a subtle 1px border in the Sage Leaf color or a very soft shadow. Avoid heavy fill colors for cards; let the neutral background breathe.
*   **Input Fields:** Use a solid "Sage Cream" fill that is slightly darker than the main background, with a 1px Sage Leaf border that transitions to Olive Green on focus.
*   **Chips/Badges:** Use pill-shaped containers. For success/positive states, use Sage Leaf backgrounds; for warnings, use Sunflower Yellow.
*   **Progress Indicators:** Use organic, slightly thicker stroke widths for progress bars, using the Sunflower Yellow to represent "energy" or "completion."
*   **Lists:** Separate list items with generous vertical padding and thin, low-opacity Sage Leaf dividers.