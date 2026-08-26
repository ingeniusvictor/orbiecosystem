import { useEffect, useMemo, useState } from 'react';
import { ContentCategory } from '../../domain/common/enums';
import Footer from '../components/Footer';
import {
  buildNewsArticleSeoMetadata,
  getSeoRouteMetadata,
  type SeoRouteMetadata,
} from '../seoMetadata';
import { getCategoryAriaCurrent, getNewsRetryPath } from './accessibility';
import { selectBreakingNewsCard } from './presentation';
import { publicNewsRepository } from './repository';
import { buildNewsArticlePath, buildNewsCategoryPath, type PublicNewsRoute } from './routes';
import type { PublicNewsArticle, PublicNewsFeed } from './types';

interface NewsPortalProps {
  readonly route: PublicNewsRoute;
  readonly onMetadataChange?: (metadata: SeoRouteMetadata) => void;
}

const emptyFeed: PublicNewsFeed = { items: [], breaking: null };

const navigate = (href: string) => {
  window.location.assign(href);
};

const categoryLabel = (category: ContentCategory): string =>
  category.replaceAll('_', ' ');

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

function NewsHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a href="/news" className={`text-left ${focusRing}`} aria-label="Ir a la portada de ORBI News">
          <div className="text-xs font-semibold tracking-[0.28em] text-purple-300">ORBI ECOSYSTEM</div>
          <div className="text-xl font-black tracking-tight text-white">ORBI NEWS</div>
        </a>
        <a
          href="/"
          className={`rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-purple-400/60 hover:text-white ${focusRing}`}
        >
          Volver al ecosistema
        </a>
      </div>
    </header>
  );
}

