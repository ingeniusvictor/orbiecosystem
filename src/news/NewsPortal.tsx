import { useEffect, useMemo, useState } from 'react';
import { ContentCategory } from '../../domain/common/enums';
import Footer from '../components/Footer';
import { buildNewsArticlePath, buildNewsCategoryPath, type PublicNewsRoute } from './routes';
import { publicNewsRepository } from './repository';
import type { PublicNewsArticle, PublicNewsFeed } from './types';

interface NewsPortalProps {
  readonly route: PublicNewsRoute;
}

const emptyFeed: PublicNewsFeed = { items: [], breaking: null };

const navigate = (href: string) => {
  window.location.assign(href);
};

const categoryLabel = (category: ContentCategory): string =>
  category.replaceAll('_', ' ');

function NewsHeader() {
  return (
    <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <button type="button" onClick={() => navigate('/news')} className="text-left">
          <div className="text-xs font-semibold tracking-[0.28em] text-purple-300">ORBI ECOSYSTEM</div>
          <div className="text-xl font-black tracking-tight text-white">ORBI NEWS</div>
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-purple-400/60 hover:text-white"
        >
          Volver al ecosistema
        </button>
      </div>
    </header>
  );
}

function CategoryNav({ active }: { readonly active: ContentCategory | null }) {
  return (
    <nav aria-label="Categorías ORBI News" className="border-b border-white/10 bg-slate-950">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-5 py-3 lg:px-8">
        <button
          type="button"
          onClick={() => navigate('/news')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${active === null ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
        >
          Últimas
        </button>
        {Object.values(ContentCategory).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => navigate(buildNewsCategoryPath(category))}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${active === category ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}
          >
            {categoryLabel(category)}
          </button>
        ))}
      </div>
    </nav>
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

function NewsCard({ item }: { readonly item: PublicNewsFeed['items'][number] }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <button type="button" onClick={() => navigate(buildNewsArticlePath(item.slug))} className="block w-full text-left">
        <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950">
          {item.imageUrl ? <img src={item.imageUrl} alt={item.imageAlt} className="h-full w-full object-cover" /> : null}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-purple-300">
            <span>{categoryLabel(item.category)}</span>
            {item.isBreaking ? <span className="rounded-full border border-red-400/40 px-2 py-0.5 text-red-300">Breaking</span> : null}
          </div>
          <h2 className="mt-3 text-xl font-bold leading-tight text-white">{item.headline}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{item.dek}</p>
        </div>
      </button>
    </article>
  );
}

function FeedView({ route }: { readonly route: Extract<PublicNewsRoute, { kind: 'INDEX' | 'CATEGORY' }> }) {
  const [feed, setFeed] = useState<PublicNewsFeed>(emptyFeed);
  const [loading, setLoading] = useState(true);
  const category = route.kind === 'CATEGORY' ? route.category : null;

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = category
      ? publicNewsRepository.listByCategory(category)
      : publicNewsRepository.listLatest();
    request.then((nextFeed) => {
      if (!active) return;
      setFeed(nextFeed);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [category]);

  return (
    <>
      <CategoryNav active={category} />
      <main className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
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
          <div className="py-16 text-center text-sm text-slate-400">Cargando ORBI News…</div>
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

function ArticleView({ slug }: { readonly slug: string }) {
  const [article, setArticle] = useState<PublicNewsArticle | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    publicNewsRepository.findBySlug(slug).then((result) => {
      if (active) setArticle(result);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (article === undefined) {
    return <main className="mx-auto max-w-4xl px-5 py-20 text-center text-slate-400">Cargando artículo…</main>;
  }

  if (article === null) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <p className="text-xs font-semibold tracking-[0.24em] text-purple-300">ORBI NEWS</p>
        <h1 className="mt-4 text-3xl font-black text-white">Artículo no disponible</h1>
        <p className="mt-3 text-slate-400">La historia no existe o todavía no está publicada.</p>
        <button type="button" onClick={() => navigate('/news')} className="mt-8 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950">
          Ir a ORBI News
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 lg:py-16">
      <button type="button" onClick={() => navigate(buildNewsCategoryPath(article.category))} className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-300">
        {categoryLabel(article.category)}
      </button>
      <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">{article.headline}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-400">{article.dek}</p>
      <div className="mt-8 aspect-video overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950">
        {article.imageUrl ? <img src={article.imageUrl} alt={article.imageAlt} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="mt-10 space-y-10">
        {article.sections.map((section) => (
          <section key={section.key}>
            <h2 className="text-2xl font-bold text-white">{section.heading}</h2>
            <p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-300">{section.body}</p>
          </section>
        ))}
      </div>
      <aside className="mt-12 border-t border-white/10 pt-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Fuentes verificadas</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {article.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-purple-400/50 hover:text-white">
              {source.label}{source.isPrimary ? ' · primaria' : ''}
            </a>
          ))}
        </div>
      </aside>
    </main>
  );
}

export default function NewsPortal({ route }: NewsPortalProps) {
  const content = useMemo(() => {
    if (route.kind === 'INDEX' || route.kind === 'CATEGORY') return <FeedView route={route} />;
    if (route.kind === 'ARTICLE') return <ArticleView slug={route.slug} />;
    return (
      <main className="mx-auto max-w-4xl px-5 py-20 text-center">
        <h1 className="text-3xl font-black text-white">Ruta de noticias no encontrada</h1>
        <button type="button" onClick={() => navigate('/news')} className="mt-8 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-950">Ir a ORBI News</button>
      </main>
    );
  }, [route]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      <NewsHeader />
      {content}
      <Footer onNavigate={() => navigate('/')} />
    </div>
  );
}
