import { Download } from 'lucide-react';
import { AppView } from '../types/feud';

interface TopBarProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  onExportPptx: () => void;
  isExporting: boolean;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'editor', label: 'Deck Editor' },
  { id: 'preview', label: 'Slide Preview' },
  { id: 'packs', label: 'Starter Packs' },
  { id: 'stage', label: 'Live Stage' },
];

export function TopBar({
  activeView,
  onChangeView,
  onExportPptx,
  isExporting,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/90 bg-[#0B1120]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-8 px-6">
        <button
          type="button"
          onClick={() => onChangeView('editor')}
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded"
        >
          FeudDeck Studio
        </button>

        <nav
          aria-label="Primary"
          className="flex items-center gap-6 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeView(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-amber-400"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onExportPptx}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{isExporting ? 'Generating...' : 'Export .pptx'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
