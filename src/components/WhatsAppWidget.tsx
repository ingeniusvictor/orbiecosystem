import { useEffect, useRef, useState } from "react";

const DEFAULT_MESSAGE =
  "Hola ORBI Ecosystem 👋. Vengo desde su sitio web y quisiera conocer más sobre sus proyectos y soluciones.";

const whatsappNumber = String(import.meta.env.VITE_ORBI_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`
    : null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !isOpen) return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (!isOpen || !widgetRef.current || widgetRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <aside
      ref={widgetRef}
      aria-label="Contacto por WhatsApp"
      className="fixed bottom-4 right-4 z-[70] grid justify-items-end gap-3 sm:bottom-6 sm:right-6"
    >
      {isOpen && (
        <section
          id="whatsapp-contact-panel"
          className="relative w-[min(360px,calc(100vw-32px))] rounded-2xl border border-emerald-300/30 bg-slate-950/95 p-5 text-slate-100 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-6"
          aria-live="polite"
        >
          <button
            type="button"
            aria-label="Cerrar contacto por WhatsApp"
            onClick={() => {
              setIsOpen(false);
              triggerRef.current?.focus();
            }}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-lg border border-slate-700 bg-transparent text-xl text-slate-400 transition hover:border-emerald-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            ×
          </button>

          <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-emerald-300">
            ORBI / CONTACTO
          </p>
          <h2 className="mb-2 pr-10 text-xl font-bold tracking-tight">¿Tienes una consulta?</h2>
          <p className="mb-5 text-sm leading-6 text-slate-300">
            Conversemos directamente por WhatsApp sobre ORBI Ecosystem, nuestros proyectos o soluciones.
          </p>

          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-between rounded-xl border border-[#25d366] bg-[#25d366] px-4 py-3 text-sm font-extrabold text-[#06150b] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <span>Abrir WhatsApp</span>
              <span aria-hidden="true">↗</span>
            </a>
          ) : (
            <div
              role="status"
              className="flex min-h-12 items-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-400"
            >
              WhatsApp en configuración
            </div>
          )}

          <small className="mt-3 block font-mono text-[10px] tracking-wide text-slate-500">
            Responderemos manualmente. No es un chatbot.
          </small>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="whatsapp-contact-panel"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex min-h-[58px] items-center gap-2.5 rounded-full border border-emerald-400/60 bg-slate-950/95 p-2 text-slate-100 shadow-xl shadow-black/30 transition hover:-translate-y-0.5 hover:border-[#25d366] hover:shadow-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:pr-4 motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#25d366]" aria-hidden="true">
          <svg viewBox="0 0 32 32" className="h-6 w-6 fill-[#06150b]" focusable="false">
            <path d="M16 3.2A12.5 12.5 0 0 0 5.3 22.1L3.7 28.8l6.9-1.8A12.5 12.5 0 1 0 16 3.2Zm0 22.8c-1.9 0-3.7-.5-5.3-1.4l-.4-.2-4.1 1.1 1.1-4-.3-.4A10.2 10.2 0 1 1 16 26Zm5.7-7.7c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-1.8-.9-3-1.6-4.2-3.7-.3-.5.3-.5.9-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 3s1.3 3.5 1.5 3.8c.2.2 2.5 3.9 6.2 5.3 2.3 1 3.2 1.1 4.3.9.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4Z" />
          </svg>
        </span>
        <span className="hidden font-mono text-[11px] font-bold uppercase tracking-[0.08em] sm:inline">
          WhatsApp
        </span>
      </button>
    </aside>
  );
}
