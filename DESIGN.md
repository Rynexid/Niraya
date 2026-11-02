# Niraya POS — Design System

The visual language for Niraya POS. It is built on shadcn/ui primitives with a
thin custom Tailwind layer, and it is intentionally calm: an operator should be
able to scan a queue, a total or a stock warning without decorative noise.

Two files define the system:

| File                     | Responsibility                                             |
| ------------------------ | ---------------------------------------------------------- |
| `src/styles/themes.css`  | Raw color, radius, height, layout and z-index tokens        |
| `src/styles/globals.css` | Tailwind imports, `@theme` bridge, utilities and base layer |

Components never hardcode hex values. They consume tokens through Tailwind
utilities such as `bg-card`, `text-muted-foreground`, `border-border`,
`bg-success/10` or `ring-ring`.

---

## 1. Design philosophy

- **Operational clarity over decoration.** Flat surfaces, 1px borders, restrained
  elevation and generous alignment. No gradients, neon, glassmorphism or
  ornamental backgrounds.
- **60% shadcn/ui, 40% custom Tailwind.** Interactive behaviour comes from Radix
  primitives via shadcn. Layout, density, spacing and product-specific
  composition are written with Tailwind utilities.
- **Color is never the only signal.** Status colors are always paired with text
  and/or an icon (`StatusIndicator`, `TransactionStatus`, `StockIndicator`).
- **Density with breathing room.** Default controls are 36px tall, table rows
  have 10px vertical padding, and page sections are separated by 40px.
- **One visual language.** A custom component extends the tokens; it does not
  introduce a second palette, radius or type scale.

---

## 2. Color tokens

All values live in `:root` (light) and `.dark` in `src/styles/themes.css`.

### Surfaces

| Token                   | Light     | Dark      | Usage                               |
| ----------------------- | --------- | --------- | ----------------------------------- |
| `--background`          | `#FFFFFF` | `#111111` | Page background                     |
| `--foreground`          | `#171717` | `#FAFAFA` | Primary text                        |
| `--card`                | `#FFFFFF` | `#171717` | Cards, panels, tables               |
| `--card-foreground`     | `#171717` | `#FAFAFA` | Text on cards                       |
| `--popover`             | `#FFFFFF` | `#171717` | Menus, popovers, dialogs            |
| `--popover-foreground`  | `#171717` | `#FAFAFA` | Text on overlays                    |
| `--secondary`           | `#F5F5F5` | `#171717` | Secondary surfaces and active nav   |
| `--secondary-foreground`| `#171717` | `#FAFAFA` | Text on secondary surfaces          |
| `--muted`               | `#F5F5F5` | `#1F1F1F` | Muted fills, skeletons, table hover |
| `--muted-foreground`    | `#737373` | `#A3A3A3` | Captions, labels, metadata          |
| `--accent`              | `#F0F0F0` | `#262626` | Hover/selected surface              |
| `--accent-foreground`   | `#171717` | `#FAFAFA` | Text on accent surfaces             |
| `--border`              | `#E5E5E5` | `#292929` | Borders and dividers                |
| `--input`               | `#E5E5E5` | `#292929` | Input and select borders            |
| `--ring`                | `#2563EB` | `#3B82F6` | Focus ring                          |

### Brand and semantic

| Token                    | Light     | Dark      | Usage                                  |
| ------------------------ | --------- | --------- | -------------------------------------- |
| `--primary`              | `#2563EB` | `#3B82F6` | Primary actions, links, active accents |
| `--primary-foreground`   | `#FFFFFF` | `#FFFFFF` | Text on primary                        |
| `--success`              | `#15803D` | `#22C55E` | Paid, in stock, positive change        |
| `--success-foreground`   | `#FFFFFF` | `#052E16` | Text on solid success                  |
| `--warning`              | `#B45309` | `#F59E0B` | Pending, low stock, attention          |
| `--warning-foreground`   | `#FFFFFF` | `#1C1204` | Text on solid warning                  |
| `--destructive`          | `#DC2626` | `#F87171` | Voided, errors, destructive actions    |
| `--destructive-foreground`| `#FFFFFF`| `#1A0505` | Text on solid destructive              |
| `--info`                 | `#0369A1` | `#38BDF8` | Refunds, sync, neutral information     |
| `--info-foreground`      | `#FFFFFF` | `#082F49` | Text on solid info                     |

Semantic badges and alerts use a soft fill: `bg-success/10 text-success`,
`bg-warning/10 text-warning`, `bg-info/10 text-info` and
`bg-destructive/10 text-destructive`. Solid buttons use the matching
`*-foreground` token.

### Charts and sidebar

- `--chart-1` … `--chart-5` provide a categorical palette (blue, green, amber,
  violet, pink).
