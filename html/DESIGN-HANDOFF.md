# 0f6421c0-1059-4832-bccc-8cf57828fb25 implementation handoff

This archive is the source of truth for turning the design into production code. Start from `index.html`, then preserve the visual system, responsive behavior, and interactions found in the exported files.

## Implementation target
- Build production UI from the exported design, not a loose reinterpretation.
- Preserve typography scale, spacing rhythm, color tokens, border radii, shadows, motion timing, and component states.
- Replace static placeholders only when the target app has real data or functional equivalents.
- Keep generated product UI free of Open Design chrome, preview labels, or design-process annotations.
- Treat this handoff as a visual contract: if implementation choices conflict, match the exported pixels and behavior first, then refactor internals.

## Source map
- Primary entry: `index.html`
- HTML screens detected: 9
- Stylesheets detected: 0
- Script/component files detected: 0
- Supporting assets detected: 38

## Responsive contract
Validate the implementation across this 2025–2026 viewport matrix:
- Mobile compact: 360×800
- Mobile standard: 390×844
- Mobile large: 430×932
- Foldable / small tablet: 600×960
- Tablet portrait: 820×1180
- Tablet landscape: 1024×768
- Laptop: 1366×768
- Desktop: 1440×900
- Wide desktop: 1920×1080

For responsive web exports, treat these as a modern breakpoint system for one adaptive web experience, not three fixed screenshots. Do not split responsive web into unrelated native app screens unless the project explicitly includes native targets. Use semantic layout thresholds, fluid `clamp()` type/spacing, and container queries where component width matters more than viewport width. Preserve any CSS media queries, container queries, fluid `clamp()` scales, and layout changes already present in the exported files.

## Design fidelity contract
- Extract reusable tokens before writing components: background, surface, foreground, muted text, border, accent, radius, shadow, spacing, type scale, and motion duration/easing.
- Map product screens, in-app modules/components, optional landing page, and optional OS widget surfaces before coding. Keep these surfaces separate in the target architecture.
- Match layout geometry: max-widths, gutters, grid columns, card proportions, sticky/fixed elements, and viewport-specific navigation.
- Preserve real copy, labels, and data shown in the export. Do not replace specific text with generic marketing filler.
- Preserve interactive affordances: hover, focus, pressed, disabled, loading, validation, copy/share, tab/accordion, modal/sheet, and keyboard states where present.
- Preserve accessibility semantics when converting: headings stay hierarchical, controls remain buttons/links/inputs, focus states stay visible.
- Do not keep prototype-only annotations, frame labels, or Open Design chrome in the production UI.

## CJX-ready UX contract
- Use `DESIGN-MANIFEST.json` as the machine-readable map for screens, app modules, OS widgets, landing pages, tokens, interactions, and viewport checks.
- Screen-file-first: when multiple user-facing surfaces exist, implement each HTML screen as its own route/file. Treat `index.html` as a launcher/overview when the manifest marks it that way, not as a combined final UI.
- If `landing.html`, app screens, platform screens, or OS widget files exist, preserve those boundaries in the target app instead of merging them into one page.
- A single self-contained `index.html` is acceptable only when the export truly contains one user-facing screen and its CSS/JS are structured enough to extract tokens, components, states, and behavior.
- If separate `css/` or `js/` files exist, treat them as source of truth for token/component/interactions before porting to React, Vue, SwiftUI, Compose, or another target stack.
- In-app modules/components are product UI blocks inside the app. OS widgets are home-screen/lock-screen/quick-access surfaces outside the app. Do not merge those concepts.

## Color and brand contract
- Use the exported design tokens and product/domain context as the color source of truth.
- Do not introduce warm beige / cream / peach / pink / orange-brown background washes unless they are already explicit brand/reference colors in the export.
- No obvious token stylesheet was detected; sample colors from the entry file and convert them into named tokens before coding.

## Implementation sequence for AI coding tools
1. Open `index.html` and `DESIGN-MANIFEST.json`; identify every screen file, launcher/overview file, app module, and interaction before coding.
2. If multiple HTML screens exist, map them to separate routes/surfaces first; do not merge `landing.html`, product app screens, platform screens, or OS widgets into one route.
3. Extract a token table from CSS/root styles and inline styles before building framework components.
4. Build product screens and domain-specific in-app modules from largest layout regions down to controls; avoid starting with isolated atoms that lose spatial intent.
5. Port responsive behavior across the modern viewport matrix and test each semantic breakpoint before cleanup.
6. Port interactions and states, then replace static placeholders only with real app data or functional equivalents.
7. Keep optional landing page and OS widget surfaces as separate surfaces if present.
8. Compare final screenshots against the export at 360×800, 390×844, 430×932, 820×1180, 1024×768, 1366×768, 1440×900, and 1920×1080 before declaring done.

