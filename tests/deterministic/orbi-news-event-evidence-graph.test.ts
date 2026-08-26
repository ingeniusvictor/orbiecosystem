import test from 'node:test';
import assert from 'node:assert/strict';

import { VerificationConfidence } from '../../domain/common/enums';
import {
  EventEvidenceStance,
  appendEventEvidence,
  buildEventEvidenceGraph,
  summarizeEventEvidenceGraph,
} from '../../domain/events';

const eventId = 'event-graph-1' as never;
const attachedAt = '2026-08-26T05:55:00.000Z' as never;

const node = (newsItemId: string, sourceKey: string) => ({
  newsItemId: newsItemId as never,
  sourceKey,
  confidence: VerificationConfidence.HIGH,
  attachedAt,
});

const edge = (newsItemId: string, stance: EventEvidenceStance, reason: string) => ({
  eventId,
  newsItemId: newsItemId as never,
  stance,
  reason,
});

test('evidence graph deduplicates duplicate news nodes and edges', () => {
  const graph = buildEventEvidenceGraph({
    eventId,
    nodes: [
      node('news-1', 'OpenAI'),
      node('news-1', ' openai '),
    ],
    edges: [
      edge('news-1', EventEvidenceStance.SUPPORTING, 'Official announcement'),
      edge('news-1', EventEvidenceStance.SUPPORTING, 'Official announcement'),
    ],
  });

  assert.equal(graph.nodes.length, 1);
  assert.equal(graph.edges.length, 1);
  assert.equal(graph.nodes[0]?.sourceKey, 'openai');
});

test('graph summary separates support contradiction and context', () => {
  const graph = buildEventEvidenceGraph({
    eventId,
    nodes: [
      node('news-1', 'openai'),
      node('news-2', 'reuters'),
      node('news-3', 'example-analysis'),
    ],
    edges: [
      edge('news-1', EventEvidenceStance.SUPPORTING, 'Primary source'),
      edge('news-2', EventEvidenceStance.CONTRADICTING, 'Conflicting report'),
      edge('news-3', EventEvidenceStance.CONTEXT, 'Background only'),
    ],
  });

  const summary = summarizeEventEvidenceGraph(graph);
  assert.equal(summary.totalEvidenceItems, 3);
  assert.equal(summary.supportingItems, 1);
  assert.equal(summary.contradictingItems, 1);
  assert.equal(summary.contextItems, 1);
  assert.equal(summary.hasContradiction, true);
});

test('multiple articles from same source do not inflate independent supporting sources', () => {
  const graph = buildEventEvidenceGraph({
    eventId,
    nodes: [
      node('news-1', 'Reuters'),
      node('news-2', 'reuters'),
      node('news-3', 'OpenAI'),
    ],
    edges: [
      edge('news-1', EventEvidenceStance.SUPPORTING, 'Report A'),
      edge('news-2', EventEvidenceStance.SUPPORTING, 'Report B'),
      edge('news-3', EventEvidenceStance.SUPPORTING, 'Official statement'),
    ],
  });

  const summary = summarizeEventEvidenceGraph(graph);
  assert.equal(summary.supportingItems, 3);
  assert.equal(summary.uniqueSupportingSources, 2);
  assert.equal(summary.uniqueSources, 2);
});

test('appendEventEvidence preserves previous graph and adds new evidence deterministically', () => {
  const initial = buildEventEvidenceGraph({
    eventId,
    nodes: [node('news-1', 'openai')],
    edges: [edge('news-1', EventEvidenceStance.SUPPORTING, 'Primary source')],
  });

  const updated = appendEventEvidence({
    graph: initial,
    nodes: [node('news-2', 'reuters')],
    edges: [edge('news-2', EventEvidenceStance.CONTEXT, 'Background')],
  });

  assert.equal(initial.nodes.length, 1);
  assert.equal(updated.nodes.length, 2);
  assert.equal(updated.edges.length, 2);
});

test('graph rejects edge to an unknown evidence node', () => {
  assert.throws(() => buildEventEvidenceGraph({
    eventId,
    nodes: [],
    edges: [edge('news-missing', EventEvidenceStance.SUPPORTING, 'Missing node')],
  }));
});

test('graph rejects evidence from a different event', () => {
  assert.throws(() => buildEventEvidenceGraph({
    eventId,
    nodes: [node('news-1', 'openai')],
    edges: [{
      eventId: 'other-event' as never,
      newsItemId: 'news-1' as never,
      stance: EventEvidenceStance.SUPPORTING,
      reason: 'Wrong event',
    }],
  }));
});
