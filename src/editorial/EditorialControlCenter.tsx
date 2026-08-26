import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  EditorialControlAction,
  EditorialQueueBucket,
  type EditorialQueueItem,
} from '../../domain/editorial';
import {
  EditorialRepositoryError,
  editorialControlCenterRepository,
  type EditorialControlCenterRepository,
  type EditorialSessionState,
} from './repository';
import {
  EDITORIAL_BUCKET_LABELS,
  buildEditorialActionConfirmation,
  formatEditorialReason,
  getEditorialActionDisplayState,
} from './presentation';
import SocialDistributionPanel from './SocialDistributionPanel';

const ALL_BUCKETS = 'ALL' as const;
type BucketFilter = typeof ALL_BUCKETS | EditorialQueueBucket;

const bucketOptions: readonly BucketFilter[] = [
  ALL_BUCKETS,
  EditorialQueueBucket.NEEDS_REVIEW,
  EditorialQueueBucket.BLOCKED,
  EditorialQueueBucket.FAILED,
  EditorialQueueBucket.APPROVED,
  EditorialQueueBucket.SCHEDULED,
  EditorialQueueBucket.PUBLISHING,
  EditorialQueueBucket.DRAFTING,
  EditorialQueueBucket.PUBLISHED,
];

const getErrorCopy = (error: unknown): { title: string; detail: string } => {
  if (error instanceof EditorialRepositoryError) {
    if (error.code === 'EDITORIAL_SESSION_ACCESS_DENIED') return { title: 'Acceso editorial rechazado', detail: 'La clave de acceso no es válida. No se creó ninguna sesión.' };
    if (error.code === 'EDITORIAL_SESSION_NOT_CONFIGURED') return { title: 'Login editorial no configurado', detail: 'El servidor privado está disponible, pero el bootstrap de sesión todavía no está configurado por entorno.' };
    if (error.code === 'EDITORIAL_CSRF_TOKEN_UNAVAILABLE' || error.code === 'EDITORIAL_CSRF_REQUIRED') return { title: 'Protección de sesión no disponible', detail: 'Falta el token CSRF de la sesión. Vuelve a autenticarte antes de ejecutar una acción mutable.' };
    if (error.status === 401) return { title: 'Autenticación requerida', detail: 'La sesión editorial no es válida o expiró.' };
    if (error.status === 403) return { title: 'Acción no autorizada', detail: error.reasons.length ? error.reasons.map(formatEditorialReason).join(' · ') : 'La identidad o el estado actual no permiten esta operación.' };
    if (error.status === 409) return { title: 'La historia cambió', detail: 'El estado o la revisión cambió desde que cargaste la cola. La vista será actualizada antes de intentar nuevamente.' };
    if (error.status === 503) return { title: 'Servicio editorial no configurado', detail: 'Una dependencia privada necesaria todavía no está disponible. No se realizó ningún cambio.' };
  }
  return { title: 'No pudimos completar la operación', detail: 'El servidor editorial no respondió con un estado válido. No se asumirá ningún cambio.' };
};

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2"><dt className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-100">{value}</dd></div>;
}

