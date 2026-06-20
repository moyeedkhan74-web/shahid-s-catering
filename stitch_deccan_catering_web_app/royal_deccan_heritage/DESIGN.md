---
name: Royal Deccan Heritage
colors:
  surface: '#181306'
  surface-dim: '#181306'
  surface-bright: '#3f3929'
  surface-container-lowest: '#120e03'
  surface-container-low: '#201b0d'
  surface-container: '#241f11'
  surface-container-high: '#2f291b'
  surface-container-highest: '#3a3425'
  on-surface: '#ede1cb'
  on-surface-variant: '#d3c5ae'
  inverse-surface: '#ede1cb'
  inverse-on-surface: '#363021'
  outline: '#9b8f7a'
  outline-variant: '#4f4634'
  surface-tint: '#f6be39'
  primary: '#f6be39'
  on-primary: '#402d00'
  primary-container: '#d4a017'
  on-primary-container: '#503a00'
  inverse-primary: '#795900'
  secondary: '#f0c040'
  on-secondary: '#3e2e00'
  secondary-container: '#b88d00'
  on-secondary-container: '#392a00'
  tertiary: '#ffb688'
  on-tertiary: '#502402'
  tertiary-container: '#dd996d'
  on-tertiary-container: '#60310d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdfa0'
  primary-fixed-dim: '#f6be39'
  on-primary-fixed: '#261a00'
  on-primary-fixed-variant: '#5c4300'
  secondary-fixed: '#ffdf97'
  secondary-fixed-dim: '#f0c040'
  on-secondary-fixed: '#251a00'
  on-secondary-fixed-variant: '#5a4400'
  tertiary-fixed: '#ffdbc7'
  tertiary-fixed-dim: '#ffb688'
  on-tertiary-fixed: '#311300'
  on-tertiary-fixed-variant: '#6b3a16'
  background: '#181306'
  on-background: '#ede1cb'
  surface-variant: '#3a3425'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  max-container: 600px
  edge-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style

The brand personality is rooted in the opulence of the Nizami era—sophisticated, regal, and deeply hospitable. It aims to evoke an emotional response of exclusive luxury and culinary mastery. The target audience includes high-net-worth individuals and corporate clients seeking premium catering services that honor tradition while maintaining modern standards.

This design system employs a **Heritage Luxury** style, a fusion of minimalism and tactile elegance. It leverages a dark, high-contrast palette to create a "night-mode" premium aesthetic. Visual weight is managed through the interplay of deep chocolate surfaces and hairline antique gold borders, eschewing heavy shadows for a more refined, architectural depth reminiscent of fine jewelry and silk.

## Colors

The palette is anchored in **Deepest Umber (#0A0200)** for the background to provide maximum contrast for the gold accents. **Antique Gold (#D4A017)** serves as the primary brand color, used for critical actions and brand markers, while **Light Gold (#F0C040)** is reserved for high-intensity highlights and hover states.

Content containers utilize **Rich Chocolate (#1A0800)** to subtly lift elements from the background. Typography is strictly divided between **Silk Cream (#FFF3DC)** for high-readability body text and **Bronze Tan (#A07840)** for secondary metadata or deactivated states, ensuring the hierarchy remains clear even in a low-light environment.

## Typography

The typography system relies on the contrast between the authoritative, serif elegance of **Playfair Display** and the functional clarity of **Inter**. 

Headlines utilize Playfair Display with generous line heights to mimic the spacing of high-end editorial magazines. For mobile displays, headline sizes are slightly reduced to ensure no awkward line breaks occur within the 600px container. 

Body text and navigational labels use Inter. To enhance the "luxury" feel, labels and small caps are given an increased letter-spacing of 0.05em, suggesting a meticulous attention to detail. All body text is rendered in Silk Cream to prevent the eye strain common with pure white text on black backgrounds.

## Layout & Spacing

This design system uses a **Fixed Grid** model centered within the viewport, optimized for a mobile-first, high-touch experience. The primary content container is capped at **600px**, ensuring optimal line lengths for reading and a focused, boutique-like browsing experience on larger screens.

The spacing rhythm is built on an 8px base unit. Side margins are set to 24px to provide a comfortable "breathing room" against the edge of mobile devices. Vertical rhythm is expansive; sections are separated by 64px gaps to maintain a sense of prestige and prevent the layout from feeling cluttered or "value-oriented."

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering** and **Linear Accents** rather than traditional shadows. 

1.  **Level 0 (Base):** Deepest Dark Brown (#0A0200).
2.  **Level 1 (Surfaces):** Rich Dark Chocolate (#1A0800) surfaces are used for cards and menus.
3.  **Definition:** Every elevated surface must be defined by a **1px Burnt Umber (#4A2000)** border. 
4.  **Interactive Highlight:** Focused or active elements receive a 1px border in Antique Gold (#D4A017).

Shadows, if used at all, should be extremely subtle "Ambient Glows"—low-opacity (10-15%) blurs using the Gold accent color, rather than black, to simulate light reflecting off a metallic surface.

## Shapes

The shape language is a deliberate mix of architectural rigidity and organic fluidity. 

- **Buttons & Interactive Tags:** Use a **Pill-shaped (rounded-full)** radius. This provides a modern, friendly touch-point that contrasts beautifully against the more formal serif typography.
- **Cards & Containers:** Use a **Soft (0.5rem)** radius. This maintains the "Regal" structure of the layout without being as aggressive as sharp corners.
- **Dividers:** Use 1px solid lines, often fading out at the edges using a linear gradient (Burnt Umber to Transparent) to create a sophisticated, ephemeral transition between content blocks.

## Components

### Buttons
Primary buttons are pill-shaped with a solid **Antique Gold** background and **Deepest Dark Brown** text for maximum legibility. Secondary buttons use a transparent background with an Antique Gold 1px border and Gold text.

### Cards
Cards are built using the **Rich Dark Chocolate** surface color. They feature a 1px Burnt Umber border. When a card is "Featured," the border color shifts to Antique Gold.

### Input Fields
Inputs are minimal: a bottom-border only (Burnt Umber), which transitions to Antique Gold upon focus. The label floats above the input in **Bronze Tan** using the `label-sm` typography style.

### Chips & Tags
Used for cuisine types or dietary markers, these are pill-shaped with a 1px Burnt Umber border and Bronze Tan text.

### Lists
Menu items are presented in a clean list with a subtle bottom divider. The item price is always rendered in **Light Gold** to draw the eye to the value proposition.

### Royal Divider
A signature component: a horizontal line that features a small 4px diamond or brand icon in the center, rendered in Antique Gold, used to separate major thematic sections.