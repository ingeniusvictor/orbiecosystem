export type FotonAssistantMode = "orbi_knowledge" | "web_search" | "notion_knowledge" | "contact" | "fallback";

export interface FotonAssistantRequest {
  question: string;
  context?: {
    pageSection?: string;
    source?: "foton_widget" | "foton_prime" | "unknown";
  };
}

export interface FotonAssistantSource {
  label: string;
  type: "internal" | "notion" | "web" | "fallback";
  status: "active" | "mock" | "planned";
  url?: string;
}

export interface FotonAssistantResponse {
  mode: FotonAssistantMode;
  answer: string;
  confidence: "high" | "medium" | "low";
  status: "answered" | "mocked" | "needs_connector";
  suggestedActions: Array<{
    label: string;
    href: string;
  }>;
  sources: FotonAssistantSource[];
}

const normalizedIncludes = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function classifyIntent(question: string): FotonAssistantMode {
  const q = normalizeQuestion(question);

  if (!q || q.length < 3) {
    return "fallback";
  }

  if (normalizedIncludes(q, ["contact", "correo", "email", "cotizar", "diagnostico", "asesoria", "hablar", "reunion", "llamar"])) {
    return "contact";
  }

  if (normalizedIncludes(q, ["notion", "documento interno", "base de conocimiento", "wiki", "mcp", "talent academy", "dossier interno"])) {
    return "notion_knowledge";
  }

  if (normalizedIncludes(q, ["noticia", "actual", "hoy", "ultima", "ultimas", "precio", "tendencia", "buscar", "google", "web", "internet", "exa", "mercado"])) {
    return "web_search";
  }

  if (normalizedIncludes(q, ["orbi", "foton", "division", "servicio", "corporate", "development", "academy", "solar", "domotica", "sleep", "game", "radar", "ia", "automatizacion", "empresa"])) {
    return "orbi_knowledge";
  }

  return "fallback";
}

function answerFromOrbiKnowledge(question: string): FotonAssistantResponse {
  const q = normalizeQuestion(question);

  let answer =
    "ORBI Ecosystem es un ecosistema tecnológico creado desde Chile para convertir ideas, necesidades y procesos reales en soluciones digitales, contenido técnico, automatización, inteligencia artificial, educación, energía solar, domótica, bienestar digital y experiencias interactivas.";

  if (normalizedIncludes(q, ["corporate", "empresa", "empresas", "corporativo"])) {
    answer =
      "ORBI Corporate System reúne soluciones para empresas: asistentes, reportabilidad, documentos, inspecciones, mantenimiento, productividad, trazabilidad y herramientas internas para equipos técnicos u operativos.";
  } else if (normalizedIncludes(q, ["development", "desarrollo", "web", "app", "software", "agente"])) {
    answer =
      "ORBI Development System es la fábrica tecnológica del ecosistema: desarrolla webs, plataformas, MVPs, agentes IA, automatizaciones, conectores, dashboards y sistemas internos.";
  } else if (normalizedIncludes(q, ["academy", "educacion", "aprender", "curso", "solar academy"])) {
    answer =
      "ORBI Academy transforma conocimiento técnico en contenido claro, visual y práctico. Incluye rutas educativas como Solar Academy, microcontenidos y explicaciones desde cero para aprender tecnología, energía e IA.";
  } else if (normalizedIncludes(q, ["solar", "fotovoltaico", "panel", "bombeo", "energia"])) {
    answer =
      "ORBI Servicios Fotovoltaicos se orienta a soluciones solares para hogares, parcelas, bombeo rural, sistemas híbridos, off-grid, asesoría técnica e instalación aplicada en terreno.";
  } else if (normalizedIncludes(q, ["domotica", "automatizacion", "alexa", "hogar", "smart"])) {
    answer =
      "ORBI Automatización Inteligente busca llevar domótica simple y útil al hogar: iluminación smart, control por voz, rutinas, escenas, configuración y soporte cercano.";
  } else if (normalizedIncludes(q, ["sleep", "frecuencia", "dormir", "descanso", "bienestar"])) {
    answer =
      "ORBI Sleep Frequencies es la línea de bienestar digital de ORBI. Crea ambientes sonoros, frecuencias y experiencias audiovisuales gratuitas para descansar, desconectar y recuperar calma mental.";
  } else if (normalizedIncludes(q, ["game", "juego", "videojuego", "gamificacion"])) {
    answer =
      "ORBI Game System es la división creativa para videojuegos, mundos interactivos, narrativa, personajes ORBI, experiencias lúdicas y aprendizaje gamificado.";
  } else if (normalizedIncludes(q, ["radar", "noticias", "tecnologia", "tendencias"])) {
    answer =
      "ORBI Radar IA & Tecnología es el frente informativo del ecosistema: investiga, filtra y explica avances de IA, tecnología y oportunidades para convertir ruido informativo en conocimiento útil.";
  } else if (normalizedIncludes(q, ["foton", "chatbot", "asistente"])) {
    answer =
      "FOTON es el compañero holográfico de ORBI. En esta fase combina guía contextual, respuestas controladas y una arquitectura preparada para conectarse luego a Notion, Exa, MCP, IA local o APIs externas.";
  }

  return {
    mode: "orbi_knowledge",
    answer,
    confidence: "high",
    status: "answered",
    suggestedActions: [
      { label: "Ver dossiers ORBI", href: "#orbi-presentaciones" },
      { label: "Ver capacidades", href: "#orbi-capacidades" },
    ],
    sources: [
      {
        label: "ORBI public website knowledge base",
        type: "internal",
        status: "active",
      },
    ],
  };
}

