# Accessibility Specification

Future competition pages must satisfy the following requirements.

## Structure

- Use one H1 per page.
- Use hierarchical headings without skipping levels for visual convenience.
- Set the correct HTML language for each route.
- Ensure content remains understandable without decorative effects.

## Keyboard And Focus

- All interactive controls must be reachable by keyboard.
- Focus must be visible.
- Modals must manage focus and expose accessible names.
- Links and buttons must have clear, distinct purposes.

## Visual Access

- Provide sufficient contrast for text, controls and focus indicators.
- Do not rely only on color to communicate status.
- Support zoom at 200%.
- Maintain adequate touch targets on mobile.
- Avoid text overlap at 1440, 1024, 768, 390 and 360 pixel widths.

## Media And Motion

- Provide meaningful alt text for informative images.
- Mark decorative images appropriately.
- Respect `prefers-reduced-motion`.
- Avoid autoplaying essential information without accessible alternatives.

## Forms

- Use real labels for all inputs.
- Do not create forms until the backend and privacy handling are approved.
- Avoid collecting personal data unless strictly necessary and approved.

## Test Viewports

Required responsive review widths:

- 1440 px
- 1024 px
- 768 px
- 390 px
- 360 px

## Acceptance Criteria

A future `/climate-recovery` route is not acceptable until keyboard navigation, visible focus, contrast, zoom, reduced motion and responsive behavior have been checked.
