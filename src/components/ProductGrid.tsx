import React, { useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "../data";
import { Product } from "../types";
import {
  ArrowRight,
  CheckCircle,
  ExternalLink,
  Filter,
  Info,
  Leaf,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { competitionContent } from "../content/competition";

interface ProductGridProps {
  initialDivisionFilter: "all" | "games" | "corporate" | "development";
  onResetDivisionFilter: () => void;
  onPlayVideo?: (compId: string) => void;
}

const featuredProductIds = [
  "orbi-geo",
  "orbi-docs-ia",
  "orbi-corporate-assistant",
  "orbi-grid-defense"
];

export default function ProductGrid({ initialDivisionFilter, onResetDivisionFilter, onPlayVideo }: ProductGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [divisionFilter, setDivisionFilter] = useState<"all" | "games" | "corporate" | "development">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (initialDivisionFilter !== "all") {
      setDivisionFilter(initialDivisionFilter);
      setTimeout(() => {
        const element = document.getElementById("proyectos");
        if (element) {
          const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          element.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        }
      }, 100);
      onResetDivisionFilter();
    }
  }, [initialDivisionFilter, onResetDivisionFilter]);

  const statusOptions = useMemo(() => {
    const statuses = new Set(PRODUCTS.map((product) => product.status));
    return ["all", ...Array.from(statuses)];
  }, []);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      if (divisionFilter !== "all" && product.division !== divisionFilter) {
        return false;
      }

      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }

      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCategory = product.category.toLowerCase().includes(query);
        const matchesDescription = product.description.toLowerCase().includes(query);
        const matchesTags = product.tags.some((tag) => tag.toLowerCase().includes(query));
        return matchesName || matchesCategory || matchesDescription || matchesTags;
      }

      return true;
    });
  }, [divisionFilter, searchTerm, statusFilter]);

  const featuredProducts = useMemo(() => {
    return featuredProductIds
      .map((id) => PRODUCTS.find((product) => product.id === id))
      .filter((product): product is Product => Boolean(product));
  }, []);

  const productStats = useMemo(() => {
    return {
      total: PRODUCTS.length,
      corporate: PRODUCTS.filter((product) => product.division === "corporate").length,
      games: PRODUCTS.filter((product) => product.division === "games").length,
      development: PRODUCTS.filter((product) => product.division === "development").length
    };
  }, []);

  const getDivisionTheme = (division: Product["division"]) => {
    switch (division) {
      case "games":
        return {
          badge: "bg-blue-500/10 text-blue-300 border-blue-500/25",
          card: "border-blue-400/15 hover:border-blue-300/35 hover:shadow-blue-950/40",
          orb: "from-blue-500 via-sky-400 to-transparent",
          text: "text-blue-300",
          label: "Game System"
        };
      case "corporate":
        return {
          badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
          card: "border-emerald-400/15 hover:border-emerald-300/35 hover:shadow-emerald-950/40",
          orb: "from-emerald-500 via-teal-400 to-transparent",
          text: "text-emerald-300",
          label: "Corporate System"
        };
      case "development":
        return {
          badge: "bg-violet-500/10 text-violet-300 border-violet-500/25",
          card: "border-violet-400/15 hover:border-violet-300/35 hover:shadow-violet-950/40",
          orb: "from-violet-500 via-fuchsia-400 to-transparent",
          text: "text-violet-300",
          label: "Development System"
        };
    }
  };

  const getStatusStyles = (status: Product["status"]) => {
    switch (status) {
      case "Android funcional":
      case "Estable":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "En expansión":
      case "En desarrollo":
        return "bg-blue-500/10 text-blue-300 border-blue-500/30";
      case "Prototipo":
        return "bg-amber-500/10 text-amber-300 border-amber-500/30";
      case "Concepto avanzado":
      case "Concepto en expansión":
        return "bg-violet-500/10 text-violet-300 border-violet-500/30";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDivisionFilter("all");
    setStatusFilter("all");
  };

  const renderProductCard = (product: Product, isFeatured = false) => {
    const theme = getDivisionTheme(product.division);

    return (
      <article
        key={product.id}
        className={`group relative flex min-h-full flex-col justify-between overflow-hidden rounded-3xl border bg-slate-950/60 p-5 shadow-2xl transition duration-300 hover:-translate-y-1 ${theme.card}`}
      >
        <div className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-tr ${theme.orb} opacity-20 blur-2xl transition group-hover:opacity-35`} aria-hidden="true" />
        <div className="relative space-y-5">
          <div className="flex items-start justify-between gap-3">
            <span className={`rounded-full border px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.2em] ${theme.badge}`}>
              {theme.label}
            </span>
            <span className={`rounded-full border px-2 py-1 font-mono text-[8px] font-black uppercase tracking-[0.16em] ${getStatusStyles(product.status)}`}>
              {product.status}
            </span>
          </div>

          <div className="flex gap-4">
            <div className={`relative mt-1 h-11 w-11 shrink-0 rounded-2xl bg-gradient-to-tr ${theme.orb} p-[1px] shadow-lg`}>
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-[#050816]">
                <span className={`font-orbitron text-xs font-black ${theme.text}`}>Ø</span>
              </div>
            </div>
            <div>
              <h3 className="font-space text-xl font-black leading-tight tracking-tight text-white">{product.name}</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">{product.category}</p>
            </div>
          </div>

          <p className={`${isFeatured ? "text-sm leading-7" : "text-sm leading-6"} text-slate-300 line-clamp-4`}>
            {product.description}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, isFeatured ? 5 : 4).map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 font-mono text-[9px] text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={() => setSelectedProduct(product)}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-300/40 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Ficha
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {product.launchUrl && (
            <a
              href={product.launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200 transition hover:border-emerald-300/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              title={`Abrir ${product.name}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              App
            </a>
          )}

          {onPlayVideo && (
            <button
              type="button"
              onClick={() => onPlayVideo(product.id)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-300/50 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              title="Ver video de presentación"
            >
              <Play className="h-3.5 w-3.5" />
              Video
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <section id="proyectos" className="relative overflow-hidden border-t border-slate-900 bg-[#050816] py-24 font-sans">
      <div className="absolute inset-0 grid-overlay opacity-[0.04]" aria-hidden="true" />
      <div className="absolute left-0 top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-24 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <div className="orbitron-chip inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ORBI SOLUTIONS / PRODUCT SHOWCASE</span>
            </div>
            <div className="space-y-4">
              <h2 className="orbitron-title max-w-4xl">Soluciones reales, prototipos activos y productos en expansión.</h2>
              <p className="orbitron-subtitle max-w-3xl">
                Esta es la vitrina de ejecución de ORBI: herramientas corporativas, aplicaciones con IA, productos para terreno, experiencias interactivas y módulos internos que muestran capacidad técnica real.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <div className="orbitron-metric-card"><div className="font-orbitron text-2xl font-black text-white">{productStats.total}</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Módulos</div></div>
            <div className="orbitron-metric-card"><div className="font-orbitron text-2xl font-black text-white">{productStats.corporate}</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Corporate</div></div>
            <div className="orbitron-metric-card"><div className="font-orbitron text-2xl font-black text-white">{productStats.games}</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Games</div></div>
            <div className="orbitron-metric-card"><div className="font-orbitron text-2xl font-black text-white">{productStats.development}</div><div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">Dev</div></div>
          </div>
        </div>

        <article className="orbitron-panel mb-10 overflow-hidden p-5 md:p-6">
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
                href="/projects/orbi-PVMetrics"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-slate-200 transition hover:border-purple-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Ficha PVMetrics
              </a>
            </div>
          </div>
        </article>

        <div className="mb-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Featured execution</p>
              <h3 className="mt-2 font-space text-2xl font-black text-white">Productos destacados</h3>
            </div>
            <p className="hidden max-w-md text-right text-sm leading-6 text-slate-500 md:block">
              Selección inicial para demostrar ejecución visible, videos, apps y casos de uso comprensibles para clientes.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((product) => renderProductCard(product, true))}
          </div>
        </div>

        <div className="orbitron-panel mb-10 p-4 md:p-5">
          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
            <div className="relative md:col-span-6">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                id="product-search"
                aria-label="Buscar módulos del ecosistema ORBI"
                type="text"
                placeholder="Buscar por nombre, categoría o etiqueta..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-800/80 bg-[#0B1026]/75 py-3 pl-11 pr-4 text-xs text-slate-100 shadow-inner transition-all placeholder:text-slate-500 focus:border-energy-cyan focus:outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap justify-start gap-1.5 md:col-span-4 md:justify-center">
              {(["all", "corporate", "games", "development"] as const).map((division) => (
                <button
                  key={division}
                  type="button"
                  onClick={() => setDivisionFilter(division)}
                  aria-pressed={divisionFilter === division}
                  className={`rounded-xl border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                    divisionFilter === division
                      ? "border-cyan-400/40 bg-cyan-400/10 text-white shadow-md"
                      : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                  }`}
                >
                  {division === "all" ? "Todos" : division === "development" ? "Dev" : division}
                </button>
              ))}
            </div>

            <div className="relative md:col-span-2">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                <Filter className="h-3.5 w-3.5" />
              </span>
              <select
                id="product-status-filter"
                aria-label="Filtrar módulos por estado"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-800/80 bg-[#0B1026]/75 py-3 pl-9 pr-3 font-mono text-xs tracking-wide text-slate-200 focus:border-energy-cyan focus:outline-none"
              >
                <option value="all">TODOS</option>
                {statusOptions.filter((option) => option !== "all").map((status) => (
                  <option key={status} value={status}>{status.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-800 bg-[#0B1026]/40 py-16 text-center">
            <Info className="mx-auto mb-4 h-12 w-12 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-300">No se encontraron soluciones</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Prueba modificando tus términos de búsqueda o configurando tus filtros de división y estado.</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-400 transition-all hover:text-white"
            >
              Reestablecer filtros
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
                Catálogo filtrable / <span className="text-white">{filteredProducts.length}</span> resultados
              </p>
              {(searchTerm || divisionFilter !== "all" || statusFilter !== "all") && (
                <button type="button" onClick={clearFilters} className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300 hover:text-white">
                  Limpiar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => renderProductCard(product))}
            </div>
          </>
        )}

        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-detail-title"
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1026] shadow-2xl animate-in zoom-in-95 duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-900 bg-slate-950 px-6 py-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${getDivisionTheme(selectedProduct.division).badge}`}>
                      {getDivisionTheme(selectedProduct.division).label}
                    </span>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[9px] ${getStatusStyles(selectedProduct.status)}`}>
                      {selectedProduct.status}
                    </span>
                  </div>
                  <h3 id="product-detail-title" className="font-space text-2xl font-black uppercase tracking-wide text-white">{selectedProduct.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                  aria-label="Cerrar ficha de producto"
                >
                  <X className="h-3.5 w-3.5" />
                  CERRAR
                </button>
              </div>

              <div className="max-h-[60vh] space-y-6 overflow-y-auto p-6 scrollbar-thin">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] uppercase leading-none tracking-widest text-slate-500">Categoría operacional</span>
                  <p className="rounded-xl border border-slate-900 bg-[#050816] px-4 py-3 font-mono text-xs font-bold text-slate-200">{selectedProduct.category}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="font-mono text-[10px] uppercase leading-none tracking-widest text-slate-500">Descripción completa</span>
                  <p className="whitespace-pre-wrap text-sm font-light leading-relaxed text-slate-300">{selectedProduct.description}</p>
                </div>

                <div className="space-y-3">
                  <span className="font-mono text-[10px] uppercase leading-none tracking-widest text-slate-500">Lectura de capacidad</span>
                  <div className="space-y-2.5 rounded-xl border border-slate-900 bg-slate-950 p-4">
                    <div className="flex items-start gap-2.5 text-xs text-slate-300"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span><strong className="text-white">Producto modular:</strong> preparado para integrarse dentro de la narrativa ORBI Platform Season 1.</span></div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span><strong className="text-white">Presentación comercial:</strong> compatible con video, ficha, CTA y expansión futura.</span></div>
                    <div className="flex items-start gap-2.5 text-xs text-slate-300"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /><span><strong className="text-white">División:</strong> conectado al portal {getDivisionTheme(selectedProduct.division).label}.</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-[10px] uppercase leading-none tracking-widest text-slate-500">Tags</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {selectedProduct.tags.map((tag) => (
                      <span key={tag} className="rounded-xl border border-slate-900 bg-slate-950 px-3 py-1 font-mono text-xs text-slate-400">#{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-slate-900 bg-slate-950 px-6 py-4">
                {selectedProduct.launchUrl && (
                  <a
                    href={selectedProduct.launchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 font-mono text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-500/10 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir aplicación web ({selectedProduct.name})
                  </a>
                )}
                {onPlayVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      onPlayVideo(selectedProduct.id);
                      setSelectedProduct(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 py-3 font-mono text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/10 transition-all hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.98]"
                  >
                    <Play className="h-3 w-3" />
                    Iniciar presentación ({selectedProduct.name})
                  </button>
                )}
                <p className="text-center font-mono text-[9px] tracking-wider text-slate-500">
                  ORBI PRODUCT DOSSIER // {selectedProduct.name.toUpperCase().replace(/\s+/g, "_")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
