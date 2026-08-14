import { ExternalLink, MonitorPlay, Presentation, Video } from "lucide-react";
import { competitionContent, type ClimateLocale } from "../../content/competition";

type CompetitionAssetKey = "video" | "pitchDeck" | "demo";

const assetLabels: Record<ClimateLocale, Record<CompetitionAssetKey, string>> = {
  es: {
    video: "Ver video de presentación",
    pitchDeck: "Ver pitch deck",
    demo: "Ver demostración",
  },
  en: {
    video: "Watch presentation video",
    pitchDeck: "View pitch deck",
    demo: "View demo",
  },
};

const assetIcons = {
  video: Video,
  pitchDeck: Presentation,
  demo: MonitorPlay,
};

function isApprovedAssetUrl(url: string | null): url is string {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getCompetitionAssetAvailability() {
  const assets = competitionContent.competitionAssets;

  return {
    video: assets.showVideo && isApprovedAssetUrl(assets.videoUrl),
    pitchDeck: assets.showPitchDeck && isApprovedAssetUrl(assets.pitchDeckUrl),
    demo: assets.showDemo && isApprovedAssetUrl(assets.demoUrl),
  };
}

export function CompetitionAssetLinks({ locale, className = "" }: { locale: ClimateLocale; className?: string }) {
  const assets = competitionContent.competitionAssets;
  const labels = assetLabels[locale];
  const links = [
    {
      key: "video" as const,
      href: assets.videoUrl,
      enabled: assets.showVideo,
    },
    {
      key: "pitchDeck" as const,
      href: assets.pitchDeckUrl,
      enabled: assets.showPitchDeck,
    },
    {
      key: "demo" as const,
      href: assets.demoUrl,
      enabled: assets.showDemo,
    },
  ].filter((asset) => asset.enabled && isApprovedAssetUrl(asset.href));

  if (links.length === 0) return null;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${className}`}>
      {links.map((asset) => {
        const Icon = assetIcons[asset.key];

        return (
          <a
            key={asset.key}
            href={asset.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-5 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-slate-200 transition hover:border-cyan-400/60 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 sm:w-auto sm:px-6"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {labels[asset.key]}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
