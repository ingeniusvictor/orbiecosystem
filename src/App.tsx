/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LoaderScreen from "./components/LoaderScreen";
import AtAGlance from "./components/AtAGlance";
import SeasonOneEcosystem from "./components/SeasonOneEcosystem";
import OrbiDivisionPresentations from "./components/OrbiDivisionPresentations";
import FotonPrimeSection from "./components/FotonPrimeSection";
import FotonCompanion from "./components/FotonCompanion";
import ProductGrid from "./components/ProductGrid";
import OrbiVideoSection from "./components/OrbiVideoSection";
import Differentiators from "./components/Differentiators";
import Roadmap from "./components/Roadmap";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import VideoModal from "./components/VideoModal";
import ClimateRecoveryLanding from "./components/ClimateRecoveryLanding";
import OrbiPVMetricsPage from "./components/projects/OrbiPVMetricsPage";
import type { ClimateLocale } from "./content/competition";
import { getSeoRouteMetadata, type SeoRouteMetadata } from "./seoMetadata";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";

function upsertManagedMeta(key: string, attributes: Record<string, string>) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[data-orbi-managed="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.dataset.orbiManaged = key;
    document.head.appendChild(meta);
  }

  Object.entries(attributes).forEach(([name, value]) => meta?.setAttribute(name, value));
}

function upsertManagedLink(key: string, attributes: Record<string, string>) {
  let link = document.querySelector<HTMLLinkElement>(`link[data-orbi-managed="${key}"]`);
  if (!link) {
    link = document.createElement("link");
    link.dataset.orbiManaged = key;
    document.head.appendChild(link);
  }

  Object.entries(attributes).forEach(([name, value]) => link?.setAttribute(name, value));
}

function upsertStructuredData(items: readonly Record<string, unknown>[] = []) {
  document.querySelectorAll<HTMLScriptElement>('script[data-orbi-managed^="json-ld-"]').forEach((script) => script.remove());

  items.forEach((item, index) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.orbiManaged = `json-ld-${index}`;
    script.text = JSON.stringify(item);
    document.head.appendChild(script);
  });
}

function applyRouteMetadata(metadata: SeoRouteMetadata) {
  document.documentElement.lang = metadata.lang;
  document.title = metadata.title;
  upsertManagedMeta("description", { name: "description", content: metadata.description });
  upsertManagedLink("canonical", { rel: "canonical", href: metadata.canonical });

  document.querySelectorAll<HTMLLinkElement>('link[data-orbi-managed^="alternate-"]').forEach((link) => link.remove());
  metadata.alternates?.forEach((alternate) => {
    upsertManagedLink(`alternate-${alternate.hreflang}`, {
      rel: "alternate",
      hreflang: alternate.hreflang,
      href: alternate.href,
    });
  });

  document.querySelectorAll<HTMLMetaElement>('meta[data-orbi-managed^="og-"], meta[data-orbi-managed^="twitter-"]').forEach((meta) => meta.remove());

  if (metadata.openGraph) {
    upsertManagedMeta("og-title", { property: "og:title", content: metadata.openGraph.title });
    upsertManagedMeta("og-description", { property: "og:description", content: metadata.openGraph.description });
    upsertManagedMeta("og-type", { property: "og:type", content: metadata.openGraph.type });
    upsertManagedMeta("og-url", { property: "og:url", content: metadata.openGraph.url });
    upsertManagedMeta("og-site-name", { property: "og:site_name", content: metadata.openGraph.siteName });
    if (metadata.openGraph.image) {
      upsertManagedMeta("og-image", { property: "og:image", content: metadata.openGraph.image });
    }
  }

  if (metadata.twitter) {
    upsertManagedMeta("twitter-card", { name: "twitter:card", content: metadata.twitter.card });
    upsertManagedMeta("twitter-title", { name: "twitter:title", content: metadata.twitter.title });
    upsertManagedMeta("twitter-description", { name: "twitter:description", content: metadata.twitter.description });
    if (metadata.twitter.image) {
      upsertManagedMeta("twitter-image", { name: "twitter:image", content: metadata.twitter.image });
    }
  }

  upsertStructuredData(metadata.structuredData);
}

