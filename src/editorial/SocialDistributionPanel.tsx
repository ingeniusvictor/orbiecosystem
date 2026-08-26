import type { SocialDistributionQueueView } from '../../domain/editorial';
import {
  MANUAL_PUBLICATION_LABELS,
  SOCIAL_EMAIL_LABELS,
  SOCIAL_READINESS_LABELS,
} from './presentation';

function StateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-100">{value}</div>
    </div>
  );
}

export default function SocialDistributionPanel({ social }: { social: SocialDistributionQueueView | null | undefined }) {
  if (!social) {
    return (
      <section className="mt-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4" aria-label="Distribución social">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Distribución social</h3>
          <span className="text-[11px] text-slate-600">Sin paquete social preparado</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">La UI no inventa estado social. El servidor debe entregar un view-model validado antes de mostrar readiness o publicaciones.</p>
      </section>
    );
  }

  return (
    <section className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4" aria-label="Distribución social">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Distribución social</h3>
          <p className="mt-1 text-xs text-slate-500">Visualización controlada; el servidor mantiene la autoridad.</p>
        </div>
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
          {SOCIAL_READINESS_LABELS[social.readiness]}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StateChip label="Social Score" value={String(social.socialScore)} />
        <StateChip label="Caracteres" value={String(social.characterCount)} />
        <StateChip label="Email" value={social.mailerStatus ? SOCIAL_EMAIL_LABELS[social.mailerStatus] : 'Sin mailer'} />
        <StateChip label="Facebook" value={social.facebookStatus ? MANUAL_PUBLICATION_LABELS[social.facebookStatus] : 'Sin tracker'} />
        <StateChip label="Instagram" value={social.instagramStatus ? MANUAL_PUBLICATION_LABELS[social.instagramStatus] : 'Sin tracker'} />
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Copy final</div>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/60 p-3 font-sans text-sm leading-6 text-slate-200">{social.copy}</pre>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Hashtags sociales">
            {social.hashtags.map((tag) => <span key={tag} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">{tag}</span>)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Visual 16:9</div>
          {social.imageUrl ? (
            <img src={social.imageUrl} alt="Visual social aprobado" className="mt-2 aspect-video w-full rounded-xl border border-slate-800 object-cover" />
          ) : (
            <div className="mt-2 flex aspect-video items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-3 text-center text-xs text-slate-500">Visual no disponible</div>
          )}
        </div>
      </div>
    </section>
  );
}
