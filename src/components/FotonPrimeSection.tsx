import React, { useState, useRef, useEffect } from "react";
import { Cpu, Send, Bot, Sparkles, AlertCircle, RefreshCw, Zap, Play } from "lucide-react";
import { Message } from "../types";
import SectionVideo from "./SectionVideo";

interface FotonPrimeSectionProps {
  onPlayVideo?: (compId: string) => void;
}

export default function FotonPrimeSection({ onPlayVideo }: FotonPrimeSectionProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Saludos, explorador. Soy Orbi Foton Prime, el nexo cognitivo unificado de nuestro ecosistema digital. Regulo las divisiones Games, Corporate e Infraestructura. ¿En qué dimensión de nuestra visión tecnológica deseas profundizar hoy?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const badges = [
    "IA Central",
    "Ecosistema Modular",
    "Asistentes Especializados",
    "Conectores API",
    "Automatización",
    "Futuro Escalable"
  ];

  const suggestedPrompts = [
    "¿Qué es la división de videojuegos (Orbi Games System)?",
    "Explícame cómo funciona ORBI GEO y ORBI PLAN IA",
    "¿Qué hace diferente a ORBI de otras plataformas?",
    "¿Cómo coordinas Orbi Sign y la firma gratuita de documentos?"
  ];

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      role: "user",
      content: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch("/api/foton-prime/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!response.ok) {
        throw new Error("La terminal de Orbi Foton Prime no respondió correctamente.");
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.text || "Fallo en la sincronización neuronal del núcleo.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Fallo de conexión aérea con Foton Prime.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Nexo cognitivo reiniciado. Orbi Foton Prime reconectándose. ¿Cuál es el nuevo foco tecnológico a discutir?",
        timestamp: new Date()
      }
    ]);
    setError(null);
  };

  return (
    <section
      id="foton-prime"
      className="py-24 bg-[#050816] border-y border-slate-900 relative overflow-hidden"
    >
      {/* Background glow effects */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute left-10 bottom-10 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Concept Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3.5 py-1 rounded-full text-xs font-semibold text-energy-cyan tracking-wider font-mono">
              <Cpu className="w-3.5 h-3.5 text-energy-cyan animate-pulse" />
              <span>NUX SMART CORE // IA MADRE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none font-space">
              Orbi Foton Prime
            </h2>
            <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 leading-normal font-space">
              La IA madre invisible del ecosistema ORBI
            </h3>

            <p className="text-slate-350 text-sm sm:text-base leading-relaxed font-light">
              Orbi Foton Prime es el nexo inteligente que unifica la visión central de ORBI. Coordina y eleva las distintas aplicaciones, permitiendo interoperabilidad continua, auto-categorización y resolución de flujos críticos de la red.
            </p>

            <SectionVideo
              src="/assets/videos/orbi-chatbox-ia-core.mp4"
              title="ORBI IA CORE"
              className="max-w-xl"
              videoClassName="aspect-video object-cover"
            />

            {/* Cinematic Presentation Watcher trigger */}
            {onPlayVideo && (
              <div className="pt-3 pb-1">
                <button
                  onClick={() => {
                    onPlayVideo("foton-prime");
                  }}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-950/40 to-indigo-950/40 hover:from-[#150F2E] hover:to-[#17123A] border border-purple-550/30 hover:border-purple-400 px-4 py-2.5 rounded-xl cursor-pointer group transition-all duration-350"
                >
                  <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shrink-0">
                    <Play className="w-2.5 h-2.5 shrink-0" />
                  </span>
                  <div className="text-left leading-tight">
                    <div className="text-[7.5px] font-mono text-purple-400 uppercase tracking-widest font-black leading-none">PRESENTACIÓN COMPONENTES</div>
                    <div className="text-[11px] font-bold text-white tracking-wide mt-0.5 group-hover:text-purple-300 transition-colors">Ver Demostración de Foton Prime AI</div>
                  </div>
                </button>
              </div>
            )}

            {/* Badges Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 select-none">
              {badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-2 bg-slate-950/80 border border-slate-900 px-4 py-3 rounded-xl hover:border-purple-500/35 hover:scale-[1.01] transition-all duration-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-xs sm:text-sm font-medium text-slate-200 tracking-wide">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Chat Widget Panel */}
          <div className="lg:col-span-7">
            <div className="glass-panel border rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[520px] max-w-full glass-panel-glow-purple">
              
              {/* Header Terminal */}
              <div className="bg-[#0B1026]/80 px-5 py-4 border-b border-slate-900 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative select-none">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center p-[1px] shadow-lg shadow-purple-500/20">
                      <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-bold tracking-wide leading-none font-space">ORBI FOTON PRIME</h4>
                    <span className="text-[9px] text-slate-500 font-mono tracking-wide leading-none">NEXUS STATUS: COGNITIVE_ACTIVE // LAT_0x08</span>
                  </div>
                </div>

                <button
                  onClick={resetChat}
                  title="Reiniciar conversación"
                  className="p-1.5 px-3 bg-[#050816] hover:bg-slate-900 border border-slate-800 text-slate-500 hover:text-white rounded-lg transition-colors flex items-center space-x-1.5 text-[10px] font-mono cursor-pointer font-bold tracking-wider"
                >
                  <RefreshCw className="w-3 h-3 text-purple-400" />
                  <span>RESET</span>
                </button>
              </div>

              {/* Chat Message Window */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 bg-[#050816]/30">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      message.role === "user" ? "justify-end animate-fade-in" : "justify-start animate-fade-in"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-900/20"
                          : "bg-[#0B1026]/90 text-slate-200 rounded-tl-none border border-slate-900"
                      }`}
                    >
                      <p className="whitespace-pre-line text-xs sm:text-sm font-light leading-relaxed">{message.content}</p>
                      <div
                        className={`text-[9px] mt-1.5 font-mono ${
                          message.role === "user" ? "text-purple-200 text-right" : "text-slate-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Pulsing Indicator */}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-[#0B1026] border border-slate-900 rounded-2xl rounded-tl-none px-5 py-3 text-sm text-slate-400 flex items-center space-x-3">
                      <div className="flex space-x-1.5 items-center">
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100" />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-200" />
                        <span className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-300" />
                      </div>
                      <span className="text-[10px] font-mono text-purple-400 tracking-wider">PROCESANDO CORE...</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start space-x-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Error de Sincronización:</p>
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions chips at bottom */}
              <div className="bg-slate-950 px-4 py-2 border-t border-slate-900 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center space-x-2">
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase flex items-center space-x-1 shrink-0 select-none font-bold">
                  <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
                  <span>PREGUNTAR:</span>
                </span>
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-[10px] bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 text-slate-300 hover:text-white px-3 py-1 rounded-full transition-all duration-300 cursor-pointer text-ellipsis overflow-hidden max-w-[190px] font-mono"
                    title={prompt}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input container */}
              <div className="p-4 bg-[#0B1026]/90 border-t border-slate-900 flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Escribe tu pregunta para Orbi Foton Prime..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-3 text-xs sm:text-sm disabled:opacity-85 disabled:cursor-not-allowed font-light"
                />
                <button
                  onClick={() => handleSendMessage(input)}
                  disabled={isLoading || !input.trim()}
                  className="p-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg hover:shadow-purple-500/25 active:scale-95 duration-200 cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
