import type { OrganizationId } from '../../domain/common/types';
import {
  EditorialRole,
  buildEditorialQueue,
  filterEditorialQueue,
  type EditorialQueueBucket,
  type EditorialQueueItem,
  type EditorialQueueSource,
} from '../../domain/editorial';

export interface EditorialQueueReader {
  listQueueSources(organizationId: OrganizationId): Promise<readonly EditorialQueueSource[]>;
}

export interface EditorialQueueQuery {
  readonly organizationId: OrganizationId;
  readonly role: EditorialRole;
  readonly bucket?: EditorialQueueBucket | null;
}

export interface EditorialControlCenterReadService {
  listQueue(query: EditorialQueueQuery): Promise<readonly EditorialQueueItem[]>;
}

export const createEditorialControlCenterReadService = (
  reader: EditorialQueueReader,
): EditorialControlCenterReadService => ({
  async listQueue(query): Promise<readonly EditorialQueueItem[]> {
    const queue = buildEditorialQueue(
      query.role,
      await reader.listQueueSources(query.organizationId),
    );
    return filterEditorialQueue(queue, query.bucket ?? null);
  },
});

export const emptyEditorialQueueReader: EditorialQueueReader = {
  async listQueueSources(_organizationId: OrganizationId): Promise<readonly EditorialQueueSource[]> {
    return [];
  },
};
