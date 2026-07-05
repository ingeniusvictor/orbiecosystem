import { Product, Division, Benefit, RoadmapPhase } from "./types";

export const DIVISIONS: Division[] = [
  {
    id: "games",
    name: "Orbi Games System",
    subtitle: "Entretenimiento, aventuras y experiencias interactivos",
    description: "División enfocada en videojuegos, mundos interactivos, personajes energéticos, experiencias 2D, 2.5D y 3D, minijuegos, tower defense, survival, plataformas y aventuras del universo ORBI.",
    colorClass: "blue",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/20",
    textColor: "text-blue-400",
    iconName: "Gamepad2",
    includes: [
      "Orbi Grid Defense",
      "Orbi Survival Protocol",
      "Orbi Life",
      "Orbi Blocks",
      "Orbi Legends",
      "Sinergia de Logros",
      "Cuentas Unificadas"
    ]
  },
  {
    id: "corporate",
    name: "Orbi Corporate System",
    subtitle: "Soluciones empresariales inteligentes y productividad",
    description: "División enfocada en productividad, operación y mantenimiento, inspección técnica, gestión documental, planificación, reportabilidad, flujos empresariales y asistentes IA para trabajo real en terreno y oficina.",
    colorClass: "green",
    borderColor: "border-emerald-500/30",
    glowColor: "shadow-emerald-500/20",
    textColor: "text-emerald-400",
    iconName: "Briefcase",
    includes: [
      "Orbi Corporate Assistant",
      "Orbi GEO",
      "Orbi Plan IA",
      "Orbi Docs IA",
      "Orbi Sign",
      "Orbi Doc Scan Pro",
      "Orbi HSEC Center",
      "Orbi OT Manager",
      "Orbi BI Center"
    ]
  },
  {
    id: "development",
    name: "Orbi Development System",
    subtitle: "Infraestructura, APIs y automatización inteligente",
    description: "División enfocada en arquitectura interna, APIs, conectores, módulos IA, sincronización entre plataformas, diseño de componentes y expansión futura del universo ORBI.",
    colorClass: "purple",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/20",
    textColor: "text-purple-400",
    iconName: "Code",
    includes: [
      "Orbi Data Core",
      "Orbi API Connectors",
      "Orbi Assistant IA Framework",
      "Orbi Vision IA",
      "Orbi Cloud Sync",
      "Orbi Design System"
    ]
  }
];

