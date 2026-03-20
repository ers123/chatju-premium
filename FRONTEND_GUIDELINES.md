# Frontend Development Guidelines for Somyung (소명)

## Overview
This document provides comprehensive guidelines for frontend development to ensure consistency, avoid conflicts, and maintain a premium, modern aesthetic throughout the application.

---

## Styling Approach

### Primary Method: Inline Styles
This project uses **inline styles** to avoid CSS framework conflicts discovered during development.

**DO:**
```tsx
<div style={{
  background: '#FFFFFF',
  padding: '24px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}}>
```

**DON'T:**
```tsx
// ❌ Tailwind CSS classes
<div className="bg-white p-6 rounded-lg shadow-md">

// ❌ External CSS files
import styles from './Component.module.css'

// ❌ CSS-in-JS libraries
const StyledDiv = styled.div`...`
```

### Before Any Frontend Work
1. Check existing component patterns in `/frontend/app/page.tsx`
2. Maintain consistency with established inline style approach
3. Use the same color constants and spacing values
4. Reference this guidelines document

---

## Design System

### Color Palette

**Main Landing Page:**
```tsx
const mainColors = {
  primary: '#2D5A27',      // Forest Green
  background: '#FAFAF8',   // Off-white
  card: '#FFFFFF',
  text: {
    heading: '#212529',
    body: '#343A40',
    muted: '#6C757D'
  },
  border: '#E9ECEF'
}
```

**Gitan Collaboration Page:**
```tsx
const gitanColors = {
  primary: '#1E3A5F',      // Deep Navy
  accent: '#C9A227',       // Gold
  dark: '#0F1419',         // Almost black
  light: '#FAFAF8',        // Off white
  muted: '#64748B'         // Slate
}
```

### Spacing System (8px Grid)
All spacing MUST use these values:
```tsx
const spacing = {
  xs: '8px',    // Icon padding, tight spacing
  sm: '16px',   // Between related elements
  md: '24px',   // Between sections within component
  lg: '32px',   // Between different components
  xl: '48px',   // Between major sections
  '2xl': '64px' // Between page sections
}
```

### Typography
```tsx
const typography = {
  display: { fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
  h1: { fontSize: '32px', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '24px', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '20px', fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: 1.5 },
  small: { fontSize: '14px', fontWeight: 400, lineHeight: 1.5 }
}
```

### Shadows
```tsx
const shadows = {
  subtle: '0 1px 3px rgba(0,0,0,0.08)',
  normal: '0 2px 8px rgba(0,0,0,0.08)',
  elevated: '0 4px 16px rgba(0,0,0,0.12)'
}
```

### Border Radius
```tsx
const radius = {
  sm: '4px',    // Buttons, small elements
  md: '8px',    // Cards, inputs
  lg: '12px',   // Modals, large cards
  full: '9999px' // Pills, avatars
}
```

---

## Premium Design Requirements

### What Makes UI Look Premium

1. **Restraint & Minimalism**
   - Clean white/off-white backgrounds
   - Generous whitespace between sections
   - Single accent color per page
   - No visual clutter

2. **Subtle Sophistication**
   - Light shadows only where needed
   - Strategic use of rounded corners (not everywhere)
   - Smooth 200ms transitions
   - Professional color choices

3. **Clear Visual Hierarchy**
   - Obvious distinction between headings, body, captions
   - Important elements (CTAs) stand out
   - Consistent alignment and spacing

### What to AVOID (AI-Generated Look)

| ❌ Avoid | ✅ Use Instead |
|----------|----------------|
| Purple-blue gradients | Solid, sophisticated colors |
| Emojis as icons | Minimal color bars or text labels |
| Vertical timeline with circles | Card-based layouts |
| Rainbow color schemes | Single accent color |
| Heavy drop shadows | Subtle, light shadows |
| Excessive border-radius (20px+) | Strategic 6-12px radius |
| Multiple fonts | Max 2 font families |
| Busy patterns/textures | Clean, simple backgrounds |

---

## Component Patterns

### Buttons
```tsx
// Primary Button
<button style={{
  background: '#2D5A27',
  color: '#FFFFFF',
  padding: '12px 24px',
  borderRadius: '6px',
  border: 'none',
  fontSize: '16px',
  fontWeight: 500,
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  cursor: 'pointer',
  transition: 'all 200ms ease-in-out'
}}>
  Primary Action
</button>

// Secondary Button
<button style={{
  background: 'transparent',
  color: '#2D5A27',
  padding: '12px 24px',
  borderRadius: '6px',
  border: '1px solid #2D5A27',
  fontSize: '16px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 200ms ease-in-out'
}}>
  Secondary Action
</button>
```

