import { useState, useEffect } from "react";
import { Menu, X, ArrowRight, Settings } from "lucide-react";

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
  onOpenDevPanel?: () => void;
}

export default function Header({ onNavigate, activeSection, onOpenDevPanel }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Explore", href: "ecosistema-mirada", type: "section" },
    { name: "Solutions", href: "ecosystem-season-one", type: "section" },
    { name: "Academy", href: "ecosistema-mirada", type: "section" },
    { name: "Innovation", href: "roadmap", type: "section" },
    { name: "News", href: "proyectos", type: "section" },
    { name: "Contact", href: "season-one-final-cta", type: "section" }
  ] as const;

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <header
      id="orbi-nav-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-cyan-500/10 bg-slate-950/84 py-3 shadow-2xl shadow-black/40 backdrop-blur-2xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto w-[min(1180px,calc(100vw-2rem))]">
        <div className={`flex items-center justify-between rounded-full border transition-all duration-300 ${
          isScrolled
            ? "border-white/10 bg-white/[0.03] px-3 py-2"
            : "border-transparent px-0 py-0"
        }`}>
          <button
            type="button"
            onClick={() => handleLinkClick("hero")}
            className="group flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            aria-label="Ir al inicio de ORBI Ecosystem"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/20 bg-slate-950/70 shadow-lg shadow-cyan-950/20">
              <img
                src="/assets/logo.jpeg"
                alt="ORBI Ecosystem Logo"
                className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(0,229,255,0.55)] transition-transform duration-300 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.classList.remove("hidden");
                    fallback.classList.add("flex");
                  }
                }}
                referrerPolicy="no-referrer"
              />
              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-emerald-500 p-[2px] transition-transform duration-300 group-hover:scale-110">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                  <span className="pl-[1px] text-[10px] font-extrabold tracking-widest text-white">Ø</span>
                </div>
              </div>
            </div>
            <div className="leading-none">
              <span className="block font-orbitron text-sm font-black tracking-[0.18em] text-white sm:text-base">
                ORBI
              </span>
              <span className="block pt-1 font-mono text-[8px] font-bold uppercase tracking-[0.34em] text-cyan-300/80 sm:text-[9px]">
                Ecosystem
              </span>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  activeSection === link.href
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {link.name}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {onOpenDevPanel && (
              <button
                onClick={() => {
                  onOpenDevPanel();
                  setIsOpen(false);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-slate-950/70 px-3.5 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300 transition-all duration-300 hover:border-cyan-400/60 hover:text-white"
                title="Consola de Control del Ecosistema Orbi"
              >
                <Settings className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-45" />
                <span>DEV</span>
              </button>
            )}
            <button
              onClick={() => handleLinkClick("ecosystem-season-one")}
              className="orbitron-primary-action !min-h-11 !px-5 !py-2.5 !text-[11px]"
            >
              <span>Explorar ORBI</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-full border border-white/10 bg-slate-950/70 p-2.5 text-slate-300 transition-colors hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              aria-label={isOpen ? "Cerrar menu principal" : "Abrir menu principal"}
              aria-expanded={isOpen}
              aria-controls="orbi-mobile-menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div id="orbi-mobile-menu" className="absolute left-0 right-0 top-full border-b border-cyan-500/10 bg-slate-950/96 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
          <div className="mx-auto w-[min(100vw-2rem,680px)] space-y-2 px-2 pb-6 pt-4">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleLinkClick(link.href)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.16em] transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  activeSection === link.href
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                    : "border-white/5 bg-white/[0.03] text-slate-300 hover:text-white"
                }`}
              >
                {link.name}
              </button>
            ))}
            {onOpenDevPanel && (
              <button
                onClick={() => {
                  onOpenDevPanel();
                  setIsOpen(false);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-500/20 bg-slate-900 py-3 font-mono text-xs font-black uppercase tracking-widest text-cyan-300"
              >
                <Settings className="h-4 w-4" />
                <span>MODO DESARROLLADOR</span>
              </button>
            )}
            <button
              onClick={() => handleLinkClick("ecosystem-season-one")}
              className="orbitron-primary-action mt-3 w-full"
            >
              <span>Explorar ORBI</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
