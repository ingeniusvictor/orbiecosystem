import { useState, useEffect } from "react";
import { Gamepad2, Briefcase, Code, Menu, X, ArrowRight, Settings } from "lucide-react";

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
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Ecosistema", href: "ecosistema", type: "section" },
    { name: "Foton Prime", href: "foton-prime", type: "section" },
    { name: "Divisiones", href: "divisiones", type: "section" },
    { name: "Proyectos", href: "proyectos", type: "section" },
    { name: "Roadmap", href: "roadmap", type: "section" },
    { name: "Climate Recovery", href: "/climate-recovery", type: "route" }
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
          ? "bg-slate-950/85 backdrop-blur-md border-b border-slate-800/60 py-3 shadow-lg shadow-black/30"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div 
            onClick={() => handleLinkClick("hero")}
            className="flex items-center space-x-3 cursor-pointer group select-none"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <img
                src="/assets/orbi/orbi-ecosystem-logo.png"
                alt="ORBI Ecosystem Logo"
                className="w-7 h-7 object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.5)] transition-transform duration-300 group-hover:scale-110"
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
              {/* Zero-pixelation vector circular fallback */}
              <div className="hidden w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 via-purple-600 to-emerald-500 p-[2px] shadow-lg shadow-purple-500/10 transition-transform duration-300 group-hover:scale-110 items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                  <span className="text-white font-extrabold text-[10px] tracking-widest pl-[1px]">Ø</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-white font-extrabold text-sm sm:text-md tracking-wider font-orbitron">
                ORBI <span className="text-energy-cyan font-light text-[10px] sm:text-xs tracking-[0.2em] pl-1 font-sans">ECOSYSTEM</span>
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) =>
              link.type === "route" ? (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-200 text-cyan-300 hover:text-white hover:bg-cyan-500/10 border border-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  {link.name}
                </a>
              ) : (
                <button
                  key={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    activeSection === link.href
                      ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/30 border border-transparent"
                  }`}
                >
                  {link.name}
                </button>
              )
            )}
          </nav>

          {/* Dev Mode Panel & Explorar CTA */}
          <div className="hidden lg:flex items-center">
            {onOpenDevPanel && (
              <button
                onClick={() => {
                  onOpenDevPanel();
                  setIsOpen(false);
                }}
                className="mr-3 p-2 px-3.5 bg-slate-900 hover:bg-slate-850 text-cyan-400 hover:text-[#00E5FF] border border-cyan-500/20 hover:border-cyan-500/60 rounded-full transition-all duration-300 cursor-pointer shadow-md hover:shadow-cyan-500/10 flex items-center gap-2 group text-xs font-mono tracking-widest font-extrabold uppercase select-none"
                title="Consola de Control del Ecosistema Orbi"
              >
                <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-500" />
                <span>DEV PANEL</span>
              </button>
            )}
            <button
              onClick={() => handleLinkClick("proyectos")}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-sm tracking-wide rounded-full shadow-lg shadow-blue-500/15 hover:shadow-blue-500/25 transition-all duration-300 flex items-center space-x-2 group cursor-pointer"
            >
              <span>Explorar ORBI</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/40 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
              aria-label="Abrir menú principal"
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-800/80 shadow-2xl backdrop-blur-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="px-4 pt-3 pb-6 space-y-2">
            {navLinks.map((link) =>
              link.type === "route" ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block w-full px-4 py-3 rounded-xl text-base font-medium tracking-wide transition-colors text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                >
                  {link.name}
                </a>
              ) : (
                <button
                  key={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                    activeSection === link.href
                      ? "text-blue-400 bg-blue-500/10 border-l-2 border-blue-500"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/30"
                  }`}
                >
                  {link.name}
                </button>
              )
            )}
            <div className="pt-4 px-2 space-y-2">
              {onOpenDevPanel && (
                <button
                  onClick={() => {
                    onOpenDevPanel();
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 bg-slate-900 border border-cyan-500/20 text-cyan-400 hover:text-white rounded-xl font-mono text-xs uppercase tracking-widest font-black flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>MODO DESARROLLADOR</span>
                </button>
              )}
              <button
                onClick={() => handleLinkClick("proyectos")}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center font-medium rounded-xl shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Explorar ORBI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