## Entry points
- `essay.html`
- `index.html`
- `landing.html`
- `literature-manager.html`
- `literature-reader.html`
- `paper-editor.html`
- `settings.html`
- `skills.html`
- `welcome.html`

## Styles
- None detected

## Scripts/components
- None detected

## Assets and supporting files
- ` + sidebarContent + `
- `mpdoci71-NexusResearch_product-spec_V1.0.md`
- `mpposoxi-drawing-2026-05-28T16-07-52-368Z.png`
- `mpv5tk0k-drawing-2026-06-01T12-03-17-006Z.png`
- `mpv5znpz-drawing-2026-06-01T12-08-01-747Z.png`
- `mpv60ipk-drawing-2026-06-01T12-08-41-909Z.png`
- `mpv64eyi-drawing-2026-06-01T12-11-43-670Z.png`
- `mpv69uhg-drawing-2026-06-01T12-15-57-072Z.png`
- `mpv6j4k7-drawing-2026-06-01T12-23-10-036Z.png`
- `mpv6nc8z-drawing-2026-06-01T12-26-26-624Z.png`
- `mpv6ssbb-drawing-2026-06-01T12-30-40-724Z.png`
- `mpv73aqq-drawing-2026-06-01T12-38-51-168Z.png`
- `mpvyxg1s-drawing-2026-06-02T01-38-07-355Z.png`
- `mpvz5781-drawing-2026-06-02T01-44-09-166Z.png`
- `mpvzfren-drawing-2026-06-02T01-52-21-884Z.png`
- `mpvzp4nw-drawing-2026-06-02T01-59-38-968Z.png`
- `mpvzwont-drawing-2026-06-02T02-05-31-479Z.png`
- `mpw04e67-drawing-2026-06-02T02-11-31-132Z.png`
- `mpw09vqo-drawing-2026-06-02T02-15-47-174Z.png`
- `mpw0hmyn-drawing-2026-06-02T02-21-49-053Z.png`
- `mpw0lme3-drawing-2026-06-02T02-24-54-934Z.png`
- `mpw0ovoz-drawing-2026-06-02T02-27-26-960Z.png`
- `mpw0ukbu-drawing-2026-06-02T02-31-52-167Z.png`
- `mpw0zbs7-drawing-2026-06-02T02-35-34-351Z.png`
- `mpw132ns-drawing-2026-06-02T02-38-29-172Z.png`
- `mpw1cjsh-drawing-2026-06-02T02-45-51-277Z.png`
- `mpy09x7c-drawing-2026-06-03T11-51-21-428Z.png`
- `mpy0du73-drawing-2026-06-03T11-54-24-153Z.png`
- `mpy0hqf3-drawing-2026-06-03T11-57-25-884Z.png`
- `mpy0mr1v-drawing-2026-06-03T12-01-19-983Z.png`
- `mpy0soa9-drawing-2026-06-03T12-05-56-334Z.png`
- `mpy11g77-drawing-2026-06-03T12-12-45-759Z.png`
- `mpy16d11-drawing-2026-06-03T12-16-34-930Z.png`
- `mpy1cn1f-drawing-2026-06-03T12-21-27-841Z.png`
- `mpy1l15l-drawing-2026-06-03T12-27-59-382Z.png`
- `mpy27t80-drawing-2026-06-03T12-45-42-188Z.png`
- `mpy2dgvp-drawing-2026-06-03T12-50-06-131Z.png`
- `mpy2gkpe-drawing-2026-06-03T12-52-31-055Z.png`

## Coding checklist for AI tools
1. Inspect `index.html` and `DESIGN-MANIFEST.json` first and identify reusable components before coding.
2. Implement each user-facing screen file as its own route/surface; keep launcher, landing, app, platform, and OS widget files separate.
3. Extract design tokens into the target stack: colors, type scale, spacing, radius, shadows, and motion.
4. Implement layout with real 2025–2026 responsive breakpoints, fluid type/spacing, and container-query-aware component behavior; test with no horizontal overflow.
5. Preserve interactive controls, hover/focus/pressed states, form behavior, validation, and copy actions where present.
6. Implement domain-specific in-app modules with real states; do not flatten them into generic cards.
7. Keep landing page, product screens, and OS widget/quick-access surfaces separate when present.
8. Confirm the production result visually matches the exported design before refactoring internals.
9. Reject implementation shortcuts that flatten the design into generic cards, generic gradients, placeholder stats, or framework-default typography.
10. If a detail is ambiguous, keep the exported HTML/CSS/JS behavior rather than inventing a new pattern.