- `--sidebar*` tokens mirror the surface palette so the sidebar can be themed
  independently in the application shell stage.

---

## 3. Typography

| Role        | Family                  | Size / weight              | Notes                          |
| ----------- | ----------------------- | -------------------------- | ------------------------------ |
| Display     | Plus Jakarta Sans       | 24–30px / 600              | `text-2xl`–`text-3xl`, tracking-tight |
| Page title  | Plus Jakarta Sans       | 20px / 600                 | `text-xl font-semibold`        |
| Section     | Plus Jakarta Sans       | 16–18px / 600              | `text-base`/`text-lg`          |
| Body        | Plus Jakarta Sans       | 14px / 400                 | `text-sm leading-5`            |
| Control     | Plus Jakarta Sans       | 14px / 500                 | Buttons, inputs, tabs          |
| Caption     | Plus Jakarta Sans       | 12px / 400–500             | `text-xs text-muted-foreground`|
| Numeric     | Plus Jakarta Sans       | Inherit + `tabular-nums`   | Money, quantities, totals      |
| Identifier  | JetBrains Mono          | 12px / 400                 | Receipt IDs, SKUs, code        |

Rules:

- Fonts are loaded from Fontsource: `@fontsource-variable/plus-jakarta-sans` and
  `@fontsource-variable/jetbrains-mono`.
- Use `font-sans` for UI and `font-mono` for identifiers, receipts and code.
- Use `font-medium` (500) for controls and `font-semibold` (600) for headings.
  Avoid 700+ except in exceptional emphasis.
- Always apply `tabular-nums` to monetary values, counts and table totals.
- Use `tracking-tight` on headings, never on body text.

---

## 4. Spacing

Tailwind's 4px base scale is the spacing system. The tokens below are the
project-level rhythm:

| Token / utility         | Value | Usage                                  |
| ----------------------- | ----- | -------------------------------------- |
| `--spacing-page`        | 24px  | Page horizontal padding at desktop     |
| `--spacing-section`     | 40px  | Gap between page sections              |
| `gap-2` / `gap-3`       | 8/12px| Control groups and inline metadata     |
| `gap-4` / `gap-6`       | 16/24px| Card grids and form fields            |
| Card padding            | 12–16px| `Card` uses 12px (`sm`) or 16px        |
| Table cell padding      | 12px × 10px | `TableHead` / `TableCell`         |

Control heights are tokens, not one-off classes:

| Token                   | Value | Utility            |
| ----------------------- | ----- | ------------------ |
| `--control-height-xs`   | 28px  | `h-control-xs`     |
| `--control-height-sm`   | 32px  | `h-control-sm`     |
| `--control-height-md`   | 36px  | `h-control-md`     |
| `--control-height-lg`   | 40px  | `h-control-lg`     |

Buttons, inputs and select triggers use `md` by default. Icon buttons use the
matching `size-control-*` utility.

---

## 5. Radius and elevation

The base radius is **8px** (`--radius`).

| Token         | Approx. | Usage                          |
| ------------- | ------- | ------------------------------ |
| `rounded-sm`  | 4.8px   | Dense chips, small controls    |
| `rounded-md`  | 6.4px   | Badges, thumbnails, nav items  |
| `rounded-lg`  | 8px     | Buttons, inputs, cards, panels |
| `rounded-xl`  | 11.2px  | Large surfaces (dialogs)       |
| `rounded-2xl` | 14.4px  | Rare, large containers         |

Avoid pill shapes except where they are conventional: switches, avatars and
circular icon affordances. Badges use `rounded-md`.

Shadows are intentionally restrained:

| Token        | Usage                                    |
| ------------ | ---------------------------------------- |
| `shadow-xs`  | Subtle raised surfaces (rare)            |
| `shadow-sm`  | Small popovers                           |
| `shadow-md`  | Dropdowns, popovers, select content      |
| `shadow-lg`  | Dialogs, sheets                          |

Cards use a border, not a shadow. Do not add hover elevation to cards.

---

## 6. Motion

- Standard easing: `--ease-standard` = `cubic-bezier(0.2, 0, 0, 1)`.
- Durations: 100ms for overlays, 150–200ms for sheets, 200–300ms for progress.
- Motion communicates state (open/close, loading, progress), never decoration.
- `prefers-reduced-motion` is respected globally in `globals.css`.
- Avoid animating layout properties in data-dense screens.

---

## 7. Z-index layers

Tokens are defined in `themes.css` and exposed as utilities:

