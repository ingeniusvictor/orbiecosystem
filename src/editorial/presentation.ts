import {
  EditorialControlAction,
  EditorialQueueBucket,
  type EditorialActionAssessment,
} from '../../domain/editorial';

export const EDITORIAL_BUCKET_LABELS: Readonly<Record<EditorialQueueBucket, string>> = {
  [EditorialQueueBucket.NEEDS_REVIEW]: 'Requiere revisión',
  [EditorialQueueBucket.BLOCKED]: 'Bloqueado',
  [EditorialQueueBucket.APPROVED]: 'Aprobado',
  [EditorialQueueBucket.SCHEDULED]: 'Programado',
  [EditorialQueueBucket.PUBLISHING]: 'Publicando',
  [EditorialQueueBucket.PUBLISHED]: 'Publicado',
  [EditorialQueueBucket.FAILED]: 'Fallido',
  [EditorialQueueBucket.DRAFTING]: 'En preparación',
};

export const EDITORIAL_ACTION_LABELS: Readonly<Record<EditorialControlAction, string>> = {
  [EditorialControlAction.REQUEST_REVISION]: 'Solicitar revisión',
  [EditorialControlAction.APPROVE_STORY]: 'Aprobar historia',
  [EditorialControlAction.REJECT_STORY]: 'Rechazar historia',
  [EditorialControlAction.MARK_BREAKING]: 'Marcar Breaking',
  [EditorialControlAction.UNMARK_BREAKING]: 'Quitar Breaking',
  [EditorialControlAction.PREPARE_WEB_PUBLICATION]: 'Preparar publicación web',
  [EditorialControlAction.PUBLISH_WEB_NOW]: 'Publicar ahora',
};

export const getEditorialActionDisplayState = (
  assessment: EditorialActionAssessment,
): {
  label: string;
  domainAllowed: boolean;
  disabledReason: string;
} => ({
  label: EDITORIAL_ACTION_LABELS[assessment.action],
  domainAllowed: assessment.allowed,
  disabledReason: assessment.allowed
    ? 'EJECUCION_MUTABLE_NO_HABILITADA_EN_NA_08_9'
    : assessment.reasons.join(', '),
});

export const formatEditorialReason = (reason: string): string =>
  reason.replaceAll('_', ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
