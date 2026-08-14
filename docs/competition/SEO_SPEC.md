# SEO Specification

This document defines SEO requirements and the WEB-07 implementation scope.

## Primary Metadata ES

- Title: `ORBI PBMetrics IA | Climate Recovery Intelligence`
- Meta description: `Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.`
- Canonical: `https://orbiecosystem.vercel.app/climate-recovery`
- HTML language: `es`

## Primary Metadata EN

- Title: `ORBI PBMetrics IA | Climate Recovery Intelligence`
- Meta description: `Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.`
- Canonical: `https://orbiecosystem.vercel.app/climate-recovery/en`
- HTML language: `en`

## Open Graph

- `og:type`: `website`
- `og:title`: `ORBI PBMetrics IA | Climate Recovery Intelligence`
- `og:description`: `Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.`
- `og:url`: route-specific canonical public URL
- `og:site_name`: `ORBI Ecosystem SpA`
- `og:image`: `SOCIAL IMAGE PENDING APPROVAL`

## Twitter / X

- `twitter:card`: `summary_large_image`
- `twitter:title`: `ORBI PBMetrics IA | Climate Recovery Intelligence`
- `twitter:description`: `Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.`
- `twitter:image`: `SOCIAL IMAGE PENDING APPROVAL`

## Sitemap

The sitemap includes approved public routes only:

- `https://orbiecosystem.vercel.app/`
- `https://orbiecosystem.vercel.app/climate-recovery`
- `https://orbiecosystem.vercel.app/climate-recovery/en`
- `https://orbiecosystem.vercel.app/projects/orbi-pbmetrics`

## robots.txt

`robots.txt` allows crawl of approved public pages and references the sitemap URL. It does not expose private, administrative or internal paths.

## hreflang

Bilingual pages should include:

- `es`: `https://orbiecosystem.vercel.app/climate-recovery`
- `en`: `https://orbiecosystem.vercel.app/climate-recovery/en`
- `x-default`: recommended to point to the Spanish route unless strategy changes

WEB-07 implements these relationships in the single-page app head.

## Social Image Status

`SOCIAL IMAGE PENDING APPROVAL`

The current favicon/logo asset exists at `/assets/logo.jpeg`, but its dimensions are 1254 x 1254 px. It is not the approved 1200 x 630 px social image requested for Open Graph and Twitter/X cards. Do not publish `og:image` or `twitter:image` until an approved 1200 x 630 px asset exists at a stable public URL.

## Structured Data

### Organization

Implemented with verified organization data only:

- Name: ORBI Ecosystem SpA
- URL: `https://orbiecosystem.vercel.app/`
- Headquarters: Rancagua, Chile

### WebSite

Implemented for the corporate site:

- Name: ORBI Ecosystem
- URL: `https://orbiecosystem.vercel.app/`

### SoftwareApplication

Implemented for ORBI PBMetrics IA with conservative, verified information only:

- Name: ORBI PBMetrics IA
- Application category: Renewable energy operational intelligence
- Operating system: omitted because it is not verified
- Offers/pricing: Do not include unless verified
- Ratings/reviews: Do not include

## Prohibited SEO Claims

Do not declare ratings, prices, customers, users, awards, reviews, pilots, alliances, energy recovery percentages or climate results unless verified and approved.
