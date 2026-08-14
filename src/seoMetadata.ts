import type { ClimateLocale } from "./content/competition";

const siteUrl = "https://orbiecosystem.vercel.app";
const siteName = "ORBI Ecosystem SpA";
const socialImageStatus = "SOCIAL IMAGE PENDING APPROVAL";

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
    addressCountry: "CL",
  },
};

const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ORBI Ecosystem",
  url: `${siteUrl}/`,
  publisher: {
    "@type": "Organization",
    name: siteName,
    url: `${siteUrl}/`,
  },
};

const pbmetricsSoftwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ORBI PBMetrics IA",
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
    title: siteName,
    description:
      "ORBI Ecosystem SpA desarrolla software, inteligencia artificial y experiencias digitales desde Rancagua, Chile.",
    canonical: `${siteUrl}/`,
    ...createSocialMetadata({
      title: siteName,
      description:
        "ORBI Ecosystem SpA desarrolla software, inteligencia artificial y experiencias digitales desde Rancagua, Chile.",
      url: `${siteUrl}/`,
    }),
    structuredData: [organization, website],
    socialImageStatus,
  },
  climateRecovery: {
    es: {
      lang: "es",
      title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
      description: climateDescription,
      canonical: `${siteUrl}/climate-recovery`,
      ...createSocialMetadata({
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description: climateDescription,
        url: `${siteUrl}/climate-recovery`,
      }),
      alternates: [
        { hreflang: "es", href: `${siteUrl}/climate-recovery` },
        { hreflang: "en", href: `${siteUrl}/climate-recovery/en` },
        { hreflang: "x-default", href: `${siteUrl}/climate-recovery` },
      ],
      structuredData: [pbmetricsSoftwareApplication],
      socialImageStatus,
    },
    en: {
      lang: "en",
      title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
      description: climateDescription,
      canonical: `${siteUrl}/climate-recovery/en`,
      ...createSocialMetadata({
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description: climateDescription,
        url: `${siteUrl}/climate-recovery/en`,
      }),
      alternates: [
        { hreflang: "es", href: `${siteUrl}/climate-recovery` },
        { hreflang: "en", href: `${siteUrl}/climate-recovery/en` },
        { hreflang: "x-default", href: `${siteUrl}/climate-recovery` },
      ],
      structuredData: [pbmetricsSoftwareApplication],
      socialImageStatus,
    },
  },
  pbmetrics: {
    lang: "es",
    title: "ORBI PBMetrics IA | Technical Product Profile",
    description:
      "Ficha tecnica publica de ORBI PBMetrics IA para evaluacion tecnica, limites de IA y relacion con Climate Recovery Edition.",
    canonical: `${siteUrl}/projects/orbi-pbmetrics`,
    ...createSocialMetadata({
      title: "ORBI PBMetrics IA | Technical Product Profile",
      description:
        "Ficha tecnica publica de ORBI PBMetrics IA para evaluacion tecnica, limites de IA y relacion con Climate Recovery Edition.",
      url: `${siteUrl}/projects/orbi-pbmetrics`,
    }),
    structuredData: [
      {
        ...pbmetricsSoftwareApplication,
        description:
          "Public technical product profile for ORBI PBMetrics IA, AI boundaries and its relationship with Climate Recovery Edition.",
      },
    ],
    socialImageStatus,
  },
} as const satisfies {
  home: SeoRouteMetadata;
  climateRecovery: Record<ClimateLocale, SeoRouteMetadata>;
  pbmetrics: SeoRouteMetadata;
};

export function getSeoRouteMetadata(route: "home" | "pbmetrics"): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "climateRecovery", locale: ClimateLocale): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "home" | "climateRecovery" | "pbmetrics", locale: ClimateLocale = "es") {
  if (route === "climateRecovery") {
    return routeMetadata.climateRecovery[locale];
  }

  return routeMetadata[route];
}

export const seoPublicRoutes = [
  `${siteUrl}/`,
  `${siteUrl}/climate-recovery`,
  `${siteUrl}/climate-recovery/en`,
  `${siteUrl}/projects/orbi-pbmetrics`,
] as const;

export const seoSocialImageStatus = socialImageStatus;
