import type { Request } from 'express';
import { EditorialRole } from '../../domain/editorial';
import type { OrganizationId } from '../../domain/common/types';

export interface AuthenticatedEditorialActor {
  readonly organizationId: OrganizationId;
  readonly actorId: string;
  readonly role: EditorialRole | null;
}

export interface EditorialIdentityResolver {
  resolve(request: Request): Promise<AuthenticatedEditorialActor | null>;
}

export const isEditorialRole = (value: unknown): value is EditorialRole =>
  typeof value === 'string' && Object.values(EditorialRole).includes(value as EditorialRole);

export const notConfiguredEditorialIdentityResolver: EditorialIdentityResolver = {
  async resolve(): Promise<AuthenticatedEditorialActor | null> {
    return null;
  },
};
