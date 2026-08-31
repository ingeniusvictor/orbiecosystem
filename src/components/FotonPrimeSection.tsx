import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, BrainCircuit, Cpu, Play, RefreshCw, Send, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Message } from "../types";
import SectionVideo from "./SectionVideo";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { createFotonAssistantResponse, type FotonAssistantResponse } from "../server/fotonAssistant";

interface FotonPrimeSectionProps {
  onPlayVideo?: (compId: string) => void;
}

const capabilityCards = [
  {
    title: "ORBI Knowledge",
    description: "Responde desde la narrativa controlada del ecosistema: divisiones, capacidades, servicios, dossiers y contacto.",
    icon: Bot,
  },
  {
    title: "Web Search Ready",
    description: "Arquitectura preparada para conectar Exa, Brave, Google Programmable Search u otro proveedor de búsqueda web.",
    icon: BrainCircuit,
  },
  {
    title: "Notion / MCP Ready",
    description: "Diseñada para conectar una base interna tipo Notion y herramientas MCP sin mezclar lógica dentro del widget flotante.",
    icon: ShieldCheck,
  },
];

const suggestedPrompts = [
  "Explícame qué es ORBI Ecosystem en 30 segundos",
  "¿Qué divisiones tiene ORBI Platform Season 1?",
  "¿Qué productos pueden servir a una empresa?",
  "Busca noticias nuevas de IA con Exa",
  "Consulta la base Notion de ORBI",
];

function modeLabel(mode: FotonAssistantResponse["mode"]) {
  switch (mode) {
    case "orbi_knowledge":
      return "ORBI Knowledge";
    case "web_search":
      return "Web Search Ready";
    case "notion_knowledge":
      return "Notion / MCP Ready";
    case "contact":
      return "Contacto";
    default:
      return "Fallback seguro";
  }
}

function formatAssistantAnswer(response: FotonAssistantResponse) {
  const actions = response.suggestedActions.length
    ? `\n\nAcciones sugeridas:\n${response.suggestedActions.map((action) => `• ${action.label}: ${action.href}`).join("\n")}`
    : "";

  const sources = response.sources.length
    ? `\n\nFuentes / conectores:\n${response.sources.map((source) => `• ${source.label} · ${source.type} · ${source.status}`).join("\n")}`
    : "";

  return `[${modeLabel(response.mode)} · ${response.status}]\n\n${response.answer}${actions}${sources}`;
}

export default function FotonPrimeSection({ onPlayVideo }: FotonPrimeSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hola, soy Orbi Foton Prime. Esta es la consola principal para consultas más completas. El widget flotante solo entrega orientación rápida; aquí debe vivir la capa conectada a ORBI Knowledge, Web Search, Exa, Notion y MCP.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }, [messages, isLoading, prefersReducedMotion]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) {
      return;
    }

    setError(null);
    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const assistantResponse = createFotonAssistantResponse({
        question: textToSend,
        context: {
          pageSection: "foton-prime",
          source: "foton_prime",
        },
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: formatAssistantAnswer(assistantResponse),
        timestamp: new Date(),
      };

      window.setTimeout(() => {
        setMessages((previous) => [...previous, assistantMessage]);
        setIsLoading(false);
      }, 280);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Fallo de conexión con Foton Prime.";
      setError(message);
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Núcleo conversacional reiniciado. Esta consola usa el router interno de FOTON: ORBI Knowledge activo, Web Search preparado, Notion/MCP preparado y fallback seguro.",
        timestamp: new Date(),
      },
    ]);
    setError(null);
  };

  return (
    <section id="foton-prime" className="relative overflow-hidden border-y border-white/5 bg-[#030712] py-24 sm:py-28">
      <div className="absolute inset-0 grid-overlay opacity-[0.04]" aria-hidden="true" />
      <div className="absolute -left-24 top-20 h-[34rem] w-[34rem] rounded-full bg-violet-500/10 blur-3xl" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <div className="orbitron-chip inline-flex">
                <Cpu className="h-3.5 w-3.5" />
                <span>FOTON PRIME / MAIN ASSISTANT CONSOLE</span>
              </div>
              <div className="space-y-4">
                <h2 className="orbitron-title max-w-3xl">La consola principal para preguntas complejas y conectores ORBI.</h2>
                <p className="orbitron-subtitle max-w-2xl">
                  El widget flotante queda como preview rápido. Las consultas extensas, búsqueda web, Exa, Notion, MCP y futuras conexiones de IA deben vivir aquí, en FOTON Prime.
                </p>
              </div>
            </div>

            <SectionVideo
              src="/assets/videos/orbi-chatbox-ia-core.mp4"
              title="ORBI CHATBOX IA CORE"
              className="max-w-2xl"
              videoClassName="aspect-video object-cover"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              {capabilityCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.title} className="orbitron-panel p-4">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-space text-base font-black text-white">{card.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-slate-400">{card.description}</p>
                  </article>
                );
              })}
            </div>

            {onPlayVideo && (
              <button
                type="button"
                onClick={() => onPlayVideo("foton-prime")}
                className="orbitron-secondary-action"
              >
                <Play className="h-4 w-4" />
                Ver presentación de Foton Prime
              </button>
            )}
          </div>

          <div className="orbitron-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-400/25 bg-violet-400/10 text-violet-200">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
                </div>
                <div>
                  <h3 className="font-space text-sm font-black uppercase tracking-wide text-white">ORBI FOTON PRIME</h3>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">Knowledge / Web / Notion-MCP Router</p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetChat}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[10px] font-black uppercase tracking-widest text-slate-400 transition hover:border-violet-400/40 hover:text-white"
                aria-label="Reiniciar conversación de Foton Prime"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </button>
            </div>

            <div className="h-[420px] space-y-4 overflow-y-auto bg-slate-950/30 p-5 scrollbar-thin">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.role === "user"
                        ? "rounded-tr-none bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                        : "rounded-tl-none border border-white/10 bg-[#0B1026]/90 text-slate-200"
                    }`}
                  >
                    <p className="whitespace-pre-line text-xs leading-6 sm:text-sm">{message.content}</p>
                    <div className={`mt-2 font-mono text-[9px] ${message.role === "user" ? "text-violet-100" : "text-slate-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-3 rounded-2xl rounded-tl-none border border-white/10 bg-[#0B1026] px-5 py-3 text-xs text-violet-200">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300" />
                    Procesando router FOTON...
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-white/10 bg-slate-950 px-4 py-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 font-mono text-[9px] font-black uppercase tracking-widest text-violet-200">
                  <Zap className="h-3 w-3" />
                  Preguntar
                </span>
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    className="shrink-0 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 font-mono text-[10px] text-slate-300 transition hover:border-violet-400/40 hover:text-white"
                    title={prompt}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  aria-label="Pregunta para Orbi Foton Prime"
                  type="text"
                  placeholder="Pregunta larga para FOTON Prime, Exa, Notion o MCP..."
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSendMessage(input);
                    }
                  }}
                  disabled={isLoading}
                  className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 focus:border-violet-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  aria-label="Enviar pregunta a Orbi Foton Prime"
                  className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