function QueueCard({ item, busyAction, onAction }: { item: EditorialQueueItem; busyAction: EditorialControlAction | null; onAction: (item: EditorialQueueItem, action: EditorialControlAction) => void }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-black/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-medium text-cyan-200">{EDITORIAL_BUCKET_LABELS[item.bucket]}</span>
            <span className="text-slate-500">{item.category.replaceAll('_', ' ')}</span>
            {item.requiresHumanAttention ? <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200">Atención humana</span> : null}
          </div>
          <h2 className="mt-3 text-xl font-semibold text-white">{item.headline}</h2>
          <p className="mt-1 text-xs text-slate-500">/{item.slug} · rev {item.revision}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[430px]">
          <Metric label="ORBI Score" value={item.orbiScore} />
          <Metric label="Riesgo" value={item.riskLevel} />
          <Metric label="Verificación" value={item.verificationConfidence} />
          <Metric label="Actualizado" value={new Date(item.updatedAt).toLocaleString('es-CL')} />
        </dl>
      </div>

      {item.attentionReasons.length > 0 ? (
        <section className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4" aria-labelledby={`attention-${item.storyId}`}>
          <h3 id={`attention-${item.storyId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Razones de atención</h3>
          <ul className="mt-2 space-y-1 text-sm text-amber-100/80">{item.attentionReasons.map((reason) => <li key={reason}>• {formatEditorialReason(reason)}</li>)}</ul>
        </section>
      ) : null}

      <SocialDistributionPanel social={item.socialDistribution} />

      <section className="mt-5" aria-labelledby={`actions-${item.storyId}`}>
        <div className="flex items-center justify-between gap-3"><h3 id={`actions-${item.storyId}`} className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Acciones editoriales</h3><span className="text-[11px] text-slate-600">Servidor revalida antes de cada mutación</span></div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {item.actionAssessments.map((assessment) => {
            const display = getEditorialActionDisplayState(assessment);
            const busy = busyAction === assessment.action;
            return (
              <button key={assessment.action} type="button" disabled={!display.domainAllowed || busyAction !== null} onClick={() => onAction(item, assessment.action)} title={display.disabledReason ? formatEditorialReason(display.disabledReason) : undefined} className={`rounded-xl border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${display.domainAllowed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-50' : 'border-slate-800 bg-slate-950/50 text-slate-500 disabled:opacity-70'} ${display.requiresStrongConfirmation ? 'ring-1 ring-amber-500/20' : ''}`}>
                <span className="block font-medium">{display.label}</span>
                <span className="mt-1 block text-[11px] opacity-70">{busy ? 'Procesando…' : display.domainAllowed ? (display.requiresStrongConfirmation ? 'Confirmación reforzada requerida' : 'Disponible · sujeto a revalidación servidor') : 'Bloqueada por política'}</span>
              </button>
            );
          })}
        </div>
      </section>
    </article>
  );
}

