import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AuditLogEntry } from '../../domain/audit/audit';
import type { CanonicalStoryId, OrganizationId } from '../../domain/common/types';
import type { EditorialQueueSource } from '../../domain/editorial';
import type { EditorialQueueReader } from './control-center-read-service';
import type {
  EditorialMutationCommit,
  EditorialMutationRecord,
  EditorialMutationUnitOfWork,
} from './mutation-command-service';

export interface EditorialPersistenceFileState {
  readonly schemaVersion: 1;
  readonly organizations: Readonly<Record<string, readonly EditorialQueueSource[]>>;
  readonly auditLog: readonly AuditLogEntry[];
}

export interface LocalEditorialPersistence
  extends EditorialQueueReader, EditorialMutationUnitOfWork {
  listAuditEntries(organizationId: OrganizationId): Promise<readonly AuditLogEntry[]>;
}

const EMPTY_STATE: EditorialPersistenceFileState = {
  schemaVersion: 1,
  organizations: {},
  auditLog: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isQueueSource = (value: unknown): value is EditorialQueueSource =>
  isRecord(value)
  && typeof value.storyId === 'string'
  && typeof value.revision === 'string'
  && value.revision.trim().length > 0
  && typeof value.headline === 'string'
  && typeof value.slug === 'string'
  && typeof value.updatedAt === 'string'
  && isRecord(value.snapshot);

const parseState = (raw: string): EditorialPersistenceFileState => {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !isRecord(parsed.organizations) || !Array.isArray(parsed.auditLog)) {
    throw new Error('EDITORIAL_LOCAL_STORE_INVALID_SCHEMA');
  }

  for (const sources of Object.values(parsed.organizations)) {
    if (!Array.isArray(sources) || !sources.every(isQueueSource)) {
      throw new Error('EDITORIAL_LOCAL_STORE_INVALID_QUEUE_SOURCE');
    }
  }

  return parsed as unknown as EditorialPersistenceFileState;
};

const applyPatch = (
  source: EditorialQueueSource,
  command: EditorialMutationCommit,
  revision: string,
): EditorialQueueSource => ({
  ...source,
  revision,
  updatedAt: command.auditEntry.occurredAt,
  snapshot: {
    ...source.snapshot,
    ...(command.patch.storyStatus ? { storyStatus: command.patch.storyStatus } : {}),
    ...(command.patch.publicationStatus ? { publicationStatus: command.patch.publicationStatus } : {}),
    ...(command.patch.isBreaking !== undefined ? { isBreaking: command.patch.isBreaking } : {}),
  },
});

export const createJsonEditorialPersistence = ({
  filePath,
}: {
  readonly filePath: string;
}): LocalEditorialPersistence => {
  let writeTail: Promise<void> = Promise.resolve();

  const readState = async (): Promise<EditorialPersistenceFileState> => {
    try {
      return parseState(await readFile(filePath, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return EMPTY_STATE;
      throw error;
    }
  };

  const writeStateAtomically = async (state: EditorialPersistenceFileState): Promise<void> => {
    await mkdir(dirname(filePath), { recursive: true });
    const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, filePath);
  };

  const withWriteLock = async <T>(operation: () => Promise<T>): Promise<T> => {
    const previous = writeTail;
    let release!: () => void;
    writeTail = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  };

  return {
    async listQueueSources(organizationId) {
      const state = await readState();
      return [...(state.organizations[organizationId] ?? [])];
    },

    async loadForMutation(organizationId, storyId): Promise<EditorialMutationRecord | null> {
      const state = await readState();
      const source = state.organizations[organizationId]?.find((candidate) => candidate.storyId === storyId);
      return source
        ? { storyId: source.storyId, revision: source.revision, snapshot: source.snapshot }
        : null;
    },

    async commitMutation(command) {
      try {
        return await withWriteLock(async () => {
          const state = await readState();
          const sources = [...(state.organizations[command.organizationId] ?? [])];
          const index = sources.findIndex((candidate) => candidate.storyId === command.storyId);
          if (index < 0) return { ok: false as const, code: 'COMMIT_FAILED' as const };
          if (sources[index].revision !== command.expectedRevision) {
            return { ok: false as const, code: 'REVISION_CONFLICT' as const };
          }

          const revision = `rev-${randomUUID()}`;
          sources[index] = applyPatch(sources[index], command, revision);

          const nextState: EditorialPersistenceFileState = {
            schemaVersion: 1,
            organizations: {
              ...state.organizations,
              [command.organizationId]: sources,
            },
            auditLog: [...state.auditLog, command.auditEntry],
          };

          await writeStateAtomically(nextState);
          return { ok: true as const, revision };
        });
      } catch {
        return { ok: false as const, code: 'COMMIT_FAILED' as const };
      }
    },

    async listAuditEntries(organizationId) {
      const state = await readState();
      return state.auditLog.filter((entry) => entry.organizationId === organizationId);
    },
  };
};
