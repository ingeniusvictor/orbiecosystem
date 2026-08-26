import { SourceCredibilityBand } from '../common/enums';

export enum EventChangeSignalType {
  STATUS_CHANGE = 'STATUS_CHANGE',
  CONFIRMED_DATE_CHANGE = 'CONFIRMED_DATE_CHANGE',
  PRICE_CHANGE = 'PRICE_CHANGE',
  REGULATORY_DECISION = 'REGULATORY_DECISION',
  INCIDENT_RECOVERY = 'INCIDENT_RECOVERY',
  OFFICIAL_CORRECTION = 'OFFICIAL_CORRECTION',
  OFFICIAL_DENIAL = 'OFFICIAL_DENIAL',
  FACTUAL_CONTRADICTION = 'FACTUAL_CONTRADICTION',
  NEW_CONTEXT = 'NEW_CONTEXT',
}

export interface EventChangeSignal {
  readonly type: EventChangeSignalType;
  readonly sourceCredibilityBand: SourceCredibilityBand;
  readonly note?: string | null;
}

export enum EventChangeClassification {
  NO_MATERIAL_CHANGE = 'NO_MATERIAL_CHANGE',
  MATERIAL_UPDATE = 'MATERIAL_UPDATE',
  CONTRADICTION = 'CONTRADICTION',
  REQUIRE_HUMAN_REVIEW = 'REQUIRE_HUMAN_REVIEW',
}

export interface EventChangeAssessment {
  readonly classification: EventChangeClassification;
  readonly materialSignals: readonly EventChangeSignalType[];
  readonly contradictionSignals: readonly EventChangeSignalType[];
  readonly reasons: readonly string[];
}

const MATERIAL_UPDATE_SIGNALS = new Set<EventChangeSignalType>([
  EventChangeSignalType.STATUS_CHANGE,
  EventChangeSignalType.CONFIRMED_DATE_CHANGE,
  EventChangeSignalType.PRICE_CHANGE,
  EventChangeSignalType.REGULATORY_DECISION,
  EventChangeSignalType.INCIDENT_RECOVERY,
  EventChangeSignalType.OFFICIAL_CORRECTION,
]);

const CONTRADICTION_SIGNALS = new Set<EventChangeSignalType>([
  EventChangeSignalType.OFFICIAL_DENIAL,
  EventChangeSignalType.FACTUAL_CONTRADICTION,
]);

export const assessEventChange = (
  signals: readonly EventChangeSignal[],
): EventChangeAssessment => {
  const unique = [...new Map(signals.map((signal) => [signal.type, signal])).values()];
  const materialSignals = unique
    .filter((signal) => MATERIAL_UPDATE_SIGNALS.has(signal.type))
    .map((signal) => signal.type);
  const contradictionSignals = unique
    .filter((signal) => CONTRADICTION_SIGNALS.has(signal.type))
    .map((signal) => signal.type);

  const hasAuthoritativeContradiction = unique.some(
    (signal) =>
      CONTRADICTION_SIGNALS.has(signal.type) &&
      signal.sourceCredibilityBand === SourceCredibilityBand.AUTHORITATIVE,
  );

  if (hasAuthoritativeContradiction) {
    return {
      classification: EventChangeClassification.CONTRADICTION,
      materialSignals,
      contradictionSignals,
      reasons: ['AUTHORITATIVE_EVENT_CONTRADICTION'],
    };
  }

  if (contradictionSignals.length > 0 && materialSignals.length > 0) {
    return {
      classification: EventChangeClassification.REQUIRE_HUMAN_REVIEW,
      materialSignals,
      contradictionSignals,
      reasons: ['MIXED_UPDATE_AND_CONTRADICTION_SIGNALS'],
    };
  }

  if (contradictionSignals.length > 0) {
    return {
      classification: EventChangeClassification.REQUIRE_HUMAN_REVIEW,
      materialSignals,
      contradictionSignals,
      reasons: ['NON_AUTHORITATIVE_CONTRADICTION_REQUIRES_REVIEW'],
    };
  }

  if (materialSignals.length > 0) {
    return {
      classification: EventChangeClassification.MATERIAL_UPDATE,
      materialSignals,
      contradictionSignals,
      reasons: ['MATERIAL_EVENT_CHANGE_DETECTED'],
    };
  }

  return {
    classification: EventChangeClassification.NO_MATERIAL_CHANGE,
    materialSignals,
    contradictionSignals,
    reasons: ['NO_MATERIAL_EVENT_CHANGE'],
  };
};
