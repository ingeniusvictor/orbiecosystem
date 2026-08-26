import { useEffect, useState } from 'react';
import { selectHomeLatestNews } from './home-presentation';
import { publicNewsRepository } from './repository';
import { buildNewsArticlePath } from './routes';
import type { PublicNewsCard } from './types';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950';

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
          <a
            href="/news"
            className={`w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm font-bold text-slate-100 transition hover:border-purple-400/60 hover:text-white ${focusRing}`}
          >
            Ver todas las noticias
          </a>
        </div>

        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
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
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-purple-300">
                    <span>{item.category.replaceAll('_', ' ')}</span>
                    {item.isBreaking ? <span className="text-red-300">· Breaking</span> : null}
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-snug text-white">{item.headline}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.dek}</p>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