export const PRODUCTS: Product[] = [
  // CORPORATE DIVISION
  {
    id: "orbi-geo",
    name: "ORBI GEO",
    category: "Smart Field Inspection Platform",
    status: "Android funcional",
    description: "Aplicación avanzada para inspección técnica en terreno con fotografía georreferenciada segura, modo Field rápido, modo Pro de captura, metadatos enriquecidos, OCR con lectura automática y flujo profesional de entrega de reportes.",
    tags: ["Android", "Inspección", "Georreferencia", "Field / Pro", "OCR"],
    division: "corporate"
  },
  {
    id: "orbi-plan-ia",
    name: "ORBI PLAN IA",
    category: "Construction & Planning Intelligence",
    status: "En desarrollo",
    description: "Plataforma inteligente para la planificación diaria y semanal de obras, asignación de tareas por recinto, carga y análisis de planos en formato PDF, checklists fotográficos, calendarios integrados, diagramas de Gantt y automatización aplicada a la construcción.",
    tags: ["Planificación", "Construcción", "IA", "Gantt", "Android"],
    division: "corporate"
  },
  {
    id: "orbi-docs-ia",
    name: "ORBI DOCS IA",
    category: "AI Document Workspace",
    status: "Prototipo",
    description: "Herramienta web de trabajo documental asistido por IA, preparada como demo estática dentro del ecosistema ORBI para crear, revisar y gestionar documentos desde una interfaz independiente.",
    tags: ["Documentos", "IA", "Web Demo", "Productividad", "Workspace"],
    division: "corporate",
    launchUrl: "/orbi-docs/"
  },
  {
    id: "orbi-sign",
    name: "ORBI SIGN",
    category: "Document Signature Platform",
    status: "En desarrollo",
    description: "Aplicación diseñada para firmar documentos en PDF de manera rápida, simple y completamente segura. Desarrollada para usuarios individuales y empresas que necesitan una alternativa directa, amigable y eficiente frente a herramientas tradicionales de pago.",
    tags: ["Firma digital", "PDF", "Documentos", "Productividad"],
    division: "corporate"
  },
  {
    id: "orbi-corporate-assistant",
    name: "ORBI CORPORATE ASSISTANT",
    category: "Enterprise AI Suite",
    status: "En expansión",
    description: "Suite corporativa unificada y modular diseñada para integrar monitoreo de variables de negocio, procesamiento inteligente de documentos, administración de Operación y Mantenimiento (O&M), control de HSEC, planificación dinámica y asistentes virtuales entrenados en el contexto empresarial.",
    tags: ["IA", "O&M", "Empresa", "Automatización", "Dashboard"],
    division: "corporate"
  },
  {
    id: "orbi-solar-assistant",
    name: "ORBI SOLAR ASSISTANT",
    category: "Renewable O&M Advisor",
    status: "En desarrollo",
    description: "Asistente técnico predictivo para la operación y el mantenimiento de plantas solares a escala PMGD e Utility Scale. Conectado al clima y lecturas del inversor para detectar fallas y optimizar los flujos de personal de limpieza.",
    tags: ["Energía", "Solar", "O&M", "Predicción"],
    division: "corporate"
  },
  {
    id: "orbi-doc-scan-pro",
    name: "ORBI DOC SCAN PRO",
    category: "Intelligent Document Processing",
    status: "En desarrollo",
    description: "Motor inteligente de procesamiento de archivos para digitalización masiva que utiliza algoritmos de OCR profundo para extraer facturas, contratos u hojas de ruta manuales en segundos.",
    tags: ["OCR", "Documentos", "Automatización", "Finanzas"],
    division: "corporate"
  },
  {
    id: "orbi-hsec-center",
    name: "ORBI HSEC CENTER",
    category: "Risk & Safety Platform",
    status: "En desarrollo",
    description: "Plataforma integral de seguridad, salud ocupacional e inspección de riesgos en proyectos industriales. Permite rellenar AST digitales de manera instantánea y generar bitácoras de incidentes.",
    tags: ["Seguridad", "HSEC", "Normativa", "Android"],
    division: "corporate"
  },
  {
    id: "orbi-workspace",
    name: "ORBI WORKSPACE",
    category: "Collaboration Hub",
    status: "En desarrollo",
    description: "Consola unificada de colaboración virtual para equipos. Incluye calendarios sincronizados, salas de conversación seguras, espacios de trabajo colaborativos y resúmenes automáticos de reuniones.",
    tags: ["Productividad", "Colaboración", "Calendario", "Chat"],
    division: "corporate"
  },
  {
    id: "orbi-plantas-fv",
    name: "ORBI PLANTAS FV",
    category: "Photovoltaic Asset Management",
    status: "Concepto avanzado",
    description: "Herramienta técnica de inventario de equipos y georreferenciación de seguidores, trackers e inversores para grandes carteras de activos fotovoltaicos.",
    tags: ["Energía", "Solar", "Dashboard", "Inventario"],
    division: "corporate"
  },
  {
    id: "orbi-clima-ia",
    name: "ORBI CLIMA IA",
    category: "Climatological Solar Yield IA",
    status: "Concepto avanzado",
    description: "Módulo predictivo que estima de manera avanzada la producción de plantas solares según proyecciones de irradiancia y nubosidad satelital procesadas por IA.",
    tags: ["Clima", "Solar", "Predicción", "IA"],
    division: "corporate"
  },
  {
    id: "orbi-bi-center",
    name: "ORBI BI CENTER",
    category: "Business Intelligence Hub",
    status: "En expansión",
    description: "Tablero dinámico de control de analítica de datos. Centraliza las métricas operacionales extraídas de Orbi GEO, Orbi Plan y Orbi OT Manager para visualización ejecutiva.",
    tags: ["Analytics", "KPI", "Negocio", "Gantt"],
    division: "corporate"
  },
  {
    id: "orbi-ot-manager",
    name: "ORBI OT MANAGER",
    category: "Work Order Management",
    status: "En desarrollo",
    description: "Software para la gestión técnica de órdenes de trabajo. Permite despachar cuadrillas técnicas, adjuntar planos asociados con Orbi Plan IA y cerrar órdenes con firma digital en Orbi Sign.",
    tags: ["O&M", "Soporte", "Cuadrillas", "Firma"],
    division: "corporate"
  },

  // GAMES DIVISION
  {
    id: "orbi-grid-defense",
    name: "ORBI GRID DEFENSE",
    category: "Tower Defense Game",
    status: "Prototipo",
    description: "Videojuego táctico del tipo tower defense donde debes comandar héroes de energía pura con habilidades especiales para proteger la red de distribución espacial contra el avance destructivo de The Blackout.",
    tags: ["Tower Defense", "Energía", "Estrategia", "The Blackout"],
    division: "games"
  },
  {
    id: "orbi-survival-protocol",
    name: "ORBI SURVIVAL PROTOCOL",
    category: "Action Survival Game",
    status: "En desarrollo",
    description: "Juego de acción y supervivencia estilo roguelite con perspectiva aérea. Controla guerreros Orbi interactuando en mapas extensos con mecánicas rápidas de evolución de habilidades, batallas de oleadas y jefes gigantescos.",
    tags: ["Survival", "Android", "Acción", "Héroes", "Jefes"],
    division: "games"
  },
  {
    id: "orbi-life",
    name: "ORBI LIFE",
    category: "Virtual Energy Companion",
    status: "Concepto avanzado",
    description: "Simulador de compañía energética virtual o mascota interactiva, donde los seres Orbi nacen, se alimentan de energía limpia, juegan minijuegos educativos y evolucionan para interactuar con otros ecosistemas del lore ORBI.",
    tags: ["Mascota virtual", "Minijuegos", "Evolución", "Energía"],
    division: "games"
  },
  {
    id: "orbi-blocks",
    name: "ORBI BLOCKS",
    category: "Puzzle / Arcade Game",
    status: "En desarrollo",
    description: "Un juego de lógica espacial y puzzle con piezas redondeadas que reaccionan con física energética. Se inspira en dinámicas arcade clásicas pero reimaginadas con una interfaz futurista, desafíos contrarreloj y efectos visuales de alta tensión.",
    tags: ["Puzzle", "Arcade", "Blocks", "Energía"],
    division: "games"
  },
  {
    id: "orbi-legends",
    name: "ORBI LEGENDS",
    category: "Platform Adventure Game",
    status: "Concepto en expansión",
    description: "Plataformas de acción moderno en mundos de energía en ruinas. El jugador debe encarnar al último Orbi Foton para reactivar los núcleos inactivos del planeta y evitar que 'The Blackout' consuma el universo.",
    tags: ["Plataformas", "Aventura", "Lore ORBI", "Guardianes"],
    division: "games"
  },

  // DEVELOPMENT DIVISION
  {
    id: "orbi-data-core",
    name: "ORBI DATA CORE",
    category: "Ecosystem Sync Database",
    status: "Estable",
    description: "Núcleo de almacenamiento seguro, descentralizado y de alto rendimiento que unifica la sesión, perfiles y datos cruzados entre el sistema corporativo y los perfiles de jugadores de Orbi Games.",
    tags: ["Base de Datos", "Sincronización", "Seguridad", "API"],
    division: "development"
  },
  {
    id: "orbi-api-connectors",
    name: "ORBI API CONNECTORS",
    category: "Ecosystem Integrations Engine",
    status: "Estable",
    description: "Puertas de enlace (gateways) y conectores API modulares que permiten a plataformas de terceros interactuar con las herramientas de firma, georreferenciación y planificación de ORBI.",
    tags: ["APIs", "Integraciones", "Seguridad", "Desarrollador"],
    division: "development"
  },
  {
    id: "orbi-assistant-ia-framework",
    name: "ORBI ASSISTANT IA FRAMEWORK",
    category: "AI Agent Development Kit",
    status: "En expansión",
    description: "Framework nativo para el despliegue de agentes inteligentes conversacionales. Orbi Foton Prime utiliza este framework para alimentar con plantillas de lenguaje natural y memoria de contexto y vectores a cada aplicación especializada.",
    tags: ["IA", "Framework", "NLP", "Memoria"],
    division: "development"
  },
  {
    id: "orbi-vision-ia",
    name: "ORBI VISION IA",
    category: "Computer Vision Core",
    status: "Prototipo",
    description: "Módulo especializado de procesamiento de imágenes con inteligencia artificial para la detección visual de grietas en paneles solares, roturas en terreno y lectura inteligente OCR en Orbi GEO y Orbi Foton Prime.",
    tags: ["Computer Vision", "IA", "Fallas", "Detección"],
    division: "development"
  },
  {
    id: "orbi-cloud-sync",
    name: "ORBI CLOUD SYNC",
    category: "Real-time Synchronization Platform",
    status: "Estable",
    description: "Módulo cloud optimizado para la sincronización remota e instantánea de datos, garantizando una latencia bajísima en la transferencia de estados de partidas, firmas de documentos e inspecciones en terreno.",
    tags: ["Sincronización", "Cloud", "SaaS", "Real-Time"],
    division: "development"
  },
  {
    id: "orbi-design-system",
    name: "ORBI DESIGN SYSTEM",
    category: "Ecosystem UI Guidelines",
    status: "Estable",
    description: "Librería de componentes UI, directrices estéticas, paletas de colores unificadas, tipografías y recursos gráficos futuristas compartidos para construir el desarrollo armonioso del universo ORBI en Web y Móvil.",
    tags: ["Design System", "CSS", "UI", "Componentes"],
    division: "development"
  }
];

