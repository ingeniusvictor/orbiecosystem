import { useEffect, useState } from 'react';
import type { PublicNewsCard } from './types';
import { publicNewsRepository } from './repository';
import { buildNewsArticlePath } from './routes';
import { selectHomeLatestNews } from './home-presentation';

const navigate = (href: string) => window.location.assign(href);

export default function HomeLatestNews() {
  const [items, setItems] = useState<readonly PublicNewsCard[]>([]);

  useEffect(() => {
    let active = true;

    publicNewsRepository
      .listLatest()
      .then((feed) => {
        if (active) setItems(selectHomeLatestNews(feed));
      })
      .catch(() => {
        if (active) setItems([]);
      });

    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section id="orbi-news-latest" aria-labelledby="orbi-news-latest-title" className="relative border-y border-white/10 bg-slate-950/80 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.28em] text-purple-300">ORBI NEWS</p>
            <h2 id="orbi-news-latest-title" className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Últimas en ORBI News
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              Hechos verificados sobre inteligencia artificial, tecnología, energía, automatización, ciencia y futuro, explicados con utilidad práctica.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/news')}
            className="w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-slate-100 transition hover:border-purple-400/60 hover:text-white"
          >
            Ver todas las noticias
          </button>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              <button type="button" onClick={() => navigate(buildNewsArticlePath(item.slug))} className="block h-full w-full text-left">
                <div className="aspect-video bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.imageAlt} className="h-full w-full object-cover" loading="lazy" />
                  ) : null}
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-300">
                    <span>{item.category.replaceAll('_', ' ')}</span>
                    {item.isBreaking ? <span className="text-red-300">· Breaking</span> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-white">{item.headline}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.dek}</p>
                </div>
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
