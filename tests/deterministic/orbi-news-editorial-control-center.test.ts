import test from 'node:test';
import assert from 'node:assert/strict';

import { CanonicalStoryStatus } from '../../domain/editorial/canonical-story';
import {
  EditorialControlAction,
  EditorialRole,
  assessEditorialControlAction,
  getAvailableEditorialActions,
  type EditorialControlSnapshot,
} from '../../domain/editorial/control-center';
import { IntegratedEditorialDecision } from '../../domain/editorial/editorial-gate';
import { OrbiEditorialBand } from '../../domain/editorial/scoring';
import { PublicationStatus } from '../../domain/publications/publication';

const snapshot = (
  overrides: Partial<EditorialControlSnapshot> = {},
): EditorialControlSnapshot => ({
  storyStatus: CanonicalStoryStatus.READY_FOR_REVIEW,
  publicationStatus: PublicationStatus.NOT_SCHEDULED,
  editorialGate: {
    decision: IntegratedEditorialDecision.ALLOW_EDITORIAL,
    editorialBand: OrbiEditorialBand.PRIORITY,
    reasons: ['EDITORIAL_GATE_REQUIREMENTS_SATISFIED'],
  },
  breakingEligibility: {
    eligible: false,
    reasons: ['ORBI_SCORE_BELOW_BREAKING_THRESHOLD'],
  },
  isBreaking: false,
  ...overrides,
});

test('viewer never receives mutating editorial actions', () => {
  assert.deepEqual(getAvailableEditorialActions(EditorialRole.VIEWER, snapshot()), []);
});

test('reviewer can resolve a review but cannot prepare publication or breaking', () => {
  const actions = getAvailableEditorialActions(EditorialRole.REVIEWER, snapshot());

  assert.ok(actions.includes(EditorialControlAction.APPROVE_STORY));
  assert.ok(actions.includes(EditorialControlAction.REJECT_STORY));
  assert.equal(actions.includes(EditorialControlAction.MARK_BREAKING), false);
  assert.equal(actions.includes(EditorialControlAction.PREPARE_WEB_PUBLICATION), false);
  assert.equal(actions.includes(EditorialControlAction.PUBLISH_WEB_NOW), false);
});

test('editor cannot publish web immediately even when publication state is ready', () => {
  const ready = snapshot({
    storyStatus: CanonicalStoryStatus.APPROVED,
    publicationStatus: PublicationStatus.READY,
  });
  const assessment = assessEditorialControlAction(
    EditorialRole.EDITOR,
    EditorialControlAction.PUBLISH_WEB_NOW,
    ready,
  );

  assert.equal(assessment.allowed, false);
  assert.ok(assessment.reasons.includes('ROLE_NOT_AUTHORIZED'));
});

test('owner can request immediate web publication only from an approved and ready publication', () => {
  const ready = snapshot({
    storyStatus: CanonicalStoryStatus.APPROVED,
    publicationStatus: PublicationStatus.READY,
  });
  const assessment = assessEditorialControlAction(
    EditorialRole.OWNER,
    EditorialControlAction.PUBLISH_WEB_NOW,
    ready,
  );

  assert.equal(assessment.allowed, true);
});

test('owner cannot bypass editorial block to publish', () => {
  const blocked = snapshot({
    storyStatus: CanonicalStoryStatus.APPROVED,
    publicationStatus: PublicationStatus.READY,
    editorialGate: {
      decision: IntegratedEditorialDecision.BLOCK,
      editorialBand: OrbiEditorialBand.BREAKING_CANDIDATE,
      reasons: ['VERIFICATION_GATE_BLOCKED'],
    },
  });
  const assessment = assessEditorialControlAction(
    EditorialRole.OWNER,
    EditorialControlAction.PUBLISH_WEB_NOW,
    blocked,
  );

  assert.equal(assessment.allowed, false);
  assert.ok(assessment.reasons.includes('EDITORIAL_GATE_NOT_ALLOWED_FOR_PUBLICATION'));
});

test('breaking action requires explicit breaking eligibility and editorial allow', () => {
  const notEligible = assessEditorialControlAction(
    EditorialRole.EDITOR,
    EditorialControlAction.MARK_BREAKING,
    snapshot(),
  );
  assert.equal(notEligible.allowed, false);
  assert.ok(notEligible.reasons.includes('BREAKING_NOT_ELIGIBLE'));

  const eligible = assessEditorialControlAction(
    EditorialRole.EDITOR,
    EditorialControlAction.MARK_BREAKING,
    snapshot({ breakingEligibility: { eligible: true, reasons: [] } }),
  );
  assert.equal(eligible.allowed, true);
});

test('breaking eligibility cannot override a human-review editorial gate', () => {
  const assessment = assessEditorialControlAction(
    EditorialRole.OWNER,
    EditorialControlAction.MARK_BREAKING,
    snapshot({
      breakingEligibility: { eligible: true, reasons: [] },
      editorialGate: {
        decision: IntegratedEditorialDecision.REQUIRE_HUMAN_REVIEW,
        editorialBand: OrbiEditorialBand.BREAKING_CANDIDATE,
        reasons: ['HUMAN_EDITORIAL_REVIEW_REQUIRED'],
      },
    }),
  );

  assert.equal(assessment.allowed, false);
  assert.ok(assessment.reasons.includes('EDITORIAL_GATE_NOT_ALLOWED_FOR_BREAKING'));
});

test('published stories cannot be sent back to drafting by the control center', () => {
  const assessment = assessEditorialControlAction(
    EditorialRole.OWNER,
    EditorialControlAction.REQUEST_REVISION,
    snapshot({ storyStatus: CanonicalStoryStatus.PUBLISHED }),
  );

  assert.equal(assessment.allowed, false);
  assert.ok(assessment.reasons.includes('PUBLISHED_STORY_IMMUTABLE'));
});

test('publication preparation requires approved story, allowed editorial gate, and valid publication transition', () => {
  const approved = snapshot({
    storyStatus: CanonicalStoryStatus.APPROVED,
    publicationStatus: PublicationStatus.APPROVED,
  });
  const ok = assessEditorialControlAction(
    EditorialRole.EDITOR,
    EditorialControlAction.PREPARE_WEB_PUBLICATION,
    approved,
  );
  assert.equal(ok.allowed, true);

  const draft = assessEditorialControlAction(
    EditorialRole.EDITOR,
    EditorialControlAction.PREPARE_WEB_PUBLICATION,
    snapshot(),
  );
  assert.equal(draft.allowed, false);
  assert.ok(draft.reasons.includes('STORY_NOT_APPROVED'));
});
