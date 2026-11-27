import { Plus, Replace } from 'lucide-react';
import { STARTER_PACKS } from '../data/starterPacks';
import { BROADCAST_THEMES } from '../data/themes';
import { StarterPack } from '../types/feud';

interface StarterPacksProps {
  onLoadPack: (pack: StarterPack) => void;
  onAppendPack: (pack: StarterPack) => void;
}

export function StarterPacks({ onLoadPack, onAppendPack }: StarterPacksProps) {
  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-50 text-balance">
          Ready-to-Play Family Feud Packs
        </h1>
        <p className="mt-2 text-base text-slate-400">
          Start with a curated survey set and customize any question, answer, or point value before exporting to PowerPoint.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {STARTER_PACKS.map((pack) => {
          const theme = BROADCAST_THEMES[pack.recommendedTheme];
          return (
            <section
              key={pack.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-[#131C31] p-6"
            >
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-amber-400">
                    {pack.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{pack.rounds.length} Rounds</span>
                    <span aria-hidden="true">·</span>
                    <span>Fast Money</span>
                  </div>
                </div>

                <h2 className="mt-2 font-display text-xl font-bold text-slate-50">
                  {pack.title}
                </h2>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">
                  {pack.subtitle}
                </p>

                <div className="mt-5 border-t border-slate-800/80 pt-4">
                  <p className="text-xs font-medium text-slate-400">
                    Sample survey questions
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {pack.rounds.slice(0, 3).map((round, idx) => (
                      <li
                        key={round.title}
                        className="flex items-baseline gap-2.5 text-sm text-slate-200"
                      >
                        <span className="font-mono-num text-xs text-slate-500">
                          0{idx + 1}
                        </span>
                        <span className="line-clamp-1">{round.question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span
                    className="h-3.5 w-3.5 rounded-sm border border-white/20"
                    style={{ backgroundColor: theme.bgHex }}
                    aria-hidden="true"
                  />
                  <span>{theme.name}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onAppendPack(pack)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white whitespace-nowrap shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Add Rounds</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadPack(pack)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-amber-400 whitespace-nowrap shrink-0"
                  >
                    <Replace className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Load Pack</span>
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
