/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import LoaderScreen from "./components/LoaderScreen";
import AtAGlance from "./components/AtAGlance";
import FotonPrimeSection from "./components/FotonPrimeSection";
import DivisionCards from "./components/DivisionCards";
import ProductGrid from "./components/ProductGrid";
import Differentiators from "./components/Differentiators";
import Roadmap from "./components/Roadmap";
import FinalCTA from "./components/FinalCTA";
import Footer from "./components/Footer";
import VideoModal from "./components/VideoModal";
import ClimateRecoveryLanding from "./components/ClimateRecoveryLanding";
import OrbiPBMetricsPage from "./components/projects/OrbiPBMetricsPage";

export default function App() {
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
  const isClimateRecoveryRoute = normalizedPath === "/climate-recovery";
  const isPBMetricsRoute = normalizedPath === "/projects/orbi-pbmetrics";
  const [activeSection, setActiveSection] = useState("hero");
  const [initialDivisionFilter, setInitialDivisionFilter] = useState<"all" | "games" | "corporate" | "development">("all");
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [initialComponentId, setInitialComponentId] = useState<string>("eco-general");
  const [isModalAdminMode, setIsModalAdminMode] = useState<boolean>(false);

  // Standard client watcher video trigger
  const handlePlayVideo = (compId: string = "eco-general") => {
    setInitialComponentId(compId);
    setIsModalAdminMode(false); // Spectator view
    setIsVideoModalOpen(true);
  };

  // Dedicated admin developer console trigger
  const handleOpenDevPanel = () => {
    setInitialComponentId("eco-general");
    setIsModalAdminMode(true); // Full developer control panel view
    setIsVideoModalOpen(true);
  };

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80; // height of fixed header approx
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const handleSelectDivisionFromCard = (divisionId: "games" | "corporate" | "development") => {
    // Select division filter and navigate
    setInitialDivisionFilter(divisionId);
  };

  const handleResetDivisionFilter = () => {
    setInitialDivisionFilter("all");
  };

  // Scroll active section tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["hero", "ecosistema-mirada", "ecosistema", "foton-prime", "divisiones", "proyectos", "roadmap"];
      const scrollPos = window.scrollY + 120; // adding threshold buffer

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

  if (isClimateRecoveryRoute) {
    return <ClimateRecoveryLanding />;
  }

  if (isPBMetricsRoute) {
    return <OrbiPBMetricsPage />;
  }

  return (
    <div id="orbi-root-canvas" className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-white antialiased">
      {/* Premium Loader Overlay */}
      <LoaderScreen />

      {/* Header navbar */}
      <Header onNavigate={handleNavigate} activeSection={activeSection} onOpenDevPanel={handleOpenDevPanel} />

      {/* Main Page Blocks wrapper */}
      <main className="relative">
        {/* Decorative corner indicator labels */}
        <div className="hidden xl:block fixed left-6 bottom-10 z-40 transform -rotate-90 origin-left select-none text-[9px] font-mono tracking-[0.3em] text-slate-600 leading-none">
          SYSTEM: ACTIVE // ORB-NET-GRID
        </div>
        <div className="hidden xl:block fixed right-6 bottom-10 z-40 transform rotate-90 origin-right select-none text-[9px] font-mono tracking-[0.3em] text-slate-600 leading-none">
          LATENCY: OPTIMAL // DIRECT_NEXUS
        </div>

        {/* Hero Section */}
        <HeroSection onNavigate={handleNavigate} onPlayVideo={handlePlayVideo} />

        {/* Orbi Ecosystem en una mirada */}
        <AtAGlance />

        {/* What is Orbi / Differentiators section */}
        <Differentiators />

        {/* Orbi Foton Prime - Invisible AI mother core with real chatbot */}
        <FotonPrimeSection onPlayVideo={handlePlayVideo} />

        {/* 3 Divisions cards */}
        <DivisionCards onSelectDivision={handleSelectDivisionFromCard} onPlayVideo={handlePlayVideo} />

        {/* Dynamic products catalogs */}
        <ProductGrid 
          initialDivisionFilter={initialDivisionFilter} 
          onResetDivisionFilter={handleResetDivisionFilter} 
          onPlayVideo={handlePlayVideo}
        />

        {/* Development Roadmap schedule */}
        <Roadmap />

        {/* Final Interactive CTA Banner */}
        <FinalCTA onNavigate={handleNavigate} />
      </main>

      {/* Footer legal & navigation coordinates */}
      <Footer onNavigate={handleNavigate} />

      {/* Unified ecosystem video presentation controller */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        initialComponentId={initialComponentId}
        isAdminMode={isModalAdminMode}
      />
    </div>
  );
}
