---
name: Terracotta & Ivory Cartographic Instrument
colors:
  surface: '#fafaf3'
  surface-dim: '#dadad4'
  surface-bright: '#fafaf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4ed'
  surface-container: '#eeeee8'
  surface-container-high: '#e8e9e2'
  surface-container-highest: '#e3e3dd'
  on-surface: '#1a1c18'
  on-surface-variant: '#57423d'
  inverse-surface: '#2f312d'
  inverse-on-surface: '#f1f1eb'
  outline: '#8a726c'
  outline-variant: '#ddc0b9'
  surface-tint: '#a13f25'
  primary: '#9e3c23'
  on-primary: '#ffffff'
  primary-container: '#be5438'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a2'
  secondary: '#436653'
  on-secondary: '#ffffff'
  secondary-container: '#c4ecd4'
  on-secondary-container: '#486c59'
  tertiary: '#874e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#a4661d'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#822810'
  secondary-fixed: '#c4ecd4'
  secondary-fixed-dim: '#a9cfb9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#2b4e3d'
  tertiary-fixed: '#ffdcbe'
  tertiary-fixed-dim: '#ffb870'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#693c00'
  background: '#fafaf3'
  on-background: '#1a1c18'
  surface-variant: '#e3e3dd'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  headline-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.02em
  mono-data:
    fontFamily: Space Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-compact: 0.5rem
  margin: 1.5rem
  margin-panel: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style
This design system defines an authoritative, editorial business intelligence and geographic prospecting instrument. Drawing inspiration from classic cartographic surveys, technical field notebooks, and rigorous archival tools, the aesthetic eschews superficial SaaS trends—such as decorative glassmorphism, heavy saturated drop shadows, or luminescent accents—in favor of structural discipline, high data density, and quiet tactile warmth.

The personality balances archival permanence with modern operational efficiency. The user experience is measured, calm, and trustworthy, presenting dense geographic and firmographic intelligence without cognitive clutter. The style utilizes precise 1px hairline framework lines, warm paper-toned surfaces, and restrained terracotta markers to guide analysis with clinical clarity.

## Colors
The color architecture references fine archival paper, stone, ink, and drafting pigments:

- **Canvas & Backgrounds:** The base canvas operates on warm ivory (`#F7F5F0`), establishing an organic, non-glare foundation. Elevated analytical panels, tables, and inspection panes rest on crisp white (`#FFFFFF`) or subtle warm stone (`#FAFAF8`).
- **Typography & Structure:** High-contrast text uses graphite ink (`#292B27`). Supporting secondary metadata utilizes muted slate-graphite (`#4A4D46`), while structural cues, inactive icons, and helper descriptions use muted grey (`#73776E`). Structural boundaries are rendered in crisp 1px borders using `#E2DFD8`.
- **Primary Accent (Terracotta):** `#C4583C` is reserved strictly for high-leverage user actions, active navigation states, primary map vector pins, and verified lead selections. It should never be used as large surface fills.
- **Secondary & Functional Accents:** Deep forest sage (`#3D604E`) serves as a positive indicator for high-fit scores, verified business matches, and operational confirmations. Warm amber (`#B5742A`) denotes pending queries, data enrichments in progress, or threshold warnings.

## Typography
Typography is set exclusively in Inter for interface controls and structural typography, supplemented by Space Mono for raw coordinate data, geospatial bounding boxes, and OpenStreetMap node IDs. 

The typographic hierarchy relies on weight and tracking rather than excessive size variations. Section dividers, table column headers, and provenance indicators leverage `label-caps` in uppercase with deliberate tracking (`0.06em`) to echo technical documentation and field maps. Numerical tabular data must use proportional lining figures with tabular numerals enabled (`font-feature-settings: "tnum" 1`) to preserve tabular vertical alignment across prospect grids.

## Layout & Spacing
The layout architecture is tailored for desktop workstations (1440×900 baseline) requiring split-screen research modes (geospatial canvas adjacent to dense tabular/detail views).

- **Left Navigation Rail:** A fixed 220px vertical column containing search provenance, core prospecting domains (Discover, Leads, Outreach), and spatial filtering presets.
- **Split Workspace Pane:** The main canvas is divided horizontally or vertically via a rigid 1px divider (`#E2DFD8`). The interactive map panel occupies a flexible 50–60% view, while the data grid or prospect dossier occupies the remaining space.
- **Spacing Scale:** Built on a rigorous 8pt spatial grid with 4pt half-steps (`space-xs` = 4px, `space-sm` = 8px, `space-md` = 12px, `space-lg` = 16px, `space-xl` = 24px, `space-2xl` = 32px). Interior table cells and inspection tools utilize compact padding to maximize visible information density per viewport.