| Utility        | Value | Usage                             |
| -------------- | ----- | --------------------------------- |
| `z-base`       | 0     | Page content                      |
| `z-sticky`     | 10    | Sticky headers                    |
| `z-dropdown`   | 20    | Inline dropdowns                  |
| `z-overlay`    | 40    | Overlay scrims                    |
| `z-modal`      | 50    | Dialogs and sheets                |
| `z-popover`    | 50    | Popovers and select content       |
| `z-toast`      | 60    | Sonner toasts                     |
| `z-tooltip`    | 70    | Tooltips                          |

shadcn primitives currently use `z-50` for portalled overlays. Keep new custom
overlays on the tokens above.

---

## 8. Theme behavior

- `next-themes` is configured in `src/App.tsx` with `attribute="class"`,
  `defaultTheme="system"`, `enableSystem`, `enableColorScheme` and
  `storageKey="niraya-theme"`.
- The theme is persisted in `localStorage` under `niraya-theme`.
- An inline script in `index.html` applies the stored/system theme before first
  paint, so the first frame already has the correct palette.
- `disableTransitionOnChange` prevents color transitions while switching.
- `ThemeToggle` is a three-state radio menu: Light, Dark, System.
- The dark palette is activated by `.dark` on `<html>`; `color-scheme` is kept
  in sync for native controls and scrollbars.
- Never branch component styles on theme in JavaScript. Use `dark:` utilities or
  semantic tokens.

---

## 9. Component conventions

### Locations

```
src/components/
├── ui/             shadcn primitives + IconButton (generated base layer)
├── layout/         Root layout and future application shells
├── navigation/     NavItem
├── forms/          DatePicker
├── data-display/   StatusIndicator
├── feedback/       EmptyState
├── pos/            POS-specific visual building blocks
└── shared/         Cross-feature components (ThemeToggle)
```

- `ui/` is reserved for shadcn primitives and generic controls. Keep business
  concepts out of it.
- `pos/` contains reusable visual components for the point of sale. They accept
  typed data and callbacks but never fetch or mutate.
- Feature-specific components belong in `src/features/<feature>/components`.
- Use `@/` aliases for every import.

### API and variants

- Export a named component and, when useful, a `variants` object from
  `class-variance-authority`.
- Type props explicitly. Extend `React.ComponentProps<'element'>` for native
  elements.
- Use `cn()` from `@/lib/utils` for conditional classes.
- Keep `data-slot` attributes on primitives; they are used by styling and tests.
- Keep components small. If a file needs more than ~200 lines, split the
  composition.

### States

- Every interactive component supports `disabled` where meaningful.
- Async actions use `loading` (Button and IconButton show a spinner and set
  `aria-busy` + `disabled`).
- Data components accept a `loading` prop when a skeleton is appropriate
  (`RevenueMetric`).
- Empty collections use `EmptyState`; loading collections use `Skeleton`.

### Accessibility

- Icon-only controls must have an accessible name (`IconButton` requires
  `label`).
- Form controls use `<Label htmlFor>` or the shadcn `Form` wrapper.
- Use semantic HTML (`button`, `nav`, `table`, `dl`, `section` with headings).
- Focus is always visible: `focus-visible:ring-3 ring-ring/50`.
- Do not rely on color alone; pair status color with text/icon.
- Overlays use Radix focus trapping and Escape handling.
- Respect reduced motion (global rule).

---

## 10. Component inventory

### Actions

| Component      | Path                                  | Notes                                |
| -------------- | ------------------------------------- | ------------------------------------ |
| Button         | `components/ui/button.tsx`            | 6 variants, 8 sizes, `loading`       |
| IconButton     | `components/ui/icon-button.tsx`       | Requires `label`, optional tooltip   |
| ButtonGroup    | `components/ui/button-group.tsx`      | Horizontal/vertical segmented groups |
| DropdownMenu   | `components/ui/dropdown-menu.tsx`     | Radix menu, destructive item variant |

### Forms

| Component      | Path                                  |
| -------------- | ------------------------------------- |
| Input          | `components/ui/input.tsx`             |
| Textarea       | `components/ui/textarea.tsx`          |
| Select         | `components/ui/select.tsx`            |
| Checkbox       | `components/ui/checkbox.tsx`          |
| RadioGroup     | `components/ui/radio-group.tsx`       |
| Switch         | `components/ui/switch.tsx`            |
| DatePicker     | `components/forms/date-picker.tsx`    |
| Form (RHF)     | `components/ui/form.tsx`              |

### Navigation

| Component      | Path                                  |
| -------------- | ------------------------------------- |
| Sidebar        | `components/ui/sidebar.tsx`           |
| NavItem        | `components/navigation/nav-item.tsx`  |
| Breadcrumb     | `components/ui/breadcrumb.tsx`        |
| Tabs           | `components/ui/tabs.tsx`              |
| Pagination     | `components/ui/pagination.tsx`        |

### Feedback

