import { OperationalAction } from '../../domain/operations/operational-authority';
import type { AutonomousOperationHandler, AutonomousOperationHandlerContext } from './autonomous-execution-orchestrator';

export type ProductionActionHandler = (context: AutonomousOperationHandlerContext) => Promise<void>;

export type ProductionHandlerRegistry = Readonly<Partial<Record<OperationalAction, ProductionActionHandler>>>;

/**
 * Dispatches only to explicitly registered action handlers.
 * Missing handlers fail closed and never simulate success.
 */
export const createProductionOperationHandler = (
  registry: ProductionHandlerRegistry,
): AutonomousOperationHandler => async (context) => {
  const handler = registry[context.action];
  if (!handler) throw new Error(`OPERATION_HANDLER_${context.action}_NOT_CONFIGURED`);
  await handler(context);
};

export const listConfiguredProductionActions = (
  registry: ProductionHandlerRegistry,
): readonly OperationalAction[] => Object.values(OperationalAction)
  .filter((action) => typeof registry[action] === 'function');
