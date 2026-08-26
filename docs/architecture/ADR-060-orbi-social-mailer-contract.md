# ADR-060 — ORBI Social Mailer Contract

## Status
Accepted — NA-09.8

## Context
ORBI News needs to deliver a prepared social package to a human operator by email, but delivery state must not be confused with editorial readiness or manual posting state.

## Decision
Introduce `SocialMailerJob` and `SocialEmailStatus` as a separate delivery domain.

A mailer job may be created only when:

- the `CanonicalStory` is `PUBLISHED` and has `publishedAt`;
- the `SocialPackage` is `READY`;
- story and package belong to the same organization;
- the package references the same canonical story.

The initial job state is `NOT_CREATED`. Creating the domain job does not send an email.

## State machine

`NOT_CREATED -> GENERATING -> READY -> SENDING -> SENT`

Failures may occur from intermediate states and transition to `FAILED`. A failed job may retry only by returning to `GENERATING`. `SENT` is terminal.

## Provenance
Each job retains:

- `canonicalStoryId`;
- `socialPackageId`;
- opaque canonical story revision;
- opaque social package revision.

This prevents an email payload generated for one version from being silently associated with newer editorial content.

## Subject policy
V1 subject is deterministic:

`ORBI News Ready — [headline]`

## Non-goals
NA-09.8 does not:

- render the email body;
- attach or embed the visual asset;
- connect Gmail, SMTP, SES or another mail provider;
- send messages;
- persist jobs;
- mark Facebook or Instagram as posted;
- change `SocialPackageStatus`.

Those concerns belong to later NA-09 phases.
