# ADR-014 — Primary Source and Corroboration Authority

## Status
Accepted for NA-03.

## Context
A reputable article is not necessarily the primary source for the event it reports. ORBI News must distinguish source quality from source authority and must not treat a media article as equivalent to an official statement, government publication, academic source, company announcement, press release, or official social account.

## Decision
Primary-source eligibility is deterministic.

A source is eligible as PRIMARY only when all of the following are true:

1. its role is PRIMARY;
2. its type is one of OFFICIAL, GOVERNMENT, ACADEMIC, COMPANY_BLOG, PRESS_RELEASE, or SOCIAL_OFFICIAL;
3. its credibility band is HIGH or AUTHORITATIVE.

PRIMARY_MEDIA can be excellent corroborating evidence but is not automatically treated as the origin authority for the underlying event.

## Corroboration tiers

### STANDARD / low-risk claims
- minimum 1 independent supporting source;
- primary source is not mandatory at the research stage.

### HIGH_IMPACT or high-risk claims
- minimum 2 independent supporting sources;
- at least one eligible primary source is required.

### SENSITIVE or critical claims
- minimum 2 independent supporting sources;
- eligible primary source required;
- at least one AUTHORITATIVE source required.

## Independence
Sources are counted by distinct SourceId. Duplicate appearances of the same source do not increase corroboration count.

## Authority boundary
Meeting corroboration requirements does not mean the claim is true, approved, or publishable. It only means the evidence set satisfies the minimum evidence structure required for the verification engine to continue.

Verification status, risk policy, editorial approval, publication policy, state-machine authority, and kill switches remain independent gates.