function CategoryNav({ active }: { readonly active: ContentCategory | null }) {
  return (
    <nav aria-label="Categorías ORBI News" className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 lg:px-8">
        <a
          href="/news"
          aria-current={getCategoryAriaCurrent(active, null)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${focusRing} ${active === null ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          Últimas
        </a>
        {Object.values(ContentCategory).map((category) => (
          <a
            key={category}
            href={buildNewsCategoryPath(category)}
            aria-current={getCategoryAriaCurrent(active, category)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${focusRing} ${active === category ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {categoryLabel(category)}
          </a>
        ))}
      </div>
    </nav>
  );
}

function BreakingBanner({ item }: { readonly item: NonNullable<PublicNewsFeed['breaking']> }) {
  return (
    <aside aria-label="Breaking ORBI News" className="border-b border-red-400/20 bg-red-950/30">
      <a
        href={buildNewsArticlePath(item.slug)}
        className={`mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-4 text-left sm:flex-row sm:items-center sm:gap-4 lg:px-8 ${focusRing}`}
      >
        <span className="w-fit rounded-full border border-red-400/40 bg-red-400/10 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-red-300">
          Breaking
        </span>
        <span className="text-sm font-bold leading-6 text-white">{item.headline}</span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-red-200/70 sm:ml-auto">
          {categoryLabel(item.category)}
        </span>
      </a>
    </aside>
  );
}

function EmptyState({ category }: { readonly category: ContentCategory | null }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
      <p className="text-xs font-semibold tracking-[0.25em] text-purple-300">PUBLICACIÓN CONTROLADA</p>
      <h2 className="mt-4 text-2xl font-bold text-white">Aún no hay noticias publicadas{category ? ` en ${categoryLabel(category)}` : ''}.</h2>
      <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        ORBI News mostrará aquí únicamente historias que hayan superado verificación, resolución de evento, scoring editorial y validación visual.
      </p>
    </div>
  );
}

function FeedErrorState({ category }: { readonly category: ContentCategory | null }) {
  return (
    <div role="alert" className="rounded-3xl border border-amber-300/20 bg-amber-300/[0.04] px-6 py-12 text-center">
      <h2 className="text-xl font-bold text-white">No pudimos cargar ORBI News.</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
        El contenido publicado sigue protegido. Puedes volver a intentarlo sin perder tu ubicación.
      </p>
      <a
        href={getNewsRetryPath(category)}
        className={`mt-6 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-slate-100 transition hover:border-purple-400/60 hover:text-white ${focusRing}`}
      >
        Reintentar
      </a>
    </div>
  );
}

function NewsCard({ item }: { readonly item: PublicNewsFeed['items'][number] }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <a href={buildNewsArticlePath(item.slug)} className={`block h-full w-full text-left ${focusRing}`}>
        <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.imageAlt}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            <span>{categoryLabel(item.category)}</span>
            {item.isBreaking ? <span className="rounded-full border border-red-400/40 px-2 py-0.5 text-red-300">Breaking</span> : null}
          </div>
          <h2 className="mt-3 text-xl font-bold leading-tight text-white">{item.headline}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{item.dek}</p>
        </div>
      </a>
    </article>
  );
}

function FeedView({ route }: { readonly route: Extract<PublicNewsRoute, { kind: 'INDEX' | 'CATEGORY' }> }) {
  const [feed, setFeed] = useState<PublicNewsFeed>(emptyFeed);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const category = route.kind === 'CATEGORY' ? route.category : null;
  const breaking = selectBreakingNewsCard(feed);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    const request = category
      ? publicNewsRepository.listByCategory(category)
      : publicNewsRepository.listLatest();

    request
      .then((nextFeed) => {
        if (!active) return;
        setFeed(nextFeed);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setFeed(emptyFeed);
        setLoadError(true);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category]);

  return (
    <>
      <CategoryNav active={category} />
      {breaking ? <BreakingBanner item={breaking} /> : null}
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14" aria-busy={loading}>
        <div className="mb-10 max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.28em] text-purple-300">INTELIGENCIA EDITORIAL VERIFICADA</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            {category ? categoryLabel(category) : 'Últimas en ORBI News'}
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-400">
            Tecnología, IA, energía, automatización y futuro explicados con foco en hechos verificados y utilidad práctica.
          </p>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="py-16 text-center text-sm text-slate-400">
            Cargando ORBI News…
          </div>
        ) : loadError ? (
          <FeedErrorState category={category} />
        ) : feed.items.length === 0 ? (
          <EmptyState category={category} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {feed.items.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </>
  );
}

function ArticleView({
  slug,
  onMetadataChange,
}: {
  readonly slug: string;
  readonly onMetadataChange?: (metadata: SeoRouteMetadata) => void;
}) {
  const [article, setArticle] = useState<PublicNewsArticle | null | undefined>(undefined);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    setArticle(undefined);
    setLoadError(false);
    onMetadataChange?.(getSeoRouteMetadata('news'));

    publicNewsRepository
      .findBySlug(slug)
      .then((result) => {
        if (!active) return;
        setArticle(result);
        onMetadataChange?.(result ? buildNewsArticleSeoMetadata(result) : getSeoRouteMetadata('news'));
      })
      .catch(() => {
        if (!active) return;
        setArticle(null);
        setLoadError(true);
        onMetadataChange?.(getSeoRouteMetadata('news'));
      });

    return () => {
      active = false;
    };
  }, [onMetadataChange, slug]);

  if (article === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center" aria-busy="true">
        <div role="status" aria-live="polite" className="text-slate-400">Cargando artículo…</div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <div role="alert">
          <p className="text-xs font-semibold tracking-[0.24em] text-purple-300">ORBI NEWS</p>
          <h1 className="mt-4 text-3xl font-black text-white">No pudimos cargar este artículo</h1>
          <p className="mt-3 text-slate-400">La publicación no fue modificada ni sustituida por contenido parcial.</p>
          <a href={buildNewsArticlePath(slug)} className={`mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 ${focusRing}`}>
            Reintentar
          </a>
        </div>
      </main>
    );
  }

  if (article === null) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-xs font-semibold tracking-[0.24em] text-purple-300">ORBI NEWS</p>
        <h1 className="mt-4 text-3xl font-black text-white">Artículo no disponible</h1>
        <p className="mt-3 text-slate-400">La historia no existe o todavía no está publicada.</p>
        <a href="/news" className={`mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 ${focusRing}`}>
          Ir a ORBI News
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 lg:py-16">
      <article>
        <a
          href={buildNewsCategoryPath(article.category)}
          className={`text-xs font-semibold uppercase tracking-[0.2em] text-purple-300 ${focusRing}`}
        >
          {categoryLabel(article.category)}
        </a>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">{article.headline}</h1>
        <p className="mt-5 text-lg leading-8 text-slate-400">{article.dek}</p>
        <div className="mt-8 aspect-video overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.imageAlt}
              className="h-full w-full object-cover"
              decoding="async"
            />
          ) : null}
        </div>
        <div className="mt-10 space-y-10">
          {article.sections.map((section) => (
            <section key={section.key}>
              <h2 className="text-2xl font-bold text-white">{section.heading}</h2>
              <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
        <aside className="mt-12 border-t border-white/10 pt-8" aria-labelledby="verified-sources-title">
          <h2 id="verified-sources-title" className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Fuentes verificadas</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {article.sources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-purple-400/50 hover:text-white ${focusRing}`}
              >
                {source.label}{source.isPrimary ? ' · primaria' : ''}
                <span className="sr-only"> (abre en una pestaña nueva)</span>
              </a>
            ))}
          </div>
        </aside>
      </article>
    </main>
  );
}

export default function NewsPortal({ route, onMetadataChange }: NewsPortalProps) {
  const content = useMemo(() => {
    if (route.kind === 'INDEX' || route.kind === 'CATEGORY') return <FeedView route={route} />;
    if (route.kind === 'ARTICLE') return <ArticleView slug={route.slug} onMetadataChange={onMetadataChange} />;
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black text-white">Ruta de noticias no encontrada</h1>
        <a href="/news" className={`mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950 ${focusRing}`}>Ir a ORBI News</a>
      </main>
    );
  }, [onMetadataChange, route]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <a
        href="#orbi-news-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950"
      >
        Saltar al contenido principal
      </a>
      <NewsHeader />
      <div id="orbi-news-main">{content}</div>
      <Footer onNavigate={() => navigate('/')} />
    </div>
  );
}