| Component      | Path                                  |
| -------------- | ------------------------------------- |
| Alert          | `components/ui/alert.tsx`             |
| Badge          | `components/ui/badge.tsx`             |
| Toaster        | `components/ui/sonner.tsx`            |
| Tooltip        | `components/ui/tooltip.tsx`           |
| Skeleton       | `components/ui/skeleton.tsx`          |
| EmptyState     | `components/feedback/empty-state.tsx` |

### Data display

| Component       | Path                                        |
| --------------- | ------------------------------------------- |
| Card            | `components/ui/card.tsx`                    |
| Table           | `components/ui/table.tsx`                   |
| Avatar          | `components/ui/avatar.tsx`                  |
| Separator       | `components/ui/separator.tsx`               |
| Progress        | `components/ui/progress.tsx`                |
| StatusIndicator | `components/data-display/status-indicator.tsx` |

### Overlays

Dialog, AlertDialog, Sheet, Popover and Command live in `components/ui/`.

### POS components

| Component              | Path                                          | Responsibility                         |
| ---------------------- | --------------------------------------------- | -------------------------------------- |
| ProductCard            | `components/pos/product-card.tsx`             | Catalogue tile with optional selection |
| ProductThumbnail       | `components/pos/product-thumbnail.tsx`        | Image + neutral fallback               |
| ProductPrice           | `components/pos/product-price.tsx`            | Currency + compare-at price            |
| StockIndicator         | `components/pos/stock-indicator.tsx`          | In stock / low / out                   |
| CategoryItem           | `components/pos/category-item.tsx`            | Category filter with count             |
| CartItem               | `components/pos/cart-item.tsx`                | Line item with quantity controls       |
| OrderSummary           | `components/pos/order-summary.tsx`            | Subtotal, discount, tax, total         |
| PaymentMethodSelector  | `components/pos/payment-method-selector.tsx`  | Accessible payment radio group         |
| TransactionStatus      | `components/pos/transaction-status.tsx`       | Status badge with icon                 |
| ReceiptPreview         | `components/pos/receipt-preview.tsx`          | Monospace print preview                |
| RevenueMetric          | `components/pos/revenue-metric.tsx`           | KPI tile with trend                    |

`src/components/pos/index.ts` is the public barrel for POS components and shared
POS types (`src/types/pos.ts`).

---

## 11. Responsive rules

Breakpoints are Tailwind defaults plus `xs`:

| Name | Min width | Typical use                          |
| ---- | --------- | ------------------------------------ |
| xs   | 480px     | Small phones in landscape            |
| sm   | 640px     | Two-column forms, compact grids      |
| md   | 768px     | Side-by-side panels                  |
| lg   | 1024px    | Desktop POS layout                   |
| xl   | 1280px    | Wide dashboards                      |
| 2xl  | 1536px    | Large registers                      |

- Design desktop-first for the register, but every page must work from 320px.
- Use CSS grid with `gap-3`/`gap-4` for product and metric grids.
- Tables live inside `Table`'s `overflow-x-auto` container; never let a table
  widen the page.
- Prefer `Sheet` for mobile editing and `Dialog` for desktop confirmation.
- Page padding: 16px on mobile, 24px on tablet, 32px on desktop.
- Touch targets are at least 32px; 36px is the default control height.

---

## 12. Iconography

- Use **Lucide React** exclusively for interface icons.
- Default size is `size-4` (16px). Use `size-3.5` inside badges and `size-5`
  in empty-state media.
- Decorative icons get `aria-hidden="true"`. Icons that are the only content
  need an accessible name via `IconButton label`.
- Keep the default 2px stroke; do not mix icon families.
- Brand marks are the only exception and live in `src/assets`.

---

## 13. Implementation guidelines

1. Add primitives with the shadcn CLI (`bunx shadcn add <name>`), then adapt
   only token-level classes (radius, height, semantic colors).
2. Put new tokens in `themes.css` and bridge them in `globals.css` under
   `@theme inline`; never use raw hex values in components.
3. Use `formatCurrency`, `formatDate`, `formatDateTime` and `formatNumber` from
   `src/lib/format.ts` instead of ad-hoc `Intl` calls.
4. Use `LOW_STOCK_THRESHOLD`, `PAGE_SIZES`, `DEFAULT_CURRENCY` and
   `DEFAULT_LOCALE` from `src/lib/constants.ts`.
5. Keep POS components presentational: data in, callbacks out, no fetching.
6. Check both themes and a 390px viewport before merging.
7. Run the validation suite:

```bash
bun run typecheck:all
bun run lint
bun run build:all
```

The interactive catalogue is available at `/design-system` in development and
preview builds. It is lazy-loaded so it does not inflate the initial bundle.
