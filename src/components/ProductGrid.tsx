import React, { useState, useMemo, useEffect } from "react";
import { PRODUCTS } from "../data";
import { Product } from "../types";
import { Search, Filter, ArrowRight, X, Compass, Tag, Cpu, Info, CheckCircle, Play, ExternalLink, Leaf, ShieldCheck } from "lucide-react";
import { competitionContent } from "../content/competition";

interface ProductGridProps {
  initialDivisionFilter: "all" | "games" | "corporate" | "development";
  onResetDivisionFilter: () => void;
  onPlayVideo?: (compId: string) => void;
}

export default function ProductGrid({ initialDivisionFilter, onResetDivisionFilter, onPlayVideo }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<"all" | "games" | "corporate" | "development">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sync external filters
  useEffect(() => {
    if (initialDivisionFilter !== "all") {
      setDivisionFilter(initialDivisionFilter);
      // Wait for 100ms then scroll to proyectos section
      setTimeout(() => {
        const element = document.getElementById("proyectos");
        if (element) {
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
      }, 100);
      onResetDivisionFilter();
    }
  }, [initialDivisionFilter]);

  // Get unique statuses for dropdown
  const statusOptions = useMemo(() => {
    const statuses = new Set(PRODUCTS.map((p) => p.status));
    return ["all", ...Array.from(statuses)];
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // Division filter
      if (divisionFilter !== "all" && product.division !== divisionFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesTags = product.tags.some((t) => t.toLowerCase().includes(query));
        return matchesName || matchesCategory || matchesDesc || matchesTags;
      }
      return true;
    });
  }, [searchTerm, divisionFilter, statusFilter]);

  const getDivisionTheme = (division: "games" | "corporate" | "development") => {
    switch (division) {
      case "games":
        return {
          badge: "bg-blue-500/10 text-blue-400 border-blue-500/25",
          glassCard: "glass-panel-glow-blue hover:shadow-blue-500/5",
          orbGradient: "from-blue-500 via-sky-400 to-transparent",
          orbShadow: "shadow-blue-500/30",
          textAccent: "text-blue-400",
          borderHover: "hover:border-blue-500/40"
        };
      case "corporate":
        return {
          badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
          glassCard: "glass-panel-glow-green hover:shadow-emerald-500/5",
          orbGradient: "from-emerald-500 via-teal-400 to-transparent",
          orbShadow: "shadow-emerald-500/30",
          textAccent: "text-emerald-400",
          borderHover: "hover:border-emerald-500/40"
        };
      case "development":
        return {
          badge: "bg-purple-500/10 text-purple-400 border-purple-500/25",
          glassCard: "glass-panel-glow-purple hover:shadow-purple-500/5",
          orbGradient: "from-purple-500 via-fuchsia-400 to-transparent",
          orbShadow: "shadow-purple-500/30",
          textAccent: "text-purple-400",
          borderHover: "hover:border-purple-500/40"
        };
    }
  };

  const getStatusStyles = (status: Product["status"]) => {
    switch (status) {
      case "Android funcional":
      case "Estable":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "En expansión":
      case "En desarrollo":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "Prototipo":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Concepto avanzado":
      case "Concepto en expansión":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <section id="proyectos" className="py-24 bg-[#050816] border-t border-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 select-none">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold text-energy-cyan tracking-wider">
              <span>CATÁLOGO INTUITIVO // ORB-CAT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-space">
              Módulos del Ecosistema ORBI
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              Explora e interactúa en tiempo real con las soluciones corporativas, videojuegos experimentales e infraestructura modular.
            </p>
          </div>

          <div className="text-xs font-mono text-slate-500 bg-slate-950 px-4 py-2 rounded-xl border border-slate-900">
            SOLUCIONES OPERATIVAS: <span className="text-white font-bold">{filteredProducts.length}</span>
          </div>
        </div>

        <article className="mb-10 glass-panel border border-cyan-500/20 rounded-2xl p-5 md:p-6 shadow-2xl glass-panel-glow-blue relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-500/20 via-purple-400/70 to-cyan-500/20" aria-hidden="true" />
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
                  <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
                  Climate Recovery
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-400/25 bg-purple-400/10 px-3 py-1 font-mono text-[10px] font-black uppercase tracking-widest text-purple-300">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {competitionContent.product.statusLabel}
                </span>
              </div>
              <div>
                <h3 className="font-space text-2xl font-extrabold leading-tight text-white">{competitionContent.home.featuredCard}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{competitionContent.home.subtext}</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href="/climate-recovery"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-400/30 bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg shadow-cyan-500/15 transition hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                {competitionContent.home.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="/projects/orbi-pbmetrics"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-slate-200 transition hover:border-purple-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Ficha PBMetrics
              </a>
            </div>
          </div>
        </article>

        {/* Filter and Search Bar Panel */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 md:p-6 mb-10 space-y-4 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                id="product-search"
                aria-label="Buscar modulos del ecosistema ORBI"
                type="text"
                placeholder="Buscar por nombre, categoría, etiquetas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#0B1026]/75 border border-slate-800/80 focus:outline-none focus:border-energy-cyan text-slate-100 placeholder-slate-500 rounded-xl text-xs transition-all shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  aria-label="Limpiar busqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Division Selector Filter */}
            <div className="md:col-span-4 flex flex-wrap gap-1.5 justify-start md:justify-center">
              <button
                type="button"
                onClick={() => setDivisionFilter("all")}
                aria-pressed={divisionFilter === "all"}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                  divisionFilter === "all"
                    ? "bg-slate-800 border-slate-700 text-white shadow-md font-black"
                    : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setDivisionFilter("corporate")}
                aria-pressed={divisionFilter === "corporate"}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                  divisionFilter === "corporate"
                    ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400 shadow-md font-black"
                    : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800"
                }`}
              >
                Corporate
              </button>
              <button
                type="button"
                onClick={() => setDivisionFilter("games")}
                aria-pressed={divisionFilter === "games"}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                  divisionFilter === "games"
                    ? "bg-blue-950/60 border-blue-800/80 text-blue-400 shadow-md font-black"
                    : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800"
                }`}
              >
                Games
              </button>
              <button
                type="button"
                onClick={() => setDivisionFilter("development")}
                aria-pressed={divisionFilter === "development"}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer ${
                  divisionFilter === "development"
                    ? "bg-purple-950/60 border-purple-800/80 text-purple-400 shadow-md font-black"
                    : "bg-slate-900/60 border-slate-850 text-slate-400 hover:text-white hover:border-slate-800"
                }`}
              >
                Dev
              </button>
            </div>

            {/* Status Dropdown selector */}
            <div className="md:col-span-2 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <select
                id="product-status-filter"
                aria-label="Filtrar modulos por estado"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-3 bg-[#0B1026]/75 border border-slate-800/80 text-slate-200 rounded-xl text-xs focus:outline-none focus:border-energy-cyan tracking-wide font-mono select-none"
              >
                <option value="all">TODOS LOS ESTADOS</option>
                {statusOptions.filter(opt => opt !== "all").map((status) => (
                  <option key={status} value={status}>
                    {status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-[#0B1026]/40 border border-dashed border-slate-800 rounded-2xl">
            <Info className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No se encontraron soluciones</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
              Prueba modificando tus términos de búsqueda o configurando tus filtros de división y estado.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setDivisionFilter("all");
                setStatusFilter("all");
              }}
              className="mt-5 px-5 py-2.5 bg-slate-900 hover:bg-slate-850 hover:text-white text-slate-400 border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Reestablecer Filtros
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const config = getDivisionTheme(product.division);
            return (
              <div
                key={product.id}
                className={`glass-panel border rounded-2xl p-5 md:p-6 flex flex-col justify-between transition-all duration-300 shadow-xl transform hover:-translate-y-1 ${config.glassCard} ${config.borderHover}`}
              >
                <div className="space-y-4">
                  
                  {/* Meta status and division */}
                  <div className="flex items-center justify-between select-none">
                    <span className={`text-[9px] font-mono tracking-widest font-bold px-2.5 py-1 rounded-full border ${config.badge}`}>
                      {product.division.toUpperCase()}
                    </span>
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border ${getStatusStyles(product.status)}`}>
                      {product.status}
                    </span>
                  </div>

                  {/* MINI COSMIC ORB per product as requested */}
                  <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-xl border border-slate-900/60 select-none">
                    <div className={`relative w-8 h-8 rounded-full bg-gradient-to-tr ${config.orbGradient} p-[1px] ${config.orbShadow} shadow-lg`}>
                      <div className="w-full h-full bg-[#050816] rounded-full flex items-center justify-center">
                        <span className={`text-[9px] font-mono font-bold ${config.textAccent}`}>
                          Ø
                        </span>
                      </div>
                      <div className="absolute inset-0 rounded-full border border-dashed border-slate-700/40 animate-spin-slow" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">{product.name}</h3>
                      <p className="text-[10px] text-slate-500 font-mono tracking-wider">{product.category}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {product.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-1 select-none">
                    {product.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono bg-[#0B1026]/90 border border-slate-850 text-slate-400 px-2 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA button inside card */}
                <div className="pt-6 mt-auto flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 py-2.5 px-3 bg-slate-900/90 hover:bg-[#0B1026] border border-slate-800/80 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-[10px] uppercase tracking-wider rounded-xl shadow-inner transition-all flex items-center justify-center space-x-1 group cursor-pointer"
                  >
                    <span>Ficha</span>
                    <ArrowRight className="w-3 h-3 transition-transform duration-250 group-hover:translate-x-0.5" />
                  </button>
                  {product.launchUrl && (
                    <a
                      href={product.launchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 bg-emerald-950/20 hover:bg-emerald-600/30 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer gap-1.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                      title={`Abrir ${product.name}`}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>App</span>
                    </a>
                  )}
                  {onPlayVideo && (
                    <button
                      onClick={() => onPlayVideo(product.id)}
                      className="px-3 py-2.5 bg-cyan-950/20 hover:bg-cyan-600/30 border border-cyan-500/20 hover:border-cyan-500 text-cyan-400 hover:text-white rounded-xl transition-all flex items-center justify-center cursor-pointer gap-1.5 text-[10px] font-bold uppercase tracking-wider shrink-0"
                      title="Ver Video de Presentación"
                    >
                      <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
                      <span>Video</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Detail Modal Dialog Overlay */}
        {selectedProduct && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-detail-title"
              className="bg-[#0B1026] border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            >
              
              {/* Modal Header */}
              <div className="bg-slate-950 px-6 py-5 border-b border-slate-900 flex items-center justify-between select-none">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono tracking-widest font-bold px-2.5 py-0.5 rounded border ${getDivisionTheme(selectedProduct.division).badge}`}>
                      {selectedProduct.division.toUpperCase()} SYSTEM
                    </span>
                    <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${getStatusStyles(selectedProduct.status)}`}>
                      {selectedProduct.status}
                    </span>
                  </div>
                  <h3 id="product-detail-title" className="text-2xl font-black text-white tracking-wide font-space uppercase">{selectedProduct.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="p-1 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer text-[10px] font-bold tracking-widest flex items-center space-x-1 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  aria-label="Cerrar ficha de producto"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>CERRAR</span>
                </button>
              </div>

              {/* Modal Body / Information detail */}
              <div className="p-6 overflow-y-auto space-y-6 max-h-[60vh] scrollbar-thin">
                
                {/* Category detail */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase text-slate-500 font-mono tracking-widest leading-none">Categoría Operacional:</span>
                  <p className="text-slate-200 text-xs font-mono font-bold bg-[#050816] px-4 py-3 rounded-xl border border-slate-900">
                    {selectedProduct.category}
                  </p>
                </div>

                {/* Full Description */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase text-slate-500 font-mono tracking-widest leading-none">Descripción Completa:</span>
                  <p className="text-slate-350 text-sm leading-relaxed whitespace-pre-wrap font-light">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Subsystem Details / Simulated Capabilities */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase text-slate-500 font-mono tracking-widest leading-none">Especificaciones Técnicas Conectadas:</span>
                  <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl space-y-2.5 select-none">
                    <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Esquema modular:</span> Sincronizado nativamente con el núcleo de datos integrados Orbi Sync.
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Soporte Inteligente:</span> Conectado remotamente al nodo neuronal Foton Prime con instrucciones y base semántica local.
                      </div>
                    </div>
                    <div className="flex items-start space-x-2.5 text-xs text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-white">Interconectividad total:</span> Conexión de puente seguro habilitada con los demás módulos de la división {selectedProduct.division}.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags detail */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase text-slate-500 font-mono tracking-widest leading-none">Palabras Clave / Tags:</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedProduct.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono bg-slate-950 border border-slate-900 text-slate-400 px-3 py-1 rounded-xl"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Modal footer / Quick action info */}
              <div className="bg-slate-950 px-6 py-4 border-t border-slate-900 flex flex-col gap-2.5 select-none">
                {selectedProduct.launchUrl && (
                  <a
                    href={selectedProduct.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-[9px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir Aplicación Web ({selectedProduct.name})</span>
                  </a>
                )}
                {onPlayVideo && (
                  <button
                    onClick={() => {
                      onPlayVideo(selectedProduct.id);
                      setSelectedProduct(null); // Close detail modal to make sure they see the video presentation
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-mono text-[9px] font-black tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/10 transition-all active:scale-[0.98]"
                  >
                    <Play className="w-3 h-3 fill-white text-white" />
                    <span>Iniciar Presentación Consola Orbi ({selectedProduct.name})</span>
                  </button>
                )}
                <p className="text-[9px] text-slate-500 tracking-wider font-mono text-center">
                  SISTEMA DE CONTROL GENERAL ORBI // ORB_{selectedProduct.name.toUpperCase().replace(/\s+/g, "_")}_RECON
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}