export const BENEFITS: Benefit[] = [
  {
    title: "Ecosistema Modular",
    description: "Cada aplicación puede funcionar de manera independiente para resolver una necesidad específica, pero también se integra orgánicamente en el universo unificado ORBI compartiendo datos y configuraciones.",
    iconName: "Layers"
  },
  {
    title: "IA como Núcleo Estratégico",
    description: "La super-inteligencia centralizada Orbi Foton Prime permite articular y proyectar una arquitectura escalable donde cada solución tiene su propio agente de IA especializado conectado a un cerebro central común.",
    iconName: "Brain"
  },
  {
    title: "Aplicaciones para Problemas Reales",
    description: "ORBI no nace de fantasías; nace desde necesidades críticas reales del terreno: operaciones logísticas, control de obras, validación legal de firmas, georreferenciación y productividad de oficina.",
    iconName: "CheckCircle"
  },
  {
    title: "Universo Visual Propio",
    description: "Nuestra identidad estética de tono energético y futurista genera un entorno visual sumamente reconocible, cohesivo y escalable tanto para usuarios corporativos como para jugadores digitales.",
    iconName: "Sparkles"
  },
  {
    title: "Potencial Comercial Amplio",
    description: "Un modelo de escalabilidad integral: desde el sector B2B con suscripciones SaaS para flujos corporativos, hasta el sector B2C mediante videojuegos móviles, microtransacciones e integraciones API premium.",
    iconName: "TrendingUp"
  },
  {
    title: "Preparado para Expansión Futura",
    description: "El ecosistema mantiene una arquitectura técnica abierta gracias a Orbi API Connectors y Orbi Data Core, permitiendo desarrollar e inyectar nuevas unidades funcionales sin interrumpir el funcionamiento general.",
    iconName: "Zap"
  }
];