function EditorialLogin({ accessKey, busy, error, onAccessKeyChange, onSubmit }: { accessKey: string; busy: boolean; error: unknown; onAccessKeyChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const errorCopy = error ? getErrorCopy(error) : null;
  return (
    <section className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20" aria-labelledby="editorial-login-title">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Acceso privado</p>
      <h2 id="editorial-login-title" className="mt-2 text-xl font-semibold text-white">Iniciar sesión editorial</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">La clave se envía directamente al servidor para crear una cookie de sesión HttpOnly. No se guarda en el navegador ni se convierte en un bearer token accesible por JavaScript.</p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm text-slate-300"><span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-slate-500">Clave de acceso editorial</span><input type="password" value={accessKey} onChange={(event) => onAccessKeyChange(event.target.value)} autoComplete="current-password" required disabled={busy} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus-visible:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-400/20" /></label>
        <button type="submit" disabled={busy || !accessKey.trim()} className="w-full rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Autenticando…' : 'Entrar al Control Center'}</button>
      </form>
      {errorCopy ? <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4" role="alert"><h3 className="font-semibold text-amber-100">{errorCopy.title}</h3><p className="mt-1 text-sm text-amber-100/70">{errorCopy.detail}</p></div> : null}
    </section>
  );
}

export default function EditorialControlCenter({ repository = editorialControlCenterRepository }: { repository?: EditorialControlCenterRepository }) {
  const [session, setSession] = useState<EditorialSessionState | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [accessKey, setAccessKey] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<unknown>(null);
  const [bucket, setBucket] = useState<BucketFilter>(ALL_BUCKETS);
  const [items, setItems] = useState<readonly EditorialQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [requestVersion, setRequestVersion] = useState(0);
  const [busy, setBusy] = useState<{ storyId: string; action: EditorialControlAction } | null>(null);

  useEffect(() => {
    let active = true;
    repository.getSession().then((nextSession) => { if (active) setSession(nextSession); }).catch((nextError) => { if (active) setAuthError(nextError); }).finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, [repository]);

  useEffect(() => {
    if (!session) { setItems([]); setLoading(false); return; }
    let active = true;
    setLoading(true); setError(null);
    repository.listQueue(bucket === ALL_BUCKETS ? null : bucket)
      .then((nextItems) => { if (active) setItems(nextItems); })
      .catch((nextError) => { if (!active) return; setItems([]); setError(nextError); if (nextError instanceof EditorialRepositoryError && nextError.status === 401) setSession(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bucket, repository, requestVersion, session]);

  const errorCopy = useMemo(() => (error ? getErrorCopy(error) : null), [error]);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true); setAuthError(null);
    try { const nextSession = await repository.login(accessKey); setAccessKey(''); setSession(nextSession); setNotice(`Sesión iniciada como ${nextSession.actor.role}.`); setRequestVersion((value) => value + 1); }
    catch (nextError) { setAuthError(nextError); }
    finally { setAuthBusy(false); }
  };

  const logout = async () => {
    setAuthBusy(true); setError(null); setNotice(null);
    try { await repository.logout(); setSession(null); setItems([]); setAccessKey(''); }
    catch (nextError) { setError(nextError); }
    finally { setAuthBusy(false); }
  };

  const execute = async (item: EditorialQueueItem, action: EditorialControlAction) => {
    const assessment = item.actionAssessments.find((candidate) => candidate.action === action);
    if (!assessment?.allowed || !window.confirm(buildEditorialActionConfirmation(action, item.headline))) return;
    setBusy({ storyId: item.storyId, action }); setError(null); setNotice(null);
    try {
      const result = await repository.executeAction({ storyId: item.storyId, action, expectedRevision: item.revision });
      setNotice(`${action.replaceAll('_', ' ')} completada. Nueva revisión: ${result.revision}.`); setRequestVersion((value) => value + 1);
    } catch (nextError) {
      setError(nextError);
      if (nextError instanceof EditorialRepositoryError) {
        if (nextError.status === 409) setRequestVersion((value) => value + 1);
        if (nextError.status === 401 || nextError.code === 'EDITORIAL_CSRF_REQUIRED' || nextError.code === 'EDITORIAL_CSRF_TOKEN_UNAVAILABLE') setSession(null);
      }
    } finally { setBusy(null); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <a href="#editorial-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-slate-950">Saltar al Control Center</a>
      <header className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div><p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">ORBI NEWS · PRIVATE</p><h1 className="mt-1 text-2xl font-semibold text-white">Editorial Control Center</h1><p className="mt-1 max-w-2xl text-sm text-slate-400">Acciones controladas por dominio, confirmadas por el operador y revalidadas siempre en servidor.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            {session ? <div className="mr-2 text-right text-xs text-slate-400"><div className="font-medium text-slate-200">{session.actor.role}</div><div>{session.actor.actorId} · {session.actor.organizationId}</div></div> : null}
            {session ? <button type="button" onClick={logout} disabled={authBusy} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-500/50 hover:text-white disabled:opacity-50">{authBusy ? 'Cerrando…' : 'Cerrar sesión'}</button> : null}
            <a href="/news" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:border-cyan-500/50 hover:text-white">Ver ORBI News público</a>
          </div>
        </div>
      </header>

      <main id="editorial-main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {sessionLoading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center" role="status" aria-live="polite" aria-busy="true">Verificando sesión editorial…</div> : !session ? (
          <EditorialLogin accessKey={accessKey} busy={authBusy} error={authError} onAccessKeyChange={setAccessKey} onSubmit={login} />
        ) : (
          <section aria-labelledby="queue-heading">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div><h2 id="queue-heading" className="text-lg font-semibold text-white">Cola editorial</h2><p className="mt-1 text-sm text-slate-500">Bloqueos y revisiones aparecen antes que historias publicadas.</p></div>
              <label className="text-sm text-slate-300"><span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-500">Estado operacional</span><select value={bucket} onChange={(event) => setBucket(event.target.value as BucketFilter)} className="min-w-56 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">{bucketOptions.map((option) => <option key={option} value={option}>{option === ALL_BUCKETS ? 'Todos' : EDITORIAL_BUCKET_LABELS[option]}</option>)}</select></label>
            </div>
            {notice ? <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-100" role="status" aria-live="polite">{notice}</div> : null}
            {errorCopy ? <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4" role="alert"><h3 className="font-semibold text-amber-100">{errorCopy.title}</h3><p className="mt-1 text-sm text-amber-100/70">{errorCopy.detail}</p></div> : null}
            {loading ? <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center" role="status" aria-live="polite" aria-busy="true">Cargando cola editorial…</div> : items.length === 0 ? <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400" role="status">No hay historias en este estado editorial.</div> : <div className="mt-8 space-y-4">{items.map((item) => <QueueCard key={item.storyId} item={item} busyAction={busy?.storyId === item.storyId ? busy.action : null} onAction={execute} />)}</div>}
          </section>
        )}
      </main>
    </div>
  );
}
