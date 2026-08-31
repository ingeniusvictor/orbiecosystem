import { ArrowRight, Bot, Mail, MessageCircle, Sparkles } from "lucide-react";

interface GuidedAnswer {
  id: string;
  question: string;
  answer: string;
  actionLabel?: string;
  actionHref?: string;
}

interface FotonGuidedChatProps {
  selectedQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
  onOpenPrime: () => void;
}

export const fotonGuidedAnswers: GuidedAnswer[] = [
  {
    id: "que-es-orbi",
    question: "¿Qué es ORBI?",
    answer:
      "ORBI es un ecosistema tecnológico chileno que combina IA, software, educación, energía solar, domótica, bienestar digital y experiencias interactivas.",
    actionLabel: "Ver ecosistema",
    actionHref: "#ecosystem-season-one",
  },
  {
    id: "servicios",
    question: "¿Qué servicios ofrecen?",
    answer:
      "ORBI puede apoyar con agentes IA, webs, automatización, dashboards, documentación, contenido técnico, asesoría solar, domótica y prototipos digitales.",
    actionLabel: "Ver capacidades",
    actionHref: "#orbi-capacidades",
  },
  {
    id: "construir",
    question: "¿Qué puede construir ORBI?",
    answer:
      "ORBI puede transformar ideas o procesos manuales en herramientas funcionales: landing, app, asistente, flujo automatizado, dossier, panel interno o MVP.",
    actionLabel: "Ver dossiers",
    actionHref: "#orbi-presentaciones",
  },
  {
    id: "foton",
    question: "¿Qué es FOTON?",
    answer:
      "FOTON es el compañero holográfico de ORBI. El widget orienta rápido; FOTON Prime será la consola principal conectada a Knowledge, Web Search, Notion y MCP.",
    actionLabel: "Zona FOTON",
    actionHref: "#foton-prime",
  },
  {
    id: "contacto",
    question: "¿Cómo contacto a ORBI?",
    answer:
      "Puedes contactar a ORBI para conversar sobre una idea, piloto, solución digital, automatización, contenido técnico, asesoría solar o colaboración.",
    actionLabel: "Enviar correo",
    actionHref:
      "mailto:ing.vmlp.chile@gmail.com?subject=Consulta%20a%20ORBI%20FOTON&body=Hola%20ORBI%20Ecosystem,%20quiero%20conversar%20sobre%20una%20idea,%20servicio%20o%20soluci%C3%B3n.",
  },
];

export default function FotonGuidedChat({ selectedQuestionId, onSelectQuestion, onOpenPrime }: FotonGuidedChatProps) {
  const selectedAnswer = fotonGuidedAnswers.find((answer) => answer.id === selectedQuestionId) ?? fotonGuidedAnswers[0];

  return (
    <div className="mt-4 rounded-3xl border border-cyan-300/15 bg-slate-950/42 p-3 ring-1 ring-white/[0.045] backdrop-blur-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-yellow-200/15 bg-yellow-200/10 text-yellow-100 shadow-lg shadow-yellow-950/20">
          <Bot className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3.5 w-3.5 text-cyan-100" aria-hidden="true" />
            <p className="font-mono text-[8.5px] font-black uppercase tracking-[0.18em] text-cyan-100">Pregúntale a FOTON</p>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-slate-300">
            Vista rápida. Para consultas largas, búsqueda web, Notion o MCP, abre la consola principal FOTON Prime.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {fotonGuidedAnswers.map((answer) => (
          <button
            key={answer.id}
            type="button"
            onClick={() => onSelectQuestion(answer.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 font-mono text-[8px] font-black uppercase tracking-[0.12em] transition ${
              answer.id === selectedAnswer.id
                ? "border border-cyan-200/30 bg-cyan-300/15 text-cyan-50 shadow-lg shadow-cyan-950/20"
                : "border border-white/10 bg-white/[0.045] text-slate-300 hover:bg-white/[0.085] hover:text-white"
            }`}
          >
            {answer.question}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3">
        <p className="font-space text-sm font-black leading-tight text-white">{selectedAnswer.question}</p>
        <p className="mt-2 line-clamp-4 text-xs leading-5 text-slate-300">{selectedAnswer.answer}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {selectedAnswer.actionHref && selectedAnswer.actionLabel && (
            <a
              href={selectedAnswer.actionHref}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 font-mono text-[8.5px] font-black uppercase tracking-[0.13em] text-cyan-50 transition hover:bg-cyan-300/[0.14]"
            >
              {selectedAnswer.actionHref.startsWith("mailto:") ? <Mail className="h-3 w-3" aria-hidden="true" /> : <Sparkles className="h-3 w-3" aria-hidden="true" />}
              {selectedAnswer.actionLabel}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </a>
          )}

          <button
            type="button"
            onClick={onOpenPrime}
            className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.10] px-3 py-1.5 font-mono text-[8.5px] font-black uppercase tracking-[0.13em] text-violet-50 transition hover:bg-violet-300/[0.16]"
          >
            Abrir en FOTON Prime
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenPrime}
        className="mt-3 w-full rounded-2xl bg-gradient-to-r from-violet-600/85 via-blue-600/80 to-cyan-500/80 px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-blue-950/20 transition hover:brightness-110"
      >
        Consulta compleja / Exa / Notion / MCP → FOTON Prime
      </button>
    </div>
  );
}