function answerFromContactMode(): FotonAssistantResponse {
  return {
    mode: "contact",
    answer:
      "Para conversar con ORBI Ecosystem puedes enviar un correo indicando tu idea, proceso, necesidad técnica o tipo de solución que buscas. FOTON puede orientar el primer diagnóstico y derivar a contacto directo.",
    confidence: "high",
    status: "answered",
    suggestedActions: [
      {
        label: "Enviar correo",
        href: "mailto:ing.vmlp.chile@gmail.com?subject=Consulta%20desde%20FOTON&body=Hola%20ORBI%20Ecosystem,%20quiero%20conversar%20sobre%20una%20idea,%20proceso%20o%20soluci%C3%B3n.",
      },
    ],
    sources: [
      {
        label: "ORBI contact configuration",
        type: "internal",
        status: "active",
      },
    ],
  };
}

function answerFromNotionMock(question: string): FotonAssistantResponse {
  return {
    mode: "notion_knowledge",
    answer:
      `FOTON detectó que esta consulta podría resolverse mejor con una base documental interna tipo Notion/MCP. La arquitectura ya está preparada, pero el conector Notion todavía no está activo en producción. Consulta recibida: “${question}”.`,
    confidence: "medium",
    status: "needs_connector",
    suggestedActions: [
      { label: "Ver dossiers actuales", href: "#orbi-presentaciones" },
      { label: "Ver roadmap", href: "#roadmap" },
    ],
    sources: [
      {
        label: "Notion / MCP connector",
        type: "notion",
        status: "planned",
      },
    ],
  };
}

function answerFromWebSearchMock(question: string): FotonAssistantResponse {
  return {
    mode: "web_search",
    answer:
      `FOTON detectó que esta pregunta necesita búsqueda web actual. La arquitectura ya separa este modo para conectarlo luego con Exa, Google Programmable Search, Brave Search u otro proveedor. Por seguridad, esta versión todavía no inventa resultados web. Consulta recibida: “${question}”.`,
    confidence: "low",
    status: "needs_connector",
    suggestedActions: [
      { label: "Ver Radar IA", href: "#orbi-presentation-radar" },
      { label: "Ver videos ORBI", href: "#orbi-en-video" },
    ],
    sources: [
      {
        label: "Exa / web search provider",
        type: "web",
        status: "planned",
      },
    ],
  };
}

function answerFromFallback(question: string): FotonAssistantResponse {
  return {
    mode: "fallback",
    answer:
      question.trim().length > 0
        ? "FOTON todavía está en modo controlado. Puedo responder mejor preguntas sobre ORBI, sus divisiones, servicios, contacto, capacidades, dossiers o roadmap. Para preguntas externas, necesitaremos activar el conector web o una IA conectada."
        : "Escribe una pregunta sobre ORBI, sus divisiones, servicios, capacidades o contacto para que FOTON pueda orientarte.",
    confidence: "low",
    status: "answered",
    suggestedActions: [
      { label: "Ver ecosistema", href: "#ecosystem-season-one" },
      { label: "Ver capacidades", href: "#orbi-capacidades" },
    ],
    sources: [
      {
        label: "FOTON fallback policy",
        type: "fallback",
        status: "active",
      },
    ],
  };
}

export function createFotonAssistantResponse(request: FotonAssistantRequest): FotonAssistantResponse {
  const question = request.question ?? "";
  const mode = classifyIntent(question);

  switch (mode) {
    case "orbi_knowledge":
      return answerFromOrbiKnowledge(question);
    case "contact":
      return answerFromContactMode();
    case "notion_knowledge":
      return answerFromNotionMock(question);
    case "web_search":
      return answerFromWebSearchMock(question);
    default:
      return answerFromFallback(question);
  }
}
