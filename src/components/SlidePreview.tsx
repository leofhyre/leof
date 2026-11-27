import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FeudDeck } from '../types/feud';
import { buildSlidePreviewList } from '../utils/pptxGenerator';
import { SlideCanvas } from './SlideCanvas';

interface SlidePreviewProps {
  deck: FeudDeck;
  onExportPptx: () => void;
  isExporting: boolean;
}

export function SlidePreview({
  deck,
  onExportPptx,
  isExporting,
}: SlidePreviewProps) {
  const slides = buildSlidePreviewList(deck);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= slides.length) {
      setActiveIndex(Math.max(0, slides.length - 1));
    }
  }, [slides.length, activeIndex]);

  const activeSlide = slides[activeIndex] ?? slides[0];

  if (!activeSlide) return null;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_1fr]">
        {/* Slide Thumbnail Rail */}
        <aside className="rounded-xl border border-slate-800 bg-[#131C31] p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-display text-sm font-bold text-slate-100">
              PowerPoint Deck
            </h2>
            <span className="font-mono-num text-xs text-slate-400">
              {slides.length} slides
            </span>
          </div>

          <div className="mt-3 max-h-[640px] space-y-2.5 overflow-y-auto pr-1">
            {slides.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`w-full rounded-lg border p-2 text-left transition-colors ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-800 bg-[#0B1120] hover:border-slate-700'
                  }`}
                >
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono-num font-bold text-amber-400">
                      {String(slide.slideNumber).padStart(2, '0')}
                    </span>
                    <span className="truncate text-slate-300 font-medium flex-1">
                      {slide.label}
                    </span>
                  </div>
                  <div className="pointer-events-none overflow-hidden rounded border border-slate-800">
                    <SlideCanvas slide={slide} deck={deck} compact />
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main 16:9 Slide Stage + Speaker Notes */}
        <main className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#131C31] px-5 py-3.5">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="font-mono-num font-bold text-amber-400">
                Slide {activeSlide.slideNumber} / {slides.length}
              </span>
              <span className="text-slate-600" aria-hidden="true">
                ·
              </span>
              <span className="font-medium text-slate-200">
                {activeSlide.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((i) => Math.min(slides.length - 1, i + 1))
                }
                disabled={activeIndex === slides.length - 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onExportPptx}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isExporting ? 'Generating...' : 'Download .pptx'}</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#070B14] p-4 sm:p-6">
            <SlideCanvas slide={activeSlide} deck={deck} />
          </div>

          {/* Embedded Speaker Notes Preview */}
          <section className="rounded-xl border border-slate-800 bg-[#131C31] p-5">
            <h3 className="font-display text-sm font-bold text-slate-100">
              PowerPoint Speaker Notes (Host View)
            </h3>
            <pre className="mt-2.5 whitespace-pre-wrap font-mono-num text-xs leading-relaxed text-slate-300">
              {activeSlide.notes}
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
}
