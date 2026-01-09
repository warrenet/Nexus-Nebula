# Nexus Nebula: Design Guidelines

## Brand Identity

**Purpose**: A whimsical yet rigorous Bayesian task orchestrator that visualizes complex AI reasoning chains with scientific precision and playful transparency.

**Aesthetic Direction**: **Liquid Glass 2.0** - A dark, glassy, speculative interface inspired by liquid surfaces and holographic displays. Think: dark mode frosted glass with subtle iridescent mesh gradients, specular highlights, and fluid animations. The interface should feel like peering into a crystalline computational mind.

**Memorable Element**: Animated SVG mesh gradients that pulse and shift during swarm execution, visualizing the Bayesian inference happening beneath the surface.

**Tone**: Sophisticated sci-fi meets playful experimentation - serious computational power presented with whimsical transparency.

---

## Navigation Architecture

**Platform**: Mobile-First Progressive Web App (PWA) with responsive desktop layout.

### Desktop Layout
- **Side-by-Side View**: Left panel for Mission/Input, Right panel for Trace Viewer/Results
- No traditional navigation - persistent dual-pane layout

### Mobile Layout
- **Bottom-Sheet Tab Navigation** (3 tabs):
  1. **Mission** - Input and control center
  2. **Focus** - Active tasks and swarm status
  3. **Trace** - Visual reasoning chain explorer

---

## Screen-by-Screen Specifications

### Desktop: Dual-Pane Interface
**Layout**:
- Header: Transparent with glass morphism (backdrop-blur-2xl), 1px specular top highlight
  - Left: "Nexus Nebula" wordmark with animated gradient
  - Right: Budget indicator, settings icon
- Main Content: 50/50 split panes with 1px frosted divider
  - Left Pane: Mission input (textarea with glass background)
  - Right Pane: Trace visualization canvas
- No bottom navigation on desktop

**Components**:
- Large textarea with frosted glass background, iridescent border on focus
- "Execute Mission" button (Ctrl+Enter) - pill-shaped, animated gradient fill
- Real-time budget meter (arc/gauge visual)
- Node-based trace graph with animated connections

### Mobile: Tab 1 - Mission
**Layout**:
- Header: Transparent, floating title "Mission Control"
- Main Content: Scrollable form
  - Large textarea for mission input
  - Budget indicator (compact)
  - Execute button (fixed at bottom, above tabs)
- Bottom Tab Bar: Frosted glass with active tab indicator (gradient underline)

**Safe Area**: Top inset = headerHeight + 24px, Bottom inset = tabBarHeight + 24px

### Mobile: Tab 2 - Focus
**Layout**:
- Header: Transparent, "Swarm Status" title
- Main Content: Scrollable list of active agents
  - Each agent card shows: model name, iteration count, confidence score
  - Animated shimmer during execution
- Empty State: "Awaiting Mission" with animated mesh gradient orb

**Components**:
- Agent cards with frosted backgrounds, animated borders during active inference
- Progress indicators using radial gradients

### Mobile: Tab 3 - Trace
**Layout**:
- Header: Transparent, "Reasoning Chain" title, share icon (right)
- Main Content: Scrollable timeline view
  - Vertical timeline with branching logic nodes
  - Tap nodes to expand details
  - Red-team flags displayed with warning badges
- Empty State: "No Trace Available" with glass prism illustration

**Components**:
- Timeline connector lines with gradient strokes
- Expandable logic nodes (frosted cards)
- Syntax-highlighted JSON viewer for raw trace data

---

## Color Palette

**Base Colors**:
- Background: #0a0a0f (near-black with blue tint)
- Surface: rgba(20, 20, 35, 0.6) with backdrop-blur
- Surface Elevated: rgba(35, 35, 55, 0.7)

**Accent Colors**:
- Primary Gradient: #667eea → #764ba2 (purple-blue)
- Secondary Gradient: #f093fb → #f5576c (pink-coral)
- Success: #4ade80
- Warning: #fbbf24
- Error/Red Team Flag: #f87171

**Text**:
- Primary: #e5e7eb (off-white)
- Secondary: #9ca3af (cool gray)
- Muted: #6b7280

**Specular Highlights**: rgba(255, 255, 255, 0.1) for 1px top borders

---

## Typography

**Primary Font**: Inter (system fallback: -apple-system, SF Pro)
**Accent Font**: JetBrains Mono (for code/trace data)

**Type Scale**:
- Title: 28px/32px, Bold
- Heading: 20px/24px, Semibold
- Body: 16px/24px, Regular
- Caption: 14px/20px, Regular
- Code: 14px/20px, JetBrains Mono

---

## Visual Design

**Glass Morphism Specifications**:
- Backdrop filter: blur(24px) saturate(180%)
- Background: rgba(base, 0.6)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border radius: 12px for cards, 24px for buttons

**Touch Feedback**:
- Buttons: Scale to 0.97 on press, gradient shift
- Cards: Subtle glow on press (0 0 20px rgba(primary, 0.3))
- No drop shadows - use specular highlights and glows instead

**Animations**:
- Mesh gradients: Continuous subtle movement using CSS keyframes or Framer Motion
- Node connections: Animated dashed strokes during swarm execution
- All transitions: 200ms cubic-bezier(0.4, 0, 0.2, 1)

---

## Assets to Generate

1. **app-icon.png** - Holographic prism with gradient mesh interior
   - WHERE USED: PWA manifest, device home screen

2. **splash-icon.png** - Simplified prism logo on dark background
   - WHERE USED: PWA splash screen

3. **empty-mission.png** - Floating glass orb with mesh gradient core
   - WHERE USED: Mission tab when no input entered

4. **empty-trace.png** - Wireframe prism with dotted connection lines
   - WHERE USED: Trace tab when no execution has occurred

5. **swarm-active.gif** - Animated particle swarm forming constellation
   - WHERE USED: Focus tab during active execution

6. **mesh-gradient-01.svg** - Animated purple-blue mesh background
   - WHERE USED: Header background, hero sections

All assets should use dark backgrounds (#0a0a0f) with iridescent gradients (#667eea, #764ba2, #f093fb) and maintain the liquid glass aesthetic.