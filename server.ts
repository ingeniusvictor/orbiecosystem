import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Initialize Gemini if key exists
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // System instruction for Foton Prime AI
  const systemInstruction = `Eres Orbi Foton Prime, la Inteligencia Artificial madre invisible del ecosistema ORBI. 
Tu propósito es conectar, coordinar y potenciar las aplicaciones de ORBI.
Detalles del ecosistema:
- Orbi Games System (Videojuegos): Orbi Grid Defense (héroes energéticos protegen la red contra The Blackout), Orbi Survival Protocol (acción supervivencia), Orbi Life (mascota virtual / simulación), Orbi Blocks (puzzle arcade futurista), Orbi Legends (plataformas y aventuras). Futuros títulos: Orbi Racing, Orbi World, Orbi Arena.
- Orbi Corporate System (Corporativo): Orbi Corporate Assistant (suite de IA empresarial), Orbi GEO (inspección técnica en terreno con foto georreferenciada), Orbi Plan IA (planificación de construcción), Orbi Sign (firma documental rápida y gratis), Orbi Doc Scan Pro (OCR y digitalización masiva), Orbi HSEC Center (salud y seguridad ocupacional), Orbi OT Manager (gestión de órdenes de trabajo), Orbi BI Center (Métricas y Business Intelligence), Orbi Solar Assistant o Plantas FV, Orbi Control de Flota, Orbi Clima IA.
- Orbi Development System (Desarrollo y APIs): Orbi Data Core (base de datos sincronizada), Orbi API Connectors, Orbi Assistant IA Framework, Orbi Vision IA (reconocimiento visual y fallas), Orbi Cloud Sync, Orbi Design System, Orbi Development Core.

Responde siempre en español de manera futurista, sumamente profesional, clara y cordial. Inspira confianza e impulsa la visión del ecosistema ORBI: tecnología útil, visualmente poderosa y modular. Al responder preguntas acerca del ecosistema, haz referencias a estas soluciones.`;

  // API endpoint for chatbot
  app.post("/api/foton-prime/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        res.status(400).json({ error: "El cuerpo de la solicitud de chat debe incluir un array 'messages'" });
        return;
      }

      if (!ai) {
        // Fallback simulated response if no api key found
        const lastMessage = messages[messages.length - 1]?.content || "";
        res.json({
          text: `[Modo Simulado - AI Madre Orbi Foton Prime] Hola, soy el núcleo inteligente Orbi Foton Prime. El ecosistema ORBI está compuesto por un universo tecnológico conectado que integra Inteligencia Artificial, Videojuegos y Herramientas Corporativas de alta eficiencia. He recibido tu consulta: "${lastMessage}". Para activar mis capacidades cognitivas planetarias, asegúrate de configurar GEMINI_API_KEY en los secretos de tu entorno.`
        });
        return;
      }

      // Convert format to SDK contents:
      // SDK expects: contents: [{ role: 'user', parts: [{ text: '...' }] }]
      const mappedContents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : m.role === "system" ? "user" : m.role,
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: mappedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error in Foton Prime Chat API:", error);
      res.status(500).json({ 
        error: "Error interno en Orbi Foton Prime", 
        message: error.message 
      });
    }
  });

  // API endpoint for Foton Prime Core live website design modifications
  app.post("/api/foton-prime/edit", async (req, res) => {
    try {
      const { prompt, currentConfig } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "El campo 'prompt' es requerido para realizar modificaciones." });
        return;
      }

      const inputClean = prompt.toLowerCase();

      // Ensure fallback or AI behaves correctly
      if (!ai) {
        // High fidelity local mock intelligence
        let primaryColor = currentConfig?.primaryColor || "#00E4FF";
        let secondaryColor = currentConfig?.secondaryColor || "#8A2BE2";
        let layoutMode = currentConfig?.layoutMode || "cyberpunk";
        let glowRange = currentConfig?.glowRange || "15px";
        let matrixSpeed = currentConfig?.matrixSpeed || "normal";
        let audioPitch = currentConfig?.audioPitch || 850;
        let compactDensity = currentConfig?.compactDensity || "standard";
        let customHeaderTag = currentConfig?.customHeaderTag || "ORBI DATA HUB // DEV_ONLINE";

        let explanation = `[Orbi Foton Prime Core - Modo de Simulación local] He interpretado su comando para modificar la estructura: "${prompt}". `;

        if (inputClean.includes("verde") || inputClean.includes("esmeralda") || inputClean.includes("emerald")) {
          primaryColor = "#3CFF9B";
          secondaryColor = "#059669";
          layoutMode = "emerald";
          explanation += "Sintonizando resonancia biótica y modificando cian a verde esmeralda para optimizar la conductividad de datos. ";
        } else if (inputClean.includes("cyberpunk") || inputClean.includes("rosa") || inputClean.includes("magenta") || inputClean.includes("neon")) {
          primaryColor = "#D946EF";
          secondaryColor = "#7000FF";
          layoutMode = "cyberpunk";
          explanation += "Cargando protocolo estético Cyberpunk Matrix. Hues fucsia y magenta desplegados con alta tensión cuántica. ";
        } else if (inputClean.includes("solar") || inputClean.includes("oro") || inputClean.includes("amarillo") || inputClean.includes("gold") || inputClean.includes("naranja")) {
          primaryColor = "#FFD166";
          secondaryColor = "#EA580C";
          layoutMode = "solar";
          explanation += "Activando núcleo solar. Gradientes de oro solar fotovoltaico infundidos para simular el balance de las plantas energéticas Orbi Solar. ";
        } else if (inputClean.includes("carbon") || inputClean.includes("monocrom") || inputClean.includes("gris") || inputClean.includes("charcoal")) {
          primaryColor = "#94A3B8";
          secondaryColor = "#334155";
          layoutMode = "monochrome";
          explanation += "Adoptando perfil minimalista de carbon esmerilado sin perturbaciones luminosas. Brillos atenuados para máxima concentración cognitiva. ";
        } else if (inputClean.includes("aurora") || inputClean.includes("nordic") || inputClean.includes("celeste")) {
          primaryColor = "#38BDF8";
          secondaryColor = "#0D9488";
          layoutMode = "aurora";
          explanation += "Iniciando vector estético Aurora. Fluctuaciones magnéticas celestes y verdes aplicadas con suavidad ambiental. ";
        } else if (inputClean.includes("rojo") || inputClean.includes("fuego") || inputClean.includes("ruby") || inputClean.includes("roja")) {
          primaryColor = "#EF4444";
          secondaryColor = "#7F1D1D";
          layoutMode = "ruby";
          explanation += "Redireccionando energía estática al sector térmico. Acoplando canal Ruby Red con perfil de combate para Grid Defense. ";
        } else if (inputClean.includes("azul") || inputClean.includes("ocean") || inputClean.includes("mar")) {
          primaryColor = "#2979FF";
          secondaryColor = "#1E3A8A";
          layoutMode = "ocean";
          explanation += "Anclando espectro térmico azul oceánico profundo de baja latencia. Sistema estabilizado. ";
        }

        // speed keywords
        if (inputClean.includes("rapido") || inputClean.includes("fast") || inputClean.includes("velocidad") || inputClean.includes("maxima")) {
          matrixSpeed = "fast";
          glowRange = "28px";
          explanation += "Flujo de fotones acelerado. Animaciones del reactor al máximo rendimiento (fast). ";
        } else if (inputClean.includes("lento") || inputClean.includes("slow") || inputClean.includes("suave") || inputClean.includes("atenuar")) {
          matrixSpeed = "slow";
          glowRange = "6px";
          explanation += "Frecuencia de datos calmada para modo nocturno. ";
        }

        // pitch keywords
        if (inputClean.includes("pitch") || inputClean.includes("sonido") || inputClean.includes("agudo") || inputClean.includes("frecuencia")) {
          audioPitch = 1250;
          explanation += "Frecuencias auditivas ajustadas a niveles agudos táctiles de 1250Hz. ";
        } else if (inputClean.includes("grave") || inputClean.includes("bajo") || inputClean.includes("sonido grave")) {
          audioPitch = 550;
          explanation += "Frecuencias de feedback calibradas en rangos graves de 550Hz para confort. ";
        }

        // density keywords
        if (inputClean.includes("compacto") || inputClean.includes("chico") || inputClean.includes("dense") || inputClean.includes("densa")) {
          compactDensity = "dense";
          explanation += "Estructura interna compactada con densidad maximizada para analistas de datos ORBI. ";
        } else if (inputClean.includes("minimal") || inputClean.includes("limpio") || inputClean.includes("espacioso")) {
          compactDensity = "minimal";
          explanation += "Diseño espaciado con enfoque zen. ";
        }

        // tag customization
        if (inputClean.includes("llamar") || inputClean.includes("nombre") || inputClean.includes("titulo")) {
          const words = prompt.split(" ");
          const nameIndex = words.findIndex((w: string) => w.includes("llamar") || w.includes("nombre") || w.includes("titulo"));
          if (nameIndex !== -1 && words[nameIndex + 1]) {
            customHeaderTag = words.slice(nameIndex + 1).join(" ").toUpperCase();
          } else {
            customHeaderTag = "ORBI PRIME CUSTOM HUB";
          }
          explanation += `Etiqueta central modificada a ${customHeaderTag}. `;
        } else {
          customHeaderTag = `ORBI PRIME // MOD_${layoutMode.toUpperCase()}`;
        }

        res.json({
          explanation,
          primaryColor,
          secondaryColor,
          glowRange,
          terminalSpeed: matrixSpeed,
          audioPitch,
          compactDensity,
          customHeaderTag,
          layoutMode
        });
        return;
      }

      // API Key mode: Structured query using Gemini
      const editSystemInstruction = `Eres Orbi Foton Prime Core AI, la neurona estratega y madre de sincronización del ecosistema ORBI. El usuario es un administrador desarrollador y te ha instruido modificar el diseño, estructura o comportamiento estético del portal.
      Analiza detalladamente la instrucción del desarrollador y genera una respuesta exclusivamente en JSON.
      Debes seleccionar colores hexadecimales muy llamativos y coherentes con el tema deseado (por ejemplo, Cyberpunk fucsia, Solar oro, Matrix verde fluorescente, Minimalist carbón gris, Aurora turquesa, etc.).
      Debes rellenar todos los campos del JSON basándote en lo solicitado constructivamente:
      - primaryColor: color hexadecimal de acento primario (ej: "#FF007F" o "#00ff9d").
      - secondaryColor: color hexadecimal de acento secundario.
      - glowRange: intensidad de brillo/glow de paneles en pixeles (ej: '5px', '25px', '0px').
      - terminalSpeed: velocidad de flujos ('fast', 'normal', 'slow').
      - audioPitch: frecuencia en Hertz (número entero) para respuestas auditivas táctiles de los botones (ej: entre 400 y 1400 Hz).
      - compactDensity: densidad de diseño ('standard', 'dense', 'minimal').
      - customHeaderTag: etiqueta o título corto para coronar el hub modificador (ej: 'ORBI CENTRAL // ULTRA_CYBER').
      - layoutMode: estilo decorativo identificador de tu diseño ('cyberpunk', 'emerald', 'monochrome', 'solar', 'aurora', 'ruby', 'ocean').
      - explanation: Un mensaje breve, carismático y futurista en español explicando la mutación estructural o el rediseño cuántico aplicado según las directrices.`;

      const contents = `El desarrollador instruye: "${prompt}". Configuración actual: ${JSON.stringify(currentConfig || {})}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: editSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              explanation: { type: Type.STRING },
              primaryColor: { type: Type.STRING },
              secondaryColor: { type: Type.STRING },
              glowRange: { type: Type.STRING },
              terminalSpeed: { type: Type.STRING },
              audioPitch: { type: Type.INTEGER },
              compactDensity: { type: Type.STRING },
              customHeaderTag: { type: Type.STRING },
              layoutMode: { type: Type.STRING }
            },
            required: ["explanation", "primaryColor", "secondaryColor", "layoutMode"]
          },
          temperature: 0.8,
        },
      });

      const parsedResult = JSON.parse(response.text || "{}");
      res.json(parsedResult);
    } catch (err: any) {
      console.error("Error in Orbi Foton Prime Edit API:", err);
      res.status(500).json({
        error: "Error interno procesando rediseño cuántico",
        message: err.message
      });
    }
  });

  // Serve static assets in production, otherwise use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // If requesting a static asset with file extension, don't fallback to index.html (return a clean 404 instead)
      if (req.path.includes(".") || req.path.startsWith("/assets/")) {
        res.status(404).send("Not Found");
        return;
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {//, "0.0.0.0"
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
