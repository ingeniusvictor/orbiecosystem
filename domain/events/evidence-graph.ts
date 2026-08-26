import type { VerificationConfidence } from '../common/enums';
import type { EventId, IsoUtcDateTime, NewsItemId } from '../common/types';

export enum EventEvidenceStance {
  SUPPORTING = 'SUPPORTING',
  CONTRADICTING = 'CONTRADICTING',
  CONTEXT = 'CONTEXT',
}

export interface EventEvidenceNode {
  readonly newsItemId: NewsItemId;
  readonly sourceKey: string;
  readonly confidence: VerificationConfidence;
  readonly attachedAt: IsoUtcDateTime;
}

export interface EventEvidenceEdge {
  readonly eventId: EventId;
  readonly newsItemId: NewsItemId;
  readonly stance: EventEvidenceStance;
  readonly reason: string;
}

export interface EventEvidenceGraph {
  readonly eventId: EventId;
  readonly nodes: readonly EventEvidenceNode[];
  readonly edges: readonly EventEvidenceEdge[];
}

export interface EventEvidenceGraphSummary {
  readonly totalEvidenceItems: number;
  readonly uniqueSources: number;
  readonly supportingItems: number;
  readonly contradictingItems: number;
  readonly contextItems: number;
  readonly uniqueSupportingSources: number;
  readonly uniqueContradictingSources: number;
  readonly hasContradiction: boolean;
}

const normalizeSourceKey = (value: string): string => value.trim().toLowerCase();

const edgeKey = (edge: EventEvidenceEdge): string =>
  `${String(edge.eventId)}::${String(edge.newsItemId)}::${edge.stance}`;

export const buildEventEvidenceGraph = (input: {
  readonly eventId: EventId;
  readonly nodes: readonly EventEvidenceNode[];
  readonly edges: readonly EventEvidenceEdge[];
}): EventEvidenceGraph => {
  const nodeMap = new Map<string, EventEvidenceNode>();
  for (const node of input.nodes) {
    const sourceKey = normalizeSourceKey(node.sourceKey);
    if (!sourceKey) {
      throw new RangeError('Event evidence sourceKey cannot be empty.');
    }
    nodeMap.set(String(node.newsItemId), { ...node, sourceKey });
  }

  const edgeMap = new Map<string, EventEvidenceEdge>();
  for (const edge of input.edges) {
    if (edge.eventId !== input.eventId) {
      throw new RangeError('Event evidence edge eventId must match graph eventId.');
    }
    if (!nodeMap.has(String(edge.newsItemId))) {
      throw new RangeError('Event evidence edge must reference an existing evidence node.');
    }
    const reason = edge.reason.trim();
    if (!reason) {
      throw new RangeError('Event evidence edge reason cannot be empty.');
    }
    edgeMap.set(edgeKey(edge), { ...edge, reason });
  }

  return {
    eventId: input.eventId,
    nodes: [...nodeMap.values()].sort((a, b) =>
      String(a.newsItemId).localeCompare(String(b.newsItemId)),
    ),
    edges: [...edgeMap.values()].sort((a, b) => edgeKey(a).localeCompare(edgeKey(b))),
  };
};

export const summarizeEventEvidenceGraph = (
  graph: EventEvidenceGraph,
): EventEvidenceGraphSummary => {
  const nodeByNewsItem = new Map(
    graph.nodes.map((node) => [String(node.newsItemId), node]),
  );

  const byStance = (stance: EventEvidenceStance) =>
    graph.edges.filter((edge) => edge.stance === stance);

  const supporting = byStance(EventEvidenceStance.SUPPORTING);
  const contradicting = byStance(EventEvidenceStance.CONTRADICTING);
  const context = byStance(EventEvidenceStance.CONTEXT);

  const uniqueSourceCount = (edges: readonly EventEvidenceEdge[]) =>
    new Set(
      edges
        .map((edge) => nodeByNewsItem.get(String(edge.newsItemId))?.sourceKey)
        .filter((value): value is string => Boolean(value)),
    ).size;

  return {
    totalEvidenceItems: graph.nodes.length,
    uniqueSources: new Set(graph.nodes.map((node) => node.sourceKey)).size,
    supportingItems: supporting.length,
    contradictingItems: contradicting.length,
    contextItems: context.length,
    uniqueSupportingSources: uniqueSourceCount(supporting),
    uniqueContradictingSources: uniqueSourceCount(contradicting),
    hasContradiction: contradicting.length > 0,
  };
};

export const appendEventEvidence = (input: {
  readonly graph: EventEvidenceGraph;
  readonly nodes: readonly EventEvidenceNode[];
  readonly edges: readonly EventEvidenceEdge[];
}): EventEvidenceGraph =>
  buildEventEvidenceGraph({
    eventId: input.graph.eventId,
    nodes: [...input.graph.nodes, ...input.nodes],
    edges: [...input.graph.edges, ...input.edges],
  });