## Elevation & Depth
Depth is created through planar layering and structural hairlines rather than diffused shadows:

- **Borders & Dividers:** All structural separation is achieved via `1px solid #E2DFD8`. Stacked surfaces use explicit borders rather than ambient blur.
- **Ground Floor:** `#F7F5F0` represents the primary canvas underpinning sidebars, application margins, and secondary headers.
- **Surface Elevation 1 (Cards, Tables, Panels):** Pure `#FFFFFF` resting against `#F7F5F0`, framed by a 1px border. No drop shadow is applied in its resting state.
- **Surface Elevation 2 (Floating Map Controls, Menus, Dossier Drawers):** `#FFFFFF` bordered by `#E2DFD8`, paired with a low-intensity, high-precision shadow: `0 2px 6px -1px rgba(41, 43, 39, 0.06), 0 1px 3px -1px rgba(41, 43, 39, 0.04)`.
- **Hover & Focus Depths:** Interactive rows and selectable cards shift background color to `#FAFAF8` with an accent stroke rather than gaining spatial elevation.

## Shapes
Shapes are disciplined, utilitarian, and restrained:

- Buttons, form controls, filters, and standard input boxes use a 4px to 6px corner radius (`rounded-md`), preventing visual harshness while maintaining a precise, instrument-grade appearance.
- Outer panel enclosures, cards, and modal sheets adopt an 8px radius (`rounded-lg`).
- Data provenance badges, node attributes, and coordinate pills maintain a crisp 4px radius (`rounded-sm` / `rounded-md`) instead of full capsules, avoiding casual or consumer-like rounding.

## Components

### Buttons
- **Primary:** Filled `#C4583C` with crisp white `#FFFFFF` text. Minimal hover transition: background deepens to `#B04D33`. 4px radius, 32px standard height, text style `headline-sm`.
- **Secondary / Technical:** Crisp white `#FFFFFF` surface with a 1px `#E2DFD8` border and `#292B27` text. Hover shifts background to `#FAFAF8` and border to `#C4583C`.
- **Ghost:** Transparent background with `#4A4D46` text, active state indicated by an underline or `#F7F5F0` fill.

### Data Tables & Tabular Views
- **Header:** Sticky table header with `#FAFAF8` background, 1px bottom border `#E2DFD8`, text in `label-caps` (`#73776E`).
- **Cells:** 36px fixed row height for compact review, cell border 1px bottom `#E2DFD8`. Numeric data aligns right using `mono-data`.
- **Selection:** Selected rows display a subtle tint of `#F7F5F0` paired with a 2px vertical terracotta `#C4583C` left accent border.

### Provenance Badges & Attribute Chips
- **Provenance Indicator (OSM/Overpass):** Small-footprint badge with `#FAFAF8` background, 1px border `#E2DFD8`, text in `label-sm` (`#4A4D46`), paired with an open-source technical attribution glyph.
- **Fit & Intent Chips:** High score (`#3D604E` text over `#3D604E12` tint); Moderate score (`#B5742A` text over `#B5742A12` tint); Inactive (`#73776E` text over `#E2DFD840` tint).

### Form Controls & Inputs
- **Search & Filter Bars:** Rectangular inputs with `#FFFFFF` background, 1px `#E2DFD8` outline, 6px radius, placeholder in `#73776E`. Focused inputs drop default browser outlines in favor of a crisp 1px `#C4583C` border and zero outer glow.
- **Checkboxes & Radios:** 14px square/circle with `#E2DFD8` 1px border. Checked state displays `#C4583C` fill with a sharp white checkmark or center pip.

### Explainable Scoring Meters
- Linear multi-segmented bars or fractional meters (e.g., `88/100`) rendered with a 4px tall track (`#E2DFD8`) and filled dynamically with sage `#3D604E` or terracotta `#C4583C`. Paired with an expandable inspection popover detailing component criteria weights.

### Dossier & Split View Panes
- Detailed record inspection panel slides in from the right edge or docks alongside the map. Headers use `headline-lg` (`#292B27`), followed by a systematic key-value metadata list delineated by fine 1px `#E2DFD8` interior borders.