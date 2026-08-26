import { ContentCategory } from '../common/enums';

export interface OrbiNewsVisualProfile {
  readonly id: 'ORBI_NEWS_VISUAL_PROFILE_V1';
  readonly aspectRatio: '16:9';
  readonly styleDirectives: readonly string[];
  readonly mandatoryConstraints: readonly string[];
}

export interface CategoryVisualProfile {
  readonly category: ContentCategory;
  readonly subjectDirection: string;
  readonly atmosphere: string;
  readonly compositionHint: string;
}

export const ORBI_NEWS_VISUAL_PROFILE: OrbiNewsVisualProfile = {
  id: 'ORBI_NEWS_VISUAL_PROFILE_V1',
  aspectRatio: '16:9',
  styleDirectives: [
    'premium technology editorial aesthetic',
    'clean composition with cinematic depth',
    'event-related subject with restrained visual storytelling',
    'discreet ORBI News branding space',
    'controlled headline-safe negative space',
    'minimal text and no sensationalist visual language',
  ],
  mandatoryConstraints: [
    'do not fabricate documentary evidence',
    'do not imply an AI-generated scene is a real photograph of the event',
    'do not invent logos, quotes, people, locations, metrics, products, or interfaces as factual evidence',
    'preserve a professional educational ORBI News identity',
  ],
};

export const CATEGORY_VISUAL_PROFILES: Readonly<Record<ContentCategory, CategoryVisualProfile>> = {
  [ContentCategory.AI]: {
    category: ContentCategory.AI,
    subjectDirection: 'abstract intelligence systems, models, compute or human-machine interaction',
    atmosphere: 'advanced, precise and forward-looking',
    compositionHint: 'layered digital depth with a clear central technical subject',
  },
  [ContentCategory.TECH]: {
    category: ContentCategory.TECH,
    subjectDirection: 'modern technology systems and real-world digital infrastructure',
    atmosphere: 'premium, contemporary and practical',
    compositionHint: 'clean product-or-system editorial composition',
  },
  [ContentCategory.SOLAR]: {
    category: ContentCategory.SOLAR,
    subjectDirection: 'photovoltaic generation, modules, inverters or solar operations',
    atmosphere: 'clean energy, engineering and daylight realism',
    compositionHint: 'solar infrastructure with technical clarity and restrained cinematic scale',
  },
  [ContentCategory.ENERGY]: {
    category: ContentCategory.ENERGY,
    subjectDirection: 'power systems, storage, grids and energy infrastructure',
    atmosphere: 'industrial, reliable and transition-focused',
    compositionHint: 'infrastructure-led scene with visible energy-system relationships',
  },
  [ContentCategory.ROBOTICS]: {
    category: ContentCategory.ROBOTICS,
    subjectDirection: 'robots, automation hardware and embodied intelligence',
    atmosphere: 'mechanical precision and practical innovation',
    compositionHint: 'clear machine subject with readable human-scale context',
  },
  [ContentCategory.AUTOMATION]: {
    category: ContentCategory.AUTOMATION,
    subjectDirection: 'industrial, home or software automation workflows',
    atmosphere: 'efficient, connected and operational',
    compositionHint: 'visible process relationships rather than decorative circuitry',
  },
  [ContentCategory.CYBERSECURITY]: {
    category: ContentCategory.CYBERSECURITY,
    subjectDirection: 'defensive security systems, networks and trust boundaries',
    atmosphere: 'controlled tension without fear-based sensationalism',
    compositionHint: 'defensive architecture and system boundaries, avoiding hacker stereotypes',
  },
  [ContentCategory.SOFTWARE]: {
    category: ContentCategory.SOFTWARE,
    subjectDirection: 'software architecture, interfaces and development systems',
    atmosphere: 'structured, modern and legible',
    compositionHint: 'interface or architecture-inspired composition without fabricated product screenshots',
  },
  [ContentCategory.HARDWARE]: {
    category: ContentCategory.HARDWARE,
    subjectDirection: 'chips, devices, servers and physical computing systems',
    atmosphere: 'tactile engineering precision',
    compositionHint: 'macro-to-system composition with realistic material cues',
  },
  [ContentCategory.SCIENCE]: {
    category: ContentCategory.SCIENCE,
    subjectDirection: 'scientific instruments, research concepts and observable phenomena',
    atmosphere: 'rigorous, exploratory and non-sensational',
    compositionHint: 'research-inspired visualization clearly separated from documentary evidence',
  },
  [ContentCategory.STARTUPS]: {
    category: ContentCategory.STARTUPS,
    subjectDirection: 'technology venture building, teams, products and market creation',
    atmosphere: 'ambitious but credible',
    compositionHint: 'business-and-technology editorial scene without invented customer traction',
  },
  [ContentCategory.SPACE]: {
    category: ContentCategory.SPACE,
    subjectDirection: 'space systems, satellites, launch infrastructure and planetary science',
    atmosphere: 'expansive, technical and scientifically grounded',
    compositionHint: 'large-scale spatial depth with explicit illustrative framing when generated',
  },
  [ContentCategory.FUTURE_TECH]: {
    category: ContentCategory.FUTURE_TECH,
    subjectDirection: 'emerging technologies and plausible future systems',
    atmosphere: 'speculative but disciplined',
    compositionHint: 'conceptual future visualization that cannot be mistaken for a deployed real system',
  },
};

export const getCategoryVisualProfile = (category: ContentCategory): CategoryVisualProfile =>
  CATEGORY_VISUAL_PROFILES[category];
