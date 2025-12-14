# Design Guidelines - Plateforme Éducative Linux Virtuelle

## Design Approach

**System-Based with Linux Desktop Inspiration**: Material Design principles adapted to create a familiar desktop environment experience, drawing from modern Linux distributions (Ubuntu, elementary OS) for authentic workspace simulation.

**Core Principle**: Simulate a professional desktop operating system environment while maintaining web-based efficiency and educational clarity.

---

## Typography System

**Font Stack**: 
- Primary: 'Inter' (system UI, clean readability)
- Monospace: 'JetBrains Mono' (code editor, terminal elements)

**Hierarchy**:
- Desktop App Titles: text-sm font-medium (12-13px)
- Window Headers: text-base font-semibold (16px)
- Body Content: text-sm (14px)
- Menu Items: text-xs font-medium (12px)
- Teacher Dashboard Headers: text-2xl font-bold (24px)
- Student Names/Classes: text-sm font-medium (14px)

---

## Layout & Spacing System

**Spacing Units**: Use Tailwind units of **1, 2, 4, 6, 8** exclusively
- Tight spacing: p-1, gap-1 (desktop icons, menu items)
- Standard spacing: p-2, p-4, gap-4 (window padding, app content)
- Section spacing: p-6, p-8, gap-8 (dashboard sections, major layouts)

**Grid System**:
- Desktop Icons: grid with gap-2, 6-8 columns
- Teacher Dashboard: 12-column grid for student monitoring
- File Manager: 4-column grid for documents/folders

---

## Component Library

### A. Desktop Environment Components

**Top Menu Bar** (Fixed Height: h-8)
- System menu, clock, user info, logout
- Horizontal layout with justify-between
- Icons from Heroicons (outline)

**Desktop Workspace**
- Full viewport height minus menu bar
- Grid layout for application shortcuts
- Icon size: w-16 h-16 with text-xs labels below

**Window System**
- Draggable windows with title bar (h-8)
- Window controls (minimize, maximize, close) - right aligned
- Content area with p-4
- Resize handles (subtle visual indicators)
- Shadow: shadow-2xl for depth
- Border radius: rounded-lg for modern feel

### B. Application Windows

**Text Editor**
- Toolbar: h-10 with formatting buttons
- Line numbers column: w-12
- Content area: monospace font, p-4
- Status bar: h-6 at bottom

**File Manager**
- Left sidebar: w-48 (navigation tree)
- Main area: Grid or list view toggle
- Breadcrumb navigation: h-10
- File cards: Folder icon + name, hover state with shadow

**Browser**
- Address bar: h-10 with navigation buttons
- Tab bar: h-8 above address bar
- Content iframe area below

**Calculator/Notes**
- Compact windows: max-w-sm to max-w-md
- Calculator: Grid layout for buttons (gap-1)
- Notes: Simple textarea with p-4

### C. Teacher Control Panel

**Dashboard Layout**
- Full screen view (not desktop simulation)
- Top navigation: h-16 with teacher name, class selector
- Main area split: Sidebar (w-64) + Content area

**Student Monitor Grid**
- Grid: grid-cols-3 lg:grid-cols-4 gap-4
- Each student card:
  - Header with student name + class badge
  - Screen preview area (aspect-ratio-video)
  - Control buttons row (disconnect, share to, view)
  - Status indicator (online/offline)

**File Sharing Panel**
- Drag-drop zone: min-h-32, dashed border
- Class selector: Checkbox group (6e, 5e, 4e, 3e)
- File list: Table layout with file name, size, date
- Share button: Prominent, full-width

**Screen Sharing Broadcast**
- Full-width preview window
- Active indicator badge
- Class selection checkboxes
- Start/Stop broadcast controls

### D. Authentication Pages

**Login Screen**
- Centered card: max-w-md, p-8
- School/platform logo at top
- Form fields with consistent h-10 inputs
- Role selector: Student/Professeur (radio buttons or tabs)
- Submit button: w-full, h-10

---

## Navigation Patterns

**Desktop Navigation**: Click icons to launch windowed apps
**Teacher Navigation**: Sidebar with icons + labels (vertical nav)
**Window Management**: Taskbar at bottom showing open windows (h-10)

---

## Data Display Patterns

**Class Roster**: Table with columns: Nom, Classe, Statut, Actions
**File Lists**: Grid cards with preview icons or table rows
**Student Activity**: Timeline or status cards with timestamps
**Notification Toast**: Fixed position top-right, slide-in animation (use sparingly)

---

## Form Elements

**Inputs**: h-10, rounded-md, border, px-4
**Buttons**: h-10, px-6, rounded-md, font-medium
**Dropdowns**: Custom styled selects, h-10
**Checkboxes/Radio**: w-4 h-4 with labels
**File Upload**: Drag-drop zone with dashed border-2, min-h-24

---

## Interaction States

- Hover: Subtle shadow increase, no color change
- Active/Selected: Slightly darker treatment, border emphasis
- Disabled: Reduced opacity (opacity-50)
- Focus: Ring outline for keyboard navigation

---

## Icons

**Library**: Heroicons (outline for UI, solid for active states)
**Sizes**: 
- Menu icons: w-4 h-4
- Desktop icons: w-12 h-12
- Window controls: w-4 h-4
- Action buttons: w-5 h-5

---

## Responsive Behavior

**Desktop Simulation** (Student View): 
- Minimum viewport: 1024px width recommended
- Scale desktop UI proportionally on smaller screens
- Stack windows on mobile (not recommended for full experience)

**Teacher Dashboard**: 
- Fully responsive
- Student grid: 1 column (mobile) → 2 columns (tablet) → 3-4 columns (desktop)
- Sidebar collapses to hamburger menu on mobile

---

## Special Considerations

**Window Layering**: z-index system (z-10, z-20, z-30) for overlapping windows
**Taskbar**: Always visible at bottom (fixed position)
**Desktop Background**: Solid treatment or subtle geometric pattern
**Loading States**: Skeleton screens for student previews, spinner for actions
**Real-time Updates**: Subtle pulse animation on status indicators for active connections