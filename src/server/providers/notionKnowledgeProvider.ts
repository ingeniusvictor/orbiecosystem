import type { FotonAssistantSource } from "../fotonAssistant";
import { getFotonProviderConfig, trimQuestionForProvider } from "./providerConfig";

export interface NotionKnowledgeResult {
  title: string;
  url?: string;
  summary: string;
}

export interface NotionKnowledgeProviderResponse {
  connected: boolean;
  answer: string;
  sources: FotonAssistantSource[];
  results: NotionKnowledgeResult[];
}

export async function searchNotionKnowledge(question: string): Promise<NotionKnowledgeProviderResponse> {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;
  const config = getFotonProviderConfig();

  if (!config.notionEnabled) {
    return {
      connected: false,
      answer:
        "Esta consulta parece necesitar una base documental interna. Notion ya está preparado en la arquitectura de FOTON Prime, pero está apagado por seguridad. Para activarlo, configura FOTON_NOTION_ENABLED=true junto con NOTION_API_KEY y NOTION_DATABASE_ID en el entorno del servidor.",
      sources: [
        {
          label: "Notion Knowledge Base",
          type: "notion",
          status: "planned",
        },
      ],
      results: [],
    };
  }

  if (!apiKey || !databaseId) {
    return {
      connected: false,
      answer:
        "Esta consulta parece necesitar una base documental interna. FOTON Prime ya tiene Notion habilitado, pero todavía faltan NOTION_API_KEY y NOTION_DATABASE_ID en el entorno. Cuando los configures, FOTON podrá buscar en la documentación interna autorizada de ORBI.",
      sources: [
        {
          label: "Notion Knowledge Base",
          type: "notion",
          status: "planned",
        },
      ],
      results: [],
    };
  }

  try {
    const safeQuestion = trimQuestionForProvider(question);

    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        page_size: config.notionMaxResults,
        filter: {
          or: [
            {
              property: "Name",
              title: {
                contains: safeQuestion.slice(0, 80),
              },
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Notion respondió con estado ${response.status}`);
    }

    const data = await response.json();
    const results: NotionKnowledgeResult[] = Array.isArray(data.results)
      ? data.results.slice(0, config.notionMaxResults).map((page: any, index: number) => {
          const properties = page.properties || {};
          const titleProperty = Object.values(properties).find((property: any) => property?.type === "title") as any;
          const title = titleProperty?.title?.[0]?.plain_text || `Documento Notion ${index + 1}`;

          return {
            title,
            url: page.url,
            summary: "Documento localizado en la base Notion autorizada. La fase siguiente puede leer bloques internos y generar un resumen más profundo.",
          };
        })
      : [];

    const answer = results.length
      ? `Encontré ${results.length} documento(s) en la base Notion autorizada. Esta primera integración confirma conexión y recuperación de páginas. Próximo paso: leer bloques internos y resumir contenido específico.`
      : "Notion respondió correctamente, pero no encontré documentos relacionados en la base configurada.";

    return {
      connected: true,
      answer,
      results,
      sources: results.map((result) => ({
        label: result.title,
        type: "notion" as const,
        status: "active" as const,
        url: result.url,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido consultando Notion.";

    return {
      connected: false,
      answer: `FOTON intentó consultar Notion, pero no pudo completar la búsqueda interna. Detalle técnico: ${message}`,
      sources: [
        {
          label: "Notion Knowledge Base",
          type: "notion",
          status: "planned",
        },
      ],
      results: [],
    };
  }
}
