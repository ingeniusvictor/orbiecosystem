# Analytics Specification

## Existing Analytics

No analytics solution was detected in the repository baseline. No Google Analytics, gtag, PostHog, Plausible or similar integration was found.

## Implementation Boundary

No new analytics tool will be added without explicit approval. No cookies or unnecessary tracking should be introduced for the competition pages.

Any implementation remains pending until the current architecture and privacy requirements are verified.

## Potential Events

If analytics is approved later, possible privacy-safe events could include:

- `climate_recovery_page_view`
- `climate_recovery_cta_click`
- `PVMetrics_project_view`
- `language_switch_click`
- `demo_section_view`
- `download_pitch_deck_click` only if a public approved deck exists

## Data Not To Collect

- Names
- Email addresses
- Phone numbers
- RUT or national IDs
- Precise personal location
- API keys or tokens
- Company private data
- Customer data
- Uploaded files
- Free-text prompts containing personal or confidential information

## Event Rules

- Avoid personal data in event names, labels and properties.
- Do not track private admin interactions.
- Do not track unpublished routes.
- Do not identify users unless a future approved privacy policy supports it.
- Keep synthetic demo interactions separate from real product usage.
