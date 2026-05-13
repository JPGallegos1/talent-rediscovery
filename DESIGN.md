---
name: Executive Talent Intelligence
colors:
  surface: '#fbf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fbf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#eae8e2'
  surface-container-highest: '#e4e2dc'
  on-surface: '#1b1c18'
  on-surface-variant: '#424848'
  inverse-surface: '#30312d'
  inverse-on-surface: '#f3f1eb'
  outline: '#737878'
  outline-variant: '#c2c7c7'
  surface-tint: '#526162'
  primary: '#293738'
  on-primary: '#ffffff'
  primary-container: '#3f4e4f'
  on-primary-container: '#aebfc0'
  inverse-primary: '#b9caca'
  secondary: '#595f60'
  on-secondary: '#ffffff'
  secondary-container: '#dee4e3'
  on-secondary-container: '#5f6566'
  tertiary: '#433128'
  on-tertiary: '#ffffff'
  tertiary-container: '#5b473d'
  on-tertiary-container: '#d1b6a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e6e6'
  primary-fixed-dim: '#b9caca'
  on-primary-fixed: '#0f1e1f'
  on-primary-fixed-variant: '#3a494a'
  secondary-fixed: '#dee4e3'
  secondary-fixed-dim: '#c2c8c7'
  on-secondary-fixed: '#171d1d'
  on-secondary-fixed-variant: '#424848'
  tertiary-fixed: '#faddcf'
  tertiary-fixed-dim: '#ddc1b4'
  on-tertiary-fixed: '#271810'
  on-tertiary-fixed-variant: '#564339'
  background: '#fbf9f3'
  on-background: '#1b1c18'
  surface-variant: '#e4e2dc'
typography:
  headline-xl:
    fontFamily: Noto Serif
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Serif
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Noto Serif
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Noto Serif
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
  headline-lg-mobile:
    fontFamily: Noto Serif
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 32px
  gutter: 24px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The brand personality is authoritative, discerning, and human-centric. This design system moves away from the sterile, hyper-technical "SaaS dashboard" aesthetic in favor of a **Corporate Modern** style with **Editorial** influences. It prioritizes clarity and high-signal data visualization over decorative elements.

The emotional goal is to instill confidence in recruiters and hiring managers. It treats candidate data with the gravitas of a legal or financial document while maintaining the warmth of a consultative partnership. The visual narrative focuses on "Discovery"—unearthing hidden potential through a sophisticated, layered interface that feels more like a digital workspace for professionals and less like an automated tool.

## Colors
The palette is grounded in an "Earth and Slate" theme. 
- **Primary (#3F4E4F):** A deep slate used for navigation, primary actions, and key headings. It provides the "anchor" for the UI.
- **Secondary (#727878):** A muted gray-green used for secondary information and supporting icons.
- **Tertiary (#5B473D):** A warm earthy brown used sparingly for accents, indicating depth or specific "human" touchpoints in the recruiting process.
- **Neutral (#F1EFE9):** A warm, paper-like off-white used as the main background to reduce eye strain and provide a sophisticated, non-digital feel.

**Semantic Indicators:**
- **Evidence (Trust):** Use a deep forest green for positive indicators.
- **Risks (Caution):** Use a desaturated oxide red for potential flags. These should be distinct but not visually jarring, maintaining the professional composure of the interface.

## Typography
This system employs a high-contrast typographic pairing to balance tradition and modernity.
- **Noto Serif** is used for all major headlines and candidate names. It brings a sense of literary authority and "rediscovery" to the profile.
- **Plus Jakarta Sans** provides a clean, highly legible counterpoint for data entry, body copy, and status labels.

Use **Tight Leading** for headlines to keep the editorial feel, and **Generous Leading** (1.5x) for body text to ensure readability of long-form candidate assessments or resumes. Labels should often use slight letter-spacing and uppercase styling to differentiate them from interactive data.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain the "cockpit" feel—ensuring that key metrics and filters are always in predictable locations.

- **Desktop (1440px+):** 12-column grid with 24px gutters. Use a 280px fixed left sidebar for navigation and a 320px contextual right panel for "Candidate Deep Dives."
- **Tablet:** 8-column grid with 16px gutters. Sidebars collapse into drawers.
- **Mobile:** 4-column grid with 16px margins. Information is stacked vertically, prioritizing "Evidence vs Risk" summaries at the top.

Spacing should be "airy." Avoid cramming information. Use whitespace as a functional tool to group related data points, specifically separating "Personal History" from "Skill Analysis."

## Elevation & Depth
Elevation is handled through **Tonal Layers** and **Soft Ambient Shadows**. Instead of heavy shadows, depth is communicated by subtle shifts in background color.

- **Level 0 (Base):** The #F1EFE9 neutral background.
- **Level 1 (Cards):** White (#FFFFFF) surfaces with a very soft, diffused shadow (0px 4px 20px rgba(63, 78, 79, 0.05)).
- **Level 2 (Modals/Popovers):** White surfaces with a more pronounced shadow and a subtle 1px border using the Secondary color at 10% opacity.

The goal is to make elements feel like they are resting gently on a physical desk rather than floating in digital space.

## Shapes
The shape language is **Soft**. A 4px (0.25rem) base radius is applied to most UI components to maintain a professional, structured appearance while avoiding the harshness of sharp corners.

- **Standard Buttons & Inputs:** 4px radius.
- **Information Cards:** 8px (rounded-lg) to provide a distinct container feel.
- **Avatars & Status Tags:** 12px (rounded-xl) to provide a softer, more human element amidst the data.
- **Search Bars:** Should remain consistent with the standard 4px radius to feel like a structural part of the header.

## Components
- **Buttons:** Primary buttons use the Slate (#3F4E4F) background with white text. Secondary buttons use an outline of Slate with a transparent background. Tertiary buttons use the Earth (#5B473D) color for specific "Human Actions" like "Schedule Interview."
- **Evidence Chips:** Small tags with a light green background and deep green text. They should include a "check" icon to reinforce trust.
- **Risk Indicators:** Styled similarly to chips but using the Oxide Red palette, often accompanied by a "warning" icon.
- **Input Fields:** Minimalist design with only a bottom border or a very light gray-green background. Focus states should be indicated by a weight increase of the bottom border in Primary Slate.
- **Candidate Cards:** These are the heart of the system. They should lead with the name in Noto Serif, followed by a clear horizontal split between "Key Strengths" (Evidence) and "Considerations" (Risks).
- **Navigation:** Vertical navigation in the sidebar using high-contrast icons and Plus Jakarta Sans labels. Active states should be indicated by a subtle Tertiary color vertical bar on the left.