### Cards
```tsx
// Use shadow OR border, never both
<div style={{
  background: '#FFFFFF',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  // NO border when using shadow
}}>
  Card Content
</div>
```

### Form Inputs
```tsx
<input style={{
  width: '100%',
  height: '48px',
  padding: '12px 16px',
  border: '1px solid #E9ECEF',
  borderRadius: '6px',
  fontSize: '16px',  // Prevents mobile zoom
  background: '#FFFFFF',
  transition: 'border-color 200ms ease-in-out'
}} />
```

---

## Tools & Resources

### Required Skills to Reference
Before starting frontend work, read these skill files:

1. **Design Guide** - `/mnt/.skills/skills/design-guide/SKILL.md`
   - Core design principles
   - Color, spacing, typography systems
   - Component patterns
   - Pre-ship checklist

2. **Theme Factory** - `/mnt/.skills/skills/theme-factory/SKILL.md`
   - Pre-set themes with colors/fonts
   - Apply consistent theming to artifacts

### shadcn/ui MCP Integration
When building complex components, leverage shadcn/ui through the MCP:

```tsx
// Available components
import {
  Alert, AlertDescription, AlertTitle, AlertDialog, AlertDialogAction
} from '@/components/ui/alert'
```

**Note:** When using shadcn/ui, maintain consistency with the established inline style approach for custom styling on top of base components.

### Next.js Image Component
```tsx
import Image from 'next/image'

<div style={{ position: 'relative', width: '100%', height: '320px' }}>
  <Image
    src="/assets/images/example.png"
    alt="Description"
    fill
    style={{
      objectFit: 'cover',
      objectPosition: 'center top'
    }}
    sizes="(max-width: 768px) 100vw, 33vw"  // Always include for optimization
  />
</div>
```

---

## Mobile-First Responsive Design

### Breakpoints
```tsx
const breakpoints = {
  mobile: '375px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1200px'
}
```

### Touch Targets
- Minimum 44x44px for all interactive elements
- Adequate spacing between tappable items

### Content Width
- Max content width: 1200px (centered)
- Full-width sections with contained content

---

## Interactive States

All interactive elements MUST have these states:

```tsx
// Inline style approach for states
const [isHovered, setIsHovered] = useState(false)
const [isActive, setIsActive] = useState(false)

<button
  style={{
    background: isActive ? '#1e4a1f' : isHovered ? '#266b22' : '#2D5A27',
    transform: isActive ? 'scale(0.98)' : 'none',
    transition: 'all 200ms ease-in-out'
  }}
  onMouseEnter={() => setIsHovered(true)}
  onMouseLeave={() => setIsHovered(false)}
  onMouseDown={() => setIsActive(true)}
  onMouseUp={() => setIsActive(false)}
>
```

---

## Pre-Development Checklist

Before starting any frontend task:

- [ ] Read `/mnt/.skills/skills/design-guide/SKILL.md`
- [ ] Check existing patterns in `/frontend/app/page.tsx`
- [ ] Identify which color palette to use (main vs gitan)
- [ ] Plan component structure with 8px grid spacing
- [ ] Consider mobile-first responsive approach

## Pre-Ship Checklist

Before completing any frontend task:

**Color & Style**
- [ ] Using established color palette
- [ ] No purple-blue gradients
- [ ] No emojis as design elements
- [ ] Single accent color only

**Spacing & Layout**
- [ ] All spacing uses 8px grid multiples
- [ ] Consistent whitespace throughout
- [ ] Mobile-responsive (test at 375px)

**Components**
- [ ] All buttons have hover/active states
- [ ] Cards use shadow OR border (not both)
- [ ] Forms have proper labels and spacing
- [ ] Interactive elements have clear feedback

**Polish**
- [ ] Subtle shadows only
- [ ] Smooth 200ms transitions
- [ ] No visual clutter
- [ ] Premium, modern aesthetic

---

## File Structure

```
/frontend
├── app/
│   ├── page.tsx           # Main landing page (reference for patterns)
│   ├── gitan/
│   │   └── page.tsx       # Gitan collaboration page
│   ├── saju/
│   │   ├── input/
│   │   │   └── page.tsx   # User input form (to be built)
│   │   └── result/
│   │       └── page.tsx   # Analysis results (to be built)
│   └── layout.tsx
├── components/            # Reusable components
├── lib/                   # Utilities
└── public/
    └── assets/
        └── images/        # Static images
```

---

## Summary

**Key Principles:**
1. Use inline styles to avoid CSS conflicts
2. Follow 8px grid spacing system religiously
3. One accent color per page, neutral base
4. Subtle shadows, strategic border-radius
5. No AI-looking elements (gradients, emojis, timelines)
6. Always read design-guide skill before starting
7. Test on mobile (375px width minimum)
8. Premium = restraint + consistency + clarity
