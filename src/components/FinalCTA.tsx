import React, { useState } from "react";
import { ArrowRight, Bot, Compass, Mail, Sparkles, X } from "lucide-react";

interface FinalCTAProps {
  onNavigate: (sectionId: string) => void;
}

export default function FinalCTA({ onNavigate }: FinalCTAProps) {
  const [showDemoAlert, setShowDemoAlert] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim()) return;
    setFormSubmitted(true);
    setTimeout(() => {
      setShowContactForm(false);
      setContactEmail("");
      setContactMessage("");
      setFormSubmitted(false);
      alert("¡Gracias por contactarte! Tu interés en Orbi Ecosystem ha sido georreferenciado y procesado. Nuestro equipo se comunicará contigo pronto.");
    }, 800);
  };

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden font-sans border-t border-slate-900 select-none">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-purple-600/5 rounded-full blur-[80px] pointer-events-none animate-pulse" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
        
        {/* Banner sparkles icon */}
        <div className="inline-flex p-3 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-emerald-500/20 rounded-2xl border border-slate-800/80 animate-bounce duration-5000">
          <Sparkles className="w-6 h-6 text-blue-400" />
        </div>

        {/* Dynamic Titles */}
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none uppercase">
            ORBI no es solo una idea.
          </h2>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400">
            Es un ecosistema en construcción.
          </h3>
        </div>

        {/* Descriptive Summary Paragraph */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
          Aplicaciones, videojuegos, inteligencia artificial, energía, productividad y diseño convergen en una misma visión: crear tecnología útil, visualmente poderosa y preparada para evolucionar hacia desafíos planetarios reales.
        </p>

        {/* Action Buttons Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md mx-auto">
          <button
            onClick={() => setShowDemoAlert(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-sm rounded-full shadow-lg shadow-blue-500/15 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Bot className="w-4 h-4" />
            <span>Iniciar Demo ORBI</span>
          </button>

          <button
            onClick={() => onNavigate("proyectos")}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-100 font-semibold text-sm rounded-full transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Compass className="w-4 h-4" />
            <span>Ver Ecosistema</span>
          </button>

          <button
            onClick={() => setShowContactForm(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-b from-slate-900 to-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-semibold text-sm rounded-full transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>Contactar</span>
          </button>
        </div>

        {/* Epílogo / Prominent Welcome Phrase */}
        <div className="pt-6">
          <span className="text-xs font-mono font-bold tracking-widest text-slate-500 uppercase block select-none">
            Welcome to the ORBI Ecosystem.
          </span>
          <span className="text-[10px] font-mono text-slate-600 tracking-wider">
            SECURE_KEY: #ORB_INIT_2026 // PORTAL_UP
          </span>
        </div>

        {/* Interactive Demo Popup alert */}
        {showDemoAlert && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
              <Bot className="w-12 h-12 text-blue-400 mx-auto" />
              <h3 className="text-xl font-bold text-white">Sincronizador Demo ORBI</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                El motor de demostraciones del ecosistema se encuentra coordinando componentes. Puedes experimentar las capacidades de nuestra inteligencia ejecutiva de inmediato utilizando la terminal de conversación de **Orbi Foton Prime** disponible en el portal.
              </p>
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowDemoAlert(false);
                    onNavigate("foton-prime");
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl cursor-pointer"
                >
                  Ir a Orbi Foton Prime
                </button>
                <button
                  onClick={() => setShowDemoAlert(false)}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 font-medium text-xs rounded-xl cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Contact Form Popup */}
        {showContactForm && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 text-left">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Contacto ORBI Ecosystem</h3>
                <button 
                  onClick={() => setShowContactForm(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmitContact} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-slate-500 font-mono tracking-wider font-bold">Tu Correo Electrónico:</label>
                  <input
                    type="email"
                    required
                    placeholder="ejemplo@correo.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs uppercase text-slate-500 font-mono tracking-wider font-bold">Mensaje o Solicitud:</label>
                  <textarea
                    rows={3}
                    placeholder="Cuéntanos en qué proyecto o división de ORBI estás interesado..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:outline-none focus:border-blue-500 text-slate-200 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={formSubmitted}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold text-sm rounded-xl cursor-pointer"
                >
                  {formSubmitted ? "Enviando..." : "Enviar Solicitud"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
