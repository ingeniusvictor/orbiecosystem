import type { ClimateLocale } from "./content/competition";
import type { PublicNewsArticle } from "./news/types";

const siteUrl = "https://orbiecosystem.vercel.app";
const siteName = "ORBI Ecosystem SpA";
const socialImageStatus = "SOCIAL IMAGE PENDING APPROVAL";

export type SeoRouteMetadata = {
  lang: string;
  title: string;
  description: string;
  canonical: string;
  robots?: "index,follow" | "noindex,nofollow";
  openGraph: {
    title: string;
    description: string;
    type: "website" | "article";
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

const newsCollection = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "ORBI News",
  url: `${siteUrl}/news`,
  description:
    "Noticias verificadas sobre inteligencia artificial, tecnologia, energia, automatizacion, ciencia y futuro con foco practico.",
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
  image,
  type = "website",
}: {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: "website" | "article";
}) {
  return {
    openGraph: {
      title,
      description,
      type,
      url,
      siteName,
      ...(image ? { image } : {}),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(image ? { image } : {}),
    },
  };
}

const climateDescription =
  "Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.";

const newsDescription =
  "ORBI News explica inteligencia artificial, tecnologia, energia, automatizacion, ciencia y futuro a partir de historias verificadas y con utilidad practica.";

const editorialDescription =
  "Consola editorial privada de ORBI News para revisión operacional de historias, gates y autoridad de acciones.";

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
  news: {
    lang: "es",
    title: "ORBI News | Inteligencia y tecnologia verificadas",
    description: newsDescription,
    canonical: `${siteUrl}/news`,
    ...createSocialMetadata({
      title: "ORBI News | Inteligencia y tecnologia verificadas",
      description: newsDescription,
      url: `${siteUrl}/news`,
    }),
    structuredData: [newsCollection],
    socialImageStatus,
  },
  editorial: {
    lang: "es",
    title: "ORBI News Editorial Control Center",
    description: editorialDescription,
    canonical: `${siteUrl}/editorial`,
    robots: "noindex,nofollow",
    ...createSocialMetadata({
      title: "ORBI News Editorial Control Center",
      description: editorialDescription,
      url: `${siteUrl}/editorial`,
    }),
    structuredData: [],
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
  news: SeoRouteMetadata;
  editorial: SeoRouteMetadata;
  climateRecovery: Record<ClimateLocale, SeoRouteMetadata>;
  pbmetrics: SeoRouteMetadata;
};

export const buildNewsArticleSeoMetadata = (article: PublicNewsArticle): SeoRouteMetadata => {
  const canonical = `${siteUrl}/news/${article.slug}`;
  const title = `${article.headline} | ORBI News`;
  const category = article.category.replaceAll("_", " ");
  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.dek,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    articleSection: category,
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: `${siteUrl}/`,
    },
    ...(article.imageUrl ? { image: [article.imageUrl] } : {}),
  };

  return {
    lang: "es",
    title,
    description: article.dek,
    canonical,
    ...createSocialMetadata({
      title: article.headline,
      description: article.dek,
      url: canonical,
      image: article.imageUrl ?? undefined,
      type: "article",
    }),
    structuredData: [structuredData],
    socialImageStatus,
  };
};

export function getSeoRouteMetadata(route: "home" | "news" | "editorial" | "pbmetrics"): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "climateRecovery", locale: ClimateLocale): SeoRouteMetadata;
export function getSeoRouteMetadata(route: "home" | "news" | "editorial" | "climateRecovery" | "pbmetrics", locale: ClimateLocale = "es") {
  if (route === "climateRecovery") {
    return routeMetadata.climateRecovery[locale];
  }

  return routeMetadata[route];
}

export const seoPublicRoutes = [
  `${siteUrl}/`,
  `${siteUrl}/news`,
  `${siteUrl}/climate-recovery`,
  `${siteUrl}/climate-recovery/en`,
  `${siteUrl}/projects/orbi-pbmetrics`,
] as const;

export const seoSocialImageStatus = socialImageStatus;
