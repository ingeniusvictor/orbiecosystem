import { ContentCategory, SourceCredibilityBand, SourceType } from '../../domain/common/enums';
import type { IsoUtcDateTime, OrganizationId, SourceId } from '../../domain/common/types';
import { NewsOrigin } from '../../domain/news/news-item';
import { SourceRegistryStatus, type SourceRegistryEntry, type SourceRegistryRepository } from '../../domain/discovery/source-registry';

export interface SourceRegistryEnvironment { readonly ORBI_NEWS_SOURCE_REGISTRY_JSON?: string; }

const enumValue = <T extends string>(label: string, value: unknown, allowed: readonly string[]): T => {
  if (typeof value !== 'string' || !allowed.includes(value)) throw new RangeError(`${label}_INVALID`);
  return value as T;
};
const stringValue = (label: string, value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) throw new RangeError(`${label}_REQUIRED`);
  return value.trim();
};
const stringArray = <T extends string>(label: string, value: unknown, allowed: readonly string[]): readonly T[] => {
  if (!Array.isArray(value) || value.length === 0) throw new RangeError(`${label}_REQUIRED`);
  return value.map((item) => enumValue<T>(label, item, allowed));
};

export const parseEnvironmentSourceRegistry = (environment: SourceRegistryEnvironment): readonly SourceRegistryEntry[] => {
  const raw = environment.ORBI_NEWS_SOURCE_REGISTRY_JSON?.trim();
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new RangeError('ORBI_NEWS_SOURCE_REGISTRY_JSON_INVALID'); }
  if (!Array.isArray(parsed)) throw new RangeError('ORBI_NEWS_SOURCE_REGISTRY_JSON_MUST_BE_ARRAY');
  const ids = new Set<string>();
  return parsed.map((candidate, index) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new RangeError(`SOURCE_REGISTRY_ENTRY_${index}_INVALID`);
    const item = candidate as Record<string, unknown>;
    const id = stringValue(`SOURCE_REGISTRY_ENTRY_${index}_ID`, item.id);
    if (ids.has(id)) throw new RangeError(`SOURCE_REGISTRY_DUPLICATE_ID_${id}`);
    ids.add(id);
    const homepageUrl = stringValue(`SOURCE_REGISTRY_ENTRY_${index}_HOMEPAGE_URL`, item.homepageUrl);
    const feedUrl = item.feedUrl == null ? null : stringValue(`SOURCE_REGISTRY_ENTRY_${index}_FEED_URL`, item.feedUrl);
    for (const url of [homepageUrl, feedUrl].filter(Boolean) as string[]) {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'https:') throw new RangeError(`SOURCE_REGISTRY_ENTRY_${index}_HTTPS_REQUIRED`);
    }
    return {
      id: id as SourceId,
      organizationId: stringValue(`SOURCE_REGISTRY_ENTRY_${index}_ORGANIZATION_ID`, item.organizationId) as OrganizationId,
      name: stringValue(`SOURCE_REGISTRY_ENTRY_${index}_NAME`, item.name),
      domain: stringValue(`SOURCE_REGISTRY_ENTRY_${index}_DOMAIN`, item.domain).toLowerCase(),
      homepageUrl,
      feedUrl,
      sourceType: enumValue<SourceType>(`SOURCE_REGISTRY_ENTRY_${index}_SOURCE_TYPE`, item.sourceType, Object.values(SourceType)),
      credibilityBand: enumValue<SourceCredibilityBand>(`SOURCE_REGISTRY_ENTRY_${index}_CREDIBILITY_BAND`, item.credibilityBand, Object.values(SourceCredibilityBand)),
      allowedOrigins: stringArray<NewsOrigin>(`SOURCE_REGISTRY_ENTRY_${index}_ALLOWED_ORIGINS`, item.allowedOrigins, Object.values(NewsOrigin)),
      categories: stringArray<ContentCategory>(`SOURCE_REGISTRY_ENTRY_${index}_CATEGORIES`, item.categories, Object.values(ContentCategory)),
      status: enumValue<SourceRegistryStatus>(`SOURCE_REGISTRY_ENTRY_${index}_STATUS`, item.status, Object.values(SourceRegistryStatus)),
      isPrimaryPreferred: item.isPrimaryPreferred === true,
      notes: typeof item.notes === 'string' ? item.notes : null,
      createdAt: stringValue(`SOURCE_REGISTRY_ENTRY_${index}_CREATED_AT`, item.createdAt) as IsoUtcDateTime,
      updatedAt: stringValue(`SOURCE_REGISTRY_ENTRY_${index}_UPDATED_AT`, item.updatedAt) as IsoUtcDateTime,
    };
  });
};

export const createInMemorySourceRegistry = (entries: readonly SourceRegistryEntry[]): SourceRegistryRepository => ({
  async findById(sourceId) { return entries.find((entry) => entry.id === sourceId) ?? null; },
  async findByDomain(domain) { return entries.find((entry) => entry.domain === domain.toLowerCase()) ?? null; },
  async listActive() { return entries.filter((entry) => entry.status === SourceRegistryStatus.ACTIVE); },
});
