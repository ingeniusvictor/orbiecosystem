import type { ClimateLocale } from "./content/competition";

const siteUrl = "https://orbiecosystem.vercel.app";
const siteName = "ORBI Ecosystem SpA";
const socialImageStatus = "SOCIAL IMAGE PENDING APPROVAL";
const homeDescription =
  "ORBI Ecosystem SpA desarrolla soluciones de inteligencia artificial, software, automatización, educación técnica, energía solar, domótica, bienestar digital y experiencias interactivas desde Rancagua, Chile.";

export type SeoRouteMetadata = {
  lang: string;
  title: string;
  description: string;
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    type: "website";
    url: string;
    siteName: string;
    image?: string;
  };
  twitter: {
    card: "summary_large_image";
    title: string;
    description: string;
    image?: string;
  };
  alternates?: readonly { hreflang: string; href: string }[];
  structuredData: readonly Record<string, unknown>[];
  socialImageStatus: typeof socialImageStatus;
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: `${siteUrl}/`,
  foundingDate: "2026",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Rancagua",
    addressRegion: "Región de O’Higgins",
    addressCountry: "CL",
  },
  areaServed: ["Chile", "Latinoamérica"],
  knowsAbout: [
    "Inteligencia artificial",
    "Software",
    "Automatización",
    "Agentes IA",
    "Energía solar",
    "Domótica",
    "Educación técnica",
    "Contenido digital",
    "Experiencias interactivas",
  ],
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ORBI Ecosystem",
  url: `${siteUrl}/`,
  description: homeDescription,
  inLanguage: "es-CL",
  publisher: {
    "@type": "Organization",
    name: siteName,
    url: `${siteUrl}/`,
  },
};

const homeServiceCatalog = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Divisiones y capacidades de ORBI Ecosystem",
  description:
    "Portafolio de divisiones ORBI para software, IA, automatización, educación, energía solar, domótica, bienestar digital, gaming y radar tecnológico.",
  itemListElement: [
    "ORBI Development System",
    "ORBI Corporate System",
    "ORBI Academy",
    "ORBI Servicios Fotovoltaicos",
    "ORBI Automatización Inteligente",
    "ORBI Sleep Frequencies",
    "ORBI Game System",
    "ORBI Radar IA & Tecnología",
  ].map((name, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
  })),
};

const PVMetricsSoftwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ORBI PVMetrics IA",
  applicationCategory: "Renewable energy operational intelligence",
  description:
    "Explainable operational intelligence proposal for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.",
  publisher: {
    "@type": "Organization",
    name: siteName,
    url: `${siteUrl}/`,
  },
};

function createSocialMetadata({
  title,
  description,
  url,
}: {
  title: string;
  description: string;
  url: string;
}) {
  return {
    openGraph: {
      title,
      description,
      type: "website" as const,
      url,
      siteName,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

const climateDescription =
  "Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.";

const routeMetadata = {
  home: {
    lang: "es",
    title: "ORBI Ecosystem SpA | IA, Software, Automatización y Energía Solar",
    description: homeDescription,
    canonical: `${siteUrl}/`,
    ...createSocialMetadata({
      title: "ORBI Ecosystem SpA | IA, Software y Automatización",
      description: homeDescription,
      url: `${siteUrl}/`,
    }),
    structuredData: [organization, website, homeServiceCatalog],
    socialImageStatus,
  },
  climateRecovery: {
    es: {
      lang: "es",
      title: "ORBI PVMetrics IA | Climate Recovery Intelligence",
      description: climateDescription,
      canonical: `${siteUrl}/climate-recovery`,
      ...createSocialMetadata({
        title: "ORBI PVMetrics IA | Climate Recovery Intelligence",
        description: climateDescription,
        url: `${siteUrl}/climate-recovery`,
      }),
      alternates: [
        { hreflang: "es", href: `${siteUrl}/climate-recovery` },
        { hreflang: "en", href: `${siteUrl}/climate-recovery/en` },
        { hreflang: "x-default", href: `${siteUrl}/climate-recovery` },
      ],
      structuredData: [PVMetricsSoftwareApplication],
      socialImageStatus,
    },
    en: {
      lang: "en",
      title: "ORBI PVMetrics IA | Climate Recovery Intelligence",
      description: climateDescription,
      canonical: `${siteUrl}/climate-recovery/en`,
      ...createSocialMetadata({
        title: "ORBI PVMetrics IA | Climate Recovery Intelligence",
        description: climateDescription,
        url: `${siteUrl}/climate-recovery/en`,
      }),
      alternates: [
        { hreflang: "es", href: `${siteUrl}/climate-recovery` },
        { hreflang: "en", href: `${siteUrl}/climate-recovery/en` },
        { hreflang: "x-default", href: `${siteUrl}/climate-recovery` },
      ],
      structuredData: [PVMetricsSoftwareApplication],
      socialImageStatus,
    },
  },
  PVMetrics: {
    lang: "es",
    title: "ORBI PVMetrics IA | Technical Product Profile",
    description:
      "Ficha tecnica publica de ORBI PVMetrics IA para evaluacion tecnica, limites de IA y relacion con Climate Recovery Edition.",
    canonical: `${siteUrl}/projects/orbi-PVMetrics`,
    ...createSocialMetadata({
      title: "ORBI PVMetrics IA | Technical Product Profile",
      description:
        "Ficha tecnica publica de ORBI PVMetrics IA para evaluacion tecnica, limites de IA y relacion con Climate Recovery Edition.",
      url: `${siteUrl}/projects/orbi-PVMetrics`,
    }),
    structuredData: [
      {
        ...PVMetricsSoftwareApplication,
        description:
          "Public technical product profile for ORBI PVMetrics IA, AI boundaries and its relationship with Climate Recovery Edition.",
      },
    ],
    socialImageStatus,
  },
} as const satisfies {
  home: SeoRouteMetadata;
  climateRecovery: Record<ClimateLocale, SeoRouteMetadata>;
  PVMetrics: SeoRouteMetadata;
};

export function getSeoRouteMetadata(route: "home" | "PVMetrics"): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "climateRecovery", locale: ClimateLocale): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "home" | "climateRecovery" | "PVMetrics", locale: ClimateLocale = "es") {
  if (route === "climateRecovery") {
    return routeMetadata.climateRecovery[locale];
  }

  return routeMetadata[route];
}

export const seoPublicRoutes = [
  `${siteUrl}/`,
  `${siteUrl}/climate-recovery`,
  `${siteUrl}/climate-recovery/en`,
  `${siteUrl}/projects/orbi-PVMetrics`,
] as const;

export const seoSocialImageStatus = socialImageStatus;