export default function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
  const isClimateRecoverySpanishRoute = normalizedPath === "/climate-recovery";
  const isClimateRecoveryEnglishRoute = normalizedPath === "/climate-recovery/en";
  const isClimateRecoveryRoute = isClimateRecoverySpanishRoute || isClimateRecoveryEnglishRoute;
  const climateRecoveryLocale: ClimateLocale = isClimateRecoveryEnglishRoute ? "en" : "es";
  const isPVMetricsRoute = normalizedPath === "/projects/orbi-pvmetrics";
  const isHomeRoute = normalizedPath === "/";
  const shouldShowDevPanel = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);
  const [activeSection, setActiveSection] = useState("hero");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [initialComponentId, setInitialComponentId] = useState<string>("eco-general");
  const [isModalAdminMode, setIsModalAdminMode] = useState<boolean>(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  const handlePlayVideo = (compId: string = "eco-general") => {
    setInitialComponentId(compId);
    setIsModalAdminMode(false);
    setIsVideoModalOpen(true);
  };

  const handleOpenDevPanel = () => {
    setInitialComponentId("eco-general");
    setIsModalAdminMode(true);
    setIsVideoModalOpen(true);
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    }
  };

  const handleResetDivisionFilter = () => {
    // ProductGrid keeps this callback for its internal "all divisions" reset action.
  };

  useEffect(() => {
    if (!isHomeRoute || window.location.hash) {
      return;
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
  }, [isHomeRoute]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "ecosystem-season-one", "orbi-presentaciones", "orbi-en-video", "ecosistema-mirada", "ecosistema", "foton-prime", "proyectos", "roadmap"];
      const scrollPos = window.scrollY + 120;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isClimateRecoveryRoute) {
      applyRouteMetadata(getSeoRouteMetadata("climateRecovery", climateRecoveryLocale));
      return;
    }

    if (isPVMetricsRoute) {
      applyRouteMetadata(getSeoRouteMetadata("PVMetrics"));
      return;
    }

    applyRouteMetadata(getSeoRouteMetadata("home"));
  }, [climateRecoveryLocale, isClimateRecoveryRoute, isPVMetricsRoute]);

  if (isClimateRecoveryRoute) {
    return <ClimateRecoveryLanding locale={climateRecoveryLocale} />;
  }

  if (isPVMetricsRoute) {
    return <OrbiPVMetricsPage />;
  }

  return (
    <div id="orbi-root-canvas" className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-white antialiased">
      <LoaderScreen />

      <Header onNavigate={handleNavigate} activeSection={activeSection} onOpenDevPanel={shouldShowDevPanel ? handleOpenDevPanel : undefined} />

      <main className="relative">
        <div className="hidden xl:block fixed left-6 bottom-10 z-40 transform -rotate-90 origin-left select-none text-[9px] font-mono tracking-[0.3em] text-slate-600 leading-none">
          SYSTEM: ACTIVE // ORB-NET-GRID
        </div>
        <div className="hidden xl:block fixed right-6 bottom-10 z-40 transform rotate-90 origin-right select-none text-[9px] font-mono tracking-[0.3em] text-slate-600 leading-none">
          LATENCY: OPTIMAL // DIRECT_NEXUS
        </div>

        <HeroSection onNavigate={handleNavigate} onPlayVideo={handlePlayVideo} />

        <SeasonOneEcosystem onNavigate={handleNavigate} onPlayVideo={handlePlayVideo} />

        <OrbiDivisionPresentations />

        <OrbiVideoSection />

        <AtAGlance />

        <Differentiators />

        <FotonPrimeSection onPlayVideo={handlePlayVideo} />

        <ProductGrid 
          initialDivisionFilter="all" 
          onResetDivisionFilter={handleResetDivisionFilter}
        />

        <Roadmap />

        <FinalCTA onNavigate={handleNavigate} />
      </main>

      <FotonCompanion onNavigate={handleNavigate} onPlayVideo={handlePlayVideo} />

      <Footer onNavigate={handleNavigate} />

      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        initialComponentId={initialComponentId}
        isAdminMode={isModalAdminMode}
      />
    </div>
  );
}
