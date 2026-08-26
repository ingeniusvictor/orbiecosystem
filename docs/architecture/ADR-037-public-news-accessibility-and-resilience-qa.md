# ADR-037 — Public News Accessibility and Resilience QA

## Status
Accepted for NA-07.9.

## Decision
The ORBI News public experience must remain usable with keyboard navigation, assistive technology, narrow viewports, slow networks and failed API requests without weakening publication authority.

## Rules
1. Internal public navigation uses semantic links when the action changes URL.
2. Category navigation exposes `aria-current="page"` only for the active destination.
3. Keyboard focus must remain visibly identifiable on public ORBI News links.
4. Loading states use live status semantics and loading containers expose busy state where appropriate.
5. API failures are distinct from valid empty feeds and from article-not-found responses.
6. Failed requests never render partial or unvalidated content as a published story.
7. Feed and article failures provide deterministic retry destinations.
8. External source links disclose new-tab behavior to assistive technology and use `noopener noreferrer`.
9. News card images use native lazy loading/async decoding where appropriate; article hero imagery may load immediately.
10. The home News module remains optional: an empty or failed feed renders no module and does not degrade the corporate home.
11. Mobile layouts must not depend on hover interaction. Category navigation remains horizontally scrollable and cards collapse to a single-column flow below responsive breakpoints.
12. Accessibility/responsive presentation has no authority to modify Verification, Event Intelligence, Editorial, Visual or Publication state.

## Error-state precedence
- request pending -> loading/status state;
- valid empty response -> controlled empty state;
- HTTP/validation/network failure -> explicit load error and retry;
- article 404 -> article unavailable;
- article transport/validation failure -> load error, never 404 substitution.

## Verification
NA-07.9 is accepted only when global TypeScript validation and the deterministic ORBI News suite pass after these changes.

## Consequences
The portal behaves more like a real public publication surface: links remain browser-native, keyboard navigation is visible, assistive technologies receive current/loading/error context, and service failures cannot silently masquerade as valid editorial states.
