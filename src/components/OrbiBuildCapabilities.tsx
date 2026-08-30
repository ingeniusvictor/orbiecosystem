import { ArrowRight, Bot, BrainCircuit, BriefcaseBusiness, Code2, FileText, Home, PanelsTopLeft, Rocket, SolarPanel, Sparkles, Workflow } from "lucide-react";

const capabilities = [
  {
    title: "Agentes IA y asistentes",
    description: "Asistentes para atención, soporte, análisis, operaciones, ventas, documentación o procesos internos.",
    icon: Bot,
    tags: ["IA", "Chatbots", "Automatización"],
  },
  {
    title: "Webs, landing pages y plataformas",
    description: "Sitios modernos, vitrinas comerciales, paneles de presentación, herramientas internas y experiencias web.",
    icon: PanelsTopLeft,
    tags: ["Web", "Vercel", "Producto"],
  },
  {
    title: "Automatización de procesos",
    description: "Flujos que reducen tareas repetitivas, ordenan información y conectan herramientas mediante lógica y APIs.",
    icon: Workflow,
    tags: ["Workflows", "APIs", "Eficiencia"],
  },
  {
    title: "Dashboards y herramientas internas",
    description: "Paneles para operación, seguimiento, reportabilidad, métricas, estados, documentos y control técnico.",
    icon: BrainCircuit,
    tags: ["Datos", "Control", "Operación"],
  },
  {
    title: "Documentación y contenido técnico",
    description: "Presentaciones, fichas, dossiers, reportes, guías, contenido educativo y material comercial claro.",
    icon: FileText,
    tags: ["Docs", "Dossiers", "Contenido"],
  },
  {
    title: "Soluciones para empresas",
    description: "Sistemas corporativos modulares para procesos, inspecciones, mantenimiento, control y productividad.",
    icon: BriefcaseBusiness,
    tags: ["Corporate", "O&M", "Productividad"],
  },
  {
    title: "Servicios solares y domótica",
    description: "Asesoría, instalación, automatización del hogar, energía solar, bombeo y soluciones aplicadas en terreno.",
    icon: SolarPanel,
    tags: ["Solar", "Domótica", "Terreno"],
  },
  {
    title: "MVPs y prototipos rápidos",
    description: "Construcción controlada de versiones iniciales para validar ideas, mostrar avances y escalar con orden.",
    icon: Rocket,
    tags: ["MVP", "Prototipo", "Escala"],
  },
];

export default function OrbiBuildCapabilities() {
  return (
    <section id="orbi-capacidades" className="relative overflow-hidden border-y border-white/5 bg-[#030712] py-24 sm:py-28">
      <div className="absolute inset-0 grid-overlay opacity-[0.045]" aria-hidden="true" />
      <div className="absolute left-1/2 top-0 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div className="space-y-5">
            <div className="orbitron-chip inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
              <span>ORBI BUILD CAPABILITIES</span>
            </div>
            <h2 className="orbitron-title max-w-3xl">Qué puede construir ORBI para ti o tu empresa.</h2>
            <p className="orbitron-subtitle max-w-3xl">
              ORBI no es solo una vitrina de ideas. Es un ecosistema capaz de convertir problemas reales en herramientas digitales, contenido técnico, automatizaciones, agentes IA y soluciones aplicadas.
            </p>
          </div>

          <div className="orbitron-panel p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 shadow-lg shadow-cyan-950/30">
                <Code2 className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Enfoque ORBI</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Partimos desde un objetivo claro, bajamos a capacidades, elegimos herramientas, probamos, documentamos y escalamos solo cuando el caso lo justifica.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <article key={capability.title} className="group relative min-h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-2xl transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.055] hover:shadow-2xl hover:shadow-cyan-950/25">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_42%)] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                <div className="relative z-10 flex h-full flex-col justify-between gap-6">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-slate-950/70 text-cyan-100 shadow-lg">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 font-space text-xl font-black leading-tight text-white">{capability.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{capability.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {capability.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.055] px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-cyan-100">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="mailto:ing.vmlp.chile@gmail.com?subject=Consulta%20desde%20ORBI%20Ecosystem&body=Hola%20ORBI%20Ecosystem,%20quiero%20conversar%20sobre%20una%20idea,%20proceso%20o%20soluci%C3%B3n%20que%20podr%C3%ADan%20ayudarme%20a%20construir." className="orbitron-primary-action">
            Solicitar diagnóstico
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
          <a href="#orbi-presentaciones" className="orbitron-secondary-action">
            Ver dossiers ORBI
            <Home className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
