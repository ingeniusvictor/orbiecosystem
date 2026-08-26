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
  disabledReason: string | null;
  requiresStrongConfirmation: boolean;
} => ({
  label: EDITORIAL_ACTION_LABELS[assessment.action],
  domainAllowed: assessment.allowed,
  disabledReason: assessment.allowed ? null : assessment.reasons.join(', '),
  requiresStrongConfirmation: assessment.action === EditorialControlAction.PUBLISH_WEB_NOW,
});

export const buildEditorialActionConfirmation = (
  action: EditorialControlAction,
  headline: string,
): string => {
  const label = EDITORIAL_ACTION_LABELS[action];
  return action === EditorialControlAction.PUBLISH_WEB_NOW
    ? `Confirmación reforzada: ¿Publicar ahora "${headline}"? El servidor volverá a validar rol, estado, gates y revisión antes de iniciar la publicación.`
    : `¿Confirmas "${label}" para "${headline}"? El servidor volverá a validar toda la autoridad editorial antes de guardar cambios.`;
};

export const formatEditorialReason = (reason: string): string =>
  reason.replaceAll('_', ' ').toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