export const ROADMAP: RoadmapPhase[] = [
  {
    phase: "Fase 1",
    title: "Identidad y Portal Web",
    subtitle: "Consolidación de Marca",
    description: "Lanzamiento oficial de la landing page unificada del ecosistema ORBI, mapas conceptuales del ecosistema e integración conceptual de Orbi Foton Prime.",
    status: "completo"
  },
  {
    phase: "Fase 2",
    title: "Aplicaciones Base",
    subtitle: "Productividad y Campo",
    description: "Evolución técnica de soluciones pilares: Orbi GEO, Orbi Sign, Orbi Plan IA y Orbi Corporate Assistant con capacidades funcionales de sincronización y usabilidad móvil.",
    status: "actual"
  },
  {
    phase: "Fase 3",
    title: "Juegos ORBI",
    subtitle: "Entretenimiento y Lógica",
    description: "Evolución y desarrollo de betas interactivas para Orbi Grid Defense y Orbi Survival Protocol, y estructuración de conceptos lúdicos para Orbi Life y Orbi Blocks.",
    status: "siguiente"
  },
  {
    phase: "Fase 4",
    title: "IA Central",
    subtitle: "Orbi Foton Prime",
    description: "Consolidación del cerebro de IA Foton Prime como el core de procesamiento de lenguaje y modelos de visión del ecosistema, distribuyendo conocimiento a los asistentes internos.",
    status: "futuro"
  },
  {
    phase: "Fase 5",
    title: "Integraciones",
    subtitle: "Conectores y Sincronización",
    description: "Disponibilidad de Orbi API Connectors y Orbi Cloud Sync para partners externos y unificación definitiva de la cuenta única ORBI ID.",
    status: "futuro"
  },
  {
    phase: "Fase 6",
    title: "Expansión Comercial",
    subtitle: "Lanzamiento y Demos",
    description: "Publicación de aplicaciones en tiendas móviles, despliegue global de demos B2B interactivas, campañas comerciales y presentación del ecosistema para aliados estratégicos.",
    status: "futuro"
  }
];
