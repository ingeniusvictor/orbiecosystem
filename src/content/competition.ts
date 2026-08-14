export type ClimateLocale = "es" | "en";

export type ClaimStatus =
  | "approved"
  | "approved_as_plan"
  | "approved_as_objective"
  | "pending_baseline_confirmation"
  | "prohibited"
  | "prohibited_without_evidence"
  | "prohibited_without_authorization"
  | "approved_if_labeled"
  | "methodology_and_source_required"
  | "brand_authorization_required";

export type ClaimKind =
  | "corporate-fact"
  | "product-status"
  | "roadmap"
  | "functional-proposal"
  | "technical-claim"
  | "quantitative-result"
  | "commercial-claim"
  | "data-claim"
  | "climate-result"
  | "external-brand";

export type RouteStatus = "existing" | "proposed" | "not-implemented";

export interface CompetitionClaim {
  id: string;
  statement: string;
  kind: ClaimKind;
  status: ClaimStatus;
  evidence: string;
  publicationConditions: string;
  approvalOwner: string;
  notes: string;
}

export interface CompetitionRoute {
  path: string;
  objective: string;
  audience: string;
  status: RouteStatus;
  contentSource: string;
  plannedMetadata: string;
}

export const competitionContent = {
  company: {
    legalName: "ORBI Ecosystem SpA",
    companyType: "Sociedad por Acciones, SpA",
    foundedYear: 2026,
    incorporationDate: "2026-06-20",
    publicHeadquarters: "Rancagua, Region de O'Higgins, Chile",
    country: "Chile",
    founderAndGeneralManager: "Victor Marcel Leon Pacheco",
    canonicalDescription:
      "ORBI Ecosystem SpA es una empresa tecnológica chilena constituida en 2026 y con sede en Rancagua. Desarrolla software, inteligencia artificial, automatización, análisis de datos y soluciones digitales, incluyendo aplicaciones para energía y sostenibilidad.",
    founderDescription:
      "ORBI Ecosystem SpA fue fundada por Víctor Marcel León Pacheco, ingeniero eléctrico con experiencia práctica en operación y mantenimiento de plantas fotovoltaicas.",
  },
  product: {
    name: "ORBI PBMetrics IA",
    edition: "Climate Recovery Edition",
    positioning: "Inteligencia operacional para recuperar más energía renovable",
    statusLabel: "Competition Edition",
    productStatus:
      "ORBI PBMetrics IA cuenta con una base funcional previamente desarrollada. Climate Recovery Edition representa su siguiente evolución, orientada a identificar, priorizar y verificar oportunidades de recuperación de energía renovable.",
    productStatusWarning:
      "Este estado debe confirmarse contra la auditoría real del baseline antes de publicarse.",
    humanPrinciple: "The AI recommends; the operator decides",
  },
  competition: {
    name: "AI for Climate Innovation Factory 2026",
    category: "Renewable Energy Integration and Efficiency",
    submissionEdition: "Climate Recovery Edition",
    resultBoundary:
      "No energy recovery percentages, CO2 avoided figures, customers, pilots, partnerships or awards may be claimed without evidence and approval.",
  },
  routes: [
    {
      path: "/",
      objective: "Web corporativa general.",
      audience: "General visitors, partners, evaluators and ecosystem users.",
      status: "existing",
      contentSource: "Existing src/data.ts and current visual components.",
      plannedMetadata: "Corporate Organization and WebSite metadata.",
    },
    {
      path: "/climate-recovery",
      objective: "Landing en español para la candidatura.",
      audience: "Competition jury and renewable energy stakeholders.",
      status: "existing",
      contentSource: "docs/competition/CONTENT_CANON.md and this registry.",
      plannedMetadata: "Climate Recovery title, description, canonical and language metadata.",
    },
    {
      path: "/climate-recovery/en",
      objective: "English Climate Recovery experience.",
      audience: "International jury and English-speaking stakeholders.",
      status: "existing",
      contentSource: "Approved English registry derived from CONTENT_CANON and COMPETITION_BRIEF.",
      plannedMetadata: "English title, description, canonical and hreflang relationship.",
    },
    {
      path: "/projects/orbi-pbmetrics",
      objective: "Ficha técnica reutilizable del producto.",
      audience: "Technical evaluators and product reviewers.",
      status: "existing",
      contentSource: "This registry and claims register.",
      plannedMetadata: "SoftwareApplication metadata after approval.",
    },
  ] satisfies CompetitionRoute[],
  home: {
    headline: "El futuro no es una sola aplicación. Es un ecosistema conectado.",
    supportText:
      "ORBI Ecosystem SpA desarrolla software, inteligencia artificial y experiencias digitales para transformar datos, energía y creatividad en soluciones útiles para las personas y las organizaciones.",
    featuredCard: "ORBI PBMetrics IA — Climate Recovery Edition",
    subtext: "Inteligencia operacional para recuperar más energía renovable.",
    cta: "Conocer Climate Recovery",
  },
  climateRecovery: {
    title: "ORBI PBMetrics IA — Climate Recovery Edition",
    phrase: "Recover Clean Energy. Intelligently.",
    description:
      "Una plataforma de inteligencia operacional que ayuda a identificar pérdidas recuperables en plantas fotovoltaicas, explicar su evidencia, priorizar acciones de mantenimiento y verificar la energía limpia recuperada.",
    problem:
      "Las plantas fotovoltaicas generan grandes volúmenes de datos, alarmas y registros operacionales. Sin embargo, convertir esa información en acciones oportunas continúa siendo un desafío. Cuando una pérdida de rendimiento permanece sin identificar o sin priorizar, no solo existe un impacto económico: también se deja de entregar energía limpia a la red.",
    explainableAI:
      "ORBI PBMetrics IA no presenta sus hipótesis como certezas. Cada recomendación debe mostrar la evidencia utilizada, el nivel de confianza y las limitaciones del análisis. El conocimiento técnico y la decisión final permanecen en manos del equipo de operación y mantenimiento.",
    climateImpact:
      "La propuesta conecta la identificación de pérdidas recuperables con acciones operacionales y con la verificación posterior de generación limpia recuperada. Las mediciones reales, estimaciones, simulaciones y proyecciones deben mostrarse como categorías distintas.",
  },
  climateRecoveryLocales: {
    es: {
      languageName: "Español",
      languageSwitch: {
        label: "Selector de idioma de Climate Recovery",
        current: "Actual",
        spanish: "Ver experiencia Climate Recovery en español",
        english: "Ver experiencia Climate Recovery en inglés",
      },
      seo: {
        lang: "es",
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description:
          "IA explicable para identificar pérdidas fotovoltaicas recuperables, priorizar mantenimiento y verificar energía limpia recuperada.",
        canonical: "https://orbiecosystem.vercel.app/climate-recovery",
      },
      product: {
        statusLabel: "Competition Edition",
        productStatus:
          "ORBI PBMetrics IA cuenta con una base funcional previamente desarrollada. Climate Recovery Edition representa su siguiente evolución, orientada a identificar, priorizar y verificar oportunidades de recuperación de energía renovable.",
        productStatusWarning:
          "Este estado debe confirmarse contra la auditoría real del baseline antes de publicarse.",
      },
      company: {
        canonicalDescription:
          "ORBI Ecosystem SpA es una empresa tecnológica chilena constituida en 2026 y con sede en Rancagua. Desarrolla software, inteligencia artificial, automatización, análisis de datos y soluciones digitales, incluyendo aplicaciones para energía y sostenibilidad.",
        founderDescription:
          "ORBI Ecosystem SpA fue fundada por Víctor Marcel León Pacheco, ingeniero eléctrico con experiencia práctica en operación y mantenimiento de plantas fotovoltaicas.",
      },
      title: "ORBI PBMetrics IA — Climate Recovery Edition",
      phrase: "Recover Clean Energy. Intelligently.",
      description:
        "Una plataforma de inteligencia operacional que ayuda a identificar pérdidas recuperables en plantas fotovoltaicas, explicar su evidencia, priorizar acciones de mantenimiento y verificar la energía limpia recuperada.",
      problem:
        "Las plantas fotovoltaicas generan grandes volúmenes de datos, alarmas y registros operacionales. Sin embargo, convertir esa información en acciones oportunas continúa siendo un desafío. Cuando una pérdida de rendimiento permanece sin identificar o sin priorizar, no solo existe un impacto económico: también se deja de entregar energía limpia a la red.",
      explainableAI:
        "ORBI PBMetrics IA no presenta sus hipótesis como certezas. Cada recomendación debe mostrar la evidencia utilizada, el nivel de confianza y las limitaciones del análisis. El conocimiento técnico y la decisión final permanecen en manos del equipo de operación y mantenimiento.",
      climateImpact:
        "La propuesta conecta la identificación de pérdidas recuperables con acciones operacionales y con la verificación posterior de generación limpia recuperada. Las mediciones reales, estimaciones, simulaciones y proyecciones deben mostrarse como categorías distintas.",
      hero: {
        primaryCta: "Explorar la solución",
        secondaryCta: "Ver metodología",
        loopTitle: "Climate Recovery Loop",
        loopSubtitle: "Synthetic demonstration preview",
      },
      sections: {
        problemEyebrow: "Problem",
        problemTitle: "Datos operacionales que todavía no se convierten en recuperación",
        flowEyebrow: "From Data To Recovery",
        flowTitle: "Del dato operacional a la verificación",
        pillarsEyebrow: "Five Recovery Pillars",
        pillarsTitle: "Cinco pilares para recuperar energía limpia sin inventar certezas",
        capabilitiesEyebrow: "Capabilities And Status",
        capabilitiesTitle: "Capacidades diferenciadas por estado",
        explainableEyebrow: "Explainable AI",
        explainableTitle: "La IA recomienda; el operador decide",
        climateMethodEyebrow: "Climate Impact Method",
        climateMethodTitle: "Impacto climático explicado por categorías de evidencia",
        syntheticEyebrow: "Synthetic Data",
        syntheticTitle: "Escenario demostrativo sintético",
        architectureEyebrow: "Public Architecture",
        architectureTitle: "Arquitectura pública de alto nivel",
        productStatusEyebrow: "Product Status",
        productStatusTitle: "Estado del producto y condición de publicación",
        roadmapEyebrow: "Roadmap",
        roadmapTitle: "Etapas de evolución para Climate Recovery",
        companyEyebrow: "ORBI Ecosystem SpA",
        companyTitle: "Empresa postulante",
        founderEyebrow: "Founder",
        founderTitle: "Fundador",
        competitionEyebrow: "Competition",
        competitionTitle: "AI for Climate Innovation Factory 2026",
        contactEyebrow: "Contact CTA",
        contactTitle: "Canal de contacto pendiente de verificación",
      },
      capabilities: {
        registryLabel: "Registry label",
        statusPrefix: "Status",
        groups: [
          {
            label: "Existing Foundation",
            items: ["Base funcional de PBMetrics sujeta a confirmación del baseline.", "Registro centralizado de contenido y claims."],
          },
          {
            label: "Competition Edition",
            items: ["Enfoque Climate Recovery para pérdidas recuperables.", "Marco explicable con operador como decisor final."],
          },
          {
            label: "Planned",
            items: ["Command Center para priorización operativa.", "Ruta reusable para ficha técnica de PBMetrics."],
          },
          {
            label: "Prototype",
            items: ["Escenarios demostrativos rotulados como Synthetic Data.", "Visualizaciones de flujo y verificación sin datos reales."],
          },
        ],
      },
      labels: {
        step: "STEP",
        pendingConfirmation: "Pendiente de confirmación",
        syntheticDescription: "Demostración visual sin datos reales, clientes, pilotos ni resultados climáticos.",
        architectureBoundary:
          "No se exponen algoritmos privados, credenciales, endpoints internos, detalles propietarios ni información sensible.",
        contactDescription:
          "Esta sección queda preparada sin formulario falso ni correo no verificado. El canal público se habilitará cuando exista un medio corporativo confirmado.",
        contactDisabled: "Contacto no habilitado",
      },
    },
    en: {
      languageName: "English",
      languageSwitch: {
        label: "Climate Recovery language selector",
        current: "Current",
        spanish: "View Climate Recovery experience in Spanish",
        english: "View Climate Recovery experience in English",
      },
      seo: {
        lang: "en",
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description:
          "Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.",
        canonical: "https://orbiecosystem.vercel.app/climate-recovery/en",
      },
      product: {
        statusLabel: "Competition Edition",
        productStatus:
          "ORBI PBMetrics IA has a previously developed functional foundation. Climate Recovery Edition represents its next evolution, focused on identifying, prioritizing and verifying renewable energy recovery opportunities.",
        productStatusWarning:
          "This status must be confirmed against the real baseline audit before publication.",
      },
      company: {
        canonicalDescription:
          "ORBI Ecosystem SpA is a Chilean technology company incorporated in 2026 and based in Rancagua. It develops software, artificial intelligence, automation, data analysis and digital solutions, including applications for energy and sustainability.",
        founderDescription:
          "ORBI Ecosystem SpA was founded by Victor Marcel Leon Pacheco, an electrical engineer with practical experience in operation and maintenance of photovoltaic plants.",
      },
      title: "ORBI PBMetrics IA — Climate Recovery Edition",
      phrase: "Recover Clean Energy. Intelligently.",
      description:
        "An operational intelligence platform that helps identify recoverable losses in photovoltaic plants, explain the evidence behind them, prioritize maintenance actions and verify recovered clean energy.",
      problem:
        "Photovoltaic plants generate large volumes of operational data, alarms and maintenance records. However, turning that information into timely action remains a challenge. When a performance loss is not identified or prioritized, the impact is not only economic: clean energy that could be delivered to the grid can remain unrealized.",
      explainableAI:
        "ORBI PBMetrics IA does not present its hypotheses as certainties. Each recommendation must show the evidence used, the confidence level and the limitations of the analysis. Technical knowledge and the final decision remain in the hands of the operation and maintenance team.",
      climateImpact:
        "The proposal connects recoverable-loss identification with operational actions and later verification of recovered clean generation. Real measurements, estimates, simulations and projections must be shown as distinct categories.",
      hero: {
        primaryCta: "Explore the solution",
        secondaryCta: "View methodology",
        loopTitle: "Climate Recovery Loop",
        loopSubtitle: "Synthetic demonstration preview",
      },
      sections: {
        problemEyebrow: "Problem",
        problemTitle: "Operational data that still does not become recovery",
        flowEyebrow: "From Data To Recovery",
        flowTitle: "From operational data to verification",
        pillarsEyebrow: "Five Recovery Pillars",
        pillarsTitle: "Five pillars for recovering clean energy without inventing certainty",
        capabilitiesEyebrow: "Capabilities And Status",
        capabilitiesTitle: "Capabilities separated by status",
        explainableEyebrow: "Explainable AI",
        explainableTitle: "The AI recommends; the operator decides",
        climateMethodEyebrow: "Climate Impact Method",
        climateMethodTitle: "Climate impact explained by evidence categories",
        syntheticEyebrow: "Synthetic Data",
        syntheticTitle: "Synthetic demonstration scenario",
        architectureEyebrow: "Public Architecture",
        architectureTitle: "High-level public architecture",
        productStatusEyebrow: "Product Status",
        productStatusTitle: "Product status and publication condition",
        roadmapEyebrow: "Roadmap",
        roadmapTitle: "Evolution stages for Climate Recovery",
        companyEyebrow: "ORBI Ecosystem SpA",
        companyTitle: "Applicant company",
        founderEyebrow: "Founder",
        founderTitle: "Founder",
        competitionEyebrow: "Competition",
        competitionTitle: "AI for Climate Innovation Factory 2026",
        contactEyebrow: "Contact CTA",
        contactTitle: "Verified contact channel pending",
      },
      capabilities: {
        registryLabel: "Registry label",
        statusPrefix: "Status",
        groups: [
          {
            label: "Existing Foundation",
            items: ["PBMetrics functional foundation subject to baseline confirmation.", "Centralized content and claims registry."],
          },
          {
            label: "Competition Edition",
            items: ["Climate Recovery focus for recoverable losses.", "Explainable framework with the operator as final decision-maker."],
          },
          {
            label: "Planned",
            items: ["Command Center for operational prioritization.", "Reusable route for the PBMetrics technical product profile."],
          },
          {
            label: "Prototype",
            items: ["Demonstration scenarios labeled as Synthetic Data.", "Flow and verification visualizations without real data."],
          },
        ],
      },
      labels: {
        step: "STEP",
        pendingConfirmation: "Pending confirmation",
        syntheticDescription: "Visual demonstration without real data, customers, pilots or climate results.",
        architectureBoundary:
          "Private algorithms, credentials, internal endpoints, proprietary details and sensitive information are not exposed.",
        contactDescription:
          "This section is prepared without a fake form or unverified email address. The public channel will be enabled when a confirmed corporate contact method exists.",
        contactDisabled: "Contact not enabled",
      },
    },
  },
  routeMetadata: {
    home: {
      lang: "es",
      title: "ORBI Ecosystem SpA",
      description:
        "ORBI Ecosystem SpA desarrolla software, inteligencia artificial y experiencias digitales desde Rancagua, Chile.",
      canonical: "https://orbiecosystem.vercel.app/",
    },
    climateRecovery: {
      es: {
        lang: "es",
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description:
          "IA explicable para identificar pérdidas fotovoltaicas recuperables, priorizar mantenimiento y verificar energía limpia recuperada.",
        canonical: "https://orbiecosystem.vercel.app/climate-recovery",
        alternates: [
          { hreflang: "es-CL", href: "https://orbiecosystem.vercel.app/climate-recovery" },
          { hreflang: "en", href: "https://orbiecosystem.vercel.app/climate-recovery/en" },
          { hreflang: "x-default", href: "https://orbiecosystem.vercel.app/climate-recovery" },
        ],
      },
      en: {
        lang: "en",
        title: "ORBI PBMetrics IA | Climate Recovery Intelligence",
        description:
          "Explainable AI for identifying recoverable photovoltaic losses, prioritizing maintenance and verifying recovered clean energy.",
        canonical: "https://orbiecosystem.vercel.app/climate-recovery/en",
        alternates: [
          { hreflang: "es-CL", href: "https://orbiecosystem.vercel.app/climate-recovery" },
          { hreflang: "en", href: "https://orbiecosystem.vercel.app/climate-recovery/en" },
          { hreflang: "x-default", href: "https://orbiecosystem.vercel.app/climate-recovery" },
        ],
      },
    },
    pbmetrics: {
      lang: "es",
      title: "ORBI PBMetrics IA | Technical Product Profile",
      description:
        "Ficha técnica pública de ORBI PBMetrics IA para evaluación técnica, límites de IA y relación con Climate Recovery Edition.",
      canonical: "https://orbiecosystem.vercel.app/projects/orbi-pbmetrics",
    },
  },
  claims: [
    {
      id: "company-founded-2026",
      statement: "ORBI Ecosystem SpA fue constituida en 2026.",
      kind: "corporate-fact",
      status: "approved",
      evidence: "Contexto canónico de la candidatura.",
      publicationConditions: "Puede publicarse como hecho corporativo.",
      approvalOwner: "ORBI Ecosystem SpA",
      notes: "No agregar datos privados.",
    },
    {
      id: "company-headquarters-rancagua-chile",
      statement: "La empresa tiene sede en Rancagua, Chile.",
      kind: "corporate-fact",
      status: "approved",
      evidence: "Contexto canónico de la candidatura.",
      publicationConditions: "Puede publicarse como sede pública.",
      approvalOwner: "ORBI Ecosystem SpA",
      notes: 'Usar "Rancagua, Región de O\'Higgins, Chile" cuando haya espacio.',
    },
    {
      id: "pbmetrics-functional-base",
      statement: "PBMetrics cuenta con una base funcional.",
      kind: "product-status",
      status: "pending_baseline_confirmation",
      evidence: "CONTENT_CANON; requiere confirmación técnica.",
      publicationConditions: "No publicar hasta confirmar contra auditoría real del baseline.",
      approvalOwner: "Producto / Dirección técnica",
      notes: "Mantener advertencia junto al estado.",
    },
    {
      id: "climate-recovery-pbmetrics-evolution",
      statement: "Climate Recovery es una evolución de PBMetrics.",
      kind: "roadmap",
      status: "approved_as_plan",
      evidence: "Contexto canónico de la candidatura.",
      publicationConditions:
        "Publicar como evolución o edición de competencia, no como versión productiva general si no está verificada.",
      approvalOwner: "ORBI Ecosystem SpA",
      notes: "Etiquetar como Climate Recovery Edition.",
    },
    {
      id: "ai-generates-explainable-hypotheses",
      statement: "La IA genera hipótesis explicables.",
      kind: "functional-proposal",
      status: "approved_as_objective",
      evidence: "COMPETITION_BRIEF y CONTENT_CANON",
      publicationConditions: "Publicar como objetivo/propuesta; no convertir en garantía absoluta.",
      approvalOwner: "Producto / Dirección técnica",
      notes: "Debe mostrar evidencia, confianza y limitaciones.",
    },
    {
      id: "definitive-ai-diagnosis",
      statement: "La IA diagnostica definitivamente las fallas.",
      kind: "technical-claim",
      status: "prohibited",
      evidence: "Regla de contenido.",
      publicationConditions: "No publicar.",
      approvalOwner: "N/A",
      notes: "Contradice el principio humano.",
    },
    {
      id: "specific-energy-recovery-percentage",
      statement: "El sistema recupera un porcentaje específico de energía.",
      kind: "quantitative-result",
      status: "prohibited_without_evidence",
      evidence: "Requiere medición/metodología",
      publicationConditions: "Solo publicar con evidencia verificable, metodología y aprobación.",
      approvalOwner: "Dirección técnica",
      notes: "Separar medición, estimación, simulación y proyección.",
    },
    {
      id: "active-customers",
      statement: "La empresa tiene clientes activos.",
      kind: "commercial-claim",
      status: "prohibited_without_evidence",
      evidence: "No verificado en baseline",
      publicationConditions: "No publicar sin evidencia y autorización.",
      approvalOwner: "ORBI Ecosystem SpA",
      notes: "No inventar clientes.",
    },
    {
      id: "specific-company-pilot",
      statement: "Existe un piloto con una empresa específica.",
      kind: "commercial-claim",
      status: "prohibited_without_authorization",
      evidence: "No verificado en baseline",
      publicationConditions: "No publicar sin autorización escrita y evidencia.",
      approvalOwner: "ORBI Ecosystem SpA",
      notes: "No nombrar terceros sin permiso.",
    },
    {
      id: "demo-data-is-real",
      statement: "Los datos mostrados en una demo son reales.",
      kind: "data-claim",
      status: "prohibited",
      evidence: "Requiere fuente de datos y autorización",
      publicationConditions: "Publicar solo si los datos son reales, autorizados y no sensibles.",
      approvalOwner: "Dirección técnica / Legal",
      notes: "Evitar información personal o privada.",
    },
    {
      id: "synthetic-demo-data",
      statement: "Escenario demostrativo con datos sintéticos.",
      kind: "data-claim",
      status: "approved_if_labeled",
      evidence: "Demo interna o futura.",
      publicationConditions: "Debe estar claramente rotulado como Synthetic Data.",
      approvalOwner: "Producto / Dirección técnica",
      notes: "No inducir a pensar que es operación real.",
    },
    {
      id: "avoided-co2",
      statement: "CO2 evitado.",
      kind: "climate-result",
      status: "methodology_and_source_required",
      evidence: "Requiere metodología, fuente y categoría",
      publicationConditions:
        "Publicar solo con metodología, fuente y diferenciación entre medición, estimación, simulación y proyección.",
      approvalOwner: "Dirección técnica",
      notes: "No inventar resultados climáticos.",
    },
    {
      id: "external-competition-logo-use",
      statement: "Uso de logotipo de AI for Good, ITU o competencia.",
      kind: "external-brand",
      status: "brand_authorization_required",
      evidence: "Requiere autorización o guía oficial de marca",
      publicationConditions: "No usar logotipos externos sin autorización.",
      approvalOwner: "ORBI Ecosystem SpA / Legal",
      notes: "Puede mencionarse texto de competencia sin usar logos si corresponde.",
    },
  ] satisfies CompetitionClaim[],
  statusLabels: {
    existing: "Existing",
    planned: "Planned",
    prototype: "Prototype",
    competitionEdition: "Competition Edition",
    syntheticData: "Synthetic Data",
    estimate: "Estimate",
    simulation: "Simulation",
    projection: "Projection",
  },
  competitionAssets: {
    videoUrl: null,
    pitchDeckUrl: null,
    demoUrl: null,
    showVideo: false,
    showPitchDeck: false,
    showDemo: false,
  },
} as const;
