import type { FotonAssistantSource } from "../fotonAssistant";

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

  if (!apiKey) {
    return {
      connected: false,
      answer:
        "Esta consulta necesita búsqueda web externa. FOTON Prime ya está preparado para usar Exa, pero todavía no detecto EXA_API_KEY configurada en el entorno. Cuando agregues esa clave, FOTON podrá buscar fuentes reales y responder con referencias.",
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
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: question,
        numResults: 5,
        useAutoprompt: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Exa respondió con estado ${response.status}`);
    }

    const data = await response.json();
    const results: ExternalSearchResult[] = Array.isArray(data.results)
      ? data.results.slice(0, 5).map((result: any) => ({
          title: String(result.title || "Resultado sin título"),
          url: String(result.url || ""),
          summary: String(result.text || result.summary || "Fuente encontrada por Exa."),
        }))
      : [];

    const answer = results.length
      ? `Encontré ${results.length} resultado(s) externos relacionados. Como esta fase aún no usa un modelo generativo conectado para sintetizar fuentes, te dejo una lectura inicial basada en los títulos y fragmentos disponibles: ${results
          .map((result, index) => `${index + 1}. ${result.title}`)
          .join(" ")}.`
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
