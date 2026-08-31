import type { FotonAssistantSource } from "../fotonAssistant";
import { getFotonProviderConfig, trimQuestionForProvider } from "./providerConfig";

export interface ExternalSearchResult {
  title: string;
  url: string;
  summary: string;
}

export interface ExternalSearchProviderResponse {
  connected: boolean;
  answer: string;
  sources: FotonAssistantSource[];
  results: ExternalSearchResult[];
}

export async function searchWithExa(question: string): Promise<ExternalSearchProviderResponse> {
  const apiKey = process.env.EXA_API_KEY;
  const config = getFotonProviderConfig();

  if (!config.exaEnabled) {
    return {
      connected: false,
      answer:
        "Esta consulta necesita búsqueda web externa. Exa ya está preparado en la arquitectura de FOTON Prime, pero está apagado por seguridad. Para activarlo, configura FOTON_EXA_ENABLED=true junto con EXA_API_KEY en el entorno del servidor.",
      sources: [
        {
          label: "Exa Search API",
          type: "web",
          status: "planned",
        },
      ],
      results: [],
    };
  }

  if (!apiKey) {
    return {
      connected: false,
      answer:
        "Esta consulta necesita búsqueda web externa. FOTON Prime ya tiene Exa habilitado, pero todavía no detecto EXA_API_KEY configurada en el entorno. Cuando agregues esa clave, FOTON podrá buscar fuentes reales y responder con referencias.",
      sources: [
        {
          label: "Exa Search API",
          type: "web",
          status: "planned",
        },
      ],
      results: [],
    };
  }

  try {
    const safeQuestion = trimQuestionForProvider(question);

    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: safeQuestion,
        numResults: config.exaMaxResults,
        useAutoprompt: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa respondió con estado ${response.status}`);
    }

    const data = await response.json();
    const results: ExternalSearchResult[] = Array.isArray(data.results)
      ? data.results.slice(0, config.exaMaxResults).map((result: any) => ({
          title: String(result.title || "Resultado sin título"),
          url: String(result.url || ""),
          summary: String(result.text || result.summary || "Fuente encontrada por Exa.").slice(0, 420),
        }))
      : [];

    const answer = results.length
      ? `Encontré ${results.length} resultado(s) externos relacionados. Esta primera búsqueda con Exa entrega fuentes para revisión: ${results
          .map((result, index) => `${index + 1}. ${result.title}`)
          .join(" ")}. Próximo paso: conectar una capa de síntesis para generar una respuesta final con citas y análisis ORBI.`
      : "Exa respondió correctamente, pero no entregó resultados relevantes para esta consulta.";

    return {
      connected: true,
      answer,
      results,
      sources: results.map((result) => ({
        label: result.title,
        type: "web" as const,
        status: "active" as const,
        url: result.url,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido consultando Exa.";

    return {
      connected: false,
      answer: `FOTON intentó consultar Exa, pero no pudo completar la búsqueda externa. Detalle técnico: ${message}`,
      sources: [
        {
          label: "Exa Search API",
          type: "web",
          status: "planned",
        },
      ],
      results: [],
    };
  }
}
